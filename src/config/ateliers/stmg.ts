import type { AtelierDefinition } from "./types";

/**
 * ANIMATION DE DÉCOUVERTE · BACCALAURÉAT STMG.
 *
 * Trois séances de deux heures sur NOVA, l'atelier d'enceintes. C'est la
 * première rencontre d'un élève de lycée avec la gestion d'une entreprise, et
 * elle ne se joue pas comme un atelier de BTS : on n'y prépare pas une épreuve
 * professionnelle, on y installe des notions que le programme reprendra pendant
 * deux ans.
 *
 * D'où trois choix qui la distinguent des ateliers de section de technicien.
 *
 * Le niveau de jeu retenu n'ouvre que le prix, le volume produit et la
 * communication. Un élève de première qui découvrirait au premier tour un
 * panneau de dix décisions les prendrait au hasard, et le tour suivant ne lui
 * apprendrait rien puisqu'il ne saurait pas laquelle a agi.
 *
 * Le monde variable est décoché. En découverte, un aléa fait perdre une équipe
 * qui avait raison, et la classe en retient que le jeu est injuste au lieu d'en
 * retenir un raisonnement.
 *
 * Les tours ne sont pas commentés par le professeur avant que la classe ne les
 * ait lus. Une animation de découverte se juge à ce que les élèves disent au
 * troisième tour, pas à ce qu'ils ont recopié au premier.
 *
 * La même trame sert en première et en terminale. Ce qui change n'est pas le
 * déroulé mais la question posée au débriefing, et chaque séance dit laquelle.
 */
