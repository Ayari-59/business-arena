/** Formats des épisodes : des milliers d'euros, des taux au dixième, en français. */

/** Un signe moins typographique, pas un trait d'union. */
const signe = (v: number) => (v < 0 ? "−" : "");

export const kE = (v: number) =>
  `${signe(Math.round(v / 1000))}${Math.abs(Math.round(v / 1000)).toLocaleString("fr-FR")} k€`;
export const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
export const taux = (v: number, d = 1) =>
  `${(v * 100).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
export const nombre = (v: number, d = 1) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });
