import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { CONSULTANTS } from "../monde/atlas-conseil";
import {
  COUT_D_UNE_JOURNEE,
  ENTREPRISES_DE_LA_COMMUNICATION_INTERNE,
  HEURES_D_UNE_JOURNEE,
  OUTIL_COLLABORATIF,
  minutesQuiPaientLOutil,
  valeurDesMinutes,
} from "../monde/communication-interne-d-atlas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : COMMUNICATION INTERNE ET MARQUE EMPLOYEUR (Bac STMG, enseignement spécifique de ressources
 * humaines et communication de terminale, thème 3, question 3.3 : « Comment la communication
 * participe-t-elle à la cohésion de l'organisation ? »).
 *
 * Les finalités de la communication interne (informer, fédérer, faire coopérer), ses outils (intranet,
 * réseau social d'entreprise, outils collaboratifs, réunions) et leurs risques (surcharge, connexion
 * permanente, droit à la déconnexion), ce qu'un outil doit faire gagner (le curseur), la marque employeur
 * en interne et en externe (salariés ambassadeurs, avis en ligne), et le lien entre communication et
 * cohésion. « Communiquer avec chaque acteur » (partie commune, 2.3), qui cite ce thème en second, traite
 * les formes de la communication, la communication externe et financière, et l'e-réputation.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez ATLAS CONSEIL : monde/communication-interne-d-atlas.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const COMMUNICATION_INTERNE_ET_MARQUE_EMPLOYEUR: Chapitre = {
  code: "communication-interne-et-marque-employeur",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social"],
  titre: "Communication interne et marque employeur",
  accroche:
    "Des consultants qui passent leurs semaines chez les clients et ne se croisent plus. Ce que la communication interne doit faire, avec quels outils, ce qu'un outil doit faire gagner, et l'image que le cabinet donne de lui comme employeur.",
  objectifs: [
    "Reconnaître les finalités de la communication interne",
    "Choisir un outil de communication interne et en maîtriser les risques",
    "Chiffrer ce qu'un outil collaboratif doit faire gagner",
    "Construire la marque employeur, en interne et en externe",
    "Relier la communication et la cohésion",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_COMMUNICATION_INTERNE,
    pourquoi: "ce chapitre suit la communication entre les consultants d'ATLAS CONSEIL, dispersés chez leurs clients.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une équipe dispersée",
      texte: (c) => [
        `Les ${qte(CONSULTANTS.nombre)} consultants ${dE(c.entreprise)} passent leurs semaines chez leurs clients. Ils ne se croisent plus qu'au détour d'un couloir, apprennent les nouvelles par hasard, et deux d'entre eux ont démissionné cette année, en disant qu'ils se sentaient seuls.`,
        "La communication interne s'adresse aux membres de l'organisation. Elle ne se limite pas à transmettre des consignes : elle fait partager les objectifs, relie les personnes et les aide à travailler ensemble. Elle fait la cohésion.",
      ],
      repere: () => "Communication interne : informer, fédérer, faire coopérer les membres de l'organisation.",
    },
    {
      id: "les-finalites",
      objectifs: [0],
      type: "tri",
      titre: "Informer, fédérer, coopérer",
      question: () => "Rangez chaque message selon ce qu'il cherche d'abord.",
      categories: [
        { code: "informer", libelle: "Informer" },
        { code: "federer", libelle: "Fédérer" },
        { code: "cooperer", libelle: "Faire coopérer" },
      ],
      elements: () => [
        { libelle: "La note sur les nouvelles règles de frais de mission", montant: 0, categorie: "informer", pourquoi: "Elle transmet une règle : informer." },
        { libelle: "La directrice raconte la mission la plus réussie de l'année et remercie l'équipe", montant: 0, categorie: "federer", pourquoi: "Elle donne de la fierté et un sentiment d'appartenance : fédérer." },
        { libelle: "Un fil où les consultants partagent leurs modèles de rapport", montant: 0, categorie: "cooperer", pourquoi: "Chacun profite du travail des autres : faire coopérer." },
      ],
      relance: "Le message transmet-il une règle, donne-t-il envie d'appartenir au cabinet, ou aide-t-il à travailler ensemble ?",
      explication: () => ["Une communication interne qui ne fait qu'informer laisse chacun seul avec ses consignes : fédérer et faire coopérer créent les liens."],
    },
    {
      id: "les-outils",
      type: "lecture",
      titre: "Les outils de la communication interne",
      texte: () => [
        "L'intranet, le site réservé aux salariés, publie les informations et les documents de référence : il sert surtout la communication descendante. Le réseau social d'entreprise permet à chacun de publier, de commenter, de former des communautés : la communication devient horizontale. Les outils collaboratifs (documents partagés, messagerie instantanée, visioconférence) font travailler ensemble à distance.",
        "Ils ont leurs risques : la surcharge de messages, la connexion permanente, la fuite d'informations confidentielles des clients. Des règles d'usage, une charte, et le droit à la déconnexion les limitent. Les rencontres en personne restent irremplaçables.",
      ],
      repere: () => "Intranet · réseau social d'entreprise · outils collaboratifs · réunions · surcharge, déconnexion, confidentialité.",
    },
    {
      id: "quel-outil",
      objectifs: [1],
      type: "tri",
      titre: "Quel outil pour quel usage ?",
      question: () => "Rangez chaque usage selon l'outil qui lui convient le mieux.",
      categories: [
        { code: "intranet", libelle: "Intranet" },
        { code: "reseau", libelle: "Réseau social d'entreprise" },
        { code: "collaboratif", libelle: "Outil collaboratif" },
        { code: "reunion", libelle: "Rencontre en personne" },
      ],
      elements: () => [
        { libelle: "Le guide des procédures du cabinet, toujours à jour", montant: 0, categorie: "intranet", pourquoi: "Un document de référence, publié par la direction : l'intranet." },
        { libelle: "Une question posée à tous : « qui a déjà audité un hôpital ? »", montant: 0, categorie: "reseau", pourquoi: "Chacun peut répondre, et la réponse sert à tous : le réseau social d'entreprise." },
        { libelle: "Un rapport rédigé à trois, chacun chez un client différent", montant: 0, categorie: "collaboratif", pourquoi: "Un document partagé, modifié à plusieurs : l'outil collaboratif." },
        { libelle: "Annoncer à l'équipe la perte d'un grand client, et en discuter", montant: 0, categorie: "reunion", pourquoi: "Une nouvelle difficile se dit en face, pour répondre aux questions." },
      ],
      relance: "S'agit-il de publier une référence, d'interroger tout le monde, de produire ensemble, ou d'annoncer ce qui inquiète ?",
      explication: () => ["L'outil se choisit selon le message : un outil numérique ne remplace pas une rencontre quand il faut rassurer ou débattre."],
    },
    {
      id: "la-deconnexion",
      objectifs: [1],
      type: "choix",
      titre: "Des messages à 23 heures",
      question: () => "Depuis l'arrivée de la messagerie instantanée, une consultante reçoit des messages de collègues jusqu'à 23 heures, et se sent obligée de répondre. Que fait la directrice ?",
      options: () => [
        {
          texte: "Elle fixe des règles d'usage, dont le droit à la déconnexion",
          juste: true,
          retour: "Oui : une charte dit quand l'on n'attend pas de réponse (le soir, le week-end, pendant les congés), et la direction donne l'exemple. Le droit à la déconnexion protège la santé, et la qualité des échanges.",
        },
        {
          texte: "Rien : les consultants sont autonomes, chacun s'organise comme il veut avec ses messages",
          juste: false,
          retour: "Non : sans règle commune, celui qui ne répond pas le soir passe pour moins engagé. La pression collective s'installe.",
        },
        {
          texte: "Elle supprime la messagerie pour tout le cabinet",
          juste: false,
          retour: "Non : l'outil est utile pour coopérer à distance. C'est son usage qu'il faut régler.",
        },
      ],
    },
    {
      id: "le-curseur-de-l-outil",
      objectifs: [2],
      type: "curseur",
      titre: "Ce que l'outil doit faire gagner",
      question: () => `L'outil collaboratif coûte ${eur(OUTIL_COLLABORATIF.parConsultantEtParMois)} par consultant et par mois. Une journée de consultant coûte au cabinet ${eur(COUT_D_UNE_JOURNEE)}, pour ${qte(HEURES_D_UNE_JOURNEE)} heures. Faites varier les minutes qu'il fait gagner à un consultant chaque mois (des documents retrouvés plus vite, des déplacements évités) : une droite donne ce qu'elles valent, l'autre son prix. Placez le curseur sur le premier nombre de minutes qui le paie.`,
      cible: () => ({ attendu: minutesQuiPaientLOutil(), max: 60 }),
      grandeur: () => ({ libelle: "Minutes gagnées par mois et par consultant", unite: "minutes" }),
      rates: () => ({ dessous: "Pas encore : l'outil coûte plus que le temps gagné.", dessus: "L'outil est payé, mais une minute de moins suffisait-elle déjà ?" }),
      zones: ["Outil payé", "Outil non payé"],
      montrer: "Montrer le nombre de minutes",
      lecture: (_c, n) => [
        { libelle: "Ce que valent les minutes gagnées", montant: valeurDesMinutes(n), fort: true },
        { libelle: "Prix de l'outil", montant: OUTIL_COLLABORATIF.parConsultantEtParMois },
      ],
      droites: () => ({ produit: (n) => (n * COUT_D_UNE_JOURNEE) / (HEURES_D_UNE_JOURNEE * 60), cout: () => OUTIL_COLLABORATIF.parConsultantEtParMois, libelles: ["Temps gagné", "Prix de l'outil"] }),
      explication: () => {
        const n = minutesQuiPaientLOutil();
        return [`Il suffit de ${qte(n)} minutes gagnées par mois pour payer l'outil. L'outil se justifie vite par le temps ; il ne se justifie par la cohésion que si l'équipe s'en sert vraiment.`];
      },
    },
    {
      id: "la-marque-employeur",
      type: "lecture",
      titre: "La marque employeur",
      texte: () => [
        "La marque employeur est l'image de l'organisation en tant qu'employeur, auprès de ceux qui pourraient la rejoindre et de ceux qui y travaillent. Elle aide à attirer des candidats, et à garder les salariés.",
        "Elle se construit dehors (une page carrière, des témoignages, les avis d'anciens salariés en ligne, les réseaux professionnels) et dedans (l'accueil, la reconnaissance, la communication interne). Les salariés en sont les premiers ambassadeurs : elle ne tient que si elle dit ce qu'ils vivent.",
      ],
      repere: () => "Marque employeur : attirer et fidéliser · page carrière, avis, ambassadeurs · elle doit dire vrai.",
    },
    {
      id: "attirer-ou-fideliser",
      objectifs: [3],
      type: "tri",
      titre: "Attirer ou fidéliser",
      question: () => "Rangez chaque action de marque employeur du cabinet.",
      categories: [
        { code: "attirer", libelle: "Attirer des candidats" },
        { code: "fideliser", libelle: "Fidéliser les salariés" },
      ],
      elements: () => [
        { libelle: "Une page carrière avec des vidéos des consultants en mission", montant: 0, categorie: "attirer", pourquoi: "Elle montre le métier aux candidats : attirer." },
        { libelle: "Un consultant raconte une mission sur son réseau professionnel", montant: 0, categorie: "attirer", pourquoi: "Un salarié ambassadeur, que les candidats croient plus qu'une annonce : attirer." },
        { libelle: "Un parrain pour chaque nouveau consultant pendant ses six premières semaines", montant: 0, categorie: "fideliser", pourquoi: "L'intégration fait rester : fidéliser." },
        { libelle: "Un déjeuner d'équipe chaque trimestre, au cabinet", montant: 0, categorie: "fideliser", pourquoi: "Des liens entre collègues dispersés : fidéliser." },
      ],
      relance: "L'action vise-t-elle ceux qui pourraient venir, ou ceux qui sont déjà là ?",
      explication: () => ["Attirer sans fidéliser fait tourner l'équipe ; une marque employeur sincère sert les deux."],
    },
    {
      id: "l-avis-negatif",
      objectifs: [3],
      type: "choix",
      titre: "Un avis négatif en ligne",
      question: () => "Sur un site d'avis d'employeurs, une ancienne consultante écrit qu'au cabinet « personne ne se parle ». Que fait la directrice ?",
      options: () => [
        {
          texte: "Elle répond avec calme, et change ce qui doit l'être",
          juste: true,
          retour: "Oui : une réponse courtoise et factuelle montre que le cabinet écoute, et les candidats la lisent. Mais seule une vraie amélioration (des rencontres, un outil, des règles) changera les avis suivants.",
        },
        {
          texte: "Elle fait écrire par l'équipe des avis très positifs pour noyer l'avis négatif",
          juste: false,
          retour: "Non : de faux avis trompent les candidats, et se découvrent. C'est une pratique trompeuse, qui ruine la marque employeur.",
        },
        {
          texte: "Elle l'ignore",
          juste: false,
          retour: "Non : un avis sans réponse laisse penser qu'il dit vrai, et que le cabinet ne s'en soucie pas.",
        },
      ],
    },
    {
      id: "la-cohesion",
      objectifs: [4],
      type: "choix",
      titre: "Communication et cohésion",
      question: () => "Comment la communication participe-t-elle à la cohésion d'ATLAS CONSEIL ?",
      options: () => [
        {
          texte: "En faisant circuler l'information dans tous les sens",
          juste: true,
          retour: "Oui : descendante, elle fait partager les objectifs ; ascendante, elle fait entendre le terrain ; horizontale, elle relie les collègues. Ce sentiment d'appartenance fait la cohésion, et se voit au dehors dans la marque employeur.",
        },
        {
          texte: "En multipliant les notes de la direction, pour que tout le monde soit informé de tout",
          juste: false,
          retour: "Non : trop d'informations descendantes noient l'essentiel, et ne créent aucun lien entre les consultants.",
        },
        {
          texte: "Elle n'y joue aucun rôle",
          juste: false,
          retour: "Non : des salariés qui ne se parlent pas n'ont plus de raison de rester ensemble, comme les deux démissions le montrent.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `${c.entreprise} relie ses consultants dispersés par une communication interne qui informe, fédère et fait coopérer. Chaque outil a son usage (intranet, réseau social d'entreprise, outils collaboratifs, rencontres) et ses règles, dont le droit à la déconnexion. L'outil se paie dès ${qte(minutesQuiPaientLOutil())} minutes gagnées par mois et par consultant. La marque employeur attire et fidélise, si elle dit vrai.`,
        "Dans l'arène, l'équipe se joue à plusieurs : ce que vous vous dites d'un tour à l'autre fait aussi le résultat.",
      ],
      repere: () => "Informer, fédérer, coopérer · intranet, réseau social d'entreprise, outils collaboratifs · déconnexion · marque employeur · cohésion.",
    },
  ],
};
