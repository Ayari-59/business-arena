import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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

/**
 * LOT P5 « LES CINQ RESTES ».
 *
 *   · les replis de l'arène ont UN chevron : le commun (`Chevron`), en tête du
 *     résumé, 16 px, qui pivote d'un quart de tour à l'ouverture ;
 *   · la courbe du bilan se dessine à la largeur de sa clôture ;
 *   · /jouer et les ouvertures marines ne portent plus l'anneau décoratif.
 */
const P5_REPLIS = [
  "src/components/tiroir.tsx",
  "src/components/repliable.tsx",
  "src/components/decision-form.tsx",
  "src/components/resultat-estime.tsx",
  "src/components/vos-reussites.tsx",
  "src/app/arena/[gameId]/page.tsx",
];

/** Les résumés d'un fichier : de `<summary` à `</summary>`, balise ouvrante à part. */
function resumes(source: string): { ouverture: string; corps: string }[] {
  const sortie: { ouverture: string; corps: string }[] = [];
  for (const m of source.matchAll(/<summary\b/g)) {
    const fin = source.indexOf(">", m.index!);
    const ferme = source.indexOf("</summary>", fin);
    sortie.push({ ouverture: source.slice(m.index!, fin + 1), corps: source.slice(fin + 1, ferme) });
  }
  return sortie;
}

describe("les flèches de repli, une seule règle (lot P5)", () => {
  it("le chevron commun : un dessin, 16 px, qui pivote d'un quart de tour, sans geste pour qui en demande moins", () => {
    const repliable = lire("src/components/repliable.tsx");
    const chevron = repliable.slice(repliable.indexOf("export function Chevron"), repliable.indexOf("export function Repliable"));
    expect(chevron).toContain('data-chevron=""');
    expect(chevron).toContain("aria-hidden");
    expect(chevron).toMatch(/className=\{`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none /);
    expect(chevron).toContain('d="M6 3.5 10.5 8 6 12.5"');
    // IL PIVOTE AVEC SON REPLI, ET AVEC LUI SEUL. `group-open:` regardait
    // n'importe quel ancêtre ouvert : un tiroir fermé dans un tour clos déplié
    // montrait un chevron ouvert (vu par l'e2e `finitions`). La rotation lit
    // le `<details>` qui porte le résumé, par l'enfant direct.
    expect(chevron).not.toContain("group-open:");
    const p5 = CSS.slice(CSS.indexOf("LOT P5 — LES CINQ RESTES"));
    expect(p5).toMatch(/details\[open\] > summary \[data-chevron\] \{\s*rotate: 90deg;\s*\}/);
    expect(p5).toMatch(/details\[open\] > summary \[data-deplier\] \{\s*display: none;\s*\}/);
    expect(lire("src/components/tiroir.tsx")).toMatch(/<span data-deplier="" className="[^"]*"/);
    expect(lire("src/components/tiroir.tsx")).not.toContain("group-open:");
  });

  it("dans chaque repli de l'arène, le chevron commun est en tête du résumé, et aucun autre glyphe", () => {
    let vus = 0;
    for (const fichier of P5_REPLIS) {
      for (const { ouverture, corps } of resumes(lire(fichier))) {
        vus += 1;
        const ou = `${fichier} : ${ouverture.slice(0, 80)}`;
        // Le marqueur du navigateur est masqué : il doublerait le chevron.
        expect(ouverture, ou).toMatch(/\blist-none\b/);
        expect(ouverture, ou).toContain("[&::-webkit-details-marker]:hidden");
        expect(corps, `${ou} : pas de chevron commun`).toContain("<Chevron");
        // EN TÊTE : avant lui, seulement des commentaires et l'ouverture d'un
        // conteneur de mise en page ; ni icône, ni titre, ni texte.
        const avant = corps
          .slice(0, corps.indexOf("<Chevron"))
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
          .replace(/<span className="[^"]*">/g, "");
        expect(avant.trim(), `${ou} : quelque chose précède le chevron`).toBe("");
        // Un seul chevron, et plus aucun des glyphes d'avant (▸ › ▾ ▼).
        const code = corps.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
        expect(code.match(/<Chevron/g) ?? [], ou).toHaveLength(1);
        expect(code, ou).not.toMatch(/[▸›▾▼]/);
        expect(code, ou).not.toContain("group-open:rotate");
        expect(code, ou).not.toContain("rotate-90");
      }
    }
    // Les replis comptés : un fichier qui perdrait ses résumés ne passerait
    // pas la garde en silence.
    expect(vus).toBeGreaterThanOrEqual(7);
  });

  it("les replis écrits sans résumé à eux (tiroirs, options repliées) passent par ces deux composants", () => {
    for (const f of ["src/components/tiroir.tsx", "src/components/decision-form.tsx"]) {
      expect(lire(f), f).toMatch(/import \{[^}]*\bChevron\b[^}]*\} from "@\/components\/repliable"/);
    }
    // Et un volet de la feuille ne rapetisse pas son titre : « En quelques
    // mots » était un cran plus petit que ses voisins.
    expect(lire("src/components/decision-form.tsx")).not.toMatch(/legendClass="text-xs/);
  });
});

describe("la courbe du bilan remplit sa clôture (lot P5)", () => {
  it("elle mesure sa boîte et s'y dessine, une unité pour un pixel, sans plafond de largeur", () => {
    const courbe = lire("src/components/courbe-des-tours.tsx");
    expect(courbe.startsWith('"use client";')).toBe(true);
    expect(courbe).toContain("new ResizeObserver(");
    expect(courbe).toMatch(/<Trace tours=\{tours\} largeur=\{largeur\} className="block" \/>/);
    expect(courbe).toContain('className={`h-auto w-full overflow-visible ${className}`}');
    // Le plafond qui laissait le vide à droite.
    expect(courbe).not.toMatch(/max-w-(xl|2xl|3xl|4xl|5xl|\[)/);
    // L'étiquette du dernier point a sa marge, réglée sur sa longueur.
    expect(courbe).toMatch(/droite: Math\.max\([^)]*etiquette\.length/);
  });
});

describe("plus d'anneau décoratif dans les en-têtes publics (lot P5)", () => {
  it("ni /jouer ni les ouvertures marines ne posent l'anneau", () => {
    for (const f of ["src/app/jouer/page.tsx", "src/components/bande-ouverture.tsx", "src/app/page.tsx"]) {
      expect(lire(f), f).not.toMatch(/<HaloDePage|halo-de-page/);
    }
    // La règle qui le rallumait sur l'ardoise de /jouer est partie avec lui.
    expect(CSS).not.toMatch(/\.ardoise \.halo-de-page/);
  });
});

describe("l'anneau décoratif n'existe plus (après P5)", () => {
  // Retiré de la vitrine (P2), de /jouer et des ouvertures marines (P5), puis
  // de toutes les pages où il restait posé sans se peindre : le composant, sa
  // règle, son jeton et sa teinte de palette sont partis avec lui.
  const sources = (racine: string): string[] =>
    readdirSync(racine).flatMap((e) => {
      const c = join(racine, e);
      return statSync(c).isDirectory() ? sources(c) : /\.(tsx?|css)$/.test(e) ? [c] : [];
    });
  it("ni composant, ni pose, ni règle, ni jeton", () => {
    expect(existsSync(join(process.cwd(), "src/components/halo-de-page.tsx"))).toBe(false);
    const fautes = sources(join(process.cwd(), "src")).filter((f) =>
      /<HaloDePage|halo-de-page/.test(readFileSync(f, "utf8")),
    );
    expect(fautes).toEqual([]);
  });
});
