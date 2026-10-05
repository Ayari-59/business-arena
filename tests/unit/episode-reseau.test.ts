import { describe, expect, it } from "vitest";
import {
  BRON,
  CHANCE_TALVERE,
  CONTRATS,
  D,
  FORMATS,
  IMPREVUS,
  MULTIPLE,
  PRIX,
  TAUX,
  TAUX_MCV,
  TERRAIN,
  VN,
  annuite,
  coutContrats,
  coutPrix,
  hasard,
  localRepris,
  margeAgenceVN,
  margeIncrementale,
  margePointDeRetrait,
  resultatAffiche,
  simuler,
  valeurFermeture,
  RESULTAT_BRON,
  CONTRIBUTION_BRON,
  RESULTAT_PLAN_VN,
} from "../../src/engine/episodes/reseau-a-redessiner";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/reseau-a-redessiner";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_RESEAU,
  MARGE_AGENCE_MIONS,
  SEUIL_FERMETURE,
} from "../../src/pedagogy/episodes/reseau-a-redessiner";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le réseau d'agences à redessiner » enseigne trois choses : un
 * site se juge sur la marge qu'il ajoute au réseau, cannibalisation déduite,
 * pas sur son propre compte d'exploitation ; fermer une agence en perte « sur
 * le papier » laisse ses frais communs au réseau et ne garde qu'une partie de
 * ses clients, qu'il vaut mieux mesurer avant de couper ; quand la demande est
 * incertaine et qu'un concurrent rôde, un format léger et une option sur le
 * terrain valent mieux qu'un engagement complet. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres que
 * les sources affichent.
 */

