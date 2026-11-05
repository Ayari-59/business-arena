import { describe, expect, it } from "vitest";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SCENARIOS, lienDuScenario, scenarioParCode, scenariosDuChapitre } from "../../src/config/cours/scenarios";
import { LE_DECOUVERT_DE_NOVA as s } from "../../src/config/cours/scenarios/le-decouvert-de-nova";
import {
  CHOIX_DES_DECISIONS,
  ELECTRO_COMPOSANTS_EN_MAI,
  ESCOMPTE_DE_REGLEMENT,
  FRAIS_DE_REJET,
  JOURS_DES_REMISES,
  JOUR_DE_LA_RELANCE_PAYEE,
  JOUR_DU_SCENARIO,
  SOLDE_DU_30_AVRIL,
  VENTES_EN_LIGNE,
  creditDeMai,
  daillyDeMai,
  joursDuReport,
  meilleureSuite,
  montantsDeMai,
  planSansLimite,
  resultatDeLaSuite,
  suiteDesCodes,
  toutesLesSuites,
} from "../../src/config/cours/monde/decouvert-de-nova";
import { CONDITIONS_DE_LA_BANQUE } from "../../src/config/cours/monde/equilibre-de-tresorerie";
import { SONORA } from "../../src/config/cours/monde/exercice-de-nova";
import { CAS_PAR_CHAPITRE, SITUATIONS } from "../../src/config/cours/situations";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuScenario, servirLeScenario } from "../../src/pedagogy/cours/scenario-servi";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "../helpers/textes-du-depot";

