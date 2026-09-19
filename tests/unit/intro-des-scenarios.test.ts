import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios/registry";
import { LETTRES_DE_MISSION } from "@/config/courriers/mission";

/**
 * L'ÉCRAN D'OUVERTURE NE PORTE PAS TROIS TEXTES.
 *
 * Au premier tour, l'élève trouve le mandat des associés, la situation du
 * métier et le contexte de l'entreprise. Trois proses à la file, et on n'en
 * lit plus aucune. Le mandat s'est replié en une ligne ; ces deux-ci sont
 * tenus courts, et surtout ils ne racontent pas ce que le mandat raconte
 * déjà.
 */
describe("la situation et le contexte restent courts", () => {
  it("deux phrases chacun, pas davantage", () => {
    for (const d of SCENARIOS) {
      for (const [cle, texte] of [
        ["situation", d.briefing],
        ["contexte", d.context],
      ] as const) {
        const phrases = texte.split(/[.!?]\s/).filter(Boolean);
        expect(
          phrases.length,
          `${d.code} · ${cle} fait ${phrases.length} phrases`,
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it("aucun ne dépasse 240 caractères", () => {
    // La mesure d'avant ce resserrage : 262 en moyenne pour la situation, 315
    // pour le contexte, et des pointes à 429. Le plafond tient la promesse.
    for (const d of SCENARIOS) {
      expect(d.briefing.length, `${d.code} · situation`).toBeLessThanOrEqual(240);
      expect(d.context.length, `${d.code} · contexte`).toBeLessThanOrEqual(240);
    }
  });
});

describe("aucun doublon avec le mandat", () => {
  it("le contexte ne raconte plus la passation", () => {
    /*
     * C'ÉTAIT LE VRAI DOUBLON. Plusieurs contextes s'ouvraient sur « l'ancien
     * dirigeant est parti à la retraite », « votre prédécesseur commandait
     * toujours la même chose », « votre père vous laisse l'entreprise ». Or
     * c'est précisément ce que dit le mandat des associés, qui arrive sur le
     * même écran : on racontait deux fois le même évènement, dans deux voix.
     *
     * Le contexte garde ce que la passation a LAISSÉ — l'état de l'outil, la
     * réserve pleine, le carnet vide, la concurrence en face —, qui est une
     * information de décision, et non un récit.
     */
    const PASSATION = [
      "prédécesseur",
      "ancien dirigeant",
      "ancien propriétaire",
      "ancien exploitant",
      "vous laisse l'entreprise",
      "vous laisse aussi",
      "vous confions",
      "vous reprenez",
    ];
    const fautifs: string[] = [];
    for (const d of SCENARIOS) {
      const texte = `${d.briefing} ${d.context}`.toLowerCase();
      for (const mot of PASSATION) {
        if (texte.includes(mot)) fautifs.push(`${d.code} : « ${mot} »`);
      }
    }
    expect(
      fautifs,
      "La passation appartient au mandat, pas au contexte :\n" + fautifs.join("\n"),
    ).toEqual([]);
  });

  it("le mandat, lui, est le seul à confier quelque chose", () => {
    // La contrepartie de la règle : si plus personne ne dit qui confie la
    // maison, la question « qui m'a demandé de décider » reste sans réponse.
    for (const c of LETTRES_DE_MISSION) {
      expect(c.corps.toLowerCase()).toContain("nous vous confions");
    }
  });
});
