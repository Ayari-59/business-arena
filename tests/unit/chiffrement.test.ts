import { describe, expect, it } from "vitest";
import { chiffrer, dechiffrer } from "@/lib/chiffrement";

/**
 * UN SECRET EN BASE NE SE LIT QU'AVEC LE SECRET DE L'HÉBERGEMENT.
 * Aller-retour exact, valeur différente à chaque chiffrement (IV aléatoire),
 * illisible avec une autre clé, illisible si altérée.
 */
describe("chiffrement", () => {
  it("aller-retour, jamais le même chiffré", () => {
    const a = chiffrer("1//jeton-secret", "cle-hebergement");
    const b = chiffrer("1//jeton-secret", "cle-hebergement");
    expect(a).not.toBe(b);
    expect(a.startsWith("v1.")).toBe(true);
    expect(a).not.toContain("jeton-secret");
    expect(dechiffrer(a, "cle-hebergement")).toBe("1//jeton-secret");
    expect(dechiffrer(b, "cle-hebergement")).toBe("1//jeton-secret");
  });

  it("mauvaise clé, valeur altérée, format inconnu : null, jamais d'exception", () => {
    const a = chiffrer("1//jeton-secret", "cle-hebergement");
    expect(dechiffrer(a, "autre-cle")).toBeNull();
    const [v, iv, tag, data] = a.split(".");
    expect(dechiffrer([v, iv, tag, data!.slice(0, -2) + "AA"].join("."), "cle-hebergement")).toBeNull();
    expect(dechiffrer("n'importe quoi", "cle-hebergement")).toBeNull();
    expect(dechiffrer("", "cle-hebergement")).toBeNull();
  });
});
