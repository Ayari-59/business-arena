/**
 * LES DESSERTS QUI PLAISENT À L'EXPORT — le contenu de l'épisode.
 *
 * Corto Kerouédan dirige l'export de la Laiterie de Kerbrélan. Un
 * importateur de Saragosse, Distribuciones Nevaria, a goûté les desserts au
 * salon de Paris et propose de les distribuer dans les 600 supermarchés de
 * deux enseignes espagnoles, contre une exclusivité de cinq ans. Le comité de
 * direction hésite entre signer, monter une filiale commerciale à Madrid ou
 * ne pas y aller. D'avril à juin, six décisions, chacune précédée de ce
 * qu'un directeur export reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les conditions de l'offre, les scénarios de
 * l'étude de marché, la DLC à la réception et les pertes de chaque gamme,
 * le seuil de généralisation, les chances que l'importateur accepte chaque
 * contrat. Les chiffres qui dépendent des décisions arrivent par le contexte.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const TELMO = { de: "Telmo Urquijo", role: "Directeur général, Distribuciones Nevaria" } as const;
const TXEMA = {
  de: "Txema Olabarria",
  role: "Directeur commercial, Distribuciones Nevaria",
} as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const LENAIC = { de: "Lénaïc Guivarc'h", role: "Président" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const AZILIS = { de: "Azilis Cozic", role: "Responsable emballages et développement" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const HERVELINE = {
  de: "Herveline Daniélou",
  role: "Directrice marketing et innovation",
} as const;
const JURIDIQUE = { de: "Service juridique", role: "Siège, Loudéac" } as const;
const SUIVI = { de: "Suivi export Espagne", role: "Point hebdomadaire" } as const;

/** Ce qui se dit selon la manière d'entrer choisie en semaine 1 : signe, test, filiale, decline. */
const par = <T>(ctx: Contexte, choix: { autre: T } & Partial<Record<string, T>>): T =>
  choix[String(ctx.entree)] ?? choix.autre;

