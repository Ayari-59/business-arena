import { describe, expect, it } from "vitest";
import {
  ANALYSES_VOISINS,
  ARRET_JOUR,
  CAMPAGNE_ENVIRONNEMENT,
  COUTS,
  D,
  ECHANTILLONS_VOISINS,
  FRAIS_PAR_MAGASIN,
  GROUPES,
  IMPREVUS,
  LIBERATION_SEMAINE,
  LOTS_INTERVALLE,
  MAGASINS,
  MOIS_DE_PRODUCTION,
  NC_IFS,
  P,
  PALETTES_A_BLOQUER,
  PRELEVEMENTS_CAMPAGNE,
  PRIX_ANALYSE,
  SOURCE,
  TROIS_SEMAINES,
  USINE_INTERVALLE,
  chanceDeSuspension,
  chanceDeTrouver,
  hasard,
  simuler,
} from "../../src/engine/episodes/lot-a-rappeler";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/lot-a-rappeler";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, prixDeLaSecurite } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_RAPPEL } from "../../src/pedagogy/episodes/lot-a-rappeler";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le lot qu'il faut peut-être rappeler » enseigne que, sous une
 * alerte sanitaire, on protège d'abord le consommateur et on décide sur des
 * faits : bloquer et retirer sans attendre les lots encadrés par deux
 * nettoyages complets, informer la DDPP, puis laisser les échantillons
 * conservés et les analyses environnementales dire s'il faut étendre, et
 * chercher la source. Attendre la confirmation est la faute ; rappeler un
 * mois de production par peur coûte sans protéger davantage. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 1, 0, 0, 0, 0];
