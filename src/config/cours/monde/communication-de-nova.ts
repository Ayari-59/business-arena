import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { gpecDeN2 } from "./ressources-et-gpec-de-nova";

/**
 * LE MONDE DU COURS : COMMUNIQUER AVEC CHAQUE ACTEUR, CHEZ NOVA (enseignement commun de terminale STMG,
 * question 2.3, lot C ; le chapitre cite aussi le thème 3 de ressources humaines et communication).
 *
 * CE QUI VIENT DES FICHES : les 2 recrutements que la GPEC prévoit pour N + 2 (ressources-et-gpec-de-nova.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES AVIS EN LIGNE : NOVA compte 120 avis de clients, d'une note moyenne de 3,8 sur 5 ; les
 *     revendeurs ne mettent en avant que les marques notées 4,2 ou plus. Le chapitre cherche combien
 *     d'avis à 5 sur 5 il faudrait pour y arriver (une entreprise ne crée pas de faux avis : elle invite
 *     ses vrais clients à noter) ;
 *   · LE CAS : pour ses 2 recrutements, NOVA peut publier une annonce (900 € par poste : la diffusion
 *     sur deux sites d'emploi et le tri des candidatures) ou demander à ses salariés de recommander une
 *     personne de leur entourage, la cooptation (une prime de 500 € au salarié, par recrue).
 */

export const ENTREPRISES_DE_LA_COMMUNICATION = ENTREPRISES_DE_LA_DIRECTION;

export const AVIS_EN_LIGNE = { nombre: 120, moyenne: 3.8, noteVisee: 4.2, meilleure: 5 } as const;
export const RECRUTER_PAR = { annonce: 900, cooptation: 500 } as const;

const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** La note moyenne après n avis de plus, tous à 5 sur 5. */
export function noteApres(n: number) {
  const a = AVIS_EN_LIGNE;
  const total = a.nombre * a.moyenne;
  return { n, total: auDixieme(total + a.meilleure * n), avis: a.nombre + n, moyenne: auCentieme((total + a.meilleure * n) / (a.nombre + n)) };
}

/** Le plus petit nombre d'avis à 5 sur 5 qui porte la moyenne à la note visée. */
export function avisPourLaNoteVisee() {
  const a = AVIS_EN_LIGNE;
  return Math.ceil((a.nombre * (a.noteVisee - a.moyenne)) / (a.meilleure - a.noteVisee) - 1e-9);
}

/** Le cas : l'annonce ou la cooptation, pour les recrutements de N + 2. */
export function annonceOuCooptation() {
  const postes = gpecDeN2().recrutements;
  return { postes, annonce: postes * RECRUTER_PAR.annonce, cooptation: postes * RECRUTER_PAR.cooptation, ecart: postes * (RECRUTER_PAR.annonce - RECRUTER_PAR.cooptation), parAnnonce: RECRUTER_PAR.annonce, parCooptation: RECRUTER_PAR.cooptation };
}
