import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ENTREPRISES_DE_LA_SECURITE,
  GRILLE_DES_RISQUES,
  PLAN_DE_SAUVEGARDE,
  criticite,
  joursQuiPaientLePlan,
  risqueLePlusCritique,
  unJourDArret,
  valeurDesJoursDArretEvites,
} from "../monde/securite-du-si-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : SÉCURISER LE SYSTÈME D'INFORMATION, RISQUES, RGPD ET CYBERSÉCURITÉ (Bac STMG, enseignement
 * spécifique de systèmes d'information de gestion de terminale, thème 1, question 1.2 : « Les
 * évolutions numériques sont-elles exemptes de risques ? »).
 *
 * Le numérique et les responsabilités sociales et environnementales de l'organisation ; les risques
 * informatiques et les risques pour les personnes ; les finalités de la sécurité (disponibilité,
 * intégrité, confidentialité, traçabilité) ; la démarche de sécurisation, la grille des risques et
 * leur criticité, les outils et solutions ; le plan de sauvegarde chiffré au curseur ; la protection
 * des données et le RGPD ; les menaces du cyberespace (hameçonnage, rançongiciel) et la conduite à
 * tenir. « Données et algorithmes », dans la partie commune, traite la violation de données.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/securite-du-si-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

function grilleACompleter(): TableauACompleter {
  return {
    titre: "La grille des risques du système d'information de NOVA",
    colonnes: ["Probabilité", "Gravité", "Criticité"],
    lignes: GRILLE_DES_RISQUES.map((r) => ({
      libelle: r.libelle,
      cellules: [
        { valeur: r.probabilite, texte: `${qte(r.probabilite)} sur 4`, horsTotal: true },
        { valeur: r.gravite, texte: `${qte(r.gravite)} sur 4`, horsTotal: true },
        { valeur: criticite(r), saisir: true, unite: "points", calcul: `${qte(r.probabilite)} × ${qte(r.gravite)} = ${qte(criticite(r))}`, indice: "La probabilité multipliée par la gravité." },
      ],
    })),
  };
}

