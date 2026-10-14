import { describe, expect, it } from "vitest";
import {
  CONTRATS,
  D,
  GAMMES,
  IMPREVUS,
  MAGASINS,
  MAGASINS_TEST,
  MULTIPLE,
  PRIX_CESSION,
  REFERENCEMENT,
  SOUTIEN,
  accordImportateur,
  chanceDAccord,
  erreurDEtiquette,
  hasard,
  margeParPack,
  perteFrais,
  rotation,
  scenario,
  seuilDeGeneralisation,
  simuler,
} from "../../src/engine/episodes/export-a-ouvrir";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/export-a-ouvrir";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_EXPORT,
  MARGE_DE_L_OFFRE,
  chiffresDesRoutes,
  moyenneDuTest,
} from "../../src/pedagogy/episodes/export-a-ouvrir";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les desserts qui plaisent à l'export » enseigne qu'un marché
 * étranger s'ouvre sur ce que le produit supporte (la DLC des desserts frais
 * ne survit pas à la route, les UHT si), sur le partage de la valeur et du
 * risque avec l'importateur (une exclusivité courte, conditionnée à des
 * objectifs, plutôt que cinq ans sans contrepartie ou une filiale d'emblée),
 * et par étapes (un test, puis une généralisation décidée sur sa rotation de
 * fond). Ces tests verrouillent les classements qui le disent, et
 * recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 2];
