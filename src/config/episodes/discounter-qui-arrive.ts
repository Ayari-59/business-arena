/**
 * LE DISCOUNTER QUI ARRIVE — le contenu de l'épisode.
 *
 * Faustine Montagnac dirige la région Rhône d'Arvel Distribution : huit
 * agences autour de Lyon. Tarval, une enseigne de négoce en libre-service,
 * ouvre deux dépôts à Vénissieux et à Saint-Priest en semaine 3, avec des prix
 * 12 % sous les siens au comptoir et 15 % sous eux à la palette. Le comité
 * veut une riposte ; le directeur commercial veut s'aligner partout. Six
 * décisions, chacune précédée de ce qu'une directrice régionale reçoit
 * vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les ventes par type de client, la baisse qui ramène
 * l'écart à 4 %, ce que rapporterait la remise du fabricant, ce que coûte de
 * suivre la promotion de Tarval, ce que la riposte paie à ceux qui ne
 * partiraient pas.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, enseignes, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const TANCREDE = { de: "Tancrède Treffort", role: "Président d'Arvel Distribution" } as const;
const LEANDRE = { de: "Léandre Pélardy", role: "Directeur commercial régional" } as const;
const NESRINE = { de: "Nesrine Bekkali", role: "Contrôleuse de gestion régionale" } as const;
const HONORINE = { de: "Honorine Arnaudet", role: "Directrice financière du groupe" } as const;
const FULVIO = { de: "Fulvio Ranieri", role: "Chef de l'agence de Vénissieux" } as const;
const MAHAUT = { de: "Mahaut Lescure", role: "Cheffe de l'agence de Villefranche" } as const;
const ZELIE = { de: "Zélie Fouquereau", role: "Responsable transport de la région" } as const;
const THADDEE = {
  de: "Thaddée Bercheny",
  role: "Directeur commercial, Plâtres Bercheny",
} as const;

const s = (ctx: Contexte, cle: string) => String(ctx[cle] ?? "");

export const DIAGNOSTICS = [
  {
    id: "exposition",
    t: "Tarval ne prend que ce qui se compare et s'enlève : il faut protéger les clients exposés, sur les références qu'ils comparent, sans brader le reste, et renforcer ce que Tarval ne sait pas faire",
  },
  {
    id: "service",
    t: "On ne gagne pas une guerre des prix contre huit points de frais de moins : il faut se battre sur le service — livraison, crédit, conseil — et laisser le prix à Tarval",
  },
  {
    id: "prix",
    t: "Tarval va prendre nos clients par le prix : il faut s'aligner sur toute la gamme de base pour ne perdre personne",
  },
  {
    id: "fidelite",
    t: "Nos clients achètent du service et nous sont fidèles ; Tarval n'a que deux dépôts : inutile de bouger avant d'avoir vu les premiers chiffres",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Tarval ouvre dans quinze jours",
    jusqua: 2,
    messages: () => [
      {
        ...TANCREDE,
        heure: "08:05",
        alerte: true,
        texte:
          "Faustine, Tarval ouvre ses dépôts de Vénissieux et de Saint-Priest le lundi de la semaine 3, avec des prix 10 à 15 % sous les nôtres. Le comité veut ta riposte vendredi. Je ne veux pas apprendre par la presse qu'on a perdu nos clients.",
      },
      {
        ...LEANDRE,
        heure: "09:10",
        texte:
          "Il faut s'aligner partout, et tout de suite : moins 8 % sur toute la gamme de base à l'enlèvement, dans les huit agences. Tarval vise les artisans, c'est écrit sur sa plaquette. Si on attend, on ne les revoit plus.",
      },
      {
        ...FULVIO,
        heure: "11:30",
        texte:
          "Le dépôt de Tarval est à huit cents mètres de mon agence. Mes clients livrés ne m'en parlent pas. Au comptoir, en revanche, ils ont tous la plaquette dans la poche.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "ventes",
        titre: "Faire extraire les ventes de la région par type de client",
        cout: 1,
        nature: "decisive",
        resultat: (ctx) =>
          `Artisans au comptoir : ${s(ctx, "comptesArtisans")} comptes, ${s(ctx, "caArtisans")} par an, dont ${s(ctx, "baseArtisans")} de produits de base. PME qui enlèvent par palettes : ${s(ctx, "comptesPme")} comptes, ${s(ctx, "caPme")}, dont ${s(ctx, "basePme")} de base. Entreprises livrées sur chantier : ${s(ctx, "comptesLivres")} comptes, ${s(ctx, "caLivres")}, dont ${s(ctx, "baseLivres")} de base, à prix nets négociés à l'année. ${s(ctx, "zone")} des ventes aux artisans et aux PME se font dans les cinq agences à moins d'un quart d'heure des dépôts ; les trois autres sont au nord, à Villefranche, Neuville et Limonest. Taux de marque : ${s(ctx, "margeBase")} sur la base, ${s(ctx, "margeTechnique")} sur le reste. La base enlevée dans la zone pèse ${s(ctx, "exposee")} du chiffre d'affaires de la région.`,
      },
      {
        id: "tarval",
        titre: "Faire relever les prix de Tarval et étudier ses dépôts de Bourgogne",
        cout: 1,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur les 150 références du panier du comptoir, Tarval est ${s(ctx, "ecartComptoir")} sous nos prix ; à la palette, ${s(ctx, "ecartPalette")}. Libre-service, ni livraison, ni crédit, paiement comptant ; ses frais de structure font ${s(ctx, "fraisTarval")} de son chiffre d'affaires, les nôtres ${s(ctx, "fraisArvel")}. En Bourgogne, quand un négoce a baissé tout son tarif de 10 %, Tarval a suivi en trois semaines et l'écart est revenu ; quand un autre a aligné une centaine de références près du dépôt, Tarval n'a pas bougé. Ramener l'écart à 4 % demande ${s(ctx, "alignComptoir")} de baisse sur le panier du comptoir, ${s(ctx, "alignPalette")} sur les palettes. Son actionnaire finance un plan de vingt dépôts ; les analystes donnent à peu près quatre chances sur dix qu'il vise la part de marché à tout prix plutôt que la rentabilité de ses dépôts. Il suit plus volontiers une baisse large dans ce cas.`,
      },
      {
        id: "chefs",
        titre: "Réunir les huit chefs d'agence",
        cout: 1,
        nature: "bruit",
        resultat:
          "Une matinée de discussion animée. Pour les uns, « tout le monde va partir », pour les autres, « nos clients ne vont pas faire la queue dans un hangar ». Deux chefs veulent baisser partout, un troisième veut une campagne de publicité. Personne n'a de chiffre.",
      },
      {
        id: "plaquette",
        titre: "Lire la plaquette d'ouverture de Tarval",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Le dépôt des pros » : moins 15 % sur la palette de ciment, de parpaings, de plaques de plâtre ; ouvert de 6 h à 18 h, sans minimum d'achat, paiement comptant ou par carte. Aucune ligne sur la livraison, le crédit ou les produits techniques. Les photos montrent des plateaux chargés de palettes, pas des comptoirs.",
      },
      {
        id: "conseil",
        titre: "Appeler Wandrille Grosjean, qui a vu arriver Tarval à Mâcon",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Wandrille Grosjean, ancien collègue, dirige un négoce indépendant à Mâcon : « Ne baisse pas tout. Regarde qui achète quoi, et où : un client livré ne va pas chez Tarval. Aligne-toi sur ce que les clients comparent, pas sur le reste. Et ne lance pas une baisse qu'il peut suivre : avec huit points de frais de moins, il gagne à ce jeu-là. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle riposte présentez-vous au comité ?",
    options: [
      {
        t: "Baisser de 8 % toute la gamme de base à l'enlèvement, dans les huit agences",
        d: "Dès l'ouverture de Tarval, sur tous les produits de base vendus au comptoir et à la palette, pour tous les clients qui enlèvent.",
      },
      {
        t: "Ramener à 4 % de Tarval les références que les clients comparent, au comptoir et à la palette, dans les cinq agences proches des dépôts",
        d: "Les 150 références du panier du comptoir et les produits à la palette ; le reste de la gamme ne bouge pas. Prêt pour l'ouverture.",
      },
      {
        t: "Ne pas toucher aux prix : nos clients achètent du service",
        d: "Aucune baisse. Les commerciaux rappellent aux clients ce qu'Arvel apporte.",
      },
      {
        t: "Baisser de 8 % toute la gamme de base à l'enlèvement, dans les cinq agences proches des dépôts",
        d: "Toute la base, pour tous les clients qui enlèvent dans la zone ; les trois agences du nord ne bougent pas.",
      },
    ],
    reactions: [
      [
        {
          ...LEANDRE,
          texte:
            "Merci. Les nouvelles étiquettes partent à l'impression : moins 8 % sur toute la base, dans les huit agences. Personne ne pourra dire qu'on est plus chers.",
        },
      ],
      [
        {
          ...TANCREDE,
          texte:
            "Le comité valide l'alignement ciblé. Léandre aurait voulu plus large ; je lui ai dit qu'on jugerait sur pièces.",
        },
      ],
      [
        {
          ...LEANDRE,
          texte:
            "Je fais passer le message aux commerciaux. J'espère que tu as raison : on verra dans un mois.",
        },
      ],
      [
        {
          ...FULVIO,
          texte:
            "Moins 8 % sur toute la base dans les cinq agences de la zone : on change les étiquettes ce week-end.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce que Tarval ne sait pas faire",
    jusqua: 4,
    messages: () => [
      {
        ...LEANDRE,
        heure: "09:00",
        alerte: true,
        texte:
          "Pour accompagner la riposte, je propose une campagne « Arvel, les prix des pros » : radio, affichage, mailing à tous nos comptes. 100 k€. Il faut que les clients sachent qu'on n'est pas plus chers que Tarval.",
      },
      {
        ...ZELIE,
        heure: "11:40",
        texte:
          "Tarval ne livre pas. Nous, on pourrait livrer le lendemain avant 7 h, gratuitement dès 600 €, dans les huit agences : quatre camions-grue de plus, location sur trois ans. Ou en mettre un dans deux agences d'abord, pour voir si les clients suivent.",
      },
      {
        ...HONORINE,
        heure: "16:20",
        texte:
          "Quatre camions sur trois ans, c'est un engagement. Je veux savoir ce que ça rapporte avant de signer, Faustine.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "livraison",
        titre: "Demander aux régions du groupe qui livrent le lendemain ce qu'elles en ont tiré",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `En Isère, les clients ont suivi : ${s(ctx, "gainForte")} de ventes en plus aux entreprises livrées au bout de deux mois, et des PME qui ont cessé d'aller chercher leurs palettes. En Savoie, presque rien : ${s(ctx, "gainFaible")}. Dans les deux cas, on l'a su en six semaines. Le groupe estime qu'une fois sur deux à peine les clients prennent l'habitude. Quatre camions-grue avec chauffeurs : ${s(ctx, "coutLivraison")} par an, sur trois ans. Un camion dans deux agences pendant six semaines : ${s(ctx, "coutTest")} par semaine, et ${s(ctx, "miseEnPlace")} de mise en place.`,
      },
      {
        id: "campagne",
        titre: "Demander à l'agence de communication ce que ferait la campagne",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Une campagne prix améliore l'image prix de 10 à 15 % chez les artisans, le temps qu'elle dure. » Personne ne sait dire combien de clients elle retient. En Bourgogne, Tarval a répondu à une campagne de ce genre par une contre-campagne, et par une nouvelle baisse sur les références montrées dans les annonces.",
      },
    ],
    question: "Que lancez-vous ?",
    options: [
      {
        t: "La campagne « Arvel, les prix des pros »",
        d: "100 k€ : radio, affichage et mailing pendant quatre semaines, à partir de la semaine 4.",
      },
      {
        t: "La livraison du lendemain, tout de suite, dans les huit agences",
        d: "Quatre camions-grue loués sur trois ans. En service en semaine 5.",
      },
      {
        t: "La livraison du lendemain en test six semaines dans deux agences, étendue si les clients suivent",
        d: "Un camion à partir de la semaine 5 ; décision d'étendre en semaine 10, au vu des chiffres.",
      },
      {
        t: "Rien de plus : garder les moyens pour les prix",
        d: "Aucune dépense nouvelle.",
      },
    ],
    reactions: [
      [
        {
          ...LEANDRE,
          texte: "Parfait. Les spots passent à la radio à partir de lundi en huit.",
        },
      ],
      [
        {
          ...ZELIE,
          texte:
            "Je signe la location des quatre camions. Premières livraisons du lendemain en semaine 5, dans les huit agences.",
        },
      ],
      [
        {
          ...ZELIE,
          texte:
            "Un camion à Bron et à Vaulx-en-Velin en semaine 5. Je compte les clients qui l'utilisent, semaine par semaine.",
        },
      ],
      [{ ...HONORINE, texte: "Noté. Rien de nouveau au budget." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le fabricant qui livre aussi Tarval",
    jusqua: 6,
    messages: () => [
      {
        ...THADDEE,
        heure: "10:00",
        texte:
          "Madame Montagnac, Tarval est aussi notre client, je ne vous le cache pas. Je viens vous proposer de travailler ensemble sur vos volumes de l'an prochain : une remise de fin d'année, si vous tenez vos volumes.",
      },
      {
        ...TANCREDE,
        heure: "11:20",
        alerte: true,
        texte:
          "On pèse lourd chez Bercheny. Fais-leur comprendre que notre référencement dépend de leur attitude avec Tarval. Sans plaques ni isolants, son dépôt est vide.",
      },
      {
        ...NESRINE,
        heure: "15:45",
        texte: "Pour mémoire, Bercheny, c'est 30 % de nos achats de produits de base.",
      },
    ],
    sources: [
      {
        id: "rfa",
        titre: "Chiffrer la remise de fin d'année que propose le fabricant",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${s(ctx, "tauxRfa")} sur nos achats de ses produits si nos volumes de base de l'an prochain tiennent à ${s(ctx, "seuilPlein")} de ceux de cette année ; dégressive en dessous, plus rien à ${s(ctx, "seuilNul")}. À volumes tenus : ${s(ctx, "rfaAnnuelle")} par an. Nos volumes de base, cette semaine : ${s(ctx, "volumes")} du plan. La remise ne vaut que ce que la riposte garde de clients.`,
      },
      {
        id: "juriste",
        titre: "Demander à la juriste du groupe ce que permet une pression sur le fabricant",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Iseult Castellan, juriste du groupe : « Exiger d'un fournisseur qu'il cesse de livrer un concurrent, sous la menace d'un déréférencement, c'est le terrain de l'entente et de l'abus de dépendance économique. Tarval porterait plainte une fois sur trois au moins ; une procédure, c'est ${s(ctx, "provision")} de provision pour commencer. Et le fabricant retirera son budget de coopération commerciale : ${s(ctx, "cooperation")}. »`,
      },
    ],
    question: "Que répondez-vous au fabricant ?",
    options: [
      {
        t: "Lui faire comprendre que notre référencement dépend de son attitude avec Tarval",
        d: "Aucun coût immédiat ; c'est lui qui décidera.",
      },
      {
        t: "Négocier la remise de fin d'année conditionnelle sur nos volumes de base",
        d: "3 % sur ses produits si nos volumes tiennent ; rien s'ils fondent.",
      },
      {
        t: "Garder nos conditions actuelles",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...THADDEE,
          texte:
            "Je ne choisis pas mes clients sous la menace, madame. Nous continuerons de livrer tout le monde, et nous retirons notre budget de coopération commerciale pour l'an prochain.",
        },
      ],
      [
        {
          ...THADDEE,
          texte:
            "Marché conclu : la remise sera calculée sur vos volumes de l'année. À vous de les tenir.",
        },
      ],
      [{ ...THADDEE, texte: "Comme vous voudrez. Ma porte reste ouverte." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les premiers chiffres",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...LEANDRE,
        heure: "09:00",
        alerte: true,
        texte: `Les artisans de la zone tiennent : ils ont gardé ${s(ctx, "artisansZone")} de leurs achats de base. Le plan marche. Je propose de le renforcer comme le comité l'avait prévu : une carte comptoir à moins 3 % pour les artisans, dans les huit agences.`,
      },
      {
        ...MAHAUT,
        heure: "14:10",
        texte:
          "Faustine, Villefranche n'est pas dans la zone, mais mes PME passent le pont pour leurs palettes. Kossi Agbodjan me l'a dit sans détour : pour six palettes par semaine, trente kilomètres valent le détour.",
      },
      {
        ...NESRINE,
        heure: "17:30",
        texte: `Achats de base depuis l'ouverture de Tarval, toutes agences : PME ${s(ctx, "pme")} du plan, artisans ${s(ctx, "artisans")}.${
          ctx.suivi === "oui"
            ? " Et Tarval a baissé à son tour sur tout ce que nous avons baissé."
            : ""
        }`,
      },
    ],
    sources: [
      {
        id: "detail",
        titre: "Faire sortir les achats de base par agence et par type de client",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Depuis l'ouverture, en part de leurs achats de base d'avant Tarval : artisans de la zone ${s(ctx, "artisansZone")}, artisans du nord ${s(ctx, "artisansNord")}, PME de la zone ${s(ctx, "pmeZone")}, PME des trois agences du nord ${s(ctx, "pmeNord")}. Les artisans du nord ne font pas trente kilomètres pour un panier de comptoir ; les PME du nord, si, pour des palettes, et la riposte de la semaine 1 ne les couvre pas. Les ${s(ctx, "pmeNordComptes")} PME du nord achètent ${s(ctx, "basePmeNord")} de base par an.`,
      },
      {
        id: "kossi",
        titre: "Appeler Kossi Agbodjan, maçon à Villefranche",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Kossi Agbodjan, douze salariés : « Six palettes par semaine, quinze pour cent d'écart : ça paie le camion et le chauffeur. Le technique, je l'achète chez vous de toute façon, et le crédit à soixante jours, Tarval ne le fait pas. Si vous me faites un geste sur l'année et que je vous garde mes volumes, je reste. »",
      },
    ],
    question: "Que faites-vous au vu de ces chiffres ?",
    options: [
      {
        t: "Garder le cap : l'effort sur les artisans, avec la carte comptoir à moins 3 % dans les huit agences",
        d: "3 % de remise sur toute la gamme de base pour les comptes artisans, à partir de la semaine 8.",
      },
      {
        t: "Proposer aux PME du nord un contrat d'un an : 2 % de ristourne sur la base si elles nous gardent 90 % de leurs volumes",
        d: "La ristourne n'est due que sur les volumes gardés. Les commerciaux les voient toutes avant la semaine 8.",
      },
      {
        t: "Baisser de 5 % toute la gamme de base dans les trois agences du nord",
        d: "Pour tous les clients qui enlèvent au nord, à partir de la semaine 8.",
      },
      {
        t: "Attendre des chiffres plus sûrs, au comité de décembre",
        d: "Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...LEANDRE,
          texte: "Merci, Faustine. Les cartes sont imprimées ; on les distribue à partir de lundi.",
        },
      ],
      null,
      [
        {
          ...MAHAUT,
          texte: "Moins 5 % sur toute la base au nord : je préviens les équipes des trois agences.",
        },
      ],
      [
        {
          ...LEANDRE,
          texte: "D'accord. Deux mois de chiffres, ce sera plus solide.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'opération d'hiver de Tarval",
    jusqua: 11,
    messages: () => [
      {
        ...FULVIO,
        heure: "07:50",
        alerte: true,
        texte:
          "Tarval affiche « Opération chantiers d'hiver » : moins 15 % sur 40 références de gros œuvre, jusqu'au 31 décembre. Mes clients me demandent si on suit.",
      },
      {
        ...LEANDRE,
        heure: "09:30",
        texte:
          "On suit au centime, partout. Sinon on perd en six semaines ce qu'on a gardé en deux mois.",
      },
      {
        de: "Revue de presse",
        role: "Communication du groupe",
        heure: "12:00",
        texte:
          "Iñaki Saldaña, directeur du développement de Tarval, dans la presse locale : « Nos prix d'hiver sont là pour faire connaître nos dépôts aux professionnels lyonnais. »",
      },
    ],
    sources: [
      {
        id: "operations",
        titre: "Analyser ce que Tarval a fait de ses opérations en Bourgogne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `À Chalon, l'opération d'hiver s'est arrêtée le 31 décembre et Tarval a remonté ses prix de 3 % en janvier : il voulait rentabiliser son dépôt. À Mâcon, où il cherchait à s'implanter, les prix d'opération sont devenus ses prix. Les 40 références pèsent un tiers du panier du comptoir et ${s(ctx, "promoPalette")} des produits à la palette. Suivre partout coûte ${s(ctx, "coutSuivre")} de marge par semaine tant que l'opération dure, et un prix suivi ne remonte presque jamais : nos clients ne nous laisseront pas remonter en janvier. Là où un concurrent a suivi au centime, Tarval a prolongé et élargi l'opération six fois sur dix quand il cherchait à s'implanter, une fois sur quatre sinon.`,
      },
      {
        id: "garantie",
        titre: "Chiffrer un prix palette garanti par écrit aux PME de la zone",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Un prix écrit dans un contrat ne s'affiche pas : Tarval ne peut pas le suivre. Garantir aux PME de la zone le prix de l'opération, à 4 % près, jusqu'au 30 juin, coûte environ ${s(ctx, "coutGarantie")} de marge par mois, que Tarval garde ses prix d'opération ou qu'il les remonte en janvier. S'il les garde, ce sont les PME de la zone qui partiraient les premières.`,
      },
    ],
    question: "Que faites-vous face à l'opération de Tarval ?",
    options: [
      {
        t: "Suivre au centime sur les 40 références, dans les huit agences",
        d: "Jusqu'au 31 décembre, sur tout ce qui s'enlève.",
      },
      {
        t: "Ne pas suivre : laisser passer l'opération",
        d: "Les prix ne bougent pas ; les commerciaux rappellent aux clients sous contrat que leurs conditions tiennent.",
      },
      {
        t: "Garantir par écrit aux PME de la zone le prix de l'opération jusqu'au 30 juin, sans baisse affichée",
        d: "Des prix palette à 4 % de Tarval pour elles seules, quoi qu'il fasse en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...FULVIO,
          texte:
            "Nouvelles étiquettes sur les 40 références dès lundi, dans les huit agences. Les clients sont contents.",
        },
      ],
      [
        {
          ...LEANDRE,
          texte:
            "Je n'aime pas ça, mais j'explique aux équipes. Si on perd du monde, je te le dirai.",
        },
      ],
      [
        {
          ...FULVIO,
          texte:
            "Les commerciaux passent voir les PME de la zone avec un avenant. Rien ne change sur les étiquettes.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le cap de l'an prochain",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...TANCREDE,
        heure: "08:30",
        alerte: true,
        texte: `Faustine, le comité de décembre fixe le cap de l'an prochain. ${
          ctx.conquete === "oui"
            ? "Tarval a déposé un permis pour un troisième dépôt, à Villefranche : il est là pour durer."
            : "Tarval remonte ses prix de 3 % au 1er janvier et ferme le samedi après-midi : il veut rentabiliser ses dépôts."
        } Qu'est-ce qu'on garde, qu'est-ce qu'on change ?`,
      },
      {
        ...LEANDRE,
        heure: "10:15",
        texte:
          "Des prix garantis égaux à ceux de Tarval toute l'année, sur nos références comparées, dans la zone. Les clients veulent de la visibilité, et on n'aura plus à courir derrière ses opérations.",
      },
      {
        ...HONORINE,
        heure: "14:00",
        texte: `Certains au comité veulent ouvrir notre propre dépôt à prix bas, sous une autre enseigne : ${s(ctx, "depotOuverture")} d'ouverture et ${s(ctx, "depotHebdo")} par semaine. Avant d'en parler, je veux savoir ce qu'il prendrait à nos propres agences.`,
      },
    ],
    sources: [
      {
        id: "retenu",
        titre: "Mesurer ce que chaque baisse a retenu depuis l'ouverture",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${s(ctx, "recentrage")} Les contrats des PME du nord, s'ils ont été signés, arrivent à échéance le 31 mars : sans reconduction, l'engagement de volume tombe. ${
            ctx.forte === "oui"
              ? "La livraison du lendemain a pris : les clients l'utilisent."
              : ctx.forte === "non"
                ? "La livraison du lendemain n'a pas pris : les clients ne l'ont pas adoptée."
                : ""
          }`,
      },
      {
        id: "depot",
        titre: "Chiffrer un dépôt à prix bas sous une autre enseigne",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Il reprendrait à Tarval ${s(ctx, "repriseBasse")} à ${s(ctx, "repriseHaute")} de ce qui est parti chez lui, selon qu'il cherche la rentabilité ou la part de marché, à ${s(ctx, "margeDepot")} de marge seulement. Mais ${s(ctx, "cannibalisation")} des clients de nos agences de la zone y passeraient d'eux-mêmes, et laisseraient chez nous la différence de marge. Ouverture : ${s(ctx, "depotOuverture")} ; fonctionnement : ${s(ctx, "depotHebdo")} par semaine.`,
      },
    ],
    question: "Quel cap proposez-vous pour l'an prochain ?",
    options: [
      {
        t: "Garantir un an des prix égaux à ceux de Tarval sur les références comparées, dans la zone",
        d: "Affichés en agence et sur le site, toute l'année.",
      },
      {
        t: "Recentrer : garder ce qui retient, retirer ce qui ne retient personne, reconduire les contrats PME",
        d: "En janvier, les baisses sans effet disparaissent ; les contrats PME sont reconduits pour un an.",
      },
      {
        t: "Ouvrir notre propre dépôt à prix bas, sous une autre enseigne, près de Vénissieux",
        d: "Ouverture en janvier, dans un entrepôt loué.",
      },
      {
        t: "Reconduire le dispositif tel qu'il est",
        d: "Rien ne change en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...LEANDRE,
          texte:
            "Enfin de la visibilité ! J'en fais l'argument de nos visites de janvier : chez Arvel, jamais plus cher que Tarval.",
        },
      ],
      [
        {
          ...TANCREDE,
          texte:
            "Le comité valide. Léandre trouve qu'on recule ; Honorine trouve qu'on avance. Je prends les deux comme un bon signe.",
        },
      ],
      [
        {
          ...HONORINE,
          texte:
            "Le comité valide le dépôt. Je cherche l'entrepôt, et un nom qui ne dise pas Arvel.",
        },
      ],
      [{ ...TANCREDE, texte: "Le comité reconduit. On fera le point en mars." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "La riposte ciblée", chemin: [1, 2, 1, 1, 1, 1] },
  { nom: "Le prix partout", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [2, 3, 2, 3, 1, 3] },
] as const;

/**
 * Les réflexes d'une direction devant un discounter : baisser partout pour ne
 * perdre personne, ou ne rien faire parce que les clients sont fidèles ;
 * répondre sur le terrain du prix ; s'engager sans tester ; peser sur un
 * fournisseur ; s'en tenir au segment qu'on croyait visé ; suivre chaque
 * promotion ; garantir le prix du concurrent. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [1, 1],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  suiviOui:
    "Tarval a baissé à son tour sur tout ce que nous avons baissé : l'écart est revenu, et nos baisses restent.",
  suiviNon: "Tarval n'a pas bougé ses prix depuis l'ouverture.",
  testFort:
    "Le test est concluant : à Bron et à Vaulx-en-Velin, les clients se sont mis à la livraison du lendemain. Nous l'étendons aux huit agences.",
  testFaible:
    "Le test ne prend pas : à peine quelques livraisons par jour. Nous arrêtons le camion à la fin de la semaine.",
  livraisonForte: "La livraison du lendemain a pris : les entreprises et les PME l'utilisent.",
  livraisonFaible: "La livraison du lendemain ne prend pas : les camions roulent à moitié vides.",
  plainte:
    "Tarval a saisi l'Autorité de la concurrence d'une plainte pour pression sur un fournisseur. Le groupe provisionne la procédure.",
  pasDePlainte: "Tarval n'a pas donné suite à l'affaire du fabricant.",
  escalade:
    "Tarval prolonge son opération et l'étend à 30 références de plus : il a vu qu'on suivait.",
  pasDEscalade: "Tarval n'a pas réagi à notre alignement sur son opération.",
  enGuerre:
    "Tarval a baissé aussitôt les 40 références sous nos nouveaux prix : depuis la semaine 5, il suit chacune de nos baisses.",
} as const;
