import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * CHIFFRER UNE VALEUR AVANT DE LA POSER EN BASE.
 *
 * Le jeton qui donne accès à l'agenda Google se garde en base, pas dans
 * l'environnement : c'est ce qui permet de connecter l'agenda d'un clic
 * depuis l'administration, sans manipuler de valeur à la main. Mais une
 * copie de la base ne doit pas suffire à lire l'agenda : la valeur est
 * chiffrée avec une clé dérivée du secret de l'hébergement (AUTH_SECRET),
 * qui n'est pas en base. AES-256-GCM : chiffré ET authentifié, une valeur
 * altérée ne se déchiffre pas.
 *
 * Format : `v1.<iv>.<étiquette>.<données>`, en base64url.
 */
const VERSION = "v1";

const cle = (secret: string) => createHash("sha256").update(secret).digest();

export function chiffrer(texte: string, secret: string): string {
  const iv = randomBytes(12);
  const chiffre = createCipheriv("aes-256-gcm", cle(secret), iv);
  const donnees = Buffer.concat([chiffre.update(texte, "utf8"), chiffre.final()]);
  const etiquette = chiffre.getAuthTag();
  return [VERSION, iv, etiquette, donnees].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

/** Null si le format est inconnu, la clé mauvaise ou la valeur altérée. */
export function dechiffrer(blob: string, secret: string): string | null {
  const [version, iv, etiquette, donnees] = blob.split(".");
  if (version !== VERSION || !iv || !etiquette || !donnees) return null;
  try {
    const dechiffre = createDecipheriv("aes-256-gcm", cle(secret), Buffer.from(iv, "base64url"));
    dechiffre.setAuthTag(Buffer.from(etiquette, "base64url"));
    return Buffer.concat([dechiffre.update(Buffer.from(donnees, "base64url")), dechiffre.final()]).toString("utf8");
  } catch {
    return null;
  }
}
