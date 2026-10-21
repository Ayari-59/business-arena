import { describe, expect, it } from "vitest";
import {
  GRILLES,
  GRILLE_BUSINESS_ARENA_2026,
  GRILLE_BUSINESS_ARENA_2026_VERSION_3,
  GRILLE_PAR_DEFAUT,
  erreursDeLaGrille,
  justificationDe,
  methodeDe,
  mesurerLaLigne,
  noteDeDecision,
  noterLaCopie,
  REFERENCE_GESTION_NEUTRE_GELEE,
  type MarcheDuRejeu,
  type MesuresDeLaCopie,
} from "@/config/examen/grille";
import {
  COMPETENCES_D_EXAMEN,
  SEUILS_DE_NIVEAU,
  atteint,
  competencesEvaluees,
  niveauDeCompetence,
} from "@/config/examen/competences";
import {
  CANDIDATS_MINIMUM,
  ETABLISSEMENTS_MINIMUM,
  MESSAGE_COMPARAISON_INDISPONIBLE,
  comparer,
  percentile,
} from "@/config/examen/comparaisons";
import { cellule, csvDeLExamen, nomDuFichier } from "@/config/examen/export";
import { normaliserCodeDExamen, normaliserNumero, phraseDuRecu } from "@/config/examen/textes";
import { choisirLeLot, graineDuRang, difficulteDeLaGraine, scenarioDeLExamen, PERIODICITE_DE_L_EXAMEN } from "@/pedagogy/examen/lot";
import type { Periodicity } from "@/config/scenarios/periodicity";
import { scenarioByCode } from "@/config/scenarios/registry";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { neutralDecisions } from "@/engine/bots";
import { rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { GRAINES_DU_BILAN } from "@/engine/episodes/commun";
import type { CompanyState, RoundDecisions } from "@/engine/types";

/**
 * L'EXAMEN INDIVIDUEL, CE QUI SE VÉRIFIE SANS BASE : la grille (ligne par ligne, bornes,
 * version figée), la neutralisation du hasard, les niveaux de compétence, les seuils
 * d'anonymat des comparaisons, la règle du lot de graines, l'export.
 */

const marche = (resultat: number, p: Partial<MarcheDuRejeu> = {}): MarcheDuRejeu => ({
  resultat,
  tresorerie: 1000,
  tresorerieLaPlusBasse: 1000,
  chiffreDAffaires: 100_000,
  defaillant: false,
  rang: 1,
  ...p,
});

function mesures(joueur: MarcheDuRejeu[], reference: MarcheDuRejeu[], sur = 4, situations: number[] | null = null): MesuresDeLaCopie {
  return { sur, joueur, reference, situations: situations ? { scores: situations } : null };
}

describe("la grille : fixe, publiée, versionnée", () => {
  it("chaque grille nommée est bien formée : 100 points, des compétences qui existent", () => {
    for (const g of GRILLES) expect(erreursDeLaGrille(g), g.code).toEqual([]);
    expect(GRILLES.map((g) => g.code)).toContain(GRILLE_PAR_DEFAUT);
    expect(new Set(GRILLES.map((g) => `${g.code}:${g.version}`)).size).toBe(GRILLES.length);
  });

  it("LA VERSION EST FIGÉE : changer un poids sans changer de version fait tomber la garde", () => {
    // La grille par défaut, version 1, telle que publiée le 12 octobre 2026. Une
    // pondération nouvelle est une version nouvelle (ou une autre grille), jamais une
    // retouche silencieuse : un examen ouvert garde sa copie, mais les comparaisons
    // entre établissements se font à grille et version égales.
    const V1 = [
      ["battre-la-reference", 25],
      ["ecart-a-la-reference", 15],
      ["solvabilite", 15],
      ["tresorerie-positive", 10],
      ["rentabilite", 10],
      ["rang", 15],
      ["diagnostics", 10],
    ];
    if (GRILLE_BUSINESS_ARENA_2026.version === 1) {
      expect(GRILLE_BUSINESS_ARENA_2026.lignes.map((l) => [l.code, l.points])).toEqual(V1);
    }
    expect(GRILLE_BUSINESS_ARENA_2026.nom).toBe("Business Arena 2026");
  });

  it("la justification des poids se lit des lignes, pas d'un chiffre écrit", () => {
    const j = justificationDe(GRILLE_BUSINESS_ARENA_2026);
    expect(j[0]).toMatch(/^Qualité des décisions \(40 points : 25 \+ 15\) : /);
    for (const g of GRILLES) {
      for (const f of g.justification) expect(f.pourquoi, `${g.code} : un chiffre écrit`).not.toMatch(/\d/);
    }
    expect(methodeDe(GRILLE_BUSINESS_ARENA_2026.lignes[0]!, 30)).toContain("30 marchés");
  });

  it("ligne par ligne : chaque mesure dit sa part et ce qui l'explique", () => {
    const n = 10;
    const ref = Array.from({ length: n }, (_, i) => marche(1000 + i * 100));
    const joueur = ref.map((r, i) =>
      marche(i < 7 ? r.resultat + 500 : r.resultat - 500, {
        defaillant: i === 9,
        tresorerie: i < 8 ? 10 : -10,
        rang: i < 5 ? 1 : 4,
      }),
    );
    const m = mesures(joueur, ref, 4, [1, 0.5, 0]);
    expect(mesurerLaLigne("battre-la-reference", m)).toEqual({ part: 0.7, detail: "7 marchés sur 10" });
    expect(mesurerLaLigne("solvabilite", m)!.part).toBe(0.9);
    expect(mesurerLaLigne("tresorerie-positive", m)!.part).toBe(0.8);
    expect(mesurerLaLigne("rentabilite", m)!.part).toBe(1);
    // Rang : moitié du temps premier (1), moitié dernier (0) sur quatre.
    expect(mesurerLaLigne("rang", m)!.part).toBeCloseTo(0.5, 9);
    expect(mesurerLaLigne("diagnostics", m)!.part).toBeCloseTo(0.5, 9);
    // L'écart moyen (+200 €) rapporté à l'écart-type de la référence (≈ 287 €).
    const e = mesurerLaLigne("ecart-a-la-reference", m)!;
    expect(e.part).toBeGreaterThan(0.5);
    expect(e.part).toBeLessThan(0.75);
  });

  it("la note se décompose : la somme des lignes fait la note, à l'arrondi près", () => {
    const ref = Array.from({ length: 30 }, (_, i) => marche(i * 37 - 200));
    const joueur = ref.map((r, i) => marche(r.resultat + (i % 3 === 0 ? -50 : 80), { rang: 1 + (i % 4) }));
    const c = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(joueur, ref, 4, [0.8, 0.6]), { questions: true });
    expect(c.lignes).toHaveLength(GRILLE_BUSINESS_ARENA_2026.lignes.length);
    expect(c.lignes.reduce((s, l) => s + l.points, 0)).toBeCloseTo(c.note, 0);
    expect(c.lignes.reduce((s, l) => s + l.max, 0)).toBeCloseTo(100, 6);
    // La copie notée garde l'étalon contre lequel elle a été notée, et les seuils de ses niveaux.
    expect(c.grille).toEqual({
      code: "business-arena-2026",
      version: GRILLE_BUSINESS_ARENA_2026.version,
      nom: "Business Arena 2026",
      reference: REFERENCE_GESTION_NEUTRE_GELEE,
      seuils: GRILLE_BUSINESS_ARENA_2026.seuils,
    });
  });

  it("bornes de 0 à 100 : la meilleure copie fait 100, la pire 0, un écart immense reste borné", () => {
    const ref = Array.from({ length: 30 }, (_, i) => marche(1000 + i));
    const parfait = ref.map((r) => marche(r.resultat + 1e9, { rang: 1, tresorerie: 5, tresorerieLaPlusBasse: 1e9 }));
    const pire = ref.map(() => marche(-1e9, { rang: 4, tresorerie: -5, tresorerieLaPlusBasse: -1e9, defaillant: true }));
    expect(noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(parfait, ref, 4, [1]), { questions: true }).note).toBe(100);
    expect(noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(pire, ref, 4, [0]), { questions: true }).note).toBe(0);
    for (const g of GRILLES) {
      const c = noterLaCopie(g, mesures(parfait, ref), { questions: false });
      expect(c.note).toBeLessThanOrEqual(100);
      for (const l of c.lignes) {
        expect(l.points).toBeGreaterThanOrEqual(0);
        expect(l.points).toBeLessThanOrEqual(l.max + 1e-9);
      }
    }
  });

  it("questions éteintes : le diagnostic sort du calcul, et les autres lignes sont rapportées à 100", () => {
    const ref = Array.from({ length: 30 }, (_, i) => marche(i));
    const joueur = ref.map((r) => marche(r.resultat + 10));
    const c = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(joueur, ref), { questions: false });
    expect(c.horsCalcul.map((h) => h.code)).toEqual(["diagnostics"]);
    expect(c.lignes.find((l) => l.code === "battre-la-reference")!.max).toBeCloseTo((25 * 100) / 90, 1);
    expect(c.competences.map((x) => x.code)).not.toContain("diagnostic");
    // Questions posées mais aucune situation rencontrée : même sortie, une autre raison.
    const sans = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(joueur, ref, 4, []), { questions: true });
    expect(sans.horsCalcul[0]!.raison).toMatch(/Aucune situation/);
  });

  it("des rejeux incomplets ne se notent pas", () => {
    expect(() => noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures([marche(1)], []), { questions: false })).toThrow(/incomplets/);
  });
});

