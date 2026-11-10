import { auCentime } from "./amortissement";
import { cloture } from "./cloture";
import { prestationsReciproques } from "./couts-et-budgets";
import {
  ASSURANCE,
  COMPOSANTS_DE_DECEMBRE,
  ELECTRO_COMPOSANTS,
  EXERCICE_DE_NOVA,
  LIVRAISONS_DU_MOIS,
  MOIS_DE_L_EXERCICE,
  MONTANTS_DES_FACTURES_SONORA,
  SONORA,
} from "./exercice-de-nova";
import { NOVA_GESTION, type CentreAuxiliaire, type CentrePrincipal, type Cles, type CodeDeCentre } from "./nova-gestion";
import { valoriserLeStock, type FicheDeStock, type MethodeDeStock } from "./stock";

/**
 * LE MONDE DU COURS : LA COMPTABILITÉ DE GESTION DE NOVA SUR SON PREMIER EXERCICE.
 *
 * Deux chapitres la lisent : « Le coût complet pas à pas » (décembre N, de la répartition au
 * résultat analytique, la fiche de stock au coût moyen pondéré comprise) et « La concordance des
 * résultats » (l'exercice N, du résultat analytique au résultat de la comptabilité générale).
 *
 * AUCUN CHIFFRE NOUVEAU SUR CE QUI S'EST PASSÉ. Les ventes, les livraisons, les factures de
 * composants, la fiche de stock de décembre, le loyer, la paie, l'assurance et tous les comptes de
 * l'exercice viennent de exercice-de-nova.ts (et de cloture.ts, qui en fait le compte de résultat) ;
 * les centres d'analyse, leurs clés et leurs unités d'œuvre, de nova-gestion.ts ; les prestations
 * réciproques, de couts-et-budgets.ts. Ce fichier n'ajoute que des CHOIX DE LA COMPTABILITÉ DE
 * GESTION (ce qu'elle incorpore, ce qu'elle ajoute), un fait de l'inventaire permanent (un bon de
 * sortie), et la variante de décembre du premier chapitre, tous posés ci-dessous, nommés et
 * commentés. La garde tests/cours/le-cout-complet-pas-a-pas.test.ts refait chaque chiffre à la main,
 * et tests/cours/la-concordance-des-resultats.test.ts retrouve le résultat de l'exercice, au centime.
 *
 * LES RÈGLES DE CALCUL, celles d'un énoncé :
 *   · le coût d'une unité d'œuvre s'arrondit au centime, et chaque centre impute le nombre de ses
 *     unités d'œuvre multiplié par ce coût arrondi : l'écart avec le total du centre est une
 *     différence d'arrondi ;
 *   · les matières entrent en stock à leur coût d'achat (le prix et la part du centre
 *     approvisionnement) et en sortent au coût moyen unitaire pondéré de la période (la méthode de la
 *     fiche, METHODE_DE_STOCK), arrondi au centime : les sorties et le stock final ne refont pas
 *     exactement le disponible, et l'écart est une différence d'arrondi ;
 *   · NOVA fabrique ce qu'elle livre : une enceinte produite est une enceinte livrée, et le chiffre
 *     d'affaires du mois est celui des enceintes livrées, remises de Sonora déduites (c'est, mois
 *     par mois, le compte 701 de la clôture, factures à établir et produits constatés d'avance compris).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES CHOIX DE LA COMPTABILITÉ DE GESTION (hypothèses du cours)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA RÉMUNÉRATION DU PRÉSIDENT, UNE CHARGE SUPPLÉTIVE (hypothèse du cours). Les quatre salariés de
 * la paie sont les opérateurs de la ligne (ressources-humaines-de-nova.ts) ; le président, actionnaire,
 * ne se verse rien pendant ce premier exercice. La comptabilité générale ne connaît donc aucune
 * charge pour son travail ; la comptabilité de gestion en compte une, ce que coûterait un dirigeant
 * salarié pour le même travail, charges comprises : 4 200 € par mois. Sans elle, le coût d'une
 * enceinte dépendrait de ce que la dirigeante choisit de se payer.
 */
export const REMUNERATION_DE_LA_GERANTE = 4_200;

