import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { ANALYSE_DES_ECARTS, RESPONSABLE_DE_L_ECART, syntheseDesEcarts, LES_ECARTS_ET_LEURS_RESPONSABLES } from "../../src/config/cours/chapitres/analyse-des-ecarts";
import { L_USINE_DE_NOVA, USINES_DU_COURS } from "../../src/config/cours/monde/nova-usine";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LE_RESULTAT_QUI_MANQUE, resultatQuiManque } from "../../src/config/cours/situations/par-chapitre/le-resultat-qui-manque";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * L'ANALYSE DES ÉCARTS, DU RÉSULTAT PRÉVU AU RÉSULTAT RÉEL, À L'USINE DU MONDE DU COURS, ET SON CAS,
 * « LE RÉSULTAT QUI MANQUE ».
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de l'usine (monde/nova-usine.ts),
 * sans passer par les fonctions du chapitre ni par le modèle du contrôle budgétaire ; les valeurs
 * absolues sont épinglées, le tableau de passage doit retomber exactement sur l'écart de résultat,
 * et les verdicts sont épinglés. Les textes passent la garde de texte des chapitres du monde du
 * cours (celle du pilote, tests/cours/mhr-productivite-et-saison.test.ts), étendue au tri.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = L_USINE_DE_NOVA;
const r = f.realise;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un montant tel que l'élève le lit : « 13 000 € », espaces fines comprises. */
const euros = (x: number) => `${x.toLocaleString("fr-FR")} €`;

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "choix":
      return [e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "tri":
      return [e.question(c), ...e.categories.map((k) => k.libelle), ...e.elements(c).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(c), ...tableau];
    case "curseur": {
      const g = e.grandeur?.(c);
      const k = e.rates?.(c);
      const d = e.droites(c);
      return [e.question(c), g?.libelle ?? "", g?.unite ?? "", k?.dessous ?? "", k?.dessus ?? "", ...(e.zones ?? []), e.montrer ?? "", ...d.libelles, ...e.lecture(c, e.cible(c).attendu).map((l) => l.libelle), ...e.explication(c)];
    }
    case "simulation": {
      const defi = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [
        e.question(c),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]),
        ...e.lecture(c, depart).map((l) => l.libelle),
        defi.consigne,
        defi.indice(depart),
        defi.indice({ ...depart, prixNomade: 64 }),
        e.montrer ?? "",
        ...e.explication(c, defi.solution),
      ];
    }
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis"];

