import { describe, expect, it } from "vitest";
import {
  AUXONNE_TRANSFORMEE,
  D,
  IMPREVUS,
  LISSAGE,
  MISE_AUX_NORMES,
  MONTBARD_NEUF,
  PLAFOND,
  REGROUPEMENT,
  RENOVATION_AUXONNE,
  RENOVATION_MONTBARD,
  SCENARIOS,
  TAUX_EMPRUNT,
  argiles,
  hasard,
  hausse,
  journeesTarif,
  simuler,
  transfertRefuse,
} from "../../src/engine/episodes/reconstruire-ou-regrouper";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/reconstruire-ou-regrouper";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_RECONSTRUCTION,
  HAUSSE_MONTBARD,
  ecartAuPlafond,
} from "../../src/pedagogy/episodes/reconstruire-ou-regrouper";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Reconstruire ou regrouper » enseigne qu'un investissement en
 * EHPAD se juge sur ses flux différentiels pour l'association et sur ce qu'il
 * fait au prix de journée payé par les résidents, au regard du plafond du
 * département ; que l'aide à l'investissement et les besoins du territoire
 * comptent ; et que la voie la moins chère à construire n'est pas la
 * meilleure. Ces tests verrouillent les classements qui le disent, et
 * recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [2, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 0, 0, 2, 0];
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
const deuxDecimales = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_RECONSTRUCTION.contexte(
    EPISODE_RECONSTRUCTION.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
/** Une graine sans hausse des taux ni du coût de construction avant la semaine 4. */
const graineCalme = GRAINES_DU_BILAN.find((g) =>
  hasard(g).imprevus.every(
    (i) => !["taux", "indice"].includes(i.imprevu.id) || i.semaine > ETAPES[D.dossier]!.jusqua,
  ),
)!;

describe("le modèle des EHPAD d'Auxonne et de Montbard", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[5]!.demandes).toBe(
      simuler(REFLEXE, 12).semaines[5]!.demandes,
    );
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(ATTENTISTE, 12).scenario);
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

  it("les trois scénarios du territoire tombent à peu près aux fréquences annoncées", () => {
    SCENARIOS.forEach((s, i) => {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === i).length;
      expect(n / GRAINES_DU_BILAN.length).toBeGreaterThan(s.chance - 0.2);
      expect(n / GRAINES_DU_BILAN.length).toBeLessThan(s.chance + 0.2);
    });
  });

  it("les suites des décisions ne tombent que sur qui les a prises", () => {
    const bourg = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).argiles).length;
    expect(bourg).toBeGreaterThan(3);
    expect(bourg).toBeLessThan(16);
    expect(GRAINES_DU_BILAN.some((g) => simuler([2, 1, 1, 1, 2, 1], g).argiles)).toBe(false);
    expect(GRAINES_DU_BILAN.some((g) => argiles(g) && !simuler(MEILLEUR, g).argiles)).toBe(false);
    const refus = GRAINES_DU_BILAN.filter((g) => transfertRefuse([1, 0, 1, 1, 1, 1], g)).length;
    expect(refus).toBeGreaterThan(8);
    expect(GRAINES_DU_BILAN.some((g) => transfertRefuse(MEILLEUR, g))).toBe(false);
    const rumeurs = (annonce: number) =>
      GRAINES_DU_BILAN.filter((g) => simuler([2, 1, 1, 1, 1, annonce], g).rumeur).length;
    expect(rumeurs(0)).toBeGreaterThan(rumeurs(1) + 8);
  });

  it("ne rien faire détruit de la valeur, sans absurdité ; la valeur de la semaine 13 est l'objectif", () => {
    const neutre = attendu(ATTENTISTE);
    expect(neutre).toBeLessThan(-1000000);
    expect(neutre).toBeGreaterThan(-3000000);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la hausse de Montbard, que la semaine 1 demande, se pose avec les charges qui disparaissent", () => {
    const op = MONTBARD_NEUF;
    const journees = 70 * 365 * 0.97;
    const aLaMain =
      (op.cout / op.duree +
        TAUX_EMPRUNT * (op.cout - op.fondsPropres) -
        op.disparait -
        op.economies) /
      journees;
    expect(journeesTarif(op)).toBeCloseTo(journees, 6);
    expect(HAUSSE_MONTBARD).toBeCloseTo(aLaMain, 9);
    expect(HAUSSE_MONTBARD).toBeCloseTo(17.75, 2);
    expect(EPISODE_RECONSTRUCTION.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(17.754, 3);
    const texte = source(0, "financement", []);
    expect(texte).toContain(`${nombreFr(op.cout / 1e6)} M€ toutes dépenses comprises`);
    expect(texte).toContain(
      `${((op.cout - op.fondsPropres) / 1e6).toFixed(1).replace(".", ",")} M€ sur vingt-cinq ans à 3,5 %`,
    );
    expect(texte).toContain(`${op.disparait / 1000} k€ de charges par an`);
    expect(texte).toContain(`${op.economies / 1000} k€ d'énergie`);
  });

  it("les hausses et les coûts des autres voies sont ceux que la semaine 1 affiche", () => {
    const texte = source(0, "voies", []);
    expect(texte).toContain(
      `hausse de ${deuxDecimales(hausse(RENOVATION_AUXONNE))} € par jour à Auxonne`,
    );
    expect(texte).toContain(`${deuxDecimales(hausse(RENOVATION_MONTBARD))} € à Montbard`);
    expect(hausse(RENOVATION_MONTBARD)).toBeLessThan(PLAFOND);
    expect(texte).toContain(`hausse de ${deuxDecimales(hausse(REGROUPEMENT))} € par jour`);
    expect(texte).toContain(`hausse de ${deuxDecimales(hausse(AUXONNE_TRANSFORMEE))} €`);
    expect(texte).toContain(`hausse de ${deuxDecimales(hausse(MISE_AUX_NORMES))} €`);
    expect(texte).toContain(
      `${nombreFr((RENOVATION_AUXONNE.cout + RENOVATION_MONTBARD.cout) / 1e6, 1)} M€`,
    );
    expect(texte).toContain(
      `${RENOVATION_AUXONNE.transition / 1000 + RENOVATION_MONTBARD.transition / 1000} k€ de places gelées`,
    );
    expect(texte).toContain(`${REGROUPEMENT.horsHebergement[1] / 1000} k€ par an d'économies`);
    expect(ETAPES[0]!.options[2]!.d).toContain(
      `${nombreFr((MONTBARD_NEUF.cout + AUXONNE_TRANSFORMEE.cout) / 1e6, 2)} M€`,
    );
  });

  it("l'écart au plafond de la semaine 4 se recalcule à la main", () => {
    const e = ecartAuPlafond(2);
    const j = journeesTarif(MONTBARD_NEUF);
    expect(e.deficitSansAide).toBeCloseTo((HAUSSE_MONTBARD - PLAFOND) * j, 6);
    const avecAide = hausse(MONTBARD_NEUF, { aide: MONTBARD_NEUF.aide });
    expect(avecAide).toBeCloseTo(
      HAUSSE_MONTBARD - (MONTBARD_NEUF.aide * (1 / 35 + TAUX_EMPRUNT)) / j,
      9,
    );
    let ecart = 0;
    for (let k = 0; k < LISSAGE.long; k += 1)
      ecart += HAUSSE_MONTBARD - Math.min(HAUSSE_MONTBARD, PLAFOND + 1.5 * k);
    expect(e.lissageSansAide).toBeCloseTo(ecart * j, 6);
    const texte = source(2, "plafond", [2, 1], graineCalme);
    expect(texte).toContain(`Montbard ${deuxDecimales(HAUSSE_MONTBARD)} € par jour hors aide`);
    expect(texte).toContain(`${deuxDecimales(avecAide)} € avec`);
    expect(texte).toContain(`${k(e.deficitSansAide)} k€ par an de déficit d'hébergement`);
    expect(texte).toContain(`${k(ecart * j)} k€ au total sans aide`);
  });
});

