/**
 * FICHE ENSEIGNANT · ÉPISODE 62, LES APPRENTIS QUI DÉCROCHENT.
 *
 * Former un apprenti plutôt que s'en servir comme d'un bras de plus : le
 * tutorat, le parcours par étapes et le calendrier du CFA coûtent peu, une
 * rupture coûte cher.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "apprentis-qui-decrochent",
  formations: ["bts-mhr"],
  programme: [
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Un apprenti coûte trois à quatre fois moins cher qu'un extra à l'heure : le réflexe est de s'en servir comme d'une main-d'œuvre d'appoint, seul au rang dès la première semaine, retenu au restaurant les semaines de cours, remplacé par deux autres quand il décroche. L'erreur classique est de comparer le coût d'une heure d'apprenti à celui d'une heure d'extra, sans compter ce que coûte une rupture. Dans l'épisode, Garance Royet dirige la salle de La Table d'Augustin d'Aix-les-Bains : huit personnes, dont cinq apprentis, et deux contrats rompus l'an dernier, dont celui de Jocelin Perrache, mis seul au rang dès son deuxième samedi. Une rupture, c'est six semaines d'extra à 720 € à la place d'un apprenti à 210 €, plus 1 400 € de recrutement et de démarches : 4,46 k€. Le tutorat de deux chefs de rang, trois heures par semaine chacun, en coûte 160 €. L'élève découvre que le tutorat et un parcours en trois étapes (commis, rang à deux, rang seul) font l'apprenti, que le temps du CFA est du temps de travail qu'il faut planifier, et qu'un apprenti qui décroche a souvent une raison concrète qu'un entretien permet de traiter.",
  objectifs: [
    "Je calcule le coût complet d'une rupture de contrat d'apprentissage pour l'entreprise.",
    "Je compare ce coût à celui du tutorat, et j'en tire une décision d'organisation.",
    "Je bâtis un planning qui tient compte du calendrier de l'école, et je chiffre les renforts qu'il demande.",
    "Je cherche la cause concrète d'un décrochage avant de sanctionner ou de remplacer.",
  ],
  prerequis:
    "Les grandes lignes du contrat d'apprentissage (alternance entre l'entreprise et le CFA, maître d'apprentissage) et la notion de coût de la main-d'œuvre doivent être connues. Le parcours d'intégration par étapes peut être découvert pendant la séance.",
  dureeMinutes: 90,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/apprentis-qui-decrochent?hasard=12 : toute la classe joue la même rentrée, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du coût d'une rupture pour le restaurant.",
    },
    {
      minutes: 30,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la prévision de la semaine 1, l'organisation de la rentrée (tutorat ou rang dès le week-end) et la réponse à Théo Garrigues en semaine 8 sur les deux contrats de plus.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et refaites le calcul de Kadiatou Sidibé : six semaines d'extra à 6 services de 120 €, moins les 210 € qu'aurait coûté l'apprenti, plus 1 400 € de frais. Vous faites expliquer les valeurs éloignées de 4,46 k€ (5,72, 3,06 ou 5,18), puis vous rapprochez ce chiffre des 160 € par semaine de tutorat.",
    },
    {
      minutes: 15,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 2 (le planning et le CFA), de la semaine 4 (qui tient le rang de Zénobie) et de la semaine 6 (Sanaa). Pour la semaine 2, vous faites relire ce que le contrat impose : le temps au CFA est du temps de travail. Pour Sanaa, la source de l'entretien : le dernier car part à 22 h 10, elle finit vers 23 heures.",
    },
    {
      minutes: 10,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 12, « Former avant de faire servir » fait 118,2 k€ de contribution de la salle, sans aucune rupture ; « Des bras pour la salle » 86,5 k€, avec près de 20 k€ de ruptures ; ne rien changer 103,8 k€. Vous montrez ensuite la demande de décalage au CFA : sous ce tirage, le CFA refuse, et ceux qui l'ont tentée perdent 5,7 k€ ; sur les trente tirages, elle ne coûte que 1,3 k€ en moyenne et fait même mieux 11 fois. Le jugement ne se lit pas sur un seul tirage.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : un apprenti se forme avant de servir, et une rupture coûte plus que le temps qu'on croyait gagner. Vous la déclinez en trois gestes : un tuteur qui a du temps, un parcours écrit par étapes, un planning bâti sur le calendrier du CFA.",
    },
  ],
  calcul: {
    reponse: 4.46,
    etapes: [
      "Source « Relire le dossier des deux ruptures de l'an dernier » : après le départ de Jocelin, il a fallu six semaines pour trouver et faire signer un nouvel apprenti ; un extra a tenu son rang, six services par semaine à 120 € le service, soit 6 × 120 = 720 € par semaine.",
      "Pendant ces six semaines, on ne paie plus l'apprenti parti : 210 € par semaine en moyenne, charges et repas compris. Le surcoût est de 720 − 210 = 510 € par semaine, soit 6 × 510 = 3 060 €.",
      "S'y ajoutent les frais du remplacement (recrutement, démarches auprès du CFA et de l'opérateur de compétences, doublure du remplaçant) : 1 400 €.",
      "Coût d'une rupture pour le restaurant : 3 060 + 1 400 = 4 460 €, soit 4,46 k€. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 0,3 k€ près.",
    ],
    erreurs: [
      {
        valeur: 5.72,
        cause:
          "Le salaire de l'apprenti qu'on ne paie plus n'est pas déduit : 6 × 720 + 1 400 = 5 720 €.",
      },
      {
        valeur: 3.06,
        cause:
          "Les frais du remplacement sont oubliés : seul le surcoût de l'extra est compté, 6 × 510 = 3 060 €.",
      },
      {
        valeur: 5.18,
        cause:
          "L'extra est compté au prix du dernier moment de fin septembre, 140 € le service : 6 × (840 − 210) + 1 400 = 5 180 €. Le dossier de l'an dernier donne 120 €.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Samedi soir, 140 couverts sont réservés avec la terrasse : mettre Nolhan et Iliana au rang tout de suite ne coûte rien et donne deux rangs de plus.",
      ceQuiLeDejoue:
        "Le dossier des ruptures : Jocelin Perrache, mis seul au rang dès son deuxième samedi, a rompu en semaine 7, pendant ses 45 premiers jours. Léocadie Faustin, à Annecy : un tuteur avec trois heures par semaine et personne seul au rang avant ses semaines de commis, une rupture en deux ans pour onze apprentis. Rejoué sur les trente tirages à la place du tutorat, ce choix perd 11,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "La semaine 8, c'est la Toussaint, et les cinq apprentis seront au CFA : les garder au restaurant évite le sous-effectif, ils rattraperont les cours.",
      ceQuiLeDejoue:
        "La source sur le contrat le dit : le temps passé au CFA est du temps de travail, l'employeur doit laisser l'apprenti suivre ses cours, et le CFA signale les absences. Eugénie Mathon est partie l'an dernier après un conflit de ce genre. Croiser le calendrier et les réservations chiffrait la solution : quatre semaines d'extra, 2 880 €. Rejoué sur les trente tirages à la place de ce planning, garder les apprentis perd 3,1 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Confier le rang de Zénobie à Nolhan et Iliana ne coûte rien, et c'est en servant qu'on apprend.",
      ceQuiLeDejoue:
        "Le rang de Zénobie, c'est six tables, la terrasse et le fond de salle, un samedi de fin septembre encore plein. Lisandro savait qui pouvait le tenir : Bintou, BTS deuxième année, qui passe plus de huit fois sur dix quand un tuteur l'y a préparée, avec Nolhan en commis à côté d'elle. Rejoué sur les trente tirages à la place de Bintou, ce choix perd 3,2 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Théo Garrigues le propose : si Sanaa veut partir, qu'elle parte, et deux apprentis à sa place feront des bras pour la Toussaint.",
      ceQuiLeDejoue:
        "La demi-heure avec Sanaa trouvait la cause : le dernier car part à 22 h 10, elle finit vers 23 heures, et elle passe une soirée sur deux au débarrassage. Sa formatrice confirme qu'elle a du métier, et qu'un entretien à trois avec un parcours écrit règle souvent la question. La rupture coûte 2 100 € de recrutement et deux recrues sans tuteur disponible. Rejouée sur les trente tirages à la place de l'entretien, elle perd 5,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Avec l'aide à l'embauche, deux contrats de plus ne coûtent presque rien, et ce sont deux paires de bras pour les samedis.",
      ceQuiLeDejoue:
        "La source sur les tuteurs : un maître d'apprentissage accueille deux apprentis au plus, et les heures de tutorat se partageraient entre davantage d'apprentis. En novembre, la salle attend un quart de couverts de moins qu'en septembre, et une recrue met deux mois au moins avant de tenir un rang seule. Rejoué sur les trente tirages à la place de « n'en signer aucun », ce choix perd 4,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Les repas de groupe sont l'occasion de montrer ce qu'ils ont appris : une table de dix chacun, sans extra, c'est pour ça qu'on les forme.",
      ceQuiLeDejoue:
        "La source sur ce que chaque apprenti sait faire seul : une tablée de cinquante se sert plat par plat, et même un apprenti autonome a besoin d'un confirmé à côté de lui. Une soirée ratée coûte une remise de 20 %, 520 € sur 2 600 €, quand un extra pour la soirée coûte 150 €. Rejoué sur les trente tirages à la place des binômes, ce choix perd 1,7 k€ en moyenne et ne fait mieux que 3 fois.",
    },
  ],
  debrief: [
    "En semaine 1, qui a vu un problème de motivation des jeunes, qui un problème de formation ? Qu'est-ce que le service du samedi soir montrait de Lisandro, tuteur en titre des cinq ?",
    "Une rupture coûte 4,46 k€, le tutorat de deux chefs de rang 160 € par semaine. Combien de semaines de tutorat paie une seule rupture évitée ?",
    "Garder les apprentis au restaurant pendant la Toussaint semblait régler le sous-effectif. Qu'est-ce qui rendait ce choix impossible, et qu'est-ce qu'il coûtait de le faire quand même ?",
    "Sanaa arrivait en retard et dormait en classe. Qu'aurait changé un avertissement écrit à son car de 22 h 10 ?",
    "Sous le tirage 12, ceux qui ont demandé au CFA de décaler une session ont essuyé un refus et perdent 5,7 k€. Sur les trente tirages, ils ne perdent que 1,3 k€ en moyenne et font mieux 11 fois. Était-ce une mauvaise décision ?",
    "Sous le tirage 12, « Des bras pour la salle » finit 31,7 k€ sous « Former avant de faire servir », et même sous ne rien changer. D'où vient l'essentiel de l'écart ?",
    "Quelle règle gardez-vous pour accueillir un apprenti ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Une brasserie emploie quatre apprentis en salle. Quand un contrat est rompu, il faut huit semaines pour en retrouver un ; un extra tient le rang cinq services par semaine à 110 € le service. Un apprenti coûte en moyenne 180 € par semaine, et les frais d'un remplacement sont de 1 200 €. 1) Calculez le coût d'une rupture pour la brasserie. 2) Sans tutorat, chaque apprenti a 20 % de risque de rompre sur le trimestre ; avec deux tuteurs à trois heures par semaine chacun, payées 25 € l'heure, ce risque tombe à 5 %. Combien de ruptures attend-on sur le trimestre de treize semaines, dans chaque cas ? 3) Le tutorat se paie-t-il sur le seul coût des ruptures ?",
    corrige:
      "1) Un extra coûte 5 × 110 = 550 € par semaine ; le surcoût est de 550 − 180 = 370 € par semaine, soit 8 × 370 = 2 960 €, plus 1 200 € de frais : 4 160 €. 2) Sans tutorat, 4 × 0,20 = 0,8 rupture ; avec, 4 × 0,05 = 0,2 rupture. 3) Le tutorat évite 0,6 rupture, soit 0,6 × 4 160 = 2 496 € ; il coûte 2 × 3 × 25 × 13 = 1 950 €. Il rapporte 546 € de plus qu'il ne coûte sur le seul coût des ruptures, sans compter les apprentis qui tiennent un rang plus tôt.",
  },
  evaluation: [
    "Le coût d'une rupture est calculé juste (six semaines d'extra moins le coût de l'apprenti, plus les frais), à partir de la source nommée.",
    "Le choix de l'organisation de la rentrée compare le coût du tutorat à celui des ruptures qu'il évite.",
    "Le planning tient compte du calendrier du CFA, et les renforts sont chiffrés.",
    "La réponse au décrochage de Sanaa s'appuie sur sa cause concrète, recueillie dans un entretien.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 12.",
  ],
  vigilance:
    "À relire avec le droit en vigueur : la rupture libre pendant les 45 premiers jours de formation pratique en entreprise, le nombre d'apprentis par maître d'apprentissage (l'épisode dit deux au plus), le montant de l'aide à l'embauche (2 000 € par an dans l'épisode, pour un groupe de plus de 250 salariés), et les horaires des apprentis mineurs le soir (Nolhan a 16 ans) dans la restauration.",
};
