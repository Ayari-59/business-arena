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
 * CE QUE LE MOIS CHANGE, ET QU'IL FAUT DIRE. La création demande deux réglages
 * et non un : « Un mois par tour », puis « Mois de départ : juin ». Les
 * scénarios sont calibrés au trimestre : la plateforme divise tous les flux par
 * trois quand le tour vaut un mois. Les charges de structure passent donc de
 * 90 000 à 30 000 €, la capacité de 9 000 à 3 000 couverts, et le seuil de
 * 4 500 à 1 500 couverts : le même établissement, la même journée type de
 * soixante-dix couverts. Ce qui ne change PAS, ce sont les délais en jours :
 * les groupes restent à trente jours, c'est-à-dire exactement un tour. Un
 * banquet vendu en octobre s'encaisse en novembre, et cela se voit à l'écran
 * au lieu de se raconter.
 *
 * LE CALENDRIER (`config/scenarios/calendrier-mensuel.ts`). Une partie au mois
 * suit les mois : celle-ci commence en juin et joue six tours, de juin à
 * novembre. La saison d'un mois est celle de son trimestre, répartie par le
 * profil du bistrot : le midi d'affaires et les banquets reculent dès juillet
 * et se vident presque en août, tout remonte en septembre sans retrouver juin,
 * et les banquets culminent en octobre et en novembre. Ce que le scénario écrit
 * pour un trimestre tombe au premier mois de ce trimestre : la situation du
 * fournisseur en juin (le trimestre en cours au départ ouvre au premier mois,
 * essai compris), celle des denrées en juillet, celle des banquets en octobre.
 * La reprise appartient au premier trimestre, déjà passé en juin ; la terrasse
 * et la valeur du bistrot tombent après novembre : aucune ne s'ouvre. La
 * flambée des denrées, écrite au troisième trimestre pour deux trimestres,
 * commence donc en juillet et dure jusqu'à la fin de l'atelier. Les autres
 * mois n'ont pas de situation écrite : seules celles que les résultats
 * déclenchent (un mois sous zéro, une caisse qui dort) peuvent s'y ouvrir.
 */
