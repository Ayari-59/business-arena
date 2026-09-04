import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import {
  ACCENTS_SECTEUR,
  surtitreDePartie,
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
