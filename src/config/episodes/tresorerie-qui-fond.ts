/**
 * LA TRÉSORERIE QUI FOND — le contenu de l'épisode.
 *
 * Béatrice Castagnier est responsable administrative et financière d'Arvel
 * Matériaux Rhône Sud, une filiale d'Arvel Distribution : six agences, une
 * activité qui progresse, une marge qui tient. Et un découvert qui touche
 * l'autorisation. Six décisions, chacune précédée de ce qu'une responsable
 * financière reçoit vraiment : un relevé, un banquier, un client qui ne paie
 * plus, un fournisseur qui propose un escompte.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "bfr",
    t: "La croissance, les retards clients et le stock gonflent le BFR : l'argent dort au bilan",
  },
  { id: "clients", t: "Les clients paient de plus en plus tard" },
  {
    id: "rentabilite",
    t: "La filiale ne gagne plus assez : la marge ne couvre plus les charges",
  },
  { id: "fournisseurs", t: "Les fournisseurs sont payés trop vite" },
] as const;

const BANQUE = {
  de: "Olivier Peyrache",
  role: "Chargé d'affaires entreprises, la banque",
} as const;
const PATRICK = { de: "Patrick Ollier", role: "Directeur de la filiale" } as const;
const AURORE = { de: "Aurore Mazet", role: "Responsable du recouvrement" } as const;
const THIERRY = { de: "Thierry Gallet", role: "Chef comptable" } as const;
const NORVIA = { de: "Stéphanie Royer", role: "Directrice commerciale, Norvia" } as const;
const FRANCK = { de: "Franck Delmas", role: "Directeur commercial" } as const;
const JULIEN = { de: "Julien Ribeiro", role: "Responsable des achats" } as const;
const CIMIER = { de: "Didier Ravel", role: "Gérant, Cimier Construction" } as const;
const TABLEAU = { de: "Tableau de trésorerie", role: "Point hebdomadaire" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le découvert approche",
    jusqua: 3,
    messages: (ctx) => [
      {
        de: "Relevé bancaire",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte: `Solde du compte courant : −${ctx.decouvert}, pour une autorisation de découvert de ${ctx.autorisation}. Marge disponible : ${ctx.marge}.`,
      },
      {
        ...PATRICK,
        heure: "08:15",
        texte:
          "Béatrice, on fait 8 % de ventes de plus qu'il y a un an, la marge tient, et le banquier m'appelle parce qu'on frôle le découvert. Je ne comprends pas. Dis-moi vendredi ce que tu fais.",
      },
      {
        ...AURORE,
        heure: "09:00",
        texte:
          "Les retards s'accumulent. On est trois pour 1 400 comptes en retard : on relance au fil de l'eau, quand on peut, dans l'ordre alphabétique.",
      },
      {
        de: "Mehdi Saïdi",
        role: "Comptable fournisseurs",
        heure: "09:40",
        texte:
          "Les échéances fournisseurs de vendredi font 310 k€. Je peux en décaler une partie si tu veux : tout le monde le fait.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "balance",
        titre: "Lire la balance âgée des clients",
        cout: 1,
        nature: "decisive",
        resultat:
          "3,2 M€ de créances, dont 1,1 M€ échues. Quinze clients font 68 % de l'échu ; Cimier Construction à lui seul doit 200 k€, dont 140 k€ à plus de soixante jours. Les 1 400 autres comptes en retard se partagent le reste, souvent pour moins de 500 €.",
      },
      {
        id: "bfr",
        titre: "Décomposer le besoin en fonds de roulement",
        cout: 1,
        nature: "decisive",
        resultat: (ctx) =>
          `BFR : ${ctx.bfr}. Les clients paient à ${ctx.dso} (objectif 52), le stock représente ${ctx.stock} de coût des ventes (objectif 70), les fournisseurs sont payés à 48 jours. Chaque jour de délai client immobilise 57 k€, chaque jour de stock 42 k€. Et à délais constants, la croissance seule prend 25 k€ de trésorerie par semaine.`,
      },
      {
        id: "resultat",
        titre: "Relire le compte de résultat du mois",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Chiffre d'affaires en hausse de 8 % sur un an, marge brute à 27 %, résultat d'exploitation conforme au budget. Rien d'anormal.",
      },
      {
        id: "prevision",
        titre: "Construire la prévision de trésorerie à treize semaines",
        cout: 1.5,
        nature: "utile",
        resultat: (ctx) =>
          `Sans rien changer, le découvert dépasse l'autorisation dès la semaine ${ctx.premierDepassement} et atteint ${ctx.previsionPic} en semaine ${ctx.semainePic}. La semaine 12 concentre l'acompte d'impôt sur les sociétés et les loyers trimestriels des agences : 560 k€.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil au directeur financier du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Bernard Faure : « Avant de chercher de l'argent, cherche où il dort. Et ne te fâche ni avec ta banque ni avec Norvia : ce sont tes deux plus gros prêteurs. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Décaler de trois semaines les paiements aux fournisseurs",
        d: "Mehdi étale les échéances de février et de mars. Libère près de 800 k€ d'ici la semaine 4, sans frais.",
      },
      {
        t: "Relancer d'abord les quinze plus gros encours échus, Cimier en tête",
        d: "Balance âgée en main, appels personnels et dates de paiement écrites. Un intérimaire en renfort d'Aurore pendant une semaine : 1 800 €.",
      },
      {
        t: "Lancer une relance générale de tous les clients en retard",
        d: "Lettre et appel aux 1 400 comptes, avec un prestataire de recouvrement. 2 000 €.",
      },
      {
        t: "Attendre les encaissements de fin de mois",
        d: "Les artisans paient souvent le 10. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...NORVIA,
          texte:
            "Béatrice, notre comptabilité me signale trois semaines de retard sur vos règlements. Notre assureur-crédit suit ces choses-là de près. Je compte sur vous pour régulariser.",
        },
      ],
      [
        {
          ...AURORE,
          texte:
            "On a appelé les quinze plus gros, un par un. Cimier a promis 80 k€ pour la semaine prochaine, et les autres ont tous donné une date. Ça change de l'ordre alphabétique.",
        },
      ],
      [
        {
          ...FRANCK,
          texte:
            "Mes commerciaux reçoivent des appels d'artisans vexés d'être relancés par un prestataire pour 300 €. Deux sont partis chez le concurrent.",
        },
      ],
      [
        {
          ...BANQUE,
          texte:
            "Madame Castagnier, votre compte est à quelques dizaines de milliers d'euros de la limite. J'aimerais vous voir rapidement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La banque demande des comptes",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...BANQUE,
        heure: "10:10",
        alerte: true,
        texte: `Votre découvert est à ${ctx.decouvert} pour une autorisation de ${ctx.autorisation}, et il se creuse depuis trois mois alors que votre activité progresse. Mon comité de crédit se réunit la semaine prochaine. Que voulez-vous que je lui présente ?`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Délai de paiement clients : ${ctx.dso}. Stock : ${ctx.stock}. Découvert prévu au plus haut : ${ctx.previsionPic}, en semaine ${ctx.semainePic}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "comite",
        titre: "Demander à Olivier ce qu'attend son comité",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "« Le comité ne refuse pas un relèvement à un client qui arrive avec une prévision semaine par semaine et un plan : il refuse les demandes sans chiffres, à peu près sept fois sur dix. Au-delà de l'autorisation, c'est 15,5 % l'an, 350 € de commission par semaine, et nous rejetons des virements. Et un client qui nous fait attendre, nous lui réduisons sa ligne. »",
      },
      {
        id: "factor",
        titre: "Demander un devis d'affacturage",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mise en place : 2 500 €. Commission de 0,5 % sur tout le chiffre d'affaires cédé, soit 2 k€ par semaine, plus le financement à 6 %. Contrat d'un an au minimum. Le factor avance ce dont vous avez besoin au-delà de votre autorisation.",
      },
    ],
    question: "Que répondez-vous à la banque ?",
    options: [
      {
        t: "Lui présenter une prévision semaine par semaine et un plan d'action",
        d: "Deux jours de travail pour Thierry et vous. Vous demandez de porter l'autorisation à 1 350 k€ ; commission d'engagement : 1 500 €.",
      },
      {
        t: "Demander par courriel un relèvement à 1 300 k€",
        d: "La demande part ce soir, sans dossier. Frais de dossier : 500 €.",
      },
      {
        t: "Mettre en place l'affacturage sur toutes les factures",
        d: "Plus de risque de dépasser l'autorisation. 2 500 € de mise en place, puis 0,5 % du chiffre d'affaires.",
      },
      {
        t: "Repousser le rendez-vous au mois prochain",
        d: "Les chiffres seront meilleurs après les encaissements. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...BANQUE,
          texte:
            "Votre prévision est claire et le plan se tient. Le comité porte votre autorisation à 1 350 k€ dès la semaine prochaine. Tenez-moi au courant chaque mois.",
        },
      ],
      null,
      [
        {
          ...THIERRY,
          texte:
            "Le contrat d'affacturage est signé. Toutes nos factures passent désormais par le factor, et les clients ont reçu le courrier qui leur donne le nouveau compte où payer.",
        },
      ],
      [
        {
          ...BANQUE,
          texte: "Entendu pour le mois prochain. Je présenterai votre dossier au comité en l'état.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Cimier Construction ne paie plus",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...AURORE,
        heure: "11:20",
        alerte: true,
        texte: `Cimier Construction nous doit encore ${ctx.cimier}, presque tout à plus de soixante jours. Leur comptable ne répond plus au téléphone.`,
      },
      {
        ...FRANCK,
        heure: "14:05",
        texte:
          "Cimier, c'est 1,2 M€ d'achats par an et quinze ans de relation. Ne me les braquez pas : ils ont trois gros chantiers en cours.",
      },
    ],
    sources: [
      {
        id: "note",
        titre: "Demander à l'assureur-crédit la note de Cimier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Note abaissée de 6 à 4 sur 10 en un mois : Cimier attend lui-même le paiement d'un promoteur en difficulté. Risque de défaillance dans les trois mois : environ une chance sur cinq ; en cas de défaillance, on récupère d'ordinaire 30 % des créances. Un organisme de rachat reprendrait vos ${ctx.cimier} sans recours, avec une décote de 12 %.`,
      },
      {
        id: "historique",
        titre: "Revoir l'historique de paiement de Cimier",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Quinze ans de relation, jamais un impayé jusqu'à cet hiver. Délai de paiement : 52 jours l'an dernier, 95 aujourd'hui. ${
            ctx.relanceCiblee
              ? "Il a tout de même versé 80 k€ en semaine 3, après l'appel d'Aurore."
              : "Aucun versement depuis deux mois."
          }`,
      },
    ],
    question: "Que faites-vous avec Cimier ?",
    options: [
      {
        t: "Négocier un échéancier, et livrer contre paiement à la commande",
        d: "Cimier règle ce qu'il doit en huit semaines, à partir de la semaine 6, et paie ses nouvelles commandes d'avance. Il commandera un peu moins.",
      },
      {
        t: "Céder la créance sans recours à un organisme de rachat",
        d: "L'argent arrive en semaine 6, moins une décote de 12 %.",
      },
      {
        t: "Lancer une injonction de payer et suspendre ses livraisons",
        d: "3 000 € d'avocat ; la procédure prend six semaines. Cimier achètera ailleurs en attendant.",
      },
      {
        t: "Attendre : Cimier a toujours fini par payer",
        d: "Quinze ans de relation. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...CIMIER,
          texte:
            "Merci de ne pas nous lâcher. Le premier versement part lundi, et nos chantiers continuent avec vous.",
        },
      ],
      [
        {
          ...THIERRY,
          texte:
            "La créance est cédée : l'argent arrive lundi, moins la décote. Si Cimier tombe, ce ne sera plus notre problème.",
        },
      ],
      [
        {
          ...CIMIER,
          texte:
            "Une injonction de payer, après quinze ans ? Nous passerons nos commandes ailleurs en attendant le juge.",
        },
      ],
      [
        {
          ...AURORE,
          texte: "Cimier n'a rien versé cette semaine non plus. Le dossier reste sur mon bureau.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le stock a gonflé",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "08:00",
        alerte: true,
        texte: `Stock : ${ctx.stock} de coût des ventes, pour un objectif de 70 jours. Chaque jour de trop immobilise environ 42 k€.`,
      },
      {
        ...JULIEN,
        heure: "10:30",
        texte:
          "Les agences ont commandé large pour la saison, et trois fournisseurs nous ont poussé leurs promotions d'hiver. Les rayons débordent.",
      },
    ],
    sources: [
      {
        id: "rotation",
        titre: "Analyser le stock par rotation",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les 300 références qui font 80 % des ventes sont à 45 jours de stock : il n'y a pas de gras. Le surplus est ailleurs : 2 100 références n'ont pas bougé depuis six mois, pour 610 k€. Les fournisseurs en reprennent la moitié contre des frais de retour ; ce qui restera à la clôture devra être déprécié.",
      },
      {
        id: "agences",
        titre: "Demander l'avis des chefs d'agence",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Tous jugent leur stock nécessaire : « Un artisan qui ne trouve pas son produit va chez le voisin. » Aucun ne connaît la rotation de ses références.",
      },
    ],
    question: "Que faites-vous du stock ?",
    options: [
      {
        t: "Renvoyer les invendus repris et ne plus réapprovisionner les références dormantes",
        d: "Frais de retour : 9 000 €. Les références qui tournent restent commandées normalement.",
      },
      {
        t: "Lancer une promotion de déstockage sur tout le catalogue",
        d: "15 % de remise pendant trois semaines : environ 20 000 € de marge cédée.",
      },
      {
        t: "Geler toutes les commandes pendant quatre semaines",
        d: "Le stock baisse vite. Ne coûte rien.",
      },
      {
        t: "Laisser le stock tel quel : la saison va l'écouler",
        d: "Le printemps arrive. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...JULIEN,
          texte:
            "Les retours sont partis chez quatre fournisseurs. On ne recommande plus les références dormantes ; le reste tourne normalement.",
        },
      ],
      [
        {
          ...FRANCK,
          texte:
            "La promotion marche : les artisans achètent. Surtout ce qu'ils auraient acheté de toute façon.",
        },
      ],
      [
        {
          ...FRANCK,
          texte:
            "Trois agences sont en rupture sur les chevilles et les vis de fixation. Les artisans traversent la rue pour aller chez le concurrent.",
        },
      ],
      [
        {
          ...JULIEN,
          texte: "Le stock reste en l'état. Les agences attendent le printemps.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Norvia propose un escompte",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...NORVIA,
        heure: "09:15",
        alerte: true,
        texte:
          "Béatrice, nous proposons à nos meilleurs clients 2 % d'escompte pour un paiement à dix jours au lieu de quarante-huit. Sur vos volumes, cela fait près de 2 k€ par semaine.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Découvert : ${ctx.decouvert}, pour une autorisation de ${ctx.autorisation}. Découvert prévu au plus haut : ${ctx.previsionPic}, en semaine ${ctx.semainePic}.`,
      },
    ],
    sources: [
      {
        id: "calcul",
        titre: "Calculer ce que vaut l'escompte, et ce qu'il coûte en trésorerie",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `2 % pour payer 38 jours plus tôt, c'est l'équivalent de 19 % l'an : bien plus que le découvert (6,5 %), à peine plus que le dépassement (15,5 %), commissions et virements rejetés en sus. Payer Norvia à dix jours avance près de 420 k€ entre les semaines 10 et 13 : avec l'escompte, le découvert prévu monte à ${ctx.picAvecEscompte} au plus haut, pour une autorisation de ${ctx.autorisation}.`,
      },
      {
        id: "conditions",
        titre: "Relire les conditions commerciales de Norvia",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une remise de fidélité de 20 k€ en fin de trimestre, perdue au premier retard de paiement. L'escompte s'y ajoute ; il se négocie aussi à 1 % pour un paiement à trente jours.",
      },
    ],
    question: "Que répondez-vous à Norvia ?",
    options: [
      {
        t: "Accepter : payer Norvia à dix jours contre 2 % d'escompte",
        d: "Près de 2 k€ d'escompte par semaine ; 420 k€ de factures à régler plus tôt d'ici la semaine 13.",
      },
      {
        t: "Négocier un compromis : 1 % pour un paiement à trente jours",
        d: "Moitié moins d'escompte, moitié moins de trésorerie avancée.",
      },
      {
        t: "Refuser, et rester à quarante-huit jours",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...NORVIA,
          texte: "Parfait. Vos prochaines factures partiront avec l'escompte déduit.",
        },
      ],
      [
        {
          ...NORVIA,
          texte: "Va pour 1 % à trente jours. C'est moins avantageux pour vous, mais c'est noté.",
        },
      ],
      [
        {
          ...NORVIA,
          texte: "Dommage. L'offre reste ouverte si vous changez d'avis.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le pic de la semaine 12",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...THIERRY,
        heure: "08:45",
        alerte: true,
        texte:
          "Rappel : la semaine prochaine, on paie l'acompte d'impôt sur les sociétés et les loyers trimestriels des six agences. 560 k€ en tout.",
      },
      {
        ...PATRICK,
        heure: "09:30",
        texte: `On en est où ? Le découvert est à ${ctx.decouvert}. Je ne veux pas d'un virement d'impôt rejeté.`,
      },
    ],
    sources: [
      {
        id: "pic",
        titre: "Mettre à jour la prévision des semaines 12 et 13",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec les échéances de la semaine 12, le découvert monterait à ${ctx.previsionPic} en semaine ${ctx.semainePic}, pour une autorisation de ${ctx.autorisation}. ${
            ctx.banquePrevenue
              ? "Olivier a gardé votre prévision de la semaine 3 : il attendait cette échéance."
              : "La banque n'a jamais vu de prévision de votre part."
          }`,
      },
      {
        id: "penalites",
        titre: "Relire les conditions des trois premiers fournisseurs",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Au moindre retard : des pénalités de 1 200 € par semaine, et la remise de fin de trimestre de Norvia (20 k€) perdue. L'assureur-crédit de Norvia suit les retards de ses clients.",
      },
    ],
    question: "Comment passez-vous le pic ?",
    options: [
      {
        t: "Décaler de deux semaines tous les paiements fournisseurs",
        d: "Libère près de 400 k€ au moment du pic, sans frais.",
      },
      {
        t: "Demander à la banque une facilité de caisse, prévision à l'appui",
        d: "300 k€ pour les semaines 12 et 13 ; 800 € de commission. Le comité décidera.",
      },
      {
        t: "Céder au factor les grosses factures de mars",
        d: "500 k€ de factures avancées en semaine 12 ; 7 500 € de frais.",
      },
      {
        t: "Passer le pic sur le découvert",
        d: "Le dépassement ne durera que deux semaines. Rien d'autre que les intérêts.",
      },
    ],
    reactions: [
      [
        {
          de: "Mehdi Saïdi",
          role: "Comptable fournisseurs",
          texte: "Les virements fournisseurs sont décalés. Norvia a déjà appelé deux fois.",
        },
      ],
      [
        {
          ...BANQUE,
          texte: "Je présente votre demande au comité lundi, avec votre prévision.",
        },
      ],
      [
        {
          ...THIERRY,
          texte:
            "Le factor reprend les factures des trois plus gros chantiers : 500 k€ arrivent lundi, moins ses frais.",
        },
      ],
      [
        {
          ...THIERRY,
          texte: "Entendu. On paiera l'impôt et les loyers sur le découvert.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chercher le cash dans le BFR", chemin: [1, 0, 0, 0, 0, 1] },
  { nom: "Tirer sur les fournisseurs et le factor", chemin: [0, 2, 2, 2, 2, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 2, 3] },
] as const;

/**
 * Les réflexes du métier sous la pression du découvert : prendre le cash là
 * où il sort vite, chez les fournisseurs, chez le factor, en coupant les
 * achats ou en braquant un client. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [1, 2],
  [2, 2],
  [3, 2],
  [5, 0],
] as const;

export const REPONSES = {
  accord:
    "Le comité a accepté, sans enthousiasme : votre autorisation passe à 1 300 k€. La prochaine fois, venez avec une prévision.",
  refus:
    "Le comité a refusé : sans prévision ni plan, il ne relève pas une autorisation qui est déjà presque pleine. Votre ligne reste à 1 200 k€.",
  reduction:
    "Faute de rendez-vous, le comité a examiné votre dossier en l'état. Il ramène votre autorisation à 1 000 k€ à compter de cette semaine.",
  maintien:
    "Le comité a examiné votre dossier en l'état et maintient votre autorisation à 1 200 k€. Il attend votre visite.",
  faciliteOui:
    "Le comité accorde une facilité de caisse de 300 k€ pour les semaines 12 et 13. Votre prévision a beaucoup aidé.",
  faciliteNon:
    "Le comité refuse la facilité de caisse : il n'a pas assez de visibilité sur votre trésorerie. Votre autorisation reste inchangée.",
  coupure:
    "Béatrice, notre assureur-crédit a retiré sa couverture sur votre compte à cause de vos retards. Nous devons vous demander de régler l'arriéré, de passer à trente jours, et nous retenons vos livraisons cette semaine.",
  injonction:
    "L'injonction de payer a abouti : Cimier a réglé tout ce qu'il devait. Il ne commande plus chez nous.",
} as const;
