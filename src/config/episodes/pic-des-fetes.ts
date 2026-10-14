/**
 * LE PIC DES FÊTES — le contenu de l'épisode.
 *
 * Maëwenn Postec est directrice des ressources humaines de la Laiterie de
 * Kerbrélan. En décembre, les ventes de desserts doublent ; les lignes 5 et 6
 * de Loudéac ne peuvent pas produire d'avance au-delà d'une semaine (DLC de
 * 28 jours, deux tiers exigés à réception), et l'an dernier la moitié des
 * intérimaires sont partis avant la fin. D'octobre à décembre, six décisions,
 * chacune précédée de ce qu'une DRH d'usine reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent vient des constantes du modèle ; le test de l'épisode le vérifie.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape, Message } from "./types";

export const DIAGNOSTICS = [
  {
    id: "heures",
    t: "Il manque des heures de ligne en décembre, et la DLC interdit de les produire d'avance : c'est de la capacité humaine à trouver, et tôt",
  },
  {
    id: "interim",
    t: "Les intérimaires partent avant la fin du pic : c'est leur fidélisation qu'il faut régler",
  },
  {
    id: "stock",
    t: "L'usine s'y prend trop tard : il faut constituer du stock dès octobre, quand les lignes ont de la marge",
  },
  {
    id: "trs",
    t: "Le TRS des lignes est trop bas : en le portant à 75 %, l'usine absorberait le pic sans renfort",
  },
] as const;

const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const GURVAN = { de: "Gurvan Kerebel", role: "Responsable de production de Loudéac" } as const;
const ERWANN = { de: "Erwann Tromeur", role: "Chef de l'atelier de conditionnement" } as const;
const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const THECLE = { de: "Thècle Kergoat", role: "Chargée des ressources humaines" } as const;
const PATERNE = {
  de: "Paterne Allanic",
  role: "Secrétaire du CSE, conducteur de la ligne 5",
} as const;
const RADIA = { de: "Radia Pouliquen", role: "Cheffe d'équipe des lignes desserts" } as const;
const JODOC = { de: "Jodoc Rannou", role: "Conducteur de la ligne 6, tuteur" } as const;
const TAHAR = { de: "Tahar Héliès", role: "Responsable santé et sécurité du site" } as const;
const KRISTELL = {
  de: "Kristell Garel",
  role: "Responsable de l'agence Trévélo Intérim",
} as const;
const JURISTE = { de: "Service juridique", role: "Siège, Loudéac" } as const;
const TABLEAU = { de: "Supervision des lignes", role: "Lignes 5 et 6, Loudéac" } as const;

const texte = (ctx: Contexte, cle: string) => String(ctx[cle] ?? "");

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le double en décembre",
    jusqua: 2,
    messages: () => [
      {
        ...YSEE,
        heure: "07:40",
        alerte: true,
        texte:
          "Prévisions des fêtes validées avec le commercial : sur les crèmes desserts et les riz au lait de Loudéac, les commandes doublent en décembre. Celtis et Opaline attendent 98,5 % de taux de service sur toute la période.",
      },
      {
        ...YANNIG,
        heure: "08:15",
        texte:
          "Maëwenn, l'an dernier on a raté Noël : des ruptures chez les trois enseignes, et la moitié des intérimaires partis avant la fin. Octobre, novembre, décembre : c'est ton trimestre. Dis-moi vendredi comment on trouve les bras.",
      },
      {
        ...GURVAN,
        heure: "09:30",
        texte:
          "Le plus simple : faire tourner les lignes le samedi dès maintenant et remplir les chambres froides. Et on appelle l'agence fin novembre, quand les commandes seront fermes, comme chaque année.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "previsions",
        titre: "Lire les prévisions de ventes de la supply chain",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ysée Bescond : « Lignes 5 et 6, en pots par semaine : 630 000 en octobre. Semaine du 23 novembre, 976 500 avec le catalogue d'Opaline ; 30 novembre, 1 071 000 ; 7 décembre, 1 197 000 ; 14 et 21 décembre, 1 260 000, le double d'octobre ; 28 décembre, 945 000. Les desserts frais ont une DLC de 28 jours, et les centrales exigent d'en recevoir au moins les deux tiers : avec une journée de transport, un pot doit quitter l'usine au plus 8 jours après sa fabrication. »",
      },
      {
        id: "lignes",
        titre: "Demander à la production la fiche des lignes 5 et 6",
        cout: 1,
        nature: "decisive",
        resultat:
          "Gurvan Kerebel : « Cadence nominale : 7 200 pots à l'heure sur chaque ligne. TRS moyen sur douze mois : 62,5 %, entre les changements de format, les nettoyages et les micro-arrêts. En 2×8 du lundi au vendredi, il reste 7,5 heures de production par poste une fois le nettoyage en place fait : 150 heures de ligne par semaine pour les deux lignes. Une ligne en marche, c'est six personnes : un conducteur, un préparateur de mix et quatre opérateurs de conditionnement. »",
      },
      {
        id: "bilan",
        titre: "Relire le bilan de l'intérim de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Thècle Kergoat : « L'agence a été appelée le 26 novembre pour 18 intérimaires. 9 sont arrivés le 30, sans formation, mis là où il manquait quelqu'un ; 5 étaient partis avant Noël. Deux presque-accidents à la thermoformeuse, et un lot de 36 000 pots mal scellés détruit. Trévélo Intérim nous avait prévenus : en décembre, toutes les usines du bassin recrutent en même temps. »",
      },
      {
        id: "absenteisme",
        titre: "Comparer l'absentéisme des lignes desserts à celui de la branche",
        cout: 1,
        nature: "bruit",
        resultat:
          "5,1 % sur les douze derniers mois sur les lignes 5 et 6, contre 5,4 % dans l'industrie laitière d'après les chiffres de la branche. Rien d'anormal.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Efflam Jézéquel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Efflam Jézéquel : « Avant de parler de stock ou d'intérim, compte les heures : ce qu'il faudra sortir chaque semaine de décembre, divisé par ce qu'une ligne sort vraiment en une heure, et compare avec ce que les équipes font déjà. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment préparez-vous le pic de décembre ?",
    options: [
      {
        t: "Appeler l'agence d'intérim fin novembre, quand les commandes des enseignes seront fermes",
        d: "Comme chaque année. Rien à payer avant décembre ; l'agence enverra qui elle trouvera à partir du 30 novembre.",
      },
      {
        t: "Commander dès maintenant 10 intérimaires pour le 9 novembre, et les former deux semaines avant le pic",
        d: "Hygiène, bonnes pratiques, sécurité, puis la ligne aux côtés d'un conducteur : 3 500 € de formation, et deux semaines d'intérim payées avant le pic, 9 800 € par semaine.",
      },
      {
        t: "Produire d'avance : faire tourner les deux lignes le samedi dès le 31 octobre et stocker chez Transports Kerfroid",
        d: "Quatre samedis de volontaires en heures supplémentaires, 4 680 € chacun, et une chambre froide louée 2 500 € par semaine. L'intérim sera appelé fin novembre.",
      },
      {
        t: "Commander dès maintenant 10 intérimaires pour le 23 novembre : ils apprendront sur la ligne",
        d: "Pas d'intérim à payer avant le pic. Ils arrivent la première semaine du pic, sans formation.",
      },
    ],
    reactions: [
      [
        {
          ...GURVAN,
          texte:
            "Comme d'habitude, alors. Je préviens Trévélo Intérim qu'on les rappellera fin novembre.",
        },
      ],
      [
        {
          ...KRISTELL,
          texte:
            "Commande enregistrée pour le 9 novembre. En octobre, j'ai encore le choix : je vous envoie des personnes qui ont déjà travaillé en agroalimentaire.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "Samedis planifiés à partir du 31 octobre. Les équipes demandent ce qu'on fera de tous ces pots.",
        },
      ],
      [
        {
          ...KRISTELL,
          texte:
            "Commande enregistrée pour le 23 novembre. Je ne vous promets pas qu'ils seront tous là : fin novembre, tout le bassin recrute.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les congés de Noël",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...THECLE,
        heure: "10:20",
        alerte: true,
        texte:
          "Planning des congés de fin d'année : 8 des 28 permanents des lignes 5 et 6 ont posé du 21 décembre au 3 janvier, dont trois conducteurs. Ils ont été validés en juin, comme chaque année.",
      },
      {
        ...PATERNE,
        heure: "11:05",
        texte:
          "On entend dire dans l'atelier que les congés de Noël vont sauter. Si c'est le cas, j'aimerais l'apprendre de vous avant la réunion du CSE.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Taux de service de la semaine : ${texte(ctx, "service")}. Les lignes ont tourné ${texte(ctx, "capacite")} pour un besoin de ${texte(ctx, "besoin")}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "accord",
        titre: "Relire l'accord d'entreprise de 2021 sur le temps de travail",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'accord permet de faire varier la durée du travail entre 28 et 40 heures par semaine sur l'année, avec sept jours ouvrés de prévenance ; tant que la moyenne annuelle reste à 35 heures, les heures au-delà de 35 ne sont pas des heures supplémentaires. Il n'a jamais servi. Quarante heures en décembre, c'est un septième de plus : 21 heures de ligne par semaine, récupérées en janvier et février, quand les lignes tournent à 85 %.",
      },
      {
        id: "conges",
        titre: "Demander aux huit salariés en congé s'ils accepteraient de décaler",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six sur huit décaleraient en janvier contre une prime de 200 € et la garantie d'avoir le 24 ou le 31 décembre. Les deux autres ont des billets d'avion. Huit absents, c'est 43 heures de ligne de moins chacune des deux dernières semaines ; deux absents, 11.",
      },
      {
        id: "climat",
        titre: "Prendre le pouls de Paterne Allanic",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Paterne Allanic : « Refuser tous les congés de Noël, l'atelier le vivra comme une punition. Il y a deux ans, quand deux ponts ont sauté, il y a eu des arrêts maladie la semaine même. Si on nous propose quelque chose, on écoute. »",
      },
      {
        id: "nordal",
        titre: "Regarder ce que fait le Groupe Nordal",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "D'après la presse professionnelle, le Groupe Nordal annonce trois cents recrutements saisonniers dans ses usines françaises pour les fêtes. L'article ne dit pas comment ils sont formés, ni combien restent.",
      },
    ],
    question: "Que décidez-vous pour le temps de travail des permanents en décembre ?",
    options: [
      {
        t: "Appliquer l'accord de 2021 : 40 heures en décembre, récupérées en janvier, et proposer de décaler les congés contre une prime",
        d: "Pas d'heures majorées : les heures sont récupérées en janvier et février. 200 € par congé décalé. Il faut l'expliquer à l'atelier.",
      },
      {
        t: "Refuser tous les congés du 21 décembre au 3 janvier, et prévoir des heures supplémentaires pour tous en décembre",
        d: "Tout le monde présent à Noël. 15 heures de ligne de plus par semaine en décembre, majorées de 25 % : 2 925 € par semaine.",
      },
      {
        t: "Garder les horaires et les congés tels qu'ils sont",
        d: "Aucun coût. Huit permanents absents les deux dernières semaines.",
      },
      {
        t: "Proposer des heures supplémentaires volontaires en décembre, sans toucher aux congés",
        d: "15 heures de ligne de plus par semaine en décembre, majorées de 25 % : 2 925 € par semaine. Les congés posés sont maintenus.",
      },
    ],
    reactions: [
      [
        {
          ...PATERNE,
          texte:
            "L'accord de 2021 dormait dans un tiroir. Six collègues ont signé pour décaler, contre la garantie du 24 ou du 31. La réunion s'est bien passée.",
        },
      ],
      [
        {
          ...PATERNE,
          texte:
            "Le CSE prend acte. Dans l'atelier, ça passe très mal : certains avaient leurs billets depuis l'été.",
        },
      ],
      [
        {
          ...THECLE,
          texte:
            "Les congés restent validés. Je préviens Gurvan qu'il aura huit absents les deux dernières semaines.",
        },
      ],
      [
        {
          ...RADIA,
          texte:
            "La liste des heures supplémentaires de décembre est affichée. Ceux qui partent à Noël s'inscrivent plutôt début décembre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Ouvrir le week-end",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...GURVAN,
        heure: "08:50",
        alerte: true,
        texte:
          "Même avec du monde en plus en semaine, il faudra tourner le week-end en décembre. Je propose un samedi sur deux pour tout le monde, par note de service : c'est le plus simple.",
      },
      {
        ...PATERNE,
        heure: "10:30",
        texte:
          "La réunion du CSE est le 5 novembre. Si vous voulez faire travailler le week-end, c'est maintenant qu'il faut nous en parler.",
      },
      {
        ...KRISTELL,
        heure: "14:10",
        texte: texte(ctx, "agence"),
      },
    ],
    sources: [
      {
        id: "suppleance",
        titre: "Demander au service juridique ce qu'exige une équipe de suppléance",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "« Une équipe de suppléance travaille le samedi et le dimanche, à la place des équipes de semaine ; ses salariés sont volontaires et payés avec une majoration de 50 %. Il faut un accord collectif ou l'autorisation de l'inspection du travail, après avis du CSE. Pour les deux lignes : deux jours de 11 heures de production, 44 heures de ligne par week-end ; douze volontaires en postes de 12 heures, 11 232 € par week-end. »",
      },
      {
        id: "volontaires",
        titre: "Sonder les permanents sur le travail du week-end",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${texte(ctx, "volontaires")} permanents se disent prêts à travailler les week-ends de décembre, s'ils sont volontaires et payés en conséquence. Il en faut douze par week-end.${
            ctx.congesRefuses
              ? " Depuis le refus des congés de Noël, plusieurs ont retiré leur nom : « on donne déjà Noël »."
              : ""
          }`,
      },
      {
        id: "avis",
        titre: "Demander à Paterne Allanic ce que dira le CSE",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Paterne Allanic : « Si on nous associe avant, volontariat écrit, pas plus de trois week-ends sur quatre, retour en semaine garanti en janvier, l'avis sera sans doute favorable. Sans doute, pas sûrement : une partie des élus ne veut pas entendre parler du dimanche. Par note de service, ce sera non, et on écrira à l'inspection du travail. »",
      },
      {
        id: "samedi",
        titre: "Chiffrer un samedi en heures supplémentaires",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un samedi sur les deux lignes : 22 heures de ligne, douze personnes en postes de 12 heures, majorées de 25 % : 4 680 €. Des heures supplémentaires volontaires ne demandent pas l'avis du CSE, dans la limite du contingent annuel.",
      },
    ],
    question: "Comment ouvrez-vous les lignes le week-end en décembre ?",
    options: [
      {
        t: "Proposer au CSE une équipe de suppléance du week-end, au volontariat, en l'associant à ses règles",
        d: "44 heures de ligne par week-end en décembre, 11 232 € chacun. Il faut l'avis du CSE : réponse à la réunion du 5 novembre.",
      },
      {
        t: "Imposer par note de service un samedi sur deux à toutes les équipes",
        d: "22 heures de ligne par week-end en décembre, majorées de 25 % : 4 680 € par samedi. Pas besoin d'attendre le CSE.",
      },
      {
        t: "Ouvrir seulement le samedi, avec des volontaires en heures supplémentaires",
        d: "22 heures de ligne par week-end en décembre, 4 680 € par samedi. Pas d'avis du CSE à attendre.",
      },
      {
        t: "Ne pas ouvrir le week-end : la semaine doit suffire",
        d: "Aucun coût.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...PATERNE,
          texte:
            "Le CSE n'a pas été consulté : nous avons écrit à l'inspection du travail. Les samedis imposés, l'atelier s'en souviendra.",
        },
      ],
      [
        {
          ...RADIA,
          texte:
            "La liste des samedis volontaires de décembre est affichée. Ils veulent savoir assez tôt lesquels.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "Pas de week-end, donc. On fera avec la semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Deux semaines avant le pic",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...YSEE,
        heure: "09:10",
        alerte: true,
        texte: `Semaine du 23 novembre : 976 500 pots commandés, le catalogue d'Opaline tombe en même temps que la montée de décembre. Le planning de la semaine prochaine laisse ${texte(ctx, "libres")} de ligne libres.`,
      },
      {
        ...GURVAN,
        heure: "10:40",
        texte:
          "Je peux remplir la chambre froide et louer de la place chez Kerfroid : trois semaines d'avance, et on est tranquilles jusqu'au 10 décembre.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Intérimaires sur les lignes cette semaine : ${texte(ctx, "interimaires")}.`,
      },
    ],
    sources: [
      {
        id: "dlc",
        titre: "Demander à la qualité ce que les centrales acceptent",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Annaïg Le Dantec : « 28 jours de DLC, les deux tiers exigés à réception : un pot fabriqué le 16 novembre doit partir au plus tard le 24. L'an dernier, Celtis a refusé deux camions à 17 jours de DLC restante. Un pot refusé se vend 0,08 € à un soldeur ; il nous a coûté 0,23 € de matières et d'emballages. »",
      },
      {
        id: "chambre",
        titre: "Demander à la supply chain la place en chambre froide",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ysée Bescond : « La chambre froide de l'usine peut garder 300 000 pots d'avance, pas plus. Au-delà, Transports Kerfroid loue des chambres à 2 500 € la semaine. Ce qui sort de l'usine part dans l'ordre de fabrication. »",
      },
      {
        id: "pontivy",
        titre: "Comparer avec les desserts de Pontivy",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "À Pontivy, les crèmes desserts stérilisées UHT ont une DDM de quatre mois : l'usine constitue son stock de Noël dès septembre. Fanchon Lozac'h : « Chez nous, Noël se prépare en été. »",
      },
    ],
    question: "Produisez-vous d'avance avant le pic ?",
    options: [
      {
        t: "Non : produire au fil des commandes",
        d: "Aucun coût. La semaine du 23 novembre se fera avec les heures de la semaine.",
      },
      {
        t: "Produire une semaine d'avance : les heures libres de la semaine prochaine et un samedi, dans la limite de la chambre froide",
        d: "Un samedi de volontaires, 4 680 €. Jusqu'à 300 000 pots pour la semaine du 23 novembre, expédiés à moins de huit jours.",
      },
      {
        t: "Constituer trois semaines d'avance : les heures libres, un samedi et un week-end complet, stockés chez Kerfroid",
        d: "Un samedi, un week-end complet en plus (11 232 €) et des chambres louées chez Kerfroid, 2 500 € par semaine. De quoi couvrir jusqu'au 10 décembre.",
      },
    ],
    reactions: [
      [
        {
          ...YSEE,
          texte: "Pas de stock d'avance : on démarrera le 23 novembre au niveau habituel.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "Samedi planifié avec des volontaires. Les crèmes et les riz au lait de la semaine du 23 sont en chambre froide, étiquetés par date de fabrication.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "Week-end complet planifié et deux chambres louées chez Kerfroid. Il y a des palettes partout.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le pic commence",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "18:00",
        alerte: true,
        texte: `Première semaine du pic : taux de service ${texte(ctx, "service")}. ${texte(ctx, "presence")}`,
      },
      {
        ...RADIA,
        heure: "18:20",
        texte:
          "À partir de lundi, on tourne aussi la nuit. Il me manque du monde à la conduite de la thermoformeuse et à la préparation des mix. Je mets les intérimaires là où il y a un trou ?",
      },
      {
        ...TAHAR,
        heure: "18:45",
        texte: "Avant de répondre à Radia, relisons ensemble le document unique.",
      },
    ],
    sources: [
      {
        id: "document",
        titre: "Relire le document unique avec Tahar Héliès",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trois postes sont classés à risque sur les lignes 5 et 6 : la conduite de la thermoformeuse (outils de découpe, zone de scellage chaude), la préparation des mix (produits du nettoyage en place, soude) et le chariot élévateur. Dans la branche, un intérimaire non formé sur l'un de ces postes a trois fois plus d'accidents qu'un salarié formé. Un accident avec arrêt nous coûte en moyenne 22 000 € ; un scellage mal réglé, c'est un lot de 36 000 pots bloqué et détruit.",
      },
      {
        id: "pontivyTutorat",
        titre: "Appeler Fanchon Lozac'h, à Pontivy",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Fanchon Lozac'h : « L'an dernier, nos intérimaires étaient sur les postes simples, encaissage, palettisation, contrôle visuel, avec un tuteur pour quatre et une demi-journée d'accueil sécurité. Ils sont partis deux fois moins que ceux de Loudéac, et aucun ne s'est blessé. »",
      },
      {
        id: "agence",
        titre: "Faire le point avec Trévélo Intérim",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Kristell Garel : « ${texte(ctx, "pointAgence")} En décembre, je n'ai plus personne à vous envoyer pour remplacer un départ. »`,
      },
    ],
    question: "Où mettez-vous les intérimaires pendant le pic ?",
    options: [
      {
        t: "Partout où il manque quelqu'un, conduite de la thermoformeuse et préparation des mix comprises",
        d: "Les permanents sont libérés pour la nuit et le week-end : 4 heures de ligne de plus par semaine.",
      },
      {
        t: "Sur les postes simples, avec un tuteur pour quatre et une demi-journée d'accueil sécurité",
        d: "1 200 € d'accueil, une prime de tutorat de 80 € par tuteur et par semaine. Les postes à risque restent aux permanents.",
      },
      {
        t: "Les laisser apprendre sur le tas : les chefs d'équipe ont autre chose à faire en décembre",
        d: "Aucun coût. Chacun se débrouille.",
      },
    ],
    reactions: [
      [
        {
          ...RADIA,
          texte:
            "Trois intérimaires à la thermoformeuse et deux à la préparation des mix dès lundi. Les conducteurs passent la moitié de leur temps à surveiller.",
        },
      ],
      [
        {
          ...JODOC,
          texte:
            "J'ai mes quatre. Encaissage et palettisation ; ils me posent dix questions par heure. Tant mieux : ils les posent avant de se tromper.",
        },
      ],
      [
        {
          ...RADIA,
          texte:
            "Ils prennent les postes comme ils viennent. La nuit, il arrive qu'un intérimaire se retrouve seul à la préparation des mix.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les deux semaines de Noël",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "18:00",
        alerte: true,
        texte: `Semaine du 7 décembre : taux de service ${texte(ctx, "service")}, ${texte(ctx, "capacite")} de ligne pour un besoin de ${texte(ctx, "besoin")}. Absentéisme des permanents : ${texte(ctx, "absenteisme")}.`,
      },
      {
        ...YSEE,
        heure: "18:30",
        texte:
          "Celtis et Opaline confirment 1 260 000 pots par semaine pour les deux semaines de Noël. Chaque pot manquant leur coûte une pénalité de 15 % du prix de cession.",
      },
      {
        ...GURVAN,
        heure: "19:05",
        texte:
          "La seule façon d'y arriver : tout le monde fait six heures de plus par semaine jusqu'au 24. Je fais la note ?",
      },
    ],
    sources: [
      {
        id: "formats",
        titre: "Demander à l'atelier où partent les heures de ligne",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Erwann Tromeur : « En décembre, 24 changements de format par semaine sur les deux lignes : éditions de fêtes, petits formats, verrines. 75 minutes chacun en moyenne, nettoyage compris : 30 heures de ligne par semaine. Les quatorze petites références ne font que 9 % des volumes ; produites en deux campagnes par semaine, huit changements suffiraient. »",
      },
      {
        id: "penalites",
        titre: "Demander à Naïm Lefeuvre ce que coûtent les ruptures, enseigne par enseigne",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Naïm Lefeuvre : « Celtis et Opaline appliquent leur pénalité sur chaque pot manquant. Proxival accepte un report de 48 heures sans pénalité sur ses drives si on le prévient trois jours avant. En servant d'abord les commandes sous pénalité, on en évite deux sur cinq. »",
      },
      {
        id: "fatigue",
        titre: "Faire le point sur la sécurité avec Tahar Héliès",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Tahar Héliès : « Absentéisme des permanents : ${texte(ctx, "absenteisme")}. Six heures de plus pour tous, deux semaines de suite, après le début du pic : c'est le scénario des accidents de fin d'année. ${texte(ctx, "accidents")} »`,
      },
    ],
    question: "Comment passez-vous les deux semaines de Noël ?",
    options: [
      {
        t: "Imposer six heures supplémentaires par semaine à tous les permanents jusqu'au 24 décembre",
        d: "28 heures de ligne de plus par semaine pendant deux semaines, majorées de 25 % : 5 460 € par semaine.",
      },
      {
        t: "Regrouper les petites références en deux campagnes par semaine, et servir d'abord les commandes sous pénalité",
        d: "Pas de coût direct. Ysée refait l'ordonnancement ; Naïm prévient Proxival des reports.",
      },
      {
        t: "Ne rien changer : la supply chain gérera les ruptures",
        d: "Aucun coût.",
      },
      {
        t: "Rappeler l'agence pour huit intérimaires de plus",
        d: "28 € de l'heure. Arrivée le 21 décembre, s'ils sont trouvés, sans formation.",
      },
    ],
    reactions: [
      [
        {
          ...PATERNE,
          texte:
            "La note est affichée : six heures de plus pour tout le monde. Dans l'atelier, on ne parle plus que de ça.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Ordonnancement refait : les petites références passent le mardi et le jeudi. Proxival accepte les reports de 48 heures sur ses drives.",
        },
      ],
      [
        {
          ...YSEE,
          texte: "Je préviens les enseignes au fil de l'eau.",
        },
      ],
      null,
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Trouver les heures tôt", chemin: [1, 0, 0, 1, 1, 1] },
  { nom: "L'intérim au dernier moment, les heures imposées", chemin: [0, 1, 1, 2, 0, 0] },
  { nom: "Comme chaque année", chemin: [0, 2, 3, 0, 2, 2] },
] as const;

/**
 * Les réflexes d'une usine qui court derrière son pic : appeler l'intérim au
 * dernier moment, produire d'avance au-delà de ce que la DLC permet, imposer
 * des heures à tous (congés refusés, samedis par note de service, heures de
 * Noël). [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [2, 1],
  [3, 2],
  [5, 0],
] as const;

export const REPONSES = {
  avisFavorable:
    "Avis favorable du CSE, à deux voix près : volontariat écrit, trois week-ends sur quatre au plus, retour en semaine garanti en janvier. Premier week-end de l'équipe de suppléance le 5 décembre.",
  avisDefavorable:
    "Avis défavorable du CSE : une partie des élus refuse le travail du dimanche, et la majorité a suivi. Le service juridique déconseille de passer outre : pas d'équipe de suppléance. Au mieux, un samedi de volontaires à partir du 19 décembre.",
} as const;

/** La réponse de l'agence quand on redemande huit intérimaires pour Noël. */
export function renfortDeNoel(trouves: number): Message[] {
  return [
    {
      ...KRISTELL,
      texte:
        trouves === 0
          ? "Je suis désolée : à dix jours de Noël, je n'ai trouvé personne."
          : `J'en ai trouvé ${trouves} sur 8. Ils commencent le 21 décembre ; aucun n'a travaillé en agroalimentaire.`,
    },
  ];
}

export const PERSONNES = {
  ANNAIG,
  EFFLAM,
  ERWANN,
  FANCHON,
  PATERNE,
  GURVAN,
  JURISTE,
  KRISTELL,
  THECLE,
  NAIM,
  TAHAR,
  RADIA,
  YANNIG,
  YSEE,
} as const;
