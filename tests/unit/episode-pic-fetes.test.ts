import { describe, expect, it } from "vitest";
import {
  AGE_MAX,
  BESOIN_PIC,
  CADENCE,
  CADENCE_NOMINALE,
  CHAMBRE_FROIDE,
  CHANGEMENTS,
  CHANGEMENTS_REGROUPES,
  COMMANDE,
  COMMANDE_TARDIVE,
  CONGES_DECALABLES,
  CONGES_POSES,
  COUT_SAMEDI,
  COUT_SUPPLEANCE,
  D,
  DLC,
  EQUIPAGE,
  HEURES_BASE,
  HEURES_IMPOSEES_NOEL,
  HEURES_PAR_POSTE,
  HEURES_REGAGNEES,
  HEURES_SAMEDI,
  HEURES_SUP_DECEMBRE,
  HEURES_WEEKEND,
  IMPREVUS,
  LIGNES,
  MAJORATION_SUP,
  MINUTES_PAR_CHANGEMENT,
  MODULATION,
  O,
  PERMANENTS,
  PROFIL,
  RECRUTEMENT,
  SEMAINE_INTERIM,
  TRS,
  VENTES_OCTOBRE,
  avisFavorable,
  besoinDuPic,
  coutHeureDeLigne,
  hasard,
  heuresDeConges,
  interimairesPourvus,
  simuler,
  ventesPrevues,
} from "../../src/engine/episodes/pic-des-fetes";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/pic-des-fetes";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_PIC_FETES } from "../../src/pedagogy/episodes/pic-des-fetes";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le pic des fêtes » enseigne qu'un pic de produits frais se
 * prépare en heures de travail, pas en stock : la DLC interdit de produire
 * plus d'une semaine d'avance, les intérimaires appelés au dernier moment sont
 * rares, lents et partent, les heures imposées reviennent en absences et en
 * accidents. On combine des intérimaires recrutés tôt, formés et encadrés,
 * l'aménagement du temps de travail des permanents, des congés décalés au
 * volontariat et une équipe de suppléance du week-end. Ces tests verrouillent
 * les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 1, 1];
const REFLEXE = [0, 1, 1, 2, 0, 0];
const HABITUDE = [0, 2, 3, 0, 2, 2];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const ecart = (chemin: readonly number[], d: number, o: number, autre: number) =>
  attendu(avec(chemin, d, o)) - attendu(avec(chemin, d, autre));

/** Un nombre tel que les sources l'écrivent : « 1 260 000 », « 62,5 ». */
const fr = (v: number, d = 0) =>
  v
    .toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })
    .replace(/\s/g, " ");
