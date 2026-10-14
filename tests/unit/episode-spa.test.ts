import { describe, expect, it } from "vitest";
import {
  A,
  CREDIT_BAIL,
  D,
  EFFET_ATTENDU,
  EFFET_PRIX,
  EXTERIEURS,
  HORIZON,
  HOTEL,
  IMPREVUS,
  NET_PAR_EURO,
  O,
  PRET,
  RENOVATION,
  SEMINAIRES,
  SEUIL_PRIX_MOYEN,
  SPA,
  TAUX,
  annuite,
  hasard,
  paiement,
  planSeminaires,
  pretAccorde,
  projetAdopte,
  simuler,
  surcoutCreditBail,
  vanPropre,
} from "../../src/engine/episodes/spa-a-financer";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  CA_DU_DIRECTEUR,
  ETAPES,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/spa-a-financer";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_SPA, chiffresDuDossier } from "../../src/pedagogy/episodes/spa-a-financer";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le spa qui ne se rentabilise pas seul » enseigne trois choses :
 * un investissement hôtelier se juge sur ses flux différentiels pour tout
 * l'hôtel, pas sur son propre compte, et pas tout ce qu'on annonce n'est
 * différentiel ; l'effet prix est incertain, et une étude payante change la
 * décision, pourvu qu'on laisse ses chiffres décider ; le financement ne
 * change pas la valeur du projet, mais la trésorerie du groupe. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
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
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
const k = (v: number) => Math.round(v / 1000);
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_SPA.contexte(
    EPISODE_SPA.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  // Les milliers s'écrivent avec une espace fine insécable : on la lit comme une espace.
  return (typeof s.resultat === "string" ? s.resultat : s.resultat(ctx)).replace(/\s/g, " ");
};

describe("le modèle du spa d'Évian", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).u).toBe(simuler(REFLEXE, 12).u);
    expect(simuler(MEILLEUR, 12).c).toBe(simuler(ATTENTISTE, 12).c);
    expect(simuler(MEILLEUR, 12).hiver).toBe(simuler(REFLEXE, 12).hiver);
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

  it("les trois scénarios d'effet prix tombent dans les proportions dites au joueur, à peu près", () => {
    const part = (s: string) =>
      GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length / GRAINES_DU_BILAN.length;
    for (const s of ["faible", "moyen", "fort"] as const) {
      expect(part(s)).toBeGreaterThan(EFFET_PRIX[s].chance - 0.15);
      expect(part(s)).toBeLessThan(EFFET_PRIX[s].chance + 0.15);
    }
  });

  it("ne rien engager ne crée ni ne détruit rien ; la valeur de la semaine 13 est l'objectif", () => {
    for (const g of GRAINES_DU_BILAN) expect(simuler(ATTENTISTE, g, 0).objectif).toBe(0);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });

  it("la banque accorde le prêt plus souvent quand le dossier s'appuie sur une étude", () => {
    const accords = (chemin: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => pretAccorde(chemin, g)).length;
    expect(accords(MEILLEUR)).toBeGreaterThan(accords(avec(MEILLEUR, D.etude, O.etude.aucune)));
    expect(pretAccorde(avec(MEILLEUR, D.financement, O.financement.comptant), 1)).toBeNull();
  });

  it("la bonne méthode dépasse en moyenne l'objectif de valeur ; le réflexe en détruit", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(150000);
    expect(attendu(MEILLEUR)).toBeLessThan(400000);
    expect(attendu(REFLEXE)).toBeLessThan(0);
    expect(attendu(REFLEXE)).toBeGreaterThan(-150000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le seuil de prix moyen que la semaine 1 demande se pose depuis le compte du spa et Hostéo", () => {
    const vanSeule =
      -1400000 - 30000 * annuite(12, 0.09) - 120000 / 1.09 ** 6 + 250000 / 1.09 ** 12;
    expect(vanPropre(SPA)).toBeCloseTo(vanSeule, 6);
    const parEuro = 15860 * (1 - 0.38 * 0.17);
    expect(NET_PAR_EURO).toBeCloseTo(parEuro, 6);
    expect(SEUIL_PRIX_MOYEN).toBeCloseTo(-vanSeule / (annuite(12, 0.09) * parEuro), 6);
    expect(SEUIL_PRIX_MOYEN).toBeCloseTo(15.04, 2);
    expect(EPISODE_SPA.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(15.04, 2);
    const compte = source(0, "compte", []);
    expect(compte).toContain(`${SPA.investissement / 1e6} M€`.replace(".", ","));
    expect(compte).toContain("soit un EBE de −30 k€");
    expect(compte).toContain("un résultat de −147 k€ par an");
    expect(compte).toContain(`(${SPA.renouvellement / 1000} k€)`);
    expect(compte).toContain(`vaut encore ${SPA.residuelle / 1000} k€`);
    expect(compte).toContain(`sur ${HORIZON} ans, actualisés à ${TAUX * 100} %`);
    const hotel = source(0, "hotel", []);
    expect(hotel).toContain("15 860 nuitées");
    expect(hotel).toContain("taux d'occupation de 65,8 %");
    expect(hotel).toContain("RevPAR : 120 €");
    expect(hotel).toContain("38 % des nuitées");
    expect(hotel).toContain("17 % de commission");
  });

  it("la projection de la directrice est du chiffre d'affaires : 1,36 M€, que la source affiche", () => {
    expect(CA_DU_DIRECTEUR).toBe(430000 + 1800 * 230 + 20 * 14000 + 15 * 15860);
    expect(source(0, "directeur", [])).toContain("1,36 M€ de chiffre d'affaires");
  });

  it("la VAN du spa selon l'effet prix, et le pivot avec la rénovation, sont ceux que la source affiche", () => {
    const aLaMain = (u: number) =>
      -SPA.investissement +
      (u * NET_PAR_EURO +
        (1 - 0.5) * SPA.forfaits * HOTEL.margeNuitee +
        SPA.seminaires.naturels * SEMINAIRES.margeEvian +
        (SPA.ca - SPA.charges)) *
        A -
      SPA.renouvellement / (1 + TAUX) ** 6 +
      SPA.residuelle / (1 + TAUX) ** HORIZON;
    const c = chiffresDuDossier(SPA);
    expect(c.moyen).toBeCloseTo(aLaMain(10), 6);
    expect(c.faible).toBeCloseTo(aLaMain(5), 6);
    expect(k(c.faible)).toBe(-276);
    expect(k(c.moyen)).toBe(255);
    expect(k(c.fort)).toBe(680);
    expect(k(c.renovation)).toBe(88);
    expect(
      -RENOVATION.investissement +
        (8 * NET_PAR_EURO + 361 * HOTEL.margeNuitee) * A -
        RENOVATION.renouvellement / (1 + TAUX) ** 6,
    ).toBeCloseTo(c.renovation, 6);
    const texte = source(1, "valeur", [1]);
    expect(texte).toContain("le spa crée −276 k€ de VAN si son effet sur le prix moyen est faible");
    expect(texte).toContain("255 k€ s'il est moyen (10 €), 680 k€ s'il est fort (14 €)");
    expect(texte).toContain("La rénovation crée 88 k€");
    expect(texte).toContain("En dessous de 8,4 € d'effet");
    // Le pivot : l'effet prix qui égalise le spa et la rénovation.
    expect(aLaMain(c.pivot)).toBeCloseTo(c.renovation, 3);
    expect(EFFET_ATTENDU).toBeCloseTo(9.5, 6);
  });

  it("le transfert des séminaires ne rapporte rien au groupe ; la source en donne les éléments", () => {
    expect(planSeminaires(SPA, O.seminaires.transfert, 0.3)).toBeCloseTo(
      20 * (4600 - 3800) - 0.3 * 20 * 3800,
      6,
    );
    expect(planSeminaires(SPA, O.seminaires.transfert, 0.3)).toBeLessThan(0);
    expect(planSeminaires(SPA, O.seminaires.commercial, 0)).toBe(9 * 4600 - 26000);
    expect(planSeminaires(RENOVATION, O.seminaires.commercial, 0)).toBeLessThan(0);
    const texte = source(2, "groupe", [1, 0]);
    expect(texte).toContain("fait gagner 92 k€ de marge à Évian et en fait perdre 76 k€ à Aix");
    expect(texte).toContain("trois clients sur dix");
  });

  it("ce que les abonnements coûteraient au prix des chambres est ce que la source affiche", () => {
    const perte = EXTERIEURS.abonnements.geneDossier * EFFET_ATTENDU * NET_PAR_EURO;
    expect(k(perte)).toBe(63);
    expect(source(3, "clients", [1, 0, 1])).toContain(
      `les abonnements coûteraient ${k(perte)} k€ par an sur le prix des chambres`,
    );
  });

  it("en semaine 8, la source désigne le projet que « suivre les chiffres » fait adopter", () => {
    for (const g of GRAINES_DU_BILAN) {
      const chemin = [1, 0, 1, 1];
      const texte = source(4, "chiffres", chemin, g);
      const spa = Number(
        /le spa crée (−?[\d ]+) k€/.exec(texte)![1]!.replace("−", "-").replace(/\s/g, ""),
      );
      const reno = Number(
        /la rénovation (−?[\d ]+) k€/.exec(texte)![1]!.replace("−", "-").replace(/\s/g, ""),
      );
      const adopte = projetAdopte([...chemin, O.conseil.chiffres, 0], g);
      if (Math.abs(spa - reno) > 1) expect(adopte === SPA, `graine ${g}`).toBe(spa > reno);
    }
  });

  it("le crédit-bail coûte plus que l'emprunt, et le financement ne change pas la VAN du projet", () => {
    const loyer = paiement(1400000, CREDIT_BAIL.taux, 12);
    expect(surcoutCreditBail(1400000)).toBeCloseTo(loyer * annuite(12, PRET.taux) - 1400000, 6);
    expect(k(surcoutCreditBail(1400000))).toBe(82);
    const vans = [0, 1, 2].map((o) => simuler(avec(MEILLEUR, D.financement, o), 1).van);
    expect(vans[1]).toBeCloseTo(vans[0]!, 6);
    expect(vans[2]).toBeCloseTo(vans[0]!, 6);
    // Sous la graine 1, les entreprises révisent leurs prix de 3 % et Megève réserve mal : la
    // source de la semaine 11 chiffre le spa adopté à 1 442 k€, et le point bas en conséquence.
    expect(
      hasard(1)
        .imprevus.map((i) => i.imprevu.id)
        .sort(),
    ).toEqual(["indice", "neige"]);
    const montant = SPA.investissement * 1.03;
    const texte = source(5, "financements", MEILLEUR.slice(0, 5), 1);
    expect(texte).toContain(
      `Le crédit-bail : ${k(paiement(montant, CREDIT_BAIL.taux, 12))} k€ par an`,
    );
    expect(texte).toContain(`ses loyers coûtent ${k(surcoutCreditBail(montant))} k€ de plus`);
    const basEmprunt = 1500000 - 0.7 * (1 - PRET.quotite) * montant - 250000;
    expect(texte).toContain(
      `${k(basEmprunt).toLocaleString("fr-FR").replace(/\s/g, " ")} k€ avec le prêt`,
    );
    expect(texte).toContain(
      `${k(1500000 - 250000)
        .toLocaleString("fr-FR")
        .replace(/\s/g, " ")} k€ avec le crédit-bail`,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le spa jugé sur tout l'hôtel crée le plus de valeur ; le rejeter sur son compte, ou le faire en grand, bien moins", () => {
    const r = rejeu(MEILLEUR, D.projet);
    expect(classement(MEILLEUR, D.projet)[0]).toBe(O.projet.spa);
    expect(r[O.projet.spa]!.attendu - r[O.projet.renovation]!.attendu).toBeGreaterThan(150000);
    expect(r[O.projet.spa]!.attendu - r[O.projet.grand]!.attendu).toBeGreaterThan(150000);
  });

  it("D2 : l'étude bat l'estimation gratuite, qui bat l'absence d'étude ; elle ne vaut rien si l'on n'en tient pas compte", () => {
    const r = rejeu(MEILLEUR, D.etude);
    expect(classement(MEILLEUR, D.etude)).toEqual([0, 1, 2]);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
    const sourd = avec(MEILLEUR, D.conseil, O.conseil.maintenir);
    expect(classement(sourd, D.etude)[0]).not.toBe(O.etude.cabinet);
  });

  it("D3 : le commercial est le meilleur en moyenne, ne rien changer le plus sûr ; avec la seule rénovation, il coûte", () => {
    const r = rejeu(MEILLEUR, D.seminaires);
    expect(classement(MEILLEUR, D.seminaires)[0]).toBe(O.seminaires.commercial);
    expect(classement(MEILLEUR, D.seminaires).at(-1)).toBe(O.seminaires.transfert);
    expect(plusSure(MEILLEUR, D.seminaires)).toBe(O.seminaires.rien);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    const renovation = avec(MEILLEUR, D.projet, O.projet.renovation);
    expect(classement(renovation, D.seminaires)[0]).toBe(O.seminaires.rien);
  });

  it("D4 : équilibrer le compte du spa avec des abonnements coûte cher à l'hôtel ; les soins de semaine rapportent", () => {
    const r = rejeu(MEILLEUR, D.exterieurs);
    expect(classement(MEILLEUR, D.exterieurs)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("D5 : laisser les chiffres décider bat le dossier d'octobre ; sans étude, mieux vaut attendre l'Observatoire", () => {
    const r = rejeu(MEILLEUR, D.conseil);
    expect(classement(MEILLEUR, D.conseil)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    const sansEtude = avec(MEILLEUR, D.etude, O.etude.aucune);
    expect(classement(sansEtude, D.conseil)[0]).toBe(O.conseil.reporter);
  });

  it("D6 : l'emprunt bat le paiement comptant, qui tend la trésorerie, et le crédit-bail, plus cher", () => {
    const r = rejeu(MEILLEUR, D.financement);
    expect(classement(MEILLEUR, D.financement)).toEqual([0, 2, 1]);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
  });

  it("tout l'hôtel, avec et sans projet, bat le compte propre du spa et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(150000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_SPA, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["compte", "hotel"],
      ["valeur"],
      ["groupe"],
      ["clients"],
      ["chiffres"],
      ["financements"],
    ],
    jours: JOURS,
    diagnostic: "differentiel",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 15,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SPA, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de juger le spa sur tout l'hôtel", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SPA.comportements(p, analyser(EPISODE_SPA, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SPA.axe(c).titre).toBe("Juger le spa sur tout l'hôtel, pas sur son compte");
  });

  it("à qui a décidé sans enquêter, propose de poser l'hôtel avec et sans spa", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SPA.comportements(p, analyser(EPISODE_SPA, p).trimestre);
    expect(EPISODE_SPA.axe(c).titre).toBe("Poser l'hôtel avec et sans spa");
  });

  it("à qui a payé l'étude sans s'en servir, propose de payer pour savoir, et de s'en servir", () => {
    const p = partie(avec(MEILLEUR, D.conseil, O.conseil.maintenir));
    const c = EPISODE_SPA.comportements(p, analyser(EPISODE_SPA, p).trimestre);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_SPA.axe(c).titre).toBe("Payer pour savoir, et s'en servir");
  });

  it("juge le seuil calculé en semaine 1 : juste, proche (commissions oubliées), ou faux (amortissement compté)", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_SPA.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(15)).toBe(1);
    // Sans les commissions : 1 597 k€ / 7,161 / 15 860 ≈ 14,1 €.
    expect(score(Math.round((-vanPropre(SPA) / A / HOTEL.nuitees) * 10) / 10)).toBe(0.6);
    // Avec le résultat après amortissement au lieu de l'EBE : bien au-delà.
    const avecAmortissement =
      (SPA.investissement + (SPA.investissement / 12 + 30000) * A + 71552 - 88884) /
      (A * NET_PAR_EURO);
    expect(score(Math.round(avecAmortissement))).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_SPA.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/valeur créée/);
    expect(EPISODE_SPA.bilan.titre(simuler(REFLEXE, 3))).toMatch(/valeur détruite/);
  });
});
