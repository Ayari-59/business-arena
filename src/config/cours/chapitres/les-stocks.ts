import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas, StockDuTrimestre } from "../cas";
import { dateDuCours as date, moisEtJour } from "../dates";
import { auCentime } from "../monde/amortissement";
import { inventaireDeLaPeriode, valoriserLeStock, type FicheDeStock, type MethodeDeStock } from "../monde/stock";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES STOCKS (comptabilité générale, palier 3 ; BTS CG, DCG UE9, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le trimestre de
 * chaque entreprise est celui de son cas figé (monde/cas-des-entreprises.ts : le stock initial, les
 * unités achetées et leur prix, les unités vendues et le prix moyen), et les stocks se valorisent par
 * le modèle du cours (monde/stock.ts : coût moyen pondéré de période, coût moyen après chaque entrée,
 * premier entré, premier sorti). Il se joue chez MAILLE & CO et PIXEL & CO, les deux entreprises du
 * cours qui achètent des marchandises pour les revendre et en gardent d'un trimestre à l'autre.
 *
 * L'objet : l'arrêté du trimestre en inventaire intermittent (les achats en charges, le stock corrigé
 * à la fin par ses deux écritures), le coût d'achat des marchandises vendues, qui n'est pas les achats,
 * et la marge ; puis le mois qui suit, tenu en inventaire permanent sur une fiche de stock, où une
 * hausse du fournisseur sépare les trois méthodes ; enfin le stock retrouvé à rebours par le taux de
 * marque, quand l'inventaire est impossible.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, achats, ventes, inventaire, annulation-stock-initial, constatation-stock-final
 *     (la formule est dans la question ou au repère, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-le-cout-des-ventes puis vendre-ce-qu-on-achete (un curseur sur les unités vendues : le
 *     coût des ventes face aux achats, qui se croisent quand le stock ne varie pas) avant inventaire ;
 *     predire-la-methode puis le-prix-qui-separe-les-methodes (un curseur sur le prix de la seconde
 *     livraison du mois : le stock final en PEPS face au coût moyen) avant le-peps-du-mois ;
 *   · autonome : effet-sur-le-resultat, marge, inventaire-permanent, stock-qui-dort (ni formule ni
 *     chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-peps-du-mois (la fiche de stock en PEPS, lot par lot), le-laboratoire-des-methodes
 *     (un levier à choix entre les trois méthodes, le prix et la taille de la seconde livraison, le
 *     graphique des trois marges), le-cmup-apres-chaque-entree (la fiche au coût moyen recalculé),
 *     la-methode-et-la-marge (la critique : une marge plus forte en PEPS n'est pas une meilleure
 *     gestion, et la permanence des méthodes), le-stock-sinistre (le stock retrouvé à rebours par le
 *     taux de marque) ; puis la synthèse.
 *
 * Ce qui a disparu : la lecture du trimestre « de l'arène » et la phrase sur le bilan de l'arène ; le
 * stock se lit ici dans la simulation du cours.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE MOIS QUI SUIT LE TRIMESTRE, hypothèse du cours, tenu en inventaire permanent : deux livraisons et
 * deux séries de ventes. Chaque livraison fait le sixième des achats du trimestre et chaque série de
 * ventes le sixième de ses ventes (un demi-mois chacune), arrondis à la dizaine d'unités. La première
 * livraison est au prix du trimestre, la seconde au prix relevé de HAUSSE_DE_LA_SECONDE_LIVRAISON.
 */
export const LE_MOIS_QUI_SUIT = { partDUneLivraison: 1 / 6, partDUneSerieDeVentes: 1 / 6, jours: { livraison1: 3, ventes1: 14, livraison2: 17, ventes2: 28 } } as const;

/** La hausse du fournisseur sur la seconde livraison du mois, en euros par unité. */
export const HAUSSE_DE_LA_SECONDE_LIVRAISON = 2;

/** Les choix du levier de méthode, au laboratoire. */
export const METHODES_DU_LABORATOIRE = { cmupPeriode: 0, cmupApresChaqueEntree: 1, peps: 2 } as const;

/**
 * LE SINISTRE, hypothèse du cours : à la moitié du trimestre (le 15 février pour un trimestre qui part
 * du 1er janvier), un dégât des eaux détruit la réserve, et un quart des marchandises est sauvé. Les
 * achats et les ventes jusque-là sont la moitié de ceux du trimestre, en unités ; le stock se retrouve
 * par le taux de marque habituel de l'entreprise, celui du trimestre arrondi au point.
 */
export const LE_SINISTRE = { partDuTrimestre: 0.5, partSauvee: 0.25 } as const;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const TRIMESTRES = ["premier", "deuxième", "troisième", "quatrième"];

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const aLaDizaine = (x: number) => Math.round(x / 10) * 10;
/** « de MAILLE & CO », « d'ATLAS » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const NOMS_DES_METHODES: Readonly<Record<MethodeDeStock, string>> = {
  "cmup-periode": "Coût moyen de la période",
  "cmup-apres-chaque-entree": "Coût moyen après chaque entrée",
  peps: "Premier entré, premier sorti",
};
const methodeDe = (v: number): MethodeDeStock => (v === METHODES_DU_LABORATOIRE.peps ? "peps" : v === METHODES_DU_LABORATOIRE.cmupApresChaqueEntree ? "cmup-apres-chaque-entree" : "cmup-periode");

/** Le stock du trimestre : le chapitre ne s'ouvre que dans les entreprises qui en ont un. */
export function stockDe(c: Cas): StockDuTrimestre {
  if (!c.stock) throw new Error(`${c.entreprise} n'a pas de stock de marchandises dans la simulation du cours`);
  return c.stock;
}

// ─────────────────────────────────────────────────────────────────────────────
// LE TRIMESTRE, EN INVENTAIRE INTERMITTENT
// ─────────────────────────────────────────────────────────────────────────────

/** Les grandeurs de l'arrêté du trimestre, valorisées par le modèle au coût moyen pondéré de période. */
export function arrete(c: Cas) {
  const s = stockDe(c);
  const inv = inventaireDeLaPeriode({ initial: s.initial, achats: { quantite: s.achats.quantite, prixUnitaire: s.achats.prixUnitaire }, vendues: s.vendues, ventesHt: s.ventes.ht });
  const variation = inv.variation;
  const marge = inv.margeCommerciale;
  return {
    ...s,
    cump: inv.cmup,
    final: inv.final,
    coutDAchatDesVendues: inv.coutDAchatDesVendues,
    trimestreEcrit: `${TRIMESTRES[s.trimestre - 1]} trimestre`,
    variation,
    augmente: inv.final.valeur > s.initial.valeur,
    marge,
    tauxDeMarque: marge / s.ventes.ht,
  };
}

export type ArreteDuTrimestre = ReturnType<typeof arrete>;

/** Le coût d'achat des marchandises vendues et le stock final pour un nombre d'unités vendues quelconque, au coût moyen du trimestre. */
export function venteAuCurseur(a: ArreteDuTrimestre, vendues: number) {
  const stockFinal = auCentime((a.initial.quantite + a.achats.quantite - vendues) * a.cump);
  const cout = auCentime(a.initial.valeur + a.achats.ht - stockFinal);
  return { stockFinal, cout, variation: auCentime(a.initial.valeur - stockFinal) };
}

/** Les bornes du curseur des unités vendues : de 70 % des achats, à la centaine, jusqu'à ce que le trimestre pouvait vendre. */
export function bornesDesVentes(a: ArreteDuTrimestre) {
  return { min: Math.floor((a.achats.quantite * 0.7) / 100) * 100, max: Math.floor((a.initial.quantite + a.achats.quantite) / 100) * 100 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE MOIS QUI SUIT, EN INVENTAIRE PERMANENT
// ─────────────────────────────────────────────────────────────────────────────

/** Le mois qui suit le trimestre : ses quantités, ses prix, ses dates. */
export function leMois(c: Cas) {
  const a = arrete(c);
  const m = LE_MOIS_QUI_SUIT;
  const numero = ((moisEtJour(a.fin).mois + 1) % 12) + 1;
  const livraison = aLaDizaine(a.achats.quantite * m.partDUneLivraison);
  const vente = aLaDizaine(a.vendues * m.partDUneSerieDeVentes);
  const prix1 = a.achats.prixUnitaire;
  const prix2 = auCentime(prix1 + HAUSSE_DE_LA_SECONDE_LIVRAISON);
  return {
    a,
    numero,
    nom: MOIS[numero - 1]!,
    livraison,
    vente,
    prix1,
    prix2,
    jours: m.jours,
    ventesDuMois: auCentime(2 * vente * a.ventes.prixUnitaire),
  };
}

export type LeMois = ReturnType<typeof leMois>;

/** La fiche de stock du mois, pour un prix et une quantité de la seconde livraison. */
export function ficheDuMois(x: LeMois, prix2 = x.prix2, livraison2 = x.livraison): FicheDeStock {
  const j = x.jours;
  return {
    libelle: `le mois ${dE(x.nom)}`,
    initial: x.a.final,
    mouvements: [
      { date: { jour: j.livraison1, mois: x.numero }, libelle: `Livraison du ${j.livraison1}`, sens: "entree", quantite: x.livraison, prixUnitaire: x.prix1 },
      { date: { jour: j.ventes1, mois: x.numero }, libelle: `Ventes jusqu'au ${j.ventes1}`, sens: "sortie", quantite: x.vente },
      { date: { jour: j.livraison2, mois: x.numero }, libelle: `Livraison du ${j.livraison2}`, sens: "entree", quantite: livraison2, prixUnitaire: prix2 },
      { date: { jour: j.ventes2, mois: x.numero }, libelle: `Ventes jusqu'au ${j.ventes2}`, sens: "sortie", quantite: x.vente },
    ],
  };
}

/** Le mois valorisé par une méthode, les coûts moyens arrondis au centime comme dans les énoncés : le stock final, les sorties, la marge. */
export function moisValorise(x: LeMois, methode: MethodeDeStock, prix2 = x.prix2, livraison2 = x.livraison) {
  const v = valoriserLeStock(ficheDuMois(x, prix2, livraison2), methode, { coutArrondiAuCentime: true });
  const sorties = v.lignes.filter((l) => l.mouvement.sens === "sortie");
  return {
    v,
    sortie1: sorties[0]!.valeur,
    sortie2: sorties[1]!.valeur,
    final: v.final,
    cout: v.sorties.valeur,
    marge: auCentime(x.ventesDuMois - v.sorties.valeur),
    /** Le coût moyen après chaque livraison (la méthode du coût moyen après chaque entrée). */
    coutApres1: auCentime(v.lignes[0]!.stock.valeur / v.lignes[0]!.stock.quantite),
    coutApres2: auCentime(v.lignes[2]!.stock.valeur / v.lignes[2]!.stock.quantite),
  };
}

/**
 * LE DÉTAIL DU PEPS, pour les textes : les lots que chaque sortie consomme, dans l'ordre de leur
 * entrée, et ceux qui restent. Le modèle (monde/stock.ts) donne les valeurs ; ce détail les écrit.
 */
export function lotsDuPeps(fiche: FicheDeStock) {
  const lots = [{ quantite: fiche.initial.quantite, prix: fiche.initial.valeur / fiche.initial.quantite }];
  const sorties: { quantite: number; prix: number }[][] = [];
  for (const m of fiche.mouvements) {
    if (m.sens === "entree") {
      lots.push({ quantite: m.quantite, prix: m.prixUnitaire ?? 0 });
      continue;
    }
    let reste = m.quantite;
    const prises: { quantite: number; prix: number }[] = [];
    while (reste > 0) {
      const lot = lots[0]!;
      const pris = Math.min(reste, lot.quantite);
      prises.push({ quantite: pris, prix: lot.prix });
      lot.quantite -= pris;
      reste -= pris;
      if (lot.quantite === 0) lots.shift();
    }
    sorties.push(prises);
  }
  return { sorties, restants: lots.filter((l) => l.quantite > 0) };
}

const enLots = (lots: readonly { quantite: number; prix: number }[]) => lots.map((l) => `${qte(l.quantite)} × ${eur(auCentime(l.prix))}`).join(" + ");

/** Le croisement du second curseur : le stock final en PEPS face au coût moyen de période, exact, pour un prix de la seconde livraison en centimes. */
export function stocksAuPrix(x: LeMois, centimes: number) {
  const fiche = ficheDuMois(x, centimes / 100);
  const peps = valoriserLeStock(fiche, "peps");
  const cmup = valoriserLeStock(fiche, "cmup-periode");
  return { peps: peps.final.valeur, cmupExact: cmup.coutMoyenDePeriode * cmup.final.quantite, coutMoyen: cmup.coutMoyenDePeriode };
}

/** Les bornes du second curseur, en centimes : de 3 € sous le prix du trimestre à 5 € au-dessus. */
export const bornesDuPrix = (x: LeMois) => ({ min: Math.round((x.prix1 - 3) * 100), max: Math.round((x.prix1 + 5) * 100) });

/** La marge du mois sans la hausse, au coût moyen de la période : la référence du défi du laboratoire. */
export const margeSansLaHausse = (x: LeMois) => moisValorise(x, "cmup-periode", x.prix1).marge;

/** Le sinistre du milieu du trimestre, retrouvé par le taux de marque. */
export function leSinistre(c: Cas) {
  const a = arrete(c);
  const s = LE_SINISTRE;
  const jour = a.debut + Math.round((a.fin - a.debut + 1) * s.partDuTrimestre);
  const achetees = Math.round(a.achats.quantite * s.partDuTrimestre);
  const vendues = Math.round(a.vendues * s.partDuTrimestre);
  const achats = auCentime(achetees * a.achats.prixUnitaire);
  const ventes = auCentime(vendues * a.ventes.prixUnitaire);
  const tauxDeMarque = Math.round(a.tauxDeMarque * 100) / 100;
  const cout = auCentime(ventes * (1 - tauxDeMarque));
  const stock = auCentime(a.initial.valeur + achats - cout);
  return { jour, achetees, vendues, achats, ventes, tauxDeMarque, cout, stock, detruit: auCentime(stock * (1 - s.partSauvee)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const a = arrete(c);
  return {
    titre: `Le ${a.trimestreEcrit} · ${c.entreprise}`,
    colonnes: ["Unités", "Hors taxes"],
    lignes: [
      { libelle: `Stock au ${date(a.debut)}`, valeurs: [qte(a.initial.quantite), eur(a.initial.valeur)] },
      { libelle: `Achats, à ${eur(a.achats.prixUnitaire)} l'unité`, valeurs: [qte(a.achats.quantite), eur(a.achats.ht)] },
      { libelle: `Ventes, à ${eur(a.ventes.prixUnitaire)} l'unité en moyenne`, valeurs: [qte(a.vendues), eur(a.ventes.ht)] },
    ],
  };
}

function tableauDuMois(x: LeMois): TableauDeDonnees {
  const f = ficheDuMois(x);
  return {
    titre: `La fiche de stock ${dE(x.nom)}`,
    colonnes: ["Unités", "Prix d'une unité"],
    lignes: [
      { libelle: `Stock au 1er ${x.nom}`, valeurs: [qte(f.initial.quantite), eur(auCentime(f.initial.valeur / f.initial.quantite))] },
      ...f.mouvements.map((m) => ({ libelle: m.libelle, valeurs: [m.sens === "entree" ? qte(m.quantite) : qte(-m.quantite), m.prixUnitaire ? eur(m.prixUnitaire) : ""] })),
    ],
  };
}

function tableauDesMethodes(x: LeMois): TableauDeDonnees {
  const lignes = (["cmup-periode", "cmup-apres-chaque-entree", "peps"] as const).map((m) => {
    const v = moisValorise(x, m);
    return { libelle: NOMS_DES_METHODES[m], valeurs: [eur(v.final.valeur), eur(v.cout), eur(v.marge)] };
  });
  return { titre: `Le mois ${dE(x.nom)}, par méthode`, colonnes: ["Stock final", "Coût des ventes", "Marge"], lignes };
}

export const LES_STOCKS: Chapitre = {
  code: "les-stocks",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Les stocks",
  accroche:
    "Ce qui reste en rayon à la fin du trimestre : l'inventaire, la variation des stocks, pourquoi les achats ne sont pas le coût de ce qu'on a vendu, et ce que le choix d'une méthode de valorisation change à la marge quand le fournisseur augmente ses prix.",
  objectifs: [
    "Passer les achats, les ventes et les deux écritures d'inventaire d'un trimestre en inventaire intermittent",
    "Calculer le coût d'achat des marchandises vendues, la variation des stocks et la marge commerciale",
    "Tenir une fiche de stock en inventaire permanent, au coût moyen de période, au coût moyen après chaque entrée et en PEPS",
    "Dire ce que la méthode change au stock final et à la marge quand les prix montent",
    "Retrouver un stock à rebours par le taux de marque",
  ],
  libre: false,
  entreprises: {
    codes: ["boutique", "ecommerce"],
    pourquoi:
      "dans la simulation du cours, elle ne garde pas de marchandises en stock d'un trimestre à l'autre : un service ne se stocke pas, un produit frais non plus, et ce qu'une entreprise fabrique ou construit n'est pas une marchandise achetée pour être revendue.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui reste en rayon",
      notions: ["stock"],
      tableau: tableauDuTrimestre,
      texte: (c) => {
        const a = arrete(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. Au ${date(a.debut)}, au début de son ${a.trimestreEcrit}, ${c.entreprise} a ${qte(a.initial.quantite)} unités de marchandises en stock, pour ${eur(a.initial.valeur)}. Pendant le trimestre, elle en achète ${qte(a.achats.quantite)} à ${eur(a.achats.prixUnitaire)} et en vend ${qte(a.vendues)}.`,
          "La simulation tient le trimestre en inventaire intermittent : chaque achat va en charges au compte 607, au fil du trimestre, et le compte de stock ne bouge pas. À l'arrêté des comptes, on compte ce qui reste, on le valorise au coût moyen pondéré de la période, arrondi au centime comme dans les énoncés, et l'on corrige.",
          `Votre travail : l'arrêté du ${date(a.fin)}, puis le mois qui suit, tenu sur une fiche de stock.`,
        ];
      },
      repere: () =>
        "Les achats ne sont pas le coût de ce qu'on a vendu : une part des marchandises vendues sortait du stock initial, une part des achats reste en stock. L'inventaire fait la différence.",
    },
    {
      id: "achats",
      objectifs: [0],
      type: "ecriture",
      titre: "Les achats du trimestre",
      notions: ["stock", "vat_payable"],
      evenement: (c) => {
        const a = arrete(c);
        return `Le récapitulatif des factures du trimestre : ${qte(a.achats.quantite)} unités achetées à ${eur(a.achats.prixUnitaire)} hors taxes, à ${c.achat.fournisseur}, payables à échéance.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Récapitulatif des achats du trimestre",
          lignes: [
            { role: "les achats de marchandises", compte: "607", sens: "debit", montant: a.achats.ht, indice: "le total hors taxes des factures" },
            { role: "la TVA déductible", compte: "44566", sens: "debit", montant: a.achats.tva, indice: "la TVA des factures" },
            { role: "la dette fournisseur", compte: "401", sens: "credit", montant: a.achats.ttc, indice: "le total des factures, taxes comprises" },
          ],
        };
      },
      indices: () => ["Des marchandises achetées pour être revendues : classe 6, les achats de marchandises.", "La TVA se déduit ; le fournisseur attend le total, taxes comprises."],
      explication: (c) => [`${eur(arrete(c).achats.ht)} d'achats au débit du 607. En inventaire intermittent, c'est tout : le stock ne bouge pas encore.`],
      vue: "resultat",
    },
    {
      id: "ventes",
      objectifs: [0],
      type: "ecriture",
      titre: "Les ventes du trimestre",
      notions: ["revenue", "vat_payable"],
      evenement: (c) => {
        const a = arrete(c);
        return `Le récapitulatif des ventes du trimestre : ${qte(a.vendues)} unités, à ${eur(a.ventes.prixUnitaire)} hors taxes en moyenne. Pour l'écriture, on les passe toutes en créances sur les clients.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Récapitulatif des ventes du trimestre",
          lignes: [
            { role: "la créance sur les clients", compte: "411", sens: "debit", montant: a.ventes.ttc, indice: "le total des ventes, taxes comprises" },
            { role: "les ventes de marchandises", compte: "707", sens: "credit", montant: a.ventes.ht, indice: "le total hors taxes des ventes" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: a.ventes.tva, indice: "la TVA des ventes" },
          ],
        };
      },
      indices: () => ["Les clients doivent le total, taxes comprises.", "Le produit : les ventes de marchandises, hors taxes. La TVA est due à l'État."],
      explication: (c) => {
        const a = arrete(c);
        return [`Le compte de résultat porte ${eur(a.ventes.ht)} de ventes et ${eur(a.achats.ht)} d'achats. Ce résultat-là est faux : il ne tient pas compte du stock.`];
      },
      vue: "resultat",
    },
    {
      id: "predire-le-cout-des-ventes",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le coût des ventes",
      notions: ["stock"],
      question: (c) => {
        const a = arrete(c);
        return `Avant de compter, pariez. Ce trimestre, ${c.entreprise} a acheté ${qte(a.achats.quantite)} unités et en a vendu ${qte(a.vendues)}. Face aux ${eur(a.achats.ht)} d'achats, le coût d'achat des marchandises vendues sera…`;
      },
      options: (c) => {
        const a = arrete(c);
        const voir = "Faites varier les ventes à l'étape suivante : le curseur montre quand le coût des ventes rejoint les achats.";
        return [
          { texte: "Plus élevé : les ventes ont puisé dans le stock du début", juste: a.variation > 0, retour: `${a.variation > 0 ? "Bon pari" : "Pari à vérifier"}. ${voir}` },
          { texte: "Plus faible : une part des achats reste en stock", juste: a.variation < 0, retour: `${a.variation < 0 ? "Bon pari" : "Pari à vérifier"}. ${voir}` },
          { texte: "Égal : on ne vend que ce qu'on a acheté", juste: a.variation === 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "vendre-ce-qu-on-achete",
      objectifs: [1],
      type: "curseur",
      titre: "Les ventes au curseur",
      notions: ["stock"],
      question: (c) => {
        const a = arrete(c);
        const b = bornesDesVentes(a);
        return `Faites varier les unités vendues dans le trimestre, de ${qte(b.min)} à ${qte(b.max)}, les achats restant ceux du trimestre. Une droite donne le coût d'achat des marchandises vendues (stock initial + achats − stock final, au coût moyen de ${eur(a.cump)}), l'autre les achats, ${eur(a.achats.ht)}. Placez le curseur sur le plus petit nombre d'unités vendues où le coût des ventes atteint les achats, puis validez.`;
      },
      grandeur: () => ({ libelle: "Unités vendues dans le trimestre", unite: "unités" }),
      cible: (c) => {
        const a = arrete(c);
        const b = bornesDesVentes(a);
        let q = b.min;
        while (q < b.max && venteAuCurseur(a, q).cout < a.achats.ht) q++;
        return { attendu: q, min: b.min, max: b.max };
      },
      zones: ["Le stock baisse", "Le stock monte"],
      rates: () => ({
        dessous: "À cette position, le coût des ventes reste sous les achats : une part des achats va grossir le stock.",
        dessus: "Le coût des ventes dépasse déjà les achats plus bas : cherchez le plus petit nombre d'unités vendues.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const a = arrete(c);
        const v = venteAuCurseur(a, q);
        return [
          { libelle: "Coût d'achat des marchandises vendues", montant: v.cout },
          { libelle: "Achats du trimestre", montant: a.achats.ht },
          { libelle: "Stock final", montant: v.stockFinal },
          { libelle: "Variation des stocks (6037)", montant: v.variation, fort: true },
        ];
      },
      droites: (c) => {
        const a = arrete(c);
        return {
          produit: (q) => a.initial.valeur + a.achats.ht - (a.initial.quantite + a.achats.quantite - q) * a.cump,
          cout: () => a.achats.ht,
          libelles: ["Coût d'achat des marchandises vendues", "Achats du trimestre"],
        };
      },
      explication: (c) => {
        const a = arrete(c);
        const b = bornesDesVentes(a);
        let q = b.min;
        while (q < b.max && venteAuCurseur(a, q).cout < a.achats.ht) q++;
        const pourquoi =
          q === a.achats.quantite
            ? "exactement les unités achetées : le stock initial, les achats et le coût moyen sont ici au même prix"
            : `et non aux ${qte(a.achats.quantite)} unités achetées : le stock final se compte au coût moyen, ${eur(a.cump)}, plus cher que les unités du stock initial, ${eur(auCentime(a.initial.valeur / a.initial.quantite))}`;
        return [
          `Les deux droites se croisent vers ${qte(q)} unités vendues, ${pourquoi}. Là, le stock final retrouve la valeur du stock initial, ${eur(a.initial.valeur)} : la variation est nulle, et le coût des ventes égale les achats.`,
          `${c.entreprise} en a vendu ${qte(a.vendues)}, ${a.vendues > q ? "plus" : "moins"} : son stock ${a.augmente ? "monte" : "baisse"} de ${eur(Math.abs(a.variation))}, et le coût des ventes ${a.augmente ? "reste sous" : "dépasse"} les achats d'autant. C'est le calcul de l'étape suivante.`,
        ];
      },
    },
    {
      id: "inventaire",
      objectifs: [2],
      type: "montants",
      titre: "L'inventaire",
      notions: ["stock", "weighted_average_cost"],
      question: (c) => {
        const a = arrete(c);
        return `Au ${date(a.fin)}, on compte ce qui reste. Stock initial : ${qte(a.initial.quantite)} unités pour ${eur(a.initial.valeur)} ; achats : ${qte(a.achats.quantite)} unités pour ${eur(a.achats.ht)} ; ventes : ${qte(a.vendues)} unités. Le stock se valorise au coût moyen pondéré de la période : (valeur du stock initial + achats) ÷ (unités du stock initial + unités achetées), arrondi au centime. Calculez, puis le coût d'achat des marchandises vendues : stock initial + achats − stock final.`;
      },
      champs: (c) => {
        const a = arrete(c);
        return [
          { libelle: "Stock final, en unités", attendu: a.final.quantite, calcul: `${qte(a.initial.quantite)} + ${qte(a.achats.quantite)} − ${qte(a.vendues)} = ${qte(a.final.quantite)} unités` },
          {
            libelle: "Coût moyen pondéré d'une unité",
            attendu: a.cump,
            calcul: `(${eur(a.initial.valeur)} + ${eur(a.achats.ht)}) ÷ (${qte(a.initial.quantite)} + ${qte(a.achats.quantite)}) = ${eur(a.cump)}`,
          },
          { libelle: "Valeur du stock final", attendu: a.final.valeur, calcul: `${qte(a.final.quantite)} × ${eur(a.cump)} = ${eur(a.final.valeur)}` },
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: a.coutDAchatDesVendues,
            calcul: `${eur(a.initial.valeur)} + ${eur(a.achats.ht)} − ${eur(a.final.valeur)} = ${eur(a.coutDAchatDesVendues)}`,
          },
        ];
      },
      explication: (c) => {
        const a = arrete(c);
        return [
          `Le coût de ce qu'on a vendu, ${eur(a.coutDAchatDesVendues)}, n'est pas le montant des achats, ${eur(a.achats.ht)}. L'écart, ${eur(Math.abs(a.variation))}, c'est la variation du stock : il ${a.augmente ? "a augmenté" : "a baissé"} pendant le trimestre.`,
          "Dans la réalité, l'inventaire est un comptage physique : ce que l'on trouve en rayon peut être moins que ce que les calculs prévoient (casse, vol, erreurs). C'est le comptage qui fait foi.",
        ];
      },
    },
    {
      id: "annulation-stock-initial",
      objectifs: [0],
      type: "ecriture",
      titre: "Le stock initial s'annule",
      notions: ["stock"],
      evenement: (c) => {
        const a = arrete(c);
        return `Première écriture d'inventaire : le stock du ${date(a.debut)}, ${eur(a.initial.valeur)}, est sorti du bilan. Il a été vendu ou il est encore là ; dans les deux cas, l'inventaire le remplacera par le stock compté.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Annulation du stock initial",
          lignes: [
            { role: "la variation des stocks, en charge", compte: "6037", acceptes: ["603"], sens: "debit", montant: a.initial.valeur, indice: "la valeur du stock initial" },
            { role: "le stock initial qui sort du bilan", compte: "37", acceptes: ["370"], sens: "credit", montant: a.initial.valeur, indice: "la valeur du stock initial" },
          ],
        };
      },
      indices: () => ["Le stock de marchandises (classe 3) se vide : il passe au crédit.", "En face, une charge : la variation des stocks de marchandises, juste à côté des achats (603)."],
      explication: (c) => [`Le stock initial entre dans les charges du trimestre, comme s'il avait été acheté : ${eur(arrete(c).initial.valeur)} au débit du 6037.`],
      vue: "resultat",
    },
    {
      id: "constatation-stock-final",
      objectifs: [0],
      type: "ecriture",
      titre: "Le stock final se constate",
      notions: ["stock"],
      evenement: (c) => {
        const a = arrete(c);
        return `Deuxième écriture : le stock compté au ${date(a.fin)}, ${eur(a.final.valeur)}, entre au bilan.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Constatation du stock final",
          lignes: [
            { role: "le stock final qui entre au bilan", compte: "37", acceptes: ["370"], sens: "debit", montant: a.final.valeur, indice: "la valeur du stock final" },
            { role: "la variation des stocks, en moins des charges", compte: "6037", acceptes: ["603"], sens: "credit", montant: a.final.valeur, indice: "la valeur du stock final" },
          ],
        };
      },
      indices: () => [
        "C'est l'écriture inverse de la précédente, pour le stock compté.",
        "Le stock (classe 3) au débit ; la variation des stocks au crédit, qui retire des charges ce qui n'a pas été vendu.",
      ],
      explication: (c) => {
        const a = arrete(c);
        return [
          `Le compte 6037 a maintenant un solde ${a.augmente ? "créditeur" : "débiteur"} de ${eur(Math.abs(a.variation))}. Achats et variation réunis font ${eur(a.coutDAchatDesVendues)} : le coût d'achat des marchandises vendues. Le compte de résultat est juste.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "effet-sur-le-resultat",
      objectifs: [1],
      type: "choix",
      titre: "La variation et le résultat",
      notions: ["stock", "income_statement"],
      question: (c) => {
        const a = arrete(c);
        return `Le stock est passé de ${eur(a.initial.valeur)} à ${eur(a.final.valeur)}. Par rapport à un résultat qui ne compterait que les achats, le vrai résultat est :`;
      },
      options: (c) => {
        const a = arrete(c);
        const plus = a.augmente;
        return [
          {
            texte: `Plus élevé, de ${eur(Math.abs(a.variation))}.`,
            juste: plus,
            retour: plus
              ? "Oui : une part des achats est encore en stock. Ce n'est pas un coût du trimestre, c'est un actif ; la variation la retire des charges."
              : "Non : le stock a baissé. Les ventes ont consommé plus que les achats ; la variation ajoute cette baisse aux charges.",
          },
          {
            texte: `Plus faible, de ${eur(Math.abs(a.variation))}.`,
            juste: !plus,
            retour: !plus
              ? "Oui : le stock a baissé, les ventes ont puisé dans le stock du début. Ce stock consommé est un coût du trimestre, que la variation ajoute aux charges."
              : "Non : le stock a augmenté. Une part des achats n'a pas été vendue ; ce n'est pas un coût du trimestre.",
          },
          { texte: "Le même : un stock n'est qu'un chiffre au bilan.", juste: false, retour: "Le stock change le coût de ce qu'on a vendu : c'est tout l'objet de l'inventaire." },
        ];
      },
      vue: "resultat",
    },
    {
      id: "marge",
      objectifs: [1],
      type: "montants",
      titre: "La marge commerciale",
      notions: ["stock", "margin_rates"],
      question: (c) => `Les ventes du ${arrete(c).trimestreEcrit} font ${eur(arrete(c).ventes.ht)} hors taxes. Calculez la marge commerciale, puis le taux de marque.`,
      champs: (c) => {
        const a = arrete(c);
        return [
          { libelle: "Coût d'achat des marchandises vendues", attendu: a.coutDAchatDesVendues, calcul: `${eur(a.achats.ht)} ${a.variation >= 0 ? "+" : "−"} ${eur(Math.abs(a.variation))} de variation = ${eur(a.coutDAchatDesVendues)}` },
          { libelle: "Marge commerciale", attendu: a.marge, calcul: `${eur(a.ventes.ht)} − ${eur(a.coutDAchatDesVendues)} = ${eur(a.marge)}` },
          { libelle: "Taux de marque, en %", attendu: auCentime(a.tauxDeMarque * 100), calcul: `la marge rapportée aux ventes : ${eur(a.marge)} ÷ ${eur(a.ventes.ht)} = ${pct(a.tauxDeMarque)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const a = arrete(c);
        return [
          `Sur chaque euro de ventes, ${c.entreprise} garde ${pct(a.tauxDeMarque)} pour payer ses autres charges : le loyer, le personnel, l'usure de ses équipements. Le compte de résultat du chapitre, qui ne porte que les achats, la variation et les ventes, montre exactement cette marge.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "predire-la-methode",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la méthode",
      notions: ["stock", "weighted_average_cost"],
      question: (c) => {
        const x = leMois(c);
        return `Pariez encore. En ${x.nom}, ${c.entreprise} reçoit ${qte(x.livraison)} unités au prix du trimestre, ${eur(x.prix1)}, puis ${qte(x.livraison)} autres à ${eur(x.prix2)}, car le fournisseur a augmenté son prix. Entre le coût moyen et le premier entré, premier sorti (PEPS), quelle méthode donne le stock final le plus élevé ?`;
      },
      options: () => {
        const voir = "Le curseur de l'étape suivante fait varier le prix de la seconde livraison et montre les deux stocks.";
        return [
          { texte: "Le PEPS : le stock final est fait des derniers lots, les plus chers", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le coût moyen : il porte la hausse sur toutes les unités", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Aucune : les deux méthodes comptent les mêmes unités", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-qui-separe-les-methodes",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix qui sépare les méthodes",
      notions: ["stock", "weighted_average_cost"],
      question: (c) => {
        const x = leMois(c);
        const b = bornesDuPrix(x);
        return `Faites varier le prix de la seconde livraison ${dE(x.nom)}, de ${qte(b.min)} à ${qte(b.max)} centimes. Une droite donne le stock final en PEPS, l'autre au coût moyen de la période. Placez le curseur sur le plus petit prix où le PEPS donne un stock final au moins aussi élevé, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix d'une unité de la seconde livraison, en centimes", unite: "centimes" }),
      cible: (c) => {
        const x = leMois(c);
        const b = bornesDuPrix(x);
        let k = b.min;
        while (k < b.max) {
          const s = stocksAuPrix(x, k);
          if (s.peps - s.cmupExact >= -1e-9) break;
          k++;
        }
        return { attendu: k, min: b.min, max: b.max };
      },
      zones: ["Le PEPS donne le stock le plus élevé", "Le coût moyen donne le stock le plus élevé"],
      rates: () => ({
        dessous: "À ce prix, la seconde livraison coûte moins que les unités anciennes : le PEPS, qui garde les derniers lots, donne le stock le plus bas.",
        dessus: "Le PEPS l'emporte déjà à un prix plus bas : cherchez le plus petit.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, k) => {
        const s = stocksAuPrix(leMois(c), k);
        return [
          { libelle: "Stock final en PEPS", montant: s.peps },
          { libelle: "Stock final au coût moyen de la période", montant: auCentime(s.cmupExact) },
          { libelle: "Écart entre les deux méthodes", montant: auCentime(s.peps - s.cmupExact), fort: true },
        ];
      },
      droites: (c) => {
        const x = leMois(c);
        return { produit: (k) => stocksAuPrix(x, k).peps, cout: (k) => stocksAuPrix(x, k).cmupExact, libelles: ["Stock final en PEPS", "Stock final au coût moyen"] };
      },
      explication: (c) => {
        const x = leMois(c);
        const ancien = auCentime(x.a.final.valeur / x.a.final.quantite);
        const peps = moisValorise(x, "peps").final.valeur;
        const cmup = moisValorise(x, "cmup-periode").final.valeur;
        return [
          `Les deux droites se croisent près du coût des unités anciennes, ${eur(ancien)} au stock du 1er ${x.nom} et ${eur(x.prix1)} à la première livraison : quand la seconde livraison coûte ce que coûtent les autres, les méthodes se rejoignent. Au-dessus, le PEPS garde en stock les derniers lots, les plus chers, et son stock final monte plus vite que le coût moyen, qui dilue la hausse sur toutes les unités.`,
          `À la hausse annoncée, ${eur(x.prix2)}, le PEPS donne ${eur(peps)} et le coût moyen de la période ${eur(cmup)}, son coût arrondi au centime comme dans les énoncés : ${eur(auCentime(peps - cmup))} d'écart. Les étapes suivantes le calculent sur la fiche.`,
        ];
      },
    },
    {
      id: "le-peps-du-mois",
      objectifs: [2],
      type: "montants",
      titre: "La fiche de stock en PEPS",
      notions: ["stock"],
      tableau: (c) => tableauDuMois(leMois(c)),
      question: (c) => {
        const x = leMois(c);
        return `Tenez la fiche de stock ${dE(x.nom)} en premier entré, premier sorti : chaque sortie consomme d'abord le lot le plus ancien. Valorisez les deux sorties, le coût d'achat des marchandises vendues du mois et le stock final.`;
      },
      champs: (c) => {
        const x = leMois(c);
        const v = moisValorise(x, "peps");
        const lots = lotsDuPeps(ficheDuMois(x));
        return [
          { libelle: `Sortie du ${x.jours.ventes1}`, attendu: v.sortie1, calcul: `${enLots(lots.sorties[0]!)} = ${eur(v.sortie1)}` },
          { libelle: `Sortie du ${x.jours.ventes2}`, attendu: v.sortie2, calcul: `${enLots(lots.sorties[1]!)} = ${eur(v.sortie2)}` },
          { libelle: "Coût d'achat des marchandises vendues du mois", attendu: v.cout, calcul: `${eur(v.sortie1)} + ${eur(v.sortie2)} = ${eur(v.cout)}` },
          { libelle: "Stock final, en PEPS", attendu: v.final.valeur, calcul: `les lots qui restent : ${enLots(lots.restants)} = ${eur(v.final.valeur)}` },
        ];
      },
      explication: (c) => {
        const x = leMois(c);
        const v = moisValorise(x, "peps");
        return [
          `En PEPS, les ventes du mois sortent les unités les plus anciennes : la hausse du ${x.jours.livraison2} n'atteint aucune sortie, et elle est toute dans le stock final, ${eur(v.final.valeur)}. Elle passera dans le coût des ventes plus tard, quand ces lots sortiront.`,
        ];
      },
    },
    {
      id: "inventaire-permanent",
      objectifs: [2],
      type: "choix",
      titre: "L'inventaire permanent",
      notions: ["stock"],
      question: (c) => {
        const x = leMois(c);
        return `La fiche de stock ${dE(x.nom)} donne à chaque instant les unités en stock et leur valeur : c'est l'inventaire permanent. ${c.entreprise} a-t-elle encore besoin de compter son rayon à la fin du mois ?`;
      },
      options: () => [
        {
          texte: "Oui : la fiche donne le stock théorique, le comptage le stock réel, et l'écart révèle la démarque",
          juste: true,
          retour: "C'est cela. La fiche ne voit ni le vol, ni la casse, ni l'erreur de saisie : l'inventaire physique, au moins une fois par exercice, les fait apparaître, et c'est le stock compté qui va au bilan. Le cas du chapitre part de là.",
        },
        { texte: "Non : la fiche suit chaque mouvement, le stock qu'elle donne est exact", juste: false, retour: "La fiche enregistre ce qui est saisi, pas ce qui disparaît sans facture : vol, casse, erreurs. Seul le comptage le voit." },
        {
          texte: "Oui, mais seulement pour valoriser le stock : la fiche ne connaît que les quantités",
          juste: false,
          retour: "La fiche valorise chaque entrée et chaque sortie : elle donne la valeur. Le comptage sert à vérifier les quantités.",
        },
      ],
    },
    {
      id: "le-laboratoire-des-methodes",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des méthodes",
      notions: ["stock", "weighted_average_cost", "margin_rates"],
      question: (c) => {
        const x = leMois(c);
        return `Le mois ${dE(x.nom)} vend ${qte(2 * x.vente)} unités pour ${eur(x.ventesDuMois)} hors taxes. Choisissez la méthode, le prix et la taille de la seconde livraison : le tableau suit le stock final, le coût des ventes et la marge du mois ; le graphique trace la marge dans les trois méthodes selon le prix de la seconde livraison.`;
      },
      leviers: (c) => {
        const x = leMois(c);
        return [
          {
            code: "methode",
            libelle: "La méthode de valorisation",
            unite: "",
            min: METHODES_DU_LABORATOIRE.cmupPeriode,
            max: METHODES_DU_LABORATOIRE.peps,
            pas: 1,
            depart: METHODES_DU_LABORATOIRE.cmupPeriode,
            choix: [
              { valeur: METHODES_DU_LABORATOIRE.cmupPeriode, libelle: NOMS_DES_METHODES["cmup-periode"] },
              { valeur: METHODES_DU_LABORATOIRE.cmupApresChaqueEntree, libelle: NOMS_DES_METHODES["cmup-apres-chaque-entree"] },
              { valeur: METHODES_DU_LABORATOIRE.peps, libelle: NOMS_DES_METHODES.peps },
            ],
          },
          { code: "prix", libelle: "Prix d'une unité de la seconde livraison", unite: "€", min: x.prix1 - 2, max: x.prix1 + 5, pas: 0.5, depart: x.prix2 },
          { code: "unites", libelle: "Unités de la seconde livraison", unite: "unités", min: 0, max: 2 * x.livraison, pas: 10, depart: x.livraison },
        ];
      },
      lecture: (c, p) => {
        const x = leMois(c);
        const l = moisValorise(x, methodeDe(p.methode!), p.prix!, p.unites!);
        const d = moisValorise(x, "cmup-periode");
        const sans = margeSansLaHausse(x);
        return [
          { libelle: "Stock final, en unités", montant: l.final.quantite, unite: "unités", reference: d.final.quantite },
          { libelle: "Valeur du stock final", montant: l.final.valeur, reference: d.final.valeur },
          { libelle: "Coût d'achat des marchandises vendues du mois", montant: l.cout, reference: d.cout },
          { libelle: "Marge du mois", montant: l.marge, reference: d.marge },
          { libelle: "Marge face au mois sans hausse, au coût moyen de période", montant: auCentime(l.marge - sans), reference: auCentime(d.marge - sans), effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = leMois(c);
        return {
          levier: "prix",
          courbes: (["cmup-periode", "cmup-apres-chaque-entree", "peps"] as const).map((m) => ({ libelle: `Marge, ${NOMS_DES_METHODES[m].toLowerCase()}`, valeur: (p: Readonly<Record<string, number>>) => moisValorise(x, m, p.prix!, p.unites!).marge })),
        };
      },
      defi: (c) => {
        const x = leMois(c);
        const sans = margeSansLaHausse(x);
        return {
          consigne: `La hausse est là, et la livraison aussi : sans baisser le prix ni réduire la seconde livraison, gardez la marge du mois au moins à ${eur(sans)}, ce qu'elle serait sans hausse au coût moyen de la période.`,
          atteint: (p) => p.prix! >= x.prix2 && p.unites! >= x.livraison && moisValorise(x, methodeDe(p.methode!), p.prix!, p.unites!).marge >= sans,
          indice: (p) => {
            if (p.prix! < x.prix2) return `Le fournisseur ne baissera pas son prix : il facture ${eur(x.prix2)} l'unité.`;
            if (p.unites! < x.livraison) return `Ne réduisez pas la livraison : sans elle, le rayon manquerait de marchandises le mois suivant.`;
            const l = moisValorise(x, methodeDe(p.methode!), p.prix!, p.unites!);
            return methodeDe(p.methode!) === "cmup-periode"
              ? `Au coût moyen de la période, la hausse se répartit sur toutes les sorties du mois : la marge tombe à ${eur(l.marge)}.`
              : methodeDe(p.methode!) === "cmup-apres-chaque-entree"
                ? `Au coût moyen après chaque entrée, la sortie du ${x.jours.ventes2} part déjà au nouveau coût moyen : la marge vaut ${eur(l.marge)}.`
                : `En PEPS, la hausse attend dans le stock ; ici la marge vaut ${eur(l.marge)}.`;
          },
          solution: { methode: METHODES_DU_LABORATOIRE.peps, prix: x.prix2, unites: x.livraison },
        };
      },
      explication: (c) => {
        const x = leMois(c);
        const peps = moisValorise(x, "peps");
        const periode = moisValorise(x, "cmup-periode");
        return [
          `En PEPS, la marge du mois ne voit pas la hausse : les ventes sortent les lots anciens, et sa courbe reste à plat quand le prix de la seconde livraison monte. Les deux coûts moyens, eux, la répartissent tout de suite. Le stock final le montre : ${eur(peps.final.valeur)} en PEPS contre ${eur(periode.final.valeur)} au coût moyen de la période, pour les mêmes ${qte(peps.final.quantite)} unités.`,
          "La marge n'est pas meilleure pour autant : les mêmes unités ont été vendues au même prix, et la même somme a été payée au fournisseur. La hausse est seulement remise à plus tard, dans le stock, et elle pèsera sur la marge du mois où ces lots sortiront.",
        ];
      },
    },
    {
      id: "le-cmup-apres-chaque-entree",
      objectifs: [2],
      type: "montants",
      titre: "Le coût moyen après chaque entrée",
      notions: ["stock", "weighted_average_cost"],
      tableau: (c) => tableauDuMois(leMois(c)),
      question: (c) => {
        const x = leMois(c);
        return `Tenez la même fiche ${dE(x.nom)} au coût moyen pondéré après chaque entrée, les coûts arrondis au centime : le coût moyen se recalcule à chaque livraison, et chaque sortie part au coût du moment.`;
      },
      champs: (c) => {
        const x = leMois(c);
        const v = moisValorise(x, "cmup-apres-chaque-entree");
        const f = ficheDuMois(x);
        const l = v.v.lignes;
        return [
          {
            libelle: `Coût moyen après la livraison du ${x.jours.livraison1}`,
            attendu: v.coutApres1,
            calcul: `(${eur(f.initial.valeur)} + ${qte(x.livraison)} × ${eur(x.prix1)}) ÷ (${qte(f.initial.quantite)} + ${qte(x.livraison)}) = ${eur(v.coutApres1)}`,
          },
          { libelle: `Sortie du ${x.jours.ventes1}`, attendu: v.sortie1, calcul: `${qte(x.vente)} × ${eur(v.coutApres1)} = ${eur(v.sortie1)}` },
          {
            libelle: `Coût moyen après la livraison du ${x.jours.livraison2}`,
            attendu: v.coutApres2,
            calcul: `(${eur(l[1]!.stock.valeur)} + ${qte(x.livraison)} × ${eur(x.prix2)}) ÷ (${qte(l[1]!.stock.quantite)} + ${qte(x.livraison)}) = ${eur(v.coutApres2)}`,
          },
          { libelle: "Stock final, au coût moyen après chaque entrée", attendu: v.final.valeur, calcul: `${eur(l[2]!.stock.valeur)} − ${qte(x.vente)} × ${eur(v.coutApres2)} = ${eur(v.final.valeur)}` },
        ];
      },
      explication: (c) => {
        const x = leMois(c);
        const v = moisValorise(x, "cmup-apres-chaque-entree");
        return [
          `Le coût moyen après chaque entrée se tient entre les deux autres méthodes : la sortie du ${x.jours.ventes1} ignore la hausse, celle du ${x.jours.ventes2} en porte une part. Stock final : ${eur(v.final.valeur)}.`,
          "C'est la méthode des logiciels de gestion de stock : la fiche connaît la valeur à tout moment. Le coût moyen de la période, lui, ne se calcule qu'une fois la période close.",
        ];
      },
    },
    {
      id: "la-methode-et-la-marge",
      objectifs: [3],
      type: "choix",
      titre: "Changer de méthode pour la marge",
      notions: ["stock", "margin_rates"],
      tableau: (c) => tableauDesMethodes(leMois(c)),
      question: (c) => {
        const x = leMois(c);
        const ecart = auCentime(moisValorise(x, "peps").marge - moisValorise(x, "cmup-periode").marge);
        return `En PEPS, la marge ${dE(x.nom)} serait plus forte de ${eur(ecart)} qu'au coût moyen de la période, la méthode de ${c.entreprise}. Le gérant veut changer de méthode. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = leMois(c);
        const ecart = auCentime(moisValorise(x, "peps").marge - moisValorise(x, "cmup-periode").marge);
        return [
          {
            texte: "La marge n'est pas meilleure, la hausse attend dans le stock ; et une méthode ne se change pas pour embellir un mois",
            juste: true,
            retour:
              "Oui. Les mêmes unités ont été vendues au même prix : le PEPS reporte la hausse au mois où les lots chers sortiront. Et la permanence des méthodes interdit d'en changer sans raison, faute de quoi les comptes ne se comparent plus d'une période à l'autre ; un changement justifié se dit dans l'annexe.",
          },
          { texte: `Oui : ${eur(ecart)} de marge en plus, sans rien changer aux ventes`, juste: false, retour: "Non : aucune vente de plus, aucun achat de moins. La hausse n'a pas disparu ; elle est dans le stock final, et pèsera plus tard." },
          {
            texte: "Oui, mais en ne passant au PEPS que le stock final, les sorties restant au coût moyen",
            juste: false,
            retour: "Non : une méthode vaut pour toute la fiche. Valoriser les sorties d'une façon et le stock d'une autre ferait disparaître de la valeur ou en créer.",
          },
          {
            texte: "Non : le PEPS est interdit en France",
            juste: false,
            retour: "Non : le plan comptable admet le coût moyen pondéré et le PEPS. C'est le dernier entré, premier sorti qu'il écarte.",
          },
        ];
      },
    },
    {
      id: "le-stock-sinistre",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver un stock à rebours",
      notions: ["stock", "margin_rates"],
      question: (c) => {
        const a = arrete(c);
        const s = leSinistre(c);
        return `Le ${date(s.jour)}, un dégât des eaux détruit la réserve ${dE(c.entreprise)} ; ${pct(LE_SINISTRE.partSauvee)} des marchandises sont sauvées. Pas d'inventaire possible : l'assureur demande la valeur du stock détruit. Depuis le ${date(a.debut)}, le stock initial vaut ${eur(a.initial.valeur)} ; les achats font ${eur(s.achats)} et les ventes ${eur(s.ventes)} hors taxes ; le taux de marque habituel est de ${pct(s.tauxDeMarque)}. Retrouvez le coût d'achat des ventes, le stock du jour du sinistre, puis la valeur du stock détruit.`;
      },
      champs: (c) => {
        const a = arrete(c);
        const s = leSinistre(c);
        return [
          { libelle: "Coût d'achat des ventes, estimé par le taux de marque", attendu: s.cout, calcul: `${eur(s.ventes)} × (1 − ${pct(s.tauxDeMarque)}) = ${eur(s.cout)}` },
          { libelle: "Stock le jour du sinistre", attendu: s.stock, calcul: `${eur(a.initial.valeur)} + ${eur(s.achats)} − ${eur(s.cout)} = ${eur(s.stock)}` },
          { libelle: "Valeur du stock détruit", attendu: s.detruit, calcul: `${eur(s.stock)} × (1 − ${pct(LE_SINISTRE.partSauvee)}) = ${eur(s.detruit)}` },
        ];
      },
      explication: (c) => {
        const s = leSinistre(c);
        return [
          `Le taux de marque se lit à l'envers : ventes × (1 − taux de marque) donne le coût d'achat de ce qui a été vendu, et la relation de l'inventaire, stock final = stock initial + achats − coût des ventes, donne le stock. ${eur(s.detruit)} à déclarer, à condition que le taux habituel vaille encore : une promotion depuis le ${date(arrete(c).debut)} l'aurait fait baisser, et le stock estimé serait trop haut.`,
        ];
      },
    },
    {
      id: "stock-qui-dort",
      objectifs: [1],
      type: "choix",
      titre: "Un stock, ça coûte",
      notions: ["stock", "bfr"],
      question: (c) => {
        const a = arrete(c);
        return `Au ${date(a.fin)}, ${eur(a.final.valeur)} de marchandises attendent en rayon. Qu'est-ce que cela représente pour ${c.entreprise} ?`;
      },
      options: () => [
        {
          texte: "De l'argent immobilisé : payé au fournisseur, pas encore revenu des clients.",
          juste: true,
          retour:
            "C'est cela. Le stock est un actif, mais il pèse sur la trésorerie : c'est l'un des postes du besoin en fonds de roulement. Il faut assez de stock pour ne pas manquer de ventes, pas plus.",
        },
        {
          texte: "Une perte : ce qui n'est pas vendu est perdu.",
          juste: false,
          retour: "Des marchandises qui se gardent se vendront au trimestre suivant. Elles ne perdent leur valeur que si elles s'abîment ou passent de mode : on les déprécie alors, au palier suivant.",
        },
        { texte: "Un bénéfice : le stock augmente l'actif.", juste: false, retour: "Il augmente l'actif, mais il ne rapporte rien tant qu'il n'est pas vendu, et il a été payé." },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["stock"],
      tableau: (c) => tableauDesMethodes(leMois(c)),
      texte: (c) => {
        const a = arrete(c);
        return [
          `Vous avez arrêté le ${a.trimestreEcrit} ${dE(c.entreprise)} : l'inventaire de ${qte(a.final.quantite)} unités au coût moyen pondéré, les deux écritures d'inventaire, le coût d'achat des marchandises vendues et la marge commerciale. Puis vous avez tenu le mois suivant sur une fiche de stock, dans les trois méthodes.`,
          "Quand les prix montent, le PEPS donne le stock final le plus élevé et la marge la plus forte, le coût moyen de la période le plus bas, le coût moyen après chaque entrée entre les deux. Aucune ne change ce qui a été vendu ni ce qui a été payé : la méthode répartit la hausse entre le mois et le stock.",
          "Au niveau de l'examen, vous savez passer un arrêté en inventaire intermittent, tenir une fiche de stock dans les trois méthodes, dire ce que la méthode change à la marge et pourquoi elle ne se change pas à volonté, et retrouver un stock à rebours par le taux de marque.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'achat des marchandises vendues = stock initial + achats − stock final. À l'arrêté : on annule le stock initial (6037 au débit), on constate le stock final (6037 au crédit). En hausse de prix : stock final en PEPS > coût moyen après chaque entrée > coût moyen de la période.",
    },
  ],
};
