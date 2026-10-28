/**
 * FICHE ENSEIGNANT · ÉPISODE 64, LA CUISINE CENTRALE QU'ON N'ATTENDAIT PAS.
 *
 * Mutualiser une production : l'économie d'un laboratoire central ne se
 * réalise que sur ce que les cuisines commandent et utilisent, et ce que les
 * clients voient ne se mutualise pas sans perdre des couverts.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "cuisine-centrale",
  formations: ["bts-mhr", "but-gea"],
  programme: [
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BUT GEA · Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
  ],
  notion:
    "Un laboratoire central promet des économies d'échelle : achats groupés, brigade spécialisée, pertes évitées. L'erreur classique est de prendre l'économie du dossier pour acquise et d'imposer la bascule à date fixe, sur toute la production : l'économie ne se réalise que sur ce que les cuisines utilisent vraiment, un chef opposé refait sur place, et ce qui est livré puis refait est payé deux fois. Dans l'épisode, Théo Garrigues, directeur de la restauration du Groupe Escale, doit faire passer au laboratoire de Seynod la production des cinq Tables d'Augustin. Le dossier annonce 316 k€ par an au comité, la somme des quatre familles ; les frais fixes du laboratoire (52 k€) n'y sont pas, et l'économie nette tombe à 264 k€. Sur 1 140 avis clients, 38 % citent un dessert par son nom, aucun un fond ou une crème ; à L'Escale Lac, des desserts de fournisseur ont coûté un quart de point de note et 3 % des couverts. L'élève découvre qu'il faut arrêter le périmètre avec les chefs (les bases au laboratoire, les desserts signatures en cuisine), tester sur un pilote proche en basse saison, corriger ce que les relevés montrent (la tournée, le froid, le pain du soir) et accompagner chaque brigade qui bascule.",
  objectifs: [
    "Je calcule l'économie nette d'une mutualisation, frais fixes déduits.",
    "Je distingue ce qu'un client perçoit de ce qu'il ne perçoit pas, et j'en tire le périmètre de ce qui se mutualise.",
    "J'explique pourquoi un pilote limité révèle les défauts à petit coût avant une généralisation.",
    "Je relie l'adhésion des équipes à l'économie réellement obtenue.",
  ],
  prerequis:
    "Les notions de charges fixes et variables, de coût de revient d'une production et de marge sur coût variable doivent être connues. Les principes de la chaîne du froid et du plan HACCP aident à lire les incidents de livraison.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/cuisine-centrale?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul de l'économie annuelle du laboratoire, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, le périmètre retenu en semaine 1 et la manière de lancer la bascule en semaine 2. Aux plus rapides, vous demandez de rejouer en ne changeant que la semaine 2 : les cinq Tables lundi, ou le pilote.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et refaites le calcul avec le dossier de Kadiatou Sidibé : famille par famille, ce que la production coûte aujourd'hui moins ce qu'elle coûtera au laboratoire, puis les frais fixes. Vous faites expliquer les valeurs éloignées de 264 k€ (316, 282 ou 192). Vous insistez : 264 k€, c'est l'économie si tout passe et si tout est utilisé ; c'est un plafond, pas une prévision.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (le périmètre), de la semaine 2 (la bascule) et de la semaine 4 (les livraisons). Pour le périmètre, vous faites relire les avis : 38 % citent un dessert, aucun un fond. Pour la bascule, la cadence de Swann Joubertin : 35 % du volume la première semaine, six semaines pour suivre les cinq Tables, qui représentent 86 % du volume en janvier. Pour les livraisons, la note de Jordi Puigvert : un bac arrivé à 8 °C se refuse, note ou pas.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 12, « Mutualiser avec les chefs » finit à 6,1 k€ d'économie nette sur le trimestre, « Appliquer la décision du comité » à −137,9 k€ et ne rien faire à −61,4 k€ : ce tirage est le pire des trente pour ces deux méthodes (quatorze incidents de livraison et le départ de Séraphin Mermillod pour la seconde). Vous montrez ensuite la bascule des cinq Tables lundi : elle fait mieux que le pilote 12 fois sur 30, et perd pourtant 8,2 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : une économie de mutualisation se réalise sur ce qui est utilisé, et se perd sur ce que les clients voient. Vous la déclinez en quatre gestes : arrêter le périmètre avec ceux qui produisent, tester petit et près, corriger ce que les relevés montrent, accompagner chaque équipe qui bascule. Vous rappelez que sur un trimestre l'économie reste faible : le laboratoire monte en cadence, ses frais fixes courent dès le premier jour.",
    },
  ],
  calcul: {
    reponse: 264,
    etapes: [
      "Source « Reprendre le dossier du laboratoire avec Kadiatou Sidibé », famille par famille, ce que coûte la production aujourd'hui moins ce qu'elle coûtera au laboratoire, livraison comprise : fonds et sauces de base 320 − 222 = 98 k€ ; pains 270 − 188 = 82 k€ ; bases pâtissières 218 − 154 = 64 k€ ; desserts signatures 240 − 168 = 72 k€.",
      "Économie brute de tout le périmètre prévu : 98 + 82 + 64 + 72 = 316 k€ par an. C'est le chiffre présenté au comité ; Kadiatou le dit : les frais fixes n'y sont pas.",
      "Frais fixes annuels du laboratoire, qu'il produise ou non : camion frigorifique et chauffeur 34 k€ + énergie et entretien 12 k€ + analyses microbiologiques 6 k€ = 52 k€.",
      "Économie annuelle nette si tout le périmètre prévu passe au laboratoire : 316 − 52 = 264 k€. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 5 k€ près. C'est un plafond : il suppose que les cuisines utilisent tout ce qui est livré.",
    ],
    erreurs: [
      {
        valeur: 316,
        cause:
          "Le chiffre du comité est repris sans déduire les frais fixes du laboratoire, comme dans le dossier.",
      },
      {
        valeur: 282,
        cause:
          "Seul le camion et son chauffeur sont déduits (316 − 34) : l'énergie et les analyses sont oubliées.",
      },
      {
        valeur: 192,
        cause:
          "Les desserts signatures sont retirés du calcul (316 − 72 − 52) : c'est le bon périmètre à défendre, mais la prévision demande tout le périmètre prévu.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le comité a voté le plan, et c'est ce que le dossier chiffre : retirer les desserts signatures, c'est renoncer à 72 k€ par an.",
      ceQuiLeDejoue:
        "Les avis des cinq Tables : 38 % citent un dessert par son nom, aucun un fond, une sauce ou une crème ; à L'Escale Lac, des desserts de fournisseur ont fait passer la note de 4,5 à 4,25 et coûté 3 % des couverts. Séraphin Mermillod prévient qu'il ne signera plus la carte, et rappelle qu'à Chamonix les chefs refaisaient 45 % de ce que livrait le laboratoire. Rejoué sur les trente tirages à la place du périmètre arrêté avec les chefs, ce choix perd 16,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Isaline Perraud tient à la date du comité, et attendre, c'est payer les frais fixes d'un laboratoire qui ne livre rien.",
      ceQuiLeDejoue:
        "Swann Joubertin le dit : la brigade sort 35 % du volume la première semaine, puis 50 %, 65 %, et il faut six semaines pour suivre les cinq Tables, qui en représentent 86 % en janvier ; Chambéry et Aix-les-Bains, 27 %. La tournée d'essai de Teodor Ionescu dure 4 h 30, Évian et Megève sont livrées après 9 h 30, et Megève est en pleine saison. Sous le tirage 12, la bascule des cinq Tables fait 24,8 k€ de moins que le pilote ; sur les trente tirages, elle perd 8,2 k€ en moyenne, même si elle fait mieux 12 fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Si les cuisines refont ce qui est livré, le laboratoire ne sert à rien : il faut obliger à utiliser les produits.",
      ceQuiLeDejoue:
        "Les relevés de livraison : un fond perd un degré toutes les quarante minutes, et au-delà de deux heures de route la limite de 3 °C est franchie. Jordi Puigvert refuse un bac à 8 °C comme le veut son plan HACCP, note ou pas. Deux corrections suffisaient : des bacs à plaques eutectiques avec enregistreur (1 200 €) et une tournée en deux boucles qui part à 5 h 30 (100 € par semaine). Rejouée sur les trente tirages à la place de ces corrections, l'interdiction perd 8,3 k€ en moyenne et ne fait jamais mieux ; sous le tirage 12, elle en perd 45,3 k€.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le comité veut voir les cinq Tables au laboratoire : basculer lundi celles qui restent, telles quelles, c'est tenir l'objectif.",
      ceQuiLeDejoue:
        "La source produit par produit : le pain du soir est refait quatre fois sur dix, rassis au service de 19 h ; en pâtons crus surgelés cuits sur place, il ne coûte que 12 % de l'économie sur les pains. Les chefs déjà servis le disent : leurs commis refaisaient les fonds tant qu'ils ne savaient pas les utiliser, et une journée en cuisine avec un chef relais a tout changé, pour 400 € par cuisine. Rejoué sur les trente tirages à la place du pain corrigé et des chefs relais, ce choix perd 5,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le laboratoire a de la place en mars, et la ligne des desserts signatures, 72 k€ par an, n'est toujours pas faite.",
      ceQuiLeDejoue:
        "Un avis sur quatre cite la tarte aux noix d'Annecy ou le vacherin de Megève, et des desserts sortis de chez un fournisseur ont coûté un quart de point de note à L'Escale Lac. Kadiatou chiffrait une autre place pour la capacité libre : les pains et viennoiseries des petits-déjeuners des sept hôtels hors Megève, 2 100 par semaine, 1,05 € chez le grossiste contre 0,60 € au laboratoire, soit 945 € par semaine, sur un produit que personne ne choisit. Rejoué sur les trente tirages à la place des petits-déjeuners, ce choix perd 3,9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le dossier annonçait 316 k€. Qu'est-ce que ce chiffre oubliait, et qu'est-ce qu'il supposait des cuisines ?",
    "Pourquoi un fond de veau peut-il sortir d'un laboratoire et pas une tarte aux noix ? Quelle source permettait de tracer la limite ?",
    "Chambéry et Aix-les-Bains, en basse saison, à 35 et 45 minutes de Seynod : qu'est-ce que le pilote a montré qu'une bascule des cinq Tables aurait découvert en ruptures de service ?",
    "Sous le tirage 12, la bascule des cinq Tables lundi perd 24,8 k€ face au pilote. Sur les trente tirages, elle fait mieux 12 fois. Ceux pour qui elle a réussi avaient-ils raison de la choisir ?",
    "Sous le tirage 12, « Appliquer la décision du comité » finit 144 k€ sous « Mutualiser avec les chefs ». D'où vient l'écart : des achats, des incidents, des produits refaits, de la note, du départ d'un chef ?",
    "Pourquoi l'économie nette du trimestre reste-t-elle faible, même pour la meilleure méthode, quand le dossier, frais fixes déduits, donne 264 k€ par an ?",
    "Quelle règle gardez-vous pour mutualiser une production entre plusieurs établissements ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un groupe de trois brasseries étudie une cuisine centrale. Fonds et sauces coûtent aujourd'hui 120 k€ par an dans les trois cuisines et coûteraient 85 k€ au laboratoire ; pains 90 k€ et 60 k€ ; desserts maison 80 k€ et 55 k€. Les frais fixes du laboratoire sont de 30 k€ par an. 1) Calculez l'économie annuelle nette si tout passe au laboratoire. 2) Les chefs refusent les desserts, et refont 30 % des fonds et des pains livrés. Si l'économie ne se fait que sur ce qui est utilisé, que reste-t-il, desserts exclus ? 3) Les trois brasseries font 3 M€ de chiffre d'affaires par an, avec une marge sur coût variable de 65 %. Si les desserts passés au laboratoire faisaient perdre 3 % des couverts, faudrait-il les y mettre ?",
    corrige:
      "1) 35 + 30 + 25 = 90 k€ d'économie brute, moins 30 k€ de frais fixes : 60 k€. 2) Sur les fonds et les pains, 70 % de 65 k€, soit 45,5 k€, moins les 30 k€ de frais fixes : 15,5 k€, à peine le quart de l'économie promise. 3) Les couverts perdus coûtent 3 000 000 × 0,03 × 0,65 = 58,5 k€ de marge par an, pour 25 k€ d'économie : les desserts restent en cuisine, ils coûteraient 33,5 k€ de plus qu'ils ne rapportent.",
  },
  evaluation: [
    "L'économie annuelle est calculée juste, famille par famille, frais fixes déduits, à partir de la source nommée.",
    "Le périmètre retenu s'appuie sur ce que les clients perçoivent, avec les chiffres des avis.",
    "Le mode de bascule est justifié par la montée en cadence du laboratoire, la tournée et la saison de chaque Table.",
    "Les incidents de livraison sont traités par leur cause (le froid, l'heure de départ), pas par une interdiction.",
    "L'élève distingue, sur la bascule de la semaine 2, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 12.",
  ],
  vigilance:
    "La limite de 3 °C à réception et le refus d'un bac à 8 °C sont posés par l'épisode : les températures réglementaires du transport et de la réception des préparations réfrigérées sont à vérifier avec un enseignant de cuisine ou d'hygiène. Le mandat affiche les 316 k€ du dossier, frais fixes non déduits : c'est l'erreur fréquente qu'il faut faire corriger.",
};
