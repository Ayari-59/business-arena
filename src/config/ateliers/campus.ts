import type { AtelierDefinition } from "./types";

/**
 * IMMERSION DU CAMPUS · une entreprise, cinq filières dans la même équipe.
 *
 * Sept séances d'une heure trente, tenues d'affilée sur deux journées
 * banalisées. Ce n'est pas un atelier de classe : les équipes MÊLENT les
 * niveaux, une par filière du campus tertiaire, et c'est le mélange qui fait
 * l'exercice. Le comptable tient la trésorerie, le commercial le prix, la
 * relation client les clientèles, la terminale technologique la direction
 * générale, la première technologique la production. Personne ne peut décider
 * seul, personne ne peut se taire.
 *
 * LA RÈGLE QUI PORTE TOUT LE RESTE. Une décision n'est validée que si le plus
 * jeune de l'équipe peut la redire en une phrase. C'est la seule protection
 * contre ce qui tue les équipes mêlées : un étudiant de deuxième année qui
 * pilote tout pendant qu'un lycéen regarde. Elle oblige l'ancien à expliquer,
 * ce qui est précisément ce qu'on lui demandera à son épreuve orale, et elle
 * donne au plus jeune un pouvoir réel, celui de bloquer ce qu'il ne comprend
 * pas.
 *
 * CE QUE LE MODE CONCOURS IMPOSE, ET QU'AUCUN RÉGLAGE NE CHANGE.
 * Un concours se joue sur NOVA, le fabricant d'enceintes, et sur lui seul : le
 * produit ne propose pas encore de choisir le secteur d'un championnat. Les
 * parties de qualification durent les six tours du scénario, et elles doivent
 * toutes être terminées avant que la finale puisse être lancée. Aucun
 * concurrent simulé n'y entre : les équipes ne jouent que les unes contre les
 * autres. Les indices sont plafonnés au troisième palier, les décisions
 * validées ne se reprennent plus, et les questions se limitent au modèle
 * d'analyse. Le déroulé ci-dessous est écrit POUR ces contraintes, il ne
 * promet rien qui les contourne.
 *
 * UN SEUL CONCOURS, ET C'EST LE MÉLANGE QUI LE REND JUSTE. Le tirage des
 * groupes est aléatoire. Il serait injuste entre une classe de première et une
 * deuxième année de technicien supérieur ; il ne l'est plus quand chaque
 * équipe porte la même composition. C'est la raison de fond du mélange, avant
 * même la raison pédagogique.
 */
