import { jourDeCreation } from "./format";

/**
 * QUAND UN ÉLÈVE A TRAVAILLÉ POUR LA DERNIÈRE FOIS, en aussi peu de mots que possible (audit UX du
 * 11 novembre 2026, P1-2 : la ligne de chaque élève, en tête du suivi de la classe). Dans l'heure, les
 * minutes ; le jour même et la veille, l'heure ; au-delà, le jour (lib/format.ts, `jourDeCreation`).
 * Heure de Paris, toujours : le serveur qui rend la page n'est pas en France. Une heure ou une durée
 * ne se coupe pas en fin de ligne (« 09 h 05 », « 5 min » : espaces insécables), la colonne est étroite
 * sur téléphone.
 */
export function momentDeLActivite(quand: Date, maintenant: Date = new Date()): string {
  const minutes = Math.floor((maintenant.getTime() - quand.getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}\u00a0min`;
  const jour = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short" }).format(d);
  const heure = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" })
    .format(quand)
    .replace(":", "\u00a0h\u00a0");
  if (jour(quand) === jour(maintenant)) return `aujourd'hui à ${heure}`;
  if (jour(quand) === jour(new Date(maintenant.getTime() - 86_400_000))) return `hier à ${heure}`;
  return jourDeCreation(quand, maintenant);
}
