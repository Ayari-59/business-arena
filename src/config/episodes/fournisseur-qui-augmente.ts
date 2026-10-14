/**
 * LE FOURNISSEUR QUI AUGMENTE — le contenu de l'épisode.
 *
 * Élodie Marchal achète la famille plâtrerie-isolation d'Arvel Distribution :
 * plaques de plâtre, doublages, isolants et accessoires pour les plaquistes
 * de la région lyonnaise. Placova, qui fournit 70 % des achats de la
 * famille, annonce +12 % au premier jour du trimestre. Six décisions, chacune
 * précédée de ce qu'une acheteuse reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "levier",
    t: "La hausse mêle du gaz qui baisse déjà et des points sans justification ; sans solution de repli, nous n'avons aucun levier pour la discuter",
  },
  {
    id: "couts",
    t: "Les coûts de Placova ont vraiment augmenté : la hausse est justifiée, il faut la faire passer dans nos prix",
  },
  {
    id: "abus",
    t: "Placova abuse de sa position : il faut le remplacer au plus vite par moins cher",
  },
  {
    id: "prix",
    t: "Nos prix de vente sont trop bas depuis longtemps : la hausse n'en est que le révélateur",
  },
] as const;

const PLACOVA = { de: "Bertrand Lemoine", role: "Directeur commercial, Placova" } as const;
const BREVENT = { de: "Samia Ouali", role: "Responsable commerciale, Brévent" } as const;
const AGENCE = { de: "Julien Morel", role: "Chef d'agence, Vénissieux" } as const;
const GESTION = { de: "Laure Vasseur", role: "Contrôleuse de gestion" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Placova augmente de 12 %",
    jusqua: 2,
    messages: () => [
      {
        ...PLACOVA,
        heure: "07:50",
        alerte: true,
        texte:
          "Madame Marchal, comme annoncé par courrier, nos tarifs plaques et doublages augmentent de 12 % à compter de ce jour, en raison de nos coûts d'énergie et de matières. Les commandes de la semaine seront facturées au nouveau tarif.",
      },
      {
        ...GESTION,
        heure: "08:40",
        texte:
          "Élodie, j'ai passé la hausse dans le modèle : à prix de vente inchangés, c'est environ 120 000 € de marge en moins sur le trimestre. La direction a revu le budget de la famille à 230 000 €, au lieu de 286 000 €. Tu me dis ce que tu fais ?",
      },
      {
        ...AGENCE,
        heure: "09:15",
        texte:
          "Surtout, ne touchez pas au prix de la BA13. Les Comptoirs Ferrat n'attendent que ça pour nous prendre nos plaquistes.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "decomposition",
        titre: "Reconstituer le coût de revient d'une plaque",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur les 12 points annoncés, le gaz des fours en justifie environ 7, au prix de juillet ; le papier et le gypse, 3. Les 2 derniers ne correspondent à aucun coût identifiable. Le gaz industriel a déjà reculé depuis l'été, et les contrats à terme le donnent encore en baisse d'un tiers d'ici décembre.",
      },
      {
        id: "brevent",
        titre: "Appeler Brévent, le fabricant de l'Ain",
        cout: 1,
        nature: "decisive",
        resultat:
          "Samia Ouali, chez Brévent : leurs plaques sont 9 % moins chères que le nouveau tarif de Placova. Mais l'usine est petite : 25 à 30 000 € de livraisons par semaine pour vous, soit un tiers de vos volumes au plus. Elle propose un camion d'essai par semaine pour se faire connaître.",
      },
      {
        id: "presse",
        titre: "Lire la presse professionnelle",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Tous les fabricants annoncent entre 8 et 15 % de hausse pour l'hiver. L'éditorial conclut que « le marché devra absorber ».",
      },
      {
        id: "agences",
        titre: "Faire le tour des chefs d'agence",
        cout: 1,
        nature: "utile",
        resultat:
          "Les artisans connaissent par cœur le prix de la BA13 standard : 3 % d'écart avec l'agence d'en face suffit à faire partir un chantier. Les plaques techniques (hydrofuges, phoniques, coupe-feu) et l'isolation se comparent beaucoup moins.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Philippe Arnaud, directeur des achats",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Philippe : « Ne réponds pas sur le chiffre, demande de quoi il est fait. Et ne va jamais en négociation sans une solution de repli que Placova puisse voir. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à Placova cette semaine ?",
    options: [
      {
        t: "Accepter la hausse pour préserver la relation",
        d: "Signer le nouveau tarif cette semaine. Placova reste notre partenaire, sans discussion.",
      },
      {
        t: "Demander la décomposition de la hausse et lancer un essai chez Brévent",
        d: "Pas de signature avant le détail. Un camion d'essai par semaine chez Brévent, 5 % des volumes.",
      },
      {
        t: "Basculer tout le volume de plaques chez Brévent dès la semaine 2",
        d: "9 % moins cher que le nouveau tarif, sur 70 % des achats de la famille.",
      },
      {
        t: "Ne pas répondre tout de suite et voir ce que font les autres négociants",
        d: "Les commandes partent au nouveau tarif en attendant.",
      },
    ],
    reactions: [
      [
        {
          ...PLACOVA,
          texte:
            "Merci pour votre confiance, Madame Marchal. Je savais qu'on pouvait compter sur Arvel.",
        },
      ],
      [
        {
          ...BREVENT,
          texte: "Le premier camion part mardi. Nous ferons tout pour être à la hauteur.",
        },
        {
          ...PLACOVA,
          texte:
            "La décomposition ? Je vous l'envoie, mais vous verrez : le marché est le même partout.",
        },
      ],
      [
        {
          ...AGENCE,
          texte:
            "Brévent a livré un camion sur cinq à l'heure. On a dépanné chez Placova en express, au tarif public.",
        },
      ],
      [
        {
          ...GESTION,
          texte: "Les factures arrivent au nouveau tarif. On attend combien de temps ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Placova vient négocier",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...PLACOVA,
        heure: "09:00",
        alerte: true,
        texte: ctx.essai
          ? "J'ai appris que des camions de Brévent déchargeaient chez vous. Je passe mardi : je suis prêt à discuter."
          : ctx.bascule
            ? "Vous avez transféré vos volumes chez Brévent. Je passe mardi : parlons-en avant que ce soit irréversible."
            : ctx.signe
              ? "Je passe mardi faire le point. Le tarif signé s'applique depuis lundi."
              : "Je passe mardi. Je vous rappelle que le nouveau tarif s'applique depuis lundi.",
      },
      {
        de: "Tableau de bord des achats",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Prix d'achat moyen des plaques en semaine 2 : ${ctx.hausse} au-dessus de l'ancien tarif. Livraisons conformes : ${ctx.conformes}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "gaz",
        titre: "Suivre l'indice du gaz industriel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'indice a encore perdu 4 % depuis l'annonce de Placova. Les contrats à terme le donnent en baisse d'un tiers d'ici décembre, avec une incertitude large : un incident ou un hiver froid peut tout inverser pendant quelques semaines.",
      },
      {
        id: "essai",
        titre: "Faire le point sur Brévent",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.essai
            ? "Le premier camion de Brévent est arrivé à l'heure, une palette sur quarante avec des angles écrasés. Placova le sait : son commercial a croisé le camion à Vénissieux."
            : ctx.bascule
              ? `Brévent ne suit pas : livraisons conformes ${ctx.conformes} cette semaine. Les agences dépannent chez Placova en express, au tarif public.`
              : "Brévent attend toujours une première commande. Sans essai, personne ne sait ce que valent ses livraisons, et Placova le sait aussi.",
      },
    ],
    question: "Que demandez-vous à Placova ?",
    options: [
      {
        t: "Couper la poire en deux : une hausse ferme, plus modérée",
        d: "Un chiffre unique pour le trimestre. Placova proposera le sien.",
      },
      {
        t: "Proposer une formule indexée : la part énergie suit l'indice du gaz, la part matières est ferme",
        d: "Rien pour les points sans justification. Le prix bougera chaque semaine avec le gaz, dans un sens ou dans l'autre.",
      },
      {
        t: "Poser un ultimatum : l'ancien tarif, ou les volumes partent chez Brévent",
        d: "Tout ou rien, réponse sous huit jours.",
      },
      {
        t: "Accepter les 12 % contre une remise de fin d'année de 2 %",
        d: "Versée en fin de trimestre, si Placova garde l'exclusivité des plaques.",
      },
    ],
    reactions: [
      [{ ...PLACOVA, texte: "Je fais remonter à la direction. Vous aurez notre chiffre lundi." }],
      null,
      null,
      [
        {
          ...PLACOVA,
          texte: "Marché conclu. Vous verrez, la remise compensera largement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les agences ne veulent pas augmenter",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...AGENCE,
        heure: "08:10",
        alerte: true,
        texte:
          "Les commerciaux ont vu passer la note sur les prix d'achat. Si on augmente la BA13, Ferrat récupère nos plaquistes dans la semaine. Laissez les prix de vente tels quels.",
      },
      {
        ...GESTION,
        heure: "11:30",
        texte: `Marge de la famille à fin de semaine 4 : ${ctx.marge}, pour ${ctx.budgetADate} au budget. Prix d'achat moyen des plaques : ${ctx.hausse} au-dessus de l'ancien tarif.`,
      },
    ],
    sources: [
      {
        id: "ferrat",
        titre: "Relever les prix des Comptoirs Ferrat dans trois agences",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ferrat n'a pas encore bougé. Sur la BA13 standard, nous sommes 1 % au-dessus d'eux ; sur les plaques hydrofuges et phoniques, 6 % en dessous. Leur acheteur a reçu la même lettre que nous : ils suivront, ou ils tiendront pour prendre des parts.",
      },
      {
        id: "panier",
        titre: "Regarder ce qu'achètent les plaquistes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La BA13 standard fait un peu plus de la moitié des volumes, et c'est le seul prix que les artisans comparent. Les références techniques, l'isolation et les accessoires se vendent au chantier, sans comparaison.",
      },
    ],
    question: "Que faites-vous des prix de vente ?",
    options: [
      {
        t: "Répercuter toute la hausse : +7 % sur toute la famille",
        d: "Dès la semaine 5. La marge par plaque est rétablie.",
      },
      {
        t: "Répercuter en partie : tenir le prix de la BA13, augmenter les références techniques et l'isolation",
        d: "+3 % en moyenne sur la famille, dès la semaine 5.",
      },
      {
        t: "Ne rien répercuter, comme le demandent les agences",
        d: "Les prix de vente ne bougent pas. La hausse reste dans notre marge.",
      },
    ],
    reactions: [
      null,
      null,
      [
        {
          ...AGENCE,
          texte: "Merci. Les commerciaux respirent, et les plaquistes ne sauront rien.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Combien confier à Brévent ?",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...BREVENT,
        heure: "10:20",
        alerte: true,
        texte: ctx.essai
          ? "Cinq semaines d'essai : nous sommes prêts à prendre une vraie part de vos plaques. Dites-nous combien."
          : ctx.bascule
            ? "Nous livrons vos plaques depuis un mois. Nous avons besoin de savoir si cela continue."
            : "Nous ne vous avons encore rien livré, mais nos prix tiennent : 9 % sous le nouveau tarif de Placova.",
      },
      {
        ...GESTION,
        heure: "14:00",
        texte: `Sur le papier, chaque point de volume passé chez Brévent fait gagner de la marge. Part de Brévent aujourd'hui : ${ctx.partBrevent}. Tu me dis combien on en met ?`,
      },
    ],
    sources: [
      {
        id: "livraisons",
        titre: "Faire le bilan des livraisons de Brévent",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.essai
            ? "Cinq camions d'essai : quatre à l'heure, un avec une journée de retard, une palette sur trente avec des réserves. Le cahier des charges a été précisé après le deuxième camion. Samia Ouali le confirme : au-delà de 25 à 30 000 € par semaine, l'usine ne suit plus."
            : ctx.bascule
              ? `Depuis la semaine 2, Brévent livre à peine la moitié de ce qu'on lui commande à l'heure. Les agences dépannent chez Placova en express, au tarif public plus 15 %. Livraisons conformes : ${ctx.conformes}.`
              : "Personne n'a encore reçu de plaque Brévent : ni délais, ni qualité, ni capacité ne sont connus. Un confrère parle de « débuts difficiles » : il faut quelques semaines pour caler les tournées.",
      },
      {
        id: "cout-complet",
        titre: "Calculer le coût complet d'une plaque",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Au prix facial, Brévent fait gagner 9 %. Mais une livraison en retard se dépanne chez Placova au tarif public plus l'express, près de 30 % au-dessus de l'ancien tarif, et une sur quatre n'est pas dépannée : le chantier part chez un concurrent. Une plaque en retard coûte plus que trois plaques achetées 9 % moins cher n'en rapportent.",
      },
    ],
    question: "Comment répartissez-vous les plaques à partir de la semaine 7 ?",
    options: [
      {
        t: "Confier 30 % des plaques à Brévent, le reste à Placova",
        d: "Deux fournisseurs, chacun dans ce qu'il sait faire.",
      },
      {
        t: "Confier toutes les plaques à Brévent",
        d: "Le prix le plus bas sur tout le volume.",
      },
      {
        t: "Tout garder chez Placova, ou y revenir",
        d: "Un seul fournisseur, des habitudes connues.",
      },
      {
        t: "Garder Brévent en dépannage, à 10 % des volumes",
        d: "Un pied dans la porte, sans risque.",
      },
    ],
    reactions: [
      [
        {
          ...BREVENT,
          texte: "C'est noté : 30 %, livrés le mardi et le jeudi. Nous savons tenir ce rythme.",
        },
      ],
      [
        {
          ...AGENCE,
          texte: "Tout chez Brévent ? On verra s'ils suivent. Moi, je garde le numéro de Placova.",
        },
      ],
      [
        {
          ...PLACOVA,
          texte: "Ravi de vous garder entièrement. Nos équipes sont à votre disposition.",
        },
      ],
      [
        {
          ...BREVENT,
          texte: "10 %, c'est peu, mais nous prenons. Prévenez-nous si vous voulez plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "Placova arrête un four",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...PLACOVA,
        heure: "08:05",
        alerte: true,
        texte:
          "Notre usine arrête une ligne pour maintenance en semaines 10 et 11. Nous livrerons nos clients au prorata, en servant d'abord nos partenaires : comptez sur environ deux tiers de vos volumes habituels.",
      },
      {
        ...AGENCE,
        heure: "09:30",
        texte: `Deux semaines sans assez de plaques, en pleine saison des doublages ? Volumes vendus la semaine dernière : ${ctx.volumes}. Il nous faut une solution avant vendredi.`,
      },
    ],
    sources: [
      {
        id: "capacite",
        titre: "Demander à Brévent ce qu'il peut livrer en plus",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.breventRode
            ? "Samia Ouali : « Vos tournées sont calées. Prévenus maintenant, nous ajoutons une équipe : environ 30 % de capacité en plus pendant deux semaines. »"
            : "Samia Ouali : « Nous pouvons essayer. Mais sans avoir jamais vraiment travaillé ensemble, il nous faudra une ou deux semaines pour caler les tournées, et nous livrerons peu la première. »",
      },
      {
        id: "stock",
        titre: "Chiffrer un stock de précaution",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux semaines de manque, c'est environ 35 000 € de plaques à acheter d'avance. Il faut louer un entrepôt à Corbas (3 000 €) et compter 5 % de casse et de manutention. Le coût est connu d'avance, et le manque est couvert.",
      },
    ],
    question: "Comment passez-vous l'arrêt de Placova ?",
    options: [
      {
        t: "Commander à Brévent le complément pendant l'arrêt",
        d: "Ce que Placova ne livre pas, au prix de Brévent.",
      },
      {
        t: "Constituer un stock de précaution cette semaine",
        d: "Deux semaines de manque achetées d'avance chez Placova. Entrepôt et casse : environ 6 000 €.",
      },
      {
        t: "Subir l'allocation en servant d'abord les artisans fidèles",
        d: "Aucune dépense. Les autres attendront.",
      },
      {
        t: "Dépanner chez des négociants confrères",
        d: "Au prix fort, 30 % au-dessus de l'ancien tarif, mais le manque est couvert.",
      },
    ],
    reactions: [
      [{ ...BREVENT, texte: "Commande reçue pour les semaines 10 et 11. Nous ferons au mieux." }],
      [{ ...GESTION, texte: "Entrepôt loué à Corbas. Le stock arrive jeudi." }],
      [
        {
          ...AGENCE,
          texte:
            "On fera avec. Mais les artisans qu'on fait attendre vont aller voir ailleurs, et certains ne reviendront pas.",
        },
      ],
      [
        {
          de: "Négoce Pradel",
          role: "Confrère, Bourgoin",
          texte: "Nous pouvons vous dépanner pendant deux semaines, au tarif que vous connaissez.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Les réserves du trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...GESTION,
        heure: "09:00",
        alerte: true,
        texte: `En rapprochant bons de livraison et factures : ${ctx.reclamable} de réserves (casse, plaques humides, retards) n'ont donné lieu à aucun avoir ce trimestre.`,
      },
      {
        ...PLACOVA,
        heure: "15:40",
        texte:
          "Nous préparons ensemble le contrat de l'an prochain. J'espère que nous finirons ce trimestre dans un bon climat.",
      },
    ],
    sources: [
      {
        id: "bons",
        titre: "Trier les bons de livraison avec réserves",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.reclamable} réclamables au total. Huit réserves sur dix sont signées par le chauffeur et photographiées : elles tiennent devant n'importe quel fournisseur. Le reste se discute.`,
      },
      {
        id: "conditions",
        titre: "Relire les conditions générales de Placova",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les réserves se réclament sous trente jours, preuves à l'appui. Une compensation sur facture sans accord écrit autorise Placova à suspendre les livraisons.",
      },
    ],
    question: "Que faites-vous des réserves ?",
    options: [
      {
        t: "Réclamer chaque avoir, bons de livraison et photos à l'appui",
        d: "Aux deux fournisseurs. Deux jours de travail pour l'équipe, environ 1 000 €.",
      },
      {
        t: "Demander un geste commercial global à Placova",
        d: "Un coup de téléphone, un montant rond.",
      },
      {
        t: "Laisser tomber pour ne pas tendre la relation",
        d: "Le contrat de l'an prochain se négocie dans un mois.",
      },
      {
        t: "Déduire d'office les réserves des prochaines factures",
        d: "Tout le montant, tout de suite, sans attendre leur accord.",
      },
    ],
    reactions: [
      [
        {
          ...PLACOVA,
          texte:
            "Les dossiers sont complets, nous n'avons rien à redire. Les avoirs partent en fin de mois.",
        },
      ],
      [
        {
          ...PLACOVA,
          texte: "Je vous propose un avoir forfaitaire. C'est ce que je peux faire sans dossier.",
        },
      ],
      [{ ...GESTION, texte: "Dommage : ce sont des euros qui ne reviendront pas." }],
      null,
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Décomposer, qualifier, indexer", chemin: [1, 1, 1, 0, 0, 0] },
  { nom: "Tout basculer chez le moins cher", chemin: [2, 2, 2, 1, 0, 3] },
  { nom: "Accepter et attendre", chemin: [3, 3, 2, 2, 2, 2] },
] as const;

/**
 * Les options qui cèdent pour ne pas fâcher, ou qui basculent tout d'un coup : [décision, option].
 * L'ultimatum (D2) n'y figure pas : c'est un pari, bon en moyenne mais très exposé dans les
 * mauvais tirages. Le bilan le juge défendable ; c'est sa robustesse qui le dit faible.
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 3],
  [2, 2],
  [3, 1],
  [5, 2],
] as const;

export const REPONSES = {
  compromis: (taux: string) =>
    `Après discussion avec la direction : ${taux} ferme pour le trimestre, applicable dès la semaine 3. C'est notre dernier mot.`,
  indexe:
    "D'accord pour la formule : 3 points de matières fermes, 7 points d'énergie qui suivent l'indice du gaz chaque semaine. Les 2 points d'ajustement tombent.",
  refus:
    "Une formule indexée ? Ce n'est pas notre politique. Le tarif reste à +12 %, comme pour tous nos clients.",
  cede: "Je ne veux pas perdre Arvel. Nous revenons à +7 %, ferme pour le trimestre. N'en parlons plus.",
  rompu:
    "Nous ne travaillons pas sous la menace. Le tarif reste à +12 %, et nous retirons votre remise de fidélité d'un point. Vous n'êtes plus prioritaires.",
  ferratTient: {
    plein:
      "Ferrat n'a pas bougé. Trois plaquistes sont passés chez eux cette semaine, et ils ne reviendront pas pour un point.",
    partiel:
      "Ferrat n'a pas bougé, mais la BA13 est au même prix chez nous : les plaquistes n'ont rien vu.",
  },
  ferratSuit: {
    plein:
      "Ferrat a augmenté de 4 % lundi. Nous restons les plus chers, mais l'écart ne fait partir que les plus attentifs.",
    partiel:
      "Ferrat a augmenté de 4 % lundi. Pour une fois, c'est nous qui sommes les moins chers sur la BA13.",
  },
  bloque:
    "Vous vous êtes payée sur nos factures sans accord. Nous suspendons vos livraisons jusqu'à régularisation.",
  accepte:
    "Nous prenons acte. Ce n'est pas la manière, mais les réserves sont fondées : nous n'y reviendrons pas.",
  vallet:
    "Trois chantiers livrés en retard ce trimestre, dont un avec des plaques cassées. Je passe mes commandes de plaques chez Ferrat jusqu'à nouvel ordre.",
} as const;
