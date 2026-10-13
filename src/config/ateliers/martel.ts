import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS GPME, première année.
 *
 * Sept séances de deux heures sur MARTEL & FILS, l'entreprise de rénovation :
 * quatorze compagnons, un dépôt, trois clientèles qui règlent à trente,
 * soixante et quatre-vingt-dix jours, et le mètre carré rénové comme unité.
 * C'est le secteur type du diplôme, et le seul du registre où l'argent sort
 * des mois avant de rentrer : les matériaux et les salaires se paient pendant
 * le chantier, la facture part à la réception, le règlement arrive après.
 *
 * C'est un atelier de PREMIÈRE année, et il en a le périmètre : une première
 * séance qui présente le jeu et fait jouer un tour d'essai avant que rien ne
 * compte, puis un trimestre par séance, chaque séance adossée à la situation
 * que le scénario pose à ce tour, du seuil au mètre carré jusqu'au rapport au
 * dirigeant. Le niveau Pilotage ouvre le poste clients et l'effectif ; ce que
 * le niveau suivant ouvrira en deuxième année, l'assurance et l'achat d'un
 * engin, se chiffre ici sur le papier, et la fiche le dit à chaque fois.
 *
 * Chaque séance produit un document et une phrase pour le dossier
 * professionnel. Un jeu d'entreprise sans trace écrite ne s'évalue pas.
 */
