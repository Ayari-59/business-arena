import { describe, expect, it } from "vitest";
import {
  ABANDON,
  ADMISSIONS_DEPART,
  ATTENTE_DEPART,
  AVAL,
  AILE,
  BLOQUES_DEPART,
  CAPACITE,
  CELLULE,
  CHARGES_SEJOUR,
  CONVENTIONS,
  COUT_REHOSPITALISATION,
  D,
  DEMANDES_DEPART,
  DMS_DEPART,
  DMS_EPRD,
  DMS_MEDICALE,
  EPRD,
  FLUIDITE,
  IMPREVUS,
  JOURNEES_BLOQUEES_RYTHME,
  LITS,
  MOTIFS,
  OCCUPATION,
  PART_AVAL,
  PRESCRIPTEURS,
  RECETTE_SEJOUR,
  RECETTE_SEMAINE,
  REHOSP_SORTIE_PREMATUREE,
  SEMAINES,
  VALEUR_ADRESSEUR,
  efficaciteDesPlaces,
  hasard,
  simuler,
} from "../../src/engine/episodes/sorties-qui-bloquent";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/sorties-qui-bloquent";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_PARCOURS } from "../../src/pedagogy/episodes/sorties-qui-bloquent";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les sorties qui bloquent » enseigne que la durée de séjour d'un
 * SMR s'allonge en aval : des patients médicalement sortants attendent une
 * place, une aide ou un domicile aménagé. On la réduit en préparant la sortie
 * dès l'entrée et en passant des conventions avec l'aval, pas en ouvrant des
 * lits, qui se remplissent des mêmes séjours bloqués, ni en faisant sortir
 * avant que l'aval soit prêt, ce qui fait revenir les patients. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 2, 1];
const REFLEXE = [0, 1, 3, 0, 0, 2];
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
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};

