import { BANQUE_DE_LA_BOUTIQUE, FIN_D_ANNEE, JOURS_DE_LA_BANQUE, bilanDeLaBoutique, compteDeResultat, dateEcrite, plusDeJours, type DateDuCalendrier } from "./comptes-de-la-boutique";
import type { CodeDeFournisseur, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LES FOURNISSEURS ET LA BANQUE DE MAILLE & CO EN JANVIER ET FÉVRIER N (BTS CG P1,
 * 1.5.3, 1.5.5, 1.6.1, 1.6.2 et 1.6.3).
 *
 * Le chapitre « Fournisseurs et banque : échéancier, pointage et rapprochement » et son cas le lisent.
 *
 * CE QUI VIENT DE LA FICHE (monde/maille-et-co.ts) ET DES COMPTES DE LA BOUTIQUE (comptes-de-la-boutique.ts),
 * ET NE S'ÉCRIT DONC PAS ICI :
 *   · les trois façonniers, leurs prix rapportés au référent et leurs délais de paiement (45 jours, comptant,
 *     30 jours) ;
 *   · les livraisons du façonnier de référence reçues en janvier, référence par référence, et leur coût
 *     d'achat : ce sont ses quatre factures de janvier ;
 *   · le relevé annuel des achats de N − 1 (les achats du compte de résultat de N − 1) et la dette
 *     fournisseurs du 31 décembre N − 1 (48 000 € TTC, au bilan de N − 1) ;
 *   · la TVA de décembre à reverser (18 000 €), le salaire brut de l'équipe et le taux des cotisations
 *     salariales (22 %), le prix de l'entretien (920 € HT par mois), le taux du découvert (7,5 %), l'année
 *     de la banque (360 jours) et le calendrier de l'année N.
 *
 * CE QUI EST CHOISI (hypothèses du chapitre, dites à l'élève) : le façonnier facture à la livraison ; la
 * facture des cardigans saisie deux fois ; le rabais pour la livraison en retard du mérinos ; deux achats de
 * février aux autres façonniers ; le compte d'épargne de la boutique ; la semaine de banque du 20 au
 * 31 janvier, ses dates de valeur et ses frais ; l'erreur de saisie.
 *
 * CONVENTIONS : les dates suivent le calendrier de l'année N (non bissextile) ; les factures et la banque
 * sont toutes taxes comprises ; les intérêts de la banque se comptent sur 360 jours.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const tva = (f: FicheDeLaBoutique) => f.gamme[0]!.tauxTva;

// ─────────────────────────────────────────────────────────────────────────────
// 1. LES FACTURES DES FAÇONNIERS ET L'ÉCHÉANCIER
// ─────────────────────────────────────────────────────────────────────────────

/** Une facture d'un façonnier : sa pièce, sa date, son échéance, ses montants. */
export interface FactureDeFaconnier {
  code: string;
  fournisseur: CodeDeFournisseur;
  libelle: string;
  date: DateDuCalendrier;
  echeance: DateDuCalendrier;
  ht: number;
  tva: number;
  ttc: number;
}

/** Le délai de paiement d'un façonnier de la fiche. */
const delaiDe = (f: FicheDeLaBoutique, code: CodeDeFournisseur) => f.fournisseurs.find((x) => x.code === code)!.delaiDePaiement;
const prixChez = (f: FicheDeLaBoutique, code: CodeDeFournisseur, ref: CodeDeReference) => auCentime(f.gamme.find((r) => r.code === ref)!.coutDAchat * f.fournisseurs.find((x) => x.code === code)!.multiplicateur);

/** Le nom d'une référence au pluriel, dans le libellé d'une facture. */
const PLURIELS: Readonly<Record<CodeDeReference, string>> = { "col-rond": "pulls col rond", cardigan: "cardigans", merinos: "pulls mérinos", echarpe: "écharpes", bonnet: "bonnets" };

function factureDe(f: FicheDeLaBoutique, code: string, fournisseur: CodeDeFournisseur, ref: CodeDeReference, quantite: number, date: DateDuCalendrier): FactureDeFaconnier {
  const ht = auCentime(quantite * prixChez(f, fournisseur, ref));
  const t = auCentime(ht * tva(f));
  return { code, fournisseur, libelle: `${quantite} ${PLURIELS[ref]}`, date, echeance: plusDeJours(date, delaiDe(f, fournisseur)), ht, tva: t, ttc: auCentime(ht + t) };
}

/**
 * LES FACTURES DE JANVIER DU FAÇONNIER DE RÉFÉRENCE (la fiche) : HYPOTHÈSE DU CHAPITRE, il facture le jour
 * de la livraison. Une facture par livraison de janvier, au coût d'achat de la gamme, payable à 45 jours.
 */
export function facturesDeJanvier(f: FicheDeLaBoutique): readonly FactureDeFaconnier[] {
  return f.gamme
    .flatMap((r) => r.livraisons.map((l) => ({ r, l })))
    .sort((a, b) => a.l.jour - b.l.jour)
    .map(({ r, l }) => factureDe(f, `F-${r.code}`, "faconnier", r.code, l.quantite, { jour: l.jour, mois: 1 }));
}

/**
 * LES ACHATS DE FÉVRIER AUX DEUX AUTRES FAÇONNIERS (hypothèses du chapitre) : le 5 février, 100 bonnets à
 * l'atelier local (son minimum est de 50, il livre en 10 jours), payables à 30 jours ; le 12 février,
 * 300 écharpes en fins de série (son minimum), payées comptant, par virement le jour de la commande.
 */
export const ACHATS_DE_FEVRIER = [
  { code: "A-bonnet", fournisseur: "atelier-local" as CodeDeFournisseur, reference: "bonnet" as CodeDeReference, quantite: 100, date: { jour: 5, mois: 2 } },
  { code: "S-echarpe", fournisseur: "fins-de-serie" as CodeDeFournisseur, reference: "echarpe" as CodeDeReference, quantite: 300, date: { jour: 12, mois: 2 } },
] as const;

export const facturesDeFevrier = (f: FicheDeLaBoutique) => ACHATS_DE_FEVRIER.map((a) => factureDe(f, a.code, a.fournisseur, a.reference, a.quantite, a.date));

/**
 * LE RABAIS DU MÉRINOS (hypothèse du chapitre) : le mérinos devait arriver le 8 janvier, il est arrivé le 15.
 * Le façonnier accorde 5 % de rabais sur la facture et envoie un avoir le 30 janvier. La boutique ne l'a
 * pas reçu : il manque à son compte.
 */
export const RABAIS_DU_MERINOS = { reference: "merinos" as CodeDeReference, taux: 0.05, date: { jour: 30, mois: 1 } as DateDuCalendrier };

export function avoirDuMerinos(f: FicheDeLaBoutique) {
  const fm = facturesDeJanvier(f).find((x) => x.code === `F-${RABAIS_DU_MERINOS.reference}`)!;
  const ht = auCentime(fm.ht * RABAIS_DU_MERINOS.taux);
  const t = auCentime(ht * tva(f));
  return { facture: fm, ht, tva: t, ttc: auCentime(ht + t), date: RABAIS_DU_MERINOS.date };
}

/**
 * LA FACTURE EN DOUBLE (hypothèse du chapitre) : la facture des cardigans du 12 janvier est arrivée par
 * courriel puis par courrier ; la boutique l'a saisie deux fois.
 */
export const FACTURE_EN_DOUBLE = "F-cardigan";

/** Une ligne de pointage : la pièce, son montant au crédit (facture) ou au débit (avoir), et où elle se trouve. */
export interface LigneDePointage {
  libelle: string;
  montant: number;
  ou: "deux" | "boutique" | "faconnier";
}

/**
 * LE POINTAGE DU COMPTE 401 FAÇONNIER (les pièces de janvier) AVEC LE RELEVÉ DU FAÇONNIER AU 31 JANVIER :
 * chaque facture se pointe des deux côtés ; la facture en double n'est que chez la boutique, l'avoir que
 * chez le façonnier. Les soldes sont créditeurs (ce que la boutique doit).
 */
export function pointageDuFaconnier(f: FicheDeLaBoutique) {
  const fj = facturesDeJanvier(f);
  const av = avoirDuMerinos(f);
  const double = fj.find((x) => x.code === FACTURE_EN_DOUBLE)!;
  const lignes: LigneDePointage[] = [
    ...fj.map((x) => ({ libelle: `Facture du ${dateEcrite(x.date)}, ${x.libelle}`, montant: x.ttc, ou: "deux" as const })),
    { libelle: `Facture du ${dateEcrite(double.date)}, ${double.libelle}, saisie une seconde fois`, montant: double.ttc, ou: "boutique" },
    { libelle: `Avoir du ${dateEcrite(av.date)}, rabais sur le mérinos`, montant: -av.ttc, ou: "faconnier" },
  ];
  const chezLaBoutique = auCentime(somme(lignes.filter((l) => l.ou !== "faconnier").map((l) => l.montant)));
  const chezLeFaconnier = auCentime(somme(lignes.filter((l) => l.ou !== "boutique").map((l) => l.montant)));
  return { lignes, double, avoir: av, chezLaBoutique, chezLeFaconnier, ecart: auCentime(chezLaBoutique - chezLeFaconnier) };
}

/** Le mois d'une échéance, pour l'échéancier : février (2) ou mars (3). */
export interface LigneDEcheancier {
  libelle: string;
  echeance: DateDuCalendrier;
  montant: number;
}

/**
 * L'ÉCHÉANCIER DES FOURNISSEURS AU 15 FÉVRIER, une fois le compte pointé et corrigé : les factures non
 * réglées, par date d'échéance (l'avoir vient en moins de la facture du mérinos, qu'il réduit). Les fins
 * de série, payées comptant le 12, n'y sont plus.
 */
export function echeancier(f: FicheDeLaBoutique) {
  const av = avoirDuMerinos(f);
  const lignes: LigneDEcheancier[] = [
    ...facturesDeJanvier(f).map((x) => ({ libelle: `Façonnier, facture du ${dateEcrite(x.date)} (${x.libelle})`, echeance: x.echeance, montant: x.ttc })),
    { libelle: `Façonnier, avoir du ${dateEcrite(av.date)}`, echeance: av.facture.echeance, montant: -av.ttc },
    ...facturesDeFevrier(f)
      .filter((x) => x.fournisseur !== "fins-de-serie")
      .map((x) => ({ libelle: `Atelier local, facture du ${dateEcrite(x.date)} (${x.libelle})`, echeance: x.echeance, montant: x.ttc })),
  ].sort((a, b) => a.echeance.mois * 100 + a.echeance.jour - (b.echeance.mois * 100 + b.echeance.jour));
  const duMois = (m: number) => auCentime(somme(lignes.filter((l) => l.echeance.mois === m).map((l) => l.montant)));
  return { lignes, fevrier: duMois(2), mars: duMois(3), total: auCentime(somme(lignes.map((l) => l.montant))) };
}

/**
 * LE DÉLAI MOYEN DE CRÉDIT FOURNISSEURS DE N − 1, tiré du relevé annuel des achats : dettes fournisseurs du
 * 31 décembre ÷ achats de l'année toutes taxes comprises × 360. Le relevé donne les achats hors taxes du
 * compte de résultat de N − 1 ; tous viennent du façonnier de référence, payé à 45 jours.
 */
export function delaiMoyenFournisseurs(f: FicheDeLaBoutique) {
  const achatsHt = compteDeResultat(f, "N-1").achats;
  const achatsTtc = auCentime(achatsHt * (1 + tva(f)));
  const dettes = bilanDeLaBoutique(f).dettesFournisseurs;
  const delai = Math.round((dettes / achatsTtc) * JOURS_DE_LA_BANQUE * 100) / 100;
  // Les achats de la fin d'année, au rythme qui fait la dette du 31 décembre (comptes-de-la-boutique.ts).
  const rythmeDeFinDAnnee = auCentime((FIN_D_ANNEE.achatsDuCreditFournisseurHt * (1 + tva(f))) / delaiDe(f, "faconnier"));
  const rythmeMoyen = auCentime(achatsTtc / JOURS_DE_LA_BANQUE);
  return { achatsHt, achatsTtc, dettes, delai, contractuel: delaiDe(f, "faconnier"), rythmeDeFinDAnnee, rythmeMoyen };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA BANQUE : LE RELEVÉ, LES DATES DE VALEUR, L'ÉCHELLE D'INTÉRÊTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE COMPTE D'ÉPARGNE (hypothèse du chapitre) : le 2 janvier, en attendant l'assemblée des associés, la
 * boutique a mis l'essentiel de ses disponibilités du 31 décembre sur un compte d'épargne de sa banque,
 * disponible le jour même ; le compte courant ne garde que ce que le mois demande. LE 20 JANVIER, le compte
 * courant et le relevé, pointés, portent 6 000 €.
 */
export const SOLDE_DU_20_JANVIER = 6_000;

/**
 * LES CONDITIONS DE LA BANQUE (hypothèses du chapitre, conditions d'une banque de centre-ville en 2026) :
 * un crédit porte valeur le lendemain de l'opération (J + 1, jours calendaires), un débit le jour même ;
 * le découvert coûte le taux de la banque de la boutique (comptes-de-la-boutique.ts) sur les soldes
 * débiteurs en valeur, prélevé à l'arrêté du 31 janvier ; la tenue de compte coûte 15 € HT par mois, avec
 * une TVA de 20 % (la banque a opté pour la TVA sur ses commissions de service).
 */
// À VÉRIFIER : la TVA sur les frais de tenue de compte d'un professionnel (option de la banque).
export const CONDITIONS_DE_LA_BANQUE = { valeurDesCredits: 1, valeurDesDebits: 0, tauxDuDecouvert: BANQUE_DE_LA_BOUTIQUE.decouvert.taux, tenueDeCompteHt: 15, tvaDesFrais: 0.2 } as const;

/** L'arrêté des intérêts : le 31 janvier. */
export const ARRETE: DateDuCalendrier = { jour: 31, mois: 1 };

/** Le net des salaires de janvier : le brut de l'équipe moins les cotisations salariales (22 %, celles du cas figé). */
export const salairesNets = (f: FicheDeLaBoutique) => auCentime(somme(f.equipe.map((s) => s.brutMensuel)) * (1 - FIN_D_ANNEE.tauxDesCotisationsSalariales));

/** Une opération de la semaine : son jour, son libellé, son montant (crédit positif), où elle est passée. */
export interface OperationDeBanque {
  code: string;
  jour: number;
  libelle: string;
  montant: number;
  /** Au relevé, au compte 512 de la boutique, ou des deux côtés. */
  ou: "deux" | "releve" | "compte";
}

/**
 * LA SEMAINE DE BANQUE DU 20 AU 31 JANVIER (hypothèses du chapitre, sauf la TVA de décembre et les salaires,
 * qui viennent des comptes) : la TVA de décembre prélevée le 21 ; les cartes de la semaine remises le 23 et
 * le 29 ; les salaires nets virés le 28 ; le chèque de l'entretien de janvier émis le 27, pas encore
 * présenté ; le virement d'un comité d'entreprise pour une commande de Noël, reçu le 30, dont l'avis n'est
 * pas arrivé.
 */
export const REMISE_DE_CARTES = 18_400;
export const VIREMENT_DU_COMITE = 4_800;
export const JOUR_DU_CHEQUE = 27;

export function operationsDeLaSemaine(f: FicheDeLaBoutique): readonly OperationDeBanque[] {
  const entretienTtc = auCentime(f.charges.entretien * (1 + tva(f)));
  return [
    { code: "tva", jour: 21, libelle: "Prélèvement de la TVA de décembre", montant: -FIN_D_ANNEE.tvaADecaisser, ou: "deux" },
    { code: "cartes-1", jour: 23, libelle: "Remise des cartes de la semaine", montant: REMISE_DE_CARTES, ou: "deux" },
    { code: "cheque", jour: JOUR_DU_CHEQUE, libelle: "Chèque à l'entreprise d'entretien", montant: -entretienTtc, ou: "compte" },
    { code: "salaires", jour: 28, libelle: "Virement des salaires nets de janvier", montant: -salairesNets(f), ou: "deux" },
    { code: "cartes-2", jour: 29, libelle: "Remise des cartes de la semaine", montant: REMISE_DE_CARTES, ou: "deux" },
    { code: "comite", jour: 30, libelle: "Virement d'un comité d'entreprise, commande de Noël", montant: VIREMENT_DU_COMITE, ou: "releve" },
  ];
}

/** La date de valeur d'une opération : le lendemain pour un crédit, le jour même pour un débit. */
export const jourDeValeur = (o: Pick<OperationDeBanque, "jour" | "montant">) => o.jour + (o.montant > 0 ? CONDITIONS_DE_LA_BANQUE.valeurDesCredits : CONDITIONS_DE_LA_BANQUE.valeurDesDebits);

/** Un virement du compte d'épargne au compte courant : son montant et son jour (valeur le jour même, un virement interne). */
export interface VirementDEpargne {
  montant: number;
  jour: number;
}

/**
 * L'ÉCHELLE D'INTÉRÊTS DU 20 AU 31 JANVIER (la méthode hambourgeoise) : les opérations du relevé rangées par
 * date de valeur ; chaque solde en valeur tient jusqu'à la date de valeur suivante (l'arrêté du 31 compris
 * comme borne) ; nombres débiteurs = solde débiteur × jours ; intérêts = somme des nombres × taux ÷ 360.
 * Un virement d'épargne, s'il y en a un, porte valeur le jour même.
 */
export function echelleDInterets(f: FicheDeLaBoutique, virement: VirementDEpargne = { montant: 0, jour: 20 }) {
  const ops = operationsDeLaSemaine(f)
    .filter((o) => o.ou !== "compte")
    .map((o) => ({ valeur: jourDeValeur(o), montant: o.montant }));
  if (virement.montant > 0) ops.push({ valeur: virement.jour, montant: virement.montant });
  const parValeur = new Map<number, number>();
  for (const o of ops) if (o.valeur < ARRETE.jour) parValeur.set(o.valeur, auCentime((parValeur.get(o.valeur) ?? 0) + o.montant));
  const dates = [20, ...[...parValeur.keys()].filter((j) => j > 20)].sort((a, b) => a - b);
  let solde = SOLDE_DU_20_JANVIER + (parValeur.get(20) ?? 0);
  const periodes = dates.map((j, i) => {
    if (i > 0) solde = auCentime(solde + (parValeur.get(j) ?? 0));
    const fin = dates[i + 1] ?? ARRETE.jour;
    const jours = fin - j;
    return { du: j, au: fin - 1, solde, jours, nombresDebiteurs: solde < 0 ? auCentime(-solde * jours) : 0 };
  });
  const nombres = auCentime(somme(periodes.map((p) => p.nombresDebiteurs)));
  const interets = auCentime((nombres * CONDITIONS_DE_LA_BANQUE.tauxDuDecouvert) / JOURS_DE_LA_BANQUE);
  return { periodes, nombres, interets, joursDebiteurs: somme(periodes.filter((p) => p.solde < 0).map((p) => p.jours)), plusFortDecouvert: Math.max(0, ...periodes.map((p) => -p.solde)) };
}

/** Les frais de l'arrêté du 31 janvier : les intérêts débiteurs, la tenue de compte et sa TVA. */
export function fraisDeLArrete(f: FicheDeLaBoutique) {
  const e = echelleDInterets(f);
  const tvaDesFrais = auCentime(CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt * CONDITIONS_DE_LA_BANQUE.tvaDesFrais);
  return { interets: e.interets, tenueDeCompte: CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt, tva: tvaDesFrais, total: auCentime(e.interets + CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt + tvaDesFrais) };
}

/**
 * L'ERREUR DE SAISIE (hypothèse du chapitre) : le virement des salaires nets a été saisi au compte 512 avec
 * deux chiffres inversés, les dizaines et les unités (7 887 € au lieu de 7 878 €).
 */
export function salairesSaisis(f: FicheDeLaBoutique) {
  const n = salairesNets(f);
  const entier = Math.trunc(n);
  const unites = entier % 10;
  const dizaines = Math.trunc(entier / 10) % 10;
  return auCentime(n - unites - dizaines * 10 + unites * 10 + dizaines);
}

/**
 * LE RELEVÉ ET LE COMPTE 512 AU 31 JANVIER, ET L'ÉTAT DE RAPPROCHEMENT.
 *   · Le relevé : le solde du 20, les opérations des deux côtés, le virement du comité, les frais de l'arrêté.
 *   · Le compte 512 : le solde du 20, les opérations des deux côtés (les salaires pour leur montant saisi),
 *     le chèque.
 *   · Côté compte, il manque ce que seule la banque connaît (le virement du comité, les frais) et l'erreur ;
 *     côté banque, ce qu'elle ne connaît pas encore (le chèque non présenté). Les deux soldes rectifiés sont
 *     égaux.
 */
export function rapprochement(f: FicheDeLaBoutique) {
  const ops = operationsDeLaSemaine(f);
  const frais = fraisDeLArrete(f);
  const n = salairesNets(f);
  const saisis = salairesSaisis(f);
  const cheque = -ops.find((o) => o.code === "cheque")!.montant;
  const releve = auCentime(SOLDE_DU_20_JANVIER + somme(ops.filter((o) => o.ou !== "compte").map((o) => o.montant)) - frais.total);
  const compte = auCentime(SOLDE_DU_20_JANVIER + somme(ops.filter((o) => o.ou !== "releve").map((o) => (o.code === "salaires" ? -saisis : o.montant))));
  const erreur = auCentime(saisis - n);
  const compteRectifie = auCentime(compte + VIREMENT_DU_COMITE - frais.total + erreur);
  const releveRectifie = auCentime(releve - cheque);
  return { releve, compte, cheque, frais, erreur, salaires: n, saisis, compteRectifie, releveRectifie };
}

/**
 * LE VIREMENT D'ÉPARGNE QUI ÉVITE LE DÉCOUVERT (le laboratoire) : le plus petit, par crans de 1 000 €, et le
 * plus tard possible, qui laisse le compte créditeur en valeur chaque jour de la semaine.
 */
export const PAS_DU_VIREMENT = 1_000;
export function virementQuiEviteLeDecouvert(f: FicheDeLaBoutique) {
  const base = echelleDInterets(f);
  const montant = Math.ceil(base.plusFortDecouvert / PAS_DU_VIREMENT - 1e-9) * PAS_DU_VIREMENT;
  // Le jour : la première date de valeur débitrice.
  const jour = base.periodes.find((p) => p.solde < 0)!.du;
  return { montant, jour };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LA FIN DE FÉVRIER : LE RAPPROCHEMENT DU 28 FÉVRIER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA FIN DE FÉVRIER (hypothèses du cas « Le chèque qui n'est pas passé », qui les dit à l'élève ; elles
 * vivent ici pour que le mois suivant, au bureau de la boutique, parte du même solde) : au 28 février, le
 * compte 512 porte 21 400 € ; le chèque de l'entretien de février (le prix de la fiche, 920 € HT), émis le
 * 26, n'est pas présenté ; la régie a prélevé la publicité du mois (le montant de la fiche, 1 500 € HT) le
 * 25, sans avis ; la banque a pris la tenue de compte. Le compte n'a jamais été débiteur en valeur : pas
 * d'intérêts.
 */
export const FIN_DE_FEVRIER = { compte: 21_400, jourDuCheque: 26, jourDeLaPublicite: 25 } as const;

/** Le rapprochement du 28 février : le relevé, le compte, et les deux soldes rectifiés, égaux. */
export function rapprochementDeFevrier(f: FicheDeLaBoutique) {
  const cheque = auCentime(f.charges.entretien * (1 + tva(f)));
  const publicite = { ht: f.charges.publicite, tva: auCentime(f.charges.publicite * tva(f)), ttc: auCentime(f.charges.publicite * (1 + tva(f))) };
  const frais = { ht: CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt, tva: auCentime(CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt * CONDITIONS_DE_LA_BANQUE.tvaDesFrais) };
  const fraisTtc = auCentime(frais.ht + frais.tva);
  const compte = FIN_DE_FEVRIER.compte;
  const releve = auCentime(compte + cheque - publicite.ttc - fraisTtc);
  return { cheque, publicite, frais, fraisTtc, compte, releve, compteRectifie: auCentime(compte - publicite.ttc - fraisTtc), releveRectifie: auCentime(releve - cheque) };
}
