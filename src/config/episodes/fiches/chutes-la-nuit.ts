/**
 * FICHE ENSEIGNANT · ÉPISODE 89, LES CHUTES DE LA NUIT.
 *
 * Analyser des événements indésirables avant d'agir : les chutes se
 * concentrent sur une douzaine de résidents, au lever du petit matin et
 * après les traitements du soir. Le piège est de contenir (barrières,
 * somnifères, fauteuil) ou de surveiller partout sans cibler.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "chutes-la-nuit",
  formations: ["bts-gpme", "stmg", "but-gea"],
  programme: [
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
    "STMG · Première, sciences de gestion et numérique, Thème 4 · Temps et risque",
    "BUT GEA · Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
  ],
  notion:
    "Un indicateur global (41 chutes, 1,8 chute par résident et par an, « dans la moyenne ») ne dit pas où agir ; l'analyse des déclarations une par une le dit. L'erreur classique consiste à répondre à la pression des familles et de la direction par la protection la plus visible : des barrières de lit, un somnifère plus fort, un fauteuil en salle commune, une ronde de plus, des capteurs partout. Dans l'épisode, l'EHPAD de Chalon-sur-Saône de l'Association Solvanne (90 places) a compté 41 chutes en été, dont 29 la nuit, et deux fractures ; la direction veut un quart de chutes en moins. L'analyse montre que douze résidents font 28 chutes, que 19 des 29 chutes de nuit ont lieu entre 5 h et 7 h au lever pour aller aux toilettes, dans le noir et en chaussons ouverts, quand plus personne ne passe, et que neuf des douze reçoivent un hypnotique ou un anxiolytique le soir. Si rien ne change, l'hiver en fera environ 44. L'élève découvre que l'on traite des causes précises (une tournée au petit matin avec lumière et chaussage, la revue des traitements par paliers, l'activité physique adaptée, des capteurs pour les seuls douze), qu'une barrière fait tomber de plus haut et qu'une contention se prescrit, se motive et se réévalue, et que les premiers effets demandent plusieurs semaines.",
  objectifs: [
    "J'analyse une série d'événements indésirables par personne, par heure et par circonstance pour en trouver les causes principales.",
    "Je prévois un nombre d'événements sur une période à partir d'un rythme passé et d'un effet saisonnier.",
    "Je distingue une mesure qui traite une cause d'une mesure qui déplace le risque (moins de chutes, mais des fractures plus graves ou une perte de la marche).",
    "J'explique une décision à une famille qui demande autre chose, avec les faits de son parent et les risques de ce qu'elle demande.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de risque, d'événement indésirable, de déclaration et d'analyse des causes doivent être connues ; une règle de trois suffit pour le calcul. Le rôle de l'infirmière coordinatrice, du médecin coordonnateur et du projet personnalisé peut être présenté en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/chutes-la-nuit?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous lisez le bilan trimestriel (41 chutes, 29 la nuit, deux fractures) et la demande de la direction (un quart de chutes en moins), et vous demandez de noter sur papier la prévision de chutes d'octobre à décembre, avec son calcul, et le plan présenté vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (barrières, aide-soignante de nuit, tournée ciblée, note de service), la réponse au fils de Mme Lamboley (semaine 4) et la décision pour la nuit (semaine 8), où la classe se partage. Un binôme qui a fini tôt classe les 41 chutes de l'été par résident et par heure à partir de la source des déclarations.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, puis vous refaites le calcul avec la classe : 41 chutes en treize semaines, neuf semaines d'automne au même rythme, quatre semaines de décembre à un quart de plus. Vous faites expliquer les valeurs éloignées (41, 51,25 ou 30,75). Vous comparez ensuite l'objectif de la direction (un quart de moins que l'été, environ 31) à la prévision (environ 44) : il faut retirer près de 14 chutes, et les douze en font 28 sur 41.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 et de la semaine 8. Pour la semaine 1, faites lire la nuit passée avec l'équipe : personne ne passe entre 4 h 30 et 7 h. Pour la semaine 4, faites lire les chutes de Mme Lamboley et son projet personnalisé, puis la réponse du siège sur la contention. Pour la semaine 8, faites comparer les deux essais de Montbard : cent alertes par nuit sur 70 chambres, une dizaine sur dix résidents choisis.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Analyser, puis traiter les causes » finit avec 30 chutes et aucune fracture, pour 40,9 k€ de coût des chutes ; « Contenir et surveiller » avec près de 48 chutes, deux fractures et 110,3 k€ ; « Attentiste » avec près de 46 chutes, deux fractures, une plainte et une inspection, 92,3 k€. Vous faites lire la note de service de la semaine 1, qui fait mieux 16 fois sur 30 à la place de la tournée ciblée et perd 4,2 k€ en moyenne, et la barrière posée chez Mme Lamboley, qui fait mieux 7 fois. C'est le moment de séparer la qualité d'une décision de son résultat, et de rappeler qu'une fracture évitée ne se voit pas.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la démarche : compter, puis analyser chez qui, à quelle heure et dans quelles circonstances ; traiter chaque cause là où elle est ; mesurer l'effet après plusieurs semaines ; réévaluer. Vous rappelez que la sécurité d'un résident ne se gagne pas contre sa liberté d'aller et venir sans motif médical réévalué, et que ces décisions relèvent d'une équipe soignante. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 44.15,
    etapes: [
      "Message du bilan trimestriel : de juillet à septembre, 41 chutes déclarées en treize semaines, soit 41 / 13 ≈ 3,15 chutes par semaine.",
      "Source « Analyser les 41 déclarations de chute une par une » : sur les trois derniers hivers, décembre a compté un quart de chutes de plus que l'automne. Le trimestre d'octobre à décembre compte neuf semaines d'automne (semaines 1 à 9) et quatre semaines de décembre (semaines 10 à 13).",
      "Automne : 9 × 41 / 13 ≈ 28,38 chutes. Décembre : 4 × 41 / 13 × 1,25 ≈ 15,77 chutes.",
      "Total si rien ne change : 41 × (9 + 4 × 1,25) / 13 = 41 × 14 / 13 ≈ 44,15 chutes. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 2 chutes près, proche à 5.",
    ],
    erreurs: [
      {
        valeur: 41,
        cause: "Le chiffre de l'été reconduit tel quel : la hausse de décembre, signalée dans la source des déclarations, est oubliée.",
      },
      {
        valeur: 51.25,
        cause: "Le quart de plus appliqué à tout le trimestre (41 × 1,25) : il ne vaut que pour les quatre semaines de décembre.",
      },
      {
        valeur: 30.75,
        cause: "L'objectif de la direction (un quart de chutes en moins, 41 × 0,75) pris pour la prévision : c'est ce que l'on vise, pas ce qui arrivera si rien ne change.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Deux familles les demandent, le médecin coordonnateur propose de les prescrire, et une barrière empêche de tomber du lit : les familles seront rassurées.",
      ceQuiLeDejoue:
        "Les recommandations sur la contention : une barrière retire un quart des chutes du lit, mais le résident qui l'enjambe tombe de plus haut, avec plus de trois fois plus de fractures ; elle demande une surveillance toutes les deux heures et fait perdre la marche. Les déclarations montrent que les chutes de nuit ont lieu au lever pour aller aux toilettes, ce qu'une barrière n'empêche pas. Nafissatou Sakho le voit dès la première nuit : M. D. passe la jambe par-dessus à 5 h. Rejouées sur les trente tirages à la place de la tournée ciblée, les barrières perdent 35 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Nafissatou le dit : trois soignants la nuit pour 90 résidents ne peuvent pas être dans toutes les chambres. Une aide-soignante de plus paraît la réponse évidente.",
      ceQuiLeDejoue:
        "La nuit passée avec l'équipe montre que le problème n'est pas le nombre mais l'heure : la tournée passe à 1 h et à 4 h dans toutes les chambres, puis plus personne entre 4 h 30 et 7 h, quand les sonnettes s'allument par vagues. Avancer une prise de poste à 5 h 30 chez les douze coûte 150 € par semaine ; une aide-soignante de plus, 3 400 € par semaine en intérim puis 1 700 € en CDD, sans changer l'organisation. Rejouée sur les trente tirages, elle perd 26 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "L'équipe de nuit le demande : si ceux qui se lèvent à 5 h dorment jusqu'à 7 h, il n'y a plus de lever dangereux.",
      ceQuiLeDejoue:
        "La relecture des ordonnances avec le pharmacien : neuf des douze prennent déjà un hypnotique ou un anxiolytique le soir, quatre en prennent deux, sept prescriptions ont plus d'un an sans réévaluation ; un hypnotique plus fort allonge la somnolence au réveil, et le lever de 5 h devient plus dangereux. Nafissatou le constate : à 5 h, quand ils se lèvent quand même, ils ne tiennent pas debout. Rejoué sur les trente tirages à la place de la revue en commission, le somnifère plus fort perd 3,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le fils menace d'écrire à l'ARS ce soir, le médecin peut prescrire tout de suite : poser la barrière règle le conflit.",
      ceQuiLeDejoue:
        "Les chutes de Mme Lamboley ont toutes lieu entre 5 h 30 et 6 h 30, en allant aux toilettes, sans blessure grave ; elle marche seule avec un déambulateur et tient à se lever seule, c'est écrit dans son projet personnalisé. Madeleine Sirugue rappelle qu'une contention ne se pose pas à la demande d'une famille. Le recevoir avec le médecin coordonnateur, lui montrer les chutes de sa mère et proposer un lit bas et un tapis répond à son inquiétude. Rejouée sur les trente tirages, la barrière fait mieux 7 fois, mais perd 2,8 k€ en moyenne.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Installés au fauteuil en salle commune, ils sont sous les yeux de l'équipe toute la journée : ils ne tombent pas, et cela ne coûte rien.",
      ceQuiLeDejoue:
        "Le bilan de marche avec la kinésithérapeute : huit des douze peuvent suivre un atelier d'activité physique adaptée, qui fait baisser les chutes jusqu'à près de la moitié au bout de trois ou quatre semaines ; un résident installé au fauteuil toute la journée perd la marche en quelques semaines. Lucrèce Garaudet le constate : M. D. ne marche plus jusqu'à la salle à manger. Rejoué sur les trente tirages à la place de l'atelier, le fauteuil perd 1,7 k€ en moyenne sur le trimestre et ne fait jamais mieux ; la perte d'autonomie, elle, dure au-delà.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Équiper tout l'établissement protège tout le monde, et la brochure promet jusqu'à 70 % de chutes en moins.",
      ceQuiLeDejoue:
        "L'essai de Montbard : sur ses 70 chambres, plus de cent alertes par nuit, dont neuf sur dix pour un résident qui se retourne, et une équipe qui ne répondait plus au bout de trois semaines. Sur dix résidents choisis d'après leurs chutes, une dizaine d'alertes par nuit, presque toutes entre 5 h et 6 h 30. La brochure est du bruit. Rejoués sur les trente tirages à la place des capteurs pour les douze, les capteurs partout perdent 5,3 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "L'équipe de nuit préfère passer partout toutes les heures : au moins, on voit, et cela ne coûte rien.",
      ceQuiLeDejoue:
        "Montbard l'a essayé l'hiver d'avant : la ronde toutes les heures réveillait les résidents, avec plus de confusion et plus de chutes au milieu de la nuit. Nafissatou le constate : M. G. s'est levé à 3 h pour s'habiller. Les chutes ont lieu au lever, entre 5 h et 7 h, chez les douze. Rejouée sur les trente tirages, la ronde perd 1,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La grippe arrive et l'équipe sera réduite : tout renouveler, et en ajouter pour les agités, garde l'hiver tranquille.",
      ceQuiLeDejoue:
        "Le registre des contentions, résident par résident : l'indication ne tient plus que pour trois résidents ; les autres ont une prescription reconduite sans réévaluation, ou posée à la demande d'une famille, et chacune coûte une surveillance toutes les deux heures. Nafissatou prévient qu'avec plus de barrières, il reste moins de temps pour les levers. Rejoué sur les trente tirages à la place de la réévaluation, tout renouveler perd 5,3 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un manque de bras, d'autres des somnifères, d'autres la dépendance des résidents. Qu'est-ce que l'analyse des 41 déclarations une par une montrait que le taux de 1,8 chute par résident ne montrait pas ?",
    "Une barrière retire un quart des chutes du lit et triple les fractures. Comment une mesure peut-elle faire baisser un indicateur et augmenter le dommage ? Quel indicateur faut-il suivre, alors ?",
    "Le fils de Mme Lamboley demandait une barrière. Qu'est-ce qui, dans le projet personnalisé de sa mère et dans ses chutes, permettait de lui proposer autre chose ? Comment lui dire non sans le perdre ?",
    "La revue des traitements et l'atelier d'activité physique ne font effet qu'après plusieurs semaines. Comment tenir face à une direction qui veut un résultat ce trimestre ?",
    "En semaine 1, la note de service fait mieux 16 fois sur 30 que la tournée ciblée, et perd 4,2 k€ en moyenne. Sous le tirage n° 12, la méthode des causes n'a eu aucune fracture. Est-ce la preuve qu'elle était bonne ? Qu'est-ce qui l'est ?",
    "Capteurs pour tous, ronde toutes les heures, capteurs pour les douze : pourquoi la surveillance la plus large est-elle ici la moins efficace ?",
    "Quelle règle gardez-vous avant de décider d'une mesure de sécurité ? Formulez-la en une phrase, avec une heure ou un nombre dedans.",
  ],
  prolongement: {
    enonce:
      "Une résidence de 80 places a compté 36 chutes en treize semaines d'été. Dix résidents en font 24 ; 14 de leurs chutes ont lieu au lever, entre 5 h et 7 h. Les hivers précédents, les quatre dernières semaines du trimestre ont compté 20 % de chutes de plus que le reste de l'automne. 1) Prévoyez le nombre de chutes du trimestre d'automne si rien ne change. 2) Une tournée au petit matin chez les dix, mise en place en semaine 3, retire 60 % de leurs chutes au lever. Combien de chutes évite-t-elle sur les semaines 3 à 13, en comptant le rythme de l'été ? 3) On propose plutôt des barrières pour les dix : elles retirent un quart de leurs 24 chutes, mais chaque chute restante a 15 % de risque de fracture, contre 5 % sans barrière. Combien de fractures attend-on avec et sans barrières sur les chutes des dix ?",
    corrige:
      "1) 36 / 13 × (9 + 4 × 1,2) = 36 / 13 × 13,8 ≈ 38,2 chutes. 2) Les dix font 14 chutes au lever en 13 semaines, soit 14 / 13 ≈ 1,08 par semaine ; sur 11 semaines, 11 × 14 / 13 ≈ 11,8 chutes au lever, dont 60 % évitées, soit environ 7,1 chutes. 3) Sans barrières : 24 × 0,05 = 1,2 fracture attendue. Avec barrières : 24 × 0,75 = 18 chutes, et 18 × 0,15 = 2,7 fractures attendues, plus du double, pour moins de chutes.",
  },
  evaluation: [
    "La prévision est juste (41 × 14 / 13 ≈ 44 chutes), avec l'effet de décembre appliqué aux seules quatre dernières semaines.",
    "Le diagnostic s'appuie sur l'analyse des déclarations par résident, par heure et par circonstance, chiffres de la source à l'appui.",
    "Chaque mesure est jugée sur le dommage (fractures, perte de la marche, confusion) et pas seulement sur le nombre de chutes.",
    "La réponse à la famille s'appuie sur les faits de la résidente, son projet personnalisé et les règles de la contention, sans céder ni opposer un simple refus écrit.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode met en scène des décisions cliniques : prescription et réévaluation d'une contention, déprescription des hypnotiques et des anxiolytiques par paliers, protecteurs de hanche, activité physique adaptée. Les chiffres d'effet (un quart de chutes du lit en moins, trois fois plus de fractures, la moitié de chutes en moins avec l'atelier, quatre semaines de paliers au moins) sont ceux du modèle fictif, pas des données de la littérature, et un professionnel de santé (médecin, pharmacien ou infirmier) doit relire la fiche avant qu'on en tire une règle de soin. La contention relève d'une prescription médicale motivée et réévaluée, dans le respect de la liberté d'aller et venir du résident : les recommandations de la Haute Autorité de santé sont la référence à consulter. Aucune modification de traitement ne se décide en dehors du médecin prescripteur.",
};
