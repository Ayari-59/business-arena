import { describe, expect, it } from "vitest";
import {
  CHUTE_SIGNATURES,
  COUTS,
  COUVERTS_PAR_POINT,
  D,
  ECONOMIE_PREVUE,
  FAMILLES,
  FRAIS_FIXES,
  FRAIS_FIXES_ANNUELS,
  FRAIS_FIXES_SEMAINE,
  GAIN_PETITS_DEJEUNERS,
  IMPREVUS,
  MONTEE,
  NOTE_DEPART,
  PAIN_CORRIGE,
  PAIN_DU_SOIR,
  PETITS_DEJEUNERS,
  RESTAURANTS,
  R,
  economieDeFamille,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/cuisine-centrale";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/cuisine-centrale";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import {
  ECONOMIE_PREVUE_EN_KE,
  EPISODE_CUISINE_CENTRALE,
} from "../../src/pedagogy/episodes/cuisine-centrale";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La cuisine centrale qu'on n'attendait pas » enseigne qu'une
 * mutualisation se conduit avec ceux qui la vivent : l'économie d'un
 * laboratoire ne vient que de ce que les cuisines lui commandent vraiment ;
 * mutualiser les bases ne se voit pas, mutualiser les desserts signatures
 * coûte des couverts ; un pilote révèle les défauts à petit coût ; un chef
 * clé part selon la manière dont on l'a associé. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres que
 * les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 0, 1, 1];
const REFLEXE = [0, 0, 0, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 1, 3, 2];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[] = [], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_CUISINE_CENTRALE.contexte(
    EPISODE_CUISINE_CENTRALE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const k = (v: number) => Math.round(v / 1000);
const pourcent = (v: number) => Math.round(v * 100);
/** Un nombre écrit comme dans les textes : « 1 200 », avec une espace simple. */
const fr = (v: number) => v.toLocaleString("fr-FR").replace(/\s/g, " ");

describe("le modèle du laboratoire de Seynod", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    // Avant la bascule de la semaine 3, deux chemins au même périmètre ont la même semaine 2.
    expect(simuler(MEILLEUR, 12).semaines[2]!.note).toBeCloseTo(
      simuler([1, 0, 0, 1, 0, 0], 12).semaines[2]!.note,
      9,
    );
    expect(hasard(12)).toBe(hasard(12));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const n = hasard(g).imprevus.length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(2);
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

  it("le laboratoire coûte ses frais fixes même quand il ne livre rien", () => {
    const t = simuler([3, 3, 3, 1, 3, 2], 1);
    expect(t.fraisFixes).toBeCloseTo((FRAIS_FIXES_ANNUELS * 13) / 52, 6);
    expect(t.semaines[2]!.economie).toBeCloseTo(-2 * FRAIS_FIXES_SEMAINE, 6);
  });

  it("imposer fait refaire sur place, et l'économie s'évapore ; associer les chefs la garde", () => {
    const meilleur = simuler(MEILLEUR, 3, JOURS);
    const reflexe = simuler(REFLEXE, 3, JOURS);
    expect(meilleur.refaitsFinal).toBeLessThan(0.15);
    expect(reflexe.refaitsFinal).toBeGreaterThan(0.5);
    expect(reflexe.contournements).toBeGreaterThan(10000);
    expect(meilleur.contournements).toBe(0);
  });

  it("les desserts signatures font baisser la note ; les bases ne se voient presque pas", () => {
    const bases = moyenne(GRAINES_DU_BILAN.map((g) => simuler([1, 1, 2, 1, 1, 2], g).noteFinale));
    const signatures = moyenne(
      GRAINES_DU_BILAN.map((g) => simuler([0, 1, 2, 1, 1, 2], g).noteFinale),
    );
    expect(bases).toBeGreaterThan(4.4);
    expect(bases - signatures).toBeGreaterThan(0.15);
  });

  it("Séraphin part selon la manière dont on l'a associé", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).ignacePart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(REFLEXE)).toBeGreaterThan(20);
    expect(risqueDeDepart(0.4)).toBe(0);
    expect(risqueDeDepart(1)).toBeCloseTo(0.85, 6);
  });
});