/** Les gardes de texte et de forme du pilote, communes aux chapitres et aux cas, étendues au tri. */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      // Pas de nombre en toutes lettres venu de la fiche ou du modèle : les enceintes, les heures, les lignes du passage.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze) (enceintes?|modèles?|heures?(-machine)?|trimestres?|kilos?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(trois|quatre|cinq|six|sept|huit|neuf|dix|onze) (écarts|effets|lignes|responsables)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
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
    if (e.type === "tri") {
      const elements = e.elements(cas);
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) expect(e.categories.map((k) => k.code), `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** L'option juste d'une étape de choix. */
const optionJuste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!;

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation) {
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/**
 * LE TRIMESTRE DE L'USINE, REFAIT À LA MAIN SUR LA FICHE : le coût préétabli de chaque enceinte
 * (matière, main-d'œuvre directe, heures-machine au coût standard variable + fixe ÷ activité
 * normale), les deux résultats, et les onze lignes du tableau de passage avec leur effet sur le
 * résultat (positif favorable).
 */
const [nomade, salon] = f.modeles;
const N = nomade!;
const S = salon!;
const qN = r.ventes.nomade.quantite;
const qS = r.ventes.salon.quantite;
const cHm = f.centre.coutVariableParHeure + f.centre.chargesFixes / f.centre.activiteNormale;
const coutDe = (m: typeof N) => m.matiereParUnite * f.prixStandardDuKilo + m.heuresParUnite * f.tauxHoraireStandard + m.heuresMachineParUnite * cHm;
const margeDe = (m: typeof N) => m.prixPrevu - coutDe(m);
const caPrevu = N.quantitePrevue * N.prixPrevu + S.quantitePrevue * S.prixPrevu;
const caReel = qN * r.ventes.nomade.prix + qS * r.ventes.salon.prix;
const budgetStandard = N.quantitePrevue * coutDe(N) + S.quantitePrevue * coutDe(S);
const preetabliDuReel = qN * coutDe(N) + qS * coutDe(S);
const coutReel = centime(r.matiere.kilos * r.matiere.prixDuKilo + r.mainDOeuvre.heures * r.mainDOeuvre.tauxHoraire + r.centre.cout);
const resultatPrevu = caPrevu - budgetStandard - f.distributionPrevue;
const resultatReel = centime(caReel - coutReel - r.distribution);
const kilosPreetablis = qN * N.matiereParUnite + qS * S.matiereParUnite;
const heuresPreetablies = qN * N.heuresParUnite + qS * S.heuresParUnite;
const hmPreetablies = qN * N.heuresMachineParUnite + qS * S.heuresMachineParUnite;
const budgetFlexible = f.centre.chargesFixes + f.centre.coutVariableParHeure * r.centre.heuresMachine;
const qPrevue = N.quantitePrevue + S.quantitePrevue;
const qReelle = qN + qS;
const margeMoyenne = (N.quantitePrevue * margeDe(N) + S.quantitePrevue * margeDe(S)) / qPrevue;
/** Les onze effets sur le résultat, dans l'ordre du tableau de passage. */
const effets: Record<string, number> = {
  "Ventes : écart sur prix": centime((r.ventes.nomade.prix - N.prixPrevu) * qN + (r.ventes.salon.prix - S.prixPrevu) * qS),
  "Ventes : écart sur quantité globale": centime((qReelle - qPrevue) * margeMoyenne),
  "Ventes : écart sur composition": centime((qN - (qReelle * N.quantitePrevue) / qPrevue) * margeDe(N) + (qS - (qReelle * S.quantitePrevue) / qPrevue) * margeDe(S)),
  "Matière : écart sur prix": centime(-(r.matiere.prixDuKilo - f.prixStandardDuKilo) * r.matiere.kilos),
  "Matière : écart sur quantité": centime(-(r.matiere.kilos - kilosPreetablis) * f.prixStandardDuKilo),
  "Main-d'œuvre directe : écart sur taux": centime(-(r.mainDOeuvre.tauxHoraire - f.tauxHoraireStandard) * r.mainDOeuvre.heures),
  "Main-d'œuvre directe : écart sur temps": centime(-(r.mainDOeuvre.heures - heuresPreetablies) * f.tauxHoraireStandard),
  "Centre de montage : écart sur budget": centime(-(r.centre.cout - budgetFlexible)),
  "Centre de montage : écart sur activité": centime(-(budgetFlexible - cHm * r.centre.heuresMachine)),
  "Centre de montage : écart sur rendement": centime(-(r.centre.heuresMachine - hmPreetablies) * cHm),
  Distribution: centime(-(r.distribution - f.distributionPrevue)),
};
const sommeDe = (postes: readonly string[]) => centime(postes.reduce((t, p) => t + effets[p]!, 0));
const POSTES = Object.keys(effets);
const VENTES = POSTES.filter((p) => p.startsWith("Ventes"));
const PRODUCTION = POSTES.filter((p) => !p.startsWith("Ventes") && p !== "Distribution");

describe("l'analyse des écarts, à l'usine du monde du cours", () => {
  it("la fiche est celle de NOVA, le chapitre et son cas ne se jouent que là", () => {
    expect(USINES_DU_COURS[code]).toBe(f);
    expect(f.entreprise).toBe(cas.entreprise);
    expect(ANALYSE_DES_ECARTS.entreprises?.codes).toEqual(["nova"]);
    expect(LE_RESULTAT_QUI_MANQUE.entreprises?.codes).toEqual(ANALYSE_DES_ECARTS.entreprises?.codes);
    expect(casDuChapitre("analyse-des-ecarts")).toBe(LE_RESULTAT_QUI_MANQUE);
    expect([ANALYSE_DES_ECARTS.code, ANALYSE_DES_ECARTS.parcours, ANALYSE_DES_ECARTS.palier, ANALYSE_DES_ECARTS.libre]).toEqual(["analyse-des-ecarts", "controle-de-gestion", 4, false]);
    expect([LE_RESULTAT_QUI_MANQUE.parcours, LE_RESULTAT_QUI_MANQUE.palier, LE_RESULTAT_QUI_MANQUE.reprend]).toEqual(["controle-de-gestion", 4, ["analyse-des-ecarts"]]);
    expect(ANALYSE_DES_ECARTS.titre).toBe("L'analyse des écarts : du résultat prévu au résultat réel");
  });

  it("le chapitre ne lit plus l'arène ni l'ancien fichier des écarts : seulement le monde du cours", () => {
    const source = readFileSync(join(process.cwd(), "src/config/cours/chapitres/analyse-des-ecarts.ts"), "utf8");
    expect(source).not.toMatch(/from "\.\.\/ecarts"/);
    expect(source).not.toMatch(/causeDuChiffreDAffaires|anneeJouee|ecartsDuTrimestre|casDeLEntreprise/);
    expect(source).toMatch(/from "\.\.\/monde\/ecarts"/);
  });

  it("les chiffres de la fiche, refaits à la main, sont ceux de la consigne", () => {
    expect([coutDe(N), coutDe(S), margeDe(N), margeDe(S), cHm]).toEqual([32, 75, 27, 44, 40]);
    expect([caPrevu, budgetStandard, resultatPrevu]).toEqual([1_184_000, 684_000, 350_000]);
    expect([caReel, coutReel, resultatReel]).toEqual([1_183_600, 726_700, 302_900]);
    expect(Object.values(effets)).toEqual([-12_800, -12_500, 11_900, -7_400, -7_500, -8_800, 5_000, -9_800, 4_800, -6_000, -4_000]);
    expect([sommeDe(VENTES), sommeDe(PRODUCTION), effets.Distribution]).toEqual([-13_400, -29_700, -4_000]);
    // Le tableau de passage retombe exactement sur l'écart de résultat.
    expect(sommeDe(POSTES)).toBe(centime(resultatReel - resultatPrevu));
    expect(sommeDe(POSTES)).toBe(-47_100);
  });

  it("guidé : les deux résultats, le coût préétabli de la production réelle, l'écart global sur coûts", () => {
    expect(attendus(ANALYSE_DES_ECARTS, "les-deux-resultats")).toEqual({
      "Résultat prévu": resultatPrevu,
      "Résultat réel": resultatReel,
      "Écart de résultat": centime(resultatReel - resultatPrevu),
    });
    expect(attendus(ANALYSE_DES_ECARTS, "le-bon-repere")).toEqual({
      "Coût préétabli de la production réelle": preetabliDuReel,
      "Écart global sur coûts": centime(coutReel - preetabliDuReel),
    });
    expect([preetabliDuReel, centime(coutReel - preetabliDuReel)]).toEqual([697_000, 29_700]);
    // Le piège du budget de départ : le dépassement face au budget standard, dont une part vient du volume.
    const s = syntheseDesEcarts(cas);
    expect([s.depassementDuBudget, s.partDuVolume]).toEqual([centime(coutReel - budgetStandard), preetabliDuReel - budgetStandard]);
    expect([s.depassementDuBudget, s.partDuVolume]).toEqual([42_700, 13_000]);
    expect(optionJuste(ANALYSE_DES_ECARTS, "le-budget-de-depart").texte).toBe(`Non : ${euros(13_000)} de ce dépassement viennent de ce qui a été vendu ; l'usine répond de ${euros(29_700)}`);
  });

  it("autonome : l'effet des ventes, le volume à la marge, le signe au passage, les écarts qui se compensent", () => {
    const volume = (qN - N.quantitePrevue) * margeDe(N) + (qS - S.quantitePrevue) * margeDe(S);
    expect(attendus(ANALYSE_DES_ECARTS, "la-part-des-ventes")).toEqual({
      "Écart sur prix de vente": effets["Ventes : écart sur prix"],
      "Écart sur volume, à la marge préétablie": volume,
      "Effet des ventes sur le résultat": centime(effets["Ventes : écart sur prix"]! + volume),
    });
    // Les deux lectures du volume concordent : par modèle, ou quantité globale plus composition.
    expect(volume).toBe(centime(effets["Ventes : écart sur quantité globale"]! + effets["Ventes : écart sur composition"]!));
    // Au prix, l'écart sur quantités ferait +12 400 € : 13 000 € de plus qu'à la marge, la part du volume.
    const auPrix = (qN - N.quantitePrevue) * N.prixPrevu + (qS - S.quantitePrevue) * S.prixPrevu;
    expect([auPrix, auPrix - volume]).toEqual([12_400, preetabliDuReel - budgetStandard]);
    expect(optionJuste(ANALYSE_DES_ECARTS, "volume-au-prix").texte).toBe("Parce qu'au résultat, une enceinte vendue de plus n'apporte que sa marge préétablie");
    // Les deux erreurs de signe : tout reporter tel quel, ou tout inverser.
    const brut = POSTES.map((p) => (p.startsWith("Ventes") ? effets[p]! : -effets[p]!));
    const s = syntheseDesEcarts(cas);
    expect(s.sommeSansSigne).toBe(centime(brut.reduce((t, x) => t + x, 0)));
    expect([s.sommeSansSigne, s.sommeTousInverses]).toEqual([20_300, -20_300]);
    expect(optionJuste(ANALYSE_DES_ECARTS, "le-signe").texte).toBe("Avec le signe contraire : une charge plus forte que prévu retire autant au résultat");
    expect(optionJuste(ANALYSE_DES_ECARTS, "se-compensent").texte).toBe("Que chacun de ces petits écarts cache deux gros écarts de sens contraire");
  });

  it("expert : le tableau de passage complet, chaque écart avec son signe, et le résultat réel retrouvé", () => {
    expect(attendus(ANALYSE_DES_ECARTS, "le-tableau-de-passage")).toEqual({
      ...Object.fromEntries(POSTES.map((p) => [`Effet sur le résultat · ${p}`, effets[p]])),
      "Résultat réel retrouvé": centime(resultatPrevu + sommeDe(POSTES)),
    });
    expect(centime(resultatPrevu + sommeDe(POSTES))).toBe(resultatReel);
  });

  it("expert : le coût réel du centre à rebours, et l'heure de trop qui pèse sur le rendement et sur l'activité", () => {
    const perdues = -effets["Centre de montage : écart sur rendement"]! / cHm;
    const heures = hmPreetablies + perdues;
    expect([hmPreetablies, perdues, heures]).toEqual([5_050, 150, r.centre.heuresMachine]);
    expect(attendus(LES_ECARTS_ET_LEURS_RESPONSABLES, "a-rebours")).toEqual({
      "Heures-machine réelles": heures,
      "Budget flexible de l'activité réelle": f.centre.chargesFixes + f.centre.coutVariableParHeure * heures,
      "Coût réel du centre": f.centre.chargesFixes + f.centre.coutVariableParHeure * heures - effets["Centre de montage : écart sur budget"]!,
    });
    expect(attendus(LES_ECARTS_ET_LEURS_RESPONSABLES, "a-rebours")["Coût réel du centre"]).toBe(r.centre.cout);
    const partFixe = f.centre.chargesFixes / f.centre.activiteNormale;
    expect(attendus(LES_ECARTS_ET_LEURS_RESPONSABLES, "l-heure-de-trop")).toEqual({
      "Heures-machine au-delà de l'activité normale": r.centre.heuresMachine - f.centre.activiteNormale,
      "Heures-machine au-delà du préétabli de la production réelle": perdues,
      "Part du boni due aux heures perdues": perdues * partFixe,
      "Effet net des heures perdues sur le résultat": effets["Centre de montage : écart sur rendement"]! + perdues * partFixe,
    });
    // Net, une heure perdue ne coûte que son coût variable : 150 × 16 € = 2 400 €.
    expect(effets["Centre de montage : écart sur rendement"]! + perdues * partFixe).toBe(-perdues * f.centre.coutVariableParHeure);
    expect(perdues * partFixe).toBe(3_600);
  });

  it("expert : chaque écart à son responsable, la part de chacun, et le premier à agir", () => {
    const tri = LES_ECARTS_ET_LEURS_RESPONSABLES.etapes.find((e) => e.id === "qui-doit-agir") as EtapeTri;
    const attendu: Record<string, string> = {
      "Ventes : écart sur prix": "commercial",
      "Ventes : écart sur quantité globale": "commercial",
      "Ventes : écart sur composition": "commercial",
      "Matière : écart sur prix": "achats",
      "Matière : écart sur quantité": "atelier",
      "Main-d'œuvre directe : écart sur taux": "rh",
      "Main-d'œuvre directe : écart sur temps": "atelier",
      "Centre de montage : écart sur budget": "centre",
      "Centre de montage : écart sur activité": "direction",
      "Centre de montage : écart sur rendement": "atelier",
    };
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, x.categorie]))).toEqual(attendu);
    for (const x of tri.elements(cas)) expect(x.montant, x.libelle).toBe(effets[x.libelle]);
    // Toute ligne du passage du modèle a un responsable.
    for (const l of syntheseDesEcarts(cas).e.passage) expect(RESPONSABLE_DE_L_ECART[l.poste], l.poste).toBeDefined();
    const part = (rr: string) => sommeDe(Object.keys(attendu).filter((p) => attendu[p] === rr));
    expect(attendus(LES_ECARTS_ET_LEURS_RESPONSABLES, "la-part-de-chacun")).toEqual({
      "Part du commercial": part("commercial"),
      "Part des achats": part("achats"),
      "Part de l'atelier": part("atelier"),
      "Part des ressources humaines": part("rh"),
      "Part du responsable du centre": part("centre"),
      "Part de la direction": part("direction"),
    });
    expect(["commercial", "centre", "rh", "atelier", "achats", "direction"].map(part)).toEqual([-13_400, -9_800, -8_800, -8_500, -7_400, 4_800]);
    expect(syntheseDesEcarts(cas).ordre).toEqual(["commercial", "centre", "rh", "atelier", "achats", "distribution", "direction"]);
    expect(optionJuste(LES_ECARTS_ET_LEURS_RESPONSABLES, "la-prime").texte).toBe("C'est risqué : une matière achetée moins cher peut se gaspiller à l'atelier");
    expect(optionJuste(LES_ECARTS_ET_LEURS_RESPONSABLES, "le-tableau-de-bord").texte).toBe("La vitesse et les causes : il arrive après le trimestre, en euros");
  });

  it("les trois temps : au moins deux étapes d'expert à trois champs ou plus, et la synthèse finit par l'arène", () => {
    const experts = ["le-tableau-de-passage", "a-rebours", "l-heure-de-trop", "la-part-de-chacun"];
    // Le chapitre est découpé en deux (aucun chapitre de plus de 20 étapes) : chaque étape se lit dans sa partie.
    const partieDe = (id: string) => (LES_ECARTS_ET_LEURS_RESPONSABLES.etapes.some((e) => e.id === id) ? LES_ECARTS_ET_LEURS_RESPONSABLES : ANALYSE_DES_ECARTS);
    for (const id of experts) expect(Object.keys(attendus(partieDe(id), id)).length, id).toBeGreaterThanOrEqual(3);
    for (const partie of [ANALYSE_DES_ECARTS, LES_ECARTS_ET_LEURS_RESPONSABLES]) {
      const fin = partie.etapes.at(-1)!;
      if (fin.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
      expect(fin.texte(cas).at(-1), partie.code).toBe("Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.");
    }
    // La convention est dite dès l'intro, et chaque question de montants dit le signe attendu.
    const intro = ANALYSE_DES_ECARTS.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("l'intro n'est pas une lecture");
    expect(intro.texte(cas).join(" ")).toContain("Un écart est toujours le réel moins le prévu.");
    // Toute question qui demande un écart ou un effet dit le signe attendu ; seule l'étape à rebours, qui demande des heures et des coûts, n'en a pas besoin.
    for (const e of [...ANALYSE_DES_ECARTS.etapes, ...LES_ECARTS_ET_LEURS_RESPONSABLES.etapes, ...LE_RESULTAT_QUI_MANQUE.etapes]) {
      if (e.type === "montants" && e.id !== "a-rebours") expect(e.question(cas, etatVide), e.id).toMatch(/[Nn]égatif|positif/);
    }
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ANALYSE_DES_ECARTS));
});

