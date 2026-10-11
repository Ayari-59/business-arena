import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios/registry";
import type { EngineScenarioConfig, EventDefinitionConfig, EventInstance } from "@/engine/types";
import {
  articleDeLaGazette,
  capitaliser,
  deDevant,
  fourchette,
  lireLEvenement,
  motifDe,
  remplir,
  tendanceDeSaison,
  typographie,
  type EntreeDeLaGazette,
} from "@/config/gazette/generateur";
import {
  AMPLEURS,
  ANNONCES_DE_FAIT,
  ANNONCES_DE_PREVISION,
  CALMES,
  CAUSES_DE_FAIT,
  CAUSES_DE_PREVISION,
  CLIENTELES,
  COTES,
  LEXIQUES,
  MOTIFS,
  MOTIFS_D_INVESTISSEMENT,
  MOTIFS_PAR_DEFAUT,
  MOTS_DE_BAISSE,
  MOTS_DE_HAUSSE,
  OBJETS,
  SAISONS_EN_FOND,
  SOURCE_DU_CREDIT,
  SUITES,
  TITRES,
  type CleDeGabarit,
} from "@/config/gazette/banque";
import { PART_DES_DEMENTIS, tourOuvertAuDementi } from "@/config/gazette/incertitude";
import { NOM_DU_JOURNAL, DEVISE_DU_JOURNAL } from "@/config/gazette/types";

/**
 * LA GAZETTE DE L'ARÈNE : LES GARDES DU GÉNÉRATEUR.
 *
 *   · cohérence : pour chaque entreprise et chaque événement de marché de son
 *     jeu, l'article va dans le sens de l'événement (une hausse ne donne
 *     jamais un article de baisse), qu'il tombe ou qu'il se poursuive ;
 *   · pas de fuite : aucun chiffre exact du tirage, aucun chiffre du tout aux
 *     niveaux où la presse prévoit ;
 *   · prévisions démenties : la règle écrite (part par niveau, jamais deux
 *     tours de suite, jamais aux niveaux 1 et 2, plausibles après coup) ;
 *   · jamais d'article vide, jamais deux fois le même titre dans une partie ;
 *   · les règles d'écriture sur toute la banque.
 */

const evenementsDeMarche = (s: EngineScenarioConfig) => s.events.filter((e) => e.scope === "market");
const instance = (def: EventDefinitionConfig, roundsLeft = def.duration): EventInstance => ({
  code: def.code,
  scope: "market",
  roundsLeft,
  modifiers: def.modifiers,
});
const entree = (
  d: (typeof SCENARIOS)[number],
  partiel: Partial<EntreeDeLaGazette>,
): EntreeDeLaGazette => ({
  secteur: d.sector,
  scenario: d.scenario,
  tour: 3,
  niveau: 1,
  graine: 1234,
  nouveaux: [],
  enCours: [],
  ...partiel,
});
const texte = (a: { titre: string; chapo: string }) => `${a.titre} ${a.chapo}`;

/** Les titres d'une clé, tels qu'ils se lisent dans un secteur. */
function titresDe(cle: CleDeGabarit, secteur: (typeof SCENARIOS)[number]["sector"]): string[] {
  const lex = LEXIQUES[secteur];
  return (TITRES[cle] ?? []).map((g) =>
    typographie(capitaliser(
      remplir(g, {
        profession: lex.profession,
        domaine: lex.domaine,
        marche: lex.marche,
        clients: lex.clients,
        intrants: lex.intrants,
        Intrants: lex.intrantsTitre,
        prixDesIntrants: lex.prixDesIntrants,
        outil: lex.outil,
      }),
    )),
  );
}

