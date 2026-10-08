import { describe, expect, it } from "vitest";
import {
  AIR,
  CANICULES,
  COUTS,
  D,
  ECONOMIE_LIGNE,
  ELEC,
  ELEC_AN,
  FROID,
  FUITES,
  FUITES_AN,
  FUITES_KW,
  IMPREVUS,
  INVESTISSEMENTS,
  LED,
  LIGNE,
  MARGE_INDEXE,
  POMPE,
  PRIX_ELEC,
  PRIX_GAZ,
  PROFIL,
  RAPPEL,
  CHANCE_RAPPEL,
  CHANCE_NON_CONFORMITE,
  NON_CONFORMITE,
  RECUPERATION,
  RELEVE_FROID,
  aTerme,
  hasard,
  risquePanne,
  simuler,
  tauxDeCouverture,
  volumeMesure,
} from "../../src/engine/episodes/energie-de-l-usine";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/energie-de-l-usine";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ENERGIE_USINE } from "../../src/pedagogy/episodes/energie-de-l-usine";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La facture d'énergie de l'usine » enseigne que la première
 * économie d'énergie d'une usine est la consommation qu'on mesure : relevés
 * par usage, fuites d'air comprimé, réglages, récupération de chaleur sur les
 * groupes froids ; on traite d'abord ce qui est mesuré et rentable, puis le
 * contrat, en couvrant le talon mesuré plutôt que tout le volume d'avant pour
 * trois ans. Arrêter une ligne aux heures chères déplace l'énergie et fait des
 * ruptures ; la chaîne du froid ne s'arbitre pas. Ces tests verrouillent les
 * chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 0, 1, 0];
const REFLEXE = [0, 3, 0, 2, 0, 1];
const ATTENTISTE = [3, 3, 3, 2, 3, 3];
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

