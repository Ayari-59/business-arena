import { describe, expect, it } from "vitest";
import {
  CASSE_DEPART,
  CHANGEMENT,
  COMPENSATION,
  COMPENSATION_SEMAINE,
  COUT_FROID,
  COUT_REVIENT,
  COUT_VARIABLE,
  D,
  DLC,
  DON,
  FENETRE_JOURS,
  IMPREVUS,
  LOT_ACTUEL_REFERENCE,
  LOT_ECONOMIQUE_REFERENCE,
  REDUCTION_DON,
  REFERENCE_PREVISION,
  REFS,
  SERIES,
  TRANSPORT,
  VALEUR_DON,
  chanceDeCompensation,
  chanceQueCeltisAccepte,
  couvertureEconomique,
  couvertureWilsonC,
  decomposition,
  hasard,
  possession,
  simuler,
  tauxCasseSerie,
} from "../../src/engine/episodes/dlc-qui-tombe";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/dlc-qui-tombe";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_DLC } from "../../src/pedagogy/episodes/dlc-qui-tombe";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les palettes qui périment » enseigne qu'un produit frais ne se
 * stocke pas : la taille de lot se calcule en comparant le coût d'un
 * changement de série à celui de la casse, dans la limite de la fenêtre de
 * fraîcheur ; on prévoit avec l'enseigne plutôt que de stocker ; brader les
 * surplus abîme la marque, les donner coûte peu. Ces tests verrouillent les
 * chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 2, 1, 1, 0];
const REFLEXE = [0, 2, 1, 0, 0, 1];
const ATTENTISTE = [3, 3, 0, 3, 3, 3];
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

