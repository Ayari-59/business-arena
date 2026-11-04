import { describe, expect, it } from "vitest";
import { LE_BFR_D_EXPLOITATION_NORMATIF } from "../../src/config/cours/chapitres/le-bfr-d-exploitation-normatif";
import { LES_ACTEURS_ET_LES_MODES_DE_FINANCEMENT, SOLUTION_DU_MONTAGE, montageDuLaboratoire } from "../../src/config/cours/chapitres/les-acteurs-et-les-modes-de-financement";
import { BESOIN_EXTERNE, montage, montageTenable, pretGaranti, sansGarantie } from "../../src/config/cours/monde/acteurs-du-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_BANQUE_DEMANDE_UNE_GARANTIE } from "../../src/config/cours/situations/par-chapitre/la-banque-demande-une-garantie";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LES ACTEURS ET LES MODES DE FINANCEMENT (DCG UE6 3.1 et 3.2) : chaque chiffre refait à la main, à
 * partir des 80 000 € qui manquent au plan de la gamme, des conditions des chapitres de NOVA (banque à
 * 5 % sur 5 ans en parts égales ; compte courant à 3 % sur 5 ans, 40 000 € au plus ; prêt participatif
 * à 6 % sur 4 ans, en une fois ; 5 000 actions nouvelles à 12 € ; emprunt de création, 68 000 € restant
 * dus, 17 trimestres à 1,25 % ; loyer de 19 700 € par mois) et des hypothèses du chapitre (Bpifrance à
 * 5,5 % sur 6 ans dont un an de différé ; prêt vert à 4,5 %, certification de 2 000 € prise à moitié
 * par l'ADEME ; garantie de Bpifrance à 1 % l'an sur la moitié du capital restant dû).
 */