/** Un nombre tel que les sources l'écrivent : « 3 197 ». */
const fr = (v: number, d = 0) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les relevés donnent la prévision : 110 kW de fuites, 8 760 heures, 964 MWh par an", () => {
    const releves = texte(0, "releves");
    expect(releves).toContain(`${FUITES_KW} kW`);
    expect(releves).toContain(`${fr(8760)} heures par an`);
    expect(releves).toContain(`${fr(Math.round(AIR * 52))} MWh par an`);
    expect(FUITES_AN).toBeCloseTo((110 * 8760) / 1000, 6);
    expect(EPISODE_ENERGIE_USINE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(963.6, 1);
    // Les fuites font 30 % de l'électricité des compresseurs.
    expect(FUITES / AIR).toBeCloseTo(0.3, 2);
    expect(FUITES_AN / (AIR * 52)).toBeCloseTo(0.3, 1);
    // Le froid pèse 40 % de l'électricité d'une semaine d'été.
    expect(releves).toContain(`${fr(FROID)} MWh (40 %)`);
    expect(releves).toContain(`${fr(ELEC)} MWh`);
  });

  it("la facture et la ligne 5 : 145 €/MWh, et 91 € par semaine à déplacer la production", () => {
    const facture = texte(0, "facture");
    expect(Math.round(PRIX_ELEC)).toBe(145);
    expect(facture).toContain("145 €/MWh tout compris");
    expect(facture).toContain("12 €/MWh en été");
    expect(facture).toContain(`${fr(ELEC_AN)} MWh d'électricité`);
    const ligne = texte(0, "ligne");
    expect(ECONOMIE_LIGNE).toBeCloseTo(0.38 * 20 * 12, 6);
    expect(ligne).toContain(`${fr(Math.round(ECONOMIE_LIGNE))} €`);
    expect(ligne).toContain(`${fr(LIGNE.heuresDecalees)} €`);
    // L'arrêt rapporte cent fois moins qu'il ne coûte.
    expect(LIGNE.heuresDecalees + LIGNE.ruptures).toBeGreaterThan(80 * ECONOMIE_LIGNE);
  });

  it("la récupération de chaleur se paie en 2,5 ans ; la pompe à chaleur couvre à peine son annuité", () => {
    const nep = texte(3, "nep", { mesure: true });
    expect(RECUPERATION.gazEvite).toBeCloseTo(0.26 * 250 * 52, 6);
    expect(RECUPERATION.gain).toBeCloseTo(3380 * PRIX_GAZ, 6);
    expect(RECUPERATION.delai).toBeCloseTo(440000 / 175760, 6);
    expect(nep).toContain(`${fr(3380)} MWh`);
    expect(nep).toContain("176 k€");
    expect(nep).toContain("2,5 ans");
    expect(nep).toContain(`${fr(Math.round(RECUPERATION.annuite / 1000))} k€`);
    const pompe = texte(3, "pompe");
    expect(pompe).toContain(`${fr(Math.round(POMPE.elec))} MWh`);
    expect(pompe).toContain(`${fr(Math.round(POMPE.gain / 1000))} k€`);
    expect(RECUPERATION.gain - RECUPERATION.annuite).toBeGreaterThan(100000);
    expect(Math.abs(POMPE.gain - POMPE.annuite)).toBeLessThan(15000);
    const led = texte(5, "led");
    expect(led).toContain(`${fr(LED.mwh)} MWh`);
  });

  it("les offres et le volume prévu sont ceux du modèle", () => {
    const decisions = MEILLEUR.slice(0, 4);
    const l = EPISODE_ENERGIE_USINE.lire(decisions, 3, JOURS, 8);
    const ctx = EPISODE_ENERGIE_USINE.contexte(l, decisions);
    const terme = aTerme(3, 8);
    expect(l.aTerme).toBeCloseTo(terme, 6);
    const offres = texte(4, "offres", ctx);
    expect(offres).toContain(`${fr(terme, 1)} €/MWh de base`);
    expect(offres).toContain(`${fr(terme * PROFIL + MARGE_INDEXE, 1)} €/MWh au contrat indexé`);
    expect(offres).toContain(`${fr(ELEC_AN)} MWh par an`);
    const volumes = texte(4, "volumes", ctx);
    const v = volumeMesure(MEILLEUR, 3);
    expect(volumes).toContain(`${fr(v)} MWh`);
    expect(v).toBeLessThan(ELEC_AN * 0.96);
    expect(simuler(MEILLEUR, 3).volumeMesure).toBe(v);
    // Sans relevés, le volume prévu est celui des douze derniers mois.
    expect(volumeMesure(avec(MEILLEUR, D.mesure, 3), 3)).toBe(ELEC_AN);
  });
});

