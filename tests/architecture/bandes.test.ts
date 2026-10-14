import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BANDES,
  PAGES_A_BANDES,
  bandesDeLaPage,
} from "../../src/config/bandes";

/**
 * LE REGISTRE DES BANDES ET LE CODE DES PAGES NE DIVERGENT PAS.
 *
 * Le registre dit à l'administrateur quelles parties existent. Si une bande y
 * est listée sans exister dans une page, le réglage promet un effet qui n'a
 * jamais lieu ; si une page pose une bande que le registre ignore, elle
 * échappe au réglage et aux règles qui le gardent. Aucune de ces deux fautes
 * ne casse un rendu : elles se paient en confiance.
 */

const SRC = join(process.cwd(), "src");

function sources(dossier: string): { chemin: string; code: string }[] {
  const out: { chemin: string; code: string }[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) out.push(...sources(chemin));
    else if (entree.endsWith(".tsx"))
      out.push({ chemin, code: readFileSync(chemin, "utf8") });
  }
  return out;
}

const TOUT = [
  ...sources(join(SRC, "app")),
  ...sources(join(SRC, "components")),
];
const nu = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/** Les identifiants posés sur une bande : <Bande id="…">, <BandeFinale id="…">, etc. */
const POSES = TOUT.flatMap(({ chemin, code }) =>
  [...nu(code).matchAll(/<Bande\w*\s+id="([^"]+)"/g)].map((m) => ({
    id: m[1]!,
    chemin,
  })),
);

describe("le registre des bandes", () => {
  it("n'a pas deux fois le même identifiant, et chacun est « page.nom »", () => {
    const ids = BANDES.map((b) => b.id);
    expect(new Set(ids).size, "un identifiant en double").toBe(ids.length);
    for (const b of BANDES) {
      expect(b.id, `${b.id} n'est pas de la forme page.nom`).toMatch(
        /^[a-z]+\.[a-z-]+$/,
      );
      expect(b.nom.length, `${b.id} n'a pas de nom lisible`).toBeGreaterThan(3);
    }
  });

  it("ne liste que des pages qui existent, et chacune en a au moins une bande", () => {
    expect(PAGES_A_BANDES.length).toBeGreaterThan(3);
    for (const { page } of PAGES_A_BANDES) {
      const fichier = join(
        SRC,
        "app",
        page === "/" ? "" : page.slice(1),
        "page.tsx",
      );
      expect(existsSync(fichier), `la page ${page} n'existe pas`).toBe(true);
      expect(bandesDeLaPage(page).length, `${page} sans bande`).toBeGreaterThan(
        0,
      );
    }
    for (const b of BANDES) {
      expect(
        PAGES_A_BANDES.some((p) => p.page === b.page),
        `${b.id} désigne une page non listée`,
      ).toBe(true);
    }
  });

  it("chaque bande du registre est posée dans le code, exactement une fois", () => {
    for (const b of BANDES) {
      const lieux = POSES.filter((p) => p.id === b.id);
      expect(
        lieux.length,
        `${b.id} : promise à l'admin, jamais posée dans une page`,
      ).toBe(1);
    }
  });

  it("chaque bande posée dans le code est au registre", () => {
    const connus = new Set(BANDES.map((b) => b.id));
    const inconnues = POSES.filter((p) => !connus.has(p.id)).map(
      (p) => `${p.id} (${p.chemin.slice(SRC.length + 1)})`,
    );
    expect(
      inconnues,
      `bandes qui échappent au réglage :\n${inconnues.join("\n")}`,
    ).toEqual([]);
  });

  it("une bande est posée sur la page que le registre lui donne", () => {
    for (const b of BANDES) {
      const pose = POSES.find((p) => p.id === b.id);
      if (!pose) continue;
      // Une bande de l'accueil vit dans app/page.tsx, ou dans un composant
      // propre à l'accueil (QuiFaitQuoi) : on vérifie surtout le préfixe.
      const prefixe = b.id.split(".")[0]!;
      const attendu = b.page === "/" ? "accueil" : b.page.slice(1);
      expect(prefixe, `${b.id} est rangée sous la page ${b.page}`).toBe(
        attendu,
      );
    }
  });

  it("pose le titre de la page dans une bande qui le dit", () => {
    // La règle de tête de page s'appuie sur ce drapeau : une page complète
    // dont aucune bande ne porte le h1 ne pourrait jamais ouvrir sur un
    // contre-jour, et une qui en désignerait deux serait ambiguë.
    for (const { page, partielle } of PAGES_A_BANDES) {
      if (partielle) continue;
      const portent = bandesDeLaPage(page).filter((b) => b.porteLeH1);
      expect(
        portent.length,
        `${page} : ${portent.length} bandes portent le titre`,
      ).toBe(1);
    }
  });
});
