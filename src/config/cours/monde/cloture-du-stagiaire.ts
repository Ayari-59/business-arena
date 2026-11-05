import { auCentime, type DateDuCours } from "./amortissement";
import {
  chargeConstateeDAvance,
  cloture,
  impotSurLesSocietes,
  leviersDeLaFiche,
  passer,
  resultatDesSoldes,
  travauxDInventaire,
  type CodeDeTravail,
  type LigneDEcriture,
  type Travail,
} from "./cloture";
import type { FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LA CLÔTURE DE NOVA, PRÉPARÉE PAR UN STAGIAIRE (le format « enquête », décision du
 * propriétaire, novembre 2026).
 *
 * Au 31 décembre N, un stagiaire a préparé les écritures d'inventaire du premier exercice de NOVA ;
 * certaines sont fausses. L'élève reçoit le dossier, trouve les erreurs, dit pourquoi, et les rectifie.
 * L'enquête (config/cours/enquetes/la-cloture-du-stagiaire.ts) lit tout ici.
 *
 * LES BONS CHIFFRES NE S'ÉCRIVENT PAS ICI : ce sont ceux de la clôture du cours (monde/cloture.ts,
 * `cloture(fiche)`, les leviers de la fiche), travail par travail. Les chiffres du stagiaire sortent du
 * même modèle, lu de travers : chaque erreur est une lecture fausse de la fiche, que le modèle calcule.
 *
 * LE DOSSIER DU STAGIAIRE : neuf travaux sur les dix de la clôture. Les intérêts courus du compte à
 * terme sont passés à part, sur l'avis de la banque, et justes (hypothèse de l'enquête) : ils entrent
 * dans le résultat que le stagiaire annonce, pas dans ce qu'il faut contrôler.
 *
 * LES SIX ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LE PRORATA OUBLIÉ : la dotation de la ligne compte une année pleine, comme si la ligne était en
 *      service le 1er janvier, et non le 6 ;
 *   2. LE MAUVAIS COMPTE : la facture non parvenue est créditée au 401, la dette d'un fournisseur qui a
 *      facturé, au lieu du 408 (sans effet sur le résultat : une erreur qui ne se voit pas au résultat) ;
 *   3. LA MAUVAISE BASE : la créance de Sonora est dépréciée sur son toutes taxes comprises, au lieu de
 *      son hors taxes (la TVA d'une créance perdue se récupère, elle ne se perd pas) ;
 *   4. LE MAUVAIS MONTANT : la provision pour litige retient ce que le client demande, et non ce que
 *      l'avocat juge probable ;
 *   5. LA MAUVAISE PÉRIODE : la charge constatée d'avance retient la part de la prime qui couvre N, et
 *      non celle qui couvre N+1 ;
 *   6. LE SENS INVERSÉ : le produit constaté d'avance débite le 487 et crédite le 701.
 * Trois écritures sont justes : le stock final, la facture à établir, les intérêts courus de l'emprunt.
 */

/** Les travaux du dossier du stagiaire, dans l'ordre où il les a passés. */
export const DOSSIER_DU_STAGIAIRE: readonly CodeDeTravail[] = [
  "dotation",
  "stock",
  "factureNonParvenue",
  "creanceDouteuse",
  "provision",
  "chargeConstateeDAvance",
  "factureAEtablir",
  "produitConstateDAvance",
  "interetsCourus",
];

/** Le travail passé à part, juste, sur l'avis de la banque : il n'est pas au dossier. */
export const PASSE_A_PART: CodeDeTravail = "interetsDuPlacement";

/** La nature d'une erreur du stagiaire. */
export type NatureDeLErreur = "prorata" | "compte" | "base" | "estimation" | "periode" | "sens";

/** Les erreurs du stagiaire, par travail : les autres travaux du dossier sont justes. */
export const ERREURS_DU_STAGIAIRE: Readonly<Partial<Record<CodeDeTravail, NatureDeLErreur>>> = {
  dotation: "prorata",
  factureNonParvenue: "compte",
  creanceDouteuse: "base",
  provision: "estimation",
  chargeConstateeDAvance: "periode",
  produitConstateDAvance: "sens",
};

/** Le premier jour de l'exercice : la date de mise en service que le stagiaire a lue. */
const PREMIER_JOUR: DateDuCours = { jour: 1, mois: 1 };

/** Le même travail, ses montants remplacés : une écriture de deux lignes au même montant. */
const auMontant = (lignes: readonly LigneDEcriture[], montant: number): LigneDEcriture[] =>
  lignes.map((l) => ({ compte: l.compte, debit: l.debit ? montant : 0, credit: l.credit ? montant : 0 }));

/** Le travail d'une clôture, par son code. */
const travailDe = (travaux: readonly Travail[], code: CodeDeTravail) => travaux.find((t) => t.code === code)!;

/** Une écriture du dossier : le travail juste, celui du stagiaire, et l'erreur s'il y en a une. */
export interface EcritureDuDossier {
  code: CodeDeTravail;
  juste: Travail;
  /** L'écriture que le stagiaire a passée. */
  stagiaire: { montant: number; lignes: LigneDEcriture[]; effetSurLeResultat: number };
  erreur: NatureDeLErreur | null;
}

/** Les écritures du stagiaire, une par travail du dossier, chacune face au travail juste. */
export function dossierDuStagiaire(f: FicheDeLExercice): EcritureDuDossier[] {
  const l = leviersDeLaFiche(f);
  const justes = travauxDInventaire(f, l);
  const effet = (lignes: readonly LigneDEcriture[]) => resultatDesSoldes(passer({}, lignes));
  const deTravers: Partial<Record<CodeDeTravail, () => { montant: number; lignes: LigneDEcriture[] }>> = {
    // La ligne lue en service au 1er janvier : une année pleine de dotation.
    dotation: () => {
      const t = travailDe(travauxDInventaire({ ...f, immobilisation: { ...f.immobilisation, miseEnService: PREMIER_JOUR } }, l), "dotation");
      return { montant: t.montant, lignes: t.lignes };
    },
    // La facture non parvenue à la dette d'un fournisseur qui a facturé.
    factureNonParvenue: () => {
      const t = travailDe(justes, "factureNonParvenue");
      return { montant: t.montant, lignes: t.lignes.map((x) => (x.compte === "408" ? { ...x, compte: "401" } : x)) };
    },
    // La créance dépréciée sur son toutes taxes comprises : le modèle lu sans TVA.
    creanceDouteuse: () => {
      const t = travailDe(travauxDInventaire({ ...f, tauxDeTva: 0 }, l), "creanceDouteuse");
      return { montant: t.montant, lignes: t.lignes };
    },
    // La provision au montant que le client demande.
    provision: () => {
      const t = travailDe(travauxDInventaire(f, { ...l, provisionPourLitige: f.litige.demande }), "provision");
      return { montant: t.montant, lignes: t.lignes };
    },
    // La part de la prime qui couvre l'exercice, prise pour celle qui couvre N+1.
    chargeConstateeDAvance: () => {
      const part = chargeConstateeDAvance(f.assurance.prime, f.assurance.date, f.assurance.moisCouverts, f.cloture).chargeDeLExercice;
      return { montant: part, lignes: auMontant(travailDe(justes, "chargeConstateeDAvance").lignes, part) };
    },
    // Le débit et le crédit échangés.
    produitConstateDAvance: () => {
      const t = travailDe(justes, "produitConstateDAvance");
      return { montant: t.montant, lignes: t.lignes.map((x) => ({ compte: x.compte, debit: x.credit, credit: x.debit })) };
    },
  };
  return DOSSIER_DU_STAGIAIRE.map((code) => {
    const juste = travailDe(justes, code);
    const fausse = deTravers[code]?.();
    const stagiaire = fausse ?? { montant: juste.montant, lignes: juste.lignes };
    return { code, juste, stagiaire: { ...stagiaire, effetSurLeResultat: effet(stagiaire.lignes) }, erreur: ERREURS_DU_STAGIAIRE[code] ?? null };
  });
}

/**
 * LE RÉSULTAT AVANT IMPÔT, CELUI DU STAGIAIRE ET LE JUSTE. Le stagiaire passe ses neuf écritures et les
 * intérêts du placement sur la balance avant inventaire ; le juste est celui de la clôture du cours.
 * L'écart est la somme, écriture par écriture, de ce que chaque erreur change au résultat.
 */
export function resultatDuStagiaire(f: FicheDeLExercice) {
  const k = cloture(f);
  const dossier = dossierDuStagiaire(f);
  const aPart = travailDe(k.travaux, PASSE_A_PART);
  const soldes = [...dossier.map((d) => d.stagiaire.lignes), aPart.lignes].reduce<Record<string, number>>((s, lignes) => passer(s, lignes), { ...k.soldesAvantInventaire });
  const annonce = resultatDesSoldes(soldes);
  const ecarts = dossier.filter((d) => d.erreur).map((d) => ({ code: d.code, ecart: auCentime(d.juste.effetSurLeResultat - d.stagiaire.effetSurLeResultat) }));
  const correction = auCentime(k.resultatAvantImpot - annonce);
  const impotAnnonce = impotSurLesSocietes(annonce, { ...f.impot, eligibleAuTauxReduit: k.leviers.eligibleAuTauxReduit }).impot;
  return {
    resultatAvantInventaire: k.resultatAvantInventaire,
    /** Les intérêts du placement, passés à part. */
    aPart,
    annonce,
    ecarts,
    correction,
    corrige: k.resultatAvantImpot,
    impotAnnonce,
    impotCorrige: k.impot.impot,
  };
}
