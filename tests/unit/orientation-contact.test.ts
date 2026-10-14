import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le composant importe l'action serveur, qui importe la base : en test, on
// coupe ces deux fils, seul le rendu du formulaire est jugé ici.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { OrientationForm } from "@/components/orientation-form";

/**
 * LA DEMANDE DE SIMULATION PART PAR LE FORMULAIRE, PAS PAR LA MESSAGERIE.
 *
 * Le bouton ouvrait un courriel pré-rempli chez le visiteur : sur un poste
 * sans messagerie, rien ne partait, et rien n'en restait chez nous. Le
 * formulaire recueille qui écrit (nom, établissement, e-mail) et le profil de
 * la classe, l'action serveur enregistre et prévient. Aucun état interne de la
 * plateforme (adresse de contact configurée ou non) n'est servi au visiteur.
 */
describe("orientation : le formulaire recueille la demande", () => {
  const html = renderToStaticMarkup(createElement(OrientationForm, {}));

  it("plus aucun lien de messagerie, et rien sur la configuration", () => {
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("pas encore renseignée");
    expect(html).toContain("Ce que nous vous conseillons");
  });

  it("rien n'est choisi d'avance : la recommandation attend les trois réponses, le bouton aussi", () => {
    expect(html).toContain("Choisir un diplôme…");
    expect(html).toContain("Choisir un objectif…");
    expect(html).toContain('name="semestre" value=""');
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain("Répondez aux trois questions");
    expect(html).not.toContain("La fiche de cette entreprise");
    expect(html).toMatch(/<button type="submit" disabled=""/);
  });

  it("une saisie rejouée revient avec sa recommandation", () => {
    const rejoue = renderToStaticMarkup(
      createElement(OrientationForm, {
        initial: {
          error: "E-mail invalide",
          ok: null,
          values: { nom: "M", etablissement: "L", email: "x", diplome: "cg1", semestre: "s2", objectif: "tresorerie", message: "" },
        },
      }),
    );
    expect(rejoue).toContain('aria-pressed="true"');
    expect(rejoue).toContain("La fiche de cette entreprise");
    expect(rejoue).not.toContain("Répondez aux trois questions");
  });

  it("recueille l'identité et le profil, sous des noms de champs lus par l'action", () => {
    for (const champ of ["nom", "etablissement", "email", "diplome", "semestre", "objectif", "message"]) {
      expect(html, champ).toContain(`name="${champ}"`);
    }
    expect(html).toContain("Nous écrire avec ce profil");
  });

  it("le piège à robots est là, invisible et vide", () => {
    expect(html).toContain('name="site"');
    expect(html).toMatch(/<label class="hidden"[^>]*aria-hidden="true"/);
  });

  it("une fois envoyée, la demande le dit et le bouton s'efface", () => {
    const apres = renderToStaticMarkup(
      createElement(OrientationForm, {
        initial: { error: null, ok: { email: "prof@lycee.fr" }, values: null },
      }),
    );
    expect(apres).toContain("Demande envoyée");
    expect(apres).toContain("prof@lycee.fr");
    expect(apres).not.toContain("Nous écrire avec ce profil");
  });

  it("après un échec, la saisie revient dans les champs", () => {
    const rejoue = renderToStaticMarkup(
      createElement(OrientationForm, {
        initial: {
          error: "E-mail invalide",
          ok: null,
          values: { nom: "Mme Martin", etablissement: "Lycée Pasteur", email: "x", diplome: "cg1", semestre: "s2", objectif: "tresorerie", message: "20 élèves" },
        },
      }),
    );
    expect(rejoue).toContain("E-mail invalide");
    expect(rejoue).toContain('value="Mme Martin"');
    expect(rejoue).toContain('value="Lycée Pasteur"');
  });

  it("l'action enregistre avant de prévenir : un envoi de courriel raté ne perd pas la demande", () => {
    const source = readFileSync("src/app/orientation/actions.ts", "utf8");
    const depot = source.indexOf("deposerDemandeOrientation(");
    const courriel = source.indexOf("envoyerCourriel(");
    expect(depot).toBeGreaterThan(0);
    expect(courriel).toBeGreaterThan(depot);
  });
});