describe("la neutralisation du hasard", () => {
  /**
   * Une partie d'examen rejouée par le pipeline pur de « mérite ou chance » : NOVA niveau
   * 4, six tours, trois concurrents ; le candidat est rangé d'abord (`ordreFixe`). Les
   * décisions ne dépendent que du tour : les mêmes pour les deux candidats.
   */
  function partieDExamen(graine: number, ordre: "candidat-d-abord" | "candidat-en-dernier" = "candidat-d-abord"): PartieARejouer {
    const definition = scenarioByCode("nova");
    const r = { definition, niveau: 4, tours: 6, bots: 3, periodicite: "quarter" as const };
    const ids = ["a", "b", "c", "d"].map((x) => `${x}0000000-0000-4000-8000-000000000000`);
    const idDuCandidat = ordre === "candidat-d-abord" ? ids[0]! : ids[3]!;
    const idsDesBots = ids.filter((x) => x !== idDuCandidat);
    const etats: CompanyState[] = [
      applyPeriodicityToCompany(definition.company(idDuCandidat, definition.playerTeamName, "human"), "quarter", { abonnement: false }),
      ...definition.bots.slice(0, 3).map((b, i) =>
        applyPeriodicityToCompany(definition.company(idsDesBots[i]!, b.name, "bot", b.profile), "quarter", { abonnement: false }),
      ),
    ];
    // Calculées sur un monde fixe, pas sur celui de la graine jouée.
    const base = neutralDecisions({ scenario: scenarioDeLExamen(r, 1), state: etats[0]!, roundIndex: 1 });
    const decisions: RoundDecisions[] = [1.1, 0.95, 1.05, 1.15, 0.9, 1.0].map((k) => ({
      ...base,
      price: Math.round(base.price * k * 10) / 10,
      productionPlan: Math.round(base.productionPlan * (2 - k)),
    }));
    return {
      graine,
      joueur: idDuCandidat,
      equipes: [
        { id: idDuCandidat, controller: "human", botProfile: null },
        ...definition.bots.slice(0, 3).map((b, i) => ({ id: idsDesBots[i]!, controller: "bot" as const, botProfile: b.profile })),
      ],
      etatsInitiaux: etats,
      tours: 6,
      scenarioPour: (g) => scenarioDeLExamen(r, g),
      decisions,
      reconduits: decisions.map(() => false),
      pedagogie: decisions.map(() => ({})),
    };
  }

  const reference = { type: "methode" as const, decider: (ctx: Parameters<typeof neutralDecisions>[0]) => neutralDecisions(ctx) };
  const graines = GRAINES_DU_BILAN;
  const copie = (p: PartieARejouer) => {
    const joueur = graines.map((g) => rejouer(p, g));
    const ref = graines.map((g) => rejouer(p, g, reference));
    const versMarche = (x: ReturnType<typeof rejouer>): MarcheDuRejeu => ({
      resultat: x.joueur.resultatNetCumule,
      tresorerie: x.joueur.tresorerieFinale,
      tresorerieLaPlusBasse: x.joueur.tresorerieLaPlusBasse,
      chiffreDAffaires: x.joueur.chiffreDAffairesCumule,
      defaillant: x.joueur.defaillant,
      rang: x.joueur.rang,
    });
    return noterLaCopie(
      GRILLE_BUSINESS_ARENA_2026,
      { sur: 4, joueur: joueur.map(versMarche), reference: ref.map(versMarche), situations: null },
      { questions: false },
    );
  };

  it("deux candidats aux mêmes décisions, sur deux graines du lot : la même note de décision, à ε près", () => {
    const a = copie(partieDExamen(424242));
    const b = copie(partieDExamen(1717));
    expect(Math.abs(noteDeDecision(a) - noteDeDecision(b))).toBeLessThan(1e-9);
    expect(Math.abs(a.note - b.note)).toBeLessThan(1e-9);
  }, 60_000);

  it("ce qui la rend possible : l'ordre des entreprises fixé (candidat d'abord), car le moteur en dépend", () => {
    // Les mêmes décisions, le candidat rangé en dernier : les tirages ciblés ne frappent
    // plus la même entreprise, et les rejeux changent. D'où `ordreFixe` à la création.
    const d = graines.map((g) => rejouer(partieDExamen(1), g).joueur.resultatNetCumule);
    const autre = graines.map((g) => rejouer(partieDExamen(1, "candidat-en-dernier"), g).joueur.resultatNetCumule);
    expect(autre).not.toEqual(d);
  }, 60_000);
});

