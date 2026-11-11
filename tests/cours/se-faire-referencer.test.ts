import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { AVEC_MISE_EN_AVANT, SANS_MISE_EN_AVANT, SE_FAIRE_REFERENCER, laboratoireDuReferencement, referencement } from "../../src/config/cours/chapitres/se-faire-referencer";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LA_CENTRALE_DEMANDE_UNE_RISTOURNE } from "../../src/config/cours/situations/par-chapitre/la-centrale-demande-une-ristourne";
import { THEMES } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { lireLeLaboratoire } from "../../src/pedagogy/cours/chapitre-servi";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * SE FAIRE RÉFÉRENCER CHEZ UN DISTRIBUTEUR, CHEZ NOVA FACE À CAMPUSTECH, ET SON CAS : LA CENTRALE
 * DEMANDE UNE RISTOURNE.
 *
 * Chaque chiffre est refait à la main sur les hypothèses du chapitre (monde/referencement-de-nova.ts)
 * et sur la fiche de NOVA : 59 € hors taxes, 38 € de coût variable, 320 enceintes par mois. Le prix
 * public, la marge et le coefficient du distributeur, le linéaire et son indice, la remise au curseur,
 * la marge arrière équivalente, le laboratoire (toutes ses positions), le seuil de revente à perte,
 * l'animation, puis le cas. Puis les gardes de NOVA, et la bonne réponse jamais la plus longue.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = SE_FAIRE_REFERENCER;
const x = referencement(NOVA);

