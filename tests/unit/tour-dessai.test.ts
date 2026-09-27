import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BORNES, borner, jouerUnTourDessai, leconsDeLessai } from "@/pedagogy/tour-dessai";

/**
 * UN TOUR JOUABLE DANS LA PAGE D'ACCUEIL.
 *
 * La place était tenue par un cockpit dessiné, aux chiffres inventés. Ce qui
 * doit tenir maintenant qu'ils sont calculés :
 *
 * · C'EST LE VRAI MOTEUR, donc les arbitrages du jeu s'y retrouvent : le
 *   plafond de l'atelier, la demande qui suit le prix, et le bénéfice qui ne
 *   fait pas la trésorerie.
 * · LES SAISIES SONT BORNÉES CÔTÉ SERVEUR : un `min`/`max` de formulaire ne
 *   vaut que pour qui passe par le formulaire.
 * · RIEN N'EST ENREGISTRÉ : la fonction est pure et déterministe.
 */

describe("le tour d'essai", () => {
  it("rend le même tour pour les mêmes décisions", () => {
    const a = jouerUnTourDessai({ prix: 59, production: 5000 });
    const b = jouerUnTourDessai({ prix: 59, production: 5000 });
    expect(a).toEqual(b);
  });

  it("borne les saisies, quoi qu'on lui envoie", () => {
    expect(borner("abc", BORNES.prix)).toBe(BORNES.prix.defaut);
    expect(borner(null, BORNES.prix)).toBe(BORNES.prix.defaut);
    expect(borner(1e9, BORNES.prix)).toBe(BORNES.prix.max);
    expect(borner(-40, BORNES.prix)).toBe(BORNES.prix.min);
    // Et le tour joué avec une saisie hors bornes reste le tour d'une borne.
    const hors = jouerUnTourDessai({ prix: "999", production: "999999" });
    expect(hors.prix).toBe(BORNES.prix.max);
    expect(hors.production).toBe(BORNES.production.max);
  });

  it("ne produit jamais plus que l'atelier ne sait sortir", () => {
    const t = jouerUnTourDessai({ prix: 59, production: BORNES.production.max });
    expect(t.production).toBeGreaterThan(t.capacite);
    expect(t.produit).toBeLessThanOrEqual(t.capacite);
    expect(leconsDeLessai(t)[0]!.texte).toContain("dépassait l'atelier");
  });

  it("fait baisser la demande quand le prix monte", () => {
    const basPrix = jouerUnTourDessai({ prix: 45, production: 5000 });
    const hautPrix = jouerUnTourDessai({ prix: 75, production: 5000 });
    expect(hautPrix.demande).toBeLessThan(basPrix.demande);
  });

  it("dit ce qui s'est passé : clients perdus, ou enceintes sur les bras", () => {
    // Prix bas : la demande dépasse largement ce qu'on a produit.
    const perdus = jouerUnTourDessai({ prix: 45, production: 3000 });
    expect(perdus.manque).toBeGreaterThan(0);
    expect(perdus.invendus).toBe(0);
    expect(leconsDeLessai(perdus).map((l) => l.texte).join(" ")).toContain(
      "repartis sans acheter",
    );

    // Prix haut : on a produit plus que le marché n'en voulait.
    const invendus = jouerUnTourDessai({ prix: 80, production: 7000 });
    expect(invendus.invendus).toBeGreaterThan(0);
    expect(invendus.manque).toBe(0);
    expect(leconsDeLessai(invendus).map((l) => l.texte).join(" ")).toContain(
      "n'ont pas trouvé preneur",
    );
  });

  it("montre la leçon centrale du jeu quand elle se présente", () => {
    // Prix haut et plan à la capacité : le tour est bénéficiaire et la
    // trésorerie ne suit pas, parce que le stock l'a immobilisée.
    const t = jouerUnTourDessai({ prix: 80, production: 7000 });
    expect(t.resultat).toBeGreaterThan(0);
    expect(t.tresorerie).toBeLessThan(t.resultat / 2);
    expect(leconsDeLessai(t).map((l) => l.texte).join(" ")).toContain(
      "il n'en reste presque pas en caisse",
    );
  });

  it("n'en dit jamais plus de deux", () => {
    for (const prix of [40, 55, 70, 80]) {
      for (const production of [2000, 5000, 9000]) {
        expect(leconsDeLessai(jouerUnTourDessai({ prix, production })).length).toBeLessThanOrEqual(
          2,
        );
      }
    }
  });

  it("n'écrit rien nulle part", () => {
    // Le module ne connaît ni la base, ni l'invité, ni la création de partie :
    // c'est ce qui rend l'action ouverte à tous sans risque.
    const source = readFileSync(join(process.cwd(), "src/pedagogy/tour-dessai.ts"), "utf8");
    expect(source).not.toMatch(/@\/db|drizzle|getOrCreateGuestUserId|createSoloGame/);
  });

  it("a remplacé le cockpit dessiné de l'accueil", () => {
    const accueil = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(accueil).toContain("<TourDessai />");
    // Les chiffres inventés ne sont plus rendus. Hors commentaires : le
    // commentaire qui explique leur retrait les cite, et c'est très bien.
    const code = accueil.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "").replace(/\/\/.*/g, "");
    expect(code).not.toContain("346 920");
    expect(code).not.toContain("MiniKpi");
  });
});
