import { taux2 } from "../../../pedagogy/cours/deux-decimales";
import { panierDuMois } from "./vente-et-caisse";
import { valoriserLeStock, type FicheDeStock, type MethodeDeStock } from "./stock";
import type { CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * L'INVENTAIRE, LA DÉMARQUE, LES RISQUES ET LE COÛT DU STOCK DE MAILLE & CO (BTS MCO, bloc 3).
 *
 * Ce module complète la fiche de la boutique (monde/maille-et-co.ts) sans la contredire. Il sert le
 * chapitre « L'inventaire et la démarque », son cas, et le complément du chapitre « Le stock du
 * point de vente » (coûts de passation et de possession, quantité économique).
 *
 *   1. L'INVENTAIRE DE FIN D'EXERCICE (31 décembre de N − 1). La fiche de stock de l'écharpe en
 *      décembre : le stock du 1er décembre, deux livraisons à deux prix (le façonnier a relevé son
 *      prix le 14), les 1 500 écharpes vendues en décembre (celles de DECEMBRE_N_MOINS_1, monde/
 *      vente-et-caisse.ts) et le comptage du 31 décembre, 350 écharpes : le stock du 1er janvier de
 *      la fiche. Valorisé au premier entré, premier sorti, ce stock vaut 14 € l'écharpe, le coût
 *      d'achat de janvier que lisent les autres chapitres ; au coût moyen pondéré, il vaut moins.
 *   2. LA DÉMARQUE DE JANVIER (un inventaire tournant le 31 janvier) : le stock théorique de chaque
 *      référence (stock du 1er janvier + livraisons − ventes, celui des autres chapitres) face au
 *      comptage. La différence est la démarque ; deux bonnets tachés, sortis du stock sur un bon,
 *      sont la démarque connue, le reste la démarque inconnue.
 *   3. LA PRÉVENTION ET L'ASSURANCE : quatre protections, chacune avec son coût de l'année et la part
 *      de la démarque inconnue qu'elle évite ; les risques de la boutique ; deux contrats d'assurance.
 *   4. LE COÛT DU STOCK (complément du chapitre du stock) : le coût de passation d'une commande, le
 *      taux de possession, la quantité économique du pull col rond.
 *
 * Toutes les valeurs sont hors taxes. Les hypothèses sont des constantes nommées ; les règles de droit
 * citées dans les chapitres sont commentées là où elles servent.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plafond = (x: number) => Math.ceil(x - 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. L'INVENTAIRE DE FIN D'EXERCICE : L'ÉCHARPE EN DÉCEMBRE DE N − 1
// ═════════════════════════════════════════════════════════════════════════════

/** La référence de la fiche de stock de décembre. */
export const REFERENCE_DE_L_INVENTAIRE: CodeDeReference = "echarpe";

/**
 * LA FICHE DE STOCK DE L'ÉCHARPE EN DÉCEMBRE DE N − 1 (hypothèse du cours). Le 1er décembre, 330
 * écharpes achetées 13 € ; le 2, une livraison de 600 écharpes à 13 € ; le 14, le façonnier a relevé
 * son prix à 14 € (celui de janvier, la fiche) et livre 930 écharpes. Le mois en vend 1 500 (les
 * achats de décembre des trois clientèles, vente-et-caisse.ts). Le comptage du 31 décembre trouve
 * 350 écharpes, le stock du 1er janvier de la fiche.
 */
export const ECHARPE_EN_DECEMBRE = {
  initial: { quantite: 330, prix: 13 },
  livraisons: [
    { jour: 2, quantite: 600, prix: 13 },
    { jour: 14, quantite: 930, prix: 14 },
  ],
  vendues: 1_500,
  comptees: 350,
} as const;

/** La fiche de stock de décembre, pour le modèle des stocks (monde/stock.ts) : les ventes du mois, puis le manquant constaté le 31. */
export function ficheDeDecembre(): { fiche: FicheDeStock; manquant: number } {
  const e = ECHARPE_EN_DECEMBRE;
  const disponible = e.initial.quantite + somme(e.livraisons.map((l) => l.quantite));
  const manquant = disponible - e.vendues - e.comptees;
  return {
    manquant,
    fiche: {
      libelle: "l'écharpe en décembre",
      initial: { quantite: e.initial.quantite, valeur: auCentime(e.initial.quantite * e.initial.prix) },
      mouvements: [
        ...e.livraisons.map((l) => ({ date: { jour: l.jour, mois: 12 }, libelle: `livraison du ${l.jour} décembre`, sens: "entree" as const, quantite: l.quantite, prixUnitaire: l.prix })),
        { date: { jour: 30, mois: 12 }, libelle: "ventes de décembre", sens: "sortie" as const, quantite: e.vendues },
        { date: { jour: 31, mois: 12 }, libelle: "manquant à l'inventaire", sens: "sortie" as const, quantite: manquant },
      ],
    },
  };
}

/** L'inventaire du 31 décembre valorisé par une méthode : les ventes, le manquant et le stock final, et la marge de décembre sur l'écharpe. */
export function inventaireDeDecembre(f: FicheDeLaBoutique, methode: Extract<MethodeDeStock, "cmup-periode" | "peps">) {
  const { fiche, manquant } = ficheDeDecembre();
  const v = valoriserLeStock(fiche, methode);
  const [ventes, perte] = v.lignes.filter((l) => l.mouvement.sens === "sortie");
  const prixHt = f.gamme.find((r) => r.code === REFERENCE_DE_L_INVENTAIRE)!.prixHt;
  const chiffreDAffaires = auCentime(ECHARPE_EN_DECEMBRE.vendues * prixHt);
  // Le coût d'achat des marchandises sorties (vendues et manquantes) : stock initial + achats − stock final.
  const coutDesSorties = auCentime(fiche.initial.valeur + v.entrees.valeur - v.final.valeur);
  return {
    methode,
    disponible: { quantite: fiche.initial.quantite + v.entrees.quantite, valeur: auCentime(fiche.initial.valeur + v.entrees.valeur) },
    initial: fiche.initial,
    entrees: v.entrees,
    coutMoyen: v.coutMoyenDePeriode,
    ventes: ventes!.valeur,
    manquant: { quantite: manquant, valeur: perte!.valeur },
    final: v.final,
    chiffreDAffaires,
    coutDesSorties,
    margeCommerciale: auCentime(chiffreDAffaires - coutDesSorties),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA DÉMARQUE DE JANVIER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE COMPTAGE DU 31 JANVIER (hypothèse du cours) : un inventaire tournant, référence par référence.
 * Les autres chapitres lisent le stock théorique (stock du 1er janvier + livraisons − ventes) ; le
 * comptage en trouve moins. Le cardigan, en rupture, n'a plus rien en rayon.
 */
export const COMPTAGE_DU_31_JANVIER: Readonly<Record<CodeDeReference, number>> = {
  "col-rond": 291,
  cardigan: 0,
  merinos: 38,
  echarpe: 212,
  bonnet: 63,
};

/**
 * LA DÉMARQUE CONNUE DE JANVIER (hypothèse du cours) : deux bonnets tachés, retirés de la vente et
 * sortis du stock sur un bon de casse. Ce qui manque encore au comptage est la démarque inconnue :
 * vols, erreurs de caisse, d'étiquetage ou de réception.
 */
export const DEMARQUE_CONNUE: Readonly<Partial<Record<CodeDeReference, number>>> = { bonnet: 2 };

/**
 * LE SEUIL D'ALERTE DE LA DÉMARQUE INCONNUE (hypothèse du cours) : la direction la veut sous 1 % du
 * chiffre d'affaires du mois, mesurée au prix de vente hors taxes.
 */
export const SEUIL_DE_DEMARQUE = 0.01;

/** La démarque de janvier, référence par référence : stock théorique, démarque connue, comptage, démarque inconnue. */
export function demarqueDeJanvier(f: FicheDeLaBoutique) {
  const references = f.gamme.map((r) => {
    const theorique = r.stockInitial + somme(r.livraisons.map((l) => l.quantite)) - r.ventesDuMois;
    const connue = DEMARQUE_CONNUE[r.code] ?? 0;
    const comptees = COMPTAGE_DU_31_JANVIER[r.code];
    const inconnue = theorique - connue - comptees;
    return {
      code: r.code,
      nom: r.nom,
      theorique,
      connue,
      comptees,
      inconnue,
      auPrixDeVente: auCentime(inconnue * r.prixHt),
      auCoutDAchat: auCentime(inconnue * r.coutDAchat),
      connueAuCoutDAchat: auCentime(connue * r.coutDAchat),
    };
  });
  const chiffreDAffaires = auCentime(somme(f.gamme.map((r) => r.ventesDuMois * r.prixHt)));
  const auPrixDeVente = auCentime(somme(references.map((r) => r.auPrixDeVente)));
  const auCoutDAchat = auCentime(somme(references.map((r) => r.auCoutDAchat)));
  // La marge d'un passage au centime, le quotient à deux décimales, puis à l'unité au-dessus, comme sur la copie.
  const margeDUnPassage = auCentime(panierDuMois(f).marge);
  const passagesCalcules = auCentime(auCoutDAchat / margeDUnPassage);
  return {
    references,
    articles: somme(references.map((r) => r.inconnue)),
    connue: somme(references.map((r) => r.connue)),
    connueAuCoutDAchat: auCentime(somme(references.map((r) => r.connueAuCoutDAchat))),
    auPrixDeVente,
    auCoutDAchat,
    chiffreDAffaires,
    /** Le taux de démarque inconnue : sa valeur au prix de vente hors taxes ÷ le chiffre d'affaires du mois. */
    taux: auPrixDeVente / chiffreDAffaires,
    /** Ce que la démarque inconnue d'un mois comme janvier coûte sur l'année, au coût d'achat. */
    parAn: auCentime(auCoutDAchat * 12),
    /** Les passages en caisse qu'il faut, à la marge d'un passage de janvier, pour payer la démarque du mois. */
    passagesCalcules,
    passagesPourLaPayer: plafond(passagesCalcules),
    margeDUnPassage,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA PRÉVENTION, LES RISQUES ET L'ASSURANCE
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeProtection = "antivol" | "cameras" | "vigile" | "formation";

export interface Protection {
  code: CodeDeProtection;
  nom: string;
  /** Ce qu'elle coûte sur l'année, hors taxes. */
  coutParAn: number;
  /** La part de la démarque inconnue restante qu'elle évite. */
  efficacite: number;
}

/**
 * LES QUATRE PROTECTIONS (hypothèses du cours, ordres de grandeur d'un petit magasin) :
 *   · les portiques et les étiquettes antivol : 3 600 € de portiques amortis sur 4 ans (900 € par an)
 *     et 600 € d'étiquettes par an ; ils évitent la moitié de la démarque inconnue ;
 *   · la vidéoprotection, en abonnement : 80 € par mois ; elle en évite 20 % ;
 *   · un vigile d'une société de sécurité le samedi : 52 samedis de 9 heures à 28 € de l'heure ; il en
 *     évite 35 % ;
 *   · la formation de l'équipe à la prévention (accueillir chaque client, surveiller les cabines,
 *     contrôler les réceptions) : 600 € ; elle en évite 15 %.
 * Les protections se cumulent sur ce qui reste : deux protections de 50 % et 20 % laissent
 * 0,5 × 0,8 = 40 % de la démarque, pas 30 %.
 */
export const PROTECTIONS: readonly Protection[] = [
  { code: "antivol", nom: "Portiques et étiquettes antivol", coutParAn: 1_500, efficacite: 0.5 },
  { code: "cameras", nom: "Vidéoprotection", coutParAn: 960, efficacite: 0.2 },
  { code: "vigile", nom: "Vigile le samedi", coutParAn: 52 * 9 * 28, efficacite: 0.35 },
  { code: "formation", nom: "Formation de l'équipe à la prévention", coutParAn: 600, efficacite: 0.15 },
];

/** La démarque de l'année, les protections choisies : ce qu'elles coûtent, ce qu'elles évitent, ce qu'elles rapportent. */
export function protegerLaBoutique(f: FicheDeLaBoutique, choisies: readonly CodeDeProtection[]) {
  const d = demarqueDeJanvier(f);
  const retenues = PROTECTIONS.filter((p) => choisies.includes(p.code));
  const reste = retenues.reduce((t, p) => t * (1 - p.efficacite), 1);
  const evitee = auCentime(d.parAn * (1 - reste));
  const cout = somme(retenues.map((p) => p.coutParAn));
  return { demarque: d.parAn, part: 1 - reste, evitee, restante: auCentime(d.parAn - evitee), cout, gain: auCentime(evitee - cout) };
}

/** La meilleure combinaison des protections : le gain le plus grand (la démarque évitée moins le coût). */
export function meilleureProtection(f: FicheDeLaBoutique) {
  const codes = PROTECTIONS.map((p) => p.code);
  const combinaisons = Array.from({ length: 2 ** codes.length }, (_, m) => codes.filter((_, i) => (m >> i) & 1));
  return combinaisons.map((c) => ({ choisies: c, ...protegerLaBoutique(f, c) })).reduce((a, b) => (b.gain > a.gain ? b : a));
}

export type ParadeAuRisque = "prevenir" | "assurer" | "accepter";

export interface RisqueDeLaBoutique {
  nom: string;
  /** Combien de fois par an il survient, en moyenne. */
  frequenceParAn: number;
  /** Ce qu'il coûte quand il survient. */
  coutParSinistre: number;
  parade: ParadeAuRisque;
}

/**
 * LES RISQUES DE LA BOUTIQUE (hypothèses du cours) : leur fréquence et leur coût. La démarque inconnue
 * reprend janvier : 24 articles par mois, 288 par an, à 20,69 € en moyenne au coût d'achat. Le risque se mesure
 * par son coût moyen de l'année (fréquence × coût), et la parade suit sa forme : un risque fréquent
 * et léger se prévient (il ne s'assure pas, la prime le paierait deux fois) ; un risque rare et lourd
 * s'assure ; un risque rare et léger s'accepte, sous surveillance.
 */
export const RISQUES: readonly RisqueDeLaBoutique[] = [
  { nom: "Vol à l'étalage et démarque inconnue", frequenceParAn: 288, coutParSinistre: 20.69, parade: "prevenir" },
  { nom: "Erreur de caisse", frequenceParAn: 24, coutParSinistre: 10, parade: "prevenir" },
  { nom: "Cambriolage avec effraction", frequenceParAn: 0.05, coutParSinistre: 18_000, parade: "assurer" },
  { nom: "Dégât des eaux dans la réserve", frequenceParAn: 0.1, coutParSinistre: 6_000, parade: "assurer" },
  { nom: "Cliente blessée par une chute en boutique", frequenceParAn: 0.02, coutParSinistre: 25_000, parade: "assurer" },
  { nom: "Panne d'une heure du terminal de paiement", frequenceParAn: 2, coutParSinistre: 40, parade: "accepter" },
];

/** Le coût moyen d'un risque sur l'année. */
export const coutMoyenDuRisque = (r: RisqueDeLaBoutique) => auCentime(r.frequenceParAn * r.coutParSinistre);

/**
 * LES DEUX CONTRATS D'ASSURANCE MULTIRISQUE (hypothèses du cours) : ils couvrent le cambriolage, le
 * dégât des eaux et la responsabilité civile, pas la démarque inconnue (aucun assureur ne rembourse
 * un vol à l'étalage sans effraction). Le contrat A coûte plus cher et laisse 500 € à la charge de la
 * boutique par sinistre ; le contrat B, moins cher, en laisse 2 000. Comme toute prime, chacune dépasse
 * le coût moyen des sinistres qu'elle couvre : l'assureur se paie, la boutique achète un plafond à ses pertes.
 */
export const CONTRATS_D_ASSURANCE = [
  { code: "A", primeParAn: 2_400, franchise: 500 },
  { code: "B", primeParAn: 1_900, franchise: 2_000 },
] as const;

/** Les sinistres assurés de l'année, d'après les risques : ceux dont la parade est l'assurance. */
export function contratDAssurance(code: "A" | "B") {
  const c = CONTRATS_D_ASSURANCE.find((x) => x.code === code)!;
  const assures = RISQUES.filter((r) => r.parade === "assurer");
  const sinistresParAn = somme(assures.map((r) => r.frequenceParAn));
  const franchisesParAn = auCentime(sinistresParAn * c.franchise);
  // Le pire sinistre de l'année : sans assurance, la boutique le paie en entier ; assurée, la franchise.
  const pire = Math.max(...assures.map((r) => r.coutParSinistre));
  return {
    ...c,
    sinistresParAn,
    franchisesParAn,
    coutMoyenParAn: auCentime(c.primeParAn + franchisesParAn),
    sansAssurance: auCentime(somme(assures.map(coutMoyenDuRisque))),
    pire,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE COÛT DU STOCK : PASSATION, POSSESSION, QUANTITÉ ÉCONOMIQUE
// ═════════════════════════════════════════════════════════════════════════════

/** La référence du complément du chapitre du stock. */
export const REFERENCE_DU_COUT_DU_STOCK: CodeDeReference = "col-rond";

/**
 * LE COÛT DE PASSATION D'UNE COMMANDE (hypothèse du cours) : 60 €, le temps de préparer la commande,
 * de recevoir et de contrôler la livraison, plus le transport forfaitaire du façonnier.
 */
export const COUT_DE_PASSATION = 60;

/**
 * LE TAUX DE POSSESSION (hypothèse du cours) : garder un article en stock une année coûte 20 % de son
 * coût d'achat (l'argent immobilisé, la place de la réserve, l'assurance, la démarque, la démode).
 */
export const TAUX_DE_POSSESSION = 0.2;

/** Les mois d'une année : la demande de l'année au rythme de janvier. */
export const MOIS_PAR_AN = 12;

/** Les nombres de commandes par an que le laboratoire essaie. */
export const COMMANDES_PAR_AN_ESSAYEES = { min: 4, max: 36, pas: 1 } as const;

/** Le coût du stock du pull col rond pour un nombre de commandes par an : passation, possession du stock moyen, total. */
export function coutDuStock(f: FicheDeLaBoutique, commandesParAn: number) {
  const r = f.gamme.find((x) => x.code === REFERENCE_DU_COUT_DU_STOCK)!;
  const demande = r.ventesDuMois * MOIS_PAR_AN;
  const possessionUnitaire = auCentime(r.coutDAchat * TAUX_DE_POSSESSION);
  const quantite = demande / commandesParAn;
  const passation = auCentime(commandesParAn * COUT_DE_PASSATION);
  const possession = auCentime((quantite / 2) * possessionUnitaire);
  return { demande, possessionUnitaire, quantite, passation, possession, total: auCentime(passation + possession) };
}

/** La quantité économique (Wilson) : Q* = √(2 × demande × coût de passation ÷ coût de possession d'un article). */
export function quantiteEconomique(f: FicheDeLaBoutique) {
  const c = coutDuStock(f, 1);
  const q = Math.sqrt((2 * c.demande * COUT_DE_PASSATION) / c.possessionUnitaire);
  const n = c.demande / q;
  const essais = Array.from({ length: COMMANDES_PAR_AN_ESSAYEES.max - COMMANDES_PAR_AN_ESSAYEES.min + 1 }, (_, i) => COMMANDES_PAR_AN_ESSAYEES.min + i);
  const meilleur = essais.map((k) => ({ k, total: coutDuStock(f, k).total })).reduce((a, b) => (b.total < a.total ? b : a));
  return {
    demande: c.demande,
    possessionUnitaire: c.possessionUnitaire,
    quantite: q,
    quantiteArrondie: Math.round(q),
    commandes: n,
    coutMinimal: auCentime(Math.sqrt(2 * c.demande * COUT_DE_PASSATION * c.possessionUnitaire)),
    /** Le meilleur nombre entier de commandes par an, et son coût. */
    commandesEntieres: meilleur.k,
    coutAuMeilleurEntier: meilleur.total,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE DÉGÂT DES EAUX DANS LA RÉSERVE (le cas du chapitre)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE SINISTRE (hypothèse du cas « Le dégât des eaux dans la réserve ») : un lundi de février, une
 * canalisation fuit dans la réserve. 60 écharpes, 40 bonnets et 30 pulls col rond sont perdus ; la
 * remise en état de la réserve coûte 2 400 € ; la boutique ferme 2 jours pour sécher et ranger. Elle
 * est assurée par le contrat B (2 000 € de franchise par sinistre). L'assureur rembourse le stock à
 * sa valeur d'achat, celle de l'inventaire, pas au prix de vente : la boutique n'a perdu que ce
 * qu'elle avait payé. La déclaration se fait sous 5 jours ouvrés (Code des assurances, art. L113-2).
 */
export const DEGAT_DES_EAUX = {
  articles: { echarpe: 60, bonnet: 40, "col-rond": 30 } as Readonly<Partial<Record<CodeDeReference, number>>>,
  remiseEnEtat: 2_400,
  joursDeFermeture: 2,
  contrat: "B" as const,
} as const;

/**
 * LA GARANTIE DES PERTES D'EXPLOITATION (hypothèse du cas) : 480 € de plus par an ; elle rembourse la
 * marge sur coût variable perdue pendant une fermeture après sinistre. Une fermeture arrive, en
 * moyenne, avec un cambriolage ou un dégât des eaux (les risques de la boutique).
 */
export const GARANTIE_PERTES_D_EXPLOITATION = 480;

/** Le sinistre : le stock perdu au coût d'achat et au prix de vente, l'indemnité, la marge perdue pendant la fermeture. */
export function degatDesEaux(f: FicheDeLaBoutique) {
  const d = DEGAT_DES_EAUX;
  const lignes = (Object.entries(d.articles) as [CodeDeReference, number][]).map(([code, quantite]) => {
    const r = f.gamme.find((x) => x.code === code)!;
    return { code, nom: r.nom, quantite, coutDAchat: r.coutDAchat, prixHt: r.prixHt, auCoutDAchat: auCentime(quantite * r.coutDAchat), auPrixDeVente: auCentime(quantite * r.prixHt) };
  });
  const stock = auCentime(somme(lignes.map((l) => l.auCoutDAchat)));
  const auPrixDeVente = auCentime(somme(lignes.map((l) => l.auPrixDeVente)));
  const sinistre = auCentime(stock + d.remiseEnEtat);
  const franchise = CONTRATS_D_ASSURANCE.find((c) => c.code === d.contrat)!.franchise;
  const indemnite = auCentime(Math.max(0, sinistre - franchise));
  // La fermeture : le chiffre d'affaires de 2 jours d'un mois comme janvier, et sa marge sur coût variable.
  const chiffreDAffaires = somme(f.gamme.map((r) => r.ventesDuMois * r.prixHt));
  const coutsVariables = somme(f.gamme.map((r) => r.ventesDuMois * (r.coutDAchat + r.autresCoutsVariables)));
  // Le taux de la copie : arrondi à deux décimales, la marge perdue part de lui.
  const tauxDeMarge = taux2(chiffreDAffaires - coutsVariables, chiffreDAffaires) / 100;
  const caPerdu = auCentime((chiffreDAffaires / f.joursDuMois) * d.joursDeFermeture);
  const margePerdue = auCentime(caPerdu * tauxDeMarge);
  const fermeturesParAn = somme(RISQUES.filter((r) => r.nom.startsWith("Cambriolage") || r.nom.startsWith("Dégât")).map((r) => r.frequenceParAn));
  return {
    lignes,
    stock,
    auPrixDeVente,
    sinistre,
    franchise,
    indemnite,
    resteAPayer: auCentime(sinistre - indemnite),
    indemniteAuPrixDeVente: auCentime(Math.max(0, auPrixDeVente + d.remiseEnEtat - franchise)),
    caPerdu,
    tauxDeMarge,
    margePerdue,
    fermeturesParAn,
    perteMoyenneParAn: auCentime(fermeturesParAn * margePerdue),
    garantie: GARANTIE_PERTES_D_EXPLOITATION,
  };
}
