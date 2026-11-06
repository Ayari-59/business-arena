import { auCentime } from "./amortissement";
import type { LigneDEcriture } from "./cloture";
import { COMPTE_D_ATTENTE, PARTICIPATION_DE_N_PLUS_1, MAJORATION_CONTESTEE, TAUX_DU_FORFAIT_SOCIAL, batteries, brutDesMois, congesPayes, dossierDeRevision, garantie, REGLE_DU_DIXIEME, PREMIER_MOIS_DE_LA_PERIODE } from "./dossier-de-revision";
import { EXERCICE_N1_DE_NOVA } from "./projets-et-financement";
import { TAUX_PATRONAL } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LA RÉVISION DE N+1, PRÉPARÉE PAR UN ASSISTANT DU CABINET (décision du propriétaire,
 * novembre 2026 : une activité par chapitre ; le format « enquête » ; chapitre « Le dossier de révision »).
 *
 * L'enquête (config/cours/enquetes/la-revision-de-l-assistant.ts) lit tout ici. À la clôture de N+1, un
 * assistant du cabinet a passé les écritures du dossier de révision de NOVA ; l'expert-comptable ne
 * signera pas le dossier sans qu'on les ait relues.
 *
 * LES BONS CHIFFRES NE S'ÉCRIVENT PAS ICI : ce sont ceux du dossier de révision du cours
 * (monde/dossier-de-revision.ts), travail par travail ; le résultat corrigé est celui de « L'impôt sur les
 * sociétés », 118 460 € avant impôt (une seule NOVA). Les chiffres de l'assistant sortent du même
 * modèle, lu de travers.
 *
 * LES CINQ ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LE COMPTE : l'acompte du comité social, reçu pour des enceintes à livrer en janvier, est passé en
 *      vente avec sa TVA, au lieu d'un acompte reçu sur commande ;
 *   2. LA PÉRIODE : la dette de congés payés prend le dixième du brut de toute l'année N+1, au lieu de la
 *      période de référence ouverte le 1er juin ;
 *   3. LA RÈGLE : la participation porte un forfait social, dont une entreprise de moins de 50 salariés
 *      est exonérée ;
 *   4. LA BASE : les batteries de l'ancien modèle sont dépréciées de tout leur coût, au lieu de l'écart
 *      entre leur coût et leur valeur actuelle ;
 *   5. LA PART : la provision pour garantie couvre tous les défauts livrés de l'année, y compris les
 *      retours déjà faits, au lieu des seuls retours encore à venir.
 * Deux écritures sont justes : les frais bancaires du compte d'attente et la provision pour amende.
 */

/** Les travaux de la révision, dans l'ordre où l'assistant les a passés. */
export const TRAVAUX_DE_L_ASSISTANT = ["acompte", "frais", "conges", "participation", "amende", "batteries", "garantie"] as const;
export type TravailDeLAssistant = (typeof TRAVAUX_DE_L_ASSISTANT)[number];

/** La nature de chaque erreur ; les travaux absents sont justes. */
export type NatureDeLErreur = "compte" | "periode" | "regle" | "base" | "part";
export const ERREURS_DE_L_ASSISTANT: Readonly<Partial<Record<TravailDeLAssistant, NatureDeLErreur>>> = {
  acompte: "compte",
  conges: "periode",
  participation: "regle",
  batteries: "base",
  garantie: "part",
};

/** LE TAUX DE TVA de la vente que l'assistant croit voir : celui des enceintes. */
const TAUX_DE_TVA = 0.2;

const ligne = (compte: string, debit: number, credit: number): LigneDEcriture => ({ compte, debit: auCentime(debit), credit: auCentime(credit) });

/** L'effet d'une écriture sur le résultat : ses produits moins ses charges. */
export const effetSurLeResultat = (lignes: readonly LigneDEcriture[]) => auCentime(lignes.filter((l) => /^[67]/.test(l.compte)).reduce((t, l) => t + l.credit - l.debit, 0));

export interface EcritureDeLaRevision {
  code: TravailDeLAssistant;
  erreur?: NatureDeLErreur;
  juste: LigneDEcriture[];
  assistant: LigneDEcriture[];
}

