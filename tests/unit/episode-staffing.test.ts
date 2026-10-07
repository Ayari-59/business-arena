import { describe, expect, it } from "vitest";
import {
  AVENANT,
  CH,
  COOP,
  COUT_JOUR,
  COUT_JOUR_MOYEN,
  D,
  DECOTE_SANS_EQUIPE,
  DISPONIBLES_OCTOBRE,
  HALDEN,
  IMPREVUS,
  OCCUPATION_PREVUE,
  OCCUPATION_TEMPORA,
  OCTOBRE,
  PROPOSITIONS,
  PROSPECT,
  RESERVATION_JANVIER,
  RETZ,
  SEMINAIRE,
  TAUX_MARGE_MISSION,
  TJM,
  VALEUR_TRANCHE,
  hasard,
  risqueRetz,
  simuler,
} from "../../src/engine/episodes/staffing-du-lundi";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/staffing-du-lundi";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_STAFFING } from "../../src/pedagogy/episodes/staffing-du-lundi";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le staffing du lundi » enseigne à affecter les consultants
 * selon la valeur et le risque des missions : un senior vaut ce qu'il évite
 * sur un forfait critique, pas son TJM sur une régie simple ; un analyste
 * grandit en binôme et dérape seul ; l'intercontrat vaut ce qu'on en fait ;
 * une réservation sans proposition se vérifie avant de bloquer une mission
 * signée. Ces tests verrouillent les chiffres des sources et les classements
 * qui le disent.
 */

const MEILLEUR = [1, 2, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 3, 0, 0, 0];
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
/** Le texte d'une source, sous un contexte donné. */
const source = (d: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[d]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "function" ? s.resultat(ctx) : s.resultat;
};

