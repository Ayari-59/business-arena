import { auCentime } from "./amortissement";
import { ENTREPRISES_DES_DONNEES_STRATEGIQUES, PERTE_DES_DONNEES } from "./donnees-strategiques-de-maille";

/**
 * LE MONDE DU COURS : LE PROGRAMME DE FIDÉLITÉ DE MAILLE & CO, AUTOMATISÉ (enseignement spécifique de
 * systèmes d'information de gestion de terminale STMG, thème 3, question 3.2, lot F).
 *
 * CE QUI VIENT DES FICHES : la carte de fidélité de la boutique et le coût d'une heure de travail, 30 €
 * charges comprises (donnees-strategiques-de-maille.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA RÈGLE DE GESTION, nouvelle : chaque ticket de caisse donne autant de points que d'euros entiers
 *     dépensés ; les points d'une cliente « Privilège » comptent double ; chaque tranche de 100 points du
 *     mois donne un bon de 5 € ;
 *   · AUJOURD'HUI, l'adjointe calcule les bons à la main, chaque fin de mois : 300 clientes venues dans le
 *     mois, 2 minutes par cliente ;
 *   · LE PROGRAMME qui fait ce calcul coûte 1 500 € à faire écrire ;
 *   · LES TICKETS DE MME LAURENT, une cliente « Privilège », en mars : 45,90 €, 89 € et 32,50 € ;
 *   · LE CAS : la gérante voudrait un bon dès 80 points ; elle essaie la règle sur 3 clientes sans carte
 *     « Privilège », qui ont 166, 95 et 240 points dans le mois.
 */

export const ENTREPRISES_DU_PROGRAMME = ENTREPRISES_DES_DONNEES_STRATEGIQUES;

export const REGLE = { valeurDuBon: 5, pointsParBon: 100, multiplicateurPrivilege: 2 } as const;
export const CALCUL_A_LA_MAIN = { clientes: 300, minutesParCliente: 2, coutHoraire: PERTE_DES_DONNEES.coutHoraire } as const;
export const DEVELOPPEMENT = { cout: 1_500 } as const;
export const TICKETS_DE_MME_LAURENT = [45.9, 89, 32.5] as const;
export const CAS_DES_80_POINTS = { pointsParBon: 80, pointsDesClientes: [166, 95, 240] } as const;

/** Les points d'une liste de tickets : la partie entière de chaque montant, additionnée. */
export const pointsDesTickets = (tickets: readonly number[]) => tickets.reduce((s, t) => s + Math.floor(t + 1e-9), 0);

/** Le programme : la valeur des bons du mois, pour des tickets et une carte « Privilège » ou non. */
export function bonDuMois(tickets: readonly number[], privilege: boolean, pointsParBon: number = REGLE.pointsParBon) {
  let points = pointsDesTickets(tickets);
  if (privilege) points *= REGLE.multiplicateurPrivilege;
  return Math.floor(points / pointsParBon + 1e-9) * REGLE.valeurDuBon;
}

/** Le déroulé de la boucle sur les tickets : les points après chaque tour. */
export function deroule(tickets: readonly number[]) {
  let points = 0;
  return tickets.map((montant, i) => {
    const entier = Math.floor(montant + 1e-9);
    points += entier;
    return { tour: i + 1, montant, entier, points };
  });
}

/** La boucle « tant que » : les bons retirés un à un, et ce qui reste de points. */
export function bonsUnAUn(points: number, pointsParBon: number = REGLE.pointsParBon) {
  let reste = points;
  let tours = 0;
  while (reste >= pointsParBon) {
    reste -= pointsParBon;
    tours++;
  }
  return { tours, reste };
}

/** Ce que l'erreur « arrondi au lieu de partie entière » donnerait. */
export const bonAvecLArrondi = (points: number) => Math.round(points / REGLE.pointsParBon) * REGLE.valeurDuBon;

/** Ce que coûte le calcul à la main pendant un nombre de mois. */
export function calculALaMain(mois: number) {
  const k = CALCUL_A_LA_MAIN;
  return auCentime((mois * k.clientes * k.minutesParCliente * k.coutHoraire) / 60);
}

/** Le plus petit nombre de mois où le programme est payé par le temps qu'il fait gagner. */
export const moisQuiPaientLeProgramme = () => Math.ceil(DEVELOPPEMENT.cout / calculALaMain(1) - 1e-9);

/** Le cas : les bons des 3 clientes, à 100 points et à 80 points. */
export function bonDes80Points() {
  const bons = (seuil: number) => CAS_DES_80_POINTS.pointsDesClientes.reduce((s, p) => s + Math.floor(p / seuil + 1e-9) * REGLE.valeurDuBon, 0);
  const a100 = bons(REGLE.pointsParBon);
  const a80 = bons(CAS_DES_80_POINTS.pointsParBon);
  return { pointsDesClientes: CAS_DES_80_POINTS.pointsDesClientes, a100, a80, ecart: auCentime(a80 - a100) };
}
