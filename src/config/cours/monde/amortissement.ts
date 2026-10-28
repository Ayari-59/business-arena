/**
 * LE MODÈLE DES AMORTISSEMENTS DU COURS : linéaire et dégressif, prorata temporis, valeur nette,
 * cession, et la convention de calcul des jours que tout le monde du cours partage.
 *
 * Des fonctions pures, sans fiche : elles prennent l'immobilisation et le mode en paramètres (un
 * laboratoire bascule du linéaire au dégressif sans rien d'autre). L'équipement de NOVA est dans
 * monde/exercice-de-nova.ts ; la garde tests/cours/exercice-de-nova.test.ts refait chaque plan à la main.
 *
 *   · LINÉAIRE : l'annuité d'une année pleine est la valeur brute ÷ la durée. La première année
 *     part du jour de la mise en service (jour compris), au prorata des jours sur 360 ; la dernière
 *     reprend ce que la première n'a pas pris. Un équipement mis en service en cours d'année
 *     s'amortit donc sur durée + 1 exercices.
 *   · DÉGRESSIF (le régime fiscal) : le taux est le taux linéaire × un coefficient qui dépend de la
 *     durée (1,25 pour 3 ou 4 ans, 1,75 pour 5 ou 6 ans, 2,25 au-delà). La première année part du
 *     premier jour du mois d'acquisition, au prorata des mois ; les suivantes appliquent le taux à
 *     la valeur nette. Dès que le taux linéaire sur les années qui restent l'égale ou le dépasse,
 *     on passe en linéaire sur la valeur nette. Le plan tient en « durée » exercices.
 *   · CESSION : l'année de la cession, la dotation court du début de l'exercice au jour de la
 *     cession (jour compris), au prorata des jours ; le résultat de cession est le prix moins la
 *     valeur nette comptable à cette date (une plus-value s'il est positif, une moins-value sinon).
 *
 * CONVENTION DES JOURS (celle du cours, la même pour les amortissements, les intérêts courus et
 * les charges constatées d'avance) : des mois de 30 jours, une année de 360 jours, le jour de
 * départ et le jour d'arrivée comptés tous les deux ; le 31 compte comme le 30. Du 6 janvier au
 * 31 décembre : 25 jours de janvier puis 11 mois, 355 jours.
 *
 * Les montants sont au centime ; les taux ne sont pas arrondis.
 */

/** Les jours d'un mois commercial, et ceux d'une année (la convention du cours). */
export const JOURS_DU_MOIS = 30;
export const JOURS_DE_L_ANNEE = 360;

/**
 * Une date du cours : le jour, le mois (1 pour janvier) et l'exercice, compté depuis celui de la
 * fiche (0, la valeur par défaut, pour l'exercice clôturé ; 1 pour l'exercice suivant ; 2 pour le
 * troisième…).
 */
export interface DateDuCours {
  jour: number;
  mois: number;
  exercice?: number;
}

export const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;

/** Le rang d'un jour sur le calendrier commercial (le 1er janvier de l'exercice 0 est le jour 1). */
export function rangDuJour(d: DateDuCours) {
  return (d.exercice ?? 0) * JOURS_DE_L_ANNEE + (d.mois - 1) * JOURS_DU_MOIS + Math.min(d.jour, JOURS_DU_MOIS);
}

/** Les jours d'une période, le jour de départ et le jour d'arrivée compris (0 si la fin précède le début). */
export function joursCompris(debut: DateDuCours, fin: DateDuCours) {
  return Math.max(0, rangDuJour(fin) - rangDuJour(debut) + 1);
}

/** Le 31 décembre d'un exercice : la date de clôture. */
export const clotureDe = (exercice = 0): DateDuCours => ({ jour: 31, mois: 12, exercice });

