/**
 * L'ATELIER SATURÉ — le contenu de l'épisode.
 *
 * Florent Sauvageot est responsable de l'atelier de menuiserie sur mesure
 * d'Arvel Distribution, à Rillieux-la-Pape : fenêtres, portes d'entrée et
 * escaliers, pour les artisans clients des agences. Tout passe par un centre
 * d'usinage à commande numérique, plein du lundi au vendredi. Le carnet
 * déborde, les devis partent chez les concurrents, et chacun a son idée de ce
 * qu'il faudrait fabriquer d'abord. Six décisions, chacune précédée de ce
 * qu'un responsable d'atelier reçoit vraiment.
 *
 * La notion est celle du FACTEUR RARE : quand une ressource est saturée, on
 * classe les produits par marge sur coût variable par heure de cette
 * ressource, et le prix plancher d'une commande devient son coût variable
 * plus le coût d'opportunité des heures qu'elle prend. Toutes les données du
 * calcul sont dans les sources ; aucune ne le fait à la place du joueur.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const CLOTILDE = { de: "Clotilde Varin", role: "Directrice des opérations" } as const;
const SOIZIC = { de: "Soizic Le Bihan", role: "Contrôleuse de gestion" } as const;
const ALEXANDRE = { de: "Alexandre Fourcade", role: "Directeur commercial" } as const;
const SEKOU = { de: "Sékou Traoré", role: "Opérateur du centre d'usinage" } as const;
const LUCIEN = { de: "Lucien Bouvard", role: "Chef d'équipe assemblage" } as const;
const DELPHINE = {
  de: "Delphine Arcand",
  role: "Responsable des achats, Alvéole Habitat",
} as const;
const BOGDAN = { de: "Bogdan Ilie", role: "Technicien du constructeur de la machine" } as const;
const VICTOR = { de: "Victor Landrin", role: "Promoteur, Landrin Promotion" } as const;
const DAUBREE = { de: "Jean-Marc Daubrée", role: "Gérant, Menuiseries Daubrée" } as const;
const TABLEAU = { de: "Suivi de l'atelier", role: "Point hebdomadaire" } as const;

/**
 * Ce que la machine refuse, selon la règle du planning : la dernière heure
 * part toujours au produit que la règle sert en dernier. C'est le prix d'une
 * heure de machine, celui que coûte toute heure qu'on lui prend.
 */
export function produitRefuse(ctx: Contexte): string {
  switch (ctx.regle) {
    case 0:
      return "des fenêtres, à 810 € de marge sur coût variable par heure de machine";
    case 1:
      return "des escaliers, à 400 € de marge sur coût variable par heure de machine";
    case 2:
      return "des portes d'entrée, à 650 € de marge sur coût variable par heure de machine";
    default:
      return "un peu de chaque produit, à proportion : 591 € de marge sur coût variable par heure de machine en moyenne";
  }
}

