import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { VosReussites } from "@/components/vos-reussites";
import {
  CATALOGUE,
  reussitesDeLaPartie,
  reussitesFranchies,
  type TourJoue,
} from "@/scoring/reussites";

/**
 * LA LISTE GARDE CE QUI A ÉTÉ RÉUSSI, ET NOMME CE QUI RESTE À VISER.
 *
 * Une réussite se disait au tour où il arrivait puis disparaissait avec lui.
 * Ce qui doit tenir :
 *
 * · LE TOUR DU FRANCHISSEMENT EST CELUI DE LA LIGNE VERTE, pas un second
 *   calcul : deux façons de décider « c'est arrivé » finissent par se
 *   contredire.
 * · LES CASES VIDES SONT MONTRÉES, avec ce qu'il faut faire pour les remplir.
 * · LA FORME DIT L'ÉTAT : étoile pleine ou creuse, trait plein ou pointillé —
 *   la couleur seule ne suffit pas.
 */

const tours = (...lignes: [number, number, number][]): TourJoue[] =>
  lignes.map(([round, resultat, tresorerieNette]) => ({ round, resultat, tresorerieNette }));

const rendu = (cases: ReturnType<typeof reussitesDeLaPartie>) =>
  renderToStaticMarkup(
    createElement(VosReussites, {
      cases,
      nommerLeTour: (round: number) => `Trimestre ${round}`,
    }),
  );

describe("les réussites de la partie", () => {
  it("s'annonce sous le nom que l'élève lit, et compte ce qui est acquis", () => {
    // « Vos hauts faits » empruntait au jeu de rôle un vocabulaire que
    // personne n'emploie en cours de gestion. Le titre est la seule chose que
    // l'élève lit avant de comprendre ce que la liste contient : il est donc
    // tenu ici, et non laissé à la première réécriture venue.
    const cases = reussitesDeLaPartie(tours([1, 500, 100]));
    const html = rendu(cases);
    expect(html).toContain("Vos réussites");
    expect(html).not.toContain("hauts faits");
    expect(html).toContain(`1 sur ${cases.length}`);
  });

  it("garde le tour où chaque réussite a été franchie", () => {
    // Perte, puis bénéfice au 2 (premier bénéfice), perte au 3, bénéfice au 4
    // (retour au vert). La trésorerie repasse au-dessus de zéro au 2.
    const t = tours([1, -500, -200], [2, 300, 100], [3, -100, 50], [4, 400, 300]);
    const cases = reussitesDeLaPartie(t);
    const tour = (code: string) => cases.find((c) => c.reussite.code === code)?.round;
    expect(tour("premier_benefice")).toBe(2);
    expect(tour("tresorerie_sauvee")).toBe(2);
    expect(tour("retour_au_vert")).toBe(4);
    expect(tour("serie_verte")).toBeNull();
  });

  it("montre tout le catalogue, même sans un seul tour joué", () => {
    const cases = reussitesDeLaPartie([]);
    expect(cases).toHaveLength(CATALOGUE.length);
    expect(cases.every((c) => c.round === null)).toBe(true);
    const html = rendu(cases);
    expect(html).toContain(`0 sur ${CATALOGUE.length}`);
    for (const f of CATALOGUE) {
      expect(html).toContain(f.titre);
      // La case vide dit ce qu'il faut faire, pas ce qui est arrivé.
      expect(html).toContain(f.viser);
    }
  });

  it("dit l'état par la forme autant que par la couleur", () => {
    const cases = reussitesDeLaPartie(tours([1, -500, -200], [2, 300, 100]));
    const html = rendu(cases);
    expect(html).toContain("★"); // franchi
    expect(html).toContain("☆"); // à viser
    expect(html).toContain("border-dashed"); // à viser, sans la couleur
    expect(html).toContain("à viser");
    expect(html).toContain("Trimestre 2");
    expect(html).toContain(`2 sur ${cases.length}`);
  });

  it("ne tient qu'un seul jeu de libellés", () => {
    // Les titres vivaient dans les branches du calcul : une deuxième copie pour
    // la liste aurait divergé au premier mot changé. La réussite rendue par le
    // calcul est LA MÊME chose que la case du catalogue, pas sa copie.
    const t = tours(
      [1, -500, -200],
      [2, 300, 100],
      [3, -100, 50],
      [4, 400, 300],
      [5, 400, 350],
      [6, 400, 400],
    );
    const cases = reussitesDeLaPartie(t);
    // Cette suite franchit les quatre réussites du compte de résultat et de la
    // trésorerie ; les autres demandent des chiffres de marché, absents ici.
    expect(cases.filter((c) => c.round !== null).length).toBeGreaterThanOrEqual(4);
    for (const round of [2, 4, 6]) {
      for (const f of reussitesFranchies(t, round)) {
        expect(CATALOGUE).toContain(f);
      }
    }
  });

  it("ne promet que ce que la partie peut offrir", () => {
    // « Pari tenu » demande une prévision, « Le marché vous suit » une part de
    // marché : tous les niveaux ne les ouvrent pas. Une case à viser qu'aucune
    // décision ne permet d'atteindre serait une promesse creuse.
    const sansMarche = reussitesDeLaPartie(tours([1, 100, 500], [2, 200, 600]));
    const codes = (cs: ReturnType<typeof reussitesDeLaPartie>) =>
      cs.map((c) => c.reussite.code);
    expect(codes(sansMarche)).not.toContain("pari_tenu");
    expect(codes(sansMarche)).not.toContain("part_gagnee");
    // Les réussites qui ne tiennent que sur le résultat restent, elles.
    expect(codes(sansMarche)).toContain("premier_benefice");

    const avecMarche = reussitesDeLaPartie([
      { round: 1, resultat: 100, tresorerieNette: 500, partDeMarche: 0.2, ventesPrevues: 100, ventes: 98 },
      { round: 2, resultat: 200, tresorerieNette: 600, partDeMarche: 0.22, ventesPrevues: 100, ventes: 101 },
    ]);
    expect(codes(avecMarche)).toContain("pari_tenu");
    expect(codes(avecMarche)).toContain("part_gagnee");
  });

  it("est posée dans l'arène, en tête du profil", () => {
    const arene = readFileSync(
      join(process.cwd(), "src/app/arena/[gameId]/page.tsx"),
      "utf8",
    );
    expect(arene).toContain("<VosReussites");
    const profil = arene.indexOf('id="mon-profil"');
    expect(arene.indexOf("<VosReussites")).toBeGreaterThan(profil);
    expect(arene.indexOf("<VosReussites")).toBeLessThan(
      arene.indexOf("<IdentiteDeLAppareil"),
    );
  });
});
