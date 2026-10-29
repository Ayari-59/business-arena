import { describe, expect, it } from "vitest";
import { CHARGES_ET_ENCAISSEMENTS } from "../../src/config/cours/chapitres/charges-et-encaissements";
import { CREER_DES_RICHESSES } from "../../src/config/cours/chapitres/creer-des-richesses";
import { INDICE_DE_LA_HAUSSE, LES_ACTEURS_ET_LA_VALEUR } from "../../src/config/cours/chapitres/les-acteurs-et-la-valeur";
import { LES_FLUX } from "../../src/config/cours/chapitres/les-flux";
import { BAISSE_DE_PRIX, PRIX_COUT_MARGE } from "../../src/config/cours/chapitres/prix-cout-marge";
import {
  CHARGES_FIXES_DES_ENSEIGNES,
  FICHE_DU_MARCHE,
  HAUSSE_DEMANDEE,
  MARCHE_DE_L_ANNEE_SUIVANTE,
  RESULTAT_VOULU_PAR_LES_ASSOCIES,
  premierTrimestreALaBanque,
  premierTrimestreAuResultat,
  richesseDuMarche,
} from "../../src/config/cours/monde/gestion-et-information";
import { PROGRAMME } from "../../src/config/cours/registre";
import { L_ACOMPTE_DU_CLIENT } from "../../src/config/cours/situations/par-chapitre/l-acompte-du-client";
import { LE_FOURNISSEUR_AUGMENTE } from "../../src/config/cours/situations/par-chapitre/le-fournisseur-augmente";
import { LE_MARCHE_A_T_IL_GRANDI } from "../../src/config/cours/situations/par-chapitre/le-marche-a-t-il-grandi";
import { LES_CLIENTS_DEMANDENT_UNE_BAISSE } from "../../src/config/cours/situations/par-chapitre/les-clients-demandent-une-baisse";
import { REMBOURSER_UNE_PART_DU_PRET } from "../../src/config/cours/situations/par-chapitre/rembourser-une-part-du-pret";
import { SUIVRE_LA_BAISSE } from "../../src/config/cours/situations/suivre-la-baisse";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LA GESTION DE BASE SUR LE MONDE DU COURS (lot M3) : LES FLUX, CHARGES ET ENCAISSEMENTS, PRIX COÛT
 * ET MARGE, CRÉER DES RICHESSES, LES ACTEURS ET LA VALEUR, ET LEURS CAS.
 *
 * Refait à la main sur les fiches de NOVA : le semestre du contrôle de gestion (1 270, 1 130 et
 * 1 418 enceintes aux particuliers, 320 à CampusTech chaque mois, 59 € hors taxes, 22 € de
 * composants payés à 22 jours, 16 € d'autres coûts payés dans le mois, 19 700 € de loyer, 5 850 € de
 * salaires nets, 4 800 € de cotisations le mois suivant, 833 € d'usure, l'échéance de 4 000 € et
 * 1 000 € d'intérêts fin mars), le premier exercice (comptes-du-lycee.ts) et l'année type du marché à
 * trois (les ventes de chaque enseigne sont celles du modèle d'attractivité, que marche-a-trois.test.ts
 * refait déjà).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("les chapitres du lot et leurs cas, dans leurs parcours", () => {
  it("portent les titres du programme, au palier 1, chez NOVA seule, et leurs cas leur sont dédiés", () => {
    gardeDuProgramme(LES_FLUX, PROGRAMME["comptabilite-generale"][1]!);
    gardeDuProgramme(CHARGES_ET_ENCAISSEMENTS, PROGRAMME["comptabilite-generale"][1]!);
    gardeDuProgramme(PRIX_COUT_MARGE, PROGRAMME["controle-de-gestion"][1]!);
    gardeDuProgramme(CREER_DES_RICHESSES, PROGRAMME["seconde-ses"][1]!);
    gardeDuProgramme(LES_ACTEURS_ET_LA_VALEUR, PROGRAMME["stmg-management"][1]!);
    gardeDuCas(L_ACOMPTE_DU_CLIENT, LES_FLUX);
    gardeDuCas(REMBOURSER_UNE_PART_DU_PRET, CHARGES_ET_ENCAISSEMENTS);
    gardeDuCas(LE_FOURNISSEUR_AUGMENTE, PRIX_COUT_MARGE);
    gardeDuCas(LE_MARCHE_A_T_IL_GRANDI, CREER_DES_RICHESSES);
    gardeDuCas(LES_CLIENTS_DEMANDENT_UNE_BAISSE, LES_ACTEURS_ET_LA_VALEUR);
    // Le cas de synthèse reprend aussi le seuil, au palier 2 : il se joue chez NOVA comme ses chapitres.
    expect(SUIVRE_LA_BAISSE.entreprises?.codes).toEqual(["nova"]);
    gardesDeTexte(SUIVRE_LA_BAISSE);
  });
});

describe("les flux de l'entreprise", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LES_FLUX);
  });

  it("le mois de janvier, partenaire par partenaire : les montants du cas figé de NOVA", () => {
    expect(triDe(LES_FLUX, "partenaires")).toEqual({
      "Apport en capital": "associes",
      "Emprunt reçu": "banque",
      "Achat : Ligne manuelle": "fournisseurs",
      "Achat chez Électro-Composants Lyon": "fournisseurs",
      "Loyer du local": "fournisseurs",
      "Vente à CampusTech": "clients",
      "Ventes aux particuliers du mois": "clients",
      "Salaires nets versés": "salaries",
      "Cotisations sociales": "etat",
    });
  });

  it("le premier trimestre vu de la banque : 270 314,40 € entrés, 276 011,60 € sortis, la banque baisse de 5 697,20 €", () => {
    const particuliers = (1_270 + 1_130 + 1_418) * 59 * 1.2;
    // Les composants de janvier se paient le 1er février, ceux de février le 1er mars ; ceux de mars en avril.
    const fournisseur = (1_590 + 1_450) * 22 * 1.2;
    const autres = (1_590 + 1_450 + 1_738) * 16 * 1.2;
    // La TVA de janvier se paie en février, celle de février en mars.
    const tvaDeJanvier = 93_810 * 0.2 - (1_590 * 22 + 1_590 * 16) * 0.2;
    const tvaDeFevrier = 85_550 * 0.2 - (1_450 * 22 + 1_450 * 16) * 0.2;
    const sorties = fournisseur + autres + 3 * 19_700 + 3 * 5_850 + 2 * 4_800 + tvaDeJanvier + tvaDeFevrier + 4_000 + (80_000 * 0.05) / 4;
    expect(attendus(LES_FLUX, "le-trimestre")).toEqual([c(particuliers), c(sorties), c(particuliers - sorties)]);
    expect([c(particuliers), c(sorties)]).toEqual([270_314.4, 276_011.6]);
    const t = premierTrimestreALaBanque();
    expect([t.debut, t.fin]).toEqual([25_000, c(25_000 - 5_697.2)]);
    expect(t.duParCampusTech).toBe(3 * 320 * 59 * 1.2);
    expect(juste(LES_FLUX, "deux-sens")).toEqual(["Un flux réel vers le client, les enceintes, et un flux financier en sens inverse, le paiement, 80 jours plus tard."]);
  });

  it("le curseur : 111 enceintes de plus en mars, chacune 70,80 € entrés et 19,20 € sortis avant avril", () => {
    gardeDuCurseur(LES_FLUX, "des-ventes-en-mars", Math.ceil(5_697.2 / (70.8 - 19.2)));
    expect(premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: 111 }).variation).toBe(c(-5_697.2 + 111 * 51.6));
  });

  it("le laboratoire : à 60 jours, la facture du 20 janvier est payée le 20 mars, la seule de quatre positions qui garde la banque", () => {
    const e = gardeDuLaboratoire(LES_FLUX, "le-laboratoire-du-delai");
    expect(e.defi(NOVA).solution).toEqual({ delai: 60 });
    expect(premierTrimestreALaBanque(undefined, { delaiCampusTech: 60 }).variation).toBe(c(-5_697.2 + 320 * 59 * 1.2));
    expect(premierTrimestreALaBanque(undefined, { delaiCampusTech: 30 }).variation).toBe(c(-5_697.2 + 2 * 320 * 59 * 1.2));
  });
});

