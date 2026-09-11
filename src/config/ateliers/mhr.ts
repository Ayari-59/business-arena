import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS MHR.
 *
 * Cinq séances de trois heures sur un hôtel qui traverse une année de saisons.
 * Le choix du secteur va de soi pour le management en hôtellerie-restauration :
 * on n'y fabrique rien de stockable, la nuitée invendue est perdue à minuit, et
 * tout se joue sur le tarif, le taux d'occupation et la trésorerie qui doit
 * passer la basse saison sans se rompre.
 *
 * Les quatre premières séances jouent un trimestre chacune et s'arrêtent sur la
 * haute saison, qui décide de l'année. La cinquième ne joue rien : elle rend
 * compte. Un atelier de professionnalisation se note sur ce qui est rendu, pas
 * sur le classement du jeu.
 *
 * Le référentiel du BTS MHR n'a pas encore été confronté à son texte : le code
 * figure donc dans REFERENTIELS_NON_VERIFIES, et les blocs cités ci-dessous
 * décrivent l'activité de management sans prétendre reprendre l'arrêté au mot.
 */
export const ATELIER_MHR: AtelierDefinition = {
  code: "mhr",
  titre: "Piloter un hôtel sur une année de saisons",
  diplome: "BTS Management en hôtellerie-restauration",
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "dossier professionnel",
  referentielLabel: "Blocs de compétences",
  referentielAccord: "mobilisés",
  pitch:
    "Cinq séances de trois heures. Chaque équipe dirige le même hôtel d'un trimestre à l'autre, fixe ses tarifs selon la demande, prépare la haute saison, tient sa trésorerie dans le creux, et rend à chaque séance un document que l'on retrouverait sur le bureau d'un directeur d'établissement.",
  resume:
    "Quatre trimestres à la tête d'un hôtel, du calcul du prix moyen et du taux d'occupation au tableau de bord de direction, avec la haute saison comme épreuve.",
  difficulte: 3,
  difficulteLabel: "Pilotage",
  format: "5 séances de 3 h",
  pourquoi:
    "Le taux d'occupation et le prix moyen se récitent en une heure et ne se comprennent qu'en les subissant. Ici l'équipe fixe son tarif, découvre au trimestre suivant combien de chambres sont restées vides à ce prix, et voit son revenu par chambre disponible monter ou tomber selon qu'elle a rempli ou tenu ses prix. La saisonnalité cesse d'être un chapitre : un hôtel qui a bradé ses nuitées en basse saison n'a plus de trésorerie pour affronter la haute, et une équipe qui a gardé ses tarifs sur un trimestre creux voit ses concurrents remplir pendant que ses étages restent éteints. La perte sèche de la nuitée invendue, que rien ne rattrape le lendemain, fait le reste de la leçon.",
  reglages: {
    scenarioCode: "hotel",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 4,
    effectifParEquipe: "trois élèves",
    notes:
      "L'hôtel porte trois clientèles qui ne viennent pas aux mêmes saisons, une capacité de chambres qui ne s'étire pas d'un trimestre à l'autre, et une saison haute qui décide de l'exercice. Le niveau retenu ouvre la trésorerie et l'assurance sans ouvrir le recrutement ni l'investissement : la direction opérationnelle d'un établissement en première année se joue sur le tarif, le remplissage et la caisse, pas sur la structure. Le monde variable est décoché pour que toutes vos classes affrontent la même saison.",
  },
  seances: [
    {
      numero: 1,
      titre: "Prendre la direction de l'hôtel",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
        "Bloc 2 · Analyser les coûts et la performance pour décider",
      ],
      objectif:
        "Lire la situation d'un hôtel inconnu, en tirer son prix moyen, son taux d'occupation et son seuil, et décider d'un premier positionnement tarifaire.",
      competences: [
        "Je calcule un prix moyen par chambre et un taux d'occupation à partir des nuitées vendues et des chambres disponibles.",
        "Je détermine le taux de remplissage qui couvre les charges de structure d'un trimestre.",
        "Je situe l'offre de l'hôtel par rapport aux clientèles qui le fréquentent.",
      ],
      notions: [
        "prix moyen par chambre",
        "taux d'occupation",
        "revenu par chambre disponible",
        "charges de structure",
        "seuil de rentabilité",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois : une responsable de la tarification, une du remplissage, une du suivi. Imprimez la fiche de calcul du prix moyen et du taux d'occupation, une par équipe. Prévoyez que cette première séance se passe sans aucune correction de votre part.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : cinq séances, quatre trimestres, un seul hôtel, et un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 35,
          titre: "État des lieux de l'établissement",
          detail:
            "Chaque équipe relève ce que l'hôtel possède en chambres, ce qu'il doit à ses fournisseurs, et ce que lui coûte un trimestre d'ouverture, que les chambres soient occupées ou non.",
        },
        {
          minutes: 35,
          titre: "Le prix moyen et le remplissage",
          detail:
            "L'équipe calcule son prix moyen par chambre, son taux d'occupation, puis le remplissage qu'il faut atteindre pour ne rien perdre. Vous circulez sans corriger : une équipe qui confond chiffre d'affaires et revenu par chambre disponible le découvrira au tour suivant, et ne l'oubliera plus.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose au premier trimestre un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit son tarif et son offre.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, son prix moyen réalisé, son taux d'occupation et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur calcul de seuil et le confrontent à leur remplissage réel. Vous ne dites pas qui a raison : vous affichez les deux comptes de résultat côte à côte.",
        },
      ],
      livrable:
        "La fiche de positionnement de l'hôtel, une page : prix moyen visé, taux d'occupation attendu, charges de structure du trimestre, remplissage au seuil, et le positionnement retenu avec sa justification.",
      tracePasseport:
        "J'ai calculé le prix moyen, le taux d'occupation et le seuil d'un hôtel, et j'ai justifié un positionnement à partir de ces calculs.",
      evaluation: [
        "Le taux d'occupation et le revenu par chambre disponible sont distingués, et pas confondus.",
        "Le seuil est exprimé en remplissage à atteindre, pas seulement en euros.",
        "Le positionnement retenu s'appuie sur une clientèle nommée, pas sur une préférence.",
      ],
    },
    {
      numero: 2,
      titre: "Tarifer selon la demande",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Bloc 3 · Gérer l'offre commerciale et la relation client",
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
      ],
      objectif:
        "Arbitrer entre baisser le tarif pour remplir et le tenir pour préserver la marge, selon la clientèle attendue au trimestre.",
      competences: [
        "Je mesure l'effet d'une baisse de tarif sur le remplissage qu'il faut gagner pour la compenser.",
        "Je distingue les clientèles qui réservent au prix affiché de celles qui ne viennent qu'à prix cassé.",
        "Je défends une politique tarifaire devant des collègues qui ont choisi autrement.",
      ],
      notions: [
        "sensibilité au prix",
        "revenu par chambre disponible",
        "clientèle affaires et clientèle loisirs",
        "nuitée invendue",
        "marge sur coût variable d'une chambre",
      ],
      preparation:
        "Relisez les clientèles décrites dans le scénario et la saison qui s'ouvre, pour animer le débat sans le trancher. Préparez au tableau une grille à deux colonnes, tenir le tarif ou le baisser, que les équipes rempliront en séance.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le trimestre précédent",
          detail:
            "Chaque équipe relit son résultat et dit en une phrase ce qu'elle a compris. Vous notez au tableau les écarts entre le remplissage visé et le remplissage réel.",
        },
        {
          minutes: 40,
          titre: "Ce que coûte une nuitée bradée",
          detail:
            "Sur sa propre marge, chaque équipe calcule le nombre de nuitées supplémentaires qu'exigerait une baisse de tarif de dix pour cent, puis de vingt. Les chiffres surprennent toujours : c'est le moment de la séance.",
        },
        {
          minutes: 30,
          titre: "Débat contradictoire",
          detail:
            "Deux équipes défendent chacune une politique, tenir ou baisser, devant la classe. Les autres posent les questions. Personne ne conclut : chaque équipe repart libre de son choix.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son tarif et son offre, et écrit en trois lignes ce qu'elle attend de ce choix. Cette prévision sera relue au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le prix moyen et le taux d'occupation de chaque équipe apparaissent côte à côte, avec leur effet sur la marge.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare les équipes qui ont le plus rempli et celles qui ont le mieux gagné. La question qui reste ouverte : remplir à tout prix, est-ce diriger un hôtel.",
        },
      ],
      livrable:
        "La note tarifaire, une page : la grille des deux politiques, le tarif retenu, la clientèle visée, ce que l'équipe en attend chiffré, et le risque qu'elle accepte de prendre.",
      tracePasseport:
        "J'ai arbitré une politique tarifaire entre remplissage et marge, et j'en ai chiffré l'effet avant de décider.",
      evaluation: [
        "L'effet de la baisse de tarif est calculé sur la marge, pas sur le chiffre d'affaires.",
        "La clientèle visée est nommée, et son rapport au prix est expliqué.",
        "La prévision chiffrée est écrite avant la clôture, et donc vérifiable.",
      ],
    },
    {
      numero: 3,
      titre: "Réussir la haute saison",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
        "Bloc 3 · Gérer l'offre commerciale et la relation client",
      ],
      objectif:
        "Tirer le meilleur de la saison où la demande dépasse la capacité : monter les tarifs sans faire fuir, choisir les clientèles à servir en priorité.",
      competences: [
        "J'anticipe un afflux de demande à partir de la saisonnalité et de mes trimestres précédents.",
        "Je fixe un tarif de haute saison qui capte la demande sans la casser.",
        "J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.",
      ],
      notions: [
        "saisonnalité de la demande",
        "capacité et saturation",
        "tarif de haute saison",
        "arbitrage entre clientèles",
        "revenu par chambre disponible",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer la totalité du temps annoncé. Préparez la fiche de plan de saison, où l'équipe écrira son tarif et sa clientèle prioritaire AVANT de connaître le résultat.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit la saison",
          detail:
            "Vous rappelez sans donner de chiffre que le trimestre qui s'ouvre n'est pas un trimestre ordinaire. Les équipes retrouvent seules l'ampleur de l'afflux dans les informations du jeu.",
        },
        {
          minutes: 40,
          titre: "Plan de haute saison",
          detail:
            "Chaque équipe construit son plan à partir de ses trimestres joués et du coefficient de saison : le tarif qu'elle affichera, et la clientèle qu'elle servira en premier si les chambres manquent. Rien n'est saisi à ce stade.",
        },
        {
          minutes: 30,
          titre: "Les deux erreurs de saison",
          detail:
            "L'équipe chiffre les deux fautes possibles : un tarif trop bas qui remplit sans profiter de la rareté, un tarif trop haut qui laisse des chambres vides un trimestre où tout se vend. Puis elle choisit de quel côté elle prend le risque.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du tarif et de l'offre. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre de la haute saison. Les écarts entre équipes sont ici les plus larges de tout l'atelier.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. La question finale : celle qui a le plus rempli est-elle celle qui a le mieux valorisé sa saison.",
        },
      ],
      livrable:
        "La fiche de plan de saison : le tarif de haute saison et son raisonnement, la clientèle servie en priorité, les deux erreurs chiffrées, le risque choisi, et l'écart constaté après clôture.",
      tracePasseport:
        "J'ai bâti un plan de haute saison, arbitré entre des clientèles sous contrainte de capacité, et analysé mon écart au résultat.",
      evaluation: [
        "Le plan est construit sur les trimestres joués, pas sur une intuition.",
        "Les deux erreurs de saison sont chiffrées, pas seulement décrites.",
        "L'arbitrage entre clientèles est justifié par la capacité, pas par la préférence.",
      ],
    },
    {
      numero: 4,
      titre: "Tenir la trésorerie dans le creux",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Bloc 2 · Analyser les coûts et la performance pour décider",
        "Bloc 1 · Piloter l'activité opérationnelle de l'établissement",
      ],
      objectif:
        "Traverser un trimestre creux sans rompre la trésorerie : anticiper la baisse d'activité et couvrir le découvert saisonnier.",
      competences: [
        "Je construis un plan de trésorerie de trimestre à partir de mes encaissements et de mes charges fixes.",
        "Je mesure l'effet d'un trimestre creux sur la caisse d'un établissement à charges lourdes.",
        "Je décide d'une couverture du besoin de trésorerie et j'en assume le coût.",
      ],
      notions: [
        "trésorerie et plan de trésorerie",
        "charges fixes et point mort saisonnier",
        "besoin en fonds de roulement",
        "découvert et coût du financement court terme",
        "assurance des risques d'exploitation",
      ],
      preparation:
        "Rouvrez la fiche notion sur la trésorerie, que les équipes auront à mobiliser. Préparez un tableau vierge où chaque équipe inscrira, avant la clôture, le solde de trésorerie qu'elle prévoit à la fin du trimestre.",
      deroule: [
        {
          minutes: 20,
          titre: "Relecture de la haute saison",
          detail:
            "Chaque équipe confronte ce qu'elle avait prévu à ce qui s'est produit, et dit ce qu'il lui reste en caisse pour aborder le creux. L'écart s'explique en une phrase, sans excuse.",
        },
        {
          minutes: 35,
          titre: "Le creux vu de la caisse",
          detail:
            "Chaque équipe projette ses encaissements du trimestre creux face à ses charges fixes, qui, elles, ne baissent pas. Le solde prévu s'inscrit au tableau, et il est souvent négatif.",
        },
        {
          minutes: 30,
          titre: "Couvrir le besoin",
          detail:
            "L'équipe décide comment elle passe le creux : tarif d'appel pour capter la clientèle disponible, couverture du découvert, arbitrage des dépenses non essentielles. Chaque option porte son coût.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du tarif, de l'offre et de la couverture de trésorerie. Le solde prévu reste affiché, visible de tous.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre creux. Le solde de trésorerie réalisé apparaît à côté du solde prévu par chaque équipe.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "On compare les soldes prévus et réalisés. Une équipe qui a bradé sa haute saison et se retrouve à sec dans le creux fait la démonstration à votre place.",
        },
      ],
      livrable:
        "Le plan de trésorerie du trimestre : encaissements attendus, charges fixes, solde prévu, couverture retenue avec son coût, et l'écart au solde réalisé après clôture.",
      tracePasseport:
        "J'ai construit un plan de trésorerie de trimestre, décidé d'une couverture du besoin, et analysé l'écart entre le solde prévu et le solde réalisé.",
      evaluation: [
        "Le solde prévu est construit sur des encaissements et des charges, pas sur une impression.",
        "L'effet des charges fixes sur un trimestre creux est nommé, pas seulement mentionné.",
        "La couverture retenue est chiffrée avec son coût, et non seulement citée.",
      ],
    },
    {
      numero: 5,
      titre: "Rendre compte de sa direction",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Bloc 2 · Analyser les coûts et la performance pour décider",
        "Bloc 4 · Rendre compte et manager l'équipe",
      ],
      objectif:
        "Construire le tableau de bord de direction des quatre trimestres et le présenter oralement, comme on rend compte à un propriétaire d'établissement.",
      competences: [
        "Je construis un tableau de bord de direction qui tient sur une page et qui se lit.",
        "Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.",
        "Je présente oralement une année de direction, ses réussites et ses erreurs, devant un jury.",
      ],
      notions: [
        "tableau de bord de direction",
        "prix moyen, taux d'occupation, revenu par chambre disponible",
        "évolution du chiffre d'affaires et du résultat",
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
            "Les équipes reprennent les quatre trimestres depuis leur espace et construisent leur tableau de bord. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié.",
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
            "Chaque équipe présente son tableau de bord puis répond aux questions du jury, formé de vous et de deux élèves d'une autre équipe qui posent au moins une question chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le tableau de bord et l'oral. Chaque élève écrit les trois phrases de son dossier professionnel.",
        },
      ],
      livrable:
        "Le tableau de bord de direction des quatre trimestres, une page, quatre indicateurs justifiés, plus la présentation orale qui l'accompagne.",
      tracePasseport:
        "J'ai construit le tableau de bord de direction d'un hôtel sur quatre trimestres et je l'ai présenté oralement devant un jury.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Chaque indicateur retenu est justifié par ce qu'il explique du résultat.",
        "L'oral assume au moins une erreur de direction et dit ce qui serait fait autrement.",
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
      quand: "Quand l'atelier accompagne le cours de management opérationnel.",
      comment:
        "Une séance toutes les trois semaines, chaque séance étant précédée du point de cours qu'elle mobilise. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions à la maison.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le tableau de bord de direction de la dernière séance, pour un quart.",
    "La présentation orale et les réponses aux questions du jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur tableau de bord.",
  ],
  prolongements: [
    "Rejouer les mêmes quatre trimestres avec le monde variable activé : les équipes découvrent qu'une bonne décision peut mal finir, ce qui est le vrai métier.",
    "Basculer sur le secteur de la restauration pour opposer, sur un déroulé voisin, un hôtel qui vend des nuitées et un restaurant qui jette ses invendus le soir même.",
    "Prolonger jusqu'aux deux trimestres suivants du secteur, avec les dernières séances consacrées au financement d'une rénovation de l'établissement.",
  ],
  faq: [
    {
      question: "Faut-il avoir traité le revenu par chambre disponible avant la première séance ?",
      reponse:
        "Non, et il vaut même mieux ne pas l'avoir fait. La première séance amène les équipes à en avoir besoin avant de le nommer : elles calculent un prix moyen et un taux d'occupation parce qu'elles doivent fixer un tarif, pas parce que le cours l'a demandé. Vous formalisez ensuite, sur leurs propres chiffres.",
    },
    {
      question: "Pourquoi arrêter à quatre trimestres alors que le secteur en compte six ?",
      reponse:
        "Parce que la haute saison est le point culminant de ce secteur et que rien ne gagne à la dépasser dans un atelier de cinq séances. La partie reste ouverte : si votre progression le permet, les deux trimestres suivants se jouent en prolongement, avec le financement d'une rénovation comme fil.",
    },
    {
      question: "Le niveau retenu n'ouvre ni le recrutement ni l'investissement, est-ce voulu ?",
      reponse:
        "Oui. La direction opérationnelle d'un hôtel en première année se joue sur le tarif, le remplissage et la trésorerie. Ouvrir la structure ajouterait des décisions que les équipes prendraient au hasard, et qui brouilleraient la lecture de leurs résultats. Vous pouvez monter d'un niveau en deuxième année.",
    },
    {
      question: "Le référentiel du BTS MHR est-il repris au mot dans les intitulés de blocs ?",
      reponse:
        "Pas encore. Les blocs cités décrivent l'activité de management de façon fidèle mais n'ont pas été confrontés au texte de l'arrêté : le diplôme figure pour cette raison dans la liste des référentiels non vérifiés. Relisez-les avec votre référentiel sous les yeux et ajustez les intitulés avant un usage certificatif.",
    },
    {
      question: "Peut-on conduire cet atelier avec des équipes de deux ?",
      reponse:
        "Oui, en fusionnant les rôles de la tarification et du remplissage. En dessous de trois élèves, le débat contradictoire de la deuxième séance perd de sa force, alors prévoyez d'y faire travailler deux équipes ensemble sur cette séance-là uniquement.",
    },
  ],
};
