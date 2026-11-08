import { expect } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { PROGRAMME } from "../../src/config/cours/registre";
import type { Situation } from "../../src/config/cours/situations/types";
import { themeDuChapitre } from "../../src/config/cours/themes";
import type { Chapitre, EtatDuCours, LevierDeSimulation } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { lireLeCurseur, lireLeLaboratoire, servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { typographier } from "../../src/lib/typographie";
import { FAUTES } from "./gardes-de-nova";
import { etape, textesDe } from "./gardes-du-lycee";

/**
 * LES GARDES DES CHAPITRES DE SCIENCES DE GESTION ET NUMÉRIQUE DE PREMIÈRE (lot A du chantier STMG).
 *
 * Celles de gardes-de-nova.ts, pour un chapitre qui se joue dans une seule entreprise du cours, quelle
 * qu'elle soit (NOVA, L'ESCALE, MAILLE & CO, ATLAS CONSEIL) : des textes propres (les mêmes fautes), une
 * seule bonne réponse qui n'est jamais la plus longue, des notions qui existent, l'arène seulement à la
 * dernière étape, au plus 20 étapes, chaque objectif travaillé, un curseur dont la position attendue
 * est la frontière, un laboratoire à solution unique, et le chapitre servi par le serveur. Le chapitre
 * est au programme de son parcours, rangé sous un thème, et cite en premier un thème de la SGN.
 */

export const VIDE: EtatDuCours = { soldes: {} };

/** Le cas de la seule entreprise où le chapitre se joue. */
export function casDuChapitreSgn(source: Chapitre): Cas {
  expect(source.entreprises?.codes.length, `${source.code} : une seule entreprise`).toBe(1);
  return casDeLEntreprise(source.entreprises!.codes[0]!);
}

/** Les thèmes de la SGN de première, tels que les chapitres les citent. */
export const THEMES_DE_LA_SGN = [
  "STMG Thème 1 · De l'individu à l'acteur",
  "STMG Thème 2 · Numérique et intelligence collective",
  "STMG Thème 3 · Création de valeur et performance",
  "STMG Thème 4 · Temps et risque",
] as const;

/** Le chapitre est au programme, cite un thème de la SGN en premier, se résout dans le référentiel, et a un thème du catalogue. */
export function gardeDuProgrammeSgn(ch: Chapitre, premier: (typeof THEMES_DE_LA_SGN)[number]) {
  expect(PROGRAMME[ch.parcours][ch.palier], ch.code).toContain(ch.titre);
  expect(ch.libre).toBe(false);
  expect(ch.blocs[0], ch.code).toBe(premier);
  for (const bloc of ch.blocs) {
    const cite = referentielDeCitation(bloc);
    expect(cite, bloc).not.toBeNull();
    expect(blocOfficiel(bloc, cite!.code), bloc).toBeTruthy();
  }
  expect(themeDuChapitre(ch.code), ch.code).toBeDefined();
  expect(ch.etapes.length, `${ch.code} : au plus 20 étapes`).toBeLessThanOrEqual(20);
}

/** Les gardes de texte, de réponse unique et de notions ; l'arène seulement à la dernière étape. */
export function gardesDeTexteSgn(source: Chapitre) {
  const cas = casDuChapitreSgn(source);
  const ch = chapitreDuCas(source, cas);
  expect(ch.etapes.length, `${source.code} : une étape retirée`).toBe(source.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, source.code).toBe(ch.etapes.length);
  const codes = new Set(CONCEPTS.map((x) => x.code));
  const derniere = ch.etapes.at(-1)!.id;
  for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""]) {
    for (const [nom, re] of FAUTES) expect(x, `en-tête · ${nom} : ${x}`).not.toMatch(re);
    expect(x, "en-tête : l'arène").not.toMatch(/\barène\b/i);
  }
  for (const [i, e] of ch.etapes.entries()) {
    for (const x of textesDe(ch, e, i, cas)) {
      for (const [nom, re] of FAUTES) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
      if (e.id !== derniere) expect(x, `${e.id} : l'arène avant la dernière étape`).not.toMatch(/\barène\b/i);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etatAvant(ch, cas, i));
      const justes = options.filter((o) => o.juste);
      expect(justes, e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      const fausses = options.filter((o) => !o.juste).map((o) => o.texte.length);
      expect(justes[0]!.texte.length, `${source.code} · ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...fausses));
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etatAvant(ch, cas, i));
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const el = e.elements(cas);
      expect(new Set(el.map((x) => x.libelle)).size, e.id).toBe(el.length);
      for (const x of el) expect(e.categories.map((k) => k.code), `${e.id} : ${x.libelle}`).toContain(x.categorie);
      // Chaque catégorie reçoit au moins un élément : un tri ne se devine pas en n'en laissant qu'une.
      for (const k of e.categories) expect(el.some((x) => x.categorie === k.code), `${e.id} : ${k.code} vide`).toBe(true);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
  }
  // Chaque objectif est travaillé par au moins une étape évaluée.
  ch.objectifs.forEach((o, k) => expect(ch.etapes.some((e) => e.type !== "lecture" && e.objectifs?.includes(k)), `${source.code} : objectif ${k} (${o})`).toBe(true));
  // Le serveur sert le chapitre sans erreur : chaque étape passe par chapitre-servi.ts.
  expect(servirLeChapitre(source, cas).etapes.length).toBe(ch.etapes.length);
  return ch;
}

/** Les champs attendus d'une étape de montants, et la bonne réponse d'un choix. */
export const attendusSgn = (ch: Chapitre, id: string) => {
  const cas = casDuChapitreSgn(ch);
  return etape(chapitreDuCas(ch, cas), id, "montants").champs(cas, VIDE).map((c) => c.attendu);
};
export const justeSgn = (ch: Chapitre, id: string) => {
  const cas = casDuChapitreSgn(ch);
  return etape(chapitreDuCas(ch, cas), id, "choix").options(cas, VIDE).filter((o) => o.juste).map((o) => o.texte);
};
export const triSgn = (ch: Chapitre, id: string) => {
  const cas = casDuChapitreSgn(ch);
  return Object.fromEntries(etape(chapitreDuCas(ch, cas), id, "tri").elements(cas).map((x) => [x.libelle, x.categorie]));
};

/** Le curseur : sa position attendue est dans ses bornes, et c'est la frontière ; le serveur lit la même chose. */
export function gardeDuCurseurSgn(source: Chapitre, id: string, attendu: number) {
  const cas = casDuChapitreSgn(source);
  const e = etape(chapitreDuCas(source, cas), id, "curseur");
  const cible = e.cible(cas);
  expect(cible.attendu, id).toBe(attendu);
  expect(attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
  expect(attendu).toBeLessThanOrEqual(cible.max);
  const d = e.droites(cas);
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
  const pas = e.sens === "plus-grande" ? 1 : -1;
  expect(couvre(attendu), `${id} à ${attendu}`).toBe(true);
  expect(couvre(attendu + pas), `${id} à ${attendu + pas}`).toBe(false);
  // Le navigateur trace les deux droites par leurs extrémités : elles doivent être des droites.
  const min = cible.min ?? 0;
  const milieu = (min + cible.max) / 2;
  for (const f of [d.produit, d.cout]) expect(f(milieu), `${id} : une droite`).toBeCloseTo((f(min) + f(cible.max)) / 2, 6);
  expect(lireLeCurseur(e, cas, attendu).lignes).toEqual(typographier(e.lecture(cas, attendu)));
  return e;
}

const positionsDe = (l: LevierDeSimulation) =>
  l.choix ? l.choix.map((x) => x.valeur) : Array.from({ length: Math.round((l.max - l.min) / l.pas) + 1 }, (_, i) => Math.round((l.min + i * l.pas) * 1e6) / 1e6);

/** Le laboratoire : un ou deux leviers, le départ ne relève pas le défi, la solution le relève, et c'est la seule position qui le relève. */
export function gardeDuLaboratoireSgn(source: Chapitre, id: string) {
  const cas = casDuChapitreSgn(source);
  const e = etape(chapitreDuCas(source, cas), id, "simulation");
  const leviers = e.leviers(cas);
  expect(leviers.length, `${id} : un levier, deux au plus`).toBeLessThanOrEqual(2);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(cas);
  expect(d.atteint(depart), `${id} : le départ relève déjà le défi`).toBe(false);
  expect(d.atteint(d.solution), `${id} : la solution ne relève pas le défi`).toBe(true);
  for (const l of leviers) {
    const crans = positionsDe(l);
    expect(crans, `${l.code} : le départ est un cran`).toContain(l.depart);
    expect(crans, `${l.code} : la solution est un cran`).toContain(d.solution[l.code]);
  }
  const positions = leviers.reduce<Record<string, number>[]>((acc, l) => acc.flatMap((p) => positionsDe(l).map((v) => ({ ...p, [l.code]: v }))), [{}]);
  expect(positions.filter((p) => d.atteint(p)), `${id} : une seule solution`).toEqual([d.solution]);
  for (const p of positions) for (const x of [d.indice(p), ...e.lecture(cas, p).map((l) => l.libelle)]) expect(x).not.toMatch(/undefined|NaN|Infinity|\[object/);
  for (const [nom, re] of FAUTES) for (const x of [d.consigne, ...e.explication(cas, d.solution)]) expect(x, `${id} · ${nom} : ${x}`).not.toMatch(re);
  expect(lireLeLaboratoire(e, cas, d.solution).atteint).toBe(true);
  return e;
}

/** Un cas dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours, une réponse au bout. */
export function gardeDuCasSgn(sit: Situation, ch: Chapitre) {
  expect(sit.reprend, sit.code).toEqual([ch.code]);
  expect(sit.palier, sit.code).toBe(ch.palier);
  expect(sit.parcours, sit.code).toBe(ch.parcours);
  expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
  expect(sit.libre, sit.code).toBe(false);
  expect(sit.blocs, sit.code).toEqual([]);
  expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
  expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
  const cas = casDuChapitreSgn(sit);
  // Le cas ne s'écrit pas comme le chapitre : pas d'objectifs à travailler étape par étape, mais les mêmes gardes de texte.
  const c = chapitreDuCas(sit, cas);
  for (const [i, e] of c.etapes.entries()) {
    for (const x of textesDe(c, e, i, cas)) for (const [nom, re] of FAUTES) expect(x, `${sit.code} · ${e.id} · ${nom} : ${x}`).not.toMatch(re);
    if (e.type === "choix") {
      const options = e.options(cas, etatAvant(c, cas, i));
      const justes = options.filter((o) => o.juste);
      expect(justes, `${sit.code} · ${e.id}`).toHaveLength(1);
      expect(justes[0]!.texte.length, `${sit.code} · ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
  }
  expect(servirLeChapitre(sit, cas).etapes.length).toBe(c.etapes.length);
}
