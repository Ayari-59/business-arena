/**
 * FICHE ENSEIGNANT · ÉPISODE 53, LES CHAMBRES VENDUES DEUX FOIS.
 *
 * La surréservation se calcule en espérance : une réservation de plus vaut la
 * peine tant que la chance qu'elle remplisse une chambre vide, fois la marge,
 * l'emporte sur la chance qu'elle fasse déloger, fois le coût du délogement.
 * Le piège : une règle uniforme, la moyenne des défections, ou tout arrêter.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "surreservation",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Un soir complet, chaque client qui ne vient pas laisse une chambre vide qu'on ne revendra jamais ; chaque réservation de trop fait déloger quelqu'un. Les deux erreurs n'ont pas le même prix : c'est tout l'épisode. L'erreur classique consiste à refuser toute surréservation au nom de la réputation, ou à appliquer une règle simple (5 % partout, la moyenne des défections), ou encore à tout arrêter après quelques délogements. Dans l'épisode, Lucile Fabbri, revenue manager du Groupe Escale, fixe la surréservation de sept hôtels pour un automne de salons et de congrès. Une chambre vide à Chambéry-Gare coûte 121 € de marge (142 € moins 21 € de coût variable), un client de passage délogé 260 €, un client d'affaires fidèle délogé 1 030 €. Les défections vont de 10,6 % à Annemasse à 2,8 % à Aix-les-Bains, selon le mélange de clients. L'élève découvre qu'on ajoute une réservation tant que la probabilité qu'elle trouve une chambre libérée, multipliée par la marge, dépasse la probabilité qu'elle fasse déloger, multipliée par le coût du délogement ; que ce niveau change avec le segment, la garantie, le soir et la personne délogée ; et qu'on le recalcule quand les défections constatées changent.",
  objectifs: [
    "Je calcule la marge d'une chambre vide et le coût complet d'un délogement, ce que le client emporte compris.",
    "Je fixe une surréservation en comparant, réservation par réservation, le gain et le risque en espérance.",
    "Je choisis qui déloger pour réduire le coût d'un délogement, et je protège les clients fidèles.",
    "Je recalcule le niveau quand la garantie, le segment, le soir ou les défections constatées changent.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "La marge sur coût variable, le taux d'occupation et la lecture d'une probabilité cumulée (« au plus 5 défections : 27 % ») doivent être connus ; l'espérance d'un gain peut être introduite pendant la séance à partir de la source de Léontine Mugnier.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/surreservation?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez le Groupe Escale et ses directeurs qui détestent déloger, et vous demandez de noter sur papier, avant de valider la semaine 1, le nombre de réservations à accepter au-delà des 72 chambres de Chambéry-Gare un soir de salon, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez la politique de la semaine 1 (aucune, 5 %, calcul par hôtel, moyenne des défections) et la réponse aux directeurs en semaine 10. Un binôme qui a fini tôt refait le calcul de Chambéry-Gare avec un client fidèle délogé, à 1 030 €.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous construisez au tableau un tableau à trois colonnes, réservation par réservation : la chance qu'elle trouve une chambre libérée, ce qu'elle rapporte (× 121 €), ce qu'elle risque (× 260 €). La 6e rapporte 88 € et risque 70 € ; la 7e rapporte 70 € et risque 109 € : on s'arrête à 6. Vous faites expliquer les valeurs éloignées (7, 4 ou 0), puis vous montrez que le seuil se lit d'un coup : on ajoute une réservation tant que sa chance de remplir une chambre dépasse 260 / (121 + 260), soit 68 %, autrement dit tant que sa chance de faire déloger reste sous 32 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 6 (le congrès d'Annecy) et de la semaine 10. Pour le congrès, vous faites refaire le calcul avec un délogement à 478 € et des défections tombées à 2,3 % : la demande n'a jamais été aussi forte, et pourtant il faut surréserver moins. Pour la semaine 10, ceux qui ont suspendu toute surréservation défendent leur argument, et la classe le confronte au compte des chambres remplies et des délogements.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Comparer en espérance la chambre vide et le délogement » finit à 914 k€ de marge pour 890 k€ attendus : 314 chambres remplies, 34 clients délogés, presque aucun fidèle. « Attentiste » finit à 849 k€ avec 583 chambres vides et 2 délogements ; « Les réflexes : 5 % partout, puis tout arrêter » à 841 k€, avec 97 délogés, dont plus de 22 fidèles. Vous faites remarquer que la meilleure méthode déloge davantage que l'attentiste et gagne pourtant 65 k€ de plus : le nombre de délogements n'est pas le critère. Sur les trente tirages, aucun des quatre réflexes ne fait mieux une seule fois.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : accepter la réservation de plus tant que P(chambre libérée) × marge > P(délogement) × coût du délogement. Vous en tirez les gestes : un niveau par hôtel et par soir, des clients de passage délogés et prévenus à 18 heures, une garantie adaptée au client, un recalcul pour les soirs exceptionnels et avec les défections constatées. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 6,
    etapes: [
      "Source « Chiffrer avec Ilse ce que coûtent une chambre vide et un délogement » : à Chambéry-Gare, une chambre vide un soir de salon coûte 142 − 21 = 121 € de marge ; délogé chez un confrère, un client de passage coûte 165 + 30 + 35 = 230 €, plus 7,5 % × 400 € = 30 € de marge future, soit 260 €.",
      "La règle de Léontine Mugnier : la réservation n° k au-delà des 72 chambres remplit une chambre si au moins k clients font défection, et fait déloger sinon. On l'accepte si P(au moins k défections) × 121 > P(au plus k − 1 défections) × 260.",
      "Avec les probabilités de la source « Extraire de Hostéo les défections » : la 4e réservation (au plus 3 défections : 6 %) rapporte 0,94 × 121 = 113,7 € et risque 0,06 × 260 = 15,6 € ; la 5e (14 %) : 104,1 € contre 36,4 € ; la 6e (27 %) : 88,3 € contre 70,2 € : on l'accepte.",
      "La 7e (au plus 6 défections : 42 %) rapporte 0,58 × 121 = 70,2 € et risque 0,42 × 260 = 109,2 € : on la refuse. Réponse : 6 réservations au-delà des 72 chambres. Le seuil se lit aussi d'un coup : on accepte tant que la chance de remplir une chambre dépasse 260 / (121 + 260) ≈ 68 %, autrement dit tant que P(au plus k − 1 défections) reste sous 32 %.",
      "Le chiffre ne dépend pas du hasard : 6 pour toute la classe, et l'épisode n'accepte que la valeur exacte. Il est inférieur aux 7,2 chambres libérées en moyenne parce qu'un délogement coûte plus de deux fois une chambre vide.",
    ],
    erreurs: [
      {
        valeur: 7,
        cause:
          "La moyenne des défections (7,2 chambres libérées par soir de salon) prise pour le bon niveau : elle oublie qu'un délogement coûte plus de deux fois une chambre vide.",
      },
      {
        valeur: 4,
        cause:
          "Le coût d'un client d'affaires fidèle délogé (1 030 €) pris au lieu de celui d'un client de passage : la question dit qu'on déloge un client de passage. La même valeur sort de la règle des 5 % (5 % de 72 = 3,6).",
      },
      {
        valeur: 0,
        cause:
          "Aucune surréservation, pour ne jamais déloger : la 1re réservation de plus a 100 % de chances, ou presque, de trouver une chambre libérée.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Un client qui a réservé a sa chambre : Pascaline Domenge le redit, quelques chambres vides sont le prix de la réputation, et les réceptions respirent.",
      ceQuiLeDejoue:
        "Ilse Montmasson donne l'ordre de grandeur dès le premier jour : sans surréservation, environ 630 chambres vides les soirs complets, 82 k€ de marge. Romuald Aubertin finit les soirs de salon avec sept ou huit chambres vides après avoir refusé du monde à 17 heures, et la source sur l'an dernier compte 8,3 chambres libérées par soir à Annemasse, 7,2 à Chambéry-Gare. Rejouée sur les trente tirages à la place du calcul par hôtel, l'absence de surréservation perd 35 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Une règle que toutes les réceptions comprennent, et qu'Orméa Hotels applique à 8 % dans ses hôtels de centre-ville.",
      ceQuiLeDejoue:
        "Les défections vont de 10,6 % à Annemasse à 2,8 % à Aix-les-Bains : 5 % partout, c'est trop peu là où les clients d'affaires sans garantie font défection une fois sur six, et trop là où ils ont payé d'avance. Romy Castellane le voit au Lac, vendu surtout en non remboursable. Les taux d'Orméa ne sont pas publiés, et sa clientèle n'est pas la même. Rejouée sur les trente tirages à la place du calcul par hôtel, la règle des 5 % perd 14,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Une demande pareille ne se reverra pas avant l'an prochain : Romy Castellane veut surréserver davantage, tout ce qui se libère sera repris.",
      ceQuiLeDejoue:
        "Les deux termes du calcul vont dans l'autre sens : les congressistes ont leur chambre comprise dans l'inscription, et les défections tombent à 2,3 % à Annecy-Centre et 2,2 % au Lac ; il n'y a plus un confrère libre en ville, et un délogement à Aix-les-Bains coûte 478 € au lieu de 260 €. Josquin Covarel prévient qu'aucun congressiste n'acceptera de dormir à Aix. Rejouée sur les trente tirages à la place du recalcul, la surréservation renforcée perd 17,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Les directeurs le demandent par écrit, et plus aucun délogement soulagera les réceptions : on ne prend pas le risque pour quelques chambres.",
      ceQuiLeDejoue:
        "Les trois dernières semaines sont celles des salons de novembre : 18,5 % de défections à Chambéry-Gare avec la garantie en vigueur, contre 10 % en octobre, à 121 € la chambre vide. La source sur les avis montre que les clients délogés, prévenus et bien traités, écrivent peu ; les avis viennent des soirs où l'on déloge beaucoup à la fois. Rejouée sur les trente tirages à la place du maintien chiffres à l'appui, la suspension perd 13,1 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Pascaline Domenge parlait de réputation, Romuald Aubertin de chambres vides. Qu'est-ce qui, dans les sources, permettait de mettre un prix sur chacune des deux craintes ?",
    "La moyenne des défections à Chambéry-Gare est de 7,2 chambres, et le calcul donne 6. Pourquoi surréserver moins que la moyenne ? Que faudrait-il pour surréserver plus ?",
    "Déloger le dernier arrivé coûte en moyenne 683,50 € à Chambéry-Gare, un client de passage choisi à 18 heures 260 €. D'où vient l'écart, et qu'est-ce qu'il change au bon niveau de surréservation ?",
    "Pendant le congrès d'Annecy, la demande n'a jamais été aussi forte et il fallait surréserver moins. Comment l'expliquer avec les deux termes du calcul ?",
    "Sous le tirage n° 12, la meilleure méthode déloge 34 clients, l'attentiste 2, et la meilleure méthode gagne pourtant 65 k€ de plus. Le nombre de délogements est-il un bon indicateur ? Lequel présenteriez-vous aux directeurs ?",
    "Supposons qu'un soir, sous un autre tirage, la meilleure méthode ait délogé cinq clients d'un coup. Cela prouve-t-il que le niveau était trop haut ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle Lucile Fabbri doit-elle écrire pour les réceptions ? Formulez-la en une phrase, avec la marge et le coût du délogement dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 50 chambres est complet un soir de salon. Sur 50 réservations, la probabilité d'avoir au plus 0 défection est de 5 %, au plus 1 de 18 %, au plus 2 de 38 %, au plus 3 de 60 %, au plus 4 de 78 %. Une chambre vide coûte 100 € de marge ; un client de passage délogé, 200 €. 1) Combien de réservations accepter au-delà des 50 chambres ? Donnez, pour chaque réservation de plus, ce qu'elle rapporte et ce qu'elle risque en espérance. 2) Que vaut en espérance la 2e réservation de plus, et la 3e ? 3) Un soir où toute la ville est pleine, un délogement coûte 500 €. Combien de réservations accepter alors ?",
    corrige:
      "1) La 1re rapporte 0,95 × 100 = 95 € et risque 0,05 × 200 = 10 € ; la 2e rapporte 0,82 × 100 = 82 € et risque 0,18 × 200 = 36 € ; la 3e rapporte 0,62 × 100 = 62 € et risque 0,38 × 200 = 76 € : on en accepte 2. 2) La 2e vaut 82 − 36 = 46 € en espérance, la 3e 62 − 76 = −14 €. 3) La 1re rapporte 95 € et risque 0,05 × 500 = 25 € ; la 2e rapporte 82 € et risque 0,18 × 500 = 90 € : on n'en accepte qu'une. Le seuil se lit aussi d'un coup : on accepte tant que la chance de déloger reste sous 100 / (100 + 200) = 33 %, puis sous 100 / (100 + 500) ≈ 17 %.",
  },
  evaluation: [
    "La marge d'une chambre vide et le coût d'un délogement sont calculés juste, avec ce que le client emporte, et le niveau de Chambéry-Gare est trouvé par la comparaison en espérance.",
    "La politique choisie est différenciée par hôtel et par soir, et l'élève dit pourquoi une règle uniforme ou la moyenne des défections se trompe.",
    "Le choix de la personne délogée et des garanties est argumenté par son effet sur les deux termes du calcul (défections, coût du délogement).",
    "La réponse aux directeurs s'appuie sur le compte des chambres remplies et des délogements, et non sur le seul nombre de délogements.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode chiffre le délogement comme un coût commercial (la nuit chez un confrère, le taxi, un geste) ; les obligations de l'hôtel envers le client délogé et la facturation des no-shows dépendent des conditions de vente portées à la connaissance du client avant la réservation. Le calcul de la semaine 1 applique à chaque réservation de plus les probabilités données pour 72 réservations : c'est l'approximation de l'épisode.",
};
