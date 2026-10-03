import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { NoteDuTourPrecedent } from "@/components/note-du-tour-precedent";
import { INVITATION_NOTE } from "@/config/justification";

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

describe("la note est facultative, à tous les tours", () => {
  it("l'invitation dit qu'une phrase suffit, ou rien", () => {
    expect(INVITATION_NOTE).toContain("Une phrase suffit");
    expect(INVITATION_NOTE.toLowerCase()).not.toContain("obligatoire");
  });
});

describe("rien n'impose la note, ni l'écran ni le serveur", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("l'action serveur ne refuse jamais un envoi sans note", () => {
    const action = lire("src/app/arena/[gameId]/actions.ts");
    expect(action).not.toContain("justificationManquante");
    expect(action).not.toContain("MESSAGE_JUSTIFICATION_MANQUANTE");
  });

  it("le champ n'est ni requis ni borné en longueur : il ne bloque pas « Continuer »", () => {
    const form = lire("src/components/decision-form.tsx");
    const champ = form.slice(form.indexOf('name="justification"'), form.indexOf('name="justification"') + 600);
    expect(champ).not.toContain("required");
    expect(champ).not.toContain("minLength");
    expect(form).toContain("En quelques mots · facultatif");
  });

  it("la vue expose la note de chaque tour, et l'arène la rend", () => {
    expect(lire("src/services/game-view.service.ts")).toContain(
      "justification: decisionRowOfRound?.justification ?? null",
    );
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain("<NoteDuTourPrecedent");
  });
});
