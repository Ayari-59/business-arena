import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { avertissementDAchat } from "@/config/avertissement-d-achat";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { scenarioByCode } from "@/config/scenarios/registry";
import { conditionsDuCreditBail } from "@/engine/credit-bail";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { OffreDeCreditBail } from "@/services/game-view.service";

/**
 * LE CRÉDIT-BAIL DANS LE PARC MACHINES (`creditBail`). Chaque machine se prend au choix à
 * l'achat ou en crédit-bail, le loyer par tour se lit avant la validation, chaque contrat
 * en cours a sa ligne, et à l'échéance l'élève lève l'option ou rend la machine.
 */

vi.mock("@/app/arena/[gameId]/actions", () => ({ playRoundAction: async () => ({ error: null }) }));
const { EquipmentPanel, decisionsDesContrats } = await import("@/components/decision-form");

const hotel = scenarioByCode("hotel");
const scenario = composerLeScenarioJoue({ scenario: hotel.scenario, seed: 1, concurrents: 3, periodicity: "quarter", ...CORRECTIFS_DES_PARTIES_NOUVELLES });
const types = scenario.equipment!.types.map((t) => ({
  code: t.code,
  name: t.name,
  capacityPerUnit: t.capacityPerUnit,
  costPerUnit: t.costPerUnit,
  depreciationRounds: t.depreciationRounds,
  maintenanceMultiplier: t.maintenanceMultiplier,
  maxPerRound: t.maxPerRound,
  resaleRatio: t.resaleRatio ?? 0.3,
  chargeFixeParTour: t.chargeFixeParTour,
}));
const chambre = types[0]!;
const cond = conditionsDuCreditBail(scenario, chambre);
const euros = (x: number) => `${Math.round(x).toLocaleString("fr-FR")} €`.replace(/[\u00a0\u202f]/g, " ");
const sans = (s: string) => s.replace(/[\u00a0\u202f]/g, " ").replace(/&#x27;/g, "'");
const etat = hotel.company("a", "A", "human");
const tresorerie = etat.finance.cash - etat.finance.overdraft;

const offre = (contrats: OffreDeCreditBail["contrats"] = []): OffreDeCreditBail => ({
  duree: 12,
  tauxAnnuel: scenario.finance.loanAnnualRate + 0.015,
  conditions: types.map((t) => ({ typeCode: t.code, loyer: conditionsDuCreditBail(scenario, t).loyer, option: conditionsDuCreditBail(scenario, t).option })),
  enService: types.map((t) => ({ typeCode: t.code, count: 0 })),
  contrats,
});
const contrat = (aEcheance: boolean): OffreDeCreditBail["contrats"][number] => ({
  id: `cb-${chambre.code}-r1`,
  typeCode: chambre.code,
  typeName: chambre.name,
  quantite: 1,
  loyer: cond.loyer,
  loyersRestants: aEcheance ? 1 : 9,
  dernierTour: 13,
  option: cond.option,
  aEcheance,
});
const rien = () => {};

function panneau(r: {
  achats?: Record<string, number>;
  loues?: Record<string, number>;
  modes?: Record<string, "achat" | "credit-bail">;
  contrats?: OffreDeCreditBail["contrats"];
  choix?: Record<string, "lever" | "rendre" | "rompre">;
  ouvert?: boolean;
}) {
  return sans(
    renderToStaticMarkup(
      createElement(EquipmentPanel, {
        offer: {
          types,
          fleet: types.map((t) => ({ typeCode: t.code, count: 0, bookValue: 0 })),
          pendingFleet: types.map((t) => ({ typeCode: t.code, count: 0 })),
          tresorerieDisponible: tresorerie,
          creditBail: offre(r.contrats),
        },
        vocabulary: hotel.vocabulary,
        buyQty: r.achats ?? {},
        setBuyQty: rien,
        sellQty: {},
        setSellQty: rien,
        empruntOuvert: true,
        creditBail:
          r.ouvert === false
            ? null
            : { leaseQty: r.loues ?? {}, setLeaseQty: rien, modes: r.modes ?? {}, setModes: rien, choix: r.choix ?? {}, setChoix: rien },
      }),
    ),
  );
}

describe("le panneau du parc propose le crédit-bail", () => {
  it("chaque machine offre « Acheter » ou « Crédit-bail », l'achat par défaut", () => {
    const html = panneau({});
    expect(html.match(/aria-pressed="true"[^>]*>Acheter</g)).toHaveLength(types.length);
    expect(html.match(/>Crédit-bail</g)).toHaveLength(types.length);
    expect(html).not.toContain("data-loyer-du-credit-bail");
  });

  it("en crédit-bail, le loyer par tour se lit avant la validation, et rien n'est à payer à la signature", () => {
    const html = panneau({ loues: { [chambre.code]: 1 }, modes: { [chambre.code]: "credit-bail" } });
    expect(html).toContain(`Loyer ${euros(cond.loyer)} par tour et par machine, pendant 12 tours ; rien à payer à la signature.`);
    expect(html).toContain(`Option d'achat ${euros(cond.option)} en fin de contrat.`);
    expect(html).toContain(`aria-label="Crédit-bail · ${chambre.name}"`);
    expect(html).toContain(`= ${euros(cond.loyer)} par tour`);
    expect(html).toContain("Loyers de crédit-bail ajoutés");
    // Rien ne sort de la trésorerie : aucun avertissement d'achat.
    expect(html).not.toContain("dépasse votre trésorerie");
  });

  it("l'achat trop cher propose le crédit-bail quand la partie l'ouvre", () => {
    expect(chambre.costPerUnit).toBeGreaterThan(tresorerie);
    expect(panneau({ achats: { [chambre.code]: 1 } })).toContain("ou prenez la machine en crédit-bail : rien n'est payé à la signature");
    expect(panneau({ achats: { [chambre.code]: 1 }, ouvert: false })).not.toContain("crédit-bail");
    expect(avertissementDAchat({ cout: 60_000, tresorerie: 50_000, empruntOuvert: false, creditBailOuvert: true })).toContain(
      "Le crédit-bail ne demande rien à la signature",
    );
  });

  it("une ligne par contrat en cours : loyers restants, dernier tour, option ; la rupture avant l'échéance", () => {
    const html = panneau({ contrats: [contrat(false)] });
    expect(html).toContain("Vos contrats de crédit-bail");
    expect(html).toContain(`${chambre.name} × 1 · loyer ${euros(cond.loyer)} par tour`);
    expect(html).toContain(`9 loyers restants (${euros(9 * cond.loyer)}), dernier au tour 13 · option ${euros(cond.option)}`);
    expect(html).toContain(`Rompre le contrat : vous payez ce tour les 9 loyers restants (${euros(9 * cond.loyer)}) et rendez la machine.`);
    expect(html).not.toContain("Lever l'option");
  });

  it("à l'échéance : « Lever l'option (X €) », retenu par défaut, ou « Rendre la machine »", () => {
    const html = panneau({ contrats: [contrat(true)] });
    expect(html).toContain(`aria-pressed="true"`);
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>Lever l'option \\(${euros(cond.option)}\\)<`));
    expect(html).toMatch(/aria-pressed="false"[^>]*>Rendre la machine</);
    expect(html).not.toContain("Rompre le contrat");
    expect(panneau({ contrats: [contrat(true)], choix: { [contrat(true).id]: "rendre" } })).toMatch(/aria-pressed="true"[^>]*>Rendre la machine</);
  });

  it("ce que la feuille envoie : le choix de l'échéance, la seule rupture cochée", () => {
    const o = offre([contrat(true), { ...contrat(false), id: "cb-autre-r2" }]);
    expect(decisionsDesContrats(o, {})).toEqual([{ contractId: contrat(true).id, choice: "lever" }]);
    expect(decisionsDesContrats(o, { [contrat(true).id]: "rendre", "cb-autre-r2": "rompre" })).toEqual([
      { contractId: contrat(true).id, choice: "rendre" },
      { contractId: "cb-autre-r2", choice: "rompre" },
    ]);
  });

  it("le formulaire et le schéma du serveur gardent le crédit-bail jusqu'au moteur", () => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ price: "100", productionPlan: "10", marketingBudget: "0", qualityBudget: "0", maintenanceBudget: "0" })) f.set(k, v);
    f.set("equipmentLeaseJson", JSON.stringify([{ typeCode: chambre.code, quantity: 1 }]));
    f.set("leaseDecisionsJson", JSON.stringify([{ contractId: "cb-x-r1", choice: "rompre" }]));
    const { decisions } = decisionsSaisies(f);
    expect(decisions.investment?.equipmentLease).toEqual([{ typeCode: chambre.code, quantity: 1 }]);
    const lu = roundDecisionsSchema.parse(decisions);
    expect(lu.investment?.equipmentLease).toEqual([{ typeCode: chambre.code, quantity: 1 }]);
    expect(lu.investment?.leaseDecisions).toEqual([{ contractId: "cb-x-r1", choice: "rompre" }]);
  });
});