export const ATELIER_MCO2: AtelierDefinition = {
  code: "mco2",
  titre: "Piloter une unité de restauration au mois",
  formations: ["bts-mco"],
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "fiches d'activités professionnelles",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Six séances de deux heures, un mois par séance. Chaque équipe dirige le même bistrot de juin à novembre, lit son compte de résultat mensuel, traverse le creux d'août avec des charges qui ne partent pas en vacances, encaisse en novembre ce qu'octobre a vendu, et rend à chaque séance un document de pilotage mensuel.",
  resume:
    "Six mois à la tête d'un bistrot, au rythme réel d'une unité commerciale. Un tour par mois, des groupes réglés à trente jours, un tableau de bord pour finir.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "7 séances de 2 h",
  pourquoi:
    "Le trimestre arrange l'enseignant et dessert l'élève. Un responsable d'unité commerciale rend ses chiffres tous les mois, découvre tous les mois que son loyer est dû, et négocie tous les mois avec une banque qui regarde son solde. Au trimestre, un délai de règlement de trente jours disparaît dans la moyenne du tour ; au mois, il est un tour entier, et la classe voit enfin de ses yeux ce que veut dire encaisser après avoir payé. Le creux d'août cesse d'être une ligne de cours sur les charges fixes : il est un mois où la salle est vide, où le personnel est payé, et où le solde bancaire descend. C'est cette expérience-là, et pas le vocabulaire, qui fait qu'un étudiant surveille sa trésorerie dans son unité de stage.",
  reglages: {
    scenarioCode: "bistrot",
    periodicite: "month",
    periodiciteLabel: "Un mois par tour",
    moisDeDepart: 6,
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 5,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 6,
    tourDEssai: 1,
    effectifParEquipe: "trois élèves",
    notes:
      "Choisissez « Un mois par tour » à la création, puis « Mois de départ : juin » et six tours joués : ce sont les réglages qui portent tout l'atelier, et la seule fiche du registre qui les demande. Sans le mois de départ, la partie commencerait en janvier et vivrait d'autres mois que ceux de la fiche ; sans le nombre de tours, elle durerait plus longtemps que vos séances. La partie suit alors le calendrier : chaque mois prend la saison de son trimestre, répartie selon le métier, et ce que le scénario écrit pour un trimestre tombe au premier mois de ce trimestre. La plateforme redimensionne aussi le scénario, calibré au trimestre, en divisant les flux par trois : 30 000 € de charges de structure par mois au lieu de 90 000, 2 000 € d'amortissements, une capacité de 3 000 couverts, un seuil autour de 1 500 couverts, soit la même journée type de soixante-dix couverts. Les délais en jours, eux, ne bougent pas : les groupes règlent à trente jours, c'est-à-dire un tour entier, les fournisseurs à vingt et un jours. Le niveau retenu ouvre le poste clients et la brigade, que l'atelier laisse à son effectif de départ, sans l'emprunt, l'équipement de la cuisine ni l'assurance : en deuxième année, le pilotage d'une unité se joue sur la carte, le remplissage et la caisse. Un manque de trésorerie, la banque le couvre seule, par le découvert. Réglez la TVA à 10 %, le taux de la restauration sur place, dans les paramètres économiques. Le monde variable est décoché pour que toutes vos classes affrontent le même semestre.",
  },
  seances: [
    {
      numero: 1,
      titre: "Entrer dans LA TABLE D'AUGUSTIN sur un mois d'essai",
      dureeMinutes: 120,
      tourJoue: null,
      essai: true,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Apprendre le jeu avant que rien ne compte : lire le mandat de LA TABLE D'AUGUSTIN, ses offres et sa capacité mensuelle, jouer un mois d'essai de bout en bout, lire ses premiers résultats, puis lancer la vraie partie.",
      competences: [
        "Je présente un restaurant en une page : ses offres, sa capacité d'accueil mensuelle et les charges qui tombent chaque mois.",
        "Je repère, sur l'écran de décision, ce qui se décide chaque mois et ce que le niveau de la partie laisse fixé.",
        "Je lis un premier compte de résultat mensuel et je distingue chiffre d'affaires, ratio matières et résultat.",
      ],
      notions: [
        "ratio matières et coût de revient d'un couvert",
        "charges de structure mensuelles d'un restaurant",
        "taux de remplissage mensuel et chiffre d'affaires",
        "compte de résultat et trésorerie d'une unité de restauration",
      ],
      preparation:
        "Créez la partie depuis votre espace avec ces réglages : scénario bistrot, un mois par tour, mois de départ juin, niveau Pilotage, six tours joués, cinq équipes, deux concurrents machine, TVA activée à 10 %, monde variable décoché, questions de connaissances activées, et dans « Tour d'essai » un tour, sans cocher l'enchaînement automatique : c'est vous qui commencerez la vraie partie depuis l'ardoise en fin de séance. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, rôles tournants d'une séance à l'autre. Imprimez la fiche d'identité du restaurant, vierge. Rappel : ici c'est un mois par tour, et non un trimestre, et le premier mois est juin.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : sept séances, un mois d'essai qui ne compte pas puis six mois, de juin à novembre, un seul restaurant, un document rendu à chaque fin de séance. Un mois par tour, ce qui change le rythme : les couverts du mois, les charges du mois, le résultat du mois. Les équipes rejoignent la partie avec le code et nomment leur établissement.",
        },
        {
          minutes: 25,
          titre: "L'entreprise, lue à l'écran",
          detail:
            "Chaque équipe lit le mandat de LA TABLE D'AUGUSTIN, ses offres de restauration, la capacité d'accueil mensuelle, les charges fixes du mois et le panneau du fournisseur. Elle remplit la première moitié de sa fiche d'identité : offres, capacité mensuelle, charges.",
        },
        {
          minutes: 25,
          titre: "Le mois d'essai",
          detail:
            "Le bandeau de l'arène dit que rien ne compte. L'essai se joue sur un mois de juin, et l'arène y pose déjà la question du fournisseur, qui reviendra pour de bon au premier vrai mois. Chaque équipe lit cette situation, choisit ses offres et leur tarif, saisit ses décisions pour ce mois. Vous ne corrigez rien : un tarif ou un mix mal calibré est exactement ce que l'essai est fait pour absorber.",
        },
        {
          minutes: 20,
          titre: "Clôture de l'essai et premiers résultats",
          detail:
            "Vous clôturez le mois d'essai depuis votre espace. Chaque équipe lit son chiffre d'affaires, son ratio matières et son résultat du mois, et reporte les trois chiffres sur sa fiche d'identité.",
        },
        {
          minutes: 20,
          titre: "Ce que l'essai apprend",
          detail:
            "Vous affichez deux équipes côte à côte : des prix, un taux de remplissage mensuel, un ratio matières, un résultat. Qui a rempli le plus, qui a gagné le plus, et pourquoi ce n'est pas la même équipe. Le mois ne donne pas de second recours : un mois creux ne rattrape pas le mois suivant.",
        },
        {
          minutes: 20,
          titre: "La vraie partie commence",
          detail:
            "Les équipes terminent leur fiche d'identité. Vous appuyez sur « Commencer la vraie partie » depuis l'ardoise, vous confirmez, et toutes les entreprises repartent de l'état initial. Les équipes voient le bandeau de départ et retrouvent la situation de juin, cette fois pour de vrai.",
        },
      ],
      livrable:
        "La fiche d'identité de LA TABLE D'AUGUSTIN, une page : les offres avec leur ratio matières cible, la capacité d'accueil mensuelle, les charges qui tombent chaque mois, et les trois chiffres du mois d'essai.",
      tracePasseport:
        "J'ai présenté un restaurant sur une page à partir de ses écrans de décision et de ses premiers résultats d'essai mensuel, pour ouvrir mes fiches d'activités professionnelles.",
      evaluation: [
        "Les offres du restaurant sont listées avec leur ratio matières cible.",
        "Les charges de structure mensuelles sont distinguées des coûts variables.",
        "Les trois chiffres de l'essai sont exacts, et le lien entre ratio matières et résultat mensuel est relevé.",
      ],
    },
    {
      numero: 2,
      titre: "Juin, le fournisseur et la caisse du mois",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 1 · Développer la relation client et assurer la vente conseil",
      ],
      objectif:
        "Lire le compte du mois et en tirer le ratio matières et la marge par couvert, puis choisir un fournisseur de denrées en tenant ensemble son prix, la qualité qu'il fait à la carte et son délai de règlement, et mesurer ce qu'un paiement comptant fait à la caisse du mois.",
      competences: [
        "Je calcule le ratio matières et la marge sur coût variable d'un couvert à partir des comptes de l'unité.",
        "Je compare des fournisseurs sur le prix, la qualité, le délai de règlement et le risque de rupture.",
        "Je mesure l'effet d'un délai de règlement sur la trésorerie d'un mois, à résultat inchangé.",
      ],
      notions: [
        "ratio matières",
        "marge sur coût variable",
        "choix multicritère d'un fournisseur",
        "délai de règlement fournisseur",
        "besoin en fonds de roulement",
      ],
      preparation:
        "Vérifiez sur l'arène que la partie est bien au mois et qu'elle commence en juin : le mois du tour s'affiche à côté de son numéro. Les chiffres que les équipes doivent retrouver seules : 10 € de denrées et 3 € d'autres charges variables par couvert, soit 13 € ; un ticket moyen autour de 33 € et donc 20 € de marge ; 30 000 € de charges de structure par mois et 2 000 € d'amortissements ; une capacité de 3 000 couverts par mois. Relisez ensuite les trois fournisseurs avec leurs chiffres : le grossiste au prix de référence, réglé à vingt et un jours ; le cash & carry à 14 % de moins, payé comptant, qui abaisse la qualité perçue et tombe en rupture une fois sur dix ; les producteurs en circuit court à 20 % de plus, réglés à quinze jours. Au mois, ces délais pèsent lourd : vingt et un jours, c'est les deux tiers du tour, et le comptant vide la caisse dans le tour même. La situation du fournisseur, que les équipes ont lue pendant l'essai, s'ouvre de nouveau ce mois-ci. Imprimez la fiche de pilotage mensuel vierge, une par équipe et par séance, et prévoyez une ligne où chaque équipe inscrira le solde qu'elle attend AVANT la clôture.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre et le rythme",
          detail:
            "Vous annoncez la règle : six séances, six mois, de juin à novembre, un document de pilotage rendu à chaque fin de séance. Vous insistez sur le rythme : ici un tour est un mois, et tout ce qui se décide se relit trente jours plus tard. Vous prévenez aussi que l'arène ne pose pas une situation chaque mois : certains mois, c'est le compte seul qui parle.",
        },
        {
          minutes: 20,
          titre: "Lire le compte du mois",
          detail:
            "Chaque équipe relève ce que l'unité dépense pour produire un couvert et ce que coûte un mois d'ouverture, que la salle soit pleine ou vide, puis calcule son ratio matières et sa marge par couvert. Vous circulez sans corriger : une équipe qui oublie une charge le découvrira dans son résultat.",
        },
        {
          minutes: 25,
          titre: "Trois fournisseurs, quatre critères",
          detail:
            "Les équipes remplissent la matrice : prix, qualité, délai, fiabilité, pondérés par ce qui compte pour leur carte. Le cash & carry fait gagner 1,40 € par couvert, soit 2 800 € sur un mois à 2 000 couverts, et fait perdre des dîners qu'on ne voit pas tout de suite.",
        },
        {
          minutes: 20,
          titre: "Ce que le délai fait à la caisse",
          detail:
            "Chaque équipe projette son solde de fin de mois avec chacun des trois délais, à achats égaux. Le résultat ne bouge pas, la caisse si : c'est le besoin en fonds de roulement, et au mois il se lit à la clôture même au lieu de se noyer dans un trimestre.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "L'équipe répond à la situation du fournisseur, arrête son fournisseur, son prix et ses couverts à préparer, puis écrit le solde qu'elle attend.",
        },
        {
          minutes: 10,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le solde réalisé apparaît à côté du solde prévu, et le ratio matières de chaque équipe porte la marque de son fournisseur.",
        },
        {
          minutes: 10,
          titre: "Débriefing",
          detail:
            "On compare une équipe passée au comptant et une équipe restée à vingt et un jours : la première a gagné un peu de résultat et perdu nettement plus de caisse. La fréquentation du soir n'a pas bougé : la réputation se dégrade d'abord, les dîners suivent ensuite. Vous donnez rendez-vous aux mois suivants.",
        },
      ],
      livrable:
        "La note fournisseur : le ratio matières et la marge par couvert, la matrice multicritère pondérée avec le fournisseur retenu, le solde de fin de mois projeté pour chacun des trois délais de règlement, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai chiffré ce qu'un délai de règlement fournisseur fait à la trésorerie d'un mois, à résultat inchangé.",
      evaluation: [
        "Le ratio matières est calculé sur les comptes du jeu, pas estimé.",
        "La matrice pondère les critères selon la carte de l'unité, pas à parts égales par défaut.",
        "L'effet du délai sur la caisse est chiffré et distingué de l'effet sur le résultat, et le solde attendu est écrit avant la clôture, donc opposable.",
      ],
    },
    {
      numero: 3,
      titre: "Juillet, les denrées flambent et le seuil monte",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Recalculer le nombre de couverts qui couvre les charges du mois quand les denrées prennent 24 %, le ramener à une journée type, puis fixer un prix et un volume à préparer dans un mois où la salle commence à se vider.",
      competences: [
        "Je détermine le nombre de couverts qui couvre les charges d'un mois, et je le ramène à une journée type.",
        "Je fixe un prix et un volume à préparer en sachant ce que coûte un couvert jeté.",
        "Je relie la qualité des denrées à la fréquentation du service du soir.",
      ],
      notions: [
        "seuil de rentabilité",
        "charges fixes et charges variables",
        "denrées périssables et invendus",
        "qualité perçue et réputation",
      ],
      preparation:
        "Le scénario fait flamber les denrées de 24 % à partir de ce mois, et la hausse court jusqu'à la fin de l'atelier : annoncez-le en ouverture, sinon l'écart sera imputé à la prévision et non au choc. L'arène ouvre ce mois-ci la situation des denrées. La saison commence aussi à descendre : le midi d'affaires et les banquets reculent nettement dès juillet, avant le vrai creux d'août. Les chiffres que les équipes doivent retrouver : avant la hausse, 20 € de marge par couvert et un seuil autour de 1 500 couverts, soit la moitié de la capacité et soixante-dix couverts par jour d'ouverture ; après la hausse, une marge plus mince et un seuil plus haut, qu'elles calculent seules. Prévoyez que cette séance se passe sans aucune correction de votre part sur le calcul du seuil.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur juin",
          detail:
            "Chaque équipe confronte son solde prévu et son solde réalisé, en une phrase, et dit combien de couverts elle a jetés.",
        },
        {
          minutes: 25,
          titre: "Du ratio au seuil, avant et après la hausse",
          detail:
            "L'équipe recalcule son ratio matières et sa marge par couvert avec les denrées du mois, puis le nombre de couverts qui couvre le mois avant et après la hausse, et le divise par ses jours d'ouverture. Le chiffre obtenu est celui qu'un responsable d'unité surveille tous les jours.",
        },
        {
          minutes: 25,
          titre: "Préparer ce qui se vendra",
          detail:
            "La demande recule et chaque couvert jeté coûte désormais plus cher. L'équipe estime ses couverts du mois par clientèle et choisit sa réponse à la hausse : la répercuter sur le prix, retravailler la carte, ou changer de fournisseur. Les équipes passées au cash & carry relient leur choix de juin à leurs dîners : l'effet est lent, à peine visible en juillet, et elles écrivent ce qu'elles en attendent pour août.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "L'équipe répond à la situation des denrées, puis saisit son prix et ses couverts à préparer, en sachant que le surplus part à la poubelle le soir même.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le mois. Chaque équipe reçoit son compte de résultat, son ratio matières réalisé, ses denrées perdues et sa place au classement. Beaucoup finissent juillet sous zéro : la hausse et le recul de la saison se cumulent.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Deux équipes affichent leur seuil d'après la hausse et leur résultat. Vous faites remarquer qu'un mois ne pardonne pas comme un trimestre : il n'y a pas de bon mois pour rattraper le mauvais dans le même tour. La question qui reste ouverte : que deviendra ce seuil en août, quand la salle se videra pour de bon.",
        },
      ],
      livrable:
        "La fiche de pilotage de juillet : la marge par couvert et le seuil en couverts avant et après la hausse, leur équivalent en couverts par jour, la réponse retenue à la hausse, le prix et le volume retenus avec leur justification, et le résultat constaté après clôture.",
      tracePasseport:
        "J'ai déterminé le nombre de couverts qui couvre les charges d'un mois d'exploitation avant et après une hausse du prix des denrées.",
      evaluation: [
        "Le seuil est recalculé avec les denrées du mois, pas recopié de juin.",
        "Le seuil est ramené à une journée type, pas laissé en total mensuel.",
        "Le volume à préparer est justifié par le coût du couvert jeté autant que par le client refusé.",
      ],
    },
    {
      numero: 4,
      titre: "Août, la salle est vide et le loyer tombe",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Traverser le mois le plus creux de l'année, où le midi d'affaires et les banquets se vident presque et où le soir faiblit lui aussi, avec des charges de structure inchangées et des denrées restées chères depuis juillet.",
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
        "C'est le mois qui apprend le plus, et le plus dur. Aucune situation ne s'ouvre à date fixe : c'est le compte qui fait la leçon. La hausse des denrées, commencée en juillet, court toujours. La saison fait le reste : le midi d'affaires et les banquets perdent l'essentiel de leur clientèle, le soir recule aussi, quand les charges de structure restent à 30 000 € et la banque à son échéance. Une équipe qui a fini juillet sous zéro peut voir s'ouvrir la situation « Le service ne couvre plus ses frais » : elle vient de ses résultats, pas du calendrier. Préparez un tableau où chaque équipe inscrira son résultat attendu, et rappelez que la marge de sécurité se compte ici en couverts, pas en pourcentage.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le mois",
          detail:
            "Vous rappelez sans donner de chiffre que le mois qui s'ouvre est le plus creux de l'année, et que les denrées n'ont pas baissé. Les équipes retrouvent seules l'ampleur du creux dans les informations du jeu, clientèle par clientèle.",
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
            "Vous clôturez le mois creux. Presque toutes les équipes passent sous zéro, certaines pour le deuxième mois de suite, et c'est le moment de dire qu'un mois négatif n'est pas une faute de gestion en soi.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "On compare l'équipe qui a le moins perdu et celle qui a le plus vendu, et les équipes passées au cash & carry regardent si leurs dîners ont suivi. La question qui reste ouverte : un mois creux se gagne-t-il en août ou se prépare-t-il en juillet, et que fera-t-il à la caisse de septembre.",
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
      numero: 5,
      titre: "Septembre, la rentrée du midi et la caisse au plus bas",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Relancer l'unité au mois où le midi d'affaires revient, corriger sa politique commerciale à partir de juillet et d'août, et décider comment couvrir une caisse que l'été a vidée, en chiffrant ce que coûte cette couverture.",
      competences: [
        "Je corrige une politique commerciale à partir de ce que les deux mois précédents ont montré.",
        "Je chiffre le coût d'un financement court terme et je le rapporte à ce qu'il a évité.",
        "Je décide d'une couverture du besoin de trésorerie et j'en assume le coût.",
      ],
      notions: [
        "saisonnalité de la demande",
        "trésorerie nette",
        "découvert et coût du financement court terme",
        "escompte et affacturage",
        "besoin en fonds de roulement",
      ],
      preparation:
        "La rentrée tient en deux mouvements que les équipes doivent voir séparément. Le midi d'affaires, le soir et les banquets remontent ensemble, sans retrouver encore leur niveau de juin : c'est le mois où la carte se recale. Mais chez les équipes que l'été a mises dans le rouge, la caisse touche souvent son point bas maintenant : août a perdu de l'argent, ses achats se paient en partie en septembre, et les banquets de la rentrée ne s'encaisseront qu'en octobre. Aucune situation ne s'ouvre à date fixe ; celle du résultat sous zéro peut s'ouvrir chez les équipes qui ont fini août dans le rouge. Rappelez les taux du jeu : le découvert autorisé est de 20 000 € à 14 % l'an quand la banque a pleine confiance, l'escompte coûte 7,5 % l'an, l'affacturage 3 % de la créance cédée. Préparez un tableau à trois colonnes : le besoin de caisse du mois, la couverture retenue, ce qu'elle coûte.",
      deroule: [
        {
          minutes: 15,
          titre: "Sortir du creux",
          detail:
            "Chaque équipe fait le point de sa caisse après août et dit avec quoi elle aborde la rentrée.",
        },
        {
          minutes: 25,
          titre: "La rentrée, chiffres en main",
          detail:
            "Les équipes relisent juillet et août côte à côte, clientèle par clientèle, et décident ce qu'elles corrigent pour la rentrée : le prix d'une formule du midi qui revient, le volume à préparer, le budget de communication. Chaque correction s'appuie sur un fait des deux mois écoulés.",
        },
        {
          minutes: 25,
          titre: "Couvrir le mois",
          detail:
            "Chaque équipe projette son solde de fin de mois, puis compare trois façons de couvrir le trou : laisser jouer le découvert, escompter ses créances, les céder en affacturage. Elle chiffre le coût de chacune sur le mois, pas en taux annuel, et le rapporte à la rupture qu'elle évite. Certaines découvrent qu'elles s'apprêtent à payer un découvert pour un encaissement qui n'a qu'un mois de retard.",
        },
        {
          minutes: 20,
          titre: "Décisions du mois",
          detail:
            "Saisie du prix, des couverts, de la communication et de la couverture de trésorerie. Le solde attendu reste écrit sur la fiche.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le résultat remonte souvent plus vite que la caisse : c'est ce décalage que les deux séances suivantes vont suivre jusqu'au bout.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a couvert large et une équipe qui a serré. La question qui reste ouverte : combien vaut de dormir tranquille.",
        },
      ],
      livrable:
        "La note de rentrée : les corrections commerciales décidées avec le fait de juillet ou d'août qui fonde chacune, le solde de fin de mois projeté, la couverture retenue avec son coût sur le mois rapporté à la rupture évitée, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai rapporté le coût d'un financement court terme à la rupture de trésorerie qu'il évitait.",
      evaluation: [
        "La correction commerciale s'appuie sur un fait des deux mois écoulés.",
        "Le coût de la couverture est chiffré sur le mois, pas évoqué en taux annuel.",
        "La couverture retenue est comparée aux deux autres avec des chiffres, et le solde attendu est écrit avant la clôture.",
      ],
    },
    {
      numero: 6,
      titre: "Octobre, les banquets doublent et paient dans trente jours",
      dureeMinutes: 120,
      tourJoue: 5,
      processus: [
        "Bloc 1 · Développer la relation client et assurer la vente conseil",
        "Bloc 3 · Assurer la gestion opérationnelle",
      ],
      objectif:
        "Servir le mois où les banquets font plus que doubler, avec une capacité qui ne s'étire pas, vérifier que les ventes de septembre sont bien rentrées, et voir qu'un mois bénéficiaire peut laisser la caisse au même point quand les groupes règlent à trente jours.",
      competences: [
        "Je suis un encaissement attendu et je constate son arrivée dans la caisse du mois.",
        "Je relie le chiffre d'affaires d'un mois à l'encaissement du mois suivant, selon le délai de chaque clientèle.",
        "J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.",
      ],
      notions: [
        "capacité et saturation",
        "arbitrage entre clientèles",
        "délai de règlement client",
        "encaissement et décaissement",
        "besoin en fonds de roulement",
      ],
      preparation:
        "Les banquets font plus que doubler d'un mois à l'autre, le soir repasse au-dessus de son niveau de juin, la hausse des denrées court encore, et la capacité reste de 3 000 couverts quand la brigade en couvre à peine plus. L'arène ouvre ce mois-ci la situation des banquets : combien préparer pour absorber le pic, et ce que coûte de préparer trop. Le point de la séance tient en une phrase à ne pas dire d'avance : un banquet vendu en octobre s'encaisse en novembre, parce que les groupes règlent à trente jours, soit exactement un tour. Préparez la fiche de plan d'octobre, où l'équipe écrira le chiffre d'affaires attendu ET l'encaissement attendu, qui ne sont pas le même nombre. La commande exceptionnelle, quand elle tombe, tranche la question : un allotement comptant à bas prix, ou un contrat mieux payé mais réglé plus tard.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que septembre a laissé",
          detail:
            "Chaque équipe relit sa note de rentrée, dit ce qu'elle attend en caisse ce mois-ci au titre des banquets de septembre, puis vérifie à l'écran qu'ils sont entrés.",
        },
        {
          minutes: 25,
          titre: "Qui servir quand tout ne rentre pas",
          detail:
            "Les équipes confrontent la demande du mois à leur capacité, puis classent leurs clientèles par marge et par délai de règlement. Servir le mieux payé n'est pas toujours servir le plus vite payé, et c'est l'arbitrage de la séance.",
        },
        {
          minutes: 25,
          titre: "Vendre en octobre, encaisser en novembre",
          detail:
            "Chaque équipe écrit côte à côte son chiffre d'affaires attendu et son encaissement attendu, puis le solde qui en découle. Celles qui remplissent de banquets découvrent un mois bénéficiaire dont la caisse ne verra la couleur qu'au tour suivant.",
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
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Une équipe bénéficiaire dont la caisse n'a pas monté fait la démonstration à votre place. Vous notez au tableau ce qu'elle encaissera le mois prochain : c'est par là que commencera la dernière séance.",
        },
      ],
      livrable:
        "Le plan d'octobre : l'encaissement des banquets de septembre constaté, la demande par clientèle face à la capacité, le classement des clientèles par marge et par délai, le chiffre d'affaires attendu distingué de l'encaissement attendu, et l'écart au solde réalisé.",
      tracePasseport:
        "J'ai distingué le chiffre d'affaires d'un mois de son encaissement en tenant compte du délai de règlement de chaque clientèle.",
      evaluation: [
        "L'encaissement du mois est rapproché du chiffre d'affaires de septembre, ligne à ligne.",
        "Les clientèles sont classées par marge ET par délai, pas par le seul prix.",
        "Le chiffre d'affaires attendu et l'encaissement attendu sont deux nombres distincts et justifiés.",
      ],
    },
    {
      numero: 7,
      titre: "Novembre, le tableau de bord du semestre",
      dureeMinutes: 120,
      tourJoue: 6,
      processus: [
        "Bloc 3 · Assurer la gestion opérationnelle",
        "Bloc 2 · Animer et dynamiser l'offre commerciale",
      ],
      objectif:
        "Constater l'encaissement des banquets d'octobre, jouer le dernier mois, puis construire le tableau de bord des six mois et le présenter comme on rend compte à la direction d'un réseau.",
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
        "Annoncez la présentation à la séance précédente et donnez la grille d'évaluation. Prévoyez un ordre de passage tiré au sort et un chronomètre : trois minutes par équipe, pas une de plus. Demandez que le tableau de bord porte les six mois en colonnes : c'est ce qui fait apparaître le creux d'août, la hausse des denrées qui court de juillet à novembre et le décalage d'encaissement entre octobre et novembre sans qu'on ait à les expliquer. Rappelez que la partie s'arrête avec des créances : les banquets de novembre ne seront payés qu'en décembre, et le tableau doit le dire.",
      deroule: [
        {
          minutes: 15,
          titre: "Le dernier mois",
          detail:
            "Chaque équipe constate ce que les banquets d'octobre ont fait rentrer en caisse, puis décide son dernier mois avec le classement sous les yeux, et dit en une phrase si elle consolide ou si elle tente.",
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
        "Trois séances par jour sur deux jours. La tension est forte et le débriefing court, mais le décalage entre la vente d'octobre et l'encaissement de novembre se vit alors dans la même journée, ce qui le grave mieux qu'un rappel.",
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
        "Parce que c'est le rythme du métier, et parce que le trimestre efface ce que cet atelier veut montrer. Les groupes règlent à trente jours : au trimestre, ce délai se noie dans le tour et personne ne le voit ; au mois, il est un tour entier, et la classe constate qu'un mois bénéficiaire peut laisser la caisse au même point. C'est la seule fiche du registre qui demande « Un mois par tour », et ce réglage n'est pas un détail de création : il est le sujet.",
    },
    {
      question: "Pourquoi commencer en juin, et pourquoi pas une situation chaque mois ?",
      reponse:
        "Parce que la partie suit le calendrier, et que juin ouvre six mois qui traversent tout ce que l'atelier veut montrer : l'été qui se vide, le creux d'août, la rentrée de septembre, les banquets d'automne. Ce que le scénario écrit pour un trimestre tombe au premier mois de ce trimestre : la question du fournisseur s'ouvre en juin, la hausse des denrées en juillet, la saison des banquets en octobre. Les autres mois sont des mois de gestion, où seules les situations nées des résultats peuvent surgir. C'est le rythme réel d'une unité : la plupart des mois, rien d'extraordinaire n'arrive, et c'est là que se joue la caisse.",
    },
    {
      question:
        "Les chiffres du scénario changent-ils quand on passe au mois ?",
      reponse:
        "Oui, et c'est voulu. La plateforme divise tous les flux par trois : 30 000 € de charges de structure au lieu de 90 000, 3 000 couverts de capacité, un seuil autour de 1 500 couverts. L'établissement est le même, sa journée type aussi, soixante-dix couverts. Ce qui ne change pas, ce sont les délais en jours et les taux annuels : c'est exactement ce qui fait le poids relatif d'un délai de trente jours sur un tour d'un mois. La saison, elle, suit le calendrier : chaque mois prend la saison de son trimestre, répartie selon le métier, si bien qu'août vide le midi et les banquets, et qu'octobre et novembre portent les repas de fin d'année.",
    },
    {
      question: "Quel écart avec l'atelier de première année ?",
      reponse:
        "La première année se joue au trimestre sur une boutique, avec le même niveau de décisions. Ce qui monte ici, ce n'est pas le nombre de leviers, c'est le rythme et le secteur : une unité de restauration qui jette ses invendus le soir même, un mois creux qui ne se rattrape pas dans le tour, et une trésorerie qui se pilote d'un mois sur l'autre. Un étudiant qui a fait les deux a vu le même métier à deux échelles de temps.",
    },
    {
      question:
        "L'atelier ne travaille ni le recrutement ni l'équipement de la cuisine, est-ce voulu ?",
      reponse:
        "Oui. Le pilotage d'une unité en deuxième année se joue sur la carte, le remplissage, les achats et la caisse. Travailler la structure ajouterait des décisions que les équipes prendraient au hasard et qui brouilleraient la lecture du mois. La brigade est à l'écran, à son effectif de départ : l'atelier n'y touche pas ; l'investissement, lui, ne s'ouvre qu'au niveau suivant. L'atelier de management en hôtellerie-restauration, lui, ouvre la brigade et la cuisine : c'est un autre métier et un autre diplôme.",
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
