import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct as enPoints, qte as entier } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_PLATEAU, plateauDuCabinet } from "../../chapitres/le-plateau-de-teleacteurs";
import {
  CRENEAUX_D_UN_TELEACTEUR,
  HAUSSE_DE_LA_RENTREE,
  MINUTES_D_UN_CRENEAU,
  OCCUPATION_CIBLE,
  OCCUPATION_PROPOSEE_A_LA_RENTREE,
  appelsDeLaRentree,
  heuresDuMoisDUnCreneau,
  ligneClients,
  prospectionDuMois,
  tauxDeRendezVousDeN,
} from "../../monde/plateau-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PLATEAU DE TÉLÉACTEURS » : LA LIGNE DE LA RENTRÉE (BTS NDRC, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les chiffres sont ceux du plateau d'ATLAS CONSEIL (fiche
 * monde/plateau-d-atlas.ts), lus par `plateauDuCabinet`, le modèle du chapitre.
 *
 * En septembre, la ligne clients reçoit 25 % d'appels de plus à chaque créneau (40, 55, 35 et 20). À
 * 80 % d'occupation, elle prend les 12 créneaux du plateau : plus aucune prospection. Le directeur
 * propose de dimensionner la ligne à 90 % ; le superviseur demande un cinquième téléacteur. L'élève
 * refait seul le chemin du chapitre : l'effectif créneau par créneau aux deux occupations, la
 * prospection qui reste, ce que vaut un rendez-vous pris, au curseur les rendez-vous qui paient un
 * téléacteur de plus, puis la réponse.
 *
 * LE JUGEMENT : à 90 %, la ligne rend 1 créneau à la prospection (3 rendez-vous par mois) et use
 * l'équipe ; le cinquième téléacteur en rend 3 (9 rendez-vous), qui valent 7 875 € de marge la
 * première année pour 2 880 € de coût. Il se paie dès 4 rendez-vous.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les effectifs et les créneaux sont des quantités : le corrigé
 * écrit le quotient à deux décimales, puis l'arrondit à l'unité au-dessus, et dit pourquoi ; les
 * rendez-vous attendus (une espérance, non arrondie) sont une grandeur, au centième, à un centième
 * près (à cinq centièmes, avant), et la marge part d'eux et du taux d'honoration à deux décimales.
 */

const qte = nombreAuCentieme;
/** Une part (0,725) écrite en pourcentage, à deux décimales (72,50 %). */
const pct = (x: number) => enPoints(x * 100);
/** Un effectif : le quotient à deux décimales, puis à l'unité au-dessus quand il tombe entre deux entiers. */
const effectifEcrit = (exact: number, necessaire: number) =>
  Number.isInteger(auCentime(exact)) ? `${qte(auCentime(exact))} téléacteurs` : `${qte(auCentime(exact))}, soit ${entier(necessaire)} téléacteurs à l'unité au-dessus : en dessous, des appels sont perdus`;

/** Les bornes du curseur des rendez-vous du cinquième téléacteur. */
export const RENDEZ_VOUS_DU_CURSEUR_DU_CAS = { min: 0, max: 10 } as const;

/** La rentrée du plateau : la ligne aux deux occupations, la prospection qui reste, le cinquième téléacteur. */
export function rentreeDuPlateau(c: Pick<Cas, "code">) {
  const x = plateauDuCabinet(c);
  const appels = appelsDeLaRentree();
  const a80 = ligneClients({ appelsRecus: appels });
  const a90 = ligneClients({ appelsRecus: appels, occupation: OCCUPATION_PROPOSEE_A_LA_RENTREE });
  const teleacteurs = x.tdb.teleacteurs.length;
  const creneauxDuPlateau = teleacteurs * CRENEAUX_D_UN_TELEACTEUR;
  const prospection80 = prospectionDuMois({ creneauxDeLigne: a80.creneauxNecessaires });
  const prospection90 = prospectionDuMois({ creneauxDeLigne: a90.creneauxNecessaires });
  const cinquieme = prospectionDuMois({ teleacteurs: teleacteurs + 1, creneauxDeLigne: a80.creneauxNecessaires });
  // Ce que vaut un rendez-vous pris : la part qui est honorée × ce que vaut un rendez-vous tenu.
  // Chaque ligne de la copie : le taux d'honoration à deux décimales, les rendez-vous au centième.
  const valeurDUnRendezVousPris = auCentime((auCentime(x.tdb.tauxDHonoration * 100) / 100) * x.valeurDUnRendezVousHonore);
  const valeurDuCinquieme = auCentime(auCentime(cinquieme.rendezVous) * valeurDUnRendezVousPris);
  return {
    x,
    appels,
    a80,
    a90,
    teleacteurs,
    creneauxDuPlateau,
    prospection80,
    prospection90,
    cinquieme,
    valeurDUnRendezVousPris,
    valeurDuCinquieme,
    gainDuCinquieme: auCentime(valeurDuCinquieme - x.cout.parMois),
    /** Les rendez-vous pris par mois qui paient un téléacteur de plus. */
    rendezVousQuiPaient: Math.ceil(x.cout.parMois / valeurDUnRendezVousPris - 1e-9),
  };
}

