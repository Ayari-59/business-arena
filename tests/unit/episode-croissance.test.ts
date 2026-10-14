import { describe, expect, it } from "vitest";
import {
  BFR_ALTAIR,
  CA_ALTAIR,
  CA_ALTAIR_PAR_JOUR,
  CA_CLAIRVAL,
  D,
  DAILLY,
  FIXES_ALTAIR,
  FORMULES,
  GAGE_CLAIRVAL,
  IMPREVUS,
  JOURS_CLIENTS_ALTAIR,
  JOURS_FOURNISSEURS_ALTAIR,
  JOURS_STOCK_ALTAIR,
  PART_MENUISERIES,
  PRIMES_DEPART,
  PROVISION_PRIMES,
  SEMAINE_PRIMES,
  TMCV_ALTAIR,
  TMCV_CLAIRVAL,
  TMCV_PARTICULIERS,
  hasard,
  prevoir,
  simuler,
} from "../../src/engine/episodes/croissance-a-financer";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/croissance-a-financer";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_CROISSANCE } from "../../src/pedagogy/episodes/croissance-a-financer";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La croissance à financer » enseigne trois choses : la
 * croissance d'un marché qui paie à 77 jours consomme de la trésorerie, et
 * durablement ; un besoin durable se finance par des ressources stables, et le
 * découvert ne finance que les à-coups ; au-delà de ce qu'on peut financer,
 * l'incident de paiement arrête les chantiers. Ces tests verrouillent les
 * classements qui le disent, et les chiffres que les sources donnent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [0, 0, 3, 2, 0, 1];
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
/** La qualité que le bilan donne à une option : sa place entre la pire et la meilleure. */
function qualite(chemin: readonly number[], d: number, option: number) {
  const r = rejeu(chemin, d);
  const haut = Math.max(...r.map((x) => x.attendu));
  const bas = Math.min(...r.map((x) => x.attendu));
  return (r[option]!.attendu - bas) / (haut - bas);
}
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle d'Arvel Rénovation", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.ca).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.ca,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
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

  it("tient la trésorerie nette égale au FRNG moins le BFR ; la Dailly n'est qu'une dette à court terme", () => {
    const avecDailly = [1, 1, 1, 1, 1, 2];
    const t = simuler(avecDailly, 3);
    for (let w = 1; w <= 13; w += 1) {
      const s = t.semaines[w]!;
      expect(s.tresorerie).toBeCloseTo(s.frng - s.bfr, 6);
      expect(s.solde - s.tresorerie).toBeCloseTo(w >= 12 ? DAILLY : 0, 6);
    }
  });

  it("le résultat monte, mais le BFR monte plus vite : l'effet de ciseaux", () => {
    for (const t of [prevoir([0]), prevoir(MEILLEUR)]) {
      const resultat = t.semaines[11]!.resultat - t.semaines[2]!.resultat;
      const bfr = t.semaines[11]!.bfr - t.semaines[2]!.bfr;
      expect(resultat).toBeGreaterThan(100000);
      expect(bfr).toBeGreaterThan(resultat);
    }
    // Sans ressource stable nouvelle, la trésorerie nette touche ce que la banque tolère.
    expect(prevoir([0]).semaines[11]!.tresorerie).toBeLessThanOrEqual(-400000 + 1e-6);
  });

  it("financer au découvert mène à l'incident de paiement ; la bonne méthode le rend rare", () => {
    const avecIncident = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).incidents.length > 0).length;
    expect(avecIncident(REFLEXE)).toBe(30);
    expect(avecIncident(MEILLEUR)).toBeLessThanOrEqual(8);
    // Les indicateurs restent dans des plages réalistes : la banque rejette au-delà de sa tolérance.
    for (const g of GRAINES_DU_BILAN) {
      expect(simuler(REFLEXE, g).decouvertMax).toBeLessThanOrEqual(400000 + 1e-6);
    }
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("le BFR du marché Altaïr : (77 + 7 − 28) jours à 10 k€, soit 560 k€", () => {
    expect(CA_ALTAIR_PAR_JOUR).toBe(10000);
    expect(CA_ALTAIR_PAR_JOUR * 365).toBe(3650000);
    expect(JOURS_STOCK_ALTAIR).toBe(7);
    expect(JOURS_FOURNISSEURS_ALTAIR).toBe(28);
    expect(BFR_ALTAIR).toBe(
      (JOURS_CLIENTS_ALTAIR + JOURS_STOCK_ALTAIR - JOURS_FOURNISSEURS_ALTAIR) * 10000,
    );
    expect(BFR_ALTAIR).toBe(560000);
    expect(texte(0, "marche")).toContain("77 jours");
    expect(texte(0, "marche")).toContain("10 k€ par jour");
    expect(texte(0, "bfr")).toContain("7 jours de chiffre d'affaires");
    expect(texte(0, "bfr")).toContain("28 jours de chiffre d'affaires");
    // Et la simulation y arrive : en semaine 13, le marché tourne à son régime.
    expect(prevoir([1, 1, 3, 2, 1, 1]).bfrAltair).toBeCloseTo(BFR_ALTAIR, 0);
    expect(EPISODE_CROISSANCE.prevision.reel(simuler(MEILLEUR, 1))).toBe(560);
  });

  it("la marge du marché Altaïr : 14 k€ par semaine, 11,5 k€ après le conducteur, environ 135 k€", () => {
    expect(CA_ALTAIR * TMCV_ALTAIR).toBe(14000);
    expect(CA_ALTAIR * TMCV_ALTAIR - FIXES_ALTAIR).toBe(11500);
    const trimestre = 12 * CA_ALTAIR * TMCV_ALTAIR - 13 * FIXES_ALTAIR;
    expect(Math.abs(trimestre - 135000)).toBeLessThan(1000);
    expect(texte(0, "rentabilite")).toContain("11,5 k€");
  });

  it("le salon : 36 % de marge, et un désistement coûte la moitié du prix moins l'acompte", () => {
    const [dix, trente, credit] = FORMULES;
    expect(TMCV_PARTICULIERS).toBe(0.36);
    expect(dix!.desistements).toBe(0.19);
    expect(dix!.impayes).toBe(0.04);
    expect(trente!.desistements).toBe(0.02);
    expect(credit!.commission).toBe(0.05);
    expect(credit!.desistements).toBe(0.06);
    expect(texte(2, "salons")).toContain("19 % de désistements");
    // Ce que rapportent 1 000 € commandés, désistements et impayés compris.
    const contribution = (f: NonNullable<(typeof FORMULES)[number]>) =>
      1000 *
      ((1 - f.desistements) * TMCV_PARTICULIERS -
        f.desistements * (PART_MENUISERIES - f.acompte) -
        (1 - f.desistements) * (1 - f.acompte) * (f.impayes + f.commission));
    expect(contribution(trente!)).toBeCloseTo(348.8, 1);
    expect(contribution(dix!)).toBeCloseTo(186.44, 1);
    expect(trente!.commandes * contribution(trente!)).toBeGreaterThan(
      dix!.commandes * contribution(dix!) + 3000000,
    );
  });

  it("le lot Clairval : 4,16 M€ par an, 14,4 k€ de marge par semaine, 104 k€ de gage-espèces", () => {
    expect(CA_CLAIRVAL * 52).toBe(4160000);
    expect(CA_CLAIRVAL * TMCV_CLAIRVAL).toBeCloseTo(14400, 6);
    expect(GAGE_CLAIRVAL).toBe(104000);
    expect(texte(3, "simulation", { picComplet: "", picMoitie: "", picSansLot: "" })).toContain(
      "104 k€",
    );
  });

  it("les primes de mars : 160 k€, versées en semaine 12", () => {
    expect(PRIMES_DEPART + PROVISION_PRIMES * SEMAINE_PRIMES).toBe(160000);
    expect(SEMAINE_PRIMES).toBe(12);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le prêt à moyen terme sur dossier est le meilleur ; le découvert et le report sont loin derrière", () => {
    const r = rejeu(MEILLEUR, D.financement);
    expect(classement(MEILLEUR, D.financement)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
    // Demander plus de découvert pour un besoin durable : la banque refuse le plus souvent.
    expect(r[2]!.attendu).toBeLessThan(r[1]!.attendu - 20000);
  });

  it("D2 : laisser le dividende en compte courant bat de loin le versement prévu", () => {
    const r = rejeu(MEILLEUR, D.dividende);
    expect(classement(MEILLEUR, D.dividende)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
    // L'augmentation de capital arrive trop tard et coûte ses frais.
    expect(r[2]!.attendu).toBeLessThan(r[1]!.attendu);
  });

  it("D3 : l'acompte de 30 % fait financer la croissance par les clients ; le baisser coûte cher", () => {
    const c = classement(MEILLEUR, D.salon);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    const r = rejeu(MEILLEUR, D.salon);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(qualite(MEILLEUR, D.salon, 0)).toBeLessThan(0.7);
  });

  it("D4 : prendre la moitié du lot est le meilleur ; tout prendre est pire que refuser, quand le financement est en place", () => {
    const r = rejeu(MEILLEUR, D.clairval);
    expect(classement(MEILLEUR, D.clairval)[0]).toBe(1);
    expect(r[0]!.attendu).toBeLessThan(r[2]!.attendu);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D4, l'interaction : sans prêt en semaine 1, prendre la moitié du lot ne vaut plus mieux que refuser", () => {
    const avecPret = rejeu(MEILLEUR, D.clairval);
    const sansPret = rejeu([0, 1, 1, 1, 1, 1], D.clairval);
    expect(avecPret[1]!.attendu - avecPret[2]!.attendu).toBeGreaterThan(10000);
    expect(sansPret[1]!.attendu - sansPret[2]!.attendu).toBeLessThan(0);
  });

  it("D5 : faire garantir l'encours par la holding est le meilleur ; laisser faire est un pari perdant", () => {
    const r = rejeu(MEILLEUR, D.valcourt);
    expect(classement(MEILLEUR, D.valcourt)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(qualite(MEILLEUR, D.valcourt, 0)).toBeLessThan(0.7);
  });

  it("D6 : le découvert autorisé est le meilleur en moyenne, la Dailly le plus sûr ; le report des LCR le pire", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(1);
    expect(classement(MEILLEUR, D.pic).at(-1)).toBe(0);
    // Espérance contre robustesse : la Dailly coûte un peu, et protège des mauvais tirages.
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10 + 5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeLessThan(3000);
  });

  it("D6, l'interaction : sans prêt en semaine 1, le pic ne passe plus au découvert, et la Dailly devient le meilleur choix", () => {
    const c = classement([0, 1, 1, 1, 1, 1], D.pic);
    expect(c[0]).toBe(2);
  });

  it("aucun réflexe n'est un bon choix sur le meilleur chemin, et aucun n'y figure", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const r = rejeu(MEILLEUR, d);
      const meilleur = Math.max(...r.map((x) => x.attendu));
      expect(meilleur - r[o]!.attendu, `D${d + 1} option ${o}`).toBeGreaterThan(1000);
      expect(qualite(MEILLEUR, d, o), `D${d + 1} option ${o}`).toBeLessThan(0.7);
    }
  });

  it("chiffrer, financer selon la nature et doser bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 50000);
    expect(methode).toBeGreaterThan(attentiste! + 50000);
    expect(attentiste).toBeGreaterThan(-150000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["marche", "bfr"], ["dividende"], ["salons"], ["simulation"], ["encours"], ["pic"]],
    jours: JOURS,
    diagnostic: "structurel",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 560,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CROISSANCE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout pris au découvert, propose de prendre la croissance qu'on peut financer", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CROISSANCE.comportements(p, analyser(EPISODE_CROISSANCE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CROISSANCE.axe(c).titre).toBe("Prendre la croissance qu'on peut financer");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer le besoin avant de signer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CROISSANCE.comportements(p, analyser(EPISODE_CROISSANCE, p).trimestre);
    expect(EPISODE_CROISSANCE.axe(c).titre).toBe("Chiffrer le besoin avant de signer");
  });

  it("juge la prévision sur le BFR du marché, au plus près de 20 k€", () => {
    const juste = EPISODE_CROISSANCE.comportements(
      partie(MEILLEUR, { prevision: 575 }),
      simuler(MEILLEUR, 11),
    );
    expect(juste[3]!.score).toBe(1);
    const oubliFournisseurs = EPISODE_CROISSANCE.comportements(
      partie(MEILLEUR, { prevision: 840 }),
      simuler(MEILLEUR, 11),
    );
    expect(oubliFournisseurs[3]!.score).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_CROISSANCE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_CROISSANCE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
