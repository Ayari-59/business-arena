/**
 * Formatage FR — utilitaires d'affichage (aucune logique métier ici).
 *
 * LE FORMATEUR UNIQUE DES NOMBRES. L'arène écrivait « -294 € » avec un trait
 * d'union, les épisodes « −10,6 % » avec le vrai signe moins ; l'IPG sortait
 * en « 64.1 » avec un point ; un rang se lisait « 1ᵉ sur 3 » ici, « 1re »
 * ailleurs. Tout chiffre affiché passe donc par ici : Intl `fr-FR` (espace
 * fine, virgule décimale), le signe moins typographique U+2212, et les
 * ordinaux et pluriels accordés.
 */
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

/** Le signe moins typographique : Intl `fr-FR` rend un trait d'union (U+002D). */
export const MOINS = "\u2212";
const avecMoins = (s: string) => s.replace(/^-/, MOINS);

export const formatEuro = (v: number) => avecMoins(eur.format(v));
/** Un prix à l'unité, au centime : 9,50 € et 8,55 € ne sont pas le même prix d'achat. */
export const formatEuroCents = (v: number) => avecMoins(eurCents.format(v));
export const formatUnits = (v: number) => avecMoins(num.format(Math.round(v)));
export const formatPercent = (v: number) => avecMoins(pct.format(v));

const decimales = new Map<number, Intl.NumberFormat>();
/**
 * Un nombre décimal à la française, à `chiffres` décimales fixes : l'IPG
 * « 64,1 » et non « 64.1 ».
 */
export function formatDecimal(v: number, chiffres = 1): string {
  let f = decimales.get(chiffres);
  if (!f) {
    f = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: chiffres,
      maximumFractionDigits: chiffres,
    });
    decimales.set(chiffres, f);
  }
  return avecMoins(f.format(v));
}

/**
 * Le rang à la française : « 1er » ou « 1re » selon le genre du nom qu'il
 * qualifie (« 1re place », « 1er sur 3 »), puis « 2e », « 3e »…
 */
export function ordinal(n: number, genre: "m" | "f" = "f"): string {
  if (n === 1) return genre === "m" ? "1er" : "1re";
  return `${n}e`;
}

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
