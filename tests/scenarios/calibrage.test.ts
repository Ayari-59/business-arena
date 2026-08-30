import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import { runGame, soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * UN SECTEUR QUI NE PEUT PAS SE GAGNER N'EST PAS UN EXERCICE.
 *
 * Le transport a été publié perdant. Toutes les stratégies y perdaient, jouées
 * seules comme en classe, entre 250 000 et 400 000 € par trimestre, et rien ne
 * le signalait : son bilan d'ouverture était équilibré, ses situations bien
 * écrites, sa jouabilité technique vérifiée. La partie tournait parfaitement
 * et menait tout le monde à la faillite.
 *
 * La cause tenait en une ligne : chaque palette portait 43 € de frais de route,
 * soit le coût d'un camion complet posé sur une seule palette, tandis que la
 * conduite était payée une seconde fois en charges de structure. Aucun volume
 * atteignable ne couvrait cela.
 *
 * Ce test joue donc les cinq stratégies types de chaque secteur et vérifie ce
 * qu'aucun autre ne regardait : qu'il existe une façon de gagner, et qu'aucune
 * façon raisonnable ne ruine l'entreprise avant la fin.
 */
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(code: string, strategie: BotProfile) {
  const d = SCENARIOS.find((s) => s.code === code)!;
  const companies: CompanyState[] = [
    d.company("player", d.playerTeamName, "bot", strategie),
    ...d.bots.slice(0, 2).map((b) => d.company(b.id, b.name, "bot", b.profile)),
  ];
  const run = runGame({
    scenario: d.scenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: d.scenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
          }),
      ]),
    ),
    seed: 20260101,
  });
  const resultats = run.rounds.map((r) => r.results["player"]!);
  const dernier = run.rounds[run.rounds.length - 1]!.companies.find((c) => c.id === "player")!;
  return {
    cumul: resultats.reduce((t, r) => t + r.incomeStatement.netIncome, 0),
    parTour: resultats.reduce((t, r) => t + r.incomeStatement.netIncome, 0) / resultats.length,
    capitauxPropres: dernier.finance.equity,
  };
}

describe("calibrage économique des secteurs", () => {
  it("chaque secteur peut se gagner", () => {
    // La règle minimale, et celle qui manquait : au moins une stratégie type
    // finit la partie dans le vert. Sans elle, un secteur peut être publié
    // perdant pour tout le monde sans qu'aucun test ne bouge.
    for (const d of SCENARIOS) {
      const cumuls = STRATEGIES.map((s) => ({ s, ...partie(d.code, s) }));
      const meilleure = cumuls.reduce((a, b) => (b.cumul > a.cumul ? b : a));
      expect(
        meilleure.cumul,
        `${d.code} : la meilleure stratégie (${meilleure.s}) finit à ${Math.round(meilleure.cumul / 1000)} k€ ; ` +
          cumuls.map((c) => `${c.s} ${Math.round(c.parTour / 1000)} k€/tour`).join(", "),
      ).toBeGreaterThan(0);
    }
  });

  it("se tromper peut coûter l'entreprise, jamais davantage que l'entreprise", () => {
    // L'autre bout de la règle. Trois secteurs laissent aujourd'hui une
    // stratégie mal choisie finir en capitaux propres négatifs, et c'est
    // légitime : une entreprise mal tenue fait faillite, et le dire fait
    // partie de l'exercice.
    //
    // Ce qui n'est pas légitime, c'est de perdre PLUS que ce qu'on avait. Le
    // transport y tombait de très loin : moins 1,5 M€ de résultat cumulé pour
    // 696 000 € de capitaux propres de départ, soit une équipe à qui il ne
    // restait rien à décider dès le troisième trimestre.
    for (const d of SCENARIOS) {
      const depart = d.company("mesure", "mesure", "bot").finance.equity;
      const gouffres = STRATEGIES.map((s) => ({ s, ...partie(d.code, s) })).filter(
        (r) => r.capitauxPropres < -depart,
      );
      expect(
        gouffres.map(
          (r) =>
            `${r.s} finit à ${Math.round(r.capitauxPropres / 1000)} k€ pour ${Math.round(depart / 1000)} k€ de départ`,
        ),
        `${d.code} : une stratégie coûte plus que l'entreprise ne valait`,
      ).toEqual([]);
    }
  });

  it("l'écart entre la meilleure et la pire stratégie reste enseignable", () => {
    // Un secteur où toutes les stratégies se valent n'apprend rien ; un secteur
    // où l'écart dépasse l'ordre de grandeur du chiffre d'affaires ne se
    // rattrape pas. Le transport tient le haut de la fourchette, et c'est sa
    // raison d'être : un camion à moitié vide ne se rattrape jamais.
    for (const d of SCENARIOS) {
      const parTour = STRATEGIES.map((s) => partie(d.code, s).parTour);
      const ecart = Math.max(...parTour) - Math.min(...parTour);
      expect(ecart, `${d.code} : toutes les stratégies se valent`).toBeGreaterThan(5000);
      expect(
        ecart,
        `${d.code} : ${Math.round(ecart / 1000)} k€ séparent la meilleure de la pire`,
      ).toBeLessThan(250000);
    }
  });
});

/**
 * LA PROSE FAIT SES PROPRES CALCULS, ET ILS DOIVENT TOMBER JUSTE.
 *
 * Les situations posent des calculs devant l'élève : « 49 €, soit 74 − 18 − 7 »,
 * « 186 000 ÷ 49 ≈ 3 796 ». Ces lignes sont la correction : un élève qui refait
 * l'opération et trouve autre chose ne se dit pas que la fiche se trompe, il se
 * dit qu'il n'a pas compris.
 *
 * Elles se désaccordent en silence dès qu'un chiffre du scénario bouge, et
 * c'est exactement ce qui est arrivé au transport : le coût variable d'une
 * palette a changé, les huit situations ont continué d'enseigner l'ancien.
 */
