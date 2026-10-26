import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · DCG.
 *
 * Six séances de deux heures sur NOVA, à un niveau de jeu qui ouvre le
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
  titre: "Quatre exercices chez Nova : budget, écarts, rapport de gestion",
  formations: ["dcg"],
  annee: "Deuxième ou troisième année",
  nature: "Atelier professionnel",
  traceLabel: "portfolio de compétences",
  referentielLabel: "Unités d'enseignement",
  referentielAccord: "mobilisées",
  pitch:
    "Six séances de deux heures. Chaque équipe dirige la même entreprise industrielle, construit ses budgets, analyse ses écarts, décide d'investir et de se financer, et rend un rapport financier qu'elle soutient devant un jury.",
  resume:
    "Quatre trimestres dans une entreprise industrielle, du diagnostic financier d'ouverture au rapport de gestion soutenu, budgets et écarts compris.",
  difficulte: 4,
  difficulteLabel: "Avancé",
  format: "6 séances de 2 h",
  pourquoi:
    "Un sujet de finance d'entreprise donne les flux et demande la valeur actuelle nette. L'exercice est juste, et il laisse intacte la question qui compte : d'où viennent ces flux, et qui les a estimés. Ici l'équipe produit elle-même sa prévision, la dépose, puis découvre au trimestre suivant l'écart entre ce qu'elle avait annoncé et ce qui s'est produit. Elle apprend alors ce qu'aucune correction ne transmet : qu'un calcul d'investissement ne vaut que ce que valent les hypothèses de celui qui l'a fait, et que la banque, elle, regarde d'abord la façon dont la trésorerie a été tenue : une crise ou un affacturage forcé lui font perdre confiance, et le découvert se resserre.",
  reglages: {
    scenarioCode: "nova-gamme",
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
    tourDEssai: 1,
    effectifParEquipe: "trois élèves",
    notes:
      "NOVA se joue ici en trois références qui se disputent la même capacité : quand la demande dépasse l'atelier, la marge par unité de capacité décide de ce qu'on produit, et l'investissement se juge sur le mix qu'il libère. NOVA porte un cycle d'exploitation complet, des stocks, des délais de règlement des deux côtés et une capacité de production qui s'investit. Le niveau retenu ouvre le financement, l'investissement et le placement des excédents, c'est-à-dire la matière de la finance d'entreprise. Le monde variable est ici ACTIVÉ, à la différence des ateliers de BTS : à ce niveau, la distinction entre une bonne décision et un bon résultat fait partie de ce qui s'évalue. Les questions de connaissances sont désactivées et seul le choix du modèle d'analyse est demandé.",
  },
  seances: [
    {
      numero: 1,
      titre: "Entrer dans NOVA sur un tour d'essai",
      dureeMinutes: 120,
      tourJoue: null,
      essai: true,
      processus: ["UE6 · Finance d'entreprise", "UE11 · Contrôle de gestion"],
      objectif:
        "Apprendre le jeu avant que rien ne compte : lire le mandat de NOVA, ses trois références et son atelier, jouer un trimestre d'essai de bout en bout, lire ses premiers résultats, puis lancer la vraie partie.",
      competences: [
        "Je présente une entreprise manufacturière en une page : ce qu'elle fabrique, sa capacité et les leviers financiers ouverts au niveau Stratégie.",
        "Je repère, sur l'écran de décision, les choix de production, de financement et d'investissement disponibles.",
        "Je lis un premier compte de résultat et un premier bilan simplifié, et je distingue résultat, trésorerie et structure financière.",
      ],
      notions: [
        "cycle d'exploitation et besoin en fonds de roulement",
        "structure financière et effet de levier",
        "marge sur coût variable et seuil de rentabilité",
        "compte de résultat, bilan et tableau de flux",
      ],
      preparation:
        "Créez la partie depuis votre espace avec ces réglages : scénario nova-gamme, un trimestre par tour, niveau Stratégie, quatre tours, cinq équipes, deux concurrents machine, TVA activée, monde variable coché, questions de connaissances désactivées, et dans « Tour d'essai » un tour, sans cocher l'enchaînement automatique : c'est vous qui commencerez la vraie partie depuis l'ardoise en fin de séance. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe. Prévenez que le monde variable est actif dès l'essai.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : six séances, un tour d'essai qui ne compte pas puis quatre trimestres, une seule entreprise, un document rendu à chaque fin de séance, et un monde variable qui distingue bonne décision et bon résultat. Les équipes rejoignent la partie avec le code et nomment leur entreprise.",
        },
        {
          minutes: 25,
          titre: "L'entreprise, lue à l'écran",
          detail:
            "Chaque équipe lit le mandat de NOVA, ses trois références avec leur coût et leur marge, la capacité de l'atelier, les lignes de financement disponibles et les premiers indicateurs de structure. Elle remplit la première moitié de sa fiche d'identité : références, capacité, structure financière de départ.",
        },
        {
          minutes: 25,
          titre: "Le tour d'essai",
          detail:
            "Le bandeau de l'arène dit que rien ne compte. Chaque équipe lit la situation du trimestre, décide de son mix, de son investissement éventuel et de son financement, puis saisit ses décisions. Vous ne corrigez rien : un levier mal calibré est exactement ce que l'essai est fait pour absorber.",
        },
        {
          minutes: 20,
          titre: "Clôture de l'essai et premiers résultats",
          detail:
            "Vous clôturez le tour d'essai depuis votre espace. Chaque équipe lit son chiffre d'affaires, son résultat, sa trésorerie et ses ratios de structure, et reporte les chiffres clés sur sa fiche d'identité.",
        },
        {
          minutes: 20,
          titre: "Ce que l'essai apprend",
          detail:
            "Vous affichez deux équipes côte à côte : un mix, un résultat, une trésorerie, un ratio d'endettement. Qui a gagné le plus, qui est le plus solide, et pourquoi ce n'est pas la même équipe. Un éventuel aléa du monde variable est lu ensemble.",
        },
        {
          minutes: 20,
          titre: "La vraie partie commence",
          detail:
            "Les équipes terminent leur fiche d'identité. Vous appuyez sur « Commencer la vraie partie » depuis l'ardoise, vous confirmez, et toutes les entreprises repartent de l'état initial. Les équipes voient le bandeau de départ et lisent la situation du premier trimestre, cette fois pour de vrai.",
        },
      ],
      livrable:
        "La fiche d'identité de NOVA, une page : références et coûts, capacité de l'atelier, structure financière de départ, leviers disponibles au niveau Stratégie, et les chiffres clés du tour d'essai.",
      tracePasseport:
        "J'ai présenté une entreprise manufacturière sur une page à partir de ses écrans de décision et de ses premiers résultats d'essai, pour ouvrir mon portfolio de compétences.",
      evaluation: [
        "Les trois références sont listées avec leur marge unitaire.",
        "La structure financière de départ est renseignée avec les leviers disponibles.",
        "Les chiffres clés de l'essai sont exacts, et la distinction entre résultat et trésorerie est relevée.",
      ],
    },
    {
      numero: 2,
      titre: "Diagnostic financier d'ouverture",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: ["UE6 · Finance d'entreprise", "UE11 · Contrôle de gestion"],
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
        "Rien à créer : la vraie partie a commencé en fin de séance d'essai ; reprenez-la depuis votre espace, avec les équipes de trois constituées pour l'essai. Préparez la trame de note de diagnostic en deux pages maximum, et rappelez que le monde variable, annoncé dès la première séance, est activé, ce qui change la façon dont les résultats se lisent.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : six séances, quatre trimestres, une entreprise, un livrable par séance, et un rapport soutenu à la fin. Les équipes rejoignent la partie.",
        },
        {
          minutes: 25,
          titre: "Bilan fonctionnel et soldes",
          detail:
            "Chaque équipe reconstruit le bilan fonctionnel d'ouverture et calcule les soldes intermédiaires, en se partageant le travail : un membre le bilan, un autre les soldes, le troisième l'équilibre entre les deux, puis mise en commun. Le détail des calculs se finit dans la note, hors séance.",
        },
        {
          minutes: 15,
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
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit ses états financiers et son équilibre fonctionnel recalculé.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Deux équipes exposent leur diagnostic. Vous relevez les écarts de lecture entre elles plutôt que de trancher : l'entreprise le fera au trimestre suivant. La note de diagnostic se finit hors séance, pour la séance suivante.",
        },
      ],
      livrable:
        "La note de diagnostic financier, deux pages : bilan fonctionnel reconstruit, soldes intermédiaires commentés, hiérarchie des problèmes financiers, et la décision du trimestre justifiée par ce diagnostic.",
      tracePasseport:
        "J'ai tiré une décision de gestion du diagnostic financier d'une entreprise, établi par le bilan fonctionnel et les soldes intermédiaires.",
      evaluation: [
        "L'équilibre entre fonds de roulement, besoin en fonds de roulement et trésorerie est vérifié, pas seulement affiché.",
        "Les soldes intermédiaires servent à expliquer le résultat, ils ne sont pas récités.",
        "Les problèmes sont hiérarchisés, avec un premier problème désigné et défendu.",
      ],
    },
    {
      numero: 3,
      titre: "Coûts, seuil et levier",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: ["UE11 · Contrôle de gestion", "UE6 · Finance d'entreprise"],
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
        "Préparez un tableau vierge à deux colonnes pour la ventilation des charges, que les équipes rempliront à partir de leurs propres états. Prévoyez de laisser ouverte la question des charges semi-variables : c'est là que le travail est intéressant. À préparer par les équipes avant la séance : la ventilation des charges du premier trimestre en variables et fixes, à partir de leurs états, les cas limites notés sans être tranchés, et la note de diagnostic de la séance précédente rendue.",
      deroule: [
        {
          minutes: 10,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe confronte sa hiérarchie de problèmes au résultat obtenu, en une phrase.",
        },
        {
          minutes: 25,
          titre: "Ventiler les charges",
          detail:
            "L'équipe part de la ventilation préparée avant la séance et défend ses cas limites devant une autre équipe, qui conteste. Aucune ventilation n'est évidente, et c'est le point de la séance.",
        },
        {
          minutes: 25,
          titre: "Seuil, marge de sécurité, levier",
          detail:
            "L'équipe calcule les trois indicateurs et interprète son levier : à ce niveau, une baisse de dix pour cent des ventes coûte combien de résultat.",
        },
        {
          minutes: 25,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, avec la prévision de résultat déposée avant clôture. Elle sera confrontée au réel à la séance suivante.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le monde variable étant activé, l'écart entre prévision et réel n'est pas seulement imputable aux décisions, et il faut le nommer tout de suite.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare les leviers opérationnels des équipes et leurs résultats. Le levier le plus élevé n'est pas toujours celui qui gagne, et jamais celui qui dort tranquille. Le dossier de coûts se finit hors séance.",
        },
      ],
      livrable:
        "Le dossier de coûts : la ventilation des charges avec la justification des cas limites, le seuil de rentabilité, la marge de sécurité, le levier opérationnel et son interprétation en risque.",
      tracePasseport:
        "J'ai interprété le levier opérationnel d'une entreprise en termes de risque, après avoir ventilé ses charges selon leur variabilité.",
      evaluation: [
        "Les cas limites de ventilation sont argumentés, pas tranchés au hasard.",
        "La marge de sécurité est exprimée et commentée, pas seulement calculée.",
        "Le levier est traduit en risque, avec un ordre de grandeur chiffré.",
      ],
    },
    {
      numero: 4,
      titre: "Investir et financer",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: ["UE6 · Finance d'entreprise", "UE11 · Contrôle de gestion"],
      objectif:
        "Décider d'un investissement de capacité, choisir son financement, et construire le budget du trimestre qui s'ouvre avec l'investissement dedans : ses effets arrivent au trimestre suivant, et c'est là qu'on les mesurera.",
      competences: [
        "J'évalue un projet d'investissement à partir des flux qu'il génère et non de son coût seul.",
        "Je compare des modes de financement sur leur coût et sur ce qu'ils font à la structure du bilan.",
        "Je construis un plan de trésorerie et un budget de trimestre dont j'écris les hypothèses avant de connaître le réel.",
      ],
      notions: [
        "flux de trésorerie d'un projet",
        "capacité d'autofinancement",
        "structure de financement",
        "effet de levier financier",
        "plan de trésorerie",
      ],
      preparation:
        "Vérifiez que le niveau de la partie ouvre bien l'investissement et le placement, sans quoi la séance perd son support. Rappelez aux équipes que la banque du jeu ne prête pas au-delà de deux fois les capitaux propres : c'est cette limite, et non la qualité de leurs prévisions, qui décidera de ce qu'elles pourront financer. Le jeu vend une étude de projet à 1 200 € qui donne la VAN et le TRI de l'investissement envisagé : faites-la acheter par au moins une équipe. L'apport en capital est plafonné à 100 000 € sur la partie, et l'emprunt par le rapport entre dettes et capitaux propres. Une capacité achetée ce trimestre n'entre en service qu'au suivant : dites-le avant que les équipes ne décident, sinon elles chercheront l'effet au mauvais endroit. À préparer par les équipes avant la séance : les hypothèses de volume et de prix du projet d'investissement de capacité, écrites, et les flux de trésorerie qu'elles donnent trimestre par trimestre, à partir du trimestre suivant.",
      deroule: [
        {
          minutes: 10,
          titre: "Retour sur le trimestre",
          detail:
            "Chaque équipe confronte la prévision de résultat déposée à la séance précédente et le réel obtenu, en une phrase, sans décomposer encore.",
        },
        {
          minutes: 25,
          titre: "Le projet",
          detail:
            "L'équipe part des hypothèses et des flux préparés avant la séance, les confronte à l'étude de projet si elle l'a achetée, et tranche sur la valeur du projet. Le coût d'acquisition ne suffit jamais à décider, et les flux commencent au trimestre suivant, pas à celui-ci.",
        },
        {
          minutes: 20,
          titre: "Comment le financer",
          detail:
            "L'équipe compare l'autofinancement, l'emprunt et le renforcement des capitaux, sur leur coût et sur ce qu'ils font au bilan. L'effet de levier se discute ici avec des chiffres, pas en principe.",
        },
        {
          minutes: 30,
          titre: "Plan de trésorerie, budget et décisions",
          detail:
            "L'équipe construit son plan dans le cockpit, écrit le budget du trimestre qui s'ouvre avec ses hypothèses de volume, de prix et de coûts, puis prend ses décisions. Le plan n'est pas déposé dans le jeu : il sert à voir venir le point de tension, et c'est le rapport entre dette et capitaux propres qui bornera l'emprunt. Le budget, lui, sera confronté au réel à la séance suivante.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Chaque équipe lit ce que la banque lui a réellement consenti, et le compare à ce que son plan annonçait. La capacité achetée n'apparaît pas encore dans les volumes : elle entre en service au trimestre suivant.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare les projets financés et ceux qui ne l'ont pas été, et surtout par quoi. L'équipe qui a tout financé par emprunt bute sur le plafond de la banque quand la suivante, qui a renforcé ses capitaux propres, peut encore emprunter : l'effet de levier a ses deux faces, et la leçon est difficile à faire passer autrement. Le dossier d'investissement se finit hors séance.",
        },
      ],
      livrable:
        "Le dossier d'investissement : l'évaluation du projet par ses flux avec hypothèses écrites, la comparaison des modes de financement, le plan de trésorerie du cockpit, le budget du trimestre qui s'ouvre, et les conditions bancaires obtenues avec leur explication.",
      tracePasseport:
        "J'ai évalué un projet d'investissement par ses flux, comparé des modes de financement et défendu un plan de trésorerie devant un prêteur.",
      evaluation: [
        "Le projet est évalué par ses flux, jamais par son seul coût d'acquisition.",
        "Les modes de financement sont comparés sur le coût et sur la structure du bilan.",
        "Les conditions bancaires obtenues sont expliquées par la tenue de la trésorerie des trimestres précédents, pas subies.",
      ],
    },
    {
      numero: 5,
      titre: "Budget et analyse des écarts",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: ["UE11 · Contrôle de gestion"],
      objectif:
        "Décomposer l'écart constaté entre le budget construit à la séance précédente et le réel, entre ce qui relève du prix, du volume et des coûts, puis budgéter le dernier trimestre avec la capacité nouvelle dedans.",
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
        "C'est la séance centrale de l'atelier et la plus exigeante. Préparez la trame de décomposition des écarts et prévoyez d'y consacrer tout le temps annoncé. Les équipes auront besoin du budget écrit à la séance précédente : vérifiez qu'elles l'ont conservé. C'est aussi le trimestre où la capacité achetée entre en service : l'écart sur volume portera sa marque, et une équipe qui l'a budgétée au prix de l'ancien outil se trompera d'explication. À préparer par les équipes avant la séance : la décomposition de l'écart entre le budget écrit à la séance précédente et le réel du trimestre, en écart sur prix, sur volume et sur coûts, chaque composante calculée sur la trame ; la vérification par la somme et l'imputation se font en séance.",
      deroule: [
        {
          minutes: 10,
          titre: "Prévision contre réel",
          detail:
            "Chaque équipe affiche l'écart brut entre le budget construit à la séance précédente et le résultat obtenu. Personne ne commente encore.",
        },
        {
          minutes: 25,
          titre: "Décomposer l'écart",
          detail:
            "L'équipe part des trois écarts calculés avant la séance, sur prix, sur volume et sur coûts, et vérifie que leur somme retombe sur l'écart global ; ce qui ne retombe pas se recalcule ici. Le contrôle par la somme est la discipline de la séance.",
        },
        {
          minutes: 20,
          titre: "Décision ou marché",
          detail:
            "Pour chaque composante, l'équipe se prononce : est-ce moi ou est-ce le marché. Le monde variable étant activé, les deux coexistent, et les séparer est exactement ce que le contrôle de gestion apporte.",
        },
        {
          minutes: 30,
          titre: "Budget du dernier trimestre et décisions",
          detail:
            "L'équipe construit le budget du trimestre qui s'ouvre, en écrivant ses hypothèses, la capacité nouvelle comprise, puis saisit ses décisions.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le dernier trimestre joué. Le budget qui vient d'être construit est confronté au réel séance tenante, et l'investissement décidé à la séance précédente livre enfin ses volumes : c'est cet écart-là que le rapport de gestion devra expliquer.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare les décompositions. Deux équipes ayant subi le même événement de marché mais l'ayant imputé différemment font à elles seules le cours sur la limite de l'exercice. Le dossier budgétaire se finit hors séance.",
        },
      ],
      livrable:
        "Le dossier budgétaire : le budget du trimestre écoulé avec ses hypothèses, la décomposition de l'écart en trois composantes vérifiée par leur somme, l'imputation de chacune, et le budget du dernier trimestre avec la capacité nouvelle.",
      tracePasseport:
        "J'ai décomposé l'écart entre un budget que j'avais construit et le réel, en distinguant ce qui relevait de mes décisions de ce qui relevait du marché.",
      evaluation: [
        "La somme des trois écarts retombe sur l'écart global, et le contrôle est montré.",
        "Les hypothèses du budget sont écrites avant la clôture, donc opposables.",
        "L'imputation entre décision et marché est argumentée, pas commode.",
      ],
    },
    {
      numero: 6,
      titre: "Rapport de gestion et soutenance",
      dureeMinutes: 120,
      tourJoue: null,
      processus: [
        "UE6 · Finance d'entreprise",
        "UE11 · Contrôle de gestion",
        "UE13 · Communication professionnelle",
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
        "Remettez la grille de soutenance à la séance précédente. Prévoyez un jury où siège au moins un collègue ou un professionnel, et un ordre de passage tiré au sort. Huit minutes de soutenance et quatre minutes de questions par équipe. Le rapport se rédige entre les deux dernières séances : la séance de soutenance sert à le finir, pas à l'écrire. À préparer par les équipes avant la séance : le rapport de gestion rédigé en entier, quatre pages au maximum, relu par chaque membre.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille et tirage de l'ordre de passage. Les équipes savent que les questions porteront d'abord sur leurs hypothèses.",
        },
        {
          minutes: 20,
          titre: "Rédaction du rapport",
          detail:
            "Les équipes finissent leur rapport, rédigé entre les deux séances : diagnostic d'ouverture, décisions, écarts, situation de sortie, préconisations. Quatre pages au maximum, et le temps de la séance ne suffit pas à l'écrire depuis rien : il sert à vérifier les chiffres et à couper.",
        },
        {
          minutes: 15,
          titre: "Préparation de la soutenance",
          detail:
            "Répartition de la parole et anticipation des questions. Vous repérez les rapports où une hypothèse fausse a été discrètement effacée : c'est exactement ce que le jury doit trouver.",
        },
        {
          minutes: 60,
          titre: "Soutenances",
          detail:
            "Passage des équipes devant le jury, huit minutes de présentation et quatre minutes de questions. Les questions portent sur les méthodes autant que sur les résultats.",
        },
        {
          minutes: 15,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement puis vous l'écartez : la note vient du rapport et de la soutenance. Chaque candidat rédige les phrases de son portfolio de compétences.",
        },
      ],
      livrable:
        "Le rapport de gestion, quatre pages : diagnostic d'ouverture, décisions et leurs justifications, analyse des écarts, situation financière de sortie, deux préconisations chiffrées, plus la soutenance de huit minutes.",
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
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines.",
      comment:
        "Une séance par semaine. L'intervalle est nécessaire ici : la décomposition des écarts et le dossier d'investissement demandent un travail personnel entre deux séances.",
    },
    {
      nom: "Séminaire de trois jours",
      quand: "En stage intensif de préparation, hors période d'examen.",
      comment:
        "La séance d'essai la veille, puis deux séances les deux premiers jours, la soutenance le troisième. Le rythme convient à des candidats déjà à l'aise avec les documents de synthèse ; il est trop dur pour une première année.",
    },
    {
      nom: "Fil rouge sur deux unités",
      quand:
        "Quand l'atelier accompagne la finance d'entreprise et le contrôle de gestion.",
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
    "Créer la partie sur six tours et confier, sur les deux derniers, la trésorerie excédentaire à placer, ce que le niveau retenu autorise.",
    "Faire rejouer la partie par une autre promotion sur la même graine, et comparer les décisions prises aux mêmes moments.",
  ],
  faq: [
    {
      question:
        "Pourquoi activer le monde variable alors que les ateliers de BTS le désactivent ?",
      reponse:
        "Parce que la distinction entre une bonne décision et un bon résultat est ici un objectif, et non un obstacle. Un candidat au DCG doit pouvoir défendre une décision qui a mal tourné, et l'analyse des écarts n'a de sens que s'il existe une part que les décisions n'expliquent pas. Le revers est que vos corrigés ne sont pas transposables d'une classe à l'autre : c'est le prix à payer, et il est assumé.",
    },
    {
      question: "Deux unités d'enseignement seulement, n'est-ce pas peu ?",
      reponse:
        "C'est un choix. La finance d'entreprise et le contrôle de gestion sont les deux unités que la simulation sert réellement, et nous préférons deux unités bien couvertes à une liste qui donnerait le change. Le management et le droit des sociétés se rattachent au déroulé par des prolongements, pas par les séances elles-mêmes.",
    },
    {
      question:
        "Le niveau de jeu est le plus élevé de la plateforme après le niveau exécutif, est-ce tenable ?",
      reponse:
        "Il l'est pour des candidats qui savent déjà lire un bilan, ce qui est le cas au DCG. Il ne le serait pas en première année de BTS, où le nombre de décisions simultanées noierait les équipes. Le niveau se fixe à la création et ne change plus en cours de partie : si votre groupe est hétérogène, créez la partie au niveau Arbitrage, qui garde l'investissement et le financement mais retire le placement.",
    },
    {
      question:
        "La séance d'analyse des écarts tient-elle vraiment en deux heures ?",
      reponse:
        "Elle le peut, à condition que les trois écarts aient été calculés avant la séance, comme la fiche le demande, et que la décomposition ait été préparée en amont sur un cas court : la séance vérifie par la somme et impute, elle ne calcule pas depuis rien. C'est la séance la plus exigeante de l'atelier et la seule qu'il ne faut pas raccourcir : si vous devez gagner du temps, prenez-le sur la séance de coûts, dont une partie peut être traitée en travail personnel.",
    },
    {
      question:
        "Peut-on utiliser cet atelier pour préparer l'épreuve orale du diplôme ?",
      reponse:
        "La dernière séance est construite pour l'UE13, communication professionnelle : rapport écrit court, soutenance chronométrée, questions portant sur les méthodes. Ce qu'elle ne remplace pas, c'est l'expérience professionnelle attendue par l'épreuve. Elle donne en revanche un entraînement à l'exercice le plus redouté, défendre ses propres chiffres devant quelqu'un qui les interroge.",
    },
  ],
};
