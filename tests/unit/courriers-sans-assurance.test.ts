import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { courrierParCode } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE, courrierDeRoutine } from "@/config/courriers/routine";
import {
  ROUTINES_D_ASSURANCE,
  VARIANTES_SANS_ASSURANCE,
  courrierSelonLAssurance,
} from "@/config/courriers/sans-assurance";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";

/**
 * L'ASSURANCE NE SE DIT QUE LÀ OÙ ELLE SE DÉCIDE.
 *
 * Elle s'ouvre au niveau 4. Aux niveaux 1 à 3, un courrier qui parle d'un
 * contrat, d'une formule souscrite ou d'un sinistre « sauf pour les assurés »
 * parle d'une décision que l'équipe n'a pas. Ces courriers ont une variante sans
 * l'assurance, au même effet sur les comptes.
 */

/** Les mots qui parlent du LEVIER assurance (pas d'une caisse d'assurance maladie, ni de « rassure »). */
const PARLE_D_ASSURANCE = /\bassur(é|és|ée|ées|ance|ances|eur|eurs)\b(?! maladie)/i;
/** Des mentions qui ne sont pas le levier : un concurrent sans attestation, une image (« est une assurance »). */
const HORS_LEVIER = new Set(["batiment_artisan_low_cost", "hotel_greve_transports", "bistrot_chef_absent"]);

describe("les courriers, sans l'assurance", () => {
  it("l'assurance est fermée aux niveaux 1 à 3 : c'est là que les variantes servent", () => {
    expect(DIFFICULTY_PRESETS.filter((p) => !p.decisions.insurance).map((p) => p.level)).toEqual([1, 2, 3]);
  });

  it("fermée, aucun courrier tiré ne parle plus d'assurance ; ouverte, tous gardent leur texte", () => {
    const fautifs: string[] = [];
    for (const [code, c] of courrierParCode) {
      if (HORS_LEVIER.has(code)) continue;
      const lu = courrierSelonLAssurance(c, false);
      for (const champ of ["expediteur", "corps", "effet", "enJeu", "signataire"] as const) {
        if (PARLE_D_ASSURANCE.test(lu[champ])) fautifs.push(`${code}.${champ}`);
      }
      expect(courrierSelonLAssurance(c, true)).toBe(c);
    }
    expect(fautifs).toEqual([]);
  });

  it("une variante ne change ni le code, ni l'objet, ni la nature, ni la portée, ni la durée", () => {
    for (const code of Object.keys(VARIANTES_SANS_ASSURANCE)) {
      const c = courrierParCode.get(code);
      expect(c, `${code} n'existe plus au registre`).toBeDefined();
      const lu = courrierSelonLAssurance(c!, false);
      expect(lu.code).toBe(c!.code);
      expect(lu.objet).toBe(c!.objet);
      expect(lu.nature).toBe(c!.nature);
      expect(lu.scope).toBe(c!.scope);
      // L'effet chiffré reste celui du moteur : seule la mention des assurés peut tomber.
      expect(c!.effet.startsWith(lu.effet), `${code} : effet ${lu.effet}`).toBe(true);
    }
  });

  it("l'avis d'échéance d'un contrat ne se distribue pas sans assurance", () => {
    expect(COURRIERS_DE_ROUTINE.some((c) => ROUTINES_D_ASSURANCE.includes(c.code))).toBe(true);
    for (let round = 1; round <= 40; round += 1) {
      for (const partie of ["a", "partie-b", "c3"]) {
        expect(ROUTINES_D_ASSURANCE).not.toContain(courrierDeRoutine(partie, round, false).code);
      }
    }
    const tires = new Set(
      Array.from({ length: 200 }, (_, i) => courrierDeRoutine(`p${i}`, 1 + (i % 7), true).code),
    );
    expect([...tires].some((c) => ROUTINES_D_ASSURANCE.includes(c))).toBe(true);
  });

  it("l'arène passe à chaque courrier si l'assurance est ouverte au niveau de la partie", () => {
    const page = readFileSync("src/app/arena/[gameId]/page.tsx", "utf-8");
    const tableau = readFileSync("src/components/period-dashboard.tsx", "utf-8");
    expect((page.match(/assurance=\{view\.enabledDecisions\.insurance\}/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(tableau).toContain("assurance={view.enabledDecisions.insurance}");
  });
});