/** Une date décalée d'un nombre de mois, le même jour du mois (pour les échéances). */
export function plusDesMois(d: DateDuCours, mois: number): DateDuCours {
  const rang = (d.exercice ?? 0) * 12 + (d.mois - 1) + mois;
  return { jour: d.jour, mois: (rang % 12) + 1, exercice: Math.floor(rang / 12) };
}

export type ModeDAmortissement = "lineaire" | "degressif";

/** Une immobilisation amortissable : sa valeur brute (hors taxes, frais accessoires compris), sa mise en service, sa durée. */
export interface Immobilisation {
  valeurBrute: number;
  miseEnService: DateDuCours;
  dureeAns: number;
}

/** Le coefficient fiscal du dégressif, selon la durée d'utilisation (0 : le dégressif n'est pas permis). */
export function coefficientDegressif(dureeAns: number) {
  if (dureeAns < 3) return 0;
  if (dureeAns <= 4) return 1.25;
  if (dureeAns <= 6) return 1.75;
  return 2.25;
}

/** Une ligne du plan : l'exercice (0 pour celui de la mise en service), la base, le taux appliqué, la dotation. */
export interface LigneDuPlan {
  exercice: number;
  /** La valeur nette en début d'exercice (la base du dégressif). */
  baseDeCalcul: number;
  /** Le taux de l'exercice : linéaire, dégressif, ou linéaire sur les années qui restent. */
  taux: number;
  /** Le temps compté : des jours (linéaire, première année) ou des mois (dégressif, première année), sinon une année. */
  prorata: number;
  dotation: number;
  cumul: number;
  valeurNette: number;
}

/** Le plan d'amortissement complet, jusqu'à une valeur nette nulle. */
export function planDAmortissement(immo: Immobilisation, mode: ModeDAmortissement = "lineaire"): LigneDuPlan[] {
  return mode === "lineaire" ? planLineaire(immo) : planDegressif(immo);
}

function planLineaire(immo: Immobilisation): LigneDuPlan[] {
  const annuite = immo.valeurBrute / immo.dureeAns;
  const exercice0 = immo.miseEnService.exercice ?? 0;
  const jours = joursCompris(immo.miseEnService, clotureDe(exercice0));
  const lignes: LigneDuPlan[] = [];
  let cumul = 0;
  for (let k = 0; cumul < immo.valeurBrute; k++) {
    const base = auCentime(immo.valeurBrute - cumul);
    const prorata = k === 0 ? jours / JOURS_DE_L_ANNEE : 1;
    const dotation = Math.min(base, auCentime(annuite * prorata));
    cumul = auCentime(cumul + dotation);
    lignes.push({ exercice: exercice0 + k, baseDeCalcul: base, taux: 1 / immo.dureeAns, prorata: k === 0 ? jours : 1, dotation, cumul, valeurNette: auCentime(immo.valeurBrute - cumul) });
  }
  return lignes;
}

function planDegressif(immo: Immobilisation): LigneDuPlan[] {
  const coefficient = coefficientDegressif(immo.dureeAns);
  if (coefficient === 0) throw new Error("Le dégressif demande une durée d'au moins 3 ans.");
  const tauxDegressif = coefficient / immo.dureeAns;
  const exercice0 = immo.miseEnService.exercice ?? 0;
  const mois = 12 - immo.miseEnService.mois + 1;
  const lignes: LigneDuPlan[] = [];
  let cumul = 0;
  let annuiteLineaire: number | null = null;
  for (let k = 0; k < immo.dureeAns; k++) {
    const base = auCentime(immo.valeurBrute - cumul);
    const restantes = immo.dureeAns - k;
    let taux = tauxDegressif;
    let dotation: number;
    if (annuiteLineaire === null && k > 0 && 1 / restantes >= tauxDegressif - 1e-12) annuiteLineaire = auCentime(base / restantes);
    if (k === immo.dureeAns - 1) {
      // La dernière année solde la valeur nette.
      dotation = base;
      taux = 1;
    } else if (annuiteLineaire !== null) {
      dotation = annuiteLineaire;
      taux = 1 / restantes;
    } else {
      dotation = auCentime(base * tauxDegressif * (k === 0 ? mois / 12 : 1));
    }
    cumul = auCentime(cumul + dotation);
    lignes.push({ exercice: exercice0 + k, baseDeCalcul: base, taux, prorata: k === 0 ? mois : 1, dotation, cumul, valeurNette: auCentime(immo.valeurBrute - cumul) });
  }
  return lignes;
}

