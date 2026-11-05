import { auCentime } from "./amortissement";
import { CREANCES_AU_31_DECEMBRE, SONORA } from "./exercice-de-nova";
import { CHAINE_ONDES, FACTURE_DE_DECEMBRE, affacturage, escompte, factureDeLaChaine } from "./financer-et-placer";
import { RELANCES } from "./mauvais-payeurs";
import { DELAI_CONVENU_DE_CAMPUSTECH, DELAI_DE_CAMPUSTECH, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA, VENTES_A_CAMPUSTECH } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE COMPTE CLIENT DE NOVA EN N+1, LETTRAGE, EFFETS DE COMMERCE, BALANCE ÂGÉE ET
 * AFFACTURAGE (BTS CG P1, 1.3.2, 1.3.3, 1.4.1 et 1.4.2).
 *
 * Le chapitre « Le compte client : lettrage, effets de commerce, balance âgée » et son cas le lisent.
 * Rien ici ne touche l'exercice N, figé (exercice-de-nova.ts) : tout se passe de janvier à juillet N+1.
 *
 * CE QUI VIENT D'AILLEURS, ET NE S'ÉCRIT DONC PAS ICI :
 *   · CAMPUSTECH (nova-gestion.ts, exercice-de-nova.ts) : 320 enceintes par mois à 59 € HT, facturées
 *     le 20, 22 656 € TTC par facture, convenues à 60 jours et payées à 80, le 10 du troisième mois.
 *     Ses trois factures d'octobre, de novembre et de décembre N sont dues au 1er janvier N+1.
 *   · LA LETTRE DE CHANGE DE DÉCEMBRE (financer-et-placer.ts, chapitre « Financer et placer la
 *     trésorerie ») : CampusTech accepte une lettre de change sur sa facture du 20 décembre, payable
 *     le 10 mars ; NOVA la remet à l'escompte le 10 janvier, à 60 jours : 339,84 € d'agio, 20 € de
 *     commission, 22 296,16 € nets. Ce module passe ces chiffres au journal, sans en changer un seul.
 *   · SONORA (exercice-de-nova.ts) : sa facture d'octobre N, 33 630 € TTC, échue le 15 décembre N, est
 *     au compte 416 depuis la clôture ; le liquidateur n'en versera la moitié que le 30 juin N+1.
 *   · LA CHAÎNE ONDES ET LE FACTOR (financer-et-placer.ts, cas « Une chaîne nouvelle, à 60 jours ») :
 *     600 enceintes par mois avec 5 % de remise, 40 356 € TTC par facture, à 60 jours ; NOVA a choisi
 *     l'affacturage avec garantie (1 % du TTC, 10 % de retenue, 7 % l'an sur l'avance).
 *   · LES RELANCES (mauvais-payeurs.ts) : relance amiable 8 jours après l'échéance, mise en demeure à 15.
 *
 * CE QUI EST CHOISI (hypothèses du chapitre, dites à l'élève) : le virement de novembre saisi deux
 * fois, le règlement partiel de la facture de janvier, deux petits clients (Studio Méridien et Vibra),
 * les lignes de crédit, l'impayé de Vibra et ses frais, la TVA des commissions.
 *
 * CONVENTIONS : les dates de N+1 se comptent en mois de 30 jours (le rang d'un jour = (mois − 1) × 30 +
 * jour), comme les délais de la fiche ; les montants sont toutes taxes comprises, sauf mention.
 */

/** Une date de N+1 (exercice 1), ou de N (exercice 0). */
export interface DateDuCompte {
  jour: number;
  mois: number;
  exercice?: 0 | 1;
}

/** Le rang d'un jour, en mois de 30 jours, à partir du 1er janvier N+1 (le 15 décembre N vaut −15). */
export const rang = (d: DateDuCompte) => (d.mois - 1) * 30 + d.jour - (d.exercice === 0 ? 360 : 0);

const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;
/** « 10 janvier », « 1er mars ». */
export const dateEcrite = (d: DateDuCompte) => `${d.jour === 1 ? "1er" : d.jour} ${NOMS_DES_MOIS[d.mois - 1]}`;

/** Une date plus des jours, en mois de 30 jours. */
export function plusDeJours(d: DateDuCompte, jours: number): DateDuCompte {
  const r = rang(d) + jours;
  const mois = Math.floor((r - 1) / 30) + 1;
  return { jour: r - (mois - 1) * 30, mois, exercice: 1 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE COMPTE DE CAMPUSTECH DANS LE PGI
// ─────────────────────────────────────────────────────────────────────────────

/** La facture mensuelle de CampusTech : 320 enceintes à 59 € HT, TVA 20 %. */
export const FACTURE_DE_CAMPUSTECH = (() => {
  const ht = VENTES_A_CAMPUSTECH[0]! * PRIX_DE_L_ENCEINTE;
  const tva = auCentime(ht * TAUX_DE_TVA);
  return { enceintes: VENTES_A_CAMPUSTECH[0]!, ht, tva, ttc: auCentime(ht + tva) };
})();

/** La date d'arrêté du compte et de la balance âgée (hypothèse du chapitre) : le 30 avril N+1. */
export const DATE_D_ARRETE: DateDuCompte = { jour: 30, mois: 4, exercice: 1 };

/**
 * LE RÈGLEMENT PARTIEL (hypothèse du chapitre) : le 10 avril, CampusTech ne verse que 20 000 € sur sa
 * facture du 20 janvier, « le reste avec la facture suivante » ; le solde, 2 656 €, arrive le 15 mai.
 */
export const REGLEMENT_PARTIEL = { date: { jour: 10, mois: 4, exercice: 1 } as DateDuCompte, montant: 20_000, solde: { jour: 15, mois: 5, exercice: 1 } as DateDuCompte };

/**
 * LE DOUBLON (hypothèse du chapitre) : le virement de CampusTech du 10 février, qui paie la facture de
 * novembre, a été saisi à la main par le comptable, puis importé une seconde fois avec le relevé de la
 * banque dans le PGI. Le compte 411 et le compte 512 le portent deux fois ; la banque une seule.
 */
export const DOUBLON = { date: { jour: 10, mois: 2, exercice: 1 } as DateDuCompte, facture: "novembre" };

/** Une ligne du compte 411 CampusTech, telle que le PGI la montre. */
export interface LigneDuCompteClient {
  code: string;
  date: DateDuCompte;
  libelle: string;
  /** La pièce à laquelle la ligne se rapporte : la facture qu'elle crée ou qu'elle paie. */
  reference: string;
  debit: number;
  credit: number;
}

/** Les factures de CampusTech, d'octobre N à avril N+1 : la date, la référence, l'échéance convenue et le paiement réel. */
export function facturesDeCampusTech() {
  const f = FACTURE_DE_CAMPUSTECH;
  const anciennes = CREANCES_AU_31_DECEMBRE.filter((c) => c.client === "CampusTech").map((c, i) => ({
    reference: ["octobre", "novembre", "décembre"][i]!,
    date: { jour: c.date.jour, mois: c.date.mois, exercice: 0 as const },
    ttc: c.ttc,
  }));
  const nouvelles = [1, 2, 3, 4].map((m) => ({ reference: NOMS_DES_MOIS[m - 1]!, date: { jour: 20, mois: m, exercice: 1 as const }, ttc: f.ttc }));
  return [...anciennes, ...nouvelles].map((x) => ({
    ...x,
    echeance: plusDeJours(x.date, DELAI_CONVENU_DE_CAMPUSTECH),
    paiement: plusDeJours(x.date, DELAI_DE_CAMPUSTECH),
  }));
}

/**
 * LE COMPTE 411 CAMPUSTECH AU 30 AVRIL N+1, DANS LE PGI, AVANT CONTRÔLE : les trois factures de N reprises
 * à nouveau, la lettre de change acceptée sur celle de décembre (passée au 413), les virements d'octobre
 * et de novembre, le virement de novembre une seconde fois (le doublon), les quatre factures de N+1 et
 * le règlement partiel de la facture de janvier.
 */
export function compteDeCampusTech(): readonly LigneDuCompteClient[] {
  const f = facturesDeCampusTech();
  const fa = (ref: string) => f.find((x) => x.reference === ref)!;
  const fact = (ref: string, code: string): LigneDuCompteClient => ({ code, date: fa(ref).date, libelle: `Facture du ${dateEcrite(fa(ref).date)}`, reference: ref, debit: fa(ref).ttc, credit: 0 });
  return [
    fact("octobre", "f-oct"),
    fact("novembre", "f-nov"),
    fact("décembre", "f-dec"),
    { code: "lcr-dec", date: LCR_DE_DECEMBRE.acceptation, libelle: "Lettre de change acceptée, facture de décembre", reference: "décembre", debit: 0, credit: fa("décembre").ttc },
    { code: "v-oct", date: fa("octobre").paiement, libelle: "Virement reçu, facture d'octobre", reference: "octobre", debit: 0, credit: fa("octobre").ttc },
    { code: "v-nov", date: fa("novembre").paiement, libelle: "Virement reçu, facture de novembre", reference: "novembre", debit: 0, credit: fa("novembre").ttc },
    { code: "v-nov-bis", date: DOUBLON.date, libelle: "Virement reçu, facture de novembre (import du relevé)", reference: "novembre", debit: 0, credit: fa("novembre").ttc },
    fact("janvier", "f-jan"),
    fact("février", "f-fev"),
    fact("mars", "f-mar"),
    { code: "v-jan", date: REGLEMENT_PARTIEL.date, libelle: "Virement reçu, facture de janvier", reference: "janvier", debit: 0, credit: REGLEMENT_PARTIEL.montant },
    fact("avril", "f-avr"),
  ];
}

/** Le solde d'un compte de tiers, débit moins crédit. */
const solde = (lignes: readonly LigneDuCompteClient[]) => auCentime(lignes.reduce((t, l) => t + l.debit - l.credit, 0));

/**
 * LE LETTRAGE. Le PGI lettre automatiquement une facture et les règlements qui portent sa référence quand
 * leurs montants s'annulent exactement (lettres A, B, C). Il ne lettre pas un règlement partiel : le
 * comptable le lettre à la main, en lettrage partiel, et la facture reste ouverte pour son solde. Un
 * règlement sans facture ouverte à sa référence reste seul : c'est l'anomalie à expliquer. Un lettrage
 * au seul montant aurait lettré le doublon avec la facture de janvier, du même montant : on lettre sur
 * la référence de la pièce, pas sur le montant.
 */
export function lettrageDeCampusTech() {
  const c = compteDeCampusTech();
  const parReference = new Map<string, LigneDuCompteClient[]>();
  for (const l of c) parReference.set(l.reference, [...(parReference.get(l.reference) ?? []), l]);
  const lettres: { reference: string; lettre: string; lignes: string[] }[] = [];
  const nonLettrees: LigneDuCompteClient[] = [];
  const partielles: { reference: string; lignes: string[]; reste: number }[] = [];
  let k = 0;
  for (const [reference, lignes] of parReference) {
    const facture = lignes.find((l) => l.debit > 0)!;
    const reglements = lignes.filter((l) => l.credit > 0);
    // Les règlements qui soldent la facture, dans l'ordre ; ce qui dépasse reste seul.
    let reste = facture.debit;
    const pris: LigneDuCompteClient[] = [];
    for (const r of reglements) {
      if (reste > 1e-9) {
        pris.push(r);
        reste = auCentime(reste - r.credit);
      } else nonLettrees.push(r);
    }
    if (pris.length === 0) nonLettrees.push(facture);
    else if (Math.abs(reste) < 1e-9) lettres.push({ reference, lettre: String.fromCharCode(65 + k++), lignes: [facture.code, ...pris.map((p) => p.code)] });
    else partielles.push({ reference, lignes: [facture.code, ...pris.map((p) => p.code)], reste });
  }
  const affiche = solde(c);
  const juste = auCentime(affiche + DOUBLON_MONTANT());
  return { lettres, nonLettrees, partielles, affiche, juste, ecart: auCentime(juste - affiche) };
}

/** Le montant du doublon : le virement de novembre. */
const DOUBLON_MONTANT = () => facturesDeCampusTech().find((x) => x.reference === DOUBLON.facture)!.ttc;

/** L'écriture qui annule le doublon, après l'avis du responsable : le 30 avril. */
export const annulationDuDoublon = () => ({ date: DATE_D_ARRETE, montant: DOUBLON_MONTANT() });

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA LETTRE DE CHANGE DE DÉCEMBRE, AU JOURNAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA LETTRE DE CHANGE RELEVÉ DE DÉCEMBRE (financer-et-placer.ts) : NOVA la tire le 5 janvier sur
 * CampusTech, qui l'accepte le jour même, au nominal de la facture du 20 décembre, payable le 10 mars ;
 * NOVA la remet à l'escompte le 10 janvier. LA TVA DE LA COMMISSION (hypothèse du cours, À VÉRIFIER
 * sur le bordereau d'une vraie banque) : la commission d'escompte rémunère un crédit ; la banque de
 * NOVA ne la soumet pas à la TVA (les opérations de crédit en sont exonérées, une banque peut opter
 * pour certaines commissions). Le bordereau est donc celui du chapitre « Financer et placer » : le net
 * crédité est le net calculé là-bas.
 */
// À VÉRIFIER : l'exonération de TVA de la commission d'escompte (CGI, article 261 C, et l'option de l'article 260 B).
export const LCR_DE_DECEMBRE = {
  acceptation: { jour: 5, mois: 1, exercice: 1 } as DateDuCompte,
  remise: { jour: 10, mois: 1, exercice: 1 } as DateDuCompte,
  echeance: { jour: 10, mois: 3, exercice: 1 } as DateDuCompte,
};

/** Le bordereau d'escompte du 10 janvier : les chiffres de « Financer et placer la trésorerie ». */
export const bordereauDEscompte = () => escompte(FACTURE_DE_DECEMBRE.ttc, FACTURE_DE_DECEMBRE.jours);

/**
 * LES EFFETS ESCOMPTÉS NON ÉCHUS, un engagement hors bilan : NOVA reste garante du paiement jusqu'à
 * l'échéance (si CampusTech ne paie pas la banque, la banque se retourne contre NOVA). L'annexe les
 * déclare à chaque arrêté tant que l'échéance n'est pas passée.
 */
export function effetsEscomptesNonEchus(arrete: DateDuCompte) {
  const l = LCR_DE_DECEMBRE;
  return rang(l.remise) <= rang(arrete) && rang(arrete) < rang(l.echeance) ? FACTURE_DE_DECEMBRE.ttc : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LA BALANCE ÂGÉE ET LES LIGNES DE CRÉDIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DEUX PETITS CLIENTS PROFESSIONNELS DE N+1 (hypothèses du chapitre) :
 *   · STUDIO MÉRIDIEN, une école de musique et de son : 50 NOVA One le 10 février, à 59 € HT, payables à
 *     30 jours, le 10 mars. Rien n'est arrivé au 30 avril malgré la relance et la mise en demeure ;
 *   · VIBRA, un magasin de hi-fi : 100 NOVA One le 10 avril, payables par lettre de change relevé à
 *     60 jours, le 10 juin. Vibra l'accepte le 10 mai.
 */
export const STUDIO_MERIDIEN = { nom: "Studio Méridien", enceintes: 50, date: { jour: 10, mois: 2, exercice: 1 } as DateDuCompte, delai: 30 } as const;
export const VIBRA = { nom: "Vibra", enceintes: 100, date: { jour: 10, mois: 4, exercice: 1 } as DateDuCompte, delai: 60 } as const;

/** Une facture de NOVA One à 59 € HT : HT, TVA, TTC. */
export function factureDEnceintes(enceintes: number) {
  const ht = auCentime(enceintes * PRIX_DE_L_ENCEINTE);
  const tva = auCentime(ht * TAUX_DE_TVA);
  return { ht, tva, ttc: auCentime(ht + tva) };
}

/** Le TTC d'une enceinte NOVA One : ce qu'une enceinte de plus ajoute à l'en-cours. */
export const TTC_D_UNE_ENCEINTE = auCentime(PRIX_DE_L_ENCEINTE * (1 + TAUX_DE_TVA));

/**
 * LES LIGNES DE CRÉDIT (hypothèses du chapitre : le plafond d'en-cours que le responsable du crédit
 * client accorde à chaque client) : CampusTech 80 000 €, Vibra 10 000 €, Studio Méridien 3 000 €,
 * Sonora aucune (elle est en procédure collective). L'EN-COURS d'un client = ce qu'il doit encore
 * (factures non réglées, échues ou non) + ses effets escomptés non échus, dont NOVA reste garante.
 */
export const LIGNES_DE_CREDIT = { CampusTech: 80_000, Vibra: 10_000, "Studio Méridien": 3_000, Sonora: 0 } as const;

/** Les tranches de la balance âgée, en jours de retard après l'échéance convenue. */
export const TRANCHES = [
  { code: "non-echu", libelle: "Non échu" },
  { code: "1-30", libelle: "1 à 30 j" },
  { code: "31-60", libelle: "31 à 60 j" },
  { code: "plus-60", libelle: "Plus de 60 j" },
] as const;
export type CodeDeTranche = (typeof TRANCHES)[number]["code"];

/** La tranche d'un retard en jours (0 ou moins : non échu). */
export const trancheDuRetard = (jours: number): CodeDeTranche => (jours <= 0 ? "non-echu" : jours <= 30 ? "1-30" : jours <= 60 ? "31-60" : "plus-60");

/** Une créance ouverte au 30 avril : le client, la pièce, l'échéance, ce qui reste dû, le retard. */
export interface CreanceOuverte {
  client: keyof typeof LIGNES_DE_CREDIT;
  piece: string;
  echeance: DateDuCompte;
  reste: number;
  retard: number;
  tranche: CodeDeTranche;
}

/** Les créances ouvertes au 30 avril N+1, une fois le doublon annulé : le grand livre auxiliaire des clients. */
export function creancesOuvertes(): readonly CreanceOuverte[] {
  const a = rang(DATE_D_ARRETE);
  const cree = (client: CreanceOuverte["client"], piece: string, echeance: DateDuCompte, reste: number): CreanceOuverte => {
    const retard = a - rang(echeance);
    return { client, piece, echeance, reste, retard, tranche: trancheDuRetard(retard) };
  };
  const f = facturesDeCampusTech();
  const fa = (ref: string) => f.find((x) => x.reference === ref)!;
  const studio = factureDEnceintes(STUDIO_MERIDIEN.enceintes);
  const vibra = factureDEnceintes(VIBRA.enceintes);
  const sonora = CREANCES_AU_31_DECEMBRE.find((c) => c.client === SONORA.nom)!;
  return [
    cree("CampusTech", "facture du 20 janvier (solde)", fa("janvier").echeance, auCentime(fa("janvier").ttc - REGLEMENT_PARTIEL.montant)),
    cree("CampusTech", "facture du 20 février", fa("février").echeance, fa("février").ttc),
    cree("CampusTech", "facture du 20 mars", fa("mars").echeance, fa("mars").ttc),
    cree("CampusTech", "facture du 20 avril", fa("avril").echeance, fa("avril").ttc),
    cree("Studio Méridien", "facture du 10 février", plusDeJours(STUDIO_MERIDIEN.date, STUDIO_MERIDIEN.delai), studio.ttc),
    cree("Vibra", "facture du 10 avril", plusDeJours(VIBRA.date, VIBRA.delai), vibra.ttc),
    cree("Sonora", "facture du 15 octobre N (416)", { ...SONORA.secondeCommande.echeance, exercice: 0 }, sonora.ttc),
  ];
}

/** Les clients de la balance âgée, dans l'ordre du tableau. */
export const CLIENTS_DE_LA_BALANCE = ["CampusTech", "Studio Méridien", "Vibra", "Sonora"] as const;

/** La balance âgée au 30 avril : chaque client, tranche par tranche, et le total ; l'en-cours face à la ligne. */
export function balanceAgee() {
  const c = creancesOuvertes();
  const lignes = CLIENTS_DE_LA_BALANCE.map((client) => {
    const siennes = c.filter((x) => x.client === client);
    const parTranche = Object.fromEntries(TRANCHES.map((t) => [t.code, auCentime(siennes.filter((x) => x.tranche === t.code).reduce((s, x) => s + x.reste, 0))])) as Record<CodeDeTranche, number>;
    const total = auCentime(siennes.reduce((s, x) => s + x.reste, 0));
    const echu = auCentime(total - parTranche["non-echu"]);
    const ligne = LIGNES_DE_CREDIT[client];
    return { client, parTranche, total, echu, ligne, depasse: total > ligne, retardMaximal: Math.max(0, ...siennes.map((x) => x.retard)) };
  });
  const totaux = Object.fromEntries(TRANCHES.map((t) => [t.code, auCentime(lignes.reduce((s, l) => s + l.parTranche[t.code], 0))])) as Record<CodeDeTranche, number>;
  const total = auCentime(lignes.reduce((s, l) => s + l.total, 0));
  return { lignes, totaux, total, partEchue: auCentime(total - totaux["non-echu"]) / total };
}

/** La relance où en est un retard : rien, la relance amiable, la mise en demeure. */
export const etapeDeRelance = (retard: number) => (retard >= RELANCES.miseEnDemeure ? "mise-en-demeure" : retard >= RELANCES.relanceAmiable ? "relance-amiable" : "aucune");

/**
 * L'EN-COURS DE CAMPUSTECH, face à sa ligne, avec une commande urgente (des enceintes de plus,
 * facturées TTC) et, si on l'escompte, la facture de mars en lettre de change : l'escompte sort la
 * créance du 411, il ne sort pas le risque de l'en-cours, l'effet escompté non échu y reste.
 */
export function enCoursDeCampusTech(p: { commande: number; escompte: 0 | 1 }) {
  const b = balanceAgee().lignes.find((l) => l.client === "CampusTech")!;
  const commande = auCentime(p.commande * TTC_D_UNE_ENCEINTE);
  const effet = p.escompte === 1 ? FACTURE_DE_CAMPUSTECH.ttc : 0;
  const auBilan = auCentime(b.total + commande - effet);
  const enCours = auCentime(auBilan + effet);
  return { avant: b.total, commande, auBilan, effet, enCours, ligne: b.ligne, marge: auCentime(b.ligne - enCours), accepte: enCours <= b.ligne + 1e-9 };
}

/** La plus grosse commande urgente, en enceintes, que la ligne accepte (au pas donné). */
export function commandeMaximale(pas = 1) {
  const b = balanceAgee().lignes.find((l) => l.client === "CampusTech")!;
  return Math.floor((b.ligne - b.total) / TTC_D_UNE_ENCEINTE / pas + 1e-9) * pas;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LA LCR DE VIBRA : ENCAISSEMENT ET IMPAYÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA LCR DE VIBRA (hypothèses du chapitre) : acceptée le 10 mai (au 413), remise à l'encaissement le
 * 5 juin (au 5113), échue le 10 juin. Le 12 juin, la banque renvoie l'effet impayé : Vibra n'avait pas la
 * provision. Elle débite NOVA de ses frais d'impayé, 15 € HT, et de leur TVA : la banque de NOVA a opté
 * pour la TVA sur ses commissions de service (hypothèse du cours, À VÉRIFIER sur un vrai tarif).
 */
// À VÉRIFIER : la TVA sur les frais d'impayé d'un effet (option de la banque pour les commissions de service).
export const LCR_DE_VIBRA = {
  acceptation: { jour: 10, mois: 5, exercice: 1 } as DateDuCompte,
  remise: { jour: 5, mois: 6, exercice: 1 } as DateDuCompte,
  echeance: { jour: 10, mois: 6, exercice: 1 } as DateDuCompte,
  impaye: { jour: 12, mois: 6, exercice: 1 } as DateDuCompte,
  fraisHt: 15,
};

/** L'avis d'impayé de Vibra : le nominal qui revient au 411, les frais, leur TVA, ce que la banque débite. */
export function impayeDeVibra() {
  const nominal = factureDEnceintes(VIBRA.enceintes).ttc;
  const tva = auCentime(LCR_DE_VIBRA.fraisHt * TAUX_DE_TVA);
  return { nominal, frais: LCR_DE_VIBRA.fraisHt, tva, debitBanque: auCentime(LCR_DE_VIBRA.fraisHt + tva) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. L'AFFACTURAGE DES FACTURES D'ONDES, AU JOURNAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PREMIÈRE FACTURE D'ONDES CÉDÉE AU FACTOR (hypothèse du chapitre) : le 15 mai N+1, à 60 jours. Les
 * conditions et les montants sont ceux de financer-et-placer.ts. LA TVA DE LA COMMISSION D'AFFACTURAGE :
 * elle paie un service (la gestion du compte, le recouvrement, la garantie), soumis à la TVA ; la
 * commission de financement est un intérêt, exonéré (À VÉRIFIER). Le chapitre « Financer et placer »
 * comptait le coût hors taxes ; au journal, le factor retient aussi cette TVA, que NOVA déduit : le
 * coût ne change pas, le versement baisse de la TVA.
 */
// À VÉRIFIER : TVA sur la commission d'affacturage (service taxable), commission de financement exonérée.
export const CESSION_D_ONDES = { date: { jour: 15, mois: 5, exercice: 1 } as DateDuCompte, echeance: { jour: 15, mois: 7, exercice: 1 } as DateDuCompte };

/** Le bordereau du factor : avance, commissions, TVA, versement ; la retenue de garantie reste au 467. */
export function bordereauDuFactor() {
  const fct = factureDeLaChaine();
  const a = affacturage(fct.ttc, CHAINE_ONDES.jours);
  const tva = auCentime(a.commission * TAUX_DE_TVA);
  return { ...a, facture: fct, tva, verseAuJournal: auCentime(a.verse - tva), client: CHAINE_ONDES.nom };
}
