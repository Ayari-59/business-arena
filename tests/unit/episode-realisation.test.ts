import { describe, expect, it } from "vitest";
import {
  AVENANT,
  COUT_JOUR,
  D,
  ERDRE,
  IMPREVUS,
  KERVALAN,
  MARS,
  MISSIONS,
  MOIS_DERNIER,
  OFFRES_PHASE2,
  OFFRES_TALVENEC,
  PART_AVENANT,
  PHASE2,
  POLITIQUES,
  SUITE_TALVENEC,
  TJM,
  hasard,
  margeATerminaison,
  simuler,
  tjmEquipe,
  valeurRestante,
} from "../../src/engine/episodes/jours-non-factures";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/jours-non-factures";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_REALISATION } from "../../src/pedagogy/episodes/jours-non-factures";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les jours qu'on ne facture pas » enseigne à lire le taux de
 * réalisation à côté du taux d'occupation : des forfaits sous-estimés occupent
 * les consultants à perte, trois missions font l'essentiel des jours non
 * facturés, renforcer une mission dépassée fait monter l'occupation et la
 * perte, et le TJM moyen monte par effet de structure. Ces tests verrouillent
 * les chiffres que les sources donnent et les classements qui disent la leçon.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 2];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
/** Un montant en k€ au dixième, comme les sources l'écrivent. */
const k1 = (v: number) =>
  `${(v / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} k€`;