describe("charges et produits, encaissements et décaissements", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CHARGES_ET_ENCAISSEMENTS);
  });

  it("janvier rangé deux fois : l'apport, l'emprunt et l'équipement ne sont ni charge ni produit ; la facture de CampusTech n'entre pas en janvier", () => {
    const resultat = triDe(CHARGES_ET_ENCAISSEMENTS, "charge-ou-produit");
    expect([resultat["Apport des associés"], resultat["Emprunt reçu"], resultat["Équipement : Ligne manuelle"], resultat["Vente à CampusTech"]]).toEqual(["ni", "ni", "ni", "produit"]);
    const banque = triDe(CHARGES_ET_ENCAISSEMENTS, "entree-ou-sortie");
    expect([banque["Facture de CampusTech"], banque["Cotisations sociales"], banque["Équipement payé"]]).toEqual(["rien", "rien", "decaissement"]);
  });

  it("le trimestre : 281 902 € de ventes, 276 113 € de charges, 5 789 € de résultat ; 11 486,20 € d'écart avec la banque", () => {
    const q = 1_590 + 1_450 + 1_738;
    const charges = q * 22 + q * 16 + 3 * 19_700 + 3 * 10_650 + 3 * 833 + 1_000;
    expect(attendus(CHARGES_ET_ENCAISSEMENTS, "le-trimestre")).toEqual([charges, q * 59 - charges]);
    expect([q * 59, charges, q * 59 - charges]).toEqual([281_902, 276_113, 5_789]);
    expect(attendus(CHARGES_ET_ENCAISSEMENTS, "resultat-et-banque")).toEqual([-5_697.2, c(-5_697.2 - 5_789)]);
    expect(premierTrimestreAuResultat().dotation).toBe(2_499);
  });

  it("le curseur : 4 503 enceintes paient les 94 549 € qui ne bougent pas ; 4 502 n'en font que 94 542 €", () => {
    gardeDuCurseur(CHARGES_ET_ENCAISSEMENTS, "le-seuil-du-trimestre", Math.ceil((3 * 19_700 + 3 * 10_650 + 3 * 833 + 1_000) / 21));
    expect(4_502 * 21).toBe(94_542);
  });

  it("le laboratoire : 9 000 € remboursés laissent 10 302,80 € en banque ; le résultat ne bouge pas", () => {
    const e = gardeDuLaboratoire(CHARGES_ET_ENCAISSEMENTS, "le-laboratoire-du-remboursement");
    expect(e.defi(NOVA).solution).toEqual({ rembourse: Math.floor((19_302.8 - 10_000) / 1_000) * 1_000 });
    expect(premierTrimestreALaBanque(undefined, { remboursementAnticipe: 9_000 }).fin).toBe(c(19_302.8 - 9_000));
  });
});

