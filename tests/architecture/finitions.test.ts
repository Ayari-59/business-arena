import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LOT P4 « FINITIONS » : les redites et les détails qu'on ne revoit pas.
 *
 * Chaque test fige une correction faite sur les captures, pour qu'elle ne
 * revienne pas par un autre chemin :
 *   · sur le téléphone de l'arène, l'ardoise ne redit pas « L'ESCALE · Tour
 *     2/6 » sous la barre de la partie qui le porte déjà ;
 *   · le bilan ne redit pas « Partie terminée » dans la barre, au-dessus du
 *     titre qui le dit ;
 *   · au bilan, les tours sont repliés : le dernier, déplié, redisait le rang ;
 *   · la marche du joueur sur le podium a le sol de ses voisines, sans rail ;
 *   · les liens d'une même ligne ont une même forme.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
const CSS = lire("src/app/globals.css");
const P4 = CSS.slice(CSS.indexOf("LOT P4 — FINITIONS"));

describe("une seule ligne d'en-tête sur téléphone", () => {
  it("l'ardoise pose son nom et son tour dans une ligne que l'arène masque sous 640 px", () => {
    expect(lire("src/components/tableau-de-bord.tsx")).toMatch(
      /className="ardoise-nom-et-tour [^"]*"/,
    );
    expect(P4).toMatch(
      /@media \(max-width: 639\.98px\) \{\s*\[data-ecran-de-jeu\] \.ardoise-nom-et-tour \{\s*display: none;/,
    );
    // Et c'est bien la barre de la partie, téléphone seulement, qui le porte.
    const barre = lire("src/components/barre-de-jeu.tsx");
    expect(barre).toMatch(/className="ardoise sticky top-0[^"]*sm:hidden/);
  });

  it("la barre du bilan ne redit pas « Partie terminée »", () => {
    const barre = lire("src/components/barre-de-jeu.tsx");
    expect(barre).not.toContain('"Partie terminée"');
    expect(barre).toContain("`Bilan des ${tours} tours`");
  });
});

describe("le bilan dit le rang une fois", () => {
  it("à la partie close, aucun tour n'est déplié sous la cérémonie", () => {
    const page = lire("src/app/arena/[gameId]/page.tsx");
    expect(page).toContain("open={isLatest && !finished}");
    expect(page).not.toMatch(/open=\{isLatest\}/);
  });

  it("la marche du joueur garde le sol de ses voisines, sans rail de gauche", () => {
    const regle = P4.match(/\.marche-de-podium\.ligne-moi \{([^}]*)\}/)?.[1];
    expect(regle).toBeDefined();
    expect(regle).toContain("background-color: var(--color-slate-900)");
    expect(regle).toMatch(/box-shadow: inset 0 0 0 1px var\(--metier/);
    expect(regle).not.toMatch(/inset 4px 0/);
    expect(regle).not.toMatch(/amber|accent/);
  });
});

describe("une ligne de liens, une forme", () => {
  it("les trois liens de /jouer sont soulignés de la même façon", () => {
    const jouer = lire("src/app/jouer/page.tsx");
    for (const lien of ["/join", "/reprendre", "/profile"]) {
      expect(jouer).toMatch(
        new RegExp(
          `href="${lien}"\\s+className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"`,
        ),
      );
    }
  });
});

describe("le sommaire d'un tour clos", () => {
  it("l'ancre s'arrête sous ce qui colle en haut, mesuré, et la face lue est marquée", () => {
    const sommaire = lire("src/components/sommaire-du-tour.tsx");
    expect(sommaire).toContain('className="scroll-mt-[calc(var(--haut-collant,6rem)+1rem)] space-y-3"');
    expect(sommaire).toContain('aria-current={active ? "location" : undefined}');
    // Le marquage est la teinte du métier (une position), jamais l'orange.
    expect(sommaire).toMatch(/border-\[color:var\(--metier,var\(--color-slate-300\)\)\]/);
    expect(sommaire).not.toMatch(/amber|accent-plein/);
  });
});
