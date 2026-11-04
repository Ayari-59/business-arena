import { describe, expect, it } from "vitest";
import { LE_SEUIL_EN_AVENIR_ALEATOIRE } from "../../src/config/cours/chapitres/le-seuil-en-avenir-aleatoire";
import { CAUSES_DU_POIDS, PILOTER_LA_QUALITE, defiDeLaLigne, grilleDuPareto, qualiteDuChapitre } from "../../src/config/cours/chapitres/piloter-la-qualite";
import { qualiteDeNova } from "../../src/config/cours/chapitres/le-cout-de-la-non-qualite";
import { coutMoyenDUnDefaut } from "../../src/config/cours/monde/capacite";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { qualiteAuBudget } from "../../src/config/cours/monde/production-et-logistique";
import { AUTRES_CAUSES_DE_DEFAUT, POIDS_D_UNE_ENCEINTE, defautsDePoids, laboratoireDeLaLigne, partHorsTolerance, releveDuJour } from "../../src/config/cours/monde/qualite-de-la-ligne";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { DES_AIMANTS_MOINS_CHERS, ESSAI_DES_AIMANTS, aimantsMoinsChers } from "../../src/config/cours/situations/par-chapitre/des-aimants-moins-chers";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * PILOTER LA QUALITÉ (la ligne de NOVA, l'année N + 1, au budget de prévention actuel) : chaque chiffre
 * refait à la main, à partir de la fiche de capacité des chapitres « Produire bien » et « Le coût de
 * la non-qualité » (26 000 enceintes, 3,5 % de défauts, 80 % trouvés, 20 € la retouche, 100 € le
 * retour, 3 ventes perdues à 21 €), du poids N(850 ; 10) toléré de 825 à 875 g, et de la table.
 */

const ch = PILOTER_LA_QUALITE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const p4 = (v: number) => Math.round(v * 1e4) / 1e4 + 0;
const x = qualiteDuChapitre(NOVA);

describe("piloter la qualité : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite la DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([LE_SEUIL_EN_AVENIR_ALEATOIRE.code, "le-cout-de-la-non-qualite"]);
    for (const code of ch.prerequis!) expect(CHAPITRES.map((k) => k.code)).toContain(code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });

  it("ne sort pas du programme 2025 : ni test d'hypothèse, ni intervalle d'une proportion, ni loi binomiale ou de Poisson", () => {
    const texte = JSON.stringify(chapitreDuCas(ch, NOVA).etapes.map((e) => e.titre));
    expect(texte).not.toMatch(/test d'hypothèse|binomiale|Poisson|proportion/i);
  });
});

describe("une seule NOVA : la qualité est celle de « Produire bien » et du « Coût de la non-qualité »", () => {
  it("26 000 enceintes, 910 défauts, 36 € le défaut moyen, 48,60 € ventes perdues comprises (0,8 × 20 + 0,2 × 100 + 0,2 × 3 × 21)", () => {
    const a = qualiteAuBudget(NOVA_CAPACITE);
    const b = qualiteDeNova(NOVA).actuel;
    expect([x.volume, x.pareto.total]).toEqual([a.volume, a.defauts]);
    expect([a.volume, a.defauts]).toEqual([b.volume, b.defauts]);
    expect([x.volume, x.pareto.total]).toEqual([26_000, 910]);
    expect(coutMoyenDUnDefaut(NOVA_CAPACITE)).toBe(0.8 * 20 + 0.2 * 100);
    expect(x.coutTout).toBe(c(0.8 * 20 + 0.2 * 100 + 0.2 * 3 * 21));
  });
});