describe("rembourser une part du prêt en février", () => {
  it("février : 85 550 € de ventes, 86 283 € de charges, une perte de 733 € ; la banque baisse de 34 840 €", () => {
    expect(attendus(REMBOURSER_UNE_PART_DU_PRET, "resultat")).toEqual([1_450 * 59, 1_450 * 38 + 19_700 + 10_650 + 833, 1_450 * 21 - 31_183]);
    const decaissements = 1_590 * 22 * 1.2 + 1_450 * 16 * 1.2 + 19_700 + 5_850 + 4_800 + 6_678 + 8_000;
    expect(attendus(REMBOURSER_UNE_PART_DU_PRET, "banque")).toEqual([1_130 * 59 * 1.2, c(decaissements), c(1_130 * 70.8 - decaissements)]);
    expect(triDe(REMBOURSER_UNE_PART_DU_PRET, "ce-que-touche")["Remboursement par avance de l'emprunt"]).toBe("banque");
  });
});

describe("prix, coût et marge", () => {
  it("les textes sont propres ; janvier de NOVA : 38 € de coût, 21 € de marge, 55,3 % et 35,6 %", () => {
    gardesDeTexte(PRIX_COUT_MARGE);
    expect(attendus(PRIX_COUT_MARGE, "marge-unitaire")).toEqual([22 + 16, 59 - 38]);
    expect(attendus(PRIX_COUT_MARGE, "les-taux")).toEqual([Math.round((21 / 38) * 1_000) / 10, Math.round((21 / 59) * 1_000) / 10]);
    expect(attendus(PRIX_COUT_MARGE, "le-mois")).toEqual([21 * 1_590, 21 * 1_590 - (19_700 + 10_650 + 833)]);
    expect(attendus(PRIX_COUT_MARGE, "baisse-de-prix")).toEqual([c(59 * 0.9 - 38), Math.round(((21 - 15.1) / 21) * 1_000) / 10]);
    expect(BAISSE_DE_PRIX).toBe(0.1);
  });

  it("le curseur : 58 €, le premier prix qui couvre 31 183 € de charges fixes sur 1 590 enceintes", () => {
    gardeDuCurseur(PRIX_COUT_MARGE, "prix-plancher", Math.ceil(38 + 31_183 / 1_590));
  });

  it("le laboratoire : 2 220 enceintes à 53,10 € gardent les 33 390 € de marge ; il en faudrait 2 212 au plus juste", () => {
    const e = gardeDuLaboratoire(PRIX_COUT_MARGE, "le-laboratoire-des-quantites");
    expect(Math.ceil(33_390 / 15.1)).toBe(2_212);
    expect(e.defi(NOVA).solution).toEqual({ quantite: 2_220 });
  });

  it("le cas du fournisseur : des composants à 23,76 €, et le prix qui garde le taux de marque, 61,73 €", () => {
    expect(attendus(LE_FOURNISSEUR_AUGMENTE, "le-nouveau-prix")[0]).toBe(c((39.76 * 59) / 38));
  });
});

