import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { CONTRAT_DE_MAINTENANCE, COUT_COMPLET, MOIS_A_REBOURS, PART_DE_LA_COMMANDE } from "../../src/config/cours/chapitres/cout-complet";
import { NOVA_GESTION, type CodeDeCentre } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DES_VENTES, PRIX_DU_NOUVEAU_CLIENT, UN_NOUVEAU_CLIENT_REGULIER, nouveauClientRegulier } from "../../src/config/cours/situations/par-chapitre/un-nouveau-client-regulier";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE COÛT COMPLET ET LES CENTRES D'ANALYSE, AU MOIS DE JANVIER DE NOVA DANS LE MONDE DU COURS, ET SON
 * CAS : UN NOUVEAU CLIENT RÉGULIER.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de gestion (monde/nova-gestion.ts),
 * sans les fonctions du chapitre ni le modèle (monde/couts-et-budgets.ts) : la répartition primaire,
 * le système des prestations réciproques, les centres principaux, les unités d'œuvre, la chaîne des
 * coûts, l'imputation rationnelle, la variante du contrat de maintenance et le calcul à rebours. Chaque
 * curseur à son attendu, à sa position voisine, à ses bornes et dans sa lecture ; le laboratoire au
 * départ et à la solution, avec les courbes de son graphique ; les verdicts. Puis les gardes de texte
 * de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const f = NOVA_GESTION;
const mois = f.moisDeReference;
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const n = (x: number) => x.toLocaleString("fr-FR");
const CENTRES: CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];

// La fiche, refaite à la main.
const q = mois.quantite;
const p = mois.prix;
const cv = mois.coutVariable.composants + mois.coutVariable.autres;
const ch = mois.chargesFixes;
const cf = ch.loyer + ch.personnel + ch.amortissement;
const cles = f.centres;
const primaire = Object.fromEntries(CENTRES.map((k) => [k, c(ch.loyer * cles.primaire.loyer[k] + ch.personnel * cles.primaire.personnel[k] + ch.amortissement * cles.primaire.amortissement[k])])) as Record<CodeDeCentre, number>;
// Le système : E = E₀ + 10 % × A, A = A₀ + 20 % × E.
const E = c((primaire.entretien + 0.1 * primaire.administration) / (1 - 0.1 * 0.2));
const A = c(primaire.administration + 0.2 * E);
const appro = c(primaire.approvisionnement + c(0.2 * A));
const prod = c(primaire.production + c(0.6 * E) + c(0.4 * A));
const distrib = c(primaire.distribution + c(0.2 * E) + c(0.3 * A));
const achats = q * 22;
const autres = q * 16;

