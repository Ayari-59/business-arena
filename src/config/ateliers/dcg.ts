import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · DCG.
 *
 * Cinq séances de trois heures sur NOVA, à un niveau de jeu qui ouvre le
 * financement, l'investissement et le placement des excédents. Le DCG n'est pas
 * un BTS avec plus d'heures : ce que l'atelier y apporte n'est pas la découverte
 * des documents de synthèse, que les candidats savent lire, mais la chaîne
 * complète entre une décision et ses conséquences financières, celle qu'aucun
 * sujet d'examen ne peut faire éprouver puisqu'il donne toujours les données.
 *
 * Deux unités d'enseignement portent l'essentiel du déroulé, la finance
 * d'entreprise et le contrôle de gestion. Le rapprochement avec les autres est
 * possible mais nous ne le forçons pas : mieux vaut deux unités bien servies
 * que treize citées.
 */
export const ATELIER_DCG: AtelierDefinition = {
  code: "dcg",
  titre: "Piloter et rendre compte sur quatre exercices",
  diplome: "DCG",
  annee: "Deuxième ou troisième année",
  referentielLabel: "Unités d'enseignement",
  referentielAccord: "mobilisées",
  pitch:
    "Cinq séances de trois heures. Chaque équipe dirige la même entreprise industrielle, construit ses budgets, analyse ses écarts, décide d'investir et de se financer, et rend un rapport financier qu'elle soutient devant un jury.",
  resume:
    "Quatre trimestres dans une entreprise industrielle, du diagnostic financier d'ouverture au rapport de gestion soutenu, budgets et écarts compris.",
  difficulte: 4,
  difficulteLabel: "Avancé",
  format: "5 séances de 3 h",
  pourquoi:
    "Un sujet de finance d'entreprise donne les flux et demande la valeur actuelle nette. L'exercice est juste, et il laisse intacte la question qui compte : d'où viennent ces flux, et qui les a estimés. Ici l'équipe produit elle-même sa prévision, la dépose, puis découvre au trimestre suivant l'écart entre ce qu'elle avait annoncé et ce qui s'est produit. Elle apprend alors ce qu'aucune correction ne transmet : qu'un calcul d'investissement ne vaut que ce que valent les hypothèses de celui qui l'a fait, et que la banque, elle, regarde d'abord la fiabilité des plans précédents.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 5,
    niveauNom: "Stratégie",
    equipes: 5,
    bots: 2,
    tva: true,
    mondeVariable: true,
    quizMode: "Modèle d'analyse seul",
    tours: 4,
    notes:
      "NOVA porte un cycle d'exploitation complet, des stocks, des délais de règlement des deux côtés et une capacité de production qui s'investit. Le niveau retenu ouvre le financement, l'investissement et le placement des excédents, c'est-à-dire la matière de la finance d'entreprise. Le monde variable est ici ACTIVÉ, à la différence des ateliers de BTS : à ce niveau, la distinction entre une bonne décision et un bon résultat fait partie de ce qui s'évalue. Les questions de connaissances sont désactivées et seul le choix du modèle d'analyse est demandé.",
  },
  seances: [
    {
      numero: 1,
      titre: "Diagnostic financier d'ouverture",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "UE6 · Finance d'entreprise",
        "UE11 · Contrôle de gestion",
      ],
      objectif:
        "Établir le diagnostic financier d'une entreprise inconnue par le bilan fonctionnel et les soldes intermédiaires, et en tirer la contrainte à traiter en premier.",
      competences: [
        "Je construis un bilan fonctionnel et j'en tire le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette.",
        "Je calcule les soldes intermédiaires de gestion et je repère celui qui explique le résultat.",
        "Je hiérarchise les problèmes financiers d'une entreprise au lieu de les énumérer.",
      ],
      notions: [
        "bilan fonctionnel",
        "fonds de roulement net global",
        "besoin en fonds de roulement",
        "trésorerie nette",
        "soldes intermédiaires de gestion",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez des équipes de trois ou quatre. Préparez la trame de note de diagnostic en deux pages maximum, et annoncez dès la première séance que le monde variable est activé, ce qui change la façon dont les résultats se lisent.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : cinq séances, quatre trimestres, une entreprise, un livrable par séance, et un rapport soutenu à la fin. Les équipes rejoignent la partie.",
        },
        {
          minutes: 45,
          titre: "Bilan fonctionnel et soldes",
          detail:
            "Chaque équipe reconstruit le bilan fonctionnel d'ouverture et calcule les soldes intermédiaires. Le travail est individuel pendant la première moitié, mis en commun ensuite.",
        },
        {
          minutes: 30,
          titre: "La contrainte à traiter",
          detail:
            "L'équipe hiérarchise ce qu'elle a trouvé et désigne le problème à traiter en premier. C'est cette hiérarchie qui sera relue à la dernière séance, quand on saura si elle avait vu juste.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose l'arbitrage du trimestre. L'équipe tranche, justifie, puis saisit ses décisions de prix, de production et de financement.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit ses états financiers et son équilibre fonctionnel recalculé.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "Deux équipes exposent leur diagnostic. Vous relevez les écarts de lecture entre elles plutôt que de trancher : l'entreprise le fera au trimestre suivant.",
        },
      ],
      livrable:
        "La note de diagnostic financier, deux pages : bilan fonctionnel reconstruit, soldes intermédiaires commentés, hiérarchie des problèmes financiers, et la décision du trimestre justifiée par ce diagnostic.",
      tracePasseport:
        "J'ai établi le diagnostic financier d'une entreprise par le bilan fonctionnel et les soldes intermédiaires, et j'en ai tiré une décision de gestion.",
      evaluation: [
        "L'équilibre entre fonds de roulement, besoin en fonds de roulement et trésorerie est vérifié, pas seulement affiché.",
        "Les soldes intermédiaires servent à expliquer le résultat, ils ne sont pas récités.",
        "Les problèmes sont hiérarchisés, avec un premier problème désigné et défendu.",
      ],
    },
    {
      numero: 2,
      titre: "Coûts, seuil et levier",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "UE11 · Contrôle de gestion",
        "UE6 · Finance d'entreprise",
      ],
      objectif:
        "Séparer les charges selon leur variabilité, en tirer le seuil de rentabilité et le levier opérationnel, et mesurer ce que ce levier fait au risque de l'entreprise.",
      competences: [
        "Je sépare les charges variables des charges fixes à partir de documents qui ne les distinguent pas.",
        "Je calcule un seuil de rentabilité, une marge de sécurité et un levier opérationnel.",
        "Je relie le niveau du levier au risque que prend l'entreprise quand la demande baisse.",
      ],
      notions: [
        "charges variables et charges fixes",
        "marge sur coût variable",
        "seuil de rentabilité",
        "marge de sécurité",
        "levier opérationnel",
      ],
      preparation:
        "Préparez un tableau vierge à deux colonnes pour la ventilation des charges, que les équipes rempliront à partir de leurs propres états. Prévoyez de laisser ouverte la question des charges semi-variables : c'est là que le travail est intéressant.",
      deroule: [
        {
          minutes: 15,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe confronte sa hiérarchie de problèmes au résultat obtenu, en une phrase.",
        },
        {
          minutes: 45,
          titre: "Ventiler les charges",
          detail:
            "L'équipe classe ses charges selon leur variabilité et défend ses cas limites. Aucune ventilation n'est évidente, et c'est le point de la séance.",
        },
        {
          minutes: 35,
          titre: "Seuil, marge de sécurité, levier",
          detail:
            "L'équipe calcule les trois indicateurs et interprète son levier : à ce niveau, une baisse de dix pour cent des ventes coûte combien de résultat.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, avec la prévision de résultat déposée avant clôture. Elle sera confrontée au réel à la séance suivante.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le monde variable étant activé, l'écart entre prévision et réel n'est pas seulement imputable aux décisions, et il faut le nommer tout de suite.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare les leviers opérationnels des équipes et leurs résultats. Le levier le plus élevé n'est pas toujours celui qui gagne, et jamais celui qui dort tranquille.",
        },
      ],
      livrable:
        "Le dossier de coûts : la ventilation des charges avec la justification des cas limites, le seuil de rentabilité, la marge de sécurité, le levier opérationnel et son interprétation en risque.",
      tracePasseport:
        "J'ai ventilé les charges d'une entreprise selon leur variabilité et j'ai interprété son levier opérationnel en termes de risque.",
      evaluation: [
        "Les cas limites de ventilation sont argumentés, pas tranchés au hasard.",
        "La marge de sécurité est exprimée et commentée, pas seulement calculée.",
        "Le levier est traduit en risque, avec un ordre de grandeur chiffré.",
      ],
    },
    {
      numero: 3,
      titre: "Budget et analyse des écarts",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "UE11 · Contrôle de gestion",
      ],
      objectif:
        "Construire un budget du trimestre, puis décomposer l'écart constaté entre ce qui relève du prix, du volume et des coûts.",
      competences: [
        "Je construis un budget de trimestre à partir des exercices écoulés et d'hypothèses que je nomme.",
        "Je décompose un écart global en écart sur prix, sur volume et sur coûts.",
        "Je distingue un écart imputable à une décision d'un écart imputable au marché.",
      ],
      notions: [
        "budget prévisionnel",
        "écart sur prix",
        "écart sur volume",
        "écart sur coûts",
        "hypothèse budgétaire",
      ],
      preparation:
        "C'est la séance centrale de l'atelier et la plus exigeante. Préparez la trame de décomposition des écarts et prévoyez d'y consacrer tout le temps annoncé. Les équipes auront besoin de leur prévision déposée à la séance précédente : vérifiez qu'elles l'ont conservée.",
      deroule: [
        {
          minutes: 15,
          titre: "Prévision contre réel",
          detail:
            "Chaque équipe affiche l'écart brut entre la prévision déposée au trimestre précédent et le résultat obtenu. Personne ne commente encore.",
        },
        {
          minutes: 50,
          titre: "Décomposer l'écart",
          detail:
            "L'équipe décompose son écart global en écart sur prix, sur volume et sur coûts, et vérifie que la somme des trois retombe sur l'écart global. Le contrôle par la somme est la discipline de la séance.",
        },
        {
          minutes: 30,
          titre: "Décision ou marché",
          detail:
            "Pour chaque composante, l'équipe se prononce : est-ce moi ou est-ce le marché. Le monde variable étant activé, les deux coexistent, et les séparer est exactement ce que le contrôle de gestion apporte.",
        },
        {
          minutes: 30,
          titre: "Budget du trimestre suivant et décisions",
          detail:
            "L'équipe construit le budget du trimestre qui s'ouvre, en écrivant ses hypothèses, puis saisit ses décisions.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le budget qui vient d'être construit sera confronté au réel à la séance suivante.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare les décompositions. Deux équipes ayant subi le même événement de marché mais l'ayant imputé différemment font à elles seules le cours sur la limite de l'exercice.",
        },
      ],
      livrable:
        "Le dossier budgétaire : le budget du trimestre écoulé avec ses hypothèses, la décomposition de l'écart en trois composantes vérifiée par leur somme, l'imputation de chacune, et le budget du trimestre suivant.",
      tracePasseport:
        "J'ai construit un budget, décomposé l'écart entre le budget et le réel, et distingué ce qui relevait de mes décisions de ce qui relevait du marché.",
      evaluation: [
        "La somme des trois écarts retombe sur l'écart global, et le contrôle est montré.",
        "Les hypothèses du budget sont écrites avant la clôture, donc opposables.",
        "L'imputation entre décision et marché est argumentée, pas commode.",
      ],
    },
    {
      numero: 4,
      titre: "Investir et financer",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "UE6 · Finance d'entreprise",
        "UE11 · Contrôle de gestion",
      ],
      objectif:
        "Décider d'un investissement de capacité, choisir son financement, et déposer devant la banque un plan que les écarts des trimestres précédents rendent crédible ou non.",
      competences: [
        "J'évalue un projet d'investissement à partir des flux qu'il génère et non de son coût seul.",
        "Je compare des modes de financement sur leur coût et sur ce qu'ils font à la structure du bilan.",
        "Je construis un plan de trésorerie qui engage, et j'assume l'écart qu'il produira.",
      ],
      notions: [
        "flux de trésorerie d'un projet",
        "capacité d'autofinancement",
        "structure de financement",
        "effet de levier financier",
        "plan de trésorerie",
      ],
      preparation:
        "Vérifiez que le niveau de la partie ouvre bien l'investissement et le placement, sans quoi la séance perd son support. Rappelez aux équipes que la banque du jeu tient compte de la fiabilité de leurs plans précédents : c'est le moment où cette mécanique prend son sens.",
      deroule: [
        {
          minutes: 15,
          titre: "L'écart du trimestre",
          detail:
            "Chaque équipe confronte le budget construit à la séance précédente et le réel, sans refaire la décomposition complète.",
        },
        {
          minutes: 45,
          titre: "Le projet",
          detail:
            "L'équipe évalue l'investissement de capacité par les flux qu'il génère, en écrivant ses hypothèses de volume et de prix. Le coût d'acquisition ne suffit jamais à décider.",
        },
        {
          minutes: 35,
          titre: "Comment le financer",
          detail:
            "L'équipe compare l'autofinancement, l'emprunt et le renforcement des capitaux, sur leur coût et sur ce qu'ils font au bilan. L'effet de levier se discute ici avec des chiffres, pas en principe.",
        },
        {
          minutes: 30,
          titre: "Plan de trésorerie et décisions",
          detail:
            "L'équipe dépose son plan avec ses décisions. C'est la pièce que regarde la banque du jeu, et un plan absent ferme l'accès à l'emprunt.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le dernier trimestre joué. Les conditions bancaires obtenues par chaque équipe reflètent la fiabilité de ses plans passés.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare les projets financés et ceux qui ne l'ont pas été, et surtout les conditions obtenues. Une équipe qui a systématiquement surestimé ses prévisions le paie ici, et la leçon est difficile à faire passer autrement.",
        },
      ],
      livrable:
        "Le dossier d'investissement : l'évaluation du projet par ses flux avec hypothèses écrites, la comparaison des modes de financement, le plan de trésorerie déposé, et les conditions bancaires obtenues avec leur explication.",
      tracePasseport:
        "J'ai évalué un projet d'investissement par ses flux, comparé des modes de financement et défendu un plan de trésorerie devant un prêteur.",
      evaluation: [
        "Le projet est évalué par ses flux, jamais par son seul coût d'acquisition.",
        "Les modes de financement sont comparés sur le coût et sur la structure du bilan.",
        "Les conditions bancaires obtenues sont expliquées par l'historique de fiabilité, pas subies.",
      ],
    },
    {
      numero: 5,
      titre: "Rapport de gestion et soutenance",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "UE6 · Finance d'entreprise",
        "UE11 · Contrôle de gestion",
      ],
      objectif:
        "Produire le rapport de gestion des quatre trimestres et le soutenir devant un jury qui interroge les hypothèses autant que les résultats.",
      competences: [
        "Je rédige un rapport de gestion qui relie décisions, écarts et situation financière.",
        "J'assume publiquement une hypothèse qui s'est révélée fausse et j'en tire une conséquence.",
        "Je réponds à des questions portant sur mes méthodes de calcul, pas seulement sur mes chiffres.",
      ],
      notions: [
        "rapport de gestion",
        "tableau de bord financier",
        "rentabilité économique et financière",
        "analyse des écarts",
        "préconisation chiffrée",
      ],
      preparation:
        "Remettez la grille de soutenance à la séance précédente. Prévoyez un jury où siège au moins un collègue ou un professionnel, et un ordre de passage tiré au sort. Douze minutes de soutenance et six minutes de questions par équipe. Le rapport se rédige entre les deux dernières séances : la séance de soutenance sert à le finir, pas à l'écrire.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille et tirage de l'ordre de passage. Les équipes savent que les questions porteront d'abord sur leurs hypothèses.",
        },
        {
          minutes: 40,
          titre: "Rédaction du rapport",
          detail:
            "Les équipes finissent leur rapport, commencé entre les deux séances : diagnostic d'ouverture, décisions, écarts, situation de sortie, préconisations. Quatre pages au maximum, et le temps de la séance ne suffit pas à l'écrire depuis rien.",
        },
        {
          minutes: 20,
          titre: "Préparation de la soutenance",
          detail:
            "Répartition de la parole et anticipation des questions. Vous repérez les rapports où une hypothèse fausse a été discrètement effacée : c'est exactement ce que le jury doit trouver.",
        },
        {
          minutes: 90,
          titre: "Soutenances",
          detail:
            "Passage des équipes devant le jury, douze minutes de présentation et six minutes de questions. Les questions portent sur les méthodes autant que sur les résultats.",
        },
        {
          minutes: 20,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement puis vous l'écartez : la note vient du rapport et de la soutenance. Chaque candidat rédige ses phrases de passeport professionnel.",
        },
      ],
      livrable:
        "Le rapport de gestion, quatre pages : diagnostic d'ouverture, décisions et leurs justifications, analyse des écarts, situation financière de sortie, deux préconisations chiffrées, plus la soutenance de douze minutes.",
      tracePasseport:
        "J'ai rédigé le rapport de gestion d'une entreprise sur quatre trimestres et je l'ai soutenu devant un jury interrogeant mes hypothèses.",
      evaluation: [
        "Le rapport relie les décisions aux écarts et aux états financiers, sans juxtaposer trois parties.",
        "Au moins une hypothèse erronée est assumée et sa conséquence tirée.",
        "Les préconisations sont chiffrées et appuyées sur l'analyse, pas sur le bon sens.",
      ],
    },
  ],
  formats: [
    {
      nom: "Cinq séances hebdomadaires",
      quand: "Le format d'origine, sur cinq semaines.",
      comment:
        "Une séance par semaine. L'intervalle est nécessaire ici : la décomposition des écarts et le dossier d'investissement demandent un travail personnel entre deux séances.",
    },
    {
      nom: "Séminaire de trois jours",
      quand: "En stage intensif de préparation, hors période d'examen.",
      comment:
        "Deux séances les deux premiers jours, la soutenance le troisième. Le rythme convient à des candidats déjà à l'aise avec les documents de synthèse ; il est trop dur pour une première année.",
    },
    {
      nom: "Fil rouge sur deux unités",
      quand: "Quand l'atelier accompagne la finance d'entreprise et le contrôle de gestion.",
      comment:
        "Une séance après chaque chapitre correspondant, les séances de coûts et d'écarts avec le contrôle de gestion, celles de diagnostic et d'investissement avec la finance d'entreprise.",
    },
  ],
  evaluationFinale: [
    "Les quatre dossiers intermédiaires, un par séance jouée, pour la moitié de la note.",
    "Le rapport de gestion final, pour un quart.",
    "La soutenance et les réponses aux questions de méthode, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : avec le monde variable activé, il récompense en partie la chance, et c'est précisément ce que l'atelier apprend à distinguer.",
  ],
  prolongements: [
    "Rejouer les mêmes trimestres avec le monde variable désactivé, pour isoler l'effet des seules décisions et mesurer ce que le hasard avait pris ou donné.",
    "Prolonger sur les deux derniers trimestres en confiant à chaque équipe la trésorerie excédentaire à placer, ce que le niveau retenu autorise.",
    "Faire rejouer la partie par une autre promotion sur la même graine, et comparer les décisions prises aux mêmes moments.",
  ],
  faq: [
    {
      question: "Pourquoi activer le monde variable alors que les ateliers de BTS le désactivent ?",
      reponse:
        "Parce que la distinction entre une bonne décision et un bon résultat est ici un objectif, et non un obstacle. Un candidat au DCG doit pouvoir défendre une décision qui a mal tourné, et l'analyse des écarts n'a de sens que s'il existe une part que les décisions n'expliquent pas. Le revers est que vos corrigés ne sont pas transposables d'une classe à l'autre : c'est le prix à payer, et il est assumé.",
    },
    {
      question: "Deux unités d'enseignement seulement, n'est-ce pas peu ?",
      reponse:
        "C'est un choix. La finance d'entreprise et le contrôle de gestion sont les deux unités que la simulation sert réellement, et nous préférons deux unités bien couvertes à une liste qui donnerait le change. Le management et le droit des sociétés se rattachent au déroulé par des prolongements, pas par les séances elles-mêmes.",
    },
    {
      question: "Le niveau de jeu est le plus élevé de la plateforme après le niveau exécutif, est-ce tenable ?",
      reponse:
        "Il l'est pour des candidats qui savent déjà lire un bilan, ce qui est le cas au DCG. Il ne le serait pas en première année de BTS, où le nombre de décisions simultanées noierait les équipes. Si votre groupe est hétérogène, descendez d'un niveau pour les deux premières séances et remontez pour celle de l'investissement.",
    },
    {
      question: "La séance d'analyse des écarts tient-elle vraiment en trois heures ?",
      reponse:
        "Elle le peut, à condition que la décomposition ait été préparée en amont sur un cas court. C'est la séance la plus exigeante de l'atelier et la seule qu'il ne faut pas raccourcir : si vous devez gagner du temps, prenez-le sur la séance de coûts, dont une partie peut être traitée en travail personnel.",
    },
    {
      question: "Peut-on utiliser cet atelier pour préparer l'épreuve orale du diplôme ?",
      reponse:
        "La dernière séance est construite pour cela : rapport écrit court, soutenance chronométrée, questions portant sur les méthodes. Ce qu'elle ne remplace pas, c'est l'expérience professionnelle attendue par l'épreuve. Elle donne en revanche un entraînement à l'exercice le plus redouté, défendre ses propres chiffres devant quelqu'un qui les interroge.",
    },
  ],
};
