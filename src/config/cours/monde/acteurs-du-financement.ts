import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, ENDETTEMENT_MAXIMAL } from "../financement";
import { auCentime } from "./amortissement";
import { cloture } from "./cloture";
import { ACTIONS_DE_NOVA, AUGMENTATION_DE_CAPITAL, BESOIN_DE_FONDS } from "./comptabilite-approfondie";
import { empruntALaCloture, tableauDAmortissement } from "./emprunt";
import { CONTRAT_DE_PRET, EXERCICE_DE_NOVA, type FicheDeLExercice } from "./exercice-de-nova";
import { EMPRUNT_DE_LA_LIGNE, EMPRUNT_DU_PLAN_EQUILIBRE, LIGNE_A_FINANCER } from "./financement-de-la-gamme";
import { COMPTE_COURANT, LOYERS_D_UNE_ANNEE, PRET_PARTICIPATIF, TAUX_DE_LA_SUBVENTION, remboursements, type AnneeDeRemboursement } from "./financement-du-lycee";

/**
 * LE MONDE DU COURS : LES ACTEURS ET LES MODES DE FINANCEMENT DE NOVA (DCG UE6 3.1 et 3.2).
 *
 * Le chapitre « Les acteurs et les modes de financement » et son cas le lisent. Le plan de financement
 * de la gamme (financement-de-la-gamme.ts) a conclu : la réserve et la CAF ne suffisent pas, il manque
 * 80 000 € en N+1 (EMPRUNT_DU_PLAN_EQUILIBRE), que le plan a demandés à la banque. Ici, on se demande
 * QUI peut les apporter, à quelles conditions, et ce que NOVA s'engage à rendre. Le coût actuariel de
 * chaque financement n'est pas l'objet : c'est le chapitre « Arbitrer les coûts de financement ».
 *
 * UNE SEULE NOVA : ce qui existe déjà est lu, pas recopié :
 *   · la banque prête au taux du prêt de NOVA, 5 %, sur 5 ans, le capital en parts égales
 *     (EMPRUNT_DE_LA_LIGNE) ;
 *   · le compte courant d'associé (3 %, 5 ans, remboursé en une fois, 40 000 € au plus) et le prêt
 *     participatif des internautes (6 %, 4 ans, remboursé en une fois) sont ceux de « Financer
 *     autrement » (financement-du-lycee.ts), comme la subvention de la région, 20 % de la ligne ;
 *   · l'apport au capital est l'augmentation de capital de N+1 (comptabilite-approfondie.ts) : une
 *     investisseuse, une business angel, souscrit 5 000 actions nouvelles à 12 €, 60 000 € ;
 *   · le bilan, la CAF et l'emprunt en cours sont ceux de la clôture du premier exercice (cloture.ts) ;
 *     le loyer du local, celui de la fiche ;
 *   · les règles des banques sont celles du cours (config/cours/financement.ts).
 * Tout ce qui est neuf est une HYPOTHÈSE DU COURS, nommée ci-dessous. La garde
 * tests/cours/les-acteurs-et-les-modes-de-financement.test.ts refait chaque chiffre à la main.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES OFFRES
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qui manque au plan de la gamme en N+1, une fois la réserve et la CAF comptées. */
export const BESOIN_EXTERNE = EMPRUNT_DU_PLAN_EQUILIBRE;

/**
 * LE PRÊT DE DÉVELOPPEMENT DE BPIFRANCE (hypothèse du cours, des conditions d'ordre de grandeur et non
 * un barème) : 5,5 % l'an sur 6 ans, la première année en différé (les intérêts seuls), puis le capital
 * en cinq parts égales. Aucune caution du dirigeant ; Bpifrance prête aux côtés d'une banque, au plus
 * autant qu'elle.
 */
export const PRET_DE_BPIFRANCE = { taux: 0.055, dureeAns: 6, differeAns: 1 } as const;