describe("la Gazette suit ce qui arrive", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} : chaque événement de marché donne un article dans son sens, à tous les niveaux`, () => {
      const evenements = evenementsDeMarche(d.scenario);
      expect(evenements.length).toBeGreaterThan(0);
      for (const def of evenements) {
        const lu = lireLEvenement(instance(def), true);
        if (!lu) continue;
        const oppose = lu.sens === "hausse" ? "baisse" : "hausse";
        for (const niveau of [1, 2, 3, 4, 5, 6]) {
          for (const enCours of [false, true]) {
            const a = articleDeLaGazette(
              entree(d, {
                niveau,
                nouveaux: enCours ? [] : [instance(def)],
                enCours: enCours ? [instance(def, 2)] : [],
              }),
            );
            const tete = a.sujets[0]!;
            expect(tete.code, `${def.code} n${niveau}`).toBe(def.code);
            expect(tete.sens).toBe(lu.sens);
            expect(tete.sujet).toBe(lu.sujet);
            expect(tete.dementi).toBe(false);
            // Le titre vient de la liste de SON sens.
            expect(titresDe(`${lu.sujet}:${lu.sens}`, d.sector)).toContain(a.titre);
            // L'ampleur, quand elle est dite, est dans le bon sens.
            for (const mot of AMPLEURS[oppose]) expect(a.chapo).not.toContain(mot);
            // Un événement sur la demande : pas un mot du sens contraire, saison comprise.
            if (lu.sujet === "demande" || lu.sujet === "concurrence") {
              const contraire = lu.sens === "hausse" ? MOTS_DE_BAISSE : MOTS_DE_HAUSSE;
              const motif = motifDe(def.code, lu.sujet).motif;
              const chapoSansMotif = a.chapo.replace(motif, "").replace(deDevant(motif), "");
              expect(chapoSansMotif, `${def.code} n${niveau}`).not.toMatch(contraire);
            }
            // Fait ou prévision : un événement qui tombe s'écrit au conditionnel à partir du niveau 3.
            expect(tete.fiabilite).toBe(niveau >= 3 && !enCours ? "prevision" : "fait");
          }
        }
      }
    });
  }

  it("un événement qui continue est dit comme tel", () => {
    const d = SCENARIOS.find((x) => x.code === "nova")!;
    const def = d.scenario.events.find((e) => e.code === "raw_material_spike")!;
    const a = articleDeLaGazette(entree(d, { enCours: [instance(def, 1)] }));
    expect(a.chapo).toContain("se prolonge encore ce trimestre");
    // Jamais « : » en début de ligne : l'espace qui le précède est insécable.
    expect(a.chapo).not.toMatch(/ :/);
    expect(a.sujets[0]).toMatchObject({ sujet: "couts", sens: "hausse", nouveau: false, fiabilite: "fait" });
  });

  it("les plis adressés à une seule entreprise n'entrent jamais dans le journal", () => {
    const d = SCENARIOS.find((x) => x.code === "nova")!;
    const def = d.scenario.events.find((e) => e.code === "machine_breakdown")!;
    const a = articleDeLaGazette(
      entree(d, { nouveaux: [{ ...instance(def), scope: "company", companyId: "x" }] }),
    );
    expect(a.sujets[0]!.sujet).toBe("calme");
  });

  it("un tour sans événement donne un article de conjoncture calme, dans le sens de la saison", () => {
    for (const d of SCENARIOS) {
      for (let tour = 1; tour <= d.scenario.roundsCount; tour++) {
        const a = articleDeLaGazette(entree(d, { tour, niveau: 1 }));
        expect(a.sujets).toEqual([
          {
            sujet: "calme",
            sens: tendanceDeSaison(d.scenario, tour),
            fiabilite: "fait",
            dementi: false,
            code: null,
            nouveau: true,
          },
        ]);
        expect(titresDe(`calme:${tendanceDeSaison(d.scenario, tour)}`, d.sector)).toContain(a.titre);
      }
    }
  });

  it("la saison n'est dite en fond que si rien ne touche la demande", () => {
    const d = SCENARIOS.find((x) => x.code === "hotel")!;
    const taux = d.scenario.events.find((e) => e.code === "hotel_credit_resserre")!;
    const salon = d.scenario.events.find((e) => e.code === "hotel_evenement_local")!;
    const seul = articleDeLaGazette(entree(d, { tour: 4, nouveaux: [instance(taux)] }));
    expect(Object.values(SAISONS_EN_FOND).some((p) => seul.chapo.includes(p))).toBe(true);
    const avecDemande = articleDeLaGazette(
      entree(d, { tour: 4, nouveaux: [instance(taux), instance(salon)] }),
    );
    expect(Object.values(SAISONS_EN_FOND).some((p) => avecDemande.chapo.includes(p))).toBe(false);
  });
});

describe("pas de fuite : aucun chiffre exact du tirage", () => {
  it("la fourchette encadre la valeur sans jamais l'écrire", () => {
    for (let pct = 0; pct <= 80; pct++) {
      const f = fourchette(pct / 100);
      if (pct < 5) {
        expect(f).toBe("");
        continue;
      }
      const m = f.match(/de l'ordre de (\d+) à (\d+) %/)!;
      const bas = Number(m[1]);
      const haut = Number(m[2]);
      expect(bas).toBeLessThan(pct);
      expect(haut).toBeGreaterThan(pct);
      expect(haut - bas).toBeLessThanOrEqual(10);
    }
  });

  for (const d of SCENARIOS) {
    it(`${d.code} : ni le chiffre de l'événement, ni de chiffre du tout au niveau des prévisions`, () => {
      for (const def of evenementsDeMarche(d.scenario)) {
        const lu = lireLEvenement(instance(def), true);
        if (!lu) continue;
        const pct = Math.round(lu.intensite * 100);
        for (const niveau of [1, 2, 3, 4, 5, 6]) {
          const a = articleDeLaGazette(entree(d, { niveau, nouveaux: [instance(def)] }));
          expect(texte(a), `${def.code} n${niveau}`).not.toMatch(new RegExp(`(^|[^\\d])${pct}\\s?%`));
          if (niveau >= 3) expect(texte(a), `${def.code} n${niveau}`).not.toMatch(/\d/);
          else {
            // Les seuls chiffres sont ceux d'une fourchette qui encadre la valeur.
            const nombres = [...texte(a).matchAll(/\d+/g)].map((x) => Number(x[0]));
            if (nombres.length > 0) {
              expect(nombres).toHaveLength(2);
              expect(nombres[0]!).toBeLessThan(pct);
              expect(nombres[1]!).toBeGreaterThan(pct);
            }
          }
        }
      }
    });
  }
});

