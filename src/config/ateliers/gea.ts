import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BUT / DUT GEA.
 *
 * Cinq séances de trois heures sur NOVA, l'industriel, choisi pour sa gestion
 * généraliste : on y fabrique un produit, donc on y calcule un coût de revient,
 * on y lit un compte de résultat, on y suit une trésorerie que le besoin en
 * fonds de roulement met sous tension, et on y arbitre un investissement de
 * capacité quand la demande monte. C'est le cœur du parcours de gestion des
 * entreprises et des administrations.
 *
 * Les quatre premières séances jouent un trimestre chacune et s'arrêtent sur la
 * montée en charge du quatrième, où un compte-clé fait basculer la demande. La
 * cinquième ne joue rien : elle établit le diagnostic financier et le présente.
 *
 * Le référentiel du BUT GEA n'a pas encore été confronté à son texte : le code
 * figure dans REFERENTIELS_NON_VERIFIES, et les blocs cités décrivent l'activité
 * de gestion sans prétendre reprendre le programme au mot.
 */
export const ATELIER_GEA: AtelierDefinition = {
  code: "gea",
  titre: "Analyser et piloter une entreprise industrielle",
  diplome: "BUT Gestion des entreprises et des administrations",
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "dossier professionnel",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Cinq séances de trois heures. Chaque équipe gère le même industriel d'un trimestre à l'autre, calcule ses coûts de revient, lit ses documents de synthèse, tient sa trésorerie sous la tension du besoin en fonds de roulement, arbitre un investissement, et rend à chaque séance un document de gestion.",
  resume:
    "Quatre trimestres à la tête d'un industriel, du coût de revient au diagnostic financier complet, avec la montée en charge d'un compte-clé comme épreuve.",
  difficulte: 3,
  difficulteLabel: "Pilotage",
  format: "5 séances de 3 h",
  pourquoi:
    "Le coût de revient se calcule au tableau et s'oublie à la sortie, parce qu'un exercice donne les charges et demande le coût. Ici l'équipe fixe son volume de production et son prix, découvre au trimestre suivant sa marge réelle une fois les charges fixes absorbées, et voit sa trésorerie se tendre alors que son compte de résultat est bénéficiaire, parce que ses clients paient à soixante jours. Le besoin en fonds de roulement cesse d'être une formule : une équipe qui a vendu davantage sans financer son cycle se retrouve à court de caisse au meilleur de son activité, et son tableau de trésorerie le lui dit avant sa banque.",
  reglages: {
    scenarioCode: "nova-gamme",
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
      "NOVA se joue ici en trois références, qui se disputent le même atelier : le coût de revient et la marge se calculent enceinte par enceinte, et le mix devient une décision. NOVA porte un coût de production, des charges fixes qui pèsent tant que le volume ne les absorbe pas, des délais de règlement qui creusent le besoin en fonds de roulement, et un compte-clé qui fait bondir la demande au quatrième trimestre. Le niveau retenu ouvre la trésorerie, l'assurance, le recrutement et l'investissement : la gestion généraliste demande de voir l'entreprise entière, du coût de revient au financement de sa croissance. Le monde variable est décoché pour que toutes vos classes travaillent le même exercice.",
  },
  seances: [
    {
      numero: 1,
      titre: "Calculer un coût de revient",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Bloc 1 · Analyser les coûts et la rentabilité",
        "Bloc 2 · Établir et lire les documents de synthèse",
      ],
      objectif:
        "Reconstituer le coût de revient d'un produit à partir des charges de l'entreprise, en distinguer les charges fixes des variables, et en tirer une marge.",
      competences: [
        "Je distingue les charges fixes des charges variables dans les comptes d'une entreprise.",
        "Je calcule un coût de revient unitaire et la marge qu'un prix de vente en dégage.",
        "Je détermine le volume de production qui absorbe les charges fixes du trimestre.",
      ],
      notions: [
        "charges fixes et charges variables",
        "coût de revient unitaire",
        "marge sur coût variable",
        "seuil de rentabilité",
        "compte de résultat",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois : une responsable des coûts, une de la production, une du suivi. Imprimez la fiche de coût de revient vierge, une par équipe. Prévoyez que cette première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : cinq séances, quatre trimestres, une seule entreprise, et un document de gestion rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 35,
          titre: "Lire les charges",
          detail:
            "Chaque équipe relève ce que l'entreprise dépense pour produire, ce qui reste dû, et ce que coûte un trimestre d'activité que la chaîne tourne ou non.",
        },
        {
          minutes: 35,
          titre: "Du coût à la marge",
          detail:
            "L'équipe calcule son coût de revient unitaire, sa marge sur coût variable, puis le volume à produire pour couvrir ses charges fixes. Vous circulez sans corriger : une équipe qui oublie une charge dans son coût le découvrira dans son résultat.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose au premier trimestre un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit son volume et son prix.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, sa marge réalisée et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur coût de revient et le confrontent à leur résultat réel. Vous ne dites pas qui a raison : vous affichez les deux comptes de résultat côte à côte.",
        },
      ],
      livrable:
        "La fiche de coût de revient, une page : charges fixes et variables séparées, coût de revient unitaire, marge sur coût variable, volume au seuil, et le positionnement retenu avec sa justification.",
      tracePasseport:
        "J'ai reconstitué le coût de revient d'un produit et j'en ai tiré la marge et le seuil de rentabilité de l'entreprise.",
      evaluation: [
        "Les charges fixes et variables sont séparées, et pas mélangées.",
        "Le seuil est exprimé en volume à produire, pas seulement en euros.",
        "La marge annoncée découle du coût de revient calculé, pas d'une estimation.",
      ],
    },
    {
      numero: 2,
      titre: "Du résultat à la trésorerie",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Bloc 3 · Piloter la trésorerie et le financement",
        "Bloc 2 · Établir et lire les documents de synthèse",
      ],
      objectif:
        "Comprendre pourquoi un résultat bénéficiaire peut s'accompagner d'une trésorerie qui se tend, et mesurer le besoin en fonds de roulement du cycle.",
      competences: [
        "Je lis un bilan et j'y repère le besoin en fonds de roulement d'une entreprise.",
        "Je construis un plan de trésorerie de trimestre à partir des encaissements et des décaissements.",
        "J'explique un écart entre le résultat comptable et le solde de trésorerie.",
      ],
      notions: [
        "besoin en fonds de roulement",
        "délai de règlement client",
        "plan de trésorerie",
        "fonds de roulement",
        "écart entre résultat et trésorerie",
      ],
      preparation:
        "Rouvrez la fiche notion sur le besoin en fonds de roulement, que les équipes auront à mobiliser. Préparez un tableau vierge où chaque équipe inscrira, avant la clôture, le solde de trésorerie qu'elle prévoit à la fin du trimestre.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le trimestre précédent",
          detail:
            "Chaque équipe relit son résultat et dit en une phrase ce qu'elle a compris. Vous notez au tableau les équipes bénéficiaires dont la caisse a pourtant baissé.",
        },
        {
          minutes: 40,
          titre: "Où passe l'argent",
          detail:
            "Les équipes reconstituent leur cycle : elles paient leurs charges avant d'encaisser leurs ventes, réglées à soixante jours. Le décalage porte un nom, et chacune le retrouve dans son propre bilan.",
        },
        {
          minutes: 30,
          titre: "Le plan de trésorerie",
          detail:
            "Chaque équipe projette ses encaissements et ses décaissements du trimestre à venir et en tire un solde prévu, qu'elle inscrit au tableau. Rien n'est saisi à ce stade.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son volume, son prix et, si elle en a besoin, sa couverture de trésorerie, puis écrit en trois lignes ce qu'elle attend de ce choix.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le solde de trésorerie réalisé apparaît à côté du résultat de chaque équipe, et l'écart saute aux yeux.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a gagné et manqué de caisse à une équipe qui a moins gagné et gardé sa trésorerie. La question qui reste ouverte : laquelle a la meilleure gestion.",
        },
      ],
      livrable:
        "Le plan de trésorerie du trimestre : encaissements et décaissements, solde prévu, besoin en fonds de roulement estimé, et l'écart au solde réalisé après clôture.",
      tracePasseport:
        "J'ai construit un plan de trésorerie, mesuré le besoin en fonds de roulement d'une entreprise, et expliqué l'écart entre son résultat et sa caisse.",
      evaluation: [
        "Le besoin en fonds de roulement est nommé et relié au délai de règlement.",
        "Le solde prévu est construit sur des flux, pas sur le résultat comptable.",
        "L'écart entre résultat et trésorerie est expliqué, pas seulement constaté.",
      ],
    },
    {
      numero: 3,
      titre: "Arbitrer un investissement de capacité",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Bloc 1 · Analyser les coûts et la rentabilité",
        "Bloc 4 · Décider et rendre compte",
      ],
      objectif:
        "Décider s'il faut investir pour augmenter la capacité avant la montée en charge annoncée, en pesant le coût de l'investissement contre le manque à gagner d'une capacité saturée.",
      competences: [
        "J'évalue le manque à gagner d'une capacité de production saturée face à une demande qui monte.",
        "Je compare le coût d'un investissement à la marge supplémentaire qu'il rend possible.",
        "Je décide d'un investissement en assumant l'incertitude qui l'entoure.",
      ],
      notions: [
        "capacité de production",
        "goulot d'étranglement",
        "investissement et amortissement",
        "coût d'une capacité saturée",
        "retour sur investissement",
      ],
      preparation:
        "Relisez la capacité de l'entreprise et la demande à venir décrites dans le scénario, pour animer le débat sans le trancher. Préparez au tableau une grille à deux colonnes, investir ou tenir la capacité, que les équipes rempliront en séance.",
      deroule: [
        {
          minutes: 20,
          titre: "Relecture des prévisions",
          detail:
            "Chaque équipe confronte ce qu'elle avait prévu au tour précédent à ce qui s'est produit, et dit où en est sa trésorerie avant de décider d'un investissement.",
        },
        {
          minutes: 40,
          titre: "Ce que coûte une capacité saturée",
          detail:
            "Les équipes chiffrent la demande qui monte et la comparent à leur capacité actuelle. La part qu'elles ne pourront pas produire porte une marge perdue, qu'elles calculent.",
        },
        {
          minutes: 30,
          titre: "Investir ou tenir",
          detail:
            "Chaque équipe remplit la grille : le coût de l'investissement, la capacité qu'il ajoute, la marge qu'il rend possible, et le risque qu'il fasse défaut. Personne ne conclut à sa place.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son investissement, son volume et son prix, et inscrit la marge supplémentaire qu'elle attend de sa décision.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. L'effet de l'investissement, sur la capacité comme sur la trésorerie, apparaît dans les résultats de chaque équipe.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare les équipes qui ont investi et celles qui ont attendu. La question qui reste ouverte : le bon moment d'investir se juge-t-il avant ou après le pic.",
        },
      ],
      livrable:
        "La note d'investissement, une page : la demande attendue face à la capacité, la marge perdue d'une saturation, le coût de l'investissement, la décision retenue, et la marge supplémentaire attendue.",
      tracePasseport:
        "J'ai arbitré un investissement de capacité en pesant son coût contre la marge d'une demande que je n'aurais pas pu produire autrement.",
      evaluation: [
        "Le manque à gagner d'une capacité saturée est chiffré, pas seulement évoqué.",
        "Le coût de l'investissement est comparé à la marge qu'il rend possible.",
        "La décision assume un risque, nommé plutôt que passé sous silence.",
      ],
    },
    {
      numero: 4,
      titre: "Piloter la montée en charge",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Bloc 1 · Analyser les coûts et la rentabilité",
        "Bloc 3 · Piloter la trésorerie et le financement",
      ],
      objectif:
        "Absorber le trimestre où le compte-clé fait bondir la demande, en tenant à la fois la production, la marge et une trésorerie que la croissance met sous tension.",
      competences: [
        "J'anticipe un volume de production à partir de la saisonnalité et de mes trimestres précédents.",
        "Je mesure l'effet d'une forte croissance des ventes sur le besoin en fonds de roulement.",
        "Je tiens ensemble la production, la marge et la trésorerie d'un trimestre de pointe.",
      ],
      notions: [
        "montée en charge",
        "compte-clé et concentration du chiffre d'affaires",
        "tension de trésorerie de croissance",
        "marge et volume",
        "besoin en fonds de roulement",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer la totalité du temps annoncé. Préparez la fiche de plan de charge, où l'équipe écrira son volume et son solde de trésorerie attendus AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le trimestre",
          detail:
            "Vous rappelez sans donner de chiffre que le compte-clé pèse désormais une part majeure de la demande. Les équipes retrouvent seules l'ampleur de la montée dans les informations du jeu.",
        },
        {
          minutes: 40,
          titre: "Plan de charge",
          detail:
            "Chaque équipe construit son plan à partir de ses trimestres joués : le volume qu'elle produira, la marge qu'elle en attend, et le solde de trésorerie qui en découle. Rien n'est saisi à ce stade.",
        },
        {
          minutes: 30,
          titre: "La croissance qui assèche",
          detail:
            "L'équipe chiffre l'effet de la croissance sur son besoin en fonds de roulement : plus elle vend, plus elle avance de trésorerie avant d'être payée. Puis elle décide comment elle finance ce cycle.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du volume, du prix et de la couverture de trésorerie. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre de pointe. Les écarts entre équipes sont ici les plus larges de tout l'atelier.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. La question finale : celle qui a le plus produit est-elle celle qui a le mieux tenu sa trésorerie.",
        },
      ],
      livrable:
        "La fiche de plan de charge : le volume attendu et son raisonnement, la marge attendue, le besoin en fonds de roulement de la croissance, la couverture retenue, et l'écart constaté après clôture.",
      tracePasseport:
        "J'ai piloté une montée en charge en tenant ensemble la production, la marge et la trésorerie, et j'ai analysé mon écart au résultat.",
      evaluation: [
        "Le plan est construit sur les trimestres joués, pas sur une intuition.",
        "L'effet de la croissance sur le besoin en fonds de roulement est chiffré.",
        "La trésorerie de fin de trimestre est anticipée, pas subie.",
      ],
    },
    {
      numero: 5,
      titre: "Établir le diagnostic financier",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Bloc 2 · Établir et lire les documents de synthèse",
        "Bloc 4 · Décider et rendre compte",
      ],
      objectif:
        "Construire le diagnostic financier des quatre trimestres, de l'activité à la trésorerie, et le présenter oralement comme on rend compte à une direction.",
      competences: [
        "Je construis un diagnostic financier qui relie l'activité, la rentabilité et la trésorerie.",
        "Je choisis les indicateurs qui expliquent la situation de l'entreprise, et j'écarte ceux qui l'habillent.",
        "Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.",
      ],
      notions: [
        "diagnostic financier",
        "soldes intermédiaires de gestion",
        "rentabilité et trésorerie",
        "évolution du chiffre d'affaires et du résultat",
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
          titre: "Construction du diagnostic",
          detail:
            "Les équipes reprennent les quatre trimestres depuis leur espace et construisent leur diagnostic. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié, reliant l'activité à la trésorerie.",
        },
        {
          minutes: 20,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole, préparation des réponses aux questions probables. Vous passez dans les équipes pour repérer les diagnostics illisibles avant qu'ils ne soient projetés.",
        },
        {
          minutes: 75,
          titre: "Passage des équipes",
          detail:
            "Chaque équipe présente son diagnostic puis répond aux questions du jury, formé de vous et de deux élèves d'une autre équipe qui posent au moins une question chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le diagnostic et l'oral. Chaque élève écrit les trois phrases de son dossier professionnel.",
        },
      ],
      livrable:
        "Le diagnostic financier des quatre trimestres, une page, quatre indicateurs justifiés reliant activité, rentabilité et trésorerie, plus la présentation orale qui l'accompagne.",
      tracePasseport:
        "J'ai établi le diagnostic financier d'une entreprise sur quatre trimestres et je l'ai présenté oralement devant un jury.",
      evaluation: [
        "Le diagnostic relie l'activité, la rentabilité et la trésorerie, sans se limiter au résultat.",
        "Chaque indicateur retenu est justifié par ce qu'il explique de la situation.",
        "L'oral assume au moins une erreur de gestion et dit ce qui serait fait autrement.",
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
      nom: "Semaine de ressources ou de projet",
      quand: "En semaine banalisée de situation d'apprentissage et d'évaluation.",
      comment:
        "Une séance par jour du lundi au vendredi. Le rythme est plus tendu et le débriefing plus court, mais la mémoire des trimestres est meilleure, et la présentation du vendredi gagne en tenue.",
    },
    {
      nom: "Fil rouge du semestre",
      quand: "Quand l'atelier accompagne le cours de comptabilité de gestion ou de finance.",
      comment:
        "Une séance toutes les trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions à la maison.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le diagnostic financier de la dernière séance, pour un quart.",
    "La présentation orale et les réponses aux questions du jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur diagnostic.",
  ],
  prolongements: [
    "Rejouer les mêmes quatre trimestres avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Basculer sur un secteur de services pour opposer, sur le même déroulé, une entreprise qui porte des stocks et une entreprise qui n'en porte pas.",
    "Prolonger jusqu'aux deux derniers trimestres du secteur, consacrés au financement de la croissance et au calcul d'une rentabilité des capitaux investis.",
  ],
  faq: [
    {
      question: "Faut-il avoir traité le coût de revient avant la première séance ?",
      reponse:
        "Non, et il vaut même mieux ne pas l'avoir fait. La première séance amène les équipes à en avoir besoin avant de le nommer : elles calculent un coût parce qu'elles doivent fixer un prix et un volume, pas parce que le cours l'a demandé. Vous formalisez ensuite, sur leurs propres chiffres.",
    },
    {
      question: "Pourquoi arrêter à quatre trimestres alors que le secteur en compte six ?",
      reponse:
        "Parce que la montée en charge du compte-clé est le point culminant de ce secteur et que rien ne gagne à la dépasser dans un atelier de cinq séances. La partie reste ouverte : si votre progression le permet, les deux trimestres suivants se jouent en prolongement, avec le financement de la croissance comme fil.",
    },
    {
      question: "Le référentiel du BUT GEA est-il repris au mot dans les intitulés de blocs ?",
      reponse:
        "Pas encore. Les blocs cités décrivent l'activité de gestion de façon fidèle mais n'ont pas été confrontés au programme national : le diplôme figure pour cette raison dans la liste des référentiels non vérifiés. Relisez-les avec votre référentiel de compétences sous les yeux et ajustez les intitulés avant un usage certificatif.",
    },
    {
      question: "Le niveau retenu ouvre l'investissement et le recrutement, est-ce trop pour une première année ?",
      reponse:
        "Non, à condition de tenir l'atelier sur le fil proposé. Le déroulé concentre chaque séance sur une décision structurante, et les autres leviers restent des réglages secondaires que les équipes ajustent sans qu'ils portent la note. C'est justement ce qui distingue la gestion généraliste du GEA d'un atelier centré sur un seul métier.",
    },
    {
      question: "Peut-on conduire cet atelier avec des équipes de deux ?",
      reponse:
        "Oui, en fusionnant les rôles des coûts et de la production. En dessous de trois élèves, le débat de la troisième séance sur l'investissement perd de sa force, alors prévoyez d'y faire travailler deux équipes ensemble sur cette séance-là uniquement.",
    },
  ],
};
