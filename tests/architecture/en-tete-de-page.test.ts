import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { BANDES } from "@/config/bandes";

/**
 * UN EN-TÊTE POUR LES PAGES INTÉRIEURES, DES OUVERTURES MARINE POUR LES
 * VITRINES, UN SEUL GESTE ORANGE AU PILOTAGE (lot 3B de l'audit visuel).
 *
 * Les pages intérieures avaient des en-têtes disparates : des titres de 24 à
 * 48 px, trois colonnes différentes, un « ← Retour à l'accueil » ici et pas
 * là (P2-05, P2-17). Elles posent désormais toutes `EnTeteDePage`, qui porte
 * le seul titre de la page. Les pages vitrines gardent un héros, mais marine,
 * avec un chiffre lu dans un registre (P2-21) ; le pilotage enseignant a son
 * bandeau « Ce tour » et un seul bouton orange (P2-15).
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
/** Le code seul : les commentaires racontent ce qu'il y avait avant. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/** Les pages intérieures listées par l'audit (P2-05, P2-17). */
const PAGES_INTERIEURES = [
  "src/app/parcours/page.tsx",
  "src/app/guide/page.tsx",
  "src/app/orientation/page.tsx",
  "src/app/notions/page.tsx",
  "src/app/fonctionnalites/page.tsx",
  "src/app/compete/page.tsx",
  "src/app/mentions-legales/page.tsx",
  "src/app/teacher/login/page.tsx",
  "src/app/teacher/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/entreprises/episode/profil/page.tsx",
  "src/app/tarifs/page.tsx",
];

