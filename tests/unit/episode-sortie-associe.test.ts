import { describe, expect, it } from "vitest";
import {
  ACCOMPAGNEMENT,
  BASE,
  CLAUSES,
  COMPTES,
  COMPTES_2026,
  D,
  DEPART,
  DETTE_NETTE,
  EBE_RETRAITE,
  FLUX,
  HALDEN,
  IMPREVUS,
  LAVAUDIERE,
  MARCHES,
  NEUTRE,
  OFFRES,
  PACTE,
  PERTE_GEL,
  PERTE_SANS_RIEN,
  PRIX_DEMANDE,
  PRIX_DU_PACTE,
  RETRAITEMENT_REMUNERATION,
  TRESORERIE,
  VALEUR_ACTUALISEE,
  VALEUR_DE_LA_PART,
  VALEUR_DES_COMPTES,
  chanceHalden,
  etatReel,
  hasard,
  simuler,
  totalDuComplement,
  valeurDuCompte,
} from "../../src/engine/episodes/associe-qui-part";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/associe-qui-part";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_SORTIE_ASSOCIE,
  PRIX_DU_PACTE_KE,
  conclusionsDeLaRevue,
  interetsDeLEmprunt,
} from "../../src/pedagogy/episodes/associe-qui-part";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'associé qui veut vendre ses parts » enseigne que la valeur
 * d'un cabinet tient aux personnes et aux clients : le prix se calcule sur
 * l'EBE retraité, selon le pacte, mais quand une part de la valeur peut
 * partir avec le cédant, on la sécurise par le montage (paiement étalé,
 * complément de prix indexé sur le maintien des comptes, clauses, passation
 * ciblée), pas seulement en discutant le multiple ; et le financement du
 * rachat change la trésorerie, pas la valeur. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres que
 * les sources affichent.
 */

const MEILLEUR = [2, 0, 2, 3, 1, 1];
const REFLEXE = [0, 2, 0, 0, 0, 0];
const ATTENTISTE = [...NEUTRE];
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
/** Un montant en k€ tel que les sources l'écrivent : « 1 867 k€ ». */
const ke = (v: number) => `${k(v).toLocaleString("fr-FR").replace(/\s/g, " ")} k€`;
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_SORTIE_ASSOCIE.contexte(
    EPISODE_SORTIE_ASSOCIE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  const texte = typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
  return texte.replace(/[\u202f\u00a0]/g, " ");
};

