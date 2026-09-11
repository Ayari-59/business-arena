/** Formatage FR — utilitaires d'affichage (aucune logique métier ici). */
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

const eurCents = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatEuro = (v: number) => eur.format(v);
/** Un prix à l'unité, au centime : 9,50 € et 8,55 € ne sont pas le même prix d'achat. */
export const formatEuroCents = (v: number) => eurCents.format(v);
export const formatUnits = (v: number) => num.format(Math.round(v));
export const formatPercent = (v: number) => pct.format(v);

/**
 * Un nombre et son nom, accordés : « 1 équipe », « 3 équipes », « 0 équipe ».
 * En français, le pluriel commence à deux.
 */
export const compter = (n: number, singulier: string, pluriel = `${singulier}s`) =>
  `${num.format(n)} ${n >= 2 ? pluriel : singulier}`;
