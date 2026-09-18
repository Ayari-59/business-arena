import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'EN-TÊTE DU TOUR EN COURS.
 *
 * Le bandeau d'état retiré du haut de l'arène portait une chose que rien
 * d'autre ne disait : le rang du tour SUR LE TOTAL. La frise le montre en
 * segments, elle ne le chiffre pas — et « Tour 2 » seul ne dit pas s'il en
 * reste six ou un. Sa disparition n'a cassé aucun test : d'où celui-ci.
 *
 * Il lit la source plutôt que le rendu, faute de mieux : la page est un
 * composant serveur qui charge la base, et aucune des deux n'est disponible
 * sous vitest. Ce qu'on tient ici, ce sont les deux décisions d'affichage, pas
 * leur mise en page.
 */
const page = readFileSync(
  join(process.cwd(), "src", "app", "arena", "[gameId]", "page.tsx"),
  "utf8",
);

/** L'en-tête de la section « Période active », du marqueur à sa fermeture. */
function enTeteDuTourEnCours(): string {
  const section = page.slice(page.indexOf("── Période active"));
  const debut = section.indexOf("<div className=");
  return section.slice(debut, section.indexOf("</div>", debut));
}

describe("le tour en cours dit son rang sur le total", () => {
  it("l'en-tête chiffre le nombre de tours de la partie", () => {
    // La faute à empêcher : n'afficher que `periodLabel(...)`, qui s'arrête au
    // numéro. « Tour 2 » n'est pas « Tour 2 / 6 ».
    const entete = enTeteDuTourEnCours();
    expect(entete).toContain("periodLabel(view.roundDays, view.currentRound)");
    expect(entete, "le total des tours a disparu de l'en-tête").toContain("view.roundsCount");
  });

  it("« en cours » n'est plus collé au libellé du tour", () => {
    // Il allongeait la seule chose qu'on lit en diagonale — le numéro. Il vit
    // à l'autre bout de la ligne, en pastille, comme « résultats livrés » sur
    // un tour clos.
    expect(enTeteDuTourEnCours()).not.toMatch(/periodLabel\([^)]*\)\}\s*en cours/);
  });

  it("et il y reste ancré quand la ligne se replie", () => {
    // Sur un téléphone, le groupe de droite passe à la ligne : sans `ml-auto`,
    // `justify-between` le renvoie au bord gauche et « tout à droite » devient
    // « en dessous, à gauche ».
    expect(enTeteDuTourEnCours()).toContain("ml-auto");
  });
});
