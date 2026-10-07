import { describe, expect, it } from "vitest";
import {
  ACCUEIL,
  CONVENTION,
  COUT_BAISSE,
  CRT,
  D,
  DOTATION_ANNUELLE,
  GAIN_HORS,
  IMPREVUS,
  MARGE_CONVENTION,
  MULTIPLE,
  OCCUPATION_BEAUNE,
  PILOTE,
  RECETTES_PLACE,
  TARIF,
  TAUX,
  annuite,
  annuiteEmprunt,
  chanceOrchidia,
  croyance,
  departsBeaune,
  gainFinance,
  hasard,
  margeAccueil,
  margeCRT,
  margePilote,
  recettesRSS,
  seuilRSS,
  simuler,
  TAUX_BANQUE,
  RSS,
} from "../../src/engine/episodes/virage-domiciliaire";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/virage-domiciliaire";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_VIRAGE,
  RECETTES_PERDUES_KE,
} from "../../src/pedagogy/episodes/virage-domiciliaire";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le virage vers le domicile » enseigne qu'un gestionnaire crée
 * de la valeur en développant son offre là où vont les besoins et les
 * financements, par étapes testées et avec ce qu'il sait faire, plutôt qu'en
 * défendant ses lits ou en imitant le concurrent commercial ; et que la
 * transformation se teste, parce qu'elle concentre le risque. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le modèle
 * les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 0, 1, 1, 1];
