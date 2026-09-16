import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS NDRC, deuxième année.
 *
 * Six séances de trois heures sur VOLT FITNESS, la salle de sport par
 * abonnement. Le secteur a été retenu parce qu'il porte ce que le pure player
 * de première année ne portait pas : un portefeuille d'adhérents qui paient à
 * chaque trimestre, et qu'on ne gagne donc pas une fois mais qu'on garde ou
 * qu'on perd. Chaque départ retire un abonnement à ce trimestre et à tous les
 * suivants, et la valeur d'un client se calcule enfin sur sa durée.
 *
 * Une limite est assumée et dite dans la FAQ : la simulation ne joue pas
 * l'entretien de vente ni la relance d'un adhérent qui décroche. Elle joue ce
 * qui se décide autour, ce que coûte un adhérent à recruter, ce qu'il rapporte
 * à rester, et ce qui le fait partir.
 */
export const ATELIER_FITNESS: AtelierDefinition = {
  code: "fitness",
  titre: "Garder ses adhérents plutôt que les remplacer",
  diplome: "BTS Négociation et digitalisation de la relation client",
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "dossier de fiches descriptives d'activités",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même salle de sport sur cinq trimestres, mesure son attrition, calcule ce que vaut un adhérent qui reste, traverse l'été où la moitié des nouveaux ne viennent plus, encaisse des abonnements d'avance, refuse de sur-vendre une salle pleine, et rend à chaque séance un document de pilotage de la relation client.",
  resume:
    "Cinq trimestres dans une salle de sport par abonnement, de l'attrition à la valeur vie d'un adhérent, avec la saturation de janvier comme épreuve.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "6 séances de 3 h",
  pourquoi:
    "La fidélisation s'enseigne en une phrase, garder coûte moins cher que recruter, et personne ne la mesure, parce qu'un exercice donne le taux d'attrition. Ici l'équipe part avec mille six cents adhérents, voit au trimestre suivant combien sont partis, et comprend que ce chiffre décide de son résultat plus que ses ventes du trimestre. La valeur vie d'un adhérent cesse d'être une formule : à quinze pour cent d'attrition il vaut six cents euros de marge, à dix pour cent il en vaut neuf cents, et l'équipe qui a rempli sa salle au-delà de ce que ses coachs encadrent voit son attrition monter et sa valeur fondre. Le métier arrive alors de lui-même : que faire d'un abonnement annuel encaissé d'avance, et faut-il vendre à celui qui ne restera pas.",
  reglages: {
    scenarioCode: "fitness",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 5,
    effectifParEquipe: "trois élèves",
    notes:
      "VOLT FITNESS part avec 1 600 adhérents qui paient 105 € par trimestre, une capacité de 2 200 places et huit coachs qui en encadrent à peine plus, un emprunt de 420 000 € et une attrition de base de 15 % par trimestre, qui monte l'été, avec le prix, quand la qualité baisse ou quand la salle dépasse 85 % de remplissage. Le marketing ramène des adhérents nouveaux, il n'en retient aucun. Le niveau retenu ouvre la qualité, la maintenance, la trésorerie et l'assurance, et ferme le recrutement des coachs et l'investissement : en deuxième année, la relation client se pilote par ce qu'on offre et ce qu'on facture, pas par la structure. Le monde variable est décoché pour que toutes vos classes travaillent le même exercice ; les aléas restent tirés et se lisent dans le journal du tour.",
  },
  seances: [
    {
      numero: 1,
      titre: "Mille six cents adhérents et un crédit",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Bloc 1 · Relation client et négociation-vente",
        "Bloc 2 · Relation client à distance et digitalisation",
      ],
      objectif:
        "Comprendre qu'un chiffre d'affaires par abonnement se reconduit de lui-même tant que personne ne part, en tirer la marge récurrente par adhérent, le nombre d'adhérents qui couvre les charges, et fixer les premiers prix et places à vendre pour le trimestre de janvier.",
      competences: [
        "Je distingue un chiffre d'affaires qu'il faut refaire chaque trimestre d'un chiffre d'affaires qui se reconduit tant que le client reste.",
        "Je calcule la marge récurrente d'un adhérent et le nombre d'adhérents au seuil de rentabilité.",
        "Je fixe un prix et un volume de places à vendre en tenant compte de la capacité d'accueil réelle.",
      ],
      notions: [
        "revenu récurrent d'abonnement",
        "marge par adhérent",
        "seuil de rentabilité en adhérents",
        "charges fixes d'un établissement sportif",
        "capacité d'accueil et d'encadrement",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois : une responsable de l'offre et des prix, une de l'expérience adhérent, une du suivi financier. Imprimez la fiche d'ouverture vierge, une par équipe. Les chiffres que les équipes doivent retrouver seules : 105 € d'abonnement par trimestre et 15 € de coût variable par adhérent, soit 90 € de marge qui revient à chaque trimestre tant qu'il reste ; 105 000 € de charges fixes par trimestre, 56 000 € de salaires des huit coachs et de l'accueil et 49 000 € de loyer, d'énergie et d'assurances, plus 16 000 € d'amortissements ; un seuil autour de 1 170 adhérents, soit un peu plus de la moitié des 2 200 places. Le premier trimestre est celui des bonnes résolutions : la demande nouvelle est la plus forte de l'année, et ces inscrits sont les plus volatils. Prévoyez que cette première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : six séances, cinq trimestres, une seule salle, et un document de pilotage rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 35,
          titre: "Ce que rapporte un adhérent qui reste",
          detail:
            "Chaque équipe relève ce qu'un adhérent paie, ce qu'il coûte, et ce que coûte un trimestre de salle que le plateau soit plein ou vide. Elle constate que le chiffre d'affaires du trimestre retombe tel quel au suivant si personne ne part, et que la question du métier devient combien partent, pas combien j'en vends.",
        },
        {
          minutes: 35,
          titre: "Du portefeuille au seuil",
          detail:
            "L'équipe calcule la marge récurrente par adhérent, le nombre d'adhérents au seuil, et la marge de sécurité que lui laissent ses mille six cents adhérents. Vous circulez sans corriger : une équipe qui compte l'emprunt dans les charges fixes le découvrira dans sa trésorerie, pas dans son résultat.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose au premier trimestre l'arbitrage du secteur : recruter, ou garder. L'équipe tranche, motive son choix en trois lignes, puis saisit son abonnement et les places qu'elle met en vente en janvier, sans dépasser ce que ses coachs encadrent.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, son portefeuille d'adhérents de fin de trimestre et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur fiche d'ouverture et la confrontent à leur résultat réel. Vous affichez côte à côte le portefeuille de fin de trimestre de chacune : la différence entre les nouveaux inscrits et les partis est le chiffre que la séance suivante va disséquer.",
        },
      ],
      livrable:
        "La fiche d'ouverture, une page : la marge récurrente par adhérent, les charges fixes séparées de l'emprunt, le nombre d'adhérents au seuil et la marge de sécurité, le prix et les places mises en vente avec leur justification, et le positionnement retenu entre recruter et garder.",
      tracePasseport:
        "J'ai tiré d'un portefeuille d'abonnés la marge récurrente d'un client et le nombre de clients au seuil de rentabilité d'un établissement.",
      evaluation: [
        "Le chiffre d'affaires est lu comme récurrent, et la marge par adhérent comme reconduite tant qu'il reste.",
        "Le seuil est exprimé en adhérents, et l'emprunt n'est pas confondu avec une charge.",
        "Les places mises en vente tiennent compte de la capacité d'encadrement, pas seulement de la surface.",
      ],
    },
    {
      numero: 2,
      titre: "Ceux qui ne reviennent pas",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Bloc 1 · Relation client et négociation-vente",
        "Bloc 2 · Relation client à distance et digitalisation",
      ],
      objectif:
        "Mesurer l'attrition du premier trimestre, calculer ce que vaut un adhérent sur toute sa durée, et décider des leviers qui le retiennent, qualité de l'encadrement, entretien du parc, prix, en sachant que la publicité n'en retient aucun.",
      competences: [
        "Je mesure un taux d'attrition et je le décompose par clientèle, les inscrits de janvier ne restant pas comme les pratiquants réguliers.",
        "Je calcule la valeur vie d'un client comme la somme des marges qu'il rapportera avant de partir.",
        "Je choisis un levier de rétention en comparant ce qu'il coûte maintenant à ce qu'il rapporte sur la durée.",
      ],
      notions: [
        "taux d'attrition",
        "valeur vie client",
        "segmentation des adhérents",
        "qualité perçue et rétention",
        "coût d'acquisition d'un client",
      ],
      preparation:
        "Relisez la situation du deuxième trimestre : sur quatre cents inscrits de janvier, soixante-deux renouvellent, quand neuf réguliers sur dix restent. La valeur vie se calcule en divisant la marge par le taux d'attrition : 90 € divisés par 15 % font 600 €, et 900 € si l'attrition tombe à 10 %. Ce qui retient dans le jeu : une qualité perçue au-dessus de sa référence, un prix sous les 105 € de référence, et une salle en dessous de 85 % de remplissage. Le budget marketing ramène des inscrits nouveaux et n'en retient aucun : c'est la confusion que la séance doit lever. Préparez un tableau où chaque équipe inscrira son taux d'attrition, sa valeur vie et le levier qu'elle engage.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur janvier",
          detail:
            "Chaque équipe lit son portefeuille de fin de trimestre, compte les partis, et dit en une phrase si elle a gagné des adhérents ou seulement remplacé ceux qui s'en allaient.",
        },
        {
          minutes: 40,
          titre: "Ce que vaut un adhérent",
          detail:
            "Les équipes calculent la valeur vie de leur adhérent moyen, puis celle d'un inscrit de janvier et celle d'un régulier : ce ne sont pas les mêmes clients, et le coût pour faire venir le premier dépasse parfois ce qu'il rapportera. Réduire l'attrition de cinq points augmente cette valeur de moitié sans dépenser un euro de publicité.",
        },
        {
          minutes: 30,
          titre: "Retenir plutôt que remplacer",
          detail:
            "Chaque équipe choisit son levier de rétention et le chiffre : ce que coûte un budget qualité ou de maintenance ce trimestre, contre la valeur qu'il ajoute à tout le portefeuille sur la durée. Une équipe qui répond par de la publicité écrit pourquoi, et découvrira à la clôture que cela n'a rien retenu.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son prix, ses places à vendre, ses budgets de qualité, de maintenance et de marketing, et écrit le taux d'attrition qu'elle attend. Cette prévision sera relue au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le taux d'attrition réalisé apparaît à côté du taux prévu, et la valeur vie de chaque équipe se recalcule.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a investi dans la rétention et une équipe qui a acheté des inscrits. La question qui reste ouverte : à partir de quel taux d'attrition un adhérent recruté coûte-t-il plus qu'il ne rapporte.",
        },
      ],
      livrable:
        "La note de rétention : le taux d'attrition du trimestre décomposé par clientèle, la valeur vie d'un adhérent moyen et celle de chaque clientèle, le levier de rétention retenu avec son coût et la valeur qu'il ajoute, et l'écart entre l'attrition prévue et l'attrition réalisée.",
      tracePasseport:
        "J'ai calculé la valeur vie d'un client à partir de sa marge et de son taux d'attrition, avant de choisir un levier de rétention.",
      evaluation: [
        "L'attrition est décomposée par clientèle, pas lue en un seul chiffre.",
        "La valeur vie découle de la marge et de l'attrition mesurées, pas d'une estimation.",
        "Le levier retenu est comparé sur son coût immédiat et sur la valeur qu'il ajoute à la durée.",
      ],
    },
    {
      numero: 3,
      titre: "Le creux de l'été",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Traverser le trimestre où la demande nouvelle tombe de moitié et où l'attrition monte d'un tiers, avec des charges de structure qui ne suivent pas la saison et une énergie qui flambe : mesurer la marge de sécurité, et tenir la relation avec les adhérents qui restent.",
      competences: [
        "J'anticipe un creux saisonnier à partir de la saisonnalité de chaque clientèle et de mes trimestres précédents.",
        "Je mesure ce qu'une charge fixe fait à un trimestre creux, et la marge de sécurité qui me sépare du seuil.",
        "Je choisis les actions de relation client d'un trimestre creux, en distinguant ce qui retient de ce qui recrute.",
      ],
      notions: [
        "saisonnalité de la demande et de l'attrition",
        "charges fixes et charges variables",
        "marge de sécurité",
        "animation de la relation à distance",
        "hausse de coût subie",
      ],
      preparation:
        "Relisez la situation du troisième trimestre : la demande nouvelle est à la moitié de son niveau, l'attrition est multipliée par une fois et demie, et le scénario fait bondir l'énergie de 28 % pour deux trimestres : annoncez-le en ouverture, sinon l'écart sera imputé à la prévision et non au choc. Les charges fixes ne bougent pas, seul le coût variable de 15 € par adhérent disparaît avec ceux qui partent. Avec mille six cents adhérents et un seuil autour de 1 170, la marge de sécurité est de quatre cent trente adhérents : un été qui en fait partir cinq cents fait basculer le trimestre. Le creux se prépare au trimestre précédent, pas pendant ; vous en ferez la remarque aux équipes qui ne l'ont pas fait. Préparez un tableau où chaque équipe inscrira son portefeuille de fin d'été prévu.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe confronte l'attrition prévue à l'attrition réalisée, et dit ce que son levier de rétention a fait, ou pas encore fait.",
        },
        {
          minutes: 40,
          titre: "Des charges qui ne suivent pas la saison",
          detail:
            "Les équipes projettent l'été : la demande nouvelle divisée par deux, l'attrition relevée, les charges fixes identiques, l'énergie en hausse. Elles calculent leur marge de sécurité en adhérents et le nombre de départs qui fait basculer le trimestre. C'est la définition même d'une charge fixe, et elle se comprend ici mieux qu'au tableau.",
        },
        {
          minutes: 30,
          titre: "Tenir la relation dans le creux",
          detail:
            "Chaque équipe choisit ses actions : un budget qualité pour retenir, un budget marketing pour recruter dans un marché à moitié vide, un prix d'été. Elle écrit ce que chaque action coûte et ce qu'elle attend d'elle, en distinguant ce qui retient de ce qui recrute.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son prix, ses places, ses budgets et sa couverture de trésorerie, et inscrit le portefeuille de fin d'été qu'elle attend.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre d'été. Le portefeuille réalisé apparaît à côté du portefeuille prévu, et le résultat de certaines équipes passe sous zéro pour la première fois.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui avait préparé l'été au trimestre précédent et une équipe qui l'a subi. La question qui reste ouverte : un trimestre en perte est-il une erreur de ce trimestre, ou du précédent.",
        },
      ],
      livrable:
        "La note d'été : la saisonnalité de la demande et de l'attrition appliquée au portefeuille, la marge de sécurité en adhérents, les actions retenues avec leur coût et leur effet attendu séparées entre retenir et recruter, le portefeuille de fin d'été prévu, et l'écart au portefeuille réalisé.",
      tracePasseport:
        "J'ai mesuré la marge de sécurité d'un établissement à charges fixes devant un creux saisonnier, avant de choisir les actions qui retiennent ses clients.",
      evaluation: [
        "La marge de sécurité est exprimée en adhérents et confrontée aux départs attendus de l'été.",
        "L'effet de la charge fixe sur un trimestre creux est nommé, pas seulement mentionné.",
        "Les actions sont classées entre ce qui retient et ce qui recrute, avec leur coût.",
      ],
    },
    {
      numero: 4,
      titre: "Douze mois encaissés d'avance",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Bloc 1 · Relation client et négociation-vente",
        "Bloc 3 · Relation client et animation de réseaux",
      ],
      objectif:
        "Étudier une formule annuelle payée d'un coup, moins chère que quatre trimestres mais encaissée avant d'être due, et en tirer ce qu'un encaissement d'avance fait à la trésorerie, au besoin en fonds de roulement et à la fidélité de l'adhérent engagé.",
      competences: [
        "Je compare une offre annuelle encaissée d'avance à une offre trimestrielle sur le prix, la trésorerie et la fidélité.",
        "Je construis un plan de trésorerie de trimestre et j'y repère ce qu'un encaissement d'avance déplace.",
        "Je distingue un produit encaissé d'un produit acquis, et je relie le besoin en fonds de roulement négatif au financement du cycle.",
      ],
      notions: [
        "besoin en fonds de roulement négatif",
        "plan de trésorerie",
        "produit constaté d'avance",
        "engagement et fidélité",
        "contrats entreprises et délai de règlement",
      ],
      preparation:
        "Relisez la situation du quatrième trimestre : une formule annuelle à 340 € en une fois contre quatre trimestres à 105 €, soit 420 €, l'adhérent engagé pour l'année ne se perdant plus en cours de route. La formule se travaille sur l'énoncé, en chiffres ; dans le jeu, la décision qui en découle est le prix du trimestre, et les contrats entreprises, réglés à quarante-cinq jours, sont la seule clientèle qui se fait attendre. Le niveau ouvre la trésorerie : l'escompte des créances entreprises, le découvert autorisé de 40 000 € à 13 % l'an, un nouvel emprunt. Préparez un plan de trésorerie vierge où chaque équipe inscrira ce que l'encaissement d'avance déplace d'un trimestre à l'autre.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur l'été",
          detail:
            "Chaque équipe confronte son portefeuille prévu à son portefeuille réalisé, et dit ce qu'il lui reste en caisse après le creux.",
        },
        {
          minutes: 40,
          titre: "Encaisser avant de fournir",
          detail:
            "Les équipes chiffrent la formule annuelle : 80 € de moins par adhérent, mais 340 € encaissés le premier jour pour une prestation due sur douze mois. Elles distinguent ce qui est encaissé de ce qui est acquis, constatent que ce sont les clients qui financent le cycle, et nomment ce besoin en fonds de roulement devenu négatif.",
        },
        {
          minutes: 30,
          titre: "Ce que l'avance fait à la fidélité",
          detail:
            "Chaque équipe pèse ce que l'engagement fait à l'attrition d'un adhérent qui a déjà payé, contre ce que la remise fait à sa marge, puis construit son plan de trésorerie du trimestre en y plaçant les contrats entreprises réglés à quarante-cinq jours, et décide de ce qu'elle mobilise.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, des places, des budgets et de la couverture de trésorerie. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le solde de trésorerie réalisé apparaît à côté du solde prévu, et le coût de la couverture se lit dans le résultat.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare les plans de trésorerie. Une équipe bénéficiaire et à découvert, parce que ses contrats entreprises se règlent tard, fait la démonstration à votre place : le résultat et la caisse ne racontent pas la même histoire.",
        },
      ],
      livrable:
        "La note d'abonnement annuel : la comparaison de la formule annuelle et de la formule trimestrielle sur le prix, la trésorerie et la fidélité, le produit encaissé séparé du produit acquis, le plan de trésorerie du trimestre avec les contrats entreprises à leur délai, la couverture retenue avec son coût, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai distingué un produit encaissé d'avance d'un produit acquis et relié un besoin en fonds de roulement négatif au financement du cycle par les clients.",
      evaluation: [
        "Le produit encaissé d'avance est séparé du produit acquis, et le besoin en fonds de roulement négatif est expliqué.",
        "La formule annuelle est comparée sur trois plans, prix, trésorerie et fidélité, pas sur le seul prix.",
        "Le plan de trésorerie place les contrats entreprises à leur délai réel de règlement.",
      ],
    },
    {
      numero: 5,
      titre: "Trop de monde aux heures de pointe",
      dureeMinutes: 180,
      tourJoue: 5,
      processus: [
        "Bloc 3 · Relation client et animation de réseaux",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Affronter le second janvier avec une salle déjà pleine : mesurer ce qu'une salle saturée fait à l'attrition et à la valeur vie, refuser de vendre au-delà de ce que le plateau et les coachs encadrent, et choisir parmi les partenariats proposés ceux qui remplissent sans saturer.",
      competences: [
        "Je repère laquelle des deux capacités bloque, la surface ou l'encadrement, et je borne mes ventes à la plus petite.",
        "Je chiffre ce que la saturation coûte en attrition et en valeur vie, contre ce que rapportent les inscriptions supplémentaires.",
        "Je sélectionne un partenariat, comité d'entreprise, mutuelle, club, en le jugeant sur sa marge, son délai de règlement et la place qu'il prend.",
      ],
      notions: [
        "capacité d'accueil et capacité d'encadrement",
        "saturation et attrition",
        "valeur vie client",
        "partenariats et réseaux d'apporteurs",
        "délai de règlement des contrats",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer tout le temps annoncé. Relisez la situation du cinquième trimestre : trois cents adhérents de trop font passer l'attrition de 10 à 16 %, et la valeur vie de 900 à 563 €. La capacité réelle est la plus petite des deux, 2 200 places sur le plateau et environ 2 427 adhérents que huit coachs encadrent ; au-delà de 85 % de remplissage, l'attrition monte d'un cran. Le niveau ne permet ni d'embaucher ni d'agrandir : la seule décision est de ne pas sur-vendre. Les commandes exceptionnelles du jeu sont des partenariats, un comité d'entreprise à 82 € réglé à soixante jours, une mutuelle à 74 € à quarante-cinq jours, un club de handball à 128 € comptant sur des créneaux du matin, une campagne étudiante à 58 € : chacun remplit, et chacun prend de la place. Préparez la fiche de plan de janvier, où l'équipe écrira ses places mises en vente et son attrition attendue AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le trimestre",
          detail:
            "Vous rappelez sans chiffre que janvier revient, et que la salle n'est plus vide comme au premier. Les équipes retrouvent seules leur taux de remplissage et la capacité qui les borne.",
        },
        {
          minutes: 40,
          titre: "La surface ou les coachs",
          detail:
            "Chaque équipe calcule ses deux capacités et retient la plus petite, puis chiffre ce que trois cents adhérents de trop feraient à son attrition, à sa valeur vie et à son résultat sur les trimestres suivants. Vendre plus ce trimestre, c'est perdre sur tous les autres.",
        },
        {
          minutes: 30,
          titre: "Choisir ses partenaires",
          detail:
            "L'équipe juge les partenariats proposés sur trois critères, la marge, le délai de règlement et la place prise aux heures de pointe, et retient ceux qui remplissent sans saturer. Un club qui vient le matin ne prend pas la place d'un adhérent du soir : c'est le raisonnement attendu.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des places mises en vente, du prix, des budgets, de la commande exceptionnelle retenue ou refusée. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le dernier trimestre joué. Le taux d'attrition et la valeur vie de chaque équipe apparaissent à côté de ce qu'elle avait prévu, et les écarts entre équipes sont les plus larges de l'atelier.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. La question finale : celle qui a vendu le plus d'abonnements en janvier est-elle celle dont le portefeuille vaut le plus.",
        },
      ],
      livrable:
        "La fiche de plan de janvier : les deux capacités calculées et celle qui borne, le coût chiffré d'une saturation en attrition et en valeur vie, les places mises en vente avec leur justification, les partenariats retenus ou refusés sur leurs trois critères, et l'écart entre l'attrition prévue et l'attrition réalisée.",
      tracePasseport:
        "J'ai borné les ventes d'un établissement à sa capacité d'encadrement après avoir chiffré ce qu'une saturation coûtait en attrition et en valeur vie.",
      evaluation: [
        "La capacité qui borne est identifiée par le calcul, surface et encadrement, pas supposée.",
        "Le coût de la saturation est chiffré en attrition et en valeur vie, sur les trimestres suivants.",
        "Les partenariats sont jugés sur la marge, le délai de règlement et la place prise, pas sur le seul volume.",
      ],
    },
    {
      numero: 6,
      titre: "Rendre compte de sa relation client",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Bloc 2 · Relation client à distance et digitalisation",
        "Bloc 1 · Relation client et négociation-vente",
      ],
      objectif:
        "Construire le tableau de bord de la relation client des cinq trimestres, attrition, revenu par adhérent, valeur vie, et le présenter oralement, comme on rend compte à un directeur de réseau.",
      competences: [
        "Je construis un tableau de bord de la relation client qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent mon portefeuille, et j'écarte ceux qui l'habillent.",
        "Je présente oralement cinq trimestres de pilotage, leurs réussites et leurs erreurs, devant un jury.",
      ],
      notions: [
        "tableau de bord de la relation client",
        "taux d'attrition et valeur vie",
        "revenu par adhérent",
        "trésorerie de fin d'exercice",
        "compte rendu de gestion",
      ],
      preparation:
        "Annoncez la présentation à la séance précédente et donnez la grille d'évaluation aux équipes. Prévoyez un ordre de passage tiré au sort en début de séance, et un temps de parole tenu au chronomètre pour chaque groupe.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille, tirage de l'ordre de passage. Chaque équipe disposera d'un temps de présentation court suivi de questions du jury.",
        },
        {
          minutes: 50,
          titre: "Construction du tableau de bord",
          detail:
            "Les équipes reprennent les cinq trimestres depuis leur espace et construisent leur tableau de bord. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié, et le taux d'attrition trimestre par trimestre y figure obligatoirement.",
        },
        {
          minutes: 20,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole, préparation des réponses aux questions probables. Vous passez dans les équipes pour repérer les tableaux illisibles avant qu'ils ne soient projetés.",
        },
        {
          minutes: 75,
          titre: "Passage des équipes",
          detail:
            "Huit minutes de présentation et quatre minutes de questions par équipe. Chaque équipe présente son tableau de bord puis répond aux questions du jury, formé de vous et de deux élèves d'une autre équipe qui posent au moins une question chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le tableau de bord et l'oral. Chaque élève écrit les trois phrases de sa fiche descriptive d'activité.",
        },
      ],
      livrable:
        "Le tableau de bord de la relation client des cinq trimestres : une page, quatre indicateurs justifiés dont le taux d'attrition, le trimestre le mieux et le moins bien piloté avec leurs raisons, et la présentation orale de huit minutes qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord de la relation client d'une salle de sport sur cinq trimestres et je l'ai présenté oralement devant un jury.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Chaque indicateur retenu est justifié par ce qu'il explique du portefeuille.",
        "L'oral assume au moins une erreur de pilotage et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine qui sépare deux séances laisse aux équipes le temps de préparer leur livrable, et à vous celui de le lire.",
    },
    {
      nom: "Semaine bloquée",
      quand: "En semaine d'atelier de professionnalisation ou de projet.",
      comment:
        "Deux séances les deux premiers jours, une le troisième, la présentation le quatrième. Le rythme est plus tendu et le débriefing plus court, mais la mémoire des trimestres est meilleure.",
    },
    {
      nom: "Fil rouge du semestre",
      quand: "Quand l'atelier accompagne le cours de relation client et de fidélisation.",
      comment:
        "Une séance toutes les trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions à la maison.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord de la relation client de la dernière séance, pour un quart.",
    "La présentation orale et les réponses aux questions du jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur tableau de bord.",
  ],
  prolongements: [
    "Rejouer les mêmes cinq trimestres avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Créer la partie sur six tours dès le départ et garder le dernier pour une séance de prolongement sur la seconde salle : 220 000 € engagés sur une demande incertaine, décidés par un arbre de décision, comme la situation du sixième trimestre le propose.",
    "Basculer sur le pure player, joué en première année sur un déroulé voisin, pour opposer une clientèle qu'on achète à chaque trimestre et une clientèle qu'on garde ou qu'on perd.",
  ],
  faq: [
    {
      question: "Cet atelier fait-il jouer un entretien de vente ou une relance d'adhérent ?",
      reponse:
        "Non, et la fiche ne le promet pas. La simulation joue ce qui se décide autour de l'entretien : ce que coûte un adhérent à recruter, ce qu'il rapporte à rester, ce qui le fait partir. La relance de l'adhérent qui décroche se travaille en cours, par un jeu de rôle ; l'atelier lui donne ses chiffres, la valeur vie qu'on sauve en le retenant.",
    },
    {
      question: "Pourquoi cinq trimestres, alors que le secteur en compte six ?",
      reponse:
        "Parce que le second janvier, au cinquième trimestre, est l'épreuve du secteur : une salle pleine que la demande de janvier vient saturer. Le sixième trimestre pose la question d'une seconde salle, que le jeu n'ouvre pas et qui se décide sur l'énoncé, par un arbre de décision. Si votre progression le permet, créez la partie sur six tours et gardez le dernier pour une séance de prolongement.",
    },
    {
      question: "Le niveau retenu n'ouvre ni le recrutement des coachs ni l'investissement, est-ce voulu ?",
      reponse:
        "Oui. La relation client en deuxième année se pilote par ce qu'on offre et ce qu'on facture : qualité de l'encadrement, entretien du parc, prix, places mises en vente, et la trésorerie qui va avec. Ouvrir la structure ferait de la saturation de janvier une affaire d'embauche, alors que la leçon est de ne pas vendre au-delà de ce qu'on encadre. Le niveau se fixe à la création et ne change plus en cours de partie.",
    },
    {
      question: "Le marketing ne retient vraiment aucun adhérent ?",
      reponse:
        "Aucun, et c'est un choix du modèle. Le budget marketing agit sur la demande nouvelle, jamais sur l'attrition ; ce qui retient, c'est la qualité perçue, un prix sous la référence et une salle qui n'est pas saturée. Beaucoup d'équipes répondent à un trimestre de départs par de la publicité, et découvrent à la clôture qu'elles ont remplacé sans retenir. C'est la leçon la moins chère de l'atelier.",
    },
    {
      question: "Quel lien avec les épreuves du BTS ?",
      reponse:
        "L'épreuve E4, relation client et négociation-vente, s'appuie sur des fiches descriptives d'activités : les livrables de l'atelier en fournissent la matière chiffrée, l'attrition et la valeur vie en premier. L'épreuve E5, relation client à distance et digitalisation, retrouve le pilotage par indicateurs et le tableau de bord de la dernière séance. L'épreuve E6, animation de réseaux, s'entraîne sur la séance des partenariats, comités d'entreprise, mutuelle et club.",
    },
    {
      question: "Peut-on conduire cet atelier avec des équipes de deux ?",
      reponse:
        "Oui, en fusionnant les rôles de l'offre et de l'expérience adhérent. En dessous de trois élèves, le débat de la deuxième séance entre retenir et recruter perd de sa force, alors prévoyez d'y faire travailler deux équipes ensemble sur cette séance-là uniquement.",
    },
  ],
};
