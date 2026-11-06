import { OBJECTIF_ANNONCE_A_LA_BANQUE, PART_DE_REVENTE_DE_LA_LIGNE, PRIX_DU_JEU_APRES_NOEL, prudenceDeNova } from "../chapitres/depreciations-et-provisions";
import { auCentime } from "./amortissement";
import { impotSurLesSocietes } from "./cloture";
import { EXERCICE_DE_NOVA } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : L'OBJECTIF DU PRÉSIDENT, LA PRUDENCE DE NOVA AU 31 DÉCEMBRE N EN TROIS DÉCISIONS
 * (décision du propriétaire, novembre 2026 : une activité par chapitre ; le format « scénario à
 * embranchements » ; chapitre « Dépréciations et provisions »).
 *
 * Le scénario (config/cours/scenarios/l-objectif-du-president.ts) lit tout ici. Au 31 décembre N, le
 * président de NOVA a promis à la banque un résultat avant impôt d'au moins 90 000 €. L'élève arrête la
 * prudence de l'exercice : la créance de Sonora, puis le litige, puis le stock de composants et la ligne.
 * Chaque branche se CALCULE (`resultatDeLaSuite`) : le résultat avant impôt, l'impôt, l'objectif, et
 * l'écart à l'image fidèle.
 *
 * RIEN N'EST CHOISI ICI : tous les chiffres sont ceux du chapitre (`prudenceDeNova`) et de ses
 * hypothèses (l'objectif annoncé à la banque, le prix du jeu après Noël, la part de revente de la
 * ligne). Seules les options fausses sont des gestes du comptable : ne rien passer, déprécier le toutes
 * taxes comprises, provisionner ce que le client réclame, déprécier ce qui ne perd rien.
 */

const f = EXERCICE_DE_NOVA;
const y = prudenceDeNova({ code: f.code });

export const CHOIX_DE_LA_CREANCE = ["attendre", "hors-taxes", "toutes-taxes"] as const;
export const CHOIX_DU_LITIGE = ["rien", "probable", "demande"] as const;
export const CHOIX_DU_STOCK_ET_DE_LA_LIGNE = ["garder", "stock", "ligne"] as const;
export type ChoixDeLaCreance = (typeof CHOIX_DE_LA_CREANCE)[number];
export type ChoixDuLitige = (typeof CHOIX_DU_LITIGE)[number];
export type ChoixDuStockEtDeLaLigne = (typeof CHOIX_DU_STOCK_ET_DE_LA_LIGNE)[number];

/** Les options de chaque décision, dans l'ordre. */
export const CHOIX_DES_DECISIONS: readonly (readonly string[])[] = [CHOIX_DE_LA_CREANCE, CHOIX_DU_LITIGE, CHOIX_DU_STOCK_ET_DE_LA_LIGNE];

export interface SuiteDeChoix {
  creance?: ChoixDeLaCreance;
  litige?: ChoixDuLitige;
  stock?: ChoixDuStockEtDeLaLigne;
}
export type SuiteComplete = Required<SuiteDeChoix>;

/** La suite que des codes décrivent, ou null s'ils n'en sont pas une. */
export function suiteDesCodes(codes: readonly string[]): SuiteDeChoix | null {
  if (codes.length > CHOIX_DES_DECISIONS.length || !codes.every((c, i) => CHOIX_DES_DECISIONS[i]!.includes(c))) return null;
  return { creance: codes[0] as ChoixDeLaCreance | undefined, litige: codes[1] as ChoixDuLitige | undefined, stock: codes[2] as ChoixDuStockEtDeLaLigne | undefined };
}

