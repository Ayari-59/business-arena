import { GUIDE_ENSEIGNANT } from "./enseignant";
import { GUIDE_ETUDIANT } from "./etudiant";
import { GUIDE_ETABLISSEMENT } from "./etablissement";
import { GUIDE_FORMATEUR } from "./formateur";
import { resoudre, type ValeursDesJetons } from "./jetons";
import type { CaptureDEtape, Guide, PublicDuGuide } from "./types";

export type * from "./types";

/**
 * LES GUIDES DE PRISE EN MAIN, dans l'ordre des cartes de /guides.
 *
 * Décision du propriétaire (octobre 2026) : « J'aimerais préparer une série de guides
 * de prise en main. » Quatre publics, une page par public et sa version imprimable,
 * avec des captures réelles. Ce registre est la seule source : la page, l'impression,
 * le script des captures et les gardes le lisent.
 */
export const GUIDES: readonly Guide[] = [GUIDE_ENSEIGNANT, GUIDE_ETUDIANT, GUIDE_ETABLISSEMENT, GUIDE_FORMATEUR];

export const PUBLICS_DES_GUIDES: readonly PublicDuGuide[] = GUIDES.map((g) => g.public);

export const guideDe = (publicDuGuide: string): Guide | undefined =>
  GUIDES.find((g) => g.public === publicDuGuide);

export const cheminDuGuide = (publicDuGuide: PublicDuGuide): string => `/guides/${publicDuGuide}`;

/** La largeur de la version réduite, servie aux téléphones. */
export const LARGEUR_REDUITE = 768;

/** L'adresse d'une capture, pleine ou réduite. */
export function imageDeLaCapture(publicDuGuide: PublicDuGuide, capture: CaptureDEtape, reduite = false): string {
  return `/guides/${publicDuGuide}/${capture.fichier}${reduite ? `-${LARGEUR_REDUITE}` : ""}.webp`;
}

/** La hauteur de la version réduite, au même rapport que la pleine. */
export const hauteurReduite = (c: CaptureDEtape): number => Math.round((c.hauteur * LARGEUR_REDUITE) / c.largeur);

/** Toute la prose d'un guide, brute (jetons non résolus), pour les gardes et la durée de lecture. */
export function proseDuGuide(g: Guide): string[] {
  return [
    g.titre,
    g.chapeau,
    g.pourQui,
    g.resultat,
    ...g.enCinqMinutes,
    ...g.etapes.flatMap((e) => [
      e.titre,
      ...e.faire,
      e.voir,
      e.erreur,
      e.capture.alt,
      ...e.capture.reperes.map((r) => r.legende),
      e.lien?.libelle ?? "",
    ]),
    ...g.plusLoin.flatMap((p) => [p.titre, p.texte, p.lien.libelle]),
    ...g.faq.flatMap((q) => [q.question, q.reponse, q.lien?.libelle ?? ""]),
  ].filter(Boolean);
}

/** La durée de lecture, en minutes, comptée sur le texte (deux cents mots par minute). */
export function dureeDeLecture(g: Guide): number {
  const mots = proseDuGuide(g).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / 200));
}

/** Le guide, chaque texte résolu (jetons remplacés par la configuration et le catalogue). */
export function guideResolu(g: Guide, valeurs: ValeursDesJetons): Guide {
  const r = (t: string) => resoudre(t, valeurs);
  return {
    ...g,
    chapeau: r(g.chapeau),
    pourQui: r(g.pourQui),
    resultat: r(g.resultat),
    enCinqMinutes: g.enCinqMinutes.map(r),
    etapes: g.etapes.map((e) => ({
      ...e,
      titre: r(e.titre),
      faire: e.faire.map(r),
      voir: r(e.voir),
      erreur: r(e.erreur),
      capture: { ...e.capture, alt: r(e.capture.alt), reperes: e.capture.reperes.map((x) => ({ ...x, legende: r(x.legende) })) },
    })),
    plusLoin: g.plusLoin.map((p) => ({ ...p, texte: r(p.texte) })),
    faq: g.faq.map((q) => ({ ...q, question: r(q.question), reponse: r(q.reponse) })),
  };
}

/** « 12/10/2026 », pour l'en-tête de l'impression. */
export function dateDeVersion(g: Guide): string {
  const [a, m, j] = g.version.split("-");
  return `${j}/${m}/${a}`;
}