export const ATELIER_MARTEL: AtelierDefinition = {
  code: "martel",
  titre: "Tenir les chantiers et la caisse d'une entreprise de rénovation",
  formations: ["bts-gpme"],
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "dossier professionnel",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Sept séances de deux heures, la première pour apprendre le jeu sur un tour d'essai, les six suivantes pour un trimestre chacune. Chaque équipe seconde le dirigeant de la même entreprise de rénovation, fixe son prix au mètre carré, signe ou refuse des chantiers, surveille des clients qui paient à trente, soixante ou quatre-vingt-dix jours, embauche ou renonce, et rend à chaque séance un document que le patron pourrait signer.",
  resume:
    "Six trimestres dans une entreprise de rénovation de quatorze compagnons, précédés d'un tour d'essai, du seuil au mètre carré jusqu'au rapport au dirigeant, en séances de deux heures.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "7 séances de 2 h",
  pourquoi:
    "L'assistant de gestion d'une PME du bâtiment vit dans le décalage entre la dépense et la recette : il paie le négoce de matériaux et les compagnons pendant le chantier, il facture à la réception, et il attend ensuite que le particulier, le syndic ou la commune règlent. Un dossier décrit ce décalage ; ici l'équipe le subit, parce que ses chantiers commencés dorment au bilan et que son compte en banque ne ressemble pas à son résultat. Le devis à signer ou à refuser, le délai de règlement de chaque clientèle, la retenue de garantie, le compagnon de plus qu'on embauche un trimestre trop tôt : chacun de ces gestes du métier devient une décision du trimestre, avec ses chiffres et ses suites. Et parce que c'est une première année, le jeu s'apprend d'abord sur un tour qui ne compte pas, puis une seule chose nouvelle par séance, en deux heures.",
  reglages: {
    scenarioCode: "batiment",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 6,
    tourDEssai: 1,
    effectifParEquipe: "trois élèves",
    notes:
      "MARTEL & FILS se joue avec un tour d'essai : choisissez « un tour » dans l'option du formulaire de création, sans l'enchaînement automatique, pour lancer vous-même la vraie partie en fin de première séance. L'essai se joue avec les mêmes équipes et les mêmes écrans, puis l'entreprise repart de son état initial. Le niveau Pilotage ouvre la qualité des finitions, l'entretien du matériel, l'effectif et les salaires, et la mobilisation des créances, c'est-à-dire ce que les blocs de première année demandent de savoir manier ; le fournisseur de matériaux, l'offre de chantier du trimestre et les études se décident à tout niveau. L'emprunt, l'achat d'un engin et l'assurance attendent le niveau suivant, en deuxième année : un manque de trésorerie, la banque le couvre seule par le découvert, à son taux, et au-delà du plafond consenti elle cède les créances d'office. Les deux séances qui parlent d'assurance et de nacelle les chiffrent sur le papier, et le disent. La TVA est activée, au taux de droit commun. Le monde variable est décoché : toutes vos classes jouent le même marché. Les aléas du secteur restent tirés à leur fréquence normale, et chacun arrive par un courrier : l'aide à la rénovation qui gonfle la demande des particuliers, la pénurie de matériaux et les intempéries à partir du deuxième trimestre, l'appel d'offres, le concurrent qui dépose le bilan et le crédit qui se resserre à partir du troisième. Un événement est écrit d'avance : au quatrième trimestre, le crédit immobilier se resserre et la demande baisse pendant deux trimestres ; la cinquième séance en fait sa matière. Deux concurrents pilotés par la machine suffisent à ce que les devis se comparent.",
  },
  seances: [
    {
      numero: 1,
      titre: "Entrer dans l'entreprise sur un tour d'essai",
      dureeMinutes: 120,
      tourJoue: null,
      essai: true,
      processus: [
        "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
        "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
      ],
      objectif:
        "Apprendre le jeu avant que rien ne compte : lire le mandat de l'entreprise, ses trois clientèles et son mètre carré, jouer un trimestre d'essai de bout en bout, lire ses premiers résultats, puis lancer la vraie partie.",
      competences: [
        "Je présente une entreprise du bâtiment en une page : ce qu'elle vend, à qui, avec quels compagnons et quel matériel.",
        "Je repère, sur l'écran de décision, ce qui se décide chaque trimestre et ce que le niveau de la partie laisse fixé.",
        "Je lis un premier compte de résultat et un premier tableau de flux, et je distingue ce qui a été vendu, ce qui a été gagné et ce qui est entré en caisse.",
      ],
      notions: [
        "le mètre carré rénové, unité de l'entreprise",
        "clientèles et délais de règlement",
        "charges de structure du trimestre",
        "compte de résultat et tableau de flux",
      ],
      preparation:
        "Créez la partie depuis votre espace, ou depuis l'activité de votre plateforme pédagogique si votre établissement la relie, avec ces réglages : MARTEL & FILS, un trimestre par tour, niveau 3 · Pilotage, six tours, six équipes, deux concurrents machine, TVA activée, monde variable décoché, questions de connaissances activées, et dans « Tour d'essai » un tour, sans cocher l'enchaînement automatique : c'est vous qui commencerez la vraie partie, depuis l'ardoise de la partie, en fin de séance. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, un rôle par élève (devis et clients, chantiers et compagnons, caisse), rôles tournants d'une séance à l'autre. Imprimez la fiche d'identité de l'entreprise, vierge. Sachez que la situation du premier trimestre s'ouvre pendant l'essai, puis de nouveau au vrai premier trimestre : la première lecture sert à apprendre l'écran, la seconde compte.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : sept séances, un tour d'essai qui ne compte pas puis six trimestres, une seule entreprise, un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code et nomment leur entreprise.",
        },
        {
          minutes: 25,
          titre: "L'entreprise, lue à l'écran",
          detail:
            "Chaque équipe lit le mandat, le premier arbitrage entre les particuliers et les marchés publics, le panneau de capacité avec ses deux plafonds, les compagnons et le matériel, et le panneau du fournisseur de matériaux. Elle remplit la première moitié de sa fiche d'identité : ce que vend l'entreprise, à qui, et avec quels moyens.",
        },
        {
          minutes: 25,
          titre: "Le tour d'essai",
          detail:
            "Le bandeau de l'arène dit que rien ne compte. Chaque équipe lit la situation du trimestre, tranche l'arbitrage, puis saisit un prix au mètre carré, une surface à traiter et un budget de prospection, comme pour de vrai. Vous ne corrigez rien : un zéro de trop dans la surface est exactement ce que l'essai est fait pour absorber.",
        },
        {
          minutes: 20,
          titre: "Clôture de l'essai et premiers résultats",
          detail:
            "Vous clôturez le tour d'essai depuis votre espace. Chaque équipe lit son chiffre d'affaires, son résultat et sa trésorerie de fin de trimestre, et reporte les trois chiffres sur sa fiche d'identité.",
        },
        {
          minutes: 20,
          titre: "Ce que l'essai apprend",
          detail:
            "Vous affichez deux équipes côte à côte : un prix, une surface, un résultat, une trésorerie. Qui a vendu le plus, qui a gagné le plus, et pourquoi ce n'est pas la même équipe. Le tableau de flux montre que ce qui a été facturé n'est pas encore rentré : c'est la phrase que l'atelier répétera pendant six trimestres.",
        },
        {
          minutes: 20,
          titre: "La vraie partie commence",
          detail:
            "Les équipes terminent leur fiche d'identité. Vous appuyez sur « Commencer la vraie partie » depuis l'ardoise, vous confirmez, et toutes les entreprises repartent de l'état initial : les équipes, les élèves et les codes restent, l'essai reste lisible de votre côté pour le débriefing. Les équipes voient le bandeau de départ et lisent la situation du premier trimestre, cette fois pour de vrai.",
        },
      ],
      livrable:
        "La fiche d'identité de l'entreprise, une page : ce que vend MARTEL & FILS et à qui, les trois clientèles avec leur délai de règlement, les compagnons et le matériel qui bornent la surface traitée, les charges qui tombent chaque trimestre quoi qu'il arrive, et le chiffre d'affaires du tour d'essai avec son résultat et sa trésorerie de fin de trimestre.",
      tracePasseport:
        "J'ai présenté une entreprise du bâtiment sur une page à partir de ses écrans de décision et de ses premiers résultats d'essai.",
      evaluation: [
        "Les trois clientèles sont nommées avec leur délai de règlement, dans l'ordre du plus court au plus long.",
        "Les deux plafonds de la surface traitée, les compagnons et le matériel, sont distingués.",
        "Les trois chiffres de l'essai sont exacts, et la différence entre le résultat et la trésorerie est relevée, même sans être encore expliquée.",
      ],
    },
    {
      numero: 2,
      titre: "Prendre la mesure de l'entreprise",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
        "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
      ],
      objectif:
        "Calculer ce qu'un mètre carré rénové laisse à l'entreprise, combien de mètres carrés il faut livrer dans le trimestre pour payer les quatorze compagnons et le dépôt, et fixer un premier prix de devis en le sachant.",
      competences: [
        "Je sépare, sur le compte de résultat d'un trimestre, les matériaux et les frais de chantier qui suivent la surface traitée des salaires et du dépôt qui tombent quoi qu'il arrive.",
        "Je calcule la marge sur coût variable d'un mètre carré rénové et le nombre de mètres carrés à livrer pour couvrir la structure du trimestre.",
        "Je fixe un prix au mètre carré en sachant ce que chaque euro de plus fait au seuil et ce que trois devis concurrents font à la demande.",
      ],
      notions: [
        "charges de structure et coûts variables de chantier",
        "marge sur coût variable au mètre carré",
        "seuil de rentabilité en mètres carrés",
        "prix de devis et capacité",
      ],
      preparation:
        "Rien à créer : la vraie partie a commencé en fin de première séance. Si vous ne l'avez pas lancée, faites-le avant que les équipes n'arrivent. Entre les deux séances, chaque équipe a relu sa fiche d'identité et le compte de résultat de l'essai, et a classé seule ses charges en deux colonnes : c'est le travail à la maison de cette séance, et c'est lui qui permet de tenir en deux heures. Préparez au tableau le compte de résultat d'essai d'une équipe volontaire : il servira d'exemple commun. La situation du premier trimestre, « Quatorze compagnons et un dépôt », s'ouvre de nouveau pour de vrai, avec son diagnostic et ses questions ; les équipes l'ont déjà vue, elles l'analysent maintenant.",
      deroule: [
        {
          minutes: 10,
          titre: "Ce que l'essai a laissé",
          detail:
            "Vous relisez avec la classe la question de la première séance : une entreprise qui a facturé n'a pas forcément encaissé. Puis vous posez celle du jour : combien de mètres carrés faut-il livrer dans le trimestre pour ne rien perdre ? Personne ne sait. C'est la séance.",
        },
        {
          minutes: 30,
          titre: "La marge au mètre carré",
          detail:
            "Sur le compte de résultat d'essai, chaque équipe confronte son classement fait à la maison : les matériaux et les frais de chantier suivent la surface, les compagnons, le dépôt et le matériel tombent que les équipes travaillent ou non. Elle calcule ce qu'un mètre carré laisse une fois ses matériaux et ses frais payés, sur papier, avec ses chiffres.",
        },
        {
          minutes: 25,
          titre: "Du seuil au devis",
          detail:
            "La structure du trimestre divisée par la marge d'un mètre carré donne la surface à livrer pour ne rien perdre. L'équipe la compare à la capacité de ses compagnons et de son matériel, puis se demande ce qu'un euro de plus sur le devis fait à ce seuil, et ce qu'il fait aux particuliers qui comparent trois devis.",
        },
        {
          minutes: 25,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'équipe répond au diagnostic et aux questions de la situation, tranche l'arbitrage entre les particuliers et les marchés publics, motive son choix en trois lignes, puis saisit son prix au mètre carré, sa surface à traiter et sa prospection, le seuil sous les yeux.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le premier trimestre. Les résultats s'affichent pour chaque équipe, avec le classement et l'indicateur du prix moyen au mètre carré réellement obtenu.",
        },
        {
          minutes: 15,
          titre: "Débriefing",
          detail:
            "On compare la surface visée au seuil et la surface vendue, et on cherche pourquoi elles diffèrent : le prix a fait fuir les particuliers, ou la capacité n'a pas suivi. Vous ne dites pas qui a raison, vous montrez les deux comptes de résultat.",
        },
      ],
      livrable:
        "La note de marge et de seuil, une page : le classement des charges en deux colonnes avec sa justification, la marge sur coût variable d'un mètre carré rénové, la surface à livrer dans le trimestre pour ne rien perdre, sa comparaison avec la capacité de l'entreprise, et le prix de devis retenu pour le premier trimestre avec le choix de clientèle qui l'accompagne.",
      tracePasseport:
        "J'ai fixé un prix de devis à partir du seuil de rentabilité calculé sur les charges de ma propre entreprise de rénovation.",
      evaluation: [
        "Le classement des charges est justifié, y compris pour l'entretien du matériel et la prospection.",
        "La marge au mètre carré et le seuil en mètres carrés sont exacts et portent leurs unités.",
        "Le seuil est interprété : l'équipe dit quelle part de sa capacité il représente, pas seulement le chiffre.",
        "Le prix retenu est cohérent avec le seuil annoncé et avec la clientèle visée.",
      ],
    },
    {
      numero: 3,
      titre: "Le devis qu'il ne faudrait pas signer",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: [
        "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
      ],
      objectif:
        "Répondre à un promoteur qui propose un chantier sous le prix de revient complet, en distinguant ce que la décision fait varier de ce qui est payé de toute façon, et en sachant quand la réponse s'inverse.",
      competences: [
        "Je distingue, dans le prix de revient complet d'un chantier, ce que la décision de signer fait varier de ce qui est engagé de toute façon.",
        "Je décide d'accepter ou de refuser un chantier sous le prix de revient complet selon que les équipes sont creuses ou pleines.",
        "Je rédige une réponse au devis qui dit le prix accepté, la condition posée et ce que l'entreprise y gagne.",
      ],
      notions: [
        "prix de revient complet et coût variable",
        "coûts pertinents d'une décision",
        "marge sur coût variable d'un chantier de remplissage",
        "coût d'opportunité à capacité pleine",
      ],
      preparation:
        "La situation du deuxième trimestre, « Le devis qu'il ne faudrait pas signer », porte toute la séance : un promoteur propose un lot sous le prix de revient complet, et les équipes ont deux semaines creuses. Entre les deux séances, chaque équipe a relevé sur son compte de résultat du premier trimestre sa surface vendue et sa capacité, pour savoir en arrivant si ses équipes sont creuses ou pleines. L'arène propose aussi, chaque trimestre, une offre de chantier à accepter ou non, servie sur la surface que le marché n'a pas absorbée et réglée au délai de l'offre : lisez celle du trimestre avant la séance, elle sert d'exercice jumeau. Préparez la trame de réponse au devis en trois phrases.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur le premier trimestre",
          detail:
            "Les résultats du premier trimestre sont affichés. Chaque équipe dit si elle a vendu sa capacité ou s'il lui reste des semaines creuses : la réponse décide de tout le reste de la séance.",
        },
        {
          minutes: 30,
          titre: "Ce que le prix de revient complet cache",
          detail:
            "Le prix de revient complet répartit sur chaque mètre carré une structure qui ne bouge pas avec la décision. L'équipe refait le calcul avec les seuls coûts que signer fait apparaître, les matériaux et les frais de chantier, et trouve ce que le chantier laisse par mètre carré. Le même raisonnement se fait sur l'offre de chantier du trimestre, avec son prix et son délai de règlement.",
        },
        {
          minutes: 20,
          titre: "Signer, poser une condition, refuser",
          detail:
            "La réponse s'inverse le jour où les équipes sont pleines : le vrai coût du chantier devient la marge du chantier qu'il chasse. L'équipe écrit laquelle des trois réponses elle donne au promoteur, et à quelle condition : un délai de règlement, une date, un volume.",
        },
        {
          minutes: 20,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe répond au diagnostic et aux questions de la situation, accepte ou non l'offre de chantier du trimestre, puis saisit son prix, sa surface et sa prospection. Elle écrit la surface qu'elle attend de vendre.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Pour chaque équipe, la surface vendue, le prix moyen au mètre carré et la part de chiffre d'affaires partie en créances s'affichent.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a rempli ses semaines creuses à prix réduit et une qui a refusé. La différence de résultat se voit ; la différence de trésorerie, quand le chantier est réglé tard, se voit aussi, et c'est l'annonce de la séance suivante.",
        },
      ],
      livrable:
        "La réponse au devis du promoteur, une page : le prix de revient complet du mètre carré et ce qu'il contient, les seuls coûts que la décision de signer fait varier, ce que le chantier laisse par mètre carré, l'état des équipes au moment de décider, la réponse donnée au promoteur avec sa condition, et la surface attendue au deuxième trimestre.",
      tracePasseport:
        "J'ai répondu à une demande de devis sous le prix de revient complet en ne retenant que les coûts que la décision faisait varier.",
      evaluation: [
        "Les coûts retenus pour décider sont ceux que la signature fait varier, et le choix est justifié.",
        "La réponse tient compte de l'état réel des équipes, creuses ou pleines, lu sur le trimestre précédent.",
        "La condition posée au promoteur est nommée et chiffrée, pas seulement souhaitée.",
      ],
    },
    {
      numero: 4,
      titre: "Un carnet plein et un compte à sec",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
        "Bloc 2 · Participer à la gestion des risques de la PME",
      ],
      objectif:
        "Comprendre comment une entreprise de rénovation qui gagne de l'argent peut ne plus en avoir en caisse, mesurer en euros ce que les délais de règlement de chaque clientèle et les chantiers commencés immobilisent, et choisir comment couvrir le décalage.",
      competences: [
        "Je retrouve dans le bilan de mon entreprise ce que les clients lui doivent, ce que les chantiers commencés immobilisent et ce que les fournisseurs lui avancent.",
        "Je traduis le délai de règlement de chaque clientèle en euros immobilisés sur un trimestre de chantiers.",
        "Je choisis entre attendre, escompter et céder une créance en comparant ce que chaque solution coûte à ce qu'elle évite.",
      ],
      notions: [
        "besoin en fonds de roulement de chantier",
        "délais de règlement par clientèle",
        "en-cours de chantier",
        "escompte et affacturage",
        "découvert et affacturage forcé",
      ],
      preparation:
        "La situation du troisième trimestre, « Un carnet plein et un compte à sec », ne s'ouvre que pour une équipe dont le trimestre précédent s'est clos avec un résultat positif et une trésorerie nette négative. Sur les trajectoires types du scénario, cela n'arrive pas : les créances que l'entreprise détient à l'ouverture rentrent dès le premier trimestre et gonflent la caisse. Comptez donc sans elle. La séance se joue sur le bilan et le tableau de flux de chaque équipe, où le besoin en fonds de roulement se lit de toute façon, et l'indicateur « BFR en jours de chiffre d'affaires » de l'arène fait le même travail. Si elle s'ouvre chez une équipe, faites-la lire à la classe : c'est l'énoncé que les autres n'auront pas eu. Entre les deux séances, chaque équipe a relevé sur son bilan du deuxième trimestre ses créances, ses chantiers en cours et ses dettes fournisseurs : les trois lignes arrivent calculées. Vérifiez que la partie tourne au niveau Pilotage, qui ouvre l'escompte et l'affacturage. L'acompte à la signature n'existe pas dans le jeu : les particuliers règlent à trente jours, c'est le délai le plus court, et la question de l'acompte se discute sur le papier. À partir de ce trimestre, le concurrent qui dépose le bilan et le crédit qui se resserre peuvent tomber, par courrier.",
      deroule: [
        {
          minutes: 15,
          titre: "Résultat et caisse ne sont pas la même chose",
          detail:
            "Vous mettez côte à côte, pour deux équipes, le résultat du deuxième trimestre et la variation de trésorerie du même trimestre. Ils ne coïncident pas. Vous ne l'expliquez pas encore : vous le faites constater.",
        },
        {
          minutes: 30,
          titre: "Où est l'argent",
          detail:
            "Avec ses trois lignes relevées à la maison, chaque équipe calcule ce que son cycle immobilise : ce que les clients doivent, plus les chantiers commencés et non facturés, moins ce que le négoce accepte d'avancer à quarante-cinq jours. Puis elle traduit en euros le délai de chaque clientèle : un trimestre de marchés publics réglés à quatre-vingt-dix jours dort entièrement chez le client.",
        },
        {
          minutes: 20,
          titre: "Attendre, escompter, céder",
          detail:
            "L'équipe compare attendre, escompter une partie de ses créances et les céder, et chiffre ce que chacune coûte au prorata du trimestre. Le découvert, à son taux, est la quatrième solution, celle qu'on ne choisit pas : au-delà du plafond consenti, la banque cède les créances d'office et le fait payer.",
        },
        {
          minutes: 20,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe saisit ses décisions, dont ce qu'elle mobilise de ses créances, et écrit ce qu'elle attend de sa trésorerie de fin de trimestre. Ce qu'elle mobilise doit correspondre au besoin que son calcul démontre.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le délai moyen de règlement, le besoin en fonds de roulement en jours et la trésorerie nette de chaque équipe s'affichent côte à côte, avec le verdict de la banque sur la tenue du compte.",
        },
        {
          minutes: 20,
          titre: "L'écart entre le résultat et la caisse",
          detail:
            "Chaque équipe reprend les deux chiffres du début de séance et écrit, poste par poste, d'où vient l'écart : créances, chantiers en cours, dettes fournisseurs, TVA à décaisser. On compare une équipe qui a mobilisé ses créances et une qui a attendu : la différence de résultat est petite, la différence de trésorerie ne l'est pas.",
        },
      ],
      livrable:
        "La note sur le poste clients, une page : les créances et les chantiers en cours relevés au bilan, les dettes fournisseurs qui les financent en partie, le besoin en fonds de roulement qui en résulte, le délai de chaque clientèle traduit en euros immobilisés, les solutions comparées avec leur coût, la solution retenue, et l'écart entre le résultat et la trésorerie du trimestre expliqué poste par poste.",
      tracePasseport:
        "J'ai mesuré le besoin en fonds de roulement d'une entreprise de chantiers et choisi par le calcul comment couvrir le décalage entre la dépense et l'encaissement.",
      evaluation: [
        "Le besoin en fonds de roulement est reconstitué à partir du bilan de l'équipe, pas d'un exemple de cours.",
        "Chaque délai de règlement est traduit en euros immobilisés, pas laissé en jours.",
        "Le coût de chaque solution est calculé au prorata du trimestre, celui du découvert compris.",
        "L'écart entre le résultat et la trésorerie est expliqué poste par poste, sans être mis sur le compte du hasard.",
      ],
    },
    {
      numero: 5,
      titre: "Cinq pour cent qui manquent toujours",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: [
        "Bloc 2 · Participer à la gestion des risques de la PME",
        "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
      ],
      objectif:
        "Dater les encaissements et les décaissements d'un trimestre de chantiers pour trouver le mois où la caisse manquera et de combien, retenue de garantie comprise, puis recenser les risques d'une petite entreprise de rénovation et décider lesquels réduire, lesquels couvrir et lesquels supporter.",
      competences: [
        "Je construis le budget de trésorerie du trimestre, encaissement par encaissement, en datant la retenue de garantie et les mandatements au jour où l'argent arrive.",
        "J'identifie les risques d'une entreprise de rénovation, du fournisseur qui livre en retard au client qui paie dans un an, et je chiffre ce que chacun coûterait.",
        "J'arbitre entre supporter un risque, le réduire par le choix d'un fournisseur et le transférer à un assureur, en comparant la prime à ce qu'elle évite.",
      ],
      notions: [
        "budget de trésorerie mois par mois",
        "retenue de garantie",
        "risque fournisseur et rupture d'approvisionnement",
        "transfert de risque et prime",
        "aléas de chantier",
      ],
      preparation:
        "Deux choses tombent à ce trimestre, et il faut les annoncer en ouverture. Le scénario fait se resserrer le crédit immobilier : la demande baisse pendant deux trimestres, et les équipes qui ont visé les particuliers le sentent les premières. Et la situation du trimestre, « Cinq pour cent qui manquent toujours », pose la retenue de garantie : le maître d'ouvrage garde une part de la facture pendant un an. Le jeu ne modélise pas cette retenue, elle vit dans l'énoncé ; ce qu'il joue réellement, ce sont les délais de règlement et le découvert, et c'est sur eux que le budget se construit. Le cockpit de l'équipe, à télécharger depuis la page de la partie, porte une feuille de prévision du résultat et de la trésorerie qui se recalcule à chaque hypothèse : entre les deux séances, chaque équipe y a reporté ses décisions du trimestre précédent et les délais de ses clientèles, pour arriver avec les encaissements déjà datés. Côté risques, lisez les trois fournisseurs de matériaux et leur risque de livraison, et les trois formules de couverture du scénario avec ce que chacune couvre : à ce niveau, aucune formule ne se souscrit, les sinistres de chantier ne sont pas tirés par le jeu de lui-même, et la couverture se chiffre sur le papier ; le fournisseur, lui, se choisit pour de vrai. Préparez une grille de cartographie à deux entrées, probabilité et montant, vierge.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que le quatrième trimestre apporte",
          detail:
            "Vous lisez avec la classe le courrier du crédit qui se resserre, puis la situation de la retenue de garantie. La question posée est celle de l'outil : quel document montre le mois où l'on manquera de caisse, et de combien ? Le compte de résultat prévisionnel ne le dira pas.",
        },
        {
          minutes: 30,
          titre: "Le budget de trésorerie, mois par mois",
          detail:
            "Dans le cockpit, chaque équipe date ses encaissements aux délais réels de ses clientèles, et ses décaissements au jour où le négoce et les compagnons sont payés. La retenue de garantie se date à un an, sur le papier : le produit est acquis, l'argent ne l'est pas. La ligne de solde de fin de mois est celle qui compte, et une équipe la lit à voix haute.",
        },
        {
          minutes: 20,
          titre: "Les risques, chiffrés",
          detail:
            "Chaque équipe place sur la grille les risques de son entreprise, avec un montant pour chacun : le déstockeur qui livre en retard et arrête un chantier, les intempéries qui laissent les compagnons payés sans recette, le client qui règle dans un an, le découvert qui se transforme en cession forcée. Puis elle compare, pour un sinistre de chantier, la prime d'une couverture au coût qu'elle éviterait. Un risque sans montant reste une inquiétude.",
        },
        {
          minutes: 20,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe répond au diagnostic et aux questions de la situation, confirme ou change son fournisseur de matériaux en connaissance de son risque de livraison, puis saisit ses décisions, budget de trésorerie mis à jour dans le cockpit. Elle écrit quel risque elle accepte de supporter seule.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. La demande en retrait se lit sur les surfaces vendues, et le tableau de flux dit si le mois tendu annoncé par le budget l'a été.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare le solde prévu et le solde réalisé, ligne par ligne. Puis on distingue une bonne décision d'un bon résultat : une équipe qui a choisi le fournisseur sûr et n'a subi aucun retard a payé plus cher pour rien, et pourtant elle a bien décidé.",
        },
      ],
      livrable:
        "Le budget de trésorerie et la cartographie des risques, deux pages : pour chaque mois du trimestre, les encaissements datés, les décaissements datés, le solde et le mois le plus tendu, puis chaque risque recensé avec sa probabilité, son montant, la décision prise à son sujet, et la justification des risques supportés sans couverture.",
      tracePasseport:
        "J'ai daté les flux d'un trimestre de chantiers dans un budget de trésorerie et arbitré les risques d'une petite entreprise entre les réduire, les couvrir et les supporter.",
      evaluation: [
        "Les encaissements sont datés aux délais réels de chaque clientèle, pas au jour de la facture.",
        "La retenue de garantie est traitée comme un produit acquis et un encaissement différé, pas comme une perte.",
        "Chaque risque porte un montant, et le choix du fournisseur est rattaché au risque qu'il réduit.",
        "Les risques supportés sans couverture sont assumés explicitement, avec ce qu'ils coûteraient.",
      ],
    },
    {
      numero: 6,
      titre: "Embaucher, sous-traiter ou refuser",
      dureeMinutes: 120,
      tourJoue: 5,
      processus: [
        "Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
        "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
      ],
      objectif:
        "Décider ce que fait l'entreprise d'un carnet qui déborde, en chiffrant le coût complet d'un compagnon de plus, le trimestre pendant lequel une embauche ne produit rien, et ce que laisserait la sous-traitance, pour choisir sur le bon horizon.",
      competences: [
        "Je calcule le coût complet d'un compagnon de plus et la surface qu'il doit livrer pour se payer.",
        "Je compare embaucher, sous-traiter et refuser sur le même horizon, en comptant le trimestre où un recrutement ne produit rien encore.",
        "Je distingue une décision d'exploitation réversible d'une décision de structure qui engage l'entreprise sur plusieurs trimestres.",
      ],
      notions: [
        "coût complet d'un compagnon",
        "délai d'embauche et capacité du trimestre suivant",
        "marge laissée par la sous-traitance",
        "charge de structure durable et pic d'activité",
      ],
      preparation:
        "La situation du cinquième trimestre, « Embaucher, sous-traiter ou refuser », donne les chiffres : six cents mètres carrés de trop, un confrère qui les prendrait, deux compagnons à embaucher. Vérifiez dans le moteur ce que chacun fait vraiment, pour ne promettre que cela. L'embauche est une décision du jeu : jusqu'à trois compagnons par trimestre, un coût de recrutement et le salaire payés dès ce trimestre, des compagnons productifs au trimestre suivant seulement. La sous-traitance ne l'est pas pour cette entreprise : elle se chiffre sur le papier, au prix de la situation, et c'est l'embauche ou la surface renoncée que la simulation joue. Entre les deux séances, chaque équipe a relevé sa capacité des trimestres joués et la demande qu'elle n'a pas pu servir, pour dire en arrivant si elle sature ou si elle a du mou ; l'alerte de l'arène sur les équipes qui ne suivent plus, quand elle s'est ouverte, le dit aussi. Préparez la fiche de décision d'embauche, avec la ligne de calcul de la surface à livrer laissée vide. Le crédit resserré du trimestre précédent pèse encore sur la demande : dites-le avant que quelqu'un n'embauche sur un carnet qui se vide.",
      deroule: [
        {
          minutes: 15,
          titre: "Où en est le carnet",
          detail:
            "Chaque équipe dit si elle a refusé des mètres carrés aux trimestres joués et lesquels de ses deux plafonds l'ont bloquée, les compagnons ou le matériel. Une équipe bloquée par le matériel n'a rien à gagner à embaucher, et il faut le voir avant de calculer.",
        },
        {
          minutes: 30,
          titre: "Ce que coûte un compagnon de plus",
          detail:
            "L'équipe calcule le coût complet d'un compagnon sur un trimestre, recrutement compris, puis la surface qu'il doit livrer pour se payer, puis le nombre de trimestres où le carnet doit rester plein pour que l'embauche se justifie. Le chiffre obtenu se compare à ce que l'équipe croit de la demande à venir.",
        },
        {
          minutes: 20,
          titre: "Embaucher, sous-traiter, refuser",
          detail:
            "Trois colonnes, un même horizon. Refuser rapporte zéro sur la surface perdue. Sous-traiter, sur le papier, laisse la différence entre le prix facturé et le prix du confrère, sans engager l'entreprise au-delà du chantier. Embaucher engage un salaire chaque trimestre, carnet plein ou non, et ne produit rien ce trimestre-ci. L'équipe choisit et dit sur quel horizon.",
        },
        {
          minutes: 20,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe répond au diagnostic et aux questions de la situation, puis saisit ses décisions, embauches comprises. Celle qui recrute écrit la surface supplémentaire qu'elle attend au trimestre suivant, pas à celui-ci.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. L'effet d'une embauche ne se lit pas ce trimestre : le coût tombe, la capacité ne monte qu'au suivant. Il faut le dire pour éviter des conclusions hâtives.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On oppose une équipe qui a embauché et une qui s'en est tenue à ses quatorze compagnons, en gardant ouverte la question de savoir laquelle aura eu raison au sixième trimestre. Puis on nomme la différence entre une décision qu'on peut défaire et une qui engage.",
        },
      ],
      livrable:
        "La fiche de décision d'embauche, une page : le plafond qui bloque réellement l'entreprise, le coût complet d'un compagnon sur un trimestre, la surface qu'il doit livrer pour se payer, la comparaison sur le même horizon entre embaucher et sous-traiter et refuser, la décision prise avec le nombre de trimestres sur lequel elle est jugée, et la surface attendue au trimestre suivant.",
      tracePasseport:
        "J'ai préparé une décision d'embauche dans une PME du bâtiment en chiffrant le coût complet du poste et le trimestre pendant lequel il ne produit rien.",
      evaluation: [
        "Le coût du compagnon est un coût complet, recrutement compris, pas un salaire seul.",
        "La surface à livrer pour amortir le poste est comparée à la capacité réellement manquante.",
        "Les trois options sont jugées sur le même horizon, le trimestre sans production compris.",
        "La décision dit si elle est réversible, et ce qui se passe si le carnet se vide.",
      ],
    },
    {
      numero: 7,
      titre: "La nacelle ou la location, puis le rapport au dirigeant",
      dureeMinutes: 120,
      tourJoue: 6,
      processus: [
        "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
        "Bloc 2 · Participer à la gestion des risques de la PME",
      ],
      objectif:
        "Jouer le dernier trimestre en décidant sur le papier si l'entreprise achète la nacelle qu'elle loue, puis rendre compte des six trimestres au dirigeant, tableau de bord à l'appui, en quatre minutes.",
      competences: [
        "Je compare acheter et louer un engin sur les seuls flux que la décision change, et je ramène les économies futures à leur valeur d'aujourd'hui.",
        "Je construis le tableau de bord des six trimestres sur une page, avec les indicateurs du métier et pas seulement le résultat.",
        "Je présente oralement six trimestres de gestion à un dirigeant et je réponds à ses objections avec des chiffres.",
      ],
      notions: [
        "valeur actuelle nette d'un achat d'engin",
        "flux de trésorerie que la décision change",
        "amortissement et décaissement",
        "tableau de bord d'une PME du bâtiment",
        "préconisation chiffrée",
      ],
      preparation:
        "La situation du sixième trimestre, « La nacelle ou la location », s'ouvre dans l'arène dès la clôture du cinquième : entre les deux séances, chaque équipe la lit et fait le calcul à la maison, économie de location contre décaissement d'achat et entretien, flux ramenés à aujourd'hui. C'est le travail hors classe le plus long de l'atelier, et il ne tient pas en séance. Sachez ce que le jeu en fait : l'achat de l'engin n'est pas une décision ouverte au niveau Pilotage, et au dernier trimestre il n'aurait de toute façon pas d'effet, le matériel acheté n'entrant en service qu'au trimestre suivant. La décision se prend donc sur le papier ; à l'écran, l'équipe saisit son budget d'entretien et sa surface. Annoncez la présentation à la séance précédente et remettez la grille aux équipes : quatre minutes de présentation et deux minutes de questions par équipe, un ordre tiré au sort, un jury où siège un élève d'une autre équipe. Depuis la page de la partie, préparez l'export du relevé au format tableur : il contient les six tours de chaque équipe dès la clôture du dernier.",
      deroule: [
        {
          minutes: 20,
          titre: "Le dernier tour",
          detail:
            "Chaque équipe pose sa conclusion sur la nacelle, achat ou location, avec le calcul fait à la maison et la condition qui le ferait changer, répond à la situation, puis saisit ses décisions du sixième trimestre avec tout ce qu'elle sait. Vous clôturez le dernier tour : le classement final tombe.",
        },
        {
          minutes: 10,
          titre: "Clôture et relevé",
          detail:
            "Chaque équipe reçoit le relevé exporté et vérifie qu'il est complet : les six tours sont là, les totaux se recoupent. Un tableau qu'on n'a pas contrôlé ne se commente pas.",
        },
        {
          minutes: 30,
          titre: "Le rapport au dirigeant",
          detail:
            "Une page de tableau de bord, quatre indicateurs au maximum, dont le prix moyen au mètre carré et le besoin en fonds de roulement en jours, et deux préconisations chiffrées pour l'année suivante, la nacelle comprise. La séance en pose la structure et l'essentiel ; la mise au propre se termine hors classe.",
        },
        {
          minutes: 40,
          titre: "Présentations",
          detail:
            "Passage des équipes devant le jury, dans l'ordre tiré. Les questions portent d'abord sur les préconisations, et une est obligatoire : montrez-nous le trimestre où la caisse a décroché, et dites pourquoi.",
        },
        {
          minutes: 20,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement puis vous l'écartez : ce qui se note est le rapport et sa présentation. Chaque élève rédige les phrases qui iront dans son dossier professionnel, et vous reprenez ce que le classement ne dit pas : l'équipe la mieux classée n'est pas toujours celle qui a le mieux raisonné.",
        },
      ],
      livrable:
        "Le rapport au dirigeant : le tableau de bord des six trimestres sur une page, la décision prise sur la nacelle avec le calcul qui la porte, deux préconisations chiffrées pour l'année suivante, et la présentation orale de quatre minutes.",
      tracePasseport:
        "J'ai rendu compte de six trimestres de gestion d'une entreprise de rénovation devant un dirigeant, tableau de bord et préconisations chiffrées à l'appui.",
      evaluation: [
        "La décision sur la nacelle ne compare que les flux que l'achat change, l'amortissement n'en est pas un.",
        "Le tableau de bord tient sur une page, se lit sans commentaire et porte les indicateurs du métier.",
        "Les préconisations sont chiffrées et rattachées à un bloc du référentiel.",
        "L'oral assume au moins une erreur de gestion et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Sept séances hebdomadaires",
      quand: "Le format d'origine, sur sept semaines consécutives, deux heures par semaine.",
      comment:
        "Une séance par semaine, un trimestre par séance après l'essai. L'intervalle sert : chaque séance demande un relevé ou un calcul fait à la maison, et c'est lui qui permet de tenir en deux heures sans serrer la phase de jeu.",
    },
    {
      nom: "Trois journées banalisées",
      quand: "Quand l'emploi du temps donne des blocs de quatre ou six heures.",
      comment:
        "Deux ou trois séances par journée, avec une pause franche entre deux et le travail « à la maison » fait pendant la pause. Gardez la séance du budget de trésorerie en début de journée : elle demande un tableur que la fatigue abîme.",
    },
    {
      nom: "Fil rouge sur l'année",
      quand: "Quand l'atelier accompagne les blocs du référentiel dans l'ordre du cours.",
      comment:
        "Une séance toutes les trois ou quatre semaines, placée juste après le cours qui donne l'outil : le seuil vient d'être vu, la deuxième séance le fait servir ; le budget de trésorerie vient d'être vu, la cinquième le fait dater. La partie ne se joue qu'en séance, et les six tours attendent entre deux.",
    },
  ],
  evaluationFinale: [
    "Les six notes intermédiaires, une par séance jouée, notées sur les critères annoncés au début de chaque séance, pour la moitié de la note.",
    "Le rapport au dirigeant et sa présentation orale, pour l'autre moitié : c'est le document qui rassemble tout.",
    "La fiche d'identité de la première séance se lit et se corrige, mais ne se note pas : rien de ce qui se joue pendant l'essai ne compte, et le document qui l'accompagne non plus.",
    "La note pédagogique que la plateforme calcule pour chaque équipe, diagnostics justes, modèles d'analyse bien choisis, questions de connaissances, éclaire le raisonnement que les livrables ne montrent pas toujours.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur rapport.",
  ],
  prolongements: [
    "En deuxième année, passer sur ATLAS CONSEIL au niveau Arbitrage, avec l'atelier qui lui est consacré : l'emprunt, l'assurance et l'investissement, chiffrés ici sur le papier, y deviennent des décisions du trimestre.",
    "Rejouer les six trimestres de MARTEL & FILS un cran plus haut, en deuxième année : le niveau Arbitrage ouvre l'assurance et l'achat de l'engin que les cinquième et septième séances chiffrent sur le papier, et la fiche dit sous « Adapter le niveau » ce que ce cran change.",
    "Rejouer avec le monde variable activé, pour que les équipes éprouvent la différence entre une bonne décision et un bon résultat sur un marché qu'elles ne connaissent pas d'avance.",
  ],
  faq: [
    {
      question: "Pourquoi le bâtiment, plutôt que le cabinet de conseil, pour une première année ?",
      reponse:
        "Parce que c'est le secteur type du diplôme, et le seul du registre où l'argent sort des mois avant de rentrer. Le cabinet de conseil vend du temps et n'a pas de stock ; l'entreprise de rénovation a des chantiers commencés qui dorment au bilan, trois clientèles à trois délais, un négoce à payer et des compagnons que l'intempérie ne met pas au chômage. Les gestes de première année, le devis, le délai, le compagnon de plus, y ont chacun leur trimestre. Le cabinet attend la deuxième année, avec l'assurance, l'emprunt et l'investissement que son niveau ouvre.",
    },
    {
      question: "À quoi sert le tour d'essai, et que se passe-t-il s'il tourne mal ?",
      reponse:
        "À ce qu'une équipe ne perde pas la partie sur une erreur de prise en main : un zéro de trop dans la surface, un prix tapé en centimes. L'essai se joue avec les mêmes écrans, les mêmes équipes et les mêmes codes ; quand vous commencez la vraie partie, toutes les entreprises repartent de l'état initial, et l'essai reste lisible de votre côté pour le débriefing. Un essai raté est un bon essai : c'est exactement ce qu'il est fait pour absorber. Le geste est irréversible, et il vous demande confirmation.",
    },
    {
      question: "Deux heures suffisent-elles pour une séance qui joue un tour ?",
      reponse:
        "Oui, à une condition que la fiche écrit dans chaque préparation : le relevé ou le calcul long se fait entre deux séances, à partir des écrans de la partie, qui restent consultables. Le classement des charges arrive fait, les trois lignes du bilan arrivent relevées, le budget du cockpit arrive daté, le calcul de la nacelle arrive posé. La phase de jeu garde le temps que le modèle de durée de la plateforme estime, et un quart de plus ; la fiche affiche les deux chiffres sous chaque séance.",
    },
    {
      question: "Que faire si la situation du troisième trimestre ne s'ouvre pas ?",
      reponse:
        "C'est le cas le plus probable, et la quatrième séance est écrite pour cela. La situation ne s'ouvre que pour une équipe dont le trimestre précédent s'est clos avec un résultat positif et une trésorerie nette négative ; sur les trajectoires types, les créances d'ouverture rentrent dès le premier trimestre et la caisse ne descend pas sous zéro. La leçon ne dépend pas d'elle : le besoin en fonds de roulement se lit dans le bilan de chaque équipe, et l'écart entre le résultat et la trésorerie se constate sur le tableau de flux. Si elle s'ouvre chez une équipe, cette équipe la lit à la classe.",
    },
    {
      question: "Le niveau Pilotage ne permet ni de s'assurer ni d'acheter la nacelle : les séances qui en parlent ont-elles un support ?",
      reponse:
        "Elles en ont un, et il est dit : les trois formules de couverture du scénario et le prix de la nacelle se lisent et se chiffrent sur le papier, comme un assistant de gestion le ferait avant que le dirigeant ne tranche, et ce que la simulation joue à ces séances, c'est le choix du fournisseur et son risque de livraison, le budget d'entretien et la surface. Ouvrir ces leviers demanderait le niveau Arbitrage, qui n'est pas celui d'une première année, et l'achat au dernier trimestre n'aurait de toute façon aucun effet visible. Le bloc « Adapter le niveau » de cette fiche dit ce qu'un cran de plus change, séance par séance.",
    },
    {
      question: "Les quatre blocs sont-ils réellement couverts ?",
      reponse:
        "Le bloc 1 tient cinq séances, du devis au poste clients, et le bloc 4 quatre, du seuil au rapport. Le bloc 2 tient trois séances, le poste clients, le budget de trésorerie et les risques, puis le rapport. Le bloc 3 n'en tient qu'une, la décision d'embauche, et la fiche le dit plutôt que de le laisser croire : le personnel d'une PME du bâtiment, côté paie et droit du travail, n'est pas la matière d'un jeu de gestion, et la deuxième année y revient avec le cabinet de conseil.",
    },
    {
      question: "Quelles épreuves du BTS cet atelier prépare-t-il ?",
      reponse:
        "E4, gérer la relation avec les clients et les fournisseurs de la PME, épreuve orale, pour le devis de la troisième séance et le poste clients de la quatrième ; E5, épreuve écrite sur les risques et le personnel, pour le budget de trésorerie, la cartographie des risques et la décision d'embauche ; E6, soutenir le fonctionnement et le développement de la PME, dossier et soutenance, pour le rapport au dirigeant de la dernière séance. Vérifiez les intitulés sur le référentiel en vigueur.",
    },
  ],
};