/**
 * LE PRÊT VERT (hypothèse du cours) : la banque baisse son taux d'un demi-point si la ligne obtient une
 * certification de performance énergétique, délivrée par un organisme certificateur indépendant. La
 * certification coûte 2 000 € ; l'ADEME en prend la moitié en charge, au titre de son aide aux études.
 */
export const PRET_VERT = { reductionDuTaux: 0.005, certification: 2_000, partDeLAdeme: 0.5 } as const;

/**
 * LES ACTEURS HORS DE PORTÉE (hypothèse du cours, des ordres de grandeur) : un fonds de capital
 * développement n'étudie pas un dossier sous 1 000 000 € ; une émission d'obligations sur le marché
 * se compte en dizaines de millions. NOVA cherche 80 000 €.
 */
export const TICKET_MINIMAL_DU_FONDS = 1_000_000;
export const EMISSION_OBLIGATAIRE_MINIMALE = 20_000_000;

/** Le prix d'une action nouvelle, le nombre d'actions émises et l'apport de la business angel. */
export const APPORT_DE_LA_BUSINESS_ANGEL = {
  prix: AUGMENTATION_DE_CAPITAL.prixDEmission,
  actions: BESOIN_DE_FONDS / AUGMENTATION_DE_CAPITAL.prixDEmission,
  montant: BESOIN_DE_FONDS,
} as const;

/** Les fondateurs veulent garder au moins les trois quarts du capital (hypothèse du cours). */
export const PART_MINIMALE_DES_FONDATEURS = 0.75;

/** La première année des nouveaux financements, au plus (hypothèse du cours : l'année du lancement de la gamme). */
export const PREMIERE_ANNEE_PLAFOND = 12_000;

/** Les intérêts de toute la durée que les associés acceptent, au plus (hypothèse du cours). */
export const INTERETS_PLAFOND = 13_000;

// ─────────────────────────────────────────────────────────────────────────────
// LES ENGAGEMENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qu'un financement engage NOVA à rendre : le capital, les intérêts, la première année. */
export interface Engagement {
  capital: number;
  interets: number;
  total: number;
  premiereAnnee: number;
  tableau: AnneeDeRemboursement[];
}

const engagementDe = (tableau: AnneeDeRemboursement[]): Engagement => {
  const capital = auCentime(tableau.reduce((s, a) => s + a.capital, 0));
  const interets = auCentime(tableau.reduce((s, a) => s + a.interets, 0));
  return { capital, interets, total: auCentime(capital + interets), premiereAnnee: tableau[0]?.total ?? 0, tableau };
};

/** Le prêt bancaire : le capital en parts égales sur 5 ans, à 5 % (ou au taux du prêt vert). */
export const engagementBancaire = (montant: number, taux: number = EMPRUNT_DE_LA_LIGNE.taux) => engagementDe(remboursements({ taux, dureeAns: EMPRUNT_DE_LA_LIGNE.dureeAns, mode: "amortissement-constant" }, montant));

/** Le prêt de Bpifrance : les intérêts seuls pendant le différé, puis le capital en parts égales. */
export function engagementBpifrance(montant: number) {
  const b = PRET_DE_BPIFRANCE;
  const parts = b.dureeAns - b.differeAns;
  const tableau: AnneeDeRemboursement[] = [];
  let du = montant;
  for (let annee = 1; annee <= b.dureeAns; annee++) {
    const interets = auCentime(du * b.taux);
    const capital = annee <= b.differeAns ? 0 : auCentime(montant / parts);
    tableau.push({ annee, interets, capital, total: auCentime(interets + capital) });
    du = auCentime(du - capital);
  }
  return engagementDe(tableau);
}

export const engagementDuCompteCourant = (montant: number) => engagementDe(remboursements(COMPTE_COURANT, montant));
export const engagementParticipatif = (montant: number) => engagementDe(remboursements(PRET_PARTICIPATIF, montant));

