import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { FORMATIONS, formationParCode } from "@/config/formations";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import {
  ateliersDuScenario,
  CONVIENT_AUSSI,
  entreprisesEtFormations,
  formationsServies,
  formationsServiesEnPlus,
  scenariosServant,
  sertEnClair,
  teteDeFamille,
} from "@/config/scenarios/formations-servies";

/**
 * UNE MÊME ENTREPRISE SERT PLUSIEURS FORMATIONS, et le site le dit à quatre
 * endroits : les cartes de /jouer, la liste et la fiche des ateliers, les
 * parcours. Ces gardes tiennent la donnée (des codes qui existent, rien
 * d'oublié) et les pages (elles lisent le registre, elles ne le recopient pas).
 */
const code = (chemin: string) =>
  readFileSync(join(process.cwd(), chemin), "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

describe("les formations servies par une entreprise", () => {
  it("la liste éditoriale ne cite que des formations et des entreprises qui existent", () => {
    const tetes = new Set(SCENARIO_CHOICES.map((s) => s.code));
    for (const [tete, codes] of Object.entries(CONVIENT_AUSSI)) {
      expect(tetes.has(tete), `« ${tete} » n'est pas une entreprise du choix`).toBe(true);
      expect(codes.length, `${tete} : aucune formation`).toBeGreaterThan(0);
      for (const c of codes) {
        expect(formationParCode(c), `${tete} : la formation « ${c} » n'existe pas`).toBeDefined();
      }
      expect(new Set(codes).size, `${tete} : un code répété`).toBe(codes.length);
    }
  });

  it("chaque entreprise jouée par un atelier sert au moins les formations de cet atelier", () => {
    for (const a of ATELIERS) {
      const servies = formationsServies(teteDeFamille(a.reglages.scenarioCode)).map((f) => f.code);
      for (const f of a.formations) {
        expect(servies, `${a.code} : ${a.reglages.scenarioCode} ne liste pas ${f}`).toContain(f);
      }
      expect(ateliersDuScenario(teteDeFamille(a.reglages.scenarioCode)).map((x) => x.code)).toContain(a.code);
    }
  });

  it("chaque entreprise du choix sert au moins une formation, dans l'ordre du registre", () => {
    const ordre = FORMATIONS.map((f) => f.code);
    for (const s of SCENARIO_CHOICES) {
      const servies = formationsServies(s.code);
      expect(servies.length, `${s.code} ne sert aucune formation`).toBeGreaterThan(0);
      const rangs = servies.map((f) => ordre.indexOf(f.code));
      expect([...rangs].sort((x, y) => x - y), `${s.code} : pas dans l'ordre du registre`).toEqual(rangs);
    }
    expect(entreprisesEtFormations().map((e) => e.scenario.code)).toEqual(SCENARIO_CHOICES.map((s) => s.code));
  });

  it("« sert aussi » retire les formations de la fiche, et les parcours retrouvent leurs entreprises", () => {
    for (const a of ATELIERS) {
      const enPlus = formationsServiesEnPlus(a).map((f) => f.code);
      for (const f of a.formations) expect(enPlus, a.code).not.toContain(f);
    }
    for (const f of FORMATIONS) {
      const siennes = scenariosServant(f.code);
      for (const s of siennes) {
        expect(formationsServies(s.code).map((x) => x.code)).toContain(f.code);
      }
    }
    expect(sertEnClair(formationsServies("nova"))).toMatch(/ et /);
  });

  it("les pages lisent le registre des formations servies", () => {
    expect(code("src/app/jouer/page.tsx")).toContain("formationsServies(");
    expect(code("src/components/quick-config-form.tsx")).toContain("Sert : {");
    expect(code("src/app/animations/page.tsx")).toContain("entreprisesEtFormations(");
    expect(code("src/app/animations/page.tsx")).toContain("Une même entreprise, plusieurs formations");
    expect(code("src/app/animations/[code]/page.tsx")).toContain("formationsServiesEnPlus(");
    expect(code("src/app/animations/[code]/page.tsx")).toContain("· sert aussi");
    expect(code("src/app/parcours/page.tsx")).toContain("scenariosServant(");
  });
});
