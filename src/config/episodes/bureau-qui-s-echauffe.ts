/**
 * LE BUREAU QUI S'ÉCHAUFFE : le contenu de l'épisode.
 *
 * Sacha Morel est en seconde professionnelle Gestion administrative,
 * transport et logistique, en apprentissage au bureau de l'agence Arvel
 * Distribution de Bourgoin-Jallieu. Avec Fabienne Tissot, gestionnaire
 * administrative, Sacha traite les factures fournisseurs, le comptoir
 * administratif et le téléphone, sous la responsabilité de Nathalie Grosjean.
 * Six décisions d'employé : une sur le circuit des factures, cinq sur la
 * manière de parler aux autres (un transporteur en colère, une collègue, sa
 * responsable, un client agacé, une remarque sur son travail).
 *
 * Le niveau est celui de la seconde professionnelle : des phrases courtes,
 * des mots concrets (facture, bon de livraison, rapprochement, avoir,
 * échéance), et une prévision qui se fait par une multiplication guidée.
 *
 * Chaque chiffre qu'une source donne au joueur se lit dans les constantes du
 * modèle. Les sources portent leur NATURE (décisive, utile, bruit, aide), que
 * le joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  APPELS_PAR_SEMAINE,
  AVOIRS_A_RECLAMER,
  COUT_HEURES_SUP,
  DOUBLE_PAIEMENT,
  EN_ATTENTE_DEPART,
  FACTURES_PAR_JOUR,
  FACTURES_PAR_SEMAINE,
  HAUSSE_DES_FACTURES,
  INDEMNITE_DE_RETARD,
  JOURS_OUVRES,
  PART_JUSTIFIEE,
  PART_QUI_PASSE_L_ECHEANCE,
  REMISE_POUR_RACCROCHER,
  SANS_BON_DEPART,
} from "@/engine/episodes/bureau-qui-s-echauffe";
import { euros, nombre, taux } from "./format";
import type { Etape } from "./types";

const NATHALIE = {
  de: "Nathalie Grosjean",
  role: "Responsable administrative",
} as const;
const FABIENNE = {
  de: "Fabienne Tissot",
  role: "Gestionnaire administrative",
} as const;
const YVAN = { de: "Yvan Rey", role: "Chef de dépôt" } as const;
const KEVIN = { de: "Kevin Lopes", role: "Vendeur comptoir" } as const;
const BRESSAN = { de: "Gilles Bressan", role: "Transports Bressan" } as const;
const CHABERT = {
  de: "Patrick Chabert",
  role: "Maçon, client de l'agence",
} as const;
const TABLEAU = {
  de: "Tableau de bord du bureau",
  role: "Point hebdomadaire",
} as const;

/** Un pourcentage entier : « 30 % ». */
const pc = (v: number) => taux(v, 0);
/** Les factures qui ont passé leur échéance la semaine dernière. */
const RETARDS_DEPART =
  (EN_ATTENTE_DEPART - FACTURES_PAR_SEMAINE) * PART_QUI_PASSE_L_ECHEANCE;

