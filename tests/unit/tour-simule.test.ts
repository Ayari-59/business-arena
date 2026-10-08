import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

describe("l'écran « Tour simulé » : le marché a répondu", () => {
  const base = {
    gameId: "g", round: 3, currentRound: 4, roundDays: 90, finished: false,
    sector: "industrie" as const,
  };
  const bilan = {
    resultatNet: 12000,
    resultatPrecedent: 8000,
    chiffreDAffaires: 300000,
    tresorerie: 45000,
    rang: { place: 2, sur: 3 },
    ipg: 61.4,
    verdict: "Le tour s'est joué sur la marge sur les ventes : elle a rapporté 4 000 € de plus.",
  };
  const rendre = (props: Partial<Parameters<typeof TourSimule>[0]> = {}) =>
    renderToStaticMarkup(createElement(TourSimule, { ...base, ...props }));

  it("propose la suite : résultats, puis tour suivant ou bilan", () => {
    const enCours = rendre();
    expect(enCours).toContain("Voir les résultats");
    expect(enCours).toContain("Passer au");
    // sans bilan fourni, aucun chiffre : l'écran reste une simple étape
    expect(enCours).not.toMatch(/\d\s?€/);
    const fini = rendre({ finished: true });
    expect(fini).toContain("Bilan de la partie");
  });

  it("donne le résultat du tour en très grand, son écart signé, le rang en or et le verdict", () => {
    const html = rendre({ bilan, entreprise: "NOVA", roundsCount: 6 });
    expect(html).toContain("le marché a répondu");
    expect(html).toContain("NOVA");
    expect(html).toContain("Résultat net du tour");
    expect(html).toContain("+12");
    expect(html).toContain("+4");
    expect(html).toContain("par rapport au tour précédent");
    expect(html).toContain("2e sur 3");
    expect(html).toContain("IPG 61");
    // Le chiffre d'affaires et la trésorerie restent sous les yeux, en petit.
    expect(html).toContain("Trésorerie");
    expect(html).toContain(bilan.verdict.replace("'", "&#x27;"));
  });

  it("une perte se dit comme une perte, et le chiffre d'affaires et la trésorerie restent sous les yeux", () => {
    const html = rendre({
      bilan: {
        resultatNet: -9486,
        resultatPrecedent: null,
        chiffreDAffaires: 296239,
        tresorerie: 20000,
        rang: null,
        ipg: null,
      },
    });
    expect(html).toContain("text-red-300");
    // Le signe moins typographique, pas un trait d'union.
    expect(html).toMatch(/\u2212\s?9/);
    expect(html).not.toContain("tour précédent");
    expect(html).toContain("Chiffre d&#x27;affaires");
  });
});

/**
 * LE RITUEL, GARDÉ. Le moment « le marché répond » est l'écran qui signe la
 * marque : il a été une petite carte claire, sur un dégradé rose ou menthe,
 * avec deux boutons orange d'allure identique. Ce qui doit tenir :
 *   · l'écran entier est l'ardoise marine ;
 *   · UN SEUL bouton orange (« Voir les résultats ») ; l'autre chemin en filet ;
 *   · le résultat et le rang sont là, à l'état final, sans attendre une
 *     animation : le chiffre est annoncé poliment aux lecteurs d'écran ;
 *   · qui a demandé moins d'animation voit tout d'un coup.
 */
describe("le rituel du marché", () => {
  const base = {
    gameId: "g", round: 3, currentRound: 4, roundDays: 90, finished: false,
    sector: "industrie" as const,
    bilan: {
      resultatNet: -294, resultatPrecedent: 1200, chiffreDAffaires: 299602, tresorerie: 52243,
      rang: { place: 1, sur: 3 }, ipg: 64.1, verdict: "Une phrase.",
    },
  };
  const aplats = (html: string) => (html.match(/bouton-plein/g) ?? []).length;

  it("tient en un seul aplat orange, en tour comme en fin de partie", () => {
    for (const finished of [false, true]) {
      const html = renderToStaticMarkup(createElement(TourSimule, { ...base, finished }));
      expect(aplats(html), `fin de partie : ${finished}`).toBe(1);
      expect(html).toContain("bouton-filet");
    }
  });

  it("pose le marine sur tout l'écran, sans voile teinté", () => {
    const html = renderToStaticMarkup(createElement(TourSimule, base));
    expect(html).toMatch(/<main[^>]*class="[^"]*\bardoise\b[^"]*\bbg-slate-950\b/);
    expect(html).not.toMatch(/encadre-(gain|perte)|from-|bg-emerald|bg-red/);
  });

  it("montre le résultat et le rang dès l'état final, et annonce le résultat poliment", () => {
    const html = renderToStaticMarkup(createElement(TourSimule, base));
    const resultat = html.slice(html.indexOf('data-temps="2"'));
    expect(resultat).toMatch(/^data-temps="2" role="status" aria-live="polite"/);
    expect(resultat).toContain("\u2212294");
    // Le rang en or, avec la médaille du podium.
    expect(html).toContain("pastille-rang-1");
    expect(html).toMatch(/texte-or[^>]*>1re sur 3/);
    // Les trois temps, et les actions, sont dans la page : l'animation ne fait
    // que les faire apparaître.
    for (const temps of ["1", "2", "3", "4"]) expect(html).toContain(`data-temps="${temps}"`);
  });

  it("se joue en moins d'une seconde et demie, et pas du tout pour qui a demandé moins d'animation", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const bloc = css.slice(css.indexOf("LOT 3A"));
    const delais = [...bloc.matchAll(/\.rituel > \[data-temps="\d"\] \{\s*animation-delay: ([\d.]+)s/g)].map(
      (m) => Number(m[1]),
    );
    const duree = Number(bloc.match(/animation: rituel-entree ([\d.]+)s/)![1]);
    expect(delais.length).toBe(3);
    expect(Math.max(...delais) + duree).toBeLessThanOrEqual(1.5);
    expect(bloc).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.rituel > \[data-temps\] \{\s*animation: none;/,
    );
  });
});
