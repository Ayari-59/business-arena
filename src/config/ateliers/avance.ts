import type { AtelierDefinition } from "./types";

/**
 * ATELIER D'APPROFONDISSEMENT · NIVEAU AVANCÉ.
 *
 * Six séances de trois heures sur le transport, choisi pour la richesse de ses
 * arbitrages : deux clientèles qui s'opposent, des contrats industriels
 * réguliers mais exigeants et une bourse de fret qui remplit les retours, des
 * délais de règlement qui creusent le besoin en fonds de roulement, une flotte
 * que l'on peut posséder ou sous-traiter, et un pic de demande qui met la
 * capacité sous tension. Le niveau ouvre tous les leviers de gestion, et le
 * monde variable est activé : ici une bonne décision peut mal finir, ce qui est
 * le vrai métier.
 *
 * Cinq trimestres joués, un pic au quatrième, puis une sixième séance qui bâtit
 * le diagnostic stratégique et le défend. Cet atelier suppose des équipes déjà
 * rodées à la gestion : il n'apprend pas les notions, il apprend à les tenir
 * ensemble sous incertitude.
 */
export const ATELIER_AVANCE: AtelierDefinition = {
  code: "avance",
  titre: "Piloter sous incertitude une entreprise de transport",
  diplome: "Approfondissement, toutes filières",
  annee: "Niveau avancé",
  nature: "Atelier d'approfondissement",
  traceLabel: "dossier de synthèse",
  referentielLabel: "Compétences de gestion",
  referentielAccord: "mobilisées",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même entreprise de transport sur cinq trimestres, arbitre entre contrats industriels et bourse de fret, finance un besoin en fonds de roulement qui s'emballe, investit ou sous-traite sa flotte, place ses excédents, et affronte un monde variable où l'aléa a le dernier mot. Un diagnostic stratégique clôt le tout.",
  resume:
    "Cinq trimestres à la tête d'un transporteur, du mix de clientèles au diagnostic stratégique, sous un monde variable où l'aléa fait partie du jeu.",
  difficulte: 4,
  difficulteLabel: "Avancé",
  format: "6 séances de 3 h",
  pourquoi:
    "Une équipe qui maîtrise chaque notion séparément échoue encore à les tenir ensemble, parce que la réalité ne pose jamais un problème à la fois. Ici la décision de flotte engage la trésorerie, le choix des contrats fixe le besoin en fonds de roulement, le pic impose un recrutement qu'il faudra financer, et le monde variable défait parfois le raisonnement le plus juste. L'équipe apprend que la bonne stratégie n'est pas celle qui gagne à tous les coups, mais celle qui survit à un mauvais trimestre sans se rompre, et cela ne s'enseigne qu'en le vivant sur plusieurs tours enchaînés.",
  reglages: {
    scenarioCode: "transport",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 5,
    niveauNom: "Stratégie",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: true,
    quizMode: "Questions de connaissances activées",
    tours: 5,
    effectifParEquipe: "quatre élèves",
    notes:
      "Le transport oppose des contrats industriels réguliers et une bourse de fret plus volatile, avec des délais de règlement qui pèsent sur la trésorerie et une flotte lourde à financer. Le niveau retenu ouvre tous les leviers : trésorerie, assurance, recrutement, investissement et placement des excédents. Le monde variable est activé volontairement : à ce niveau, l'aléa fait partie de l'exercice, et l'objet de l'atelier est d'apprendre à décider quand même. Réservez cet atelier à des équipes déjà rodées.",
  },
  seances: [
    {
      numero: 1,
      titre: "Lire la rentabilité au kilomètre",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Volet 1 · Analyser les coûts et la rentabilité",
        "Volet 2 · Construire une stratégie commerciale",
      ],
      objectif:
        "Reconstituer le coût de revient d'un kilomètre parcouru et la marge de chaque clientèle, pour décider d'un premier mix entre contrats et fret.",
      competences: [
        "Je calcule un coût de revient au kilomètre à partir des charges d'un transporteur.",
        "Je compare la marge d'un contrat industriel à celle d'un chargement de la bourse de fret.",
        "Je décide d'un premier équilibre entre une clientèle régulière et une clientèle volatile.",
      ],
      notions: [
        "coût de revient kilométrique",
        "taux de remplissage des retours",
        "marge par clientèle",
        "mix de clientèles",
        "charges fixes d'une flotte",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez des équipes de quatre, une par domaine : coûts, commercial, flotte, finance. Imprimez la fiche de coût kilométrique vierge. Prévenez que le monde variable est actif : une décision juste pourra mal tourner, et ce ne sera pas une erreur.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre et le contrat",
          detail:
            "Vous annoncez la règle : six séances, cinq trimestres, un seul transporteur, un document rendu à chaque fois, et un monde qui réserve des surprises. Les équipes rejoignent la partie.",
        },
        {
          minutes: 35,
          titre: "Le coût d'un kilomètre",
          detail:
            "Chaque équipe reconstitue ce que coûte un kilomètre parcouru, charges de flotte comprises, qu'un camion roule chargé ou revienne à vide.",
        },
        {
          minutes: 35,
          titre: "Deux clientèles qui s'opposent",
          detail:
            "L'équipe compare la marge d'un contrat industriel, régulier mais exigeant, et celle d'un chargement de la bourse de fret, opportuniste et volatile. Le mix n'est pas neutre.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose un arbitrage à deux issues. L'équipe tranche son mix de clientèles et son prix, motive son choix, puis saisit ses décisions.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, sa marge par clientèle et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur coût kilométrique et leur mix, et les confrontent à leur résultat. Vous affichez les deux comptes de résultat côte à côte.",
        },
      ],
      livrable:
        "La fiche de rentabilité, une page : le coût de revient au kilomètre, la marge de chaque clientèle, le mix retenu entre contrats et fret, et sa justification chiffrée.",
      tracePasseport:
        "J'ai calculé la rentabilité au kilomètre d'un transporteur et arbitré un mix entre une clientèle régulière et une clientèle volatile.",
      evaluation: [
        "Le coût kilométrique intègre les charges de flotte, pas seulement le carburant.",
        "La marge de chaque clientèle est calculée, pas estimée.",
        "Le mix retenu est justifié par les marges, pas par une préférence.",
      ],
    },
    {
      numero: 2,
      titre: "Financer le besoin en fonds de roulement",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Volet 3 · Piloter la trésorerie et le financement",
        "Volet 1 · Analyser les coûts et la rentabilité",
      ],
      objectif:
        "Mesurer comment les délais de règlement des contrats creusent le besoin en fonds de roulement, et décider d'un financement du cycle sans étrangler la trésorerie.",
      competences: [
        "Je relie le besoin en fonds de roulement d'un transporteur aux délais de règlement de ses clients.",
        "Je construis un plan de trésorerie et j'y repère le point de tension du trimestre.",
        "Je choisis un financement de court terme en pesant son coût contre le risque de rupture.",
      ],
      notions: [
        "besoin en fonds de roulement",
        "délai de règlement client",
        "plan de trésorerie",
        "financement court terme",
        "coût du découvert",
      ],
      preparation:
        "Rouvrez la fiche notion sur le besoin en fonds de roulement. Préparez un tableau où chaque équipe inscrira, avant la clôture, le solde de trésorerie qu'elle prévoit et le financement qu'elle mobilise.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le premier trimestre",
          detail:
            "Chaque équipe relit son résultat et l'aléa qu'elle a subi ou évité. Vous notez qui a gagné en résultat mais perdu en trésorerie.",
        },
        {
          minutes: 40,
          titre: "Le cycle qui avance de l'argent",
          detail:
            "Les équipes reconstituent leur cycle : elles paient carburant, péages et salaires avant d'encaisser des contrats réglés à long délai. Plus les contrats pèsent, plus le besoin en fonds de roulement gonfle.",
        },
        {
          minutes: 30,
          titre: "Financer sans étrangler",
          detail:
            "Chaque équipe projette son solde de trésorerie et décide comment elle couvre le creux : financement court terme, arbitrage du mix vers du fret payé plus vite, ou report d'une dépense. Chaque option porte son coût.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son mix, son prix et son financement, et écrit le solde qu'elle attend. Cette prévision sera relue au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le solde de trésorerie réalisé apparaît à côté du solde prévu, et le coût du financement se lit dans le résultat.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a couru après sa trésorerie et une équipe qui l'a anticipée. La question qui reste ouverte : le confort de trésorerie se paie-t-il en marge.",
        },
      ],
      livrable:
        "Le plan de trésorerie du trimestre : besoin en fonds de roulement estimé, solde prévu, financement retenu avec son coût, et l'écart au solde réalisé après clôture.",
      tracePasseport:
        "J'ai financé le besoin en fonds de roulement d'un transporteur en pesant le coût du financement court terme contre le risque de rupture de trésorerie.",
      evaluation: [
        "Le besoin en fonds de roulement est relié aux délais de règlement des contrats.",
        "Le financement retenu est chiffré avec son coût, pas seulement cité.",
        "Le point de tension du trimestre est repéré avant la clôture.",
      ],
    },
    {
      numero: 3,
      titre: "Investir dans la flotte ou sous-traiter",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Volet 1 · Analyser les coûts et la rentabilité",
        "Volet 4 · Décider en avenir incertain",
      ],
      objectif:
        "Décider s'il faut investir dans des camions ou sous-traiter la capacité manquante, en pesant l'engagement d'un actif lourd contre la souplesse d'une charge variable.",
      competences: [
        "Je compare le coût complet d'un camion possédé à celui d'une capacité sous-traitée.",
        "J'évalue le risque d'un investissement lourd face à une demande incertaine.",
        "Je décide d'un investissement de flotte en assumant l'engagement qu'il représente.",
      ],
      notions: [
        "investissement et amortissement",
        "coût de possession d'un actif",
        "sous-traitance et charge variable",
        "capacité et flexibilité",
        "engagement irréversible",
      ],
      preparation:
        "Relisez la capacité de la flotte et la demande à venir. Préparez au tableau une grille à deux colonnes, posséder ou sous-traiter, que les équipes rempliront. Rappelez que le monde variable peut faire mentir la prévision, et que c'est justement l'objet du choix.",
      deroule: [
        {
          minutes: 20,
          titre: "Relecture des prévisions",
          detail:
            "Chaque équipe confronte son solde prévu à son solde réel, et dit où en est sa trésorerie avant d'engager un investissement lourd.",
        },
        {
          minutes: 40,
          titre: "Posséder ou louer la capacité",
          detail:
            "Les équipes comparent le coût complet d'un camion acheté, amortissement et entretien compris, à celui d'une capacité sous-traitée au coup par coup. L'un engage, l'autre coûte plus cher à l'unité.",
        },
        {
          minutes: 30,
          titre: "Décider en avenir incertain",
          detail:
            "Chaque équipe remplit la grille et tranche : elle investit, sous-traite, ou combine les deux, en écrivant à quelle condition son choix reste bon si la demande déçoit.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son investissement, son mix et son prix, et inscrit la marge supplémentaire qu'elle attend de sa capacité.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. L'effet de l'investissement, sur la capacité comme sur la trésorerie, apparaît dans les résultats, et le monde variable a parfois tranché à la place des équipes.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare les équipes qui ont investi et celles qui ont sous-traité, y compris celles qu'un aléa a punies d'un bon choix. La question qui reste ouverte : un bon choix qui finit mal était-il un mauvais choix.",
        },
      ],
      livrable:
        "La note d'investissement : le coût complet d'un camion possédé face à la sous-traitance, la décision retenue, la condition qui la rend bonne, et la marge supplémentaire attendue.",
      tracePasseport:
        "J'ai arbitré entre investir dans une flotte et sous-traiter la capacité, en pesant l'engagement d'un actif lourd contre l'incertitude de la demande.",
      evaluation: [
        "Le coût complet de possession est comparé au coût de la sous-traitance.",
        "La décision énonce la condition à laquelle elle reste bonne si la demande déçoit.",
        "L'engagement irréversible de l'investissement est assumé, pas minimisé.",
      ],
    },
    {
      numero: 4,
      titre: "Absorber le pic : capacité et recrutement",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Volet 2 · Construire une stratégie commerciale",
        "Volet 3 · Piloter la trésorerie et le financement",
      ],
      objectif:
        "Servir le trimestre où la demande culmine sans casser la qualité de service, en dimensionnant la capacité et le recrutement des conducteurs qu'elle exige.",
      competences: [
        "J'anticipe un pic de demande à partir de la saisonnalité et de mes trimestres précédents.",
        "Je dimensionne un recrutement de conducteurs face à une capacité que la flotte seule ne couvre pas.",
        "Je tiens ensemble la qualité de service, la marge et la trésorerie d'un trimestre de pointe.",
      ],
      notions: [
        "pic de demande et saturation",
        "recrutement et masse salariale",
        "qualité de service et pénalités de retard",
        "arbitrage entre contrats et fret",
        "tension de trésorerie de croissance",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer tout le temps annoncé. Préparez la fiche de plan de pointe, où l'équipe écrira sa capacité cible, son recrutement et son solde de trésorerie attendus AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le trimestre",
          detail:
            "Vous rappelez sans chiffre que la demande va culminer. Les équipes retrouvent seules l'ampleur du pic dans les informations du jeu, et mesurent l'écart avec leur capacité.",
        },
        {
          minutes: 40,
          titre: "Plan de pointe",
          detail:
            "Chaque équipe construit son plan : la capacité qu'elle vise, le recrutement de conducteurs qu'elle engage, les contrats qu'elle honore en priorité si tout ne peut pas être servi. Rien n'est saisi à ce stade.",
        },
        {
          minutes: 30,
          titre: "Le coût de mal servir",
          detail:
            "L'équipe chiffre les deux fautes : refuser du chargement rentable faute de capacité, ou promettre plus qu'elle ne peut tenir et payer des pénalités de retard. Puis elle choisit son risque.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie de la capacité, du recrutement, du mix et du prix. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre de pointe. Les écarts entre équipes sont les plus larges de l'atelier, et le monde variable a corsé la note pour certaines.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. La question finale : celle qui a le plus roulé est-elle celle qui a le mieux servi et le mieux gagné.",
        },
      ],
      livrable:
        "La fiche de plan de pointe : la capacité et le recrutement retenus, les contrats servis en priorité, les deux fautes chiffrées, le risque choisi, et l'écart constaté après clôture.",
      tracePasseport:
        "J'ai dimensionné la capacité et le recrutement d'un transporteur pour absorber un pic de demande, en arbitrant entre le chargement refusé et le retard pénalisé.",
      evaluation: [
        "Le recrutement est dimensionné sur l'écart entre la demande et la capacité de la flotte.",
        "Les deux fautes, refuser et mal tenir, sont chiffrées.",
        "La priorité donnée aux contrats est justifiée par leur marge et leur régularité.",
      ],
    },
    {
      numero: 5,
      titre: "Placer les excédents de trésorerie et gérer l'aléa",
      dureeMinutes: 180,
      tourJoue: 5,
      processus: [
        "Volet 3 · Piloter la trésorerie et le financement",
        "Volet 4 · Décider en avenir incertain",
      ],
      objectif:
        "Employer les excédents de trésorerie dégagés par le pic plutôt que de les laisser dormir, tout en gardant la réserve qu'exige un monde où le trimestre suivant peut décevoir.",
      competences: [
        "Je décide d'un placement des excédents de trésorerie en gardant une réserve de sécurité.",
        "Je mesure ce que coûte une trésorerie qui dort face à ce que risque une trésorerie trop engagée.",
        "J'ajuste ma stratégie de clientèles après un aléa qui a défait une prévision.",
      ],
      notions: [
        "excédent de trésorerie",
        "placement et rendement",
        "réserve de sécurité",
        "gestion du risque",
        "révision de stratégie",
      ],
      preparation:
        "Projetez les soldes de trésorerie de la pointe. Préparez au tableau la question de la séance : que faire d'un excédent quand le trimestre suivant est incertain. Prévoyez que certaines équipes sortent du pic à sec, et adaptez leur travail à la couverture plutôt qu'au placement.",
      deroule: [
        {
          minutes: 20,
          titre: "Après la pointe",
          detail:
            "Chaque équipe fait le point de sa trésorerie après le pic : certaines débordent d'excédents, d'autres pansent un aléa. Le travail de la séance n'est pas le même pour toutes, et c'est voulu.",
        },
        {
          minutes: 40,
          titre: "Une trésorerie qui dort ne rapporte rien",
          detail:
            "Les équipes en excédent chiffrent ce que leur trésorerie inactive laisse perdre, et ce qu'un placement rapporterait, sans oublier la réserve qu'un monde variable impose de garder.",
        },
        {
          minutes: 30,
          titre: "Réviser la stratégie",
          detail:
            "Chaque équipe relit sa trajectoire et décide si son mix de clientèles tient encore. Un aléa a pu montrer qu'un contrat trop lourd fragilise : c'est le moment de corriger.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du placement ou de la couverture selon la situation, du mix révisé et du prix. Chaque équipe écrit ce qu'elle attend de son choix.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez l'avant-dernier trimestre. Le rendement d'un placement, ou le coût d'une couverture, apparaît dans le résultat de chaque équipe.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a fait travailler son excédent et une équipe qui l'a laissé dormir, sans oublier celle qu'un aléa a rattrapée. La question qui reste ouverte : jusqu'où placer quand demain est incertain.",
        },
      ],
      livrable:
        "La note de gestion des excédents : le montant disponible, la réserve gardée, le placement ou la couverture retenue avec son effet attendu, et la révision de stratégie qui l'accompagne.",
      tracePasseport:
        "J'ai employé les excédents de trésorerie d'une entreprise tout en gardant une réserve, et j'ai révisé une stratégie de clientèles après un aléa.",
      evaluation: [
        "Le placement laisse une réserve justifiée par l'incertitude du trimestre suivant.",
        "Le coût d'une trésorerie qui dort est comparé au rendement d'un placement.",
        "La révision de stratégie répond à un fait de la partie, pas à une lubie.",
      ],
    },
    {
      numero: 6,
      titre: "Bâtir le diagnostic stratégique",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Volet 2 · Construire une stratégie commerciale",
        "Volet 5 · Rendre compte et convaincre",
      ],
      objectif:
        "Construire le diagnostic stratégique des cinq trimestres, de la rentabilité à la résistance aux aléas, et le défendre oralement comme devant un comité de direction.",
      competences: [
        "Je construis un diagnostic stratégique qui relie la rentabilité, la trésorerie et la résistance au risque.",
        "Je choisis les indicateurs qui expliquent une trajectoire, et j'écarte ceux qui l'habillent.",
        "Je défends oralement une stratégie et ses arbitrages devant un jury qui conteste.",
      ],
      notions: [
        "diagnostic stratégique",
        "trajectoire de performance",
        "résistance aux aléas",
        "arbitrages structurants",
        "compte rendu à une direction",
      ],
      preparation:
        "Annoncez la soutenance à la séance précédente et donnez la grille d'évaluation. Prévoyez un ordre de passage tiré au sort et un temps de parole tenu au chronomètre pour chaque groupe. Préparez, pour le jury, une question qui oblige chaque équipe à assumer un arbitrage risqué.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille, tirage de l'ordre de passage. Chaque équipe disposera d'un temps de présentation court suivi de questions du jury, qui contestera au moins un arbitrage.",
        },
        {
          minutes: 50,
          titre: "Construction du diagnostic",
          detail:
            "Les équipes reprennent les cinq trimestres et bâtissent leur diagnostic. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié, dont un qui mesure la résistance aux aléas subis.",
        },
        {
          minutes: 20,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole, anticipation des objections du jury. Vous passez dans les équipes pour repérer les diagnostics qui masquent un mauvais trimestre plutôt que de l'assumer.",
        },
        {
          minutes: 75,
          titre: "Passage des équipes",
          detail:
            "Chaque équipe présente son diagnostic puis affronte les questions du jury, formé de vous et de deux élèves d'une autre équipe qui contestent au moins un arbitrage chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le diagnostic et sa défense. Chaque élève écrit les trois phrases de son dossier de synthèse.",
        },
      ],
      livrable:
        "Le diagnostic stratégique des cinq trimestres, une page, quatre indicateurs justifiés dont un de résistance au risque, plus la présentation orale qui le défend.",
      tracePasseport:
        "J'ai bâti le diagnostic stratégique d'une entreprise sur cinq trimestres et je l'ai défendu oralement devant un jury qui contestait mes arbitrages.",
      evaluation: [
        "Le diagnostic relie la rentabilité, la trésorerie et la résistance aux aléas.",
        "Chaque indicateur retenu est justifié par ce qu'il explique de la trajectoire.",
        "L'oral assume un arbitrage risqué et le défend, plutôt que de le masquer.",
      ],
    },
  ],
  formats: [
    {
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine entre deux séances laisse le temps de préparer un livrable exigeant, et à vous celui de le lire finement.",
    },
    {
      nom: "Deux semaines intensives",
      quand: "En module d'approfondissement ou de spécialité.",
      comment:
        "Trois séances par semaine sur deux semaines. Le rythme soutenu sert la mémoire des arbitrages, mais réservez ce tempo à des équipes qui tiennent la charge cognitive.",
    },
    {
      nom: "Fil rouge de projet",
      quand: "Quand l'atelier porte un projet tutoré ou une étude de cas filée.",
      comment:
        "Une séance toutes les deux semaines, chacune préparée par un travail personnel remis en amont. La partie reste ouverte entre deux séances, et le diagnostic final s'enrichit du temps long.",
    },
  ],
  evaluationFinale: [
    "Les six livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le diagnostic stratégique de la dernière séance, pour un quart.",
    "La soutenance et la défense des arbitrages devant le jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : sous monde variable, une équipe bien pilotée peut finir derrière un aléa, et son diagnostic vaut mieux que sa place.",
  ],
  prolongements: [
    "Rejouer la même partie avec un aléa différent pour montrer qu'une stratégie robuste résiste à plusieurs mondes, quand une stratégie chanceuse n'en tient qu'un.",
    "Basculer sur le secteur du bâtiment pour retrouver, sur un autre métier, la tension entre des marchés qui remplissent le planning et des clients qui règlent vite.",
    "Ouvrir le dernier niveau, où la distribution de dividendes s'ajoute aux arbitrages, pour poser la question de la rémunération de l'actionnaire face au financement de la croissance.",
  ],
  faq: [
    {
      question: "Faut-il avoir fait un atelier de gestion avant celui-ci ?",
      reponse:
        "Oui, franchement. Cet atelier suppose que les notions de marge, de seuil, de besoin en fonds de roulement et d'investissement soient déjà acquises : il n'apprend pas à les calculer, il apprend à les tenir ensemble sous incertitude. Une équipe qui découvre le coût de revient ici serait submergée. Passez d'abord par un atelier de section de technicien ou par l'animation de découverte.",
    },
    {
      question: "Pourquoi activer le monde variable, qui introduit de la chance ?",
      reponse:
        "Parce qu'à ce niveau, la chance est précisément l'objet. Une gestion qui ne réussit qu'en univers certain n'a rien appris du métier réel, où un aléa défait la meilleure prévision. Le monde variable oblige à décider en gardant des réserves, à préférer la robustesse à l'optimum, et à assumer qu'un bon choix puisse mal finir. C'est ce que la sixième séance demande de défendre.",
    },
    {
      question: "Cinq trimestres et six séances font un atelier long, peut-on le raccourcir ?",
      reponse:
        "Oui, en fusionnant les séances trois et cinq, celle de l'investissement et celle du placement, en une seule séance d'arbitrages financiers. Vous perdez la respiration entre engager et employer la trésorerie, mais l'atelier tient alors en cinq séances. Ne descendez pas en dessous : le pic de la quatrième a besoin de trois trimestres joués derrière lui.",
    },
    {
      question: "Le niveau ouvre tous les leviers, n'est-ce pas trop de décisions à la fois ?",
      reponse:
        "C'est justement l'exercice. Aux niveaux précédents, chaque atelier isole un levier ; ici l'enjeu est de les tenir ensemble, parce que la réalité ne les sépare jamais. Le déroulé aide en donnant à chaque séance un arbitrage dominant, mais il n'interdit pas aux équipes d'agir sur le reste. Une équipe qui se disperse le paiera, et cette leçon vaut d'être vécue.",
    },
    {
      question: "Comment noter une équipe qu'un aléa a punie malgré de bonnes décisions ?",
      reponse:
        "Sur ses décisions et sa lucidité, jamais sur son résultat. Une équipe qui a bien raisonné, gardé ses réserves, et qu'un aléa a tout de même rattrapée doit être mieux notée qu'une équipe qui a gagné par chance sans savoir pourquoi. Le diagnostic final est fait pour ça : il révèle qui a compris sa trajectoire, aléa compris.",
    },
  ],
};
