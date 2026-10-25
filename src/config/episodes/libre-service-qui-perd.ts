/**
 * LE LIBRE-SERVICE QUI PERD : le contenu de l'épisode.
 *
 * Camille Royer est en CAP Équipier polyvalent du commerce, en apprentissage à
 * l'agence Arvel Distribution de Bourgoin-Jallieu. Samia Haddou, sa cheffe
 * d'équipe, lui confie la réception des livraisons et le rayon colles et
 * joints du libre-service. Six décisions, deux par bloc du CAP : recevoir et
 * ranger, réassortir et étiqueter, conseiller et régler une réclamation. Le
 * joueur y fait les gestes d'un équipier, pas les choix d'un responsable.
 *
 * Le niveau est celui d'un CAP : des phrases courtes, des mots concrets (bon
 * de livraison, réserve, façade, étiquette, démarque), et une prévision qui se
 * fait par une multiplication guidée.
 *
 * Chaque chiffre qu'une source donne au joueur se lit dans les constantes du
 * modèle. Les sources portent leur NATURE (décisive, utile, bruit, aide), que
 * le joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  ABIMES_TROUVES,
  A_L_HEURE_DEPART,
  CHANCE_INCIDENT,
  COMMANDES_PAR_JOUR,
  DEMARQUE_TRIMESTRE_DERNIER,
  DEMARQUE_TRIMESTRE_DERNIER_TOTAL,
  ERREURS_DE_STOCK_DEPART,
  ETIQUETTES_FAUSSES,
  JOURS_D_OUVERTURE,
  LIVRAISONS_PAR_SEMAINE,
  MINUTES_DE_CONTROLE,
  PART_DE_PARTICULIERS,
  PRODUITS_COMPTES,
  RECLAMATIONS_PAR_SEMAINE,
  RUPTURES_REASSORT,
  SEMAINES_DE_BONS_RELUS,
} from "@/engine/episodes/libre-service-qui-perd";
import { euros, nombre, taux } from "./format";
import type { Etape } from "./types";

const SAMIA = { de: "Samia Haddou", role: "Cheffe d'équipe" } as const;
const KEVIN = { de: "Kevin Lopes", role: "Vendeur comptoir" } as const;
const JULIEN = { de: "Julien Caron", role: "Plombier-chauffagiste" } as const;
const BERTIN = { de: "Daniel Bertin", role: "Client particulier" } as const;
const LEFORT = { de: "Hélène Lefort", role: "Cliente du site" } as const;
const TABLEAU = {
  de: "Tableau de bord du libre-service",
  role: "Point hebdomadaire",
} as const;

/** Un pourcentage entier : « 30 % ». */
const pc = (v: number) => taux(v, 0);
/** La part d'une cause dans la démarque du trimestre dernier. */
const part = (v: number) => pc(v / DEMARQUE_TRIMESTRE_DERNIER_TOTAL);

const LIVRAISONS_RELUES = SEMAINES_DE_BONS_RELUS * LIVRAISONS_PAR_SEMAINE;
const INCIDENTS_RELUS = Math.round(LIVRAISONS_RELUES * CHANCE_INCIDENT);

