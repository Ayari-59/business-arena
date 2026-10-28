/**
 * FICHE ENSEIGNANT · ÉPISODE 75, LA PROMOTION QU'IL FAUDRA REFUSER.
 *
 * Décider une promotion sur des critères écrits et des faits, puis l'annoncer
 * en face avec un plan : le piège est de promouvoir le plus apprécié, ou de
 * le retenir par une promesse ou une augmentation hors grille.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "promotion-refusee",
  formations: ["bts-sam", "but-gea", "bts-gpme"],
  programme: [
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
    "BUT GEA · Gérer le développement des ressources humaines",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
  ],
  notion:
    "Une promotion se décide sur ce que le poste demande, pas sur l'affection qu'on porte au candidat ni sur la peur de le perdre. L'erreur classique consiste à porter le plus apprécié parce que son départ coûterait cher, puis, s'il n'est pas retenu, à le retenir par une promesse ou une augmentation hors grille. Chez Atlas Conseil, Noé Akintola a une place de manager pour trois seniors : Elric Mérindol a la meilleure satisfaction client du bureau (4,8 sur 5), mais la seule mission qu'il a co-pilotée a fini à 84 % de taux de réalisation, et deux analystes ont demandé à ne plus travailler avec lui ; Tahina Rakotoarisoa a piloté deux missions à 98 % et 101 %. Le départ d'un senior coûte 48 k€, un manager promu sans avoir piloté environ 60 k€ la première année. L'élève découvre qu'une grille écrite et des faits gagnent le comité, que les non-retenus se perdent à l'annonce, quand ils l'apprennent par un courriel, et qu'un plan de progression retient mieux qu'un écart de salaire que tout le bureau finit par connaître.",
  objectifs: [
    "Je calcule le coût du départ d'un salarié : recrutement, vacance du poste et intégration du remplaçant.",
    "J'évalue des candidats sur les critères écrits d'un poste, avec des faits datés, et je les sépare de leur popularité.",
    "Je prépare l'annonce d'une décision défavorable : la décision, les critères manqués, un plan de progression et une date de réexamen.",
    "Je juge une demande de compensation sur l'équité interne et sur ce qu'elle déclenche chez les autres, et pas seulement sur le risque de départ.",
  ],
  prerequis:
    "Les notions d'entretien annuel d'évaluation, de grille de classification et de coût salarial chargé doivent être connues. Le taux de réalisation d'un forfait se rappelle en une phrase (les jours prévus rapportés aux jours consommés) ; la conduite d'un entretien difficile peut se découvrir en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/promotion-refusee?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le coût du départ d'un consultant senior, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le candidat que chacun recommande en semaine 4, la manière d'annoncer la décision en semaine 6 et la réponse à la demande d'Elric en semaine 8. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 8 : appliquer la grille avec un plan de progression, ou refuser sèchement.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir de la source de Rahel Tesfaye : 12,4 k€ de cabinet, 15,6 k€ de vacance, 20 k€ d'intégration, soit 48 k€. Vous faites retrouver les 1 300 € par semaine à partir de la contribution annuelle d'un senior (157,5 k€) et de son salaire chargé (89,9 k€), puis expliquer les valeurs éloignées (68,7, 28 ou 43).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 4 : défendre Elric, recommander Tahina critère par critère, accepter l'échange de Bathilde ou laisser le comité calibrer. Vous faites relire la grille du grade (un taux de réalisation d'au moins 95 % sur une mission complète, encadrer une équipe) et les fins de mission des trois candidats. Vous enchaînez sur l'annonce de la semaine 6 (trois non-retenus sur trois partis après le courriel, un sur trois après un entretien en face) et sur les 8 % hors grille.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Des critères, des faits, et le dire en face » fait 268 k€ de valeur de l'équipe pour un objectif de 260 k€, « Garder le plus apprécié » 134 k€, et « Laisser le comité trancher » 142 k€. Vous montrez ensuite la semaine 8 : refuser sèchement fait mieux que la grille avec un plan 27 fois sur 30, pour 3 k€ de moins en moyenne, et l'épisode le compte encore comme un bon choix. Vous faites dire pourquoi, puis ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : décider sur des critères écrits, le dire en face, et offrir un chemin plutôt qu'un arrangement. Vous la déclinez en trois gestes : une grille et des faits avant le comité, un entretien en face avec un plan et une date de réexamen, et aucune promesse ni compensation hors grille. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 48,
    etapes: [
      "Source « Demander au contrôle de gestion ce qu'a coûté le dernier départ d'un senior » : le cabinet de recrutement prend 20 % du salaire annuel brut, 62 k€ : 0,20 × 62 = 12,4 k€.",
      "La vacance : un senior apporte 210 × 0,75 × 1 000 = 157 500 € d'honoraires par an et coûte 62 000 × 1,45 = 89 900 € chargé, soit 67 600 € de contribution, ou 67 600 / 52 = 1 300 € par semaine. Douze semaines de vacance : 12 × 1 300 = 15 600 €.",
      "L'intégration : vingt jours facturables de moins au TJM d'un senior : 20 × 1 000 = 20 000 €.",
      "Total : 12,4 + 15,6 + 20 = 48 k€. Le chiffre ne dépend pas du hasard. L'épisode le juge juste à 3 k€ près, proche à 8 k€ ; c'est aussi ce que le bilan compte pour chaque démission.",
    ],
    erreurs: [
      {
        valeur: 68.7,
        cause:
          "La vacance comptée en honoraires perdus sans déduire le salaire (12 × 157 500 / 52 ≈ 36,3 k€) : pendant la vacance, le bureau ne paie plus le senior, il perd sa contribution de 1 300 € par semaine.",
      },
      {
        valeur: 28,
        cause:
          "Le cabinet et la vacance seulement (12,4 + 15,6) : les vingt jours non facturables de l'intégration, 20 k€, sont oubliés.",
      },
      {
        valeur: 43,
        cause:
          "Les vingt jours d'intégration comptés à 75 % d'occupation (20 × 1 000 × 0,75 = 15 k€) : la source dit vingt jours facturables de moins, au TJM, l'occupation est déjà dedans.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Elric est le plus apprécié du bureau, Brévallon le redemande nommément, Halden l'appelle tous les trois mois, et Wassila prévient qu'on risque de le perdre : porter sa candidature paraît protéger le cabinet.",
      ceQuiLeDejoue:
        "Les évaluations de fin de mission montrent que sa seule mission co-pilotée a fini à 84 % de taux de réalisation, 22 jours de dépassement, et que deux analystes ont demandé à ne plus être staffés avec lui ; Tahina a piloté deux missions à 98 % et 101 %. Ewa rappelle que les deux managers promus sans avoir piloté ont coûté environ 60 k€ chacun la première année. Rejoué sur les trente tirages à la place de la grille et des faits, le dossier centré sur Elric perd 14 k€ en moyenne ; il fait mieux 11 fois sur 30.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Elric dit que Halden l'a rappelé : l'assurer de votre soutien paraît le moyen le plus sûr de le garder jusqu'au comité.",
      ceQuiLeDejoue:
        "Le café avec Elric montre qu'il ne sait pas que deux analystes ont demandé à ne plus travailler avec lui : personne ne le lui a dit. La grille exige d'avoir démontré le pilotage et l'encadrement sur une mission complète. Et le soutien se sait : Tahina l'apprend : « Je me demande à quoi a servi mon année. » Rejoué sur les trente tirages à la place des entretiens critère par critère, le soutien promis perd 21 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Défendre Elric de toutes ses forces, ses clients et le risque de le perdre, paraît le devoir d'un directeur qui tient à son équipe.",
      ceQuiLeDejoue:
        "Ewa dit comment le comité tranche : « Ceux qui arrivent avec des faits, critère par critère, emportent la décision. » Le dossier documente les quatre critères pour les trois candidats, et seule Tahina a démontré les deux premiers. Rejouée sur les trente tirages à la place de la recommandation de Tahina, la note centrée sur Elric perd 15 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "L'échange de Bathilde fait sortir tout le monde content : Vasco cette année, Elric l'an prochain, et personne ne se bat au comité.",
      ceQuiLeDejoue:
        "Sondée, Bathilde ne peut rien garantir : le comité aura d'autres candidats et de nouveau une seule place pour la practice ; « Disons que je ferai de mon mieux ». Ewa rappelle que deux promesses de promotion sur trois n'ont pas été tenues, et que les deux consultants sont partis dans les six mois. Vasco n'a jamais tenu un budget, et Tahina, la mieux placée sur la grille, se retrouve sans rien. Rejoué sur les trente tirages à la place de la recommandation de Tahina, l'échange perd 39 k€ en moyenne ; il ne fait mieux que 5 fois sur 30.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Promettre au plus déçu qu'il sera promu l'an prochain paraît le geste qui le retient à coup sûr.",
      ceQuiLeDejoue:
        "Ewa le dit : « Un directeur ne promet pas ce que le comité décide. » Deux promesses sur trois n'ont pas été tenues à Paris en quatre ans, et les deux consultants sont partis dans les six mois. Séverine montre ce qui retient vraiment : des trois non-retenus reçus en face avec un plan écrit et une date de réexamen, un seul est parti. Rejouée sur les trente tirages à la place de l'entretien en face avec un plan, la promesse perd 50 k€ en moyenne, le pire choix de la semaine, et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Halden lui propose quinze pour cent ; huit pour cent pour le garder coûtent 7,2 k€ par an, bien moins que les 48 k€ d'un départ.",
      ceQuiLeDejoue:
        "Les règles de rémunération le rappellent : les augmentations sont visibles des managers dans Tempora, et l'an dernier deux ajustements hors grille ont été connus de tout le bureau en un mois, avec quatre demandes de rattrapage. Wassila le dit : « Après un refus, on ne demande pas d'abord de l'argent : on demande à savoir qu'on a un chemin. » Rejoués sur les trente tirages à la place de la grille et du plan de progression, les 8 % perdent 17 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Une prime exceptionnelle de 5 000 €, discrète, paraît garder Elric sans toucher à la grille.",
      ceQuiLeDejoue:
        "Elle coûte 7,3 k€ charges comprises, autant que l'augmentation, et la source de Séverine montre qu'un écart hors grille finit connu de tout le bureau. Le plan de progression ne coûte que 2 800 € de formation, dans l'enveloppe de 3 %. Rejouée sur les trente tirages à la place de la grille et du plan, la prime perd 12,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce qui, dans les fins de mission, distinguait Tahina d'Elric sur les deux premiers critères de la grille ? Donnez les chiffres.",
    "Le départ d'un senior coûte 48 k€, un manager promu sans avoir piloté environ 60 k€ la première année. Comment ces deux chiffres se comparent-ils, quand on hésite à promouvoir Elric pour ne pas le perdre ?",
    "Trois non-retenus sur trois sont partis après le courriel du bureau, un sur trois après un entretien en face. Qu'est-ce qu'un entretien de refus doit contenir pour retenir ?",
    "En semaine 8, refuser sèchement fait mieux que la grille avec un plan 27 fois sur 30, pour 3 k€ de moins en moyenne, et l'épisode le compte comme un bon choix. Pourquoi deux réponses aussi proches sont-elles toutes deux acceptables, quand les 8 % hors grille ne le sont pas ?",
    "Que déclenche une augmentation hors grille dans un bureau où les coûts de ressource sont visibles ? Chiffrez ce qu'elle coûte en tout, rattrapages compris.",
    "Sous le tirage n° 12, ceux qui ont gardé le plus apprécié finissent à 134 k€, ceux qui ont décidé sur des critères à 268 k€. Si l'un d'eux n'a perdu personne, sa décision était-elle bonne ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour décider une promotion et l'annoncer ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une agence de conseil emploie des consultants seniors payés 50 k€ brut par an, avec 45 % de charges. Un senior est facturé 900 € par jour, 210 jours ouvrés par an, à 80 % d'occupation. Un départ coûte un cabinet de recrutement à 20 % du salaire brut annuel, dix semaines de vacance (sur 52 semaines par an) et quinze jours facturables de moins pendant l'intégration du remplaçant. 1) Calculez la contribution annuelle d'un senior, puis par semaine. 2) Calculez le coût d'un départ. 3) Un senior non promu demande 8 % d'augmentation hors grille ; deux collègues demanderaient alors un rattrapage de 4 %. Que coûtent ces trois augmentations par an, charges comprises, comparées à un plan de progression à 2 800 € ?",
    corrige:
      "1) Honoraires : 210 × 0,80 × 900 = 151 200 € ; salaire chargé : 50 000 × 1,45 = 72 500 € ; contribution : 151 200 − 72 500 = 78 700 € par an, soit 78 700 / 52 ≈ 1 513 € par semaine. 2) Cabinet : 0,20 × 50 000 = 10 000 € ; vacance : 10 × 1 513 ≈ 15 135 € ; intégration : 15 × 900 = 13 500 € ; total ≈ 38 635 €. 3) 8 % : 0,08 × 50 000 × 1,45 = 5 800 € ; les deux rattrapages : 2 × 0,04 × 50 000 × 1,45 = 5 800 € ; soit 11 600 € par an, et chaque année suivante, contre 2 800 € une fois pour le plan de progression.",
  },
  evaluation: [
    "Le coût du départ d'un senior est calculé juste (12,4 k€, 15,6 k€ et 20 k€, soit 48 k€) à partir de la source nommée, salaire déduit de la vacance.",
    "La recommandation au comité s'appuie sur les critères écrits de la grille et sur des faits datés pour chacun des trois candidats.",
    "L'annonce aux non-retenus contient la décision, les critères manqués, un plan de progression et une date de réexamen, sans promesse.",
    "La réponse à la demande de compensation tient compte de l'équité interne et de ce qu'un écart hors grille déclenche.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'entretien annuel d'évaluation que met en scène l'épisode ne se confond pas avec l'entretien professionnel prévu par le Code du travail, consacré aux perspectives d'évolution et à la formation. Une prime exceptionnelle « discrète » reste un élément de salaire soumis aux cotisations et au principe d'égalité de traitement : l'enseignant de droit social pourra le rappeler.",
};
