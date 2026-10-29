/**
 * FICHE ENSEIGNANT · ÉPISODE 25, LES COMPÉTENCES QUI MANQUENT.
 *
 * La gestion prévisionnelle des compétences à l'échelle d'un atelier : un
 * savoir-faire tenu par deux personnes qui partent, et qui met des semaines à
 * passer. Le piège : remplacer les départs plutôt que transmettre, et croire
 * qu'une formation générique apprend les vraies pièces. Les chiffres du
 * hasard de la classe sont ceux de la graine 18.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "competences-qui-manquent",
  formations: ["stmg", "bts-gpme", "but-gea"],
  programme: [
    "STMG · Ressources humaines et communication, Thème 1, Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "Une compétence rare ne se remplace pas le jour où elle part : elle se transmet tant qu'elle est là. L'erreur classique consiste à traiter un départ à la retraite comme un poste à pourvoir (on recrute un confirmé dehors, ou l'on attend le départ pour s'organiser), ou à croire qu'une formation du fabricant comblera l'écart. Dans l'épisode, Martine Guillot dirige l'atelier de découpe et de façonnage d'Arvel Distribution à Vénissieux : douze opérateurs, une machine de découpe numérique qui fait le sur-mesure, 58 % de la marge de l'atelier, et seulement deux pilotes, René Vuillermoz et Joaquim Carvalhal, qui partent fin de semaine 8 et fin de semaine 11. Les commandes sur mesure montent de 3 % par semaine depuis trois mois (30 la semaine dernière). Sur 212 programmes de pièces récurrentes, 87 ne sont que sur la clé USB de René et 41 sur celle de Joaquim, et aucune fiche de réglage n'existe. L'élève découvre, avec la cartographie des compétences, que le savoir tient en deux têtes ; avec le formateur du fabricant, que trois jours apprennent l'interface et qu'il faut « deux à trois mois de pratique à côté de quelqu'un qui les connaît » ; avec le cabinet, qu'un confirmé se trouve une fois sur deux, en huit à dix semaines, et ne connaît pas les pièces de l'atelier. Le binôme lancé en semaine 2 a sept semaines avant le départ de René ; lancé après, il n'en a plus aucune.",
  objectifs: [
    "Je construis une cartographie des compétences et j'y repère les savoir-faire critiques tenus par une ou deux personnes.",
    "Je compare les modes d'acquisition d'une compétence (recrutement externe, formation, transmission en binôme) par leur délai, leur coût et ce qu'ils apprennent vraiment.",
    "Je formalise un savoir tacite (fiches de réglage, programmes rangés) avec ceux qui le détiennent et ceux qui le reprendront.",
    "Je mesure ce qu'une polyvalence ciblée protège (une absence, une hausse de la demande) et ce qu'une rotation de tous coûte.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de compétence, de gestion prévisionnelle des emplois et des compétences, de formation et de tutorat doivent avoir été vues en cours ; le calcul d'une marge suffit pour lire le bilan. Le savoir tacite, la cartographie des compétences et le coût de la sous-traitance peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/competences-qui-manquent?hasard=18 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de la part des commandes sur mesure faites à l'atelier en semaine 9, la première sans René à plein temps, avec le calcul de capacité qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la façon de préparer les départs en semaine 1 (recruter, binôme, formation du fabricant, attendre), et la réponse à Agencements Ferlay en semaine 5. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 4 : faire passer les douze opérateurs sur la machine au lieu de former Abdou.",
    },
    {
      minutes: 20,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées, puis vous faites le calcul avec la classe en deux colonnes : la demande de la semaine 9 (la hausse de 3 % par semaine) et la capacité de la machine (22 commandes par semaine et par pilote qui la maîtrise). Vous montrez que la réponse dépend de la décision de la semaine 1 : avec le binôme, la relève a sept semaines pour apprendre ; sans lui, Joaquim reste seul. Sous le tirage n° 18, le modèle donne 100 % avec le binôme, 86 % avec la formation du fabricant, 62 % avec le recrutement ou l'attente. Vous faites expliquer les valeurs éloignées (50, 59).",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1. Les élèves qui ont recruté un confirmé défendent leur choix (un professionnel, tout de suite opérationnel), puis la classe lit la source du cabinet : huit à dix semaines, une fois sur deux, et « il connaîtra les machines, pas vos pièces ». Ceux qui ont choisi la formation lisent le formateur du fabricant. Vous enchaînez sur la semaine 2 : pourquoi le module de bibliothèque du fabricant sauvegarde les programmes sans écrire les réglages fins, « qui restent à la main de l'opérateur ».",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 18, « Transmettre tôt » finit 12,3 k€ au-dessus du budget de marge du sur-mesure, « Attendre les départs » 32 k€ en dessous, « Acheter la compétence dehors » 55,1 k€ en dessous ; sur les trente tirages, la première tient le budget 26 fois, les deux autres jamais. Vous montrez ensuite les décisions où le hasard peut renverser le jugement : garder chacun à son poste en semaine 4 fait un peu mieux que former Abdou une fois sur deux, quand personne ne manque ; mais former Abdou est une assurance, qui paie le jour où un pilote est absent.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : une compétence critique se transmet tant que celui qui la détient est là, et le délai d'apprentissage se compte à rebours depuis la date du départ. Vous la déclinez en quatre gestes : cartographier, mettre en binôme sur les vraies pièces, faire écrire ce qui n'est écrit nulle part, former un troisième pilote pour les absences. Vous ajoutez le geste de la fin : garder le senior quelques jours par semaine, si le droit le permet, plutôt que de le remplacer. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 100,
    etapes: [
      "La demande de la semaine 9 (alerte du lundi) : 30 commandes sur mesure la semaine dernière, en hausse de 3 % par semaine ; en semaine 9, 30 × (1 + 0,03 × 8) ≈ 37 commandes, avant le contrat éventuel d'Agencements Ferlay, qui ne se présente qu'en semaine 5. Sous le tirage n° 18, la demande est un peu plus forte et le contrat a été accepté : 53 commandes.",
      "La capacité : un pilote qui maîtrise la machine fait environ 22 commandes par semaine (avec René et Joaquim, la machine fait jusqu'à 44 commandes). En semaine 9, René est parti ou ne revient que deux jours par semaine ; Joaquim est là jusqu'à la fin de la semaine 11 : 22 commandes.",
      "La relève : la cartographie montre que Hamza lit les plans et prépare les panneaux pour René, et qu'Océane fait le façonnage des pièces sur mesure et connaît les gammes. Le formateur du fabricant compte « deux à trois mois de pratique à côté de quelqu'un qui les connaît ». Avec le binôme lancé en semaine 2, Hamza et Océane ont sept semaines à côté de leur tuteur : Hamza peut piloter à plein temps en semaine 9, Océane à mi-temps aux côtés de Joaquim. Capacité attendue : 22 + 22 + une dizaine, au-dessus de la demande : l'atelier fait tout.",
      "Ce que le modèle a donné sous le tirage n° 18 : Hamza a appris vite (maîtrise de 0,91 sur 1 en semaine 9), Océane est à 0,66, Abdou en appui, et René a accepté le cumul emploi-retraite deux jours par semaine. Les 53 commandes sont toutes faites à l'atelier : 100 %. L'épisode juge juste à 8 points près, proche à 20 ; selon les trente tirages, la même méthode donne de 65 % à 100 %, et 100 % dans 25 cas sur 30.",
      "Pour comparer, sous le même tirage : avec la formation du fabricant, 86 % ; en recrutant dehors ou en attendant, 62 %, parce que Hamza est mis à la machine au départ de René sans l'avoir apprise.",
    ],
    erreurs: [
      {
        valeur: 50,
        cause:
          "Un pilote sur deux qui part, donc la moitié des commandes faites : c'est oublier que la relève apprend pendant sept semaines, et que la demande comme la capacité se calculent en commandes, pas en personnes.",
      },
      {
        valeur: 59,
        cause:
          "Joaquim seul face à la demande de la semaine 9 (22 / 37) : le calcul de capacité est juste pour qui attend les départs, mais il ignore ce que le binôme de la semaine 1 a appris à Hamza et à Océane.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Deux opérateurs vont manquer : un professionnel confirmé, recruté tout de suite par un cabinet, sera opérationnel dès son arrivée.",
      ceQuiLeDejoue:
        "Clarisse Perret, du cabinet, le dit : huit à dix semaines, 7 000 € d'honoraires, un salaire au-dessus de la grille, une fois sur deux seulement, « et il connaîtra les machines, pas vos pièces ». L'arrivée espérée en semaine 10 tombe après le départ de René, et personne n'aura appris la machine à côté de lui. Ghislaine Pradal l'avait conseillé : « regarde ce que René sait que personne d'autre ne sait. » Rejoué sur les trente tirages à la place du binôme, le recrutement perd 47 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "L'équipe n'a jamais été formée à la machine : quatre places à la formation du fabricant en semaine 3, c'est rapide et sérieux.",
      ceQuiLeDejoue:
        "Aurélien Lacoste, le formateur, le dit lui-même : « Nos trois jours apprennent l'interface et les fonctions de base, sur nos pièces d'exemple. Pour vos pièces à vous, comptez deux à trois mois de pratique à côté de quelqu'un qui les connaît. » La formation plafonne la maîtrise, coûte 7 600 € sur une enveloppe de 12 000 €, et ne met personne en binôme sur les vraies commandes. Rejouée sur les trente tirages à la place du binôme, elle perd 30,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Les programmes sont sur des clés USB : le module du fabricant les centralise et les sauvegarde sur le serveur, sans prendre de temps à René et Joaquim.",
      ceQuiLeDejoue:
        "L'inventaire de la semaine 2 montre que le problème n'est pas seulement le rangement : aucune fiche de réglage, et les corrections d'outil, les vitesses par type de panneau, l'ordre d'usinage des pièces complexes « sont dans leur tête ». Le fabricant le confirme : « Les réglages fins restent à la main de l'opérateur. » Une demi-journée par semaine pour écrire avec ceux qui prendront la suite fait apprendre plus vite et rater moins de pièces (Océane « m'a posé trois questions que je ne me posais plus »). Rejoué sur les trente tirages à la place des fiches écrites, le module perd 8,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Abdou est volontaire : l'inscrire à la formation du fabricant avec deux autres opérateurs, c'est former vite un troisième pilote.",
      ceQuiLeDejoue:
        "Comme pour la semaine 1, trois jours chez le fabricant n'apprennent que l'interface ; ensuite, « ils pilotent ce qu'ils peuvent », et 5 700 € partent de l'enveloppe. La cartographie montre qu'Abdou s'en sort sur les plans simples et connaît les pièces sur mesure : c'est aux côtés de Hamza et Océane, sur les pièces répétitives, qu'il apprend (« en l'expliquant, il le comprend mieux »). Rejouée sur les trente tirages à la place de l'appui d'Abdou, la formation perd 5,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Pour que personne ne soit indispensable, chacun des douze passe une demi-journée par semaine sur la machine.",
      ceQuiLeDejoue:
        "Joaquim raconte la première semaine : « Le temps de leur montrer où sont les boutons, la demi-journée est finie. Et deux panneaux de compact sont partis au rebut. » La rotation dilue le temps des tuteurs entre douze personnes au lieu de trois, coûte 900 € par semaine et multiplie les reprises, à 480 € la pièce ratée. La source sur les absences demande un pilote de plus, pas douze à moitié. Rejouée sur les trente tirages à la place de l'appui d'Abdou, la rotation perd 15,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu deux postes à pourvoir, d'autres un savoir à transmettre. Qu'est-ce que la cartographie des compétences montrait, et que ne montrait pas la comparaison de productivité avec les autres sites ?",
    "Le cabinet, la formation du fabricant et le binôme : pour chacun, dites le délai, le coût et ce qu'il apprend vraiment. Pourquoi le binôme lancé en semaine 2 vaut-il plus que le même binôme lancé en semaine 9 ?",
    "87 programmes sur la clé de René, aucune fiche de réglage. Qu'est-ce qu'un savoir tacite ? Pourquoi faut-il l'écrire avec ceux qui le reprendront, et pas seulement le sauvegarder ?",
    "Accepter tout le contrat de Ferlay, c'est dix commandes de plus par semaine, avec des pénalités de retard. À quelle condition l'atelier pouvait-il le prendre, et quelles sources permettaient de le savoir en semaine 5 ?",
    "Sous le tirage n° 18, aucun pilote n'a manqué au mauvais moment, et garder chacun à son poste en semaine 4 aurait fait un peu mieux que former Abdou ; sur les trente tirages, c'est le cas une fois sur deux, et former Abdou reste meilleur en moyenne. Pourquoi ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "René accepte de revenir deux jours par semaine. Qu'est-ce que cette solution apporte que la prime pour reporter son départ n'apporte pas ? Que faut-il vérifier avant de la lui proposer ?",
    "Quelle règle gardez-vous pour un départ à la retraite annoncé ? Formulez-la en une phrase, avec un délai dedans.",
  ],
  prolongement: {
    enonce:
      "Un atelier reçoit 40 commandes sur mesure par semaine. Une commande faite à l'atelier laisse 420 € de marge, une commande sous-traitée 80 €. Deux pilotes font chacun 22 commandes par semaine ; l'un part à la retraite dans huit semaines. 1) Sans relève, combien de commandes l'atelier fait-il après le départ, et que perd-il chaque semaine en marge ? 2) Un binôme de sept semaines coûte 700 € par semaine ; il permet à l'apprenti de faire 18 commandes par semaine dès le départ du senior. Calculez son coût et la perte de marge évitée sur les cinq semaines qui suivent le départ. 3) Une formation du fabricant coûte 7 600 € ; elle permet à l'apprenti de faire 8 commandes par semaine après le départ. Même calcul. 4) Comparez les trois options sur les cinq semaines après le départ.",
    corrige:
      "1) Il ne reste que 22 commandes faites à l'atelier, 18 sous-traitées : 18 × (420 − 80) = 6 120 € de marge perdue par semaine. 2) Coût : 7 × 700 = 4 900 €. L'atelier fait 22 + 18 = 40 commandes : plus rien n'est sous-traité, la perte évitée est de 5 × 6 120 = 30 600 €, soit un gain net de 25 700 €. 3) L'atelier fait 30 commandes, en sous-traite 10 : perte de 10 × 340 = 3 400 € par semaine, 17 000 € sur cinq semaines, plus 7 600 € de formation, soit 24 600 € ; la perte évitée n'est que de 30 600 − 17 000 = 13 600 €, pour 7 600 € dépensés. 4) Sans relève : 30 600 € de marge perdue ; formation : 24 600 € au total ; binôme : 4 900 €. Le binôme coûte le moins, mais il ne vaut que s'il commence assez tôt pour que l'apprenti ait le temps d'apprendre à côté du senior.",
  },
  evaluation: [
    "La cartographie des compétences est lue juste : l'élève nomme le savoir-faire critique, ceux qui le détiennent, ceux qui peuvent le reprendre, et la date des départs.",
    "L'estimation de la semaine 9 est construite par un calcul de demande et de capacité écrit, qui tient compte de la décision de la semaine 1, et l'écart avec 100 % est expliqué.",
    "Les modes d'acquisition de la compétence (recrutement, formation, binôme) sont comparés par leur délai, leur coût et ce qu'ils apprennent des vraies pièces.",
    "La réponse au contrat de l'agenceur et la polyvalence de la semaine 4 sont justifiées par la capacité réelle de la relève et par le risque d'une absence.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 18.",
  ],
  vigilance:
    "L'épisode pose que René a l'âge légal et tous ses trimestres, et qu'il fait liquider toutes ses retraites, de base et complémentaires : son cumul emploi-retraite est alors intégral, sans plafond de revenus, dès la rupture de son contrat. Mais il reprend chez son dernier employeur : avant six mois, cette activité ne lui ouvre aucun nouveau droit ; après six mois, elle lui vaut une seconde pension, plafonnée (réforme de 2023). Sans ces conditions, le cumul serait plafonné, et sa pension de base serait suspendue s'il revenait chez son dernier employeur avant six mois (service-public.gouv.fr, fiche F13243, vérifiée le 29 octobre 2026). La loi de financement de la sécurité sociale pour 2026 modifie ces règles au 1er janvier 2027 : à vérifier dans les textes en vigueur avant de les présenter comme telles. La prévision dépend fortement de la décision de la semaine 1 et du tirage (de 65 % à 100 % avec la même méthode) : c'est le calcul de demande et de capacité qu'il faut corriger, plus que le chiffre.",
};