/** Un nombre à la française, à la décimale près. */
function nombreFr(v: number, d = 2) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: d });
}
function k(v: number) {
  return Math.round(v / 1000).toLocaleString("fr-FR");
}

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : reconstruire Montbard et transformer Auxonne bat nettement la rénovation et le regroupement", () => {
    const r = rejeu(MEILLEUR, D.voie);
    expect(classement(MEILLEUR, D.voie)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(1000000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(500000);
    expect(r[3]!.attendu).toBeLessThan(r[0]!.attendu);
  });

  it("D2 : l'étude et la concertation battent le dépôt pressé", () => {
    const r = rejeu(MEILLEUR, D.dossier);
    expect(classement(MEILLEUR, D.dossier)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
  });

  it("D3 : le rattrapage par étapes bat la hausse présentée d'un coup, et ne compte que si la voie dépasse le plafond", () => {
    const r = rejeu(MEILLEUR, D.plafond);
    expect(classement(MEILLEUR, D.plafond)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(400000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(100000);
    const reno = rejeu([0, 1, 1, 1, 1, 1], D.plafond);
    expect(Math.abs(reno[1]!.attendu - reno[0]!.attendu)).toBeLessThan(100000);
  });

  it("D4 : ajuster le programme au territoire bat le maintenir, surtout avec l'étude", () => {
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.programme);
      return r[1]!.attendu - r[0]!.attendu;
    };
    expect(classement(MEILLEUR, D.programme)[0]).toBe(1);
    expect(classement(MEILLEUR, D.programme).at(-1)).toBe(2);
    expect(gain(MEILLEUR)).toBeGreaterThan(200000);
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([2, 0, 1, 1, 1, 1]) + 150000);
  });

  it("D5 : la friche du bourg est la meilleure en moyenne, le site actuel le plus sûr, la zone d'activités la pire", () => {
    const r = rejeu(MEILLEUR, D.terrain);
    expect(classement(MEILLEUR, D.terrain)).toEqual([1, 2, 0]);
    expect(plusSure(MEILLEUR, D.terrain)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
  });

  it("D6 : tout dire au conseil de la vie sociale bat le silence", () => {
    const r = rejeu(MEILLEUR, D.annonce);
    expect(classement(MEILLEUR, D.annonce)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
  });

  it("la méthode bat nettement le moins cher à construire et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(1500000);
    expect(bonne! - attentiste!).toBeGreaterThan(1500000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_RECONSTRUCTION, MEILLEUR, d, JOURS);
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
      ["voies", "financement"],
      ["comite"],
      ["plafond"],
      ["conclusions"],
      ["terrains"],
      ["rumeurs"],
    ],
    jours: JOURS,
    diagnostic: "differentiel",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 17.75,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RECONSTRUCTION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne plus juger au coût de construction", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_RECONSTRUCTION.comportements(
      p,
      analyser(EPISODE_RECONSTRUCTION, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RECONSTRUCTION.axe(c).titre).toBe(
      "Le moins cher à construire n'est pas le moins cher",
    );
  });

  it("à qui a décidé sans enquêter, propose de calculer avant de choisir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RECONSTRUCTION.comportements(
      p,
      analyser(EPISODE_RECONSTRUCTION, p).trimestre,
    );
    expect(EPISODE_RECONSTRUCTION.axe(c).titre).toBe("Calculer avant de choisir");
  });

  it("juge la hausse calculée en semaine 1 : juste, proche, ou faute d'une notion", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_RECONSTRUCTION.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    const op = MONTBARD_NEUF;
    expect(score(17.75)).toBe(1);
    // À 100 % d'occupation au lieu de 97 % : 17,22 €.
    expect(score((HAUSSE_MONTBARD * 0.97) / 1)).toBe(0.6);
    // Sans les charges qui disparaissent : 20,26 €.
    expect(score(HAUSSE_MONTBARD + op.disparait / journeesTarif(op))).toBe(0);
    // L'annuité de l'emprunt à la place des amortissements et des intérêts : 15,95 €.
    const emprunt = op.cout - op.fondsPropres;
    const annuite = (emprunt * TAUX_EMPRUNT) / (1 - (1 + TAUX_EMPRUNT) ** -25);
    expect(score((annuite - op.disparait - op.economies) / journeesTarif(op))).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_RECONSTRUCTION.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/valeur créée/);
    expect(EPISODE_RECONSTRUCTION.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
