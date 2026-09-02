/** Formatage FR — utilitaires d'affichage (aucune logique métier ici). */
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

export const formatEuro = (v: number) => eur.format(v);
export const formatUnits = (v: number) => num.format(Math.round(v));
export const formatPercent = (v: number) => pct.format(v);

/**
 * Un nombre et son nom, accordés : « 1 équipe », « 3 équipes », « 0 équipe ».
 * En français, le pluriel commence à deux.
 */
export const compter = (n: number, singulier: string, pluriel = `${singulier}s`) =>
  `${num.format(n)} ${n >= 2 ? pluriel : singulier}`;
