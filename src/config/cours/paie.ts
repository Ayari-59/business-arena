import { auCentime } from "../../pedagogy/cours/etats";
import type { Cas } from "./cas";

/**
 * LA PAIE EN DÉTAIL : LE MÊME MOIS DE JANVIER, ORGANISME PAR ORGANISME.
 *
 * Le chapitre pilote réunit les cotisations en une dette envers l'URSSAF. Un bulletin
 * les partage entre deux destinataires : l'URSSAF (sécurité sociale, CSG et CRDS,
 * assurance chômage, qu'elle recouvre) et la caisse de retraite complémentaire
 * (AGIRC-ARRCO). Les deux parts gardent les totaux du pilote : le brut, le net et le
 * coût du personnel sont les mêmes d'un chapitre à l'autre.
 *
 * Ce sont des ordres de grandeur d'un salarié non cadre, comme les taux du pilote ; un
 * vrai bulletin compte aussi la prévoyance, la mutuelle et d'autres lignes encore.
 */

export const TAUX_DE_LA_PAIE = {
  salarial: { urssaf: 0.18, retraite: 0.04 },
  patronal: { urssaf: 0.36, retraite: 0.06 },
} as const;

/**
 * LE PRÉLÈVEMENT À LA SOURCE. L'impôt sur le revenu se calcule sur le net imposable : le
 * net, plus la part de CSG et la CRDS que l'impôt ne déduit pas, prises sur le brut
 * diminué d'un abattement pour frais professionnels. Le taux est celui que l'administration fiscale transmet à
 * l'employeur pour chaque salarié ; le cours en prend un taux moyen pour l'équipe.
 */
export const CSG_CRDS_NON_DEDUCTIBLES = 0.029;
export const ASSIETTE_CSG = 0.9825;
export const TAUX_PAS = 0.02;

/** L'acompte que demande un salarié au milieu du mois : la quinzaine déjà travaillée. */
export const JOUR_ACOMPTE = 15;

const auCent = (x: number) => Math.round(x / 100) * 100;

export function paieDuMois(c: Cas) {
  const p = c.personnel;
  const t = TAUX_DE_LA_PAIE;
  const urssafSalariale = Math.round(p.brut * t.salarial.urssaf);
  const retraiteSalariale = Math.round(p.brut * t.salarial.retraite);
  const urssafPatronale = Math.round(p.brut * t.patronal.urssaf);
  const retraitePatronale = Math.round(p.brut * t.patronal.retraite);
  const netAvantImpot = p.brut - urssafSalariale - retraiteSalariale;
  const csgNonDeductible = auCentime(p.brut * ASSIETTE_CSG * CSG_CRDS_NON_DEDUCTIBLES);
  const netImposable = auCentime(netAvantImpot + csgNonDeductible);
  const pas = auCentime(netImposable * TAUX_PAS);
  const acompte = Math.max(100, auCent(netAvantImpot / p.effectif / 2));
  const netAPayer = auCentime(netAvantImpot - pas - acompte);
  return {
    ...p,
    urssafSalariale,
    retraiteSalariale,
    urssafPatronale,
    retraitePatronale,
    netAvantImpot,
    csgNonDeductible,
    netImposable,
    tauxPas: TAUX_PAS,
    pas,
    acompte,
    jourAcompte: JOUR_ACOMPTE,
    netAPayer,
    /** Ce que chaque destinataire attend le 15 février. */
    urssaf: urssafSalariale + urssafPatronale,
    retraite: retraiteSalariale + retraitePatronale,
    totalFevrier: auCentime(urssafSalariale + urssafPatronale + retraiteSalariale + retraitePatronale + pas),
  };
}
