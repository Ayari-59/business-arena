import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { Enveloppe, Lettre } from "@/components/courrier";
import { courrierParCode } from "@/config/courriers/registre";

/**
 * L'ENVELOPPE ET SA LETTRE SONT LE MÊME PAPIER.
 *
 * C'est la règle d'harmonie : ce qui sort de l'enveloppe doit être de la même
 * matière qu'elle, et se repérer aux mêmes endroits — expéditeur en haut à
 * gauche, référence en bas à droite. Le reste distingue les trois plis.
 */
const enveloppe = (code: string) =>
  renderToStaticMarkup(
    createElement(Enveloppe, { code, liasse: "NOVA", destinataire: "L'entreprise" }),
  );
const lettre = (code: string) =>
  renderToStaticMarkup(createElement(Lettre, { code, destinataire: "L'entreprise" }));

describe("l'harmonie du pli", () => {
  it("l'enveloppe et la lettre partagent le papier, l'expéditeur et la référence", () => {
    const code = "bank_penalties";
    const expediteur = courrierParCode.get(code)!.expediteur;
    for (const html of [enveloppe(code), lettre(code)]) {
      expect(html).toContain("papier");
      expect(html).toContain(expediteur);
      expect(html).toContain("NOVA-16/30");
    }
  });

  it("aucun utilitaire de couleur du site ne traverse le papier", () => {
    // Le thème clair inverse toute la palette : une classe `text-slate-…` ou
    // `bg-amber-…` à l'intérieur du papier s'inverserait avec le site, alors
    // qu'une lettre posée sur un bureau garde sa couleur.
    for (const html of [enveloppe("bank_penalties"), lettre("bank_penalties")]) {
      expect(html).not.toMatch(/class="[^"]*\b(?:text|bg|border)-(?:slate|amber|sky|emerald|fuchsia|red)-\d/);
    }
  });
});

describe("les trois plis se reconnaissent avant d'être lus", () => {
  it("le recommandé porte sa bande rouge et son timbre", () => {
    const html = enveloppe("bank_penalties");
    expect(html).toContain("Recommandé A.R.");
    expect(html).toContain("enveloppe-timbre");
    expect(html).not.toContain("enveloppe-circulation");
    const l = lettre("bank_penalties");
    expect(l).toContain("Lettre recommandée avec accusé de réception");
    expect(l).toContain("Madame, Monsieur,");
    expect(l).toContain("Veuillez agréer");
  });

  it("le pli simple n'a pas de bande, mais garde son timbre", () => {
    const html = enveloppe("nova_press_award");
    expect(html).not.toContain("Recommandé A.R.");
    expect(html).not.toContain("Diffusion interne");
    expect(html).toContain("enveloppe-timbre");
  });

  it("la note de service circule sans timbre, dans sa pochette", () => {
    const html = enveloppe("machine_breakdown");
    expect(html).not.toContain("enveloppe-timbre");
    expect(html).toContain("enveloppe-circulation");
    expect(html).toContain("Diffusion interne");
    expect(html).toContain("Note de service");
    // et la lettre n'écrit pas « Madame, Monsieur » à son propre atelier
    const l = lettre("machine_breakdown");
    expect(l).not.toContain("Madame, Monsieur,");
    expect(l).not.toContain("Veuillez agréer");
    expect(l).toContain("Le chef d&#x27;atelier");
    expect(l).toContain("Note de service — diffusion interne");
  });
});
