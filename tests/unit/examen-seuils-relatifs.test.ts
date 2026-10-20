import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel, type LeviersDuNiveau } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeLaGestionNeutre, rejeuxDeLEtalon } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE, marcheRejoue } from "@/pedagogy/merite/verdict";
import {
  GRILLES,
  GRILLE_BUSINESS_ARENA_2026,
  REFERENCE_GESTION_NEUTRE_GELEE,
  erreursDeLaGrille,
  grilleGardee,
  noterLaCopie,
  referenceDeLaGrille,
  seuilsDeLaCompetenceNotee,
  seuilsDeLaCopie,
  type CopieNotee,
  type GrilleGardee,
  type MarcheDuRejeu,
  type MesuresDeLaCopie,
} from "@/config/examen/grille";
import {
  SEUILS_D_AVANT_LA_VERSION_3,
  atteint,
  niveauxDits,
  niveauxRelatifsDits,
  pourcentDuSeuil,
  seuilDAtteinteDit,
  seuilDAtteinteRelatifDit,
  type CodeDeCompetence,
} from "@/config/examen/competences";
import { CompetencesDeLaPromotion, ReleveDesCompetences } from "@/components/examen/graphiques-de-l-examen";

/**
 * LES SEUILS DE NIVEAU SONT DANS LA GRILLE, ET LA STRATÉGIE ET LE MARKETING SE LISENT PAR
 * RAPPORT À LA GESTION NEUTRE. Décision du propriétaire, sur la mesure « Recaler les seuils
 * de compétence de l'examen sur la gestion neutre » (règle R) : la gestion neutre y obtient
 * de moins d'un quart à plus des trois quarts des points selon le secteur, et des seuils
 * fixes la disaient « acquise » là où elle se classe bien.
 *
 * Trois gardes :
 *
 *   1. AVEC LA GRILLE PUBLIÉE, une copie qui joue exactement la gestion neutre n'est
 *      « acquise » ni en stratégie ni en marketing, sur les marchés mêmes où les seuils
 *      fixes l'auraient dite acquise ; une copie qui la bat nettement l'est.
 *   2. UNE COPIE DE GRILLE D'AVANT (version 2, sans seuils) garde les seuils fixes d'alors :
 *      ses copies encore à noter le sont avec eux, et une notation gardée sans le champ se
 *      relit avec eux.
 *   3. CE QUI DIT LES SEUILS les lit de la grille de l'examen : un examen version 2 dit
 *      les mêmes phrases et trace les mêmes traits qu'avant, un examen version 3 dit et
 *      trace les seuils relatifs.
 */

const RELATIVES: readonly CodeDeCompetence[] = ["strategie", "marketing-prix"];

/** La grille par défaut telle qu'un examen créé en version 2 la garde : sans seuils. */
function grilleGardeeEnVersion2(): GrilleGardee {
  const { seuils: _s, ...sansSeuils } = structuredClone(GRILLE_BUSINESS_ARENA_2026);
  void _s;
  return {
    ...sansSeuils,
    version: 2,
    publiee: "2026-10-16",
    reference: {
      ...REFERENCE_GESTION_NEUTRE_GELEE,
      definition:
        "La gestion neutre du secteur part de la gestion que le formulaire propose et la tient à chaque tour : le prix du marché, un volume qui suit les ventes, un marketing et une qualité au niveau du marché, rien de ce que le niveau n'ouvre pas. Elle ne réagit à personne. Comme le candidat, elle décide sur le marché joué, et ses décisions sont rejouées telles quelles sur les marchés possibles.",
    },
  };
}

/* ---------------------------------------------------------------------------
 * Le montage du rejeu : celui de tests/unit/examen-etalon-gele.test.ts.
 * ------------------------------------------------------------------------- */

function partieEnMemoire(niveau: number, entreprise: string, graine: number) {
  const def = scenarioByCode(scenarioCodeForLevel(entreprise, niveau));
  const ouverts = presetByLevel.get(niveau as 3)!.decisions;
  const equipes = [
    { id: "a-joueur", controller: "human" as const, botProfile: null },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
  ];
  const mondes = new Map<number, EngineScenarioConfig>();
  const scenarioPour = (g: number) => {
    if (!mondes.has(g)) {
      mondes.set(
        g,
        commeEnBase(
          composerLeScenarioJoue({
            scenario: def.scenario,
            seed: g,
            variableWorld: true,
            level: niveau,
            concurrents: equipes.length,
            periodicity: "quarter",
            investmentStories: true,
            leviers: ouverts,
          }),
        ),
      );
    }
    return mondes.get(g)!;
  };
  const etats = equipes.map((t) =>
    applyPeriodicityToCompany(
      def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined),
      "quarter",
      { abonnement: def.scenario.subscription !== undefined },
    ),
  );
  const base: PartieARejouer = {
    graine,
    joueur: "a-joueur",
    equipes,
    etatsInitiaux: etats,
    tours: scenarioPour(graine).roundsCount,
    scenarioPour,
    decisions: [],
    reconduits: [],
    pedagogie: [],
    investissementPlafonne: investissementPlafonne(ouverts),
    leviers: ouverts,
  };
  return { base, ouverts };
}

