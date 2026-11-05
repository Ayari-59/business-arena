import { describe, expect, it } from "vitest";
import { LE_PLATEAU_DE_TELEACTEURS, plateauDuCabinet } from "../../src/config/cours/chapitres/le-plateau-de-teleacteurs";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import {
  COUT_D_UN_TELEACTEUR,
  CRENEAUX_DE_LA_LIGNE,
  DMT_DE_LA_LIGNE,
  OCCUPATION_CIBLE,
  PRIME_DU_MOIS,
  RAPPEL_PROGRAMME,
  TELEACTEURS,
} from "../../src/config/cours/monde/plateau-d-atlas";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LA_LIGNE_DE_LA_RENTREE, rentreeDuPlateau } from "../../src/config/cours/situations/par-chapitre/la-ligne-de-la-rentree";
import type { EtapeSimulation } from "../../src/config/cours/types";
import { attendus, cas, casDedie, centime, curseur, juste, laboratoire, somme, verifierLesTextes } from "./gardes-d-atlas";

/**
 * LE PLATEAU DE TÉLÉACTEURS, AU CABINET DU MONDE DU COURS, ET SON CAS : LA LIGNE DE LA RENTRÉE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche du plateau (monde/plateau-d-atlas.ts) et
 * sur celle d'ATLAS CONSEIL (le taux de rendez-vous de la prospection de N, la marge d'un compte), sans
 * le modèle : la charge, la capacité d'un téléacteur, le décroché, l'occupation, l'effectif, l'entonnoir
 * des appels, le coût d'un rendez-vous, le tableau de bord, les primes, les deux laboratoires, le curseur,
 * la variante et le cas. Puis les gardes de texte de l'étalon.
 */

const ch = LE_PLATEAU_DE_TELEACTEURS;
const f = ATLAS_CONSEIL;
const recus = CRENEAUX_DE_LA_LIGNE.map((k) => k.appelsRecus);
const utiles = 120 * OCCUPATION_CIBLE;
const parTeleacteur = Math.floor(utiles / DMT_DE_LA_LIGNE);
const decroches = (presents: number[], appels = recus) => appels.map((r, i) => Math.min(r, presents[i]! * parTeleacteur));
const effectif = (appels: number[], dmt = DMT_DE_LA_LIGNE, occ = OCCUPATION_CIBLE) => appels.map((r) => Math.ceil((r * dmt) / (120 * occ) - 1e-9));
const prospection = f.canaux.find((k) => k.code === "prospection")!;
const tauxDeRdv = prospection.rendezVous / prospection.contacts;
const coutHoraire = (COUT_D_UN_TELEACTEUR.salaireCharge + COUT_D_UN_TELEACTEUR.posteEtLogiciel) / (3 * 2 * 20);
/** Les rendez-vous d'un mois : créneaux de prospection par jour × 40 heures × appels par heure × joignabilité × 5 %. */
const rdv = (creneaux: number, appelsParHeure = 10, joignabilite = 0.15) => creneaux * 40 * appelsParHeure * joignabilite * tauxDeRdv;

