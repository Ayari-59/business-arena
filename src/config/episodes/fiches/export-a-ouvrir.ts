/**
 * FICHE ENSEIGNANT · ÉPISODE 111, LES DESSERTS QUI PLAISENT À L'EXPORT.
 *
 * Choisir son entrée sur un marché étranger : entrer par étapes, avec le
 * produit qui supporte la route, et partager le risque avec l'importateur par
 * un contrat qui se mérite. Le piège : signer cinq ans d'exclusivité
 * d'enthousiasme, ou monter d'emblée une filiale.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "export-a-ouvrir",
  formations: ["but-tc", "dcg"],
  programme: [
    "BUT TC · Formuler une stratégie de commerce à l'international",
    "DCG · UE 7, Management des organisations",
    "École de commerce · Stratégie d'entreprise",
  ],
  notion:
    "Entrer sur un marché étranger, c'est choisir un mode d'entrée (un importateur, une filiale, ou attendre), un produit qui supporte la route et un contrat qui partage la valeur et le risque. L'erreur classique consiste à signer d'enthousiasme une exclusivité longue sans objectifs, parce que l'occasion « ne se représentera pas », à envoyer le produit goûté au salon sans regarder ce que la route fait à sa DLC, ou à monter une filiale pour garder la marge de l'importateur. Dans l'épisode, Corto Kerouédan, directeur export de la Laiterie de Kerbrélan, reçoit de Distribuciones Nevaria l'offre de 600 supermarchés espagnols contre cinq ans d'exclusivité, un soutien marketing de 110 k€ par an et 90 k€ de référencement. Les desserts frais arrivent avec 21 jours de DLC sur 28, et 12 packs sur 100 sont perdus à la charge de la laiterie : dans un marché moyen, l'offre ne rapporte qu'environ 42 k€ par an, et l'accueil du marché est faible trois fois sur dix. L'élève découvre qu'un test de six semaines dans 60 magasins révèle la rotation de fond, que les desserts UHT de Pontivy, un peu moins vendus mais presque pas perdus, rapportent environ 106 k€ par an, et qu'une exclusivité de deux ans reconduite sur objectifs se quitte si le marché déçoit et se renégocie s'il réussit.",
  objectifs: [
    "Je calcule la marge annuelle d'une offre d'export, pertes à ma charge et frais commerciaux déduits, et je la compare d'un produit à l'autre.",
    "Je compare les modes d'entrée sur un marché étranger (importateur, test, filiale) par ce qu'ils engagent et ce qu'ils permettent de réviser.",
    "Je distingue une information mesurée (la rotation de fond d'un test) d'une impression (le stand de dégustation, la moyenne qui inclut la curiosité).",
    "Je choisis les clauses d'un contrat de distribution (durée, exclusivité, objectifs) en fonction du risque que je veux pouvoir quitter.",
  ],
  prerequis:
    "Les modes d'entrée sur un marché étranger, le calcul d'une marge sur coût variable et la notion de valeur actuelle nette doivent avoir été vus en cours. Le vocabulaire de la distribution internationale (importateur exclusif, référencement, VIE) peut être découvert pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/export-a-ouvrir?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, la marge annuelle que l'offre de Nevaria rapporterait dans le scénario moyen et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (signer, tester, filiale, décliner) et le contrat proposé en semaine 11, où la classe se partage entre les cinq ans demandés, deux ans sur objectifs et trois ans avec soutien. Un binôme qui a fini tôt refait le calcul de la semaine 1 avec les desserts UHT de Pontivy.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir de l'offre et de l'étude de marché : 600 magasins × 16 packs × 52 semaines = 499 200 packs vendus ; pour vendre 88 packs, il faut en livrer 100, soit 1,14 / 0,88 ≈ 1,295 € de coût par pack vendu, et 0,305 € de marge ; 152 k€ moins 110 k€ de soutien : 42 k€. Vous faites expliquer les valeurs éloignées (119,6, 23,8, −48), puis vous refaites le calcul en UHT : environ 106 k€.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (frais par la plateforme, UHT, frais en direct) et de la semaine 11. Pour la semaine 1, vous faites lire le conseil d'Ainhoa Bengoetxea : un test d'abord, puis une exclusivité courte qui se mérite. Pour la semaine 11, vous faites lire la source sur les contrats : sans objectifs, Nevaria pousse 15 % de moins dès la deuxième année, et l'on ne peut ni partir ni renégocier avant cinq ans.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, l'accueil du marché est fort : « Entrer par étapes » crée 503 k€ de valeur estimée, l'attentisme en perd 78 k€ (la crème fraîche des restaurants partie chez Nordal), « Signer d'enthousiasme » en perd 203 k€ ; sur les trente tirages, la première va de −118 à +505 k€ (209 k€ en moyenne) et crée de la valeur 18 fois, la deuxième jamais. Vous montrez la décision où le tirage de la classe ne dit rien : généraliser quoi qu'il arrive fait ici exactement comme généraliser sur le seuil, parce que le test était bon ; sur les trente tirages, il perd 87 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : on n'engage pas cinq ans avant d'avoir vu ses produits tourner en rayon. Vous la déclinez : chiffrer l'offre pertes comprises, envoyer le produit qui supporte la route, tester et lire la rotation de fond, ne généraliser qu'au-dessus du seuil, accorder une exclusivité qui se mérite par des objectifs, garder un relais léger sur place plutôt qu'une filiale sans volumes. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 42,
    etapes: [
      "Source « Lire l'étude du marché espagnol des desserts lactés » : dans un marché moyen, 16 packs par magasin et par semaine, curiosité passée. Sur 600 magasins et 52 semaines : 600 × 16 × 52 = 499 200 packs vendus par an.",
      "Source « Chiffrer l'offre de Nevaria » : prix de cession 1,60 € le pack ; coût variable rendu à Saragosse 1,14 € (0,98 € de fabrication, 0,16 € de transport) ; 12 packs sur 100 livrés sont refusés ou démarqués, à la charge de la laiterie, produits et transportés mais jamais payés.",
      "Coût d'un pack vendu : pour en vendre 88, il faut en livrer 100, soit 1,14 / 0,88 ≈ 1,295 € ; marge par pack vendu : 1,60 − 1,295 ≈ 0,305 €.",
      "Marge annuelle avant soutien : 499 200 × 0,3045 ≈ 152 029 € ; moins le soutien marketing de 110 000 € par an : environ 42 k€. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 5 k€ près, proche à 15. Les 90 k€ de référencement se paient une fois, au lancement, et ne sont pas dans la marge annuelle.",
      "Pour comparer, les desserts UHT de Pontivy : 1,02 + 0,06 = 1,08 € rendus, 1 pack perdu sur 100, 15 % de ventes en moins ; 1,60 − 1,08 / 0,99 ≈ 0,509 € par pack, sur 424 320 packs, soit environ 106 k€ après soutien. Dans un marché faible (7 packs, plus de pertes), l'offre en frais perd de l'argent chaque année.",
    ],
    erreurs: [
      {
        valeur: 119.6,
        cause:
          "Les pertes oubliées : 499 200 × (1,60 − 1,14) − 110 000. Les 12 packs sur 100 refusés ou démarqués sont à la charge de la laiterie.",
      },
      {
        valeur: 23.8,
        cause:
          "Les pertes retirées comme si les 499 200 packs étaient les packs livrés (0,88 × 1,60 − 1,14 = 0,268 € par pack) : les 16 packs de l'étude sont des packs vendus, et il faut en livrer davantage.",
      },
      {
        valeur: -48,
        cause:
          "Les 90 k€ de référencement déduits de la marge annuelle : ils se paient une fois, au lancement, pas chaque année.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Six cents supermarchés d'un coup, le président y tient, et Nordal a déjà appelé deux fois : on n'aura pas cette occasion deux fois.",
      ceQuiLeDejoue:
        "Le chiffrage de l'offre donne environ 42 k€ par an dans un marché moyen, et l'étude de marché un accueil faible trois fois sur dix, où l'offre perd de l'argent ; l'exclusivité de cinq ans est sans objectif de volume, donc impossible à quitter. Ainhoa Bengoetxea le dit : « Ne signe jamais cinq ans d'exclusivité avant d'avoir vu tes produits tourner en rayon. » Rejoué sur les trente tirages à la place du test, signer perd 197 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Nordal a une filiale à Madrid ; avec la nôtre, la marge de l'importateur serait pour nous.",
      ceQuiLeDejoue:
        "Une filiale coûte 60 k€ de création puis 200 k€ par an de frais fixes, que seul un accueil fort couvre ; elle référence moins de magasins, plus cher, et vend moins en rayon faute de réseau. Telmo Urquijo, éconduit, part chez Nordal avec la crème fraîche de ses restaurants, 20 k€ de marge par an. La filiale de Nordal vend 60 M€ avec une usine près de Valence : rien de comparable. Rejouée sur les trente tirages à la place du test, la filiale perd 380 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "C'est ce que Nevaria a goûté et ce qu'il demande, et les Espagnols achètent leurs desserts au rayon frais.",
      ceQuiLeDejoue:
        "La route et la plateforme prennent 7 jours : les desserts frais arrivent avec 21 jours de DLC sur 28, à deux jours du minimum des enseignes, et 12 packs sur 100 sont perdus dans un marché moyen, davantage s'il est faible. Fanchon Lozac'h propose les UHT de Pontivy, 120 jours de DLC, 1 pack perdu sur 100, et Nordal lui-même fait venir de France ses crèmes UHT. Rejouée sur les trente tirages à la place des UHT, la gamme fraîche perd 139 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Nevaria le fait pour la plupart de ses fournisseurs étrangers, et l'on n'a rien à changer chez nous.",
      ceQuiLeDejoue:
        "Le comparatif de l'étiquetage le dit : 15 k€ de mise en place, 4 centimes par pack, deux jours de plus sur la plateforme, et trois importateurs sur dix qui sur-étiquettent laissent passer une erreur la première année, le plus souvent sur les allergènes : 25 k€ de retrait et deux semaines sans ventes. L'emballage bilingue coûte 12 k€ de clichés et sert en France comme en Espagne. Rejoué sur les trente tirages à la place du bilingue, le sur-étiquetage perd 57 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le président la veut, et l'on sera prêt pour la rentrée avec une vraie présence à Madrid.",
      ceQuiLeDejoue:
        "La source sur le relais le chiffre : 60 k€ de création, 200 k€ par an, une filiale qui ne vend rien tant que Nevaria distribue, et un importateur qui, la voyant se monter, accepte un contrat à objectifs quatre fois sur dix de moins. Un VIE coûte 3 k€ par mois et fait vendre 8 % de plus là où il suit les rayons. Rejouée sur les trente tirages à la place du VIE, la filiale lancée en semaine 6 perd 267 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le plan présenté au comité prévoit les 600 magasins à la rentrée, et Telmo Urquijo annonce un test excellent.",
      ceQuiLeDejoue:
        "Le tableau de Nevaria fait la moyenne des six semaines, lancement compris ; la lecture magasin par magasin montre que les deux premières semaines vendent 40 % de plus que la suite. Seule la rotation de fond, comparée au seuil qui paie le soutien et le référencement, dit si 600 magasins gagneront de l'argent. Sous le tirage n° 12, le test était au-dessus du seuil et les deux choix se valent ; rejoué sur les trente tirages, généraliser quoi qu'il arrive perd 87 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Iwan Szymanski le conseille : un importateur qui part chez Nordal, c'est le travail du trimestre perdu, et la crème de ses restaurants avec.",
      ceQuiLeDejoue:
        "La source sur les contrats le dit : sans objectifs, Nevaria pousse 15 % de moins dès la deuxième année, et l'on ne peut ni partir ni renégocier avant cinq ans. Deux ans reconduits sur objectifs se quittent si le marché décroche et se renégocient s'il tient, 10 centimes de plus par pack ; Anxo Pazos rappelle qu'une exclusivité se paie d'objectifs, « c'est l'usage ». Rejoué sur les trente tirages à la place des deux ans, les cinq ans perdent 81 k€ en moyenne et ne font mieux que 3 fois, quand Nevaria aurait refusé.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une occasion à saisir vite, d'autres une marge à reprendre à l'importateur. Qu'est-ce qui, dans le chiffrage de l'offre et l'étude de marché, montrait qu'il fallait d'abord savoir si les desserts tourneraient ?",
    "Les desserts frais se vendent mieux, les UHT rapportent environ 106 k€ par an contre 42 k€. Comment est-ce possible ? Que fait la route à la DLC, et qui paie ce que l'enseigne refuse ?",
    "Le tableau de Nevaria et la lecture magasin par magasin ne donnent pas la même rotation. Laquelle sert à décider de généraliser, et pourquoi ?",
    "Sous le tirage n° 12, l'accueil du marché était fort : ceux qui ont généralisé quoi qu'il arrive n'ont rien perdu. Avaient-ils raison ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Une filiale garde la marge de l'importateur. Pourquoi coûte-t-elle pourtant plus qu'elle ne rapporte ici, et que fait-elle à la relation avec Nevaria ?",
    "Cinq ans sans objectifs, deux ans sur objectifs, sans exclusivité : que partage chaque contrat entre la laiterie et l'importateur, et lequel permet de partir si le marché décroche ?",
    "Quelle règle gardez-vous pour entrer sur un marché étranger ? Formulez-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie peut exporter des yaourts au Portugal par un importateur : 400 magasins, 10 packs par magasin et par semaine dans le scénario central, prix de cession 2,00 € le pack, soutien marketing de 60 000 € par an, référencement de 150 € par magasin, payé une fois. En frais : 1,30 € de coût rendu par pack, et 15 packs sur 100 livrés perdus à la charge de la fromagerie. En UHT : 1,35 € rendu, 1 pack sur 100 perdu, et 15 % de ventes en moins. 1) Calculez, pour chaque gamme, la marge par pack vendu, puis la marge annuelle après soutien marketing. 2) Calculez la valeur actuelle nette de chaque gamme sur cinq ans à 9 % (un euro par an pendant cinq ans vaut 3,89 €), référencement déduit. 3) Quelle gamme envoyez-vous ?",
    corrige:
      "1) Packs vendus en frais : 400 × 10 × 52 = 208 000. Frais : 2,00 − 1,30 / 0,85 ≈ 2,00 − 1,529 = 0,471 € par pack ; 208 000 × 0,4706 ≈ 97 882 € ; après soutien : ≈ 37 882 €. UHT : 2,00 − 1,35 / 0,99 ≈ 2,00 − 1,364 = 0,636 € par pack ; 208 000 × 0,85 = 176 800 packs ; 176 800 × 0,6364 ≈ 112 509 € ; après soutien : ≈ 52 509 €. 2) Référencement : 400 × 150 = 60 000 €. Frais : 37 882 × 3,89 − 60 000 ≈ 87 300 € (87 349 € avec le multiple exact de 3,8897). UHT : 52 509 × 3,89 − 60 000 ≈ 144 260 € (144 242 € avec le multiple exact). 3) L'UHT : il se vend moins, mais ne se perd presque pas, et crée environ 57 000 € de valeur de plus sur cinq ans.",
  },
  evaluation: [
    "La marge annuelle de l'offre est calculée juste (environ 42 k€) à partir des sources nommées, pertes ramenées aux packs vendus et soutien marketing déduit, sans y mettre le référencement.",
    "Le mode d'entrée est justifié par ce qu'il engage et ce qu'il permet de réviser (test, filiale, signature), avec les chiffres des sources.",
    "Le choix de la gamme tient compte de ce que la route fait à la DLC et de qui paie les pertes.",
    "La généralisation est décidée sur la rotation de fond comparée au seuil, et le contrat sur le risque que l'on veut pouvoir quitter.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'obligation d'étiqueter dans la langue du pays de vente et de mettre en évidence les allergènes relève du droit européen de l'information des consommateurs sur les denrées alimentaires ; l'épisode la pose simplement, et le détail des mentions est à vérifier. Les clauses du contrat de distribution exclusive (durée, objectifs, sortie) relèvent du droit espagnol et du droit européen de la concurrence : l'épisode les simplifie. Les conditions du volontariat international en entreprise (VIE) et son coût mensuel sont des valeurs de l'épisode, non des montants réglementaires.",
};
