import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAPIER, TABLEAU } from "../../scripts/generer-theme-clair";
import { ACCENTS_SECTEUR } from "../../src/config/scenarios/presentation";
import { SECTOR_COLORS } from "../../src/config/scenarios/registry";

/**
 * DES COULEURS FONCTIONNELLES, PAS DE PASTEL DÉCORATIF.
 *
 * Le propriétaire a fixé un rôle à chaque couleur : l'orange ambré pour
 * l'action, l'or pour le verdict, le blanc cassé pour l'information, le vert
 * et le rouge pour les seuls résultats, un bleu désaturé pour la donnée, des
 * teintes FRANCHES pour distinguer les métiers. Chaque rôle a une valeur,
 * et chaque valeur une lisibilité mesurée : cette garde les tient ensemble.
 */

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const THEME = CSS.slice(CSS.indexOf("@theme {"), CSS.indexOf("\n}", CSS.indexOf("@theme {")));

function rvb(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function luminance(hex: string): number {
  const [r, g, b] = rvb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Clarté et saturation HSL, de 0 à 1. */
function tsl(hex: string): { s: number; l: number } {
  const [r, g, b] = rvb(hex).map((v) => v / 255);
  const [max, min] = [Math.max(r!, g!, b!), Math.min(r!, g!, b!)];
  const l = (max + min) / 2;
  return { l, s: max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)) };
}
/** La chroma OKLCH : « assez colorée pour se voir » se mesure là, pas en HSL. */
function chroma(hex: string): number {
  const [r, g, b] = rvb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
  const n = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
  return Math.hypot(
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * n,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * n,
  );
}
function jeton(source: string, nom: string): string {
  const m = source.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  expect(m, `--${nom} absent`).not.toBeNull();
  return m![1]!.toLowerCase();
}

// Le marine du tableau : son fond, sa surface relevée (une carte posée sur le
// marine) et le fond d'un champ.
const MARINE = TABLEAU[950]!;
const RELEVE = TABLEAU[900]!;
const CHAMP = TABLEAU[800]!;
const SURFACES_SOMBRES = [MARINE, RELEVE, CHAMP];

