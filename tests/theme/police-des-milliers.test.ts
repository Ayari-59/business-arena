import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CHASSE_DE_LA_FINE,
  FAMILLE_DES_MILLIERS,
  FICHIER_DE_LA_FEUILLE,
  FINE,
  feuilleDeLaPoliceDesMilliers,
  policeDesMilliers,
  sommeDeControle,
} from "../../scripts/police-des-milliers";

/**
 * LES MILLIERS LISIBLES (décision du propriétaire du 11 novembre 2026 ; audit UX du même jour, P2-1).
 *
 * La fine qui sépare les milliers mesurait 1,4 px dans la police du site : « 1 390 276 € » se lisait
 * « 1390276 € ». Une police d'un seul caractère lui donne, à l'affichage, la chasse de l'espace
 * insécable de Barlow (scripts/police-des-milliers.ts). Ce test vérifie que la feuille versionnée est à
 * jour, que la police dit ce qu'elle doit (un navigateur rejette sans bruit une police mal formée, et la
 * fine redeviendrait illisible), et qu'elle est en tête de toutes les familles de texte du site. La
 * largeur dessinée se mesure dans un vrai navigateur (tests/e2e/cours.e2e.ts).
 */

const feuille = readFileSync(FICHIER_DE_LA_FEUILLE, "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");

/** Une police TrueType, lue table par table. */
function lire(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const n = v.getUint16(4);
  const tables = new Map<string, { position: number; longueur: number; somme: number }>();
  for (let i = 0; i < n; i++) {
    const p = 12 + 16 * i;
    const etiquette = String.fromCharCode(b[p]!, b[p + 1]!, b[p + 2]!, b[p + 3]!);
    tables.set(etiquette, { somme: v.getUint32(p + 4), position: v.getUint32(p + 8), longueur: v.getUint32(p + 12) });
  }
  const table = (e: string) => {
    const t = tables.get(e)!;
    return { ...t, octets: b.slice(t.position, t.position + t.longueur) };
  };
  return { v, n, tables, table };
}

/** Le glyphe d'un caractère, par la sous-table de format 4 de `cmap`. */
function glypheDe(police: ReturnType<typeof lire>, caractere: number): number {
  const { v } = police;
  const cmap = police.tables.get("cmap")!.position;
  const sousTables = v.getUint16(cmap + 2);
  for (let i = 0; i < sousTables; i++) {
    const plateforme = v.getUint16(cmap + 4 + 8 * i);
    const codage = v.getUint16(cmap + 6 + 8 * i);
    const st = cmap + v.getUint32(cmap + 8 + 8 * i);
    if (plateforme !== 3 || codage !== 1 || v.getUint16(st) !== 4) continue;
    const segments = v.getUint16(st + 6) / 2;
    for (let s = 0; s < segments; s++) {
      const fin = v.getUint16(st + 14 + 2 * s);
      const debut = v.getUint16(st + 16 + 2 * segments + 2 * s);
      const delta = v.getUint16(st + 16 + 4 * segments + 2 * s);
      if (caractere >= debut && caractere <= fin) return (caractere + delta) & 0xffff;
    }
  }
  return 0;
}

describe("la police des milliers", () => {
  it("la feuille versionnée est à jour (npx tsx scripts/police-des-milliers.ts sinon)", () => {
    expect(feuille, "npx tsx scripts/police-des-milliers.ts").toBe(feuilleDeLaPoliceDesMilliers());
  });

  it("la police est une TrueType bien formée : tables, sommes de contrôle, nombre magique", () => {
    const b = policeDesMilliers();
    const police = lire(b);
    expect(police.v.getUint32(0)).toBe(0x00010000);
    expect([...police.tables.keys()]).toEqual(["OS/2", "cmap", "glyf", "head", "hhea", "hmtx", "loca", "maxp", "name", "post"]);
    for (const [e, t] of police.tables) {
      expect(t.position % 4, e).toBe(0);
      const octets = police.table(e).octets;
      if (e === "head") {
        const sansAjustement = octets.slice();
        new DataView(sansAjustement.buffer).setUint32(8, 0);
        expect(sommeDeControle(sansAjustement), e).toBe(t.somme);
      } else {
        expect(sommeDeControle(octets), e).toBe(t.somme);
      }
    }
    expect(sommeDeControle(b)).toBe(0xb1b0afba);
    const head = police.tables.get("head")!.position;
    expect(police.v.getUint32(head + 12)).toBe(0x5f0f3cf5);
    expect(police.v.getUint16(head + 18)).toBe(1000);
    expect(police.tables.get("OS/2")!.longueur).toBe(96);
  });

  it("elle ne porte que la fine, à la chasse de l'espace insécable de Barlow : un cinquième de cadratin", () => {
    const police = lire(policeDesMilliers());
    expect(glypheDe(police, FINE)).toBe(1);
    expect(glypheDe(police, 0x20)).toBe(0);
    expect(glypheDe(police, 0x30)).toBe(0);
    const hmtx = police.tables.get("hmtx")!.position;
    expect(police.v.getUint16(hmtx + 4)).toBe(CHASSE_DE_LA_FINE);
    expect(CHASSE_DE_LA_FINE / police.v.getUint16(police.tables.get("head")!.position + 18)).toBe(0.2);
    expect(feuille).toContain("unicode-range: U+202F;");
    expect(feuille).toContain(`font-family: "${FAMILLE_DES_MILLIERS}";`);
  });

  it("elle est en tête de toutes les familles de texte du site, et la politique de sécurité la laisse passer", () => {
    expect(globals).toContain('@import "./police-des-milliers.css";');
    for (const jeton of ["--font-sans", "--font-display", "--font-titre"]) {
      const valeur = new RegExp(`${jeton}:\\s*([^;]+);`).exec(globals)?.[1] ?? "";
      expect(valeur.trim(), jeton).toMatch(new RegExp(`^"${FAMILLE_DES_MILLIERS}",`));
    }
    const declarations = [...globals.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(declarations.length).toBeGreaterThan(10);
    const sans = declarations.filter((d) => !d.startsWith("var(--font-sans)") && !d.startsWith("var(--font-display)") && !d.startsWith("var(--font-titre)") && !d.startsWith(`"${FAMILLE_DES_MILLIERS}"`));
    expect(sans).toEqual([]);
    expect(readFileSync("src/config/security-headers.ts", "utf8")).toContain(`"font-src 'self' data:"`);
  });
});
