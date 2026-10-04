/**
 * L'AGENCE QUI DÉMARRE — le contenu de l'épisode.
 *
 * Manon Pellerin dirige l'agence Arvel Distribution de Bourgoin-Jallieu,
 * ouverte il y a un mois : quatre personnes, une clientèle à construire, des
 * artisans fidèles à Rivoire Matériaux, le négoce historique du secteur, et
 * un siège qui attend le point mort. Six décisions, chacune précédée de ce
 * qu'une directrice d'agence reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "service",
    t: "Les artisans restent chez Rivoire pour le service — ouverture tôt, livraison sur chantier — pas pour le prix",
  },
  { id: "notoriete", t: "Les artisans du secteur ne connaissent pas encore l'agence" },
  { id: "prix", t: "Nos prix ne sont pas assez agressifs face à Rivoire" },
  { id: "equipe", t: "L'équipe, toute neuve, ne sait pas encore conseiller les artisans" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La fréquentation ne décolle pas",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord de l'agence",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Chiffre d'affaires de la semaine dernière : 24,2 k€, pour 30 k€ au plan d'affaires. Marge brute : 6,3 k€ ; le point mort de l'agence est à 11 k€ par semaine.",
      },
      {
        de: "Gérald Perrin",
        role: "Directeur régional",
        heure: "08:15",
        texte:
          "Manon, le comité regarde les nouvelles agences dans trois mois. Je veux voir comment tu atteins le point mort. Une promotion d'envergure, ça se finance, si c'est ce qu'il faut.",
      },
      {
        de: "Kevin Lopes",
        role: "Vendeur comptoir",
        heure: "09:10",
        texte:
          "Les gens du flyer d'ouverture ne reviennent pas. Ce matin, un plombier m'a demandé à quelle heure on ouvrait. Quand je lui ai dit 7 h 30, il a ri.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tickets",
        titre: "Analyser les tickets de caisse du premier mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "1 240 passages en caisse : 61 % de particuliers ou de clients venus une seule fois, beaucoup avec le flyer d'ouverture. Les 22 artisans réguliers font 74 % de la marge ; 15 d'entre eux sont plombiers-chauffagistes ou électriciens. Avant 8 h, presque personne : à cette heure-là, les artisans sont déjà sur leurs chantiers.",
      },
      {
        id: "artisans",
        titre: "Interroger dix artisans du secteur sur leurs chantiers",
        cout: 1,
        nature: "decisive",
        resultat:
          "Huit sur dix achètent chez Rivoire Matériaux. Ce qui les retient : l'ouverture à 6 h 30, pour charger avant le chantier (neuf sur dix) ; la livraison sur chantier dans la journée (sept sur dix) ; un comptoir qui les connaît. Le prix arrive en quatrième position. Julien Caron, plombier : « Rivoire n'est pas moins cher. Mais à 6 h 30, c'est ouvert. »",
      },
      {
        id: "prix",
        titre: "Relever les prix de Rivoire sur cinquante références",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur cinquante références courantes, l'agence est moins chère sur trente et une, plus chère sur dix-neuf. Écart moyen : 0,9 % en votre faveur.",
      },
      {
        id: "plan",
        titre: "Relire le plan d'affaires de l'agence",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le plan prévoit 45 artisans réguliers en semaine 13 et 90 k€ de contribution sur le trimestre, coûts d'acquisition et de stock déduits. Le stock, 420 k€, a été dimensionné sur les agences matures de la région ; 160 k€ n'ont rien vendu depuis l'ouverture.",
      },
      {
        id: "vienne",
        titre: "Appeler Martine Ferrand, qui a ouvert l'agence de Vienne",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Martine : « Avant de toucher aux prix, va demander aux artisans pourquoi ils ne viennent pas. Moi, j'ai perdu six mois en promotions. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous cette semaine ?",
    options: [
      {
        t: "Lancer une promotion de −15 % sur tout le magasin pendant trois semaines",
        d: "Radio locale et flyers dans les boîtes aux lettres : 3 000 €. Le magasin se remplit dès la semaine 2.",
      },
      {
        t: "Ouvrir à 6 h 30 et livrer sur chantier dans la journée",
        d: "Des horaires décalés pour l'équipe et un camion en location : 900 € par semaine.",
      },
      {
        t: "Écrire aux 400 artisans du fichier du siège",
        d: "Une lettre de présentation et une offre de bienvenue : 1 500 €.",
      },
      {
        t: "Laisser le temps faire : un mois, c'est court",
        d: "Aucune dépense. Une agence met un an à trouver sa clientèle.",
      },
    ],
    reactions: [
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Il y avait la queue à 9 heures : des particuliers, des gens qui comparent sur leur téléphone. Les deux plombiers habitués ont attendu vingt minutes au comptoir.",
        },
      ],
      [
        {
          de: "Julien Caron",
          role: "Plombier-chauffagiste",
          texte:
            "J'ai chargé à 6 h 40, et le tube était sur mon chantier à 11 heures. Rivoire ne fait pas ça le jour même.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Une dizaine d'artisans ont appelé après le courrier. La plupart demandaient nos horaires.",
        },
      ],
      [
        {
          de: "Gérald Perrin",
          role: "Directeur régional",
          texte: "Je note que tu attends. Le comité, lui, attendra un plan.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Bastien veut prospecter",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Bastien Morin",
        role: "Commercial terrain",
        heure: "08:00",
        alerte: true,
        texte:
          "Manon, je passe mes journées au comptoir. J'ai la liste des 140 artisans du secteur et je veux aller les voir. Dis-moi comment.",
      },
      {
        de: "Tableau de bord de l'agence",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 3 : ${ctx.ca} de chiffre d'affaires, ${ctx.reguliers} artisans réguliers, taux de marge ${ctx.taux}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "liste",
        titre: "Croiser la liste des artisans avec ce qu'ils achètent",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur 140 artisans, 52 sont plombiers-chauffagistes ou électriciens : ils achètent plusieurs fois par semaine, et se plaignent des ruptures de Rivoire sur le sanitaire. ${
            ctx.service
              ? "Ceux qui ont essayé l'agence depuis l'ouverture à 6 h 30 sont revenus deux fois sur trois."
              : "Ceux qui ont essayé l'agence ne sont pas revenus : « vous ouvrez trop tard pour nous »."
          }`,
      },
      {
        id: "tournee",
        titre: "Accompagner Bastien une matinée chez trois artisans",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un artisan vu une fois oublie ; vu tous les quinze jours, il finit par essayer. Mehdi Taleb, électricien : « Revenez me voir quand vous aurez de la gaine en stock et quelqu'un au comptoir à 6 h 30. »",
      },
    ],
    question: "Comment Bastien prospecte-t-il ?",
    options: [
      {
        t: "Cibler les plombiers-chauffagistes et les électriciens, deux matinées par semaine",
        d: "Une tournée régulière, chantier par chantier : 250 € de frais par semaine. Bastien reste au comptoir le reste du temps.",
      },
      {
        t: "Voir tous les artisans de la liste, quatre jours par semaine",
        d: "Le porte-à-porte complet en un mois : 450 € de frais par semaine. Le comptoir tourne sans lui.",
      },
      {
        t: "Afficher des prix d'appel sur trente références et prévenir par SMS",
        d: "Les produits que les artisans comparent, vendus presque au prix coûtant. 600 € de SMS et d'étiquetage.",
      },
      {
        t: "Garder Bastien au comptoir",
        d: "Le comptoir est renforcé ; les artisans viendront d'eux-mêmes.",
      },
    ],
    reactions: [
      [
        {
          de: "Bastien Morin",
          role: "Commercial terrain",
          texte:
            "Premier tour : quinze chantiers, que des plombiers et des électriciens. Trois m'ont demandé de repasser dans quinze jours avec les prix du sanitaire.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Bastien est sur la route toute la semaine. Au comptoir, on est deux pour la vague de 7 heures.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Les SMS ont marché : des clients que je n'avais jamais vus viennent pour les trente références, et repartent sans rien d'autre.",
        },
      ],
      [
        {
          de: "Bastien Morin",
          role: "Commercial terrain",
          texte:
            "D'accord, je reste au comptoir. Chez Rivoire, ils ont deux commerciaux sur la route.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le stock d'une agence mature",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Anne-Sophie Brunet",
        role: "Contrôleuse de gestion, siège",
        heure: "10:20",
        alerte: true,
        texte: `Le stock de l'agence est à ${ctx.stock}, dont ${ctx.dormant} sans une seule vente depuis l'ouverture. Frais financiers, casse et démarque : environ 1 500 € par semaine.`,
      },
      {
        de: "Samia Haddou",
        role: "Magasinière",
        heure: "11:05",
        texte:
          "J'ai trois allées de carrelage haut de gamme que personne ne regarde, et je suis en rupture de raccords cuivre deux jours sur cinq.",
      },
    ],
    sources: [
      {
        id: "familles",
        titre: "Analyser les ventes par famille de produits",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Plomberie, électricité et fixations : 58 % des ventes pour 22 % du stock, et une rupture une semaine sur trois. Carrelage, menuiserie intérieure et outillage haut de gamme : 41 % du stock pour 6 % des ventes. La plateforme régionale reprend les références dormantes ; il n'en coûte que le transport, 3 000 €.",
      },
    ],
    question: "Que faites-vous du stock ?",
    options: [
      {
        t: "Ajuster l'assortiment aux ventes réelles",
        d: "Renvoyer 110 k€ de références dormantes à la plateforme et renforcer plomberie, électricité et fixations. 3 000 € de transport.",
      },
      {
        t: "Solder les références dormantes à −35 %",
        d: "Trois semaines de déstockage pour écouler 80 k€ de stock : de la trésorerie tout de suite.",
      },
      {
        t: "Réduire de 30 % toutes les commandes de réassort",
        d: "Le stock baisse de 12 k€ par semaine, sans rien renvoyer.",
      },
      {
        t: "Garder le stock : une agence mature en aura besoin",
        d: "Aucun frais. Le stock attend la clientèle.",
      },
    ],
    reactions: [
      [
        {
          de: "Samia Haddou",
          role: "Magasinière",
          texte:
            "Les raccords cuivre sont en rayon sur deux profondeurs. Julien Caron m'a dit qu'il ne passait plus chez Rivoire pour le sanitaire.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Le déstockage attire du monde, surtout des particuliers et des revendeurs. Le carrelage part, la marge avec.",
        },
      ],
      [
        {
          de: "Samia Haddou",
          role: "Magasinière",
          texte:
            "Moins de réassort, moins de cartons. Mais ce matin, plus de gaine ICTA : Mehdi Taleb est reparti les mains vides.",
        },
      ],
      [
        {
          de: "Anne-Sophie Brunet",
          role: "Contrôleuse de gestion, siège",
          texte: "C'est noté. Je remonte le sujet au comité stock du mois prochain.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Morel Bâtiment veut des prix",
    jusqua: 9,
    messages: () => [
      {
        de: "Didier Morel",
        role: "Gérant, Morel Bâtiment",
        heure: "07:50",
        alerte: true,
        texte:
          "Madame Pellerin, j'achète 6 000 € par semaine chez Rivoire. Je viens chez vous si vous me faites −12 % sur tout et un paiement à 60 jours. Réponse lundi.",
      },
      {
        de: "Gérald Perrin",
        role: "Directeur régional",
        heure: "09:30",
        texte:
          "Un client comme ça, c'est la moitié du chemin vers le point mort. Ne le laisse pas filer.",
      },
    ],
    sources: [
      {
        id: "credit",
        titre: "Demander une analyse de Morel Bâtiment au service crédit",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Douze compagnons, un chiffre d'affaires en hausse, mais une trésorerie tendue : deux retards de paiement signalés chez des fournisseurs cette année. Le service crédit conseille 30 jours et un encours plafonné à 8 000 €. À −12 %, la marge sur ses achats tomberait à 17 %.",
      },
      {
        id: "soustraitants",
        titre: "Appeler deux artisans qui travaillent pour Morel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Didier paie au dernier moment, tout le monde le sait. Mais quand il est bien servi, il le dit : ses sous-traitants achètent là où il achète. »",
      },
    ],
    question: "Que répondez-vous à Morel ?",
    options: [
      {
        t: "Accepter ses conditions : −12 % et 60 jours",
        d: "6 000 € de chiffre d'affaires par semaine dès la semaine 8.",
      },
      {
        t: "Lui proposer des conditions de professionnel",
        d: "−4 % sur ses familles de produits, 30 jours, encours plafonné à 8 000 €, livraison sur chantier. Il acceptera, ou restera chez Rivoire.",
      },
      {
        t: "Refuser poliment",
        d: "Pas de remise hors grille. Morel reste chez Rivoire.",
      },
    ],
    reactions: [
      [
        {
          de: "Didier Morel",
          role: "Gérant, Morel Bâtiment",
          texte: "Marché conclu. Première commande lundi, à livrer mercredi.",
        },
      ],
      null,
      [
        {
          de: "Didier Morel",
          role: "Gérant, Morel Bâtiment",
          texte: "Dommage pour vous. Rivoire sera content.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Faire venir les autres",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Gérald Perrin",
        role: "Directeur régional",
        heure: "08:40",
        alerte: true,
        texte: `Semaine 9 : ${ctx.reguliers} artisans réguliers, ${ctx.ca} de chiffre d'affaires. Il reste un mois avant le comité. Comment accélères-tu ?`,
      },
      {
        de: "Kevin Lopes",
        role: "Vendeur comptoir",
        heure: "10:15",
        texte:
          "Julien Caron demande si on peut faire quelque chose pour son beau-frère, plaquiste, qui hésite à venir.",
      },
    ],
    sources: [
      {
        id: "origine",
        titre: "Demander aux artisans réguliers comment ils ont connu l'agence",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.service
            ? "Un sur trois est venu parce qu'un confrère lui en a parlé : l'ouverture à 6 h 30 et la livraison se racontent sur les chantiers. Mais d'un corps de métier à l'autre, ça circule plus ou moins : les plombiers se parlent beaucoup, les maçons très peu."
            : "Presque tous sont venus seuls, par le courrier ou par la tournée. Aucun ne dit avoir été envoyé par un confrère : ce qu'ils trouvent ici ne se raconte pas encore.",
      },
    ],
    question: "Comment accélérez-vous ?",
    options: [
      {
        t: "Lancer un parrainage et un petit-déjeuner artisans",
        d: "Un petit-déjeuner à l'agence, et 30 € de bon d'achat au parrain et au filleul pour chaque artisan amené. 1 500 € pour lancer, puis 60 € par filleul.",
      },
      {
        t: "Ajouter une troisième tournée de prospection ciblée",
        d: "Bastien revoit les artisans qui lui ont dit « repassez ». 300 € par semaine.",
      },
      {
        t: "Organiser une journée portes ouvertes à −20 % sur tout",
        d: "Un samedi festif, buffet et remises : 2 000 €.",
      },
      {
        t: "Continuer comme ça",
        d: "Ce qui est lancé suit son cours.",
      },
    ],
    reactions: [
      [
        {
          de: "Julien Caron",
          role: "Plombier-chauffagiste",
          texte:
            "Je viens au petit-déjeuner avec mon beau-frère et deux gars de mon ancienne boîte. Les autres, on verra s'ils suivent.",
        },
      ],
      [
        {
          de: "Bastien Morin",
          role: "Commercial terrain",
          texte:
            "Trois tournées par semaine. Les artisans me reconnaissent : « encore vous ! » Mais ils prennent le catalogue.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Quatre cents personnes samedi, le buffet vidé à 10 heures. Lundi matin, le magasin était vide.",
        },
      ],
      [
        {
          de: "Bastien Morin",
          role: "Commercial terrain",
          texte: "On continue comme ça.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Gérald Perrin",
        role: "Directeur régional",
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant le comité. ${ctx.ca} de chiffre d'affaires cette semaine, taux de marge ${ctx.taux}. Le comité regardera le chiffre d'affaires de fin de trimestre : une dernière promotion, ça se monte vite.`,
      },
    ],
    sources: [
      {
        id: "perdus",
        titre: "Lister les artisans qui ne viennent plus",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.perdus} artisans ont acheté régulièrement depuis le début du trimestre, puis ont cessé de venir. Kevin connaît la raison pour la moitié d'entre eux : une livraison ratée, une rupture, un devis resté sans réponse. Aucun n'a été rappelé.`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Une promotion de −10 % sur tout pour les deux dernières semaines",
        d: "Flyers et SMS : 1 500 €. Le chiffre d'affaires de fin de trimestre sera au rendez-vous.",
      },
      {
        t: "Rappeler, puis aller voir, les artisans qui ne viennent plus",
        d: "Un appel, une visite, pour comprendre et réparer : 400 €.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          de: "Anne-Sophie Brunet",
          role: "Contrôleuse de gestion, siège",
          texte: "Le chiffre d'affaires de l'agence monte. Son taux de marge, lui, descend.",
        },
      ],
      [
        {
          de: "Kevin Lopes",
          role: "Vendeur comptoir",
          texte:
            "Plusieurs étaient partis pour une seule livraison ratée. On s'est excusés ; ils reviennent, avec des commandes en retard.",
        },
      ],
      [
        {
          de: "Gérald Perrin",
          role: "Directeur régional",
          texte: "Le trimestre se termine. On fera le point au comité.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Connaître ses clients, puis les servir", chemin: [1, 0, 0, 1, 0, 1] },
  { nom: "Casser les prix", chemin: [0, 2, 1, 0, 2, 0] },
  { nom: "Attendre que ça vienne", chemin: [3, 3, 3, 2, 3, 2] },
] as const;

/** Les options qui cherchent des clients par le prix plutôt que par le service : [décision, option]. */
export const PRIX = [
  [0, 0],
  [1, 2],
  [2, 1],
  [3, 0],
  [4, 2],
  [5, 0],
] as const;

/** Les options qui attendent que les clients viennent d'eux-mêmes : [décision, option]. */
export const ATTENTES = [
  [0, 3],
  [1, 3],
  [2, 3],
  [4, 3],
  [5, 2],
] as const;

export const REPONSES = {
  morelAccepte:
    "Vos conditions me vont, à condition que la livraison suive. Première commande lundi.",
  morelRefuse: "−4 %, ce n'est pas ce que je demandais. Je reste chez Rivoire.",
} as const;
