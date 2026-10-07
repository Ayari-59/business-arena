import { describe, expect, it } from "vitest";
import {
  AVANT_VENTE,
  BATIMENTS,
  CAPACITE_SEMAINE,
  CORRECTION,
  D,
  ERREURS_PAR_FICHE,
  FORFAIT,
  IMPREVUS,
  JOURS_DE_REPRISE,
  JOURS_VENDUS,
  JOURS_VERSION_PARFAITE,
  MARGE_TRANCHE,
  PENALITE_JOUR,
  PHASE1,
  PHASE2,
  RELECTURE,
  REMISE_TRANCHE,
  TJM_MOYEN,
  TRANCHE,
  arretTard,
  arretTot,
  capaciteRestante,
  chanceQueLeCourrielSoitLu,
  hasard,
  simuler,
} from "../../src/engine/episodes/livrable-refuse";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/livrable-refuse";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_LIVRABLE } from "../../src/pedagogy/episodes/livrable-refuse";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le livrable que le client refuse » enseigne trois choses : un
 * refus s'analyse avant de se corriger (le comité parlait de la forme, il
 * refusait une hypothèse de méthode jamais validée) ; refaire sans valider
 * refait la même erreur ; la qualité se construit par des validations
 * intermédiaires (la méthode, un échantillon, une relecture par un pair, une
 * revue avant le comité) qui coûtent des jours et évitent les reprises
 * tardives, dont dépend la confiance du client, et la tranche optionnelle.
 * Ces tests verrouillent les classements qui le disent, et recalculent depuis
 * le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 0];
