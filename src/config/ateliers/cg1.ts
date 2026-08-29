import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS CG, première année.
 *
 * Six séances de quatre heures, une partie de six tours, un tour par séance.
 * L'entreprise est la même du début à la fin : c'est ce qui distingue un
 * atelier d'une suite d'exercices. Les élèves ne calculent pas un seuil de
 * rentabilité, ils calculent LEUR seuil, celui de l'entreprise qu'ils ont mal
 * pilotée la semaine précédente.
 *
 * Chaque séance produit un livrable et une phrase de passeport professionnel.
 * Un jeu d'entreprise sans trace écrite ne s'évalue pas.
 */
export const ATELIER_CG1: AtelierDefinition = {
  code: "cg1",
  titre: "Piloter une entreprise pendant six trimestres",
  diplome: "BTS Comptabilité et Gestion",
  annee: "Première année",
  pitch:
    "Six séances de quatre heures. Chaque équipe dirige la même entreprise du premier au dernier tour, décide, subit ses décisions, et produit à chaque séance un document professionnel qui s'évalue.",
  resume:
    "Une partie de six trimestres étalée sur six séances, du diagnostic d'ouverture à la soutenance du rapport de gestion.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "6 séances de 4 h",
  pourquoi:
    "En atelier professionnel, la difficulté n'est pas de faire calculer un seuil de rentabilité : c'est de faire comprendre à quoi il sert. Un dossier fournit les chiffres et demande la réponse. Ici les chiffres sont ceux que l'équipe a produits au tour précédent, personne ne connaît la réponse, et une décision prise sans le calcul se paie au tour suivant. Le compte de résultat, le bilan, la TVA à décaisser et le besoin en fonds de roulement ne sont plus des documents à recopier : ce sont les conséquences de ce que l'équipe a fait.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 4,
    niveauNom: "Arbitrage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    notes:
      "NOVA porte un stock, un coût de production et des délais de règlement : les trois matières de la première année. Le monde variable est décoché pour que toutes vos classes jouent la même économie et que vos corrigés restent valables d'une année sur l'autre. Deux concurrents pilotés par la machine suffisent à ce que le marché résiste.",
  },
  seances: [
    {
      numero: 1,
      titre: "Prendre l'entreprise en main",
      dureeMinutes: 240,
      tourJoue: 1,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
        "P7 · Fiabilisation de l'information et système d'information comptable",
      ],
      objectif:
        "Lire les documents de synthèse d'une entreprise inconnue et en tirer un diagnostic, avant de décider quoi que ce soit.",
      competences: [
        "Je lis un bilan d'ouverture et j'en tire ce que l'entreprise possède, ce qu'elle doit et ce qui lui reste.",
        "Je repère la contrainte qui limite l'activité, et je la distingue d'un simple manque de moyens.",
        "Je formule un diagnostic écrit, hiérarchisé, sans recopier les documents.",
      ],
      notions: [
        "actif et passif",
        "capitaux propres",
        "dettes financières",
        "capacité de production",
        "charges fixes et charges variables",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, un rôle par élève (direction, production, finances), rôles tournants d'une séance à l'autre. Imprimez la fiche de diagnostic vierge.",
      deroule: [
        {
          minutes: 20,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle du jeu : six séances, six trimestres, une seule entreprise, et un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 40,
          titre: "Lecture individuelle",
          detail:
            "Chaque élève lit seul le bilan d'ouverture et le compte de résultat de son entreprise, et note trois constats. Aucune discussion à ce moment : un diagnostic collectif commence par des lectures séparées.",
        },
        {
          minutes: 40,
          titre: "Diagnostic d'équipe",
          detail:
            "L'équipe confronte ses lectures et remplit la fiche de diagnostic. Vous circulez sans corriger : les erreurs de lecture se paieront au tour 1, et c'est ce qui les rendra mémorables.",
        },
        {
          minutes: 60,
          titre: "Le premier arbitrage",
          detail:
            "L'arène pose au tour 1 un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit ses décisions.",
        },
        {
          minutes: 30,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le tour depuis votre espace. Les états financiers du trimestre apparaissent pour chaque équipe, avec le classement.",
        },
        {
          minutes: 50,
          titre: "Débriefing",
          detail:
            "Une équipe présente son diagnostic, une autre le sien. Vous ne dites pas qui a raison : vous montrez le compte de résultat de chacune. C'est lui qui tranche.",
        },
      ],
      livrable:
        "La fiche de diagnostic d'ouverture, une page : ce que l'entreprise possède, ce qu'elle doit, ce qu'elle sait faire, la contrainte qui la limite, et le choix retenu au premier arbitrage avec sa justification.",
      tracePasseport:
        "J'ai analysé la situation d'une entreprise à partir de ses documents de synthèse, et j'ai justifié une décision de gestion à partir de ce diagnostic.",
      evaluation: [
        "Les montants cités sont exacts et proviennent bien des documents.",
        "Les constats sont hiérarchisés : le plus déterminant vient en premier.",
        "La contrainte identifiée est la bonne, et elle est nommée, pas devinée.",
        "La justification du choix mobilise le diagnostic et pas une intuition.",
      ],
    },
    {
      numero: 2,
      titre: "Le coût, le prix, le seuil",
      dureeMinutes: 240,
      tourJoue: 2,
      processus: ["P5 · Analyse et prévision de l'activité"],
      objectif:
        "Calculer le seuil de rentabilité de sa propre entreprise et s'en servir pour fixer un prix.",
      competences: [
        "Je distingue une charge variable d'une charge de structure sur un compte de résultat réel.",
        "Je calcule une marge sur coût variable unitaire et un taux de marge.",
        "Je calcule un seuil de rentabilité en volume et en valeur, et j'en déduis une marge de sécurité.",
        "Je fixe un prix de vente en tenant compte du seuil et de la réaction des clients.",
      ],
      notions: [
        "charges variables et charges de structure",
        "marge sur coût variable",
        "taux de marge sur coût variable",
        "seuil de rentabilité",
        "marge de sécurité",
        "point mort",
      ],
      preparation:
        "Rien à créer : la partie continue. Préparez au tableau le compte de résultat du tour 1 d'une équipe volontaire, il servira d'exemple commun.",
      deroule: [
        {
          minutes: 30,
          titre: "Reprise",
          detail:
            "Les résultats du tour 1 sont affichés. Vous demandez à chaque équipe combien elle a gagné, puis combien elle devait vendre pour ne rien perdre. Personne ne sait. C'est la séance.",
        },
        {
          minutes: 50,
          titre: "Le tri des charges",
          detail:
            "Sur le compte de résultat du tour 1, chaque équipe classe ses charges : celles qui suivent le volume, celles qui tombent quoi qu'il arrive. Le marketing et la qualité posent la vraie question, et il faut la trancher.",
        },
        {
          minutes: 40,
          titre: "Le calcul, à la main",
          detail:
            "Marge sur coût variable unitaire, taux de marge, seuil en volume, seuil en valeur, marge de sécurité. Sur papier, avec leurs chiffres, avant d'aller voir ce que le jeu affiche.",
        },
        {
          minutes: 20,
          titre: "Confrontation",
          detail:
            "Le panneau du seuil de l'arène est recalculé chaque tour avec les charges de structure de l'équipe. Ils comparent. Les écarts viennent presque toujours du classement des charges, et cet écart est la leçon.",
        },
        {
          minutes: 50,
          titre: "Décider le tour 2",
          detail:
            "Le prix se fixe maintenant avec le seuil sous les yeux. Chaque équipe écrit le volume qu'elle doit atteindre à son nouveau prix, puis saisit ses décisions.",
        },
        {
          minutes: 50,
          titre: "Clôture et débriefing",
          detail:
            "Vous clôturez. On compare le volume visé et le volume vendu, et on cherche pourquoi ils diffèrent : le prix a fait fuir des clients, ou la capacité n'a pas suivi.",
        },
      ],
      livrable:
        "La feuille de calcul du seuil : tri des charges justifié, marge sur coût variable, seuil en volume et en valeur, marge de sécurité, et le prix retenu pour le tour 2 avec le volume qu'il faut atteindre.",
      tracePasseport:
        "J'ai calculé le seuil de rentabilité d'une entreprise à partir de son compte de résultat, et je m'en suis servi pour fixer un prix de vente.",
      evaluation: [
        "Le tri des charges est justifié, y compris pour les budgets discrétionnaires.",
        "Les calculs sont exacts et les unités sont écrites.",
        "Le seuil est interprété : l'élève dit ce qu'il faut vendre, pas seulement le chiffre.",
        "Le prix retenu est cohérent avec le seuil annoncé.",
      ],
    },
    {
      numero: 3,
      titre: "Le plan de trésorerie et la banque",
      dureeMinutes: 240,
      tourJoue: 3,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
        "P5 · Analyse et prévision de l'activité",
      ],
      objectif:
        "Construire un plan de trésorerie, s'en servir pour demander un financement, puis mesurer l'écart avec le réalisé.",
      competences: [
        "Je distingue une charge d'un décaissement, et un produit d'un encaissement.",
        "Je construis un plan de trésorerie à partir de décisions prévues et de délais de règlement.",
        "Je présente un besoin de financement chiffré et daté.",
        "Je mesure l'écart entre ma prévision et le réalisé, et j'en cherche la cause.",
      ],
      notions: [
        "encaissements et décaissements",
        "délais de règlement clients et fournisseurs",
        "plan de trésorerie",
        "découvert autorisé",
        "emprunt",
      ],
      preparation:
        "Distribuez le modèle de plan de trésorerie sur tableur, colonnes vides. Vérifiez que la partie tourne au niveau Arbitrage : c'est lui qui ouvre le financement, donc le panneau bancaire.",
      deroule: [
        {
          minutes: 30,
          titre: "Résultat et caisse ne sont pas la même chose",
          detail:
            "Vous mettez côte à côte le résultat du tour 2 et la variation de trésorerie du même tour. Ils ne coïncident pas. Vous ne l'expliquez pas encore : vous le faites constater.",
        },
        {
          minutes: 60,
          titre: "Le plan, sur tableur",
          detail:
            "Chaque équipe prévoit ses encaissements et ses décaissements du trimestre à venir, à partir de ses décisions et des délais du scénario. Le solde de fin de trimestre est la ligne qui compte.",
        },
        {
          minutes: 30,
          titre: "Déposer le dossier",
          detail:
            "Le plan se dépose dans l'arène avec les décisions. Sans lui, la banque n'instruit aucune demande d'emprunt : les équipes qui l'oublient s'en apercevront au tour suivant, et c'est une leçon qu'aucun cours ne remplace.",
        },
        {
          minutes: 40,
          titre: "Décider le tour 3",
          detail:
            "Emprunter, augmenter le capital, mobiliser des créances ou ne rien faire : l'équipe choisit, et le montant demandé doit correspondre au besoin que son plan démontre.",
        },
        {
          minutes: 30,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le verdict de la banque apparaît : plan jugé juste à tant pour cent, confiance en hausse ou en baisse, découvert consenti pour le trimestre suivant.",
        },
        {
          minutes: 50,
          titre: "L'écart",
          detail:
            "Chaque équipe reprend son plan et écrit, ligne par ligne, d'où vient l'écart. Un écart qui se répète dans le même sens n'est pas de la malchance, c'est une erreur de méthode.",
        },
      ],
      livrable:
        "Le plan de trésorerie du trimestre sur tableur, et la note d'écart qui l'accompagne : pour chaque ligne, le prévu, le réalisé, l'écart et sa cause.",
      tracePasseport:
        "J'ai établi un plan de trésorerie, je m'en suis servi pour justifier une demande de financement, et j'ai analysé les écarts avec le réalisé.",
      evaluation: [
        "Les décaissements sont datés selon les délais réels, pas au moment de la charge.",
        "Le besoin de financement demandé correspond à celui que le plan démontre.",
        "Les causes d'écart sont cherchées dans les décisions, pas mises sur le compte du hasard.",
        "Le tableur est lisible par quelqu'un qui ne l'a pas construit.",
      ],
    },
    {
      numero: 4,
      titre: "Gagner de l'argent et ne plus en avoir",
      dureeMinutes: 240,
      tourJoue: 4,
      processus: ["P6 · Analyse de la situation financière"],
      objectif:
        "Construire un bilan fonctionnel et expliquer, avec lui, comment une entreprise rentable se retrouve sans trésorerie.",
      competences: [
        "Je reclasse un bilan comptable en bilan fonctionnel.",
        "Je calcule un fonds de roulement net global, un besoin en fonds de roulement et une trésorerie nette.",
        "J'établis la relation entre les trois, et je m'en sers pour expliquer une situation.",
        "Je propose des actions qui agissent sur le besoin en fonds de roulement.",
      ],
      notions: [
        "bilan fonctionnel",
        "fonds de roulement net global",
        "besoin en fonds de roulement",
        "trésorerie nette",
        "stocks et créances",
      ],
      preparation:
        "C'est le tour où l'activité s'emballe. Rien à régler : le scénario s'en charge. Préparez la trame du bilan fonctionnel au tableau.",
      deroule: [
        {
          minutes: 30,
          titre: "Le constat",
          detail:
            "Le chiffre d'affaires monte, le résultat suit, et la trésorerie descend. Vous laissez les équipes buter dessus une bonne dizaine de minutes avant d'ouvrir la séance.",
        },
        {
          minutes: 60,
          titre: "Le bilan fonctionnel",
          detail:
            "Chaque équipe reclasse son propre bilan : emplois stables, ressources stables, actif et passif circulants, trésorerie. Puis calcule le fonds de roulement, le besoin et la trésorerie nette.",
        },
        {
          minutes: 30,
          titre: "La relation",
          detail:
            "Trésorerie nette égale fonds de roulement moins besoin en fonds de roulement. Ils vérifient sur leurs propres chiffres, et l'égalité tombe juste, ce qui n'arrive jamais dans un exercice inventé.",
        },
        {
          minutes: 40,
          titre: "Décider le tour 4",
          detail:
            "Comment desserrer l'étau : vendre moins cher pour vider le stock, mobiliser les créances, emprunter, ralentir. Chaque solution a son prix, et l'équipe doit dire lequel elle accepte de payer.",
        },
        {
          minutes: 30,
          titre: "Clôture",
          detail: "Vous clôturez. Les équipes qui n'ont rien fait découvrent l'affacturage forcé.",
        },
        {
          minutes: 50,
          titre: "Formalisation",
          detail:
            "Vous formalisez au tableau ce qu'ils viennent de vivre. La crise de trésorerie de croissance a un nom, et ils ne l'oublieront plus.",
        },
      ],
      livrable:
        "Le bilan fonctionnel de l'entreprise au tour 4, les trois agrégats calculés, et une note d'une page qui explique le paradoxe et propose deux actions chiffrées.",
      tracePasseport:
        "J'ai construit un bilan fonctionnel, calculé le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette, et j'ai expliqué une crise de trésorerie à partir de ces agrégats.",
      evaluation: [
        "Le reclassement est complet et les masses s'équilibrent.",
        "La relation entre les trois agrégats est vérifiée sur les chiffres de l'équipe.",
        "L'explication porte sur le besoin en fonds de roulement et pas sur le résultat.",
        "Les actions proposées sont chiffrées et leur contrepartie est nommée.",
      ],
    },
    {
      numero: 5,
      titre: "La TVA, les délais et le poste clients",
      dureeMinutes: 240,
      tourJoue: 5,
      processus: [
        "P3 · Gestion des obligations fiscales",
        "P1 · Contrôle et traitement comptable des opérations commerciales",
      ],
      objectif:
        "Comprendre le poids de la TVA et des délais de règlement dans la trésorerie, et comparer le coût de deux façons de mobiliser des créances.",
      competences: [
        "Je calcule une TVA collectée, une TVA déductible et une TVA à décaisser.",
        "J'explique pourquoi une taxe neutre pour le résultat pèse sur la trésorerie.",
        "Je calcule le coût réel d'un escompte et celui d'un affacturage, et je les compare.",
        "Je choisis un moyen de financement du poste clients et je justifie mon choix par le calcul.",
      ],
      notions: [
        "TVA collectée, déductible, à décaisser",
        "flux toutes taxes comprises et résultat hors taxes",
        "escompte",
        "affacturage",
        "coût du financement à court terme",
      ],
      preparation:
        "Vérifiez que la TVA est bien activée dans les paramètres économiques de la partie. Préparez deux créances chiffrées au tableau pour l'exercice de comparaison.",
      deroule: [
        {
          minutes: 40,
          titre: "La TVA n'est pas une charge",
          detail:
            "Le résultat de l'arène est rigoureusement hors taxes, les flux sont toutes taxes comprises, et la TVA à décaisser est une dette payée le trimestre suivant. Les équipes retrouvent le montant dans leur bilan.",
        },
        {
          minutes: 40,
          titre: "Son poids dans le besoin",
          detail:
            "Ils reprennent le besoin en fonds de roulement du tour 4 et isolent la part qui vient de la TVA. Une taxe qui ne coûte rien peut immobiliser beaucoup.",
        },
        {
          minutes: 50,
          titre: "Escompte ou affacturage",
          detail:
            "Sur leurs propres créances, ils calculent le coût de chacun des deux, au prorata du trimestre, et concluent. Le moins cher n'est pas toujours le plus disponible, et c'est le sujet.",
        },
        {
          minutes: 40,
          titre: "Décider le tour 5",
          detail:
            "L'équipe applique sa conclusion et saisit ses décisions, plan de trésorerie mis à jour.",
        },
        {
          minutes: 30,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le coût du financement apparaît dans le tableau de flux, à la ligne près.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare le coût annoncé par les équipes et celui qui figure au compte de résultat. Les écarts viennent presque toujours du prorata.",
        },
      ],
      livrable:
        "Le calcul de la TVA à décaisser du trimestre, la part de TVA dans le besoin en fonds de roulement, et le tableau comparatif escompte contre affacturage avec la décision retenue.",
      tracePasseport:
        "J'ai calculé une TVA à décaisser, mesuré son poids dans le besoin en fonds de roulement, et comparé par le calcul deux modes de financement du poste clients.",
      evaluation: [
        "La TVA à décaisser est exacte et son mécanisme est expliqué en une phrase juste.",
        "La distinction entre neutralité pour le résultat et poids pour la trésorerie est établie.",
        "Les deux coûts sont calculés au prorata de la durée réelle.",
        "La décision suit le calcul et mentionne la contrainte de disponibilité.",
      ],
    },
    {
      numero: 6,
      titre: "Rendre compte",
      dureeMinutes: 240,
      tourJoue: 6,
      processus: [
        "P5 · Analyse et prévision de l'activité",
        "P6 · Analyse de la situation financière",
        "P7 · Fiabilisation de l'information et système d'information comptable",
      ],
      objectif:
        "Produire un rapport de gestion sur six trimestres à partir de données exportées, et le soutenir devant un jury.",
      competences: [
        "J'exporte des données de gestion et je les contrôle avant de les utiliser.",
        "Je construis une série sur plusieurs périodes et j'en tire une évolution.",
        "Je rédige un rapport de gestion qui explique des résultats plutôt que de les décrire.",
        "Je soutiens une analyse à l'oral et je réponds à une objection chiffrée.",
      ],
      notions: [
        "évolution en valeur et en pourcentage",
        "ratios de rentabilité",
        "structure financière",
        "contrôle de cohérence",
        "rapport de gestion",
      ],
      preparation:
        "Depuis la page de la partie, exportez le relevé au format tableur : il contient les six tours de chaque équipe. Distribuez la trame du rapport et la grille d'oral. Prévoyez un jury, même symbolique.",
      deroule: [
        {
          minutes: 30,
          titre: "Le dernier tour",
          detail:
            "Les équipes jouent le tour 6 avec tout ce qu'elles savent. Vous clôturez, le classement final tombe.",
        },
        {
          minutes: 30,
          titre: "Récupérer et contrôler",
          detail:
            "Chaque équipe reçoit le relevé exporté et vérifie sa cohérence : les six tours sont là, les totaux se recoupent, aucune ligne ne manque. Un tableau qu'on n'a pas contrôlé ne se commente pas.",
        },
        {
          minutes: 70,
          titre: "Le rapport",
          detail:
            "Quatre pages : l'entreprise et sa contrainte, l'évolution de l'activité, la situation financière, les décisions qui ont pesé, et ce qu'ils feraient autrement. Les graphiques viennent du relevé.",
        },
        {
          minutes: 80,
          titre: "Soutenances",
          detail:
            "Dix minutes par équipe, sept de présentation et trois de questions. Une question obligatoire du jury : montrez-nous le trimestre où vous avez perdu le contrôle, et dites pourquoi.",
        },
        {
          minutes: 30,
          titre: "Retour au groupe",
          detail:
            "Vous reprenez ce que le classement final ne dit pas : l'équipe la mieux classée n'est pas toujours celle qui a le mieux raisonné, et vous montrez pourquoi.",
        },
      ],
      livrable:
        "Le rapport de gestion de quatre pages, ses annexes chiffrées issues du relevé exporté, et la soutenance de dix minutes.",
      tracePasseport:
        "J'ai produit et soutenu un rapport de gestion sur six périodes à partir de données exportées et contrôlées.",
      evaluation: [
        "Les données du rapport se retrouvent dans le relevé, sans écart.",
        "Le rapport explique les résultats au lieu de les paraphraser.",
        "Les graphiques servent la démonstration et portent leurs unités.",
        "À l'oral, l'équipe assume ses décisions et répond avec des chiffres.",
      ],
    },
  ],
  formats: [
    {
      nom: "Atelier hebdomadaire",
      quand: "Six semaines consécutives, quatre heures par semaine",
      comment:
        "Le tempo pour lequel l'atelier est écrit. Une séance, un trimestre, un livrable. L'attente d'une semaine entre deux tours joue en votre faveur : les équipes reviennent avec leurs calculs faits et leurs regrets aussi.",
    },
    {
      nom: "Semaine bloquée",
      quand: "Cinq jours, six demi-journées de quatre heures",
      comment:
        "Les six séances tiennent dans la semaine, à raison d'une le matin et une l'après-midi les trois premiers jours, puis les livrables et la soutenance. Prévoyez une demi-journée de plus pour le rapport : quatre pages ne s'écrivent pas entre deux tours.",
    },
    {
      nom: "Fil rouge sur l'année",
      quand: "Six séances réparties sur les deux premiers trimestres",
      comment:
        "Une séance toutes les trois ou quatre semaines, placée juste après le cours qui donne l'outil. Le seuil de rentabilité vient d'être vu, la séance 2 le fait servir. C'est le montage qui ancre le mieux, et celui qui demande le plus de discipline : la partie reste ouverte des mois.",
    },
  ],
  evaluationFinale: [
    "Six livrables d'équipe, un par séance, notés sur les critères annoncés au début de chaque séance.",
    "Le rapport de gestion et sa soutenance, qui pèsent le plus lourd parce qu'ils rassemblent tout.",
    "La note pédagogique que la plateforme calcule pour chaque équipe : diagnostics justes, modèles d'analyse bien choisis, questions de connaissances, indices consommés. Elle éclaire le travail de raisonnement, que les livrables ne montrent pas toujours.",
    "Le classement final ne compte pas dans la note. Une équipe peut bien raisonner et mal finir : c'est la vie des entreprises, ce ne doit pas être celle des élèves.",
  ],
  faq: [
    {
      question: "Faut-il savoir jouer soi-même avant d'animer ?",
      reponse:
        "Non, mais il faut avoir joué une partie solo une fois, environ quarante minutes, pour savoir où sont les écrans. L'atelier ne vous demande jamais de décider à la place des équipes : votre travail est de clôturer les tours et d'animer les débriefings.",
    },
    {
      question: "Que se passe-t-il si une équipe fait faillite en cours de route ?",
      reponse:
        "Rien ne s'arrête. Une entreprise en découvert au-delà du plafond voit ses créances cédées d'office, elle continue de jouer, et elle a beaucoup à raconter en séance 4. Une équipe qui se plante donne souvent le meilleur rapport de gestion, à condition que vous le disiez dès la première séance.",
    },
    {
      question: "Combien d'élèves par équipe ?",
      reponse:
        "Trois, avec un rôle chacun et des rôles qui tournent d'une séance à l'autre. À deux, un élève finit par décider seul. À quatre, un élève regarde.",
    },
    {
      question: "Peut-on rattraper une séance manquée ?",
      reponse:
        "Oui. Une équipe absente peut saisir ses décisions à distance avant que vous ne clôturiez le tour. Si personne ne les saisit, le tour se joue avec des décisions neutres et l'équipe reprend au tour suivant, avec un trimestre de retard qui se voit dans ses chiffres.",
    },
    {
      question: "Faut-il des ordinateurs pour tout le monde ?",
      reponse:
        "Un poste par équipe suffit pour jouer. Le tableur du plan de trésorerie de la séance 3 et le rapport de la séance 6 demandent en revanche de quoi travailler à plusieurs, en salle informatique ou sur les portables des élèves.",
    },
    {
      question: "Peut-on changer de secteur d'entreprise ?",
      reponse:
        "Oui, les sept secteurs se jouent avec le même déroulé. NOVA est recommandé parce qu'il porte un stock, un coût de production et des délais de règlement, les trois matières de la première année. Un secteur sans stock, comme la restauration ou l'hôtellerie, rend la séance 4 plus difficile et la séance 2 plus subtile.",
    },
  ],
  prolongements: [
    "Rejouer le même atelier sur LA TABLE D'AUGUSTIN, où rien ne se stocke : les élèves découvrent que la moitié de leurs réflexes venaient du stock et pas de la gestion.",
    "Ouvrir le niveau Stratégie en seconde année pour ajouter le placement de trésorerie, puis le niveau Executive pour l'affectation du résultat.",
    "Prolonger la séance 5 vers le calcul et le décaissement de l'impôt sur les sociétés, modulable dans les paramètres économiques de la partie.",
    "Monter un concours entre classes à partir de la même partie, avec groupes tirés au sort et décisions verrouillées.",
  ],
};
