import { describe, expect, it } from "vitest";
import {
  ARRETS_PAR_MOIS,
  ATTENTE_ASTREINTE,
  ATTENTE_EXPRESS,
  ATTENTE_PIECE,
  ATTENTE_PIECE_MOYENNE,
  CADENCE,
  COUTS,
  D,
  DECEMBRE_DEPART,
  FREQUENCE_JOINTS,
  GAIN_NUIT_MOIS,
  HEURES_ARRET_HISTO,
  HEURES_HISTO,
  HEURE_PERDUE,
  HEURE_RATTRAPEE,
  IMPREVUS,
  LOT_BLOQUE,
  MARGE_POT,
  MTBF_SCELLEUSE,
  ORGANES,
  PANNES_HISTO,
  PANNE_SEMAINE_2,
  PART_CRITIQUES,
  PART_HORS_NEP,
  PART_JOINTS,
  PART_NUIT,
  PENALITES_HEURE,
  PREMIER_NIVEAU,
  PREPARATION,
  P_FRAGMENT,
  P_FRAGMENT_DETECTABLE,
  RATTRAPABLE,
  REVISION,
  VIE_JOINT,
  chanceAccord,
  hasard,
  organe,
  poisson,
  reparation,
  simuler,
} from "../../src/engine/episodes/maintenance-qui-court";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/maintenance-qui-court";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_MAINTENANCE } from "../../src/pedagogy/episodes/maintenance-qui-court";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La maintenance qui court après les pannes » enseigne qu'une
 * maintenance qui ne fait que dépanner reste débordée : on compte les pannes
 * (lesquelles, combien de fois, combien de temps), on met en préventif les
 * organes critiques, on confie aux conducteurs les gestes de premier niveau, on
 * tient les pièces critiques en stock, et on garde l'entretien jusqu'au pic.
 * Ajouter un dépanneur ou repousser l'entretien coûte plus. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 0, 0];
const REFLEXE = [0, 2, 3, 2, 2, 1];
const ATTENTISTE = [3, 3, 3, 2, 1, 2];
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

