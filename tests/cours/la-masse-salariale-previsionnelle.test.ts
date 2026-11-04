import { describe, expect, it } from "vitest";
import {
  DEPART_DU_LABORATOIRE,
  LA_MASSE_SALARIALE_PREVISIONNELLE,
  defiDesHaussesAtteint,
  laboratoireDuChapitre,
} from "../../src/config/cours/chapitres/la-masse-salariale-previsionnelle";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE, casDuChapitre } from "../../src/config/cours/situations";
import { LA_HAUSSE_AVANCEE_EN_JUILLET, hausseEnJuillet } from "../../src/config/cours/situations/par-chapitre/la-hausse-avancee-en-juillet";
import {
  ARRIVEE_DU_CINQUIEME,
  DEPART,
  SALAIRE_D_EMBAUCHE,
  budgetDeLaMasse,
  ecartsDeLaMasse,
  effetsDesHausses,
  masseBruteDeN,
  plusBasSalaireDeLAnnee,
} from "../../src/config/cours/monde/masse-salariale-de-nova";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LA MASSE SALARIALE PRÉVISIONNELLE ET SES ÉCARTS (N + 1 chez NOVA) : chaque chiffre refait à la main, à
 * partir de la paie du cours (4 opérateurs à 1 875 € bruts, 42 % de cotisations patronales, aucune hausse
 * en N), du marché de N + 1 (2 000 €, 95 % : 1 900 €), du départ des chapitres de ressources humaines
 * (dernier mois mars, remplaçant le 1er juin), du cinquième opérateur (1er mars) et des hypothèses du
 * chapitre (2 % au 1er janvier et au 1er octobre ; un chef d'équipe à 2 100 € au 1er avril).
 */

const ch = LA_MASSE_SALARIALE_PREVISIONNELLE;
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;

describe("la masse salariale prévisionnelle : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite la DCG UE11, la DSCG UE3 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["la-paie", "effectif-et-masse-salariale", "analyse-des-ecarts"]);
    expect(ch.ensuite).toEqual(["indicateurs-sociaux"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const k of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(k)), `objectif ${k}`).toBe(true);
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_HAUSSE_AVANCEE_EN_JUILLET]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("les tableaux à compléter tiennent leurs totaux", () => {
    for (const e of ch.etapes) if (e.type === "a-completer") expect(incoherencesDuTableau(e.grille(NOVA)), e.id).toEqual([]);
  });
});