/** Un montant tel que les sources l'écrivent : « 4 600 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("la revue des dossiers donne les patients bloqués du modèle, et de quoi calculer la prévision", () => {
    const revue = texte(0, "revue");
    expect(revue).toContain(`${Math.round(CAPACITE)} patients présents`);
    expect(revue).toContain(`${BLOQUES_DEPART} sont médicalement sortants`);
    expect(revue).toContain(`${AVAL.ehpad.depart} attendent une place en EHPAD`);
    expect(revue).toContain(`${AVAL.domicileAide.depart} un SSIAD ou une aide à domicile`);
    expect(revue).toContain(`${AVAL.amenagement.depart} l'aménagement de leur domicile`);
    expect(revue).toContain(`${AVAL.protection.depart} une mesure de protection`);
    expect(revue).toContain(`durent ${DMS_MEDICALE} jours`);
    // L'attente moyenne d'un patient qui a besoin d'un aval : les bloqués sur le flux, en jours.
    const attente = (7 * BLOQUES_DEPART) / (ADMISSIONS_DEPART * PART_AVAL);
    expect(revue).toContain(`en moyenne ${Math.round(attente)} jours`);
    // La prévision : 21 lits bloqués, 91 jours.
    expect(JOURNEES_BLOQUEES_RYTHME).toBe(1911);
    expect(EPISODE_PARCOURS.prevision.reel(simuler(MEILLEUR, 1))).toBe(1911);
    // La durée de séjour du départ : les soins, plus l'attente ; 34 jours.
    expect(Math.round(DMS_DEPART)).toBe(34);
  });

  it("les admissions et les demandes sont celles du modèle", () => {
    const flux = texte(0, "flux");
    expect(flux).toContain(`Nous admettons ${Math.round(ADMISSIONS_DEPART)} patients`);
    // Il y a deux ans, aucun lit bloqué : la capacité divisée par quatre semaines de soins.
    expect(flux).toContain(`il y a deux ans, ${Math.round(CAPACITE / (DMS_MEDICALE / 7))}`);
    expect(flux).toContain(`Nous recevons ${Math.round(DEMANDES_DEPART)} demandes`);
    const ailleurs = ABANDON * (ATTENTE_DEPART + DEMANDES_DEPART - ADMISSIONS_DEPART);
    expect(flux).toContain(`en place ${Math.round(ailleurs)} ailleurs`);
    expect(flux).toContain(`${PRESCRIPTEURS.length === 5 ? "cinq" : "?"} services`);
  });

  it("la direction financière chiffre le séjour, l'aile, l'EPRD et un service perdu comme le modèle", () => {
    const f = texte(0, "finances");
    expect(f).toContain(euros(RECETTE_SEJOUR));
    expect(f).toContain(euros(CHARGES_SEJOUR));
    expect(RECETTE_SEMAINE).toBe(1000);
    expect(f).toContain(euros(AILE.remiseEnEtat));
    expect(f).toContain(euros(AILE.personnel));
    expect(f).toContain(euros(VALEUR_ADRESSEUR));
    // L'EPRD : les patients en soins quand la durée de séjour vaut 33 jours, treize semaines.
    const enSoins = (CAPACITE * DMS_MEDICALE) / DMS_EPRD;
    expect(Math.abs(enSoins * RECETTE_SEMAINE * SEMAINES - EPRD)).toBeLessThan(1000);
    expect(f).toContain(`${DMS_EPRD} jours`);
    expect(f.replace(/\s/g, " ")).toContain(
      `${(EPRD / 1000).toLocaleString("fr-FR").replace(/\s/g, " ")} k€`,
    );
    expect(LITS * OCCUPATION).toBeCloseTo(CAPACITE, 6);
  });

  it("les dossiers, les retours et les conventions sont chiffrés comme dans le modèle", () => {
    // Les dossiers incomplets : la part de l'attente qui tient au dossier, motif par motif.
    const incomplets = MOTIFS.reduce(
      (s, m) => s + (AVAL[m].depart * AVAL[m].dossier) / (AVAL[m].dossier + AVAL[m].place),
      0,
    );
    const dossiers = texte(1, "dossiers");
    expect(dossiers).toContain(`${Math.round(incomplets)} attendent encore leur dossier`);
    expect(dossiers).toContain(`Les ${BLOQUES_DEPART - Math.round(incomplets)} autres`);
    expect(dossiers).toContain(euros(CELLULE.cout));
    expect(texte(1, "retours")).toContain("un patient sur trois");
    expect(REHOSP_SORTIE_PREMATUREE).toBeCloseTo(1 / 3, 1);
    expect(texte(1, "retours")).toContain(euros(COUT_REHOSPITALISATION));

    const c = texte(2, "conventions");
    expect(c).toContain(`réduirait de moitié l'attente`);
    expect(CONVENTIONS.interne.ehpad).toBe(0.5);
    expect(c).toContain(`${CONVENTIONS.interne.domicileAide * 100} %`);
    expect(c).toContain(`${CONVENTIONS.externe.ehpad * 100} %`);
    expect(c).toContain(euros(CONVENTIONS.externe.cout));
    expect(c).toContain(`semaine ${CONVENTIONS.interne.debut}`);
    expect(c).toContain(`semaine ${CONVENTIONS.imposee.debut}`);

    // La fluidité des sorties : deux points d'occupation, sur 120 lits.
    const sorties = texte(4, "sortiesDuJour", { prep: true });
    expect(sorties).toContain(`${Math.round(FLUIDITE.occupation * 100)} %`);
    expect(sorties).toContain(
      `${((FLUIDITE.occupation - OCCUPATION) * LITS).toLocaleString("fr-FR")} lits`,
    );
  });
});

describe("le modèle de la clinique", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).semaines[1]!.demandes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.demandes,
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

  it("sans rien changer, le trimestre bloque à peu près les journées prévues", () => {
    const jb = moyenne(GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g).journeesBloquees));
    expect(Math.abs(jb - JOURNEES_BLOQUEES_RYTHME) / JOURNEES_BLOQUEES_RYTHME).toBeLessThan(0.1);
  });

  it("les lits ajoutés se remplissent de patients bloqués ; la préparation à l'entrée les vide", () => {
    const bloquesFin = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).bloquesFinal));
    expect(bloquesFin(avec(ATTENTISTE, D.strategie, 0))).toBeGreaterThan(
      bloquesFin(ATTENTISTE) + 3,
    );
    expect(bloquesFin(avec(ATTENTISTE, D.strategie, 1))).toBeLessThan(bloquesFin(ATTENTISTE) - 3);
  });

  it("sortir avant que l'aval soit prêt fait revenir les patients, et seulement alors", () => {
    const rehosp = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).rehospitalisations));
    expect(rehosp(MEILLEUR)).toBe(0);
    expect(rehosp(ATTENTISTE)).toBe(0);
    expect(rehosp(REFLEXE)).toBeGreaterThan(4);
  });

  it("un délai long fait perdre des services prescripteurs", () => {
    const perdus = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).perdus.length));
    expect(perdus(ATTENTISTE)).toBeGreaterThan(perdus(MEILLEUR) + 0.5);
  });

  it("garde des chiffres réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.resultat).toBeGreaterThan(1050000);
        expect(t.resultat).toBeLessThan(1400000);
        expect(t.dmsMoyenne).toBeGreaterThan(29);
        expect(t.dmsMoyenne).toBeLessThan(38);
        expect(t.rehospitalisations).toBeLessThan(20);
        for (const s of t.semaines.slice(1)) {
          expect(s!.bloques).toBeGreaterThan(0);
          expect(s!.delai).toBeLessThan(30);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : préparer la sortie dès l'entrée ; les quinze lits et la durée cible font pire que rien", () => {
    const r = rejeu(MEILLEUR, D.strategie);
    expect(classement(MEILLEUR, D.strategie)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    expect(r[3]!.attendu).toBeGreaterThan(r[0]!.attendu);
    expect(r[3]!.attendu).toBeGreaterThan(r[2]!.attendu);
  });

  it("D2 : reprendre les dossiers en cellule de sortie ; le retour en famille coûte", () => {
    const r = rejeu(MEILLEUR, D.stock);
    expect(classement(MEILLEUR, D.stock)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
  });

  it("D3 : négocier avec l'aval de l'association en moyenne ; l'imposer est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.conventions);
    expect(classement(MEILLEUR, D.conventions)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.conventions)).toBe(2);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D3 : une convention vaut deux fois plus quand les dossiers sont prêts dès l'entrée", () => {
    expect(efficaciteDesPlaces(MEILLEUR)).toBe(1);
    expect(efficaciteDesPlaces(ATTENTISTE)).toBe(CONVENTIONS.sansPreparation);
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.conventions);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(avec(MEILLEUR, D.strategie, 3)) + 5000);
  });

  it("D4 : l'aménagement provisoire bat l'attente des travaux et le retour sans aménagement", () => {
    const r = rejeu(MEILLEUR, D.domicile);
    expect(classement(MEILLEUR, D.domicile)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D5 : sortir avant midi et le samedi bat le renfort en intérim et les transferts précoces", () => {
    const c = classement(MEILLEUR, D.hiver);
    expect(c[0]).toBe(2);
    expect(c.indexOf(0)).toBeGreaterThan(c.indexOf(3));
    expect(c.at(-1)).toBe(1);
  });

  it("D6 : programmer les sorties avant les fêtes ; les sorties de Noël et la fermeture coûtent", () => {
    const r = rejeu(MEILLEUR, D.fetes);
    expect(classement(MEILLEUR, D.fetes)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[3]!.attendu).toBeGreaterThan(r[2]!.attendu);
  });

  it("préparer la sortie dès l'entrée bat les lits et la durée cible, et l'attentisme", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon! - attentiste!).toBeGreaterThan(60000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(REFLEXE);
    expect(REFERENCES[2]!.chemin).toEqual(ATTENTISTE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_PARCOURS, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const bonne =
        option.qualite >= 0.7 ||
        (option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000);
      expect(bonne, `D${d + 1} option ${o}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["revue", "flux"],
      ["dossiers", "retours"],
      ["conventions", "placesPretes"],
      ["visites", "chutes"],
      ["sortiesDuJour", "instables"],
      ["fetes"],
    ],
    jours: JOURS,
    diagnostic: "aval",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1911,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PARCOURS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a ouvert des lits et fait sortir trop tôt, propose de libérer les lits par l'aval", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PARCOURS.comportements(p, analyser(EPISODE_PARCOURS, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PARCOURS.axe(c).titre).toBe("Libérer les lits par l'aval");
  });

  it("à qui a décidé sans enquêter, propose de regarder qui occupe les lits", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PARCOURS.comportements(p, analyser(EPISODE_PARCOURS, p).trimestre);
    expect(EPISODE_PARCOURS.axe(c).titre).toBe("Regarder qui occupe les lits");
  });

  it("juge la prévision sur les journées bloquées au rythme de la semaine 1", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_PARCOURS.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    // 18 % des 116 patients, 91 jours : le même calcul par l'autre chemin.
    const parLaPart = EPISODE_PARCOURS.comportements(
      partie(MEILLEUR, { prevision: 0.18 * 116 * 91 }),
      t,
    )[3]!;
    expect(parLaPart.score).toBe(1);
    // Ou six jours d'attente de trop par séjour, pour 24 admissions par semaine.
    const parLesSejours = EPISODE_PARCOURS.comportements(
      partie(MEILLEUR, { prevision: 6 * 24 * 13 }),
      t,
    )[3]!;
    expect(parLesSejours.score).toBe(1);
    // Compter en semaines plutôt qu'en jours : 21 lits, 13 semaines.
    const autre = EPISODE_PARCOURS.comportements(
      partie(MEILLEUR, { prevision: 21 * 13, confiance: 80 }),
      t,
    )[3]!;
    expect(autre.score).toBe(0);
  });

  it("dit le résultat en écart à l'EPRD", () => {
    expect(EPISODE_PARCOURS.bilan.titre(simuler(REFLEXE, 2))).toMatch(/sous l'EPRD/);
    expect(EPISODE_PARCOURS.bilan.titre({ ...simuler(MEILLEUR, 2), objectif: 5000 })).toMatch(
      /au-dessus de l'EPRD/,
    );
  });
});
