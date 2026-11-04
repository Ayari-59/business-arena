import { describe, expect, it } from "vitest";
import { LE_TABLEAU_DE_FINANCEMENT } from "../../src/config/cours/chapitres/le-tableau-de-financement";
import {
  LE_TABLEAU_DES_FLUX_DE_TRESORERIE,
  SOLUTION_DES_FLUX,
  departDesFlux,
  fluxDuChapitre,
  grilleDesFlux,
  laboratoireDesFlux,
} from "../../src/config/cours/chapitres/le-tableau-des-flux-de-tresorerie";
import { EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { tableauDeFinancement, tableauDesFlux } from "../../src/config/cours/monde/tableaux-de-flux";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_DIVIDENDE_DE_L_ASSOCIE, dividendeDeLAssocie } from "../../src/config/cours/situations/par-chapitre/le-dividende-de-l-associe";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE TABLEAU DES FLUX DE TRÉSORERIE DU PREMIER EXERCICE DE NOVA (modèle de l'Ordre des
 * experts-comptables, méthode indirecte), refait à la main : le résultat net, 79 225,96 € ; les
 * dotations, 9 861,11 € aux amortissements, 5 000 € à la provision, 11 210 € à la dépréciation de
 * Sonora ; le besoin du 31 décembre, 10 627,62 € en brut ; la ligne, l'apport, l'emprunt ; la
 * trésorerie de clôture, 252 669,45 €, celle du tableau de financement.
 */

const ch = LE_TABLEAU_DES_FLUX_DE_TRESORERIE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const f = EXERCICE_DE_NOVA;

