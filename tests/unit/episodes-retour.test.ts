import { describe, expect, it } from "vitest";
import type { PartieJouee } from "../../src/config/episodes/types";
import { mulberry32 } from "../../src/engine/episodes/commun";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { observer } from "../../src/pedagogy/profil/observations";
import {
  competencesObservees,
  lectureDuTirage,
  phrasesDeRobustesse,
} from "../../src/pedagogy/profil/retour";

/**
 * Les nouveaux blocs du bilan ne disent rien qui ne soit tiré de la partie :
 * des décisions nommées et des décomptes, et le mot qui résume après le fait.
 */
function partieAuHasard(i: number): PartieJouee {
  const ep = EPISODES[i % EPISODES.length]!;
  const r = mulberry32(100 + i);
  return {
    graine: 1 + Math.floor(r() * 9000),
    chemin: ep.etapes.map((e) => Math.floor(r() * e.options.length)),
    consultes: ep.etapes.map((e) => e.sources.filter(() => r() < 0.5).map((s) => s.id)),
    jours: ep.enquete.joursSansPerte,
    diagnostic: ep.diagnostics[Math.floor(r() * ep.diagnostics.length)]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: ep.prevision.min,
    confiance: 80,
    niveau: "standard",
  };
}

describe("la place du tirage", () => {
  it("dit le fait, puis le mot qui le résume", () => {
    expect(lectureDuTirage(1, 30)).toBe(
      "Avec vos choix, votre trimestre est le meilleur sur 30 tirages du hasard : vous avez eu de la chance.",
    );
    expect(lectureDuTirage(10, 30)).toMatch(/le 10e sur 30 .* un peu de chance/);
    expect(lectureDuTirage(15, 30)).toMatch(/un hasard ordinaire/);
    expect(lectureDuTirage(22, 30)).toMatch(/un peu de malchance/);
    expect(lectureDuTirage(30, 30)).toMatch(/le 30e sur 30 .* de la malchance/);
  });
});

describe("les blocs du retour, sur des parties variées de tous les épisodes", () => {
  const interdits =
    /vous êtes|personnalit|potentiel|talent|impulsi|analytique|aversion|note globale/i;

  it("comptent les choix qui tiennent et nomment les décisions exposées", () => {
    for (let i = 0; i < 30; i++) {
      const ep = EPISODES[i]!;
      const { mesures } = observer(ep, partieAuHasard(i));
      const phrases = phrasesDeRobustesse(ep, mesures);
      expect(phrases[0], ep.code).toMatch(/^\d de vos 6 choix tiennent/);
      expect(phrases.at(-1), ep.code).toMatch(/sur 30 tirages du hasard/);
      for (const p of phrases.slice(1, -1)) expect(p, ep.code).toMatch(/D\d|Le plus coûteux : D\d/);
      for (const p of phrases) expect(p).not.toMatch(interdits);
    }
  });

  it("disent ce que l'épisode a observé, compétence par compétence, avec des décomptes", () => {
    for (let i = 0; i < 30; i++) {
      const ep = EPISODES[i]!;
      const { observations } = observer(ep, partieAuHasard(i));
      const lignes = competencesObservees(observations);
      // Le diagnostic, la révision et la prévision sont observés dans chaque épisode.
      for (const c of ["R2", "R3", "R7"])
        expect(
          lignes.map((l) => l.code),
          ep.code,
        ).toContain(c);
      for (const l of lignes) {
        expect(l.phrase, `${ep.code} ${l.code}`).toMatch(
          /\d|juste|proche|loin|à revoir|corrigé|maintenu|abandonné/,
        );
        expect(l.phrase).not.toMatch(interdits);
      }
      const poids = lignes.map((l) => l.poids);
      expect(poids).toEqual([...poids].sort((a, b) => b - a));
    }
  });
});
