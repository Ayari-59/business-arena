/**
 * LE CODE DE REPRISE D'UN JOUEUR DE CONCOURS.
 *
 * Un élève de concours n'a ni compte ni mot de passe : il est reconnu par un
 * cookie invité, donc par son navigateur. Ce code personnel, noté à
 * l'inscription, lui rend son identité depuis n'importe quel appareil.
 *
 * L'alphabet est celui des codes d'inscription : ni I, ni L, ni O, ni 0, ni 1,
 * parce qu'un code se recopie à la main depuis un tableau ou un bout de papier
 * et que ces caractères-là se confondent. Huit caractères font mille milliards
 * de combinaisons, ce qui suffit largement une fois les tentatives limitées.
 */

export const ALPHABET_REPRISE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LONGUEUR_CODE_REPRISE = 8;

/** Fenêtre glissante et plafond des tentatives de reprise, par adresse. */
export const FENETRE_REPRISE_MS = 15 * 60 * 1000;
export const MAX_ECHECS_REPRISE = 10;

/**
 * Le code tel qu'on l'écrit à l'élève : deux groupes de quatre. Un code d'un
 * seul bloc se recopie mal, et se relit encore plus mal à voix haute.
 */
export function formaterCodeDeReprise(code: string): string {
  const net = normaliserCodeDeReprise(code);
  return net.length === LONGUEUR_CODE_REPRISE ? `${net.slice(0, 4)}-${net.slice(4)}` : net;
}

/**
 * Le code tel qu'on le compare : majuscules, sans tiret ni espace. L'élève qui
 * recopie « k7pd 5m2x » ou « K7PD-5M2X » doit entrer, dans les deux cas.
 */
export function normaliserCodeDeReprise(saisi: string): string {
  return saisi
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, LONGUEUR_CODE_REPRISE);
}

/** Un code saisi a-t-il la forme attendue ? (Dit non avant d'interroger la base.) */
export function codeDeReprisePlausible(saisi: string): boolean {
  const net = normaliserCodeDeReprise(saisi);
  return (
    net.length === LONGUEUR_CODE_REPRISE &&
    [...net].every((c) => ALPHABET_REPRISE.includes(c))
  );
}

export const AIDE_CODE_DE_REPRISE =
  "Notez ce code : il vous rend votre équipe depuis n'importe quel appareil, " +
  "même après la clôture des inscriptions. Votre enseignant peut vous le relire.";

/**
 * La même chose en classe, où il n'y a pas d'inscriptions à clore. Ce qui fait
 * perdre son identité à un élève, là, c'est de changer de poste ou de
 * navigateur — et c'est cela qu'il faut nommer pour qu'il comprenne à quoi
 * sert ce code AVANT d'en avoir besoin.
 */
export const AIDE_CODE_DE_REPRISE_CLASSE =
  "Notez ce code : il vous rend votre équipe et tout ce que vous y avez fait, " +
  "depuis n'importe quel appareil. Votre enseignant peut vous le relire.";

/**
 * En solo, il n'y a pas d'enseignant pour relire un code perdu : le seul
 * moment où l'on peut le noter, c'est maintenant. Le texte le dit, et dit à
 * quoi il sert — retrouver SA partie au tour où on l'a laissée, après avoir
 * vidé ses cookies ou en changeant d'appareil.
 */
export const AIDE_CODE_DE_REPRISE_SOLO =
  "Notez ce code : il vous rend cette partie, au tour où vous l'avez laissée, " +
  "sur n'importe quel appareil — après avoir vidé vos cookies, ou en passant du " +
  "téléphone à l'ordinateur. Il se saisit sur la page « Reprendre ma partie ».";
