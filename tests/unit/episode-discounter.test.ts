import { describe, expect, it } from "vitest";
import {
  BAISSE_GENERALE,
  BAISSE_NORD,
  CARTE,
  CLIENTS,
  CONTRAT,
  COUT_BAISSE_GENERALE,
  D,
  ECART_TARVAL,
  FABRICANT,
  GROUPES,
  IMPREVUS,
  PART_EXPOSEE,
  SCENARIO,
  TAUX_DE_MARQUE,
  ZONE,
  alignement,
  hasard,
  simuler,
  tarvalSuit,
} from "../../src/engine/episodes/discounter-qui-arrive";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/discounter-qui-arrive";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  COUT_SUIVRE,
  EPISODE_DISCOUNTER,
  RFA_ANNUELLE,
  coutDeLaRiposte,
} from "../../src/pedagogy/episodes/discounter-qui-arrive";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le discounter qui arrive » enseigne trois choses : toute la
 * clientèle n'est pas exposée à un discounter, et la riposte juste aligne ce
 * qui se compare, là où l'on compare, au lieu de payer une baisse à ceux qui
 * ne partiraient pas ; un concurrent qui a huit points de frais de moins
 * suit une baisse large, et chacune de ses promotions qu'on suit l'invite à
 * recommencer ; ce qu'il ne sait pas faire se renforce, et se teste. Il fait
 * aussi réviser : les premiers chiffres montrent que les PME du nord partent
 * pour les palettes, hors de la zone que la riposte couvrait. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 2, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [2, 3, 2, 3, 1, 3];
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
const k = (v: number) => Math.round(v / 1000);
const fr = (v: number, d = 1) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_DISCOUNTER.contexte(
    EPISODE_DISCOUNTER.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la riposte", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).conquete).toBe(simuler(REFLEXE, 12).conquete);
    expect(simuler(MEILLEUR, 12).forte).toBe(simuler(ATTENTISTE, 12).forte);
    // Avant l'ouverture de Tarval, rien ne distingue les décisions.
    expect(simuler(MEILLEUR, 12).semaines[2]!.marge).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.marge,
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

  it("Tarval vise la part de marché environ quatre trimestres sur dix", () => {
    const oui = GRAINES_DU_BILAN.filter((g) => hasard(g).conquete).length;
    expect(oui / GRAINES_DU_BILAN.length).toBeGreaterThan(SCENARIO.chance - 0.15);
    expect(oui / GRAINES_DU_BILAN.length).toBeLessThan(SCENARIO.chance + 0.15);
  });

  it("Tarval ne suit qu'une baisse ; il suit d'autant plus qu'elle est large", () => {
    const suivis = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => tarvalSuit(c, g)).length;
    expect(suivis(ATTENTISTE)).toBe(0);
    expect(suivis(REFLEXE)).toBeGreaterThan(suivis(MEILLEUR) + 8);
    expect(suivis(MEILLEUR)).toBeLessThanOrEqual(3);
  });

  it("ne rien faire coûte cher ; la riposte ciblée limite la perte, le réflexe l'aggrave", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(-650000);
    expect(bon).toBeLessThan(-300000);
    expect(attendu(ATTENTISTE)).toBeLessThan(bon - 250000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-1200000);
    expect(attendu(REFLEXE)).toBeLessThan(attendu(ATTENTISTE) - 500000);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.trimestre + t.positions).toBeCloseTo(t.objectif, 6);
  });

  it("garde des marges hebdomadaires réalistes, même sur le chemin des réflexes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 7, 18]) {
        for (const s of simuler(c, g, JOURS).semaines.slice(1)) {
          expect(s!.marge).toBeGreaterThan(120000);
          expect(s!.marge).toBeLessThan(230000);
          expect(s!.pme).toBeGreaterThan(0.2);
        }
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la marge que coûterait la baisse générale, que la semaine 1 demande, se pose sur la base enlevée", () => {
    const a = CLIENTS.artisans.ca * CLIENTS.artisans.base * 52;
    const p = CLIENTS.pme.ca * CLIENTS.pme.base * 52;
    expect(COUT_BAISSE_GENERALE).toBeCloseTo(BAISSE_GENERALE * (a + p), 6);
    expect(COUT_BAISSE_GENERALE / 1000).toBeCloseTo(649, 0);
    expect(EPISODE_DISCOUNTER.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(649, 0);
    const texte = source(0, "ventes", []);
    expect(texte).toContain(`dont ${fr(a / 1e6, 2)} M€ de produits de base`);
    expect(texte).toContain(`dont ${fr(p / 1e6, 2)} M€ de base`);
    expect(texte).toContain(`Taux de marque : ${TAUX_DE_MARQUE.base * 100} %`);
  });

  it("la part exposée est la base enlevée dans la zone, rapportée au chiffre d'affaires", () => {
    const zone = GROUPES.filter((g) => g.zone).reduce((s, g) => s + g.base, 0);
    const ca = CLIENTS.artisans.ca + CLIENTS.pme.ca + CLIENTS.entreprises.ca;
    expect(PART_EXPOSEE).toBeCloseTo(zone / ca, 9);
    expect(zone).toBeCloseTo(
      ZONE * (CLIENTS.artisans.ca * CLIENTS.artisans.base + CLIENTS.pme.ca * CLIENTS.pme.base),
      6,
    );
    expect(source(0, "ventes", [])).toContain(
      `La base enlevée dans la zone pèse ${fr(PART_EXPOSEE * 100)} %`,
    );
  });

  it("ramener l'écart à 4 % demande les baisses que le relevé affiche", () => {
    expect(alignement(ECART_TARVAL.comptoir)).toBeCloseTo(1 - 0.88 / 0.96, 9);
    const texte = source(0, "tarval", []);
    expect(texte).toContain(
      `${fr(alignement(ECART_TARVAL.comptoir) * 100)} % de baisse sur le panier du comptoir`,
    );
    expect(texte).toContain(`${fr(alignement(ECART_TARVAL.palette) * 100)} % sur les palettes`);
  });

  it("la remise du fabricant, et ce que coûte de suivre l'opération de Tarval, sont ceux affichés", () => {
    const base = GROUPES.reduce((s, g) => s + g.base, 0) + CLIENTS.entreprises.ca * 0.24;
    expect(RFA_ANNUELLE).toBeCloseTo(0.03 * 0.3 * (1 - 0.21) * base * 52, 6);
    expect(k(RFA_ANNUELLE)).toBe(98);
    expect(source(2, "rfa", [1, 2])).toContain(`À volumes tenus : ${k(RFA_ANNUELLE)} k€ par an`);
    expect(COUT_SUIVRE).toBeCloseTo(0.05 * 0.45 * 66000 + 0.0675 * 0.7 * 90000, 6);
    expect(source(4, "operations", [1, 2, 1, 1])).toContain(
      `Suivre partout coûte ${k(COUT_SUIVRE)} k€ de marge par semaine`,
    );
  });

  it("ce que la riposte paie à ceux qui ne partiraient pas est ce que la source affiche", () => {
    const ciblee = coutDeLaRiposte(1);
    const generale = coutDeLaRiposte(0);
    // La riposte ciblée : les références comparées de la zone, dont 30 % ne retiennent personne.
    const az = GROUPES.find((g) => g.cle === "artisansZone")!;
    const pz = GROUPES.find((g) => g.cle === "pmeZone")!;
    const cible =
      (alignement(az.ecart) * az.comparees * az.base +
        alignement(pz.ecart) * pz.comparees * pz.base) *
      52;
    expect(ciblee.total).toBeCloseTo(cible, 6);
    expect(ciblee.inutile).toBeCloseTo(0.3 * cible, 6);
    // La baisse générale coûte ce que la semaine 1 demande, et plus de la moitié va à ceux qui restent.
    expect(generale.total).toBeCloseTo(COUT_BAISSE_GENERALE, 6);
    expect(generale.inutile / generale.total).toBeGreaterThan(0.5);
    expect(source(5, "retenu", [1, 2, 1, 1, 1])).toContain(
      `coûte ${k(ciblee.total)} k€ de marge par an, à volumes constants ; ${k(ciblee.inutile)} k€`,
    );
  });

  it("les options disent les taux du modèle", () => {
    expect(ETAPES[0]!.options[0]!.t).toContain(`${BAISSE_GENERALE * 100} %`);
    expect(ETAPES[2]!.options[1]!.d).toContain(`${FABRICANT.rfa * 100} %`);
    expect(ETAPES[3]!.options[0]!.t).toContain(`${CARTE * 100} %`);
    expect(ETAPES[3]!.options[1]!.t).toContain(`${CONTRAT.ristourne * 100} %`);
    expect(ETAPES[3]!.options[2]!.t).toContain(`${BAISSE_NORD * 100} %`);
  });

  it("en semaine 6, la source montre que les PME du nord partent plus que les artisans", () => {
    for (const g of [1, 3, 9]) {
      const l = EPISODE_DISCOUNTER.lire(MEILLEUR.slice(0, 3), g, 0, 6);
      expect(l.pmeNord!).toBeLessThan(l.artisansZone! - 0.1);
      expect(l.pmeNord!).toBeLessThan(l.pmeZone!);
    }
    expect(source(3, "detail", [1, 2, 1])).toMatch(/PME des trois agences du nord \d+ %/);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la riposte ciblée bat la baisse générale, qui ne vaut pas mieux que de ne rien faire", () => {
    const r = rejeu(MEILLEUR, D.riposte);
    expect(classement(MEILLEUR, D.riposte)[0]).toBe(1);
    expect(classement(MEILLEUR, D.riposte).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
  });

  it("D2 : tester la livraison avant de l'étendre bat l'engagement immédiat ; la campagne prix est la pire", () => {
    const r = rejeu(MEILLEUR, D.livraison);
    expect(classement(MEILLEUR, D.livraison)[0]).toBe(2);
    expect(classement(MEILLEUR, D.livraison).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
  });

  it("D3 : la remise conditionnelle bat la pression sur le fabricant", () => {
    const r = rejeu(MEILLEUR, D.fabricant);
    expect(classement(MEILLEUR, D.fabricant)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
  });

  it("D4 : changer de cible vers les PME du nord bat le cap des artisans", () => {
    const r = rejeu(MEILLEUR, D.nord);
    expect(classement(MEILLEUR, D.nord)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
    // Sans livraison pour retenir les PME, le contrat est seul à le faire : il vaut davantage.
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.nord);
      return x[1]!.attendu - x[3]!.attendu;
    };
    expect(gain([1, 3, 1, 1, 1, 1])).toBeGreaterThan(gain(MEILLEUR) + 5000);
  });

  it("D5 : ne pas suivre l'opération est le meilleur en moyenne, la garantie aux PME le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.promo);
    expect(classement(MEILLEUR, D.promo)[0]).toBe(1);
    expect(classement(MEILLEUR, D.promo).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.promo)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    // Sans riposte dans la zone, la garantie aux PME devient la meilleure : elles n'ont rien d'autre.
    expect(classement(ATTENTISTE, D.promo)[0]).toBe(2);
  });

  it("D6 : recentrer bat les prix garantis et le dépôt à bas prix, d'autant plus après une baisse générale", () => {
    const r = rejeu(MEILLEUR, D.cap);
    expect(classement(MEILLEUR, D.cap)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(80000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.cap);
      return x[1]!.attendu - x[3]!.attendu;
    };
    expect(gain([0, 2, 1, 1, 1, 1])).toBeGreaterThan(gain(MEILLEUR) + 100000);
  });

  it("la riposte ciblée bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(1000000);
    expect(bonne! - attentiste!).toBeGreaterThan(250000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_DISCOUNTER, MEILLEUR, d, JOURS);
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
      ["ventes", "tarval"],
      ["livraison"],
      ["rfa"],
      ["detail"],
      ["operations"],
      ["retenu"],
    ],
    jours: JOURS,
    diagnostic: "exposition",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 650,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DISCOUNTER, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne pas payer ceux qui ne partiraient pas", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DISCOUNTER.comportements(p, analyser(EPISODE_DISCOUNTER, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DISCOUNTER.axe(c).titre).toBe("Ne pas payer ceux qui ne partiraient pas");
  });

  it("à qui a décidé sans enquêter, propose de savoir qui achète quoi avant de riposter", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DISCOUNTER.comportements(p, analyser(EPISODE_DISCOUNTER, p).trimestre);
    expect(EPISODE_DISCOUNTER.axe(c).titre).toBe(
      "Savoir qui achète quoi, et où, avant de riposter",
    );
  });

  it("juge le coût calculé en semaine 1 : juste, proche, ou faute d'avoir compté sur le chiffre d'affaires", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_DISCOUNTER.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(649)).toBe(1);
    expect(score(680)).toBe(0.6);
    // 8 % de la marge au lieu de 8 % du chiffre d'affaires : 649 × 21 % ≈ 136 k€.
    expect(score(136)).toBe(0);
    // Toute la base, entreprises livrées comprises : ≈ 1 108 k€.
    expect(score(1108)).toBe(0);
  });

  it("dit qui a protégé le segment qui compte, et qui ne l'a pas suivi", () => {
    const c = (chemin: readonly number[]) =>
      EPISODE_DISCOUNTER.comportements(partie(chemin), simuler(chemin, 11, JOURS))[4]!;
    expect(c(MEILLEUR).score).toBe(1);
    expect(c([1, 2, 1, 0, 1, 1]).score).toBe(0.6);
    expect(c(ATTENTISTE).score).toBe(0);
  });

  it("dit le résultat en valeur perdue sur le plan", () => {
    expect(EPISODE_DISCOUNTER.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/valeur perdue/);
    expect(EPISODE_DISCOUNTER.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
  });
});
