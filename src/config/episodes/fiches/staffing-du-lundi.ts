/**
 * FICHE ENSEIGNANT · ÉPISODE 73, LE STAFFING DU LUNDI.
 *
 * Affecter des ressources rares selon la valeur et le risque de chaque
 * mission, et lire un plan de charge en probabilités : un jour réservé « par
 * précaution » n'est pas un jour facturé, ni un premier arrivé un client prioritaire.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "staffing-du-lundi",
  formations: ["but-gea", "dcg", "bts-sam"],
  programme: [
    "BUT GEA · Évaluer l'activité de l'organisation",
    "DCG · UE 11, Contrôle de gestion",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
  ],
  notion:
    "Dans un cabinet, le temps des consultants est le produit, et il ne se stocke pas : un jour sans mission est perdu, un senior placé là où il compte peu est un dérapage ailleurs. L'erreur classique consiste à affecter dans l'ordre des demandes, en donnant les meilleurs à l'associé qui a écrit le premier, et à croire le plan de charge qui affiche 91 % pour octobre. Au bureau de Nantes d'Atlas Conseil, ces 91 % mêlent 786 jours signés, 72 jours de propositions gagnées une fois sur deux et 180 jours réservés « par précaution » qu'aucun printemps n'a vu facturer : l'occupation prévisible n'est que de 72,1 %. Et le senior que tout le monde réclame évite 22 % de dépassement sur un forfait hospitalier, quand il ne fait que facturer 250 € de plus par jour sur une régie qu'un confirmé tient sans incident. L'élève découvre qu'on affecte une ressource rare là où elle évite le plus de pertes, qu'on forme un débutant en binôme plutôt que de le placer seul, et qu'une réservation ou un creux se jugent sur leur probabilité et sur ce qu'ils empêchent.",
  objectifs: [
    "Je calcule un taux d'occupation prévisible à partir d'un plan de charge, en pondérant chaque jour par sa probabilité d'être facturé.",
    "J'affecte une ressource rare là où elle évite le plus de pertes (dépassements, pénalités, crise), et pas dans l'ordre des demandes.",
    "Je compare deux usages d'une période creuse : facturer tout de suite à bas prix, ou préparer des propositions et des compétences qui rapporteront plus tard.",
    "Je juge une réservation de précaution sur ce qu'elle a des chances de rapporter et sur ce qu'elle bloque.",
  ],
  prerequis:
    "Les notions de taux d'occupation, de marge sur une mission et de probabilité simple (une espérance : montant × chance) doivent être connues. La différence entre une mission en régie et un forfait se rappelle en début de séance ; le staffing se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/staffing-du-lundi?hasard=1 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le taux d'occupation prévisible du bureau en octobre, en %, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (ordre des demandes, valeur et risque, formation d'abord, comité des associés), celle de la semaine 4 sur les cinq consultants sans mission et celle de la semaine 6 sur Obinna au Pays de Retz. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 6.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir du plan de charge : 60 × 20 − 60 = 1 140 jours disponibles ; 786 jours signés, plus la moitié des 72 jours de propositions, soit 822 jours ; 822 / 1 140 = 72,1 %. Vous faites expliquer les valeurs éloignées (91,1, 75,3 ou 68,9), et vous demandez ce qu'il faudrait trouver pour atteindre les 75 % du mandat : environ 33 jours de plus.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : Gonzalo chez Distrimer, comme l'a demandé Sosthène, ou au pilotage du centre hospitalier. Vous faites relire les fiches des missions et chiffrer ce que le senior change de chaque côté. Vous enchaînez sur le creux d'octobre (la sous-traitance de Halden à 450 € par jour contre l'avant-vente et la certification), puis sur Obinna seul au Pays de Retz : six forfaits sur dix confiés seuls à des débutants ont dérapé.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 1, « Staffer selon la valeur et le risque » fait 998 k€ de marge et de propositions gagnées, « Premier associé arrivé, premier servi » 858 k€, et l'attentisme 812 k€. Vous montrez ensuite la décision la plus trompeuse de l'épisode : Obinna seul fait mieux que le binôme 21 fois sur 30, et perd pourtant 4 k€ en moyenne, parce qu'un livrable refusé coûte vingt-cinq jours de reprise et un avoir. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : affecter selon la valeur et le risque, pas selon l'ordre des demandes. Vous la déclinez en trois gestes : compter un plan de charge en probabilités, mettre le senior là où il évite le plus de dégâts, et former les débutants en binôme. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 72.1,
    etapes: [
      "Source « Détailler le plan de charge d'octobre dans Tempora » : 20 jours ouvrés pour 60 consultants, moins 60 jours de congés posés : 60 × 20 − 60 = 1 140 jours disponibles.",
      "Même source : 786 jours sur des missions signées comptent en entier. Les 72 jours de trois propositions en phase finale se gagnent d'habitude une fois sur deux : 72 × 0,5 = 36 jours. Les 180 jours réservés « par précaution » comptent pour zéro : au printemps, aucun n'a été facturé à la date prévue.",
      "Occupation prévisible : (786 + 36) / 1 140 = 822 / 1 140 ≈ 72,1 %, sous les 75 % du mandat. Les 91 % de l'alerte Tempora sont 1 038 / 1 140, des jours staffés ou réservés, pas des jours facturés.",
      "Le chiffre ne dépend pas du hasard : 72,1 % pour toute la classe. L'épisode le juge juste à 1,5 point près, proche à 4 points.",
    ],
    erreurs: [
      {
        valeur: 91.1,
        cause:
          "Le taux de l'alerte Tempora (1 038 / 1 140) : il compte les 180 jours réservés par précaution et les 72 jours de propositions comme s'ils étaient facturés.",
      },
      {
        valeur: 75.3,
        cause:
          "Les propositions comptées en entier ((786 + 72) / 1 140) : elles ne se gagnent qu'une fois sur deux.",
      },
      {
        valeur: 68.9,
        cause:
          "Les seules missions signées (786 / 1 140) : les propositions en phase finale ont une chance sur deux de se gagner et doivent compter pour la moitié.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Sosthène a écrit le premier, Distrimer est un client historique, et il « ne veut prendre aucun risque » : servir les demandes dans l'ordre paraît juste et évite le conflit entre associés.",
      ceQuiLeDejoue:
        "Les fiches des missions le disent : Distrimer est une régie payée au profil, quatorze fois faite sans incident, où un confirmé facture 850 € au lieu de 1 100 €. Le forfait du centre hospitalier, lui, dépasse de 3 % piloté par un senior et de 22 % piloté par un confirmé, avec un comité de pilotage sur deux qui tourne à la crise (18 k€). Victoire Lanoë le résume : « Demande-toi où un senior évite le plus de dégâts. » Rejoué sur les trente tirages à la place du staffing selon la valeur et le risque, l'ordre des demandes perd 66 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Ladislas Hamelin « le sent » : si Assurances Ligériennes signe et qu'il n'a personne, c'est un client de trois ans qu'il perd.",
      ceQuiLeDejoue:
        "L'historique de ses réservations montre que trois sur dix seulement ont débouché sur une mission, et pour Ligériennes aucune proposition n'est remise ; leur comité décide jeudi. La coopérative, elle, a signé, et partira chez Kéroual Consulting une fois sur deux si on la décale à novembre. Attendre le comité de jeudi coûte une semaine et garde les deux possibilités. Rejouée sur les trente tirages à la place de l'appel à Ligériennes, la réservation respectée perd 38 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Cinq consultants sans mission en octobre, c'est près de 10 000 € de salaires par semaine sans honoraires : la sous-traitance de Halden Partners fait facturer dès le 5 octobre et remonte l'occupation de sept points.",
      ceQuiLeDejoue:
        "Le carnet de novembre montre que le rush de fin d'année facturerait ces consultants 750 € par jour en moyenne, contre 450 € chez Halden, engagés fermes jusqu'au 27 novembre. Le point des propositions chiffre 390 k€ en jeu à 30, 35 et 40 % de chances, et des propositions préparées par des consultants dédiés se gagnent vingt points plus souvent. Rejouée sur les trente tirages à la place de l'avant-vente et de la certification, la sous-traitance perd 21 k€ en moyenne ; elle fait mieux 9 fois sur 30.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Sur le papier, Obinna seul fait la mission la plus rentable : 35 jours d'analyste à 300 € pour un forfait de 42 k€, 75 % de marge, et il est partant.",
      ceQuiLeDejoue:
        "La source sur les forfaits confiés seuls à des analystes de première année : quatre sur dix ont dérapé pour ceux qui avaient passé leur rentrée en binôme, un sur vingt en binôme avec un confirmé ; un livrable refusé coûte vingt-cinq jours de reprise à 850 € et un avoir de 10 %. La manager d'Obinna prévient qu'il n'a jamais vu d'ateliers avec des élus. Rejoué sur les trente tirages à la place du binôme, Obinna seul perd 4 k€ en moyenne, mais fait mieux 21 fois sur 30 : c'est la décision où le résultat trompe le plus.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Distrimer prolonge, et Sosthène le dit : « On ne change pas une équipe qui gagne. » Un confirmé sur l'avenant paraît moins risqué que de défaire une équipe qui marche.",
      ceQuiLeDejoue:
        "Le cahier des charges de Distrimer montre une suite faite de relances et de comités rodés, qu'un analyste formé en binôme tient déjà seul depuis trois semaines. L'historique des avenants hospitaliers : 25 % de dépassement piloté par un confirmé, 3 % par un senior, et un avenant mal tenu fait perdre vingt points de chances sur la tranche optionnelle de 140 k€ (49 k€ de marge prévue). Rejoué sur les trente tirages à la place d'Ombline sur l'avenant, le confirmé perd 17 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Sosthène a demandé Gonzalo le premier, à 7 heures, et le client le connaît ; accorder la réservation de Ladislas évite une dispute de plus.",
      ceQuiLeDejoue:
        "La demande de Distrimer est une animation de séminaire que Jannick Corbineau a tenue trois fois avec d'excellents retours. Une restitution sans senior fait baisser de vingt points les chances d'affermir la tranche du CH, et la réservation de Ladislas, sans proposition remise, retire 17 000 € de facturation du rush. Rejoué sur les trente tirages à la place d'un senior sur la restitution sans réservation, servir les demandes perd 31 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Tempora affichait 91 % pour octobre. Qu'est-ce qui, dans le détail du plan de charge, ramenait ce chiffre à 72 %, et lequel des deux décrit ce que le bureau facturera ?",
    "Gonzalo chez Distrimer ou au centre hospitalier : qu'est-ce que le senior change de chaque côté, en euros ? Pourquoi la mission du client historique n'est-elle pas celle où il compte le plus ?",
    "La réservation de Ladislas a trois chances sur dix de devenir une mission ; la coopérative a signé. Comment comparer un client certain et un client possible ?",
    "Facturer tout de suite à 450 € par jour chez Halden, ou préparer les propositions et passer la certification : qu'est-ce que chacun de ces choix empêche ?",
    "Obinna seul fait mieux que le binôme 21 fois sur 30, et perd pourtant en moyenne. Comment une décision peut-elle gagner le plus souvent et rester mauvaise ?",
    "Sous le tirage n° 1, ceux qui ont servi les associés dans l'ordre finissent à 858 k€, ceux qui ont staffé selon la valeur et le risque à 998 k€. Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour affecter une ressource rare entre plusieurs demandeurs ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une agence d'études de 40 consultants prépare son plan de charge de mars : 21 jours ouvrés, 40 jours de congés posés. Le plan montre 520 jours sur des missions signées, 100 jours sur des propositions remises qui se gagnent quatre fois sur dix, et 120 jours réservés « par précaution » par des directeurs, sans proposition remise. 1) Calculez les jours disponibles. 2) Calculez le taux affiché par le plan de charge. 3) Calculez le taux d'occupation prévisible. 4) La direction vise 75 % : combien de jours facturés faut-il trouver en plus ?",
    corrige:
      "1) 40 × 21 − 40 = 800 jours disponibles. 2) (520 + 100 + 120) / 800 = 740 / 800 = 92,5 %. 3) Les propositions comptent pour 100 × 0,4 = 40 jours, les réservations sans proposition pour zéro : (520 + 40) / 800 = 560 / 800 = 70 %. 4) 75 % de 800 = 600 jours ; il en manque 600 − 560 = 40.",
  },
  evaluation: [
    "Le taux d'occupation prévisible est calculé juste (1 140 jours disponibles, 822 jours probables, 72,1 %) à partir de la source nommée, et distingué du taux affiché.",
    "Chaque affectation d'un senior est justifiée par ce qu'il évite (dépassements, crise, chances d'une tranche) et non par l'ordre ou l'insistance des demandes.",
    "Le creux d'octobre et la réservation de précaution sont jugés sur leurs probabilités et sur ce qu'ils empêchent ensuite.",
    "La place des débutants (binôme ou seul) est argumentée avec les taux de dérapage des sources.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 1.",
  ],
};
