/**
 * FICHE ENSEIGNANT · ÉPISODE 84, LA FAMILLE QUI ÉCRIT À L'ARS.
 *
 * Traiter une réclamation en EHPAD : établir les faits avant de répondre, et
 * séparer ce qui est fondé (le matin du week-end, le linge) du malentendu. Le
 * piège est de défendre l'équipe en bloc, ou de sanctionner une soignante
 * pour montrer qu'on a réagi.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "famille-qui-ecrit",
  formations: ["bac-pro-agora", "stmg", "bts-gpme"],
  programme: [
    "Bac pro AGORA · Bloc 1, Gérer des relations avec les clients, les usagers et les adhérents",
    "STMG · Terminale, ressources humaines et communication, Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    "BTS GPME · Bloc 1, Gérer la relation avec les clients et les fournisseurs de la PME",
  ],
  notion:
    "Une réclamation se traite comme un fait à établir, pas comme une attaque à repousser ni comme une faute à punir. L'erreur classique consiste à choisir un camp avant d'avoir les chiffres : défendre l'équipe en bloc (« les soins sont faits, la famille exagère »), ou écarter la soignante citée pour donner un signal à l'ARS. Dans l'épisode, Mme Ginette Durupt, fille d'une résidente de l'EHPAD de Dijon-Montchapet (96 places, Association Solvanne), a écrit à l'ARS et au journal : toilettes faites tard, sonnettes sans réponse, linge perdu. Le journal des appels donne raison à une partie de la lettre : 6 minutes à la sonnette de 7 h à 9 h en semaine, 19 minutes le week-end, parce que six aides-soignantes prennent leur poste à 7 h le week-end contre neuf en semaine ; et 64 pièces de linge perdues en huit semaines depuis l'arrivée de la Blanchisserie Ondelys. L'autre partie est un malentendu : la toilette tardive de semaine est un choix de la résidente, inscrit dans son projet personnalisé, que personne n'a expliqué à sa fille. L'élève découvre qu'un renfort de deux heures le samedi et le dimanche coûte 120 € par week-end, que la réponse factuelle avec un plan daté fait clore le dossier, et qu'une sanction sans faits coûte des arrêts, des départs et l'inspection qu'elle voulait éviter.",
  objectifs: [
    "Je confronte une réclamation aux données (journal des appels, plannings, transmissions) pour séparer ce qui est fondé de ce qui ne l'est pas.",
    "Je calcule le coût d'un renfort en heures, avec la majoration du dimanche, et je le compare à une solution d'intérim.",
    "Je rédige une réponse à une autorité de contrôle qui donne une chronologie, des faits, des causes et un plan daté.",
    "J'associe la famille et le conseil de la vie sociale au suivi, au lieu de répondre par une plaquette ou une tribune.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'usager, de réclamation, de projet personnalisé et de prestataire doivent être connues ; le calcul d'un coût horaire suffit. Le rôle de l'ARS et du conseil de la vie sociale peut être présenté en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/famille-qui-ecrit?hasard=13 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous lisez à voix haute la lettre de l'ARS, sans commentaire, et vous demandez de noter sur papier le coût du renfort calculé en semaine 1, avec son calcul, et la première réponse faite à l'équipe.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (reprendre les faits, défendre l'équipe, mise à pied, attendre), la réponse à l'ARS en semaine 3 et le renfort du week-end en semaine 5, où la classe se partage entre les volontaires et l'intérim. Un binôme qui a fini tôt classe chaque reproche de la lettre en fondé, malentendu ou à vérifier.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous refaites le calcul avec la classe : deux heures le samedi à 28 €, deux heures le dimanche à 32 €, sur treize week-ends. Vous faites expliquer les valeurs éloignées (1,456 k€, 0,728 k€ ou 6,24 k€). Vous terminez en mettant les 1 560 € en face d'une seule inspection sur place, que le modèle chiffre à 6 000 € sans l'audit qu'elle peut imposer.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 et de la semaine 5. Pour la semaine 1, faites lire la phrase de la lettre : « Je ne demande pas qu'on punisse qui que ce soit. » Pour la semaine 3, faites relire ce que l'ARS demande (chronologie, éléments factuels, causes, mesures datées) et la source du siège : une réponse factuelle fait clore neuf fois sur dix, une réponse qui dit que tout est conforme vaut une inspection deux fois sur trois. Pour la semaine 5, mettez face à face les 120 € des volontaires et les 480 € de l'intérim, avec le risque de juin.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 13, « Établir les faits, corriger, associer les familles » coûte 13,2 k€ à l'EHPAD, « Défendre l'établissement » 51,8 k€ et « Attentiste » 52,9 k€ : Mme Durupt s'est apaisée après le rendez-vous, l'ARS a clos sans inspecter, Ondelys a accepté son plan et les volontaires ont tenu en juin. Vous faites lire la semaine 5 : les volontaires lâchent environ une fois sur cinq, et l'intérim fait alors mieux, 6 fois sur 30, tout en coûtant 1,4 k€ de plus en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les quatre temps d'une réclamation bien traitée : établir les faits avec l'équipe, recevoir la famille, répondre à l'autorité avec des chiffres et un plan daté, suivre avec les familles. Vous rappelez que chercher un coupable avant les faits abîme l'équipe sans rien corriger, et que reconnaître ce qui est fondé n'est pas désavouer les soignants : elles étaient six pour 96. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 1.56,
    etapes: [
      "Source « Rapprocher les plannings et les transmissions des week-ends » : six aides-soignantes de 7 h à 9 h le week-end contre neuf en semaine ; une heure d'aide-soignante coûte 28 € charges comprises, 32 € le dimanche avec l'indemnité de dimanche.",
      "Un renfort d'une aide-soignante de 7 h à 9 h, c'est deux heures le samedi et deux heures le dimanche : 2 × 28 + 2 × 32 = 56 + 64 = 120 € par week-end.",
      "Le trimestre compte treize week-ends : 13 × 120 = 1 560 €.",
      "Soit 1,56 k€. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 0,1 k€ près, proche à 0,3 k€.",
      "Pour comparer : le devis de Soralis Intérim Santé, à 60 € de l'heure avec quatre heures au moins par mission, revient à 2 × 4 × 60 = 480 € par week-end, 4 fois plus, pour des intérimaires qui ne connaissent pas les résidents.",
    ],
    erreurs: [
      {
        valeur: 1.456,
        cause:
          "L'indemnité de dimanche oubliée : les quatre heures du week-end à 28 € (4 × 28 × 13 = 1 456 €).",
      },
      {
        valeur: 0.728,
        cause:
          "Un seul jour compté, le samedi (2 × 28 × 13 = 728 €) : le renfort couvre le samedi et le dimanche.",
      },
      {
        valeur: 6.24,
        cause:
          "Le devis d'intérim pris pour le renfort (480 € × 13 = 6 240 €) : la question porte sur une aide-soignante de l'équipe, pas sur une mission de quatre heures au tarif de l'agence.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi:
        "L'équipe est blessée, Fatoumata a pleuré tout le service, et l'EHPAD est dans la moyenne des réclamations de l'association : soutenir les soignants paraît le premier devoir d'une directrice.",
      ceQuiLeDejoue:
        "Le journal des appels donne 19 minutes à la sonnette le week-end matin contre 6 en semaine, et 31 % des appels attendent plus d'un quart d'heure ; Madeleine Sirugue prévient qu'une famille se trompe rarement sur ce qu'elle voit le dimanche matin. La comparaison des réclamations entre EHPAD est du bruit. La note affichée, Mme Durupt la photographie (« Alors c'est moi qui exagère ? »). Rejoué sur les trente tirages à la place de la reprise des faits, défendre en bloc perd 10,5 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Une aide-soignante est citée par son prénom : l'écarter le temps d'y voir clair paraît un signal fort pour l'ARS et pour la famille.",
      ceQuiLeDejoue:
        "Les plannings montrent la cause : six aides-soignantes pour 96 résidents de 7 h à 9 h le week-end depuis la refonte du roulement, Fatoumata seule pour seize résidents ce dimanche-là. La lettre dit deux fois : « Je ne demande pas qu'on punisse qui que ce soit. » Après une sanction sans faits, l'équipe s'arrête ou démissionne, et plus personne ne se porte volontaire pour commencer à 7 h. Rejouée sur les trente tirages, la mise à pied perd 27,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Une lettre courte, relue par le siège, qui dit que les soins sont conformes au plan de soins : c'est vrai, rapide, et sans risque d'en dire trop.",
      ceQuiLeDejoue:
        "La source « Demander à l'accueil et à l'équipe du soir comment se passent ses visites » : personne n'a expliqué à Mme Durupt que sa mère avait choisi de se lever tard en semaine, et elle demande surtout qui viendra plus tôt le dimanche. Madeleine Sirugue résume la lettre : juste sur le fond, elle ne répond à aucune question. Rejouée sur les trente tirages à la place du rendez-vous avec l'infirmière coordinatrice et le médecin coordonnateur, elle perd 8,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Reconnaître un manque, c'est donner des armes à l'ARS et au journal : une réponse ferme protège l'établissement et l'équipe.",
      ceQuiLeDejoue:
        "L'ARS demande une chronologie, des éléments factuels, l'analyse des causes et des mesures datées, « à défaut d'éléments probants, une inspection sur place pourra être diligentée ». Madeleine Sirugue le chiffre : une réponse factuelle avec un plan daté fait clore neuf fois sur dix, une réponse qui dit que tout est conforme vaut une inspection à peu près deux fois sur trois. Rejouée sur les trente tirages, la réponse ferme perd 5,6 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Montrer à l'ARS que la direction a réagi : reconnaître les manquements et annoncer une procédure contre la soignante citée.",
      ceQuiLeDejoue:
        "Les causes établies sont collectives : le roulement de septembre, qui fait commencer les renforts à 9 h, et le linge mal suivi depuis janvier. Une procédure disciplinaire ne corrige ni l'un ni l'autre, et Briag Prudhon rapporte que les filles du week-end sont écœurées. Rejouée sur les trente tirages, elle perd 13,7 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Le journal a publié un article : y répondre dans le journal paraît la façon de rétablir l'image de l'établissement et de son équipe.",
      ceQuiLeDejoue:
        "Fernande Grivot, présidente du conseil de la vie sociale : les familles veulent des chiffres et des dates, pas une plaquette, et une séance où on montre ce qui a changé vaut mieux que dix courriers ; le conseil ne s'est pas réuni depuis février. La tribune fait aussitôt appeler Mme Durupt par le journaliste. Rejoué sur les trente tirages à la place du conseil en séance extraordinaire, le droit de réponse perd 4 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une famille qui exagère, d'autres une soignante fautive, d'autres une organisation. Qu'est-ce qui, dans le journal des appels et les plannings, permettait de trancher ? Qu'est-ce qui, dans la lettre, était fondé, et qu'est-ce qui était un malentendu ?",
    "Un renfort coûte 1 560 € sur le trimestre. Pourquoi la direction ne l'avait-elle pas mis en place avant la lettre ? Qu'est-ce que la refonte du roulement de septembre avait changé ?",
    "Défendre l'équipe et reconnaître ce qui est fondé : est-ce contradictoire ? Comment Briag Prudhon et les filles du week-end ont-ils reçu chacune des deux réponses ?",
    "L'ARS clôt neuf fois sur dix une réponse factuelle avec un plan daté. Pourquoi une réponse qui dit que tout est conforme appelle-t-elle plus souvent une inspection, alors qu'elle n'avoue rien ?",
    "En semaine 5, les volontaires coûtent 120 € par week-end, l'intérim 480 € garantis. Sous le tirage n° 13 les volontaires ont tenu ; sur les trente tirages, l'intérim fait mieux 6 fois. Lequel choisissez-vous, et que faites-vous si le renfort lâche en juin, alors qu'il est écrit dans le plan envoyé à l'ARS ?",
    "Sous le tirage n° 13, la méthode des faits coûte 13,2 k€ et la défense de l'établissement 51,8 k€. Si l'ARS n'avait pas inspecté ceux qui ont défendu l'établissement, leur décision aurait-elle été bonne ?",
    "Quelle règle gardez-vous pour la prochaine réclamation ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une résidence de 70 places reçoit une réclamation sur les levers du week-end. Le renfort envisagé est une aide-soignante de 7 h à 10 h le samedi et le dimanche ; l'heure coûte 27 € charges comprises, 30 € le dimanche. Une agence d'intérim facture 58 € de l'heure, quatre heures au moins par mission. 1) Calculez le coût du renfort par week-end et sur un trimestre de treize week-ends. 2) Même calcul avec l'intérim. 3) Le renfort par l'équipe s'arrête après neuf week-ends, et l'on prend l'intérim pour les quatre derniers : que coûte le trimestre ? 4) Le prestataire du linge perd 10 pièces par semaine, dont 70 % ne sont pas marquées ; la résidence rembourse 35 € par pièce, et le contrat prévoit 30 € de pénalité par pièce marquée perdue, jamais réclamée. Sur le trimestre, combien la résidence rembourse-t-elle, et combien de pénalités aurait-elle pu réclamer ?",
    corrige:
      "1) 3 × 27 + 3 × 30 = 81 + 90 = 171 € par week-end, soit 13 × 171 = 2 223 € sur le trimestre. 2) 2 × 4 × 58 = 464 € par week-end, soit 13 × 464 = 6 032 €. 3) 9 × 171 + 4 × 464 = 1 539 + 1 856 = 3 395 €, encore bien moins que l'intérim sur tout le trimestre. 4) 10 × 35 = 350 € par semaine, soit 13 × 350 = 4 550 € remboursés ; 3 pièces marquées perdues par semaine, soit 13 × 3 × 30 = 1 170 € de pénalités. Marquer les vêtements apportés après l'entrée ferait entrer les autres pièces dans le champ des pénalités.",
  },
  evaluation: [
    "Le coût du renfort est calculé juste (deux heures le samedi à 28 €, deux heures le dimanche à 32 €, treize week-ends, 1,56 k€), à partir de la source nommée.",
    "Chaque reproche de la lettre est classé, preuves à l'appui, en fondé (le matin du week-end, le linge) ou en malentendu (la toilette tardive de semaine, choisie par la résidente).",
    "La réponse à l'ARS proposée contient une chronologie, des faits, une analyse des causes et des mesures datées, sans mettre en cause une personne.",
    "Le choix du renfort est argumenté comme un arbitrage entre le coût, la connaissance des résidents et le risque que les volontaires lâchent en juin.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 13.",
  ],
  vigilance:
    "La mise à pied conservatoire et la procédure disciplinaire relèvent du droit du travail (engagement de la procédure, entretien préalable, délais, proportionnalité) : l'épisode ne les détaille pas, et un enseignant de droit voudra préciser qu'une mise à pied conservatoire suppose une faute grave présumée et l'engagement rapide d'une procédure. Le taux de l'indemnité de dimanche dépend de la convention collective applicable. Le fonctionnement du conseil de la vie sociale, la procédure de traitement des réclamations par l'ARS et les obligations de signalement en cas de suspicion de maltraitance sont à vérifier sur les textes en vigueur ; l'épisode ne pose aucun fait de maltraitance.",
};