/** Un nombre tel que les sources l'écrivent : « 128 000 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR");
const centimes = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pourcent = (v: number) => `${Math.round(v * 100)} %`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le calcul du lot de la crème chocolat donne la prévision : 128 milliers de pots, moins d'une semaine", () => {
    const lot = texte(0, "lot");
    expect(lot).toContain(`${fr(REFERENCE_PREVISION.demande * 1000)} pots vendus par semaine`);
    expect(lot).toContain(`coûte ${CHANGEMENT.cout} €`);
    expect(lot).toContain(`${centimes(COUT_FROID)} €`);
    expect(lot).toContain(`${centimes(REFS.A.casseStock * COUT_VARIABLE)} €`);
    expect(lot).toContain(`${fr(Math.round(LOT_ACTUEL_REFERENCE) * 1000)} pots`);
    expect(possession("A")).toBeCloseTo(3.3, 10);
    expect(LOT_ECONOMIQUE_REFERENCE).toBeCloseTo(Math.sqrt((2 * 150 * 180) / 3.3), 10);
    expect(LOT_ECONOMIQUE_REFERENCE).toBeCloseTo(127.92, 2);
    expect(EPISODE_DLC.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(127.92, 2);
    // Le lot économique tient dans la fenêtre : moins de huit jours de ventes.
    expect(FENETRE_JOURS).toBe(Math.floor(DLC / 3 - TRANSPORT));
    expect(lot).toContain(`au plus ${FENETRE_JOURS} jours`);
    expect((LOT_ECONOMIQUE_REFERENCE / REFERENCE_PREVISION.demande) * 7).toBeLessThan(
      FENETRE_JOURS,
    );
  });

  it("pour les faibles rotations, Wilson dépasse la fenêtre : c'est la fenêtre qui fixe la série", () => {
    expect(couvertureWilsonC()).toBeGreaterThan(2);
    expect(couvertureEconomique("C")).toBeCloseTo(FENETRE_JOURS / 7, 10);
    expect(couvertureEconomique("A")).toBeLessThan(1);
    expect(SERIES[1]!.A).toBe(couvertureEconomique("A"));
    // Au-delà de la fenêtre, la casse s'accélère.
    const pente = (c: number) => tauxCasseSerie("C", c + 0.5, 0.1) - tauxCasseSerie("C", c, 0.1);
    expect(pente(2.5)).toBeGreaterThan(3 * pente(0.5));
  });

  it("la casse du printemps se décompose comme le modèle : 2,8 %, dont plus de la moitié par les séries", () => {
    const d = decomposition();
    const s = texte(0, "decomposer");
    expect(d.taux).toBeCloseTo(CASSE_DEPART, 3);
    expect(s).toContain(`coûté ${(Math.round(d.taux * 1000) / 10).toLocaleString("fr-FR")} %`);
    expect(s).toContain(`${pourcent(d.series / d.total)} viennent des séries`);
    expect(s).toContain(`${pourcent(d.promo / d.total)} des promotions`);
    expect(s).toContain(`${pourcent(d.prevision / d.total)} des écarts de prévision`);
    expect(s).toContain(`${pourcent(d.volumeC)} des volumes et ${pourcent(d.partC)} de la casse`);
    expect(d.series / d.total).toBeGreaterThan(0.5);
  });

  it("un don vaut 60 % du coût de revient, pas du prix ; Opaline a coûté deux mois de remise", () => {
    const f = texte(2, "fiscal");
    expect(VALEUR_DON).toBeCloseTo(REDUCTION_DON * COUT_REVIENT - DON.logistique, 10);
    expect(VALEUR_DON).toBeCloseTo(146.8, 6);
    expect(f).toContain(`${centimes(REDUCTION_DON * COUT_REVIENT)} €`);
    expect(f).toContain(`${centimes(VALEUR_DON)} €`);
    expect(f).toContain(`${COUT_REVIENT} €`);
    const m = texte(2, "marque");
    expect(m).toContain(`${fr((COMPENSATION_SEMAINE * COMPENSATION.semaines) / 1000)} k€`);
    expect(texte(2, "associations")).toContain(`${DON.palettes} palettes par semaine`);
  });
});

describe("le modèle du plan de production", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).rentree).toBe(simuler(REFLEXE, 12).rentree);
    expect(simuler(MEILLEUR, 12).semaines[1]!.commandes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.commandes,
      6,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const i = hasard(g).imprevus;
      expect(i.length).toBeGreaterThanOrEqual(1);
      expect(i.length).toBeLessThanOrEqual(2);
      for (const x of i) {
        expect(x.semaine).toBeGreaterThanOrEqual(2);
        expect(x.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("ne rien changer reproduit le printemps ; la méthode ramène la casse sous la trajectoire", () => {
    const neutre = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g));
    const casse = moyenne(neutre.map((t) => t.casseTaux));
    expect(casse).toBeGreaterThan(0.025);
    expect(casse).toBeLessThan(0.031);
    expect(moyenne(neutre.map((t) => t.serviceCeltis))).toBeLessThan(0.975);
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    expect(moyenne(bon.map((t) => t.casseTaux))).toBeLessThan(0.02);
    expect(moyenne(bon.map((t) => t.serviceCeltis))).toBeGreaterThan(0.975);
  });

  it("les petites séries saturent les lignes : samedis, puis ruptures et pénalités", () => {
    const petites = avec(MEILLEUR, D.series, 2);
    const somme = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      GRAINES_DU_BILAN.reduce((s, g) => s + f(simuler(c, g)), 0);
    expect(somme(petites, (t) => t.samedis)).toBeGreaterThan(2 * somme(MEILLEUR, (t) => t.samedis));
    expect(somme(petites, (t) => t.penalites)).toBeGreaterThan(somme(MEILLEUR, (t) => t.penalites));
    expect(somme(petites, (t) => t.casseTaux)).toBeLessThan(somme(MEILLEUR, (t) => t.casseTaux));
  });

  it("Celtis accepte selon la proposition ; Opaline réclame selon le volume déstocké", () => {
    expect(chanceQueCeltisAccepte(MEILLEUR)).toBeGreaterThan(
      chanceQueCeltisAccepte(avec(MEILLEUR, D.celtis, 1)) + 0.3,
    );
    expect(chanceQueCeltisAccepte(ATTENTISTE)).toBe(0);
    const reponses = new Set(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).celtisAccepte));
    expect(reponses).toEqual(new Set([true, false]));
    expect(chanceDeCompensation(0)).toBe(0);
    const compensations = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).compensation).length;
    // Les grandes séries bradées font beaucoup de déstockage : Opaline réclame presque à coup sûr.
    expect(compensations(REFLEXE)).toBeGreaterThan(20);
    expect(compensations(avec(MEILLEUR, D.surplus, 1))).toBeGreaterThan(0);
    expect(compensations(MEILLEUR)).toBe(0);
    // Un été sous 97,5 % de service fait déréférencer des faibles rotations une fois sur deux.
    const deref = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).dereferencement).length;
    expect(deref(ATTENTISTE)).toBeGreaterThan(3 * deref(MEILLEUR));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le lot économique bat le plan actuel, les grandes séries et les petites séries", () => {
    const r = rejeu(MEILLEUR, D.series);
    expect(classement(MEILLEUR, D.series)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
  });

  it("D2 : la prévision partagée contre un engagement est la meilleure en moyenne ; la demande sans contrepartie protège mieux", () => {
    const r = rejeu(MEILLEUR, D.celtis);
    expect(classement(MEILLEUR, D.celtis)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).not.toBe(0);
    expect(r[1]!.p10 - r[0]!.p10).toBeGreaterThan(5000);
  });

  it("D3 : donner bat détruire et brader ; brader ne vaut même pas la méthanisation", () => {
    const r = rejeu(MEILLEUR, D.surplus);
    expect(classement(MEILLEUR, D.surplus)).toEqual([2, 0, 1]);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
  });

  it("D4 : le stock ciblé bat trois jours de stock partout, de loin", () => {
    const r = rejeu(MEILLEUR, D.service);
    expect(classement(MEILLEUR, D.service)[0]).toBe(1);
    expect(classement(MEILLEUR, D.service).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D5 : deux séries ajustées sur les ventes battent la série unique et la marge de 20 %", () => {
    const r = rejeu(MEILLEUR, D.rentree);
    expect(classement(MEILLEUR, D.rentree)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : le PIC mensuel bat la prime au coût unitaire, et la DLC allongée sans étude coûte", () => {
    const r = rejeu(MEILLEUR, D.automne);
    expect(classement(MEILLEUR, D.automne)[0]).toBe(0);
    expect(r[3]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[3]!.p10 - r[2]!.p10).toBeGreaterThan(100000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
  });

  it("D6 dépend de D1 et de D2 : la prime coûte plus après des séries raccourcies, le PIC vaut plus avec Celtis", () => {
    const prime = (c: readonly number[]) => {
      const r = rejeu(c, D.automne);
      return r[3]!.attendu - r[1]!.attendu;
    };
    expect(prime(MEILLEUR)).toBeGreaterThan(prime(avec(MEILLEUR, D.series, 3)) + 10000);
    const t = (g: number, c: readonly number[]) => simuler(c, g).effets.automne;
    const acceptes = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).celtisAccepte);
    const refuses = GRAINES_DU_BILAN.filter((g) => !simuler(MEILLEUR, g).celtisAccepte);
    expect(moyenne(acceptes.map((g) => t(g, MEILLEUR)))).toBeGreaterThan(
      moyenne(refuses.map((g) => t(g, MEILLEUR))) + 8000,
    );
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni n'est le plus sûr", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_DLC, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("produire au plus près bat les grandes séries et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(200000);
    expect(methode! - attentiste!).toBeGreaterThan(100000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["decomposer", "lot"],
      ["celtis"],
      ["fiscal"],
      ["ruptures"],
      ["historique"],
      ["pontivy", "qualite"],
    ],
    jours: JOURS,
    diagnostic: "plan",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 128,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_DLC, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a allongé les séries et stocké, propose de produire au plus près", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DLC.comportements(p, analyser(EPISODE_DLC, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DLC.axe(c).titre).toBe("Produire au plus près plutôt que stocker et brader");
  });

  it("à qui a décidé sans enquêter, propose de décomposer la casse", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DLC.comportements(p, analyser(EPISODE_DLC, p).trimestre);
    expect(EPISODE_DLC.axe(c).titre).toBe("Décomposer la casse avant de toucher au plan");
  });

  it("juge la prévision du lot économique à quelques milliers de pots près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_DLC.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(128)).toBe(1);
    expect(calibrage(145)).toBe(0.6);
    expect(calibrage(214)).toBe(0);
    // Oublier la casse dans le coût de possession donne un lot bien trop grand.
    expect(Math.sqrt((2 * 150 * 180) / COUT_FROID)).toBeGreaterThan(200);
  });

  it("dit le résultat en marge nette et en effet attendu sur l'automne", () => {
    expect(EPISODE_DLC.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de marge nette.*automne/);
    expect(EPISODE_DLC.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
  });
});
