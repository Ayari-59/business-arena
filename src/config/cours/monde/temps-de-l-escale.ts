import { PLACEMENTS } from "./financer-et-placer";
import { trimestreDeLHotel } from "./hotel";
import { L_ESCALE } from "./l-escale";

/**
 * LE MONDE DU COURS : LE TEMPS DE L'ESCALE (le chapitre « Le temps de l'organisation : horizon, saisons,
 * planning, valeur du temps », SGN de première T4.1).
 *
 * CE QUI VIENT DES FICHES : les quatre trimestres de l'hôtel au prix de l'année (l-escale.ts, hotel.ts),
 * l'été plein, le coût d'un salarié par trimestre, et le taux du fonds monétaire du cours (2,6 % l'an,
 * disponible le lendemain : financer-et-placer.ts, PLACEMENTS).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · le résultat de l'été (le trimestre 3) est placé le 1er octobre au fonds monétaire, en intérêts
 *     simples ;
 *   · un saisonnier coûte, par mois, le tiers du coût trimestriel d'un salarié de l'hôtel ;
 *   · le recrutement des saisonniers de l'été suit un calendrier à rebours depuis leur arrivée : l'annonce
 *     reste en ligne 3 semaines, les entretiens prennent 2 semaines, les contrats et les papiers 1 semaine,
 *     la formation 1 semaine avant l'ouverture de la saison.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les quatre trimestres de l'hôtel, au prix de l'année. */
export const saisonsDeLEscale = () =>
  [1, 2, 3, 4].map((n) => {
    const t = trimestreDeLHotel(L_ESCALE, n, L_ESCALE.prixDeLAnnee);
    return { ...t, occupationPct: auDixieme((t.vendues / t.offertes) * 100) };
  });

/** Le taux du placement : celui du fonds monétaire du cours. */
export const TAUX_DU_PLACEMENT = PLACEMENTS.opcvm.tauxAnnuel;

/** Le taux du compte à terme de 6 mois du cours, bloqué jusqu'à son échéance (le cas « Bloquer l'argent de l'été ? »). */
export const TAUX_DU_COMPTE_A_TERME = PLACEMENTS.compteATerme.tauxAnnuel;

/** Ce que coûte un saisonnier par mois : le tiers du coût trimestriel d'un salarié. */
export const COUT_D_UN_MOIS_DE_SAISONNIER = auCentime(L_ESCALE.equipe.coutParSalarieParTrimestre / 3);

/** Le placement du résultat de l'été pendant `mois` mois, en intérêts simples : I = C × t × n ÷ 12. */
export function placementDeLEte(mois: number, taux: number = TAUX_DU_PLACEMENT) {
  const capital = saisonsDeLEscale()[2]!.resultat;
  const interets = auCentime((capital * taux * mois) / 12);
  return { capital, mois, interets, valeurAcquise: auCentime(capital + interets) };
}

/** Le plus petit nombre de mois de placement dont les intérêts paient un mois de saisonnier. */
export const MOIS_POUR_UN_SAISONNIER = Math.ceil((COUT_D_UN_MOIS_DE_SAISONNIER * 12) / (placementDeLEte(0).capital * TAUX_DU_PLACEMENT) - 1e-9);

/** Le calendrier à rebours du recrutement de l'été : chaque tâche et sa durée, en semaines. */
export const CALENDRIER_DU_RECRUTEMENT: readonly { tache: string; semaines: number }[] = [
  { tache: "Annonce en ligne", semaines: 3 },
  { tache: "Entretiens", semaines: 2 },
  { tache: "Contrats et formalités", semaines: 1 },
  { tache: "Formation des saisonniers", semaines: 1 },
];

/** Les semaines avant l'arrivée des clients de l'été où le recrutement doit commencer. */
export const SEMAINES_AVANT_LA_SAISON = CALENDRIER_DU_RECRUTEMENT.reduce((n, t) => n + t.semaines, 0);