/** Les engagements de NOVA au 31 décembre : l'emprunt en cours (le capital restant dû et les intérêts à venir) et le bail. */
export function engagementsEnCours(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const e = empruntALaCloture(f.pret);
  const aVenir = tableauDAmortissement(f.pret).slice(e.echeances.length);
  const interetsAVenir = auCentime(aVenir.reduce((s, l) => s + l.interets, 0));
  return {
    capitalRestantDu: e.capitalRestantDu,
    echeancesAVenir: aVenir.length,
    interetsAVenir,
    emprunt: auCentime(e.capitalRestantDu + interetsAVenir),
    loyers: LOYERS_D_UNE_ANNEE,
    total: auCentime(e.capitalRestantDu + interetsAVenir + LOYERS_D_UNE_ANNEE),
  };
}

/** Le prêt vert : les intérêts épargnés sur un montant, la certification nette de l'aide, le gain. */
export function pretVert(montant: number) {
  const normal = engagementBancaire(montant);
  const vert = engagementBancaire(montant, EMPRUNT_DE_LA_LIGNE.taux - PRET_VERT.reductionDuTaux);
  const epargne = auCentime(normal.interets - vert.interets);
  const certificationNette = auCentime(PRET_VERT.certification * (1 - PRET_VERT.partDeLAdeme));
  return { normal, vert, epargne, certificationNette, gain: auCentime(epargne - certificationNette) };
}

/** Le plus petit emprunt vert, en milliers d'euros, dont les intérêts épargnés paient la certification nette. */
export function seuilDuPretVert() {
  for (let k = 0; k <= 200; k++) if (pretVert(k * 1_000).gain >= 0 && k > 0) return k;
  return null;
}

/** La business angel : les actions, la part qu'elle prend, la part que gardent les fondateurs, ce que valent ses actions aux capitaux propres. */
export function apportDeLaBusinessAngel(f: FicheDeLExercice = EXERCICE_DE_NOVA, montant: number = APPORT_DE_LA_BUSINESS_ANGEL.montant) {
  const k = cloture(f);
  const capitauxPropres = auCentime(f.apport.montant + k.resultatNet);
  const actions = montant / APPORT_DE_LA_BUSINESS_ANGEL.prix;
  const total = ACTIONS_DE_NOVA.nombre + actions;
  const part = actions / total;
  const capitauxPropresApres = auCentime(capitauxPropres + montant);
  return {
    actions,
    total,
    part,
    partDesFondateurs: 1 - part,
    capitauxPropres,
    capitauxPropresApres,
    /** La part des capitaux propres qui revient à la business angel, au centime. */
    saPart: auCentime(capitauxPropresApres * part),
    valeurDeLActionAvant: Math.round((capitauxPropres / ACTIONS_DE_NOVA.nombre) * 100) / 100,
  };
}

/** La subvention de la région : 20 % du prix de la ligne, qui ne se rembourse pas si NOVA tient ses engagements. */
export const SUBVENTION_DE_LA_LIGNE = auCentime(LIGNE_A_FINANCER.montant * TAUX_DE_LA_SUBVENTION);

// ─────────────────────────────────────────────────────────────────────────────
// LE MONTAGE : QUI APPORTE LES 80 000 €
// ─────────────────────────────────────────────────────────────────────────────

/** Les sources que le laboratoire combine ; la banque prend le reste. */
export interface MontageDuFinancement {
  capital: number;
  compteCourant: number;
  bpifrance: number;
}

