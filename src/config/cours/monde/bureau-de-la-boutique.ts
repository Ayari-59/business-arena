import { indicateursDuMois } from "./boutique";
import { dateEcrite, type DateDuCalendrier } from "./comptes-de-la-boutique";
import { CONDITIONS_DE_LA_BANQUE, REMISE_DE_CARTES, echeancier, facturesDeFevrier, rapprochementDeFevrier, salairesNets } from "./fournisseurs-et-banque-de-la-boutique";
import type { FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE BUREAU DE LA BOUTIQUE EN MARS N, LE RAPPROCHEMENT BANCAIRE DU MOIS (BTS CG P1,
 * 1.6.3 ; décision du propriétaire, novembre 2026 : le format « bureau »).
 *
 * L'élève arrive à son poste de comptable chez MAILLE & CO, début avril, et trouve la pile de mars : le
 * relevé de la banque, l'extrait du compte 512, des talons de chèques, un avis de prélèvement, une lettre,
 * le relevé du compte d'épargne, et le courriel de la gérante. Il contrôle, pointe, rapproche, régularise,
 * puis répond. Le bureau (config/cours/bureaux/rapprochement-de-mars.ts) lit tout ici.
 *
 * CE QUI VIENT DES MODULES DE JANVIER ET FÉVRIER, ET NE S'ÉCRIT DONC PAS ICI :
 *   · le départ du mois : le rapprochement du 28 février (fournisseurs-et-banque-de-la-boutique.ts,
 *     `rapprochementDeFevrier`, celui du cas « Le chèque qui n'est pas passé ») : le compte 512, ses deux
 *     écritures passées, porte le solde rectifié ; le relevé porte son propre solde ; le chèque de
 *     l'entretien de février, émis le 26, attend d'être présenté ;
 *   · l'échéance du 1er mars du façonnier (la facture du mérinos moins son avoir) et celle du 7 mars de
 *     l'atelier local (ses 100 bonnets), à l'échéancier du chapitre ;
 *   · la remise des cartes d'une semaine (18 400 €), le net des salaires (le brut de l'équipe moins 22 %),
 *     les conditions de la banque (la tenue de compte, 15 € HT, et sa TVA de 20 %) ;
 *   · le loyer, la publicité et l'entretien du mois (la fiche, monde/maille-et-co.ts), le taux de TVA ;
 *   · les huit commandes des comités d'entreprise de janvier, facturées à 45 jours (boutique.ts).
 *
 * CE QUI EST CHOISI (hypothèses du bureau, chacune dite à sa place et à l'élève) : les numéros des chèques,
 * le jour de chaque opération, la TVA de février, l'erreur de saisie du chèque de l'atelier, le comité qui
 * règle en mars, l'annuaire résilié qui prélève encore, l'avis de la régie resté dans la pile.
 *
 * LES POINTS À TROUVER (cinq, et le chèque de février qui se pointe avec l'état de février) :
 *   1. un chèque émis non débité : l'entretien de mars ;
 *   2. des frais bancaires non saisis : la tenue de compte de mars ;
 *   3. un virement reçu non saisi : le comité, dont l'avis n'est pas arrivé ;
 *   4. une erreur de saisie : le chèque de l'atelier, saisi avec deux chiffres inversés ;
 *   5. un prélèvement inattendu, À SIGNALER ET NON À SAISIR : l'annuaire résilié ;
 *   et l'avis de prélèvement de la régie, arrivé mais resté dans la pile : un prélèvement à saisir.
 *
 * CONVENTIONS : celles du chapitre (une année N non bissextile, tout toutes taxes comprises à la banque).
 * Le compte reste créditeur en valeur tout le mois : pas d'intérêts débiteurs (la garde le vérifie).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const tva = (f: FicheDeLaBoutique) => f.gamme[0]!.tauxTva;
const mars = (jour: number): DateDuCalendrier => ({ jour, mois: 3 });

// ─────────────────────────────────────────────────────────────────────────────
// 1. LES HYPOTHÈSES DU MOIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CHÉQUIER (hypothèse du bureau) : les chèques de la boutique se suivent ; celui de l'entretien de
 * février, émis le 26 février, porte le numéro 0004126 ; mars en émet deux.
 */
export const CHEQUES = { entretienDeFevrier: "0004126", atelierLocal: "0004127", entretienDeMars: "0004128" } as const;

/** LE VIREMENT DU FAÇONNIER (hypothèse du bureau) : la boutique règle l'échéance du 1er mars le jour même, par virement. */
export const JOUR_DU_FACONNIER = 1;

/** LE CHÈQUE DE FÉVRIER (hypothèse du bureau) : l'entreprise d'entretien l'a remis ; la banque le débite le 3 mars. */
export const JOUR_DU_CHEQUE_DE_FEVRIER = 3;

/**
 * LE LOYER (hypothèse du bureau) : un virement permanent le 2 de chaque mois, du montant de la fiche (le
 * loyer et ses frais) ; le bailleur n'a pas opté pour la TVA, le loyer n'en porte pas.
 */
export const JOUR_DU_LOYER = 2;

/** LES REMISES DE CARTES (hypothèse du bureau) : une par semaine, aux jours dits, chacune celle d'une semaine de janvier. */
export const JOURS_DES_REMISES = [6, 13, 20, 27] as const;

/**
 * LE RÈGLEMENT DE L'ATELIER LOCAL (hypothèse du bureau) : le chèque des 100 bonnets part le 7 mars, jour de
 * l'échéance ; l'atelier le remet, la banque le débite le 12. La boutique l'a saisi au compte 512 avec deux
 * chiffres inversés, les dizaines et les unités des euros (comme les salaires de janvier au chapitre).
 */
export const CHEQUE_DE_L_ATELIER = { jourDEmission: 7, jourDuDebit: 12 } as const;

/**
 * LE COMITÉ QUI RÈGLE (hypothèse du bureau) : le 14 mars, un comité d'entreprise vire le règlement de sa
 * commande de janvier, une commande moyenne des huit (le chiffre d'affaires des commandes, toutes taxes
 * comprises, divisé par leur nombre). L'avis de virement n'est pas arrivé : la boutique ne l'a pas saisi.
 */
export const JOUR_DU_COMITE = 14;

/**
 * L'ANNUAIRE RÉSILIÉ (hypothèse du bureau) : la boutique était abonnée à un annuaire professionnel en ligne,
 * 59,90 € par mois ; la gérante a résilié l'abonnement et révoqué le mandat de prélèvement par lettre
 * recommandée du 20 janvier, avec effet au 31 janvier. Le 15 mars, l'annuaire prélève encore.
 * Un prélèvement sans mandat valide est une opération non autorisée : la boutique la conteste auprès de sa
 * banque, qui la rembourse ; elle ne la saisit pas en charge, elle la signale.
 */
// À VÉRIFIER : le délai de contestation d'un prélèvement non autorisé (13 mois, code monétaire et financier, L133-24).
export const ANNUAIRE_RESILIE = {
  abonnement: 59.9,
  jourDuPrelevement: 15,
  resiliation: { jour: 20, mois: 1 } as DateDuCalendrier,
  /** L'avis de réception de la lettre recommandée. */
  recueLe: { jour: 22, mois: 1 } as DateDuCalendrier,
  /** La date d'effet de la résiliation. */
  effet: { jour: 31, mois: 1 } as DateDuCalendrier,
} as const;

/** LA TVA DE FÉVRIER (hypothèse du bureau) : la déclaration de février, prélevée le 21 mars. */
export const TVA_DE_FEVRIER = { montant: 14_600, jour: 21 } as const;

/**
 * LA PUBLICITÉ DE MARS (hypothèse du bureau, la leçon de février) : la régie envoie désormais un avis
 * avant chaque prélèvement ; celui de mars annonce le montant de la fiche, toutes taxes comprises, le 25.
 * L'avis est arrivé le 18 ; il est resté dans la pile, la boutique ne l'a pas saisi.
 */
export const PUBLICITE_DE_MARS = { jour: 25, avisRecuLe: 18 } as const;

/** L'ENTRETIEN DE MARS (hypothèse du bureau) : le chèque part le 27 mars ; l'entreprise ne l'a pas encore remis. */
export const JOUR_DE_L_ENTRETIEN = 27;

/** LES SALAIRES DE MARS (hypothèse du bureau) : le net de l'équipe, viré le 28, comme en janvier. */
export const JOUR_DES_SALAIRES = 28;

/** L'ARRÊTÉ DE MARS : la tenue de compte se prend le dernier jour du mois. */
export const ARRETE_DE_MARS = 31;

/** LE JOUR DU BUREAU (hypothèse du bureau) : le relevé de mars arrive, la gérante écrit, l'élève s'installe. */
export const JOUR_DU_BUREAU: DateDuCalendrier = { jour: 2, mois: 4 };

/** LE COMPTE D'ÉPARGNE (hypothèse du bureau) : il n'a pas bougé depuis février ; il porte 60 000 €. */
export const SOLDE_DE_L_EPARGNE = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// 2. LES OPÉRATIONS DU MOIS, DES DEUX CÔTÉS
// ─────────────────────────────────────────────────────────────────────────────

/** Deux chiffres inversés : les dizaines et les unités des euros (1 390,80 € devient 1 309,80 €). */
export function chiffresInverses(x: number) {
  const entier = Math.trunc(x);
  const unites = entier % 10;
  const dizaines = Math.trunc(entier / 10) % 10;
  return auCentime(x - unites - dizaines * 10 + unites * 10 + dizaines);
}

/** Où une opération se trouve, et ce que le pointage en dit. */
export type PointDuMois =
  /** Des deux côtés, pour le même montant. */
  | "pointee"
  /** Des deux côtés, pour deux montants : une erreur de saisie. */
  | "ecart"
  /** Au relevé seulement, mais en suspens à l'état de février : elle se pointe avec lui. */
  | "fevrier"
  /** Au relevé seulement : la banque la connaît, pas la boutique. */
  | "banque"
  /** Au compte 512 seulement : la boutique la connaît, pas encore la banque. */
  | "boutique";

/** Une opération de mars, à la banque et au compte (débit négatif, crédit positif ; null : absente de ce côté). */
export interface OperationDeMars {
  code: string;
  libelle: string;
  releve: { jour: number; montant: number } | null;
  compte: { jour: number; montant: number } | null;
  point: PointDuMois;
}

/** Les montants du mois, chacun lu de sa source. */
export function montantsDeMars(f: FicheDeLaBoutique) {
  const ech = echeancier(f);
  const faconnier = auCentime(somme(ech.lignes.filter((l) => l.echeance.mois === 3 && l.echeance.jour === JOUR_DU_FACONNIER).map((l) => l.montant)));
  const atelier = facturesDeFevrier(f).find((x) => x.fournisseur === "atelier-local")!;
  const commandes = indicateursDuMois(f).commandes;
  const comite = auCentime((commandes.chiffreDAffaires * (1 + tva(f))) / commandes.nombre);
  const publicite = { ht: f.charges.publicite, tva: auCentime(f.charges.publicite * tva(f)), ttc: auCentime(f.charges.publicite * (1 + tva(f))) };
  const frais = { ht: CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt, tva: auCentime(CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt * CONDITIONS_DE_LA_BANQUE.tvaDesFrais) };
  return {
    faconnier,
    chequeDeFevrier: rapprochementDeFevrier(f).cheque,
    loyer: f.charges.loyer,
    remise: REMISE_DE_CARTES,
    atelier: atelier.ttc,
    atelierSaisi: chiffresInverses(atelier.ttc),
    factureDeLAtelier: atelier,
    comite,
    tva: TVA_DE_FEVRIER.montant,
    publicite,
    entretien: auCentime(f.charges.entretien * (1 + tva(f))),
    salaires: salairesNets(f),
    frais: { ...frais, ttc: auCentime(frais.ht + frais.tva) },
    annuaire: ANNUAIRE_RESILIE.abonnement,
  };
}

/** Les opérations de mars, dans l'ordre du mois. */
export function operationsDeMars(f: FicheDeLaBoutique): readonly OperationDeMars[] {
  const m = montantsDeMars(f);
  const deux = (code: string, libelle: string, jour: number, montant: number): OperationDeMars => ({ code, libelle, releve: { jour, montant }, compte: { jour, montant }, point: "pointee" });
  return [
    deux("faconnier", "Virement au façonnier, échéance du 1er mars", JOUR_DU_FACONNIER, -m.faconnier),
    deux("loyer", "Virement permanent du loyer de mars", JOUR_DU_LOYER, -m.loyer),
    { code: "cheque-fevrier", libelle: `Chèque n° ${CHEQUES.entretienDeFevrier}, l'entretien de février`, releve: { jour: JOUR_DU_CHEQUE_DE_FEVRIER, montant: -m.chequeDeFevrier }, compte: null, point: "fevrier" },
    ...JOURS_DES_REMISES.slice(0, 2).map((j, i) => deux(`cartes-${i + 1}`, `Remise des cartes du ${j} mars`, j, m.remise)),
    {
      code: "atelier",
      libelle: `Chèque n° ${CHEQUES.atelierLocal}, l'atelier local`,
      releve: { jour: CHEQUE_DE_L_ATELIER.jourDuDebit, montant: -m.atelier },
      compte: { jour: CHEQUE_DE_L_ATELIER.jourDEmission, montant: -m.atelierSaisi },
      point: "ecart",
    },
    { code: "comite", libelle: "Virement reçu d'un comité d'entreprise", releve: { jour: JOUR_DU_COMITE, montant: m.comite }, compte: null, point: "banque" },
    { code: "annuaire", libelle: "Prélèvement de l'annuaire professionnel", releve: { jour: ANNUAIRE_RESILIE.jourDuPrelevement, montant: -m.annuaire }, compte: null, point: "banque" },
    ...JOURS_DES_REMISES.slice(2).map((j, i) => deux(`cartes-${i + 3}`, `Remise des cartes du ${j} mars`, j, m.remise)),
    deux("tva", "Prélèvement de la TVA de février", TVA_DE_FEVRIER.jour, -m.tva),
    { code: "publicite", libelle: "Prélèvement de la régie, publicité de mars", releve: { jour: PUBLICITE_DE_MARS.jour, montant: -m.publicite.ttc }, compte: null, point: "banque" },
    { code: "entretien", libelle: `Chèque n° ${CHEQUES.entretienDeMars}, l'entretien de mars`, releve: null, compte: { jour: JOUR_DE_L_ENTRETIEN, montant: -m.entretien }, point: "boutique" },
    deux("salaires", "Virement des salaires nets de mars", JOUR_DES_SALAIRES, -m.salaires),
    { code: "frais", libelle: "Tenue de compte de mars et sa TVA", releve: { jour: ARRETE_DE_MARS, montant: -m.frais.ttc }, compte: null, point: "banque" },
  ];
}

/** Une ligne d'un document de banque : sa date, son libellé, son montant (débit négatif). */
export interface LigneDeBanque {
  code: string;
  date: string;
  libelle: string;
  montant: number;
}

/** Les lignes d'un côté, rangées par jour, et ses soldes. */
function cote(f: FicheDeLaBoutique, de: "releve" | "compte", depart: number) {
  const lignes: (LigneDeBanque & { jour: number })[] = operationsDeMars(f)
    .flatMap((o) => (o[de] ? [{ code: o.code, jour: o[de]!.jour, date: dateEcrite(mars(o[de]!.jour)), libelle: o.libelle, montant: o[de]!.montant }] : []))
    .sort((a, b) => a.jour - b.jour);
  let solde = depart;
  let plusBas = depart;
  for (const l of lignes) {
    solde = auCentime(solde + l.montant);
    plusBas = Math.min(plusBas, solde);
  }
  return { depart, lignes, fin: solde, plusBas };
}

/** Le relevé de mars : le solde du 28 février, les opérations au jour de la banque, le solde du 31 mars. */
export const releveDeMars = (f: FicheDeLaBoutique) => cote(f, "releve", rapprochementDeFevrier(f).releve);

/** L'extrait du compte 512 de mars : le solde du 1er mars (le compte rectifié de février), les écritures du mois. */
export const compteDeMars = (f: FicheDeLaBoutique) => cote(f, "compte", rapprochementDeFevrier(f).compteRectifie);

// ─────────────────────────────────────────────────────────────────────────────
// 3. L'ÉTAT DE RAPPROCHEMENT ET LES ÉCRITURES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ÉTAT DE RAPPROCHEMENT AU 31 MARS. Côté compte, ce que seule la banque connaît (le virement du comité, le
 * prélèvement de la régie, la tenue de compte) et l'erreur de saisie ; côté banque, ce qu'elle ne connaît pas
 * encore (le chèque de l'entretien de mars) et le prélèvement contesté, qu'elle doit rembourser. Le chèque
 * de février, débité le 3 mars, se pointe avec l'état de février : il n'entre pas dans celui de mars. Aucune
 * remise de la boutique n'attend d'être créditée : la ligne vaut zéro, elle se remplit quand même.
 */
export function rapprochementDeMars(f: FicheDeLaBoutique) {
  const m = montantsDeMars(f);
  const releve = releveDeMars(f).fin;
  const compte = compteDeMars(f).fin;
  const erreur = auCentime(m.atelier - m.atelierSaisi);
  const auCompte = { virements: m.comite, prelevements: -m.publicite.ttc, frais: -m.frais.ttc, erreur: -erreur };
  const aLaBanque = { remises: 0, cheques: -m.entretien, contestes: m.annuaire };
  const compteRectifie = auCentime(compte + somme(Object.values(auCompte)));
  const releveRectifie = auCentime(releve + somme(Object.values(aLaBanque)));
  return { releve, compte, erreur, auCompte, aLaBanque, compteRectifie, releveRectifie };
}

/**
 * LES ÉCRITURES DE RÉGULARISATION DE MARS : quatre, toutes au compte 512, aucune pour le prélèvement contesté
 * (signalé, non saisi) ni pour le chèque non débité (déjà au compte). Leurs montants seuls ; les comptes et
 * les rôles sont dans le bureau.
 */
export function regularisationsDeMars(f: FicheDeLaBoutique) {
  const m = montantsDeMars(f);
  const r = rapprochementDeMars(f);
  return { comite: m.comite, publicite: m.publicite, frais: m.frais, erreur: r.erreur };
}
