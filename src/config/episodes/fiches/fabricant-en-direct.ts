import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 44, LE FABRICANT QUI VEND EN DIRECT.
 *
 * Désintermédiation et pouvoir de négociation : chiffrer la part de la marge
 * qu'un fournisseur peut prendre en vendant en direct, mesurer la dépendance
 * des deux côtés, faire payer ce que le négoce apporte, et négocier avec une
 * alternative crédible plutôt que punir ou ignorer. Les chiffres du corrigé,
 * des réflexes et du débrief se recalculent depuis le modèle de l'épisode
 * (src/engine/episodes/fabricant-en-direct.ts), sans pénalité d'enquête ;
 * ceux du hasard de la classe sont ceux de la graine 12.
 */
export const FICHE: FicheEnseignant = {
  code: "fabricant-en-direct",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Quand un fournisseur ouvre sa propre vente directe, le distributeur subit une désintermédiation partielle : le fabricant ne peut prendre que les commandes qui n'ont pas besoin de ce que le distributeur apporte (stock de proximité, livraison fractionnée, crédit, conseil), et la riposte se dimensionne sur cette marge exposée, pas sur tout le chiffre réalisé avec lui. L'erreur classique est double : punir le fournisseur en le déréférençant, alors que ses produits sont demandés par des clients que la plateforme ne menace pas et que leurs coûts de changement les feront partir avec la marque, ou l'ignorer parce qu'« il a besoin de nous », alors qu'il n'a besoin du négoce que pour la clientèle qu'il ne sait pas servir. Le pouvoir de négociation se lit dans la dépendance mesurée des deux côtés et dans l'existence d'une alternative crédible ; on reconnaît, chez Porter, le pouvoir de négociation des fournisseurs et leur menace d'intégration vers l'aval, et chez Pfeffer et Salancik la théorie de la dépendance des ressources. L'épisode place l'étudiant à la direction de l'offre et des achats d'un négoce de matériaux dont le premier fournisseur, 10 % des achats, lance une plateforme pour les grandes entreprises du bâtiment : 550 k€ de marge sont exposés sur 2,8 M€, les artisans ne le sont pas, et Arvel pèse 35 % des ventes régionales du fabricant. Le piège est de répondre par le prix à tous, ou par la rupture, au lieu de faire payer les services, de tester une seconde marque avant de la déployer et de proposer un partage des grands comptes.",
  objectifs: [
    "Je chiffre la marge exposée à la vente directe d'un fournisseur, segment par segment, en ne retenant que les commandes que sa plateforme sait servir.",
    "Je mesure la dépendance des deux côtés et j'en déduis sur quels clients chacun détient le pouvoir de négociation.",
    "Je distingue une riposte qui protège la marge exposée, en faisant payer les services à qui s'en sert, d'une remise qui cède de la marge que personne ne menaçait.",
    "Je décide de payer une information, un test limité, quand elle peut changer la décision suivante, et je révise mon plan sur ses chiffres plutôt que sur ce qui a été annoncé.",
  ],
  prerequis:
    "Les étudiants doivent avoir vu les cinq forces de Porter, en particulier le pouvoir de négociation des fournisseurs et l'intégration vers l'aval, ainsi que la marge commerciale et le principe de l'actualisation ; la notion de coût de changement peut se découvrir en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/fabricant-en-direct?hasard=12 : toute la classe joue le même trimestre, sous le même aléa. Les étudiants jouent seuls ou en binôme, au niveau Standard. Vous précisez que le trimestre est jugé sur une valeur estimée en semaine 13 (la marge du trimestre plus deux ans de la marge que la riposte installe, actualisés à 9 %), et vous demandez de noter, à chaque décision, le chiffre qui l'a emportée.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les étudiants jouent les six décisions. Vous circulez sans répondre et relevez au tableau, sans commentaire, l'estimation de la marge exposée saisie en semaine 1 et les options retenues en semaine 1 (la posture), en semaine 4 (Solvane), en semaine 9 (les chiffres du test) et en semaine 11 (l'accord). Vous rappelez qu'au-delà de deux jours d'enquête, chaque jour coûte 5 k€. Ceux qui finissent tôt rejouent les mêmes décisions sous un autre aléa et notent l'écart.",
    },
    {
      minutes: 15,
      titre: "Correction de la marge exposée",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute, puis vous reconstruisez au tableau la marge par segment et la part faite sur des commandes complètes : 550 k€. Vous faites retrouver d'où viennent 390, 650 et 2 800 k€. Vous posez enfin trois chiffres côte à côte : 227 k€ par an que la plateforme devrait prendre en espérance, 290 k€ par an que coûterait l'alignement, 16 k€ par an que rapporte la séparation du prix et des services.",
    },
    {
      minutes: 25,
      titre: "La décision qui a partagé la classe",
      detail:
        "Vous partez du relevé et prenez la décision où la classe s'est le plus partagée, souvent Solvane en semaine 4, ou l'accord complet contre l'accord limité en semaine 11. Chaque camp défend son choix, puis vous ressortez la source qui tranchait : le taux de bascule des négoces voisins et le coût du test, ou ce que Mérindal peut accepter. Vous enchaînez sur la semaine 9, où il fallait réviser le plan annoncé au comité au vu des chiffres du test.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous prévenez la classe que les aléas pèsent lourd dans cet épisode : le succès de la plateforme, la réaction de Mérindal et sa réponse à l'accord se jouent sur un tirage, et la même méthode finit entre −518 et +188 k€ selon le trimestre. Sous l'aléa 12, la plateforme connaît un succès limité et Mérindal signe l'accord complet : « chiffrer, défendre, négocier » fait +41 k€, 11e des 30 tirages, pour une moyenne de −93 k€. Vous faites ouvrir le bilan et comparer, décision par décision, le résultat obtenu au résultat moyen.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez les règles que l'épisode a fait éprouver : chiffrer l'exposition sur la marge et par type de commande, faire payer ce que le distributeur apporte plutôt que baisser les prix de tous, mesurer la dépendance des deux côtés, négocier avec une alternative testée en main, réviser son plan sur les chiffres, ne pas rompre une relation établie sous le coup de la colère. Vous distribuez le cas de prolongement, à traiter en vingt minutes en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 550,
    etapes: [
      "Marge par segment, d'après « Décomposer les ventes Mérindal par type de client et de commande » : grands comptes 5 M€ × 13 % = 650 k€ ; PME du bâtiment 4 M€ × 20 % = 800 k€ ; artisans 5 M€ × 27 % = 1 350 k€ ; soit 2,8 M€ de marge pour 14 M€ de ventes.",
      "Ce que la plateforme sait servir, d'après la même source : des semi-remorques complètes livrées depuis l'usine, payées à trente jours, sans stock de proximité, livraison fractionnée, crédit long ni conseil. 60 % de la marge des grands comptes et 20 % de celle des PME sont faites sur de telles commandes, aucune chez les artisans.",
      "Marge exposée : 650 × 60 % + 800 × 20 % + 1 350 × 0 = 390 + 160 + 0 = 550 k€ par an, soit 19,6 % de la marge réalisée sur Mérindal. Le chiffre ne dépend pas des aléas : toute la classe doit trouver la même valeur ; l'épisode juge juste à 15 k€ près, proche à 60 k€.",
      "C'est un plafond, pas une perte annoncée. « Chiffrer la dépendance des deux côtés » donne les précédents (un cinquième des commandes complètes en Belgique, près de la moitié aux Pays-Bas, plus des deux tiers en Suisse) et leurs chances, environ une sur trois, une sur deux et une sur cinq ; le modèle retient 20, 45 et 70 % avec 35, 45 et 20 % de chances, soit une prise attendue de 41,25 % et 226,9 k€ de marge par an.",
      "Pour le comité : s'aligner sur la plateforme coûterait 5 % × (5 M€ + 4 M€ × 20 %) = 290 k€ de marge par an, plus que ce que la plateforme devrait prendre en espérance.",
    ],
    erreurs: [
      {
        valeur: 650,
        cause:
          "Toute la marge des grands comptes, sans trier les commandes : l'étudiant suppose que la plateforme prendra le client entier, réassort et services compris. L'épisode juge cette estimation fausse.",
      },
      {
        valeur: 390,
        cause:
          "Les seuls grands comptes, sans les commandes complètes des PME : l'étudiant raisonne par type de client et non par type de commande, et oublie 160 k€. L'épisode la juge fausse.",
      },
      {
        valeur: 2800,
        cause:
          "Toute la marge réalisée sur Mérindal, parce que « notre premier fournisseur devient notre concurrent » : l'étudiant confond ce que l'on fait avec un fournisseur et ce que sa vente directe peut prendre. C'est le calcul qui conduit au déréférencement.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le directeur commercial le dit dès lundi : on ne finance pas celui qui nous attaque, et Solvane comme deux autres fabricants attendent de prendre la place.",
      ceQuiLeDejoue:
        "Les artisans font 1 350 k€ des 2,8 M€ de marge, ne sont pas exposés, et sept sur dix demandent les menuiseries sur mesure de Mérindal par leur nom : déréférencer les fait partir avec leur panier et laisse toutes les commandes complètes à la plateforme. Sur 30 tirages, punir fait 548 k€ de moins en moyenne que chiffrer et négocier ; il gagne 10 fois, de 12 k€ au plus, quand Mérindal accepte de revenir sur la rupture, et perd jusqu'à 1,6 M€ les autres fois.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "La directrice financière l'affirme : Mérindal a autant besoin de nous que nous de lui, puisque nous pesons 35 % de ses ventes en négoce dans la région.",
      ceQuiLeDejoue:
        "La même source dit qu'Arvel pèse moins de 3 % de ses ventes en France et qu'il n'a besoin du négoce que pour les artisans, pas pour les grands comptes ; en Suisse, le négoce qui n'a rien fait a vu la plateforme vendre aux artisans un an après. Laisser venir fait passer les chances d'extension de 0 à 50 % et coûte 228 k€ en moyenne sur 30 tirages.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Mérindal propose 8 % sous nos prix sur les semis complets, trois grands comptes ont appelé, et 3 % aux vingt premiers paraissent un geste raisonnable.",
      ceQuiLeDejoue:
        "« Mesurer qui, chez les grands comptes, se sert de nos services » chiffre la remise à 105 k€ par an pour garder deux commandes complètes sur dix, quand séparer le prix et les services rapporte 130 − 114 = 16 k€ par an et en garde quatre sur dix. La remise est l'avant-dernière option de la décision : 347 k€ de moins en moyenne sur 30 tirages.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le directeur commercial veut que Mérindal voie dès lundi une autre marque dans les trente agences : le signal serait d'autant plus fort qu'il est complet.",
      ceQuiLeDejoue:
        "« Interroger les négoces qui ont référencé une seconde marque » donne un artisan sur vingt au sur-mesure : 8,75 k€ de marge par an pour 80 k€ de déploiement et 25 k€ de service après-vente par an ; le chef de produit prévient que les cotes, le configurateur et le service après-vente retiennent les artisans. Le test, 25 k€, suffit à apprendre ce que feront les artisans et à montrer une alternative à Mérindal : tout référencer fait 117 k€ de moins en moyenne que tester.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Une marque Arvel en plaques et en menuiseries semble reprendre la main sur tout le fournisseur d'un coup.",
      ceQuiLeDejoue:
        "« Étudier les marques propres des négoces voisins » distingue la plaque normée, où une marque de négoce prend un quart des ventes (79 k€ par an pour 60 k€ de lancement), de la menuiserie, où elle ne dépasse pas 4 % (13 k€ par an pour 120 k€, garantie décennale à notre charge) ; la cheffe d'agence le dit aussi. Sur 30 tirages, l'option fait 117 k€ de moins en moyenne que les seules plaques.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Toute la gamme a été annoncée au comité, et le directeur commercial refuse de se déjuger.",
      ceQuiLeDejoue:
        "« Lire les chiffres de Solvane, famille par famille » montre, sous l'aléa 12, 19 % de bascule sur la série, au-dessus du seuil de 12 % (39 k€ de marge par an pour 45 k€ de déploiement), et 5 % sur le sur-mesure, 8 k€ de marge par an pour 80 k€ de déploiement et 25 k€ de service après-vente. Attaquer le sur-mesure, cœur de Mérindal, ôte en plus 15 points aux chances qu'il signe l'accord : 178 k€ de moins en moyenne, 550 k€ sous l'aléa 12, où il refuse.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Après trois mois de pression, le directeur commercial estime qu'Arvel a de quoi remplacer Mérindal et qu'il faut en finir.",
      ceQuiLeDejoue:
        "« Demander l'avis de la juriste sur une rupture » rappelle vingt-deux ans de relation, un préavis de trois mois quand dix-huit mettraient à l'abri, deux assignations sur quatre ruptures et des transactions autour de 250 k€ ; la rupture fait perdre les artisans qui veulent la marque et toutes les commandes complètes. C'est la pire option de l'épisode : 1,36 M€ de moins en moyenne que l'accord complet.",
    },
  ],
  debrief: [
    "La plateforme ne peut prendre que 550 k€ sur 2,8 M€ de marge, et devrait en prendre 227 k€ par an en espérance. Que pensez-vous alors d'un alignement qui coûte 290 k€ par an, ou d'une remise de 105 k€ par an qui garde deux commandes complètes sur dix ? Pourquoi faire payer les services, qui rapporte 16 k€ par an net et en garde quatre sur dix, protège-t-il mieux la marge que baisser les prix ?",
    "Mérindal pèse 10 % des achats d'Arvel ; Arvel pèse 35 % des ventes de Mérindal en négoce dans la région, moins de 3 % de ses ventes en France. Qui dépend de qui, et sur quels clients ? Pourquoi ni le punir ni l'ignorer ne tient, et que fallait-il avoir en main pour qu'il accepte un partage des grands comptes ?",
    "En semaine 4, le test de Solvane coûtait 25 k€ et ne rapportait presque rien pendant le trimestre. Que valait cette information ? Distinguez ce qu'elle apprenait (le sur-mesure ne paie pas son déploiement, la série ne se déploie qu'au-dessus de 12 % de bascule) et ce qu'elle montrait à Mérindal, dont les chances de proposer un partage en semaine 8 passaient de 55 à 85 % avec une seconde marque en test. Pourquoi tout référencer à l'aveugle fait-il 117 k€ de moins en moyenne ?",
    "Ne pas référencer de seconde marque bat le test sur 24 tirages sur 30, le plus souvent d'environ 24 k€, à peu près le prix du test économisé ; il fait pourtant 48 k€ de moins en moyenne et, sous l'aléa 12, 429 k€ de moins. D'où vient un écart aussi grand ? Faites retrouver l'enchaînement : le tirage de la classe tombe entre 55 et 85 % de chances d'accord, Mérindal choisit le conflit au lieu du partage, retire un point et demi de remise (168 k€ par an), puis refuse l'accord complet, qu'il signait 85 fois sur 100 en accord et 55 fois sur 100 en conflit ; 245 k€ de marge annuelle installée en moins, multipliés par 1,76, font les 429 k€. Qu'est-ce qu'une option qui gagne souvent un peu et perd rarement beaucoup ?",
    "En semaine 9, le plan annoncé au comité disait « toute la gamme » ; les chiffres du test disaient la série oui, le sur-mesure non. Qui a révisé, qui a tenu le plan, et pourquoi ? Tout déployer fait 178 k€ de moins en moyenne, et 550 k€ sous l'aléa 12 ; prolonger le test ne coûte que 26 k€ en moyenne : est-ce une révision prudente ou une décision repoussée ?",
    "En semaine 11, l'accord complet fait 17 k€ de mieux en moyenne que l'accord limité, mais l'accord limité a le meilleur pire cas : sur 30 tirages, il fait 78 k€ de moins 26 fois et de 361 à 435 k€ de mieux 4 fois, quand Mérindal refuse l'engagement sur les artisans. Lequel auriez-vous présenté au comité, et sur quel critère ?",
    "Sous l'aléa 12, « chiffrer, défendre, négocier » fait +41 k€, 11e des 30 tirages, pour une moyenne de −93 k€ ; il ne tient le seuil de −150 k€ du comité que 20 fois sur 30, quand punir le fabricant finit entre −1 976 et −1 428 k€. Un binôme qui a fini à +41 k€ a-t-il bien décidé ? La qualité d'une riposte stratégique se juge-t-elle au résultat d'un trimestre ?",
  ],
  prolongement: {
    enonce:
      "Distrilec, distributeur de matériel électrique (70 M€ d'achats par an), vend chaque année pour 8 M€ de luminaires Lumora. Lumora annonce une vente en ligne directe des chantiers complets, livrés depuis son usine. Ventes Lumora chez Distrilec : intégrateurs du tertiaire, 3 M€ à 15 % de marge, dont 70 % en commandes de chantier complètes ; installateurs PME, 3 M€ à 22 %, dont 10 % en commandes complètes ; artisans électriciens, 2 M€ à 30 %, aucune. Distrilec achète 6,3 M€ par an à Lumora ; il pèse 35 % des 18 M€ de ventes de Lumora en distribution dans la région et 4 % de ses 150 M€ de ventes en France ; Lumora n'a aucun stock dans la région. Les précédents laissent attendre que la vente directe prenne 40 % de la marge exposée. Deux ripostes sont proposées : A, une remise de 4 % sur tout le chiffre des intégrateurs, qui diviserait par deux ce que prend la vente directe ; B, une baisse de 3 % sur les seules commandes complètes, la livraison fractionnée et le stock chantier devenant payants (50 k€ par an de recettes), qui réduirait de 40 % ce que prend la vente directe. 1) Calculez la marge exposée. 2) Chiffrez, en marge annuelle perdue, ne rien faire, la riposte A et la riposte B. 3) Qui dépend de qui, sur quels clients, et que proposeriez-vous à Lumora ?",
    corrige:
      "1) Marges : intégrateurs 3 M€ × 15 % = 450 k€, PME 3 M€ × 22 % = 660 k€, artisans 2 M€ × 30 % = 600 k€, soit 1 710 k€. Marge exposée : 450 × 70 % + 660 × 10 % = 315 + 66 = 381 k€, 22 % de la marge réalisée sur Lumora. 2) Ne rien faire : 40 % × 381 = 152,4 k€ par an. A : 4 % × 3 M€ = 120 k€ de remise, plus 152,4 / 2 = 76,2 k€ pris, soit 196,2 k€, 43,8 k€ de plus que ne rien faire : la remise porte aussi sur les 30 % de commandes que la vente directe ne sait pas servir. B : commandes complètes 3 × 70 % + 3 × 10 % = 2,4 M€, baisse de 3 % = 72 k€ ; 60 % × 152,4 = 91,4 k€ pris ; 91,4 + 72 − 50 = 113,4 k€, 39 k€ de moins que ne rien faire : B est la riposte à retenir. 3) Distrilec dépend de Lumora pour 9 % de ses achats ; Lumora dépend de Distrilec pour 35 % de ses ventes régionales, mais 4 % seulement en France : il peut se passer de lui pour les chantiers complets, pas pour les artisans et les PME, qu'il ne sait pas servir sans stock local. On attend : ni déréférencer (les artisans, 600 k€ de marge non exposée, suivent une marque qu'ils demandent), ni ignorer ; préparer une alternative crédible, une seconde marque testée, et proposer un partage, Distrilec livrant et stockant pour la vente directe contre une commission, en échange d'un engagement écrit sur les artisans et les PME.",
  },
  evaluation: [
    "La marge exposée est calculée sur la marge et non sur les ventes, segment par segment, en ne retenant que les commandes que la plateforme sait servir : 550 k€.",
    "La dépendance est chiffrée des deux côtés (10 % des achats d'Arvel ; 35 % des ventes régionales de Mérindal, moins de 3 % en France) et l'étudiant en tire sur quels clients chacun détient le pouvoir de négociation.",
    "La riposte commerciale est justifiée en comparant son coût annuel à la marge qu'elle protège : séparer le prix et les services contre une remise ou un alignement.",
    "La décision de la semaine 9 s'appuie sur les chiffres du test, famille par famille, et sur le seuil de 12 %, non sur le plan annoncé au comité.",
    "L'étudiant juge ses décisions sur la moyenne des 30 tirages et dit ce que son résultat doit aux aléas : le succès de la plateforme, la réaction de Mérindal et sa réponse à l'accord.",
  ],
  vigilance:
    "La réaction de Mérindal et sa réponse à l'accord sont des tirages dont les chances, presque toutes données par les sources, varient de façon additive avec les choix d'Arvel (une seconde marque en rayon ou en test ajoute 30 points aux chances d'un partage) : un enseignant de stratégie y verra une négociation réduite à une table de probabilités, et c'est elle qui produit les écarts de plusieurs centaines de k€ d'un tirage à l'autre. La valeur des positions est tronquée à deux ans de marge actualisés à 9 % (1,76 année), et la rupture brutale d'une relation établie (article L. 442-1, II du code de commerce) se réduit à une chance sur deux d'une transaction de 250 k€ : des conventions de modèle à présenter comme telles.",
};
