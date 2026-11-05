import { margesDeLaGamme, seuilDuPointDeVente } from "./boutique";
import { zoneDeChalandise } from "./clientele-de-la-boutique";
import type { FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE MARCHÉ DE MAILLE & CO ET LE RÉSEAU QU'ELLE POURRAIT REJOINDRE (BTS MCO, bloc 2,
 * chapitre « Le marché et le réseau »).
 *
 * La boutique (monde/maille-et-co.ts) vend en janvier 87 450 € hors taxes, dont 77 250 € en caisse.
 * Ce module pose ce que la fiche ne dit pas encore, chaque hypothèse nommée et commentée : le partage
 * entre ses acteurs du marché local de la maille (sa taille est celle de la zone de chalandise), les marchés qui l'entourent, les conditions d'un groupement d'achat et d'une
 * franchise, et les seuils de l'urbanisme commercial et du contrat de franchise. Les chiffres de la
 * boutique (le chiffre d'affaires, la marge sur coût variable, les achats, les charges fixes, le
 * résultat du mois) ne sont jamais réécrits : ils se lisent dans le modèle (monde/boutique.ts).
 *
 * LE CALCUL DES TROIS FORMES DE COMMERCE, SUR LE MOIS DE JANVIER :
 *   · indépendante : le résultat du mois de la boutique (13 555 €) ;
 *   · au groupement d'achat : la remise de la centrale sur les achats du mois, moins la cotisation ;
 *   · en franchise : la remise de la centrale du franchiseur, moins les redevances (en pourcentage du
 *     chiffre d'affaires) et la part du mois du droit d'entrée ; l'enseigne fait vendre plus (une
 *     hausse des ventes, en pourcentage, qui fait monter d'autant le chiffre d'affaires, la marge sur
 *     coût variable et les achats).
 * Tout est au centime ; les taux ne sont pas arrondis.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─────────────────────────────────────────────────────────────────────────────
// LE MARCHÉ LOCAL DE LA MAILLE
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDActeurDuMarche = "boutique" | "enseigne-de-la-rue" | "centre-commercial" | "sites-en-ligne" | "grandes-surfaces" | "independants";

export interface ActeurDuMarche {
  code: CodeDActeurDuMarche;
  nom: string;
  /** La forme de commerce ou le canal. */
  forme: string;
  /**
   * Ce qu'il vend en maille aux ménages de la zone en janvier, hors taxes. Null : la boutique (sa caisse,
   * lue sur la fiche) ou les autres indépendants (le reste du marché, une fois les autres acteurs comptés).
   */
  ventesDuMois: number | null;
}

/**
 * LE MARCHÉ LOCAL DE LA MAILLE EN JANVIER : la dépense commercialisable des trois zones de chalandise
 * (monde/clientele-de-la-boutique.ts, `zoneDeChalandise`), ramenée hors taxes. Un seul marché dans le
 * cours : celui de la zone. La boutique y compte ses ventes EN CAISSE, comme la zone de chalandise :
 * les commandes des comités d'entreprise ne sont pas des achats de ménages, elles restent hors du
 * marché (elles comptent, en revanche, dans le chiffre d'affaires et le résultat du mois).
 *
 * LES AUTRES ACTEURS (hypothèse du cours, d'après une étude de la fédération de l'habillement) : la
 * succursale de la rue, les enseignes du centre commercial de périphérie (le leader), les sites en
 * ligne (dont la revente d'occasion, un cinquième du marché), le rayon textile des hypermarchés ; les
 * autres indépendants font le reste.
 */
