import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import type { RoundDecisions } from "@/engine/types";
import { commeEnBase, rejouer, type IssueDuRejeu, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeReference, selonLeNiveau } from "@/pedagogy/merite/reference";
import {
  CAS_DU_MERITE,
  GRAINES_DU_MERITE,
  SEUIL_DES_DECISIONS_SOLIDES,
  casDuMerite,
  conseillerLaSuite,
  estFavorable,
  placeDuTirage,
  sontSolides,
  verdictDuMerite,
} from "@/pedagogy/merite/verdict";
import { SEUILS_DU_CONSEIL } from "@/pedagogy/profil/profil";

/**
 * MÉRITE OU CHANCE, LES PIÈCES PURES : la matrice, ses seuils, le niveau
 * conseillé, la référence, le rejeu sans base. La garde de vérité (le rejeu
 * retrouve au centime une partie jouée par le vrai pipeline) vit dans
 * tests/integration/merite.test.ts, parce qu'elle a besoin du vrai pipeline.
 */

/** Une partie en mémoire : NOVA niveau 3, trois entreprises, monde variable. */
function partieEnMemoire(niveau = 3) {
  const def = scenarioByCode(scenarioCodeForLevel("nova", niveau));
  const equipes = [
    { id: "a-joueur", controller: "human" as const, botProfile: null },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
  ];
  const scenarioPour = (g: number) =>
    composerLeScenarioJoue({
      scenario: def.scenario,
      seed: g,
      variableWorld: true,
      level: niveau,
      concurrents: equipes.length,
      periodicity: "quarter",
      investmentStories: true,
    });
  const etats = equipes.map((t) =>
    applyPeriodicityToCompany(
      def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined),
      "quarter",
      { abonnement: def.scenario.subscription !== undefined },
    ),
  );
  const ouverts = presetByLevel.get(niveau as 3)!.decisions;
  const base: PartieARejouer = {
    graine: 4242,
    joueur: "a-joueur",
    equipes,
    etatsInitiaux: etats,
    tours: scenarioPour(4242).roundsCount,
    scenarioPour,
    decisions: [],
    reconduits: [],
    pedagogie: [],
  };
  return { base, ouverts };
}

