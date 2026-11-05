import { auCentime } from "./amortissement";
import { composantsDeLaSecondeLigne } from "./comptabilite-approfondie";
import { EQUIPEMENT } from "./exercice-de-nova";
import { BANC, CREDIT_BAIL_DU_BANC } from "./financement-de-la-gamme";
import { EQUIPEMENTS_D_EFFICACITE, SUBVENTION_DE_L_EFFICACITE, TAUX_DE_SUBVENTION } from "./investissement-durable";
import { TAUX_DE_TVA } from "./nova-gestion";

/**
 * LE MONDE DU COURS : ACQUÉRIR ET FINANCER UNE IMMOBILISATION, CHEZ NOVA EN N + 1 (BTS CG P1 1.5.2 et
 * 1.5.6, P2 2.3.2).
 *
 * Le chapitre « Acquérir et financer une immobilisation » et son cas le lisent. Il joue en N + 1, pour
 * ne pas toucher la fiche figée de l'exercice N (exercice-de-nova.ts). Cinq opérations :
 *   · L'ACOMPTE : NOVA commande un chariot élévateur, livré en N + 2, et verse un acompte à la
 *     commande (compte 238). Une livraison de biens rend la TVA exigible à la livraison : l'acompte
 *     n'en porte pas. La facture de N + 2 l'impute.
 *   · LA PRODUCTION IMMOBILISÉE : l'atelier construit lui-même une cabine d'écoute pour le contrôle
 *     final des enceintes ; ses charges sont déjà passées par nature, la cabine entre à l'actif à son
 *     coût de production par le compte 722. Elle s'amortit selon les heures d'essai (unités d'œuvre),
 *     et le plan se modifie quand la consommation prévue change (la seule modification du plan que le
 *     BTS étudie).
 *   · LA SUBVENTION : celle des équipements d'efficacité énergétique de la seconde ligne, que le
 *     chapitre « Évaluer un investissement durable » fait obtenir (investissement-durable.ts : 30 % de
 *     12 000 €), en service le 2 janvier N + 1 avec la seconde ligne ; elle se reprend au rythme de leur
 *     amortissement, au prorata de 359 jours, la quote-part que le diagnostic de trois exercices
 *     retrouve dans l'exceptionnel de N + 1 (diagnostic-de-nova.ts).
 *   · LE CRÉDIT-BAIL : le banc de mesure, au contrat du cas « Le banc en crédit-bail »
 *     (financement-de-la-gamme.ts, CREDIT_BAIL_DU_BANC), où le crédit-bail l'emporte ; NOVA le signe.
 *     La première redevance tombe le 31 décembre N + 1 ; le reste du contrat est un engagement hors
 *     bilan.
 *   · LA PROVISION POUR GROS ENTRETIEN : la grande révision de la première ligne (exercice-de-nova.ts,
 *     EQUIPEMENT), étalée sur les exercices qui la précèdent.
 *
 * TOUT CE QUI EST NEUF EST UNE HYPOTHÈSE DU COURS, nommée ci-dessous. Le diagnostic de trois exercices
 * (diagnostic-de-nova.ts) résume NOVA à grands traits : il ne reprend ni le chariot, ni la cabine, ni
 * la redevance du banc, ni la provision (voir le rapport du chantier).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. L'ACOMPTE : LE CHARIOT ÉLÉVATEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CHARIOT ÉLÉVATEUR (hypothèse du cours) : commandé le 15 novembre N + 1, 14 000 € hors taxes, un
 * acompte de 30 % versé par virement à la commande, livré et facturé le 15 janvier N + 2, le solde à
 * 30 jours.
 */
export const CHARIOT = {
  designation: "Chariot élévateur électrique",
  ht: 14_000,
  tauxDAcompte: 0.3,
  commande: "15 novembre N + 1",
  livraison: "15 janvier N + 2",
} as const;

