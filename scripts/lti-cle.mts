/**
 * TIRER LA CLÉ DE L'OUTIL LTI (RS256), POUR LA PRODUCTION.
 *
 *   npx tsx scripts/lti-cle.mts
 *
 * Écrit la clé privée dans un fichier hors du dépôt (`~/business-arena-lti-<date>.pem`,
 * droits 600) et affiche ce qu'il faut faire : la coller dans Vercel comme variable
 * d'environnement `LTI_PRIVATE_KEY` (Production), puis effacer le fichier. La clé ne
 * s'affiche jamais à l'écran et ne doit jamais entrer dans le dépôt.
 *
 * Rotation : avant de remplacer la clé, copier la ligne « clé publique » de l'ancienne
 * (le JWKS publié la montre) dans `LTI_PREVIOUS_PUBLIC_KEYS`, au format PEM.
 */
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { jwkPublic } from "../src/lti/cles";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const chemin = join(homedir(), `business-arena-lti-${new Date().toISOString().slice(0, 10)}.pem`);
writeFileSync(chemin, pem, { mode: 0o600 });
const { kid } = jwkPublic(publicKey);

console.log(`Clé privée écrite dans ${chemin} (droits 600).`);
console.log(`Identifiant de clé (kid) : ${kid}`);
console.log("");
console.log("1. Vercel, projet business-arena, Settings, Environment Variables :");
console.log("   nom LTI_PRIVATE_KEY, valeur : le contenu du fichier (lignes BEGIN et END comprises),");
console.log("   environnement Production (et Preview si l'on veut tester LTI en préversion).");
console.log("2. Redéployer, puis vérifier que /api/lti/jwks montre ce kid.");
console.log(`3. Effacer le fichier : rm ${chemin}`);
console.log("");
console.log("Clé publique correspondante (à garder pour une future rotation) :");
console.log(publicKey.export({ format: "pem", type: "spki" }).toString());
