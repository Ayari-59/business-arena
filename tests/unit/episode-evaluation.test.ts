import { describe, expect, it } from "vitest";
import {
  BINOME,
  C,
  CADRAGE_RATE,
  CONTRIBUTION_SENIOR_SEMAINE,
  COUT_DEPART,
  COUT_HORS_GRILLE,
  COUT_MAL_PREPARE,
  COUT_PRIME,
  COUT_PROMESSE,
  COUT_RATTRAPAGE,
  D,
  DEPART,
  IMPREVUS,
  PILOTAGE_GARDE,
  SALAIRE_SENIOR,
  TJM_SENIOR,
  chancesAuComite,
  charge,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/promotion-refusee";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/promotion-refusee";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_EVALUATION } from "../../src/pedagogy/episodes/promotion-refusee";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La promotion qu'il faudra refuser » enseigne trois choses : une
 * décision d'évaluation se prépare avec des critères écrits et les faits de
 * l'année, sans quoi le comité suit les soutiens ; elle s'annonce en face,
 * avec un plan de progression et une date de réexamen ; elle ne se négocie
 * pas par des compensations ou des promesses qui contournent les critères.
 * Ces tests verrouillent les classements qui le disent, et recalculent depuis
 * le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 3, 0, 0];
const ATTENTISTE = [3, 3, 3, 2, 3, 2];
const NEUTRE = [3, 2, 3, 0, 3, 0];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_EVALUATION.contexte(
    EPISODE_EVALUATION.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const messages = (etape: number, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx = EPISODE_EVALUATION.contexte(
    EPISODE_EVALUATION.lire(decisions, graine, 0, semaine),
    decisions,
  );
  return ETAPES[etape]!.messages(ctx)
    .map((m) => `${m.de} : ${m.texte}`)
    .join(" ");
};
const k = (v: number) => v / 1000;

describe("le modèle de l'équipe de Noé", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[2]!.occupation).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.occupation,
      9,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("avec des critères et des faits, le comité retient la plus prête ; sans eux, il suit les soutiens", () => {
    const avecFaits = chancesAuComite(MEILLEUR);
    expect(avecFaits[C.tahina]).toBeGreaterThan(0.8);
    const sansFaits = chancesAuComite(NEUTRE);
    expect(sansFaits[C.vasco]).toBeGreaterThan(sansFaits[C.tahina]! * 2);
    // Porter Elric le fait passer plus d'une fois sur deux, prêt ou non.
    expect(chancesAuComite(REFLEXE)[C.elric]).toBeGreaterThan(0.5);
    // L'échange avec Bathilde est accepté sur certains tirages, refusé sur d'autres.
    const accords = new Set(GRAINES_DU_BILAN.map((g) => simuler([1, 1, 2], g).accord));
    expect([...accords].sort()).toEqual([false, true]);
  });

  it("une annonce en face retient bien plus que le courriel ou le silence", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.reduce((n, g) => n + simuler(c, g).partis.length, 0);
    expect(departs(MEILLEUR)).toBeLessThan(6);
    expect(departs([1, 1, 1, 0, 1, 1])).toBeGreaterThan(departs(MEILLEUR) + 8);
    expect(departs(ATTENTISTE)).toBeGreaterThan(30);
    expect(risqueDeDepart(9, 1)).toBeCloseTo(0.04, 9);
    expect(risqueDeDepart(0, 1.3)).toBe(0.75);
  });

  it("une compensation hors grille est découverte la plupart du temps", () => {
    const decouvertes = GRAINES_DU_BILAN.filter(
      (g) => simuler([1, 1, 1, 1, 0, 1], g).decouverte,
    ).length;
    expect(decouvertes).toBeGreaterThan(15);
    expect(simuler(MEILLEUR, 3).decouverte).toBeNull();
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'un départ, que la semaine 1 demande, se pose ligne par ligne", () => {
    const contribution = (210 * 0.75 * 1000 - 62000 * 1.45) / 52;
    expect(CONTRIBUTION_SENIOR_SEMAINE).toBeCloseTo(contribution, 6);
    expect(contribution).toBeCloseTo(1300, 6);
    const aLaMain = 0.2 * 62000 + 12 * 1300 + 20 * 1000;
    expect(COUT_DEPART).toBeCloseTo(aLaMain, 6);
    expect(aLaMain).toBe(48000);
    expect(EPISODE_EVALUATION.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(48, 6);
    const texte = source(0, "depart", []);
    expect(texte).toContain(`${DEPART.honoraires * 100} % du salaire annuel brut`);
    expect(texte).toContain(`${k(SALAIRE_SENIOR)} k€ pour un senior`);
    expect(texte).toContain("Douze semaines de vacance");
    expect(DEPART.vacance).toBe(12);
    expect(TJM_SENIOR).toBe(1000);
    expect(texte).toContain("1 000 € de TJM");
    expect(Math.round(CONTRIBUTION_SENIOR_SEMAINE)).toBe(1300);
    expect(texte).toContain("soit 1 300 € par semaine");
    expect(texte).toContain("210 jours ouvrés par an à 75 % d'occupation");
    expect(texte).toContain("45 % de charges");
    expect(texte).toContain("vingt jours facturables");
    expect(DEPART.integration).toBe(20);
  });

  it("le coût d'un manager mal préparé et celui d'une promesse sont ceux des sources", () => {
    expect(source(0, "promotions", [])).toContain(`environ ${k(COUT_MAL_PREPARE)} k€`);
    expect(source(3, "promesses", [1, 1, 1])).toContain("Deux n'ont pas été tenues");
    expect(COUT_PROMESSE).toBeCloseTo((2 / 3) * COUT_DEPART, 6);
    expect(source(5, "premiers", MEILLEUR.slice(0, 5))).toContain(`${k(CADRAGE_RATE)} k€`);
    const charge8 = source(5, "charge", MEILLEUR.slice(0, 5));
    expect(charge8).toContain(`${nombreFr(k(PILOTAGE_GARDE))} k€`);
    expect(PILOTAGE_GARDE).toBe(8 * 1300);
    expect(BINOME).toBe(4400);
  });

  it("l'augmentation hors grille, le rattrapage et la prime coûtent ce que disent les sources", () => {
    expect(COUT_HORS_GRILLE).toBeCloseTo(0.08 * 62000 * 1.45, 6);
    expect(COUT_RATTRAPAGE).toBeCloseTo(COUT_HORS_GRILLE, 6);
    const regles = source(4, "remuneration", [1, 1, 1, 1]);
    expect(regles).toContain(`${nombreFr(Math.round(COUT_HORS_GRILLE / 100) / 10)} k€ par an`);
    expect(ETAPES[D.compensation]!.options[0]!.d).toContain(
      `${nombreFr(Math.round(COUT_HORS_GRILLE / 100) / 10)} k€`,
    );
    expect(COUT_PRIME).toBeCloseTo(charge(5000), 6);
    expect(ETAPES[D.compensation]!.options[2]!.d).toContain(
      `${nombreFr(Math.round(COUT_PRIME / 100) / 10)} k€`,
    );
  });

  it("les messages nomment le promu et le non-retenu le plus exposé", () => {
    const t = simuler([1, 1, 1], 3);
    const texte = messages(3, [1, 1, 1]);
    expect(texte).toContain(["Elric Mérindol", "Tahina Rakotoarisoa", "Vasco Tanneau"][t.promu]!);
    expect(texte).toContain(["Elric Mérindol", "Tahina Rakotoarisoa", "Vasco Tanneau"][t.premier]!);
  });
});