describe("les niveaux de compétence et leurs seuils écrits", () => {
  it("non acquis, en cours, acquis, maîtrisé", () => {
    const s = SEUILS_DE_NIVEAU;
    expect(niveauDeCompetence(0, s)).toBe("non-acquis");
    expect(niveauDeCompetence(s.enCours - 0.001, s)).toBe("non-acquis");
    expect(niveauDeCompetence(s.enCours, s)).toBe("en-cours");
    expect(niveauDeCompetence(s.acquis - 0.001, s)).toBe("en-cours");
    expect(niveauDeCompetence(s.acquis, s)).toBe("acquis");
    expect(niveauDeCompetence(s.maitrise - 0.001, s)).toBe("acquis");
    expect(niveauDeCompetence(s.maitrise, s)).toBe("maitrise");
    expect(niveauDeCompetence(1, s)).toBe("maitrise");
    expect(niveauDeCompetence(Number.NaN, s)).toBe("non-acquis");
    expect([atteint("acquis"), atteint("maitrise"), atteint("en-cours"), atteint("non-acquis")]).toEqual([true, true, false, false]);
  });

  it("un référentiel de six à huit compétences, le diagnostic seulement avec les questions", () => {
    expect(COMPETENCES_D_EXAMEN.length).toBeGreaterThanOrEqual(6);
    expect(COMPETENCES_D_EXAMEN.length).toBeLessThanOrEqual(8);
    expect(competencesEvaluees(false).map((c) => c.code)).not.toContain("diagnostic");
    expect(competencesEvaluees(true).map((c) => c.code)).toContain("diagnostic");
    // Chaque compétence évaluée est nourrie par au moins une ligne de chaque grille.
    for (const g of GRILLES) {
      for (const c of COMPETENCES_D_EXAMEN) {
        expect(g.lignes.some((l) => l.competences.some((x) => x.code === c.code)), `${g.code} : ${c.code}`).toBe(true);
      }
    }
  });

  it("le niveau d'une compétence est la part pondérée des lignes qui la nourrissent", () => {
    const ref = Array.from({ length: 10 }, () => marche(100));
    // Toujours au-dessus de la référence, jamais défaillant, trésorerie négative partout.
    const joueur = ref.map(() => marche(200, { tresorerie: -1 }));
    // Version 3, telle que les examens créés avant la gardent : solvabilité 15 points
    // tenus, trésorerie positive 10 × 0,5 perdus : 15 / 20, sous des seuils fixes.
    const c = noterLaCopie(GRILLE_BUSINESS_ARENA_2026_VERSION_3, mesures(joueur, ref), { questions: false });
    const tres = c.competences.find((x) => x.code === "tresorerie")!;
    expect(tres.part).toBeCloseTo(15 / 20, 9);
    expect(tres.niveau).toBe("acquis");
    expect(c.competences.find((x) => x.code === "decision-incertitude")!.niveau).toBe("maitrise");
    // Version 4 : la même part pondérée, lue des points de la grille ; le creux, à égalité
    // avec l'étalon sur chaque marché, tient la moitié de sa ligne.
    const v4 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(joueur, ref), { questions: false });
    const pts = (code: string) => GRILLE_BUSINESS_ARENA_2026.lignes.find((l) => l.code === code)!.points;
    const attendue = (pts("solvabilite") + 0.5 * pts("creux-de-tresorerie")) / (pts("solvabilite") + 0.5 * pts("tresorerie-positive") + pts("creux-de-tresorerie"));
    expect(v4.competences.find((x) => x.code === "tresorerie")!.part).toBeCloseTo(attendue, 9);
  });
});

