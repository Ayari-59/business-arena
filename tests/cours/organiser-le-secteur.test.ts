import { describe, expect, it } from "vitest";
import { ORGANISER_LE_SECTEUR } from "../../src/config/cours/chapitres/organiser-le-secteur";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LES_COMPTES_DE_HUGO } from "../../src/config/cours/situations/par-chapitre/les-comptes-de-hugo";
import { attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-du-terrain-d-atlas";

/**
 * ORGANISER LE SECTEUR : VISITES, TEMPS ET TOURNÉES (BTS NDRC, bloc 1, palier 4), CHEZ ATLAS CONSEIL, ET
 * SON CAS : LES COMPTES DE HUGO.
 *
 * Refait à la main : 365 − 104 − 25 − 8 = 228 jours ouvrés, 175 de terrain, 350 visites ; 4 A × 12 + 1 B × 6
 * + 14 C × 4 = 110 visites de suivi, 220 rendez-vous d'affaires, 20 visites libres ; 66 000 € ÷ 330 = 200 €
 * la visite, 56 × 200 = 11 200 € pour les C, 2 240 € de route ; les C à distance rendent 42 visites, deux
 * visites par an en rendent 28 ; les tournées de 155 et 130 km. Le cas : 5 comptes B repris (30 visites).
 */

const ch = ORGANISER_LE_SECTEUR;

describe("organiser le secteur, chez le cabinet du monde du cours", () => {
  it("se joue chez ATLAS CONSEIL, au palier 4 du BTS NDRC, bloc 1, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["ndrc", 4]);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente"]);
    gardeDuProgramme(ch, PROGRAMME.ndrc[4]!);
    for (const p of ch.prerequis!) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(LES_COMPTES_DE_HUGO);
    expect(SITUATIONS).toContain(LES_COMPTES_DE_HUGO);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDeTexte(ch);
  });

  it("les jours de terrain, la charge et le coût d'une visite, refaits à la main", () => {
    expect(attendus(ch, "les-jours-de-terrain")).toEqual([365 - 104 - 25 - 8, 228 - 5 - 44 - 4, 175 * 2]);
    expect(attendus(ch, "la-charge-de-visites")).toEqual([4 * 12 + 6 + 14 * 4, 110 + 220, 350 - 330]);
    const cout = ((13_200 + 3_300) * 4) / 330;
    expect(attendus(ch, "le-cout-d-une-visite")).toEqual([66_000, cout, 56 * cout, Math.round((11_200 / 37_240) * 10_000) / 100]);
    expect(attendus(ch, "le-cout-d-une-visite")).toEqual([66_000, 200, 11_200, 30.08]);
    expect(juste(ch, "ce-qu-economise-une-visite")[0]).toMatch(/^Non : 2.240 € de route, le salaire reste payé$/);
  });

  it("le temps libéré : le pari, le laboratoire, puis les deux solutions", () => {
    expect(juste(ch, "predire-la-distance")).toEqual(["Les visites à distance"]);
    const l = gardeDuLaboratoire(ch, "le-laboratoire-du-secteur");
    expect(l.depart).toEqual({ frequenceC: 4, distance: 0 });
    expect(l.d.solution).toEqual({ frequenceC: 4, distance: 100 });
    expect(l.auDepart["Visites qui restent pour les prospects"]).toBe(20);
    expect(l.aLaSolution).toEqual({
      "Visites de suivi, en temps de visite sur place": 48 + 6 + 56 * 0.25,
      "Charge de visites": 68 + 220,
      "Frais de route évités": 2_240,
      "Visites qui restent pour les prospects": 62,
    });
    // Le défi n'a qu'une solution qui garde les C chaque trimestre : à 75 % de distance, ou à 5 visites, il manque des visites.
    expect(l.d.atteint({ frequenceC: 4, distance: 75 })).toBe(false);
    expect(l.d.atteint({ frequenceC: 5, distance: 100 })).toBe(false);
    expect(l.d.atteint({ frequenceC: 2, distance: 0 })).toBe(false);
    expect(l.d.atteint({ frequenceC: 1, distance: 0 })).toBe(false);
    expect(attendus(ch, "les-deux-solutions")).toEqual([14 * 2, 20 + 28, 56 * 0.75, 20 + 42]);
  });

  it("la tournée : 155 km contre 130, 3 h 06 contre 2 h 36 de route, 11,25 € évités", () => {
    expect(attendus(ch, "la-tournee")).toEqual([30 + 45 + 25 + 55, 30 + 35 + 25 + 40, 3.1, 2.6, 25 * 0.45]);
    expect(juste(ch, "la-meilleure-tournee")).toEqual(["Imprimerie Garance, puis Biscuiterie Malvine, puis Pépinières Lorvan"]);
    expect(juste(ch, "la-decision")).toEqual(["Voir les comptes C chaque trimestre, à distance"]);
  });
});

describe("son cas : les comptes de Hugo", () => {
  const s = LES_COMPTES_DE_HUGO;

  it("tient comme un cas dédié, et la réponse ne se devine pas à sa longueur", () => {
    gardeDuCas(s, ch);
  });

  it("la charge de Nadia avec les comptes repris, puis celle de Hugo, refaites à la main", () => {
    expect(attendus(s, "la-charge-de-nadia")).toEqual([5 * 6, 330 + 30, 350 - 360]);
    expect(attendus(s, "avec-les-c-a-distance")).toEqual([360 - 42, 350 - 318, 60 - 32]);
    // Hugo : 5 comptes B, 36 + 40 + 34 + 46 rendez-vous d'affaires en N.
    expect(attendus(s, "la-charge-de-hugo")).toEqual([30, 30 + 156, 350 - 186]);
    expect(juste(s, "reponse")).toEqual(["Hugo les garde un an : Nadia perdrait 28 prospects"]);
  });
});
