/**
 * FICHE ENSEIGNANT · ÉPISODE 6, LE SITE QUI NE VEND PAS.
 *
 * Lire un site marchand comme un entonnoir, étape par étape, avant d'acheter
 * des visites : le site perd les artisans qu'il a déjà, et les agences qui
 * pourraient en amener n'y gagnent rien.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "site-qui-ne-vend-pas",
  formations: ["bts-ndrc", "but-tc", "seconde-pro-rc"],
  programme: [
    "BTS NDRC · Bloc 2, Relation client à distance et digitalisation",
    "BUT TC · Gérer une activité digitale",
    "2de pro RC · Intégrer la relation client dans un cadre « omnicanal »",
  ],
  notion:
    "Un taux de conversion faible ne dit pas où le site perd ses clients : il faut reconstituer l'entonnoir, de la visite à la commande, et réparer l'étape qui fuit. L'erreur classique consiste à acheter plus de visites, parce que le compteur monte et que le coût par visite baisse, ou à refaire tout le site ; l'autre consiste à ignorer les agences, qui voient le site comme un concurrent. Dans l'épisode, Pauline Duval, responsable du commerce en ligne d'Arvel Distribution, a 8 100 visites et 60 commandes par semaine (0,74 % de conversion) pour 130 au plan. L'entonnoir le montre : 5 600 visites de professionnels, 1 950 seulement voient leurs prix pro (l'ouverture du compte attend quatre jours la validation de l'agence, et 62 % abandonnent avant), 195 paniers, 60 commandes, six paniers sur dix arrêtés à l'étape de livraison. Les agences n'en parlent pas, parce que la vente en ligne sort de leur chiffre et de leur prime, alors que 85 % des commandes en ligne viennent de leurs clients, dont les achats au comptoir n'ont pas baissé. L'élève découvre que deux corrections à 6 000 € valent mieux que 2 000 € de publicité par semaine en plus, qu'une vente attribuée à l'agence la fait recommander le site, et qu'un nouveau tunnel se teste avant d'être déployé.",
  objectifs: [
    "Je reconstitue un entonnoir de conversion, étape par étape, et je trouve l'étape où le site perd le plus de clients.",
    "Je calcule ce qu'une correction de l'entonnoir et un surcroît de publicité rapportent en commandes et en marge.",
    "Je relie les canaux de vente : j'attribue la vente en ligne à l'agence du client, et j'ouvre le retrait en agence.",
    "Je fais tester une modification sur une partie des visiteurs avant de la généraliser.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de visite, de taux de conversion, de panier et de marge par commande doivent être connues. L'entonnoir de conversion, le test sur une moitié des visiteurs et l'attribution d'une vente entre canaux peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/site-qui-ne-vend-pas?hasard=25 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le nombre de commandes en ligne prévu pour la semaine 3, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : les sources ouvertes en semaine 1 (l'entonnoir a-t-il été reconstitué ?) et la décision sur le nouveau tunnel en semaine 5. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 3, celle des agences.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous dessinez l'entonnoir au tableau avec la classe : 5 600 professionnels, 1 950 qui voient leurs prix, 195 paniers, 60 commandes, et le taux de passage de chaque étape. Vous faites chercher ce que les deux corrections changent (le compte ouvert avec le SIRET, les prix pro dès la connexion) et ce qu'elles ne changent pas en semaine 3 (les agences, la livraison). Vous comparez au modèle : 82,6 commandes sous le tirage de la classe. Vous faites expliquer les valeurs éloignées : 130, 60, 158.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (publicité, corrections, refonte, attente), de la semaine 3 (agences) et de la semaine 5 (tunnel). Pour la publicité, vous faites calculer au tableau combien de professionnels amènent 2 200 visites payantes, quand sept visiteurs payants sur dix sont des particuliers que le site refuse. Pour le tunnel, vous faites lire la source sur les paniers abandonnés : d'où viennent les « +30 % » de l'agence web ?",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 25, « Réparer l'entonnoir et aligner les agences » finit 17,9 k€ au-dessus du budget, l'attentiste 58,7 k€ en dessous, et « Acheter du trafic » 126 k€ en dessous ; sur les trente tirages, la première tient le budget 30 fois, les deux autres jamais. Vous montrez ensuite la décision où le hasard compte le plus : sous ce tirage, le nouveau tunnel ne gagne pas, et le déployer pour tous coûte 29,8 k€.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : regarder où l'on perd ceux qui viennent avant d'en acheter d'autres, mesurer chaque étape, tester avant de déployer, et faire gagner aux agences ce que le site leur apporte. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 82.6,
    etapes: [
      "Source « Reconstituer l'entonnoir de la semaine dernière » : 8 100 visites, dont 5 600 de professionnels ; 1 950 voient leurs prix pro (35 %), 195 font un panier (10 %), 60 commandent (31 %). La fuite principale est la première étape : sans compte validé, l'artisan voit les prix publics, 25 % au-dessus de ses prix pro.",
      "La bonne décision corrige cette étape dès la semaine 2 : compte ouvert en dix minutes avec le SIRET, prix pro affichés dès la connexion. Elle ne touche pas encore à l'étape de livraison (le tunnel vient en semaine 5) ni aux agences (semaine 3, effet à partir de la semaine 4).",
      "Dans le modèle, la part des professionnels qui voient leurs prix passe d'environ 31 % à 47 %, et la part qui fait un panier de 10 % à 10,8 %, la validation des paniers restant à 38 % : les commandes sont multipliées par environ 1,6. Partant d'une cinquantaine de commandes en semaine 1, on en attend un peu plus de 80.",
      "Sous le tirage n° 25, le modèle donne 82,6 commandes (82,65) en semaine 3 ; 50,6 si l'on attend ou si l'on lance la refonte, 54,9 si l'on double la publicité. Le chiffre dépend du hasard (de 58,7 à 97,6 selon les trente tirages, 80,8 en moyenne). Une estimation qui multiplie les 60 commandes par 1,5 (90) est jugée juste : l'épisode accepte 8 commandes d'écart, et 20 pour « proche ».",
    ],
    erreurs: [
      {
        valeur: 130,
        cause:
          "Le plan d'affaires pris pour une prévision : 130 commandes par semaine, c'est ce que le site devait faire à ce stade, pas ce qu'il fera en deux semaines.",
      },
      {
        valeur: 60,
        cause:
          "Le chiffre de la semaine dernière reporté tel quel, comme si la correction du compte et des prix pro ne changeait rien.",
      },
      {
        valeur: 158,
        cause:
          "Les 62 % d'abandons pendant la validation tous récupérés : 1 950 / 0,38 ≈ 5 130 professionnels qui verraient leurs prix, soit 2,6 fois plus de commandes. Tous ne demandaient pas un compte, et l'étape de livraison fuit toujours.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le coût par visite n'a jamais été aussi bas, le prestataire promet presque deux fois plus de monde : plus de visiteurs, c'est plus de commandes.",
      ceQuiLeDejoue:
        "L'entonnoir montre que le site perd déjà 3 650 des 5 600 professionnels qui viennent, avant même qu'ils voient leurs prix : en acheter d'autres, c'est les faire passer par la même fuite. Le rapport du prestataire ne dit rien des commandes, et Bénédicte conseille : « Avant d'acheter des visiteurs, regarde où tu perds ceux que tu as déjà. » Rejouée sur les trente tirages à la place des deux corrections, la publicité doublée perd 58,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Le site est daté : une refonte complète par une agence web règle tout d'un coup, et montre au comité qu'on agit.",
      ceQuiLeDejoue:
        "Les dix artisans observés disent ce qui bloque : l'accord de l'agence pour ouvrir un compte, les prix publics avant connexion, la disponibilité à la livraison. Deux corrections ciblées coûtent 6 000 € et sont en ligne en semaine 2 ; la refonte coûte 30 000 €, n'est annoncée qu'en semaine 10, et gèle le site d'ici là. Rejouée sur les trente tirages à la place des corrections, elle perd 57,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Les agences doivent obéir à la direction : une note signée par Bénédicte suffit, et ne coûte rien.",
      ceQuiLeDejoue:
        "Baptiste Lantelme dit pourquoi il freine : « Chaque commande en ligne sort de mon chiffre, et de la prime de mes vendeurs. » La source sur les commandes en ligne montre que la perte qu'il redoute n'existe pas (achats au comptoir à −1 % en six mois), « mais leur prime n'en sait rien ». Une note ne change pas la prime : les agences mettent l'affiche, puis l'oublient. Rejouée sur les trente tirages à la place de l'attribution de la vente à l'agence, elle perd 32,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Si les agences freinent, autant les contourner : un e-mailing direct aux artisans, avec 5 % de remise, amène des visites dès la semaine 4.",
      ceQuiLeDejoue:
        "Les agences sont le canal qui amène les artisans : 85 % des commandes en ligne viennent de leurs clients. Les contourner les dresse contre le site, et la remise est payée sur des commandes que ces clients auraient passées. Attribuer chaque vente en ligne à l'agence du client coûte 2 % du chiffre d'affaires en ligne, et fait dire au directeur d'agence que ses vendeurs donneront l'adresse du site à chaque client. Rejoué sur les trente tirages à la place de l'attribution, le contournement perd 50,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le tunnel est prêt, l'agence web annonce +30 % de commandes chez ses autres clients, et sur l'ordinateur du bureau il est clair et rapide.",
      ceQuiLeDejoue:
        "La source sur les paniers abandonnés dit que 58 % des paniers sont faits sur téléphone, depuis le chantier, et que les « +30 % » viennent d'un site de décoration pour particuliers, mesurés sur ordinateur : l'essai sur grand écran ne prouve rien. Un test sur la moitié des visiteurs, téléphone et ordinateur à part, coûte 500 € de plus et dit en deux semaines si le tunnel gagne. Rejoué sur les trente tirages à la place du test, le déploiement pour tous fait mieux 18 fois sur 30, mais perd 9,3 k€ en moyenne : quand le tunnel ne marche pas, tous les artisans le subissent.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le printemps est la meilleure saison, le prestataire garantit 5 000 visites de plus : c'est le moment d'investir.",
      ceQuiLeDejoue:
        "La comparaison des commandes selon l'origine des visites le dit : la publicité large amène moins d'une commande sur dix, sept visiteurs payants sur dix sont des particuliers que le site refuse, et une commande venue de la publicité coûte plus que sa marge. À l'inverse, 310 comptes d'artisans ouverts n'ont jamais commandé : une relance par leur agence coûte 1 500 €, puis 600 € par semaine de publicité ciblée. Rejoué sur les trente tirages à la place de la relance, tripler la publicité perd 24 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Les chantiers redémarrent : 8 % de remise pendant un mois feront décoller le site, et le marketing prévoit 25 % de commandes en plus.",
      ceQuiLeDejoue:
        "Le bilan de la promotion d'automne le montrait : −10 % pendant trois semaines, +30 % de commandes, mais quatre sur dix étaient des achats que les clients faisaient au comptoir au prix plein, et les agences s'en souviennent. Estelle Monnet, directrice de l'agence de Bron, rapporte ce que demandent les clients : commander le matin et passer prendre au comptoir, où un retrait ramène en moyenne 55 € de marge d'achats d'appoint. Rejouée sur les trente tirages à la place du retrait en deux heures, la remise perd 34 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le comité veut couper, et la contribution est sous le budget : proposer soi-même le gel paraît lucide, et ménage la direction.",
      ceQuiLeDejoue:
        "Le dossier préparé pour le comité montre la conversion et les commandes semaine par semaine depuis la semaine 1, et rappelle que le contrat de l'agence web prévoit trois mois de préavis : geler le site n'économiserait que la publicité. Couper au moment où l'entonnoir est réparé et où les agences recommandent le site perd ce qu'on vient de construire. Rejoué sur les trente tirages à la place de l'entonnoir présenté au comité, le gel proposé perd 18,4 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le site avait 8 100 visites et 60 commandes. À quelle étape de l'entonnoir perdait-il le plus d'artisans ? Quelle source le montrait, et laquelle ne disait rien des commandes ?",
    "Doubler la publicité amène 2 000 visites de plus environ, dont deux sur dix de professionnels. Combien de commandes en plus peut-on en attendre, avec l'entonnoir de la semaine 1 ? Et avec l'entonnoir réparé ?",
    "Les agences freinaient parce que la vente en ligne sortait de leur prime, alors que les achats au comptoir de leurs clients ne baissaient pas. Pourquoi une note de la direction ne suffisait-elle pas, quand 2 % de prime suffisaient ?",
    "Sous le tirage n° 25, le nouveau tunnel ne gagne pas : ceux qui l'ont déployé pour tous perdent 29,8 k€ face à ceux qui l'ont testé. Sur les trente tirages, le déploiement fait pourtant mieux que le test 18 fois. Pourquoi le test reste-t-il le meilleur choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Sous le même tirage, ceux qui ont seulement affiché le stock de l'agence finissent 16,2 k€ au-dessus de ceux qui ont testé le tunnel, mais font moins bien en moyenne sur les trente tirages. Qu'est-ce que cela dit du jugement d'une décision sur un seul trimestre ?",
    "Retrait en agence en deux heures, remise de 8 %, livraison offerte : laquelle fait gagner le site et le comptoir en même temps ? Appuyez-vous sur les 55 € de marge d'appoint.",
    "Quelle règle gardez-vous avant d'acheter des visites ? Formulez-la en une phrase, avec un taux dedans.",
  ],
  prolongement: {
    enonce:
      "Un site professionnel reçoit 10 000 visites par semaine, dont 70 % de professionnels. 30 % des professionnels voient leurs prix, 10 % de ceux-là font un panier, et 35 % des paniers deviennent des commandes, qui laissent chacune 100 € de marge. 1) Combien de commandes le site fait-il par semaine ? 2) Option A : 2 000 € de publicité en plus par semaine amènent 2 500 visites, dont 20 % de professionnels. Combien de commandes en plus, et quel gain net par semaine ? 3) Option B : une correction de 6 000 €, payée une fois, fait passer la part des professionnels qui voient leurs prix de 30 % à 45 %. Combien de commandes en plus, quel gain par semaine, et en combien de semaines la correction est-elle remboursée ? 4) Que donnent les deux options ensemble ?",
    corrige:
      "1) 10 000 × 0,70 = 7 000 professionnels ; 7 000 × 0,30 × 0,10 × 0,35 = 73,5 commandes. 2) 2 500 × 0,20 = 500 professionnels ; 500 × 0,30 × 0,10 × 0,35 = 5,25 commandes, soit 525 € de marge pour 2 000 € de publicité : −1 475 € par semaine. 3) 7 000 × 0,45 × 0,10 × 0,35 = 110,25 commandes, 36,75 de plus, soit 3 675 € de marge par semaine ; la correction est remboursée en 6 000 / 3 675 ≈ 1,6 semaine. 4) 7 500 professionnels × 0,45 × 0,10 × 0,35 ≈ 118,1 commandes : la publicité n'ajoute plus que 7,9 commandes, 790 € pour 2 000 € par semaine, toujours à perte. Réparer l'entonnoir rend la publicité moins mauvaise, pas rentable.",
  },
  evaluation: [
    "L'entonnoir de la semaine 1 est reconstitué étape par étape, avec ses taux de passage, et l'étape qui fuit le plus est nommée à partir des sources.",
    "La prévision des commandes de la semaine 3 est construite par un calcul écrit (ce que la correction change à l'entonnoir), et l'écart avec 82,6 est expliqué.",
    "Chaque dépense de publicité est jugée en commandes et en marge, pas en visites, en tenant compte de la part de professionnels qu'elle amène.",
    "La réponse aux agences et le retrait en agence sont justifiés par ce que chaque canal y gagne, avec les chiffres des sources.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 25.",
  ],
  vigilance:
    "Le corrigé de 82,6 commandes est celui du modèle sous le tirage n° 25 : les sources ne disent pas de combien la correction du compte fait monter la part des professionnels qui voient leurs prix, et l'élève ne peut que l'estimer. Le modèle compte une semaine 1 à une cinquantaine de commandes, quand la source donne 60 pour la semaine précédente. L'ouverture d'un compte professionnel sur le seul numéro SIRET est une convention de l'épisode ; les règles de vente réservée aux professionnels et d'affichage des prix ne sont pas discutées.",
};