/**
 * Où va son travail (hypothèse du cours) : 70 % à l'administration, qu'elle dirige, 30 % à la
 * distribution (elle suit elle-même CampusTech et Sonora). Les 70 % tombent juste dans le système
 * des prestations réciproques : l'entretien reçoit 10 % de l'administration et cède 20 % de son
 * total, si bien que chaque euro posé à l'administration ajoute 0,1 ÷ 0,98 à l'entretien ; 2 940 €
 * lui en ajoutent exactement 300.
 */
export const CLES_DE_LA_GERANTE: Cles = { entretien: 0, administration: 0.7, approvisionnement: 0, production: 0, distribution: 0.3 };

/**
 * L'ASSURANCE DANS LA COMPTABILITÉ DE GESTION (hypothèse du cours, sur un fait de la fiche). La
 * prime de l'année, 6 000 € payés le 1er octobre, couvre douze mois (ASSURANCE) : 500 € par mois
 * couvert, d'octobre à décembre dans l'exercice (les 1 500 € du compte 616 après la charge constatée
 * d'avance). Elle couvre la ligne et le stock : 80 % à la production, 20 % à la distribution (les
 * marchandises transportées). Les centres auxiliaires n'en reçoivent rien.
 */
export const CLES_DE_L_ASSURANCE: Cles = { entretien: 0, administration: 0, approvisionnement: 0, production: 0.8, distribution: 0.2 };

/**
 * L'USURE DE LA LIGNE, UNE CHARGE SUBSTITUÉE (la fiche le dit déjà, exercice-de-nova.ts) : la
 * comptabilité de gestion compte 833 € par mois, douze mois pleins (nova-gestion.ts), quand la
 * comptabilité générale dote 9 861,11 € pour 355 jours de service. L'écart est une différence
 * d'incorporation.
 */
export const USURE_DE_GESTION_DU_MOIS = NOVA_GESTION.moisDeReference.chargesFixes.amortissement;

/**
 * LE BON DE SORTIE DU 24 DÉCEMBRE (un fait de l'inventaire permanent, hypothèse du cours). La ligne a
 * consommé 1 400 jeux en fin de mois (COMPOSANTS_DE_DECEMBRE) ; le magasinier en a sorti 1 410 sur
 * son bon, et les 10 jeux de trop sont revenus sur l'étagère sans bon de retour. La fiche de stock de
 * la comptabilité de gestion, tenue sur les bons, attend 590 jeux au 31 décembre ; l'inventaire
 * physique de la clôture en compte 600 (le stock final de la comptabilité générale, 13 500 €).
 */
export const JEUX_REVENUS_SANS_BON = 10;

/**
 * CE QUE LA COMPTABILITÉ DE GESTION N'INCORPORE PAS (hypothèse du cours). Elle mesure le coût de
 * l'exploitation courante :
 *   · ni les risques que la clôture a constatés, qui ne tiennent pas à l'activité normale : la
 *     dépréciation de la créance de Sonora (6817) et la provision pour le litige (6815) ;
 *   · ni le financement : les intérêts de l'emprunt (6611) et l'escompte accordé à Sonora (665),
 *     pas plus que les intérêts du placement (764), un produit qu'elle n'incorpore pas non plus ;
 *   · ni l'impôt sur les sociétés (695), qui dépend du résultat et non de ce qu'on produit.
 */
