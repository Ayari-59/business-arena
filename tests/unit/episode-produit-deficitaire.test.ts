import { describe, expect, it } from "vitest";
import {
  BAISSE_CALORIVE,
  CHANCE_ARRET_IMPOSE,
  COMMUNES,
  D,
  EVITABLES_PC,
  IMPREVUS,
  LIE,
  MCS_PEINTURE,
  PART_COMPAREE,
  PEINTURE,
  QUINCAILLERIE,
  REFERENCE,
  RESULTAT_REFERENCE,
  SPECIFIQUES_PC,
  SPECIFIQUES_PEINTURE,
  TAUX_REPARTITION,
  TOTAL_COMMUNES,
  arretImpose,
  hasard,
  ilescuPart,
  margeSurCoutsSpecifiques,
  mcv,
  resultatCoutComplet,
  simuler,
  tauxMcv,
} from "../../src/engine/episodes/produit-deficitaire";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/produit-deficitaire";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_PRODUIT_DEFICITAIRE } from "../../src/pedagogy/episodes/produit-deficitaire";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le produit qui perd de l'argent » enseigne le raisonnement en
 * coûts partiels : une gamme « déficitaire » en coût complet peut couvrir
 * largement ses coûts spécifiques, et les charges communes qu'on lui répartit
 * ne disparaissent pas avec elle ; c'est la sous-famille dont la marge ne
 * couvre pas ses propres coûts qu'il faut arrêter ou réorganiser ; et les
 * chauffagistes qu'une gamme attire achètent aussi ailleurs. Ces tests
 * verrouillent les classements qui le disent, et la cohérence des chiffres
 * donnés au joueur avec les constantes du modèle.
 */

