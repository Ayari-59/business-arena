import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, chapitreParCode } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { baisseDuConcurrent } from "../../src/config/cours/situations/suivre-la-baisse";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import type { Etape } from "../../src/config/cours/types";

/**
 * LES MISES EN SITUATION SONT DES SITUATIONS, ET LEURS CALCULS TIENNENT.
 *
 * Une mise en situation reprend des calculs déjà vus, sans cours : sa première
 * étape pose la question du commanditaire, aucune autre n'enseigne, et la
 * dernière est la réponse qu'on lui rend. Ses chiffres se calculent dans les neuf
 * entreprises du cours sans « NaN » ni « undefined », et la bonne réponse ne se
 * devine pas à sa longueur, le défaut relevé dans les épisodes.
 */
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [
        e.question(cas, etat),
        ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]),
        ...e.explication(cas, etat),
      ];
    default:
      return [];
  }
}

describe("les mises en situation", () => {
  it("chacune reprend des chapitres qui existent, et s'ouvre par son code comme un chapitre", () => {
    expect(SITUATIONS.length).toBeGreaterThan(0);
    for (const s of SITUATIONS) {
      expect(s.reprend.length, s.code).toBeGreaterThan(0);
      for (const c of s.reprend) expect(CHAPITRES.some((x) => x.code === c), `${s.code} reprend « ${c} »`).toBe(true);
      expect(CHAPITRES.some((x) => x.code === s.code), `${s.code} porte le code d'un chapitre`).toBe(false);
      expect(chapitreParCode(s.code)).toBe(s);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
    }
  });

  it("sans cours : la question d'abord, aucune autre étape de lecture, et la réponse pour finir", () => {
    for (const s of SITUATIONS) {
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture").length, `${s.code} : une étape enseigne`).toBe(0);
      expect(s.etapes.at(-1)!.type, `${s.code} : pas de réponse à rendre`).toBe("choix");
      const codes = new Set(CONCEPTS.map((c) => c.code));
      for (const e of s.etapes) for (const n of e.notions ?? []) expect(codes, `${s.code} : notion « ${n} »`).toContain(n);
    }
  });

  it("dans chaque entreprise, des chiffres finis, une seule bonne réponse, et une réponse qui ne se devine pas à sa longueur", () => {
    for (const s of SITUATIONS) {
      for (const code of ENTREPRISES_DU_COURS) {
        const cas = casDeLEntreprise(code);
        for (const e of s.etapes) {
          if (e.si && !e.si(cas)) continue;
          for (const t of textesDe(e, cas)) {
            expect(t, `${s.code} / ${code} / ${e.id}`).not.toMatch(/NaN|undefined|Infinity/);
          }
          if (e.type === "montants") {
            for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), `${s.code} / ${code} / ${c.libelle}`).toBe(true);
          }
          if (e.type === "choix") {
            const options = e.options(cas, etat);
            expect(options.filter((o) => o.juste).length, `${s.code} / ${code} / ${e.id}`).toBe(1);
            const juste = options.find((o) => o.juste)!;
            const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
            expect(juste.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
          }
        }
      }
    }
  });
});

describe("suivre la baisse du concurrent", () => {
  it("garder la même marge demande plus de ventes que la baisse du prix, et le seuil monte", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const m = baisseDuConcurrent(casDeLEntreprise(code));
      if (m.quantiteNecessaire === null) continue;
      // La marge perd plus, en proportion, que le prix : c'est la leçon de la situation.
      expect(m.baisseDeLaMarge, code).toBeGreaterThan(10);
      expect(m.hausse!, code).toBeGreaterThan(10);
      // La quantité trouvée garde la marge, et une de moins ne la garde pas.
      expect(m.quantiteNecessaire * m.margeBaissee, code).toBeGreaterThanOrEqual(m.margeDuMois - 0.01);
      expect((m.quantiteNecessaire - 1) * m.margeBaissee, code).toBeLessThan(m.margeDuMois);
      expect(m.seuilApres!, code).toBeGreaterThan(Math.floor(m.chargesFixes / m.marge));
    }
  });
});