describe("l'annexe des engagements et la fiche du crédit-bail", () => {
  it("la baisse de l'engagement s'écrit à l'encre, sans le rouge d'une perte, et l'annexe mène à la fiche", async () => {
    const { FinancialStatements } = await import("@/components/financial-statements");
    const { runGame } = await import("@/engine/simulation/runGame");
    const { GRAINE_DU_COURS, decisionsDuCours } = await import("@/config/cours/arene-du-cours");
    const nova = scenarioByCode("nova");
    const s = composerLeScenarioJoue({ scenario: nova.scenario, seed: GRAINE_DU_COURS, concurrents: 3, roundsCount: 3, periodicity: "quarter", ...CORRECTIFS_DES_PARTIES_NOUVELLES });
    const entreprises = [nova.company("joueur", nova.playerTeamName, "bot", "balanced"), ...nova.bots.slice(0, 2).map((b) => nova.company(b.id, b.name, "bot", b.profile))];
    const p = runGame({
      scenario: s,
      initialCompanies: entreprises,
      seed: GRAINE_DU_COURS,
      providers: decisionsDuCours(entreprises, s, (t, d) => (t === 1 ? { ...d, investment: { equipmentLease: [{ typeCode: "manual", quantity: 1 }] } } : d)),
    });
    const [premier, second] = [p.rounds[1]!.results.joueur!, p.rounds[2]!.results.joueur!];
    const html = sans(
      renderToStaticMarkup(
        createElement(FinancialStatements, {
          result: second,
          precedent: premier,
          periode: "Trimestre 3",
          price: 64,
          otherVariableCostPerUnit: 4,
          vocabulary: nova.vocabulary,
          secteur: nova.sector,
        }),
      ),
    );
    const annexe = html.slice(html.indexOf("data-engagements-de-credit-bail"));
    const ligne = annexe.slice(annexe.indexOf("Redevances restant à payer"), annexe.indexOf("Prix d'achat résiduel"));
    expect(ligne).toContain(`−${euros(second.creditBail!.contrats[0]!.loyer)}`);
    expect(ligne).toContain("text-slate-400");
    expect(ligne).not.toContain("text-red-400");
    expect(annexe).toContain('href="/notions#credit_bail"');
  });

  it("le parc machines mène à la fiche, dont l'exemple de NOVA vient du moteur", async () => {
    expect(panneau({})).toContain('href="/notions#credit_bail"');
    const { conceptByCode } = await import("@/config/pedagogy/concepts");
    const { avecLEquilibre } = await import("@/config/scenarios/equilibre");
    const fiche = conceptByCode.get("credit_bail")!;
    const sNova = avecLEquilibre(scenarioByCode("nova").scenario);
    const ligne = sNova.equipment!.types.find((t) => t.code === "manual")!;
    const c = conditionsDuCreditBail(sNova, ligne);
    const i = sNova.finance.loanAnnualRate / 4;
    let actualise = c.option / Math.pow(1 + i, c.duree);
    for (let k = 1; k <= c.duree; k++) actualise += c.loyer / Math.pow(1 + i, k);
    const texte = sans(fiche.intuition);
    expect(texte).toContain(`la ligne manuelle coûte ${euros(ligne.costPerUnit)}`);
    expect(texte).toContain(`${c.duree} loyers de ${euros(c.loyer)} par trimestre (${euros(c.duree * c.loyer)} en tout) puis une option à ${euros(c.option)}`);
    expect(texte).toContain(`environ ${(Math.round((actualise / ligne.costPerUnit - 1) * 1000) / 10).toLocaleString("fr-FR")} % de plus qu'un emprunt`.replace(/[\u00a0\u202f]/g, " "));
    // Les écritures du plan comptable général.
    expect(fiche.method).toContain("612 Redevances de crédit-bail");
    expect(fiche.method).toContain("2154 au débit, 512 au crédit");
  });
});
