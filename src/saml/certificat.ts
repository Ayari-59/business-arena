import { createHash, createPrivateKey, createPublicKey, randomBytes, sign, X509Certificate, type KeyObject } from "node:crypto";

/**
 * LES CERTIFICATS DU FOURNISSEUR DE SERVICES, ET CEUX QU'ON LIT DANS LES MÉTADONNÉES.
 *
 * Une fédération SAML n'utilise un certificat que comme enveloppe de clé publique : ce
 * qui fait foi, c'est la clé publiée dans les métadonnées enregistrées. Un certificat
 * AUTO-SIGNÉ, de longue durée, est donc la norme (RENATER l'accepte, eduGAIN aussi).
 *
 * Node sait lire un certificat (`X509Certificate`) mais pas en fabriquer : la fonction
 * `certificatAutoSigne` en assemble un au format X.509 v1 (DER), sans extension, signé
 * RSA-SHA256 par sa propre clé. Elle sert au script `scripts/saml-cle.mts` et aux tests
 * (pour ne jamais garder de clé privée dans le dépôt). Ce n'est PAS de la vérification :
 * celle des signatures XML est faite par `xml-crypto` (agrégat) et `@node-saml/node-saml`
 * (réponses).
 */

/* --- DER minimal : longueur, TLV ------------------------------------------------ */

function longueur(n: number): Buffer {
  if (n < 0x80) return Buffer.from([n]);
  const octets: number[] = [];
  let reste = n;
  while (reste > 0) {
    octets.unshift(reste & 0xff);
    reste >>= 8;
  }
  return Buffer.from([0x80 | octets.length, ...octets]);
}

const tlv = (tag: number, contenu: Buffer) => Buffer.concat([Buffer.from([tag]), longueur(contenu.length), contenu]);
const sequence = (...parties: Buffer[]) => tlv(0x30, Buffer.concat(parties));
const ensemble = (...parties: Buffer[]) => tlv(0x31, Buffer.concat(parties));
const entier = (octets: Buffer) => tlv(0x02, octets[0]! & 0x80 ? Buffer.concat([Buffer.from([0]), octets]) : octets);
const nul = () => Buffer.from([0x05, 0x00]);
const utf8 = (s: string) => tlv(0x0c, Buffer.from(s, "utf8"));
const chaineDeBits = (octets: Buffer) => tlv(0x03, Buffer.concat([Buffer.from([0]), octets]));

function oid(pointe: string): Buffer {
  const n = pointe.split(".").map(Number);
  const octets: number[] = [n[0]! * 40 + n[1]!];
  for (const v of n.slice(2)) {
    const groupe: number[] = [v & 0x7f];
    let reste = Math.floor(v / 128);
    while (reste > 0) {
      groupe.unshift((reste & 0x7f) | 0x80);
      reste = Math.floor(reste / 128);
    }
    octets.push(...groupe);
  }
  return tlv(0x06, Buffer.from(octets));
}

/** UTCTime jusqu'en 2049, GeneralizedTime au-delà (RFC 5280, 4.1.2.5). */
function date(d: Date): Buffer {
  const iso = d.toISOString().replace(/[-:T]/g, "").slice(0, 14) + "Z";
  return d.getUTCFullYear() < 2050 ? tlv(0x17, Buffer.from(iso.slice(2), "ascii")) : tlv(0x18, Buffer.from(iso, "ascii"));
}

const SHA256_AVEC_RSA = "1.2.840.113549.1.1.11";
const NOM_COMMUN = "2.5.4.3";

/** Un certificat X.509 v1 auto-signé (RSA-SHA256) pour cette paire de clés, en PEM. */
export function certificatAutoSigne(args: {
  clePrivee: KeyObject | string;
  nomCommun: string;
  dureeJours: number;
  debut?: Date;
}): string {
  const privee = typeof args.clePrivee === "string" ? createPrivateKey(args.clePrivee) : args.clePrivee;
  const publique = createPublicKey(privee);
  const debut = args.debut ?? new Date(Date.now() - 60_000);
  const fin = new Date(debut.getTime() + args.dureeJours * 24 * 60 * 60 * 1000);
  const nom = sequence(ensemble(sequence(oid(NOM_COMMUN), utf8(args.nomCommun))));
  const algorithme = sequence(oid(SHA256_AVEC_RSA), nul());
  const serie = randomBytes(16);
  serie[0] = serie[0]! & 0x7f || 0x01;
  const tbs = sequence(
    entier(serie),
    algorithme,
    nom,
    sequence(date(debut), date(fin)),
    nom,
    publique.export({ type: "spki", format: "der" }),
  );
  const signature = sign("sha256", tbs, privee);
  const der = sequence(tbs, algorithme, chaineDeBits(signature));
  return derEnPem(der);
}

/* --- PEM ------------------------------------------------------------------------ */

export function derEnPem(der: Buffer): string {
  const b64 = der.toString("base64").replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`;
}

/** Le contenu base64 d'un certificat (sans en-tête ni blancs), tel que l'écrivent les métadonnées. */
export function corpsDuCertificat(pem: string): string {
  return pem
    .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
}

/** Un certificat donné en base64 nu (métadonnées) ou en PEM, rendu en PEM ; null s'il est illisible. */
export function enPem(certificat: string): string | null {
  const corps = corpsDuCertificat(certificat);
  if (!corps || !/^[A-Za-z0-9+/=]+$/.test(corps)) return null;
  try {
    const pem = derEnPem(Buffer.from(corps, "base64"));
    new X509Certificate(pem);
    return pem;
  } catch {
    return null;
  }
}

/** L'empreinte SHA-256 d'un certificat, en hexadécimal majuscule séparé par « : » (forme d'openssl). */
export function empreinteSha256(pem: string): string {
  const der = Buffer.from(corpsDuCertificat(pem), "base64");
  return createHash("sha256")
    .update(der)
    .digest("hex")
    .toUpperCase()
    .replace(/(..)(?!$)/g, "$1:");
}

/** Deux empreintes égales, quelle que soit leur écriture (« AB:CD… » ou « abcd… »). */
export function memeEmpreinte(a: string, b: string): boolean {
  const net = (s: string) => s.replace(/[^0-9a-f]/gi, "").toLowerCase();
  return net(a).length === 64 && net(a) === net(b);
}

/**
 * Une clé ou un certificat PEM tel qu'on le colle dans une variable d'environnement :
 * les « \n » écrits en toutes lettres redeviennent des retours à la ligne.
 */
export function pemDeLEnvironnement(valeur: string | undefined): string | null {
  const v = valeur?.trim();
  if (!v) return null;
  return v.includes("\\n") ? v.replace(/\\n/g, "\n") : v;
}
