/**
 * FICHE ENSEIGNANT · ÉPISODE 7, LE BUDGET QUI NE TIENT PAS.
 *
 * Lire un budget en engagé et en réalisé, pas seulement en facturé, avant de
 * couper : les 10 % partout et le gel coupent ce qui évite les pannes, et
 * laissent passer les commandes déjà signées.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "budget-qui-ne-tient-pas",
  formations: ["bts-cg", "bts-gpme", "stmg"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "BTS GPME · Bloc 4, Soutenir le fonctionnement et le développement de la PME",
    "STMG · Terminale gestion et finance, Thème 3, Accompagner la prise de décision",
  ],
  notion:
    "Une facture arrive des semaines après la dépense : un budget se suit en additionnant le facturé, ce qui est déjà consommé sans facture, et ce qui est signé sans être réalisé. L'erreur classique, devant une projection qui dépasse, consiste à couper partout d'un même pourcentage ou à tout geler, ce qui frappe d'abord l'entretien qui évite les pannes ; l'autre consiste à présenter le chiffre rassurant de l'outil et à « rattraper d'ici la clôture ». Dans l'épisode, Samuel Ortega tient le budget de fonctionnement des sites lyonnais d'Arvel Distribution (244,5 k€ pour le trimestre). Le rapprochement de l'engagé et du facturé trouve 40 k€ de bons de commande signés et sans facture (relamping LED 24 k€, marquage au sol 9 k€, auvent 7 k€) que l'outil ne voit pas : le vrai dépassement approche 45 k€. Le mainteneur rappelle que les pannes ont doublé la dernière fois qu'on a espacé les visites, et qu'une heure de quai à l'arrêt coûte 180 €, 260 € en saison. L'élève découvre que l'énergie dérive parce qu'une programmation horaire s'est perdue, que le prestataire facture une indexation que son contrat plafonne, et que décaler une facture ne change pas le résultat d'un trimestre.",
  objectifs: [
    "Je distingue le facturé, le réalisé et l'engagé, et je calcule une dépense réalisée à date, factures non parvenues comprises.",
    "Je reprévois un budget à partir des engagements, et je l'annonce tôt avec des arbitrages chiffrés.",
    "Je cherche la cause d'une dérive (une programmation horaire perdue, une indexation hors contrat) avant de couper une dépense.",
    "Je protège les dépenses qui évitent des coûts plus lourds, comme l'entretien préventif, en chiffrant ce que coûte une panne.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de budget, d'écart, de charge et de facture doivent être connues ; la lecture d'un bon de commande et d'un contrat simple suffit. L'engagé, les factures non parvenues et la reprévision peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/budget-qui-ne-tient-pas?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, les dépenses réalisées des semaines 1 à 3, facturées ou non, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la réponse de la semaine 1 (10 %, gel, analyse ou attente) et ce qui est présenté au comité en semaine 3. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 9, celle des chariots.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous faites la différence entre ce que le tableau de bord montre en semaine 3 (4,9 k€ facturés) et ce qui a été dépensé : les postes courants semaine par semaine, l'auvent du quai 3 posé, et les pannes de chariot. Vous comparez au modèle : 63,8 k€ sous le tirage de la classe. Vous faites expliquer les valeurs éloignées : 4,9 k€, 49,5 k€, 89,5 k€.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 (le chiffre présenté au comité) et de la semaine 7 (Tessier). Pour les 10 % partout, vous faites calculer au tableau ce que rapportent environ 1 000 € d'économies par semaine, et ce que coûtent des pannes doublées à 3 000 € et six à sept heures de quai chacune. Pour Tessier, vous faites relire le contrat : 2 % de révision plafonnée, 7,4 % appliqués.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Analyser, protéger, reprévoir tôt » finit 9,3 k€ sous le budget, l'attentiste 41,9 k€ au-dessus, et « Couper partout, geler » 86 k€ au-dessus. Vous montrez ensuite la décision où ce tirage a été clément : en saison, les chariots ont peu cassé, et ceux qui n'ont pas fait réviser le parc ont fait un peu mieux que les autres. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : additionner facturé, réalisé non facturé et engagé avant de juger un budget ; chercher la cause d'une dérive avant de couper ; garder ce qui évite des pannes ; annoncer un dépassement quand on le voit. Vous ajoutez que décaler une facture ne change pas le résultat. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 63.8,
    etapes: [
      "Le mandat donne 244,5 k€ pour le trimestre, dont 30 k€ de petits travaux : le fonctionnement courant est budgété à (244,5 − 30) / 13 = 16,5 k€ par semaine (énergie 7 k€, prestataire 3 k€, préventif 2,5 k€, réparations 2,5 k€, fournitures 1,5 k€).",
      "Ce qui se consomme réellement chaque semaine : l'énergie dérive d'environ 15 % (les compteurs montrent 70 % de la puissance de jour la nuit), soit 8 k€ ; Tessier facture environ 3,9 k€ (indexation à 7,4 % et régie) ; le préventif 2,5 k€ ; fournitures et petites demandes un peu moins de 2 k€. Environ 16 k€ par semaine hors pannes, soit un peu plus de 48 k€ en trois semaines.",
      "S'y ajoutent ce que les sources signalent : l'auvent du quai 3, 7 k€ de bon de commande signé, posé en semaine 3 et facturé en semaine 4, et les pannes de chariot, à 3 000 € de réparation en moyenne (une demi-panne par semaine hors saison dans le modèle).",
      "Sous le tirage n° 12, trois pannes tombent dans les trois premières semaines, pour environ 8,5 k€. Le modèle donne 16,5 + 19,9 + 27,4 = 63,8 k€ (63,78) de dépenses réalisées, quand le tableau de bord n'en montre que 4,9 k€ facturés.",
      "Le chiffre dépend du hasard (de 54,6 à 71,8 k€ selon les trente tirages, 60,6 k€ en moyenne) et un peu des décisions : 62 k€ avec les 10 % partout, 64,4 k€ en attendant. L'épisode juge juste à 4 k€ près, proche à 10.",
    ],
    erreurs: [
      {
        valeur: 4.9,
        cause:
          "Le facturé à date pris pour la dépense : en semaine 3, seules les fournitures et quelques petites demandes sont facturées ; l'énergie, le prestataire et l'entretien le seront au mois.",
      },
      {
        valeur: 49.5,
        cause:
          "Le budget hebdomadaire de 16,5 k€ multiplié par trois : l'auvent signé et posé, la dérive de l'énergie et les pannes sont oubliés.",
      },
      {
        valeur: 89.5,
        cause:
          "Les 40 k€ d'engagements comptés comme dépensés en trois semaines (49,5 + 40) : le relamping est posé en semaine 5 et le marquage en semaine 7. Un engagement n'est une dépense réalisée qu'une fois la prestation faite.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Valérie Kessler le propose : 10 % partout, « tout le monde fait un effort, personne n'est lésé », et environ 1 000 € d'économies visibles par semaine.",
      ceQuiLeDejoue:
        "Le rapprochement de l'engagé et du facturé montre que le problème est ailleurs : 40 k€ signés sans facture, un dépassement réel proche de 45 k€. Les 10 % espacent les visites d'entretien, et Olivier Brun le rappelle : la dernière fois, les pannes ont doublé cinq semaines plus tard, à 3 000 € et six à sept heures de quai chacune. Margaux conseillait : « regarde ce qui est déjà signé ». Rejoués sur les trente tirages à la place de l'analyse, les 10 % perdent 32,1 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Geler toute dépense non contractuelle, c'est le plus sûr : plus rien ne sort sans signature, et le budget tient.",
      ceQuiLeDejoue:
        "Le gel ne touche pas les 40 k€ déjà engagés, qui sont le cœur du dépassement, et arrête les réparations : Aurélie Cosson attend trois jours pour un tube grillé, et Margaux raconte la dernière clôture où un gel total a bloqué deux quais quatre jours faute de bon de commande. Une heure de quai à l'arrêt coûte 180 €. Rejoué sur les trente tirages à la place de l'analyse, le gel perd 32,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "La facture d'énergie dépasse le budget : baisser de trois degrés les consignes de tous les sites ne coûte rien et se décide lundi.",
      ceQuiLeDejoue:
        "La courbe de charge montre la cause : la nuit et le week-end, le dépôt consomme 70 % de sa puissance de jour, contre 25 % l'hiver dernier, parce que la gestion technique a perdu sa programmation horaire à la coupure de décembre. Un technicien la reprogramme en une demi-journée pour 1 200 € ; le prix du kilowattheure, lui, n'a pas bougé. Baisser les consignes fait ressortir les chauffages d'appoint et ne touche pas aux nuits. Rejouée sur les trente tirages à la place de la reprogrammation, elle perd 4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Le budget est serré : ne réparer que ce qui arrête un chariot fait baisser tout de suite la facture de réparations.",
      ceQuiLeDejoue:
        "La saison démarre avec trente pour cent de commandes en plus, et une heure de quai à l'arrêt y coûte 260 €. L'historique du parc montre que les quatre chariots de plus de huit ans font six pannes sur dix, et le mainteneur estime qu'une révision à 2 500 € diviserait par deux le risque de panne en saison ; Kévin prévient qu'« un vérin qui fuit, ça finit toujours par casser ». Rejoué sur les trente tirages à la place de la révision, le report perd 4,1 k€ en moyenne et fait mieux 8 fois sur 30.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Deux semaines avant la clôture, tout geler, entretien compris, est le dernier moyen de rapprocher le trimestre du budget.",
      ceQuiLeDejoue:
        "La liste des commandes signées non démarrées trouve 4 200 € à reporter sans risque (stores, peinture, signalétique) ; suspendre les visites préventives en pleine saison expose aux pannes et aux heures de quai à 260 €. Patrick rappelle que tout ce qui est réalisé avant la clôture passe en charges, facturé ou non. Rejoué sur les trente tirages à la place de l'arrêt ciblé, le gel total perd 3,6 k€ en moyenne et fait mieux 12 fois sur 30.",
    },
  ],
  debrief: [
    "En semaine 1, l'outil de la direction financière annonçait un dépassement. Qu'est-ce que le rapprochement de l'engagé et du facturé ajoutait ? Pourquoi l'outil ne voyait-il pas les 40 k€ ?",
    "En semaine 3, le tableau de bord montrait 4,9 k€ facturés pour environ 64 k€ dépensés. Quelle question faut-il poser à un chiffre de dépenses avant de le présenter au comité ?",
    "Annoncer en semaine 3 un dépassement plus mauvais que l'outil, ou présenter le chiffre officiel : que gagne-t-on à annoncer tôt ? Qu'a permis le dossier du relamping, déjà prêt grâce au rapprochement ?",
    "Tessier applique 7,4 % de révision quand son contrat plafonne à 2 %, et facture de la régie sans bon signé. Pourquoi contester contrat en main vaut-il mieux qu'une remise globale de 5 % ?",
    "Sous le tirage n° 12, les chariots ont peu cassé en saison : ceux qui ont réparé au fil des pannes ou loué des chariots de secours font un peu mieux que ceux qui ont fait réviser le parc. Sur les trente tirages, la révision reste la meilleure en moyenne. Le choix de la révision était-il mauvais ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Gilles Perrin demande de faire facturer en avril ce qui peut l'être. Que change une facture décalée au résultat du trimestre ? Que dit Patrick des factures non parvenues ?",
    "Quelle règle gardez-vous avant de couper dans un budget ? Formulez-la en une phrase, avec un mot de la comptabilité dedans.",
  ],
  prolongement: {
    enonce:
      "Un service a un budget de 130 000 € pour un trimestre de 13 semaines, dépensé à un rythme régulier. À la fin de la semaine 6 : 38 000 € ont été facturés ; des travaux de 9 000 € ont été réalisés en semaine 5, et leur facture arrivera en semaine 8 ; l'énergie des semaines 5 et 6 (7 500 € par semaine) n'est pas encore facturée ; une commande de 12 000 € est signée, pour une pose en semaine 10. 1) Quel est le budget à date ? 2) Quelles sont les dépenses réalisées à date, et l'écart au budget à date ? 3) Quel est le montant total engagé (réalisé et signé) ? 4) Le fournisseur de la commande de 12 000 € propose de facturer après la clôture du trimestre. Qu'est-ce que cela change au résultat du trimestre ?",
    corrige:
      "1) 130 000 × 6 / 13 = 60 000 €. 2) 38 000 + 9 000 + 2 × 7 500 = 62 000 € réalisés, soit 2 000 € au-dessus du budget à date, quand le facturé seul (38 000 €) faisait croire à 22 000 € de marge. 3) 62 000 + 12 000 = 74 000 € engagés. 4) Rien : la pose est faite en semaine 10, la dépense est réalisée pendant le trimestre et doit être comptée en charge, facture non parvenue. Décaler la facture la cache, elle ne l'efface pas.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur le rapprochement de l'engagé et du facturé et sur l'historique des pannes, et l'élève dit pourquoi le coût au mètre carré n'apprend rien.",
    "La prévision des dépenses réalisées des semaines 1 à 3 est construite par un calcul écrit (rythme courant, auvent posé, pannes), et l'écart avec 63,8 k€ est expliqué.",
    "Chaque économie retenue est justifiée par une cause trouvée dans les sources (programmation horaire, indexation hors contrat, commandes non urgentes), et l'entretien préventif est protégé par un calcul du coût des pannes.",
    "La reprévision présentée au comité compte les engagements, et l'élève explique pourquoi décaler une facture ne change pas le résultat.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le passage du relamping LED en investissement « au-delà de 15 k€ » est une règle interne de l'épisode : en comptabilité, le classement d'une dépense en immobilisation dépend de sa nature (un bien durable, une amélioration au-delà de l'entretien) et des seuils que l'entreprise s'est donnés, à vérifier par un professeur de comptabilité. Le principe des factures non parvenues (charges à payer rattachées à l'exercice) est exact ; la révision de prix plafonnée à 2 % est celle du contrat de l'épisode.",
};
