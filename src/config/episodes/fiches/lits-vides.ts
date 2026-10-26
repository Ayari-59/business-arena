import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 82, LES LITS QUI RESTENT VIDES.
 *
 * Une démonstration de la Découverte (config/episodes/demos.ts) : piloter les
 * admissions d'un EHPAD, le délai entre une chambre libérée et l'entrée
 * suivante, la liste d'attente à vérifier et les prescripteurs à qui répondre
 * vite. Les chiffres du hasard de la classe sont ceux de la graine 12, les
 * moyennes celles des 30 tirages du bilan.
 */
export const FICHE: FicheEnseignant = {
  code: "lits-vides",
  formations: ["bac-pro-agora"],
  programme: [
    "Bac pro AGORA · Bloc 1, Gérer des relations avec les clients, les usagers et les adhérents",
  ],
  notion:
    "Un lit vide n'est pas d'abord un manque de demande : c'est un délai. Entre la libération d'une chambre et l'entrée du résident suivant, chaque étape du circuit d'admission (remise en état, commission, appels de la liste d'attente, dossier, visite de préadmission, date d'entrée) ajoute des jours, et le nombre moyen de lits vides suit ce délai. L'erreur classique consiste à remplir par le prix ou par la notoriété (baisser le prix de journée, lancer une campagne de publicité, allonger la liste d'attente) sans avoir mesuré le délai, ou à admettre vite sans évaluer. Dans l'épisode, l'EHPAD de Beaune de l'Association Solvanne est à 91 % d'occupation, huit lits vides sur 88 pour une cible de 97 %, avec soixante noms sur la liste d'attente ; le siège propose une baisse de 5 % du prix de journée ou une campagne de 12 000 €. Le parcours des dix dernières entrées montre 52 jours de la libération à l'entrée, dont 15 d'attente de la commission mensuelle ; sur dix-neuf familles qui ont décliné une place l'an dernier, deux ont parlé du prix, onze avaient trouvé ailleurs pendant qu'on les faisait attendre. L'élève découvre qu'une journée vide coûte 94 €, qu'on remplit en raccourcissant le circuit et en répondant vite aux prescripteurs, et qu'une évaluation sous 72 heures garde la vitesse sans le risque d'une admission que l'unité ne peut pas accompagner.",
  objectifs: [
    "Je décompose un délai d'attente étape par étape pour trouver où il se perd.",
    "Je calcule ce que coûte une place vide à partir des tarifs de l'établissement, en distinguant ce qui dépend des journées et ce qui n'en dépend pas.",
    "Je vérifie une liste d'attente avant de m'y fier, et je réponds aux prescripteurs dans le délai qu'ils attendent.",
    "Je compare une mesure de prix ou de communication à une mesure d'organisation, sur ce qu'elle coûte et sur les lits qu'elle remplit.",
  ],
  prerequis:
    "Les notions d'usager, de prescripteur, de taux d'occupation et de prix de journée doivent être connues ; une moyenne pondérée et une multiplication suffisent pour le calcul. Les trois sections tarifaires d'un EHPAD (hébergement, dépendance, soins) peuvent être présentées en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/lits-vides?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Sans licence, la démonstration se joue au niveau Découverte : un repère de méthode accompagne chaque étape, et chaque décision montre aussitôt ce qu'elle a changé par rapport à ne rien changer. Vous présentez l'établissement en deux phrases (88 places, huit lits vides, soixante noms sur la liste) sans parler de délai, et vous demandez de noter sur papier le manque à gagner calculé en semaine 1 et la réponse faite au siège.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse au siège en semaine 1 (baisse, circuit, campagne ou attente) et celle de la semaine 7 sur la préadmission, où la classe se partage souvent entre la vitesse et la prudence. Un binôme qui a fini tôt reconstitue sur papier les 52 jours du délai, étape par étape.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous reconstruisez le calcul avec la classe : le prix de journée moyen des 88 places, la dépendance, le forfait soins qui ne bouge pas, puis huit lits sur une année. Vous faites expliquer les valeurs éloignées (219 k€, 283 k€ ou 68 k€). Vous terminez en mettant la journée vide en face de la campagne : 12 000 €, c'est le prix d'environ 128 journées vides.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : la baisse de prix, la campagne et le circuit, chacun défendu par un élève qui l'a choisi. Faites calculer au tableau ce que coûte la baisse : 3,90 € sur chaque journée des 66 places à tarif libre, quand deux familles sur dix-neuf ont parlé du prix. Enchaînez sur la liste d'attente, où l'appel des soixante inscrits ne laisse que dix candidats prêts à entrer, puis sur l'admission sur dossier, dont vous faites chiffrer le risque : trois admissions sur dix qui dépassent ce que l'unité peut accompagner, 8 400 € de renfort de nuit chacune.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Sous le tirage n° 12, « Fluidifier l'admission » finit à 748 k€ (recettes, coûts déduits, printemps compris), soit 49 k€ de plus qu'un printemps à 91 % d'occupation ; « Baisser le prix et communiquer » finit à 607 k€, sous « Attendre le printemps » (635 k€). L'hôpital a accepté la convention, et la grippe est restée aux Tilleuls. Vous faites lire, décision par décision, ce que chaque choix valait en moyenne sur les trente tirages, notamment l'admission sur dossier, qui fait mieux une fois sur trente et perd 16,5 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la relation que l'épisode met en jeu : lits vides en moyenne = chambres libérées par semaine × délai d'admission en semaines. Vous en tirez la règle : on remplit en raccourcissant le délai, pas en ajoutant des noms à la liste ou en baissant le prix. Vous rappelez que la vitesse ne dispense pas d'évaluer, et que le gain ne tient que si la procédure est écrite et suivie chaque semaine, comme l'a appris Valère à Montbard. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 274.48,
    etapes: [
      "Source « Relire ce que rapporte une journée dans l'EPRD » : 22 places habilitées à l'aide sociale à 66 € et 66 places à tarif libre à 78 €. Prix de journée hébergement moyen : (22 × 66 + 66 × 78) / 88 = (1 452 + 5 148) / 88 = 75 € par journée facturée.",
      "Même source : la dépendance rapporte 19 € en moyenne par journée (le ticket modérateur payé par le résident et l'APA versée à la journée de présence). Les soins sont un forfait annuel de l'ARS, qui ne dépend pas des journées à court terme : ils ne comptent pas. Une journée vide, c'est donc 75 + 19 = 94 € non facturés.",
      "Huit lits vides sur une année : 8 × 365 = 2 920 journées.",
      "Manque à gagner annuel : 2 920 × 94 = 274 480 €, soit 274,48 k€. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 3 k€ près, proche à 15 k€.",
      "Pour comparer : la campagne de l'agence coûte 12 000 €, soit environ 128 journées vides ; la baisse de 5 % retire 3,90 € sur chaque journée des 66 places à tarif libre, pour tous les résidents de ces places, y compris ceux qui sont déjà là.",
    ],
    erreurs: [
      {
        valeur: 219,
        cause:
          "La dépendance oubliée (8 × 365 × 75 €) : le tarif dépendance est facturé à la journée de présence, et une journée vide le perd aussi.",
      },
      {
        valeur: 283.24,
        cause:
          "Le prix des places à tarif libre pris pour le prix moyen (8 × 365 × (78 + 19)) : les 22 places habilitées à l'aide sociale sont à 66 €.",
      },
      {
        valeur: 68.43,
        cause:
          "Le manque à gagner du seul trimestre (8 × 91 × 94) au lieu d'une année : la question porte sur l'année.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le siège le propose, c'est rapide, et un prix plus bas paraît le moyen évident d'attirer des familles.",
      ceQuiLeDejoue:
        "La comparaison des prix place l'établissement entre l'EHPAD public (71 €) et l'associatif de la côte (82 €), quand Orchidia annonce 104 € ; sur dix-neuf familles qui ont décliné une place, deux ont parlé du prix, onze avaient trouvé ailleurs pendant qu'on les faisait attendre. La baisse porte sur tous les résidents des 66 places à tarif libre, et le parcours des dix dernières entrées montre 52 jours de délai. Rejouée sur les trente tirages à la place du circuit resserré, elle perd 80 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Beaune est le seul EHPAD du groupe sous 95 %, l'agence promet « un flux de nouvelles demandes », et une campagne se voit.",
      ceQuiLeDejoue:
        "Il y a déjà soixante noms sur la liste : le problème n'est pas de faire venir des demandes, mais le temps qu'on met à les faire entrer. Le parcours des dix dernières entrées décompose les 52 jours, dont 15 d'attente de la commission mensuelle, et Valère conseille de chronométrer une chambre vide avant de toucher au prix. La campagne coûte 12 000 € ; rejouée sur les trente tirages à la place du circuit resserré, elle perd 61 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Une liste plus longue paraît une réserve plus sûre, et huit inscriptions arrivent dès la première semaine.",
      ceQuiLeDejoue:
        "Sur cinq inscrits appelés au hasard, un seul veut entrer maintenant : la liste est gonflée, et le parcours montre que les appels coûtent déjà douze jours à chaque chambre libérée, deux jours par inscrit qui ne viendra pas. Allonger la liste allonge le délai ; l'appeler en entier (1 600 €) révèle qu'il reste dix candidats prêts sur soixante. Rejouée sur les trente tirages à la place des appels, l'inscription en ligne perd 30 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Orchidia offre les frais de dossier et promet une entrée sous huit jours : un geste commercial paraît la réponse attendue, et le siège le suggère.",
      ceQuiLeDejoue:
        "Les demandes de l'hôpital disent ce qu'Orchidia prend : sur trente-quatre en quatre mois, quatorze perdues parce que la réponse arrivait en dix-neuf jours, quand l'hôpital l'attend en 72 heures. Le geste coûte 1 125 € par entrée et ne raccourcit rien (« les familles demandent surtout quand une chambre sera libre ») ; la convention avec le service social coûte 1 500 €. Rejoué sur les trente tirages à la place de la convention, le geste perd près de 32 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Orchidia admet en 48 heures, l'hôpital le demande, et deux patientes sortent jeudi : aller aussi vite que le concurrent paraît la seule façon de garder les demandes.",
      ceQuiLeDejoue:
        "À Chalon, sur dix admissions faites sur dossier seul, trois dépassaient ce que l'unité pouvait accompagner : chaque fois 21 nuits de renfort en intérim à 400 €, soit 8 400 €, une chute avec fracture, une réorientation au bout d'un mois et la chambre de nouveau vide ; avec une évaluation, une admission sur vingt-cinq. L'évaluation sous 72 heures garde presque toute la vitesse pour 900 €. Rejouée sur les trente tirages à la place de l'évaluation, l'admission sur dossier perd 16,5 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Les familles attendent, trois entrées sont prévues, et chaque semaine de suspension, ce sont des lits vides de plus.",
      ceQuiLeDejoue:
        "L'avis écrit de l'équipe d'hygiène est net : pas d'entrée aux Tilleuls jusqu'à huit jours après le dernier cas, mais les autres ailes peuvent accueillir avec les précautions habituelles. Faire entrer un résident fragile dans l'aile touchée l'expose, ainsi que l'équipe qui l'installe ; suspendre aux Tilleuls seulement garde les deux entrées du Parc. Rejoué sur les trente tirages à la place de cette suspension ciblée, tout maintenir perd 4,6 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "L'agence propose une campagne de printemps ciblée sur les aidants et cite la notoriété gagnée en février ; une action visible plaît à un conseil d'administration.",
      ceQuiLeDejoue:
        "Quand le circuit a été resserré, le suivi du délai de vacance chambre par chambre montre d'où vient le gain : la commission du mardi, la chambre prête en 48 heures, la liste rappelée. Valère prévient qu'à Montbard, sans procédure écrite, le délai a repris la moitié de ce qu'il avait perdu dès que l'IDEC a été absente. Écrire la procédure ne coûte rien, la campagne 12 000 € ; rejouée sur les trente tirages à la place de la procédure, elle perd 20 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Pour remplir avant l'été, une baisse annoncée au conseil d'administration paraît une mesure simple, qui se vote en une séance.",
      ceQuiLeDejoue:
        "Le trésorier le rappelle : la baisse porte sur toutes les journées des places libres, 3,90 € de moins par jour pour chacun des résidents qui y sont déjà. Ce qui a fait entrer des résidents ce trimestre, c'est le délai raccourci, pas le prix, et ce gain ne tient que s'il est écrit et suivi. Rejouée sur les trente tirages à la place de la procédure, la baisse perd près de 33 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le siège proposait le prix ou la publicité. Qu'est-ce qui, dans les sources, montrait que les familles ne manquaient pas, et que le temps se perdait ailleurs ? Où se perdaient les 52 jours ?",
    "Une journée vide coûte 94 €, et le forfait soins ne bouge pas. Pourquoi ne compte-t-il pas dans le manque à gagner à court terme, et pourquoi l'ARS pourrait-elle pourtant le réduire sur l'année ?",
    "Soixante noms sur la liste, dix candidats prêts : pourquoi une liste trop longue ralentit-elle les entrées ? Que coûtait l'appel des soixante inscrits, et que rapportait-il ?",
    "Admettre sur dossier va plus vite ; évaluer sous 72 heures va presque aussi vite. Combien de vos admissions dépassaient ce que l'unité pouvait accompagner ? Pourquoi juger cette décision sur les trente tirages plutôt que sur le vôtre ?",
    "Sous le tirage n° 12, ceux qui ont baissé le prix et communiqué finissent sous ceux qui ont attendu le printemps (607 k€ contre 635 k€). Comment des mesures qui coûtent peuvent-elles faire moins bien que l'attente ?",
    "Sous le tirage n° 12, l'hôpital a accepté la convention ; dans le modèle, il l'accepte environ huit fois sur dix. La convention restait-elle le bon choix les autres fois ? Qu'est-ce qu'une réponse sous 72 heures change à la chance qu'Orchidia signe la sienne ?",
    "Quelle règle présentez-vous au conseil d'administration pour que le délai tienne au printemps ? Formulez-la en une phrase, avec un indicateur dedans.",
  ],
  prolongement: {
    enonce:
      "Une résidence autonomie de 60 logements est à 90 % d'occupation, et il s'y libère en moyenne un logement par semaine. Un logement occupé rapporte 52 € par jour. Le délai entre un départ et l'entrée suivante est de 42 jours : remise en état 7, attente de la commission mensuelle 14, appels de la liste 10, dossier 6, visite 5. 1) Combien de logements sont vides en moyenne ? Vérifiez avec la relation : logements vides = départs par semaine × délai en semaines. 2) Calculez le manque à gagner annuel. 3) Une commission chaque semaine ramène son étape à 3 jours, et une remise en état sous 48 heures ramène la sienne à 2 : quel est le nouveau délai, combien de logements restent vides, et que gagne-t-on sur l'année ? 4) Le gestionnaire propose plutôt de baisser le prix de 4 % : que coûte cette baisse sur une année, sur les logements occupés aujourd'hui ?",
    corrige:
      "1) 10 % de 60 = 6 logements vides ; la relation donne 1 × 42 / 7 = 6. 2) 6 × 365 × 52 = 113 880 € par an. 3) Nouveau délai : 2 + 3 + 10 + 6 + 5 = 26 jours ; logements vides : 1 × 26 / 7 ≈ 3,7 ; gain : (6 − 26 / 7) × 365 × 52 ≈ 43 400 € par an. 4) 4 % de 52 € = 2,08 € par jour sur 54 logements occupés : 54 × 365 × 2,08 ≈ 41 000 € par an. La baisse coûte presque autant que ce que rapporte le circuit resserré, sans raccourcir le délai d'un jour.",
  },
  evaluation: [
    "Le manque à gagner est calculé juste (prix de journée moyen pondéré, dépendance comprise, forfait soins exclu), et l'élève dit pourquoi le forfait soins est exclu.",
    "Le diagnostic s'appuie sur la décomposition du délai d'admission, étape par étape, et non sur le prix ou la notoriété.",
    "Chaque mesure retenue ou écartée est comparée sur ce qu'elle coûte et sur le délai qu'elle raccourcit.",
    "La décision de préadmission est argumentée comme un arbitrage entre la vitesse et le risque d'une admission inadaptée, chiffré à partir de la source de Chalon.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode simplifie la tarification d'un EHPAD : un prix de journée hébergement moyen, un tarif dépendance moyen de 19 € par journée, sans distinguer les GIR, et un forfait soins de l'ARS figé à court terme ; il ne traite pas la facturation des absences pour hospitalisation. Un enseignant de la filière voudra peut-être nuancer ces points avant de présenter le calcul comme une règle.",
};
