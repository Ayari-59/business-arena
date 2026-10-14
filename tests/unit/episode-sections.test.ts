import { describe, expect, it } from "vitest";
import {
  CAPACITE,
  CHARGES_DEPENDANCE,
  CHARGES_HEBERGEMENT,
  CHARGES_SOINS,
  COUT_VARIABLE_JOURNEE,
  D,
  DEFICIT_ERRD,
  ECONOMIES_HEBERGEMENT,
  GMP_REEL,
  GMP_VALIDE,
  IMPREVUS,
  JOURNEES_ERRD,
  JOURNEES_THEORIQUES,
  MASSES,
  OCCUPATION_CIBLE,
  PMP_REEL,
  PMP_VALIDE,
  POOL,
  POOL_NET,
  POSTES_DEPENDANCE,
  POSTES_SOINS,
  PRIX_JOURNEE,
  RESULTAT_ERRD,
  RESULTAT_RETRAITE,
  TOTAL_DEPENDANCE,
  TOTAL_HEBERGEMENT,
  TOTAL_SOINS,
  conseilImpose,
  conserve,
  coutDeLaJournee,
  forfaitDependance,
  forfaitSoins,
  hasard,
  simuler,
} from "../../src/engine/episodes/section-en-deficit";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/section-en-deficit";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_SECTIONS } from "../../src/pedagogy/episodes/section-en-deficit";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La section qui plonge » enseigne la lecture d'un budget d'EHPAD
 * par sections tarifaires : le déficit est à l'hébergement, que des postes
 * d'aides-soignants (imputés au soins et à la dépendance) ne financent pas ;
 * l'excédent de soins est repris par l'ARS ; une clé de répartition mal
 * appliquée déplace le résultat entre sections ; une coupe GMP-PMP préparée
 * relève les forfaits. Ces tests verrouillent les classements qui le disent,
 * et la cohérence des chiffres donnés au joueur avec les constantes du modèle.
 */

const MEILLEUR = [1, 0, 0, 0, 0, 1];
const REFLEXE = [0, 2, 2, 2, 1, 0];
const ATTENTISTE = [3, 1, 3, 3, 3, 3];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne, à la décision d. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
/** Un nombre écrit comme les sources l'écrivent : espace simple entre les milliers. */
const fr = (v: number, d = 0) =>
  v
    .toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })
    .replace(/[\u202f\u00a0]/g, " ");
/** Un montant en k€, écrit comme les sources l'écrivent. */
const ke = (v: number) => `${fr(Math.round(v / 1000))} k€`.replace("-", "−");
const signe = (v: number) => `${v > 0 ? "+" : ""}${ke(v)}`;
const euros2 = (v: number) => `${fr(v, 2)} €`;

