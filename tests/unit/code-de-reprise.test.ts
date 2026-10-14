import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ALPHABET_REPRISE,
  codeDeReprisePlausible,
  formaterCodeDeReprise,
  LONGUEUR_CODE_REPRISE,
  normaliserCodeDeReprise,
} from "@/config/reprise";

/**
 * LE CODE DE REPRISE SE RECOPIE À LA MAIN.
 *
 * Il est lu sur un écran, noté sur un bout de papier, retapé ailleurs — voire
 * dicté à voix haute. Ces tests décrivent ce que la saisie doit pardonner, et
 * ce qu'elle doit refuser avant même d'interroger la base.
 */

vi.mock("@/app/compete/actions", () => ({
  reprendreSonEquipeAction: vi.fn(),
  joinCompetitionAction: vi.fn(),
}));

describe("l'alphabet du code", () => {
  it("écarte les caractères qui se confondent une fois recopiés", () => {
    for (const ambigu of ["I", "L", "O", "0", "1"]) {
      expect(ALPHABET_REPRISE, `${ambigu} se confond avec un autre signe`).not.toContain(ambigu);
    }
    // Ce qui reste doit tout de même laisser de quoi tirer des codes.
    expect(ALPHABET_REPRISE.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ALPHABET_REPRISE).size).toBe(ALPHABET_REPRISE.length);
  });
});

describe("la saisie du code", () => {
  it("pardonne la casse, le tiret et les espaces", () => {
    for (const saisi of ["K7PD5M2X", "k7pd5m2x", "K7PD-5M2X", " k7pd 5m2x ", "K7PD—5M2X"]) {
      expect(normaliserCodeDeReprise(saisi)).toBe("K7PD5M2X");
    }
  });

  it("refuse avant la base ce qui ne peut pas être un code", () => {
    expect(codeDeReprisePlausible("K7PD-5M2X")).toBe(true);
    expect(codeDeReprisePlausible("K7PD5M2")).toBe(false); // trop court
    // Les signes écartés de l'alphabet ne sont pas des fautes de frappe à
    // rattraper : un code n'en contient jamais.
    expect(codeDeReprisePlausible("K7PDI0M2")).toBe(false);
    expect(codeDeReprisePlausible("")).toBe(false);
  });

  it("ne garde que la longueur attendue, même si l'élève colle plus long", () => {
    expect(normaliserCodeDeReprise("K7PD5M2XZZZZ")).toHaveLength(LONGUEUR_CODE_REPRISE);
  });
});

describe("l'affichage du code", () => {
  it("le coupe en deux groupes de quatre, plus lisibles à recopier", () => {
    expect(formaterCodeDeReprise("K7PD5M2X")).toBe("K7PD-5M2X");
    // Déjà formaté : on ne double pas le tiret.
    expect(formaterCodeDeReprise("K7PD-5M2X")).toBe("K7PD-5M2X");
  });
});

describe("les écrans du code", () => {
  it("la carte du joueur montre le code et dit à quoi il sert", async () => {
    const { CarteDuCodeDeReprise } = await import("@/components/carte-du-code-de-reprise");
    const html = renderToStaticMarkup(createElement(CarteDuCodeDeReprise, { code: "K7PD5M2X" }));
    expect(html).toContain("K7PD-5M2X");
    expect(html).toContain("n&#x27;importe quel appareil");
  });

  it("la liste de l'organisateur est repliée et met en garde", async () => {
    const { CodesDeReprise } = await import("@/components/codes-de-reprise");
    const html = renderToStaticMarkup(
      createElement(CodesDeReprise, {
        codes: [{ teamLabel: "Les Requins", pseudo: "Léa", code: "K7PD5M2X" }],
      }),
    );
    // Un <details> sans « open » : les codes ne s'ouvrent pas tout seuls sur
    // un écran projeté.
    expect(html).toContain("<details");
    expect(html).not.toContain("open=");
    expect(html).toContain("Les Requins");
    expect(html).toContain("K7PD-5M2X");
    expect(html).toContain("jouer à la place");
  });

  it("aucune liste quand personne n'est inscrit", async () => {
    const { CodesDeReprise } = await import("@/components/codes-de-reprise");
    expect(renderToStaticMarkup(createElement(CodesDeReprise, { codes: [] }))).toBe("");
  });

  it("le formulaire de reprise ne demande que le code", async () => {
    const { CompetitionRecoveryForm } = await import("@/components/competition-recovery-form");
    const html = renderToStaticMarkup(createElement(CompetitionRecoveryForm, {}));
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).toContain('name="code"');
    expect(html).toContain("Retrouver mon équipe");
  });
});