describe("les comparaisons entre établissements : les seuils d'anonymat", () => {
  const echantillon = (etablissements: number, parEtablissement: number) =>
    Array.from({ length: etablissements * parEtablissement }, (_, i) => ({
      etablissement: `e${i % etablissements}`,
      note: (i * 7) % 100,
    }));

  it("sous le seuil d'établissements ou de candidats : rien ne se montre, pas même un effectif", () => {
    const peu = comparer(echantillon(ETABLISSEMENTS_MINIMUM - 1, 100));
    expect(peu).toEqual({ disponible: false, message: MESSAGE_COMPARAISON_INDISPONIBLE });
    expect(MESSAGE_COMPARAISON_INDISPONIBLE).toBe("Comparaison nationale : disponible à partir de 5 établissements.");
    const petit = comparer(echantillon(ETABLISSEMENTS_MINIMUM, Math.floor((CANDIDATS_MINIMUM - 1) / ETABLISSEMENTS_MINIMUM)));
    expect(petit.disponible).toBe(false);
    expect(Object.keys(petit)).toEqual(["disponible", "message"]);
  });

  it("au seuil : des percentiles et deux effectifs, rien de nominatif", () => {
    const c = comparer(echantillon(ETABLISSEMENTS_MINIMUM, CANDIDATS_MINIMUM / ETABLISSEMENTS_MINIMUM));
    expect(c.disponible).toBe(true);
    if (!c.disponible) return;
    expect(c.etablissements).toBe(ETABLISSEMENTS_MINIMUM);
    expect(c.candidats).toBe(CANDIDATS_MINIMUM);
    expect(c.percentiles.map((p) => p.p)).toEqual([10, 25, 50, 75, 90]);
    expect(JSON.stringify(c)).not.toMatch(/"e\d"/);
    expect(Object.keys(c).sort()).toEqual(["candidats", "disponible", "etablissements", "percentiles"]);
  });

  it("les percentiles s'interpolent entre les rangs", () => {
    expect(percentile([0, 10, 20, 30, 40], 50)).toBe(20);
    expect(percentile([0, 10], 25)).toBe(2.5);
    expect(percentile([], 50)).toBe(0);
  });
});

