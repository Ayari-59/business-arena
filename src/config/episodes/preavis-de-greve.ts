/**
 * LE PRÉAVIS DE GRÈVE — le contenu de l'épisode.
 *
 * Christine Lacroix est directrice des ressources humaines d'Arvel
 * Distribution pour la région Rhône-Alpes. La négociation annuelle sur les
 * salaires des trois dépôts s'ouvre sur un préavis de grève pour la semaine 4,
 * une enveloppe fixée par la direction, et une saison haute qui commence en
 * semaine 8. Six décisions, chacune précédée de ce qu'une DRH reçoit
 * vraiment : les élus, le directeur régional, la logistique, la paie.
 *
 * Personne n'a le mauvais rôle : les élus défendent des salariés dont les
 * premiers salaires ont été rattrapés par le Smic, la direction une enveloppe
 * et une saison, la logistique des livraisons. C'est la méthode qui fait la
 * différence.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "interets",
    t: "Derrière les 4,5 %, des attentes précises : les premiers niveaux rattrapés par le Smic, les samedis annoncés au dernier moment",
  },
  {
    id: "confiance",
    t: "La confiance est rompue : l'engagement pris à la dernière négociation n'a pas été tenu",
  },
  {
    id: "surenchere",
    t: "Les élus font monter les enchères avant les élections professionnelles",
  },
  {
    id: "marche",
    t: "Les salaires des dépôts sont en dessous du marché : il faut s'aligner",
  },
] as const;

const BENSAID = {
  de: "Walid Benkhaled",
  role: "Délégué syndical, dépôt de Chassieu",
} as const;
const LE_GOFF = {
  de: "Gwenaëlle Le Goff",
  role: "Élue du CSE, dépôt de Moirans",
} as const;
const KOUASSI = { de: "Emmanuel Kouassi", role: "Directeur régional" } as const;
const MALLET = {
  de: "Hugues Mallet",
  role: "Directeur logistique régional",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le préavis est déposé",
    jusqua: 3,
    messages: () => [
      {
        de: "Délégués syndicaux des dépôts",
        role: "Chassieu, Moirans, Andrézieux",
        heure: "07:50",
        alerte: true,
        texte:
          "Madame la directrice, nous déposons un préavis de grève pour le lundi et le mardi de la semaine 4, dans les trois dépôts de la région. Nos revendications : 4,5 % d'augmentation générale, une prime de saison haute, le respect des plannings.",
      },
      {
        ...KOUASSI,
        heure: "08:40",
        texte:
          "Christine, l'enveloppe est votée : 3 % de la masse salariale des dépôts, toutes mesures comprises. La saison haute commence en semaine 8, et je ne veux pas de dépôt à l'arrêt en avril. Première réunion jeudi : dis-moi comment tu l'ouvres.",
      },
      {
        ...MALLET,
        heure: "09:15",
        texte:
          "Si on lâche à la première menace, on paiera tous les ans. On annonce un chiffre, et on s'y tient.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "grille",
        titre: "Analyser la grille et les fiches de paie des dépôts",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les trois premiers niveaux de la grille (48 salariés sur 120) ont été rattrapés par le Smic : un préparateur qui a six ans de maison gagne 38 € de plus qu'un débutant. Au-dessus, les salaires des dépôts sont 2 % au-dessus de la branche.",
      },
      {
        id: "elus",
        titre: "Rencontrer les élus en dehors de la table de négociation",
        cout: 1,
        nature: "decisive",
        resultat:
          "Walid Benkhaled et Gwenaëlle Le Goff parlent peu des 4,5 %. Ils parlent des samedis annoncés le jeudi pour le samedi, sept fois l'an dernier, et des départs à 5 heures. Et de l'étude sur la pénibilité des quais, promise il y a un an et jamais lancée : « Pourquoi on vous croirait cette fois ? »",
      },
      {
        id: "pv",
        titre: "Relire le procès-verbal de la négociation de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'an dernier : 2,2 % accordés après deux jours de grève, et un engagement écrit de lancer une étude sur la pénibilité des quais avant l'été. Rien n'a été lancé.",
      },
      {
        id: "branche",
        titre: "Comparer avec les accords signés dans la branche",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les accords signés cette année dans le négoce de matériaux vont de 2,4 % à 3,4 % d'augmentation ; la moyenne est à 2,9 %. Deux entreprises ont connu une grève.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Jean-Luc Ardouin",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Jean-Luc Ardouin, directeur des relations sociales du groupe : « Une revendication, c'est une position. Demande-leur ce qu'il y a derrière. Et avant de promettre quoi que ce soit, tiens ce qu'on a promis l'an dernier. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment ouvrez-vous la négociation jeudi ?",
    options: [
      {
        t: "Annoncer la position de la direction : 2,5 %, et pas au-delà",
        d: "Un chiffre clair dès la première réunion, en gardant une marge sur l'enveloppe.",
      },
      {
        t: "Ouvrir les chiffres aux élus et lister avec eux les sujets à traiter",
        d: "Masse salariale, grille, marges des dépôts, comparaison avec la branche. Une demi-journée de préparation, 2 000 €. Aucun pourcentage jeudi.",
      },
      {
        t: "Proposer tout de suite 3 % pour désamorcer la grève",
        d: "Toute l'enveloppe en augmentation générale, annoncée jeudi.",
      },
      {
        t: "Demander le report de la négociation après la saison haute",
        d: "Il faut l'accord des élus. Le préavis court toujours.",
      },
    ],
    reactions: [
      [
        {
          ...BENSAID,
          texte: "2,5 %, à prendre ou à laisser ? Alors on laisse. Le préavis est maintenu.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte:
            "C'est la première fois qu'on nous montre les vrais chiffres. On ne retire pas le préavis, mais on a de quoi discuter : la grille, les samedis, les quais.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "3 % dès la première réunion, on prend note. On consulte les équipes ce week-end et on vous répond lundi.",
        },
      ],
      [
        {
          ...KOUASSI,
          texte:
            "Les élus refusent le report : la négociation est obligatoire, et le préavis tient. On négocie maintenant, ou pendant la grève.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · mercredi",
    titre: "Lundi, la grève",
    jusqua: 5,
    messages: (ctx) => [
      ctx.preavisLeve
        ? {
            ...BENSAID,
            heure: "08:10",
            texte:
              "Le préavis est levé, comme convenu. Mais rien n'est signé : les équipes attendent de voir la suite.",
          }
        : {
            ...BENSAID,
            heure: "08:10",
            alerte: true,
            texte:
              "Le préavis est maintenu : grève lundi et mardi dans les trois dépôts. Les équipes ne voient rien venir.",
          },
      {
        ...MALLET,
        heure: "09:30",
        texte: ctx.preavisLeve
          ? "Les agences ont deux jours de stock sur les produits courants. Tant mieux si on n'en a pas besoin."
          : "Les agences ont deux jours de stock sur les produits courants. Lundi et mardi, je livre quoi, et avec qui ?",
      },
      {
        de: "Baromètre social",
        role: "Enquête flash hebdomadaire",
        heure: "18:00",
        texte: `Confiance des salariés des dépôts dans la direction : ${ctx.confiance}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "equipes",
        titre: "Demander aux chefs d'équipe ce que disent les quais",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ouvert
            ? "Les chefs d'équipe sont formels : ce qui fera grève lundi, ce sont les samedis et l'étude jamais lancée. « Si la direction lance l'étude cette semaine, la moitié des gars ne voit plus pourquoi perdre deux jours de salaire. »"
            : "Les chefs d'équipe : « Ils ne croient plus aux promesses. Il faudrait du concret, et vite. » Ce qui revient le plus : les samedis annoncés au dernier moment, et l'étude des quais jamais lancée.",
      },
      {
        id: "juriste",
        titre: "Consulter le juriste social du groupe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Remplacer des grévistes par des intérimaires est interdit. Écrire directement aux salariés est permis, mais les élus le vivront comme un contournement. Une avance sur l'augmentation peut être versée avant l'accord, à valoir sur lui.",
      },
    ],
    question: "Que faites-vous avant lundi ?",
    options: [
      {
        t: "Laisser la grève avoir lieu, et organiser la continuité avec l'encadrement",
        d: "Les chefs d'équipe et les cadres aux quais, les chantiers prioritaires d'abord. 3 000 €.",
      },
      {
        t: "Écrire à chaque salarié des dépôts pour expliquer l'offre de la direction",
        d: "Une lettre à domicile, signée du directeur régional. Les élus en recevront copie.",
      },
      {
        t: "Proposer une méthode, et tenir enfin la promesse de l'an dernier",
        d: "Trois réunions par thème (salaires, samedis, pénibilité) et l'étude des quais lancée cette semaine, 6 000 €, contre la levée du préavis. Les équipes voteront.",
      },
      {
        t: "Accorder une avance de 1 % contre la levée du préavis",
        d: "Versée dès la paie de ce mois, à valoir sur l'accord final.",
      },
    ],
    reactions: [
      [
        {
          ...MALLET,
          texte:
            "Les cadres seront aux quais lundi à 5 heures. On livrera les chantiers prioritaires, pas plus.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "Vous écrivez à nos collègues chez eux, par-dessus nos têtes ? Quelques-uns hésitent. La plupart l'ont très mal pris.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte:
            "Une étude lancée cette semaine, c'est du concret. On réunit les équipes vendredi pour décider du préavis.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "On présente l'avance aux équipes vendredi. Tout le monde a bien compris que le préavis avait payé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Que mettre sur la table ?",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...LE_GOFF,
        heure: "10:20",
        alerte: true,
        texte:
          "Pour la réunion de mardi, notre position n'a pas changé : 4,5 % pour tous et une prime de saison haute. Nous attendons une proposition écrite.",
      },
      {
        ...KOUASSI,
        heure: "14:00",
        texte: ctx.greve
          ? `La grève de la semaine 4 nous a coûté ${ctx.pertes} en livraisons manquées et en clients partis. Mesures sur la table : ${ctx.offre} sur l'année. Mardi, il faut une proposition qui tienne dans l'enveloppe.`
          : `Pas de grève, tant mieux. Mesures sur la table : ${ctx.offre} sur l'année. Mardi, il faut une proposition qui tienne dans l'enveloppe.`,
      },
    ],
    sources: [
      {
        id: "chiffrage",
        titre: "Chiffrer chaque mesure avec la contrôleuse de gestion",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Anouk Bouaziz : 1 % d'augmentation générale coûte 42 k€ par an. +40 € par mois sur les trois premiers niveaux : 34 k€, soit 0,8 %. Une prime de 300 € pour tous : 52 k€, et le risque qu'elle devienne un usage. Planifier les samedis quinze jours avant ne coûte rien, si la logistique s'organise.",
      },
      {
        id: "remontees",
        titre: "Relire les remontées des équipes",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.ouvert
            ? "Depuis la première réunion, les premiers niveaux et les samedis reviennent dans un message sur deux. Le pourcentage général, dans un sur cinq."
            : "Peu de remontées : à la table, il n'a été question que de pourcentage. Les chefs d'équipe, eux, parlent surtout des samedis.",
      },
    ],
    question: "Que proposez-vous mardi ?",
    options: [
      {
        t: "Une augmentation générale de 2,8 %",
        d: "Simple et lisible : 118 k€ sur l'année. On discutera le pourcentage.",
      },
      {
        t: "1,5 % pour tous et une prime de saison haute de 300 €",
        d: "Moins d'augmentation durable, une prime versée en juin. 115 k€ cette année.",
      },
      {
        t: "Un paquet bâti sur leurs sujets : 1,5 % pour tous, +40 € sur les trois premiers niveaux, des samedis planifiés quinze jours avant",
        d: "97 k€ sur l'année si aucun pourcentage n'a été annoncé avant. Le planning engage la logistique.",
      },
      {
        t: "Attendre la contre-proposition des élus",
        d: "La direction maintient son offre de 2,5 % en attendant.",
      },
    ],
    reactions: [
      [
        {
          ...BENSAID,
          texte:
            "2,8 %, on note que ça bouge. Mais les premiers niveaux resteront collés au Smic, et les samedis, on n'en parle pas.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte:
            "Une prime, ça se dépense en juin et ça ne compte ni pour les congés ni pour la retraite. Les équipes veulent du durable.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte:
            "Les +40 € pour les premiers niveaux et des samedis connus à l'avance, c'est exactement ce que demandaient les quais. On en parle aux équipes.",
        },
      ],
      [
        {
          ...BENSAID,
          texte: "Vous attendez notre proposition ? La voici : 4 %, et on ne descendra pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Les samedis de la saison haute",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...MALLET,
        heure: "08:15",
        alerte: true,
        texte:
          "La saison démarre lundi. Il me faut six samedis travaillés d'ici la fin du trimestre. Je préviens les équipes le jeudi, comme tous les ans.",
      },
      ctx.paquet
        ? {
            ...LE_GOFF,
            heure: "11:00",
            texte:
              "On a appris que la logistique prépare les samedis. On vous rappelle ce qui est sur la table : des plannings connus quinze jours avant.",
          }
        : {
            ...LE_GOFF,
            heure: "11:00",
            texte:
              "On a appris que la logistique prépare les samedis. Encore annoncés le jeudi pour le samedi ?",
          },
    ],
    sources: [
      {
        id: "volontaires",
        titre: "Demander aux chefs d'équipe qui prendrait des samedis volontaires",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une trentaine de salariés sur cent vingt prendraient des samedis volontaires, majorés et connus à l'avance. Avec deux intérimaires en semaine, la charge est couverte. L'agence d'intérim ne garantit pas de trouver des caristes en pleine saison.",
      },
    ],
    question: "Comment organisez-vous les samedis ?",
    options: [
      {
        t: "Des samedis volontaires, planifiés quinze jours avant, majorés de 50 %, avec deux intérimaires en renfort",
        d: "1 500 € par semaine de saison haute. L'agence d'intérim doit trouver deux caristes.",
      },
      {
        t: "Laisser la logistique imposer les samedis, annoncés le jeudi",
        d: "Majoration habituelle, 1 000 € par semaine. Comme les autres années.",
      },
      {
        t: "Des samedis obligatoires, mais planifiés quinze jours avant et payés double",
        d: "3 000 € par semaine. Personne n'a à se porter volontaire.",
      },
      {
        t: "Supprimer les samedis tant que la négociation dure",
        d: "Aucun coût de personnel. Le réassort des agences attendra le lundi.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...LE_GOFF,
          texte:
            "Annoncés jeudi pour samedi, encore. Aux quais, tout le monde y voit la réponse de la direction à la négociation.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "Payés double et connus à l'avance, personne ne s'en plaindra. Obligatoires, ça passe moins bien chez ceux qui ont des enfants.",
        },
      ],
      [
        {
          ...MALLET,
          texte:
            "Sans samedis, les agences attendent leur réassort jusqu'au mardi. Les artisans le voient déjà.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le dernier tour",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...BENSAID,
        heure: "09:00",
        alerte: true,
        texte:
          "Dernière réunion mardi. Sans accord, nous appelons à la grève la semaine suivante, en pleine saison.",
      },
      {
        ...KOUASSI,
        heure: "12:30",
        texte: `Un jour de dépôt à l'arrêt en avril coûte une fois et demie plus qu'en hiver. Mais ne me ramène pas un accord à n'importe quel prix. Écart à l'enveloppe à date : ${ctx.ecart}.`,
      },
      {
        de: "Baromètre social",
        role: "Enquête flash hebdomadaire",
        heure: "18:00",
        texte: `Confiance des salariés des dépôts dans la direction : ${ctx.confiance}.`,
      },
    ],
    sources: [
      {
        id: "manque",
        titre: "Demander aux élus, en aparté, ce qui manque pour signer",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.manque === "rien"
            ? "Gwenaëlle Le Goff : « Ce qui est sur la table nous va, ou presque. Il nous faut une date pour faire le point, et pouvoir dire aux équipes que c'est un accord, pas une décision de la direction. »"
            : ctx.manque === "peu"
              ? "Gwenaëlle Le Goff : « Il manque peu : un geste sur les premiers niveaux, et une date pour faire le point. Pas forcément du pourcentage. »"
              : "Walid Benkhaled : « Il manque beaucoup. Les équipes parlent d'un point de plus pour tout le monde, et elles ne croient plus aux promesses. »",
      },
      {
        id: "saison",
        titre: "Chiffrer une grève en pleine saison",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Anouk Bouaziz : en saison haute, un jour de dépôt arrêté coûte autour de 22 k€ de marge, et la moitié de ce que les artisans n'ont pas reçu ne reviendra pas avant l'automne.",
      },
    ],
    question: "Comment abordez-vous la dernière réunion ?",
    options: [
      {
        t: "Signer à leurs conditions pour sauver la saison",
        d: "Ce qu'ils demandent, en augmentation générale. Plus de grève possible.",
      },
      {
        t: "Constater le désaccord et appliquer la proposition de la direction",
        d: "Un procès-verbal de désaccord, et les mesures appliquées sans signature.",
      },
      {
        t: "Mettre sur la table un dernier paquet chiffré, avec un rendez-vous de suivi en septembre",
        d: "Ce qui manque, sur leurs sujets plutôt qu'en pourcentage. Les équipes voteront.",
      },
      {
        t: "Proposer une médiation",
        d: "Un médiateur extérieur, 4 000 €, deux semaines de discussions.",
      },
    ],
    reactions: [
      [
        {
          ...BENSAID,
          texte:
            "C'est signé. Les équipes retiendront qu'il suffisait de menacer la saison. Nous aussi.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte: "Pas d'accord, pas de signature. Nous appelons à la grève la semaine prochaine.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "On présente votre dernière proposition aux équipes lundi matin, dans les trois dépôts. Réponse lundi soir.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "Une médiation, d'accord. Mais tant que rien n'est signé, le mot d'ordre de grève tient.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Tenir ce qui a été conclu",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Josiane Teyssier",
        role: "Responsable paie",
        heure: "10:45",
        alerte: true,
        texte:
          "Les nouvelles mesures demandent de reparamétrer la grille : impossible sur la paie de ce mois. Au plus tôt le mois prochain, avec un rappel si on le décide.",
      },
      {
        ...KOUASSI,
        heure: "15:10",
        texte: ctx.signe
          ? `L'accord est signé, bravo. Écart à l'enveloppe à date : ${ctx.ecart}. Ne le laisse pas se défaire maintenant.`
          : `Pas encore d'accord signé, et les mesures s'appliqueront de toute façon. Écart à l'enveloppe à date : ${ctx.ecart}.`,
      },
    ],
    sources: [
      {
        id: "engagements",
        titre: "Relire tout ce qui a été promis depuis la semaine 1",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.etude
              ? "L'étude des quais, lancée en semaine 3, rendra ses conclusions en juin. "
              : "L'étude des quais promise l'an dernier n'a toujours pas été lancée. "
          }${
            ctx.paquet
              ? "Les samedis planifiés quinze jours avant figurent dans la proposition. "
              : ""
          }Gwenaëlle Le Goff le rappelle à chaque réunion : l'an dernier, après la signature, plus rien n'avait bougé.`,
      },
    ],
    question: "Comment terminez-vous le trimestre ?",
    options: [
      {
        t: "Réunir la commission de suivi, publier le calendrier de chaque mesure, et appliquer le mois prochain avec rappel",
        d: "Une réunion avec les élus, un affichage dans les trois dépôts. 2 000 €.",
      },
      {
        t: "Décaler d'un mois l'application, sans rappel",
        d: "Un mois de mesures économisé sur l'année. La paie s'organise sans urgence.",
      },
      {
        t: "Verser une prime de fin de conflit de 100 € pour tourner la page",
        d: "17 k€, sur la paie de ce mois.",
      },
      {
        t: "Laisser la paie appliquer les mesures quand elle pourra",
        d: "Rien à organiser.",
      },
    ],
    reactions: [
      [
        {
          ...LE_GOFF,
          texte:
            "Le calendrier est affiché à Moirans. Pour une fois, on sait quoi, quand, et qui s'en occupe.",
        },
      ],
      [
        {
          ...BENSAID,
          texte:
            "Un mois de décalage sans rappel, après ce qui a été conclu ? Les équipes s'en souviendront à la prochaine négociation.",
        },
      ],
      [
        {
          ...BENSAID,
          texte: "Merci pour la prime. Aux quais, on en conclut que le conflit rapporte.",
        },
      ],
      [
        {
          ...LE_GOFF,
          texte:
            "Les salariés ont cherché leur augmentation sur leur fiche de paie, sans la trouver. Personne ne leur a dit pourquoi.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Partager les chiffres, négocier les intérêts, tenir parole",
    chemin: [1, 2, 2, 0, 2, 0],
  },
  { nom: "Fermeté, puis concession", chemin: [0, 0, 0, 1, 0, 2] },
  { nom: "Attentiste", chemin: [3, 0, 3, 1, 1, 3] },
] as const;

/** Les options de fermeté de principe : [décision, option]. */
export const FERMETES = [
  [0, 0],
  [1, 0],
  [3, 1],
  [4, 1],
] as const;

/**
 * Les options qui cèdent sous la menace, ou achètent la paix : [décision, option].
 * L'avance de 1 % en D2 n'y figure pas : le bilan la juge défendable (elle
 * achète la levée du préavis presque à coup sûr), on ne la reproche donc pas.
 */
export const CONCESSIONS = [
  [0, 2],
  [4, 0],
  [5, 2],
] as const;

export const REPONSES = {
  interimTrouve:
    "Nous avons deux caristes expérimentés pour vous dès lundi, jusqu'à la fin du trimestre.",
  interimManque:
    "Désolés : en pleine saison, aucun cariste disponible. Nous continuons à chercher, sans garantie.",
} as const;

export { BENSAID, KOUASSI, LE_GOFF, MALLET };
