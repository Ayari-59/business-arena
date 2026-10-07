import { describe, expect, it } from "vitest";
import {
  CONVENTION,
  D,
  DEMANDES,
  DEPLACEMENT_MAI,
  DEPLACEMENT_SEMINAIRE,
  DINER_PAR_NUITEE,
  IMPREVUS,
  NUITEES_EVINCEES,
  NUITEES_EVINCEES_MAI,
  NUITS_SERIE,
  SCENARIOS,
  SERIE,
  contributionConvention,
  contributionSeminaire,
  deplacementPrevu,
  hasard,
  plancher,
  reponseSeminaire,
  simuler,
  statutConvention,
  valeurDeLaSerie,
  valeurIndividuelle,
} from "../../src/engine/episodes/seminaire-qui-evince";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/seminaire-qui-evince";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  BUDGET,
  DEPLACEMENT_EN_KE,
  EPISODE_SEMINAIRE,
} from "../../src/pedagogy/episodes/seminaire-qui-evince";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le séminaire qui chasse les clients » enseigne trois choses :
 * un groupe se juge sur sa contribution totale moins celle des clients
 * individuels qu'il évince (le même séminaire vaut peu en juin et beaucoup
 * sur des dates creuses) ; un groupe réserve plus qu'il n'occupe, et seules
 * des clauses — date limite de libération, attrition, acompte — et la
 * reprise rapide des chambres annoncées libres empêchent la chambre
 * périssable de rester vide ; les salles et la restauration n'ont pas la
 * marge des chambres. Ces tests verrouillent les classements qui le disent,
 * et recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 1, 0, 0, 0];
const ATTENTISTE = [3, 0, 0, 2, 0, 2];
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
/** Le contexte d'une étape, tel que le joueur la lit avec les décisions déjà prises. */
const contexte = (etape: number, decisions: readonly number[], graine = 3): Contexte => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  return EPISODE_SEMINAIRE.contexte(
    EPISODE_SEMINAIRE.lire(decisions, graine, 0, semaine),
    decisions,
  );
};
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string"
    ? s.resultat
    : s.resultat(contexte(etape, decisions, graine));
};

