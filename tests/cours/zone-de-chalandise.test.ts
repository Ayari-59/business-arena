import { describe, expect, it } from "vitest";
import { ZONE_DE_CHALANDISE, rangDeLaZone } from "../../src/config/cours/chapitres/zone-de-chalandise";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { UN_TRACT_POUR_QUELLE_ZONE } from "../../src/config/cours/situations/par-chapitre/un-tract-pour-quelle-zone";
import type { EtapeSimulation } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, juste } from "./gardes-de-la-boutique";
import { gardesDuBloc1 } from "./gardes-du-bloc-1-mco";

/**
 * LA ZONE DE CHALANDISE (BTS MCO, bloc 1, palier 2), SUR LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : UN
 * TRACT POUR QUELLE ZONE ?
 *
 * Refait à la main sur la fiche de MAILLE & CO : les fidèles de janvier (38 825 € HT, 46 590 € TTC) et les
 * passants (38 425 € HT, 46 110 € TTC) ; les hypothèses du monde : 28 000, 52 000 et 75 000 habitants, des
 * indices de 1,10, 0,95 et 0,90, 9 € de dépense par habitant, les parts du relevé des codes postaux, 800,
 * 1 200 et 4 800 m² de maille, le centre commercial (1 800 m², 14 km), Vauclair à 8 km et 6 km.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = ZONE_DE_CHALANDISE;

// La zone, à la main.
const DEP = [28_000 * 9 * 1.1, 52_000 * 9 * 0.95, 75_000 * 9 * 0.9].map(c);
const FID = 46_590;
const PAS = 46_110;
const CA = [0.6 * FID + 0.35 * PAS, 0.3 * FID + 0.3 * PAS, 0.1 * FID + 0.15 * PAS].map(c);
const OBJECTIF = c(0.1 * (FID + PAS));

describe("la zone de chalandise, à la boutique du monde du cours", () => {
  it("se joue chez MAILLE & CO, au palier 2 du BTS MCO, bloc 1, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 2]);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 1 · Développer la relation client et assurer la vente conseil"]);
    gardeDuProgramme(ch, PROGRAMME.mco[2]!, () => "bts-mco", /^BTS MCO /);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(UN_TRACT_POUR_QUELLE_ZONE);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDuBloc1(ch);
  });

  it("la dépense et le chiffre de chaque zone, refaits à la main", () => {
    expect(DEP).toEqual([277_200, 444_600, 607_500]);
    expect(CA).toEqual([44_092.5, 27_810, 11_575.5]);
    expect(attendus(ch, "la-depense")).toEqual(DEP);
    expect(attendus(ch, "le-chiffre-par-zone")).toEqual(CA);
    expect(c(FID + PAS - CA.reduce((t, x) => t + x, 0))).toBe(9_222);
  });

  it("les parts de marché, l'emprise et la part théorique, refaites à la main", () => {
    expect(attendus(ch, "la-part-de-marche")).toEqual(CA.map((x, i) => c((x / DEP[i]!) * 100)));
    expect(attendus(ch, "la-part-de-marche")).toEqual([15.91, 6.26, 1.91]);
    // Les clients : 340 fidèles et 600 passants, selon les parts du relevé.
    expect(attendus(ch, "le-taux-d-emprise")).toEqual([204 + 210, 102 + 180, 34 + 90, c((414 / 28_000) * 100), c((282 / 52_000) * 100)]);
    expect(attendus(ch, "la-part-theorique")).toEqual([15, 10, 2.5, c(0.1 * 444_600 - 27_810), c(0.025 * 607_500 - 11_575.5)]);
    expect(attendus(ch, "la-part-theorique").slice(3)).toEqual([16_650, 3_612]);
  });

  it("la loi de Reilly, le point de rupture au curseur, refaits à la main", () => {
    const rapport = (800 / 1_800) * (6 / 8) ** 2;
    expect(rapport).toBeCloseTo(0.25, 12);
    const vauclair = c(6_000 * 9 * 0.95);
    expect(attendus(ch, "reilly-a-vauclair")).toEqual([0.25, 20, c(vauclair * 0.2)]);
    expect(juste(ch, "predire-reilly")).toEqual(["Un cinquième"]);
    // Point de rupture : 14 000 ÷ (1 + √(1 800 ÷ 800)) = 14 000 ÷ 2,5.
    expect(14_000 / (1 + Math.sqrt(1_800 / 800))).toBe(5_600);
    const e = gardeDuCurseur(ch, "le-point-de-rupture", 5_600);
    const l = Object.fromEntries(e.lecture(BOUTIQUE, 5_600).map((x) => [x.libelle, x.montant]));
    expect(l).toEqual({ "Dépense attirée par le centre-ville": c(vauclair / 2), "Dépense attirée par le centre commercial": c(vauclair / 2), "Écart en faveur du centre-ville": 0 });
  });

  it("la zone du site et le laboratoire de la zone, refaits à la main", () => {
    expect(attendus(ch, "la-zone-du-site")).toEqual([c((1_300 / 4_000) * 100), c((48 / 940) * 100)]);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-zone");
    const lab = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-la-zone", "simulation") as EtapeSimulation;
    // La plus petite hausse, au dixième de point, qui atteint 9 270 € dans la zone secondaire : 2,1 points, sous 10 %.
    expect(OBJECTIF).toBe(9_270);
    expect(Math.ceil((OBJECTIF / 444_600) * 1_000) / 10).toBe(2.1);
    expect(lab.defi(BOUTIQUE).solution).toEqual({ zone: rangDeLaZone("secondaire"), points: 2.1 });
    const l = Object.fromEntries(lab.lecture(BOUTIQUE, { zone: 2, points: 2.1 }).map((x) => [x.libelle, x.montant]));
    expect(l["Chiffre d'affaires TTC gagné"]).toBe(c(444_600 * 0.021));
    expect(l["Écart à l'objectif"]).toBe(c(444_600 * 0.021 - OBJECTIF));
    // Dans la zone primaire, il faudrait 3,4 points ; dans la tertiaire, 1,6 : au-delà de leur part théorique.
    expect([Math.ceil((OBJECTIF / 277_200) * 1_000) / 10, Math.ceil((OBJECTIF / 607_500) * 1_000) / 10]).toEqual([3.4, 1.6]);
    expect([CA[0]! / DEP[0]! + 0.034 > 0.15, CA[2]! / DEP[2]! + 0.016 > 0.025]).toEqual([true, true]);
  });

  it("l'objectif à rebours et la réponse, refaits à la main", () => {
    expect(attendus(ch, "l-objectif-a-rebours")).toEqual([c(((27_810 + OBJECTIF) / 444_600) * 100), Math.ceil(OBJECTIF / c(PAS / 600))]);
    expect(attendus(ch, "l-objectif-a-rebours")).toEqual([8.34, 121]);
    expect(juste(ch, "ou-porter-l-effort")).toEqual(["La zone secondaire : elle laisse le plus à prendre"]);
  });
});

describe("le cas : un tract pour quelle zone ?", () => {
  const s = UN_TRACT_POUR_QUELLE_ZONE;

  it("tient la forme d'un cas dédié, aux textes propres", () => {
    gardeDuCas(s, ch);
    gardesDuBloc1(s);
  });

  it("le concurrent, la zone secondaire et l'appoint de la tertiaire, refaits à la main", () => {
    expect(attendus(s, "la-zone-secondaire")).toEqual([444_600, 6.26]);
    // 300 m² de plus : 120 ÷ 1 500 = 8 % ; 8 % × 444 600 − 27 810 = 7 758 €.
    const potentiel = c(0.08 * 444_600 - 27_810);
    expect(potentiel).toBe(7_758);
    expect(attendus(s, "la-nouvelle-part-theorique")).toEqual([8, potentiel, 3_612]);
    const manque = c(OBJECTIF - potentiel);
    expect(attendus(s, "l-appoint")).toEqual([manque, c((manque / 607_500) * 100)]);
    expect(attendus(s, "l-appoint")).toEqual([1_512, 0.25]);
    expect(manque).toBeLessThan(3_612);
    expect(juste(s, "reponse")).toEqual(["Garder la zone secondaire, et compléter par la tertiaire"]);
  });
});