describe("le plateau de téléacteurs, chez ATLAS CONSEIL", () => {
  it("se joue chez ATLAS CONSEIL seule, au palier 4 du BTS NDRC (blocs 2 et 1), et son cas aussi", () => {
    expect(CHAPITRES).toContain(ch);
    expect(CHAPITRES.filter((x) => x.parcours === "ndrc").at(-1)).toBe(ch);
    expect(SITUATIONS).toContain(LA_LIGNE_DE_LA_RENTREE);
    expect(PROGRAMME.ndrc[4]!.at(-1)).toBe(ch.titre);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 2 · Relation client à distance et digitalisation", "BTS NDRC Bloc 1 · Relation client et négociation-vente"]);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ch.prerequis).toEqual(["cout-d-acquisition", "tableau-de-bord-commercial"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("la fiche du plateau refait sa journée type et son mois", () => {
    expect(recus).toEqual([32, 44, 28, 16]);
    expect(TELEACTEURS.map((t) => t.prenom)).toEqual(["Léa", "Samir", "Inès", "Bruno"]);
    // 108 décrochés par jour, 20 jours : 2 160 dans le mois, en 12 960 minutes, 6 minutes l'un.
    expect(somme(TELEACTEURS.map((t) => t.appelsDecroches))).toBe(somme(decroches([2, 2, 2, 2])) * 20);
    expect(somme(TELEACTEURS.map((t) => t.minutesDeTraitement))).toBe(2_160 * DMT_DE_LA_LIGNE);
    expect([somme(TELEACTEURS.map((t) => t.appelsEmis)), somme(TELEACTEURS.map((t) => t.contactsArgumentes)), somme(TELEACTEURS.map((t) => t.rendezVousPris)), somme(TELEACTEURS.map((t) => t.rendezVousHonores))]).toEqual([1_600, 240, 12, 10]);
    expect([tauxDeRdv, 240 * tauxDeRdv, coutHoraire]).toEqual([0.05, 12, 24]);
  });

  it("les étapes guidées : la charge, la capacité, le décroché et l'occupation", () => {
    expect(attendus(ch, "la-charge-du-creneau")).toEqual({
      "Charge du créneau de 11 h à 13 h (minutes)": 44 * 6,
      "Appels qu'un téléacteur traite dans un créneau": 16,
      "Appels décrochés de 11 h à 13 h": 32,
      "Taux de décroché de la journée (%)": centime((somme(decroches([2, 2, 2, 2])) / 120) * 100),
    });
    expect(somme(decroches([2, 2, 2, 2]))).toBe(108);
    expect(attendus(ch, "l-occupation")).toEqual({
      "Taux d'occupation de 11 h à 13 h (%)": (32 * 6 * 100) / 240,
      "Taux d'occupation de 16 h à 18 h (%)": (16 * 6 * 100) / 240,
      "Taux d'occupation de la journée (%)": (108 * 6 * 100) / 960,
    });
    expect([80, 40, 67.5]).toEqual(Object.values(attendus(ch, "l-occupation")));
  });

  it("le planning : le pari, le laboratoire (2, 3, 2, 1 sur les mêmes 8 créneaux), puis l'effectif par le calcul", () => {
    expect(juste(ch, "predire-le-planning")).toBe("Oui, en changeant d'heure un téléacteur");
    const l = laboratoire(ch, "le-laboratoire-du-planning");
    expect(l.depart).toEqual({ c0: 2, c1: 2, c2: 2, c3: 2 });
    expect(l.solution).toEqual({ c0: 2, c1: 3, c2: 2, c3: 1 });
    expect(l.reussi).toEqual([false, true]);
    expect(decroches([2, 3, 2, 1])).toEqual(recus);
    expect(l.aLaSolution["Taux de décroché de la journée"]).toBe(100);
    expect(l.auDepart["Taux de décroché de la journée"]).toBe(90);
    expect(l.aLaSolution["Créneaux laissés à la prospection"]).toBe(4);
    // Un autre planning à 8 créneaux perd des appels ; à 9, il en prend un à la prospection.
    expect(l.d.atteint({ c0: 3, c1: 3, c2: 2, c3: 0 })).toBe(false);
    expect(l.d.atteint({ c0: 2, c1: 3, c2: 2, c3: 2 })).toBe(false);
    expect(effectif(recus)).toEqual([2, 3, 2, 1]);
    expect(attendus(ch, "l-effectif-necessaire")).toEqual({
      "Effectif exact de 11 h à 13 h": 2.75,
      "Effectif nécessaire de 9 h à 11 h": 2,
      "Effectif nécessaire de 11 h à 13 h": 3,
      "Effectif nécessaire de 14 h à 16 h": 2,
      "Effectif nécessaire de 16 h à 18 h": 1,
      "Créneaux de ligne par jour": 8,
    });
    // La ligne replanifiée : 8 créneaux × 40 heures × 24 € pour 2 400 appels, 3,20 € l'appel.
    expect(centime((8 * 40 * coutHoraire) / 2_400)).toBe(3.2);
    expect(plateauDuCabinet(cas).coutDUnAppelDecroche).toBe(3.2);
  });

  it("la prospection : 10 appels par heure, 15 %, 24 € l'heure, 320 € le rendez-vous pris, 384 € l'honoré", () => {
    expect(attendus(ch, "la-prospection")).toEqual({
      "Appels émis par heure": 1_600 / 160,
      "Joignabilité (%)": (240 / 1_600) * 100,
      "Coût d'une heure de téléacteur": coutHoraire,
      "Coût d'un rendez-vous pris": (160 * coutHoraire) / 12,
      "Coût d'un rendez-vous honoré": (160 * coutHoraire) / 10,
    });
    expect([(160 * 24) / 12, (160 * 24) / 10]).toEqual([320, 384]);
    // À 300 € le rendez-vous : 160 × q × 15 % × 5 % × 300 ≥ 3 840, soit q ≥ 10,67 : 11 appels par heure.
    expect(juste(ch, "predire-les-appels")).toBe("11 appels par heure");
    const justifie = (q: number) => 160 * q * 0.15 * tauxDeRdv * 300;
    expect(curseur(ch, "les-appels-au-curseur")).toEqual({
      attendu: 11,
      bornes: [6, 16],
      droites: [justifie(6), 3_840, justifie(16), 3_840].map(centime),
      lecture: {
        "Budget que justifient ses rendez-vous": centime(justifie(11)),
        "Coût de la prospection du mois": 3_840,
        "Coût d'un rendez-vous pris": centime(3_840 / (160 * 11 * 0.15 * tauxDeRdv)),
        "Budget justifié moins coût de la prospection": centime(justifie(11) - 3_840),
      },
    });
    expect([centime(justifie(11)), centime(justifie(10))]).toEqual([3_960, 3_600]);
    // En N, la prospection d'Hugo : 54 000 € pour 60 rendez-vous, 900 € l'un.
    expect(prospection.cout / prospection.rendezVous).toBe(900);
    expect(juste(ch, "face-a-n")).toBe("Le téléphone revient moins cher aux téléacteurs");
  });

  it("le tableau de bord des téléacteurs et la prime : les honorés avec la qualité, 2 primes au lieu de 3", () => {
    const [lea, samir, ines, bruno] = TELEACTEURS;
    expect(attendus(ch, "le-tableau-des-teleacteurs")).toEqual({
      "DMT de Léa (minutes)": lea!.minutesDeTraitement / lea!.appelsDecroches,
      "Taux d'occupation de Bruno (%)": centime((bruno!.minutesDeTraitement / (80 * 60)) * 100),
      "Taux d'honoration de Léa (%)": (lea!.rendezVousHonores / lea!.rendezVousPris) * 100,
      "Taux d'honoration du plateau (%)": Math.round((10 / 12) * 1000) / 10,
    });
    expect(Object.values(attendus(ch, "le-tableau-des-teleacteurs"))).toEqual([5, 57.5, 50, 83.3]);
    const surPris = TELEACTEURS.filter((t) => t.rendezVousPris >= PRIME_DU_MOIS.rendezVous).map((t) => t.prenom);
    const surHonores = TELEACTEURS.filter((t) => t.rendezVousHonores >= PRIME_DU_MOIS.rendezVous && t.noteDeQualite >= PRIME_DU_MOIS.noteMinimale).map((t) => t.prenom);
    expect(surPris).toEqual([lea!.prenom, samir!.prenom, ines!.prenom]);
    expect(surHonores).toEqual([samir!.prenom, ines!.prenom]);
    expect(juste(ch, "la-prime")).toBe("Les honorés, avec la note de qualité");
    // Un rendez-vous tenu : 3 contrats pour 60 rendez-vous × 21 000 € de marge d'un compte, 1 050 €.
    const marge = (somme(f.comptes.map((c) => c.chiffreDAffaires)) - somme(f.comptes.map((c) => c.frais)) - somme(f.comptes.map((c) => c.journees)) * 220) / f.comptes.length;
    expect([marge, (prospection.contrats / prospection.rendezVous) * marge]).toEqual([21_000, 1_050]);
    expect(plateauDuCabinet(cas).valeurDUnRendezVousHonore).toBe(1_050);
  });

  it("le laboratoire du plateau : le rappel programmé, 16 rendez-vous à 252,50 € ; un téléacteur de plus, 21 à 320 €", () => {
    const l = laboratoire(ch, "le-laboratoire-du-plateau");
    expect(l.depart).toEqual({ teleacteurs: 4, appelsParHeure: 10, rappel: 0 });
    expect(l.solution).toEqual({ teleacteurs: 4, appelsParHeure: 10, rappel: 1 });
    expect(l.reussi).toEqual([false, true]);
    const avec = rdv(4, 10, RAPPEL_PROGRAMME.joignabilite);
    const cinq = rdv(7);
    expect([centime(avec), centime((160 * 24 + 200) / avec), centime(cinq), centime((280 * 24) / cinq)]).toEqual([16, 252.5, 21, 320]);
    expect(l.aLaSolution["Rendez-vous pris"]).toBe(16);
    expect(l.aLaSolution["Coût d'un rendez-vous pris"]).toBe(252.5);
    expect(l.auDepart["Coût d'un rendez-vous pris"]).toBe(320);
    // Les autres positions échouent : un téléacteur de plus dépasse l'agenda d'Hugo, plus d'appels sans rappel ne suffisent pas.
    expect(l.d.atteint({ teleacteurs: 5, appelsParHeure: 8, rappel: 0 })).toBe(false);
    expect(l.d.atteint({ teleacteurs: 4, appelsParHeure: 12, rappel: 0 })).toBe(false);
    expect(l.d.atteint({ teleacteurs: 4, appelsParHeure: 11, rappel: 1 })).toBe(false);
    expect(l.d.atteint({ teleacteurs: 4, appelsParHeure: 9, rappel: 1 })).toBe(false);
    const g = (ch.etapes.find((e) => e.id === "le-laboratoire-du-plateau") as EtapeSimulation).graphique!(cas);
    expect(g.levier).toBe("appelsParHeure");
    expect([8, 10, 12].map((q) => g.courbes[0]!.valeur({ teleacteurs: 4, appelsParHeure: q, rappel: 0 }))).toEqual([400, 320, centime(3_840 / 14.4)]);
    expect(juste(ch, "un-teleacteur-de-plus")).toBe("Le rappel programmé : 16 rendez-vous à 252,50 €");
  });

  it("la variante de l'espace en ligne : 7 créneaux de ligne, 3 rendez-vous de plus ; la cible d'occupation", () => {
    expect(effectif(recus, 4)).toEqual([2, 2, 2, 1]);
    expect(attendus(ch, "l-espace-en-ligne")).toEqual({
      "Effectif nécessaire de 11 h à 13 h, à 4 minutes": 2,
      "Créneaux de ligne par jour, à 4 minutes": 7,
      "Rendez-vous de plus dans le mois": rdv(1),
    });
    expect(rdv(1)).toBe(3);
    expect(juste(ch, "la-cible-d-occupation")).toBe("Non : l'attente monte, et la pause est due");
  });

  it("le cas : la ligne de la rentrée prend les 12 créneaux ; à 90 %, 3 rendez-vous ; un 5e téléacteur en rend 9 et rapporte 4 995 €", () => {
    const s = LA_LIGNE_DE_LA_RENTREE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le directeur du cabinet");
    const rentree = recus.map((r) => Math.round(r * 1.25));
    expect(rentree).toEqual([40, 55, 35, 20]);
    expect(attendus(s, "a-80-pourcent")).toEqual({
      "Effectif de 9 h à 11 h, à 80 %": 3,
      "Effectif de 11 h à 13 h, à 80 %": 4,
      "Effectif de 14 h à 16 h, à 80 %": 3,
      "Effectif de 16 h à 18 h, à 80 %": 2,
      "Créneaux de ligne par jour, à 80 %": 12,
      "Créneaux de prospection, à 80 %": 0,
    });
    expect(effectif(rentree)).toEqual([3, 4, 3, 2]);
    expect(effectif(rentree, 6, 0.9)).toEqual([3, 4, 2, 2]);
    expect(attendus(s, "a-90-pourcent")).toEqual({ "Créneaux de ligne par jour, à 90 %": 11, "Créneaux de prospection, à 90 %": 1, "Rendez-vous pris dans le mois, à 90 %": rdv(1) });
    // Un rendez-vous pris vaut 10/12 × 1 050 € = 875 €.
    const valeur = (10 / 12) * 1_050;
    expect(valeur).toBe(875);
    expect(attendus(s, "le-cinquieme")).toEqual({
      "Créneaux de prospection, avec un téléacteur de plus": 3,
      "Rendez-vous pris dans le mois, avec un téléacteur de plus": rdv(3),
      "Marge de ces rendez-vous, la première année": rdv(3) * valeur,
      "Ce que rapporte le téléacteur de plus": rdv(3) * valeur - 2_880,
    });
    expect([rdv(3), rdv(3) * valeur - 2_880]).toEqual([9, 4_995]);
    // À rebours : 2 880 ÷ 875 = 3,29, soit 4 rendez-vous.
    expect(curseur(s, "les-rendez-vous-qui-paient")).toEqual({
      attendu: 4,
      bornes: [0, 10],
      droites: [0, 2_880, 8_750, 2_880],
      lecture: { "Marge des rendez-vous, la première année": 3_500, "Coût du téléacteur de plus": 2_880, "Ce que rapporte le téléacteur de plus": 620 },
    });
    expect(rentreeDuPlateau(cas).rendezVousQuiPaient).toBe(4);
    expect(juste(s, "reponse")).toBe("Un téléacteur de plus : il rapporte 4 995 € par mois");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LA_LIGNE_DE_LA_RENTREE));
});