export const ATELIER_CAMPUS: AtelierDefinition = {
  code: "campus",
  titre: "Diriger une entreprise en équipe inter-filières",
  diplome: "Campus tertiaire · BTS CG, MCO, NDRC et STMG",
  annee: "Toutes les années, mêlées",
  nature: "Immersion inter-filières en tournoi",
  traceLabel: "dossier de tournoi",
  referentielLabel: "Blocs, processus et thèmes",
  referentielAccord: "mobilisés",
  pitch:
    "Sept séances d'une heure trente, sur deux journées banalisées. Chaque équipe réunit un élève de chaque filière du campus, du lycéen de première à l'étudiant de deuxième année, et chacun tient un poste de direction réel dans la même entreprise. Six tours de tournoi, une finale devant le campus, et une règle : une décision n'est validée que si le plus jeune peut la redire en une phrase.",
  resume:
    "Deux journées d'immersion où des équipes mêlant les cinq filières du campus dirigent la même entreprise en championnat, chaque élève tenant un poste de direction.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "7 séances de 1 h 30",
  pourquoi:
    "Un campus tertiaire enseigne la même entreprise en quatre langues sans jamais la faire voir aux élèves, et surtout sans jamais les faire travailler ensemble. Le comptable apprend à lire un compte de résultat qu'aucun commercial ne commente, le commercial construit une offre dont personne ne calcule la marge, et le lycéen de technologique entend parler d'organisations qu'il ne dirige jamais. En immersion, les cinq se retrouvent autour du même écran avec un poste chacun, et l'entreprise ne tourne que s'ils s'écoutent. L'étudiant avancé découvre qu'il ne sait pas expliquer ce qu'il sait faire ; le lycéen découvre qu'il peut bloquer une décision qu'on ne lui explique pas. Le tournoi, lui, empêche l'exercice de retomber en simulation molle : le classement tombe à chaque tour, pour tout le monde, au même moment.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 4,
    bots: 0,
    tva: false,
    mondeVariable: false,
    quizMode: "Modèle d'analyse seul",
    tours: 6,
    effectifParEquipe: "un élève par filière, donc cinq élèves",
    concours: true,
    notes:
      "Un seul concours pour tout le campus, avec des équipes mêlées : c'est ce qui rend le tirage aléatoire des groupes acceptable, puisque toutes les équipes portent la même composition. Le mode concours fixe ensuite presque tout, et ce qui suit se lit comme une donnée, pas comme un réglage. Le scénario est NOVA, le fabricant d'enceintes portables, imposé. Le niveau appliqué est Pilotage : prix, volume, communication, qualité, entretien, trésorerie et assurance sont ouverts ; le recrutement, l'équipement de l'atelier et l'emploi des excédents restent fermés. Ce nombre réduit de décisions est ce qui permet à une première technologique de tenir un poste sans être noyée. Les indices sont ramenés au troisième palier, plus bas qu'en classe, et une décision validée ne se reprend plus. Aucun concurrent simulé n'entre dans une partie de concours. Réglez des groupes de quatre équipes et un qualifié par groupe : la finale ne dépasse jamais huit équipes. Ouvrez une fenêtre d'étape couvrant les deux journées, et non chaque heure, pour qu'une équipe en retard ne bloque pas les autres.",
  },
  seances: [
    {
      numero: 1,
      titre: "Constituer les équipes et prendre les postes",
      dureeMinutes: 90,
      tourJoue: 1,
      processus: [
        "BTS CG P5 · Analyse et prévision de l'activité",
        "BTS MCO bloc 3 · Assurer la gestion opérationnelle",
        "BTS NDRC bloc 1 · Relation client et négociation-vente",
        "STMG thème 3 · Création de valeur et performance",
      ],
      objectif:
        "Former les équipes mêlées, attribuer les cinq postes de direction, comprendre ce que NOVA vend et à qui, puis arrêter un premier prix et un premier volume que chacun des cinq peut expliquer.",
      competences: [
        "Je tiens un poste de direction nommé et j'en réponds devant mon équipe.",
        "Je calcule le coût variable d'une enceinte et la marge qu'un prix de vente en dégage.",
        "J'explique une décision de gestion à quelqu'un qui n'a pas ma formation.",
      ],
      notions: [
        "charges variables et charges fixes",
        "marge sur coût variable",
        "seuil de rentabilité",
        "segmentation de la clientèle",
        "part de marché",
      ],
      preparation:
        "Créez le concours une semaine avant, notez le code à six caractères et publiez sa page publique : c'est l'affiche de l'immersion. Composez les équipes AVANT la première séance, une par filière et cinq élèves par équipe, en mélangeant les classes : laisser les élèves se choisir reproduit les classes et vide l'exercice de son sens. Imprimez les cinq cartes de poste, une par élève, et la fiche de tour vierge, une par équipe et par séance. Les chiffres que les équipes doivent retrouver seules : 22 € de matières et 16 € d'autres charges variables par enceinte, soit 38 € de coût variable ; 91 000 € de charges fixes par trimestre, plus 5 000 € d'amortissements ; un atelier de 7 000 enceintes et une main-d'œuvre qui en couvre 7 200. Trois clientèles, qui n'ont ni le même prix de référence ni la même sensibilité : les étudiants autour de 59 €, très sensibles au prix, les passionnés autour de 79 €, sensibles à la qualité, et CampusTech, la chaîne de magasins, autour de 55 € et réglée à quatre-vingts jours.",
      deroule: [
        {
          minutes: 15,
          titre: "Les équipes et les postes",
          detail:
            "Vous annoncez les équipes et distribuez les cartes de poste : direction financière à la comptabilité et gestion, direction commerciale au management commercial, direction des clientèles à la relation client, direction générale à la terminale technologique, direction de la production à la première technologique. Vous annoncez aussi la règle qui tient l'immersion : rien n'est validé que le plus jeune ne puisse redire en une phrase.",
        },
        {
          minutes: 20,
          titre: "Chaque poste lit l'entreprise",
          detail:
            "Chacun explore NOVA depuis son poste et note trois faits que les autres ignorent : les charges et le coût de revient pour la finance, l'offre et les prix pour le commerce, les clientèles et leurs délais de règlement pour la relation client, la capacité de l'atelier pour la production, les objectifs et la concurrence pour la direction générale.",
        },
        {
          minutes: 20,
          titre: "Premier comité de direction",
          detail:
            "Chaque poste expose ses trois faits en deux minutes, la direction générale tient le temps. L'équipe en tire son coût variable unitaire, la marge de chacun des trois prix de référence, et le nombre d'enceintes qui couvre ses charges de structure.",
        },
        {
          minutes: 20,
          titre: "Premières décisions",
          detail:
            "La direction générale fait le tour des postes, puis valide prix et volume. Avant de cliquer, elle demande à la direction de la production de redire la décision en une phrase : si elle n'y arrive pas, l'équipe reprend. En concours, une décision validée ne se reprend plus.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez le tour de chaque groupe. Le classement s'affiche sur l'écran commun, et il ne veut encore rien dire : c'est le moment de le rappeler.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "Deux équipes disent leur prix et leur résultat. Vous demandez à chaque fois au plus jeune de l'équipe de répondre, pas au plus avancé.",
        },
      ],
      livrable:
        "La fiche de tour : les cinq postes avec le nom de leur titulaire, les trois faits rapportés par chacun, le coût variable unitaire et le nombre d'enceintes au seuil de rentabilité, la décision de prix et de volume avec sa justification, et la phrase par laquelle le plus jeune l'a redite.",
      tracePasseport:
        "J'ai tenu un poste de direction dans une équipe où chaque filière apportait une lecture différente de la même entreprise.",
      evaluation: [
        "Les cinq postes sont tenus et chacun a rapporté ses faits au comité.",
        "Le coût variable est calculé à partir des charges du jeu, pas estimé.",
        "La phrase du plus jeune dit la décision et sa raison, pas seulement le chiffre.",
      ],
    },
    {
      numero: 2,
      titre: "D'où vient le surcoût",
      dureeMinutes: 90,
      tourJoue: 2,
      processus: [
        "BTS CG P5 · Analyse et prévision de l'activité",
        "BTS MCO bloc 3 · Assurer la gestion opérationnelle",
        "STMG thème 3 · Création de valeur et performance",
      ],
      objectif:
        "Décomposer l'écart entre le coût attendu et le coût constaté au premier tour, et mesurer ce qu'un prix fait à la demande d'une clientèle sensible et d'une clientèle qui l'est peu.",
      competences: [
        "Je décompose un écart de coût entre ce qui vient du volume et ce qui vient du prix des charges.",
        "Je relie une variation de prix de vente à la variation de demande qu'elle provoque sur chaque clientèle.",
        "Je défends devant un comité une proposition qui vient de mon poste.",
      ],
      notions: [
        "écart sur coût",
        "coût de revient unitaire",
        "élasticité de la demande au prix",
        "marge sur coût variable",
        "part de marché",
      ],
      preparation:
        "Le jeu pose à ce tour deux situations : le surcoût à décomposer, et le prix qui fait la demande. C'est la séance de la direction financière et de la direction commerciale : prévenez-les qu'elles mènent, et prévenez les autres qu'elles auront à les interroger. Préparez au tableau une colonne par clientèle, où les équipes reporteront ce qu'elles ont vendu face à ce qu'elles avaient prévu. Les étudiants réagissent près de trois fois plus fort au prix que les passionnés : c'est le chiffre que la séance doit faire découvrir, pas celui qu'il faut donner.",
      deroule: [
        {
          minutes: 10,
          titre: "Ce que le premier tour a donné",
          detail:
            "La direction financière de chaque équipe affiche l'écart entre le résultat attendu et le résultat obtenu, en une phrase, sans l'expliquer encore.",
        },
        {
          minutes: 25,
          titre: "Décomposer, chacun depuis son poste",
          detail:
            "La finance sépare ce qui vient du volume produit de ce qui vient du prix des charges. Le commerce et la relation client regardent la même chose par les ventes : quelle clientèle est venue, laquelle a manqué. La direction générale note les deux versions et cherche où elles se contredisent.",
        },
        {
          minutes: 20,
          titre: "Le prix fait la demande",
          detail:
            "La direction commerciale propose deux prix pour le tour qui s'ouvre et estime pour chacun le volume et la marge totale. Le prix le plus élevé n'est pas toujours celui qui rapporte le plus, et l'inverse non plus : c'est le point de la séance.",
        },
        {
          minutes: 20,
          titre: "Comité et décisions",
          detail:
            "La direction générale arbitre entre les deux prix, fait redire la décision par un autre poste que celui qui l'a proposée, puis valide prix, volume et communication. La prévision de ventes reste écrite sur la fiche.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez. Le classement bouge, et les équipes voient pour la première fois l'effet d'une décision réfléchie.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a monté son prix et une qui l'a baissé, sur la marge et sur la part de marché. Les deux chiffres ne racontent pas la même histoire.",
        },
      ],
      livrable:
        "La note d'écart : l'écart du tour précédent décomposé entre volume et prix des charges, la demande observée par clientèle, les deux prix proposés avec leur marge totale attendue, le prix retenu avec sa raison, et le poste qui a redit la décision avant validation.",
      tracePasseport:
        "J'ai décomposé un écart de coût entre sa part de volume et sa part de prix avant de choisir un prix de vente.",
      evaluation: [
        "L'écart est décomposé, et la somme des parts retombe sur l'écart constaté.",
        "La réaction de chaque clientèle au prix est estimée avant la décision, pas après.",
        "La décision est redite par un poste qui ne l'a pas proposée.",
      ],
    },
    {
      numero: 3,
      titre: "Produire n'est pas vendre",
      dureeMinutes: 90,
      tourJoue: 3,
      processus: [
        "BTS CG P5 · Analyse et prévision de l'activité",
        "BTS MCO bloc 2 · Animer et dynamiser l'offre commerciale",
        "BTS NDRC bloc 2 · Relation client à distance et digitalisation",
        "STMG thème 4 · Temps et risque",
      ],
      objectif:
        "Ajuster le volume produit à la demande attendue, en chiffrant ce que coûtent les enceintes invendues qui restent en stock et les clients repartis sans enceinte.",
      competences: [
        "J'estime la demande d'un trimestre à partir des trimestres joués et des décisions prises.",
        "Je chiffre le coût d'un stock d'invendus et celui d'une demande que je n'ai pas pu servir.",
        "Je règle un volume de production en assumant de quel côté je prends le risque.",
      ],
      notions: [
        "capacité de production",
        "stock et invendus",
        "prévision des ventes",
        "coût de rupture",
        "budget de communication",
      ],
      preparation:
        "C'est la séance de la direction de la production, tenue par la première technologique : dites-lui la veille qu'elle mène celle-ci, et qu'elle présentera. Préparez un tableau à deux colonnes, trop produit et pas assez produit, que les équipes chiffreront. Rappelez la capacité : l'atelier sort 7 000 enceintes par trimestre, la main-d'œuvre en couvre 7 200, et c'est donc l'atelier qui borne. Une enceinte produite et non vendue reste en stock avec son coût, une enceinte demandée et non produite ne rapporte rien du tout.",
      deroule: [
        {
          minutes: 10,
          titre: "Prévision contre réel",
          detail:
            "Chaque équipe confronte la prévision de ventes écrite au tour précédent et ce qui s'est vendu. L'écart se lit en enceintes, pas en euros.",
        },
        {
          minutes: 25,
          titre: "Les deux fautes de volume",
          detail:
            "La production mène : elle chiffre le trop et le pas assez, ce que coûte un stock qui dort et la marge d'une demande non servie. La finance pose le calcul en euros, le commerce en clients perdus, la direction générale en risque assumé.",
        },
        {
          minutes: 20,
          titre: "Le volume et la communication",
          detail:
            "La production propose le volume, le commerce le budget qui doit aller le chercher. Les deux décisions se tiennent : produire large sans faire venir personne remplit un entrepôt, et la première technologique le démontre aux autres.",
        },
        {
          minutes: 20,
          titre: "Comité et décisions",
          detail:
            "La direction générale valide après avoir fait redire la décision par la direction financière. Saisie du prix, du volume, de la communication et, si l'équipe le juge utile, du budget de qualité. La prévision de ventes est de nouveau écrite avant la clôture.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez. Le classement de mi-parcours s'affiche : à partir d'ici, les équipes savent si elles jouent la qualification ou l'honneur.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "On compare l'équipe qui a le plus produit et celle qui a le plus vendu. Ce sont rarement les mêmes, et l'écart entre les deux est la leçon.",
        },
      ],
      livrable:
        "La note de volume : la prévision de ventes du trimestre avec ses hypothèses, le coût chiffré d'un stock d'invendus, la marge perdue d'une demande non servie, le volume retenu avec le risque choisi, et le budget de communication qui l'accompagne.",
      tracePasseport:
        "J'ai réglé un volume de production en chiffrant le coût des invendus face à la marge d'une demande que je n'aurais pas servie.",
      evaluation: [
        "La prévision de ventes s'appuie sur les trimestres joués et sur les décisions prises, pas sur une intuition.",
        "Les deux fautes de volume sont chiffrées toutes les deux, pas seulement celle qui arrange.",
        "La direction de la production a mené la séance et l'a montré au comité.",
      ],
    },
    {
      numero: 4,
      titre: "Le paradoxe du succès",
      dureeMinutes: 90,
      tourJoue: 4,
      processus: [
        "BTS CG P6 · Analyse de la situation financière",
        "BTS NDRC bloc 3 · Relation client et animation de réseaux",
        "BTS MCO bloc 3 · Assurer la gestion opérationnelle",
        "STMG thème 4 · Temps et risque",
      ],
      objectif:
        "Comprendre pourquoi un trimestre record peut vider la caisse quand la chaîne de magasins règle à quatre-vingts jours, et couvrir le besoin de trésorerie avant qu'il ne coûte cher.",
      competences: [
        "Je relie le besoin en fonds de roulement d'une entreprise aux délais de règlement de ses clientèles.",
        "Je construis un plan de trésorerie de trimestre et j'y repère le point de tension.",
        "Je compare le coût d'un découvert, d'un escompte et d'un affacturage avant de choisir.",
      ],
      notions: [
        "besoin en fonds de roulement",
        "délai de règlement client",
        "plan de trésorerie",
        "escompte et affacturage",
        "découvert et coût du financement court terme",
      ],
      preparation:
        "C'est la séance de la direction financière, et celle qui décide du tournoi : prévoyez-y tout le temps annoncé. Les chiffres du jeu : les étudiants et les passionnés paient comptant, CampusTech à quatre-vingts jours, les fournisseurs se règlent à vingt-deux jours. Le découvert autorisé est de 30 000 € à 12 % l'an, l'escompte coûte 6 % l'an sur la moitié du poste clients au plus, l'affacturage 2,5 % de la créance cédée. La caisse d'ouverture était de 25 000 € seulement. Préparez un plan de trésorerie vierge où chaque équipe inscrira son solde attendu AVANT la clôture. Exigez que la direction financière l'explique aux quatre autres postes : c'est la notion la plus difficile de l'immersion, et la seule que personne ne devine.",
      deroule: [
        {
          minutes: 10,
          titre: "Le trimestre qui se passe bien",
          detail:
            "Chaque équipe lit son chiffre d'affaires et son résultat, puis sa trésorerie. Chez plusieurs, les deux ne vont pas dans le même sens, et personne n'explique encore pourquoi.",
        },
        {
          minutes: 25,
          titre: "Le cycle qui avance de l'argent",
          detail:
            "La finance reconstitue le cycle devant les autres : matières payées à vingt-deux jours, charges tous les mois, chaîne de magasins encaissée à quatre-vingts jours. Vendre davantage à ce client-là creuse la caisse avant de la remplir. C'est le besoin en fonds de roulement, et il se voit ici avant de se définir.",
        },
        {
          minutes: 20,
          titre: "Couvrir, et à quel prix",
          detail:
            "La finance compare le découvert, l'escompte et l'affacturage sur leur coût réel. La relation client apporte l'autre levier : servir davantage les clientèles qui paient comptant, au prix d'une part de marché moindre chez la chaîne. Les deux postes chiffrent leur proposition, le comité tranche.",
        },
        {
          minutes: 20,
          titre: "Comité et décisions",
          detail:
            "La direction générale valide après avoir fait redire le choix de couverture par la direction de la production. Saisie du prix, du volume, de la communication et de la couverture de trésorerie. Le plan écrit reste sur la table, visible.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez. Le solde réalisé apparaît à côté du solde prévu, et le coût de la couverture se lit dans le résultat.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "Une équipe bénéficiaire et à découvert fait la démonstration à votre place : le résultat et la caisse ne racontent pas la même histoire.",
        },
      ],
      livrable:
        "Le plan de trésorerie : les encaissements attendus par clientèle avec leur délai, les décaissements du trimestre, le solde prévu, la couverture retenue avec son coût, et l'écart au solde réalisé après clôture.",
      tracePasseport:
        "J'ai couvert le besoin de trésorerie d'une entreprise en comparant le coût du découvert, de l'escompte et de l'affacturage.",
      evaluation: [
        "Le besoin de trésorerie est relié aux délais de règlement des clientèles, pas au résultat.",
        "Les trois modes de couverture sont comparés sur leur coût, pas cités.",
        "La direction financière a expliqué le cycle aux autres postes, et l'un d'eux l'a redit.",
      ],
    },
    {
      numero: 5,
      titre: "Gagner de l'argent, ou être rentable",
      dureeMinutes: 90,
      tourJoue: 5,
      processus: [
        "BTS CG P6 · Analyse de la situation financière",
        "BTS MCO bloc 3 · Assurer la gestion opérationnelle",
        "STMG thème 3 · Création de valeur et performance",
      ],
      objectif:
        "Distinguer un résultat d'une rentabilité, absorber la flambée du prix des matières que le scénario déclenche à ce trimestre, et décider si la qualité se paie.",
      competences: [
        "Je distingue le résultat d'un trimestre de la rentabilité des capitaux qui l'ont produit.",
        "Je répercute une hausse du prix des matières en tenant compte de la sensibilité de chaque clientèle.",
        "Je décide d'un budget de qualité et d'entretien en le rapportant à ce qu'il évite de perdre.",
      ],
      notions: [
        "résultat et rentabilité",
        "rentabilité financière",
        "coût de la non-qualité",
        "budget d'entretien",
        "élasticité de la demande au prix",
      ],
      preparation:
        "Le scénario fait flamber le prix des matières à ce trimestre : annoncez-le en ouverture, sinon l'écart sera imputé à la prévision et non au choc. Rouvrez la fiche notion sur la rentabilité, que les équipes auront à mobiliser : un même bénéfice ne dit rien tant qu'on ignore les capitaux qui l'ont produit. Rappelez que le budget de qualité agit sur la qualité perçue et sur les rebuts, et que l'entretien protège la disponibilité de l'atelier : ni l'un ni l'autre ne se voit le trimestre où on le dépense. C'est la séance où la direction générale, tenue par la terminale technologique, doit trancher entre trois postes qui ne diront pas la même chose.",
      deroule: [
        {
          minutes: 10,
          titre: "Le choc des matières",
          detail:
            "Chaque équipe mesure ce que la hausse retire à sa marge unitaire, et ce qu'elle fait à son seuil de rentabilité. Le chiffre se pose avant toute discussion.",
        },
        {
          minutes: 25,
          titre: "Répercuter, absorber, ou déplacer",
          detail:
            "Le commerce veut monter le prix, la finance veut protéger la marge, la relation client propose de déplacer les ventes vers les passionnés, qui suivent mieux un prix élevé. Chacun chiffre sa voie, la direction générale arbitre sans voix prépondérante sur les chiffres des autres.",
        },
        {
          minutes: 20,
          titre: "Résultat ou rentabilité",
          detail:
            "L'équipe calcule son résultat, puis le rapporte à ses capitaux propres. Le classement se lit alors autrement : celle qui gagne le plus n'est pas toujours celle qui rend le mieux ce qu'on lui a confié.",
        },
        {
          minutes: 20,
          titre: "Comité et décisions",
          detail:
            "Saisie du prix, du volume, de la communication, du budget de qualité et de l'entretien, après que le plus jeune a redit l'arbitrage. L'avant-dernier tour se joue avec le classement sous les yeux.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez. Les écarts se creusent, et les équipes savent à peu près qui jouera la finale.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "On compare deux équipes au résultat voisin et aux capitaux différents. La question qui reste ouverte : laquelle des deux est la mieux gérée.",
        },
      ],
      livrable:
        "La note de rentabilité : l'effet de la hausse des matières sur la marge et sur le seuil, les trois voies proposées avec leur chiffrage, l'arbitrage retenu par la direction générale, le résultat du trimestre rapporté aux capitaux propres, et les budgets de qualité et d'entretien avec ce qu'ils doivent éviter de perdre.",
      tracePasseport:
        "J'ai rapporté le résultat d'une entreprise aux capitaux qui l'ont produit pour juger sa performance autrement que par son bénéfice.",
      evaluation: [
        "L'effet de la hausse des matières est chiffré sur la marge unitaire et sur le seuil.",
        "Les trois voies sont chiffrées avant l'arbitrage, pas discutées en principe.",
        "Le résultat est rapporté aux capitaux propres, et l'écart avec le classement est commenté.",
      ],
    },
    {
      numero: 6,
      titre: "Dernier tour et compte rendu de direction",
      dureeMinutes: 90,
      tourJoue: 6,
      processus: [
        "BTS CG P6 · Analyse de la situation financière",
        "BTS MCO bloc 1 · Développer la relation client et assurer la vente conseil",
        "BTS NDRC bloc 1 · Relation client et négociation-vente",
        "STMG thème 2 · Les organisations et les acteurs",
      ],
      objectif:
        "Jouer le dernier tour de la qualification avec le classement sous les yeux, puis rendre compte à cinq voix de ce que l'équipe a compris de son entreprise.",
      competences: [
        "Je décide un dernier tour en fonction de l'écart qui me sépare de la place que je vise.",
        "Je lis un classement multicritère et je repère la dimension qui me coûte des points.",
        "Je rends compte oralement de ce que mon poste a apporté à une décision collective.",
      ],
      notions: [
        "indice de pilotage global",
        "rentabilité financière",
        "trésorerie nette",
        "part de marché",
        "compte rendu de gestion",
      ],
      preparation:
        "Annoncez l'ordre de passage en début de séance et tenez le chronomètre : deux minutes par équipe, et les cinq postes doivent parler, donc une vingtaine de secondes chacun. C'est cette contrainte qui empêche l'étudiant le plus à l'aise de tout dire. Rappelez comment se compose l'indice de pilotage, pour qu'aucune équipe ne découvre à la fin qu'elle jouait un seul critère. Prévenez que la finale ne peut être lancée que si TOUTES les parties de qualification sont terminées : une équipe en retard bloque le campus entier, et c'est la seule urgence réelle des deux journées.",
      deroule: [
        {
          minutes: 10,
          titre: "Où nous place le classement",
          detail:
            "Chaque équipe repère la dimension de l'indice qui lui coûte le plus de points, et le poste concerné dit en une phrase ce qu'il va tenter au dernier tour.",
        },
        {
          minutes: 20,
          titre: "Le dernier arbitrage",
          detail:
            "L'équipe décide si elle consolide ou si elle tente. Un dernier tour joué pour la place se pilote autrement qu'un tour ordinaire, et la direction financière rappelle ici ce qu'un coup de force coûte au bilan.",
        },
        {
          minutes: 15,
          titre: "Décisions du dernier trimestre",
          detail:
            "Saisie complète, puis clôture du dernier tour de qualification par vos soins. Le classement final de la qualification s'affiche.",
        },
        {
          minutes: 10,
          titre: "Préparation du compte rendu",
          detail:
            "Chaque équipe prépare deux minutes à cinq voix : d'où elle part, ce que chaque poste a apporté, ce qu'elle referait autrement. Répartition de la parole comprise.",
        },
        {
          minutes: 24,
          titre: "Passage des équipes",
          detail:
            "Deux minutes de présentation par équipe, chronométrées, les cinq postes prenant la parole. Le reste de la salle écoute et note une question par passage.",
        },
        {
          minutes: 11,
          titre: "Débriefing et annonce des qualifiés",
          detail:
            "Vous annoncez les équipes qualifiées pour la finale et l'horaire de la séance commune. Les autres reçoivent leur rôle de finale : analyste de salle.",
        },
      ],
      livrable:
        "Le compte rendu de direction : la trajectoire de l'entreprise en six tours, l'apport de chacun des cinq postes, la dimension de l'indice qui a le plus pesé, la décision du dernier tour avec sa raison, et ce que l'équipe referait autrement.",
      tracePasseport:
        "J'ai rendu compte oralement de ce que mon poste avait apporté à six trimestres de décisions collectives.",
      evaluation: [
        "La trajectoire est racontée par les décisions, pas par les résultats seuls.",
        "Les cinq postes prennent la parole, et chacun nomme un apport précis.",
        "La présentation tient dans les deux minutes annoncées.",
      ],
    },
    {
      numero: 7,
      titre: "La finale et le podium du campus",
      dureeMinutes: 90,
      tourJoue: null,
      processus: [
        "BTS CG P5 · Analyse et prévision de l'activité",
        "BTS MCO bloc 2 · Animer et dynamiser l'offre commerciale",
        "BTS NDRC bloc 3 · Relation client et animation de réseaux",
        "STMG thème 1 · Les organisations et l'activité de production de biens et de services",
      ],
      objectif:
        "Jouer la finale en salle commune devant le campus réuni, les équipes éliminées tenant le rôle d'analystes, puis proclamer le podium et clore l'immersion.",
      competences: [
        "Je décide sous contrainte de temps, à cinq postes, avec un public qui suit mes chiffres.",
        "J'analyse en direct la partie d'une autre équipe et j'explique ce que sa décision va produire.",
        "Je reçois un classement et j'en tire ce que je referais autrement.",
      ],
      notions: [
        "indice de pilotage global",
        "part de marché",
        "marge sur coût variable",
        "trésorerie nette",
        "compte rendu de gestion",
      ],
      preparation:
        "Lancez la finale la veille au soir : le produit exige que toutes les parties de qualification soient terminées, et il compose lui-même la partie finale avec les qualifiés, huit au maximum. Réservez la salle où les finalistes jouent devant le campus, classement projeté. Prévoyez onze minutes par tour, chronométrées, et une équipe éliminée par finaliste : elle annonce avant chaque clôture ce que la décision suivie va produire. Préparez le podium et les mots de clôture, et rappelez que la moitié de la note vient des dossiers, pas du classement.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et mise en place",
          detail:
            "Les finalistes s'installent avec leurs cinq postes, les analystes se répartissent les entreprises à suivre. Vous rappelez la règle du chronomètre et projetez le classement de départ.",
        },
        {
          minutes: 66,
          titre: "Les six tours de la finale",
          detail:
            "Onze minutes par tour : les finalistes décident poste par poste, vous clôturez, le classement se met à jour devant tout le monde. Entre deux tours, un analyste dit en trente secondes ce qu'il avait vu venir et ce qui s'est produit.",
        },
        {
          minutes: 14,
          titre: "Podium et bilan de l'immersion",
          detail:
            "Vous proclamez le podium, puis vous demandez à trois élèves de filières différentes ce qu'ils ont appris d'un poste qui n'était pas le leur. Chacun écrit ensuite les trois phrases de son dossier de tournoi avant de quitter la salle.",
        },
      ],
      livrable:
        "Le carnet de finale : la décision de chaque tour avec sa raison pour les finalistes, l'entreprise suivie et l'effet annoncé avant la clôture pour les analystes, l'écart entre cet effet et le résultat obtenu, et les trois phrases du dossier de tournoi de chaque élève.",
      tracePasseport:
        "J'ai tenu mon rôle dans la finale d'un championnat d'entreprise, en décidant sous chronomètre ou en analysant en direct les décisions d'une autre équipe.",
      evaluation: [
        "Chaque décision de finale est écrite avec sa raison, au moment où elle est prise.",
        "L'analyse annonce un effet avant la clôture, et le confronte au résultat.",
        "Les trois phrases du dossier de tournoi nomment un acte, pas une impression.",
      ],
    },
  ],
  formats: [
    {
      nom: "Deux journées banalisées",
      quand: "Le format d'origine, en semaine d'intégration ou en fin d'année.",
      comment:
        "Quatre séances le premier jour, trois le second, finale en clôture. C'est le seul format qui tienne vraiment l'immersion : les équipes mêlées se constituent le matin, vivent ensemble jusqu'au podium, et personne ne retourne dans sa classe entre deux tours.",
    },
    {
      nom: "Journée unique resserrée",
      quand: "Quand le campus ne peut banaliser qu'une journée.",
      comment:
        "Les six tours de qualification s'enchaînent sur la journée en séances raccourcies à une heure, la préparation du compte rendu passant en travail personnel, et la finale se tient la semaine suivante sur un créneau commun. Le rythme est dur mais l'immersion tient, à condition que les équipes soient constituées avant le premier jour.",
    },
    {
      nom: "Fil rouge du trimestre",
      quand: "Quand aucune journée ne peut être banalisée.",
      comment:
        "Une séance toutes les deux semaines sur un créneau commun aux filières, avec une fenêtre d'étape ouverte sur deux semaines glissantes. On y perd l'immersion et on y gagne la maturation entre deux tours ; c'est le repli, pas l'idéal.",
    },
  ],
  evaluationFinale: [
    "Les six livrables intermédiaires, relus par l'enseignant de chaque filière avec ses propres critères, pour la moitié de la note.",
    "Le compte rendu de direction à cinq voix et sa présentation de deux minutes, pour un quart.",
    "Le carnet de finale, joué ou analysé selon le rôle tenu, pour le dernier quart.",
    "Le classement du tournoi n'entre pas dans la note : une équipe éliminée en qualification peut rendre le meilleur dossier du campus.",
  ],
  prolongements: [
    "Reprendre chaque filière sur son propre atelier dans les semaines qui suivent : les élèves connaissent alors l'entreprise, et la séance de coût de revient ou de relation client part d'un terrain déjà arpenté.",
    "Confier aux équipes de deuxième année le tutorat d'une équipe de lycée sur une partie de classe ordinaire, en inversant les rôles : les anciens ne décident plus, ils expliquent.",
    "Publier la page publique du tournoi et son podium pour l'ouvrir aux familles et aux partenaires du campus, avec le nom des équipes et la composition de chacune.",
  ],
  faq: [
    {
      question: "Comment éviter que les étudiants de deuxième année décident de tout ?",
      reponse:
        "Par la règle qui porte l'immersion : rien n'est validé que le plus jeune ne puisse redire en une phrase, et la fiche de tour note qui l'a redit. Trois autres verrous s'y ajoutent : chaque poste est nommé et personne ne saisit à la place d'un autre, la séance de production est menée par la première technologique, et le compte rendu final se fait à cinq voix en deux minutes, ce qui interdit à un seul de tout dire. Passez dans les équipes en écoutant qui parle, c'est votre meilleur indicateur.",
    },
    {
      question: "Une première technologique peut-elle vraiment suivre à côté d'un BTS ?",
      reponse:
        "Oui, parce que le mode concours réduit le jeu à peu de décisions : prix, volume, communication, qualité, entretien, trésorerie, assurance. Ni recrutement, ni équipement, ni emploi des excédents. Le poste de la production, volume et qualité, demande du raisonnement sur la capacité et pas de technique comptable, et c'est un poste dont l'équipe dépend vraiment. Ce qu'un lycéen n'aura pas, c'est le vocabulaire du bilan : c'est précisément ce que son voisin de comptabilité doit lui apprendre en le disant autrement.",
    },
    {
      question: "Peut-on choisir une autre entreprise que NOVA pour le tournoi ?",
      reponse:
        "Non, pas encore. Un concours se joue sur NOVA, le fabricant d'enceintes portables, et le produit ne propose pas de choisir le secteur d'un championnat comme il le propose pour une partie de classe. C'est une contrainte technique, pas un choix pédagogique : si votre campus veut un autre secteur, faites-le jouer en parties de classe avec un classement que vous tenez vous-même.",
    },
    {
      question: "Quel niveau de jeu les équipes reçoivent-elles en concours ?",
      reponse:
        "Le niveau Pilotage, et il ne se règle pas à la création : prix, volume, communication, qualité, entretien, trésorerie et assurance sont ouverts ; le recrutement, l'équipement de l'atelier et l'emploi des excédents restent fermés. Les indices sont en outre ramenés au troisième palier, plus bas qu'en classe, et une décision validée ne se reprend plus. Cette sobriété est ce qui rend le mélange des niveaux jouable.",
    },
    {
      question: "Combien d'équipes peut-on inscrire, et combien iront en finale ?",
      reponse:
        "Le nombre d'équipes inscrites n'est pas borné : le produit tire autant de groupes que nécessaire, de deux à six équipes chacun selon votre réglage. La finale, elle, est plafonnée à huit équipes, et le nombre de qualifiés par groupe se règle de un à quatre. Pour un campus de vingt équipes mêlées, des groupes de quatre et un qualifié par groupe donnent cinq finalistes : c'est le réglage le plus lisible.",
    },
    {
      question: "Que font les équipes éliminées pendant la finale ?",
      reponse:
        "Elles deviennent analystes de salle, et c'est un vrai rôle, pas une consolation. Chaque équipe éliminée suit un finaliste, annonce avant la clôture ce que sa décision va produire, et le confronte au résultat. Un élève qui prévoit juste la décision d'un autre a compris le modèle mieux que celui qui gagne en tâtonnant, et le carnet de finale le prouve autant que le podium.",
    },
  ],
};