describe("prévisions démenties : la règle écrite", () => {
  it("jamais aux niveaux 1 et 2, jamais au premier tour", () => {
    for (let graine = 1; graine <= 400; graine++) {
      for (const niveau of [1, 2]) for (let t = 1; t <= 6; t++) expect(tourOuvertAuDementi(graine, niveau, t)).toBe(false);
      for (const niveau of [3, 4, 5, 6]) expect(tourOuvertAuDementi(graine, niveau, 1)).toBe(false);
    }
  });

  it("jamais deux tours de suite", () => {
    for (let graine = 1; graine <= 2000; graine++) {
      for (const niveau of [3, 4, 5, 6]) {
        for (let t = 2; t <= 6; t++) {
          if (tourOuvertAuDementi(graine, niveau, t)) expect(tourOuvertAuDementi(graine, niveau, t + 1)).toBe(false);
        }
      }
    }
  });

  it("une part qui monte avec le niveau, conforme à la règle", () => {
    const frequence = (niveau: number) => {
      let n = 0;
      let ouverts = 0;
      for (let graine = 1; graine <= 3000; graine++) {
        for (let t = 2; t <= 6; t++) {
          n++;
          if (tourOuvertAuDementi(graine, niveau, t)) ouverts++;
        }
      }
      return ouverts / n;
    };
    let avant = 0;
    for (const niveau of [3, 4, 5, 6]) {
      const p = PART_DES_DEMENTIS[niveau]!;
      const f = frequence(niveau);
      // « Jamais deux de suite » retire les tours qui suivent un tour ouvert : p / (1 + p) en régime établi.
      expect(f, `niveau ${niveau}`).toBeGreaterThan((p / (1 + p)) * 0.75);
      expect(f, `niveau ${niveau}`).toBeLessThan(p * 1.15);
      expect(f).toBeGreaterThan(avant);
      avant = f;
    }
  });

  it("une prévision démentie est plausible après coup et ne contredit rien de ce qui arrive", () => {
    let dementis = 0;
    for (const d of SCENARIOS) {
      const deck = evenementsDeMarche(d.scenario);
      for (let graine = 1; graine <= 60; graine++) {
        for (let tour = 1; tour <= d.scenario.roundsCount; tour++) {
          for (const niveau of [3, 5, 6]) {
            // Un tour calme, puis un tour avec un événement de coûts s'il y en a un.
            const couts = deck.find((e) => e.modifiers.some((m) => m.target === "material_cost"));
            for (const nouveaux of [[], couts ? [instance(couts)] : []]) {
              const a = articleDeLaGazette(entree(d, { graine, tour, niveau, nouveaux }));
              const dementi = a.sujets.find((x) => x.dementi);
              if (!dementi) continue;
              dementis++;
              expect(tourOuvertAuDementi(graine, niveau, tour)).toBe(true);
              expect(dementi.fiabilite).toBe("prevision");
              const def = deck.find((e) => e.code === dementi.code)!;
              expect(def, "un événement du jeu de la partie").toBeDefined();
              expect(def.probability).toBeGreaterThan(0);
              expect(def.minRound ?? 1).toBeLessThanOrEqual(tour);
              expect(nouveaux.map((n) => n.code)).not.toContain(def.code);
              // Rien d'autre sur le même domaine ce tour-là.
              const domaine = (s: string) => (s === "concurrence" ? "demande" : s);
              for (const x of a.sujets.filter((y) => !y.dementi))
                expect(domaine(x.sujet)).not.toBe(domaine(dementi.sujet));
              // Une demande démentie ne va jamais contre la saison.
              const saison = tendanceDeSaison(d.scenario, tour);
              if (domaine(dementi.sujet) === "demande" && saison !== "stable") expect(dementi.sens).toBe(saison);
            }
          }
        }
      }
    }
    expect(dementis, "la règle produit bien des démentis à tester").toBeGreaterThan(50);
  });

  it("aux niveaux 1 et 2, le journal n'écrit que des faits, sans démenti", () => {
    for (const d of SCENARIOS) {
      for (let graine = 1; graine <= 30; graine++) {
        for (let tour = 1; tour <= 6; tour++) {
          for (const niveau of [1, 2]) {
            const a = articleDeLaGazette(entree(d, { graine, tour, niveau }));
            expect(a.fiabilite).toBe("fait");
            expect(a.sujets.every((x) => !x.dementi)).toBe(true);
          }
        }
      }
    }
  });
});

