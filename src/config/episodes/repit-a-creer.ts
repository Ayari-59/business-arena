/**
 * LE RÉPIT À CRÉER : le contenu de l'épisode.
 *
 * Alix Fournier fait des soins à domicile pour l'Association Solvanne, à
 * Dijon, et veut créer un accueil de répit : une demi-journée où la personne
 * aidée est accueillie, pendant que l'aidant souffle. On joue la personne qui
 * porte le projet, de l'intention à la création : vérifier le besoin, choisir
 * une forme, réunir les acteurs, bâtir un calendrier, calculer un modèle
 * économique simple, mesurer l'utilité sociale.
 *
 * Le niveau est celui de la seconde : des phrases courtes, des mots concrets,
 * et une prévision qui se fait par une seule multiplication.
 *
 * Chaque chiffre qu'une source donne au joueur se lit dans les constantes du
 * modèle. Les sources portent leur NATURE (décisive, utile, bruit, aide), que
 * le joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import {
  COUT_DEMI_JOURNEE,
  COUT_PAR_PERSONNE,
  ENVELOPPE,
  FAMILLES_SUIVIES,
  FORME,
  HEURES_PAR_DEMI_JOURNEE,
  LOYER_SALLE,
  MECENE_LOCAL,
  MODELE,
  PLACES_PAR_DEMI_JOURNEE,
  SUBVENTION,
  SUBVENTION_SUIVANTE,
  VALEUR_HEURE,
} from "@/engine/episodes/repit-a-creer";
import { euros } from "./format";
import type { Etape } from "./types";

const SABINE = {
  de: "Sabine Vautrin",
  role: "Responsable de l'aide à domicile, Solvanne",
} as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice financière, Solvanne",
} as const;
const BERNARD = { de: "Josiane Bernard", role: "Aidante de son mari" } as const;
const BOUVOT = {
  de: "Thierry Bouvot",
  role: "Adjoint au maire, solidarités",
} as const;
const FONDS = {
  de: "Fonds départemental des aidants",
  role: "Financeur",
} as const;
const LAMY = { de: "Gérard Lamy", role: "Bénévole" } as const;
const TABLEAU = {
  de: "Tableau de bord du projet",
  role: "Point de la semaine",
} as const;

/** La participation demandée aux familles dans le modèle calculé. */
const PARTICIPATION = MODELE[1].participation;

