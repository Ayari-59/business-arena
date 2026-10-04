/** Formats de l'épisode : des milliers d'euros, des taux au dixième, en français. */
export const kE = (v: number) => `${Math.round(v / 1000).toLocaleString("fr-FR")} k€`;
export const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
export const taux = (v: number, d = 1) =>
  `${(v * 100).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
export const nombre = (v: number, d = 1) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });
