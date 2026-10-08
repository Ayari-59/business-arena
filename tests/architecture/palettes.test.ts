import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PALETTES,
  PALETTE_D_ORIGINE,
  echelleClaire,
  estCodePalette,
  feuilleDePalette,
  paletteParCode,
  type Palette,
} from "../../src/config/palettes";
import { PAPIER, TABLEAU, identiteDeLaMaison } from "../../scripts/generer-theme-clair";

/**
 * « VALIDÉ », ICI, SE MESURE.
 *
 * Une palette n'entre dans la liste que si elle tient la lisibilité du site
 * sur le papier ET sur le tableau. On calcule le contraste WCAG de chaque rôle de
 * l'accent sur les fonds que le site pose réellement, et on refuse en dessous
 * de 4,5 pour 1. Ce test est ce qui rend l'admin sûr : il ne laisse choisir
 * qu'entre des jeux qui ont passé ces mesures.
 *
 * Les fonds sont ceux du site, pas des valeurs de convenance : les deux
 * surfaces du tableau et les deux du papier sont les paliers 950 et 900 des
 * échelles TABLEAU et PAPIER de scripts/generer-theme-clair.ts, plus le fond
 * d'un champ sur le papier (800). Un test plus bas vérifie qu'ils n'ont pas
 * bougé.
 */

const ROOT = join(__dirname, "..", "..");
const GLOBALS = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

// Le marine du tableau (950, 900) : là où l'échelle « sombre » d'une palette se pose.
const SOMBRES = ["#0b2545", "#13355f"];
// Le papier (950, 900 la carte blanche, 800 le champ) : les fonds sur lesquels
// l'encre se pose (page, carte, champ).
const CLAIRS = ["#f5f7fb", "#ffffff", "#edf1f7"];

const lineaire = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) =>
    lineaire(parseInt(hex.slice(i, i + 2), 16) / 255),
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/;
const SEUIL = 4.5;

describe("les fonds de la mesure", () => {
  it("sont ceux des échelles du site, et non des valeurs de convenance", () => {
    // Une palette mesurée sur des fonds qui ne sont plus ceux du site passerait
    // la mesure sans rien prouver : c'est arrivé au passage de l'ardoise au
    // marine, que ces deux listes ont dû suivre.
    expect(SOMBRES).toEqual([TABLEAU[950], TABLEAU[900]]);
    expect(CLAIRS).toEqual([PAPIER[950], PAPIER[900], PAPIER[800]]);
  });
});

describe("le registre des palettes", () => {
  it("a une palette d'origine, et chaque code est unique", () => {
    const codes = PALETTES.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain(PALETTE_D_ORIGINE);
    expect(estCodePalette("sepia")).toBe(false);
    expect(estCodePalette(PALETTE_D_ORIGINE)).toBe(true);
  });

  it("n'écrit que des couleurs hexadécimales, sans nom en dur dans la feuille", () => {
    for (const p of PALETTES) {
      for (const valeur of [
        ...Object.values(p.sombre),
        ...Object.values(p.clair),
      ]) {
        expect(valeur, `${p.code} : ${valeur}`).toMatch(HEX);
      }
    }
  });

  it("l'orange d'origine reste exactement ce que globals.css pose", () => {
    // La palette d'origine n'émet rien : si sa copie dérivait de la feuille,
    // la liste d'admin montrerait un orange que le site ne porte plus.
    const identite = identiteDeLaMaison(GLOBALS);
    const origine = paletteParCode(PALETTE_D_ORIGINE);
    for (const [palier, valeur] of Object.entries(origine.sombre)) {
      expect(identite.get(`amber-${palier}`), `amber-${palier}`).toBe(valeur);
    }
    // Et sur le papier, l'encre et le voile sont ceux du bloc clair.
    const papier = GLOBALS.slice(GLOBALS.indexOf('[data-theme="clair"] {'));
    expect(papier).toContain(`--color-amber-400: ${origine.clair.encre};`);
    expect(papier).toContain(`--color-amber-950: ${origine.clair.voile};`);
  });

  it("aucune palette n'est un rouge ni un vert : ces teintes portent un sens", () => {
    // Un accent rouge se lirait comme une perte, un accent vert comme un
    // bénéfice. On mesure la teinte du palier 400 en OKLCH grossier : les
    // teintes du rouge (≈ 345-40°) et du vert (≈ 110-175°) sont celles du
    // sens. Le rouge de la perte, sur le site, est à 22-29° ; l'orange de
    // l'arène, choisi pour l'action, est à 43° (aplat) et 50° (texte) : il
    // reste à vingt degrés de la perte, et cette garde l'y tient. La borne
    // était à 50° du temps du laiton (≈ 85°), qui n'en approchait pas.
    for (const p of PALETTES) {
      const hex = p.sombre[400]!;
      const [r, g, b] = [1, 3, 5].map((i) =>
        lineaire(parseInt(hex.slice(i, i + 2), 16) / 255),
      );
      const l = Math.cbrt(
        0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!,
      );
      const m = Math.cbrt(
        0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!,
      );
      const s = Math.cbrt(
        0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!,
      );
      const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
      const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      const teinte = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
      const dansLeRouge = teinte < 40 || teinte > 345;
      const dansLeVert = teinte > 110 && teinte < 175;
      expect(
        dansLeRouge || dansLeVert,
        `${p.code} : teinte ${Math.round(teinte)}°`,
      ).toBe(false);
    }
  });
});