export const DIAGNOSTICS = [
  {
    id: "etapes",
    t: "L'Espagne se décide sur ce que nos desserts supportent et sur le partage du risque avec l'importateur : entrer par étapes, avec la gamme qui voyage, sans s'enfermer avant d'avoir vu les chiffres",
  },
  {
    id: "dlc",
    t: "Le vrai sujet est la DLC : des desserts frais qui perdent une semaine sur la route ne tiendront pas en rayon, il faut envoyer ce qui voyage",
  },
  {
    id: "vitesse",
    t: "Six cents supermarchés d'un coup, c'est une occasion qui ne se représentera pas : il faut aller vite, avant le Groupe Nordal",
  },
  {
    id: "marge",
    t: "L'importateur prend une marge trop forte : pour la garder, il faut notre propre filiale à Madrid",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Six cents supermarchés, cinq ans d'exclusivité",
    jusqua: 2,
    messages: () => [
      {
        ...TELMO,
        heure: "08:40",
        alerte: true,
        texte:
          "Monsieur Kerouédan, comme promis au salon : je prends vos desserts dans les 600 supermarchés que je livre pour Mercaduero et Salinar. Cinq ans d'exclusivité sur l'Espagne, premiers camions en mai. Il me faut votre réponse vendredi : Nordal m'a déjà appelé deux fois.",
      },
      {
        ...LENAIC,
        heure: "09:30",
        texte:
          "Corto, l'Espagne, c'est le marché que mon père voulait ouvrir. Six cents magasins, on n'aura pas ça deux fois. Et si Nordal le prend, on ne le reprendra pas. Mais réfléchis aussi à une vraie filiale : Nordal en a une à Madrid, lui.",
      },
      {
        ...IWAN,
        heure: "11:15",
        texte:
          "Avant le comité de vendredi, je voudrais un chiffre : ce que cette offre rapporte par an, frais compris. L'export, c'est 6 % de notre chiffre d'affaires, et je n'ai pas envie d'y perdre de l'argent.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "offre",
        titre: "Chiffrer l'offre de Nevaria",
        cout: 1,
        nature: "decisive",
        resultat:
          "600 supermarchés, les desserts frais goûtés au salon : crèmes desserts et riz au lait, en packs de quatre. Prix de cession à Nevaria : 1,60 € le pack. Coût de revient variable rendu à sa plateforme de Saragosse : 1,14 € (0,98 € de lait, sucre, emballage et énergie, 0,16 € de transport frigorifique). Route et plateforme prennent 7 jours : les packs arrivent avec 21 jours de DLC sur 28, et les enseignes exigent au moins les deux tiers, 19 jours. Dans un marché moyen, 12 packs sur 100 livrés sont refusés à la réception ou démarqués en rayon, à notre charge : produits et transportés, jamais payés. Nevaria demande un soutien marketing de 110 k€ par an pendant cinq ans (promotions, prospectus, têtes de gondole) et 150 € de référencement par magasin, soit 90 k€. En échange : l'exclusivité sur toute l'Espagne pendant cinq ans, sans objectif de volume.",
      },
      {
        id: "etude",
        titre: "Lire l'étude du marché espagnol des desserts lactés",
        cout: 1,
        nature: "decisive",
        resultat:
          "Aitana Moraza, consultante, a suivi les lancements de desserts étrangers en Espagne depuis dix ans. Accueil fort, une fois sur quatre : 20 packs par magasin et par semaine, curiosité passée. Accueil moyen, un peu moins d'une fois sur deux : 16 packs. Accueil faible, trois fois sur dix : 7 packs, et les enseignes retirent la référence de la moitié des magasins dès la deuxième année. Les deux premières semaines d'un lancement vendent 40 % de plus que la suite : la curiosité. Six semaines de test dans 60 magasins suffisent à lire la rotation de fond.",
      },
      {
        id: "salon",
        titre: "Rappeler le directeur commercial de Nevaria",
        cout: 1,
        nature: "bruit",
        resultat:
          "Txema Olabarria : « Au salon, vos crèmes au caramel sont parties en une heure. Les Espagnols adorent ce qui vient de France : comptez 30 packs par magasin et par semaine, minimum. » Ses chiffres viennent du stand de dégustation, pas d'un rayon.",
      },
      {
        id: "pontivy",
        titre: "Demander à Pontivy ce que valent ses desserts UHT à l'export",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Fanchon Lozac'h : « Nos crèmes et notre riz au lait stérilisés UHT tiennent 120 jours. Coût variable : 1,02 € le pack, et 0,06 € de transport en camion non frigorifique. En Espagne, les desserts UHT se vendent environ 15 % de moins que les frais, mais on n'en perd presque pas : 1 pack sur 100. La ligne UHT a de la place. »",
      },
      {
        id: "conseil",
        titre: "Appeler Ainhoa Bengoetxea, ancienne directrice export d'une fromagerie",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ainhoa Bengoetxea : « Ne signe jamais cinq ans d'exclusivité avant d'avoir vu tes produits tourner en rayon : un test d'abord, puis une exclusivité courte qui se mérite, avec des objectifs. Et regarde ce que ton produit supporte : la route mange la DLC, et c'est toi qui paies ce que l'enseigne refuse. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: "Signer l'accord de Nevaria : 600 supermarchés dès mai, cinq ans d'exclusivité",
        d: "90 k€ de référencement et 110 k€ par an de soutien marketing ; premières livraisons en semaine 5.",
      },
      {
        t: "Proposer d'abord un test de six semaines dans 60 magasins, et négocier le contrat sur ses chiffres",
        d: "9 k€ de référencement et 20 k€ d'animation ; premières livraisons en semaine 3, contrat discuté en juin.",
      },
      {
        t: "Créer une filiale commerciale à Madrid et vendre en direct aux centrales espagnoles",
        d: "60 k€ de création, puis 200 k€ par an de frais fixes ; premiers référencements visés en semaine 10.",
      },
      {
        t: "Décliner : l'Espagne attendra",
        d: "Rien n'est engagé.",
      },
    ],
    reactions: [
      [
        {
          ...TELMO,
          texte:
            "Parfait. Le contrat part chez vos avocats ce soir. Premiers camions en semaine 5 : je compte sur vous pour les volumes, et sur votre soutien pour les promotions.",
        },
      ],
      [
        {
          ...TELMO,
          texte:
            "Un test… D'accord pour 60 magasins, dans les deux enseignes, à partir de la semaine 3. Mais en juin, je veux un contrat. Nordal ne m'attendra pas éternellement.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "Je lance la création de la société espagnole et le recrutement d'un directeur pays. Comptez 200 k€ de frais fixes par an, dès le mois prochain.",
        },
        {
          ...TELMO,
          texte:
            "Vous préférez vous passer de nous. Très bien : je vais voir Nordal, pour les desserts et pour la crème de mes restaurants.",
        },
      ],
      [
        {
          ...TELMO,
          texte:
            "Dommage. Je vais voir Nordal : pour les desserts, et pour la crème fraîche de mes restaurants avec.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce qui passe les Pyrénées",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...par(ctx, { decline: SUIVI, filiale: IWAN, autre: TELMO }),
        heure: "10:05",
        alerte: ctx.entree !== "decline",
        texte: par(ctx, {
          signe:
            "Les premiers camions partent dans dix jours. Je veux les crèmes et le riz au lait que j'ai goûtés au salon : les frais. Les Espagnols achètent des desserts au rayon frais.",
          test: "Pour le test, je veux les crèmes et le riz au lait du salon : les frais. Les Espagnols achètent des desserts au rayon frais.",
          filiale:
            "La filiale va démarcher les centrales de Mercaduero et de Salinar : il lui faut une gamme pour les premiers rendez-vous. Les frais de Loudéac, ou les UHT de Pontivy ?",
          autre:
            "Pas d'Espagne ce trimestre. La question de la gamme se reposera si l'on y retourne.",
        }),
      },
      {
        ...YSEE,
        heure: "14:30",
        texte:
          "Pour la route : Transports Kerfroid peut livrer en direct les entrepôts des centrales en camions complets, quatre jours au lieu de sept par la plateforme de Saragosse, pour 5 centimes de plus par pack. Pour les UHT, un camion non frigorifique suffit.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "routes",
        titre: "Calculer ce que la route coûte à chaque gamme",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dans un marché moyen, étiquette mise à part. Desserts frais par la plateforme : ${ctx.dlcPlateforme} de DLC à la réception, ${ctx.pertesPlateforme} de pertes, ${ctx.margePlateforme} de marge par pack vendu, ${ctx.semainePlateforme} par magasin et par semaine. Frais en direct : ${ctx.dlcDirect}, ${ctx.pertesDirect} de pertes, ${ctx.margeDirect} par pack, ${ctx.semaineDirect} par magasin et par semaine. UHT de Pontivy : ${ctx.dlcUht}, ${ctx.pertesUht} de pertes, ${ctx.margeUht} par pack, et 15 % de packs vendus en moins : ${ctx.semaineUht} par magasin et par semaine. Dans un marché faible, les packs frais vieillissent en rayon : ${ctx.pertesPlateformeFaible} de pertes par la plateforme.`,
      },
      {
        id: "nordal",
        titre: "Regarder ce que le Groupe Nordal vend en Espagne",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Nordal fabrique ses desserts frais dans une usine près de Valence, à moins de deux jours des magasins. Ce qu'il fait venir de France, ce sont ses crèmes et ses flans UHT. Dans les deux enseignes de Nevaria, les desserts UHT ont deux mètres de rayon, au frais ou à température ambiante.",
      },
    ],
    question: "Quelle gamme envoyez-vous en Espagne ?",
    options: [
      {
        t: "Les desserts frais que Nevaria a goûtés au salon, par sa plateforme de Saragosse",
        d: "Crèmes desserts et riz au lait de Loudéac, 28 jours de DLC ; aucun surcoût.",
      },
      {
        t: "Les desserts stérilisés UHT de Pontivy",
        d: "Crèmes et riz au lait UHT, 120 jours de DLC ; transport non frigorifique.",
      },
      {
        t: "Les desserts frais, livrés en direct chez les centrales en camions complets",
        d: "5 centimes de plus par pack chez Transports Kerfroid ; quatre jours de route au lieu de sept.",
      },
    ],
    reactions: [
      [
        {
          ...YSEE,
          texte:
            "Entendu : les frais de Loudéac, par la plateforme de Saragosse. Je cale les départs du mardi et du vendredi.",
        },
      ],
      [
        {
          ...FANCHON,
          texte:
            "C'est noté : crèmes et riz au lait UHT. On les produit sur la ligne UHT le jeudi, ils partent le lundi suivant.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Entendu : les frais de Loudéac, en direct chez les centrales. Kerfroid nous réserve deux camions complets par semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "L'étiquette en espagnol",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ANNAIG,
        heure: "09:00",
        alerte: ctx.entree !== "decline",
        texte: par(ctx, {
          decline:
            "Pas d'Espagne ce trimestre : la question de l'étiquetage en espagnol est mise de côté.",
          signe:
            "En Espagne, tout ce que dit l'étiquette doit être lu en espagnol : dénomination, ingrédients, allergènes mis en évidence, conservation. Les premiers camions partent lundi pour 600 magasins : il faut une solution tout de suite.",
          test: "En Espagne, tout ce que dit l'étiquette doit être lu en espagnol : dénomination, ingrédients, allergènes mis en évidence, conservation. Les lots du test sont partis avec des étiquettes provisoires collées à la main. Il faut une solution durable avant la semaine 5.",
          autre:
            "En Espagne, tout ce que dit l'étiquette doit être lu en espagnol : dénomination, ingrédients, allergènes mis en évidence, conservation. La filiale en aura besoin pour ses premiers référencements.",
        }),
      },
      {
        ...TXEMA,
        heure: "11:20",
        texte:
          "Nous pouvons coller les étiquettes en espagnol sur chaque pack à notre plateforme. C'est ce que font la plupart de nos fournisseurs étrangers : rien à changer chez vous.",
      },
    ],
    sources: [
      {
        id: "etiquetage",
        titre: "Comparer les trois façons d'étiqueter en espagnol",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur-étiquetage chez Nevaria : 15 k€ de mise en place, 4 centimes par pack, deux jours de plus sur la plateforme. Sur les importateurs qui sur-étiquettent, trois sur dix ont laissé passer au moins une erreur la première année, le plus souvent sur la mention des allergènes : retrait des lots, 25 k€ de frais et deux semaines sans ventes. Emballage bilingue français-espagnol : 12 k€ de clichés, le même pack servant en France et en Espagne. Emballage dédié à l'Espagne : 30 k€ de clichés et 20 k€ de stock minimal d'emballages, perdu si l'on arrête ; il fait vendre 2 % de plus.",
      },
      {
        id: "faisabilite",
        titre: "Demander à Azilis Cozic ce qu'un emballage bilingue demande",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Azilis Cozic : « Le bilingue tient sur nos packs actuels en réduisant la typographie : les allergènes restent lisibles dans les deux langues. Trois semaines pour les clichés, aucun changement de format sur les lignes. Un emballage dédié, c'est six semaines et un minimum de commande chez l'imprimeur. »",
      },
    ],
    question: "Comment étiquetez-vous en espagnol ?",
    options: [
      {
        t: "Laisser Nevaria sur-étiqueter en espagnol à sa plateforme",
        d: "15 k€ de mise en place, 4 centimes par pack ; les packs restent deux jours de plus sur la plateforme.",
      },
      {
        t: "Passer les références exportées en emballage bilingue français-espagnol",
        d: "12 k€ de clichés ; le même pack en France et en Espagne, prêt en trois semaines.",
      },
      {
        t: "Créer un emballage dédié à l'Espagne",
        d: "30 k€ de clichés et 20 k€ de stock minimal d'emballages ; un pack pensé pour le rayon espagnol.",
      },
    ],
    reactions: [
      [
        {
          ...TXEMA,
          texte: "Parfait : nos équipes de la plateforme s'en chargent dès la semaine prochaine.",
        },
      ],
      [
        {
          ...AZILIS,
          texte:
            "Je lance les clichés bilingues. Annaïg relit les mentions en espagnol avec un traducteur spécialisé avant l'impression.",
        },
      ],
      [
        {
          ...HERVELINE,
          texte:
            "Je briefe l'agence : un pack aux couleurs du marché espagnol. Premiers emballages dans six semaines.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Un drapeau à Madrid ?",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...LENAIC,
        heure: "08:50",
        alerte: true,
        texte: par(ctx, {
          filiale:
            "Corto, la filiale avance ? J'ai dîné avec le président de Nordal : quarante personnes à Madrid. On ne fera pas l'Espagne avec un bureau vide.",
          decline:
            "Corto, j'ai dîné avec le président de Nordal : quarante personnes à Madrid. On a eu tort de laisser passer l'Espagne. Qu'est-ce qu'on fait ?",
          autre:
            "Corto, j'ai dîné avec le président de Nordal : quarante personnes à Madrid. Nevaria prend sa marge sur nos desserts ; avec une filiale, cette marge serait à nous. Je voudrais qu'on la lance maintenant, pour être prêts à la rentrée.",
        }),
      },
      {
        ...YANNIG,
        heure: "10:40",
        texte:
          "Le président pousse pour la filiale. Je ne suis pas contre une présence sur place, mais je veux savoir ce qu'elle coûte et ce qu'elle rapporte avant le comité.",
      },
      {
        ...SUIVI,
        heure: "18:00",
        texte: `Magasins en rayon : ${ctx.magasins}. Packs vendus cette semaine : ${ctx.packs}. Résultat du trimestre en Espagne à ce jour : ${ctx.resultat}.`,
      },
    ],
    sources: [
      {
        id: "relais",
        titre: "Chiffrer une filiale et un relais sur place",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une filiale : 60 k€ de création, puis 200 k€ par an de frais fixes (un directeur pays, deux chefs de secteur, l'administration des ventes, un bureau). Tant que Nevaria distribue, elle ne vend rien ; et un importateur qui voit se monter une filiale sous ses yeux accepte un contrat à objectifs quatre fois sur dix de moins. Un volontaire international en entreprise (VIE) : 3 k€ par mois pendant deux ans, en poste dans trois à cinq semaines. Chez les fournisseurs de Nevaria qui ont quelqu'un sur place pour vérifier la présence en rayon et suivre les commandes, les ventes sont 8 % plus fortes ; l'importateur en dit du bien.",
      },
      {
        id: "madrid",
        titre: "Se renseigner sur la filiale de Nordal à Madrid",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "La filiale de Nordal emploie quarante personnes et vend 60 M€ par an en Espagne : yaourts, desserts, fromages, une usine près de Valence. Rien de comparable avec quelques centaines de milliers de packs de desserts.",
      },
    ],
    question: "Que répondez-vous au président ?",
    options: [
      {
        t: "Lancer dès maintenant la filiale de Madrid, comme il le souhaite",
        d: "60 k€ de création, puis 200 k€ par an de frais fixes.",
      },
      {
        t: "Envoyer un volontaire international (VIE) à Madrid pour suivre les magasins et l'importateur",
        d: "3 k€ par mois pendant deux ans ; en poste dans trois à cinq semaines.",
      },
      {
        t: "Suivre l'Espagne depuis Loudéac, comme les autres pays",
        d: "Rien de plus à payer.",
      },
    ],
    reactions: [
      [
        {
          ...LENAIC,
          texte:
            "Merci, Corto. Iwan lance la société, et le cabinet de recrutement cherche un directeur pays.",
        },
      ],
      null,
      [
        {
          ...LENAIC,
          texte: "Si tu le dis. On en reparlera quand les volumes seront là.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les chiffres du test",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...par(ctx, { decline: SUIVI, filiale: SUIVI, autre: TELMO }),
        heure: "09:15",
        alerte: ctx.entree === "test",
        texte: par(ctx, {
          test: `Six semaines de test : vos desserts tournent à ${ctx.moyenneNevaria} packs par magasin et par semaine en moyenne. C'est excellent. Je veux les 600 magasins en septembre, et le contrat de cinq ans que je vous ai proposé en avril.`,
          signe: `Vos desserts sont dans les 600 magasins depuis quatre semaines : ${ctx.rotation} packs par magasin et par semaine, curiosité passée. On continue.`,
          filiale:
            "La filiale n'a encore rien vendu : les premiers rendez-vous avec les centrales sont fixés en semaine 10.",
          autre: "Pas d'Espagne ce trimestre : aucun chiffre à lire.",
        }),
      },
      {
        ...LENAIC,
        heure: "11:00",
        texte:
          ctx.entree === "test"
            ? "Le plan présenté au comité prévoyait les 600 magasins à la rentrée. Si le test est bon, ne perdons pas l'été."
            : "Tiens-moi au courant pour l'Espagne.",
      },
    ],
    sources: [
      {
        id: "lecture",
        titre: "Lire le test magasin par magasin, curiosité mise à part",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.entree === "test"
            ? `Les deux premières semaines ont vendu 40 % de plus que les quatre suivantes : la curiosité. La rotation de fond, semaines 3 à 6 du test : ${ctx.rotation} packs par magasin et par semaine. Le seuil de généralisation, avec la gamme et l'étiquette retenues : ${ctx.seuil} packs, ce qu'il faut pour que 600 magasins paient le soutien marketing de 110 k€ par an et le référencement des 540 magasins à ouvrir, étalé sur cinq ans. ${ctx.audessus ? "Le test est au-dessus du seuil." : "Le test est sous le seuil : 600 magasins perdraient de l'argent chaque année."}`
            : ctx.entree === "signe"
              ? `Le contrat est signé pour cinq ans, sans objectifs : il n'y a rien à décider sur la généralisation. Rotation de fond : ${ctx.rotation} packs par magasin et par semaine.`
              : "Il n'y a pas de test à lire.",
      },
      {
        id: "moyenne",
        titre: "Reprendre le tableau de ventes envoyé par Nevaria",
        cout: 0.5,
        nature: "bruit",
        resultat: (ctx) =>
          ctx.entree === "test"
            ? `Le tableau de Nevaria fait la moyenne des six semaines, lancement compris : ${ctx.moyenneNevaria} packs par magasin et par semaine. Ce n'est pas ce que les magasins vendront une fois la nouveauté passée.`
            : "Nevaria n'a pas de tableau de test à envoyer.",
      },
    ],
    question: "Que décidez-vous pour la suite du test ?",
    options: [
      {
        t: "Généraliser aux 600 magasins à la rentrée, comme le plan présenté au comité le prévoit",
        d: "81 k€ de référencement pour les 540 magasins à ouvrir ; le contrat se négocie dans la foulée.",
      },
      {
        t: "Généraliser seulement si la rotation de fond du test dépasse le seuil ; sinon, s'arrêter là",
        d: "81 k€ de référencement si l'on généralise ; 6 k€ pour retirer les desserts des 60 magasins sinon.",
      },
      {
        t: "Prolonger le test de trois mois avant de décider",
        d: "10 k€ d'animation en plus ; une généralisation, s'il y en a une, glisse à décembre.",
      },
      {
        t: "Arrêter l'Espagne",
        d: "6 k€ pour retirer les desserts des 60 magasins.",
      },
    ],
    reactions: [
      [{ ...SUIVI, texte: "Plan maintenu : 600 magasins à la rentrée." }],
      [
        {
          ...SUIVI,
          texte:
            "Décision prise sur la rotation de fond : la suite dépend du seuil, et Nevaria le sait.",
        },
      ],
      [{ ...SUIVI, texte: "Le test continue dans les 60 magasins jusqu'en septembre." }],
      [{ ...SUIVI, texte: "Nous prévenons Nevaria : les desserts quittent les rayons." }],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le contrat",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...(ctx.contratEnJeu ? TELMO : SUIVI),
        heure: "09:30",
        alerte: Boolean(ctx.contratEnJeu),
        texte: ctx.contratEnJeu
          ? "Monsieur Kerouédan, les 600 magasins sont réservés pour septembre. Il me faut le contrat la semaine prochaine. Cinq ans d'exclusivité : c'est ce que j'investis dans votre marque, je ne le fais pas pour deux saisons."
          : par(ctx, {
              signe:
                "Le contrat de cinq ans court depuis avril : il n'y a rien à renégocier avant son terme.",
              autre: "Aucun contrat d'importation n'est à signer ce trimestre.",
            }),
      },
      {
        ...IWAN,
        heure: "14:00",
        texte: ctx.contratEnJeu
          ? "Donne-lui ses cinq ans, Corto. Un importateur qui part chez Nordal, c'est tout le travail du trimestre perdu, et la crème de ses restaurants avec."
          : "Rien à signer, donc. On fera le point en juillet.",
      },
    ],
    sources: [
      {
        id: "contrats",
        titre: "Peser chaque contrat : ce qu'il engage, et les chances que Nevaria l'accepte",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.contratEnJeu
            ? `Cinq ans sans objectifs : Nevaria signe à coup sûr. Mais chez ses fournisseurs exclusifs sans objectifs, il pousse 15 % de moins dès la deuxième année, et on ne peut ni partir ni renégocier avant cinq ans. Deux ans, reconduits si les objectifs fixés sur le test sont tenus : ${ctx.chanceDeuxAns} ; si le marché tient, le prix de cession se renégocie à la reconduction, 10 centimes de plus par pack ; s'il décroche, on part. Trois ans avec objectifs et 70 k€ de soutien de lancement : ${ctx.chanceTroisAns} ; renégociation au bout de trois ans. Sans exclusivité : ${ctx.chanceSimple}, et un importateur qui pousse 10 % de moins. S'il refuse, il passe chez Nordal avec la crème de ses restaurants : 20 k€ de marge par an.`
            : "Aucun contrat d'importation n'est à négocier ce trimestre.",
      },
      {
        id: "avocat",
        titre: "Consulter Anxo Pazos, avocat en droit de la distribution à Madrid",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Anxo Pazos : « Une exclusivité se paie d'objectifs : c'est l'usage, et Nevaria le sait. Quitter un contrat avant son terme coûte la reprise de son stock, environ 30 k€ ; retirer vos desserts des rayons, à tout moment, environ 100 € par magasin. Et des objectifs fixés sur un test faible seront tenus : ils ne vous permettront pas de partir. »",
      },
    ],
    question: "Quel contrat proposez-vous à Nevaria ?",
    options: [
      {
        t: "Trois ans d'exclusivité, avec des objectifs de rotation et un soutien de lancement de 70 k€",
        d: "70 k€ la première année ; Nevaria a peu de raisons de dire non.",
      },
      {
        t: "Deux ans d'exclusivité, reconduits si les objectifs de rotation fixés sur le test sont tenus",
        d: "Rien de plus à payer ; Nevaria voulait cinq ans.",
      },
      {
        t: "Les cinq ans d'exclusivité qu'il demande, sans objectifs, pour ne pas le perdre",
        d: "Ce que Nevaria a demandé en avril ; il signera.",
      },
      {
        t: "Un contrat de distribution sans exclusivité",
        d: "Rien à payer ; libre de chercher un second distributeur.",
      },
    ],
    reactions: [
      [
        {
          ...JURIDIQUE,
          texte: "Projet de contrat prêt : trois ans, objectifs, soutien de lancement.",
        },
      ],
      [{ ...JURIDIQUE, texte: "Projet de contrat prêt : deux ans, reconduction sur objectifs." }],
      [{ ...JURIDIQUE, texte: "Projet de contrat prêt : cinq ans d'exclusivité, comme demandé." }],
      [{ ...JURIDIQUE, texte: "Projet de contrat prêt : distribution sans exclusivité." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Entrer par étapes", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Signer d'enthousiasme", chemin: [0, 0, 0, 0, 0, 2] },
  { nom: "Attentiste", chemin: [3, 0, 0, 2, 2, 2] },
] as const;

/**
 * Les réflexes d'un comité de direction devant un marché qui s'ouvre : signer
 * l'exclusivité longue d'enthousiasme ou monter d'emblée une filiale, envoyer
 * les produits phares sans regarder ce qu'ils supportent, laisser
 * l'importateur bricoler l'étiquette, céder au drapeau, tenir le plan malgré
 * le test, accorder ce que l'importateur demande pour ne pas le perdre.
 * [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 2],
] as const;

export const REPONSES = {
  vieTot:
    "L'agence qui recrute les VIE nous propose Sabela Couceiro : franco-espagnole, deux ans de chef de rayon à Bilbao. Elle prend son poste à Madrid en semaine 9.",
  vieTard:
    "Pas de candidat prêt tout de suite : Sabela Couceiro, franco-espagnole, deux ans de chef de rayon à Bilbao, ne prendra son poste à Madrid qu'en semaine 11.",
  accord:
    "Après réflexion, nous signons. Vous aurez nos 600 magasins en septembre. Et nous tiendrons vos objectifs.",
  refus:
    "Je suis désolé : Nordal m'a fait une offre que je ne peux pas refuser, avec l'exclusivité que vous ne vouliez pas me donner. Je reprends aussi sa crème pour mes restaurants.",
  accordCinqAns:
    "Cinq ans : marché conclu. Vous ne le regretterez pas. Les 600 magasins vous attendent en septembre.",
} as const;
