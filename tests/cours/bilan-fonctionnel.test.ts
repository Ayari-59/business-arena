import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BILAN_FONCTIONNEL,
  CROISSANCE_DES_VENTES,
  PLACE_DE_MARCHE,
  STOCK_POUR_LA_GAMME,
  bilanDeLExercice,
  bilanFonctionnel,
} from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { BALANCE_AVANT_INVENTAIRE, CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { VENDRE_PLUS_FINANCER_PLUS, vendrePlus } from "../../src/config/cours/situations/par-chapitre/vendre-plus-financer-plus";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE BILAN FONCTIONNEL ET BFR, SUR L'EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS : VENDRE PLUS,
 * FINANCER PLUS.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de l'exercice
 * (monde/exercice-de-nova.ts : sa balance avant inventaire, ses pièces, et la clôture figée que sa
 * propre garde vérifie), sans les fonctions du chapitre ni le modèle de la clôture ; les valeurs
 * absolues sont épinglées, les variantes (la place de marché, la croissance, l'emprunt gardé, le
 * laboratoire) refaites comme le reste, et les verdicts aussi. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts). Enfin l'export de compatibilité, que quatre
 * autres chapitres lisent encore.
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const f = EXERCICE_DE_NOVA;
const centime = (x: number) => Math.round(x * 100) / 100;
/** Un montant tel que le cours l'écrit : « 985,83 € », « −23 731,40 € ». */
const eur = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`.replace(/^-/, "−");

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(c), ...e.categories.map((k) => k.libelle), ...e.elements(c).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(c), ...tableau];
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "livré", "facturé"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])qu'[^aeiouyéèêàAEIOUYÉÈÀ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|trente|cent) (enceintes?|jeux|jours|mois|échéances|factures|heures?|trimestres?)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((x) => x.libelle)).size, e.id).toBe(champs.length);
      for (const x of champs) {
        expect(Number.isFinite(x.attendu), `${e.id} : ${x.libelle}`).toBe(true);
        expect(Math.round(x.attendu * 10_000) / 10_000, `${e.id} : ${x.libelle}`).toBe(x.attendu);
      }
      // Un montant négatif attendu : la question dit avec quel signe le donner.
      if (champs.some((x) => x.attendu < 0) && !/compte courant/i.test(champs.find((x) => x.attendu < 0)!.libelle)) expect(e.question(cas, etat), e.id).toMatch(/[Nn]égatif/);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
      expect(new Set(e.elements(cas).map((x) => x.libelle)).size, e.id).toBe(e.elements(cas).length);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, sa position voisine, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

/** Le solde d'un compte de la balance avant inventaire : débit positif, crédit négatif. */
const balance = (compte: string) => {
  const l = BALANCE_AVANT_INVENTAIRE.find((x) => x.compte === compte)!;
  return l.debit - l.credit;
};
const TVA = 0.2;
const PRIX = 59;
// Les travaux d'inventaire, à la main sur les pièces de la fiche.
const dotation = centime((60_000 / 6) * (355 / 360));
const stock = 600 * ((1_500 * 22 + 1_500 * 23) / 3_000);
const fnp = { ht: 1_500 * 23, tva: 1_500 * 23 * TVA };
const depreciation = (33_630 / (1 + TVA)) * 0.4;
const provision = 5_000;
const cca = 6_000 * (9 / 12);
const fae = { ht: 200 * PRIX, ttc: 200 * PRIX * (1 + TVA) };
const pca = 120 * PRIX;
// Les intérêts courus : l'échéance du 3 janvier porte 68 000 × 5 % ÷ 4, dont 88 jours sur 90 courus au 31 décembre.
const icne = centime(((68_000 * 0.05) / 4) * (88 / 90));
const interetsDuPlacement = centime((133_000 * 0.03 * 355) / 360);
// L'impôt : la clôture figée de la fiche donne le résultat avant impôt (sa garde le refait) ; 15 % puis 25 %.
const rai = CLOTURE_DE_LA_FICHE.resultatAvantImpot;
const impot = Math.round(42_500 * 0.15 + (rai - 42_500) * 0.25);
const resultatNet = centime(rai - impot);
// Le bilan fonctionnel.
const capital = -balance("101");
const emprunt = -balance("164");
const clientsBruts = balance("411") + fae.ttc;
const ressourcesStables = centime(capital + resultatNet + dotation + depreciation + provision + emprunt);
const frng = centime(ressourcesStables - 60_000);
const fournisseurs = -balance("401") + fnp.ht + fnp.tva;
const dettesSociales = centime(-balance("431") - balance("437") - balance("442"));
const tvaADecaisser = -balance("4455") + fae.ht * TVA;
const actifDExploitation = centime(stock + clientsBruts + fnp.tva + cca);
const passifDExploitation = centime(fournisseurs + dettesSociales + tvaADecaisser + pca);
const bfre = centime(actifDExploitation - passifDExploitation);
const bfrhe = centime(-(impot + icne));
const bfr = centime(bfre + bfrhe);
const banque = balance("512");
const placement = centime(balance("508") + interetsDuPlacement);
const tn = centime(banque + placement);
const caHt = -balance("701") + fae.ht - pca;
const particuliersTtc = f.ventesAuxParticuliers.reduce((t, q) => t + q, 0) * PRIX * (1 + TVA);

describe("le bilan fonctionnel, sur l'exercice de NOVA du monde du cours", () => {
  const ch = BILAN_FONCTIONNEL;

  it("se joue chez NOVA seule, au palier 4 de la comptabilité générale", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.code).toBe("bilan-fonctionnel-et-bfr");
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise", "BUT GEA · Évaluer l'activité de l'organisation"]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(VENDRE_PLUS_FINANCER_PLUS);
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("la fiche, refaite à la main, donne les chiffres de la consigne", () => {
    expect([dotation, stock, fnp.ht, fnp.tva, depreciation, cca, fae.ttc, pca, icne, interetsDuPlacement]).toEqual([9_861.11, 13_500, 34_500, 6_900, 11_210, 4_500, 14_160, 7_080, 831.11, 3_934.58]);
    expect([impot, resultatNet]).toEqual([20_742, 79_225.96]);
    expect([ressourcesStables, frng]).toEqual([323_297.07, 263_297.07]);
    expect([actifDExploitation, passifDExploitation, bfre]).toEqual([118_002, 108_457.27, 9_544.73]);
    // Le besoin en fonds de roulement devient négatif : une ressource.
    expect([bfrhe, bfr, tn]).toEqual([-21_573.11, -12_028.38, 275_325.45]);
    expect(bfr).toBeLessThan(0);
    // CampusTech paie à 60 jours : au 31 décembre, deux factures restent dues (2 × 22 656 €), et Sonora (33 630 €).
    expect(balance("411")).toBe(2 * 22_656 + 33_630);
    expect(banque).toBe(138_390.87);
    expect(centime(frng - bfr)).toBe(tn);
    // Le modèle et la main retombent sur la clôture figée de la fiche.
    expect(CLOTURE_DE_LA_FICHE.fonctionnel).toEqual({
      emploisStables: 60_000,
      ressourcesStables,
      fondsDeRoulement: frng,
      besoinDExploitation: bfre,
      besoinHorsExploitation: bfrhe,
      besoinEnFondsDeRoulement: bfr,
      tresorerieNette: tn,
    });
    expect(caHt).toBe(1_390_276);
    expect(particuliersTtc).toBe(1_330_261.2);
  });

  it("le bilan comptable du 31 décembre s'équilibre, poste par poste", () => {
    const intro = ch.etapes[0]!;
    const t = intro.tableau!(cas);
    const net = Object.fromEntries(t.lignes.map((l) => [l.libelle, l.valeurs[2]]));
    expect(net["Ligne de montage"]).toBe(eur(60_000 - dotation));
    expect(net["Clients (CampusTech, Sonora, facture à établir)"]).toBe(eur(clientsBruts - depreciation));
    expect(net["Compte à terme et ses intérêts courus"]).toBe(eur(placement));
    const actif = 60_000 - dotation + stock + clientsBruts - depreciation + fnp.tva + cca + placement + banque;
    const passif = capital + resultatNet + provision + emprunt + icne + fournisseurs + dettesSociales + tvaADecaisser + impot + pca;
    expect(centime(actif)).toBe(centime(passif));
    expect(net["Total de l'actif"]).toBe(eur(centime(actif)));
    expect(centime(actif)).toBe(CLOTURE_DE_LA_FICHE.totalDuBilan);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    const tri = ch.etapes.find((e) => e.id === "les-reclassements") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Amortissements de la ligne de montage": [dotation, "ressources"],
      "Dépréciation de la créance de Sonora": [depreciation, "ressources"],
      "Provision pour litige": [provision, "ressources"],
      "Emprunt, capital restant dû": [emprunt, "ressources"],
      "Intérêts courus de l'emprunt": [icne, "hors-exploitation"],
      "Ligne de montage, valeur brute": [60_000, "emplois"],
      "TVA à décaisser": [tvaADecaisser, "exploitation"],
      "Impôt sur les sociétés dû": [impot, "hors-exploitation"],
      "Charge constatée d'avance": [cca, "exploitation"],
      "Produit constaté d'avance": [pca, "exploitation"],
      "Compte à terme et ses intérêts courus": [placement, "tresorerie"],
    });
    expect(juste(ch, "les-interets-courus")).toBe("Ceux du placement suivent le placement en trésorerie ; ceux de l'emprunt, dus le 3 janvier, vont hors exploitation");
    expect(attendus(ch, "frng")).toEqual({ "Ressources stables": ressourcesStables, "Fonds de roulement net global": frng });
    expect(attendus(ch, "bfr-d-exploitation")).toEqual({
      "Actif d'exploitation": actifDExploitation,
      "Passif d'exploitation": passifDExploitation,
      "Besoin en fonds de roulement d'exploitation": bfre,
    });
  });

  it("les étapes autonomes : hors exploitation, trésorerie, et l'exercice depuis la création", () => {
    expect(attendus(ch, "hors-exploitation-et-tresorerie")).toEqual({
      "Besoin en fonds de roulement hors exploitation": bfrhe,
      "Besoin en fonds de roulement": bfr,
      "Trésorerie nette, par la trésorerie": tn,
      "Fonds de roulement − besoin en fonds de roulement": tn,
    });
    // Le 6 janvier au soir : l'apport et le prêt reçus, la ligne payée TTC, 133 000 € placés.
    const frng0 = 150_000 + 80_000 - 60_000;
    const bfr0 = 12_000;
    const tn0 = 150_000 + 80_000 - 72_000;
    expect([frng0, bfr0, tn0, tn0 - 133_000]).toEqual([170_000, 12_000, 158_000, 25_000]);
    expect(attendus(ch, "depuis-la-creation")).toEqual({
      "Fonds de roulement au 6 janvier": frng0,
      "Besoin en fonds de roulement au 6 janvier": bfr0,
      "Variation du fonds de roulement": centime(frng - frng0),
      "Variation du besoin en fonds de roulement": centime(bfr - bfr0),
      "Variation de la trésorerie nette": centime(tn - tn0),
    });
    // Le fonds de roulement a grandi de la CAF moins le capital remboursé (3 échéances de 4 000 €).
    const caf = centime(resultatNet + dotation + depreciation + provision);
    expect(caf).toBe(CLOTURE_DE_LA_FICHE.capaciteDAutofinancement);
    expect(centime(caf - 3 * 4_000)).toBe(centime(frng - frng0));
    expect([centime(frng - frng0), centime(bfr - bfr0), centime(tn - tn0)]).toEqual([93_297.07, -24_028.38, 117_325.45]);
    expect(juste(ch, "predire-la-variation")).toBe("De plus que le résultat net");
    // Le besoin négatif est dit à l'élève : une ressource.
    const hors = ch.etapes.find((e) => e.id === "hors-exploitation-et-tresorerie") as EtapeMontants;
    expect(hors.explication(cas, etatVide).join(" ")).toContain(`Le besoin en fonds de roulement est négatif, ${eur(bfr)} : `);
    expect(centime(tn - tn0)).toBeGreaterThan(resultatNet);
  });

  it("le curseur de la place de marché, refait à la main avec le placement", () => {
    // Fonds de roulement face au besoin + d jours de ventes aux particuliers TTC.
    const unJour = particuliersTtc / 360;
    expect(centime(unJour)).toBe(3_695.17);
    const delai = Math.floor(tn / unJour);
    expect(delai).toBe(74);
    expect(curseur(ch, "la-place-de-marche")).toEqual({
      attendu: delai,
      bornes: [0, 120],
      droites: [frng, bfr, frng, centime(bfr + 120 * unJour)],
      lecture: {
        "Créance sur la place de marché": centime(delai * unJour),
        "Besoin en fonds de roulement": centime(bfr + delai * unJour),
        "Fonds de roulement": frng,
        "Trésorerie nette": centime(tn - delai * unJour),
        "Dont le compte courant, hors compte à terme": centime(banque - delai * unJour),
      },
    });
    expect(centime(tn - delai * unJour)).toBe(1_882.87);
    // La position voisine : à 75 jours, la trésorerie nette passe sous zéro.
    expect(tn - 75 * unJour).toBeLessThan(0);
    // Le compte courant, lui, tient 37 jours : le compte à terme est bloqué jusqu'au 6 janvier.
    expect(Math.floor(banque / unJour)).toBe(37);
    expect(juste(ch, "predire-la-place-de-marche")).toBe("Le fonds de roulement ne bouge pas ; le besoin grossit, et la trésorerie baisse d'autant");
  });

  it("le BFR normatif, en jours de chiffre d'affaires", () => {
    const enJours = centime((bfre / caHt) * 360);
    const coefficient = Math.round((particuliersTtc / caHt) * 10_000) / 10_000;
    expect(attendus(ch, "le-bfr-normatif")).toEqual({
      "Besoin d'exploitation, en jours de chiffre d'affaires": enJours,
      "Coefficient de structure des ventes aux particuliers": coefficient,
      "Créance de la place de marché, en jours de chiffre d'affaires": centime((30 * particuliersTtc) / caHt),
    });
    expect([enJours, coefficient, centime((30 * particuliersTtc) / caHt)]).toEqual([2.47, 0.9568, 28.7]);
    expect(PLACE_DE_MARCHE.delai).toBe(30);
  });

  it("le laboratoire du besoin : le stock de la gamme, rendu par les délais", () => {
    const l = laboratoire(ch, "le-laboratoire-du-besoin");
    expect(l.depart).toEqual({ delaiCampusTech: 60, delaiFournisseur: 22, stock: 600, placement: 133_000 });
    expect(l.solution).toEqual({ delaiCampusTech: 40, delaiFournisseur: 51, stock: STOCK_POUR_LA_GAMME, placement: 133_000 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Fonds de roulement": frng,
      "Stock de composants": stock,
      "Besoin en fonds de roulement d'exploitation": bfre,
      "Besoin en fonds de roulement": bfr,
      "Trésorerie nette": tn,
      "Dont le compte courant": banque,
      "Dont le compte à terme et ses intérêts": placement,
      "Effet sur la trésorerie nette": 0,
    });
    // À la main : CampusTech à 40 jours encaisse la facture de novembre (320 × 59 € TTC, le 20 novembre
    // + 40 jours = le 30 décembre, en mois de 30 jours) avant la clôture ;
    // le fournisseur à 51 jours laisse due la facture du 10 novembre (2 070 jeux à 22 € TTC) ; le stock de
    // 2 400 jeux de plus coûte 22,50 € hors taxes chacun, payés TTC.
    const campustech = 320 * PRIX * (1 + TVA);
    const novembre = (f.ventesAuxParticuliers[10]! + 320) * 22 * (1 + TVA);
    const jeux = (STOCK_POUR_LA_GAMME - 600) * (stock / 600);
    expect([campustech, centime(novembre), jeux, centime(jeux * (1 + TVA))]).toEqual([22_656, 54_648, 54_000, 64_800]);
    const effet = centime(campustech + novembre - jeux * (1 + TVA));
    // Sans toucher CampusTech (déjà à 60 jours), le fournisseur seul ne rend pas le stock : le défi reste à relever.
    expect(centime(novembre - jeux * (1 + TVA))).toBe(-10_152);
    expect(l.e.defi(cas).atteint({ ...l.depart, delaiFournisseur: 51, stock: STOCK_POUR_LA_GAMME })).toBe(false);
    expect(l.aLaSolution).toEqual({
      "Fonds de roulement": frng,
      "Stock de composants": stock + jeux,
      "Besoin en fonds de roulement d'exploitation": centime(bfre - effet),
      "Besoin en fonds de roulement": centime(bfr - effet),
      "Trésorerie nette": centime(tn + effet),
      "Dont le compte courant": centime(banque + effet),
      "Dont le compte à terme et ses intérêts": placement,
      "Effet sur la trésorerie nette": effet,
    });
    expect(effet).toBe(12_504);
    expect(juste(ch, "predire-le-stock")).toBe("De 27 €, son prix toutes taxes comprises");
    // CampusTech part de son délai convenu ; au-delà, le laboratoire le dit : un retard.
    expect(l.e.question(cas)).toContain("au-delà des 60 jours convenus, ce serait un retard");
  });

  it("le graphique du laboratoire : la trésorerie nette descend par marches selon le délai de CampusTech", () => {
    const { e, depart } = laboratoire(ch, "le-laboratoire-du-besoin");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("delaiCampusTech");
    const [tresorerie, besoin, fonds] = g.courbes;
    const a = (d: number) => [tresorerie!.valeur({ ...depart, delaiCampusTech: d }), besoin!.valeur({ ...depart, delaiCampusTech: d }), fonds!.valeur({ ...depart, delaiCampusTech: d })];
    // Une facture de CampusTech (22 656 € TTC, le 20 du mois) reste due si 20 du mois + délai dépasse le
    // 30 décembre, en mois de 30 jours : novembre au-delà de 40 jours, octobre au-delà de 70, septembre au-delà de 100.
    const facture = 320 * PRIX * (1 + TVA);
    expect(a(30)).toEqual([centime(tn + facture), centime(bfr - facture), frng]);
    expect(a(40)).toEqual([centime(tn + facture), centime(bfr - facture), frng]);
    expect(a(41)).toEqual([tn, bfr, frng]);
    expect(a(60)).toEqual([tn, bfr, frng]);
    expect(a(70)).toEqual([tn, bfr, frng]);
    expect(a(71)).toEqual([centime(tn - facture), centime(bfr + facture), frng]);
    expect(a(100)).toEqual([centime(tn - facture), centime(bfr + facture), frng]);
    expect(a(101)).toEqual([centime(tn - 2 * facture), centime(bfr + 2 * facture), frng]);
    expect(a(120)).toEqual([centime(tn - 2 * facture), centime(bfr + 2 * facture), frng]);
    expect(centime(tn + facture)).toBe(297_981.45);
  });

  it("le placement dans le laboratoire : rien placé, la trésorerie nette perd les intérêts, le compte courant prend tout", () => {
    const { e, depart } = laboratoire(ch, "le-laboratoire-du-besoin");
    const lire = Object.fromEntries(e.lecture(cas, { ...depart, placement: 0 }).map((l) => [l.libelle, l.montant]));
    // Sans placement : 3 934,58 € d'intérêts en moins, l'impôt recalculé sur le résultat avant impôt qui baisse d'autant.
    const impotSans = Math.round(42_500 * 0.15 + (rai - interetsDuPlacement - 42_500) * 0.25);
    const frngSans = centime(capital + (rai - interetsDuPlacement - impotSans) + dotation + depreciation + provision + emprunt - 60_000);
    expect(impotSans).toBe(19_758);
    expect(lire["Fonds de roulement"]).toBe(frngSans);
    expect(lire["Trésorerie nette"]).toBe(centime(tn - interetsDuPlacement));
    expect(lire["Dont le compte courant"]).toBe(centime(banque + 133_000));
    expect(lire["Dont le compte à terme et ses intérêts"]).toBe(0);
  });

  it("les étapes d'expert : les ratios de rotation, et la critique du ratio fournisseurs", () => {
    const achatsTtc = (balance("601") + fnp.ht) * (1 + TVA);
    const consommation = balance("601") + fnp.ht - stock;
    expect(attendus(ch, "les-ratios-de-rotation")).toEqual({
      "Délai de règlement des clients": centime((clientsBruts * 360) / (caHt * (1 + TVA))),
      "Délai de règlement des fournisseurs": centime((fournisseurs * 360) / achatsTtc),
      "Durée de rotation du stock": centime((stock * 360) / consommation),
    });
    expect([centime((clientsBruts * 360) / (caHt * (1 + TVA))), centime((fournisseurs * 360) / achatsTtc), centime((stock * 360) / consommation)]).toEqual([20.09, 45.5, 9.34]);
    expect(juste(ch, "le-ratio-et-le-contrat")).toBe("De décembre : le dépannage de Composants Express s'ajoute à la facture du mois, et le bilan est une photo de ce jour");
  });

  it("les étapes d'expert : la croissance à structure constante", () => {
    expect(CROISSANCE_DES_VENTES).toBe(0.2);
    expect(attendus(ch, "la-croissance")).toEqual({
      "Chiffre d'affaires visé": centime(caHt * 1.2),
      "Besoin d'exploitation après la croissance": centime(bfre * 1.2),
      "Supplément de besoin à financer": centime(centime(bfre * 1.2) - bfre),
    });
    expect([centime(caHt * 1.2), centime(bfre * 1.2), centime(centime(bfre * 1.2) - bfre)]).toEqual([1_668_331.2, 11_453.68, 1_908.95]);
  });

  it("les étapes d'expert : emprunter à 5 % pour garder une trésorerie placée à 3 %", () => {
    const interets = balance("6611") + icne;
    const place = centime((80_000 * 0.03 * 355) / 360);
    const net = centime((interets - place) * (1 - 0.25));
    expect(attendus(ch, "garder-la-tresorerie")).toEqual({
      "Intérêts de l'emprunt sur l'exercice": interets,
      "Ce que le capital emprunté aurait rapporté placé": place,
      "Coût net de l'emprunt, après impôt": net,
    });
    expect([interets, place, centime(interets - place), net]).toEqual([3_681.11, 2_366.67, 1_314.44, 985.83]);
    // Le bénéfice dépasse le plafond du taux réduit : le taux marginal est le taux normal.
    expect(rai).toBeGreaterThan(42_500);
    expect(juste(ch, "emprunter-pour-garder")).toBe("Garder se défend : la réserve a coûté 985,83 € après impôt, et finance la seconde ligne sans nouveau prêt");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : vendre plus, financer plus", () => {
  const s = VENDRE_PLUS_FINANCER_PLUS;
  const bfreApres = centime(bfre * 1.2);
  const supplement = centime(bfreApres - bfre);
  const particuliersApres = centime(particuliersTtc * 1.2);
  const creance = centime((particuliersApres * 30) / 360);
  const besoinApres = centime(bfreApres + bfrhe + creance);
  const tnApres = centime(frng - besoinApres);
  // Le 1er janvier, 22 656 € (la facture d'octobre de CampusTech, rentrée le 20 décembre) quittent le compte
  // courant pour la réserve : le plan ne touche ni à elle ni au compte à terme.
  const versement = 22_656;
  const compteCourantApres = centime(tnApres - placement - versement);
  const sansPlace = centime(banque - versement - supplement);

  it("tient la forme d'un cas dédié, chez NOVA seule", () => {
    casDedie(s, BILAN_FONCTIONNEL);
    expect(s.code).toBe("vendre-plus-financer-plus");
    expect(s.commanditaire).toBe("Le directeur financier");
    expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  });

  it("le bilan fonctionnel, puis la croissance à structure constante", () => {
    expect(attendus(s, "au-31-decembre")).toEqual({ "Fonds de roulement net global": frng, "Besoin en fonds de roulement": bfr, "Trésorerie nette": tn });
    const tri = s.etapes.find((e) => e.id === "ce-qui-suit-les-ventes") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Actif d'exploitation": [actifDExploitation, "suit"],
      "Passif d'exploitation": [passifDExploitation, "suit"],
      "Impôt dû et intérêts courus": [-bfrhe, "fixe"],
      Emprunt: [emprunt, "fixe"],
      "Ligne de montage, valeur brute": [60_000, "fixe"],
    });
    expect(attendus(s, "a-structure-constante")).toEqual({
      "Besoin d'exploitation, en jours de chiffre d'affaires": 2.47,
      "Besoin d'exploitation après la croissance": bfreApres,
      "Supplément de besoin, à structure constante": supplement,
    });
  });

  it("le croisement : la trésorerie nette reste positive, le compte courant passe à découvert", () => {
    expect(attendus(s, "avec-la-place-de-marche")).toEqual({
      "Créance sur la place de marché": creance,
      "Besoin en fonds de roulement après la croissance": besoinApres,
      "Trésorerie nette après la croissance": tnApres,
      "Compte courant après la croissance": compteCourantApres,
    });
    expect([particuliersApres, creance, besoinApres, tnApres, compteCourantApres]).toEqual([1_596_313.44, 133_026.12, 122_906.69, 140_390.38, -19_200.2]);
    expect(tnApres).toBeGreaterThan(0);
    expect(compteCourantApres).toBeLessThan(0);
    // Le compte courant de l'an prochain part de 115 734,87 €, la réserve versée.
    expect(centime(banque - versement)).toBe(115_734.87);
    // Sans le versement, la banque du 31 décembre aurait financé le plan : le croisement aurait disparu.
    expect(centime(tnApres - placement)).toBe(3_455.8);
  });

  it("le curseur du cas, à rebours : le délai de reversement que le compte courant supporte", () => {
    const unJour = particuliersApres / 360;
    const delai = Math.floor(sansPlace / unJour);
    expect([sansPlace, delai]).toEqual([113_825.92, 25]);
    expect(curseur(s, "le-delai-a-negocier")).toEqual({
      attendu: delai,
      bornes: [0, 60],
      droites: [sansPlace, 0, sansPlace, centime(60 * unJour)],
      lecture: {
        "Créance sur la place de marché": centime(delai * unJour),
        "Besoin en fonds de roulement": centime(bfreApres + bfrhe + delai * unJour),
        "Trésorerie nette": centime(frng - (bfreApres + bfrhe + delai * unJour)),
        "Compte courant": centime(sansPlace - delai * unJour),
      },
    });
    expect(centime(sansPlace - delai * unJour)).toBe(2_970.82);
    expect(sansPlace - 26 * unJour).toBeLessThan(0);
  });

  it("le verdict : pas à 30 jours, un reversement à 25 jours au plus", () => {
    const r = vendrePlus(cas);
    expect(r.verdict).toBe("reverser-plus-vite");
    // L'erreur de base : la créance comptée hors taxes.
    expect(r.compteCourantHorsTaxes).toBe(centime(sansPlace - (particuliersApres / 1.2) * (30 / 360)));
    expect(r.compteCourantHorsTaxes).toBe(2_970.82);
    expect(juste(s, "reponse")).toBe("Pas à 30 jours : le compte courant passerait à −19 200,20 € ; il faut un reversement à 25 jours au plus");
    const reponse = s.etapes.find((e) => e.id === "reponse") as EtapeChoix;
    expect(reponse.options(cas, etatVide).map((o) => o.texte)).toContain("Oui, de justesse : le compte courant resterait à 2 970,82 €, sans découvert");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("l'export de compatibilité : l'année figée des neuf entreprises, que quatre autres chapitres lisent", () => {
  it("chez NOVA, les chiffres de l'année figée, au centime", () => {
    const b = bilanFonctionnel(cas);
    expect(b.apres).toEqual({ brut: 205_000, amortissements: 20_000, ressourcesStables: 308_416.25, frng: 103_416.25, bfr: 109_874.12, tresorerieActive: 0, tn: -6_457.86 });
    expect(b.avant.tn).toBe(25_000);
    expect(b.ventes).toBe(1_452_521);
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s, le bilan s'équilibre et la trésorerie nette vaut le fonds de roulement moins le besoin", (code) => {
    const b = bilanFonctionnel(casDeLEntreprise(code));
    for (const [m, x] of [
      [b.debut, b.avant],
      [b.fin, b.apres],
    ] as const) {
      const actif = m.immobilisationsNettes + m.stocks + m.creances + m.placements + m.banque + Math.max(0, -m.tva);
      const passif = m.capitauxPropres + m.emprunts + m.fournisseurs + m.decouvert + Math.max(0, m.tva);
      expect(actif).toBeCloseTo(passif, 1);
      expect(x.tn).toBeCloseTo(x.frng - x.bfr, 1);
    }
    expect(b.variationTn).toBeCloseTo(b.variationFrng - b.variationBfr, 1);
  });

  it("le chapitre ne le lit plus : ses chiffres viennent de l'exercice du cours", () => {
    expect(bilanDeLExercice(cas).fondsDeRoulement).toBe(frng);
    expect(bilanDeLExercice(cas).fondsDeRoulement).not.toBe(bilanFonctionnel(cas).apres.frng);
  });
});
