import { auCentime, rangDuJour, type DateDuCours } from "./amortissement";

/**
 * LE MODÈLE DES STOCKS DU COURS : une fiche de stock valorisée par trois méthodes.
 *
 * Une fonction pure : la fiche (le stock initial, les entrées et les sorties datées) et la méthode
 * sont des paramètres, si bien qu'un laboratoire bascule du coût moyen au premier entré, premier
 * sorti sans rien d'autre. Les composants de NOVA en décembre sont dans monde/exercice-de-nova.ts ;
 * le trimestre de MAILLE & CO est dans monde/cas-des-entreprises.ts (boutique.stock).
 *
 *   · CMUP DE PÉRIODE : un seul coût, (valeur du stock initial + valeur des entrées) ÷ (quantité
 *     initiale + quantités entrées), pour toutes les sorties et le stock final.
 *   · CMUP APRÈS CHAQUE ENTRÉE : le coût se recalcule à chaque entrée, (valeur en stock + valeur de
 *     l'entrée) ÷ (quantité en stock + quantité entrée) ; chaque sortie part au coût du moment.
 *   · PEPS (premier entré, premier sorti) : les sorties consomment les lots dans l'ordre de leur
 *     entrée ; le stock final est fait des derniers lots, à leur prix.
 *
 * Les sorties et le stock final sont au centime, et leur somme fait toujours le stock initial plus
 * les entrées (la valeur ne se perd pas dans un arrondi). Le coût moyen s'arrondit au centime quand
 * on le demande (c'est l'usage des énoncés : 24,96 € pour MAILLE & CO), sinon il reste exact.
 */

export type MethodeDeStock = "cmup-periode" | "cmup-apres-chaque-entree" | "peps";

export interface Mouvement {
  date: DateDuCours;
  libelle: string;
  sens: "entree" | "sortie";
  quantite: number;
  /** Le coût d'achat d'une unité, hors taxes (une entrée seulement). */
  prixUnitaire?: number;
}

export interface FicheDeStock {
  libelle: string;
  /** Le stock du début de la période, en quantité et en valeur. */
  initial: { quantite: number; valeur: number };
  mouvements: readonly Mouvement[];
}

/** Une ligne de la fiche valorisée : le mouvement, sa valeur, et ce qui reste en stock après lui. */
export interface LigneValorisee {
  mouvement: Mouvement;
  valeur: number;
  /** Le coût d'une unité de cette ligne (le coût moyen du moment, ou le coût moyen des lots sortis en PEPS). */
  coutUnitaire: number;
  stock: { quantite: number; valeur: number };
}

const parDate = (m: readonly Mouvement[]) => [...m].sort((a, b) => rangDuJour(a.date) - rangDuJour(b.date));

