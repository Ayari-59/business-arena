/**
 * L'ASSOCIÉ QUI VEUT VENDRE SES PARTS — le contenu de l'épisode.
 *
 * Gustave Herbelin est directeur administratif et financier d'Atlas Conseil
 * (siège à Nantes, 240 collaborateurs, 34 M€ de chiffre d'affaires). Wilfrid
 * Vasselot, associé fondateur, détient 18 % du capital et porte trois grands
 * comptes industriels ; il veut céder ses parts d'ici l'été, comptant, à huit
 * fois l'EBE. Le pacte d'associés fixe une méthode de prix et ne dit rien du
 * reste. Six décisions, de janvier à mars, jusqu'au protocole d'accord,
 * chacune précédée de ce qu'un directeur financier reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : l'EBE retraité, la dette nette, le prix du pacte, la
 * valeur des comptes, ce que chaque offre coûte selon que les comptes restent
 * ou partent, l'effet des clauses et de l'accompagnement, la trésorerie de
 * l'été, le complément de prix de Lavaudière.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const WILFRID = {
  de: "Wilfrid Vasselot",
  role: "Associé fondateur, Performance opérationnelle",
} as const;
const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const OSWALD = {
  de: "Oswald Bertrandias",
  role: "Associé, Data et systèmes d'information",
} as const;
const MAHALIA = {
  de: "Mahalia Mardirossian",
  role: "Associée, Performance opérationnelle",
} as const;
const YSOLINE = { de: "Ysoline Labéguerie", role: "Manager, compte Herlinval" } as const;
const IRIS = { de: "Iris Guéhenneuc", role: "Avocate en droit des sociétés" } as const;
const THEOBALD = {
  de: "Théobald Guéguen",
  role: "Chargé d'affaires entreprises, Banque de l'Erdre",
} as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const YOLAINE = {
  de: "Yolaine Dérouet",
  role: "Directrice des achats, Lavaudière Agroalimentaire",
} as const;

export const DIAGNOSTICS = [
  {
    id: "montage",
    t: "Une grande part de la valeur de ses parts tient à ses trois comptes, qui peuvent partir avec lui : il faut un prix calculé sur l'EBE retraité, et un montage qui partage ce risque avec lui (paiement différé, complément de prix lié aux comptes, clauses, passation)",
  },
  {
    id: "prix",
    t: "Son prix repose sur un multiple et un EBE trop flatteurs : il faut ramener la négociation à l'EBE retraité et au multiple du pacte",
  },
  {
    id: "conflit",
    t: "Le vrai risque est un conflit entre associés fondateurs : il faut un accord rapide, quitte à payer un peu plus",
  },
  {
    id: "financement",
    t: "La difficulté est de trouver près de 3 M€ sans assécher la trésorerie : il faut d'abord monter le financement",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Wilfrid veut vendre",
    jusqua: 2,
    messages: () => [
      {
        ...WILFRID,
        heure: "08:05",
        alerte: true,
        texte:
          "Gustave, je l'annonce aux associés jeudi, mais je préfère que tu le saches d'abord : je cède mes 18 % d'ici l'été. Je veux en finir proprement : 2 988 k€, comptant, à la signature. Huit fois l'EBE, sans décote : c'est ce que Halden Partners a payé à Bordeaux l'an dernier. Je ne vais pas brader trente ans de travail.",
      },
      {
        ...VICTOIRE,
        heure: "09:30",
        texte:
          "Wilfrid m'a appelée. Je ne veux pas d'une guerre entre fondateurs : prépare-moi une réponse pour jeudi. Herlinval, Lavaudière et le Brivet, c'est lui qui les a amenés. Le trimestre couvre janvier à mars ; il faut un protocole signé fin mars.",
      },
      {
        ...OSWALD,
        heure: "11:10",
        texte:
          "Payons et passons à autre chose. Un associé fâché qui reste six mois dans les couloirs coûte plus cher que quelques centaines de milliers d'euros.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptes",
        titre: "Reprendre les comptes 2026 avec l'expert-comptable",
        cout: 1,
        nature: "decisive",
        resultat:
          "EBE publié : 3 000 k€, pour 34 M€ de chiffre d'affaires. Les six associés se versent chacun 140 k€ de rémunération chargée et se servent le reste en dividendes ; un associé payé au prix du marché coûterait 240 k€, charges comprises. L'exercice compte une mission de plan de sauvegarde exceptionnelle, 350 k€ de marge qui ne se reproduiront pas, et le déménagement du bureau de Paris, 150 k€ de charges non récurrentes. Emprunts : 3 600 k€ ; trésorerie : 2 600 k€.",
      },
      {
        id: "pacte",
        titre: "Relire le pacte d'associés avec Maître Guéhenneuc",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Article 9 : le prix d'une action cédée est sa quote-part des fonds propres, égaux à une valeur d'entreprise de six fois l'EBE retraité du dernier exercice (rémunération normative des associés, éléments non récurrents) diminuée de l'endettement financier net ; une décote de minorité de 15 % s'applique à toute cession de moins du tiers du capital. À défaut d'accord, un expert désigné selon l'article 1843-4 du Code civil fixe le prix en appliquant cette méthode. Article 12 : non-concurrence de douze mois « dans la zone d'activité du cabinet ». Rien sur les modalités de paiement, un complément de prix, la non-sollicitation des clients et des collaborateurs, ni la transmission des clients.",
      },
      {
        id: "tempora",
        titre: "Extraire de Tempora le poids de ses trois comptes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Herlinval Distribution : 1 250 k€ d'honoraires en 2026 ; Lavaudière Agroalimentaire : 900 k€ ; les Fonderies du Brivet : 650 k€. Ensemble 2,8 M€, 8 % du chiffre d'affaires. Une fois leurs consultants redéployés, ils apportent 190, 140 et 100 k€ à l'EBE. Wilfrid signe seul toutes leurs propositions commerciales. Leurs budgets 2027 tomberont en février : la fédération du conseil voit trois chances sur dix d'une reprise d'environ 10 %, à peu près une sur deux de stabilité, une sur quatre d'un repli d'environ 12 %.",
      },
      {
        id: "bordeaux",
        titre: "Écouter Wilfrid raconter le rachat de Bordeaux",
        cout: 1,
        nature: "bruit",
        resultat:
          "Wilfrid : « Huit fois l'EBE, Gustave. Halden a payé huit fois pour un cabinet de quatre-vingts personnes qui n'a pas notre réputation. Le marché est là, et nos clients nous suivent depuis quinze ans. » Il n'a lu que le communiqué de presse.",
      },
      {
        id: "malivel",
        titre: "Appeler Amalric Malivel, l'expert-comptable du cabinet",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Amalric Malivel : « Ne discute pas que le multiple. Fais d'abord le calcul du pacte, sur l'EBE retraité : c'est ta base, et Wilfrid l'a signée. Puis demande-toi ce qui part avec lui. Dans un cabinet de conseil, la valeur prend l'ascenseur tous les soirs : ce qui part avec le cédant se protège par la façon de payer, pas par le chiffre du prix. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous à la présidente de répondre à Wilfrid jeudi ?",
    options: [
      {
        t: "Accepter son prix et le paiement comptant : on évite un conflit entre associés fondateurs",
        d: "2 988 k€ à la signature. Wilfrid est rassuré ; le reste se réglera ensuite.",
      },
      {
        t: "Lui répondre que le pacte s'applique : 1 867 k€ comptant, et rien d'autre à discuter",
        d: "Le prix du pacte, décote comprise. Pas de négociation.",
      },
      {
        t: "Partir de la méthode du pacte, et poser d'emblée que le prix dépendra du maintien de ses trois comptes",
        d: "Un rendez-vous jeudi avec la présidente ; une offre chiffrée dans trois semaines.",
      },
      {
        t: "Commander une évaluation à un expert indépendant, et ne rien répondre avant son rapport",
        d: "35 k€ d'honoraires, six semaines de délai.",
      },
    ],
    reactions: [
      [
        {
          ...WILFRID,
          texte:
            "Merci, Gustave. Je savais qu'on se comprendrait. Je préviens mes clients que je passe la main cet été.",
        },
      ],
      [
        {
          ...WILFRID,
          texte:
            "Le pacte, rien que le pacte ? Trente ans de travail, décote comprise. Très bien. Je vais regarder ce que valent mes clients ailleurs.",
        },
      ],
      [
        {
          ...WILFRID,
          texte:
            "Le pacte comme point de départ, et un prix qui monte si mes clients restent ? Je ne dis pas non. Je veux voir les chiffres.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte:
            "L'expert est mandaté. Wilfrid trouve le silence long : il me demande tous les deux jours où nous en sommes.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce qui retient ses trois comptes",
    jusqua: 4,
    messages: () => [
      {
        ...YSOLINE,
        heure: "10:15",
        alerte: true,
        texte:
          "Le directeur général de Herlinval m'a demandé en comité de pilotage si Wilfrid partait, et où. Je n'ai pas su quoi répondre.",
      },
      {
        ...MAHALIA,
        heure: "14:00",
        texte:
          "Je peux reprendre ses comptes, mais je ne sais pas qui y décide vraiment : Wilfrid a toujours tout gardé pour lui.",
      },
      {
        ...OSWALD,
        heure: "17:20",
        texte:
          "Pas besoin d'enquête : on connaît nos clients. Et faire le tour des comptes, c'est leur annoncer qu'il y a un problème.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dependance",
        titre: "Chiffrer ce qu'une revue des comptes apprendrait",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Tempora montre que Wilfrid signe seul les trois comptes mais n'y passe que 6 % de ses jours : selon le compte, la relation tient à sa personne ou à l'équipe, et nos fichiers ne disent pas lequel. Dans les cabinets qui ont vu partir un associé sans rien organiser, un compte qui tenait à sa personne l'a suivi une fois sur deux, un compte tenu par l'équipe une fois sur quinze. Une revue discrète (entretiens avec les managers, rendez-vous de la présidente avec chaque directeur général, sans parler de cession) coûte 12 k€ de temps d'associés et dit lequel est lequel.",
      },
      {
        id: "halden",
        titre: "Se renseigner sur ce que fait Halden Partners dans l'Ouest",
        cout: 0.5,
        nature: "utile",
        resultat:
          "À Rennes l'an dernier, Halden a recruté deux associés d'un cabinet régional en leur offrant une part variable sur les clients apportés : quatre de leurs six grands comptes ont suivi. Ce qui l'a fait réussir : deux associés qui s'estimaient mal traités par leur pacte. Siegfried Aurenche, l'associé qui ouvre l'Ouest pour Halden, connaît Wilfrid depuis l'école.",
      },
    ],
    question: "Avant de lui faire une offre, que faites-vous de ses trois comptes ?",
    options: [
      {
        t: "Faire une revue discrète des trois comptes : qui décide, ce qui les retient, qui d'autre ils connaissent chez nous",
        d: "12 k€ de temps d'associés ; les conclusions dans deux semaines.",
      },
      {
        t: "Demander à Wilfrid lui-même d'évaluer le risque de chacun de ses comptes",
        d: "Rien à dépenser, et la réponse tout de suite.",
      },
      {
        t: "Ne pas sonder : on connaît nos clients, et une enquête les inquiéterait",
        d: "Rien à dépenser, rien à expliquer.",
      },
    ],
    reactions: [
      [
        {
          ...MAHALIA,
          texte: "Je commence lundi par Herlinval, avec la présidente. Discrètement.",
        },
      ],
      [
        {
          ...WILFRID,
          texte:
            "Mes trois comptes me suivraient tous les trois, Gustave. Tu peux l'écrire. C'est bien pour ça qu'ils valent leur prix.",
        },
      ],
      [{ ...OSWALD, texte: "Sage décision. On a assez de travail comme ça." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "L'offre",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...WILFRID,
        heure: "09:00",
        alerte: true,
        texte:
          ctx.reponse === 0
            ? "Le protocole avance ? J'ai dit à mes clients que je passais la main cet été, à 2 988 k€ comptant, comme convenu."
            : ctx.reponse === 1
              ? "J'attends votre offre. Siegfried Aurenche, de Halden, m'a invité à déjeuner ; je n'ai pas encore répondu."
              : ctx.reponse === 2
                ? "J'attends vos chiffres. Un prix qui dépend de mes clients, pourquoi pas, si le compte y est."
                : "Toujours rien ? Je n'attendrai pas votre expert jusqu'à Pâques.",
      },
      ...(ctx.revue
        ? [
            {
              ...MAHALIA,
              heure: "11:30",
              texte: `La revue est faite. ${String(ctx.attachements)}`,
            },
          ]
        : []),
      {
        ...VICTOIRE,
        heure: "16:00",
        texte:
          "Il faut lui faire une offre écrite la semaine prochaine. Gustave, que mettons-nous dedans ?",
      },
    ],
    sources: [
      {
        id: "offres",
        titre: "Chiffrer ce que chaque offre coûte, selon que ses comptes restent ou partent",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ses trois comptes valent, pour le cabinet, six fois ce qu'ils apportent à l'EBE : 1 140 k€ pour Herlinval, 840 k€ pour Lavaudière, 600 k€ pour le Brivet, 2 580 k€ ensemble. Si les trois restent, ou si les trois partent, le cabinet paie : son prix comptant, 2 988 ou 2 988 k€ ; le pacte comptant, 1 867 ou 1 867 k€ ; un montage équilibré (1 300 k€ comptant, 300 k€ étalés sur deux ans avec intérêts, et un complément de prix de 250, 200 et 150 k€ pour chaque compte dont les honoraires atteignent encore 80 % de ceux de 2026 dans deux ans), 2 200 ou 1 600 k€ ; un montage maximal (1 000 k€ comptant, et un complément de 550, 450 et 300 k€ aux mêmes conditions), 2 300 ou 1 000 k€.",
      },
      {
        id: "experience",
        titre: "Demander à Maître Guéhenneuc ce qu'elle a vu dans d'autres cessions",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Maître Guéhenneuc : « Un cédant payé au maintien de ses comptes les transmet : chez mes clients, il en a perdu à peu près deux fois moins. Au-delà de la moitié du prix en complément, il le vit comme de la défiance, et regarde ailleurs. Et un prix accordé puis repris, c'est le pire des cas : je l'ai vu partir chez un concurrent pour moins que ça. »",
      },
      {
        id: "actualisation",
        titre: "Relire la note de l'expert-comptable sur le multiple",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Actualisation des flux disponibles : 1 452 k€ par an, 2 % de croissance, 13 % de coût du capital, soit une valeur d'entreprise de 13 200 k€, six fois l'EBE retraité. Le huit fois payé par Halden à Bordeaux comprenait trois ans de complément de prix et des associés restés aux commandes.",
      },
    ],
    question: "Quelle offre écrite faites-vous à Wilfrid ?",
    options: [
      {
        t: "Son prix, 2 988 k€ comptant à la signature : la paix entre associés n'a pas de prix",
        d: "Tout est payé à la signature.",
      },
      {
        t: "Le prix du pacte, 1 867 k€ comptant à la signature",
        d: "Ni plus, ni moins que le pacte.",
      },
      {
        t: "Un montage équilibré : 1 300 k€ comptant, 300 k€ étalés sur deux ans, jusqu'à 600 k€ de complément de prix selon ses comptes",
        d: "Jusqu'à 2 200 k€ si ses trois comptes restent, 1 600 k€ s'ils partent.",
      },
      {
        t: "Un montage maximal : 1 000 k€ comptant, jusqu'à 1 300 k€ de complément de prix selon ses comptes",
        d: "Jusqu'à 2 300 k€ si ses trois comptes restent, 1 000 k€ s'ils partent.",
      },
    ],
    reactions: [
      [
        {
          ...VICTOIRE,
          texte:
            "L'offre part ce soir : son prix, comptant. Les associés feront la grimace, mais on aura la paix.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte: "L'offre part ce soir : le pacte, comptant. Il l'a signé, ce pacte.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte:
            "L'offre part ce soir. Elle lui rend son prix s'il nous rend ses clients : c'est un bon message.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte:
            "L'offre part ce soir. Plus de la moitié de son prix dépendra de ses clients : il va tiquer.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Protéger les comptes",
    jusqua: 8,
    messages: () => [
      {
        ...IRIS,
        heure: "09:20",
        alerte: true,
        texte:
          "Le protocole doit dire ce que Wilfrid pourra faire après la cession. Le pacte ne prévoit qu'une non-concurrence de douze mois, sans non-sollicitation : en l'état, il peut démarcher ses clients dès l'an prochain.",
      },
      {
        ...WILFRID,
        heure: "12:45",
        texte:
          "Je ne signerai pas une clause qui m'interdit de travailler. J'ai soixante et un ans, pas quatre-vingts.",
      },
      {
        ...MAHALIA,
        heure: "15:10",
        texte:
          "Si Wilfrid me présente lui-même à ses clients, je les garde. S'il disparaît en juillet, je ne promets rien.",
      },
    ],
    sources: [
      {
        id: "clauses",
        titre: "Faire chiffrer les clauses et l'accompagnement par Maître Guéhenneuc",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une non-concurrence liée à une cession de titres est valable si elle protège la clientèle cédée et reste proportionnée : deux ans, le conseil en performance opérationnelle, le Grand Ouest ; avec une non-sollicitation des clients et des collaborateurs de trois ans. Contrepartie raisonnable : 60 k€. Cinq ans sur toute la France seraient annulés. Chez ses clients, ces clauses ont réduit d'environ un tiers les départs de comptes. Six mois d'accompagnement (présenter le successeur, copiloter les comités) coûtent 40 k€ par compte : ils divisent à peu près par trois les départs d'un compte quand le cédant est intéressé à le garder, et ne les réduisent que d'un cinquième s'il est déjà payé.",
      },
      {
        id: "revue",
        titre: "Reprendre ce que l'on sait de chaque compte",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.revue
            ? `${String(ctx.attachements)} Un compte tenu par l'équipe part rarement ; c'est sur les autres que Wilfrid compte.`
            : ctx.question
              ? "Wilfrid affirme que ses trois comptes le suivraient. Aucune revue ne permet de distinguer ceux qui tiennent à sa personne de ceux qui tiennent à l'équipe."
              : "Aucune revue n'a été faite : on ne sait pas lequel des trois comptes tient à la personne de Wilfrid. Faute de mieux, on regarderait d'abord Herlinval, le plus gros.",
      },
    ],
    question: "Que mettez-vous dans le protocole pour protéger ses comptes ?",
    options: [
      {
        t: "S'en tenir à la clause du pacte, pour ne pas braquer Wilfrid avant la signature",
        d: "Rien à payer ; douze mois de non-concurrence, pas de non-sollicitation.",
      },
      {
        t: "Une non-concurrence de deux ans et une non-sollicitation de trois ans, limitées et payées",
        d: "60 k€ de contrepartie.",
      },
      {
        t: "Les mêmes clauses, et six mois d'accompagnement de Wilfrid sur ses trois comptes",
        d: "60 k€ de contrepartie, 120 k€ d'accompagnement.",
      },
      {
        t: "Les mêmes clauses, et un accompagnement ciblé sur les comptes qui tiennent à sa personne",
        d: "60 k€ de contrepartie, 40 k€ par compte accompagné : ceux que la revue désigne ; sans revue, ceux que Wilfrid cite, ou Herlinval, le plus gros.",
      },
    ],
    reactions: [
      [
        {
          ...WILFRID,
          texte: "Merci de ne pas en rajouter. On reste entre gens de confiance.",
        },
      ],
      [
        {
          ...WILFRID,
          texte: "Deux ans, le Grand Ouest, et payé : c'est correct. Je signerai.",
        },
      ],
      [
        {
          ...MAHALIA,
          texte: "Six mois à deux sur les trois comptes : je prends tout ce qu'il me donnera.",
        },
      ],
      [
        {
          ...MAHALIA,
          texte:
            "On concentre Wilfrid là où les clients tiennent à lui. Je m'occupe du reste avec l'équipe.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Financer le rachat",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...THEOBALD,
        heure: "10:00",
        alerte: true,
        texte: `Monsieur Herbelin, nous pouvons financer les ${String(ctx.comptant)} payés à la signature sur cinq ans, à 4,2 %. Les frais de dossier dépendront des garanties.`,
      },
      {
        ...OSWALD,
        heure: "11:40",
        texte: `Emprunter pour racheter un associé qui part ? ${String(ctx.interets)} d'intérêts sur cinq ans, jetés par la fenêtre. On a 2,6 M€ en banque : payons.`,
      },
      {
        ...PRUNE,
        heure: "16:30",
        texte: `Point bas de trésorerie prévu fin août, avant tout rachat : ${String(ctx.pointBasSans)}. Les paiements publics glissent toujours en début d'année.`,
      },
    ],
    sources: [
      {
        id: "tresorerie",
        titre: "Faire projeter la trésorerie de l'été, rachat compris",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Point bas prévu fin août, sans le rachat : ${String(ctx.pointBasSans)}, à 200 k€ près selon les paiements publics. Seuil de sécurité : 600 k€, un tiers d'un mois de salaires. Payer ${String(ctx.comptant)} sur la trésorerie le ferait tomber à ${String(ctx.apres)} : il faudrait céder des créances en urgence, 25 k€ de frais plus 6 % de ce qui manque sous le seuil. Au taux du marché, les intérêts de l'emprunt paient le temps : ils ne retirent rien à la valeur du cabinet. Seuls ses frais de dossier, 0,5 à 0,8 % du montant, sont une perte.`,
      },
      {
        id: "associes",
        titre: "Demander aux cinq associés s'ils peuvent racheter à titre personnel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Trois peuvent payer leur quote-part sur leurs économies. Deux devraient emprunter à titre personnel, et Oswald Bertrandias hésite : à peu près une chance sur deux qu'il ne suive pas. Alors la signature glisserait à l'automne, le temps d'un prêt relais (15 k€), et Wilfrid attendrait son argent.",
      },
    ],
    question: "Comment financez-vous le comptant ?",
    options: [
      {
        t: "Payer le comptant sur la trésorerie du cabinet : pas un euro d'intérêts",
        d: "Le comptant sort de la trésorerie à la signature.",
      },
      {
        t: "Emprunter le comptant à la Banque de l'Erdre, sur cinq ans",
        d: "4,2 % ; des frais de dossier de 0,5 à 0,8 %, selon les garanties demandées.",
      },
      {
        t: "Faire racheter les parts par les cinq autres associés, à titre personnel",
        d: "La trésorerie du cabinet n'est pas touchée ; chacun finance sa quote-part.",
      },
    ],
    reactions: [
      [
        {
          ...PRUNE,
          texte: "Je réserve le comptant pour la signature. On surveillera l'été de près.",
        },
      ],
      null,
      null,
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le protocole à signer",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...YOLAINE,
        heure: "08:40",
        alerte: true,
        texte:
          "Notre plan d'économies gèle 30 % du budget de conseil en 2027 et 2028, chez tous nos cabinets. Atlas reste référencé ; les missions seront simplement plus courtes.",
      },
      {
        ...IRIS,
        heure: "11:00",
        texte: ctx.complement
          ? "Le protocole est prêt. Tel qu'il est rédigé, le complément de prix est dû pour chaque compte dont les honoraires atteignent encore 80 % de ceux de 2026 dans deux ans."
          : "Le protocole est prêt : le prix est payé à la signature, il n'y a pas de complément.",
      },
      {
        ...OSWALD,
        heure: "14:30",
        texte: ctx.complement
          ? "Avec le gel de Lavaudière, on ne paiera pas sa part du complément. Signons vite, tel quel."
          : "Signons lundi, qu'on en finisse.",
      },
    ],
    sources: [
      {
        id: "lavaudiere",
        titre: "Recalculer le complément de prix avec le gel de Lavaudière",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.complement
            ? `Avec 30 % de budget gelé, les honoraires de Lavaudière tomberont à 70 % de ceux de 2026, sous le seuil de 80 % : Wilfrid perdrait les ${String(ctx.complementLavaudière)} de complément attachés à Lavaudière, quoi qu'il fasse, et n'aurait plus aucune raison de transmettre le compte. Un complément se rédige sur ce que le cédant maîtrise : le maintien du compte (client actif, Atlas référencé), pas ses honoraires. Réécrit ainsi, il coûte ${String(ctx.complementLavaudière)} de plus si Lavaudière reste, et garde Wilfrid intéressé à le garder.`
            : "Le protocole ne prévoit pas de complément de prix : le gel de Lavaudière ne change que la valeur du compte, 30 % de sa contribution pendant deux ans, soit 84 k€, pas le prix.",
      },
      {
        id: "wilfrid",
        titre: "Sonder Wilfrid sur le projet de protocole",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.complement
            ? "Il a fait le calcul : « Je ne signerai pas un complément qui dépend du plan d'économies de Lavaudière. » Maître Guéhenneuc pense qu'il refusera une fois sur deux de signer en l'état, plus souvent encore si l'on reprend une part du prix ; on irait alors devant l'expert du pacte, et les clauses négociées tomberaient."
            : "« Le prix est convenu, on signe. Si vous revenez dessus maintenant, je saisis l'expert du pacte. » Maître Guéhenneuc le croit capable de le faire.",
      },
    ],
    question: "Que faites-vous du protocole ?",
    options: [
      {
        t: "Signer le protocole tel qu'il est rédigé",
        d: "La signature est prévue lundi.",
      },
      {
        t: "Réécrire le complément de prix sur le maintien des comptes, et non sur leurs honoraires, avant de signer",
        d: "5 k€ d'avocate s'il y a un complément à réécrire ; la signature glisse d'une semaine.",
      },
      {
        t: "Remplacer le complément de prix par un paiement comptant du solde, pour signer sans discussion",
        d: "Le complément entier payé à la signature, s'il y en a un.",
      },
      {
        t: "Sortir Lavaudière du complément et baisser le prix garanti de 100 k€, pour tenir compte de son plan d'économies",
        d: "100 k€ de moins à la signature.",
      },
    ],
    reactions: [
      [{ ...IRIS, texte: "Je convoque les parties lundi." }],
      [
        {
          ...IRIS,
          texte:
            "Je réécris l'article 4 : le complément sera dû pour chaque compte encore client, Atlas référencé, dans deux ans.",
        },
      ],
      [
        {
          ...PRUNE,
          texte: "Le solde sera payé à la signature. Je l'ajoute au besoin de financement.",
        },
      ],
      [{ ...IRIS, texte: "Je transmets la nouvelle version à son conseil. Il va réagir." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Sécuriser par le montage", chemin: [2, 0, 2, 3, 1, 1] },
  { nom: "La paix à tout prix", chemin: [0, 2, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 2, 1, 0, 0, 0] },
] as const;

/**
 * Les réflexes devant un associé qui veut partir : lui accorder son prix
 * comptant pour éviter le conflit, ou lui opposer un refus sec ; ne pas
 * regarder ce qui retient ses clients ; payer tout d'avance ; ne pas
 * protéger les comptes pour ne pas le braquer ; vider la trésorerie pour ne
 * pas payer d'intérêts ; signer tel quel un complément devenu injuste.
 * [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  banqueSimple:
    "Accord du comité de crédit : 4,2 % sur cinq ans, frais de dossier de 0,5 %. Les fonds seront disponibles à la signature.",
  banqueGaranties:
    "Accord du comité de crédit à 4,2 % sur cinq ans, mais avec nantissement des actions rachetées : frais de dossier de 0,8 %.",
  associesSuivent:
    "Les cinq associés suivent : trois sur leurs économies, deux avec un prêt personnel accordé cette semaine.",
  associeDefaillant:
    "Je ne suivrai pas : ma banque refuse le prêt personnel. Il faudra un relais pour ma quote-part, et la signature glissera à l'automne.",
} as const;
