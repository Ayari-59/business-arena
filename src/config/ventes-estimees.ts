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
 * Ce que la validation garde des ventes estimées. Le RÉSULTAT estimé n'est pas
 * lu du formulaire : le serveur le recalcule avec le moteur, sur l'état
 * d'ouverture et les décisions validées (`estimationAConserver`). Un chiffre
 * venu du navigateur serait un chiffre qu'on n'a pas vérifié.
 */
export function ventesEstimeesSaisies(formData: FormData): SalesEstimate | null {
  const byProduct = ventesEstimeesParReference(formData.entries());
  if (!byProduct) return null;
  const units = Object.values(byProduct).reduce((a, b) => a + b, 0);
  // ZÉRO VENTE ESTIMÉE N'EST PAS UNE ESTIMATION. Le champ est pré-rempli à zéro
  // au premier tour, où il n'y a aucun repère à reprendre : une équipe qui n'y
  // touche pas n'a rien annoncé, et la fin de tour ne lui opposera rien.
  if (units <= 0) return null;
  return { byProduct, units };
}