const REFLEXE = [0, 0, 2, 0, 0, 0];
const ATTENTISTE = [3, 2, 2, 0, 3, 3];
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
/** Un montant en milliers d'euros, au dixième, à la française. */
const k1 = (v: number) => (v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_VIRAGE.contexte(
    EPISODE_VIRAGE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle du virage domiciliaire", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).adhesion).toBe(simuler(REFLEXE, 12).adhesion);
    expect(simuler(MEILLEUR, 12).demande).toBe(simuler(ATTENTISTE, 12).demande);
    // Les décisions des semaines 6 à 10 ne changent rien à la valeur de la semaine 6.
    expect(simuler(MEILLEUR, 12).semaines[6]!.valeur).toBeCloseTo(
      simuler([1, 1, 0, 0, 0, 0], 12).semaines[6]!.valeur,
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

  it("le financement est appliqué une fois sur deux environ, différé ou renforcé sinon", () => {
    const n = (s: string) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length;
    expect(n("applique")).toBeGreaterThanOrEqual(10);
    expect(n("applique")).toBeLessThanOrEqual(20);
    expect(n("differe")).toBeGreaterThanOrEqual(4);
    expect(n("renforce")).toBeGreaterThanOrEqual(2);
    // La réponse du département au pilote fait monter ou baisser le risque d'un schéma différé.
    for (const g of GRAINES_DU_BILAN) {
      const apres = croyance(g, PILOTE.semaine).differe;
      if (hasard(g).signal) expect(apres).toBeLessThan(0.3);
      else expect(apres).toBeGreaterThan(0.3);
      expect(croyance(g, 12).differe).toBe(hasard(g).scenario === "differe" ? 1 : 0);
    }
  });

  it("Orchidia accepte d'autant plus volontiers que l'association a une offre à domicile", () => {
    const acceptes = (d1: number) =>
      GRAINES_DU_BILAN.filter((g) => simuler([d1, 1, 0, 1, 1, 1], g).orchidiaAccepte).length;
    expect(acceptes(1)).toBeGreaterThan(acceptes(0));
    expect(acceptes(1)).toBeGreaterThan(acceptes(3));
    expect(chanceOrchidia([1])).toBe(0.7);
    expect(chanceOrchidia([0])).toBe(0.3);
    // Sans convention proposée, aucune réponse.
    expect(GRAINES_DU_BILAN.some((g) => simuler([1, 2, 0, 1, 1, 1], g).orchidiaAccepte)).toBe(
      false,
    );
  });

  it("l'équipe de Beaune ne perd des soignants que si l'on transforme quarante places d'un coup", () => {
    const n = GRAINES_DU_BILAN.filter((g) => departsBeaune([2, 1, 0, 1, 1, 1], g)).length;
    expect(n).toBeGreaterThan(8);
    expect(n).toBeLessThan(24);
    expect(GRAINES_DU_BILAN.some((g) => departsBeaune(MEILLEUR, g))).toBe(false);
  });

  it("la valeur de la semaine 13 est l'objectif ; rien n'est compté avant la première décision", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.semaines[1]!.valeur).toBe(0);
  });

  it("la bonne méthode atteint en moyenne l'objectif ; ne rien faire face au virage coûte", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(500000);
    expect(attendu(MEILLEUR)).toBeLessThan(1500000);
    expect(attendu(ATTENTISTE)).toBeLessThan(0);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-800000);
    expect(attendu(REFLEXE)).toBeLessThan(attendu(ATTENTISTE));
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("une place de Beaune : 31,6 k€ de recettes hors soins, 631 k€ pour vingt places, la prévision de la semaine 1", () => {
    const aLaMain = 365 * OCCUPATION_BEAUNE * (TARIF.hebergement + TARIF.dependance);
    expect(RECETTES_PLACE).toBeCloseTo(aLaMain, 6);
    expect(k1(RECETTES_PLACE)).toBe("31,6");
    expect(Math.round(RECETTES_PERDUES_KE)).toBe(631);
    expect(EPISODE_VIRAGE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(
      (20 * RECETTES_PLACE) / 1000,
      6,
    );
    const tarifs = source(0, "tarifs", []);
    expect(tarifs).toContain(`${TARIF.hebergement} € d'hébergement`);
    expect(tarifs).toContain(`${TARIF.dependance} € de dépendance`);
    expect(tarifs).toContain(`${TARIF.soins} € de soins`);
    expect(tarifs).toContain(`${k1(RECETTES_PLACE)} k€ par place et par an`);
    // Sans financement, une place transformée coûte 5,0 k€ par an ; financée, elle rapporte 6,0 ou 8,0.
    expect((-GAIN_HORS / 1000).toFixed(1)).toBe("5.0");
    expect(tarifs).toContain("coûte donc 5,0 k€ par an");
    expect((gainFinance("applique") / 1000).toFixed(1)).toBe("6.0");
    expect((gainFinance("renforce") / 1000).toFixed(1)).toBe("8.0");
    expect(source(5, "mandat", [1, 1, 0, 1, 1])).toContain("rapporte 6,0 k€ par an (8,0 si");
  });

  it("la résidence services : 1 488 k€ de recettes pleines, 704 k€ d'annuité, rentable au-delà de 88 %", () => {
    expect(k(recettesRSS(1))).toBe(1488);
    expect(k(annuiteEmprunt(RSS.emprunt, TAUX_BANQUE.base, RSS.duree))).toBe(704);
    expect(k(annuiteEmprunt(RSS.emprunt, TAUX_BANQUE.caution, RSS.duree))).toBe(749);
    expect(Math.round(seuilRSS(TAUX_BANQUE.base) * 100)).toBe(88);
    expect(Math.round(seuilRSS(TAUX_BANQUE.caution) * 100)).toBe(91);
    const compte = source(1, "compte", [1]);
    expect(compte).toContain("1 488 k€ de recettes");
    expect(compte).toContain("704 k€ d'annuité à 4 %, 749 k€ à 4,6 %");
    expect(compte).toContain("au-delà de 88 % d'occupation (91 % avec la caution)");
    // Face à une Orchidia qui baisse ses prix, la résidence perd de l'argent.
    expect(RSS.remplissage.guerre).toBeLessThan(seuilRSS(TAUX_BANQUE.base));
  });

  it("la convention avec Orchidia et la baisse de prix coûtent ou rapportent ce que les sources affichent", () => {
    expect(MARGE_CONVENTION).toBeCloseTo(
      CONVENTION.heures * (CONVENTION.tarif - CONVENTION.cout),
      6,
    );
    expect(k(MARGE_CONVENTION)).toBe(33);
    expect(source(1, "orchidia", [1])).toContain(": 33 k€ par an");
    expect(source(1, "orchidia", [1])).toContain("à 70 % la chance");
    expect(source(1, "orchidia", [0])).toContain("à 30 % la chance");
    expect(k(COUT_BAISSE)).toBe(53);
    expect(ETAPES[1]!.options[3]!.d).toContain("53 k€");
  });

  it("le centre de ressources : 45 k€ d'excédent à trente personnes, 30 k€ de déficit à soixante", () => {
    expect(k(margeCRT(0))).toBe(45);
    expect(k(margeCRT(1))).toBe(-30);
    const cahier = source(2, "cahier", [1, 1]);
    expect(cahier).toContain(`${k(CRT.couts[0]!)} k€ par an`);
    expect(cahier).toContain("45 k€ d'excédent");
    expect(cahier).toContain("30 k€ de déficit");
    expect(cahier).toContain("à 75 % avec un dossier à trente personnes");
  });

  it("le pilote : les familles candidates et les places vides du plan, à l'adhésion constatée", () => {
    for (const g of [1, 3, 9]) {
      const a = hasard(g).adhesion;
      const candidats = Math.round(PILOTE.eligibles * a);
      const texte = source(3, "couts", [1, 1, 0], g);
      expect(texte).toContain(`(${Math.round(a * 100)} %), ${candidats} choisiraient`);
      expect(texte).toContain(`${PILOTE.plan - candidats} resteraient vides`);
    }
    // Une extension comme prévu perd de l'argent si le schéma n'est pas renforcé.
    expect(margePilote(0, 0.5, "applique", false)).toBeLessThan(0);
    expect(margePilote(1, 0.5, "applique", false)).toBeGreaterThan(0);
  });

  it("l'accueil de jour : 63 % de remplissage pour couvrir ses charges ; sans transport, il perd si la demande est faible", () => {
    const seuil = ACCUEIL.fixes / (ACCUEIL.places * ACCUEIL.jours * ACCUEIL.recette);
    expect(Math.round(seuil * 100)).toBe(63);
    expect(ETAPES[4]!.messages({}).some((m) => m.texte.includes("au-delà de 63 %"))).toBe(true);
    expect(margeAccueil("grand", "faible")).toBe(-54000);
    expect(margeAccueil("minibus", "forte")).toBe(36000);
    expect(margeAccueil("petit", "faible")).toBe(2000);
  });

  it("la dotation complémentaire vaut 47,5 k€ par an ; un euro d'excédent vaut 4,45 € sur le CPOM", () => {
    expect(DOTATION_ANNUELLE).toBe(47500);
    expect(source(5, "mandat", [1, 1, 0, 1, 1])).toContain("47,5 k€ par an");
    expect(MULTIPLE).toBeCloseTo(annuite(5, TAUX), 9);
    expect(MULTIPLE.toFixed(2)).toBe("4.45");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le virage par étapes bat la défense des lits, l'attente et, de loin, le grand virage", () => {
    const r = rejeu(MEILLEUR, D.orientation);
    expect(classement(MEILLEUR, D.orientation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(400000);
    // Le grand virage gagne si le schéma est renforcé, et perd gros sinon : le plus exposé.
    expect(plusSure(MEILLEUR, D.orientation)).toBe(1);
  });

  it("D2 : la convention de parcours bat la résidence concurrente, d'autant plus après le virage par étapes", () => {
    const r = rejeu(MEILLEUR, D.orchidia);
    expect(classement(MEILLEUR, D.orchidia)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(300000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.orchidia);
      return x[1]!.attendu - x[2]!.attendu;
    };
    // Orchidia accepte plus volontiers qui a une offre à domicile à proposer.
    expect(ecart(MEILLEUR)).toBeGreaterThan(ecart([0, 1, 0, 1, 1, 1]) + 50000);
  });

  it("D3 : candidater avec ce qu'on sait faire bat la surenchère et le renoncement, surtout après le virage par étapes", () => {
    const r = rejeu(MEILLEUR, D.crt);
    expect(classement(MEILLEUR, D.crt)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(200000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(150000);
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.crt);
      return x[0]!.attendu - x[2]!.attendu;
    };
    expect(ecart(MEILLEUR)).toBeGreaterThan(ecart([0, 1, 0, 1, 1, 1]) + 50000);
  });

  it("D4 : réviser l'extension au vu du pilote bat le plan ; arrêter est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.pilote);
    expect(classement(MEILLEUR, D.pilote)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    // L'information du pilote fait changer de cap ; renoncer protège mieux d'un schéma différé.
    expect(plusSure(MEILLEUR, D.pilote)).toBe(2);
  });

  it("D5 : interroger les aidants avant d'ouvrir bat toute ouverture à l'aveugle", () => {
    const r = rejeu(MEILLEUR, D.accueil);
    expect(classement(MEILLEUR, D.accueil)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    // L'enquête coûte 12 k€ et vaut plus que ce prix : elle change le format retenu.
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(ACCUEIL.enquete);
  });

  it("D6 : des paliers conditionnés au financement battent l'identique, le report et l'engagement ferme", () => {
    const r = rejeu(MEILLEUR, D.cpom);
    expect(classement(MEILLEUR, D.cpom)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(250000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(300000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(150000);
  });

  it("le virage par étapes bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(1000000);
    expect(bonne! - attentiste!).toBeGreaterThan(800000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_VIRAGE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option.p10 > m.meilleure.p10 && m.meilleure.moyenne - option.moyenne < 3000).toBe(
        false,
      );
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tarifs", "schema"],
      ["compte", "orchidia"],
      ["cahier"],
      ["couts"],
      ["accueils"],
      ["mandat"],
    ],
    jours: JOURS,
    diagnostic: "virage",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 631,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [1, 2, 11, 42, 4242]) {
      const a = analyser(EPISODE_VIRAGE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose d'aller là où vont les besoins et les financements", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_VIRAGE.comportements(p, analyser(EPISODE_VIRAGE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_VIRAGE.axe(c).titre).toBe("Aller là où vont les besoins et les financements");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qu'une place perd et rapporte", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_VIRAGE.comportements(p, analyser(EPISODE_VIRAGE, p).trimestre);
    expect(EPISODE_VIRAGE.axe(c).titre).toBe(
      "Chercher ce qu'une place perd et ce qu'elle rapporte",
    );
  });

  it("juge les recettes perdues calculées en semaine 1 : juste, proche, ou forfait soins compris", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_VIRAGE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(631)).toBe(1);
    // Au taux d'occupation cible de 97 % au lieu de celui de Beaune.
    expect(score(Math.round((20 * 365 * 0.97 * 94) / 1000))).toBe(0.6);
    // En comptant le forfait soins, qui suit pourtant la place.
    expect(score(Math.round((20 * 365 * OCCUPATION_BEAUNE * 132) / 1000))).toBe(0);
  });

  it("le constat du domaine : réviser au vu du pilote, s'informer avant d'ouvrir", () => {
    const tester = (chemin: readonly number[]) =>
      EPISODE_VIRAGE.comportements(partie(chemin), simuler(chemin, 11, JOURS))[4]!.score;
    expect(tester(MEILLEUR)).toBe(1);
    expect(tester(REFLEXE)).toBe(0);
    expect(tester([1, 1, 0, 2, 2, 1])).toBeCloseTo(0.6, 6);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_VIRAGE.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/valeur créée/);
    expect(EPISODE_VIRAGE.bilan.titre(simuler(REFLEXE, 2))).toMatch(/valeur détruite/);
    expect(EPISODE_VIRAGE.bilan.tuiles(simuler(MEILLEUR, 2))).toHaveLength(4);
  });
});
