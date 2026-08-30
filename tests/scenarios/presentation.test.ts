import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import {
  ACCENTS_SECTEUR,
  surtitreDePartie,
  classesVignetteFinale,
  EMBLEMES_SECTEUR,
  nomEntreprise,
  promesseEntreprise,
} from "../../src/config/scenarios/presentation";

/**
 * L'identité visuelle des secteurs.
 *
 * Elle sert à deux endroits, l'accueil et la vitrine. Ce fichier garde ce que
 * le typage ne sait pas garder : que les couleurs sont bien DIFFÉRENTES d'un
 * métier à l'autre. Un `Record<Sector, …>` oblige à remplir les sept cases,
 * il n'empêche pas d'y mettre sept fois le même ambre, ce qui ruinerait
 * exactement l'effet cherché.
 */
describe("identité visuelle des secteurs", () => {
  it("chaque métier a sa propre couleur, jamais celle d'un autre", () => {
    const barres = SCENARIOS.map((d) => ACCENTS_SECTEUR[d.sector].barre);
    expect(new Set(barres).size, `couleurs partagées : ${barres.join(", ")}`).toBe(barres.length);
    const textes = SCENARIOS.map((d) => ACCENTS_SECTEUR[d.sector].texte);
    expect(new Set(textes).size).toBe(textes.length);
  });

  it("chaque métier a son propre emblème", () => {
    const emblemes = SCENARIOS.map((d) => EMBLEMES_SECTEUR[d.sector]);
    expect(new Set(emblemes).size, `emblèmes partagés : ${emblemes.join(" ")}`).toBe(
      emblemes.length,
    );
  });

  it("aucune classe n'est composée à l'exécution", () => {
    // Tailwind lit les SOURCES : une classe assemblée au moment du rendu
    // n'apparaît dans aucun fichier, n'est donc jamais générée, et la carte
    // sort sans couleur. Le défaut ne se voit pas à l'exécution, où la chaîne
    // est déjà résolue : il faut regarder le fichier lui-même.
    const source = readFileSync("src/config/scenarios/presentation.ts", "utf-8");
    const bloc = source.slice(
      source.indexOf("ACCENTS_SECTEUR"),
      source.indexOf("EMBLEMES_SECTEUR"),
    );
    expect(bloc.length, "le bloc des accents est introuvable").toBeGreaterThan(200);
    expect(bloc, "une classe est assemblée avec un gabarit").not.toContain("`");
    for (const d of SCENARIOS) {
      for (const [role, valeur] of Object.entries(ACCENTS_SECTEUR[d.sector])) {
        expect(valeur, `${d.sector}/${role} vide`).not.toBe("");
      }
    }
  });

  it("un titre se coupe en nom d'entreprise et en promesse", () => {
    // Les vignettes de l'accueil affichent les deux séparément : un titre sans
    // point médian donnerait une carte au nom interminable.
    for (const d of SCENARIOS) {
      const nom = nomEntreprise(d);
      expect(nom.length, `${d.code} : nom vide`).toBeGreaterThan(2);
      expect(nom, `${d.code} : le point médian traîne dans le nom`).not.toContain("·");
      expect(nom.length, `${d.code} : « ${nom} » est trop long pour une vignette`).toBeLessThan(30);
      const p = promesseEntreprise(d);
      expect(p, `${d.code} : titre sans promesse après le point médian`).not.toBeNull();
      expect(p!.length, `${d.code}`).toBeGreaterThan(5);
    }
  });
});

/**
 * La dernière vignette de la grille des entreprises.
 *
 * Elle renvoie vers la vitrine, elle ne porte pas d'entreprise, et elle ne
 * doit donc jamais commencer une rangée toute seule : à neuf entreprises sur
 * trois colonnes, une vignette d'une seule case tombait en dixième position,
 * cadrée à gauche sous trois rangées pleines. Ce test tient la règle pour
 * n'importe quel nombre d'entreprises, y compris ceux que le registre n'a pas
 * encore.
 */
