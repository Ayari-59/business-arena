import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEMPS_DU_TOUR } from "@/config/temps-du-tour";

/**
 * LES SIX TEMPS SONT CEUX DU PRODUIT, PAS CEUX DE LA VITRINE.
 *
 * Une chaîne d'étapes sur une page d'accueil est le genre de chose qu'on
 * écrit une fois et qui survit à tout : on renomme un écran dans l'arène, on
 * déplace un moment du tour, et l'accueil continue d'annoncer l'ancien
 * enchaînement pendant des mois. Personne ne relit une page qui n'a pas
 * changé.
 *
 * La garde tient donc trois choses. Que chacun des six mots soit du
 * VOCABULAIRE DU PRODUIT, retrouvé ailleurs que sur l'accueil — dans le guide
 * qui décrit le tour, ou dans le code qui le fait tourner. Que l'ORDRE soit
 * celui qui fait la différence : le diagnostic et le choix du modèle AVANT la
 * décision, c'est tout l'argument. Et que la chaîne reste SANS NUMÉROS, parce
 * que les panneaux de la démonstration en portent déjà.
 */

const RACINE = process.cwd();
const lire = (p: string) => readFileSync(join(RACINE, p), "utf8");

const ACCUEIL = lire("src/app/page.tsx");
/** Là où le produit parle de son tour, hors de la vitrine. */
const PRODUIT = [
  lire("src/app/guide/page.tsx"),
  lire("src/components/demo-du-tour.tsx"),
  lire("src/config/pedagogy/models.ts"),
].join("\n");

describe("les six temps du tour", () => {
  it("sont six, et nommés une seule fois", () => {
    expect(TEMPS_DU_TOUR).toHaveLength(6);
    const noms = TEMPS_DU_TOUR.map((t) => t.nom);
    expect(new Set(noms).size).toBe(noms.length);
    // L'accueil les lit, il ne les récrit pas.
    expect(ACCUEIL).toContain("TEMPS_DU_TOUR.map");
  });

  it("emploient le vocabulaire du produit", () => {
    for (const { nom } of TEMPS_DU_TOUR) {
      // Le mot doit exister ailleurs que sur la page qui l'annonce : sinon
      // c'est un mot de vitrine, et rien ne le rattache à ce qui est joué.
      const racine = nom.toLowerCase().replace(/e$/, "");
      expect(
        PRODUIT.toLowerCase(),
        `« ${nom} » n'apparaît nulle part dans le produit`,
      ).toContain(racine);
    }
  });

  it("mettent le diagnostic et le modèle AVANT la décision", () => {
    // C'est l'argument entier : on ne décide pas d'abord. Un ordre qui
    // glisserait ferait de la chaîne la description d'un jeu d'entreprise
    // ordinaire.
    const rang = (nom: string) => TEMPS_DU_TOUR.findIndex((t) => t.nom === nom);
    expect(rang("Situation")).toBe(0);
    expect(rang("Diagnostic")).toBeLessThan(rang("Décision"));
    expect(rang("Modèle")).toBeLessThan(rang("Décision"));
    expect(rang("Décision")).toBeLessThan(rang("Résultat"));
    expect(rang("Résultat")).toBeLessThan(rang("Débriefing"));
    expect(rang("Débriefing")).toBe(TEMPS_DU_TOUR.length - 1);
  });

  it("disent chacun ce qui s'y passe, en une phrase", () => {
    for (const t of TEMPS_DU_TOUR) {
      expect(t.quoi.length, `« ${t.nom} » n'explique rien`).toBeGreaterThan(30);
      expect(t.quoi.endsWith("."), `« ${t.nom} » : la phrase n'est pas finie`).toBe(true);
    }
  });

  it("ne portent pas de numéros", () => {
    // Les panneaux de la démonstration sont numérotés « 1 · », « 2 · »,
    // « 3 · » : ce sont les trois qu'ils déroulent, pas les rangs de ces
    // temps-là. Deux numérotations sur un écran se contrediraient.
    for (const { nom } of TEMPS_DU_TOUR) {
      expect(nom, `« ${nom} » porte un chiffre`).not.toMatch(/\d/);
    }
  });
});