const PANIQUE = [3, 2, 2, 1, 1, 2];
const ATTENTISTE = [0, 0, 1, 3, 3, 3];
const JOURS = 2;
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
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les enregistrements de la ligne donnent les 37 palettes à bloquer, et de quoi les compter", () => {
    const enregistrements = texte(0, "enregistrements");
    for (const l of LOTS_INTERVALLE) expect(enregistrements).toContain(`${l.lot}, ${l.produit}`);
    expect(enregistrements).toContain(
      "L3-278-K, Kerbrélan 500 g, 7 palettes ; L3-278-C, MDD Celtis 1 kg, 5 ;",
    );
    expect(enregistrements).toContain("L3-280-C, MDD Celtis 1 kg, 6, encore à quai");
    expect(PALETTES_A_BLOQUER).toBe(7 + 5 + 7 + 5 + 7 + 6);
    expect(PALETTES_A_BLOQUER).toBe(37);
    expect(USINE_INTERVALLE).toBe(6);
    expect(GROUPES.positif.palettes + GROUPES.intervalle.palettes).toBe(PALETTES_A_BLOQUER);
    expect(enregistrements).toContain(
      `quatre lots, ${GROUPES.apres.palettes} palettes, dont les ${GROUPES.apres.usine} de vendredi à quai`,
    );
    expect(EPISODE_RAPPEL.prevision.reel(simuler(MEILLEUR, 1))).toBe(37);
    // Ce qui est encore récupérable : deux palettes sur trois ce soir, quatre sur dix lundi soir.
    const ysee = ETAPES[0]!.messages({})[1]!.texte;
    expect(ysee).toContain("deux palettes expédiées sur trois");
    expect(GROUPES.intervalle.retirable.s1).toBeCloseTo(0.65, 9);
    expect(ysee).toContain("quatre sur dix");
    expect(GROUPES.intervalle.retirable.s2).toBe(0.4);
  });

  it("le laboratoire dit qu'environ trois présomptifs sur quatre sont confirmés", () => {
    expect(texte(0, "laboratoire")).toContain("environ trois sur quatre sont confirmés");
    expect(1 - P.faux).toBe(0.75);
    const confirmes = Array.from({ length: 400 }, (_, i) => i + 1).filter(
      (g) => hasard(g).scenario !== "faux",
    ).length;
    expect(confirmes / 400).toBeGreaterThan(0.7);
    expect(confirmes / 400).toBeLessThan(0.8);
  });

  it("les coûts du redémarrage, des analyses et de l'extension sont ceux du modèle", () => {
    const redemarrage = texte(1, "redemarrage");
    expect(redemarrage).toContain(`${fr(LIBERATION_SEMAINE)} € par semaine`);
    expect(redemarrage).toContain(`campagne de ${PRELEVEMENTS_CAMPAGNE} prélèvements`);
    expect(redemarrage).toContain(`${fr(CAMPAGNE_ENVIRONNEMENT)} €`);
    expect(redemarrage).toContain(`Un jour d'arrêt de la ligne 3 coûte ${fr(ARRET_JOUR)} €`);
    expect(texte(2, "echantillons")).toContain(
      `${ECHANTILLONS_VOISINS} analyses à ${PRIX_ANALYSE} €`,
    );
    expect(ETAPES[2]!.options[0]!.d).toContain(`${fr(ANALYSES_VOISINS)} €`);
    expect(ANALYSES_VOISINS).toBe(13 * 180);
    const extension = texte(2, "extension");
    expect(extension).toContain(`${GROUPES.avant.palettes + GROUPES.apres.palettes} palettes`);
    expect(extension).toContain(`${TROIS_SEMAINES} palettes`);
    expect(TROIS_SEMAINES).toBe(
      PALETTES_A_BLOQUER +
        GROUPES.avant.palettes +
        GROUPES.apres.palettes +
        GROUPES.precedents.palettes,
    );
    expect(extension).toContain(`${MAGASINS} magasins`);
    expect(extension).toContain(`${FRAIS_PAR_MAGASIN} € par magasin`);
    expect(ETAPES[0]!.options[3]!.d).toContain(`${MOIS_DE_PRODUCTION} palettes`);
    expect(MOIS_DE_PRODUCTION).toBe(240);
  });

  it("la recherche de la source, la réfection et la désinfection sont chiffrées comme dans le modèle", () => {
    const zones = texte(3, "zones", { nicheVue: true, campagne: true });
    expect(zones).toContain(`${fr(SOURCE.recherche.cout)} € et deux jours d'arrêt`);
    expect(SOURCE.recherche.jours).toBe(2);
    expect(zones).toContain("six fois sur sept quand une campagne a dit où chercher");
    expect(P.sourceAvecCampagne).toBeCloseTo(6 / 7, 1);
    expect(zones).toContain("une fois sur deux sinon");
    expect(P.sourceSansCampagne).toBe(0.5);
    expect(zones).toContain(`${fr(SOURCE.refection.cout)} € et cinq jours d'arrêt`);
    expect(SOURCE.refection.jours).toBe(5);
    expect(zones).toContain("une fois sur cinq");
    expect(P.choc).toBe(0.2);
    expect(ETAPES[3]!.options[2]!.d).toContain(`${fr(SOURCE.choc.cout)} €`);
  });

  it("les enseignes et l'audit IFS sont chiffrés comme dans le modèle", () => {
    expect(ETAPES[4]!.messages({ alerteConnue: true })[1]!.texte).toContain("90 magasins, 50 €");
    expect(texte(4, "promotion")).toContain(`${fr(COUTS.promo)} €`);
    expect(ETAPES[4]!.options[0]!.d).toContain(`${fr(COUTS.audit)} €`);
    expect(texte(5, "ifs")).toContain(`${fr(NC_IFS)} € environ`);
    expect(texte(5, "comparaison")).toContain("sept fois sur dix");
    expect(P.planAvantProduit).toBe(0.7);
    expect(ETAPES[5]!.options[0]!.d).toContain(
      `${fr(COUTS.planSemaine)} € par semaine et ${fr(COUTS.formation)} €`,
    );
  });
});

