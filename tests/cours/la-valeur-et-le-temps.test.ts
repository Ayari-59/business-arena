import { describe, expect, it } from "vitest";
import { LA_VALEUR_ET_LE_TEMPS, grilleDesInteretsComposes, valeurDuChapitre } from "../../src/config/cours/chapitres/la-valeur-et-le-temps";
import { LE_MARCHE_FINANCIER } from "../../src/config/cours/chapitres/le-marche-financier";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_COMPTE_A_TERME_PROGRESSIF, compteDuCas } from "../../src/config/cours/situations/par-chapitre/le-compte-a-terme-progressif";
import {
  annuiteDeRemboursement,
  annuitePourConstituer,
  offreEchelonnee,
  reserveDeRenouvellement,
  tauxReel,
  valeurAcquiseDesAnnuites,
  valeurActuelleDesAnnuites,
} from "../../src/config/cours/monde/valeur-et-temps";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LA VALEUR ET LE TEMPS (DCG UE6 2.1), chez NOVA : chaque chiffre refait à la main. Le compte à terme
 * de 133 000 € à 3 % ; la première ligne de 60 000 €, à remplacer fin N+5 par 5 versements à 3 % ;
 * l'inflation de 2 % ; l'offre du fournisseur, 5 annuités de 35 000 € pour 150 000 € comptant, jugée
 * au taux de la banque, 5 %.
 */

