/**
 * FICHE ENSEIGNANT · ÉPISODE 11, LA FACTURE QUI FLAMBE.
 *
 * Mesurer quand l'énergie se consomme avant de couper ou de signer : près de
 * la moitié part quand les sites sont fermés, un contrat à prix fixe pénalise
 * les économies, et un plan carbone se juge sur des actions mesurées.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "facture-qui-flambe",
  formations: ["bts-gpme", "but-gaco", "stmg"],
  programme: [
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
    "BUT GACO · Accompagner une organisation dans sa démarche de responsabilité sociale et environnementale",
    "STMG · Terminale enseignement commun, Thème 3, Les organisations et la société",
  ],
  notion:
    "Une facture d'énergie se décompose en un volume et un prix, et le volume se lit heure par heure avant de se couper. L'erreur classique, devant un contrat qui va presque doubler, consiste à baisser le chauffage partout et à signer vite le prix fixe du fournisseur ; la seconde consiste à répondre à un client qui exige un plan carbone par une brochure ou des certificats. Dans l'épisode, Cyprien Lavergne, responsable RSE et énergie d'Arvel Distribution, voit l'énergie du trimestre passer de 103 k€ l'an dernier à près de 177 k€ aux prix de Volténa, pour un budget de 150 k€ ; Ostral Construction, 45 k€ de marge par trimestre, exige un bilan carbone mesuré et un plan chiffré. La courbe de charge montre que 42 % de l'énergie part sites fermés (180 kW appelés la nuit contre 430 kW en activité, une chaudière qui ne s'arrête jamais) ; l'offre de Volténa facture à 35 % du prix toute consommation sous 90 % du volume de l'an dernier, quand le contrat mixte du courtier ne fixe que la moitié du volume. L'élève découvre que des sous-compteurs, des programmateurs et des déstratificateurs financés aux trois quarts par les aides font plus que 14 °C imposés, qu'un contrat se choisit avec la consommation qu'on vise, et qu'un plan carbone se prouve action par action.",
  objectifs: [
    "Je décompose une facture d'énergie en volumes et en prix, et je repère la part consommée quand les sites sont fermés.",
    "Je compare des contrats d'énergie (prix fixe, mixte, indexé) avec leurs clauses de volume et leur exposition à une hausse du marché.",
    "Je classe des investissements d'économie d'énergie par leur temps de retour, aides déduites.",
    "Je distingue un plan de réduction des émissions fondé sur des actions mesurées d'un affichage (brochure, certificats).",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de facture, de prix unitaire, de budget et de temps de retour d'un investissement doivent être connues ; le calcul d'un coût à partir d'un volume et d'un prix suffit. Le MWh, la courbe de charge, les clauses de volume d'un contrat et les scopes 1 et 2 d'un bilan carbone peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/facture-qui-flambe?hasard=13 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le coût de l'énergie prévu pour le trimestre, en milliers d'euros, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la décision de la semaine 1 (14 °C partout, sous-compteurs, éco-gestes, contrat seul) et le contrat signé en semaine 2. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision du contrat.",
    },
    {
      minutes: 20,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous décomposez avec la classe les 1 700 MWh de l'an dernier (63 % de gaz) et les 103 k€, puis ce que deviennent les volumes quand on traite ce qui tourne sites fermés, et ce que deviennent les prix avec l'ancien contrat jusqu'à la semaine 4 et le contrat mixte ensuite. Vous montrez ce qu'a fait le tirage de la classe : une vague de froid en fin d'année, qui fait flamber le marché. Vous faites expliquer les valeurs éloignées : 177, 103, 150 k€.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix du contrat (semaine 2), du plan de sobriété (semaine 4) et de la réponse à Ostral (semaine 8). Pour le contrat, vous faites lire l'article 7 de Volténa et calculer ce que coûte une économie de 25 % sous une clause à 90 %. Pour Ostral, vous faites relire la note du questionnaire : la compensation et les garanties d'origine seules « ne sont pas recevables ».",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 13, « Mesurer, puis cibler » finit 10,5 k€ sous le budget, l'attentiste 45,4 k€ au-dessus, et « Couper et signer vite » 71,3 k€ au-dessus, contrat d'Ostral perdu compris. Vous montrez ensuite les décisions où le hasard compte : le froid de fin d'année, qui punit le contrat tout indexé sous ce tirage alors qu'il fait mieux 17 fois sur 30, et la coupure du chauffage pendant les fêtes, qui gagne souvent mais peut faire geler le stock.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : regarder quand on consomme avant de couper, choisir le contrat avec la consommation qu'on vise, investir d'abord là où le retour est le plus court, et prouver un plan carbone par des mesures. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 139.5,
    etapes: [
      "Source « Décomposer les factures de l'an dernier » : au quatrième trimestre, 1 700 MWh, dont 63 % de gaz, pour 103 k€ ; aux prix de Volténa (195 €/MWh d'électricité, 76 €/MWh de gaz), les mêmes volumes coûteraient 177 k€. La courbe de charge ajoute que 42 % de l'énergie est consommée sites fermés.",
      "Le volume : la bonne méthode pose les sous-compteurs (le compresseur et les aérothermes sont réglés dès la première semaine), lance un plan ciblé en semaine 4 (programmateurs, hors-gel la nuit dans les zones de stockage, 19 °C aux comptoirs), puis des déstratificateurs en semaine 8. La consommation, corrigée du climat, tombe à environ 77 % de celle de l'an dernier en semaine 5 et à 60 % à 70 % en décembre : 1 389 MWh sur le trimestre, malgré un hiver plus froid, au lieu de 1 845 MWh sans rien faire.",
      "Le prix : l'ancien contrat court jusqu'à la semaine 4 ; ensuite, le contrat mixte du courtier fixe la moitié du volume de l'an dernier à 166 €/MWh d'électricité et 64 €/MWh de gaz, et laisse le reste au prix du marché plus 3 % (environ 130 à 150 €/MWh d'électricité jusqu'en semaine 10).",
      "Sous le tirage n° 13, une vague de froid arrive en fin d'année : le marché de l'électricité passe de 147 à 263, puis 285 €/MWh en semaines 11 à 13, et la part indexée la paie. L'énergie consommée coûte environ 131,5 k€ ; les actions (sous-compteurs, courtage, programmateurs, location des déstratificateurs, bilan carbone, préparation du froid) et une régularisation de 4 100 € sur l'agence de Décines y ajoutent environ 15,5 k€, et l'effacement payé par le réseau pendant le froid en retire 7,5 k€. Le modèle donne 139,5 k€ (139,48).",
      "Le chiffre dépend du hasard (de 127,7 à 159,1 k€ selon les trente tirages, 137,9 k€ en moyenne) et des décisions : 160,2 k€ avec l'offre de Volténa et la même sobriété (9 k€ de pénalité de volume), 195,4 k€ pour qui ne change rien. L'épisode juge juste à 10 k€ près, proche à 25.",
    ],
    erreurs: [
      {
        valeur: 177,
        cause:
          "Les volumes de l'an dernier multipliés par les prix de Volténa : la consommation est supposée figée, et le contrat signé d'avance.",
      },
      {
        valeur: 103,
        cause:
          "Le coût de l'an dernier reporté tel quel : l'ancien contrat s'arrête à la fin de la semaine 4, et les prix ont presque doublé.",
      },
      {
        valeur: 150,
        cause:
          "Le budget de Murielle Andrieu pris pour une prévision : c'est le plafond qu'on lui a fixé, pas ce que le trimestre coûtera.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La facture va presque doubler : baisser le chauffage à 14 °C et couper un éclairage sur deux, partout, dès demain, ne coûte rien et agit tout de suite.",
      ceQuiLeDejoue:
        "La courbe de charge montre où part l'argent : 42 % de l'énergie sites fermés, la nuit et le week-end, avec 180 kW appelés et une chaudière qui ne s'arrête jamais ; le tour du samedi trouve des aérothermes à 17 °C sous onze mètres de plafond, un compresseur qui fuit et une porte de quai ouverte. Yasmina Cherkaoui le dit : « Dans un entrepôt, c'est souvent la nuit que part l'argent. » Les 14 °C frappent les heures de travail : Fanny Lebrun voit des radiateurs apportés de la maison, et le CSE demande à être consulté. Rejoué sur les trente tirages à la place des sous-compteurs, le 14 °C partout perd 22,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "L'offre de Volténa expire ce soir et le marché bouge beaucoup : signer le prix fixe sur trois ans, c'est ne plus avoir de surprise.",
      ceQuiLeDejoue:
        "La relecture clause par clause trouve l'article 7 : toute consommation sous 90 % du volume de l'an dernier est facturée à 35 % du prix, donc toute économie au-delà de 10 % est en partie payée quand même, pendant trois ans, sans sortie possible. Le courtier propose un prix fixe à 176 €/MWh au lieu de 195, avec une tolérance à 70 %, et un contrat mixte dont le ruban ne porte que sur la moitié du volume. Rejouée sur les trente tirages à la place du contrat mixte, la signature chez Volténa perd 21,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Une note de la direction qui verrouille les thermostats à 17 °C partout et interdit les radiateurs d'appoint s'applique dès lundi, sans rien coûter.",
      ceQuiLeDejoue:
        "Les sous-compteurs montrent que le chauffage de la plateforme part pour plus de moitié la nuit et le week-end, dans des zones de stockage où personne ne travaille, et que quatre agences sur sept n'ont pas de programmateur. Hakim Boukhari accepte le hors-gel la nuit dans le stockage, pas les commandes préparées à 14 °C. Un plan ciblé, avec un référent par site et 1 500 € de programmateurs, coupe là où personne n'est. Rejoué sur les trente tirages à la place du plan ciblé, le verrouillage à 17 °C perd 13,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Une brochure « neutres en carbone en 2030 », prête en une semaine pour 1 500 €, répond vite à Ostral, et le négoce d'en face affiche le même engagement.",
      ceQuiLeDejoue:
        "Le questionnaire d'Ostral demande les émissions des scopes 1 et 2 mesurées et non estimées, un objectif à trois ans et l'effet chiffré de chaque action engagée. Yohan Pichon rapporte que deux négoces ont déjà été écartés pour des plans « trop marketing », et le contrat pèse 45 k€ de marge par trimestre. Un bilan mesuré par un cabinet coûte 4 000 €, avec les sous-compteurs pour le nourrir. Rejouée sur les trente tirages à la place du bilan mesuré, la brochure perd 29 k€ en moyenne et ne fait mieux que 9 fois sur 30, les fois où Ostral renouvelle quand même.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Entre le 20 décembre et le 2 janvier, la plateforme tourne au ralenti : couper son chauffage pendant les fêtes est une économie évidente.",
      ceQuiLeDejoue:
        "La source sur la météo donne quatre chances sur dix d'une vague de froid à partir de la semaine 11, avec des nuits à −8 °C, et 380 k€ de produits qui craignent le gel dans la plateforme : peintures, colles, mastics, adjuvants. Regroupés dans la zone chauffée, ils tiennent sur six travées, et le reste peut passer en hors-gel ; l'effacement aux heures de pointe est payé environ 2 500 € par semaine de froid. Rejouée sur les trente tirages à la place de cette préparation, la coupure fait mieux 23 fois sur 30, mais perd 5 k€ en moyenne : quand le dépôt gèle, la perte efface plusieurs hivers d'économies.",
    },
  ],
  debrief: [
    "En semaine 1, la facture allait presque doubler. Qu'est-ce que la courbe de charge et le tour du samedi montraient que la comparaison au mètre carré ne montrait pas ?",
    "Volténa à prix fixe, ou le contrat mixte du courtier : que dit l'article 7 à quelqu'un qui compte économiser 25 % ? Pourquoi un contrat se choisit-il avec la consommation qu'on vise, et pas avec celle de l'an dernier ?",
    "Sous le tirage n° 13, une vague de froid fait passer l'électricité de 147 à 285 €/MWh en fin d'année : ceux qui ont tout indexé paient 14,3 k€ de plus que le contrat mixte. Sur les trente tirages, le tout indexé fait pourtant mieux 17 fois sur 30. Était-ce un bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Déstratificateurs à 34 k€ dont 24 k€ d'aides, LED à 52 k€ dont 14 k€ d'aides, pompes à chaleur à 420 k€ : comment les classer quand le comité ne veut rien qui pèse sur la trésorerie ?",
    "Bilan mesuré, brochure, garanties d'origine ou délai : qu'est-ce qu'Ostral pouvait vérifier dans chacun ? Pourquoi les mesures de la semaine 1 servent-elles aussi le dossier de la semaine 8 ?",
    "Couper le chauffage pendant les fêtes gagne 23 fois sur 30, et perd 5 k€ en moyenne. Comment un choix peut-il gagner presque toujours et rester mauvais ?",
    "Quelle règle gardez-vous devant une facture d'énergie qui flambe ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une entreprise a consommé l'an dernier, au même trimestre, 630 MWh d'électricité et 1 070 MWh de gaz. Grâce à un plan de sobriété, elle prévoit 550 MWh d'électricité et 850 MWh de gaz. Offre A : prix fixe de 195 €/MWh d'électricité et 76 €/MWh de gaz ; toute consommation sous 90 % du volume de l'an dernier est facturée à 35 % du prix. Offre B : un ruban de la moitié du volume de l'an dernier à 166 €/MWh d'électricité et 64 €/MWh de gaz, le reste au prix du marché plus 3 %, le marché étant à 150 €/MWh d'électricité et 62 €/MWh de gaz. 1) Que coûte l'offre A, pénalité de volume comprise ? 2) Que coûte l'offre B, si le marché ne bouge pas ? 3) Une vague de froid fait monter le marché de 70 % pendant trois des treize semaines : de combien l'offre B augmente-t-elle, en supposant la part indexée répartie également sur les semaines ? 4) Quelle offre choisissez-vous ?",
    corrige:
      "1) Consommation : 550 × 195 + 850 × 76 = 107 250 + 64 600 = 171 850 €. Seuils : 0,9 × 630 = 567 MWh d'électricité et 0,9 × 1 070 = 963 MWh de gaz. Pénalité : (567 − 550) × 195 × 0,35 + (963 − 850) × 76 × 0,35 ≈ 1 160 + 3 006 = 4 166 €. Total ≈ 176 016 €. 2) Ruban : 315 × 166 + 535 × 64 = 52 290 + 34 240 = 86 530 € ; reste : 235 × 154,50 + 315 × 63,86 ≈ 36 308 + 20 116 = 56 424 €. Total ≈ 142 953 €. 3) La part indexée coûte 56 424 € ; 70 % de plus sur 3 semaines sur 13 : 56 424 × 0,7 × 3 / 13 ≈ 9 115 €, soit environ 152 068 €. 4) Même avec le froid, l'offre B coûte environ 24 000 € de moins que l'offre A, parce qu'elle ne fait pas payer les économies et qu'elle part de prix plus bas ; son risque est connu et limité à la part indexée.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur la courbe de charge et le tour des sites fermés, et l'élève dit pourquoi la comparaison au mètre carré n'apprend rien.",
    "La prévision du coût du trimestre est construite par un calcul écrit (volumes visés, prix de l'ancien et du nouveau contrat, coût des actions), et l'écart avec 139,5 k€ est expliqué.",
    "Le contrat choisi est justifié par ses clauses de volume et son exposition au marché, rapportées à la consommation visée.",
    "Les investissements sont classés par temps de retour aides déduites, et la réponse à Ostral repose sur des données mesurées.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 13.",
  ],
  vigilance:
    "Le code du travail impose de chauffer les locaux de travail de façon adaptée et de consulter le CSE sur ce qui touche les conditions de travail ; il ne fixe pas de température minimale chiffrée pour les bureaux, et les repères souvent cités (19 °C, 14 °C pour un travail physique) relèvent de recommandations : à faire relire par un professeur de droit social. Les aides (certificats d'économies d'énergie), la clause de volume, les facteurs d'émission et la règle d'Ostral sur les garanties d'origine sont ceux de l'épisode ; le périmètre des scopes 1 et 2 est présenté de façon simplifiée.",
};
