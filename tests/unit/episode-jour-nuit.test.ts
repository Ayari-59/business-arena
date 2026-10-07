import { describe, expect, it } from "vitest";
import {
  AIDES_MATIN,
  AS_MATIN,
  CAPACITE_MATIN,
  CHUTES_BASE,
  CHUTES_PAR_LEVER,
  CHUTES_PAR_OUBLI_DE_QUALITE,
  COUT_CHEVAUCHEMENT,
  COUT_CHUTE,
  COUT_FORMATION,
  COUT_OUBLI,
  COUT_RECLAMATION,
  COUT_REFERENTES,
  COUT_RENFORT,
  COUT_REUNION,
  COUT_REUNION_MENSUELLE,
  COUT_REVISION,
  D,
  DEPLACEES,
  HEURES_NUIT,
  HEURE_JOUR,
  IMPREVUS,
  INTERIM_HEURE,
  INTERIM_HT,
  LEVERS_DEPART,
  LEVERS_REVISION,
  LEVE_TOT,
  NUITS_PAR_SEMAINE,
  OUBLIS_MAX,
  POSTE_INTERIM_TRIMESTRE,
  QUALITE_DEPART,
  RECLAMATIONS_BASE,
  RECLAMATIONS_PAR_LEVER,
  RECLAMATIONS_PAR_REPORT,
  RENFORT_TOILETTES,
  SALAIRE_HEURE,
  SEMAINES,
  TOILETTES_PAR_AS,
  TVA,
  chanceQueLaRepartitionTienne,
  departsDeRotation,
  hasard,
  risqueMutation,
  simuler,
} from "../../src/engine/episodes/equipes-jour-et-nuit";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/equipes-jour-et-nuit";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import {
  CHUTES_AUTOMNE,
  EPISODE_JOUR_NUIT,
} from "../../src/pedagogy/episodes/equipes-jour-et-nuit";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'équipe de jour et l'équipe de nuit » enseigne qu'entre deux
 * équipes qui ne se croisent jamais, le conflit vient des tâches à la
 * frontière des postes et des transmissions : on le règle par des temps
 * communs, des transmissions ciblées et une répartition décidée ensemble, pas
 * en tranchant pour une équipe ni en imposant une rotation à tous. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 0, 1, 0, 0, 0];
const REFLEXE = [0, 1, 2, 2, 1, 1];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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

/** Un nombre tel que les sources l'écrivent : « 1 300 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les plans de soins donnent la charge du matin : 42 toilettes pour 40", () => {
    const plans = texte(0, "plans");
    expect(plans).toContain(`${AIDES_MATIN} résidents`);
    expect(plans).toContain(`La nuit en lève et en lave ${LEVERS_DEPART}`);
    expect(plans).toContain(`${LEVE_TOT} sont des lève-tôt`);
    expect(plans).toContain(`les ${LEVERS_DEPART - LEVE_TOT} autres`);
    expect(plans).toContain(`Restent ${AIDES_MATIN - LEVERS_DEPART} toilettes`);
    expect(plans).toContain(`pour ${AS_MATIN} aides-soignants`);
    expect(plans).toContain(`chacun en tient ${TOILETTES_PAR_AS}, soit ${CAPACITE_MATIN}`);
    expect(AIDES_MATIN - LEVERS_DEPART - CAPACITE_MATIN).toBe(2);
    expect(plans).toContain("Deux toilettes par jour");
  });

  it("les ressources humaines donnent la prévision : 26,5 k€ pour une veilleuse en intérim", () => {
    const rh = texte(0, "interim");
    expect(rh).toContain("sept nuits de dix heures par quinzaine");
    expect(NUITS_PAR_SEMAINE).toBe(7 / 2);
    expect(HEURES_NUIT).toBe(10);
    expect(rh).toContain(`${INTERIM_HT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`);
    expect(rh).toContain(`${TVA * 100} %`);
    expect(rh).toContain(`${SALAIRE_HEURE} € chargés`);
    expect(rh).toContain("trois nuits demandées sur quatre");
    // 455 heures sur treize semaines, à 58,20 € toutes taxes : deux fois l'heure salariée.
    expect(NUITS_PAR_SEMAINE * SEMAINES * HEURES_NUIT).toBe(455);
    expect(INTERIM_HEURE).toBeCloseTo(58.2, 6);
    expect(INTERIM_HEURE / SALAIRE_HEURE).toBeCloseTo(2, 1);
    expect(POSTE_INTERIM_TRIMESTRE).toBeCloseTo(26.481, 6);
    expect(EPISODE_JOUR_NUIT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(26.481, 6);
  });

  it("les événements de l'automne sont ceux du modèle à dix-huit levers", () => {
    const ev = texte(0, "evenements");
    const imposes = LEVERS_DEPART - LEVE_TOT;
    const chutes =
      SEMAINES *
      (CHUTES_BASE +
        CHUTES_PAR_OUBLI_DE_QUALITE * (1 - QUALITE_DEPART) +
        CHUTES_PAR_LEVER * imposes);
    expect(CHUTES_AUTOMNE).toBe(31);
    expect(Math.round(chutes)).toBe(31);
    expect(ev).toContain(`${CHUTES_AUTOMNE} chutes`);
    expect(ev).toContain(
      `dont ${Math.round(SEMAINES * CHUTES_PAR_LEVER * imposes)} entre 5 h et 8 h`,
    );
    const reclamations =
      SEMAINES *
      (RECLAMATIONS_BASE + RECLAMATIONS_PAR_LEVER * imposes + RECLAMATIONS_PAR_REPORT * 2);
    expect(ev).toContain(`${Math.round(reclamations)} réclamations`);
    expect(ev).toContain(`dont ${Math.round(SEMAINES * RECLAMATIONS_PAR_LEVER * imposes)} sur`);
    expect(ev).toContain(`${Math.round(SEMAINES * OUBLIS_MAX * (1 - QUALITE_DEPART))} événements`);
    expect(ev).toContain(`une chute à ${COUT_CHUTE} €`);
    expect(ev).toContain(`une réclamation à ${COUT_RECLAMATION} €`);
    expect(ev).toContain(`un défaut de transmission à ${COUT_OUBLI} €`);
    // Le tableau de départ du joueur annonce les mêmes chutes.
    expect(EPISODE_JOUR_NUIT.lire([], 1, 0, 0).chutes! * SEMAINES).toBeCloseTo(chutes, 6);
  });

  it("la répartition, le renfort et les options sont chiffrés comme dans le modèle", () => {
    const journee = texte(3, "journee", { reunion: true });
    expect(journee).toContain("huit résidents");
    expect(journee).toContain("six résidents");
    expect(DEPLACEES).toBe(8 + 6);
    expect(LEVERS_REVISION).toBe(LEVE_TOT + 1);
    expect(journee).toContain(
      `retomberait à ${AIDES_MATIN - LEVERS_REVISION - DEPLACEES} toilettes`,
    );
    expect(AIDES_MATIN - LEVERS_REVISION - DEPLACEES).toBe(CAPACITE_MATIN);
    const renfort = texte(3, "renfort");
    expect(renfort).toContain(`30 heures par semaine à ${HEURE_JOUR} € chargés`);
    expect(renfort).toContain(`soit ${COUT_RENFORT} € par semaine`);
    expect(renfort).toContain("huit toilettes");
    expect(RENFORT_TOILETTES).toBe(8);
    expect(ETAPES[3]!.options[1]!.d).toContain(`${COUT_RENFORT} €`);
    expect(ETAPES[3]!.options[0]!.d).toContain(`${fr(COUT_REVISION)} €`);
    expect(ETAPES[0]!.options[2]!.d).toContain(`${fr(COUT_REUNION)} €`);
    expect(ETAPES[1]!.options[0]!.d).toContain(`${COUT_CHEVAUCHEMENT} €`);
    expect(ETAPES[1]!.options[0]!.d).toContain(`${fr(COUT_FORMATION)} €`);
    expect(ETAPES[2]!.options[1]!.d).toContain(`${COUT_REFERENTES} €`);
    expect(ETAPES[5]!.options[0]!.d).toContain(`${COUT_REUNION_MENSUELLE} €`);
  });
});

describe("le modèle de l'EHPAD", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).semaines[1]!.chutes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.chutes,
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

  it("arrêter les levers sans rien réorganiser renvoie la charge au matin", () => {
    const nuit = simuler(avec(ATTENTISTE, D.conflit, 1), 3);
    expect(nuit.semaines[3]!.levers).toBe(LEVE_TOT);
    expect(nuit.semaines[3]!.reportees).toBeGreaterThan(10);
    const bon = simuler(MEILLEUR, 3);
    expect(bon.semaines[12]!.levers).toBe(LEVERS_REVISION);
    expect(bon.semaines[12]!.reportees).toBe(0);
  });

  it("les levers précoces font tomber : la méthode réduit les chutes d'un quart", () => {
    const chutes = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).chutes));
    expect(chutes(ATTENTISTE)).toBeGreaterThan(CHUTES_AUTOMNE - 2);
    expect(chutes(MEILLEUR)).toBeLessThan(24);
  });

  it("trancher fait partir les veilleuses ; la rotation fait partir des deux côtés", () => {
    const departs = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).departsNuit));
    expect(departs(MEILLEUR)).toBeLessThan(0.5);
    expect(departs(REFLEXE)).toBeGreaterThan(2);
    expect(risqueMutation(1, 0.75)).toBeGreaterThan(risqueMutation(1, 0.35) + 0.3);
    expect(risqueMutation(0, 0.1)).toBe(1);
    const rotation = GRAINES_DU_BILAN.map(departsDeRotation);
    expect(rotation.some((r) => r.nuit > 0)).toBe(true);
    expect(rotation.some((r) => r.jour > 0)).toBe(true);
    expect(rotation.some((r) => r.nuit + r.jour === 0)).toBe(true);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : réunir les deux équipes bat de loin trancher pour l'une ou pour l'autre", () => {
    const r = rejeu(MEILLEUR, D.conflit);
    expect(classement(MEILLEUR, D.conflit)[0]).toBe(2);
    expect(classement(MEILLEUR, D.conflit).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(7000);
  });

  it("D2 : un chevauchement protégé bat l'écrit seul et le cahier de liaison", () => {
    const r = rejeu(MEILLEUR, D.transmissions);
    expect(classement(MEILLEUR, D.transmissions)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(2000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3500);
  });

  it("D3 : associer les deux veilleuses à la répartition bat les laisser partir ou les faire attendre", () => {
    const r = rejeu(MEILLEUR, D.mutations);
    expect(classement(MEILLEUR, D.mutations)[0]).toBe(1);
    expect(classement(MEILLEUR, D.mutations).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D4 : réviser les plans de soins ensemble est le meilleur en moyenne ; le renfort protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.repartition);
    expect(classement(MEILLEUR, D.repartition)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(1);
    expect(r[1]!.p10 - r[0]!.p10).toBeGreaterThan(1500);
  });

  it("D4 dépend de D1 : la répartition ne vaut que si les deux équipes se sont parlé", () => {
    const gain = (d1: number) => {
      const c = avec(MEILLEUR, D.conflit, d1);
      return attendu(c) - attendu(avec(c, D.repartition, 3));
    };
    expect(gain(2)).toBeGreaterThan(2500);
    expect(gain(0)).toBeLessThan(0);
    expect(chanceQueLaRepartitionTienne(MEILLEUR, 2)).toBeCloseTo(0.75, 6);
    expect(chanceQueLaRepartitionTienne(avec(MEILLEUR, D.conflit, 0), 2)).toBeCloseTo(0.35, 6);
  });

  it("D5 : analyser la chute sans coupable bat l'avertissement à la veilleuse", () => {
    const r = rejeu(MEILLEUR, D.chute);
    expect(classement(MEILLEUR, D.chute)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(2500);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("D6 : inscrire les temps communs au roulement bat la rotation imposée et le laisser-aller", () => {
    const r = rejeu(MEILLEUR, D.printemps);
    expect(classement(MEILLEUR, D.printemps)[0]).toBe(0);
    expect(classement(MEILLEUR, D.printemps).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(1200);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_JOUR_NUIT, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("faire travailler les deux équipes ensemble bat trancher et attendre, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(15000);
    expect(methode).toBeGreaterThan(0);
    expect(attentiste).toBeLessThan(0);
    expect(attentiste).toBeGreaterThan(-30000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["plans", "interim"],
      ["transmissions"],
      ["entretiens"],
      ["journee"],
      ["analyse"],
      ["rotation"],
    ],
    jours: JOURS,
    diagnostic: "frontiere",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 26,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_JOUR_NUIT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris tous les réflexes, propose de ne pas trancher pour une équipe", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_JOUR_NUIT.comportements(p, analyser(EPISODE_JOUR_NUIT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_JOUR_NUIT.axe(c).titre).toBe("Ne pas trancher pour une équipe contre l'autre");
  });

  it("à qui a décidé sans enquêter, propose de regarder qui fait quoi entre 5 h et 8 h", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_JOUR_NUIT.comportements(p, analyser(EPISODE_JOUR_NUIT, p).trimestre);
    expect(EPISODE_JOUR_NUIT.axe(c).titre).toBe("Regarder qui fait quoi entre 5 h et 8 h");
  });

  it("juge la prévision au demi-k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_JOUR_NUIT.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(26.5)).toBe(1);
    expect(calibrage(25)).toBe(0.6);
    // Oublier la TVA, ou compter trois nuits par semaine : hors de portée.
    expect(calibrage(22.1)).toBe(0);
    expect(calibrage(22.7)).toBe(0);
  });

  it("dit le coût du trimestre, au regard de l'enveloppe", () => {
    expect(EPISODE_JOUR_NUIT.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous l'enveloppe/);
    expect(EPISODE_JOUR_NUIT.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/au-dessus/);
  });

  it("raconte les suites des décisions et les réactions tirées au hasard", () => {
    const reponses = GRAINES_DU_BILAN.map(
      (g) => EPISODE_JOUR_NUIT.reactions(D.chute, 2, g)![0]!.texte,
    );
    expect(new Set(reponses).size).toBe(2);
    expect(EPISODE_JOUR_NUIT.reactions(D.printemps, 1, 3)).not.toBeNull();
    expect(EPISODE_JOUR_NUIT.reactions(D.conflit, 0, 3)).toBeNull();
    const suites = GRAINES_DU_BILAN.flatMap(
      (g) => EPISODE_JOUR_NUIT.evenements(REFLEXE, g, 1, 13).lies,
    );
    expect(suites.some((m) => m.texte.includes("Orchidia Résidences"))).toBe(true);
  });
});
