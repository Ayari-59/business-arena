import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { leviersFigesDuProfil, presetByLevel, profilDuNiveau, type DifficultyPreset } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig } from "@/engine/types";
import { commeEnBase, partieFigee, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { partieDeLaReference } from "@/pedagogy/merite/reference";
import { GRAINES_DU_MERITE, verdictDuMerite } from "@/pedagogy/merite/verdict";
import { proposedDecisionsFor } from "@/services/decision-baseline";

/**
 * LE GARDE-FOU D'UNE PARTIE À LA DEMANDE (`propositionALaDemande`, engine/types.ts) :
 * VALIDER SEUL LE FORMULAIRE NE MÈNE PAS À LA FAILLITE, ET N'EST PRESQUE JAMAIS « SOLIDE ».
 *
 * Il remplace, pour les parties créées avec le drapeau, la règle « à ±15 % de la
 * gestion neutre, à 20 000 € sous le bon gestionnaire » (`proposition-validee.test.ts`,
 * qui la garde pour les parties d'avant). Le formulaire qui planifie sur la demande
 * n'est plus neutre : il fait deux à cinq fois la gestion neutre dans les secteurs où
 * une règle de volume correcte suffit (rapport « mesure-volume »). Décision du
 * propriétaire : la proposition peut lire la demande, à condition que la valider sans
 * rien décider ne soit pas jugé « solide », et c'est le bon gestionnaire qui tient le
 * formulaire qui le garantit (`pedagogy/merite/reference.ts`).
 *
 * La mesure : une partie solo comme `createSoloGame` la crée (l'équipe et deux
 * concurrents, monde variable, trimestre, histoires d'investissement, concurrents
 * assainis, parc sans doublon, proposition à la demande, leviers figés du niveau, six
 * tours), l'équipe validant à chaque tour ce que le formulaire lui propose. Ses
 * décisions et celles du bon gestionnaire, prises sur le marché joué, sont rejouées
 * sur les trente marchés du mérite, et le verdict est celui du service
 * (`verdictDuMerite`). Les neuf entreprises jouées à chacun des six niveaux, soit les
 * quinze scénarios du registre.
 *
 *   (a) aucune défaillance sur le marché joué ;
 *   (b) « solide » dans au plus 1 % des parties mesurées.
 *
 * LES CAS RESTANTS CONNUS. Sur 24 graines par cellule (1 296 parties, rapport
 * « mesure-gestionnaire »), valider seul reste « solide » dans 11 parties, jamais plus
 * de 3 sur 24 dans une cellule, et seulement dans ces cellules : le bâtiment aux
 * niveaux 1, 5 et 6, MAILLE & CO en gamme aux niveaux 4, 5 et 6, le bistrot en gamme
 * au niveau 5. Les trois pistes essayées pour les effacer les déplaçaient ailleurs.
 * Une partie « solide » dans une AUTRE cellule fait échouer la garde.
 *
 * L'échantillon : les quatre premières graines des vingt-quatre de la mesure. C'est
 * 216 parties, quelques dizaines de secondes de calcul, et deux des cas connus y
 * tombent (le bâtiment au niveau 1, le bistrot en gamme au niveau 5).
 */

const GRAINES = [20260101, 4242, 7, 99];
const NIVEAUX = [1, 2, 3, 4, 5, 6] as const;
const PLAFOND = 0.01;
/** Les cellules où la mesure laisse des parties « solides » : `code:niveau` du scénario joué. */
const CAS_CONNUS = new Set(["batiment:1", "batiment:5", "batiment:6", "boutique:4", "boutique:5", "boutique:6", "bistrot-gamme:5"]);

interface Issue {
  cellule: string;
  graine: number;
  defaillante: boolean;
  solide: boolean;
  battues: number;
}

function validerSeul(secteur: string, niveau: number, graine: number): Issue {
  const code = scenarioCodeForLevel(secteur, niveau);
  const def = scenarioByCode(code);
  const preset = presetByLevel.get(niveau as DifficultyPreset["level"])!;
  const ouverts = preset.decisions;
  const leviers = leviersFigesDuProfil({ difficulty: profilDuNiveau(preset) });
  const equipes = [
    { id: "a-joueur", controller: "human" as const, botProfile: null },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
  ];
  const mondes = new Map<number, EngineScenarioConfig>();
  const scenarioPour = (g: number) => {
    if (!mondes.has(g)) {
      mondes.set(
        g,
        commeEnBase(
          composerLeScenarioJoue({
            scenario: def.scenario,
            seed: g,
            variableWorld: true,
            level: niveau,
            concurrents: equipes.length,
            periodicity: "quarter",
            investmentStories: true,
            concurrentsAssainis: true,
            parcSansDoublon: true,
            propositionALaDemande: true,
          }),
        ),
      );
    }
    return mondes.get(g)!;
  };
  const etats = equipes.map((t) =>
    applyPeriodicityToCompany(def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  const base: PartieARejouer = {
    graine,
    joueur: "a-joueur",
    equipes,
    etatsInitiaux: etats,
    tours: scenarioPour(graine).roundsCount,
    scenarioPour,
    decisions: [],
    reconduits: [],
    pedagogie: [],
    investissementPlafonne: investissementPlafonne(ouverts),
    leviers,
    leviersDuNiveau: ouverts,
  };
  const validee = partieFigee(base, (c) =>
    proposedDecisionsFor({
      snapshot: c.scenario,
      state: c.state,
      roundIndex: c.roundIndex,
      previousPayload: c.decisionPrecedente ?? null,
      lastMarket: c.resultatPrecedent?.market.bySegment ?? null,
      lastBreakEven: c.resultatPrecedent?.breakeven.breakEvenUnits ?? null,
      lastNetIncome: c.resultatPrecedent?.incomeStatement.netIncome ?? null,
      leviers,
    }),
  );
  const reference = partieDeLaReference(base, ouverts);
  const joue = rejouer(validee, graine);
  const verdict = verdictDuMerite({
    joue,
    joueur: GRAINES_DU_MERITE.map((g) => rejouer(validee, g)),
    reference: GRAINES_DU_MERITE.map((g) => rejouer(reference, g)),
    libelles: Array.from({ length: base.tours }, (_, i) => `Tour ${i + 1}`),
    niveau,
    niveauMax: 6,
    entreprise: secteur,
    entreprises: SCENARIO_CHOICES.map((s) => s.code),
  });
  return { cellule: `${code}:${niveau}`, graine, defaillante: joue.joueur.defaillant, solide: verdict.solides, battues: verdict.battues };
}

describe("une partie à la demande : valider seul le formulaire", () => {
  it(
    "aux six niveaux, dans les quinze scénarios : aucune défaillance, « solide » dans au plus 1 % des parties, et seulement dans les cas connus",
    () => {
      const issues: Issue[] = [];
      for (const niveau of NIVEAUX) {
        for (const def of SCENARIO_CHOICES) {
          for (const graine of GRAINES) issues.push(validerSeul(def.code, niveau, graine));
        }
      }
      // Les quinze scénarios du registre sont bien joués.
      expect(new Set(issues.map((x) => x.cellule.split(":")[0])).size).toBe(15);
      const lire = (x: Issue) => `${x.cellule}, graine ${x.graine} (${x.battues}/${GRAINES_DU_MERITE.length})`;
      // (a) Jamais la faillite.
      expect(issues.filter((x) => x.defaillante).map(lire), "défaillances").toEqual([]);
      // (b) « Solide » : seulement dans les cas connus, et au plus 1 % des parties.
      const solides = issues.filter((x) => x.solide);
      expect(solides.filter((x) => !CAS_CONNUS.has(x.cellule)).map(lire), "« solide » hors des cas connus").toEqual([]);
      expect(solides.length, solides.map(lire).join(" ; ")).toBeLessThanOrEqual(PLAFOND * issues.length);
    },
    600_000,
  );
});