const ATTENTISTE = [3, 0, 0, 2, 2, 2];
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_EXPORT.contexte(
    EPISODE_EXPORT.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const fr = (v: number, d: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

describe("le modèle de l'entrée en Espagne", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
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

  it("les trois accueils du marché tombent chacun, à peu près aux chances de l'étude", () => {
    for (const s of ["fort", "moyen", "faible"] as const) {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length;
      expect(n / 30).toBeGreaterThan(scenario(s).chance - 0.2);
      expect(n / 30).toBeLessThan(scenario(s).chance + 0.2);
    }
  });

  it("l'erreur d'étiquette ne frappe que le sur-étiquetage, environ trois fois sur dix", () => {
    const erreurs = GRAINES_DU_BILAN.filter((g) => erreurDEtiquette([1, 1, 0, 1, 1, 1], g));
    expect(erreurs.length).toBeGreaterThan(3);
    expect(erreurs.length).toBeLessThan(16);
    expect(GRAINES_DU_BILAN.some((g) => erreurDEtiquette(MEILLEUR, g))).toBe(false);
  });

  it("l'importateur répond au hasard selon la proposition, et doute devant une filiale", () => {
    const oui = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => accordImportateur(c, g)).length;
    expect(oui([1, 1, 1, 1, 1, 2])).toBe(30);
    expect(oui(MEILLEUR)).toBeLessThan(30);
    expect(oui(MEILLEUR)).toBeGreaterThan(oui([1, 1, 1, 0, 1, 1]));
    expect(oui([1, 1, 1, 2, 1, 3])).toBeLessThan(oui([1, 1, 1, 2, 1, 1]));
  });

  it("décliner coûte la crème de l'importateur, et rien d'autre", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(simuler(ATTENTISTE, g, 0).objectif).toBeCloseTo(-20000 * MULTIPLE, 6);
    }
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la marge de l'offre dans le scénario moyen, que la semaine 1 demande", () => {
    const g = GAMMES.frais;
    const vendus = MAGASINS * 16 * 52;
    const livres = vendus / (1 - 0.12);
    const aLaMain = vendus * PRIX_CESSION - livres * (g.cout + g.transport) - SOUTIEN;
    expect(MARGE_DE_L_OFFRE).toBeCloseTo(aLaMain, 6);
    expect(MARGE_DE_L_OFFRE / 1000).toBeCloseTo(42.0, 1);
    expect(EPISODE_EXPORT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(42.0, 1);
    expect(perteFrais(g.dlc - 7, 1)).toBeCloseTo(0.12, 9);
    const texte = source(0, "offre", []);
    expect(texte).toContain(`${fr(PRIX_CESSION, 2)} € le pack`);
    expect(texte).toContain(`${fr(g.cout + g.transport, 2)} €`);
    expect(texte).toContain("21 jours de DLC sur 28");
    expect(texte).toContain(`${SOUTIEN / 1000} k€ par an`);
    expect(texte).toContain(`soit ${(REFERENCEMENT * MAGASINS) / 1000} k€`);
    const etude = source(0, "etude", []);
    for (const s of ["fort", "moyen", "faible"] as const) {
      expect(etude).toContain(`${scenario(s).rotation} packs`);
    }
  });

  it("la route : DLC à la réception, pertes et marge de chaque gamme", () => {
    const r = chiffresDesRoutes();
    expect(r.plateforme.dlc).toBe(21);
    expect(r.direct.dlc).toBe(25);
    expect(r.uht.dlc).toBe(113);
    expect(r.plateforme.marge).toBeCloseTo(PRIX_CESSION - 1.14 / 0.88, 9);
    expect(r.uht.marge).toBeCloseTo(PRIX_CESSION - 1.08 / 0.99, 9);
    expect(r.uht.parMagasin).toBeGreaterThan(r.direct.parMagasin);
    expect(r.direct.parMagasin).toBeGreaterThan(r.plateforme.parMagasin);
    const texte = source(1, "routes", [1]);
    expect(texte).toContain(`${fr(r.plateforme.marge, 2)} € de marge par pack vendu`);
    expect(texte).toContain(`${fr(r.uht.parMagasin, 2)} € par magasin et par semaine`);
    expect(texte).toContain("19 % de pertes par la plateforme");
  });

  it("le test : rotation de fond, moyenne trompeuse de l'importateur, seuil de généralisation", () => {
    const seuil = seuilDeGeneralisation(MEILLEUR, "moyen");
    const m = margeParPack(MEILLEUR, "moyen");
    expect(seuil).toBeCloseTo(
      (SOUTIEN + (REFERENCEMENT * (MAGASINS - MAGASINS_TEST)) / MULTIPLE) / (m * MAGASINS * 52),
      9,
    );
    // Graine 3 : accueil moyen.
    expect(hasard(3).scenario).toBe("moyen");
    const rot = rotation(MEILLEUR, "moyen", false);
    const texte = source(4, "lecture", [1, 1, 1, 1]);
    expect(texte).toContain(`${fr(rot, 1)} packs par magasin`);
    expect(texte).toContain(`${fr(seuil, 1)} packs`);
    expect(texte).toContain("au-dessus du seuil");
    expect(source(4, "moyenne", [1, 1, 1, 1])).toContain(`${fr(moyenneDuTest(rot), 1)} packs`);
    // Dans un marché faible, le test passe sous le seuil.
    expect(rotation(MEILLEUR, "faible", false)).toBeLessThan(
      seuilDeGeneralisation(MEILLEUR, "faible"),
    );
  });

  it("les chances que Nevaria accepte chaque contrat sont celles que la source affiche", () => {
    const avec = (relais: number, contrat: number) => chanceDAccord([1, 1, 1, relais, 1, contrat]);
    expect(avec(1, 1)).toBeCloseTo(CONTRATS.deuxAns.accord + 0.05, 9);
    expect(avec(0, 1)).toBeCloseTo(CONTRATS.deuxAns.accord * 0.6, 9);
    const texte = source(5, "contrats", [1, 1, 1, 1, 1]);
    expect(texte).toContain(`il l'accepte ${Math.round(avec(1, 1) * 100)} fois sur 100`);
    expect(texte).toContain(`il l'accepte ${Math.round(avec(1, 3) * 100)} fois sur 100`);
    const avecFiliale = source(5, "contrats", [1, 1, 1, 0, 1]);
    expect(avecFiliale).toContain(`il l'accepte ${Math.round(avec(0, 1) * 100)} fois sur 100`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le test bat la signature, la filiale et le refus ; refuser est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.entree);
    expect(classement(MEILLEUR, D.entree)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(200000);
    expect(plusSure(MEILLEUR, D.entree)).toBe(3);
  });

  it("D2 : les UHT de Pontivy battent les desserts frais, même livrés en direct", () => {
    const r = rejeu(MEILLEUR, D.gamme);
    expect(classement(MEILLEUR, D.gamme)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
  });

  it("D3 : l'emballage bilingue bat le sur-étiquetage, et d'autant plus avec des desserts frais", () => {
    expect(classement(MEILLEUR, D.etiquette)[0]).toBe(1);
    expect(classement(MEILLEUR, D.etiquette).at(-1)).toBe(0);
    const ecart = (c: readonly number[]) => {
      const r = rejeu(c, D.etiquette);
      return r[1]!.attendu - r[0]!.attendu;
    };
    expect(ecart([1, 0, 1, 1, 1, 1])).toBeGreaterThan(ecart(MEILLEUR) + 30000);
  });

  it("D4 : le VIE est le meilleur en moyenne, suivre depuis Loudéac le plus sûr, la filiale la pire", () => {
    const c = classement(MEILLEUR, D.relais);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.relais)).toBe(2);
  });

  it("D5 : généraliser sur la rotation de fond bat le plan tenu quoi qu'il arrive", () => {
    const r = rejeu(MEILLEUR, D.suite);
    expect(classement(MEILLEUR, D.suite)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10 + 100000);
  });

  it("D6 : deux ans avec objectifs est le meilleur en moyenne, trois ans le plus sûr, cinq ans nettement moins bon", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.contrat)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    // L'interaction : une filiale lancée sous les yeux de l'importateur rend la proposition courte bien plus risquée.
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.contrat);
      return x[1]!.attendu - x[2]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([1, 1, 1, 0, 1, 1]) + 30000);
  });

  it("entrer par étapes bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(300000);
    expect(bonne! - attentiste!).toBeGreaterThan(200000);
    expect(reflexe!).toBeLessThan(attentiste!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_EXPORT, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => (REFERENCES[0].chemin as readonly number[])[d] === o)).toBe(
      false,
    );
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["offre", "etude"],
      ["routes"],
      ["etiquetage"],
      ["relais"],
      ["lecture"],
      ["contrats"],
    ],
    jours: JOURS,
    diagnostic: "etapes",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 42,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242, 7]) {
      const a = analyser(EPISODE_EXPORT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose d'entrer par étapes", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_EXPORT.comportements(p, analyser(EPISODE_EXPORT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EXPORT.axe(c).titre).toBe("Entrer par étapes, pas d'enthousiasme");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer l'offre avant d'y répondre", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EXPORT.comportements(p, analyser(EPISODE_EXPORT, p).trimestre);
    expect(EPISODE_EXPORT.axe(c).titre).toBe("Chiffrer l'offre avant d'y répondre");
  });

  it("juge la marge calculée en semaine 1 : juste, proche, ou faute d'avoir compté les pertes", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_EXPORT.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(42)).toBe(1);
    expect(score(52)).toBe(0.6);
    // Sans les pertes : 600 × 16 × 52 × 0,46 − 110 000 ≈ 119,6 k€.
    expect(score(120)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_EXPORT.bilan.titre(simuler(MEILLEUR, 3))).toMatch(/valeur créée/);
    expect(EPISODE_EXPORT.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
