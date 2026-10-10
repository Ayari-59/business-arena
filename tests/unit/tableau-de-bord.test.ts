import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LigneDeLArdoise, TableauDeBord, type TourChiffre } from "@/components/tableau-de-bord";

/**
 * OÙ EN EST MON ENTREPRISE, ET DANS QUEL SENS ELLE VA.
 *
 * Trois tuiles : la valeur du dernier tour clos, l'écart avec le précédent, et
 * la courbe depuis le début. Ce qui doit tenir :
 *
 * · LA COULEUR NE DÉCIDE DE RIEN TOUTE SEULE. Le vert d'un résultat positif et
 *   le rouge d'un négatif se confondent pour une partie des daltoniens —
 *   mesuré à 4,6 d'écart perçu en deutéranopie, là où huit sont demandés. Le
 *   signe est donc écrit dans le nombre et dans l'écart.
 * · RIEN À MONTRER, RIEN À AFFICHER. Une courbe d'un point n'est pas une
 *   courbe, et un tableau de bord vide prend la place du jeu.
 * · CHAQUE TOUR EST SURVOLABLE, et sa valeur reste lisible sans la souris.
 */

const tours: TourChiffre[] = [
  { round: 1, libelle: "Trimestre 1", ca: 187_545, resultat: -21_227, tresorerie: -15_633 },
  { round: 2, libelle: "Trimestre 2", ca: 207_140, resultat: -11_849, tresorerie: -55_912 },
  { round: 3, libelle: "Trimestre 3", ca: 300_337, resultat: 32_729, tresorerie: -27_198 },
];

const rendre = (t: TourChiffre[]) =>
  renderToStaticMarkup(createElement(TableauDeBord, { tours: t }));

describe("le tableau de bord de l'élève", () => {
  it("ne s'affiche pas tant qu'aucun tour n'est clos", () => {
    expect(rendre([])).toBe("");
  });

  it("porte les trois chiffres de la maison, ceux des lignes de résumé", () => {
    const html = rendre(tours);
    for (const titre of ["CA", "Résultat", "Trésorerie"]) expect(html).toContain(titre);
    // La valeur montrée est celle du DERNIER tour clos, pas la première.
    expect(html).toContain("300");
    expect(html).toContain("32");
  });

  it("écrit le signe, au lieu de le confier à la couleur", () => {
    const html = rendre(tours);
    // Le résultat du dernier tour est positif, la trésorerie négative : les
    // deux se lisent sans voir la moindre couleur.
    expect(html).toMatch(/-\s?27/);
    // Et l'écart porte son signe, pas seulement sa flèche.
    expect(html).toContain("+");
  });

  it("dit « stable » plutôt que « −0 € » quand rien n'a bougé", () => {
    const plats = tours.map((t) => ({ ...t, ca: 200_000 }));
    expect(rendre(plats)).toContain("stable");
    expect(rendre(plats)).not.toContain("▼ -0");
  });

  it("dit « premier tour » quand il n'y a rien à comparer", () => {
    expect(rendre(tours.slice(0, 1))).toContain("premier tour");
  });

  it("donne à chaque courbe un texte de remplacement chiffré", () => {
    const html = rendre(tours);
    expect(html).toContain("Chiffre d&#x27;affaires, tour par tour");
    expect(html).toContain("Trimestre 1");
  });

  it("rend chaque tour survolable, avec sa valeur", () => {
    const html = rendre(tours);
    // Un point de survol par tour et par tuile, et son infobulle.
    expect((html.match(/<title>/g) ?? []).length).toBe(tours.length * 3);
  });

  it("ne trace la ligne de zéro que là où le signe veut dire quelque chose", () => {
    const html = rendre(tours);
    // Deux tuiles sur trois : le résultat et la trésorerie. Le chiffre
    // d'affaires ne passe pas sous zéro, une ligne de zéro n'y dirait rien.
    expect((html.match(/<line /g) ?? []).length).toBeLessThanOrEqual(2);
  });
});

/**
 * L'ARDOISE DU DIRIGEANT, GARDÉE. Les trois tuiles s'arrêtaient aux trois
 * quarts de la largeur, en chiffres de 16 px, sous un cadre de tour orange.
 * Ce qui doit tenir :
 *   · un bandeau MARINE, en tête de l'arène, à chaque étape du tour ;
 *   · l'entreprise et le tour (« NOVA · Tour 3/6 »), puis CA, résultat,
 *     trésorerie et rang, en très grands chiffres tabulaires ;
 *   · le rang en or (une distinction), l'écart signé en vert ou rouge francs,
 *     la courbe en bleu donnée, jamais dans la couleur d'un résultat ;
 *   · avant tout tour clos, une ligne, pas un tableau de tirets ;
 *   · repliée, une ligne : CA · Rés. · Tréso. · Rang.
 */