/**
 * LE SCÉNARIO À EMBRANCHEMENTS : LE DÉCOUVERT DE NOVA (monde/decouvert-de-nova.ts,
 * scenarios/le-decouvert-de-nova.ts). Chaque chiffre refait à la main depuis le monde du cours ; le
 * compte de mai tombe juste jour par jour ; chaque branche se calcule et les choix changent la suite ;
 * trois fins, une meilleure suite unique ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const r = (client: string, fournisseur: string, banque: string) => resultatDeLaSuite(suiteDesCodes([client, fournisseur, banque]) as never);

describe("le monde de mai N+1 : chaque chiffre à la main", () => {
  const m = montantsDeMai();

  it("le jour du scénario : la relance amiable, 8 jours après l'échéance de février (20 février + 60 jours = 20 avril)", () => {
    expect(JOUR_DU_SCENARIO).toEqual({ jour: 28, mois: 4, exercice: 1 });
  });

  it("CampusTech : 320 enceintes à 59 € HT, 20 % de TVA ; le solde de janvier, 22 656 − 20 000 ; le factor d'Ondes", () => {
    expect(m.facture).toBe(c(320 * 59 * 1.2));
    expect(m.facture).toBe(22_656);
    expect(m.soldeDeJanvier).toBe(2_656);
    // Ondes : 600 enceintes à 59 € HT moins 5 %, TTC 40 356 € ; avance 90 %, 7 % sur 60 jours, 1 % de commission, sa TVA.
    const ttc = c(600 * 59 * 0.95 * 1.2);
    const avance = c(ttc * 0.9);
    const verse = c(avance - c((avance * 0.07 * 60) / 360) - c(ttc * 0.01));
    expect(ttc).toBe(40_356);
    expect(m.factor).toBe(c(verse - c(ttc * 0.01 * 0.2)));
    expect(m.factor).toBe(35_412.39);
  });

  it("Électro-Composants : 2 000 jeux d'avril (1 580 en ligne, 320 CampusTech, 100 Vibra) à 22 €, 52 800 € TTC", () => {
    expect(VENTES_EN_LIGNE).toEqual({ avril: 1_580, mai: 1_710 });
    expect(m.jeuxDAvril).toBe(1_580 + 320 + 100);
    expect([m.composantsHt, m.composants]).toEqual([44_000, 52_800]);
  });

  it("les remises de cartes : (1 710 × 59 − 2 630 × 16) ÷ 4, hors taxes, nettes des autres coûts", () => {
    expect(m.enceintesDeMai).toBe(1_710 + 320 + 600);
    expect(m.remisesDuMois).toBe(1_710 * 59 - 2_630 * 16);
    expect(m.remise).toBe(14_702.5);
    expect(JOURS_DES_REMISES).toEqual([7, 14, 21, 28]);
  });

  it("le loyer, la paie d'avril, le solde de l'impôt de N, la condamnation", () => {
    expect(m.loyer).toBe(19_700);
    // Les cotisations : URSSAF 4 050 €, retraite 750 €, l'impôt retenu 121,27 €.
    expect(m.cotisations).toBe(c(4_050 + 750 + 121.27));
    // Le net à payer : 7 500 − 22 % − l'impôt retenu.
    expect(m.salaires).toBe(c(7_500 * 0.78 - 121.27));
    // L'impôt de N : 15 % sur 42 500 €, 25 % au delà, sur 99 967,96 € ; aucun acompte en N ; arrondi à l'euro.
    expect(m.impot).toBe(Math.round(42_500 * 0.15 + (99_967.96 - 42_500) * 0.25));
    expect(m.impot).toBe(20_742);
    expect(m.condamnation).toBe(4_000);
  });

  it("l'escompte offert à CampusTech : 2 % de 18 880 € HT, la TVA d'autant, 453,12 € TTC", () => {
    expect(ESCOMPTE_DE_REGLEMENT.taux).toBe(SONORA.escompte);
    expect(m.escompte).toEqual({ ht: 377.6, ttc: c(377.6 * 1.2), net: c(22_656 - 453.12) });
  });

  it("les hypothèses nommées du scénario", () => {
    expect(SOLDE_DU_30_AVRIL).toBe(50_000);
    expect(FRAIS_DE_REJET).toBe(20);
    expect(JOUR_DE_LA_RELANCE_PAYEE).toBe(5);
    expect(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard).toBe(11);
    // Le report au 1er juin : 51 jours après la facture du 10 avril, sous les 60 jours légaux.
    expect(joursDuReport()).toBe(51);
    expect(CONDITIONS_DE_LA_BANQUE.decouvert).toEqual({ autorise: 5_000, tauxAnnuel: 0.12 });
  });
});

describe("le compte de mai, jour par jour", () => {
  it("le plan sans décision : −2 800 € le 1er mai, −22 500 € le 5, 9 jours sous zéro, 61 642,39 € au 31 mai", () => {
    const p = planSansLimite({});
    const solde = (j: number) => p.jours.find((x) => x.jour === j)!.solde;
    expect(solde(1)).toBe(50_000 - 52_800);
    expect(solde(5)).toBe(-2_800 - 19_700);
    expect(solde(7)).toBe(c(-22_500 + 14_702.5));
    expect(solde(10)).toBe(c(-7_797.5 + 22_656));
    expect(solde(15)).toBe(c(14_858.5 + 14_702.5 + 2_656 + 35_412.39 - 4_921.27 - 20_742 - 4_000));
    expect(p.plusBas).toEqual({ jour: 5, solde: -22_500 });
    expect(p.joursSousZero).toBe(9);
    expect(p.fin).toBe(c(37_966.12 + 14_702.5 * 2 - 5_728.73));
    expect(p.fin).toBe(61_642.39);
  });

  it("sans rien faire : le loyer est rejeté le 5 mai et repasse le 10 ; 6 jours à −2 800 €, 5,60 € d'agios et 20 € de frais", () => {
    const x = r("attendre", "payer", "decouvert");
    expect(x.compte.rejets.map((y) => [y.code, y.jourPrevu, y.jourPasse])).toEqual([["loyer", 5, 10]]);
    expect(x.compte.nombres).toBe(6 * 2_800);
    expect(x.couts.agios).toBe(c((16_800 * 0.12) / 360));
    expect(x.cout).toBe(c(5.6 + 20));
    expect(x.fin).toBe("rejet");
    expect(x.relations.banque).toBe("abimee");
  });

  it("la relance : CampusTech au 5 mai, le compte à −2 800 € 4 jours, 3,73 € d'agios, aucun rejet", () => {
    const x = r("relancer", "payer", "decouvert");
    expect(x.compte.jours.find((y) => y.jour === 5)!.solde).toBe(c(-2_800 + 22_656 - 19_700));
    expect(x.compte.rejets).toEqual([]);
    expect(x.compte.joursSousZero).toBe(4);
    expect(x.cout).toBe(c((4 * 2_800 * 0.12) / 360));
    expect(x.cout).toBe(3.73);
  });

  it("le crédit : ramener le plus bas au matelas de 10 000 €, par tranches de 1 000 €, 6 % sur 30 jours et 50 € de frais", () => {
    // Après la relance : 10 000 + 2 800 + 50 → 13 000 € ; 65 € d'intérêts.
    expect(creditDeMai({ client: "relancer", fournisseur: "payer" })).toEqual({ montant: 13_000, interets: 65, frais: 50, cout: 115 });
    // Sans rien : 10 000 + 22 500 + 50 → 33 000 € ; 165 € d'intérêts.
    expect(creditDeMai({ client: "attendre", fournisseur: "payer" }).cout).toBe(c((33_000 * 0.06 * 30) / 360 + 50));
    // Après un étalement, le plus bas (23 600 €) reste au-dessus du matelas : rien à prêter.
    expect(creditDeMai({ client: "relancer", fournisseur: "etaler" }).montant).toBe(0);
    expect(r("attendre", "payer", "credit").compte.plusBas.solde).toBeGreaterThanOrEqual(10_000);
  });

  it("le Dailly : la facture de mars, 39 jours jusqu'au 10 juin, 9,5 % et 30 € ; celle d'avril, 69 jours, si mars est escomptée", () => {
    expect(daillyDeMai({ client: "relancer" })).toMatchObject({ nominal: 22_656, jours: 39, interets: c((22_656 * 0.095 * 39) / 360), frais: 30 });
    expect(daillyDeMai({ client: "relancer" }).cout).toBe(263.17);
    expect(daillyDeMai({ client: "escompter" })).toMatchObject({ jours: 69, interets: c((22_656 * 0.095 * 69) / 360) });
  });

  it("le fournisseur : l'étalement coûte l'intérêt de ses pénalités sur la moitié ; le retard, 10 jours de pénalités et 40 €", () => {
    // Le taux des pénalités : 2,15 % (la BCE) + 10 points, sur 365 jours.
    expect(r("attendre", "etaler", "decouvert").couts.etalement).toBe(c((26_400 * 0.1215 * 30) / 365));
    expect(r("attendre", "retarder", "decouvert").couts.retard).toBe(c(c((52_800 * 0.1215 * 10) / 365) + 40));
  });

  it("la trésorerie de fin de mai, une fois rendu ce que le mois emprunte : celle du plan, moins le coût du mois, pour chaque suite", () => {
    for (const x of toutesLesSuites().map(resultatDeLaSuite)) {
      expect(x.tresorerieNette, JSON.stringify(x.suite)).toBe(c(61_642.39 - x.cout));
    }
  });
});

describe("l'arbre des choix", () => {
  const tous = toutesLesSuites().map(resultatDeLaSuite);

  it("27 suites, chacune calculée ; trois fins nettement différentes", () => {
    expect(tous).toHaveLength(27);
    const fins = (code: string) => tous.filter((x) => x.fin === code).map((x) => [x.suite.client, x.suite.fournisseur, x.suite.banque].join("/"));
    expect(fins("rejet")).toEqual(["attendre/payer/decouvert"]);
    expect(fins("retard")).toHaveLength(9);
    expect(fins("tenu")).toHaveLength(17);
    // Les coûts s'étalent de quelques euros à plus de mille.
    expect(Math.min(...tous.map((x) => x.cout))).toBe(3.73);
    expect(Math.max(...tous.map((x) => x.cout))).toBeGreaterThan(1_000);
  });

  it("les choix précédents changent la situation suivante : le plus bas, le crédit proposé, la facture cédée", () => {
    const bas = CHOIX_DES_DECISIONS[0]!.map((client) => planSansLimite({ client } as never).plusBas.solde);
    expect(new Set(bas).size).toBe(3);
    expect(bas).toEqual([-22_500, -2_800, c(50_000 + 22_202.88 - 52_800 - 19_700)]);
    const credits = new Set(toutesLesSuites().map((x) => creditDeMai(x).montant));
    expect(credits.size).toBeGreaterThanOrEqual(4);
    expect(s.situation(["escompter", "payer"]).options.find((o) => o.code === "dailly")!.texte).toMatch(/avril/);
    expect(s.situation(["attendre", "payer"]).options.find((o) => o.code === "dailly")!.texte).toMatch(/mars/);
  });

  it("la meilleure suite, unique : relancer, payer, rester au découvert, 3,73 € ; la suivante coûte 115 €", () => {
    const b = meilleureSuite();
    expect(b.suite).toEqual({ client: "relancer", fournisseur: "payer", banque: "decouvert" });
    const admises = tous.filter((x) => x.abimees === 0).map((x) => x.cout).sort((a, b) => a - b);
    expect(admises[0]).toBe(b.cout);
    expect(admises[1]).toBe(115);
    expect(s.bilan(["relancer", "payer", "decouvert"]).meilleure).toBe(true);
    expect(s.bilan(["attendre", "payer", "decouvert"]).meilleure).toBe(false);
  });

  it("aucune impasse sans explication : chaque fin se dit, et chaque bilan compare, chiffres à l'appui", () => {
    for (const x of toutesLesSuites()) {
      const codes = [x.client, x.fournisseur, x.banque];
      const bl = s.bilan(codes);
      expect(bl.fin.paragraphes.length, codes.join("/")).toBeGreaterThan(0);
      expect(bl.comparaison.join(" "), codes.join("/")).toMatch(/\d €/);
      expect(bl.eleve.choix).toHaveLength(3);
    }
    expect(s.bilan(["attendre", "payer", "decouvert"]).fin.paragraphes.join(" ")).toMatch(/rejeté le prélèvement du loyer/);
  });
});

describe("le scénario du découvert", () => {
  it("est enregistré, réservé, repris du chapitre « Financer et placer la trésorerie », sans compter parmi les cas dédiés", () => {
    expect(SCENARIOS).toContain(s);
    expect(scenarioParCode("le-decouvert-de-nova")).toBe(s);
    expect(scenariosDuChapitre("financer-et-placer-la-tresorerie")).toEqual([s]);
    expect(lienDuScenario(s)).toBe("/cours/scenario/le-decouvert-de-nova");
    expect(s.libre).toBe(false);
    const ch = CHAPITRES.find((x) => x.code === "financer-et-placer-la-tresorerie")!;
    expect([s.parcours, s.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(197);
    expect(SITUATIONS.map((x) => x.code)).not.toContain(s.code);
  });

  it("trois décisions de trois options, les mêmes codes que le monde", () => {
    expect(s.decisions.map((d) => d.options)).toEqual(CHOIX_DES_DECISIONS);
    for (const [i, d] of s.decisions.entries()) {
      const avant = toutesLesSuites()[0]!;
      const sit = s.situation([avant.client, avant.fournisseur].slice(0, i));
      expect(sit.options.map((o) => o.code), d.id).toEqual(d.options);
    }
  });

  it("les questions : une seule bonne option, jamais la plus longue", () => {
    for (const q of s.questions.questions) {
      const justes = q.options.filter((o) => o.juste);
      expect(justes, q.id).toHaveLength(1);
      const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
    }
    expect(s.questions.questions.length).toBeGreaterThanOrEqual(1);
    expect(s.questions.questions.length).toBeLessThanOrEqual(2);
  });
});

/** Toutes les chaînes d'une valeur, sauf les codes. */
function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "type", "nature", "ton", "geste", "refus"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** Tout ce que le scénario peut servir, sur les 27 suites : les situations, les conséquences, les bilans, les corrigés. */
function textesServis(): string[] {
  const out = chaines(servirLeScenario(s));
  for (const x of toutesLesSuites()) {
    const codes = [x.client, x.fournisseur, x.banque];
    for (let i = 1; i <= 3; i++) out.push(...chaines(corrigerAuScenario(s, { geste: "choisir", suite: codes.slice(0, i) })));
  }
  out.push(...chaines(corrigerAuScenario(s, { etape: s.questions.id, geste: "montrer" })));
  return [...new Set(out)];
}

