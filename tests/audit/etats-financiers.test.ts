import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { botDecisions, type BotProfile } from "@/engine/bots";
import { SCENARIOS } from "@/config/scenarios/registry";
import type { CompanyState, SimulationOutput } from "@/engine/types";

/**
 * LES ÉTATS FINANCIERS BOUCLENT.
 *
 * Un simulateur de gestion qui présente un bilan déséquilibré n'enseigne pas
 * la comptabilité, il l'abîme. Ces invariants ne dépendent d'aucun scénario :
 * ils sont vrais chez Michelin comme chez NOVA, et ils sont donc vérifiés sur
 * les QUINZE scénarios, sur un jeu complet, pour toutes les entreprises.
 */

const TOURS = 6;

function jouer(definition: (typeof SCENARIOS)[number]) {
  const joueur = definition.company("player", definition.playerTeamName, "bot", "balanced");
  let entreprises: CompanyState[] = [
    joueur,
    ...definition.bots.map((b) => definition.company(b.id, b.name, "bot", b.profile)),
  ];
  // Le profil vient du registre : `botProfile` est stocké dans l'état sans son
  // type, et le deviner à la lecture ferait mentir le banc.
  const profils = new Map<string, BotProfile>([
    ["player", "balanced"],
    ...definition.bots.map((b) => [b.id, b.profile] as [string, BotProfile]),
  ]);
  const tours: { roundIndex: number; out: SimulationOutput; avant: CompanyState[] }[] = [];
  let evenements: SimulationOutput["events"] = [];
  for (let roundIndex = 1; roundIndex <= TOURS; roundIndex++) {
    const avant = entreprises;
    const decisions = Object.fromEntries(
      entreprises.map((c) => [
        c.id,
        botDecisions(profils.get(c.id) ?? "balanced", {
          scenario: definition.scenario,
          state: c,
          roundIndex,
        }),
      ]),
    );
    const out = simulateRound({
      scenario: definition.scenario,
      roundIndex,
      companies: entreprises,
      decisions,
      activeEvents: evenements,
      seed: 1234,
    });
    tours.push({ roundIndex, out, avant });
    entreprises = out.companies;
    evenements = out.events;
  }
  return tours;
}

/** Tout nombre d'un état financier est fini : ni NaN, ni ±Infini. */
function nombresFinis(valeur: unknown, chemin: string, fautes: string[]): void {
  if (typeof valeur === "number") {
    if (!Number.isFinite(valeur)) fautes.push(`${chemin} = ${valeur}`);
    return;
  }
  if (Array.isArray(valeur)) {
    valeur.forEach((v, i) => nombresFinis(v, `${chemin}[${i}]`, fautes));
    return;
  }
  if (valeur && typeof valeur === "object") {
    for (const [k, v] of Object.entries(valeur)) nombresFinis(v, `${chemin}.${k}`, fautes);
  }
}

describe.each(SCENARIOS.map((d) => [d.code, d] as const))("%s", (code, definition) => {
  const tours = jouer(definition);

  it("le bilan est équilibré à chaque tour, pour chaque entreprise", () => {
    const fautes: string[] = [];
    for (const { roundIndex, out } of tours) {
      for (const [id, r] of Object.entries(out.results)) {
        const b = r.balanceSheet;
        const actif = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash + (b.shortTermInvestment ?? 0);
        const passif = b.equity + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
        const ecart = actif - passif;
        // Un centime de tolérance : les flottants, pas la comptabilité.
        if (Math.abs(ecart) > 0.01) {
          fautes.push(`${code} tour ${roundIndex} ${id} : actif ${actif.toFixed(2)} ≠ passif ${passif.toFixed(2)} (écart ${ecart.toFixed(2)})`);
        }
      }
    }
    expect(fautes, fautes.slice(0, 10).join("\n")).toEqual([]);
  });

  it("le tableau de flux part de l'ouverture et tombe sur la clôture", () => {
    const fautes: string[] = [];
    for (const { roundIndex, out } of tours) {
      for (const [id, r] of Object.entries(out.results)) {
        const somme = r.cashFlow.items.reduce((s, i) => s + i.amount, 0);
        const attendu = r.cashFlow.opening + somme;
        if (Math.abs(attendu - r.cashFlow.closing) > 0.01) {
          fautes.push(`${code} tour ${roundIndex} ${id} : ${r.cashFlow.opening.toFixed(2)} + ${somme.toFixed(2)} = ${attendu.toFixed(2)} ≠ clôture ${r.cashFlow.closing.toFixed(2)}`);
        }
      }
    }
    expect(fautes, fautes.slice(0, 10).join("\n")).toEqual([]);
  });

  it("aucun nombre n'est NaN ni infini", () => {
    const fautes: string[] = [];
    for (const { roundIndex, out } of tours) {
      for (const [id, r] of Object.entries(out.results)) {
        nombresFinis(r, `${code} tour ${roundIndex} ${id}`, fautes);
      }
    }
    expect(fautes, fautes.slice(0, 10).join("\n")).toEqual([]);
  });

  it("caisse, stock, découvert et immobilisations ne passent jamais sous zéro", () => {
    const fautes: string[] = [];
    for (const { roundIndex, out } of tours) {
      for (const [id, r] of Object.entries(out.results)) {
        const b = r.balanceSheet;
        for (const [nom, v] of [
          ["caisse", b.cash], ["stock", b.inventoryValue], ["découvert", b.overdraft],
          ["immobilisations", b.fixedAssetsNet], ["dette financière", b.financialDebt],
          ["créances", b.receivables], ["dettes fournisseurs", b.payables],
        ] as const) {
          if (v < -0.01) fautes.push(`${code} tour ${roundIndex} ${id} : ${nom} = ${v.toFixed(2)}`);
        }
      }
    }
    expect(fautes, fautes.slice(0, 10).join("\n")).toEqual([]);
  });

  it("la caisse et le découvert ne coexistent pas", () => {
    // Avoir 40 000 € en caisse ET 12 000 € de découvert serait payer des
    // agios sur un compte plein : une incohérence, pas une situation.
    const fautes: string[] = [];
    for (const { roundIndex, out } of tours) {
      for (const [id, r] of Object.entries(out.results)) {
        const b = r.balanceSheet;
        if (b.cash > 0.01 && b.overdraft > 0.01) {
          fautes.push(`${code} tour ${roundIndex} ${id} : caisse ${b.cash.toFixed(2)} ET découvert ${b.overdraft.toFixed(2)}`);
        }
      }
    }
    expect(fautes, fautes.slice(0, 10).join("\n")).toEqual([]);
  });
});
