import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PreuvesDusageBande } from "@/components/preuves-dusage";
import { PLANCHER, assezPourEtreDit } from "@/config/preuves-dusage";

/**
 * PROUVER L'USAGE SANS L'INVENTER.
 *
 * « Adopté par des centaines d'enseignants » sous un témoignage signé d'un
 * prénom ne prouve rien : c'est invérifiable, et c'est le défaut du cockpit aux
 * chiffres inventés qu'on vient de retirer de l'accueil. Ce qui doit tenir :
 *
 * · LE PLANCHER : en dessous, on n'affiche rien. Trois parties prouveraient
 *   l'inverse de ce qu'on leur demande.
 * · AUCUN NOM : des totaux, et rien qui descende à la ligne près.
 * · LE RELEVÉ EST DATÉ : un compteur sans date ne se vérifie pas.
 */

const rendu = (preuves: Parameters<typeof PreuvesDusageBande>[0]["preuves"]) =>
  renderToStaticMarkup(createElement(PreuvesDusageBande, { preuves }));

const releve = (parties: number, tours: number) => ({
  parties,
  tours,
  decisions: 1234,
  classes: 42,
  releveLe: new Date("2026-09-27T10:00:00Z"),
});

describe("les preuves d'usage", () => {
  it("se taisent tant que les chiffres ne prouvent rien", () => {
    expect(assezPourEtreDit({ parties: PLANCHER.parties - 1, tours: 9999 })).toBe(false);
    expect(assezPourEtreDit({ parties: 9999, tours: PLANCHER.tours - 1 })).toBe(false);
    expect(assezPourEtreDit({ parties: PLANCHER.parties, tours: PLANCHER.tours })).toBe(true);
    // Et sans relevé du tout, la bande disparaît au lieu d'afficher des zéros.
    expect(rendu(null)).toBe("");
  });

  it("donne les quatre totaux et la date du relevé", () => {
    const html = rendu(releve(120, 640));
    expect(html).toContain("120");
    expect(html).toContain("640");
    // Le séparateur de milliers français est une espace fine insécable : on
    // le demande à la même source que le composant plutôt que de le taper.
    expect(html).toContain((1234).toLocaleString("fr-FR"));
    expect(html).toContain("parties jouées");
    expect(html).toContain("tours résolus");
    expect(html).toContain("décisions validées");
    expect(html).toContain("classes créées");
    // L'attribut est rendu en `dateTime` par le rendu statique ; HTML ne
    // distingue pas la casse des attributs, on ne la teste donc pas non plus.
    expect(html.toLowerCase()).toContain('datetime="2026-09-27"');
  });

  it("ne nomme personne, et le dit", () => {
    const html = rendu(releve(120, 640));
    expect(html).toContain("comptés dans la base du site");
    expect(html).toMatch(/Aucun établissement/);
  });

  it("ne lit que des totaux, jamais une ligne", () => {
    // La garde qui compte : une requête qui ramènerait des lignes nommées
    // (un établissement, un enseignant) n'aurait rien à faire sur une page
    // publique. Le service ne sait compter que des entiers.
    const source = readFileSync(
      join(process.cwd(), "src/services/preuves-dusage.service.ts"),
      "utf8",
    );
    const requetes = source.match(/db\s*\n?\s*\.select\(\{[^}]*\}\)/g) ?? [];
    expect(requetes.length).toBeGreaterThan(0);
    for (const r of requetes) {
      expect(r, `une requête ne compte pas : ${r}`).toMatch(/count\(/);
    }
    // Et rien n'en sort qui ne soit un nombre ou une date.
    expect(source).not.toMatch(/\.name\b|\bemail\b|pseudo/);
  });

  it("survit à une base absente", () => {
    // Une vitrine ne tombe pas parce qu'un compteur n'a pas répondu : la
    // requête est enveloppée, et l'échec rend `null`.
    const source = readFileSync(
      join(process.cwd(), "src/services/preuves-dusage.service.ts"),
      "utf8",
    );
    expect(source).toMatch(/catch\s*\(/);
    expect(source).toContain("valeur = null");
  });

  it("est posée avant les promesses de la page enseignants", () => {
    const page = readFileSync(join(process.cwd(), "src/app/enseignants/page.tsx"), "utf8");
    expect(page).toContain("<PreuvesDusageBande");
    // Les pastilles de confiance disent ce que le produit FERA ; les totaux
    // disent ce qu'il a déjà fait, et viennent donc d'abord.
    expect(page.indexOf("<PreuvesDusageBande")).toBeLessThan(page.indexOf("{CONFIANCE.map"));
  });
});