function textesDe(e: Etape, x: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(x);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(x), e.repere?.(x) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(x, etat), ...e.options(x, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(x, etat), ...e.champs(x, etat).flatMap((y) => [y.libelle, y.calcul, String(y.attendu)]), ...e.explication(x, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(x), ...e.categories.map((k) => k.libelle), ...e.elements(x).flatMap((y) => [y.libelle, y.pourquoi]), ...e.explication(x), ...tableau];
    case "curseur": {
      const k = e.cible(x);
      const g = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      const graphique = e.graphique?.(x);
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.explication(x, { ...d.solution, methode: 1 }),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(graphique?.courbes ?? []).map((y) => y.libelle),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(chap: Chapitre) {
  const chapitre = chapitreDuCas(chap, cas);
  expect(chapitre.etapes.length, `${chap.code} : une étape a disparu`).toBe(chap.etapes.length);
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|Nomade|Salon)\b/i);
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
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    for (const no of e.notions ?? []) expect(notions.has(no), `${e.id} : ${no}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, chap.code).toBe(chapitre.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, chap: Chapitre) {
  expect(s.reprend).toEqual([chap.code]);
  expect(casDuChapitre(chap.code)).toBe(s);
  expect(s.palier).toBe(chap.palier);
  expect(s.parcours).toBe(chap.parcours);
  expect(s.entreprises?.codes).toEqual(chap.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

function attendus(chap: Chapitre, id: string): Record<string, number> {
  const e = chap.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

function curseur(chap: Chapitre, id: string) {
  const e = chap.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (x: number) => d.produit(x) >= d.cout(x);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

function laboratoire(chap: Chapitre, id: string) {
  const e = chap.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (x: Record<string, number>) => Object.fromEntries(e.lecture(cas, x).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, lire, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

const juste = (chap: Chapitre, id: string) => (chap.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le coût complet, au mois de janvier de NOVA", () => {
  const ch = COUT_COMPLET;

  it("se joue chez NOVA seule, au palier 3 du contrôle de gestion, réservé, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(3);
    expect(CHAPITRES[0]!.code).not.toBe(ch.code);
    expect(ch.libre).toBe(false);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const [b, ref] of [
      ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
      ["DCG UE11 · Contrôle de gestion", "dcg"],
    ] as const) {
      expect(ch.blocs).toContain(b);
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(UN_NOUVEAU_CLIENT_REGULIER);
  });

  it("ne lit plus l'ancien tableau des clés (centres.ts) : il passe par la fiche et le modèle du cours", () => {
    for (const fichier of ["src/config/cours/chapitres/cout-complet.ts", "src/config/cours/situations/par-chapitre/un-nouveau-client-regulier.ts"]) {
      const source = readFileSync(join(process.cwd(), fichier), "utf8");
      expect(source, fichier).not.toMatch(/from "\.\.\/(\.\.\/)?centres"/);
      expect(source, fichier).not.toMatch(/c\.gestion|c\.loyer|c\.personnel|chiffresDeGestion/);
    }
  });

  it("le gabarit de l'étalon : deux paris, deux curseurs, un laboratoire à choix, au moins deux étapes d'expert à trois champs", () => {
    expect(ch.etapes.filter((e) => e.type === "choix" && e.titre.startsWith("Pariez"))).toHaveLength(2);
    expect(ch.etapes.filter((e) => e.type === "curseur")).toHaveLength(2);
    const labos = ch.etapes.filter((e): e is EtapeSimulation => e.type === "simulation");
    expect(labos).toHaveLength(1);
    expect(labos[0]!.leviers(cas).some((l) => l.choix)).toBe(true);
    for (const id of ["prestations-reciproques", "cout-rationnel", "tableau-complet", "a-rebours"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    const place = (id: string) => ch.etapes.findIndex((e) => e.id === id);
    expect(place("predire-les-prestations")).toBeLessThan(place("le-point-fixe"));
    expect(place("le-point-fixe")).toBeLessThan(place("prestations-reciproques"));
    expect(place("predire-le-volume")).toBeLessThan(place("le-cout-fige"));
    expect(place("le-cout-fige")).toBeLessThan(place("imputation-rationnelle"));
  });

  it("le tri : les charges directes et indirectes", () => {
    const tri = ch.etapes.find((e) => e.id === "directes-ou-indirectes") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Composants consommés": [achats, "directe"],
      Loyer: [19_700, "indirecte"],
      "Autres coûts par enceinte (emballage, transport et énergie de la chaîne)": [autres, "directe"],
      Personnel: [10_650, "indirecte"],
      "Usure de la ligne de montage": [833, "indirecte"],
    });
  });

  it("la répartition primaire, refaite à la main, conserve les charges", () => {
    expect(attendus(ch, "repartition-primaire")).toEqual({
      "Centre entretien": primaire.entretien,
      "Centre administration": primaire.administration,
      "Centre approvisionnement": primaire.approvisionnement,
      "Centre production": primaire.production,
      "Centre distribution": primaire.distribution,
    });
    expect(primaire).toEqual({ entretien: 1_600.8, administration: 3_609.15, approvisionnement: 4_061.65, production: 15_799.75, distribution: 6_111.65 });
    expect(c(Object.values(primaire).reduce((t, x) => t + x, 0))).toBe(cf);
  });

  it("les prestations réciproques : le système de deux équations, et ses deux équations satisfaites", () => {
    expect(attendus(ch, "prestations-reciproques")).toEqual({
      "Total de l'entretien": E,
      "Total de l'administration": A,
      "Part de l'administration cédée à l'entretien": c(0.1 * A),
    });
    expect([E, A, c(0.1 * A)]).toEqual([2_001.75, 4_009.5, 400.95]);
    expect(c(primaire.entretien + 0.1 * A)).toBe(E);
    expect(c(primaire.administration + 0.2 * E)).toBe(A);
  });

  it("le curseur du point fixe : les deux droites se croisent à la solution du système", () => {
    const recalcul = (t: number) => primaire.entretien + 0.1 * (primaire.administration + 0.2 * t);
    expect(curseur(ch, "le-point-fixe")).toEqual({
      attendu: Math.ceil(E),
      bornes: [1_600, 2_400],
      droites: [1_600, c(recalcul(1_600)), 2_400, c(recalcul(2_400))],
      lecture: {
        "Total supposé de l'entretien": 2_002,
        "Administration, avec sa part de cet entretien": c(primaire.administration + 0.2 * 2_002),
        "Ce que l'administration rend à l'entretien": c(0.1 * c(primaire.administration + 0.2 * 2_002)),
        "Entretien recalculé": c(recalcul(2_002)),
        Différence: c(2_002 - recalcul(2_002)),
      },
    });
    expect([c(recalcul(1_600)), c(recalcul(2_400))]).toEqual([1_993.72, 2_009.72]);
    expect(juste(ch, "predire-les-prestations")).toBe(`Plus que ses 1\u202f600,80 € : il reçoit une part de l'administration`);
  });

  it("la répartition secondaire et la critique de la cascade", () => {
    expect(attendus(ch, "repartition-secondaire")).toEqual({
      "Total du centre approvisionnement": appro,
      "Total du centre production": prod,
      "Total du centre distribution": distrib,
    });
    expect([appro, prod, distrib]).toEqual([4_863.55, 18_604.6, 7_714.85]);
    expect(c(appro + prod + distrib)).toBe(cf);
    // En cascade : l'entretien d'abord (1 600,80 €), puis l'administration, dont les 10 % rendus à l'entretien se perdent.
    const adminCascade = c(primaire.administration + 0.2 * primaire.entretien);
    expect([adminCascade, c(0.1 * adminCascade)]).toEqual([3_929.31, 392.93]);
    expect(juste(ch, "oublier-la-reciprocite")).toBe(`Son tableau perd 392,93 € : les centres principaux ne retrouvent plus toutes les charges`);
  });

  it("les unités d'œuvre et la chaîne des coûts", () => {
    expect(attendus(ch, "unites-d-oeuvre")).toEqual({
      "Approvisionnement : coût de l'unité d'œuvre": c(appro / (achats / 100)),
      "Production : coût de l'unité d'œuvre": c(prod / q),
      "Distribution : coût de l'unité d'œuvre": c(distrib / ((q * p) / 100)),
    });
    expect([c(appro / (achats / 100)), c(prod / q), c(distrib / ((q * p) / 100))]).toEqual([13.9, 11.7, 8.22]);
    const achat = c(achats + appro);
    const production = c(achat + autres + prod);
    const revient = c(production + distrib);
    expect(attendus(ch, "chaine-des-couts")).toEqual({
      "Coût d'achat": achat,
      "Coût de production": production,
      "Coût de revient": revient,
      "Coût de revient d'une unité": c(revient / q),
      "Résultat analytique du mois": c(q * p - revient),
    });
    expect([achat, production, revient, c(revient / q), c(q * p - revient)]).toEqual([39_843.55, 83_888.15, 91_603, 57.61, 2_207]);
    // Deux méthodes, un résultat : celui du compte de résultat différentiel.
    expect(c(q * p - revient)).toBe(q * (p - cv) - cf);
  });

  it("le curseur du coût figé : 57,61 € × q ne couvre 38 € × q + 31 183 € qu'à partir de 1 591 enceintes", () => {
    expect(Math.ceil(cf / (57.61 - cv))).toBe(1_591);
    expect(curseur(ch, "le-cout-fige")).toEqual({
      attendu: 1_591,
      bornes: [1_000, 2_500],
      droites: [57_610, 38_000 + cf, c(57.61 * 2_500), 95_000 + cf],
      lecture: {
        "Coût du mois au coût figé": c(57.61 * 1_591),
        "Coût réel du mois": cv * 1_591 + cf,
        "Coût réel d'une enceinte": c((cv * 1_591 + cf) / 1_591),
        "Coût figé moins coût réel": c(57.61 * 1_591 - (cv * 1_591 + cf)),
      },
    });
    expect([c(57.61 * 1_591), cv * 1_591 + cf, c((cv * 1_591 + cf) / 1_591)]).toEqual([91_657.51, 91_641, 57.6]);
    expect(juste(ch, "predire-le-volume")).toBe("Plus bas : les charges fixes se partageraient sur plus d'unités");
  });

  it("l'imputation rationnelle, jusqu'au résultat", () => {
    const k = q / cles.activiteNormale;
    expect(k).toBe(0.75);
    expect(attendus(ch, "imputation-rationnelle")).toEqual({ "Coefficient d'imputation rationnelle": 0.75, "Charges fixes imputées": c(cf * k), "Coût de la sous-activité": c(cf - c(cf * k)) });
    expect([c(cf * k), c(cf - c(cf * k))]).toEqual([23_387.25, 7_795.75]);
    // Chaque centre principal impute au même coefficient : la somme, centre par centre, au centime.
    const imputees = c(c(appro * k) + c(prod * k) + c(distrib * k));
    expect(imputees).toBe(23_387.25);
    const revient = c(achats + autres + imputees);
    expect(attendus(ch, "cout-rationnel")).toEqual({
      "Coût de revient rationnel du mois": revient,
      "Coût de revient rationnel d'une unité": c(revient / q),
      "Résultat avant le coût de la sous-activité": c(q * p - revient),
      "Résultat analytique après la sous-activité": c(q * p - revient - (cf - imputees)),
    });
    expect([revient, c(revient / q), c(q * p - revient), c(q * p - revient - (cf - imputees))]).toEqual([83_807.25, 52.71, 10_002.75, 2_207]);
  });

  it("le laboratoire du coût : deux chemins vers le coût rationnel", () => {
    const l = laboratoire(ch, "le-laboratoire-du-cout");
    expect(l.depart).toEqual({ ventes: q, methode: 0 });
    expect(l.solution).toEqual({ ventes: 2_120, methode: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({ "Coût de revient d'une enceinte": 57.61, "Charges fixes incorporées aux coûts": cf, "Différence d'incorporation": 0, "Résultat analytique du mois": 2_207 });
    expect(l.aLaSolution).toEqual({
      "Coût de revient d'une enceinte": c((2_120 * cv + cf) / 2_120),
      "Charges fixes incorporées aux coûts": cf,
      "Différence d'incorporation": 0,
      "Résultat analytique du mois": 2_120 * (p - cv) - cf,
    });
    expect([c((2_120 * cv + cf) / 2_120), 2_120 * (p - cv) - cf]).toEqual([52.71, 13_337]);
    // Le second chemin : l'imputation rationnelle, à tout volume ; le résultat ne change pas de méthode.
    expect(l.d.atteint({ ventes: q, methode: 1 })).toBe(true);
    expect(l.d.atteint({ ventes: 2_500, methode: 1 })).toBe(true);
    expect(l.lire({ ventes: q, methode: 1 })).toEqual({ "Coût de revient d'une enceinte": 52.71, "Charges fixes incorporées aux coûts": 23_387.25, "Différence d'incorporation": 7_795.75, "Résultat analytique du mois": 2_207 });
    // Au voisinage de l'activité normale, le coût réel n'est plus 52,71 €.
    expect(l.d.atteint({ ventes: 2_110, methode: 0 })).toBe(false);
    expect(l.d.atteint({ ventes: 2_130, methode: 0 })).toBe(false);
    expect([c(cv + cf / 2_110), c(cv + cf / 2_130)]).toEqual([52.78, 52.64]);
  });

  it("le graphique du laboratoire : le coût réel descend en courbe, le coût rationnel est plat, ils se croisent à l'activité normale", () => {
    const l = laboratoire(ch, "le-laboratoire-du-cout");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("ventes");
    const [reel, rationnel] = g.courbes;
    const au = (ventes: number) => ({ ventes, methode: 0 });
    expect([1_000, 1_590, 2_120, 2_500].map((v) => reel!.valeur(au(v)))).toEqual([1_000, 1_590, 2_120, 2_500].map((v) => c(cv + cf / v)));
    expect([1_000, 1_590, 2_120, 2_500].map((v) => c(cv + cf / v))).toEqual([69.18, 57.61, 52.71, 50.47]);
    expect([1_000, 1_590, 2_120, 2_500].map((v) => rationnel!.valeur(au(v)))).toEqual([52.71, 52.71, 52.71, 52.71]);
  });

  it("la variante du contrat de maintenance : le tableau complet, refait à la main", () => {
    expect(CONTRAT_DE_MAINTENANCE).toBe(980);
    const Ev = c((primaire.entretien + 980 + 0.1 * primaire.administration) / 0.98);
    const Av = c(primaire.administration + 0.2 * Ev);
    const prodV = c(primaire.production + c(0.6 * Ev) + c(0.4 * Av));
    expect(attendus(ch, "tableau-complet")).toEqual({
      "Total de l'entretien, avec le contrat": Ev,
      "Total de l'administration, avec le contrat": Av,
      "Total du centre production, avec le contrat": prodV,
      "Coût de revient d'une enceinte, avec le contrat": c((achats + autres + cf + 980) / q),
    });
    expect([Ev, Av, prodV, c((achats + autres + cf + 980) / q)]).toEqual([3_001.75, 4_209.5, 19_284.6, 58.23]);
    // Le tableau de la variante conserve les charges, contrat compris.
    const apV = c(primaire.approvisionnement + c(0.2 * Av));
    const diV = c(primaire.distribution + c(0.2 * Ev) + c(0.3 * Av));
    expect(c(apV + prodV + diV)).toBe(cf + 980);
  });

  it("le calcul à rebours : d'un coût de revient d'avril aux ventes et à la sous-activité", () => {
    expect(MOIS_A_REBOURS).toBe(3);
    const ventes = f.semestre.clienteles.reduce((t, cl) => t + cl.quantites[3]!, 0);
    expect(ventes).toBe(1_900);
    const cout = c(cv + cf / ventes);
    expect(cout).toBe(54.41);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Charges fixes portées par une enceinte": c(cout - cv),
      "Ventes du mois": ventes,
      "Coût de la sous-activité du mois": c(cf - c((cf * ventes) / 2_120)),
    });
    expect([c(cout - cv), Math.round(cf / c(cout - cv)), c(cf - c((cf * ventes) / 2_120))]).toEqual([16.41, 1_900, 3_235.97]);
  });

  it("les verdicts : deux méthodes un résultat, la commande sous le coût complet", () => {
    expect(juste(ch, "meme-resultat")).toBe("Parce que les deux méthodes rangent les mêmes charges autrement : le total ne change pas.");
    expect(PART_DE_LA_COMMANDE).toBe(0.1);
    const commande = Math.round(q * 0.1);
    const prix = Math.round((cv + (achats + autres + cf) / q) / 2);
    expect([commande, prix, commande * (prix - cv)]).toEqual([159, 48, 1_590]);
    expect(juste(ch, "commande")).toBe("Oui : chaque unité rapporte sa marge sur coût variable, 10 €, et les charges fixes ne bougent pas.");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : un nouveau client régulier", () => {
  const s = UN_NOUVEAU_CLIENT_REGULIER;
  const du = Math.round(q * 0.2);
  const qn = q + du;
  const caN = q * p + du * 55;

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, COUT_COMPLET);
    expect(s.commanditaire).toBe("Le directeur commercial");
    expect([HAUSSE_DES_VENTES, PRIX_DU_NOUVEAU_CLIENT, du, qn, caN]).toEqual([0.2, 55, 318, 1_908, 111_300]);
  });

  it("les unités d'œuvre et la chaîne des coûts au nouveau volume, refaites à la main", () => {
    expect(attendus(s, "unites-d-oeuvre")).toEqual({
      "Unités vendues avec le nouveau client": qn,
      "Approvisionnement : coût pour 100 € d'achats": c(appro / ((qn * 22) / 100)),
      "Production : coût d'une unité": c(prod / qn),
      "Distribution : coût pour 100 € de chiffre d'affaires": c(distrib / (caN / 100)),
    });
    expect([c(appro / ((qn * 22) / 100)), c(prod / qn), c(distrib / (caN / 100))]).toEqual([11.59, 9.75, 6.93]);
    const achat = c(qn * 22 + appro);
    const production = c(achat + qn * 16 + prod);
    const revient = c(production + distrib);
    expect(attendus(s, "chaine-des-couts")).toEqual({ "Coût d'achat": achat, "Coût de production": production, "Coût de revient": revient, "Coût de revient d'une unité": c(revient / qn) });
    expect([achat, production, revient, c(revient / qn)]).toEqual([46_839.55, 95_972.15, 103_687, 54.34]);
    expect(revient).toBe(qn * cv + cf);
  });

  it("le curseur du volume : 55 € couvre le coût complet dès 1 835 enceintes", () => {
    expect(Math.ceil(cf / (55 - cv))).toBe(1_835);
    expect(curseur(s, "le-volume-au-curseur")).toEqual({
      attendu: 1_835,
      bornes: [1_500, 2_200],
      droites: [55 * 1_500, cv * 1_500 + cf, 55 * 2_200, cv * 2_200 + cf],
      lecture: { "Ces enceintes à 55 €": 55 * 1_835, "Coût de revient du mois": cv * 1_835 + cf, "Coût complet d'une enceinte": c((cv * 1_835 + cf) / 1_835) },
    });
    expect(c((cv * 1_835 + cf) / 1_835)).toBe(54.99);
    expect(qn).toBeGreaterThan(1_835);
  });

  it("le croisement des deux lectures, et le verdict", () => {
    const revient = qn * cv + cf;
    expect(attendus(s, "ce-que-change-le-client")).toEqual({
      "Résultat du mois avec le client": caN - revient,
      "Ce que le client ajoute au résultat": caN - revient - 2_207,
      "Perte que fait croire le coût de janvier": c((55 - 57.61) * du),
    });
    expect([caN - revient, caN - revient - 2_207, c((55 - 57.61) * du)]).toEqual([7_613, 5_406, -829.98]);
    expect(caN - revient - 2_207).toBe(du * (55 - cv));
    const r = nouveauClientRegulier(cas);
    expect(r.verdict).toBe("accepter");
    // La condition : 4 € de remise sur les 1 590 enceintes d'aujourd'hui coûteraient plus que le client n'apporte.
    expect(r.siLePrixSEtend).toBe((p - 55) * q);
    expect((p - 55) * q).toBeGreaterThan(5_406);
    expect(juste(s, "reponse")).toBe(`Accepter : le client ajoute ${n(5_406)} € par mois au résultat`);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
