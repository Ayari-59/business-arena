import { hkdfSync } from "node:crypto";
import { authSecret } from "@/lib/auth-secret";

/**
 * UNE CLÉ PAR USAGE, DÉRIVÉE D'AUTH_SECRET.
 *
 * Constaté (audit d'octobre 2026, P2-7) : la session enseignant et le cookie invité
 * signaient avec AUTH_SECRET lui-même, par la même fonction. Une signature obtenue pour un
 * usage valait donc pour l'autre, si un jour leurs formats se rencontraient. Chaque usage
 * reçoit maintenant sa propre clé, dérivée par HKDF-SHA256 avec un libellé qui le nomme :
 * aucune variable d'environnement nouvelle, et une clé ne dit rien des autres.
 *
 * Changer un libellé change la clé : les jetons déjà émis cessent d'être reconnus. On
 * ajoute donc une version au libellé, on ne le récrit pas.
 */
export const USAGES_DES_CLES = {
  session: "business-arena/session-enseignant/v1",
  invite: "business-arena/cookie-invite/v1",
} as const;

export type UsageDeCle = keyof typeof USAGES_DES_CLES;

/** La clé de cet usage, en hexadécimal (32 octets). Pure : la racine se passe en test. */
export function cleDerivee(usage: UsageDeCle, racine: string = authSecret()): string {
  return Buffer.from(hkdfSync("sha256", racine, "", USAGES_DES_CLES[usage], 32)).toString("hex");
}
