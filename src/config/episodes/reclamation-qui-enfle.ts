/**
 * LA RÉCLAMATION QUI ENFLE — le contenu de l'épisode.
 *
 * Laure Bertin dirige la qualité et le service après-vente d'Arvel
 * Distribution : trois techniciens à l'atelier de Vénissieux, une assistante,
 * et un relais SAV dans chacune des six agences. Le malaxeur de chantier
 * Vantrel MX-160 revient en panne de plus en plus souvent, Pélissier
 * Construction menace de partir, les agences remplacent au cas par cas et
 * Vantrel nie tout défaut. Six décisions, chacune précédée de ce qu'une
 * responsable qualité reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, marque, produit, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "lot",
    t: "Un lot de fabrication est défectueux, et chaque remplacement en remet un en circulation",
  },
  {
    id: "usage",
    t: "Les maçons et les chapistes font travailler l'appareil au-delà de ce qu'il supporte",
  },
  {
    id: "agences",
    t: "Les agences remplacent trop facilement : des clients abusent de la garantie",
  },
  { id: "conception", t: "Le MX-160 est mal conçu : c'est tout le modèle qui casse" },
] as const;

const SERVICE = { de: "Tableau de bord qualité", role: "Point hebdomadaire" } as const;
const PELISSIER = { de: "Serge Pélissier", role: "Gérant, Pélissier Construction" } as const;
const VANTREL = { de: "Hervé Lacombe", role: "Responsable grands comptes, Vantrel" } as const;
const ATELIER = { de: "Thibault Rousset", role: "Chef d'atelier SAV" } as const;
const RELAIS = { de: "Sonia Bakri", role: "Relais SAV, agence de Givors" } as const;
const ACHATS = { de: "Cédric Morand", role: "Acheteur outillage" } as const;
const DIRECTION = { de: "Antoine Vernay", role: "Directeur des opérations" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les malaxeurs reviennent",
    jusqua: 2,
    messages: () => [
      {
        ...SERVICE,
        role: "Alerte automatique",
        heure: "07:40",
        alerte: true,
        texte:
          "Malaxeur Vantrel MX-160 : 9 retours en panne la semaine dernière, contre 3 par semaine au printemps. 16 réclamations sans réponse. 68 % des clients concernés se disent satisfaits de leur traitement.",
      },
      {
        ...PELISSIER,
        heure: "08:15",
        alerte: true,
        texte:
          "Madame Bertin, troisième malaxeur en panne sur le chantier de Décines ce mois-ci. Mes chapistes perdent des demi-journées. Si ça continue, j'achète ailleurs.",
      },
      {
        de: "Patrice Gaillard",
        role: "Chef d'agence, Vénissieux",
        heure: "09:10",
        texte:
          "On remplace sur le comptoir pour ne pas perdre les clients, et on fait un petit geste. Mais on ne sait plus quoi leur dire.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "series",
        titre: "Relever les numéros de série des appareils revenus",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur les 31 MX-160 revenus en panne depuis six semaines, 28 portent un numéro du lot L-2607, reçu fin juillet. Ce lot fait encore 60 % du stock des agences : 120 appareils en rayon, à côté de 80 d'autres lots. Les agences s'en servent aussi pour remplacer les appareils cassés.",
      },
      {
        id: "atelier",
        titre: "Faire démonter deux appareils revenus à l'atelier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Thibault : « Même panne sur les deux : le pignon de sortie du réducteur est usé jusqu'au métal après quelques semaines. Sur un MX-160 d'un autre lot qui a 400 heures de chantier, le pignon est intact. Ce n'est pas le modèle, c'est la pièce de ce lot. »",
      },
      {
        id: "clients",
        titre: "Appeler les clients qui ont rapporté un appareil",
        cout: 1,
        nature: "utile",
        resultat:
          "Neuf sur dix sont maçons ou chapistes et font tourner le malaxeur plusieurs heures par jour. Ceux qui s'en servent pour un peu de mortier de temps en temps ne se plaignent pas, ou pas encore. Deux clients en sont à leur deuxième appareil de remplacement.",
      },
      {
        id: "agences",
        titre: "Comparer les retours des six agences",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Vénissieux a deux fois plus de retours que Villefranche, mais vend aussi deux fois plus de MX-160. Rapportées aux ventes, les six agences se valent.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Antoine Vernay",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Antoine : « Avant de remplacer ou de tout retirer, sache ce qui casse : quel lot, quels clients, quel usage. C'est aussi la seule chose que Vantrel écoutera. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous pour les retours ?",
    options: [
      {
        t: "Remplacer chaque appareil sur-le-champ, avec un avoir de 50 €",
        d: "Les agences échangent au comptoir, sans attendre. 50 € par client, en plus de l'appareil.",
      },
      {
        t: "Faire relever le numéro de série de chaque retour et bloquer le lot en cause",
        d: "Une fiche par retour dans les six agences, et le lot isolé en réserve. 1 500 € d'inventaire et d'étiquetage, des réponses un peu moins rapides.",
      },
      {
        t: "Retirer tous les MX-160 de la vente jusqu'à nouvel ordre",
        d: "Plus aucune vente ni remplacement, les clients en panne sont remboursés. La marge du produit perdue pendant le retrait.",
      },
      {
        t: "Attendre d'avoir plus de recul",
        d: "Les retours suivent la garantie normale, au rythme de l'atelier.",
      },
    ],
    reactions: [
      [
        {
          ...RELAIS,
          texte:
            "On échange au comptoir avec l'avoir, les clients repartent contents. Mais j'en revois déjà qui reviennent avec l'appareil qu'on leur a donné il y a quinze jours.",
        },
      ],
      [
        {
          ...ATELIER,
          texte:
            "Les fiches remontent des six agences. Le lot L-2607 est bloqué en réserve, étiqueté : on remplace avec des appareils des autres lots.",
        },
      ],
      [
        {
          de: "Patrice Gaillard",
          role: "Chef d'agence, Vénissieux",
          texte:
            "Les MX-160 sont sortis des rayons. Les maçons demandent ce qu'on leur propose à la place, et on n'a pas grand-chose.",
        },
      ],
      [
        {
          ...RELAIS,
          texte:
            "Les clients attendent leur appareil de remplacement. Deux sont allés en louer un chez le concurrent d'en face.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Pélissier Construction menace de partir",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...PELISSIER,
        heure: "11:30",
        alerte: true,
        texte:
          "J'ai dix MX-160 sur mes chantiers et je n'ai plus confiance. Dites-moi lundi ce que vous faites, ou je passe mes commandes d'outillage chez un autre négoce.",
      },
      {
        ...SERVICE,
        heure: "18:00",
        texte: `Retours en semaine 2 : ${ctx.retours}. Réclamations sans réponse : ${ctx.ouvertes}. Clients concernés satisfaits : ${ctx.satisfaction}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "parcPelissier",
        titre: "Vérifier les numéros de série des appareils de Pélissier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Ses dix MX-160 sont tous du lot L-2607. ${
            ctx.lotTrace
              ? "Le lot étant bloqué en réserve, un échange se ferait avec des appareils des autres lots, qui tiennent."
              : "Le même lot fait encore 60 % du stock des agences : un échange pris aléatoirement en rayon a plus d'une chance sur deux de lui rendre le même problème."
          }`,
      },
      {
        id: "compte",
        titre: "Regarder ce que pèse Pélissier Construction",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Pélissier achète environ 25 000 € d'outillage et de consommables par trimestre, soit 2 300 € de marge par semaine. Le gérant a déjà quitté un négoce en 2023, après un litige sur des échafaudages.",
      },
    ],
    question: "Que répondez-vous à Pélissier ?",
    options: [
      {
        t: "Échanger ses dix malaxeurs tout de suite",
        d: "Dix appareils neufs livrés sur ses chantiers la semaine prochaine. 2 700 €.",
      },
      {
        t: "Lui accorder un avoir de 10 % sur ses achats du trimestre",
        d: "6 000 €. Ses malaxeurs restent ceux qu'il a.",
      },
      {
        t: "Remplacer ses malaxeurs par un modèle haut de gamme d'une autre marque",
        d: "Dix appareils à 560 €, sans retour possible. 5 600 €.",
      },
      {
        t: "Lui expliquer que le fournisseur examine le problème",
        d: "Un appel courtois. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...PELISSIER,
          texte: "Vous me les échangez, d'accord. Je jugerai sur pièces dans un mois.",
        },
      ],
      [
        {
          ...PELISSIER,
          texte:
            "Un avoir, c'est aimable. Mais mes chapes ne se coulent pas avec des avoirs, et mes malaxeurs sont toujours les mêmes.",
        },
      ],
      [
        {
          ...PELISSIER,
          texte:
            "Là, vous me prenez au sérieux. Les nouveaux sont costauds, mes gars sont contents.",
        },
      ],
      [
        {
          ...PELISSIER,
          texte: "« Le fournisseur examine. » On me l'a déjà faite, celle-là.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Vantrel nie le défaut",
    jusqua: 6,
    messages: () => [
      {
        ...VANTREL,
        heure: "10:20",
        alerte: true,
        texte:
          "Madame Bertin, nos contrôles en usine ne montrent aucun défaut sur le MX-160. Les pannes que vous signalez relèvent d'un usage inadapté. À titre commercial, nous pouvons vous proposer de prendre en charge 40 % de vos frais, pour solde de tout compte.",
      },
      {
        ...DIRECTION,
        heure: "11:05",
        texte:
          "Laure, la non-qualité du MX-160 va manger ton budget. Qu'est-ce que tu réponds à Vantrel ?",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Relire les conditions de garantie de Vantrel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Vantrel prend en charge les défauts de série « sur dossier documenté, numéros de série à l'appui » : 80 % des coûts directs. Sans dossier, la garantie ne couvre que l'appareil, pièce par pièce. ${
            ctx.lotTrace
              ? "Votre fichier compte chaque retour depuis la semaine 1, avec son numéro : presque tous du L-2607."
              : "Les agences ont remplacé sans noter les numéros de série : vous n'avez que des bons de retour."
          }`,
      },
      {
        id: "litiges",
        titre: "Demander aux achats comment se sont terminés les derniers litiges",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cédric : « Deux litiges avec Vantrel en trois ans. Le premier, documenté par lot avec une expertise, a été remboursé à 80 %. Le second, sur des courriers de clients, n'a rien donné. Suspendre les commandes ? Ils l'ont mal pris la dernière fois, et nos agences ont manqué de perforateurs. »",
      },
    ],
    question: "Que répondez-vous à Vantrel ?",
    options: [
      {
        t: "Exiger la prise en charge, dossier par numéro de série et expertise à l'appui",
        d: "Le relevé des retours et l'expertise d'un laboratoire indépendant sur dix appareils, 1 800 €. Réponse de Vantrel sous quinze jours.",
      },
      {
        t: "Suspendre toutes les commandes Vantrel jusqu'à ce qu'il reconnaisse le défaut",
        d: "Disqueuses et perforateurs en rupture dans les agences tant que ça dure : environ 700 € de ventes perdues par semaine.",
      },
      {
        t: "Accepter son accord amiable à 40 %",
        d: "Acquis tout de suite, sans discussion ni reconnaissance du défaut.",
      },
      {
        t: "En rester à la garantie normale",
        d: "Les appareils repartent un par un chez Vantrel, comme d'habitude.",
      },
    ],
    reactions: [
      [
        {
          ...VANTREL,
          texte:
            "Nous transmettons votre dossier à notre service technique. Vous aurez notre réponse sous quinze jours.",
        },
      ],
      [
        {
          ...ACHATS,
          texte:
            "Les commandes Vantrel sont suspendues. Leur commercial m'a appelé deux fois aujourd'hui.",
        },
      ],
      [
        {
          ...VANTREL,
          texte:
            "Merci pour votre pragmatisme. Nous vous créditerons 40 % des frais engagés sur le MX-160, au fil du trimestre.",
        },
      ],
      [
        {
          ...ATELIER,
          texte:
            "On continue de renvoyer les appareils chez Vantrel un par un. Ils nous rendent des pignons.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Faut-il rappeler les appareils ?",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...ATELIER,
        heure: "09:00",
        alerte: true,
        texte: `Laure, il reste environ ${ctx.parc} MX-160 du lot L-2607 chez nos clients. Ils casseront tous un jour ou l'autre : la question, c'est sur le chantier ou chez nous.`,
      },
      {
        ...SERVICE,
        heure: "18:00",
        texte: `Retours en semaine 6 : ${ctx.retours}. Coût net de la non-qualité depuis le début du trimestre : ${ctx.net}.`,
      },
    ],
    sources: [
      {
        id: "ventes",
        titre: "Croiser le fichier des ventes du lot avec le métier des clients",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Chez les maçons et les chapistes, un MX-160 du lot casse avec une chance sur dix chaque semaine. Chez les clients occasionnels, une sur cinquante : la plupart tiendront des mois. Les 150 MX-160 des autres lots vendus depuis l'été n'ont pas de problème.",
      },
      {
        id: "couts",
        titre: "Demander à l'atelier ce que coûte un échange",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un échange planifié : 270 €, appareil et logistique compris. Une panne sur chantier : 300 € pour l'appareil et la course en urgence, plus 260 € de prêt et de dédommagement à l'artisan arrêté. Une inspection d'un appareil sain : 60 €.",
      },
    ],
    question: "Que décidez-vous pour les appareils déjà vendus ?",
    options: [
      {
        t: "Rappeler les appareils du lot vendus aux maçons et aux chapistes",
        d: "Un appel à chacun, un échange planifié la semaine prochaine. 270 € par appareil.",
      },
      {
        t: "Rappeler tout le lot L-2607",
        d: "Tous les acheteurs du lot, quel que soit leur usage. 270 € par appareil.",
      },
      {
        t: "Pas de rappel : continuer de traiter les pannes une à une",
        d: "Ne coûte rien de plus aujourd'hui.",
      },
      {
        t: "Rappeler tous les MX-160 vendus depuis l'été, tous lots confondus",
        d: "Le lot échangé, les autres inspectés à l'atelier : 150 appareils de plus, à 60 € l'inspection.",
      },
    ],
    reactions: [
      [
        {
          ...RELAIS,
          texte:
            "Les maçons et chapistes ont été appelés un par un. Plusieurs ont dit : « Enfin quelqu'un qui prévient. »",
        },
      ],
      [
        {
          ...RELAIS,
          texte:
            "Le rappel du lot est lancé. Beaucoup de clients occasionnels ne comprennent pas : leur malaxeur sert deux fois par an et marche très bien.",
        },
      ],
      [
        {
          ...ATELIER,
          texte: "On continue. L'atelier voit passer les mêmes pignons, semaine après semaine.",
        },
      ],
      [
        {
          de: "Mélissa Duret",
          role: "Assistante SAV",
          texte:
            "Cent cinquante clients appelés en plus de ceux du lot. L'atelier inspecte à la chaîne des appareils qui n'ont rien.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le bruit court chez les artisans",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...RELAIS,
        heure: "08:50",
        alerte: true,
        texte:
          "Un chapiste a posté sa panne de MX-160 sur un groupe d'artisans de la région : quarante commentaires. Des clients nous appellent pour savoir si leur appareil fait partie du problème.",
      },
      {
        ...SERVICE,
        heure: "18:00",
        texte: `Retours en semaine 8 : ${ctx.retours}. Clients concernés satisfaits : ${ctx.satisfaction}.`,
      },
    ],
    sources: [
      {
        id: "groupe",
        titre: "Lire ce que disent les artisans sur le groupe",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Personne ne réclame de geste commercial. Les questions sont toujours les mêmes : « est-ce que le mien va casser ? », « comment je le sais ? », « qui paie ? ». Un maçon écrit : « Ce qui m'énerve, ce n'est pas la panne, c'est qu'on ne m'ait rien dit. »",
      },
    ],
    question: "Que dites-vous aux clients ?",
    options: [
      {
        t: "Écrire à tous les acheteurs du lot : le défaut, les signes d'usure, l'échange gratuit",
        d: "Un courrier et un SMS, 600 €. Quelques clients d'autres lots viendront aussi faire vérifier.",
      },
      {
        t: "Ne rien dire de plus : on répond au cas par cas",
        d: "Ne coûte rien. Les agences répondent à ceux qui appellent.",
      },
      {
        t: "Offrir un bon d'achat de 40 € à chaque client qui se manifeste",
        d: "Au comptoir et au téléphone, sans autre explication.",
      },
      {
        t: "Répondre, comme Vantrel, qu'aucun défaut n'est établi",
        d: "Une réponse type pour les agences. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...RELAIS,
          texte:
            "Les courriers sont partis. Plusieurs clients ont appelé pour remercier, et une douzaine viennent faire échanger.",
        },
      ],
      [
        {
          ...RELAIS,
          texte:
            "Des clients demandent si leur appareil est concerné. On ne sait pas quoi leur répondre, alors on dit qu'on va voir.",
        },
      ],
      [
        {
          ...RELAIS,
          texte:
            "Les bons d'achat partent vite. Les clients les prennent, et reposent quand même la question.",
        },
      ],
      [
        {
          ...RELAIS,
          texte:
            "Un chapiste a publié notre réponse type sur le groupe, juste à côté de la photo de sa troisième panne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le lot corrigé arrive",
    jusqua: 13,
    messages: () => [
      {
        ...ACHATS,
        heure: "14:00",
        alerte: true,
        texte:
          "Vantrel ne livre plus les anciens lots : nos derniers MX-160 sains partent cette semaine. Il nous livre lundi un nouveau lot, le L-2611, avec un pignon « renforcé ». Je le mets en rayon ?",
      },
      {
        ...DIRECTION,
        heure: "15:30",
        texte:
          "Trois semaines avant la fin du trimestre. Je ne veux ni rupture, ni deuxième série de pannes.",
      },
    ],
    sources: [
      {
        id: "essais",
        titre: "Demander à Vantrel le rapport d'essai du pignon renforcé",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Vantrel n'a pas de rapport d'essai, seulement une fiche qui annonce « un traitement amélioré ». Thibault : « L'an dernier, un autre fournisseur nous a livré un lot corrigé : sur dix appareils passés au banc à réception, trois avaient le même défaut. Ça arrive une fois sur trois. »",
      },
    ],
    question: "Que faites-vous du nouveau lot ?",
    options: [
      {
        t: "Contrôler dix appareils au banc à réception avant de le mettre en vente",
        d: "Vingt heures de banc à l'atelier, 1 200 €. Le lot part en rayon s'il passe.",
      },
      {
        t: "Le mettre en rayon dès réception",
        d: "Pas de rupture. Ne coûte rien.",
      },
      {
        t: "Référencer le malaxeur d'une autre marque à la place",
        d: "1 800 € de référencement. Livré en semaine 13, rupture d'ici là.",
      },
      {
        t: "Laisser le MX-160 en rupture jusqu'à la fin du trimestre",
        d: "Le temps de voir si Vantrel tient parole. Environ 2 500 € de ventes perdues par semaine.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...ACHATS,
          texte:
            "Le L-2611 est en rayon dans les six agences depuis lundi. Les maçons sont contents de le retrouver.",
        },
      ],
      [
        {
          ...ACHATS,
          texte:
            "Le nouveau malaxeur est référencé : livraison en semaine 13. D'ici là, les agences orientent les clients vers les bétonnières.",
        },
      ],
      [
        {
          de: "Patrice Gaillard",
          role: "Chef d'agence, Vénissieux",
          texte:
            "Plus de malaxeurs en rayon. Les maçons repartent les mains vides, ou chez le concurrent.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Trouver le lot, puis agir", chemin: [1, 0, 0, 0, 0, 0] },
  { nom: "Un geste à chaque plainte", chemin: [0, 1, 2, 3, 2, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 1, 3] },
] as const;

/**
 * Les options du réflexe du métier : traiter chaque plainte par un geste ou
 * un remplacement, ou tout retirer d'un coup — [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [1, 2],
  [3, 3],
  [4, 2],
] as const;

export const REPONSES = {
  dossierAccepte:
    "Au vu de votre dossier et de l'expertise, Vantrel reconnaît un défaut de traitement thermique du pignon sur le lot L-2607. Nous prenons en charge 80 % de vos coûts directs, y compris pour la suite du trimestre.",
  dossierRefuse:
    "Notre service technique maintient ses conclusions : usage inadapté. Nous ne pouvons pas aller au-delà de la garantie contractuelle.",
  suspensionLevee:
    "Pour que les commandes reprennent, Vantrel prend en charge la moitié de vos frais sur le MX-160. Sans reconnaissance de défaut.",
  suspensionMaintenue:
    "Vantrel maintient sa position. Si vous suspendez vos commandes, c'est votre choix.",
  pelissierPart:
    "Madame Bertin, j'ai ouvert un compte chez un autre négoce. Rien de personnel : j'ai des chantiers à tenir.",
  pelissierReste: "Mes chantiers tournent, et vous avez été réglo. On continue ensemble.",
  lotControleBon:
    "Contrôle de dix L-2611 : pignons intacts après vingt heures de banc. Le lot part en rayon lundi.",
  lotControleMauvais:
    "Contrôle de dix L-2611 : trois pignons déjà marqués après vingt heures de banc. Lot refusé, renvoyé à Vantrel. Plus de MX-160 à vendre d'ici la fin du trimestre.",
  nouveauLotCasse:
    "Les premiers L-2611 reviennent, pignon usé comme les autres. Le lot a été accepté sans réserve : Vantrel refuse de le reprendre à ses frais, il faut le rappeler.",
} as const;
