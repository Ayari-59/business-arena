import { auCentime, JOURS_DE_L_ANNEE } from "./amortissement";

/**
 * LE MODÈLE DE LA FACTURE DU COURS : réductions commerciales, escompte, TVA, net à payer, et le
 * taux annuel d'un escompte.
 *
 * Des fonctions pures : les conditions de la facture sont des paramètres (un laboratoire change la
 * remise, l'escompte, les jours d'avance ou le taux du découvert). La facture de NOVA à Sonora est
 * dans monde/exercice-de-nova.ts.
 *
 *   · L'ORDRE DE LA FACTURE : prix brut ; puis chaque réduction commerciale (remise, rabais,
 *     ristourne), chacune sur le net qui la précède (des remises en cascade) ; le net commercial ;
 *     l'escompte sur le net commercial ; le net financier ; le port, s'il y en a, hors taxes ; la
 *     TVA sur le net financier plus le port ; le net à payer.
 *   · LE TAUX ANNUEL D'UN ESCOMPTE : payer j jours plus tôt, c'est avancer le net financier pendant
 *     j jours pour gagner l'escompte : escompte ÷ net financier × 360 ÷ j, soit t ÷ (1 − t) × 360 ÷ j.
 *   · L'ESCOMPTE LE PLUS FORT qu'on peut accorder sans payer l'argent plus cher qu'un découvert au
 *     taux r : t ÷ (1 − t) × 360 ÷ j = r, soit t = r × j ÷ 360 ÷ (1 + r × j ÷ 360).
 */

export interface ReductionCommerciale {
  nature: "remise" | "rabais" | "ristourne";
  taux: number;
}

export interface ConditionsDeFacture {
  quantite: number;
  prixUnitaire: number;
  reductions: readonly ReductionCommerciale[];
  /** Le taux d'escompte porté sur la facture (0 : pas d'escompte). */
  escompte: number;
  /** Le port facturé, hors taxes (0 par défaut). */
  port?: number;
  tauxDeTva: number;
}

/** La facture, ligne par ligne. */
export function facture(c: ConditionsDeFacture) {
  const brut = auCentime(c.quantite * c.prixUnitaire);
  let net = brut;
  const reductions = c.reductions.map((r) => {
    const montant = auCentime(net * r.taux);
    net = auCentime(net - montant);
    return { ...r, montant, netApres: net };
  });
  const netCommercial = net;
  const escompte = auCentime(netCommercial * c.escompte);
  const netFinancier = auCentime(netCommercial - escompte);
  const port = c.port ?? 0;
  const baseDeTva = auCentime(netFinancier + port);
  const tva = auCentime(baseDeTva * c.tauxDeTva);
  return { brut, reductions, netCommercial, escompte, netFinancier, port, baseDeTva, tva, netAPayer: auCentime(baseDeTva + tva) };
}

/** Le taux annuel d'un escompte de taux t obtenu en payant j jours plus tôt. */
export function tauxAnnuelDeLEscompte(t: number, jours: number) {
  return (t / (1 - t)) * (JOURS_DE_L_ANNEE / jours);
}

/** L'escompte le plus fort qui ne coûte pas plus qu'un financement au taux annuel r pendant j jours. */
export function escompteMaximal(tauxAnnuel: number, jours: number) {
  const x = (tauxAnnuel * jours) / JOURS_DE_L_ANNEE;
  return x / (1 + x);
}

/** Ce que coûte d'avancer un montant pendant j jours au taux annuel r (intérêts simples, année de 360 jours). */
export function coutDeLAvance(montant: number, tauxAnnuel: number, jours: number) {
  return auCentime((montant * tauxAnnuel * jours) / JOURS_DE_L_ANNEE);
}
