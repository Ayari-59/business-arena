import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TourSimule } from "@/components/tour-simule";
import { CourrierDuTour } from "@/components/courrier-du-tour";

/**
 * VIVRE LE COURRIER. En solo, le moteur tire à la clôture et le joueur ne
 * découvrait les événements qu'aux résultats. Le tirage étant lu d'avance, le
 * courrier s'ouvre à l'entrée du tour : l'enveloppe cachetée, un geste, la
 * lettre. Et le facteur passe même quand rien ne tombe.
 */
describe("le courrier du tour", () => {
  const base = { gameId: "g", round: 3, periodeLabel: "trimestre 3" };
  const plis = [
    { code: "economic_downturn", teamId: null, isMyTeam: false },
    { code: "machine_breakdown", teamId: "moi", isMyTeam: true },
  ];

  it("arrive cacheté, avec le geste pour ouvrir", () => {
    const html = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis }));
    expect(html).toContain("Ouvrir le courrier");
    expect(html).toContain("Le facteur est passé");
    // rien du contenu ne fuit avant le geste
    expect(html).not.toContain("recul de la consommation");
    expect(html).not.toContain("Arrêt de la ligne principale");
  });

  it("ouvert, il montre les lettres, leur expéditeur et leur destinataire", () => {
    const html = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis, ouvert: true }));
    expect(html).toContain("2 courriers pèsent sur ce tour");
    expect(html).toContain("Observatoire régional de la consommation");
    expect(html).toContain("recul de la consommation des ménages");
    expect(html).toContain("Tout le marché");
    expect(html).toContain("Arrêt de la ligne principale");
    expect(html).toContain("Votre entreprise");
    expect(html).not.toContain("Ouvrir le courrier");
  });

  it("classé, il tient en une ligne, et se relit", () => {
    const html = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis, classe: true }));
    expect(html).toContain("Courrier du trimestre 3");
    expect(html).toContain("recul de la consommation des ménages");
    expect(html).toContain("Relire");
    // le corps, l'effet et la leçon ne reviennent qu'en relisant
    expect(html).not.toContain("Le pouvoir d&#x27;achat recule");
    expect(html).not.toContain("Ouvrir le courrier");
    // et avant de classer, le geste pour classer est là
    const ouverte = renderToStaticMarkup(
      createElement(CourrierDuTour, { ...base, plis, ouvert: true }),
    );
    expect(ouverte).toContain("pris note");
  });

  it("une enveloppe n'est jamais vide : un trimestre calme apporte un courrier de routine", () => {
    const html = renderToStaticMarkup(
      createElement(CourrierDuTour, { ...base, plis: [], ouvert: true }),
    );
    expect(html).not.toContain("Aucune carte");
    expect(html).toContain("Rien qui engage ce trimestre");
    // une vraie lettre, avec un expéditeur, un objet et aucun effet
    expect(html).toContain("Objet :");
    expect(html).toContain("Aucun effet sur ce trimestre");
    expect(html).toContain("Courrier de routine");
  });

  it("le courrier de routine ne change pas d'un rendu à l'autre", () => {
    const a = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis: [], ouvert: true }));
    const b = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis: [], ouvert: true }));
    expect(a).toBe(b);
    // mais il change d'un tour à l'autre
    const autre = renderToStaticMarkup(
      createElement(CourrierDuTour, { ...base, round: 4, plis: [], ouvert: true }),
    );
    expect(autre).not.toBe(a);
  });
});

describe("l'écran « Tour simulé »", () => {
  const base = {
    gameId: "g", round: 3, currentRound: 4, roundDays: 90, finished: false,
    sector: "industrie" as const,
  };
  it("propose la suite : résultats, puis tour suivant ou bilan", () => {
    const enCours = renderToStaticMarkup(createElement(TourSimule, base));
    expect(enCours).toContain("Voir les résultats");
    expect(enCours).toContain("Passer au");
    // sans bilan fourni, aucun chiffre : l'écran reste une simple étape
    expect(enCours).not.toMatch(/\d\s?€/);
    const fini = renderToStaticMarkup(createElement(TourSimule, { ...base, finished: true }));
    expect(fini).toContain("Bilan de la partie");
  });

  it("donne l'essentiel du tour en trois chiffres : résultat et son écart, trésorerie, rang", () => {
    const html = renderToStaticMarkup(
      createElement(TourSimule, {
        ...base,
        bilan: {
          resultatNet: 12000,
          resultatPrecedent: 8000,
          chiffreDAffaires: 300000,
          tresorerie: 45000,
          rang: { place: 2, sur: 3 },
          ipg: 61.4,
        },
      }),
    );
    expect(html).toContain("Résultat net du tour");
    expect(html).toContain("+");
    expect(html).toContain("de mieux");
    expect(html).toContain("Trésorerie");
    expect(html).toContain("2ᵉ sur 3");
    expect(html).toContain("IPG 61");
  });

  it("une perte se dit comme une perte, et sans classement le chiffre d'affaires prend la place", () => {
    const html = renderToStaticMarkup(
      createElement(TourSimule, {
        ...base,
        bilan: {
          resultatNet: -9486,
          resultatPrecedent: null,
          chiffreDAffaires: 296239,
          tresorerie: 20000,
          rang: null,
          ipg: null,
        },
      }),
    );
    expect(html).toContain("text-red-300");
    expect(html).not.toContain("de mieux");
    expect(html).not.toContain("que le tour précédent");
    expect(html).toContain("Chiffre d&#x27;affaires");
  });
});