const prix = (d: RoundDecisions, k: number): RoundDecisions => ({
  ...d,
  price: d.price * k,
  ...(d.products ? { products: Object.fromEntries(Object.entries(d.products).map(([n, p]) => [n, { ...p, price: p.price * k }])) } : {}),
});

/** La gestion neutre décidée sur le marché joué, le prix multiplié par `k` (1 : exactement elle). */
function copieAutourDeLaNeutre(niveau: number, entreprise: string, k: number) {
  const { base, ouverts } = partieEnMemoire(niveau, entreprise, 4242);
  const prises: RoundDecisions[] = [];
  rejouer(base, base.graine, {
    type: "methode",
    decider: (c) => {
      const d = prix(decisionDeLaGestionNeutre(c, ouverts), k);
      prises.push(commeEnBase(d));
      return d;
    },
  });
  const partie: PartieARejouer = { ...base, decisions: prises, reconduits: prises.map(() => false), pedagogie: prises.map(() => ({})) };
  return { partie, ouverts };
}

/** Les mesures d'une copie, par le chemin de l'examen : le rejeu contre l'étalon que la grille nomme. */
function mesurer(partie: PartieARejouer, ouverts: LeviersDuNiveau): MesuresDeLaCopie {
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(partie, g));
  const reference = rejeuxDeLEtalon(partie, ouverts, referenceDeLaGrille(GRILLE_BUSINESS_ARENA_2026).code);
  return { sur: joueur[0]!.sur, joueur: joueur.map(marcheRejoue), reference: reference.map(marcheRejoue), situations: null };
}

const competence = (c: CopieNotee, code: CodeDeCompetence) => c.competences.find((x) => x.code === code)!;

describe("la grille publiée : la gestion neutre n'est jamais « acquise » en stratégie ni en marketing", () => {
  // Deux marchés où la gestion neutre se classe bien : les seuils fixes l'y disaient acquise.
  const CELLULES = [
    { entreprise: "fitness", niveau: 2 },
    { entreprise: "nova", niveau: 4 },
  ] as const;

  for (const cas of CELLULES) {
    it(`${cas.entreprise} niveau ${cas.niveau} : la copie de gestion neutre est en cours, la copie qui la bat nettement est acquise`, () => {
      const neutre = copieAutourDeLaNeutre(cas.niveau, cas.entreprise, 1);
      const mesures = mesurer(neutre.partie, neutre.ouverts);
      const v3 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures, { questions: false });
      const v2 = noterLaCopie(grilleGardeeEnVersion2(), mesures, { questions: false });
      for (const code of RELATIVES) {
        const c = competence(v3, code);
        // Une copie identique à l'étalon a exactement sa part : l'ancre.
        expect(c.part, `${code} : la part de la copie est celle de l'étalon`).toBe(c.partDeLaReference);
        expect(c.niveau, `${code} : grille version 3`).toBe("en-cours");
        // Les seuils fixes l'auraient dite acquise : la garde porte sur un marché où ils trompaient.
        expect(atteint(competence(v2, code).niveau), `${code} : grille version 2`).toBe(true);
      }

      const meilleure = copieAutourDeLaNeutre(cas.niveau, cas.entreprise, 1.05);
      const m = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesurer(meilleure.partie, meilleure.ouverts), { questions: false });
      expect(competence(m, "decision-incertitude").part, "elle bat la gestion neutre sur la plupart des marchés").toBeGreaterThan(0.8);
      for (const code of RELATIVES) {
        expect(atteint(competence(m, code).niveau), `${code} : ${competence(m, code).part} pour un seuil de ${competence(m, code).seuils?.acquis}`).toBe(true);
      }
    }, 120_000);
  }

  it("les grilles publiées écrivent leurs seuils, relatifs en stratégie et en marketing, et ils sont bien formés", () => {
    for (const g of GRILLES) {
      expect(erreursDeLaGrille(g), g.code).toEqual([]);
      expect(g.seuils.relatifs?.competences, g.code).toEqual(RELATIVES);
      // Les opérations gardent les seuils fixes : la gestion neutre y vaut la moitié des
      // points, et les seuils fixes sont déjà comptés à partir d'elle.
      expect(g.seuils.relatifs?.competences, g.code).not.toContain("operations");
    }
  });
});

/* ---------------------------------------------------------------------------
 * Des mesures écrites : la copie joue comme l'étalon, et se classe bien (première sur
 * vingt et un marchés, deuxième sur les autres) : une stratégie et un marketing entre 60
 * et 80 % des points.
 * ------------------------------------------------------------------------- */

