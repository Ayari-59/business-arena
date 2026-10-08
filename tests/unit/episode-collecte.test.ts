import { describe, expect, it } from "vitest";
import {
  AGES,
  AVEC_REPRENEUR,
  COLLECTE_AN,
  COLLECTE_FIXE,
  COUT_AVANCE,
  COUT_COLLECTE_AN_PASSE,
  COUT_COLLECTE_DEPART,
  D,
  GAEC,
  HAUSSE,
  HORIZON,
  IMPREVUS,
  INSTALLATION,
  MARGE_DESSERTS,
  NEUTRE,
  OUVERT,
  PERTE_RUPTURE,
  PIC,
  PRIX_PAYE,
  SANS_REPRENEUR,
  SEMAINES,
  VALEUR_ML,
  VALEUR_OUVERT,
  VOLUME_PROJET,
  chanceDInstaller,
  chanceDePartir,
  connaissance,
  dispoSpot,
  hasard,
  manquePrevu,
  simuler,
  surHorizon,
} from "../../src/engine/episodes/producteurs-qui-arretent";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  REFERENCES,
  REFLEXES,
  chanceSurDix,
} from "../../src/config/episodes/producteurs-qui-arretent";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_COLLECTE } from "../../src/pedagogy/episodes/producteurs-qui-arretent";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les producteurs qui arrêtent » enseigne que, pour un industriel
 * laitier, le lait se sécurise en amont et dans la durée : on va voir qui
 * s'arrête, on accompagne la transmission et l'installation, on fait reprendre
 * le lait par les voisins, on recalcule les tournées. Acheter le manque en spot
 * comble un trou au prix du moment, et au pic de Noël il manque ; augmenter le
 * prix de base pour tous coûte cher sans cibler ceux qui partent. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 1, 1, 1, 2, 1];
const REFLEXE = [1, 0, 2, 0, 0, 2];
const ATTENTISTE = [...NEUTRE];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const gain = (chemin: readonly number[], d: number, o: number, contre: number) => {
  const r = rejeu(chemin, d);
  return r[o]!.attendu - r[contre]!.attendu;
};

