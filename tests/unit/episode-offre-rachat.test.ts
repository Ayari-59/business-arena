import { describe, expect, it } from "vitest";
import {
  COUT_ATTENDU,
  D,
  DETTE_NETTE,
  EBE,
  IMPREVUS,
  KEROUVAL,
  OBJECTIF_VALEUR,
  OP,
  POINTS_FAIBLES,
  RETRADE,
  SCENARIOS,
  STRUCTURE,
  SURCOUT_SPOT_ANNUEL,
  TITRES_INDEPENDANTE,
  VE_COMPARABLES,
  VE_INDEPENDANTE,
  VE_PLAN_REALISTE,
  complementEBEAttendu,
  derouler,
  hasard,
  mediane,
  simuler,
} from "../../src/engine/episodes/offre-de-rachat";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/offre-de-rachat";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_OFFRE_RACHAT, mE } from "../../src/pedagogy/episodes/offre-de-rachat";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'offre de rachat » enseigne qu'une offre sur l'entreprise se
 * juge contre trois repères : la valeur de l'entreprise indépendante (plan
 * réaliste, actualisé, pondéré par les scénarios du marché laitier), ce que
 * d'autres acquéreurs paieraient (la mise en concurrence discrète), et ses
 * conditions (prix ferme ou complément, garantie, engagements envers les
 * producteurs). Accepter l'offre telle quelle et la refuser par principe ont
 * chacun un coût, et il faut rouvrir le protocole quand la menace des
 * producteurs apparaît. Ces tests verrouillent les classements qui le disent,
 * et recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [2, 1, 1, 2, 2, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [1, 3, 3, 0, 0, 0];
const JOURS = 2;
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
/** Ce que vaut une option de plus qu'une autre, en moyenne sur trente tirages. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_OFFRE_RACHAT.contexte(
    EPISODE_OFFRE_RACHAT.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const fr = (v: number, d = 1) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

describe("le modèle de l'offre de rachat", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(ATTENTISTE, 12).scenario);
    expect(derouler(MEILLEUR, 12).cout).toBe(derouler(REFLEXE, 12).cout);
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

  it("le marché laitier suit à peu près les probabilités de la note de conjoncture", () => {
    const part = (s: string) =>
      GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length / GRAINES_DU_BILAN.length;
    expect(part("porteur")).toBeGreaterThan(SCENARIOS.porteur.chance - 0.2);
    expect(part("porteur")).toBeLessThan(SCENARIOS.porteur.chance + 0.2);
    expect(part("degrade")).toBeGreaterThan(0);
    expect(part("moyen")).toBeGreaterThan(0.2);
  });

  it("la coopérative fait une offre plus souvent quand le dossier est préparé, et jamais sous exclusivité", () => {
    const offres = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => derouler(c, g).coop !== null).length;
    expect(offres(MEILLEUR)).toBeGreaterThan(offres([2, 2, 1, 2, 2, 1]));
    expect(offres([0, 1, 1, 2, 2, 1])).toBe(0);
    for (const g of GRAINES_DU_BILAN) {
      const c = derouler(MEILLEUR, g).coop;
      if (c !== null) {
        expect(c).toBeGreaterThanOrEqual(KEROUVAL.min);
        expect(c).toBeLessThanOrEqual(KEROUVAL.max);
      }
    }
  });

  it("garder la laiterie vaut en moyenne sa valeur indépendante ; la bonne méthode dépasse l'objectif", () => {
    const garder = attendu(ATTENTISTE);
    expect(Math.abs(garder - TITRES_INDEPENDANTE)).toBeLessThan(3e6);
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(OBJECTIF_VALEUR);
    expect(bon).toBeLessThan(95e6);
    expect(attendu(REFLEXE)).toBeLessThan(TITRES_INDEPENDANTE);
    expect(attendu(REFLEXE)).toBeGreaterThan(60e6);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la valeur au multiple des comparables, que la semaine 1 demande, est la médiane fois l'EBE", () => {
    const texte = source(0, "comparables", []);
    const multiples = [7.4, 7.8, 8.1, 8.5, 10.9];
    for (const m of multiples) expect(texte).toContain(fr(m));
    expect(texte).toContain(`EBE de la laiterie au dernier exercice : ${fr(EBE / 1e6)} M€`);
    expect(mediane(multiples)).toBe(8.1);
    expect(VE_COMPARABLES / 1e6).toBeCloseTo(105.3, 6);
    expect(EPISODE_OFFRE_RACHAT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(105.3, 6);
  });

  it("le plan réaliste donne la valeur de chaque scénario, et la valeur indépendante en découle", () => {
    const texte = source(0, "plan", []);
    for (const s of Object.values(SCENARIOS)) expect(texte).toContain(`${s.ve / 1e6} M€`);
    expect(texte).toContain(`${DETTE_NETTE / 1e6} M€ de dette financière nette`);
    expect(VE_PLAN_REALISTE / 1e6).toBeCloseTo(0.3 * 112 + 0.45 * 97 + 0.25 * 78, 6);
    expect(COUT_ATTENDU / 1e6).toBeCloseTo(0.5 * 3.5 + 0.4 * 2.5, 6);
    expect(VE_INDEPENDANTE / 1e6).toBeCloseTo(94, 6);
    expect(TITRES_INDEPENDANTE / 1e6).toBeCloseTo(78, 6);
    const points = source(1, "points-faibles", [2]);
    expect(points).toContain(`${fr(POINTS_FAIBLES.ligne.cout / 1e6)} M€`);
    expect(points).toContain(`${fr(POINTS_FAIBLES.station.cout / 1e6)} M€`);
  });

  it("la baisse demandée après l'audit vaut le multiple du coût réel que la source affiche", () => {
    const g = GRAINES_DU_BILAN.find((x) => {
      const dr = derouler([2, 2, 1, 0, 2, 1], x);
      return dr.retenue?.qui === "nordal" && dr.cout > 0;
    })!;
    const dr = derouler([2, 2, 1, 0, 2, 1], g);
    expect(dr.demande).toBeCloseTo(RETRADE.nordal * dr.cout, 6);
    const texte = source(3, "chiffrage", [2, 2, 1], g);
    expect(texte).toContain(`Coût réel des points trouvés : ${mE(dr.cout)}`);
    expect(texte).toContain(`en vaut ${fr(RETRADE.nordal)} fois`);
  });

  it("le complément sur l'EBE vaut moins de la moitié du prix ferme qu'il remplace", () => {
    const aLaMain =
      0.3 * 6 * ((14.8 - 0.3 - 13) / 1.6) + 0.45 * 6 * ((13.4 - 0.3 - 13) / 1.6) + 0.25 * 0;
    expect(complementEBEAttendu("nordal") / 1e6).toBeCloseTo(aLaMain, 6);
    expect(complementEBEAttendu("nordal")).toBeLessThan(STRUCTURE.abandonEBE / 2);
    const g = GRAINES_DU_BILAN.find((x) => derouler(MEILLEUR, x).finale?.qui === "nordal")!;
    expect(source(4, "complement", MEILLEUR.slice(0, 4), g)).toContain(
      `vaut ${mE(complementEBEAttendu("nordal"))} en espérance, pour 4 M€ de prix ferme abandonnés`,
    );
  });

  it("le départ des producteurs coûte le lait spot et la clause que la source affiche", () => {
    expect(SURCOUT_SPOT_ANNUEL).toBeCloseTo(OP.menace * 1e6 * (OP.surcoutSpot / 1000), 6);
    const g = GRAINES_DU_BILAN.find((x) => derouler(MEILLEUR, x).finale?.qui === "nordal")!;
    const texte = source(5, "vote", MEILLEUR.slice(0, 5), g);
    expect(texte).toContain(`coûterait ${mE(SURCOUT_SPOT_ANNUEL)} par an`);
    expect(texte).toContain(`le prix baisse de ${OP.clause / 1e6} M€`);
    expect(texte).toContain(`${fr(OP.garanties / 1e6)} M€ de prix en moins`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : établir la valeur et sonder un second acquéreur bat nettement accepter tel quel et refuser par principe", () => {
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(2);
    expect(ecart(MEILLEUR, D.reponse, 2, 0)).toBeGreaterThan(5e6);
    expect(ecart(MEILLEUR, D.reponse, 2, 1)).toBeGreaterThan(4e6);
    // Refuser par principe expose la famille au marché laitier : le pire des pires cas.
    const r = rejeu(MEILLEUR, D.reponse);
    expect(r[1]!.p10).toBe(Math.min(...r.map((x) => x.p10)));
  });

  it("D2 : l'audit vendeur coûte, et il paie ; tout ouvrir à un concurrent, non", () => {
    expect(classement(MEILLEUR, D.audit)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.audit)).toBe(1);
    expect(ecart(MEILLEUR, D.audit, 1, 0)).toBeGreaterThan(8e5);
    expect(ecart(MEILLEUR, D.audit, 1, 2)).toBeGreaterThan(5e5);
  });

  it("D3 : le second tour bat l'acceptation immédiate, mais ne vaut rien sous exclusivité", () => {
    expect(classement(MEILLEUR, D.concurrence)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.concurrence, 1, 0)).toBeGreaterThan(1.5e6);
    expect(Math.abs(ecart([0, 1, 1, 2, 2, 1], D.concurrence, 1, 0))).toBeLessThan(1e5);
  });

  it("D4 : ne concéder que le coût chiffré bat accepter la baisse demandée et refuser toute baisse", () => {
    expect(classement(MEILLEUR, D.retrade)[0]).toBe(2);
    expect(ecart(MEILLEUR, D.retrade, 2, 0)).toBeGreaterThan(5e5);
    expect(ecart(MEILLEUR, D.retrade, 2, 1)).toBeGreaterThan(1e6);
  });

  it("D5 : le complément sur les volumes est le meilleur en moyenne, le prix ferme le plus sûr, le prix affiché le pire", () => {
    const c = classement(MEILLEUR, D.structure);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.structure)).toBe(1);
    expect(ecart(MEILLEUR, D.structure, 2, 0)).toBeGreaterThan(2e6);
  });

  it("D6 : rouvrir le protocole pour écrire les garanties bat signer tel quel ; et rend le complément sur les volumes plus sûr", () => {
    expect(classement(MEILLEUR, D.producteurs)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.producteurs, 1, 0)).toBeGreaterThan(2e6);
    expect(ecart(MEILLEUR, D.producteurs, 1, 3)).toBeGreaterThan(5e6);
    // Le complément sur les volumes vaut plus quand les producteurs renouvellent.
    const avec = ecart(MEILLEUR, D.structure, 2, 1);
    const sans = ecart([2, 1, 1, 2, 2, 0], D.structure, 2, 1);
    expect(avec).toBeGreaterThan(sans + 4e5);
  });

  it("juger l'offre contre ses trois repères bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(8e6);
    expect(bonne! - attentiste!).toBeGreaterThan(4e6);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_OFFRE_RACHAT, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}, option ${o}`).toBeLessThan(SEUIL_QUALITE);
      expect(m.bonne && m.choisie === option).toBe(false);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["comparables", "plan"],
      ["points-faibles"],
      ["plafond-nordal"],
      ["chiffrage"],
      ["complement"],
      ["vote"],
    ],
    jours: JOURS,
    diagnostic: "trois-reperes",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 105,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_OFFRE_RACHAT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne ni signer dans l'urgence ni refuser par principe", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_OFFRE_RACHAT.comportements(p, analyser(EPISODE_OFFRE_RACHAT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_OFFRE_RACHAT.axe(c).titre).toBe(
      "Ni signer dans l'urgence, ni refuser par principe",
    );
  });

  it("à qui a décidé sans enquêter, propose d'établir la valeur avant de répondre", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_OFFRE_RACHAT.comportements(p, analyser(EPISODE_OFFRE_RACHAT, p).trimestre);
    expect(EPISODE_OFFRE_RACHAT.axe(c).titre).toBe("Établir la valeur avant de répondre");
  });

  it("juge la valeur calculée en semaine 1 : la médiane, la moyenne sans le cas hors norme, l'offre, la moyenne brute", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_OFFRE_RACHAT.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(105.3)).toBe(1);
    // La moyenne des quatre multiples ordinaires : 7,95 × 13 = 103,35 M€.
    expect(score(103.35)).toBe(1);
    expect(score(109)).toBe(0.6);
    // L'offre de Nordal n'est pas le marché ; la moyenne avec le cas hors norme non plus.
    expect(score(97.5)).toBe(0);
    expect(score(111)).toBe(0);
  });

  it("dit le résultat en valeur pour les titres, et ce qu'est devenue la laiterie", () => {
    expect(EPISODE_OFFRE_RACHAT.bilan.titre(simuler(ATTENTISTE, 4))).toMatch(/reste indépendante/);
    expect(EPISODE_OFFRE_RACHAT.bilan.titre(simuler(REFLEXE, 4))).toMatch(/vendue à Nordal/);
  });
});