export const LA_LIGNE_DE_LA_RENTREE: Situation = {
  code: "la-ligne-de-la-rentree",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["le-plateau-de-teleacteurs"],
  commanditaire: "Le directeur du cabinet",
  titre: "La ligne de la rentrée",
  accroche:
    "En septembre, la ligne clients reçoit un quart d'appels de plus, et la prospection n'a plus un créneau. Pousser l'occupation de la ligne, ou prendre un téléacteur de plus ?",
  objectifs: [
    "Dimensionner la ligne créneau par créneau, à deux taux d'occupation",
    "Calculer les créneaux et les rendez-vous que la prospection garde",
    "Chiffrer ce que vaut un rendez-vous pris, et ce que rapporte un téléacteur de plus",
    "Retrouver à rebours les rendez-vous qui paient un poste, et rédiger une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PLATEAU,
    pourquoi: "ce cas suit le plateau de téléacteurs d'un cabinet qui vend ses journées à des entreprises : il se joue chez ATLAS CONSEIL, le cabinet du chapitre, sur le mois type figé par la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur",
      texte: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          `« À la rentrée, les participants appellent un quart de plus. Je ne veux pas perdre un appel, et je ne veux pas arrêter la prospection. Je propose de dimensionner la ligne à ${pct(OCCUPATION_PROPOSEE_A_LA_RENTREE)} d'occupation au lieu de ${pct(OCCUPATION_CIBLE)}, plutôt que de prendre un ${qte(r.teleacteurs + 1)}e téléacteur comme le demande le superviseur. Dites-moi ce que chaque solution laisse à la prospection, et ce qu'elle vaut. »`,
          "Pas de cours cette fois : vous avez les appels de la rentrée, la DMT, le coût d'un téléacteur et la valeur d'un rendez-vous ; la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = rentreeDuPlateau(c);
        const x = r.x;
        return {
          titre: `La ligne et le plateau à la rentrée · ${x.f.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            ...r.a80.creneaux.map((k) => ({ libelle: `Appels reçus de ${k.libelle}`, valeurs: [qte(k.recus)] })),
            { libelle: "Durée moyenne de traitement", valeurs: [`${qte(r.a80.dmt)} minutes`] },
            { libelle: "Durée d'un créneau", valeurs: [`${qte(MINUTES_D_UN_CRENEAU)} minutes`] },
            { libelle: "Créneaux d'un téléacteur par jour", valeurs: [qte(CRENEAUX_D_UN_TELEACTEUR)] },
            { libelle: "Téléacteurs du plateau", valeurs: [qte(r.teleacteurs)] },
            { libelle: "Coût d'un téléacteur par mois", valeurs: [eur(x.cout.parMois)] },
            { libelle: "Appels émis par heure de prospection", valeurs: [qte(x.prospection.appelsParHeure)] },
            { libelle: "Contacts argumentés, en part des appels émis", valeurs: [pct(x.prospection.joignabilite)] },
            { libelle: "Rendez-vous pris, en part des contacts argumentés", valeurs: [pct(tauxDeRendezVousDeN())] },
            { libelle: "Heures de prospection d'un créneau tenu chaque jour, par mois", valeurs: [`${qte(heuresDuMoisDUnCreneau())} heures`] },
            { libelle: "Part des rendez-vous pris qui sont honorés", valeurs: [pct(x.tdb.tauxDHonoration)] },
            { libelle: "Marge d'un rendez-vous honoré, la première année", valeurs: [eur(x.valeurDUnRendezVousHonore)] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'effectif de chaque créneau à 80 % puis à 90 %, les créneaux et les rendez-vous que garde la prospection, ce que rapporte un téléacteur de plus, les rendez-vous qui le paient, et votre réponse.",
    },
    {
      id: "a-80-pourcent",
      type: "montants",
      titre: "La ligne de la rentrée, à 80 %",
      notions: ["capacity"],
      question: () =>
        `Hausse de ${pct(HAUSSE_DE_LA_RENTREE)} des appels, à chaque créneau. À ${pct(OCCUPATION_CIBLE)} d'occupation, calculez l'effectif nécessaire de chaque créneau, les créneaux de ligne par jour, puis les créneaux qui restent à la prospection avec le plateau d'aujourd'hui.`,
      champs: (c) => {
        const r = rentreeDuPlateau(c);
        const l = r.a80;
        return [
          ...l.creneaux.map((k) => ({
            libelle: `Effectif de ${k.libelle}, à 80 %`,
            nature: "quantite" as const,
            attendu: k.effectifNecessaire,
            calcul: `${qte(k.recus)} × ${qte(l.dmt)} ÷ ${qte(l.minutesUtiles)} = ${effectifEcrit(k.effectifExact, k.effectifNecessaire)}`,
          })),
          { libelle: "Créneaux de ligne par jour, à 80 %", nature: "quantite", attendu: l.creneauxNecessaires, calcul: `${l.effectifNecessaire.map(qte).join(" + ")} = ${qte(l.creneauxNecessaires)}` },
          { libelle: "Créneaux de prospection, à 80 %", nature: "quantite", attendu: r.prospection80.creneaux, calcul: `${qte(r.teleacteurs)} × ${qte(CRENEAUX_D_UN_TELEACTEUR)} − ${qte(l.creneauxNecessaires)} = ${qte(r.prospection80.creneaux)}` },
        ];
      },
      explication: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          `La ligne prend les ${qte(r.a80.creneauxNecessaires)} créneaux du plateau : il ne reste ${r.prospection80.creneaux === 0 ? "aucun créneau" : `que ${qte(r.prospection80.creneaux)} créneaux`} pour la prospection. Sans rien changer, la rentrée arrête la conquête.`,
        ];
      },
    },
    {
      id: "a-90-pourcent",
      type: "montants",
      titre: "La proposition du directeur, à 90 %",
      notions: ["capacity", "productivity"],
      question: () =>
        `Refaites la ligne à ${pct(OCCUPATION_PROPOSEE_A_LA_RENTREE)} d'occupation : les créneaux de ligne par jour, les créneaux qui restent à la prospection, puis les rendez-vous qu'elle prendrait dans le mois.`,
      champs: (c) => {
        const r = rentreeDuPlateau(c);
        const l = r.a90;
        const p = r.prospection90;
        return [
          { libelle: "Créneaux de ligne par jour, à 90 %", nature: "quantite", attendu: l.creneauxNecessaires, calcul: `${l.creneaux.map((k) => `${qte(k.recus)} × ${qte(l.dmt)} ÷ ${qte(l.minutesUtiles)} = ${qte(auCentime(k.effectifExact))}`).join(" ; ")}, soit, à l'unité au-dessus, ${l.effectifNecessaire.map(qte).join(" + ")} = ${qte(l.creneauxNecessaires)}` },
          { libelle: "Créneaux de prospection, à 90 %", nature: "quantite", attendu: p.creneaux, calcul: `${qte(r.creneauxDuPlateau)} − ${qte(l.creneauxNecessaires)} = ${qte(p.creneaux)}` },
          {
            libelle: "Rendez-vous pris dans le mois, à 90 %",
            nature: "grandeur",
            attendu: auCentime(p.rendezVous),
            calcul: `${qte(p.creneaux)} × ${qte(heuresDuMoisDUnCreneau())} heures × ${qte(p.appelsParHeure)} × ${pct(p.joignabilite)} × ${pct(tauxDeRendezVousDeN())} = ${qte(auCentime(p.rendezVous))}`,
          },
        ];
      },
      explication: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          `À ${pct(OCCUPATION_PROPOSEE_A_LA_RENTREE)}, la ligne rend ${qte(r.prospection90.creneaux)} créneau à la prospection : ${qte(auCentime(r.prospection90.rendezVous))} rendez-vous par mois, au lieu de ${qte(r.x.prospection.rendezVous)} avant la rentrée. Le gain est mince, et il se paie : des téléacteurs occupés ${pct(OCCUPATION_PROPOSEE_A_LA_RENTREE)} du temps font attendre les clients aux pics de chaque créneau, et s'usent.`,
        ];
      },
    },
    {
      id: "le-cinquieme",
      type: "montants",
      titre: "Un téléacteur de plus",
      notions: ["capacity", "customer_acquisition_cost"],
      question: (c) => {
        const r = rentreeDuPlateau(c);
        return `Avec un ${qte(r.teleacteurs + 1)}e téléacteur et la ligne à ${pct(OCCUPATION_CIBLE)}, calculez les créneaux de prospection par jour et les rendez-vous pris dans le mois. Calculez ensuite leur marge de la première année (la part honorée × la marge d'un rendez-vous honoré), puis ce que rapporte le téléacteur de plus, son coût déduit.`;
      },
      champs: (c) => {
        const r = rentreeDuPlateau(c);
        const p = r.cinquieme;
        const margeSansArrondi = auCentime(p.rendezVous) * (auCentime(r.x.tdb.tauxDHonoration * 100) / 100) * r.x.valeurDUnRendezVousHonore;
        return [
          { libelle: "Créneaux de prospection, avec un téléacteur de plus", nature: "quantite", attendu: p.creneaux, calcul: `${qte(r.teleacteurs + 1)} × ${qte(CRENEAUX_D_UN_TELEACTEUR)} − ${qte(r.a80.creneauxNecessaires)} = ${qte(p.creneaux)}` },
          { libelle: "Rendez-vous pris dans le mois, avec un téléacteur de plus", nature: "grandeur", attendu: auCentime(p.rendezVous), calcul: `${qte(p.heures)} heures × ${qte(p.appelsParHeure)} × ${pct(p.joignabilite)} × ${pct(tauxDeRendezVousDeN())} = ${qte(auCentime(p.rendezVous))}` },
          {
            libelle: "Marge de ces rendez-vous, la première année",
            // L'autre chemin : la marge d'un rendez-vous pris gardée avec tous ses chiffres, sur le taux
            // d'honoration écrit, l'arrondi à la fin.
            ...deuxChemins(r.valeurDuCinquieme, margeSansArrondi),
            calcul: `${qte(auCentime(p.rendezVous))} × ${pct(r.x.tdb.tauxDHonoration)} × ${eur(r.x.valeurDUnRendezVousHonore)} = ${qte(auCentime(p.rendezVous))} × ${eur(r.valeurDUnRendezVousPris)} = ${eur(r.valeurDuCinquieme)}`,
          },
          { libelle: "Ce que rapporte le téléacteur de plus", ...deuxChemins(r.gainDuCinquieme, margeSansArrondi - r.x.cout.parMois), calcul: `${eur(r.valeurDuCinquieme)} − ${eur(r.x.cout.parMois)} = ${eur(r.gainDuCinquieme)}` },
        ];
      },
      explication: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          `Le téléacteur de plus rend ${qte(r.cinquieme.creneaux)} créneaux à la prospection, et ${qte(auCentime(r.cinquieme.rendezVous))} rendez-vous par mois, qui tiennent dans l'agenda du commercial. Ils valent ${eur(r.valeurDuCinquieme)} de marge la première année, pour ${eur(r.x.cout.parMois)} de coût : la ligne reste à ${pct(OCCUPATION_CIBLE)}, et la conquête continue.`,
        ];
      },
    },
    {
      id: "les-rendez-vous-qui-paient",
      type: "curseur",
      titre: "Les rendez-vous qui paient un poste",
      notions: ["capacity", "customer_acquisition_cost"],
      question: (c) => {
        const r = rentreeDuPlateau(c);
        return `Un téléacteur de plus coûte ${eur(r.x.cout.parMois)} par mois ; un rendez-vous pris vaut ${eur(r.valeurDUnRendezVousPris)} de marge la première année. Faites varier les rendez-vous qu'il prend dans le mois, de ${qte(RENDEZ_VOUS_DU_CURSEUR_DU_CAS.min)} à ${qte(RENDEZ_VOUS_DU_CURSEUR_DU_CAS.max)}. Placez le curseur sur le plus petit nombre de rendez-vous qui paie son coût, puis validez.`;
      },
      grandeur: () => ({ libelle: "Rendez-vous pris par mois", unite: "rendez-vous" }),
      cible: (c) => ({ attendu: rentreeDuPlateau(c).rendezVousQuiPaient, min: RENDEZ_VOUS_DU_CURSEUR_DU_CAS.min, max: RENDEZ_VOUS_DU_CURSEUR_DU_CAS.max }),
      zones: ["Le poste se paie", "Le poste coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "À ce nombre, les rendez-vous valent moins que le téléacteur ne coûte.",
        dessus: "Moins de rendez-vous suffiraient déjà : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les rendez-vous",
      lecture: (c, n) => {
        const r = rentreeDuPlateau(c);
        const valeur = auCentime(n * r.valeurDUnRendezVousPris);
        return [
          { libelle: "Marge des rendez-vous, la première année", montant: valeur },
          { libelle: "Coût du téléacteur de plus", montant: r.x.cout.parMois },
          { libelle: "Ce que rapporte le téléacteur de plus", montant: auCentime(valeur - r.x.cout.parMois), fort: true },
        ];
      },
      droites: (c) => {
        const r = rentreeDuPlateau(c);
        return {
          produit: (n) => n * r.valeurDUnRendezVousPris,
          cout: () => r.x.cout.parMois,
          libelles: ["Marge des rendez-vous, la première année", "Coût du téléacteur de plus"],
        };
      },
      explication: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          `Dès ${qte(r.rendezVousQuiPaient)} rendez-vous par mois, le téléacteur de plus se paie, sur la seule première année des comptes gagnés. Il en prendrait ${qte(auCentime(r.cinquieme.rendezVous))} : plus de deux fois le seuil.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Quelle phrase envoyez-vous au directeur ?",
      options: (c) => {
        const r = rentreeDuPlateau(c);
        return [
          {
            texte: `Un téléacteur de plus : il rapporte ${eur(r.gainDuCinquieme)} par mois`,
            juste: true,
            retour: `Oui : avec la ligne à ${pct(OCCUPATION_CIBLE)}, il rend ${qte(r.cinquieme.creneaux)} créneaux à la prospection, ${qte(auCentime(r.cinquieme.rendezVous))} rendez-vous qui valent ${eur(r.valeurDuCinquieme)} pour ${eur(r.x.cout.parMois)} de coût. Il se paie dès ${qte(r.rendezVousQuiPaient)} rendez-vous.`,
          },
          {
            texte: `La ligne à ${pct(OCCUPATION_PROPOSEE_A_LA_RENTREE)} : ${qte(auCentime(r.prospection90.rendezVous))} rendez-vous sans embaucher personne`,
            juste: false,
            retour: `Non : ${qte(auCentime(r.prospection90.rendezVous))} rendez-vous par mois, au lieu de ${qte(auCentime(r.cinquieme.rendezVous))} avec un téléacteur de plus, et une ligne où les clients attendent aux pics, servie par une équipe qui s'use.`,
          },
          {
            texte: "Arrêter la prospection le temps de la rentrée",
            juste: false,
            retour: `Non : un mois sans prospection, ce sont ${qte(r.x.prospection.rendezVous)} rendez-vous de moins, ${eur(auCentime(r.x.prospection.rendezVous * r.valeurDUnRendezVousPris))} de marge perdue sur la première année, bien plus que le coût d'un téléacteur.`,
          },
          {
            texte: `Rien : ${qte(r.teleacteurs)} téléacteurs suffisent à la ligne`,
            juste: false,
            retour: `Non : ils suffisent à la ligne, à ${qte(r.a80.creneauxNecessaires)} créneaux, mais il ne reste plus rien pour la prospection. La ligne tient, la conquête s'arrête.`,
          },
        ];
      },
    },
  ],
};