describe("l'orange ambré dit l'action", () => {
  it("est #ff8a1f, sur le marine comme en aplat, avec un texte marine lisible dessus", () => {
    const racine = CSS.slice(CSS.indexOf(":root {\n  --marine:"));
    const accent = jeton(racine, "accent-plein");
    expect(accent).toBe("#ff8a1f");
    expect(contraste(jeton(racine, "accent-plein-texte"), accent)).toBeGreaterThanOrEqual(4.5);
    // Le marine et sa surface relevée : les fonds où l'orange s'écrit.
    for (const fond of [MARINE, RELEVE]) {
      expect(
        contraste(jeton(THEME, "color-amber-400"), fond),
        `orange sur ${fond}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("devient une encre brûlée sur le papier, lisible sur la page, la carte et le champ", () => {
    const papier = CSS.slice(CSS.indexOf('[data-theme="clair"] {\n  /* Même remarque'));
    const encre = jeton(papier, "color-amber-400");
    for (const fond of [PAPIER[950]!, PAPIER[900]!, PAPIER[800]!]) {
      expect(contraste(encre, fond), `encre ${encre} sur ${fond}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("le blanc cassé dit l'information", () => {
  it("le texte courant du marine n'est ni un blanc pur ni un bleu pâle, et se lit", () => {
    for (const palier of [50, 100, 200, 300]) {
      const texte = TABLEAU[palier]!;
      expect(texte, `slate-${palier}`).not.toBe("#ffffff");
      const [r, , b] = rvb(texte);
      expect(r!, `slate-${palier} (${texte}) tire au bleu`).toBeGreaterThanOrEqual(b!);
      expect(contraste(texte, RELEVE)).toBeGreaterThanOrEqual(7);
    }
    // Le texte secondaire, un gris chaud-neutre, tient sur chaque surface.
    for (const fond of SURFACES_SOMBRES) {
      expect(contraste(TABLEAU[400]!, fond)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("le vert et le rouge disent les résultats, francs", () => {
  it("sur le marine, ce ne sont plus des pastels, et ils se lisent sur une surface relevée", () => {
    for (const nom of ["red-300", "rose-300", "emerald-300", "red-400", "emerald-400"]) {
      const valeur = jeton(THEME, `color-${nom}`);
      // Un pastel est une teinte dont l'écart entre canaux est faible : le
      // rouge #fca5a5 et le vert #6ee7b7 de Tailwind n'en avaient que 34 et
      // 47 %. Un rouge ou un vert franc en garde au moins la moitié.
      const [r, g, b] = rvb(valeur);
      const ecart = (Math.max(r!, g!, b!) - Math.min(r!, g!, b!)) / 255;
      expect(ecart, `${nom} (${valeur}) est un pastel`).toBeGreaterThanOrEqual(0.5);
      expect(contraste(valeur, RELEVE), `${nom} sur ${RELEVE}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("les métiers se distinguent par des teintes franches", () => {
  const sombre = CSS.slice(
    CSS.indexOf("LES MÉTIERS : NEUF ENTREPRISES, NEUF UNIVERS, NEUF COULEURS"),
  );
  const papier = CSS.slice(CSS.indexOf('[data-theme="clair"] {\n  /* Même remarque'));
  const noms = new Set<string>();
  for (const a of Object.values(ACCENTS_SECTEUR)) {
    for (const m of a.texte.matchAll(/--secteur-([a-z-]+)/g)) noms.add(m[1]!);
  }
  for (const s of Object.values(SECTOR_COLORS)) {
    for (const m of s.accent.matchAll(/--secteur-([a-z-]+)/g)) noms.add(m[1]!);
  }

  it("aucun métier n'emprunte le rouge ni le vert des résultats", () => {
    expect(noms.size, "les métiers ne lisent plus leurs variables").toBeGreaterThanOrEqual(9);
    const classes = [
      ...Object.values(ACCENTS_SECTEUR).flatMap((a) => Object.values(a)),
      ...Object.values(SECTOR_COLORS).flatMap((c) => Object.values(c)),
    ].join(" ");
    expect(classes).not.toMatch(/\b(?:text|bg|border)-(?:red|rose|emerald|green)-\d/);
  });

  it("chaque teinte est FRANCHE sans rivaliser avec un accent, et lisible des deux côtés", () => {
    // Le lot 5A tenait ici un PLAFOND de saturation (« désaturée ») : c'est
    // lui qui avait délavé les quinze métiers jusqu'au sépia. Le plafond
    // reste, mais exprimé là où il veut dire quelque chose — la chroma OKLCH,
    // bornée par l'accent le MOINS coloré de la charte (l'or, 0,166) — et il
    // s'accompagne désormais d'un PLANCHER, celui de la compétence `dataviz`
    // (0,10), en dessous duquel une teinte lit comme un gris. Un pastel est
    // dès lors impossible : un pastel, c'est une chroma basse sur une clarté
    // haute, et la chroma ne peut plus descendre.
    expect(noms.size, "il faut les neuf métiers au moins").toBeGreaterThanOrEqual(9);
    for (const nom of noms) {
      const surMarine = jeton(sombre, `secteur-${nom}`);
      const cm = chroma(surMarine);
      expect(cm, `${nom} (${surMarine}) lit comme un gris`).toBeGreaterThanOrEqual(0.1);
      expect(cm, `${nom} (${surMarine}) est plus coloré que l'or`).toBeLessThan(0.166);
      // Jusque sur le fond d'un champ, la surface la plus claire du marine.
      expect(contraste(surMarine, CHAMP), `${nom} sur ${CHAMP}`).toBeGreaterThanOrEqual(4.5);
      const clair = jeton(papier, `secteur-${nom}`);
      const cp = chroma(clair);
      expect(cp, `${nom} (${clair}) lit comme un gris`).toBeGreaterThanOrEqual(0.1);
      expect(cp, `${nom} (${clair}) est plus coloré que l'or`).toBeLessThan(0.166);
      for (const fond of [PAPIER[950]!, PAPIER[900]!]) {
        expect(contraste(clair, fond), `${nom} (${clair}) sur ${fond}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

/** Les sources de l'application, pour les gardes qui lisent les classes. */
function sourcesDe(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...sourcesDe(chemin));
    else if (/\.(ts|tsx)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}
const SOURCES = sourcesDe(join(process.cwd(), "src")).map((chemin) => ({
  chemin: chemin.slice(process.cwd().length + 1),
  texte: readFileSync(chemin, "utf8"),
}));

/** Les familles de résultat, de statut et de bleu vif : jamais en voile. */
const FAMILLES = "emerald|red|rose|sky|teal|green|cyan|lime|pink|fuchsia|violet|purple|blue|indigo";
/**
 * Un voile de couleur : une dilution (`bg-emerald-400/10`, `bg-red-950/40`), un
 * dégradé (`from-red-400/15`), ou un palier pâle posé en fond (`bg-green-100`,
 * `bg-red-950`), avec ses variantes d'état (`hover:`, `has-[:checked]:`…).
 */
const VOILE = new RegExp(
  `(?<![\\w-])(?:[\\w[\\]:-]+:)?(?:bg-(?:${FAMILLES})-\\d{2,3}/[\\d.\\[\\]]+|(?:from|via|to)-(?:${FAMILLES})-\\d{2,3}|bg-(?:${FAMILLES})-(?:50|100|200|800|900|950)(?![\\d/]))`,
  "g",
);

describe("le vert, le rouge et le bleu ciel ne se diluent pas non plus", () => {
  it("le détecteur reconnaît un voile, et laisse un aplat plein", () => {
    for (const voile of [
      "bg-emerald-400/10",
      "bg-red-950/40",
      "hover:bg-emerald-950/30",
      "from-red-400/15",
      "to-emerald-400/[0.03]",
      "bg-sky-950/10",
      "bg-green-100",
      "bg-red-950",
    ]) {
      expect(`<p className="x ${voile} y">`.match(VOILE), voile).not.toBeNull();
    }
    for (const plein of ["bg-emerald-400", "bg-red-400", "text-emerald-300", "border-red-400"]) {
      expect(`<p className="x ${plein} y">`.match(VOILE), plein).toBeNull();
    }
  });

  it("aucun composant ne pose un voile de couleur de résultat ou de statut", () => {
    expect(SOURCES.length).toBeGreaterThan(300);
    const fautes = SOURCES.flatMap(({ chemin, texte }) =>
      (texte.match(VOILE) ?? []).map((v) => `${chemin} : ${v}`),
    );
    expect(
      fautes,
      `voiles pastel : un voile neutre (voile-neutre, encadre-*, pastille-*) et un trait plein\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("le voile neutre est le gris froid de la charte, et le sens passe par un trait plein", () => {
    const papier = CSS.slice(CSS.indexOf("LE VERT ET LE ROUGE NE SE DILUENT PAS NON PLUS"));
    expect(jeton(papier, "voile-neutre")).toBe("#f0f2f4");
    for (const [classe, couleur] of [
      ["encadre-gain", "--color-emerald-400"],
      ["encadre-perte", "--color-red-400"],
      ["pastille-gain::before", "--color-emerald-400"],
      ["pastille-perte::before", "--color-red-400"],
    ] as const) {
      const debut = papier.lastIndexOf(`\n.${classe} {`);
      expect(debut, `.${classe} absente`).toBeGreaterThan(0);
      expect(papier.slice(debut, papier.indexOf("}", debut))).toContain(`var(${couleur})`);
    }
  });
});

describe("une seule palette de données", () => {
  const donnees = CSS.slice(CSS.indexOf("LA DONNÉE : UNE SEULE PALETTE"));
  const surMarine = donnees.slice(0, donnees.indexOf('[data-theme="clair"] {'));
  const surPapier = donnees.slice(donnees.indexOf('[data-theme="clair"] {'));

  it("la série principale est le bleu donnée, la seconde un gris ardoise, lisibles comme un trait", () => {
    expect(jeton(surMarine, "donnee")).toBe("#8fb0dc");
    for (const nom of ["donnee", "donnee-2"]) {
      for (const fond of [MARINE, RELEVE]) {
        expect(contraste(jeton(surMarine, nom), fond), `${nom} sur ${fond}`).toBeGreaterThanOrEqual(
          3,
        );
      }
      for (const fond of [PAPIER[900]!, PAPIER[950]!]) {
        expect(contraste(jeton(surPapier, nom), fond), `${nom} sur ${fond}`).toBeGreaterThanOrEqual(
          3,
        );
      }
      // Un bleu ou un gris DÉSATURÉ, pas un bleu vif.
      expect(tsl(jeton(surPapier, nom)).s, nom).toBeLessThan(0.45);
    }
  });

  it("les graphiques ne prennent ni l'orange, ni le violet, ni le rose, ni le bleu vif", () => {
    // La palette des données, ses créneaux et la teinte du métier ont leur
    // propre garde (palette-des-donnees.test.ts) ; celle-ci refuse les
    // couleurs HORS palette, et couvre tout ce qui dessine une donnée.
    const GRAPHIQUES = [
      "src/components/charts.tsx",
      "src/components/bpi-panel.tsx",
      "src/components/tableau-de-bord.tsx",
      "src/components/sales-history.tsx",
      "src/components/episode/courbe-des-semaines.tsx",
      "src/components/episode/tableau-de-bord.tsx",
      "src/components/episode/bilan-de-l-episode.tsx",
    ];
    for (const chemin of GRAPHIQUES) {
      const source = SOURCES.find((s) => s.chemin === chemin);
      expect(source, `${chemin} introuvable`).toBeDefined();
      // Le code seul : les commentaires racontent les couleurs d'avant.
      const code = source!.texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(code.match(/#[0-9a-f]{6}\b/gi) ?? [], `${chemin} : couleur écrite en dur`).toEqual([]);
      expect(
        code.match(/\bbg-(?:amber|violet|fuchsia|pink|purple|blue|cyan|indigo|orange)-\d/g) ?? [],
        `${chemin} : couleur hors de la palette des données`,
      ).toEqual([]);
    }
  });
});

describe("un seul mot orange dans un grand titre : celui de l'accueil", () => {
  /** Les titres h1 d'une source, balise comprise. */
  const titres = (texte: string) => texte.match(/<h1\b[\s\S]*?<\/h1>/g) ?? [];
  const pages = SOURCES.filter(({ chemin }) => /^src\/app\/.*page\.tsx$/.test(chemin));

  it("le héros de l'accueil garde l'orange de la marque", () => {
    const accueil = pages.find((p) => p.chemin === "src/app/page.tsx")!;
    expect(titres(accueil.texte).join("\n")).toMatch(/text-amber-\d{3}/);
  });

  it("dans les pages intérieures, le mot d'appui d'un titre est à l'encre", () => {
    expect(pages.length).toBeGreaterThan(30);
    const fautes = pages
      .filter((p) => p.chemin !== "src/app/page.tsx")
      .flatMap((p) =>
        titres(p.texte)
          .filter((t) => /text-amber-\d{3}/.test(t))
          .map((t) => `${p.chemin} : ${t.replace(/\s+/g, " ").slice(0, 120)}`),
      );
    expect(fautes, `titres intérieurs en orange :\n${fautes.join("\n")}`).toEqual([]);
  });
});
