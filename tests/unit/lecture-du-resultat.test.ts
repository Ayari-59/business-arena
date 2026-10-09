import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { botDecisions } from "@/engine/bots";
import { SCENARIOS } from "@/config/scenarios/registry";
import type { CompanyRoundResult, CompanyState, SimulationInput } from "@/engine/types";
import {
  causesDuResultat,
  decompositionDuResultat,
  sousLExcedent,
} from "@/components/lecture-du-resultat";
import { structureDuTour } from "@/pedagogy/verdict-du-tour";

/**
 * LE VERDICT EXPLIQUE LA PERFORMANCE, ET IL N'INVENTE RIEN (lot 6E).
 *
 * Le rituel de fin de tour et la synthèse d'un tour clos montrent une cascade
 * — chiffre d'affaires, coûts variables, charges de structure, ce qui vient
 * sous l'excédent brut, résultat net — et les causes chiffrées les plus fortes.
 * Deux choses doivent tenir, et la première est une identité comptable :
 *
 *   · LA CASCADE FERME SUR LE RÉSULTAT DU COMPTE, au centime, sur de VRAIS
 *     tours de CHAQUE scénario du registre (mono-produit, gamme, abonnement,
 *     hôtel, conseil…). Chaque marche est lue dans le compte, aucune n'est un
 *     reste : si une ligne venait à manquer, la cascade ne fermerait plus ;
 *   · UNE CAUSE N'EXISTE QUE SI SA DONNÉE EXISTE : pas d'estimation déposée,
 *     pas de cause « estimation » ; pas de demande perdue, pas de « ventes
 *     manquées » ; et leurs chiffres sont ceux du tour.
 */

/** Trois tours d'un scénario, chaque entreprise jouée par un robot : de vrais comptes. */
function troisTours(code: string): CompanyRoundResult[] {
  const def = SCENARIOS.find((d) => d.code === code)!;
  let etats: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils: Record<string, Parameters<typeof botDecisions>[0]> = {
    joueur: "balanced",
    ...Object.fromEntries(def.bots.map((b) => [b.id, b.profile])),
  };
  const resultats: CompanyRoundResult[] = [];
  for (let roundIndex = 1; roundIndex <= 3; roundIndex++) {
    const input = {
      scenario: def.scenario,
      roundIndex,
      companies: etats,
      decisions: Object.fromEntries(
        etats.map((e) => [
          e.id,
          botDecisions(profils[e.id]!, { scenario: def.scenario, state: e, roundIndex }),
        ]),
      ),
      activeEvents: [],
      seed: 11 + roundIndex,
    } as unknown as SimulationInput;
    const sortie = simulateRound(input);
    etats = sortie.companies;
    for (const e of etats) resultats.push(sortie.results[e.id]!);
  }
  return resultats;
}

describe("la cascade du résultat ferme sur le compte du tour", () => {
  it.each(SCENARIOS.map((d) => d.code))("%s : au centime, sur de vrais tours", (code) => {
    const tours = troisTours(code);
    expect(tours.length).toBeGreaterThan(0);
    for (const r of tours) {
      const cr = r.incomeStatement;
      const d = decompositionDuResultat(cr);
      // Chaque marche est lue dans le compte.
      expect(d.chiffreDAffaires).toBe(cr.revenue);
      expect(d.coutsVariables).toBe(cr.cogs + (cr.commissionCost ?? 0));
      expect(d.structure).toBe(structureDuTour(cr));
      expect(d.sousLExcedent).toBe(sousLExcedent(cr));
      expect(d.resultat).toBe(cr.netIncome);
      // Les marches s'enchaînent : chacune commence où la précédente s'arrête.
      const [ca, variables, structure, sous, resultat] = d.marches;
      expect(ca!.debut).toBe(0);
      expect(variables!.debut).toBeCloseTo(ca!.fin, 6);
      expect(structure!.debut).toBeCloseTo(variables!.fin, 6);
      expect(sous!.debut).toBeCloseTo(structure!.fin, 6);
      // L'IDENTITÉ : la dernière marche s'arrête sur le résultat du compte.
      expect(sous!.fin, `${code} : la cascade ne ferme pas`).toBeCloseTo(cr.netIncome, 2);
      expect(resultat!.fin).toBe(cr.netIncome);
      // Et la marge intermédiaire est bien celle du compte.
      expect(cr.revenue - d.coutsVariables).toBeCloseTo(cr.grossMargin, 2);
    }
  });
});

describe("une cause n'existe que si sa donnée existe", () => {
  const [r] = troisTours("nova");
  const segments = Object.values(r!.market.bySegment);
  const perdues = segments.reduce((s, x) => s + x.lost, 0);

  it("sans estimation, sans prix connu, sans demande perdue : aucune cause", () => {
    const sansPerte: CompanyRoundResult = {
      ...r!,
      market: {
        ...r!.market,
        bySegment: Object.fromEntries(
          Object.entries(r!.market.bySegment).map(([k, v]) => [k, { ...v, lost: 0 }]),
        ) as CompanyRoundResult["market"]["bySegment"],
      },
    };
    expect(
      causesDuResultat({
        result: sansPerte,
        prixPratique: null,
        prixDuMarche: null,
        estimation: null,
        unites: "enceintes",
      }),
    ).toEqual([]);
  });

  it("les chiffres d'une cause sont ceux du tour, et les causes se classent par écart", () => {
    const vendues = segments.reduce((s, x) => s + x.sold, 0);
    const causes = causesDuResultat({
      result: r!,
      prixPratique: 59,
      prixDuMarche: 63,
      estimation: { units: Math.round(vendues * 2) } as never,
      unites: "enceintes",
    });
    const cles = causes.map((c) => c.cle);
    expect(cles).toContain("prix");
    expect(cles).toContain("estimation");
    expect(causes.find((c) => c.cle === "prix")!.texte).toContain("6 % sous");
    // L'estimation double les ventes : 50 % d'écart, la plus forte des causes.
    expect(causes[0]!.cle).toBe("estimation");
    if (perdues >= 1) {
      const manquees = causes.find((c) => c.cle === "ventes-manquees");
      expect(manquees).toBeDefined();
      expect(manquees!.texte.replace(/\s/g, "")).toContain(
        Math.round(perdues).toLocaleString("fr-FR").replace(/\s/g, ""),
      );
    }
    for (let i = 1; i < causes.length; i++) {
      expect(causes[i - 1]!.force).toBeGreaterThanOrEqual(causes[i]!.force);
    }
    expect(causes.length).toBeLessThanOrEqual(3);
  });
});
