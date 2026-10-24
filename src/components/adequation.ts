import type { Adequation } from "@/config/couverture";

/**
 * LA PASTILLE D'ADÉQUATION D'UN BLOC, la même sur la page des parcours et sur
 * la page de chaque diplôme : un même mot doit avoir la même couleur partout
 * où un enseignant le croise, sinon il se demande si c'est le même jugement.
 */
export const PASTILLE_D_ADEQUATION: Record<
  Adequation,
  { label: string; className: string }
> = {
  coeur: {
    label: "cœur du jeu",
    className: "border-emerald-400 text-emerald-300",
  },
  couvert: { label: "couvert", className: "border-white/10 text-sky-300" },
  partiel: {
    label: "partiel",
    className: "border-slate-400/40 text-slate-400",
  },
};