const euros = (v: number) => `${fr(v)} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const option = (etape: number, k: number) => ETAPES[etape]!.options[k]!;

describe("les chiffres que les sources donnent au joueur", () => {
  it("les prévisions et la fiche des lignes donnent 130 heures de ligne à trouver par semaine au pic", () => {
    const previsions = texte(0, "previsions");
    expect(previsions).toContain(fr(VENTES_OCTOBRE));
    for (const w of [8, 9, 10, 11, 13]) expect(previsions).toContain(fr(ventesPrevues(w)));
    expect(ventesPrevues(11)).toBe(2 * VENTES_OCTOBRE);
    const lignes = texte(0, "lignes");
    expect(lignes).toContain(fr(CADENCE_NOMINALE));
    expect(lignes).toContain(`${fr(TRS * 100, 1)} %`);
    expect(lignes).toContain(`${fr(HEURES_PAR_POSTE, 1)} heures de production par poste`);
    expect(lignes).toContain(`${fr(HEURES_BASE)} heures de ligne par semaine`);
    expect(lignes).toContain("six personnes");
    // 7 200 × 62,5 % = 4 500 pots par heure ; 1 260 000 / 4 500 = 280 heures ; 280 − 150 = 130.
    expect(CADENCE).toBe(4500);
    expect(HEURES_BASE).toBe(LIGNES * 2 * 5 * HEURES_PAR_POSTE);
    expect(besoinDuPic()).toBe(130);
    expect(EQUIPAGE).toBe(6);
    expect(EPISODE_PIC_FETES.prevision.reel(simuler(MEILLEUR, 1))).toBe(130);
    expect(EPISODE_PIC_FETES.prevision.reel(simuler(HABITUDE, 9))).toBe(BESOIN_PIC);
  });

  it("la DLC laisse huit jours entre la fabrication et l'expédition", () => {
    const previsions = texte(0, "previsions");
    expect(previsions).toContain(`DLC de ${DLC} jours`);
    expect(previsions).toContain("deux tiers");
    expect(previsions).toContain(`au plus ${AGE_MAX} jours`);
    // 28 × 1/3 = 9,3 jours, moins une journée de transport.
    expect(AGE_MAX).toBe(8);
    expect(texte(3, "chambre")).toContain(fr(CHAMBRE_FROIDE));
    expect(option(3, O.avance.uneSemaine).d).toContain(fr(CHAMBRE_FROIDE));
  });

  it("l'accord de 2021 et les congés de Noël sont chiffrés comme dans le modèle", () => {
    // 40 heures au lieu de 35 : un septième de plus, 21 heures de ligne.
    expect(MODULATION).toBeCloseTo(HEURES_BASE / 7, 6);
    expect(texte(1, "accord")).toContain(`${fr(MODULATION)} heures de ligne par semaine`);
    const conges = texte(1, "conges");
    expect(conges).toContain(`${fr(CONGES_DECALABLES).replace("6", "Six")} sur huit`);
    expect(conges).toContain(`${fr(heuresDeConges(CONGES_POSES))} heures de ligne`);
    expect(conges).toContain(
      `deux absents, ${fr(heuresDeConges(CONGES_POSES - CONGES_DECALABLES))}`,
    );
    expect(Math.round(heuresDeConges(CONGES_POSES))).toBe(43);
    expect(PERMANENTS).toBe(28);
    const heuresSup = euros(HEURES_SUP_DECEMBRE * coutHeureDeLigne(MAJORATION_SUP));
    expect(option(1, O.temps.refus).d).toContain(heuresSup);
    expect(option(1, O.temps.volontaires).d).toContain(heuresSup);
  });

  it("le week-end, la suppléance et le samedi coûtent ce que disent les sources", () => {
    const suppleance = texte(2, "suppleance");
    expect(suppleance).toContain(`${HEURES_WEEKEND} heures de ligne par week-end`);
    expect(suppleance).toContain(euros(COUT_SUPPLEANCE));
    // Douze volontaires, deux postes de 12 heures, majorés de 50 %.
    expect(COUT_SUPPLEANCE).toBe(12 * 24 * 26 * 1.5);
    const samedi = texte(2, "samedi");
    expect(samedi).toContain(`${HEURES_SAMEDI} heures de ligne`);
    expect(samedi).toContain(euros(COUT_SAMEDI));
    expect(option(2, O.weekend.suppleance).d).toContain(euros(COUT_SUPPLEANCE));
    expect(option(2, O.weekend.samedi).d).toContain(euros(COUT_SAMEDI));
    expect(option(3, O.avance.uneSemaine).d).toContain(euros(COUT_SAMEDI));
  });

  it("l'intérim, les formats de Noël et les heures imposées sont ceux du modèle", () => {
    expect(option(0, O.interim.tot).d).toContain(euros(COMMANDE * SEMAINE_INTERIM));
    expect(option(0, O.interim.tot).t).toContain(`${COMMANDE} intérimaires`);
    expect(texte(0, "bilan")).toContain(`pour ${COMMANDE_TARDIVE} intérimaires`);
    const formats = texte(5, "formats");
    expect(formats).toContain(`${CHANGEMENTS} changements de format`);
    expect(formats).toContain(`${MINUTES_PAR_CHANGEMENT} minutes`);
    expect(formats).toContain(`${(CHANGEMENTS * MINUTES_PAR_CHANGEMENT) / 60} heures de ligne`);
    expect(formats).toContain(`${fr(CHANGEMENTS_REGROUPES).replace("8", "huit")} changements`);
    expect(HEURES_REGAGNEES).toBe(20);
    // Six heures de plus pour 28 permanents, six par ligne : 28 heures de ligne.
    expect(HEURES_IMPOSEES_NOEL).toBe(28);
    expect(option(5, O.noel.imposer).d).toContain(`${HEURES_IMPOSEES_NOEL} heures de ligne`);
    expect(option(5, O.noel.imposer).d).toContain(
      euros(HEURES_IMPOSEES_NOEL * coutHeureDeLigne(MAJORATION_SUP)),
    );
  });

  it("l'agence pourvoit la commande d'octobre, et la moitié seulement de celle de fin novembre", () => {
    const tot = moyenne(GRAINES_DU_BILAN.map((g) => interimairesPourvus("tot", hasard(g).uPourvu)));
    const tard = GRAINES_DU_BILAN.map((g) => interimairesPourvus("finNovembre", hasard(g).uPourvu));
    expect(tot).toBeGreaterThan(0.85 * COMMANDE);
    expect(moyenne(tard) / COMMANDE_TARDIVE).toBeCloseTo(0.45, 1);
    // L'an dernier : 9 sur 18, et 5 partis avant Noël.
    const partis = 1 - (1 - RECRUTEMENT.finNovembre.depart) ** 4;
    expect(partis).toBeGreaterThan(0.45);
    expect(partis).toBeLessThan(0.6);
  });
});

describe("le modèle des lignes desserts", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[9]!.demande).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[9]!.demande,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
    expect(PROFIL).toHaveLength(14);
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

  it("le CSE rend un avis favorable environ trois fois sur quatre", () => {
    const favorables = GRAINES_DU_BILAN.filter((g) => avisFavorable(g)).length;
    expect(favorables).toBeGreaterThanOrEqual(18);
    expect(favorables).toBeLessThanOrEqual(26);
  });

  it("produire d'avance au-delà de huit jours se paie en pots refusés", () => {
    expect(simuler(MEILLEUR, 3).casse).toBe(0);
    const octobre = simuler(avec(MEILLEUR, D.interim, O.interim.octobre), 3);
    expect(octobre.potsRefuses).toBe(3 * HEURES_SAMEDI * CADENCE);
    const troisSemaines = simuler(avec(MEILLEUR, D.avance, O.avance.troisSemaines), 3);
    expect(troisSemaines.potsRefuses).toBeGreaterThanOrEqual(HEURES_WEEKEND * CADENCE);
    expect(troisSemaines.casse).toBeGreaterThan(25000);
  });

  it("les intérimaires appelés tard partent bien plus souvent ; le tutorat les retient", () => {
    const part = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g)).map((t) => t.partis / t.arrives));
    expect(part(HABITUDE)).toBeGreaterThan(0.3);
    expect(part(MEILLEUR)).toBeLessThan(0.15);
    expect(part(avec(HABITUDE, D.postes, O.postes.tutorat))).toBeLessThan(part(HABITUDE) - 0.1);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, HABITUDE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(150000);
        expect(t.objectif).toBeLessThan(650000);
        for (const s of t.semaines.slice(1)) {
          expect(s!.service).toBeGreaterThan(0.35);
          expect(s!.service).toBeLessThanOrEqual(1);
          expect(s!.absenteisme).toBeLessThan(0.25);
          expect(s!.capacite).toBeLessThan(300);
        }
      }
    }
    expect(moyenne(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).servicePic))).toBeGreaterThan(
      0.96,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : recruter et former tôt bat l'appel de fin novembre ; produire en octobre est le pire", () => {
    const c = classement(MEILLEUR, D.interim);
    expect(c[0]).toBe(O.interim.tot);
    expect(c.at(-1)).toBe(O.interim.octobre);
    expect(ecart(MEILLEUR, D.interim, O.interim.tot, O.interim.finNovembre)).toBeGreaterThan(25000);
    expect(ecart(MEILLEUR, D.interim, O.interim.tot, O.interim.sansFormation)).toBeGreaterThan(
      20000,
    );
  });

  it("D2 : l'accord de 2021 et les congés décalés battent le refus des congés et le statu quo", () => {
    const c = classement(MEILLEUR, D.temps);
    expect(c[0]).toBe(O.temps.modulation);
    expect(c.at(-1)).toBe(O.temps.rien);
    expect(ecart(MEILLEUR, D.temps, O.temps.modulation, O.temps.refus)).toBeGreaterThan(30000);
  });

  it("D3 : la suppléance concertée est la meilleure en moyenne, le samedi volontaire le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.weekend);
    expect(classement(MEILLEUR, D.weekend)[0]).toBe(O.weekend.suppleance);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSure.option).toBe(O.weekend.samedi);
    expect(r[O.weekend.suppleance]!.attendu - r[O.weekend.samedi]!.attendu).toBeGreaterThan(3000);
    // Imposer les samedis fait moins bien que les demander à des volontaires.
    expect(ecart(MEILLEUR, D.weekend, O.weekend.samedi, O.weekend.imposer)).toBeGreaterThan(10000);
  });

  it("D4 : une semaine d'avance aide ; trois semaines se perdent en casse", () => {
    const c = classement(MEILLEUR, D.avance);
    expect(c).toEqual([O.avance.uneSemaine, O.avance.rien, O.avance.troisSemaines]);
    expect(ecart(MEILLEUR, D.avance, O.avance.uneSemaine, O.avance.rien)).toBeGreaterThan(10000);
  });

  it("D5 : le tutorat sur des postes simples bat le reste, et compte bien plus sans formation", () => {
    expect(classement(MEILLEUR, D.postes)[0]).toBe(O.postes.tutorat);
    const formes = ecart(MEILLEUR, D.postes, O.postes.tutorat, O.postes.tous);
    const nonFormes = ecart(
      avec(MEILLEUR, D.interim, O.interim.sansFormation),
      D.postes,
      O.postes.tutorat,
      O.postes.tous,
    );
    expect(formes).toBeGreaterThan(3000);
    // L'interaction : des intérimaires non formés sur les postes à risque coûtent bien plus.
    expect(nonFormes).toBeGreaterThan(2.5 * formes);
  });

  it("D6 : regrouper les petites séries bat les heures imposées et le renfort de dernière minute", () => {
    const c = classement(MEILLEUR, D.noel);
    expect(c[0]).toBe(O.noel.series);
    expect(ecart(MEILLEUR, D.noel, O.noel.series, O.noel.imposer)).toBeGreaterThan(8000);
    expect(ecart(MEILLEUR, D.noel, O.noel.series, O.noel.agence)).toBeGreaterThan(20000);
  });

  it("trouver les heures tôt bat nettement le réflexe et l'habitude", () => {
    const [methode, reflexe, habitude] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 150000);
    expect(methode).toBeGreaterThan(habitude! + 150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni n'est dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_PIC_FETES, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `réflexe [${d}, ${o}]`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["previsions", "lignes"],
      ["accord", "conges"],
      ["suppleance"],
      ["dlc"],
      ["document"],
      ["formats"],
    ],
    jours: JOURS,
    diagnostic: "heures",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 130,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PIC_FETES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi le réflexe, propose de préparer la capacité tôt", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PIC_FETES.comportements(p, analyser(EPISODE_PIC_FETES, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PIC_FETES.axe(c).titre).toBe(
      "Préparer la capacité tôt plutôt que l'imposer tard",
    );
  });

  it("à qui a décidé sans enquêter, propose de compter les heures", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PIC_FETES.comportements(p, analyser(EPISODE_PIC_FETES, p).trimestre);
    expect(EPISODE_PIC_FETES.axe(c).titre).toBe("Compter les heures avant de chercher des bras");
  });

  it("juge la prévision à l'heure près", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_PIC_FETES.comportements(partie(MEILLEUR, { prevision: 133 }), t);
    const proche = EPISODE_PIC_FETES.comportements(partie(MEILLEUR, { prevision: 115 }), t);
    // Le piège : la cadence nominale sans le TRS donne 175 − 150 = 25 heures.
    const loin = EPISODE_PIC_FETES.comportements(partie(MEILLEUR, { prevision: 25 }), t);
    expect(juste[3]!.score).toBe(1);
    expect(proche[3]!.score).toBe(0.6);
    expect(loin[3]!.score).toBe(0);
  });

  it("dit le diagnostic juste et le diagnostic proche", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (diagnostic: string) =>
      EPISODE_PIC_FETES.comportements(partie(MEILLEUR, { diagnostic }), t)[1]!.score;
    expect(score("heures")).toBe(1);
    expect(score("interim")).toBe(0.6);
    expect(score("stock")).toBe(0);
    expect(score("trs")).toBe(0);
  });
});