export const CHARGES_NON_INCORPOREES = [
  { compte: "6817", libelle: "La dépréciation de la créance de Sonora" },
  { compte: "6815", libelle: "La provision pour le litige" },
  { compte: "6611", libelle: "Les intérêts de l'emprunt" },
  { compte: "665", libelle: "L'escompte accordé à Sonora" },
  { compte: "695", libelle: "L'impôt sur les sociétés" },
] as const;
export const PRODUITS_NON_INCORPORES = [{ compte: "764", libelle: "Les intérêts du placement" }] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA VARIANTE DE DÉCEMBRE (hypothèse du cours, hors des comptes de l'exercice)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA VARIANTE DE DÉCEMBRE : DÉCHETS, REBUTS ET SOUS-PRODUIT. Le premier chapitre étudie, sur les
 * chiffres de décembre, ce que changerait une fabrication qui laisse des restes. Rien de cela n'est
 * dans les comptes de l'exercice (aucune vente de déchets ni de grilles n'y figure) : c'est une
 * variante, comme le contrat de maintenance du chapitre « Coût complet ». Tout le reste du mois ne
 * bouge pas.
 *   · LES REBUTS : 25 enceintes échouent au test acoustique et partent au rebut, sans valeur. Elles
 *     ont consommé chacune un jeu de composants, au coût moyen du mois ; le centre production garde
 *     ses charges, que les bonnes enceintes portent seules.
 *   · LES DÉCHETS VENDABLES : 60 kg de chutes de câble de cuivre, rachetées 5 € le kilo par un
 *     ferrailleur : leur prix diminue le coût de production.
 *   · LES DÉCHETS À ÉVACUER : les cartons et les mousses des jeux, et les rebuts : trois bennes à
 *     140 €, qui augmentent le coût de production.
 *   · LE SOUS-PRODUIT : chaque jeu livre deux grilles de façade, une noire et une grise ; NOVA ne
 *     monte que la noire. Les grilles grises des 2 400 bonnes enceintes, mises en lots, se vendent
 *     1,20 € pièce à des réparateurs, avec 0,20 € de conditionnement et d'expédition par grille et
 *     600 € par mois pour tenir l'annonce et préparer les lots. Leur valeur de réalisation (le prix
 *     de vente moins ces frais) se déduit du coût de production des enceintes. Non vendue, une
 *     grille s'évacue avec les cartons, à 0,05 € pièce.
 */
export const VARIANTE_DE_DECEMBRE = {
  rebuts: 25,
  dechetsVendables: { libelle: "les chutes de câble de cuivre", kilos: 60, prixDuKilo: 5 },
  evacuation: { bennes: 3, prixDeLaBenne: 140 },
  sousProduit: { libelle: "les grilles grises", prix: 1.2, fraisParGrille: 0.2, fraisDuMois: 600, evacuationParGrille: 0.05 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

const CENTRES: readonly CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];
const PRINCIPAUX: readonly CentrePrincipal[] = ["approvisionnement", "production", "distribution"];
const AUXILIAIRES: readonly CentreAuxiliaire[] = ["entretien", "administration"];
const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));
const parCentre = <T>(f: (c: CodeDeCentre) => T) => Object.fromEntries(CENTRES.map((c) => [c, f(c)])) as Record<CodeDeCentre, T>;
const parPrincipal = <T>(f: (c: CentrePrincipal) => T) => Object.fromEntries(PRINCIPAUX.map((c) => [c, f(c)])) as Record<CentrePrincipal, T>;

/** Les charges indirectes de la comptabilité de gestion, dans l'ordre du tableau de répartition. */
export type ChargeDeGestion = "loyer" | "personnel" | "amortissement" | "assurance" | "gerante";
export const CHARGES_DE_GESTION: readonly ChargeDeGestion[] = ["loyer", "personnel", "amortissement", "assurance", "gerante"];

export const CLES_DES_CHARGES: Readonly<Record<ChargeDeGestion, Cles>> = {
  ...NOVA_GESTION.centres.primaire,
  assurance: CLES_DE_L_ASSURANCE,
  gerante: CLES_DE_LA_GERANTE,
};

/** L'assurance d'un mois (0 pour janvier) : la prime de l'année étalée sur ses mois couverts, à partir de son mois. */
export const assuranceDuMois = (mois: number) => (mois >= ASSURANCE.date.mois - 1 ? auCentime(ASSURANCE.prime / ASSURANCE.moisCouverts) : 0);

/** Les charges indirectes d'un mois, avec une rémunération du président au choix (un levier). */
export function chargesDuMois(mois: number, gerante = REMUNERATION_DE_LA_GERANTE): Record<ChargeDeGestion, number> {
  const f = NOVA_GESTION.moisDeReference.chargesFixes;
  return { loyer: f.loyer, personnel: f.personnel, amortissement: USURE_DE_GESTION_DU_MOIS, assurance: assuranceDuMois(mois), gerante };
}

