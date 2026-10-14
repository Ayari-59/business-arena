/**
 * LES NÉGOCIATIONS DU 1ER MARS — le contenu de l'épisode.
 *
 * Baptistin Haddadi, directeur commercial de la Laiterie de Kerbrélan, négocie
 * avec la centrale d'achat de Celtis, qui pèse 30 % du chiffre d'affaires :
 * les CGV demandent +5,8 %, dont 3,9 points de matière première agricole ;
 * Celtis répond −2 % et menace de retirer douze références de la marque si
 * rien n'est signé au 1er mars. Décembre à février : six décisions, chacune
 * précédée de ce qu'un directeur commercial reçoit vraiment pendant les
 * négociations annuelles.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent vient des constantes du modèle ; le test de l'épisode le vérifie.
 *
 * Entreprises, enseignes, personnes et chiffres sont fictifs.
 */
import {
  AUTRES_HAUSSES,
  COOPERATION,
  COUTS,
  DEMANDE_CELTIS,
  DEREFERENCEMENT,
  FAIBLES,
  HAUSSE_CGV,
  HAUSSE_COUTS_VARIABLES,
  HAUSSE_DU_PLAN,
  HAUSSE_FRAIS_FIXES,
  INDICATEURS,
  LEADERS,
  MARQUE,
  PART_AGRICOLE,
  PART_LAIT,
  PLAN,
  PRIX_LAIT,
  PROMO_MASSIVE,
  REPORT_PREPARE,
  RESTE,
  RETRAIT,
  SEMAINES_DE_MEDIATION,
  VALEUR_DU_POINT,
  margeAnnuelle,
  perteSiRetire,
} from "@/engine/episodes/negociations-annuelles";
import type { Etape } from "./types";
import { euros, kE } from "./format";

/** Un pourcentage signé, au dixième : « +5,8 % », « −2,0 % ». */
export const pct = (v: number, d = 1) =>
  `${v > 1e-12 ? "+" : v < -1e-12 ? "−" : ""}${Math.abs(v * 100).toLocaleString("fr-FR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })} %`;
