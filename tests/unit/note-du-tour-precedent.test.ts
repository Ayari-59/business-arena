import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { NoteDuTourPrecedent } from "@/components/note-du-tour-precedent";
import {
  justificationManquante,
  LONGUEUR_MINIMALE_JUSTIFICATION,
  MESSAGE_JUSTIFICATION_MANQUANTE,
} from "@/config/justification";

/**
 * LA BOUCLE PRÉDICTION → RÉSULTAT.
 *
 * L'équipe écrit ce qu'elle attend de ses choix avant de les valider. Cette
 * note partait vers l'enseignant et l'élève ne la revoyait jamais : la seule
 * trace d'un raisonnement formé AVANT le résultat se perdait au moment où
 * elle devenait utile. Elle revient au tour suivant, collée au constat.
 */

const rendre = (texte: string | null, periode = "Trimestre 2") =>
  renderToStaticMarkup(createElement(NoteDuTourPrecedent, { texte, periode }));

describe("la note du tour précédent", () => {
  it("cite le texte de l'équipe tel quel", () => {
    const html = rendre("On baisse le prix pour remplir l'atelier.");
    expect(html).toContain("On baisse le prix pour remplir l&#x27;atelier.");
    // Elle est présentée comme une citation, pas comme une phrase de l'appli.
    expect(html).toContain("<blockquote");
  });

  it("nomme le tour d'où elle vient", () => {
    expect(rendre("Tenir le tarif.", "Trimestre 3")).toContain("trimestre 3");
  });

  it("ne s'affiche pas quand rien n'a été écrit", () => {
    expect(rendre(null)).toBe("");
    expect(rendre("")).toBe("");
    expect(rendre("   \n  ")).toBe("");
  });

  it("garde les retours à la ligne : une note en trois tirets en reste une", () => {
    expect(rendre("- prix\n- volume")).toContain("whitespace-pre-line");
  });

  it("invite à comparer, sans juger la note", () => {
    const html = rendre("Un pari sur le volume.");
    expect(html).toContain("Comparez");
    for (const verdict of ["erreur", "faux", "mauvais", "raté"]) {
      expect(html.toLowerCase()).not.toContain(verdict);
    }
  });
});

describe("la note est exigée au premier tour, et là seulement", () => {
  it("manque quand elle est vide ou trop courte au tour 1", () => {
    expect(justificationManquante("", 1)).toBe(true);
    expect(justificationManquante("ok", 1)).toBe(true);
    expect(justificationManquante("   ", 1)).toBe(true);
    expect(justificationManquante(null, 1)).toBe(true);
    expect(justificationManquante(undefined, 1)).toBe(true);
  });

  it("suffit dès qu'une phrase est écrite", () => {
    const phrase = "On vise le volume, quitte à rogner la marge.";
    expect(phrase.length).toBeGreaterThanOrEqual(LONGUEUR_MINIMALE_JUSTIFICATION);
    expect(justificationManquante(phrase, 1)).toBe(false);
  });

  it("n'est jamais exigée aux tours suivants", () => {
    for (const tour of [2, 3, 4, 5, 6]) {
      expect(justificationManquante("", tour), `tour ${tour}`).toBe(false);
    }
  });

  it("le message dit quoi faire, pas ce qui est interdit", () => {
    expect(MESSAGE_JUSTIFICATION_MANQUANTE).toContain("une phrase");
    expect(MESSAGE_JUSTIFICATION_MANQUANTE.toLowerCase()).not.toContain("obligatoire");
    expect(MESSAGE_JUSTIFICATION_MANQUANTE.toLowerCase()).not.toContain("interdit");
  });
});

describe("la règle vit au même endroit des deux côtés", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("l'action serveur applique la règle partagée", () => {
    const action = lire("src/app/arena/[gameId]/actions.ts");
    expect(action).toContain("justificationManquante");
    expect(action).toContain("MESSAGE_JUSTIFICATION_MANQUANTE");
  });

  it("le formulaire exige le champ au premier tour, avec le même seuil", () => {
    const form = lire("src/components/decision-form.tsx");
    expect(form).toContain("required={premierTour}");
    expect(form).toContain("LONGUEUR_MINIMALE_JUSTIFICATION");
    // Aucun seuil recopié en dur : deux nombres divergent toujours un jour.
    expect(form).not.toMatch(/minLength=\{\s*\d+\s*\}/);
  });

  it("la vue expose la note de chaque tour, et l'arène la rend", () => {
    expect(lire("src/services/game-view.service.ts")).toContain(
      "justification: decisionRowOfRound?.justification ?? null",
    );
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain("<NoteDuTourPrecedent");
  });
});
