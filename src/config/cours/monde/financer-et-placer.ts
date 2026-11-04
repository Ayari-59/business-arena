import { auCentime } from "./amortissement";
import { CONDITIONS_DE_LA_BANQUE, JOURS_DE_LA_BANQUE, JOURS_DU_MOIS_BANCAIRE, interets } from "./equilibre-de-tresorerie";
import { CREANCES_AU_31_DECEMBRE, IMPOT_SUR_LES_SOCIETES, MONTANTS_DES_FACTURES_SONORA, SONORA, SUITES_EN_N_PLUS_1 } from "./exercice-de-nova";
import { PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "./nova-gestion";
import { INVESTISSEMENT_DE_LA_GAMME } from "./structure-financiere";

/**
 * LE MONDE DU COURS : FINANCER UN BESOIN DE TRÉSORERIE ET PLACER UN EXCÉDENT, CHEZ NOVA EN N+1 (BTS CG
 * P6, 6.4.2 et 6.5.1 ; DCG UE6, 5.1).
 *
 * Le chapitre « Financer et placer la trésorerie » et son cas le lisent. La banque est celle du
 * chapitre « Équilibrer la trésorerie » (equilibre-de-tresorerie.ts, CONDITIONS_DE_LA_BANQUE : le
 * découvert autorisé à 12 %, le crédit de trésorerie d'un mois à 6 % par tranches de 1 000 € et 50 € de
 * frais, l'escompte à 9 % et 20 € par effet, l'année de 360 jours en mois de 30 jours). Ce fichier y
 * ajoute ce que la banque et un factor proposent de plus : la cession Dailly et l'affacturage ; puis
 * les placements.
 *
 * DEUX MOMENTS DE N+1 (hypothèses du chapitre, dites à l'élève) :
 *   1. LE BESOIN DE JANVIER : NOVA paie début janvier la ligne semi-automatique et ses moules
 *      (structure-financiere.ts, INVESTISSEMENT_DE_LA_GAMME, 190 000 € hors taxes), financés
 *      durablement. Reste leur TVA, avancée à l'État jusqu'au remboursement du crédit de TVA : un besoin
 *      de 38 000 € pendant 60 jours, du 10 janvier au 10 mars. Les créances que NOVA peut mobiliser
 *      sont celles du 31 décembre (exercice-de-nova.ts) : la facture de CampusTech du 20 décembre,
 *      22 656 € TTC, payée le 10 mars, à 60 jours du 10 janvier ; celle du 20 novembre, payée le
 *      10 février, à 30 jours.
 *   2. L'EXCÉDENT DE L'ÉTÉ : de juillet à décembre N+1, les ventes de la gamme laissent un excédent que
 *      NOVA n'emploiera pas avant janvier N+2. Où le placer, et que coûte un retrait imprévu.
 *
 * CONVENTIONS : celles de la banque du cours ; les intérêts d'un placement sont imposés au taux
 * marginal de l'impôt sur les sociétés de NOVA (25 % : son bénéfice dépasse le plafond du taux
 * réduit) ; le taux réel d'un financement est son coût rapporté à l'argent reçu au départ, ramené à
 * l'année : coût ÷ somme reçue × 360 ÷ jours.
 */

export const B = CONDITIONS_DE_LA_BANQUE;

/** Le taux réel d'un financement, en pour cent au centième : coût ÷ somme reçue × 360 ÷ jours. */
export const tauxReel = (cout: number, recu: number, jours: number) => Math.round((cout / recu) * (JOURS_DE_LA_BANQUE / jours) * 10_000) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE BESOIN DE JANVIER : LA TVA DE LA GAMME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE BESOIN (hypothèse du chapitre) : la TVA de la ligne semi-automatique et des moules, avancée le
 * 10 janvier, revient le 10 mars, quand l'État rembourse le crédit de TVA que NOVA a demandé sur sa
 * déclaration de janvier.
 */
export const BESOIN_DE_JANVIER = { montant: auCentime(INVESTISSEMENT_DE_LA_GAMME * TAUX_DE_TVA), jours: 60 } as const;

/** Les deux factures de CampusTech que NOVA peut mobiliser le 10 janvier : la plus lointaine (60 jours) et la suivante (30 jours). */
export const FACTURE_DE_DECEMBRE = { ...CREANCES_AU_31_DECEMBRE[2]!, jours: 60 };
export const FACTURE_DE_NOVEMBRE = { ...CREANCES_AU_31_DECEMBRE[1]!, jours: 30 };

/**
 * LA CESSION DAILLY (hypothèse du cours, des conditions de PME de 2026) : NOVA cède à la banque, par un
 * bordereau, des factures sur ses clients ; la banque avance leur montant toutes taxes comprises, à
 * 9,5 % l'an jusqu'à l'échéance, et prend 30 € de frais par bordereau. Le client n'a rien à accepter ;
 * NOVA reste garante du paiement.
 */
export const CONDITIONS_DU_DAILLY = { tauxAnnuel: 0.095, fraisParBordereau: 30 } as const;

/**
 * L'AFFACTURAGE (hypothèse du cours) : un factor achète les factures. Il prend une commission
 * d'affacturage de 1 % du montant TTC (la gestion des comptes clients, le recouvrement et la garantie
 * des factures qu'il a agréées), avance le montant moins une retenue de garantie de 10 %, rendue au
 * paiement du client, et facture le financement à 7 % l'an sur l'avance, jusqu'à l'échéance.
 */
export const CONDITIONS_DE_L_AFFACTURAGE = { commission: 0.01, retenueDeGarantie: 0.1, tauxDeFinancement: 0.07 } as const;

/**
 * LE CRÉDIT DE TRÉSORERIE QUI COUVRE UN BESOIN : un crédit d'un mois (la banque du cours), renouvelé
 * chaque mois tant que le besoin dure. Chaque crédit couvre le besoin, les frais de sa mise en place
 * et, au renouvellement, les intérêts du mois passé, arrondis à la tranche supérieure.
 */
export function creditRenouvele(besoin: number, jours: number) {
  const c = B.credit;
  const mois = Math.ceil(jours / JOURS_DU_MOIS_BANCAIRE - 1e-9);
  const credits: { montant: number; interets: number }[] = [];
  let dus = 0;
  for (let k = 0; k < mois; k++) {
    const montant = Math.ceil((besoin + dus + c.frais) / c.tranche - 1e-9) * c.tranche;
    const i = interets(montant, c.tauxAnnuel, JOURS_DU_MOIS_BANCAIRE);
    credits.push({ montant, interets: i });
    dus = i;
  }
  const interetsTotaux = auCentime(credits.reduce((t, x) => t + x.interets, 0));
  const frais = mois * c.frais;
  const cout = auCentime(interetsTotaux + frais);
  const recu = auCentime(credits[0]!.montant - c.frais);
  return { mois, credits, interets: interetsTotaux, frais, cout, recu, tauxReel: tauxReel(cout, recu, jours) };
}

/** L'escompte d'un effet à j jours de son échéance : l'agio, la commission, le net versé, le coût et le taux réel. */
export function escompte(nominal: number, jours: number) {
  const agio = interets(nominal, B.escompte.tauxAnnuel, jours);
  const cout = auCentime(agio + B.escompte.commission);
  const net = auCentime(nominal - cout);
  return { nominal, jours, agio, commission: B.escompte.commission, cout, net, tauxReel: tauxReel(cout, net, jours) };
}

/** La cession Dailly de créances (un bordereau) à j jours de leur échéance. */
export function dailly(nominal: number, jours: number) {
  const d = CONDITIONS_DU_DAILLY;
  const interetsDuDailly = interets(nominal, d.tauxAnnuel, jours);
  const cout = auCentime(interetsDuDailly + d.fraisParBordereau);
  const net = auCentime(nominal - cout);
  return { nominal, jours, interets: interetsDuDailly, frais: d.fraisParBordereau, cout, net, tauxReel: tauxReel(cout, net, jours) };
}

/** L'affacturage d'une facture à j jours de son échéance : la retenue, l'avance, les deux commissions, ce que le factor verse et le taux réel. */
export function affacturage(ttc: number, jours: number) {
  const a = CONDITIONS_DE_L_AFFACTURAGE;
  const retenue = auCentime(ttc * a.retenueDeGarantie);
  const avance = auCentime(ttc - retenue);
  const financement = interets(avance, a.tauxDeFinancement, jours);
  const commission = auCentime(ttc * a.commission);
  const cout = auCentime(financement + commission);
  const verse = auCentime(avance - cout);
  return { ttc, jours, retenue, avance, financement, commission, cout, verse, tauxReel: tauxReel(cout, verse, jours) };
}

/** Le crédit d'un mois qui couvre la somme qu'un effet apporterait : le comparant du curseur de l'escompte. */
export function creditDUnMois(somme: number) {
  const c = B.credit;
  const montant = Math.ceil((somme + c.frais) / c.tranche - 1e-9) * c.tranche;
  const i = interets(montant, c.tauxAnnuel, JOURS_DU_MOIS_BANCAIRE);
  return { montant, interets: i, frais: c.frais, cout: auCentime(i + c.frais) };
}

/** Le coût de l'escompte d'un effet à j jours, sans arrondi (la droite du curseur). */
export const coutDeLEscompteExact = (nominal: number, jours: number) => (nominal * B.escompte.tauxAnnuel * jours) / JOURS_DE_LA_BANQUE + B.escompte.commission;

/** Le nombre de jours le plus grand où escompter l'effet coûte au plus le crédit d'un mois. */
export function joursDEscompteAvantageux(nominal: number) {
  const credit = creditDUnMois(nominal).cout;
  return Math.floor(((credit - B.escompte.commission) * JOURS_DE_LA_BANQUE) / (nominal * B.escompte.tauxAnnuel) + 1e-9);
}

/**
 * CE QUE LA GARANTIE D'UN FACTOR AURAIT ÉVITÉ SUR SONORA (hypothèse du cours : le factor aurait agréé
 * Sonora, nouveau client de septembre). La commission porte sur les deux factures de Sonora, TTC ; la
 * perte est celle que N+1 constate (exercice-de-nova.ts, SUITES_EN_N_PLUS_1 : le liquidateur ne verse
 * que la moitié de la facture d'octobre), hors taxes, la TVA de la part perdue étant récupérée.
 */
export function garantieSurSonora() {
  const m = MONTANTS_DES_FACTURES_SONORA;
  const commission = auCentime((m.septembre.netAPayer + m.octobre.netAPayer) * CONDITIONS_DE_L_AFFACTURAGE.commission);
  const perteHt = auCentime(m.octobre.netFinancier * (1 - SUITES_EN_N_PLUS_1.sonora.partEncaissee));
  return { commission, perteHt, gain: auCentime(perteHt - commission), factures: auCentime(m.septembre.netAPayer + m.octobre.netAPayer), octobreTtc: m.octobre.netAPayer, partEncaissee: SUITES_EN_N_PLUS_1.sonora.partEncaissee, nom: SONORA.nom };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. L'EXCÉDENT DE L'ÉTÉ : PLACER
// ─────────────────────────────────────────────────────────────────────────────

/** L'excédent (hypothèse du chapitre) : 80 000 €, du 1er juillet au 31 décembre N+1, 180 jours en mois de 30 jours. */
export const EXCEDENT_DE_L_ETE = { montant: 80_000, jours: 180 } as const;

/**
 * LES PLACEMENTS PROPOSÉS (hypothèses du cours, des taux de 2026) :
 *   · LE COMPTE À TERME DE 6 MOIS, à 2,8 % l'an, garanti, bloqué : rompu avant l'échéance, il se rompt en
 *     entier et ne rapporte que 0,5 % l'an sur les jours courus (la pénalité de la banque) ;
 *   · UN FONDS MONÉTAIRE (OPCVM monétaire), disponible le lendemain, au rendement attendu de 2,6 % l'an,
 *     sans garantie de rendement mais d'un risque très faible ;
 *   · DES ACTIONS COTÉES, au rendement attendu de 6 % l'an, sans garantie du capital : le chapitre les
 *     cite pour les écarter d'une trésorerie à six mois.
 */
export const PLACEMENTS = {
  compteATerme: { tauxAnnuel: 0.028, tauxSiRompu: 0.005 },
  opcvm: { tauxAnnuel: 0.026 },
  actions: { rendementAttendu: 0.06 },
} as const;

/** Le taux d'impôt sur les intérêts : le taux normal, marginal pour NOVA. */
export const TAUX_D_IMPOT_DES_PLACEMENTS = IMPOT_SUR_LES_SOCIETES.tauxNormal;

/** Le retrait imprévu du défi (hypothèse du chapitre) : 30 000 €, possible dès le 30e jour, pour un client à servir en urgence. */
export const RETRAIT_IMPREVU = { montant: 30_000, jour: 30 } as const;

/** Une position du placement : la part au compte à terme, le retrait imprévu, son jour. */
export interface PositionDuPlacement {
  compteATerme: number;
  retrait: number;
  jour: number;
}

/**
 * CE QUE RAPPORTE L'EXCÉDENT, placé en partie au compte à terme, le reste dans le fonds monétaire. Un
 * retrait se prend d'abord sur le fonds ; s'il ne suffit pas, le compte à terme est rompu le jour du
 * retrait (0,5 % l'an sur les jours courus) et ce qui en reste rejoint le fonds jusqu'au 31 décembre.
 */
export function placement(p: PositionDuPlacement) {
  const E = EXCEDENT_DE_L_ETE;
  const P = PLACEMENTS;
  const fonds = E.montant - p.compteATerme;
  const retireDuFonds = Math.min(p.retrait, fonds);
  const manque = p.retrait - retireDuFonds;
  const rompu = manque > 0 && p.compteATerme > 0;
  let interetsDuFonds = auCentime(interets(fonds - retireDuFonds, P.opcvm.tauxAnnuel, E.jours) + interets(retireDuFonds, P.opcvm.tauxAnnuel, p.jour));
  let interetsDuCompte: number;
  if (rompu) {
    interetsDuCompte = interets(p.compteATerme, P.compteATerme.tauxSiRompu, p.jour);
    interetsDuFonds = auCentime(interetsDuFonds + interets(p.compteATerme - manque, P.opcvm.tauxAnnuel, E.jours - p.jour));
  } else {
    interetsDuCompte = interets(p.compteATerme, P.compteATerme.tauxAnnuel, E.jours);
  }
  const total = auCentime(interetsDuCompte + interetsDuFonds);
  return { fonds, rompu, interetsDuCompte, interetsDuFonds, total, apresImpot: auCentime(total * (1 - TAUX_D_IMPOT_DES_PLACEMENTS)) };
}

/** Les crans de la part au compte à terme. */
export const PAS_DU_COMPTE_A_TERME = 10_000;

/** La part au compte à terme qui rapporte le plus face à un retrait donné, au cran près (la plus petite en cas d'égalité). */
export function meilleurePart(retrait: number, jour: number) {
  let meilleure = 0;
  let total = -1;
  for (let c = 0; c <= EXCEDENT_DE_L_ETE.montant; c += PAS_DU_COMPTE_A_TERME) {
    const t = placement({ compteATerme: c, retrait, jour }).total;
    if (t > total + 1e-9) {
      total = t;
      meilleure = c;
    }
  }
  return { compteATerme: meilleure, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS : UNE CHAÎNE NOUVELLE, À 60 JOURS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA CHAÎNE ONDES (hypothèse du cas) : une chaîne de magasins de hi-fi, nouvelle cliente, commande
 * 600 enceintes par mois en N+1, avec la remise de 5 % de Sonora (plus de 300 enceintes), payées à
 * 60 jours, le plafond légal entre professionnels (Code de commerce, L. 441-10). Elle refuse
 * d'accepter des lettres de change : l'escompte est exclu. NOVA veut l'argent dès la facture : une
 * cession Dailly, ou l'affacturage.
 */
export const CHAINE_ONDES = { nom: "Ondes", enceintes: 600, remise: SONORA.remise, jours: 60 } as const;

/** La facture mensuelle de la chaîne : hors taxes, puis toutes taxes comprises. */
export function factureDeLaChaine() {
  const ht = auCentime(CHAINE_ONDES.enceintes * PRIX_DE_L_ENCEINTE * (1 - CHAINE_ONDES.remise));
  return { ht, ttc: auCentime(ht * (1 + TAUX_DE_TVA)) };
}
