/**
 * FICHE ENSEIGNANT · ÉPISODE 104, L'EDI QUI S'IMPOSE.
 *
 * L'échange de données informatisé entre organisations : un échange ne marche
 * que sur un langage commun, et chaque ressaisie est une erreur possible. Le
 * piège : garder ses habitudes, ou appeler « numérique » un PDF ou un format
 * maison que le partenaire ne sait pas lire.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "edi-qui-s-impose",
  formations: ["stmg", "bts-gpme"],
  programme: [
    "STMG · Terminale, systèmes d'information de gestion, Thème 4 · Système d'information et échange",
    "BTS GPME · Bloc 1, Gérer la relation avec les clients et les fournisseurs de la PME",
  ],
  notion:
    "Un échange entre deux organisations ne fonctionne que si l'une écrit dans le langage que l'autre sait lire : l'échange de données informatisé (EDI) remplace la ressaisie par des messages normalisés, et le standard commun (codes articles, codes des lieux de livraison, unités, étiquette logistique) vaut pour tous les partenaires qui l'utilisent. L'erreur classique consiste à garder ses habitudes (recopier les commandes, demander une dérogation), à corriger les messages rejetés un par un sans toucher à la fiche article qui les fait rejeter, ou à appeler « numérique » ce qui ne l'est pas pour le partenaire : un PDF par mail, un tableur maison, un chiffrement que personne d'autre ne connaît. Dans l'épisode, Lou Le Bihan tient l'administration des ventes de la Laiterie de Kerbrélan, à Loudéac, quand Celtis impose l'EDI : 6 % des commandes recopiées du portail portent une erreur, chacune coûte environ 220 € de pénalité et de produits frais perdus, et 12 % des avis d'expédition et des factures sont rejetés. L'élève découvre qu'au rythme de 126 commandes par semaine la ressaisie coûte plus de 2 000 € par semaine quand le logiciel relié en coûte moins de 500, qu'une fiche article mise au standard en une journée et demie fait tomber les rejets de 12 % à 2 %, et que le canal sécurisé, la facture électronique et l'avis d'expédition se choisissent sur la même règle : le format que tous savent lire.",
  objectifs: [
    "Je calcule le volume d'un flux d'échanges (commandes, messages) à partir de ses composantes, et ce que coûte sa ressaisie.",
    "J'explique pourquoi un échange entre organisations suppose un format commun, et je distingue une facture électronique structurée d'un PDF envoyé par mail.",
    "Je traite la cause d'un rejet (la fiche article hors standard) plutôt que chaque message rejeté.",
    "Je choisis les partenaires à raccorder en comparant le coût d'un raccordement à ce qu'il fait gagner, selon le volume de chacun.",
  ],
  prerequis:
    "La notion de système d'information, de flux d'information entre une organisation et ses partenaires, et la chaîne commande, livraison, facture doivent avoir été vues en cours. Le vocabulaire de l'EDI (message normalisé, avis d'expédition, plateforme agréée) peut être découvert pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/edi-qui-s-impose?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le nombre de commandes de Celtis attendues en semaine 3 et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse à la semaine 4 (garder le serveur, mail, chiffrement gratuit ou canal reconnu) et celle de la semaine 6 sur la facture électronique, où la classe se partage souvent. Un binôme qui a fini tôt calcule ce que coûte une semaine de commandes recopiées, puis une semaine avec le logiciel relié.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe : 42 magasins qui commandent chacun 3 fois par semaine, 126 commandes. Vous faites expliquer les valeurs éloignées (42, 252, 378), puis vous montrez le réel du modèle sous le tirage n° 12 : 132 commandes, la semaine ayant été un peu plus chargée que la moyenne. Vous enchaînez : chaque commande appelle deux messages en retour, soit 252 messages par semaine, dont environ 30 rejetés à 12 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (recopier, écran web, logiciel relié, dérogation), de la semaine 4 et de la semaine 6. Pour la réception, vous faites calculer au tableau le coût d'une semaine : 126 × 6 % × 220 € d'erreurs et 126 × 6 minutes de saisie à 30 € l'heure, contre 0,5 % d'erreurs et 300 € d'abonnement. Pour la facture, vous faites lire la source sur la réforme : un PDF par mail n'est pas une facture électronique.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Un langage commun, sans ressaisie » finit 7,5 k€ sous le budget des échanges, « Le moins cher tout de suite » 25 k€ au-delà et « Faire comme d'habitude » 32,5 k€ au-delà ; sur les trente tirages, la première tient le budget 30 fois, les deux autres jamais. Vous montrez la seule décision où le tirage de la classe ment : garder le serveur au mot de passe partagé ne coûte ici que 0,5 k€, parce qu'aucune facture n'a été détournée, mais 4 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : un échange se règle dans le langage que le partenaire sait lire, et une erreur se corrige à sa source. Vous la déclinez sur les cinq échanges (commandes, fiches articles, canal sécurisé, facture, avis d'expédition et étiquette) et vous ajoutez la règle de la semaine 10 : on raccorde d'abord ceux qui échangent le plus. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 126,
    etapes: [
      "Le repère de la prévision et le message de Celtis : 42 magasins Celtis sont livrés par la laiterie, et chacun commande 3 fois par semaine.",
      "Commandes d'une semaine : 42 × 3 = 126 commandes. La semaine 3 est une semaine ordinaire : aucune promotion n'y est annoncée.",
      "La source « Comparer les volumes de commandes à l'an dernier » (+3 % en un an) est un bruit : la hausse est déjà dans les 126 commandes d'aujourd'hui, et elle ne change pas l'ordre de grandeur (126 × 1,03 ≈ 130).",
      "Ce que donne le modèle sous le tirage n° 12 : 132 commandes en semaine 3 (132,5), la semaine ayant été environ 5 % au-dessus de la moyenne. L'épisode juge juste à 8 commandes près, proche à 20 : 126 est juste ; selon les trente tirages, le réel va de 107 à 145.",
      "Ce qu'en tire Lou : 126 commandes, c'est 252 messages en retour (un avis d'expédition et une facture par commande), dont environ 30 rejetés à 12 %, et, en ressaisie, 126 × 6 % ≈ 7,6 commandes fausses par semaine, environ 1 660 € de pénalités et de produits perdus.",
    ],
    erreurs: [
      {
        valeur: 42,
        cause:
          "Une commande par magasin : le « 3 fois par semaine » du repère est oublié.",
      },
      {
        valeur: 252,
        cause:
          "Les messages comptés à la place des commandes (126 × 2) : l'avis d'expédition et la facture sont des réponses aux commandes, pas des commandes.",
      },
      {
        valeur: 378,
        cause:
          "Les commandes des trois premières semaines additionnées (126 × 3) : la prévision porte sur la seule semaine 3.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Rien ne change pour l'équipe, qui connaît le fax et le mail, et l'on gagne du temps avant d'acheter un outil.",
      ceQuiLeDejoue:
        "Le message de Celtis le disait : la dérogation est facturée chaque semaine, 500 €, et Bastien Ollivier prévient qu'« elle ne durera pas ». Les erreurs restent, 7 % des commandes à 220 € chacune, environ 1 940 € par semaine, plus 378 € de saisie. Le logiciel relié coûte 4 000 € de mise en place et 300 € par semaine, pour 0,5 % d'erreurs une fois les trois semaines de réglage passées. Rejouée sur les trente tirages à la place du logiciel relié, la dérogation perd 24 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Le PDF part tout de suite, et tout le monde sait le lire : c'est plus rapide que de corriger un message.",
      ceQuiLeDejoue:
        "La source « Lire les motifs des messages rejetés » montre que presque tous les rejets viennent des mêmes fiches articles (code article hors standard, lieu de livraison absent, carton compté en unités) : le défaut revient au message suivant. Celtis ne traite pas les PDF, et chaque document rejeté coûte alors 55 € au lieu de 35 €. Mettre les fiches au standard coûte 600 € une fois et fait passer les rejets de 12 % à 2 %, d'environ 30 à 5 messages par semaine. Rejoué sur les trente tirages à la place des fiches, le PDF perd 15 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le serveur marche depuis des années et rien n'est jamais arrivé : pourquoi payer un canal nouveau ?",
      ceQuiLeDejoue:
        "Malo Jézéquel prévient qu'un mot de passe connu de dix personnes peut être intercepté, qu'une laiterie voisine s'est fait détourner une facture et qu'une fraude coûte vite 15 000 € ; Celtis exige un canal reconnu à partir de la semaine 8, et facture 400 € par semaine à qui ne l'a pas. Le canal reconnu coûte 1 500 € et 50 € par semaine. Sous le tirage n° 12, aucune facture n'a été détournée et le serveur ne perd que 0,5 k€ ; sur les trente tirages, il perd 4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Un PDF envoyé par mail, c'est déjà une facture numérique, et le client la reçoit tout de suite.",
      ceQuiLeDejoue:
        "La source sur la réforme le dit : une facture électronique est un fichier structuré, lu sans ressaisie et transmis par une plateforme agréée ; un PDF par mail n'en est pas une. À partir de la semaine 9, Celtis refuse toutes les factures PDF, environ 126 par semaine, à refaire et payées en retard. La plateforme coûte 2 000 € de mise en place et 0,30 € par facture. Rejoué sur les trente tirages à la place de la plateforme, le PDF perd 6,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Un tableau de nos expéditions envoyé chaque soir, c'est simple, et le transporteur a enfin l'information.",
      ceQuiLeDejoue:
        "Erwan Le Du le dit dans sa source : son logiciel lit les avis d'expédition au même standard que Celtis, mais un fichier maison, il doit le recopier. L'entrepôt de Celtis, lui, lit l'étiquette normalisée de chaque palette. Avec le tableur, 2,5 % des 350 palettes sont encore refusées, près de 9 par semaine à 110 €, plus 60 € de tableur ; avec le standard, 0,5 %, moins de 2 palettes, pour une imprimante d'étiquettes à 600 € une fois. Rejoué sur les trente tirages à la place du standard, le tableur perd 3,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Tout le monde au même régime, en une fois : c'est plus juste et plus simple à gérer.",
      ceQuiLeDejoue:
        "La source « Calculer ce que coûte une commande, client par client » sépare les deux cas : les deux autres enseignes passent 140 commandes par semaine, toutes recopiées, et parlent déjà le standard ; les 25 crémeries et épiceries fines commandent une ou deux fois par mois, et chacune coûte environ 300 € à raccorder, soit 7 500 €. Rejoué sur les trente tirages à la place des deux seules enseignes, tout raccorder perd 7,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de volumes, d'autres une enseigne trop exigeante. Qu'est-ce qui, dans les erreurs de saisie du mois dernier, montrait que la ressaisie était la cause ?",
    "Corriger un message rejeté prend un quart d'heure et le renvoie vite. Pourquoi ne règle-t-il rien, quand une journée et demie sur les fiches articles règle tout ? Qu'est-ce que le standard commun change pour les autres clients ?",
    "Un PDF, un tableur, un chiffrement gratuit : ces trois choix ont un point commun. Lequel ? Qui, à chaque fois, doit recopier ou rejeter ?",
    "Sous le tirage n° 12, ceux qui ont gardé le serveur au mot de passe partagé n'ont pas eu de facture détournée, et ne perdent que 0,5 k€. Avaient-ils raison ? Que dit la perte moyenne de 4 k€ sur les trente tirages, et qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Raccorder 25 crémeries qui commandent deux fois par mois, ou deux enseignes qui passent 140 commandes par semaine : comment compare-t-on le coût d'un raccordement à ce qu'il fait gagner ?",
    "Quelle règle gardez-vous pour tout nouvel échange avec un partenaire ? Formulez-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie reçoit 60 commandes par semaine d'une centrale d'achat, qu'elle recopie à la main : 5 minutes par commande, à 30 € de l'heure, et 5 % de commandes fausses, qui coûtent chacune 180 € de pénalité et de produits perdus. Un logiciel relié à l'EDI coûte 3 500 € de mise en place et 250 € par semaine ; il ne demande plus que 0,3 minute par commande, et 0,5 % des commandes restent fausses. 1) Calculez le coût d'une semaine dans chaque cas. 2) Au bout de combien de semaines la mise en place est-elle remboursée ? 3) Comparez le coût des deux solutions sur un trimestre de 13 semaines. 4) La centrale propose aussi d'envoyer ses factures en PDF par mail : pourquoi n'est-ce pas une facture électronique ?",
    corrige:
      "1) Ressaisie : saisie 60 × 5 / 60 × 30 = 150 € ; erreurs 60 × 5 % × 180 = 540 € ; total 690 € par semaine. Logiciel relié : saisie 60 × 0,3 / 60 × 30 = 9 € ; erreurs 60 × 0,5 % × 180 = 54 € ; abonnement 250 € ; total 313 € par semaine. 2) Le logiciel fait gagner 690 − 313 = 377 € par semaine : 3 500 / 377 ≈ 9,3, la mise en place est remboursée au cours de la dixième semaine. 3) Ressaisie : 13 × 690 = 8 970 € ; logiciel relié : 3 500 + 13 × 313 = 7 569 € ; le logiciel coûte 1 401 € de moins dès le premier trimestre, et 377 € de moins chaque semaine ensuite. 4) Une facture électronique est un fichier structuré, que le logiciel du client lit sans ressaisie et qui passe par une plateforme agréée ; un PDF est une image de facture, qu'il faut encore lire et recopier.",
  },
  evaluation: [
    "Le nombre de commandes de la semaine 3 est calculé à partir du repère (42 magasins, 3 commandes par semaine), et l'élève distingue les commandes des messages qu'elles appellent.",
    "Le coût de la ressaisie est chiffré (temps et erreurs) et comparé à celui du logiciel relié, avec les chiffres des sources.",
    "Chaque échange avec un partenaire est choisi sur le format que ce partenaire sait lire : l'élève explique pourquoi le PDF, le tableur ou le chiffrement maison obligent l'autre à recopier ou à rejeter.",
    "Les rejets sont traités à leur cause, la fiche article, et le choix des partenaires à raccorder est justifié par leur volume.",
    "L'élève distingue, sur la décision de la semaine 4, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le calendrier réel de la réforme de la facturation électronique entre entreprises (obligation de réception pour toutes, obligation d'émission échelonnée selon la taille, plateformes agréées par l'administration) est à vérifier sur les textes en vigueur avant de l'énoncer : dans l'épisode, c'est l'enseigne qui fixe l'échéance de la semaine 9. La dérogation facturée et la pénalité de 400 € pour un canal non reconnu sont des conditions commerciales fictives de Celtis, non des règles de droit.",
};
