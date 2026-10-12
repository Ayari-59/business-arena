import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CORPS_D_UN_ARTICLE_LONG,
  CORPS_D_UN_ENTREFILET,
  CoupureDePresse,
  RevueDePresse,
  colonnesDuCorps,
  decouperLArticle,
} from "@/components/coupure-de-presse";
import { articleDeLaGazette } from "@/config/gazette/generateur";
import { SCENARIOS } from "@/config/scenarios/registry";
import {
  DEVISE_DU_JOURNAL,
  PRIX_DU_NUMERO,
  SIGNATURE_DU_JOURNAL,
  type ArticleDeLaGazette,
} from "@/config/gazette/types";

/**
 * LA GAZETTE, UNE COUPURE DE JOURNAL. Ce que la maquette promet et que la
 * suite peut voir sans navigateur : le texte de l'article n'est pas retouché
 * (seulement réparti en chapô et corps), la maquette de presse est là (date,
 * prix, rubrique, titre, chapô, corps, signature, carré de fin, langue), et le
 * papier journal reste un OBJET aux couleurs écrites en dur, lisible (rapports
 * calculés dans la feuille), sans orange ni or, droit à l'impression. Le reste
 * (colonnes, découpe qui ne mord sur aucune lettre, largeur sur téléphone) se
 * mesure dans le navigateur : tests/e2e/gazette.e2e.ts.
 */

const article = (p: Partial<ArticleDeLaGazette> = {}): ArticleDeLaGazette => ({
  tour: 3,
  rubrique: "Matières premières",
  titre: "Hausse en vue sur les composants",
  chapo:
    "À l'origine de ce mouvement : la flambée des cours du cuivre et des terres rares. La fédération de l'électronique grand public annonce une forte hausse des prix des composants, de l'ordre de 15 à 25 % pour les deux prochains trimestres. La saison, elle, devrait porter la demande.",
  fiabilite: "fait",
  sujets: [],
  auteur: "gazette",
  ...p,
});


describe("le chapô et le corps : le texte de l'article ne change pas", () => {
  it("la première phrase fait le chapô, les suivantes le corps", () => {
    const { chapo, corps } = decouperLArticle(article().chapo);
    expect(chapo).toBe("À l'origine de ce mouvement : la flambée des cours du cuivre et des terres rares.");
    expect(corps).toMatch(/^La fédération .+ porter la demande\.$/);
    // « 15 à 25 % » et l'espace insécable avant le deux-points ne coupent rien.
    expect(decouperLArticle("Le déclencheur : la hausse de 1,5 %. Les banques suivent.").chapo).toBe(
      "Le déclencheur : la hausse de 1,5 %.",
    );
  });

  it("une seule phrase : pas de chapô, tout est corps", () => {
    expect(decouperLArticle("Le port est bloqué depuis lundi : les livraisons attendront.")).toEqual({
      chapo: null,
      corps: "Le port est bloqué depuis lundi : les livraisons attendront.",
    });
  });

  it("sur les articles des quinze scénarios, chapô et corps redonnent le texte, mot pour mot", () => {
    let vus = 0;
    for (const d of SCENARIOS) {
      const evs = d.scenario.events.filter((e) => e.scope === "market");
      for (const niveau of [1, 3, 5]) {
        for (const tour of [1, 3, 5]) {
          for (const nv of [[], ...evs.slice(0, 12).map((e) => [e])]) {
            const a = articleDeLaGazette({
              secteur: d.sector,
              scenario: d.scenario,
              tour,
              niveau,
              graine: 11 + tour,
              nouveaux: nv.map((e) => ({ code: e.code, scope: "market" as const, roundsLeft: e.duration, modifiers: e.modifiers })),
              enCours: [],
            });
            const { chapo, corps } = decouperLArticle(a.chapo);
            expect([chapo, corps].filter(Boolean).join(" ")).toBe(a.chapo.trim());
            expect(corps.length).toBeGreaterThan(0);
            vus++;
          }
        }
      }
    }
    expect(vus).toBeGreaterThan(500);
  });

  it("une colonne pour un entrefilet, deux pour un article, trois pour un long", () => {
    expect(colonnesDuCorps("x".repeat(CORPS_D_UN_ENTREFILET - 1))).toBe(1);
    expect(colonnesDuCorps("x".repeat(CORPS_D_UN_ENTREFILET))).toBe(2);
    expect(colonnesDuCorps("x".repeat(CORPS_D_UN_ARTICLE_LONG - 1))).toBe(2);
    expect(colonnesDuCorps("x".repeat(CORPS_D_UN_ARTICLE_LONG))).toBe(3);
  });
});