describe("la langue du scénario", () => {
  const textes = textesServis();
  const sources = [...new Set(chaines(s.questions).concat(textes.map(espacesOrdinaires)))];

  it("se relève", () => {
    expect(textes.length).toBeGreaterThan(150);
  });

  it("ni tiret au milieu d'une phrase, ni tutoiement, ni le lexique que la maison n'emploie plus", () => {
    expect(sources.flatMap(tiretsAuMilieu)).toEqual([]);
    expect(sources.flatMap(tutoiements)).toEqual([]);
    for (const { mot, re } of LEXIQUE_INTERDIT) expect(sources.filter((t) => re.test(t)), mot).toEqual([]);
  });

  it("le signe « − » pour les négatifs, aucun nombre en lettres, aucune valeur absente, le président d'une SAS", () => {
    for (const t of sources) {
      expect(t, t).not.toMatch(/(^|[\s(])-\d/);
      expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(t, t).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
      expect(t, t).not.toMatch(/gérant|gérante|dirigeant/i);
      expect(t, t).not.toMatch(/évènement/i);
      expect(t, t).not.toMatch(/\d,\d{3,}/);
    }
    expect(sources.some((t) => /le président/i.test(t))).toBe(true);
  });

  it("des phrases courtes, et les insécables de la typographie française dans ce qui est servi", () => {
    expect([...phrasesLongues(sources)]).toEqual([]);
    expect(textes.flatMap(espacesOrdinairesFautives)).toEqual([]);
  });
});
