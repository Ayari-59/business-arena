import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { CoupureDePresse, RevueDePresse } from "@/components/coupure-de-presse";
import { CourrierDuTour } from "@/components/courrier-du-tour";
import { BilanDePartie } from "@/components/bilan-de-partie";
import { bilanDeLaPartie } from "@/pedagogy/bilan-de-partie";
import { faitsDuMarche } from "@/lib/faits-du-marche";
import { lignesDeLaPresse } from "@/config/gazette/bilan";
import {
  BORNES_DE_L_ARTICLE,
  articleAffiche,
  articlesParus,
  codesRacontesParLaPresse,
  lireLEdition,
  profilAvecLaGazetteParue,
  validerLArticleDeLEnseignant,
} from "@/config/gazette/edition";
import { NOM_DU_JOURNAL, type ArticleDeLaGazette } from "@/config/gazette/types";
import type { GameView } from "@/services/game-view.service";

/**
 * LA GAZETTE À L'ÉCRAN : la coupure dans le courrier, la règle « pas de
 * doublon », l'archive, la consigne de l'enseignant et la ligne du bilan.
 */

const article = (p: Partial<ArticleDeLaGazette> = {}): ArticleDeLaGazette => ({
  tour: 3,
  rubrique: "Conjoncture",
  titre: "Coup de frein sur le marché des enceintes nomades",
  chapo:
    "En cause : le recul de la consommation des ménages. La fédération de l'électronique grand public annonce un repli sensible de la demande pour les deux prochains trimestres.",
  fiabilite: "fait",
  sujets: [
    { sujet: "demande", sens: "baisse", fiabilite: "fait", dementi: false, code: "economic_downturn", nouveau: true },
  ],
  auteur: "gazette",
  ...p,
});

describe("la coupure de presse", () => {
  it("est du papier, un vrai titre et du vrai texte, sans utilitaire de couleur", () => {
    const html = renderToStaticMarkup(createElement(CoupureDePresse, { article: article(), quand: "Tour 3" }));
    expect(html).toContain("papier coupure-de-presse");
    expect(html).toContain(NOM_DU_JOURNAL.replace("'", "&#x27;"));
    expect(html).toMatch(/<h3 id="gazette-3"[^>]*>Coup de frein sur le marché des enceintes nomades<\/h3>/);
    expect(html).toContain('aria-labelledby="gazette-3"');
    expect(html).toContain("recul de la consommation");
    expect(html).not.toMatch(/class="[^"]*\b(?:text|bg|border)-(?:slate|amber|sky|emerald|fuchsia|red)-\d/);
    const h2 = renderToStaticMarkup(
      createElement(CoupureDePresse, { article: article(), quand: "Tour 3", niveauDuTitre: 2 }),
    );
    expect(h2).toMatch(/<h2 id="gazette-3"/);
  });

  it("ne dit pas aux élèves qu'un article vient de l'enseignant", () => {
    const html = renderToStaticMarkup(
      createElement(CoupureDePresse, { article: article({ auteur: "enseignant" }), quand: "Tour 3" }),
    );
    expect(html).not.toMatch(/enseignant|professeur/i);
  });

  it("la revue de presse range les numéros passés dans un pli", () => {
    const html = renderToStaticMarkup(
      createElement(RevueDePresse, {
        articles: [article({ tour: 2, titre: "Un titre du tour deux" }), article({ tour: 1, titre: "Un titre du tour un" })],
        libelle: (t: number) => `Tour ${t}`,
      }),
    );
    expect(html).toContain("<details");
    expect(html).toContain("Revue de presse");
    expect(html).toContain("2 articles");
    expect(html.indexOf("Un titre du tour deux")).toBeLessThan(html.indexOf("Un titre du tour un"));
    expect(renderToStaticMarkup(createElement(RevueDePresse, { articles: [], libelle: String }))).toBe("");
  });
});

