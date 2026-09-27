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

/**
 * QUAND LA PARTIE A ÉTÉ CRÉÉE, en aussi peu de mots que possible.
 *
 * Sur une liste de parties d'une même classe, la date est ce qui les
 * distingue après le nom. Une date complète — « 26/09/2026 » — se lit mal et
 * occupe une ligne que la carte n'a pas. Dans la semaine écoulée, le jour
 * suffit (« jeudi ») ; au-delà, le jour et le mois (« 12 mars ») ; passé
 * l'année, l'année s'ajoute.
 *
 * Heure de Paris, toujours : le serveur qui rend la page n'est pas en France,
 * et une partie créée à 23 h datait de la veille pour l'enseignant.
 */
export function jourDeCreation(quand: Date, maintenant: Date = new Date()): string {
  const jours = Math.floor((maintenant.getTime() - quand.getTime()) / 86_400_000);
  const options: Intl.DateTimeFormatOptions =
    jours < 7
      ? { weekday: "long" }
      : maintenant.getUTCFullYear() === quand.getUTCFullYear()
        ? { day: "numeric", month: "long" }
        : { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(quand);
}