describe("les trois effets, refaits à la main", () => {
  it("2 % en janvier et 2 % en octobre : niveau 1,0404, somme des indices 1 230,12, masse 1,0251, report 1,0149", () => {
    const e = effetsDesHausses();
    expect(e.indices).toEqual([102, 102, 102, 102, 102, 102, 102, 102, 102, 104.04, 104.04, 104.04]);
    expect(cent(9 * 102 + 3 * 104.04)).toBe(1_230.12);
    expect(e.niveau).toBeCloseTo(1.02 * 1.02, 12);
    expect(e.masse).toBeCloseTo(1_230.12 / 1_200, 12);
    expect(e.report).toBeCloseTo((12 * 104.04) / 1_230.12, 12);
    expect(e.masse * e.report).toBeCloseTo(e.niveau, 12);
    expect(attendus(ch, "les-indices")).toEqual([4.04, 1_230.12, 2.51]);
  });

  it("l'effet de report : 4 × 1 950,75 × 12 = 93 636 € en N + 2, +1,49 %, et masse × report = 1,0404", () => {
    expect(cent(1_875 * 1.0404)).toBe(1_950.75);
    expect(attendus(ch, "l-effet-de-report")).toEqual([4 * 1_950.75 * 12, 1.49, 1.0404]);
    expect(cent(93_636 / 92_259 - 1)).toBe(0.01);
    expect(juste(ch, "les-trois-effets")).toEqual(["Les deux sont vrais : le niveau dit le salaire, la masse l'année"]);
  });

  it("la date de la seconde hausse : l'enveloppe de 2,6 % (92 340 €) tient à partir d'octobre", () => {
    expect(masseBruteDeN()).toBe(90_000);
    expect(cent(90_000 * 1.026)).toBe(92_340);
    // Seconde hausse au mois m : 7 500 × (12 × 1,02 + (13 − m) × 1,02 × 0,02).
    const masse = (m: number) => cent(7_500 * (12 * 1.02 + (13 - m) * 1.02 * 0.02));
    expect([masse(9), masse(10)]).toEqual([92_412, 92_259]);
    gardeDuCurseur(ch, "la-date-de-la-seconde-hausse", 10);
    expect(juste(ch, "predire-la-date")).toEqual(["Monterait"]);
  });

  it("le laboratoire : 4 % en janvier échoue, 2 % en janvier et 2 % en octobre réussit ; la date ne change pas l'effet de niveau", () => {
    const e = etape(ch, "le-laboratoire-des-hausses", "simulation");
    const depart = Object.fromEntries(e.leviers(NOVA).map((l) => [l.code, l.depart]));
    expect(depart).toEqual(DEPART_DU_LABORATOIRE);
    const d = e.defi(NOVA);
    expect(d.solution).toEqual({ janvier: 2, mois: 10, seconde: 2 });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    // 1 % en janvier laisse un opérateur à 1 893,75 €, sous les 1 900 € du marché.
    expect(defiDesHaussesAtteint({ janvier: 1, mois: 12, seconde: 3 })).toBe(false);
    for (const m of [2, 6, 10, 12]) expect(laboratoireDuChapitre({ janvier: 2, mois: m, seconde: 2 }).niveau).toBeCloseTo(1.0404, 12);
    expect(e.graphique!(NOVA).courbes.map((k) => k.valeur(d.solution))).toEqual([2.51, 1.49]);
  });
});

describe("le budget de N + 1 et sa variation, refaits à la main", () => {
  it("salarié par salarié : 46 129,50 + 24 763,50 + 5 737,50 + 19 114 + 13 414 = 109 158,50 € bruts, 155 005,07 € chargés", () => {
    expect(DEPART).toEqual({ dernierMois: 3, arriveeDuRemplacant: 6 });
    expect(ARRIVEE_DU_CINQUIEME).toBe(3);
    expect(SALAIRE_D_EMBAUCHE).toBe(1_900);
    const b = budgetDeLaMasse();
    expect(b.salaries.map((s) => s.masse)).toEqual([
      2 * (9 * 1_912.5 + 3 * 1_950.75),
      3 * 1_912.5 + 6 * 2_100 + 3 * 2_142,
      3 * 1_912.5,
      7 * 1_900 + 3 * 1_938,
      4 * 1_900 + 3 * 1_938,
    ]);
    expect(b.brute).toBe(109_158.5);
    expect(b.chargee).toBe(cent(109_158.5 * 1.42));
    const g = etape(ch, "le-budget-de-n-plus-1", "a-completer").grille(NOVA);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([24 + 12 + 3 + 10 + 7, 109_158.5, b.chargee]);
  });

  it("la variation : 2 259 € de hausses générales + 1 698,75 € de GVT − 88,25 € de noria + 15 289 € d'effectif = 19 158,50 €", () => {
    const e = budgetDeLaMasse().effets;
    expect(e.generales).toBe(cent(7_500 * 1_230.12 / 100 - 90_000));
    expect(e.gvt).toBe(cent(24_763.5 - 1_875 * 12.3012));
    expect(e.noria).toBe(cent(13_414 - (4 * 1_912.5 + 3 * 1_950.75)));
    expect(e.effectif).toBe(cent(19_114 - 2 * 1_912.5));
    expect([e.generales, e.gvt, e.noria, e.effectif]).toEqual([2_259, 1_698.75, -88.25, 15_289]);
    const g = etape(ch, "les-effets-de-la-variation", "a-completer").grille(NOVA);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([2_259, 1_698.75, -88.25, 15_289, 19_158.5]);
    expect(juste(ch, "predire-la-variation")).toEqual(["Moins d'un quart"]);
    expect(juste(ch, "noria-et-gvt")).toEqual(["Une recrue est payée presque comme un ancien"]);
  });

  it("le SMIC : 1 900 ÷ 151,67 = 12,53 € de l'heure, 0,22 € au-dessus des 12,31 €", () => {
    expect(plusBasSalaireDeLAnnee()).toBe(1_900);
    expect(attendus(ch, "le-smic")).toEqual([12.53, 0.22]);
  });
});

