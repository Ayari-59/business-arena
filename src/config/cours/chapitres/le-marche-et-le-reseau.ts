import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  DELAI_DU_DIP_EN_JOURS,
  FORMES_DE_COMMERCE,
  FRANCHISE,
  GROUPEMENT_D_ACHAT,
  SECONDS_POINTS_DE_VENTE,
  SEUIL_DE_LA_CDAC_EN_M2,
  hausseQuiEgale,
  marcheLocal,
  moisSelonLaForme,
  passeDevantLaCdac,
  type FormeDeCommerce,
} from "../monde/reseau-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE MARCHÉ ET LE RÉSEAU (BTS MCO, bloc 2, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), son mois
 * de janvier et son résultat (monde/boutique.ts), son marché local et les réseaux qu'elle pourrait
 * rejoindre (monde/reseau-de-la-boutique.ts).
 *
 * L'objet : situer l'unité commerciale dans son marché (sa taille, la part de la boutique, le leader,
 * les marchés qui l'entourent, les canaux), puis la question du dirigeant : rester indépendante,
 * adhérer à un groupement d'achat, ou entrer dans une franchise. Le piège central : la franchise
 * achète moins cher et fait vendre plus, mais ses redevances se prennent sur tout le chiffre
 * d'affaires ; elle ne bat l'indépendance qu'à partir de 7 % de ventes en plus, et le groupement qu'à
 * partir de 9 %. Chez les franchisés comparables, la hausse observée est de 8 %.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, la-part-de-marche, les-marches, la-position (la question nomme les chiffres) ;
 *   · l'expérience avant la formule : predire-la-franchise puis la-franchise-au-curseur (la hausse des
 *     ventes qui rend la franchise aussi bonne que l'indépendance) avant les-trois-formes ;
 *   · autonome : les-trois-formes (ni formule ni chiffres donnés) ;
 *   · expert : le-laboratoire-du-reseau (la forme, un levier à choix, et la hausse ; le résultat en
 *     courbe), le-contrat, le-second-point-de-vente (le cadre légal qui change la décision), rejoindre ;
 *     puis la synthèse.
 */

export const ENTREPRISES_DU_RESEAU: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît le marché et le résultat du mois : le choix d'un réseau se joue chez elle, quelle que soit votre entreprise.";

export const CODE_DU_RESEAU = "le-marche-et-le-reseau";
export const TITRE_DU_RESEAU = "Le marché et le réseau";

/** Le départ du laboratoire : la franchise, sans hausse des ventes. */
export const DEPART_DU_LABORATOIRE = { forme: 3, hausse: 0 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Le rang d'une forme de commerce (à partir de 1), pour le levier à choix. */
export const rangDeLaForme = (forme: FormeDeCommerce) => FORMES_DE_COMMERCE.findIndex((x) => x.code === forme) + 1;
export const formeDuRang = (rang: number): FormeDeCommerce => FORMES_DE_COMMERCE[rang - 1]!.code;

/** Tout ce que le chapitre et son cas demandent. */
export function reseauDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = marcheLocal(f);
  const independante = moisSelonLaForme(f, "independante");
  const groupement = moisSelonLaForme(f, "groupement");
  const franchise = moisSelonLaForme(f, "franchise", FRANCHISE.hausseObservee);
  const franchiseSansHausse = moisSelonLaForme(f, "franchise", 0);
  return {
    f,
    m,
    partDeMarche: auDixieme(m.boutique.part * 100),
    partDuLeader: auDixieme(m.leader.part * 100),
    partRelative: auCentieme(m.partRelative),
    independante,
    groupement,
    franchise,
    franchiseSansHausse,
    hausseFaceAIndependante: hausseQuiEgale(f, "independante"),
    hausseFaceAuGroupement: hausseQuiEgale(f, "groupement", true),
    hausseObservee: FRANCHISE.hausseObservee * 100,
    tauxDesRedevances: (FRANCHISE.redevanceDExploitation + FRANCHISE.redevanceDeCommunication) * 100,
  };
}

/** Le marché local en janvier, acteur par acteur. */
export function tableauDuMarche(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = reseauDeLaBoutique(c);
  return {
    titre: `Le marché local de la maille, en ${x.f.moisDeReference} (hors taxes)`,
    colonnes: ["Forme ou canal", "Ventes du mois"],
    lignes: x.m.acteurs.map((a) => ({ libelle: a.nom, valeurs: [a.forme, eur(a.ventesDuMois)] })),
  };
}

/** Les conditions des deux réseaux. */
function tableauDesReseaux(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = reseauDeLaBoutique(c);
  return {
    titre: "Ce que proposent les deux réseaux",
    colonnes: ["Groupement d'achat", "Franchise"],
    lignes: [
      { libelle: "Remise de la centrale sur les achats", valeurs: [pct(GROUPEMENT_D_ACHAT.remiseCentrale * 100), pct(FRANCHISE.remiseCentrale * 100)] },
      { libelle: "Ce qu'on paie chaque mois", valeurs: [`${eur(GROUPEMENT_D_ACHAT.cotisationDuMois)} de cotisation`, `${pct(x.tauxDesRedevances)} du chiffre d'affaires`] },
      { libelle: "Droit d'entrée", valeurs: ["aucun", `${eur(FRANCHISE.droitDEntree)} sur ${qte(FRANCHISE.dureeDuContratEnMois)} mois`] },
      { libelle: "Enseigne commune", valeurs: ["non", `oui : ${pct(x.hausseObservee, 0)} de ventes en plus observés`] },
      { libelle: "Assortiment et aménagement", valeurs: ["libres", "ceux du franchiseur"] },
    ],
  };
}

/** Les trois formes, chiffrées, pour la synthèse. */
function tableauDesTroisFormes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = reseauDeLaBoutique(c);
  const ligne = (libelle: string, f: (m: typeof x.independante) => number) => ({ libelle, valeurs: [x.independante, x.groupement, x.franchise].map((m) => eur(f(m))) });
  return {
    titre: `Le mois de ${x.f.moisDeReference} selon la forme de commerce (franchise à ${pct(x.hausseObservee, 0)} de ventes en plus)`,
    colonnes: ["Indépendante", "Groupement", "Franchise"],
    lignes: [
      ligne("Marge sur coût variable", (m) => m.marge),
      ligne("Remise de la centrale", (m) => m.remise),
      ligne("Cotisation, redevances et droit d'entrée", (m) => -(m.cotisation + m.redevances + m.droitDEntreeDuMois)),
      ligne("Charges fixes", (m) => -m.chargesFixes),
      ligne("Résultat du mois", (m) => m.resultat),
    ],
  };
}

