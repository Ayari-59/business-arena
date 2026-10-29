import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DEPRECIATIONS_ET_PROVISIONS,
  ECART_DU_PARI,
  OBJECTIF_ANNONCE_A_LA_BANQUE,
  PART_DE_REVENTE_DE_LA_LIGNE,
  PART_VERSEE_A_REBOURS,
  PART_VERSEE_VARIANTE,
  PRIX_DU_JEU_APRES_NOEL,
  TAUX_ESTIME_A_REBOURS,
  LE_DENOUEMENT_DES_RISQUES,
} from "../../src/config/cours/chapitres/depreciations-et-provisions";
import { LA_CLOTURE } from "../../src/config/cours/chapitres/la-cloture";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ARRETE_DES_COMPTES_DE_N, DATE_DE_LA_SITUATION, LA_CREANCE_QUI_SE_DEGRADE, TAUX_DE_PERTE_REVU } from "../../src/config/cours/situations/par-chapitre/la-creance-qui-se-degrade";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, etatApres, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * DÉPRÉCIATIONS ET PROVISIONS ET LEUR CAS (LA CRÉANCE QUI SE DÉGRADE), SUR LE PREMIER EXERCICE DE NOVA
 * DU MONDE DU COURS, ET CE QUE N+1 EN FAIT.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/exercice-de-nova.ts), sans les
 * fonctions du chapitre ni le modèle de clôture ; les valeurs absolues sont épinglées, les variantes
 * (un liquidateur plus avare, l'estimation retrouvée à rebours, la perte revue en mars) refaites comme
 * le reste, et les verdicts aussi. Le journal est tenu pour de vrai : il s'ouvre sur la balance que
 * « La clôture » laisse avant l'impôt, chaque écriture passe son correcteur, le bilan s'équilibre à
 * chaque étape, et N+1 solde la créance, sa dépréciation et la provision. Puis les gardes de texte de
 * l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LES GARDES DE L'ÉTALON
// ─────────────────────────────────────────────────────────────────────────────

function textesDe(ch: Chapitre, e: Etape, x: Cas, i: number): string[] {
  const etat = etatAvant(ch, x, i);
  const t = e.tableau?.(x);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(x), e.repere?.(x) ?? "", ...tableau];
    case "ecriture": {
      const a = e.ecriture(x);
      return [e.titre, e.evenement(x), ...e.indices(x), ...e.explication(x, etatApres(ch, x, i)), a.libelle, a.date, ...a.lignes.flatMap((l) => [l.role, l.indice])];
    }
    case "choix":
      return [e.titre, e.question(x, etat), ...e.options(x, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(x, etat), ...e.champs(x, etat).flatMap((y) => [y.libelle, y.calcul, String(y.attendu)]), ...e.explication(x, etat), ...tableau];
    case "curseur": {
      const k = e.cible(x);
      const g = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(e.graphique?.(x).courbes.map((y) => y.libelle) ?? []),
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
    for (const x of textesDe(chapitre, e, cas, i)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|jeux|jours|mois|travaux|échéances)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bla moitié\b|\ble tiers\b|\ble quart\b/i);
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
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Le journal d'un chapitre à écritures : chaque écriture juste, au plan, et le bilan équilibré à chaque étape. */
function verifierLeJournal(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  if (ch.ouverture) {
    const o = ch.ouverture(cas);
    expect(equilibree(o), `${ch.code} : l'ouverture`).toBe(true);
    for (const l of o.lignes) expect(compteDuPlan(l.compte), `${ch.code} : ouverture, ${l.compte}`).toBeDefined();
  }
  for (const e of chapitre.etapes) {
    if (e.type !== "ecriture") continue;
    const a = e.ecriture(cas);
    expect(equilibree(enEcriture(a)), e.id).toBe(true);
    for (const l of a.lignes) {
      expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(l.montant, `${e.id} : ${l.compte}`).toBeGreaterThan(0);
    }
    expect(corriger(enSaisie(a), a), e.id).toEqual({ juste: true, remarques: [], notes: [] });
  }
  for (let i = 0; i <= chapitre.etapes.length; i++) {
    const b = bilan(etatAvant(chapitre, cas, i).soldes);
    expect(b.totalActif, `${ch.code} : le bilan avant l'étape ${i}`).toBeCloseTo(b.totalPassif, 2);
  }
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
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThan(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, sa position voisine, ses droites aux deux bornes, et sa lecture à l'attendu. */
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
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c),
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
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

// Le résultat que « La clôture » laisse avant l'impôt : la balance et ses cinq travaux.
const raiDeLaCloture = c(1_385_556 - 1_250_840.4 - (60_000 / 6) * (355 / 360) + 133_000 * 0.03 * (355 / 360) + 600 * 22.5 - 1_500 * 23 - (68_000 * 0.0125 * 88) / 90);
const isDe = (r: number) => Math.round(6_375 + (r - 42_500) * 0.25);
const ttc = 500 * 59 * 0.95 * 1.2;
const ht = c(ttc / 1.2);
const tva = c(ttc - ht);
const depreciation = c(ht * 0.4);
const provision = 5_000;
const rai = c(raiDeLaCloture - depreciation - provision);
const verse = c(ttc * 0.5);
const perteTtc = c(ttc - verse);
const perteHt = c(perteTtc / 1.2);
const tvaRecuperee = c(perteTtc - perteHt);
const chargeNette = c(perteHt - depreciation);
const condamnation = 4_000;
const effetDuJugement = provision - condamnation;
const unPoint = ht / 100;

describe("dépréciations et provisions : la fiche, refaite à la main", () => {
  it("donne les chiffres du monde du cours", () => {
    expect(raiDeLaCloture).toBe(106_957.96);
    expect([ttc, ht, tva, depreciation, c(ttc - depreciation)]).toEqual([33_630, 28_025, 5_605, 11_210, 22_420]);
    expect([rai, isDe(raiDeLaCloture), isDe(rai), isDe(raiDeLaCloture) - isDe(rai)]).toEqual([90_747.96, 22_489, 18_437, 4_052]);
    expect([verse, perteTtc, perteHt, tvaRecuperee, chargeNette]).toEqual([16_815, 16_815, 14_012.5, 2_802.5, 2_802.5]);
    expect([condamnation, effetDuJugement]).toEqual([4_000, 1_000]);
    expect(f.creances.find((k) => k.litigieuse)).toMatchObject({ client: "Sonora", ttc, ht, tva });
  });

  it("se joue chez NOVA seule, au palier 4, avec ses blocs, à la suite de « La clôture »", () => {
    const ch = DEPRECIATIONS_ET_PROVISIONS;
    expect(CHAPITRES).toContain(ch);
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises?.codes).toEqual(LA_CLOTURE.entreprises?.codes);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(LA_CREANCE_QUI_SE_DEGRADE);
    // Le journal s'ouvre là où « La clôture » s'arrête avant l'impôt, compte par compte.
    const avant = chapitreDuCas(LA_CLOTURE, cas);
    const cloture = etatAvant(avant, cas, indexDeLEtape(avant, "ecriture-de-l-impot")).soldes;
    const ouverture = etatAvant(chapitreDuCas(ch, cas), cas, 0).soldes;
    for (const compte of new Set([...Object.keys(cloture), ...Object.keys(ouverture)])) expect(ouverture[compte] ?? 0, compte).toBeCloseTo(cloture[compte] ?? 0, 2);
  });
});

describe("dépréciations et provisions : les étapes", () => {
  const ch = DEPRECIATIONS_ET_PROVISIONS;

  it("les étapes guidées : la dépréciation sur le hors taxes", () => {
    expect(attendus(ch, "montant-depreciation")).toEqual({ "Créance hors taxes": ht, "TVA contenue dans la créance": tva, Dépréciation: depreciation });
    // Sur le TVA comprise, la dépréciation serait trop forte de la TVA de la part estimée perdue.
    expect(c(ttc * 0.4 - depreciation)).toBe(c(tva * 0.4));
  });

  it("la prudence chiffrée : le résultat, l'impôt, l'impôt en moins", () => {
    expect(attendus(ch, "resultat")).toEqual({ "Résultat avant impôt": rai, "Impôt sur les sociétés": isDe(rai), "Impôt en moins": isDe(raiDeLaCloture) - isDe(rai) });
    // Après impôt, la prudence coûte 75 % de ses charges, à l'arrondi de l'euro près.
    expect(c(depreciation + provision - 4_052)).toBe(12_158);
  });

  it("les écritures, au montant de la main", () => {
    const montants = (id: string) => {
      // Le chapitre est découpé en deux : les écritures de N+1 sont dans la suite.
      const e = [...ch.etapes, ...LE_DENOUEMENT_DES_RISQUES.etapes].find((x) => x.id === id)!;
      if (e.type !== "ecriture") throw new Error(id);
      return Object.fromEntries(e.ecriture(cas).lignes.map((l) => [`${l.sens} ${l.compte}`, l.montant]));
    };
    expect(montants("reclassement")).toEqual({ "debit 416": ttc, "credit 411": ttc });
    expect(montants("dotation-depreciation")).toEqual({ "debit 6817": depreciation, "credit 491": depreciation });
    expect(montants("provision")).toEqual({ "debit 6815": provision, "credit 1511": provision });
    expect(montants("la-condamnation")).toEqual({ "debit 658": condamnation, "credit 512": condamnation });
    expect(montants("reprise-de-la-provision")).toEqual({ "debit 1511": provision, "credit 7815": provision });
    expect(montants("encaissement")).toEqual({ "debit 512": verse, "credit 416": verse });
    expect(montants("perte")).toEqual({ "debit 654": perteHt, "debit 44571": tvaRecuperee, "credit 416": perteTtc });
    expect(montants("reprise")).toEqual({ "debit 491": depreciation, "credit 7817": depreciation });
  });

  it("le journal se tient : bilan équilibré à chaque étape, et N+1 solde la créance, sa dépréciation et la provision", () => {
    verifierLeJournal(ch);
    const chapitre = chapitreDuCas(ch, cas);
    expect(compteDeResultat(etatAvant(chapitre, cas, 0).soldes).resultat).toBe(raiDeLaCloture);
    const s = etatAvant(chapitre, cas, indexDeLEtape(chapitre, "le-stock-de-composants")).soldes;
    expect(compteDeResultat(s).resultat).toBe(rai);
    const b = bilan(s);
    expect(b.passif.find((x) => x.libelle === "Provisions")?.montant).toBe(provision);
    expect(-(s["491"] ?? 0)).toBe(depreciation);
    // La suite s'ouvre sur ce journal, et N+1 le dénoue.
    verifierLeJournal(LE_DENOUEMENT_DES_RISQUES);
    const suite = chapitreDuCas(LE_DENOUEMENT_DES_RISQUES, cas);
    expect(etatAvant(suite, cas, 0).soldes).toEqual(etatAvant(chapitre, cas, chapitre.etapes.length).soldes);
    const fin = etatAvant(suite, cas, suite.etapes.length).soldes;
    for (const compte of ["416", "491", "1511"]) expect(fin[compte] ?? 0, compte).toBe(0);
    expect([fin["654"], fin["7817"], fin["7815"], fin["658"]]).toEqual([perteHt, -depreciation, -provision, condamnation]);
    expect(fin["512"]).toBe(c(115_734.87 + verse - condamnation));
    // La créance ne laisse que les trois factures de CampusTech au compte clients.
    expect(fin["411"]).toBe(c(101_598 - ttc));
  });

  it("le stock, la ligne : examinés, laissés tels quels", () => {
    expect([PRIX_DU_JEU_APRES_NOEL, PART_DE_REVENTE_DE_LA_LIGNE]).toEqual([21.5, 0.4]);
    const vnc = c(60_000 - (60_000 / 6) * (355 / 360));
    expect([vnc, c(vnc * 0.4), c(vnc - c(vnc * 0.4))]).toEqual([50_138.89, 20_055.56, 30_083.33]);
    expect(juste(ch, "le-stock-de-composants")).toBe("Non : ces jeux entreront dans des enceintes vendues au-dessus de leur coût");
    expect(juste(ch, "equipement")).toBe("Non : l'entreprise s'en sert, et ce qu'elle lui rapporte en servant dépasse sa valeur au bilan");
    // La dépréciation que l'erreur proposerait : 600 jeux × (22,50 € − 21,50 €).
    const options = (ch.etapes.find((x) => x.id === "le-stock-de-composants") as EtapeChoix).options(cas, etatVide);
    expect(options.find((o) => o.texte.startsWith("Oui"))!.texte).toContain(`${600 * (22.5 - 21.5)} €`);
  });

  it("les curseurs, refaits à la main : jusqu'où l'objectif tient, ce que le liquidateur doit verser", () => {
    expect(OBJECTIF_ANNONCE_A_LA_BANQUE).toBe(90_000);
    // Résultat avant impôt = 106 957,96 − 5 000 − 280,25 × t ; il tient 90 000 € tant que t ≤ 11 957,96 ÷ 280,25.
    const raiAu = (t: number) => c(raiDeLaCloture - provision - unPoint * t);
    const limite = Math.floor((raiDeLaCloture - provision - 90_000) / unPoint);
    expect([unPoint, limite]).toEqual([280.25, 42]);
    expect(curseur(ch, "le-taux-de-perte")).toEqual({
      attendu: 42,
      bornes: [0, 100],
      droites: [c(raiDeLaCloture - provision), 90_000, c(raiDeLaCloture - provision - ht), 90_000],
      lecture: { "Dépréciation de la créance": c(unPoint * 42), "Résultat avant impôt": raiAu(42), "Écart à l'objectif": c(raiAu(42) - 90_000), "Impôt sur les sociétés": isDe(raiAu(42)) },
    });
    expect([raiAu(42), raiAu(43), isDe(raiAu(42))]).toEqual([90_187.46, 89_907.21, 18_297]);
    expect(ECART_DU_PARI).toBe(0.1);
    expect(juste(ch, "predire-l-objectif")).toBe("2\u202f802,50 € : 10 % de la créance hors taxes");
    // La dépréciation de 11 210 € couvre la perte hors taxes 28 025 × (1 − e) dès que e ≥ 60 %.
    expect(curseur(ch, "l-encaissement-qui-suffit")).toEqual({
      attendu: 60,
      bornes: [0, 100],
      droites: [depreciation, ht, depreciation, 0],
      lecture: { "Ce que verse le liquidateur": c(ttc * 0.6), "Perte hors taxes": depreciation, "Reprise de la dépréciation": depreciation, "Charge nette de N+1": 0 },
    });
    expect(juste(ch, "predire-le-liquidateur")).toBe("60 % de la créance : le complément de la perte estimée");
  });

  it("le laboratoire des deux exercices : N+1 sans charge nette, et un total qui ne bouge pas", () => {
    const l = laboratoire(LE_DENOUEMENT_DES_RISQUES, "le-laboratoire-des-deux-exercices");
    expect(l.depart).toEqual({ taux: 40, provision: 5_000 });
    expect(l.solution).toEqual({ taux: 50, provision: 4_000 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (t: number, p: number) => ({
      "Dépréciation de la créance, en N": -c(unPoint * t),
      "Provision pour le litige, en N": -p + 0,
      "Résultat avant impôt de N": c(raiDeLaCloture - unPoint * t - p),
      "Charge nette de N+1 sur la créance": -c(perteHt - unPoint * t) + 0,
      "Effet du jugement sur N+1": p - condamnation,
      "Total sur les deux exercices": -(perteHt + condamnation),
    });
    expect(l.auDepart).toEqual(lire(40, 5_000));
    expect(l.aLaSolution).toEqual(lire(50, 4_000));
    expect(Object.values(l.auDepart)).toEqual([-11_210, -5_000, 90_747.96, -2_802.5, 1_000, -18_012.5]);
    expect(Object.values(l.aLaSolution)).toEqual([-14_012.5, -4_000, 88_945.46, 0, 0, -18_012.5]);
    // Une seule position relève le défi : l'estimation égale la réalité, sur les deux risques.
    const reussies: string[] = [];
    for (let t = 0; t <= 100; t++) for (let p = 0; p <= 12_000; p += 500) if (l.d.atteint({ taux: t, provision: p })) reussies.push(`${t}/${p}`);
    expect(reussies).toEqual(["50/4000"]);
    // Le graphique : la charge de N et l'effet sur N+1 bougent en miroir, leur total est plat.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("taux");
    const [n, n1, total] = g.courbes;
    for (const t of [0, 40, 50, 100]) {
      const p = { taux: t, provision: 5_000 };
      expect(n!.valeur(p), `N à ${t}`).toBe(-c(unPoint * t + 5_000));
      expect(n1!.valeur(p), `N+1 à ${t}`).toBe(c(1_000 - (perteHt - unPoint * t)));
      expect(total!.valeur(p), `total à ${t}`).toBe(-18_012.5);
    }
    expect([n!.valeur({ taux: 0, provision: 5_000 }), n1!.valeur({ taux: 0, provision: 5_000 }), n1!.valeur({ taux: 100, provision: 5_000 })]).toEqual([-5_000, -13_012.5, 15_012.5]);
  });

  it("les étapes d'expert : deux exercices, la variante, le taux à rebours, et ce qu'on ne corrige pas", () => {
    expect(attendus(LE_DENOUEMENT_DES_RISQUES, "deux-annees")).toEqual({
      "Coût de la créance sur les deux exercices": perteHt,
      "Charge nette de N+1 sur la créance": chargeNette,
      "Effet du litige sur N+1": effetDuJugement,
      "Coût du litige sur les deux exercices": condamnation,
    });
    expect(PART_VERSEE_VARIANTE).toBe(0.2);
    const v = { ttc: c(ttc - ttc * 0.2) };
    expect(attendus(LE_DENOUEMENT_DES_RISQUES, "variante-vingt-pour-cent")).toEqual({
      "Perte toutes taxes comprises": v.ttc,
      "Perte hors taxes": c(v.ttc / 1.2),
      "TVA récupérée": c(v.ttc - v.ttc / 1.2),
      "Charge nette de N+1": c(v.ttc / 1.2 - depreciation),
    });
    expect([v.ttc, c(v.ttc / 1.2), c(v.ttc - v.ttc / 1.2), c(v.ttc / 1.2 - depreciation)]).toEqual([26_904, 22_420, 4_484, 11_210]);
    expect([PART_VERSEE_A_REBOURS, TAUX_ESTIME_A_REBOURS]).toEqual([0.3, 0.65]);
    const r = { perteHt: c((ttc - ttc * 0.3) / 1.2), depreciation: c(ht * 0.65) };
    const chargeNetteARebours = c(r.perteHt - r.depreciation);
    expect([r.perteHt, r.depreciation, chargeNetteARebours]).toEqual([19_617.5, 18_216.25, 1_401.25]);
    expect(attendus(LE_DENOUEMENT_DES_RISQUES, "a-rebours")).toEqual({ "Perte hors taxes": r.perteHt, "Dépréciation constatée en N": c(r.perteHt - chargeNetteARebours), "Perte estimée en N, en %": c((c(r.perteHt - chargeNetteARebours) / ht) * 100) });
    expect((LE_DENOUEMENT_DES_RISQUES.etapes.find((e) => e.id === "a-rebours") as EtapeMontants).question(cas, etatVide)).toContain("1\u202f401,25 €");
    expect(juste(LE_DENOUEMENT_DES_RISQUES, "corriger-n")).toBe("Non : l'estimation était la meilleure au 31 décembre, et l'écart va dans N+1");
    expect(juste(ch, "client-douteux")).toBe("Il passe la créance en clients douteux, et la déprécie de la perte probable, calculée sur son montant hors taxes");
    expect(juste(ch, "litige")).toBe("Une provision pour litige de 5\u202f000 € : le montant probable");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : la suite", () => verifierLesTextes(LE_DENOUEMENT_DES_RISQUES));
});

describe("le cas : la créance qui se dégrade", () => {
  const s = LA_CREANCE_QUI_SE_DEGRADE;
  const necessaire = c(ht * 0.7);
  const complement = c(necessaire - depreciation);

  it("tient la forme d'un cas dédié, chez NOVA seule, et ses dates se suivent", () => {
    casDedie(s, DEPRECIATIONS_ET_PROVISIONS);
    expect(s.commanditaire).toBe("Le directeur financier");
    expect(TAUX_DE_PERTE_REVU).toBe(0.7);
    // Les comptes de N arrêtés, puis la situation de mars, puis le dénouement de juin.
    const rang = (d: { jour: number; mois: number; exercice?: number }) => (d.exercice ?? 0) * 360 + d.mois * 30 + d.jour;
    expect(rang(ARRETE_DES_COMPTES_DE_N)).toBeLessThan(rang(DATE_DE_LA_SITUATION));
    expect(rang(DATE_DE_LA_SITUATION)).toBeLessThan(rang(f.suites.sonora.date));
  });

  it("les chiffres de la réponse, refaits à la main", () => {
    expect(attendus(s, "depreciation-necessaire")).toEqual({ "Créance hors taxes": ht, "Dépréciation nécessaire": necessaire, "Complément à doter": complement });
    expect([necessaire, complement]).toEqual([19_617.5, 8_407.5]);
    expect(attendus(s, "au-bilan")).toEqual({ "Dépréciation cumulée au compte 491": necessaire, "Valeur nette de la créance": c(ttc - necessaire) });
    expect(c(ttc - necessaire)).toBe(14_012.5);
  });

  it("le curseur et le croisement avec le dénouement de juin : le complément n'a fait qu'avancer une charge", () => {
    expect(curseur(s, "ce-que-doit-verser-le-liquidateur")).toEqual({
      attendu: 30,
      bornes: [0, 100],
      droites: [necessaire, ht, necessaire, 0],
      lecture: { "Perte hors taxes": necessaire, "Dépréciation cumulée": necessaire, "Reste à constater en charge": 0 },
    });
    const effet = c(necessaire - perteHt);
    const chargeDeN1 = c(complement + perteHt - necessaire);
    expect(attendus(s, "le-denouement-de-juin")).toEqual({ "Perte hors taxes": perteHt, "Effet du dénouement de juin": effet, "Charge nette de N+1 sur la créance": chargeDeN1 });
    expect([effet, chargeDeN1]).toEqual([5_605, 2_802.5]);
    // Avec ou sans le complément de mars, N+1 porte la même charge nette.
    expect(chargeDeN1).toBe(chargeNette);
  });

  it("le verdict : doter le complément, sans corriger l'exercice clos", () => {
    expect(juste(s, "reponse")).toBe("Doter 8\u202f407,50 € en mars, sans revenir sur les comptes de N");
    const faux = (s.etapes.find((e) => e.id === "reponse") as EtapeChoix).options(cas, etatVide).filter((o) => !o.juste).map((o) => o.texte);
    expect(faux).toEqual([
      "Corriger les comptes de N : leur dépréciation de 11\u202f210 € était fausse",
      "Doter 19\u202f617,50 € en mars : toute la perte probable",
      `Doter ${(ttc * 0.3).toLocaleString("fr-FR")} € en mars : la perte en plus, TVA comprise`,
    ]);
    expect(c(ttc * 0.3)).toBe(10_089);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
  it("le journal du cas se tient", () => verifierLeJournal(s));
});
