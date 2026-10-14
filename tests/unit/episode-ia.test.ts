import { describe, expect, it } from "vitest";
import {
  AVANT_VENTE,
  BAISSE_REGIE_SYNTHESES,
  CONCESSION,
  CONSULTANTS,
  D,
  GAIN_POSSIBLE,
  HONORAIRES_PREVUS,
  IMPREVUS,
  JOURS_DU_TRIMESTRE,
  JOURS_FACTURES,
  ORVANNE,
  PART_REGIE,
  PIPELINE,
  RENOUVELLEMENTS,
  RENOUVELLEMENTS_TOTAL,
  TACHES,
  TJM,
  TRANSFORMATION,
  TYPES_ORVANNE,
  acceptations,
  gainContractuel,
  gainOrvanne,
  hasard,
  perteSiDepart,
  simuler,
} from "../../src/engine/episodes/assistant-ia";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/assistant-ia";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_IA, PREVISION_EN_KE } from "../../src/pedagogy/episodes/assistant-ia";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'assistant d'IA qui change le métier » enseigne qu'un outil
 * qui fait gagner du temps change le modèle économique d'un cabinet : en
 * régie, le temps gagné va au client ; au forfait, il devient de la marge ;
 * l'usage sans règle se paie en incidents tirés au hasard ; l'adoption
 * s'apprend entre pairs. Ces tests verrouillent les classements qui le
 * disent, et recalculent depuis le modèle les chiffres que les sources
 * affichent.
 */

const MEILLEUR: readonly number[] = REFERENCES[0].chemin;
const REFLEXE: readonly number[] = REFERENCES[1].chemin;
const ATTENTISTE: readonly number[] = REFERENCES[2].chemin;
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
const fr = (v: number, d = 0) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });
const contexte = (etape: number, decisions: readonly number[], graine = 3): Contexte => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  return EPISODE_IA.contexte(EPISODE_IA.lire(decisions, graine, 0, semaine), decisions);
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string"
    ? s.resultat
    : s.resultat(contexte(etape, decisions, graine));
};

