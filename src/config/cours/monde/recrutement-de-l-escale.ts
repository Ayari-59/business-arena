import { auCentime } from "./amortissement";
import { COUT_HORAIRE_DE_L_ESCALE, ETE_DE_L_ESCALE, INTEGRATION_DE_L_ESCALE, integrationDeLEscale } from "./equipe-de-l-escale";
import { L_ESCALE } from "./l-escale";

/**
 * LE MONDE DU COURS : RECRUTER ET INTÉGRER À L'ESCALE (enseignement spécifique de ressources humaines et
 * communication de terminale STMG, thème 1, question 1.1, lot E).
 *
 * CE QUI VIENT DES FICHES : l'effectif de l'hôtel et le coût d'un salarié par trimestre, charges comprises
 * (l-escale.ts) ; le coût d'une heure de travail, le recrutement d'un arrivant (900 €) et ses heures de
 * formation (equipe-de-l-escale.ts, celles de « De l'individu à l'acteur ») ; les 10 saisonniers que
 * l'hôtel recrute pour l'été de N + 1 (equipe-de-l-escale.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · L'ENTONNOIR DU RECRUTEMENT : sur les sites d'emploi, la directrice retient pour un entretien 1
 *     candidature sur 5, et 1 entretien sur 2 aboutit à une embauche ;
 *   · LE RETOUR DES SAISONNIERS : 4 saisonniers de l'été reviennent l'été suivant si l'hôtel leur verse une
 *     prime de retour de 300 € ; un saisonnier qui revient connaît la maison, et 14 heures de remise à
 *     niveau lui suffisent ;
 *   · LE CAS : un contrat saisonnier dure 2 mois (juillet et août) ; une agence d'intérim facture l'heure
 *     d'un intérimaire 1,4 fois le coût de l'heure d'un salarié de l'hôtel (sa marge, l'indemnité de fin
 *     de mission et les congés payés compris), sans recrutement à payer.
 */

export const ENTREPRISES_DU_RECRUTEMENT = [L_ESCALE.code] as const;

export const ENTONNOIR = { tauxDEntretien: 0.2, tauxDEmbauche: 0.5 } as const;
export const RETOUR_DES_SAISONNIERS = { revenants: 4, prime: 300, heuresDeRemiseANiveau: 14 } as const;
export const CONTRAT_SAISONNIER = { mois: 2, coefficientDeLInterim: 1.4 } as const;

const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les saisonniers à recruter pour l'été. */
export const SAISONNIERS = ETE_DE_L_ESCALE.arrivees;

/** Ce que donnent un nombre de candidatures : les entretiens, puis les recrues attendues. */
export function entonnoir(candidatures: number) {
  const e = ENTONNOIR;
  return { candidatures, entretiens: auDixieme(candidatures * e.tauxDEntretien), recrues: auDixieme(candidatures * e.tauxDEntretien * e.tauxDEmbauche) };
}

/** Le plus petit nombre de candidatures qui donne les saisonniers de l'été. */
export function candidaturesNecessaires() {
  const e = ENTONNOIR;
  return Math.ceil(SAISONNIERS / (e.tauxDEntretien * e.tauxDEmbauche) - 1e-9);
}

/** Ce que la fidélisation fait gagner : un nouveau saisonnier, un saisonnier qui revient, et l'économie. */
export function fidelisation() {
  const r = RETOUR_DES_SAISONNIERS;
  const nouveau = integrationDeLEscale().coutDUnDepart;
  const remiseANiveau = auCentime(r.heuresDeRemiseANiveau * COUT_HORAIRE_DE_L_ESCALE);
  const revenant = auCentime(r.prime + remiseANiveau);
  return { nouveau, recrutement: INTEGRATION_DE_L_ESCALE.recrutement, heuresDeFormation: INTEGRATION_DE_L_ESCALE.heuresDeFormation, remiseANiveau, revenant, revenants: r.revenants, economie: auCentime(r.revenants * (nouveau - revenant)) };
}

/** Le cas : un poste de l'été en contrat saisonnier, ou en intérim. */
export function saisonnierOuInterim() {
  const c = CONTRAT_SAISONNIER;
  const mensuel = auCentime(L_ESCALE.equipe.coutParSalarieParTrimestre / 3);
  const saisonnier = auCentime(mensuel * c.mois + INTEGRATION_DE_L_ESCALE.recrutement);
  const interim = auCentime(mensuel * c.coefficientDeLInterim * c.mois);
  return { mois: c.mois, mensuel, recrutement: INTEGRATION_DE_L_ESCALE.recrutement, coefficient: c.coefficientDeLInterim, saisonnier, interim, ecart: auCentime(interim - saisonnier) };
}
