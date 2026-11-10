import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { REMUNERER_ET_STIMULER_LES_VENDEURS, SOLUTION_DE_LA_REMUNERATION } from "../../src/config/cours/chapitres/remunerer-et-stimuler-les-vendeurs";
import { VENDEURS, caisseDeJanvier, remunerationVariable } from "../../src/config/cours/monde/equipe-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LE_CHALLENGE_DU_MERINOS } from "../../src/config/cours/situations/par-chapitre/le-challenge-du-merinos";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * RÉMUNÉRER ET STIMULER LES VENDEURS, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LE CHALLENGE DU
 * MÉRINOS.
 *
 * Les six vendeurs refont exactement la caisse de janvier (une seule MAILLE & CO). Les indicateurs du
 * vendeur qui décroche, les objectifs, la commission, la prime d'équipe, le bulletin simplifié et le
 * challenge de l'écharpe sont refaits à la main ; le laboratoire, son départ et ses solutions. Puis
 * les gardes de la boutique, et la bonne réponse jamais la plus longue.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = REMUNERER_ET_STIMULER_LES_VENDEURS;
const somme = (xs: readonly number[]) => xs.reduce((t, v) => t + v, 0);

/** La bonne réponse d'un choix n'est jamais la plus longue. */
function jamaisLaPlusLongue(c: Chapitre) {
  for (const e of chapitreDuCas(c, BOUTIQUE).etapes) {
    if (e.type !== "choix") continue;
    const o = e.options(BOUTIQUE, VIDE);
    const bonne = o.find((k) => k.juste)!;
    expect(bonne.texte.length, `${c.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
  }
}

describe("rémunérer et stimuler les vendeurs : le chapitre", () => {
  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 4, en fin de programme", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).not.toBeNull();
    expect(PROGRAMME.mco[4]).toContain(ch.titre);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(casDuChapitre(ch.code)).toBe(LE_CHALLENGE_DU_MERINOS);
  });

  it("une seule MAILLE & CO : les six vendeurs refont la caisse de janvier, heures de vente comprises", () => {
    const k = caisseDeJanvier(f);
    expect([somme(VENDEURS.map((v) => v.entrees)), somme(VENDEURS.map((v) => v.passages)), somme(VENDEURS.map((v) => v.articles)), somme(VENDEURS.map((v) => v.chiffreDAffaires))]).toEqual([
      k.entreesEnCaisse,
      k.passages,
      k.articles,
      k.chiffreDAffaires,
    ]);
    expect(k).toEqual({ entreesEnCaisse: 3_840, passages: 940, articles: 1_330, chiffreDAffaires: 77_250 });
    expect(somme(VENDEURS.map((v) => v.heuresDeVente)) + f.reglesDuPlanning.tachesHorsVente).toBe(somme(f.equipe.map((s) => s.heuresParSemaine)));
    expect(VENDEURS.map((v) => v.code)).toEqual(f.equipe.map((s) => s.code));
    for (const v of VENDEURS) expect(v.heuresDeVente, v.code).toBeLessThanOrEqual(f.equipe.find((s) => s.code === v.code)!.heuresParSemaine);
  });

  it("le tableau de bord du vendeur qui décroche, et les objectifs", () => {
    expect(attendus(ch, "les-indicateurs-du-vendeur")).toEqual([centime((120 / 660) * 100), centime(8_900 / 120), centime(150 / 120)]);
    expect(attendus(ch, "l-objectif")).toEqual([24 * 520, centime((8_900 / 12_480) * 100), 145 * 520, centime((77_250 / 75_400) * 100)]);
    // La transformation et les paniers de la copie : 24,48 %, 74,17 € et 82,18 €.
    expect(attendus(ch, "a-transformation-egale")).toEqual([centime(((660 * centime((940 / 3_840) * 100)) / 100) * centime(8_900 / 120)), centime(120 * centime(77_250 / 940))]);
    expect(attendus(ch, "a-transformation-egale")).toEqual([11_983.5, 9_861.6]);
    expect(juste(ch, "le-diagnostic")).toEqual(["La conclusion de la vente est à travailler d'abord"]);
    expect(juste(ch, "la-remediation")).toEqual(["Un entretien, du binôme et un objectif suivi"]);
  });

  it("la commission, la prime d'équipe, leur coût et le bulletin", () => {
    // Commission de 5 % au-delà de l'objectif ; prime de 3 € par heure de vente, l'équipe ayant dépassé le sien.
    const ecarts = VENDEURS.map((v) => Math.max(0, v.chiffreDAffaires - v.heuresDeVente * 520));
    expect(ecarts).toEqual([1_800, 1_320, 640, 110, 0, 1_560]);
    const brut = centime(somme(ecarts) * 0.05 + 145 * 3);
    expect(attendus(ch, "la-commission-et-la-prime")).toEqual([1_560 * 0.05, 24 * 3, brut, centime(brut * 1.42)]);
    expect([brut, centime(brut * 1.42)]).toEqual([706.5, 1_003.23]);
    const variable = 640 * 0.05 + 33 * 3;
    const b = 2_000 + variable;
    expect(attendus(ch, "le-bulletin")).toEqual([b, centime(b * 0.22), centime(b - centime(b * 0.22)), centime(b + centime(b * 0.42))]);
    expect(juste(ch, "les-minima")).toEqual(["Oui, au-dessus des deux minima, au prorata des heures"]);
  });

  it("le laboratoire de la rémunération : la proposition dépasse l'enveloppe, la solution la tient", () => {
    const e = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-la-remuneration", "simulation");
    const d = e.defi(BOUTIQUE);
    expect(d.atteint({ commission: 5, prime: 3 })).toBe(false);
    expect(d.atteint(d.solution)).toBe(true);
    expect(d.solution).toEqual(SOLUTION_DE_LA_REMUNERATION);
    const reussies: string[] = [];
    for (let c = 0; c <= 10; c++) for (let p = 0; p <= 6; p++) if (d.atteint({ commission: c, prime: p })) reussies.push(`${c}/${p}`);
    expect(reussies).toEqual(["1/3", "1/4", "2/3", "2/4", "3/3", "4/3"]);
    const r = remunerationVariable(f, 0.02, 3);
    expect([r.cout, r.plusPetit]).toEqual([centime((5_430 * 0.02 + 435) * 1.42), 67.2]);
    expect(juste(ch, "predire-la-commission")).toEqual(["Rien : il est sous son objectif"]);
    expect(juste(ch, "prime-individuelle-ou-collective")).toEqual(["Surtout la prime d'équipe, peu de commission"]);
  });

  it("le challenge de l'écharpe : le curseur et son gain", () => {
    // 19 € de marge par écharpe face à (150 + 1 × n) × 1,42 : le plus petit n est 13.
    expect(Math.ceil((150 * 1.42) / (19 - 1.42) - 1e-9)).toBe(13);
    gardeDuCurseur(ch, "le-seuil-du-challenge", 13);
    expect(attendus(ch, "le-challenge")).toEqual([60 * 19, centime(210 * 1.42), centime(60 * 19 - 210 * 1.42)]);
    expect(juste(ch, "les-regles-du-challenge")).toEqual(["Par heure de vente, règles affichées d'avance"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
  });
});

describe("le challenge du mérinos : le cas", () => {
  const s = LE_CHALLENGE_DU_MERINOS;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
    jamaisLaPlusLongue(s);
  });

  it("la marge d'un report, le gain et le seuil, refaits à la main", () => {
    const merinos = 135 - 56 - 5;
    const col = 55 - 25 - 3.5;
    expect(attendus(s, "la-marge-d-un-report")).toEqual([merinos, col, merinos - col]);
    const marge = 10 * merinos + 20 * (merinos - col);
    const cout = centime((300 + 30 * 3) * 1.42);
    expect(attendus(s, "le-gain-avec-les-reports")).toEqual([marge, cout, centime(marge - cout), Math.ceil((300 * 1.42) / (merinos - col - 3 * 1.42))]);
    expect([marge, cout, centime(marge - cout)]).toEqual([1_690, 553.8, 1_136.2]);
    expect(juste(s, "reponse")[0]).toMatch(/reports déduits$/);
  });
});
