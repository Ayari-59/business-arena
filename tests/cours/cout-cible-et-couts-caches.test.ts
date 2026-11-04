import { describe, expect, it } from "vitest";
import { COUT_CIBLE_ET_COUTS_CACHES, defiDeLaValeurAtteint, laboratoireDuChapitre } from "../../src/config/cours/chapitres/cout-cible-et-couts-caches";
import { PILOTER_UN_CENTRE } from "../../src/config/cours/chapitres/piloter-un-centre";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE, casDuChapitre } from "../../src/config/cours/situations";
import { LE_CONCURRENT_LANCE_UNE_NOMADE, nomadeDuConcurrent } from "../../src/config/cours/situations/par-chapitre/le-concurrent-lance-une-nomade";
import { acceptabiliteDesPrix, chmcv, coutDUneHeureSupplementaire, coutsCachesDeNPlus1, valeurDuProjet, valeurDeLaGoLancee } from "../../src/config/cours/monde/valeur-et-couts-caches";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * COÛT CIBLE, ANALYSE DE LA VALEUR ET COÛTS CACHÉS (la Go de NOVA, puis son année N + 1) : chaque
 * chiffre refait à la main, à partir de la Go de « Piloter un centre » (34 €, 15 € de marge, 19 € de
 * coût cible ; quatre fonctions à 40, 30, 20 et 10 % ; 23,50 € estimés, 19 € retenus) et des fiches de
 * N + 1 (26 000 enceintes à 21 € de marge, 4 opérateurs à 1 875 € pour 151,67 heures ; 244 heures
 * d'absence ; le départ d'un opérateur, 24 975 € ; 910 défauts au budget de prévention actuel).
 */

const ch = COUT_CIBLE_ET_COUTS_CACHES;
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;

describe("coût cible et coûts cachés : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite la DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["piloter-un-centre", "le-cout-de-la-non-qualite"]);
    expect(ch.ensuite).toEqual(["les-indicateurs-de-durabilite"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const k of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(k)), `objectif ${k}`).toBe(true);
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LE_CONCURRENT_LANCE_UNE_NOMADE]) {
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

describe("le coût cible et l'analyse de la valeur, refaits à la main", () => {
  it("l'enquête : 15, 45, 70, 30 et 0 % d'acceptabilité, le plus haut à 34 €, le prix de la Go", () => {
    const a = acceptabiliteDesPrix();
    expect(a.lignes.map((l) => cent(l.acceptabilite * 100))).toEqual([15, 45, 70, 30, 0]);
    expect(a.prix).toBe(34);
    expect(juste(ch, "le-prix-du-marche").map((t) => t.replace(/\s/g, " "))).toEqual(["34 €, le prix le plus accepté"]);
  });

  it("le coût plus marge : 23,50 + 15 = 38,50 €, soit 39 € au curseur", () => {
    gardeDuCurseur(ch, "le-prix-du-cout-plus-marge", 39);
    expect(juste(ch, "predire-le-prix").map((t) => t.replace(/\s/g, " "))).toEqual(["Entre 36 et 40 €"]);
  });

  it("le coût cible de « Piloter un centre » : 19 €, 4,50 € d'écart, 19,1 % de baisse", () => {
    expect(attendus(ch, "le-cout-cible-de-la-go")).toEqual([19, 4.5, 19.1]);
    expect(attendus(PILOTER_UN_CENTRE, "le-cout-cible").slice(0, 2)).toEqual([19, 4.5]);
  });

  it("les indices du projet : 0,4 ÷ (7,20 ÷ 23,50) = 1,31 ; 0,85 ; 1,15 ; 0,60 ; la Go lancée à 1 partout", () => {
    expect(valeurDuProjet().parFonction.map((f) => cent(f.indice))).toEqual([cent(0.4 / (7.2 / 23.5)), cent(0.3 / (8.3 / 23.5)), cent(0.2 / (4.1 / 23.5)), cent(0.1 / (3.9 / 23.5))]);
    expect(valeurDuProjet().parFonction.map((f) => cent(f.indice))).toEqual([1.31, 0.85, 1.15, 0.6]);
    for (const f of valeurDeLaGoLancee().parFonction) expect(f.indice).toBeCloseTo(1, 12);
    const g = etape(ch, "les-indices-de-valeur", "a-completer").grille(NOVA);
    expect(g.lignes.slice(0, 4).map((l) => l.cellules[2]!.valeur)).toEqual([30.64, 35.32, 17.45, 16.6]);
    expect(juste(ch, "lire-les-indices")).toEqual(["Un module plus simple, qui garde la connexion"]);
    expect(juste(ch, "predire-l-equilibre")).toEqual(["1 pour chacune"]);
  });

  it("le laboratoire : le premier projet échoue, la Go lancée réussit ; la batterie seule ne suffit pas", () => {
    const e = etape(ch, "le-laboratoire-de-la-valeur", "simulation");
    const depart = Object.fromEntries(e.leviers(NOVA).map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ son: 7.2, autonomie: 8.3, connexion: 3.9 });
    const d = e.defi(NOVA);
    expect(d.solution).toEqual({ son: 7.6, autonomie: 5.7, connexion: 1.9 });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    expect(laboratoireDuChapitre(d.solution).total).toBe(19);
    // La batterie au plus bas, le reste au projet : 7,20 + 4,50 + 3,80 + 3,90 = 19,40 €, au-dessus du coût cible.
    expect(laboratoireDuChapitre({ son: 7.2, autonomie: 4.5, connexion: 3.9 }).total).toBe(19.4);
    expect(defiDeLaValeurAtteint({ son: 7.2, autonomie: 4.5, connexion: 3.9 })).toBe(false);
  });
});