const marche = (i: number): MarcheDuRejeu => ({ resultat: 1000 + 10 * i, tresorerie: 10, defaillant: false, rang: i < 21 ? 1 : 2 });
const COMME_L_ETALON: MesuresDeLaCopie = {
  sur: 4,
  joueur: Array.from({ length: 30 }, (_, i) => marche(i)),
  reference: Array.from({ length: 30 }, (_, i) => marche(i)),
  situations: null,
};

describe("une copie de grille d'avant la version 3 garde les seuils fixes d'alors", () => {
  it("la grille gardée sans seuils se lit avec 40/60/80 fixes, et note avec eux", () => {
    const v2 = grilleGardee(grilleGardeeEnVersion2());
    expect(v2.seuils).toEqual(SEUILS_D_AVANT_LA_VERSION_3);
    expect(v2.seuils.fixes).toEqual({ enCours: 0.4, acquis: 0.6, maitrise: 0.8 });
    expect(v2.seuils.relatifs).toBeNull();
    // Et l'étalon y garde sa phrase.
    expect(v2.reference.definition).toMatch(/^La gestion neutre du secteur part de la gestion que le formulaire propose/);

    // La copie qui joue comme l'étalon et se classe première : sa stratégie vaut plus de
    // 60 %, « acquise » sous les seuils fixes, « en cours » sous la règle relative.
    const copie = noterLaCopie(grilleGardeeEnVersion2(), COMME_L_ETALON, { questions: false });
    expect(copie.grille.version).toBe(2);
    expect(copie.grille.seuils).toEqual(SEUILS_D_AVANT_LA_VERSION_3);
    for (const code of RELATIVES) {
      const c = competence(copie, code);
      expect(c.part).toBeGreaterThan(0.6);
      expect(c.niveau, code).toBe("acquis");
      expect(c.seuils).toEqual({ enCours: 0.4, acquis: 0.6, maitrise: 0.8 });
      expect(c.partDeLaReference).toBeUndefined();
    }
    const enV3 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, COMME_L_ETALON, { questions: false });
    for (const code of RELATIVES) expect(competence(enV3, code).niveau, code).toBe("en-cours");
    // Mêmes points : la note ne dépend pas de la version.
    expect(enV3.note).toBe(copie.note);
    expect(enV3.lignes).toEqual(copie.lignes);
  });

  it("une notation gardée avant la version 3 se relit avec les seuils fixes, et garde ses niveaux", () => {
    const gardee = {
      grille: { code: "business-arena-2026", version: 2, nom: "Business Arena 2026", reference: REFERENCE_GESTION_NEUTRE_GELEE },
      competences: [{ code: "strategie" as const, nom: "Stratégie", part: 0.62, niveau: "acquis" as const }],
    };
    expect(seuilsDeLaCopie(gardee)).toEqual(SEUILS_D_AVANT_LA_VERSION_3);
    expect(seuilsDeLaCompetenceNotee(gardee.competences[0]!, seuilsDeLaCopie(gardee)).acquis).toBe(0.6);
  });
});

/* ---------------------------------------------------------------------------
 * Ce qui dit les seuils : phrases, traits, pages.
 * ------------------------------------------------------------------------- */

const traits = (html: string) => [...html.matchAll(/<line x1="([\d.]+)"/g)].map((m) => Number(m[1]));

