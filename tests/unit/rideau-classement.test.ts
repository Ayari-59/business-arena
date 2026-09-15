import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { classementOuvert } from "@/config/rideau-classement";

/**
 * EN CLASSE ET EN CONCOURS, C'EST L'ANIMATEUR QUI RÉVÈLE.
 *
 * Avant, l'élève voyait le classement complet — toutes les équipes, nommées,
 * avec leur rang — à la seconde où l'enseignant clôturait le tour. Le moment
 * qu'il préparait n'existait pas : quand il projetait le classement, la classe
 * l'avait déjà lu sur son téléphone.
 *
 * En solo, personne n'est là pour ouvrir : le classement face aux bots est la
 * boucle de retour du jeu, il reste immédiat.
 */

describe("le rideau", () => {
  it("solo : toujours ouvert, il n'y a pas d'animateur", () => {
    expect(classementOuvert({ kind: "solo", revelationDuDernierTourClos: null })).toBe(true);
  });

  it("une partie sans genre connu est traitée comme du solo", () => {
    // Les parties d'avant ce champ n'en portent pas : elles ne doivent pas se
    // retrouver muettes sans que personne ne puisse les ouvrir.
    expect(classementOuvert({ kind: undefined, revelationDuDernierTourClos: null })).toBe(true);
    expect(classementOuvert({ kind: null, revelationDuDernierTourClos: null })).toBe(true);
  });

  it("classe et concours : fermé tant que l'animateur n'a rien révélé", () => {
    for (const kind of ["class", "competition"]) {
      expect(classementOuvert({ kind, revelationDuDernierTourClos: null }), kind).toBe(false);
      expect(classementOuvert({ kind, revelationDuDernierTourClos: undefined }), kind).toBe(false);
    }
  });

  it("classe : ouvert dès qu'il a révélé", () => {
    expect(
      classementOuvert({ kind: "class", revelationDuDernierTourClos: new Date() }),
    ).toBe(true);
    // La date peut remonter de la base en chaîne selon le chemin de lecture.
    expect(
      classementOuvert({ kind: "class", revelationDuDernierTourClos: "2026-09-13T10:00:00Z" }),
    ).toBe(true);
  });
});

describe("le rideau se tire partout où le rang se lit", () => {
  const lire = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("la vue de partie décide par la règle commune, pas par une condition écrite à la main", () => {
    const s = lire(join("src", "services", "game-view.service.ts"));
    expect(s).toContain("classementOuvert({");
    // Le classement n'est pas masqué à l'affichage : il n'est PAS ENVOYÉ. Le
    // cockpit Excel et l'assistant IA lisent cette même vue, et sont donc muets
    // eux aussi — sinon le rideau se contournerait en exportant un tableur.
    expect(s).toContain("ranking: classementRevele ? ranking : []");
  });

  it("« mes parties », dans le profil, applique la même règle", () => {
    // C'était la fuite : le profil affichait « IPG 54 · #3 » pour une partie de
    // classe dont l'enseignant n'avait rien révélé.
    const s = lire(join("src", "services", "profile.service.ts"));
    expect(s).toContain("classementOuvert({");
  });

  it("seul l'animateur peut lever le rideau : l'action est côté enseignant", () => {
    const eleve = lire(join("src", "app", "arena", "[gameId]", "actions.ts"));
    expect(eleve).not.toContain("setRankingRevealed");
    const prof = lire(join("src", "app", "teacher", "actions.ts"));
    expect(prof).toContain("setRankingRevealed");
  });
});
