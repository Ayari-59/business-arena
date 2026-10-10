/**
 * LE DÉPÔT QUI DÉBORDE — le contenu de l'épisode.
 *
 * Juliette Brunet dirige le dépôt régional d'Arvel Distribution à
 * Saint-Priest : des préparateurs, des caristes et trois approvisionneurs qui
 * fournissent les agences de la région. Le dépôt manque de ce qui se vend et
 * déborde de ce qui dort ; un fournisseur décroche, l'inventaire ne colle
 * plus. Six décisions, chacune précédée de ce qu'une responsable de dépôt
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "repartition",
    t: "Le stock est mal réparti : trop sur les références qui dorment, pas assez sur celles qui se vendent",
  },
  {
    id: "inventaire",
    t: "L'inventaire informatique est faux : le système croit avoir en rayon des pièces qui n'y sont pas",
  },
  { id: "volume", t: "Le dépôt ne stocke pas assez : il faut remonter les niveaux partout" },
  {
    id: "fournisseurs",
    t: "Les fournisseurs livrent en retard : les ruptures viennent des achats",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "En rupture, et plein à craquer",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord du dépôt",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Taux de service aux agences : 91 % la semaine dernière, pour un objectif de 97 %. 130 références A en rupture. Taux d'occupation des emplacements : 94 %.",
      },
      {
        de: "Laurent Bessière",
        role: "Directeur supply chain",
        heure: "08:15",
        texte:
          "Juliette, les agences se plaignent tous les jours, et la direction financière me demande pourquoi on porte 1,4 M€ de stock. Dis-moi vendredi ce que tu fais.",
      },
      {
        de: "Olivier Jacquet",
        role: "Responsable de l'agence de Vénissieux",
        heure: "08:40",
        texte:
          "Encore douze lignes manquantes sur la livraison de ce matin, dont les chevilles et les vis à bois. Mes artisans vont chez le négoce d'en face.",
      },
      {
        de: "Bruno Ferreira",
        role: "Chef d'équipe préparation",
        heure: "09:05",
        texte:
          "On ne sait plus où ranger les réceptions : palettes au sol dans l'allée 9. Et Visseries du Dauphiné a encore livré avec une semaine de retard.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "abc",
        titre: "Extraire les ventes, le stock et les ruptures par classe ABC",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les 900 références A font 63 % des ventes et 85 % des ruptures, pour 14 % de la valeur du stock. Les 6 300 références C font 10 % des ventes et 70 % du stock, dont 800 k€ sans aucune sortie depuis douze mois.",
      },
      {
        id: "parametres",
        titre: "Relire les paramètres de réapprovisionnement",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Deux semaines de stock de sécurité pour toutes les références, calculées sur les ventes d'il y a dix-huit mois. Depuis, les ventes des A ont progressé de 26 % et celles des C ont reculé d'un tiers : le système recommande trop peu de ce qui se vend, et trop de ce qui dort.",
      },
      {
        id: "comptage",
        titre: "Faire compter trente références A en rupture",
        cout: 1,
        nature: "utile",
        resultat:
          "Sur trente références que le système dit en stock, sept sont introuvables en rayon. Rapporté aux A, l'écart d'inventaire approche 100 k€ : le système ne recommande pas ce qu'il croit avoir.",
      },
      {
        id: "agences",
        titre: "Comparer les commandes des agences à l'an dernier",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les commandes des agences varient de 7 % d'une semaine à l'autre, comme l'an dernier à la même époque. Rien d'inhabituel dans leur régularité.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Laurent",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Laurent : « Avant de commander plus, regarde où sont tes ruptures et où est ton stock. Je parie que ce ne sont pas les mêmes références. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Relever les stocks de sécurité de 25 % sur toutes les références",
        d: "Le système recommandera plus, partout, dès cette semaine.",
      },
      {
        t: "Recalculer les paramètres par classe ABC, sur les ventes réelles",
        d: "Deux semaines de sécurité sur les A et les B, une sur les C. Deux jours d'approvisionneur et l'éditeur du logiciel : 1 500 €.",
      },
      {
        t: "Commander en express les références en rupture",
        d: "Livraison sous 48 heures pendant quatre semaines, 12 % de surcoût sur chaque commande.",
      },
      {
        t: "Attendre l'inventaire annuel pour revoir les paramètres",
        d: "Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte:
            "C'est fait : le système propose bien plus de commandes cette semaine, sur tout le catalogue. Bruno demande où on va les mettre.",
        },
      ],
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte:
            "Paramètres recalculés. Le système commande enfin les vis et les chevilles au rythme où elles partent, et il a arrêté de recommander les C qui dorment.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte:
            "Les livraisons express arrivent, merci. Mais chaque semaine, ce sont d'autres références qui manquent.",
        },
      ],
      [
        {
          de: "Laurent Bessière",
          role: "Directeur supply chain",
          texte: "Les agences m'appellent encore. Qu'est-ce qui change, concrètement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "L'inventaire ne colle pas",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Bruno Ferreira",
        role: "Chef d'équipe préparation",
        heure: "15:40",
        alerte: true,
        texte:
          "Olivier réclame des vis inox que le système dit en stock : quarante boîtes à l'emplacement C-12-03. L'emplacement est vide. C'est la quatrième fois cette semaine.",
      },
      {
        de: "Tableau de bord du dépôt",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Taux de service en semaine 3 : ${ctx.service}. Références A en rupture : ${ctx.ruptures}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "compter",
        titre: "Faire compter vingt références A au hasard",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Six des vingt références ont un écart : le système compte en moyenne un tiers de plus que le rayon, et l'écart se concentre sur celles qui sortent le plus. ${
            ctx.classees
              ? "Avec le classement ABC à jour, l'équipe sait lesquelles compter chaque semaine : 900 références, pas 9 000."
              : "Sans classement à jour, impossible de savoir lesquelles compter en priorité parmi les 9 000 références du dépôt."
          }`,
      },
      {
        id: "origine",
        titre: "Demander à Bruno d'où viennent les écarts",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Erreurs de prélèvement, casse non déclarée, retours remis en rayon sans saisie : chaque semaine, l'écart grandit d'environ 5 % de ce qui sort sur les A. Un inventaire complet le remet à zéro, puis il recommence.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Lancer des comptages tournants hebdomadaires sur les références A",
        d: "Deux préparateurs une demi-journée par semaine : 600 € par semaine. Chaque écart trouvé est corrigé.",
      },
      {
        t: "Fermer le dépôt deux jours pour un inventaire complet",
        d: "En semaine 4. Intérim, heures et livraisons reportées : 14 000 €.",
      },
      {
        t: "Corriger les écarts au fil des réclamations des agences",
        d: "Ne coûte rien. On corrige quand une agence signale un manquant.",
      },
      {
        t: "Ajouter 15 % à toutes les commandes pour compenser les écarts",
        d: "Le système commandera plus, partout, à partir de la semaine 4.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte:
            "Premier comptage fait : 41 écarts sur 150 références. Samia a aussitôt recommandé celles qui étaient vides.",
        },
      ],
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte:
            "Inventaire terminé, dépôt rouvert. L'écart corrigé dépasse 100 k€. Les agences ont râlé pour les deux jours.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte: "D'accord, je vous signalerai les manquants. Trois encore ce matin.",
        },
      ],
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte: "Plus 15 % partout, c'est paramétré. Bruno m'a demandé si c'était une blague.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le fournisseur décroche",
    jusqua: 7,
    messages: () => [
      {
        de: "Samia Ouali",
        role: "Approvisionneuse senior",
        heure: "10:15",
        alerte: true,
        texte:
          "Visseries du Dauphiné annonce cinq semaines de délai au lieu de trois. C'est 23 % de nos ventes A : vis, chevilles, fixations.",
      },
      {
        de: "Marc Perrin",
        role: "Directeur commercial, Visseries du Dauphiné",
        heure: "11:30",
        texte:
          "Notre atelier de conditionnement est saturé. Nous faisons au mieux pour tous nos clients.",
      },
    ],
    sources: [
      {
        id: "visseries",
        titre: "Appeler Marc Perrin pour comprendre ce qui se passe",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un gros client a doublé ses commandes par peur de manquer, et l'atelier est saturé. Marc peut revenir à deux semaines pour les clients qui lui donnent des prévisions et commandent à date fixe, « à condition de ne pas recevoir d'autres commandes doublées ». Il ne le garantit pas.",
      },
      {
        id: "second",
        titre: "Demander aux achats du groupe un second fournisseur",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un fournisseur référencé par le groupe peut prendre la moitié des volumes, livrée en deux semaines, 3 % plus cher. Soulagé d'autant, Visseries reviendrait à trois semaines.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Doubler les commandes chez Visseries pour se couvrir",
        d: "Pendant trois semaines. Ce qui arrivera en trop servira plus tard.",
      },
      {
        t: "Partager nos prévisions avec Visseries et commander à date fixe",
        d: "Une prévision sur huit semaines, une commande régulière chaque lundi. Marc fera au mieux.",
      },
      {
        t: "Basculer la moitié des volumes sur le second fournisseur du groupe",
        d: "Livré en deux semaines, 3 % plus cher sur la moitié des achats de visserie.",
      },
      {
        t: "Relancer Visseries chaque jour par téléphone",
        d: "Samia appelle tous les matins.",
      },
    ],
    reactions: [
      [
        {
          de: "Marc Perrin",
          role: "Directeur commercial, Visseries du Dauphiné",
          texte:
            "Bien reçu vos commandes. Je ne vous cache pas qu'elles passeront après celles déjà en file.",
        },
      ],
      null,
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte:
            "Premières commandes passées chez le second fournisseur. Il tient ses délais ; ses prix sont un peu plus hauts.",
        },
      ],
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte: "Je les appelle tous les matins. Ils sont aimables, et toujours en retard.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le dépôt déborde",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Bruno Ferreira",
        role: "Chef d'équipe préparation",
        heure: "07:30",
        alerte: true,
        texte: `Taux d'occupation : ${ctx.occupation}. Des palettes au sol dans trois allées, les caristes perdent un temps fou à déplacer pour prélever, et hier on a dû faire attendre un camion au quai.`,
      },
      {
        de: "Agnès Roux",
        role: "Contrôleuse de gestion",
        heure: "09:10",
        texte: `Le stock du dépôt est à ${ctx.stock}. La direction financière veut savoir ce que tu comptes faire.`,
      },
    ],
    sources: [
      {
        id: "dormants",
        titre: "Lister les références sans sortie depuis douze mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "800 k€ de références dormantes occupent près de 60 % des emplacements. 300 k€ peuvent repartir : retours aux fournisseurs sous accord de reprise, transferts vers les agences qui les vendent encore, déstockage aux artisans. Décote moyenne : 6 %, soit 18 000 €.",
      },
      {
        id: "debord",
        titre: "Demander un devis d'entrepôt de débord",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un entrepôt à Corbas peut offrir 15 % de place en plus dès la semaine 8 : 4 500 € par semaine, navettes comprises. Il faudra y aller chercher ce qu'on y range.",
      },
    ],
    question: "Comment faites-vous de la place ?",
    options: [
      {
        t: "Louer un entrepôt de débord à Corbas",
        d: "15 % de place en plus dès la semaine 8. 4 500 € par semaine, navettes comprises.",
      },
      {
        t: "Faire sortir 300 k€ de dormants : retours, transferts, déstockage",
        d: "En semaines 8 et 9. Environ 6 % de décote : 18 000 €.",
      },
      {
        t: "Geler tous les achats pendant deux semaines",
        d: "Aucune commande fournisseur en semaines 8 et 9 : le stock baissera vite.",
      },
      {
        t: "Réorganiser les allées et faire avec",
        d: "Un samedi de rangement, sans frais.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte:
            "Les navettes vers Corbas tournent. On y a mis les C, et on y retourne deux fois par jour.",
        },
      ],
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte:
            "Les premiers retours sont partis, et l'agence de Bron a repris des sanitaires qu'elle vend encore. On respire dans les allées.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte: "Plus rien n'arrive ? Mes artisans, eux, attaquent la saison.",
        },
      ],
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte: "Allées rangées. Dans deux semaines, ce sera pareil.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les agences se couvrent",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Samia Ouali",
        role: "Approvisionneuse senior",
        heure: "08:45",
        alerte: true,
        texte:
          "Les commandes des agences ont bondi cette semaine, surtout sur les A. Vénissieux commande trois semaines de vis d'un coup.",
      },
      {
        de: "Olivier Jacquet",
        role: "Responsable de l'agence de Vénissieux",
        heure: "09:20",
        texte: `Avec un taux de service à ${ctx.service}, je préfère avoir du stock chez moi. Je ne suis pas le seul.`,
      },
    ],
    sources: [
      {
        id: "ventes",
        titre: "Comparer les commandes des agences à leurs ventes au comptoir",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les commandes dépassent les ventes des agences de 20 à 35 % : elles se constituent des stocks de précaution, d'autant plus gros qu'elles ont manqué ces dernières semaines. Ce qu'elles stockent aujourd'hui, elles ne le commanderont pas en semaines 12 et 13.",
      },
    ],
    question: "Comment servez-vous les agences ?",
    options: [
      {
        t: "Servir toutes les commandes telles qu'elles arrivent",
        d: "Le dépôt est là pour servir les agences.",
      },
      {
        t: "Allouer les A au prorata des ventes réelles de chaque agence",
        d: "Chaque agence reçoit ce qu'elle vend, et voit le taux de service publié chaque lundi. Une journée d'approvisionneur.",
      },
      {
        t: "Commander plus aux fournisseurs pour suivre la demande des agences",
        d: "Le système recalcule ses besoins sur les commandes des agences.",
      },
      {
        t: "Plafonner chaque agence à sa commande habituelle",
        d: "Au-delà, la commande attend la semaine suivante.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte: "Volumes records préparés cette semaine. Les rayons A se vident à vue d'œil.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte:
            "Bon. Si je reçois vraiment ce que je vends, je n'ai pas besoin d'en stocker. Le tableau du lundi aide.",
        },
      ],
      [
        {
          de: "Samia Ouali",
          role: "Approvisionneuse senior",
          texte:
            "Le système a gonflé toutes les commandes A et B. Les fournisseurs livreront en semaines 11 et 12.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte:
            "Le plafond tombe mal : mon plus gros chantier démarre, et le reste de ma commande attendra une semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Un chantier de 220 logements",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Laurent Bessière",
        role: "Directeur supply chain",
        heure: "08:30",
        alerte: true,
        texte:
          "Le bailleur Logis du Vélin rénove 220 logements en semaines 12 et 13, et nos agences ont emporté le marché : 240 k€ de matériel à sortir du dépôt en deux semaines. Comment tu t'organises ?",
      },
      {
        de: "Tableau de bord du dépôt",
        role: "Point hebdomadaire",
        heure: "09:00",
        texte: `Taux de service en semaine 11 : ${ctx.service}. Occupation : ${ctx.occupation}.`,
      },
    ],
    sources: [
      {
        id: "liste",
        titre: "Demander au conducteur de travaux la liste de matériel et le planning",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La liste tient sur quatre pages : 140 références, presque toutes des A et des B — plaques, rails, fixations, isolants — avec les quantités semaine par semaine. Aucune référence C.",
      },
    ],
    question: "Comment préparez-vous le dépôt ?",
    options: [
      {
        t: "Remonter tous les stocks de 20 % pour être prêts",
        d: "Commandes urgentes sur tout le catalogue, livrées en semaine 12. 3 % de transport express.",
      },
      {
        t: "Commander exactement la liste du chantier, livrée en semaine 12",
        d: "140 références, aux quantités du planning. Rien de plus.",
      },
      {
        t: "Faire livrer le chantier directement par les fournisseurs",
        d: "Le dépôt ne voit pas passer la marchandise. 5 % de frais de livraison directe.",
      },
      {
        t: "Laisser le réapprovisionnement automatique suivre",
        d: "Le système commandera ce qui sortira.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Ferreira",
          role: "Chef d'équipe préparation",
          texte:
            "Les camions arrivent de partout. Une bonne partie de ce qu'on reçoit ne servira pas au chantier.",
        },
      ],
      [
        {
          de: "Laurent Bessière",
          role: "Directeur supply chain",
          texte: "Le conducteur de travaux me dit que tout était là, à l'heure. Bravo.",
        },
      ],
      [
        {
          de: "Laurent Bessière",
          role: "Directeur supply chain",
          texte: "Les fournisseurs livrent le chantier. Ça marche, mais les frais sont pour nous.",
        },
      ],
      [
        {
          de: "Olivier Jacquet",
          role: "Responsable de l'agence de Vénissieux",
          texte:
            "Le chantier a vidé nos rayons de plaques et de rails. Les artisans du quartier repartent les mains vides.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mettre le stock au bon endroit", chemin: [1, 0, 1, 1, 1, 1] },
  { nom: "Commander plus de tout", chemin: [0, 3, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [3, 2, 3, 3, 0, 3] },
] as const;

/** Les options qui répondent à la rupture ou au trop-plein en ajoutant du stock ou de la place : [décision, option]. */
export const REFLEXES = [
  [0, 0],
  [1, 3],
  [2, 0],
  [3, 0],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  fournisseurTient:
    "Avec vos prévisions, on a pu planifier l'atelier : vos commandes partiront sous deux semaines dès lundi prochain.",
  fournisseurNeTientPas:
    "J'ai essayé, mais un autre client a encore doublé ses volumes : vos commandes régulières passent après les siennes. Comptez six semaines pour les trois prochaines.",
} as const;