export const DIAGNOSTICS = [
  {
    id: "reception",
    t: "Les pertes commencent à la réception : on signe sans contrôler, et les colis abîmés ou manquants restent à la charge de l'agence",
  },
  {
    id: "dates",
    t: "Les colles et les mastics passent leur date au fond du rayon, derrière les cartons neufs",
  },
  { id: "vol", t: "Le vol au libre-service fait l'essentiel de la démarque" },
  { id: "clients", t: "Les clients abîment les produits en les manipulant" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le libre-service perd de l'argent",
    jusqua: 2,
    messages: () => [
      {
        ...TABLEAU,
        role: "Alerte automatique",
        heure: "07:15",
        alerte: true,
        texte: `Trimestre dernier : ${euros(DEMARQUE_TRIMESTRE_DERNIER_TOTAL)} de démarque au libre-service, ${nombre(RUPTURES_REASSORT + ERREURS_DE_STOCK_DEPART, 0)} références vides à l'ouverture en moyenne, ${pc(A_L_HEURE_DEPART)} des commandes clients prêtes à l'heure.`,
      },
      {
        ...SAMIA,
        heure: "07:40",
        texte:
          "Camille, la directrice veut que le libre-service perde moins ce trimestre. Je te confie la réception des livraisons et le rayon colles et joints. Dis-moi vendredi comment tu recevras les livraisons, à partir de lundi prochain.",
      },
      {
        ...KEVIN,
        heure: "08:20",
        texte:
          "Le chauffeur du transporteur est toujours pressé. D'habitude, on signe son bon et on range vite, pour que le rayon soit plein avant 9 heures.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "bons",
        titre: "Relire les bons de livraison du mois dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `${LIVRAISONS_RELUES} livraisons, toutes signées sans réserve. ${INCIDENTS_RELUS} avaient un colis abîmé ou un manquant, vu après le départ du chauffeur. Le transporteur n'a rien remboursé : sans réserve écrite sur son bon, il n'y a pas de preuve. Personne ne compare ce qui arrive au bon de commande.`,
      },
      {
        id: "feuille",
        titre: "Lire la feuille de démarque du trimestre dernier",
        cout: 1,
        nature: "decisive",
        resultat: `Démarque du trimestre dernier : ${euros(DEMARQUE_TRIMESTRE_DERNIER_TOTAL)}. Colis abîmés ou manquants vus après la livraison : ${euros(DEMARQUE_TRIMESTRE_DERNIER.reception)}, soit ${part(DEMARQUE_TRIMESTRE_DERNIER.reception)}. Colles et mastics périmés, trouvés au fond du rayon : ${euros(DEMARQUE_TRIMESTRE_DERNIER.dates)}, soit ${part(DEMARQUE_TRIMESTRE_DERNIER.dates)}. Casse en rayon : ${euros(DEMARQUE_TRIMESTRE_DERNIER.casse)}. Vol constaté : ${euros(DEMARQUE_TRIMESTRE_DERNIER.vol)}.`,
      },
      {
        id: "allees",
        titre: "Surveiller les allées une journée pour repérer les vols",
        cout: 1,
        nature: "bruit",
        resultat:
          "Une journée à surveiller : un emballage vide retrouvé derrière les sacs de colle. Rien d'autre.",
      },
      {
        id: "samia",
        titre: "Demander à Samia comment se passe une livraison",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Samia : « Le chauffeur arrive à 7 h 30 et veut repartir vite. On signe, puis on range. Le bon de commande reste au bureau. »",
      },
      {
        id: "kevin",
        titre: "Demander conseil à Kevin",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Kevin : « À ta place, je regarderais d'abord où part l'argent, avant de chercher des voleurs. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question:
      "Comment recevez-vous les livraisons, à partir de lundi prochain ?",
    options: [
      {
        t: "Signer vite le bon du chauffeur pour qu'il reparte, et ranger",
        d: "Comme d'habitude. Le chauffeur est pressé, et le rayon est plein avant 9 heures.",
      },
      {
        t: "Vérifier les colis et écrire les réserves avant de signer",
        d: `Comparer au bon de commande, regarder chaque colis, noter sur le bon du transporteur ce qui manque ou est abîmé. ${MINUTES_DE_CONTROLE} minutes de plus par livraison.`,
      },
      {
        t: "Signer, puis tout vérifier tranquillement dans la réserve, sans le chauffeur",
        d: "On voit les problèmes, mais après le départ du chauffeur. Il reste trois jours pour envoyer une lettre recommandée.",
      },
      {
        t: "Refuser toute la livraison dès qu'un colis est abîmé, pour être tranquille",
        d: "Le transporteur repart avec tout. Le fournisseur relivrera à la livraison suivante.",
      },
    ],
    reactions: [
      [
        {
          ...KEVIN,
          texte:
            "Le rayon était plein à 9 heures. Après coup, Samia a trouvé un sac de colle éventré au fond d'une palette, mais le bon était signé.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Le chauffeur a attendu un peu. Mais avec la réserve écrite sur son bon, le fournisseur remplace le colis abîmé sans discuter.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Tu as trouvé le carton abîmé dans la réserve, c'est bien. Mais le bon est signé : il faut une lettre recommandée, et le transporteur discute.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "Toute la livraison est repartie pour un seul colis. Le rayon des joints est vide jusqu'à la prochaine livraison, et les artisans le voient.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ranger et préparer",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...SAMIA,
        heure: "16:30",
        alerte: true,
        texte:
          "Camille, deux choses. Ce matin, j'ai jeté un carton de mastics périmés : il était au fond du rayon, derrière les cartons neufs. Et Julien Caron, le plombier, a attendu sa commande au comptoir à 7 heures. Il n'était pas content.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Démarque de la semaine 2 : ${ctx.demarque}. Commandes prêtes à l'heure : ${ctx.aLHeure}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dates",
        titre: "Regarder les dates sur les colles et les mastics du rayon",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les cartons les plus récents sont devant, les plus anciens derrière. Les tubes qui périment le plus tôt sont tous au fond, là où personne ne les prend.",
      },
      {
        id: "commandes",
        titre: "Regarder quand les commandes clients sont préparées",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les commandes sont préparées quand le client arrive au comptoir. ${pc(1 - A_L_HEURE_DEPART)} des clients attendent leur commande. Les artisans passent tôt, avant leur chantier. Préparées la veille, presque toutes seraient prêtes.`,
      },
    ],
    question:
      "Comment rangez-vous le rayon, et comment préparez-vous les commandes ?",
    options: [
      {
        t: "Ranger les cartons neufs devant, et préparer les commandes à l'arrivée du client",
        d: "Comme d'habitude. Le rayon est rempli tout de suite.",
      },
      {
        t: "Mettre devant ce qui périme le plus tôt, et préparer les commandes à l'arrivée",
        d: "Retrier le rayon prend une matinée. Les commandes restent préparées au dernier moment.",
      },
      {
        t: "Ranger vite pour gagner du temps, et préparer les commandes la veille",
        d: "Les commandes du lendemain sont prêtes le soir. Le rayon reste rangé comme avant.",
      },
      {
        t: "Dates courtes devant, commandes prêtes la veille, client prévenu par SMS",
        d: "Une matinée pour retrier le rayon, puis une demi-heure chaque soir pour préparer et prévenir.",
      },
    ],
    reactions: [
      [
        {
          ...SAMIA,
          texte:
            "Le rayon est plein. Mais derrière, les vieux cartons continuent de vieillir.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Le rayon est retrié : ce qui périme le plus tôt est devant. Mais les artisans attendent toujours leur commande le matin.",
        },
      ],
      [
        {
          ...JULIEN,
          texte:
            "Ma commande était prête à 7 heures. Je suis reparti en deux minutes.",
        },
      ],
      [
        {
          ...JULIEN,
          texte:
            "J'ai reçu le SMS hier soir, et tout était prêt ce matin. C'est pour ça que je reviens chez vous.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le réassort avant le samedi",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SAMIA,
        heure: "17:00",
        alerte: true,
        texte: `Demain, c'est samedi : beaucoup de monde. Cette semaine, ${ctx.ruptures} références étaient vides à l'ouverture. Tu as une heure avant d'ouvrir. Comment tu t'organises ?`,
      },
      {
        ...KEVIN,
        heure: "17:20",
        texte:
          "Samedi dernier, des clients m'ont demandé des croisillons et du joint gris. Plus rien en rayon, alors qu'il y en avait en réserve.",
      },
    ],
    sources: [
      {
        id: "ventes",
        titre: "Sortir la liste des ventes de la veille",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le logiciel de caisse donne ce qui s'est vendu la veille, produit par produit. Une petite partie des produits fait la moitié des ventes du samedi. Ce sont eux qui manquent quand le rayon se vide.",
      },
      {
        id: "reserve",
        titre: "Faire le tour de la réserve",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les produits sont là, mais rangés par fournisseur. Retrouver un carton prend du temps quand on ne sait pas quoi chercher.",
      },
    ],
    question: "Comment réassortissez-vous le rayon avant l'ouverture ?",
    options: [
      {
        t: "Remplir à l'œil ce qui a l'air vide, rayon par rayon, comme d'habitude",
        d: "On remplit ce qu'on voit, sans perdre de temps à lire des listes.",
      },
      {
        t: "Tout remettre en façade d'abord pour un beau rayon, réassortir ensuite",
        d: "Le rayon est beau à l'ouverture. Le réassort se fait au transpalette, pendant que les clients sont là.",
      },
      {
        t: "Réassortir d'abord les meilleures ventes de la veille, puis la façade",
        d: "Dix minutes pour lire la liste, puis le réassort dans l'ordre.",
      },
      {
        t: "Sortir des palettes entières dans les allées, pour aller plus vite",
        d: "Plus d'allers et retours. Les palettes restent dans les allées pendant l'ouverture.",
      },
    ],
    reactions: [
      [
        {
          ...KEVIN,
          texte:
            "À 10 heures, plus de joint gris, et des croisillons qui manquent encore.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Le rayon était beau à 8 heures. À 10 heures, on circulait mal entre le transpalette et les chariots, et un pot de peinture est tombé.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "Ce samedi, les produits qui partent le plus étaient tous en rayon. Presque personne n'est venu me les demander au comptoir.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Ça va vite. Mais une palette dans une allée ouverte au public, c'est dangereux, et les clients doivent se faufiler.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les étiquettes et la démarque",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...SAMIA,
        heure: "15:00",
        alerte: true,
        texte:
          "Lundi, les prix des colles changent, et la promotion sur les colles à carrelage commence. Il faut poser le balisage de la promotion. Et j'ai vu des sacs percés et des pots cabossés au fond de l'allée 4.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Démarque de la semaine 6 : ${ctx.demarque}. Références vides à l'ouverture : ${ctx.ruptures}.`,
      },
    ],
    sources: [
      {
        id: "prix",
        titre: "Comparer les étiquettes du rayon à la liste des nouveaux prix",
        cout: 0.5,
        nature: "decisive",
        resultat: `${ETIQUETTES_FAUSSES} étiquettes ne seront plus à jour lundi. En caisse, le client verra un autre prix que celui du rayon. La loi oblige à vendre au prix affiché : l'agence perd la différence, et le client se sent trompé.`,
      },
      {
        id: "stock",
        titre:
          "Comparer le stock du logiciel à ce qu'il y a vraiment dans l'allée 4",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur ${PRODUITS_COMPTES} produits comptés, ${nombre(ERREURS_DE_STOCK_DEPART, 0)} sont « en stock » dans le logiciel, mais vides en rayon et en réserve. Personne ne les recommande, puisque le logiciel croit qu'il en reste. Un produit abîmé qu'on ne déclare pas fait la même erreur.`,
      },
      {
        id: "abimes",
        titre: "Compter les produits abîmés de l'allée 4",
        cout: 0.5,
        nature: "utile",
        resultat: `Sacs percés, pots cabossés : ${euros(ABIMES_TROUVES)} au prix d'achat. Déclarés en démarque, ils sortent du stock du logiciel.`,
      },
    ],
    question:
      "Que faites-vous des étiquettes, de la promotion et des produits abîmés ?",
    options: [
      {
        t: "Corriger les étiquettes, baliser, déclarer les abîmés, compter l'allée",
        d: "Une matinée. Les abîmés sortent du rayon et sont déclarés en démarque, l'allée est comptée pour l'inventaire tournant. La démarque du mois monte.",
      },
      {
        t: "Poser vite le balisage de la promotion ; la caisse corrigera les prix",
        d: "Une demi-heure, et la promotion est visible dès lundi. Les produits abîmés restent en rayon.",
      },
      {
        t: "Corriger étiquettes et balisage, déclarer les abîmés, compter plus tard",
        d: "Deux heures. L'allée sera comptée le mois prochain.",
      },
      {
        t: "Corriger étiquettes et balisage, ranger les abîmés en réserve sans les déclarer",
        d: "La démarque du mois restera basse. Personne ne verra les produits abîmés.",
      },
    ],
    reactions: [
      [
        {
          ...SAMIA,
          texte:
            "La démarque du mois monte, et c'est normal : elle dit la vérité. Et le stock de l'allée 4 est enfin juste.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "Trois clients ce matin : le prix en caisse n'était pas celui de l'étiquette. On a dû appliquer le prix affiché, et ils étaient fâchés.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Les étiquettes sont justes, merci. L'allée 4, on la comptera plus tard.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "La démarque de la semaine est basse. Mais la réserve se remplit de sacs percés.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le particulier du samedi",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...SAMIA,
        heure: "17:30",
        alerte: true,
        texte: `Camille, au libre-service, ${pc(PART_DE_PARTICULIERS)} des clients sont des particuliers. Ils ont besoin de conseils, et Kevin ne peut pas tout faire au comptoir. Ce matin, M. Bertin cherchait « une colle pour du carrelage ». Comment tu reçois ces clients-là ?`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Clients satisfaits au comptoir en semaine 8 : ${ctx.satisfaction}.`,
      },
    ],
    sources: [
      {
        id: "bertin",
        titre: "Écouter ce que M. Bertin veut faire",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "M. Bertin refait le sol de sa salle de bains : de grands carreaux, posés sur un chauffage au sol. Une colle premier prix n'est pas faite pour ça : il lui faut une colle prévue pour les grands carreaux et le sol chauffant. Il n'a ni peigne à colle, ni croisillons, ni joint.",
      },
      {
        id: "retours",
        titre: "Lire les retours de produits du mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La moitié des retours viennent de particuliers repartis avec le mauvais produit, ou avec des produits dont ils n'avaient pas besoin. Un produit rendu se rembourse, et revient souvent abîmé.",
      },
    ],
    question: "Comment recevez-vous les particuliers qui demandent conseil ?",
    options: [
      {
        t: "Lui donner la colle la moins chère, puisqu'il demande « une colle »",
        d: "Rapide. Il repart avec ce qu'il a demandé.",
      },
      {
        t: "Lui proposer la meilleure colle et tout le rayon carrelage, pour bien l'équiper",
        d: "Un gros panier. Plus il achète, mieux c'est pour l'agence.",
      },
      {
        t: "L'envoyer à Kevin, au comptoir, qui connaît mieux les colles que vous",
        d: "Kevin connaît bien les produits. La file du comptoir s'allonge.",
      },
      {
        t: "Lui poser des questions sur son chantier, puis conseiller et compléter",
        d: "Quelle pièce, quel sol, quels carreaux ; puis la colle adaptée, et ce qui lui manquera : peigne, croisillons, joint. Dix minutes par client.",
      },
    ],
    reactions: [
      [
        {
          ...BERTIN,
          texte: "Merci, c'est réglé. Je pose ça ce week-end.",
        },
      ],
      [
        {
          ...BERTIN,
          texte:
            "Je suis reparti avec un chariot plein. En rentrant, j'ai vu que la moitié ne servait à rien. Je reviens tout rendre lundi.",
        },
      ],
      [
        {
          ...KEVIN,
          texte:
            "J'ai eu six particuliers en même temps au comptoir, et deux plombiers qui attendaient derrière.",
        },
      ],
      [
        {
          ...BERTIN,
          texte:
            "Vous m'avez évité une bêtise : je serais parti avec la mauvaise colle. Et je n'avais pas pensé au joint.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le retrait et la réclamation",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...LEFORT,
        heure: "10:15",
        alerte: true,
        texte:
          "Je viens retirer la commande que j'ai passée sur votre site. Il manque le pot de primaire, alors que le mail disait que tout était prêt. J'ai pris ma matinée pour ça.",
      },
      {
        ...SAMIA,
        heure: "10:20",
        texte:
          "Camille, je suis en réunion avec la directrice jusqu'à midi. Tu t'en occupes ?",
      },
      {
        ...TABLEAU,
        heure: "10:30",
        texte: `Clients satisfaits au comptoir : ${ctx.satisfaction}. Pertes depuis le début du trimestre : ${ctx.pertes}.`,
      },
    ],
    sources: [
      {
        id: "commande",
        titre: "Regarder la commande de Mme Lefort sur l'écran du comptoir",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La commande a été validée sur le site mardi. Le primaire était en rupture ce jour-là, et le site n'a pas prévenu la cliente. Un primaire équivalent, au même prix, est en rayon.",
      },
      {
        id: "cahier",
        titre: "Relire le cahier des réclamations",
        cout: 0.5,
        nature: "utile",
        resultat: `Chaque semaine, environ ${RECLAMATIONS_PAR_SEMAINE} clients reviennent pour un retrait incomplet ou un produit qui ne va pas. Ceux qu'on renvoie vers le service client du site reviennent rarement.`,
      },
    ],
    question:
      "Que faites-vous pour Mme Lefort, et pour les réclamations suivantes ?",
    options: [
      {
        t: "Lui donner le numéro du service client du site, qui gère ces commandes",
        d: "Ce n'est pas votre erreur. Le service client s'en occupera.",
      },
      {
        t: "L'écouter, vérifier sa commande, proposer le primaire équivalent",
        d: "Dix minutes. La réclamation est notée pour Samia, qui cherchera d'où vient l'erreur du site.",
      },
      {
        t: "Lui rembourser toute la commande sans discuter, pour qu'elle reparte contente",
        d: "Elle repart contente. La caisse rembourse la commande entière.",
      },
      {
        t: "Lui demander de repasser à midi, quand Samia pourra décider",
        d: "Samia revient à midi.",
      },
    ],
    reactions: [
      [
        {
          ...LEFORT,
          texte:
            "J'ai déjà appelé ce numéro hier. On m'a dit de voir avec l'agence.",
        },
      ],
      [
        {
          ...LEFORT,
          texte:
            "Merci. Le primaire équivalent me va très bien, et je n'ai pas perdu ma matinée pour rien.",
        },
      ],
      [
        {
          ...SAMIA,
          texte:
            "Tu lui as remboursé toute la commande ? Il ne manquait qu'un pot de primaire. La prochaine fois, regarde d'abord.",
        },
      ],
      [
        {
          ...LEFORT,
          texte: "Repasser ? J'ai déjà pris ma matinée. Je ne reviendrai pas.",
        },
      ],
    ],
  },
];

/** La prévision de la semaine 1 : une multiplication guidée, les commandes d'un jour par les jours d'ouverture. */
export const PREVISION = {
  parJour: COMMANDES_PAR_JOUR,
  jours: JOURS_D_OUVERTURE,
} as const;

/** Les trois manières de faire auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Contrôler, ranger, conseiller", chemin: [1, 3, 2, 0, 3, 1] },
  { nom: "Aller vite", chemin: [0, 0, 3, 1, 1, 2] },
  { nom: "Faire comme d'habitude", chemin: [0, 0, 0, 1, 2, 0] },
] as const;

/**
 * Les gestes réflexes : aller vite, faire beau ou cacher plutôt que bien faire.
 * [décision, option]. Signer sans contrôler, ranger les cartons neufs devant,
 * sortir des palettes dans les allées, laisser les étiquettes fausses, cacher
 * les produits abîmés, forcer la vente, renvoyer le client ailleurs.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 3],
  [3, 1],
  [3, 3],
  [4, 1],
  [5, 0],
] as const;

export const REPONSES = {
  litigePerdu:
    "Le transporteur refuse de rembourser le colis abîmé de la dernière livraison : le bon est signé sans réserve.",
  trebuche:
    "Un client a trébuché sur une palette laissée dans l'allée 3. Il n'est pas blessé, mais il a fallu faire une déclaration, et lui faire un geste.",
  decolle:
    "M. Bertin est revenu : ses carreaux se décollent. La colle n'était pas faite pour un sol chauffant. Il a fallu la reprendre, et lui faire un geste.",
  cacheeRetrouvee:
    "L'inventaire de fin de trimestre a retrouvé en réserve les produits abîmés qui n'avaient pas été déclarés. Ils entrent tous d'un coup dans la démarque.",
} as const;