describe("le résultat qui manque, le cas de l'analyse des écarts", () => {
  it("ce dont l'usine répond, ce que font les ventes, et la ligne du rendement retrouvée à rebours", () => {
    expect(attendus(LE_RESULTAT_QUI_MANQUE, "le-cout-du-reel")).toEqual({
      "Coût préétabli de la production réelle": preetabliDuReel,
      "Part du dépassement venue de ce qui a été vendu": preetabliDuReel - budgetStandard,
      "Écart global sur coûts, dont l'usine répond": centime(coutReel - preetabliDuReel),
    });
    const volume = (qN - N.quantitePrevue) * margeDe(N) + (qS - S.quantitePrevue) * margeDe(S);
    expect(attendus(LE_RESULTAT_QUI_MANQUE, "les-ventes")).toEqual({
      "Écart sur prix de vente": effets["Ventes : écart sur prix"],
      "Écart sur volume, à la marge préétablie": volume,
      "Effet des ventes sur le résultat": sommeDe(VENTES),
    });
    // À rebours : l'écart global sur coûts moins les six écarts que l'usine a chiffrés.
    const chiffres = PRODUCTION.filter((p) => p !== "Centre de montage : écart sur rendement").reduce((t, p) => t - effets[p]!, 0);
    const rendement = centime(coutReel - preetabliDuReel - chiffres);
    expect([chiffres, rendement]).toEqual([23_700, 6_000]);
    expect(attendus(LE_RESULTAT_QUI_MANQUE, "la-ligne-du-rendement")).toEqual({
      "Écart sur rendement": rendement,
      "Heures-machine perdues": rendement / cHm,
      "Heures-machine réelles du centre": hmPreetablies + rendement / cHm,
    });
    expect(hmPreetablies + rendement / cHm).toBe(r.centre.heuresMachine);
  });

  it("le jugement : les trois partages retombent sur l'écart, un seul compte chaque écart une fois chez qui le décide", () => {
    const x = resultatQuiManque(cas);
    const ecart = centime(resultatReel - resultatPrevu);
    const juste = [sommeDe(VENTES), sommeDe(PRODUCTION), effets.Distribution!];
    const duCommercial = [centime(caReel - caPrevu), centime(budgetStandard - coutReel), effets.Distribution!];
    const deLUsine = [sommeDe(VENTES) - (preetabliDuReel - budgetStandard), sommeDe(PRODUCTION) + (preetabliDuReel - budgetStandard), effets.Distribution!];
    for (const p of [juste, duCommercial, deLUsine]) expect(centime(p.reduce((t, v) => t + v, 0))).toBe(ecart);
    expect([x.commercial.ventes, x.commercial.usine]).toEqual(duCommercial.slice(0, 2));
    expect([x.usine.ventes, x.usine.usine]).toEqual(deLUsine.slice(0, 2));
    expect(duCommercial.slice(0, 2)).toEqual([-400, -42_700]);
    expect(deLUsine.slice(0, 2)).toEqual([-26_400, -16_700]);
    expect(optionJuste(LE_RESULTAT_QUI_MANQUE, "la-preuve").texte).toBe("Non : un total qui retombe prouve le calcul, pas le partage");
    expect(optionJuste(LE_RESULTAT_QUI_MANQUE, "reponse").texte).toBe(`L'usine en porte ${euros(29_700)}, les ventes ${euros(13_400)}, la distribution ${euros(4_000)}`);
    reponseSansIndice(LE_RESULTAT_QUI_MANQUE);
  });

  it("la forme d'un cas : la question d'abord avec ses documents, aucune autre lecture, la réponse pour finir", () => {
    const [premiere, ...suite] = LE_RESULTAT_QUI_MANQUE.etapes;
    expect(premiere!.type).toBe("lecture");
    expect(premiere!.tableau).toBeDefined();
    expect(suite.filter((e) => e.type === "lecture")).toHaveLength(0);
    expect(LE_RESULTAT_QUI_MANQUE.etapes.at(-1)!.type).toBe("choix");
    expect(LE_RESULTAT_QUI_MANQUE.etapes.at(-1)!.id).toBe("reponse");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_RESULTAT_QUI_MANQUE));
});