const REFLEXE = [0, 0, 0, 0, 0, 1];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_LIVRABLE.contexte(
    EPISODE_LIVRABLE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la mission Ardven", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).methode2).toBe(simuler(ATTENTISTE, 12).methode2);
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

  it("Shirin ne s'arrête qu'après des samedis travaillés, et cela arrive", () => {
    const arrets = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => arretTot(c, g) || arretTard(c, g)).length;
    expect(arrets(MEILLEUR)).toBe(0);
    expect(arrets(ATTENTISTE)).toBe(0);
    expect(arrets(REFLEXE)).toBeGreaterThan(0);
    expect(arrets(avec(MEILLEUR, D.planning, 0))).toBeGreaterThan(0);
  });

  it("la version « parfaite » refaite avec la même méthode est presque toujours refusée", () => {
    const refus = GRAINES_DU_BILAN.filter((g) => simuler(REFLEXE, g).nouveauRefus).length;
    expect(refus).toBeGreaterThan(20);
    expect(GRAINES_DU_BILAN.some((g) => simuler(REFLEXE, g).sousReserve)).toBe(true);
    expect(GRAINES_DU_BILAN.every((g) => !simuler(MEILLEUR, g).nouveauRefus)).toBe(true);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g);
        expect(t.jours).toBeGreaterThan(150);
        expect(t.jours).toBeLessThan(300);
        expect(t.marge).toBeGreaterThan(-60000);
        expect(t.marge).toBeLessThan(60000);
        expect(t.confiance).toBeGreaterThanOrEqual(0);
        expect(t.confiance).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("la prévision de la semaine 1 se calcule depuis Tempora", () => {
    const texte = source(0, "tempora", []);
    expect(JOURS_VENDUS).toBe(FORFAIT / TJM_MOYEN);
    expect(texte).toContain(`Jours vendus : ${JOURS_VENDUS}`);
    expect(texte).toContain("2,0 jours");
    expect(texte).toContain("0,5 jour de visite");
    expect(texte).toContain(`${PHASE1.synthese} jours`);
    expect(JOURS_DE_REPRISE).toBe(
      BATIMENTS * (PHASE1.parBatiment - PHASE1.visite) + PHASE1.synthese,
    );
    expect(JOURS_DE_REPRISE).toBe(37);
    expect(EPISODE_LIVRABLE.prevision.reel(simuler(MEILLEUR, 1))).toBe(37);
    // 62 jours pointés : 2 jours par bâtiment, la synthèse, et 14 jours de réunions.
    expect(BATIMENTS * PHASE1.parBatiment + PHASE1.synthese + 14).toBe(62);
  });

  it("la version « parfaite » coûte ce que dit l'option", () => {
    expect(JOURS_VERSION_PARFAITE).toBe(30);
    expect(ETAPES[0]!.options[0]!.d).toContain(`${JOURS_VERSION_PARFAITE} jours`);
  });

  it("la tranche optionnelle et sa remise", () => {
    expect(MARGE_TRANCHE).toBe(36480);
    expect(REMISE_TRANCHE).toBe(9600);
    const texte = source(5, "tranche", MEILLEUR.slice(0, 5));
    expect(texte).toContain("96 000 €");
    expect(texte).toContain(`${TRANCHE.taux * 100} %`);
    expect(texte).toContain("36 480 €");
    expect(texte).toContain("9 600 €");
  });

  it("les pénalités du CCAP", () => {
    const texte = source(4, "ccap", MEILLEUR.slice(0, 4));
    expect(texte).toContain(`${PENALITE_JOUR} €`);
    expect(PENALITE_JOUR * 7).toBe(1750);
    expect(texte).toContain("1 750 €");
  });

  it("les erreurs et la relecture", () => {
    const texte = source(2, "erreurs-phase1", MEILLEUR.slice(0, 2));
    expect(texte).toContain(`${String(ERREURS_PAR_FICHE).replace(".", ",")} erreur`);
    expect(1 - RELECTURE.croisee).toBeCloseTo(1 / 5, 9);
    expect(texte).toContain(`${String(PHASE2.relecture).replace(".", ",")} jour par fiche`);
    expect(texte).toContain(`${String(CORRECTION.tot).replace(".", ",")} jour`);
    expect(texte).toContain(`${String(CORRECTION.client).replace(".", ",")} jour`);
  });

  it("le planning de la semaine 9 dit ce qui manque, avec Basile à un jour par semaine", () => {
    expect(capaciteRestante(9)).toBe(4 * (CAPACITE_SEMAINE - AVANT_VENTE.jours));
    const decisions = MEILLEUR.slice(0, 4);
    const l = EPISODE_LIVRABLE.lire(decisions, 3, 0, 9);
    const texte = source(4, "planning", decisions);
    expect(texte).toContain(`l'équipe en a ${Math.round(l.capacite!)} jours`);
    expect(texte).toContain(`Il reste ${Math.round(l.reste!)} jours`);
    expect(l.manque).toBeCloseTo(Math.max(0, l.reste! - l.capacite!), 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : analyser le refus et valider la méthode bat de loin la version « parfaite » du week-end", () => {
    const r = rejeu(MEILLEUR, D.refus);
    expect(classement(MEILLEUR, D.refus)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    // Reprendre la forme ne règle rien : la version est refusée, et la reprise vient quand même.
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(8000);
  });

  it("D2 : un échantillon validé avant de généraliser ; le renfort pour rattraper est le pire", () => {
    const c = classement(MEILLEUR, D.phase2);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("D2 : la note par courriel vaut bien plus quand l'économe de flux a été associé à la méthode", () => {
    expect(chanceQueLeCourrielSoitLu(MEILLEUR)).toBeGreaterThan(
      chanceQueLeCourrielSoitLu(ATTENTISTE),
    );
    const gain = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.phase2);
      return r[2]!.attendu - r[3]!.attendu;
    };
    expect(gain(MEILLEUR) - gain(avec(MEILLEUR, D.refus, 3))).toBeGreaterThan(2000);
  });

  it("D3 : la relecture par un pair bat la relecture de la veille, qui n'est pas une bonne décision", () => {
    const m = mesurerDecision(EPISODE_LIVRABLE, MEILLEUR, D.relecture, JOURS);
    expect(m.meilleure.option).toBe(1);
    expect(m.options[0]!.qualite).toBeLessThan(0.7);
    expect(m.meilleure.moyenne - m.options[0]!.moyenne).toBeGreaterThan(2000);
  });

  it("D4 : chercher la cause des deux erreurs bat de loin les corriger une par une", () => {
    const r = rejeu(MEILLEUR, D.erreurs);
    expect(classement(MEILLEUR, D.erreurs)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D5 : la remise en deux temps est la meilleure en moyenne, le renfort le plus sûr ; les samedis ne sont ni l'un ni l'autre", () => {
    expect(classement(MEILLEUR, D.planning)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.planning)).toBe(2);
    const m = mesurerDecision(EPISODE_LIVRABLE, MEILLEUR, D.planning, JOURS);
    expect(m.options[0]!.qualite).toBeLessThan(0.7);
  });

  it("D6 : la revue avant le comité est la meilleure ; la remise sur la tranche ne vaut que quand la confiance manque", () => {
    const c = classement(MEILLEUR, D.copil);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    expect(classement(ATTENTISTE, D.copil)[0]).toBe(2);
  });

  it("aucun réflexe n'est une bonne décision sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_LIVRABLE, MEILLEUR, d, JOURS);
      const om = m.options[o]!;
      expect(om.qualite, `D${d + 1}`).toBeLessThan(0.7);
      expect(m.meilleure.moyenne - om.moyenne, `D${d + 1}`).toBeGreaterThan(1000);
      expect(m.plusSure.option === o && m.meilleure.moyenne - om.moyenne < 3000).toBe(false);
    }
    expect(REFERENCES[0].chemin.some((o, d) => REFLEXES.some(([a, b]) => a === d && b === o))).toBe(
      false,
    );
  });

  it("valider en route bat nettement l'effort héroïque et l'attentisme", () => {
    const [methode, heroique, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - heroique!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(15000);
    expect(attentiste).toBeGreaterThan(heroique!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["compte-rendu", "note-de-methode", "tempora"],
      ["remarques-phase2"],
      ["erreurs-phase1"],
      ["origine"],
      ["planning"],
      ["budget"],
    ],
    jours: JOURS,
    diagnostic: "methode",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 36,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_LIVRABLE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a misé sur l'effort de la fin, propose de valider en route", () => {
    const p = partie(REFLEXE, { diagnostic: "forme" });
    const c = EPISODE_LIVRABLE.comportements(p, analyser(EPISODE_LIVRABLE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_LIVRABLE.axe(c).titre).toBe(
      "Valider en route plutôt que tout reprendre à la fin",
    );
  });

  it("à qui a décidé sans enquêter, propose de lire le refus avant de le corriger", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_LIVRABLE.comportements(p, analyser(EPISODE_LIVRABLE, p).trimestre);
    expect(EPISODE_LIVRABLE.axe(c).titre).toBe("Lire le refus avant de le corriger");
  });

  it("note le diagnostic et la prévision", () => {
    const juste = partie(MEILLEUR);
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_LIVRABLE.comportements(juste, t)[1]!.score).toBe(1);
    expect(EPISODE_LIVRABLE.comportements(juste, t)[3]!.score).toBe(1);
    const proche = partie(MEILLEUR, { diagnostic: "validation", prevision: 42 });
    expect(EPISODE_LIVRABLE.comportements(proche, t)[1]!.score).toBe(0.6);
    expect(EPISODE_LIVRABLE.comportements(proche, t)[3]!.score).toBe(0.6);
    const faux = partie(MEILLEUR, { diagnostic: "forme", prevision: 66 });
    expect(EPISODE_LIVRABLE.comportements(faux, t)[1]!.score).toBe(0);
    expect(EPISODE_LIVRABLE.comportements(faux, t)[3]!.score).toBe(0);
  });

  it("dit le résultat en marge et en tranche espérée", () => {
    expect(EPISODE_LIVRABLE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de marge et/);
  });
});