export const MARCHE_LOCAL_DE_LA_MAILLE: readonly ActeurDuMarche[] = [
  { code: "boutique", nom: "MAILLE & CO", forme: "Commerce indépendant de centre-ville", ventesDuMois: null },
  { code: "enseigne-de-la-rue", nom: "L'enseigne de prêt-à-porter de la rue", forme: "Succursale d'une chaîne intégrée", ventesDuMois: 165_000 },
  { code: "centre-commercial", nom: "Les enseignes du centre commercial", forme: "Chaînes et franchises de périphérie", ventesDuMois: 395_000 },
  { code: "sites-en-ligne", nom: "Les sites en ligne", forme: "Vente à distance et revente d'occasion", ventesDuMois: 230_000 },
  { code: "grandes-surfaces", nom: "Les hypermarchés", forme: "Rayon textile de la grande distribution", ventesDuMois: 125_000 },
  { code: "independants", nom: "Les autres indépendants", forme: "Merceries et boutiques de centre-ville", ventesDuMois: null },
];

export type CodeDeMarche = "principal" | "environnant" | "generique" | "support";

/**
 * LES MARCHÉS AUTOUR DE LA MAILLE, EN JANVIER (hypothèse du cours) : la dépense des ménages de la
 * zone, hors taxes. Le marché principal est celui de la maille (le marché local ci-dessus, lu sur la
 * zone : null ici) ; le marché environnant, ce qui répond au même besoin autrement ; le marché
 * générique, le besoin lui-même (s'habiller, environ sept fois la maille) ; le marché support, ce qu'il
 * faut pour consommer la maille.
 */
export const MARCHES_AUTOUR_DE_LA_MAILLE: readonly { libelle: string; marche: CodeDeMarche; depenseDuMois: number | null; pourquoi: string }[] = [
  { libelle: "Les pulls, cardigans, écharpes et bonnets en maille", marche: "principal", depenseDuMois: null, pourquoi: "c'est ce que vend la boutique, et ce que vendent ses concurrents directs." },
  { libelle: "Les sweat-shirts et les polaires", marche: "environnant", depenseDuMois: 520_000, pourquoi: "un autre produit qui tient chaud : un client peut le préférer à un pull." },
  { libelle: "La laine à tricoter soi-même", marche: "environnant", depenseDuMois: 48_000, pourquoi: "le même besoin, satisfait autrement : on tricote son pull au lieu de l'acheter." },
  { libelle: "L'habillement, tous vêtements confondus", marche: "generique", depenseDuMois: 7_900_000, pourquoi: "le besoin générique, s'habiller, dont la maille n'est qu'une réponse." },
  { libelle: "Les lessives et les soins pour la laine", marche: "support", depenseDuMois: 26_000, pourquoi: "ce qu'il faut pour porter et entretenir un pull en maille." },
];

