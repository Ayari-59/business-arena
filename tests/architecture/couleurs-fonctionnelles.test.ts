import { readFileSync } from "node:fs";
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
 * teintes désaturées pour distinguer les métiers. Chaque rôle a une valeur,
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

describe("les métiers se distinguent par des teintes désaturées", () => {
  const sombre = CSS.slice(CSS.indexOf("LES MÉTIERS : DES TEINTES DÉSATURÉES"));
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

  it("chaque teinte est désaturée, lisible sur le marine et, foncée, sur le papier", () => {
    for (const nom of noms) {
      const surMarine = jeton(sombre, `secteur-${nom}`);
      const { s, l } = tsl(surMarine);
      expect(s, `${nom} (${surMarine}) trop saturé`).toBeLessThan(0.6);
      expect(l, `${nom} (${surMarine}) est un pastel`).toBeLessThan(0.85);
      // Jusque sur le fond d'un champ, la surface la plus claire du marine.
      expect(contraste(surMarine, CHAMP), `${nom} sur ${CHAMP}`).toBeGreaterThanOrEqual(4.5);
      const clair = jeton(papier, `secteur-${nom}`);
      for (const fond of [PAPIER[950]!, PAPIER[900]!]) {
        expect(contraste(clair, fond), `${nom} (${clair}) sur ${fond}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
