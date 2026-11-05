import { describe, expect, it } from "vitest";
import { CONTENUS_COMMUNAUTE_ET_E_REPUTATION, VALEUR_D_UN_CONTACT } from "../../src/config/cours/chapitres/contenus-communaute-et-e-reputation";
import { dureeDuChapitre } from "../../src/config/cours/duree";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { CODES_DE_REMISE, DEMANDE_D_AVIS, L_AVIS_A_UNE_ETOILE } from "../../src/config/cours/situations/par-chapitre/l-avis-a-une-etoile";
import type { EtapeTri } from "../../src/config/cours/types";
import { CONSEIL, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-du-site-d-atlas";

/**
 * CONTENUS, COMMUNAUTÉ ET E-RÉPUTATION (BTS NDRC, bloc 2, palier 4), SUR LA BOUTIQUE EN LIGNE D'ATLAS
 * CONSEIL, ET SON CAS : L'AVIS À UNE ÉTOILE.
 *
 * Refait à la main sur le premier trimestre du site (monde/site-d-atlas.ts) et la fiche du cabinet : 39
 * publications (18, 12, 6 et 3), 114 000 impressions ; le livre blanc (1 600 visites, 240
 * téléchargements) et le webinaire (300 inscrits, 120 présents), 2 400 € ; 1 contact sur 300 devient un
 * compte de 21 000 € de marge par an, 84 000 € sur sa vie, 60 000 € actualisé ; 100 € la publication ;
 * les contacts selon le rythme (0, 30, 50, 65, 75, 79, 81) ; 40 avis (1, 1, 2, 9, 27) ; 1 % de conversion
 * à 4,5, 0,04 point par dixième ; 12 000 visites, 432,80 € de marge par commande.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = CONTENUS_COMMUNAUTE_ET_E_REPUTATION;
const CONTACTS = [0, 30, 50, 65, 75, 79, 81];
const VALEURS = [21_000 / 300, 60_000 / 300, 84_000 / 300];
const gain = (r: number, v: number) => CONTACTS[r]! * v - r * 13 * 100;
const meilleur = (v: number) => CONTACTS.reduce((b, _, r) => (gain(r, v) > gain(b, v) + 1e-9 ? r : b), 0);
const MARGE = 432.8;

describe("contenus, communauté et e-réputation, à la boutique en ligne d'ATLAS CONSEIL", () => {
  it("se joue chez ATLAS CONSEIL, au palier 4 du BTS NDRC, bloc 2, au programme, après le site qui vend", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(L_AVIS_A_UNE_ETOILE);
    expect([ch.parcours, ch.palier]).toEqual(["ndrc", 4]);
    gardeDuProgramme(ch, PROGRAMME.ndrc[4]!);
    {
      const liste = PROGRAMME.ndrc[4]!;
      expect(liste[liste.indexOf(ch.titre) - 1]).toBe("Organiser le secteur : visites, temps et tournées");
    }
    expect(ch.prerequis).toContain("le-site-qui-vend");
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(L_AVIS_A_UNE_ETOILE);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect([ch.etapes[0]!.type, ch.etapes.at(-1)!.id]).toEqual(["lecture", "synthese"]);
    expect(dureeDuChapitre(ch)).toBe(55);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDeTexte(ch);
  });

  it("l'engagement et le taux de clic : les conseils font réagir, les annonces font cliquer", () => {
    expect(attendus(ch, "l-engagement")).toEqual([c((2_160 / 54_000) * 100), c((240 / 24_000) * 100), c((300 / 54_000) * 100), c((400 / 24_000) * 100), c((3_900 / 114_000) * 100)]);
    expect(attendus(ch, "l-engagement")).toEqual([4, 1, 0.56, 1.67, 3.42]);
    expect(juste(ch, "quoi-publier")).toBe("Non : il faut un mélange, plus de témoignages");
  });

  it("le marketing entrant : 360 contacts à 6,67 €, 1,2 compte attendu ; un contact vaut 70, 200 ou 280 €", () => {
    expect(attendus(ch, "le-marketing-entrant")).toEqual([(240 / 1_600) * 100, (120 / 300) * 100, 360, c(2_400 / 360), 360 / 300]);
    expect(attendus(ch, "le-marketing-entrant")).toEqual([15, 40, 360, 6.67, 1.2]);
    expect(attendus(ch, "ce-que-vaut-un-contact")).toEqual([...VALEURS, (39 * 100) / 65]);
    expect(attendus(ch, "ce-que-vaut-un-contact")).toEqual([70, 200, 280, 60]);
  });

  it("le laboratoire du rythme : 4 par semaine à la valeur vie, 2 sur la seule première année", () => {
    expect(juste(ch, "predire-le-rythme")).toMatch(/^Pas forcément/);
    const { depart, d } = gardeDuLaboratoire(ch, "le-laboratoire-du-rythme");
    expect(depart).toEqual({ rythme: 3, valeur: VALEUR_D_UN_CONTACT.actualisee });
    expect(d.solution).toEqual({ rythme: 4, valeur: VALEUR_D_UN_CONTACT.actualisee });
    expect(VALEURS.map(meilleur)).toEqual([2, 4, 4]);
    for (let v = 0; v < 3; v++) for (let r = 0; r <= 6; r++) expect(d.atteint({ rythme: r, valeur: v }), `${r} à ${v}`).toBe(r === meilleur(VALEURS[v]!));
    expect(CONTACTS.map((_, r) => gain(r, 200))).toEqual([0, 4_700, 7_400, 9_100, 9_800, 9_300, 8_400]);
    expect(attendus(ch, "la-publication-en-plus")).toEqual([10, 10 * 200 - 1_300, 4, 4 * 200 - 1_300]);
    expect(attendus(ch, "la-publication-en-plus")).toEqual([10, 700, 4, -500]);
    expect(juste(ch, "le-rythme-a-proposer")).toBe("4 par semaine, avec plus de témoignages");
  });

  it("la note : 4,5 sur 40 avis ; 3 avis à 1 étoile l'amènent à 4,26 (4,3 affiché) ; il faut 21 avis à 5 étoiles", () => {
    const points = 1 + 2 + 6 + 36 + 135;
    expect([points, points / 40]).toEqual([180, 4.5]);
    expect(attendus(ch, "la-note-moyenne")).toEqual([40, 4.5, 90, c(183 / 43), 4.3]);
    expect(juste(ch, "predire-les-avis")).toMatch(/^Environ 20,/);
    // (183 + 5k) ÷ (43 + k) ≥ 4,5 ⇔ k ≥ 21.
    gardeDuCurseur(ch, "les-avis-au-curseur", 21);
    expect([(183 + 5 * 21) / (43 + 21), (183 + 5 * 20) / (43 + 20) < 4.5]).toEqual([4.5, true]);
    // À 4,3 : 1 % − 2 × 0,04 = 0,92 %, 110,4 commandes, 9,6 de moins à 432,80 €.
    expect(attendus(ch, "la-note-et-la-conversion")).toEqual([0.92, 110.4, c(-9.6 * MARGE)]);
    expect(attendus(ch, "la-note-et-la-conversion")[2]).toBe(-4_154.88);
  });

  it("les écrits digitaux et l'avis négatif", () => {
    const tri = etape(ch, "les-ecrits-digitaux", "tri") as EtapeTri;
    expect(tri.elements(CONSEIL).map((x) => x.categorie)).toEqual(["publication", "article", "reponse", "reponse", "article", "publication"]);
    expect(juste(ch, "l-avis-negatif")).toBe("Excuses, un appel, et désormais un préavis de 7 jours");
  });

  it("la synthèse finit sur l'arène", () => {
    const e = etape(ch, "synthese", "lecture");
    expect(e.texte(CONSEIL).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });
});

describe("le cas : l'avis à une étoile", () => {
  const s = L_AVIS_A_UNE_ETOILE;

  it("est le cas dédié du chapitre, sans cours, une réponse au bout", () => {
    gardeDuCas(s, ch);
    expect(s.commanditaire).toBe("La responsable des sessions");
  });

  it("un avis coûte un dixième de note et 2 077,44 € par trimestre ; 7 avis à 5 étoiles l'effacent ; la demande à chacun ramène 4,5", () => {
    expect(attendus(s, "ce-que-coute-l-avis")).toEqual([c(181 / 41), 4.4, 0.96, c(12_000 * -0.0004 * MARGE)]);
    expect(attendus(s, "ce-que-coute-l-avis")[3]).toBe(-2_077.44);
    // (181 + 5k) ÷ (41 + k) ≥ 4,5 ⇔ k ≥ 7.
    gardeDuCurseur(s, "les-avis-qu-il-faut", 7);
    expect([DEMANDE_D_AVIS, CODES_DE_REMISE]).toEqual([{ tauxDeReponse: 0.3, noteMoyenne: 4.6 }, { participants: 30, remise: 0.2 }]);
    expect(attendus(s, "deux-facons")).toEqual([180 * 0.3, c((181 + 54 * 4.6) / (41 + 54)), 30 * 0.2 * 350]);
    expect(attendus(s, "deux-facons")).toEqual([54, 4.52, 2_100]);
    expect(juste(s, "reponse")).toBe("Répondre à l'avis, et demander un avis à chacun, sans contrepartie");
  });
});