describe("la maquette de presse", () => {
  const html = renderToStaticMarkup(createElement(CoupureDePresse, { article: article(), quand: "Tour 3" }));

  it("manchette, ligne de date et prix, rubrique, titre, chapô, corps, signature, carré de fin", () => {
    const ordre = [
      'class="coupure-journal"',
      `${DEVISE_DU_JOURNAL} · Tour 3 · ${PRIX_DU_NUMERO}`,
      'class="coupure-rubrique">Matières premières',
      '<h3 id="gazette-3" class="coupure-titre">Hausse en vue sur les composants</h3>',
      'class="coupure-chapo">À l&#x27;origine',
      'data-lettrine="tombante">La fédération',
      `${SIGNATURE_DU_JOURNAL}`,
      'aria-hidden="true" class="coupure-fin"',
    ];
    let depuis = 0;
    for (const morceau of ordre) {
      const i = html.indexOf(morceau, depuis);
      expect(i, `« ${morceau} » à sa place`).toBeGreaterThan(-1);
      depuis = i;
    }
  });

  it("l'article dit sa langue (la césure en dépend), l'enveloppe porte la pose et les colonnes", () => {
    expect(html).toMatch(/<article lang="fr" aria-labelledby="gazette-3" data-coupure-de-presse=""/);
    // Corps de 190 caractères : deux colonnes quand la place le permet.
    expect(html).toMatch(/^<div class="coupure-ombre" data-format="pleine" data-colonnes="2">/);
    // La signature est en italique par l'utilitaire (la feuille n'a aucune italique) ; aucune couleur Tailwind.
    expect(html).toContain('class="coupure-signature italic"');
    expect(html).not.toMatch(/class="[^"]*\b(?:text|bg|border)-(?:slate|amber|sky|emerald|fuchsia|red|orange|yellow)-\d/);
  });

  it("la lettrine tombe sur un corps de deux lignes, et monte sur un corps court", () => {
    expect(html).toContain('class="coupure-premier" data-lettrine="tombante"');
    const court = renderToStaticMarkup(
      createElement(CoupureDePresse, {
        article: article({ chapo: "Pas de nouvelle majeure. La demande devrait profiter de la saison." }),
        quand: "Tour 2",
      }),
    );
    expect(court).toContain('class="coupure-premier" data-lettrine="montante"');
    expect(court).toContain('data-colonnes="1"');
  });

  it("en revue de presse : la même coupure, plus petite, sans signature, sur une colonne", () => {
    const revue = renderToStaticMarkup(
      createElement(RevueDePresse, {
        articles: [article({ tour: 2 }), article({ tour: 1, titre: "Un autre titre" })],
        libelle: (t: number) => `Tour ${t}`,
      }),
    );
    expect(revue).toContain('class="coupures-conservees"');
    expect(revue.match(/data-format="compacte" data-colonnes="1"/g)).toHaveLength(2);
    expect(revue).toContain(`Tour 2 · ${PRIX_DU_NUMERO}`);
    expect(revue).not.toContain(SIGNATURE_DU_JOURNAL);
    expect(revue.match(/class="coupure-fin"/g)).toHaveLength(2);
    expect(revue.match(/<h4 /g)).toHaveLength(2);
  });
});

