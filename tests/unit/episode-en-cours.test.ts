import { describe, expect, it } from "vitest";
import {
  CA_JOUR,
  COMMISSION_DECOUVERT,
  CONTESTEES_0,
  CREANCES_0,
  D,
  DSO_0,
  ECHUES_PRIVEES_0,
  EN_COURS_0,
  EN_RETARD_0,
  FACTURE_FORFAITS,
  IMPREVUS,
  JALONS_0,
  JOURS_REGIE_0,
  OLLIVRO,
  OLLIVRO_CONFORME,
  OLLIVRO_HORS_PERIMETRE,
  NON_ECHUES_PRIVEES_0,
  PUBLIQUES_ECHUES_0,
  PUBLIQUES_VALIDES_0,
  RALLONGE,
  REJETEES_0,
  TJM_REGIE,
  TRAVAUX_0,
  VALEUR_REALISEE,
  VRAIMENT_ECHUES_0,
  avenantSigne,
  chanceAvenant,
  hasard,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/factures-qui-dorment";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/factures-qui-dorment";
import { euros, kE, nombre } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_EN_COURS } from "../../src/pedagogy/episodes/factures-qui-dorment";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le travail fait qu'on n'a pas facturé » enseigne que, dans un
 * cabinet, la trésorerie dort d'abord avant la facture : jalons franchis que
 * personne ne déclenche, régie sans temps validés, factures publiques
 * rejetées faute de numéro d'engagement. Relancer ce qui n'est pas dû
 * froisse sans rien faire rentrer, et le découvert ou l'affacturage
 * financent le creux sans en régler la cause. Ces tests verrouillent les
 * classements qui le disent, et la cohérence des chiffres des sources avec
 * le modèle.
 */

const MEILLEUR = [1, 1, 1, 1, 2, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [2, 3, 3, 3, 3, 3];
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
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, quand il ne dépend pas de la situation. */
const source = (etape: number, id: string) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat({});
};