/** Le tableau de répartition d'un mois : primaire, prestations réciproques, cessions, centres principaux. */
export function repartitionDuMois(charges: Readonly<Record<ChargeDeGestion, number>>) {
  const parCharge = Object.fromEntries(CHARGES_DE_GESTION.map((k) => [k, parCentre((c) => auCentime(charges[k] * CLES_DES_CHARGES[k][c]))])) as Record<ChargeDeGestion, Record<CodeDeCentre, number>>;
  const primaire = parCentre((c) => somme(CHARGES_DE_GESTION.map((k) => parCharge[k][c])));
  const totaux = prestationsReciproques(NOVA_GESTION, primaire);
  const auxiliaires = { entretien: totaux.entretien, administration: totaux.administration };
  const s = NOVA_GESTION.centres.secondaire;
  const cessions = Object.fromEntries(AUXILIAIRES.map((x) => [x, parCentre((c) => auCentime(auxiliaires[x] * s[x][c]))])) as Record<CentreAuxiliaire, Record<CodeDeCentre, number>>;
  const principaux = parPrincipal((c) => somme([primaire[c], cessions.entretien[c], cessions.administration[c]]));
  return { charges, parCharge, primaire, auxiliaires, cessions, principaux, total: somme(CHARGES_DE_GESTION.map((k) => charges[k])) };
}

/** Un lot de matières entré dans le mois : la quantité, son prix d'achat, et le jour de l'entrée. */
interface Lot {
  libelle: string;
  jour: number;
  quantite: number;
  prix: number;
}

/** Ce que le mois peut faire varier : la rémunération du président, le prix du grossiste, la méthode du stock. */
export interface LeviersDeGestion {
  gerante: number;
  /** Le prix d'un jeu chez Composants Express, le grossiste du 18 décembre. */
  prixDuGrossiste: number;
  methode: MethodeDeStock;
}

const LEVIERS_DE_LA_FICHE: LeviersDeGestion = {
  gerante: REMUNERATION_DE_LA_GERANTE,
  prixDuGrossiste: COMPOSANTS_DE_DECEMBRE.mouvements.find((m) => m.sens === "entree" && m.date.jour === 18)!.prixUnitaire!,
  methode: EXERCICE_DE_NOVA.methodeDeStock,
};

/** Les lots du mois : la livraison d'Électro-Composants, et en décembre celle du grossiste. */
function lotsDuMois(mois: number, prixDuGrossiste: number): Lot[] {
  if (mois < 11) return [{ libelle: `livraison d'${ELECTRO_COMPOSANTS.nom}`, jour: ELECTRO_COMPOSANTS.jourDeFacturation, quantite: LIVRAISONS_DU_MOIS[mois]!, prix: ELECTRO_COMPOSANTS.prixDuJeu }];
  return COMPOSANTS_DE_DECEMBRE.mouvements
    .filter((m) => m.sens === "entree")
    .map((m) => ({ libelle: m.libelle, jour: m.date.jour, quantite: m.quantite, prix: m.date.jour === 18 ? prixDuGrossiste : m.prixUnitaire! }));
}

/** Le chiffre d'affaires d'un mois : les enceintes livrées au prix, moins la remise de Sonora le mois de ses factures. */
export function chiffreDAffairesDuMois(mois: number) {
  const remise = mois === SONORA.premiereCommande.date.mois - 1 ? MONTANTS_DES_FACTURES_SONORA.septembre.remise : mois === SONORA.secondeCommande.date.mois - 1 ? MONTANTS_DES_FACTURES_SONORA.octobre.remise : 0;
  return auCentime(LIVRAISONS_DU_MOIS[mois]! * EXERCICE_DE_NOVA.prixDeLEnceinte - remise);
}

/**
 * UN MOIS DE LA COMPTABILITÉ DE GESTION : la répartition, les unités d'œuvre et leur coût arrondi,
 * le coût d'achat des matières entrées, leur sortie (toutes, sauf en décembre, où la fiche de stock
 * les sort au coût moyen pondéré), le coût de production, le coût de revient, le résultat
 * analytique, et les différences d'arrondi du mois.
 */
