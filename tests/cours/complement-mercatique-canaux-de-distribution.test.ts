import { describe, expect, it } from "vitest";
import { CANAUX_DE_DISTRIBUTION as CH } from "../../src/config/cours/chapitres/canaux-de-distribution";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * LE COMPLÉMENT DE « LES CANAUX DE DISTRIBUTION » (lot D du chantier STMG, mercatique 2.1 : « Peut-on se
 * passer d'intermédiaires ? ») : la distribution intensive, sélective ou exclusive, les unités commerciales physiques
 * et virtuelles, la désintermédiation et la réintermédiation, l'ECR. Cinq étapes avant la synthèse, deux objectifs de plus, chacun travaillé ;
 * dans ces étapes, une seule bonne réponse, jamais la plus longue.
 */

const NOUVELLES = ["intensive-selective-exclusive", "les-unites-commerciales", "la-desintermediation", "la-reintermediation", "l-ecr"] as const;

describe("le complément de terminale", () => {
  it("cinq étapes avant la synthèse, au plus 20 en tout", () => {
    const ids = CH.etapes.map((e) => e.id);
    expect(ids.slice(-6)).toEqual([...NOUVELLES, "synthese"]);
    expect(ids.length).toBeLessThanOrEqual(20);
  });

  it("les deux objectifs nouveaux sont travaillés par les étapes nouvelles", () => {
    expect(CH.objectifs.slice(-2)).toEqual(["Choisir une distribution intensive, sélective ou exclusive", "Dire ce que sont la désintermédiation, la réintermédiation et l'ECR"]);
    const n = CH.objectifs.length;
    for (const k of [n - 2, n - 1]) expect(CH.etapes.some((e) => NOUVELLES.includes(e.id as (typeof NOUVELLES)[number]) && e.objectifs?.includes(k)), `objectif ${k}`).toBe(true);
  });

  it("une seule bonne réponse, jamais la plus longue", () => {
    const nova = casDeLEntreprise("nova");
    const ch = chapitreDuCas(CH, nova);
    for (const [i, e] of ch.etapes.entries()) {
      if (e.type !== "choix" || !NOUVELLES.includes(e.id as (typeof NOUVELLES)[number])) continue;
      const o = e.options(nova, etatAvant(ch, nova, i));
      const justes = o.filter((x) => x.juste);
      expect(justes, e.id).toHaveLength(1);
      expect(justes[0]!.texte.length, e.id).toBeLessThanOrEqual(Math.max(...o.filter((x) => !x.juste).map((x) => x.texte.length)));
    }
  });

  it("SoundBox intensive, NOVA sélective, Auris exclusive ; désintermédiation, réintermédiation, ECR", () => {
    expect(Object.values(triMk(CH, "intensive-selective-exclusive"))).toEqual(["intensive", "selective", "exclusive"]);
    expect(justeMk(CH, "les-unites-commerciales")).toEqual(["L'une est physique, l'autre virtuelle"]);
    expect(justeMk(CH, "la-desintermediation")).toEqual(["La désintermédiation"]);
    expect(justeMk(CH, "la-reintermediation")[0]).toMatch(/^Rarement/);
    expect(justeMk(CH, "l-ecr")[0]).toMatch(/moins de stock/);
  });
});
