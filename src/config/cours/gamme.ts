import { botDecisions, type BotProfile } from "../../engine/bots";
import { withoutRd } from "../../engine/gamme";
import { runGame } from "../../engine/simulation/runGame";
import type { CompanyState } from "../../engine/types";
import { auCentime } from "../../pedagogy/cours/etats";
import { familyOf, scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS } from "./cas";

/**
 * LA GAMME DU MOIS : CE QUE LE MOTEUR VEND, RÉFÉRENCE PAR RÉFÉRENCE.
 *
 * Six des neuf entreprises jouent une gamme dans l'arène, à partir d'un niveau (le 4, le 3
 * pour MAILLE & CO) : NOVA ses trois enceintes, L'ESCALE ses trois chambres, et ainsi de
 * suite. Le chapitre « Coût par produit » se joue sur leur premier trimestre en gamme,
 * simulé par le moteur dans le même réglage que les autres cas du cours (gestion
 * équilibrée face à deux concurrents, même graine), ramené à un mois. La référence à bâtir
 * par la R&D y est livrée prête, comme au niveau qui ouvre la gamme.
 *
 * Rien n'est inventé : les quantités, les prix, le coût variable de chaque référence, sa
 * publicité et son budget qualité viennent du tour joué ; les heures de travail par unité,
 * de la fiche de chaque référence ; les charges communes (structure, entretien, usure de
 * l'équipement), du compte de résultat du tour.
 */

export interface ReferenceDuMois {
  code: string;
  nom: string;
  quantite: number;
  prix: number;
  chiffreDAffaires: number;
  coutVariableUnitaire: number;
  /** Publicité et qualité de la référence : des charges fixes, mais propres à elle. */
  publicite: number;
  qualite: number;
  heuresParUnite: number;
}

export interface GammeDuMois {
  /** Le niveau de l'arène à partir duquel l'entreprise joue sa gamme. */
  niveau: number;
  /** Ce que la gamme fait jouer, en clair (« la gamme Go, One et Studio »). */
  libelle: string;
  references: ReferenceDuMois[];
  /** Les charges communes du mois, que rien ne rattache à une seule référence. */
  communes: { structure: number; entretien: number; usure: number };
}

const parTrois = (x: number) => Math.round(x / 3);
const gammes = new Map<string, GammeDuMois | null>();

/** La gamme de l'entreprise, ou null si elle n'en joue pas (VOLT FITNESS, MARTEL & FILS, ROUTE & CIE). */
export function gammeDuMois(code: string): GammeDuMois | null {
  if (gammes.has(code)) return gammes.get(code)!;
  const famille = familyOf(code);
  if (!famille) {
    gammes.set(code, null);
    return null;
  }
  const def = scenarioByCode(famille.gamme);
  const scenario = { ...withoutRd(def.scenario), roundsCount: 1 };
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        (ctx: { state: CompanyState; roundIndex: number }) =>
          botDecisions(e.botProfile as BotProfile, { scenario, state: ctx.state, roundIndex: ctx.roundIndex }),
      ]),
    ),
  });
  const joueur = partie.rounds[0]!.results["joueur"]!;
  const references = (scenario.products ?? []).flatMap((d): ReferenceDuMois[] => {
    const p = joueur.products?.[d.code];
    if (!p) return [];
    const quantite = Math.max(1, Math.round(p.sold / 3));
    return [
      {
        code: d.code,
        nom: d.shortName ?? d.name,
        quantite,
        prix: p.price,
        chiffreDAffaires: auCentime(quantite * p.price),
        coutVariableUnitaire: p.unitVariableCost,
        publicite: parTrois(p.marketingBudget),
        qualite: parTrois(p.qualityBudget),
        heuresParUnite: d.hoursPerUnit,
      },
    ];
  });
  const cr = joueur.incomeStatement;
  const gamme: GammeDuMois = {
    niveau: famille.gammeFromLevel,
    libelle: famille.gammeLabel,
    references,
    communes: { structure: parTrois(cr.fixedCosts), entretien: parTrois(cr.maintenanceCost), usure: parTrois(cr.depreciation) },
  };
  gammes.set(code, gamme);
  return gamme;
}
