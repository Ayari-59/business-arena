import { auCentime } from "./amortissement";
import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { HAUT_VERDASSE } from "./haut-verdasse";
import { CHARGES_FIXES_DU_MOIS } from "./nova-gestion";

/**
 * LE MONDE DU COURS : S'IMPLANTER SUR UN TERRITOIRE, NOVA ET LE HAUT-VERDASSE (enseignement commun de
 * terminale STMG, question 3.4, lot C).
 *
 * CE QUI VIENT DES FICHES : le loyer du local de NOVA (nova-gestion.ts, 19 700 € par mois), ses achats de
 * composants de l'année N (comptes-du-lycee.ts), la communauté de communes (haut-verdasse.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE SITE DU HAUT-VERDASSE : la communauté aménage une zone d'activités, raccordée à la fibre, à
 *     côté de sa pépinière d'entreprises et d'un lycée professionnel. Un bâtiment y est proposé ; son
 *     loyer se négocie. Les livraisons à CampusTech, plus loin, coûteraient 900 € de plus par mois. Le
 *     déménagement coûte 25 000 €, une fois ; la communauté verse une aide à l'implantation de 30 000 €,
 *     la première année. NOVA juge le choix sur 3 ans ;
 *   · LE CAS : un groupement d'entreprises de l'audio de la région (un cluster) invite NOVA. La
 *     cotisation est de 1 800 € par an ; les achats groupés de composants font baisser leur prix de 1 %.
 */

export const ENTREPRISES_DE_L_IMPLANTATION = ENTREPRISES_DE_LA_DIRECTION;

export const SITE_DU_HAUT_VERDASSE = { transportEnPlusParMois: 900, demenagement: 25_000, aide: 30_000, ans: 3 } as const;
export const LOYERS_ESSAYES = { min: 12_000, max: 20_000, pas: 500 } as const;
export const CLUSTER = { cotisation: 1_800, baisseDesComposants: 0.01 } as const;

export const COMMUNAUTE = HAUT_VERDASSE;

/** Déménager au Haut-Verdasse à un loyer donné : l'économie de chaque mois et le gain sur la durée du choix. */
export function demenager(loyer: number) {
  const s = SITE_DU_HAUT_VERDASSE;
  const actuel = CHARGES_FIXES_DU_MOIS.loyer;
  const parMois = actuel - loyer - s.transportEnPlusParMois;
  const surLaDuree = parMois * 12 * s.ans;
  return { loyer, actuel, parMois, surLaDuree, gain: surLaDuree + s.aide - s.demenagement };
}

/** Le plus haut loyer, de 500 en 500 €, pour lequel le déménagement rapporte sur la durée. */
export function loyerMaximal() {
  let l = LOYERS_ESSAYES.min;
  while (l + LOYERS_ESSAYES.pas <= LOYERS_ESSAYES.max && demenager(l + LOYERS_ESSAYES.pas).gain >= 0) l += LOYERS_ESSAYES.pas;
  return l;
}

/** Le cas : rejoindre le cluster de l'audio. */
export function rejoindreLeCluster() {
  const composants = compteDuLycee(exerciceDe("nova")).ligne("composants");
  const economie = auCentime(composants * CLUSTER.baisseDesComposants);
  return { composants, economie, cotisation: CLUSTER.cotisation, gain: auCentime(economie - CLUSTER.cotisation), baissePct: CLUSTER.baisseDesComposants * 100 };
}