/** Une étape de curseur, ou de laboratoire, par son identifiant. */
const curseur = (ch: Chapitre, id: string) => ch.etapes.find((e) => e.id === id) as EtapeCurseur;
const laboratoire = (ch: Chapitre, id: string) => ch.etapes.find((e) => e.id === id) as EtapeSimulation;
const lu = (lignes: readonly { libelle: string; montant: number }[]) => Object.fromEntries(lignes.map((l) => [l.libelle, l.montant]));

describe("l'expérience : prédire, manipuler, constater, puis formaliser", () => {
  /** Le résultat réel quand un seul chiffre réel bouge, refait à la main sur la fiche. */
  const auPrix = (p: number) => centime(resultatReel + (p - r.ventes.nomade.prix) * qN);
  const auxKilos = (k: number) => centime(resultatReel + (r.matiere.kilos - k) * r.matiere.prixDuKilo);
  const auxHeures = (h: number) => centime(resultatReel + (r.centre.heuresMachine - h) * f.centre.coutVariableParHeure);

  it("les curseurs viennent avant les calculs qu'ils éclairent, le pari avant le premier", () => {
    // Les deux parties du chapitre, dans l'ordre où l'élève les fait.
    const ids = [...ANALYSE_DES_ECARTS.etapes, ...LES_ECARTS_ET_LEURS_RESPONSABLES.etapes].map((e) => e.id);
    const avant = (a: string, b: string) => expect(ids.indexOf(a), `${a} avant ${b}`).toBeLessThan(ids.indexOf(b));
    avant("le-pari", "le-levier-du-prix");
    avant("le-levier-du-prix", "la-part-des-ventes");
    avant("le-levier-des-kilos", "le-tableau-de-passage");
    avant("le-levier-des-heures", "l-heure-de-trop");
    expect(ANALYSE_DES_ECARTS.etapes.filter((e) => e.type === "curseur").length).toBeGreaterThanOrEqual(2);
    const ids2 = LE_RESULTAT_QUI_MANQUE.etapes.map((e) => e.id);
    expect(ids2.indexOf("le-mix")).toBeLessThan(ids2.indexOf("les-ventes"));
    expect(optionJuste(ANALYSE_DES_ECARTS, "le-pari").texte).toBe("Non : il manquerait encore une bonne part de l'écart");
  });

  it("le prix de la Nomade : 62 € pour rattraper seul le budget, au-dessus du prix prévu ; au prix prévu il manque encore 25 100 €", () => {
    const e = curseur(ANALYSE_DES_ECARTS, "le-levier-du-prix");
    // Le plus petit prix entier p tel que 302 900 + (p − 57) × 11 000 ≥ 350 000 : 57 + 47 100 ÷ 11 000 = 61,28, donc 62.
    expect(e.cible(cas)).toEqual({ attendu: 62, min: 54, max: 66 });
    expect([auPrix(61), auPrix(62)]).toEqual([346_900, 357_900]);
    const d = e.droites(cas);
    expect([d.produit(54), d.produit(66), d.cout(54), d.cout(66)]).toEqual([auPrix(54), auPrix(66), resultatPrevu, resultatPrevu]);
    expect(lu(e.lecture(cas, 62))).toEqual({
      "Écart sur prix de vente": (62 - N.prixPrevu) * qN + (r.ventes.salon.prix - S.prixPrevu) * qS,
      "Résultat de l'usine": 357_900,
      "Résultat prévu": resultatPrevu,
      "Écart de résultat": 7_900,
    });
    expect(centime(resultatPrevu - auPrix(N.prixPrevu))).toBe(25_100);
    expect(e.grandeur?.(cas).libelle).toBe("Prix de vente de la Nomade");
  });

  it("les kilos : il faudrait n'en consommer que 15 441, sous les 18 000 du standard ; sans gaspillage il manque encore 39 400 €", () => {
    const e = curseur(ANALYSE_DES_ECARTS, "le-levier-des-kilos");
    // Le plus grand k entier tel que 302 900 + (18 500 − k) × 15,40 ≥ 350 000 : 18 500 − 47 100 ÷ 15,40 = 15 441,56, donc 15 441.
    expect(e.sens).toBe("plus-grande");
    expect(e.cible(cas)).toEqual({ attendu: 15_441, min: 15_000, max: 19_000 });
    expect(auxKilos(15_441)).toBeGreaterThanOrEqual(resultatPrevu);
    expect(auxKilos(15_442)).toBeLessThan(resultatPrevu);
    const d = e.droites(cas);
    expect([d.produit(15_000), d.produit(19_000), d.cout(15_000)]).toEqual([auxKilos(15_000), auxKilos(19_000), resultatPrevu]);
    expect(lu(e.lecture(cas, 15_441))).toEqual({
      "Écart sur prix de la matière": centime((r.matiere.prixDuKilo - f.prixStandardDuKilo) * 15_441),
      "Écart sur quantité de matière": (15_441 - kilosPreetablis) * f.prixStandardDuKilo,
      "Résultat de l'usine": auxKilos(15_441),
      "Écart de résultat": centime(auxKilos(15_441) - resultatPrevu),
    });
    expect(centime(resultatPrevu - auxKilos(kilosPreetablis))).toBe(39_400);
  });

  it("les heures-machine : chacune ne vaut que son coût variable, il faudrait n'en tourner que 2 256 ; les trois leviers au standard ne rendent que 32 100 €", () => {
    const e = curseur(LES_ECARTS_ET_LEURS_RESPONSABLES, "le-levier-des-heures");
    // Le plus grand h entier tel que 302 900 + (5 200 − h) × 16 ≥ 350 000 : 5 200 − 47 100 ÷ 16 = 2 256,25, donc 2 256.
    expect(e.cible(cas)).toEqual({ attendu: 2_256, min: 2_000, max: 5_500 });
    expect(auxHeures(2_256)).toBeGreaterThanOrEqual(resultatPrevu);
    expect(auxHeures(2_257)).toBeLessThan(resultatPrevu);
    const d = e.droites(cas);
    expect([d.produit(2_000), d.produit(5_500), d.cout(5_500)]).toEqual([auxHeures(2_000), auxHeures(5_500), resultatPrevu]);
    expect(lu(e.lecture(cas, 2_256))).toEqual({
      "Écart sur rendement": (2_256 - hmPreetablies) * cHm,
      "Écart sur activité": f.centre.chargesFixes + f.centre.coutVariableParHeure * 2_256 - cHm * 2_256,
      "Résultat de l'usine": auxHeures(2_256),
      "Écart de résultat": centime(auxHeures(2_256) - resultatPrevu),
    });
    // Ramenés à leur standard : la Nomade à 59 € (+22 000), 18 000 kg (+7 700), 5 050 heures-machine (+2 400).
    const ensemble = centime(auPrix(N.prixPrevu) - resultatReel + auxKilos(kilosPreetablis) - resultatReel + auxHeures(hmPreetablies) - resultatReel);
    expect([auPrix(N.prixPrevu) - resultatReel, centime(auxKilos(kilosPreetablis) - resultatReel), auxHeures(hmPreetablies) - resultatReel]).toEqual([22_000, 7_700, 2_400]);
    expect([ensemble, centime(resultatPrevu - resultatReel - ensemble)]).toEqual([32_100, 15_000]);
    expect([syntheseDesEcarts(cas).leviers.ensemble, syntheseDesEcarts(cas).leviers.resteAuStandard]).toEqual([32_100, 15_000]);
  });

  it("le cas : il aurait fallu 4 636 Salon pour un écart sur volume nul ; à la composition du budget, il serait de −12 500 €", () => {
    const e = curseur(LE_RESULTAT_QUI_MANQUE, "le-mix");
    const marge = (s: number) => (qReelle - s) * margeDe(N) + s * margeDe(S);
    // Le plus petit s entier tel que 27 × (15 600 − s) + 44 × s ≥ 500 000 : (500 000 − 421 200) ÷ 17 = 4 635,29, donc 4 636.
    expect(e.cible(cas)).toEqual({ attendu: 4_636, min: 3_000, max: 6_000 });
    expect(marge(4_636)).toBeGreaterThanOrEqual(500_000);
    expect(marge(4_635)).toBeLessThan(500_000);
    const d = e.droites(cas);
    expect([d.produit(3_000), d.produit(6_000), d.cout(3_000)]).toEqual([marge(3_000), marge(6_000), 500_000]);
    const composition = (s: number) => centime((qReelle - s - qReelle * 0.75) * margeDe(N) + (s - qReelle * 0.25) * margeDe(S));
    expect(lu(e.lecture(cas, 4_636))).toEqual({
      "Écart sur quantité globale": effets["Ventes : écart sur quantité globale"],
      "Écart sur composition": composition(4_636),
      "Écart sur volume": centime(effets["Ventes : écart sur quantité globale"]! + composition(4_636)),
    });
    expect([composition(4_636), composition(3_900), composition(qS)]).toEqual([12_512, 0, 11_900]);
  });

  it("le laboratoire : au départ le trimestre réel, au standard 343 800 €, et la solution à 17 500 kg qui rattrape le budget", () => {
    const e = laboratoire(LES_ECARTS_ET_LEURS_RESPONSABLES, "le-laboratoire");
    const leviers = e.leviers(cas);
    const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ prixNomade: 57, kilos: 18_500, taux: 26, heures: 5_200 });
    // Au départ, la lecture est le tableau de passage du modèle, refait à la main.
    const auDepart = lu(e.lecture(cas, depart));
    for (const p of POSTES) expect(auDepart[p], p).toBe(effets[p]);
    expect([auDepart["Écart de résultat"], auDepart["Résultat de l'usine"]]).toEqual([-47_100, resultatReel]);
    // À une position : seul ce que chaque levier touche bouge, refait à la main.
    const aLaPosition = (p: number, k: number, t: number, h: number): Record<string, number> => ({
      ...effets,
      "Ventes : écart sur prix": (p - N.prixPrevu) * qN + (r.ventes.salon.prix - S.prixPrevu) * qS,
      "Matière : écart sur prix": centime(-(r.matiere.prixDuKilo - f.prixStandardDuKilo) * k),
      "Matière : écart sur quantité": -(k - kilosPreetablis) * f.prixStandardDuKilo + 0,
      "Main-d'œuvre directe : écart sur taux": -(t - f.tauxHoraireStandard) * r.mainDOeuvre.heures + 0,
      "Centre de montage : écart sur activité": -(f.centre.chargesFixes + f.centre.coutVariableParHeure * h - cHm * h) + 0,
      "Centre de montage : écart sur rendement": -(h - hmPreetablies) * cHm + 0,
    });
    const auStandard = aLaPosition(N.prixPrevu, kilosPreetablis, f.tauxHoraireStandard, hmPreetablies);
    const resultatAuStandard = centime(resultatPrevu + Object.values(auStandard).reduce((t, x) => t + x, 0));
    expect(resultatAuStandard).toBe(343_800);
    // Il manque 6 200 € : 500 kg sous le préétabli, par pas de 100 kg (400 kg ne rendent que 6 160 €).
    const solution = e.defi(cas).solution;
    expect(solution).toEqual({ prixNomade: 59, kilos: 17_500, taux: 25, heures: 5_050 });
    const attendu = aLaPosition(59, 17_500, 25, 5_050);
    const aLaSolution = lu(e.lecture(cas, solution));
    for (const p of POSTES) expect(aLaSolution[p], p).toBe(attendu[p]);
    const resultatALaSolution = centime(resultatPrevu + Object.values(attendu).reduce((t, x) => t + x, 0));
    expect(resultatALaSolution).toBe(351_500);
    expect(aLaSolution["Résultat de l'usine"]).toBe(resultatALaSolution);
    expect(e.defi(cas).atteint(solution)).toBe(true);
    expect(e.defi(cas).atteint({ ...solution, kilos: 17_600 })).toBe(false);
    // Le prix de la Nomade au-dessus de son prix prévu ne compte pas, même si le résultat est rattrapé.
    expect(e.defi(cas).atteint({ ...depart, prixNomade: 62 })).toBe(false);
    expect(e.defi(cas).atteint(depart)).toBe(false);
  });
});