describe("le modèle de l'alerte", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.cout).toBeCloseTo(
      simuler(avec(MEILLEUR, D.ligne, 0), 12).semaines[1]!.cout,
      9,
    );
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 5).scenario).toBe(simuler(PANIQUE, 5).scenario);
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

  it("les trois vérités du présomptif tombent toutes dans les trente tirages du bilan", () => {
    const scenarios = new Set(GRAINES_DU_BILAN.map((g) => hasard(g).scenario));
    expect([...scenarios].sort()).toEqual(["faux", "ligne", "lot"]);
  });

  it("attendre laisse partir plus de produit contaminé, et la DDPP l'apprend par le laboratoire", () => {
    const confirmes = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario !== "faux");
    const expo = (c: readonly number[]) => moyenne(confirmes.map((g) => simuler(c, g).exposition));
    expect(expo(ATTENTISTE)).toBeGreaterThan(expo(MEILLEUR) + 5);
    expect(GRAINES_DU_BILAN.some((g) => simuler(ATTENTISTE, g).sanction)).toBe(true);
    expect(GRAINES_DU_BILAN.some((g) => simuler(MEILLEUR, g).sanction)).toBe(false);
    for (const g of GRAINES_DU_BILAN) {
      if (hasard(g).scenario === "faux") expect(simuler(ATTENTISTE, g).sanction).toBe(false);
    }
  });

  it("un périmètre trop étroit fait courir un second rappel ; tout rappeler détruit des produits sains", () => {
    const seconds = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).secondRappel > 0).length;
    expect(seconds(ATTENTISTE)).toBeGreaterThan(seconds(MEILLEUR) * 2);
    const saines = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).palettesSaines));
    expect(saines(PANIQUE)).toBeGreaterThan(saines(MEILLEUR) * 3);
  });

  it("la recherche de la source trouve plus souvent la niche quand une campagne a dit où chercher", () => {
    expect(chanceDeTrouver(MEILLEUR)).toBeGreaterThan(chanceDeTrouver(avec(MEILLEUR, D.ligne, 0)));
    expect(chanceDeTrouver(avec(MEILLEUR, D.source, 1))).toBe(1);
    expect(chanceDeTrouver(avec(MEILLEUR, D.source, 3))).toBe(0);
  });

  it("Celtis suspend plus souvent après une information tardive ou une contestation, moins après un audit", () => {
    const base = { retrait: true, rappel: true, tardive: false, second: false, presse: false };
    expect(chanceDeSuspension({ ...base, choix: 0 })).toBeLessThan(
      chanceDeSuspension({ ...base, choix: 3 }),
    );
    expect(chanceDeSuspension({ ...base, choix: 2 })).toBeGreaterThan(
      chanceDeSuspension({ ...base, choix: 3 }),
    );
    expect(chanceDeSuspension({ ...base, tardive: true, choix: 3 })).toBeGreaterThan(
      chanceDeSuspension({ ...base, choix: 3 }),
    );
    expect(chanceDeSuspension({ ...base, retrait: false, rappel: false, choix: 3 })).toBe(0);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : bloquer et retirer l'intervalle entre deux NEP, et informer, bat l'attente et la panique", () => {
    const r = rejeu(MEILLEUR, D.alerte);
    expect(classement(MEILLEUR, D.alerte)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
    // Le piège : quand le présomptif est faux, attendre ne coûte rien.
    const faux = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === "faux");
    for (const g of faux) {
      expect(objectif(avec(MEILLEUR, D.alerte, 0), g)).toBeGreaterThan(objectif(MEILLEUR, g));
    }
  });

  it("D2 : la libération positive avec prélèvements est la meilleure ; l'arrêt est plus sûr, et coûte trop", () => {
    const m = mesurerDecision(EPISODE_RAPPEL, MEILLEUR, D.ligne, JOURS);
    expect(m.meilleure.option).toBe(1);
    expect(m.plusSure.option).toBe(2);
    const [redemarrer, liberer, arreter] = m.options;
    expect(liberer!.moyenne - redemarrer!.moyenne).toBeGreaterThan(20000);
    expect(arreter!.p10).toBeGreaterThan(liberer!.p10);
    expect(liberer!.moyenne - arreter!.moyenne).toBeGreaterThan(
      prixDeLaSecurite(liberer!.p10, liberer!.p90),
    );
  });

  it("D3 : les échantillons conservés décident de l'extension, mieux que s'en tenir ou tout étendre", () => {
    const r = rejeu(MEILLEUR, D.perimetre);
    expect(classement(MEILLEUR, D.perimetre)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("D4 : chercher la source paie quand une campagne a dit où chercher ; la réfection est plus sûre", () => {
    const m = mesurerDecision(EPISODE_RAPPEL, MEILLEUR, D.source, JOURS);
    expect(m.meilleure.option).toBe(0);
    expect(m.plusSure.option).toBe(1);
    const [chercher, refaire, choc] = m.options;
    expect(chercher!.moyenne - refaire!.moyenne).toBeGreaterThan(8000);
    expect(chercher!.moyenne - choc!.moyenne).toBeGreaterThan(25000);
    // Sans prélèvements en semaine 2, chercher à l'aveugle ne vaut plus mieux que tout refaire.
    const aveugle = mesurerDecision(EPISODE_RAPPEL, avec(MEILLEUR, D.ligne, 0), D.source, JOURS);
    const avance = (x: typeof m) => x.options[0]!.moyenne - x.options[1]!.moyenne;
    expect(avance(m) - avance(aveugle)).toBeGreaterThan(10000);
    expect(avance(aveugle)).toBeLessThan(2000);
  });

  it("D5 : l'audit transparent bat la promotion, la contestation et le fil de l'eau", () => {
    const r = rejeu(MEILLEUR, D.enseignes);
    expect(classement(MEILLEUR, D.enseignes)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
  });

  it("D6 : réviser le plan environnemental bat les analyses de produits et le retour à l'habituel", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_RAPPEL, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      const securite =
        option === m.plusSure &&
        option.p10 > m.meilleure.p10 &&
        m.meilleure.moyenne - option.moyenne < prixDeLaSecurite(m.meilleure.p10, m.meilleure.p90);
      expect(securite, `D${d + 1} option ${o}`).toBe(false);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("protéger puis délimiter sur les faits bat tout retirer et attendre, en moyenne", () => {
    const [methode, panique, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - panique!).toBeGreaterThan(100000);
    expect(methode! - attente!).toBeGreaterThan(60000);
    expect(attente).toBeGreaterThan(-400000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["enregistrements", "reglement"],
      ["historique"],
      ["echantillons"],
      ["zones"],
      ["celtis"],
      ["ifs"],
    ],
    jours: JOURS,
    diagnostic: "perimetre",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 37,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [1, 2, 11, 15, 4242]) {
      const a = analyser(EPISODE_RAPPEL, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a attendu la confirmation, propose de protéger d'abord", () => {
    const p = partie(ATTENTISTE);
    const c = EPISODE_RAPPEL.comportements(p, analyser(EPISODE_RAPPEL, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RAPPEL.axe(c).titre).toBe("Protéger d'abord, puis décider sur des faits");
  });

  it("à qui a décidé sans enquêter, propose de lire les enregistrements", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RAPPEL.comportements(p, analyser(EPISODE_RAPPEL, p).trimestre);
    expect(EPISODE_RAPPEL.axe(c).titre).toBe("Lire les enregistrements avant de délimiter");
  });

  it("juge la prévision des palettes à une palette près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_RAPPEL.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(37)).toBe(1);
    expect(calibrage(33)).toBe(0.6);
    expect(calibrage(31)).toBe(0);
    expect(calibrage(7)).toBe(0);
  });

  it("dit le résultat en coût de l'alerte, suites comprises", () => {
    const t = simuler(MEILLEUR, 4242);
    expect(t.objectif).toBeCloseTo(-(t.coutTrimestre + t.suites), 6);
    expect(EPISODE_RAPPEL.bilan.titre(t)).toMatch(
      /^Coût de l'alerte : .* k€, dont .* k€ de suites attendues$/,
    );
  });
});