/** Le marché local, acteur par acteur : la taille lue sur la zone, la boutique sur sa caisse, et les parts de marché. */
export function marcheLocal(f: FicheDeLaBoutique) {
  const z = zoneDeChalandise(f);
  const tva = 1 + f.gamme[0]!.tauxTva;
  const total = auCentime(z.depense / tva);
  const ventesDeLaBoutique = auCentime(z.chiffreEnCaisse / tva);
  const comptes = somme(MARCHE_LOCAL_DE_LA_MAILLE.map((a) => a.ventesDuMois ?? 0));
  const reste = auCentime(total - ventesDeLaBoutique - comptes);
  if (reste <= 0) throw new Error("Les acteurs du marché dépassent la dépense de la zone");
  const acteurs = MARCHE_LOCAL_DE_LA_MAILLE.map((a) => ({ ...a, ventesDuMois: a.ventesDuMois ?? (a.code === "boutique" ? ventesDeLaBoutique : reste) }));
  const avecParts = acteurs.map((a) => ({ ...a, part: a.ventesDuMois / total }));
  const leader = [...avecParts].sort((a, b) => b.ventesDuMois - a.ventesDuMois)[0]!;
  const boutique = avecParts.find((a) => a.code === "boutique")!;
  return {
    acteurs: avecParts,
    total,
    boutique,
    leader,
    /** Les commandes des comités, hors du marché des ménages : le chiffre d'affaires du mois moins la caisse. */
    horsMarche: auCentime(margesDeLaGamme(f).chiffreDAffaires - ventesDeLaBoutique),
    /** La part de marché relative : les ventes de la boutique rapportées à celles du leader. */
    partRelative: boutique.ventesDuMois / leader.ventesDuMois,
    /** Les marchés autour de la maille, le principal lu sur la zone. */
    marches: MARCHES_AUTOUR_DE_LA_MAILLE.map((m) => ({ ...m, depenseDuMois: m.depenseDuMois ?? total })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES FORMES DE COMMERCE : RESTER INDÉPENDANTE, S'ASSOCIER, SE FRANCHISER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE GROUPEMENT D'ACHAT (hypothèse du cours) : une coopérative de commerçants indépendants de
 * l'habillement, sans enseigne commune. Sa centrale négocie pour tous les associés : 5 % de remise sur
 * les achats ; chaque associé paie une cotisation de 800 € par mois. L'associé reste propriétaire de
 * son fonds, garde son nom et choisit son assortiment ; il a une voix à l'assemblée de la coopérative.
 */
export const GROUPEMENT_D_ACHAT = { remiseCentrale: 0.05, cotisationDuMois: 800 } as const;

/**
 * LA FRANCHISE (hypothèse du cours) : une enseigne nationale de maille. Sa centrale achète 8 % moins
 * cher ; le franchisé paie une redevance d'exploitation de 5 % et une redevance de communication de
 * 1 % de son chiffre d'affaires hors taxes, et un droit d'entrée de 24 000 €, compté ici sur les 60
 * mois du contrat (400 € par mois). L'enseigne fait vendre plus : chez les franchisés des villes
 * comparables, la hausse observée la première année est de 8 %. En échange, l'assortiment, les prix
 * conseillés et l'aménagement suivent le concept du franchiseur.
 */
export const FRANCHISE: ConditionsDeFranchise = {
  remiseCentrale: 0.08,
  redevanceDExploitation: 0.05,
  redevanceDeCommunication: 0.01,
  droitDEntree: 24_000,
  dureeDuContratEnMois: 60,
  hausseObservee: 0.08,
};

/** Les conditions d'une franchise : celles de l'enseigne du chapitre, ou d'une autre. */
export interface ConditionsDeFranchise {
  remiseCentrale: number;
  redevanceDExploitation: number;
  redevanceDeCommunication: number;
  droitDEntree: number;
  dureeDuContratEnMois: number;
  hausseObservee: number;
}

/**
 * LA SECONDE ENSEIGNE (hypothèse du cas « Une seconde enseigne frappe à la porte ») : une franchise de
 * prêt-à-porter qui ouvre un rayon maille. Sa centrale achète 6 % moins cher ; ses redevances font 4 %
 * du chiffre d'affaires (3 % d'exploitation, 1 % de communication) ; son droit d'entrée, 30 000 €, se
 * compte sur 60 mois. Elle promet 10 % de ventes en plus ; ses franchisés comparables en observent 6 %.
 */
export const SECONDE_ENSEIGNE: ConditionsDeFranchise & { haussePromise: number } = {
  remiseCentrale: 0.06,
  redevanceDExploitation: 0.03,
  redevanceDeCommunication: 0.01,
  droitDEntree: 30_000,
  dureeDuContratEnMois: 60,
  hausseObservee: 0.06,
  haussePromise: 0.1,
};

export type FormeDeCommerce = "independante" | "groupement" | "franchise";
export const FORMES_DE_COMMERCE: readonly { code: FormeDeCommerce; libelle: string }[] = [
  { code: "independante", libelle: "Rester indépendante" },
  { code: "groupement", libelle: "Adhérer au groupement d'achat" },
  { code: "franchise", libelle: "Entrer dans la franchise" },
];

/**
 * Le mois de janvier selon la forme de commerce, et la hausse des ventes que l'enseigne apporte (en
 * fraction ; elle ne joue qu'en franchise : le groupement n'a pas d'enseigne). La hausse fait monter
 * d'autant le chiffre d'affaires, la marge sur coût variable et les achats ; les charges fixes ne
 * bougent pas.
 */
export function moisSelonLaForme(f: FicheDeLaBoutique, forme: FormeDeCommerce, hausse = 0, franchise: ConditionsDeFranchise = FRANCHISE) {
  const s = seuilDuPointDeVente(f);
  const achatsDuMois = margesDeLaGamme(f).achatsVendus;
  const h = forme === "franchise" ? hausse : 0;
  const chiffreDAffaires = auCentime(s.chiffreDAffaires * (1 + h));
  const marge = auCentime(s.marge * (1 + h));
  const achats = auCentime(achatsDuMois * (1 + h));
  const remise = forme === "groupement" ? auCentime(achats * GROUPEMENT_D_ACHAT.remiseCentrale) : forme === "franchise" ? auCentime(achats * franchise.remiseCentrale) : 0;
  const redevances = forme === "franchise" ? auCentime(chiffreDAffaires * (franchise.redevanceDExploitation + franchise.redevanceDeCommunication)) : 0;
  const cotisation = forme === "groupement" ? GROUPEMENT_D_ACHAT.cotisationDuMois : 0;
  const droitDEntreeDuMois = forme === "franchise" ? auCentime(franchise.droitDEntree / franchise.dureeDuContratEnMois) : 0;
  const resultat = auCentime(marge + remise - redevances - cotisation - droitDEntreeDuMois - s.chargesFixes);
  return { forme, hausse: h, chiffreDAffaires, marge, achats, remise, redevances, cotisation, droitDEntreeDuMois, chargesFixes: s.chargesFixes, resultat };
}

/**
 * La plus petite hausse des ventes, en pourcentage entier, qui fait laisser à la franchise au moins
 * autant (ou strictement plus) que la forme de comparaison.
 */
export function hausseQuiEgale(f: FicheDeLaBoutique, face: FormeDeCommerce, strictement = false, franchise: ConditionsDeFranchise = FRANCHISE) {
  const cible = moisSelonLaForme(f, face).resultat;
  for (let p = 0; p <= 100; p++) {
    const r = moisSelonLaForme(f, "franchise", p / 100, franchise).resultat;
    if (strictement ? r > cible : r >= cible) return p;
  }
  throw new Error("Aucune hausse jusqu'à 100 % ne suffit");
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CADRE LÉGAL : LE CONTRAT DE FRANCHISE ET L'URBANISME COMMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE DOCUMENT D'INFORMATION PRÉCONTRACTUEL (loi Doubin, code de commerce, art. L. 330-3) : le
 * franchiseur le remet au moins 20 jours avant la signature du contrat ou le premier versement.
 */
export const DELAI_DU_DIP_EN_JOURS = 20;

/**
 * L'AUTORISATION D'EXPLOITATION COMMERCIALE (code de commerce, art. L. 752-1) : la création d'un
 * commerce de détail de plus de 1 000 m² de surface de vente passe devant la commission
 * départementale d'aménagement commercial (CDAC).
 */
export const SEUIL_DE_LA_CDAC_EN_M2 = 1_000;

/**
 * LES DEUX PROJETS DE SECOND POINT DE VENTE (hypothèse du cours) : une boutique de 180 m² dans la
 * galerie du centre commercial, ou un magasin d'usine de 1 200 m² partagé avec l'atelier local, en
 * zone d'activité.
 */
export const SECONDS_POINTS_DE_VENTE = [
  { code: "galerie", libelle: "Une boutique de 180 m² dans la galerie du centre commercial", surface: 180 },
  { code: "magasin-d-usine", libelle: "Un magasin d'usine de 1 200 m² en zone d'activité", surface: 1_200 },
] as const;

/** Le projet passe-t-il devant la CDAC ? */
export const passeDevantLaCdac = (surface: number) => surface > SEUIL_DE_LA_CDAC_EN_M2;