/** La fiche de stock valorisée par une méthode : chaque ligne, les entrées, les sorties, le stock final. */
export function valoriserLeStock(fiche: FicheDeStock, methode: MethodeDeStock, options: { coutArrondiAuCentime?: boolean } = {}) {
  const arrondi = options.coutArrondiAuCentime ?? false;
  const cout = (x: number) => (arrondi ? auCentime(x) : x);
  const mouvements = parDate(fiche.mouvements);
  const entrees = mouvements.filter((m) => m.sens === "entree");
  const entreesQuantite = entrees.reduce((t, m) => t + m.quantite, 0);
  const entreesValeur = auCentime(entrees.reduce((t, m) => t + m.quantite * (m.prixUnitaire ?? 0), 0));
  const sortiesQuantite = mouvements.filter((m) => m.sens === "sortie").reduce((t, m) => t + m.quantite, 0);
  const quantiteFinale = fiche.initial.quantite + entreesQuantite - sortiesQuantite;
  if (quantiteFinale < 0) throw new Error("Les sorties dépassent le stock.");
  const disponible = auCentime(fiche.initial.valeur + entreesValeur);

  const lignes: LigneValorisee[] = [];
  let quantite = fiche.initial.quantite;
  let valeur = fiche.initial.valeur;
  /** Les lots en stock, dans l'ordre d'entrée (PEPS). */
  const lots: { quantite: number; prix: number }[] = fiche.initial.quantite > 0 ? [{ quantite: fiche.initial.quantite, prix: fiche.initial.valeur / fiche.initial.quantite }] : [];
  const coutDePeriode = cout(disponible / (fiche.initial.quantite + entreesQuantite));
  let coutCourant = fiche.initial.quantite > 0 ? cout(fiche.initial.valeur / fiche.initial.quantite) : 0;

  for (const m of mouvements) {
    if (m.sens === "entree") {
      const v = auCentime(m.quantite * (m.prixUnitaire ?? 0));
      quantite += m.quantite;
      valeur = auCentime(valeur + v);
      lots.push({ quantite: m.quantite, prix: m.prixUnitaire ?? 0 });
      coutCourant = cout(valeur / quantite);
      lignes.push({ mouvement: m, valeur: v, coutUnitaire: m.prixUnitaire ?? 0, stock: { quantite, valeur } });
      continue;
    }
    let v: number;
    if (methode === "cmup-periode") v = auCentime(m.quantite * coutDePeriode);
    else if (methode === "cmup-apres-chaque-entree") v = auCentime(m.quantite * coutCourant);
    else {
      let reste = m.quantite;
      let total = 0;
      while (reste > 0) {
        const lot = lots[0]!;
        const pris = Math.min(reste, lot.quantite);
        total += pris * lot.prix;
        lot.quantite -= pris;
        reste -= pris;
        if (lot.quantite === 0) lots.shift();
      }
      v = auCentime(total);
    }
    quantite -= m.quantite;
    // Le dernier mouvement laisse le stock final à sa valeur exacte selon la méthode.
    valeur = auCentime(valeur - v);
    lignes.push({ mouvement: m, valeur: v, coutUnitaire: m.quantite > 0 ? v / m.quantite : 0, stock: { quantite, valeur } });
  }

  // Le stock final, et des sorties qui en sont le complément exact.
  const valeurFinale =
    methode === "cmup-periode" ? auCentime(quantiteFinale * coutDePeriode) : methode === "peps" ? auCentime(lots.reduce((t, l) => t + l.quantite * l.prix, 0)) : valeur;
  return {
    methode,
    lignes,
    coutMoyenDePeriode: coutDePeriode,
    entrees: { quantite: entreesQuantite, valeur: entreesValeur },
    sorties: { quantite: sortiesQuantite, valeur: auCentime(disponible - valeurFinale) },
    final: { quantite: quantiteFinale, valeur: valeurFinale },
    /** La variation du stock, au compte 603 : stock initial − stock final (positive quand le stock baisse). */
    variation: auCentime(fiche.initial.valeur - valeurFinale),
  };
}

/** Le coût d'achat de ce qui est sorti (vendu ou consommé) : stock initial + achats − stock final. */
export const coutDesSorties = (initial: number, achats: number, final: number) => auCentime(initial + achats - final);

/**
 * L'INVENTAIRE INTERMITTENT D'UNE PÉRIODE EN GRANDES MASSES (le trimestre de MAILLE & CO) : le
 * stock initial, les achats et les quantités vendues, valorisés au CMUP de période, et la marge
 * commerciale sur les ventes hors taxes.
 */
export function inventaireDeLaPeriode(p: {
  initial: { quantite: number; valeur: number };
  achats: { quantite: number; prixUnitaire: number };
  vendues: number;
  ventesHt: number;
  coutArrondiAuCentime?: boolean;
}) {
  const fiche: FicheDeStock = {
    libelle: "la période",
    initial: p.initial,
    mouvements: [
      { date: { jour: 1, mois: 1 }, libelle: "les achats", sens: "entree", quantite: p.achats.quantite, prixUnitaire: p.achats.prixUnitaire },
      { date: { jour: 2, mois: 1 }, libelle: "les ventes", sens: "sortie", quantite: p.vendues },
    ],
  };
  const v = valoriserLeStock(fiche, "cmup-periode", { coutArrondiAuCentime: p.coutArrondiAuCentime ?? true });
  const achatsHt = v.entrees.valeur;
  const coutDAchatDesVendues = coutDesSorties(p.initial.valeur, achatsHt, v.final.valeur);
  return { cmup: v.coutMoyenDePeriode, final: v.final, achatsHt, variation: v.variation, coutDAchatDesVendues, margeCommerciale: auCentime(p.ventesHt - coutDAchatDesVendues) };
}