/** Un nombre tel que les sources l'écrivent : « 2 704 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const pc = (v: number) => `${Math.round(v * 100)} %`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("l'historique donne les taux de panne du modèle et le MTBF de la scelleuse", () => {
    const h = texte(0, "historique");
    expect(h).toContain(`la ligne a fonctionné ${fr(HEURES_HISTO)} heures`);
    expect(h).toContain(`${PANNES_HISTO} pannes, pour ${HEURES_ARRET_HISTO} heures d'arrêt`);
    for (const o of ORGANES) expect(h).toContain(`${o.pannes} pannes et ${o.heures} heures`);
    expect(h).toContain(`font donc ${pc(PART_CRITIQUES)} des heures d'arrêt`);
    // Les pannes faute de pièce et les pannes de nuit : ce que le modèle tire.
    const faute = ORGANES.reduce((s, o) => s + o.pannes * o.partPiece, 0);
    expect(Math.round(faute)).toBe(4);
    expect(h).toContain("Quatre pannes ont attendu une pièce");
    expect(h).toContain(`huit heures en moyenne`);
    expect(ATTENTE_PIECE_MOYENNE).toBe(8);
    expect(h).toContain(
      `${PANNES_HISTO * PART_NUIT} pannes sur ${PANNES_HISTO} sont tombées la nuit`,
    );
    // Le MTBF : temps de bon fonctionnement sur nombre de pannes.
    const sc = organe("scelleuse");
    expect(MTBF_SCELLEUSE).toBeCloseTo((2704 - 41) / 38, 6);
    expect(EPISODE_MAINTENANCE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(70.08, 2);
    expect(sc.pannes).toBe(38);
    // Le message d'alerte : dix-neuf heures et dix-sept pannes par mois.
    expect(ARRETS_PAR_MOIS).toBe(19);
    const alerte = ETAPES[0]!.messages({})[0]!.texte;
    expect(alerte).toContain(
      `${ARRETS_PAR_MOIS} heures d'arrêt pour panne, ${Math.round(PANNES_HISTO / 6)} pannes`,
    );
  });

  it("les durées de réparation se déduisent de l'historique", () => {
    for (const o of ORGANES) {
      expect(reparation(o)).toBeGreaterThan(0.25);
      // Réparation, attente de l'astreinte la nuit, attente des pièces : la durée moyenne de l'historique.
      expect(
        reparation(o) + PART_NUIT * ATTENTE_ASTREINTE + o.partPiece * ATTENTE_PIECE_MOYENNE,
      ).toBeCloseTo(o.heures / o.pannes, 9);
    }
  });

  it("la nuit pèse peu : à peine plus de 2 heures par mois sur 19", () => {
    const r = texte(0, "heures");
    expect(GAIN_NUIT_MOIS).toBeCloseTo(2.17, 2);
    expect(r).toContain(
      `les ${PANNES_HISTO * PART_NUIT} pannes de nuit ont attendu ${PANNES_HISTO * PART_NUIT * ATTENTE_ASTREINTE} heures`,
    );
    expect(r).toContain("à peine plus de 2 heures par mois sur les 19");
    expect(r).toContain(
      "294 en dépannage (70 %), 76 en préventif (18 %), 50 en travaux neufs (12 %)",
    );
    expect(EPISODE_MAINTENANCE.lire([], 1, 0, 0).preventif).toBeCloseTo(76 / 420, 9);
  });

  it("une heure d'arrêt coûte ce que la source dit, rattrapée ou perdue", () => {
    const r = texte(0, "heure");
    expect(r).toContain(`Jusqu'à ${RATTRAPABLE} heures par semaine`);
    expect(r).toContain(`${fr(HEURE_RATTRAPEE)} €`);
    expect(r).toContain(`${fr(CADENCE)} pots à 0,11 €`);
    expect(MARGE_POT).toBe(0.11);
    expect(r).toContain(`${fr(PENALITES_HEURE)} € de pénalités`);
    expect(HEURE_PERDUE).toBeCloseTo(CADENCE * MARGE_POT + PENALITES_HEURE, 6);
    expect(r).toContain(`soit ${fr(HEURE_PERDUE)} € l'heure`);
    expect(texte(5, "etat", { heuresDecembre: "8 h" })).toContain(`${fr(HEURE_PERDUE)} € l'heure`);
    // Le pic de décembre dans l'état de l'été : 19 h par mois, à 3 800 € l'heure, six jours sur sept.
    expect(DECEMBRE_DEPART).toBeCloseTo((HEURES_ARRET_HISTO / 26) * 1.15 * 4 * HEURE_PERDUE, 6);
  });

  it("les options et les sources des pièces sont chiffrées comme dans le modèle", () => {
    const [nuit, plan, revision] = ETAPES[0]!.options;
    expect(nuit!.d).toContain(
      `${fr(COUTS.cabinet)} € de cabinet, puis ${fr(COUTS.technicienNuit)} €`,
    );
    expect(plan!.d).toContain(
      `1,5 heure d'arrêt planifié par semaine jusqu'à la semaine ${COUTS.finRattrapage}`,
    );
    expect(COUTS.heuresRattrapage).toBe(1.5);
    expect(COUTS.heuresPlan).toBe(0.75);
    expect(plan!.d).toContain(
      `${fr(COUTS.piecesRattrapage)} € de pièces par semaine, puis ${COUTS.piecesPlan} €`,
    );
    expect(revision!.d).toContain(`${fr(REVISION.cout)} € et ${REVISION.heures} heures`);
    expect(ETAPES[1]!.messages({})[0]!.texte).toContain("Neuf heures d'arrêt");
    expect(PANNE_SEMAINE_2.heures).toBe(9);
    const m = texte(1, "magasin");
    expect(m).toContain(`${fr(COUTS.stockCritique)} €, livré en semaine 4`);
    expect(m).toContain(`${fr(COUTS.stockComplet)} €, livrée en semaine 6`);
    const d = texte(1, "delais");
    expect(d).toContain(
      `de ${ATTENTE_PIECE.min} à ${ATTENTE_PIECE.min + ATTENTE_PIECE.ecart} heures`,
    );
    expect(d).toContain(
      `de ${ATTENTE_EXPRESS.min} à ${ATTENTE_EXPRESS.min + ATTENTE_EXPRESS.ecart} heures, pour ${fr(COUTS.expressMois)} €`,
    );
    expect(d).toContain("25 % par an");
    expect(COUTS.possession * 3).toBeCloseTo(0.25, 9);
  });

  it("le premier niveau, les joints, la NEP et le pic sont chiffrés comme dans le modèle", () => {
    // Pontivy : un quart à un tiers sur les organes visés, deux fois moins sans l'historique.
    const p = texte(2, "pontivy");
    expect(p).toContain("d'un quart à un tiers");
    expect(1 - PREMIER_NIVEAU.cibles.doseurs).toBeCloseTo(0.25, 6);
    expect(1 - PREMIER_NIVEAU.cibles.scelleuse).toBeCloseTo(0.33, 6);
    expect(p).toContain("deux fois moindre");
    for (const c of ["doseurs", "scelleuse", "verins"] as const) {
      expect(1 - PREMIER_NIVEAU.generiques[c]).toBeCloseTo((1 - PREMIER_NIVEAU.cibles[c]) / 2, 2);
    }
    // Les joints : 20 joints déchirés en six mois pour six doseurs, près de 800 heures chacun.
    const j = texte(3, "joints");
    expect(Math.round(organe("doseurs").pannes * PART_JOINTS)).toBe(20);
    expect(j).toContain("Six pannes de doseurs sur dix");
    expect(PART_JOINTS).toBe(0.6);
    expect(Math.round(VIE_JOINT / 100) * 100).toBe(800);
    expect(j).toContain("près de 800 heures");
    expect(j).toContain(`tous les ${FREQUENCE_JOINTS} heures`);
    expect(FREQUENCE_JOINTS / VIE_JOINT).toBeCloseTo(0.75, 1);
    const q = texte(3, "qualite");
    expect(q).toContain(`${fr(LOT_BLOQUE)} €`);
    expect(q).toContain(`environ ${Math.round(P_FRAGMENT * 100)} joints sur 100`);
    expect(P_FRAGMENT_DETECTABLE).toBeLessThan(0.01);
    expect(texte(4, "nep")).toContain(`que ${pc(PART_HORS_NEP)} du temps d'arrêt planifié`);
    // L'intérim de nuit : 900 € de frais, puis quatre semaines à 1 600 €.
    expect(texte(5, "etat", {})).toContain(
      `${fr(COUTS.fraisInterim + 4 * COUTS.interimNuit)} € d'intérim`,
    );
    expect(ETAPES[5]!.options[1]!.d).toContain(
      `${COUTS.fraisInterim} € de frais d'agence, puis ${fr(COUTS.interimNuit)} €`,
    );
    expect(texte(5, "planificateur")).toContain("dure un cinquième de moins");
    expect(PREPARATION).toBe(0.8);
  });
});

describe("le modèle de la ligne des desserts", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.arrets).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.arrets,
      6,
    );
    expect(hasard(5)).toBe(hasard(5));
    // Moins de pannes pour un même tirage quand le taux baisse.
    expect(poisson(0.9, 1)).toBeGreaterThanOrEqual(poisson(0.9, 0.5));
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

  it("le préventif fait tomber les pannes en novembre et le coût attendu du pic ; l'attente les laisse monter", () => {
    const moyen = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      moyenne(GRAINES_DU_BILAN.map((g) => f(simuler(c, g))));
    const novembre = (t: ReturnType<typeof simuler>) =>
      t.semaines.slice(10).reduce((s, w) => s + w!.arrets, 0) * (13 / 12);
    expect(moyen(MEILLEUR, novembre)).toBeLessThan(10);
    expect(moyen(ATTENTISTE, novembre)).toBeGreaterThan(ARRETS_PAR_MOIS);
    expect(moyen(MEILLEUR, (t) => t.coutDecembre)).toBeLessThan(DECEMBRE_DEPART / 2);
    expect(moyen(ATTENTISTE, (t) => t.coutDecembre)).toBeGreaterThan(DECEMBRE_DEPART);
    expect(moyen(MEILLEUR, (t) => t.mtbfFinal)).toBeGreaterThan(
      2 * moyen(ATTENTISTE, (t) => t.mtbfFinal),
    );
  });

  it("le technicien de nuit raccourcit les pannes de nuit sans en éviter aucune", () => {
    const nuit = avec(ATTENTISTE, D.reponse, 0);
    for (const g of [3, 8, 21]) {
      const a = simuler(nuit, g);
      const b = simuler(ATTENTISTE, g);
      expect(a.pannesTotal).toBe(b.pannesTotal);
      expect(a.arretsTotal).toBeLessThanOrEqual(b.arretsTotal + 1e-9);
    }
  });

  it("les standards écrits avec les équipes sont acceptés plus souvent quand l'historique a montré quoi regarder", () => {
    expect(chanceAccord(MEILLEUR)).toBeGreaterThan(chanceAccord(avec(MEILLEUR, D.reponse, 3)));
    const accidents = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).accident).length;
    expect(accidents(MEILLEUR)).toBe(0);
    expect(accidents(avec(MEILLEUR, D.premierNiveau, 1))).toBeGreaterThan(4);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le plan préventif sur les organes critiques bat de loin le technicien de nuit et la révision générale", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(1);
    expect(classement(MEILLEUR, D.reponse).at(-1)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    // Le technicien de nuit fait moins bien que ne rien changer.
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : le stock de pièces critiques est le meilleur en moyenne ; la liste complète immobilise trop pour ce qu'elle rapporte", () => {
    const r = rejeu(MEILLEUR, D.pieces);
    expect(classement(MEILLEUR, D.pieces)[0]).toBe(0);
    expect(classement(MEILLEUR, D.pieces).at(-1)).toBe(3);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(1500);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(12000);
  });

  it("D3 : écrire les standards avec les conducteurs est le meilleur en moyenne ; les tournées des techniciens, le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.premierNiveau);
    expect(classement(MEILLEUR, D.premierNiveau)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10).toBeGreaterThan(r[0]!.p10 + 2000);
    // L'interaction : sans l'historique, les standards écrits ensemble ne valent pas mieux que les tournées.
    const sansPlan = rejeu(avec(MEILLEUR, D.reponse, 3), D.premierNiveau);
    const avance = (x: typeof r) => x[0]!.attendu - x[2]!.attendu;
    expect(avance(r)).toBeGreaterThan(avance(sansPlan) + 8000);
  });

  it("D4 : remplacer les joints à l'inspection vaut mieux avec le premier niveau ; sans lui, le remplacement systématique", () => {
    expect(classement(MEILLEUR, D.joints)[0]).toBe(1);
    expect(classement(MEILLEUR, D.joints).slice(-2).sort()).toEqual([2, 3]);
    const sansPremierNiveau = avec(MEILLEUR, D.premierNiveau, 3);
    const r = rejeu(sansPremierNiveau, D.joints);
    expect(classement(sansPremierNiveau, D.joints)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
  });

  it("D5 : caler l'entretien dans les NEP bat de loin sa suspension avant le pic", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
  });

  it("D6 : pérenniser bat l'intérim de nuit et le retour au dépannage ; l'intérim ne paie qu'après un trimestre sans préventif", () => {
    const r = rejeu(MEILLEUR, D.decembre);
    expect(classement(MEILLEUR, D.decembre)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
    // L'interaction : après un trimestre de curatif, l'intérimaire de nuit rapporte plus qu'il ne coûte.
    expect(r[1]!.attendu).toBeLessThan(r[2]!.attendu);
    const s = rejeu(ATTENTISTE, D.decembre);
    expect(s[1]!.attendu).toBeGreaterThan(s[2]!.attendu);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_MAINTENANCE, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("analyser, prévenir et outiller bat le dépannage plus rapide et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(60000);
    expect(methode! - attentiste!).toBeGreaterThan(60000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["historique", "heures"], ["magasin"], ["pontivy"], ["joints"], ["nep"], ["etat"]],
    jours: JOURS,
    diagnostic: "pareto",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 70,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_MAINTENANCE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a ajouté des dépanneurs et repoussé l'entretien, propose d'avoir moins de pannes", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_MAINTENANCE.comportements(p, analyser(EPISODE_MAINTENANCE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_MAINTENANCE.axe(c).titre).toBe(
      "Avoir moins de pannes plutôt que les réparer plus vite",
    );
  });

  it("à qui a décidé sans enquêter, propose de compter les pannes", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_MAINTENANCE.comportements(p, analyser(EPISODE_MAINTENANCE, p).trimestre);
    expect(EPISODE_MAINTENANCE.axe(c).titre).toBe("Compter les pannes avant de les combattre");
  });

  it("juge la prévision du MTBF de la scelleuse à 3 heures près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_MAINTENANCE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(70)).toBe(1);
    expect(calibrage(71.2)).toBe(1);
    expect(calibrage(62)).toBe(0.6);
    expect(calibrage(27)).toBe(0);
  });

  it("dit le résultat en coût, pic de décembre compris", () => {
    expect(EPISODE_MAINTENANCE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /de pannes et de maintenance, dont .* attendus au pic de décembre/,
    );
  });
});
