import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { bilanDesObjectifs } from "@/pedagogy/cours/aides-du-guide";

/**
 * CHAQUE ÉTAPE DIT L'OBJECTIF QU'ELLE TRAVAILLE (demande du propriétaire, octobre 2026).
 *
 * Le bilan de fin de chapitre se lit objectif par objectif : il ne tient que si chaque étape
 * notée renvoie à un objectif qui existe, et si chaque objectif est travaillé par au moins une
 * étape notée. Une étape de lecture n'en travaille aucun.
 */

describe("les objectifs des étapes", () => {
  it("chaque indice existe, et une lecture n'en porte pas", () => {
    for (const c of CHAPITRES) {
      for (const e of c.etapes) {
        for (const k of e.objectifs ?? []) {
          expect(Number.isInteger(k) && k >= 0 && k < c.objectifs.length, `${c.code} ${e.id} ${k}`).toBe(true);
        }
        if (e.type === "lecture") expect(e.objectifs, `${c.code} ${e.id}`).toBeUndefined();
        expect(new Set(e.objectifs ?? []).size, `${c.code} ${e.id} sans doublon`).toBe((e.objectifs ?? []).length);
      }
    }
  });

  it("chaque étape notée dit au moins un objectif", () => {
    const sans = CHAPITRES.flatMap((c) => c.etapes.filter((e) => e.type !== "lecture" && !e.objectifs?.length).map((e) => `${c.code} ${e.id}`));
    expect(sans).toEqual([]);
  });

  it("chaque objectif est travaillé par au moins une étape notée", () => {
    const orphelins = CHAPITRES.flatMap((c) =>
      c.objectifs.flatMap((o, k) => (c.etapes.some((e) => e.type !== "lecture" && e.objectifs?.includes(k)) ? [] : [`${c.code} : ${o}`])),
    );
    expect(orphelins).toEqual([]);
  });

  it("dans chaque entreprise, chaque objectif garde une étape notée (les étapes `si` n'en vident aucun)", () => {
    const vides = CHAPITRES.flatMap((c) =>
      (c.entreprises?.codes ?? ENTREPRISES_DU_COURS).flatMap((code) => {
        const ch = chapitreDuCas(c, casDeLEntreprise(code));
        return c.objectifs.flatMap((_, k) => (ch.etapes.some((e) => e.type !== "lecture" && e.objectifs?.includes(k)) ? [] : [`${c.code} ${code} ${k}`]));
      }),
    );
    expect(vides).toEqual([]);
  }, 60_000);

  it("le chapitre servi porte les objectifs des étapes et les compétences du référentiel", () => {
    for (const c of CHAPITRES) {
      const servi = servirLeChapitre(c, casDeLEntreprise(c.entreprises?.codes[0] ?? ENTREPRISES_DU_COURS[0]!));
      expect(servi.blocs, c.code).toEqual(c.blocs);
      for (const e of servi.etapes) expect(e.objectifs, `${c.code} ${e.id}`).toEqual(c.etapes.find((x) => x.id === e.id)!.objectifs);
    }
  }, 60_000);
});

describe("le bilan objectif par objectif", () => {
  const objectifs = ["Compter", "Ranger", "Juger"];
  const etapes = [
    { id: "intro", titre: "Intro", type: "lecture" },
    { id: "a", titre: "A", type: "montants", objectifs: [0] },
    { id: "b", titre: "B", type: "choix", objectifs: [0, 1] },
    { id: "c", titre: "C", type: "tri", objectifs: [2] },
  ];

  it("acquis du premier coup, en cours après une erreur, à revoir avec la correction", () => {
    const bilan = bilanDesObjectifs(objectifs, etapes, {
      a: { essais: 1, reussi: true, aide: false },
      b: { essais: 3, reussi: true, aide: false },
      c: { essais: 2, reussi: true, aide: true },
    });
    expect(bilan).toEqual([
      { objectif: "Compter", etat: "en-cours", aRevoir: [{ id: "b", titre: "B", index: 2 }] },
      { objectif: "Ranger", etat: "en-cours", aRevoir: [{ id: "b", titre: "B", index: 2 }] },
      { objectif: "Juger", etat: "a-revoir", aRevoir: [{ id: "c", titre: "C", index: 3 }] },
    ]);
  });

  it("tout du premier coup : tout est acquis, rien à revoir ; une étape jamais faite est à revoir", () => {
    const parfait = { essais: 1, reussi: true, aide: false };
    expect(bilanDesObjectifs(objectifs, etapes, { a: parfait, b: parfait, c: parfait })!.map((o) => [o.etat, o.aRevoir.length])).toEqual([
      ["acquis", 0],
      ["acquis", 0],
      ["acquis", 0],
    ]);
    expect(bilanDesObjectifs(objectifs, etapes, { a: parfait, b: parfait })![2]!.etat).toBe("a-revoir");
  });

  it("sans objectifs aux étapes (une situation), pas de bilan ; un objectif sans étape dans le cas n'a pas d'état", () => {
    expect(bilanDesObjectifs(objectifs, etapes.map(({ objectifs: _, ...e }) => e), {})).toBeNull();
    expect(bilanDesObjectifs([...objectifs, "Absent ici"], etapes, {})![3]!.etat).toBeNull();
  });
});
