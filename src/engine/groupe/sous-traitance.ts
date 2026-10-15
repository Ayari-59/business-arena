import type { ProductCode } from "../types";
import type { ConfigDeGroupe, TrancheDeSousTraitance } from "./types";

/**
 * FABRIQUER OU FAIRE FABRIQUER (niveau 7).
 *
 * Le sous-traitant livre des produits FINIS, dans le tour, avant le marché :
 * ils entrent en stock et se vendent comme les autres. Il ne prend ni heure de
 * main-d'œuvre ni capacité machine, et ne coûte rien sans commande : aucun
 * coût fixe. Son prix suit un barème par tranches, parce qu'il facture la
 * capacité qu'il mobilise : la dernière tranche dépasse le prix de vente, et
 * sous-traiter beaucoup y perd. La commande est ferme, passée avant que la
 * demande soit connue : ce qui ne se vend pas reste en stock, payé.
 *
 * Ce n'est pas la « capacité supplémentaire » retirée : celle-ci vendait un
 * bonus de capacité machine contre un coût fixe par tour, utilisé ou non, sans
 * personnel pour le faire tourner.
 */

/** Le coût d'une commande de `q` unités au barème. */
export function coutAuBareme(q: number, tranches: readonly TrancheDeSousTraitance[]): number {
  let reste = Math.max(0, q);
  let bas = 0;
  let cout = 0;
  for (const t of tranches) {
    if (reste <= 0) break;
    const largeur = t.jusqua === undefined ? reste : Math.max(0, t.jusqua - bas);
    const n = Math.min(reste, largeur);
    cout += n * t.prix;
    reste -= n;
    if (t.jusqua !== undefined) bas = t.jusqua;
  }
  // Un barème dont la dernière tranche est bornée : au-delà, son prix.
  if (reste > 0 && tranches.length > 0) cout += reste * tranches[tranches.length - 1]!.prix;
  return cout;
}

export interface CommandeDuTour {
  /** Unités livrées, par référence, dans l'ordre de la gamme. */
  unites: number[];
  /** Coût de la commande, par référence. */
  couts: number[];
  total: number;
  /** Qualité des unités livrées, par référence (absente : celle du sous-traitant). */
  qualites?: number[];
}

/**
 * La commande retenue : bornée au plafond du sous-traitant, nulle pour une
 * référence qu'il ne fait pas. `null` quand rien n'est commandé : le tour suit
 * alors son chemin d'avant.
 */
export function commandeDuTour(
  cfg: ConfigDeGroupe["sousTraitance"],
  codes: readonly ProductCode[],
  decision: Record<ProductCode, number> | undefined,
): CommandeDuTour | null {
  if (!cfg || !decision) return null;
  const unites = codes.map((c) => {
    const ref = cfg[c];
    const q = Number(decision[c] ?? 0);
    return ref && Number.isFinite(q) && q > 0 ? Math.min(q, ref.plafond) : 0;
  });
  if (unites.every((u) => u <= 0)) return null;
  const couts = codes.map((c, k) => (unites[k]! > 0 ? coutAuBareme(unites[k]!, cfg[c]!.tranches) : 0));
  return { unites, couts, total: couts.reduce((s, x) => s + x, 0) };
}

/**
 * Deux commandes de produits finis du même tour (le sous-traitant, une
 * filiale étrangère qui fabrique) n'en font qu'une pour le stock : unités et
 * coûts s'additionnent, la qualité se pondère par les unités.
 */
export function fusionnerLesCommandes(
  a: CommandeDuTour | null,
  b: (CommandeDuTour & { qualite?: number }) | null,
  qualiteDeA: (k: number) => number = () => 1,
): CommandeDuTour | null {
  if (!b) return a;
  const qb = (k: number) => b.qualites?.[k] ?? b.qualite ?? 1;
  if (!a) return { unites: b.unites, couts: b.couts, total: b.total, qualites: b.unites.map((_, k) => qb(k)) };
  const unites = a.unites.map((u, k) => u + (b.unites[k] ?? 0));
  return {
    unites,
    couts: a.couts.map((c, k) => c + (b.couts[k] ?? 0)),
    total: a.total + b.total,
    qualites: unites.map((u, k) =>
      u > 0 ? ((a.qualites?.[k] ?? qualiteDeA(k)) * a.unites[k]! + qb(k) * (b.unites[k] ?? 0)) / u : 1,
    ),
  };
}
