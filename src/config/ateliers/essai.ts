import type { AtelierDefinition, AtelierSeance } from "./types";

/**
 * LE TOUR D'ESSAI D'UN ATELIER, EN CLAIR.
 *
 * Une fiche le déclare dans ses réglages (`reglages.tourDEssai`) et une
 * séance le joue (`AtelierSeance.essai`). Les pages qui listent les réglages
 * de création le disent pour toutes les fiches, celles qui n'en ont pas
 * comprises : un enseignant qui compare des fiches doit y lire la même ligne.
 */

const EN_LETTRES: Record<number, string> = { 1: "Un tour", 2: "Deux tours" };

/** « Un tour d'essai avant la vraie partie », ou « Sans tour d'essai ». */
export function tourDEssaiEnClair(a: Pick<AtelierDefinition, "reglages">): string {
  const n = a.reglages.tourDEssai;
  if (!n) return "Sans tour d'essai";
  return `${EN_LETTRES[n] ?? `${n} tours`} d'essai avant la vraie partie`;
}

/** Ce qu'une séance joue, pour son en-tête : l'essai, un tour, ou rien. */
export function tourDeLaSeanceEnClair(
  s: Pick<AtelierSeance, "tourJoue" | "essai">,
): string | null {
  if (s.essai) return "tour d'essai joué en séance, il ne compte pas";
  if (s.tourJoue !== null) return `tour ${s.tourJoue} joué en séance`;
  return null;
}

/**
 * CE QUE LES SÉANCES JOUENT, EN UNE PHRASE POUR « À RETENIR ». La fiche
 * écrivait « N séances jouent un tour, la dernière rend compte » dès qu'une
 * séance ne jouait rien : vrai pour une séance de restitution, faux pour une
 * séance d'essai, qui est la première. La phrase se lit donc dans les séances.
 */
export function repartitionDesSeancesEnClair(
  a: Pick<AtelierDefinition, "seances">,
): string {
  const seances = a.seances;
  const jouent = seances.filter((s) => s.tourJoue !== null).length;
  if (jouent === seances.length) return "Chaque séance joue un tour.";
  const morceaux: string[] = [];
  if (seances[0]?.essai) morceaux.push("la première joue le tour d'essai");
  morceaux.push(`${jouent} séances jouent un tour`);
  const derniere = seances[seances.length - 1];
  if (derniere && derniere.tourJoue === null && !derniere.essai) {
    morceaux.push("la dernière rend compte");
  }
  const phrase = morceaux.join(", ");
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}
