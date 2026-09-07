/**
 * Conversion entre la saisie `<input type="datetime-local">` (comprise en heure
 * de Paris, ce que l'enseignant lit) et l'instant UTC stocké en base.
 *
 * On n'embarque pas de bibliothèque de fuseaux : `Intl` connaît déjà
 * « Europe/Paris » et son heure d'été. Le décalage se calcule À la date
 * concernée (il change entre mars et novembre), donc on le mesure sur l'instant
 * lui-même plutôt que d'appliquer un +1/+2 fixe.
 */

const PARIS = "Europe/Paris";

/** « 2026-03-12T18:00 » (heure de Paris) → Date UTC. Null si vide/invalide. */
export function parisLocalToUtc(local: string | null | undefined): Date | null {
  if (!local) return null;
  const asUtc = new Date(`${local}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  // Heure murale de Paris correspondant à cet instant traité comme UTC.
  const wall = new Date(asUtc.toLocaleString("en-US", { timeZone: PARIS }));
  const offset = asUtc.getTime() - wall.getTime();
  return new Date(asUtc.getTime() + offset);
}

/** Date UTC → « 2026-03-12T18:00 » (heure de Paris) pour un <input>. Vide si null. */
export function utcToParisLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // Certains moteurs rendent « 24 » pour minuit : on ramène à « 00 ».
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
