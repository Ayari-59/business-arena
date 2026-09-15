import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TourSimule } from "@/components/tour-simule";
import { TirageDuTour } from "@/components/tirage-du-tour";

/**
 * VIVRE LE TIRAGE. En solo, le moteur tire à la clôture et le joueur ne
 * découvrait ses cartes qu'aux résultats. Le tirage étant lu d'avance, il se
 * retourne à l'ouverture du tour : pioche face cachée, un geste, les cartes.
 */
describe("la pioche du tour", () => {
  const base = { gameId: "g", round: 3, periodeLabel: "trimestre 3" };
  const cartes = [
    { code: "economic_downturn", teamId: null, isMyTeam: false },
    { code: "machine_breakdown", teamId: "moi", isMyTeam: true },
  ];

  it("commence face cachée, avec le geste pour retourner", () => {
    const html = renderToStaticMarkup(createElement(TirageDuTour, { ...base, cartes }));
    expect(html).toContain("Retourner les cartes");
    expect(html).toContain("Le sort du tour est scellé");
    // rien du tirage ne fuit avant le geste
    expect(html).not.toContain("Conjoncture morose");
    expect(html).not.toContain("Panne machine");
  });

  it("retournée, elle montre les cartes et dit sur qui elles tombent", () => {
    const html = renderToStaticMarkup(createElement(TirageDuTour, { ...base, cartes, revele: true }));
    expect(html).toContain("2 cartes pèsent sur ce tour");
    expect(html).toContain("Conjoncture morose");
    expect(html).toContain("Tout le marché");
    expect(html).toContain("Panne machine");
    expect(html).toContain("Votre entreprise");
    expect(html).not.toContain("Retourner les cartes");
  });

  it("lue, la carte s'efface : une ligne, et de quoi la revoir", () => {
    const html = renderToStaticMarkup(createElement(TirageDuTour, { ...base, cartes, note: true }));
    expect(html).toContain("Tirage du trimestre 3");
    expect(html).toContain("Conjoncture morose · Panne machine");
    expect(html).toContain("Revoir");
    // le récit, l'effet et la mini-leçon ne reviennent qu'en revoyant
    expect(html).not.toContain("La consommation des ménages");
    expect(html).not.toContain("Retourner les cartes");
    // et avant de noter, le geste pour noter est là
    const ouverte = renderToStaticMarkup(createElement(TirageDuTour, { ...base, cartes, revele: true }));
    expect(ouverte).toContain("pris note");
  });

  it("un tour sans carte le dit, au lieu de laisser croire que le tirage n'existe pas", () => {
    const html = renderToStaticMarkup(createElement(TirageDuTour, { ...base, cartes: [], revele: true }));
    expect(html).toContain("Aucune carte ce tour");
    expect(html).toContain("le marché tourne sans surprise");
  });
});

describe("l'écran « Tour simulé »", () => {
  const base = {
    gameId: "g", round: 3, currentRound: 4, roundDays: 90, finished: false,
    sector: "industrie" as const, scenarioIcon: "🔊",
  };
  it("propose la suite : résultats, puis tour suivant ou bilan", () => {
    const enCours = renderToStaticMarkup(createElement(TourSimule, base));
    expect(enCours).toContain("Voir les résultats");
    expect(enCours).toContain("Passer au");
    // aucun chiffre du tour : c'est le rôle des résultats
    expect(enCours).not.toMatch(/\d\s?€/);
    const fini = renderToStaticMarkup(createElement(TourSimule, { ...base, finished: true }));
    expect(fini).toContain("Bilan de la partie");
  });
});
