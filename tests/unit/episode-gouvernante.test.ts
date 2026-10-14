import { describe, expect, it } from "vitest";
import {
  BILAN_LUNDI,
  COUTS,
  D,
  GROUPE,
  HEURES_PERDUES_LUNDI,
  HORAIRES,
  IMPREVUS,
  JOURNEE_LUNDI,
  LINGE,
  LINGE_DISPONIBLE,
  LUNDI,
  MARGE_NUITEE,
  RENFORT_SALON,
  TEMPS,
  hasard,
  journee,
  simuler,
} from "../../src/engine/episodes/chambres-pas-pretes";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  REFERENCES,
  REFLEXES,
  SALON_CAPACITE,
  SALON_MINUTES,
} from "../../src/config/episodes/chambres-pas-pretes";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_HEBERGEMENT } from "../../src/pedagogy/episodes/chambres-pas-pretes";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les chambres pas prêtes à 15 h » enseigne la gestion d'un flux
 * de service à heure fixe : avant d'ajouter des bras, lever ce qui fait
 * attendre ceux qui sont là (le linge qui n'arrive qu'à 11 h 30), faire
 * d'abord les chambres que des clients attendent tôt, libérer du temps par une
 * recouche à la demande bien proposée, et garder les renforts pour le moment
 * où la capacité manque vraiment, par des gens qui connaissent les standards.
 * Ces tests verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 1, 0];
const REFLEXE = [0, 3, 2, 0, 3, 1];
const ATTENTISTE = [3, 2, 2, 3, 3, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) =>
  chemin.map((x, i) => (i === d ? o : x));