export const LE_MARCHE_ET_LE_RESEAU: Chapitre = {
  code: "le-marche-et-le-reseau",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale"],
  titre: TITRE_DU_RESEAU,
  accroche:
    "La boutique tient 7 % de son marché local, face à un centre commercial cinq fois plus gros et aux sites en ligne. Un groupement d'achat et une franchise lui font une offre : lequel rapporte le plus, et à quelle condition ?",
  objectifs: [
    "Mesurer la taille d'un marché local, la part de marché de l'unité commerciale et sa part relative face au leader",
    "Distinguer les marchés autour du produit et les formes de commerce et de distribution",
    "Chiffrer le résultat d'un point de vente indépendant, associé à un groupement ou franchisé",
    "Trouver la hausse des ventes qui rend une franchise rentable face à une autre forme",
    "Appliquer le cadre légal des contrats de distribution et de l'urbanisme commercial à une décision",
  ],
  libre: false,
  prerequis: ["seuil-du-point-de-vente"],
  ensuite: ["choisir-et-negocier-le-fournisseur"],
  entreprises: { codes: ENTREPRISES_DU_RESEAU, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une boutique dans son marché",
      notions: ["demand_market_share"],
      tableau: tableauDuMarche,
      texte: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, sur le mois de ${x.f.moisDeReference}. Elle vend ${eur(x.independante.chiffreDAffaires)} hors taxes et dégage un résultat de ${eur(x.independante.resultat)}, après ${eur(x.independante.chargesFixes)} de charges fixes.`,
          `Le marché, lui, est celui des ménages de sa zone de chalandise : leur dépense commercialisable en maille, ramenée hors taxes. La boutique y compte ses ventes en caisse, ${eur(x.m.boutique.ventesDuMois)} ; les ${eur(x.m.horsMarche)} des commandes des comités d'entreprise, qui ne sont pas des ménages, restent hors du marché.`,
          "Le tableau partage cette dépense entre les acteurs, d'après une étude de la fédération de l'habillement. La boutique y côtoie une succursale de chaîne, les enseignes du centre commercial de périphérie, les sites en ligne (revente d'occasion comprise), le rayon textile des hypermarchés et d'autres indépendants.",
          "Ce que la simulation suppose. Chaque forme de commerce se chiffre sur le mois de janvier. L'enseigne d'une franchise fait vendre plus : la hausse des ventes fait monter d'autant le chiffre d'affaires, la marge sur coût variable et les achats, pas les charges fixes.",
        ];
      },
      repere: () => "Part de marché = ventes de l'unité commerciale ÷ ventes de tout le marché. Part de marché relative = ventes de l'unité ÷ ventes du leader.",
    },
    {
      id: "la-part-de-marche",
      objectifs: [0],
      type: "montants",
      titre: "La taille du marché et la part de la boutique",
      notions: ["demand_market_share"],
      tableau: tableauDuMarche,
      question: () =>
        "Calculez la taille du marché local de la maille en janvier : la somme des ventes de tous les acteurs. Puis la part de marché de la boutique, en pourcentage au dixième, et sa part de marché relative face au leader, au centième.",
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          { libelle: "Taille du marché du mois", attendu: x.m.total, calcul: `${x.m.acteurs.map((a) => eur(a.ventesDuMois)).join(" + ")} = ${eur(x.m.total)}` },
          { libelle: "Part de marché de la boutique (%)", attendu: x.partDeMarche, tolerance: 0.1, calcul: `${eur(x.m.boutique.ventesDuMois)} ÷ ${eur(x.m.total)} × 100 = ${pct(x.partDeMarche)}` },
          { libelle: "Part de marché relative", attendu: x.partRelative, tolerance: 0.01, calcul: `${eur(x.m.boutique.ventesDuMois)} ÷ ${eur(x.m.leader.ventesDuMois)} (${x.m.leader.nom.toLowerCase()}) = ${qte(x.partRelative)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `La boutique tient ${pct(x.partDeMarche)} d'un marché de ${eur(x.m.total)} par mois. Le leader, ${x.m.leader.nom.toLowerCase()}, en tient ${pct(x.partDuLeader)} : la boutique pèse ${qte(x.partRelative)} fois le leader. Une part relative sous 1 dit qu'on n'est pas le leader ; elle dit aussi de combien.`,
        ];
      },
    },
    {
      id: "les-marches",
      objectifs: [1],
      type: "tri",
      titre: "Les marchés autour de la maille",
      notions: ["demand_market_share", "segmentation"],
      question: () =>
        "Rangez chaque dépense des ménages dans son marché. Le marché principal est celui du produit lui-même ; le marché environnant, ce qui répond au même besoin autrement ; le marché générique, le besoin lui-même ; le marché support, ce qu'il faut pour consommer le produit.",
      categories: [
        { code: "principal", libelle: "Marché principal" },
        { code: "environnant", libelle: "Marché environnant" },
        { code: "generique", libelle: "Marché générique" },
        { code: "support", libelle: "Marché support" },
      ],
      elements: (c) => reseauDeLaBoutique(c).m.marches.map((m) => ({ libelle: m.libelle, montant: m.depenseDuMois, categorie: m.marche, pourquoi: `Marché ${m.marche === "generique" ? "générique" : m.marche} : ${m.pourquoi}` })),
      relance: "Demandez-vous à quel besoin répond chaque dépense, et si elle remplace la maille ou l'accompagne.",
      explication: () => [
        "Le marché environnant est le plus dangereux pour la boutique : un client qui achète une polaire n'achète pas de pull. Le marché support est une occasion : vendre la lessive pour laine avec le mérinos fait un article de plus par passage.",
      ],
    },
    {
      id: "la-position",
      objectifs: [1],
      type: "choix",
      titre: "Ce que dit la structure du marché",
      notions: ["demand_market_share"],
      tableau: tableauDuMarche,
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        const enLigne = x.m.acteurs.find((a) => a.code === "sites-en-ligne")!;
        return `Le centre commercial tient ${pct(x.partDuLeader)} du marché, les sites en ligne ${pct(auDixieme(enLigne.part * 100))}, la boutique ${pct(x.partDeMarche)}. Quelle lecture en tirez-vous pour la boutique ?`;
      },
      options: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          {
            texte: "Un spécialiste face à de grands réseaux : se différencier",
            juste: true,
            retour: `Oui. Avec ${qte(x.partRelative)} fois les ventes du leader, la boutique ne gagnera pas sur le prix : elle gagne par la spécialisation (la maille, le conseil, la qualité) et par la proximité. C'est aussi pourquoi un réseau la tente : il apporte la puissance d'achat ou la notoriété qu'elle n'a pas seule.`,
          },
          {
            texte: "Un monopole local : elle peut fixer ses prix sans regarder les autres",
            juste: false,
            retour: `Non : elle tient ${pct(x.partDeMarche)} d'un marché où cinq autres acteurs vendent la même chose, et le concurrent de la rue affiche déjà moins cher.`,
          },
          {
            texte: "Un marché en déclin : il faut quitter la maille",
            juste: false,
            retour: "Rien ne le dit ici : une étude d'un seul mois ne mesure pas une tendance. Ce qu'elle mesure, c'est le partage du marché entre ses acteurs.",
          },
        ];
      },
    },
    {
      id: "consommaction",
      objectifs: [1],
      type: "choix",
      titre: "Les nouvelles attentes des clients",
      notions: ["segmentation"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        const enLigne = x.m.acteurs.find((a) => a.code === "sites-en-ligne")!;
        return `Les sites en ligne font ${eur(enLigne.ventesDuMois)} par mois, dont une part croissante de revente d'occasion. Des clientes demandent d'où vient la laine et dans quelles conditions les pulls sont tricotés. Comment nomme-t-on cette attente, et que peut en faire la boutique ?`;
      },
      options: () => [
        {
          texte: "La consommaction : informer sur l'origine, réparer, revendre",
          juste: true,
          retour:
            "Oui. Le consommateur devient acteur : il choisit, boycotte, revend, fait réparer. La boutique peut y répondre par l'information (l'origine, la composition, l'atelier local), des services (les retouches, la reprise des pulls usagés) et un assortiment qui le montre.",
        },
        {
          texte: "Le marketing de masse : baisser les prix pour retenir ces clientes",
          juste: false,
          retour: "Non : ces clientes ne cherchent pas le prix le plus bas, elles cherchent une raison d'acheter. Baisser les prix ne répond pas à leur question.",
        },
        {
          texte: "Un effet de mode sans conséquence pour un point de vente",
          juste: false,
          retour: "Le marché le dit autrement : la revente d'occasion prend des ventes à la maille neuve. C'est une orientation du marché, à laquelle l'offre doit répondre.",
        },
      ],
    },
    {
      id: "les-canaux",
      objectifs: [1],
      type: "choix",
      titre: "Un canal, plusieurs canaux, ou tous à la fois",
      notions: ["segmentation"],
      question: () =>
        "La boutique veut vendre aussi en ligne. Une cliente regarde un cardigan sur la vitrine en ligne, le réserve, vient l'essayer en boutique, le paie en caisse, et sa carte de fidélité compte l'achat, quel que soit le canal. Comment s'appelle cette organisation ?",
      options: () => [
        {
          texte: "L'omnicanal : un seul parcours, quel que soit le canal",
          juste: true,
          retour:
            "Oui. En multicanal, la boutique et le site vendent chacun de leur côté. En cross-canal, le client passe de l'un à l'autre (réserver en ligne, retirer en boutique). En omnicanal, les canaux partagent le stock, les prix, le fichier clients et la fidélité. Le circuit, lui, reste court : un seul intermédiaire, la boutique, entre le façonnier et le client.",
        },
        {
          texte: "Le multicanal : la boutique et le site, deux canaux qui s'ignorent",
          juste: false,
          retour: "Non : en multicanal, le site et la boutique vendent chacun de leur côté. Ici, la cliente passe d'un canal à l'autre, et sa carte la suit.",
        },
        {
          texte: "Le circuit long : un grossiste entre le façonnier et la boutique",
          juste: false,
          retour: "Non : le circuit dit combien d'intermédiaires séparent le producteur du client. La boutique achète au façonnier : un seul intermédiaire, c'est un circuit court.",
        },
      ],
    },
    {
      id: "predire-la-franchise",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la franchise",
      notions: ["contribution_margin", "fixed_costs"],
      tableau: tableauDesReseaux,
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Avant de calculer, pariez. La centrale du franchiseur achète ${pct(FRANCHISE.remiseCentrale * 100, 0)} moins cher, mais les redevances prennent ${pct(x.tauxDesRedevances, 0)} du chiffre d'affaires. Sans vente de plus, la franchise laisserait…`;
      },
      options: (c) => {
        const x = reseauDeLaBoutique(c);
        const voir = "Faites jouer l'enseigne à l'étape suivante : le curseur montre la hausse des ventes qu'il faut.";
        return [
          { texte: "Moins : les redevances coûtent plus que la remise", juste: x.franchiseSansHausse.resultat < x.independante.resultat, retour: `Bon pari. ${voir}` },
          { texte: "Autant : la remise de la centrale paie juste les redevances", juste: x.franchiseSansHausse.resultat === x.independante.resultat, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus : la centrale achète moins cher que les façonniers", juste: x.franchiseSansHausse.resultat > x.independante.resultat, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-franchise-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Ce que l'enseigne doit faire vendre",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Faites varier la hausse des ventes que l'enseigne apporte, de 0 à 20 %. Une courbe donne le résultat du mois en franchise, l'autre le résultat de la boutique indépendante (${eur(x.independante.resultat)}). Placez le curseur sur la plus petite hausse où la franchise laisse au moins autant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Hausse des ventes apportée par l'enseigne", unite: "%" }),
      cible: (c) => ({ attendu: reseauDeLaBoutique(c).hausseFaceAIndependante, min: 0, max: 20 }),
      zones: ["La franchise laisse au moins autant", "L'indépendance laisse plus"],
      rates: () => ({
        dessous: "À cette hausse, les redevances prennent encore plus que ce que la franchise rapporte.",
        dessus: "La franchise laisse déjà autant avec moins de ventes en plus : cherchez la plus petite hausse.",
      }),
      montrer: "Montrer la hausse qui suffit",
      lecture: (c, h) => {
        const x = reseauDeLaBoutique(c);
        const r = moisSelonLaForme(x.f, "franchise", h / 100);
        return [
          { libelle: "Marge sur coût variable", montant: r.marge },
          { libelle: "Remise de la centrale", montant: r.remise },
          { libelle: "Redevances", montant: r.redevances },
          { libelle: "Résultat en franchise", montant: r.resultat },
          { libelle: "Résultat de l'indépendante", montant: x.independante.resultat },
          { libelle: "Écart avec l'indépendante", montant: Math.round((r.resultat - x.independante.resultat) * 100) / 100, fort: true },
        ];
      },
      droites: (c) => {
        const x = reseauDeLaBoutique(c);
        return { produit: (h) => moisSelonLaForme(x.f, "franchise", h / 100).resultat, cout: () => x.independante.resultat, libelles: ["Résultat en franchise", "Résultat de l'indépendante"] };
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Il faut ${pct(x.hausseFaceAIndependante, 0)} de ventes en plus. Sans hausse, la franchise laisse ${eur(x.franchiseSansHausse.resultat)} : la remise de la centrale (${eur(x.franchiseSansHausse.remise)}) ne paie pas les redevances (${eur(x.franchiseSansHausse.redevances)}) et le droit d'entrée. Chaque point de ventes en plus ajoute de la marge, mais aussi des redevances : c'est la marge, pas le chiffre d'affaires, qui doit les payer.`,
        ];
      },
    },
    {
      id: "les-trois-formes",
      objectifs: [2],
      type: "montants",
      titre: "Le résultat des trois formes",
      notions: ["contribution_margin", "fixed_costs"],
      tableau: tableauDesReseaux,
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Sans formule cette fois. Les franchisés des villes comparables vendent ${pct(x.hausseObservee, 0)} de plus la première année. Calculez le résultat du mois de la boutique adhérente du groupement, la remise de la centrale du franchiseur, ses redevances, puis le résultat du mois en franchise à cette hausse.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const g = x.groupement;
        const fr = x.franchise;
        return [
          { libelle: "Résultat du mois au groupement", attendu: g.resultat, calcul: `${eur(x.independante.resultat)} + ${eur(g.achats)} × ${pct(GROUPEMENT_D_ACHAT.remiseCentrale * 100, 0)} − ${eur(g.cotisation)} = ${eur(x.independante.resultat)} + ${eur(g.remise)} − ${eur(g.cotisation)} = ${eur(g.resultat)}` },
          { libelle: "Remise de la centrale du franchiseur", attendu: fr.remise, calcul: `${eur(x.independante.achats)} × ${qte(1 + fr.hausse)} = ${eur(fr.achats)} d'achats ; × ${pct(FRANCHISE.remiseCentrale * 100, 0)} = ${eur(fr.remise)}` },
          { libelle: "Redevances du mois", attendu: fr.redevances, calcul: `${eur(x.independante.chiffreDAffaires)} × ${qte(1 + fr.hausse)} = ${eur(fr.chiffreDAffaires)} ; × ${pct(x.tauxDesRedevances, 0)} = ${eur(fr.redevances)}` },
          {
            libelle: "Résultat du mois en franchise",
            attendu: fr.resultat,
            calcul: `${eur(fr.marge)} de marge + ${eur(fr.remise)} − ${eur(fr.redevances)} − ${eur(fr.droitDEntreeDuMois)} de droit d'entrée − ${eur(fr.chargesFixes)} = ${eur(fr.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Indépendante, ${eur(x.independante.resultat)} ; au groupement, ${eur(x.groupement.resultat)} ; en franchise, à ${pct(x.hausseObservee, 0)} de ventes en plus, ${eur(x.franchise.resultat)}. La franchise bat l'indépendance, mais pas le groupement : sa remise est plus forte, ses redevances la mangent.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-reseau",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du réseau",
      notions: ["contribution_margin", "fixed_costs"],
      question: () =>
        "Choisissez la forme de commerce et faites varier la hausse des ventes que l'enseigne apporte (elle ne joue qu'en franchise : le groupement n'a pas d'enseigne). Le tableau suit la remise, ce qu'on paie au réseau et le résultat ; le graphique trace le résultat des trois formes selon la hausse. Puis relevez le défi.",
      leviers: () => [
        { code: "forme", libelle: "Forme de commerce", unite: "", min: 1, max: FORMES_DE_COMMERCE.length, pas: 1, depart: DEPART_DU_LABORATOIRE.forme, choix: FORMES_DE_COMMERCE.map((x) => ({ valeur: rangDeLaForme(x.code), libelle: x.libelle })) },
        { code: "hausse", libelle: "Hausse des ventes apportée par l'enseigne", unite: "%", min: 0, max: 20, pas: 1, depart: DEPART_DU_LABORATOIRE.hausse },
      ],
      lecture: (c, p) => {
        const x = reseauDeLaBoutique(c);
        const r = moisSelonLaForme(x.f, formeDuRang(p.forme!), p.hausse! / 100);
        const d = moisSelonLaForme(x.f, formeDuRang(DEPART_DU_LABORATOIRE.forme), DEPART_DU_LABORATOIRE.hausse / 100);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: r.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Marge sur coût variable", montant: r.marge, reference: d.marge },
          { libelle: "Remise de la centrale", montant: r.remise, reference: d.remise },
          { libelle: "Payé au réseau", montant: Math.round((r.cotisation + r.redevances + r.droitDEntreeDuMois) * 100) / 100, reference: Math.round((d.cotisation + d.redevances + d.droitDEntreeDuMois) * 100) / 100 },
          { libelle: "Résultat du mois", montant: r.resultat, reference: d.resultat, fort: true },
          { libelle: "Écart avec le groupement", montant: Math.round((r.resultat - x.groupement.resultat) * 100) / 100, reference: Math.round((d.resultat - x.groupement.resultat) * 100) / 100, effet: true },
        ];
      },
      graphique: (c) => {
        const x = reseauDeLaBoutique(c);
        return {
          levier: "hausse",
          courbes: [
            { libelle: "Indépendante", valeur: () => x.independante.resultat },
            { libelle: "Groupement", valeur: () => x.groupement.resultat },
            { libelle: "Franchise", valeur: (p) => moisSelonLaForme(x.f, "franchise", p.hausse! / 100).resultat },
          ],
        };
      },
      defi: (c) => {
        const x = reseauDeLaBoutique(c);
        const franchise = (h: number) => moisSelonLaForme(x.f, "franchise", h / 100).resultat;
        return {
          consigne: "Trouvez la forme et la plus petite hausse des ventes où la boutique laisse strictement plus qu'au groupement.",
          atteint: (p) => formeDuRang(p.forme!) === "franchise" && franchise(p.hausse!) > x.groupement.resultat && (p.hausse! === 0 || franchise(p.hausse! - 1) <= x.groupement.resultat),
          indice: (p) => {
            const forme = formeDuRang(p.forme!);
            if (forme !== "franchise") return `${forme === "groupement" ? "Le groupement ne peut pas battre le groupement" : "L'indépendante laisse moins que le groupement"}, quelle que soit la hausse : seule l'enseigne d'un franchiseur fait vendre plus.`;
            const r = franchise(p.hausse!);
            if (r <= x.groupement.resultat) return `À ${pct(p.hausse!, 0)} de hausse, la franchise laisse ${eur(r)}, pas plus que le groupement (${eur(x.groupement.resultat)}) : montez la hausse.`;
            return `À ${pct(p.hausse!, 0)}, la franchise dépasse déjà le groupement ; elle le dépassait aussi un point plus bas : cherchez la plus petite hausse.`;
          },
          solution: { forme: rangDeLaForme("franchise"), hausse: x.hausseFaceAuGroupement },
        };
      },
      montrer: "Montrer la hausse qui bat le groupement",
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Il faut ${pct(x.hausseFaceAuGroupement, 0)} de ventes en plus pour que la franchise dépasse le groupement, et ${pct(x.hausseFaceAIndependante, 0)} pour qu'elle dépasse l'indépendance. Les franchisés comparables observent ${pct(x.hausseObservee, 0)} : la franchise est entre les deux.`,
          "Le groupement donne un gain sûr, qui ne dépend d'aucune vente de plus ; la franchise parie sur la notoriété de l'enseigne. Plus la hausse attendue est incertaine, plus le groupement est prudent.",
        ];
      },
    },
    {
      id: "le-contrat",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le contrat engage",
      notions: ["fixed_costs"],
      question: () =>
        "Le franchiseur presse la dirigeante : « Signez cette semaine, je vous enverrai le document d'information après. » Que dit le droit des contrats de distribution ?",
      options: () => [
        {
          texte: `Un document d'information, au moins ${DELAI_DU_DIP_EN_JOURS} jours avant de signer`,
          juste: true,
          retour: `Oui. La loi Doubin oblige le franchiseur à remettre un document d'information précontractuel (son expérience, son réseau, les comptes, les conditions) au moins ${DELAI_DU_DIP_EN_JOURS} jours avant la signature ou le premier versement. Le franchisé reste un commerçant indépendant, propriétaire de son fonds, mais il suit le concept et paie les redevances ; l'associé d'un groupement, lui, garde son assortiment et vote à l'assemblée de la coopérative.`,
        },
        {
          texte: "Rien ne l'oblige : le contrat de franchise est libre",
          juste: false,
          retour: `Non : le code de commerce impose une information précontractuelle, ${DELAI_DU_DIP_EN_JOURS} jours au moins avant de s'engager.`,
        },
        {
          texte: "La franchise fait de la boutique une succursale du franchiseur",
          juste: false,
          retour: "Non : une succursale appartient à la chaîne (le commerce intégré). La franchise est du commerce associé à un réseau : le franchisé reste propriétaire de sa boutique.",
        },
      ],
    },
    {
      id: "le-second-point-de-vente",
      objectifs: [4],
      type: "choix",
      titre: "Ouvrir un second point de vente",
      notions: ["fixed_costs"],
      question: () => {
        const [galerie, usine] = SECONDS_POINTS_DE_VENTE;
        return `La dirigeante étudie deux projets : ${galerie.libelle.toLowerCase()}, ou ${usine.libelle.toLowerCase()}. Lequel demande une autorisation d'exploitation commerciale ?`;
      },
      options: () => {
        const [galerie, usine] = SECONDS_POINTS_DE_VENTE;
        return [
          {
            texte: `Le magasin d'usine seul : ${qte(usine.surface)} m², au-dessus de ${qte(SEUIL_DE_LA_CDAC_EN_M2)} m²`,
            juste: passeDevantLaCdac(usine.surface) && !passeDevantLaCdac(galerie.surface),
            retour: `Oui. La création d'un commerce de détail de plus de ${qte(SEUIL_DE_LA_CDAC_EN_M2)} m² de surface de vente passe devant la commission départementale d'aménagement commercial, qui pèse son effet sur le centre-ville, les déplacements et l'environnement. Le projet devient plus long, plus incertain, plus cher : cela compte dans la décision.`,
          },
          {
            texte: "Les deux : toute ouverture de commerce passe devant la commission",
            juste: false,
            retour: `Non : sous ${qte(SEUIL_DE_LA_CDAC_EN_M2)} m² de surface de vente, une boutique s'ouvre sans autorisation d'exploitation commerciale (il reste le bail, l'urbanisme et la sécurité).`,
          },
          {
            texte: "Aucun : le centre commercial existe déjà",
            juste: false,
            retour: `Pour la galerie, l'ensemble commercial est déjà autorisé ; mais le magasin d'usine crée ${qte(usine.surface)} m² de vente en zone d'activité : il passe devant la commission.`,
          },
        ];
      },
    },
    {
      id: "rejoindre",
      objectifs: [2, 3],
      type: "choix",
      titre: "Rejoindre un réseau ?",
      notions: ["contribution_margin", "fixed_costs"],
      tableau: tableauDesTroisFormes,
      question: () => "La dirigeante vous demande votre avis : rester indépendante, adhérer au groupement, ou entrer dans la franchise ?",
      options: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          {
            texte: `Le groupement : ${eur(x.groupement.resultat)} par mois, sans pari sur les ventes`,
            juste: true,
            retour: `Oui. Le groupement ajoute ${eur(x.groupement.resultat - x.independante.resultat)} par mois sans rien demander aux ventes, et laisse l'assortiment libre. La franchise ne ferait mieux qu'au-delà de ${pct(x.hausseFaceAuGroupement - 1, 0)} de ventes en plus ; les franchisés comparables en observent ${pct(x.hausseObservee, 0)}.`,
          },
          {
            texte: `La franchise : ${pct(x.hausseObservee, 0)} de ventes en plus, c'est plus de chiffre`,
            juste: false,
            retour: `Plus de chiffre, oui (${eur(x.franchise.chiffreDAffaires)}), mais ${eur(x.franchise.resultat)} de résultat, moins qu'au groupement : les redevances se paient sur tout le chiffre d'affaires.`,
          },
          {
            texte: "Rester indépendante : un réseau coûte toujours plus qu'il ne rapporte",
            juste: false,
            retour: `Non : le groupement rapporte ${eur(x.groupement.resultat - x.independante.resultat)} de plus par mois. Un réseau se juge sur ce qu'il fait au résultat.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "contribution_margin"],
      tableau: tableauDesTroisFormes,
      texte: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Le marché se mesure avant de se conquérir : ${eur(x.m.total)} par mois, dont ${pct(x.partDeMarche)} pour la boutique, ${qte(x.partRelative)} fois le leader. Autour du marché principal, les marchés environnant, générique et support disent ce qui remplace la maille et ce qui l'accompagne.`,
          `Une forme de commerce se juge au résultat : le groupement ajoute sa remise moins sa cotisation ; la franchise ajoute la remise de sa centrale et les ventes de son enseigne, moins des redevances prises sur tout le chiffre d'affaires. Ici, la franchise bat l'indépendance à partir de ${pct(x.hausseFaceAIndependante, 0)} de ventes en plus et le groupement à partir de ${pct(x.hausseFaceAuGroupement, 0)}. Le droit encadre ces choix : information ${DELAI_DU_DIP_EN_JOURS} jours avant de signer une franchise, autorisation de la commission départementale au-delà de ${qte(SEUIL_DE_LA_CDAC_EN_M2)} m².`,
          "Au niveau de l'examen, vous savez mesurer un marché et une part de marché, et situer l'unité commerciale face au leader. Vous distinguez les marchés, les canaux et les formes de commerce ; vous chiffrez le résultat de chaque forme et la hausse des ventes qui rend une franchise rentable ; vous appliquez le cadre légal des contrats et de l'urbanisme commercial.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Résultat au groupement = résultat + remise sur les achats − cotisation. Résultat en franchise = marge × (1 + hausse) + remise sur les achats × (1 + hausse) − redevances × chiffre d'affaires × (1 + hausse) − droit d'entrée du mois − charges fixes.",
    },
  ],
};