export const SECURISER_LE_SYSTEME_D_INFORMATION: Chapitre = {
  code: "securiser-le-systeme-d-information",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 1 · Organisation et numérisation"],
  titre: "Sécuriser le système d'information : risques, RGPD et cybersécurité",
  accroche:
    "Un faux courriel, un rançongiciel, un disque qui lâche : les risques du numérique pour NOVA et pour ses clients, la démarche qui les maîtrise, ce que la loi impose sur les données, et ce que vaut une sauvegarde.",
  objectifs: [
    "Repérer les risques du numérique pour l'organisation, les personnes et l'environnement",
    "Situer une atteinte parmi les finalités de la sécurité",
    "Évaluer la criticité d'un risque et choisir une mesure",
    "Chiffrer une mesure de sécurité face à ce qu'elle évite",
    "Appliquer les obligations de la protection des données personnelles",
    "Réagir à une menace du cyberespace",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_SECURITE, pourquoi: "ce chapitre protège le site de NOVA et les données de ses clients." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un site, des clients, des risques",
      texte: (c) => [
        `Le site de ${c.entreprise} garde le nom, l'adresse, le courriel et les commandes de chaque client. Il fait vivre l'entreprise : en mai, ${qte(unJourDArret().ventesDuMois)} enceintes y ont été vendues. Un matin, un opérateur reçoit un courriel « de l'hébergeur » qui lui demande son mot de passe.`,
        "Le système d'information est une ressource stratégique. Il faut le protéger : repérer les risques, mesurer leurs conséquences, et mettre en place une démarche de sécurisation, dans le respect de la loi.",
      ],
      repere: () => "Sécuriser le système d'information : repérer, mesurer, protéger, et respecter les obligations.",
    },
    {
      id: "responsabilites",
      type: "lecture",
      titre: "Le numérique et ses responsabilités",
      texte: () => [
        "Le numérique a une empreinte : la fabrication des équipements en fait l'essentiel. Garder plus longtemps un ordinateur, le réparer, éviter les envois inutiles, c'est une responsabilité environnementale de l'organisation.",
        "Il a aussi des risques pour les personnes : une fuite de données expose les clients à l'usurpation d'identité ou à l'escroquerie. Protéger leurs données est une responsabilité sociale, et une obligation.",
      ],
      repere: () => "Responsabilité environnementale : l'empreinte des équipements · responsabilité sociale : les données et la vie privée des personnes.",
    },
    {
      id: "trois-sortes-de-risques",
      objectifs: [0],
      type: "tri",
      titre: "Qui le risque touche-t-il ?",
      question: () => "Rangez chaque situation.",
      categories: [
        { code: "organisation", libelle: "Un risque pour l'organisation" },
        { code: "personnes", libelle: "Un risque pour les personnes" },
        { code: "environnement", libelle: "Un enjeu environnemental" },
      ],
      elements: () => [
        { libelle: "Le site bloqué une semaine par un rançongiciel", montant: 0, categorie: "organisation", pourquoi: "NOVA ne vend plus : un risque pour l'activité." },
        { libelle: "La panne du serveur de l'hébergeur", montant: 0, categorie: "organisation", pourquoi: "Un risque informatique qui arrête l'activité." },
        { libelle: "Les adresses des clients publiées en ligne après une fuite", montant: 0, categorie: "personnes", pourquoi: "La vie privée des clients est atteinte." },
        { libelle: "Une cliente dont l'identité est usurpée après la fuite", montant: 0, categorie: "personnes", pourquoi: "Un dommage pour une personne, au-delà de l'entreprise." },
        { libelle: "Remplacer tous les ordinateurs tous les 3 ans, même en état de marche", montant: 0, categorie: "environnement", pourquoi: "Des équipements jetés trop tôt : l'empreinte du numérique." },
      ],
      relance: "Qui subit le dommage : l'entreprise, ses clients, ou la planète ?",
      explication: () => ["Un même incident touche souvent les deux : une fuite de données nuit aux clients, puis à l'entreprise, qui perd leur confiance et peut être sanctionnée."],
    },
    {
      id: "les-finalites",
      objectifs: [1],
      type: "tri",
      titre: "Ce que la sécurité protège",
      question: () => "La sécurité du système d'information protège 4 propriétés des données. Rangez chaque atteinte.",
      categories: [
        { code: "disponibilite", libelle: "Disponibilité" },
        { code: "integrite", libelle: "Intégrité" },
        { code: "confidentialite", libelle: "Confidentialité" },
        { code: "tracabilite", libelle: "Traçabilité" },
      ],
      elements: () => [
        { libelle: "Le site est inaccessible pendant 2 jours", montant: 0, categorie: "disponibilite", pourquoi: "Les données existent, mais personne ne peut s'en servir : la disponibilité." },
        { libelle: "Le prix d'une enceinte est modifié par erreur dans la base", montant: 0, categorie: "integrite", pourquoi: "La donnée n'est plus exacte : l'intégrité." },
        { libelle: "Un inconnu lit le fichier des clients", montant: 0, categorie: "confidentialite", pourquoi: "La donnée est vue par qui n'y a pas droit : la confidentialité." },
        { libelle: "Personne ne peut dire qui a supprimé une commande", montant: 0, categorie: "tracabilite", pourquoi: "On ne sait plus qui a fait quoi : la traçabilité." },
      ],
      relance: "Peut-on encore s'en servir ? Est-elle encore juste ? Qui l'a vue ? Qui l'a changée ?",
      explication: () => ["Disponibilité, intégrité, confidentialité, traçabilité : chaque mesure de sécurité protège l'une de ces propriétés, parfois plusieurs."],
    },
    {
      id: "la-grille",
      objectifs: [2],
      type: "a-completer",
      titre: "La criticité de chaque risque",
      question: () => "La démarche de sécurisation commence par évaluer les risques. Le président et son prestataire ont noté la probabilité et la gravité de chaque risque, de 1 à 4. Complétez la criticité : la probabilité multipliée par la gravité.",
      grille: () => grilleACompleter(),
      explication: () => {
        const r = risqueLePlusCritique();
        return [`Le risque le plus critique est « ${r.libelle.charAt(0).toLowerCase()}${r.libelle.slice(1)} », à ${qte(criticite(r))} points : il est probable, et il bloque la facturation. La grille dit par où commencer.`];
      },
    },
    {
      id: "par-ou-commencer",
      objectifs: [2],
      type: "choix",
      titre: "Par où commencer ?",
      question: () => "Le hameçonnage et le rançongiciel ont la même criticité. Que montre la grille de leurs différences ?",
      options: () => [
        { texte: "L'un est fréquent mais limité, l'autre rare mais grave", juste: true, retour: "Oui : à criticité égale, les mesures diffèrent. Contre le hameçonnage, fréquent, on forme les salariés ; contre le rançongiciel, grave, on prépare de quoi repartir." },
        { texte: "Rien : à criticité égale, il suffit de traiter l'un des deux et d'oublier l'autre", juste: false, retour: "Non : les deux sont à traiter. La grille classe, elle ne dispense de rien." },
        { texte: "Que le rançongiciel ne peut pas arriver", juste: false, retour: "Non : sa probabilité est faible, pas nulle." },
      ],
    },
    {
      id: "les-mesures",
      objectifs: [2],
      type: "tri",
      titre: "Prévenir, détecter, repartir",
      question: () => "Rangez chaque mesure selon ce qu'elle fait.",
      categories: [
        { code: "prevenir", libelle: "Empêcher l'attaque" },
        { code: "detecter", libelle: "Détecter l'attaque" },
        { code: "repartir", libelle: "Repartir après l'attaque" },
      ],
      elements: () => [
        { libelle: "Un mot de passe solide et un code reçu sur le téléphone", montant: 0, categorie: "prevenir", pourquoi: "L'authentification à 2 facteurs ferme la porte, même si le mot de passe a fui." },
        { libelle: "Installer les mises à jour dès leur sortie", montant: 0, categorie: "prevenir", pourquoi: "Les mises à jour corrigent les failles que les pirates exploitent." },
        { libelle: "Une alerte à chaque connexion depuis un pays inhabituel", montant: 0, categorie: "detecter", pourquoi: "Elle signale l'intrusion pendant qu'elle a lieu." },
        { libelle: "Une sauvegarde chaque nuit, gardée hors ligne", montant: 0, categorie: "repartir", pourquoi: "Elle permet de restaurer les données chiffrées par les pirates." },
      ],
      relance: "La mesure agit-elle avant, pendant, ou après l'attaque ?",
      explication: () => ["Aucune mesure ne suffit seule. Une démarche de sécurité empile les 3 : réduire la probabilité, voir vite, et réduire la gravité."],
    },
    {
      id: "la-sauvegarde",
      objectifs: [2],
      type: "choix",
      titre: "Où garder la sauvegarde ?",
      question: (c) => `${c.entreprise} sauvegarde le serveur du site sur un disque branché en permanence au même serveur. Que lui conseillez-vous ?`,
      options: () => [
        { texte: "Garder aussi une copie hors ligne, hors des locaux", juste: true, retour: "Oui : un rançongiciel chiffre tout ce qui est branché, la sauvegarde comprise ; un incendie détruit tout ce qui est dans les murs. Une copie déconnectée et ailleurs survit aux deux." },
        { texte: "Rien : une sauvegarde branchée au serveur se fait toute seule, c'est la plus sûre", juste: false, retour: "Non : ce qui est toujours branché tombe avec le serveur." },
        { texte: "Arrêter de sauvegarder, l'hébergeur s'en charge", juste: false, retour: "Non : sans copie à soi, NOVA dépend entièrement de lui." },
      ],
    },
    {
      id: "le-curseur-du-plan",
      objectifs: [3],
      type: "curseur",
      titre: "Ce que doit éviter le plan de sauvegarde",
      question: () => {
        const j = unJourDArret();
        return `Un jour d'arrêt du site fait perdre la marge des ventes d'un jour de mai : ${qte(j.ventesParJour)} enceintes à ${eur(j.marge)}, soit ${eur(j.cout)}. Le plan de sauvegarde et de reprise coûte ${eur(PLAN_DE_SAUVEGARDE.parAn)} par an. Faites varier les jours d'arrêt qu'il évite dans l'année. Placez le curseur sur le premier nombre de jours qui le paie.`;
      },
      cible: () => ({ attendu: joursQuiPaientLePlan(), max: 15 }),
      grandeur: () => ({ libelle: "Jours d'arrêt du site évités dans l'année", unite: "jours" }),
      rates: () => ({ dessous: "Pas encore : le plan coûte plus que les arrêts évités.", dessus: "Le plan est payé, mais un jour de moins suffisait-il déjà ?" }),
      zones: ["Plan payé", "Plan non payé"],
      montrer: "Montrer le nombre de jours",
      lecture: (_c, n) => [
        { libelle: "Ce que valent les jours d'arrêt évités", montant: valeurDesJoursDArretEvites(n), fort: true },
        { libelle: "Prix du plan de l'année", montant: PLAN_DE_SAUVEGARDE.parAn },
      ],
      droites: () => ({ produit: (n) => valeurDesJoursDArretEvites(n), cout: () => PLAN_DE_SAUVEGARDE.parAn, libelles: ["Arrêts évités", "Prix du plan"] }),
      explication: () => [`Le plan se paie dès ${qte(joursQuiPaientLePlan())} jours d'arrêt évités. Sans sauvegarde, un rançongiciel arrête un site bien plus longtemps, et les données perdues ne se rachètent pas.`],
    },
    {
      id: "le-rgpd",
      type: "lecture",
      titre: "La protection des données personnelles",
      texte: () => [
        "Le règlement général sur la protection des données (RGPD) s'applique à toute organisation qui traite des données personnelles. Elle ne collecte que ce dont elle a besoin, pour un but précis et annoncé, le garde un temps limité, et le protège. Elle tient le registre de ses traitements.",
        "Chaque personne a des droits : accéder à ses données, les faire rectifier ou effacer, s'opposer à un traitement, les emporter ailleurs. La CNIL contrôle ; l'amende peut atteindre 20 millions d'euros ou 4 % du chiffre d'affaires annuel mondial.",
      ],
      repere: () => "RGPD : un but précis, le strict nécessaire, une durée limitée, la sécurité · les droits des personnes · la CNIL contrôle et sanctionne.",
    },
    {
      id: "conforme-ou-non",
      objectifs: [4],
      type: "tri",
      titre: "Ce que le règlement permet",
      question: (c) => `Rangez chaque pratique du site de ${c.entreprise}.`,
      categories: [
        { code: "conforme", libelle: "Conforme" },
        { code: "non-conforme", libelle: "Non conforme" },
      ],
      elements: () => [
        { libelle: "Ne demander que l'adresse de livraison et le courriel", montant: 0, categorie: "conforme", pourquoi: "Le strict nécessaire pour livrer et confirmer la commande." },
        { libelle: "Envoyer la lettre d'information aux seuls clients qui l'ont acceptée", montant: 0, categorie: "conforme", pourquoi: "La prospection par courriel des particuliers demande leur accord." },
        { libelle: "Effacer les données d'une cliente qui le demande", montant: 0, categorie: "conforme", pourquoi: "Le droit à l'effacement, dans la limite des obligations comptables." },
        { libelle: "Demander la date de naissance pour livrer une enceinte", montant: 0, categorie: "non-conforme", pourquoi: "Elle ne sert pas à livrer : une donnée de trop." },
        { libelle: "Garder sans limite les données des clients partis", montant: 0, categorie: "non-conforme", pourquoi: "Une durée de conservation se fixe et se respecte." },
      ],
      relance: "La donnée sert-elle le but annoncé, et la personne garde-t-elle la main dessus ?",
      explication: () => ["Le règlement ne défend pas de traiter des données : il demande de le faire pour un but clair, avec le moins de données possible, et sous le contrôle des personnes."],
    },
    {
      id: "la-solution-technique",
      objectifs: [4],
      type: "choix",
      titre: "Une solution technique",
      question: () => "Le règlement demande de protéger les données. Quelle solution technique rend le fichier des clients illisible si le serveur est volé ?",
      options: () => [
        { texte: "Chiffrer la base de données", juste: true, retour: "Oui : sans la clé, les données volées sont illisibles. S'y ajoutent des droits d'accès limités à ceux qui en ont besoin, et un journal des accès." },
        { texte: "Écrire « confidentiel » en tête du fichier des clients", juste: false, retour: "Non : une mention ne protège rien, le voleur la lira avec le reste." },
        { texte: "Donner le même mot de passe à tous les salariés, pour qu'aucun ne l'oublie", juste: false, retour: "Non : un mot de passe partagé fuit plus vite, et on ne sait plus qui s'est connecté." },
      ],
    },
    {
      id: "les-menaces",
      type: "lecture",
      titre: "Les menaces du cyberespace",
      texte: () => [
        "L'hameçonnage imite un courriel connu pour voler un mot de passe. Le rançongiciel chiffre les données et demande une rançon. L'attaque par déni de service sature un site pour le rendre inaccessible. La fraude au président imite un dirigeant pour obtenir un virement urgent.",
        "La cybersécurité ajoute à la sécurité du système d'information la défense contre ces actes malveillants. Le dispositif national cybermalveillance.gouv.fr aide les victimes, et une plainte se dépose à la police ou à la gendarmerie.",
      ],
      repere: () => "Hameçonnage · rançongiciel · déni de service · fraude au président · cybermalveillance.gouv.fr · plainte.",
    },
    {
      id: "le-faux-courriel",
      objectifs: [5],
      type: "choix",
      titre: "Le courriel de l'hébergeur",
      question: () => "L'opérateur a reçu le courriel « de l'hébergeur » : son compte serait bloqué s'il ne confirme pas son mot de passe dans l'heure, par un lien. Que doit-il faire ?",
      options: () => [
        { texte: "Ne pas cliquer, vérifier par un autre moyen et le signaler", juste: true, retour: "Oui : l'urgence et le lien sont les marques de l'hameçonnage. On vérifie en appelant l'hébergeur au numéro connu, et on prévient le président." },
        { texte: "Cliquer et confirmer le mot de passe, pour ne pas bloquer le site de l'entreprise", juste: false, retour: "Non : c'est exactement ce que veulent les pirates." },
        { texte: "Répondre au courriel pour demander s'il est vrai", juste: false, retour: "Non : l'expéditeur, s'il est faux, dira qu'il est vrai." },
      ],
    },
    {
      id: "le-rancongiciel",
      objectifs: [5],
      type: "choix",
      titre: "Un rançongiciel",
      question: () => "Un matin, l'écran du serveur demande une rançon pour rendre les données. Que fait le président ?",
      options: () => [
        { texte: "Isoler le serveur, porter plainte, restaurer la sauvegarde", juste: true, retour: "Oui : on débranche pour que l'attaque ne s'étende pas, on garde les traces, on porte plainte et on repart de la sauvegarde. Si des données de clients ont fui, il notifie la CNIL dans les meilleurs délais, si possible sous 72 heures." },
        { texte: "Payer vite la rançon, c'est le seul moyen de retrouver les données des clients", juste: false, retour: "Non : payer ne garantit rien, et finance les pirates. Le dispositif national conseille de ne pas payer." },
        { texte: "Éteindre et rallumer le serveur, puis attendre", juste: false, retour: "Non : les données restent chiffrées, et les preuves risquent de disparaître." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Le numérique fait courir des risques à ${c.entreprise}, à ses clients et à l'environnement. La sécurité protège la disponibilité, l'intégrité, la confidentialité et la traçabilité des données ; la grille des risques dit par où commencer ; le plan de sauvegarde se paie dès ${qte(joursQuiPaientLePlan())} jours d'arrêt évités. Le RGPD impose le strict nécessaire, une durée limitée et la sécurité des données.`,
        "Dans l'arène, vos décisions et vos comptes sont des données : qui, dans votre équipe, peut les voir, et qui peut les changer ?",
      ],
      repere: () => "Risques · disponibilité, intégrité, confidentialité, traçabilité · criticité · prévenir, détecter, repartir · sauvegarde hors ligne · RGPD · hameçonnage, rançongiciel.",
    },
  ],
};