describe("ce que les sources affichent, recalculé depuis le modèle", () => {
  it("le dossier : quatre familles, les frais fixes, et l'économie que la prévision demande", () => {
    const texte = source(0, "dossier");
    for (const f of FAMILLES) {
      expect(texte).toContain(`${k(f.actuel)} k€ puis ${k(f.labo)} k€`);
    }
    expect(texte).toContain(`camion frigorifique et chauffeur ${k(FRAIS_FIXES.camion)} k€`);
    expect(texte).toContain(`énergie et entretien ${k(FRAIS_FIXES.energie)} k€`);
    expect(texte).toContain(`analyses microbiologiques ${k(FRAIS_FIXES.analyses)} k€`);
    const total = FAMILLES.reduce((s, _, f) => s + economieDeFamille(f), 0);
    expect(texte).toContain(`${k(total)} k€ présenté au comité`);
    expect(ECONOMIE_PREVUE).toBe(total - FRAIS_FIXES_ANNUELS);
    expect(ECONOMIE_PREVUE_EN_KE).toBe(264);
    expect(EPISODE_CUISINE_CENTRALE.prevision.reel(simuler(MEILLEUR, 1))).toBe(264);
  });

  it("les avis : ce qu'un dessert sorti d'un fournisseur a coûté à L'Escale Lac", () => {
    const texte = source(0, "avis");
    const avant = 4.5;
    const apres = (avant - CHUTE_SIGNATURES).toLocaleString("fr-FR");
    expect(texte).toContain(`de 4,5 à ${apres}`);
    expect(texte).toContain(`baissé de ${pourcent(CHUTE_SIGNATURES * COUVERTS_PAR_POINT)} %`);
  });

  it("la montée en cadence, et le poids des Tables dans le volume du dossier", () => {
    const texte = source(1, "cadence", [1]);
    expect(texte).toContain(`on fera ${pourcent(MONTEE[0])} % du volume du dossier`);
    expect(texte).toContain(
      `puis ${MONTEE.slice(1, 5)
        .map((x) => `${pourcent(x)} %`)
        .join(", ")}`,
    );
    // Le laboratoire suit les cinq Tables à sa sixième semaine.
    expect(MONTEE.indexOf(1)).toBe(5);
    expect(texte).toContain("il faut six semaines");
    const poids = (rs: readonly number[]) =>
      pourcent(rs.reduce((s, r) => s + RESTAURANTS[r]!.part * RESTAURANTS[r]!.activite[2]!, 0));
    expect(texte).toContain(`les cinq Tables représentent ${poids([0, 1, 2, 3, 4])} %`);
    expect(texte).toContain(`Chambéry et Aix-les-Bains ensemble, ${poids([R.chambery, R.aix])} %`);
  });

  it("les coûts des options et des corrections sont ceux du modèle", () => {
    const opt = (d: number, o: number) => ETAPES[d]!.options[o]!.d;
    expect(opt(D.perimetre, 1)).toContain(`${COUTS.atelier} €`);
    expect(opt(D.bascule, 1)).toContain(`${COUTS.releves} € par semaine`);
    expect(opt(D.livraisons, 1)).toContain(`${fr(COUTS.bacs)} €`);
    expect(opt(D.livraisons, 1)).toContain(`${COUTS.tournee} € par semaine`);
    expect(opt(D.livraisons, 2)).toContain(`${COUTS.camion} € par semaine`);
    expect(source(2, "camion")).toContain(`${COUTS.camion} € par semaine`);
    expect(opt(D.qualite, 0)).toContain(`${COUTS.degustations} € par semaine`);
    expect(opt(D.qualite, 2)).toContain(`${fr(COUTS.audit)} €`);
    expect(opt(D.generalisation, 1)).toContain(`${COUTS.relais} € de déplacements par cuisine`);
  });

  it("le pain du soir, et ce que coûte sa cuisson sur place", () => {
    const texte = source(4, "refaits", [1, 1, 1, 0]);
    const enLettres: Record<number, string> = { 3: "trois", 4: "quatre", 5: "cinq" };
    expect(texte).toContain(`dans ${enLettres[Math.round(PAIN_DU_SOIR * 10)]} cas sur dix`);
    expect(texte).toContain(`coûte ${pourcent(1 - PAIN_CORRIGE)} % de l'économie sur les pains`);
  });

  it("les petits-déjeuners des hôtels", () => {
    const texte = source(5, "petits-dejeuners", [1, 1, 1, 0, 1]);
    const prix = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
    expect(texte).toContain(`${fr(PETITS_DEJEUNERS.parSemaine)} petits-déjeuners`);
    expect(texte).toContain(`${prix(PETITS_DEJEUNERS.achat)} € par couvert`);
    expect(texte).toContain(`pour ${prix(PETITS_DEJEUNERS.labo)} €`);
    expect(texte).toContain(`soit ${Math.round(GAIN_PETITS_DEJEUNERS)} € par semaine`);
  });

  it("le mandat dit l'économie du dossier et les frais fixes de la semaine", () => {
    const forts = EPISODE_CUISINE_CENTRALE.mandat.map((m) => m.fort);
    expect(forts).toContain(`${k(ECONOMIE_PREVUE)} k€`);
    expect(forts).toContain(`${fr(FRAIS_FIXES_SEMAINE)} €`);
    expect(forts).toContain(`${NOTE_DEPART.toLocaleString("fr-FR")}/5`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : arrêter le périmètre avec les chefs bat tout ; tenir le plan du comité coûte cher", () => {
    expect(classement(MEILLEUR, D.perimetre)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.perimetre, 1, 0)).toBeGreaterThan(10000);
    // Les pains seuls et le volontariat laissent le laboratoire sous ses frais fixes.
    expect(ecart(MEILLEUR, D.perimetre, 1, 2)).toBeGreaterThan(8000);
    expect(ecart(MEILLEUR, D.perimetre, 1, 3)).toBeGreaterThan(8000);
  });

  it("D2 : le pilote proche et en basse saison bat la date fixe, Megève en pleine saison et le report", () => {
    const c = classement(MEILLEUR, D.bascule);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.bascule, 1, 0)).toBeGreaterThan(5000);
    expect(ecart(MEILLEUR, D.bascule, 1, 2)).toBeGreaterThan(3000);
  });

  it("D3 : corriger la tournée vaut mieux en moyenne ; le second camion protège mieux des pires cas", () => {
    const r = rejeu(MEILLEUR, D.livraisons);
    expect(classement(MEILLEUR, D.livraisons)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1500);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    // Interdire de refaire est la pire réponse.
    expect(classement(MEILLEUR, D.livraisons).at(-1)).toBe(0);
  });

  it("D3 dépend de D2 : sans pilote, on ne sait pas quoi corriger, et le camion l'emporte", () => {
    const bigBang = [1, 0, 1, 0, 1, 1];
    expect(ecart(MEILLEUR, D.livraisons, 1, 2)).toBeGreaterThan(0);
    expect(ecart(bigBang, D.livraisons, 1, 2)).toBeLessThan(0);
  });

  it("D4 : goûter à l'aveugle avec les chefs bat les avis en ligne, et vaut bien plus quand les desserts sont au laboratoire", () => {
    expect(classement(MEILLEUR, D.qualite)[0]).toBe(0);
    expect(ecart(MEILLEUR, D.qualite, 0, 1)).toBeGreaterThan(1000);
    const signatures = [0, 1, 1, 0, 1, 1];
    expect(ecart(signatures, D.qualite, 0, 1)).toBeGreaterThan(
      5 * ecart(MEILLEUR, D.qualite, 0, 1),
    );
  });

  it("D5 : corriger le pain du soir et faire porter la suite par des chefs relais ; les relais valent après un pilote", () => {
    const c = classement(MEILLEUR, D.generalisation);
    expect(c[0]).toBe(1);
    expect(c.indexOf(0)).toBeGreaterThan(c.indexOf(2));
    const bigBang = [1, 0, 1, 0, 1, 1];
    expect(ecart(MEILLEUR, D.generalisation, 1, 2)).toBeGreaterThan(
      3 * ecart(bigBang, D.generalisation, 1, 2),
    );
  });

  it("D6 : mutualiser ce qui ne se voit pas (les petits-déjeuners) ; les desserts signatures coûtent plus qu'ils ne rapportent", () => {
    const c = classement(MEILLEUR, D.suite);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.suite, 2, 0)).toBeGreaterThan(0);
    expect(ecart(MEILLEUR, D.suite, 1, 0)).toBeGreaterThan(3000);
  });

  it("aucun réflexe n'est une bonne décision sur le meilleur chemin, ni dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      const m = mesurerDecision(EPISODE_CUISINE_CENTRALE, chemin, d, JOURS);
      expect(m.bonne, `D${d + 1}`).toBe(false);
    }
    const methode: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => methode[d] === o)).toBe(false);
  });

  it("mutualiser avec les chefs bat l'application de la décision du comité et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(0);
    expect(methode! - reflexe!).toBeGreaterThan(40000);
    expect(methode! - attentiste!).toBeGreaterThan(20000);
    expect(attentiste).toBeGreaterThan(reflexe!);
    expect(REFERENCES[1].chemin).toEqual(REFLEXE);
    expect(REFERENCES[2].chemin).toEqual(ATTENTISTE);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["dossier", "avis"],
      ["cadence"],
      ["releves"],
      ["aveugle"],
      ["refaits"],
      ["petits-dejeuners"],
    ],
    jours: JOURS,
    diagnostic: "identite",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 264,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CUISINE_CENTRALE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a appliqué la décision du comité, propose de conduire la mutualisation avec ceux qui la vivent", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CUISINE_CENTRALE.comportements(
      p,
      analyser(EPISODE_CUISINE_CENTRALE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CUISINE_CENTRALE.axe(c).titre).toBe(
      "Conduire la mutualisation avec ceux qui la vivent",
    );
  });

  it("à qui a décidé sans enquêter, propose de chiffrer ce que le laboratoire rapporte vraiment", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CUISINE_CENTRALE.comportements(
      p,
      analyser(EPISODE_CUISINE_CENTRALE, p).trimestre,
    );
    expect(EPISODE_CUISINE_CENTRALE.axe(c).titre).toBe(
      "Chiffrer ce que le laboratoire rapporte vraiment",
    );
  });

  it("calibre la prévision sur l'économie annuelle du dossier, frais fixes déduits", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_CUISINE_CENTRALE.comportements(partie(MEILLEUR), t)[3]!;
    expect(juste.score).toBe(1);
    // Oublier les frais fixes, c'est annoncer le chiffre présenté au comité.
    const oubli = EPISODE_CUISINE_CENTRALE.comportements(
      partie(MEILLEUR, { prevision: 316 }),
      t,
    )[3]!;
    expect(oubli.score).toBe(0);
  });

  it("dit le résultat en économie nette", () => {
    expect(EPISODE_CUISINE_CENTRALE.bilan.titre(simuler(MEILLEUR, 11, JOURS))).toMatch(
      /payé ses frais fixes/,
    );
    expect(EPISODE_CUISINE_CENTRALE.bilan.titre(simuler(REFLEXE, 11, JOURS))).toMatch(
      /coûté plus qu'il n'a économisé/,
    );
  });
});