/** Un nombre tel que les sources l'écrivent : « 80 600 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR");
const dec = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le fichier et les visites donnent la prévision : 24,5 millions de litres par an", () => {
    const fichier = texte(0, "fichier");
    const visites = texte(0, "visites");
    expect(fichier).toContain(`${AGES.exploitations} ont un exploitant de plus de 58 ans`);
    expect(fichier).toContain(`${dec(AGES.volume)} millions de litres par an`);
    expect(visites).toContain(`${AVEC_REPRENEUR.exploitations} ont en fait un repreneur en vue`);
    expect(visites).toContain(`${dec(AVEC_REPRENEUR.volume)} millions de litres par an`);
    expect(SANS_REPRENEUR.volume).toBeCloseTo(AGES.volume - AVEC_REPRENEUR.volume, 9);
    expect(SANS_REPRENEUR.volume).toBe(24.5);
    expect(SANS_REPRENEUR.exploitations).toBe(49);
    expect(EPISODE_COLLECTE.prevision.reel(simuler(MEILLEUR, 1))).toBe(24.5);
    // Un dixième de la collecte, et des exploitations plus petites que la moyenne.
    expect(SANS_REPRENEUR.volume / COLLECTE_AN).toBeCloseTo(0.1, 1);
    expect(fichier).toContain(`${fr((AGES.volume / AGES.exploitations) * 1000)} 000 litres`);
  });

  it("le coût des tournées est celui du modèle, et il monte quand la collecte baisse", () => {
    const collecte = texte(0, "collecte");
    expect(COLLECTE_FIXE).toBe(52000 * 1.55);
    expect(collecte).toContain(`${fr(COLLECTE_FIXE)} € par semaine`);
    expect(collecte).toContain(`${dec(COUT_COLLECTE_DEPART)} € les 1 000 litres`);
    expect(collecte).toContain(`${dec(COUT_COLLECTE_AN_PASSE)} € il y a un an`);
    expect(COUT_COLLECTE_DEPART).toBeGreaterThan(COUT_COLLECTE_AN_PASSE);
    // La semaine 6, après trois arrêts, le litre coûte plus cher à collecter que la semaine 1.
    const t = simuler(ATTENTISTE, 3);
    expect(t.semaines[7]!.coutCollecte).toBeGreaterThan(t.semaines[1]!.coutCollecte);
  });

  it("la valeur d'un litre gardé et le coût d'un dispositif sont ceux du modèle", () => {
    const valeur = texte(2, "valeur");
    expect(VALEUR_ML * VOLUME_PROJET).toBe(75000);
    expect(valeur).toContain(`${fr(VALEUR_ML * VOLUME_PROJET)} € de spot`);
    expect(surHorizon(INSTALLATION[1]!.prime, VOLUME_PROJET)).toBe(22500);
    expect(valeur).toContain(`en coûte ${fr(22500)} €`);
    expect(valeur).toContain(`${fr(surHorizon(INSTALLATION[2]!.prime, VOLUME_PROJET))} €`);
    expect(valeur).toContain(`${fr(COUT_AVANCE)} €`);
    expect(HORIZON).toBe(3);
    // Les chances que la chambre donne sont celles du modèle.
    const chambre = texte(2, "chambre");
    expect(chanceSurDix(1, false)).toBe(5);
    expect(chanceSurDix(1, true)).toBe(7);
    expect(chambre).toContain("aboutit cinq fois sur dix, sept quand la chambre");
    expect(chanceDInstaller(MEILLEUR, 1)).toBeCloseTo(
      INSTALLATION[1]!.base + (hasard(1).uChambre < 0.6 ? INSTALLATION[1]!.chambre : 0),
      9,
    );
    expect(texte(3, "gaec", { dispositif: true })).toContain(
      `${fr(VALEUR_ML * GAEC.volume)} € de spot`,
    );
  });

  it("le lait qui manque au pic coûte 1 210 € les 1 000 litres ; le volume ouvert à tous en fait perdre", () => {
    const desserts = texte(4, "desserts");
    expect(MARGE_DESSERTS).toBe(1250 * 2.1 - 1625);
    expect(PERTE_RUPTURE).toBeCloseTo(1210, 6);
    expect(desserts).toContain(`${fr(PERTE_RUPTURE)} €`);
    expect(desserts).toContain("2,10 € le kilo");
    const saisons = texte(5, "saisons");
    expect(VALEUR_OUVERT).toBe(0.5 * (380 - PRIX_PAYE) + 0.5 * 50);
    expect(saisons).toContain(`${fr(-VALEUR_OUVERT)} € par an`);
    expect(saisons).toContain(`${fr((OUVERT.volume * 1000 * -VALEUR_OUVERT * HORIZON) / 1000)} k€`);
  });

  it("la hausse et la prime individuelle coûtent ce que les messages et l'accord-cadre annoncent", () => {
    const iwan = ETAPES[0]!.messages({}).find((m) => m.de === "Iwan Szymanski")!;
    expect((HAUSSE.euros * COLLECTE_AN * 1000) / 1e6).toBe(2.4);
    expect(iwan.texte).toContain("2,4 M€ par an");
    // La hausse générale coûte 10 € sur chaque litre collecté à partir de novembre.
    const g = 4;
    const sans = simuler(ATTENTISTE, g);
    const hausse = simuler(avec(ATTENTISTE, D.plan, 1), g);
    const collecte = hausse.semaines.slice(HAUSSE.debut).reduce((s, w) => s + w!.collecte, 0);
    const surcout = hausse.coutLait - sans.coutLait;
    expect(surcout).toBeGreaterThan(0.9 * HAUSSE.euros * collecte * 1000);
    expect(surcout).toBeLessThan(1.02 * HAUSSE.euros * collecte * 1000);
    // Quand l'OP apprend la prime individuelle, 5 € pour tous jusqu'à la fin de l'année : ~82 k€.
    const accord = texte(3, "accord");
    expect(accord).toContain("environ 82 k€");
    const fuite = GRAINES_DU_BILAN.find((x) => simuler(avec(MEILLEUR, D.gaec, 0), x).fuite)!;
    const avecFuite = simuler(avec(MEILLEUR, D.gaec, 0), fuite);
    const sansPrime = simuler(avec(MEILLEUR, D.gaec, 2), fuite);
    expect((avecFuite.coutLait - sansPrime.coutLait) / 1000).toBeGreaterThan(75);
    expect((avecFuite.coutLait - sansPrime.coutLait) / 1000).toBeLessThan(88);
  });

  it("le manque prévu de décembre est celui que le courtier couvre à terme", () => {
    const l = EPISODE_COLLECTE.lire(MEILLEUR.slice(0, 4), 3, JOURS, 8);
    const ctx = EPISODE_COLLECTE.contexte(l, MEILLEUR.slice(0, 4));
    const ysee = ETAPES[4]!.messages(ctx).find((m) => m.de === "Ysée Bescond")!;
    const manque = manquePrevu(MEILLEUR);
    expect(ysee.texte).toContain(`${fr(manque * 1000)} 000 litres par semaine`);
    expect(simuler(avec(MEILLEUR, D.decembre, 1), 3).terme).toBeCloseTo(3 * manque, 6);
  });
});

describe("le modèle de la collecte", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.collecte).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.collecte,
      9,
    );
    expect(simuler(MEILLEUR, 12).semaines[4]!.prixSpot).toBe(
      simuler(REFLEXE, 12).semaines[4]!.prixSpot,
    );
    expect(hasard(5)).toBe(hasard(5));
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

  it("quand le spot est cher, le lait manque au pic : le spot au fil des besoins finit en rupture", () => {
    const parNiveau = [...GRAINES_DU_BILAN].sort(
      (a, b) => hasard(a).niveauSpot - hasard(b).niveauSpot,
    );
    expect(dispoSpot(parNiveau.at(-1)!, PIC.debut)).toBeLessThan(
      dispoSpot(parNiveau[0]!, PIC.debut),
    );
    expect(dispoSpot(parNiveau[0]!, 4)).toBe(Infinity);
    const ruptures = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).rupture > 0.005).length;
    expect(ruptures(ATTENTISTE)).toBeGreaterThan(5);
    expect(ruptures(avec(ATTENTISTE, D.decembre, 1))).toBe(0);
    // Les ruptures tombent les années chères.
    const chere = parNiveau.at(-1)!;
    expect(simuler(ATTENTISTE, chere).ventesPerdues).toBeGreaterThan(100000);
  });

  it("la bonne méthode sécurise du lait pour les années suivantes ; l'attente en perd", () => {
    const vol = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).futur.volume));
    expect(vol(MEILLEUR)).toBeGreaterThan(3.5);
    expect(vol(ATTENTISTE)).toBeLessThan(1.2);
    expect(attendu(ATTENTISTE)).toBeLessThan(-250000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-600000);
    expect(attendu(MEILLEUR)).toBeGreaterThan(50000);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le plan de transmission bat le spot au fil des besoins et la hausse générale", () => {
    const c = classement(MEILLEUR, D.plan);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(1);
    expect(gain(MEILLEUR, D.plan, 2, 0)).toBeGreaterThan(200000);
    expect(gain(MEILLEUR, D.plan, 0, 1)).toBeGreaterThan(200000);
    // Le questionnaire voit moins que les visites : ceux qui arrêtent répondent rarement.
    expect(connaissance(avec(MEILLEUR, D.plan, 3)).projets).toBeLessThan(
      connaissance(MEILLEUR).projets,
    );
  });

  it("D2 : recalculer les tournées bat l'attente et l'échange ; céder la collecte à Nordal perd du lait", () => {
    const c = classement(MEILLEUR, D.tournees);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    expect(gain(MEILLEUR, D.tournees, 1, 0)).toBeGreaterThan(40000);
    // Recalculer vaut plus quand on sait qui va s'arrêter.
    const sansCarte = avec(MEILLEUR, D.plan, 0);
    expect(gain(MEILLEUR, D.tournees, 1, 0)).toBeGreaterThan(
      gain(sansCarte, D.tournees, 1, 0) + 15000,
    );
  });

  it("D3 : le dispositif complet bat la prime forte sans accompagnement, et vaut plus après le plan", () => {
    const c = classement(MEILLEUR, D.installation);
    expect(c).toEqual([1, 0, 2]);
    expect(gain(MEILLEUR, D.installation, 1, 0)).toBeGreaterThan(60000);
    expect(gain(MEILLEUR, D.installation, 1, 2)).toBeGreaterThan(150000);
    expect(gain(MEILLEUR, D.installation, 1, 0)).toBeGreaterThan(
      2 * gain(ATTENTISTE, D.installation, 1, 0),
    );
  });

  it("D4 : répondre au projet de Padrig bat la prime individuelle, si le dispositif existe", () => {
    expect(classement(MEILLEUR, D.gaec)[0]).toBe(1);
    expect(gain(MEILLEUR, D.gaec, 1, 0)).toBeGreaterThan(10000);
    expect(gain(MEILLEUR, D.gaec, 1, 2)).toBeGreaterThan(15000);
    expect(chanceDePartir(MEILLEUR)).toBeLessThan(
      chanceDePartir(avec(MEILLEUR, D.installation, 0)),
    );
    // Avec une prime forte sans accompagnement, l'entrée dans le dispositif devient le pire choix.
    expect(classement(avec(MEILLEUR, D.installation, 2), D.gaec).at(-1)).toBe(1);
  });

  it("D5 : la prime de décembre est la meilleure en moyenne ; l'achat à terme protège mieux ; le spot est le pire", () => {
    const r = rejeu(MEILLEUR, D.decembre);
    expect(classement(MEILLEUR, D.decembre)).toEqual([2, 1, 0]);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(12000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(1);
    expect(r[1]!.p10 - r[2]!.p10).toBeGreaterThan(50000);
    expect(r[0]!.p10).toBeLessThan(r[2]!.p10);
  });

  it("D6 : les voisins qui reprennent battent tout après le plan ; sans le plan, mieux vaut la coopérative", () => {
    const c = classement(MEILLEUR, D.agrandir);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
    expect(gain(MEILLEUR, D.agrandir, 1, 3)).toBeGreaterThan(30000);
    expect(classement(ATTENTISTE, D.agrandir)[0]).toBe(3);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_COLLECTE, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
    for (const [d, o] of REFLEXES) expect(REFERENCES[0].chemin[d]).not.toBe(o);
  });

  it("sécuriser en amont bat l'achat au prix du jour et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(400000);
    expect(methode! - attentiste!).toBeGreaterThan(300000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["fichier", "visites"],
      ["carte"],
      ["chambre", "valeur"],
      ["gaec"],
      ["noel"],
      ["voisins", "saisons"],
    ],
    jours: JOURS,
    diagnostic: "transmission",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 24.5,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_COLLECTE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a acheté le manque et augmenté le prix, propose de sécuriser le lait en amont", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_COLLECTE.comportements(p, analyser(EPISODE_COLLECTE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_COLLECTE.axe(c).titre).toBe(
      "Sécuriser le lait en amont plutôt que l'acheter au prix du jour",
    );
  });

  it("à qui a décidé sans enquêter, propose d'aller voir les exploitations", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_COLLECTE.comportements(p, analyser(EPISODE_COLLECTE, p).trimestre);
    expect(EPISODE_COLLECTE.axe(c).titre).toBe("Aller voir les exploitations avant de décider");
  });

  it("juge la prévision du lait qui disparaît au million de litres près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_COLLECTE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(24.5)).toBe(1);
    expect(calibrage(22.5)).toBe(0.6);
    // Le fichier seul, sans les visites, fait répondre 31,7 : trop.
    expect(calibrage(AGES.volume)).toBe(0);
  });

  it("dit le résultat en écart au budget lait et en volumes sécurisés", () => {
    expect(EPISODE_COLLECTE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(
      /au-delà du budget lait.*de volumes sécurisés/,
    );
    expect(EPISODE_COLLECTE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de volumes sécurisés/);
    expect(simuler(MEILLEUR, 4242).semaines).toHaveLength(SEMAINES + 1);
  });
});