export const DIAGNOSTICS = [
  {
    id: "circuit",
    t: "Les bons de livraison restent au dépôt : sans eux, les factures ne peuvent pas être vérifiées, et elles passent leur échéance",
  },
  { id: "charge", t: "Il y a trop de factures pour deux personnes au bureau" },
  {
    id: "fournisseurs",
    t: "Les fournisseurs envoient des factures mal faites",
  },
  { id: "collegue", t: "Fabienne ne fait pas sa part du travail" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les factures s'entassent",
    jusqua: 2,
    messages: () => [
      {
        ...TABLEAU,
        role: "Alerte automatique",
        heure: "08:00",
        alerte: true,
        texte: `${EN_ATTENTE_DEPART} factures fournisseurs en attente ce matin. ${nombre(RETARDS_DEPART, 0)} ont dépassé leur échéance la semaine dernière : chacune coûte une indemnité de ${euros(INDEMNITE_DE_RETARD)}.`,
      },
      {
        ...NATHALIE,
        heure: "08:30",
        texte:
          "Sacha, les fournisseurs se plaignent : nous payons en retard. Je te confie les factures avec Fabienne. Dis-moi vendredi comment tu comptes remettre la pile à jour.",
      },
      {
        ...FABIENNE,
        heure: "09:10",
        texte:
          "Moi, je traite celles qui sont complètes. Les autres attendent. Ce n'est pas à moi d'aller courir après les bons au dépôt.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "pile",
        titre: "Trier les factures en attente",
        cout: 0.5,
        nature: "decisive",
        resultat: `${pc(SANS_BON_DEPART)} des factures qui arrivent n'ont pas leur bon de livraison. Sans lui, on ne peut pas vérifier que la marchandise est bien arrivée : la facture reste sur la pile, et ce sont ces factures-là qui passent leur échéance.`,
      },
      {
        id: "quai",
        titre: "Suivre un bon de livraison, du quai jusqu'au bureau",
        cout: 1,
        nature: "decisive",
        resultat:
          "Au dépôt, le magasinier signe le bon de livraison et le pose sur son bureau. Les bons montent au bureau quand quelqu'un y pense, environ une fois par semaine. Personne n'a jamais expliqué au dépôt que le bureau en a besoin chaque jour.",
      },
      {
        id: "volume",
        titre: "Comparer le nombre de factures à l'an dernier",
        cout: 1,
        nature: "bruit",
        resultat: `${pc(HAUSSE_DES_FACTURES)} de factures en plus que l'an dernier à la même époque.`,
      },
      {
        id: "fabienne",
        titre: "Demander à Fabienne comment elle s'organise",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Fabienne : « Je saisis, je rapproche, je paie. Quand le bon manque, je mets la facture de côté. J'ai écrit deux fois au dépôt. Rien n'a changé. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Nathalie",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Nathalie : « Avant de courir plus vite, regarde pourquoi les factures attendent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment remettez-vous les factures à jour ?",
    options: [
      {
        t: "Payer les factures en attente sans attendre les bons, pour vider la pile",
        d: "La pile se vide vite. Plus besoin de chercher les bons.",
      },
      {
        t: "Convenir avec le dépôt que les bons montent chaque soir, et rapprocher",
        d: "Une heure au dépôt pour expliquer et poser une bannette. Puis chaque facture est rapprochée du bon de commande et du bon de livraison.",
      },
      {
        t: "Relancer le dépôt par mail chaque jour, pour garder une trace écrite",
        d: "Comme Fabienne l'a déjà fait. Les mails laissent une trace.",
      },
      {
        t: "Faire des heures supplémentaires quatre semaines pour rattraper la pile",
        d: `Huit heures de plus par semaine, ${euros(COUT_HEURES_SUP)} par semaine. Le circuit des bons ne change pas.`,
      },
    ],
    reactions: [
      [
        {
          ...FABIENNE,
          texte:
            "La pile a fondu. Mais on vient de payer une palette de carrelage que le dépôt n'a jamais reçue.",
        },
      ],
      [
        {
          ...YVAN,
          texte:
            "Je ne savais pas que vous en aviez besoin tous les jours. La bannette est près de la porte : je la monte chaque soir.",
        },
      ],
      [
        {
          ...YVAN,
          texte:
            "J'ai vu passer vos mails. Nous aussi, on a du travail, au dépôt.",
        },
      ],
      [
        {
          ...FABIENNE,
          texte:
            "Tu restes tard tous les soirs. La pile baisse, mais les bons arrivent toujours aussi peu.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le transporteur au comptoir",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...BRESSAN,
        heure: "10:40",
        alerte: true,
        texte:
          "Ma facture de transport date de deux mois. Deux mois ! J'ai des chauffeurs à payer. Je ne repars pas sans savoir quand je serai payé.",
      },
      {
        ...NATHALIE,
        heure: "10:45",
        texte:
          "Sacha, je suis au téléphone avec le siège. Tu peux le recevoir ?",
      },
      {
        ...TABLEAU,
        heure: "10:50",
        texte: `Factures en attente : ${ctx.enAttente}. Litiges ouverts : ${ctx.litiges}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dossier",
        titre: "Chercher la facture Bressan sur l'écran",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La facture est arrivée il y a huit semaines. Elle est bloquée : le bon de livraison signé manque, il est resté au dépôt. Une fois le bon retrouvé, elle peut partir au prochain virement, mardi.",
      },
      {
        id: "historique",
        titre: "Regarder l'historique avec Transports Bressan",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Transports Bressan livre l'agence trois fois par semaine depuis six ans. Aucun litige jusqu'ici.",
      },
    ],
    question: "Comment recevez-vous M. Bressan ?",
    options: [
      {
        t: "Lui donner le numéro de la comptabilité du siège, qui fait les paiements",
        d: "Ce n'est pas votre service. Le siège s'en occupera.",
      },
      {
        t: "Lui promettre un paiement pour demain, pour qu'il reparte calme",
        d: "Il repart tout de suite. Reste à trouver comment le payer demain.",
      },
      {
        t: "L'écouter, chercher sa facture devant lui, lui dire quand il sera payé",
        d: "Le laisser parler, reformuler, lui dire ce qui manque. Dix minutes, puis un passage au dépôt.",
      },
      {
        t: "Lui répondre fermement : on ne crie pas dans un bureau",
        d: "Il faut savoir se faire respecter.",
      },
    ],
    reactions: [
      [
        {
          ...BRESSAN,
          texte:
            "Le siège ? Ils me renvoient vers l'agence. Je vais écrire à votre directrice.",
        },
      ],
      [
        {
          ...BRESSAN,
          texte:
            "Demain ? Bon. Je compte sur vous, et je repasserai si l'argent n'est pas là.",
        },
      ],
      [
        {
          ...BRESSAN,
          texte:
            "Bon. Au moins, vous m'avez écouté, et je sais quand je serai payé. Mardi, alors.",
        },
      ],
      [
        {
          ...BRESSAN,
          texte:
            "Puisque c'est comme ça, mes camions ne chargeront plus chez vous pendant quinze jours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le désaccord avec Fabienne",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...FABIENNE,
        heure: "16:10",
        alerte: true,
        texte:
          "Sacha, tu peux prendre le téléphone cet après-midi ? Comme hier, et avant-hier.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Entente au bureau cette semaine : ${ctx.entente} sur 10.`,
      },
    ],
    sources: [
      {
        id: "semaine",
        titre: "Noter pendant une semaine qui fait quoi",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur la semaine, vous avez pris presque tous les appels. Fabienne a fait toutes les saisies, que vous ne savez pas encore bien faire. De chaque côté, on pense en faire plus que l'autre.",
      },
      {
        id: "repartition",
        titre: "Demander à Nathalie comment le travail devait être partagé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Nathalie : « Je vous avais dit de vous partager le téléphone et les saisies. Je n'ai jamais écrit qui faisait quoi. »",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Parler à Fabienne au calme, avec vos notes, et proposer un partage écrit",
        d: "Un quart d'heure à deux, sans reproche. Vous apprendrez les saisies, elle prendra des appels.",
      },
      {
        t: "Ne rien dire et prendre les appels, pour garder la paix au bureau",
        d: "Pas de conflit. Le téléphone reste pour vous.",
      },
      {
        t: "Demander à Nathalie de recadrer Fabienne, sans lui en parler d'abord",
        d: "Nathalie tranchera. Fabienne saura d'où vient la plainte.",
      },
      {
        t: "Lui dire devant le bureau qu'elle vous laisse les tâches dont personne ne veut",
        d: "Au moins, c'est dit.",
      },
    ],
    reactions: [
      [
        {
          ...FABIENNE,
          texte:
            "Je croyais que tu aimais le téléphone. D'accord pour le tableau : je te montre les saisies lundi.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "Encore tout l'après-midi au téléphone ? Ça ne va pas pouvoir durer.",
        },
      ],
      [
        {
          ...FABIENNE,
          texte:
            "Nathalie m'a parlé. Tu aurais pu me le dire en face. Maintenant, je fais ma part, et pas plus.",
        },
      ],
      [
        {
          ...FABIENNE,
          texte: "Devant tout le monde ? Je ne te parle plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "L'erreur à dire",
    jusqua: 8,
    messages: () => [
      {
        de: "Céramiques du Dauphiné",
        role: "Service comptable",
        heure: "11:00",
        alerte: true,
        texte: `Nous avons reçu deux virements pour notre facture de carrelage de ${euros(DOUBLE_PAIEMENT)}. Merci de nous dire la suite à donner.`,
      },
      {
        ...FABIENNE,
        heure: "11:20",
        texte:
          "C'est toi qui as saisi cette facture, non ? Elle apparaît deux fois dans le logiciel.",
      },
    ],
    sources: [
      {
        id: "saisie",
        titre: "Retrouver comment la facture a été saisie deux fois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Vous l'avez saisie une fois depuis le mail du fournisseur, puis une deuxième fois depuis le courrier papier. Le logiciel n'a rien signalé : le numéro de facture était écrit autrement.",
      },
      {
        id: "avoir",
        titre: "Demander à Fabienne comment on récupère un double paiement",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Fabienne : « On demande un avoir ou un remboursement au fournisseur. Tout de suite, ça passe tout seul. Dans deux mois, leur comptabilité aura clôturé, et ce sera long. »",
      },
    ],
    question: "Que faites-vous de votre erreur ?",
    options: [
      {
        t: "Ne rien dire pour l'instant, et corriger discrètement le mois prochain",
        d: "Personne ne le saura peut-être. Vous aurez le temps de trouver comment faire.",
      },
      {
        t: "Demander à Fabienne de prévenir Nathalie, qui la connaît mieux que vous",
        d: "Elle connaît mieux Nathalie, et ce sera moins gênant pour vous.",
      },
      {
        t: "Écrire un mail court à Nathalie vendredi soir, pour que ce soit dit",
        d: "Sans entrer dans le détail. C'est écrit, donc c'est dit.",
      },
      {
        t: "Dire tout de suite à Nathalie le montant et l'avoir à demander",
        d: "Aller la voir, expliquer ce qui s'est passé. Cinq minutes difficiles, et le fournisseur est prévenu le jour même.",
      },
    ],
    reactions: [
      [
        {
          ...FABIENNE,
          texte:
            "Tu ne lui as rien dit ? Si elle l'apprend autrement, ce sera pire.",
        },
      ],
      [
        {
          ...FABIENNE,
          texte:
            "Je lui ai dit. Elle m'a demandé pourquoi ce n'était pas toi qui venais.",
        },
      ],
      [
        {
          ...NATHALIE,
          texte:
            "J'ai lu ton mail lundi, sans comprendre de quoi il s'agissait. Le fournisseur avait déjà clôturé son mois.",
        },
      ],
      [
        {
          ...NATHALIE,
          texte:
            "Merci de me l'avoir dit tout de suite. Une erreur, ça arrive. L'avoir est demandé : on récupère tout.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le client agacé au téléphone",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...CHABERT,
        heure: "08:15",
        alerte: true,
        texte:
          "Votre facture me compte deux palettes de parpaings. J'en ai reçu une ! C'est la troisième fois. Je vais finir par aller chez Rivoire.",
      },
      {
        ...TABLEAU,
        heure: "08:30",
        texte: `Litiges ouverts : ${ctx.litiges}. Factures en attente : ${ctx.enAttente}.`,
      },
    ],
    sources: [
      {
        id: "bon",
        titre: "Comparer sa facture au bon de livraison signé",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le bon de livraison signé par M. Chabert compte une seule palette. La facture en compte deux : l'erreur vient de l'agence. Il a raison.",
      },
      {
        id: "cahier",
        titre: "Relire le cahier des appels du mois",
        cout: 0.5,
        nature: "decisive",
        resultat: `Chaque semaine, environ ${APPELS_PAR_SEMAINE} clients appellent pour contester une facture, et ${nombre(PART_JUSTIFIEE * 10, 0)} fois sur dix ils ont raison. Plusieurs clients à qui l'on a répondu « la facture est juste » sans vérifier ont arrêté de commander.`,
      },
    ],
    question:
      "Comment répondez-vous à M. Chabert, et aux clients qui appellent ensuite ?",
    options: [
      {
        t: "Lui expliquer que la facture sort du logiciel, donc qu'elle est juste",
        d: "Le logiciel se trompe rarement. L'appel est vite terminé.",
      },
      {
        t: "Lui demander de passer à l'agence avec ses papiers, pour voir ensemble",
        d: "On regardera ensemble au comptoir, quand il aura le temps.",
      },
      {
        t: "Vérifier sur le bon signé, et le rappeler avec l'avoir s'il est dû",
        d: "L'écouter sans le couper, comparer facture et bon de livraison, le rappeler à l'heure promise. Dix minutes par appel.",
      },
      {
        t: "Lui faire une remise tout de suite, pour qu'il raccroche content",
        d: `${euros(REMISE_POUR_RACCROCHER)} en moyenne par appel. L'erreur reste dans le logiciel.`,
      },
    ],
    reactions: [
      [
        {
          ...CHABERT,
          texte:
            "Juste ? J'ai le bon signé sous les yeux. Je passe chez Rivoire cet après-midi.",
        },
      ],
      [
        {
          ...CHABERT,
          texte:
            "Passer à l'agence ? Je suis sur un chantier à trente kilomètres. On verra.",
        },
      ],
      [
        {
          ...CHABERT,
          texte:
            "Vous m'avez rappelé à 11 heures, comme promis, avec l'avoir. Là, d'accord.",
        },
      ],
      [
        {
          ...CHABERT,
          texte:
            "Une remise ? Bon. Mais la prochaine facture aura la même erreur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La remarque de Nathalie",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...NATHALIE,
        heure: "14:00",
        alerte: true,
        texte: `Sacha, j'ai relu tes rapprochements du mois : plusieurs erreurs de saisie, qu'on a dû corriger. Et avant la clôture, il faut réclamer ${euros(AVOIRS_A_RECLAMER)} d'avoirs aux fournisseurs. Tu fais ce dossier avec Fabienne ?`,
      },
      {
        ...TABLEAU,
        heure: "14:05",
        texte: `Entente au bureau : ${ctx.entente} sur 10. Ce que le bureau a coûté en plus depuis le début du trimestre : ${ctx.couts}.`,
      },
    ],
    sources: [
      {
        id: "erreurs",
        titre: "Regarder les erreurs que Nathalie a relevées",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les erreurs se ressemblent : un code fournisseur mal choisi, une quantité recopiée de travers. Une relecture rapide avant de valider les aurait toutes vues.",
      },
      {
        id: "avoirs",
        titre: "Regarder la liste des avoirs à réclamer",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une douzaine d'avoirs, chez sept fournisseurs. Pour chacun, il faut retrouver le bon de livraison et la facture, puis écrire au fournisseur. Fabienne connaît les fournisseurs, vous connaissez les bons.",
      },
    ],
    question:
      "Comment recevez-vous la remarque, et comment faites-vous le dossier ?",
    options: [
      {
        t: "Demander des exemples, proposer une relecture, partager le dossier",
        d: "Une liste de contrôle avant chaque validation. Le dossier se partage avec Fabienne, et chaque avoir est relu par l'autre.",
      },
      {
        t: "Expliquer que le logiciel est en cause, et faire le dossier sans aide",
        d: "Fabienne ne vous a pas tout montré, et le logiciel est mal fait. Seul le dossier fini prouvera que vous savez.",
      },
      {
        t: "Dire oui, et laisser Fabienne faire le dossier, qu'elle connaît mieux",
        d: "Elle a aussi l'inventaire du trimestre à finir.",
      },
      {
        t: "Le prendre mal, et ne plus faire que ce qu'on vous demande",
        d: "Comme ça, plus de reproche possible.",
      },
    ],
    reactions: [
      [
        {
          ...NATHALIE,
          texte:
            "Ta liste de contrôle est simple et utile. Je la donne aussi à Fabienne.",
        },
      ],
      [
        {
          ...NATHALIE,
          texte:
            "Le logiciel est le même pour tout le monde. Et le dossier des avoirs n'est qu'à moitié fait.",
        },
      ],
      [
        {
          ...FABIENNE,
          texte:
            "Je n'aurai pas le temps de tout faire avant la clôture, avec l'inventaire.",
        },
      ],
      [
        {
          ...NATHALIE,
          texte:
            "Je t'ai fait une remarque sur des saisies, pas sur toi. C'est dommage.",
        },
      ],
    ],
  },
];

/** La prévision de la semaine 1 : une multiplication guidée, les factures d'un jour par les jours ouvrés. */
export const PREVISION = {
  parJour: FACTURES_PAR_JOUR,
  jours: JOURS_OUVRES,
} as const;

/** Les trois manières de faire auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Écouter, vérifier, dire", chemin: [1, 2, 0, 3, 2, 0] },
  { nom: "Éviter les conflits", chemin: [2, 1, 1, 0, 3, 2] },
  { nom: "Faire comme d'habitude", chemin: [2, 0, 1, 0, 0, 1] },
] as const;

/**
 * Les réponses réflexes : payer sans vérifier, faire des heures, renvoyer
 * ailleurs, répondre sur le même ton, se plaindre dans le dos, cacher une
 * erreur, défendre la facture sans la regarder, acheter la paix par une
 * remise, se justifier. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 2],
  [3, 0],
  [4, 0],
  [4, 3],
  [5, 1],
] as const;

export const REPONSES = {
  promesseTenue:
    "Le virement est parti dès le lendemain : Nathalie a trouvé le bon au dépôt à temps. M. Bressan a appelé pour remercier.",
  promesseRompue:
    "Le virement n'est pas parti : le bon de livraison n'était toujours pas retrouvé. M. Bressan est revenu, plus fâché encore, et a écrit à la directrice.",
  decouverte:
    "Nathalie a découvert le double paiement en préparant la clôture. « Pourquoi tu ne m'as rien dit ? » Le fournisseur ne rembourse plus qu'une partie.",
} as const;
