import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { CHARGE_D_ASSURANCE_DE_N_PLUS_1, REGULARISATIONS, regularisationsDeNova } from "../../src/config/cours/chapitres/regularisations";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { DUREE_DU_CONTRAT_EN_MOIS, L_ASSURANCE_SUR_PLUSIEURS_ANNEES, REMISE_SUR_DEUX_ANS } from "../../src/config/cours/situations/par-chapitre/l-assurance-sur-plusieurs-annees";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeEcriture, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { equilibree } from "../../src/pedagogy/cours/etats";

/**
 * LES RÉGULARISATIONS DE FIN D'EXERCICE, SUR L'EXERCICE DE NOVA DU MONDE DU COURS, ET LEUR CAS :
 * L'ASSURANCE SUR PLUSIEURS ANNÉES.
 *
 * Chaque chiffre attendu est refait ici à la main sur les hypothèses de la fiche
 * (monde/exercice-de-nova.ts), sans les fonctions du chapitre ni le modèle de la clôture : la
 * convention des jours (mois de 30 jours, jours compris), le prix de l'enceinte, la TVA, la prime, les
 * livraisons de décembre, le placement. Le résultat avant les régularisations n'est plus fabriqué :
 * il se refait de la balance et des autres travaux, et retombe, régularisé, sur le résultat avant
 * impôt de la fiche. Les curseurs, le laboratoire, les variantes et les verdicts sont épinglés ; les
 * gardes de texte sont celles de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

// La fiche, relue une fois.
const PRIX = 59;
const TVA = 0.2;
const PRIME = 6_000;
const MOIS_COUVERTS = 12;
const PAR_MOIS = PRIME / MOIS_COUVERTS;
const SOUSCRIPTION = 10;
const JEUX = 1_500;
const PRIX_DU_JEU = 23;
const URGENTE = 200;
const FACTUREES = 320;
const EN_JANVIER = 120;
const PLACE = 133_000;
const TAUX_DU_PLACEMENT = 0.03;
// Du 6 janvier au 31 décembre, jours compris, en mois de 30 jours : 25 jours de janvier, puis 11 mois.
const JOURS_DU_PLACEMENT = 25 + 11 * 30;

// Les travaux déjà passés quand le chapitre s'ouvre, refaits à la main.
const RESULTAT_DE_LA_BALANCE = 134_715.6;
const DOTATION = centime((60_000 / 6) * (JOURS_DU_PLACEMENT / 360));
const STOCK_FINAL = 600 * ((1_500 * 22 + 1_500 * 23) / 3_000);
const DEPRECIATION = centime((33_630 / 1.2) * 0.4);
const PROVISION = 5_000;
const INTERETS_COURUS_DE_L_EMPRUNT = centime(68_000 * 0.05 * (88 / 360));
const AVANT = centime(RESULTAT_DE_LA_BALANCE - DOTATION + STOCK_FINAL - DEPRECIATION - PROVISION - INTERETS_COURUS_DE_L_EMPRUNT);

// Les régularisations, refaites à la main.
const CCA = PAR_MOIS * (MOIS_COUVERTS - (12 - SOUSCRIPTION + 1));
const FNP = { ht: JEUX * PRIX_DU_JEU, tva: JEUX * PRIX_DU_JEU * TVA, ttc: JEUX * PRIX_DU_JEU * (1 + TVA) };
const FAE = { ht: URGENTE * PRIX, tva: centime(URGENTE * PRIX * TVA), ttc: centime(URGENTE * PRIX * (1 + TVA)) };
const PCA = EN_JANVIER * PRIX;
const PLACEMENT = centime(PLACE * TAUX_DU_PLACEMENT * (JOURS_DU_PLACEMENT / 360));
const EFFET_SUR_PIECES = CCA - FNP.ht + FAE.ht - PCA;
const EFFET_TOTAL = centime(EFFET_SUR_PIECES + PLACEMENT);
const APRES = centime(AVANT + EFFET_TOTAL);

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "ecriture": {
      const x = e.ecriture(c);
      return [e.titre, e.evenement(c), ...e.indices(c), ...e.explication(c, etat), x.libelle, x.date, ...x.lignes.flatMap((l) => [l.role, l.indice])];
    }
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
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|trente|cent) (enceintes?|heures?|trimestres?|mois|jours|jeux|points)\b/i);
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
        expect(Math.round(x.attendu * 100) / 100, `${e.id} : ${x.libelle}`).toBe(x.attendu);
      }
      // Sur un effet ou un écart, la question dit avec quel signe le donner.
      if (champs.some((x) => /^(Écart|Effet)/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un/);
    }
    if (e.type === "ecriture") {
      // L'écriture attendue s'équilibre, et sa correction se corrige juste.
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
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
  expect(e.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Les lignes d'une écriture attendue : compte, sens et montant. */