describe("les chiffres donnés au joueur sont ceux du modèle", () => {
  it("le compte de l'hébergement donne −338 k€ à l'ERRD, la prévision", () => {
    const texte = source(0, "errd");
    expect(texte).toContain(fr(JOURNEES_ERRD));
    expect(texte).toContain(euros2(PRIX_JOURNEE));
    for (const v of Object.values(CHARGES_HEBERGEMENT)) expect(texte).toContain(ke(v));
    expect(Math.round(RESULTAT_ERRD.hebergement / 1000)).toBe(-338);
    expect(EPISODE_SECTIONS.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(-338, 0);
    // Le joueur qui additionne les lignes arrondies tombe à moins d'un k€ près.
    const arrondi = Object.values(CHARGES_HEBERGEMENT).reduce(
      (s, v) => s + Math.round(v / 1000),
      0,
    );
    expect(
      Math.abs((JOURNEES_ERRD * PRIX_JOURNEE) / 1000 - arrondi - RESULTAT_ERRD.hebergement / 1000),
    ).toBeLessThan(1);
  });

  it("les sections soins et dépendance, et le total de l'ERRD", () => {
    const texte = source(0, "sections");
    expect(texte).toContain(ke(forfaitSoins(GMP_VALIDE, PMP_VALIDE)));
    expect(texte).toContain(ke(TOTAL_SOINS));
    expect(texte).toContain(ke(forfaitDependance(GMP_VALIDE)));
    expect(texte).toContain(ke(TOTAL_DEPENDANCE));
    expect(texte).toContain(`excédent de ${ke(RESULTAT_ERRD.soins)}`);
    expect(texte).toContain(`déficit de ${ke(-RESULTAT_ERRD.dependance)}`);
    expect(Math.round(DEFICIT_ERRD / 1000)).toBe(-310);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(ke(-DEFICIT_ERRD));
    // La règle de répartition : 70 % soins pour les aides-soignants, 70 % hébergement pour les agents de service.
    expect(CHARGES_SOINS.as + CHARGES_DEPENDANCE.as).toBe(MASSES.asJour);
    expect(CHARGES_HEBERGEMENT.ash + CHARGES_DEPENDANCE.ash).toBe(MASSES.ash);
    expect(CHARGES_SOINS.as / MASSES.asJour).toBeCloseTo(0.7, 6);
    expect(TOTAL_HEBERGEMENT).toBe(Object.values(CHARGES_HEBERGEMENT).reduce((s, v) => s + v, 0));
  });

  it("corriger la ligne de nuit déplace 129 k€ entre sections, sans changer le total", () => {
    const texte = source(1, "repartition");
    expect(texte).toContain(ke(MASSES.asNuit));
    for (const v of [
      RESULTAT_ERRD.hebergement,
      RESULTAT_RETRAITE.hebergement,
      RESULTAT_RETRAITE.dependance,
      RESULTAT_RETRAITE.soins,
    ]) {
      expect(texte).toContain(ke(v));
    }
    expect(texte).toContain(signe(RESULTAT_ERRD.soins));
    const total = (s: { hebergement: number; dependance: number; soins: number }) =>
      s.hebergement + s.dependance + s.soins;
    expect(total(RESULTAT_RETRAITE)).toBeCloseTo(total(RESULTAT_ERRD), 6);
    // Ce que l'association garde : l'excédent de soins repris ne compense rien.
    expect(conserve(RESULTAT_RETRAITE) - conserve(RESULTAT_ERRD)).toBeCloseTo(
      RESULTAT_ERRD.soins,
      6,
    );
  });

  it("l'équation tarifaire, le coût de revient de la journée et la valeur d'un point d'occupation", () => {
    const texte = source(2, "equation", { cleCorrigee: true });
    expect(texte).toContain(ke(forfaitSoins(GMP_REEL, PMP_REEL)));
    expect(texte).toContain(ke(forfaitDependance(GMP_REEL)));
    expect(texte).toContain(
      ke(forfaitSoins(GMP_REEL, PMP_REEL) - forfaitSoins(GMP_VALIDE, PMP_VALIDE)),
    );
    expect(texte).toContain(ke(forfaitDependance(GMP_REEL) - forfaitDependance(GMP_VALIDE)));
    const retraite = TOTAL_HEBERGEMENT - MASSES.asNuit;
    expect(source(3, "cout", { cleCorrigee: true })).toContain(euros2(coutDeLaJournee(retraite)));
    expect(source(3, "cout", { cleCorrigee: true })).toContain(ke(retraite));
    expect(source(3, "cout", { cleCorrigee: true })).toContain(
      euros2(coutDeLaJournee(retraite) - PRIX_JOURNEE),
    );
    expect(source(3, "cout", { cleCorrigee: true })).toContain(
      fr(Math.round(JOURNEES_THEORIQUES * OCCUPATION_CIBLE)),
    );
    expect(source(3, "cout", {})).toContain(euros2(coutDeLaJournee(TOTAL_HEBERGEMENT)));
    // Un point d'occupation : 234 journées, 14 k€ de marge pour l'hébergement.
    const point = JOURNEES_THEORIQUES / 100;
    expect(source(4, "admissions")).toContain(`${Math.round(point)} journées`);
    expect(source(4, "admissions")).toContain(ke(point * (PRIX_JOURNEE - COUT_VARIABLE_JOURNEE)));
    expect(source(4, "admissions")).toContain(
      `${fr(28 * 45)} journées perdues, ${fr((28 * 45 * 100) / JOURNEES_THEORIQUES, 1)} points`,
    );
  });

  it("les chantiers de la fin : où tombe chaque économie", () => {
    const texte = source(5, "chantiers");
    expect(texte).toContain(ke(ECONOMIES_HEBERGEMENT));
    expect(texte).toContain(ke(POOL.interim));
    expect(texte).toContain(ke(POOL.coordination));
    expect(texte).toContain(ke(POOL_NET));
    expect(texte).toContain(`${ke(POSTES_SOINS)} au soins`);
    expect(texte).toContain(`${ke(POSTES_DEPENDANCE)} à la dépendance`);
    expect(CAPACITE * 7 * OCCUPATION_CIBLE).toBeCloseTo(EPISODE_SECTIONS.courbe.cible, 6);
  });
});

describe("le modèle des sections", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.occupation).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.occupation,
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

  it("le conseil impose la suppression environ une fois sur deux si l'on attend, jamais sinon", () => {
    const imposes = GRAINES_DU_BILAN.filter((g) => conseilImpose(ATTENTISTE, g)).length;
    expect(imposes / GRAINES_DU_BILAN.length).toBeGreaterThan(0.3);
    expect(imposes / GRAINES_DU_BILAN.length).toBeLessThan(0.7);
    expect(GRAINES_DU_BILAN.some((g) => conseilImpose(MEILLEUR, g))).toBe(false);
  });

  it("supprimer les postes ne touche pas l'hébergement, et la part soins est reprise", () => {
    const garde = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g, JOURS));
    const coupe = GRAINES_DU_BILAN.map((g) => simuler([0, ...MEILLEUR.slice(1)], g, JOURS));
    // L'hébergement se dégrade (chambres moins remplies), il ne s'améliore pas.
    expect(moyenne(coupe.map((t) => t.sections.hebergement))).toBeLessThan(
      moyenne(garde.map((t) => t.sections.hebergement)),
    );
    // Le résultat gardé baisse alors que 86 k€ de charges disparaissent.
    expect(
      moyenne(garde.map((t) => t.objectif)) - moyenne(coupe.map((t) => t.objectif)),
    ).toBeGreaterThan(30000);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        for (const s of t.semaines.slice(1)) {
          expect(s!.occupation).toBeGreaterThan(0.86);
          expect(s!.occupation).toBeLessThan(0.995);
          expect(s!.absenteisme).toBeLessThan(0.3);
        }
        expect(t.objectif).toBeGreaterThan(-500000);
        expect(t.objectif).toBeLessThan(0);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : présenter le résultat par section ; supprimer les postes est le pire", () => {
    const c = classement(MEILLEUR, D.conseil);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.conseil, 1, 0)).toBeGreaterThan(40000);
    expect(ecart(MEILLEUR, D.conseil, 1, 2)).toBeGreaterThan(15000);
    // Attendre expose à la suppression votée par le conseil : le pire cas est bien plus bas.
    const r = rejeu(MEILLEUR, D.conseil);
    expect(r[1]!.p10 - r[3]!.p10).toBeGreaterThan(25000);
  });

  it("D2 : corriger la ligne de nuit ; charger le soins d'agents de service ne vaut pas mieux que ne rien faire", () => {
    const c = classement(MEILLEUR, D.nuit);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.nuit, 0, 1)).toBeGreaterThan(80000);
    expect(ecart(MEILLEUR, D.nuit, 0, 3)).toBeGreaterThan(15000);
    expect(ecart(MEILLEUR, D.nuit, 0, 2)).toBeGreaterThan(80000);
  });

  it("D3 : préparer la coupe ; elle vaut bien plus quand la ligne de nuit est corrigée", () => {
    const c = classement(MEILLEUR, D.coupe);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(3);
    expect(ecart(MEILLEUR, D.coupe, 0, 1)).toBeGreaterThan(15000);
    // L'interaction : sans correction, le gain de forfait soins part en excédent repris.
    const sansCorrection = [1, 1, 0, 0, 0, 1];
    expect(ecart(MEILLEUR, D.coupe, 0, 3)).toBeGreaterThan(
      ecart(sansCorrection, D.coupe, 0, 3) + 20000,
    );
    // Espérance et robustesse : la demande sans préparation a un meilleur pire cas.
    const r = rejeu(MEILLEUR, D.coupe);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10);
  });

  it("D4 : demander au département le rattrapage du prix de journée ; l'ARS n'est pas la bonne autorité", () => {
    const c = classement(MEILLEUR, D.prix);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.prix, 0, 2)).toBeGreaterThan(30000);
    expect(ecart(MEILLEUR, D.prix, 2, 3)).toBeCloseTo(0, 6);
    // Le dossier ne convainc que si la répartition est juste.
    const sansCorrection = [1, 1, 0, 0, 0, 1];
    expect(ecart(MEILLEUR, D.prix, 0, 3)).toBeGreaterThan(
      ecart(sansCorrection, D.prix, 0, 3) + 20000,
    );
  });

  it("D5 : raccourcir le circuit d'admission, surtout quand l'équipe est entière", () => {
    const c = classement(MEILLEUR, D.admissions);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.admissions, 0, 1)).toBeGreaterThan(10000);
    const postesSupprimes = [0, ...MEILLEUR.slice(1)];
    expect(ecart(MEILLEUR, D.admissions, 0, 3)).toBeGreaterThan(
      ecart(postesSupprimes, D.admissions, 0, 3) + 10000,
    );
  });

  it("D6 : économiser à l'hébergement en moyenne ; le pool de nuit est le plus sûr ; supprimer les postes est le pire", () => {
    const r = rejeu(MEILLEUR, D.chantier);
    const c = classement(MEILLEUR, D.chantier);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(ecart(MEILLEUR, D.chantier, 1, 0)).toBeGreaterThan(30000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_SECTIONS, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}, option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option === o && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    for (const [d, o] of REFLEXES) expect(REFERENCES[0].chemin[d]).not.toBe(o);
  });

  it("lire par section bat nettement les coupes de postes et l'attentisme, en moyenne", () => {
    const [sections, coupes, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(sections! - attentiste!).toBeGreaterThan(150000);
    expect(sections! - coupes!).toBeGreaterThan(150000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["errd", "sections"],
      ["repartition"],
      ["equation"],
      ["cout"],
      ["admissions"],
      ["chantiers"],
    ],
    jours: 2,
    diagnostic: "hebergement",
    reevaluation: { choix: "maintient", principal: null },
    prevision: -338,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SECTIONS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a coupé dans les postes, propose de ne pas couper là où l'argent ne revient pas", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SECTIONS.comportements(p, analyser(EPISODE_SECTIONS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SECTIONS.axe(c).titre).toBe("Ne pas couper là où l'argent ne revient pas");
  });

  it("à qui a décidé sans enquêter, propose de lire le résultat section par section", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SECTIONS.comportements(p, analyser(EPISODE_SECTIONS, p).trimestre);
    expect(EPISODE_SECTIONS.axe(c).titre).toBe("Lire le résultat section par section");
  });

  it("calibre la prévision sur la section hébergement de l'ERRD", () => {
    const faux = EPISODE_SECTIONS.comportements(
      partie(MEILLEUR, { prevision: -310 }),
      simuler(MEILLEUR, 11, 2),
    );
    expect(faux[3]!.score).toBe(0);
    const juste = EPISODE_SECTIONS.comportements(partie(MEILLEUR), simuler(MEILLEUR, 11, 2));
    expect(juste[3]!.score).toBe(1);
    expect(juste[4]!.score).toBeGreaterThanOrEqual(0.6);
    expect(EPISODE_SECTIONS.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/au-delà/);
  });
});
