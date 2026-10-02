import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE JEU AVANT L'ADMINISTRATION.
 *
 * Mesuré dans un navigateur, sur un téléphone de 844 px : l'élève ouvrait sa
 * partie sur 461 px d'identité, de clé de reprise et de composition d'équipes,
 * puis sur la frise des tours clos, qui commence au tour 1. Le tour qu'il avait
 * à jouer était en bas d'une page de 2 718 px. Il arrive maintenant à 227 px,
 * c'est-à-dire dans le premier écran.
 *
 * Ce fichier tient l'ordre, qui est la seule chose qui ne se voit pas dans une
 * capture : une section déplacée par mégarde repasserait inaperçue.
 */

const PAGE = readFileSync(join(process.cwd(), "src/app/arena/[gameId]/page.tsx"), "utf8");

/** La position du premier repère trouvé, ou -1. */
function position(repere: string): number {
  return PAGE.indexOf(repere);
}

describe("l'ordre de l'arène", () => {
  it("le tour en cours vient avant les tours clos", () => {
    const actif = position('id="tour-en-cours"');
    // Les tours clos sont déclarés en constante (`toursPasses`) puis POSÉS dans la page :
    // c'est la pose, la dernière occurrence, qui fixe l'ordre à l'écran.
    const passes = PAGE.lastIndexOf("{toursPasses}");
    expect(actif).toBeGreaterThan(0);
    expect(passes).toBeGreaterThan(0);
    expect(actif, "les tours clos ont repris la tête de la page").toBeLessThan(passes);
  });

  it("l'identité, la clé et la composition viennent après le jeu", () => {
    const actif = position('id="tour-en-cours"');
    // La composition est une constante (`compositionNode`) posée dans la page.
    for (const bloc of ['id="mon-profil"', "{telephone ? null : compositionNode}"]) {
      expect(position(bloc), bloc).toBeGreaterThan(actif);
    }
  });

  it("le lien vers les résultats du tour clos descend, puisqu'ils sont dessous", () => {
    // Le lien lui-même, pas la première mention du mot dans un commentaire.
    const depart = PAGE.indexOf('href="#dernier-resultat"');
    expect(depart).toBeGreaterThan(0);
    const lien = PAGE.slice(depart, depart + 900);
    expect(lien).toContain("voir les résultats");
    expect(lien).toContain("↓");
    expect(lien).not.toContain("↑");
  });

  it("le nom du joueur reste visible dans le bandeau de jeu", () => {
    // C'était le seul rôle que l'encadré descendu remplissait mieux qu'une
    // ligne : prévenir qu'on joue sous l'identité du poste précédent.
    // L'en-tête de la page est le dernier `<header` du fichier : les cartes du
    // téléphone, déclarées plus haut, en ont chacune un.
    const entete = PAGE.slice(PAGE.lastIndexOf("<header"), PAGE.lastIndexOf("</header>"));
    expect(entete).toContain("view.playerPseudo");
    expect(entete).toContain('href="#mon-profil"');
  });
});

describe("la barre du site, en partie", () => {
  const BARRE = readFileSync(join(process.cwd(), "src/components/site-header.tsx"), "utf8");

  it("ne rend ni la vitrine ni les portes d'entrée dans l'arène", () => {
    expect(BARRE).toContain('chemin?.startsWith("/arena/")');
    // Rendus conditionnellement, pas seulement masqués : un lien caché reste
    // dans la page pour un lecteur d'écran.
    expect(BARRE).toContain("{enJeu ? null : (");
    expect(BARRE.match(/\{enJeu \? null : \(/g) ?? []).toHaveLength(3);
  });

  it("garde le plan complet, qui est la garantie d'atteignabilité", () => {
    expect(BARRE).toContain('aria-controls="plan-du-site"');
  });
});
