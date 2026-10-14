import { describe, expect, it } from "vitest";
import {
  BUDGET,
  CDI,
  CF_DEPART,
  CHARGES_FIXES,
  CHARIOT_HEURE,
  CREDIT_BAIL,
  D,
  FIN,
  IMPREVUS,
  INTERIM,
  LOYER,
  MCV_DEPART,
  PANIER,
  RETRAITS_MOIS_1,
  SEMAINES_PAR_MOIS,
  SEUIL_DEPART,
  TAUX_ACHAT,
  TAUX_MCV_DEPART,
  hasard,
  margeDUnRetraitBatir,
  simuler,
  structure,
} from "../../src/engine/episodes/seuil-qui-bouge";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/seuil-qui-bouge";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_SEUIL } from "../../src/pedagogy/episodes/seuil-qui-bouge";
import type { PartieJouee, Source } from "../../src/config/episodes/types";

/**
 * L'épisode « Le seuil qui bouge » enseigne trois choses : la structure la
 * moins chère au volume du plan est la plus fragile quand la demande baisse,
 * et la meilleure garde un socle fixe que le volume probable remplit ; baisser
 * les prix pour passer le seuil fait monter le seuil ; un volume en plus se
 * juge à sa marge sur coût variable, qui dépend de ce qui est déjà engagé.
 * Ces tests verrouillent les classements qui le disent, et la cohérence des
 * chiffres que les sources donnent avec le modèle.
 */

const MEILLEUR = [1, 1, 1, 1, 0, 2];
const REFLEXE = [0, 0, 0, 0, 2, 0];
const ATTENTISTE = [3, 0, 3, 3, 2, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};