function lignes(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeEcriture;
  expect(e.type, id).toBe("ecriture");
  return e.ecriture(cas).lignes.map((l) => [l.compte, l.sens, l.montant]);
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
    voisine: Object.fromEntries(e.lecture(cas, e.sens === "plus-grande" ? k.attendu + 1 : k.attendu - 1).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, defi: d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), lire, reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P2 · Contrôle et production de l'information financière", "bts-cg"],
  ["DCG UE9 · Comptabilité", "dcg"],
  ["BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation", "but-gea"],
] as const;

describe("les régularisations de fin d'exercice, à l'exercice de NOVA du monde du cours", () => {
  const ch = REGULARISATIONS;

  it("se jouent chez NOVA seule, au palier 4 de la comptabilité générale, avec leurs blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.code).toBe("regularisations-de-fin-d-exercice");
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.ouverture).toBeUndefined();
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(L_ASSURANCE_SUR_PLUSIEURS_ANNEES);
  });

  it("le résultat avant les régularisations n'est plus fabriqué : la balance et les autres travaux, refaits à la main", () => {
    expect([DOTATION, STOCK_FINAL, DEPRECIATION, INTERETS_COURUS_DE_L_EMPRUNT]).toEqual([9_861.11, 13_500, 11_210, 831.11]);
    expect(AVANT).toBe(121_313.38);
    expect(AVANT).not.toBe(118_761.67);
    const intro = ch.etapes[0]!;
    const t = intro.tableau!(cas);
    expect(Object.fromEntries(t.lignes.map((l) => [l.libelle, l.valeurs[0]]))).toEqual({
      "Résultat de la balance avant inventaire": "134 715,60 €",
      "La dotation aux amortissements de la ligne": "−9 861,11 €",
      "Le stock final de composants": "13 500 €",
      "La créance de Sonora, reclassée en douteuse et dépréciée": "−11 210 €",
      "La provision pour litige": "−5 000 €",
      "Les intérêts courus de l'emprunt": "−831,11 €",
      "Résultat avant impôt, avant les régularisations": "121 313,38 €",
    });
    // Régularisé, il retombe sur le résultat avant impôt de la fiche.
    expect(APRES).toBe(99_967.96);
    expect(regularisationsDeNova(cas)).toMatchObject({ avant: AVANT, apres: APRES });
  });

  it("la charge constatée d'avance, guidée : neuf mois sur douze, à la main", () => {
    expect(CCA).toBe(4_500);
    expect(attendus(ch, "part-d-avance")).toEqual({ "Mois de couverture dans N+1": 9, "Charge constatée d'avance": CCA, "Charge d'assurance de l'exercice": PRIME - CCA });
    expect(lignes(ch, "charge-d-avance")).toEqual([
      ["486", "debit", CCA],
      ["616", "credit", CCA],
    ]);
  });

  it("les écritures de décembre, avec leur TVA : facture non parvenue, facture à établir, produit constaté d'avance, intérêts courus", () => {
    expect([FNP.ht, FNP.tva, FNP.ttc]).toEqual([34_500, 6_900, 41_400]);
    expect(lignes(ch, "facture-non-parvenue")).toEqual([
      ["601", "debit", FNP.ht],
      ["44586", "debit", FNP.tva],
      ["408", "credit", FNP.ttc],
    ]);
    expect([FAE.ht, FAE.tva, FAE.ttc]).toEqual([11_800, 2_360, 14_160]);
    expect(lignes(ch, "facture-a-etablir")).toEqual([
      ["418", "debit", FAE.ttc],
      ["701", "credit", FAE.ht],
      ["44587", "credit", FAE.tva],
    ]);
    // Le produit constaté d'avance est hors taxes : la TVA de la facture reste due. La facture du
    // 20 décembre porte les 320 enceintes du mois ; 200 sont livrées en décembre, 120 en janvier.
    expect([f.campustech.enceintesParFacture, f.livraisonDiffereeDeDecembre.enceintes, FACTUREES - EN_JANVIER]).toEqual([FACTUREES, EN_JANVIER, 200]);
    expect(PCA).toBe(7_080);
    expect(lignes(ch, "produit-d-avance")).toEqual([
      ["701", "debit", PCA],
      ["487", "credit", PCA],
    ]);
    expect(JOURS_DU_PLACEMENT).toBe(355);
    expect(PLACEMENT).toBe(3_934.58);
    expect(lignes(ch, "interets-du-placement")).toEqual([
      ["5088", "debit", PLACEMENT],
      ["764", "credit", PLACEMENT],
    ]);
    expect(lignes(ch, "extourne-assurance")).toEqual([
      ["616", "debit", CCA],
      ["486", "credit", CCA],
    ]);
  });

  it("le résultat régularisé, autonome : l'effet des quatre régularisations, puis du placement", () => {
    expect(EFFET_SUR_PIECES).toBe(-25_280);
    expect(attendus(ch, "resultat")).toEqual({
      "Effet des quatre régularisations sur pièces": EFFET_SUR_PIECES,
      "Effet de toutes les régularisations": EFFET_TOTAL,
      "Résultat avant impôt": APRES,
    });
    expect(EFFET_TOTAL).toBe(-21_345.42);
  });

  it("le curseur du mois de souscription, refait à la main : la part de N+1 rattrape celle de N au 1er juillet", () => {
    // Souscrite le 1er du mois m, la prime laisse 500 × (m − 1) à N+1 et 500 × (13 − m) à N.
    const k = curseur(ch, "le-mois-de-souscription");
    expect(k).toMatchObject({
      attendu: 7,
      bornes: [1, 12],
      droites: [0, PRIME, PAR_MOIS * 11, PAR_MOIS],
      lecture: { "Mois de couverture dans N": 6, "Mois de couverture dans N+1": 6, "Charge d'assurance de N": 3_000, "Charge constatée d'avance": 3_000 },
      voisine: { "Mois de couverture dans N": 7, "Mois de couverture dans N+1": 5, "Charge d'assurance de N": 3_500, "Charge constatée d'avance": 2_500 },
    });
    // Au mois de la fiche, le curseur redonne la charge constatée d'avance de l'étape suivante.
    const e = ch.etapes.find((x) => x.id === "le-mois-de-souscription") as EtapeCurseur;
    expect(Object.fromEntries(e.lecture(cas, SOUSCRIPTION).map((l) => [l.libelle, l.montant]))["Charge constatée d'avance"]).toBe(CCA);
    expect(juste(ch, "predire-la-prime")).toBe("Plus petite : plus de mois de couverture tombent dans N");
  });

  it("le laboratoire des pièces : un effet net nul, et deux régularisations encore à passer", () => {
    const l = laboratoire(ch, "le-laboratoire-des-pieces");
    expect(l.depart).toEqual({ mois: SOUSCRIPTION, pca: EN_JANVIER, fae: URGENTE, fnp: 1 });
    expect(l.solution).toEqual({ mois: 1, pca: EN_JANVIER, fae: EN_JANVIER, fnp: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Charge constatée d'avance (assurance)": CCA,
      "Facture non parvenue (composants)": -FNP.ht,
      "Facture à établir (CampusTech)": FAE.ht,
      "Produit constaté d'avance (CampusTech)": -PCA,
      "Effet net des quatre régularisations": EFFET_SUR_PIECES,
      "Régularisations à passer": 4,
      "Résultat avant impôt, régularisé": APRES,
    });
    // À la solution : la prime au 1er janvier, la facture du grossiste avant la clôture, 120 enceintes de chaque côté.
    const regularise = centime(APRES - CCA + (EN_JANVIER - URGENTE) * PRIX);
    expect(l.aLaSolution).toEqual({
      "Charge constatée d'avance (assurance)": 0,
      "Facture non parvenue (composants)": 0,
      "Facture à établir (CampusTech)": EN_JANVIER * PRIX,
      "Produit constaté d'avance (CampusTech)": -EN_JANVIER * PRIX,
      "Effet net des quatre régularisations": 0,
      "Régularisations à passer": 2,
      "Résultat avant impôt, régularisé": regularise,
    });
    expect(regularise).toBe(90_747.96);
    // La date de la facture du grossiste ne change que les pièces, pas le résultat régularisé.
    expect(l.lire({ ...l.depart, fnp: 0 })["Résultat avant impôt, régularisé"]).toBe(APRES);
    // Avec la facture en janvier, aucune autre position ne compense la facture non parvenue.
    expect(l.lire({ mois: 12, pca: 0, fae: URGENTE, fnp: 1 })["Effet net des quatre régularisations"]).toBe(PAR_MOIS * 11 + FAE.ht - FNP.ht);
    expect(PAR_MOIS * 11 + FAE.ht - FNP.ht).toBeLessThan(0);
    // Un effet nul sans régularisation ne relève pas le défi.
    expect(l.defi.atteint({ mois: 1, pca: 0, fae: 0, fnp: 0 })).toBe(false);
    expect(juste(ch, "predire-l-effet-net")).toBe("Baisser le résultat");
  });

  it("les étapes d'expert : ce que garde N+1 après les extournes, et la nouvelle prime à rebours", () => {
    const extournes = -EFFET_TOTAL;
    const aLEcheance = PLACE * TAUX_DU_PLACEMENT;
    const pieces = aLEcheance - FNP.ht + FAE.ht;
    expect(attendus(ch, "ce-que-garde-n-plus-1")).toEqual({
      "Effet des extournes sur le résultat de N+1": extournes,
      "Effet des pièces de janvier": pieces,
      "Ce que N+1 garde de ces opérations": centime(extournes + pieces),
    });
    expect([extournes, pieces, centime(extournes + pieces)]).toEqual([21_345.42, -18_710, 2_635.42]);
    // N+1 garde exactement sa part : 9 mois d'assurance, les 120 enceintes de janvier, 5 jours d'intérêts.
    expect(centime(extournes + pieces)).toBe(centime(-CCA + PCA + PLACE * TAUX_DU_PLACEMENT * (5 / 360)));
    // La charge de N+1 = 9 mois de l'ancienne prime (l'extourne) + 3 mois de la nouvelle.
    expect(CHARGE_D_ASSURANCE_DE_N_PLUS_1).toBe(6_150);
    const part = CHARGE_D_ASSURANCE_DE_N_PLUS_1 - CCA;
    const nouvelle = (part * 12) / 3;
    expect(attendus(ch, "a-rebours")).toEqual({
      "Part de la nouvelle prime dans N+1": part,
      "Nouvelle prime annuelle": nouvelle,
      "Charge constatée d'avance au 31 décembre N+1": (nouvelle * 9) / 12,
    });
    expect([part, nouvelle, (nouvelle * 9) / 12]).toEqual([1_650, 6_600, 4_950]);
  });

  it("les verdicts : la facture trop tôt, l'extourne, la facture qu'on voudrait laisser à N+1", () => {
    expect(juste(ch, "facture-d-avance")).toBe("Il retire de l'exercice la part livrée en janvier, 7 080 € hors taxes");
    expect(juste(ch, "extourne")).toBe("Extourner les régularisations : passer, le 1er janvier, l'écriture inverse de chacune");
    expect(juste(ch, "la-facture-oubliee")).toBe("Sans elle, N serait gonflé de 34 500 € et N+1 diminué d'autant, alors que les jeux sont consommés ou en stock en N");
    // Le distracteur TVA comprise vaut bien le hors taxes × 1,2.
    const options = (ch.etapes.find((x) => x.id === "facture-d-avance") as EtapeChoix).options(cas, etatVide).map((o) => o.texte);
    expect(options).toContain("Il retire 8 496 €, la part livrée en janvier TVA comprise");
    expect(PCA * (1 + TVA)).toBe(8_496);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : l'assurance sur plusieurs années", () => {
  const s = L_ASSURANCE_SUR_PLUSIEURS_ANNEES;
  const ch = REGULARISATIONS;
  // La proposition du courtier, refaite à la main.
  const prime = PRIME * 2 * (1 - 0.05);
  const moisDansNPlus1 = 3;
  const partDeNPlus1 = (prime * moisDansNPlus1) / 24;
  const avancee = prime - PRIME;
  const interetsPerdus = avancee * TAUX_DU_PLACEMENT;

  it("tient la forme d'un cas dédié, et reprend la prime de la fiche", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La gérante");
    expect([DUREE_DU_CONTRAT_EN_MOIS, REMISE_SUR_DEUX_ANS]).toEqual([24, 0.05]);
    expect(f.assurance).toEqual({ prime: PRIME, date: { jour: 1, mois: SOUSCRIPTION }, moisCouverts: MOIS_COUVERTS });
  });

  it("la prime et la charge de N+1, extourne comprise, puis les exercices suivants", () => {
    expect(prime).toBe(11_400);
    expect(attendus(s, "part-de-n-plus-1")).toEqual({
      "Prime du contrat": prime,
      "Mois du contrat dans N+1": moisDansNPlus1,
      "Charge d'assurance de N+1": CCA + partDeNPlus1,
      "Charge constatée d'avance au 31 décembre N+1": prime - partDeNPlus1,
    });
    expect([partDeNPlus1, CCA + partDeNPlus1, prime - partDeNPlus1]).toEqual([1_425, 5_925, 9_975]);
    expect(lignes(s, "paiement")).toEqual([
      ["616", "debit", prime],
      ["512", "credit", prime],
    ]);
    expect(lignes(s, "charge-d-avance")).toEqual([
      ["486", "debit", prime - partDeNPlus1],
      ["616", "credit", prime - partDeNPlus1],
    ]);
    expect(attendus(s, "annees-suivantes")).toEqual({
      "Charge d'assurance de N+2": (prime * 12) / 24,
      "Mois du contrat dans N+3": 24 - 3 - 12,
      "Charge d'assurance de N+3": prime - partDeNPlus1 - (prime * 12) / 24,
    });
    // Les trois exercices du contrat portent toute la prime.
    expect(partDeNPlus1 + (prime * 12) / 24 + (prime - partDeNPlus1 - (prime * 12) / 24)).toBe(prime);
  });

  it("le curseur de la remise et le gain net, refaits à la main : la remise paie l'avance dès 175 €", () => {
    // La remise R paie l'avance quand R ≥ (6 000 − R) × 3 % : R ≥ 180 ÷ 1,03.
    const minimale = centime((PRIME * TAUX_DU_PLACEMENT) / (1 + TAUX_DU_PLACEMENT));
    expect(minimale).toBe(174.76);
    expect(curseur(s, "la-remise-qui-paie")).toEqual({
      attendu: 175,
      bornes: [0, 600],
      droites: [0, PRIME * TAUX_DU_PLACEMENT, 600, centime((PRIME - 600) * TAUX_DU_PLACEMENT)],
      lecture: { "Somme payée un an plus tôt": PRIME - 175, "Intérêts que le compte à terme ne versera pas": centime((PRIME - 175) * 0.03), "Gain net de l'offre": centime(175 - (PRIME - 175) * 0.03) },
      voisine: { "Somme payée un an plus tôt": PRIME - 174, "Intérêts que le compte à terme ne versera pas": centime((PRIME - 174) * 0.03), "Gain net de l'offre": centime(174 - (PRIME - 174) * 0.03) },
    });
    expect(attendus(s, "le-gain-net")).toEqual({
      "Somme payée un an plus tôt": avancee,
      "Intérêts que le compte à terme perd": interetsPerdus,
      "Gain net de l'offre": 600 - interetsPerdus,
      "Remise la plus petite qui paie l'avance": minimale,
    });
    expect([avancee, interetsPerdus, 600 - interetsPerdus]).toEqual([5_400, 162, 438]);
  });

  it("le verdict : signer, et N+1 ne porte que sa part", () => {
    expect(juste(s, "reponse")).toBe("Signer : 438 € de gain net, et N+1 ne portera que 5 925 € d'assurance");
    // L'erreur de base : les intérêts de toute la prime, comme si elle était entièrement avancée.
    const options = (s.etapes.find((x) => x.id === "reponse") as EtapeChoix).options(cas, etatVide).map((o) => o.texte);
    expect(options).toContain("Ne pas signer : la remise ne paie pas les 342 € d'intérêts perdus sur toute la prime");
    expect(prime * TAUX_DU_PLACEMENT).toBe(342);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
