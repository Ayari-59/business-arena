import { auCentime } from "./amortissement";
import { cloture } from "./cloture";
import { FACTURE_DE_CAMPUSTECH, REGLEMENT_PARTIEL, VIBRA, bordereauDuFactor, dateEcrite, facturesDeCampusTech, plusDeJours, rang, type DateDuCompte } from "./compte-client-de-nova";
import { INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT, JOURS_DE_L_ANNEE_CIVILE, OFFRES_DE_COMPOSANTS, OFFRE_HABITUELLE } from "./delais-et-tva";
import { CONDITIONS_DE_LA_BANQUE, JOURS_DE_LA_BANQUE, matelasDe } from "./equilibre-de-tresorerie";
import { ELECTRO_COMPOSANTS, EXERCICE_DE_NOVA, IMPOT_SUR_LES_SOCIETES, LOYER_DU_MOIS, PAIE_DU_MOIS, SONORA, SUITES_EN_N_PLUS_1, TAUX_DE_LA_PAIE, VENTES_AUX_PARTICULIERS } from "./exercice-de-nova";
import { CHAINE_ONDES, CONDITIONS_DU_DAILLY, creditDUnMois, dailly } from "./financer-et-placer";
import { RELANCES, TAUX_DES_PENALITES } from "./mauvais-payeurs";
import { AUTRES_COUTS_PAR_ENCEINTE, NOVA_GESTION, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA, VENTES_A_CAMPUSTECH } from "./nova-gestion";
import { bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : LE DÉCOUVERT DE NOVA EN MAI N+1 (décision du propriétaire, novembre 2026 : le
 * format « scénario à embranchements » ; BTS CG P6, 6.4.2 ; DCG UE6, 5.1).
 *
 * Le 28 avril N+1, le président de NOVA regarde le plan de trésorerie de mai : le compte passe sous zéro
 * dès le 1er mai, et au delà de l'autorisation le 5. Trois décisions à la suite, chacune sur la situation
 * que la précédente laisse : le client (CampusTech), le fournisseur (Électro-Composants), la banque. Le
 * scénario (config/cours/scenarios/le-decouvert-de-nova.ts) lit tout ici ; chaque branche se CALCULE
 * (`resultatDeLaSuite`), aucune ne s'écrit à la main.
 *
 * CE QUI VIENT DU MONDE, ET NE S'ÉCRIT DONC PAS ICI :
 *   · CampusTech (compte-client-de-nova.ts) : la facture mensuelle, convenue à 60 jours et payée à 80 ;
 *     la facture de février, échue le 20 avril, payée le 10 mai ; le solde du règlement partiel de
 *     janvier, le 15 mai ; la relance amiable 8 jours après l'échéance (mauvais-payeurs.ts) ;
 *   · Ondes et son factor (compte-client-de-nova.ts) : le versement du factor, le 15 mai ;
 *   · Électro-Composants (delais-et-tva.ts, exercice-de-nova.ts) : 22 € le jeu, facturé le 10, payé le
 *     1er du mois suivant ; les pénalités de retard, au taux de la BCE majoré de 10 points, et 40 €
 *     d'indemnité (mauvais-payeurs.ts) ;
 *   · le loyer, la paie, le solde de l'impôt de N (cloture.ts : aucun acompte versé en N), la
 *     condamnation du litige le 15 mai (exercice-de-nova.ts, SUITES_EN_N_PLUS_1) ;
 *   · la banque (equilibre-de-tresorerie.ts, financer-et-placer.ts) : le découvert autorisé à 12 %, le
 *     crédit de trésorerie d'un mois, la cession Dailly, l'année de 360 jours ; le matelas que le
 *     président veut garder (le seuil d'alerte du tableau de bord, nova-gestion.ts) ;
 *   · le taux d'escompte de règlement des conditions de NOVA (celui de Sonora, exercice-de-nova.ts).
 *
 * CE QUI EST CHOISI (hypothèses du scénario, chacune nommée ci-dessous et dite à l'élève) : le solde du
 * 30 avril, les ventes en ligne de N+1 (celles du même mois de N), la réaction de CampusTech à une
 * relance ou à un escompte, celle d'Électro-Composants à un étalement ou à un retard, les frais d'un
 * prélèvement rejeté.
 *
 * CONVENTIONS : celles de la banque du cours, des mois de 30 jours (mai compte 30 jours, le dernier est
 * dit « 31 mai ») ; le même jour, les crédits passent avant les débits ; un débit qui porterait le compte
 * au delà du découvert autorisé est rejeté, puis repasse dès que le solde le permet ; les agios d'un mois
 * se prélèvent le mois suivant ; tout est toutes taxes comprises, sauf mention.
 */

const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));
const mai = (jour: number): DateDuCompte => ({ jour, mois: 5, exercice: 1 });
/** Les jours de mai, en mois de 30 jours. */
export const JOURS_DE_MAI = 30;

// ─────────────────────────────────────────────────────────────────────────────
// 1. LES HYPOTHÈSES DU SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

/** Les trois factures de CampusTech que mai touche : février (échue), mars et avril (à venir). */
const factureDe = (reference: "février" | "mars" | "avril") => facturesDeCampusTech().find((x) => x.reference === reference)!;

/**
 * LE JOUR DU SCÉNARIO : le jour de la relance amiable de la facture de février, 8 jours après son
 * échéance convenue (RELANCES.relanceAmiable) : le 28 avril. Le président décide ce jour-là.
 */
export const JOUR_DU_SCENARIO = plusDeJours(factureDe("février").echeance, RELANCES.relanceAmiable);

/**
 * LE SOLDE DU 30 AVRIL (hypothèse du scénario) : le compte courant de NOVA, le 30 avril au soir, tel que le
 * président le prévoit. La gamme de janvier a absorbé la réserve ; la TVA d'avril, payée en mai, est déjà
 * mise de côté et n'y est pas comptée.
 */
export const SOLDE_DU_30_AVRIL = 50_000;

/**
 * LES VENTES EN LIGNE DE N+1 (hypothèse du scénario) : avril et mai N+1 vendent aux particuliers autant
 * qu'avril et mai N (exercice-de-nova.ts, VENTES_AUX_PARTICULIERS).
 */
export const VENTES_EN_LIGNE = { avril: VENTES_AUX_PARTICULIERS[3]!, mai: VENTES_AUX_PARTICULIERS[4]! } as const;

/**
 * LES REMISES DE CARTES DE MAI (hypothèse du scénario) : une par semaine, aux jours dits, chacune le quart
 * du mois. Elles sont comptées hors taxes (la TVA qu'elles encaissent est mise de côté pour l'État) et
 * nettes des autres coûts des enceintes du mois, emballage, transport et énergie, payés dans le mois :
 * ceux des enceintes en ligne, de CampusTech et d'Ondes.
 */
export const JOURS_DES_REMISES = [7, 14, 21, 28] as const;

/**
 * CAMPUSTECH RELANCÉE (hypothèse du scénario) : relancée à l'amiable le 28 avril, CampusTech avance le
 * virement de la facture de février au 5 mai, le jour de ses règlements fournisseurs. Son acheteur, qui
 * n'avait jamais été relancé, le fait savoir : la relation se tend.
 */
export const JOUR_DE_LA_RELANCE_PAYEE = 5;

/**
 * L'ESCOMPTE PROPOSÉ À CAMPUSTECH (hypothèse du scénario) : NOVA offre sur la facture de mars, pas encore
 * échue, l'escompte de règlement de ses conditions (celui de Sonora, 2 % du net commercial hors taxes,
 * la TVA baissant d'autant) pour un paiement immédiat. CampusTech accepte et vire le 1er mai.
 */
export const ESCOMPTE_DE_REGLEMENT = { taux: SONORA.escompte, jour: 1 } as const;

/**
 * ÉLECTRO-COMPOSANTS (hypothèses du scénario) : demandé avant l'échéance, un étalement est accepté, la
 * moitié le 1er mai et l'autre le 1er juin (51 jours après la facture, dans le délai légal), contre un
 * intérêt au taux de ses pénalités sur la moitié reportée ; il le note. Payé sans prévenir le 11 mai,
 * le lendemain du virement de CampusTech, il applique ses conditions : les pénalités de retard et
 * l'indemnité de recouvrement, et il ne livre plus qu'au comptant.
 */
export const ELECTRO_COMPOSANTS_EN_MAI = { reportAu: { jour: 1, mois: 6, exercice: 1 } as DateDuCompte, jourDuRetard: 11 } as const;

/** La facture d'avril d'Électro-Composants : le 10 avril, le jour où il facture. */
export const FACTURE_D_AVRIL: DateDuCompte = { jour: ELECTRO_COMPOSANTS.jourDeFacturation, mois: 4, exercice: 1 };

/** Les jours entre la facture d'avril et le report de sa moitié : sous le délai maximal convenu. */
export const joursDuReport = () => rang(ELECTRO_COMPOSANTS_EN_MAI.reportAu) - rang(FACTURE_D_AVRIL);

/** Le jour où la banque met un financement à disposition : le 1er mai, demandé le 28 avril. */
export const JOUR_DU_FINANCEMENT = 1;

/**
 * LES FRAIS D'UN PRÉLÈVEMENT REJETÉ (hypothèse du scénario, décision du propriétaire, novembre 2026) :
 * 30 € par rejet, au tarif de la banque (pour un professionnel, chaque banque fixe le sien, sans plafond
 * légal).
 */
export const FRAIS_DE_REJET = 30;

// ─────────────────────────────────────────────────────────────────────────────
// 2. LES MONTANTS DU MOIS
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRO = OFFRES_DE_COMPOSANTS.find((o) => o.code === OFFRE_HABITUELLE)!;

/** Les montants de mai, tous lus ou calculés dans le monde du cours (calculés une fois : la clôture de N est longue). */
export function montantsDeMai() {
  return (montants ??= calculerLesMontants());
}
let montants: ReturnType<typeof calculerLesMontants> | undefined;

function calculerLesMontants() {
  const paie = bulletinDePaie(PAIE_DU_MOIS.brut, TAUX_DE_LA_PAIE);
  // Les jeux d'avril : les enceintes en ligne, celles de CampusTech et celles de Vibra (le 10 avril).
  const jeuxDAvril = VENTES_EN_LIGNE.avril + VENTES_A_CAMPUSTECH[0]! + VIBRA.enceintes;
  const composantsHt = auCentime(jeuxDAvril * ELECTRO.prixHT);
  const composants = auCentime(composantsHt * (1 + TAUX_DE_TVA));
  // Les autres coûts des enceintes de mai : en ligne, CampusTech, Ondes.
  const enceintesDeMai = VENTES_EN_LIGNE.mai + VENTES_A_CAMPUSTECH[0]! + CHAINE_ONDES.enceintes;
  const remisesDuMois = auCentime(VENTES_EN_LIGNE.mai * PRIX_DE_L_ENCEINTE - enceintesDeMai * AUTRES_COUTS_PAR_ENCEINTE);
  const remise = auCentime(remisesDuMois / JOURS_DES_REMISES.length);
  const impot = auCentime(cloture(EXERCICE_DE_NOVA).impot.impot - IMPOT_SUR_LES_SOCIETES.acomptesVerses);
  const escompteHt = auCentime(FACTURE_DE_CAMPUSTECH.ht * ESCOMPTE_DE_REGLEMENT.taux);
  const escompteTtc = auCentime(escompteHt * (1 + TAUX_DE_TVA));
  return {
    facture: FACTURE_DE_CAMPUSTECH.ttc,
    soldeDeJanvier: auCentime(FACTURE_DE_CAMPUSTECH.ttc - REGLEMENT_PARTIEL.montant),
    factor: bordereauDuFactor().verseAuJournal,
    jeuxDAvril,
    composantsHt,
    composants,
    enceintesDeMai,
    remisesDuMois,
    remise,
    loyer: LOYER_DU_MOIS.montant,
    cotisations: paie.aVerser.total,
    salaires: paie.netAPayer,
    impot,
    condamnation: SUITES_EN_N_PLUS_1.litige.condamnation,
    escompte: { ht: escompteHt, ttc: escompteTtc, net: auCentime(FACTURE_DE_CAMPUSTECH.ttc - escompteTtc) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LES CHOIX ET LE PLAN DE MAI
// ─────────────────────────────────────────────────────────────────────────────

export const CHOIX_DU_CLIENT = ["attendre", "relancer", "escompter"] as const;
export const CHOIX_DU_FOURNISSEUR = ["payer", "etaler", "retarder"] as const;
export const CHOIX_DE_LA_BANQUE = ["decouvert", "credit", "dailly"] as const;
export type ChoixDuClient = (typeof CHOIX_DU_CLIENT)[number];
export type ChoixDuFournisseur = (typeof CHOIX_DU_FOURNISSEUR)[number];
export type ChoixDeLaBanque = (typeof CHOIX_DE_LA_BANQUE)[number];

/** Les choix possibles de chaque décision, dans l'ordre du scénario : le client, le fournisseur, la banque. */
export const CHOIX_DES_DECISIONS: readonly (readonly string[])[] = [CHOIX_DU_CLIENT, CHOIX_DU_FOURNISSEUR, CHOIX_DE_LA_BANQUE];

/** Une suite de choix, complète ou non. */
export interface SuiteDeChoix {
  client?: ChoixDuClient;
  fournisseur?: ChoixDuFournisseur;
  banque?: ChoixDeLaBanque;
}
export type SuiteComplete = Required<SuiteDeChoix>;

/** Une suite lue d'une liste de codes, dans l'ordre des décisions : null si un code n'existe pas. */
export function suiteDesCodes(codes: readonly string[]): SuiteDeChoix | null {
  if (codes.length > CHOIX_DES_DECISIONS.length) return null;
  if (codes.some((c, i) => !CHOIX_DES_DECISIONS[i]!.includes(c))) return null;
  const [client, fournisseur, banque] = codes as [ChoixDuClient?, ChoixDuFournisseur?, ChoixDeLaBanque?];
  return { ...(client ? { client } : {}), ...(fournisseur ? { fournisseur } : {}), ...(banque ? { banque } : {}) };
}

/** Un mouvement du compte courant en mai : son jour, son libellé, son montant (crédit positif, débit négatif). */
export interface Mouvement {
  code: string;
  jour: number;
  libelle: string;
  montant: number;
  /** Le mouvement dit dans une phrase (« le prélèvement du loyer »). */
  nom: string;
}

/** La facture de CampusTech que la banque prendrait en Dailly : celle de mars, ou celle d'avril si mars est déjà payée. */
export const factureCedee = (s: SuiteDeChoix) => factureDe(s.client === "escompter" ? "avril" : "mars");

/** Les jours entre le financement et le paiement réel de la facture cédée, que la banque compte. */
export const joursDuDailly = (s: SuiteDeChoix) => rang(factureCedee(s).paiement) - rang(mai(JOUR_DU_FINANCEMENT));

/** Les mouvements de mai que les choix du client et du fournisseur décident, sans financement. */
function mouvementsSansFinancement(s: SuiteDeChoix): Mouvement[] {
  const m = montantsDeMai();
  const fev = factureDe("février");
  const out: Mouvement[] = [];
  const ajouter = (code: string, jour: number, libelle: string, montant: number, nom = libelle.toLowerCase()) => out.push({ code, jour, libelle, montant: auCentime(montant), nom });
  // Le fournisseur, le 1er mai.
  const electro = "le paiement d'Électro-Composants";
  if (s.fournisseur === "etaler") ajouter("composants", 1, "Électro-Composants, la moitié de la facture d'avril", -m.composants / 2, electro);
  else if (s.fournisseur === "retarder") ajouter("composants", ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard, "Électro-Composants, la facture d'avril, en retard", -m.composants, electro);
  else ajouter("composants", 1, "Électro-Composants, la facture d'avril", -m.composants, electro);
  // Le client.
  if (s.client === "escompter") ajouter("mars", ESCOMPTE_DE_REGLEMENT.jour, "CampusTech, la facture de mars, escompte déduit", m.escompte.net);
  ajouter("fevrier", s.client === "relancer" ? JOUR_DE_LA_RELANCE_PAYEE : fev.paiement.jour, "CampusTech, la facture de février", m.facture);
  // Le reste du mois, que les choix ne changent pas.
  ajouter("loyer", LOYER_DU_MOIS.jour, "Loyer du local, prélevé", -m.loyer, "le prélèvement du loyer");
  ajouter("solde-de-janvier", REGLEMENT_PARTIEL.solde.jour, "CampusTech, le solde de la facture de janvier", m.soldeDeJanvier);
  ajouter("factor", 15, "Le factor, la première facture d'Ondes", m.factor);
  ajouter("cotisations", PAIE_DU_MOIS.jourDesCotisations, "Cotisations et impôt retenu de la paie d'avril", -m.cotisations, "le paiement des cotisations");
  ajouter("impot", 15, "Solde de l'impôt sur les sociétés de N", -m.impot, "le solde de l'impôt");
  ajouter("condamnation", SUITES_EN_N_PLUS_1.litige.date.jour, "Condamnation du litige", -m.condamnation, "le paiement de la condamnation");
  ajouter("salaires", PAIE_DU_MOIS.jourDuVirement, "Salaires nets de mai", -m.salaires, "le virement des salaires");
  for (const j of JOURS_DES_REMISES) ajouter(`remise-${j}`, j, "Remise de cartes des ventes en ligne", m.remise);
  return out.sort((a, b) => a.jour - b.jour);
}

/** Un jour de mai, à la clôture : le solde du compte. */
export interface JourDuCompte {
  jour: number;
  solde: number;
}

/** Un paiement que la banque rejette, puis qui repasse dès que le solde le permet. */
export interface Rejet {
  code: string;
  libelle: string;
  nom: string;
  montant: number;
  jourPrevu: number;
  /** Le jour où il repasse ; null s'il ne repasse pas en mai. */
  jourPasse: number | null;
}

/**
 * LE COMPTE, JOUR PAR JOUR. Chaque jour, les crédits d'abord, puis les débits rejetés qui attendent,
 * puis ceux du jour ; un débit qui porterait le solde sous −plafond est rejeté. Les agios se comptent
 * par les nombres : la somme des soldes débiteurs de fin de journée, × taux ÷ 360.
 */
export function deroulerLeMois(mouvements: readonly Mouvement[], depart: number = SOLDE_DU_30_AVRIL, plafond: number = CONDITIONS_DE_LA_BANQUE.decouvert.autorise) {
  let solde = depart;
  const jours: JourDuCompte[] = [];
  const rejets: Rejet[] = [];
  let enAttente: Mouvement[] = [];
  const passer = (x: Mouvement) => {
    if (x.montant < 0 && solde + x.montant < -plafond - 1e-9) return false;
    solde = auCentime(solde + x.montant);
    return true;
  };
  for (let j = 1; j <= JOURS_DE_MAI; j++) {
    const duJour = mouvements.filter((x) => x.jour === j);
    for (const x of duJour.filter((x) => x.montant >= 0)) passer(x);
    enAttente = enAttente.filter((x) => {
      if (!passer(x)) return true;
      rejets.find((r) => r.code === x.code)!.jourPasse = j;
      return false;
    });
    for (const x of duJour.filter((x) => x.montant < 0)) {
      if (passer(x)) continue;
      rejets.push({ code: x.code, libelle: x.libelle, nom: x.nom, montant: x.montant, jourPrevu: j, jourPasse: null });
      enAttente.push(x);
    }
    jours.push({ jour: j, solde });
  }
  const plusBas = jours.reduce((a, b) => (b.solde < a.solde ? b : a));
  const nombres = somme(jours.map((x) => Math.max(0, -x.solde)));
  return {
    jours,
    rejets,
    plusBas,
    joursSousZero: jours.filter((x) => x.solde < 0).length,
    fin: solde,
    nombres,
    agios: auCentime((nombres * CONDITIONS_DE_LA_BANQUE.decouvert.tauxAnnuel) / JOURS_DE_LA_BANQUE),
  };
}

/** Le plan de mai, sans limite de découvert : ce que le président lit, avant la banque. */
export const planSansLimite = (s: SuiteDeChoix) => deroulerLeMois(mouvementsSansFinancement(s), SOLDE_DU_30_AVRIL, Number.POSITIVE_INFINITY);

/** Le crédit de trésorerie d'un mois qui ramène le plus bas du plan au matelas du président (0 s'il n'y descend pas). */
export function creditDeMai(s: SuiteDeChoix) {
  const manque = auCentime(matelasDe(NOVA_GESTION) - planSansLimite(s).plusBas.solde);
  if (manque <= 0) return { montant: 0, interets: 0, frais: 0, cout: 0 };
  return creditDUnMois(manque);
}

/** La cession Dailly de la facture que CampusTech n'a pas encore payée, jusqu'à son paiement réel. */
export const daillyDeMai = (s: SuiteDeChoix) => dailly(factureCedee(s).ttc, joursDuDailly(s));

/** Les mouvements de mai, financement compris. */
export function mouvementsDeMai(s: SuiteDeChoix): Mouvement[] {
  const out = mouvementsSansFinancement(s);
  if (s.banque === "credit") {
    const c = creditDeMai(s);
    if (c.montant > 0) out.unshift({ code: "credit", jour: JOUR_DU_FINANCEMENT, libelle: "Crédit de trésorerie d'un mois, frais déduits", montant: auCentime(c.montant - c.frais), nom: "le crédit" });
  } else if (s.banque === "dailly") {
    out.unshift({ code: "dailly", jour: JOUR_DU_FINANCEMENT, libelle: `Cession Dailly de la facture de ${factureCedee(s).reference}`, montant: daillyDeMai(s).net, nom: "la cession Dailly" });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CE QU'UNE SUITE DONNE
// ─────────────────────────────────────────────────────────────────────────────

export type EtatDeLaRelation = "bonne" | "tendue" | "abimee";

/** Les pénalités de retard d'un paiement de `montant` TTC, `jours` après l'échéance : le taux annuel ÷ 365, et l'indemnité. */
export const penalites = (montant: number, jours: number) => ({
  penalites: auCentime((montant * TAUX_DES_PENALITES * jours) / JOURS_DE_L_ANNEE_CIVILE),
  indemnite: jours > 0 ? INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT : 0,
});

/** Les coûts du mois que les choix du client et du fournisseur décident, avant la banque. */
function coutsAvantLaBanque(s: SuiteDeChoix) {
  const m = montantsDeMai();
  const escompte = s.client === "escompter" ? m.escompte.ttc : 0;
  const joursReportes = rang(ELECTRO_COMPOSANTS_EN_MAI.reportAu) - rang(mai(1));
  const etalement = s.fournisseur === "etaler" ? penalites(m.composants / 2, joursReportes).penalites : 0;
  const retard = s.fournisseur === "retarder" ? penalites(m.composants, ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard - 1) : { penalites: 0, indemnite: 0 };
  return { escompte, etalement, retard: auCentime(retard.penalites + retard.indemnite), detailDuRetard: retard, joursReportes };
}

/** Le résultat d'une suite complète : le compte de mai, ce qu'il coûte, ce qu'il laisse à juin, les relations. */
export function resultatDeLaSuite(s: SuiteComplete) {
  const m = montantsDeMai();
  const compte = deroulerLeMois(mouvementsDeMai(s));
  const avant = coutsAvantLaBanque(s);
  const credit = s.banque === "credit" ? creditDeMai(s) : { montant: 0, interets: 0, frais: 0, cout: 0 };
  const cession = s.banque === "dailly" ? daillyDeMai(s) : null;
  const fraisDeRejet = auCentime(compte.rejets.length * FRAIS_DE_REJET);
  const couts = {
    escompte: avant.escompte,
    etalement: avant.etalement,
    retard: avant.retard,
    agios: compte.agios,
    credit: credit.cout,
    dailly: cession ? cession.cout : 0,
    rejets: fraisDeRejet,
  };
  const cout = somme(Object.values(couts));
  // Ce que mai laisse à juin : ce qu'il faut rendre ou payer, et ce qui ne rentrera plus.
  const aRendre = {
    credit: auCentime(credit.montant + credit.interets),
    fournisseur: s.fournisseur === "etaler" ? auCentime(m.composants / 2 + avant.etalement) : 0,
    penalites: avant.retard,
    // Les agios et les frais de rejet de mai, prélevés début juin.
    agios: compte.agios,
    rejets: fraisDeRejet,
    factureCedee: cession ? cession.nominal : 0,
    factureEscomptee: s.client === "escompter" ? m.facture : 0,
  };
  const dus = somme(Object.values(aRendre));
  const relations: Record<"client" | "fournisseur" | "banque", EtatDeLaRelation> = {
    client: s.client === "relancer" ? "tendue" : "bonne",
    fournisseur: s.fournisseur === "retarder" ? "abimee" : s.fournisseur === "etaler" ? "tendue" : "bonne",
    banque: compte.rejets.length > 0 ? "abimee" : "bonne",
  };
  const fin: CodeDeFin = compte.rejets.length > 0 ? "rejet" : relations.fournisseur === "abimee" ? "retard" : "tenu";
  return {
    suite: s,
    compte,
    couts,
    cout,
    credit,
    cession,
    aRendre,
    dus,
    /** La trésorerie de fin de mai, une fois rendu ce que le mois emprunte et compté ce qui ne rentrera plus. */
    tresorerieNette: auCentime(compte.fin - dus),
    relations,
    tendues: Object.values(relations).filter((x) => x === "tendue").length,
    abimees: Object.values(relations).filter((x) => x === "abimee").length,
    fin,
  };
}
export type ResultatDeLaSuite = ReturnType<typeof resultatDeLaSuite>;

/** Les trois fins du scénario : un paiement rejeté, un fournisseur payé en retard, un mois tenu. */
export type CodeDeFin = "rejet" | "retard" | "tenu";

/** Les 27 suites, dans l'ordre des choix. */
export function toutesLesSuites(): SuiteComplete[] {
  return CHOIX_DU_CLIENT.flatMap((client) => CHOIX_DU_FOURNISSEUR.flatMap((fournisseur) => CHOIX_DE_LA_BANQUE.map((banque) => ({ client, fournisseur, banque }))));
}

/**
 * LA MEILLEURE SUITE, et la règle qui la désigne : d'abord aucun paiement rejeté et aucune relation abîmée
 * (un rejet ou un retard sans prévenir ne se rattrape pas d'un geste) ; puis le coût du mois le plus bas ;
 * à coût égal, le moins de relations tendues.
 */
export function meilleureSuite(): ResultatDeLaSuite {
  return (meilleure ??= chercherLaMeilleure());
}
let meilleure: ResultatDeLaSuite | undefined;

function chercherLaMeilleure(): ResultatDeLaSuite {
  const admises = toutesLesSuites()
    .map(resultatDeLaSuite)
    .filter((r) => r.abimees === 0);
  return admises.reduce((a, b) => (b.cout < a.cout - 1e-9 || (Math.abs(b.cout - a.cout) < 1e-9 && b.tendues < a.tendues) ? b : a));
}

/** Le jour de mai écrit : « 1er mai », « 31 mai » pour le dernier jour du mois. */
export const jourDeMai = (jour: number) => (jour === JOURS_DE_MAI ? "31 mai" : dateEcrite(mai(jour)));

/** Les conditions de la banque que le scénario montre : découvert, crédit, Dailly, matelas. */
export const CONDITIONS_DU_SCENARIO = {
  decouvert: CONDITIONS_DE_LA_BANQUE.decouvert,
  credit: CONDITIONS_DE_LA_BANQUE.credit,
  dailly: CONDITIONS_DU_DAILLY,
  matelas: matelasDe(NOVA_GESTION),
} as const;