describe("la coupure dans le courrier du tour, et pas de doublon", () => {
  const base = {
    gameId: "g",
    round: 3,
    periodeLabel: "tour 3",
    adresse: { nom: "NOVA", ville: null },
  };
  const plis = [
    { code: "economic_downturn", teamId: null, isMyTeam: false },
    { code: "machine_breakdown", teamId: "moi", isMyTeam: true },
  ];

  it("ouverte, la presse vient AVANT la lettre, et la circulaire racontée se tait", () => {
    const html = renderToStaticMarkup(
      createElement(CourrierDuTour, {
        ...base,
        plis,
        ouvert: true,
        gazette: { article: article(), porteLeMarche: true },
      }),
    );
    expect(html).toContain("data-coupure-de-presse");
    expect(html.indexOf("data-coupure-de-presse")).toBeLessThan(html.indexOf("Arrêt de la ligne principale"));
    // La circulaire « recul de la consommation » n'est plus une lettre : la Gazette l'a dite.
    expect(html).not.toContain("Observatoire régional de la consommation");
    expect(html).not.toContain("Tout le marché");
    // Le pli adressé à l'entreprise reste.
    expect(html).toContain("Arrêt de la ligne principale");
    expect(html).toContain("Un courrier pèse sur ce tour");
  });

  it("un événement de marché que l'article ne raconte pas garde sa lettre", () => {
    const html = renderToStaticMarkup(
      createElement(CourrierDuTour, {
        ...base,
        plis: [...plis, { code: "rate_hike", teamId: null, isMyTeam: false }],
        ouvert: true,
        gazette: { article: article(), porteLeMarche: true },
      }),
    );
    expect(html).toContain("Révision des conditions de vos concours bancaires");
  });

  it("article remplacé ou retiré par l'enseignant : les circulaires reviennent", () => {
    for (const gazette of [
      { article: article({ auteur: "enseignant", sujets: [] }), porteLeMarche: false },
      { article: null, porteLeMarche: false },
    ]) {
      const html = renderToStaticMarkup(createElement(CourrierDuTour, { ...base, plis, ouvert: true, gazette }));
      expect(html).toContain("Observatoire régional de la consommation");
      expect(html).toContain("Tout le marché");
    }
  });

  it("fermé, rien ne fuit ; classé, la ligne garde le titre du journal", () => {
    const ferme = renderToStaticMarkup(
      createElement(CourrierDuTour, { ...base, plis, gazette: { article: article(), porteLeMarche: true } }),
    );
    expect(ferme).not.toContain("data-coupure-de-presse");
    expect(ferme).not.toContain("Coup de frein");
    const classe = renderToStaticMarkup(
      createElement(CourrierDuTour, {
        ...base,
        plis,
        classe: true,
        gazette: { article: article(), porteLeMarche: true },
      }),
    );
    expect(classe).toContain(
      `${NOM_DU_JOURNAL.replace("'", "&#x27;")}, « Coup de frein sur le marché des enceintes nomades »`,
    );
    expect(classe).toContain("Relire");
  });

  it("seule la presse annonce : le courrier de routine reste, et la phrase le dit", () => {
    const html = renderToStaticMarkup(
      createElement(CourrierDuTour, {
        ...base,
        plis: [plis[0]!],
        ouvert: true,
        gazette: { article: article(), porteLeMarche: true },
      }),
    );
    expect(html).toContain("La presse dit ce qui attend tout le marché");
    expect(html).toContain("Aucun effet sur ce trimestre");
  });
});

describe("la bande de marché ne recompte pas ce que la Gazette raconte", () => {
  const vue = (gazette: GameView["gazette"]) =>
    ({
      competitiveBenchmark: null,
      periods: [],
      seasonNotes: [],
      gamme: null,
      costFacts: { materialCostPerUnit: 0, otherVariableCostPerUnit: 0 },
      financeOffer: null,
      bankFile: null,
      classement: { revele: false },
      ranking: [],
      courriersEnCours: [
        { code: "economic_downturn", teamId: null, teamName: null, isMyTeam: false, roundsLeft: 1 },
      ],
      gazette,
    }) as unknown as GameView;
  it("l'événement raconté sort de la bande ; retiré, il y revient", () => {
    expect(faitsDuMarche(vue({ article: article(), porteLeMarche: true, revue: [] })).map((f) => f.cle)).not.toContain(
      "evenement",
    );
    expect(faitsDuMarche(vue({ article: null, porteLeMarche: false, revue: [] })).map((f) => f.cle)).toContain(
      "evenement",
    );
  });
});

