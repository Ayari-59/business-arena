/**
 * TIRER LA CLÉ ET LE CERTIFICAT DU FOURNISSEUR DE SERVICES SAML (connexion RENATER).
 *
 *   npx tsx scripts/saml-cle.mts
 *
 * Écrit hors du dépôt, dans le dossier personnel, en droits 600 :
 *   · ~/business-arena-saml-<date>.key.pem : la clé privée RSA 3072 (SAML_SP_PRIVATE_KEY) ;
 *   · ~/business-arena-saml-<date>.cert.pem : son certificat auto-signé, 20 ans
 *     (SAML_SP_CERT), que les fédérations acceptent : seule compte la clé publiée dans
 *     les métadonnées enregistrées.
 * La clé privée ne s'affiche jamais à l'écran et ne doit jamais entrer dans le dépôt.
 * Le même couple signe les demandes et déchiffre les assertions.
 */
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { certificatAutoSigne, empreinteSha256 } from "../src/saml/certificat";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 3072 });
const date = new Date().toISOString().slice(0, 10);
const cheminCle = join(homedir(), `business-arena-saml-${date}.key.pem`);
const cheminCert = join(homedir(), `business-arena-saml-${date}.cert.pem`);
const certificat = certificatAutoSigne({ clePrivee: privateKey, nomCommun: "www.business-arena.fr", dureeJours: 20 * 365 });
writeFileSync(cheminCle, privateKey.export({ format: "pem", type: "pkcs8" }).toString(), { mode: 0o600 });
writeFileSync(cheminCert, certificat, { mode: 0o600 });

console.log(`Clé privée écrite dans ${cheminCle} (droits 600).`);
console.log(`Certificat écrit dans ${cheminCert}.`);
console.log(`Empreinte SHA-256 du certificat : ${empreinteSha256(certificat)}`);
console.log("");
console.log("1. Vercel, projet business-arena, Settings, Environment Variables (Production) :");
console.log("   SAML_SP_PRIVATE_KEY = le contenu du fichier .key.pem (lignes BEGIN et END comprises) ;");
console.log("   SAML_SP_CERT        = le contenu du fichier .cert.pem.");
console.log("2. Poser aussi SAML_FEDERATION_CERT_SHA256 (l'empreinte du certificat de signature de RENATER),");
console.log("   puis redéployer et ouvrir /api/saml/metadata : le certificat ci-dessus doit y figurer.");
console.log("3. Déclarer le fournisseur de services dans le registre de la fédération avec cette adresse.");
console.log(`4. Effacer la clé du disque : rm ${cheminCle}`);
