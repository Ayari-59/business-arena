import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { chapitreDuCas, etatAvant, journalAvant } from "@/pedagogy/cours/deroule";
import { lireLeCurseur, lireLeLaboratoire, positionValide, servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { soldes } from "@/pedagogy/cours/etats";

/**
 * LE CHAPITRE SERVI (audit, P0) : ce que la page envoie au navigateur à la place du
 * code du chapitre. Il doit tout porter, sans une fonction, et dire la même chose que
 * le chapitre : le même journal, les mêmes états, les mêmes lectures.
 */

const fonctions = (x: unknown, chemin = ""): string[] =>
  typeof x === "function"
    ? [chemin]
    : x && typeof x === "object"
      ? Object.entries(x).flatMap(([k, v]) => fonctions(v, `${chemin}.${k}`))
      : [];

const TOUS = [...CHAPITRES, ...SITUATIONS];
const premiere = (c: (typeof TOUS)[number]) => c.entreprises?.codes[0] ?? ENTREPRISES_DU_COURS[0]!;

describe("le chapitre servi au navigateur", () => {
  it("ne porte aucune fonction, et survit à la sérialisation", () => {
    for (const c of TOUS) {
      const servi = servirLeChapitre(c, casDeLEntreprise(premiere(c)));
      expect(fonctions(servi), c.code).toEqual([]);
      expect(JSON.parse(JSON.stringify(servi)), c.code).toEqual(servi);
    }
  }, 60_000);

  it("tient le même journal et les mêmes états que le chapitre", () => {
    for (const c of TOUS) {
      const cas = casDeLEntreprise(premiere(c));
      const ordonne = chapitreDuCas(c, cas);
      const servi = servirLeChapitre(c, cas);
      expect(servi.etapes.map((e) => e.id)).toEqual(ordonne.etapes.map((e) => e.id));
      for (let i = 0; i <= ordonne.etapes.length; i++) {
        const journal = servi.journal.slice(0, servi.ecrituresAvant[i]);
        expect(journal, `${c.code} ${i}`).toEqual(journalAvant(ordonne, cas, i));
        expect(soldes(journal)).toEqual(etatAvant(ordonne, cas, i).soldes);
      }
    }
  }, 60_000);

  it("lit le curseur et le laboratoire comme le chapitre, et la solution relève le défi", () => {
    let curseurs = 0;
    let laboratoires = 0;
    for (const c of TOUS) {
      const cas = casDeLEntreprise(premiere(c));
      for (const e of chapitreDuCas(c, cas).etapes) {
        if (e.type === "curseur") {
          curseurs++;
          const { attendu } = e.cible(cas);
          expect(lireLeCurseur(e, cas, attendu).lignes).toEqual(e.lecture(cas, attendu));
        }
        if (e.type === "simulation") {
          laboratoires++;
          const { solution } = e.defi(cas);
          const lu = lireLeLaboratoire(e, cas, solution);
          expect(lu.atteint, `${c.code} ${e.id}`).toBe(true);
          expect(lu.explication).toEqual(e.explication(cas, solution));
          expect(lu.lignes).toEqual(e.lecture(cas, solution));
        }
      }
    }
    expect(curseurs).toBeGreaterThan(5);
    expect(laboratoires).toBeGreaterThan(5);
  }, 60_000);

  it("refuse une position hors des leviers", () => {
    const leviers = [{ code: "prix", libelle: "Prix", unite: "€", min: 10, max: 20, pas: 1, depart: 15 }];
    expect(positionValide(leviers, { prix: 12 })).toEqual({ prix: 12 });
    expect(positionValide(leviers, { prix: 25 })).toBeNull();
    expect(positionValide(leviers, { prix: "12" })).toBeNull();
    expect(positionValide(leviers, null)).toBeNull();
  });
});
