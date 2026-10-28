import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  AFFLUENCE_DE_LA_BRADERIE,
  CHIFFRE_DU_CURSEUR,
  EQUIPE_ET_PLANNING,
  PART_DU_PERSONNEL_VISEE,
  equipeEtPlanning,
} from "../../src/config/cours/chapitres/equipe-et-planning";
import { MAILLE_ET_CO, type JourDOuverture } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DES_SALAIRES, L_ACCORD_DE_BRANCHE, accordDeBranche } from "../../src/config/cours/situations/par-chapitre/l-accord-de-branche";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeLecture, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * L'ÉQUIPE ET SON PLANNING, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : L'ACCORD DE BRANCHE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de MAILLE & CO (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : les heures du mois contrat par
 * contrat, les vendeurs nécessaires créneau par créneau sur l'affluence, le planning face au besoin,
 * la variante de la braderie, le budget d'heures, l'embauche, la hausse de l'accord. Les valeurs
 * absolues sont épinglées, les verdicts aussi. Chaque curseur : son attendu, la position voisine, ses
 * droites aux bornes, sa lecture ; le laboratoire : sa lecture au départ et à la solution, les courbes
 * de son graphique en quelques points. Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;
const auDessus = (x: number) => Math.ceil(x - 1e-9);
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ── La fiche, refaite à la main ────────────────────────────────────────────────
const heuresDuMois = (hs: number) => centime((hs * 52) / 12);
const heuresDeContrat = somme(f.equipe.map((s) => s.heuresParSemaine));
const heuresPayees = centime(somme(f.equipe.map((s) => heuresDuMois(s.heuresParSemaine))));
const brut = somme(f.equipe.map((s) => s.brutMensuel));
const paie = centime(brut * 1.42);
const taux = centime(paie / heuresPayees);
const ca = somme(f.gamme.map((r) => r.ventesDuMois * r.prixHt));
const cv = somme(f.gamme.map((r) => r.ventesDuMois * (r.coutDAchat + r.autresCoutsVariables)));
const tauxMcv = (ca - cv) / ca;
const tickets = somme(f.clienteles.map((c) => c.tickets));
const entrees = somme(f.clienteles.map((c) => c.entrees));
const panier = ca / tickets;
const JOURS: readonly JourDOuverture[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
/** Les vendeurs nécessaires d'un jour : au moins 2, un pour 8 entrées, à l'unité supérieure. */
const besoinDu = (jour: JourDOuverture, a = 1) => f.affluence[jour].map((e) => Math.max(2, auDessus((e * a) / 8)));
/** Les heures en manque et en trop du planning d'aujourd'hui, à une affluence donnée, et les heures de vente nécessaires. */
function ecarts(a = 1) {
  let manque = 0;
  let trop = 0;
  for (const j of JOURS) {
    besoinDu(j, a).forEach((v, i) => {
      const d = f.planning[j][i]! - v;
      if (d < 0) manque -= d;
      else trop += d;
    });
  }
  return { manque, trop, vente: somme(JOURS.map((j) => somme(besoinDu(j, a)))) };
}

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

const PARTICIPES = ["vendu", "demandé", "servi", "manqué", "perdu"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|seize|vingt|trente|cent) (articles?|heures?|entrées?|passages?|vendeurs?|salariés?|créneaux?|jours?)\b/i);
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
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, la position voisine, ses droites aux deux bornes, et sa lecture à l'attendu. */
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
  return { e, lire, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("l'équipe et son planning, à la boutique du monde du cours", () => {
  const ch = EQUIPE_ET_PLANNING;

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, et son cas aussi", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(L_ACCORD_DE_BRANCHE);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(f.entreprise).toBe(cas.entreprise);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect((ch.etapes.at(-1) as EtapeLecture).texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([heuresDeContrat, heuresPayees, brut, paie, taux]).toEqual([165, 715.01, 10_100, 14_342, 20.06]);
    expect([ca, cv, tickets, entrees]).toEqual([87_450, 43_200, 948, 3_848]);
    expect(ecarts()).toEqual({ manque: 11, trop: 16, vente: 140 });
    expect(ecarts().vente + f.reglesDuPlanning.tachesHorsVente).toBe(160);
  });

  it("les étapes guidées : le coût d'une heure, ce que l'équipe fait vendre, le besoin du samedi", () => {
    expect(attendus(ch, "cout-horaire")).toEqual({ "Heures payées du mois": heuresPayees, "Coût du personnel du mois": paie, "Coût horaire chargé": taux });
    expect(attendus(ch, "productivite")).toEqual({
      "Chiffre d'affaires par heure payée": centime(ca / heuresPayees),
      "Chiffre d'affaires par salarié": Math.round(ca / 6),
      "Part du personnel (%)": dixieme((paie / ca) * 100),
    });
    expect(Object.values(attendus(ch, "productivite"))).toEqual([122.31, 14_575, 16.4]);
    const samedi = besoinDu("samedi");
    expect(samedi).toEqual([2, 3, 5, 4, 3, 3, 4, 5, 4]);
    const autres = somme(JOURS.filter((j) => j !== "samedi").map((j) => somme(besoinDu(j))));
    expect(autres).toBe(107);
    expect(attendus(ch, "le-besoin-du-samedi")).toEqual({
      "Vendeurs nécessaires le samedi à 17 h": Math.ceil(36 / 8),
      "Vendeurs nécessaires le samedi à 10 h": Math.max(2, Math.ceil(14 / 8)),
      "Heures de vente du samedi": somme(samedi),
      "Besoin de la semaine, tâches comprises": autres + somme(samedi) + 20,
    });
  });

  it("le curseur du chiffre d'affaires qui paie l'équipe : 15 % des ventes face à la paie", () => {
    expect(PART_DU_PERSONNEL_VISEE).toBe(0.15);
    expect(CHIFFRE_DU_CURSEUR).toEqual({ min: 80_000, max: 110_000 });
    const attendu = Math.ceil(paie / 0.15);
    expect(attendu).toBe(95_614);
    expect(curseur(ch, "le-chiffre-qui-paie-l-equipe")).toEqual({
      attendu,
      bornes: [80_000, 110_000],
      droites: [80_000 * 0.15, paie, 110_000 * 0.15, paie],
      lecture: {
        "Paie du mois": paie,
        "Enveloppe du personnel, 15 % des ventes": centime(attendu * 0.15),
        "Chiffre d'affaires en plus de janvier": attendu - ca,
        "Enveloppe moins paie": centime(attendu * 0.15 - paie),
      },
    });
    expect(juste(ch, "predire-la-part")).toBe("Plus basse : la paie ne suit pas les ventes");
  });

  it("l'étape autonome de la part visée reprend le chiffre du curseur", () => {
    expect(attendus(ch, "la-part-visee")).toEqual({
      "Chiffre d'affaires de la part visée": 95_614,
      "Hausse sur janvier (%)": dixieme((95_614 / ca - 1) * 100),
      "Passages en caisse nécessaires": Math.ceil(95_614 / panier),
    });
    expect([dixieme((95_614 / ca - 1) * 100), Math.ceil(95_614 / panier)]).toEqual([9.3, 1_037]);
  });

  it("le laboratoire du planning : déplacer 11 heures couvre chaque créneau sans un euro de plus", () => {
    const l = laboratoire(ch, "le-laboratoire-du-planning");
    expect(l.depart).toEqual({ deplacees: 0, ajoutees: 0, affluence: 100 });
    expect(l.solution).toEqual({ deplacees: 11, ajoutees: 0, affluence: 100 });
    expect(l.reussi).toEqual([false, true]);
    const enTrop = (hs: number) => -centime(heuresDuMois(hs) * taux);
    expect(l.auDepart).toEqual({
      "Heures de vente nécessaires": 140,
      "Heures de vente planifiées": 145,
      "Heures en manque": 11,
      "Heures en trop": 16,
      "Heures de contrat par semaine": 165,
      "Paie du mois": paie,
      "Part du personnel": 16.4,
      "Coût des heures ajoutées": 0,
      "Paie des heures en trop": enTrop(16),
    });
    expect(l.aLaSolution).toEqual({ ...l.auDepart, "Heures en manque": 0, "Heures en trop": 5, "Paie des heures en trop": enTrop(5) });
    expect([enTrop(16), enTrop(5)]).toEqual([-1_390.76, -434.7]);
    // Ajouter les heures couvre aussi les créneaux, mais rate le défi : cela coûte de la paie.
    expect(l.atteint({ deplacees: 0, ajoutees: 11, affluence: 100 })).toBe(false);
    expect(l.atteint({ deplacees: 10, ajoutees: 0, affluence: 100 })).toBe(false);
    const ajout = l.lire({ deplacees: 0, ajoutees: 11, affluence: 100 });
    expect([ajout["Heures en manque"], ajout["Coût des heures ajoutées"], ajout["Paie du mois"]]).toEqual([0, -centime(heuresDuMois(11) * taux), centime(paie + centime(heuresDuMois(11) * taux))]);
  });

  it("le graphique du laboratoire : le besoin monte en escalier avec l'affluence", () => {
    const g = laboratoire(ch, "le-laboratoire-du-planning").e.graphique!(cas);
    expect(g.levier).toBe("affluence");
    const [necessaires, planifiees, manque] = g.courbes;
    const p = (a: number, ajoutees = 0) => ({ deplacees: 0, ajoutees, affluence: a });
    for (const a of [80, 100, 110, 115, 120, 130]) {
      expect(necessaires!.valeur(p(a)), `${a} %`).toBe(ecarts(a / 100).vente);
      expect(manque!.valeur(p(a)), `${a} %`).toBe(ecarts(a / 100).manque);
    }
    expect([80, 100, 110, 115, 120, 130].map((a) => ecarts(a / 100).vente)).toEqual([122, 140, 149, 161, 162, 168]);
    expect(planifiees!.valeur(p(120, 7))).toBe(145 + 7);
  });

  it("l'étape autonome du planning face au besoin, et le verdict du pari", () => {
    expect(attendus(ch, "le-planning-face-au-besoin")).toEqual({
      "Heures en manque dans la semaine": 11,
      "Heures en trop dans la semaine": 16,
      "Heures à déplacer": 11,
      "Heures en trop après le planning rebâti": 16 - 11,
    });
    expect(16 - 11).toBe(heuresDeContrat - 160);
    expect(juste(ch, "predire-le-planning")).toBe("Des créneaux en manque, malgré les heures d'avance");
  });

  it("les étapes d'expert : le budget d'heures, la braderie, l'embauche", () => {
    const masse = centime(ca * 0.15);
    const parMois = centime(masse / taux);
    const parSemaine = dixieme((parMois * 12) / 52);
    expect(attendus(ch, "le-budget-d-heures")).toEqual({
      "Masse salariale admissible": masse,
      "Heures payables du mois": parMois,
      "Heures payables par semaine": parSemaine,
      "Heures du besoin sans financement": dixieme(160 - parSemaine),
    });
    expect([masse, parMois, parSemaine, dixieme(160 - parSemaine)]).toEqual([13_117.5, 653.91, 150.9, 9.1]);

    expect(AFFLUENCE_DE_LA_BRADERIE).toBe(1.2);
    const b = ecarts(1.2);
    const samedi = besoinDu("samedi", 1.2);
    const aAjouter = b.manque - b.trop;
    expect(attendus(ch, "la-braderie")).toEqual({
      "Heures de vente nécessaires le samedi": somme(samedi),
      "Heures en manque de la semaine": b.manque,
      "Heures de contrat à ajouter par semaine": aAjouter,
      "Coût du mois des heures ajoutées": centime(heuresDuMois(aAjouter) * taux),
    });
    expect([somme(samedi), b.manque, b.trop, aAjouter, centime(heuresDuMois(aAjouter) * taux)]).toEqual([42, 27, 10, 17, 1_477.82]);

    const coutMoyen = centime(paie / 6);
    expect(attendus(ch, "l-embauche")).toEqual({
      "Coût mensuel moyen d'un salarié": coutMoyen,
      "Taux de marge sur coût variable (%)": dixieme(tauxMcv * 100),
      "Chiffre d'affaires à réaliser en plus": Math.ceil(coutMoyen / tauxMcv),
    });
    expect([coutMoyen, dixieme(tauxMcv * 100), Math.ceil(coutMoyen / tauxMcv)]).toEqual([2_390.33, 50.6, 4_724]);
    expect(equipeEtPlanning(cas).passagesPourUneEmbauche).toBe(Math.ceil(4_724 / panier));
    expect(juste(ch, "faut-il-embaucher")).toBe("Pas d'embauche : déplacer 11 h du début de semaine couvre chaque créneau");
  });

  it("le cas : la hausse se paie par les ventes, l'économie proposée casse le planning", () => {
    const s = L_ACCORD_DE_BRANCHE;
    casDedie(s, ch);
    expect(s.code).toBe("l-accord-de-branche");
    expect(s.titre).toBe("L'accord de branche");
    expect(HAUSSE_DES_SALAIRES).toBe(0.03);
    const apres = centime(paie * 1.03);
    const hausse = centime(apres - paie);
    expect(attendus(s, "apres-la-hausse")).toEqual({
      "Coût du personnel après la hausse": apres,
      "Hausse mensuelle": hausse,
      "Nouveau coût horaire chargé": centime(apres / heuresPayees),
      "Nouvelle part du personnel (%)": dixieme((apres / ca) * 100),
    });
    expect([apres, hausse, centime(apres / heuresPayees), dixieme((apres / ca) * 100)]).toEqual([14_772.26, 430.26, 20.66, 16.9]);
    const enPlus = Math.ceil(hausse / tauxMcv);
    const passages = Math.ceil(enPlus / panier);
    expect(attendus(s, "les-ventes-qui-paient")).toEqual({
      "Chiffre d'affaires à réaliser en plus": enPlus,
      "Passages en caisse en plus": passages,
      "Taux de transformation à atteindre (%)": dixieme(((tickets + passages) / entrees) * 100),
    });
    expect([enPlus, passages, dixieme(((tickets + passages) / entrees) * 100)]).toEqual([851, 10, 24.9]);
    // Le curseur : la marge d'un passage en caisse, 44 250 € ÷ 948, face à la marge de janvier plus la hausse.
    const margeParPassage = (ca - cv) / tickets;
    const cible = centime(ca - cv + hausse);
    const attendu = Math.ceil(cible / margeParPassage);
    expect(attendu).toBe(tickets + passages);
    expect(curseur(s, "le-curseur-des-passages")).toEqual({
      attendu,
      bornes: [900, 1_100],
      droites: [900 * margeParPassage, cible, 1_100 * margeParPassage, cible].map(centime),
      lecture: {
        "Chiffre d'affaires du mois": centime(attendu * panier),
        "Marge sur coût variable": centime(attendu * margeParPassage),
        "Marge de janvier plus la hausse": cible,
        "Ce que la hausse laisse au résultat": centime(centime(attendu * margeParPassage) - cible),
      },
    });
    // L'économie proposée : le CDD de l'étudiante, 12 h par semaine, 650 € de brut.
    const etudiante = f.equipe.find((x) => x.code === "etudiante")!;
    expect(attendus(s, "l-economie-proposee")).toEqual({
      "Économie mensuelle": centime(etudiante.brutMensuel * 1.42),
      "Heures de vente du planning sans elle": 145 - etudiante.heuresParSemaine,
      "Heures en manque au mieux": 140 - (145 - etudiante.heuresParSemaine),
    });
    expect([centime(etudiante.brutMensuel * 1.42), 145 - etudiante.heuresParSemaine, 140 - 133]).toEqual([923, 133, 7]);
    expect(accordDeBranche(cas).verdict).toBe("garder-l-etudiante");
    expect(juste(s, "reponse")).toBe("Garder l'équipe, et viser 851 € de ventes en plus par mois");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(L_ACCORD_DE_BRANCHE));
});
