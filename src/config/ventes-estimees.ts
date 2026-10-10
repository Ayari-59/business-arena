import type { ProductCode, SalesEstimate } from "@/engine/types";

/**
 * LES VENTES ESTIMÉES : LA PREMIÈRE DÉCISION, ET LA SEULE QUE LE MOTEUR IGNORE.
 *
 * « Vous décidez, le marché répond. » Entre les deux, il manquait la moitié du
 * slogan : ce que l'équipe CROIT qu'il va se passer. Elle le dit ici, référence
 * par référence, en tête de la feuille de décision ; l'encart « Résultat
 * estimé » lui rend aussitôt le compte que ces ventes donneraient, et la fin de
 * tour met son estimation en face de ce que le marché a réellement fait.
 *
 * Ce n'est PAS un levier de gestion : le moteur ne lit pas ce champ, et rien de
 * ce qui est saisi ici ne change le tour (une garde le prouve dans
 * `tests/engine/estimation.test.ts`). C'est pourquoi il ne figure pas au
 * registre des leviers (`config/decisions.ts`), au même titre que la note
 * d'avant : compter l'estimation parmi les décisions du tour gonflerait le
 * nombre annoncé sur la page d'accueil d'une ligne qui ne décide de rien.
 *
 * Les champs se nomment `ventesEstimees.<code de référence>` — en mono-produit,
 * le code du produit — comme les décisions par référence se nomment
 * `product.<code>.<champ>` : un seul endroit construit le nom, les deux côtés
 * du formulaire le lisent.
 */

export const PREFIXE_VENTES_ESTIMEES = "ventesEstimees.";

/** Le nom du champ qui porte les ventes estimées d'une référence. */
export function champDesVentesEstimees(code: ProductCode): string {
  return `${PREFIXE_VENTES_ESTIMEES}${code}`;
}

/**
 * Les ventes estimées lues sur le formulaire, référence par référence. `null`
 * quand aucun champ n'est présent : une estimation absente n'est pas une
 * estimation à zéro, et la fin de tour ne reproche pas ce qui n'a pas été dit.
 */
export function ventesEstimeesParReference(
  entries: Iterable<[string, FormDataEntryValue | string | null]>,
): Record<ProductCode, number> | null {
  const out: Record<ProductCode, number> = {};
  let trouve = false;
  for (const [cle, brut] of entries) {
    if (!cle.startsWith(PREFIXE_VENTES_ESTIMEES)) continue;
    const code = cle.slice(PREFIXE_VENTES_ESTIMEES.length);
    if (code === "") continue;
    trouve = true;
    const texte = String(brut ?? "")
      .trim()
      .replace(",", ".");
    const n = texte === "" ? 0 : Number(texte);
    out[code] = Number.isFinite(n) && n > 0 ? n : 0;
  }
  return trouve ? out : null;
}

/**
 * LA VALEUR DE DÉPART DU CHAMP (lot P4). Dans l'ordre :
 *   1. ce que l'équipe a déjà validé ce tour-ci (mode classe) ;
 *   2. ce qu'elle a VENDU au tour passé : son propre chiffre, sous ses yeux ;
 *   3. au PREMIER tour seulement, où il n'y a rien à reprendre : son plan de
 *      production, le volume que la feuille lui propose déjà dans le champ
 *      d'à côté. Ce n'est pas une donnée du moteur (ni la demande, ni la part
 *      de marché, qui sont cachées) : c'est un chiffre qu'elle a sous les yeux,
 *      et c'est une PROPOSITION — l'écran la marque « à ajuster » tant que le
 *      joueur n'a pas touché au champ, et la validation ne la compte pas comme
 *      une estimation (voir `ventesEstimeesSaisies`) ;
 *   4. sinon zéro (une référence lancée en cours de partie) : rien n'est annoncé.
 * Au premier tour, un champ à zéro laissait le résultat estimé muet : la pièce
 * maîtresse de la feuille ne disait rien au moment où l'on découvre le jeu.
 */
export function ventesEstimeesParDefaut({
  deposee,
  venduAuTourPasse,
  planDeProduction,
  premierTour,
}: {
  deposee?: number | undefined;
  venduAuTourPasse?: number | undefined;
  planDeProduction?: number | undefined;
  premierTour: boolean;
}): { valeur: number; proposition: boolean } {
  if (deposee !== undefined) return { valeur: Math.round(deposee), proposition: false };
  if (venduAuTourPasse !== undefined) {
    return { valeur: Math.round(venduAuTourPasse), proposition: false };
  }
  if (premierTour && planDeProduction !== undefined && planDeProduction > 0) {
    return { valeur: Math.round(planDeProduction), proposition: true };
  }
  return { valeur: 0, proposition: false };
}

/**
 * Le témoin d'une proposition qu'on n'a pas touchée : la feuille pose un champ
 * caché `propositionDeVentes` = "1" tant que le chiffre des ventes estimées est
 * celui qu'ELLE a proposé. Il disparaît à la première saisie dans un champ des
 * ventes estimées.
 */
export function propositionIntacte(formData: FormData): boolean {
  return formData.get("propositionDeVentes") === "1";
}

/**
 * Ce que la validation garde des ventes estimées. Le RÉSULTAT estimé n'est pas
 * lu du formulaire : le serveur le recalcule avec le moteur, sur l'état
 * d'ouverture et les décisions validées (`estimationAConserver`). Un chiffre
 * venu du navigateur serait un chiffre qu'on n'a pas vérifié.
 */
export function ventesEstimeesSaisies(formData: FormData): SalesEstimate | null {
  const byProduct = ventesEstimeesParReference(formData.entries());
  if (!byProduct) return null;
  // UNE PROPOSITION QU'ON N'A PAS TOUCHÉE N'EST PAS UNE ESTIMATION (lot P4). Au
  // premier tour, la feuille propose le plan de production pour que le
  // résultat estimé parle ; une équipe qui valide sans y toucher n'a rien
  // annoncé, et la fin de tour ne lui opposera pas un chiffre qu'elle n'a pas
  // dit.
  if (propositionIntacte(formData)) return null;
  const units = Object.values(byProduct).reduce((a, b) => a + b, 0);
  // ZÉRO VENTE ESTIMÉE N'EST PAS UNE ESTIMATION. Le champ part à zéro pour une
  // référence sans repère (lancée en cours de partie) : une équipe qui n'y
  // touche pas n'a rien annoncé, et la fin de tour ne lui opposera rien.
  if (units <= 0) return null;
  return { byProduct, units };
}