const MEILLEUR = [1, 1, 0, 1, 2, 1];
const REFLEXE = [0, 2, 2, 0, 0, 0];
const ATTENTISTE = [3, 3, 2, 3, 3, 3];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne, à la décision d. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
const source = (etape: number, id: string) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat({});
};
/** Un montant en k€, écrit comme les sources l'écrivent. */
const ke = (v: number) => `${Math.round(v / 1000)} k€`;
const pourcent = (v: number, d = 0) =>
  `${(v * 100).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;

describe("les chiffres donnés au joueur sont ceux du modèle", () => {
  it("le compte de la plomberie-chauffage donne une marge sur coûts spécifiques de 44 k€", () => {
    const texte = source(0, "compte");
    expect(Object.values(SPECIFIQUES_PC).reduce((s, x) => s + x, 0)).toBe(REFERENCE.pc.cs);
    for (const v of [REFERENCE.pc.ca, REFERENCE.pc.cv, ...Object.values(SPECIFIQUES_PC)]) {
      expect(texte).toContain(ke(v));
    }
    expect(mcv("pc")).toBe(110000);
    expect(margeSurCoutsSpecifiques("pc")).toBe(44000);
    expect(EPISODE_PRODUIT_DEFICITAIRE.prevision.reel(simuler(MEILLEUR, 1))).toBe(44);
    // Le « déficit » du tableau : la marge sur coûts spécifiques moins la part de charges communes.
    expect(texte).toContain(ke(TAUX_REPARTITION * REFERENCE.pc.ca));
    expect(resultatCoutComplet("pc")).toBe(-16000);
  });

  it("le tableau de la direction et la clé de répartition sont ceux des constantes", () => {
    const tableau = ETAPES[0]!.messages({})[0]!.texte;
    expect(tableau).toContain(`plomberie-chauffage −${ke(-resultatCoutComplet("pc"))}`);
    expect(tableau).toContain(`outillage +${ke(resultatCoutComplet("out"))}`);
    expect(tableau).toContain(`gros œuvre +${ke(resultatCoutComplet("go"))}`);
    expect(tableau).toContain(`quincaillerie de finition +${ke(resultatCoutComplet("qf"))}`);
    expect(tableau).toContain(`Agence : +${ke(RESULTAT_REFERENCE)}`);
    const communes = source(0, "communes");
    expect(communes).toContain(ke(TOTAL_COMMUNES));
    for (const v of Object.values(COMMUNES)) expect(communes).toContain(ke(v));
    expect(communes).toContain(pourcent(TAUX_REPARTITION));
    // Seuls le stock, sa démarque et le showroom disparaîtraient ce trimestre.
    expect(EVITABLES_PC).toBe(
      SPECIFIQUES_PC.detention + SPECIFIQUES_PC.demarque + SPECIFIQUES_PC.showroom,
    );
    expect(source(0, "tickets")).toContain(
      `entre ${Math.round(LIE.min * 100)} et ${Math.round(LIE.max * 100)} %`,
    );
    expect(source(0, "tickets")).toContain(`${Math.round(((LIE.min + LIE.max) / 2) * 100)} %`);
  });

  it("le corner peinture a une marge sur coûts spécifiques de −14 k€, cachée dans une gamme rentable", () => {
    const texte = source(1, "sousfamilles");
    const tauxPeinture = (PEINTURE.ca - PEINTURE.cv) / PEINTURE.ca;
    expect(texte).toContain(pourcent(tauxPeinture));
    for (const v of Object.values(SPECIFIQUES_PEINTURE)) expect(texte).toContain(ke(v));
    expect(texte).toContain(ke(QUINCAILLERIE.ca - QUINCAILLERIE.cv));
    expect(texte).toContain(ke(QUINCAILLERIE.cs));
    expect(MCS_PEINTURE).toBe(-14000);
    expect(margeSurCoutsSpecifiques("qf")).toBeGreaterThan(0);
    expect(resultatCoutComplet("qf")).toBeGreaterThan(0);
  });

  it("les taux de marge des sources de Calorive, du vendeur, de l'opération et de la remise", () => {
    const cv = REFERENCE.pc.cv / REFERENCE.pc.ca;
    const aligne = (1 - BAISSE_CALORIVE - cv) / (1 - BAISSE_CALORIVE);
    expect(source(2, "comparatif")).toContain(pourcent(aligne, 1));
    expect(source(2, "comparatif")).toContain(pourcent(PART_COMPAREE));
    expect(source(2, "comparatif")).toContain(pourcent(tauxMcv("pc")));
    // Les congés du vendeur : 27 % des ventes de la gamme, à son taux de marge.
    expect(source(3, "conges")).toContain(ke(0.27 * mcv("pc")));
    expect(source(3, "conges")).toContain(ke(SPECIFIQUES_PC.vendeur));
    // Le prospectus gros œuvre à −4 % et +12 % de volume fait moins de marge qu'avant.
    expect(source(4, "operations")).toContain(pourcent(tauxMcv("go")));
    expect(source(4, "operations")).toContain(pourcent(tauxMcv("out")));
    expect(1.12 * (0.96 - (1 - tauxMcv("go")))).toBeLessThan(tauxMcv("go"));
    // La remise de 8 % sur le gros œuvre : 13 % de taux, 67 % de volume en plus pour la même marge.
    const remise = (0.92 - (1 - tauxMcv("go"))) / 0.92;
    expect(source(5, "devis")).toContain(pourcent(remise));
    expect(source(5, "devis")).toContain(pourcent(tauxMcv("go") / (0.92 * remise) - 1));
  });
});

describe("le modèle des gammes", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
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

  it("la direction tranche environ une fois sur deux si l'on attend, jamais sinon", () => {
    const imposes = GRAINES_DU_BILAN.filter((g) => arretImpose(ATTENTISTE, g)).length;
    expect(imposes / GRAINES_DU_BILAN.length).toBeGreaterThan(CHANCE_ARRET_IMPOSE - 0.2);
    expect(imposes / GRAINES_DU_BILAN.length).toBeLessThan(CHANCE_ARRET_IMPOSE + 0.2);
    expect(GRAINES_DU_BILAN.some((g) => arretImpose(MEILLEUR, g))).toBe(false);
    expect(GRAINES_DU_BILAN.some((g) => ilescuPart(MEILLEUR, g))).toBe(false);
    expect(GRAINES_DU_BILAN.some((g) => ilescuPart(ATTENTISTE, g))).toBe(true);
  });

  it("arrêter la gamme améliore à peine son coût complet, et fait chuter le résultat de l'agence", () => {
    const garde = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g, JOURS));
    const arrete = GRAINES_DU_BILAN.map((g) => simuler([0, ...MEILLEUR.slice(1)], g, JOURS));
    expect(moyenne(garde.map((t) => t.mcsPc))).toBeGreaterThan(30000);
    expect(moyenne(arrete.map((t) => t.mcsPc))).toBeLessThan(15000);
    expect(
      moyenne(garde.map((t) => t.resultat)) - moyenne(arrete.map((t) => t.resultat)),
    ).toBeGreaterThan(35000);
    // Les chauffagistes partis emportent une part des ventes d'outillage et de quincaillerie.
    expect(moyenne(arrete.map((t) => t.lieesRapport))).toBeLessThan(0.85);
    expect(moyenne(garde.map((t) => t.lieesRapport))).toBeGreaterThan(1);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : garder la gamme et montrer sa marge sur coûts spécifiques ; l'arrêter est le pire", () => {
    const c = classement(MEILLEUR, D.gamme);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.gamme, 1, 0)).toBeGreaterThan(30000);
    // Relever les prix pour « couvrir sa part de frais » fait partir les chauffagistes.
    expect(ecart(MEILLEUR, D.gamme, 1, 2)).toBeGreaterThan(10000);
    // Attendre expose à un arrêt imposé : le pire cas est bien plus bas.
    const r = rejeu(MEILLEUR, D.gamme);
    expect(r[1]!.p10 - r[3]!.p10).toBeGreaterThan(15000);
  });

  it("D2 : le corner peinture se réorganise ou se ferme ; le relancer par une promotion est le pire", () => {
    const c = classement(MEILLEUR, D.peinture);
    expect(c.slice(0, 2)).toEqual([1, 0]);
    expect(c.at(-1)).toBe(2);
    expect(ecart(MEILLEUR, D.peinture, 0, 3)).toBeGreaterThan(3000);
    // Priscilla au comptoir plomberie ne vaut que si la gamme reste ouverte.
    const sansPlomberie = [0, ...MEILLEUR.slice(1)];
    expect(ecart(MEILLEUR, D.peinture, 1, 0)).toBeGreaterThan(
      ecart(sansPlomberie, D.peinture, 1, 0) + 2000,
    );
  });

  it("D3 : s'aligner sur les seules références comparées ; refuser de baisser une gamme « déficitaire » coûte", () => {
    const c = classement(MEILLEUR, D.calorive);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.calorive, 0, 2)).toBeGreaterThan(8000);
    // Après une hausse de 5 %, ne pas s'aligner coûte encore plus.
    const apresHausse = [2, ...MEILLEUR.slice(1)];
    expect(ecart(apresHausse, D.calorive, 0, 2)).toBeGreaterThan(ecart(MEILLEUR, D.calorive, 0, 2));
  });

  it("D4 : garder le vendeur et l'envoyer sur les chantiers, surtout quand quelqu'un tient le comptoir", () => {
    const c = classement(MEILLEUR, D.vendeur);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const sansPriscilla = [1, 3, 0, 1, 2, 1];
    expect(ecart(MEILLEUR, D.vendeur, 1, 3)).toBeGreaterThan(2500);
    expect(ecart(sansPriscilla, D.vendeur, 1, 3)).toBeLessThan(1000);
  });

  it("D5 : la matinée chauffagistes rapporte le plus en moyenne, l'outillage est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.operation);
    const c = classement(MEILLEUR, D.operation);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(2000);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
    // Sans alignement sur Calorive, les chauffagistes viennent, mais achètent ailleurs.
    const sansAlignement = [1, 1, 2, 1, 2, 1];
    expect(ecart(sansAlignement, D.operation, 2, 1)).toBeLessThan(0);
  });

  it("D6 : relancer les devis sans remise ; la remise sur le gros œuvre détruit de la marge", () => {
    const c = classement(MEILLEUR, D.fin);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.fin, 1, 0)).toBeGreaterThan(5000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_PRODUIT_DEFICITAIRE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}, option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option === o && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    for (const [d, o] of REFLEXES) expect(REFERENCES[0].chemin[d]).not.toBe(o);
  });

  it("raisonner en marge bat nettement le coût complet et l'attentisme, en moyenne", () => {
    const [marge, coutComplet, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(marge! - attentiste!).toBeGreaterThan(20000);
    expect(attentiste! - coutComplet!).toBeGreaterThan(20000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["compte", "communes"],
      ["sousfamilles"],
      ["comparatif"],
      ["conges"],
      ["operations"],
      ["devis"],
    ],
    jours: 2,
    diagnostic: "repartition",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 44,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PRODUIT_DEFICITAIRE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi le tableau en coût complet, propose de raisonner en marge", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PRODUIT_DEFICITAIRE.comportements(
      p,
      analyser(EPISODE_PRODUIT_DEFICITAIRE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PRODUIT_DEFICITAIRE.axe(c).titre).toBe(
      "Raisonner en marge, pas en coût complet",
    );
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qui disparaît avec la gamme", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PRODUIT_DEFICITAIRE.comportements(
      p,
      analyser(EPISODE_PRODUIT_DEFICITAIRE, p).trimestre,
    );
    expect(EPISODE_PRODUIT_DEFICITAIRE.axe(c).titre).toBe(
      "Chercher ce qui disparaît avec la gamme",
    );
  });

  it("calibre la prévision sur la marge sur coûts spécifiques, et dit le résultat en écart au budget", () => {
    const p = partie(MEILLEUR, { prevision: -16 });
    const c = EPISODE_PRODUIT_DEFICITAIRE.comportements(p, simuler(MEILLEUR, 11, 2));
    expect(c[3]!.score).toBe(0);
    const juste = EPISODE_PRODUIT_DEFICITAIRE.comportements(
      partie(MEILLEUR),
      simuler(MEILLEUR, 11, 2),
    );
    expect(juste[3]!.score).toBe(1);
    expect(EPISODE_PRODUIT_DEFICITAIRE.bilan.titre(simuler(REFLEXE, 4242))).toMatch(
      /sous le budget/,
    );
  });
});
