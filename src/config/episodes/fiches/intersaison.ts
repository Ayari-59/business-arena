/**
 * FICHE ENSEIGNANT · ÉPISODE 56, L'INTERSAISON QUI ASSÈCHE LA CAISSE.
 *
 * Le plan de trésorerie d'un hôtel saisonnier : le BFR s'inverse à la
 * fermeture, et le creux prévisible se finance par un crédit de campagne. Le
 * piège : croire la caisse pleine en avril, puis passer le creux en reportant
 * les travaux, en étalant les fournisseurs et en vendant la saison suivante.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "intersaison",
  formations: ["bts-mhr", "bts-cg", "dcg"],
  programme: [
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
    "BTS CG · Processus 6, Analyse de la situation financière",
    "DCG · UE 6, Finance d'entreprise",
  ],
  notion:
    "Une trésorerie abondante à la fin d'une saison n'est pas un excédent : c'est souvent un besoin en fonds de roulement négatif, fait des dettes de la saison qui tomberont quand plus rien n'entrera. L'erreur classique consiste à lire le solde du compte comme une réserve, puis, quand le creux arrive, à le passer en reportant l'entretien, en laissant glisser les fournisseurs ou en vendant d'avance la saison suivante, au lieu de le financer comme ce qu'il est : un besoin saisonnier et prévisible. Dans l'épisode, L'Escale Megève, 38 chambres, ferme le 19 avril après une saison record avec 420 k€ en banque. Mais son BFR est de −406 k€ et son fonds de roulement de 14 k€ seulement : soldes de tout compte de 42 saisonniers, cotisations, TVA, commissions, fournisseurs de l'hiver et 220 k€ de travaux tombent pendant la fermeture, et le plan touche −285,4 k€ en semaine 11, juste avant la réouverture du 2 juillet. L'élève découvre qu'un plan semaine par semaine, présenté à la banque avant d'en avoir besoin, obtient un crédit de campagne à 4,8 % sur l'utilisé ; qu'un acompte se règle période par période selon la demande ; et que ce qu'on n'emprunte pas à la banque, on l'emprunte plus cher à ses fournisseurs (12,15 % de pénalités) ou à la saison suivante (travaux 10 % plus chers, pannes, notes).",
  objectifs: [
    "Je construis un plan de trésorerie semaine par semaine et j'en lis le point bas.",
    "Je relie la trésorerie nette, le BFR et le fonds de roulement, et j'explique pourquoi le BFR d'un hôtel saisonnier s'inverse à la fermeture.",
    "Je choisis un financement adapté à la nature du besoin : crédit de campagne pour un besoin saisonnier, et non prêt à moyen terme ni découvert.",
    "Je compare le coût d'un report ou d'un étalement à celui d'un emprunt, pénalités et conséquences sur la saison suivante comprises.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le plan de trésorerie, le BFR, le fonds de roulement et la relation FRNG = BFR + trésorerie nette doivent avoir été vus en cours, ainsi que les principaux crédits à court terme (facilité de caisse, découvert, crédit de campagne). Le calcul d'intérêts au prorata du temps suffit pour le reste.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/intersaison?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez L'Escale Megève et ses 420 k€ en banque au lendemain d'une saison record, et vous demandez de construire sur papier, avant de valider la semaine 1, le plan de trésorerie semaine par semaine jusqu'à mi-juillet et d'en noter le point bas.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez le financement choisi en semaine 1 (ligne saisonnière, rien, prêt à cinq ans, facilité de caisse) et la réponse à Alpine Horizons en semaine 11, où la classe se partage. Un binôme qui a fini tôt calcule ce que coûterait le report des chambres à l'automne.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous construisez au tableau le plan avec la classe, en deux colonnes (ce qui entre, ce qui sort) et une ligne par semaine, à partir des sources de Fleurine Rosset. Le solde descend sous zéro en semaine 7 et touche −285,4 k€ en semaine 11. Vous faites expliquer les valeurs éloignées (−109,4 k€, −358 k€ ou −246,2 k€). Vous terminez par le bilan d'ouverture : trésorerie nette de 420 k€, BFR de −406 k€, fonds de roulement de 14 k€ ; les 420 k€ appartiennent aux salariés, à l'URSSAF, à l'État et aux fournisseurs.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (les travaux) et de la semaine 11 (Alpine Horizons). Pour le financement, vous faites comparer la ligne saisonnière (4,8 % sur l'utilisé), le prêt à cinq ans dont l'argent dormirait dix mois sur douze, et la facilité de caisse à 8,5 %. Pour les travaux, vous faites chiffrer le report des douze chambres (3 % de recettes en moins dès la réouverture, 16 k€ sur l'été et l'hiver suivants, 10 % de plus à l'automne). Pour Alpine Horizons, vous faites calculer ce que les six chambres rapportent aux fêtes et en février (98 % à 560 €) contre 280 € en engagement ferme.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Le bilan juge la trésorerie corrigée de mi-juillet : ce qui est emprunté, encaissé d'avance ou reporté n'y compte pas, ce que les choix coûtent après le trimestre y compte. Elle est négative pour tous, puisque le creux est réel. Sous le tirage n° 12, « Faire le plan, financer le creux, préserver la saison suivante » finit à −345,6 k€ ; « Attentiste » à −407,3 k€ ; « Passer le creux sans emprunter » à −488,1 k€, alors que son compte affiche +120,7 k€ en fin de trimestre. Vous faites lire cet écart : 275 k€ de paiements reportés et 180 k€ de travaux repoussés, qui ne sont pas de l'argent gagné. Vous montrez enfin la contre-proposition à Alpine Horizons, acceptée sous le tirage n° 12, refusée une fois sur quatre.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : un besoin saisonnier se finance par un crédit saisonnier, négocié plan en main avant d'en avoir besoin. Vous la déclinez : lire le BFR derrière le solde, régler l'acompte période par période, payer à l'échéance et prendre les remises, ne pas reporter ce qui coûtera plus cher, ne pas vendre les semaines de pointe de la saison suivante. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: -285.4,
    etapes: [
      "Le départ (source « Relever ce qui rentrera d'ici la réouverture ») : trésorerie nette de +420 k€ au 13 avril. Les entrées jusqu'à la semaine 11 : 64 k€ de recettes de la dernière semaine, 58 k€ d'Alpine Horizons en semaine 4, et 6,6 k€ d'acomptes chaque semaine (20 % de 33 k€), soit 11 × 6,6 = 72,6 k€ ; en tout 194,6 k€.",
      "Les sorties (source « Lister avec Fleurine les échéances ») : 16 k€ de charges fixes chaque semaine, soit 176 k€ sur onze semaines ; puis 92 (semaine 1), 118 (semaine 2), 52 (semaine 3), 34 (semaine 4), 58 + 66 (semaine 5), 55 + 77 (semaine 7), 50 (semaine 8), 45 (semaine 9) et 77 (semaine 10), soit 724 k€ ; en tout 900 k€.",
      "Le solde semaine par semaine : 382,6 ; 255,2 ; 193,8 ; 208,4 ; 75,0 ; 65,6 ; −75,8 ; −135,2 ; −189,6 ; −276,0 ; −285,4 k€ en semaine 11. En semaine 12, la réouverture fait rentrer 34 k€ pour 22 k€ de paie de juin et 16 k€ de charges fixes : −282,8 k€, puis −246,2 k€ en semaine 13.",
      "Point bas du plan : 420 + 194,6 − 900 = −285,4 k€, en semaine 11, fin juin. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 10 k€ près, proche à 30 k€.",
      "Ce point bas est plus de cinq fois la facilité de caisse de 50 k€ : c'est la taille du crédit de campagne à négocier, et il disparaît avec l'été et les acomptes de l'hiver.",
    ],
    erreurs: [
      {
        valeur: -109.4,
        cause:
          "Les 16 k€ de charges fixes hebdomadaires oubliés (176 k€ sur onze semaines) : seules les échéances exceptionnelles de la liste ont été retenues.",
      },
      {
        valeur: -358,
        cause:
          "Les acomptes des réservations de l'été et de l'hiver oubliés (11 × 6,6 = 72,6 k€) : ils entrent chaque semaine, même hôtel fermé.",
      },
      {
        valeur: -246.2,
        cause:
          "Le solde de fin de trimestre, mi-juillet, pris pour le point bas : après la réouverture, la trésorerie remonte déjà.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Saison record, 420 k€ en banque, aucun frais bancaire : la directrice est sûre qu'on passera, comme chaque année.",
      ceQuiLeDejoue:
        "Les deux sources de Fleurine Rosset donnent le plan : 900 k€ de sorties pour 194,6 k€ d'entrées d'ici fin juin, un point bas à −285,4 k€ pour 50 k€ de facilité de caisse. Le BFR de −406 k€ montre que les 420 k€ sont les dettes de l'hiver. Marceau Dupré l'a dit : ce qu'on n'emprunte pas à la banque, on l'emprunte à ses fournisseurs ou à la saison suivante, plus cher ; et le comité de crédit ne se réunit pas avant fin mai après la semaine 2. Rejoué sur les trente tirages à la place de la ligne saisonnière, ne rien demander perd 12,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "50 % d'acompte partout, c'est 16 k€ par semaine au lieu de 6,6 : autant d'argent qu'on n'aura pas à emprunter, et Hostéo le fait en un clic.",
      ceQuiLeDejoue:
        "La source « Analyser les réservations directes par période » montre que la demande n'est pas la même partout : l'été et les semaines creuses de l'hiver font 19 k€ de réservations par semaine et y sont sensibles (à Évian, +20 points d'acompte ont fait perdre 10 % des réservations directes ; chaque euro perdu coûte 0,50 € à 0,60 € de marge), quand les fêtes et février ont une liste d'attente qui dépasse la moitié des chambres. 50 % sur ces seules périodes rapporte 10,8 k€ par semaine sans faire fuir personne. Rejoué sur les trente tirages, l'acompte à 50 % partout perd 13,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Ne faire que le réglementaire soulage la trésorerie de 180 k€ avant l'été, et la directrice pense que les clients d'été sont moins exigeants.",
      ceQuiLeDejoue:
        "Zéphyrin Chevallay chiffre le report : 10 % de plus à l'automne, quand les entreprises de la station sont débordées ; une chance sur trois que la chambre froide de quatorze ans lâche cet été, 9 k€ ; 11 k€ de pannes en moyenne l'hiver prochain sans le préventif ; et les douze chambres non rafraîchies, 3 % de recettes en moins dès la réouverture et 16 k€ sur l'été et l'hiver suivants. Un report n'est pas une économie : c'est un emprunt cher à la saison suivante. Rejoué sur les trente tirages à la place du programme complet, il perd 48,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Les fournisseurs connaissent l'hôtel depuis vingt ans : ils peuvent bien attendre quelques semaines, et aucun frais n'est annoncé.",
      ceQuiLeDejoue:
        "La source « Relire les conditions des fournisseurs » : 12,15 % de pénalités par an et 40 € d'indemnité forfaitaire par facture sur 34 factures ; la Blanchisserie du Fier suspend le service à trente jours de retard, linge de la réouverture compris ; Maison Vuarand ne verse sa ristourne de 5,4 k€ qu'aux clients à jour. Un échéancier signé d'avance ne coûte que 1 % de la part reportée. Rejoué sur les trente tirages à la place du paiement à l'échéance avec la remise de pré-saison, laisser glisser perd 11 k€ en moyenne, et ne fait mieux que 2 fois.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "On remplace le réseau, c'est la santé des clients ; le financement, on verra : on garde son sang-froid et on rouvre le 2 juillet.",
      ceQuiLeDejoue:
        "La source « Refaire le plan de trésorerie avec le remplacement du réseau » montre que les 46 k€ de fin juin creusent le point bas au-delà de ce qui est accordé : la Banque des Aravis laisse passer 30 k€ à 16 %, puis rejette les prélèvements et les virements, et un incident dégrade la cotation de l'hôtel. Selim Dardel propose une ligne de 400 k€ en semaine 10, plan à jour à l'appui. Rejoué sur les trente tirages à la place de ce financement, remplacer le réseau sans rien changer perd 12,5 k€ en moyenne, et ne fait mieux que 4 fois.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Un choc thermique à 6 k€ tout de suite, et le réseau à l'automne : 46 k€ de moins au plus creux de la trésorerie.",
      ceQuiLeDejoue:
        "Zéphyrin le dit : sur un réseau entartré, après un simple choc thermique, les analyses de réouverture restent positives presque une fois sur deux, et il faut alors fermer l'étage une semaine et déloger les clients, 17 k€ ; à l'automne, le réseau coûtera 10 % de plus. Annabelle Socquet l'a posé : on ne rouvrira pas avec de la légionelle. Rejoué sur les trente tirages à la place du remplacement financé, le traitement seul perd 30,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "60 k€ d'acompte en juillet, au plus creux de la trésorerie, et un engagement ferme qui sécurise l'hiver : la directrice trouve que ça tombe à pic.",
      ceQuiLeDejoue:
        "La source sur l'occupation de l'hiver : les six semaines des fêtes et de février sont à 98 % à 560 € ; à 280 €, Alpine Horizons y prendrait 252 nuitées que l'hôtel vend deux fois plus cher. Hors pointe, à 60 % et 300 €, ses 462 nuitées remplissent des chambres qui resteraient souvent vides. Marceau Dupré rappelle qu'Alpine accepte trois contre-propositions sur quatre quand on lui retire les semaines de pointe. L'acompte n'est pas un gain : c'est de l'argent des clients. Rejouée sur les trente tirages à la place de la contre-proposition, la signature perd 57,9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Annabelle Socquet pensait être tranquille avec 420 k€ en banque. Qu'est-ce que le BFR de −406 k€ et le fonds de roulement de 14 k€ disaient de ces 420 k€ ?",
    "Pourquoi le BFR d'un hôtel saisonnier est-il négatif en fin de saison, et pourquoi la fermeture le fait-elle remonter ? Quels postes tombent les premiers ?",
    "Ligne saisonnière à 4,8 % sur l'utilisé, prêt à cinq ans à 4,4 %, facilité de caisse à 8,5 % : lequel coûte le moins pour un creux de trois mois, et pourquoi le taux le plus bas n'est-il pas le moins cher ?",
    "« Passer le creux sans emprunter » finit avec +120,7 k€ sur le compte et la plus mauvaise trésorerie corrigée. Comment est-ce possible ? Qu'est-ce qu'un report, un étalement ou un acompte change vraiment ?",
    "Sous le tirage n° 12, Alpine Horizons a accepté la contre-proposition ; une fois sur quatre, il la refuse. Si elle avait été refusée, aurait-elle été une mauvaise décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Le remplacement du réseau d'eau chaude était-il une décision de trésorerie ou de sécurité ? Comment les deux se rejoignent-elles dans la réponse à Selim Dardel ?",
    "Quelle règle laissez-vous à votre successeur pour la prochaine intersaison ? Formulez-la en une phrase, avec le mot « saisonnier » dedans.",
  ],
  prolongement: {
    enonce:
      "Un restaurant de montagne ferme neuf semaines. Sa trésorerie est de 60 k€ au départ. Chaque semaine, il paie 5 k€ de charges fixes et encaisse 2 k€ d'acomptes. Il doit aussi payer 20 k€ en semaine 1, 25 k€ en semaine 2 et 10 k€ en semaine 3. Il rouvre en semaine 8, et ses recettes nettes sont de 15 k€ en semaine 8 et de 20 k€ en semaine 9. 1) Construisez le plan de trésorerie semaine par semaine et donnez son point bas. 2) Une ligne saisonnière à 5 % l'an sur l'utilisé couvre les soldes négatifs : combien coûte-t-elle, en comptant chaque semaine 1/52 d'année ? 3) Le gérant préfère payer 25 k€ de factures de la semaine 2 six semaines plus tard, en cinq factures, à 12,15 % l'an de pénalités et 40 € d'indemnité par facture. Combien cela coûte-t-il ?",
    corrige:
      "1) Semaine 1 : 60 + 2 − 5 − 20 = 37 ; semaine 2 : 37 + 2 − 5 − 25 = 9 ; semaine 3 : 9 + 2 − 5 − 10 = −4 ; puis −7, −10, −13 et −16 en semaine 7 ; semaine 8 : −16 + 2 − 5 + 15 = −4 ; semaine 9 : −4 + 2 − 5 + 20 = 13 k€. Point bas : −16 k€ en semaine 7. 2) Soldes négatifs : 4 + 7 + 10 + 13 + 16 + 4 = 54 k€ sur des semaines ; 54 000 × 5 % / 52 ≈ 51,92 €. 3) 25 000 × 12,15 % × 6 / 52 ≈ 350,48 € de pénalités, plus 5 × 40 = 200 € d'indemnités : environ 550 €, plus de dix fois le coût de la ligne, sans compter la confiance des fournisseurs.",
  },
  evaluation: [
    "Le plan de trésorerie est construit juste, semaine par semaine, et son point bas est lu à la bonne semaine.",
    "L'élève relie trésorerie nette, BFR et fonds de roulement, et explique l'inversion du BFR à la fermeture.",
    "Le financement choisi est justifié par la nature saisonnière du besoin et comparé aux autres en coût réel, pas seulement en taux.",
    "Chaque report, étalement ou acompte est jugé sur ce qu'il coûte après le trimestre, et non sur le solde du compte.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les pénalités de retard sont posées par l'épisode au taux de la BCE majoré de dix points, 12,15 % l'an, avec 40 € d'indemnité forfaitaire par facture : la règle est celle du code de commerce entre professionnels, mais le taux de la BCE change, et le taux de 12,15 % est celui de l'épisode. La légionelle relève d'une surveillance réglementaire de l'eau chaude sanitaire dans les établissements recevant du public avec hébergement : la conduite à tenir après des analyses positives se fixe avec l'autorité sanitaire, pas par un arbitrage de trésorerie. Les dates de versement des cotisations et de la TVA sont celles de l'épisode.",
};
