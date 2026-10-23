import { auCentime } from "../../pedagogy/cours/etats";
import { scenarioByCode } from "../scenarios/registry";
import type { Cas } from "./cas";

/**
 * LES RÉGULARISATIONS DE FIN D'EXERCICE : CE QUE L'ARÈNE RÈGLE DANS LE TRIMESTRE.
 *
 * Dans l'arène, tout ce qui appartient à un trimestre s'y paie et s'y facture : l'assurance
 * se paie tour par tour, les achats et les ventes se facturent à la livraison. Une vraie
 * comptabilité ne tombe pas si juste au 31 décembre. Le chapitre prend les montants de
 * l'arène et les place à cheval sur deux années, comme ils le sont souvent :
 *
 * - L'ASSURANCE : la première formule du scénario, celle que l'arène propose, au prix de
 *   l'arène (sa prime par trimestre), payée pour l'année entière le 1er octobre.
 * - LA FACTURE NON PARVENUE : l'achat du mois du cours, livré fin décembre, facturé en janvier.
 * - LA FACTURE À ÉTABLIR : la vente du mois au client professionnel, servie fin décembre,
 *   facturée en janvier.
 * - LE PRODUIT CONSTATÉ D'AVANCE : une commande du même client, facturée et réglée en
 *   décembre, servie pour moitié en janvier.
 *
 * L'achat, la vente livrée et la moitié livrée en décembre appartiennent à l'année de
 * l'arène : la balance du chapitre ne les porte pas encore, l'élève les y remet. La moitié
 * livrée en janvier n'y appartient pas : la balance la porte, l'élève l'en retire. Au bout,
 * le résultat est celui de l'arène, moins le trimestre d'assurance que l'année doit porter.
 */

/** Les mois de l'année, et ceux de la prime qui tombent dans l'année : d'octobre à décembre. */
export const MOIS_PAR_AN = 12;
export const MOIS_DANS_L_EXERCICE = 3;
/** La part de la commande facturée en décembre qui se sert en janvier. */
export const PART_LIVREE_EN_JANVIER = 0.5;
/** Un trimestre de l'arène, en mois : une prime de l'arène couvre trois mois. */
const MOIS_PAR_TRIMESTRE = 3;

/** La formule d'assurance de l'arène, et sa prime pour un an payée d'avance. */
export function assurance(c: Cas) {
  const ins = scenarioByCode(c.code).scenario.insurance;
  if (!ins) throw new Error(`L'entreprise ${c.code} n'a pas d'assurance dans l'arène`);
  const formule = ins.formulas?.[0] ?? { name: "Assurance", premiumPerRound: ins.premiumPerRound };
  const parTrimestre = formule.premiumPerRound;
  const annuelle = auCentime((parTrimestre * MOIS_PAR_AN) / MOIS_PAR_TRIMESTRE);
  const moisSuivants = MOIS_PAR_AN - MOIS_DANS_L_EXERCICE;
  const davance = auCentime((annuelle * moisSuivants) / MOIS_PAR_AN);
  return { formule: formule.name, parTrimestre, annuelle, moisSuivants, davance, chargeDeLAnnee: auCentime(annuelle - davance) };
}

/** La facture non parvenue : l'achat du mois, livré le 28 décembre, facturé le 6 janvier. */
export const factureNonParvenue = (c: Cas) => c.achat;

/** La facture à établir : la vente du mois au client professionnel, servie le 30 décembre. */
export const factureAEtablir = (c: Cas) => c.venteCredit;

/** La commande facturée le 15 décembre : ce qui se sert en janvier, hors taxes. */
export function produitDAvance(c: Cas) {
  const v = c.venteCredit;
  return { facture: v.ht, enJanvier: auCentime(v.ht * PART_LIVREE_EN_JANVIER) };
}
