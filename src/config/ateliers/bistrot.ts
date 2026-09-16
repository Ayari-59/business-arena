import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS MHR, options B et C, deuxième année.
 *
 * Cinq séances de trois heures sur LA TABLE D'AUGUSTIN, le bistrot de
 * soixante-dix couverts, joué en gamme : la formule du midi, la carte du soir,
 * les banquets, et un traiteur à bâtir. Le secteur a été retenu parce qu'il
 * fait ce qu'aucun autre ne fait : ce qui est préparé et non servi part à la
 * poubelle le soir même, le ratio matières se lit à chaque service, et la
 * même brigade sert des offres qui ne lui prennent pas le même temps.
 *
 * L'atelier de l'hôtel, en première année, se joue sur le tarif, le
 * remplissage et la caisse. Celui-ci ouvre la structure : la brigade
 * s'embauche, la cuisine s'équipe, le traiteur se finance, et c'est le mix des
 * offres qui décide de la contrainte qui bloque.
 *
 * Le référentiel du BTS MHR n'a pas encore été confronté à son texte : le code
 * figure dans REFERENTIELS_NON_VERIFIES, comme celui de l'atelier de l'hôtel.
 */
export const ATELIER_BISTROT: AtelierDefinition = {
  code: "bistrot",
  titre: "Composer la carte et tenir le service",
  diplome: "BTS Management en hôtellerie-restauration, options B et C",
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "dossier professionnel",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Cinq séances de trois heures. Chaque équipe dirige le même bistrot d'un trimestre à l'autre, calcule son ratio matières offre par offre, choisit ses fournisseurs, répercute une hausse des denrées sans vider la salle, arbitre la saison des banquets avec une brigade qui ne s'étire pas, et rend à chaque séance un document d'exploitation.",
  resume:
    "Quatre trimestres à la tête d'un bistrot en quatre offres, du ratio matières par service au tableau de bord d'exploitation, avec la saison des banquets comme épreuve.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "5 séances de 3 h",
  pourquoi:
    "Le ratio matières s'apprend au tableau, à vingt-huit pour cent, et personne ne sait ce qu'il se passe quand il dérive de deux points. Ici l'équipe fixe ses couverts à préparer avant de savoir combien de clients viendront, jette le soir même ce qu'elle a préparé de trop, et lit au trimestre suivant ce que deux points de ratio ont fait à son résultat. La brigade cesse d'être une charge sur un tableau : un banquet prend moins d'heures par couvert qu'une carte du soir, et l'équipe qui a rempli sa salle de la mauvaise offre découvre que ce ne sont pas les places qui manquaient, mais les bras. La carte devient une décision de gestion, pas une affaire de goût.",
  reglages: {
    scenarioCode: "bistrot-gamme",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 4,
    niveauNom: "Arbitrage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 4,
    effectifParEquipe: "trois élèves",
    notes:
      "LA TABLE D'AUGUSTIN se joue ici en quatre offres, qui partagent la même cuisine de 9 000 couverts par trimestre et la même brigade de dix personnes, soit 4 550 heures : la formule du midi, la carte du soir, les banquets réglés à trente jours, et une activité traiteur qui demande 18 000 € de développement avant le premier buffet. Ce qui est préparé et non servi est perdu le soir même. Le niveau retenu ouvre la trésorerie, l'assurance, l'embauche de la brigade, l'équipement de la cuisine, la R&D du traiteur et l'engagement RSE : en deuxième année, la direction d'une unité de restauration se joue sur la structure autant que sur la carte. Le monde variable est décoché pour que toutes vos classes travaillent le même exercice ; les aléas restent tirés, plus souvent à ce niveau, et se lisent dans le journal du tour.",
  },
  seances: [
    {
      numero: 1,
      titre: "Le ratio matières, offre par offre",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Bloc 2 · Analyser les coûts et la performance pour décider",
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
      ],
      objectif:
        "Calculer le coût des denrées et la marge de chaque offre de la carte, en tirer le nombre de couverts qui couvre les charges de structure au mix prévu, et fixer les couverts à préparer en sachant que le surplus part à la poubelle.",
      competences: [
        "Je calcule le ratio matières de chaque offre et je le situe par rapport à ce que vise la profession.",
        "Je calcule la marge sur coût variable d'un couvert, offre par offre, et le seuil de rentabilité de l'établissement au mix que je prévois.",
        "Je fixe des couverts à préparer en pesant le client refusé contre la denrée jetée.",
      ],
      notions: [
        "ratio matières",
        "coût de revient d'un couvert",
        "marge sur coût variable",
        "seuil de rentabilité",
        "denrées périssables et invendus",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois : une responsable de la carte et des prix, une de la cuisine et de la brigade, une du suivi financier. Imprimez la fiche de ratio matières vierge, une par équipe, avec une colonne par offre. Les denrées coûtent 7,50 € sur une formule du midi vendue autour de 27 €, 12 € sur une carte du soir autour de 38 €, 10 € sur un banquet autour de 33 € : la profession vise un ratio de 28 à 32 %, et les équipes doivent le retrouver elles-mêmes. Les charges de structure font 90 000 € par trimestre, brigade comprise, plus 6 000 € d'amortissements ; le seuil se situe près de 4 400 couverts au mix habituel. Prévoyez que cette première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : cinq séances, quatre trimestres, un seul bistrot, et un document d'exploitation rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 35,
          titre: "Lire la carte en coûts",
          detail:
            "Chaque équipe relève, pour chaque offre, ce que coûtent les denrées et les autres frais variables, et ce que coûte un trimestre d'exploitation que la salle soit pleine ou vide. Les charges de structure sont communes aux offres : personne ne les ventile encore.",
        },
        {
          minutes: 35,
          titre: "Du ratio à la marge",
          detail:
            "L'équipe calcule le ratio matières et la marge sur coût variable de chaque offre, puis le nombre de couverts qui couvre la structure au mix qu'elle prévoit : la même structure s'absorbe avec moins de cartes du soir que de formules du midi. Vous circulez sans corriger : une équipe qui oublie une charge dans son coût le découvrira dans son résultat.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose au premier trimestre un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit ses couverts à préparer et son prix par offre, en sachant que le surplus sera jeté le soir même.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, son ratio matières réalisé, ses denrées perdues et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur fiche et la confrontent à leur résultat réel. Vous affichez côte à côte le ratio matières prévu et le ratio réalisé de chacune : la différence, c'est ce qui a été jeté.",
        },
      ],
      livrable:
        "La fiche de ratio matières, une page : le coût des denrées et le ratio matières de chaque offre, la marge sur coût variable par couvert, le nombre de couverts au seuil au mix prévu, les couverts à préparer avec leur justification, et le positionnement retenu.",
      tracePasseport:
        "J'ai tiré la marge de chaque offre d'une carte et le seuil de rentabilité d'un établissement du ratio matières que j'avais calculé offre par offre.",
      evaluation: [
        "Le ratio matières est calculé offre par offre et situé par rapport à la profession, pas donné en bloc.",
        "Le seuil est exprimé en couverts à servir au mix prévu, pas seulement en euros.",
        "Les couverts à préparer sont justifiés par le coût de la denrée jetée autant que par le client refusé.",
      ],
    },
    {
      numero: 2,
      titre: "Le cash & carry ou le maraîcher",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
        "Bloc 3 · Gérer l'offre commerciale et la relation client",
      ],
      objectif:
        "Choisir un fournisseur de denrées en tenant ensemble son prix, la qualité perçue qu'il fait à la carte, son délai de règlement et son risque de rupture, et décider si l'activité traiteur se finance dès maintenant.",
      competences: [
        "Je compare des fournisseurs sur plusieurs critères, prix, qualité, délai et fiabilité, et je pondère.",
        "Je relie la qualité des denrées à la fréquentation de la carte du soir, par la réputation qu'elle construit.",
        "Je mesure ce qu'un paiement comptant fait à la trésorerie d'un établissement dont le résultat ne change pas.",
      ],
      notions: [
        "choix multicritère d'un fournisseur",
        "qualité perçue et réputation",
        "délai de règlement fournisseur",
        "besoin en fonds de roulement",
        "investissement à horizon",
      ],
      preparation:
        "Relisez les trois fournisseurs du jeu avec leurs chiffres : le grossiste au prix de référence, réglé à vingt et un jours ; le cash & carry à 14 % de moins, payé comptant, qui abaisse la qualité perçue et tombe en rupture une fois sur dix ; les producteurs en circuit court à 20 % de plus, réglés à quinze jours, qui relèvent la qualité et rassurent. La réputation du bistrot bouge vite : un changement de denrées se lit dès le trimestre suivant sur la fréquentation du soir, la clientèle la plus sensible à la qualité. C'est aussi le premier trimestre où le traiteur peut se financer, 18 000 € de développement avant de vendre le moindre buffet. Préparez une matrice multicritère vierge et un tableau où chaque équipe inscrira le solde de trésorerie qu'elle prévoit.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le premier trimestre",
          detail:
            "Chaque équipe confronte sa fiche de ratio à son résultat, en une phrase, et dit combien de couverts elle a jetés.",
        },
        {
          minutes: 40,
          titre: "Trois fournisseurs, quatre critères",
          detail:
            "Les équipes remplissent la matrice : prix, qualité, délai, fiabilité, pondérés par ce qui compte pour leur carte. Le cash & carry fait gagner 1,40 € par couvert, soit près de 8 400 € par trimestre à 6 000 couverts, et fait perdre des dîners qu'on ne voit pas tout de suite. La séance tient dans cet écart de temps.",
        },
        {
          minutes: 30,
          titre: "Payer comptant, et le traiteur",
          detail:
            "Chaque équipe chiffre ce que le passage au comptant fait à sa trésorerie, à résultat inchangé : c'est le besoin en fonds de roulement qui monte, pas la marge qui baisse. Puis elle décide si elle engage les 18 000 € du traiteur, une dépense d'aujourd'hui pour des buffets qui ne se vendront qu'une fois l'activité prête.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son fournisseur, ses couverts, ses prix, son budget de développement et, si elle en a besoin, sa couverture de trésorerie, puis écrit le solde qu'elle attend.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le solde de trésorerie réalisé apparaît à côté du solde prévu, et le ratio matières de chaque équipe porte la marque de son fournisseur.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe passée au cash & carry et une équipe passée au circuit court, sur le résultat et sur la trésorerie. La fréquentation du soir n'a pas encore bougé : vous l'annoncez, et vous donnez rendez-vous à la séance suivante.",
        },
      ],
      livrable:
        "La note fournisseur : la matrice multicritère pondérée avec le fournisseur retenu, l'effet attendu sur le ratio matières et sur la qualité perçue, l'effet du délai de règlement sur la trésorerie du trimestre, la décision prise sur le traiteur, et l'écart au solde de trésorerie réalisé.",
      tracePasseport:
        "J'ai choisi un fournisseur de denrées sur une matrice multicritère, en chiffrant ce que son délai de règlement faisait à la trésorerie.",
      evaluation: [
        "La matrice pondère les critères selon la carte de l'établissement, pas à parts égales par défaut.",
        "L'effet du paiement comptant sur la trésorerie est chiffré, à résultat inchangé.",
        "La décision sur le traiteur est datée : ce qu'elle coûte maintenant, et quand elle rapportera.",
      ],
    },
    {
      numero: 3,
      titre: "Le beurre a pris 24 %",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Bloc 3 · Gérer l'offre commerciale et la relation client",
        "Bloc 2 · Analyser les coûts et la performance pour décider",
      ],
      objectif:
        "Répercuter une hausse des denrées offre par offre selon la sensibilité au prix de chaque clientèle, retravailler la carte plutôt que monter tous les prix, et préparer la saison des banquets en embauchant et en équipant maintenant ce qui ne servira qu'au trimestre suivant.",
      competences: [
        "Je mesure ce qu'une hausse des denrées fait au ratio matières, à la marge par couvert et au seuil de l'établissement.",
        "Je répercute une hausse de coût différemment selon l'élasticité de chaque clientèle, et je retravaille la carte quand le prix ne suffit pas.",
        "Je dimensionne une brigade et une cuisine pour une saison que je ne verrai qu'au trimestre suivant.",
      ],
      notions: [
        "élasticité de la demande au prix",
        "répercussion d'une hausse de coût",
        "ingénierie de carte",
        "saisonnalité de la fréquentation",
        "recrutement de la brigade et délai de mise en service",
      ],
      preparation:
        "Le scénario fait bondir le coût des denrées de 24 % ce trimestre, et la hausse dure deux trimestres : annoncez-la en ouverture, elle pèse sur chaque assiette de la saison des banquets aussi. Les clientèles n'ont pas la même sensibilité au prix : les déjeuners d'affaires partent vite si le midi augmente, les dîneurs du soir tiennent mieux, les gourmets mieux encore. Répercuter la hausse à l'euro près demande environ 1,80 € de plus sur la formule, 2,90 € sur la carte du soir, 2,40 € sur un banquet, et la troisième issue est de déplacer le mix vers les offres qui la supportent. Ce trimestre est aussi celui d'août : le midi tombe à 70 % de son niveau, les banquets à 55 %. Enfin, la saison des banquets arrive au trimestre suivant, et tout ce qui s'y prépare se décide maintenant : une embauche coûte 2 000 € et n'arrive qu'au trimestre suivant, dans la limite de trois par trimestre et de dix-huit salariés ; une cuisine traditionnelle à 15 000 € ajoute 1 500 couverts de capacité, une semi-professionnelle à 36 000 € en ajoute 3 000, toutes deux en service au trimestre suivant. Préparez une grille à trois colonnes, répercuter, retravailler la carte, préparer la saison.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe lit ce que son fournisseur a fait à sa fréquentation du soir, annoncée à la séance précédente, et relève son ratio matières avant la hausse.",
        },
        {
          minutes: 40,
          titre: "Répercuter ou retravailler la carte",
          detail:
            "Les équipes chiffrent ce que la hausse retire à la marge par couvert et ce qu'elle fait au seuil, puis décident offre par offre : répercuter au soir qui suivra, moins au midi qui partirait, ou changer la carte pour vendre davantage ce qui supporte la hausse. Une hausse uniforme est la réponse facile, et la séance est faite pour la refuser.",
        },
        {
          minutes: 30,
          titre: "Préparer une saison qu'on ne voit pas encore",
          detail:
            "Chaque équipe remplit la troisième colonne : les embauches et l'équipement de cuisine qu'elle engage pour la saison des banquets, qui n'est pas ce trimestre. Elle écrit à quelle condition son choix reste bon si la saison déçoit, et ce qu'il lui coûte dès maintenant en pleine baisse d'août.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête ses prix par offre, ses couverts à préparer pour un mois d'août creux, ses embauches et son équipement, et inscrit la capacité de brigade qu'elle attend au trimestre suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. La répercussion se lit tout de suite dans le ticket moyen et les couverts par offre. Les embauches et la cuisine, elles, ne se lisent encore que dans la trésorerie : la capacité arrive au trimestre suivant.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a répercuté uniformément et une équipe qui a retravaillé sa carte, puis celles qui ont préparé la saison et celles qui attendent de la voir. La question qui reste ouverte : peut-on décider d'une brigade pour une saison qu'on ne connaît pas encore.",
        },
      ],
      livrable:
        "La note de carte : l'effet de la hausse sur le ratio matières et sur le seuil, la répercussion retenue par offre avec sa justification par l'élasticité de chaque clientèle, les changements de carte décidés, les embauches et l'équipement engagés pour la saison, et la condition qui les rend bons si elle déçoit.",
      tracePasseport:
        "J'ai répercuté une hausse des denrées offre par offre selon l'élasticité de chaque clientèle, en préparant une brigade pour une saison que je ne voyais pas encore.",
      evaluation: [
        "La répercussion diffère par offre et se justifie par la sensibilité au prix de chaque clientèle.",
        "La carte est retravaillée, pas seulement renchérie.",
        "Les embauches et l'équipement sont décidés pour le trimestre suivant, en le disant et en le chiffrant.",
      ],
    },
    {
      numero: 4,
      titre: "La saison des banquets",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
        "Bloc 3 · Gérer l'offre commerciale et la relation client",
      ],
      objectif:
        "Servir le trimestre où les banquets font plus que doubler avec une cuisine et une brigade qui ne s'étirent pas : choisir le mix qui rapporte le plus par heure de brigade, préparer juste, et tenir une trésorerie que les banquets réglés à trente jours ne remplissent pas tout de suite.",
      competences: [
        "Je repère laquelle des deux capacités bloque, les places ou les heures de brigade, selon le mix que je sers.",
        "J'arbitre entre des offres qui n'ont ni la même marge ni le même temps de brigade par couvert, quand tout ne peut pas être servi.",
        "Je relie le mix servi à la trésorerie du trimestre : les banquets se règlent à trente jours, le midi et le soir comptant.",
      ],
      notions: [
        "capacité et goulot d'étranglement",
        "marge par heure de brigade",
        "saisonnalité de la demande",
        "délai de règlement client",
        "sur-préparation et denrées perdues",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer la totalité du temps annoncé. Les banquets sont à 160 % de leur niveau ce trimestre et les associations à 150 %, le midi et le soir montent aussi. La cuisine sort 9 000 couverts par trimestre ; la brigade de dix personnes fait 4 550 heures, et une carte du soir lui prend 0,6 heure par couvert, un banquet 0,45, une formule du midi 0,4 : selon le mix, ce sont les places ou les heures qui manquent en premier, et une équipe qui a embauché à la séance précédente ne bute pas au même endroit. Sur-préparer coûte deux fois, la denrée jetée et la marge perdue, et refuser un banquet coûte la marge de tout un service. Les banquets se règlent à trente jours, le traiteur à quarante-cinq et soixante : un trimestre plein peut finir à découvert. Préparez la fiche de plan de saison, où l'équipe écrira son mix, ses couverts et son solde de trésorerie attendus AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit la saison",
          detail:
            "Vous rappelez sans donner de chiffre que le trimestre qui s'ouvre n'est pas un trimestre ordinaire. Les équipes retrouvent seules, dans les informations du jeu, l'ampleur de la saison et la capacité de brigade qu'elles ont réellement reçue.",
        },
        {
          minutes: 40,
          titre: "Les places ou les bras",
          detail:
            "Chaque équipe additionne ce que son mix demande en couverts et en heures de brigade, et trouve laquelle des deux capacités bloque. Elle classe ensuite ses offres par marge rapportée à l'heure de brigade, et sert d'abord celle qui rapporte le plus par heure, jusqu'à épuiser sa demande.",
        },
        {
          minutes: 30,
          titre: "Préparer juste, encaisser tard",
          detail:
            "L'équipe fixe ses couverts à préparer par offre en chiffrant les deux fautes, la denrée jetée et le banquet refusé, puis projette sa trésorerie : un trimestre record en banquets encaisse à trente jours ce qu'il a payé comptant en denrées. La commande exceptionnelle, quand elle tombe, est le vrai arbitrage : une saison de mariages à 46 € réglée à trente jours, ou une cantine d'entreprise à 21 € qui remplit le midi sans marge.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des couverts par offre, des prix et de la couverture de trésorerie. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre de la saison. Le taux de remplissage, les denrées perdues et le solde de trésorerie de chaque équipe apparaissent à côté de ce qu'elle avait prévu.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. La question finale : celle qui a servi le plus de couverts est-elle celle qui a le mieux gagné, et celle qui a le mieux gagné a-t-elle encore de la caisse.",
        },
      ],
      livrable:
        "La fiche de plan de saison : la capacité qui bloque selon le mix, le classement des offres par marge à l'heure de brigade, les couverts à préparer par offre avec les deux fautes chiffrées, le solde de trésorerie prévu avec les délais de règlement, et l'écart constaté après clôture.",
      tracePasseport:
        "J'ai arbitré le mix d'un établissement en saison en classant ses offres par marge rapportée à l'heure de brigade, la capacité qui bloquait étant celle-là.",
      evaluation: [
        "La capacité qui bloque est identifiée par le calcul, places et heures de brigade, pas supposée.",
        "Le mix servi est justifié par la marge à l'heure de brigade, pas par le prix affiché.",
        "Le solde de trésorerie prévu tient compte des délais de règlement des banquets.",
      ],
    },
    {
      numero: 5,
      titre: "Rendre compte de son exploitation",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Bloc 2 · Analyser les coûts et la performance pour décider",
        "Bloc 4 · Rendre compte et manager l'équipe",
      ],
      objectif:
        "Construire le tableau de bord d'exploitation des quatre trimestres et le présenter oralement, comme on rend compte à un propriétaire d'établissement.",
      competences: [
        "Je construis un tableau de bord d'exploitation qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent mon résultat, ratio matières, ticket moyen, taux de remplissage, et j'écarte ceux qui l'habillent.",
        "Je présente oralement quatre trimestres d'exploitation, leurs réussites et leurs erreurs, devant un jury.",
      ],
      notions: [
        "tableau de bord d'exploitation",
        "ratio matières et ticket moyen",
        "taux de remplissage et capacité",
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
            "Les équipes reprennent les quatre trimestres depuis leur espace et construisent leur tableau de bord. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié, et le ratio matières trimestre par trimestre y figure obligatoirement.",
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
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le tableau de bord et l'oral. Chaque élève écrit les trois phrases de son dossier professionnel.",
        },
      ],
      livrable:
        "Le tableau de bord d'exploitation des quatre trimestres : une page, quatre indicateurs justifiés dont le ratio matières, le trimestre le mieux et le moins bien géré avec leurs raisons, et la présentation orale de huit minutes qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord d'exploitation d'un bistrot sur quatre trimestres et je l'ai présenté oralement devant un jury.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Chaque indicateur retenu est justifié par ce qu'il explique du résultat.",
        "L'oral assume au moins une erreur d'exploitation et dit ce qui serait fait autrement.",
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
        "Une séance par jour du lundi au vendredi. Le rythme est plus tendu et le débriefing plus court, mais la mémoire des trimestres est meilleure, et la présentation du vendredi gagne en tenue.",
    },
    {
      nom: "Fil rouge du semestre",
      quand: "Quand l'atelier accompagne le cours de gestion appliquée ou de management d'unité.",
      comment:
        "Une séance toutes les trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions à la maison.",
    },
  ],
  evaluationFinale: [
    "Les quatre livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord d'exploitation de la dernière séance, pour un quart.",
    "La présentation orale et les réponses aux questions du jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur tableau de bord.",
  ],
  prolongements: [
    "Rejouer les mêmes quatre trimestres avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Créer la partie sur six tours dès le départ et garder les deux derniers pour deux séances de prolongement : la terrasse sous verrière à 48 000 € du cinquième trimestre, décidée par la valeur actuelle nette, puis la rentabilité des capitaux engagés au sixième.",
    "Basculer sur le secteur de l'hôtellerie, joué en première année sur un déroulé voisin, pour opposer un hôtel qui vend des nuitées et un bistrot qui jette ses invendus le soir même.",
  ],
  faq: [
    {
      question: "Pourquoi jouer en quatre offres plutôt qu'avec un seul ticket moyen ?",
      reponse:
        "Parce que c'est le métier. Un ticket moyen unique cache ce que la carte décide : la formule du midi ne prend pas le même temps de brigade que la carte du soir, ni la même marge, ni le même délai de règlement qu'un banquet. Le niveau retenu fait jouer la gamme ; un niveau en dessous ferait jouer le bistrot en un seul ticket, avec la trésorerie et l'assurance ouvertes mais sans la brigade ni la cuisine à décider. C'est le réglage de la première année, pas celui-ci.",
    },
    {
      question: "Pourquoi arrêter à quatre trimestres alors que le secteur en compte six ?",
      reponse:
        "Parce que la saison des banquets est le point culminant de ce secteur et que rien ne gagne à la dépasser dans un atelier de cinq séances. La partie est créée sur quatre tours et s'arrête là. Si votre progression le permet, créez-la sur six tours dès le départ et gardez les deux derniers pour deux séances de prolongement, la terrasse et la rentabilité des capitaux comme fils.",
    },
    {
      question: "Le traiteur est-il obligatoire ?",
      reponse:
        "Non, et c'est le point. L'activité traiteur demande 18 000 € de développement avant de vendre le moindre buffet, ne connaît ni la taille de la salle ni les congés de la clientèle, et se règle à quarante-cinq et soixante jours. Une équipe qui l'engage au deuxième trimestre en pleine tension de trésorerie apprend ce qu'est un investissement à horizon ; une équipe qui s'en passe apprend ce qu'elle a laissé aux autres. Les deux font une bonne séance de débriefing.",
    },
    {
      question: "Le référentiel du BTS MHR est-il repris au mot dans les intitulés de blocs ?",
      reponse:
        "Pas encore. Les blocs cités sont ceux de l'atelier de l'hôtel, fidèles à l'activité de management mais non confrontés au texte de l'arrêté : le diplôme figure pour cette raison dans la liste des référentiels non vérifiés. Relisez-les avec votre référentiel sous les yeux, option B ou option C, et ajustez les intitulés avant un usage certificatif.",
    },
    {
      question: "Quel lien avec les épreuves du BTS ?",
      reponse:
        "Les épreuves diffèrent selon l'option, et le référentiel n'a pas encore été confronté à cette fiche : rapprochez chaque livrable de l'épreuve de votre option avant de l'annoncer aux étudiants. Le ratio matières offre par offre, le choix des fournisseurs et l'arbitrage de la brigade sont, en option B comme en option C, le cœur de ce que les épreuves de management d'unité demandent d'argumenter ; le tableau de bord et sa soutenance entraînent à rendre compte d'une exploitation.",
    },
    {
      question: "Peut-on conduire cet atelier avec des équipes de deux ?",
      reponse:
        "Oui, en fusionnant les rôles de la carte et de la cuisine. En dessous de trois élèves, la matrice fournisseur de la deuxième séance perd son débat contradictoire, alors prévoyez d'y faire travailler deux équipes ensemble sur cette séance-là uniquement.",
    },
  ],
};