/** Les chiffres que les décisions lisent, tous ceux du chapitre. */
export function prudenceDuScenario() {
  const stockAuGrossiste = auCentime(y.stock.quantite * PRIX_DU_JEU_APRES_NOEL);
  return {
    y,
    resultatSansPrudence: y.resultatSansPrudence,
    objectif: OBJECTIF_ANNONCE_A_LA_BANQUE,
    creance: y.creance,
    taux: y.taux,
    depreciation: {
      attendre: 0,
      "hors-taxes": y.d.depreciation,
      "toutes-taxes": auCentime(y.creance.ttc * y.taux),
    } satisfies Record<ChoixDeLaCreance, number>,
    provision: { rien: 0, probable: y.provision, demande: y.demande } satisfies Record<ChoixDuLitige, number>,
    stock: { quantite: y.stock.quantite, coutMoyen: y.stock.coutMoyen, valeur: y.stock.valeur, auGrossiste: stockAuGrossiste, prixDuGrossiste: PRIX_DU_JEU_APRES_NOEL },
    ligne: { valeurNette: y.vnc, revente: y.revente, part: PART_DE_REVENTE_DE_LA_LIGNE },
    autres: { garder: 0, stock: auCentime(y.stock.valeur - stockAuGrossiste), ligne: auCentime(y.vnc - y.revente) } satisfies Record<ChoixDuStockEtDeLaLigne, number>,
  };
}

const p = prudenceDuScenario();

/** L'impôt sur les sociétés d'un résultat avant impôt, au barème de la fiche. */
export const impotDe = (resultat: number) => impotSurLesSocietes(resultat, f.impot).impot;

/** Le résultat avant impôt après les décisions déjà prises. */
export function resultatApres(s: SuiteDeChoix) {
  const charges = auCentime((s.creance ? p.depreciation[s.creance] : 0) + (s.litige ? p.provision[s.litige] : 0) + (s.stock ? p.autres[s.stock] : 0));
  return auCentime(p.resultatSansPrudence - charges);
}

/** Les fins du scénario : la prudence oubliée, la prudence excessive, l'image fidèle. */
export type CodeDeFin = "oubliee" | "excessive" | "fidele";

/** Le résultat d'une suite complète : les charges de prudence, le résultat, l'impôt, l'objectif, l'écart à l'image fidèle. */
export function resultatDeLaSuite(s: SuiteComplete) {
  const charges = { creance: p.depreciation[s.creance], litige: p.provision[s.litige], stock: p.autres[s.stock] };
  const resultat = resultatApres(s);
  const fidele = resultatApres({ creance: "hors-taxes", litige: "probable", stock: "garder" });
  const oublis = (s.creance === "attendre" ? 1 : 0) + (s.litige === "rien" ? 1 : 0);
  const exces = (s.creance === "toutes-taxes" ? 1 : 0) + (s.litige === "demande" ? 1 : 0) + (s.stock !== "garder" ? 1 : 0);
  const fin: CodeDeFin = oublis > 0 ? "oubliee" : exces > 0 ? "excessive" : "fidele";
  return {
    suite: s,
    charges,
    totalDesCharges: auCentime(charges.creance + charges.litige + charges.stock),
    resultat,
    impot: impotDe(resultat),
    objectifTenu: resultat >= p.objectif,
    ecartALObjectif: auCentime(resultat - p.objectif),
    fidele,
    ecartALImageFidele: auCentime(resultat - fidele),
    oublis,
    exces,
    fin,
  };
}
export type ResultatDeLaSuite = ReturnType<typeof resultatDeLaSuite>;

/** Les 27 suites, dans l'ordre des choix. */
export function toutesLesSuites(): SuiteComplete[] {
  return CHOIX_DE_LA_CREANCE.flatMap((creance) => CHOIX_DU_LITIGE.flatMap((litige) => CHOIX_DU_STOCK_ET_DE_LA_LIGNE.map((stock) => ({ creance, litige, stock }))));
}

/**
 * LA MEILLEURE SUITE, et la règle qui la désigne : l'image fidèle, celle dont le résultat ne s'écarte pas
 * de celui que la prudence demande. Une seule suite y arrive ; l'objectif annoncé à la banque n'entre
 * pas dans la règle : la prudence ne se règle pas sur lui.
 */
export function meilleureSuite(): ResultatDeLaSuite {
  const fideles = toutesLesSuites()
    .map(resultatDeLaSuite)
    .filter((r) => r.fin === "fidele");
  if (fideles.length !== 1) throw new Error("une seule suite fidèle");
  return fideles[0]!;
}