/** Un petit générateur pseudo-aléatoire, pour tirer des parties de six tours. */
function hasard(graine: number) {
  let x = graine >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

describe("jamais vide, jamais deux fois le même titre", () => {
  it("une partie de six tours ne lit jamais deux fois le même titre, quels que soient les événements", () => {
    for (const d of SCENARIOS) {
      const deck = evenementsDeMarche(d.scenario);
      for (let graine = 1; graine <= 80; graine++) {
        const r = hasard(graine * 7919);
        for (const niveau of [1, 4, 6]) {
          const titres: string[] = [];
          for (let tour = 1; tour <= d.scenario.roundsCount; tour++) {
            const nouveaux = r() < 0.5 ? [] : [instance(deck[Math.floor(r() * deck.length)]!)];
            const a = articleDeLaGazette(entree(d, { graine, tour, niveau, nouveaux }));
            expect(a.titre.trim().length).toBeGreaterThan(10);
            expect(a.chapo.length, a.chapo).toBeGreaterThanOrEqual(80);
            expect(a.chapo.length, a.chapo).toBeLessThanOrEqual(420);
            expect(a.rubrique.length).toBeGreaterThan(3);
            expect(a.sujets.length).toBeGreaterThan(0);
            titres.push(a.titre);
          }
          expect(new Set(titres).size, `${d.code} graine ${graine} n${niveau} : ${titres.join(" | ")}`).toBe(
            titres.length,
          );
        }
      }
    }
  });

  it("dans un secteur, deux gabarits ne donnent jamais le même titre", () => {
    for (const secteur of Object.keys(LEXIQUES) as (keyof typeof LEXIQUES)[]) {
      const tous = (Object.keys(TITRES) as CleDeGabarit[]).flatMap((cle) => titresDe(cle, secteur));
      expect(new Set(tous).size).toBe(tous.length);
    }
  });

  it("chaque clé a assez de titres pour une partie (six au moins, huit pour le calme)", () => {
    for (const [cle, liste] of Object.entries(TITRES)) {
      expect(liste!.length, cle).toBeGreaterThanOrEqual(cle.startsWith("calme") ? 8 : 6);
    }
  });
});

/** Toutes les chaînes de la banque, brutes. */
function banque(): string[] {
  return [
    NOM_DU_JOURNAL,
    DEVISE_DU_JOURNAL,
    SOURCE_DU_CREDIT,
    ...Object.values(TITRES).flat(),
    ...Object.values(CALMES).flat(),
    ...ANNONCES_DE_FAIT,
    ...ANNONCES_DE_PREVISION,
    ...CAUSES_DE_FAIT,
    ...CAUSES_DE_PREVISION,
    ...Object.values(SUITES),
    ...Object.values(COTES),
    ...Object.values(SAISONS_EN_FOND),
    ...Object.values(OBJETS),
    ...Object.values(AMPLEURS).flat(),
    ...Object.values(MOTIFS).flatMap((m) => [m.motif, m.rubrique ?? ""]),
    ...Object.values(MOTIFS_D_INVESTISSEMENT).map((m) => m.motif),
    ...Object.values(MOTIFS_PAR_DEFAUT),
    ...Object.values(CLIENTELES),
    ...Object.values(LEXIQUES).flatMap((l) => [
      l.profession,
      l.domaine,
      l.marche,
      l.clients,
      l.intrants,
      l.intrantsTitre,
      l.prixDesIntrants,
      l.outil,
      l.rubriqueDesCouts,
      ...l.sources,
    ]),
  ];
}

/** Des titres et des enseignes qui existent : le journal n'en cite aucun. */
const MARQUES_REELLES =
  /\b(Échos|Monde|Figaro|Libération|Parisien|Ouest-France|Moniteur|Amazon|Decathlon|Airbnb|Booking|Uber|Deliveroo|Zara|Primark|Shein|Leboncoin|Cdiscount|Fnac|Darty|Carrefour|Leclerc|Auchan|Ibis|Accor|Basic-Fit|Fitness Park|Bouygues|Vinci|Eiffage|Geodis|Sony|Bose|JBL|Marshall|Apple|Google|Facebook|Instagram|TikTok|YouTube|Michelin|Gault|Millau)\b/i;

describe("les règles d'écriture, sur toute la banque", () => {
  const toutes = banque().filter(Boolean);

  it("aucun tiret en milieu de phrase", () => {
    for (const t of toutes) expect(t, t).not.toMatch(/ [—–-] /);
  });

  it("aucun chiffre écrit à la main", () => {
    for (const t of toutes) expect(t, t).not.toMatch(/\d/);
  });

  it("aucune marque réelle, et pas un mot du jeu", () => {
    for (const t of toutes) {
      expect(t, t).not.toMatch(MARQUES_REELLES);
      expect(t, t).not.toMatch(/\b(tour|tours|joueur|joueurs|carte|cartes|moteur|niveau|IPG|partie)\b/i);
    }
  });

  it("les sources sont au singulier : le verbe s'accorde", () => {
    for (const l of Object.values(LEXIQUES)) for (const s of l.sources) expect(s, s).toMatch(/^(la |le |l')/);
  });

  it("les titres sont en casse de phrase, sur chaque secteur", () => {
    for (const secteur of Object.keys(LEXIQUES) as (keyof typeof LEXIQUES)[]) {
      for (const cle of Object.keys(TITRES) as CleDeGabarit[]) {
        for (const t of titresDe(cle, secteur)) {
          expect(t.charAt(0), t).toMatch(/[A-ZÀ-Ý]/);
          expect(t.slice(1), t).not.toMatch(/[A-ZÀ-Ý]/);
        }
      }
    }
  });

  it("chaque événement de marché d'un scénario intégré a son motif dans la banque", () => {
    for (const d of SCENARIOS) {
      for (const def of evenementsDeMarche(d.scenario)) {
        const lu = lireLEvenement(instance(def), true);
        if (!lu) continue;
        expect(motifDe(def.code, lu.sujet).motif, def.code).not.toBe(MOTIFS_PAR_DEFAUT[lu.sujet]);
      }
    }
  });

  it("chaque clientèle visée par un événement a son nom dans la banque", () => {
    for (const d of SCENARIOS) {
      for (const def of evenementsDeMarche(d.scenario)) {
        const lu = lireLEvenement(instance(def), true);
        if (!lu?.segment) continue;
        const existe =
          d.scenario.market.segments.some((s) => s.code === lu.segment) ||
          (d.scenario.products ?? []).some((p) => p.market.segments.some((s) => s.code === lu.segment));
        // Un événement de gamme peut viser une clientèle que ce marché n'a pas : il ne pèse alors sur rien.
        if (!existe) continue;
        expect(CLIENTELES[`${d.sector}:${lu.segment}`], `${d.code} ${lu.segment}`).toBeDefined();
      }
    }
  });

  it("les phrases générées n'ont ni tiret, ni double espace, ni ponctuation doublée", () => {
    for (const d of SCENARIOS) {
      const cas: Partial<EntreeDeLaGazette>[] = [];
      for (let graine = 1; graine <= 12; graine++)
        for (let tour = 1; tour <= 6; tour++) cas.push({ graine, tour, niveau: 1 + (graine % 6) });
      for (const def of evenementsDeMarche(d.scenario))
        for (const niveau of [1, 4]) {
          cas.push({ niveau, nouveaux: [instance(def)] });
          cas.push({ niveau, enCours: [instance(def, 2)] });
        }
      for (const c of cas) {
        {
          const a = articleDeLaGazette(entree(d, c));
          for (const t of [a.titre, a.chapo]) {
            expect(t, t).not.toMatch(/ [—–] /);
            expect(t, t).not.toMatch(/ {2}|\.\.|,,| \.| ,/);
            expect(t, t).not.toMatch(/\bde le\b|\bde les\b|\bà le\b|\bà les\b/);
          }
        }
      }
    }
  });
});
