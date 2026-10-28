/**
 * FICHE ENSEIGNANT · ÉPISODE 9, LA TRÉSORERIE QUI FOND.
 *
 * Une entreprise rentable qui manque de trésorerie : la croissance, les
 * retards des clients et le stock gonflent le besoin en fonds de roulement.
 * Chercher l'argent là où il dort, plutôt que de le prendre aux fournisseurs.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "tresorerie-qui-fond",
  formations: ["bts-cg", "dcg", "bts-gpme"],
  programme: [
    "BTS CG · Processus 6, Analyse de la situation financière",
    "DCG · UE 6, Finance d'entreprise",
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
  ],
  notion:
    "Une entreprise peut gagner de l'argent et en manquer : la trésorerie ne suit pas le résultat, mais le résultat moins ce qu'absorbe le besoin en fonds de roulement. L'erreur classique, devant un découvert qui touche l'autorisation, consiste à prendre l'argent aux fournisseurs en décalant leurs paiements, à céder toutes ses factures à un factor, ou à attendre les encaissements de fin de mois ; l'autre consiste à relancer tous les clients en retard, dans l'ordre alphabétique. Dans l'épisode, Béatrice Castagnier, responsable administrative et financière d'Arvel Matériaux Rhône Sud, voit le découvert à 1 120 k€ pour une autorisation de 1 200 k€, alors que les ventes progressent de 8 % et que la marge tient à 27 %. La balance âgée montre 1,1 M€ de créances échues, dont 68 % chez quinze clients, et 200 k€ chez Cimier Construction seul ; la décomposition du BFR chiffre chaque jour de délai client à 57 k€, chaque jour de stock à 42 k€, et la croissance à 25 k€ par semaine. L'élève découvre qu'une relance ciblée sur quinze clients rapporte plus que 1 400 relances générales, qu'une banque prête à qui arrive avec une prévision et un plan, et qu'un escompte à 19 % l'an n'est une affaire que financé sous l'autorisation.",
  objectifs: [
    "J'explique pourquoi une entreprise rentable et en croissance peut manquer de trésorerie, à partir de son besoin en fonds de roulement.",
    "Je calcule ce que libère un jour de délai client ou de stock en moins, et je cible les créances qui pèsent le plus.",
    "Je construis une prévision de trésorerie semaine par semaine et je la présente à la banque avec un plan d'action.",
    "Je compare le coût de plusieurs financements (découvert, dépassement, affacturage, escompte) en taux annuel.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de trésorerie, de besoin en fonds de roulement, de délai de paiement des clients et des fournisseurs, de rotation des stocks et de découvert bancaire doivent avoir été vues en cours. La balance âgée, le plan de trésorerie et le taux annuel d'un escompte peuvent être introduits pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/tresorerie-qui-fond?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le découvert prévu en fin de semaine 3, en milliers d'euros, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la décision de la semaine 1 (fournisseurs, quinze plus gros encours, relance générale, attente) et la réponse à la banque en semaine 3. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 5, Cimier.",
    },
    {
      minutes: 20,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous reconstruisez avec la classe ce qui fait bouger le découvert chaque semaine : la marge moins les charges, ce que la croissance et la dérive des délais prennent au BFR, puis ce que la relance ciblée rend (l'acompte de Cimier, un délai client qui baisse d'environ un jour par semaine). Vous comparez au modèle : environ 1 000 k€ en moyenne, 872 k€ sous le tirage de la classe, où les ventes des premières semaines sont faibles. Vous faites expliquer les valeurs éloignées : 1 120, 1 040, 1 190.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 (banque) et de la semaine 5 (Cimier). Pour la semaine 1, vous faites calculer ce que rapportent deux jours de délai client en moins (114 k€) et ce que coûte un retard chez Norvia (la remise de 20 k€, l'assureur-crédit). Pour Cimier, vous faites lire la note de l'assureur-crédit : une chance sur cinq de défaillance, 30 % récupérés.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Chercher le cash dans le BFR » finit 9,4 k€ sous le budget de frais financiers et de pertes, l'attentiste 85,5 k€ au-dessus, et « Tirer sur les fournisseurs et le factor » 98,2 k€ au-dessus. Vous montrez ensuite la décision où le hasard a récompensé l'attente : Cimier n'a pas fait défaut sous ce tirage. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la relation qui reste : trésorerie = résultat de trésorerie d'exploitation − variation du BFR, et les trois leviers du BFR (délai client, stock, délai fournisseur) avec ce que vaut un jour de chacun. Vous ajoutez la règle de l'épisode : chercher où l'argent dort avant d'en emprunter, prévenir la banque avant le pic. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 872,
    etapes: [
      "Point de départ (relevé bancaire) : découvert de 1 120 k€ pour une autorisation de 1 200 k€. La décomposition du BFR donne les ordres de grandeur : 57 k€ par jour de délai client (des ventes d'environ 400 k€ par semaine), 42 k€ par jour de stock, et 25 k€ de trésorerie pris chaque semaine par la seule croissance.",
      "Sans rien faire, le découvert se creuse : la marge de 27 % couvre les charges de la semaine avec une vingtaine de milliers d'euros d'avance (dans le modèle, environ 108 k€ de marge pour 89 k€ de salaires, loyers et transport), mais la croissance en prend 25 k€ et le délai client dérive d'environ 0,3 jour par semaine, soit 17 k€ de plus.",
      "La relance ciblée des quinze plus gros encours (à partir de la semaine 2) fait baisser le délai client d'environ un jour par semaine, soit une soixantaine de milliers d'euros chaque semaine, et Cimier verse 80 k€ en semaine 3. Avec des ventes moyennes, le modèle donne un découvert d'environ 1 000 k€ en fin de semaine 3 (999 k€ en moyenne sur les trente tirages).",
      "Sous le tirage n° 12, les ventes des deux premières semaines sont 5 % sous la tendance : le BFR client, qui suit les ventes, se dégonfle d'autant, et le découvert recule à 1 091 k€, 1 001 k€ puis 872 k€ (872,2) en fin de semaine 3. C'est le plus bas des trente tirages (de 872 à 1 201 k€).",
      "Le chiffre dépend fortement des décisions : sous le même tirage, 1 102 k€ pour qui attend, 1 055 k€ pour la relance générale, 529 k€ pour qui décale les paiements des fournisseurs, une trésorerie empruntée à Norvia qui se paie plus tard. L'épisode juge juste à 140 k€ près, proche à 250 : la tolérance couvre l'écart entre les ventes moyennes, que les sources permettent de chiffrer, et les ventes plus faibles de ce tirage.",
    ],
    erreurs: [
      {
        valeur: 1120,
        cause:
          "Le découvert du jour reporté tel quel, comme si la croissance, la dérive des délais et la relance ne changeaient rien en trois semaines.",
      },
      {
        valeur: 1040,
        cause:
          "Seul l'acompte de Cimier compté (1 120 − 80) : la baisse du délai des autres clients, qui vaut 57 k€ par jour, est oubliée, comme la croissance qui creuse le besoin.",
      },
      {
        valeur: 1190,
        cause:
          "La prévision de qui ne fait rien : 1 120 + 3 × (25 + 17 − 19) ≈ 1 190 k€. Le calcul est juste pour l'attentiste en tendance, mais il ne compte pas la relance décidée.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Mehdi le propose, « tout le monde le fait » : décaler de trois semaines les fournisseurs libère près de 800 k€ d'ici la semaine 4, sans frais.",
      ceQuiLeDejoue:
        "Bernard Faure prévient : « ne te fâche ni avec ta banque ni avec Norvia : ce sont tes deux plus gros prêteurs ». Stéphanie Royer réagit dès la première semaine : trois semaines de retard, un assureur-crédit qui suit, et la remise de fidélité de 20 k€ perdue au premier retard ; les conditions des trois premiers fournisseurs ajoutent 1 200 € de pénalités par semaine. L'argent dort ailleurs : 1,1 M€ de créances échues, dont 68 % chez quinze clients. Rejoué sur les trente tirages à la place de la relance ciblée, le décalage perd 35,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Avec l'affacturage sur toutes les factures, plus de risque de dépasser l'autorisation : le factor avance ce qu'il faut.",
      ceQuiLeDejoue:
        "Le devis le chiffre : 2 500 € de mise en place, 0,5 % sur tout le chiffre d'affaires cédé, soit 2 k€ par semaine, plus le financement à 6 %, pour un an au minimum, alors que le besoin dépasse l'autorisation quelques semaines seulement. Olivier Peyrache dit ce que veut son comité : une prévision semaine par semaine et un plan, et il relève alors l'autorisation à 1 350 k€ pour 1 500 € de commission. Rejoué sur les trente tirages à la place de la prévision présentée à la banque, l'affacturage perd 20,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Cimier ne répond plus et doit encore plus de 100 k€, presque tout à plus de soixante jours : une injonction de payer et des livraisons suspendues montrent qu'on ne se laisse pas faire.",
      ceQuiLeDejoue:
        "L'historique le rappelle : quinze ans sans un impayé, un versement de 80 k€ après l'appel d'Aurore ; la note de l'assureur-crédit explique le retard (un promoteur en difficulté) et donne environ une chance sur cinq de défaillance. La procédure coûte 3 000 €, prend six semaines, et Cimier achète ailleurs en attendant, 1,2 M€ d'achats par an. Un échéancier sur huit semaines, avec paiement des nouvelles commandes à la commande, garde le client et fait rentrer l'argent. Rejouée sur les trente tirages à la place de l'échéancier, l'injonction perd 20,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Le stock a gonflé : geler toutes les commandes quatre semaines le fait baisser vite, et ne coûte rien.",
      ceQuiLeDejoue:
        "L'analyse par rotation le montre : les 300 références qui font 80 % des ventes sont à 45 jours de stock, sans gras ; le surplus, ce sont 2 100 références dormantes pour 610 k€, dont les fournisseurs reprennent la moitié contre 9 000 € de frais de retour. Geler tout coupe aussi ce qui tourne : Franck Delmas voit trois agences en rupture de chevilles et de vis, et les artisans traverser la rue. Rejoué sur les trente tirages à la place des retours ciblés, le gel perd 31,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le pic de la semaine 12 fait 560 k€ : décaler de deux semaines tous les fournisseurs libère près de 400 k€ au bon moment, sans frais.",
      ceQuiLeDejoue:
        "La relecture des conditions des trois premiers fournisseurs chiffre le moindre retard : 1 200 € de pénalités par semaine et la remise de fin de trimestre de Norvia, 20 k€, perdue. La mise à jour de la prévision montre l'autre voie : une banque qui a reçu la prévision de la semaine 3 « attendait cette échéance », et une facilité ponctuelle passe le pic. Rejoué sur les trente tirages à la place de cette facilité, le décalage perd 19,9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Patrick Ollier ne comprend pas : 8 % de ventes en plus, une marge qui tient, et un découvert au bord de l'autorisation. Que répondez-vous, avec les chiffres de la décomposition du BFR ?",
    "Quinze clients font 68 % de l'échu, 1 400 autres se partagent le reste. Combien rapporte un jour de délai client en moins ? Pourquoi relancer d'abord les quinze plutôt que tout le monde, dans l'ordre alphabétique ?",
    "Décaler les fournisseurs fait tomber le découvert à 529 k€ en semaine 3, bien mieux que la relance ciblée. Pourquoi la méthode « Tirer sur les fournisseurs et le factor » finit-elle pourtant le trimestre 108 k€ derrière la relance ciblée ? Qui prête l'argent, et à quel prix ?",
    "Sous le tirage n° 12, Cimier n'a pas fait défaut : ceux qui ont attendu finissent 6,2 k€ derrière l'échéancier, et sur les trente tirages, l'attente fait mieux que l'échéancier 23 fois sur 30. Elle perd pourtant 7,6 k€ en moyenne. Pourquoi ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Norvia propose 2 % pour payer 38 jours plus tôt, l'équivalent de 19 % l'an. À quelle condition est-ce une affaire, quand le découvert coûte 6,5 % et le dépassement 15,5 % ?",
    "Pourquoi la banque prête-t-elle à qui arrive avec une prévision semaine par semaine, et réduit-elle la ligne de qui la fait attendre ?",
    "Quelle règle gardez-vous devant un découvert qui se creuse ? Formulez-la en une phrase, avec un levier du BFR dedans.",
  ],
  prolongement: {
    enonce:
      "Une filiale vend 350 000 € par semaine, soit 50 000 € par jour ; ses achats représentent 75 % de ses ventes, soit 37 500 € par jour de coût des ventes. Ses clients paient à 60 jours, son stock représente 80 jours de coût des ventes, elle paie ses fournisseurs à 45 jours. 1) Calculez son besoin en fonds de roulement. 2) Elle ramène le délai client à 52 jours et le stock à 70 jours. Quel BFR, et combien de trésorerie libère-t-elle ? 3) Un fournisseur propose 2 % d'escompte pour un paiement à 10 jours au lieu de 48. Quel taux annuel cela représente-t-il ? Est-ce intéressant si le découvert coûte 6,5 % l'an ? Et si le paiement anticipé fait dépasser l'autorisation, au taux de 15,5 % plus des commissions ? 4) Décaler de 21 jours tous les fournisseurs libérerait combien ? Pourquoi est-ce une mauvaise idée ?",
    corrige:
      "1) Clients : 60 × 50 000 = 3 000 000 € ; stock : 80 × 37 500 = 3 000 000 € ; fournisseurs : 45 × 37 500 = 1 687 500 €. BFR = 3 000 000 + 3 000 000 − 1 687 500 = 4 312 500 €. 2) 52 × 50 000 + 70 × 37 500 − 1 687 500 = 2 600 000 + 2 625 000 − 1 687 500 = 3 537 500 € : 775 000 € de trésorerie libérée. 3) Payer 38 jours plus tôt pour 2 % : 2 / 98 × 365 / 38 ≈ 19,6 % l'an (environ 19 % en arrondissant comme l'épisode). C'est une affaire financée sur un découvert à 6,5 % ; financé en dépassement à 15,5 % plus les commissions et les virements rejetés, le gain disparaît presque. 4) 21 × 37 500 = 787 500 €, mais c'est un crédit pris aux fournisseurs sans leur accord : pénalités, remises perdues, livraisons retenues, et une réputation de mauvais payeur.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur la balance âgée et la décomposition du BFR, et l'élève dit pourquoi le compte de résultat n'explique pas le découvert.",
    "La prévision du découvert en fin de semaine 3 est construite par un calcul écrit (marge moins charges, croissance, dérive des délais, effet de la relance), et l'écart avec 872 k€ est expliqué.",
    "Les leviers retenus libèrent de la trésorerie dans le BFR (créances ciblées, stock dormant) plutôt qu'en la prenant aux fournisseurs, et chacun est chiffré en jours et en euros.",
    "Les financements envisagés (relèvement d'autorisation, affacturage, escompte, facilité ponctuelle) sont comparés par leur coût annuel et leur durée.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le corrigé de 872 k€ est celui du modèle sous le tirage n° 12, le plus favorable des trente pour la semaine 3 : les ventes hebdomadaires et les charges fixes ne figurent pas dans les sources, et une estimation bien conduite tombe vers 1 000 k€, jugée juste grâce à une tolérance de 140 k€. C'est la méthode qu'il faut corriger. Les délais de paiement entre professionnels sont plafonnés par la loi, et un retard ouvre droit à des pénalités et à une indemnité forfaitaire de recouvrement ; l'injonction de payer et la cession de créance sans recours sont présentées de façon simplifiée : à faire relire par un professeur de droit.",
};