export const DIAGNOSTICS = [
  {
    id: "facteurRare",
    t: "Le centre d'usinage est le goulot, et le planning ne regarde pas ce que rapporte une heure de machine : il la donne à des pièces qui la paient mal",
  },
  {
    id: "capacite",
    t: "L'atelier manque de capacité : il faut plus d'heures de centre d'usinage",
  },
  {
    id: "escaliers",
    t: "L'atelier ne fait pas assez d'escaliers, le produit qui rapporte le plus",
  },
  {
    id: "prix",
    t: "Les fenêtres sont vendues trop bas : avec 140 € de résultat par pièce, elles ne paient pas l'atelier",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le carnet déborde",
    jusqua: 3,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "07:30",
        alerte: true,
        texte: `Centre d'usinage : 48 heures de pièces demandées la semaine dernière pour 38 heures disponibles, soit une charge de ${ctx.charge}. Délai annoncé aux agences : neuf semaines. Les devis refusés partent chez les concurrents.`,
      },
      {
        ...CLOTILDE,
        heure: "08:40",
        texte:
          "Florent, l'atelier refuse des commandes et sa marge est sous le budget. Le comité veut savoir vendredi ce que tu changes au planning.",
      },
      {
        ...ALEXANDRE,
        heure: "09:15",
        texte:
          "Les escaliers, c'est 2 800 € de marge par pièce, et le meilleur taux de marge de l'atelier : c'est ce qui le fait vivre. Mes agences en ont six en attente. Fais-les passer devant.",
      },
      {
        ...SEKOU,
        heure: "10:05",
        texte:
          "La machine tourne du matin au soir. Derrière, l'assemblage attend mes pièces. Je ne peux pas aller plus vite.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "fiches",
        titre: "Reprendre les fiches de coût des trois produits",
        cout: 1,
        nature: "decisive",
        resultat:
          "Prix moyens de vente hors taxes et coûts variables par pièce. Fenêtre : 900 € ; bois 180 €, double vitrage 190 €, quincaillerie 75 €, finition 50 €. Porte d'entrée : 3 250 € ; bois 720 €, panneau isolant et vitrage 420 €, serrure trois points et paumelles 510 €, finition 300 €. Escalier quart tournant en chêne : 5 600 € ; chêne 1 950 €, quincaillerie et fixations 230 €, vernis et finition 380 €, livraison 240 €. Temps de centre d'usinage par pièce : une demi-heure pour une fenêtre, 2 heures pour une porte, 7 heures pour un escalier (4 pour les limons, 3 pour les marches). Les menuisiers sont payés au mois : leur temps n'est pas un coût variable.",
      },
      {
        id: "charge",
        titre: "Relever la charge de chaque poste de l'atelier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Centre d'usinage : 42 heures d'ouverture par semaine, dont 4 de réglages et de changements de série, soit 38 heures d'usinage ; la demande en réclame 48 (15 pour les fenêtres, 12 pour les portes, 21 pour les escaliers). Débit : 70 % de charge. Assemblage : 75 %. Finition : 65 %. Seule la machine refuse des pièces ; les autres postes l'attendent.",
      },
      {
        id: "carnet",
        titre: "Éplucher le carnet de commandes avec Alexandre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "En moyenne, les agences demandent chaque semaine 30 fenêtres, 6 portes d'entrée et 3 escaliers. Au premier arrivé, premier servi, l'atelier en sert à peine huit sur dix, quel que soit le produit. Alexandre : « Un escalier, c'est six fenêtres de chiffre d'affaires. »",
      },
      {
        id: "coutComplet",
        titre: "Demander le coût de revient complet au service comptable",
        cout: 1,
        nature: "bruit",
        resultat:
          "Coût de revient complet, charges fixes de l'atelier réparties au prorata des heures de main-d'œuvre : fenêtre 760 €, porte d'entrée 2 880 €, escalier 4 700 €. Résultat par pièce : 140 € pour une fenêtre, 370 € pour une porte, 900 € pour un escalier.",
      },
      {
        id: "conseil",
        titre: "Appeler Annick Fargeot, ancienne responsable de production",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Annick Fargeot : « Quand une machine est pleine, ne regarde pas ce que rapporte une pièce. Regarde ce que rapporte une heure de cette machine. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle règle donnez-vous au planning du centre d'usinage ?",
    options: [
      {
        t: "Passer les escaliers en priorité : la plus forte marge sur coût variable par pièce",
        d: "2 800 € de marge par escalier. Les portes ensuite, les fenêtres avec ce qui reste de machine.",
      },
      {
        t: "Classer les produits par marge sur coût variable par heure de centre d'usinage",
        d: "Ceux qui rapportent le plus par heure de machine passent d'abord, les autres prennent ce qui reste. Une demi-journée avec Soizic pour refaire le planning.",
      },
      {
        t: "Classer les produits par taux de marge sur coût variable",
        d: "Le produit qui garde la plus grande part de son prix passe d'abord, les autres prennent ce qui reste.",
      },
      {
        t: "Garder le premier arrivé, premier servi",
        d: "Chaque commande attend son tour, quel que soit le produit.",
      },
    ],
    reactions: [
      [
        {
          ...LUCIEN,
          texte:
            "Trois escaliers sur la machine cette semaine. Les fenêtres attendent, et les artisans appellent pour savoir où en sont leurs châssis.",
        },
      ],
      [
        {
          ...SOIZIC,
          texte:
            "Le planning est refait : les fenêtres d'abord, puis les portes, et les escaliers avec les heures qui restent. Alexandre fait la tête.",
        },
      ],
      [
        {
          ...SEKOU,
          texte:
            "Les escaliers d'abord, puis les fenêtres. Les portes d'entrée prennent du retard : trois devis annulés depuis mercredi.",
        },
      ],
      [
        {
          ...CLOTILDE,
          texte: "Donc rien ne change ? Le comité attendait autre chose.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La commande du bailleur",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...ALEXANDRE,
        heure: "09:20",
        alerte: true,
        texte:
          "Alvéole Habitat nous demande 30 portes palières coupe-feu pour une résidence à Caluire, livrées des semaines 4 à 9, à 1 350 € la porte. Le coût variable est de 900 € : 450 € de marge par porte, 13 500 € sur la commande. Je leur dis oui ?",
      },
      {
        ...DELPHINE,
        heure: "11:00",
        texte:
          "Monsieur Sauvageot, il nous faut votre réponse lundi. Notre prix est ferme, mais nous savons que vos délais sont tenus.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 3 : charge du centre d'usinage ${ctx.charge}, marge par heure de machine ${ctx.margeHeure}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "fichePorte",
        titre: "Chiffrer la porte palière avec le bureau d'études",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Porte palière coupe-feu : coût variable de 900 € (bois et âme coupe-feu 520 €, quincaillerie et ferme-porte 260 €, finition 120 €). Une heure et demie de centre d'usinage par porte : 45 heures sur six semaines, 7 h 30 par semaine.",
      },
      {
        id: "refusBailleur",
        titre: "Demander à Soizic ce que la machine refuse aujourd'hui",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Soizic : « Avec le planning actuel, chaque heure prise sur la machine est retirée à la dernière pièce servie. Aujourd'hui, ce sont ${produitRefuse(ctx)}. »`,
      },
    ],
    question: "Que répondez-vous au bailleur ?",
    options: [
      {
        t: "Accepter à 1 350 € : le prix couvre largement le coût variable",
        d: "450 € de marge par porte, 13 500 € sur la commande. 45 heures de machine sur six semaines.",
      },
      {
        t: "Contre-proposer 1 650 € la porte",
        d: "300 € de plus que le prix proposé. Le bailleur peut refuser et aller ailleurs.",
      },
      {
        t: "Décliner : l'atelier est plein",
        d: "Pas de commande, pas d'heures prises sur la machine.",
      },
    ],
    reactions: [
      [
        {
          ...DELPHINE,
          texte: "Parfait, nous signons. Premières livraisons en semaine 4.",
        },
      ],
      null,
      [
        {
          ...ALEXANDRE,
          texte: "Ils iront chez un concurrent. Dommage, c'était un beau volume.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Desserrer le goulot",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...CLOTILDE,
        heure: "08:30",
        alerte: true,
        texte:
          "Florent, le comité accepte de mettre de l'argent sur l'atelier, à condition que ça paie dans le trimestre. Qu'est-ce que tu proposes ?",
      },
      {
        ...TABLEAU,
        heure: "09:00",
        texte: `Fin de semaine 5 : charge du centre d'usinage ${ctx.charge}, ${ctx.caPerdu} de devis perdus faute de machine depuis le début du trimestre.`,
      },
      {
        ...ALEXANDRE,
        heure: "10:10",
        texte:
          "Le plus simple : faire fabriquer les fenêtres par un industriel. Elles ne rapportent que 405 € pièce, et ça libère la machine pour les escaliers.",
      },
    ],
    sources: [
      {
        id: "leviers",
        titre: "Chiffrer les moyens d'ajouter des heures de machine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Deuxième équipe : un opérateur le soir, quatre soirs de deux heures et demie, soit 10 heures de machine en plus par semaine à partir de la semaine 8 ; 1 200 € par semaine, plus 1 500 € d'embauche et de formation. Réglages : des outils préréglés et des gabarits pour 4 500 € ; les réglages passent de 4 heures à 1 heure par semaine à partir de la semaine 7.",
      },
      {
        id: "refusLevier",
        titre: "Demander à Soizic ce que la machine refuse aujourd'hui",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Soizic : « Une heure de machine en plus servira la première pièce qu'on refuse aujourd'hui : ${produitRefuse(ctx)}. »`,
      },
      {
        id: "industriel",
        titre: "Demander un prix à un fabricant industriel de fenêtres",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un industriel de l'Ain livre des fenêtres en cotes standard à 790 € pièce, livraison comprise, à partir de la semaine 7. Revendues 900 €. Environ une demande sur sept est hors cotes standard : celles-là partiraient ailleurs.",
      },
    ],
    question: "Comment desserrez-vous le goulot ?",
    options: [
      {
        t: "Faire fabriquer les fenêtres par un industriel",
        d: "790 € la fenêtre livrée, revendue 900 €. La machine ne fait plus de fenêtres à partir de la semaine 7.",
      },
      {
        t: "Créer une deuxième équipe le soir sur le centre d'usinage",
        d: "10 heures de machine en plus par semaine dès la semaine 8. 1 200 € par semaine et 1 500 € d'embauche.",
      },
      {
        t: "Réduire les temps de réglage",
        d: "Outils préréglés et gabarits : 4 500 €. Trois heures de machine gagnées par semaine dès la semaine 7.",
      },
      {
        t: "Ne rien changer ce trimestre",
        d: "Le carnet se calmera après les fêtes.",
      },
    ],
    reactions: [
      [
        {
          ...DAUBREE,
          texte:
            "Des fenêtres d'industriel, en cotes standard ? Mes clients paient pour du sur-mesure. Pour certains chantiers, je vais voir ailleurs.",
        },
      ],
      [
        {
          ...SEKOU,
          texte:
            "L'agence d'intérim a trouvé quelqu'un pour le soir : Ilyès Benabdallah. Je le forme la semaine prochaine, il démarre seul en semaine 8.",
        },
      ],
      [
        {
          ...LUCIEN,
          texte:
            "Les gabarits sont commandés. Sékou a déjà regroupé les programmes par famille de pièces.",
        },
      ],
      [
        {
          ...CLOTILDE,
          texte: "Le comité prend note. Il ne remettra pas d'argent sur la table ce trimestre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "La broche vibre",
    jusqua: 9,
    messages: () => [
      {
        ...SEKOU,
        heure: "07:50",
        alerte: true,
        texte:
          "Florent, la broche vibre depuis mardi. Sur les limons, les finitions ne sont plus nettes. J'ai appelé le constructeur.",
      },
      {
        ...BOGDAN,
        heure: "15:30",
        texte:
          "Les roulements de la broche sont usés. Elle peut tenir jusqu'à l'arrêt de Noël, ou pas. Je peux la changer en semaine 8, à vous de me dire quand.",
      },
    ],
    sources: [
      {
        id: "expertise",
        titre: "Demander au technicien le risque et les solutions",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Bogdan Ilie : « Sur des broches dans cet état, j'en vois casser une sur cinq d'ici Noël. Une casse, c'est deux jours de machine arrêtée et 6 500 € de réparation. Un changement préventif, c'est 3 900 €, et une journée et demie d'arrêt en semaine ; ou un samedi, avec 2 000 € de majoration. En réduisant les avances de coupe, le risque tombe sous une chance sur dix, mais la machine perd 8 % de ses heures. »",
      },
      {
        id: "refusBroche",
        titre: "Demander à Soizic ce que rapporte une heure de machine",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Soizic : « Une heure d'arrêt, c'est la dernière pièce servie qui ne passe pas : ${produitRefuse(ctx)}. »`,
      },
      {
        id: "comptable",
        titre: "Demander au service comptable le coût d'une heure d'arrêt",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le service comptable : « Une heure d'arrêt de la machine coûte 38 €, le salaire chargé de l'opérateur. L'amortissement court de toute façon. »",
      },
    ],
    question: "Que faites-vous de la broche ?",
    options: [
      {
        t: "Laisser tourner jusqu'à l'arrêt de Noël",
        d: "Rien à payer maintenant. Le technicien repassera en janvier.",
      },
      {
        t: "Changer la broche en semaine 8, en journée",
        d: "3 900 €, et une journée et demie de machine arrêtée.",
      },
      {
        t: "Changer la broche un samedi",
        d: "3 900 € et 2 000 € de majoration. La machine ne s'arrête pas en semaine.",
      },
      {
        t: "Réduire les avances de coupe jusqu'à Noël",
        d: "Rien à payer. La machine ménage sa broche et produit un peu moins.",
      },
    ],
    reactions: [
      [
        {
          ...SEKOU,
          texte: "D'accord. Je surveille les vibrations chaque matin, et je croise les doigts.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte: "Broche changée jeudi. La machine est recalée, elle repart vendredi midi.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte: "Broche changée samedi. Lundi à 7 heures, tout tournait.",
        },
      ],
      [
        {
          ...SEKOU,
          texte:
            "J'ai baissé les avances. Les limons prennent plus de temps, mais la broche chauffe moins.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le pic d'avant les fêtes",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ALEXANDRE,
        heure: "09:00",
        alerte: true,
        texte:
          "Le pic de fin d'année arrive : comme chaque année, les artisans veulent finir leurs chantiers avant les fêtes. Je veux lancer une promotion de 10 % sur les escaliers dans les agences, des semaines 10 à 13. C'est le gros ticket : c'est là qu'on fait du chiffre.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Marge de l'atelier à fin de semaine 9 : ${ctx.marge}, pour un budget à date de ${ctx.budgetADate}. Charge du centre d'usinage : ${ctx.charge}.`,
      },
    ],
    sources: [
      {
        id: "historique",
        titre: "Relire les deux derniers pics de fin d'année",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'an dernier, les demandes ont monté de 20 % des semaines 11 à 13, sur les trois produits. Il y a deux ans, une promotion de 10 % sur les escaliers avait fait 40 % de demandes d'escaliers en plus ; une hausse de 8 % de leur prix en avait coûté 20 %.",
      },
      {
        id: "samedi",
        titre: "Demander à Sékou s'il peut venir le samedi",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sékou et le régleur acceptent de venir le samedi pendant le pic : huit heures de machine, pour 1 300 € le samedi, primes et majorations comprises. L'assemblage reprend les pièces le lundi.",
      },
    ],
    question: "Comment abordez-vous le pic ?",
    options: [
      {
        t: "Lancer la promotion de 10 % sur les escaliers",
        d: "Semaines 10 à 13, dans toutes les agences. Plus de demandes d'escaliers.",
      },
      {
        t: "Ouvrir le centre d'usinage le samedi pendant le pic",
        d: "Trois samedis, semaines 11 à 13 : huit heures de machine chacun, 1 300 € le samedi.",
      },
      {
        t: "Relever de 8 % le prix des escaliers pendant le pic",
        d: "Semaines 10 à 13. Un peu moins de demandes d'escaliers.",
      },
      {
        t: "Ne rien changer",
        d: "Le pic passera comme les autres années.",
      },
    ],
    reactions: [
      [
        {
          ...ALEXANDRE,
          texte: "La promotion est partie dans les agences. Les devis d'escaliers pleuvent.",
        },
      ],
      [
        {
          ...SEKOU,
          texte: "On sera là les trois samedis. Lucien passera prendre les pièces le lundi matin.",
        },
      ],
      [
        {
          ...ALEXANDRE,
          texte: "Je l'annonce aux agences. Certains clients vont trouver ça cher, je te préviens.",
        },
      ],
      [
        {
          ...LUCIEN,
          texte: "On fera comme d'habitude : ce qui ne passe pas sur la machine, on le refuse.",
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
        ...CLOTILDE,
        heure: "08:30",
        alerte: true,
        texte: `Florent, marge de l'atelier à fin de semaine 11 : ${ctx.marge}, pour un budget à date de ${ctx.budgetADate}. Alexandre propose de passer les escaliers en tête les deux dernières semaines : 5 600 € de facture à chaque pièce, c'est du chiffre d'affaires vite fait.`,
      },
      {
        ...VICTOR,
        heure: "11:45",
        texte:
          "Monsieur Sauvageot, il me faut quatre escaliers en chêne massif, avec garde-corps, livrés avant Noël. Je vous les paie 6 800 € pièce.",
      },
    ],
    sources: [
      {
        id: "fichePromoteur",
        titre: "Chiffrer les escaliers du promoteur",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Escalier haut de gamme : 3 000 € de coût variable (chêne massif 2 200 €, garde-corps et fixations 450 €, finition 350 €), et 7 heures de centre d'usinage, comme un escalier courant. Livraison en semaines 12 et 13 : 14 heures de machine par semaine.",
      },
      {
        id: "refusPromoteur",
        titre: "Demander à Soizic ce que la machine refuse aujourd'hui",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Soizic : « Les heures qu'on prendra seront retirées à la dernière pièce servie : ${produitRefuse(ctx)}. »`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Passer les escaliers en tête les deux dernières semaines",
        d: "Le plus gros chiffre d'affaires par pièce passe d'abord sur la machine.",
      },
      {
        t: "Accepter les quatre escaliers du promoteur",
        d: "6 800 € pièce, livrés en semaines 12 et 13. 28 heures de machine.",
      },
      {
        t: "Garder le planning et refuser les commandes nouvelles",
        d: "L'atelier est plein jusqu'à Noël.",
      },
    ],
    reactions: [
      [
        {
          ...LUCIEN,
          texte:
            "Les escaliers passent devant. Les fenêtres attendront janvier, si les clients attendent.",
        },
      ],
      [
        {
          ...VICTOR,
          texte: "Parfait. Je vous envoie les plans lundi.",
        },
      ],
      [
        {
          ...VICTOR,
          texte: "Dommage. Je trouverai quelqu'un d'autre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Raisonner par heure de machine", chemin: [1, 1, 1, 0, 1, 1] },
  { nom: "La marge par pièce d'abord", chemin: [0, 0, 0, 1, 0, 0] },
  { nom: "Attentiste", chemin: [3, 2, 3, 0, 3, 2] },
] as const;

/**
 * Les réflexes du métier quand la machine est pleine : regarder la marge ou
 * le taux de marge d'une pièce plutôt que ce qu'elle rapporte par heure de
 * machine, et compter une heure de machine pour rien (le prix qui couvre le
 * coût variable, l'arrêt qui « ne coûte que le salaire »). [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 0],
  [3, 1],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  contreAcceptee:
    "C'est plus cher que notre enveloppe, mais vos délais sont tenus et nos chantiers ne peuvent pas attendre : nous signons à 1 650 €.",
  contreRefusee:
    "1 650 €, c'est au-dessus de ce que nous pouvons payer. Nous allons voir ailleurs, merci quand même.",
  clientParti:
    "Monsieur Sauvageot, neuf semaines pour des fenêtres, mes clients ne l'acceptent plus. Je passe chez un autre fournisseur, pour les fenêtres et pour le reste.",
  casse:
    "La broche a cassé ce matin, en plein usinage d'un limon. Le technicien arrive demain : deux jours sans machine.",
  equipe: "Ilyès a fait sa première soirée seul sur la machine. Dix heures de plus par semaine.",
  industriel:
    "Premières fenêtres de l'industriel livrées. Deux artisans ont refusé les cotes standard.",
} as const;
