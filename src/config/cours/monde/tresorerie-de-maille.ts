import { clienteleDeJanvier } from "./fichier-de-maille";
import { CHARGES_DU_MOIS, EQUIPE, GAMME, TAUX_PATRONAL } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE BUDGET DE TRÉSORERIE DE MAILLE & CO, PREMIER TRIMESTRE DE N (le chapitre
 * « Prévoir sa trésorerie : le budget de trésorerie », SGN de première T4.1).
 *
 * UNE SIMPLIFICATION DU LYCÉE : tout est hors taxes, la TVA n'entre pas dans le budget (le chapitre du
 * BTS la décale, pas celui-ci).
 *
 * CE QUI VIENT DE LA FICHE DE LA BOUTIQUE (maille-et-co.ts) : les ventes de janvier en caisse et celles
 * des comités d'entreprise, réglées à 45 jours ; les articles livrés en janvier par le façonnier, payé à
 * 45 jours ; le loyer, la publicité et l'entretien du mois (l'usure du rayonnage, qui ne sort pas de la
 * caisse, n'y entre pas) ; la paie de l'équipe, salaires et cotisations patronales ; les autres coûts
 * variables des articles vendus en janvier.
 *
 * LA CONVENTION DU CHAPITRE : une facture à 45 jours, émise en moyenne le 15 du mois, se règle à la fin
 * du mois suivant (15 + 45 = 60 jours de mois commerciaux). Les comités payent donc le mois suivant leur
 * commande, et le façonnier est payé le mois suivant sa livraison.
 *
 * LES HYPOTHÈSES DU COURS, dites ici : la trésorerie du 1er janvier ; ce que décembre laisse à encaisser
 * et à payer ; les ventes, les achats et les autres coûts variables de février et de mars (la collection
 * de printemps, livrée en février, est le gros achat du trimestre) ; le rayonnage neuf de mars, payé
 * comptant, ou en trois fois si le fournisseur l'accepte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export const MOIS_DU_BUDGET = ["Janvier", "Février", "Mars"] as const;

/** Ce que janvier doit à la fiche de la boutique. */
function janvier() {
  const caisse = auCentime(clienteleDeJanvier("fideles").chiffreDAffaires + clienteleDeJanvier("passants").chiffreDAffaires);
  const comites = clienteleDeJanvier("comites").chiffreDAffaires;
  const achats = auCentime(GAMME.reduce((t, r) => t + r.livraisons.reduce((n, l) => n + l.quantite, 0) * r.coutDAchat, 0));
  const autresCouts = auCentime(GAMME.reduce((t, r) => t + r.ventesDuMois * r.autresCoutsVariables, 0));
  return { caisse, comites, achats, autresCouts };
}

export const HYPOTHESES_DU_BUDGET = {
  tresorerieDuPremierJanvier: 8_000,
  /** Décembre : les commandes des comités et la livraison du façonnier, encaissées et payées en janvier. */
  decembre: { comites: 12_000, achats: 31_000 },
  fevrier: { caisse: 61_800, comites: 6_000, achats: 78_000, autresCouts: 3_900 },
  mars: { caisse: 69_500, comites: 8_400, autresCouts: 4_300 },
  rayonnage: { montant: 12_000, fois: 3 },
} as const;

/** La paie d'un mois : les salaires bruts de l'équipe et les cotisations patronales. */
export const PAIE_DU_MOIS_DE_MAILLE = auCentime(EQUIPE.reduce((t, s) => t + s.brutMensuel, 0) * (1 + TAUX_PATRONAL));

/** Le loyer, la publicité et l'entretien : les charges fixes qui sortent de la caisse. */
export const CHARGES_DECAISSEES = CHARGES_DU_MOIS.loyer + CHARGES_DU_MOIS.publicite + CHARGES_DU_MOIS.entretien;

export interface LeviersDuBudget {
  /** Le rayonnage de mars, payé comptant (1) ou en plusieurs fois (le nombre de fois). */
  rayonnageEnFois: number;
  /** La part de la commande de printemps reportée à avril, en euros. */
  report: number;
  /** La trésorerie du 1er janvier. */
  tresorerieInitiale: number;
}

/** Le budget de trésorerie du trimestre, mois par mois. */
export function budgetDeMaille(leviers: Partial<LeviersDuBudget> = {}) {
  const h = HYPOTHESES_DU_BUDGET;
  const j = janvier();
  const fois = leviers.rayonnageEnFois ?? 1;
  const report = leviers.report ?? 0;
  const lignes = [
    { caisse: j.caisse, comites: h.decembre.comites, achats: h.decembre.achats, autresCouts: j.autresCouts, rayonnage: 0 },
    { caisse: h.fevrier.caisse, comites: j.comites, achats: j.achats, autresCouts: h.fevrier.autresCouts, rayonnage: 0 },
    { caisse: h.mars.caisse, comites: h.fevrier.comites, achats: h.fevrier.achats - report, autresCouts: h.mars.autresCouts, rayonnage: auCentime(h.rayonnage.montant / fois) },
  ];
  let debut = leviers.tresorerieInitiale ?? h.tresorerieDuPremierJanvier;
  const mois = lignes.map((l, i) => {
    const encaissements = auCentime(l.caisse + l.comites);
    const decaissements = auCentime(l.achats + CHARGES_DECAISSEES + PAIE_DU_MOIS_DE_MAILLE + l.autresCouts + l.rayonnage);
    const fin = auCentime(debut + encaissements - decaissements);
    const m = { nom: MOIS_DU_BUDGET[i]!, debut, ...l, charges: CHARGES_DECAISSEES, paie: PAIE_DU_MOIS_DE_MAILLE, encaissements, decaissements, fin };
    debut = fin;
    return m;
  });
  const plusBas = mois.reduce((a, m) => (m.fin < a.fin ? m : a));
  return { mois, plusBas, janvier: j };
}

/** La plus grosse commande de printemps (livrée en février, payée en mars) qui ne met pas mars à découvert, rayonnage payé comptant. */
export const COMMANDE_LA_PLUS_GROSSE = auCentime(HYPOTHESES_DU_BUDGET.fevrier.achats + budgetDeMaille().mois[2]!.fin);

/** La trésorerie de fin de mars pour une commande de printemps donnée (rayonnage payé comptant). */
export const finDeMarsAvecLaCommande = (commande: number) => budgetDeMaille({ report: HYPOTHESES_DU_BUDGET.fevrier.achats - commande }).mois[2]!.fin;
