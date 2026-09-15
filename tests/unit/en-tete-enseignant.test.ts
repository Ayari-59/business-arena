import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EnTeteEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { FriseDesTours } from "@/components/frise-des-tours";

/**
 * L'ESPACE ENSEIGNANT A LE VISAGE DE L'ARÈNE. Un en-tête écrit une fois :
 * surtitre, titre, navigation en pastilles avec la page courante en ambre ;
 * des rubriques qui donnent le rythme de la séance ; une frise qui sait
 * montrer un tour joué sans lui prêter un signe.
 */
describe("l'en-tête enseignant", () => {
  it("nomme la page courante et propose les autres", () => {
    const html = renderToStaticMarkup(
      createElement(EnTeteEnseignant, { titre: "Mes scénarios", actif: "scenarios" }),
    );
    expect(html).toContain("Espace enseignant");
    expect(html).toContain("Mes scénarios");
    expect(html).toMatch(/aria-current="page"[^>]*>Mes scénarios/);
    for (const lien of ["Mes parties", "Carnet d&#x27;usage", "Progression"]) expect(html).toContain(lien);
    // pas d'établissement ni d'administration sans le droit
    expect(html).not.toContain("Mon établissement");
    expect(html).not.toContain("Administration");
  });

  it("montre l'établissement et l'administration à qui y a droit", () => {
    const html = renderToStaticMarkup(
      createElement(EnTeteEnseignant, {
        titre: "Mes parties",
        actif: "parties",
        liens: { etablissement: true, administration: true },
      }),
    );
    expect(html).toContain('href="/org"');
    expect(html).toContain('href="/admin"');
  });

  it("porte la tuile et le surtitre du secteur, comme l'arène", () => {
    const html = renderToStaticMarkup(
      createElement(EnTeteEnseignant, {
        surtitre: "Pilotage de partie · Industrie",
        accent: "text-blue-400",
        titre: "NOVA",
        tuile: createElement("span", { "data-tuile": "" }, "🔊"),
      }),
    );
    expect(html).toContain("data-tuile");
    expect(html).toMatch(/text-blue-400[^>]*>Pilotage de partie · Industrie/);
  });

  it("une rubrique dit le mot et, s'il y a lieu, le compte", () => {
    const html = renderToStaticMarkup(createElement(Rubrique, { note: "1 partie" } as Parameters<typeof Rubrique>[0], "Mes parties"));
    expect(html).toContain("Mes parties");
    expect(html).toContain("1 partie");
  });
});

describe("la frise côté enseignant", () => {
  it("un tour joué sans signe est plein, ni vert ni rose", () => {
    const html = renderToStaticMarkup(
      createElement(FriseDesTours, {
        roundsCount: 4,
        currentRound: 3,
        resultats: new Map<number, number | null>([[1, null], [2, null]]),
        finished: false,
      }),
    );
    expect(html).toContain("Tour 1 · joué");
    expect(html).not.toContain("bg-emerald-400/70");
    expect(html).not.toContain("bg-rose-400/70");
    expect(html).toContain("Tour 3 · en cours");
    expect(html).toContain("Tour 4 · à venir");
  });
});