describe("le tableau des flux : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!.at(-1)).toBe(ch.titre);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([LE_TABLEAU_DE_FINANCEMENT.code]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("« Le tableau de financement » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(LE_TABLEAU_DE_FINANCEMENT.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LE_DIVIDENDE_DE_L_ASSOCIE]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("les flux de l'exercice, refaits à la main", () => {
  it("la marge brute d'autofinancement : 79 225,96 + 9 861,11 + 5 000 = 94 087,07 €, la CAF moins la dépréciation de Sonora", () => {
    const x = tableauDesFlux(f);
    expect(x.margeBruteDAutofinancement).toBe(c(79_225.96 + 9_861.11 + 5_000));
    expect(c(x.caf - x.margeBruteDAutofinancement)).toBe(11_210);
    expect(attendus(ch, "la-mba")).toEqual([14_861.11, 94_087.07, 11_210]);
    expect(juste(ch, "predire-la-mba")).toEqual(["Plus petite que la CAF"]);
  });

  it("le flux de l'activité : le besoin net, 10 627,62 − 11 210 = −582,38 € ; 94 669,45 €, par la MBA comme par la CAF", () => {
    const x = tableauDesFlux(f);
    expect(x.besoinNetDeLActivite).toBe(c(10_627.62 - 11_210));
    expect(x.fluxDeLActivite).toBe(c(94_087.07 + 582.38));
    expect(x.fluxDeLActivite).toBe(c(105_297.07 - 10_627.62));
    expect(attendus(ch, "le-flux-de-l-activite")).toEqual([-582.38, 94_669.45, 94_669.45]);
  });

  it("l'investissement, −60 000 € ; le financement, 150 000 + 80 000 − 12 000 = 218 000 € ; la trésorerie, celle de la partie II", () => {
    const x = tableauDesFlux(f);
    expect(x.fluxDInvestissement).toBe(-60_000);
    expect(x.fluxDeFinancement).toBe(218_000);
    expect(x.variationDeTresorerie).toBe(c(94_669.45 - 60_000 + 218_000));
    expect(x.variationDeTresorerie).toBe(tableauDeFinancement(f).partie2.variationDeTresorerie);
    expect(x.tresorerieDeCloture).toBe(252_669.45);
  });

  it("la grille du tableau des flux tient ses totaux, et ses cellules sont celles de la main", () => {
    const g = grilleDesFlux(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([79_225.96, 14_861.11, 94_087.07, -582.38, 94_669.45, -60_000, 0, -60_000, 150_000, 80_000, -12_000, 0, 218_000, 252_669.45, 0, 252_669.45]);
  });

  it("le tri : les intérêts et l'impôt dans l'activité, l'emprunt et son remboursement dans le financement", () => {
    const t = triDe(ch, "trois-familles");
    expect(t["Les intérêts de l'emprunt payés"]).toBe("activite");
    expect(t["L'impôt sur les sociétés de l'année"]).toBe("activite");
    expect(t["Le capital remboursé aux échéances"]).toBe("financement");
    expect(t["Le paiement de la ligne de montage, hors taxes"]).toBe("investissement");
  });
});

describe("l'interprétation, refaite à la main", () => {
  it("l'excédent de trésorerie d'exploitation : 126 234 − 32 200,73 = 94 033,27 € ; l'écart, 636,18 €, le financier et l'impôt moins ce qui en reste dû", () => {
    expect(attendus(ch, "l-excedent-d-exploitation")).toEqual([c(126_234 - 32_200.73), 636.18]);
    expect(c(-194.93 - 20_742 + 20_742 + 831.11)).toBe(636.18);
  });

  it("le flux disponible : 34 669,45 €, 22 669,45 € après le remboursement ; le financement fait 86,28 % de la trésorerie gagnée", () => {
    expect(attendus(ch, "le-flux-disponible")).toEqual([34_669.45, 22_669.45, 86.28]);
    expect(c((218_000 / 252_669.45) * 100)).toBe(86.28);
  });

  it("sans le compte à terme, la trésorerie de clôture serait le seul compte courant, 115 734,87 €", () => {
    const x = fluxDuChapitre(NOVA);
    expect(x.compteCourant).toBe(115_734.87);
    expect(x.placement).toBe(c(133_000 + 3_934.58));
    expect(c(x.fluxDeLActivite - 3_934.58 - 60_000 - 133_000 + 218_000)).toBe(115_734.87);
  });
});

describe("le laboratoire : une charge calculée ne change pas la trésorerie de l'année", () => {
  it("aucun choix de clôture ne change le flux de l'activité ; seul le délai de CampusTech le fait", () => {
    const d = departDesFlux(f);
    expect(d).toEqual({ amortissement: 0, perte: 40, provision: 5_000, delaiCampusTech: 80 });
    for (const amortissement of [0, 1])
      for (const perte of [0, 40, 100])
        for (const provision of [0, 5_000, 12_000]) {
          const l = laboratoireDesFlux(f, { ...d, amortissement, perte, provision });
          expect(l.fluxDeLActivite, `${amortissement} ${perte} ${provision}`).toBe(94_669.45);
          expect(l.variationDeTresorerie).toBe(252_669.45);
        }
    expect(laboratoireDesFlux(f, { ...d, delaiCampusTech: 60 }).fluxDeLActivite).toBe(c(94_669.45 + 22_656));
  });

  it("la solution : le dégressif (17 500 €) et 80 % de perte (22 420 €) font 65 089,07 € de résultat ; CampusTech à 60 jours, 117 325,45 € de flux", () => {
    const avantImpot = c(99_967.96 - (17_500 - 9_861.11) - (22_420 - 11_210));
    const impot = Math.round(42_500 * 0.15 + (avantImpot - 42_500) * 0.25);
    expect(impot).toBe(16_030);
    const s = laboratoireDesFlux(f, { ...departDesFlux(f), ...SOLUTION_DES_FLUX });
    expect(s.resultatNet).toBe(c(avantImpot - impot));
    expect(s.fluxDeLActivite).toBe(117_325.45);
    gardeDuLaboratoire(chapitreDuCas(ch, NOVA), "le-laboratoire-des-flux");
  });
});

describe("le cas dédié : le dividende de l'associé", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_DIVIDENDE_DE_L_ASSOCIE);
    gardeDuCas(LE_DIVIDENDE_DE_L_ASSOCIE, ch);
  });

  it("2 € × 15 000 actions = 30 000 €, contre 22 669,45 € libérés par l'activité : 7 330,55 € viendraient de la création", () => {
    const n = dividendeDeLAssocie(NOVA);
    expect(n.dividende).toBe(30_000);
    expect(n.manque).toBe(c(30_000 - 22_669.45));
    const montants = (id: string) => etape(chapitreDuCas(LE_DIVIDENDE_DE_L_ASSOCIE, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-flux")).toEqual([94_669.45, -60_000, 34_669.45, 22_669.45]);
    expect(montants("la-part-du-dividende")).toEqual([30_000, 7_330.55]);
    const r = etape(LE_DIVIDENDE_DE_L_ASSOCIE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Possible, mais 7 330,55 € viendraient de l'apport et de l'emprunt"]);
  });
});