function nombresDe(texte: string): number | null {
  const net = texte.replace(/[  ]/g, "").replace(",", ".");
  const n = Number(net);
  return Number.isFinite(n) ? n : null;
}

/** Toute la prose d'un scénario, situations comprises. */
function proseDe(code: string): string {
  const d = SCENARIOS.find((s) => s.code === code)!;
  const morceaux: string[] = [];
  for (const s of d.situations) {
    morceaux.push(s.narrative, s.problem, s.title);
    for (const o of s.diagnosticOptions) morceaux.push(o.label);
    for (const q of s.quiz ?? []) {
      morceaux.push(q.prompt, q.explain);
      for (const o of q.options) morceaux.push(o.label);
    }
    for (const h of s.hints ?? []) morceaux.push(typeof h === "string" ? h : h.text);
  }
  return morceaux.join("\n");
}

const CHIFFRE = "\\d[\\d  ]*(?:,\\d+)?";

describe("l'arithmétique écrite dans les situations", () => {
  it("chaque soustraction posée tombe juste", () => {
    const fautes: string[] = [];
    for (const d of SCENARIOS) {
      const prose = proseDe(d.code);
      // « 49 €, soit 74 − 18 − 7 »
      for (const m of prose.matchAll(
        new RegExp(`(${CHIFFRE})\\s*€,\\s*soit\\s+(${CHIFFRE})\\s*[−-]\\s*(${CHIFFRE})(?:\\s*[−-]\\s*(${CHIFFRE}))?`, "g"),
      )) {
        const attendu = nombresDe(m[1]!);
        const a = nombresDe(m[2]!);
        const b = nombresDe(m[3]!);
        const c = m[4] === undefined ? 0 : nombresDe(m[4]);
        if (attendu === null || a === null || b === null || c === null) continue;
        const calcule = a - b - c;
        if (Math.abs(calcule - attendu) > 0.01) {
          fautes.push(`${d.code} : « ${m[0]} » donne ${calcule}`);
        }
      }
    }
    expect(fautes, `soustractions fausses :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("chaque division posée tombe juste", () => {
    const fautes: string[] = [];
    for (const d of SCENARIOS) {
      const prose = proseDe(d.code);
      // « 186 000 ÷ 49 ≈ 3 796 », « 10 × 455 ÷ 0,5 = 9 100 », « 10 ÷ 33 ≈ 30 % ».
      // Les trois formes existent dans les fiches, et une lecture naïve de la
      // seule division déclarait fausses les deux dernières : un facteur
      // multiplicatif devant, un pourcentage derrière.
      for (const m of prose.matchAll(
        new RegExp(
          `(?:(${CHIFFRE})\\s*×\\s*)?(${CHIFFRE})\\s*÷\\s*(${CHIFFRE})\\s*[≈=]\\s*(${CHIFFRE})\\s*(%?)`,
          "g",
        ),
      )) {
        const facteur = m[1] === undefined ? 1 : nombresDe(m[1])!;
        const a = nombresDe(m[2]!);
        const b = nombresDe(m[3]!);
        const attendu = nombresDe(m[4]!);
        if (a === null || b === null || attendu === null || b === 0 || attendu === 0) continue;
        const calcule = (facteur * a) / b * (m[5] === "%" ? 100 : 1);
        // « ≈ » autorise l'arrondi, pas l'erreur : un pour cent d'écart, et au
        // moins un demi-point, sans quoi un pourcentage écrit à l'unité
        // (« 10 ÷ 33 ≈ 30 % », qui vaut 30,3) serait déclaré faux.
        if (Math.abs(calcule - attendu) > Math.max(0.5, Math.abs(attendu) * 0.01)) {
          fautes.push(`${d.code} : « ${m[0].trim()} » donne ${Math.round(calcule)}`);
        }
      }
    }
    expect(fautes, `divisions fausses :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("le transport enseigne les coûts que le moteur lui applique", () => {
    // Le secteur qui a payé la leçon : ses situations chiffrent le coût d'une
    // palette, et ce chiffre DOIT être celui que le moteur facture.
    //
    // Une première version de cette garde cherchait la VALEUR quelque part
    // dans la prose. Elle ne servait à rien : « 21 » se trouve dans « 21 000 €
    // d'entretien », si bien qu'un coût de gazole passé à 21 € la laissait
    // verte. On exige donc la phrase entière, valeur comprise.
    const d = SCENARIOS.find((s) => s.code === "transport")!;
    const prose = proseDe("transport").replace(/[\u00a0\u202f]/g, " ");
    // Les espaces fines insécables produites par le formatage français ne sont
    // pas des espaces ordinaires : les confondre rendait la garde toujours rouge.
    const euros = (n: number) => n.toLocaleString("fr-FR").replace(/[\u00a0\u202f]/g, " ");
    const capacite = d.company("mesure", "mesure", "bot").machineCapacity;
    const phrases: [string, string][] = [
      ["le coût de route d'une palette", `péages coûtent ${euros(d.scenario.product.materialCostPerUnit)} €`],
      ["l'entretien d'une palette", `pneumatiques ${euros(d.scenario.product.otherVariableCostPerUnit)} €`],
      ["la structure décaissée", `Avec ${euros(d.scenario.fixedCostsPerRound)} € de charges de structure`],
      ["la capacité de la flotte", `Environ ${euros(capacite)}, la flotte au complet`],
    ];
    for (const [quoi, phrase] of phrases) {
      expect(prose, `les situations du transport ne disent plus juste ${quoi} : « ${phrase} » absent`).toContain(
        phrase,
      );
    }
  });
});
