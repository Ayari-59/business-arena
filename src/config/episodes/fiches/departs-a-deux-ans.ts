/**
 * FICHE ENSEIGNANT · ÉPISODE 76, LES CONSULTANTS QUI PARTENT À DEUX ANS.
 *
 * Lire un taux de départ par segment et répondre à chaque segment par sa
 * cause : le piège est de traiter une moyenne de cabinet par une mesure
 * pour tous, l'augmentation générale, que les questionnaires semblent justifier.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "departs-a-deux-ans",
  formations: ["but-gea", "bts-sam", "bts-gpme"],
  programme: [
    "BUT GEA · Gérer le développement des ressources humaines",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
  ],
  notion:
    "Un taux de départ moyen ne dit pas pourquoi les gens partent, et une mesure pour tous ne répond à personne. L'erreur classique consiste à lire les questionnaires de sortie, où la rémunération arrive en tête (27 réponses sur 46, plusieurs réponses possibles), et à augmenter tout le monde de 6 % pour s'aligner sur le concurrent. Chez Atlas Conseil, 46 consultants sur 190 sont partis l'an dernier, 24 %, pour 2,9 M€ ; mais les entretiens de départ, lus par segment, donnent trois causes différentes : chez les analystes et consultants, des missions répétitives et l'intercontrat (15 départs sur 28) ; chez les seniors, l'absence de perspective (6 sur 11) ; chez les profils data, payés 13 % sous le marché, la rémunération (4 sur 7). Le départ d'un consultant de deux ans coûte 47,5 k€. L'élève découvre qu'on segmente avant de décider, que chaque mesure se juge à son coût rapporté aux départs qu'elle évite, et qu'un plan de recrutement se recale sur les départs constatés plutôt que sur ceux de l'an dernier.",
  objectifs: [
    "Je calcule le coût complet d'un départ : recrutement, poste vide, montée en compétence et risque de perdre une mission.",
    "Je lis des départs par segment et par raison principale, et je distingue une cause d'une réponse à plusieurs choix.",
    "Je compare des mesures de fidélisation par leur coût et par les départs qu'elles évitent dans le segment qu'elles visent.",
    "Je recale un plan de recrutement sur les départs constatés, en comparant le coût d'une recrue en trop et d'une recrue qui manque.",
  ],
  prerequis:
    "Les notions de taux de rotation du personnel, de masse salariale chargée et d'entretien de départ doivent être connues. La lecture d'un tableau croisé (segment × raison) suffit ; l'espérance d'un coût (montant × probabilité) se rappelle pendant la correction du calcul.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/departs-a-deux-ans?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le coût moyen du départ d'un consultant à deux ans d'ancienneté, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la recommandation de la semaine 1 (6 % pour tous, enveloppe répartie par segment, 3 % pour tous, prime à deux ans) et la réponse de la semaine 4 aux seniors. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 6 : la mobilité avec certification, ou le prêt en renfort.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir de la source de Prune Lecoeur : 11 k€ de recrutement, 12 k€ de poste vide, 17,5 k€ de montée en compétence et 7 k€ de mission perdue en moyenne, soit 47,5 k€. Vous faites expliquer les valeurs éloignées (103,5, 40,5 ou 63), en insistant sur le départ sur huit qui coûte une mission : il se compte pour un huitième.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : vous faites recopier au tableau le tableau des entretiens de départ par segment, puis comparer à la synthèse des questionnaires. Pourquoi « rémunération 59 % » et « rémunération, raison principale de 10 départs sur 46 » ne disent-ils pas la même chose ? Vous enchaînez sur l'intercontrat des juniors (19 juniors partis sur 28 avaient passé plus de douze mois sur la même mission ou plus de trente jours en intercontrat) et sur la grille de carrière publiée sans demander aux seniors ce qu'ils attendent.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Lire par segment, puis traiter chaque cause » fait 493 k€ d'économie nette pour un objectif de 250 k€, « S'aligner sur le marché » −338 k€, et l'attentisme −49 k€. Vous montrez ensuite la semaine 6, où le hasard de la classe punit la bonne décision : deux des quatre reconvertis échouent à la certification, et le prêt en renfort fait mieux sous ce tirage, alors que la mobilité organisée rapporte 16 k€ de plus en moyenne. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : segmenter les départs avant de décider, et traiter chaque cause là où elle est. Vous la déclinez en trois gestes : la raison principale de chaque départ par segment, une mesure par segment chiffrée contre les départs qu'elle évite, et des recrutements recalés sur les départs constatés. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 47.5,
    etapes: [
      "Source « Demander au contrôle de gestion ce que coûte un départ » : le recrutement du remplaçant, 11 k€ (annonces, prime de cooptation ou cabinet, temps des entretiens).",
      "Le poste vide : 8 semaines en moyenne à 1,5 k€ de marge perdue par semaine, soit 8 × 1,5 = 12 k€. La montée en compétence : 25 jours non facturés sur les quatre premiers mois, à 700 € le jour, soit 25 × 0,7 = 17,5 k€.",
      "Le risque client : un départ sur 8 coûte une mission de 56 k€ de marge, soit en moyenne 56 / 8 = 7 k€ par départ.",
      "Total : 11 + 12 + 17,5 + 7 = 47,5 k€ pour un consultant de deux ans (95 k€ pour un senior, 78 k€ pour un profil data, selon la même source). Le chiffre ne dépend pas du hasard. L'épisode le juge juste à 2,5 k€ près, proche à 6 k€.",
    ],
    erreurs: [
      {
        valeur: 103.5,
        cause:
          "La mission perdue comptée en entier (11 + 12 + 17,5 + 56) : elle ne se perd qu'une fois sur huit, et se compte donc pour 7 k€ en moyenne.",
      },
      {
        valeur: 40.5,
        cause:
          "Le risque client oublié (11 + 12 + 17,5) : un départ sur huit fait perdre une mission, et cela fait partie du coût moyen.",
      },
      {
        valeur: 63,
        cause:
          "Le coût annuel du tableau de bord divisé par le nombre de départs (2 900 / 46) : c'est une moyenne de tout le cabinet, seniors et profils data compris, pas le coût d'un consultant de deux ans.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Halden paie 8 % de plus qu'Atlas, le CSE demande 6 %, plusieurs associés aussi, et les questionnaires de sortie mettent la rémunération en tête avec 59 % des réponses.",
      ceQuiLeDejoue:
        "Les entretiens de départ, raison principale par segment, ne citent la rémunération que pour 10 départs sur 46, dont 4 des 7 profils data ; chez les juniors, ce sont les missions et l'intercontrat (15 sur 28), chez les seniors la perspective (6 sur 11). L'étude de rémunération montre Atlas à 2 % sous le marché pour les analystes et consultants, 3 % pour les seniors, 13 % pour les profils data, et 6 % pour tous coûtent 459 k€ de plus dès cette année, puis chaque année. Rejoués sur les trente tirages à la place de l'enveloppe répartie par segment, les 6 % perdent 293 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le taux d'occupation des juniors est à 66 % pour une cible de 75 % : six régies à 600 € par jour, c'est quatre points de plus tout de suite et 60 k€ de marge, et « une journée non vendue ne se rattrape pas ».",
      ceQuiLeDejoue:
        "L'extraction de Tempora montre que 19 des 28 juniors partis avaient passé plus de douze mois sur la même mission ou plus de trente jours d'affilée en intercontrat, contre un sur trois chez ceux qui restent, et qu'aucun n'avait choisi sa mission. Six postes sur la même tâche pendant 9 à 12 mois reproduisent exactement la cause des départs ; l'un d'eux demande si c'est une punition. Rejouées sur les trente tirages à la place de la bourse aux missions, les six régies perdent 320 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "La présidente le propose : publier la grille de carrière dès lundi prend une heure et montre qu'on bouge.",
      ceQuiLeDejoue:
        "Les entretiens des seniors partis faute de perspective montrent que trois sur six sont partis chez des clients comme experts, sans encadrer personne : la grille d'Atlas ne connaît qu'une voie, manager, et personne n'a demandé aux quarante seniors ce qu'ils attendent. Dans les cabinets qui ont mené des entretiens de maintien, la majorité des seniors voulait aussi une filière d'expertise, une fois sur deux ou un peu plus. Lomig Lemercier lit la grille et comprend qu'il faut encadrer pour progresser. Rejouée sur les trente tirages à la place des entretiens puis des parcours, la grille publiée perd 116 k€ en moyenne ; elle fait mieux 11 fois sur 30, quand les seniors ne voulaient pas d'autre voie.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le budget prévoit 16 juniors, calés sur les départs de l'an dernier, et la présidente le dit : « On a toujours recruté pour compenser les départs. »",
      ceQuiLeDejoue:
        "Le recalcul du besoin donne 12 juniors au rythme de départs constaté (19,0 % sur l'année), et non 16. Un junior en trop coûte quatre mois d'intercontrat, 20 k€, et des juniors qui s'en lassent ; un junior qui manque, 15 k€ ; une deuxième vague en juin, 5 k€ par recrue. Rejoué sur les trente tirages à la place des 10 promesses signées et d'une décision en juin, le plan du budget perd 78 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Il manque 6 seniors et deux livrables sont partis sans relecture : recruter six seniors aguerris chez Halden et Kéroual paraît la solution la plus rapide et la plus sûre.",
      ceQuiLeDejoue:
        "La comparaison des façons de combler la pyramide : 18 k€ de cabinet par senior, 12 % au-dessus de la grille, et les 62 seniors d'Atlas l'apprendront à la première réunion de practice ; neuf consultants confirmés remplissent déjà les critères publiés, et six promotions avec mentor et formation coûtent 39 k€ sur l'année. Rejoué sur les trente tirages à la place des promotions, le recrutement extérieur perd 212 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Les questionnaires de sortie disent « rémunération 59 % », les entretiens de départ « rémunération, raison principale de 10 départs sur 46 ». Pourquoi ces deux chiffres ne se contredisent-ils pas, et lequel sert à décider ?",
    "Le départ d'un consultant de deux ans coûte 47,5 k€. Pourquoi la mission perdue ne compte-t-elle que pour 7 k€, et que se passerait-il si on la comptait en entier ?",
    "6 % pour tous coûtent 459 k€ cette année et chaque année ensuite. Combien de départs de juniors faudrait-il éviter pour que la mesure se paie, et à quel segment s'adresse-t-elle vraiment ?",
    "En semaine 2, six régies longues remontent l'occupation des juniors de quatre points. Qu'est-ce que Tempora disait des juniors partis, et pourquoi un bon indicateur de court terme peut-il nourrir la cause d'un problème ?",
    "Sous le tirage n° 12, deux des quatre reconvertis échouent à la certification, et le prêt en renfort fait mieux que la mobilité. La mobilité était-elle une mauvaise décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Ceux qui se sont alignés sur le marché finissent à −338 k€ sous le tirage n° 12, ceux qui ont lu par segment à 493 k€. Qu'est-ce qui, dans le bilan, montre où chaque euro de fidélisation est allé ?",
    "Quelle règle gardez-vous pour réduire les départs d'une entreprise ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une société d'ingénierie de 120 ingénieurs a perdu l'an dernier 15 juniors sur 60, 6 seniors sur 40 et 5 experts sur 20. Un départ coûte 45 k€ pour un junior, 90 k€ pour un senior et 75 k€ pour un expert. 1) Calculez le taux de départ de chaque segment et du total, et le coût total des départs. 2) Mesure A : 3 points d'augmentation pour tous sur une masse salariale chargée de 9 M€ ; on estime qu'elle évite un départ sur dix dans chaque segment. Mesure B : une bourse aux missions à 50 k€ par an, qui évite 5 départs de juniors, et un rattrapage de 10 % pour les 20 experts, dont le salaire chargé moyen est de 70 k€, qui évite 3 départs d'experts. Calculez l'économie nette de chaque mesure sur un an.",
    corrige:
      "1) Juniors : 15 / 60 = 25 % ; seniors : 6 / 40 = 15 % ; experts : 5 / 20 = 25 % ; total : 26 / 120 ≈ 21,7 %. Coût : 15 × 45 + 6 × 90 + 5 × 75 = 675 + 540 + 375 = 1 590 k€. 2) Mesure A : coût 0,03 × 9 000 = 270 k€ ; départs évités : 1,5 junior, 0,6 senior, 0,5 expert, soit 1,5 × 45 + 0,6 × 90 + 0,5 × 75 = 67,5 + 54 + 37,5 = 159 k€ ; économie nette : 159 − 270 = −111 k€. Mesure B : coût 50 + 0,10 × 20 × 70 = 50 + 140 = 190 k€ ; départs évités : 5 × 45 + 3 × 75 = 225 + 225 = 450 k€ ; économie nette : 450 − 190 = 260 k€.",
  },
  evaluation: [
    "Le coût du départ d'un consultant de deux ans est calculé juste (11, 12, 17,5 et 7 k€, soit 47,5 k€) à partir de la source nommée, le risque client pondéré par sa probabilité.",
    "Le diagnostic s'appuie sur la raison principale des départs par segment, et non sur la synthèse des questionnaires à réponses multiples.",
    "Chaque mesure de fidélisation est rattachée au segment qu'elle vise et comparée aux départs qu'elle peut éviter.",
    "Le plan de recrutement et la pyramide sont recalés sur les départs constatés et sur les ressources internes, avec le coût d'une recrue en trop et d'une recrue qui manque.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les 6 % sont demandés par Hamidou Thoraval en tant que délégué syndical : la négociation annuelle obligatoire sur les salaires se mène avec les organisations syndicales représentatives, par leurs délégués syndicaux, et non avec le CSE, qui est seulement consulté sur la politique sociale ; l'enseignant de droit social pourra le préciser. Un rattrapage réservé aux profils data doit reposer sur des raisons objectives et vérifiables, au regard du principe d'égalité de traitement.",
};
