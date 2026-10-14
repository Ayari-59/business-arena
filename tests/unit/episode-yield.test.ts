import { describe, expect, it } from "vitest";
import {
  ALLOTEMENT,
  ANNULATIONS,
  BRENVAL,
  BUDGET_TRIMESTRE,
  CHAMBRES,
  COMMISSION,
  COMPARENT,
  COUT_DIRECT,
  D,
  DEPLACEMENT_BRENVAL,
  ELASTICITE,
  IMPREVUS,
  NET_PONT,
  NUITS,
  PART_PLATEFORMES,
  PERTE_PONTS,
  PLAFOND,
  PRIX,
  SCENARIOS,
  VENTE_FLASH,
  bookaliaSanctionne,
  brenvalAccepte,
  carnetDeDepart,
  carnetDepartTotal,
  chambresAllouees,
  chiffresAllotement,
  hasard,
  meerlandAttend,
  simuler,
  valeurDeLEte,
} from "../../src/engine/episodes/chambres-bradees";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  REFERENCES,
  REFLEXES,
  ecart,
  kESigne,
} from "../../src/config/episodes/chambres-bradees";
import { euros, nombre } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_YIELD, PERTE_PONTS_KE } from "../../src/pedagogy/episodes/chambres-bradees";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les chambres qu'on brade » enseigne trois choses : une baisse
 * générale sur les plateformes paie surtout des clients qui seraient venus,
 * et 17 % de commission en plus ; un retard de pick-up se lit segment par
 * segment et canal par canal, et des restrictions valent mieux qu'une baisse ;
 * le canal direct se construit lentement, parité respectée. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [2, 2, 1, 3, 1, 1];
