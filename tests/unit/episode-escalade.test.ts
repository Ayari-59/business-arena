import { describe, expect, it } from "vitest";
import {
  AMORTISSEMENT,
  ARTISANS,
  D,
  ECHEANCE,
  ECULLY,
  IMPREVUS,
  MARGE,
  NEUTRE,
  O,
  OFFRES,
  PERTE_ANNUELLE,
  QUOTE_PART_SIEGE,
  RESULTAT_ANALYTIQUE,
  RILLIEUX,
  SAINT_PRIEST,
  SCENARIOS,
  SEMAINES,
  SITES,
  TAUX,
  accordDuPresident,
  chanceDAccord,
  fixes,
  hasard,
  loyerJusquALEcheance,
  offreDeBremond,
  simuler,
  valeurFuture,
} from "../../src/engine/episodes/projet-a-arreter";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  LECTURES_ECULLY,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/projet-a-arreter";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_ESCALADE,
  PERTE_EN_KE,
  chiffresDesOptions,
  parScenario,
} from "../../src/pedagogy/episodes/projet-a-arreter";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le projet qu'on n'ose pas arrêter » enseigne l'escalade
 * d'engagement : ce qui est dépensé est perdu quoi qu'on décide, seuls
 * comptent les flux à venir de chaque option ; les visites flattent, les
 * ventes tranchent, et une information qui coûte peu change deux décisions ;
 * arrêter trop tôt détruit une option, et la façon de présenter un
 * recentrage décide du président. Ces tests verrouillent les classements qui
 * le disent, et recalculent depuis le modèle les chiffres que les sources
 * affichent.
 */

