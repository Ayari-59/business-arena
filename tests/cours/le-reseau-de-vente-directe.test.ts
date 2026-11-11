import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { LE_RESEAU_DE_VENTE_DIRECTE } from "../../src/config/cours/chapitres/le-reseau-de-vente-directe";
import { laboratoireDuReseau, recruesALaPrime } from "../../src/config/cours/monde/reseau-de-vente-directe";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { UN_POURCENTAGE_POUR_LA_MARRAINE } from "../../src/config/cours/situations/par-chapitre/un-pourcentage-pour-la-marraine";
import { THEMES } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";
import { lireLeLaboratoire } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE RÉSEAU DE VENTE DIRECTE DE MAILLE & CO, ET SON CAS : UN POURCENTAGE POUR LA MARRAINE.
 *
 * Chaque chiffre est refait à la main sur les étiquettes, les coûts d'achat et l'équipe de la fiche de
 * la boutique, et sur les hypothèses du réseau (monde/reseau-de-vente-directe.ts) : la réunion type, sa
 * marge, le seuil de dispense d'immatriculation au curseur, la formation d'une recrue, la valeur d'une
 * conseillère, le parrainage et son piège, les rétractations, le laboratoire (toutes ses positions),
 * puis le cas. Puis les gardes de la boutique, et la bonne réponse jamais la plus longue.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = LE_RESEAU_DE_VENTE_DIRECTE;
const prix = (code: string) => f.gamme.find((r) => r.code === code)!;

