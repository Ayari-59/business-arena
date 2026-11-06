import { auCentime } from "./amortissement";
import { comparaison, CREDIT_BAIL_DE_LA_LIGNE, DEPOT_DE_GARANTIE, EMPRUNT_DE_LA_LIGNE, fluxDeLEmprunt, type LeviersDeLaComparaison } from "./financement-de-la-gamme";

/**
 * LE MONDE DU SCÉNARIO « LA LIGNE EN CRÉDIT-BAIL » (la suite du chapitre « Emprunt ou crédit-bail : le
 * coût après impôt » et de son cas, « Le banc en crédit-bail »).
 *
 * La ligne, l'emprunt de la banque (5 %, 5 ans, en parts égales), l'offre de base du crédit-bailleur
 * (5 redevances de 33 000 €, une option de 15 000 €), le taux d'impôt de NOVA (25 %) et le dépôt de
 * garantie d'une redevance sont ceux du chapitre (financement-de-la-gamme.ts). Chaque chiffre se calcule
 * par sa fonction `comparaison` : le taux avant impôt, la VAN des flux du crédit-bail au coût de
 * l'emprunt après impôt.
 *
 * CE QUI EST NEUF EST UNE HYPOTHÈSE DU SCÉNARIO, nommée ci-dessous : les trois contre-offres que le
 * crédit-bailleur fait quand NOVA hésite, et les trois façons de comparer que l'élève peut choisir. La
 * garde tests/cours/scenario-la-ligne-en-credit-bail.test.ts refait chaque chiffre à la main.
 *
 * L'ARBRE : 3 méthodes × 3 contre-offres × 3 signatures, toutes calculées. Trois fins : un financement
 * plus cher que l'emprunt, une économie manquée, le moins cher de la table. La meilleure suite : la VAN
 * au coût de l'emprunt après impôt, la contre-offre à la plus forte VAN, signée.
 */

/** Les trois façons de comparer les deux offres (hypothèse du scénario : celles qu'on entend autour de la table). */
export const METHODES = ["avant-impot", "decaissements", "van"] as const;
export type Methode = (typeof METHODES)[number];

/**
 * LES TROIS CONTRE-OFFRES DU CRÉDIT-BAILLEUR (hypothèse du scénario) :
 *   · le dépôt : une redevance plus basse, 30 500 €, contre un dépôt de garantie d'une redevance de base,
 *     rendu sans intérêts à la fin du contrat ;
 *   · l'option haute : la même redevance basse, sans dépôt, mais une option portée à 22 500 € ;
 *   · l'option basse : une option à 1 500 €, mais une redevance portée à 34 500 €.
 */
export const CONTRE_OFFRES = {
  depot: { redevance: 30_500, option: CREDIT_BAIL_DE_LA_LIGNE.option, depot: DEPOT_DE_GARANTIE },
  "option-haute": { redevance: 30_500, option: 22_500, depot: 0 },
  "option-basse": { redevance: 34_500, option: 1_500, depot: 0 },
} as const satisfies Record<string, Pick<LeviersDeLaComparaison, "redevance" | "option" | "depot">>;
export type ContreOffre = keyof typeof CONTRE_OFFRES;
export const CODES_DES_CONTRE_OFFRES = Object.keys(CONTRE_OFFRES) as ContreOffre[];

/** Ce que NOVA signe : l'emprunt, la contre-offre qu'elle a demandée, ou l'offre de base. */
export const SIGNATURES = ["emprunt", "contre-offre", "base"] as const;
export type Signature = (typeof SIGNATURES)[number];

export const CHOIX_DES_DECISIONS: readonly (readonly string[])[] = [METHODES, CODES_DES_CONTRE_OFFRES, SIGNATURES];

export interface SuiteDeLaLigne {
  methode?: Methode;
  contreOffre?: ContreOffre;
  signature?: Signature;
}
export type SuiteCompleteDeLaLigne = Required<SuiteDeLaLigne>;

