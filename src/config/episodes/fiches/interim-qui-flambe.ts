/**
 * FICHE ENSEIGNANT · ÉPISODE 86, L'INTÉRIM QUI FLAMBE.
 *
 * Le coût du remplacement des soignants : l'intérim est un symptôme, qui se
 * traite motif par motif (postes vacants, absences imprévues, congés). Le
 * piège est de plafonner la dépense par une note, ou d'en négocier le tarif,
 * sans toucher à ce qui la fait naître.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "interim-qui-flambe",
  formations: ["bts-gpme", "but-gea", "dcg"],
  programme: [
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BUT GEA · Gérer l'administration du personnel",
    "DCG · UE 11, Contrôle de gestion",
  ],
  notion:
    "Une facture d'intérim se lit par ses motifs, pas par son montant : un poste vacant tenu en intérim depuis des mois, une absence imprévue un samedi matin et un congé d'été planifié à quinze jours ne se traitent pas de la même façon. L'erreur classique consiste à plafonner la dépense par une note du siège, ou à négocier le tarif de l'agence contre l'exclusivité, puis contre un volume minimal. Dans l'épisode, Cassien Calvayrac, DRH de l'Association Solvanne, reçoit une facture de 1,9 M€ de Soralis Intérim Santé, 60 % de plus que l'année d'avant, concentrée sur les infirmiers et les week-ends de trois EHPAD ; le CPOM limite le surcoût de remplacement à 1 040 k€ sur l'année. L'analyse des recours montre que plus de la moitié des postes d'infirmier commandés tiennent quatre postes vacants, que les absences imprévues n'ont aucun remplaçant interne, et que quatre congés sur cinq partent à l'agence faute de plannings publiés assez tôt. Un infirmier en intérim coûte 60 € de l'heure contre 30 € salarié : un poste tenu toute l'année en intérim coûte 48,21 k€ de plus. L'élève découvre que l'on traite chaque motif par son remède (des CDI proposés aux remplaçants réguliers, un pool dimensionné sur le socle des absences, des plannings publiés huit semaines avant, des congés d'été arrêtés en mars), et qu'un plafond qui laisse des postes vides en pleine épidémie coûte plus cher que l'intérim qu'il évite.",
  objectifs: [
    "Je calcule le surcoût annuel d'un poste tenu en intérim plutôt que par un salarié, à partir des taux horaires et de la durée annuelle du travail.",
    "Je décompose une dépense d'intérim par motif de recours, et j'associe à chaque motif le remède qui lui correspond.",
    "Je calcule le seuil à partir duquel un pool de remplacement salarié coûte moins cher que l'intérim qu'il évite.",
    "J'évalue un contrat avec volume minimal en projetant le volume réel, et je chiffre le dédit.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné, en tenant compte du risque pour les résidents.",
  ],
  prerequis:
    "Les notions de coût horaire chargé, de durée annuelle du travail, de CDI, de CDD et d'heures supplémentaires doivent être connues ; la comparaison d'une charge fixe et d'une charge variable suffit pour le pool. Le CPOM et l'ERRD peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/interim-qui-flambe?hasard=24 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous montrez la facture (1,9 M€, 60 % de plus) et la demande de la directrice générale (une note qui plafonne l'intérim), et vous demandez de noter sur papier le surcoût annuel calculé en semaine 1, avec son calcul, et la proposition faite vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la proposition de la semaine 1 (note, remise, bourse et plannings, attente), la taille du pool en semaine 2 et les consignes pour le pic de grippe en semaine 6, où la classe se partage le plus. Un binôme qui a fini tôt calcule le seuil de rentabilité d'un infirmier du pool.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous refaites le calcul avec la classe à partir de deux sources : le contrat de Soralis (60 € l'heure d'infirmier) et la paie (30 € l'heure, 1 607 heures par an). Vous faites expliquer les valeurs éloignées (96,42 k€, 54,6 k€ ou 18,72 k€). Vous terminez par la conséquence : avec quatre postes vacants d'infirmier, c'est près de 193 k€ par an qu'un recrutement réussi fait économiser.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 6 et de la semaine 11. Pour la semaine 1, faites lire la réaction de Sigismond Ravanel au plafond : une aide-soignante qui fait les gestes de l'infirmière manquante, une collègue rappelée sur son repos. Pour la semaine 6, faites lire la source du point avec les établissements : une infirmière pour 90 résidents en pleine épidémie. Pour la semaine 11, faites comparer le volume minimal de 600 k€ à la projection de l'intérim d'avril à décembre, et chiffrer le dédit à 30 centimes par euro non consommé.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 24, « Traiter les causes de l'intérim » finit à 19,8 k€ sous l'enveloppe du CPOM, quand « Attentiste » la dépasse de 640,5 k€ et « Plafonner la dépense et négocier le tarif » de 683,3 k€, avec trois événements indésirables graves. Vous faites lire la semaine 6 : interdire l'intérim pendant le pic fait mieux 16 fois sur 30, de quelques milliers d'euros, mais perd 16,7 k€ en moyenne, parce que les autres fois un poste laissé vide finit en événement indésirable grave. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau le tableau des motifs et de leurs remèdes : poste vacant, un recrutement (et d'abord les remplaçants qui viennent déjà) ; absence imprévue, un pool interne dimensionné sur le socle ; congé, un planning publié tôt. Vous rappelez la règle : on ne plafonne pas un besoin, on le réduit. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 48.21,
    etapes: [
      "Source « Relire le contrat et les factures de Soralis Intérim Santé » : Soralis facture 60 € l'heure d'infirmier, tarif unique, week-ends compris.",
      "Source « Demander à la paie ce que coûte un salarié » : un infirmier salarié coûte 30 € de l'heure, charges comprises, et un temps plein fait 1 607 heures par an.",
      "Surcoût d'une heure tenue en intérim : 60 − 30 = 30 €.",
      "Surcoût annuel d'un poste tenu toute l'année en intérim : 30 × 1 607 = 48 210 €, soit 48,21 k€. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 2 k€ près, proche à 6 k€.",
      "La source « Regarder qui tient les postes vacants » donne le même chiffre en semaine 4. Avec quatre postes vacants d'infirmier, c'est 4 × 48,21 = 192,84 k€ de surcoût par an.",
    ],
    erreurs: [
      {
        valeur: 96.42,
        cause:
          "Le coût total de l'intérim (60 × 1 607 = 96 420 €) au lieu de son surcoût : le salarié aussi coûte 30 € de l'heure.",
      },
      {
        valeur: 54.6,
        cause:
          "La durée annuelle prise à 35 heures × 52 semaines (1 820 heures) : un temps plein fait 1 607 heures, congés et jours fériés déduits.",
      },
      {
        valeur: 18.72,
        cause:
          "Un seul poste de 12 heures par semaine sur 52 semaines ((720 − 360) × 52) : un « poste tenu toute l'année » est un temps plein, pas une garde par semaine.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La directrice générale demande une note signée vendredi, l'ARS a lu l'ERRD : un plafond et un accord du siège, c'est la façon la plus directe de tenir l'enveloppe.",
      ceQuiLeDejoue:
        "L'analyse des recours montre que la note ne touche pas ce qui fait la dépense : les postes vacants restent tenus en intérim, et les absences imprévues tombent pour moitié un samedi ou un dimanche, sans aucun remplaçant interne. Sigismond Ravanel prévient qu'il fermera des postes d'infirmier le week-end en pleine grippe. Médéric Amegavi conseille de regarder pourquoi on appelle l'agence. Rejouée sur les trente tirages à la place de la bourse et des plannings à huit semaines, la note perd 210 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Le tarif de l'agence est la ligne la plus visible de la facture : une remise de 8 % sur 1,9 M€, c'est plus de 150 k€.",
      ceQuiLeDejoue:
        "La comparaison des agences est du bruit : Soralis est dans la moyenne, et la remise ne réduit pas le nombre de postes commandés. Le contrat montre que Soralis ne pourvoit que 81 % des postes au pic de février, et que ce sont les mêmes infirmiers qui tiennent les postes vacants ; l'exclusivité n'y change rien. Sous le tirage de la classe, Soralis n'a d'ailleurs consenti que 5 %. Rejouée sur les trente tirages, la remise contre l'exclusivité perd 86 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Au pic, Soralis ne pourvoit presque plus et facture plein tarif : rappeler les agents sur leurs repos et regrouper les soins évite que la facture explose.",
      ceQuiLeDejoue:
        "Le point avec les établissements le dit : au pic, les absences imprévues pourraient doubler, et un poste d'infirmier laissé vide en pleine épidémie, c'est 90 résidents, dont des malades à surveiller et à faire boire, pour une seule infirmière. Guillemette Bouchardat le raconte : une collègue rappelée qui sortait d'une grippe, une infirmière pour 88 résidents le samedi soir. Rejouée sur les trente tirages à la place du plan gradué, la consigne fait mieux 16 fois de quelques milliers d'euros, mais perd 16,7 k€ en moyenne : les autres fois, un événement indésirable grave coûte de 34 à 80 k€, sans compter ce qu'il coûte au résident.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "10 % sur tous les tarifs et la priorité sur les intérimaires : c'est exactement ce que l'ARS aime lire dans un ERRD, dit Ursule Mauvernay.",
      ceQuiLeDejoue:
        "La projection de l'intérim d'avril à décembre, avec ce qui est en place : pour qui a traité les causes, environ 351 k€ sous le tirage de la classe, bien sous le volume minimal de 600 k€, et chaque euro non consommé coûte 30 centimes. Orchidia Résidences a signé un contrat de ce type, puis monté son propre pool, et payé un dédit l'année suivante. Garder Soralis sans engagement, en dernier recours, avec un suivi mensuel des recours par motif, ne coûte rien. Rejoué sur les trente tirages, le contrat-cadre perd 65 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un tarif trop cher, d'autres des établissements qui appellent trop vite, d'autres des postes vacants. Qu'est-ce que l'analyse des recours par motif permettait de voir que la facture ne montrait pas ?",
    "Un poste tenu en intérim coûte 48,21 k€ de plus par an. Pourquoi proposer un CDI aux remplaçants qui viennent déjà, plutôt que de payer un cabinet ? Que demandaient Haroun Moissenet et les autres réguliers ?",
    "Un infirmier du pool coûte 51 480 € par an, qu'il y ait des absences ou non. À partir de combien de postes évités à l'intérim paie-t-il ? Pourquoi le dimensionner sur le socle des absences, et pas sur le pic de février ?",
    "En semaine 6, interdire l'intérim pendant le pic fait mieux 16 fois sur 30 et perd 16,7 k€ en moyenne. Comment une décision peut-elle gagner plus souvent et rester mauvaise ? Qu'est-ce que le chiffre ne dit pas, pour les résidents et pour les soignants rappelés ?",
    "Limiter les congés d'été à deux semaines est légal. Pourquoi est-ce pourtant une mauvaise idée pour un employeur qui manque de soignants ?",
    "Sous le tirage n° 24, la méthode des causes finit sous l'enveloppe, et le plafond la dépasse de plus de 680 k€. Si l'épidémie avait été faible, le plafond aurait-il été une bonne décision ?",
    "Quelle règle présentez-vous à la directrice générale à la place de la note ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un groupe d'EHPAD paie l'heure d'infirmier intérimaire 62 €, et un infirmier salarié lui coûte 31 € de l'heure, charges comprises, pour 1 607 heures par an. 1) Quel est le surcoût annuel d'un poste d'infirmier tenu toute l'année en intérim ? 2) Le groupe envisage un pool : un infirmier du pool coûte 50 000 € par an, tient 115 postes de 12 heures par an, et chaque poste qu'il prend à l'agence évite 12 heures d'intérim. Combien coûte un poste de 12 heures en intérim ? À partir de combien de postes évités à l'intérim un infirmier du pool est-il rentable, et quelle part de sa capacité cela représente-t-il ? 3) Qu'économise ou que perd le groupe si un infirmier du pool évite 90 postes d'intérim dans l'année ? Et s'il n'en évite que 50 ? 4) L'agence propose 10 % de remise contre un volume minimal de 400 k€, le volume non consommé étant facturé à 30 %. Le groupe prévoit de consommer 300 k€ au tarif actuel. Que coûte l'offre, comparée au tarif actuel sans engagement ?",
    corrige:
      "1) (62 − 31) × 1 607 = 31 × 1 607 = 49 817 € par an. 2) Un poste de 12 heures coûte 12 × 62 = 744 € en intérim ; seuil : 50 000 / 744 ≈ 67,2, soit 68 postes évités, environ 59 % de sa capacité (68 / 115). 3) 90 postes : 90 × 744 = 66 960 € évités, soit 16 960 € économisés ; 50 postes : 37 200 € évités, soit 12 800 € perdus. 4) Avec la remise, les 300 k€ deviennent 270 k€ ; le volume minimal de 400 k€ n'est pas atteint : 400 − 270 = 130 k€ non consommés, facturés à 30 %, soit 39 k€ de dédit. Total : 309 k€, contre 300 k€ sans engagement : l'offre coûte 9 k€ de plus.",
  },
  evaluation: [
    "Le surcoût annuel est calculé juste ((60 − 30) × 1 607 = 48,21 k€), avec les sources nommées, et distingué du coût total de l'intérim.",
    "Les recours sont décomposés par motif (postes vacants, absences imprévues, congés), et chaque mesure proposée vise un motif précis.",
    "Le pool est dimensionné par un calcul de seuil, sur le socle des absences et non sur le pic.",
    "Le contrat-cadre est jugé par la projection du volume réel et le calcul du dédit, pas par le seul taux de remise.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 24, en nommant le risque pour les résidents.",
  ],
  vigilance:
    "Plusieurs règles sont reprises telles que l'épisode les pose et sont à vérifier par un enseignant de droit social : la clause interdisant d'embaucher un intérimaire réputée non écrite, la règle du congé principal (au moins douze jours ouvrables continus entre le 1er mai et le 31 octobre), la majoration de 25 % des heures supplémentaires et le coût d'un CDD (indemnité de fin de contrat et congés payés), qui dépendent aussi de la convention collective. L'épisode ne traite pas l'encadrement légal récent de l'intérim des soignants dans les établissements sociaux et médico-sociaux. Enfin, la scène où une aide-soignante « fait les gestes de l'infirmière » décrit un glissement de tâches contraire aux règles d'exercice des professions de santé : à présenter comme un risque, jamais comme une solution.",
};