describe("l'édition d'une partie et la consigne de l'enseignant", () => {
  it("un article d'enseignant est borné, et nettoyé", () => {
    const b = BORNES_DE_L_ARTICLE;
    expect(validerLArticleDeLEnseignant("Court", "x".repeat(b.texteMin)).ok).toBe(false);
    expect(validerLArticleDeLEnseignant("x".repeat(b.titreMax + 1), "x".repeat(b.texteMin)).ok).toBe(false);
    expect(validerLArticleDeLEnseignant("Un titre correct", "trop court").ok).toBe(false);
    expect(validerLArticleDeLEnseignant("Un titre correct", "x".repeat(b.texteMax + 1)).ok).toBe(false);
    expect(validerLArticleDeLEnseignant(undefined, null).ok).toBe(false);
    const ok = validerLArticleDeLEnseignant("  Grève   des dockers ", "Le port est bloqué depuis lundi,\n les livraisons attendront.");
    expect(ok).toEqual({
      ok: true,
      titre: "Grève des dockers",
      texte: "Le port est bloqué depuis lundi, les livraisons attendront.",
    });
  });

  it("remplacé, retiré, ou tel quel : ce que la classe lit", () => {
    const g = article();
    expect(articleAffiche(g, undefined)).toEqual({ article: g, porteLeMarche: true });
    expect(articleAffiche(g, { mode: "retire" })).toEqual({ article: null, porteLeMarche: false });
    const r = articleAffiche(g, { mode: "remplace", titre: "Mon titre", texte: "Mon texte de trois lignes." });
    expect(r.porteLeMarche).toBe(false);
    expect(r.article).toMatchObject({ tour: 3, titre: "Mon titre", chapo: "Mon texte de trois lignes.", auteur: "enseignant", sujets: [] });
  });

  it("la clôture fige l'article lu, garde le reste du profil, et l'archive se relit dans l'ordre", () => {
    let profil: unknown = { kind: "class", activeEvents: [], gazette: { parus: {}, enseignant: { "2": { mode: "retire" } } } };
    profil = profilAvecLaGazetteParue(profil, article({ tour: 1, titre: "Premier" }));
    profil = profilAvecLaGazetteParue(profil, article({ tour: 2, titre: "Deuxième" }));
    profil = profilAvecLaGazetteParue(profil, article({ tour: 3, titre: "Troisième" }));
    expect((profil as { kind: string }).kind).toBe("class");
    const e = lireLEdition(profil);
    expect(e.parus["2"]).toEqual({ tour: 2, retire: true });
    expect(articlesParus(e).map((a) => a.titre)).toEqual(["Premier", "Troisième"]);
    expect(lireLEdition({}).parus).toEqual({});
    expect(lireLEdition(null).enseignant).toEqual({});
  });

  it("les codes racontés : rien quand l'article n'est pas celui du journal, jamais un démenti", () => {
    const a = article({
      sujets: [
        { sujet: "demande", sens: "baisse", fiabilite: "fait", dementi: false, code: "economic_downturn", nouveau: true },
        { sujet: "taux", sens: "baisse", fiabilite: "prevision", dementi: true, code: "rate_cut", nouveau: true },
      ],
    });
    expect([...codesRacontesParLaPresse({ article: a, porteLeMarche: true })]).toEqual(["economic_downturn"]);
    expect(codesRacontesParLaPresse({ article: a, porteLeMarche: false }).size).toBe(0);
    expect(codesRacontesParLaPresse(undefined).size).toBe(0);
  });
});