/** Le dossier de l'assistant : chaque travail, l'écriture juste du cours et celle qu'il a passée. */
export function revisionDeLAssistant(): EcritureDeLaRevision[] {
  const a = COMPTE_D_ATTENTE;
  const cp = congesPayes();
  const b = batteries();
  const g = garantie();
  // Les congés sur le brut de toute l'année.
  const brutDeLAnnee = auCentime(brutDesMois().reduce((t, x) => t + x, 0));
  const detteDeLAnnee = auCentime(brutDeLAnnee * REGLE_DU_DIXIEME);
  const chargesDeLAnnee = auCentime(detteDeLAnnee * TAUX_PATRONAL);
  const forfait = auCentime(PARTICIPATION_DE_N_PLUS_1 * TAUX_DU_FORFAIT_SOCIAL);
  const venteHt = auCentime(a.acompte.montant / (1 + TAUX_DE_TVA));
  const tousLesRetours = garantie(1).provision;
  const justes: Record<TravailDeLAssistant, LigneDEcriture[]> = {
    acompte: [ligne("471", a.acompte.montant, 0), ligne("4191", 0, a.acompte.montant)],
    frais: [ligne("627", a.frais.montant, 0), ligne("471", 0, a.frais.montant)],
    conges: [ligne("6412", cp.dette, 0), ligne("645", cp.charges, 0), ligne("4282", 0, cp.dette), ligne("4382", 0, cp.charges)],
    participation: [ligne("691", PARTICIPATION_DE_N_PLUS_1, 0), ligne("4284", 0, PARTICIPATION_DE_N_PLUS_1)],
    amende: [ligne("6875", MAJORATION_CONTESTEE, 0), ligne("1514", 0, MAJORATION_CONTESTEE)],
    batteries: [ligne("6817", b.depreciation, 0), ligne("391", 0, b.depreciation)],
    garantie: [ligne("6815", g.provision, 0), ligne("1512", 0, g.provision)],
  };
  const fautes: Partial<Record<TravailDeLAssistant, LigneDEcriture[]>> = {
    acompte: [ligne("471", a.acompte.montant, 0), ligne("701", 0, venteHt), ligne("44571", 0, a.acompte.montant - venteHt)],
    conges: [ligne("6412", detteDeLAnnee, 0), ligne("645", chargesDeLAnnee, 0), ligne("4282", 0, detteDeLAnnee), ligne("4382", 0, chargesDeLAnnee)],
    participation: [ligne("691", PARTICIPATION_DE_N_PLUS_1, 0), ligne("645", forfait, 0), ligne("4284", 0, PARTICIPATION_DE_N_PLUS_1), ligne("431", 0, forfait)],
    batteries: [ligne("6817", b.cout, 0), ligne("391", 0, b.cout)],
    garantie: [ligne("6815", tousLesRetours, 0), ligne("1512", 0, tousLesRetours)],
  };
  return TRAVAUX_DE_L_ASSISTANT.map((code) => ({ code, ...(ERREURS_DE_L_ASSISTANT[code] ? { erreur: ERREURS_DE_L_ASSISTANT[code] } : {}), juste: justes[code], assistant: fautes[code] ?? justes[code] }));
}

/** Les chiffres que l'enquête montre : les bases fausses de l'assistant, à côté des bonnes. */
export function chiffresDeLAssistant() {
  const brutDeLAnnee = auCentime(brutDesMois().reduce((t, x) => t + x, 0));
  return {
    brutDeLAnnee,
    brutDeLaPeriode: congesPayes().brutDeLaPeriode,
    premierMois: PREMIER_MOIS_DE_LA_PERIODE,
    tousLesRetours: garantie(1),
    forfait: auCentime(PARTICIPATION_DE_N_PLUS_1 * TAUX_DU_FORFAIT_SOCIAL),
    venteHt: auCentime(COMPTE_D_ATTENTE.acompte.montant / (1 + TAUX_DE_TVA)),
  };
}

/** Le résultat que l'assistant annonce, et le résultat corrigé : celui du dossier du cours. */
export function resultatDeLAssistant() {
  const d = dossierDeRevision();
  const r = revisionDeLAssistant();
  const ecarts = r.map((x) => ({ code: x.code, ecart: auCentime(effetSurLeResultat(x.juste) - effetSurLeResultat(x.assistant)) }));
  const annonce = auCentime(d.resultatProvisoire + r.reduce((t, x) => t + effetSurLeResultat(x.assistant), 0));
  const correction = auCentime(ecarts.reduce((t, x) => t + x.ecart, 0));
  return { provisoire: d.resultatProvisoire, annonce, ecarts, correction, corrige: auCentime(annonce + correction), attendu: EXERCICE_N1_DE_NOVA.resultatComptable };
}