describe("créer des richesses et les mesurer", () => {
  const n = CHARGES_FIXES_DES_ENSEIGNES.nova;
  // Les ventes de chaque enseigne sont celles du modèle d'attractivité (marche-a-trois.test.ts les refait) :
  // ce sont les données de départ ; tout le reste se refait à la main.
  const enseignes = richesseDuMarche().enseignes;
  const [nova, soundbox, auris] = enseignes as [(typeof enseignes)[number], (typeof enseignes)[number], (typeof enseignes)[number]];
  const va = {
    nova: nova.ventes * (59 - 38) - 4 * 4_000 - 236_400,
    soundbox: soundbox.ventes * (51 - 28) - 4 * 16_000 - 200_000,
    auris: auris.ventes * (79 - 52) - 4 * (16_000 + 8_000 + 12_000) - 35_000,
  };

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CREER_DES_RICHESSES);
  });

  it("ce que paient les charges fixes de NOVA : janvier douze fois ; celles des concurrents font leur total de la fiche", () => {
    expect(n).toEqual({ personnel: 12 * 10_650, loyerEtFrais: 12 * 19_700, amortissement: 12 * 833 });
    const total = (k: keyof typeof CHARGES_FIXES_DES_ENSEIGNES) => Object.values(CHARGES_FIXES_DES_ENSEIGNES[k]).reduce((t, x) => t + x, 0);
    expect([total("soundbox"), total("auris")]).toEqual([640_000, 135_000]);
  });

  it("la valeur ajoutée de chaque enseigne, à la main : production moins achats, budgets, loyer et frais", () => {
    expect([nova.valeurAjoutee, soundbox.valeurAjoutee, auris.valeurAjoutee]).toEqual([va.nova, va.soundbox, va.auris]);
    expect(attendus(CREER_DES_RICHESSES, "valeur-ajoutee")).toEqual([nova.ventes * 38 + 16_000 + 236_400, va.nova]);
    expect(attendus(CREER_DES_RICHESSES, "valeur-du-marche")).toEqual([va.soundbox, va.auris, va.nova + va.soundbox + va.auris]);
    expect(juste(CREER_DES_RICHESSES, "qui-cree-le-plus")).toEqual(["SoundBox"]);
  });

  it("le partage : l'impôt à 25 % du résultat, le profit, les salaires du marché", () => {
    const resultat = va.nova - 127_800 - 9_996;
    const marche = va.nova + va.soundbox + va.auris;
    expect(attendus(CREER_DES_RICHESSES, "partage")).toEqual([va.nova - 127_800 - c(resultat * 0.25), 127_800 + 320_000 + 90_000, Math.round((537_800 / marche) * 1_000) / 10]);
    expect(juste(CREER_DES_RICHESSES, "richesse-et-benefice")).toHaveLength(1);
  });

  it("le curseur : 18 105 enceintes pour que la valeur ajoutée paie 127 800 € de salaires", () => {
    gardeDuCurseur(CREER_DES_RICHESSES, "la-richesse-qui-paie-les-salaires", Math.ceil((127_800 + 16_000 + 236_400) / 21));
  });

  it("le laboratoire : l'offre soignée (69 €, 5 € de plus par enceinte, 10 000 € de budgets) crée le plus de valeur ajoutée", () => {
    const e = gardeDuLaboratoire(CREER_DES_RICHESSES, "le-laboratoire-de-la-richesse");
    expect(e.defi(NOVA).solution).toEqual({ offre: 2 });
    const soignee = richesseDuMarche(undefined, "differenciation").nova;
    expect(soignee.valeurAjoutee).toBe(soignee.ventes * (69 - 43) - 4 * (8_000 + 2_000) - 236_400);
  });

  it("le cas du marché qui grandit : 10 % d'enceintes en plus, et la richesse grandit plus vite que la production", () => {
    expect(MARCHE_DE_L_ANNEE_SUIVANTE).toBe(Math.round(FICHE_DU_MARCHE.marche.parTrimestre * 1.1));
    const a = attendus(LE_MARCHE_A_T_IL_GRANDI, "valeur-de-chaque-annee");
    expect(a[0]).toBe(va.nova + va.soundbox + va.auris);
    const [production, richesse] = attendus(LE_MARCHE_A_T_IL_GRANDI, "la-croissance");
    expect(richesse).toBe(Math.round((a[1]! / a[0]! - 1) * 1_000) / 10);
    expect(richesse!).toBeGreaterThan(production!);
    expect(juste(LE_MARCHE_A_T_IL_GRANDI, "reponse")).toEqual(["Oui, la richesse créée augmentera"]);
  });
});

