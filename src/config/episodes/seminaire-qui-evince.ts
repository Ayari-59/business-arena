/**
 * LE SÉMINAIRE QUI CHASSE LES CLIENTS — le contenu de l'épisode.
 *
 * Anton Leclercq est responsable des ventes groupes et séminaires d'Escale
 * Événements, basé à L'Escale Évian. De mai à juillet, les demandes de
 * groupes arrivent pour l'été, quand l'hôtel se remplit aussi de clients
 * individuels. Six décisions, chacune précédée de ce qu'un vendeur de
 * groupes reçoit vraiment : une agence qui veut sa réponse avant vendredi,
 * une directrice qui veut un hôtel plein, une revenue manager qui regarde le
 * pick-up, un chef qui compte ses extras, des clients qui réservent plus de
 * chambres qu'ils n'en occuperont.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la prévision d'occupation, la marge d'une nuitée et
 * d'un couvert, les individuels qu'un bloc évince, ce que vaut la série de
 * Tavenne selon l'été, le prix de déplacement des demandes de juillet.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

export const ALIENOR = { de: "Aliénor Duchosal", role: "Directrice de L'Escale Évian" } as const;
export const COSIMA = {
  de: "Cosima Marmier",
  role: "Chargée de compte, agence Lacustra Événements",
} as const;
export const LUCILE = { de: "Lucile Fabbri", role: "Revenue manager du Groupe Escale" } as const;
export const TSIORY = {
  de: "Tsiory Rakotobe",
  role: "Directrice des événements, Maison Mélizane",
} as const;
export const OSKAR = {
  de: "Oskar Lindqvist",
  role: "Responsable des groupes, Tavenne Voyages",
} as const;
export const JORDI = {
  de: "Jordi Puigvert",
  role: "Chef de cuisine, Table d'Augustin d'Évian",
} as const;
export const LEONIE = { de: "Léonie Combaz", role: "Cheffe de réception" } as const;
export const CYRIAQUE = { de: "Cyriaque Mabboux", role: "Juriste du Groupe Escale" } as const;
export const ZUZANA = {
  de: "Zuzana Holub",
  role: "Assistante commerciale, Escale Événements",
} as const;

/** Le séminaire d'Orvandel est-il signé chez nous, à la fin de la semaine lue ? */
const seminaireSigne = (ctx: Contexte) =>
  ctx.seminaire === "juin" ||
  ctx.seminaire === "mai" ||
  ctx.seminaire === "juinPrixPlein" ||
  ctx.seminaire === "partenaire";
/** La convention Mélizane se tient-elle chez nous ? */
const conventionSignee = (ctx: Contexte) =>
  ctx.convention === "complete" || ctx.convention === "reduite" || ctx.convention === "sansGala";