describe("les écarts du réalisé, refaits à la main", () => {
  it("le remplaçant le 1er mai, le cinquième à 1 950 € : 2 403 € d'écart = 1 948,83 sur effectif − 34,58 de structure + 488,75 sur salaire", () => {
    const e = ecartsDeLaMasse();
    expect(e.reel.brute).toBe(cent(109_158.5 - 13_414 + 5 * 1_900 + 3 * 1_938 - 19_114 + 7 * 1_950 + 3 * 1_989));
    expect(e.total).toBe(2_403);
    // Prévu : 39 mois d'anciens (76 630,50 €) et 17 mois de recrues (32 528 €) ; réel : 39 et 18.
    expect([e.prevu.categories.anciens.mois, e.prevu.categories.recrues.mois, e.reel.categories.recrues.mois]).toEqual([39, 17, 18]);
    const moyen = 109_158.5 / 56;
    expect(e.effectif).toBe(cent(moyen));
    expect(e.structure).toBe(cent(39 * (76_630.5 / 39) + 18 * (32_528 / 17) - 57 * moyen));
    expect(e.salaire).toBe(cent(e.reel.categories.recrues.masse - 18 * (32_528 / 17)));
    expect(cent(e.effectif + e.structure + e.salaire)).toBe(e.total);
    expect(attendus(ch, "le-controle-de-la-masse")).toEqual([e.total, e.effectif, e.structure, e.salaire]);
    expect(juste(ch, "lire-les-ecarts")).toEqual(["Du mois en plus payé à une recrue"]);
    expect(juste(ch, "la-note-a-la-direction")).toEqual(["L'écart tient d'abord à un mois de poste pourvu en plus"]);
  });
});

describe("le cas dédié : la hausse avancée en juillet", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_HAUSSE_AVANCEE_EN_JUILLET);
    expect(casDuChapitre(ch.code)).toBe(LA_HAUSSE_AVANCEE_EN_JUILLET);
    gardeDuCas(LA_HAUSSE_AVANCEE_EN_JUILLET, ch);
  });

  it("en juillet : niveau 4,04 %, masse 3,02 % (au-delà de 2,6 %), report 0,99 % ; le budget coûte 583,50 € bruts de plus", () => {
    expect(attendus(LA_HAUSSE_AVANCEE_EN_JUILLET, "les-effets-en-juillet")).toEqual([4.04, 3.02, 0.99]);
    const n = hausseEnJuillet(NOVA);
    // Trois mois de plus à 2 % : les deux stables (2 × 3 × 38,25), le promu (3 × 42), les deux recrues (2 × 3 × 38).
    expect(n.surcoutBrut).toBe(cent(2 * 3 * 38.25 + 3 * 42 + 2 * 3 * 38));
    expect(attendus(LA_HAUSSE_AVANCEE_EN_JUILLET, "ce-que-coute-juillet")).toEqual([cent(109_158.5 + n.surcoutBrut), n.surcoutBrut, cent(n.budget.chargee - budgetDeLaMasse().chargee)]);
    const r = etape(LA_HAUSSE_AVANCEE_EN_JUILLET, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Non en juillet : l'enveloppe ne le permet pas"]);
  });
});
