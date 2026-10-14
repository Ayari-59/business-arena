import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { TeamNameForm } from "@/components/team-name-form";
import { EMBLEMES } from "@/config/emblemes";

/**
 * LE PANNEAU DE NOMMAGE SERT AUSSI À CORRIGER.
 *
 * Il se fermait dès le premier nom adopté : une coquille suivait l'équipe
 * jusqu'au relevé de notes. Il reste ouvert tout le premier tour, et change
 * de discours quand l'équipe a déjà choisi.
 *
 * Il porte aussi, désormais, l'emblème : une équipe avait un nom et aucun
 * signe, et six lignes de texte gris se ressemblaient toutes.
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
    // Le bouton enregistre le nom ET l'emblème : il ne dit plus « le nom ».
    expect(html).toContain("Enregistrer");
    expect(html).toContain('value="Fromagerie du Pon"');
    expect(html).toContain("faute de frappe");
  });

  it("propose les huit emblèmes, et « aucun » en fait partie", () => {
    // Le choix tient sur une ligne : c'est le tour 1, tout le monde attend.
    const html = renderToStaticMarkup(
      createElement(TeamNameForm, {
        gameId: "g",
        nomActuel: "Équipe 2",
        dejaNommee: false,
        emblemeActuel: "eclair",
      }),
    );
    expect(html).toContain("Votre emblème");
    for (const e of EMBLEMES) expect(html, e.code).toContain(`value="${e.code}"`);
    // « Aucun » est un choix offert, pas une absence de choix.
    expect(html).toContain("Aucun emblème");
    // Et celui de l'équipe est déjà coché (React écrit `checked` avant
    // `value` : on cherche les deux dans la MÊME balise, sans présumer l'ordre).
    expect(html).toMatch(/<input[^>]*checked[^>]*value="eclair"/);
  });
});