export const DIAGNOSTICS = [
  {
    id: "deplacement",
    t: "Un groupe se juge sur sa contribution totale — chambres, salles, restauration — moins celle des clients individuels qu'il évince : en juin, le séminaire chasse presque autant qu'il rapporte, et ses chambres vides ne seront pas revendues sans clauses",
  },
  {
    id: "attrition",
    t: "Le vrai risque du séminaire, ce sont les chambres qu'il réservera sans les occuper : avec des clauses d'attrition et une date limite de libération, il peut se signer tel quel",
  },
  {
    id: "remplissage",
    t: "Cinquante-cinq chambres garanties trois nuits, c'est l'occupation de juin assurée face à une demande individuelle incertaine : il faut le signer avant le Palais Ombrelle",
  },
  {
    id: "prix",
    t: "158 € la chambre en juin, c'est 74 € sous le prix moyen : un groupe sous le prix moyen se refuse",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Cinquante-cinq chambres en juin",
    jusqua: 1,
    messages: () => [
      {
        ...ALIENOR,
        heure: "08:05",
        alerte: true,
        texte:
          "Anton, Lacustra attend notre réponse pour le séminaire des Laboratoires Orvandel avant vendredi : 55 chambres du 16 au 18 juin, trois jours de salles, des dîners. Le siège nous attend sur le remplissage de juin. Un séminaire comme celui-là ne se refuse pas.",
      },
      {
        ...COSIMA,
        heure: "09:20",
        texte:
          "Bonjour Anton, je vous confirme la demande d'Orvandel : 55 chambres du mardi 16 au jeudi 18 juin, 60 participants, journées d'étude à 65 € par participant et dîners de groupe à 45 €. Budget hébergement : 158 € la chambre, notre commission de 10 % sur l'hébergement selon nos conditions habituelles. J'ai une option au Palais Ombrelle, à Thonon ; je préférerais Évian.",
      },
      {
        ...LUCILE,
        heure: "11:40",
        texte:
          "Anton, avant de bloquer quoi que ce soit en juin, regarde la prévision d'occupation. Et le pick-up de l'été est en retard sur l'an dernier : je ne sais pas encore dire si les clients réservent plus tard ou s'ils viendront moins.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "prevision",
        titre: "Lire la prévision d'occupation dans Hostéo",
        cout: 1,
        nature: "decisive",
        resultat:
          "Demande individuelle attendue, sans groupe, sur les 66 chambres : 58 chambres le mardi 16 juin, 61 le mercredi 17, 57 le jeudi 18, à 232 € de prix moyen. Fin mai, du mardi 26 au jeudi 28, la semaine qui suit la Pentecôte : 30, 34 et 31 chambres seulement, à 178 €. 45 % des nuitées individuelles passent par Bookalia et Voyagio, à 17 % de commission. Le pick-up de l'été est en retard de 9 % sur l'an dernier : Lucile donne à peu près trois chances sur dix à un été plus fort que la prévision, quatre sur dix à un été conforme, trois sur dix à un été plus mou.",
      },
      {
        id: "marges",
        titre: "Demander au contrôle de gestion ce que rapportent une nuitée et un couvert",
        cout: 1,
        nature: "decisive",
        resultat:
          "Une nuitée occupée coûte 30 € : linge de la Blanchisserie du Fier, produits d'accueil, énergie, ménage à la tâche. 45 % des chambres individuelles dînent à la Table d'Augustin, à deux couverts en moyenne, pour un ticket moyen de 42 € ; la restauration garde 65 % de marge sur coût variable (ratio matière de 30 %, 5 % d'autres coûts variables). Journées d'étude et dîners de groupe gardent 60 %. Les clients d'un séminaire dînent en salle : ils ne prennent pas de place à la Table.",
      },
      {
        id: "historique",
        titre: "Relire les séminaires de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les séminaires de laboratoires ont occupé en moyenne 78 % de leur bloc. Les chambres rendues à J-7 ne se sont revendues qu'une fois sur cinq ; celles rendues trois semaines avant, 85 fois sur 100. Orvandel a tenu son séminaire de l'an dernier fin mai, à L'Escale Lac : ses dates ne sont pas gravées dans le marbre. Et Lacustra y avait signé une date limite de libération et une clause d'attrition.",
      },
      {
        id: "classement",
        titre: "Lire le classement des ventes groupes du Groupe Escale",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Escale Événements a fait 14 % de chiffre d'affaires groupes de plus l'an dernier. L'Escale Évian est troisième sur les trois hôtels à salles pour les nuitées de groupe de juin. Le classement compte les chambres vendues, pas ce qu'elles laissent.",
      },
      {
        id: "conseil",
        titre: "Appeler Hyacinthe Baud, ancienne directrice commerciale du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Hyacinthe Baud : « Un groupe ne se juge pas à ce qu'il remplit, mais à ce qu'il laisse une fois payés les clients qu'il chasse. Fais le calcul nuit par nuit, avec les dîners. Et ne signe jamais un bloc sans dire quand les chambres reviennent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à Lacustra ?",
    options: [
      {
        t: "Accepter les dates de juin au prix demandé : 55 chambres trois nuits, l'hôtel est plein",
        d: "158 € la chambre, journées d'étude et dîners. Signature cette semaine.",
      },
      {
        t: "Proposer fin mai au même prix, du 26 au 28, ou les dates de juin à 228 €, un prix qui couvre les clients évincés même si le séminaire n'occupe que les trois quarts de son bloc",
        d: "Orvandel choisira : fin mai, juin plus cher, ou le Palais Ombrelle.",
      },
      {
        t: "Garder juin au prix demandé, mais limiter le bloc à 30 chambres : les autres participants à l'hôtel partenaire de Thonon, salles et dîners chez nous",
        d: "Des navettes à la charge du client. Lacustra peut accepter, ou partir à Thonon.",
      },
      {
        t: "Décliner : juin se vendra aux clients individuels",
        d: "Rien n'est bloqué. Orvandel ira au Palais Ombrelle.",
      },
    ],
    reactions: [
      [
        {
          ...COSIMA,
          texte:
            "Merci Anton, Orvandel est ravi : 55 chambres du 16 au 18 juin. Je vous envoie notre contrat type dès demain.",
        },
      ],
      null,
      null,
      [
        {
          ...COSIMA,
          texte:
            "Dommage. Nous confirmons l'option du Palais Ombrelle. À une prochaine fois, j'espère.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · mardi",
    titre: "Le contrat",
    jusqua: 3,
    messages: (ctx) => [
      seminaireSigne(ctx)
        ? {
            ...COSIMA,
            heure: "09:10",
            alerte: true,
            texte: `Anton, voici notre contrat type pour Orvandel, ${ctx.datesSeminaire} : acompte de 10 %, chambres rendues sans frais jusqu'à J-7, pas de clause d'attrition. C'est ce que signent tous nos hôtels.`,
          }
        : {
            ...ALIENOR,
            heure: "09:10",
            alerte: true,
            texte:
              "Orvandel est parti au Palais Ombrelle. D'autres demandes vont arriver pour juillet : je veux savoir à quelles conditions tu signes les groupes cet été.",
          },
      {
        ...CYRIAQUE,
        heure: "11:30",
        texte:
          "Nos conditions de vente groupes datent de 2019 : elles ne prévoient ni date limite de libération des chambres, ni clause d'attrition, et l'acompte est de 10 %. Dis-moi ce que tu veux pour la saison, je rédige.",
      },
      ...(seminaireSigne(ctx)
        ? [
            {
              ...ALIENOR,
              heure: "14:45",
              texte: "Signe vite, Anton. Je ne veux pas que Lacustra nous lâche pour une clause.",
            },
          ]
        : []),
    ],
    reevaluation: true,
    sources: [
      {
        id: "clauses",
        titre: "Chiffrer ce que chaque clause protège",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un séminaire occupe en moyenne 78 % de son bloc : la moitié des chambres qu'il ne prendra pas se sait trois semaines avant, le reste dans la dernière semaine. Rendue à J-7, une chambre se revend une fois sur cinq ; à J-21, 85 fois sur 100. Une date limite de libération à J-21 remet en vente à temps ce que le client sait déjà ; une clause d'attrition tolère 10 % du bloc et fait payer 80 % du prix des chambres rendues au-delà ; un acompte de 30 % reste acquis si le groupe annule, ce qui arrive un peu plus d'une fois sur dix.${
            seminaireSigne(ctx) && ctx.seminaire !== "partenaire"
              ? ` Pour Orvandel, ${ctx.datesSeminaire}, c'est une douzaine de chambres vides par nuit à prévoir.`
              : ""
          }`,
      },
      {
        id: "acceptation",
        titre: "Demander aux clients ce qu'ils acceptent",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cosima Marmier : « Une date limite à J-21 et une attrition à 10 %, nous l'avons signé au Lac l'an dernier. Une garantie à 100 % des chambres, nos clients la refusent presque une fois sur deux : ils vont voir ailleurs. » Les entreprises et les voyagistes qui réservent en direct la refusent un peu plus d'une fois sur trois.",
      },
    ],
    question: "À quelles conditions signez-vous les groupes du trimestre ?",
    options: [
      {
        t: "Signer le contrat type de l'agence, et le garder pour les groupes de la saison",
        d: "Acompte de 10 %, chambres rendues sans frais jusqu'à J-7, pas d'attrition. Personne ne se fâche.",
      },
      {
        t: "Négocier trois clauses : date limite de libération à J-21, attrition tolérée à 10 % puis facturée à 80 %, acompte de 30 %",
        d: "Pour Orvandel et les groupes à venir. Quelques jours de négociation avec chaque client.",
      },
      {
        t: "Exiger la garantie totale : toutes les chambres dues, vides ou non, et 50 % d'acompte",
        d: "Aucune chambre vide ne coûte plus rien à l'hôtel. Certains clients iront voir ailleurs.",
      },
    ],
    reactions: [
      [
        {
          ...CYRIAQUE,
          texte:
            "C'est noté : les groupes de la saison signeront nos conditions habituelles, celles du contrat type.",
        },
      ],
      [
        {
          ...CYRIAQUE,
          texte:
            "Je rédige les trois clauses : date limite de libération à J-21, attrition à 10 %, acompte de 30 %. Elles iront dans chaque contrat de groupe de la saison.",
        },
      ],
      [
        {
          ...CYRIAQUE,
          texte:
            "C'est noté : garantie totale et 50 % d'acompte dans chaque contrat de groupe de la saison. Attends-toi à des discussions.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · mardi",
    titre: "La convention Mélizane",
    jusqua: 4,
    messages: () => [
      {
        ...TSIORY,
        heure: "09:00",
        alerte: true,
        texte:
          "Monsieur Leclercq, la Maison Mélizane réunit ses conseillères de vente du lundi 6 au jeudi 9 juillet : 30 chambres trois nuits pour 35 participants, la salle plénière le mardi et le mercredi, et un dîner de gala de 140 couverts le mercredi soir, nos meilleures clientes invitées. Notre budget : 145 € la chambre, 2 800 € la salle par jour, 40 € par participant pour les pauses et le déjeuner, 89 € le couvert du gala, vins compris.",
      },
      {
        ...ALIENOR,
        heure: "10:15",
        texte:
          "145 € la chambre en juillet, Anton ? Notre prix moyen est à 258 €. On ne brade pas juillet.",
      },
      {
        ...JORDI,
        heure: "11:50",
        texte:
          "Un gala de 140 couverts, je sais faire : il me faut six extras pour le service. Mais ce soir-là, la Table d'Augustin est fermée au public.",
      },
    ],
    sources: [
      {
        id: "chiffrage",
        titre: "Chiffrer la convention ligne par ligne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les 6, 7 et 8 juillet, la prévision est de 58, 60 et 62 chambres individuelles, à 258 € de prix moyen : avec 30 chambres de groupe, la convention en évincerait 22, 24 et 26, soit ${ctx.deplacementConvention} de marge, dîners compris. Ses 30 chambres rapporteraient ${ctx.chambresConvention} (145 €, 30 € de coût variable, pas de commission : Mélizane réserve en direct). La salle plénière garde 90 % de son prix, les pauses et déjeuners 60 %. Le gala : 32 % de ratio matière, 5 % d'autres coûts variables, et six extras à 190 € la soirée.`,
      },
      {
        id: "privatisation",
        titre: "Demander à Jordi Puigvert ce que coûte de fermer la Table",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Jordi Puigvert : « Un mercredi de juillet, je sers une quarantaine de couverts à des clients de l'extérieur, plus les clients de l'hôtel qui dînent chez nous. Fermer la Table pour le gala, c'est perdre ces dîners-là : ${ctx.privatisation} de marge environ. Le gala, lui, je le tiens avec ma brigade et six extras. »`,
      },
      {
        id: "concurrents",
        titre: "Relever les prix des hôtels concurrents en juillet",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le Palais Ombrelle affiche 265 € en juillet ; les deux autres quatre-étoiles d'Évian, 240 et 290 €. À 145 €, Mélizane paierait 44 % de moins que notre prix moyen de juillet.",
      },
    ],
    question: "Que répondez-vous à la Maison Mélizane ?",
    options: [
      {
        t: "Refuser : 145 € la chambre en juillet, c'est 113 € sous notre prix moyen",
        d: "Juillet reste aux individuels, et la Table reste ouverte au public.",
      },
      {
        t: "Accepter la convention entière : chambres, salle et dîner de gala",
        d: "Trente chambres trois nuits, la salle deux jours, la Table privatisée le mercredi soir avec six extras.",
      },
      {
        t: "Prendre la salle et le gala, mais limiter le bloc à 15 chambres, les autres à l'hôtel partenaire",
        d: "Moins de chambres prises aux individuels. Mélizane peut accepter, ou tout emmener ailleurs.",
      },
      {
        t: "Accepter les chambres et la salle, sans le gala : la Table reste ouverte au public",
        d: "Mélizane organisera son dîner dans un restaurant du bord du lac.",
      },
    ],
    reactions: [
      [
        {
          ...TSIORY,
          texte: "Je comprends. Nous irons à Montreux, qui nous fait une offre pour tout.",
        },
      ],
      [
        {
          ...TSIORY,
          texte:
            "Parfait. Nous signons la semaine prochaine : trente chambres, la salle et le gala du mercredi.",
        },
      ],
      null,
      [
        {
          ...TSIORY,
          texte:
            "Entendu : les chambres et la salle chez vous, le gala dans un restaurant du bord du lac.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "La série de Tavenne",
    jusqua: 6,
    messages: () => [
      {
        ...OSKAR,
        heure: "09:30",
        alerte: true,
        texte:
          "Monsieur Leclercq, nous programmons nos circuits « Lac et montagnes » cet été : 24 chambres chaque nuit du jeudi 9 au mercredi 29 juillet, en demi-pension, à 175 € la chambre. Cinq cent quatre nuitées. Il me faut votre réponse avant mercredi : un hôtel de Thonon me fait une offre.",
      },
      {
        ...ALIENOR,
        heure: "10:40",
        texte:
          "Cinq cents nuitées en juillet, Anton ! Avec le retard du pick-up, je préfère les avoir dans la poche.",
      },
      {
        ...LUCILE,
        heure: "12:15",
        texte:
          "Le pick-up de juillet est toujours en retard. Je peux te dire si c'est un report ou une baisse : il me faut deux jours, et 600 € de données de marché.",
      },
    ],
    sources: [
      {
        id: "pickup",
        titre: "Demander à Lucile ce que vaut la série selon l'été",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Lucile Fabbri : « À la prévision, la série évincerait des clients individuels presque chaque nuit de juillet. Tout compris, dîners et commissions, elle rapporterait ${ctx.serieMou} si l'été est mou ; elle en coûterait ${ctx.serieConforme} s'il est conforme, et ${ctx.serieFort} s'il est fort. En deux jours, je lis la fenêtre de réservation et le pick-up par canal : quand la demande baisse vraiment, je le vois neuf fois sur dix ; quand l'été est conforme, je conclus à tort à une baisse un peu moins d'une fois sur six ; quand il est fort, une fois sur vingt. » Tavenne n'attendra pas forcément : une fois sur dix, il signera à Thonon.`,
      },
      {
        id: "tavenne",
        titre: "Se renseigner sur Tavenne Voyages",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Tavenne remplit ses séries à 95 % et paie à trente jours : un client fiable. Ses voyageurs, 45 par soir, dînent à l'hôtel au menu de groupe (32 €, 60 % de marge). L'Escale Lac travaille avec lui depuis trois ans ; il y a signé une date limite de libération à J-21.",
      },
    ],
    question: "Que répondez-vous à Tavenne ?",
    options: [
      {
        t: "Signer la série tout de suite : cinq cents nuitées garanties, c'est juillet assuré",
        d: "175 € la chambre, demi-pension. Tavenne a sa réponse aujourd'hui.",
      },
      {
        t: "Faire lire le pick-up de juillet par Lucile, et ne signer que si la demande baisse vraiment",
        d: "Deux jours et 600 € de données de marché ; Tavenne attendra, ou pas.",
      },
      {
        t: "Refuser : juillet se vend aux clients individuels",
        d: "Rien n'est bloqué en juillet.",
      },
    ],
    reactions: [
      [
        {
          ...OSKAR,
          texte:
            "Merci, Monsieur Leclercq. Je confirme la série par écrit ce soir : 24 chambres du 9 au 29 juillet.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "Je m'y mets. Tu auras ma conclusion mercredi matin ; préviens Tavenne qu'il aura sa réponse mercredi.",
        },
      ],
      [
        {
          ...OSKAR,
          texte: "C'est noté. Nous signerons à Thonon.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Mélizane se réorganise",
    jusqua: 8,
    messages: (ctx) =>
      conventionSignee(ctx)
        ? [
            {
              ...TSIORY,
              heure: "09:15",
              alerte: true,
              texte: ctx.peuDeLiberees
                ? "Monsieur Leclercq, la Maison Mélizane a annoncé hier une réorganisation de son réseau de vente : une partie de nos conseillères ne viendra pas en juillet. Les quinze chambres que vous nous gardez seront presque toutes occupées ; le gala, lui, sera moins nombreux."
                : `Monsieur Leclercq, la Maison Mélizane a annoncé hier une réorganisation de son réseau de vente : une partie de nos conseillères ne viendra pas en juillet. Je vous ai confirmé mes chambres lundi ; il en faudra ${ctx.liberees} de moins. Notre liste nominative ne sera prête que la semaine du 29 juin.`,
            },
            {
              ...ALIENOR,
              heure: "10:30",
              texte:
                "Le contrat est signé, Anton. Ce sont leurs chambres, ils les ont réservées : on ne touche à rien.",
            },
            {
              ...LEONIE,
              heure: "16:20",
              texte:
                "Pour le 6, le 7 et le 8 juillet, on refuse déjà des clients individuels sur Bookalia et Voyagio : l'hôtel est affiché complet.",
            },
          ]
        : [
            {
              ...ALIENOR,
              heure: "09:15",
              alerte: true,
              texte:
                "Mélizane a fait sa convention ailleurs, et on me dit qu'elle vient de rendre la moitié de ses chambres : une réorganisation de son réseau. Les groupes réservent toujours plus qu'ils n'occupent. Qu'est-ce qu'on fait quand ça nous arrive ?",
            },
            {
              ...LEONIE,
              heure: "16:20",
              texte:
                "En juillet, on refuse déjà des clients individuels sur Bookalia et Voyagio certains soirs : l'hôtel est affiché complet.",
            },
          ],
    sources: [
      {
        id: "revente",
        titre: "Mesurer ce que rapportent les chambres rendues, selon la date",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Rendue aujourd'hui, à J-17, une chambre de juillet se revend 85 fois sur 100 ; à J-10, six fois sur dix ; à J-7, une fois sur cinq. Une nuitée individuelle de juillet rapporte ${ctx.valeurJuillet} de marge, dîner compris. ${
            ctx.conditions === 0
              ? "Nos conditions de la saison ne prévoient ni attrition ni date limite : un groupe peut rendre ses chambres sans frais jusqu'à J-7."
              : ctx.conditions === 1
                ? "Notre clause d'attrition tolère 10 % du bloc ; au-delà, le groupe paie 80 % du prix, 116 € la nuit pour une chambre à 145 €, mais la chambre reste vide."
                : "La garantie totale fait payer au groupe toutes ses chambres, vides ou non : 145 € la nuit chez Mélizane, mais la chambre reste vide."
          }`,
      },
      {
        id: "appel",
        titre: "Appeler Tsiory Rakotobe",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          conventionSignee(ctx)
            ? "Tsiory Rakotobe confirme : la réorganisation est votée, les chiffres ne bougeront plus guère. « Si vous reprenez ces chambres maintenant, je n'aurai pas à les payer, et vous les revendrez. La liste, je ne l'aurai pas avant dix jours. »"
            : "Tsiory Rakotobe : « Nous avons rendu nos chambres à l'hôtel de Montreux : il nous les a reprises tout de suite, et les a revendues. »",
      },
    ],
    question: "Quand un groupe annonce des chambres libres, que faites-vous ?",
    options: [
      {
        t: "Tenir le bloc : le contrat est signé, le groupe rendra ses chambres à la date prévue",
        d: "Rien ne change avant la liste nominative.",
      },
      {
        t: "Reprendre tout de suite les chambres libérées et les remettre en vente, en confirmant le reste par écrit",
        d: "Les chambres repartent sur Bookalia, Voyagio et le site dès lundi. Le groupe ne les paie plus.",
      },
      {
        t: "Demander la liste nominative sous huit jours, puis remettre en vente ce qui n'y est pas",
        d: "Une semaine de plus pour être sûr du nombre.",
      },
    ],
    reactions: [
      [
        {
          ...LEONIE,
          texte:
            "C'est noté : on ne touche pas aux blocs de groupe avant la date prévue au contrat.",
        },
      ],
      [
        {
          ...LEONIE,
          texte:
            "C'est noté : dès qu'un groupe annonce des chambres libres, je les remets en vente le jour même.",
        },
      ],
      [
        {
          ...LEONIE,
          texte:
            "C'est noté : on attend les listes nominatives avant de rouvrir les chambres à la vente.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les groupes de fin juillet",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ALIENOR,
        heure: "08:45",
        alerte: true,
        texte: `${ctx.ete ? `${ctx.ete} ` : ""}Cinq demandes de groupes sont arrivées cette semaine pour la fin juillet. Réponds-leur avant lundi : ce sont des clients qui reviennent.`,
      },
      {
        ...ZUZANA,
        heure: "09:30",
        texte:
          "Les cinq demandes : un club de cyclotourisme, 18 chambres les 12 et 13 juillet à 150 € ; le comité de direction d'une PME genevoise, 12 chambres les 21 et 22 à 190 €, avec une journée de salle ; une chorale, 25 chambres les 24 et 25 à 140 € ; des golfeurs, 16 chambres les 26 et 27 à 160 € ; une entreprise lyonnaise, 28 chambres les 29 et 30 à 150 €. Tous dînent à l'hôtel.",
      },
    ],
    sources: [
      {
        id: "planchers",
        titre: "Calculer le prix de déplacement de chaque demande",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le prix de déplacement d'une demande est le prix chambre qui couvre, avec ses dîners et sa salle, les clients individuels qu'elle évincerait à la prévision${
            ctx.serieSignee ? ", la série de Tavenne comprise" : ""
          } : ${ctx.planchers}. Au-dessus, le groupe rapporte plus que les individuels qu'il chasse ; en dessous, il coûte. Un groupe à qui l'on propose plus que ce qu'il offrait accepte à peu près une fois sur quatre.`,
      },
      {
        id: "grille",
        titre: "Lire la proposition de l'équipe commerciale",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "L'équipe propose une grille unique à 150 € la chambre pour tous les groupes de l'été : simple, lisible, « et on remplit les creux ». Elle a fait le calcul sur le taux d'occupation de juillet, qui gagnerait quelques points.",
      },
    ],
    question: "Comment répondez-vous aux groupes de fin juillet ?",
    options: [
      {
        t: "Appliquer la grille unique : 150 € la chambre, on prend tout ce qui se présente",
        d: "Cinq groupes signés en une semaine.",
      },
      {
        t: "Coter chaque demande à son prix de déplacement : accepter au prix proposé quand il le couvre, proposer le plancher sinon",
        d: "Certains groupes paieront plus, d'autres iront ailleurs.",
      },
      {
        t: "Fermer les groupes jusqu'à la fin de l'été",
        d: "Les cinq demandes sont déclinées ; juillet reste aux individuels.",
      },
    ],
    reactions: [
      [
        {
          ...ZUZANA,
          texte: "Les cinq contrats partent ce soir, à 150 € la chambre.",
        },
      ],
      [
        {
          ...ZUZANA,
          texte:
            "Les cotations partent ce soir, demande par demande. J'aurai les réponses la semaine prochaine.",
        },
      ],
      [
        {
          ...ZUZANA,
          texte: "Les cinq demandes sont déclinées, avec nos regrets et nos dates de septembre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Juger chaque groupe sur sa contribution nette", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Remplir l'hôtel", chemin: [0, 0, 1, 0, 0, 0] },
  { nom: "Laisser l'été aux individuels", chemin: [3, 0, 0, 2, 0, 2] },
] as const;

/**
 * Les réflexes du vendeur de groupes : juger un groupe sur ce qu'il remplit
 * (signer le séminaire de juin au prix demandé, la série tout de suite, la
 * grille unique), ou sur son seul prix chambre (refuser Mélizane) ; signer le
 * contrat de l'agence pour ne fâcher personne ; tenir un bloc que le client
 * annonce vide. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  seminaireMai:
    "Bonne nouvelle : Orvandel prend fin mai, du 26 au 28, au même prix. Leur directeur médical préfère même : le congrès européen tombe en juin.",
  seminaireJuin:
    "Orvandel tient à ses dates de juin : il accepte vos 228 €, en grinçant. Je vous envoie le contrat.",
  seminaireAilleurs:
    "Orvandel ne bouge ni ses dates ni son budget. Nous confirmons l'option du Palais Ombrelle, désolée.",
  partenaire:
    "Orvandel accepte : 30 chambres chez vous, les autres participants à Thonon, avec une navette matin et soir.",
  partenaireRefus:
    "Deux hôtels et des navettes, Orvandel n'en veut pas. Nous confirmons l'option du Palais Ombrelle.",
  garantieRefus:
    "Une garantie totale, Orvandel ne la signera pas : l'an dernier, il a dû rendre un quart de ses chambres. Nous passons au Palais Ombrelle.",
  annulation:
    "Mauvaise nouvelle, Anton : Orvandel reporte son séminaire à l'automne, le congrès a changé de date. L'acompte reste acquis selon le contrat.",
  reduitAccepte:
    "Va pour 15 chambres chez vous et le reste à l'hôtel partenaire : la salle et le gala restent à Évian.",
  reduitRefuse:
    "Deux hôtels pour une convention, ce n'est pas possible pour nous. Nous emmenons tout à Montreux.",
  conventionGarantie:
    "J'ai reçu votre contrat : une garantie totale sur trente chambres, notre direction refuse. Nous emmenons la convention à Montreux.",
  serieGarantie:
    "J'ai reçu votre contrat : une garantie totale sur une série, aucun voyagiste ne la signe. Nous signons à Thonon.",
  analyseBaisse:
    "Ma conclusion : la fenêtre de réservation ne raccourcit pas, la demande de juillet baisse vraiment. La série remplira des chambres qui resteraient vides.",
  analyseReport:
    "Ma conclusion : les clients réservent plus tard, mais ils viennent. Juillet se remplira en individuels ; la série prendrait leur place.",
  tavenneSigne: "Merci pour votre attente : nous signons la série, 24 chambres du 9 au 29 juillet.",
  tavenneRefuse: "C'est noté, nous signons à Thonon. Je garde votre contact pour l'automne.",
  tavennePart: "Je ne pouvais pas attendre davantage : nous avons signé à Thonon hier soir.",
  ete: [
    "Le revenue management fait le point : juin a été plus fort que la prévision, et juillet s'annonce de même. Les clients réservaient simplement plus tard.",
    "Le revenue management fait le point : juin s'est fini conforme à la prévision, et juillet s'annonce de même. Le retard du pick-up s'est rattrapé.",
    "Le revenue management fait le point : juin a fini sous la prévision, et juillet s'annonce plus mou : la demande individuelle a bel et bien baissé.",
  ],
} as const;
