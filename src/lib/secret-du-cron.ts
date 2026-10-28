import { createHash, timingSafeEqual } from "node:crypto";

/**
 * L'APPEL DE LA TÂCHE PLANIFIÉE EST-IL LÉGITIME ?
 *
 * Vercel appelle les tâches de vercel.json avec l'en-tête
 * `Authorization: Bearer <CRON_SECRET>`, la variable étant réglée dans l'hébergement.
 * Sans variable, tout est refusé : une route qui supprime des données ne s'ouvre
 * jamais par défaut. La comparaison se fait sur des empreintes de même longueur, en
 * temps constant.
 */
export function appelDuCronAutorise(entete: string | null, secret: string | undefined): boolean {
  const attendu = secret?.trim();
  if (!attendu) return false;
  if (!entete) return false;
  const empreinte = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(empreinte(entete), empreinte(`Bearer ${attendu}`));
}
