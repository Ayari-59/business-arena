import { describe, expect, it } from "vitest";
import {
  COUT_ABSENCES_PRINTEMPS,
  COUT_RUPTURE_H,
  D,
  HEURES_PERDUES_ATTENDUES,
  HEURES_PERDUES_PRINTEMPS,
  IMPREVUS,
  MARGE_HEURE,
  PRIME_EXPERTS,
  VALEUR_RANG,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/polyvalence-des-operateurs";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_ECHELON_TRIMESTRE,
  COUT_TRANSFERT_SEMAINE,
  ETAPES,
  REFERENCES,
  REFLEXES,
  SEMAINES_AVEC_STANDARDS,
  SEMAINES_DE_FORMATION,
} from "../../src/config/episodes/polyvalence-des-operateurs";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_POLYVALENCE } from "../../src/pedagogy/episodes/polyvalence-des-operateurs";
import { euros, kE } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La ligne qui s'arrête quand il manque quelqu'un » enseigne
 * qu'une usine dépend de quelques savoir-faire critiques : on les repère, on
 * les transmet en binôme pendant le creux, on écrit les réglages et on
 * reconnaît la polyvalence ; les heures supplémentaires des experts et
 * l'intérimaire « qui connaît la machine » couvrent une absence et laissent la
 * dépendance entière. Ces tests verrouillent les classements qui le disent, et
 * recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 0, 2, 0, 1, 0];
const REFLEXE = [0, 3, 0, 1, 0, 1];
const ATTENTISTE = [3, 3, 1, 3, 3, 3];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const plusSur = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};

