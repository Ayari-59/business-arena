import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import {
  CONTROLE_DES_ADRESSES,
  COUT_D_UN_COLIS_REVENU,
  ENTREPRISES_DU_SYSTEME_D_INFORMATION,
  adressesDeJanvier,
  commandesQuiPaientLeControle,
  coutDesAdressesFausses,
} from "../monde/systeme-d-information-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE SYSTÈME D'INFORMATION DE NOVA, FONCTIONS, PROCESSUS, SYSTÈME INFORMATIQUE (Bac STMG,
 * enseignement spécifique de systèmes d'information de gestion de terminale, thème 1, question 1.1 :
 * « Comment l'organisation se structure-t-elle pour gérer l'information ? »).
 *
 * L'histoire, les dimensions, les ressources, les objectifs et les niveaux d'un système d'information ;
 * ses quatre fonctions (acquisition, traitement, stockage, diffusion) ; les systèmes d'information
 * fonctionnels et ce que le numérique leur apporte ; la gestion centralisée et la qualité des données,
 * chiffrée au curseur sur les adresses fausses du site ; la modélisation d'un processus (acteurs,
 * activités, synchronisation) ; le système informatique et la transformation de l'organisation.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/systeme-d-information-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux d'adresses fausses se donne à deux décimales, à un
 * centième près (au dixième, avant).
 */


/** Le processus « Expédier une commande du site », tel que l'atelier le décrit. */
const processusDExpedition = (): TableauDeDonnees => ({
  titre: "Le processus « Expédier une commande du site »",
  colonnes: ["Acteur", "Activité", "Déclenchée par"],
  lignes: [
    { libelle: "1", valeurs: ["Le client", "Commander et payer", "Le choix sur le site"] },
    { libelle: "2", valeurs: ["La banque", "Accepter le paiement", "La commande"] },
    { libelle: "3", valeurs: ["L'opérateur de permanence", "Préparer le colis", "Paiement accepté et enceinte en stock"] },
    { libelle: "4", valeurs: ["Le transporteur", "Livrer le colis", "Le colis étiqueté"] },
  ],
});

