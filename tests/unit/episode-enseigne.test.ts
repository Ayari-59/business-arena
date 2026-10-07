import { describe, expect, it } from "vitest";
import {
  AFFAIRES,
  ANNUEL_BAISSE,
  ANNUEL_PP,
  CA_AFFAIRES,
  CA_BOOKALIA_CARACTERE,
  CA_CARACTERE,
  CA_HEBERGEMENT,
  CHAMBRES,
  COMMISSION,
  COMMISSIONS_AFFAIRES,
  D,
  DIRECTE_DEPART,
  ECONOMIE_AFFAIRES,
  EFFETS,
  FRAIS,
  HOTELS,
  IMPREVUS,
  PERTE_CONCURRENT,
  RAPATRIE_ATTENDU,
  REDEVANCES,
  SCENARIOS,
  TRAVAUX,
  annuelDirect,
  chancesReponse,
  habitues,
  hasard,
  hotel,
  netAnnuel,
  reponse,
  simuler,
} from "../../src/engine/episodes/enseigne-a-la-porte";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/enseigne-a-la-porte";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ENSEIGNE } from "../../src/pedagogy/episodes/enseigne-a-la-porte";
import { kE } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'enseigne qui frappe à la porte » enseigne trois choses : une
 * marque hôtelière vaut ce qu'elle apporte à des clients qui ne vous
 * connaissent pas, beaucoup dans les hôtels d'affaires, presque rien dans les
 * maisons de caractère, qui y paient des redevances sur leurs propres
 * habitués ; leur levier est la clientèle directe ; et un contrat de
 * franchise lie pour des années, d'où l'essai au bon moment de la saison, la
 * révision du périmètre sur ses chiffres, et la clause de sortie. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [2, 1, 1, 1, 1, 2];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 3, 0, 0, 3];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, tel que la joueuse le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_ENSEIGNE.contexte(
    EPISODE_ENSEIGNE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const somme = (xs: readonly number[]) => xs.reduce((a, x) => a + x, 0);

describe("le modèle de la négociation avec Orméa", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).adoption).toBe(simuler(ATTENTISTE, 12).adoption);
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

  it("la marque connaît chacun des trois effets, à peu près aux fréquences dites", () => {
    const part = (id: string) =>
      GRAINES_DU_BILAN.filter((g) => hasard(g).scenario.id === id).length / GRAINES_DU_BILAN.length;
    for (const s of SCENARIOS) {
      expect(part(s.id), s.id).toBeGreaterThan(s.chance - 0.2);
      expect(part(s.id), s.id).toBeLessThan(s.chance + 0.2);
    }
  });

  it("la réponse d'Orméa dépend des choix du groupe : ce qu'on lui a promis, l'essai, les exigences", () => {
    const base = chancesReponse(MEILLEUR, "moyen", "affaires");
    expect(base.accepte).toBeGreaterThan(0.5);
    // Promettre les huit, puis revenir à deux : Orméa se sent trompée.
    expect(chancesReponse([0, 1, 1, 1, 1, 2], "moyen", "affaires").accepte).toBeLessThan(
      base.accepte - 0.2,
    );
    // Tout renégocier la fait refuser bien plus souvent.
    expect(chancesReponse([2, 1, 1, 3, 1, 2], "moyen", "affaires").refuse).toBeGreaterThan(
      base.refuse + 0.15,
    );
    // Un essai à Megève lui donne envie des maisons de caractère.
    expect(chancesReponse([2, 2, 1, 1, 1, 2], "moyen", "affaires").contre).toBeGreaterThan(
      base.contre + 0.15,
    );
    expect(chancesReponse(REFLEXE, "moyen", "huit").accepte).toBe(1);
    const acceptees = GRAINES_DU_BILAN.filter((g) => reponse(MEILLEUR, g) === "accepte").length;
    expect(acceptees).toBeGreaterThan(8);
  });

  it("la valeur part de zéro, et celle de la semaine 13 est l'objectif", () => {
    expect(EPISODE_ENSEIGNE.lire([], 3, 0, 0).valeur).toBe(0);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });

  it("les habitués de Megève ne sont délogés que par un essai à Megève, environ une fois sur deux", () => {
    const delogees = GRAINES_DU_BILAN.filter((g) => habitues([2, 2, 1, 1, 1, 2], g)).length;
    expect(delogees).toBeGreaterThan(8);
    expect(delogees).toBeLessThan(22);
    expect(GRAINES_DU_BILAN.some((g) => habitues(MEILLEUR, g))).toBe(false);
  });

  it("les valeurs restent réalistes : la bonne méthode crée de la valeur, ne rien faire en coûte", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(600000);
    expect(bon).toBeLessThan(1500000);
    const rien = attendu(ATTENTISTE);
    expect(rien).toBeLessThan(-150000);
    expect(rien).toBeGreaterThan(-600000);
    expect(attendu(REFLEXE)).toBeLessThan(rien);
    expect(attendu(REFLEXE)).toBeGreaterThan(-7000000);
    for (const g of GRAINES_DU_BILAN) {
      for (const s of simuler(MEILLEUR, g, JOURS).semaines.slice(1)) {
        expect(s!.plateformes).toBeGreaterThan(0.2);
        expect(s!.plateformes).toBeLessThan(0.35);
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le chiffre et les canaux de chaque hôtel sont ceux que la source affiche", () => {
    expect(CA_HEBERGEMENT).toBe(24000000);
    expect(CHAMBRES).toBe(498);
    expect(COMMISSION).toBeCloseTo(0.17, 9);
    expect(COMMISSIONS_AFFAIRES).toBeCloseTo(392360, 6);
    expect(Math.round(DIRECTE_DEPART * 100)).toBe(65);
    const texte = source(0, "canaux", []);
    expect(texte).toContain(`Ils paient ${kE(COMMISSIONS_AFFAIRES)} de commissions par an`);
    expect(texte).toContain("Annemasse 3,4 M€, dont 42 %");
    expect(texte).toContain("Chambéry-Gare 2,2 M€, dont 40 %");
    expect(texte).toContain(`dont ${Math.round(DIRECTE_DEPART * 100)} % réservés en direct`);
    expect(CA_CARACTERE).toBe(12800000);
    expect(texte).toContain("12,8 M€ à eux trois");
  });

  it("l'économie de commissions, que la semaine 1 demande, se calcule depuis les références", () => {
    const aLaMain = (0.3 * 0.1 + 0.45 * 0.2 + 0.25 * 0.24) * 5600000 * 0.17;
    expect(RAPATRIE_ATTENDU).toBeCloseTo(0.18, 9);
    expect(CA_AFFAIRES).toBe(5600000);
    expect(ECONOMIE_AFFAIRES).toBeCloseTo(aLaMain, 6);
    expect(EPISODE_ENSEIGNE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(171.36, 6);
    const texte = source(0, "references", []);
    expect(texte).toContain("n'ont rapatrié que 10 points");
    expect(texte).toContain("rapatrié 20 points et gagné 12 %");
    expect(texte).toContain("24 points et 17 %");
    expect(EFFETS.affaires.hausse).toEqual({ faible: -0.03, moyen: 0.12, fort: 0.17 });
    expect(FRAIS).toBeCloseTo(REDEVANCES.marque + REDEVANCES.marketing, 9);
    // L'argument du directeur financier : un point de redevance sur 24 M€.
    expect(ETAPES[0]!.messages({})[2]!.texte).toContain(
      `${kE((REDEVANCES.marque - REDEVANCES.marqueGroupe) * CA_HEBERGEMENT)} par an`,
    );
  });

  it("le programme de clientèle directe, celui de Bookalia et la baisse de prix", () => {
    const direct = source(2, "direct", [2, 1]);
    expect(direct).toContain(`${kE(annuelDirect(0.065))} par an, pour 90 k€`);
    expect(0.01 * CA_CARACTERE * 0.12).toBeCloseTo(15360, 6);
    expect(direct).toContain("soit 15,4 k€ par an");
    const pp = source(2, "bookalia", [2, 1]);
    expect(Math.round(CA_BOOKALIA_CARACTERE / 100000) / 10).toBe(2.1);
    expect(pp).toContain(`: ${kE(0.03 * CA_BOOKALIA_CARACTERE)}.`);
    expect(pp).toContain(`Au total, ${kE(-ANNUEL_PP)} de moins par an`);
    const site = source(2, "site", [2, 1]);
    expect(site).toContain(`coûte ${kE(0.05 * 0.25 * CA_CARACTERE)} par an`);
    expect(site).toContain(`${kE(-ANNUEL_BAISSE)} de moins par an`);
  });

  it("le contrat : les travaux imposés et l'indemnité de sortie", () => {
    const texte = source(3, "contrat", [2, 1, 1]);
    const chambres = somme(AFFAIRES.map((id) => hotel(id).chambres));
    expect(texte).toContain(`${kE(chambres * TRAVAUX.affaires)} pour Annemasse et Chambéry`);
    // Trois ans de redevances, en espérance, pour les deux hôtels d'affaires.
    const redevances = somme(
      AFFAIRES.map((id) =>
        somme(SCENARIOS.map((s) => s.chance * netAnnuel(hotel(id), s.id, FRAIS).redevances)),
      ),
    );
    expect(Math.round((3 * redevances) / 100000) / 10).toBe(1.3);
    expect(texte).toContain("environ 1,3 M€");
  });

  it("les chiffres de l'essai sont ceux du hasard du trimestre", () => {
    const g = GRAINES_DU_BILAN.find((x) => hasard(x).scenario.id === "moyen")!;
    const texte = source(4, "essai", [2, 1, 1, 1], g);
    const aff = AFFAIRES.map((id) => netAnnuel(hotel(id), "moyen", FRAIS));
    expect(texte).toContain("rapatrié 20 points de chiffre");
    const [eco, red, net] = (["economie", "redevances", "net"] as const).map((k) =>
      somme(aff.map((x) => x[k])),
    );
    expect(texte).toContain(`${kE(eco!)} de commissions économisées, ${kE(red!)} de redevances`);
    expect(Math.round(eco! / 1000)).toBe(190);
    expect(texte).toContain(`: +${kE(net!)} par an`);
    // Sans essai, aucun chiffre.
    expect(source(4, "essai", [2, 0, 1, 1], g)).toContain("Aucun chiffre");
  });

  it("ce que l'Arcadelle coûterait à Annemasse", () => {
    expect(PERTE_CONCURRENT).toBeCloseTo(3400000 * 0.05 * (1 - 0.16), 6);
    expect(source(5, "arcadelle", [2, 1, 1, 1, 1])).toContain(
      `${kE(PERTE_CONCURRENT)} une fois le coût des nuitées déduit`,
    );
    expect(HOTELS.filter((h) => h.type === "affaires").map((h) => h.id)).toEqual([
      "chambery",
      "annemasse",
    ]);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : chiffrer hôtel par hôtel bat tout affilier et tout refuser", () => {
    expect(classement(MEILLEUR, D.ligne)[0]).toBe(2);
    expect(classement(MEILLEUR, D.ligne).at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.ligne, 2, 0)).toBeGreaterThan(80000);
    expect(ecart(MEILLEUR, D.ligne, 2, 1)).toBeGreaterThan(50000);
  });

  it("D2 : l'essai sur les hôtels d'affaires bat l'absence d'essai et l'essai sur les maisons", () => {
    expect(classement(MEILLEUR, D.essai)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.essai, 1, 0)).toBeGreaterThan(120000);
    expect(ecart(MEILLEUR, D.essai, 1, 2)).toBeGreaterThan(150000);
    expect(plusSure(MEILLEUR, D.essai)).toBe(1);
  });

  it("D3 : la clientèle directe bat le programme de Bookalia et la baisse de prix", () => {
    expect(classement(MEILLEUR, D.caractere)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.caractere, 1, 0)).toBeGreaterThan(200000);
    expect(ecart(MEILLEUR, D.caractere, 1, 3)).toBeGreaterThan(150000);
    expect(classement(MEILLEUR, D.caractere).at(-1)).toBe(2);
  });

  it("D4 : la clause de sortie et le plafond de travaux battent le contrat type, d'autant plus sans essai", () => {
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.contrat, 1, 0)).toBeGreaterThan(150000);
    // Sans essai, signer le contrat type, c'est s'engager sans savoir ni pouvoir sortir.
    expect(ecart([2, 0, 1, 1, 1, 2], D.contrat, 1, 0)).toBeGreaterThan(
      ecart(MEILLEUR, D.contrat, 1, 0) + 50000,
    );
  });

  it("D5 : réviser le périmètre sur l'essai bat tenir la ligne, et ne vaut que si l'on a testé", () => {
    expect(classement(MEILLEUR, D.perimetre)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.perimetre, 1, 0)).toBeGreaterThan(100000);
    // Sans essai, il n'y a rien sur quoi réviser.
    expect(Math.abs(ecart([2, 0, 1, 1, 1, 2], D.perimetre, 1, 0))).toBeLessThan(1);
    // Après avoir annoncé les huit, tenir la ligne est une catastrophe.
    expect(ecart([0, 1, 1, 1, 1, 2], D.perimetre, 1, 0)).toBeGreaterThan(1000000);
  });

  it("D6 : tenir est le meilleur en moyenne, la contrepartie le plus sûr, céder et renoncer les pires", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(2);
    expect(plusSure(MEILLEUR, D.reponse)).toBe(1);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10 + 30000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(250000);
    expect(classement(MEILLEUR, D.reponse).at(-1)).toBe(3);
  });

  it("chiffrer, tester, négocier bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(3000000);
    expect(bonne! - attentiste!).toBeGreaterThan(800000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_ENSEIGNE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
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
      ["canaux", "references"],
      ["saison"],
      ["direct"],
      ["contrat"],
      ["essai"],
      ["position"],
    ],
    jours: JOURS,
    diagnostic: "portefeuille",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 171,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ENSEIGNE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose un portefeuille plutôt que tout ou rien", () => {
    const p = partie(REFLEXE, { diagnostic: "taille" });
    const c = EPISODE_ENSEIGNE.comportements(p, analyser(EPISODE_ENSEIGNE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_ENSEIGNE.axe(c).titre).toBe("Ni tout, ni rien : un portefeuille");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer hôtel par hôtel", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ENSEIGNE.comportements(p, analyser(EPISODE_ENSEIGNE, p).trimestre);
    expect(EPISODE_ENSEIGNE.axe(c).titre).toBe("Chiffrer hôtel par hôtel avant de répondre");
  });

  it("juge l'estimation de la semaine 1 : juste, proche, ou faute d'avoir pesé les références", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_ENSEIGNE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(171)).toBe(1);
    expect(score(185)).toBe(0.6);
    // Ne compter que le scénario le plus fréquent, 20 points : 190 k€, encore proche.
    expect(score(190)).toBe(0.6);
    expect(score(195)).toBe(0);
    // La promesse d'Orméa, 25 points : 238 k€.
    expect(score(238)).toBe(0);
    // Toutes les commissions actuelles des deux hôtels : 392 k€.
    expect(score(392)).toBe(0);
  });

  it("dit le résultat en valeur détruite, et juge le portefeuille signé", () => {
    expect(EPISODE_ENSEIGNE.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
    const bon = partie(MEILLEUR);
    for (const graine of GRAINES_DU_BILAN) {
      const t = simuler(MEILLEUR, graine, JOURS);
      expect(EPISODE_ENSEIGNE.comportements({ ...bon, graine }, t)[4]!.score).toBe(1);
    }
    const refus = partie([1, 0, 3, 0, 0, 3]);
    expect(
      EPISODE_ENSEIGNE.comportements(refus, simuler([1, 0, 3, 0, 0, 3], 11, JOURS))[4]!.score,
    ).toBe(0);
  });
});