describe("le modèle de L'Escale Évian", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    // Les semaines que les groupes ne touchent pas sont les mêmes, quoi qu'on décide.
    expect(simuler(MEILLEUR, 12).semaines[2]!.contribution).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[2]!.contribution,
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

  it("les trois étés tombent ; Orvandel répond au hasard aux contre-propositions", () => {
    const parEte = SCENARIOS.map(
      (_, s) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length,
    );
    expect(parEte.every((n) => n > 0)).toBe(true);
    for (const g of GRAINES_DU_BILAN) {
      expect(reponseSeminaire(0, g)).toBe("juin");
      expect(reponseSeminaire(3, g)).toBe("decline");
    }
    const issues = new Set(GRAINES_DU_BILAN.map((g) => reponseSeminaire(1, g)));
    expect([...issues].sort()).toEqual(["ailleurs", "juinPrixPlein", "mai"]);
    const reduit = new Set(GRAINES_DU_BILAN.map((g) => statutConvention([0, 0, 2], g)));
    expect([...reduit].sort()).toEqual(["ailleurs", "reduite"]);
  });

  it("le séminaire laisse des chambres vides ; sans clause ni reprise, elles restent vides", () => {
    const vides = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).vides));
    expect(vides(ATTENTISTE)).toBe(0);
    expect(vides(REFLEXE)).toBeGreaterThan(2 * vides(MEILLEUR));
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la valeur des individuels que le séminaire évince, que la semaine 1 demande, se pose nuit par nuit", () => {
    // 58, 61 et 57 chambres prévues ; le séminaire en laisse 11 : 47 + 50 + 46 nuitées évincées.
    expect(NUITEES_EVINCEES).toBe(143);
    const parNuitee = 232 - 232 * 0.45 * 0.17 - 30 + 0.45 * 2 * 42 * 0.65;
    expect(valeurIndividuelle(232)).toBeCloseTo(parNuitee, 9);
    expect(DINER_PAR_NUITEE).toBeCloseTo(24.57, 9);
    expect(DEPLACEMENT_SEMINAIRE).toBeCloseTo(143 * parNuitee, 6);
    expect(DEPLACEMENT_EN_KE).toBeCloseTo(29.86, 2);
    expect(EPISODE_SEMINAIRE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(29.86, 2);
    const prevision = source(0, "prevision", []);
    expect(prevision).toContain("58 chambres le mardi 16 juin, 61 le mercredi 17, 57 le jeudi 18");
    expect(prevision).toContain("à 232 € de prix moyen");
    expect(prevision).toContain("30, 34 et 31 chambres seulement, à 178 €");
    expect(prevision).toContain("45 % des nuitées individuelles");
    expect(prevision).toContain("17 % de commission");
    const marges = source(0, "marges", []);
    expect(marges).toContain("Une nuitée occupée coûte 30 €");
    expect(marges).toContain("ticket moyen de 42 €");
    expect(marges).toContain("65 % de marge");
    // Fin mai, le même séminaire n'évince que 62 nuitées, à 178 € : trois fois moins.
    expect(NUITEES_EVINCEES_MAI).toBe(19 + 23 + 20);
    expect(DEPLACEMENT_MAI).toBeLessThan(DEPLACEMENT_SEMINAIRE / 3);
    // Plein, le séminaire rapporte à peine plus qu'il ne chasse ; occupé à 78 %, bien moins.
    // À 228 €, il couvre ce qu'il chasse même s'il n'occupe que les trois quarts de son bloc.
    expect(contributionSeminaire().total).toBeGreaterThan(DEPLACEMENT_SEMINAIRE);
    expect(contributionSeminaire(158, 0.78).total).toBeLessThan(DEPLACEMENT_SEMINAIRE - 4000);
    expect(contributionSeminaire(228, 0.75).total).toBeGreaterThan(DEPLACEMENT_SEMINAIRE);
  });

  it("la convention Mélizane : ses chambres valent moins que ce qu'elles chassent, ses salles et son gala font la différence", () => {
    const deplacement = deplacementPrevu(CONVENTION.nuits, CONVENTION.chambres);
    expect(deplacement).toBeCloseTo((22 + 24 + 26) * valeurIndividuelle(258), 6);
    const c = contributionConvention("complete");
    expect(c.chambres).toBeCloseTo(90 * (145 - 30), 6);
    expect(c.salle).toBeCloseTo(2 * 2800 * 0.9, 6);
    expect(c.gala).toBeCloseTo(140 * 89 * (1 - 0.32 - 0.05) - 6 * 190, 6);
    const chiffrage = source(2, "chiffrage", [1, 1]);
    expect(chiffrage).toContain(`soit ${k(deplacement)} k€ de marge`);
    expect(chiffrage).toContain(`rapporteraient ${k(c.chambres)} k€`);
    expect(c.chambres).toBeLessThan(deplacement - 5000);
    expect(c.total - deplacement).toBeGreaterThan(4000);
  });

  it("la série de Tavenne : ce qu'elle vaut selon l'été est ce que Lucile annonce", () => {
    const nuitees = NUITS_SERIE.length * SERIE.chambres * SERIE.occupation;
    expect(NUITS_SERIE.length * SERIE.chambres).toBe(504);
    const marge = nuitees * (175 - 30) + NUITS_SERIE.length * 45 * 0.95 * 32 * 0.6;
    for (const s of [0, 1, 2]) {
      expect(valeurDeLaSerie(s)).toBeCloseTo(
        marge - deplacementPrevu(NUITS_SERIE, SERIE.chambres, s),
        6,
      );
    }
    const pickup = source(3, "pickup", [1, 1, 1]);
    expect(pickup).toContain(`rapporterait ${k(valeurDeLaSerie(2))} k€ si l'été est mou`);
    expect(pickup).toContain(`coûterait ${-k(valeurDeLaSerie(1))} k€ s'il est conforme`);
    expect(pickup).toContain(`${-k(valeurDeLaSerie(0))} k€ s'il est fort`);
    expect(valeurDeLaSerie(2)).toBeGreaterThan(10000);
    expect(valeurDeLaSerie(1)).toBeLessThan(-5000);
  });

  it("le prix de déplacement des demandes de juillet est celui que la source donne", () => {
    // Le club de cyclotourisme : dimanche 12 (54 chambres prévues) et lundi 13 juillet (58), 18 chambres.
    const v = valeurIndividuelle(258);
    const cyclo = 30 + ((54 - 48 + (58 - 48)) * v - 34 * 2 * 19.2) / 36;
    expect(plancher(0)).toBeCloseTo(cyclo, 6);
    const planchers = source(5, "planchers", [1, 1, 1, 2, 1]);
    DEMANDES.forEach((g, i) =>
      expect(planchers).toContain(`${Math.round(plancher(i))} € (il propose ${g.prix} €)`),
    );
    // Avec la série de Tavenne déjà signée, les mêmes nuits coûtent plus cher.
    expect(plancher(0, true)).toBeGreaterThan(plancher(0) + 50);
    // La chorale et l'entreprise lyonnaise ne couvrent pas leur déplacement ; les autres, si.
    expect(DEMANDES.map((g, i) => g.prix >= plancher(i))).toEqual([true, true, false, true, false]);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : proposer les dates creuses, ou juin au prix du déplacement, bat le séminaire de juin au prix demandé", () => {
    const r = rejeu(MEILLEUR, D.seminaire);
    expect(classement(MEILLEUR, D.seminaire)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
  });

  it("D2 : les trois clauses battent le contrat type et la garantie totale ; signé en juin au prix demandé, la garantie qui fait fuir le client devient la meilleure", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)).toEqual([1, 0, 2]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2000);
    expect(classement(REFLEXE, D.contrat)[0]).toBe(2);
  });

  it("D3 : la convention entière bat le refus sur le prix chambre ; sans clauses ni reprise des chambres, elle ne vaut presque plus rien", () => {
    const r = rejeu(MEILLEUR, D.convention);
    expect(classement(MEILLEUR, D.convention)[0]).toBe(1);
    expect(classement(MEILLEUR, D.convention).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    // Le gala et la salle font la différence : sans le gala, la convention vaut bien moins.
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(2500);
    const sansProtection = [1, 0, 1, 1, 0, 1];
    const s = rejeu(sansProtection, D.convention);
    expect(s[1]!.attendu - s[0]!.attendu).toBeLessThan(2000);
    expect(classement(sansProtection, D.convention)[0]).not.toBe(1);
  });

  it("D4 : lire le pick-up avant de signer la série est le meilleur choix en moyenne ; la signer tout de suite est le plus sûr, mais coûte cher", () => {
    const r = rejeu(MEILLEUR, D.serie);
    expect(classement(MEILLEUR, D.serie)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(plusSure(MEILLEUR, D.serie)).toBe(0);
  });

  it("D5 : au signal, reprendre les chambres tout de suite bat le bloc tenu, d'autant plus que le contrat ne protège pas", () => {
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.signal);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(classement(MEILLEUR, D.signal)).toEqual([1, 2, 0]);
    expect(gain(MEILLEUR)).toBeGreaterThan(2500);
    expect(gain([1, 0, 1, 1, 1, 1])).toBeGreaterThan(gain(MEILLEUR) + 1500);
    expect(gain([1, 2, 1, 1, 1, 1])).toBeLessThan(gain(MEILLEUR));
  });

  it("D6 : coter chaque demande à son prix de déplacement bat la grille unique et la fermeture", () => {
    const r = rejeu(MEILLEUR, D.grille);
    expect(classement(MEILLEUR, D.grille)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(6000);
  });

  it("la bonne méthode bat nettement le remplissage et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(25000);
    expect(bonne! - attentiste!).toBeGreaterThan(20000);
    expect(bonne!).toBeGreaterThan(BUDGET);
    expect(attentiste!).toBeLessThan(BUDGET);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_SEMINAIRE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["prevision", "marges"],
      ["clauses"],
      ["chiffrage"],
      ["pickup"],
      ["revente"],
      ["planchers"],
    ],
    jours: JOURS,
    diagnostic: "deplacement",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 30,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SEMINAIRE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a voulu remplir l'hôtel, propose de juger un groupe sur sa contribution nette", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SEMINAIRE.comportements(p, analyser(EPISODE_SEMINAIRE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SEMINAIRE.axe(c).titre).toBe("Juger un groupe sur sa contribution nette");
  });

  it("à qui a décidé sans enquêter, propose de compter les clients que le groupe chasse", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SEMINAIRE.comportements(p, analyser(EPISODE_SEMINAIRE, p).trimestre);
    expect(EPISODE_SEMINAIRE.axe(c).titre).toBe("Compter les clients que le groupe chasse");
  });

  it("juge le déplacement calculé en semaine 1 : juste, proche, ou faute d'avoir compté nuit par nuit", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_SEMINAIRE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(29.9)).toBe(1);
    // Sans les dîners : 143 nuitées à 184 €, 26,3 k€.
    expect(score(26.3)).toBe(0.6);
    // Les 165 nuitées du séminaire au lieu des 143 évincées : 34,5 k€.
    expect(score(34.5)).toBe(0);
    // Le chiffre d'affaires des chambres et des dîners, sans marge : 38,6 k€.
    expect(score(38.6)).toBe(0);
  });

  it("dit le résultat face au budget", () => {
    const bonne = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g)).find(
      (t) => t.objectif >= BUDGET,
    )!;
    expect(EPISODE_SEMINAIRE.bilan.titre(bonne)).toMatch(/au-dessus du budget/);
    const faible = GRAINES_DU_BILAN.map((g) => simuler(REFLEXE, g)).find(
      (t) => t.objectif < BUDGET,
    )!;
    expect(EPISODE_SEMINAIRE.bilan.titre(faible)).toMatch(/sous le budget/);
  });
});