export const ATELIER_STMG: AtelierDefinition = {
  code: "stmg",
  titre: "Découvrir la gestion d'une entreprise en trois séances",
  diplome: "Baccalauréat STMG",
  annee: "Première et terminale",
  nature: "Animation de découverte",
  traceLabel: "portfolio de compétences",
  referentielLabel: "Thèmes du programme",
  referentielAccord: "mobilisés",
  pitch:
    "Trois séances de deux heures. Chaque équipe dirige le même atelier de fabrication, fixe son prix, décide combien produire et combien investir en communication, puis découvre au tour suivant ce que le marché a fait de ses choix. Aucun prérequis : la première décision se prend avant le premier cours.",
  resume:
    "Une première rencontre avec la décision de gestion, du prix affiché au compte de résultat, en trois séances et sans prérequis.",
  difficulte: 1,
  difficulteLabel: "Découverte",
  format: "3 séances de 2 h",
  pourquoi:
    "En classe de première, la création de valeur s'énonce facilement et se comprend mal, parce que rien dans un cours ne fait sentir qu'une décision engage. Un élève à qui l'on demande si le prix doit monter répond au hasard, et le corrigé lui donne une réponse qu'il oublie. Ici l'équipe fixe son prix, et le trimestre suivant lui montre ses ventes, sa marge et sa place dans la classe. La discussion change de nature : elle ne porte plus sur ce qu'il fallait répondre, mais sur ce qui s'est passé. En terminale, la même trame sert d'entrée dans le programme du tronc commun, et le débriefing se déplace de la décision vers l'organisation qui la prend.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 1,
    niveauNom: "Découverte",
    equipes: 8,
    bots: 0,
    tva: false,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 3,
    effectifParEquipe: "trois ou quatre élèves",
    notes:
      "NOVA fabrique et vend des enceintes : on y achète de la matière, on produit, on stocke ce qui ne part pas, et on encaisse plus tard qu'on ne paie. C'est le cycle le plus court à comprendre et le seul où les trois notions du début, le coût, la marge et le stock, se voient dans la même page. Le niveau retenu n'ouvre que le prix, le volume et la communication : trois décisions se relisent, dix se subissent. La taxe sur la valeur ajoutée est laissée de côté en découverte, elle ferait porter la lecture du résultat sur une mécanique fiscale avant que le résultat lui même ne soit lu. Toutes les équipes affrontent le même marché, sans aléa : ce qui distingue deux résultats est alors une décision, et rien d'autre.",
  },
  seances: [
    {
      numero: 1,
      titre: "Décider sans savoir",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "Création de valeur et performance · Première, sciences de gestion et numérique",
        "À la rencontre du management des organisations · Première, management",
        "Les organisations et l'activité de production de biens et de services · Terminale, tronc commun",
      ],
      objectif:
        "Prendre une première décision de gestion sans cours préalable, puis découvrir ce qu'elle a produit, pour installer le besoin des notions plutôt que de les annoncer.",
      competences: [
        "Je repère, dans la situation d'une entreprise, ce qu'elle vend, ce que cela lui coûte et ce qu'il lui reste.",
        "Je fixe un prix de vente et je dis sur quoi je me suis appuyé pour le fixer.",
        "Je lis un compte de résultat simple et j'y retrouve la décision que mon équipe a prise.",
      ],
      notions: [
        "chiffre d'affaires",
        "coût d'achat des matières",
        "marge",
        "résultat",
        "stock",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation au tableau. Constituez des équipes de trois ou quatre, sans les composer par niveau : la discussion vaut mieux qu'un classement. Imprimez la grille de décision vierge, une par équipe. Résistez à l'envie de faire un cours d'introduction : cette séance repose entièrement sur le fait que les élèves décident avant de savoir.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes",
          detail:
            "Vous annoncez la règle du jeu : trois séances, trois trimestres, une seule entreprise par équipe, et un document rendu à la fin de chaque séance. Aucune notion n'est donnée. Les équipes rejoignent la partie avec le code et choisissent le nom de leur entreprise.",
        },
        {
          minutes: 25,
          titre: "Que vend cette entreprise",
          detail:
            "Chaque équipe lit la situation de départ et relève trois choses : ce que l'atelier fabrique, ce que lui coûte une unité fabriquée, et ce que lui coûte un trimestre d'ouverture même sans vendre. Elles écrivent ces trois nombres sur leur grille.",
        },
        {
          minutes: 25,
          titre: "Le premier prix",
          detail:
            "L'équipe fixe son prix de vente et son volume de production. Vous circulez sans corriger et sans valider : un prix trop bas se paiera au tour suivant, et c'est cette expérience qui vaut la leçon. Chaque équipe écrit en une phrase pourquoi elle a choisi ce prix.",
        },
        {
          minutes: 20,
          titre: "Communication et saisie",
          detail:
            "L'équipe décide ce qu'elle consacre à faire connaître son produit, puis valide ses décisions. Elle note ce qu'elle attend du trimestre : combien d'unités vendues, et si le résultat sera positif.",
        },
        {
          minutes: 10,
          titre: "Clôture du trimestre",
          detail:
            "Vous clôturez le premier trimestre. Chaque équipe reçoit ses ventes, son compte de résultat et sa position dans la classe.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "Vous affichez deux comptes de résultat côte à côte, celui de l'équipe la mieux placée et celui d'une équipe qui a vendu davantage sans gagner davantage. La classe cherche l'explication. En première, on nomme alors la marge. En terminale, on demande en plus ce que cette entreprise a créé comme valeur, et pour qui.",
        },
      ],
      livrable:
        "La grille de décision du premier trimestre, une page : coût d'une unité, charges du trimestre, prix retenu et sa justification en une phrase, ventes attendues, puis ventes réelles et résultat obtenu.",
      tracePasseport:
        "J'ai pris une décision de prix pour une entreprise, je l'ai justifiée, et j'ai confronté ce que j'attendais à ce que le marché a réellement donné.",
      evaluation: [
        "Les trois nombres relevés dans la situation de départ sont exacts.",
        "La justification du prix s'appuie sur un coût ou sur la concurrence, pas sur une préférence.",
        "L'écart entre les ventes attendues et les ventes réelles est constaté et commenté en une phrase.",
      ],
    },
    {
      numero: 2,
      titre: "Ce que la décision a coûté",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: [
        "Évaluation et performance · Première, sciences de gestion et numérique",
        "Temps et risque · Première, sciences de gestion et numérique",
        "Les organisations et les acteurs · Terminale, tronc commun",
      ],
      objectif:
        "Relier chaque euro du résultat à une décision prise au tour précédent, et corriger une décision en sachant dire ce qu'on en attend.",
      competences: [
        "Je distingue une charge qui augmente avec les ventes d'une charge qui tombe tous les trimestres.",
        "Je calcule combien d'unités mon entreprise doit vendre pour ne rien perdre.",
        "Je modifie une décision et j'annonce à l'avance l'effet que j'en attends sur le résultat.",
      ],
      notions: [
        "charges variables",
        "charges fixes",
        "seuil de rentabilité",
        "marge sur coût variable",
        "invendus et stock",
      ],
      preparation:
        "Relisez les grilles rendues à la première séance et repérez deux équipes aux stratégies opposées : une qui a vendu cher à peu de clients, une qui a vendu bas à beaucoup. Elles ouvriront le débriefing. Préparez au tableau un tableau vide à deux colonnes, charges qui suivent les ventes et charges qui ne les suivent pas, que la classe remplira elle même.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe reprend son compte de résultat et surligne les lignes qu'elle ne comprend pas. Vous collectez ces lignes au tableau sans y répondre encore.",
        },
        {
          minutes: 30,
          titre: "Deux sortes de charges",
          detail:
            "La classe range les charges de NOVA en deux colonnes : celles qui augmentent quand on produit plus, celles qui tombent de toute façon. Les lignes incomprises de la phase précédente trouvent presque toutes leur place ici.",
        },
        {
          minutes: 25,
          titre: "Combien faut il vendre",
          detail:
            "Chaque équipe calcule sa marge sur une unité vendue, puis le nombre d'unités qui couvre ses charges du trimestre. Elle compare ce nombre à ce qu'elle a réellement vendu au premier trimestre.",
        },
        {
          minutes: 20,
          titre: "Deuxième décision",
          detail:
            "L'équipe corrige son prix, son volume et sa communication, et inscrit sur sa grille l'effet qu'elle en attend, chiffré. Cet engagement écrit est ce qui sera relu au tour suivant.",
        },
        {
          minutes: 10,
          titre: "Clôture du trimestre",
          detail:
            "Vous clôturez le deuxième trimestre et laissez chaque équipe découvrir seule si son attente était juste.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Les deux équipes repérées avant la séance exposent leur stratégie et leur seuil. La classe constate que deux chemins opposés peuvent donner le même résultat, et que ce n'est pas le prix seul qui décide. En terminale, vous ajoutez la question des acteurs : qui, dans cette entreprise, subit la décision qui vient d'être prise.",
        },
      ],
      livrable:
        "La fiche de seuil de l'équipe, une page : les charges rangées en deux colonnes, la marge sur une unité vendue, le nombre d'unités à vendre pour ne rien perdre, et l'effet attendu de la décision du trimestre, chiffré avant clôture.",
      tracePasseport:
        "J'ai distingué les charges variables des charges fixes d'une entreprise et j'ai calculé le nombre de ventes nécessaire pour couvrir ses charges.",
      evaluation: [
        "Le rangement des charges en deux colonnes est exact, y compris pour les lignes discutées en classe.",
        "Le seuil est exprimé en unités à vendre, et pas seulement en euros.",
        "L'effet attendu de la décision est écrit avant la clôture, chiffré, et non reconstruit après coup.",
      ],
    },
    {
      numero: 3,
      titre: "Rendre compte de ce qu'on a fait",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "Création de valeur et performance · Première, sciences de gestion et numérique",
        "Le management stratégique · Première, management",
        "Les organisations et la société · Terminale, tronc commun",
      ],
      objectif:
        "Présenter en quelques minutes ce que l'équipe a décidé, ce que cela a donné et ce qu'elle ferait autrement, devant une classe qui a joué la même partie.",
      competences: [
        "Je choisis, parmi les indicateurs disponibles, les trois qui expliquent le mieux le résultat de mon entreprise.",
        "Je présente oralement une décision de gestion et ses conséquences chiffrées.",
        "Je reconnais une erreur de gestion et je dis ce que je ferais autrement, sans chercher d'excuse extérieure.",
      ],
      notions: [
        "performance",
        "indicateur",
        "part de marché",
        "résultat cumulé",
        "arbitrage entre volume et marge",
      ],
      preparation:
        "Préparez l'ordre de passage et affichez le classement final avant les présentations plutôt qu'après : une équipe qui sait déjà où elle finit parle de ses décisions au lieu de ménager un suspense. Prévoyez une grille d'écoute simple pour la classe, avec une seule question par équipe qui passe. Rappelez que le classement n'entre pas dans la note.",
      deroule: [
        {
          minutes: 15,
          titre: "Dernière décision",
          detail:
            "Les équipes prennent leurs décisions du troisième trimestre en tenant compte de ce qu'elles ont appris. Vous ne commentez rien.",
        },
        {
          minutes: 10,
          titre: "Clôture et classement",
          detail:
            "Vous clôturez le dernier trimestre et affichez le classement ainsi que le relevé complet de la partie.",
        },
        {
          minutes: 25,
          titre: "Préparation de la présentation",
          detail:
            "Chaque équipe choisit trois indicateurs et prépare une prise de parole de quatre minutes : ce qu'elle a décidé, ce que cela a donné, ce qu'elle ferait autrement. Elle a le droit de dire qu'elle s'est trompée, et cela rapporte des points.",
        },
        {
          minutes: 40,
          titre: "Passage des équipes",
          detail:
            "Quatre minutes par équipe, sans dépassement. La classe écoute avec sa grille et pose une seule question à chaque passage. Vous notez au tableau les décisions qui reviennent le plus souvent.",
        },
        {
          minutes: 30,
          titre: "Bilan collectif",
          detail:
            "Vous reprenez les décisions relevées et faites nommer par la classe les notions qu'elles mobilisent. En première, la liste obtenue est celle du programme de sciences de gestion, écrite par les élèves à partir de leur propre partie. En terminale, vous prolongez vers la question des choix de l'organisation et de leurs effets au delà de son résultat.",
        },
      ],
      livrable:
        "La fiche de bilan de l'équipe, une page : les trois indicateurs retenus et la raison de ce choix, la décision dont l'équipe est la plus fière, celle qu'elle regrette, et ce qu'elle ferait au quatrième trimestre.",
      tracePasseport:
        "J'ai présenté oralement le bilan de gestion d'une entreprise sur trois trimestres, en justifiant mes choix d'indicateurs et en assumant une erreur.",
      evaluation: [
        "Les trois indicateurs retenus sont justifiés par ce qu'ils expliquent du résultat, pas par leur disponibilité.",
        "La prise de parole tient dans le temps donné et se comprend sans lire la fiche.",
        "L'erreur assumée est une décision de l'équipe, pas un événement subi.",
      ],
    },
  ],
  formats: [
    {
      nom: "Trois semaines de suite",
      quand: "Le format d'origine, en début d'année ou après les conseils de classe.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine qui sépare deux séances laisse le temps de traiter en cours la notion que la séance a fait apparaître, ce qui est tout l'intérêt de l'ordre retenu.",
    },
    {
      nom: "Demi-journée banalisée",
      quand: "Journée d'intégration, semaine de la spécialité, portes ouvertes.",
      comment:
        "Les trois séances s'enchaînent avec une pause entre la deuxième et la troisième. Le rythme est plus tendu et le bilan collectif plus court, mais la mémoire des trimestres est meilleure et la classe voit le cycle complet dans la même journée.",
    },
    {
      nom: "Entrée en terminale",
      quand: "À la rentrée de terminale, avec des élèves qui ont déjà fait de la gestion en première.",
      comment:
        "Le déroulé ne change pas, les questions de débriefing si : chaque séance en propose une version terminale, tournée vers l'organisation et ses acteurs plutôt que vers le calcul. Vous pouvez alors monter d'un cran le niveau de jeu à la création de la partie.",
    },
  ],
  evaluationFinale: [
    "Les fiches rendues au fil des séances, notées ensemble, pour la moitié de la note.",
    "La prise de parole de la dernière séance, pour un quart.",
    "La qualité de l'écoute et la pertinence de la question posée aux autres équipes, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note. Une équipe peut finir dernière et rendre le meilleur bilan, et c'est un message qu'il vaut mieux faire passer dès la première séance.",
  ],
  prolongements: [
    "Rejouer les trois mêmes trimestres avec le monde variable activé : la classe découvre qu'une bonne décision peut mal finir, ce qui ouvre la question du risque.",
    "Basculer sur le concept store pour opposer, sur le même déroulé, une entreprise qui fabrique et une entreprise qui achète pour revendre.",
    "En terminale, prolonger jusqu'au sixième trimestre en montant d'un cran le niveau de jeu, ce qui ouvre les décisions de trésorerie que le programme de la spécialité gestion et finance mobilise.",
  ],
  faq: [
    {
      question: "Mes élèves n'ont jamais fait de gestion, est ce jouable en début de première ?",
      reponse:
        "Oui, et c'est le moment prévu. La première séance ne suppose aucune notion : elle demande de lire trois nombres dans une situation et de fixer un prix. Les notions arrivent ensuite, appelées par ce que les équipes ont vécu, ce qui est exactement l'ordre inverse d'un cours et exactement celui qui fait retenir.",
    },
    {
      question: "Pourquoi seulement trois décisions alors que le jeu en propose beaucoup plus ?",
      reponse:
        "Parce qu'une décision ne s'apprend qu'à condition de pouvoir en lire l'effet. Avec dix décisions simultanées, un élève de première ne sait pas laquelle a produit son résultat, et le tour suivant ne lui apprend rien. Le niveau de jeu s'élève à la création de la partie si votre classe a déjà de la bouteille, et le déroulé reste valable.",
    },
    {
      question: "La même animation peut elle vraiment servir en première et en terminale ?",
      reponse:
        "Le déroulé oui, les questions non. Chaque séance porte une question de débriefing différente selon le niveau : en première on nomme la marge, le seuil et la performance, en terminale on interroge l'organisation, ses acteurs et ses choix. C'est le débriefing qui fait le niveau, pas la difficulté du jeu.",
    },
    {
      question: "Combien d'élèves par équipe, et que faire d'une classe nombreuse ?",
      reponse:
        "Trois ou quatre par équipe, ce qui couvre une classe entière avec le nombre d'équipes prévu par les réglages. Au delà, créez une seconde partie en parallèle plutôt que d'agrandir les équipes : à cinq, deux élèves regardent les autres jouer, et ce sont rarement ceux qu'on voudrait faire travailler.",
    },
    {
      question: "Faut il noter cette animation ?",
      reponse:
        "Ce n'est pas obligatoire, et une découverte gagne souvent à ne pas l'être. Si vous notez, notez les fiches et l'oral, jamais le classement : une équipe qui a mal joué et qui l'analyse lucidement a plus appris qu'une équipe qui a gagné sans savoir pourquoi.",
    },
    {
      question: "Que faire si une équipe fait faillite dès le premier trimestre ?",
      reponse:
        "Rien, et surtout pas la relancer. Sa situation est le meilleur support de la deuxième séance : elle a devant elle un compte de résultat qui explique très clairement pourquoi on ne vend pas à perte, et la classe entière comprend le seuil de rentabilité en le regardant. Prévenez simplement l'équipe qu'elle ne sera pas notée là dessus.",
    },
  ],
};
