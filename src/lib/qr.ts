import qrcode from "qrcode-generator";
import { SITE_URL } from "@/config/site";

/**
 * LE QR CODE, CALCULÉ ICI ET RENDU EN SVG.
 *
 * L'élève qui rejoint une partie tape deux choses : un code de six caractères
 * et son prénom. Le code est celui qui se perd — mal recopié du tableau,
 * confondu entre un 2 et un Z, demandé trois fois à voix haute. Le QR le
 * supprime : l'appareil photo ouvre `/join?code=…`, le champ est déjà rempli,
 * il ne reste que le prénom.
 *
 * Deux contraintes ont dicté la forme de ce module.
 *
 * · AUCUN SERVICE EXTERNE. La politique de sécurité du site n'autorise les
 *   images que depuis `'self'`, `data:` et `blob:` (voir `next.config.ts`) :
 *   une URL d'API qui fabrique le QR serait bloquée par le navigateur, et
 *   enverrait au passage les codes de toutes les parties chez un tiers. Le
 *   calcul se fait donc ici, à la seconde où la page se rend.
 *
 * · PAS DE `dangerouslySetInnerHTML`. La bibliothèque sait produire un
 *   `<svg>` tout fait, mais l'injecter demanderait cette échappatoire. On ne
 *   lui demande que la matrice de modules, et le composant la rend en JSX.
 *   D'où `cheminDesModules` : un seul attribut `d`, un seul élément dans le
 *   DOM, plutôt qu'un millier de `<rect>`.
 *
 * La zone de silence de quatre modules et le fond clair ne sont pas
 * décoratifs : la norme les exige, et un QR sombre sur fond sombre — le thème
 * par défaut du site — n'est lu que par une partie des appareils.
 */

/** La zone de silence imposée par la norme, en modules. */
export const MARGE_QR = 4;

/**
 * L'adresse qu'encode un QR : l'écran d'entrée, code déjà porté par l'URL.
 * C'est la seule construction de cette adresse dans le code — le QR et le lien
 * écrit doivent mener au même endroit.
 *
 * Avec un rang d'équipe, c'est le carton d'une table : l'élève qui le scanne
 * entre dans CETTE équipe, sans passer par l'affectation automatique. Le rang
 * est une poignée, pas un numéro à montrer (voir `equipesNumerotees`).
 */
export function urlDeJonction(code: string, rangDEquipe?: number): string {
  const base = `${SITE_URL}/join?code=${encodeURIComponent(code.trim().toUpperCase())}`;
  return rangDEquipe === undefined ? base : `${base}&equipe=${rangDEquipe}`;
}

export interface DessinQr {
  /** Le côté de la matrice en modules, zone de silence comprise. */
  cote: number;
  /** Le tracé de tous les modules sombres, dans un seul attribut `d`. */
  chemin: string;
}

/**
 * Le tracé des modules sombres d'un QR, en coordonnées « un module = 1 ».
 *
 * Chaque module sombre devient un carré fermé du chemin ; l'appelant donne
 * l'échelle par le `viewBox`, ce qui rend le dessin net à n'importe quelle
 * taille, du ticket imprimé au vidéoprojecteur.
 */
export function dessinerQr(texte: string, marge: number = MARGE_QR): DessinQr {
  // Le type 0 laisse la bibliothèque choisir la plus petite version qui
  // contient le texte ; « M » corrige un quart des modules, ce qui suffit à un
  // QR propre affiché à l'écran ou imprimé au laser.
  const qr = qrcode(0, "M");
  qr.addData(texte);
  qr.make();
  const n = qr.getModuleCount();
  const morceaux: string[] = [];
  for (let ligne = 0; ligne < n; ligne += 1) {
    for (let colonne = 0; colonne < n; colonne += 1) {
      if (qr.isDark(ligne, colonne)) {
        morceaux.push(`M${colonne + marge} ${ligne + marge}h1v1h-1z`);
      }
    }
  }
  return { cote: n + marge * 2, chemin: morceaux.join("") };
}