describe("l'ardoise du dirigeant", () => {
  const entete = {
    entreprise: "NOVA",
    tour: "Tour 4/6",
    sousTitre: "Industrie · Niveau 3 · Pilotage",
    rang: { place: 2, sur: 3 },
    ipg: 61.4,
  };
  const ardoise = (t: TourChiffre[]) =>
    renderToStaticMarkup(createElement(TableauDeBord, { tours: t, entete }));

  it("est un bandeau marine qui dit l'entreprise, le tour et le rôle de l'écran", () => {
    const html = ardoise(tours);
    // Lot P3 : l'ardoise est un panneau d'INFORMATION, posé à plat sur le sol
    // marine du cockpit (elle ne vit que dans l'arène), sans l'arête du métier
    // ni la lumière de scène : l'arête est au seul panneau de décision en cours.
    expect(html).toMatch(/^<section id="ardoise-du-dirigeant"[^>]*class="ardoise panneau-info /);
    expect(html).not.toMatch(/arete-metier|lumiere-de-scene/);
    expect(html).toContain("Tableau de bord du dirigeant");
    expect(html).toContain("NOVA");
    expect(html).toContain("Tour 4/6");
  });

  it("porte quatre chiffres en très grand corps, tabulaires, le rang en or", () => {
    const html = ardoise(tours);
    for (const titre of ["CA", "Résultat", "Trésorerie", "Rang"])
      expect(html).toContain(`>${titre}<`);
    // De 32 px (téléphone) à 40 px (grand écran), en chiffres tabulaires.
    expect((html.match(/text-\[clamp\(2rem,1\.6rem_\+_1\.2vw,2\.5rem\)\]/g) ?? []).length).toBe(4);
    expect(html).toMatch(/font-display[^"]*tabular-nums|tabular-nums[^"]*font-display/);
    expect(html).toMatch(/texte-or[^>]*>2e/);
    expect(html).toContain("pastille-rang-2");
    expect(html).toContain("IPG 61");
  });

  it("signe l'écart en vert ou en rouge francs, et trace les courbes à la teinte du métier", () => {
    const html = ardoise(tours);
    // CA et résultat montent (vert) ; la trésorerie remonte aussi (vert).
    expect(html).toMatch(/text-emerald-300[^>]*><span aria-hidden="true">▲/);
    const baisse = ardoise([tours[0]!, { ...tours[1]!, ca: 100_000 }]);
    expect(baisse).toMatch(/text-red-300[^>]*><span aria-hidden="true">▼/);
    // Trois courbes, toutes à la teinte du métier de la partie (lot 5A),
    // aucune dans une couleur de résultat. Hors d'une partie, l'encre de la
    // donnée reste la valeur de repli.
    const courbes = html.match(/<polyline[^>]*>/g) ?? [];
    expect(courbes.length).toBe(3);
    for (const c of courbes) expect(c).toContain("text-[color:var(--metier,var(--donnee))]");
    expect(html).not.toMatch(/<polyline[^>]*(emerald|red|sky)/);
  });

  it("au premier tour clos, la valeur seule et « premier tour », sans courbe", () => {
    const html = ardoise(tours.slice(0, 1));
    expect(html).toContain("premier tour");
    expect(html).not.toContain("<polyline");
  });

  it("avant le premier verdict, l'entreprise et le tour, et une ligne plutôt que des tirets", () => {
    const html = ardoise([]);
    expect(html).toContain("NOVA");
    expect(html).toContain("Tour 4/6");
    expect(html).not.toContain("<dl");
    expect(html).not.toMatch(/>—</);
    expect(html).toContain("dès que le marché aura répondu");
  });

  it("se replie en une ligne : CA · Rés. · Tréso. · Rang", () => {
    const ligne = renderToStaticMarkup(createElement(LigneDeLArdoise, { tours, entete }));
    for (const mot of ["CA", "Rés.", "Tréso.", "2e/3"]) expect(ligne).toContain(mot);
    expect(ligne).not.toContain("<svg");
    expect(ligne).not.toContain("<polyline");
  });

  it("est posée en tête de l'arène, à chaque étape, avec sa ligne repliée", () => {
    const page = readFileSync(join(process.cwd(), "src/app/arena/[gameId]/page.tsx"), "utf8");
    const main = page.slice(page.indexOf('<main id="main"'));
    const pose = main.indexOf("{tableauNode}");
    expect(pose, "l'ardoise n'est plus posée").toBeGreaterThan(0);
    // Avant le tour en cours et avant tout le reste du jeu, téléphone compris.
    expect(pose).toBeLessThan(main.indexOf('id="tour-en-cours"'));
    expect(pose).toBeLessThan(main.indexOf("<AnnonceDuTour"));
    expect(main.slice(pose - 200, pose)).not.toContain("telephone ?");
    expect(main).toContain("<ArdoiseRepliee>");
    expect(page).toMatch(/<TableauDeBord\s+tours=\{toursChiffres\}\s+entete=\{enteteArdoise\}/);
    // Le cadre du tour en cours n'a plus de filet orange.
    const cadre = main.slice(
      main.indexOf('id="tour-en-cours"'),
      main.indexOf('id="tour-en-cours"') + 600,
    );
    expect(cadre).not.toMatch(/border-amber/);
  });
});
