import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import {
  MODULE_DE_RESERVATION,
  PRATIQUES_DES_CANAUX,
  canauxDeJanvier,
  margeDUneReservation,
  moisDuModule,
  reservationsQuiPaient,
} from "../monde/parcours-client-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PARCOURS CLIENT, ROPO, CROSS-CANAL, OMNICANAL (Bac STMG, mercatique de terminale,
 * thème 2, question 2.2 : « Le consommateur dicte-t-il les choix de distribution ? »).
 *
 * Une cliente regarde la collection sur le site, puis vient l'essayer en boutique ; une autre essaie en
 * boutique, puis commande ailleurs en ligne. Le chapitre lit ce parcours sur le mois de janvier de
 * MAILLE & CO (le ROPO et son inverse, le showrooming), distingue le multicanal, le cross-canal et
 * l'omnicanal, chiffre un service qui relie les canaux (réserver en ligne, essayer en boutique : le
 * curseur cherche le plus petit nombre de réservations qui paie le module), et dit ce qu'est la
 * distribution collaborative. La réponse à la question du programme : le client circule entre les
 * canaux, la boutique suit son parcours.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/parcours-client-de-la-boutique.ts), chez MAILLE & CO
 * seule : le mois de janvier, les visites du site et les retraits de la fiche ; l'enquête en caisse et
 * le module de réservation sont des hypothèses nommées dans la fiche.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part des passages venus du site et le taux de
 * transformation se donnaient au dixième, ils sont à deux décimales
 * (monde/parcours-client-de-la-boutique.ts) ; le gain du mois attend le centime (à 0,05 € près,
 * avant).
 */

export const ENTREPRISES_DU_PARCOURS = ["boutique"] as const;


function janvier(): TableauDeDonnees {
  const k = canauxDeJanvier();
  return {
    titre: "La boutique et son site, en janvier",
    colonnes: ["Janvier"],
    lignes: [
      { libelle: "Entrées en boutique", valeurs: [qte(k.entrees)] },
      { libelle: "Passages en caisse", valeurs: [qte(k.passages)] },
      { libelle: "Visites du site", valeurs: [qte(k.visites)] },
      { libelle: "Commandes en ligne retirées en boutique", valeurs: [qte(k.retraits)] },
      { libelle: "Clientes venues après avoir regardé le site", valeurs: [qte(k.ropo)] },
    ],
  };
}