/** Le texte d'une source, tel que le joueur le lit. */
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la ligne 5", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à partir de la décision de la semaine 6 vivent les mêmes six premières semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 0, 2, 3, 3, 3], 12);
    for (let w = 1; w <= 6; w += 1) {
      expect(b.semaines[w]!.perdues).toBeCloseTo(a.semaines[w]!.perdues, 9);
      expect(b.semaines[w]!.service).toBeCloseTo(a.semaines[w]!.service, 9);
      expect(b.semaines[w]!.m1).toBeCloseTo(a.semaines[w]!.m1, 9);
    }
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const i = hasard(g).imprevus;
      expect(i.length).toBeGreaterThanOrEqual(1);
      expect(i.length).toBeLessThanOrEqual(2);
      for (const x of i) {
        expect(x.semaine).toBeGreaterThanOrEqual(2);
        expect(x.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("les heures supplémentaires répétées fatiguent les experts, et Sidoine part plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).kilianPart).length;
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(1);
    expect(departs(REFLEXE)).toBeGreaterThanOrEqual(5);
    const fatigue = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).fatigueFinale));
    expect(fatigue(REFLEXE)).toBeGreaterThan(fatigue(ATTENTISTE) + 0.3);
    expect(risqueDeDepart(0.3, 1)).toBeLessThan(risqueDeDepart(0.8, 1));
    // L'échelon divise le risque par plus de deux.
    expect(risqueDeDepart(0.8, 2)).toBeLessThan(risqueDeDepart(0.8, 1) / 2);
  });

  it("des standards écrits font des conducteurs autonomes plus tôt ; verrouiller les réglages les retarde", () => {
    const quand = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).autonomie[0] ?? 14));
    const ecrits = quand(MEILLEUR);
    expect(ecrits).toBeLessThan(10.5);
    expect(quand([1, 3, 2, 0, 1, 0])).toBeGreaterThan(ecrits + 1.5);
    expect(quand([1, 2, 2, 0, 1, 0])).toBeGreaterThan(quand([1, 3, 2, 0, 1, 0]));
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(-300000);
        expect(t.objectif).toBeLessThan(80000);
        expect(t.perdues).toBeGreaterThan(20);
        expect(t.perdues).toBeLessThan(300);
        expect(t.serviceMoyen).toBeGreaterThan(0.8);
        expect(t.heuresSup).toBeLessThan(200);
        for (const s of t.semaines.slice(1)) {
          expect(s!.service).toBeGreaterThanOrEqual(0.4);
          expect(s!.service).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("les heures perdues d'un trimestre d'hiver, que la semaine 1 demande", () => {
    expect(HEURES_PERDUES_ATTENDUES).toBeCloseTo(3 * 40 * 13 * 0.12 * (0.75 * 0.5 + 0.25), 9);
    expect(HEURES_PERDUES_ATTENDUES).toBeCloseTo(117, 9);
    expect(EPISODE_POLYVALENCE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(117, 9);
    const arrets = source(0, "arrets");
    expect(arrets).toContain("12 %");
    expect(arrets).toContain("40 heures");
    expect(arrets).toContain("trois postes sur quatre");
  });

  it("ce que coûte une heure perdue, et ce que vaut un conducteur de plus au printemps", () => {
    expect(MARGE_HEURE).toBe(640);
    expect(COUT_RUPTURE_H).toBe(950);
    const arrets = source(0, "arrets");
    expect(arrets).toContain(euros(640));
    expect(arrets).toContain(euros(950));
    expect(HEURES_PERDUES_PRINTEMPS).toBeCloseTo(78, 9);
    expect(COUT_ABSENCES_PRINTEMPS).toBeCloseTo(74100, 6);
    expect(VALEUR_RANG[0]).toBeCloseTo(65208, 6);
    expect(VALEUR_RANG[1]).toBeCloseTo(7410, 6);
    const printemps = source(5, "printemps");
    expect(printemps).toContain("78 heures");
    expect(printemps).toContain(kE(74100));
    expect(printemps).toContain(kE(65208));
    expect(printemps).toContain(kE(7410));
  });

  it("les standards, l'échelon, la prime, le transfert à Pontivy", () => {
    expect(SEMAINES_DE_FORMATION).toBeCloseTo(10, 9);
    expect(Math.round(SEMAINES_AVEC_STANDARDS)).toBe(7);
    expect(source(1, "changements")).toContain("de 10 à 7 semaines");
    expect(COUT_ECHELON_TRIMESTRE).toBe(9 * 30 * 13);
    expect(source(2, "cout")).toContain(euros(3510));
    expect(PRIME_EXPERTS.charge).toBeCloseTo(500 * 3 * 1.45, 9);
    expect(source(2, "cout")).toContain(euros(2175));
    expect(COUT_TRANSFERT_SEMAINE).toBe(7 * 260);
    expect(ETAPES[3]!.options[2]!.d).toContain(euros(1820));
  });

  it("les messages et les sources se lisent à chaque étape, quel que soit le chemin", () => {
    for (const chemin of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      ETAPES.forEach((e, i) => {
        const semaine = i === 0 ? 0 : ETAPES[i - 1]!.jusqua;
        const l = EPISODE_POLYVALENCE.lire(chemin.slice(0, i), 3, JOURS, semaine);
        const ctx = EPISODE_POLYVALENCE.contexte(l, chemin.slice(0, i));
        for (const m of e.messages(ctx)) expect(m.texte).not.toMatch(/undefined|NaN/);
        for (const s of e.sources) {
          const texte = typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
          expect(texte, s.id).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : lancer les binômes pendant le creux bat de loin les heures sup, l'intérim et l'attente", () => {
    const c = classement(MEILLEUR, D.plan);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.plan, 1, 0)).toBeGreaterThan(70000);
    expect(ecart(MEILLEUR, D.plan, 1, 2)).toBeGreaterThan(70000);
    expect(ecart(MEILLEUR, D.plan, 1, 3)).toBeGreaterThan(70000);
  });

  it("D2 : écrire les standards avec la qualité ; verrouiller les réglages fige la dépendance", () => {
    const c = classement(MEILLEUR, D.standards);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.standards, 0, 3)).toBeGreaterThan(20000);
    expect(ecart(MEILLEUR, D.standards, 0, 2)).toBeGreaterThan(30000);
  });

  it("D3 : l'échelon de polyvalence paie quand on forme ou qu'on use les experts ; seul, il coûte", () => {
    expect(classement(MEILLEUR, D.reconnaissance)[0]).toBe(2);
    expect(ecart(MEILLEUR, D.reconnaissance, 2, 1)).toBeGreaterThan(10000);
    expect(classement(MEILLEUR, D.reconnaissance).at(-1)).toBe(0);
    // L'interaction : sans binôme ni heures supplémentaires, l'échelon ne retient rien d'utile.
    expect(classement(ATTENTISTE, D.reconnaissance).at(-1)).toBe(2);
    expect(classement(REFLEXE, D.reconnaissance)[0]).toBe(2);
  });

  it("D4 : confier l'après-midi au stagiaire est le meilleur en moyenne ; organiser la mi-cadence est le plus sûr", () => {
    const c = classement(MEILLEUR, D.arret);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.arret, 0, 1)).toBeGreaterThan(8000);
    expect(ecart(MEILLEUR, D.arret, 0, 3)).toBeGreaterThan(20000);
    // L'espérance et la robustesse s'opposent.
    expect(plusSur(MEILLEUR, D.arret)).toBe(2);
    // L'interaction : sans binôme lancé en semaine 1, il n'y a personne à qui confier l'après-midi.
    expect(classement(ATTENTISTE, D.arret)[0]).toBe(2);
    expect(ecart(ATTENTISTE, D.arret, 2, 0)).toBeGreaterThan(20000);
  });

  it("D5 : organiser les changements de format bat les samedis de rattrapage", () => {
    const c = classement(MEILLEUR, D.heures);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.heures, 1, 0)).toBeGreaterThan(5000);
    expect(c.at(-1)).toBe(0);
  });

  it("D6 : habiliter la relève vaut mieux que recruter dehors ou la mettre seule de nuit", () => {
    const c = classement(MEILLEUR, D.releve);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.releve, 0, 1)).toBeGreaterThan(5000);
    expect(ecart(MEILLEUR, D.releve, 0, 2)).toBeGreaterThan(5000);
  });

  it("transmettre pendant le creux bat nettement les heures sup et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(80000);
    expect(methode! - attentiste!).toBeGreaterThan(80000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni présente dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_POLYVALENCE, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["matrice", "arrets"],
      ["changements"],
      ["classification"],
      ["binomes"],
      ["compteurs"],
      ["printemps"],
    ],
    jours: JOURS,
    diagnostic: "dependance",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 117,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_POLYVALENCE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a répondu par les heures sup et le recrutement, propose de transmettre", () => {
    const p = partie(REFLEXE, { diagnostic: "effectif" });
    const c = EPISODE_POLYVALENCE.comportements(p, analyser(EPISODE_POLYVALENCE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[1]!.score).toBe(0);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_POLYVALENCE.axe(c).titre).toBe("Transmettre plutôt qu'acheter des heures");
  });

  it("à qui a décidé sans enquêter, propose de repérer qui tient quoi", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_POLYVALENCE.comportements(p, analyser(EPISODE_POLYVALENCE, p).trimestre);
    expect(EPISODE_POLYVALENCE.axe(c).titre).toBe("Repérer qui tient quoi");
  });

  it("calibre la prévision à six heures près ; oublier les arrêts ou le mi-cadence ne passe pas", () => {
    const t = simuler(MEILLEUR, 3);
    const calibrage = (prevision: number) =>
      EPISODE_POLYVALENCE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(117)).toBe(1);
    expect(calibrage(100)).toBe(0.6);
    // Toutes les heures découvertes comptées comme perdues : 187 heures.
    expect(calibrage(187)).toBe(0);
    // La mi-cadence seule, sans les arrêts : 94 heures.
    expect(calibrage(94)).toBe(0);
  });

  it("dit le résultat, et lit le tableau de bord", () => {
    const t = simuler(MEILLEUR, 5);
    expect(EPISODE_POLYVALENCE.bilan.titre(t)).toMatch(/conducteurs capables de régler/);
    expect(EPISODE_POLYVALENCE.bilan.tuiles(t)).toHaveLength(4);
    expect(EPISODE_POLYVALENCE.recap(t, 1, 2)).toHaveLength(3);
    expect(t.qualifiesFinal).toBeGreaterThan(4.5);
    expect(simuler(ATTENTISTE, 5).qualifiesFinal).toBeLessThanOrEqual(3);
    const l = EPISODE_POLYVALENCE.lire([], 1, 0, 4);
    for (const ind of EPISODE_POLYVALENCE.indicateurs) {
      expect(l[ind.cle], ind.cle).not.toBeUndefined();
    }
    expect(EPISODE_POLYVALENCE.lire([], 1, 0, 0).qualifies).toBe(3);
    expect(EPISODE_POLYVALENCE.reactions(D.plan, 2, 1)).toHaveLength(1);
    expect(EPISODE_POLYVALENCE.reactions(D.plan, 1, 1)).toBeNull();
  });
});