export function moisDeGestion(mois: number, leviers: Partial<LeviersDeGestion> = {}) {
  const l = { ...LEVIERS_DE_LA_FICHE, ...leviers };
  const f = NOVA_GESTION;
  const r = repartitionDuMois(chargesDuMois(mois, l.gerante));
  const livrees = LIVRAISONS_DU_MOIS[mois]!;
  const chiffreDAffaires = chiffreDAffairesDuMois(mois);
  const lots = lotsDuMois(mois, l.prixDuGrossiste).map((lot) => ({ ...lot, achats: auCentime(lot.quantite * lot.prix) }));
  const achats = somme(lots.map((x) => x.achats));
  const u = f.centres.unitesDOeuvre;
  const valeurDe = { achats, quantite: livrees, chiffreDAffaires };
  const nombre = parPrincipal((c) => valeurDe[u[c].nature] / u[c].assiette);
  const cout = parPrincipal((c) => auCentime(r.principaux[c] / nombre[c]));
  // Le centre approvisionnement s'impute lot par lot : chaque lot porte ses unités d'œuvre.
  const lotsAuCoutDAchat = lots.map((x) => {
    const unites = x.achats / u.approvisionnement.assiette;
    const approvisionnement = auCentime(unites * cout.approvisionnement);
    const coutDAchat = auCentime(x.achats + approvisionnement);
    return { ...x, unites, approvisionnement, coutDAchat, coutUnitaire: auCentime(coutDAchat / x.quantite) };
  });
  const imputees = {
    approvisionnement: somme(lotsAuCoutDAchat.map((x) => x.approvisionnement)),
    production: auCentime(nombre.production * cout.production),
    distribution: auCentime(nombre.distribution * cout.distribution),
  };
  const coutDAchat = somme(lotsAuCoutDAchat.map((x) => x.coutDAchat));

  // Le stock : rien ne reste avant décembre ; en décembre, la fiche des bons de sortie.
  let stock: ReturnType<typeof ficheDeStockDeGestion> | null = null;
  let matieres = coutDAchat;
  if (mois === 11) {
    stock = ficheDeStockDeGestion(lotsAuCoutDAchat, l.methode);
    matieres = stock.sorties;
  }
  const autres = auCentime(livrees * f.moisDeReference.coutVariable.autres);
  const coutDeProduction = somme([matieres, autres, imputees.production]);
  const coutDeRevient = somme([coutDeProduction, imputees.distribution]);
  const resultat = auCentime(chiffreDAffaires - coutDeRevient);
  return {
    mois,
    nom: MOIS_DE_L_EXERCICE[mois]!,
    leviers: l,
    repartition: r,
    livrees,
    chiffreDAffaires,
    lots: lotsAuCoutDAchat,
    achats,
    nombre,
    cout,
    imputees,
    coutDAchat,
    stock,
    matieres,
    autres,
    coutDeProduction,
    coutDeProductionUnitaire: auCentime(coutDeProduction / livrees),
    coutDeRevient,
    coutDeRevientUnitaire: auCentime(coutDeRevient / livrees),
    resultat,
    /** Ce que les unités d'œuvre arrondies ont imputé de plus (ou de moins) que les centres. */
    arrondiDesUnitesDOeuvre: auCentime(somme(PRINCIPAUX.map((c) => imputees[c])) - r.total),
    /** Ce que les sorties et le stock final, au coût moyen arrondi, laissent du disponible. */
    arrondiDuStock: stock?.arrondi ?? 0,
  };
}

/**
 * LA FICHE DE STOCK DE DÉCEMBRE DE LA COMPTABILITÉ DE GESTION, tenue sur les bons : les deux lots à
 * leur coût d'achat, les sorties des bons (1 000 jeux le 15, 1 410 le 24), et le stock théorique.
 * Au coût moyen pondéré de la période (la méthode de la fiche), le coût s'arrondit au centime et
 * chaque sortie vaut sa quantité × ce coût ; le stock final aussi.
 */