/** Le montage, ses engagements et ce que la banque en dira au 31 décembre. */
export function montage(m: Partial<MontageDuFinancement> = {}, f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const capital = m.capital ?? 0;
  const compteCourant = m.compteCourant ?? 0;
  const bpifrance = m.bpifrance ?? 0;
  const banque = auCentime(BESOIN_EXTERNE - capital - compteCourant - bpifrance);
  const sources = {
    banque: engagementBancaire(Math.max(0, banque)),
    bpifrance: engagementBpifrance(bpifrance),
    compteCourant: engagementDuCompteCourant(compteCourant),
  };
  const liste = Object.values(sources);
  const interets = auCentime(liste.reduce((s, e) => s + e.interets, 0));
  const aRendre = auCentime(liste.reduce((s, e) => s + e.total, 0));
  const premiereAnnee = auCentime(liste.reduce((s, e) => s + e.premiereAnnee, 0));
  const a = apportDeLaBusinessAngel(f, capital);
  // Ce que la banque lit, comme si tout était signé au 31 décembre : le compte courant bloqué compte en dette financière.
  const k = cloture(f);
  const dettesFinancieres = auCentime(empruntALaCloture(f.pret).capitalRestantDu + banque + bpifrance + compteCourant);
  const capitauxPropres = a.capitauxPropresApres;
  return {
    capital,
    compteCourant,
    bpifrance,
    banque,
    sources,
    interets,
    aRendre,
    premiereAnnee,
    partDesFondateurs: a.partDesFondateurs,
    caf: k.caf.additive,
    dettesFinancieres,
    capitauxPropres,
    endettement: dettesFinancieres / capitauxPropres,
    capaciteDeRemboursement: dettesFinancieres / k.caf.additive,
    /** Bpifrance prête aux côtés de la banque, au plus autant qu'elle ; la banque ne prend pas un montant négatif. */
    possible: banque >= 0 && bpifrance <= banque && compteCourant <= COMPTE_COURANT.plafond!,
  };
}

export type Montage = ReturnType<typeof montage>;

/** Le montage tient-il les conditions des associés et des banques ? */
export const montageTenable = (x: Montage) =>
  x.possible &&
  x.premiereAnnee <= PREMIERE_ANNEE_PLAFOND &&
  x.interets <= INTERETS_PLAFOND &&
  x.partDesFondateurs >= PART_MINIMALE_DES_FONDATEURS - 1e-9 &&
  x.endettement <= ENDETTEMENT_MAXIMAL &&
  x.capaciteDeRemboursement <= CAPACITE_DE_REMBOURSEMENT_MAXIMALE;

/** Le contrat de prêt en cours, pour les tests et les tableaux. */
export const PRET_EN_COURS = CONTRAT_DE_PRET;

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS « LA BANQUE DEMANDE UNE GARANTIE »
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA GARANTIE (hypothèse du cas) : la banque prête sans garantie jusqu'à 50 000 € ; au-delà, elle veut
 * la moitié du prêt garantie, par la caution personnelle du dirigeant ou par une garantie de Bpifrance,
 * facturée 1 % l'an du capital garanti restant dû en début d'année.
 */
export const GARANTIE = { sansGarantieJusqua: 50_000, quotite: 0.5, commission: 0.01 } as const;

/** Le prêt bancaire garanti par Bpifrance : la commission de chaque année, son total, et ce que NOVA s'engage à rendre. */
export function pretGaranti(montant: number) {
  const e = engagementBancaire(montant);
  let du = montant;
  const commissions = e.tableau.map((a) => {
    const c = auCentime(du * GARANTIE.quotite * GARANTIE.commission);
    du = auCentime(du - a.capital);
    return c;
  });
  const commission = auCentime(commissions.reduce((s, c) => s + c, 0));
  return { e, commissions, commission, aRendre: auCentime(e.total + commission), premiereAnnee: auCentime(e.premiereAnnee + commissions[0]!) };
}

/** Le montage sans garantie : la banque jusqu'à son plafond, le reste en prêt participatif des internautes. */
export function sansGarantie(besoin: number = BESOIN_EXTERNE) {
  const banque = engagementBancaire(GARANTIE.sansGarantieJusqua);
  const participatif = engagementParticipatif(auCentime(besoin - GARANTIE.sansGarantieJusqua));
  return {
    banque,
    participatif,
    interets: auCentime(banque.interets + participatif.interets),
    aRendre: auCentime(banque.total + participatif.total),
    premiereAnnee: auCentime(banque.premiereAnnee + participatif.premiereAnnee),
  };
}
