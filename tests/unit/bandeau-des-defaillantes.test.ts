import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { BandeauDesDefaillantes } = await import("@/components/bandeau-des-defaillantes");
const { AlerteTresorerie } = await import("@/components/alerte-tresorerie");
const { DIFFICULTY_PRESETS, premierNiveauQuiOuvre } = await import("@/config/difficulty");
type GameView = import("@/services/game-view.service").GameView;

/**
 * L'ENSEIGNANT NE PROMET PLUS UN REMÈDE QUI N'EXISTE PAS.
 *
 * Son bandeau disait, à tous les niveaux : « Seule une augmentation de capital
 * qui ramène le découvert sous le plafond fait repartir l'entreprise. » Aux
 * niveaux 1 à 3, l'apport des associés n'existe pas, et le bandeau de l'élève
 * le disait au même instant. L'enseignant donnait devant la classe une
 * consigne que l'équipe ne pouvait pas suivre.
 *
 * Ce que ce test garde, niveau par niveau : les deux bandeaux nomment le même
 * remède. L'apport des associés là où le niveau l'ouvre, et seulement là ; la
 * subvention exceptionnelle partout où un animateur peut l'accorder.
 */

const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

describe("le bandeau des défaillantes, niveau par niveau", () => {
  for (const preset of DIFFICULTY_PRESETS) {
    const financementOuvert = preset.decisions.finance;
    const niveauDuFinancement = premierNiveauQuiOuvre("finance", undefined, preset.level);
    for (const avecAnimateur of [true, false]) {
      it(`niveau ${preset.level}, ${avecAnimateur ? "en classe" : "en solo"}`, () => {
        const enseignant = texte(
          renderToStaticMarkup(
            createElement(BandeauDesDefaillantes, {
              noms: ["Les Audacieux"],
              cadre: { financementOuvert, niveauDuFinancement, avecAnimateur, toursAvantDefaillance: 2 },
            }),
          ),
        );
        const alerte: NonNullable<GameView["alerteTresorerie"]> = {
          crise: true,
          defaillante: true,
          toursConsecutifs: 2,
          toursAvantDefaillance: 2,
          tresorerieNette: -400000,
          plafondDecouvert: 30000,
          manque: 370000,
          financementObligatoire: true,
          financementOuvert,
          niveauDuFinancement,
          subventionQuiDegele: 410000,
          avecAnimateur,
        };
        const eleve = texte(
          renderToStaticMarkup(createElement(AlerteTresorerie, { gameId: "g", alerte })),
        );

        for (const lu of [enseignant, eleve]) {
          // L'apport des associés : nommé comme remède là où il existe, jamais ailleurs.
          expect(/augmentation de capital|apport des associés qui ramène/.test(lu)).toBe(
            financementOuvert,
          );
          // La subvention : nommée partout où quelqu'un peut l'accorder.
          expect(lu.includes("subvention exceptionnelle")).toBe(avecAnimateur);
          // Et l'arrêt définitif, seulement quand il n'y a vraiment plus rien.
          expect(lu.includes("jusqu'à la fin de la partie")).toBe(!avecAnimateur);
        }
      });
    }
  }

  it("le nombre de tours avant la défaillance est celui de la partie, pas « deux » écrit en dur", () => {
    const html = texte(
      renderToStaticMarkup(
        createElement(BandeauDesDefaillantes, {
          noms: ["Les Audacieux"],
          cadre: {
            financementOuvert: false,
            niveauDuFinancement: 4,
            avecAnimateur: true,
            toursAvantDefaillance: 3,
          },
        }),
      ),
    );
    expect(html).toContain("3 tours consécutifs");
    expect(html).not.toContain("Deux tours");
  });
});
