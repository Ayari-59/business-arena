/**
 * FICHE ENSEIGNANT · ÉPISODE 54, LA NOTE QUI CHUTE.
 *
 * La note en ligne se lit par thème et se répare à sa cause : elle fixe le prix
 * qu'un hôtel peut tenir et réagit avec retard. Le piège : soigner l'image
 * (gestes, relances, avis récompensés) au lieu de réparer les mauvaises nuits.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "note-qui-chute",
  formations: ["bts-mhr", "bac-pro-mcv", "seconde-pro-rc"],
  programme: [
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
    "Bac pro MCV · Bloc 2, Suivre les ventes",
    "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client",
  ],
  notion:
    "Une note en ligne est une moyenne de nuits passées à l'hôtel : elle ne remonte que si les nuits s'améliorent. L'erreur classique consiste à soigner l'image (un geste par avis négatif, des relances pour « noyer » les mauvais avis, une agence qui promet cinq dixièmes) ou à répondre aux avis les plus durs, qui ne sont pas les plus nombreux. Dans l'épisode, L'Escale Chambéry-Gare, 72 chambres face à la gare, est passée de 8,7 à 8,1 en trois mois. Les avis les plus lus racontent l'accueil ; mais classés par thème, les 78 avis négatifs de mai citent la chaleur pour 47 % et le bruit pour 32 %, presque tous dans les 40 chambres côté gare, aux climatiseurs de quatorze ans, quand les 32 chambres côté cour sont notées 8,8. Un dixième de note vaut environ 1 € de prix moyen sur les 5 100 nuitées du budget et 20 nuitées à 102 €, soit 7 140 € sur l'été ; sous 8,0, l'hôtel sort du filtre « 8 et plus » et perd 6 % de réservations. L'élève découvre qu'on lit les avis par thème avant d'agir, qu'on répare la cause (les climatiseurs, le buffet vide à 8 h 40), qu'on fait suivre le prix à la note, qu'un avantage contre un avis est interdit par les plateformes, et que la note réagit avec plusieurs semaines de retard.",
  objectifs: [
    "Je classe des avis clients par thème et je chiffre la part de chaque thème avant de choisir une action.",
    "Je calcule ce que coûte un dixième de note, en prix moyen et en nuitées.",
    "Je distingue une action qui répare la cause d'une action qui soigne l'image, et je respecte les règles des plateformes sur les avis.",
    "Je réponds à un avis négatif sobrement, en disant ce qui a été réparé, et je demande un avis au départ sans contrepartie.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de prix moyen, de taux d'occupation et de satisfaction client doivent être connues, ainsi que le fonctionnement d'une plateforme de réservation et de ses avis. Le classement des avis par thème et le prix « tenable » peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/note-qui-chute?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez L'Escale Chambéry-Gare et sa note passée de 8,7 à 8,1, et vous demandez de noter sur papier, avant de valider la semaine 1, le manque à gagner d'un dixième de note sur l'été et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez l'action lancée en semaine 1 (gestes et relances, climatiseurs, accueil, attente) et la réponse à Réputea Conseil en semaine 6, où la classe se partage. Un binôme qui a fini tôt reclasse sur papier les pourcentages de la source « Classer les avis négatifs de mai par thème » et explique pourquoi leur somme dépasse 100 %.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous refaites le calcul avec la classe à partir de ce que dit Lucile Fabbri : 1 € de prix moyen sur les 5 100 nuitées du budget, plus 20 nuitées perdues au classement, à 102 €. Vous faites expliquer les valeurs éloignées (5 100 €, 2 040 € ou 42 840 €). Vous mettez ensuite le chiffre en face des actions : la remise en état des 40 climatiseurs coûte 8 400 €, à peine plus d'un dixième de note.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et de la semaine 6. Pour la semaine 1, vous faites lire côte à côte la source « Lire les avis les plus durs » et le classement par thème : les avis les plus vus ne sont pas les plus nombreux. Pour la semaine 6, vous faites lire les règles des plateformes et le témoignage de Noélie Marchetto à Annemasse. Vous enchaînez sur les prix de l'été : pourquoi tenir 102 € à une note de 8,1 fait fuir les clients vers des voisins mieux notés, et pourquoi baisser de 10 € remplit surtout les week-ends déjà pleins.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Réparer la cause, tenir le prix » finit à 465,9 k€ de chiffre d'affaires net pour 455 k€ attendus, avec une note remontée à 8,7 ; « Soigner l'image » finit à 369,2 k€ et « Attentiste » à 364,9 k€, tous deux sous 7,6 et sortis du filtre « 8 et plus » presque tout l'été. Vous montrez ensuite la seule décision où le hasard renverse le jugement : les avis récompensés. Sur les trente tirages, ils passent sans être détectés 14 fois et font alors mieux que les réponses sobres ; détectés les autres fois, ils coûtent cher, et perdent 14,2 k€ en moyenne. Sous le tirage n° 12, ils sont détectés. Vous faites dire si ceux qui n'auraient pas été pris avaient pris une bonne décision.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : on lit les avis par thème, on répare la cause, on fait suivre le prix à la note, on répond sobrement et on demande un avis au départ. Vous rappelez que la note réagit avec retard : les avis de juin pèsent encore en août, et il faut tenir le cap. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 7140,
    etapes: [
      "Source « Demander au revenue management ce que vaut un dixième de note » : un dixième de point vaut environ 1 € de prix moyen à occupation égale, et le classement des plateformes en retire environ 20 nuitées par trimestre ; le budget de l'été prévoyait 5 100 nuitées à 102 €.",
      "L'effet sur le prix : 1 € de moins sur chacune des 5 100 nuitées du budget, soit 5 100 €.",
      "L'effet sur le volume : 20 nuitées de moins à 102 €, soit 2 040 €.",
      "Manque à gagner d'un dixième de note sur l'été : 5 100 + 2 040 = 7 140 €. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 300 € près, proche à 1 000 €.",
      "Pour comparer : la note a perdu six dixièmes, soit environ 42,8 k€ sur l'été si elle ne remonte pas, sans compter les 6 % de réservations perdues sous 8,0 ; la remise en état des 40 climatiseurs côté gare coûte 8 400 €.",
    ],
    erreurs: [
      {
        valeur: 5100,
        cause:
          "Seul l'effet sur le prix est compté (1 € × 5 100 nuitées) : les 20 nuitées que le classement retire sont oubliées.",
      },
      {
        valeur: 2040,
        cause:
          "Seules les 20 nuitées perdues sont comptées (20 × 102 €) : l'euro de prix moyen perdu sur toutes les nuitées pèse plus que le volume.",
      },
      {
        valeur: 42840,
        cause:
          "Les six dixièmes perdus depuis le printemps multipliés d'emblée (6 × 7 140) : la question porte sur un seul dixième.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Ana Sousa le propose : un geste par avis négatif montre qu'on écoute, et des relances massives « noient » les mauvais avis sous les bons.",
      ceQuiLeDejoue:
        "Le classement par thème montre que 47 % des avis négatifs citent la chaleur et 32 % le bruit, presque tous côté gare, où la chambre 214 est à 28 °C à 23 heures : un geste de 45 € ne refroidit aucune chambre, et un avis publié n'est presque jamais modifié. Relancer les clients des trois derniers mois fait écrire ceux qui ont eu chaud. Aymar Mollaret l'avait dit : cherchez ce qui fait les mauvaises nuits avant de chercher ce qu'on répond. Rejoué sur les trente tirages à la place des climatiseurs, ce choix perd 51,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Offrir le petit-déjeuner à ceux qui se plaignent répare le tort tout de suite, au cas par cas, sans engager d'équipe.",
      ceQuiLeDejoue:
        "La source « Observer le petit-déjeuner » montre la cause : une seule livraison de la boulangerie, à 6 h 30, un seul responsable pour tout, et des clients de loisirs qui arrivent après 8 h 30, 25 % en juin et 65 % à la mi-août. Ilias Benchekroun le constate : les clients remercient, et le lendemain le buffet est toujours vide à 8 h 40. L'extra et la seconde livraison coûtent 520 € par semaine. Rejoué sur les trente tirages à leur place, le geste au comptoir perd 6,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le pick-up de l'été est en retard et la note baisse : 10 € de moins partout rempliront l'hôtel, comme le propose Lucile Fabbri.",
      ceQuiLeDejoue:
        "La comparaison avec les voisins de la gare montre que l'écart de prix suit l'écart de note, environ 1 € par dixième : 10 €, c'est bien plus que ce que la note a fait perdre. Le pick-up date par date montre un retard sur les nuits de semaine, quand les week-ends se remplissent normalement : la baisse remplit surtout ce qui se remplissait déjà, et la gare n'a pas beaucoup plus de clients à donner. Rejouée sur les trente tirages à la place du prix qui suit la note, la baisse de 10 € perd 9,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Cinq dixièmes en six semaines, une chaîne comme Orméa Hotels qui travaillerait avec eux, et la note n'est qu'à 8,1 : il faut aller vite.",
      ceQuiLeDejoue:
        "Les règles de Bookalia et Voyagio sont nettes : offrir un avantage en échange d'un avis est interdit, même sans demander qu'il soit positif, et la sanction est le retrait des avis, le déclassement et parfois un avertissement sur la fiche, sur deux plateformes qui font près de six réservations sur dix. Noélie Marchetto l'a vécu à Annemasse : une soixantaine d'avis retirés et des semaines de réservations en chute. Rejoués sur les trente tirages à la place des réponses sobres, les avis récompensés perdent 14,2 k€ en moyenne ; ils font mieux 14 fois, quand ils passent inaperçus, mais sous le tirage n° 12 ils sont détectés et coûtent 38,5 k€.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Confier les réponses à une agence fait gagner du temps, et un geste sur chaque avis négatif montre que l'hôtel prend les plaintes au sérieux.",
      ceQuiLeDejoue:
        "La source sur les réponses aux avis le dit : un avis publié n'est presque jamais modifié, geste ou pas ; une réponse courte, qui reconnaît le problème et dit ce qui a été réparé, fait environ 2 % de réservations de plus, une réponse type deux fois moins. L'agence coûte 1 500 € de mise en place, 220 € par semaine et 45 € par avis négatif, quand Ana et Hadrien répondent eux-mêmes en une demi-heure par jour. Rejouée sur les trente tirages à la place des réponses sobres, l'agence perd 6,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Un petit-déjeuner offert aux clients côté gare fait passer la chaleur : c'est un geste qui se voit.",
      ceQuiLeDejoue:
        "Givrelle Climatisation prévient que, sans remise en état, les chambres côté gare dépasseront 30 °C la nuit ; Ilias le constate : la 214 est toujours à 29 °C. Le geste coûte 14 € par nuitée côté gare et ne change rien à la nuit, quand donner d'abord les chambres côté cour ne coûte rien et que la gouvernante peut revoir ses étages. Rejoué sur les trente tirages à la place de cette attribution, le petit-déjeuner offert perd 6,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La note remonte trop lentement : relancer tous les clients de l'été fera enfin venir des avis.",
      ceQuiLeDejoue:
        "La source sur L'Escale Aix-les-Bains : une relance envoyée à tous les clients de l'hiver a fait écrire 80 avis plus durs que la moyenne, les mécontents répondant les premiers ; demander un avis au départ, le lendemain du séjour, fait écrire aussi les clients contents. Relancer depuis juin fait raconter des nuits d'avant la réparation. Rejouée sur les trente tirages à la place de la demande au départ, la relance perd 3,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, les avis les plus lus parlaient de l'accueil. Qu'est-ce que le classement par thème montrait ? Pourquoi les avis les plus durs ne sont-ils pas forcément les plus nombreux ?",
    "Les chambres côté cour sont notées 8,8, celles côté gare tirent la note vers le bas. Comment ce chiffre permet-il de trouver la cause, et d'écarter le chantier comme seule explication ?",
    "Un dixième de note vaut 7 140 € sur l'été. Combien de dixièmes la remise en état des climatiseurs devait-elle faire regagner pour se payer ?",
    "Pourquoi un geste commercial ne change-t-il presque jamais un avis déjà publié ? Qu'est-ce qu'une bonne réponse à un avis négatif, et à qui s'adresse-t-elle vraiment ?",
    "Sous le tirage n° 12, les avis récompensés ont été détectés ; sous d'autres tirages, ils passent. Ceux qui n'auraient pas été pris avaient-ils pris une bonne décision ? Que pèse une règle des plateformes, et la loyauté envers les clients qui lisent les avis ?",
    "La note réagit avec retard : les avis de juin pèsent encore en août. Comment tenir le cap auprès d'une directrice et d'une direction qui veulent voir la note remonter tout de suite ?",
    "Quelle règle gardez-vous pour répondre à une note qui baisse ? Formulez-la en une phrase, avec le mot « thème » dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 40 chambres prévoit 2 400 nuitées sur la saison à 90 € de prix moyen. Un dixième de note vaut 1 € de prix moyen et 12 nuitées par saison. Sa note a perdu quatre dixièmes. Sur 60 avis négatifs, 30 citent le bruit de la ventilation des chambres du 2e étage, 18 le parking, 12 l'accueil. 1) Que coûte un dixième de note sur la saison ? Et les quatre dixièmes perdus ? 2) Un geste de 40 € par avis négatif ne modifie pas les avis publiés : que coûte-t-il ? 3) Le remplacement de la ventilation coûte 6 000 € et devrait faire regagner trois dixièmes : que rapporte-t-il, net de son coût ? 4) Si la note tombe sous 8,0, l'hôtel perd 6 % de ses réservations : combien de nuitées et de chiffre d'affaires cela représente-t-il sur la saison ?",
    corrige:
      "1) 1 € × 2 400 + 12 × 90 = 2 400 + 1 080 = 3 480 € ; quatre dixièmes : 4 × 3 480 = 13 920 €. 2) 60 × 40 = 2 400 €, sans effet sur la note. 3) 3 × 3 480 = 10 440 € regagnés, soit 10 440 − 6 000 = 4 440 € nets sur la saison, et davantage les saisons suivantes. 4) 6 % de 2 400 = 144 nuitées, soit 144 × 90 = 12 960 € : sortir du filtre coûte presque autant que les quatre dixièmes perdus.",
  },
  evaluation: [
    "Le manque à gagner d'un dixième de note est calculé juste, effet prix et effet volume, à partir de la source de Lucile Fabbri.",
    "Le diagnostic s'appuie sur le classement des avis par thème et sur l'écart entre côté gare et côté cour, et non sur les avis les plus lus.",
    "Chaque action est classée comme réparant une cause ou soignant l'image, et l'élève respecte les règles des plateformes sur les avis.",
    "Le prix de l'été est argumenté par le lien entre la note et le prix que les voisins de la gare permettent de tenir.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode présente l'interdiction des avis récompensés comme une règle des plateformes ; en France, les avis en ligne relèvent aussi du code de la consommation (information sur la manière dont les avis sont collectés et contrôlés, pratiques commerciales trompeuses) : à préciser avant d'en faire une règle de droit. Le modèle traite la canicule comme un risque commercial ; un enseignant voudra peut-être rappeler les consignes de prévention de la chaleur pour les équipes d'étages.",
};
