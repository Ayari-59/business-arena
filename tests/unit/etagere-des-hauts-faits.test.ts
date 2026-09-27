import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { EtagereDesHautsFaits } from "@/components/etagere-des-hauts-faits";
import {
  CATALOGUE,
  etagereDesHautsFaits,
  hautsFaitsDuTour,
  type TourJoue,
} from "@/scoring/hauts-faits";

/**
 * L'ÉTAGÈRE GARDE CE QUI A ÉTÉ RÉUSSI, ET NOMME CE QUI RESTE À VISER.
 *
 * Un haut fait se disait au tour où il arrivait puis disparaissait avec lui.
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

const rendu = (cases: ReturnType<typeof etagereDesHautsFaits>) =>
  renderToStaticMarkup(
    createElement(EtagereDesHautsFaits, {
      cases,
      nommerLeTour: (round: number) => `Trimestre ${round}`,
    }),
  );

describe("l'étagère des hauts faits", () => {
  it("garde le tour où chaque haut fait a été franchi", () => {
    // Perte, puis bénéfice au 2 (premier bénéfice), perte au 3, bénéfice au 4
    // (retour au vert). La trésorerie repasse au-dessus de zéro au 2.
    const t = tours([1, -500, -200], [2, 300, 100], [3, -100, 50], [4, 400, 300]);
    const etagere = etagereDesHautsFaits(t);
    const tour = (code: string) => etagere.find((c) => c.fait.code === code)?.round;
    expect(tour("premier_benefice")).toBe(2);
    expect(tour("tresorerie_sauvee")).toBe(2);
    expect(tour("retour_au_vert")).toBe(4);
    expect(tour("serie_verte")).toBeNull();
  });

  it("montre tout le catalogue, même sans un seul tour joué", () => {
    const etagere = etagereDesHautsFaits([]);
    expect(etagere).toHaveLength(CATALOGUE.length);
    expect(etagere.every((c) => c.round === null)).toBe(true);
    const html = rendu(etagere);
    expect(html).toContain(`0 sur ${CATALOGUE.length}`);
    for (const f of CATALOGUE) {
      expect(html).toContain(f.titre);
      // La case vide dit ce qu'il faut faire, pas ce qui est arrivé.
      expect(html).toContain(f.viser);
    }
  });

  it("dit l'état par la forme autant que par la couleur", () => {
    const t = tours([1, -500, -200], [2, 300, 100]);
    const html = rendu(etagereDesHautsFaits(t));
    expect(html).toContain("★"); // franchi
    expect(html).toContain("☆"); // à viser
    expect(html).toContain("border-dashed"); // à viser, sans la couleur
    expect(html).toContain("à viser");
    expect(html).toContain("Trimestre 2");
    expect(html).toContain(`2 sur ${CATALOGUE.length}`);
  });

  it("ne tient qu'un seul jeu de libellés", () => {
    // Les titres vivaient dans les branches du calcul : une deuxième copie pour
    // l'étagère aurait divergé au premier mot changé. Le haut fait rendu par le
    // calcul est LA MÊME chose que la case du catalogue, pas sa copie.
    const t = tours(
      [1, -500, -200],
      [2, 300, 100],
      [3, -100, 50],
      [4, 400, 300],
      [5, 400, 350],
      [6, 400, 400],
    );
    const etagere = etagereDesHautsFaits(t);
    expect(etagere.every((c) => c.round !== null)).toBe(true);
    for (const round of [2, 4, 6]) {
      for (const f of hautsFaitsDuTour(t, round)) {
        expect(CATALOGUE).toContain(f);
      }
    }
  });

  it("est posée dans l'arène, en tête du profil", () => {
    const arene = readFileSync(
      join(process.cwd(), "src/app/arena/[gameId]/page.tsx"),
      "utf8",
    );
    expect(arene).toContain("<EtagereDesHautsFaits");
    const profil = arene.indexOf('id="mon-profil"');
    expect(arene.indexOf("<EtagereDesHautsFaits")).toBeGreaterThan(profil);
    expect(arene.indexOf("<EtagereDesHautsFaits")).toBeLessThan(
      arene.indexOf("<IdentiteDeLAppareil"),
    );
  });
});