describe("les acteurs de l'organisation et le partage de la valeur", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LES_ACTEURS_ET_LA_VALEUR);
    expect(INDICE_DE_LA_HAUSSE).toBe(1 + HAUSSE_DEMANDEE);
  });

  it("l'exercice : 9,2 % aux salariés, 1,5 % à l'État, 5,7 % aux associés ; la hausse de 5 % payée à 75 % par les associés", () => {
    expect(attendus(LES_ACTEURS_ET_LA_VALEUR, "parts")).toEqual([
      Math.round((127_800 / 1_390_276) * 1_000) / 10,
      Math.round((20_742 / 1_390_276) * 1_000) / 10,
      Math.round((79_225.96 / 1_390_276) * 1_000) / 10,
    ]);
    // L'impôt : 15 % jusqu'à 42 500 €, 25 % au-delà, à l'euro.
    const impot = (rai: number) => Math.round(42_500 * 0.15 + (rai - 42_500) * 0.25);
    const rai = 99_967.96;
    expect(impot(rai)).toBe(20_742);
    const apres = c(rai - 127_800 * 0.05);
    expect(attendus(LES_ACTEURS_ET_LA_VALEUR, "hausse")).toEqual([127_800 * 0.05, impot(apres) - 20_742, c(apres - impot(apres) - 79_225.96), 75]);
  });

  it("le curseur : 9 % de hausse laissent 70 599,96 € aux associés ; 10 % n'en laissent que 69 640,96 €", () => {
    gardeDuCurseur(LES_ACTEURS_ET_LA_VALEUR, "la-hausse-acceptable", 9);
    const impot = (rai: number) => Math.round(42_500 * 0.15 + (rai - 42_500) * 0.25);
    const net = (h: number) => c(99_967.96 - 127_800 * h - impot(99_967.96 - 127_800 * h));
    expect([net(0.09), net(0.1)]).toEqual([70_599.96, 69_640.96]);
    expect(RESULTAT_VOULU_PAR_LES_ASSOCIES).toBe(70_000);
  });

  it("le laboratoire : 59,30 €, le premier prix aux dix centimes qui rend les 6 390 € de la hausse sur 23 564 enceintes", () => {
    const e = gardeDuLaboratoire(LES_ACTEURS_ET_LA_VALEUR, "le-laboratoire-du-prix");
    expect(Math.ceil((6_390 / 23_564) * 10) / 10).toBe(0.3);
    expect(e.defi(NOVA).solution).toEqual({ prix: 59.3 });
  });

  it("le cas des clients : 5 % de prix en moins, 5 % d'enceintes en plus ; les associés paient", () => {
    const enceintes = Math.round(23_564 * 1.05);
    const ventes = c(c(59 * 0.95) * enceintes);
    const a = attendus(LES_CLIENTS_DEMANDENT_UNE_BAISSE, "ecarts");
    expect(a.slice(0, 2)).toEqual([c(ventes - 1_390_276), (enceintes - 23_564) * 38]);
    expect(juste(LES_CLIENTS_DEMANDENT_UNE_BAISSE, "reponse")).toEqual(["Les associés la paieraient surtout, l'État pour une part"]);
  });
});
