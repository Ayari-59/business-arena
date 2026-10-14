import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { LEVIERS } from "@/config/decisions";

/**
 * CE QU'UNE FICHE D'ENTREPRISE DOIT POUVOIR DIRE.
 *
 * La page disait le métier, sa contrainte et son premier arbitrage. Elle ne
 * disait pas ce qu'une classe y TRAVAILLE — les notions, les arbitrages, les
 * indicateurs — alors que les trois vivaient déjà dans le registre : les
 * situations déclarent leurs notions et les leviers qu'elles font manœuvrer,
 * et le scénario porte ses indicateurs, dont un seul paraissait, dans le
 * tableau de fin de page.
 *
 * CE QUI PEUT CASSER EN SILENCE, et que cette garde tient : un code de notion
 * ou un nom de levier qui ne résout plus. La fiche n'afficherait alors rien
 * pour cette entrée, sans erreur nulle part — une ligne simplement plus
 * courte, que personne ne remarque. Et les liens vers les fiches notions
 * meurent de la même façon : ils visent un identifiant de la page /notions,
 * qui est engendrée depuis le même registre.
 */

const PAGE = readFileSync(join(process.cwd(), "src/app/entreprises/page.tsx"), "utf8");
const NOTIONS = readFileSync(join(process.cwd(), "src/app/notions/page.tsx"), "utf8");
const codesDeNotion = new Set(CONCEPTS.map((c) => c.code));
const champsDeLevier = new Set(LEVIERS.map((l) => l.champ));

describe("les fiches d'entreprise", () => {
  it("lisent le registre au lieu de recopier des intitulés", () => {
    for (const lecture of ["CONCEPTS.map", "LEVIERS.filter", "d.kpis.map", "conceptCodes"]) {
      expect(PAGE, `la page n'utilise pas ${lecture}`).toContain(lecture);
    }
  });

  it("n'affichent que des notions qui existent", () => {
    const orphelins: string[] = [];
    for (const d of SCENARIO_CHOICES) {
      for (const s of d.situations) {
        for (const code of s.conceptCodes ?? []) {
          if (!codesDeNotion.has(code)) orphelins.push(`${d.code} → ${code}`);
        }
      }
    }
    expect(orphelins, `notions introuvables :\n${orphelins.join("\n")}`).toEqual([]);
  });

  it("n'affichent que des arbitrages qui existent", () => {
    const orphelins: string[] = [];
    for (const d of SCENARIO_CHOICES) {
      for (const s of d.situations) {
        for (const levier of s.decisionLevers ?? []) {
          if (!champsDeLevier.has(levier.field)) orphelins.push(`${d.code} → ${levier.field}`);
        }
      }
    }
    expect(orphelins, `leviers introuvables :\n${orphelins.join("\n")}`).toEqual([]);
  });

  it("ont de quoi remplir les trois lignes, pour les neuf métiers", () => {
    for (const d of SCENARIO_CHOICES) {
      const notions = new Set(d.situations.flatMap((s) => s.conceptCodes ?? []));
      const leviers = new Set(d.situations.flatMap((s) => (s.decisionLevers ?? []).map((l) => l.field)));
      expect(notions.size, `${d.code} ne déclare aucune notion`).toBeGreaterThan(0);
      expect(leviers.size, `${d.code} ne déclare aucun levier`).toBeGreaterThan(0);
      expect(d.kpis.length, `${d.code} n'a pas d'indicateur`).toBeGreaterThan(0);
      // Un indicateur sans explication ne se comprend pas : l'infobulle et le
      // texte caché la portent, encore faut-il qu'elle existe.
      for (const k of d.kpis) expect(k.hint.length, `${d.code} · ${k.key}`).toBeGreaterThan(10);
    }
  });

  it("mènent à des fiches notions qui existent vraiment", () => {
    // Le lien vise /notions#<code>, et cette page pose un identifiant par
    // notion. Si elle cessait de le faire, tous les liens des neuf fiches
    // déposeraient le lecteur en haut d'une page de cinquante-deux entrées.
    expect(PAGE).toContain('href={`/notions#${n.code}`}');
    expect(NOTIONS).toContain("id={c.code}");
  });
});
