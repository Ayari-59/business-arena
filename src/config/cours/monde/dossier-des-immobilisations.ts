import { auCentime } from "./amortissement";
import { CHARIOT, DATES_DE_LA_SUBVENTION, GRANDE_REVISION, CABINE, cabine, chariot, creditBailDuBanc, provisionPourGrosEntretien, subvention } from "./acquisition-et-financement";
import { TAUX_DE_TVA } from "./nova-gestion";

/**
 * LE MONDE DE L'ENQUÊTE « LE DOSSIER DES IMMOBILISATIONS » (la suite du chapitre « Acquérir et financer
 * une immobilisation », chez NOVA en N+1).
 *
 * Début janvier N+2, l'alternant de NOVA a passé les huit écritures des immobilisations de N+1. LES BONS
 * CHIFFRES NE S'ÉCRIVENT PAS ICI : ce sont ceux du monde du chapitre (acquisition-et-financement.ts),
 * opération par opération. Les chiffres de l'alternant sortent des mêmes données, lues de travers.
 *
 * LES CINQ ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LA TVA À TORT : l'acompte du chariot est lu comme un montant toutes taxes comprises, et une TVA
 *      en est tirée ; un acompte sur une livraison de biens n'en porte pas ;
 *   2. LE MODE : la cabine est amortie en linéaire, au prorata de ses jours de N+1, et non selon ses
 *      heures d'essai, le mode que NOVA a retenu ;
 *   3. L'ÉTALEMENT OUBLIÉ : la subvention est virée en entier au résultat de N+1, et non au rythme de
 *      l'amortissement des équipements qu'elle finance ;
 *   4. LE COMPTE : la TVA de la redevance du crédit-bail est portée au 44562, la TVA sur immobilisations,
 *      au lieu du 44566, celle d'un service (sans effet sur le résultat) ;
 *   5. LA BASE : la provision pour gros entretien est calculée sur le devis toutes taxes comprises.
 * Trois écritures sont justes : la production immobilisée de la cabine, l'octroi et le versement de la
 * subvention. La garde tests/cours/enquete-le-dossier-des-immobilisations.test.ts refait chaque chiffre.
 */

/** Une ligne d'écriture : le compte, son débit ou son crédit. */
export interface LigneDuDossier {
  compte: string;
  debit: number;
  credit: number;
}

export type NatureDeLErreurDuDossier = "tva-a-tort" | "mode" | "etalement" | "compte" | "base";

export type CodeDuDossier = "acompte" | "production" | "dotation" | "octroi" | "versement" | "quote-part" | "redevance" | "provision";

export interface EcritureDuDossier {
  code: CodeDuDossier;
  date: string;
  juste: readonly LigneDuDossier[];
  alternant: readonly LigneDuDossier[];
  erreur: NatureDeLErreurDuDossier | null;
}

const D = (compte: string, montant: number): LigneDuDossier => ({ compte, debit: montant, credit: 0 });
const C = (compte: string, montant: number): LigneDuDossier => ({ compte, debit: 0, credit: montant });

/** Le dossier de l'alternant, dans l'ordre où il l'a passé : l'écriture juste et la sienne. */
export function dossierDesImmobilisations(): EcritureDuDossier[] {
  const k = chariot();
  const acompteHt = auCentime(k.acompte / (1 + TAUX_DE_TVA));
  const c = cabine();
  const s = subvention();
  const b = creditBailDuBanc();
  const provision = provisionPourGrosEntretien();
  const provisionTtc = auCentime((GRANDE_REVISION.devis * (1 + TAUX_DE_TVA)) / GRANDE_REVISION.exercices);
  const fin = "31 décembre N+1";
  const ecritures: EcritureDuDossier[] = [
    {
      code: "acompte",
      date: CHARIOT.commande.replace("N + 1", "N+1"),
      juste: [D("238", k.acompte), C("512", k.acompte)],
      alternant: [D("238", acompteHt), D("44562", auCentime(k.acompte - acompteHt)), C("512", k.acompte)],
      erreur: "tva-a-tort",
    },
    { code: "production", date: CABINE.miseEnService.replace("N + 1", "N+1"), juste: [D("2181", c.cout), C("722", c.cout)], alternant: [D("2181", c.cout), C("722", c.cout)], erreur: null },
    { code: "dotation", date: fin, juste: [D("6811", c.dotationEnUnites), C("28181", c.dotationEnUnites)], alternant: [D("6811", c.dotationLineaire), C("28181", c.dotationLineaire)], erreur: "mode" },
    { code: "octroi", date: DATES_DE_LA_SUBVENTION.octroi.replace("N + 1", "N+1"), juste: [D("441", s.montant), C("131", s.montant)], alternant: [D("441", s.montant), C("131", s.montant)], erreur: null },
    { code: "versement", date: DATES_DE_LA_SUBVENTION.versement.replace("N + 1", "N+1"), juste: [D("512", s.montant), C("441", s.montant)], alternant: [D("512", s.montant), C("441", s.montant)], erreur: null },
    { code: "quote-part", date: fin, juste: [D("139", s.quotePart), C("777", s.quotePart)], alternant: [D("139", s.montant), C("777", s.montant)], erreur: "etalement" },
    { code: "redevance", date: fin, juste: [D("6122", b.redevance), D("44566", b.tva), C("512", b.ttc)], alternant: [D("6122", b.redevance), D("44562", b.tva), C("512", b.ttc)], erreur: "compte" },
    { code: "provision", date: fin, juste: [D("6815", provision), C("1572", provision)], alternant: [D("6815", provisionTtc), C("1572", provisionTtc)], erreur: "base" },
  ];
  return ecritures;
}

/** Ce qu'une écriture fait au résultat : les produits (classe 7) moins les charges (classe 6). */
export function effetSurLeResultat(lignes: readonly LigneDuDossier[]) {
  return auCentime(lignes.reduce((t, l) => t + (l.compte.startsWith("7") ? l.credit - l.debit : l.compte.startsWith("6") ? l.credit - l.debit : 0), 0));
}

/** L'effet de chaque rectification sur le résultat de N+1 (juste moins alternant), et leur somme. */
export function rectificationsDuDossier() {
  const ecarts = dossierDesImmobilisations()
    .filter((e) => e.erreur)
    .map((e) => ({ code: e.code, erreur: e.erreur!, ecart: auCentime(effetSurLeResultat(e.juste) - effetSurLeResultat(e.alternant)) }));
  return { ecarts, total: auCentime(ecarts.reduce((t, x) => t + x.ecart, 0)) };
}
