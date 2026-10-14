/**
 * L'EMBLÈME D'UNE ÉQUIPE : un nom, c'est bien ; un visage, c'est mieux.
 *
 * Une équipe peut se donner un nom au premier tour, et c'est son premier acte
 * de gestion. Elle n'avait en revanche aucun signe : dans la composition des
 * équipes, dans le classement, sur l'écran projeté de l'enseignant, six lignes
 * de texte gris se ressemblaient toutes. Une classe reconnaît un dessin à
 * distance, pas une ligne de tableau.
 *
 * DESSINÉS, PAS DES EMOJI. Le système dessine les emoji à sa façon : différents
 * d'un appareil à l'autre, en couleurs étrangères au site, et brouillés au
 * vidéoprojecteur — c'est la raison pour laquelle le dépôt a déjà remplacé les
 * emoji des tiroirs par des tracés. Un emblème se voit de loin ou ne sert à
 * rien.
 *
 * HUIT, ET PAS DAVANTAGE. Il en faut assez pour que deux équipes d'une même
 * classe se distinguent, et assez peu pour que le choix tienne sur une ligne et
 * se fasse en dix secondes, au tour 1, quand tout le monde attend. Huit formes
 * franches, sans détail : à 16 pixels dans un tableau comme sur un mur, c'est
 * la SILHOUETTE qu'on reconnaît.
 */

export interface Embleme {
  code: string;
  /** Son nom, pour le choisir à la voix comme au clavier. */
  nom: string;
  /** Le tracé, dans une boîte de 24 × 24. */
  trace: string;
}

export const EMBLEMES: readonly Embleme[] = [
  { code: "etoile", nom: "Étoile", trace: "M12 2.5l2.7 5.9 6.4.7-4.8 4.4 1.3 6.3L12 16.6 6.4 19.8l1.3-6.3L2.9 9.1l6.4-.7z" },
  { code: "eclair", nom: "Éclair", trace: "M13.5 2 5 13.5h5.5L9.5 22 19 10h-6z" },
  { code: "bouclier", nom: "Bouclier", trace: "M12 2 4 5.2v6.3c0 5 3.4 9.1 8 10.5 4.6-1.4 8-5.5 8-10.5V5.2z" },
  { code: "montagne", nom: "Montagne", trace: "M2 20 9 7l4.2 7.2L15.5 11 22 20z" },
  { code: "couronne", nom: "Couronne", trace: "M3 8l4.5 4L12 4l4.5 8L21 8l-2 12H5z" },
  { code: "losange", nom: "Losange", trace: "M12 2 22 12 12 22 2 12z" },
  { code: "goutte", nom: "Goutte", trace: "M12 2.5c4.2 5.2 6.5 8.4 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.1 2.3-6.3 6.5-11.5z" },
  { code: "fleche", nom: "Flèche", trace: "M12 2.5 3.5 13H8.5v8.5h7V13h5z" },
] as const;

/** Le tracé d'un code, ou null : un code inconnu ne dessine rien plutôt que n'importe quoi. */
export function emblemeParCode(code: string | null | undefined): Embleme | null {
  if (!code) return null;
  return EMBLEMES.find((e) => e.code === code) ?? null;
}