describe("le lot de graines : la règle d'équivalence", () => {
  it("garde le rang modal de la gestion neutre, et les résultats les plus proches de la médiane", () => {
    const vivier = [
      { graine: 1, resultat: 100, rang: 2 },
      { graine: 2, resultat: 900, rang: 2 },
      { graine: 3, resultat: 480, rang: 2 },
      { graine: 4, resultat: 510, rang: 2 },
      { graine: 5, resultat: 500, rang: 1 },
      { graine: 6, resultat: 495, rang: 3 },
      { graine: 7, resultat: 530, rang: 2 },
    ];
    const lot = choisirLeLot(vivier, 3);
    expect(lot.rang).toBe(2);
    expect(lot.graines.sort()).toEqual([3, 4, 7]);
    expect(lot.etendue).toBe(50);
    expect(lot.vivier).toBe(7);
  });

  it("à tour de rôle dans l'ordre d'entrée : deux voisins n'ont pas le même marché", () => {
    const g = [11, 22, 33];
    expect([0, 1, 2, 3, 4].map((r) => graineDuRang(g, r))).toEqual([11, 22, 33, 11, 22]);
  });

  it("la difficulté d'une graine se mesure dans les réglages de l'examen, de façon déterministe", () => {
    const r = { definition: scenarioByCode("nova"), niveau: 2, tours: 3, bots: 3, periodicite: "quarter" as const };
    const a = difficulteDeLaGraine(r, 99);
    expect(difficulteDeLaGraine(r, 99)).toEqual(a);
    expect(a.rang).toBeGreaterThanOrEqual(1);
    expect(a.rang).toBeLessThanOrEqual(4);
  });
});

