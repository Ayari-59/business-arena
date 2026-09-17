import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { ChoixEquipe } from "@/components/choix-equipe";
import { CompositionEquipes } from "@/components/composition-equipes";

/**
 * LES DEUX ÉCRANS D'AFFECTATION.
 *
 * Côté élève, on vérifie surtout ce qui DISPARAÎT une fois le premier tour
 * clos : le bouton « Rejoindre ». Sans cela, l'élève cliquerait sur une
 * commande que le serveur refuse — le pire des deux mondes.
 */
const EQUIPES = [
  {
    teamId: "t1",
    nom: "Équipe 1",
    membres: [
      { userId: "u1", nom: "Léa" },
      { userId: "u2", nom: "Tom" },
    ],
  },
  { teamId: "t2", nom: "Équipe 2", membres: [{ userId: "u3", nom: "Inès" }] },
  { teamId: "t3", nom: "Équipe 3", membres: [] },
];

describe("l'élève et son équipe", () => {
  it("au premier tour : chaque autre équipe se rejoint d'un bouton", () => {
    const html = renderToStaticMarkup(
      createElement(ChoixEquipe, {
        gameId: "g1",
        equipes: EQUIPES,
        monEquipeId: "t2",
        ouvert: true,
      }),
    );
    expect(html).toContain("Léa, Tom");
    expect(html).toContain("personne pour l&#x27;instant");
    expect(html).toContain("votre équipe");
    expect(html).toContain("Vous jouez actuellement dans Équipe 2.");
    // Deux boutons : les deux équipes qui ne sont pas la sienne.
    expect((html.match(/Rejoindre/g) ?? []).length).toBe(2);
  });

  it("après la clôture : plus aucun bouton, et le recours est nommé", () => {
    const html = renderToStaticMarkup(
      createElement(ChoixEquipe, {
        gameId: "g1",
        equipes: EQUIPES,
        monEquipeId: "t2",
        ouvert: false,
      }),
    );
    expect(html).not.toContain("Rejoindre");
    expect(html).toContain("demandez à votre enseignant");
  });

  it("une seule équipe : rien à choisir, rien à afficher", () => {
    const html = renderToStaticMarkup(
      createElement(ChoixEquipe, {
        gameId: "g1",
        equipes: [EQUIPES[0]!],
        monEquipeId: "t1",
        ouvert: true,
      }),
    );
    expect(html).toBe("");
  });
});

describe("l'enseignant et la composition", () => {
  it("une ligne par élève, avec toutes les équipes en destination", () => {
    const html = renderToStaticMarkup(
      createElement(CompositionEquipes, {
        gameId: "g1",
        equipes: EQUIPES,
        premierTour: true,
      }),
    );
    expect((html.match(/Déplacer/g) ?? []).length).toBe(3);
    expect(html).toContain("aucun élève");
    expect(html).toContain("2 élèves");
    // Chaque ligne propose les trois équipes, l'actuelle pré-sélectionnée.
    expect((html.match(/<option/g) ?? []).length).toBe(9);
    expect(html).not.toContain("relevé de notes suit");
  });

  it("des tours joués : l'avertissement sur le relevé de notes apparaît", () => {
    const html = renderToStaticMarkup(
      createElement(CompositionEquipes, {
        gameId: "g1",
        equipes: EQUIPES,
        premierTour: false,
      }),
    );
    expect(html).toContain("relevé de notes suit");
  });

  it("personne n'a encore rejoint : on explique au lieu de montrer un vide", () => {
    const html = renderToStaticMarkup(
      createElement(CompositionEquipes, {
        gameId: "g1",
        equipes: EQUIPES.map((e) => ({ ...e, membres: [] })),
        premierTour: false,
      }),
    );
    expect(html).toContain("Aucun élève n&#x27;a encore rejoint");
    expect(html).not.toContain("Déplacer");
    expect(html).not.toContain("relevé de notes suit");
  });
});
