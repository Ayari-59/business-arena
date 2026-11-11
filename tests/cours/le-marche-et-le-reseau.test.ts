import { describe, expect, it } from "vitest";
import { DEPART_DU_LABORATOIRE, ENTREPRISES_DU_RESEAU, LE_MARCHE_ET_LE_RESEAU, rangDeLaForme } from "../../src/config/cours/chapitres/le-marche-et-le-reseau";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { FRANCHISE, GROUPEMENT_D_ACHAT, MARCHE_LOCAL_DE_LA_MAILLE, SECONDE_ENSEIGNE, SEUIL_DE_LA_CDAC_EN_M2, marcheLocal, moisSelonLaForme, passeDevantLaCdac } from "../../src/config/cours/monde/reseau-de-la-boutique";
import { PROGRAMME } from "../../src/config/cours/registre";
import { UNE_SECONDE_ENSEIGNE } from "../../src/config/cours/situations/par-chapitre/une-seconde-enseigne";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE MARCHÉ ET LE RÉSEAU (BTS MCO, bloc 2), À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : UNE SECONDE
 * ENSEIGNE FRAPPE À LA PORTE.
 *
 * Refait à la main sur la fiche de MAILLE & CO : janvier, 87 450 € hors taxes, 44 250 € de marge sur
 * coût variable, 38 325 € d'achats des articles vendus, 30 695 € de charges fixes, 13 555 € de
 * résultat. Le groupement : 5 % de remise, 800 € de cotisation. La franchise : 8 % de remise, 6 % de
 * redevances, 400 € de droit d'entrée par mois, 8 % de ventes en plus observés.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CA = 87_450;
const MARGE = 44_250;
const ACHATS = 38_325;
const FIXES = 30_695;
/** Le résultat en franchise, ligne par ligne au centime, refait à la main. */
const franchise = (h: number, o = FRANCHISE) =>
  c(c(MARGE * (1 + h)) + c(c(ACHATS * (1 + h)) * o.remiseCentrale) - c(c(CA * (1 + h)) * (o.redevanceDExploitation + o.redevanceDeCommunication)) - c(o.droitDEntree / o.dureeDuContratEnMois) - FIXES);