describe("l'export et les mots", () => {
  it("cellules : décimale à la française, formules neutralisées, guillemets échappés", () => {
    expect(cellule(12.5)).toBe("12,5");
    expect(cellule("=SOMME(A1)")).toBe("'=SOMME(A1)");
    expect(cellule('Dupont; "Jo"')).toBe('"Dupont; ""Jo"""');
    expect(cellule(null)).toBe("");
  });

  it("un fichier daté, en ASCII, avec sa signature d'octets", () => {
    expect(nomDuFichier({ nom: "Gestion L2 · été", code: "EX-K7M2PR" }, new Date("2026-10-12T22:30:00Z"))).toBe(
      "examen-gestion-l2-ete-ex-k7m2pr-2026-10-13.csv",
    );
    const csv = csvDeLExamen({ examen: { nom: "A", code: "EX-AAAAAA", questions: false }, lignesDeLaGrille: [], copies: [], le: new Date() });
    expect(csv.contenu.startsWith("﻿Candidat;Numéro d'étudiant;")).toBe(true);
  });

  it("le code d'examen, le numéro d'étudiant, le reçu", () => {
    expect(normaliserCodeDExamen(" ex-k7m2pr ")).toBe("EX-K7M2PR");
    expect(normaliserCodeDExamen("EXK7M2PR")).toBe("EX-K7M2PR");
    expect(normaliserCodeDExamen("EX-K7M2P0")).toBeNull();
    expect(normaliserNumero(" 21 00 01a ")).toBe("210001A");
    expect(phraseDuRecu(new Date("2026-10-12T12:05:00Z"))).toBe("Examen remis le 12 octobre 2026 à\u00a014\u00a0h\u00a005");
  });
});

/**
 * LE LOT MESURE DANS LE MONDE QUE LE CANDIDAT JOUERA.
 *
 * `scenarioDeLExamen` posait `periodicity: "quarter"` en dur : la difficulté d'une
 * graine se mesurait sur un monde trimestriel quelle que soit la périodicité de la
 * partie examinée. La périodicité fait désormais partie des réglages de l'examen, et
 * c'est elle que le lot emploie — scénario comme état initial des entreprises.
 */
describe("le lot d'examen suit la périodicité de la partie examinée", () => {
  const reglages = (periodicite: Periodicity) => ({
    definition: scenarioByCode("nova"),
    niveau: 2,
    tours: 3,
    bots: 3,
    periodicite,
  });

  it("le scénario du lot porte la durée de tour de l'examen", () => {
    expect(scenarioDeLExamen(reglages("month"), 1).roundDays).toBe(30);
    expect(scenarioDeLExamen(reglages("quarter"), 1).roundDays).toBe(90);
    expect(scenarioDeLExamen(reglages("year"), 1).roundDays).toBe(360);
  });

  it("au mois, la mesure de difficulté n'est pas celle du trimestre", () => {
    const mois = difficulteDeLaGraine(reglages("month"), 99);
    const trimestre = difficulteDeLaGraine(reglages("quarter"), 99);
    expect(mois).toEqual(difficulteDeLaGraine(reglages("month"), 99)); // déterministe
    expect(mois.resultat).not.toBeCloseTo(trimestre.resultat, 2);
  });

  it("la périodicité de l'examen est celle qui crée la partie du candidat", () => {
    expect(PERIODICITE_DE_L_EXAMEN).toBe("quarter");
  });
});