export function suiteDesCodes(codes: readonly string[]): SuiteDeLaLigne | null {
  if (codes.length > CHOIX_DES_DECISIONS.length) return null;
  if (codes.some((c, i) => !CHOIX_DES_DECISIONS[i]!.includes(c))) return null;
  const [methode, contreOffre, signature] = codes as [Methode?, ContreOffre?, Signature?];
  return { ...(methode ? { methode } : {}), ...(contreOffre ? { contreOffre } : {}), ...(signature ? { signature } : {}) };
}

/** Une offre de crédit-bail, lue par les trois méthodes. */
export function lectureDe(l: Partial<Pick<LeviersDeLaComparaison, "redevance" | "option" | "depot">> = {}) {
  const k = comparaison(l);
  const cb = k.cb;
  // Le dépôt est versé puis rendu : il ne change pas la somme payée.
  const totalPaye = auCentime(cb.dureeAns * cb.redevance + cb.option);
  return {
    leviers: cb,
    tauxAvantImpot: k.tauxAvantImpot,
    totalPaye,
    van: k.vanDuCreditBail,
    tauxApresImpot: k.tauxDuCreditBail,
  };
}

/** L'emprunt de la banque, lu par les trois méthodes : son taux, ce qu'il fait payer, sa VAN au coût après impôt (nulle). */
export function lectureDeLEmprunt() {
  const e = fluxDeLEmprunt(EMPRUNT_DE_LA_LIGNE);
  const k = comparaison();
  return { taux: EMPRUNT_DE_LA_LIGNE.taux, totalPaye: auCentime(EMPRUNT_DE_LA_LIGNE.montant + e.interets), van: k.vanDeLEmprunt, coutApresImpot: k.coutDeLEmprunt };
}

/** Une méthode dit-elle le crédit-bail moins cher que l'emprunt ? */
export function creditBailMoinsCher(methode: Methode, l: ReturnType<typeof lectureDe>) {
  const e = lectureDeLEmprunt();
  if (methode === "avant-impot") return l.tauxAvantImpot < e.taux;
  if (methode === "decaissements") return l.totalPaye < e.totalPaye;
  return l.van > 0;
}

/** L'offre que NOVA signe, et ce qu'elle lui fait gagner (positif) ou perdre face à l'emprunt, en valeur actuelle après impôt. */
export function resultatDeLaSuite(s: SuiteCompleteDeLaLigne) {
  const contre = lectureDe(CONTRE_OFFRES[s.contreOffre]);
  const base = lectureDe();
  const signee = s.signature === "emprunt" ? null : s.signature === "base" ? base : contre;
  const gain = signee ? signee.van : 0;
  const table = [0, base.van, contre.van];
  const meilleurDeLaTable = Math.max(...table);
  const fin: CodeDeFin = gain < -1e-9 ? "plus-cher" : gain < meilleurDeLaTable - 1e-9 ? "economie-manquee" : "le-moins-cher";
  return { suite: s, contre, base, signee, gain, meilleurDeLaTable, fin };
}
export type ResultatDeLaLigne = ReturnType<typeof resultatDeLaSuite>;
export type CodeDeFin = "plus-cher" | "economie-manquee" | "le-moins-cher";

export function toutesLesSuites(): SuiteCompleteDeLaLigne[] {
  return METHODES.flatMap((methode) => CODES_DES_CONTRE_OFFRES.flatMap((contreOffre) => SIGNATURES.map((signature) => ({ methode, contreOffre, signature }))));
}

/**
 * LA MEILLEURE SUITE : le plus grand gain face à l'emprunt ; à gain égal, celle qui le doit à la bonne
 * méthode (la VAN au coût de l'emprunt après impôt), seule à mesurer ce que chaque offre coûte vraiment.
 */
export function meilleureSuite(): ResultatDeLaLigne {
  return toutesLesSuites()
    .map(resultatDeLaSuite)
    .reduce((a, b) => (b.gain > a.gain + 1e-9 || (Math.abs(b.gain - a.gain) < 1e-9 && b.suite.methode === "van" && a.suite.methode !== "van") ? b : a));
}
