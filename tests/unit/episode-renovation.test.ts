import { describe, expect, it } from "vitest";
import {
  BUDGET,
  CHAMBRES,
  CIMALP,
  D,
  ETAGE,
  IMPREVUS,
  O,
  PERTE_CIMALP,
  PERTE_DEUX_ETAGES_AOUT,
  PRIX,
  PROFILS,
  hasard,
  renfortDisponible,
  retardVu,
  simuler,
} from "../../src/engine/episodes/renovation-sans-fermer";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/renovation-sans-fermer";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_RENOVATION,
  PERTE_EN_KE,
} from "../../src/pedagogy/episodes/renovation-sans-fermer";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";
import { kE } from "../../src/config/episodes/format";

/**
 * L'épisode « La rénovation sans fermer » enseigne qu'un chantier dans un
 * hôtel ouvert coûte plus par ses nuisances que par les chambres qu'on ferme :
 * le regrouper dans le creux d'août, isoler les clients d'affaires, prévenir
 * avant les plaintes, et suivre l'avancement assez finement pour rattraper à
 * temps. Ces tests verrouillent les classements qui le disent, et recalculent
 * depuis les prévisions brutes les chiffres que les sources affichent.
 */

const MEILLEUR = [...REFERENCES[0].chemin];
const REFLEXE = [...REFERENCES[1].chemin];
const ATTENTISTE = [...REFERENCES[2].chemin];
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
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Le texte d'une source, tel que la joueuse le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[] = [], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_RENOVATION.contexte(
    EPISODE_RENOVATION.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
/** Les nuits perdues par semaine, recalculées à la main depuis un profil brut. */
const perdues = (profil: readonly number[], capacite: number) =>
  profil.reduce((t, n) => t + (n > capacite ? n - capacite : 0), 0);

describe("le modèle de L'Escale Chambéry-Gare", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    // En semaine 1, aucun chantier n'a commencé : tous les chemins vendent la même chose.
    expect(simuler(MEILLEUR, 12).semaines[1]!.ca).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.ca,
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

  it("une équipe de renfort est libre en août selon le hasard, et Brice le dit", () => {
    const libres = GRAINES_DU_BILAN.filter((g) => renfortDisponible(g)).length;
    expect(libres).toBeGreaterThan(8);
    expect(libres).toBeLessThan(25);
    const reponses = new Set(
      GRAINES_DU_BILAN.map(
        (g) => EPISODE_RENOVATION.reactions(D.retard, O.retard.rattraper, g)![0]!.texte,
      ),
    );
    expect(reponses.size).toBe(2);
    expect(EPISODE_RENOVATION.reactions(D.retard, O.retard.maintenir, 1)).toBeNull();
  });

  it("garder tout ouvert expose les clients et fait déborder le chantier sur septembre", () => {
    const debords = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).debord > 0).length;
    expect(debords(REFLEXE)).toBeGreaterThan(20);
    expect(debords(MEILLEUR)).toBeLessThan(8);
    expect(simuler(REFLEXE, 3).partExposee).toBeGreaterThan(0.45);
    expect(simuler(MEILLEUR, 3).partExposee).toBeLessThan(0.3);
    expect(simuler(avec(MEILLEUR, D.phasage, O.phasage.fermer), 3).partExposee).toBe(0);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.noteFinale).toBeGreaterThan(6.5);
        expect(t.debord).toBeLessThan(6);
        for (const s of t.semaines.slice(1)) {
          expect(s!.to).toBeLessThanOrEqual(1);
          expect(s!.ca).toBeLessThan(50000);
        }
      }
    }
  });
});