export const DIAGNOSTICS = [
  {
    id: "besoin",
    t: "Tout dépendra de la réponse au vrai besoin des familles : les bons jours, les bons horaires, le transport",
  },
  { id: "argent", t: "Tout dépendra de l'argent trouvé pour démarrer" },
  { id: "salle", t: "Il faut d'abord trouver une belle salle" },
  { id: "publicite", t: "Il faut surtout faire de la publicité" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une idée chez les familles",
    jusqua: 2,
    messages: () => [
      {
        ...BERNARD,
        heure: "10:30",
        alerte: true,
        texte:
          "Je ne sors plus. Mon mari ne peut pas rester seul, alors je reste avec lui, tout le temps. Je n'ai pas eu une après-midi à moi depuis un an.",
      },
      {
        ...SABINE,
        heure: "14:00",
        texte: `Alix, ton idée d'accueil de répit me plaît. Solvanne te confie ${euros(ENVELOPPE)} pour démarrer. Dis-moi vendredi par où tu commences.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "familles",
        titre: "Parler du projet à trois familles pendant les tournées",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Mme Bernard : « Le mardi, c'est mon jour de courses. Ce qu'il me faudrait, c'est le samedi après-midi. Et je n'ai pas de voiture. » Les deux autres familles disent la même chose : le samedi, et un transport.",
      },
      {
        id: "dossiers",
        titre: "Compter les aidants épuisés dans les dossiers du service",
        cout: 1,
        nature: "decisive",
        resultat: `Le service suit ${FAMILLES_SUIVIES} familles dans le quartier. Dans les dossiers, environ une famille sur quatre a un aidant qui dit être épuisé.`,
      },
      {
        id: "paris",
        titre: "Regarder ce que font les grands accueils de jour à Paris",
        cout: 1,
        nature: "bruit",
        resultat:
          "À Paris, un grand accueil de jour ouvre cinq jours par semaine, dans un bâtiment neuf.",
      },
      {
        id: "couts",
        titre: "Demander à Eudoxie ce que coûte une demi-journée d'accueil",
        cout: 0.5,
        nature: "utile",
        resultat: `Eudoxie : « Une salariée pour une demi-journée : environ ${euros(COUT_DEMI_JOURNEE)}. Le goûter et le petit matériel : ${euros(COUT_PAR_PERSONNE)} par personne. Une salle louée : ${euros(LOYER_SALLE)} par semaine. »`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Sabine",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Sabine : « Avant d'acheter quoi que ce soit, va voir les familles. Ce sont elles qui te diront si elles viendront. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment vérifiez-vous le besoin des familles ?",
    options: [
      {
        t: "Mettre un sondage en ligne sur le site de Solvanne, pour aller vite",
        d: "Il touche beaucoup de monde en quelques jours.",
      },
      {
        t: "Rencontrer quinze familles et leur demander ce qui les aiderait",
        d: "Chez elles, pendant les tournées : deux semaines de rendez-vous.",
      },
      {
        t: "Demander l'avis de la directrice, qui connaît très bien le quartier",
        d: "Une heure de rendez-vous. Elle a vingt ans d'expérience.",
      },
      {
        t: "Ne rien vérifier : le besoin est évident, autant gagner du temps",
        d: "Tout le monde sait que les aidants sont fatigués.",
      },
    ],
    reactions: [
      [
        {
          ...SABINE,
          texte:
            "Le sondage dit oui à 90 %. Mais personne n'a dit quel jour ni à quelle heure.",
        },
      ],
      [
        {
          ...BERNARD,
          texte:
            "Pour une fois, on est venu chez moi me demander mon avis. Le samedi, je viendrai.",
        },
      ],
      [
        {
          ...SABINE,
          texte:
            "La directrice pense que le mardi matin serait bien. C'est un avis, pas une enquête.",
        },
      ],
      [
        {
          ...SABINE,
          texte:
            "Sais-tu vraiment ce que veulent les familles ? Personne ne leur a demandé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Choisir la forme du projet",
    jusqua: 4,
    messages: () => [
      {
        ...EUDOXIE,
        heure: "11:00",
        alerte: true,
        texte:
          "Alix, avant de signer quoi que ce soit, il faut savoir qui porte le projet : qui assure, qui paie, qui encaisse.",
      },
      {
        ...BOUVOT,
        heure: "16:30",
        texte:
          "La mairie aime l'idée. Une coopérative avec la commune ? Il faudrait un vote du conseil municipal.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "formes",
        titre: "Comparer les trois formes avec Eudoxie",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un service de Solvanne peut ouvrir dès la semaine ${FORME[0].disponible} : l'assurance, la comptabilité et les salariés existent déjà. Une association nouvelle demande des statuts, une assemblée, une déclaration et un compte : pas avant la semaine ${FORME[1].disponible}. Une coopérative avec la commune : pas avant la semaine ${FORME[2].disponible}.`,
      },
      {
        id: "assurance",
        titre: "Demander à l'assureur de Solvanne ce qu'il couvre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'assurance de Solvanne couvre ses services et ses bénévoles. Un groupe d'amis sans forme n'est couvert par personne, et aucun financeur ne lui verse d'argent.",
      },
    ],
    question: "Sous quelle forme portez-vous le projet ?",
    options: [
      {
        t: "En faire un service de Solvanne, avec ses moyens",
        d: "Solvanne assure, tient les comptes et prête ses salariés.",
      },
      {
        t: "Créer une association nouvelle, pour tout décider sans Solvanne",
        d: "Ses propres statuts, son bureau, son compte en banque.",
      },
      {
        t: "Créer une coopérative avec la commune, qui apporterait de l'argent",
        d: "La mairie entre au capital, après un vote du conseil municipal.",
      },
      {
        t: "Commencer entre amis, sans forme, pour ouvrir plus tôt",
        d: "Pas de papiers à remplir. On verra la forme plus tard.",
      },
    ],
    reactions: [
      [
        {
          ...EUDOXIE,
          texte:
            "Le service est créé. L'assurance et la comptabilité suivent : tu peux avancer.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Les statuts sont rédigés. Il faut maintenant l'assemblée, la déclaration, la banque.",
        },
      ],
      [
        {
          ...BOUVOT,
          texte:
            "Le conseil municipal se réunit dans deux mois. Nous voterons à ce moment-là.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Sans forme, pas d'assurance et pas de compte. Aucun financeur ne pourra vous aider.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Réunir les acteurs",
    jusqua: 6,
    messages: () => [
      {
        ...LAMY,
        heure: "09:20",
        alerte: true,
        texte:
          "J'ai entendu parler de votre projet au club des aînés. Je suis à la retraite, j'ai du temps. Avec quelques amis, on pourrait aider.",
      },
      {
        ...FONDS,
        heure: "15:10",
        texte: `Le fonds peut aider des projets pour les aidants, jusqu'à ${euros(SUBVENTION)} pour démarrer. Nous regardons d'abord si le besoin est démontré, et qui soutient le projet.`,
      },
    ],
    sources: [
      {
        id: "acteurs",
        titre: "Faire la liste de ce que chacun peut apporter",
        cout: 0.5,
        nature: "decisive",
        resultat: `La mairie a une salle libre le samedi, qu'elle peut prêter. Des bénévoles formés permettent d'ouvrir plus de demi-journées : ${PLACES_PAR_DEMI_JOURNEE} personnes par demi-journée. Le fonds finance plus volontiers un projet que la mairie et des bénévoles soutiennent déjà.`,
      },
      {
        id: "formation",
        titre: "Demander à Sabine ce qu'il faut à un bénévole",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sabine : « Une demi-journée de formation : les gestes de sécurité, comment parler à une personne désorientée, qui appeler en cas de problème. Sans elle, un bénévole peut mettre quelqu'un en danger. »",
      },
    ],
    question: "Comment réunissez-vous les acteurs du projet ?",
    options: [
      {
        t: "Écrire aux financeurs pour demander une subvention, sans les voir",
        d: "Un dossier bien rédigé, envoyé par la poste.",
      },
      {
        t: "Tout faire vous-même, pour ne dépendre de personne et aller vite",
        d: "Pas de réunion, pas d'attente : vous avancez à votre rythme.",
      },
      {
        t: "Réunir la mairie, les bénévoles et le fonds autour du projet",
        d: "Une réunion, avec ce que les familles ont dit. Puis une formation pour les bénévoles.",
      },
      {
        t: "Recruter des bénévoles sur les réseaux sociaux, et commencer vite",
        d: "Beaucoup de réponses en quelques jours. Pas le temps de les former.",
      },
    ],
    reactions: [
      [
        {
          ...FONDS,
          texte:
            "Nous avons reçu votre dossier. Nous ne savons pas qui d'autre soutient le projet.",
        },
      ],
      [
        {
          ...SABINE,
          texte:
            "Tu fais tout, mais tu ne pourras ouvrir que deux demi-journées par semaine.",
        },
      ],
      [
        {
          ...BOUVOT,
          texte:
            "La salle du samedi est à vous. Et les bénévoles de M. Lamy sont formés lundi.",
        },
      ],
      [
        {
          ...LAMY,
          texte:
            "Des inconnus sont venus. Personne ne leur a expliqué quoi faire.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le calendrier d'ouverture",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...SABINE,
        heure: "17:00",
        alerte: true,
        texte:
          "Alix, les familles demandent quand l'accueil ouvre. Il faut une date.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Argent dans la caisse du projet : ${ctx.caisse}.`,
      },
    ],
    sources: [
      {
        id: "liste",
        titre:
          "Faire la liste de tout ce qui doit être prêt le jour de l'ouverture",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La salle, l'assurance, les bénévoles formés, le goûter, et surtout les familles prévenues par les soignants, qui les connaissent. Tout cela prend environ trois semaines.",
      },
      {
        id: "soignants",
        titre: "Demander aux soignants comment ils orientent les familles",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les familles font confiance à leur soignant. Si le soignant ne connaît pas l'accueil, il n'en parle pas, et la famille ne vient pas.",
      },
    ],
    question: "Comment fixez-vous la date d'ouverture ?",
    options: [
      {
        t: "Ouvrir dès la semaine prochaine, et régler les détails ensuite",
        d: "Les familles attendent. On ajustera en marchant.",
      },
      {
        t: "Attendre que tout soit parfait, même si cela prend des semaines",
        d: "Aucun risque d'ouvrir à moitié prêt.",
      },
      {
        t: "Fixer une date et l'afficher à la mairie, sans passer par les soignants",
        d: "Une affiche à la mairie, une date, et c'est parti.",
      },
      {
        t: "Partir de la date d'ouverture et remonter, étape par étape",
        d: "La salle, l'assurance, les bénévoles formés, les soignants prévenus : chaque étape a sa semaine.",
      },
    ],
    reactions: [
      [
        {
          ...LAMY,
          texte:
            "On a ouvert, mais il manquait le goûter, et les familles ne savaient pas qu'on était là.",
        },
      ],
      [
        {
          ...BERNARD,
          texte:
            "Toujours pas ouvert ? J'avais tellement besoin de cette après-midi.",
        },
      ],
      [
        {
          ...SABINE,
          texte:
            "Les soignants découvrent l'affiche en même temps que les familles. Ils n'en parlent pas.",
        },
      ],
      [
        {
          ...SABINE,
          texte:
            "Les soignants ont prévenu leurs familles, les bénévoles sont formés : tout est prêt pour le jour J.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le modèle économique",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...EUDOXIE,
        heure: "10:00",
        alerte: true,
        texte: `Alix, combien les familles paieront-elles ? Et qui paie le reste ? Une demi-journée coûte environ ${euros(COUT_DEMI_JOURNEE)}, sans le goûter.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Familles accueillies cette semaine : ${ctx.familles}. Argent dans la caisse : ${ctx.caisse}.`,
      },
    ],
    sources: [
      {
        id: "seuil",
        titre: "Calculer le seuil : combien de familles pour couvrir les coûts",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une demi-journée de ${PLACES_PAR_DEMI_JOURNEE} places coûte ${euros(COUT_DEMI_JOURNEE)}, plus ${euros(COUT_PAR_PERSONNE)} par personne. Avec ${euros(PARTICIPATION)} par famille, une subvention et un mécène local de ${euros(MECENE_LOCAL)}, l'accueil tient. Un prix qui couvrirait tout serait trop cher pour beaucoup de familles.`,
      },
      {
        id: "financeurs",
        titre: "Demander au fonds ce qu'il attend pour l'an prochain",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le fonds aime les projets où les familles participent un peu, et où l'argent ne vient pas d'un seul donateur : un projet qui dépend d'un seul payeur s'arrête quand il part.",
      },
    ],
    question: "Quel modèle économique choisissez-vous ?",
    options: [
      {
        t: "Un accueil gratuit pour toutes les familles, payé par les subventions",
        d: "Personne n'est arrêté par le prix.",
      },
      {
        t: "Une petite participation, une subvention et un mécène local",
        d: `${euros(PARTICIPATION)} la demi-journée par famille, le reste payé par la subvention et le mécène. Le seuil est calculé.`,
      },
      {
        t: "Un prix qui couvre tous les coûts, pour ne dépendre de personne",
        d: "Environ trois fois plus cher que la participation calculée. Le projet se finance seul.",
      },
      {
        t: "Tout faire financer par la grande surface du quartier, qui est d'accord",
        d: "Un seul mécène, généreux. Plus besoin de chercher ailleurs.",
      },
    ],
    reactions: [
      [
        {
          ...LAMY,
          texte:
            "Gratuit, c'est bien. Mais des familles réservent et ne viennent pas : les places restent vides.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le seuil est atteint : la participation, la subvention et le mécène couvrent les coûts.",
        },
      ],
      [
        {
          ...BERNARD,
          texte:
            "C'est trop cher pour nous. Je ne pourrai venir qu'une fois par mois.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte: "Un seul payeur, c'est confortable. Tant qu'il reste.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Mesurer l'utilité sociale",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...FONDS,
        heure: "11:00",
        alerte: true,
        texte: `Pour renouveler notre aide l'an prochain, ${euros(SUBVENTION_SUIVANTE)}, nous vous demanderons de montrer ce que l'accueil a changé pour les aidants.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Heures de répit offertes depuis l'ouverture : ${ctx.heures}.`,
      },
    ],
    sources: [
      {
        id: "utilite",
        titre: "Demander au fonds ce qu'il appelle « utilité sociale »",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le fonds veut savoir combien d'heures de répit les aidants ont eues, combien de familles ont été aidées, et si les aidants sont moins épuisés qu'avant. Une demi-journée, c'est ${HEURES_PAR_DEMI_JOURNEE} heures de répit ; Solvanne compte chaque heure comme une heure d'aide à domicile, ${euros(VALEUR_HEURE)}.`,
      },
      {
        id: "questionnaire",
        titre: "Regarder le questionnaire de fatigue des aidants",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un questionnaire de cinq questions, rempli à l'arrivée puis un mois après. Il prend deux minutes, et montre si la fatigue baisse.",
      },
    ],
    question: "Comment mesurez-vous l'utilité de l'accueil ?",
    options: [
      {
        t: "Compter les passages : le nombre de visites dit tout",
        d: "Un cahier à l'entrée, une ligne par visite.",
      },
      {
        t: "Raconter de belles histoires de familles dans le journal local",
        d: "Des portraits qui touchent les lecteurs, et les élus.",
      },
      {
        t: "Suivre trois chiffres : heures, familles, fatigue des aidants",
        d: "Un tableau simple, et le questionnaire de fatigue à l'arrivée puis un mois après.",
      },
      {
        t: "Payer un cabinet pour une étude d'impact complète",
        d: "Un rapport sérieux, avec graphiques. Il coûte une partie de la caisse.",
      },
    ],
    reactions: [
      [
        {
          ...FONDS,
          texte: "Des passages, d'accord. Mais les aidants vont-ils mieux ?",
        },
      ],
      [
        {
          ...FONDS,
          texte:
            "Les portraits sont émouvants. Il nous faut aussi des chiffres.",
        },
      ],
      [
        {
          ...FONDS,
          texte:
            "Les aidants disent être moins épuisés, et les heures sont comptées : c'est ce que nous voulions voir.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le rapport est très complet. Il a coûté presque autant qu'un mois d'accueil.",
        },
      ],
    ],
  },
];

/** La prévision de la semaine 1 : une seule multiplication, les familles suivies par la part d'aidants épuisés. */
export const PREVISION = { familles: FAMILLES_SUIVIES, unSur: 4 } as const;

/** Les trois manières de faire auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Écouter, s'appuyer, calculer", chemin: [1, 0, 2, 3, 1, 2] },
  { nom: "Aller vite, et seul", chemin: [0, 3, 3, 0, 3, 1] },
  { nom: "Ne rien préparer", chemin: [3, 3, 1, 0, 0, 0] },
] as const;

/**
 * Les réponses réflexes : ouvrir sans vérifier, sans forme, tout seul,
 * tout de suite, gratuitement, et compter les passages. [décision, option].
 */
export const REFLEXES = [
  [0, 3],
  [1, 3],
  [2, 1],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  subvention: `Le fonds départemental accorde ${euros(SUBVENTION)} pour démarrer l'accueil.`,
  incident:
    "Un monsieur accueilli a fait une chute dans la salle. Il va bien, mais l'accueil ferme deux semaines, le temps de tout revoir.",
  retrait:
    "La grande surface change de priorité et arrête son aide. Sans autre financeur, l'accueil doit fermer.",
} as const;
