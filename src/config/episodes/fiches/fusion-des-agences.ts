/**
 * FICHE ENSEIGNANT · ÉPISODE 29, LA FUSION DES AGENCES.
 *
 * L'intégration d'une entreprise rachetée : dans un négoce, on achète des
 * clients, et les clients suivent leurs vendeurs. Le piège est double : tout
 * aligner d'un coup sur les procédures de l'acheteur pour régler les doublons,
 * ou laisser vivre deux agences côte à côte. Les chiffres du hasard de la
 * classe sont ceux de la graine 4.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "fusion-des-agences",
  formations: ["dcg", "bts-gpme", "but-gaco"],
  programme: [
    "DCG · UE 7, Management des organisations",
    "BTS GPME · Bloc 4, Soutenir le fonctionnement et le développement de la PME",
    "BUT GACO · Participer au pilotage interne de l'organisation",
  ],
  notion:
    "Dans le rachat d'un négoce, on n'achète ni des murs ni un stock : on achète des clients, et les clients ont des visages. L'erreur classique consiste à intégrer en alignant tout, tout de suite, sur les procédures de l'acheteur pour supprimer les doublons, sans voir que l'incertitude et le choc des procédures font partir les vendeurs, et que leurs clients les suivent ; l'erreur inverse consiste à laisser vivre deux agences côte à côte, sans rien trancher. Dans l'épisode, Jérôme Castaing dirige l'agence Arvel Distribution de Vienne ; Arvel vient de racheter les Établissements Combelle, à trois rues : quatorze salariés, 620 artisans, un ancien patron, Raymond Combelle, qui reste six mois comme conseiller. Les doublons coûtent 6,3 k€ par semaine. Mais 76 % de la marge du négoce passe par quatre personnes (Sébastien 32 %, Taous 18 %, Pierrick 14 %, Raymond 12 %), sept artisans sur dix ne commandent qu'à leur interlocuteur, et en 2019 près de la moitié des clients d'un vendeur parti l'ont suivi. Les prix sont alignés à 1 % près. L'élève découvre qu'il faut dire vite à chacun ce qu'il devient, donner un rôle réel à ceux qui portent les clients, Raymond compris, basculer le logiciel en deux temps, et apprendre du négoce ce qu'il fait mieux : un devis dans l'heure, quand Arvel met 46 heures et perd 31 % de ses gros devis.",
  objectifs: [
    "J'identifie ce qui fait la valeur d'une entreprise rachetée (ici, des clients attachés à des personnes) avant de chiffrer les synergies.",
    "Je réduis l'incertitude des salariés repris en disant vite qui fait quoi, et je donne aux personnes clés un rôle réel.",
    "Je compare le gain d'une synergie (les doublons supprimés) au risque qu'elle fait courir (les vendeurs et les clients qui partent).",
    "Je reconnais ce que l'entreprise rachetée fait mieux, et je l'étends au lieu de l'aligner.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de croissance externe, de synergie, de culture d'entreprise et de conduite du changement doivent avoir été vues en cours ; le calcul d'une marge suffit pour lire le bilan. La rétention des clients par les personnes et le coût des doublons peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/fusion-des-agences?hasard=4 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de la part des clients du négoce qui commandent encore en semaine 3 et ce qui la justifie, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la façon de lancer l'intégration en semaine 1 (recevoir chacun, appliquer les procédures d'Arvel, laisser tourner, attendre le siège) et le sort de Pierrick en semaine 3. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 9 : rappeler les procédures d'Arvel au lieu d'étendre la délégation de devis.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées. Vous partez des 97 % du tableau de bord au lendemain du rachat, puis vous faites dire ce qui fait partir un client dans les premières semaines : un service qui se dégrade, et l'inquiétude de son vendeur, qu'il sent. Le modèle donne 95,3 % en recevant chacun et en annonçant l'organisation sous quinze jours, 95,1 % en laissant tourner, 95,1 % en attendant le siège, 93 % en appliquant les procédures d'Arvel dès lundi. Vous faites expliquer les valeurs éloignées (97, 90, 81) et vous faites remarquer que les écarts, petits en trois semaines, se creusent ensuite.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et de la semaine 3. Les élèves qui ont appliqué les procédures d'Arvel défendent leur choix (des règles, des marges maîtrisées, des doublons réglés), puis la classe lit le déjeuner avec Sébastien, Taous et Pierrick : « Vos procédures, on peut les apprendre. Mais dites-nous d'abord où on sera. » Pour Pierrick, vous faites lire la source des ressources humaines : le faire redevenir vendeur modifie son contrat. Vous enchaînez sur Raymond : ses quarante clients historiques le suivent, Timothée Rolland le dit.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 4, « Clarifier vite, garder les clients » finit 12,8 k€ au-dessus du plan, « Attendre le siège » 112,8 k€ en dessous, « Tout aligner sur Arvel » 114,9 k€ en dessous ; sur les trente tirages, la première tient le plan 26 fois, les deux autres jamais. Sous ce tirage, aucun vendeur n'est parti, mais la reprise des prix a laissé passer quelques erreurs malgré la vérification (2 000 € d'avoirs). Vous montrez la décision où le hasard renverse le plus souvent le jugement : la bascule du logiciel en un week-end, qui fait mieux que la bascule en deux temps 12 fois sur 30, quand elle ne tourne pas mal.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois mécanismes de l'épisode : les clients suivent les personnes ; l'incertitude fait partir les personnes ; un rachat apporte aussi des façons de faire meilleures. Vous les reliez aux gestes : recevoir chacun et dire sous quinze jours qui fait quoi, des rôles nouveaux plutôt que des rétrogradations, l'ancien patron qui présente le repreneur à ses clients, une bascule informatique vérifiée par ceux qui connaissent les fiches, la réactivité du négoce étendue à toute l'agence. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 95.3,
    etapes: [
      "Point de départ (tableau de bord au lendemain du rachat) : les clients du négoce qui commandent encore font 97 % de sa marge au rachat ; le baromètre RH compte 55 % de salariés du négoce inquiets pour leur poste.",
      "Ce qui fait partir un client, d'après les sources : sept artisans sur dix ne commandent qu'à leur interlocuteur ; un service qui se dégrade (le devis en 48 heures au lieu d'une heure) et un vendeur inquiet font partir les premiers. Avec la semaine 1 choisie, le service du négoce ne change pas : seule l'inquiétude pèse, et elle baisse à mesure que chacun est reçu, puis que l'organisation cible est annoncée en semaine 3.",
      "Le modèle compte, chaque semaine, une perte d'environ 0,2 % plus 0,8 % de l'inquiétude : 0,64 % en semaine 1 (inquiétude à 55 %), 0,6 % en semaine 2 (50 %), 0,5 % en semaine 3 (37 %, l'organisation annoncée).",
      "Calcul : 97 × (1 − 0,0064) × (1 − 0,006) × (1 − 0,005) ≈ 97 × 0,9827 ≈ 95,3 %. L'épisode juge juste à 1,5 point près, proche à 4. Le chiffre ne dépend pas du hasard : il est le même sur les trente tirages.",
      "Pour comparer : en appliquant les procédures d'Arvel dès lundi, le devis passe à 48 heures et la palette à J+1, le service se dégrade dès la semaine 2, et la part tombe à 93 % ; en laissant tourner ou en attendant le siège, l'inquiétude ne baisse pas, et la part est à 95,1 %. L'écart, petit en trois semaines, se creuse quand les vendeurs commencent à partir.",
    ],
    erreurs: [
      {
        valeur: 97,
        cause:
          "La part du lendemain du rachat reportée telle quelle : même quand le service ne change pas, l'inquiétude des vendeurs fait partir quelques clients chaque semaine.",
      },
      {
        valeur: 90,
        cause:
          "L'objectif de 90 % pris pour une prévision : c'est le seuil que la direction veut voir tenir en fin de trimestre, pas l'état des clients en semaine 3.",
      },
      {
        valeur: 81,
        cause:
          "La moitié des clients de Sébastien comptés comme déjà partis (97 − 32 × 0,5) : c'est ce que montre l'exemple de 2019 si un vendeur s'en va, pas ce qui se passe tant qu'il est là.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Le plan de rachat suppose les doublons réglés en semaine 10 : appliquer dès lundi les procédures d'Arvel, avec une seule tournée, maîtrise les marges et économise tout de suite.",
      ceQuiLeDejoue:
        "L'analyse du portefeuille : 76 % de la marge du négoce passe par quatre personnes, sept artisans sur dix ne commandent qu'à leur interlocuteur, et les prix sont déjà alignés. Taous le dit au déjeuner : « Un maçon appelle à 7 h, il a son devis à 8 h et sa palette à 10 h. » Le premier jour, Timothée Rolland attend son devis jusqu'au jeudi. Véronique Lansard l'avait conseillé : « Regarde d'abord à qui ils parlent. » Rejouées sur les trente tirages à la place des entretiens, les procédures dès lundi perdent 42,3 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Ne rien changer pendant six mois évite de bousculer les équipes et les clients du négoce.",
      ceQuiLeDejoue:
        "Les doublons continuent de coûter 6,3 k€ par semaine, les deux agences livrent le même chantier à une heure d'écart et font chacune leur remise, et l'inquiétude reste entière : personne n'a dit aux salariés du négoce ce qu'ils deviennent, et Sébastien a déjà reçu deux appels du Comptoir Rhodanien. Rejoué sur les trente tirages à la place des entretiens, laisser tourner perd 41,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Un organigramme clair, conforme au siège : Ariane cheffe de comptoir, Pierrick vendeur, à salaire égal.",
      ceQuiLeDejoue:
        "La source sur le comptoir montre deux métiers : Ariane organise (99,2 % de fiabilité du stock), Pierrick fidélise (140 artisans qui le demandent par son prénom, 14 % de la marge du négoce). Les ressources humaines préviennent : redevenir vendeur modifie son contrat, il peut refuser, et des chefs de comptoir sont partis pour moins que ça ; un rôle nouveau au même salaire ne pose aucune difficulté. Rejoué sur les trente tirages à la place du rôle de responsable des comptes artisans, l'organigramme perd 21,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Faire codiriger le comptoir évite de décevoir l'un ou l'autre.",
      ceQuiLeDejoue:
        "Ariane l'a dit : « Je ne peux pas diriger un comptoir où la moitié de l'équipe prend ses consignes ailleurs. » Deux chefs, deux façons de faire : un client livré sans bon de commande, une équipe qui ne sait plus qui décide, et les doublons de postes qui restent. Rejouée sur les trente tirages à la place des deux rôles distincts, la codirection perd 34,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Raymond accorde des délais et des remises sans prévenir et dit aux clients que « rien ne changera » : il faut un seul patron, et lui demander de ne plus intervenir.",
      ceQuiLeDejoue:
        "Les trois clients historiques appelés le disent : « S'il me dit que vous êtes sérieux, je reste. S'il me dit qu'on l'a mis dehors, je vais voir ailleurs. » Ses quarante clients font 12 % de la marge du négoce, et son contrat de conseil ne dit pas ce qu'il fait : il suffit de le lui dire, en lui confiant la présentation du repreneur. Écarté, il peut se vexer et le raconter à ses clients. Rejoué sur les trente tirages à la place de la mission de présentation, l'écarter perd 6,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "L'équipe du négoce connaît Raymond : lui confier sa direction jusqu'à son départ la rassure.",
      ceQuiLeDejoue:
        "Gilbert Aubin le demande déjà : « Qui dirige le négoce ? » Raymond aux commandes, ce sont deux agences qui ne se parlent plus « qu'à la machine à café », des remises et des délais accordés à l'ancienne chaque semaine, et une intégration repoussée à son départ, dans quatre mois. Rejoué sur les trente tirages à la place de la mission de présentation, il perd 15,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le siège propose une bascule en un week-end : un seul logiciel dès la semaine 10, moins cher que la bascule en deux temps, et la double saisie s'arrête plus tôt.",
      ceQuiLeDejoue:
        "L'agence de Bourgoin a basculé en un week-end : un tiers des prix spéciaux mal repris, trois semaines de factures fausses, onze clients partis ; son directeur ferait vérifier les fiches par ceux qui les connaissent et formerait en binômes, « deux semaines de plus, et rien de cassé ». Le négoce compte 1 900 prix négociés. Une bascule en un week-end tourne mal une fois sur deux. Rejouée sur les trente tirages à la place de la bascule en deux temps, elle perd 5,7 k€ en moyenne ; elle fait mieux 12 fois, quand elle se passe bien.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Garder les deux logiciels jusqu'à l'été évite tout risque de bascule ratée.",
      ceQuiLeDejoue:
        "Tiago Moreira chiffre ce que coûte l'absence de risque : 2,8 k€ par semaine de licences et de ressaisie, « tant qu'il le faudra ». La bascule en deux temps (3 500 €) supprime à la fois la double saisie et l'essentiel du risque. Rejoué sur les trente tirages à la place de la bascule en deux temps, garder les deux logiciels perd 14 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Des devis de 4 000 € sans validation, c'est perdre la maîtrise des marges : il faut rappeler à tous les procédures d'Arvel.",
      ceQuiLeDejoue:
        "La comparaison des devis perdus : Arvel perd 31 % de ses devis de plus de 2 000 €, le négoce 12 % ; la différence tient au délai, 46 heures contre 50 minutes, et les marges du négoce sont à 0,4 point de celles d'Arvel. Kader Benmoussa vient de perdre un chantier de 18 k€ sur le délai. Rejoué sur les trente tirages à la place de la délégation étendue, le rappel des procédures perd 25,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Chaque équipe a ses façons de faire, et elles marchent : inutile d'y toucher.",
      ceQuiLeDejoue:
        "Les artisans d'Arvel voient la différence (« Chez Combelle, le devis arrive dans l'heure ») et Arvel continue de perdre un gros devis sur trois. Ce que le négoce fait mieux peut servir à toute l'agence : la délégation de devis et la tournée du matin, avec la relecture des gros devis que Pierrick et Taous pratiquent déjà. Rejoué sur les trente tirages à la place de la délégation étendue, laisser chacun faire perd 19,2 k€ en moyenne ; il fait mieux 3 fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Un courrier soigné à tous les clients du négoce, avec la grille d'Arvel et le nom de leur commercial de secteur, rassure tout le monde pour 500 €.",
      ceQuiLeDejoue:
        "La source sur les clients démarchés : trente artisans choisis portefeuille par portefeuille, et aucun client perdu jusqu'ici n'est parti pour le prix seul ; ils partent après le départ de leur vendeur ou un service raté. Timothée Rolland le dit : « J'ai reçu une lettre avec un nom que je ne connais pas. Le Rhodanien, lui, est venu me voir sur le chantier. » Rejoué sur les trente tirages à la place des visites avec le vendeur habituel, le courrier perd 18,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu des doublons à supprimer, d'autres un négoce sans règles, d'autres des clients attachés à des personnes. Quelles sources permettaient de trancher, et que disait le rapport d'audit ?",
    "76 % de la marge du négoce passe par quatre personnes. Qu'est-ce que cela change à la façon de mener l'intégration ? Que coûte un vendeur qui part, d'après l'exemple de 2019 ?",
    "Pierrick redevenu vendeur ou responsable des comptes artisans : même salaire, même comptoir. Pourquoi l'un est-il risqué et l'autre non ? Qu'en dit le droit du travail, d'après la source des ressources humaines ?",
    "Le négoce répond aux devis en 50 minutes, Arvel en 46 heures. Pourquoi une entreprise qui rachète doit-elle aussi apprendre de celle qu'elle rachète ? Quel risque fallait-il encadrer en étendant la délégation ?",
    "Sous le tirage n° 4, la bascule en deux temps a quand même laissé passer des erreurs de prix, et sur les trente tirages la bascule en un week-end fait mieux 12 fois. Fallait-il basculer en un week-end ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Raymond Combelle peut faire gagner ou perdre ses quarante clients. Qu'est-ce qui, dans son contrat de conseil, rendait sa conduite imprévisible, et comment la mission de présentation y répond-elle ?",
    "Quelle règle gardez-vous pour intégrer une entreprise rachetée ? Formulez-la en une phrase, avec un délai dedans.",
  ],
  prolongement: {
    enonce:
      "Une agence rachetée fait 22 950 € de marge par semaine. Trois vendeurs en portent une grande part : Sébastien 32 % de la marge, Taous 18 %, Pierrick 14 %. S'ils partent chez un concurrent, une part de leurs clients les suit : la moitié pour Sébastien, 40 % pour Taous, 45 % pour Pierrick. 1) Quelle marge hebdomadaire chacun porte-t-il ? 2) Quelle marge hebdomadaire perdrait l'agence si chacun partait, puis si les trois partaient ? 3) Sur les 13 semaines qui suivent leur départ, que coûterait le départ des trois ? 4) Aligner tout de suite l'agence sur les procédures de l'acheteur supprime les doublons quatre semaines plus tôt, soit 6 300 € par semaine d'économie ; mais la probabilité que chacun des trois parte passe de 10 % à 60 %. Le jeu en vaut-il la chandelle ?",
    corrige:
      "1) Sébastien : 0,32 × 22 950 = 7 344 € ; Taous : 0,18 × 22 950 = 4 131 € ; Pierrick : 0,14 × 22 950 = 3 213 €. 2) Sébastien : 7 344 × 0,5 = 3 672 € ; Taous : 4 131 × 0,4 = 1 652,40 € ; Pierrick : 3 213 × 0,45 = 1 445,85 € ; les trois : 6 770,25 € par semaine. 3) 6 770,25 × 13 = 88 013,25 €. 4) Économie : 4 × 6 300 = 25 200 €. Coût attendu supplémentaire des départs : la probabilité monte de 50 points pour chacun, soit 0,5 × 88 013,25 = 44 006,63 €. Bilan : 25 200 − 44 006,63 = −18 806,63 € : aligner tout de suite fait perdre près de 19 k€ en moyenne, et davantage si les clients partis ne reviennent pas au trimestre suivant.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 identifie ce qui fait la valeur du rachat (des clients attachés à quatre personnes) avec l'analyse du portefeuille, et écarte les prix et l'audit.",
    "L'estimation de la part des clients en semaine 3 est raisonnée à partir du point de départ et de ce qui fait partir un client, et l'écart avec 95,3 % est expliqué.",
    "Les décisions sur les personnes (Pierrick, Raymond, Sébastien) donnent un rôle réel à ceux qui portent les clients, en tenant compte de ce que le contrat de travail permet.",
    "Le gain des synergies (doublons, logiciel unique) est comparé au risque qu'elles font courir, et ce que le négoce fait mieux est étendu plutôt qu'aligné.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 4.",
  ],
  vigilance:
    "L'épisode affirme que faire redevenir vendeur un chef de comptoir est une modification de son contrat qu'il peut refuser : c'est juste quand la fonction ou la qualification change, même à salaire égal, mais l'employeur peut changer les tâches dans la même qualification ; la frontière est à préciser aux élèves. Dans un rachat d'entreprise, les contrats de travail des salariés repris se poursuivent avec le nouvel employeur. La prévision est un indicateur du modèle que les sources ne chiffrent pas semaine par semaine : c'est le raisonnement (ce qui fait partir un client, et quand) qu'il faut corriger.",
};
