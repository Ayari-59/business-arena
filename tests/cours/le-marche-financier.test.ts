import { describe, expect, it } from "vitest";
import { ARBITRER_LES_COUTS_DE_FINANCEMENT } from "../../src/config/cours/chapitres/arbitrer-les-couts-de-financement";
import { LE_MARCHE_FINANCIER, grilleDuRisque, marcheDuChapitre } from "../../src/config/cours/chapitres/le-marche-financier";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { L_OBLIGATION_VERTE_A_980, obligationAAcheter } from "../../src/config/cours/situations/par-chapitre/l-obligation-verte-a-980";
import { coursDeLObligation, rendementDeLObligation, OBLIGATION_UN_AN_PLUS_TARD, OBLIGATION_VERTE } from "../../src/config/cours/monde/marche-financier";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LE MARCHÉ FINANCIER : COURS, TAUX ET RISQUE (DCG UE6 3.4 et 4.3), chez NOVA, par son fournisseur
 * coté : chaque chiffre refait à la main. L'obligation verte de 1 000 € à 4 %, in fine à 5 ans ; un
 * an plus tard, 4 ans restants, le marché à 5 % ou à 3 %, un cours de 950 € ; l'action à 1,20 € de
 * dividende, 3 % de croissance, 9 % exigés ; trois états de l'économie pour son risque.
 */

const ch = LE_MARCHE_FINANCIER;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
/** Le cours d'une obligation à la main : la somme des flux actualisés. */
const coursMain = (coupon: number, nominal: number, n: number, r: number) => c(Array.from({ length: n }, (_, k) => (coupon + (k === n - 1 ? nominal : 0)) / (1 + r) ** (k + 1)).reduce((s, x) => s + x, 0));

