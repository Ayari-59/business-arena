import { describe, expect, it } from "vitest";
import {
  LA_CONCORDANCE_DES_RESULTATS,
  concordanceDeNova,
  laboratoireDeLaConcordance,
  positionsProches,
} from "../../src/config/cours/chapitres/la-concordance-des-resultats";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { SI_LA_GERANTE_SE_PAYAIT, siLaGeranteSePayait } from "../../src/config/cours/situations/par-chapitre/si-la-gerante-se-payait";
import { BALANCE_AVANT_INVENTAIRE, CLOTURE_DE_LA_FICHE, LIVRAISONS_DU_MOIS } from "../../src/config/cours/monde/exercice-de-nova";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LA CONCORDANCE DES RÉSULTATS (l'exercice N de NOVA) : le résultat de la comptabilité générale refait
 * à la main sur la balance et les travaux d'inventaire de la fiche, les douze mois de la gestion refaits
 * à la main (leurs unités d'œuvre et leurs arrondis), et le tableau de passage qui retrouve, au
 * centime, le résultat net de l'exercice.
 */

const ch = LA_CONCORDANCE_DES_RESULTATS;
const x = concordanceDeNova(NOVA);
/** L'arrondi au centime d'un énoncé : la moitié monte, sur la valeur décimale (pas sur son approximation binaire). */
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;
const solde = (compte: string) => BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === compte)!;

/** Les douze mois de la gestion, refaits sans le modèle : centres par la main, unités d'œuvre arrondies. */
function moisALaMain(m: number) {
  const q = LIVRAISONS_DU_MOIS[m]!;
  const remise = m === 8 ? 1_180 : m === 9 ? 1_475 : 0;
  const ca = q * 59 - remise;
  const assure = m >= 9;
  // Les centres principaux après répartition : sans l'assurance de janvier à septembre, avec elle ensuite.
  const centres = { appro: 5_463.55, prod: assure ? 20_384.6 : 19_984.6, dist: assure ? 10_034.85 : 9_934.85 };
  const achats = m === 11 ? 33_000 + 34_500 : q * 22;
  const uo = { appro: achats / 100, prod: q, dist: ca / 100 };
  const cout = { appro: cent(centres.appro / uo.appro), prod: cent(centres.prod / uo.prod), dist: cent(centres.dist / uo.dist) };
  const imp =
    m === 11
      ? { appro: cent(330 * cout.appro) + cent(345 * cout.appro), prod: cent(q * cout.prod), dist: cent(uo.dist * cout.dist) }
      : { appro: cent(uo.appro * cout.appro), prod: cent(q * cout.prod), dist: cent(uo.dist * cout.dist) };
  const matieres = m === 11 ? 2_410 * 24.32 : achats + imp.appro;
  const resultat = cent(ca - (matieres + q * 16 + imp.prod + imp.dist));
  const total = centres.appro + centres.prod + centres.dist;
  return { resultat, arrondi: cent(imp.appro + imp.prod + imp.dist - total) };
}

describe("la concordance des résultats : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, avec ses prérequis", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["cout-complet", "les-stocks"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(4);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      expect(o.find((k) => k.juste)!.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("les deux résultats, refaits à la main", () => {
  it("la comptabilité générale : la balance, les travaux d'inventaire et l'impôt donnent 79 225,96 €", () => {
    const produits = solde("701").credit + 11_800 - 7_080 + 3_934.58;
    const charges =
      solde("601").debit + 34_500 - 13_500 + solde("606").debit + solde("6132").debit + (6_000 - 4_500) + solde("641").debit + solde("645").debit +
      solde("6611").debit + 831.11 + solde("665").debit + 9_861.11 + 11_210 + 5_000 + 20_742;
    expect(cent(produits - charges)).toBe(79_225.96);
    expect(x.k.resultatGeneral).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
  });

  it("la gestion : les douze mois refaits à la main, janvier à −1 994,66 €, décembre à 14 173,36 €, 66 705,05 € sur l'exercice", () => {
    const mois = Array.from({ length: 12 }, (_, m) => moisALaMain(m));
    expect(mois[0]).toEqual({ resultat: -1_994.66, arrondi: 1.66 });
    expect(mois[11]!.resultat).toBe(14_173.36);
    expect(x.k.exercice.mois.map((m) => m.resultat)).toEqual(mois.map((m) => m.resultat));
    expect(x.k.exercice.mois.map((m) => m.arrondiDesUnitesDOeuvre)).toEqual(mois.map((m) => m.arrondi));
    expect(cent(mois.reduce((t, m) => t + m.resultat, 0))).toBe(66_705.05);
    expect(cent(mois.reduce((t, m) => t + m.arrondi, 0))).toBe(-17.5);
  });

  it("le tableau de passage retrouve le résultat net au centime", () => {
    const lignes = [50_400, 3_934.58, -(11_210 + 5_000 + 2_850 + 831.11 + 448.4 + 20_742), 12 * 833 - 9_861.11, 10 * 24.32, 13_500 - 600 * 24.32, -17.5 - 0.75];
    expect(lignes.map(cent)).toEqual([50_400, 3_934.58, -41_081.51, 134.89, 243.2, -1_092, -18.25]);
    expect(Object.values(x.k.lignes)).toEqual(lignes.map(cent));
    expect(cent(66_705.05 + lignes.reduce((t, v) => t + v, 0))).toBe(79_225.96);
    expect(x.k.resultatRetrouve).toBe(79_225.96);
    const g = etape(ch, "tableau-de-passage", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.at(-1)!.cellules[0]!.valeur).toBe(79_225.96);
  });

  it("chaque étape de calcul : les totaux, l'usure, l'inventaire, les arrondis", () => {
    expect(attendus(ch, "non-incorporees")).toEqual([41_081.51, 3_934.58, 50_400]);
    expect(attendus(ch, "difference-d-incorporation")).toEqual([9_996, 134.89]);
    expect(attendus(ch, "les-arrondis")).toEqual([-17.5, -18.25]);
    const g = etape(ch, "l-inventaire", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[2]!.valeur)).toEqual([14_348.8, 243.2, 14_592, 13_500, -1_092]);
  });

  it("le tri et les bonnes réponses", () => {
    const t = triDe(ch, "trier-les-charges");
    expect(Object.values(t).filter((c) => c === "non")).toHaveLength(5);
    expect(t["Travail du président, non payé"]).toBe("supletive");
    expect(t["Prime d'assurance de l'exercice"]).toBe("incorporee");
    expect(juste(ch, "le-sens-du-boni")).toEqual(["S'ajoute au résultat analytique"]);
    expect(juste(ch, "le-pari-de-la-gerante")).toEqual(["Ne bougerait pas"]);
    expect(juste(ch, "le-mois-ou-l-exercice")).toEqual(["Les comptes n'ont de résultat qu'à la clôture"]);
  });
});

describe("le curseur et le laboratoire", () => {
  it("le curseur : 117 105,05 € sans le président, positif jusqu'à 9 758 € par mois", () => {
    expect(cent(66_705.05 + 50_400)).toBe(117_105.05);
    expect(Math.floor(117_105.05 / 12)).toBe(9_758);
    gardeDuCurseur(ch, "jusqu-ou-la-gerante", 9_758);
  });

  it("le laboratoire : une seule position rapproche les deux résultats à moins de 100 €, et le résultat des comptes ne bouge pas", () => {
    expect(positionsProches()).toEqual([{ gerante: 1_800, risques: 1 }]);
    const l = laboratoireDeLaConcordance(1_800, 1);
    expect(Math.abs(l.ecart)).toBeLessThanOrEqual(100);
    expect(laboratoireDeLaConcordance(0, 0).resultatGeneral).toBe(79_225.96);
    expect(laboratoireDeLaConcordance(4_200, 0).resultatAnalytique).toBe(66_705.05);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-concordance");
  });
});

describe("le cas dédié : si le président se payait", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(SI_LA_GERANTE_SE_PAYAIT);
    gardeDuCas(SI_LA_GERANTE_SE_PAYAIT, ch);
    for (const e of SI_LA_GERANTE_SE_PAYAIT.etapes) if (e.type === "a-completer") expect(incoherencesDuTableau(e.grille(NOVA))).toEqual([]);
  });

  it("le salaire : 49 567,96 € avant impôt, 8 142 € d'impôt (15 % jusqu'à 42 500 €, 25 % au-delà), 41 425,96 € de résultat net", () => {
    const avant = 99_967.96 - 12 * 4_200;
    expect(cent(avant)).toBe(49_567.96);
    const impot = Math.round(0.15 * 42_500 + 0.25 * (avant - 42_500));
    expect(impot).toBe(8_142);
    expect(cent(avant - impot)).toBe(41_425.96);
    const n = siLaGeranteSePayait(NOVA);
    expect([n.avantImpot, n.impot.impot, n.net, n.baisseDuNet]).toEqual([49_567.96, 8_142, 41_425.96, 37_800]);
    // Le nouveau tableau de passage retrouve le nouveau résultat net : sans supplétive, l'impôt changé.
    expect(n.nonIncorporees).toBe(cent(-(41_081.51 - 20_742 + 8_142)));
    expect(n.retrouve).toBe(41_425.96);
    expect(etape(SI_LA_GERANTE_SE_PAYAIT, "reponse", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual([
      "Les comptes perdraient 37 800 €, la gestion rien",
    ]);
  });
});
