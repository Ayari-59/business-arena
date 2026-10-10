import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 40, LE CLIENT À RISQUE.
 *
 * Le risque de crédit client chiffré en perte attendue, les garanties jugées
 * sur leur coût, la limite d'encours ajustée aux signaux, et le traitement
 * comptable d'une créance sur un client en procédure collective.
 */
export const FICHE: FicheEnseignant = {
  code: "client-a-risque",
  formations: ["dcg", "but-gea", "bts-gpme"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "BUT GEA · Finance d'entreprise",
    "BTS GPME · Gérer les risques de la PME",
  ],
  notion:
    "Une vente à crédit ne vaut que sa marge sur coût variable diminuée de la perte attendue, c'est-à-dire la probabilité de défaut, multipliée par l'exposition, multipliée par la part qu'on ne récupère pas (1 − taux de récupération). L'erreur classique consiste à juger une limite d'encours sur le chiffre d'affaires qu'elle permet, ou, à l'inverse, à couper tout client qui paie en retard sans regarder ce qu'il rapporte. L'épisode met les élèves à la place du responsable du crédit d'un négociant en matériaux : une entreprise générale demande 500 k€ d'encours pour un chantier qui ne laisse que 54 k€ de marge, alors que la perte attendue sur cet encours atteint 42,5 k€. Le piège est que l'accorder en compte ouvert réussit presque toujours, et coûte très cher les rares fois où le client tombe ; une assurance-crédit à 0,4 % du chiffre d'affaires coûte bien moins que la part du risque qu'elle couvre, quand un acompte qui fait fuir la moitié du chantier ou une caution imposée à un artisan sûr coûtent plus qu'ils ne protègent. Le dossier d'un couvreur en redressement judiciaire fait enfin travailler la créance douteuse, sa dépréciation et le moment où la perte devient définitive.",
  objectifs: [
    "Je calcule la perte attendue d'un encours client à partir de la probabilité de défaut, de l'exposition et du taux de récupération.",
    "Je compare la marge d'une vente à crédit à sa perte attendue et au coût de la garantie qui la réduit, avant d'accorder ou de refuser une limite.",
    "J'ajuste une limite d'encours à l'accumulation des signaux de défaut, sans couper un client au premier retard.",
    "Je traite une créance sur un client en procédure collective : déclaration au mandataire, reclassement en créance douteuse, dépréciation du hors-taxe non recouvrable, perte constatée à la clôture de la procédure.",
  ],
  prerequis:
    "La marge sur coût variable, le calcul d'une espérance simple (probabilité × montant) et l'enregistrement des créances clients avec leur TVA collectée doivent être acquis ; les créances douteuses peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/client-a-risque?hasard=15 : toute la classe joue le même trimestre, seul ou en binôme, au niveau Standard. Vous posez la consigne d'Edith en une phrase : dire ce que le chantier rapporte une fois le risque payé. Vous prévenez que la prévision de la semaine 1 sera corrigée au tableau, et qu'il faut noter sa valeur.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les treize semaines et les six décisions. Vous circulez sans donner la formule ; vous relevez seulement, sur une feuille, la réponse de chaque poste à la demande de Corvelle (D1) et à la hausse de la semaine 6 (D4). Signalez à ceux qui hésitent que trois sources de la semaine 1 coûtent une demi-journée au-delà des deux jours sans perte, soit 750 € de marge : c'est un arbitrage, pas une faute.",
    },
    {
      minutes: 15,
      titre: "Corriger la perte attendue",
      detail:
        "Vous relevez au tableau les estimations de la classe et les regroupez : autour de 42,5, autour de 50, autour de 7,5 ou au-delà de 400. Un élève par groupe dit d'où vient son chiffre ; vous reconstruisez la formule à partir des trois sources de la semaine 1, puis vous mettez le résultat en face des 54 k€ de marge du chantier. Il reste 11,5 k€ avant toute garantie : c'est cette marge étroite qui rend la garantie décisive.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Partez de D1 : affichez la répartition de la classe entre compte ouvert, assurance-crédit, acompte et refus, et faites défendre chaque option par un élève qui l'a choisie. Faites chiffrer le coût de chaque garantie face au risque qu'elle couvre : prime d'assurance, moitié du chantier perdue avec l'acompte. Enchaînez sur Guénard et sur la hausse de Corvelle, où le réflexe de bloquer et celui d'accorder s'opposent.",
    },
    {
      minutes: 15,
      titre: "Chance ou méthode",
      detail:
        "Faites ouvrir le bilan des 30 tirages. Sous l'aléa 15, Corvelle reste solide et l'assureur refuse tout agrément : le compte ouvert et l'assurance font jeu égal, à 150 € de frais d'étude près ; sur les trente tirages, le compte ouvert perd 17 k€ en moyenne. Vous faites dire pourquoi : deux défauts de Corvelle, sur les tirages 11 et 21, coûtent chacun près de 300 k€ de plus sans assurance. Une bonne décision se juge sur sa moyenne et sur ses pires cas, pas sur le tirage qu'on a vécu.",
    },
    {
      minutes: 15,
      titre: "Synthèse : du risque à l'écriture",
      detail:
        "Vous reprenez la formule de la perte attendue et la règle de la garantie : elle se prend quand elle coûte moins que la perte attendue qu'elle retire. Puis vous traitez Brondel au tableau : déclaration au mandataire dans les deux mois, créance reclassée au compte 416, dépréciation au compte 491 par une dotation au compte 6817 sur le hors-taxe qu'on ne pense pas récupérer, perte au compte 654 et reprise de la dépréciation à la clôture de la procédure. Distribuez l'exercice de prolongement.",
    },
  ],
  calcul: {
    reponse: 42.5,
    etapes: [
      "Probabilité de défaut : la source « Analyser le dossier financier de Corvelle » donne la cote 7 de l'assureur-crédit, soit 10 % de probabilité de défaut dans le trimestre.",
      "Taux de récupération : la source « Relire les procédures collectives des cinq dernières années » indique qu'Arvel a récupéré en moyenne 15 % du hors-taxe de ses créances chirographaires ; la perte en cas de défaut est donc de 85 %.",
      "Exposition : l'encours demandé, 500 k€, que la limite autorise à atteindre. (La source « Chiffrer le chantier avec l'agence » annonce un encours de croisière de 480 k€ dès la semaine 9 ; le calcul sur 480 k€ donne 40,8 k€, que l'épisode accepte, l'écart restant sous 2 k€.)",
      "Perte attendue = 0,10 × 500 k€ × (1 − 0,15) = 42,5 k€. Le chiffre ne dépend pas des aléas : il est le même pour toute la classe.",
      "Mise en regard : le chantier fait 540 k€ de livraisons au prix chantier, à 10 % de marge sur coût variable, soit 54 k€. Une fois le risque payé, il reste 11,5 k€ : le chantier ne vaut d'être livré que si une garantie réduit la perte attendue pour moins cher qu'elle ne la réduit.",
    ],
    erreurs: [
      {
        valeur: 50,
        cause:
          "Le taux de récupération est oublié : 0,10 × 500 k€ donne la perte attendue si l'on ne récupérait rien sur la créance déclarée.",
      },
      {
        valeur: 7.5,
        cause:
          "Le taux de récupération est pris pour le taux de perte : 0,10 × 500 k€ × 0,15 mesure ce qu'on récupère, pas ce qu'on perd.",
      },
      {
        valeur: 425,
        cause:
          "La probabilité de défaut est oubliée : 500 k€ × 0,85 est la perte en cas de défaut, pas la perte attendue.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Corvelle fait 38 M€ de chiffre d'affaires, c'est le troisième client d'Arvel et le chantier pèse 540 k€ : on ne laisse pas partir une telle commande pour une question de garantie.",
      ceQuiLeDejoue:
        "Le chantier ne laisse que 54 k€ de marge pour 42,5 k€ de perte attendue. L'assurance-crédit coûte environ 2,9 k€ de prime (0,4 % de 720 k€ assurés) et 150 € de frais d'étude, et retire en moyenne 21 k€ de perte attendue (0,10 × 90 % × 275 k€ agréés en espérance × 85 %).",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Une traite qui revient impayée, c'est le signal qu'on attendait : on applique le blocage jusqu'au paiement, c'est la procédure.",
      ceQuiLeDejoue:
        "L'historique montre vingt-six ans sans perte et 2 % de probabilité de défaut : la perte attendue sur ses 60 k€ d'encours est de 840 € (0,02 × 60 k€ × 70 %). Bloqué, il part six fois sur dix avec 1 320 € de marge par semaine ; l'option perd près de 9 k€ en moyenne face à l'échéancier en trois fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Dix-huit logements, 22 k€ d'achats par semaine à 20 % de marge : un nouveau client se gagne en lui faisant confiance, pas en lui demandant des garanties.",
      ceQuiLeDejoue:
        "Avec 15 % de probabilité de défaut et 10 % de récupération, la perte attendue sur 150 k€ est de 20,25 k€, la moitié des 39,6 k€ de marge du programme. La caution d'un dirigeant au patrimoine libre, payée huit fois sur dix sans procès, la ramène à environ 4 k€ ; le compte en blanc perd 19 k€ en moyenne face à elle.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Elle paie en retard et réclame plus de crédit : c'est le début de la fin, il faut couper avant qu'il soit trop tard.",
      ceQuiLeDejoue:
        "La source sur les défauts passés dit qu'un retard isolé n'a précédé un défaut qu'une fois sur vingt : c'est l'accumulation de deux signaux qui l'annonce. Bloquée, Corvelle confie la suite des Terrasses à un concurrent, sept semaines de chantier et 31,5 k€ de marge ; l'option perd 24 k€ en moyenne face à la surveillance.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Ce n'est pas sa faute, son promoteur la paie en retard : on accompagne notre troisième client le temps que ça se régularise.",
      ceQuiLeDejoue:
        "Demander 150 k€ d'encours de plus pour le même volume, c'est demander à payer plus tard, et la source sur les défauts passés le range parmi les signaux. La hausse n'apporte aucune marge et accroît l'exposition ; l'option perd près de 10 k€ en moyenne face à la surveillance, et ne fait mieux que sur 4 tirages sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Après Brondel, on ne prend plus aucun risque jusqu'à la clôture : un compte en retard de plus de 30 jours est un compte à risque.",
      ceQuiLeDejoue:
        "La balance âgée croisée avec les signaux isole 31 comptes : sur leurs 24 k€ de commandes hebdomadaires, 40 % finiront dépréciés (80 % encore en retard × 50 %), plus que leurs 18 % de marge. Les 109 autres paient tard mais paient : les bloquer fait perdre 70 % de 9 k€ de marge par semaine, et l'option perd près de 24 k€ en moyenne face au tri.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont retenu que Corvelle était fragile, d'autres qu'il fallait chiffrer la perte attendue. Les deux sont vrais : lequel permet de décider, et pourquoi la fragilité seule ne dit pas s'il faut livrer ?",
    "Sous l'aléa de la classe, le compte ouvert à 500 k€ a fait jeu égal avec l'assurance-crédit, l'assureur ayant refusé tout agrément, et il bat la meilleure option sur 28 tirages sur 30. Pourquoi perd-il pourtant 17 k€ en moyenne ? Que se passe-t-il sur les tirages 11 et 21 ?",
    "Ceux qui ont accordé en compte ouvert ont-ils pris une mauvaise décision, alors que leur résultat vaut celui des assurés ? Qu'est-ce qui distingue la qualité d'une décision de son résultat, et à quoi sert le bilan des 30 tirages pour le dire ?",
    "L'acompte sur Corvelle, la caution bancaire de Guénard et la police sur tout le portefeuille ont protégé, et pourtant coûté de l'argent. Pour chacun, que coûtait la garantie, et quelle perte attendue retirait-elle ?",
    "En semaine 6, Corvelle paie avec douze jours de retard et demande 150 k€ de plus. Qu'est-ce qui distingue un signal d'un incident, et pourquoi la surveillance réagit-elle deux semaines plus tôt chez ceux qui avaient assuré l'encours ?",
    "Le chef comptable voulait passer les 64 k€ de Brondel en perte dès le mois du jugement. Qu'en dit le Plan comptable général, et que perd Arvel si la créance n'est pas déclarée au mandataire ?",
    "En semaine 10, bloquer les 140 comptes en retard ou trier selon les signaux : qu'est-ce qui, dans la balance âgée, permettait de séparer ceux qui finiront dépréciés de ceux qui paient tard mais paient ?",
  ],
  prolongement: {
    enonce:
      "Un grossiste en fournitures industrielles reçoit d'un client une demande de limite d'encours de 200 k€, pour 300 k€ de ventes HT sur le trimestre à 12 % de marge sur coût variable. La probabilité de défaut du client dans le trimestre est de 8 % et le taux de récupération moyen de 20 % ; on retient la limite comme exposition. 1) Calculez la perte attendue et la marge nette du risque si la limite est accordée sans garantie. 2) Un assureur-crédit agrée 150 k€ avec une quotité de 90 %, pour une prime de 0,3 % du chiffre d'affaires assuré (300 k€). Calculez la perte attendue résiduelle et la marge nette, prime déduite. 3) Autre solution : un acompte de 25 % à la commande, mais le client ne passe plus que 60 % de son volume ; l'exposition devient 60 % × 200 k€ × 75 %. Calculez la marge nette et classez les trois solutions. 4) À la clôture, un autre client en redressement judiciaire doit 96 k€ TTC (80 k€ HT, TVA à 20 %) ; le mandataire estime le dividende à 25 %. Passez les écritures de l'exercice N, puis celles de N + 1, quand la procédure se clôt après l'encaissement d'un dividende de 24 k€.",
    corrige:
      "1) Perte attendue = 0,08 × 200 × 0,80 = 12,8 k€ ; marge = 0,12 × 300 = 36 k€ ; marge nette du risque = 36 − 12,8 = 23,2 k€. 2) Exposition non couverte = 200 − 0,9 × 150 = 65 k€ ; perte attendue résiduelle = 0,08 × 65 × 0,80 = 4,16 k€ ; prime = 0,003 × 300 = 0,9 k€ ; marge nette = 36 − 4,16 − 0,9 = 30,94 k€. 3) Ventes = 180 k€, marge = 21,6 k€ ; exposition = 0,6 × 200 × 0,75 = 90 k€ ; perte attendue = 0,08 × 90 × 0,80 = 5,76 k€ ; marge nette = 15,84 k€. Classement : assurance-crédit (30,94 k€), compte ouvert (23,2 k€), acompte (15,84 k€) ; l'acompte réduit le risque mais coûte 14,4 k€ de marge, plus que les 7,04 k€ de perte attendue qu'il retire. 4) N : 416 au débit et 411 au crédit pour 96 k€ ; dépréciation du hors-taxe non recouvrable, 80 × 0,75 = 60 k€ : 6817 au débit, 491 au crédit. N + 1 : 512 au débit, 416 au crédit pour 24 k€ ; perte sur les 72 k€ TTC restants : 654 au débit pour 60 k€, 44571 au débit pour 12 k€, 416 au crédit pour 72 k€ ; reprise : 491 au débit, 7817 au crédit pour 60 k€.",
  },
  evaluation: [
    "La perte attendue est calculée avec ses trois termes, chacun tiré d'une source nommée, et l'écart entre la prévision déposée et 42,5 k€ est expliqué.",
    "Chaque garantie retenue ou écartée est justifiée par la comparaison chiffrée de son coût et de la perte attendue qu'elle retire.",
    "Les décisions de limite (Guénard, hausse de Corvelle, comptes en retard) s'appuient sur l'accumulation des signaux et sur la marge perdue, pas sur un retard isolé.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix mesurée sur les 30 tirages et le résultat obtenu sous l'aléa 15.",
    "Le traitement de la créance Brondel est juste : déclaration au mandataire, compte 416, dépréciation sur le hors-taxe, perte au compte 654 seulement à la clôture de la procédure.",
  ],
  vigilance:
    "L'épisode déprécie la créance d'un client en procédure (comptes 416, 491, dotation 6817) sur le hors-taxe non recouvrable, nette de la part couverte par l'assurance-crédit, et ne constate la perte au compte 654 qu'à la clôture de la procédure ; il passe pourtant en charge immédiate la créance non déclarée, la décote d'une cession à un fonds et la commande frauduleuse, et fait déprécier à 50 % un ensemble de comptes en retard à la clôture. Ces simplifications méritent la relecture d'un enseignant de comptabilité au regard du PCG en vigueur, notamment sur le caractère irrécouvrable qui fonde le compte 654 et la régularisation de TVA, et sur le caractère individuel de la dépréciation.",
};
