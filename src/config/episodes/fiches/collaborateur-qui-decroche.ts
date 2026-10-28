/**
 * FICHE ENSEIGNANT · ÉPISODE 19, LE COLLABORATEUR QUI DÉCROCHE.
 *
 * Accompagner un collaborateur dont la performance baisse : chercher la cause
 * dans les faits, poser des objectifs et un suivi, ménager l'équipe qui
 * compense. Le piège : sanctionner sans avoir compris, ou laisser filer.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "collaborateur-qui-decroche",
  formations: ["bts-mco", "bts-gpme", "stmg"],
  programme: [
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  notion:
    "Quand un bon collaborateur se met à faire des erreurs, la cause est rarement celle qu'on croit : avant de parler d'attitude, on regarde ce qui a changé et où se concentrent les erreurs. L'erreur classique consiste à sanctionner vite parce que la direction le demande, ou à l'inverse à laisser l'équipe compenser en silence. Dans l'épisode, Sandrine Aubert, cheffe des ventes comptoir de l'agence de Bron, voit Didier Fontaine, vingt ans de maison et longtemps le meilleur vendeur, passer de moins d'une erreur de commande par semaine à 4,2 ; le directeur parle d'avertissement, et Karima reprend ses commandes le soir. L'analyse de ses erreurs montre que 28 sur 33 portent sur des commandes spéciales saisies dans le nouveau logiciel, mis en service il y a neuf semaines, et les feuilles de présence qu'il n'a suivi que la première demi-journée de la formation, parce qu'il tenait le comptoir seul. L'élève découvre qu'un entretien sur des faits datés, sans sanction, ouvre la parole, qu'un binôme sur ses vraies commandes avec des objectifs chiffrés et un point chaque vendredi le remet à niveau, que l'équipe qui compense doit être reconnue sans trahir ce qui a été confié, et qu'un collaborateur remis en confiance redevient une ressource.",
  objectifs: [
    "J'analyse une baisse de performance à partir de faits datés et je cherche ce qui a changé, avant de juger une attitude.",
    "Je conduis un entretien de recadrage sur des faits, sans sanction, et j'en tire des objectifs posés ensemble.",
    "Je construis un plan d'accompagnement : une action de formation, des objectifs chiffrés, un suivi régulier.",
    "Je gère l'équipe qui compense : je reconnais l'effort, je répartis la charge et je garde la confidentialité de ce qu'on m'a confié.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'entretien individuel, d'objectif et de formation professionnelle doivent avoir été vues en cours. L'entretien de recadrage, le plan d'accompagnement et la différence entre insuffisance et faute peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/collaborateur-qui-decroche?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le nombre d'erreurs de commande de Didier attendu en semaine 2 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la façon dont chacun ouvre le sujet en semaine 1 (avertissement, entretien, un mot entre deux clients, attente) et la réponse à l'équipe en semaine 4, où la classe se partage souvent entre réunir l'équipe et lui expliquer ce que Didier a confié. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 2 : la formation de l'éditeur au lieu du binôme avec Yacine.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement : 4,2 erreurs la semaine dernière, 33 en huit semaines, presque toutes sur les commandes spéciales du nouveau logiciel ; aucune décision de la semaine 1 ne lui apprend le logiciel avant la semaine 3. Le niveau reste donc autour de 4. Sous le tirage n° 12, la semaine 2 est chargée et le modèle donne 4,65 erreurs, avec ou sans entretien. Vous faites expliquer les valeurs éloignées (1, 2,5).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 et de la semaine 6 (avertissement, point d'étape, continuer, arrêter le suivi). Vous faites lire les feuilles de présence de la formation et la réponse de Corinne Lemaire : « Avant toute sanction, il faut des faits datés et un entretien. Et demandez-vous ce qui a changé il y a deux mois. » Pour la semaine 4, vous faites dire ce qu'a ressenti Didier en apprenant par Joël ce qu'il avait confié à sa cheffe.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Comprendre et accompagner » finit 13,7 k€ au-dessus du budget de marge nette, « Sanctionner vite » 10,3 k€ en dessous et « Laisser filer » 23,9 k€ en dessous, avec le départ de Karima. Sur les trente tirages, la première méthode tient le budget 28 fois, la sanction jamais. Vous séparez la qualité d'une décision de son résultat sur la semaine 2 : sous le tirage de la classe, la session de l'éditeur avait une place en semaine 4 et fait un peu mieux que le binôme (0,3 k€) ; en moyenne, elle perd 2,6 k€.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la démarche de l'épisode : des faits datés, ce qui a changé, un entretien sans sanction, un plan avec une action, des objectifs chiffrés et un suivi, un point d'étape qui reconnaît les progrès ou recadre avec une échéance. Vous y ajoutez l'équipe : reconnaître l'effort, répartir la charge jusqu'à une date, et ne pas trahir ce qui a été confié.",
    },
  ],
  calcul: {
    reponse: 4.5,
    etapes: [
      "Tableau de bord du lundi : 4,2 erreurs de commande la semaine dernière, contre moins d'une il y a six mois. Source « Analyser ses erreurs des huit dernières semaines » : 33 erreurs, soit un peu plus de 4 par semaine, dont 28 sur des commandes spéciales saisies dans le nouveau logiciel ; sur la vente au comptoir et l'encaissement, il ne se trompe pas plus qu'avant.",
      "La cause est une compétence qui manque (il n'a suivi que la première demi-journée de la formation) : aucune décision de la semaine 1 ne la lui donne. L'entretien ouvre la parole, l'avertissement ajoute un peu d'effort sous la menace, mais le binôme ou la formation n'agissent qu'à partir de la semaine 3.",
      "En semaine 2, le niveau reste donc celui des dernières semaines, autour de 4 erreurs, avec les variations d'une semaine plus ou moins chargée.",
      "Sous le tirage n° 12, la semaine 1 donne 3 erreurs et la semaine 2, plus chargée, 4,65 avec l'entretien ; avec l'avertissement, 4,80 ; sans rien faire, 4,97. Les erreurs ne commencent à baisser qu'en semaine 3 avec le binôme (2,9), et passent sous l'objectif de 2,5 en semaine 5.",
      "L'épisode juge juste à 0,5 erreur près, proche à 1,2. Selon les trente tirages du bilan, la semaine 2 donne de 2,35 à 4,95 erreurs : la valeur de la classe est dans le haut de la fourchette.",
    ],
    erreurs: [
      {
        valeur: 1,
        cause:
          "Le niveau d'il y a six mois, comme si l'entretien ou l'avertissement suffisaient à le remettre à niveau : la compétence sur le logiciel ne s'acquiert pas en une semaine.",
      },
      {
        valeur: 2.5,
        cause:
          "L'objectif de mi-parcours, fixé pour la semaine 6, pris pour la prévision de la semaine 2.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "Le directeur le demande et la RH dit qu'on peut : un avertissement écrit, rapide, et le message est clair.",
      ceQuiLeDejoue:
        "L'analyse des erreurs les place presque toutes sur les commandes spéciales du nouveau logiciel, et les feuilles de présence montrent qu'il n'a suivi qu'une demi-journée de formation sur deux jours, parce qu'il tenait le comptoir seul, à la demande de sa cheffe. Corinne Lemaire : « Avant toute sanction, il faut des faits datés et un entretien. » L'avertissement ferme la parole, et sous le tirage de la classe Didier s'est arrêté trois semaines. Rejoué sur les trente tirages à la place de l'entretien, il perd 14,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi: "Il a toujours été bon : ça va passer, et l'équipe compense en attendant.",
      ceQuiLeDejoue:
        "Rien ne passe seul : la cause est un outil qu'il ne maîtrise pas et qu'il évite, et Karima reprend déjà ses commandes le vendredi soir depuis deux mois. Sans suivi, Didier glisse vers un retrait poli. Rejoué sur les trente tirages à la place de l'entretien, attendre perd 6,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Un objectif clair et une échéance : moins de deux erreurs par semaine d'ici un mois, sinon la direction tranchera.",
      ceQuiLeDejoue:
        "Yacine l'expliquait : une commande spéciale, c'est quatre écrans et deux codes fournisseurs, et il peut lui montrer une heure par jour sur ses vraies commandes. Un objectif sous menace n'apprend rien : il ajoute un effort qui s'éteint avec la menace. Rejoué sur les trente tirages à la place du plan d'accompagnement, il perd 12,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi: "Le plus simple : le retirer des commandes spéciales, les autres les reprendront.",
      ceQuiLeDejoue:
        "Ses erreurs baissent parce qu'il ne saisit plus, pas parce qu'il a appris : le bilan de la semaine 6 montre que l'équipe saisit 30 % de commandes spéciales de plus, et que ses propres erreurs augmentent. Karima demande « jusqu'à quand ? », et Didier le prend comme une mise à l'écart. Rejoué sur les trente tirages, il perd 7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi: "C'est provisoire : demander à l'équipe d'être patiente, un mot à chacun, sans changer l'organisation.",
      ceQuiLeDejoue:
        "Le relevé des reprises : Karima a repris 60 % des commandes de Didier, souvent après la fermeture, Joël et Lucie presque rien ; personne n'a réparti la charge. Et un négoce concurrent l'a approchée : « j'ai l'impression d'être la seule à qui on demande des efforts ». Hugo le dit : provisoire, « ça fait déjà deux mois et demi ». Rejoué sur les trente tirages à la place de la réunion d'équipe, il perd 3,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Le courrier est prêt et la direction veut un dossier formalisé : le laisser partir ne gêne pas ce qui est en place.",
      ceQuiLeDejoue:
        "Le bilan des six semaines, chiffres en main, dit si l'objectif est tenu ; sous le tirage de la classe, il l'était. Corinne Lemaire : « Un recadrage écrit est légitime quand un plan a échoué. Un avertissement en pleine progression serait mal compris, et contestable. » Didier : « J'ai fait ce qu'on m'a demandé, et je reçois un avertissement. » Rejoué sur les trente tirages à la place du point d'étape, il perd 6,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi: "Il a compris le message : arrêter le suivi, c'est lui faire confiance.",
      ceQuiLeDejoue:
        "Le point d'étape sert à reconnaître les progrès et à alléger le suivi, pas à le supprimer sans un mot : Didier l'entend comme un désintérêt (« Ah. Bon. Plus de point le vendredi, donc. »), et sans suivi l'engagement retombe. Rejoué sur les trente tirages à la place du point d'étape, il perd 2,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi: "La direction veut un dossier bouclé avant la fin du trimestre : engager la procédure disciplinaire.",
      ceQuiLeDejoue:
        "La revue de ses commandes spéciales des deux dernières semaines : quand le plan a fonctionné, elles partent justes et le jour même, et Yacine dit qu'il va plus vite que lui sur les commandes fournisseurs. Engager une procédure contre un vendeur remis à niveau, en plein rush, le perd ; sous le tirage de la classe, il s'est arrêté les trois dernières semaines. Rejoué sur les trente tirages à la place du bilan et du pilotage des commandes du rush, il perd 4,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème d'attitude, d'autres une difficulté personnelle, d'autres un outil mal maîtrisé. Quelles sources donnaient des faits, et lesquelles des rumeurs ?",
    "Qu'est-ce qui avait changé il y a deux mois, et quelle part de responsabilité l'organisation avait-elle dans les erreurs de Didier ?",
    "Un entretien sans sanction et un avertissement disent tous deux « ça ne va pas ». Pourquoi le premier fait-il parler Didier, et pas le second ?",
    "En semaine 4, expliquer à l'équipe ce que Didier avait confié semblait honnête. Qu'est-ce que cela a coûté, et que pouvait-on dire à l'équipe sans trahir sa confiance ?",
    "Sous le tirage de la classe, la formation de l'éditeur avait une place en semaine 4 et fait un peu mieux que le binôme ; une fois sur deux, elle n'arrive qu'en semaine 8. Lequel choisissez-vous, et pourquoi ?",
    "Sous le tirage n° 12, « Sanctionner vite » a vu Didier en arrêt pendant neuf semaines. Le bilan juge-t-il la sanction sur cet arrêt, ou sur le risque qu'elle faisait courir ?",
    "Quelle règle gardez-vous face à un collaborateur qui décroche ? Formulez-la en une phrase, avec les faits dedans.",
  ],
  prolongement: {
    enonce:
      "Un vendeur fait 4,2 erreurs de commande par semaine ; chaque erreur coûte en moyenne 240 € (reprise, transport, geste au client). On raisonne sur 13 semaines. Option A : ne rien faire, les erreurs restent à 4,2. Option B : un binôme avec un collègue une heure par jour pendant quatre semaines (20 heures à 25 € de l'heure) ; les erreurs restent à 4,2 en semaines 1 et 2, sont en moyenne de 3,3 en semaines 3 à 6, puis de 1,2 en semaines 7 à 13. Option C : une formation de l'éditeur à 1 600 €, une fois sur deux en semaine 4, une fois sur deux en semaine 8 ; les erreurs restent à 4,2 jusqu'à la formation, puis tombent à 1,2. 1) Calculez le coût de chaque option (erreurs et dépenses). Pour C, calculez les deux cas, puis le coût attendu. 2) Quelle option recommandez-vous ?",
    corrige:
      "1) A : 13 × 4,2 = 54,6 erreurs, soit 54,6 × 240 = 13 104 €. B : 2 × 4,2 + 4 × 3,3 + 7 × 1,2 = 8,4 + 13,2 + 8,4 = 30 erreurs, soit 7 200 €, plus 20 × 25 = 500 €, soit 7 700 €. C en semaine 4 : 4 × 4,2 + 9 × 1,2 = 16,8 + 10,8 = 27,6 erreurs, soit 6 624 € + 1 600 € = 8 224 €. C en semaine 8 : 8 × 4,2 + 5 × 1,2 = 33,6 + 6 = 39,6 erreurs, soit 9 504 € + 1 600 € = 11 104 €. Coût attendu de C : (8 224 + 11 104) / 2 = 9 664 €. 2) B est la moins chère (7 700 €), et elle ne dépend pas d'une place libre ; C fait presque aussi bien quand la session est proche, mais coûte 1 964 € de plus en moyenne. A est la plus chère, sans compter ce que l'équipe qui rattrape finit par coûter.",
  },
  evaluation: [
    "La prévision de la semaine 1 s'appuie sur la nature des erreurs et sur le moment où chaque décision peut agir sur la compétence.",
    "Le diagnostic repose sur des faits datés (erreurs par type, feuilles de présence) et écarte les rumeurs.",
    "L'entretien et le plan d'accompagnement sont construits : une action de formation, des objectifs chiffrés, un suivi, un point d'étape.",
    "La réponse à l'équipe reconnaît l'effort et répartit la charge sans révéler ce qui a été confié.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "L'avertissement est une sanction disciplinaire ; une insuffisance professionnelle sans faute ne relève pas en principe du disciplinaire, et la procédure (entretien préalable selon la sanction, délais) est encadrée : un enseignant de droit du travail relira ce que l'épisode laisse entendre de l'avertissement. La confidentialité de ce qu'un salarié confie à son manager est présentée ici comme une règle de management, pas comme une obligation légale.",
};