describe("le modèle de la sortie de l'associé", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).marche).toBe(simuler(REFLEXE, 12).marche);
    expect(simuler(MEILLEUR, 12).personnel).toEqual(simuler(ATTENTISTE, 12).personnel);
    expect(EPISODE_SORTIE_ASSOCIE.imprevus(12)).toEqual(EPISODE_SORTIE_ASSOCIE.imprevus(12));
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

  it("le marché et les attachements suivent les chances que les sources donnent", () => {
    for (const m of MARCHES) {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).marche === m.id).length;
      expect(n / GRAINES_DU_BILAN.length, m.id).toBeGreaterThan(m.chance - 0.1);
      expect(n / GRAINES_DU_BILAN.length, m.id).toBeLessThan(m.chance + 0.1);
    }
    COMPTES.forEach((c, i) => {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).personnel[i]).length;
      expect(Math.abs(n / GRAINES_DU_BILAN.length - c.chancePersonnel)).toBeLessThan(0.1);
    });
  });

  it("Wilfrid rejoint Halden bien plus souvent après un refus sec ou une parole reprise", () => {
    const halden = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => etatReel(c, g).halden).length;
    expect(chanceHalden([1, 0, 1])).toBeGreaterThan(chanceHalden([2, 0, 2]) + 0.3);
    expect(chanceHalden([0, 0, 2])).toBeGreaterThan(chanceHalden([0, 0, 0]) + 0.2);
    expect(halden([1, 0, 1, 3, 1, 1])).toBeGreaterThan(halden(MEILLEUR) + 8);
  });

  it("la bonne méthode crée de la valeur ; le réflexe en détruit, l'attente aussi", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(200000);
    expect(attendu(MEILLEUR)).toBeLessThan(400000);
    expect(attendu(REFLEXE)).toBeLessThan(-1000000);
    expect(attendu(REFLEXE)).toBeGreaterThan(-1600000);
    expect(attendu(ATTENTISTE)).toBeLessThan(-100000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-400000);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(EPISODE_SORTIE_ASSOCIE.lire([], 5, 0, 0).valeur).toBe(0);
  });

  it("en semaine 13, tout est connu : comptes, Halden, signature", () => {
    for (const g of [1, 6, 14]) {
      const t = simuler(MEILLEUR, g, JOURS);
      const exposee = COMPTES.reduce((s, c, i) => s + (t.partis[i] ? valeurDuCompte(c) : 0), 0);
      expect(t.semaines[13]!.exposee).toBeCloseTo(exposee, 6);
      expect([0, 1]).toContain(t.semaines[13]!.halden);
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("l'EBE retraité, la dette nette et le prix du pacte, que la semaine 1 demande", () => {
    expect(RETRAITEMENT_REMUNERATION).toBe(6 * (240000 - 140000));
    expect(EBE_RETRAITE).toBe(3000000 - 600000 - 350000 + 150000);
    expect(DETTE_NETTE).toBe(1000000);
    const aLaMain = (PACTE.multiple * EBE_RETRAITE - DETTE_NETTE) * PACTE.part * (1 - PACTE.decote);
    expect(PRIX_DU_PACTE).toBeCloseTo(aLaMain, 6);
    expect(PRIX_DU_PACTE_KE).toBeCloseTo(1866.6, 6);
    expect(EPISODE_SORTIE_ASSOCIE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(1866.6, 6);
    const comptes = source(0, "comptes", []);
    expect(comptes).toContain(`EBE publié : ${ke(COMPTES_2026.ebePublie)}`);
    expect(comptes).toContain(`${COMPTES_2026.remunerationVersee / 1000} k€ de rémunération`);
    expect(comptes).toContain(`${COMPTES_2026.remunerationNormative / 1000} k€, charges comprises`);
    expect(comptes).toContain(`${COMPTES_2026.missionExceptionnelle / 1000} k€ de marge`);
    expect(comptes).toContain(`${COMPTES_2026.demenagement / 1000} k€ de charges`);
    expect(comptes).toContain(
      `Emprunts : ${ke(COMPTES_2026.emprunts)} ; trésorerie : ${ke(COMPTES_2026.tresorerie)}`,
    );
    const pacte = source(0, "pacte", []);
    expect(pacte).toContain("six fois l'EBE retraité");
    expect(pacte).toContain(`décote de minorité de ${PACTE.decote * 100} %`);
  });

  it("son prix est huit fois l'EBE retraité, sans décote ; l'actualisation des flux confirme six fois", () => {
    expect(k(PRIX_DEMANDE)).toBe(2988);
    expect(PRIX_DEMANDE).toBeCloseTo(PACTE.part * (8 * EBE_RETRAITE - DETTE_NETTE), 6);
    expect(VALEUR_ACTUALISEE).toBeCloseTo(PACTE.multiple * EBE_RETRAITE, 6);
    expect(source(2, "actualisation", [2, 0])).toContain(
      `${ke(FLUX.disponible)} par an, ${FLUX.croissance * 100} % de croissance, ${Math.round(FLUX.coutDuCapital * 100)} % de coût du capital, soit une valeur d'entreprise de ${ke(VALEUR_ACTUALISEE)}`,
    );
    expect(ETAPES[0]!.options[0]!.d).toContain(ke(PRIX_DEMANDE));
    expect(ETAPES[0]!.options[1]!.t).toContain(ke(PRIX_DU_PACTE));
  });

  it("la valeur des comptes et ce que chaque offre coûte, selon qu'ils restent ou partent", () => {
    const texte = source(2, "offres", [2, 0]);
    expect(COMPTES.map((c) => k(valeurDuCompte(c)))).toEqual([1140, 840, 600]);
    expect(k(VALEUR_DES_COMPTES)).toBe(2580);
    expect(texte).toContain(
      `${ke(valeurDuCompte(COMPTES[0]!))} pour Herlinval, ${ke(valeurDuCompte(COMPTES[1]!))} pour Lavaudière, ${ke(valeurDuCompte(COMPTES[2]!))} pour le Brivet, ${ke(VALEUR_DES_COMPTES)}`,
    );
    const [, , equilibre, maximal] = OFFRES;
    expect(k(equilibre!.comptant + equilibre!.etale + totalDuComplement(equilibre!))).toBe(2200);
    expect(k(equilibre!.comptant + equilibre!.etale)).toBe(1600);
    expect(k(maximal!.comptant + totalDuComplement(maximal!))).toBe(2300);
    expect(texte).toContain("2 200 ou 1 600 k€");
    expect(texte).toContain("2 300 ou 1 000 k€");
    expect(texte).toContain("250, 200 et 150 k€");
    expect(texte).toContain("550, 450 et 300 k€");
    expect(texte).toContain("80 % de ceux de 2026");
  });

  it("les effets que les sources annoncent sont ceux du modèle", () => {
    // « un compte qui tenait à sa personne l'a suivi une fois sur deux, un compte tenu par l'équipe une fois sur quinze »
    expect(DEPART.personnel).toBeGreaterThan(0.45);
    expect(DEPART.personnel).toBeLessThan(0.6);
    expect(Math.round(1 / DEPART.institutionnel)).toBeGreaterThanOrEqual(15);
    expect(Math.round(1 / DEPART.institutionnel)).toBeLessThanOrEqual(17);
    // « réduit d'environ un tiers », « divisent à peu près par trois », « d'un cinquième »
    expect(CLAUSES.facteur).toBe(0.7);
    expect(Math.round(1 / ACCOMPAGNEMENT.interesse)).toBe(3);
    expect(ACCOMPAGNEMENT.sansInteret).toBe(0.8);
    const clauses = source(3, "clauses", [2, 0, 2]);
    expect(clauses).toContain(`${CLAUSES.contrepartie / 1000} k€`);
    expect(clauses).toContain(`${ACCOMPAGNEMENT.parCompte / 1000} k€ par compte`);
    // « deux fois moins » de départs quand le cédant est payé au maintien de ses comptes
    expect(OFFRES[2]!.facteur).toBeGreaterThan(0.45);
    expect(OFFRES[2]!.facteur).toBeLessThan(0.6);
  });

  it("le gel de Lavaudière, le complément perdu et la trésorerie de l'été", () => {
    expect(k(PERTE_GEL)).toBe(84);
    expect(source(5, "lavaudiere", [2, 0, 2, 3, 1])).toContain(
      `les ${k(COMPTES[LAVAUDIERE]!.complement.equilibre)} k€ de complément`,
    );
    expect(source(5, "lavaudiere", [2, 0, 1, 3, 1])).toContain("soit 84 k€");
    const tresorerie = source(4, "tresorerie", [2, 0, 2, 3], 1);
    expect(tresorerie).toContain(`${k(TRESORERIE.seuil)} k€`);
    expect(tresorerie).toContain(`Payer ${ke(OFFRES[2]!.comptant)} sur la trésorerie`);
    // 1 300 k€ empruntés sur cinq ans à 4,2 % : environ 168 k€ d'intérêts, qu'Oswald voit « jetés ».
    expect(k(interetsDeLEmprunt(1300000))).toBe(168);
  });

  it("la revue dit en clair quels comptes tiennent à Wilfrid", () => {
    expect(conclusionsDeLaRevue(1)).toMatch(/^Herlinval Distribution tient à la personne/);
    expect(conclusionsDeLaRevue(6)).toMatch(
      /^Lavaudière Agroalimentaire et les Fonderies du Brivet tiennent/,
    );
    expect(conclusionsDeLaRevue(0)).toMatch(/Aucun/);
    expect(conclusionsDeLaRevue(7)).toMatch(/Les trois/);
  });

  it("la valeur de départ compte la part rachetée et le risque déjà là le jour de l'annonce", () => {
    const perte = COMPTES.reduce(
      (s, c) =>
        s +
        valeurDuCompte(c) *
          (c.chancePersonnel * DEPART.personnel + (1 - c.chancePersonnel) * DEPART.institutionnel),
      0,
    );
    expect(PERTE_SANS_RIEN).toBeCloseTo(perte, 6);
    expect(BASE).toBeCloseTo(VALEUR_DE_LA_PART + (1 - PACTE.part) * perte, 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : partir du pacte et lier le prix aux comptes bat son prix, le refus sec et l'attente", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
  });

  it("D2 : la revue des comptes bat le silence, et vaut plus quand l'accompagnement est ciblé", () => {
    const r = rejeu(MEILLEUR, D.revue);
    expect(classement(MEILLEUR, D.revue)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.revue);
      return x[0]!.attendu - x[2]!.attendu;
    };
    // Avec un accompagnement des trois comptes, savoir lesquels tiennent à lui sert bien moins.
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([2, 0, 2, 2, 1, 1]) + 20000);
  });

  it("D3 : le montage équilibré est le meilleur en moyenne, le maximal le plus sûr, son prix comptant le pire", () => {
    const r = rejeu(MEILLEUR, D.offre);
    const c = classement(MEILLEUR, D.offre);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.offre)).toBe(3);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(800000);
  });

  it("D3 : un montage proposé après avoir accordé son prix se paie en confiance perdue", () => {
    const avance = (c: readonly number[]) => {
      const r = rejeu(c, D.offre);
      return r[2]!.attendu - r[0]!.attendu;
    };
    // Promettre son prix en semaine 1, puis offrir un montage : Wilfrid se sent trahi.
    expect(avance(MEILLEUR)).toBeGreaterThan(avance([0, 0, 2, 3, 1, 1]) + 80000);
  });

  it("D4 : clauses et accompagnement ciblé battent la seule clause du pacte ; l'accompagnement vaut surtout avec un complément", () => {
    const r = rejeu(MEILLEUR, D.clauses);
    expect(classement(MEILLEUR, D.clauses)[0]).toBe(3);
    expect(classement(MEILLEUR, D.clauses).at(-1)).toBe(0);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(30000);
    const accompagnement = (c: readonly number[]) => {
      const x = rejeu(c, D.clauses);
      return x[3]!.attendu - x[1]!.attendu;
    };
    expect(accompagnement(MEILLEUR)).toBeGreaterThan(accompagnement([2, 0, 1, 3, 1, 1]) + 20000);
  });

  it("D5 : l'emprunt bat la trésorerie vidée et le rachat personnel ; les intérêts ne détruisent pas de valeur", () => {
    const r = rejeu(MEILLEUR, D.financement);
    expect(classement(MEILLEUR, D.financement)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(plusSure(MEILLEUR, D.financement)).toBe(1);
  });

  it("D6 : au signal de Lavaudière, réécrire le complément sur le maintien des comptes bat la signature telle quelle", () => {
    const r = rejeu(MEILLEUR, D.signature);
    expect(classement(MEILLEUR, D.signature)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(200000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(200000);
    // Sans complément de prix, il n'y a rien à réécrire : signer tel quel ne coûte rien.
    const sans = rejeu([2, 0, 1, 3, 1, 1], D.signature);
    expect(Math.abs(sans[1]!.attendu - sans[0]!.attendu)).toBeLessThan(1);
  });

  it("la bonne méthode bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(1000000);
    expect(bonne! - attentiste!).toBeGreaterThan(300000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_SORTIE_ASSOCIE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
      const autre = [...MEILLEUR];
      autre[d] = o;
      expect(mesurerDecision(EPISODE_SORTIE_ASSOCIE, autre, d, JOURS).bonne, `D${d + 1}`).toBe(
        false,
      );
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });

  it("Halden multiplie le risque de chaque compte, et la revue aide à défendre ceux qui tenaient à lui", () => {
    expect(HALDEN.facteur).toBeGreaterThan(2);
    expect(HALDEN.defense).toBeLessThan(1);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["comptes", "pacte"],
      ["dependance"],
      ["offres"],
      ["clauses"],
      ["tresorerie"],
      ["lavaudiere"],
    ],
    jours: JOURS,
    diagnostic: "montage",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1867,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SORTIE_ASSOCIE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de sécuriser la valeur par le montage", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SORTIE_ASSOCIE.comportements(
      p,
      analyser(EPISODE_SORTIE_ASSOCIE, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_SORTIE_ASSOCIE.axe(c).titre).toBe(
      "Sécuriser la valeur par le montage, pas par la paix",
    );
  });

  it("à qui a décidé sans enquêter, propose de faire le calcul du pacte avant de répondre", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SORTIE_ASSOCIE.comportements(
      p,
      analyser(EPISODE_SORTIE_ASSOCIE, p).trimestre,
    );
    expect(EPISODE_SORTIE_ASSOCIE.axe(c).titre).toBe("Faire le calcul du pacte avant de répondre");
  });

  it("juge le prix du pacte calculé en semaine 1 : juste, proche, ou faute d'un retraitement", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_SORTIE_ASSOCIE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(1867)).toBe(1);
    expect(score(1910)).toBe(0.6);
    // Sans déduire la dette nette : 6 × 2 200 × 18 % × 85 % ≈ 2 020 k€.
    expect(score(2020)).toBe(0);
    // Sans la décote de minorité : 2 196 k€.
    expect(score(k(VALEUR_DE_LA_PART))).toBe(0);
  });

  it("dit le diagnostic juste, proche ou faux", () => {
    const score = (diagnostic: string) =>
      EPISODE_SORTIE_ASSOCIE.comportements(
        partie(MEILLEUR, { diagnostic }),
        simuler(MEILLEUR, 11),
      )[1]!.score;
    expect(score("montage")).toBe(1);
    expect(score("prix")).toBe(0.6);
    expect(score("conflit")).toBe(0);
    expect(score("financement")).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_SORTIE_ASSOCIE.bilan.titre(simuler(MEILLEUR, 1, JOURS))).toMatch(/valeur créée/);
    expect(EPISODE_SORTIE_ASSOCIE.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
