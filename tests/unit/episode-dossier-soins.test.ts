import { describe, expect, it } from "vitest";
import {
  COUT_FORMATION_REFERENTS,
  COUT_HEBDO_REFERENTS,
  COUT_HEURE,
  COUT_MATERIEL,
  COUT_PARAMETRAGE,
  COUTS,
  CREDITS_ARS,
  D,
  HEURES_DOUBLE_DEPART,
  IMPREVUS,
  MINUTES_LECTURE,
  MINUTES_RECOPIE,
  PLACES,
  POSTES_JOUR,
  RECOPIE_DEPART,
  REMPLACANTS,
  REPRISE_ARS,
  USAGE_DEPART,
  demarrageDifficile,
  hasard,
  risqueDeDepart,
  simuler,
  volontaireDeNuit,
} from "../../src/engine/episodes/dossier-de-soins";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/dossier-de-soins";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_DOSSIER_SOINS } from "../../src/pedagogy/episodes/dossier-de-soins";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le dossier de soins que personne ne remplit » enseigne qu'un
 * outil ne change les pratiques que s'il entre dans le travail réel : le
 * matériel au chariot et la nuit, des plans de soins écrits avec les équipes,
 * des référents de terrain, un seul support. L'obligation contrôlée fabrique
 * des recopies de fin de poste, la formation en salle ne tient pas, et revenir
 * au papier rend le temps gagné. Ces tests verrouillent les chiffres des
 * sources et les classements qui le disent.
 */

const MEILLEUR = [1, 1, 0, 1, 0, 0];
const REFLEXE = [0, 0, 1, 0, 1, 1];
const ATTENTISTE = [3, 3, 3, 3, 2, 3];
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

/** Un nombre tel que les sources l'écrivent : « 15 600 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les journaux et le planning donnent la prévision : 70 heures de recopie par semaine", () => {
    const journaux = texte(0, "journaux");
    expect(journaux).toContain(`${Math.round(USAGE_DEPART * 100)} % seulement`);
    expect(journaux).toContain("La moitié des postes");
    expect(RECOPIE_DEPART).toBe(0.5);
    expect(journaux).toContain(`${MINUTES_RECOPIE} minutes en moyenne`);
    expect(journaux).toContain(
      `${Math.round((1 - USAGE_DEPART - RECOPIE_DEPART) * 100)} % restants`,
    );
    const planning = texte(0, "planning");
    expect(planning).toContain("21 postes");
    expect(planning).toContain("22 à Chalon");
    expect(planning).toContain("17 à Montbard");
    expect(planning).toContain(`${COUT_HEURE} €`);
    expect(planning).toContain(`${MINUTES_LECTURE} minutes`);
    expect(POSTES_JOUR).toBe(60);
    // 60 postes par jour, 7 jours, la moitié recopient 20 minutes.
    expect(HEURES_DOUBLE_DEPART).toBe((POSTES_JOUR * 7 * 0.5 * 20) / 60);
    expect(HEURES_DOUBLE_DEPART).toBe(70);
    expect(EPISODE_DOSSIER_SOINS.prevision.reel(simuler(MEILLEUR, 1))).toBe(70);
    expect(simuler(ATTENTISTE, 4).heuresDoubleDepart).toBe(70);
  });

  it("le matériel, le paramétrage et les référents sont chiffrés comme dans le modèle", () => {
    const [, materiel] = ETAPES[0]!.options;
    expect(COUT_MATERIEL).toBe(18 * 620 + 6 * 390 + 3 * 700);
    expect(materiel!.d).toContain(`${fr(15600)} €`);
    expect(PLACES).toBe(88 + 90 + 70);
    expect(EPISODE_DOSSIER_SOINS.persona).toContain(`${PLACES} places`);
    expect(COUT_PARAMETRAGE).toBe(PLACES * 1 * COUT_HEURE);
    expect(ETAPES[1]!.options[1]!.d).toContain(`${fr(7440)} €`);
    expect(ETAPES[1]!.options[1]!.d).toContain(`${PLACES} résidents`);
    expect(ETAPES[2]!.options[0]!.d).toContain(`${fr(COUT_FORMATION_REFERENTS)} €`);
    expect(COUT_FORMATION_REFERENTS).toBe(6 * 2 * 7 * 30);
    expect(ETAPES[2]!.options[0]!.d).toContain(`${COUT_HEBDO_REFERENTS} €`);
    expect(COUTS.formateur).toBe(11400);
    expect(ETAPES[2]!.options[1]!.d).toContain(`${fr(11400)} €`);
  });

  it("les crédits de l'ARS, les bascules et les comptes de l'été sont ceux du modèle", () => {
    const ars = texte(3, "ars");
    expect(ars).toContain(`${fr(CREDITS_ARS)} €`);
    expect(ars).toContain(`${fr(REPRISE_ARS)} €`);
    expect(ars).toContain("une fois sur deux");
    expect(ETAPES[3]!.options[1]!.d).toContain(`${fr(COUTS.bascule)} €`);
    expect(ETAPES[3]!.options[2]!.d).toContain(`${fr(6000)} €`);
    expect(COUTS.comptes).toBe(REMPLACANTS * 15 + REMPLACANTS * 0.5 * 2 * COUT_HEURE);
    expect(ETAPES[5]!.options[0]!.d).toContain(`${fr(1710)} €`);
    expect(ETAPES[5]!.messages({})[0]!.texte).toContain(`${REMPLACANTS} remplaçants`);
  });
});

describe("le modèle des transmissions", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.usage).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.usage,
      6,
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

  it("la bonne méthode fait passer l'usage au-dessus de 70 % ; l'attente le laisse au papier", () => {
    const bon = simuler(MEILLEUR, 3);
    const neutre = simuler(ATTENTISTE, 3);
    expect(bon.usageFinal).toBeGreaterThan(0.7);
    expect(neutre.usageFinal).toBeLessThan(0.2);
    expect(bon.heuresDoubleFinal).toBeLessThan(15);
    expect(neutre.heuresDoubleFinal).toBeGreaterThan(60);
  });

  it("l'obligation fabrique des recopies, pas de l'usage", () => {
    const oblige = simuler(avec(ATTENTISTE, D.terrain, 0), 4);
    const neutre = simuler(ATTENTISTE, 4);
    expect(oblige.semaines[8]!.recopie).toBeGreaterThan(neutre.semaines[8]!.recopie + 0.25);
    expect(oblige.semaines[8]!.usage).toBeLessThan(neutre.semaines[8]!.usage + 0.05);
    const erreurs = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).erreurs));
    expect(erreurs(avec(ATTENTISTE, D.terrain, 0))).toBeGreaterThan(erreurs(ATTENTISTE));
  });

  it("une aide-soignante de nuit part quand le climat se dégrade, jamais sur la bonne méthode", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).depart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(REFLEXE)).toBeGreaterThan(0);
    expect(risqueDeDepart(0.3)).toBe(0);
    expect(risqueDeDepart(1)).toBe(0.8);
  });

  it("le hasard dit si la nuit de Montbard trouve un référent, et si la bascule se passe mal", () => {
    const volontaires = GRAINES_DU_BILAN.filter(volontaireDeNuit).length;
    expect(volontaires).toBeGreaterThan(10);
    expect(volontaires).toBeLessThan(30);
    const difficiles = GRAINES_DU_BILAN.filter((g) => demarrageDifficile(MEILLEUR, g)).length;
    expect(difficiles).toBeGreaterThan(5);
    expect(difficiles).toBeLessThan(20);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : mettre Carnéo sur les chariots bat de loin l'obligation contrôlée", () => {
    const r = rejeu(MEILLEUR, D.terrain);
    expect(classement(MEILLEUR, D.terrain)[0]).toBe(1);
    expect(classement(MEILLEUR, D.terrain).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("D2 : refaire les plans avec les équipes paie, et paie plus avec le matériel au chariot", () => {
    const r = rejeu(MEILLEUR, D.plans);
    expect(classement(MEILLEUR, D.plans)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2500);
    const sansMateriel = rejeu(avec(MEILLEUR, D.terrain, 3), D.plans);
    const gain = r[1]!.attendu - r[3]!.attendu;
    const gainSansMateriel = sansMateriel[1]!.attendu - sansMateriel[3]!.attendu;
    expect(gain).toBeGreaterThan(gainSansMateriel + 3000);
  });

  it("D3 : des référents de terrain battent l'infirmière coordinatrice seule et la formation en salle", () => {
    const r = rejeu(MEILLEUR, D.referents);
    expect(classement(MEILLEUR, D.referents)[0]).toBe(0);
    expect(classement(MEILLEUR, D.referents).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
  });

  it("D4 : retirer le papier partout est le meilleur choix en moyenne ; un EHPAD à la fois protège mieux", () => {
    const r = rejeu(MEILLEUR, D.bascule);
    expect(classement(MEILLEUR, D.bascule)[0]).toBe(1);
    expect(classement(MEILLEUR, D.bascule).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10 - r[1]!.p10).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
  });

  it("D4 : sans tablettes au chariot, retirer le papier ne marche pas", () => {
    const r = rejeu(avec(MEILLEUR, D.terrain, 3), D.bascule);
    expect(r[0]!.attendu).toBeGreaterThan(r[1]!.attendu);
  });

  it("D5 : le plan canicule dans Carnéo protège quand l'usage est réel ; sinon, les fiches papier", () => {
    expect(classement(MEILLEUR, D.canicule)[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.canicule);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    const papier = rejeu([3, 1, 2, 3, 0, 0], D.canicule);
    expect(papier.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option).toBe(1);
  });

  it("D6 : des comptes nominatifs pour les remplaçants battent la suspension de l'été", () => {
    const r = rejeu(MEILLEUR, D.ete);
    expect(classement(MEILLEUR, D.ete)[0]).toBe(0);
    expect(classement(MEILLEUR, D.ete).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.p10).toBeGreaterThan(r[2]!.p10);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_DOSSIER_SOINS, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("mettre l'outil dans le travail réel bat le réflexe et l'attentisme, en moyenne", () => {
    expect(REFERENCES[0].chemin).toEqual(MEILLEUR);
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(30000);
    expect(attentiste).toBeLessThan(0);
    expect(attentiste).toBeGreaterThan(-60000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["journaux", "tour"],
      ["plans"],
      ["montchapet"],
      ["analyse"],
      ["eteDernier"],
      ["gresilles"],
    ],
    jours: JOURS,
    diagnostic: "terrain",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 70,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_DOSSIER_SOINS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris tous les réflexes, propose de faire entrer l'outil dans le travail", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DOSSIER_SOINS.comportements(p, analyser(EPISODE_DOSSIER_SOINS, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DOSSIER_SOINS.axe(c).titre).toBe(
      "Faire entrer l'outil dans le travail plutôt que l'imposer",
    );
  });

  it("à qui a décidé sans enquêter, propose de regarder où et quand on saisit", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DOSSIER_SOINS.comportements(p, analyser(EPISODE_DOSSIER_SOINS, p).trimestre);
    expect(EPISODE_DOSSIER_SOINS.axe(c).titre).toBe("Regarder où et quand on saisit");
  });

  it("juge le diagnostic, et la prévision des heures de recopie à l'heure près", () => {
    const t = simuler(MEILLEUR, 11);
    const constats = (extra: Partial<PartieJouee>) =>
      EPISODE_DOSSIER_SOINS.comportements(partie(MEILLEUR, extra), t);
    expect(constats({ prevision: 72 })[3]!.score).toBe(1);
    expect(constats({ prevision: 60 })[3]!.score).toBe(0.6);
    expect(constats({ prevision: 35 })[3]!.score).toBe(0);
    expect(constats({ diagnostic: "parametrage" })[1]!.score).toBe(0.6);
    expect(constats({ diagnostic: "formation" })[1]!.score).toBe(0);
  });

  it("dit le résultat en temps gagné, coûts déduits", () => {
    expect(EPISODE_DOSSIER_SOINS.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de temps gagné/);
    expect(EPISODE_DOSSIER_SOINS.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(
      /au-delà du temps gagné/,
    );
  });
});