describe("les seuils se disent et se tracent depuis la grille de l'examen", () => {
  const v2 = grilleGardee(grilleGardeeEnVersion2());
  const v3 = grilleGardee(GRILLE_BUSINESS_ARENA_2026);

  it("un examen version 2 dit « 60 % », comme avant ; un examen version 3 dit aussi les seuils relatifs", () => {
    expect(pourcentDuSeuil(v2.seuils.fixes.acquis)).toBe("60 %");
    expect(niveauxDits(v2.seuils.fixes)).toBe("non acquis sous 40 %, en cours dès 40 %, acquis dès 60 %, maîtrisé dès 80 %");
    expect(seuilDAtteinteDit(v2.seuils, v2.reference.nom)).toBe("60 %");
    expect(seuilDAtteinteRelatifDit(v2.seuils, v2.reference.nom)).toBeNull();
    expect(niveauxRelatifsDits(v2.seuils, v2.reference.nom)).toBeNull();

    expect(niveauxDits(v3.seuils.fixes)).toBe("non acquis sous 40 %, en cours dès 40 %, acquis dès 60 %, maîtrisé dès 80 %");
    expect(seuilDAtteinteRelatifDit(v3.seuils, v3.reference.nom)).toBe(
      "En stratégie et en marketing et prix, le seuil se compte à partir de la part que la gestion neutre du secteur obtient sur les mêmes marchés, plus 10 points.",
    );
    expect(niveauxRelatifsDits(v3.seuils, v3.reference.nom)).toBe(
      "En stratégie et en marketing et prix, les seuils se comptent à partir de la part que la gestion neutre du secteur obtient sur les mêmes marchés : en cours dès cette part moins 10 points, acquis dès cette part plus 10 points, maîtrisé dès cette part plus 30 points, entre 0 % et 100 %.",
    );
    expect(seuilDAtteinteDit(v3.seuils, v3.reference.nom)).toBe(
      "60 % ; en stratégie et en marketing et prix, la part de la gestion neutre du secteur plus 10 points",
    );
  });

  it("le relevé trace le seuil de la grille qui a noté la copie : 60 partout en version 2, le seuil relatif de la copie en version 3", () => {
    // Une notation version 2 gardée avant la version 3 : sans seuils nulle part.
    const avant = noterLaCopie(grilleGardeeEnVersion2(), COMME_L_ETALON, { questions: false });
    const sansSeuils = {
      grille: { code: avant.grille.code, version: avant.grille.version, nom: avant.grille.nom, reference: avant.grille.reference },
      competences: avant.competences.map(({ code, nom, part, niveau }) => ({ code, nom, part, niveau })),
    };
    for (const n of [avant, sansSeuils]) {
      const html = renderToStaticMarkup(createElement(ReleveDesCompetences, { competences: n.competences, seuils: seuilsDeLaCopie(n) }));
      expect(traits(html)).toEqual(n.competences.map(() => 60));
      expect(html).not.toMatch(/acquis dès/);
    }

    const apres = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, COMME_L_ETALON, { questions: false });
    const html = renderToStaticMarkup(createElement(ReleveDesCompetences, { competences: apres.competences, seuils: seuilsDeLaCopie(apres) }));
    const attendus = apres.competences.map((c) => (RELATIVES.includes(c.code) ? c.partDeLaReference! + 0.1 : 0.6) * 100);
    traits(html).forEach((x, i) => expect(x, apres.competences[i]!.code).toBeCloseTo(attendus[i]!, 6));
    expect(traits(html).some((x) => Math.abs(x - 60) > 1)).toBe(true);
    for (const code of RELATIVES) {
      expect(html).toContain(`acquis dès ${pourcentDuSeuil(competence(apres, code).seuils!.acquis)}`);
    }
  });

  it("la promotion trace le seuil que le service lui passe", () => {
    const html = renderToStaticMarkup(
      createElement(CompetencesDeLaPromotion, {
        competences: [
          { code: "strategie", nom: "Stratégie", moyenne: 0.5, atteinte: 0.5, seuil: 0.72, evalues: 2 },
          { code: "tresorerie", nom: "Pilotage de la trésorerie", moyenne: 0.9, atteinte: 1, seuil: 0.6, evalues: 2 },
        ],
      }),
    );
    expect(traits(html)).toEqual([72, 60]);
  });

  /** Les pages qui disent ou tracent un seuil, et ce qu'elles doivent lire. */
  const LECTEURS: Record<string, RegExp[]> = {
    "app/examen/[code]/resultat/page.tsx": [/seuils=\{seuilsDeLaCopie\(n\)\}/, /seuilsDeLaCopie\(n\)\.fixes\.acquis/],
    "app/teacher/examens/[id]/candidats/[candidatId]/page.tsx": [/seuils=\{seuilsDeLaCopie\(notation\)\}/],
    "app/teacher/examens/[id]/page.tsx": [/grilleDeLExamen\(examen\)/, /grille\.seuils\.fixes\.acquis/, /seuilDAtteinteRelatifDit\(grille\.seuils/],
    "app/teacher/examens/[id]/accreditation/page.tsx": [
      /grilleDeLExamen\(examen\)/,
      /niveauxDits\(grille\.seuils\.fixes\)/,
      /niveauxRelatifsDits\(grille\.seuils/,
      /seuilDAtteinteDit\(grille\.seuils/,
    ],
    "components/examen/graphiques-de-l-examen.tsx": [/seuilsDeLaCompetenceNotee\(c, seuils\)/],
    "services/examen.service.ts": [/grilleDeLExamen\(examen\)\.seuils/],
  };
  const sansCommentaires = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  for (const [fichier, motifs] of Object.entries(LECTEURS)) {
    it(`${fichier} lit les seuils de la grille de l'examen, jamais d'une constante`, () => {
      const source = sansCommentaires(readFileSync(join(process.cwd(), "src", fichier), "utf8"));
      expect(source).not.toMatch(/\bSEUILS_DE_NIVEAU\b|\bSEUILS_D_AVANT_LA_VERSION_3\b|\bSEUIL_D_ATTEINTE_EN_POURCENT\b/);
      for (const m of motifs) expect(source, String(m)).toMatch(m);
    });
  }
});