export function ficheDeStockDeGestion(lots: readonly { libelle: string; jour: number; quantite: number; coutDAchat: number }[], methode: MethodeDeStock) {
  const fiche: FicheDeStock = {
    libelle: "les jeux de composants, en décembre, au coût d'achat",
    initial: COMPOSANTS_DE_DECEMBRE.initial,
    mouvements: [
      ...lots.map((x) => ({ date: { jour: x.jour, mois: 12 }, libelle: x.libelle, sens: "entree" as const, quantite: x.quantite, prixUnitaire: x.coutDAchat / x.quantite })),
      ...COMPOSANTS_DE_DECEMBRE.mouvements
        .filter((m) => m.sens === "sortie")
        .map((m) => ({ ...m, quantite: m.date.jour === 24 ? m.quantite + JEUX_REVENUS_SANS_BON : m.quantite })),
    ],
  };
  const v = valoriserLeStock(fiche, methode, { coutArrondiAuCentime: methode !== "peps" });
  const sortiesLignes = v.lignes.filter((x) => x.mouvement.sens === "sortie");
  const sorties = somme(sortiesLignes.map((x) => x.valeur));
  const disponible = auCentime(fiche.initial.valeur + v.entrees.valeur);
  return {
    fiche,
    valorisee: v,
    cmup: v.coutMoyenDePeriode,
    disponible,
    entrees: v.entrees,
    lignesDeSortie: sortiesLignes.map((x) => ({ jour: x.mouvement.date.jour, quantite: x.mouvement.quantite, valeur: x.valeur })),
    quantiteSortie: v.sorties.quantite,
    sorties,
    final: v.final,
    /** Le disponible que ni les sorties ni le stock final n'ont pris : l'écart d'arrondi du coût moyen. */
    arrondi: auCentime(disponible - sorties - v.final.valeur),
  };
}

/** Décembre, le mois du premier chapitre, avec les leviers de la fiche ou ceux d'un laboratoire. */
export const decembreDeGestion = (leviers: Partial<LeviersDeGestion> = {}) => moisDeGestion(11, leviers);

/**
 * LA VARIANTE DE DÉCEMBRE, chiffrée sur le mois de la fiche : le coût de production des bonnes
 * enceintes avec les rebuts, les déchets et le sous-produit, puis le résultat de chaque produit.
 */
export function varianteDeDecembre() {
  const d = decembreDeGestion();
  const v = VARIANTE_DE_DECEMBRE;
  const cmup = d.stock!.cmup;
  const rebuts = auCentime(v.rebuts * cmup);
  const evacuation = auCentime(v.evacuation.bennes * v.evacuation.prixDeLaBenne);
  const dechetsVendables = auCentime(v.dechetsVendables.kilos * v.dechetsVendables.prixDuKilo);
  const grilles = d.livrees;
  const sp = v.sousProduit;
  const ventesDuSousProduit = auCentime(grilles * sp.prix);
  const fraisDuSousProduit = auCentime(grilles * sp.fraisParGrille + sp.fraisDuMois);
  const valeurDeRealisation = auCentime(ventesDuSousProduit - fraisDuSousProduit);
  const coutDeProduction = somme([d.coutDeProduction, rebuts, evacuation, -dechetsVendables, -valeurDeRealisation]);
  const coutDeRevient = somme([coutDeProduction, d.imputees.distribution]);
  const resultat = auCentime(d.chiffreDAffaires - coutDeRevient);
  return {
    d,
    rebuts,
    evacuation,
    dechetsVendables,
    grilles,
    ventesDuSousProduit,
    fraisDuSousProduit,
    valeurDeRealisation,
    coutDeProduction,
    coutDeProductionUnitaire: auCentime(coutDeProduction / d.livrees),
    coutDeRevient,
    resultat,
    /** Le sous-produit porte sa valeur de réalisation et ses frais : son résultat est nul. */
    sousProduit: { chiffreDAffaires: ventesDuSousProduit, cout: auCentime(valeurDeRealisation + fraisDuSousProduit), resultat: auCentime(ventesDuSousProduit - valeurDeRealisation - fraisDuSousProduit) },
  };
}

/**
 * LE SEUIL DU SOUS-PRODUIT : vendre q grilles rapporte leur prix et évite leur évacuation ; cela coûte
 * leurs frais par grille et les frais du mois. La vente vaut mieux dès que
 * (prix + évacuation évitée) × q ≥ frais du mois + frais par grille × q.
 */
export function seuilDuSousProduit() {
  const sp = VARIANTE_DE_DECEMBRE.sousProduit;
  const gainParGrille = auCentime(sp.prix + sp.evacuationParGrille - sp.fraisParGrille);
  return { gainParGrille, exact: sp.fraisDuMois / gainParGrille, grilles: Math.ceil(sp.fraisDuMois / gainParGrille - 1e-9) };
}

/**
 * L'EXERCICE DANS LA COMPTABILITÉ DE GESTION : les douze mois, leur résultat analytique, les
 * différences d'arrondi ; et, face à lui, la comptabilité générale de la clôture.
 */
