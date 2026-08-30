import type { AtelierDefinition } from "./types";

/**
 * ANIMATION DE DÉCOUVERTE · BACCALAURÉAT STMG.
 *
 * Quatre séances d'une heure et demie sur NOVA, l'atelier d'enceintes. C'est la
 * première rencontre d'un élève de lycée avec la gestion d'une entreprise, et
 * elle ne se joue pas comme un atelier de BTS : on n'y prépare pas une épreuve
 * professionnelle, on y installe des notions que le programme reprendra pendant
 * deux ans.
 *
 * QUATRE TRIMESTRES, ET PAS TROIS. La première version en jouait trois, ce qui
 * ne faisait pas une année et, plus grave, s'arrêtait le trimestre AVANT le pic
 * pour lequel NOVA est écrit. Le marché du secteur vaut 18 000 unités au premier
 * tour, 19 000 au deuxième, 23 000 au troisième et 49 680 au quatrième, parce
 * qu'une chaîne de magasins qui pèse plus du tiers de la demande n'entre en
 * scène qu'au troisième et passe sa grosse commande au quatrième. Une animation
 * de trois tours se jouait donc entièrement dans le creux, sans jamais
 * rencontrer le client qui fait l'intérêt du scénario, et fermait sur les trois
 * quarts d'un exercice.
 *
 * La séance dure une heure et demie et non deux heures : c'est le créneau
 * ordinaire d'un lycée, et le volume total de l'animation ne bouge pas.
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
  titre: "Découvrir la gestion d'une entreprise en quatre séances",
  diplome: "Baccalauréat STMG",
  annee: "Première et terminale",
  nature: "Animation de découverte",
  traceLabel: "portfolio de compétences",
  referentielLabel: "Thèmes du programme",
  referentielAccord: "mobilisés",
  pitch:
    "Quatre séances d'une heure et demie, soit une année entière. Chaque équipe dirige le même atelier de fabrication, fixe son prix, décide combien produire et combien consacrer à se faire connaître, puis découvre au trimestre suivant ce que le marché a fait de ses choix. Aucun prérequis : la première décision se prend avant le premier cours.",
  resume:
    "Une première rencontre avec la décision de gestion, du prix affiché au résultat de l'exercice, sur une année complète et sans prérequis.",
  difficulte: 1,
  difficulteLabel: "Découverte",
  format: "4 séances de 1 h 30",
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
    tours: 4,
    effectifParEquipe: "trois ou quatre élèves",
    notes:
      "NOVA fabrique et vend des enceintes : on y achète de la matière, on produit, on stocke ce qui ne part pas, et on encaisse plus tard qu'on ne paie. C'est le cycle le plus court à comprendre et le seul où les trois notions du début, le coût, la marge et le stock, se voient dans la même page. Le niveau retenu n'ouvre que le prix, le volume et la communication : trois décisions se relisent, dix se subissent. La taxe sur la valeur ajoutée est laissée de côté en découverte, elle ferait porter la lecture du résultat sur une mécanique fiscale avant que le résultat lui même ne soit lu. Toutes les équipes affrontent le même marché, sans aléa : ce qui distingue deux résultats est alors une décision, et rien d'autre.",
  },
  seances: [
    {
      numero: 1,
      titre: "Décider sans savoir",
      dureeMinutes: 90,
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
      notions: ["chiffre d'affaires", "coût d'achat des matières", "marge", "résultat", "stock"],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation au tableau. Constituez des équipes de trois ou quatre, sans les composer par niveau : la discussion vaut mieux qu'un classement. Imprimez la grille de décision vierge, une par équipe. Résistez à l'envie de faire un cours d'introduction : cette séance repose entièrement sur le fait que les élèves décident avant de savoir.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes",
          detail:
            "Vous annoncez la règle du jeu : quatre séances, quatre trimestres, une seule entreprise par équipe, et un document rendu à la fin de chaque séance. Aucune notion n'est donnée. Les équipes rejoignent la partie avec le code et choisissent le nom de leur entreprise.",
        },
        {
          minutes: 20,
          titre: "Que vend cette entreprise",
          detail:
            "Chaque équipe lit la situation de départ et relève trois choses : ce que l'atelier fabrique, ce que lui coûte une unité fabriquée, et ce que lui coûte un trimestre d'ouverture même sans vendre. Elles écrivent ces trois nombres sur leur grille.",
        },
        {
          minutes: 20,
          titre: "Le premier prix",
          detail:
            "L'équipe fixe son prix de vente et son volume de production. Vous circulez sans corriger et sans valider : un prix trop bas se paiera au tour suivant, et c'est cette expérience qui vaut la leçon. Chaque équipe écrit en une phrase pourquoi elle a choisi ce prix.",
        },
        {
          minutes: 15,
          titre: "Communication et saisie",
          detail:
            "L'équipe décide ce qu'elle consacre à faire connaître son produit, puis valide ses décisions. Elle note ce qu'elle attend du trimestre : combien d'unités vendues, et si le résultat sera positif.",
        },
        {
          minutes: 5,
          titre: "Clôture du trimestre",
          detail:
            "Vous clôturez le premier trimestre. Chaque équipe reçoit ses ventes, son compte de résultat et sa position dans la classe.",
        },
        {
          minutes: 20,
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
      dureeMinutes: 90,
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
          minutes: 10,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe reprend son compte de résultat et surligne les lignes qu'elle ne comprend pas. Vous collectez ces lignes au tableau sans y répondre encore.",
        },
        {
          minutes: 25,
          titre: "Deux sortes de charges",
          detail:
            "La classe range les charges de l'atelier en deux colonnes : celles qui augmentent quand on produit plus, celles qui tombent de toute façon. Les lignes incomprises de la phase précédente trouvent presque toutes leur place ici.",
        },
        {
          minutes: 20,
          titre: "Combien faut il vendre",
          detail:
            "Chaque équipe calcule sa marge sur une unité vendue, puis le nombre d'unités qui couvre ses charges du trimestre. Elle compare ce nombre à ce qu'elle a réellement vendu au premier trimestre.",
        },
        {
          minutes: 15,
          titre: "Deuxième décision",
          detail:
            "L'équipe corrige son prix, son volume et sa communication, et inscrit sur sa grille l'effet qu'elle en attend, chiffré. Cet engagement écrit est ce qui sera relu au tour suivant.",
        },
        {
          minutes: 5,
          titre: "Clôture du trimestre",
          detail:
            "Vous clôturez le deuxième trimestre et laissez chaque équipe découvrir seule si son attente était juste.",
        },
        {
          minutes: 15,
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
      titre: "Un gros client s'annonce",
      dureeMinutes: 90,
      tourJoue: 3,
      processus: [
        "Temps et risque · Première, sciences de gestion et numérique",
        "Le management stratégique · Première, management",
        "Les organisations et les acteurs · Terminale, tronc commun",
      ],
      objectif:
        "Décider aujourd'hui pour un trimestre qui n'est pas encore là, en pesant ce que coûte de produire d'avance contre ce que coûte de ne pas pouvoir livrer.",
      competences: [
        "Je repère l'arrivée d'un client qui change la taille du marché, et je dis ce qu'elle exige de mon entreprise.",
        "Je calcule ce que ma capacité de production me permet de vendre au maximum dans un trimestre.",
        "Je choisis de produire plus que je ne vends, et j'explique ce que ce stock me coûte et ce qu'il me rapportera.",
      ],
      notions: [
        "capacité de production",
        "stock",
        "prévision",
        "goulot d'étranglement",
        "coût d'une rupture",
      ],
      preparation:
        "C'est la séance qui décide de la partie, préparez la de près. Vérifiez dans l'espace enseignant la capacité de production des équipes, et notez la au tableau avant de commencer : c'est le plafond que personne ne pourra franchir au trimestre suivant. Prévoyez de ne surtout pas dire aux équipes quoi faire de l'information du nouveau client, l'intérêt de la séance tient entièrement à ce qu'elles en fassent quelque chose ou non.",
      deroule: [
        {
          minutes: 10,
          titre: "Ce que le trimestre a donné",
          detail:
            "Chaque équipe relit son résultat et confronte l'effet qu'elle avait annoncé par écrit à celui qu'elle a obtenu. Deux équipes lisent leur engagement à voix haute.",
        },
        {
          minutes: 20,
          titre: "Un nouveau client entre en scène",
          detail:
            "Une chaîne de magasins passe une première commande, modeste, et annonce qu'elle en passera une bien plus grosse au trimestre suivant. Chaque équipe note ce que ce client change : plus de volume, un prix plus bas que celui des particuliers, et un règlement qui n'arrive pas tout de suite.",
        },
        {
          minutes: 20,
          titre: "Le plafond de l'atelier",
          detail:
            "La classe calcule ce que l'atelier peut fabriquer au maximum dans un trimestre, et le compare à ce que le marché s'apprête à demander. Le constat tombe seul : la demande annoncée dépasse la capacité, et une partie sera perdue quoi qu'il arrive.",
        },
        {
          minutes: 20,
          titre: "Troisième décision",
          detail:
            "L'équipe décide de son prix, de sa communication et surtout de son volume de production. Produire plus qu'elle ne vendra ce trimestre lui constitue un stock qu'elle vendra au pic, mais qui immobilise son argent en attendant. Elle écrit son pari en une phrase.",
        },
        {
          minutes: 5,
          titre: "Clôture du trimestre",
          detail:
            "Vous clôturez le troisième trimestre. Les équipes qui ont produit d'avance voient leur stock apparaître au bilan, et leur trésorerie baisser d'autant.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "Vous mettez face à face une équipe qui a constitué un stock et une équipe qui n'a rien changé. Personne ne sait encore laquelle a eu raison, et c'est exactement ce qu'il faut dire : la décision est prise, le verdict est au trimestre suivant. En terminale, vous demandez qui, dans l'entreprise, porte le risque de ce pari.",
        },
      ],
      livrable:
        "La fiche de prévision de l'équipe, une page : la capacité maximale de l'atelier pour un trimestre, la demande attendue au trimestre suivant, l'écart entre les deux, le volume de production retenu et le pari écrit en une phrase.",
      tracePasseport:
        "J'ai comparé la capacité de production d'une entreprise à la demande annoncée, et j'ai décidé d'un volume de production en assumant par écrit le risque de mon choix.",
      evaluation: [
        "La capacité maximale de l'atelier est calculée juste, et pas estimée au jugé.",
        "L'écart entre la capacité et la demande annoncée est chiffré.",
        "Le pari est écrit avant la clôture et dit ce qu'il coûte si le pic n'arrive pas.",
      ],
    },
    {
      numero: 4,
      titre: "Le pic, et ce qu'on en retient",
      dureeMinutes: 90,
      tourJoue: 4,
      processus: [
        "Création de valeur et performance · Première, sciences de gestion et numérique",
        "Évaluation et performance · Première, sciences de gestion et numérique",
        "Les organisations et la société · Terminale, tronc commun",
      ],
      objectif:
        "Jouer le trimestre qui décide de l'exercice, puis rendre compte devant la classe de ce que l'équipe a décidé, de ce que cela a donné et de ce qu'elle ferait autrement.",
      competences: [
        "Je choisis, parmi les indicateurs disponibles, les trois qui expliquent le mieux le résultat de mon entreprise.",
        "Je présente oralement une décision de gestion et ses conséquences chiffrées sur un exercice complet.",
        "Je reconnais une erreur de gestion et je dis ce que je ferais autrement, sans chercher d'excuse extérieure.",
      ],
      notions: [
        "performance",
        "indicateur",
        "part de marché",
        "résultat de l'exercice",
        "arbitrage entre volume et marge",
      ],
      preparation:
        "Préparez l'ordre de passage et affichez le classement final avant les présentations plutôt qu'après : une équipe qui sait déjà où elle finit parle de ses décisions au lieu de ménager un suspense. Prévoyez une grille d'écoute simple pour la classe, avec une seule question par équipe qui passe. Rappelez que le classement n'entre pas dans la note, et que le quatrième trimestre boucle une année entière : c'est le résultat de l'exercice que les équipes vont commenter.",
      deroule: [
        {
          minutes: 15,
          titre: "La décision du pic",
          detail:
            "La grosse commande annoncée est là, et le marché a presque doublé. Les équipes décident vite : le prix, la communication, et ce qu'elles sortent de leur stock. Vous ne commentez rien.",
        },
        {
          minutes: 5,
          titre: "Clôture et classement",
          detail:
            "Vous clôturez le quatrième trimestre et affichez le classement ainsi que le relevé complet de l'année.",
        },
        {
          minutes: 20,
          titre: "Préparation de la présentation",
          detail:
            "Chaque équipe choisit trois indicateurs et prépare une prise de parole de trois minutes : ce qu'elle a décidé, ce que cela a donné sur l'année, ce qu'elle ferait autrement. Elle a le droit de dire qu'elle s'est trompée, et cela rapporte des points.",
        },
        {
          minutes: 30,
          titre: "Passage des équipes",
          detail:
            "Trois minutes par équipe, sans dépassement. La classe écoute avec sa grille et pose une seule question à chaque passage. Vous notez au tableau les décisions qui reviennent le plus souvent.",
        },
        {
          minutes: 20,
          titre: "Bilan collectif",
          detail:
            "Vous reprenez les décisions relevées et faites nommer par la classe les notions qu'elles mobilisent. En première, la liste obtenue est celle du programme de sciences de gestion, écrite par les élèves à partir de leur propre année. En terminale, vous prolongez vers la question des choix de l'organisation et de leurs effets au delà de son résultat.",
        },
      ],
      livrable:
        "La fiche de bilan de l'équipe, une page : les trois indicateurs retenus et la raison de ce choix, la décision dont l'équipe est la plus fière, celle qu'elle regrette, et ce qu'elle ferait si l'année reprenait.",
      tracePasseport:
        "J'ai présenté oralement le bilan de gestion d'une entreprise sur un exercice complet, en justifiant mes choix d'indicateurs et en assumant une erreur.",
      evaluation: [
        "Les trois indicateurs retenus sont justifiés par ce qu'ils expliquent du résultat, pas par leur disponibilité.",
        "La prise de parole tient dans le temps donné et se comprend sans lire la fiche.",
        "L'erreur assumée est une décision de l'équipe, pas un événement subi.",
      ],
    },
  ],
  formats: [
    {
      nom: "Quatre semaines de suite",
      quand: "Le format d'origine, en début d'année ou après les conseils de classe.",
      comment:
        "Une séance par semaine, un trimestre par séance, un mois en tout. La semaine qui sépare deux séances laisse le temps de traiter en cours la notion que la séance a fait apparaître, ce qui est tout l'intérêt de l'ordre retenu. Elle laisse aussi les équipes réfléchir au pari de la troisième séance avant de le jouer.",
    },
    {
      nom: "Demi-journée banalisée",
      quand: "Journée d'intégration, semaine de la spécialité, portes ouvertes.",
      comment:
        "Les quatre séances s'enchaînent avec une pause après la deuxième. Le rythme est plus tendu et le bilan collectif plus court, mais la mémoire des trimestres est meilleure et la classe voit l'année entière dans la même journée, pic compris.",
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
    "Rejouer la même année avec le monde variable activé : la classe découvre qu'une bonne décision peut mal finir, ce qui ouvre la question du risque et donne tout son sens au pari de la troisième séance.",
    "Basculer sur le concept store pour opposer, sur le même déroulé, une entreprise qui fabrique et une entreprise qui achète pour revendre.",
    "En terminale, prolonger jusqu'au sixième trimestre en montant d'un cran le niveau de jeu, ce qui ouvre les décisions de trésorerie que le programme de la spécialité gestion et finance mobilise, et fait vivre l'après pic.",
  ],
  faq: [
    {
      question: "Pourquoi quatre trimestres, et des séances d'une heure et demie ?",
      reponse:
        "Parce que quatre trimestres font une année, et qu'une découverte qui s'arrête en cours d'exercice ne montre pas de résultat annuel. Surtout, le quatrième trimestre est celui où une chaîne de magasins passe sa grosse commande : le marché y double, et c'est la séance qui donne son sens à tout ce qui précède. Une animation de trois séances se jouerait entièrement dans le creux. La séance d'une heure et demie est le créneau ordinaire d'un lycée, et le volume total ne bouge pas.",
    },
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