describe("le modèle du bureau de Nantes", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).prospectSigne).toBe(simuler(REFLEXE, 12).prospectSigne);
    expect(simuler(MEILLEUR, 12).semaines[1]!.occupation).not.toBeNaN();
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

  it("reste dans des plages réalistes : marge, occupation, intercontrat", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 8, 21]) {
        const t = simuler(c, g, JOURS);
        expect(t.marge).toBeGreaterThan(550000);
        expect(t.marge).toBeLessThan(1000000);
        expect(t.occupationMoyenne).toBeGreaterThan(0.65);
        expect(t.occupationMoyenne).toBeLessThan(0.85);
        for (const s of t.semaines.slice(1)) {
          expect(s!.occupation).toBeGreaterThan(0.45);
          expect(s!.occupation).toBeLessThan(0.95);
          expect(s!.intercontrat).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("le réflexe flatte le taux d'occupation : la sous-traitance de Halden remplit octobre", () => {
    const meilleur = moyenne(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).occupationOctobre));
    const reflexe = moyenne(GRAINES_DU_BILAN.map((g) => simuler(REFLEXE, g).occupationOctobre));
    expect(reflexe).toBeGreaterThan(meilleur);
    expect(attendu(REFLEXE)).toBeLessThan(attendu(MEILLEUR) - 100000);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("le plan de charge d'octobre : 1 140 jours disponibles, 91 % affichés, 72,1 % prévisibles", () => {
    expect(DISPONIBLES_OCTOBRE).toBe(1140);
    expect(OCTOBRE.signes + OCTOBRE.propositions + OCTOBRE.precaution).toBe(1038);
    expect(Math.round(OCCUPATION_TEMPORA * 100)).toBe(91);
    expect(OCCUPATION_PREVUE * 100).toBeCloseTo(72.1, 1);
    const texte = source(0, "plan");
    expect(texte).toContain("1 140 jours disponibles");
    expect(texte).toContain("1 038 staffés : 91 %");
    expect(texte).toContain("786 jours");
    expect(texte).toContain("72 jours");
    expect(texte).toContain("180 jours");
    expect(EPISODE_STAFFING.prevision.reel(simuler(MEILLEUR, 3))).toBeCloseTo(72.1, 1);
  });

  it("les fiches de la rentrée : un senior rapporte 10 000 € de plus chez Distrimer, en évite près de 20 000 au CH", () => {
    const texte = source(0, "fiches");
    expect(TJM.senior).toBe(1100);
    expect(texte).toContain("1 100 € par jour pour un senior, 850 € pour un confirmé");
    expect(texte).toContain("3 %");
    expect(texte).toContain("22 %");
    expect(texte).toContain("400 €");
    // Huit semaines à cinq jours : 40 jours où le senior facture 250 € de plus qu'un confirmé.
    expect((TJM.senior - TJM.confirme) * 40).toBe(10000);
    // Au CH, les dépassements évités sur 260 jours prévus, valorisés au coût journalier.
    const evite = (CH.derive.confirme - CH.derive.senior) * CH.joursSemaine * 13 * COUT_JOUR_MOYEN;
    expect(evite).toBeCloseTo(19760, 0);
    expect(CH.joursSemaine * 13).toBe(260);
  });

  it("la coopérative : 12 750 € d'honoraires par semaine, 3 000 € de marge avec des indépendants", () => {
    expect(COOP.consultants * 5 * TJM.confirme).toBe(12750);
    expect(COOP.consultants * 5 * (TJM.confirme - COOP.achatIndependant)).toBe(3000);
    expect(source(1, "coop")).toContain("12 750 €");
    expect(source(1, "freelancia")).toContain("3 000 €");
    expect(PROSPECT.montant * TAUX_MARGE_MISSION).toBe(56000);
    expect(source(1, "historique")).toContain("56 k€");
    expect(source(1, "historique")).toContain("trois ont débouché");
  });

  it("octobre : Halden à 9 000 € par semaine, des propositions à 35 % de marge, l'intercontrat à près de 10 000 €", () => {
    expect(HALDEN.consultants * 5 * HALDEN.tjm).toBe(9000);
    expect(ETAPES[D.intercontrat]!.options[0]!.d).toContain("9 000 €");
    expect(PROPOSITIONS.map((p) => Math.round(p.montant * TAUX_MARGE_MISSION))).toEqual([
      63000, 42000, 31500,
    ]);
    expect(source(2, "pipeline")).toContain("30 %");
    expect(source(2, "novembre")).toContain(`${Math.round((1 - DECOTE_SANS_EQUIPE) * 100)} %`);
    // Le senior, les deux confirmés et les deux analystes sans mission : leurs salaires d'une semaine.
    const salaires = 5 * (COUT_JOUR.senior + 2 * COUT_JOUR.confirme + 2 * COUT_JOUR.analyste);
    expect(salaires).toBeGreaterThan(9500);
    expect(salaires).toBeLessThan(10000);
  });

  it("le Pays de Retz rentable à 75 % sur le papier ; la tranche du CH vaut 49 k€ ; la réservation de janvier 17 000 €", () => {
    const papier = (RETZ.prix - 35 * COUT_JOUR.analyste) / RETZ.prix;
    expect(papier).toBeCloseTo(0.75, 3);
    expect(VALEUR_TRANCHE).toBe(49000);
    expect(source(4, "avenants")).toContain("49 k€");
    expect(RESERVATION_JANVIER.consultants * 10 * TJM.confirme).toBe(17000);
    expect(source(5, "janvier")).toContain("17 000 €");
    expect(SEMINAIRE.jours).toBe(10);
    expect(AVENANT.prix).toBe(48000);
    expect(5 * (TJM.senior + TJM.confirme)).toBe(9750);
    expect(5 * (TJM.confirme + TJM.analyste)).toBe(7500);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : staffer selon la valeur et le risque bat de loin l'ordre des demandes", () => {
    const r = rejeu(MEILLEUR, D.rentree);
    expect(classement(MEILLEUR, D.rentree)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[0]!.attendu).toBeGreaterThan(r[3]!.attendu);
  });

  it("D2 : vérifier la réservation est le meilleur pari ; la lever sans attendre est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.reservation);
    expect(classement(MEILLEUR, D.reservation)[0]).toBe(2);
    expect(classement(MEILLEUR, D.reservation).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.reservation)).toBe(1);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
  });

  it("D3 : l'avant-vente et la formation battent la sous-traitance de Halden et l'attente", () => {
    const r = rejeu(MEILLEUR, D.intercontrat);
    expect(classement(MEILLEUR, D.intercontrat)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[0]!.attendu).toBeGreaterThan(r[3]!.attendu);
  });

  it("D4 : le binôme bat le junior seul, d'autant plus que sa rentrée s'est faite seule", () => {
    const r = rejeu(MEILLEUR, D.junior);
    expect(classement(MEILLEUR, D.junior)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(3000);
    expect(risqueRetz(MEILLEUR.map((x, i) => (i === D.junior ? 0 : x)))).toBeCloseTo(0.4);
    expect(risqueRetz(REFLEXE)).toBeCloseTo(RETZ.risque);
    const seul = rejeu(REFLEXE, D.junior);
    expect(seul[1]!.attendu - seul[0]!.attendu).toBeGreaterThan(r[1]!.attendu - r[0]!.attendu);
  });

  it("D5 : basculer Ombline sur l'avenant paie quand les analystes sont autonomes ; sinon, à peine", () => {
    const r = rejeu(MEILLEUR, D.avenant);
    expect(classement(MEILLEUR, D.avenant)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    // Analystes placés seuls à la rentrée : personne ne peut reprendre Distrimer, la bascule ne vaut presque plus rien.
    const seuls = rejeu(REFLEXE, D.avenant);
    expect(seuls[1]!.attendu - seuls[0]!.attendu).toBeLessThan(3000);
    expect(classement(REFLEXE, D.avenant)[0]).toBe(2);
  });

  it("D6 : un senior sur la restitution et pas de réservation sans proposition", () => {
    const r = rejeu(MEILLEUR, D.restitution);
    expect(classement(MEILLEUR, D.restitution)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
  });

  it("staffer selon la valeur et le risque bat le premier arrivé et l'attentisme, en moyenne", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon! - reflexe!).toBeGreaterThan(100000);
    expect(bon! - attentiste!).toBeGreaterThan(100000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(REFLEXE);
    expect(REFERENCES[2]!.chemin).toEqual(ATTENTISTE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_STAFFING, MEILLEUR, d, JOURS);
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
      ["plan", "fiches"],
      ["historique"],
      ["pipeline", "novembre"],
      ["premieres"],
      ["suite", "avenants"],
      ["seminaire", "restitutions"],
    ],
    jours: JOURS,
    diagnostic: "valeurRisque",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 72,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_STAFFING, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a servi les associés dans l'ordre, propose d'affecter selon la valeur et le risque", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_STAFFING.comportements(p, analyser(EPISODE_STAFFING, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_STAFFING.axe(c).titre).toBe(
      "Affecter selon la valeur et le risque, pas l'ordre des demandes",
    );
  });

  it("à qui a décidé sans enquêter, propose de lire le plan de charge", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_STAFFING.comportements(p, analyser(EPISODE_STAFFING, p).trimestre);
    expect(EPISODE_STAFFING.axe(c).titre).toBe("Lire le plan de charge avant de staffer");
  });

  it("juge la prévision sur le taux d'occupation prévisible d'octobre, pas sur Tempora", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_STAFFING.comportements(partie(MEILLEUR, { prevision: 72 }), t);
    const tempora = EPISODE_STAFFING.comportements(
      partie(MEILLEUR, { prevision: 91, confiance: 80 }),
      t,
    );
    expect(juste[3]!.score).toBe(1);
    expect(tempora[3]!.score).toBe(0);
    expect(juste[1]!.score).toBe(1);
    expect(juste[4]!.score).toBe(1);
  });

  it("lit les messages et les sources sans erreur, sur tous les chemins de référence", () => {
    for (const r of REFERENCES) {
      for (const g of [1, 5]) {
        for (let d = 0; d < ETAPES.length; d += 1) {
          const semaine = d === 0 ? 0 : ETAPES[d - 1]!.jusqua;
          const ctx = EPISODE_STAFFING.contexte(
            EPISODE_STAFFING.lire(r.chemin.slice(0, d), g, JOURS, semaine),
            r.chemin.slice(0, d),
          );
          expect(ETAPES[d]!.messages(ctx).length).toBeGreaterThan(0);
          for (const s of ETAPES[d]!.sources)
            expect(source(d, s.id, ctx).length).toBeGreaterThan(20);
        }
        const e = EPISODE_STAFFING.evenements(r.chemin, g, 1, 13);
        expect(e.lies.length).toBeGreaterThan(0);
      }
    }
    expect(EPISODE_STAFFING.reactions(D.reservation, 2, 3)).toHaveLength(1);
    expect(EPISODE_STAFFING.reactions(D.reservation, 0, 3)).toHaveLength(1);
    expect(EPISODE_STAFFING.reactions(D.rentree, 0, 3)).toBeNull();
  });
});
