import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { TeamNameForm } from "@/components/team-name-form";

/**
 * LE PANNEAU DE NOMMAGE SERT AUSSI À CORRIGER.
 *
 * Il se fermait dès le premier nom adopté : une coquille suivait l'équipe
 * jusqu'au relevé de notes. Il reste ouvert tout le premier tour, et change
 * de discours quand l'équipe a déjà choisi.
 */
describe("le nom de l'entreprise", () => {
  it("équipe encore anonyme : on l'invite à choisir, le champ est vide", () => {
    const html = renderToStaticMarkup(
      createElement(TeamNameForm, { gameId: "g", nomActuel: "Équipe 3", dejaNommee: false }),
    );
    expect(html).toContain("Nommez votre entreprise");
    expect(html).toContain("Adopter ce nom");
    expect(html).not.toContain('value="Équipe 3"');
  });

  it("équipe déjà nommée : on propose la correction, le nom est pré-rempli", () => {
    const html = renderToStaticMarkup(
      createElement(TeamNameForm, {
        gameId: "g",
        nomActuel: "Fromagerie du Pon",
        dejaNommee: true,
      }),
    );
    expect(html).toContain("Corrigez le nom de votre entreprise");
    expect(html).toContain("Corriger le nom");
    expect(html).toContain('value="Fromagerie du Pon"');
    expect(html).toContain("faute de frappe");
  });
});
