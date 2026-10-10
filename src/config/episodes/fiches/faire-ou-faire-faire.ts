import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 33, FAIRE OU FAIRE FAIRE.
 *
 * Coûts évitables et coûts irrécupérables dans une décision d'externalisation,
 * et l'horizon auquel un coût devient évitable. Les chiffres du corrigé sont
 * ceux des sources de la semaine 1 ; ceux du débrief, ceux du hasard n° 8,
 * celui du lien de la classe, et du bilan sur trente tirages.
 */
export const FICHE: FicheEnseignant = {
  code: "faire-ou-faire-faire",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Contrôle de gestion",
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
  ],
  notion:
    "Quand on hésite entre faire soi-même et confier à un prestataire, son prix ne se compare pas au coût complet mais aux seuls coûts que la décision fait disparaître, à l'horizon où elle les fait disparaître. L'erreur classique consiste à lire un prix inférieur au coût complet comme une économie, alors que ce coût contient des charges qui resteront payées quoi qu'on décide : salaires des CDI qu'on ne licenciera pas, amortissement de matériels achetés, loyer d'un garage sous bail, frais de siège. L'épisode met l'élève face à un transporteur qui propose 48 € et 60 € la livraison contre un coût complet de 65 €, soit 4 020 € d'économie affichée par semaine. Le piège est double : en agglomération, une livraison ne coûte que 12 € d'évitable et la confier fait perdre 36 € à chaque fois, tandis que sur les tournées lointaines 67 € disparaissent pour un prix de 60 €. Le trimestre ajoute ensuite les deux autres faces de la notion : une location devient évitable à son échéance, des aménagements déjà payés ne plaident ni pour ni contre son renouvellement, et un coût complet qui monte parce que les frais communs se répartissent sur moins de livraisons ne dit rien de ce qu'une livraison coûte à faire.",
  objectifs: [
    "Je décompose un coût complet en coûts évitables et en coûts qui restent, ligne par ligne, en justifiant chaque classement par un contrat ou une échéance.",
    "Je compare le prix d'un prestataire au seul coût évitable de ce qu'il reprend, et non au coût complet.",
    "Je reconnais un coût irrécupérable, comme des aménagements payés à la signature, et je l'écarte de la décision.",
    "Je date chaque coût : je repère l'échéance à partir de laquelle il devient évitable et je refais la comparaison à cet horizon.",
  ],
  prerequis:
    "Les élèves doivent savoir distinguer charges variables et charges fixes et avoir calculé un coût complet avec répartition des charges indirectes ; la notion de coût pertinent peut être découverte pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/faire-ou-faire-faire?hasard=8 : toute la classe joue le même trimestre, sous le même aléa. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous annoncez qu'en semaine 1 chacun devra déposer une estimation chiffrée, et qu'elle sera corrigée au tableau.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions. Vous circulez sans donner de réponse et vous relevez, sur une feuille, l'estimation de la semaine 1 de chaque poste et le choix de chacun à la décision 1 (tout confier, les tournées lointaines seulement, rien, ou attendre la semaine 7). Ceux qui finissent tôt lisent leur bilan sur trente tirages et préparent une phrase sur la décision qui leur a coûté le plus.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous affichez au tableau la distribution des estimations de la classe, puis vous reprenez le coût complet de 19 500 € ligne par ligne en demandant, pour chacune, si elle disparaît quand le transporteur reprend les tournées lointaines d'ici la semaine 6. Vous aboutissez à 67 € et vous expliquez d'où viennent les estimations à 83,7 € et autour de 60 €. Signalez que 65 € tombe près du juste par coïncidence : le coût complet n'est pas la bonne grandeur, même quand il donne presque le bon chiffre.",
    },
    {
      minutes: 35,
      titre: "Débrief des décisions et du bilan",
      detail:
        "Vous partez de la décision où la classe s'est le plus partagée, en général la première ou celle de la semaine 10, et vous faites défendre chaque option par un élève qui l'a choisie avant de chiffrer. Vous posez les questions du débrief dans l'ordre, puis vous projetez le bilan sur trente tirages pour séparer la qualité d'une décision du résultat obtenu sous l'aléa n° 8.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle au tableau : un prix se compare aux coûts que la décision fait disparaître, à l'horizon où ils disparaissent ; un coût déjà engagé ne compte pas. Vous la faites appliquer aux trois moments de l'épisode : l'offre (12 € contre 48 €, 67 € contre 60 €), l'échéance de la location (83,7 €) et le coût complet qui monte (52,3 € puis 57 €, pour un coût évitable resté à 12 €). Vous distribuez l'exercice de prolongement.",
    },
  ],
  calcul: {
    reponse: 67,
    etapes: [
      "La source « Lire les contrats : chauffeurs, location, garage » dit ce qui disparaîtrait si le transporteur reprenait les 90 livraisons lointaines d'ici la semaine 6 : les missions des trois intérimaires (préavis d'une semaine) et les heures supplémentaires avec elles. Restent payés : les six CDI (pas de licenciement ce trimestre), la location des trois porteurs (ferme jusqu'à la fin de la semaine 6), l'amortissement des porteurs achetés, le garage, l'assurance, l'encadrement et la quote-part du siège.",
      "La source « Décomposer le coût complet de 65 € avec Apolline » chiffre les lignes évitables par semaine : carburant, péages, pneus et entretien des zones lointaines, 2 430 € (27 € × 90) ; trois intérimaires, 3 000 € ; heures supplémentaires des tournées lointaines, 600 €.",
      "Coût évitable hebdomadaire des tournées lointaines : 2 430 + 3 000 + 600 = 6 030 €.",
      "Coût évitable d'une livraison lointaine : 6 030 / 90 = 67 €, contre un prix de 60 € : confier ces tournées fait gagner 7 € par livraison, 630 € par semaine.",
      "Pour comparaison, en agglomération seuls le carburant et l'usure disparaissent, 12 € par livraison, contre un prix de 48 € : confier y fait perdre 36 € par livraison. À partir de la semaine 7, la location devient évitable et le coût évitable lointain passe à 67 + 1 500 / 90 ≈ 83,7 €.",
    ],
    erreurs: [
      {
        valeur: 83.7,
        cause:
          "La location des trois porteurs (1 500 € par semaine) est comptée comme évitable alors qu'elle est ferme jusqu'à la fin de la semaine 6 : c'est le bon chiffre, mais pour la semaine 7 et après.",
      },
      {
        valeur: 60.3,
        cause:
          "Les 600 € d'heures supplémentaires des tournées lointaines sont oubliés : 5 430 / 90. Elles disparaissent pourtant avec les missions des intérimaires.",
      },
      {
        valeur: 27,
        cause:
          "Seuls les coûts au kilomètre sont retenus, comme si les intérimaires étaient des salariés permanents : leur mission s'arrête avec une semaine de préavis, leur coût est évitable.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "48 € et 60 € sont sous le coût complet de 65 € : la direction a calculé 4 020 € d'économie par semaine, plus de 50 k€ sur le trimestre.",
      ceQuiLeDejoue:
        "En agglomération, une livraison confiée ne fait disparaître que 12 € de carburant et d'usure : 210 × (48 − 12) = 7 560 € de plus par semaine, contre 630 € gagnés sur les tournées lointaines. Les six CDI et les porteurs achetés restent payés à attendre, ce que disait la lecture des contrats.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Attendre la fin de la location évite de payer des porteurs vides : l'option paraît prudente et respecte l'échéance du contrat.",
      ceQuiLeDejoue:
        "L'échéance ne change que le coût évitable des tournées lointaines (83,7 €) ; en agglomération il reste de 12 € contre 48 €. Et attendre fait renoncer, des semaines 3 à 6, aux 7 € gagnés par livraison lointaine dès le départ des intérimaires.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi: "3 € de moins par livraison, c'est le prix le plus bas, et ferme pendant un an.",
      ceQuiLeDejoue:
        "Avec les seules tournées lointaines confiées, il manque 30 livraisons aux 120 garanties chaque semaine : les transférer depuis l'agglomération coûte 30 × (45 − 12) = 990 € par semaine pour 90 × 3 = 270 € gagnés sur le tarif proposé. Le volume garanti crée un coût fixe qui n'existait pas, et le contrat ne protège pas des retards.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Les grues ont coûté 27 000 € en 2022 : rendre les porteurs, ce serait jeter cet argent, et la remise de 8 % est intéressante.",
      ceQuiLeDejoue:
        "La comptabilité confirme que les 27 000 € sont dépensés quoi qu'on décide : c'est un coût irrécupérable. À l'échéance, la location devient évitable et une livraison lointaine faite en interne coûte 83,7 € d'évitable contre 57 à 66 € chez le transporteur selon le contrat ; si les tournées sont déjà confiées, renouveler revient à payer 1 380 € par semaine pour des porteurs au garage.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Les chauffeurs sont déjà payés : les faire travailler le samedi semble ne rien coûter de plus.",
      ceQuiLeDejoue:
        "Ce que coûte une livraison de plus, ce sont les heures majorées (40 € en semaine, 55 € le samedi), le carburant et la fatigue : les retards de l'agglomération passent de 3 % à 8 %, à 80 € pièce. Le salaire de base, lui, n'est pas un coût de la décision.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le coût complet d'une livraison d'agglomération monte alors que le prix du transporteur ne bouge pas : l'écart semble enfin justifier de confier.",
      ceQuiLeDejoue:
        "Le coût évitable est resté à 12 € : seuls les 3 270 € hebdomadaires de frais communs se répartissent sur moins de livraisons (52,3 € quand ils se partagent entre 300 livraisons, 57 € quand l'agglomération les porte seule). Confier l'agglomération fait perdre de 33 à 42 € par livraison selon le contrat, 38 € sous l'engagement de service, soit près de 8 000 € par semaine.",
    },
  ],
  debrief: [
    "En semaine 1, quelles lignes des 19 500 € avez-vous rangées dans les coûts évitables ? Pourquoi les salaires des six CDI n'y sont-ils pas ce trimestre, et qu'est-ce qui les y ferait entrer ?",
    "Ceux qui ont tout confié et ceux qui n'ont confié que les tournées lointaines lisaient le même coût complet : quel chiffre les sépare, par livraison et par semaine ?",
    "En semaine 4, rien n'avait changé dans les porteurs loués, et pourtant la décision n'était plus la même qu'en semaine 1 : qu'est-ce qui avait changé ? Les 27 000 € de grues devaient-ils peser ?",
    "En semaine 8, le coût complet de l'agglomération a monté : qu'est-ce qui coûtait plus cher dans une livraison ? Qu'aurait-il fallu répondre au directeur ?",
    "Sous notre aléa, la mise en demeure a payé : Ventajol s'est redressé en semaine 12 et Sirand n'a pas appliqué sa pénalité de 6 000 € ; confier la moitié des tournées lointaines, dont Sirand, à un second transporteur aurait fait environ 3,7 k€ de moins. Sur trente tirages, ce second transporteur bat pourtant la mise en demeure 11 fois et ne perd que 1,3 k€ en moyenne. La mise en demeure était-elle la meilleure décision, ou un bon tirage ? Qu'apporte le second transporteur dans les mauvais trimestres ?",
    "Votre résultat est-il dû à vos décisions ou aux aléas ? Comparez-le à la moyenne de votre chemin sur trente tirages : la méthode des coûts évitables finit en moyenne 13,7 k€ sous le budget, celle du coût complet 85 k€ au-delà, et le coût complet ne la bat sur aucun des trente tirages.",
    "Si la direction autorisait des départs l'an prochain, ou si le bail du garage arrivait à échéance, quelle conclusion de l'épisode changerait ? Qu'est-ce que cela dit de l'horizon d'une décision ?",
  ],
  prolongement: {
    enonce:
      "Une menuiserie laque elle-même 400 pièces par mois. Données mensuelles : peinture et consommables, 3 600 € ; énergie de la cabine, 1 000 € ; un opérateur intérimaire, 2 400 € (mission résiliable sous quinze jours) ; un opérateur en CDI, 2 800 € (aucun licenciement envisagé ; il part en retraite dans douze mois et ne serait pas remplacé si le laquage était confié) ; amortissement de la cabine achetée, 2 000 € ; location d'un compresseur, 600 €, ferme encore trois mois ; quote-part des frais généraux, 2 800 €. Un sous-traitant propose 25 € la pièce. 1. Calculez le coût complet d'une pièce et l'économie mensuelle que la direction annoncera. 2. Calculez le coût évitable d'une pièce pour les trois prochains mois, du quatrième au douzième mois, puis après le départ en retraite. 3. Que recommandez-vous, et à quel horizon ? 4. Quel rôle joue l'amortissement de la cabine dans la décision ?",
    corrige:
      "1. Coût complet : 3 600 + 1 000 + 2 400 + 2 800 + 2 000 + 600 + 2 800 = 15 200 €, soit 38 € la pièce ; économie annoncée : (38 − 25) × 400 = 5 200 € par mois. 2. Pour les trois prochains mois, seuls disparaissent la peinture, l'énergie et l'intérimaire : 3 600 + 1 000 + 2 400 = 7 000 €, soit 17,5 € la pièce. Du quatrième au douzième mois, la location devient évitable : 7 600 €, soit 19 €. Après le départ en retraite, le salaire du CDI aussi : 10 400 €, soit 26 €. 3. Sous-traiter coûte 7,5 € de plus par pièce pendant trois mois (3 000 € par mois), puis 6 € (2 400 € par mois) jusqu'au départ en retraite ; ensuite, il fait gagner 1 € par pièce, 400 € par mois. On garde le laquage pendant un an et on prépare l'externalisation pour le départ en retraite, en négociant le prix dès maintenant. 4. Aucun : la cabine est achetée, son amortissement reste quoi qu'on décide (coût irrécupérable), comme la quote-part des frais généraux. Seule une revente de la cabine, par le prix de cession encaissé, changerait le calcul.",
  },
  evaluation: [
    "Le coût évitable est calculé ligne par ligne, et chaque ligne est classée en citant le contrat, le préavis ou l'échéance qui la rend évitable ou non.",
    "Les coûts irrécupérables (aménagements payés à la signature, amortissement des matériels achetés) sont nommés et écartés explicitement de la comparaison.",
    "L'horizon est explicite : l'élève date le moment où chaque coût devient évitable et refait la comparaison à cette date.",
    "Les décisions sont justifiées par leur moyenne sur les trente tirages, et l'élève distingue une bonne décision d'un résultat favorable sous un aléa donné.",
    "Le risque de dépendance au prestataire est chiffré (pénalité de 6 000 € au-delà de 15 % de retards chez Sirand) et mis en regard du coût de la protection.",
  ],
  vigilance:
    "L'épisode juge à l'horizon d'un trimestre, sans licenciement possible : les salaires des CDI, le bail du garage et l'amortissement des porteurs achetés y sont traités comme inévitables, et la revente des porteurs (au tiers de leur valeur comptable) n'est pas modélisée. À un horizon plus long, une partie de ces coûts deviendrait évitable et la conclusion « garder l'agglomération » serait à refaire ; il est utile de le dire en synthèse.",
};