const ch = LA_VALEUR_ET_LE_TEMPS;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("la valeur et le temps : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, à la fin du programme de la comptabilité générale (palier 4), au thème de l'analyse financière, et cite la DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    const programme = PROGRAMME["comptabilite-generale"][4]!;
    expect(programme[programme.indexOf(ch.titre) + 1]).toBe(LE_MARCHE_FINANCIER.titre);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("mène au marché financier et à la VAN, et propose son cas", () => {
    expect(suitesDuChapitre(ch.code).ensuite.map((l) => l.code)).toEqual(["le-marche-financier", "la-valeur-actuelle-nette"]);
    expect(suitesDuChapitre(ch.code).situations.map((s) => s.code)).toEqual([LE_COMPTE_A_TERME_PROGRESSIF.code]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const src of [ch, LE_COMPTE_A_TERME_PROGRESSIF]) {
      for (const e of chapitreDuCas(src, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("capitaliser, refait à la main", () => {
  it("intérêts simples : 3 934,58 € courus en 355 jours sur 360 (ceux de la clôture), 1 995 € pour 6 mois", () => {
    expect(c((133_000 * 0.03 * 355) / 360)).toBe(3_934.58);
    expect(attendus(ch, "les-interets-simples")).toEqual([3_934.58, 1_995]);
  });

  it("intérêts composés : 136 990 €, 141 099,70 €, 145 332,69 € ; 144 970 € en intérêts simples", () => {
    const g = grilleDesInteretsComposes(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[2]!.valeur)).toEqual([136_990, 141_099.7, 145_332.69]);
    expect(c(133_000 * 1.03 ** 3)).toBe(145_332.69);
    expect(c(133_000 * (1 + 3 * 0.03))).toBe(144_970);
    expect(juste(ch, "predire-le-compose")).toEqual(["Laisser les intérêts sur le compte"]);
  });
});

describe("actualiser et réunir un capital, refait à la main", () => {
  it("60 000 € dans 5 ans valent 51 756,53 € à 3 %, 38 995,88 € à 9 %", () => {
    expect(c(60_000 * 1.03 ** -5)).toBe(51_756.53);
    expect(c(60_000 * 1.09 ** -5)).toBe(38_995.88);
    expect(attendus(ch, "actualiser")).toEqual([51_756.53, 38_995.88]);
  });

  it("5 versements à 3 % : un coefficient de 5,3091, 11 301,27 € par an", () => {
    const s = (1.03 ** 5 - 1) / 0.03;
    expect(Math.round(s * 10_000) / 10_000).toBe(5.3091);
    expect(c(60_000 / s)).toBe(11_301.27);
    expect(attendus(ch, "le-versement-annuel")).toEqual([5.3091, 11_301.27]);
    expect(annuitePourConstituer(60_000, 0.03, 5)).toBe(11_301.27);
  });

  it("avec 2 % d'inflation : la ligne coûtera 66 244,85 €, le taux réel est de 0,98 %, il faut 12 477,52 € par an", () => {
    expect(c(60_000 * 1.02 ** 5)).toBe(66_244.85);
    expect(c(100 * (1.03 / 1.02 - 1))).toBe(0.98);
    expect(attendus(ch, "le-taux-reel")).toEqual([66_244.85, 0.98]);
    expect(c(66_244.85 / ((1.03 ** 5 - 1) / 0.03))).toBe(12_477.52);
    expect(reserveDeRenouvellement().versementNecessaire).toBe(12_477.52);
    expect(c(100 * tauxReel(0.03, 0.03))).toBe(0);
    expect(juste(ch, "predire-l-inflation")).toEqual(["Non, il manquera de l'argent"]);
  });

  it("le défi : 12 500 € réunissent 66 364,20 € ; 12 000 € n'en réunissent que 63 709,63 €", () => {
    expect(valeurAcquiseDesAnnuites(12_500, 0.03, 5)).toBe(66_364.2);
    expect(valeurAcquiseDesAnnuites(12_000, 0.03, 5)).toBe(63_709.63);
    expect(valeurDuChapitre(NOVA).suffit).toBe(12_500);
    expect(valeurDuChapitre(NOVA).versementArrondi).toBe(11_500);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-reserve");
  });
});

describe("évaluer une dette, refait à la main", () => {
  const va = (t: number) => c((35_000 * (1 - (1 + t) ** -5)) / t);

  it("au taux de la banque, les 5 annuités de 35 000 € valent 151 531,68 €, 1 531,68 € de plus que le comptant", () => {
    expect(va(0.05)).toBe(151_531.68);
    expect(attendus(ch, "l-offre-du-fournisseur")).toEqual([151_531.68, 1_531.68]);
  });

  it("le taux actuariel : entre 5,3 % (150 283,24 €) et 5,4 % (149 870,70 €), 5,37 % par interpolation", () => {
    expect(va(0.053)).toBe(150_283.24);
    expect(va(0.054)).toBe(149_870.7);
    const t = 5.3 + (0.1 * (150_283.24 - 150_000)) / (150_283.24 - 149_870.7);
    expect(attendus(ch, "le-taux-actuariel")).toEqual([150_283.24, 149_870.7, c(t)]);
    expect(c(t)).toBe(5.37);
    expect(c(100 * offreEchelonnee().tauxActuariel)).toBe(5.37);
    expect(juste(ch, "predire-le-taux")[0]).toMatch(/^Plus haut que 5\s%$/);
    gardeDuCurseur(ch, "le-taux-au-curseur", 54);
  });

  it("l'annuité constante de la banque : 34 646,22 €, 353,78 € de moins par an ; la créance vaut 147 432,73 € à 6 %", () => {
    expect(c((150_000 * 0.05) / (1 - 1.05 ** -5))).toBe(34_646.22);
    expect(annuiteDeRemboursement(150_000, 0.05, 5)).toBe(34_646.22);
    expect(attendus(ch, "l-annuite-de-la-banque")).toEqual([34_646.22, 353.78]);
    expect(valeurActuelleDesAnnuites(35_000, 0.06, 5)).toBe(147_432.73);
    expect(juste(ch, "evaluer-un-actif")).toEqual(["Ses flux futurs, actualisés au taux exigé"]);
  });

  it("le chapitre se calcule une fois", () => {
    expect(valeurDuChapitre(NOVA)).toBe(valeurDuChapitre(NOVA));
  });
});

describe("le cas dédié : le compte à terme progressif", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_COMPTE_A_TERME_PROGRESSIF);
    gardeDuCas(LE_COMPTE_A_TERME_PROGRESSIF, ch);
  });

  it("50 000 € à 2 % puis 4,2 % : 51 000 €, 53 142 € ; 53 045 € à 3 % fixe ; 3,09 % l'an (et non 3,1 %), 1,07 % réel", () => {
    const k = compteDuCas();
    expect(c(50_000 * 1.02)).toBe(51_000);
    expect(c(50_000 * 1.02 * 1.042)).toBe(53_142);
    expect(c(50_000 * 1.03 ** 2)).toBe(53_045);
    const t = Math.sqrt(53_142 / 50_000) - 1;
    expect(c(100 * t)).toBe(3.09);
    expect(c(100 * k.moyenne)).toBe(3.1);
    const montants = (id: string) => etape(chapitreDuCas(LE_COMPTE_A_TERME_PROGRESSIF, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-valeurs-acquises")).toEqual([51_000, 53_142, 53_045]);
    expect(montants("les-taux")).toEqual([3.09, c(100 * ((1 + t) / 1.02 - 1))]);
    expect(c(100 * ((1 + t) / 1.02 - 1))).toBe(1.07);
    const r = etape(LE_COMPTE_A_TERME_PROGRESSIF, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Le progressif, de peu : 3,09 % l'an"]);
  });
});