/** Un montant tel que les sources l'écrivent : « 1 456 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("la lingerie et la feuille d'étage donnent de quoi calculer les quatre heures perdues", () => {
    const lingerie = texte(0, "lingerie");
    expect(lingerie).toContain(`couvre ${LINGE.stockTampon} départs`);
    expect(lingerie).toContain("livre à 11 h");
    expect(lingerie).toContain(euros(LINGE.dotation));
    const planning = texte(0, "planning");
    expect(planning).toContain(`${LUNDI.departs} départs à ${TEMPS.depart} minutes`);
    expect(planning).toContain(`${LUNDI.recouches} recouches à ${TEMPS.recouche} minutes`);
    expect(planning).toContain(`${LUNDI.equipe} femmes et valets de chambre`);
    // Six personnes de 8 h 15 à 11 h 30, moins dix-huit départs et les quinze recouches libres.
    const presence = LUNDI.equipe * (LINGE_DISPONIBLE - HORAIRES.debut);
    const travail = LINGE.stockTampon * TEMPS.depart + (LUNDI.recouches / 2) * TEMPS.recouche;
    expect(presence).toBe(1170);
    expect(travail).toBe(930);
    expect(HEURES_PERDUES_LUNDI).toBeCloseTo((presence - travail) / 60, 6);
    expect(HEURES_PERDUES_LUNDI).toBeCloseTo(4, 6);
    // C'est la valeur que la prévision demande.
    expect(EPISODE_HEBERGEMENT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(4, 6);
  });

  it("le lundi décrit est celui que le modèle simule", () => {
    const message = ETAPES[0]!.messages({})[0]!.texte;
    expect(message).toContain(`${BILAN_LUNDI.nonPretes} chambres en départ pas prêtes à 15 h`);
    expect(BILAN_LUNDI.nonPretes).toBe(4);
    expect(texte(0, "arrivees")).toContain(`${LUNDI.tot} clients sont arrivés entre 13 h et 15 h`);
    expect(texte(0, "arrivees")).toContain(`${Math.round(BILAN_LUNDI.totAttente)} ont attendu`);
    // Le bruit : douze chambres par personne, parce que l'équipe attend, pas parce qu'elle traîne.
    expect(texte(0, "chambery")).toContain("12,3 ici");
    // Avec une journée de linge, plus personne n'attend le matin.
    expect(journee({ ...JOURNEE_LUNDI, stock: LINGE.stockJournee }).attente).toBe(0);
  });

  it("les renforts, le salon et le groupe sont chiffrés comme dans le modèle", () => {
    expect(ETAPES[0]!.options[0]!.d).toContain(euros(2 * 7 * 4 * COUTS.interim));
    expect(ETAPES[1]!.options[3]!.d).toContain(euros(5 * 4 * COUTS.interim));
    // Le salon : 51 départs et 27 séjours, 38 h 45 de chambres pour 26 h à quatre.
    expect(SALON_MINUTES).toBe(51 * 35 + 27 * 20);
    expect(SALON_CAPACITE).toBe(4 * 390);
    const charge = texte(3, "charge");
    expect(charge).toContain("38 h 45 de chambres");
    expect(charge).toContain("l'équipe en fait 26 h");
    expect(ETAPES[3]!.options[0]!.d).toContain(euros(2 * 7 * 4 * 2 * COUTS.interim));
    expect(ETAPES[3]!.options[2]!.d).toContain(
      euros(2 * 7 * 4 * 2 * COUTS.interim + RENFORT_SALON.formation),
    );
    // Le groupe : deux sessions à venir, 128 nuitées valorisées à la marge d'une nuitée.
    expect(texte(5, "car")).toContain(`${2 * GROUPE.chambres * 2} nuitées`);
    expect(texte(5, "car")).toContain(euros(128 * MARGE_NUITEE));
    expect(GROUPE.valeur).toBe(128 * MARGE_NUITEE);
    expect(ETAPES[5]!.options[2]!.d).toContain(euros(GROUPE.accueil));
    expect(ETAPES[5]!.options[1]!.d).toContain(euros(3 * 7 * COUTS.interim));
  });
});

describe("le modèle des étages", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.nonPretes).toBe(
      simuler(REFLEXE, 12).semaines[1]!.nonPretes,
    );
    expect(simuler(MEILLEUR, 12).adhesion).toBe(simuler(ATTENTISTE, 12).adhesion);
    expect(simuler(MEILLEUR, 12).carEnAvance).toBe(simuler(REFLEXE, 12).carEnAvance);
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

  it("des intérimaires de plus attendent le linge avec l'équipe", () => {
    const renfort = journee({
      ...JOURNEE_LUNDI,
      renforts: [{ n: 2, classe: "interim", de: HORAIRES.debut, a: HORAIRES.fin }],
    });
    expect(renfort.attente).toBeGreaterThan(2 * BILAN_LUNDI.attente);
    // Commencer à 7 h allonge l'attente : le linge arrive toujours à 11 h 30.
    expect(journee({ ...JOURNEE_LUNDI, debut: HORAIRES.debutTot }).attente).toBeGreaterThan(
      BILAN_LUNDI.attente,
    );
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 5, 9]) {
        const t = simuler(c, g);
        expect(t.noteFinale).toBeGreaterThan(7.5);
        expect(t.noteFinale).toBeLessThan(9);
        expect(t.nonPretesMoyen).toBeLessThan(15);
        for (const s of t.semaines.slice(1)) expect(s!.nonPretes).toBeLessThanOrEqual(40);
      }
    }
    expect(simuler(MEILLEUR, 3).clientsAttente).toBeLessThan(
      simuler(ATTENTISTE, 3).clientsAttente / 4,
    );
  });

  it("le grand compte part bien plus souvent quand ses voyageurs attendent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).grandCompteParti).length;
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(2);
    expect(departs(ATTENTISTE)).toBeGreaterThan(8);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : lever le goulot du linge bat de loin les intérimaires et la prise de poste à 7 h", () => {
    const r = rejeu(MEILLEUR, D.premier);
    expect(classement(MEILLEUR, D.premier)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : la liste d'arrivées d'abord ; « tous les départs d'abord » ne vaut presque autant que si le linge suit", () => {
    expect(classement(MEILLEUR, D.ordre)[0]).toBe(0);
    expect(classement(MEILLEUR, D.ordre).at(-1)).toBe(3);
    const ecart = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.ordre);
      return r[0]!.attendu - r[1]!.attendu;
    };
    const sansLinge = avec(MEILLEUR, D.premier, 3);
    expect(classement(sansLinge, D.ordre)[0]).toBe(0);
    expect(ecart(sansLinge)).toBeGreaterThan(2 * ecart(MEILLEUR));
  });

  it("D3 : proposer la recouche bat l'imposer, la bâcler ou la garder", () => {
    const c = classement(MEILLEUR, D.recouche);
    expect(c[0]).toBe(0);
    expect(c.slice(2).sort()).toEqual([1, 3]);
  });

  it("D4 : les heures complémentaires gagnent en moyenne, les intérimaires formés protègent mieux", () => {
    const r = rejeu(MEILLEUR, D.salon);
    expect(classement(MEILLEUR, D.salon)[0]).toBe(1);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSure.option).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(1500);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D5 : le contrôle ciblé bat le contrôle de tout, la prime et le simple rappel", () => {
    const r = rejeu(MEILLEUR, D.controle);
    expect(classement(MEILLEUR, D.controle)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[3]!.attendu)).toBeGreaterThan(1500);
    expect(classement(MEILLEUR, D.controle).at(-1)).toBe(2);
  });

  it("D6 : préparer l'arrivée du groupe bat les intérimaires et le laisser-faire", () => {
    const r = rejeu(MEILLEUR, D.groupe);
    expect(classement(MEILLEUR, D.groupe)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("le flux d'abord bat les bras en plus et l'attentisme, en moyenne", () => {
    const [flux, bras, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(flux! - bras!).toBeGreaterThan(30000);
    expect(flux! - attentiste!).toBeGreaterThan(20000);
    expect(attentiste).toBeGreaterThan(bras!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et la méthode n'en contient pas", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_HEBERGEMENT, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const prudente =
        m.plusSure.option === o &&
        option.p10 > m.meilleure.p10 &&
        m.meilleure.moyenne - option.moyenne < 3000;
      expect(option.qualite, `réflexe ${d}, ${o}`).toBeLessThan(0.7);
      expect(prudente).toBe(false);
      expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["lingerie", "planning"], ["liste"], ["groupe"], ["charge"], ["oublis"], ["car"]],
    jours: JOURS,
    diagnostic: "flux",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 4,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_HEBERGEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a fait venir des intérimaires partout, propose de lever la contrainte d'abord", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_HEBERGEMENT.comportements(p, simuler(REFLEXE, p.graine, p.jours));
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_HEBERGEMENT.axe(c).titre).toBe("Lever la contrainte avant d'ajouter des bras");
  });

  it("à qui a décidé sans enquêter, propose de regarder à quelle heure l'équipe attend", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_HEBERGEMENT.comportements(p, simuler(MEILLEUR, p.graine, 0));
    expect(EPISODE_HEBERGEMENT.axe(c).titre).toBe("Regarder à quelle heure l'équipe attend");
  });

  it("juge le diagnostic et la prévision", () => {
    const juste = EPISODE_HEBERGEMENT.comportements(partie(MEILLEUR), simuler(MEILLEUR, 11));
    expect(juste[1]!.score).toBe(1);
    expect(juste[3]!.score).toBe(1);
    const p = partie(MEILLEUR, { diagnostic: "effectif", prevision: 9, confiance: 80 });
    const faux = EPISODE_HEBERGEMENT.comportements(p, simuler(MEILLEUR, 11));
    expect(faux[1]!.score).toBe(0);
    expect(faux[3]!.score).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_HEBERGEMENT.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_HEBERGEMENT.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