describe("les outils en amont : Pareto et Ishikawa", () => {
  it("le Pareto : 323 défauts de poids (26 000 × 2 × (1 − Π(2,5))), puis 264, 147, 106 et 70 ; les 2 premières causes font 64,51 %", () => {
    expect(Math.round(26_000 * 2 * (1 - 0.993790334674224))).toBe(323);
    expect(x.pareto.causes.map((k) => [k.code, k.nombre])).toEqual([
      ["poids", 323],
      ["soudure", 264],
      ["membrane", 147],
      ["appairage", 106],
      ["autres", 70],
    ]);
    expect(Math.round((910 - 323) * AUTRES_CAUSES_DE_DEFAUT[0].part)).toBe(264);
    const g = grilleDuPareto(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const cumuls = g.lignes.slice(0, -1).map((l) => l.cellules[2]!.valeur);
    expect(cumuls).toEqual([35.49, 64.51, 80.66, 92.31, 100]);
    expect(juste(ch, "les-priorites")[0]).toMatch(/^Traiter d'abord le poids/);
  });

  it("Ishikawa : une cause par famille des 5 M, et leurs coûts refont celui des 323 défauts de poids à 48,60 €", () => {
    expect(new Set(CAUSES_DU_POIDS.map((k) => k.famille)).size).toBe(5);
    expect(Object.values(triDe(ch, "les-cinq-m")).sort()).toEqual(["main-d-oeuvre", "materiel", "matiere", "methode", "milieu"]);
    const montants = etape(chapitreDuCas(ch, NOVA), "les-cinq-m", "tri").elements(NOVA).map((k) => k.montant);
    expect(c(montants.reduce((t, m) => t + m, 0))).toBe(c(323 * 48.6));
  });
});

describe("la loi normale sur la ligne, refaite à la main", () => {
  it("bien réglée : Π(−2,5) = 1 − 0,9938 = 0,0062 de chaque côté, 0,0124, 322,4 enceintes, 15 668,64 €", () => {
    expect(attendus(ch, "la-loi-du-poids")).toEqual([0.0062, 0.0124, 322.4, c(322.4 * 48.6)]);
    expect(partHorsTolerance(850, 10).hors).toBeCloseTo(0.0124193, 6);
  });

  it("déréglée à 855 g : 1 − Π(2) = 0,0228 au-dessus, 1 − Π(3) = 0,0013 dessous, 626,6 enceintes, 14 784,12 € de plus", () => {
    expect(juste(ch, "predire-le-dereglage")).toEqual(["Double à peu près"]);
    expect(attendus(ch, "le-dereglage")).toEqual([0.0228, 0.0013, 626.6, c((626.6 - 322.4) * 48.6)]);
    expect(defautsDePoids(NOVA_CAPACITE, 855).nombre).toBeCloseTo(26_000 * 0.0241, 0);
  });

  it("la pesée : 48,60 − 20 = 28,60 € évités par défaut, 12 000 ÷ 28,60 = 419,6, soit 420 ; gain net à 855 g, 5 920,76 €", () => {
    gardeDuCurseur(ch, "la-pesee-au-curseur", 420);
    expect(attendus(ch, "la-pesee-a-rebours")).toEqual([28.6, 420, c(626.6 * 28.6 - 12_000)]);
  });
});

describe("l'échantillonnage et l'estimation, refaits à la main", () => {
  it("la moyenne de 25 enceintes : σ ÷ 5 = 2 g, 850 ± 3,92 ; à 855 g, P(X̄ > 853,92) = Π(0,54) = 0,7054", () => {
    expect(juste(ch, "predire-l-echantillon")).toEqual(["5 fois moins qu'une enceinte"]);
    expect(attendus(ch, "la-moyenne-d-un-echantillon")).toEqual([2, 846.08, 853.92, 0.7054]);
  });

  it("le relevé du jour : 50 enceintes, 854,9 g de moyenne, 9,60 g d'écart-type, s = 9,70 g", () => {
    const r = releveDuJour();
    expect(r.n).toBe(50);
    const somme = 832.5 * 1 + 837.5 * 2 + 842.5 * 5 + 847.5 * 7 + 852.5 * 10 + 857.5 * 10 + 862.5 * 8 + 867.5 * 4 + 872.5 * 2 + 877.5 * 1;
    expect(somme / 50).toBeCloseTo(854.9, 10);
    expect(attendus(ch, "l-estimation-ponctuelle")).toEqual([854.9, 9.6, 9.7]);
  });

  it("l'intervalle de confiance à 95 % : 854,9 ± 1,96 × 10 ÷ √50 = ± 2,77 ; avec s, ± 2,69 ; 850 n'y est pas", () => {
    expect(c((1.96 * 10) / Math.sqrt(50))).toBe(2.77);
    expect(attendus(ch, "l-intervalle-ecart-type-connu")).toEqual([2.77, 852.13, 857.67]);
    expect(attendus(ch, "l-intervalle-ecart-type-inconnu")).toEqual([2.69, 852.21, 857.59]);
    expect(juste(ch, "lire-l-intervalle")[0]).toMatch(/^La moyenne a quitté 850/);
  });

  it("la taille d'échantillon : (1,96 × 10)² = 384,16, soit 385 ; (2,575 × 10)² = 663,06, soit 664", () => {
    expect(attendus(ch, "la-taille-de-l-echantillon")).toEqual([385, 664]);
  });

  it("le laboratoire : centrer à 850 g, 8 g d'écart-type, 110 enceintes à 95 % ; 46 défauts, une moyenne à 1,49 g près", () => {
    const l = laboratoireDeLaLigne(NOVA_CAPACITE, x.solution);
    expect(Math.round(l.nombre)).toBe(46);
    expect(c(l.demi)).toBe(c((1.959963984540054 * 8) / Math.sqrt(110)));
    expect(defiDeLaLigne(NOVA_CAPACITE, { ...x.solution, taille: 100 })).toBe(false);
    expect(defiDeLaLigne(NOVA_CAPACITE, { ...x.solution, ecartType: POIDS_D_UNE_ENCEINTE.ecartType })).toBe(false);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-ligne");
  });
});

describe("le cas dédié : des aimants moins chers", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(DES_AIMANTS_MOINS_CHERS);
    gardeDuCas(DES_AIMANTS_MOINS_CHERS, ch);
  });

  it("40 enceintes à 846 g : s = 11,85 × √(40 ÷ 39) = 12 g, 846 ± 3,72 ; recentrée, 2 × (1 − Π(2,08)) = 0,0376, 31 842,72 € contre 13 000 €", () => {
    expect(ESSAI_DES_AIMANTS).toEqual({ n: 40, moyenne: 846, ecartTypeObserve: 11.85 });
    expect(c(11.85 * Math.sqrt(40 / 39))).toBe(12);
    const montants = (id: string) => etape(chapitreDuCas(DES_AIMANTS_MOINS_CHERS, NOVA), id, "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants("l-estimation")).toEqual([12, c(846 - (1.96 * 12) / Math.sqrt(40)), c(846 + (1.96 * 12) / Math.sqrt(40))]);
    expect(montants("la-non-qualite")).toEqual([p4(2 * (1 - 0.9812)), 977.6, c((977.6 - 322.4) * 48.6)]);
    const n = aimantsMoinsChers(NOVA);
    expect(n.economie).toBe(13_000);
    const r = etape(DES_AIMANTS_MOINS_CHERS, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Ne pas signer : la non-qualité coûterait plus que l'économie"]);
  });
});
