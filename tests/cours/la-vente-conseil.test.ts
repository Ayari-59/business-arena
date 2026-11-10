import { describe, expect, it } from "vitest";
import { LA_VENTE_CONSEIL, SOLUTION_DU_LABORATOIRE, TECHNIQUES } from "../../src/config/cours/chapitres/la-vente-conseil";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LE_SAMEDI_APRES_LA_FORMATION } from "../../src/config/cours/situations/par-chapitre/le-samedi-apres-la-formation";
import type { EtapeSimulation, EtapeTri } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, juste } from "./gardes-de-la-boutique";
import { gardesDuBloc1 } from "./gardes-du-bloc-1-mco";

/**
 * LA VENTE CONSEIL (BTS MCO, bloc 1, palier 3), SUR LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LE SAMEDI
 * APRÈS LA FORMATION.
 *
 * Refait à la main sur la gamme de MAILLE & CO (prix hors taxes 55, 75, 135, 35 et 25 € ; marges d'un
 * article 26,50, 37, 74, 19 et 14 €) et le samedi des trois vendeurs (monde/clientele-de-la-boutique.ts).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = LA_VENTE_CONSEIL;
const PRIX = { "col-rond": 55, merinos: 135, cardigan: 75, echarpe: 35, bonnet: 25 } as const;
const MARGE = { "col-rond": 26.5, merinos: 74, cardigan: 37, echarpe: 19, bonnet: 14 } as const;
type V = Record<keyof typeof PRIX, number>;
const total = (v: V, t: Record<keyof typeof PRIX, number>) => (Object.keys(v) as (keyof V)[]).reduce((s, k) => s + v[k] * t[k], 0);
const VENDEUR: V = { "col-rond": 8, merinos: 4, cardigan: 10, echarpe: 8, bonnet: 6 };
const VENDEUSE: V = { "col-rond": 9, merinos: 1, cardigan: 9, echarpe: 9, bonnet: 6 };
const ETUDIANTE: V = { "col-rond": 6, merinos: 0, cardigan: 5, echarpe: 3, bonnet: 1 };
const APRES: V = { "col-rond": 4, merinos: 2, cardigan: 5, echarpe: 4, bonnet: 2 };

describe("la vente conseil, à la boutique du monde du cours", () => {
  it("se joue chez MAILLE & CO, au palier 3 du BTS MCO, bloc 1, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    gardeDuProgramme(ch, PROGRAMME.mco[3]!, () => "bts-mco", /^BTS MCO /);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(LE_SAMEDI_APRES_LA_FORMATION);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDuBloc1(ch);
  });

  it("les indicateurs de chaque vendeur, refaits à la main", () => {
    expect([total(VENDEUR, PRIX), total(VENDEUSE, PRIX), total(ETUDIANTE, PRIX)]).toEqual([2_160, 1_770, 835]);
    expect(attendus(ch, "la-transformation")).toEqual([c((24 / 80) * 100), c((21 / 70) * 100), c((12 / 50) * 100)]);
    expect(attendus(ch, "indice-et-panier")).toEqual([c(36 / 24), c(2_160 / 24), c(34 / 21), c(1_770 / 21), c(15 / 12), c(835 / 12)]);
    expect(attendus(ch, "la-marge-par-client")).toEqual([c(total(VENDEUR, MARGE) / 80), c(total(VENDEUSE, MARGE) / 70), c(total(ETUDIANTE, MARGE) / 50)]);
    expect(attendus(ch, "la-marge-par-client")).toEqual([13.93, 12.86, 8.3]);
  });

  it("la vente additionnelle et la montée en gamme, refaites à la main", () => {
    expect(attendus(ch, "la-vente-additionnelle")).toEqual([30, 66.67, 20, c((3 + 6 + 1) * 19)]);
    expect(attendus(ch, "la-montee-en-gamme")).toEqual([c((4 / 12) * 100), c((1 / 10) * 100), 0, c(5 * (74 - 26.5))]);
    expect(juste(ch, "predire-la-technique")).toEqual(["La montée en gamme"]);
  });

  it("le laboratoire de la formation : la montée en gamme à 30 %, seule à tenir le défi", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-formation");
    const lab = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-la-formation", "simulation") as EtapeSimulation;
    expect(lab.defi(BOUTIQUE).solution).toEqual({ technique: TECHNIQUES.find((t) => t.code === SOLUTION_DU_LABORATOIRE.technique)!.valeur, taux: 30 });
    // À la main : la montée en gamme à 30 % fait monter la vendeuse (10 pulls, de 10 % à 30 %) et l'étudiante (6 pulls, de 0 à 30 %).
    const gamme = (t: number) => 47.5 * (12 * Math.max(0, t - 1 / 3) + 10 * Math.max(0, t - 0.1) + 6 * t);
    const additionnelle = (t: number) => 19 * (10 * Math.max(0, t - 0.3) + 9 * Math.max(0, t - 2 / 3) + 5 * Math.max(0, t - 0.2));
    expect([c(gamme(0.25)), c(gamme(0.3))]).toEqual([142.5, 180.5]);
    expect([c(additionnelle(0.65)), c(additionnelle(0.7)), c(additionnelle(0.75))]).toEqual([109.25, 129.2, 152]);
    const lire = (p: Record<string, number>) => Object.fromEntries(lab.lecture(BOUTIQUE, p).map((x) => [x.libelle, x.montant]));
    expect(lire({ technique: 2, taux: 30 })["Marge gagnée par samedi"]).toBe(180.5);
    expect(lire({ technique: 1, taux: 75 })["Marge gagnée par samedi"]).toBe(152);
  });

  it("l'omnicanal, la rétractation et le verdict, refaits à la main", () => {
    // 19 clients sur 57 venus après le site ; 48 retraits × 25 % = 12 articles à 29,29 €, la marge moyenne d'un article en caisse.
    expect(c((19_640 + 19_310) / 1_330)).toBe(29.29);
    expect(attendus(ch, "le-parcours-omnicanal")).toEqual([c((19 / 57) * 100), 12, c(12 * 29.29)]);
    const tri = etape(chapitreDuCas(ch, BOUTIQUE), "vendre-a-distance", "tri") as EtapeTri;
    expect(tri.elements(BOUTIQUE).filter((x) => x.categorie === "retractation")).toHaveLength(3);
    expect(attendus(ch, "la-retractation")).toEqual([6 + 14, 162, 15 + 14]);
    expect(juste(ch, "quelle-technique")).toEqual(["La montée en gamme, animée par le vendeur"]);
  });
});

describe("le cas : le samedi après la formation", () => {
  const s = LE_SAMEDI_APRES_LA_FORMATION;

  it("tient la forme d'un cas dédié, aux textes propres", () => {
    gardeDuCas(s, ch);
    gardesDuBloc1(s);
  });

  it("les indicateurs avant et après, la marge gagnée, refaits à la main", () => {
    expect(total(APRES, PRIX)).toBe(1_055);
    expect(attendus(s, "les-indicateurs")).toEqual([c((14 / 50) * 100), c(17 / 14), c(1_055 / 14)]);
    const avant = total(ETUDIANTE, MARGE);
    const apres = total(APRES, MARGE);
    expect([avant, apres]).toEqual([415, 543]);
    expect(attendus(s, "les-techniques")).toEqual([c((2 / 5) * 100), c((2 / 6) * 100), avant, apres, apres - avant]);
    expect(juste(s, "le-cardigan-rapporte")).toEqual(["Il n'a pas ce droit : la boutique peut faire un geste"]);
    expect(juste(s, "reponse")[0]).toMatch(/^Elle a payé : 128/);
  });
});