/** La bonne réponse d'un choix n'est jamais la plus longue. */
function jamaisLaPlusLongue(c: Chapitre) {
  for (const e of chapitreDuCas(c, NOVA).etapes) {
    if (e.type !== "choix") continue;
    const o = e.options(NOVA, VIDE);
    const bonne = o.find((k) => k.juste)!;
    expect(bonne.texte.length, `${c.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
  }
}

// Refaits à la main : 16 magasins, 20 enceintes par magasin et par mois, 84 € TTC, 0,5 m sur 4 m, 2 400 € de marge du rayon.
const PRIX_HT = 84 / 1.2;
const MARGE = PRIX_HT - 59;

describe("se faire référencer : le chapitre", () => {
  it("se joue chez NOVA seule, au palier 3 du BTS NDRC, bloc 3, en fin de programme et sous le thème de la vente", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(3);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 3 · Relation client et animation de réseaux"]);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).toBeTruthy();
    expect(PROGRAMME.ndrc[3]!.at(-1)).toBe(ch.titre);
    expect(THEMES.find((t) => t.code === "vente")!.chapitres).toContain(ch.code);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((c) => c.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(LA_CENTRALE_DEMANDE_UNE_RISTOURNE);
  });

  it("le prix public, la marge, le taux de marque et le coefficient du distributeur", () => {
    expect([PRIX_HT, MARGE]).toEqual([70, 11]);
    expect(attendus(ch, "le-prix-public")).toEqual([70, 11, centime((11 / 70) * 100), centime(84 / 59)]);
    expect(attendus(ch, "le-prix-public")).toEqual([70, 11, 15.71, 1.42]);
    expect(juste(ch, "qui-decide")).toEqual(["Vous le faites valoir à la centrale"]);
  });

  it("la rentabilité du linéaire : 220 € par magasin, 440 € le mètre, un indice de 0,73", () => {
    const parMagasin = 20 * MARGE;
    expect(attendus(ch, "la-rentabilite-du-lineaire")).toEqual([parMagasin, parMagasin / 0.5, 12.5, centime((parMagasin / 2_400) * 100), centime(centime((parMagasin / 2_400) * 100) / 12.5)]);
    expect(attendus(ch, "la-rentabilite-du-lineaire")).toEqual([220, 440, 12.5, 9.17, 0.73]);
  });

  it("la remise au curseur : 4 € par enceinte portent le mètre à 600 € ; la même chose en marge arrière, 15 360 € par an", () => {
    // (11 + r) × 20 ÷ 0,5 ≥ 600 ⇔ r ≥ 4.
    gardeDuCurseur(ch, "la-remise-au-curseur", 4);
    expect(juste(ch, "predire-la-remise")).toEqual(["De 2 à 5 €"]);
    const manque = 600 * 0.5 - 220;
    expect(attendus(ch, "la-marge-arriere")).toEqual([manque, manque * 16 * 12, centime((manque * 16 * 12) / 3_840), 3_840 * 21 - manque * 16 * 12]);
    expect(attendus(ch, "la-marge-arriere")).toEqual([80, 15_360, 4, 65_280]);
  });

  it("le laboratoire : la mise en avant et 1 € de remise gardent la place et laissent 82 320 €, la seule meilleure offre", () => {
    expect(juste(ch, "predire-la-mise-en-avant")).toEqual(["Baisse : les ventes en plus font la marge"]);
    const e = etape(chapitreDuCas(ch, NOVA), "le-laboratoire-du-referencement", "simulation");
    const d = e.defi(NOVA);
    expect(d.solution).toEqual({ remise: 1, miseEnAvant: AVEC_MISE_EN_AVANT });
    // Toutes les positions : la remise de 0 à 8 € par 0,50 €, avec et sans la mise en avant.
    const positions = [SANS_MISE_EN_AVANT, AVEC_MISE_EN_AVANT].flatMap((m) => Array.from({ length: 17 }, (_, i) => ({ remise: i / 2, miseEnAvant: m })));
    expect(positions.filter((p) => d.atteint(p))).toEqual([d.solution]);
    expect(d.atteint({ remise: 4, miseEnAvant: SANS_MISE_EN_AVANT })).toBe(false);
    // Refaite à la main : 23 enceintes par magasin, 6 000 € ÷ 192 = 31,25 € de marge arrière par magasin et par mois.
    const avec = (r: number) => ({ metre: (23 * (11 + r) + 6_000 / 192) / 0.5, nova: 23 * 16 * 12 * (21 - r) - 6_000 });
    const sans = (r: number) => ({ metre: (20 * (11 + r)) / 0.5, nova: 20 * 16 * 12 * (21 - r) });
    expect([avec(0.5).metre < 600, avec(1).metre, avec(1).nova, sans(4).nova]).toEqual([true, 614.5, 82_320, 65_280]);
    for (const p of positions) {
      const o = laboratoireDuReferencement(x, p);
      const main = p.miseEnAvant === AVEC_MISE_EN_AVANT ? avec(p.remise) : sans(p.remise);
      expect([o.margeParMetre, o.margeDeNova]).toEqual([centime(main.metre), centime(main.nova)]);
    }
    expect(lireLeLaboratoire(e, NOVA, d.solution).atteint).toBe(true);
  });

  it("le seuil de revente à perte : 56,64 € hors taxes, 67,97 € TTC ; le prix de la rentrée, 64,90 €, est sous le seuil", () => {
    const coop = centime(6_000 / 4_416);
    const seuilHt = centime(58 - coop);
    const seuilTtc = centime(seuilHt * 1.2);
    expect([coop, seuilHt, seuilTtc]).toEqual([1.36, 56.64, 67.97]);
    expect(attendus(ch, "le-seuil-de-revente-a-perte")).toEqual([58, coop, seuilHt, seuilTtc, centime(((84 - seuilTtc) / 84) * 100)]);
    expect(juste(ch, "la-promotion-de-la-rentree")[0]).toMatch(/^Non : ce serait revendre sous 67,97/);
  });

  it("l'animation : 2 880 € pour 192 enceintes à 20 €, 960 € de gain, 9 enceintes par journée pour la payer", () => {
    expect(attendus(ch, "l-animation")).toEqual([16 * 180, 16 * 12, 16 * 12 * 20, 16 * 12 * 20 - 16 * 180, Math.ceil(180 / 20)]);
    expect(juste(ch, "la-convention")[0]).toMatch(/^Par écrit, avant le 1er mars/);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
  });
});

describe("la centrale demande une ristourne : le cas", () => {
  const s = LA_CENTRALE_DEMANDE_UNE_RISTOURNE;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
    jamaisLaPlusLongue(s);
  });

  it("la ristourne, ce qu'elle donne et le nouveau seuil, refaits à la main", () => {
    const parEnceinte = centime(58 * 0.02);
    expect(attendus(s, "la-ristourne")).toEqual([parEnceinte, centime(parEnceinte * 4_416), centime(82_320 - parEnceinte * 4_416)]);
    expect(attendus(s, "la-ristourne")).toEqual([1.16, 5_122.56, 77_197.44]);
    const parMagasin = centime(307.25 + 23 * 1.16);
    expect(attendus(s, "ce-qu-elle-donne")).toEqual([parMagasin, centime(parMagasin / 0.5)]);
    const seuilHt = centime(58 - 1.36 - 1.16);
    expect(attendus(s, "le-nouveau-seuil")).toEqual([seuilHt, centime(seuilHt * 1.2)]);
    expect(attendus(s, "le-nouveau-seuil")).toEqual([55.48, 66.58]);
    expect(juste(s, "reponse")).toEqual(["Refuser la ristourne sans contrepartie, et le prix de la rentrée"]);
  });
});