describe("le modèle de l'énergie de l'usine", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[3]!.prixMarche).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[3]!.prixMarche,
      6,
    );
    expect(simuler(MEILLEUR, 12).canicule).toBe(simuler(ATTENTISTE, 12).canicule);
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
    expect(new Set(GRAINES_DU_BILAN.map((g) => hasard(g).canicule))).toEqual(
      new Set(Object.keys(CANICULES)),
    );
  });

  it("relever la consigne du froid économise peu et coûte beaucoup, au hasard des contrôles", () => {
    const economie = FROID * 1.15 * RELEVE_FROID * 4 * PRIX_ELEC;
    const sanctionAttendue =
      CHANCE_RAPPEL * RAPPEL + (CHANCE_NON_CONFORMITE - CHANCE_RAPPEL) * NON_CONFORMITE;
    expect(sanctionAttendue).toBeGreaterThan(5 * economie);
    const releve = avec(MEILLEUR, D.canicule, 0);
    const sanctions = GRAINES_DU_BILAN.map((g) => simuler(releve, g).sanction);
    expect(sanctions.filter((s) => s === "rappel").length).toBeGreaterThan(0);
    expect(sanctions.filter((s) => s === "lots").length).toBeGreaterThan(0);
    expect(sanctions.filter((s) => s === null).length).toBeGreaterThan(10);
    expect(GRAINES_DU_BILAN.every((g) => simuler(MEILLEUR, g).sanction === null)).toBe(true);
  });

  it("arrêter la ligne aux heures chères fait des ruptures, et parfois un déréférencement", () => {
    const somme = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      GRAINES_DU_BILAN.reduce((s, g) => s + f(simuler(c, g)), 0);
    const arret = avec(MEILLEUR, D.mesure, 0);
    expect(somme(arret, (t) => (t.dereference ? 1 : 0))).toBeGreaterThan(5);
    expect(somme(MEILLEUR, (t) => (t.dereference ? 1 : 0))).toBe(0);
    expect(somme(arret, (t) => t.serviceMoyen) / 30).toBeLessThan(0.985);
    expect(somme(MEILLEUR, (t) => t.serviceMoyen) / 30).toBeGreaterThan(0.985);
  });

  it("préparer les groupes froids divise le risque de panne en canicule", () => {
    expect(risquePanne(MEILLEUR, "forte")).toBeLessThan(risquePanne(ATTENTISTE, "forte") * 0.6);
    expect(risquePanne(MEILLEUR, "moderee")).toBeLessThan(risquePanne(ATTENTISTE, "moderee") * 0.5);
    const pannes = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).panne).length;
    expect(pannes(ATTENTISTE)).toBeGreaterThan(pannes(MEILLEUR));
  });

  it("les bonnes décisions tiennent les budgets ; l'attente les dépasse, sans absurdité", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(150000);
    expect(attendu(ATTENTISTE)).toBeLessThan(-100000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-400000);
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    expect(moyenne(bon.map((t) => t.economiesMwh))).toBeGreaterThan(0.1 * (ELEC_AN + 28080));
    for (const t of bon) {
      for (const s of t.semaines.slice(1)) {
        expect(s!.elec).toBeGreaterThan(350);
        expect(s!.elec).toBeLessThan(550);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : mesurer usage par usage bat de loin l'audit, l'attente et l'arrêt de la ligne", () => {
    const r = rejeu(MEILLEUR, D.mesure);
    expect(classement(MEILLEUR, D.mesure)).toEqual([1, 2, 3, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
  });

  it("D2 : réparer les fuites et régler bat le compresseur neuf ; la mesure double le gain", () => {
    const r = rejeu(MEILLEUR, D.reglages);
    expect(classement(MEILLEUR, D.reglages)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
    const sansMesure = avec(MEILLEUR, D.mesure, 3);
    const s = rejeu(sansMesure, D.reglages);
    expect(classement(sansMesure, D.reglages)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(1.5 * (s[0]!.attendu - s[3]!.attendu));
  });

  it("D3 : préparer les groupes froids est le meilleur en moyenne ; le groupe de secours protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.canicule);
    expect(classement(MEILLEUR, D.canicule)[0]).toBe(1);
    expect(classement(MEILLEUR, D.canicule).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
  });

  it("D4 : la récupération de chaleur bat la pompe à chaleur et le report ; dimensionnée sans mesure, elle vaut moins", () => {
    const r = rejeu(MEILLEUR, D.chaleur);
    expect(classement(MEILLEUR, D.chaleur)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    const sansMesure = avec(MEILLEUR, D.mesure, 3);
    const s = rejeu(sansMesure, D.chaleur);
    expect(s[0]!.attendu - s[2]!.attendu).toBeLessThan(r[0]!.attendu - r[2]!.attendu - 20000);
    const couverture = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => tauxDeCouverture(c, g)));
    expect(couverture(MEILLEUR)).toBeGreaterThan(couverture(sansMesure) + 0.2);
  });

  it("D5 : couvrir le talon mesuré est le meilleur ; trois ans sur le volume d'avant est le pire, et pire encore après des économies", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(1);
    expect(classement(MEILLEUR, D.contrat).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    // Le contrat de trois ans facture les économies : il coûte plus quand l'usine a économisé.
    const n = rejeu(ATTENTISTE, D.contrat);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(n[1]!.attendu - n[0]!.attendu + 50000);
    expect(simuler(avec(MEILLEUR, D.contrat, 0), 3).penaliteVolume).toBeGreaterThan(0);
    expect(simuler(avec(ATTENTISTE, D.contrat, 0), 3).penaliteVolume).toBe(0);
  });

  it("D6 : le suivi garde les gains, d'autant plus que les fuites ont été réparées", () => {
    const r = rejeu(MEILLEUR, D.suivi);
    expect(classement(MEILLEUR, D.suivi)[0]).toBe(0);
    expect(classement(MEILLEUR, D.suivi).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    const sansReglages = avec(MEILLEUR, D.reglages, 3);
    const s = rejeu(sansReglages, D.suivi);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(s[0]!.attendu - s[3]!.attendu + 20000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_ENERGIE_USINE, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("mesurer, réparer, puis couvrir bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(500000);
    expect(methode! - attentiste!).toBeGreaterThan(300000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["releves", "facture"],
      ["campagne"],
      ["qualite", "groupes"],
      ["nep"],
      ["offres", "volumes"],
      ["derive"],
    ],
    jours: JOURS,
    diagnostic: "usages",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 960,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_ENERGIE_USINE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("au réflexe, propose de traiter la consommation avant le prix et l'horaire", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ENERGIE_USINE.comportements(p, analyser(EPISODE_ENERGIE_USINE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_ENERGIE_USINE.axe(c).titre).toBe(
      "Traiter la consommation avant le prix et l'horaire",
    );
  });

  it("à qui a décidé sans enquêter, propose de mesurer avant d'agir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ENERGIE_USINE.comportements(p, analyser(EPISODE_ENERGIE_USINE, p).trimestre);
    expect(EPISODE_ENERGIE_USINE.axe(c).titre).toBe("Mesurer avant d'agir");
  });

  it("juge le diagnostic et la prévision des fuites", () => {
    const t = simuler(MEILLEUR, 11);
    const constats = (extra: Partial<PartieJouee>) =>
      EPISODE_ENERGIE_USINE.comportements(partie(MEILLEUR, extra), t);
    expect(constats({ prevision: 960 })[3]!.score).toBe(1);
    expect(constats({ prevision: 850 })[3]!.score).toBe(0.6);
    expect(constats({ prevision: 500 })[3]!.score).toBe(0);
    expect(constats({ diagnostic: "usages" })[1]!.score).toBe(1);
    expect(constats({ diagnostic: "prix" })[1]!.score).toBe(0.6);
    expect(constats({ diagnostic: "heures" })[1]!.score).toBe(0);
    expect(constats({})[4]!.score).toBe(1);
  });

  it("dit le résultat en écart aux budgets", () => {
    expect(EPISODE_ENERGIE_USINE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous les budgets/);
    expect(EPISODE_ENERGIE_USINE.bilan.titre(simuler(REFLEXE, 4242))).toMatch(
      /au-delà des budgets/,
    );
  });

  it("le tableau de bord ne montre les fuites qu'une fois mesurées", () => {
    expect(EPISODE_ENERGIE_USINE.lire([3], 4, 0, 4).fuitesKw).toBeNull();
    const mesure = EPISODE_ENERGIE_USINE.lire([1, 0], 4, 0, 4).fuitesKw!;
    expect(mesure).toBeLessThan(FUITES_KW * 0.5);
    expect(EPISODE_ENERGIE_USINE.lire([], 4, 0, 0).couts).toBe(0);
    expect(COUTS.campagne).toBeLessThan(COUTS.audit);
    expect(INVESTISSEMENTS.recuperation.montant).toBeLessThan(INVESTISSEMENTS.pompe.montant);
  });
});