const REFLEXE = [0, 0, 0, 0, 2, 0];
const ATTENTISTE = [3, 1, 3, 1, 0, 3];
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
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[] = [], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_YIELD.contexte(
    EPISODE_YIELD.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de L'Escale Lac", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    // Les deux premières semaines ne dépendent que de la première décision.
    expect(simuler(MEILLEUR, 12).semaines[2]!.net).toBeCloseTo(
      simuler([2, 0, 0, 0, 2, 0], 12).semaines[2]!.net,
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

  it("les trente tirages représentent les trois étés à peu près dans leurs proportions", () => {
    const parEte = SCENARIOS.map(
      (_, s) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length,
    );
    SCENARIOS.forEach((sc, s) => {
      expect(Math.abs(parEte[s]! / GRAINES_DU_BILAN.length - sc.chance)).toBeLessThan(0.07);
    });
  });

  it("Brenval, Meerland et Bookalia répondent au hasard, et seulement à ce qu'on leur a proposé", () => {
    const issues = (f: (g: number) => boolean) => new Set(GRAINES_DU_BILAN.map(f));
    expect(issues(brenvalAccepte).size).toBe(2);
    expect(issues(meerlandAttend).size).toBe(2);
    expect(issues((g) => bookaliaSanctionne([2, 2, 2], g)).size).toBe(2);
    for (const g of GRAINES_DU_BILAN) {
      expect(bookaliaSanctionne(MEILLEUR, g)).toBe(false);
      expect(simuler([2, 1], g).groupe).toBeNull();
      expect(simuler([2, 0], g).groupe).toBe("pont");
      expect(chambresAllouees([2, 2, 1, 0], g)).toBe(ALLOTEMENT.chambres);
      expect(chambresAllouees([2, 2, 1, 1], g)).toBe(0);
    }
    // L'analyse ne fait signer que si Meerland a attendu, et selon l'été.
    for (const g of GRAINES_DU_BILAN) {
      const signees = chambresAllouees(MEILLEUR, g);
      if (!meerlandAttend(g)) expect(signees).toBe(0);
      else expect(signees).toBe([0, 6, 12][hasard(g).scenario]);
    }
  });

  it("baisser sur les plateformes fait monter le taux d'occupation, et baisser le prix moyen, le RevPAR et le revenu net", () => {
    const moy = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      moyenne(GRAINES_DU_BILAN.map((g) => f(simuler(c, g))));
    const baisse = [0, ...MEILLEUR.slice(1)];
    expect(moy(baisse, (t) => t.to)).toBeGreaterThan(moy(MEILLEUR, (t) => t.to));
    expect(moy(baisse, (t) => t.pm)).toBeLessThan(moy(MEILLEUR, (t) => t.pm) - 10);
    expect(moy(baisse, (t) => t.revpar)).toBeLessThan(moy(MEILLEUR, (t) => t.revpar));
    expect(moy(baisse, (t) => t.revenuTrimestre)).toBeLessThan(
      moy(MEILLEUR, (t) => t.revenuTrimestre) - 40000,
    );
    // Les clients du site passent par les plateformes : la part directe s'effondre.
    expect(moy(baisse, (t) => t.partDirecte)).toBeLessThan(0.3);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g);
        expect(t.to).toBeGreaterThan(0.6);
        expect(t.to).toBeLessThan(0.8);
        expect(t.revpar).toBeGreaterThan(105);
        expect(t.revpar).toBeLessThan(145);
        expect(t.toEte).toBeGreaterThan(0.78);
        expect(t.toEte).toBeLessThan(0.99);
        for (let w = 1; w <= 13; w += 1) {
          expect(t.semaines[w]!.revpar).toBeGreaterThan(50);
          expect(t.semaines[w]!.revpar).toBeLessThan(200);
        }
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la perte nette sur les ponts que demande la semaine 1, et ce que rapporte une nuitée par canal", () => {
    const aLaMain = 12 * 84 * 0.92 * 0.55 * 262 * 0.15 * (1 - 0.17);
    expect(NUITS.pont.reduce((s, x) => s + x, 0)).toBe(12);
    expect(PERTE_PONTS).toBeCloseTo(aLaMain, 6);
    expect(PERTE_PONTS_KE).toBeCloseTo(16.64, 2);
    expect(EPISODE_YIELD.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(PERTE_PONTS / 1000, 9);
    const pickup = source(0, "pickup");
    expect(pickup).toContain(`${Math.round(PLAFOND.pont * 100)} % d'occupation`);
    expect(pickup).toContain(euros(PRIX.pont));
    const canaux = source(0, "canaux");
    expect(canaux).toContain(`${Math.round(PART_PLATEFORMES.pont * 100)} % des nuitées`);
    expect(canaux).toContain(`${Math.round(COMMISSION * 100)} % de commission`);
    expect(canaux).toContain(euros(PRIX.pont * (1 - COMMISSION)));
    expect(canaux).toContain(euros(PRIX.pont * (1 - COUT_DIRECT)));
    expect(euros(PRIX.pont * (1 - COMMISSION))).toBe("217 €");
  });

  it("le pick-up par segment : les ponts en avance, l'écart dans les groupes", () => {
    const pickup = source(0, "pickup");
    for (const seg of ["pont", "weekend", "semaine", "groupes"] as const) {
      const c = carnetDeDepart(seg);
      expect(pickup).toMatch(
        new RegExp(`${nombre(c.cette, 0)} (nuitées )?contre ${nombre(c.derniere, 0)}`),
      );
      expect(pickup).toContain(ecart(c.ecart));
    }
    expect(carnetDeDepart("pont").ecart).toBeGreaterThan(0.05);
    expect(carnetDeDepart("groupes").derniere - carnetDeDepart("groupes").cette).toBe(210);
    // Le rapport de Hostéo du premier lundi est le total des quatre segments.
    const total = carnetDepartTotal();
    const hosteo = ETAPES[0]!.messages(
      EPISODE_YIELD.contexte(EPISODE_YIELD.lire([], 3, 0, 0), []),
    )[0]!.texte;
    expect(hosteo).toContain(`${nombre(total.cette, 0)} nuitées, ${ecart(total.ecart)}`);
    expect(total.ecart).toBeLessThan(-0.08);
  });

  it("le coût de déplacement du groupe Brenval sur le pont de l'Ascension", () => {
    const net = 262 * (0.55 * 0.83 + 0.45 * 0.97);
    expect(NET_PONT).toBeCloseTo(net, 6);
    expect(DEPLACEMENT_BRENVAL).toBeCloseTo(36 * 3 * (net - 145), 6);
    const texte = source(1, "ascension", [2]);
    expect(texte).toContain(`${euros(NET_PONT)} net`);
    expect(texte).toContain(`${euros(NET_PONT - BRENVAL.prix)} de moins par nuitée`);
    expect(texte).toContain(`${nombre(DEPLACEMENT_BRENVAL / 1000)} k€`);
  });

  it("l'allotement de Meerland, été par été, est celui que la source chiffre", () => {
    const texte = source(3, "allotement", [2, 2, 1]);
    for (const chambres of [12, 6]) {
      const c = chiffresAllotement(chambres);
      SCENARIOS.forEach((_, s) => {
        const v = valeurDeLEte([3, 1, 3, 1, 0, 3], 1, chambres, s).net;
        const sans = valeurDeLEte([3, 1, 3, 1, 0, 3], 1, 0, s).net;
        expect(c.parScenario[s]).toBeCloseTo(v - sans, 6);
        expect(texte).toContain(kESigne(c.parScenario[s]!));
      });
      expect(c.esperance).toBeCloseTo(
        SCENARIOS.reduce((a, sc, s) => a + sc.chance * c.parScenario[s]!, 0),
        6,
      );
      expect(texte).toContain(`${kESigne(c.esperance)} en moyenne`);
    }
    // Signer tout l'allotement est un pari perdant en moyenne ; il ne gagne que dans un été creux.
    const douze = chiffresAllotement(12);
    expect(douze.esperance).toBeLessThan(-15000);
    expect(douze.parScenario[2]).toBeGreaterThan(50000);
  });

  it("la vente flash d'Annemasse, refaite sur nos nuits de semaine : plus de nuitées, moins de revenu net", () => {
    const p = PART_PLATEFORMES.semaine;
    const perte = ANNULATIONS.taux * ANNULATIONS.nonRevendues;
    const plateformes = p * (1 - VENTE_FLASH) ** ELASTICITE.semaine + (1 - p) * COMPARENT;
    const site = (1 - p) * (1 - COMPARENT);
    const avant = p * (1 - perte) * 0.83 + (1 - p) * 0.97;
    const apres = plateformes * (1 - perte) * 0.75 * 0.83 + site * 0.97;
    const texte = source(5, "flash", [2, 2, 1, 3, 1]);
    expect(texte).toContain(`${ecart(plateformes + site - 1, 0)} de nuitées`);
    expect(texte).toContain(`${ecart(apres / avant - 1)} de revenu net`);
    expect(plateformes + site - 1).toBeGreaterThan(0.25);
    expect(apres / avant - 1).toBeLessThan(0);
  });

  it("le tarif membre : 11 % de plus par nuitée qui quitte les plateformes", () => {
    expect(source(2, "membre", [2, 2])).toContain("rapporte 11 % de plus");
    expect((0.95 * 0.97) / 0.83 - 1).toBeCloseTo(0.11, 2);
    expect(source(2, "membre", [0, 2])).toMatch(/resterait plus cher/);
    expect(source(2, "membre", [2, 2])).not.toMatch(/resterait plus cher/);
    expect(CHAMBRES).toBe(84);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : les restrictions battent nettement la baisse sur les plateformes, la baisse générale et l'attente", () => {
    const r = rejeu(MEILLEUR, D.pickup);
    expect(classement(MEILLEUR, D.pickup)).toEqual([2, 3, 1, 0]);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : proposer les nuits de semaine bat le refus ; signer sur le pont plein est le pire", () => {
    const r = rejeu(MEILLEUR, D.groupe);
    expect(classement(MEILLEUR, D.groupe)).toEqual([2, 1, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(DEPLACEMENT_BRENVAL / 2);
  });

  it("D3 : le tarif membre en parité bat Préférence ; un site moins cher que Bookalia est le pire", () => {
    const r = rejeu(MEILLEUR, D.direct);
    expect(classement(MEILLEUR, D.direct)[0]).toBe(1);
    expect(classement(MEILLEUR, D.direct).at(-1)).toBe(2);
    // Préférence fait pire que ne rien changer : trois points payés sur des clients acquis.
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D4 : s'informer avant de répondre est le meilleur en moyenne ; signer l'allotement protège mais coûte cher", () => {
    const r = rejeu(MEILLEUR, D.allotement);
    expect(classement(MEILLEUR, D.allotement)[0]).toBe(3);
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    // L'espérance et la robustesse s'opposent : la meilleure option n'est pas la plus sûre.
    expect(plusSure(MEILLEUR, D.allotement)).not.toBe(3);
    expect(r[3]!.p10).toBeLessThan(Math.max(r[0]!.p10, r[2]!.p10));
  });

  it("D5 : au signal de fin mai, revoir l'été date par date bat la grille tenue et l'offre « Réservez tôt »", () => {
    const r = rejeu(MEILLEUR, D.ete);
    expect(classement(MEILLEUR, D.ete)[0]).toBe(1);
    expect(classement(MEILLEUR, D.ete).at(-1)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(60000);
  });

  it("D6 : l'offre réservée aux clients bat la vente flash, et vaut bien plus avec un fichier de membres", () => {
    const r = rejeu(MEILLEUR, D.juin);
    expect(classement(MEILLEUR, D.juin)[0]).toBe(1);
    expect(classement(MEILLEUR, D.juin).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(12000);
    // L'interaction avec la décision 3 : sans tarif membre, l'offre ne touche presque personne.
    const gain = (d3: number) => {
      const avec = [2, 2, d3, 3, 1, 1];
      const sans = [2, 2, d3, 3, 1, 3];
      return attendu(avec) - attendu(sans);
    };
    expect(gain(1)).toBeGreaterThan(gain(3) + 6000);
    expect(classement([2, 2, 3, 3, 1, 1], D.juin)[0]).toBe(2);
  });

  it("la bonne méthode bat nettement le réflexe de baisser et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(150000);
    expect(bonne! - attentiste!).toBeGreaterThan(50000);
    expect(attentiste! - reflexe!).toBeGreaterThan(50000);
    expect(
      GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).revenuTrimestre >= BUDGET_TRIMESTRE)
        .length,
    ).toBeGreaterThan(25);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni pris par la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      const m = mesurerDecision(EPISODE_YIELD, chemin, d, JOURS);
      expect(m.bonne, `D${d + 1} option ${o}`).toBe(false);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(SEUIL_QUALITE);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
    expect(
      REFERENCES[1].chemin.every((o, d) => REFLEXES.some(([x, y]) => x === d && y === o)),
    ).toBe(true);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["pickup", "canaux"],
      ["ascension"],
      ["origine", "membre"],
      ["etes", "allotement"],
      ["marches"],
      ["flash", "fichier"],
    ],
    jours: JOURS,
    diagnostic: "segments",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 16.6,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_YIELD, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a baissé à chaque décision, propose de piloter le revenu net plutôt que l'occupation", () => {
    const p = partie(REFLEXE, { diagnostic: "prix" });
    const c = EPISODE_YIELD.comportements(p, analyser(EPISODE_YIELD, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_YIELD.axe(c).titre).toBe("Piloter le revenu net, pas le taux d'occupation");
  });

  it("à qui a décidé sans enquêter, propose de lire le pick-up avant de toucher au prix", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_YIELD.comportements(p, analyser(EPISODE_YIELD, p).trimestre);
    expect(EPISODE_YIELD.axe(c).titre).toBe("Lire le pick-up avant de toucher au prix");
  });

  it("juge le calcul de la perte sur les ponts : juste, proche, ou oublieux de la commission", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (prevision: number) =>
      EPISODE_YIELD.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(16.6)).toBe(1);
    expect(score(18.5)).toBe(0.6);
    // Sans déduire la commission qu'on ne paie plus : 20,0 k€.
    expect(score(20)).toBe(0);
  });

  it("dit le résultat en revenu net, été compris, et en écart au budget", () => {
    expect(EPISODE_YIELD.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /revenu hébergement net, été compris : \+/,
    );
    expect(EPISODE_YIELD.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/: −\d/);
  });
});
