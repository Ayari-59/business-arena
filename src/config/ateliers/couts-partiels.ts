import type { AtelierDefinition } from "./types";

/**
 * ATELIER « COÛTS PARTIELS & DÉCISIONS » (BTS CG, deuxième année, processus 5).
 *
 * Le processus 5 s'enseigne d'ordinaire en exercices détachés : un tableau
 * différentiel ici, un écart là, un abandon de produit sur une feuille. Cet
 * atelier les remet dans une même entreprise, jouée quatre trimestres, et
 * confie les arbitrages multi-produits que le jeu mono-produit ne peut pas
 * mettre en scène à des SITUATIONS dédiées : décomposition d'un écart sur
 * mix, abandon d'une gamme, facteur rare, commande spéciale, faire ou
 * faire-faire. La partie fournit le réel et le contexte ; les situations
 * fournissent le cas de décision. Chaque séance laisse une trace écrite.
 */
export const ATELIER_COUTS_PARTIELS: AtelierDefinition = {
  code: "couts-partiels",
  titre: "Coûts partiels et décisions de gestion",
  diplome: "BTS Comptabilité et Gestion",
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "passeport professionnel",
  referentielLabel: "Processus",
  referentielAccord: "mobilisés",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même entreprise industrielle sur quatre trimestres, puis affronte, sur des cas dédiés, les décisions que tout gestionnaire prend en coûts partiels : abandonner une gamme, produire sous contrainte, accepter une commande à prix cassé, sous-traiter ou non.",
  resume:
    "Le processus 5 en situation : tableau différentiel, écarts, puis les quatre décisions de coûts partiels sur une entreprise industrielle dirigée quatre trimestres.",
  difficulte: 3,
  difficulteLabel: "Confirmé",
  format: "6 séances de 3 h",
  pourquoi:
    "Les coûts partiels s'apprennent presque toujours en exercices isolés, où le résultat est connu d'avance et où l'élève applique une formule sans jamais porter la décision. Ici l'équipe dirige d'abord une vraie entreprise industrielle : elle produit le réel sur lequel se calculent la marge sur coût variable, le seuil de rentabilité et les écarts. Puis, sur des cas construits pour cela, elle décide vraiment : garder ou arrêter une gamme, choisir quoi produire quand une machine sature, accepter ou refuser une commande à prix réduit, internaliser ou sous-traiter. Elle découvre alors ce qu'aucun corrigé ne transmet : que le coût de revient complet est un piège pour décider, et que la bonne décision se lit sur le coût que le choix fait varier.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 4,
    niveauNom: "Arbitrage",
    equipes: 4,
    bots: 2,
    tva: false,
    mondeVariable: false,
    quizMode: "Modèle d'analyse seul",
    tours: 4,
    effectifParEquipe: "trois élèves",
    notes:
      "NOVA porte une entreprise industrielle avec des charges variables et des charges fixes nettes, ce qui donne un tableau différentiel lisible et des écarts qui parlent. Le monde variable est ici DÉSACTIVÉ : au processus 5, on veut que l'écart s'explique par les décisions et non par un aléa, pour que la méthode reste au premier plan. Les questions de connaissances sont coupées, seul le choix du modèle d'analyse est demandé. Les quatre trimestres joués mènent au pic du quatrième, où la capacité sature : c'est le décor exact de la séance sur le facteur rare. Les deux dernières séances ne jouent pas de tour, elles travaillent des cas de décision sur le compagnon des situations de gestion.",
  },
  seances: [
    {
      numero: 1,
      titre: "Le tableau différentiel et le seuil de rentabilité",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: ["Analyse de l'activité et de la performance (P5)"],
      objectif:
        "Distinguer charges variables et charges fixes, bâtir la marge sur coût variable et déterminer le seuil de rentabilité de l'entreprise sur son premier trimestre.",
      competences: [
        "Je distingue les charges variables des charges fixes dans un compte de résultat.",
        "Je calcule une marge sur coût variable et son taux.",
        "Je détermine un seuil de rentabilité et le point mort correspondant.",
      ],
      notions: [
        "Charges variables et charges fixes",
        "Marge sur coût variable et taux de marge",
        "Point mort et seuil de rentabilité",
      ],
      preparation:
        "Créer la partie NOVA au niveau Arbitrage, quatre équipes, deux concurrents pilotés, monde variable désactivé. Imprimer le dossier élève et préparer au tableau un compte de résultat vierge en deux colonnes, variable et fixe, à remplir avec la classe.",
      deroule: [
        { minutes: 20, titre: "Le cadre", detail: "Vous présentez l'entreprise industrielle que chaque équipe va diriger, et la question qui traversera l'atelier : sur quel coût décide-t-on vraiment ?" },
        { minutes: 45, titre: "Variable ou fixe", detail: "La classe trie les charges du secteur en variables et fixes. Vous posez au tableau la définition qui tient : varie avec le volume, ou non." },
        { minutes: 40, titre: "Premier trimestre", detail: "Les équipes prennent leurs décisions et clôturent le premier tour. Chacune récupère son compte de résultat réel." },
        { minutes: 45, titre: "Le tableau différentiel", detail: "Chaque équipe reconstruit son résultat en marge sur coût variable, puis retranche ses charges fixes. Le taux de marge apparaît." },
        { minutes: 30, titre: "Le seuil", detail: "De la marge sur coût variable au seuil de rentabilité, puis au point mort. Chaque équipe situe son trimestre par rapport à son seuil." },
      ],
      livrable:
        "Le tableau différentiel du premier trimestre : chiffre d'affaires, coûts variables, marge sur coût variable et son taux, charges fixes, résultat, puis le seuil de rentabilité et le point mort de l'équipe.",
      tracePasseport:
        "J'ai bâti le tableau différentiel d'une entreprise et déterminé son seuil de rentabilité à partir de ses charges réelles.",
      evaluation: [
        "Le tri des charges en variables et fixes est justifié.",
        "La marge sur coût variable et son taux sont exacts.",
        "Le seuil de rentabilité est calculé et interprété par rapport au trimestre réalisé.",
      ],
    },
    {
      numero: 2,
      titre: "L'écart sur marge : volume et composition",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: ["Analyse des écarts (P5)"],
      objectif:
        "Comparer la marge prévue à la marge réalisée, nommer l'écart, puis décomposer un écart sur quantités en effet de volume global et effet de composition.",
      competences: [
        "Je compare une marge prévue à une marge réalisée et je nomme l'écart obtenu.",
        "Je décompose un écart sur quantités en écart de volume global et écart de composition.",
        "Je lis le sens favorable ou défavorable d'un écart et je l'explique.",
      ],
      notions: [
        "Écart sur marge",
        "Écart de volume global",
        "Écart de composition (mix)",
        "Sens favorable et défavorable",
      ],
      preparation:
        "Rouvrir la partie. Préparer la projection de la situation « Écart de composition et volume global » du compagnon des situations de gestion, réglée sur le mode Élève pour révéler le corrigé étape par étape.",
      deroule: [
        { minutes: 15, titre: "Retour sur le trimestre", detail: "Chaque équipe rappelle ce qu'elle avait prévu de vendre et de dégager, avant de découvrir le réalisé." },
        { minutes: 40, titre: "Deuxième trimestre", detail: "Les équipes jouent et clôturent le deuxième tour. On relève, pour chacune, la marge prévue et la marge réalisée." },
        { minutes: 45, titre: "L'écart sur marge", detail: "La classe calcule l'écart entre marge prévue et marge réalisée, et distingue ce qui tient au prix, au coût et aux quantités." },
        { minutes: 50, titre: "Le cas des trois gammes", detail: "Sur la situation projetée, un cas à trois gammes montre qu'un même écart sur quantités cache un effet de volume et un effet de composition. La classe décompose, chiffre le sens de chacun, et vérifie que les deux se recomposent." },
        { minutes: 30, titre: "Mise en commun", detail: "Chaque équipe écrit en une phrase l'origine de son écart de marge, sans l'attribuer à la chance." },
      ],
      livrable:
        "La fiche d'écart du trimestre : marge prévue, marge réalisée, écart total, et la décomposition d'un écart sur quantités en écart de volume global et écart de composition, chacun avec son sens.",
      tracePasseport:
        "J'ai analysé un écart sur marge et décomposé un écart sur quantités en effet de volume et effet de composition.",
      evaluation: [
        "L'écart sur marge est calculé et son signe correctement nommé.",
        "La décomposition volume et composition se recompose bien en l'écart sur quantités.",
        "L'origine de l'écart est expliquée en une phrase défendable.",
      ],
    },
    {
      numero: 3,
      titre: "Faut-il abandonner un produit ?",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: ["Coûts partiels et aide à la décision (P5)"],
      objectif:
        "Décider du maintien ou de l'abandon d'une gamme à partir de sa marge sur coût spécifique, en distinguant coûts spécifiques et coûts communs.",
      competences: [
        "Je distingue un coût fixe spécifique d'un coût fixe commun.",
        "Je calcule la marge sur coût spécifique d'un produit.",
        "Je décide du maintien d'une gamme sans me laisser piéger par le coût complet.",
      ],
      notions: [
        "Coût fixe spécifique",
        "Coût fixe commun",
        "Marge sur coût spécifique",
        "Piège du coût complet",
      ],
      preparation:
        "Rouvrir la partie. Préparer la projection de la situation « Faut-il abandonner ce produit ? » et un tableau vierge de résultat par produit, pour montrer d'abord la fausse piste avant la bonne.",
      deroule: [
        { minutes: 15, titre: "La tentation du coût complet", detail: "Vous montrez un résultat par produit où une gamme ressort déficitaire. La classe est invitée, à tort, à vouloir l'arrêter." },
        { minutes: 45, titre: "Troisième trimestre", detail: "Les équipes jouent et clôturent le troisième tour, puis relèvent leurs charges fixes et les séparent en spécifiques et communes." },
        { minutes: 45, titre: "La marge sur coût spécifique", detail: "Sur la situation projetée, la classe calcule, gamme par gamme, la marge sur coût spécifique, et voit que la clé de répartition des charges communes est arbitraire." },
        { minutes: 45, titre: "La décision", detail: "On simule l'abandon de la gamme réputée déficitaire : le résultat baisse. La règle se dégage, on abandonne seulement si la marge sur coût spécifique est négative." },
        { minutes: 30, titre: "Mise en commun", detail: "Chaque équipe formule la règle d'abandon avec ses propres mots et l'illustre sur un chiffre." },
      ],
      livrable:
        "La note de décision sur une gamme : marge sur coût spécifique de chaque produit, effet chiffré d'un abandon sur le résultat, et recommandation de maintien ou d'arrêt argumentée.",
      tracePasseport:
        "J'ai décidé du maintien d'un produit à partir de sa marge sur coût spécifique, en écartant le piège du coût complet.",
      evaluation: [
        "Les coûts spécifiques et communs sont correctement séparés.",
        "La marge sur coût spécifique est exacte pour chaque produit.",
        "La recommandation d'abandon ou de maintien est fondée sur le bon critère.",
      ],
    },
    {
      numero: 4,
      titre: "Produire sous contrainte : le facteur rare",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: ["Coûts partiels et aide à la décision (P5)"],
      objectif:
        "Arbitrer un programme de production quand une ressource sature, en classant les produits par marge sur coût variable par unité de facteur rare.",
      competences: [
        "Je repère la ressource qui limite la production.",
        "Je classe des produits par marge sur coût variable par unité de facteur rare.",
        "Je bâtis le programme de production qui maximise la marge sous contrainte.",
      ],
      notions: [
        "Facteur rare",
        "Goulot d'étranglement",
        "Marge par unité de facteur rare",
        "Programme de production optimal",
      ],
      preparation:
        "Rouvrir la partie sur le trimestre du pic, où la demande dépasse la capacité. Préparer la projection de la situation « Le choix sous facteur rare » avec un cas où le classement par marge unitaire et le classement par marge sur facteur rare divergent.",
      deroule: [
        { minutes: 15, titre: "La contrainte du pic", detail: "La demande du quatrième trimestre dépasse ce que la capacité permet de produire. Il va falloir arbitrer." },
        { minutes: 45, titre: "Quatrième trimestre", detail: "Les équipes jouent le tour de pointe et constatent les ventes perdues faute de capacité." },
        { minutes: 50, titre: "Classer par facteur rare", detail: "Sur la situation projetée, la classe compare le classement des produits par marge unitaire et par marge sur unité de facteur rare, et découvre que l'ordre change." },
        { minutes: 40, titre: "Le programme optimal", detail: "On alloue la capacité dans l'ordre de la marge par facteur rare, chaque produit jusqu'à sa demande, et on lit la marge totale obtenue." },
        { minutes: 30, titre: "Le coût du mauvais classement", detail: "On refait l'allocation en suivant la marge unitaire, et on chiffre la marge perdue par rapport au programme optimal." },
      ],
      livrable:
        "Le programme de production sous contrainte : marge sur unité de facteur rare de chaque produit, ordre de priorité, quantités retenues, marge totale du plan optimal et écart avec le plan naïf.",
      tracePasseport:
        "J'ai bâti un programme de production sous facteur rare en classant les produits par marge sur unité de ressource rare.",
      evaluation: [
        "La ressource limitante est correctement identifiée.",
        "Le classement par marge sur facteur rare est juste.",
        "Le programme retenu maximise la marge et l'écart avec le plan naïf est chiffré.",
      ],
    },
    {
      numero: 5,
      titre: "Décider ponctuellement : commande spéciale et sous-traitance",
      dureeMinutes: 180,
      tourJoue: null,
      processus: ["Coûts partiels et aide à la décision (P5)"],
      objectif:
        "Trancher une commande spéciale à prix réduit et un choix de faire ou faire-faire à partir des seuls coûts pertinents, coût d'opportunité compris.",
      competences: [
        "Je distingue un coût pertinent d'un coût déjà engagé.",
        "Je décide d'accepter ou de refuser une commande à prix réduit.",
        "Je compare le coût de faire au coût de faire-faire pour un composant.",
      ],
      notions: [
        "Coût pertinent",
        "Coût d'opportunité",
        "Prix plancher",
        "Coûts évitables",
      ],
      preparation:
        "Aucun tour n'est joué. Préparer la projection des deux situations « Accepter cette commande spéciale ? » et « Faire ou faire-faire ? », et un jeu de données proche de l'entreprise industrielle de la partie pour garder le fil.",
      deroule: [
        { minutes: 20, titre: "Deux offres sur la table", detail: "Vous posez les deux décisions du jour : un client propose une commande à prix cassé, un sous-traitant propose de fournir un composant." },
        { minutes: 50, titre: "La commande spéciale", detail: "Sur la première situation, la classe écarte le coût complet, isole les coûts pertinents, ajoute le coût d'opportunité si la capacité est saturée, et tranche." },
        { minutes: 50, titre: "Faire ou faire-faire", detail: "Sur la seconde situation, la classe compare le coût pertinent de produire au coût de sous-traiter, sans les charges fixes qui subsistent, et décide." },
        { minutes: 40, titre: "Le prix plancher", detail: "Pour chaque décision, la classe calcule le prix au-delà duquel la réponse s'inverse, et mesure la marge de négociation." },
        { minutes: 20, titre: "Synthèse des coûts pertinents", detail: "On dresse la liste, valable pour les deux cas, de ce qui entre dans la décision et de ce qui n'y entre pas." },
      ],
      livrable:
        "Les deux notes de décision : coûts pertinents de la commande spéciale, coût d'opportunité éventuel, gain net et prix plancher de la commande, coût de faire, coût de faire-faire et prix d'achat maximal acceptable de la sous-traitance.",
      tracePasseport:
        "J'ai tranché une commande à prix réduit et un choix de sous-traitance en ne retenant que les coûts pertinents.",
      evaluation: [
        "Les charges déjà engagées sont écartées de chaque décision.",
        "Le coût d'opportunité est pris en compte quand la capacité sature.",
        "Chaque décision est accompagnée de son prix plancher ou de son prix d'achat maximal.",
      ],
    },
    {
      numero: 6,
      titre: "Le dossier de décisions",
      dureeMinutes: 180,
      tourJoue: null,
      processus: ["Analyse et prévision de l'activité (P5)"],
      objectif:
        "Réunir les décisions du trimestre dans un dossier argumenté, chaque choix rattaché au bon coût partiel, et le présenter devant la classe.",
      competences: [
        "Je justifie chaque décision par le coût partiel qui la fonde.",
        "Je présente un dossier de décisions de gestion à l'oral.",
        "Je réponds à une objection sur le choix d'un coût pertinent.",
      ],
      notions: [
        "Coûts partiels",
        "Aide à la décision",
        "Argumentation chiffrée",
      ],
      preparation:
        "Aucun tour n'est joué. Préparer la trame du dossier attendu et l'ordre de passage des équipes. Prévoir de quoi projeter les tableaux de chaque équipe pendant sa présentation.",
      deroule: [
        { minutes: 30, titre: "Monter le dossier", detail: "Chaque équipe rassemble ses cinq décisions de l'atelier et choisit, pour chacune, le tableau qui la prouve." },
        { minutes: 90, titre: "Rédaction du dossier de décisions", detail: "Les équipes rédigent le dossier : pour chaque décision, le contexte, le coût partiel mobilisé, le calcul et la recommandation." },
        { minutes: 45, titre: "Soutenances des dossiers", detail: "Chaque équipe présente son dossier, puis répond aux objections de la classe et du professeur sur le choix des coûts retenus." },
        { minutes: 15, titre: "Clôture", detail: "Vous reprenez la ligne directrice de l'atelier : décider, c'est retenir le coût que le choix fait varier." },
      ],
      livrable:
        "Le dossier de décisions de l'équipe : les cinq décisions de l'atelier, chacune avec son contexte, le coût partiel mobilisé, le calcul et la recommandation, prêt à être soutenu.",
      tracePasseport:
        "J'ai réuni et soutenu un dossier de décisions de gestion, chaque choix rattaché au coût partiel qui le fonde.",
      evaluation: [
        "Chaque décision est rattachée au bon coût partiel.",
        "Les calculs présentés sont exacts et lisibles.",
        "Les objections reçoivent une réponse fondée sur les coûts pertinents.",
      ],
    },
  ],
  formats: [
    {
      nom: "Hebdomadaire",
      quand: "Une séance par semaine sur un trimestre scolaire",
      comment: "Une séance de trois heures par semaine. Le temps entre deux séances sert à finir la note de décision, qui est ramassée au début de la suivante.",
    },
    {
      nom: "Semaine bloquée",
      quand: "Une semaine d'atelier de professionnalisation",
      comment: "Deux séances par jour sur trois jours. Le dossier de décisions se rédige le dernier jour, à froid, avec le recul des quatre trimestres joués.",
    },
    {
      nom: "Fil rouge",
      quand: "En parallèle du cours de processus 5 sur l'année",
      comment: "Une séance ouverte au moment où le cours aborde chaque notion : tableau différentiel, écarts, puis coûts partiels, la partie servant d'application au fil du programme.",
    },
  ],
  evaluationFinale: [
    "Le dossier de décisions, noté sur l'exactitude des calculs et surtout sur le rattachement de chaque décision au bon coût partiel.",
    "La soutenance, notée sur la clarté de l'argumentation chiffrée et la solidité des réponses aux objections.",
    "Les traces de passeport des six séances, qui attestent chacune un acte professionnel distinct.",
    "La progression individuelle sur le tri des coûts pertinents, mesurée entre la première note de décision et la dernière.",
  ],
  prolongements: [
    "Rejouer la partie en activant le monde variable, pour distinguer l'écart dû aux décisions de l'écart dû à l'aléa.",
    "Confronter les décisions d'abandon et de sous-traitance à leurs limites non chiffrées : qualité, délais, dépendance et emploi.",
    "Enchaîner sur l'atelier DCG, qui reprend la même entreprise et ajoute le financement, l'investissement et le rapport de gestion.",
  ],
  faq: [
    {
      question: "Faut-il maîtriser tout le processus 5 avant de commencer ?",
      reponse: "Non. Les deux premières séances construisent le tableau différentiel et les écarts à partir de la partie, sans prérequis. Les décisions de coûts partiels arrivent ensuite, chacune amenée par sa situation dédiée.",
    },
    {
      question: "Pourquoi jouer une entreprise mono-produit pour enseigner le mix ?",
      reponse: "La partie fournit le réel, le contexte et les charges. Les arbitrages multi-produits que le moteur ne peut pas produire, comme l'écart de composition ou le facteur rare, sont travaillés sur des situations dédiées, calibrées pour cela et projetées en classe.",
    },
    {
      question: "Peut-on tenir l'atelier en moins de six séances ?",
      reponse: "Oui, en gardant les quatre trimestres joués et en fondant les deux séances de décision en une seule, plus dense. On perd alors le temps de rédaction du dossier, qui est justement ce qui fixe la méthode, donc c'est un pis-aller.",
    },
    {
      question: "Les situations de décision sont-elles notées ?",
      reponse: "Pas directement. Elles servent à faire découvrir la méthode en classe. Ce qui est noté, c'est la note de décision que l'équipe produit après chaque situation, puis le dossier final qui les réunit.",
    },
    {
      question: "Le monde variable doit-il rester désactivé ?",
      reponse: "Au premier passage, oui : on veut que l'écart s'explique par les décisions et non par un aléa, pour que la méthode reste lisible. Le prolongement propose de le réactiver une fois la méthode acquise, pour apprendre à distinguer les deux sources d'écart.",
    },
  ],
};
