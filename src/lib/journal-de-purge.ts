import type { BilanDePurge } from "@/services/purge.service";

/**
 * LE JOURNAL DE LA PURGE DE CHAQUE NUIT : la preuve qu'elle tourne.
 *
 * Une ligne JSON par exécution autorisée, dans le journal de l'hébergement, repérable
 * par `"evenement":"purge-rgpd"`. Elle ne porte que la date, la durée et des compteurs ;
 * en cas d'échec, l'étape en cause et un message dont les adresses e-mail et IP sont
 * masquées. Jamais de donnée personnelle ni de secret.
 */

/** Le message d'une erreur, sans adresse e-mail ni adresse IP, et borné en longueur. */
export function messageSansDonneePersonnelle(e: unknown): string {
  const brut = e instanceof Error ? e.message : String(e);
  return brut
    .replace(/[^\s@()'"=<>,;:]+@[^\s@()'"=<>,;:]+/g, "[adresse masquée]")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "[ip masquée]")
    .replace(/\b(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{1,4}\b/gi, "[ip masquée]")
    .slice(0, 300);
}

export function journaliserPurgeReussie(args: { debut: Date; fin: Date; bilan: BilanDePurge }): void {
  console.info(
    JSON.stringify({
      evenement: "purge-rgpd",
      statut: "ok",
      le: args.debut.toISOString(),
      dureeMs: args.fin.getTime() - args.debut.getTime(),
      lignes: args.bilan,
    }),
  );
}

export function journaliserPurgeEchouee(args: { debut: Date; fin: Date; categorie: string; erreur: unknown }): void {
  console.error(
    JSON.stringify({
      evenement: "purge-rgpd",
      statut: "echec",
      le: args.debut.toISOString(),
      dureeMs: args.fin.getTime() - args.debut.getTime(),
      categorie: args.categorie,
      message: messageSansDonneePersonnelle(args.erreur),
    }),
  );
}
