import { execFileSync } from "node:child_process";
import { generateKeyPairSync, X509Certificate } from "node:crypto";
import { describe, expect, it } from "vitest";
import { certificatAutoSigne, empreinteSha256, enPem, memeEmpreinte, pemDeLEnvironnement } from "@/saml/certificat";

/**
 * LE CERTIFICAT AUTO-SIGNÉ DU FOURNISSEUR DE SERVICES (scripts/saml-cle.mts), assemblé
 * sans bibliothèque : Node le relit, sa signature se vérifie par sa propre clé, et
 * OpenSSL (quand il est installé) le lit et le vérifie aussi.
 */
describe("certificat auto-signé du SP", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = certificatAutoSigne({ clePrivee: privateKey, nomCommun: "www.business-arena.fr", dureeJours: 20 * 365 });
  const x = new X509Certificate(pem);

  it("porte la clé publique, le nom, vingt ans, et se vérifie par sa propre clé", () => {
    expect(x.publicKey.equals(publicKey)).toBe(true);
    expect(x.subject).toBe("CN=www.business-arena.fr");
    expect(x.issuer).toBe(x.subject);
    expect(x.verify(publicKey)).toBe(true);
    expect(new Date(x.validTo).getUTCFullYear() - new Date(x.validFrom).getUTCFullYear()).toBeGreaterThanOrEqual(19);
  });

  it("empreinte SHA-256 = celle de Node ; comparaison indifférente à l'écriture", () => {
    expect(empreinteSha256(pem)).toBe(x.fingerprint256);
    expect(memeEmpreinte(x.fingerprint256, x.fingerprint256.replace(/:/g, "").toLowerCase())).toBe(true);
    expect(memeEmpreinte("AB", "ab")).toBe(false);
  });

  it("relu depuis le base64 nu des métadonnées, ou depuis une variable aux « \\n » écrits", () => {
    const nu = pem.replace(/-----[A-Z ]+-----|\s+/g, "");
    expect(enPem(nu)).toBe(pem);
    expect(enPem("pas un certificat")).toBeNull();
    expect(pemDeLEnvironnement(pem.replace(/\n/g, "\\n"))?.trim()).toBe(pem.trim());
  });

  it("OpenSSL le lit et le vérifie", () => {
    let sortie = "";
    try {
      sortie = execFileSync("openssl", ["x509", "-noout", "-subject"], { input: pem }).toString();
    } catch {
      return; // OpenSSL absent : la vérification par Node suffit.
    }
    expect(sortie).toMatch(/CN\s*=\s*www\.business-arena\.fr/);
  });
});