describe("la référence : une méthode déclarée, déterministe", () => {
  const { base, ouverts } = partieEnMemoire();
  const methode = {
    type: "methode" as const,
    decider: (c: Parameters<typeof decisionDeReference>[0]) => decisionDeReference(c, ouverts),
  };

  it("deux rejeux de la référence sous la même graine sont identiques", () => {
    expect(rejouer(base, 7, methode)).toEqual(rejouer(base, 7, methode));
  });

  it("jouer les décisions de la référence comme un joueur redonne la référence, au centime", () => {
    const prises: RoundDecisions[] = [];
    const ref = rejouer(base, 11, {
      type: "methode",
      decider: (c) => {
        const d = decisionDeReference(c, ouverts);
        prises.push(commeEnBase(d));
        return d;
      },
    });
    const joueur = rejouer(
      { ...base, decisions: prises, reconduits: prises.map(() => false), pedagogie: prises.map(() => ({})) },
      11,
    );
    expect(joueur.joueur).toEqual(ref.joueur);
    expect(joueur.tours).toEqual(ref.tours);
  });

  it("un autre marché donne un autre résultat : la graine porte bien le hasard", () => {
    const a = rejouer(base, 1, methode).joueur.resultatNetCumule;
    const b = rejouer(base, 2, methode).joueur.resultatNetCumule;
    expect(a).not.toBe(b);
  });

  it("un levier que le niveau n'ouvre pas est fermé à la méthode, au défaut du formulaire", () => {
    const d: RoundDecisions = {
      price: 59,
      productionPlan: 4000,
      marketingBudget: 6000,
      qualityBudget: 3000,
      maintenanceBudget: 4000,
      insurance: "base",
      hr: { salaryIndex: 1 },
      treasury: { discount: 0, factoring: 0, placement: 5000 },
      finance: { newLoan: 1000, loanRepayment: 0 },
    };
    // Niveau 1 : la qualité et l'entretien partent à la valeur que porte le
    // champ caché du formulaire, celle de la gestion neutre (ici, `d` lui-même) ;
    // ni assurance, ni équipe, ni créances, ni emprunt.
    const n1 = selonLeNiveau(d, presetByLevel.get(1)!.decisions);
    expect(n1.qualityBudget).toBe(3000);
    expect(n1.maintenanceBudget).toBe(4000);
    expect(n1.insurance).toBe(false);
    expect(n1.hr).toBeUndefined();
    expect(n1.treasury).toBeUndefined();
    expect(n1.finance).toEqual({ newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    // Niveau 3 : l'équipe et les créances, sans placement ni emprunt.
    const n3 = selonLeNiveau(d, presetByLevel.get(3)!.decisions);
    expect(n3.hr).toEqual({ salaryIndex: 1 });
    expect(n3.treasury).toEqual({ discount: 0, factoring: 0, placement: 0 });
    expect(n3.insurance).toBe(false);
    expect(n3.finance).toEqual({ newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    // Niveau 4 : l'emprunt et l'assurance ; l'apport et le dividende restent hors de la méthode.
    const n4 = selonLeNiveau(d, presetByLevel.get(4)!.decisions);
    expect(n4.insurance).toBe("base");
    expect(n4.finance).toEqual({ newLoan: 1000, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    expect(n4.treasury?.placement).toBe(0);
    const n5 = selonLeNiveau(d, presetByLevel.get(5)!.decisions);
    expect(n5.treasury?.placement).toBe(5000);
  });
});

describe("le rejeu relit les nombres comme la base les rend", () => {
  it("les clés d'un objet jsonb : les plus courtes d'abord, puis octet par octet", () => {
    expect(Object.keys(commeEnBase({ zz: 1, b: 2, a: 3, aaa: 4, ab: 5 }))).toEqual(["a", "b", "ab", "zz", "aaa"]);
    expect(commeEnBase({ x: undefined, y: -0 })).toEqual({ y: 0 });
  });
});

describe("la matrice : quatre cas, deux seuils écrits", () => {
  it("les quatre cas, dans le vocabulaire des épisodes", () => {
    expect(casDuMerite(true, true)).toBe("merite");
    expect(casDuMerite(true, false)).toBe("malchance");
    expect(casDuMerite(false, true)).toBe("chance");
    expect(casDuMerite(false, false)).toBe("lecon");
    expect(Object.values(CAS_DU_MERITE).map((c) => c.nom)).toEqual(["Mérité", "Malchance", "Chance", "Leçon"]);
  });

  it("des décisions sont solides à deux marchés sur trois, pas en deçà", () => {
    expect(SEUIL_DES_DECISIONS_SOLIDES).toBeCloseTo(2 / 3);
    expect(sontSolides(20, 30)).toBe(true);
    expect(sontSolides(19, 30)).toBe(false);
    expect(sontSolides(30, 30)).toBe(true);
    expect(sontSolides(0, 30)).toBe(false);
  });

  it("la place du marché joué, et la meilleure moitié", () => {
    const valeurs = Array.from({ length: 30 }, (_, i) => i * 100);
    expect(placeDuTirage(valeurs, 5000)).toBe(1);
    expect(placeDuTirage(valeurs, 2900)).toBe(1);
    expect(placeDuTirage(valeurs, 2850)).toBe(2);
    expect(placeDuTirage(valeurs, -10)).toBe(30);
    expect(estFavorable(15, 30)).toBe(true);
    expect(estFavorable(16, 30)).toBe(false);
  });
});

describe("le niveau conseillé : les seuils des épisodes", () => {
  const ENTREPRISES = ["nova", "boutique", "hotel"];
  const suite = (score: number, niveau = 3, entreprise = "boutique") =>
    conseillerLaSuite({ score, niveau, niveauMax: 6, entreprise, entreprises: ENTREPRISES });

  it("reprend les seuils de conseillerUnNiveau", () => {
    expect(SEUILS_DU_CONSEIL).toEqual({ expert: 0.8, decouverte: 0.4 });
  });

  it("à 0,8 et au-delà, un niveau de plus, même entreprise", () => {
    expect(suite(0.8)).toMatchObject({ sens: "monter", niveau: 4, entreprise: "boutique", memeEntreprise: true });
    expect(suite(1)).toMatchObject({ sens: "monter", niveau: 4 });
  });

  it("entre les deux, même niveau, entreprise suivante", () => {
    expect(suite(0.79)).toMatchObject({ sens: "rester", niveau: 3, entreprise: "hotel", memeEntreprise: false });
    expect(suite(0.41)).toMatchObject({ sens: "rester", niveau: 3, entreprise: "hotel" });
    // La dernière entreprise revient à la première.
    expect(suite(0.5, 3, "hotel").entreprise).toBe("nova");
  });

  it("à 0,4 et en deçà, un niveau de moins, même entreprise", () => {
    expect(suite(0.4)).toMatchObject({ sens: "descendre", niveau: 2, entreprise: "boutique" });
    expect(suite(0)).toMatchObject({ sens: "descendre", niveau: 2 });
  });

  it("aux bornes : on ne monte pas au-delà du niveau le plus haut, on ne descend pas sous le premier", () => {
    expect(suite(0.9, 6)).toMatchObject({ sens: "rester", niveau: 6, entreprise: "hotel" });
    expect(suite(0.1, 1)).toMatchObject({ sens: "rester", niveau: 1, entreprise: "boutique" });
  });
});

/** Une issue de rejeu fabriquée : seuls comptent le résultat, le rang et les tours. */
function issue(graine: number, resultat: number, rang = 2, parTour?: number[]): IssueDuRejeu {
  const tours = parTour ?? [resultat / 2, resultat / 2];
  return {
    graine,
    joueur: { ipg: 50, rang, resultatNetCumule: resultat, tresorerieFinale: 1000, defaillant: false },
    sur: 3,
    resultatParTour: tours,
    parEquipe: {},
    tours: [],
  };
}

describe("le verdict : les quatre cas fabriqués", () => {
  const N = GRAINES_DU_MERITE.length;
  const libelles = ["Trimestre 1", "Trimestre 2"];
  const fabriquer = (battues: number, obtenu: number) => {
    // Les décisions du joueur font 1 000 à 30 000 € ; la référence 15 500 €,
    // sauf sur les marchés que le joueur bat.
    const joueur = GRAINES_DU_MERITE.map((g, i) => issue(g, (i + 1) * 1000));
    const reference = GRAINES_DU_MERITE.map((g, i) =>
      issue(g, i >= N - battues ? (i + 1) * 1000 - 500 : (i + 1) * 1000 + 500, 1),
    );
    return verdictDuMerite({
      joue: issue(999, obtenu),
      joueur,
      reference,
      libelles,
      niveau: 3,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova", "hotel"],
    });
  };

  it("Mérité : solides, et un marché dans la meilleure moitié", () => {
    const v = fabriquer(24, 28_000);
    expect(v.battues).toBe(24);
    expect(v.cas).toBe("merite");
    expect(v.joue.place).toBe(3);
    expect(v.phrases.verdict).toMatch(/^Mérité\. .*24 des 30 marchés possibles/);
    expect(v.phrases.marche).toBe("Votre marché était le 3e plus favorable sur 30 : très favorable.");
    expect(v.suite).toMatchObject({ sens: "monter", niveau: 4 });
  });

  it("Malchance : solides, mais un marché dans la moins bonne moitié", () => {
    const v = fabriquer(20, 3_000);
    expect(v.cas).toBe("malchance");
    expect(v.phrases.verdict).toMatch(/À refaire quand même/);
    expect(v.phrases.marche).toMatch(/très défavorable/);
  });

  it("Chance : fragiles, mais un marché favorable", () => {
    const v = fabriquer(10, 22_000);
    expect(v.cas).toBe("chance");
    expect(v.phrases.verdict).toMatch(/doit beaucoup au marché/);
    expect(v.suite).toMatchObject({ sens: "descendre", niveau: 2 });
  });

  it("Leçon : fragiles, et le marché le montre", () => {
    const v = fabriquer(0, 2_000);
    expect(v.cas).toBe("lecon");
    expect(v.phrases.verdict).toMatch(/aucun des 30 marchés possibles/);
  });

  it("la fourchette des places et les constats de tour", () => {
    const joueur = GRAINES_DU_MERITE.map((g, i) => issue(g, 1000 * i, i < 20 ? 1 : i < 28 ? 2 : 3, [100 * i, 1000 * i - 100 * i]));
    const reference = GRAINES_DU_MERITE.map((g, i) => issue(g, 1000 * i - 10, 2, [100 * i + 50, 1000 * i - 100 * i - 60]));
    const v = verdictDuMerite({
      joue: issue(999, 15_000),
      joueur,
      reference,
      libelles,
      niveau: 2,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova", "hotel"],
    });
    expect(v.rangs).toMatchObject({ min: 1, max: 3, plusSouvent: 1 });
    expect(v.phrases.rangs).toBe(
      "Sur 30 marchés possibles, avec vos décisions : entre la 1re et la 3e place sur 3, la 1re le plus souvent.",
    );
    const couteux = v.constats.find((c) => c.cle === "tour-le-plus-couteux")!;
    expect(couteux.texte).toMatch(/^Le tour le plus coûteux : Trimestre 1\./);
    expect(v.constats.find((c) => c.cle === "tour-le-plus-expose")!.texte).toMatch(/Trimestre 2/);
    expect(v.constats.find((c) => c.cle === "part-du-hasard")).toBeDefined();
  });

  it("aucune phrase ne porte de tiret en milieu de phrase", () => {
    for (const [b, o] of [[24, 28_000], [20, 3_000], [10, 22_000], [0, 2_000]] as const) {
      const v = fabriquer(b, o);
      for (const t of [...Object.values(v.phrases), ...v.constats.map((c) => c.texte), v.suite.pourquoi]) {
        expect(t).not.toMatch(/ [—–] /);
      }
    }
  });
});
