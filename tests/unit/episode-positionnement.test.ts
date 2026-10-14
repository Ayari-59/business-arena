import { describe, expect, it } from "vitest";
import {
  ACCELERER,
  ALIGNEMENT,
  COUT_ALIGNEMENT,
  D,
  DEPLACES,
  EN_CONCURRENCE,
  ETAPE2,
  GENERALISTE,
  GHT,
  HALDEN,
  HISTORIQUES,
  IMPREVUS,
  KEROUAL,
  PERTE_AUX_PRIX,
  POLE_TARDIF,
  RECRUE,
  REPLI,
  SANTE,
  SCENARIOS,
  SEUIL_DEMANDES,
  TRANSFORMATION,
  chanceHistoriques,
  chanceRecasse,
  demandesEntrantes,
  erreurDuTest,
  haldenRecasse,
  hasard,
  simuler,
  testBon,
  valeurEtapeSuivante,
} from "../../src/engine/episodes/generaliste-ou-specialiste";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/generaliste-ou-specialiste";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  COUT_REMISE_HISTORIQUES,
  EPISODE_POSITIONNEMENT,
  JOURS_HISTORIQUES_PERDUS,
  REGIE_MAXIMALE,
  ancrageGht,
  caGht,
} from "../../src/pedagogy/episodes/generaliste-ou-specialiste";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Rester généraliste ou se spécialiser » enseigne qu'un cabinet
 * de taille moyenne crée un avantage défendable en se spécialisant là où il a
 * déjà des références et une expertise rare, plutôt qu'en suivant un grand
 * concurrent sur le prix des missions généralistes : une baisse de TJM est de
 * la marge pure, et Halden recasse quand on s'aligne. La spécialisation se
 * fait par étapes et se teste, parce qu'elle concentre le risque : il faut
 * réviser l'étape suivante sur les chiffres du test, et garder les clients
 * historiques par la relation plutôt que par la remise. Ces tests verrouillent
 * les classements qui le disent, et recalculent depuis le modèle les chiffres
 * que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 3, 2, 3, 0, 3];
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
const k = (v: number) => Math.round(v / 1000);
const fr = (v: number, d = 0) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_POSITIONNEMENT.contexte(
    EPISODE_POSITIONNEMENT.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle du positionnement", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).signal - simuler(REFLEXE, 12).signal).not.toBeNaN();
    // Avant l'ouverture de Halden, rien ne distingue les décisions dans le chiffre d'affaires.
    expect(simuler(MEILLEUR, 12).semaines[2]!.ca).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.ca,
      6,
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

  it("tire le plan régional à peu près aux probabilités que la fédération annonce", () => {
    const part = (c: string) =>
      GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === c).length / GRAINES_DU_BILAN.length;
    for (const c of ["porteur", "moyen", "gel"] as const) {
      expect(part(c)).toBeGreaterThan(SCENARIOS[c].chance - 0.15);
      expect(part(c)).toBeLessThan(SCENARIOS[c].chance + 0.15);
    }
  });

  it("Halden recasse surtout quand on s'aligne, et un peu plus quand on brade", () => {
    const recasses = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => haldenRecasse(c, g)).length;
    expect(chanceRecasse(REFLEXE)).toBeCloseTo(0.85, 9);
    expect(chanceRecasse(MEILLEUR)).toBeCloseTo(0.05, 9);
    expect(recasses(REFLEXE)).toBeGreaterThan(recasses(MEILLEUR) + 15);
  });

  it("les clients historiques partent d'autant plus qu'on se spécialise vite, moins avec un référent", () => {
    expect(chanceHistoriques([2, 0, 2])).toBeGreaterThan(chanceHistoriques([1, 1, 2]) + 0.5);
    expect(chanceHistoriques([1, 1, 1])).toBeCloseTo(HISTORIQUES.effetReferent * 0.3, 9);
    expect(chanceHistoriques([1, 1, 0])).toBeGreaterThan(chanceHistoriques([1, 1, 1]));
  });

  it("ne rien faire coûte cher ; la spécialisation par étapes crée de la valeur ; s'aligner détruit", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(150000);
    expect(bon).toBeLessThan(600000);
    expect(attendu(ATTENTISTE)).toBeLessThan(bon - 1000000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-1500000);
    expect(attendu(REFLEXE)).toBeLessThan(attendu(ATTENTISTE) - 1000000);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.resultat + t.position).toBeCloseTo(t.objectif, 6);
  });

  it("garde des chiffres d'affaires et des taux d'occupation réalistes, sur tous les chemins", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE, [2, 0, 2, 2, 2, 0]]) {
      for (const g of [1, 7, 18]) {
        for (const s of simuler(c, g, JOURS).semaines.slice(1)) {
          expect(s!.ca).toBeGreaterThan(200000);
          expect(s!.ca).toBeLessThan(275000);
          expect(s!.occupation).toBeGreaterThan(0.55);
          expect(s!.occupation).toBeLessThan(0.86);
        }
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la marge perdue à s'aligner, que la semaine 1 demande, se pose sur les jours et le TJM généralistes", () => {
    expect(COUT_ALIGNEMENT).toBeCloseTo(ALIGNEMENT * GENERALISTE.jours * GENERALISTE.tjm, 6);
    expect(COUT_ALIGNEMENT / 1000).toBeCloseTo(1053, 6);
    expect(EPISODE_POSITIONNEMENT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(1053, 6);
    const texte = source(0, "chiffres", []);
    expect(texte).toContain(`${fr(GENERALISTE.jours)} jours facturés à ${fr(GENERALISTE.tjm)} €`);
    expect(texte).toContain(`soit ${fr((GENERALISTE.jours * GENERALISTE.tjm) / 1e6, 2)} M€`);
    expect(texte).toContain(
      `occupés à ${fr((GENERALISTE.jours / (GENERALISTE.consultants * 210)) * 100, 1)} %`,
    );
    expect(texte).toContain(`${fr(SANTE.jours)} jours à ${fr(SANTE.tjm)} €`);
  });

  it("ce que Halden prend à nos prix se déduit de la source sur Lille : 8 % des jours", () => {
    expect(PERTE_AUX_PRIX).toBeCloseTo(
      EN_CONCURRENCE * (1 - TRANSFORMATION.avecHalden / TRANSFORMATION.generaliste),
      12,
    );
    expect(PERTE_AUX_PRIX).toBeCloseTo(0.08, 9);
    const texte = source(0, "halden", []);
    expect(texte).toContain(`${fr(HALDEN.tjm)} € par jour`);
    expect(texte).toContain("quatre sur dix");
    expect(texte).toContain(
      `de ${fr(TRANSFORMATION.generaliste * 100)} % à ${fr(TRANSFORMATION.avecHalden * 100, 1)} %`,
    );
  });

  it("le risque et le coût des clients historiques sont ceux que la source affiche", () => {
    expect(COUT_REMISE_HISTORIQUES).toBeCloseTo(0.1 * 0.3 * 11700 * 900, 6);
    expect(JOURS_HISTORIQUES_PERDUS).toBeCloseTo(0.3 * 0.3 * 11700, 6);
    const texte = source(2, "historiques", [1, 1]);
    expect(texte).toContain(`estime à ${fr(HISTORIQUES.chance[1] * 100)} %`);
    expect(texte).toContain(`retirent ainsi ${fr(JOURS_HISTORIQUES_PERDUS)} jours par an`);
    expect(texte).toContain(`coûterait ${k(COUT_REMISE_HISTORIQUES)} k€ par an`);
    // Tout réorienter d'un coup : le risque affiché suit le modèle.
    expect(source(2, "historiques", [2, 0])).toContain(
      `estime à ${fr(Math.min(1, chanceHistoriques([2, 0, 2])) * 100)} %`,
    );
  });

  it("la part des cas où chaque test se trompe est celle que la fédération annonce, et l'étude est le plus fiable", () => {
    const erreurs = [0, 1, 2, 3].map(erreurDuTest);
    expect(Math.min(...erreurs)).toBe(erreurs[1]);
    expect(erreurs[1]).toBeGreaterThan(0.1);
    expect(erreurs[1]).toBeLessThan(0.16);
    // Sur trente tirages, l'étude se trompe à peu près aussi souvent que l'annonce.
    const trompe = GRAINES_DU_BILAN.filter((g) => {
      const bon = testBon(MEILLEUR, g);
      return bon !== (hasard(g).scenario === "porteur");
    }).length;
    expect(trompe / 30).toBeLessThan(0.3);
    const texte = source(1, "test", [1]);
    expect(texte).toContain(`se trompe dans ${fr(erreurs[1]! * 100)} % des cas`);
    expect(texte).toContain(`se trompent dans ${fr(erreurs[3]! * 100)} % des cas`);
    expect(texte).toContain(`au-delà de ${SEUIL_DEMANDES}`);
    // La règle affichée est celle du modèle : le test est bon au-delà de 18 demandes.
    for (const g of GRAINES_DU_BILAN) {
      expect(testBon(MEILLEUR, g)).toBe(demandesEntrantes(simuler(MEILLEUR, g).signal) > 18);
    }
  });

  it("ce que vaut l'étape suivante, en semaine 8, est ce que la source affiche ; elle ne paie que si le plan est renforcé", () => {
    const decisions = [1, 1, 1, 1];
    const texte = source(4, "lecture", decisions, 3);
    for (const sc of ["porteur", "moyen", "gel"] as const) {
      const v = valeurEtapeSuivante(decisions, 3, sc);
      expect(texte).toContain(`${v > 0 ? "+" : ""}${k(v) < 0 ? "−" : ""}${fr(Math.abs(k(v)))} k€`);
    }
    expect(valeurEtapeSuivante(decisions, 3, "porteur")).toBeGreaterThan(200000);
    expect(valeurEtapeSuivante(decisions, 3, "moyen")).toBeLessThan(-200000);
    expect(valeurEtapeSuivante(decisions, 3, "gel")).toBeLessThan(-500000);
    expect(texte).toContain(
      `${fr(demandesEntrantes(simuler([1, 1, 1, 1, 0, 3], 3).signal))} demandes entrantes`,
    );
  });

  it("la régie de Kéroual et les réponses au GHT valent ce que les sources affichent", () => {
    expect(REGIE_MAXIMALE).toBeCloseTo(3 * (175 / 52) * 520 * (7 + 4), 6);
    expect(source(3, "intercontrat", [1, 1, 1])).toContain(`${k(REGIE_MAXIMALE)} k€ au plus`);
    expect(caGht(0)).toBeCloseTo(520 * 1050 * 0.85, 6);
    expect(ancrageGht(0)).toBeCloseTo(0.05 * SANTE.jours * SANTE.tjm, 6);
    const texte = source(5, "reponses", [1, 1, 1, 1, 1]);
    expect(texte).toContain(`soit ${k(GHT.jours * SANTE.tjm)} k€`);
    expect(texte).toContain(`À 15 % de remise : ${k(caGht(0))} k€`);
    expect(texte).toContain(`soit ${k(ancrageGht(0))} k€ par an`);
    expect(texte).toContain(`À 7 % : ${k(caGht(2))} k€`);
  });

  it("les options et les messages disent les chiffres du modèle", () => {
    expect(ETAPES[0]!.options[1]!.t).toContain(`${DEPLACES[1]} généralistes`);
    expect(ETAPES[0]!.options[1]!.d).toContain(
      `de ${SANTE.consultants} à ${SANTE.consultants + DEPLACES[1]}`,
    );
    expect(ETAPES[0]!.options[1]!.d).toContain("six seniors");
    expect(ETAPE2.recrues).toBe(6);
    expect(ETAPES[0]!.options[2]!.t).toContain(`${DEPLACES[2]} généralistes`);
    expect(ETAPES[0]!.options[2]!.d).toContain(`${SANTE.consultants + DEPLACES[2]} consultants`);
    expect(ETAPES[0]!.options[2]!.d).toContain(
      `${GENERALISTE.consultants - DEPLACES[2]} généralistes`,
    );
    expect(ETAPES[0]!.reactions[0]![0]!.texte).toContain(
      `${fr(GENERALISTE.tjm * (1 - ALIGNEMENT))} €`,
    );
    expect(ETAPES[3]!.options[0]!.t).toContain(`${fr(GENERALISTE.tjm * 0.75)} €`);
    expect(ETAPES[3]!.options[2]!.d).toContain(`${KEROUAL.tjm} €`);
    expect(ETAPES[4]!.options[1]!.d).toContain(`${REPLI} consultants`);
    expect(ETAPES[4]!.options[1]!.d).toContain(`pôle de ${POLE_TARDIF}`);
    expect(ETAPES[4]!.options[2]!.d).toContain(
      `${fr((ACCELERER.recrues * RECRUE.salaire) / 1e6, 2)} M€`,
    );
    expect(ETAPES[5]!.options[0]!.d).toContain(
      `${fr(Math.round(SANTE.tjm * (1 - GHT.remises[0]) + 1e-6))} €`,
    );
    expect(ETAPES[5]!.options[2]!.d).toContain(
      `${fr(Math.round(SANTE.tjm * (1 - GHT.remises[2]) + 1e-6))} €`,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : se spécialiser par étapes bat l'alignement, qui est le pire, et le basculement d'un coup", () => {
    const r = rejeu(MEILLEUR, D.positionnement);
    expect(classement(MEILLEUR, D.positionnement)[0]).toBe(1);
    expect(classement(MEILLEUR, D.positionnement).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(900000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(300000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(300000);
  });

  it("D2 : tester par une étude bat la campagne et l'experte ; sans test, la révision vaut moins", () => {
    const r = rejeu(MEILLEUR, D.premierPas);
    expect(classement(MEILLEUR, D.premierPas)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(100000);
    // L'information change la réponse : réviser sur un compte fiable vaut plus que sur un compte bruité.
    const gainRevision = (c: readonly number[]) => {
      const x = rejeu(c, D.cap);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(gainRevision(MEILLEUR)).toBeGreaterThan(gainRevision([1, 3, 1, 1, 1, 1]) + 20000);
  });

  it("D3 : un associé référent bat la remise ; il ne vaut que si l'on se spécialise", () => {
    const r = rejeu(MEILLEUR, D.historiques);
    expect(classement(MEILLEUR, D.historiques)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(250000);
    // Sans pôle santé, les clients historiques ne s'inquiètent pas : le référent coûte plus qu'il ne protège.
    expect(classement(ATTENTISTE, D.historiques)[0]).toBe(2);
  });

  it("D4 : occuper les généralistes sans mission sur des pré-diagnostics bat la régie ; brader est le pire", () => {
    const r = rejeu(MEILLEUR, D.intercontrat);
    expect(classement(MEILLEUR, D.intercontrat)[0]).toBe(1);
    expect(classement(MEILLEUR, D.intercontrat).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(300000);
    // Sans pôle pour suivre la demande, les pré-diagnostics ne battent plus la régie.
    expect(classement(ATTENTISTE, D.intercontrat)[0]).toBe(2);
  });

  it("D5 : réviser sur les chiffres du test bat tenir le plan et accélérer", () => {
    const r = rejeu(MEILLEUR, D.cap);
    expect(classement(MEILLEUR, D.cap)[0]).toBe(1);
    expect(classement(MEILLEUR, D.cap).at(-1)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10 + 500000);
  });

  it("D6 : tenir le prix avec une tranche optionnelle est le meilleur en moyenne, concéder 7 % le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.ght);
    expect(classement(MEILLEUR, D.ght)[0]).toBe(1);
    expect(classement(MEILLEUR, D.ght).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.ght)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
  });

  it("la spécialisation par étapes bat le prix et l'attentisme, en moyenne", () => {
    const [bonne, prix, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - prix!).toBeGreaterThan(2000000);
    expect(bonne! - attentiste!).toBeGreaterThan(1000000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_POSITIONNEMENT, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => (REFERENCES[0].chemin[d] as number) === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["chiffres", "halden"],
      ["test"],
      ["historiques"],
      ["intercontrat"],
      ["lecture"],
      ["reponses"],
    ],
    jours: JOURS,
    diagnostic: "specialisation",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1053,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_POSITIONNEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne pas se battre sur le prix", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_POSITIONNEMENT.comportements(
      p,
      analyser(EPISODE_POSITIONNEMENT, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_POSITIONNEMENT.axe(c).titre).toBe(
      "Ne pas se battre sur le prix de ce que tout le monde sait faire",
    );
  });

  it("à qui a décidé sans enquêter, propose de mesurer où le concurrent gagne", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_POSITIONNEMENT.comportements(
      p,
      analyser(EPISODE_POSITIONNEMENT, p).trimestre,
    );
    expect(EPISODE_POSITIONNEMENT.axe(c).titre).toBe(
      "Mesurer où le concurrent gagne avant de répondre",
    );
  });

  it("juge la marge calculée en semaine 1 : juste, proche, ou faute d'avoir compté sur le bon périmètre", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_POSITIONNEMENT.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(1053)).toBe(1);
    expect(score(1120)).toBe(0.6);
    // 10 % du chiffre d'affaires du cabinet entier : 3 400 k€.
    expect(score(3400)).toBe(0);
    // 10 % du résultat d'exploitation du périmètre, au lieu du chiffre d'affaires : ≈ 84 k€.
    expect(score(84)).toBe(0);
  });

  it("dit qui s'est spécialisé par étapes et a révisé, et qui ne l'a pas fait", () => {
    const c = (chemin: readonly number[]) =>
      EPISODE_POSITIONNEMENT.comportements(partie(chemin), simuler(chemin, 11, JOURS))[4]!;
    expect(c(MEILLEUR).score).toBe(1);
    expect(c([1, 1, 1, 1, 0, 1]).score).toBe(0.6);
    expect(c(ATTENTISTE).score).toBe(0);
  });

  it("dit le résultat en valeur créée ou perdue, et quatre tuiles", () => {
    expect(EPISODE_POSITIONNEMENT.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/valeur perdue/);
    expect(EPISODE_POSITIONNEMENT.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
  });
});