describe.each(PALETTES.filter((p) => p.code !== PALETTE_D_ORIGINE))(
  "la palette $nom, sur le tableau",
  (p: Palette) => {
    it("les paliers de texte (200 à 400) se lisent sur les deux surfaces de l'ardoise", () => {
      for (const palier of [200, 300, 400] as const) {
        for (const fond of SOMBRES) {
          const ratio = contraste(p.sombre[palier]!, fond);
          expect(ratio, `${palier} sur ${fond}`).toBeGreaterThanOrEqual(SEUIL);
        }
      }
    });

    it("le texte clair se lit sur le remplissage du bouton (palier 500)", () => {
      // Le bouton d'action est bg-amber-500 text-slate-950.
      expect(contraste(p.sombre[500]!, SOMBRES[0]!)).toBeGreaterThanOrEqual(
        SEUIL,
      );
    });

    it("le palier 600 reste lisible en texte secondaire", () => {
      expect(contraste(p.sombre[600]!, SOMBRES[0]!)).toBeGreaterThanOrEqual(
        SEUIL,
      );
    });

    it("l'échelle va du pâle au profond sans s'inverser", () => {
      const ordre = [
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
      ] as const;
      const clartes = ordre.map((palier) => luminance(p.sombre[palier]!));
      for (let i = 1; i < clartes.length; i += 1) {
        expect(clartes[i]!, `palier ${ordre[i]}`).toBeLessThan(clartes[i - 1]!);
      }
    });
  },
);

describe.each(PALETTES.filter((p) => p.code !== PALETTE_D_ORIGINE))(
  "la palette $nom, sur le papier",
  (p: Palette) => {
    it("l'encre se lit sur la page, la carte et le champ", () => {
      for (const fond of CLAIRS) {
        expect(
          contraste(p.clair.encre, fond),
          `encre sur ${fond}`,
        ).toBeGreaterThanOrEqual(SEUIL);
      }
    });

    it("le texte clair se lit sur le remplissage du bouton", () => {
      expect(contraste(p.clair.remplissage, CLAIRS[0]!)).toBeGreaterThanOrEqual(
        SEUIL,
      );
    });

    it("l'encre se lit sur le voile de fond", () => {
      expect(contraste(p.clair.encre, p.clair.voile)).toBeGreaterThanOrEqual(
        SEUIL,
      );
    });

    it("le voile reste un voile : il ne se confond pas avec l'encre", () => {
      expect(luminance(p.clair.voile)).toBeGreaterThan(0.8);
      expect(luminance(p.clair.encre)).toBeLessThan(0.15);
    });
  },
);

describe("la feuille d'une palette", () => {
  it("la palette d'origine n'émet rien", () => {
    expect(feuilleDePalette(PALETTE_D_ORIGINE)).toBe("");
  });

  it("une autre palette recolore le papier et le tableau", () => {
    // Sans la seconde règle, chaque tableau resterait dans le laiton : une
    // seconde palette au milieu de la première.
    const f = feuilleDePalette("cobalt");
    for (const sel of [
      'html[data-theme="clair"]{',
      'html[data-theme="clair"] .contre-jour,html[data-theme="clair"] .ardoise{',
    ]) {
      expect(f, sel).toContain(sel);
    }
    expect(f, "le thème sombre n'existe plus").not.toContain("sombre");
  });

  it("le tableau prend l'échelle « sombre » de la palette, le papier son encre", () => {
    const p = paletteParCode("cobalt");
    const f = feuilleDePalette("cobalt");
    const bloc = (sel: string) => f.slice(f.indexOf(sel)).split("}")[0]!;
    expect(bloc('html[data-theme="clair"] .contre-jour,')).toContain(
      `--color-amber-400:${p.sombre[400]};`,
    );
    expect(bloc('html[data-theme="clair"]{')).toContain(
      `--color-amber-400:${echelleClaire(p)[400]};`,
    );
  });

  it("l'échelle claire garde le découpage du site : une encre, un remplissage, un voile", () => {
    const p = paletteParCode("prune");
    const e = echelleClaire(p);
    expect(e[500]).toBe(p.clair.remplissage);
    expect(e[950]).toBe(p.clair.voile);
    for (const palier of [
      50, 100, 200, 300, 400, 600, 700, 800, 900,
    ] as const) {
      expect(e[palier], `palier ${palier}`).toBe(p.clair.encre);
    }
  });

  it("ne laisse passer aucune valeur qui ne soit une couleur : la feuille est injectée telle quelle", () => {
    // La feuille entre dans la page par dangerouslySetInnerHTML. Elle ne vient
    // que de ce registre, mais le test garde la porte : rien que des
    // déclarations de variables, sans balise ni accolade parasite.
    for (const p of PALETTES) {
      const f = feuilleDePalette(p.code);
      expect(f).not.toMatch(/[<>]/);
      expect(f.match(/\{/g)?.length ?? 0).toBe(f.match(/\}/g)?.length ?? 0);
    }
  });
});