describe("les coûts cachés de N + 1, refaits à la main", () => {
  it("la CHMCV : 26 000 × 21 = 546 000 € ÷ (4 × 151,67 × 12 = 7 280,16 heures) = 75 € de l'heure", () => {
    const h = chmcv();
    expect([h.production, h.marge, h.heures, h.valeur]).toEqual([26_000, 546_000, 7_280.16, cent(546_000 / 7_280.16)]);
    expect(h.valeur).toBe(75);
    expect(attendus(ch, "la-chmcv")).toEqual([546_000, 75, 122 * 75, 40 * 75]);
  });

  it("le tri : chaque coût dans son composant", () => {
    expect(Object.values(triDe(ch, "ranger-les-couts-caches"))).toEqual(["sursalaires", "nonProduction", "surconsommations", "nonProduction", "sursalaires", "surtemps", "surconsommations", "nonCreation", "surtemps"]);
  });

  it("le tableau : 11 826,68 + 0 + 24 975 + 44 226 + 3 000 = 84 027,68 €, 21 006,92 € par opérateur", () => {
    expect(coutDUneHeureSupplementaire()).toBe(cent((1_875 / 151.67) * 1.25 * 1.42));
    const k = coutsCachesDeNPlus1();
    expect(k.parDysfonctionnement).toEqual({ absenteisme: cent(122 * 21.94 + 122 * 75), accidents: 0, rotation: 3_000 + 27_300 - 5_325, nonQualite: 14_560 + 18_200 + 11_466, productivite: 3_000 });
    expect(k.total).toBe(84_027.68);
    expect([k.surcharges, k.nonProduits]).toEqual([cent(2_676.68 - 5_325 + 3_000 + 14_560 + 18_200 + 3_000), cent(9_150 + 27_300 + 11_466)]);
    expect(k.parSalarie).toBe(cent(84_027.68 / 4));
    expect(k.masseChargee).toBe(127_800);
    const g = etape(ch, "le-tableau-des-couts-caches", "a-completer").grille(NOVA);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([k.surcharges, k.nonProduits, 84_027.68]);
    expect(juste(ch, "lire-les-couts-caches")).toEqual(["La non-qualité, la moitié des coûts cachés"]);
    expect(juste(ch, "ce-que-cache-une-economie")).toEqual(["L'économie visible ferait monter des coûts cachés"]);
  });
});

describe("le cas dédié : le concurrent lance une nomade", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_CONCURRENT_LANCE_UNE_NOMADE);
    expect(casDuChapitre(ch.code)).toBe(LE_CONCURRENT_LANCE_UNE_NOMADE);
    gardeDuCas(LE_CONCURRENT_LANCE_UNE_NOMADE, ch);
  });

  it("à 32 € : 17 € de coût cible, 2 € à trouver, 13 € de marge sans rien faire ; 6,80, 5,10, 3,40 et 1,70 € par fonction", () => {
    expect(attendus(LE_CONCURRENT_LANCE_UNE_NOMADE, "le-nouveau-cout-cible")).toEqual([17, 2, 13]);
    expect(attendus(LE_CONCURRENT_LANCE_UNE_NOMADE, "par-fonction")).toEqual([6.8, 5.1, 3.4, 1.7]);
    expect(nomadeDuConcurrent(NOVA).batterie.cout).toBe(3.7);
    const r = etape(LE_CONCURRENT_LANCE_UNE_NOMADE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Trouver 2 €, fonction par fonction"]);
  });
});