export function exerciceDeGestion(leviers: Partial<LeviersDeGestion> = {}) {
  const mois = MOIS_DE_L_EXERCICE.map((_, m) => moisDeGestion(m, leviers));
  const decembre = mois[11]!;
  const resultatAnalytique = somme(mois.map((x) => x.resultat));
  const arrondiDesUnitesDOeuvre = somme(mois.map((x) => x.arrondiDesUnitesDOeuvre));
  return { mois, decembre, resultatAnalytique, arrondiDesUnitesDOeuvre, arrondiDuStock: decembre.arrondiDuStock };
}

/**
 * La comptabilité générale de l'exercice, telle que la clôture la donne (cloture.ts). Elle ne dépend
 * d'aucun levier de la gestion : calculée une fois, elle sert à chaque lecture du laboratoire.
 */
let laCloture: ReturnType<typeof cloture> | null = null;
export const clotureDeNova = () => (laCloture ??= cloture(EXERCICE_DE_NOVA));

/**
 * LE TABLEAU DE PASSAGE DU RÉSULTAT ANALYTIQUE AU RÉSULTAT DE LA COMPTABILITÉ GÉNÉRALE. Chaque ligne
 * dit, signe compris, ce qu'il faut ajouter au résultat analytique pour retrouver celui de la
 * comptabilité générale :
 *   + les charges supplétives (comptées en gestion, absentes de la comptabilité générale) ;
 *   + les produits non incorporés ; − les charges non incorporées ;
 *   + la différence d'incorporation de l'usure (833 € × 12 en gestion, la dotation en comptabilité) ;
 *   + le boni d'inventaire (les jeux trouvés en plus, au coût moyen de la gestion) ;
 *   + l'écart d'évaluation du stock final (la comptabilité générale l'évalue au prix d'achat, la
 *     gestion au coût d'achat) ;
 *   + les différences d'arrondi (ce que les unités d'œuvre ont imputé de plus, moins le reste du
 *     coût moyen).
 */
export function concordance(leviers: Partial<LeviersDeGestion> = {}) {
  const e = exerciceDeGestion(leviers);
  const cg = clotureDeNova();
  const s = cg.soldes;
  const l = e.decembre.leviers;
  const supletives = auCentime(12 * l.gerante);
  const nonIncorporees = CHARGES_NON_INCORPOREES.map((x) => ({ ...x, montant: auCentime(s[x.compte] ?? 0) }));
  const produitsNonIncorpores = PRODUITS_NON_INCORPORES.map((x) => ({ ...x, montant: auCentime(-(s[x.compte] ?? 0)) }));
  const usureDeGestion = auCentime(12 * USURE_DE_GESTION_DU_MOIS);
  const dotation = auCentime(s["6811"] ?? 0);
  const stockDeGestion = e.decembre.stock!;
  const stockPhysique = valoriserLeStock(COMPOSANTS_DE_DECEMBRE, EXERCICE_DE_NOVA.methodeDeStock).final;
  const stockGeneral = auCentime(-(s["6031"] ?? 0));
  const cmup = stockDeGestion.cmup;
  const jeuxEnPlus = stockPhysique.quantite - stockDeGestion.final.quantite;
  const lignes = {
    supletives,
    produitsNonIncorpores: somme(produitsNonIncorpores.map((x) => x.montant)),
    chargesNonIncorporees: auCentime(-somme(nonIncorporees.map((x) => x.montant))),
    differenceDIncorporation: auCentime(usureDeGestion - dotation),
    boniDInventaire: auCentime(jeuxEnPlus * cmup),
    evaluationDuStock: auCentime(stockGeneral - stockPhysique.quantite * cmup),
    arrondis: auCentime(e.arrondiDesUnitesDOeuvre - e.arrondiDuStock),
  };
  const resultatRetrouve = somme([e.resultatAnalytique, ...Object.values(lignes)]);
  return {
    exercice: e,
    cg,
    resultatGeneral: cg.resultatNet,
    nonIncorporees,
    produitsNonIncorpores,
    usureDeGestion,
    dotation,
    stockPhysique,
    stockGeneral,
    stockDeGestion,
    jeuxEnPlus,
    lignes,
    resultatRetrouve,
  };
}