describe("l'en-tête des pages intérieures", () => {
  it("chaque page intérieure le pose, et n'écrit aucun autre titre de page", () => {
    const fautes: string[] = [];
    for (const chemin of PAGES_INTERIEURES) {
      const source = code(lire(chemin));
      if (!source.includes("<EnTeteDePage")) fautes.push(`${chemin} : pas d'EnTeteDePage`);
      if (/<h1\b/.test(source)) fautes.push(`${chemin} : un <h1> écrit à la main`);
      if (/Retour à l(?:&apos;|')accueil/.test(source)) {
        fautes.push(`${chemin} : un « Retour à l'accueil », que le logo de l'en-tête fait déjà`);
      }
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("une page à deux états (vide, remplie) pose l'en-tête dans chacun", () => {
    // /profile rend une page vide tant que rien n'est joué : elle aussi a son
    // titre, au même gabarit.
    const profil = code(lire("src/app/profile/page.tsx"));
    expect(profil.match(/<EnTeteDePage\b/g) ?? []).toHaveLength(2);
  });

  it("porte un seul titre, de 40 à 48 px, à l'encre, et un chapeau de 17 à 18 px", () => {
    const html = renderToStaticMarkup(
      createElement(EnTeteDePage, {
        surtitre: "Guide",
        titre: "Un titre",
        chapeau: "Un chapeau.",
      }),
    );
    expect(html.match(/<h1\b/g) ?? []).toHaveLength(1);
    const h1 = html.match(/<h1[^>]*>/)![0];
    // 40 px au plus étroit, 48 au-delà : un clamp, puisque l'échelle de
    // Tailwind n'a pas de 40 (tests/architecture/jetons-de-forme.test.ts).
    expect(h1).toContain("text-[clamp(2.5rem,6vw,3rem)]");
    expect(h1, "l'orange d'un grand titre n'appartient qu'à l'accueil").not.toMatch(/amber/);
    expect(h1).toContain("text-slate-50");
    const chapeau = html.match(/<p class="([^"]*)">Un chapeau\./)![1]!;
    expect(chapeau).toContain("text-lg");
  });

  it("les fiches notions quittent l'ancien gabarit : formules en Barlow, lignes à chevron", () => {
    const notions = code(lire("src/app/notions/page.tsx"));
    expect(notions, "formule en police de code").not.toContain("font-mono");
    expect(notions).toContain("tabular-nums");
    expect(notions).toContain("<Chevron");
    // Les définitions ne sont plus en 12 px.
    expect(notions).not.toMatch(/text-xs text-slate-400">\{c\.definition\}/);
  });
});

describe("les ouvertures marine des pages vitrines", () => {
  const OUVERTURES = [
    ["enseignants", "src/app/enseignants/page.tsx"],
    ["ecoles", "src/app/ecoles/page.tsx"],
    ["entreprises", "src/app/entreprises/page.tsx"],
  ] as const;

  it("l'accroche est marine d'origine, et porte le titre de la page", () => {
    for (const [page] of OUVERTURES) {
      const accroche = BANDES.find((b) => b.id === `${page}.accroche`)!;
      expect(accroche.contrasteParDefaut, `${page} s'ouvre sur le clair`).toBe(true);
      expect(accroche.porteLeH1).toBe(true);
    }
  });

  it("chaque ouverture porte un chiffre-preuve LU dans un registre", () => {
    for (const [page, chemin] of OUVERTURES) {
      const source = code(lire(chemin));
      expect(source, `${page} : pas d'ouverture marine`).toContain("<BandeOuverture");
      const preuve = source.match(/preuve=\{\{\s*valeur:\s*([^,]+),/);
      expect(preuve, `${page} : pas de chiffre-preuve`).not.toBeNull();
      expect(preuve![1], `${page} : un chiffre écrit à la main`).toMatch(/\.length\}?`?$/);
    }
  });

  it("/jouer s'ouvre sur une ardoise marine qui porte le titre", () => {
    const jouer = code(lire("src/app/jouer/page.tsx"));
    const ouverture = jouer.slice(jouer.indexOf('className="ardoise'));
    expect(ouverture.indexOf("<h1"), "le titre n'est pas dans l'ardoise").toBeGreaterThan(0);
    expect(ouverture.indexOf("<h1")).toBeLessThan(ouverture.indexOf("</section>"));
    // L'introduction vient avant le formulaire, sur tous les écrans : plus de
    // réordonnancement par `order-*`.
    expect(jouer.indexOf("<h1")).toBeLessThan(jouer.indexOf("<form"));
    expect(jouer).not.toMatch(/\border-[0-9]/);
  });
});

describe("le pilotage enseignant", () => {
  const PILOTAGE = code(lire("src/app/teacher/games/[gameId]/page.tsx"));

  it("ouvre sur un bandeau marine « Ce tour », qui porte la clôture", () => {
    const debut = PILOTAGE.indexOf('aria-labelledby="ce-tour-titre"');
    expect(debut, "pas de bandeau « Ce tour »").toBeGreaterThan(0);
    const bandeau = PILOTAGE.slice(debut, PILOTAGE.indexOf("</section>", debut));
    expect(bandeau).toContain("ardoise");
    expect(bandeau).toContain("<CloseRoundForm");
    // En tête : avant le ticket du code d'invitation.
    expect(debut).toBeLessThan(PILOTAGE.indexOf('aria-label="Code d\'invitation"'));
  });

  it("la clôture est le seul geste orange de l'écran", () => {
    // Le bouton plein vit dans CloseRoundForm ; la page elle-même n'en pose
    // aucun, ni par la fonction de classes, ni par un aplat écrit à la main.
    expect(PILOTAGE.match(/bouton\(\)|variante: "principal"/g) ?? []).toEqual([]);
    expect(PILOTAGE.match(/\bbg-amber-[45]00\b(?!\/)/g) ?? []).toEqual([]);
  });

  it("le dernier résultat est signé, vert ou rouge francs", () => {
    const cellule = PILOTAGE.slice(
      PILOTAGE.indexOf("t.lastNetIncome === null || t.lastNetIncome === 0"),
    );
    expect(cellule.slice(0, 300)).toMatch(/text-emerald-300[\s\S]*text-red-300/);
    expect(cellule.slice(0, 600)).toContain('t.lastNetIncome > 0 ? "+" : ""');
  });
});

describe("les replis à chevron", () => {
  it("plus de triangle du navigateur sur le profil décisionnel ni sur les codes de reprise", () => {
    for (const chemin of [
      "src/app/entreprises/episode/profil/page.tsx",
      "src/components/codes-de-reprise.tsx",
    ]) {
      const source = code(lire(chemin));
      expect(source, `${chemin} : un <details> à triangle natif`).not.toMatch(/<details\b/);
      expect(source).toContain("<Repliable");
    }
    const repliable = lire("src/components/repliable.tsx");
    expect(repliable).toContain("list-none");
    expect(repliable).toContain("[&::-webkit-details-marker]:hidden");
    // Le chevron pivote à l'ouverture de SON repli (lot P5 : la règle de
    // globals.css lit le `<details>` parent du résumé ; `group-open:`
    // regardait aussi les replis ouverts autour de lui).
    expect(repliable).toContain('data-chevron=""');
    expect(lire("src/app/globals.css")).toMatch(
      /details\[open\] > summary \[data-chevron\] \{\s*rotate: 90deg;/,
    );
  });
});