/** L'acompte, la facture de livraison et ce qui reste dû. */
export function chariot() {
  const acompte = auCentime(CHARIOT.ht * CHARIOT.tauxDAcompte);
  const tva = auCentime(CHARIOT.ht * TAUX_DE_TVA);
  const ttc = auCentime(CHARIOT.ht + tva);
  return { acompte, tva, ttc, resteDu: auCentime(ttc - acompte) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA PRODUCTION IMMOBILISÉE : LA CABINE D'ÉCOUTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA CABINE D'ÉCOUTE (hypothèse du cours) : construite par l'atelier de NOVA de juillet à septembre
 * N + 1, mise en service le 1er octobre N + 1. Son coût de production : 3 800 € de matières (panneaux,
 * mousses, porte isolante), 140 heures d'opérateur à 32 € l'heure chargée, 1 720 € de charges
 * indirectes d'atelier.
 *
 * SON AMORTISSEMENT : selon les heures d'essai, l'unité d'œuvre qui mesure son usage ; 5 000 heures
 * prévues sur sa vie, 400 en N + 1. En linéaire, elle durerait 5 ans. À la clôture de N + 1, le
 * lancement de Studio, dont les essais sont plus longs, porte les heures restantes prévues à 5 400 au
 * lieu de 4 600 ; 1 800 heures sont prévues en N + 2.
 */
export const CABINE = {
  designation: "Cabine d'écoute insonorisée",
  matieres: 3_800,
  heures: 140,
  coutHoraire: 32,
  chargesIndirectes: 1_720,
  miseEnService: "1er octobre N + 1",
  joursDeNPlus1: 90,
  dureeLineaireAns: 5,
  heuresPrevues: 5_000,
  heuresDeNPlus1: 400,
  heuresRestantesRevisees: 5_400,
  heuresDeNPlus2: 1_800,
} as const;

/** Les jours de l'année du cours (mois de 30 jours). */
const JOURS_DE_L_ANNEE = 360;

/** Le coût de production de la cabine, et ses plans : en unités d'œuvre, en linéaire, puis modifié. */
export function cabine(heuresDeNPlus1: number = CABINE.heuresDeNPlus1) {
  const mainDOeuvre = auCentime(CABINE.heures * CABINE.coutHoraire);
  const cout = auCentime(CABINE.matieres + mainDOeuvre + CABINE.chargesIndirectes);
  const dotationEnUnites = auCentime((cout * heuresDeNPlus1) / CABINE.heuresPrevues);
  const dotationLineaire = auCentime(((cout / CABINE.dureeLineaireAns) * CABINE.joursDeNPlus1) / JOURS_DE_L_ANNEE);
  const valeurNette = auCentime(cout - dotationEnUnites);
  const heuresRestantesPrevues = CABINE.heuresPrevues - heuresDeNPlus1;
  // LE PLAN MODIFIÉ : la valeur nette, répartie sur les heures restantes nouvellement prévues.
  const dotationDeNPlus2 = auCentime((valeurNette * CABINE.heuresDeNPlus2) / CABINE.heuresRestantesRevisees);
  const dotationDeNPlus2SansRevision = auCentime((valeurNette * CABINE.heuresDeNPlus2) / heuresRestantesPrevues);
  return { mainDOeuvre, cout, dotationEnUnites, dotationLineaire, valeurNette, heuresRestantesPrevues, dotationDeNPlus2, dotationDeNPlus2SansRevision };
}

/** Le laboratoire de la cabine : le mode (linéaire ou unités d'œuvre), les heures d'essai de N + 1. */
export const MODES_DE_LA_CABINE = { lineaire: 0, unites: 1 } as const;
export const HEURES_DU_LABORATOIRE = { min: 0, max: 1_000, pas: 50 } as const;

/** La dotation de N + 1 de la cabine, dans un mode, pour des heures d'essai données. */
export function dotationDeLaCabine(mode: number, heures: number) {
  const k = cabine(heures);
  return mode === MODES_DE_LA_CABINE.unites ? k.dotationEnUnites : k.dotationLineaire;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LA SUBVENTION DES ÉQUIPEMENTS D'EFFICACITÉ
// ─────────────────────────────────────────────────────────────────────────────

/** LES DATES DE LA SUBVENTION (hypothèse du cours) : notifiée le 2 janvier N + 1, versée le 15 mars N + 1. */
export const DATES_DE_LA_SUBVENTION = { octroi: "2 janvier N + 1", versement: "15 mars N + 1" } as const;

/** La subvention, sa quote-part de N + 1 et ce qui en reste au bilan. */
export function subvention() {
  const jours = composantsDeLaSecondeLigne().jours;
  const prorata = jours / JOURS_DE_L_ANNEE;
  const duree = EQUIPEMENTS_D_EFFICACITE.dureeDAmortissement;
  const montant = SUBVENTION_DE_L_EFFICACITE;
  const quotePartAnnuelle = auCentime(montant / duree);
  const quotePart = auCentime((montant / duree) * prorata);
  const dotation = auCentime((EQUIPEMENTS_D_EFFICACITE.montant / duree) * prorata);
  return {
    equipements: EQUIPEMENTS_D_EFFICACITE.montant,
    taux: TAUX_DE_SUBVENTION,
    montant,
    duree,
    jours,
    quotePartAnnuelle,
    quotePart,
    resteAuBilan: auCentime(montant - quotePart),
    dotation,
    chargeNette: auCentime(dotation - quotePart),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE CRÉDIT-BAIL DU BANC DE MESURE
// ─────────────────────────────────────────────────────────────────────────────

/** La redevance de N + 1, sa TVA, et l'engagement qui reste hors bilan au 31 décembre N + 1. */
export function creditBailDuBanc() {
  const cb = CREDIT_BAIL_DU_BANC;
  const tva = auCentime(cb.redevance * TAUX_DE_TVA);
  const redevancesRestantes = cb.dureeAns - 1;
  const restantDu = auCentime(redevancesRestantes * cb.redevance);
  return {
    banc: BANC.libelle,
    valeur: cb.valeur,
    redevance: cb.redevance,
    tva,
    ttc: auCentime(cb.redevance + tva),
    dureeAns: cb.dureeAns,
    option: cb.option,
    redevancesRestantes,
    restantDu,
    engagement: auCentime(restantDu + cb.option),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LA PROVISION POUR GROS ENTRETIEN DE LA PREMIÈRE LIGNE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA GRANDE RÉVISION DE LA PREMIÈRE LIGNE (hypothèse du cours) : le fabricant l'impose après quatre ans
 * de service, en décembre N + 3 ; devis de 7 200 € hors taxes. NOVA arrête son programme de gros
 * entretien en N + 1 et étale la provision sur les trois exercices N + 1 à N + 3.
 */
export const GRANDE_REVISION = { ligne: EQUIPEMENT.designation, devis: 7_200, date: "décembre N + 3", exercices: 3 } as const;

/** La dotation de chaque exercice à la provision pour gros entretien. */
export const provisionPourGrosEntretien = () => auCentime(GRANDE_REVISION.devis / GRANDE_REVISION.exercices);