/** Un montant tel que les sources l'écrivent : « 203 500 € ». */
const fr = (v: number) => `${Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const texte = (s: Source) => (typeof s.resultat === "string" ? s.resultat : "");
const source = (etape: number, id: string) => ETAPES[etape]!.sources.find((s) => s.id === id)!;

describe("le modèle du drive", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.retraits).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.retraits,
      6,
    );
    expect(simuler(MEILLEUR, 12).regime).toBe(simuler(ATTENTISTE, 12).regime);
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

  it("tire les trois trajectoires de la demande, dont un scénario bas plausible", () => {
    const n = (r: string) => GRAINES_DU_BILAN.filter((g) => hasard(g).regime === r).length;
    expect(n("haut")).toBeGreaterThan(3);
    expect(n("plateau")).toBeGreaterThan(5);
    expect(n("bas")).toBeGreaterThanOrEqual(4);
  });

  it("garde des indicateurs réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(-120000);
        expect(t.objectif).toBeLessThan(60000);
        for (let w = 1; w <= 11; w += 1) {
          const s = t.semaines[w]!;
          expect(s.retraits).toBeGreaterThan(80);
          expect(s.retraits).toBeLessThan(430);
          expect(s.tauxMcv).toBeGreaterThan(0.1);
          expect(s.tauxMcv).toBeLessThan(0.26);
        }
      }
    }
  });
});

describe("les chiffres des sources sortent du modèle", () => {
  it("le compte du premier mois donne le seuil de 240 k€", () => {
    const compte = texte(source(0, "compte"));
    expect(compte).toContain(fr(RETRAITS_MOIS_1 * PANIER));
    expect(compte).toContain(fr(RETRAITS_MOIS_1 * PANIER * TAUX_ACHAT));
    expect(compte).toContain(fr(RETRAITS_MOIS_1 * INTERIM.coupParCoup));
    expect(compte).toContain(fr(RETRAITS_MOIS_1 * CHARIOT_HEURE));
    for (const v of Object.values(CHARGES_FIXES)) expect(compte).toContain(fr(v));
    expect(compte).toContain(`Résultat : ${fr(RETRAITS_MOIS_1 * MCV_DEPART - CF_DEPART)}`);
    expect(MCV_DEPART).toBe(50);
    expect(TAUX_MCV_DEPART).toBeCloseTo(0.2, 10);
    expect(SEUIL_DEPART).toBeCloseTo(240000, 6);
    expect(EPISODE_SEUIL.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(240, 6);
  });

  it("le coût d'un retrait préparé en CDI, et le budget, sont ceux du modèle", () => {
    const parRetrait = (CDI.cout / SEMAINES_PAR_MOIS / CDI.capacite).toFixed(2).replace(".", ",");
    expect(parRetrait).toBe("6,92");
    expect(ETAPES[0]!.messages({}).some((m) => m.texte.includes(`${parRetrait} €`))).toBe(true);
    expect(BUDGET).toBeCloseTo(31500, 6);
  });

  it("les trois loyers aux trois volumes, et leurs seuils, se recalculent", () => {
    const loyers = texte(source(1, "loyers"));
    for (const retraitsParMois of [1300, 1100, 660]) {
      const ca = retraitsParMois * PANIER;
      expect(loyers).toContain(
        `${retraitsParMois.toLocaleString("fr-FR").replace(/\s/g, " ")} retraits`,
      );
      expect(loyers).toContain(`binaire ${fr(LOYER.minimum + LOYER.part * ca)}`);
      expect(loyers).toContain(`variable ${fr(LOYER.variable * ca)}`);
    }
    // Au volume du plan, le fixe est le moins cher : c'est le piège.
    const plan = 1300 * PANIER;
    expect(LOYER.fixe).toBeLessThan(LOYER.minimum + LOYER.part * plan);
    expect(LOYER.fixe).toBeLessThan(LOYER.variable * plan);
    const seuils = texte(source(1, "seuils"));
    const autres = CF_DEPART - CHARGES_FIXES.loyer;
    expect(seuils).toContain(fr(autres + LOYER.fixe));
    expect(seuils).toContain(fr(autres + LOYER.minimum));
    expect(seuils).toContain(fr(autres));
    expect(seuils).toContain(
      `${((TAUX_MCV_DEPART - LOYER.variable) * 100).toFixed(1).replace(".", ",")} %`,
    );
  });

  it("le point mort du chariot, la remise de fin d'année et la marge d'un retrait de Bâtir aussi", () => {
    expect(texte(source(3, "heures"))).toContain(
      `dès ${CREDIT_BAIL / CHARIOT_HEURE} retraits par mois`,
    );
    expect(texte(source(5, "operation"))).toContain(`retire ${fr(FIN.remise * PANIER)}`);
    const m = margeDUnRetraitBatir(MEILLEUR);
    expect(m.marge).toBeCloseTo(
      300 * 0.92 - 300 * TAUX_ACHAT - 2.5 - INTERIM.cadre - 2.5 - 0.02 * 276,
      6,
    );
    const ctx = EPISODE_SEUIL.contexte(
      EPISODE_SEUIL.lire(MEILLEUR.slice(0, 4), 3, JOURS, 8),
      MEILLEUR.slice(0, 4),
    );
    const marginal = source(4, "marginal").resultat as (c: typeof ctx) => string;
    expect(marginal(ctx)).toContain("35,48 €");
    expect(margeDUnRetraitBatir(REFLEXE).marge).toBeCloseTo(51.5, 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : deux CDI pour le socle battent trois CDI ; tout en intérim est plus sûr, pour peu", () => {
    const r = rejeu(MEILLEUR, D.preparation);
    expect(classement(MEILLEUR, D.preparation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(3000);
    // La nuance : la meilleure en moyenne n'est pas la plus sûre, et la sécurité coûte peu.
    expect(plusSure(MEILLEUR, D.preparation)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeLessThan(3000);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(r[0]!.p10).toBe(Math.min(...r.map((x) => x.p10)));
  });

  it("D2 : le loyer binaire est le meilleur en moyenne, le variable le plus sûr, le fixe le pire", () => {
    const r = rejeu(MEILLEUR, D.bail);
    expect(classement(MEILLEUR, D.bail)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2000);
    expect(plusSure(MEILLEUR, D.bail)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeLessThan(3000);
    expect(r[2]!.p10 - r[1]!.p10).toBeGreaterThan(3000);
  });

  it("D3 : baisser tous les prix fait monter le seuil et coûte cher ; l'alignement ciblé gagne", () => {
    const r = rejeu(MEILLEUR, D.concurrent);
    expect(classement(MEILLEUR, D.concurrent)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(structure(avec(ATTENTISTE, D.concurrent, 0)).seuil).toBeGreaterThan(
      structure(ATTENTISTE).seuil + 40000,
    );
  });

  it("D3 dépend de D1 : avec trois CDI déjà payés, la garantie de service devient le meilleur choix", () => {
    expect(classement(MEILLEUR, D.concurrent)[0]).toBe(1);
    const troisCdi = avec(MEILLEUR, D.preparation, 0);
    expect(classement(troisCdi, D.concurrent)[0]).toBe(2);
    const r = rejeu(troisCdi, D.concurrent);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(1500);
  });

  it("D4 : un chariot en crédit-bail est sûr, deux chariots et un second quai ne paient pas", () => {
    const r = rejeu(MEILLEUR, D.chariots);
    expect(classement(MEILLEUR, D.chariots)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.chariots)).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2000);
  });

  it("D5 : accepter un volume en plus au-dessus du coût variable rapporte, d'autant plus avec des CDI", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)).toEqual([0, 1, 2]);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    const gain = (c: readonly number[]) =>
      attendu(avec(c, D.contrat, 0)) - attendu(avec(c, D.contrat, 2));
    expect(gain(avec(MEILLEUR, D.preparation, 0))).toBeGreaterThan(
      gain(avec(MEILLEUR, D.preparation, 3)) + 500,
    );
  });

  it("D6 : ouvrir le matin la semaine de Noël bat la remise de fin d'année et la fermeture", () => {
    const r = rejeu(MEILLEUR, D.noel);
    expect(classement(MEILLEUR, D.noel)[0]).toBe(2);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
  });

  it("aucun réflexe n'est une bonne décision sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const r = rejeu(MEILLEUR, d);
      const meilleur = Math.max(...r.map((x) => x.attendu));
      const pire = Math.min(...r.map((x) => x.attendu));
      const qualite = (r[o]!.attendu - pire) / (meilleur - pire);
      expect(qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(plusSure(MEILLEUR, d)).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("regarder le scénario bas bat nettement la structure du plan et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(10000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });

  it("la structure du plan finit sous son seuil au rythme du premier mois ; la bonne méthode l'abaisse", () => {
    expect(structure(MEILLEUR).seuil).toBeLessThan(SEUIL_DEPART);
    expect(structure(MEILLEUR).securite).toBeGreaterThan(0.15);
    expect(structure(REFLEXE).seuil).toBeGreaterThan(SEUIL_DEPART);
    expect(structure(REFLEXE).securite).toBeLessThan(0);
    expect(structure(REFLEXE).levier).toBeNull();
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["compte", "drives"],
      ["loyers"],
      ["chambery", "comparaison"],
      ["heures"],
      ["marginal"],
      ["evitables"],
    ],
    jours: 2,
    diagnostic: "structure",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 238,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SEUIL, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris les réflexes, propose de regarder le scénario bas", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SEUIL.comportements(p, analyser(EPISODE_SEUIL, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_SEUIL.axe(c).titre).toBe("Regarder le scénario bas avant de figer une charge");
  });

  it("à qui a décidé sans enquêter, propose de lire la structure d'abord", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SEUIL.comportements(p, analyser(EPISODE_SEUIL, p).trimestre);
    expect(EPISODE_SEUIL.axe(c).titre).toBe("Lire la structure avant de décider");
  });

  it("juge le calcul du seuil au plus près", () => {
    const juste = EPISODE_SEUIL.comportements(partie(MEILLEUR), simuler(MEILLEUR, 11, 2));
    expect(juste[1]!.score).toBe(1);
    expect(juste[3]!.score).toBe(1);
    const oubli = partie(MEILLEUR, { prevision: 200, diagnostic: "prix" });
    const c = EPISODE_SEUIL.comportements(oubli, simuler(MEILLEUR, 11, 2));
    expect(c[1]!.score).toBe(0);
    expect(c[3]!.score).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    const haut = GRAINES_DU_BILAN.find((g) => hasard(g).regime === "haut")!;
    expect(EPISODE_SEUIL.bilan.titre(simuler(MEILLEUR, haut))).toMatch(/au-dessus du budget/);
    expect(EPISODE_SEUIL.bilan.titre(simuler(REFLEXE, haut))).toMatch(/sous le budget/);
  });
});