describe("le modèle d'Atlas Conseil", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).orvanne.type).toBe(simuler(REFLEXE, 12).orvanne.type);
    expect(acceptations(12)).toEqual(acceptations(12));
    // Ce que les décisions de la semaine 1 changent n'atteint pas le tirage des imprévus.
    expect(EPISODE_IA.imprevus(5)).toEqual(EPISODE_IA.imprevus(5));
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

  it("les incidents tombent au hasard, plus souvent quand l'usage est sans règle ou caché", () => {
    const incidents = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).incidents > 0).length;
    // Interdire cache l'usage ; ouvrir sans règle l'expose ; encadrer le réduit.
    expect(incidents([0, ...MEILLEUR.slice(1)])).toBeGreaterThan(incidents(MEILLEUR) + 3);
    expect(incidents([1, ...MEILLEUR.slice(1)])).toBeGreaterThan(incidents(MEILLEUR) + 3);
    expect(incidents(MEILLEUR)).toBeGreaterThan(0);
    // Facturer les jours prévus finit parfois par se voir, pas toujours.
    const vus = GRAINES_DU_BILAN.filter(
      (g) => simuler([2, 1, 2, 1, 2, 1], g).fraude !== null,
    ).length;
    expect(vus).toBeGreaterThan(4);
    expect(vus).toBeLessThan(20);
  });

  it("en régie, le temps gagné ne se facture plus ; sans rien ouvrir, rien ne se gagne", () => {
    const t = simuler(MEILLEUR, 4);
    expect(t.regiePerdue).toBeCloseTo(t.joursGagnes * PART_REGIE * TJM, 6);
    expect(simuler(ATTENTISTE, 4).joursGagnes).toBe(0);
    // Facturer les jours prévus fait disparaître la perte de régie tant que personne ne regarde.
    const cache = GRAINES_DU_BILAN.find((g) => simuler([2, 1, 2, 1, 2, 1], g).fraude === null)!;
    expect(simuler([2, 1, 2, 1, 2, 1], cache).regiePerdue).toBeLessThan(
      simuler(MEILLEUR, cache).regiePerdue / 4,
    );
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la facturation du trimestre et la prévision de la semaine 1", () => {
    expect(JOURS_DU_TRIMESTRE).toBe(60);
    expect(JOURS_FACTURES).toBe(CONSULTANTS * 60 * 0.75);
    expect(JOURS_FACTURES).toBe(8550);
    const tempora = source(0, "tempora", []);
    expect(tempora).toContain(`${fr(8550)} jours facturables`);
    expect(tempora).toContain(`${fr(HONORAIRES_PREVUS / 1e6, 1)} M€`);
    expect(tempora).toContain(`${fr(PART_REGIE * 100)} %`);
    // 8 550 jours × 40 % en régie × 12 % de synthèses × 50 % de gain × 900 €.
    const aLaMain = 8550 * 0.4 * 0.12 * 0.5 * 900;
    expect(BAISSE_REGIE_SYNTHESES).toBeCloseTo(aLaMain, 6);
    expect(PREVISION_EN_KE).toBeCloseTo(184.68, 6);
    expect(EPISODE_IA.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(184.68, 6);
  });

  it("le gain possible, tâche par tâche, est celui que Teodora mesure", () => {
    expect(GAIN_POSSIBLE).toBeCloseTo(0.12 * 0.5 + 0.18 * 0.2 + 0.2 * 0.25 + 0.5 * 0.02, 9);
    const mesure = source(0, "mesure", []);
    expect(mesure).toContain(`${fr(GAIN_POSSIBLE * 100, 1)} %`);
    expect(mesure).toContain("15,6 %");
    for (const t of TACHES) expect(mesure).toContain(`${fr(t.part * 100)} %`);
  });

  it("les douze renouvellements, leur coût de préparation, et le gain mesuré", () => {
    expect(RENOUVELLEMENTS).toHaveLength(12);
    expect(RENOUVELLEMENTS_TOTAL).toBe(2_200_000);
    const texte = source(1, "renouvellements", [2]);
    expect(texte).toContain("2,2 M€");
    expect(texte).toContain(`${fr(AVANT_VENTE)} €`);
    expect(ETAPES[1]!.options[2]!.d).toContain(`${fr((AVANT_VENTE * 12) / 1000)} k€`);
    // Le gain d'un utilisateur affiché est celui du tableau de bord.
    const l = EPISODE_IA.lire([2], 3, 0, 2);
    expect(texte).toContain(`${fr(l.gain! * 100, 1)} %`);
  });

  it("le gain promis à Orvanne et la valeur des propositions du semestre", () => {
    const ctx = contexte(4, MEILLEUR.slice(0, 4));
    const g = ctx.gainContratBrut as number;
    const t = simuler(MEILLEUR, 3);
    expect(g).toBeCloseTo(gainContractuel(MEILLEUR, 8, t.semaines[8]!.adoption), 9);
    expect(gainOrvanne(MEILLEUR, 3, t.semaines[8]!.adoption)).toBeCloseTo(
      g * TYPES_ORVANNE[hasard(3).typeOrvanne]!.facteur,
      9,
    );
    expect(source(4, "mission", MEILLEUR.slice(0, 4))).toContain(`${fr(g * 100, 1)} %`);
    const g10 = contexte(5, MEILLEUR.slice(0, 5)).gainContratBrut as number;
    const valeur = PIPELINE * TRANSFORMATION * (g10 - CONCESSION);
    expect(source(5, "propositions", MEILLEUR.slice(0, 5))).toContain(
      `${fr(Math.round(valeur / 1000))} k€`,
    );
    // Partir coûte bien plus que les 12 % demandés : sept jours sur dix seulement se replacent.
    expect(perteSiDepart(0.08)).toBeCloseTo(600_000 * 0.92 * (1 - (0.7 * 900) / 950), 6);
    expect(perteSiDepart(0.08)).toBeGreaterThan(ORVANNE.baisse * ORVANNE.ca * 2.5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : ouvrir avec trois règles bat l'interdiction et l'ouverture sans règle", () => {
    const r = rejeu(MEILLEUR, D.ouverture);
    expect(classement(MEILLEUR, D.ouverture)[0]).toBe(2);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
  });

  it("D2 : le forfait par livrable vaut le plus en moyenne, mais reconduire la régie est plus sûr", () => {
    const r = rejeu(MEILLEUR, D.regie);
    expect(classement(MEILLEUR, D.regie)).toEqual([2, 0, 1]);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(plusSure(MEILLEUR, D.regie)).toBe(0);
    // Facturer les jours prévus est la pire option en moyenne, et de loin dans les mauvais tirages.
    expect(r[1]!.p10).toBeLessThan(r[0]!.p10 - 100000);
  });

  it("D2 : le forfait ne vaut que si le cabinet gagne vraiment du temps", () => {
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.regie);
      return x[2]!.attendu - x[0]!.attendu;
    };
    // Outil interdit jusqu'en juin : le forfait ne rapporte plus rien.
    expect(ecart([0, 2, 2, 1, 2, 1])).toBeLessThan(ecart(MEILLEUR) - 40000);
    expect(classement(REFLEXE, D.regie)[0]).toBe(0);
  });

  it("D3 : des référents et des cas partagés battent l'objectif imposé et le module en ligne ; pas quand l'outil est interdit", () => {
    const r = rejeu(MEILLEUR, D.adoption);
    expect(classement(MEILLEUR, D.adoption)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    // Sous l'interdiction, les référents coûtent sans servir.
    const sousInterdiction = rejeu(ATTENTISTE, D.adoption);
    expect(sousInterdiction[2]!.attendu).toBeLessThan(sousInterdiction[3]!.attendu);
  });

  it("D4 : au vu des relectures, recentrer les usages bat garder le cap, alléger la relecture ou suspendre", () => {
    const r = rejeu(MEILLEUR, D.usages);
    expect(classement(MEILLEUR, D.usages)[0]).toBe(1);
    for (const o of [0, 2, 3]) expect(r[1]!.attendu - r[o]!.attendu).toBeGreaterThan(40000);
  });

  it("D5 : mesurer avant de proposer bat céder, refuser, ou proposer le forfait sans mesure", () => {
    const r = rejeu(MEILLEUR, D.orvanne);
    expect(classement(MEILLEUR, D.orvanne)[0]).toBe(2);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(25000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(60000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(60000);
  });

  it("D6 : la charte d'une page et le forfait par défaut battent la politique fermée et la généralisation sans relecture", () => {
    const r = rejeu(MEILLEUR, D.comite);
    expect(classement(MEILLEUR, D.comite)[0]).toBe(1);
    for (const o of [0, 2, 3]) expect(r[1]!.attendu - r[o]!.attendu).toBeGreaterThan(40000);
  });

  it("la bonne méthode bat nettement tout ouvrir et tout interdire", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(150000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
    expect(bonne!).toBeGreaterThan(700000);
    expect(attentiste!).toBeGreaterThan(400000);
    expect(reflexe!).toBeGreaterThan(400000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_IA, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => MEILLEUR[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tempora", "mesure"],
      ["renouvellements"],
      ["adoption"],
      ["relectures"],
      ["mission"],
      ["propositions"],
    ],
    jours: JOURS,
    diagnostic: "modele",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 185,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_IA, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout ouvert sans règle, propose de ne ni interdire ni ouvrir sans règle", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_IA.comportements(p, analyser(EPISODE_IA, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_IA.axe(c).titre).toBe("Ni interdire, ni ouvrir sans règle");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer à qui va le temps gagné", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_IA.comportements(p, analyser(EPISODE_IA, p).trimestre);
    expect(EPISODE_IA.axe(c).titre).toBe("Chiffrer à qui va le temps gagné");
  });

  it("juge la prévision : juste, proche, ou faute d'avoir pris la régie ou le gain", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_IA.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(185)).toBe(1);
    expect(score(196)).toBe(0.6);
    // Sans le « deux fois plus vite » : 369 k€ ; sur tous les jours, régie et forfait : 462 k€.
    expect(score(369)).toBe(0);
    expect(score(462)).toBe(0);
  });

  it("le diagnostic : juste, proche, faux", () => {
    const score = (diagnostic: string) => {
      const p = partie(MEILLEUR, { diagnostic });
      return EPISODE_IA.comportements(p, simuler(MEILLEUR, 11, JOURS))[1]!.score;
    };
    expect(score("modele")).toBe(1);
    expect(score("usages")).toBe(0.6);
    expect(score("retard")).toBe(0);
    expect(score("fiabilite")).toBe(0);
  });

  it("lit un tableau de bord complet, et une réponse d'Orvanne tirée au hasard", () => {
    const l = EPISODE_IA.lire([2, 2], 3, 0, 4);
    for (const ind of EPISODE_IA.indicateurs) expect(l[ind.cle]).toBeTypeOf("number");
    const reponses = new Set(
      GRAINES_DU_BILAN.map((g) => EPISODE_IA.reactions(D.orvanne, 1, g)![0]!.texte),
    );
    expect(reponses.size).toBe(2);
    expect(EPISODE_IA.reactions(D.orvanne, 0, 3)).toBeNull();
    for (const g of GRAINES_DU_BILAN) {
      for (const s of simuler(MEILLEUR, g).semaines.slice(1)) {
        expect(s!.gagnes).toBeLessThanOrEqual(EPISODE_IA.courbe.graduations.at(-1)!);
      }
    }
  });
});
