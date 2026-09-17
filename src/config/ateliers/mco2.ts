import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS MCO, deuxième année, AU MOIS.
 *
 * Six séances de deux heures sur LA TABLE D'AUGUSTIN, le bistrot, avec UN MOIS
 * PAR TOUR. C'est le premier atelier du registre à quitter le trimestre, et
 * c'est le sujet même de la fiche : un responsable d'unité commerciale ne
 * pilote pas par trimestre, il pilote par mois. Le loyer tombe tous les mois,
 * la paie tombe tous les mois, les groupes règlent à trente jours, et une
 * décision de carte se lit sur le compte du mois suivant.
 *
 * CE QUE LE MOIS CHANGE, ET QU'IL FAUT DIRE. Les scénarios sont calibrés au
 * trimestre : la plateforme divise tous les flux par trois quand le tour vaut
 * un mois. Les charges de structure passent donc de 90 000 à 30 000 €, la
 * capacité de 9 000 à 3 000 couverts, et le seuil de 4 500 à 1 500 couverts —
 * le même établissement, la même journée type de soixante-dix couverts. Ce qui
 * ne change PAS, ce sont les délais en jours : les groupes restent à trente
 * jours, c'est-à-dire exactement un tour. Un banquet vendu en septembre
 * s'encaisse en octobre, et cela se voit à l'écran au lieu de se raconter.
 *
 * Les six tours se lisent alors comme six mois, de juin à novembre : le creux
 * d'août est au troisième, la rentrée des groupes au quatrième. La flambée des
 * denrées que le scénario déclenche au troisième tour tombe donc en plein
 * creux, et dure jusqu'à la rentrée.
 */
