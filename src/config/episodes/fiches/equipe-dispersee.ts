/**
 * FICHE ENSEIGNANT · ÉPISODE 21, L'ÉQUIPE DISPERSÉE.
 *
 * Manager une équipe itinérante qu'on voit rarement : des objectifs clairs, des
 * rituels, le lien entre pairs, et un management différent selon l'autonomie
 * de chacun. Le piège : surveiller l'activité, ou laisser chacun faire.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "equipe-dispersee",
  formations: ["bts-mco", "stmg"],
  programme: [
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
  ],
  notion:
    "Une équipe qu'on ne voit pas ne se manage pas en surveillant ce qu'elle fait : on fixe où elle va, on crée le lien qui manque, et on adapte le management à l'autonomie de chacun. L'erreur classique consiste à répondre à des résultats inégaux par le contrôle de l'activité (géolocaliser les véhicules, exiger un compte rendu chaque soir, imposer plus de visites), ou à l'inverse à laisser chacun faire. Dans l'épisode, Benoît Le Bihan dirige neuf technico-commerciaux itinérants sur le Rhône, l'Ain et l'Isère : 54 k€ de marge la semaine dernière pour un budget de 58 k€, des résultats du simple au double, 55 % de comptes rendus remplis, et le siège propose un boîtier de géolocalisation. La comparaison des visites montre que les neuf font entre 21 et 26 visites par semaine : Anaïs et Killian en font autant que les autres, mais signent un devis sur cinq contre un sur deux pour Ambre et Alassane, et perdent les dossiers techniques. Les appels disent le reste : Killian n'a vu l'équipe qu'une fois depuis son arrivée, et personne ne lit les comptes rendus. L'élève découvre que des objectifs et des rituels courts tiennent le lien, que des binômes avec les anciens font progresser les débutants là où ils perdent, qu'un compte rendu de trois lignes lu et répondu remonte des affaires, et qu'une commerciale autonome se garde par une mission plus que par une prime.",
  objectifs: [
    "Je distingue un problème d'activité d'un problème de compétence à partir des visites, des devis et des taux de signature.",
    "J'adapte mon management à l'autonomie de chacun : cadre et soutien pour les débutants, mission et latitude pour les autonomes.",
    "J'installe des rituels à distance (objectifs, point individuel, réunion d'équipe) et un compte rendu utile, lu et répondu.",
    "Je fais progresser des débutants par le travail entre pairs plutôt que par plus d'activité.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'objectif commercial, de taux de transformation et de style de management doivent avoir été vues en cours. Le management à distance et l'adaptation du management à l'autonomie du collaborateur peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/equipe-dispersee?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, la marge de l'équipe attendue en semaine 3 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 à la proposition du siège (boîtier, objectifs et rituels, objectifs seuls, rien) et la réponse à Ambre en semaine 7, où la classe se partage souvent entre la mission et la prime. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 1 : le boîtier et le compte rendu du soir au lieu des rituels.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement : 54 k€ la semaine dernière, et aucune décision de la semaine 1 ne change ce que savent faire les débutants avant les binômes de la semaine 4 ; la marge reste autour de 54 à 56 k€ selon l'activité des chantiers. Sous le tirage n° 12, la semaine 3 est plus calme (environ 7 % d'activité de moins) et le modèle donne 52 k€. Vous faites expliquer les valeurs éloignées (58, 65).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 pour Anaïs et Killian (binômes, accompagnement par Benoît, plan de visites, encouragements) et de la semaine 5 sur les comptes rendus. Vous faites lire la comparaison des visites et la relecture des devis perdus : 11 sur 14 sont des dossiers techniques, aux prix dans la norme mais incomplets. Vous faites dire à la classe ce qu'un boîtier de géolocalisation aurait appris sur ces devis.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Objectifs, rituels et pairs » finit 25,2 k€ au-dessus du budget de marge nette, « Contrôler l'activité » 125,2 k€ en dessous et « Laisser chacun faire » 90 k€ en dessous, et Ambre est partie dans les deux derniers cas. Sur les trente tirages, la première méthode tient le budget 30 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur les binômes : sous le tirage de la classe, les deux ont pris ; sur les trente tirages, les autres réponses font mieux 4 fois, quand les binômes ne prennent pas.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la question de Danielle Thévenet : qu'attendent-ils de moi ? Vous la déclinez en quatre gestes : des objectifs clairs et des rituels courts, un management qui dépend de l'autonomie de chacun, un compte rendu de trois lignes lu et répondu, et des affaires débloquées par le manager quand le commercial ne sait pas le faire seul. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 52,
    etapes: [
      "Tableau de bord du lundi : 54 k€ de marge la semaine dernière, pour un budget de 58 k€ par semaine. Le budget suppose chacun au mieux de sa forme : trois autonomes, quatre confirmés et deux débutants qui tiennent leur objectif ; or Anaïs et Killian en sont à la moitié.",
      "Source « Comparer les visites et les devis de chacun » : les neuf font entre 21 et 26 visites par semaine ; les débutants signent un devis sur cinq, contre un sur deux pour Ambre et Alassane. L'écart vient d'une compétence (les dossiers techniques), pas de l'activité.",
      "Aucune décision de la semaine 1 ne change cette compétence avant les binômes de la semaine 4 : les rituels donnent un peu de confiance dès la semaine 2, le boîtier quelques visites de plus le temps que l'effet s'use. La marge reste donc autour de 54 à 56 k€, selon l'activité des chantiers.",
      "Sous le tirage n° 12, le modèle donne 56,2 k€ en semaine 1, 54,4 k€ en semaine 2, puis 52 k€ en semaine 3, une semaine plus calme. Avec le contrôle de l'activité, il donne 49,9 k€ ; en laissant chacun faire, 50,4 k€.",
      "L'épisode juge juste à 4 k€ près, proche à 8 : « autour de 54 à 56 k€ » est juste, même sous une semaine 3 plus calme. Selon les trente tirages du bilan, la meilleure méthode donne de 47,3 à 62,7 k€ en semaine 3.",
    ],
    erreurs: [
      {
        valeur: 58,
        cause:
          "Le budget pris pour une prévision, comme si fixer des objectifs suffisait à faire signer les débutants : leur taux de signature ne change pas en deux semaines.",
      },
      {
        valeur: 65,
        cause:
          "La promesse de la plaquette du boîtier, « jusqu'à 20 % de visites en plus », appliquée à la marge (54 × 1,2) : les débutants font déjà autant de visites que les autres, et c'est le taux de signature qui manque.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "Le siège le propose : avec le boîtier et un compte rendu chaque soir, au moins, on saura où ils sont.",
      ceQuiLeDejoue:
        "La comparaison des visites le montrait : Anaïs et Killian font autant de visites que les autres ; ils perdent les dossiers techniques. La plaquette promet des visites et « ne parle pas de ventes ». Danielle Thévenet : « Regarde ce que les moins bons ne savent pas faire, pas combien de kilomètres ils font. » Ambre, douze ans de maison, le vit comme une défiance, et le compte rendu du soir prend une visite par jour. Rejoué sur les trente tirages à la place des objectifs et des rituels, il perd 72,6 k€ en moyenne, 102,8 k€ sous le tirage de la classe, et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi: "Ce sont des professionnels : les laisser s'organiser, et rester joignable.",
      ceQuiLeDejoue:
        "Les appels aux neuf : Killian n'a vu l'équipe qu'une fois depuis son arrivée et n'a « personne à appeler » quand il bloque ; Ambre demande : « Laisse-nous travailler, mais dis-nous où on va. » Marius Montagnon le rappelle : laisser faire, c'est ce qu'on fait depuis un an. Rejoué sur les trente tirages, il perd 35,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Plus de visites, donc plus de devis : un plan de 20 % de visites en plus, suivi chaque semaine.",
      ceQuiLeDejoue:
        "La relecture des devis perdus : 11 sur 14 portent sur des solutions techniques, aux prix dans la norme, mais sans relevé sur le chantier, sans variante, sans calepinage. Anaïs le dit : « si je perds mes devis, j'en perdrai juste davantage ». Alassane et Ambre, eux, sont prêts à prendre un débutant en tournée. Rejoué sur les trente tirages à la place des binômes, le plan de visites perd 15,1 k€ en moyenne ; il fait mieux 4 fois sur 30, quand les binômes ne prennent pas.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi: "Killian doute : un appel pour le rassurer, il va prendre ses marques.",
      ceQuiLeDejoue:
        "Killian a perdu son troisième devis de bardage du mois et se demande si le métier est fait pour lui : un encouragement ne lui apprend pas à faire un relevé de chantier. Les devis perdus montraient ce qui manque, et un ancien sur le terrain est le moyen le plus direct de l'apprendre. Rejoué sur les trente tirages à la place des binômes, il perd 14,8 k€ en moyenne ; il fait mieux 4 fois sur 30, quand les binômes ne prennent pas.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "La direction veut de la visibilité : un rappel écrit, compte rendu obligatoire chaque soir, et la liste des retardataires.",
      ceQuiLeDejoue:
        "Remplir soi-même un compte rendu le montrait : douze champs obligatoires dont sept que personne n'exploite, plus d'une heure par jour, et aucune réponse depuis six mois. Nordine : « Si quelqu'un s'en servait, je les ferais » ; le programme de quarante logements qu'il avait signalé est parti chez un concurrent. Obligés, les comptes rendus arrivent vides et coûtent des visites. Rejoué sur les trente tirages à la place du compte rendu de trois lignes, lu et répondu, il perd 29,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi: "Seuls les résultats comptent : laisser les comptes rendus en l'état, et ne relancer personne.",
      ceQuiLeDejoue:
        "Un compte rendu n'est pas un contrôle : bien fait, il remonte des affaires, comme les chantiers que chacun croise pour les autres. Nordine propose lui-même trois lignes, « et si quelqu'un répond, j'y mettrai même les chantiers que je croise pour les autres ». Rejoué sur les trente tirages à la place du compte rendu de trois lignes, il perd 16,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi: "Par équité : rappeler à Ambre que le cadre vaut pour tout le monde, mêmes règles, mêmes points.",
      ceQuiLeDejoue:
        "Le café avec Ambre : « Ce n'est pas l'argent. » On lui propose ailleurs de monter une équipe grands comptes, et elle aimerait qu'on lui confie quelque chose ici. Un même cadre pour une commerciale de douze ans et pour un débutant n'est pas l'équité, c'est le même management pour des besoins différents. Son départ coûterait 7 000 € de cabinet, trois mois de montée en puissance, et deux de ses clients sur trois perdus. Rejoué sur les trente tirages à la place de la mission de référente, il perd 6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi: "Si elle veut partir, elle partira : ne pas aborder le sujet.",
      ceQuiLeDejoue:
        "Félix Matthey a prévenu, et Ambre a pris un deuxième déjeuner avec le concurrent. La source des ressources humaines chiffre ce qu'un départ coûte, et le café montrait ce qui la retiendrait : une responsabilité. Rejoué sur les trente tirages à la place de la mission de référente, ne rien faire perd 4,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "Pour ne rien laisser filer avant la clôture : un point téléphonique chaque matin et l'état des devis chaque soir.",
      ceQuiLeDejoue:
        "La revue des devis en cours : 71 devis de plus de 5 000 €, dont quatre sur dix attendent depuis plus de dix jours une réponse technique, un prix à valider ou une visite à deux. Ce qui manque, c'est un manager qui débloque, pas un manager qui demande des comptes : Nordine passe « plus de temps au téléphone avec vous qu'avec mes clients ». Rejoué sur les trente tirages à la place de la revue des cinq plus gros devis de chacun, il perd 11,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 3,
      pourquoi: "Ils connaissent leurs clients : laisser chacun finir son trimestre.",
      ceQuiLeDejoue:
        "Les commerciaux ne relancent pas ce qu'ils ne savent pas débloquer : une validation de prix en dix minutes a fait signer à Alassane le chantier de Meyzieu, qui attendait depuis deux semaines. Rejoué sur les trente tirages à la place de la revue des gros devis, laisser faire perd 6,8 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu des commerciaux qui ne travaillent pas assez, d'autres des secteurs moins porteurs, d'autres des débutants isolés qui ne savent pas monter un devis technique. Quels chiffres permettaient de trancher ?",
    "Qu'aurait appris le boîtier de géolocalisation sur les devis perdus d'Anaïs et de Killian ? Que mesure-t-on quand on mesure l'activité d'une équipe dont le problème est la compétence ?",
    "Ambre et Killian ne demandent pas la même chose à leur manager. Que demande chacun, et que se passe-t-il quand on leur applique le même cadre ?",
    "Pourquoi un compte rendu obligatoire arrive-t-il vide, et un compte rendu de trois lignes, lu et répondu, rempli ? Qu'est-ce qui fait qu'un outil de suivi sert à quelque chose ?",
    "Sous le tirage de la classe, les deux binômes ont pris ; sur les trente tirages, les autres réponses font mieux 4 fois, quand ils ne prennent pas. Choisiriez-vous encore les binômes, sans savoir s'ils prendront ? Pourquoi ?",
    "Sous le tirage n° 12, Ambre est partie chez ceux qui ont contrôlé l'activité et chez ceux qui ont laissé faire, pas chez ceux de la meilleure méthode. Qu'est-ce qui, dans les décisions des semaines 1 et 7, faisait monter ce risque ?",
    "Quelle règle gardez-vous pour manager une équipe qu'on voit rarement ? Formulez-la en une phrase, avec l'autonomie de chacun dedans.",
  ],
  prolongement: {
    enonce:
      "Dans une équipe itinérante, chaque commercial fait 8 devis par semaine, et un devis signé rapporte en moyenne 2 000 € de marge. Un débutant en signe 20 %, un autonome 50 %. 1) Calculez la marge hebdomadaire d'un débutant et celle d'un autonome, et le rapport entre les deux. 2) On impose au débutant 20 % de visites en plus, qui donnent 20 % de devis en plus, au même taux de signature. Quelle est sa nouvelle marge ? 3) À la place, il part en tournée une journée par semaine avec l'autonome pendant 4 semaines ; l'autonome perd 6 % de sa marge pendant ces 4 semaines, et le débutant signe ensuite 35 % de ses devis. Calculez ce que gagne le débutant par semaine après le binôme, le coût du binôme pour l'autonome, et le gain net sur les 9 semaines qui suivent.",
    corrige:
      "1) Débutant : 8 × 0,20 × 2 000 = 3 200 € ; autonome : 8 × 0,50 × 2 000 = 8 000 € ; rapport 8 000 / 3 200 = 2,5. 2) 9,6 devis × 0,20 × 2 000 = 3 840 €, soit 640 € de plus par semaine, au prix d'une fatigue en plus. 3) Après le binôme : 8 × 0,35 × 2 000 = 5 600 €, soit 2 400 € de plus par semaine. Coût pour l'autonome : 6 % × 8 000 = 480 € par semaine, soit 1 920 € sur 4 semaines. Gain sur 9 semaines : 9 × 2 400 = 21 600 €, soit 21 600 − 1 920 = 19 680 € net. Faire progresser le taux de signature rapporte près de quatre fois plus par semaine que d'ajouter des visites.",
  },
  evaluation: [
    "La prévision de la semaine 1 part du chiffre de la semaine et tient compte du moment où chaque décision peut changer ce que savent faire les débutants.",
    "Le diagnostic distingue l'activité (visites) de la compétence (taux de signature, dossiers techniques), avec les chiffres des sources.",
    "Le management proposé est différencié : soutien et travail entre pairs pour les débutants, mission et latitude pour l'autonome.",
    "Les outils de suivi choisis (rituels, compte rendu) sont justifiés par leur usage, pas par le contrôle.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "La géolocalisation des véhicules de salariés est strictement encadrée (finalité, proportionnalité, information des salariés, consultation des représentants du personnel, recommandations de la CNIL), et ne peut en principe servir à contrôler le temps de travail que si aucun autre moyen n'existe : l'épisode la traite comme un choix de management, un enseignant de droit pourra en rappeler les limites.",
};