describe("la vignette qui ferme la grille", () => {
  const largeur = (classes: string, prefixe: string) => {
    const trouvee = classes.split(" ").find((c) => c.startsWith(prefixe + ":col-span-"));
    expect(trouvee, `aucune largeur ${prefixe} dans « ${classes} »`).toBeDefined();
    return Number(trouvee!.slice((prefixe + ":col-span-").length));
  };

  it("complète la dernière rangée au lieu d'en ouvrir une", () => {
    for (let n = 1; n <= 24; n += 1) {
      const classes = classesVignetteFinale(n);
      const surSm = largeur(classes, "sm");
      const surLg = largeur(classes, "lg");
      expect(surSm, `${n} entreprises : largeur nulle`).toBeGreaterThan(0);
      expect(surLg, `${n} entreprises : largeur nulle`).toBeGreaterThan(0);
      expect(surSm, `${n} entreprises : plus large que la grille`).toBeLessThanOrEqual(2);
      expect(surLg, `${n} entreprises : plus large que la grille`).toBeLessThanOrEqual(3);
      expect((n + surSm) % 2, `${n} entreprises : la rangée de deux reste ouverte`).toBe(0);
      expect((n + surLg) % 3, `${n} entreprises : la rangée de trois reste ouverte`).toBe(0);
    }
  });

  it("l'accueil prend sa largeur du registre, pas d'une valeur écrite à la main", () => {
    // Une largeur figée dans la page redeviendrait fausse à la dixième
    // entreprise, et personne ne s'en apercevrait avant de voir la grille.
    const source = readFileSync("src/app/page.tsx", "utf-8");
    expect(source).toContain("classesVignetteFinale(");
    // La page contient plusieurs liens vers la vitrine : on vise celui de la
    // vignette, repéré par son libellé, et on remonte à sa balise ouvrante.
    const libelle = source.indexOf("Toutes les fiches");
    expect(libelle, "la vignette a changé de libellé").toBeGreaterThan(0);
    const entete = source.slice(source.lastIndexOf("<Link", libelle), libelle);
    expect(entete, "une largeur de colonnes est écrite en dur sur la vignette").not.toMatch(
      /(sm|lg):col-span-\d/,
    );
  });
});

/**
 * Le surtitre de l'écran de jeu.
 *
 * Une partie lancée seul nomme l'équipe d'après l'entreprise, si bien que le
 * nom s'affichait deux fois à trois centimètres d'intervalle : dans le surtitre
 * et dans le titre juste dessous.
 */
describe("le surtitre de l'écran de jeu", () => {
  it("ne répète pas le nom que le titre porte déjà", () => {
    for (const d of SCENARIOS) {
      const nom = nomEntreprise(d);
      const surtitre = surtitreDePartie(d.title, nom);
      expect(
        surtitre.includes(nom),
        `${d.code} : « ${surtitre} » répète « ${nom} » au dessus d'un titre qui le porte`,
      ).toBe(false);
      const promesse = promesseEntreprise(d);
      expect(surtitre, `${d.code} : la promesse a disparu`).toContain(promesse!);
    }
  });

  it("garde le nom de l'entreprise quand l'équipe s'appelle autrement", () => {
    // En classe, l'équipe s'appelle « Équipe 3 » : le nom de l'entreprise est
    // alors la seule chose qui dise ce qu'on dirige.
    for (const d of SCENARIOS) {
      const surtitre = surtitreDePartie(d.title, "Équipe 3");
      expect(surtitre, `${d.code}`).toContain(nomEntreprise(d));
      expect(surtitre, `${d.code}`).toContain(promesseEntreprise(d)!);
    }
  });

  it("l'écran de jeu ne recompose pas le surtitre à la main", () => {
    const page = readFileSync("src/app/arena/[gameId]/page.tsx", "utf-8");
    expect(page, "le surtitre est assemblé dans la page").not.toContain("Business Arena · {view");
    expect(page).toContain("surtitreDePartie(");
  });
});
