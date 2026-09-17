import type { AtelierDefinition } from "./types";

/**
 * TOURNOI DU CAMPUS · toutes les filières tertiaires, en mode concours.
 *
 * Sept séances d'une heure trente pour faire jouer, en même temps et sur la
 * même entreprise, les sections de technicien supérieur en comptabilité et
 * gestion, en management commercial opérationnel, en négociation et
 * digitalisation de la relation client, et les deux années du cycle terminal
 * en sciences et technologies du management et de la gestion.
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
 * LE CHOIX DES DEUX DIVISIONS. Le tirage des groupes est aléatoire : un
 * concours unique mettrait une équipe de première technologique face à une
 * équipe de deuxième année de technicien supérieur. L'atelier fait donc
 * tourner DEUX concours aux réglages identiques, l'un pour les sections de
 * technicien supérieur, l'autre pour le lycée. Même scénario, même niveau,
 * mêmes six tours, et surtout des groupes de même taille : le marché du jeu
 * est redimensionné selon le nombre d'entreprises en lice, et deux divisions
 * qui ne tirent pas le même nombre d'équipes par partie ne se comparent plus.
 */
export const ATELIER_CAMPUS: AtelierDefinition = {
  code: "campus",
  titre: "Faire jouer tout un campus en tournoi",
  diplome: "Campus tertiaire · BTS CG, MCO, NDRC et STMG",
  annee: "Toutes les années",
  nature: "Tournoi inter-filières",
  traceLabel: "dossier de tournoi",
  referentielLabel: "Blocs, processus et thèmes",
  referentielAccord: "mobilisés",
  pitch:
    "Sept séances d'une heure trente. Toutes les filières tertiaires du campus dirigent la même entreprise, chacune avec les yeux de sa spécialité, et s'affrontent dans un championnat à deux divisions : six tours de qualification joués dans les heures de chaque classe, puis une finale en salle commune devant le campus réuni.",
  resume:
    "Un championnat de campus sur NOVA : six tours de qualification par équipe, une finale commune, et un classement que toutes les filières lisent avec le même barème.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "7 séances de 1 h 30",
  pourquoi:
    "Un campus tertiaire enseigne la même entreprise en quatre langues sans jamais la faire voir aux élèves. Le comptable apprend à lire un compte de résultat qu'aucun commercial ne commente, le commercial construit une offre dont personne ne calcule la marge, et l'élève de technologique entend parler d'organisations qu'il ne dirige jamais. Ici tout le monde pilote la même entreprise dans la même semaine, chacun avec ses outils, et le classement tombe pour tous au même moment. Une équipe qui a baissé son prix voit sa part de marché monter et sa marge fondre ; celle qui a vendu à la chaîne de magasins encaisse quatre-vingts jours plus tard et découvre le découvert. La salle des professeurs y gagne autant que les élèves : c'est le seul moment de l'année où quatre programmes regardent le même écran.",
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
    effectifParEquipe: "trois ou quatre élèves",
    notes:
      "Le mode concours fixe presque tout, et ce qui suit se lit comme une donnée, pas comme un réglage. Le scénario est NOVA, le fabricant d'enceintes portables, imposé. Le niveau appliqué est Pilotage : prix, volume, communication, qualité, maintenance, trésorerie et assurance sont ouverts ; le recrutement, l'équipement de l'atelier et l'emploi des excédents restent fermés. Les indices sont ramenés au troisième palier, plus bas qu'en classe, et une décision validée ne se reprend plus. Aucun concurrent simulé n'entre dans une partie de concours : chaque groupe n'affronte que d'autres équipes. Le nombre d'équipes par groupe se règle entre deux et six à la création, un à quatre qualifiés par groupe, et la finale ne dépasse jamais huit équipes. Créez DEUX concours aux réglages identiques, division des sections de technicien supérieur et division du lycée, et gardez la même taille de groupe dans les deux : le marché est redimensionné selon le nombre d'entreprises en lice, et c'est cette identité qui rend les deux classements comparables. Ouvrez une fenêtre d'étape couvrant la semaine entière, pour que chaque classe joue dans ses propres heures.",
  },
  seances: [
    {
      numero: 1,
      titre: "Ouverture du tournoi et prise en main",
      dureeMinutes: 90,
      tourJoue: 1,
      processus: [
        "BTS CG P5 · Analyse et prévision de l'activité",
        "BTS MCO bloc 3 · Assurer la gestion opérationnelle",
        "BTS NDRC bloc 1 · Relation client et négociation-vente",
        "STMG thème 3 · Création de valeur et performance",
      ],
      objectif:
        "Inscrire les équipes au concours de leur division, comprendre ce que NOVA vend et à qui, et arrêter un premier prix et un premier volume en sachant ce qu'ils coûtent.",
      competences: [
        "Je situe une entreprise sur son marché à partir des clientèles qu'elle sert et de ce que chacune accepte de payer.",
        "Je calcule le coût variable d'un produit et la marge qu'un prix de vente en dégage.",
        "Je défends une première décision de prix et de volume devant mon équipe, chiffres à l'appui.",
      ],
      notions: [
        "charges variables et charges fixes",
        "marge sur coût variable",
        "seuil de rentabilité",
        "segmentation de la clientèle",
        "part de marché",
      ],
      preparation:
        "Créez les deux concours une semaine avant, notez les deux codes à six caractères et publiez la page publique de chacun : c'est l'affiche du tournoi, et elle donne aux élèves le nom de leur division. Ouvrez la fenêtre d'étape sur la semaine complète pour que chaque classe joue dans ses heures. Imprimez la fiche de tour vierge, une par équipe et par séance. Les chiffres que les équipes doivent retrouver seules : 22 € de matières et 16 € d'autres charges variables par enceinte, soit 38 € de coût variable ; 91 000 € de charges fixes par trimestre, plus 5 000 € d'amortissements ; un atelier de 7 000 enceintes et une main-d'œuvre qui en couvre 7 200. Trois clientèles, qui n'ont ni le même prix de référence ni la même sensibilité : les étudiants autour de 59 €, très sensibles au prix, les passionnés autour de 79 €, sensibles à la qualité, et CampusTech, la chaîne de magasins, autour de 55 € et réglée à quatre-vingts jours.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre du tournoi",
          detail:
            "Vous annoncez la règle : six tours de qualification, une finale, deux divisions, un classement à l'indice de pilotage. Les équipes s'inscrivent avec le code de leur division et choisissent leur nom d'entreprise.",
        },
        {
          minutes: 25,
          titre: "Lire NOVA, chacun avec ses yeux",
          detail:
            "Chaque filière relève ce que sa spécialité voit en premier : les charges et le coût de revient pour la comptabilité, l'offre et les clientèles pour le management commercial, les canaux et les conditions de règlement pour la relation client, la création de valeur et les objectifs pour la technologique. Les équipes mettent en commun ce que chacun a trouvé.",
        },
        {
          minutes: 20,
          titre: "Ce que rapporte une enceinte",
          detail:
            "L'équipe calcule son coût variable unitaire, la marge que laisse chacun des trois prix de référence, et le nombre d'enceintes qui couvre ses charges de structure. Vous circulez sans corriger : une équipe qui oublie une charge le découvrira au classement.",
        },
        {
          minutes: 15,
          titre: "Premières décisions",
          detail:
            "L'équipe arrête son prix et son volume de production, écrit en trois lignes ce qu'elle en attend, puis valide. En concours, une décision validée ne se reprend plus : dites-le avant le premier clic, pas après.",
        },
        {
          minutes: 8,
          titre: "Clôture et classement provisoire",
          detail:
            "Vous clôturez le tour de chaque groupe. Le classement de la division s'affiche, et il ne veut encore rien dire : c'est le moment de le rappeler.",
        },
        {
          minutes: 7,
          titre: "Débriefing",
          detail:
            "Deux équipes disent leur prix et leur résultat. L'écart entre les deux ouvre la séance suivante.",
        },
      ],
      livrable:
        "La fiche de tour : le coût variable unitaire et la marge de chaque clientèle, le nombre d'enceintes au seuil de rentabilité, le prix et le volume retenus avec leur justification, et le rang provisoire de l'équipe dans sa division.",
      tracePasseport:
        "J'ai fixé le prix et le volume d'une entreprise industrielle à partir du coût variable et du seuil de rentabilité que j'avais calculés.",
      evaluation: [
        "Le coût variable est calculé à partir des charges du jeu, pas estimé.",
        "Le seuil est exprimé en enceintes à vendre, pas seulement en euros.",
        "Le prix retenu est rapporté à la clientèle visée et à sa sensibilité.",
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
        "Je choisis un prix en pesant la marge unitaire contre le volume qu'elle fait perdre ou gagner.",
      ],
      notions: [
        "écart sur coût",
        "coût de revient unitaire",
        "élasticité de la demande au prix",
        "marge sur coût variable",
        "part de marché",
      ],
      preparation:
        "Relisez les deux situations que le jeu pose au deuxième tour : le surcoût à décomposer, et le prix qui fait la demande. Préparez au tableau une colonne par clientèle, où les équipes reporteront ce qu'elles ont vendu au premier tour face à ce qu'elles avaient prévu. Rappelez que les étudiants réagissent près de trois fois plus fort au prix que les passionnés : c'est le chiffre que la séance doit faire découvrir, pas celui qu'il faut donner.",
      deroule: [
        {
          minutes: 12,
          titre: "Ce que le premier tour a donné",
          detail:
            "Chaque équipe affiche son écart entre le résultat attendu et le résultat obtenu, en une phrase, sans l'expliquer encore.",
        },
        {
          minutes: 28,
          titre: "Décomposer, chacun avec ses outils",
          detail:
            "La comptabilité sépare ce qui vient du volume produit de ce qui vient du prix des charges. Le management commercial et la relation client regardent la même chose par les ventes : quelle clientèle est venue, laquelle a manqué. La technologique formule la question de gestion qui en sort.",
        },
        {
          minutes: 20,
          titre: "Le prix fait la demande",
          detail:
            "L'équipe teste sur le papier deux prix pour le tour qui s'ouvre, et estime pour chacun le volume et la marge totale. Le prix le plus élevé n'est pas toujours celui qui rapporte le plus, et l'inverse non plus : c'est le point de la séance.",
        },
        {
          minutes: 15,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, du volume et du budget de communication. La prévision de ventes reste écrite sur la fiche, elle sera confrontée au réel à la séance suivante.",
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
        "La note d'écart : l'écart du tour précédent décomposé entre volume et prix des charges, la demande observée par clientèle, les deux prix testés avec leur marge totale attendue, et le prix retenu avec sa raison.",
      tracePasseport:
        "J'ai décomposé un écart de coût entre sa part de volume et sa part de prix, puis choisi un prix de vente à partir de la réaction attendue de chaque clientèle.",
      evaluation: [
        "L'écart est décomposé, et la somme des parts retombe sur l'écart constaté.",
        "La réaction de chaque clientèle au prix est estimée avant la décision, pas après.",
        "Le prix retenu est justifié par la marge totale attendue, pas par la marge unitaire seule.",
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
        "J'estime la demande d'un trimestre à partir des trimestres joués et de ce que je décide.",
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
        "Le jeu pose au troisième tour la situation qui sépare le produire du vendre. Préparez un tableau à deux colonnes, trop produit et pas assez produit, que les équipes chiffreront. Rappelez la capacité : l'atelier sort 7 000 enceintes par trimestre, la main-d'œuvre en couvre 7 200, et c'est donc l'atelier qui borne. Une enceinte produite et non vendue reste en stock avec son coût, une enceinte demandée et non produite ne rapporte rien du tout.",
      deroule: [
        {
          minutes: 12,
          titre: "Prévision contre réel",
          detail:
            "Chaque équipe confronte la prévision de ventes écrite au tour précédent et ce qui s'est vendu. L'écart se lit en enceintes, pas en euros.",
        },
        {
          minutes: 25,
          titre: "Les deux fautes de volume",
          detail:
            "L'équipe chiffre le trop et le pas assez : ce que coûte un stock qui dort, et la marge d'une demande qu'elle n'a pas servie. La comptabilité le pose en euros, le commercial en clients perdus, la technologique en risque assumé.",
        },
        {
          minutes: 23,
          titre: "Le volume et la communication",
          detail:
            "L'équipe arrête le volume qu'elle produit et le budget de communication qui doit aller le chercher. Les deux décisions se tiennent : produire large sans faire venir personne remplit un entrepôt.",
        },
        {
          minutes: 15,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, du volume, de la communication et, si l'équipe le juge utile, du budget de qualité. La prévision de ventes est de nouveau écrite avant la clôture.",
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
        "J'ai réglé un volume de production en chiffrant d'un côté le coût des invendus et de l'autre la marge d'une demande que je n'aurais pas servie.",
      evaluation: [
        "La prévision de ventes s'appuie sur les trimestres joués et sur les décisions prises, pas sur une intuition.",
        "Les deux fautes de volume sont chiffrées toutes les deux, pas seulement celle qui arrange.",
        "Le budget de communication est relié au volume qu'il doit écouler.",
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
        "C'est la séance qui décide du tournoi, et celle où la comptabilité prend la main dans les équipes : prévoyez-y tout le temps annoncé. Les chiffres du jeu : les étudiants et les passionnés paient comptant, CampusTech à quatre-vingts jours, les fournisseurs se règlent à vingt-deux jours. Le découvert autorisé est de 30 000 € à 12 % l'an, l'escompte coûte 6 % l'an sur la moitié du poste clients au plus, l'affacturage 2,5 % de la créance cédée. La caisse d'ouverture était de 25 000 € seulement. Préparez un plan de trésorerie vierge où chaque équipe inscrira son solde attendu AVANT la clôture.",
      deroule: [
        {
          minutes: 12,
          titre: "Le trimestre qui se passe bien",
          detail:
            "Chaque équipe lit son chiffre d'affaires et son résultat, puis sa trésorerie. Chez plusieurs, les deux ne vont pas dans le même sens, et personne n'explique encore pourquoi.",
        },
        {
          minutes: 28,
          titre: "Le cycle qui avance de l'argent",
          detail:
            "L'équipe reconstitue son cycle : elle paie ses matières à vingt-deux jours, ses charges tous les mois, et encaisse la chaîne de magasins à quatre-vingts jours. Vendre davantage à ce client-là creuse la caisse avant de la remplir. C'est le besoin en fonds de roulement, et il se voit ici avant de se définir.",
        },
        {
          minutes: 20,
          titre: "Couvrir, et à quel prix",
          detail:
            "L'équipe compare le découvert, l'escompte et l'affacturage sur leur coût réel, choisit sa couverture et écrit le solde qu'elle attend. La relation client apporte l'autre levier : servir davantage les clientèles qui paient comptant, au prix d'une part de marché moindre chez la chaîne.",
        },
        {
          minutes: 15,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, du volume, de la communication et de la couverture de trésorerie. Le plan écrit reste sur la table, visible.",
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
        "Le solde prévu est écrit avant la clôture, donc opposable.",
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
        "Le scénario fait flamber le prix des matières à ce trimestre : annoncez-le en ouverture, sinon l'écart sera imputé à la prévision et non au choc. Rouvrez la fiche notion sur la rentabilité, que les équipes auront à mobiliser : un même bénéfice ne dit rien tant qu'on ignore les capitaux qui l'ont produit. Rappelez que le budget de qualité agit sur la qualité perçue et sur les rebuts, et que l'entretien protège la disponibilité de l'atelier : ni l'un ni l'autre ne se voit le trimestre où on le dépense.",
      deroule: [
        {
          minutes: 12,
          titre: "Le choc des matières",
          detail:
            "Chaque équipe mesure ce que la hausse retire à sa marge unitaire, et ce qu'elle fait à son seuil de rentabilité. Le chiffre se pose avant toute discussion.",
        },
        {
          minutes: 25,
          titre: "Répercuter, absorber, ou déplacer",
          detail:
            "L'équipe tranche : monter le prix au risque de perdre les étudiants, absorber la hausse sur la marge, ou déplacer ses ventes vers les passionnés, qui suivent mieux un prix élevé. Chaque voie se chiffre avant d'être choisie.",
        },
        {
          minutes: 23,
          titre: "Résultat ou rentabilité",
          detail:
            "Les équipes calculent leur résultat, puis le rapportent à leurs capitaux propres. Le classement de la division se lit alors autrement : celle qui gagne le plus n'est pas toujours celle qui rend le mieux ce qu'on lui a confié.",
        },
        {
          minutes: 15,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du prix, du volume, de la communication, du budget de qualité et de l'entretien. L'avant-dernier tour se joue avec le classement sous les yeux.",
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
        "La note de rentabilité : l'effet de la hausse des matières sur la marge et sur le seuil, la voie retenue avec son chiffrage, le résultat du trimestre rapporté aux capitaux propres, et les budgets de qualité et d'entretien avec ce qu'ils doivent éviter de perdre.",
      tracePasseport:
        "J'ai rapporté le résultat d'une entreprise aux capitaux qui l'ont produit pour juger sa performance autrement que par son bénéfice.",
      evaluation: [
        "L'effet de la hausse des matières est chiffré sur la marge unitaire et sur le seuil.",
        "Le résultat est rapporté aux capitaux propres, et l'écart avec le classement est commenté.",
        "Les budgets de qualité et d'entretien sont justifiés par ce qu'ils évitent, pas par principe.",
      ],
    },
    {
      numero: 6,
      titre: "Dernier tour et classement de qualification",
      dureeMinutes: 90,
      tourJoue: 6,
      processus: [
        "BTS CG P6 · Analyse de la situation financière",
        "BTS MCO bloc 1 · Développer la relation client et assurer la vente conseil",
        "BTS NDRC bloc 1 · Relation client et négociation-vente",
        "STMG thème 2 · Les organisations et les acteurs",
      ],
      objectif:
        "Jouer le dernier tour de la qualification avec le classement sous les yeux, puis rendre compte en deux minutes de ce que l'équipe a compris de son entreprise.",
      competences: [
        "Je décide un dernier tour en fonction de l'écart qui me sépare de la place que je vise.",
        "Je lis un classement multicritère et je repère la dimension qui me coûte des points.",
        "Je rends compte oralement d'une trajectoire d'entreprise en deux minutes, sans lire mes notes.",
      ],
      notions: [
        "indice de pilotage global",
        "rentabilité financière",
        "trésorerie nette",
        "part de marché",
        "compte rendu de gestion",
      ],
      preparation:
        "Annoncez l'ordre de passage en début de séance et tenez le chronomètre : deux minutes de présentation par équipe, pas une de plus. Rappelez comment se compose l'indice de pilotage, pour qu'aucune équipe ne découvre à la fin qu'elle jouait un seul critère. Prévenez que la qualification exige que TOUTES les parties de la division soient terminées : une classe en retard bloque le lancement de la finale, et c'est la seule urgence réelle de la semaine.",
      deroule: [
        {
          minutes: 12,
          titre: "Où nous place le classement",
          detail:
            "Chaque équipe repère la dimension de l'indice qui lui coûte le plus de points, et dit en une phrase ce qu'elle va tenter au dernier tour.",
        },
        {
          minutes: 20,
          titre: "Le dernier arbitrage",
          detail:
            "L'équipe décide si elle consolide ou si elle tente. Un dernier tour joué pour la place se pilote autrement qu'un tour ordinaire, et la comptabilité rappelle ici ce qu'un coup de force coûte au bilan.",
        },
        {
          minutes: 15,
          titre: "Décisions du dernier trimestre",
          detail:
            "Saisie complète, puis clôture du dernier tour de qualification par vos soins. Le classement final de la division s'affiche.",
        },
        {
          minutes: 8,
          titre: "Préparation du compte rendu",
          detail:
            "Chaque équipe prépare deux minutes : d'où elle part, ce qu'elle a décidé, ce qu'elle referait autrement. Répartition de la parole comprise.",
        },
        {
          minutes: 24,
          titre: "Passage des équipes",
          detail:
            "Deux minutes de présentation par équipe, chronométrées. Le reste de la classe écoute et note une question par passage.",
        },
        {
          minutes: 11,
          titre: "Débriefing et annonce des qualifiés",
          detail:
            "Vous annoncez les équipes qualifiées pour la finale de la division et la date de la séance commune. Les autres reçoivent leur rôle de finale : analyste de salle.",
        },
      ],
      livrable:
        "Le compte rendu de qualification : la trajectoire de l'entreprise en six tours, la dimension de l'indice qui a le plus pesé, la décision du dernier tour avec sa raison, ce que l'équipe referait autrement, et la présentation de deux minutes qui l'accompagne.",
      tracePasseport:
        "J'ai rendu compte oralement de six trimestres de pilotage en nommant la décision qui a le plus pesé sur mon classement.",
      evaluation: [
        "La trajectoire est racontée par les décisions, pas par les résultats seuls.",
        "La dimension de l'indice qui coûte le plus est nommée et expliquée.",
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
        "Jouer la finale de chaque division en salle commune, devant le campus réuni, et proclamer les deux podiums ainsi que le classement d'ensemble.",
      competences: [
        "Je décide sous contrainte de temps, en équipe, avec un public qui suit mes chiffres.",
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
        "Lancez la finale de chaque division la veille : le produit exige que toutes les parties de qualification soient terminées, et il compose lui-même la partie finale avec les qualifiés, huit au maximum. Réservez une salle où les finalistes jouent devant le campus, avec le classement projeté. Prévoyez onze minutes par tour, chronométrées, et un rôle pour chaque équipe éliminée : analyste de salle, chargée de commenter un finaliste. Préparez les deux podiums à proclamer, et rappelez que les deux divisions se comparent parce qu'elles ont joué le même scénario, le même niveau et des groupes de même taille.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et mise en place",
          detail:
            "Les finalistes s'installent, les analystes se répartissent les entreprises à suivre. Vous rappelez la règle du chronomètre et projetez le classement de départ.",
        },
        {
          minutes: 66,
          titre: "Les six tours de la finale",
          detail:
            "Onze minutes par tour : les finalistes décident, vous clôturez, le classement se met à jour devant tout le monde. Entre deux tours, un analyste de chaque division dit en trente secondes ce qu'il a vu venir.",
        },
        {
          minutes: 14,
          titre: "Podiums et bilan du campus",
          detail:
            "Vous proclamez le podium de chaque division, puis le classement d'ensemble du campus. Chaque élève écrit les trois phrases de son dossier de tournoi avant de quitter la salle.",
        },
      ],
      livrable:
        "Le carnet de finale : la décision de chaque tour avec sa raison pour les finalistes, l'entreprise suivie et l'effet annoncé avant la clôture pour les analystes, l'écart entre cet effet et le résultat obtenu, et les trois phrases du dossier de tournoi de chaque élève.",
      tracePasseport:
        "J'ai tenu mon rôle dans la finale d'un championnat d'entreprise, en décidant sous chronomètre ou en analysant en direct les décisions d'une autre équipe.",
      evaluation: [
        "Chaque décision de finale est écrite avec sa raison, au moment où elle est prise.",
        "L'analyse anticipe un effet avant la clôture, et le confronte au résultat.",
        "Les trois phrases du dossier de tournoi nomment un acte, pas une impression.",
      ],
    },
  ],
  formats: [
    {
      nom: "Semaine du campus",
      quand: "Le format d'origine : une semaine banalisée ou une semaine ordinaire.",
      comment:
        "Les six séances de qualification se jouent du lundi au vendredi, chaque classe dans ses propres heures, la fenêtre d'étape restant ouverte toute la semaine. La finale se tient le vendredi après-midi en salle commune. C'est le format qui demande le moins d'aménagement d'emploi du temps.",
    },
    {
      nom: "Fil rouge du trimestre",
      quand: "Quand le tournoi accompagne les cours de gestion de chaque filière.",
      comment:
        "Une séance de qualification toutes les deux semaines, chaque filière la plaçant dans le cours qui la sert, puis une finale commune en fin de trimestre. La fenêtre d'étape s'ouvre alors sur deux semaines glissantes, et le classement provisoire vit entre les séances.",
    },
    {
      nom: "Deux journées",
      quand: "En journée d'intégration de rentrée ou en fin d'année.",
      comment:
        "Trois séances par journée pour les qualifications, la finale en clôture de la seconde. Le rythme est dur et le débriefing court, mais la tension du championnat est à son comble et les élèves des quatre filières se parlent vraiment.",
    },
  ],
  evaluationFinale: [
    "Les six livrables intermédiaires, notés par l'enseignant de chaque filière avec ses propres critères, pour la moitié de la note.",
    "Le compte rendu de qualification et sa présentation de deux minutes, pour un quart.",
    "Le carnet de finale, joué ou analysé selon le rôle tenu, pour le dernier quart.",
    "Le classement du tournoi n'entre pas dans la note : une équipe éliminée en qualification peut rendre le meilleur dossier du campus.",
  ],
  prolongements: [
    "Rejouer le tournoi au trimestre suivant en inversant les divisions : les sections de technicien supérieur encadrent les équipes du lycée, une par une, et deviennent les conseils d'administration de leurs cadets.",
    "Reprendre chaque filière sur son propre atelier après le tournoi : les élèves connaissent alors l'entreprise, et la séance de coût de revient ou de relation client part d'un terrain déjà arpenté.",
    "Publier la page publique du tournoi et son classement pour l'ouvrir aux familles et aux partenaires du campus, avec le nom des équipes et le podium de chaque division.",
  ],
  faq: [
    {
      question: "Peut-on choisir une autre entreprise que NOVA pour le tournoi ?",
      reponse:
        "Non, pas encore. Un concours se joue sur NOVA, le fabricant d'enceintes portables, et le produit ne propose pas de choisir le secteur d'un championnat comme il le propose pour une partie de classe. C'est une contrainte technique, pas un choix pédagogique : si votre campus veut un autre secteur, faites-le jouer en parties de classe avec un classement que vous tenez vous-même.",
    },
    {
      question: "Quel niveau de jeu les équipes reçoivent-elles en concours ?",
      reponse:
        "Le niveau Pilotage, et il ne se règle pas à la création : prix, volume, communication, qualité, entretien, trésorerie et assurance sont ouverts ; le recrutement, l'équipement de l'atelier et l'emploi des excédents restent fermés. Les indices sont en outre ramenés au troisième palier, plus bas qu'en classe, et une décision validée ne se reprend plus. C'est ce qui fait la tension du tournoi, et c'est aussi pourquoi une première technologique s'y débrouille : les décisions sont peu nombreuses.",
    },
    {
      question: "Pourquoi deux concours plutôt qu'un seul pour tout le campus ?",
      reponse:
        "Parce que le tirage des groupes est aléatoire et qu'un concours unique mettrait une équipe de première technologique face à une équipe de deuxième année de technicien supérieur. Deux divisions aux réglages identiques gardent des matchs justes, et les deux classements restent comparables à une condition : la même taille de groupe des deux côtés. Le marché du jeu est redimensionné selon le nombre d'entreprises en lice, et des groupes de taille différente ne jouent pas le même barème.",
    },
    {
      question: "Que font les équipes éliminées pendant la finale ?",
      reponse:
        "Elles deviennent analystes de salle, et c'est un vrai rôle, pas une consolation. Chaque équipe éliminée suit un finaliste, annonce avant la clôture ce que sa décision va produire, et le confronte au résultat. Un élève qui prévoit juste la décision d'un autre a compris le modèle mieux que celui qui gagne en tâtonnant, et le carnet de finale le prouve autant que le podium.",
    },
    {
      question: "Combien d'équipes peut-on inscrire, et combien iront en finale ?",
      reponse:
        "Le nombre d'équipes inscrites n'est pas borné : le produit tire autant de groupes que nécessaire, de deux à six équipes chacun selon votre réglage. La finale, elle, est plafonnée à huit équipes, et le nombre de qualifiés par groupe se règle de un à quatre. Pour un campus de vingt équipes par division, des groupes de quatre et un qualifié par groupe donnent cinq finalistes : c'est le réglage le plus lisible.",
    },
    {
      question: "Comment les élèves rejoignent-ils leur division ?",
      reponse:
        "Par la page d'accueil du concours, avec le code à six caractères de leur division : le premier inscrit crée l'équipe et lui donne son nom, les suivants la rejoignent avec le même code et le même nom. Publiez la page publique de chaque concours avant la première séance, elle sert d'affiche et rappelle le code. Un élève déjà inscrit qui ressaisit le code est reconnu et renvoyé vers son équipe.",
    },
  ],
};
