import { describe, expect, it } from "vitest";
import { messageDeLaCohorte, messageDeLaPartie } from "@/lib/message-cahier-de-textes";
import { urlDeJonction } from "@/lib/qr";

/**
 * LE MESSAGE À COLLER DANS PRONOTE OU ÉCOLE DIRECTE.
 *
 * L'élève le lit dans son cahier de textes, sans l'enseignant à côté : il doit
 * y trouver le lien direct, le code pour qui tape à la main, et la promesse
 * qu'aucun compte n'est demandé. Rien d'autre (ni nom, ni e-mail).
 */
describe("le message pour le cahier de textes", () => {
  it("d'une partie : le lien direct, le code, sans compte", () => {
    const lien = urlDeJonction("ABC123");
    const m = messageDeLaPartie("NOVA · Prenez les commandes", lien, "ABC123");
    expect(m).toContain(lien);
    expect(m).toContain("ABC123");
    expect(m).toMatch(/Pas de compte/);
    expect(m).toContain("« NOVA · Prenez les commandes »");
    expect(lien.startsWith("https://")).toBe(true);
  });

  it("d'une cohorte : le lien, le code et le code de reprise annoncé", () => {
    const m = messageDeLaCohorte("BTS MCO 2", "https://www.business-arena.fr/entreprises/episode/rejoindre?code=BTS-PWR6", "BTS-PWR6");
    expect(m).toContain("rejoindre?code=BTS-PWR6");
    expect(m).toContain("BTS-PWR6");
    expect(m).toMatch(/code de reprise/);
  });

  it("tient en quatre lignes, sans e-mail ni nom", () => {
    const m = messageDeLaPartie("NOVA", urlDeJonction("X1"), "X1");
    expect(m.split("\n")).toHaveLength(4);
    expect(m).not.toMatch(/@|e-mail|courriel/i);
  });
});