const MEILLEUR = [...REFERENCES[0].chemin];
const REFLEXE = [...REFERENCES[1].chemin];
const ATTENTISTE = [...REFERENCES[2].chemin];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
const k = (v: number) => Math.round(v / 1000);
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_ESCALADE.contexte(
    EPISODE_ESCALADE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle d'Arvel Maison", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).semaines[1]!.ventes).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.ventes,
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

  it("le marché décolle, plafonne ou recule à peu près aux chances que le panel annonce", () => {
    for (const [i, s] of SCENARIOS.entries()) {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === i).length;
      expect(n / GRAINES_DU_BILAN.length).toBeGreaterThan(s.chance - 0.15);
      expect(n / GRAINES_DU_BILAN.length).toBeLessThan(s.chance + 0.15);
    }
  });

  it("Brémond fait parfois une offre haute, parfois basse, et renonce parfois", () => {
    const offres = GRAINES_DU_BILAN.map(offreDeBremond);
    expect(offres.filter((o) => o === OFFRES.haute).length).toBeGreaterThan(5);
    expect(offres.filter((o) => o === OFFRES.basse).length).toBeGreaterThan(5);
    expect(offres.filter((o) => o === 0).length).toBeGreaterThan(1);
  });

  it("le président accepte plus souvent un recentrage présenté sur des critères qu'il a signés", () => {
    const presente = (d1: number, d5: number) => avec(avec(MEILLEUR, D.relance, d1), D.comite, d5);
    const signes = presente(O.relance.criteres, O.comite.criteres);
    const sans = presente(O.relance.laisser, O.comite.criteres);
    const erreur = presente(O.relance.laisser, O.comite.correction);
    expect(chanceDAccord(signes)).toBeGreaterThan(chanceDAccord(sans));
    expect(chanceDAccord(sans)).toBeGreaterThan(chanceDAccord(erreur));
    const accords = (c: number[]) => GRAINES_DU_BILAN.filter((g) => accordDuPresident(c, g)).length;
    expect(accords(signes)).toBeGreaterThan(accords(erreur) + 8);
    // Le gel ne tombe que sur qui présente un recentrage : rien présenté, rien d'accepté.
    expect(accords(presente(O.relance.criteres, O.comite.rien))).toBe(0);
  });

  it("le chemin attentiste détruit de la valeur, la bonne méthode en crée", () => {
    expect(attendu(ATTENTISTE)).toBeLessThan(-150000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-450000);
    expect(attendu(MEILLEUR)).toBeGreaterThan(0);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[SEMAINES]!.valeur).toBe(t.objectif);
    expect(NEUTRE).toEqual(ATTENTISTE);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la perte propre aux showrooms, que la semaine 1 demande, exclut l'amortissement et le siège", () => {
    const aLaMain = SITES.reduce((t, s) => t + fixes(s) - s.ventes * MARGE, 0);
    expect(PERTE_ANNUELLE).toBeCloseTo(aLaMain, 6);
    expect(PERTE_EN_KE).toBeCloseTo(85.4, 1);
    expect(RESULTAT_ANALYTIQUE).toBeCloseTo(-aLaMain - AMORTISSEMENT - QUOTE_PART_SIEGE, 6);
    expect(EPISODE_ESCALADE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(85.4, 1);
    const texte = source(0, "comptes", []);
    for (const s of SITES) {
      expect(texte).toContain(`${s.nom} : ${k(s.ventes)} k€ de ventes aux particuliers`);
      expect(texte).toContain(`loyer ${k(s.loyer)} k€, personnel ${k(s.personnel)} k€`);
    }
    expect(texte).toContain(`${Math.round(MARGE * 100)} % de marge sur coût variable`);
    expect(texte).toContain(`affiche −${-k(RESULTAT_ANALYTIQUE)} k€`);
    expect(texte).toContain(`${k(AMORTISSEMENT)} k€ d'amortissement`);
  });

  it("fermer Rillieux coûte le loyer jusqu'à l'échéance et le déstockage, comme la source le dit", () => {
    const loyer = (RILLIEUX.loyer * (ECHEANCE - SEMAINES)) / 52 / (1 + TAUX) ** 0.5;
    expect(loyerJusquALEcheance(RILLIEUX)).toBeCloseTo(loyer, 6);
    const c = chiffresDesOptions([1, 0]);
    expect(c.rillieux.fermer).toBeCloseTo(-(loyer + RILLIEUX.fermeture), 6);
    const texte = source(2, "rillieux", [1, 0]);
    expect(texte).toContain(`${k(loyer)} k€ actualisés`);
    expect(texte).toContain(`soit −${-k(c.rillieux.fermer)} k€ dans tous les cas`);
    // Garder Rillieux ne couvre ses charges dans aucun scénario.
    expect(Math.max(...c.rillieux.garder.v)).toBeLessThan(c.rillieux.fermer);
    expect(source(2, "bremond", [1, 0])).toContain(
      `${k(OFFRES.haute)} k€ pour le droit au bail et l'agencement`,
    );
  });

  it("les options de Saint-Priest sont celles du modèle, et la liste des artisans change la réponse", () => {
    const avecListe = chiffresDesOptions([1, O.information.analyse]).saintPriest;
    const sansListe = chiffresDesOptions([1, O.information.rien]).saintPriest;
    const aLaMain = SCENARIOS.map(
      (_, i) =>
        valeurFuture(SAINT_PRIEST, { type: "artisans", debut: 0, liste: true }, i as 0 | 1 | 2) -
        ARTISANS.travaux,
    );
    aLaMain.forEach((v, i) => expect(avecListe.artisans.v[i]).toBeCloseTo(v, 6));
    const texte = source(3, "options", [1, 0, 0]);
    expect(texte).toContain(
      `${avecListe.artisans.v.map((v) => (k(v) > 0 ? `+${k(v)} k€` : `−${-k(v)} k€`)).join(" / ")}, soit +${k(avecListe.artisans.esperance)} k€ en espérance`,
    );
    expect(texte).toContain(`soit −${-k(avecListe.tenir.esperance)} k€ en espérance`);
    // Avec la liste, le format artisans bat la fermeture ; sans elle, de bien moins.
    expect(avecListe.artisans.esperance - avecListe.fermer).toBeGreaterThan(50000);
    expect(sansListe.artisans.esperance - sansListe.fermer).toBeLessThan(
      avecListe.artisans.esperance - avecListe.fermer - 30000,
    );
  });

  it("l'essai d'Écully ne vaut que si le critère se lit sur les ventes", () => {
    const lisible = parScenario(ECULLY, { type: "essai", lisible: true, liste: true });
    const visites = parScenario(ECULLY, { type: "essai", lisible: false, liste: true });
    const telQuel = parScenario(ECULLY, { type: "particuliers" });
    expect(visites.esperance).toBeCloseTo(telQuel.esperance, 6);
    expect(lisible.esperance - telQuel.esperance).toBeGreaterThan(30000);
    expect(source(5, "ecully", [1, 0, 0, 2, 0])).toContain(
      `soit +${k(lisible.esperance)} k€ en espérance, parce que le critère se lira sur les ventes`,
    );
    expect(source(5, "ecully", [1, 2, 0, 2, 0])).toContain("il ne se déclenchera jamais");
    // Ce que l'analyse dit d'Écully suit la croissance de chaque scénario.
    expect(LECTURES_ECULLY[0]).toContain(`${Math.round(ECULLY.croissance[0] * 100)} %`);
    expect(LECTURES_ECULLY[2]).toContain(`${Math.round(-ECULLY.croissance[2] * 100)} %`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : geler et fixer des critères bat la relance, l'arrêt sans chiffres et le laisser-faire", () => {
    expect(classement(MEILLEUR, D.relance)[0]).toBe(O.relance.criteres);
    expect(ecart(MEILLEUR, D.relance, O.relance.criteres, O.relance.relancer)).toBeGreaterThan(
      60000,
    );
    expect(ecart(MEILLEUR, D.relance, O.relance.criteres, O.relance.arreter)).toBeGreaterThan(
      60000,
    );
    expect(ecart(MEILLEUR, D.relance, O.relance.criteres, O.relance.laisser)).toBeGreaterThan(
      30000,
    );
  });

  it("D2 : l'analyse client par client vaut plus qu'elle ne coûte ; l'étude arrive trop tard", () => {
    expect(classement(MEILLEUR, D.information)[0]).toBe(O.information.analyse);
    expect(
      ecart(MEILLEUR, D.information, O.information.analyse, O.information.rien),
    ).toBeGreaterThan(50000);
    expect(
      ecart(MEILLEUR, D.information, O.information.analyse, O.information.etude),
    ).toBeGreaterThan(50000);
  });

  it("D3 : négocier avec Brémond est le meilleur pari, fermer le plus sûr, garder le pire", () => {
    const c = classement(MEILLEUR, D.rillieux);
    expect(c[0]).toBe(O.rillieux.negocier);
    expect(c.at(-1)).toBe(O.rillieux.garder);
    expect(plusSure(MEILLEUR, D.rillieux)).toBe(O.rillieux.fermer);
    expect(ecart(MEILLEUR, D.rillieux, O.rillieux.negocier, O.rillieux.fermer)).toBeGreaterThan(
      40000,
    );
    expect(ecart(MEILLEUR, D.rillieux, O.rillieux.fermer, O.rillieux.garder)).toBeGreaterThan(
      40000,
    );
  });

  it("D4 : changer de cap à Saint-Priest bat tenir le cap, attendre le salon et fermer", () => {
    expect(classement(MEILLEUR, D.saintPriest)[0]).toBe(O.saintPriest.artisans);
    expect(classement(MEILLEUR, D.saintPriest).at(-1)).toBe(O.saintPriest.tenir);
    expect(
      ecart(MEILLEUR, D.saintPriest, O.saintPriest.artisans, O.saintPriest.tenir),
    ).toBeGreaterThan(80000);
    expect(
      ecart(MEILLEUR, D.saintPriest, O.saintPriest.artisans, O.saintPriest.fermer),
    ).toBeGreaterThan(50000);
    // L'analyse de la semaine 2 rend le changement de cap bien plus précieux.
    const gain = (c: readonly number[]) =>
      ecart(c, D.saintPriest, O.saintPriest.artisans, O.saintPriest.tenir);
    expect(gain(MEILLEUR)).toBeGreaterThan(
      gain(avec(MEILLEUR, D.information, O.information.rien)) + 30000,
    );
  });

  it("D5 : présenter sur des critères bat la rallonge, l'aveu d'erreur et le silence, surtout s'ils sont signés", () => {
    const c = classement(MEILLEUR, D.comite);
    expect(c[0]).toBe(O.comite.criteres);
    expect(c.at(-1)).toBe(O.comite.rallonge);
    expect(ecart(MEILLEUR, D.comite, O.comite.criteres, O.comite.correction)).toBeGreaterThan(
      20000,
    );
    const gain = (ch: readonly number[]) => ecart(ch, D.comite, O.comite.criteres, O.comite.rien);
    expect(gain(MEILLEUR)).toBeGreaterThan(
      gain(avec(MEILLEUR, D.relance, O.relance.laisser)) + 10000,
    );
  });

  it("D6 : l'essai sous critère est le meilleur en moyenne, le format artisans le plus sûr, l'agrandissement le pire", () => {
    const c = classement(MEILLEUR, D.ecully);
    expect(c[0]).toBe(O.ecully.essai);
    expect(c.at(-1)).toBe(O.ecully.agrandir);
    expect(plusSure(MEILLEUR, D.ecully)).toBe(O.ecully.artisans);
    expect(ecart(MEILLEUR, D.ecully, O.ecully.essai, O.ecully.telQuel)).toBeGreaterThan(30000);
    expect(ecart(MEILLEUR, D.ecully, O.ecully.essai, O.ecully.agrandir)).toBeGreaterThan(60000);
    // Sans l'analyse, le critère se lit sur les visites : l'essai ne vaut plus rien de plus.
    expect(
      ecart(
        avec(MEILLEUR, D.information, O.information.rien),
        D.ecully,
        O.ecully.essai,
        O.ecully.telQuel,
      ),
    ).toBeLessThan(1000);
  });

  it("le critère avant l'histoire bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(250000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_ESCALADE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
    expect(REFLEXES.every(([d, o]) => REFERENCES[1].chemin[d] === o)).toBe(true);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["comptes", "baux"],
      ["entonnoir"],
      ["rillieux"],
      ["options"],
      ["criteres"],
      ["ecully"],
    ],
    jours: JOURS,
    diagnostic: "avenir",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 85,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ESCALADE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de juger sur ce qui vient", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ESCALADE.comportements(p, analyser(EPISODE_ESCALADE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_ESCALADE.axe(c).titre).toBe(
      "Juger sur ce qui vient, pas sur ce qui est dépensé",
    );
  });

  it("à qui a décidé sans enquêter, propose de chercher l'information qui tranche", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ESCALADE.comportements(p, analyser(EPISODE_ESCALADE, p).trimestre);
    expect(EPISODE_ESCALADE.axe(c).titre).toBe("Chercher l'information qui tranche");
  });

  it("juge la perte calculée en semaine 1 : juste, proche, ou faute d'avoir retiré l'amortissement", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_ESCALADE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(85)).toBe(1);
    expect(score(97)).toBe(0.6);
    // Le compte analytique tel quel, ou sans retirer le siège : ni juste ni proche.
    expect(score(391)).toBe(0);
    expect(score(151)).toBe(0);
  });

  it("le diagnostic juste vaut 1, le proche 0,6, les faux 0", () => {
    const score = (diagnostic: string) => {
      const p = partie(MEILLEUR, { diagnostic });
      return EPISODE_ESCALADE.comportements(p, simuler(MEILLEUR, 11, JOURS))[1]!.score;
    };
    expect(score("avenir")).toBe(1);
    expect(score("sites")).toBe(0.6);
    expect(score("notoriete")).toBe(0);
    expect(score("echec")).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    const creee = GRAINES_DU_BILAN.find((g) => simuler(MEILLEUR, g).objectif > 0)!;
    expect(EPISODE_ESCALADE.bilan.titre(simuler(MEILLEUR, creee))).toMatch(/valeur créée/);
    // Le réflexe détruit de la valeur la plupart du temps ; quand le marché décolle, il peut gagner.
    const detruite = GRAINES_DU_BILAN.filter((g) => simuler(REFLEXE, g).objectif < 0);
    expect(detruite.length).toBeGreaterThan(20);
    expect(EPISODE_ESCALADE.bilan.titre(simuler(REFLEXE, detruite[0]!))).toMatch(/valeur détruite/);
  });
});