describe("le papier journal, dans la feuille de style", () => {
  const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const debut = CSS.indexOf("/* ───────────────────────────── LA COUPURE DE PRESSE");
  const BLOC = CSS.slice(debut, CSS.indexOf("/* ─────", debut + 10)).replace(/\/\*[\s\S]*?\*\//g, "");
  const regle = (sel: string) => {
    const i = BLOC.indexOf(`\n${sel} {`);
    expect(i, `la règle ${sel}`).toBeGreaterThan(-1);
    return BLOC.slice(i, BLOC.indexOf("}", i));
  };
  const jeton = (r: string, nom: string) => r.match(new RegExp(`${nom}:\\s*(#[0-9a-f]{6})\\b`))?.[1] ?? null;
  const luminance = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const rapport = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m) as [number, number];
    return (x + 0.05) / (y + 0.05);
  };

  it("un objet : ses couleurs sont écrites en dur, sans jeton du site, sans orange ni or", () => {
    expect(debut).toBeGreaterThan(0);
    expect(BLOC).not.toMatch(/var\(--color-|var\(--accent|var\(--metier|var\(--donnee/);
    expect(BLOC).not.toMatch(/amber|orange|gold|cachet-or/i);
    const feuille = regle(".coupure-de-presse");
    for (const nom of ["--encre", "--encre-douce", "--encre-tenue", "--papier"]) {
      expect(jeton(feuille, nom), nom).not.toBeNull();
    }
  });

  it("les encres se lisent sur le papier journal, et le papier se distingue de la lettre", () => {
    const feuille = regle(".coupure-de-presse");
    const papier = jeton(feuille, "--papier")!;
    expect(rapport(jeton(feuille, "--encre")!, papier)).toBeGreaterThanOrEqual(7);
    expect(rapport(jeton(feuille, "--encre-douce")!, papier)).toBeGreaterThanOrEqual(4.5);
    expect(rapport(jeton(feuille, "--encre-tenue")!, papier)).toBeGreaterThanOrEqual(4.5);
    // Plus terne que la lettre (#fff), et ce doit se voir...
    expect(rapport(papier, "#ffffff")).toBeGreaterThanOrEqual(1.15);
    // ... sans virer au crème : un gris à peine chaud, jamais une teinte.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(papier.slice(i, i + 2), 16));
    expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!)).toBeLessThanOrEqual(8);
    // Le grain reste un grain : au plus 15 % d'encre dans le bruit.
    const grain = feuille.match(/feColorMatrix values='([^']+)'/)?.[1]?.split(/\s+/).map(Number) ?? [];
    expect(grain).toHaveLength(20);
    expect(grain[18]).toBeLessThanOrEqual(0.15);
  });

  it("la découpe mord de 4 px au plus, la marge de la feuille la tient loin du texte", () => {
    const feuille = regle(".coupure-de-presse");
    const decoupe = feuille.match(/clip-path:\s*polygon\(([^;]+)\);/)?.[1] ?? "";
    const morsures = [...decoupe.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1]));
    expect(morsures.length).toBeGreaterThan(40);
    for (const m of morsures) expect(m).toBeLessThanOrEqual(4);
    const marge = feuille.match(/padding:\s*([\d.]+)rem\s+([\d.]+)rem\s+([\d.]+)rem/)!;
    expect(Number(marge[1]) * 16).toBeGreaterThanOrEqual(16);
    expect(Number(marge[3]) * 16).toBeGreaterThanOrEqual(16);
  });

  it("une pose de travers, d'un degré au plus, qui tombe à l'impression", () => {
    // La feuille, pas son ruban adhésif (\`::before\`), qui se pose plus de travers.
    const feuilles = BLOC.replace(/\n[^{}\n]*::before \{[^}]*\}/g, "");
    const rotations = [...feuilles.matchAll(/rotate:\s*(-?[\d.]+)deg/g)].map((m) => Number(m[1]));
    expect(rotations.length).toBeGreaterThan(3);
    for (const r of rotations) expect(Math.abs(r)).toBeLessThanOrEqual(1);
    expect(BLOC).not.toMatch(/animation|transition/);
    const impression = BLOC.slice(BLOC.lastIndexOf("@media print"));
    expect(impression).toMatch(/rotate:\s*none/);
    // Du poids des règles qui posent la rotation, sans quoi elles l'emportent à l'impression
    // (vu dans le navigateur : la coupure restait inclinée de 0,6°).
    expect(impression).toMatch(/\.coupure-ombre\[data-format\],\s*\.coupures-conservees > li > \.coupure-ombre\[data-format\] \{/);
    expect(impression).toMatch(/filter:\s*none/);
    expect(impression).toMatch(/clip-path:\s*none/);
  });

  it("le corps est justifié avec césure, ouvert par une lettrine, et passe en colonnes selon SA largeur", () => {
    expect(regle(".coupure-de-presse .coupure-premier")).toMatch(/text-align: justify;[\s\S]*hyphens: auto/);
    // Sur téléphone, fer à gauche : une colonne de 35 caractères justifiée sans césure
    // française se creusait de grands blancs.
    expect(BLOC).toMatch(
      /@media \(max-width: 639\.98px\) \{\s*\.coupure-de-presse \.coupure-premier \{\s*text-align: left;/,
    );
    expect(BLOC).toMatch(/\.coupure-premier::first-letter \{[^}]*initial-letter: 2/);
    expect(BLOC).toMatch(/\.coupure-premier\[data-lettrine="montante"\]::first-letter \{\s*initial-letter: 2 1;/);
    expect(BLOC).toMatch(/@container coupure \(min-width: [\d.]+rem\) \{[\s\S]*columns: 2;[\s\S]*column-rule: 1px solid/);
    expect(BLOC).toMatch(/\.coupure-ombre\[data-colonnes="3"\] \.coupure-corps \{\s*columns: 3;/);
    // Sur téléphone, un entrefilet découpé : étroit et centré.
    expect(BLOC).toMatch(/@media \(max-width: 639\.98px\) \{\s*\.coupure-ombre\[data-format="pleine"\] \{\s*width: min\(100%, 8[89]vw\);/);
  });
});
