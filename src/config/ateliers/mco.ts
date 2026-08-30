import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS MCO.
 *
 * Cinq séances de trois heures sur MAILLE & CO, le concept store. Le choix du
 * secteur n'est pas neutre : en MCO, la gestion opérationnelle ne s'apprend pas
 * sur une usine. On n'y fabrique rien, on achète pour revendre, et tout se joue
 * sur le coefficient, l'assortiment, la saisonnalité et la rotation du stock.
 *
 * Les quatre premières séances jouent un trimestre chacune et s'arrêtent sur
 * celui de Noël, qui décide de l'exercice. La cinquième ne joue rien : elle
 * rend compte. Un atelier de professionnalisation se note sur ce qui est rendu,
 * pas sur le classement du jeu.
 */
export const ATELIER_MCO: AtelierDefinition = {
  code: "mco",
  titre: "Tenir un point de vente pendant quatre trimestres",
  diplome: "BTS Management commercial opérationnel",
  annee: "Première année",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Cinq séances de trois heures. Chaque équipe tient le même magasin d'un trimestre à l'autre, choisit son assortiment, fixe ses prix, prépare Noël, et rend à chaque séance un document que l'on retrouve en magasin.",
  resume:
    "Quatre trimestres dans un concept store, du diagnostic du linéaire au tableau de bord commercial, avec Noël comme épreuve.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "5 séances de 3 h",
  pourquoi:
    "Le coefficient multiplicateur s'enseigne en une heure et s'oublie en une semaine, parce qu'un exercice donne le prix d'achat et demande le prix de vente. Ici l'équipe choisit son circuit d'approvisionnement, donc son prix d'achat, puis son prix de vente, et découvre au trimestre suivant ce que sa marge est devenue une fois la démarque passée et le stock invendu payé. La saisonnalité cesse d'être un chapitre : une équipe qui n'a pas anticipé le pic de fin d'année voit son rayon vide pendant que ses concurrentes vendent, et son taux de transformation le lui dit.",
  reglages: {
    scenarioCode: "boutique",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 4,
    notes:
      "MAILLE & CO porte un stock, trois circuits d'achat qui opposent le prix, l'image et le délai de règlement, et une saisonnalité de fin d'année qui décide de l'exercice. Le niveau retenu ouvre le financement sans ouvrir le recrutement ni l'investissement : la gestion opérationnelle d'un point de vente se joue sur l'offre, le prix et le stock, pas sur la structure. Le monde variable est décoché pour que toutes vos classes affrontent le même Noël.",
  },
  seances: [
    {
      numero: 1,
      titre: "Prendre le magasin en main",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Lire la situation d'un point de vente inconnu, en tirer sa marge unitaire et son seuil, et décider d'un premier positionnement.",
      competences: [
        "Je calcule une marge unitaire et un taux de marque à partir d'un prix d'achat et d'un prix de vente.",
        "Je détermine le nombre d'articles à vendre pour couvrir les charges de structure du trimestre.",
        "Je situe l'assortiment du magasin par rapport aux clientèles qui le fréquentent.",
      ],
      notions: [
        "prix d'achat et prix de vente",
        "coefficient multiplicateur",
        "taux de marque et taux de marge",
        "charges de structure",
        "seuil de rentabilité",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois : une responsable de l'offre, une des prix, une du suivi. Imprimez la fiche de calcul de marge vierge, une par équipe. Prévoyez que la première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : cinq séances, quatre trimestres, un seul magasin, et un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 35,
          titre: "État des lieux du magasin",
          detail:
            "Chaque équipe relève ce que le magasin possède en rayon, ce qu'il doit à ses fournisseurs, et ce que lui coûte un trimestre d'ouverture, que la caisse sonne ou non.",
        },
        {
          minutes: 35,
          titre: "La marge, article par article",
          detail:
            "L'équipe calcule sa marge unitaire, son taux de marque, puis le nombre d'articles qu'il faut vendre pour ne rien perdre. Vous circulez sans corriger : une équipe qui confond taux de marge et taux de marque le découvrira au tour suivant, et ne l'oubliera plus.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose au premier trimestre un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit son prix et son volume d'approvisionnement.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, son panier moyen, son taux de transformation et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur calcul de seuil et le confrontent à leurs ventes réelles. Vous ne dites pas qui a raison : vous affichez les deux comptes de résultat côte à côte.",
        },
      ],
      livrable:
        "La fiche de marge du magasin, une page : prix d'achat, prix de vente, coefficient, taux de marque, charges de structure du trimestre, seuil en articles, et le positionnement retenu avec sa justification.",
      tracePasseport:
        "J'ai calculé la marge et le seuil de rentabilité d'un point de vente, et j'ai justifié un positionnement à partir de ces calculs.",
      evaluation: [
        "Le taux de marque et le taux de marge sont distingués, et pas confondus.",
        "Le seuil est exprimé en articles à vendre, pas seulement en euros.",
        "Le positionnement retenu s'appuie sur une clientèle nommée, pas sur une préférence.",
      ],
    },
    {
      numero: 2,
      titre: "Choisir son circuit d'approvisionnement",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Arbitrer entre trois circuits d'achat qui opposent frontalement le prix d'achat, l'image du magasin et le délai de règlement.",
      competences: [
        "Je compare des offres fournisseurs sur autre chose que leur prix.",
        "Je mesure l'effet d'un délai de règlement fournisseur sur la trésorerie du magasin.",
        "Je défends un choix d'approvisionnement devant des collègues qui ont choisi autrement.",
      ],
      notions: [
        "circuit d'approvisionnement",
        "délai de règlement fournisseur",
        "image de l'enseigne",
        "rupture de stock",
        "trésorerie du point de vente",
      ],
      preparation:
        "Relisez les trois circuits proposés dans le scénario et leurs conséquences, pour animer le débat sans le trancher. Préparez au tableau une grille à trois colonnes, un circuit par colonne, que les équipes rempliront en séance.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le trimestre précédent",
          detail:
            "Chaque équipe relit son résultat et dit en une phrase ce qu'elle a compris. Vous notez au tableau les écarts entre le seuil calculé et les ventes réelles.",
        },
        {
          minutes: 40,
          titre: "Les trois circuits",
          detail:
            "Les équipes remplissent la grille : ce que chaque circuit coûte, ce qu'il apporte à l'image, quand il faut le payer, et ce qu'il risque de manquer.",
        },
        {
          minutes: 30,
          titre: "Débat contradictoire",
          detail:
            "Trois équipes défendent chacune un circuit devant la classe. Les autres posent les questions. Personne ne conclut : chaque équipe repart libre de son choix.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son circuit, son prix et son volume, et écrit en trois lignes ce qu'elle attend de ce choix. Cette prévision sera relue au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Les circuits choisis apparaissent dans les résultats de chaque équipe, avec leur effet sur la marge et sur la caisse.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare les équipes qui ont acheté le moins cher et celles qui ont acheté le mieux. La question qui reste ouverte : laquelle a fait le bon choix, et sur quel horizon.",
        },
      ],
      livrable:
        "La note d'approvisionnement, une page : la grille comparative des trois circuits, le circuit retenu, ce que l'équipe en attend chiffré, et le risque qu'elle accepte de prendre.",
      tracePasseport:
        "J'ai comparé des offres fournisseurs sur le prix, le délai de règlement et l'image, et j'ai argumenté un choix d'approvisionnement.",
      evaluation: [
        "Les trois circuits sont comparés sur au moins trois critères, dont un non financier.",
        "L'effet du délai de règlement sur la trésorerie est nommé, pas seulement mentionné.",
        "La prévision chiffrée est écrite avant la clôture, et donc vérifiable.",
      ],
    },
    {
      numero: 3,
      titre: "Animer l'offre sans détruire la marge",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
        "Bloc 1 · Développer la relation client et assurer la vente conseil",
      ],
      objectif:
        "Mesurer ce qu'une opération commerciale rapporte et ce qu'elle coûte, en volume comme en marge, plutôt que de la juger à l'affluence.",
      competences: [
        "Je calcule l'effet d'une remise sur ma marge unitaire et sur le volume qu'il faut vendre pour la compenser.",
        "Je lis un taux de transformation et j'en tire ce qui se passe en rayon.",
        "Je distingue une opération qui recrute des clientes d'une opération qui déplace des ventes.",
      ],
      notions: [
        "remise et démarque",
        "élasticité au prix",
        "taux de transformation",
        "panier moyen",
        "fidélisation",
      ],
      preparation:
        "Rouvrez la fiche concept sur la marge sur coût variable, que les équipes auront à mobiliser. Préparez un tableau vierge où chaque équipe inscrira, avant la clôture, le volume supplémentaire qu'elle estime nécessaire pour compenser sa remise.",
      deroule: [
        {
          minutes: 20,
          titre: "Relecture des prévisions",
          detail:
            "Chaque équipe confronte ce qu'elle avait écrit au tour précédent à ce qui s'est produit. L'écart s'explique en une phrase, sans excuse.",
        },
        {
          minutes: 35,
          titre: "Combien coûte une remise",
          detail:
            "Sur sa propre marge unitaire, chaque équipe calcule le volume supplémentaire qu'exigerait une remise de dix points, puis de vingt. Les chiffres surprennent toujours : c'est le moment de la séance.",
        },
        {
          minutes: 30,
          titre: "Construire l'opération",
          detail:
            "L'équipe décide de son opération commerciale, de sa cible et de son budget de communication, et inscrit au tableau le volume qu'il lui faudra atteindre.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions. Les équipes qui ont choisi de ne rien brader doivent le justifier aussi précisément que les autres.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le panier moyen et le taux de transformation de chaque équipe s'affichent à côté de son chiffre d'affaires.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "On confronte les volumes annoncés au tableau et les volumes atteints. Une équipe qui a vendu beaucoup et gagné moins qu'au trimestre précédent fait la démonstration à votre place.",
        },
      ],
      livrable:
        "La fiche d'opération commerciale : la cible, le mécanisme, l'effet attendu sur la marge unitaire, le volume à atteindre pour la compenser, et le résultat constaté après clôture.",
      tracePasseport:
        "J'ai construit une opération commerciale, j'en ai chiffré l'effet sur la marge avant de la lancer, et j'ai mesuré son résultat.",
      evaluation: [
        "Le volume de compensation est calculé sur la marge unitaire, pas sur le chiffre d'affaires.",
        "La cible de l'opération est une clientèle du magasin, nommée.",
        "L'écart entre le volume attendu et le volume atteint est expliqué.",
      ],
    },
    {
      numero: 4,
      titre: "Réussir la fin d'année",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Approvisionner un trimestre de forte saison : trop peu et le rayon est vide, trop et le stock reste sur les bras après les fêtes.",
      competences: [
        "J'anticipe un volume de ventes à partir de la saisonnalité et de mes trimestres précédents.",
        "J'évalue ce que coûte une rupture de stock et ce que coûte un surstock.",
        "Je dimensionne un approvisionnement en acceptant explicitement un risque.",
      ],
      notions: [
        "saisonnalité",
        "rotation des stocks",
        "rupture de stock",
        "surstock et démarque de fin de saison",
        "besoin en fonds de roulement",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer la totalité du temps annoncé. Préparez la fiche de prévision saisonnière, où l'équipe écrira son volume attendu AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit la saison",
          detail:
            "Vous rappelez sans donner de chiffre que le trimestre qui s'ouvre n'est pas un trimestre ordinaire. Les équipes retrouvent seules l'ampleur du pic dans les informations du jeu.",
        },
        {
          minutes: 40,
          titre: "Prévision de ventes",
          detail:
            "Chaque équipe construit sa prévision à partir de ses trois trimestres joués et du coefficient de saison, et l'inscrit sur sa fiche. Rien n'est saisi à ce stade.",
        },
        {
          minutes: 30,
          titre: "Les deux risques",
          detail:
            "L'équipe chiffre les deux erreurs possibles : ce que lui coûte une cliente repartie les mains vides, ce que lui coûte un article encore en rayon en janvier. Puis elle choisit lequel des deux risques elle préfère prendre.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie de l'approvisionnement, du prix et du budget de communication. La prévision écrite reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre des fêtes. Les écarts entre équipes sont ici les plus larges de tout l'atelier.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare sa prévision et ses ventes, puis dit ce qui lui reste en stock. La question finale : celle qui a le plus vendu est-elle celle qui a le mieux gagné.",
        },
      ],
      livrable:
        "La fiche de prévision saisonnière : le volume attendu et son raisonnement, le coût estimé d'une rupture, le coût estimé d'un surstock, le risque choisi, et l'écart constaté après clôture.",
      tracePasseport:
        "J'ai prévu les ventes d'une forte saison, j'ai dimensionné un approvisionnement en connaissant les deux risques, et j'ai analysé mon écart.",
      evaluation: [
        "La prévision est construite sur les trimestres joués, pas sur une intuition.",
        "Les deux risques sont chiffrés, pas seulement décrits.",
        "L'écart final est analysé sans être attribué à la chance.",
      ],
    },
    {
      numero: 5,
      titre: "Rendre compte de sa gestion",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 4 · Manager l'équipe commerciale",
      ],
      objectif:
        "Construire le tableau de bord commercial des quatre trimestres et le présenter oralement, comme on rend compte à une direction de réseau.",
      competences: [
        "Je construis un tableau de bord commercial qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.",
        "Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.",
      ],
      notions: [
        "tableau de bord commercial",
        "indicateurs de performance",
        "panier moyen et taux de transformation",
        "évolution du chiffre d'affaires",
        "compte rendu de gestion",
      ],
      preparation:
        "Annoncez la soutenance à la séance précédente et donnez la grille d'évaluation aux équipes. Prévoyez un ordre de passage tiré au sort en début de séance, et un temps de parole tenu au chronomètre.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille, tirage de l'ordre de passage. Chaque équipe dispose de huit minutes de présentation et de quatre minutes de questions.",
        },
        {
          minutes: 50,
          titre: "Construction du tableau de bord",
          detail:
            "Les équipes reprennent les quatre trimestres depuis leur espace et construisent leur tableau de bord. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié.",
        },
        {
          minutes: 20,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole, préparation des réponses aux questions probables. Vous passez dans les équipes pour repérer les tableaux illisibles avant qu'ils ne soient projetés.",
        },
        {
          minutes: 75,
          titre: "Soutenances",
          detail:
            "Passage des équipes. Le jury, ce sont vous et deux élèves d'une autre équipe, qui posent au moins une question chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le tableau de bord et la soutenance. Chaque élève écrit les trois phrases de son passeport professionnel.",
        },
      ],
      livrable:
        "Le tableau de bord commercial des quatre trimestres, une page, quatre indicateurs justifiés, plus la présentation orale de huit minutes qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord commercial d'un point de vente sur quatre trimestres et je l'ai présenté oralement devant un jury.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Chaque indicateur retenu est justifié par ce qu'il explique du résultat.",
        "L'oral assume au moins une erreur de gestion et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Cinq séances hebdomadaires",
      quand: "Le format d'origine, sur cinq semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine qui sépare deux séances laisse aux équipes le temps de préparer leur livrable, et à vous celui de le lire.",
    },
    {
      nom: "Semaine bloquée",
      quand: "En semaine d'atelier de professionnalisation ou de projet.",
      comment:
        "Une séance par jour du lundi au vendredi. Le rythme est plus tendu et le débriefing plus court, mais la mémoire des trimestres est meilleure, et la soutenance du vendredi gagne en tenue.",
    },
    {
      nom: "Fil rouge du semestre",
      quand: "Quand l'atelier accompagne le cours de gestion opérationnelle.",
      comment:
        "Une séance toutes les trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions à la maison.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord commercial de la dernière séance, pour un quart.",
    "La soutenance orale et les réponses aux questions du jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur tableau de bord.",
  ],
  prolongements: [
    "Rejouer les mêmes quatre trimestres avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Basculer sur le secteur du commerce en ligne pour opposer, sur le même déroulé, un magasin qui attend sa clientèle et un site qui achète son trafic.",
    "Prolonger jusqu'au sixième trimestre avec les deux dernières séances consacrées au financement du développement du magasin.",
  ],
  faq: [
    {
      question: "Faut-il avoir traité le coefficient multiplicateur avant la première séance ?",
      reponse:
        "Non, et c'est même préférable de ne pas l'avoir fait. La première séance amène les équipes à en avoir besoin avant de le nommer : elles calculent une marge parce qu'elles doivent fixer un prix, pas parce que le cours l'a demandé. Vous formalisez ensuite, sur leurs propres chiffres.",
    },
    {
      question: "Pourquoi arrêter à quatre trimestres alors que la partie en compte six ?",
      reponse:
        "Parce que le trimestre des fêtes est le point culminant de ce secteur et que rien ne gagne à le dépasser dans un atelier de cinq séances. La partie reste ouverte : si votre progression le permet, les deux trimestres suivants se jouent en prolongement, avec le financement du développement comme fil.",
    },
    {
      question: "Le niveau de jeu retenu n'ouvre ni le recrutement ni l'investissement, est-ce voulu ?",
      reponse:
        "Oui. La gestion opérationnelle d'un point de vente en première année se joue sur l'offre, le prix et le stock. Ouvrir la structure ajouterait des décisions que les équipes prendraient au hasard, et qui brouilleraient la lecture de leurs marges. Vous pouvez monter d'un niveau en deuxième année.",
    },
    {
      question: "Peut-on conduire cet atelier avec des équipes de deux ?",
      reponse:
        "Oui, en fusionnant les rôles de l'offre et des prix. En dessous de trois élèves, le débat contradictoire de la deuxième séance perd de sa force, alors prévoyez d'y faire travailler deux équipes ensemble sur cette séance-là uniquement.",
    },
    {
      question: "Comment noter une équipe qui a fait faillite ?",
      reponse:
        "Exactement comme les autres, sur ses livrables. Une équipe qui a mal géré et qui l'analyse lucidement rend un meilleur tableau de bord qu'une équipe qui a gagné sans savoir pourquoi, et c'est cette lucidité que le référentiel demande.",
    },
  ],
};
