import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS NDRC.
 *
 * Sept séances de deux heures sur PIXEL & CO, le pure player. Le secteur a été
 * retenu parce que ses trois clientèles sont précisément les trois terrains du
 * diplôme : une acquisition payante qu'il faut rentabiliser, une base installée
 * qu'il faut garder, et des marketplaces tierces qui prennent leur commission.
 *
 * Une limite est assumée et dite en toutes lettres dans la FAQ : la simulation
 * ne joue pas un entretien de vente. Elle joue ce qui se décide AUTOUR de
 * l'entretien, ce qu'il coûte d'aller chercher un client et ce qu'il rapporte
 * de le garder. Prétendre le contraire tromperait l'enseignant qui prépare son
 * bloc de négociation.
 */
export const ATELIER_NDRC: AtelierDefinition = {
  code: "ndrc",
  titre: "Rentabiliser une clientèle sur cinq trimestres",
  formations: ["bts-ndrc"],
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "dossier de fiches descriptives d'activités",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Sept séances de deux heures. Chaque équipe pilote la même boutique en ligne, achète son trafic, garde ou perd ses clients, mesure ce que les marketplaces lui laissent, et découvre à chaque trimestre ce que sa clientèle lui a réellement rapporté.",
  resume:
    "Cinq trimestres dans un pure player, du premier euro d'acquisition au tableau de bord de la performance commerciale.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "7 séances de 2 h",
  pourquoi:
    "Le coût d'acquisition d'un client se comprend en une phrase et ne se mesure jamais dans un exercice, parce qu'un exercice le donne. Ici l'équipe fixe elle-même son budget d'acquisition, constate le trimestre suivant combien de clients il a réellement amenés, et divise. Le chiffre qui sort est le sien. La question du métier arrive alors d'elle-même : ce client, une fois payé ce qu'il a coûté à faire venir, rapporte-t-il encore quelque chose. Et celle qui suit, plus dure : vaut-il mieux en faire venir un de plus ou garder celui de l'an dernier.",
  reglages: {
    scenarioCode: "ecommerce",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 2,
    niveauNom: "Gestion",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 5,
    tourDEssai: 1,
    effectifParEquipe: "trois élèves",
    notes:
      "PIXEL & CO oppose trois clientèles qui ne se pilotent pas de la même façon : le trafic payant, qu'il faut acheter à chaque fois, la base installée, qui revient si on la soigne, et les marketplaces, qui apportent du volume contre une commission. L'atelier travaille les décisions commerciales et laisse à zéro les décisions de structure, que le niveau met à l'écran : un atelier de première année n'a pas à faire arbitrer un emprunt. Décochez « Histoires d'investissement » à la création pour que le déroulé reste celui de l'atelier. Le monde variable est décoché : toutes vos classes jouent le même marché. Les aléas restent possibles, atténués au niveau retenu, et se lisent dans le journal du tour.",
  },
  seances: [
    {
      numero: 1,
      titre: "Entrer dans PIXEL & CO sur un tour d'essai",
      dureeMinutes: 120,
      tourJoue: null,
      essai: true,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Apprendre le jeu avant que rien ne compte : lire le mandat de PIXEL & CO, ses trois clientèles digitales et ses canaux d'acquisition, jouer un trimestre d'essai de bout en bout, lire ses premiers résultats, puis lancer la vraie partie.",
      competences: [
        "Je présente un pure player en une page : ses trois clientèles, ses canaux d'acquisition et les charges qui tombent chaque trimestre.",
        "Je repère, sur l'écran de décision, ce qui se décide chaque trimestre et ce que le niveau de la partie laisse fixé.",
        "Je lis un premier compte de résultat et je distingue le chiffre d'affaires, le coût d'acquisition et la marge par clientèle.",
      ],
      notions: [
        "acquisition payante et coût par client",
        "base installée et taux de rétention",
        "commission marketplace et marge nette",
        "compte de résultat d'un pure player",
      ],
      preparation:
        "Créez la partie depuis votre espace avec ces réglages : scénario ecommerce, un trimestre par tour, niveau Gestion, cinq tours, six équipes, deux concurrents machine, TVA activée, monde variable décoché, questions de connaissances activées, et dans « Tour d'essai » un tour, sans cocher l'enchaînement automatique : c'est vous qui commencerez la vraie partie depuis l'ardoise en fin de séance. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, rôles tournants d'une séance à l'autre. Imprimez la fiche d'identité du pure player, vierge.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : sept séances, un tour d'essai qui ne compte pas puis cinq trimestres, un seul pure player, un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code et nomment leur boutique en ligne.",
        },
        {
          minutes: 25,
          titre: "L'entreprise, lue à l'écran",
          detail:
            "Chaque équipe lit le mandat de PIXEL & CO, ses trois clientèles avec leur valeur et leur taux de rétention, les canaux d'acquisition disponibles et leur coût, les marketplaces et leur commission, les charges de structure du trimestre. Elle remplit la première moitié de sa fiche d'identité : clientèles, canaux, charges.",
        },
        {
          minutes: 25,
          titre: "Le tour d'essai",
          detail:
            "Le bandeau de l'arène dit que rien ne compte. Chaque équipe lit la situation du trimestre, alloue son budget par canal et par clientèle, fixe ses prix et ses commissions marketplace, puis saisit ses décisions. Vous ne corrigez rien : un budget mal alloué est exactement ce que l'essai est fait pour absorber.",
        },
        {
          minutes: 20,
          titre: "Clôture de l'essai et premiers résultats",
          detail:
            "Vous clôturez le tour d'essai depuis votre espace. Chaque équipe lit son chiffre d'affaires par canal, son coût d'acquisition et son résultat, et reporte les trois chiffres sur sa fiche d'identité.",
        },
        {
          minutes: 20,
          titre: "Ce que l'essai apprend",
          detail:
            "Vous affichez deux équipes côte à côte : des budgets par canal, un coût d'acquisition, une marge par clientèle, un résultat. Qui a acquis le plus de clients, qui a gagné le plus, et pourquoi ce n'est pas la même équipe. La commission marketplace réduit la marge : vendre par tous les canaux n'est pas toujours plus rentable.",
        },
        {
          minutes: 20,
          titre: "La vraie partie commence",
          detail:
            "Les équipes terminent leur fiche d'identité. Vous appuyez sur « Commencer la vraie partie » depuis l'ardoise, vous confirmez, et toutes les entreprises repartent de l'état initial. Les équipes voient le bandeau de départ et lisent la situation du premier trimestre, cette fois pour de vrai.",
        },
      ],
      livrable:
        "La fiche d'identité de PIXEL & CO, une page : les trois clientèles avec leur valeur et leur taux de rétention, les canaux d'acquisition et leur coût, les commissions marketplace, les charges de structure, et les trois chiffres du tour d'essai.",
      tracePasseport:
        "J'ai présenté un pure player sur une page à partir de ses écrans de décision et de ses premiers résultats d'essai, pour ouvrir mes fiches descriptives d'activités.",
      evaluation: [
        "Les trois clientèles sont listées avec leur valeur et leur taux de rétention.",
        "Les canaux d'acquisition sont distingués avec leur coût unitaire.",
        "Les trois chiffres de l'essai sont exacts, et la différence de marge entre canal direct et marketplace est relevée.",
      ],
    },
    {
      numero: 2,
      titre: "D'où viennent les clients",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Identifier les trois canaux par lesquels arrive la clientèle, ce que chacun coûte et ce que chacun apporte, avant d'y mettre le moindre euro.",
      competences: [
        "Je distingue une clientèle qu'il faut acheter d'une clientèle qui revient d'elle-même.",
        "Je repère ce qu'un canal de vente prélève avant que la marge n'arrive dans l'entreprise.",
        "Je formule un premier plan d'action commercial, chiffré et hiérarchisé.",
      ],
      notions: [
        "canal d'acquisition",
        "trafic payant",
        "base installée",
        "commission de marketplace",
        "panier moyen",
      ],
      preparation:
        "Reprenez la partie créée à la séance d'essai et notez son code d'invitation. Constituez les équipes de trois : une responsable de l'acquisition, une de la fidélisation, une des partenaires. Imprimez la fiche des trois canaux, une par équipe, à remplir en séance.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : sept séances de deux heures, cinq trimestres, une seule boutique, un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 25,
          titre: "Les trois clientèles",
          detail:
            "Chaque équipe remplit la fiche des canaux : qui est cette clientèle, comment elle arrive, ce qu'elle accepte de payer, et ce qui la ferait partir. Aucun chiffre du jeu n'est donné : ils sont dans l'écran.",
        },
        {
          minutes: 25,
          titre: "Premier plan d'action",
          detail:
            "L'équipe choisit sur quel canal elle mise ce trimestre, et écrit ce qu'elle en attend. C'est cette phrase qui sera relue à la séance suivante, pas le classement.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, du volume et du budget d'acquisition. Les équipes qui mettent zéro en acquisition ont le droit de le faire : la séance suivante leur apprendra quelque chose.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit ses commandes par clientèle, son panier moyen et son résultat.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare l'équipe qui a le plus dépensé en acquisition et celle qui a le moins dépensé. La question reste ouverte jusqu'à la séance suivante : laquelle a eu raison. La fiche des trois canaux se finit hors séance.",
        },
      ],
      livrable:
        "La fiche des trois canaux, une page : pour chacun, qui est la clientèle, comment elle arrive, ce qu'elle coûte à atteindre, ce qu'elle rapporte, et le canal retenu ce trimestre avec sa justification.",
      tracePasseport:
        "J'ai proposé un plan d'action commercial chiffré à partir de l'analyse des canaux d'acquisition d'une entreprise de vente à distance.",
      evaluation: [
        "Les trois canaux sont distingués par ce qui les fait fonctionner, pas seulement nommés.",
        "Le prélèvement des marketplaces est identifié comme une charge, pas comme une remise.",
        "Le plan d'action annonce un résultat attendu, donc vérifiable au trimestre suivant.",
      ],
    },
    {
      numero: 3,
      titre: "Ce que coûte un client",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Calculer son propre coût d'acquisition à partir du trimestre joué, et le comparer à la marge que le client dégage.",
      competences: [
        "Je calcule un coût d'acquisition client à partir d'un budget engagé et de clients réellement venus.",
        "Je compare ce coût à la marge dégagée par une commande, et j'en tire une conclusion.",
        "Je distingue un client rentable dès la première commande d'un client rentable seulement s'il revient.",
      ],
      notions: [
        "coût d'acquisition client",
        "marge par commande",
        "marge après acquisition",
        "taux de retour de la clientèle",
        "valeur d'un client dans le temps",
      ],
      preparation:
        "Donnez en fin de séance précédente la division à faire, budget engagé sur clients venus, sans donner de valeurs. À préparer par les équipes avant la séance : leur coût d'acquisition du premier trimestre, calculé sur leurs propres chiffres lus dans leur espace, le budget engagé divisé par les seuls nouveaux clients venus. Rouvrez la fiche concept sur la marge sur coût variable, dont les équipes auront besoin pour la comparaison.",
      deroule: [
        {
          minutes: 10,
          titre: "Relecture des annonces",
          detail:
            "Chaque équipe confronte ce qu'elle avait écrit au tour précédent à ce qui s'est produit, en une phrase, sans excuse.",
        },
        {
          minutes: 25,
          titre: "Le calcul",
          detail:
            "Chaque équipe part du coût d'acquisition calculé avant la séance, le vérifie, puis le pose à côté de sa marge par commande. Le moment de bascule de l'atelier se joue ici, quand une équipe découvre que son client lui a coûté plus qu'il ne rapporte.",
        },
        {
          minutes: 25,
          titre: "Rentable quand",
          detail:
            "L'équipe cherche à partir de combien de commandes son client devient rentable, et ce qu'il faudrait pour qu'il en passe autant. La réponse tient dans la clientèle fidèle du scénario.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, en arbitrant entre acheter de nouveaux clients et soigner ceux qui sont déjà là.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le coût d'acquisition et la marge après acquisition apparaissent dans les indicateurs de chaque équipe, à côté de leur propre calcul.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On confronte le calcul fait à la main et l'indicateur affiché. Les écarts se discutent : ils viennent presque toujours d'un budget oublié ou d'un diviseur trop large : les commandes des fidèles et des marketplaces ne se comptent pas.",
        },
      ],
      livrable:
        "La note de rentabilité client : le coût d'acquisition calculé et son détail, la marge par commande, le nombre de commandes à partir duquel le client devient rentable, et l'arbitrage retenu pour le trimestre.",
      tracePasseport:
        "J'ai calculé le coût d'acquisition d'un client et je l'ai confronté à la marge dégagée pour arbitrer entre conquête et fidélisation.",
      evaluation: [
        "Le coût d'acquisition est calculé sur les seules commandes des nouveaux clients, pas sur toutes les commandes.",
        "La comparaison se fait avec la marge, jamais avec le prix de vente.",
        "L'arbitrage entre conquête et fidélisation est tranché, pas renvoyé dos à dos.",
      ],
    },
    {
      numero: 4,
      titre: "Le service après-vente se paie",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "Bloc 1 · Relation client et négociation-vente",
        "Bloc 2 · Relation client à distance et digitalisation",
      ],
      objectif:
        "Mesurer ce que les retours et les réclamations retirent à la marge, et décider du niveau de service que l'entreprise peut tenir.",
      competences: [
        "Je chiffre ce qu'un retour produit retire à la marge d'une commande.",
        "Je relie le niveau de service rendu à la fidélité de la clientèle du trimestre suivant.",
        "Je propose une politique de service, avec ce qu'elle coûte et ce qu'elle évite.",
      ],
      notions: [
        "retour produit",
        "réclamation client",
        "coût du service après-vente",
        "satisfaction et fidélité",
        "qualité de service",
      ],
      preparation:
        "Repérez dans le scénario les décisions qui agissent sur la qualité de service, pour pouvoir renvoyer les équipes vers le bon panneau sans le leur montrer. À préparer par les équipes avant la séance : le relevé, dans leur espace, de ce que les retours leur ont coûté au trimestre joué, et le calcul de ce qu'un retour retire à la marge de la commande concernée. Préparez une fiche de politique de service vierge.",
      deroule: [
        {
          minutes: 10,
          titre: "Retour sur le trimestre",
          detail:
            "Les équipes disent ce que leur ont coûté les retours, relevé avant la séance, poste souvent découvert à ce moment-là parce qu'il ne se voit pas dans le prix affiché.",
        },
        {
          minutes: 25,
          titre: "Combien coûte un retour",
          detail:
            "Chaque équipe part du calcul préparé avant la séance, ce qu'un retour retire à la marge de la commande concernée, le vérifie, puis chiffre ce que le taux de retour du trimestre a coûté au total.",
        },
        {
          minutes: 25,
          titre: "Construire une politique de service",
          detail:
            "L'équipe décide de son niveau de service et de son budget, et écrit ce qu'elle en attend sur la fidélité. Une équipe peut choisir de ne rien dépenser, à condition de dire ce qu'elle accepte de perdre.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions. Le budget de service se défend devant l'équipe comme devant une direction. Un mot sur le trimestre suivant : la capacité de préparation est bornée et le pic arrive ; le stock qui servira les fêtes se constitue dès maintenant.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. L'effet du service ne se lit pas entièrement ce trimestre : il se verra sur la clientèle qui revient au suivant, et il faut le dire.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On oppose l'équipe qui a le plus investi dans le service et celle qui a le moins investi, en notant que le verdict n'est pas encore tombé. La fiche de politique de service se finit hors séance.",
        },
      ],
      livrable:
        "La fiche de politique de service : le coût d'un retour, le coût total du trimestre, le niveau de service retenu, son budget, et l'effet attendu sur la clientèle qui revient.",
      tracePasseport:
        "J'ai proposé une politique de service argumentée à partir du coût chiffré du service après-vente d'une entreprise de vente à distance.",
      evaluation: [
        "Le coût d'un retour est rapporté à la marge de la commande, pas à son prix.",
        "L'effet attendu sur la fidélité est annoncé avant la clôture.",
        "Une équipe qui choisit de ne pas investir dit explicitement ce qu'elle accepte de perdre.",
      ],
    },
    {
      numero: 5,
      titre: "Tenir un pic de commandes",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 3 · Relation client et animation de réseaux",
      ],
      objectif:
        "Préparer le trimestre où se concentre une grande part de l'année : avoir le stock, la capacité de préparation et le trafic, tous les trois en même temps.",
      competences: [
        "J'anticipe un volume de commandes à partir des trimestres joués et de la saison.",
        "Je vérifie que ma capacité de préparation suit le trafic que j'achète.",
        "Je dimensionne un budget d'acquisition et le stock qui va avec, pour le trimestre où chaque commande manquée coûte le plus.",
      ],
      notions: [
        "saisonnalité",
        "capacité de préparation",
        "rupture de stock",
        "stock d'anticipation",
        "taux de service",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : tenez le minutage. À préparer par les équipes avant la séance : la synthèse de leurs trois trimestres joués, lue dans leur espace, commandes par clientèle, panier moyen, trafic acheté et stock de fin de trimestre, sans rien dire de la saison qui vient. Préparez la fiche de préparation du pic, où l'équipe écrit son volume attendu avant de saisir quoi que ce soit.",
      deroule: [
        {
          minutes: 10,
          titre: "Ce que dit la saison",
          detail:
            "Vous annoncez sans chiffrer que le trimestre qui s'ouvre concentre une part majeure de l'année. Les équipes retrouvent seules l'ampleur du pic dans les informations du jeu.",
        },
        {
          minutes: 25,
          titre: "Prévision de commandes",
          detail:
            "Chaque équipe part de la synthèse de ses trimestres joués, préparée avant la séance, y applique le coefficient de saison, et inscrit sa prévision sur sa fiche.",
        },
        {
          minutes: 25,
          titre: "Les trois conditions",
          detail:
            "L'équipe vérifie ses trois conditions : le stock, la capacité de préparation, le trafic. Il suffit qu'une seule manque pour que les deux autres soient perdues, et c'est la leçon de la séance.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie de l'approvisionnement, du prix et du budget d'acquisition. La prévision reste sur la table, visible.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre du pic. C'est ici que les écarts entre équipes sont les plus larges.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Chaque équipe dit laquelle de ses trois conditions a lâché. Celle qui a tout tenu explique comment, et c'est elle qui fait le cours. L'écart constaté s'écrit sur la fiche de préparation du pic hors séance.",
        },
      ],
      livrable:
        "La fiche de préparation du pic : le volume attendu et son raisonnement, la vérification des trois conditions, les décisions prises, et l'écart constaté après clôture avec la condition qui a manqué.",
      tracePasseport:
        "J'ai préparé un pic d'activité en vente à distance en vérifiant que le stock, la capacité de préparation et le trafic suivaient ensemble.",
      evaluation: [
        "La prévision s'appuie sur les trimestres joués, pas sur une intuition.",
        "Les trois conditions sont vérifiées séparément, chacune avec un chiffre.",
        "La condition qui a manqué est nommée après coup, sans être imputée à la chance.",
      ],
    },
    {
      numero: 6,
      titre: "Négocier sa place chez les partenaires",
      dureeMinutes: 120,
      tourJoue: 5,
      processus: [
        "Bloc 3 · Relation client et animation de réseaux",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Décider ce qu'un canal partenaire vaut une fois sa commission payée, et préparer les arguments qui feraient baisser cette commission.",
      competences: [
        "Je calcule la marge qui reste après la commission d'un partenaire.",
        "Je compare un volume apporté par un tiers à un volume conquis en direct.",
        "Je prépare une négociation en identifiant ce que j'apporte au partenaire.",
      ],
      notions: [
        "commission de distribution",
        "marge après commission",
        "dépendance à un canal",
        "argumentaire de négociation",
        "chiffre d'affaires par canal",
      ],
      preparation:
        "Préparez la trame d'argumentaire en deux colonnes, ce que le partenaire apporte et ce que l'entreprise lui apporte, que les équipes rempliront. À préparer par les équipes avant la séance : le calcul de ce qui leur reste d'une commande passée par un canal partenaire, une fois la commission prélevée, comparé à une commande en direct ; les trois chiffres sont dans leur espace, le taux sous l'historique des ventes, le montant du trimestre au compte de résultat, le chiffre d'affaires de chaque canal dans l'historique. Prévoyez un temps de jeu de rôle au milieu de la séance, deux équipes face à face.",
      deroule: [
        {
          minutes: 10,
          titre: "Retour sur le pic",
          detail:
            "Chaque équipe dit en une phrase ce qu'elle a corrigé depuis le trimestre précédent, et ce qu'il lui en a coûté.",
        },
        {
          minutes: 20,
          titre: "Ce que laisse un partenaire",
          detail:
            "L'équipe part du calcul préparé avant la séance, ce qui lui reste d'une commande passée par un canal partenaire une fois la commission prélevée, face à une commande en direct, le vérifie à l'écran, puis mesure la part de son chiffre d'affaires qui dépend du canal.",
        },
        {
          minutes: 20,
          titre: "Préparer la négociation",
          detail:
            "Chaque équipe remplit la trame en deux colonnes et formule trois arguments pour obtenir une commission plus basse. Le meilleur argument n'est jamais le volume seul.",
        },
        {
          minutes: 20,
          titre: "Jeu de rôle",
          detail:
            "Les équipes se mettent par deux, trois duos en parallèle : l'une joue l'entreprise, l'autre le partenaire, cinq minutes, puis on inverse ; vous circulez d'un duo à l'autre. La simulation ne joue pas cet entretien : c'est la classe qui le joue.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, en tenant compte de ce que la négociation a appris sur la valeur réelle du canal.",
        },
        {
          minutes: 25,
          titre: "Clôture et débriefing",
          detail:
            "Vous clôturez le dernier trimestre joué. On regarde quelle part du chiffre d'affaires de chaque équipe dépend d'un tiers, et ce que cela signifie pour l'an prochain. La comparaison qui porte : un canal pèse toujours moins dans la marge que dans les commandes, et c'est cet écart que la négociation cherche à réduire. Le dossier partenaire se finit hors séance.",
        },
      ],
      livrable:
        "Le dossier partenaire : la marge après commission comparée à la marge en direct, la part du chiffre d'affaires dépendant du canal, la trame d'argumentaire remplie, et les trois arguments retenus.",
      tracePasseport:
        "J'ai préparé les arguments d'une négociation commerciale à partir de la rentabilité d'un canal de distribution partenaire.",
      evaluation: [
        "La commission est traitée comme une charge qui réduit la marge, pas comme une remise sur le prix.",
        "La dépendance au canal est exprimée en part du chiffre d'affaires.",
        "Les arguments de négociation portent sur ce que l'entreprise apporte, pas seulement sur ce qu'elle demande.",
      ],
    },
    {
      numero: 7,
      titre: "Rendre compte de la performance commerciale",
      dureeMinutes: 120,
      tourJoue: null,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 3 · Relation client et animation de réseaux",
      ],
      objectif:
        "Construire le tableau de bord commercial des cinq trimestres et le présenter oralement, comme on rend compte à une direction commerciale.",
      competences: [
        "Je construis un tableau de bord commercial qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent la performance, et j'écarte ceux qui la décorent.",
        "Je présente oralement une gestion commerciale, ses réussites et ses erreurs, devant un jury.",
      ],
      notions: [
        "tableau de bord commercial",
        "coût d'acquisition",
        "panier moyen",
        "part de chiffre d'affaires par canal",
        "compte rendu d'activité",
      ],
      preparation:
        "Annoncez la soutenance à la séance précédente et donnez la grille aux équipes. À préparer par les équipes avant la séance : une version de travail de leur tableau de bord des cinq trimestres, construite depuis leur espace, une page, quatre indicateurs au maximum. Prévoyez un ordre de passage tiré au sort et un temps de parole tenu au chronomètre.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille, tirage de l'ordre de passage. Cinq minutes de présentation, trois minutes de questions par équipe.",
        },
        {
          minutes: 25,
          titre: "Construction du tableau de bord",
          detail:
            "Les équipes partent de la version de travail préparée avant la séance et la finissent. Contrainte forte : une page, quatre indicateurs au maximum, chacun justifié par ce qu'il explique.",
        },
        {
          minutes: 15,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole et préparation des questions probables. Vous repérez les tableaux illisibles avant qu'ils ne soient projetés.",
        },
        {
          minutes: 50,
          titre: "Soutenances",
          detail:
            "Passage des équipes. Le jury, ce sont vous et deux élèves d'une autre équipe, qui posent au moins une question chacun.",
        },
        {
          minutes: 20,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le tableau de bord et la soutenance. Chaque élève rédige les phrases qui iront dans ses fiches descriptives d'activités.",
        },
      ],
      livrable:
        "Le tableau de bord commercial des cinq trimestres : une page, quatre indicateurs justifiés, la clientèle la plus rentable et ce qui l'a rendue telle, et la présentation orale de cinq minutes qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord commercial d'une entreprise de vente à distance sur cinq trimestres et je l'ai présenté devant un jury.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Le coût d'acquisition figure au tableau, ou son absence est justifiée.",
        "L'oral assume au moins une erreur commerciale et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Sept séances hebdomadaires",
      quand: "Le format d'origine, sur sept semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. L'intervalle laisse aux équipes le temps de rédiger leur livrable et à vous celui de le lire avant la séance suivante.",
    },
    {
      nom: "Trois demi-journées",
      quand: "Quand l'emploi du temps donne des blocs de quatre heures.",
      comment:
        "La séance d'essai la veille, puis deux séances par demi-journée, avec une pause franche entre les deux. Attention au trimestre du pic, qui perd de sa force s'il est enchaîné juste après une autre séance : placez-le en début de bloc.",
    },
    {
      nom: "Fil rouge de l'année",
      quand:
        "Quand l'atelier accompagne le bloc de relation client à distance.",
      comment:
        "Une séance par mois, chaque séance précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions hors classe.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord commercial de la dernière séance, pour un quart.",
    "La soutenance orale et les réponses au jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre la meilleure analyse de sa clientèle.",
  ],
  prolongements: [
    "Rejouer les mêmes trimestres avec le monde variable activé : le coût d'acquisition se met alors à bouger tout seul, ce qui est la réalité du métier.",
    "Basculer sur le secteur du commerce de détail pour opposer, sur le même déroulé, une boutique qui attend sa clientèle et un site qui achète son trafic.",
    "Faire jouer le sixième trimestre en autonomie, hors séance, et le noter sur le seul écart entre la prévision annoncée et le résultat obtenu.",
  ],
  faq: [
    {
      question: "La simulation joue-t-elle un entretien de vente ?",
      reponse:
        "Non, et il faut le dire avant de se lancer. Elle joue ce qui se décide autour de l'entretien : ce qu'il coûte d'aller chercher un client, ce qu'il rapporte de le garder, ce que laisse une commande passée par un partenaire. Le face à face lui-même reste un jeu de rôle de classe, et la sixième séance en prévoit un, adossé à des chiffres que les équipes ont produits.",
    },
    {
      question:
        "Pourquoi le commerce en ligne plutôt qu'un secteur avec des commerciaux ?",
      reponse:
        "Parce que c'est le seul secteur où le coût d'acquisition d'un client est visible et mesurable par l'élève lui-même. Ailleurs, il est noyé dans les charges de structure. Ici l'équipe engage un budget, compte les clients venus, et divise : le concept central du diplôme devient un calcul qu'elle a fait sur ses propres chiffres.",
    },
    {
      question:
        "L'atelier laisse à zéro les décisions de structure, est-ce un manque ?",
      reponse:
        "C'est un choix. Un atelier de première année en NDRC porte sur la clientèle, pas sur le haut de bilan, et ouvrir des décisions que les équipes prendraient au hasard brouillerait la lecture de leurs marges. Si vous conduisez l'atelier en deuxième année, travaillez aussi les décisions de financement et d'investissement, déjà à l'écran : elles s'ajoutent sans rien changer au déroulé.",
    },
    {
      question: "Comment évaluer le bloc de négociation avec cet atelier ?",
      reponse:
        "Par le jeu de rôle de la sixième séance, qui est la seule partie négociée du déroulé, et par le dossier partenaire qui le prépare. Ce que l'atelier apporte à ce bloc n'est pas la technique d'entretien, c'est l'argumentaire chiffré : un élève qui sait ce que le partenaire lui prend et ce qu'il lui apporte négocie autrement.",
    },
    {
      question: "Sept séances de deux heures, est-ce compressible ?",
      reponse:
        "Oui, en retirant la sixième séance et en créant la partie sur quatre tours : la soutenance devient la sixième séance, et la commission des marketplaces se traite au débriefing de la cinquième. Ne compressez pas la séance du pic : c'est celle où les équipes découvrent qu'un trafic acheté sans capacité de préparation ne sert à rien, et elle a besoin de son temps de débriefing.",
    },
    {
      question: "Quelles épreuves du BTS cet atelier prépare-t-il ?",
      reponse:
        "E4, relation client et négociation-vente, épreuve orale sur fiches descriptives, pour la négociation avec le partenaire de la sixième séance ; E5, relation client à distance et digitalisation, épreuve écrite, pour le coût d'acquisition et la politique de service ; E6, relation client et animation de réseaux, pour le tableau de bord de la dernière séance. Vérifiez les intitulés sur le référentiel en vigueur.",
    },
  ],
};
