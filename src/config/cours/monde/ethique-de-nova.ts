import { taux2 } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";
import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";

/**
 * LE MONDE DU COURS : ÉTHIQUE, TRANSPARENCE ET ÉGALITÉ, CHEZ NOVA (enseignement commun de terminale STMG,
 * question 3.1, lot C).
 *
 * CE QUI VIENT DES FICHES : le chiffre d'affaires et l'impôt de l'année N (comptes-du-lycee.ts) ; le club
 * de handball du territoire (haut-verdasse-handball.ts), l'association que NOVA soutiendrait.
 *
 * LA RÈGLE DU MÉCÉNAT (la loi fiscale, simplifiée au niveau du lycée) : un don d'une entreprise à une
 * association d'intérêt général ouvre une réduction de l'impôt sur les sociétés de 60 % du don, dans la
 * limite de 20 000 € ou de 5 ‰ du chiffre d'affaires hors taxes si ce montant est plus élevé.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE BUDGET : le président ne veut pas que le don coûte à NOVA plus de 3 000 € une fois la réduction
 *     d'impôt déduite ; le laboratoire essaie des dons de 500 en 500 €, jusqu'à 10 000 € ;
 *   · L'ÉGALITÉ : en N + 2, NOVA compte 12 salariés, 5 femmes payées en moyenne 2 050 € bruts par mois et
 *     7 hommes payés en moyenne 2 210 € ;
 *   · LE CAS : un salon professionnel offre à NOVA un stand gratuit si elle affiche « enceinte
 *     écologique » sur la Studio ; seuls ses emballages sont recyclés. Le stand vaudrait 2 400 €, et
 *     NOVA en attend 60 enceintes vendues de plus, à 59 € de marge sur coût variable chacune.
 */

export const ENTREPRISES_DE_L_ETHIQUE = ENTREPRISES_DE_LA_DIRECTION;

export const MECENAT = { taux: 0.6, plafondFixe: 20_000, partDuChiffreDAffaires: 0.005, budgetNet: 3_000 } as const;
export const DONS_ESSAYES = { min: 0, max: 10_000, pas: 500 } as const;
export const EGALITE_DE_N_PLUS_2 = { femmes: { effectif: 5, salaire: 2_050 }, hommes: { effectif: 7, salaire: 2_210 } } as const;
export const SALON = { valeurDuStand: 2_400, ventesAttendues: 60, margeParVente: 59 } as const;

export const CLUB_SOUTENU = HAUT_VERDASSE_HANDBALL;

/** Le plafond des dons qui ouvrent la réduction : 20 000 € ou 5 ‰ du chiffre d'affaires, le plus élevé. */
export function plafondDuMecenat() {
  const c = compteDuLycee(exerciceDe("nova"));
  const part = auCentime(c.ventes * MECENAT.partDuChiffreDAffaires);
  return { chiffreDAffaires: c.ventes, part, plafond: Math.max(MECENAT.plafondFixe, part), impot: c.impot };
}

/** Un don : la réduction d'impôt et ce qu'il coûte vraiment à NOVA. */
export function don(montant: number) {
  const p = plafondDuMecenat();
  const reduction = auCentime(Math.min(montant, p.plafond) * MECENAT.taux);
  return { montant, reduction, coutNet: auCentime(montant - reduction) };
}

/** Le plus gros don, de 500 en 500 €, dont le coût net tient dans le budget. */
export function donMaximal() {
  let d = DONS_ESSAYES.min;
  while (d + DONS_ESSAYES.pas <= DONS_ESSAYES.max && don(d + DONS_ESSAYES.pas).coutNet <= MECENAT.budgetNet) d += DONS_ESSAYES.pas;
  return d;
}

/** L'écart de rémunération moyenne entre les femmes et les hommes, rapporté à celle des hommes, à deux décimales. */
export function ecartDeRemuneration() {
  const e = EGALITE_DE_N_PLUS_2;
  const ecart = e.hommes.salaire - e.femmes.salaire;
  return { ...e, ecart, ecartPct: taux2(ecart, e.hommes.salaire) };
}

/** Le cas : ce que rapporterait le stand gratuit, en échange d'une allégation trompeuse. */
export function salon() {
  const s = SALON;
  return { ...s, marge: s.ventesAttendues * s.margeParVente, gain: s.ventesAttendues * s.margeParVente + s.valeurDuStand };
}