const MEILLEUR = [2, 2, 1, 1, 0, 0];
const REFLEXE = [0, 1, 2, 0, 1, 2];
const ATTENTISTE = [3, 0, 1, 0, 2, 2];
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_RESEAU.contexte(
    EPISODE_RESEAU.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle du réseau", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Les décisions des semaines 6 à 10 ne changent rien au chiffre de la semaine 5.
    expect(simuler(MEILLEUR, 12).semaines[5]!.ca).toBeCloseTo(
      simuler([2, 2, 1, 0, 2, 2], 12).semaines[5]!.ca,
      6,
    );
    expect(simuler(MEILLEUR, 12).projet).toBe(simuler(REFLEXE, 12).projet);
    expect(simuler(MEILLEUR, 12).report).toBe(simuler(REFLEXE, 12).report);
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

  it("la zone des Ormeaux est votée environ une fois sur deux", () => {
    const oui = GRAINES_DU_BILAN.filter((g) => hasard(g).projet).length;
    expect(oui).toBeGreaterThanOrEqual(11);
    expect(oui).toBeLessThanOrEqual(19);
  });

  it("Talvère vient d'autant moins qu'Arvel est présent à Mions, sous les mêmes tirages", () => {
    const venues = (d1: number) =>
      GRAINES_DU_BILAN.filter((g) => simuler([d1, 0, 1, 1, 2, 0], g).talvere).length;
    const [agence, tournee, comptoir, aucun] = [0, 1, 2, 3].map(venues);
    expect(agence).toBeLessThan(comptoir!);
    expect(comptoir).toBeLessThan(tournee!);
    expect(tournee).toBeLessThanOrEqual(aucun!);
    expect(aucun! / 30).toBeGreaterThan(CHANCE_TALVERE.aucun - 0.2);
    expect(comptoir! / 30).toBeLessThan(CHANCE_TALVERE.comptoir + 0.15);
  });

  it("un concurrent ne reprend le local de Bron que si Bron ferme, environ quatre fois sur dix", () => {
    const ferme = [2, 1, 1, 1, 0, 0];
    const repris = GRAINES_DU_BILAN.filter((g) => localRepris(ferme, g)).length;
    expect(repris).toBeGreaterThan(5);
    expect(repris).toBeLessThan(18);
    expect(GRAINES_DU_BILAN.some((g) => localRepris([2, 0, 1, 1, 0, 0], g))).toBe(false);
  });

  it("la valeur de la semaine 13 est l'objectif ; rien n'est compté avant la première décision", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.semaines[1]!.valeur).toBe(0);
  });

  it("la bonne méthode atteint en moyenne l'objectif de valeur ; ne rien faire face à Talvère coûte", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(150000);
    expect(attendu(MEILLEUR)).toBeLessThan(600000);
    expect(attendu(ATTENTISTE)).toBeLessThan(0);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-300000);
    expect(attendu(REFLEXE)).toBeLessThan(attendu(ATTENTISTE));
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("l'agence de Mions : 244 k€ de résultat affiché, 28 k€ de marge incrémentale, ce que la semaine 1 demande", () => {
    const a = FORMATS.agence;
    expect(k(resultatAffiche(a))).toBe(244);
    const aLaMain = TAUX_MCV * (a.ca - a.reprise * 1200000) - a.fixes;
    expect(MARGE_AGENCE_MIONS).toBeCloseTo(aLaMain, 6);
    expect(k(MARGE_AGENCE_MIONS)).toBe(28);
    expect(EPISODE_RESEAU.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(28, 6);
    const etude = source(0, "etude", []);
    expect(etude).toContain(`${k(resultatAffiche(a))} k€ de résultat par an`);
    expect(etude).toContain(`Coûts fixes propres : ${k(a.fixes)} k€`);
    expect(etude).toContain(`travaux et aménagement : ${k(a.travaux)} k€`);
    expect(etude).toContain(`${TAUX_MCV * 100} %`);
    expect(source(0, "adresses", [])).toContain("trois quarts");
    expect(a.reprise).toBe(0.75);
    expect(FORMATS.comptoir.reprise).toBe(0.5);
    // Le comptoir ajoute au réseau plus que l'agence, pour quatre fois moins de travaux.
    expect(margeIncrementale(FORMATS.comptoir)).toBeGreaterThan(MARGE_AGENCE_MIONS);
  });

  it("Bron : −60 k€ après frais communs, +120 k€ de contribution, et 45 % de report pour que fermer paie", () => {
    expect(k(RESULTAT_BRON)).toBe(-60);
    expect(k(CONTRIBUTION_BRON)).toBe(120);
    const compte = source(1, "compte", [2]);
    expect(compte).toContain(`Contribution de Bron : +${k(CONTRIBUTION_BRON)} k€`);
    expect(compte).toContain(`${k(BRON.communs)} k€ ; ils ne disparaissent pas`);
    // Au report affiché, la fermeture ne crée ni ne détruit de valeur sur cinq ans.
    expect(valeurFermeture(SEUIL_FERMETURE)).toBeCloseTo(0, 6);
    expect(Math.round(SEUIL_FERMETURE * 100)).toBe(45);
    expect(source(1, "report", [2])).toContain("plus de 45 % du chiffre");
  });

  it("les deux ripostes à Talvère coûtent ce que la source affiche", () => {
    expect(k(coutPrix)).toBe(100);
    expect(k(PRIX.baisse * PRIX.ca * (PRIX.semaines / 52))).toBe(75);
    expect(k(coutContrats)).toBe(75);
    const texte = source(2, "ripostes", [2, 2]);
    expect(texte).toContain(
      `${(CONTRATS.remise * 100).toLocaleString("fr-FR")} % de remise de fin d'année, ${k(coutContrats)} k€`,
    );
    expect(texte).toContain(`${PRIX.ca / 1e6} M€ de chiffre par an) pendant six mois : 75 k€`);
    // La chance que Talvère ouvre, vue des choix de la semaine 1.
    expect(source(2, "historique", [2, 2])).toContain("à 30 %");
    expect(source(2, "historique", [3, 2])).toContain("à 70 %");
  });

  it("Villeurbanne-Nord : le plan comptait 250 k€, la marge réelle de l'agence est presque nulle", () => {
    expect(k(RESULTAT_PLAN_VN)).toBe(250);
    const s = hasard(3).partNouvelle;
    const texte = source(3, "comptes", [2, 2, 1], 3);
    expect(texte).toContain(`${Math.round((1 - s) * 100)} % du chiffre du point de retrait`);
    expect(texte).toContain("d'où ses 250 k€ de résultat par an");
    for (const g of GRAINES_DU_BILAN) {
      const p = hasard(g).partNouvelle;
      expect(margeAgenceVN(p)).toBeLessThan(60000);
      expect(MULTIPLE * margeAgenceVN(p) - VN.agence.travaux).toBeLessThan(
        MULTIPLE * margePointDeRetrait(p) - VN.dedit,
      );
    }
  });

  it("le terrain : 180 k€ de perte s'il faut le revendre, 35 k€ pour la réservation", () => {
    expect(k(TERRAIN.prix * TERRAIN.decote)).toBe(180);
    const texte = source(4, "valeur", [2, 2, 1, 1]);
    expect(texte).toContain("soit 180 k€ de perte");
    expect(texte).toContain(`${k(TERRAIN.reservation)} k€`);
    expect(texte).toContain("Le comptoir de Mions y déménagerait");
    expect(source(4, "valeur", [0, 2, 1, 1])).toContain("ne nous servirait à rien");
  });

  it("le multiple de cinq ans au taux du groupe vaut 3,99", () => {
    expect(MULTIPLE).toBeCloseTo(annuite(5, TAUX), 9);
    expect(MULTIPLE.toFixed(2)).toBe("3.99");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le comptoir bat l'agence complète, réflexe d'occuper le terrain, et l'attente", () => {
    const r = rejeu(MEILLEUR, D.mions);
    expect(classement(MEILLEUR, D.mions)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
  });

  it("D2 : mesurer le report bat la fermeture sur le papier ; garder Bron est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.bron);
    expect(classement(MEILLEUR, D.bron)).toEqual([2, 0, 1]);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(60000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    // L'information coûte : le test est la meilleure option en moyenne, pas la plus sûre.
    expect(plusSure(MEILLEUR, D.bron)).toBe(0);
  });

  it("D3 : ne pas répondre à une annonce, quand on est déjà à Mions ; sans site, les contrats protègent", () => {
    const r = rejeu(MEILLEUR, D.talvere);
    expect(classement(MEILLEUR, D.talvere)).toEqual([1, 0, 2]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(60000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    // Sans site à Mions, Talvère vient sept fois sur dix : les contrats valent leur prix.
    expect(classement(ATTENTISTE, D.talvere)[0]).toBe(0);
  });

  it("D4 : changer de cap au vu du point de retrait bat la poursuite du plan de juin", () => {
    const r = rejeu(MEILLEUR, D.villeurbanne);
    expect(classement(MEILLEUR, D.villeurbanne)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(60000);
  });

  it("D5 : réserver le terrain bat l'achat ; et ne vaut rien à qui a déjà une agence à Mions", () => {
    const r = rejeu(MEILLEUR, D.terrain);
    expect(classement(MEILLEUR, D.terrain)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
    // Ne rien prendre protège mieux d'un vote repoussé : la réservation est un pari raisonné.
    expect(plusSure(MEILLEUR, D.terrain)).toBe(2);
    // Avec une agence complète au centre de Mions, le terrain ne sert à rien.
    const avecAgence = [0, 2, 1, 1, 0, 0];
    expect(classement(avecAgence, D.terrain)[0]).toBe(2);
  });

  it("D6 : la prime sur le bassin bat la prime à l'agence, d'autant plus que les sites se disputent des clients", () => {
    const r = rejeu(MEILLEUR, D.primes);
    expect(classement(MEILLEUR, D.primes)).toEqual([0, 1, 2]);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.primes);
      return x[0]!.attendu - x[2]!.attendu;
    };
    // Sans site à Mions et sans point de retrait, il n'y a rien à se disputer.
    expect(ecart([3, 2, 1, 2, 0, 0])).toBeCloseTo(0, 6);
  });

  it("la marge du réseau bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(300000);
    expect(bonne! - attentiste!).toBeGreaterThan(200000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_RESEAU, MEILLEUR, d, JOURS);
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
      ["etude", "adresses"],
      ["compte", "report"],
      ["historique"],
      ["comptes"],
      ["valeur"],
      ["remises"],
    ],
    jours: JOURS,
    diagnostic: "reseau",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 28,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RESEAU, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de compter en marge du réseau", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_RESEAU.comportements(p, analyser(EPISODE_RESEAU, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RESEAU.axe(c).titre).toBe("Compter en marge du réseau, pas en compte d'agence");
  });

  it("à qui a décidé sans enquêter, propose de chercher d'où viennent les clients", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RESEAU.comportements(p, analyser(EPISODE_RESEAU, p).trimestre);
    expect(EPISODE_RESEAU.axe(c).titre).toBe("Chercher d'où viennent les clients");
  });

  it("juge la marge incrémentale calculée en semaine 1 : juste, proche, ou sans la cannibalisation", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_RESEAU.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(28)).toBe(1);
    expect(score(50)).toBe(0.6);
    // Sans déduire la cannibalisation : le résultat affiché par l'étude.
    expect(score(244)).toBe(0);
    // En comptant tout le chiffre de la zone comme repris : 0,24 × (2 600 − 1 200) − 380.
    expect(score(-44)).toBe(0);
  });

  it("le constat de la carte : mesurer avant de couper, réviser quand les chiffres parlent", () => {
    const carte = (chemin: readonly number[]) =>
      EPISODE_RESEAU.comportements(partie(chemin), simuler(chemin, 11, JOURS))[4]!.score;
    expect(carte(MEILLEUR)).toBe(1);
    expect(carte(REFLEXE)).toBe(0);
    expect(carte(ATTENTISTE)).toBeCloseTo(0.3, 6);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    const vote = GRAINES_DU_BILAN.find((g) => hasard(g).projet)!;
    expect(EPISODE_RESEAU.bilan.titre(simuler(MEILLEUR, vote))).toMatch(/valeur créée/);
    const t = GRAINES_DU_BILAN.map((g) => simuler(REFLEXE, g)).find((x) => x.objectif < 0)!;
    expect(EPISODE_RESEAU.bilan.titre(t)).toMatch(/valeur détruite/);
  });
});
