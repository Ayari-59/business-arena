import { describe, expect, it } from "vitest";
import { adresseDeRetour } from "@/app/api/google/oauth";

/** L'adresse de retour est celle du site en production, celle du poste en local. */
describe("adresse de retour OAuth", () => {
  it("le site en production, quel que soit l'hôte du déploiement", () => {
    expect(adresseDeRetour(new Request("https://business-arena.vercel.app/api/google/connect"))).toBe(
      "https://www.business-arena.fr/api/google/callback",
    );
    expect(adresseDeRetour(new Request("https://www.business-arena.fr/api/google/connect"))).toBe(
      "https://www.business-arena.fr/api/google/callback",
    );
  });
  it("le poste en développement", () => {
    expect(adresseDeRetour(new Request("http://localhost:3062/api/google/connect"))).toBe(
      "http://localhost:3062/api/google/callback",
    );
  });
});