const ch = LES_ACTEURS_ET_LES_MODES_DE_FINANCEMENT;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("les acteurs et les modes de financement : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), en fin de liste, au thème, et cite la DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["le-plan-de-financement", "financer-autrement"]);
    for (const p of ch.prerequis!) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("« Le BFR d'exploitation normatif » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(LE_BFR_D_EXPLOITATION_NORMATIF.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, LA_BANQUE_DEMANDE_UNE_GARANTIE]) {
      for (const e of chapitreDuCas(x, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("les acteurs et les engagements, refaits à la main", () => {
  it("le besoin : les 80 000 € qui équilibrent le plan de la gamme", () => {
    expect(BESOIN_EXTERNE).toBe(80_000);
  });

  it("le tri : quatre familles, Bpifrance, la région, l'ADEME et le certificateur dans la dernière", () => {
    const t = triDe(ch, "les-acteurs");
    expect(Object.values(t).filter((x) => x === "intermediaire")).toHaveLength(3);
    expect(Object.values(t).filter((x) => x === "capital")).toHaveLength(3);
    expect(t["Les fondateurs, en compte courant"]).toBe("associes");
    expect(Object.values(t).filter((x) => x === "public")).toHaveLength(4);
    expect(juste(ch, "le-risque")).toEqual(["La business angel, devenue associée"]);
    expect(juste(ch, "hors-de-portee")).toEqual(["Leurs tickets dépassent de loin son besoin"]);
  });

  it("la banque : 12 000 € d'intérêts, 92 000 € à rendre, 20 000 € la première année ; le prêt participatif : 19 200 € et 4 800 €", () => {
    const interets = 80_000 * 0.05 * ((5 + 4 + 3 + 2 + 1) / 5);
    expect(attendus(ch, "les-engagements")).toEqual([interets, 80_000 + interets, 16_000 + 4_000, 80_000 * 0.06 * 4, 80_000 * 0.06]);
    expect(attendus(ch, "les-engagements")).toEqual([12_000, 92_000, 20_000, 19_200, 4_800]);
    expect(juste(ch, "predire-les-engagements")).toEqual(["Bien plus que la banque"]);
  });

  it("ce que NOVA doit déjà : 7 650 € d'intérêts à venir, 75 650 € d'emprunt, 312 050 € avec le bail", () => {
    const interets = 4_000 * ((17 * 18) / 2) * 0.0125;
    expect(interets).toBe(7_650);
    expect(attendus(ch, "les-engagements-en-cours")).toEqual([7_650, 68_000 + 7_650, 75_650 + 12 * 19_700]);
  });

  it("Bpifrance, 40 000 € : 2 200 € la première année, 8 800 € d'intérêts, 48 800 € à rendre", () => {
    const interets = 40_000 * 0.055 + 0.055 * 8_000 * (5 + 4 + 3 + 2 + 1);
    expect(attendus(ch, "le-pret-de-bpifrance")).toEqual([2_200, c(interets), c(40_000 + interets)]);
    expect(c(interets)).toBe(8_800);
  });

  it("le prêt vert : 0,5 point épargne 15 € par millier, la certification nette vaut 1 000 €, seuil à 67 milliers", () => {
    expect(c(1_000 * 0.005 * 3)).toBe(15);
    expect(66 * 15).toBeLessThan(1_000);
    expect(67 * 15).toBeGreaterThanOrEqual(1_000);
    gardeDuCurseur(ch, "le-pret-vert-au-curseur", 67);
    expect(juste(ch, "predire-le-pret-vert")).toEqual(["Oui, de peu"]);
  });

  it("la business angel : 5 000 actions, 25 %, une part des capitaux propres de 72 306,49 €", () => {
    const cp = 150_000 + 79_225.96;
    expect(attendus(ch, "la-business-angel")).toEqual([5_000, 25, c((cp + 60_000) * 0.25)]);
    expect(attendus(ch, "la-business-angel")[2]).toBe(72_306.49);
  });

  it("le laboratoire : 40 000 € en compte courant et 40 000 € à la banque, 11 200 € la première année, 12 000 € d'intérêts", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-montage");
    const m = montage(SOLUTION_DU_MONTAGE);
    expect(m.premiereAnnee).toBe(40_000 * 0.03 + 8_000 + 40_000 * 0.05);
    expect(m.interets).toBe(40_000 * 0.03 * 5 + 6_000);
    expect(m.partDesFondateurs).toBe(1);
    expect(montageTenable(montage())).toBe(false);
    expect(montageTenable(montageDuLaboratoire({ capital: 0, compteCourant: 30_000, bpifrance: 0 }))).toBe(false);
    expect(montageTenable(montageDuLaboratoire({ capital: 0, compteCourant: 0, bpifrance: 40_000 }))).toBe(false);
    expect(montageTenable(montageDuLaboratoire({ capital: 60_000, compteCourant: 0, bpifrance: 0 }))).toBe(true);
    expect(juste(ch, "la-solution").map((t) => t.replace(/\s/g, " "))).toEqual(["40 000 € en compte courant, 40 000 € à la banque"]);
  });
});

describe("le cas dédié : la banque demande une garantie", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_BANQUE_DEMANDE_UNE_GARANTIE);
    gardeDuCas(LA_BANQUE_DEMANDE_UNE_GARANTIE, ch);
  });

  it("la garantie : 1 200 € de commission, 93 200 € à rendre, 20 400 € la première année ; sans garantie : 94 700 € et 14 300 €", () => {
    const commission = 0.01 * 0.5 * (80_000 + 64_000 + 48_000 + 32_000 + 16_000);
    expect(commission).toBe(1_200);
    const montants = (id: string) => etape(chapitreDuCas(LA_BANQUE_DEMANDE_UNE_GARANTIE, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("la-garantie")).toEqual([1_200, 92_000 + 1_200, 20_000 + 400]);
    const interets = 50_000 * 0.05 * 3 + 30_000 * 0.06 * 4;
    expect(montants("sans-garantie")).toEqual([interets, 80_000 + interets, 10_000 + 2_500 + 1_800]);
    expect(pretGaranti(80_000).aRendre).toBe(93_200);
    expect(sansGarantie().aRendre).toBe(94_700);
    const r = etape(LA_BANQUE_DEMANDE_UNE_GARANTIE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["La banque et le prêt participatif"]);
  });
});
