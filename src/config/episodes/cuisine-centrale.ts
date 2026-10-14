/**
 * LA CUISINE CENTRALE QU'ON N'ATTENDAIT PAS — le contenu de l'épisode.
 *
 * Théo Garrigues est directeur de la restauration du Groupe Escale. Le
 * comité de direction a équipé à Seynod un laboratoire de production et
 * attend qu'il fournisse, dès janvier, les fonds, les pains et toute la
 * pâtisserie des cinq Tables d'Augustin. Les chefs y voient la fin de leur
 * cuisine ; le plus en vue, celui d'Annecy, menace de partir. Six décisions,
 * de janvier à mars, chacune précédée de ce qu'un directeur de la
 * restauration reçoit vraiment : la direction générale qui tient à sa date,
 * des chefs qui refont sur place, un chauffeur qui roule quatre heures et
 * demie, des bacs qui arrivent tièdes.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle (le test de l'épisode le vérifie) : le dossier du
 * laboratoire famille par famille, ses frais fixes, sa montée en cadence, ce
 * qu'un dessert signature sorti du laboratoire a coûté à L'Escale Lac, le pain
 * du soir, le second camion, les petits-déjeuners des hôtels.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const ISALINE = {
  de: "Isaline Perraud",
  role: "Directrice générale du Groupe Escale",
} as const;
const SERAPHIN = {
  de: "Séraphin Mermillod",
  role: "Chef de cuisine, La Table d'Augustin Annecy",
} as const;
const ELIO = {
  de: "Elio Santoni",
  role: "Chef de cuisine, La Table d'Augustin Chambéry",
} as const;
const HARMONIE = {
  de: "Harmonie Desgranges",
  role: "Cheffe de cuisine, La Table d'Augustin Aix-les-Bains",
} as const;
const JORDI = {
  de: "Jordi Puigvert",
  role: "Chef de cuisine, La Table d'Augustin Évian",
} as const;
const XIMUN = {
  de: "Ximun Berthoud",
  role: "Chef de cuisine, La Table d'Augustin Megève",
} as const;
const SWANN = { de: "Swann Joubertin", role: "Responsable du laboratoire de Seynod" } as const;
const KADIATOU = { de: "Kadiatou Sidibé", role: "Contrôleuse de gestion restauration" } as const;
const TEODOR = { de: "Teodor Ionescu", role: "Chauffeur-livreur, laboratoire de Seynod" } as const;
const HADRIEN = { de: "Hadrien Morlot", role: "Responsable qualité du groupe" } as const;
const CLARENCE = {
  de: "Clarence Dufournet",
  role: "Cheffe pâtissière, La Table d'Augustin Annecy",
} as const;
const PHILEMON = {
  de: "Philémon Gruffaz",
  role: "Second de cuisine, La Table d'Augustin Annecy",
} as const;
const ANNABELLE = { de: "Annabelle Socquet", role: "Directrice de L'Escale Megève" } as const;

export const DIAGNOSTICS = [
  {
    id: "identite",
    t: "Le laboratoire ne rapportera que ce que les cuisines lui commanderont vraiment : il faut y mettre ce que les clients ne voient pas, et laisser en cuisine ce qui fait chaque Table",
  },
  {
    id: "logistique",
    t: "Le risque est d'abord logistique : un laboratoire qui doit monter en cadence, une tournée trop longue pour tenir le froid",
  },
  {
    id: "resistance",
    t: "Les chefs résistent par principe : tenir la date et le périmètre est le seul moyen qu'ils s'y fassent",
  },
  {
    id: "dossier",
    t: "Le dossier est trop optimiste : le laboratoire ne couvrira pas ses frais fixes, il faut le ramener à la boulangerie",
  },
] as const;

/** Les cuisines servies au moment où la décision se prend, dites en clair. */
const servies = (ctx: Contexte) =>
  ctx.aucuneServie
    ? "aucune Table n'est encore servie"
    : ctx.toutesServies
      ? "les cinq Tables sont servies"
      : `${ctx.servis} Tables sur 5 sont servies`;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le laboratoire ouvre, les cuisines se ferment",
    jusqua: 2,
    messages: () => [
      {
        ...SERAPHIN,
        heure: "07:02",
        alerte: true,
        texte:
          "Théo, je préfère te le dire avant que tu l'apprennes par d'autres : si mes desserts sortent d'un laboratoire de zone artisanale, je ne signe plus la carte d'Annecy. Les fonds, on peut en parler.",
      },
      {
        ...ISALINE,
        heure: "08:15",
        texte:
          "Bonne année, Théo. Le laboratoire de Seynod est prêt et le comité attend sa bascule : les cinq Tables le lundi de la semaine 3, fonds, pains et toute la pâtisserie, comme dans le dossier. On a trois mois de basse saison pour le faire avant le printemps. Dis-moi vendredi comment tu t'y prends.",
      },
      {
        ...SWANN,
        heure: "09:30",
        texte:
          "La brigade du laboratoire est au complet : cinq personnes. La cellule de refroidissement rapide et le four à sole sont réglés. Le camion frigorifique est livré jeudi.",
      },
      {
        ...XIMUN,
        heure: "22:48",
        texte:
          "160 couverts ce soir. On est en pleine saison jusqu'à la mi-avril, Théo : si une livraison manque à Megève, c'est la carte qui tombe.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "dossier",
        titre: "Reprendre le dossier du laboratoire avec Kadiatou Sidibé",
        cout: 1,
        nature: "decisive",
        resultat:
          "Ce que coûtent aujourd'hui par an, dans les cinq cuisines (matière, heures, pertes), puis au laboratoire, livraison comprise : fonds et sauces de base, 320 k€ puis 222 k€ ; pains, 270 k€ puis 188 k€ ; bases pâtissières (pâtes, crèmes, biscuits), 218 k€ puis 154 k€ ; desserts signatures, 240 k€ puis 168 k€. À cela s'ajoutent les frais fixes du laboratoire, qu'il produise ou non : camion frigorifique et chauffeur 34 k€, énergie et entretien 12 k€, analyses microbiologiques 6 k€ par an. Kadiatou : « Le chiffre de 316 k€ présenté au comité, c'est la somme des quatre familles. Les frais fixes n'y sont pas. »",
      },
      {
        id: "avis",
        titre: "Lire six mois d'avis clients des cinq Tables",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur 1 140 avis, 38 % citent un dessert par son nom : la tarte aux noix et au miel d'Annecy, le vacherin glacé aux myrtilles de Megève, le soufflé au génépi de Chambéry. Aucun ne parle d'un fond, d'une sauce, d'une pâte ou d'une crème ; 6 % parlent du pain, et toujours du pain du soir, « tiède et croustillant ». Il y a deux ans, le restaurant de L'Escale Lac avait remplacé ses desserts maison par ceux d'un fournisseur : sa note est passée de 4,5 à 4,25 en deux mois, et ses couverts ont baissé de 3 %.",
      },
      {
        id: "cuisines",
        titre: "Faire le tour des cinq cuisines",
        cout: 1,
        nature: "utile",
        resultat:
          "Elio Santoni, à Chambéry : « Prends mes fonds demain : ma brigade passera ses après-midi sur le dressage. » Harmonie Desgranges, à Aix-les-Bains : « Les bases, oui. Mes desserts, j'aimerais qu'on m'en parle. » Jordi Puigvert, à Évian : « Soixante-quinze minutes de route en hiver, avec un fond de veau dans un bac ? » Ximun Berthoud, à Megève : « Pas en pleine saison. » Séraphin Mermillod, à Annecy : « Orméa Hotels a fait la même chose à Chamonix. Au bout de six mois, leurs chefs refaisaient 45 % de ce que le laboratoire livrait, et le laboratoire a fermé. Mon fond de veau, je veux bien l'écrire pour tout le monde. Mes desserts, non. »",
      },
      {
        id: "commerce",
        titre: "Comparer avec les fonds déshydratés du commerce",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Un fond brun déshydraté du commerce revient 30 % moins cher que celui que le laboratoire produirait. Deux brasseries d'Annecy l'utilisent. Aucun des cinq chefs ne l'accepterait dans une cuisine de produits frais.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Isaline Perraud",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Isaline : « Un laboratoire n'économise que ce que les cuisines lui commandent. Regarde ce que les clients voient, et ce qu'ils ne voient pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment arrêtez-vous ce qui passe au laboratoire ?",
    options: [
      {
        t: "Tenir le plan du comité : tout le périmètre, desserts signatures compris",
        d: "Les cinq chefs reçoivent cette semaine le plan et les commandes types fixées par le laboratoire. C'est ce que le dossier chiffre.",
      },
      {
        t: "Arrêter le périmètre avec les cinq chefs : les bases au laboratoire, les desserts signatures et le dressage en cuisine",
        d: "Deux demi-journées de travail à Seynod, 800 € chacune en heures et en déplacements. Le dossier perd la ligne des desserts signatures.",
      },
      {
        t: "Ne passer que les pains pour commencer : c'est ce qui fâche le moins",
        d: "Pas de réunion. Les fonds et la pâtisserie attendront le printemps.",
      },
      {
        t: "Laisser chaque chef commander au laboratoire ce qu'il veut",
        d: "Le catalogue du laboratoire part aux cinq cuisines. Personne n'est obligé de rien.",
      },
    ],
    reactions: [
      [
        {
          ...SERAPHIN,
          texte:
            "Bien reçu. Je ferai ce que je peux avec ce qu'on me livrera. Clarence a demandé si elle devait chercher une autre place.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "Deux demi-journées utiles : on a écrit ensemble les fiches techniques des fonds et des pâtes. Séraphin a fini par donner son fond de veau, à condition qu'il garde son nom.",
        },
      ],
      [
        {
          ...SWANN,
          texte:
            "Le laboratoire fera du pain. Pour le reste, la brigade fait des essais et attend.",
        },
      ],
      [
        {
          ...SWANN,
          texte:
            "Le catalogue est parti. Pour l'instant, quelques questions de Chambéry et d'Aix ; rien d'Annecy, rien de Megève.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "La date du comité",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "11:20",
        alerte: true,
        texte:
          "Théo, lundi, c'est la date que le comité a votée. Je ne veux pas apprendre en avril que le laboratoire a tourné à vide tout l'hiver.",
      },
      {
        ...ANNABELLE,
        heure: "14:05",
        texte:
          "Les vacances de février commencent en semaine 6 : l'hôtel est complet jusqu'à la mi-mars, et la Table fait deux services le soir. Ce n'est pas le moment d'essayer quoi que ce soit à Megève.",
      },
      {
        ...KADIATOU,
        heure: "17:30",
        texte: `Économie nette du laboratoire depuis le début de l'année : ${ctx.economie}. Ce sont ses frais fixes : il n'a encore rien livré.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "cadence",
        titre: "Demander à Swann Joubertin ce que le laboratoire peut produire",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Swann : « Une brigade de laboratoire ne sort pas tout de suite le volume de cinq cuisines. La première semaine, on fera 35 % du volume du dossier, puis 50 %, 65 %, 80 %, 90 % ; il faut six semaines pour suivre les cinq Tables. En ce moment, à l'activité de janvier, les cinq Tables représentent 86 % de ce volume ; Chambéry et Aix-les-Bains ensemble, 27 %. »",
      },
      {
        id: "tournee",
        titre: "Faire la tournée d'essai avec Teodor Ionescu",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une seule tournée pour les cinq Tables : 4 h 30 de route avec les arrêts. Annecy à 6 h 15 ; Aix-les-Bains et Chambéry, à 35 et 45 minutes de Seynod, avant 8 h ; Évian et Megève, à 75 et 70 minutes, après 9 h 30. Teodor : « Les bacs n'ont ni plaques eutectiques ni enregistreur. En fin de tournée, je ne sais pas à combien ils arrivent. »",
      },
    ],
    question: "Comment lancez-vous la bascule ?",
    options: [
      {
        t: "Basculer les cinq Tables lundi, comme prévu",
        d: "La date du comité est tenue. Le laboratoire livre les cinq cuisines dès la semaine 3.",
      },
      {
        t: "Commencer par un pilote de six semaines à Chambéry et Aix-les-Bains",
        d: "Les deux Tables les plus proches, en basse saison, avec un relevé chaque jour : heure de livraison, température à réception, produits refaits. 100 € par semaine. Les trois autres suivront.",
      },
      {
        t: "Commencer par Évian et Megève, les plus loin et les plus chargées",
        d: "« Si ça marche là, ça marchera partout. » Même relevé quotidien, 100 € par semaine.",
      },
      {
        t: "Reporter la bascule après les vacances de février",
        d: "Laisser aux chefs le temps de s'y faire. Le laboratoire attend, ses frais fixes courent.",
      },
    ],
    reactions: [
      [
        {
          ...XIMUN,
          texte:
            "Lundi, on a reçu la moitié de la commande, à 10 h 40. J'ai remis deux commis sur les fonds pour le soir.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "Volontaires, Harmonie et moi. Le relevé est affiché sur la porte de la chambre froide : heure, température, ce qu'on refait et pourquoi.",
        },
      ],
      [
        {
          ...XIMUN,
          texte:
            "Le pilote chez moi, en pleine saison ? On le fera. Mais ne compte pas sur moi pour remplir un tableau à 23 heures.",
        },
      ],
      [
        {
          ...ISALINE,
          texte:
            "Je préviens le comité. Il n'aimera pas apprendre que le laboratoire attend jusqu'en mars.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les premières livraisons",
    jusqua: 6,
    messages: (ctx) =>
      ctx.aucuneServie
        ? [
            {
              ...SWANN,
              heure: "10:10",
              alerte: true,
              texte:
                "Rien n'est encore livré. La brigade fait des essais, et une partie part en repas du personnel.",
            },
            {
              ...KADIATOU,
              heure: "17:45",
              texte: `Économie nette depuis janvier : ${ctx.economie}. Les frais fixes du laboratoire courent sans rien en face.`,
            },
          ]
        : [
            {
              ...JORDI,
              heure: "09:50",
              alerte: true,
              texte: ctx.evianServie
                ? "Ce matin, les bacs de fonds sont arrivés à 8 °C. Refusés à réception, comme le veut notre plan HACCP. Mes commis ont refait le fond pour le service."
                : "Chambéry m'a raconté ses premières livraisons. Si un bac arrive tiède chez moi, je le refuse.",
            },
            {
              ...KADIATOU,
              heure: "17:45",
              texte: `Point de la semaine : ${servies(ctx)}. Incidents de livraison depuis la bascule : ${ctx.incidents}. Part de la production prévue au laboratoire refaite sur place : ${ctx.refaits}.`,
            },
          ],
    sources: [
      {
        id: "releves",
        titre: "Lire les relevés de livraison",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.pilote
            ? `${ctx.piloteProche ? "Les relevés du pilote sont nets" : "Les relevés d'Évian sont complets ; ceux de Megève, remplis un jour sur deux en plein coup de feu, disent la même chose"} : dans les bacs actuels, un fond perd un degré toutes les quarante minutes ; au-delà de deux heures de route, la limite de 3 °C est franchie. Les jours de retard, le camion part après 6 h 30 et tout glisse. Deux corrections suffiraient : des bacs avec plaques eutectiques et enregistreur, et une tournée coupée en deux boucles qui part à 5 h 30.`
            : ctx.aucuneServie
              ? "Pas encore de livraison, donc pas de relevé. Teodor a seulement noté, sur la tournée d'essai, que les bacs perdent un degré toutes les quarante minutes."
              : "Il n'y a pas de relevé systématique : les températures notées à réception sont incomplètes, les heures de livraison aussi. On voit seulement que les cuisines servies après deux heures de route reçoivent des bacs au-dessus de 3 °C, et que les jours de rupture, ce sont les dernières livrées qui manquent.",
      },
      {
        id: "camion",
        titre: "Demander un devis pour un second camion",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le loueur propose un second camion frigorifique avec un chauffeur en extra : 550 € par semaine. Deux tournées courtes au lieu d'une longue : plus aucun bac au-dessus de 3 °C. Il ne règle pas le reste : la commande, les ruptures, ce que les cuisines refont.",
      },
    ],
    question: "Que faites-vous des livraisons ?",
    options: [
      {
        t: "Interdire de refaire sur place : ce qui est livré doit être utilisé",
        d: "Une note aux cinq chefs : les commandes sont fixées par le laboratoire, et les produits livrés sont à utiliser.",
      },
      {
        t: "Corriger la tournée et l'emballage avec ce que montrent les relevés",
        d: "Des bacs isothermes à plaques eutectiques, avec enregistreur : 1 200 €. Départ à 5 h 30, tournée coupée en deux boucles : 100 € par semaine d'heures de chauffeur.",
      },
      {
        t: "Louer un second camion frigorifique pour deux tournées par jour",
        d: "550 € par semaine, chauffeur compris, jusqu'à la fin du trimestre.",
      },
      {
        t: "Ne rien changer : les débuts sont toujours difficiles",
        d: "Les cuisines s'adapteront.",
      },
    ],
    reactions: [
      [
        {
          ...JORDI,
          texte:
            "Je n'utiliserai pas un fond reçu à 8 °C, note ou pas. Je le jette, je le refais, et je l'écris dans le registre.",
        },
      ],
      [
        {
          ...TEODOR,
          texte:
            "Départ 5 h 30, deux boucles. Les enregistreurs affichent 2 °C à l'arrivée, et chaque chef peut lire la courbe sur son téléphone.",
        },
      ],
      [
        {
          ...TEODOR,
          texte: "Le second camion est arrivé lundi. Chacun sa boucle, on rentre avant 10 h.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "On fait avec. Les jours où les fonds arrivent tièdes, mes commis les refont pour le soir.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Ce que disent les assiettes",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...(ctx.signatures ? CLARENCE : HARMONIE),
        heure: "15:20",
        alerte: true,
        texte: ctx.signatures
          ? "Une cliente fidèle m'a demandé ce soir si j'avais changé ma tarte aux noix. Je n'ai pas su quoi lui répondre."
          : "Le feuilletage du laboratoire est plus cuit que le nôtre, et la crème pâtissière plus sucrée. Ça ne se voit pas dans l'assiette, mais mes pâtissiers le sentent.",
      },
      {
        ...KADIATOU,
        heure: "18:00",
        texte: `Note moyenne des avis des cinq Tables : ${ctx.note}. Part de la production prévue au laboratoire refaite sur place : ${ctx.refaits}.`,
      },
    ],
    sources: [
      {
        id: "aveugle",
        titre: "Faire goûter à l'aveugle douze produits aux chefs",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `À l'aveugle, les chefs ne distinguent pas les fonds, les sauces et les crèmes du laboratoire de ceux de leur cuisine. Ils reconnaissent la pâte feuilletée, trop cuite, et la crème pâtissière, trop sucrée : deux fiches techniques à reprendre.${
            ctx.signatures
              ? " Ils préfèrent quatre fois sur cinq les desserts signatures faits en cuisine, et Clarence Dufournet reconnaît chaque fois la sienne."
              : ""
          } Elio : « C'est la première fois qu'on nous demande notre avis sur ce qu'on reçoit. »`,
      },
      {
        id: "avis-mois",
        titre: "Lire les avis du mois",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Les avis réagissent avec retard : un client écrit quelques jours après son repas, et une note moyenne bouge sur plusieurs semaines. Note moyenne des cinq Tables aujourd'hui : ${ctx.note}.${
            ctx.signatures
              ? " Quatre avis de la semaine parlent de desserts « moins bons qu'avant »."
              : ""
          }`,
      },
    ],
    question: "Comment suivez-vous la qualité ?",
    options: [
      {
        t: "Faire goûter à l'aveugle chaque semaine, avec les chefs, et reprendre les fiches techniques",
        d: "Une demi-journée par semaine à Seynod, les chefs en alternance : 150 € par semaine.",
      },
      {
        t: "S'en remettre aux avis en ligne : ils diront s'il y a un problème",
        d: "Rien à organiser. Les avis arrivent avec quelques semaines de décalage.",
      },
      {
        t: "Faire auditer le laboratoire par le service qualité",
        d: "Un audit HACCP complet de Seynod par Hadrien Morlot et un laboratoire d'analyses : 2 500 €.",
      },
      {
        t: "Laisser chaque chef retoucher les produits du laboratoire à sa façon",
        d: "Chacun finit les fonds et les pâtes à son goût. Des heures reviennent en cuisine.",
      },
    ],
    reactions: [
      [
        {
          ...SERAPHIN,
          texte:
            "À l'aveugle, j'ai reconnu mon fond de veau, et je n'ai pas reconnu la crème du laboratoire. C'est bien qu'on goûte ensemble.",
        },
      ],
      [
        {
          ...KADIATOU,
          texte: "Je vous enverrai la note des avis chaque lundi.",
        },
      ],
      [
        {
          ...HADRIEN,
          texte:
            "Audit fait : plan de nettoyage et traçabilité conformes. Deux écarts corrigés : le refroidissement des fonds du soir, et l'étiquetage des dates limites.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "Mes commis reprennent les fonds pour les monter à notre façon. On y passe une heure par jour, mais c'est notre fond.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La suite de la bascule",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "09:00",
        alerte: true,
        texte: ctx.toutesServies
          ? `Le comité a vu que les cinq Tables sont servies. Il regarde maintenant l'économie : ${ctx.economie} depuis janvier. Qu'est-ce que tu changes ?`
          : `Le comité demande quand les cinq Tables seront au laboratoire : aujourd'hui, ${servies(ctx)}. Économie nette depuis janvier : ${ctx.economie}.`,
      },
      {
        ...SWANN,
        heure: "16:40",
        texte: ctx.aucuneServie
          ? "La brigade est prête. Mais tant qu'on n'a rien livré, on n'a jamais tenu un vrai volume."
          : "Le laboratoire tourne à plein maintenant. Ce qui me gêne, ce sont les pains : on en livre beaucoup, et on m'en commande de moins en moins pour le soir.",
      },
    ],
    sources: [
      {
        id: "refaits",
        titre: "Regarder, produit par produit, ce que les cuisines refont",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.aucuneServie
              ? "Rien n'est encore livré, mais les essais du laboratoire le montrent : le pain cuit le matin ne tient pas jusqu'au service du soir."
              : "Le pain du soir est refait dans quatre cas sur dix : livré cuit à 7 h, il est rassis au service de 19 h. Les fonds, les pâtes et les crèmes sont utilisés."
          } Le laboratoire peut livrer le pain du soir en pâtons crus surgelés, cuits sur place au dernier moment : la cuisson en cuisine coûte 12 % de l'économie sur les pains.`,
      },
      {
        id: "brigades",
        titre: "Demander aux chefs déjà servis ce qui a aidé leur brigade",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.aucuneServie
            ? "Aucune cuisine n'est encore servie. Elio Santoni : « Le jour où on basculera, il faudra que quelqu'un qui l'a déjà fait vienne en cuisine. Une note ne suffira pas. »"
            : ctx.piloteProche
              ? "Elio Santoni et Harmonie Desgranges : « Les deux premières semaines, nos commis ne savaient pas utiliser les fonds du laboratoire, alors ils en refaisaient. Ce qui a tout changé, c'est une journée à cuisiner avec Swann. On peut faire la même chose dans les autres cuisines. »"
              : "Les chefs déjà servis le disent tous : les premières semaines, leurs commis ne savaient pas utiliser les produits du laboratoire et en refaisaient. Une journée en cuisine avec quelqu'un qui l'a déjà fait aurait suffi.",
      },
    ],
    question: "Comment poursuivez-vous la bascule ?",
    options: [
      {
        t: "Basculer lundi les Tables qui restent, telles quelles",
        d: "Le périmètre et les produits ne changent pas. Le comité aura ses cinq Tables.",
      },
      {
        t: "Corriger le pain du soir, et faire accompagner chaque cuisine qui bascule par un chef déjà passé au laboratoire",
        d: "Pâtons crus surgelés cuits sur place. Une journée en cuisine avec un chef relais et une semaine de double production : 400 € de déplacements par cuisine.",
      },
      {
        t: "Corriger le pain du soir, et basculer lundi les Tables qui restent",
        d: "Pâtons crus surgelés cuits sur place. Pas d'accompagnement.",
      },
      {
        t: "Demander au comité de reporter la suite après la saison",
        d: "Megève ferme à la mi-avril : la suite basculerait au printemps. Le comité décidera.",
      },
    ],
    reactions: [
      [
        {
          ...ISALINE,
          texte: "Le comité sera content de voir les cinq Tables dans le tableau.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "J'irai à Évian mardi et Harmonie à Annecy jeudi. On cuisine avec leurs brigades une journée entière, avec les produits du laboratoire.",
        },
      ],
      [
        {
          ...SWANN,
          texte: "Les pâtons du soir partent lundi. Pour le reste, chaque cuisine se débrouille.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Ce qu'on confie encore au laboratoire",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "08:45",
        alerte: true,
        texte: ctx.signatures
          ? `Le comité a vu l'économie depuis janvier : ${ctx.economie}. Il veut savoir ce que tu ajoutes au laboratoire pour le printemps.`
          : `Le comité a vu l'économie depuis janvier : ${ctx.economie}. Il me rappelle que la ligne des desserts signatures, 72 k€ par an, n'est toujours pas faite. Qu'est-ce que tu ajoutes au laboratoire pour le printemps ?`,
      },
      {
        ...SWANN,
        heure: "11:30",
        texte:
          "En mars, le laboratoire a de la place : la brigade pourrait produire un quart de plus sans personne en plus.",
      },
      ...(ctx.ignaceParti
        ? [
            {
              ...PHILEMON,
              heure: "16:10",
              texte:
                "Séraphin finit ce soir. La brigade tient, mais trois habitués ont annulé leur table du samedi en apprenant son départ.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "petits-dejeuners",
        titre: "Chiffrer les petits-déjeuners des hôtels avec Kadiatou Sidibé",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les sept hôtels hors Megève servent 2 100 petits-déjeuners par semaine en mars. Les pains et les viennoiseries sont achetés à un grossiste 1,05 € par couvert ; le laboratoire les ferait pour 0,60 €, soit 945 € par semaine. Kadiatou : « Personne ne choisit son hôtel pour son croissant du buffet. »",
      },
      {
        id: "signatures",
        titre: "Revoir ce que pèsent les desserts signatures",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.signatures
            ? `Les desserts signatures sont au laboratoire depuis la bascule. Note moyenne des avis : ${ctx.note}, contre 4,46 en janvier ; les avis qui citent un dessert parlent de desserts « moins bons qu'avant ».`
            : "Un avis sur quatre cite la tarte aux noix d'Annecy ou le vacherin de Megève. À L'Escale Lac, des desserts sortis de chez un fournisseur avaient coûté un quart de point de note et 3 % des couverts.",
      },
    ],
    question: "Que confiez-vous encore au laboratoire ?",
    options: [
      {
        t: "Mettre tous les desserts signatures au laboratoire, pour tenir la ligne du dossier",
        d: "Les recettes des pâtissiers des cinq Tables passent au laboratoire ; plus aucun dessert signature n'est fait en cuisine à partir de lundi.",
      },
      {
        t: "Ouvrir le laboratoire aux pains et viennoiseries des petits-déjeuners des hôtels",
        d: "Les sept hôtels hors Megève, dès lundi. Le grossiste est prévenu.",
      },
      {
        t: "Ne rien ajouter avant l'été",
        d: "Le laboratoire garde ce qu'il fait aujourd'hui.",
      },
      {
        t: "Reverser à chaque brigade un quart de l'économie de sa cuisine",
        d: "Une prime d'équipe sur ce que chaque cuisine économise, versée chaque mois.",
      },
    ],
    reactions: [
      [
        {
          ...CLARENCE,
          texte:
            "Mon vacherin sortira de Seynod lundi. Je le fais depuis douze ans. Je ne sais pas ce que je ferai l'an prochain.",
        },
      ],
      [
        {
          ...SWANN,
          texte:
            "Premiers croissants livrés mardi à L'Escale Annecy-Centre et à L'Escale Lac. Les gouvernantes du petit-déjeuner n'ont vu aucune différence, sauf sur la facture.",
        },
      ],
      [
        {
          ...ISALINE,
          texte: "Le comité attendra l'été. Il voudra des chiffres.",
        },
      ],
      [
        {
          ...ELIO,
          texte:
            "Ma brigade a fait le calcul : une centaine d'euros chacun sur le trimestre. Les commis comptent maintenant ce qu'ils refont.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mutualiser avec les chefs", chemin: [1, 1, 1, 0, 1, 1] },
  { nom: "Appliquer la décision du comité", chemin: [0, 0, 0, 1, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 1, 3, 2] },
] as const;

/**
 * Les réflexes de l'épisode : imposer la bascule à date fixe, sur toute la production y compris
 * les desserts signatures, parce que la direction l'a décidé. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  reportAccepte:
    "Le comité accepte : la suite de la bascule attendra la fermeture de Megève, à la mi-avril.",
  reportRefuse:
    "Le comité refuse : les Tables qui restent basculent lundi, avec les commandes fixées par le laboratoire. Il ne veut plus de délai.",
  ignaceHiver:
    "Théo, je pars. J'ai une proposition à Genève, et je n'ai plus envie de me battre pour ma cuisine. Je finis à la fin de la semaine prochaine ; Philémon Gruffaz tiendra la cuisine en attendant.",
  ignaceDesserts:
    "Théo, mes desserts partent à Seynod lundi : moi, je pars aussi. J'ai une proposition à Genève. Je finis dans quinze jours.",
  ignaceTard:
    "Théo, je pars. Trois mois à refaire ce qu'on me livre, je n'en peux plus. J'ai une proposition à Genève ; je finis dans quinze jours.",
  signaturesRendues:
    "À l'aveugle, les desserts signatures du laboratoire ont perdu quatre fois sur cinq. Les chefs les reprennent en cuisine dès lundi ; le laboratoire garde les bases.",
} as const;
