import { eur, qte } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  ACTIVITES_DE_LA_COMMANDE,
  COMMANDES_QUI_PAIENT_LE_PGI,
  COUT_HORAIRE_DE_NOVA,
  PGI_EN_NUAGE,
  economieDuPgi,
  processusDeLaCommande,
} from "../monde/processus-de-commande";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PROCESSUS ET LE PGI, AGILITÉ OU RIGIDITÉ ? (Bac STMG, sciences de gestion et numérique
 * de première, thème 2, question 3 : « Le numérique crée-t-il de l'agilité ou de la rigidité ? »).
 *
 * La commande mensuelle de CampusTech traverse NOVA : le commercial la reçoit, l'atelier la monte,
 * l'expédition la livre, la comptabilité la facture, CampusTech paie. L'élève schématise ce processus
 * (ses activités, ses acteurs, ses flux), puis voit ce qu'un progiciel de gestion intégré change : une
 * base de données unique, des ressaisies qui disparaissent, un délai plus court, un temps de travail
 * gagné. Il chiffre à partir de combien de commandes par mois le PGI paie son abonnement (le curseur).
 * Puis l'autre face : un progiciel standard rigidifie ce qui sort de la norme, le nuage rend dépendant
 * de son fournisseur, le travail à distance et l'intelligence artificielle déplacent les tâches.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : la commande de CampusTech, son prix, son délai de
 * paiement et la paie de l'équipe sont ceux des fiches ; les durées des activités, le prix du PGI et la
 * durée d'une ressaisie sont des hypothèses du cours, nommées dans monde/processus-de-commande.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les délais et les jours gagnés sont des quantités de jours ;
 * les montants au centime.
 */

export const ENTREPRISES_DU_PROCESSUS = ["nova"] as const;


const ACTEURS = { commercial: "Commercial", atelier: "Atelier", expedition: "Expédition", comptabilite: "Comptabilité", client: "CampusTech" } as const;

function leProcessus(c: Cas): TableauDeDonnees {
  return {
    titre: `La commande de CampusTech chez ${c.entreprise}, activité par activité`,
    colonnes: ["Acteur", "Jours sans PGI", "Jours avec PGI"],
    lignes: ACTIVITES_DE_LA_COMMANDE.map((a) => ({ libelle: a.libelle, valeurs: [ACTEURS[a.acteur], qte(a.jours.sans), qte(a.jours.avec)] })),
  };
}

export const LE_PROCESSUS_ET_LE_PGI: Chapitre = {
  code: "le-processus-et-le-pgi",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Le processus et le PGI : agilité ou rigidité ?",
  accroche:
    "Une commande traverse l'entreprise, du commercial à la comptabilité. Saisie trois fois dans trois outils, ou une fois dans un progiciel partagé : ce que le numérique fait gagner, et ce qu'il impose.",
  objectifs: [
    "Schématiser un processus : ses activités, ses acteurs et ses flux",
    "Expliquer ce qu'apporte un PGI : une base de données unique",
    "Chiffrer ce qu'un PGI fait gagner en délai et en temps de travail",
    "Dire en quoi le numérique crée de l'agilité ou de la rigidité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PROCESSUS,
    pourquoi: "ce chapitre suit la commande mensuelle de CampusTech chez NOVA, dont le cours tient le prix, le délai de paiement et l'équipe.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une commande traverse l'entreprise",
      tableau: leProcessus,
      texte: (c) => {
        const k = processusDeLaCommande();
        return [
          `Chaque mois, CampusTech commande des enceintes à ${c.entreprise}, pour ${eur(k.montantDeLaCommande)} hors taxes. La commande traverse l'entreprise : c'est un processus, une suite d'activités, faites par des acteurs, reliées par des flux, qui produit un résultat pour un client.`,
          "Aujourd'hui, chaque service a son outil : le commercial un tableur, l'atelier son planning, la comptabilité son logiciel de facturation. La commande se ressaisit d'un outil à l'autre, et chaque passage attend que le service suivant la lise.",
        ];
      },
      repere: () => "Un processus = des activités, faites par des acteurs, dans un ordre, reliées par des flux (physiques, d'information, financiers), pour un résultat attendu.",
    },
    {
      id: "les-flux",
      objectifs: [0],
      type: "tri",
      titre: "Les flux du processus",
      question: () => "Schématiser le processus, c'est d'abord nommer ses flux. Rangez chaque élément : est-ce un flux physique, un flux d'information ou un flux financier ?",
      categories: [
        { code: "physique", libelle: "Physique" },
        { code: "information", libelle: "Information" },
        { code: "financier", libelle: "Financier" },
      ],
      elements: () => [
        { libelle: "Le bon de commande envoyé par CampusTech", montant: 0, categorie: "information", pourquoi: "Un document qui dit ce qu'il faut faire : un flux d'information." },
        { libelle: "La facture", montant: 0, categorie: "information", pourquoi: "Elle informe CampusTech de ce qu'il doit : un flux d'information, qui en déclenche un financier." },
        { libelle: "Les jeux de composants qui arrivent à l'atelier", montant: 0, categorie: "physique", pourquoi: "Des biens qui se déplacent : un flux physique." },
        { libelle: "Les palettes d'enceintes livrées à la centrale", montant: 0, categorie: "physique", pourquoi: "Des biens qui se déplacent : un flux physique." },
        { libelle: "Le virement de CampusTech", montant: 0, categorie: "financier", pourquoi: "De l'argent qui passe d'un compte à l'autre : un flux financier." },
      ],
      relance: "Demandez-vous : est-ce un bien qui se déplace, un document qui informe, ou de l'argent qui circule ?",
      explication: () => [
        "Sur un schéma de processus, chaque acteur a sa colonne, chaque activité sa case, et des flèches portent les flux d'une case à l'autre. Les flux d'information pilotent les flux physiques, qui déclenchent les flux financiers.",
      ],
    },
    {
      id: "les-acteurs",
      objectifs: [0],
      type: "tri",
      titre: "Qui fait quoi ?",
      tableau: leProcessus,
      question: () => "Rangez chaque activité sous l'acteur qui la fait.",
      categories: [
        { code: "commercial", libelle: "Commercial" },
        { code: "atelier", libelle: "Atelier" },
        { code: "comptabilite", libelle: "Comptabilité" },
      ],
      elements: () => [
        { libelle: "Vérifier que le prix et les quantités de la commande sont ceux convenus", montant: 0, categorie: "commercial", pourquoi: "La relation avec le client et ses conditions relèvent du commercial." },
        { libelle: "Planifier le montage de la commande dans la semaine", montant: 0, categorie: "atelier", pourquoi: "L'atelier organise sa production." },
        { libelle: "Contrôler chaque enceinte au banc d'écoute", montant: 0, categorie: "atelier", pourquoi: "Le contrôle de la qualité se fait à l'atelier." },
        { libelle: "Relancer CampusTech quand le paiement est en retard", montant: 0, categorie: "comptabilite", pourquoi: "Le suivi des créances relève de la comptabilité." },
      ],
      relance: "Demandez-vous : qui, chez NOVA, a l'information et la compétence pour faire cette activité ?",
      explication: () => [
        "Un processus traverse les services : aucun n'en voit tout le chemin. C'est pourquoi les ruptures se cachent aux passages d'un acteur à l'autre, là où l'information se transmet.",
      ],
    },
    {
      id: "le-pgi",
      objectifs: [1],
      type: "choix",
      titre: "Ce qu'est un PGI",
      question: () => "Le président envisage un progiciel de gestion intégré (PGI). Qu'est-ce qui le distingue des trois outils d'aujourd'hui ?",
      options: () => [
        { texte: "Une seule base de données, que tous les services partagent", juste: true, retour: "Oui : le PGI réunit des modules (ventes, production, achats, comptabilité, paie) autour d'une base de données unique. La commande saisie par le commercial est vue tout de suite par l'atelier et la comptabilité, sans ressaisie." },
        { texte: "Un logiciel plus rapide que le tableur, pour le seul service commercial", juste: false, retour: "Non : ce qui fait le PGI, ce n'est pas la vitesse d'un outil, c'est l'intégration de tous les services dans une même base." },
        { texte: "Un site internet où CampusTech passe ses commandes lui-même", juste: false, retour: "Non : c'est un site de commande en ligne, une solution de commerce électronique ; une place de marché, un site où NOVA vendrait à côté d'autres marques, en serait une autre. Ces outils alimentent le PGI ; le PGI, lui, est l'outil de gestion de toute l'entreprise." },
      ],
    },
    {
      id: "le-delai",
      objectifs: [2],
      type: "montants",
      titre: "Ce que le PGI fait gagner en délai",
      tableau: leProcessus,
      question: (c) => `Calculez le délai de la commande à la facture, sans PGI puis avec, et les jours que ${c.entreprise} gagne sur l'encaissement (CampusTech paie toujours ${qte(processusDeLaCommande().delaiDePaiement)} jours après la facture).`,
      champs: () => {
        const k = processusDeLaCommande();
        return [
          { libelle: "Délai jusqu'à la facture, sans PGI (jours)", nature: "quantite", attendu: k.sans, calcul: ACTIVITES_DE_LA_COMMANDE.map((a) => qte(a.jours.sans)).join(" + ") + ` = ${qte(k.sans)}` },
          { libelle: "Délai jusqu'à la facture, avec PGI (jours)", nature: "quantite", attendu: k.avec, calcul: ACTIVITES_DE_LA_COMMANDE.map((a) => qte(a.jours.avec)).join(" + ") + ` = ${qte(k.avec)}` },
          { libelle: "Jours gagnés sur l'encaissement", nature: "quantite", attendu: k.joursGagnes, calcul: `(${qte(k.sans)} + ${qte(k.delaiDePaiement)}) − (${qte(k.avec)} + ${qte(k.delaiDePaiement)}) = ${qte(k.joursGagnes)}` },
        ];
      },
      explication: () => {
        const k = processusDeLaCommande();
        return [
          `Les ${qte(k.ressaisies)} ressaisies disparaissent, et avec elles l'attente aux passages : la facture part ${qte(k.joursGagnes)} jours plus tôt, et l'argent arrive ${qte(k.joursGagnes)} jours plus tôt, ${qte(k.encaissementAvec)} jours après la commande au lieu de ${qte(k.encaissementSans)}. C'est l'agilité : le processus réagit plus vite.`,
        ];
      },
    },
    {
      id: "le-pgi-qui-se-paie",
      objectifs: [2],
      type: "curseur",
      titre: "À partir de combien de commandes ?",
      sens: "plus-petite",
      question: () => {
        const k = processusDeLaCommande();
        return `Le PGI coûte ${eur(PGI_EN_NUAGE.parPosteEtParMois)} par poste et par mois, pour ${qte(PGI_EN_NUAGE.postes)} postes. Chaque commande traitée sans lui demande ${qte(k.ressaisies)} ressaisies de ${qte(PGI_EN_NUAGE.minutesParRessaisie)} minutes, à ${eur(COUT_HORAIRE_DE_NOVA)} l'heure. Faites varier les commandes traitées dans le mois : placez le curseur sur le plus petit nombre de commandes à partir duquel le temps gagné paie l'abonnement.`;
      },
      grandeur: () => ({ libelle: "Commandes traitées dans le mois", unite: "commandes" }),
      cible: () => ({ attendu: COMMANDES_QUI_PAIENT_LE_PGI, max: 60 }),
      zones: ["Le temps gagné paie le PGI", "Le PGI coûte plus que le temps gagné"],
      rates: () => ({ dessous: "Avec si peu de commandes, le temps gagné ne paie pas l'abonnement.", dessus: "Le PGI se paie déjà avec moins de commandes : cherchez plus bas." }),
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const k = economieDuPgi(n);
        return [
          { libelle: "Temps de ressaisie gagné", montant: k.temps },
          { libelle: "Abonnement du PGI", montant: k.abonnement },
          { libelle: "Ce que le PGI fait gagner", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => economieDuPgi(n).temps, cout: () => processusDeLaCommande().abonnement, libelles: ["Temps de ressaisie gagné", "Abonnement du PGI"] }),
      explication: () => {
        const k = economieDuPgi(COMMANDES_QUI_PAIENT_LE_PGI);
        return [
          `À ${qte(COMMANDES_QUI_PAIENT_LE_PGI)} commandes par mois, le temps gagné vaut ${eur(k.temps)}, plus que l'abonnement de ${eur(k.abonnement)}. Le calcul ne compte ni les erreurs de ressaisie évitées, ni l'argent encaissé plus tôt : le PGI vaut plus que ce seuil ne le dit.`,
        ];
      },
    },
    {
      id: "la-rigidite",
      objectifs: [3],
      type: "choix",
      titre: "Quand le progiciel rigidifie",
      question: () =>
        "CampusTech demande que son logo soit gravé sur 50 enceintes. Le PGI ne connaît pas de « gravure » : il refuse une commande qui sort de ses fiches articles. Que montre cet épisode ?",
      options: () => [
        { texte: "La rigidité d'un progiciel standard", juste: true, retour: "Oui : un PGI impose ses façons de faire, celles de la plupart des entreprises. Ce qui en sort demande un paramétrage, une application métier à côté, ou un contournement. Le numérique accélère ce qui est prévu, et freine ce qui ne l'est pas." },
        { texte: "Une erreur de l'atelier, qui aurait dû graver sans passer par le PGI", juste: false, retour: "Non : sortir du PGI ferait perdre la trace de la commande, et la facture ne la connaîtrait pas. Le problème est dans l'outil, pas dans l'atelier." },
        { texte: "Une preuve que le PGI ne sert à rien chez NOVA", juste: false, retour: "Non : il fait gagner du temps sur toutes les commandes ordinaires. Il faut l'adapter pour les commandes particulières." },
      ],
    },
    {
      id: "le-nuage",
      objectifs: [3],
      type: "choix",
      titre: "L'informatique en nuage",
      question: () => "Le PGI choisi est en nuage : NOVA ne l'installe pas, elle s'y connecte par internet, et l'éditeur garde ses données. Quel est le revers de ce choix ?",
      options: () => [
        { texte: "La dépendance à l'éditeur et à la connexion", juste: true, retour: "Oui : sans internet, ou si l'éditeur augmente ses prix ou ferme, NOVA ne travaille plus. Le contrat doit prévoir la récupération des données. En échange, pas de serveur à acheter ni à entretenir, et un accès de partout." },
        { texte: "Aucun : le nuage est toujours moins cher et plus sûr", juste: false, retour: "Non : il coûte un abonnement chaque mois, sans fin, et la sécurité dépend de l'éditeur, que NOVA doit choisir avec soin." },
        { texte: "Les données de NOVA deviennent la propriété de l'éditeur", juste: false, retour: "Non : l'éditeur les héberge, elles restent à NOVA. Mais il faut s'assurer qu'on pourra les récupérer." },
      ],
    },
    {
      id: "a-distance-et-l-ia",
      objectifs: [3],
      type: "tri",
      titre: "Le travail à distance et l'IA",
      question: () => "Avec le PGI en nuage, une partie du travail change de lieu, ou de mains. Rangez chaque tâche : peut-elle être confiée à l'automatisation ou à l'IA, ou demande-t-elle un jugement humain ?",
      categories: [
        { code: "automatisable", libelle: "Automatisation ou IA" },
        { code: "humain", libelle: "Jugement humain" },
      ],
      elements: () => [
        { libelle: "Lire les factures du fournisseur et les rapprocher des commandes", montant: 0, categorie: "automatisable", pourquoi: "Une tâche répétitive, aux règles claires : une IA de lecture de documents la fait." },
        { libelle: "Envoyer une relance quand une facture n'est pas payée à l'échéance", montant: 0, categorie: "automatisable", pourquoi: "Le PGI le fait seul, à la date prévue." },
        { libelle: "Négocier avec CampusTech un délai de paiement plus court", montant: 0, categorie: "humain", pourquoi: "Une négociation engage la relation : elle demande un jugement et une décision." },
        { libelle: "Accepter ou non la commande gravée, et à quel prix", montant: 0, categorie: "humain", pourquoi: "Une décision qui sort de la règle, avec un risque à peser." },
      ],
      relance: "Demandez-vous : la tâche suit-elle une règle que l'on peut écrire, ou faut-il peser une situation nouvelle ?",
      explication: () => [
        "Le PGI en nuage permet aussi le travail à distance et la mobilité : la comptable peut facturer de chez elle une partie de la semaine. Le numérique déplace les tâches : ce qui se répète passe à la machine, ce qui se juge reste aux personnes, qui doivent être formées à l'outil.",
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = processusDeLaCommande();
        return [
          `Chez ${c.entreprise}, la commande de CampusTech est un processus : des activités, des acteurs, des flux d'information, physiques et financiers. Le PGI réunit tous les services autour d'une base de données unique : la facture part en ${qte(k.avec)} jours au lieu de ${qte(k.sans)}, et le temps gagné paie l'abonnement dès ${qte(COMMANDES_QUI_PAIENT_LE_PGI)} commandes par mois.`,
          "C'est de l'agilité. Mais le progiciel standard rigidifie ce qui sort de la norme, le nuage rend dépendant de son éditeur, et l'automatisation déplace le travail. Dans l'arène, les décisions passent par une feuille unique, vue de toute l'équipe : c'est l'idée du PGI.",
        ];
      },
      repere: () => "Un PGI : une base de données unique, des modules intégrés, une saisie unique. Agilité pour ce qui est prévu, rigidité pour ce qui ne l'est pas.",
    },
  ],
};