/** Des points de tarif, au dixième : « 3,9 points », « 1,5 point ». */
export const points = (v: number) => {
  const n = Math.abs(v * 100);
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${
    n < 2 ? "point" : "points"
  }`;
};
const NOMBRES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
] as const;
/** Un petit nombre écrit en lettres, comme dans un courrier : « six », « douze ». */
export const enLettres = (n: number) => NOMBRES[n] ?? String(n);
/** Des millions d'euros au dixième : « 3,6 M€ ». */
export const millions = (v: number) =>
  `${(v / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
/** Des points au dixième, sans unité : « 1,9 ». */
export const dixiemes = (v: number) =>
  (v * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Un pourcentage simple, sans signe : « 45 % », « 7,6 % ». */
export const taux = (v: number) =>
  `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const [productionInd, beurreInd, nationalInd] = INDICATEURS;
/** La moyenne pondérée des indicateurs du contrat : +9,3 %. */
export const HAUSSE_INDICATEURS = INDICATEURS.reduce((s, i) => s + i.poids * i.hausse, 0);
/** Ce que l'acheteuse calcule avec le seul prix moyen national : 0,42 × 5 %, soit 2,1 points. */
export const PART_SELON_CELTIS = PART_LAIT * nationalInd.hausse;
/** La marge des nouveautés, si Celtis les référence toutes les deux. */
export const MARGE_NOUVEAUTES = PLAN.nouveautes.ca * PLAN.nouveautes.taux;
/** Si Celtis retirait les neuf références faibles douze semaines, au prix du plan. */
export const PERTE_DU_PARTIEL = perteSiRetire(
  FAIBLES,
  HAUSSE_DU_PLAN,
  DEREFERENCEMENT.partiel,
  FAIBLES.report,
);

export const DIAGNOSTICS = [
  {
    id: "preparation",
    t: "La négociation se joue sur deux terrains : la part agricole, justifiée par les indicateurs du contrat avec l'OP et que la loi met hors négociation, et le reste, qui s'échange contre des contreparties ; la menace pèse moins qu'elle n'en a l'air, Celtis ne pouvant pas retirer les leaders sans perdre des clients",
  },
  {
    id: "contreparties",
    t: "Celtis veut surtout des contreparties : un plan d'affaires et des promotions bien construits feront passer la hausse",
  },
  {
    id: "dependance",
    t: "Celtis pèse 30 % du chiffre d'affaires : la laiterie ne peut pas se permettre de perdre douze références, il faut d'abord garder le référencement",
  },
  {
    id: "loi",
    t: "La loi protège la hausse : la part agricole est sanctuarisée et la menace de déréférencement est interdite ; il suffit de tenir les CGV",
  },
] as const;

export const CYRIELLE = {
  de: "Cyrielle Mainguené",
  role: "Acheteuse produits laitiers frais, centrale d'achat de Celtis",
} as const;
export const PHILEAS = {
  de: "Philéas Correia",
  role: "Directeur des achats alimentaires, Celtis",
} as const;
export const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
export const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
export const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;
export const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
export const HOEL = {
  de: "Hoel Quiniou",
  role: "Responsable de la collecte et des relations avec les producteurs",
} as const;
export const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
export const MEVENA = { de: "Mévena Guégan", role: "Juriste" } as const;
export const AMADOU = { de: "Amadou Perrotte", role: "Contrôleur de gestion" } as const;
export const KONOGAN = { de: "Konogan Kerguéris", role: "Président de l'OP Lait du Méné" } as const;
export const GWENVAEL = {
  de: "Gwenvaël Pérennès",
  role: "Expert-comptable, tiers indépendant",
} as const;
export const ALDO = { de: "Aldo Bevilacqua", role: "Chargé d'études, Mesurial" } as const;
export const EMERANCE = {
  de: "Emerance Delafosse",
  role: "Acheteuse produits frais, Opaline",
} as const;
export const IFIG = {
  de: "Ifig Kerdudo",
  role: "Ancien directeur commercial d'une fromagerie du Léon",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Moins 2 %, ou douze références en moins",
    jusqua: 2,
    messages: () => [
      {
        ...CYRIELLE,
        heure: "08:40",
        alerte: true,
        texte: `Monsieur Haddadi, nous avons bien reçu vos conditions générales de vente. ${pct(HAUSSE_CGV)} n'est pas recevable dans le contexte de pouvoir d'achat de nos clients : Celtis attend de ses fournisseurs une baisse de ${taux(-DEMANDE_CELTIS)} sur l'ensemble de la marque Kerbrélan. Sans accord au 1er mars, nous retirerons de nos rayons les douze références dont vous trouverez la liste jointe. Premier rendez-vous à la centrale dans quinze jours.`,
      },
      {
        ...YANNIG,
        heure: "09:30",
        texte:
          "Baptistin, Celtis, c'est 30 % de notre chiffre d'affaires. Le président m'a appelé : il ne veut ni perdre douze références, ni brader le lait de nos producteurs. Dis-moi vendredi comment tu abordes le premier rendez-vous.",
      },
      {
        ...HOEL,
        heure: "11:15",
        texte: `Pour mémoire : au 1er janvier, le contrat avec l'OP Lait du Méné nous fera payer le lait ${PRIX_LAIT.nouveau} € les 1 000 litres, contre ${PRIX_LAIT.ancien} € cette année. Les producteurs savent que les négociations commencent.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "marges",
        titre: "Faire chiffrer la marge de chaque référence chez Celtis",
        cout: 1,
        nature: "decisive",
        resultat: `Amadou Perrotte, contrôle de gestion : Kerbrélan chez Celtis l'an dernier, c'est ${MARQUE.references} références, ${millions(MARQUE.ca)} de chiffre d'affaires net et ${millions(MARQUE.mcv)} de marge sur coût variable (${taux(MARQUE.mcv / MARQUE.ca)}). Les douze références menacées : les trois où la marque est leader — le fromage blanc nature en seau d'un kilo, la crème fraîche épaisse de 50 cl, le riz au lait en quatre pots — font ${millions(LEADERS.ca)} de chiffre d'affaires et ${kE(LEADERS.mcv)} de marge sur coût variable ; les neuf autres (yaourts aromatisés, desserts lactés, fromages blancs aux fruits), ${millions(FAIBLES.ca)} et ${kE(FAIBLES.mcv)}. Sur toute la marque, chaque point de prix vaut ${kE(VALEUR_DU_POINT)} de marge par an.`,
      },
      {
        id: "report",
        titre: "Lire l'étude de Mesurial sur les ruptures en rayon",
        cout: 1,
        nature: "decisive",
        resultat: `Données de sortie de caisse de l'an dernier, quand une référence manque en rayon. Sur les trois références où Kerbrélan est leader de son segment (34 à 41 % de part de marché), ${taux(LEADERS.report)} des acheteurs vont l'acheter dans un autre magasin ; les autres prennent un produit de Nordal ou la marque de Celtis. Sur les neuf autres références menacées, ${taux(FAIBLES.report)} seulement vont la chercher ailleurs. Ceux qui changent de magasin pour le seau de fromage blanc y font aussi le reste de leurs courses : un panier moyen de 52 €.`,
      },
      {
        id: "op",
        titre: "Relire le contrat-cadre avec l'OP Lait du Méné",
        cout: 0.5,
        nature: "decisive",
        resultat: `Hoel Quiniou : le prix de base suit trois indicateurs publiés — les ${productionInd.nom} des élevages (poids ${taux(productionInd.poids)}, +${taux(productionInd.hausse)} sur un an), la ${beurreInd.nom} (${taux(beurreInd.poids)}, +${taux(beurreInd.hausse)}), le ${nationalInd.nom} du lait (${taux(nationalInd.poids)}, +${taux(nationalInd.hausse)}). Moyenne pondérée : ${pct(HAUSSE_INDICATEURS)}, soit ${PRIX_LAIT.nouveau} € les 1 000 litres au lieu de ${PRIX_LAIT.ancien} €. Le lait pèse ${taux(PART_LAIT)} du tarif de nos produits de marque : la part agricole de la hausse est de ${points(PART_AGRICOLE)}. Les ${points(RESTE)} restants : emballages ${points(AUTRES_HAUSSES.emballages)}, énergie ${points(AUTRES_HAUSSES.energie)}, transport frigorifique ${points(AUTRES_HAUSSES.transport)}, salaires ${points(HAUSSE_FRAIS_FIXES)}. La loi impose d'afficher la part agricole dans les CGV et la met hors de la négociation.`,
      },
      {
        id: "presse",
        titre: "Parcourir la presse professionnelle sur les négociations",
        cout: 1,
        nature: "bruit",
        resultat:
          "« Les distributeurs veulent des baisses », titre un hebdomadaire professionnel ; le président de Celtis promet à la télévision de « défendre le pouvoir d'achat ». Un éditorialiste prédit que « les industriels finiront autour de +2 % ». Aucun chiffre sur les produits laitiers frais, ni sur Kerbrélan.",
      },
      {
        id: "conseil",
        titre: "Appeler Ifig Kerdudo, qui a mené vingt négociations annuelles",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ifig : « Avant le premier rendez-vous, chiffre ce que tu perdrais vraiment, référence par référence, et ce qu'eux perdraient. La part agricole, ne la mets jamais dans la discussion : elle se justifie, elle ne se négocie pas. Le reste, tu l'échanges, tu ne le donnes pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment abordez-vous le premier rendez-vous avec Celtis ?",
    options: [
      {
        t: "Ouvrir sur la demande de Celtis : proposer de discuter d'un effort sur le prix pour garder les douze références",
        d: `La discussion part de ${pct(DEMANDE_CELTIS)} ; l'acheteuse range sa liste pour l'instant.`,
      },
      {
        t: "Préparer un dossier de négociation : la marge de chaque référence, ce que Celtis perdrait sans les leaders, la justification de la part agricole",
        d: "Deux semaines de travail pour Amadou et Morwenna ; le premier rendez-vous est repoussé de quelques jours.",
      },
      {
        t: "Répondre par écrit que les CGV ne se négocient pas, et que Celtis assumera ses déréférencements",
        d: "Un courrier ferme, signé du directeur général. Pas de rendez-vous avant janvier.",
      },
      {
        t: "Aller au premier rendez-vous avec les CGV, et écouter ce que l'acheteuse propose",
        d: "Rien à préparer : Naïm vous accompagne.",
      },
    ],
    reactions: [
      [
        {
          ...CYRIELLE,
          texte: `Je note votre ouverture. Nous partons donc de ${pct(DEMANDE_CELTIS)}, et nous verrons ce que vous pouvez faire. La liste des douze références reste sur mon bureau.`,
        },
      ],
      [
        {
          ...MORWENNA,
          texte:
            "Le dossier sera prêt pour le rendez-vous : une fiche par référence, avec sa marge, sa part de marché et ce que font ses acheteurs quand elle manque. Amadou a déjà le fromage blanc et la crème.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "Bien reçu votre courrier. Je le transmets à ma direction, qui appréciera.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Je viens avec toi. L'acheteuse va dérouler son argumentaire : le pouvoir d'achat, Nordal qui ferait mieux, la liste des douze. On verra bien.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "La part agricole contestée",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...CYRIELLE,
        heure: "10:05",
        alerte: true,
        texte: `Votre part agricole de ${points(PART_AGRICOLE)}, je ne la reconnais pas : le ${nationalInd.nom} du lait n'a pris que ${taux(nationalInd.hausse)} sur un an. ${taux(nationalInd.hausse)} sur ${taux(PART_LAIT)} du tarif, cela fait ${points(PART_SELON_CELTIS)}, pas ${points(PART_AGRICOLE)}. Je veux en discuter avec le reste.`,
      },
      {
        ...HOEL,
        heure: "14:20",
        texte: `Konogan Kerguéris, le président de l'OP, m'a demandé où en était Celtis. Les producteurs ont accepté la formule à ${PRIX_LAIT.nouveau} € sur la foi des indicateurs ; ils suivent la négociation de près.`,
      },
      {
        de: "Tableau de bord commercial",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ventes de la marque chez Celtis ${ctx.ventes} ; offre de Celtis ${ctx.offre}. Marge annuelle attendue au prix de l'offre : ${ctx.marge}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "loi",
        titre: "Demander à la juriste ce que prévoit la loi",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Mévena Guégan : la part de la matière première agricole figure dans les CGV et n'est pas négociable ; la négociation ne porte que sur le reste. La loi offre trois manières de la justifier ; la plus solide est la troisième : un tiers indépendant atteste, au vu des indicateurs du contrat, que la négociation n'a pas porté sur la part agricole. Gwenvaël Pérennès, expert-comptable, le fait pour ${euros(COUTS.attestation)}. ${
            ctx.prepare
              ? "Notre dossier (indicateurs, structure du tarif) est prêt : son attestation peut partir chez Celtis dans deux semaines, avant les rendez-vous de janvier."
              : "Il lui faut d'abord la structure de chaque tarif, que personne n'a encore reconstituée : son attestation ne partira pas avant février."
          } Quant au ${nationalInd.nom}, ce n'est qu'un des trois indicateurs du contrat, pondéré à ${taux(nationalInd.poids)}.`,
      },
      {
        id: "producteurs",
        titre: "Écouter Konogan Kerguéris, président de l'OP",
        cout: 0.5,
        nature: "utile",
        resultat: `Konogan : « Nous avons signé un contrat indexé pour ne plus être la variable d'ajustement. Si vous cédez la part agricole chez Celtis, vous nous paierez quand même ${PRIX_LAIT.nouveau} €, le contrat est clair ; mais vous aurez perdu l'argent, et l'an prochain, vous viendrez nous expliquer qu'il faut modérer l'indicateur. »`,
      },
    ],
    question: "Que répondez-vous sur la part agricole ?",
    options: [
      {
        t: "Faire attester la part agricole par un tiers indépendant, sur les indicateurs du contrat avec l'OP",
        d: `Gwenvaël Pérennès, expert-comptable : ${euros(COUTS.attestation)}. L'attestation est transmise à Celtis dès qu'elle est prête.`,
      },
      {
        t: "Ramener la part agricole à 2,5 points pour débloquer la discussion",
        d: "Le geste qu'attend l'acheteuse. Le prix du lait payé aux producteurs ne change pas.",
      },
      {
        t: "Envoyer à l'acheteuse la formule du contrat et les trois indicateurs, par courriel",
        d: "Gratuit, et parti dans l'heure.",
      },
      {
        t: "Laisser la part agricole de côté et négocier sur le total",
        d: "On verra le détail au dernier rendez-vous.",
      },
    ],
    reactions: [
      [
        {
          ...GWENVAEL,
          texte:
            "Je commence dès réception du dossier : les indicateurs publiés, la formule du contrat, la part du lait dans chaque tarif. L'attestation partira chez Celtis dès que tout sera vérifié.",
        },
      ],
      [
        {
          ...HOEL,
          texte:
            "Konogan Kerguéris a appris que nous avons ramené la part agricole à 2,5 points chez Celtis. Il demande à être reçu par le président, avec le bureau de l'OP.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte:
            "Bien reçu votre formule. Je la regarde ; mes collègues de la centrale ont d'autres indicateurs.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: `Très bien, parlons du total. Pour moi, le total, c'est toujours ${pct(DEMANDE_CELTIS)}.`,
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Le reste se négocie",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...CYRIELLE,
        heure: "09:15",
        alerte: true,
        texte:
          "Sur ce qui n'est pas la matière agricole, je ne vois aucune raison de payer plus sans contrepartie. Qu'est-ce que Kerbrélan apporte à Celtis cette année ? Promotions, nouveautés, service : je veux un plan.",
      },
      {
        ...IWAN,
        heure: "11:00",
        texte: `Le lait est payé ${PRIX_LAIT.nouveau} € depuis le 1er janvier, et Celtis nous paie toujours aux prix de l'an dernier : la marge de la marque chez Celtis est passée de ${taux(MARQUE.mcv / MARQUE.ca)} à ${taux(MARQUE.mcv / MARQUE.ca - HAUSSE_COUTS_VARIABLES)} du chiffre d'affaires. Chaque semaine sans accord nous coûte.`,
      },
      {
        de: "Tableau de bord commercial",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : offre de Celtis ${ctx.offre} ; part agricole reconnue : ${ctx.agricole}. Marge annuelle attendue au prix de l'offre : ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "plan",
        titre: "Demander à la cheffe de marque de chiffrer un plan d'affaires",
        cout: 0.5,
        nature: "decisive",
        resultat: `Morwenna Pellen : deux opérations promotionnelles de plus, à −30 % en remise immédiate, dans les plafonds de la loi (34 % de la valeur, 25 % du volume annuel) : ${kE(PLAN.promotions)} de marge sur l'année. Deux nouveautés, une crème dessert au caramel au beurre salé et un fromage blanc à la vanille : ${kE(PLAN.nouveautes.ca)} de chiffre d'affaires par an chez Celtis si les deux sont référencées, à ${taux(PLAN.nouveautes.taux)} de marge, soit ${kE(MARGE_NOUVEAUTES)}. Des livraisons en camions complets sur ses deux entrepôts de l'Ouest : ${kE(PLAN.logistique)} de transport économisés chez Kerfroid. L'acheteuse m'a laissé entendre qu'avec un plan de ce genre, un point sur les ${dixiemes(RESTE)} restants se discute.`,
      },
      {
        id: "cooperation",
        titre: "Demander à Naïm ce que vaut une coopération commerciale",
        cout: 0.5,
        nature: "utile",
        resultat: `Naïm Lefeuvre : une coopération commerciale doit rémunérer un service réel et identifié — une tête de gondole, un prospectus, une mise en avant. ${points(COOPERATION)} de coopération sans service, c'est ${kE(COOPERATION * MARQUE.ca)} par an rendus à Celtis, et la DGCCRF y voit un avantage sans contrepartie. L'an dernier, Nordal en a accordé deux points ; Celtis lui a quand même retiré trois références.`,
      },
    ],
    question: "Que proposez-vous contre la hausse hors part agricole ?",
    options: [
      {
        t: "Un plan d'affaires chiffré : deux opérations promotionnelles, deux nouveautés, des livraisons en camions complets, contre un point sur le reste",
        d: `${kE(PLAN.promotions)} de promotions sur l'année ; Celtis choisit les nouveautés qu'elle référence.`,
      },
      {
        t: "Accorder 1,5 point de coopération commerciale pour faire passer la hausse",
        d: `${kE(COOPERATION * MARQUE.ca)} par an reversés à Celtis au titre de « services » ; la hausse affichée reste entière.`,
      },
      {
        t: "Offrir trois semaines à −34 % sur les douze références menacées, en mars",
        d: `Au plafond légal : environ ${kE(PROMO_MASSIVE)} de marge, effet de stockage compris.`,
      },
      {
        t: "Tenir le reste de la hausse sans contrepartie : ce sont des coûts réels",
        d: "Emballages, énergie, transport et salaires : les justificatifs sont dans les CGV.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...CYRIELLE,
          texte: "Voilà une proposition. La centrale note 1,5 point de coopération commerciale.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "Une belle opération, nos clients vont l'apprécier. Pour le prix, je vous dirai.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "Des coûts, tout le monde en a. Je ne vois pas ce que Celtis y gagne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · lundi",
    titre: "La pression monte",
    jusqua: 8,
    messages: (ctx) => [
      ctx.sommeil
        ? {
            ...YSEE,
            heure: "08:10",
            alerte: true,
            texte: `Depuis lundi dernier, Celtis ne commande plus quatre de nos références : le seau de fromage blanc d'un kilo et trois yaourts aromatisés. Officiellement, « une revue d'assortiment ». Les rayons sont vides dans ses hypermarchés.`,
          }
        : {
            ...CYRIELLE,
            heure: "08:10",
            alerte: true,
            texte:
              "Je vous préviens : ma direction veut des résultats. Si votre prochaine proposition ne bouge pas, je mets des références en sommeil dès la semaine prochaine.",
          },
      {
        ...YANNIG,
        heure: "10:30",
        texte:
          "Le président s'inquiète. Il propose d'appeler lui-même le directeur des achats de Celtis. Qu'en penses-tu ?",
      },
      {
        de: "Tableau de bord commercial",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 6 : ventes de la marque chez Celtis ${ctx.ventes}, ${ctx.references} références en rayon ; offre de Celtis ${ctx.offre}.`,
      },
    ],
    sources: [
      {
        id: "sortie",
        titre: "Demander à Mesurial ce que montreraient les sorties de caisse de Celtis",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Aldo Bevilacqua : pour ${euros(COUTS.donnees)}, nous extrayons les sorties de caisse des magasins Celtis sur vos trois leaders : ventes, ruptures, et ce que font les acheteurs quand le produit manque. ${
            ctx.sommeil
              ? `Pendant la mise en sommeil, ${taux(LEADERS.report)} des acheteurs du seau de fromage blanc sont allés l'acheter ailleurs, avec le reste de leur panier.`
              : `Lors des ruptures de l'automne, ${taux(LEADERS.report)} des acheteurs du seau de fromage blanc étaient allés l'acheter ailleurs, avec le reste de leur panier.`
          } Les acheteurs de centrale à qui l'on montre ces chiffres retirent souvent leur menace sur les leaders : ils doivent expliquer à leur direction ce qu'ils perdent.`,
      },
      {
        id: "opaline",
        titre: "Sonder Opaline sur une mise en avant de la marque",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Emerance Delafosse : « Si Celtis retirait vos leaders, Opaline les mettrait volontiers en avant : têtes de gondole, prospectus. Mais je ne veux pas être votre roue de secours toute l'année, et je ne le ferai que si c'est préparé. »",
      },
    ],
    question: "Comment répondez-vous à la pression ?",
    options: [
      {
        t: "Acheter les sorties de caisse des magasins Celtis et les mettre sur la table",
        d: `${euros(COUTS.donnees)}, livrées sous dix jours.`,
      },
      {
        t: "Proposer de retirer vous-même trois références faibles pour sauver les autres",
        d: `Trois yaourts aromatisés, ${kE(RETRAIT.ca)} de chiffre d'affaires chez Celtis : la liste passe de douze à neuf.`,
      },
      {
        t: "Faire appeler le directeur des achats de Celtis par le président",
        d: "Lénaïc Guivarc'h appelle Philéas Correia cette semaine.",
      },
      {
        t: "Ne rien faire : Celtis ne se passera pas d'une marque qui pèse 20 M€",
        d: "On attend le rendez-vous de la semaine 9.",
      },
    ],
    reactions: [
      [
        {
          ...CYRIELLE,
          texte: "Je regarderai vos chiffres. Je ne promets rien.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "C'est un geste que j'apprécie. Il reste neuf références sur ma liste.",
        },
      ],
      [
        {
          ...PHILEAS,
          texte:
            "Monsieur Guivarc'h, j'ai bien noté votre appel. Je demande à Cyrielle de remettre en rayon ce qui en a été retiré pendant la discussion ; j'attends en retour un geste sur le prix.",
        },
      ],
      [
        {
          ...NAIM,
          texte: "D'accord. Je surveille les commandes de Celtis chaque matin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "Le dernier rendez-vous",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...CYRIELLE,
        heure: "09:00",
        alerte: true,
        texte: `Voici ma dernière offre : ${ctx.offreFinale} sur l'ensemble de la marque, et les douze références restent en rayon. C'est à prendre maintenant ; au-delà, je ne garantis rien pour le 1er mars.`,
      },
      {
        ...IWAN,
        heure: "11:40",
        texte: `Pour mémoire : un point de prix, c'est ${kE(VALEUR_DU_POINT)} de marge par an sur Celtis. Au prix de son offre, la marge annuelle de la marque chez Celtis serait de ${ctx.margeOffre}.`,
      },
      {
        ...YANNIG,
        heure: "14:00",
        texte: "Tu as carte blanche. Mais je veux comprendre ce que nous risquons.",
      },
    ],
    sources: [
      {
        id: "simulation",
        titre: "Faire simuler par le contrôle de gestion chaque issue possible",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Amadou Perrotte : à la dernière offre de Celtis (${ctx.offreFinale}), la marge annuelle de la marque chez Celtis serait de ${ctx.margeOffre}. Avec la part agricole entière (${pct(PART_AGRICOLE)}), ${kE(margeAnnuelle(PART_AGRICOLE))} ; avec la part agricole et un point de plus contre le plan d'affaires, ${kE(margeAnnuelle(HAUSSE_DU_PLAN))}. Si Celtis retirait les neuf références faibles pendant ${enLettres(DEREFERENCEMENT.partiel)} semaines, nous perdrions environ ${kE(PERTE_DU_PARTIEL)} de marge sur l'année, clients qui ne reviennent pas compris. Les trois leaders, Celtis ne peut pas s'en passer longtemps. Et Celtis peut aussi refuser de signer : plus nous demandons, plus le risque monte.`,
      },
      {
        id: "rumeur",
        titre: "Écouter ce qui se dit à la centrale sur Nordal",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Naïm : « On dit à la centrale que Nordal aurait signé à +1 %. Personne n'a vu la convention, et Nordal n'a pas de contrat indexé avec ses producteurs dans la région. »",
      },
    ],
    question: "Que mettez-vous sur la table au dernier rendez-vous ?",
    options: [
      {
        t: "Accepter la dernière offre de Celtis pour garder les douze références",
        d: "La convention est signée cette semaine, au prix de l'acheteuse.",
      },
      {
        t: "Tenir la part agricole et échanger le reste contre vos contreparties",
        d: "La part agricole entière, et ce que les contreparties justifient sur le reste. Celtis répondra d'ici le 1er mars.",
      },
      {
        t: "Signer la part agricole seule, sans rien demander d'autre",
        d: "Ce que Celtis aura du mal à contester ; le reste de la hausse est abandonné.",
      },
      {
        t: "Maintenir les CGV entières : +5,8 %, ou le déréférencement",
        d: "Votre position de décembre, sans concession.",
      },
    ],
    reactions: [
      [
        {
          ...CYRIELLE,
          texte:
            "Parfait. La convention part à la signature cette semaine ; les douze références restent en rayon.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "Je présente votre proposition à ma direction. Réponse avant le 1er mars.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "C'est noté. Je dois la faire valider ; vous aurez la réponse avant le 1er mars.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "Alors nous en reparlerons le 1er mars.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · lundi",
    titre: "Avant le 1er mars",
    jusqua: 13,
    messages: (ctx) =>
      ctx.signe
        ? [
            {
              ...NAIM,
              heure: "09:00",
              texte: `La convention avec Celtis est signée à ${ctx.offreFinale}. L'acheteuse veut déjà caler les opérations de mars ; Opaline a eu vent de notre prix et demande un rendez-vous.`,
            },
            {
              ...MEVENA,
              heure: "11:30",
              texte:
                "Pour Celtis, tout est signé. Je propose quand même que nous écrivions ce que nous ferions, l'an prochain, si une centrale ne signait pas au 1er mars.",
            },
          ]
        : [
            {
              ...CYRIELLE,
              heure: "09:00",
              alerte: true,
              texte:
                "Monsieur Haddadi, ma direction attend votre signature à notre prix. Le 1er mars, si rien n'est signé, la liste des références retirées partira aux magasins.",
            },
            {
              ...MEVENA,
              heure: "11:30",
              texte:
                "Si rien n'est signé au 1er mars, la loi nous laisse deux voies : arrêter de livrer, ou demander un préavis et saisir le médiateur des relations commerciales agricoles. Il faut décider maintenant de ce que nous ferons.",
            },
            {
              de: "Tableau de bord commercial",
              role: "Point hebdomadaire",
              heure: "18:00",
              texte: `Semaine 10 : ${ctx.references} références en rayon chez Celtis ; dernière offre de Celtis ${ctx.offreFinale}, soit une marge annuelle de ${ctx.margeOffre}.`,
            },
          ],
    sources: [
      {
        id: "mediation",
        titre: "Demander à la juriste comment se passe une médiation",
        cout: 0.5,
        nature: "decisive",
        resultat: `Mévena Guégan : le médiateur des relations commerciales agricoles reçoit les deux parties sous quelques jours. Il ne tranche pas : il recommande. Une médiation dure en général ${enLettres(SEMAINES_DE_MEDIATION)} semaines, pendant lesquelles les livraisons continuent sans la hausse. Il retient la part agricole quand elle est justifiée par les indicateurs du contrat, mieux encore attestée, et cherche un point d'équilibre sur le reste, souvent à mi-chemin. Sans dossier prêt, une centrale préfère souvent retirer des références plutôt que d'aller devant lui ; et une fois sur trois, ce sont les douze.`,
      },
      {
        id: "repli",
        titre: "Voir avec Opaline ce que donnerait une mise en avant de la marque",
        cout: 0.5,
        nature: "utile",
        resultat: `Emerance Delafosse accepte de mettre en avant les leaders et les références que Celtis retirerait, pendant les semaines sans Celtis : têtes de gondole et prospectus, ${euros(COUTS.miseEnAvant)}, à déclencher seulement si Celtis déréférence. Avec cette mise en avant, ${taux(REPORT_PREPARE.leaders)} des acheteurs des leaders et ${taux(REPORT_PREPARE.faibles)} des acheteurs des autres références retrouveraient Kerbrélan, contre ${taux(LEADERS.report)} et ${taux(FAIBLES.report)} sans rien préparer.`,
      },
    ],
    question: "Que préparez-vous pour le 1er mars ?",
    options: [
      {
        t: "Prévenir Celtis que vous signerez son prix si rien n'est conclu le 28 février",
        d: "Plus de suspense : les douze références restent quoi qu'il arrive.",
      },
      {
        t: "Préparer la suite : un dossier pour le médiateur, et une mise en avant chez Opaline à déclencher si Celtis retire des références",
        d: `Rien n'est dépensé si Celtis signe ; ${euros(COUTS.miseEnAvant)} de mise en avant si elle déréférence.`,
      },
      {
        t: "Ne plus rien proposer : si Celtis veut déréférencer, qu'elle déréférence",
        d: "La laiterie ne cède plus rien d'ici le 1er mars, et le fait savoir.",
      },
      {
        t: "Attendre le 1er mars sans rien préparer",
        d: "On avisera selon la réponse de Celtis.",
      },
    ],
    reactions: [
      [
        {
          ...CYRIELLE,
          texte: "Merci de votre réalisme. Je le dirai à ma direction.",
        },
      ],
      [
        {
          ...MEVENA,
          texte:
            "Le dossier pour le médiateur est prêt : indicateurs, attestation s'il y en a une, compte rendu de chaque rendez-vous. Opaline attend notre feu vert.",
        },
      ],
      [
        {
          ...CYRIELLE,
          texte: "C'est votre choix. Le nôtre suivra.",
        },
      ],
      [
        {
          ...NAIM,
          texte: "On attend. Je garde mon téléphone allumé le 28 au soir.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Préparer, justifier, échanger", chemin: [1, 0, 0, 0, 1, 1] },
  { nom: "Céder pour garder les références", chemin: [0, 1, 1, 1, 0, 0] },
  { nom: "Attendre le 1er mars", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes de l'épisode, [décision, option] : céder pour garder les douze références (ouvrir
 * sur la baisse, ramener la part agricole, payer une coopération sans service, retirer soi-même
 * des références, signer la dernière offre, promettre de signer à l'échéance), ou rompre par
 * principe (refuser de discuter, exiger les CGV entières, laisser déréférencer).
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 0],
  [4, 3],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  deuxNouveautes: `Votre plan d'affaires tient la route. Celtis référence les deux nouveautés dès la signature, et je prends les deux opérations. Sur le reste de la hausse, nous en reparlerons au dernier rendez-vous.`,
  uneNouveaute: `Votre plan d'affaires tient la route, mais je ne prends qu'une nouveauté : le fromage blanc à la vanille fait doublon avec notre marque. Les deux opérations, je les prends. Sur le reste de la hausse, nous en reparlerons au dernier rendez-vous.`,
} as const;