describe("le marché financier : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème de l'analyse financière, et cite la DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    const programme = PROGRAMME["comptabilite-generale"][4]!;
    expect(programme[programme.indexOf(ch.titre) + 1]).toBe(ARBITRER_LES_COUTS_DE_FINANCEMENT.titre);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["la-valeur-et-le-temps"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("mène aux coûts de financement, et propose son cas", () => {
    expect(suitesDuChapitre(ch.code).ensuite).toEqual([{ code: ARBITRER_LES_COUTS_DE_FINANCEMENT.code, titre: ARBITRER_LES_COUTS_DE_FINANCEMENT.titre }]);
    expect(suitesDuChapitre(ch.code).situations.map((s) => s.code)).toEqual([L_OBLIGATION_VERTE_A_980.code]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const src of [ch, L_OBLIGATION_VERTE_A_980]) {
      for (const e of chapitreDuCas(src, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("l'organisation : l'émission finance, le titre vert se lit à l'usage des fonds, la note mesure le risque de crédit", () => {
    expect(juste(ch, "primaire-ou-secondaire")).toEqual(["L'émission, sur le marché primaire"]);
    expect(juste(ch, "le-titre-vert")).toEqual(["L'usage de ses fonds, suivi et publié"]);
    expect(juste(ch, "notation-et-indices")).toEqual(["Le risque que l'émetteur ne rembourse pas"]);
  });
});

describe("l'obligation, refaite à la main", () => {
  it("un coupon de 40 € ; au taux de 4 %, l'obligation vaut le pair", () => {
    expect(coursMain(40, 1_000, 5, 0.04)).toBe(1_000);
    expect(attendus(ch, "le-cours-a-l-emission")).toEqual([40, 1_000]);
  });

  it("un an plus tard, 4 ans restants : 964,54 € si le marché monte à 5 %, 1 037,17 € s'il baisse à 3 %", () => {
    expect(coursMain(40, 1_000, 4, 0.05)).toBe(964.54);
    expect(coursMain(40, 1_000, 4, 0.03)).toBe(1_037.17);
    expect(attendus(ch, "le-cours-quand-les-taux-bougent")).toEqual([964.54, 1_037.17]);
    expect(juste(ch, "predire-le-cours")).toEqual(["Il baisse"]);
  });

  it("le laboratoire : à 4 ans, l'obligation passe sous 950 € à 5,5 % (947,42 €), pas à 5 % ; plus l'échéance est loin, plus elle est sensible", () => {
    expect(coursMain(40, 1_000, 4, 0.055)).toBe(947.42);
    gardeDuLaboratoire(ch, "le-laboratoire-de-l-obligation");
    expect(coursDeLObligation({ ...OBLIGATION_VERTE, dureeRestante: 1 }, 0.06)).toBe(981.13);
    expect(coursDeLObligation({ ...OBLIGATION_VERTE, dureeRestante: 10 }, 0.06)).toBe(852.8);
  });

  it("achetée 950 € : entre 5,4 % (950,81 €) et 5,5 % (947,42 €), un rendement actuariel de 5,42 %", () => {
    expect(coursMain(40, 1_000, 4, 0.054)).toBe(950.81);
    const t = 5.4 + (0.1 * (950.81 - 950)) / (950.81 - 947.42);
    expect(attendus(ch, "le-rendement-actuariel")).toEqual([950.81, 947.42, c(t)]);
    expect(c(t)).toBe(5.42);
    expect(c(100 * rendementDeLObligation(OBLIGATION_UN_AN_PLUS_TARD, 950))).toBe(5.42);
    gardeDuCurseur(ch, "le-rendement-au-curseur", 55);
  });
});

describe("l'action, refaite à la main", () => {
  it("1,20 € ÷ (9 % − 3 %) = 20 € ; 17,14 € à 10 % ; 15 € si la croissance tombe à 1 %", () => {
    expect(c(1.2 / (0.09 - 0.03))).toBe(20);
    expect(c(1.2 / (0.1 - 0.03))).toBe(17.14);
    expect(c(1.2 / (0.09 - 0.01))).toBe(15);
    expect(attendus(ch, "le-cours-de-l-action")).toEqual([20, 17.14, 15]);
    expect(juste(ch, "l-information")[0]).toMatch(/^Il tombe vers 15\s€ dès l'annonce$/);
  });

  it("le risque : une espérance de 9 %, une variance de 99, un écart-type de 9,95 %, une fourchette de −0,95 % à 18,95 %", () => {
    const p = [0.25, 0.5, 0.25];
    const r = [-6, 10, 22];
    const e = p.reduce((s, x, i) => s + x * r[i]!, 0);
    expect(e).toBe(9);
    const v = p.reduce((s, x, i) => s + x * (r[i]! - e) ** 2, 0);
    expect(v).toBe(99);
    expect(c(Math.sqrt(v))).toBe(9.95);
    const g = grilleDuRisque(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.at(-1)!.cellules.map((x) => x.valeur)).toEqual([1, null, 9, 99]);
    expect(attendus(ch, "l-ecart-type")).toEqual([9.95, -0.95, 18.95]);
    expect(juste(ch, "diversifier")).toEqual(["Le risque propre à chaque entreprise"]);
  });

  it("le chapitre se calcule une fois", () => {
    expect(marcheDuChapitre(NOVA)).toBe(marcheDuChapitre(NOVA));
  });
});

describe("le cas dédié : l'obligation verte à 980 €", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(L_OBLIGATION_VERTE_A_980);
    gardeDuCas(L_OBLIGATION_VERTE_A_980, ch);
  });

  it("3 ans restants, achetée 980 € : 40 € de coupon, 1 400 € de gain pour dix, 4,73 % de rendement contre 3 %", () => {
    expect(coursMain(40, 1_000, 3, 0.047)).toBe(980.83);
    expect(coursMain(40, 1_000, 3, 0.048)).toBe(978.13);
    const t = 4.7 + (0.1 * (980.83 - 980)) / (980.83 - 978.13);
    const x = obligationAAcheter();
    expect(c(100 * x.rendement)).toBe(4.73);
    const champs = etape(chapitreDuCas(L_OBLIGATION_VERTE_A_980, NOVA), "le-rendement", "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(champs).toEqual([40, 10 * (3 * 40 + 20), c(t)]);
    expect(c(9_800 * (1.03 ** 3 - 1))).toBe(908.72);
    const r = etape(L_OBLIGATION_VERTE_A_980, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["L'obligation : 4,73 % par an, pour un risque de crédit modéré"]);
  });
});