export const ATELIER_MCO2: AtelierDefinition = {
  code: "mco2",
  titre: "Piloter une unité de restauration au mois",
  diplome: "BTS Management commercial opérationnel",
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "fiches d'activités professionnelles",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Six séances de deux heures, un mois par séance. Chaque équipe dirige le même bistrot de juin à novembre, lit son compte de résultat mensuel, traverse le creux d'août avec des charges qui ne partent pas en vacances, encaisse en octobre ce que septembre a vendu, et rend à chaque séance un document de pilotage mensuel.",
  resume:
    "Six mois à la tête d'un bistrot, au rythme réel d'une unité commerciale : un tour par mois, des groupes réglés à trente jours, et un tableau de bord mensuel pour finir.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "6 séances de 2 h",
  pourquoi:
    "Le trimestre arrange l'enseignant et dessert l'élève. Un responsable d'unité commerciale rend ses chiffres tous les mois, découvre tous les mois que son loyer est dû, et négocie tous les mois avec une banque qui regarde son solde. Au trimestre, un délai de règlement de trente jours disparaît dans la moyenne du tour ; au mois, il est un tour entier, et la classe voit enfin de ses yeux ce que veut dire encaisser après avoir payé. Le creux d'août cesse d'être une ligne de cours sur les charges fixes : il est un mois où la salle est vide, où le personnel est payé, et où le solde bancaire descend. C'est cette expérience-là, et pas le vocabulaire, qui fait qu'un étudiant surveille sa trésorerie dans son unité de stage.",
  reglages: {
    scenarioCode: "bistrot",
    periodicite: "month",
    periodiciteLabel: "Un mois par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 5,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 6,
    effectifParEquipe: "trois élèves",
    notes:
      "Choisissez « Un mois par tour » à la création : c'est le réglage qui porte tout l'atelier, et la seule fiche du registre qui le demande. La plateforme redimensionne alors le scénario, calibré au trimestre, en divisant les flux par trois : 30 000 € de charges de structure par mois au lieu de 90 000, 2 000 € d'amortissements, une capacité de 3 000 couverts, un seuil autour de 1 500 couverts, soit la même journée type de soixante-dix couverts. Les délais en jours, eux, ne bougent pas : les groupes règlent à trente jours, c'est-à-dire un tour entier, les fournisseurs à vingt et un jours. Le niveau retenu ouvre la trésorerie et l'assurance sans ouvrir le recrutement ni l'équipement de la cuisine : en deuxième année, le pilotage d'une unité se joue sur la carte, le remplissage et la caisse. Réglez la TVA à 10 %, le taux de la restauration sur place, dans les paramètres économiques. Le monde variable est décoché pour que toutes vos classes affrontent le même semestre.",
  },
  seances: [
    {
      numero: 1,
      titre: "Juin, le compte du mois",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Lire un compte de résultat mensuel, en tirer le ratio matières, la marge par couvert et le nombre de couverts qui couvre les charges du mois, puis fixer un premier prix et un premier volume.",
      competences: [
        "Je calcule le ratio matières et la marge sur coût variable d'un couvert à partir des comptes de l'unité.",
        "Je détermine le nombre de couverts qui couvre les charges d'un mois, et je le ramène à une journée type.",
        "Je fixe un prix et un volume à préparer en sachant ce que coûte un couvert jeté.",
      ],
      notions: [
        "ratio matières",
        "marge sur coût variable",
        "seuil de rentabilité",
        "charges fixes et charges variables",
        "denrées périssables et invendus",
      ],
      preparation:
        "Créez la partie avec « Un mois par tour » et vérifiez-le avant d'inviter les équipes : le reste de l'atelier en dépend. Constituez les équipes de trois. Imprimez la fiche de pilotage mensuel vierge, une par équipe et par séance. Les chiffres que les équipes doivent retrouver seules : 10 € de denrées et 3 € d'autres charges variables par couvert, soit 13 € ; un ticket moyen autour de 33 € et donc 20 € de marge ; 30 000 € de charges de structure par mois et 2 000 € d'amortissements ; une capacité de 3 000 couverts par mois. Le seuil tombe autour de 1 500 couverts, soit la moitié de la capacité et soixante-dix couverts par jour d'ouverture. Prévoyez que cette première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre et le rythme",
          detail:
            "Vous annoncez la règle : six séances, six mois, de juin à novembre, un document de pilotage rendu à chaque fin de séance. Vous insistez sur le rythme : ici un tour est un mois, et tout ce qui se décide se relit trente jours plus tard.",
        },
        {
          minutes: 30,
          titre: "Lire le compte du mois",
          detail:
            "Chaque équipe relève ce que l'unité dépense pour produire un couvert, ce que coûte un mois d'ouverture que la salle soit pleine ou vide, et ce qu'elle doit à la banque chaque mois. Vous circulez sans corriger : une équipe qui oublie une charge le découvrira dans son résultat.",
        },
        {
          minutes: 25,
          titre: "Du ratio au seuil",
          detail:
            "L'équipe calcule son ratio matières, sa marge par couvert, puis le nombre de couverts qui couvre le mois, et le divise par ses jours d'ouverture. Le chiffre obtenu est celui qu'un responsable d'unité surveille tous les jours.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "L'arène pose au premier mois un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit son prix et ses couverts à préparer, en sachant que le surplus part à la poubelle le soir même.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le mois. Chaque équipe reçoit son compte de résultat, son ratio matières réalisé, ses denrées perdues et sa place au classement.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "Deux équipes affichent leur seuil et leur résultat. Vous faites remarquer qu'un mois ne pardonne pas comme un trimestre : il n'y a pas de bon mois pour rattraper le mauvais dans le même tour.",
        },
      ],
      livrable:
        "La fiche de pilotage mensuel : le ratio matières du mois, la marge par couvert, le seuil en couverts et son équivalent en couverts par jour, le prix et le volume retenus avec leur justification, et le résultat constaté après clôture.",
      tracePasseport:
        "J'ai déterminé le nombre de couverts qui couvre les charges d'un mois d'exploitation à partir du ratio matières que j'avais calculé.",
      evaluation: [
        "Le ratio matières est calculé sur les comptes du jeu, pas estimé.",
        "Le seuil est ramené à une journée type, pas laissé en total mensuel.",
        "Le volume à préparer est justifié par le coût du couvert jeté autant que par le client refusé.",
      ],
    },
    {
      numero: 2,
      titre: "Juillet, le fournisseur et la caisse",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 1 · Développer la relation client et assurer la vente conseil",
      ],
      objectif:
        "Choisir un fournisseur de denrées en tenant ensemble son prix, la qualité qu'il fait à la carte et son délai de règlement, puis mesurer ce qu'un paiement comptant fait à la caisse d'un mois.",
      competences: [
        "Je compare des fournisseurs sur le prix, la qualité, le délai de règlement et le risque de rupture.",
        "Je mesure l'effet d'un délai de règlement sur la trésorerie d'un mois, à résultat inchangé.",
        "Je relie la qualité des denrées à la fréquentation du service du soir.",
      ],
      notions: [
        "choix multicritère d'un fournisseur",
        "délai de règlement fournisseur",
        "besoin en fonds de roulement",
        "trésorerie et plan de trésorerie",
        "qualité perçue et réputation",
      ],
      preparation:
        "Relisez les trois fournisseurs avec leurs chiffres : le grossiste au prix de référence, réglé à vingt et un jours ; le cash & carry à 14 % de moins, payé comptant, qui abaisse la qualité perçue et tombe en rupture une fois sur dix ; les producteurs en circuit court à 20 % de plus, réglés à quinze jours. Au mois, ces délais pèsent lourd : vingt et un jours, c'est les deux tiers du tour, et le comptant vide la caisse dans le tour même. Préparez un plan de trésorerie mensuel vierge où chaque équipe inscrira le solde qu'elle attend AVANT la clôture.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur juin",
          detail:
            "Chaque équipe confronte son seuil et son résultat, en une phrase, et dit combien de couverts elle a jetés.",
        },
        {
          minutes: 30,
          titre: "Trois fournisseurs, quatre critères",
          detail:
            "Les équipes remplissent la matrice : prix, qualité, délai, fiabilité, pondérés par ce qui compte pour leur carte. Le cash & carry fait gagner 1,40 € par couvert, soit 2 800 € sur un mois à 2 000 couverts, et fait perdre des dîners qu'on ne voit pas tout de suite.",
        },
        {
          minutes: 25,
          titre: "Ce que le délai fait à la caisse",
          detail:
            "Chaque équipe projette son solde de fin de mois avec chacun des trois délais. Le résultat ne bouge pas, la caisse si : c'est le besoin en fonds de roulement, et au mois il se voit d'un tour à l'autre au lieu de se noyer dans un trimestre.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "L'équipe arrête son fournisseur, son prix, ses couverts et, si elle en a besoin, sa couverture de trésorerie, puis écrit le solde qu'elle attend.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le solde réalisé apparaît à côté du solde prévu, et le ratio matières de chaque équipe porte la marque de son fournisseur.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "On compare une équipe passée au comptant et une équipe restée à vingt et un jours, sur le résultat et sur la caisse. La fréquentation du soir n'a pas encore bougé : vous l'annoncez et vous donnez rendez-vous au mois suivant.",
        },
      ],
      livrable:
        "La note fournisseur : la matrice multicritère pondérée avec le fournisseur retenu, l'effet attendu sur le ratio matières, le solde de fin de mois projeté pour chacun des trois délais de règlement, la couverture retenue avec son coût, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai chiffré ce qu'un délai de règlement fournisseur fait à la trésorerie d'un mois, à résultat inchangé.",
      evaluation: [
        "La matrice pondère les critères selon la carte de l'unité, pas à parts égales par défaut.",
        "L'effet du délai sur la caisse est chiffré, et distingué de l'effet sur le résultat.",
        "Le solde attendu est écrit avant la clôture, donc opposable.",
      ],
    },
    {
      numero: 3,
      titre: "Août, la salle est vide et le loyer tombe",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Traverser le mois creux où le midi tombe à six dixièmes de son niveau et les groupes à la moitié, avec des charges de structure inchangées et une flambée des denrées qui commence ce mois-là.",
      competences: [
        "Je mesure ce qu'un mois creux fait au résultat d'une unité à charges fixes, et la marge de sécurité qui m'en sépare.",
        "Je répercute une hausse du prix des denrées en tenant compte de la sensibilité de chaque clientèle.",
        "Je choisis les actions commerciales d'un mois creux et je chiffre ce que j'en attends.",
      ],
      notions: [
        "saisonnalité de la demande",
        "charges fixes et point mort",
        "marge de sécurité",
        "élasticité de la demande au prix",
        "budget de communication",
      ],
      preparation:
        "C'est le mois qui apprend le plus, et le plus dur. Le scénario fait flamber les denrées de 24 % à partir de ce tour, et pour deux mois : annoncez-le en ouverture, sinon l'écart sera imputé à la prévision et non au choc. La saison fait le reste : le midi tombe à six dixièmes, les groupes à la moitié, quand les charges de structure restent à 30 000 € et la banque à son échéance. Préparez un tableau où chaque équipe inscrira son résultat attendu, et rappelez que la marge de sécurité se compte ici en couverts, pas en pourcentage.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le mois",
          detail:
            "Vous rappelez sans donner de chiffre que le mois qui s'ouvre n'est pas un mois ordinaire, et que les denrées viennent d'augmenter. Les équipes retrouvent seules l'ampleur du creux dans les informations du jeu.",
        },
        {
          minutes: 30,
          titre: "Des charges qui ne partent pas en vacances",
          detail:
            "Chaque équipe projette son mois : la demande par clientèle, le ratio matières après la hausse, les charges inchangées. Elle calcule le nombre de couverts qui lui manque pour atteindre son seuil, et donc la perte qu'elle accepte d'avance.",
        },
        {
          minutes: 25,
          titre: "Répercuter, ou remplir",
          detail:
            "L'équipe tranche entre monter ses prix au risque de vider un midi déjà creux, absorber la hausse sur la marge, ou aller chercher du monde avec un budget de communication. Chaque voie se chiffre avant d'être choisie.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "Saisie du prix, des couverts, de la communication et de la couverture de trésorerie. Le résultat attendu reste écrit sur la fiche.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le mois creux. Plusieurs équipes passent sous zéro pour la première fois, et c'est le moment de dire qu'un mois négatif n'est pas une faute de gestion en soi.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "On compare l'équipe qui a le moins perdu et celle qui a le plus vendu. La question qui reste ouverte : un mois creux se gagne-t-il en août ou se prépare-t-il en juillet.",
        },
      ],
      livrable:
        "La note du mois creux : la demande attendue par clientèle après saison, le ratio matières après la hausse des denrées, le nombre de couverts manquant pour atteindre le seuil, la voie retenue avec son chiffrage, et l'écart entre le résultat attendu et le résultat réalisé.",
      tracePasseport:
        "J'ai chiffré la perte d'un mois creux sur une unité à charges fixes avant de choisir les actions qui la limitent.",
      evaluation: [
        "L'effet de la saison est chiffré par clientèle, pas en moyenne.",
        "La hausse des denrées est mesurée sur la marge et sur le seuil du mois.",
        "La voie retenue est comparée aux deux autres avec des chiffres, pas avec des arguments.",
      ],
    },
    {
      numero: 4,
      titre: "Septembre, les groupes reviennent et paient dans trente jours",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: [
        "Bloc 1 · Développer la relation client et assurer la vente conseil",
        "Bloc 3 · Assurer la gestion opérationnelle",
      ],
      objectif:
        "Servir le mois où les banquets font près du double, avec une capacité qui ne s'étire pas, et voir qu'un mois record en ventes peut être un mois serré en caisse quand les groupes règlent à trente jours.",
      competences: [
        "J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.",
        "Je relie le chiffre d'affaires d'un mois à l'encaissement du mois suivant, selon le délai de chaque clientèle.",
        "Je décide d'une couverture du besoin de trésorerie et j'en assume le coût.",
      ],
      notions: [
        "capacité et saturation",
        "arbitrage entre clientèles",
        "délai de règlement client",
        "besoin en fonds de roulement",
        "découvert et coût du financement court terme",
      ],
      preparation:
        "Les groupes sont à près du double de leur niveau ce mois-ci, la hausse des denrées court encore, et la capacité reste de 3 000 couverts quand la brigade en couvre 3 033. Le point de la séance tient en une phrase à ne pas dire d'avance : un banquet vendu en septembre s'encaisse en octobre, parce que les groupes règlent à trente jours, soit exactement un tour. Préparez la fiche de plan de septembre, où l'équipe écrira le chiffre d'affaires attendu ET l'encaissement attendu, qui ne sont pas le même nombre. La commande exceptionnelle, quand elle tombe, tranche la question : un allotement comptant à bas prix, ou un contrat mieux payé mais réglé plus tard.",
      deroule: [
        {
          minutes: 15,
          titre: "Sortir du creux",
          detail:
            "Chaque équipe fait le point de sa caisse après août et dit avec quoi elle aborde la rentrée.",
        },
        {
          minutes: 30,
          titre: "Qui servir quand tout ne rentre pas",
          detail:
            "Les équipes confrontent la demande du mois à leur capacité, puis classent leurs clientèles par marge et par délai de règlement. Servir le mieux payé n'est pas toujours servir le plus vite payé, et c'est l'arbitrage de la séance.",
        },
        {
          minutes: 25,
          titre: "Vendre en septembre, encaisser en octobre",
          detail:
            "Chaque équipe écrit côte à côte son chiffre d'affaires attendu et son encaissement attendu, puis le solde qui en découle. Celles qui remplissent de banquets découvrent un mois record dont la caisse ne verra la couleur qu'au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "Saisie du prix, des couverts, de la commande exceptionnelle acceptée ou refusée, et de la couverture de trésorerie. Le plan écrit reste sur la table.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le chiffre d'affaires, le résultat et le solde de caisse apparaissent ensemble, et ils ne racontent pas la même histoire.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "Une équipe bénéficiaire et à découvert fait la démonstration à votre place. Vous notez au tableau ce qu'elle encaissera le mois prochain : c'est le sujet de la séance suivante.",
        },
      ],
      livrable:
        "Le plan de septembre : la demande par clientèle face à la capacité, le classement des clientèles par marge et par délai, le chiffre d'affaires attendu distingué de l'encaissement attendu, la couverture retenue avec son coût, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai distingué le chiffre d'affaires d'un mois de son encaissement en tenant compte du délai de règlement de chaque clientèle.",
      evaluation: [
        "Les clientèles sont classées par marge ET par délai, pas par le seul prix.",
        "Le chiffre d'affaires attendu et l'encaissement attendu sont deux nombres distincts et justifiés.",
        "La couverture retenue est chiffrée avec son coût, et non seulement citée.",
      ],
    },
    {
      numero: 5,
      titre: "Octobre, encaisser ce que septembre a vendu",
      dureeMinutes: 120,
      tourJoue: 5,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Vérifier que les créances de septembre rentrent bien, mesurer ce que la banque a coûté au passage, et décider si la couverture du besoin de trésorerie valait son prix.",
      competences: [
        "Je suis un encaissement attendu et je constate son arrivée dans la caisse du mois.",
        "Je chiffre le coût d'un financement court terme et je le rapporte à ce qu'il a évité.",
        "Je corrige une politique commerciale à partir de ce que les deux mois précédents ont montré.",
      ],
      notions: [
        "encaissement et décaissement",
        "trésorerie nette",
        "coût du découvert",
        "escompte et affacturage",
        "tableau de bord d'exploitation",
      ],
      preparation:
        "C'est la séance où la trésorerie se referme : les créances de septembre arrivent, la hausse des denrées est retombée, et les équipes peuvent enfin juger leurs décisions de couverture. Préparez un tableau à trois colonnes, ce qui a été vendu en septembre, ce qui rentre en octobre, ce que le financement a coûté. Rappelez les taux du jeu : le découvert autorisé est de 20 000 € à 14 % l'an, l'escompte coûte 7,5 % l'an, l'affacturage 3 % de la créance cédée.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que septembre a laissé",
          detail:
            "Chaque équipe relit son plan de septembre et dit ce qu'elle attend en caisse ce mois-ci, avant d'ouvrir ses résultats.",
        },
        {
          minutes: 30,
          titre: "Les créances rentrent, le coût reste",
          detail:
            "Les équipes remplissent le tableau à trois colonnes et calculent ce que leur couverture a coûté sur le mois. Certaines découvrent qu'elles ont payé un découvert pour un encaissement qui n'avait qu'un mois de retard.",
        },
        {
          minutes: 25,
          titre: "Corriger la carte et le remplissage",
          detail:
            "À la lumière de deux mois contrastés, l'équipe ajuste sa politique : quelle clientèle privilégier, à quel prix, avec quel budget de communication. Elle écrit ce qu'elle attend de chaque correction.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "Saisie complète, couverture comprise. Chaque équipe inscrit son solde attendu de fin de mois.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez l'avant-dernier mois. Le coût cumulé du financement depuis juin s'affiche dans le compte de résultat de chacune.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a couvert large et une équipe qui a serré. La question qui reste ouverte : combien vaut de dormir tranquille.",
        },
      ],
      livrable:
        "La note de trésorerie : ce qui a été vendu en septembre, ce qui est rentré en octobre, le coût du financement court terme sur le mois, la correction de politique commerciale décidée, et l'écart au solde attendu.",
      tracePasseport:
        "J'ai rapporté le coût d'un financement court terme à la rupture de trésorerie qu'il avait évitée.",
      evaluation: [
        "L'encaissement du mois est rapproché du chiffre d'affaires du mois précédent, ligne à ligne.",
        "Le coût du financement est chiffré sur le mois, pas évoqué en taux annuel.",
        "La correction commerciale s'appuie sur un fait des deux mois écoulés.",
      ],
    },
    {
      numero: 6,
      titre: "Novembre, le tableau de bord du semestre",
      dureeMinutes: 120,
      tourJoue: 6,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 4 · Manager l'équipe commerciale",
      ],
      objectif:
        "Jouer le dernier mois, puis construire le tableau de bord des six mois et le présenter comme on rend compte à la direction d'un réseau.",
      competences: [
        "Je construis un tableau de bord mensuel qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent mon résultat et j'écarte ceux qui l'habillent.",
        "Je présente oralement six mois d'exploitation, leurs réussites et leurs erreurs.",
      ],
      notions: [
        "tableau de bord d'exploitation",
        "ratio matières et ticket moyen",
        "taux de remplissage",
        "trésorerie nette",
        "compte rendu de gestion",
      ],
      preparation:
        "Annoncez la présentation à la séance précédente et donnez la grille d'évaluation. Prévoyez un ordre de passage tiré au sort et un chronomètre : trois minutes par équipe, pas une de plus. Demandez que le tableau de bord porte les six mois en colonnes, c'est ce qui fait apparaître le creux d'août et le décalage d'encaissement d'octobre sans qu'on ait à les expliquer.",
      deroule: [
        {
          minutes: 15,
          titre: "Le dernier mois",
          detail:
            "Chaque équipe décide son dernier mois avec le classement sous les yeux, et dit en une phrase si elle consolide ou si elle tente.",
        },
        {
          minutes: 20,
          titre: "Décisions et clôture",
          detail:
            "Saisie complète, puis clôture du dernier mois. Le classement final s'affiche, et le semestre est complet.",
        },
        {
          minutes: 30,
          titre: "Construction du tableau de bord",
          detail:
            "Les équipes reprennent les six mois depuis leur espace. Contrainte forte : une page, six colonnes, quatre indicateurs au maximum, chacun justifié, dont le ratio matières et la trésorerie.",
        },
        {
          minutes: 15,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole et préparation des réponses aux questions probables. Vous repérez les tableaux illisibles avant qu'ils ne soient projetés.",
        },
        {
          minutes: 25,
          titre: "Passage des équipes",
          detail:
            "Trois minutes de présentation par équipe, chronométrées. Le reste de la classe écoute et note une question par passage.",
        },
        {
          minutes: 15,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement puis vous l'écartez : ce qui se note est le tableau de bord et l'oral. Chaque élève rédige les phrases de ses fiches d'activités professionnelles.",
        },
      ],
      livrable:
        "Le tableau de bord du semestre : une page, les six mois en colonnes, quatre indicateurs justifiés dont le ratio matières et la trésorerie, le mois le mieux et le moins bien géré avec leurs raisons, et la présentation de trois minutes qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord mensuel d'une unité commerciale sur six mois et je l'ai présenté oralement.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Chaque indicateur retenu est justifié par ce qu'il explique du résultat.",
        "L'oral assume au moins une erreur de pilotage et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines consécutives.",
      comment:
        "Une séance par semaine, un mois par séance. La semaine qui sépare deux séances laisse aux équipes le temps de préparer leur document, et à vous celui de le lire.",
    },
    {
      nom: "Fil rouge du semestre",
      quand: "Quand l'atelier accompagne le cours de gestion opérationnelle.",
      comment:
        "Une séance toutes les deux ou trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. Le rythme mensuel du jeu se décale alors du calendrier réel, ce qui ne gêne pas : ce sont les mois du bistrot qui comptent, pas les vôtres.",
    },
    {
      nom: "Semaine bloquée",
      quand: "En semaine d'atelier de professionnalisation.",
      comment:
        "Trois séances par jour sur deux jours. La tension est forte et le débriefing court, mais le décalage entre la vente de septembre et l'encaissement d'octobre se vit alors dans la même journée, ce qui le grave mieux qu'un rappel.",
    },
  ],
  evaluationFinale: [
    "Les six livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord du semestre, pour un quart.",
    "La présentation orale et les réponses aux questions, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur tableau de bord.",
  ],
  prolongements: [
    "Rejouer les six mois avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Reprendre le même bistrot au trimestre en deuxième partie d'année, avec la carte en quatre offres : les étudiants mesurent alors ce que le rythme change à la lecture des mêmes comptes.",
    "Confronter le tableau de bord du jeu à celui de l'unité de stage de chaque étudiant : les indicateurs se ressemblent, les ordres de grandeur non, et la comparaison fait le cours.",
  ],
  faq: [
    {
      question: "Pourquoi jouer au mois plutôt qu'au trimestre ?",
      reponse:
        "Parce que c'est le rythme du métier, et parce que le trimestre efface ce que cet atelier veut montrer. Les groupes règlent à trente jours : au trimestre, ce délai se noie dans le tour et personne ne le voit ; au mois, il est un tour entier, et la classe constate qu'un mois record en ventes peut être un mois serré en caisse. C'est la seule fiche du registre qui demande « Un mois par tour », et ce réglage n'est pas un détail de création : il est le sujet.",
    },
    {
      question: "Les chiffres du scénario changent-ils quand on passe au mois ?",
      reponse:
        "Oui, et c'est voulu. La plateforme divise tous les flux par trois : 30 000 € de charges de structure au lieu de 90 000, 3 000 couverts de capacité, un seuil autour de 1 500 couverts. L'établissement est le même, sa journée type aussi, soixante-dix couverts. Ce qui ne change pas, ce sont les délais en jours et les taux annuels : c'est exactement ce qui fait le poids relatif d'un délai de trente jours sur un tour d'un mois.",
    },
    {
      question: "Quel écart avec l'atelier de première année ?",
      reponse:
        "La première année se joue au trimestre sur une boutique, avec le même niveau de décisions. Ce qui monte ici, ce n'est pas le nombre de leviers, c'est le rythme et le secteur : une unité de restauration qui jette ses invendus le soir même, un mois creux qui ne se rattrape pas dans le tour, et une trésorerie qui se pilote d'un mois sur l'autre. Un étudiant qui a fait les deux a vu le même métier à deux échelles de temps.",
    },
    {
      question: "Le niveau retenu n'ouvre ni le recrutement ni l'équipement de la cuisine, est-ce voulu ?",
      reponse:
        "Oui. Le pilotage d'une unité en deuxième année se joue sur la carte, le remplissage, les achats et la caisse. Ouvrir la structure ajouterait des décisions que les équipes prendraient au hasard et qui brouilleraient la lecture du mois. L'atelier de management en hôtellerie-restauration, lui, ouvre la brigade et la cuisine : c'est un autre métier et un autre diplôme.",
    },
    {
      question: "Quel taux de TVA faut-il régler ?",
      reponse:
        "Dix pour cent, le taux de la restauration sur place, à saisir dans les paramètres économiques de la partie. Le champ accepte n'importe quel taux, il ne présume pas des vingt pour cent du commerce de détail. Si votre progression n'a pas encore traité la TVA, mettez zéro : l'atelier tient sans elle, et vous la réintroduirez au trimestre suivant.",
    },
    {
      question: "Que faire des équipes qui finissent août dans le rouge ?",
      reponse:
        "Rien, et le dire. Un mois creux négatif n'est pas une faute de gestion : c'est la définition d'une charge fixe, et l'établissement réel le vit tous les ans. Ce qui se note, c'est ce que l'équipe avait prévu et ce qu'elle a fait pour limiter la perte, pas le signe du résultat. En revanche, une équipe qui découvre son creux le jour où il arrive a manqué la séance de juillet, et c'est cela qu'il faut lui dire.",
    },
  ],
};