describe("au bilan, ce que la presse annonçait", () => {
  const decisions = [
    { tour: 2, price: 59, productionPlan: 4000, newLoan: 0 },
    { tour: 3, price: 62.5, productionPlan: 4400, newLoan: 0 },
    { tour: 4, price: 62.5, productionPlan: 4400, newLoan: 30000 },
    { tour: 5, price: 61, productionPlan: 4400, newLoan: 0 },
  ];
  const couts = article({
    tour: 3,
    sujets: [{ sujet: "couts", sens: "hausse", fiabilite: "fait", dementi: false, code: "raw_material_spike", nouveau: true }],
  });
  const dementi = article({
    tour: 4,
    fiabilite: "prevision",
    sujets: [{ sujet: "taux", sens: "baisse", fiabilite: "prevision", dementi: true, code: "rate_cut", nouveau: true }],
  });
  const calme = article({
    tour: 2,
    sujets: [{ sujet: "calme", sens: "hausse", fiabilite: "fait", dementi: false, code: null, nouveau: true }],
  });
  const demande = article({
    tour: 5,
    sujets: [{ sujet: "demande", sens: "baisse", fiabilite: "prevision", dementi: false, code: "economic_downturn", nouveau: true }],
  });
  // Les espaces insécables (fines ou non) des nombres, ramenées à une espace pour comparer.
  const lignes = (articles: ArticleDeLaGazette[]) =>
    lignesDeLaPresse({
      articles,
      decisions,
      libelle: (t) => `Tour ${t}`,
      unites: "enceintes",
      nomDuJournal: NOM_DU_JOURNAL,
    }).map((l) => l.replace(/[\u202f\u00a0]/g, " "));

  it("relie l'article à ce qui s'est passé, puis à la décision, sans morale", () => {
    expect(lignes([couts])).toEqual([
      "La Gazette annonçait une hausse des coûts d'achat au tour 3 : elle a eu lieu. Vous aviez relevé vos prix de 6 %.",
    ]);
    expect(lignes([dementi])).toEqual([
      "La Gazette prévoyait une baisse des taux d'intérêt au tour 4 : elle n'est pas venue. Vous aviez emprunté 30 000 € ce tour-là.",
    ]);
    expect(lignes([demande])[0]).toBe(
      "La Gazette prévoyait un repli de la demande au tour 5 : il a eu lieu. Vous aviez gardé votre volume prévu à 4 400 enceintes.",
    );
  });

  it("au plus trois lignes : les démentis d'abord, le calme en dernier, dans l'ordre des tours", () => {
    const l = lignes([calme, couts, dementi, demande]);
    expect(l).toHaveLength(3);
    expect(l.map((x) => x.match(/au tour (\d)/)![1])).toEqual(["3", "4", "5"]);
    expect(lignes([calme])[0]).toContain("une saison porteuse au tour 2 : elle l'a été. Vous aviez prévu 4 000 enceintes.");
  });

  it("une seule ligne par nouvelle : trois tours de demande en hausse n'en font qu'une", () => {
    const hausse = (tour: number, nouveau: boolean) =>
      article({
        tour,
        sujets: [{ sujet: "demande", sens: "hausse", fiabilite: "fait", dementi: false, code: "nova_inv_grand_compte", nouveau }],
      });
    const l = lignes([hausse(3, true), hausse(4, false), hausse(5, false), couts]);
    expect(l).toHaveLength(2);
    expect(l.filter((x) => x.includes("hausse de la demande"))).toEqual([
      expect.stringContaining("au tour 3"),
    ]);
  });

  it("un article d'enseignant n'a pas de ligne", () => {
    expect(lignes([article({ auteur: "enseignant", sujets: [] })])).toEqual([]);
  });

  it("aucun tiret, aucun jugement, quelle que soit la décision", () => {
    // Prix inchangé au tour 4 : chaque branche de la phrase de réaction est relue.
    const prixInchange = article({
      tour: 4,
      sujets: [{ sujet: "couts", sens: "baisse", fiabilite: "fait", dementi: false, code: "supplier_discount", nouveau: true }],
    });
    const toutes = [calme, couts, dementi, demande, prixInchange].flatMap((a) => lignes([a]));
    expect(toutes.some((l) => l.includes("laissé vos prix inchangés"))).toBe(true);
    for (const x of toutes) {
      expect(x).not.toMatch(/ [—–] /);
      expect(x).not.toMatch(/auriez dû|erreur|bravo|bien joué|dommage|hélas/i);
    }
  });

  it("le bilan pose la rubrique « Ce que la presse annonçait » sur son papier", () => {
    const bilan = bilanDeLaPartie([
      { round: 1, libelle: "Tour 1", ca: 1000, resultat: 100, tresorerie: 500 },
      { round: 2, libelle: "Tour 2", ca: 1200, resultat: 200, tresorerie: 700 },
    ])!;
    const html = renderToStaticMarkup(
      createElement(BilanDePartie, {
        titre: "Partie terminée.",
        bilan,
        reussites: { acquises: 1, total: 4, derniere: null },
        place: null,
        motDeClassement: null,
        presse: lignes([couts]),
      }),
    );
    expect(html).toContain("data-ce-que-la-presse-annoncait");
    expect(html).toContain("Ce que la presse annonçait");
    expect(html).toContain("Vous aviez relevé vos prix de 6");
    const sans = renderToStaticMarkup(
      createElement(BilanDePartie, {
        titre: "Partie terminée.",
        bilan,
        reussites: { acquises: 1, total: 4, derniere: null },
        place: null,
        motDeClassement: null,
      }),
    );
    expect(sans).not.toContain("Ce que la presse annonçait");
  });
});