describe("les chiffres que les sources donnent, recalculés", () => {
  it("la prévision : fermer deux étages en août ne perd que les nuits au-delà de 36 chambres", () => {
    const aout = [36, 40, 42, 42, 40, 50, 60];
    expect(PROFILS.aout).toEqual(aout);
    const nuits = perdues(aout, CHAMBRES - 2 * ETAGE);
    expect(nuits).toBe(58);
    expect(PERTE_DEUX_ETAGES_AOUT).toBe(4 * 58 * 86);
    expect(PERTE_EN_KE).toBeCloseTo(19.952, 6);
    expect(EPISODE_RENOVATION.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(19.952, 6);
    // La source donne le profil et le prix d'août de quoi le calculer.
    const texte = source(0, "previsions");
    expect(texte).toContain(aout.join(", "));
    expect(texte).toContain(`${PRIX.aout} €`);
  });

  it("la source des prévisions chiffre une semaine de juin à un étage fermé", () => {
    const juin = [52, 68, 70, 70, 66, 44, 50];
    expect(PROFILS.juin).toEqual(juin);
    const nuits = perdues(juin, 54);
    expect(nuits).toBe(58);
    expect(source(0, "previsions")).toContain(`${nuits} nuits, ${kE(nuits * 98)}`);
  });

  it("la source du contrat de Cimalp chiffre ce que son départ coûterait", () => {
    expect(PERTE_CIMALP).toBe(Math.round(480 * 92 * (1 - 0.4)));
    expect(CIMALP.nuitees * CIMALP.prix).toBe(44160);
    expect(source(1, "cimalp")).toContain(kE(26496));
  });

  it("la source de septembre chiffre une semaine à quinze chambres encore en chantier", () => {
    const septembre = [56, 70, 72, 72, 68, 46, 54];
    expect(PROFILS.septembre).toEqual(septembre);
    const nuits = perdues(septembre, 72 - 15);
    expect(nuits).toBe(54);
    expect(source(4, "septembre")).toContain(`${nuits} nuits, ${kE(nuits * 102)}`);
  });

  it("le budget sans travaux est la somme des semaines-types de juin à août", () => {
    const semaine = (p: readonly number[], prix: number) => p.reduce((t, n) => t + n, 0) * prix;
    expect(BUDGET).toBe(
      4 * semaine(PROFILS.juin, 98) +
        5 * semaine(PROFILS.juillet, 90) +
        4 * semaine(PROFILS.aout, 86),
    );
  });

  it("le retard annoncé en semaine 8 dépend de la façon dont on suit le chantier", () => {
    const g = GRAINES_DU_BILAN.find((x) => retardVu(MEILLEUR, x) > 0.5)!;
    const comptesRendus = retardVu(avec(MEILLEUR, D.suivi, O.suivi.comptesRendus), g);
    expect(comptesRendus).toBeCloseTo(retardVu(MEILLEUR, g) * 0.3, 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : regrouper le chantier dans le creux bat le réflexe de tout garder ouvert", () => {
    expect(classement(MEILLEUR, D.phasage)[0]).toBe(O.phasage.creux);
    expect(ecart(MEILLEUR, D.phasage, O.phasage.creux, O.phasage.lots)).toBeGreaterThan(25000);
    // Fermer l'hôtel supprime les nuisances, mais perd tout le chiffre de trois semaines d'août.
    expect(ecart(MEILLEUR, D.phasage, O.phasage.creux, O.phasage.fermer)).toBeGreaterThan(25000);
  });

  it("D2 : prévenir et compenser avant les plaintes bat le silence et la baisse des prix", () => {
    const c = classement(MEILLEUR, D.clients);
    expect(c[0]).toBe(O.clients.prevenir);
    expect(c.at(-1)).toBe(O.clients.baisser);
    expect(ecart(MEILLEUR, D.clients, O.clients.prevenir, O.clients.rien)).toBeGreaterThan(5000);
  });

  it("D3 : isoler les clients du chantier bat l'attribution habituelle", () => {
    expect(classement(MEILLEUR, D.occupation)[0]).toBe(O.occupation.plan);
    expect(ecart(MEILLEUR, D.occupation, O.occupation.plan, O.occupation.habitude)).toBeGreaterThan(
      3000,
    );
  });

  it("D4 : le pointage vaut parce qu'on s'en sert ; sans rattrapage, il ne sert à rien", () => {
    expect(classement(MEILLEUR, D.suivi)[0]).toBe(O.suivi.pointage);
    expect(ecart(MEILLEUR, D.suivi, O.suivi.pointage, O.suivi.comptesRendus)).toBeGreaterThan(5000);
    const sansRattraper = avec(MEILLEUR, D.retard, O.retard.maintenir);
    expect(ecart(sansRattraper, D.suivi, O.suivi.pointage, O.suivi.comptesRendus)).toBeLessThan(0);
  });

  it("D5 : rattraper vaut le plus en moyenne ; forcer la cadence protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.retard);
    expect(classement(MEILLEUR, D.retard)[0]).toBe(O.retard.rattraper);
    expect(classement(MEILLEUR, D.retard).at(-1)).toBe(O.retard.maintenir);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(O.retard.cadence);
    expect(r[O.retard.rattraper]!.attendu - r[O.retard.maintenir]!.attendu).toBeGreaterThan(10000);
  });

  it("D6 : montrer le chantier fini garde Cimalp ; s'il déborde, mieux vaut loger ses ingénieurs ailleurs", () => {
    expect(classement(MEILLEUR, D.cimalp)[0]).toBe(O.cimalp.visite);
    expect(ecart(MEILLEUR, D.cimalp, O.cimalp.visite, O.cimalp.remise)).toBeGreaterThan(2000);
    const decale = avec(MEILLEUR, D.retard, O.retard.decaler);
    expect(classement(decale, D.cimalp)[0]).toBe(O.cimalp.ormea);
  });

  it("la bonne méthode bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(50000);
    expect(methode! - attentiste!).toBeGreaterThan(50000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni n'y figure", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d], `D${d + 1}`).not.toBe(o);
      const m = mesurerDecision(EPISODE_RENOVATION, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `D${d + 1} option ${o}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["previsions", "chantier"],
      ["cimalp"],
      ["etages"],
      ["comptes-rendus"],
      ["rattrapage"],
      ["ingenieurs"],
    ],
    jours: JOURS,
    diagnostic: "nuisances",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 20,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RENOVATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a voulu ne perdre aucune nuit, propose de compter les clients exposés", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_RENOVATION.comportements(p, analyser(EPISODE_RENOVATION, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RENOVATION.axe(c).titre).toBe(
      "Compter les clients exposés, pas seulement les chambres fermées",
    );
  });

  it("à qui a décidé sans enquêter, propose de regarder les nuits", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RENOVATION.comportements(p, analyser(EPISODE_RENOVATION, p).trimestre);
    expect(EPISODE_RENOVATION.axe(c).titre).toBe("Regarder les nuits, pas le mois");
  });

  it("juge le diagnostic et la prévision sur des seuils serrés", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (extra: Partial<PartieJouee>) =>
      EPISODE_RENOVATION.comportements(partie(MEILLEUR, extra), t);
    expect(score({ diagnostic: "delai" })[1]!.score).toBe(0.6);
    expect(score({ diagnostic: "chambres" })[1]!.score).toBe(0);
    expect(score({ prevision: 20 })[3]!.score).toBe(1);
    expect(score({ prevision: 21.5 })[3]!.score).toBe(0.6);
    expect(score({ prevision: 53 })[3]!.score).toBe(0);
  });

  it("dit le résultat en chiffre d'affaires net, et dit si Cimalp reste", () => {
    const t = simuler(MEILLEUR, 4242);
    expect(EPISODE_RENOVATION.bilan.titre(t)).toMatch(/chiffre d'affaires net/);
    const cimalp = EPISODE_RENOVATION.bilan.tuiles(t).find((x) => x.nom === "Cimalp")!;
    expect(cimalp.tenu).toBe(!t.cimalpPart);
  });
});