/** La dotation d'un exercice du plan (0 hors du plan). */
export function dotationDeLExercice(immo: Immobilisation, mode: ModeDAmortissement, exercice = 0) {
  return planDAmortissement(immo, mode).find((l) => l.exercice === exercice)?.dotation ?? 0;
}

/** La valeur nette comptable à la clôture d'un exercice. */
export function valeurNetteALaCloture(immo: Immobilisation, mode: ModeDAmortissement, exercice = 0) {
  const plan = planDAmortissement(immo, mode);
  const ligne = [...plan].reverse().find((l) => l.exercice <= exercice);
  return ligne ? ligne.valeurNette : immo.valeurBrute;
}

/**
 * LA CESSION d'une immobilisation à une date, pour un prix hors taxes : la dotation de l'exercice
 * de cession jusqu'à ce jour, le cumul des amortissements, la valeur nette comptable, et le
 * résultat de cession (prix − valeur nette).
 */
export function cession(immo: Immobilisation, mode: ModeDAmortissement, date: DateDuCours, prix: number) {
  const plan = planDAmortissement(immo, mode);
  const exercice = date.exercice ?? 0;
  const ligne = plan.find((l) => l.exercice === exercice);
  const avant = plan.filter((l) => l.exercice < exercice).reduce((t, l) => t + l.dotation, 0);
  let dotationDeLAnnee = 0;
  if (ligne) {
    const premier = exercice === (immo.miseEnService.exercice ?? 0);
    // Le début du temps compté cette année : la mise en service en linéaire, le 1er du mois en dégressif.
    const debut: DateDuCours = !premier ? { jour: 1, mois: 1, exercice } : mode === "lineaire" ? immo.miseEnService : { jour: 1, mois: immo.miseEnService.mois, exercice };
    const jours = joursCompris(debut, date);
    dotationDeLAnnee =
      mode === "lineaire"
        ? // L'annuité au prorata des jours passés, sans dépasser ce qui reste à amortir.
          Math.min(ligne.baseDeCalcul, auCentime(((immo.valeurBrute / immo.dureeAns) * jours) / JOURS_DE_L_ANNEE))
        : // La dotation du plan pour l'exercice, ramenée aux jours passés avant la cession.
          Math.min(ligne.baseDeCalcul, auCentime((ligne.dotation * jours) / joursCompris(debut, clotureDe(exercice))));
  }
  const cumul = auCentime(avant + dotationDeLAnnee);
  const valeurNette = auCentime(immo.valeurBrute - cumul);
  const resultat = auCentime(prix - valeurNette);
  return { dotationDeLAnnee, cumul, valeurNette, prix, resultat, nature: resultat >= 0 ? ("plus-value" as const) : ("moins-value" as const) };
}

/**
 * L'AMORTISSEMENT DÉROGATOIRE, exercice par exercice : quand le plan fiscal (dégressif) dépasse le
 * plan comptable (linéaire), l'écart se dote au passif (compte 145) ; quand il passe dessous, il
 * se reprend. Positif : une dotation ; négatif : une reprise.
 */
export function amortissementDerogatoire(immo: Immobilisation) {
  const lineaire = planDAmortissement(immo, "lineaire");
  const degressif = planDAmortissement(immo, "degressif");
  return lineaire.map((l) => {
    const d = degressif.find((x) => x.exercice === l.exercice)?.dotation ?? 0;
    return { exercice: l.exercice, lineaire: l.dotation, degressif: d, ecart: auCentime(d - l.dotation) };
  });
}