export const LE_PARCOURS_CLIENT: Chapitre = {
  code: "le-parcours-client",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 2 · La distribution de l'offre"],
  titre: "Le parcours client : ROPO, cross-canal, omnicanal",
  accroche:
    "Regarder en ligne, essayer en boutique, payer où l'on veut : la cliente passe d'un canal à l'autre. Qui décide du chemin, et ce que rapporte un service qui relie les canaux.",
  objectifs: [
    "Décrire le parcours d'achat d'un client : ROPO et showrooming",
    "Distinguer le multicanal, le cross-canal et l'omnicanal",
    "Chiffrer ce que rapporte un service qui relie les canaux",
    "Dire ce qu'est la distribution collaborative, et qui dicte les choix",
  ],
  libre: false,
  prerequis: ["canaux-de-distribution"],
  ensuite: ["vendre-en-ligne"],
  entreprises: {
    codes: ENTREPRISES_DU_PARCOURS,
    pourquoi: "ce chapitre lit le mois de janvier de MAILLE & CO, en boutique et sur son site.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une boutique et son site",
      notions: ["conversion_rate"],
      tableau: janvier,
      texte: (c) => [
        `${c.entreprise} vend sa maille dans une boutique de centre-ville. Son site présente la collection et prend des commandes à retirer en boutique. Les clientes ne choisissent pas un canal une fois pour toutes : elles passent de l'un à l'autre.`,
        "Le parcours client, c'est le chemin qu'elles suivent, de l'envie à l'achat : s'informer, comparer, essayer, acheter, revenir.",
      ],
      repere: () => "ROPO : s'informer en ligne, acheter en magasin (« research online, purchase offline »). Showrooming : l'inverse, voir en magasin et acheter en ligne.",
    },
    {
      id: "le-ropo",
      objectifs: [0],
      type: "choix",
      titre: "Regarder en ligne, acheter en boutique",
      notions: ["conversion_rate"],
      question: () => "Une cliente repère un cardigan sur le site un dimanche soir, vient l'essayer le mardi et l'achète en caisse. Comment s'appelle ce parcours ?",
      options: () => [
        { texte: "Le ROPO : s'informer en ligne, acheter en magasin", juste: true, retour: "Oui : le site a fait venir la cliente, la boutique a fait la vente. Sans le site, cette vente n'aurait peut-être pas eu lieu, même si elle se compte en caisse." },
        { texte: "Le showrooming : voir en boutique, acheter en ligne", juste: false, retour: "Non : c'est le parcours inverse. Ici, la cliente commence en ligne et finit en boutique." },
        { texte: "Une vente en ligne, comptée par erreur en boutique", juste: false, retour: "Non : la vente est bien faite en boutique. C'est le chemin qui commence en ligne." },
      ],
    },
    {
      id: "le-poids-du-site",
      objectifs: [0],
      type: "montants",
      titre: "Ce que le site fait venir",
      notions: ["conversion_rate"],
      tableau: janvier,
      question: () => "Calculez la part des passages en caisse faits par des clientes venues après avoir regardé le site, puis le taux de transformation du site : les commandes retirées rapportées aux visites, en pourcentage.",
      champs: () => {
        const k = canauxDeJanvier();
        return [
          { libelle: "Part des passages venus du site (%)", attendu: k.partRopo, calcul: `${qte(k.ropo)} ÷ ${qte(k.passages)} × 100 = ${pct(k.partRopo)}` },
          { libelle: "Taux de transformation du site (%)", attendu: k.transformationDuSite, calcul: `${qte(k.retraits)} ÷ ${qte(k.visites)} × 100 = ${pct(k.transformationDuSite)}` },
        ];
      },
      explication: () => {
        const k = canauxDeJanvier();
        return [`Le site ne vend presque rien seul (${pct(k.transformationDuSite)} des visites finissent en commande), mais il prépare ${pct(k.partRopo)} des passages en caisse. Juger le site sur ses seules commandes, ce serait oublier les clientes qu'il envoie en boutique.`];
      },
    },
    {
      id: "trois-facons",
      objectifs: [1],
      type: "tri",
      titre: "Des canaux qui vivent à part, se relaient ou se fondent",
      notions: ["distribution_commission"],
      question: () => "Rangez chaque pratique de la boutique sous la façon dont elle fait vivre ses canaux.",
      categories: [
        { code: "multicanal", libelle: "Multicanal : des canaux à part" },
        { code: "cross-canal", libelle: "Cross-canal : des canaux qui se relaient" },
        { code: "omnicanal", libelle: "Omnicanal : un seul parcours, sans couture" },
      ],
      elements: () => PRATIQUES_DES_CANAUX.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.canal, pourquoi: x.pourquoi })),
      relance: "La cliente peut-elle commencer sur un canal et finir sur l'autre ? Et voit-elle une seule boutique, quel que soit le canal ?",
      explication: () => ["Du multicanal à l'omnicanal, les canaux se rapprochent : d'abord côte à côte, puis relayés, enfin fondus en un seul parcours. C'est la cliente qui circule ; l'enseigne fait en sorte qu'elle ne perde rien en changeant de canal."],
    },
    {
      id: "le-showrooming",
      objectifs: [0],
      type: "choix",
      titre: "Essayer ici, acheter ailleurs",
      notions: ["conversion_rate"],
      question: () => "Des passantes essaient un pull en boutique, puis le commandent moins cher sur un grand site en ligne. Que peut faire la boutique ?",
      options: () => [
        { texte: "Commander pour elle sur son site", juste: true, retour: "Oui : si la taille ou la couleur manque, la vendeuse commande sur le site de la boutique, livré chez la cliente. La vente reste dans l'enseigne, quel que soit le canal." },
        { texte: "Interdire les téléphones dans la boutique", juste: false, retour: "Non : la cliente comparera de toute façon. Mieux vaut lui donner une raison d'acheter ici." },
        { texte: "Fermer le site, qui attire les comparaisons", juste: false, retour: "Non : le site prépare une bonne part des passages en caisse. Le fermer ferait perdre ces clientes, sans empêcher les autres sites d'exister." },
      ],
    },
    {
      id: "la-marge-d-une-reservation",
      objectifs: [2],
      type: "montants",
      titre: "Ce que rapporte une réservation",
      notions: ["conversion_rate", "contribution_margin"],
      question: () => {
        const m = margeDUneReservation();
        const k = MODULE_DE_RESERVATION;
        return `Un prestataire propose un module pour réserver un article sur le site et l'essayer en boutique, loué ${eur(k.loyerParMois)} par mois. Une vente à une passante laisse ${eur(m.margeDUneVente)} de marge ; ${pct(k.tauxDAchat * 100)} des clientes qui réservent achètent à l'essayage. Calculez ce que rapporte en moyenne une réservation, puis ce que rapporteraient ${qte(MODULE_DE_RESERVATION.reservationsDuChapitre)} réservations dans le mois, loyer payé.`;
      },
      champs: () => {
        const m = margeDUneReservation();
        const r = MODULE_DE_RESERVATION.reservationsDuChapitre;
        const k = moisDuModule(r);
        return [
          { libelle: "Marge moyenne d'une réservation", attendu: m.parReservation, calcul: `${eur(m.margeDUneVente)} × ${pct(m.tauxDAchat * 100)} = ${eur(m.parReservation)}` },
          { libelle: `Gain du mois avec ${qte(r)} réservations`, attendu: k.gain, calcul: `${qte(r)} × ${eur(m.parReservation)} − ${eur(k.loyer)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => {
        const m = margeDUneReservation();
        return [`Toutes les réservations ne finissent pas en vente : une réservation vaut ${eur(m.parReservation)} en moyenne, pas ${eur(m.margeDUneVente)}. Le loyer, lui, se paie quoi qu'il arrive.`];
      },
    },
    {
      id: "les-reservations-qui-paient",
      objectifs: [2],
      type: "curseur",
      titre: "Combien de réservations pour payer le module",
      notions: ["breakeven", "conversion_rate"],
      question: () => `Faites varier le nombre de réservations du mois : une droite donne la marge qu'elles rapportent, l'autre le loyer du module (${eur(MODULE_DE_RESERVATION.loyerParMois)}). Placez le curseur sur le plus petit nombre de réservations qui paie le module, puis validez.`,
      grandeur: () => ({ libelle: "Réservations du mois", unite: "réservations" }),
      cible: () => ({ attendu: reservationsQuiPaient(), max: 3 * reservationsQuiPaient() }),
      zones: ["Le module se paie", "Le module coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu de réservations, la marge ne paie pas encore le loyer.",
        dessus: "Le module se paie, mais avec moins de réservations aussi : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre",
      lecture: (_c, r) => {
        const k = moisDuModule(r);
        return [
          { libelle: "Marge des réservations", montant: k.marge },
          { libelle: "Loyer du module", montant: k.loyer },
          { libelle: "Gain du mois", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({ produit: (r) => r * margeDUneReservation().parReservation, cout: () => MODULE_DE_RESERVATION.loyerParMois, libelles: ["Marge des réservations", "Loyer du module"] }),
      explication: () => {
        const n = reservationsQuiPaient();
        const k = canauxDeJanvier();
        return [
          `À ${qte(n)} réservations par mois, le module rapporte ${eur(moisDuModule(n).gain)} de plus que son loyer. Le site reçoit ${qte(k.visites)} visites par mois : il suffit qu'une petite part des visiteuses réserve.`,
          "Relier les canaux a un coût ; il se paie quand assez de clientes suivent ce parcours.",
        ];
      },
    },
    {
      id: "qui-dicte",
      objectifs: [3],
      type: "choix",
      titre: "Le consommateur dicte-t-il les choix ?",
      notions: ["distribution_commission"],
      question: (c) => `La question du programme : le consommateur dicte-t-il les choix de distribution ? Que répondez-vous pour ${c.entreprise} ?`,
      options: () => [
        { texte: "En partie : la boutique suit ses clientes", juste: true, retour: "Oui : les clientes passent du site à la boutique et inversement ; la boutique adapte ses canaux à ces parcours (retrait, réservation, commande en boutique). Elle reste maîtresse de ses prix, de son stock et de son conseil." },
        { texte: "Non : la boutique choisit seule ses canaux", juste: false, retour: "Non : une boutique qui ignore le parcours de ses clientes les perd au profit de celles qui le suivent." },
        { texte: "Oui : la cliente décide de tout, même du prix", juste: false, retour: "Non : la cliente choisit son chemin, pas les conditions de vente. La boutique garde ses choix de prix et d'assortiment." },
      ],
    },
    {
      id: "la-distribution-collaborative",
      objectifs: [3],
      type: "choix",
      titre: "Quand les particuliers se vendent entre eux",
      notions: ["distribution_commission"],
      question: () => "Des clientes revendent leurs pulls usagés sur une plateforme entre particuliers. Qu'est-ce que la distribution collaborative ?",
      options: () => [
        { texte: "Des particuliers qui vendent entre eux", juste: true, retour: "Oui : souvent par une plateforme, des particuliers échangent des biens, d'occasion ou à partager. La boutique peut s'en inspirer : reprendre un pull usagé contre un bon d'achat, par exemple." },
        { texte: "Deux boutiques qui partagent un même entrepôt", juste: false, retour: "Non : c'est une coopération entre commerçants. La distribution collaborative se fait entre particuliers." },
        { texte: "Une boutique qui vend aussi sur son site", juste: false, retour: "Non : c'est le multicanal, ou le cross-canal. La distribution collaborative ne passe pas par la boutique." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["conversion_rate", "distribution_commission"],
      texte: (c) => {
        const k = canauxDeJanvier();
        return [
          `Chez ${c.entreprise}, le site vend peu mais prépare ${pct(k.partRopo)} des passages en caisse : le parcours de la cliente traverse les canaux. Relier ces canaux (retrait, réservation, commande en boutique) se paie, et rapporte quand assez de clientes s'en servent.`,
          "Dans l'arène, relevez à chaque tour les ventes de chaque clientèle : laquelle passerait par le site avant d'entrer, et laquelle irait acheter ailleurs ?",
        ];
      },
      repere: () => "Multicanal : des canaux côte à côte. Cross-canal : des canaux qui se relaient pendant l'achat. Omnicanal : un seul parcours, quels que soient les canaux.",
    },
  ],
};