const pct = (v: number) =>
  `${(v * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const texte = (etape: number, id: string, ctx: Record<string, boolean> = {}) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r(ctx);
};

describe("le modèle du bureau de Nantes", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.passes).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.passes,
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

  it("part de la situation de mars : 72 % d'occupation, 85 % de réalisation", () => {
    const s = simuler(ATTENTISTE, 3).semaines[1]!;
    expect(s.occupation).toBeCloseTo(MARS.occupation, 1);
    expect(s.realisation).toBeGreaterThan(0.8);
    expect(s.realisation).toBeLessThan(0.9);
  });

  it("le renfort fait monter l'occupation et baisser la réalisation, sans finir Kervalan plus tôt", () => {
    for (const g of [2, 9, 21]) {
      const renfort = simuler([0, 3, 3, 3, 3, 3], g);
      const rien = simuler(ATTENTISTE, g);
      expect(renfort.occupation).toBeGreaterThan(rien.occupation + 0.03);
      expect(renfort.realisation).toBeLessThan(rien.realisation - 0.03);
      expect(rien.fin.kervalan - renfort.fin.kervalan).toBeLessThan(0.5);
      expect(renfort.frais).toBeGreaterThan(rien.frais);
    }
  });

  it("trois missions font l'essentiel des jours non facturés", () => {
    const t = simuler(ATTENTISTE, 5);
    const premieres = t.semaines.slice(1, 5).map((s) => s!);
    const derive = premieres.reduce((x, s) => x + s.passesDerive - s.facturesDerive, 0);
    const total = premieres.reduce((x, s) => x + s.passes - s.factures, 0);
    expect(derive / total).toBeGreaterThan(0.75);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("Tempora : le taux de réalisation de mars vaut 85,0 %, ce que la prévision demande", () => {
    const m = MOIS_DERNIER;
    const t = texte(0, "tempora");
    for (const x of [m.regie, m.sains, m.kervalan, m.montlouvel, m.talvenec]) {
      expect(t).toMatch(new RegExp(`${x.passes} (jours )?passés, ${x.factures} facturés`));
    }
    expect(t).toContain("1 500 jours disponibles, 1 080 jours passés");
    expect(MARS.passes).toBe(1080);
    expect(MARS.factures).toBe(918);
    expect(MARS.realisation).toBeCloseTo(0.85, 6);
    expect(MARS.occupation).toBeCloseTo(0.72, 6);
    expect(MARS.partDerive).toBeGreaterThan(0.9);
    expect(EPISODE_REALISATION.prevision.reel(simuler(MEILLEUR, 1))).toBe(85);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(pct(MARS.occupation));
  });

  it("les restes à faire : valeur restante et marge à terminaison des trois missions", () => {
    const t = texte(0, "restes");
    expect(t).toContain(`${COUT_JOUR.junior} €`);
    expect(t).toContain(`${COUT_JOUR.senior} €`);
    for (const id of ["kervalan", "montlouvel", "talvenec"] as const) {
      const m = MISSIONS[id];
      expect(t).toContain(`${m.vendusRestants} jours vendus restants`);
      expect(t).toContain(k1(valeurRestante(m)));
      expect(t).toContain(`${m.raf} jours de reste à faire`);
    }
    expect(t).toContain(`TJM de l'équipe ${tjmEquipe(MISSIONS.kervalan)} €`);
    expect(t).toContain(`−${k1(-margeATerminaison(MISSIONS.kervalan))}`);
    expect(t).toContain(`−${k1(-margeATerminaison(MISSIONS.montlouvel))}`);
    expect(t).toContain(`+${k1(margeATerminaison(MISSIONS.talvenec))}`);
  });

  it("le TJM moyen monte par effet de structure, pas par les prix", () => {
    const t = texte(D.prix, "grades");
    expect(t).toContain(`${TJM.junior} €`);
    expect(t).toContain(`${TJM.senior.toLocaleString("fr-FR").replace(/\s/g, " ")} €`);
    expect(t).toContain(pct(MARS.partJuniors));
    expect(t).toContain(pct(MARS.partJuniorsAnDernier));
    expect(t).toContain(`${Math.round(MARS.tjmAnDernier)} €`);
    expect(MARS.tjm).toBeGreaterThan(MARS.tjmAnDernier + 15);
    expect(ETAPES[D.prix]!.messages({ tjm: "862 €" })[0]!.texte).toContain(
      `${Math.round(MARS.tjmAnDernier)} €`,
    );
    const realise = texte(D.prix, "realise");
    expect(realise).toContain(`${POLITIQUES[3].realisation * 100} %`);
    expect(realise).toContain(`${POLITIQUES[1].realisation * 100} %`);
  });

  it("l'avenant de Kervalan : 40 jours, 33,6 k€, moins de 10 % du marché", () => {
    const t = texte(D.kervalan, "ccap", { trace: true });
    expect(AVENANT).toBe(KERVALAN.avenantJours * tjmEquipe(MISSIONS.kervalan));
    expect(t).toContain(k1(AVENANT));
    expect(t).toContain(pct(PART_AVENANT));
    expect(PART_AVENANT).toBeLessThan(0.1);
    expect(t).toContain(`${KERVALAN.marche / 1000} k€`);
    expect(ETAPES[D.kervalan]!.messages({ rafKervalan: "x" })[0]!.texte).toContain(
      `${KERVALAN.penaliteJour} €`,
    );
  });

  it("la régie de la banque et le déploiement de Talvenec", () => {
    expect(texte(D.banc, "banc")).toContain(`${COUT_JOUR.junior} €`);
    expect(texte(D.banc, "banc")).toContain(`${ERDRE.tjm} €`);
    const t = texte(D.talvenec, "phase1");
    const tjm = tjmEquipe(SUITE_TALVENEC);
    expect(t).toContain(`${tjm} €`);
    expect(t).toContain(k1(SUITE_TALVENEC.memePrix * tjm));
    expect(t).toContain(k1(SUITE_TALVENEC.rechiffre * tjm));
    expect(SUITE_TALVENEC.memePrix / SUITE_TALVENEC.besoin).toBeCloseTo(
      OFFRES_TALVENEC[0]!.realisation,
      6,
    );
    expect(SUITE_TALVENEC.rechiffre / SUITE_TALVENEC.besoin).toBeCloseTo(
      OFFRES_TALVENEC[1]!.realisation,
      6,
    );
  });

  it("la phase 2 : le budget du CHU paie 55 % du périmètre, 95 % du périmètre recoupé", () => {
    const t = texte(D.phase2, "phase2");
    const payes = PHASE2.budget / tjmEquipe(PHASE2);
    expect(t).toContain(`${Math.floor(payes)} jours`);
    expect(t).toContain(`${PHASE2.besoin}`);
    expect(t).toContain(`${PHASE2.trancheFerme} jours`);
    expect(payes / PHASE2.besoin).toBeCloseTo(OFFRES_PHASE2[0]!.realisation, 2);
    expect(payes / PHASE2.trancheFerme).toBeCloseTo(OFFRES_PHASE2[2]!.realisation, 2);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la revue des forfaits est le meilleur choix ; mettre le banc en renfort, le pire", () => {
    const r = rejeu(MEILLEUR, D.marge);
    expect(classement(MEILLEUR, D.marge)[0]).toBe(1);
    expect(classement(MEILLEUR, D.marge).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("D2 : l'avenant est le meilleur en moyenne, recentrer sans négocier le plus sûr ; le renfort est le pire", () => {
    const r = rejeu(MEILLEUR, D.kervalan);
    expect(classement(MEILLEUR, D.kervalan)[0]).toBe(1);
    expect(classement(MEILLEUR, D.kervalan).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.kervalan)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
  });

  it("D2 : sans demandes tracées en semaine 1, l'avenant ne vaut plus le recentrage", () => {
    const sansRevue = [3, 1, 1, 1, 1, 2];
    const avec = rejeu(MEILLEUR, D.kervalan);
    const sans = rejeu(sansRevue, D.kervalan);
    expect(avec[1]!.attendu - avec[2]!.attendu).toBeGreaterThan(5000);
    expect(sans[2]!.attendu).toBeGreaterThan(sans[1]!.attendu);
  });

  it("D3 : chiffrer sur le réalisé est le meilleur choix ; relever les prix sur la foi du TJM moyen, le pire", () => {
    const r = rejeu(MEILLEUR, D.prix);
    expect(classement(MEILLEUR, D.prix)[0]).toBe(1);
    expect(classement(MEILLEUR, D.prix).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
  });

  it("D4 : vendre le banc en régie, même sous le catalogue, bat le renfort et le refus", () => {
    const r = rejeu(MEILLEUR, D.banc);
    expect(classement(MEILLEUR, D.banc)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D5 : rechiffrer sur le réalisé est le meilleur en moyenne ; « même prix », plus sûr, coûte nettement", () => {
    const r = rejeu(MEILLEUR, D.talvenec);
    expect(classement(MEILLEUR, D.talvenec)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(r[0]!.attendu).toBeGreaterThan(r[3]!.attendu);
  });

  it("D6 : recouper le périmètre au budget bat le forfait au prix du client", () => {
    const r = rejeu(MEILLEUR, D.phase2);
    expect(classement(MEILLEUR, D.phase2)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(2000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_REALISATION, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const bonne =
        option.qualite >= 0.7 ||
        (option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000);
      expect(bonne, `D${d + 1} option ${o}`).toBe(false);
    }
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    for (const [d, o] of REFLEXES) expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
  });

  it("lire la réalisation bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(100000);
    expect(bonne! - attentiste!).toBeGreaterThan(100000);
    expect(attentiste!).toBeGreaterThan(200000);
    expect(reflexe!).toBeLessThan(attentiste!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tempora", "restes"],
      ["ccap"],
      ["grades", "realise"],
      ["banc"],
      ["phase1"],
      ["phase2"],
    ],
    jours: JOURS,
    diagnostic: "forfaits",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 85,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_REALISATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi le réflexe, propose de ne pas piloter à l'occupation", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_REALISATION.comportements(p, analyser(EPISODE_REALISATION, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_REALISATION.axe(c).titre).toBe("Ne pas piloter à l'occupation");
  });

  it("à qui a décidé sans enquêter, propose de lire les jours facturés", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_REALISATION.comportements(p, analyser(EPISODE_REALISATION, p).trimestre);
    expect(EPISODE_REALISATION.axe(c).titre).toBe("Lire les jours facturés, pas les jours staffés");
  });

  it("juge la prévision au calcul exact, et le diagnostic selon la cause", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juge = (extra: Partial<PartieJouee>) =>
      EPISODE_REALISATION.comportements(partie(MEILLEUR, extra), t);
    expect(juge({ prevision: 85 })[3]!.score).toBe(1);
    // Les trois missions oubliées ou mal additionnées : à un ou deux points.
    expect(juge({ prevision: 86.5 })[3]!.score).toBe(0.6);
    // Le taux d'occupation, ou les jours facturés rapportés aux jours disponibles.
    expect(juge({ prevision: 72 })[3]!.score).toBe(0);
    expect(juge({ prevision: 61.2 })[3]!.score).toBe(0);
    expect(juge({ diagnostic: "kervalan" })[1]!.score).toBe(0.6);
    expect(juge({ diagnostic: "banc" })[1]!.score).toBe(0);
  });

  it("dit le résultat en marge des missions, rapportée au budget", () => {
    expect(EPISODE_REALISATION.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_REALISATION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
  });
});