export const LE_SYSTEME_D_INFORMATION_DE_NOVA: Chapitre = {
  code: "le-systeme-d-information-de-nova",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 1 · Organisation et numérisation"],
  titre: "Le système d'information de NOVA : fonctions, processus et système informatique",
  accroche:
    "Un site de vente, un tableur, un logiciel de facturation, des opérateurs et des règles : ce qui fait le système d'information de NOVA, ce qu'il fait de l'information, et ce que coûte une adresse mal saisie.",
  objectifs: [
    "Caractériser un système d'information : ressources, fonctions, niveaux",
    "Relier chaque système d'information fonctionnel à sa fonction",
    "Chiffrer ce que coûte une donnée de mauvaise qualité, et le contrôle qui l'évite",
    "Lire le schéma d'un processus : acteurs, activités, synchronisation",
    "Repérer les éléments du système informatique et ce qu'ils changent",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SYSTEME_D_INFORMATION,
    pourquoi: "ce chapitre décrit le système d'information de NOVA et les commandes de son site.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que NOVA fait de l'information",
      texte: (c) => [
        `Chaque jour, ${c.entreprise} reçoit des commandes sur son site, prépare des colis, facture CampusTech, paie ses fournisseurs et ses opérateurs. Tout cela produit et consomme de l'information : une commande, une adresse, un stock, une facture.`,
        "Le système d'information est l'ensemble organisé des ressources qui acquièrent, traitent, stockent et diffusent cette information : des personnes, des données, des matériels, des logiciels et des procédures. Il ne se réduit pas à l'informatique.",
      ],
      repere: () => "Système d'information : des acteurs, des données, des matériels, des logiciels et des procédures, au service de l'organisation.",
    },
    {
      id: "histoire-et-dimensions",
      type: "lecture",
      titre: "D'hier à aujourd'hui",
      texte: () => [
        "Les registres de papier, puis les cartes perforées, puis l'ordinateur, le réseau et le nuage : les organisations ont toujours eu besoin de traiter, de garder et d'échanger l'information. Chacune façonne son système selon son métier.",
        "Un système d'information a 3 dimensions : informationnelle (les données et leur sens), technologique (les outils) et organisationnelle (qui fait quoi, selon quelles règles). Ses objectifs sont opérationnels (servir le client du jour) ou stratégiques (préparer Noël, choisir un marché).",
      ],
      repere: () => "Dimensions informationnelle, technologique, organisationnelle · objectifs opérationnels et stratégiques.",
    },
    {
      id: "les-ressources",
      objectifs: [0],
      type: "tri",
      titre: "Les ressources du système",
      question: (c) => `Rangez chaque élément du système d'information de ${c.entreprise}.`,
      categories: [
        { code: "acteurs", libelle: "Acteurs" },
        { code: "donnees", libelle: "Données" },
        { code: "outils", libelle: "Matériels et logiciels" },
        { code: "procedures", libelle: "Procédures" },
      ],
      elements: () => [
        { libelle: "Le président et les opérateurs de l'atelier", montant: 0, categorie: "acteurs", pourquoi: "Des personnes qui saisissent, décident et utilisent l'information : les acteurs." },
        { libelle: "La fiche d'un client : son nom, son adresse, ses commandes", montant: 0, categorie: "donnees", pourquoi: "Des faits enregistrés : les données." },
        { libelle: "Le logiciel de facturation et l'ordinateur de l'atelier", montant: 0, categorie: "outils", pourquoi: "Les outils qui traitent et gardent les données." },
        { libelle: "La règle : toute commande est expédiée le jour même", montant: 0, categorie: "procedures", pourquoi: "Une règle de gestion, qui dit comment travailler : une procédure." },
      ],
      relance: "Est-ce une personne, un fait enregistré, un outil, ou une règle de travail ?",
      explication: () => ["Sans procédures, les outils ne servent à rien ; sans acteurs formés, les données s'abîment. Le système d'information tient par ses 4 ressources à la fois."],
    },
    {
      id: "les-fonctions",
      objectifs: [0],
      type: "tri",
      titre: "Les 4 fonctions",
      question: () => "Rangez chaque opération selon la fonction du système d'information qu'elle remplit.",
      categories: [
        { code: "acquisition", libelle: "Acquisition" },
        { code: "traitement", libelle: "Traitement" },
        { code: "stockage", libelle: "Stockage" },
        { code: "diffusion", libelle: "Diffusion" },
      ],
      elements: () => [
        { libelle: "Le client saisit sa commande et son adresse sur le site", montant: 0, categorie: "acquisition", pourquoi: "L'information entre dans le système : l'acquisition." },
        { libelle: "Le logiciel calcule le montant toutes taxes comprises de la facture", montant: 0, categorie: "traitement", pourquoi: "Une donnée nouvelle est calculée : le traitement." },
        { libelle: "La commande est enregistrée dans la base du site", montant: 0, categorie: "stockage", pourquoi: "L'information est gardée pour plus tard : le stockage." },
        { libelle: "La facture part au client par courriel", montant: 0, categorie: "diffusion", pourquoi: "L'information est transmise à qui en a besoin : la diffusion." },
        { libelle: "Le tableau des ventes du mois arrive chez le président", montant: 0, categorie: "diffusion", pourquoi: "Diffusée aussi, vers celui qui décide." },
      ],
      relance: "L'information entre-t-elle, est-elle calculée, gardée, ou transmise ?",
      explication: () => ["Chaque fonction peut être manuelle ou numérique. Le numérique accélère surtout l'acquisition (le client saisit lui-même) et la diffusion (la facture part sans papier)."],
    },
    {
      id: "les-niveaux",
      objectifs: [0],
      type: "choix",
      titre: "Le niveau du système",
      question: (c) => `Le système de ${c.entreprise} envoie chaque mois sa facture au logiciel de CampusTech, qui l'enregistre sans ressaisie. À quel niveau le système d'information joue-t-il ici ?`,
      options: () => [
        { texte: "Inter-organisationnel", juste: true, retour: "Oui : il relie NOVA à un partenaire, un client professionnel. Le niveau organisationnel reste dans NOVA ; l'extra-organisationnel touche le grand public, comme le site." },
        { texte: "Organisationnel, puisque la facture est faite chez NOVA", juste: false, retour: "Non : la facture sort de NOVA et entre dans le système d'un autre." },
        { texte: "Extra-organisationnel, comme tout ce qui sort de l'entreprise", juste: false, retour: "Non : l'extra-organisationnel s'adresse à des acteurs sans lien durable, comme les internautes. CampusTech est un partenaire." },
      ],
    },
    {
      id: "les-si-fonctionnels",
      objectifs: [1],
      type: "tri",
      titre: "Les systèmes d'information fonctionnels",
      question: () => "Rangez chaque usage selon le système d'information fonctionnel qui le porte.",
      categories: [
        { code: "commercial", libelle: "Gestion commerciale et marketing" },
        { code: "production", libelle: "Gestion de la production" },
        { code: "finance", libelle: "Gestion comptable et financière" },
        { code: "rh", libelle: "Gestion des ressources humaines" },
      ],
      elements: () => [
        { libelle: "Suivre les commandes et les clients du site", montant: 0, categorie: "commercial", pourquoi: "La relation avec le client : le système commercial." },
        { libelle: "Planifier les postes de la ligne de montage", montant: 0, categorie: "production", pourquoi: "Ce que la ligne fabrique, et quand : la production." },
        { libelle: "Facturer CampusTech et relancer ses retards", montant: 0, categorie: "finance", pourquoi: "Les créances et les encaissements : la gestion comptable et financière." },
        { libelle: "Tenir les horaires et préparer la paie des opérateurs", montant: 0, categorie: "rh", pourquoi: "Le temps de travail et la paie : les ressources humaines." },
      ],
      relance: "Quelle fonction de l'entreprise se sert de cette information ?",
      explication: () => ["Chaque fonction a son système, mais tous partagent des données : le client du système commercial est aussi celui que la comptabilité facture."],
    },
    {
      id: "apport-du-numerique",
      objectifs: [1],
      type: "choix",
      titre: "Ce que le numérique apporte",
      question: (c) => `Le site garde l'historique de chaque client. Qu'est-ce que le système d'information commercial de ${c.entreprise} peut en tirer ?`,
      options: () => [
        { texte: "Anticiper les achats de Noël d'après les années passées", juste: true, retour: "Oui : analyser le comportement d'achat pour l'anticiper, c'est l'apport du numérique à la fonction marketing. Il prépare aussi la gestion de la relation client." },
        { texte: "Rien : un historique de commandes ne sert qu'à la comptabilité, pas aux ventes", juste: false, retour: "Non : les mêmes données servent plusieurs fonctions, c'est tout l'intérêt de les garder." },
        { texte: "Fixer le salaire des opérateurs", juste: false, retour: "Non : c'est le système des ressources humaines, et l'historique des clients ne le fonde pas." },
      ],
    },
    {
      id: "donnees-centralisees",
      type: "lecture",
      titre: "Une gestion centralisée des données",
      texte: (c) => [
        `Aujourd'hui, l'adresse d'un client vit à 3 endroits chez ${c.entreprise} : le site, le tableur des ventes, le logiciel de facturation. Si elle change, il faut la changer 3 fois ; un oubli, et les données se contredisent.`,
        "Une gestion centralisée garde chaque donnée une fois, dans une base que tous les métiers partagent. Une donnée de qualité est exacte, complète, à jour, cohérente et sans doublon. La qualité se joue d'abord à l'acquisition : une erreur arrêtée à la saisie ne coûte rien.",
      ],
      repere: () => "Une donnée, un seul endroit, partagé · qualité : exacte, complète, à jour, cohérente, sans doublon · elle se protège dès la saisie.",
    },
    {
      id: "les-adresses-fausses",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûtent les adresses fausses",
      question: () => {
        const k = adressesDeJanvier();
        return `En janvier, le site a reçu ${qte(k.commandes)} commandes, et ${qte(k.colis)} colis sont revenus pour une adresse fausse ou incomplète. Un colis revenu coûte ${eur(COUT_D_UN_COLIS_REVENU)}. Calculez le taux d'adresses fausses, en pourcentage au dixième, puis ce qu'elles ont coûté dans le mois.`;
      },
      champs: () => {
        const k = adressesDeJanvier();
        return [
          { libelle: "Taux d'adresses fausses (%)", attendu: k.tauxPct, calcul: `${qte(k.colis)} ÷ ${qte(k.commandes)} × 100 = ${pct(k.tauxPct)}` },
          { libelle: "Coût des colis revenus", attendu: k.cout, calcul: `${qte(k.colis)} × ${eur(COUT_D_UN_COLIS_REVENU)} = ${eur(k.cout)}` },
        ];
      },
      explication: () => [`Une donnée fausse ne reste pas dans la base : elle part en colis, revient, et se paie. Ces ${eur(adressesDeJanvier().cout)} ne comptent ni le client mécontent, ni l'appel pour retrouver la bonne adresse.`],
    },
    {
      id: "le-curseur-du-controle",
      objectifs: [2],
      type: "curseur",
      titre: "À partir de combien de commandes ?",
      question: () =>
        `Un service de complétion d'adresses, branché sur le formulaire du site, propose les adresses de la base nationale pendant que le client tape. Il coûte ${eur(CONTROLE_DES_ADRESSES.parMois)} par mois. Faites varier les commandes du mois, au taux d'erreur de janvier : une droite donne ce que coûtent les adresses fausses, l'autre l'abonnement. Placez le curseur sur le premier nombre de commandes où le contrôle se paie.`,
      cible: () => ({ attendu: commandesQuiPaientLeControle(), max: 600 }),
      grandeur: () => ({ libelle: "Commandes du site dans le mois", unite: "commandes" }),
      rates: () => ({ dessous: "Pas encore : l'abonnement coûte plus que les colis revenus.", dessus: "Le contrôle se paie, mais moins de commandes suffisaient-elles déjà ?" }),
      zones: ["Contrôle payé", "Contrôle non payé"],
      montrer: "Montrer le nombre de commandes",
      lecture: (_c, n) => [
        { libelle: "Ce que coûtent les adresses fausses", montant: coutDesAdressesFausses(n), fort: true },
        { libelle: "Abonnement du contrôle", montant: CONTROLE_DES_ADRESSES.parMois },
      ],
      droites: () => ({ produit: (n) => coutDesAdressesFausses(n), cout: () => CONTROLE_DES_ADRESSES.parMois, libelles: ["Adresses fausses", "Abonnement"] }),
      explication: () => {
        const k = adressesDeJanvier();
        return [`Le contrôle se paie dès ${qte(commandesQuiPaientLeControle())} commandes par mois ; le site en reçoit ${qte(k.commandes)} en janvier. Arrêter l'erreur à la saisie coûte bien moins que la corriger après.`];
      },
    },
    {
      id: "le-processus",
      type: "lecture",
      titre: "Modéliser un processus",
      tableau: processusDExpedition,
      texte: () => [
        "Un processus est une suite d'activités qui produit un résultat pour un client, ici un colis livré. Le modéliser, c'est le dessiner pour le comprendre, le communiquer ou l'améliorer.",
        "Un schéma de processus montre les acteurs, les activités (découpées en tâches), les événements qui les déclenchent, et les synchronisations : les points où une activité attend que plusieurs conditions soient réunies.",
      ],
      repere: () => "Processus : acteurs, activités et tâches, événements déclencheurs, synchronisations, résultat.",
    },
    {
      id: "la-synchronisation",
      objectifs: [3],
      type: "choix",
      titre: "Le point qui attend",
      tableau: processusDExpedition,
      question: () => "Dans le schéma, l'opérateur ne prépare le colis que si le paiement est accepté et que l'enceinte est en stock. Comment s'appelle ce point du processus ?",
      options: () => [
        { texte: "Une synchronisation", juste: true, retour: "Oui : l'activité attend que 2 conditions soient réunies, une de la banque, une du stock. Si l'une manque, le colis ne part pas." },
        { texte: "Une tâche de l'opérateur, comme coller l'étiquette", juste: false, retour: "Non : une tâche est un geste de l'activité. Ici, il s'agit de ce qui la déclenche." },
        { texte: "Le résultat du processus, puisque le client attend son colis", juste: false, retour: "Non : le résultat est le colis livré, à la fin." },
      ],
    },
    {
      id: "adapter-le-processus",
      objectifs: [3],
      type: "choix",
      titre: "Adapter le processus",
      tableau: processusDExpedition,
      question: (c) => `${c.entreprise} branche le contrôle des adresses sur le site. Où le schéma change-t-il ?`,
      options: () => [
        { texte: "À l'activité 1 : l'adresse est vérifiée pendant la commande", juste: true, retour: "Oui : la nouvelle tâche s'ajoute à l'acquisition. Elle ne change rien au travail de l'atelier, mais moins de colis reviennent au transporteur." },
        { texte: "À l'activité 4 : le transporteur corrige les adresses en route", juste: false, retour: "Non : c'est trop tard, et ce n'est pas son rôle. L'erreur s'arrête là où elle naît." },
        { texte: "Nulle part : un contrôle informatique ne change pas un processus", juste: false, retour: "Non : chaque outil nouveau ajoute ou supprime des tâches. Il faut redessiner le schéma." },
      ],
    },
    {
      id: "le-systeme-informatique",
      objectifs: [4],
      type: "tri",
      titre: "Le système informatique",
      question: () => "Le système d'information prend appui sur un système informatique. Rangez chacun de ses éléments.",
      categories: [
        { code: "materiel", libelle: "Matériel" },
        { code: "logiciel", libelle: "Logiciel" },
        { code: "reseau", libelle: "Infrastructure de communication" },
      ],
      elements: () => [
        { libelle: "L'imprimante d'étiquettes de l'atelier", montant: 0, categorie: "materiel", pourquoi: "Un équipement physique : du matériel." },
        { libelle: "Les ordinateurs du bureau et de l'atelier", montant: 0, categorie: "materiel", pourquoi: "Du matériel aussi." },
        { libelle: "Le logiciel de facturation", montant: 0, categorie: "logiciel", pourquoi: "Un programme : un logiciel, ici une application métier." },
        { libelle: "La box et le réseau sans fil de l'atelier", montant: 0, categorie: "reseau", pourquoi: "Ce qui relie les postes entre eux et à Internet : l'infrastructure de communication." },
      ],
      relance: "Peut-on le toucher, est-ce un programme, ou ce qui relie les postes ?",
      explication: () => ["Choisir ces éléments est stratégique : un progiciel de gestion intégré, des applications métier ou le nuage n'organisent pas le travail de la même façon."],
    },
    {
      id: "transformer-l-organisation",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le système change",
      question: (c) => `${c.entreprise} remplace ses 3 outils par une base unique, que le site, l'atelier et la facturation partagent. Que change-t-elle à l'organisation ?`,
      options: () => [
        { texte: "Les ressaisies disparaissent, et chacun voit la même commande", juste: true, retour: "Oui : le système d'information transforme le travail. L'opérateur ne recopie plus, le président suit les ventes en direct, et les métiers se coordonnent par la donnée partagée." },
        { texte: "Rien pour les personnes : seul l'outil change, le travail de chacun reste le même", juste: false, retour: "Non : un système d'information nouveau modifie les tâches, les métiers et la coordination." },
        { texte: "Il faut un informaticien par service pour tenir la base", juste: false, retour: "Non : une base partagée en demande moins, pas plus." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Le système d'information de ${c.entreprise} réunit des acteurs, des données, des outils et des procédures. Il acquiert, traite, stocke et diffuse l'information, au service de chaque fonction, et relie NOVA à ses partenaires. Une donnée gardée une fois, contrôlée dès la saisie, coûte moins qu'une donnée à corriger : le contrôle des adresses se paie dès ${qte(commandesQuiPaientLeControle())} commandes par mois.`,
        "Dans l'arène, chaque tour vous donne des données : le marché, les ventes, les comptes. Ce que vous en faites, c'est votre système d'information.",
      ],
      repere: () => "Ressources · acquisition, traitement, stockage, diffusion · niveaux · SI fonctionnels · données centralisées et de qualité · processus et synchronisation · système informatique.",
    },
  ],
};