function nombreFr(v: number) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : écrire la grille et rassembler les faits bat de loin porter le plus apprécié", () => {
    const r = rejeu(MEILLEUR, D.dossier);
    expect(classement(MEILLEUR, D.dossier)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : dire les faits à l'entretien ne vaut que si on les a rassemblés", () => {
    const r = rejeu(MEILLEUR, D.entretiens);
    expect(classement(MEILLEUR, D.entretiens)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    // Sans les faits de la semaine 1, rester neutre vaut autant.
    const sans = rejeu(NEUTRE, D.entretiens);
    expect(sans[2]!.attendu).toBeGreaterThanOrEqual(sans[1]!.attendu - 1000);
  });

  it("D3 : recommander sur les faits bat défendre Elric et l'échange avec Bathilde", () => {
    const r = rejeu(MEILLEUR, D.comite);
    expect(classement(MEILLEUR, D.comite)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
  });

  it("D4 : l'annonce en face avec un plan bat le courriel, le silence et la promesse", () => {
    const r = rejeu(MEILLEUR, D.annonce);
    expect(classement(MEILLEUR, D.annonce)[0]).toBe(1);
    for (const o of [0, 2, 3]) expect(r[1]!.attendu - r[o]!.attendu).toBeGreaterThan(25000);
  });

  it("D5 : la grille et un plan de progression battent la compensation hors critères", () => {
    const r = rejeu(MEILLEUR, D.compensation);
    expect(classement(MEILLEUR, D.compensation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(8000);
  });

  it("D6 : organiser la prise de poste est le meilleur choix en moyenne ; garder le pilotage est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.priseDePoste);
    expect(classement(MEILLEUR, D.priseDePoste)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    expect(plusSure(MEILLEUR, D.priseDePoste)).toBe(2);
    // Avec un promu mal préparé, l'accompagnement vaut bien plus.
    const t = simuler(MEILLEUR, 1);
    expect(t.promu).toBe(C.tahina);
    const avecElric = [0, 0, 0, 1, 1, 1];
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.priseDePoste);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(ecart(avecElric)).toBeGreaterThan(ecart(MEILLEUR) + 5000);
  });

  it("la bonne méthode bat nettement garder le plus apprécié et laisser le comité trancher", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(60000);
    expect(bonne! - attentiste!).toBeGreaterThan(50000);
    expect(attentiste!).toBeGreaterThan(100000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_EVALUATION, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["faits", "depart"],
      ["grille"],
      ["calibrage"],
      ["nonretenus"],
      ["remuneration"],
      ["premiers"],
    ],
    jours: JOURS,
    diagnostic: "criteres",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 48,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_EVALUATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a voulu garder le plus apprécié, propose de décider sur les critères", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_EVALUATION.comportements(p, analyser(EPISODE_EVALUATION, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EVALUATION.axe(c).titre).toBe(
      "Décider sur les critères, pas pour ne pas perdre",
    );
  });

  it("à qui a décidé sans enquêter, propose de recueillir les faits", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EVALUATION.comportements(p, analyser(EPISODE_EVALUATION, p).trimestre);
    expect(EPISODE_EVALUATION.axe(c).titre).toBe("Recueillir les faits avant le comité");
  });

  it("juge le coût d'un départ calculé en semaine 1 : juste, proche, ou faute d'une ligne", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_EVALUATION.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(48)).toBe(1);
    expect(score(54)).toBe(0.6);
    // Sans l'intégration du remplaçant : 28 k€ ; avec le chiffre d'affaires au lieu de la contribution : 80 k€.
    expect(score(28)).toBe(0);
    expect(score(12.4 + 12 * 3.75 + 20)).toBe(0);
  });

  it("dit le résultat en valeur de l'équipe, et compte les démissions", () => {
    expect(EPISODE_EVALUATION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/valeur de l'équipe/);
    const g = GRAINES_DU_BILAN.find((x) => simuler(ATTENTISTE, x).partis.length === 2)!;
    expect(EPISODE_EVALUATION.bilan.titre(simuler(ATTENTISTE, g))).toMatch(/2 démissions/);
  });
});