/** La bonne réponse d'un choix n'est jamais la plus longue. */
function jamaisLaPlusLongue(c: Chapitre) {
  for (const e of chapitreDuCas(c, BOUTIQUE).etapes) {
    if (e.type !== "choix") continue;
    const o = e.options(BOUTIQUE, VIDE);
    const bonne = o.find((k) => k.juste)!;
    expect(bonne.texte.length, `${c.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
  }
}

// La réunion type refaite à la main : 3 cols ronds, 2 cardigans, 1 mérinos, 3 écharpes, 2 bonnets.
const PANIER: [string, number][] = [["col-rond", 3], ["cardigan", 2], ["merinos", 1], ["echarpe", 3], ["bonnet", 2]];
const somme = (g: (code: string) => number) => PANIER.reduce((t, [code, q]) => t + q * g(code), 0);
const TTC = somme((k) => prix(k).prixTtc);
const HT = somme((k) => prix(k).prixHt);
const ACHATS = somme((k) => prix(k).coutDAchat);
const AUTRES = somme((k) => prix(k).autresCoutsVariables);
const COMMISSION = HT * 0.25;
const MARGE = HT - ACHATS - AUTRES - COMMISSION - prix("echarpe").coutDAchat;
const FORMATION = centime(f.gamme.reduce((t, r) => t + r.coutDAchat, 0) + 4 * centime((2_150 / 151.67) * 1.25 * 1.42));
const VALEUR = centime(20 * MARGE - FORMATION);

describe("le réseau de vente directe : le chapitre", () => {
  it("se joue chez MAILLE & CO seule, au palier 4 du BTS NDRC, bloc 3, en fin de programme et sous le thème de la vente", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 3 · Relation client et animation de réseaux"]);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).toBeTruthy();
    {
      const liste = PROGRAMME.ndrc[4]!;
      expect(liste[liste.indexOf(ch.titre) - 1]).toBe("Contenus, communauté et e-réputation");
    }
    expect(THEMES.find((t) => t.code === "vente")!.chapitres).toContain(ch.code);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((c) => c.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(UN_POURCENTAGE_POUR_LA_MARRAINE);
  });

  it("la réunion type : 726 € TTC, 605 € hors taxes, un panier de 121 €, 147,25 € de marge", () => {
    expect([TTC, HT, ACHATS, AUTRES, COMMISSION, MARGE]).toEqual([726, 605, 260, 32.5, 151.25, 147.25]);
    expect(attendus(ch, "le-ca-de-la-reunion")).toEqual([TTC, HT, 75, centime(TTC / 6)]);
    expect(attendus(ch, "la-marge-de-la-reunion")).toEqual([ACHATS, AUTRES, COMMISSION, MARGE]);
    expect(juste(ch, "le-statut")).toEqual(["Vendeuse à domicile indépendante, mandataire"]);
  });

  it("le seuil d'activité : 24 030 €, 159 réunions par an au curseur ; 3 630 € par an à 2 réunions par mois", () => {
    const seuil = 48_060 / 2;
    const n = Math.ceil(seuil / COMMISSION);
    expect([seuil, n]).toEqual([24_030, 159]);
    expect(juste(ch, "predire-le-seuil")).toEqual(["Plus de 100 : bien plus que 2 par mois"]);
    gardeDuCurseur(ch, "le-seuil-au-curseur", n);
    expect(attendus(ch, "le-seuil-d-activite")).toEqual([seuil, COMMISSION * 24, centime(((COMMISSION * 24) / seuil) * 100), centime(n / 12)]);
  });

  it("la formation et la valeur d'une conseillère : 239,14 € et 2 705,86 €", () => {
    expect(FORMATION).toBe(239.14);
    expect(attendus(ch, "former-une-recrue")).toEqual([138.5, 25.16, 100.64, FORMATION]);
    expect(attendus(ch, "la-valeur-d-une-conseillere")).toEqual([10, 20, 20 * MARGE, VALEUR]);
    expect(VALEUR).toBe(2_705.86);
  });

  it("le parrainage : 300 € laissent le plus, 14 452,74 € ; comptée sur les seules recrues en plus, on prendrait 450 €", () => {
    const gain = (prime: number, recrues: number) => centime((recrues - 24) * VALEUR - prime * recrues);
    expect([gain(150, 30), gain(300, 33), gain(450, 35)]).toEqual([11_735.16, 14_452.74, 14_014.46]);
    expect(juste(ch, "predire-la-prime")).toEqual(["300 € par filleule"]);
    expect(attendus(ch, "la-prime-de-parrainage")).toEqual([9, centime(9 * VALEUR), 9_900, gain(300, 33), centime(9 * VALEUR - 9 * 300)]);
    // Le piège : sur les seules recrues en plus, 450 € paraîtraient meilleurs.
    expect(centime(11 * VALEUR - 11 * 450)).toBeGreaterThan(centime(9 * VALEUR - 9 * 300));
  });

  it("le laboratoire : à 25 %, la seule solution est 300 € ; à 20 %, la meilleure prime monte à 450 €", () => {
    const e = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-du-reseau", "simulation");
    const d = e.defi(BOUTIQUE);
    const positions = Array.from({ length: 11 }, (_, i) => 20 + i).flatMap((commission) => [0, 150, 300, 450].map((prime) => ({ commission, prime })));
    expect(positions.filter((p) => d.atteint(p))).toEqual([{ commission: 25, prime: 300 }]);
    expect(d.atteint({ commission: 25, prime: 0 })).toBe(false);
    expect(lireLeLaboratoire(e, BOUTIQUE, d.solution).atteint).toBe(true);
    expect([20, 25, 30].map((c) => laboratoireDuReseau(f, c, 0).meilleurePrime)).toEqual([450, 300, 300]);
    // Entre deux offres, les recrues suivent la droite qui les joint : le graphique est continu.
    expect([recruesALaPrime(0), recruesALaPrime(75), recruesALaPrime(300), recruesALaPrime(600)]).toEqual([24, 27, 33, 35]);
  });

  it("les rétractations : 8,06 € de moins par réunion, une conseillère à 2 544,66 €, la même prime", () => {
    const r = [centime(HT * 0.05), centime((ACHATS + AUTRES) * 0.05), centime(COMMISSION * 0.05)];
    const perdue = centime(r[0]! - r[1]! - r[2]!);
    expect(attendus(ch, "les-retractations")).toEqual([...r, perdue, centime(20 * (MARGE - perdue) - FORMATION)]);
    expect(attendus(ch, "les-retractations")).toEqual([30.25, 14.63, 7.56, 8.06, 2_544.66]);
    expect(juste(ch, "le-code-ethique")).toEqual(["Non : la prime suit les ventes de la filleule"]);
    expect(juste(ch, "animer-le-reseau")).toEqual(["La marraine suit ses filleules aux premières réunions"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
  });
});

describe("un pourcentage pour la marraine : le cas", () => {
  const s = UN_POURCENTAGE_POUR_LA_MARRAINE;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
    jamaisLaPlusLongue(s);
  });

  it("le coût, le gain et le plafond du pourcentage, refaits à la main", () => {
    const parReunion = centime(HT * 0.02);
    expect(attendus(s, "le-cout-par-filleule")).toEqual([parReunion, parReunion * 20, centime(parReunion * 20 * 33)]);
    expect(attendus(s, "le-cout-par-filleule")).toEqual([12.1, 242, 7_986]);
    const gain = centime(9 * VALEUR - 7_986);
    expect(attendus(s, "le-gain")).toEqual([gain, centime(gain - 14_452.74)]);
    expect(attendus(s, "le-gain")).toEqual([16_366.74, 1_914]);
    // p × 605 × 20 ≤ 300 ⇔ p ≤ 2,48 % : 2 % au point entier.
    gardeDuCurseur(s, "jusqu-ou", 2);
    expect(juste(s, "reponse")[0]).toMatch(/^Le prendre : il laisse 1\u202f914 €/);
  });
});
