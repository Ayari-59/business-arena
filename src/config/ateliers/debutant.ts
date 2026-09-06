import type { AtelierDefinition } from "./types";

/**
 * ANIMATION DE DÉCOUVERTE · TOUT DÉBUTANT.
 *
 * Quatre séances de deux heures sur la boutique, le secteur le plus lisible :
 * on achète, on revend, et la marge se lit d'un coup d'œil. C'est l'animation
 * d'entrée, pensée pour une classe qui n'a jamais joué et qui n'a pas encore
 * les mots de la gestion. Une seule décision structurante par séance, un seul
 * calcul à la fois, et un niveau de jeu qui n'ouvre ni trésorerie, ni structure,
 * pour que rien ne se décide au hasard.
 *
 * Ce n'est pas un atelier de section de technicien : il ne s'adosse à aucun
 * référentiel, il donne le goût du pilotage avant que le vocabulaire n'arrive.
 * Les quatre trimestres joués mènent à la grosse saison, où les écarts se
 * creusent et où la découverte prend son sens.
 */
export const ATELIER_DEBUTANT: AtelierDefinition = {
  code: "debutant",
  titre: "Découvrir la gestion en tenant une boutique",
  diplome: "Découverte, toutes filières",
  annee: "Premiers pas",
  nature: "Animation de découverte",
  traceLabel: "carnet de bord",
  referentielLabel: "Compétences de gestion",
  referentielAccord: "mobilisées",
  pitch:
    "Quatre séances de deux heures. Chaque équipe tient la même boutique d'un trimestre à l'autre : elle fixe son prix, choisit combien commander, tente une promotion, prépare la grosse saison, et découvre à chaque fois ce que sa décision a produit. Une seule chose nouvelle par séance.",
  resume:
    "Quatre trimestres dans une boutique pour découvrir la gestion sans en avoir le vocabulaire, une décision à la fois, jusqu'à la grosse saison.",
  difficulte: 1,
  difficulteLabel: "Initiation",
  format: "4 séances de 2 h",
  pourquoi:
    "Un débutant à qui l'on explique la marge l'oublie avant la sonnerie, parce qu'il n'en a pas eu besoin. Ici l'équipe fixe un prix parce qu'il faut bien en fixer un, et découvre au trimestre suivant si elle a gagné ou perdu à ce prix. La leçon vient de la décision, pas du cours. Chaque séance n'ajoute qu'une chose : d'abord le prix, puis le volume à commander, puis la promotion, puis la saison, si bien qu'à la fin la classe a manipulé les quatre leviers de base sans jamais avoir eu à tout tenir en même temps. C'est le seul moment où l'on peut se tromper sans conséquence, et c'est ce qui rend l'erreur précieuse.",
  reglages: {
    scenarioCode: "boutique",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 1,
    niveauNom: "Découverte",
    equipes: 6,
    bots: 2,
    tva: false,
    mondeVariable: false,
    quizMode: "Aucune question",
    tours: 4,
    effectifParEquipe: "deux élèves",
    notes:
      "La boutique achète pour revendre : la marge s'y lit sans détour, et rien n'y brouille la découverte. Le niveau retenu n'ouvre que le prix et le volume : ni trésorerie, ni recrutement, ni investissement, pour qu'un débutant ne prenne aucune décision qu'il ne comprend pas. La taxe et les questions de connaissances sont désactivées, le monde variable aussi, pour que toutes vos classes vivent le même parcours et que l'erreur vienne des choix, pas du hasard.",
  },
  seances: [
    {
      numero: 1,
      titre: "Fixer un prix et voir sa marge",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: ["Étape 1 · Lire une situation et fixer un prix"],
      objectif:
        "Comprendre ce qu'est une marge en fixant un premier prix de vente, puis en découvrant ce qu'il a rapporté une fois le trimestre joué.",
      competences: [
        "Je calcule la différence entre un prix d'achat et un prix de vente.",
        "Je fixe un prix de vente et j'en explique la raison en une phrase.",
        "Je lis un résultat de fin de trimestre et j'y retrouve ma marge.",
      ],
      notions: ["prix d'achat", "prix de vente", "marge", "chiffre d'affaires"],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Formez des binômes. Écrivez au tableau une seule question, celle de la séance : à quel prix vendre. Prévoyez de ne rien corriger avant la clôture : la première marge se comprend en la voyant tomber.",
      deroule: [
        {
          minutes: 15,
          titre: "Le jeu et la règle",
          detail:
            "Vous montrez l'écran, vous donnez le code, et vous annoncez la seule règle du jour : chaque binôme fixe le prix de sa boutique. Rien d'autre ne se décide aujourd'hui.",
        },
        {
          minutes: 30,
          titre: "Combien coûte, combien rapporte",
          detail:
            "Chaque binôme relève ce que la boutique paie pour un article et cherche à combien le revendre. Vous passez pour vérifier qu'ils ont bien vu le prix d'achat, sans souffler le prix de vente.",
        },
        {
          minutes: 30,
          titre: "On fixe le prix",
          detail:
            "Les binômes saisissent leur prix et écrivent en une ligne pourquoi ce prix et pas un autre. C'est leur première décision, et elle leur appartient.",
        },
        {
          minutes: 20,
          titre: "Clôture et surprise",
          detail:
            "Vous clôturez le trimestre. Chaque binôme voit son résultat : certains ont vendu cher et peu, d'autres bon marché et beaucoup. Personne n'avait la bonne réponse d'avance.",
        },
        {
          minutes: 25,
          titre: "On en parle",
          detail:
            "Vous affichez deux résultats opposés côte à côte et laissez la classe expliquer l'écart. Le mot marge apparaît alors tout seul, et vous le posez sur ce qu'ils viennent de voir.",
        },
      ],
      livrable:
        "Le carnet de bord du trimestre, une demi-page : le prix d'achat, le prix de vente choisi, la marge par article, et une phrase sur ce que le binôme ferait différemment.",
      tracePasseport:
        "J'ai fixé le prix de vente d'une boutique et j'ai compris, en voyant mon résultat, ce qu'est une marge.",
      evaluation: [
        "Le prix de vente est écrit, avec sa raison en une phrase.",
        "La marge par article est calculée à partir des deux prix.",
        "Le binôme dit ce qu'il changerait, sans se justifier par la chance.",
      ],
    },
    {
      numero: 2,
      titre: "Choisir combien commander",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: ["Étape 2 · Décider une quantité et en mesurer l'effet"],
      objectif:
        "Découvrir qu'une boutique peut manquer de marchandise ou en avoir trop, en choisissant la quantité à commander pour le trimestre.",
      competences: [
        "Je choisis une quantité de marchandise à commander pour un trimestre.",
        "Je comprends ce que coûte un rayon vide et ce que coûte un rayon qui ne se vend pas.",
        "Je relis mon trimestre précédent pour décider du suivant.",
      ],
      notions: ["quantité commandée", "rupture de stock", "invendu", "stock"],
      preparation:
        "Rouvrez la partie et projetez les résultats du premier trimestre. Préparez au tableau deux mots, trop et trop peu, autour desquels toute la séance va tourner. Prévoyez de laisser chaque binôme se tromper : c'est la deuxième erreur qui fait comprendre la première.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce qui s'est passé",
          detail:
            "Chaque binôme relit son résultat et dit en une phrase ce qu'il a compris du premier trimestre. Vous notez au tableau qui a manqué de marchandise et qui en a trop gardé.",
        },
        {
          minutes: 30,
          titre: "Trop, ou trop peu",
          detail:
            "La classe cherche ensemble ce qui arrive quand on commande trop peu, puis trop. Les deux erreurs coûtent, mais pas de la même façon, et chacun le formule avec ses mots.",
        },
        {
          minutes: 30,
          titre: "On commande",
          detail:
            "Chaque binôme choisit sa quantité et son prix, et écrit combien il pense vendre. Cette prévision sera relue la fois suivante.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque binôme voit ce qu'il a vendu, ce qui lui reste, et si son rayon a tenu ou s'est vidé trop tôt.",
        },
        {
          minutes: 25,
          titre: "On en parle",
          detail:
            "Vous comparez un binôme en rupture et un binôme avec des invendus. La classe comprend qu'il n'existe pas de bonne quantité en soi, seulement une quantité adaptée à ce qu'on pense vendre.",
        },
      ],
      livrable:
        "Le carnet de bord du trimestre : la quantité commandée, la vente prévue, ce qui a été vendu réellement, et une phrase sur l'écart entre les deux.",
      tracePasseport:
        "J'ai choisi une quantité de marchandise à commander et j'ai compris ce que coûtent un rayon vide et un rayon plein d'invendus.",
      evaluation: [
        "La quantité commandée est écrite avec la vente attendue.",
        "Les deux erreurs, trop et trop peu, sont expliquées avec des mots simples.",
        "L'écart entre la vente prévue et la vente réelle est constaté.",
      ],
    },
    {
      numero: 3,
      titre: "Tenter une promotion",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: ["Étape 3 · Agir sur les ventes sans perdre sa marge"],
      objectif:
        "Découvrir qu'une remise fait vendre plus mais rapporte moins par article, en tentant une promotion et en regardant ce qu'elle a laissé.",
      competences: [
        "Je décide d'une promotion et j'en attends un effet précis.",
        "Je comprends qu'une remise doit être compensée par davantage de ventes.",
        "Je compare un trimestre avec promotion à un trimestre sans.",
      ],
      notions: ["remise", "promotion", "marge réduite", "volume de ventes"],
      preparation:
        "Projetez les deux premiers trimestres. Écrivez au tableau une question à trancher : vendre plus mais gagner moins par article, est-ce un bon calcul. Préparez de laisser la moitié des binômes tenter la promotion et l'autre s'en abstenir, pour que la comparaison soit dans la salle.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur la commande",
          detail:
            "Chaque binôme relit son trimestre et sa prévision. Vous notez qui avait bien anticipé sa vente et qui a été surpris.",
        },
        {
          minutes: 30,
          titre: "Une remise, ça donne quoi",
          detail:
            "La classe cherche ce qui se passe si l'on baisse le prix : on vend sans doute plus, mais chaque article rapporte moins. Chaque binôme estime combien de ventes en plus il faudrait pour s'y retrouver.",
        },
        {
          minutes: 30,
          titre: "On décide",
          detail:
            "Chaque binôme choisit s'il lance une promotion, à quel prix, et écrit le nombre de ventes qu'il vise. Ceux qui n'en font pas le disent aussi, et pourquoi.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Les binômes qui ont bradé et ceux qui ont tenu leur prix voient leur résultat, et l'affluence ne dit pas tout.",
        },
        {
          minutes: 25,
          titre: "On en parle",
          detail:
            "Vous mettez face à face un binôme qui a beaucoup vendu et gagné peu, et un binôme qui a moins vendu et gardé sa marge. La classe tranche, ou découvre que la réponse dépend.",
        },
      ],
      livrable:
        "Le carnet de bord du trimestre : la décision de promotion ou non, le prix retenu, les ventes visées, et une phrase sur ce que la remise a réellement laissé.",
      tracePasseport:
        "J'ai tenté une promotion et j'ai compris qu'une remise ne rapporte que si elle fait vendre assez pour compenser la marge perdue.",
      evaluation: [
        "La décision de promotion est écrite, avec le nombre de ventes visé.",
        "Le binôme explique pourquoi une remise doit faire vendre plus.",
        "Le résultat de la promotion est comparé à un trimestre sans remise.",
      ],
    },
    {
      numero: 4,
      titre: "Réussir la grosse saison",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: ["Étape 4 · Anticiper une forte demande et faire le bilan"],
      objectif:
        "Préparer le trimestre où l'on vend le plus, en rassemblant tout ce qu'on a appris, puis faire le bilan de sa boutique sur l'année.",
      competences: [
        "J'anticipe une forte demande à partir de mes trimestres précédents.",
        "Je décide un prix et une quantité ensemble pour un trimestre qui compte.",
        "Je fais le bilan d'une année de gestion en quelques phrases.",
      ],
      notions: ["saison", "forte demande", "prix et quantité", "bilan"],
      preparation:
        "C'est la séance qui décide de l'année : projetez les trois trimestres joués. Écrivez au tableau que le trimestre qui vient est le plus gros, sans donner de chiffre. Prévoyez du temps pour le bilan final, où chaque binôme relit son parcours entier.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit la saison",
          detail:
            "Vous annoncez sans chiffre que la boutique va vivre son trimestre le plus chargé. Les binômes retrouvent seuls l'ampleur de la demande dans les informations du jeu.",
        },
        {
          minutes: 30,
          titre: "Tout ce qu'on a appris",
          detail:
            "Chaque binôme rassemble ses trois leçons : le prix, la quantité, la promotion. Il décide comment il aborde la grosse saison, en écrivant ce qu'il vise avant de saisir.",
        },
        {
          minutes: 25,
          titre: "On décide, une dernière fois",
          detail:
            "Saisie du prix et de la quantité pour le trimestre de pointe. La prévision écrite reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez la grosse saison. Les écarts entre binômes sont ici les plus larges de toute l'animation, et chacun voit où il se situe.",
        },
        {
          minutes: 30,
          titre: "Le bilan de l'année",
          detail:
            "Chaque binôme relit ses quatre trimestres et dit, devant la classe, ce qu'il a compris de la gestion d'une boutique. Vous mettez le classement de côté : ce qui compte, c'est ce qu'ils savent maintenant expliquer.",
        },
      ],
      livrable:
        "Le carnet de bord de la grosse saison et le bilan de l'année : le prix et la quantité retenus, la vente visée, et trois phrases sur ce que le binôme a appris en quatre trimestres.",
      tracePasseport:
        "J'ai préparé la grosse saison d'une boutique en réunissant le prix, la quantité et la promotion, et j'ai fait le bilan d'une année de gestion.",
      evaluation: [
        "Le prix et la quantité de la grosse saison sont décidés ensemble.",
        "La décision s'appuie sur les trimestres précédents, pas sur une intuition.",
        "Le bilan dit en quelques phrases ce que le binôme a appris.",
      ],
    },
  ],
  formats: [
    {
      nom: "Quatre séances hebdomadaires",
      quand: "Le format d'origine, sur quatre semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine entre deux séances laisse le temps de digérer la décision précédente, ce qui suffit amplement à une classe débutante.",
    },
    {
      nom: "Deux demi-journées",
      quand: "En journée d'intégration ou de découverte des enseignements.",
      comment:
        "Deux séances le matin, deux l'après-midi. Le rythme est soutenu mais chaque décision reste isolée, et la grosse saison de fin de journée laisse un souvenir net.",
    },
    {
      nom: "En marge du cours",
      quand: "Quand l'animation sert d'accroche à un premier chapitre de gestion.",
      comment:
        "Une séance courte glissée à intervalles réguliers, chacune ouvrant la notion que le cours formalisera ensuite. La partie reste ouverte entre deux séances.",
    },
  ],
  evaluationFinale: [
    "Les quatre carnets de bord, remplis au fil des séances, pour l'essentiel de l'appréciation.",
    "La participation aux moments de classe, où l'on explique un écart plutôt que de le subir.",
    "Le bilan final, où chaque binôme dit ce qu'il a appris, compte davantage que sa place au classement.",
    "Rien ici ne se note sur le résultat du jeu : une animation de découverte se juge sur ce que l'élève sait expliquer, pas sur ce qu'il a gagné.",
  ],
  prolongements: [
    "Enchaîner sur un atelier de section de technicien, où les mêmes leviers se retrouvent avec la trésorerie et la structure en plus.",
    "Rejouer les quatre trimestres en changeant de secteur, pour montrer qu'une boutique et un site en ligne ne se pilotent pas de la même façon.",
    "Ouvrir le niveau suivant sur la même boutique, une fois les quatre leviers de base bien tenus.",
  ],
  faq: [
    {
      question: "Faut-il un cours de gestion avant cette animation ?",
      reponse:
        "Non, c'est même l'inverse. L'animation est faite pour venir avant le cours : elle donne aux élèves l'expérience d'une marge, d'un stock et d'une saison, sur laquelle le cours viendra ensuite poser des mots. Une classe qui a joué comprend un chapitre de gestion bien plus vite qu'une classe qui le découvre à froid.",
    },
    {
      question: "Le niveau retenu est très fermé, est-ce un défaut ?",
      reponse:
        "Non, c'est le point. Un débutant qui aurait accès à la trésorerie, au recrutement et à l'investissement prendrait dix décisions qu'il ne comprend pas, et n'apprendrait rien d'aucune. En n'ouvrant que le prix et la quantité, l'animation garantit que chaque décision est comprise. Les autres leviers viendront, un atelier plus tard.",
    },
    {
      question: "Pourquoi des binômes plutôt que des équipes de trois ?",
      reponse:
        "Parce qu'à ce niveau, chaque élève doit prendre part à la seule décision de la séance, et un trio en laisse toujours un en retrait. Le binôme force les deux à trancher ensemble. Vous pouvez passer à trois si votre effectif l'impose, en confiant au troisième la tenue du carnet de bord.",
    },
    {
      question: "Que faire d'un binôme qui a tout perdu dès le premier trimestre ?",
      reponse:
        "Le féliciter, presque. Une boutique qui se plante tôt et qui comprend pourquoi apprend davantage qu'une boutique qui réussit sans savoir comment. Aidez le binôme à lire son résultat, laissez-le corriger au trimestre suivant, et notez sa lucidité plutôt que sa marge.",
    },
    {
      question: "Deux heures par séance, est-ce assez ?",
      reponse:
        "Oui, parce qu'une seule décision est à prendre. Le déroulé tient en deux heures parce qu'il ne demande qu'un calcul et un choix, suivis du temps de voir le résultat. Si vous disposez de plus, allongez le moment de classe final, qui est celui où la notion se fixe.",
    },
  ],
};