describe("le marché et le réseau : le chapitre et son cas", () => {
  it("au palier 4 du BTS MCO, bloc 2, au programme, à la boutique seule ; le cas lui est dédié", () => {
    expect([LE_MARCHE_ET_LE_RESEAU.parcours, LE_MARCHE_ET_LE_RESEAU.palier]).toEqual(["mco", 4]);
    expect(LE_MARCHE_ET_LE_RESEAU.blocs).toEqual(["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale"]);
    gardeDuProgramme(LE_MARCHE_ET_LE_RESEAU, PROGRAMME.mco[4]!, () => "bts-mco", /^BTS MCO /);
    expect(PROGRAMME.mco[4]![PROGRAMME.mco[4]!.indexOf(LE_MARCHE_ET_LE_RESEAU.titre) - 1]).toBe("Le tableau de bord du manager");
    expect([...ENTREPRISES_DU_RESEAU]).toEqual(["boutique"]);
    expect(LE_MARCHE_ET_LE_RESEAU.etapes.length).toBeLessThanOrEqual(20);
    gardeDuCas(UNE_SECONDE_ENSEIGNE, LE_MARCHE_ET_LE_RESEAU);
  });

  it("le marché local : la zone, 1 107 750 € hors taxes ; la caisse, 77 250 € ; 6,97 % ; 0,20 fois le leader", () => {
    const m = marcheLocal(f);
    // La dépense de la zone : (28 000 × 1,10 + 52 000 × 0,95 + 75 000 × 0,90) × 9 € TTC, ramenée hors taxes.
    const zone = c(((28_000 * 1.1 + 52_000 * 0.95 + 75_000 * 0.9) * 9) / 1.2);
    expect(zone).toBe(1_107_750);
    expect(m.total).toBe(zone);
    const caisse = 38_825 + 38_425;
    expect(m.boutique.ventesDuMois).toBe(caisse);
    const comptes = MARCHE_LOCAL_DE_LA_MAILLE.reduce((t, a) => t + (a.ventesDuMois ?? 0), 0);
    expect(m.acteurs.find((a) => a.code === "independants")!.ventesDuMois).toBe(zone - caisse - comptes);
    expect(m.horsMarche).toBe(CA - caisse);
    expect(attendus(LE_MARCHE_ET_LE_RESEAU, "la-part-de-marche")).toEqual([zone, c((caisse / zone) * 100), c(caisse / 395_000)]);
    expect([c((caisse / zone) * 100), c(caisse / 395_000)]).toEqual([6.97, 0.2]);
    expect(m.leader.code).toBe("centre-commercial");
    expect(m.marches.find((x) => x.marche === "principal")!.depenseDuMois).toBe(zone);
  });

  it("les trois formes : 13 555 €, 14 671,25 € au groupement, 14 339,52 € en franchise à 8 %", () => {
    expect(moisSelonLaForme(f, "independante").resultat).toBe(13_555);
    expect(c(13_555 + ACHATS * GROUPEMENT_D_ACHAT.remiseCentrale - GROUPEMENT_D_ACHAT.cotisationDuMois)).toBe(14_671.25);
    expect(franchise(0.08)).toBe(14_339.52);
    expect(attendus(LE_MARCHE_ET_LE_RESEAU, "les-trois-formes")).toEqual([14_671.25, 3_311.28, 5_666.76, 14_339.52]);
    expect(moisSelonLaForme(f, "franchise", 0.08).resultat).toBe(franchise(0.08));
  });

  it("le curseur : 7 % de ventes en plus pour égaler l'indépendance ; le laboratoire : 9 % pour battre le groupement", () => {
    expect([franchise(0.06) < 13_555, franchise(0.07) >= 13_555]).toEqual([true, true]);
    gardeDuCurseur(LE_MARCHE_ET_LE_RESEAU, "la-franchise-au-curseur", 7);
    expect([franchise(0.08) > 14_671.25, franchise(0.09) > 14_671.25]).toEqual([false, true]);
    const e = gardeDuLaboratoire(LE_MARCHE_ET_LE_RESEAU, "le-laboratoire-du-reseau");
    expect(e.defi(BOUTIQUE).solution).toEqual({ forme: rangDeLaForme("franchise"), hausse: 9 });
    expect(DEPART_DU_LABORATOIRE).toEqual({ forme: 3, hausse: 0 });
  });

  it("les verdicts : le groupement ; la commission départementale au-delà de 1 000 m² ; le pari sans hausse", () => {
    expect(juste(LE_MARCHE_ET_LE_RESEAU, "rejoindre")[0]).toMatch(/^Le groupement/);
    expect(juste(LE_MARCHE_ET_LE_RESEAU, "le-second-point-de-vente")[0]).toMatch(/^Le magasin d'usine seul/);
    expect([passeDevantLaCdac(180), passeDevantLaCdac(1_200), SEUIL_DE_LA_CDAC_EN_M2]).toEqual([false, true, 1_000]);
    expect(juste(LE_MARCHE_ET_LE_RESEAU, "predire-la-franchise")[0]).toMatch(/^Moins :/);
    expect(franchise(0)).toBe(10_974);
    const tri = etape(LE_MARCHE_ET_LE_RESEAU, "les-marches", "tri").elements(BOUTIQUE);
    expect(tri.map((x) => x.categorie)).toEqual(["principal", "environnant", "environnant", "generique", "support"]);
    expect(etape(LE_MARCHE_ET_LE_RESEAU, "rejoindre", "choix").options(BOUTIQUE, VIDE)).toHaveLength(3);
  });

  it("le cas : la seconde enseigne laisse 14 439,59 € à 6 %, 16 161,65 € à 10 %, et ne bat le groupement qu'à 7 %", () => {
    expect(franchise(0.06, SECONDE_ENSEIGNE)).toBe(14_439.59);
    expect(franchise(0.1, SECONDE_ENSEIGNE)).toBe(16_161.65);
    expect(attendus(UNE_SECONDE_ENSEIGNE, "a-la-hausse-observee")).toEqual([2_437.47, 3_707.88, 14_439.59]);
    expect(attendus(UNE_SECONDE_ENSEIGNE, "a-la-hausse-promise")).toEqual([16_161.65]);
    gardeDuCurseur(UNE_SECONDE_ENSEIGNE, "la-hausse-qui-suffit", 7);
    expect(juste(UNE_SECONDE_ENSEIGNE, "reponse")[0]).toMatch(/^Le groupement reste meilleur/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre et le cas", () => {
    gardesDeTexte(LE_MARCHE_ET_LE_RESEAU);
    gardesDeTexte(UNE_SECONDE_ENSEIGNE);
  });
});