describe("le modèle de la facturation d'Atlas Conseil", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(hasard(12).uOllivro).toBe(hasard(12).uOllivro);
    expect(simuler(MEILLEUR, 12).semaines[1]!.production).toBe(
      simuler(REFLEXE, 12).semaines[1]!.production,
    );
    // La semaine 1, avant que la moindre décision agisse, est la même pour tous.
    expect(simuler(MEILLEUR, 12).semaines[1]!.encaissements).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.encaissements,
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

  it("donne dans les sources les chiffres du modèle", () => {
    // L'en-cours de production non facturé : forfaits réalisés moins facturés, plus la régie au TJM.
    expect(EN_COURS_0).toBe(VALEUR_REALISEE - FACTURE_FORFAITS + JOURS_REGIE_0 * TJM_REGIE);
    expect(EN_COURS_0).toBe(2_741_000);
    expect(TRAVAUX_0 + JALONS_0).toBe(VALEUR_REALISEE - FACTURE_FORFAITS);
    const encours = source(0, "encours");
    expect(encours).toContain(kE(VALEUR_REALISEE));
    expect(encours).toContain(kE(FACTURE_FORFAITS));
    expect(encours).toContain(kE(JALONS_0));
    expect(encours).toContain(nombre(JOURS_REGIE_0, 0));
    expect(encours).toContain(euros(TJM_REGIE));
    expect(EPISODE_EN_COURS.prevision.reel(simuler(MEILLEUR, 1))).toBe(2741);
    expect(tableauDeBord([], 1, 0, 0).enCours).toBe(EN_COURS_0);

    // Le DSO : les créances rapportées au chiffre d'affaires d'un jour.
    expect(CREANCES_0).toBe(8_940_000);
    expect(Math.round(DSO_0)).toBe(96);
    expect(Math.round(CREANCES_0 / CA_JOUR)).toBe(96);
    const balance = source(0, "balance");
    expect(balance).toContain(kE(CREANCES_0));
    expect(balance).toContain(kE(CA_JOUR));
    expect(balance).toContain(`${nombre(DSO_0, 0)} jours`);

    // La liste des « retards » mêle des factures dues, rejetées et contestées.
    expect(EN_RETARD_0).toBe(ECHUES_PRIVEES_0 + PUBLIQUES_ECHUES_0 + REJETEES_0 + CONTESTEES_0);
    expect(VRAIMENT_ECHUES_0 * 2).toBeLessThan(EN_RETARD_0 * 1.1);
    expect(balance).toContain(kE(EN_RETARD_0));
    expect(balance).toContain(kE(VRAIMENT_ECHUES_0));
    expect(balance).toContain(kE(PUBLIQUES_VALIDES_0 - PUBLIQUES_ECHUES_0));
    expect(balance).toContain(kE(NON_ECHUES_PRIVEES_0));

    // Ollivro : l'avoir abandonne la part hors périmètre, l'avenant fait payer le tout.
    expect(OLLIVRO_CONFORME + OLLIVRO_HORS_PERIMETRE).toBe(OLLIVRO);
    expect(source(3, "contrat")).toContain(kE(OLLIVRO_CONFORME));
    expect(source(3, "contrat")).toContain(kE(OLLIVRO_HORS_PERIMETRE));
    for (const g of [1, 2, 3]) {
      const avoir = simuler([1, 1, 1, 2, 2, 1], g);
      expect(avoir.avoirs).toBe(OLLIVRO_HORS_PERIMETRE);
      expect(avoir.ollivroEncaisse).toBe(OLLIVRO_CONFORME);
      const copil = simuler(MEILLEUR, g);
      expect(copil.ollivroEncaisse).toBe(avenantSigne(MEILLEUR, g) ? OLLIVRO : 0);
    }

    // La commission d'engagement d'un découvert supplémentaire.
    expect(ETAPES[D.banque]!.options[0]!.d).toContain(kE(RALLONGE * COMMISSION_DECOUVERT));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la revue des en-cours bat la relance générale, les relances habituelles et le découvert", () => {
    const c = classement(MEILLEUR, D.priorite);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.priorite, 1, 0)).toBeGreaterThan(100000);
    expect(ecart(MEILLEUR, D.priorite, 1, 3)).toBeGreaterThan(50000);
  });

  it("D2 : exiger le numéro d'engagement bat la seule correction, la mise en demeure et l'attente", () => {
    const c = classement(MEILLEUR, D.portail);
    expect(c[0]).toBe(1);
    expect(c[1]).toBe(2);
    expect(ecart(MEILLEUR, D.portail, 1, 2)).toBeGreaterThan(50000);
    expect(ecart(MEILLEUR, D.portail, 1, 0)).toBeGreaterThan(300000);
  });

  it("D3 : déclencher le jalon au comité de pilotage bat la note, la facturation d'office et le statu quo", () => {
    const c = classement(MEILLEUR, D.jalons);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.jalons, 1, 2)).toBeGreaterThan(100000);
    expect(ecart(MEILLEUR, D.jalons, 1, 0)).toBeGreaterThan(100000);
  });

  it("D4 : l'avenant est le meilleur choix en moyenne ; l'avoir est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.ollivro);
    expect(classement(MEILLEUR, D.ollivro)[0]).toBe(1);
    expect(classement(MEILLEUR, D.ollivro).at(-1)).toBe(0);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSur).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
  });

  it("D4 dépend de D1 : relancé sur la facture qu'il conteste, Ollivro ne signe plus, et l'avoir devient le meilleur choix", () => {
    const relance = [0, 1, 1, 1, 2, 1];
    expect(chanceAvenant(MEILLEUR)).toBeGreaterThan(chanceAvenant(relance) * 2);
    expect(classement(relance, D.ollivro)[0]).toBe(2);
    expect(ecart(MEILLEUR, D.ollivro, 1, 2)).toBeGreaterThan(30000);
  });

  it("D5 : l'échéancier présenté à la banque bat le découvert sans dossier, sauf quand rien n'a été facturé", () => {
    const c = classement(MEILLEUR, D.banque);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(3);
    expect(ecart(MEILLEUR, D.banque, 2, 0)).toBeGreaterThan(10000);
    // Quand l'en-cours et les rejets sont restés là, la banque ne suit plus : l'affacturage, cher, devient le recours.
    expect(classement(REFLEXE, D.banque)[0]).toBe(1);
  });

  it("D6 : facturer et déposer avant la clôture bat la relance générale, la relance des gros encours et l'attente", () => {
    const c = classement(MEILLEUR, D.cloture);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    expect(ecart(MEILLEUR, D.cloture, 1, 0)).toBeGreaterThan(100000);
  });

  it("aucun réflexe n'est un bon choix sur le meilleur chemin, ni dans la meilleure référence", () => {
    for (const [d, o] of REFLEXES) {
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_EN_COURS, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
  });

  it("facturer juste avant de relancer bat les réflexes et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 500000);
    expect(methode).toBeGreaterThan(attentiste! + 500000);
    expect(attentiste).toBeLessThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["encours", "balance"],
      ["rejets"],
      ["jalons"],
      ["contrat"],
      ["prevision", "comite"],
      ["cloture"],
    ],
    jours: JOURS,
    diagnostic: "avantFacture",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 2741,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_EN_COURS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de facturer avant de relancer", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_EN_COURS.comportements(p, analyser(EPISODE_EN_COURS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EN_COURS.axe(c).titre).toBe("Facturer avant de relancer");
  });

  it("à qui a décidé sans enquêter, propose de chercher où dort l'argent", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EN_COURS.comportements(p, analyser(EPISODE_EN_COURS, p).trimestre);
    expect(EPISODE_EN_COURS.axe(c).titre).toBe("Chercher où dort l'argent");
  });

  it("juge la prévision sur l'en-cours non facturé, à 20 k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const score = (prevision: number) =>
      EPISODE_EN_COURS.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(2741)).toBe(1);
    expect(score(2794)).toBe(0.6); // la régie comptée au TJM moyen du cabinet, 900 €
    expect(score(1840)).toBe(0); // la régie oubliée
    expect(score(1120)).toBe(0); // les seuls jalons franchis
  });

  it("dit le résultat en trésorerie dégagée, et la courbe couvre les valeurs atteintes", () => {
    expect(EPISODE_EN_COURS.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/dégagée/);
    expect(EPISODE_EN_COURS.bilan.titre(simuler(ATTENTISTE, 2))).toMatch(/immobilisée/);
    const haut = EPISODE_EN_COURS.courbe.graduations.at(-1)!;
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.endormi).toBeLessThanOrEqual(haut);
        }
      }
    }
  });
});
