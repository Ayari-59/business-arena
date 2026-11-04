import { describe, expect, it } from "vitest";
import { FINANCER_ET_PLACER, financementDuChapitre } from "../../src/config/cours/chapitres/financer-et-placer-la-tresorerie";
import { RATIOS_DE_STRUCTURE } from "../../src/config/cours/chapitres/ratios-de-structure-et-bilan-financier";
import { BESOIN_DE_JANVIER, CHAINE_ONDES, placement } from "../../src/config/cours/monde/financer-et-placer";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { UNE_CHAINE_NOUVELLE_A_60_JOURS } from "../../src/config/cours/situations/par-chapitre/une-chaine-nouvelle-a-60-jours";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * FINANCER ET PLACER LA TRÉSORERIE (NOVA en N+1) : chaque chiffre refait à la main, à partir de la TVA
 * de la gamme (190 000 € HT à 20 %), de la banque du cours (crédit d'un mois à 6 % par tranches de
 * 1 000 € et 50 € de frais, escompte à 9 % et 20 € par effet, 360 jours), des hypothèses du chapitre
 * (Dailly à 9,5 % et 30 € par bordereau ; affacturage à 1 %, 10 % de retenue, 7 % sur l'avance ;
 * compte à terme à 2,8 %, 0,5 % s'il est rompu ; fonds monétaire à 2,6 % ; impôt à 25 %) et des
 * factures de CampusTech (22 656 € TTC) et de Sonora du premier exercice.
 */

const ch = FINANCER_ET_PLACER;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const taux = (cout: number, recu: number, jours: number) => Math.round((cout / recu) * (360 / jours) * 10_000) / 100;

describe("financer et placer la trésorerie : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["equilibrer-la-tresorerie", "ratios-de-structure-et-bilan-financier"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("« Ratios de structure et bilan financier » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(RATIOS_DE_STRUCTURE.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, UNE_CHAINE_NOUVELLE_A_60_JOURS]) {
      for (const e of chapitreDuCas(x, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("le besoin de janvier, refait à la main", () => {
  it("la TVA de la gamme : 190 000 € × 20 % = 38 000 € pendant 60 jours", () => {
    expect(BESOIN_DE_JANVIER).toEqual({ montant: 38_000, jours: 60 });
    expect(juste(ch, "le-bon-outil")).toEqual(["Un crédit de trésorerie, renouvelé une fois"]);
  });

  it("le crédit renouvelé : 39 000 € deux fois, 195 € d'intérêts par mois, 490 € en tout, 7,55 % de taux réel", () => {
    expect(Math.ceil((38_000 + 50) / 1_000) * 1_000).toBe(39_000);
    // Au renouvellement : 38 000 + 195 d'intérêts + 50 de frais, encore 39 000 €.
    expect(Math.ceil((38_000 + 195 + 50) / 1_000) * 1_000).toBe(39_000);
    expect(c((39_000 * 0.06 * 30) / 360)).toBe(195);
    expect(attendus(ch, "le-credit-renouvele")).toEqual([39_000, 195, 490, taux(490, 38_950, 60)]);
    expect(taux(490, 38_950, 60)).toBe(7.55);
  });

  it("le curseur : escompter un effet de 22 656 € coûte au plus le crédit d'un mois (165 €) jusqu'à 25 jours", () => {
    expect(c((23_000 * 0.06 * 30) / 360 + 50)).toBe(165);
    expect(c((22_656 * 0.09 * 25) / 360 + 20)).toBe(161.6);
    expect(c((22_656 * 0.09 * 26) / 360 + 20)).toBeGreaterThan(165);
    gardeDuCurseur(ch, "l-escompte-au-curseur", 25);
    expect(financementDuChapitre(NOVA).escompteNov.cout).toBe(c(169.92 + 20));
    expect(juste(ch, "predire-l-escompte")).toEqual(["Le crédit, pour cette facture-là"]);
  });

  it("l'escompte de décembre : 339,84 € d'agio, 359,84 € de coût, 22 296,16 € nets, 9,68 %", () => {
    expect(attendus(ch, "l-escompte-et-son-taux-reel")).toEqual([339.84, 359.84, 22_296.16, taux(359.84, 22_296.16, 60)]);
    expect(taux(359.84, 22_296.16, 60)).toBe(9.68);
  });

  it("le Dailly : 358,72 € d'intérêts, 388,72 € de coût, 22 267,28 € nets, 10,47 %", () => {
    expect(c((22_656 * 0.095 * 60) / 360)).toBe(358.72);
    expect(attendus(ch, "le-dailly-sans-aide")).toEqual([358.72, 388.72, 22_267.28, 10.47]);
    expect(taux(388.72, 22_267.28, 60)).toBe(10.47);
    expect(juste(ch, "escompte-ou-dailly")).toEqual(["Quand le client refuse d'accepter une lettre de change"]);
  });

  it("l'affacturage : 20 390,40 € d'avance, 237,89 € et 226,56 € de commissions, 19 925,95 € versés, 13,99 %", () => {
    expect(c((20_390.4 * 0.07 * 60) / 360)).toBe(237.89);
    expect(attendus(ch, "l-affacturage-sans-aide")).toEqual([20_390.4, 237.89, 226.56, 19_925.95, taux(237.89 + 226.56, 19_925.95, 60)]);
    expect(taux(464.45, 19_925.95, 60)).toBe(13.99);
  });

  it("la garantie sur Sonora : 599,96 € de commission contre 14 012,50 € de perte", () => {
    expect(c((26_365.92 + 33_630) * 0.01)).toBe(599.96);
    expect(attendus(ch, "la-garantie-de-sonora")).toEqual([599.96, c(28_025 * 0.5), c(14_012.5 - 599.96)]);
    expect(juste(ch, "predire-la-garantie")).toEqual(["Oui, de loin"]);
  });
});

describe("l'excédent de l'été, refait à la main", () => {
  it("80 000 € pendant 180 jours : 1 120 € au compte à terme (840 € après impôt), 1 040 € au fonds (780 €)", () => {
    expect(attendus(ch, "le-compte-a-terme")).toEqual([c((80_000 * 0.028 * 180) / 360), 840, c((80_000 * 0.026 * 180) / 360), 780]);
  });

  it("un retrait de 30 000 € au 30e jour : tout bloqué rapporte 575 €, tout au fonds 715 €, 50 000 € bloqués 765 €", () => {
    expect(placement({ compteATerme: 80_000, retrait: 30_000, jour: 30 }).total).toBe(c((80_000 * 0.005 * 30) / 360 + (50_000 * 0.026 * 150) / 360));
    expect(placement({ compteATerme: 80_000, retrait: 30_000, jour: 30 }).total).toBe(575);
    expect(placement({ compteATerme: 0, retrait: 30_000, jour: 30 }).total).toBe(c((30_000 * 0.026 * 30) / 360 + 50_000 * 0.013));
    expect(placement({ compteATerme: 50_000, retrait: 30_000, jour: 30 }).total).toBe(c(50_000 * 0.014 + (30_000 * 0.026 * 30) / 360));
    expect(placement({ compteATerme: 60_000, retrait: 30_000, jour: 30 }).rompu).toBe(true);
    expect(financementDuChapitre(NOVA).meilleure).toEqual({ compteATerme: 50_000, total: 765 });
    expect(juste(ch, "predire-le-retrait")).toEqual(["Moins qu'avec tout au fonds"]);
    gardeDuLaboratoire(ch, "le-laboratoire-du-placement");
  });
});

describe("le cas dédié : une chaîne nouvelle, à 60 jours", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UNE_CHAINE_NOUVELLE_A_60_JOURS);
    gardeDuCas(UNE_CHAINE_NOUVELLE_A_60_JOURS, ch);
  });

  it("600 enceintes à 59 € moins 5 % : 40 356 € TTC ; Dailly 668,97 €, affacturage 827,30 €, 158,33 € d'écart", () => {
    expect(CHAINE_ONDES.jours).toBe(60);
    const ttc = c(600 * 59 * 0.95 * 1.2);
    expect(ttc).toBe(40_356);
    const montants = (id: string) => etape(chapitreDuCas(UNE_CHAINE_NOUVELLE_A_60_JOURS, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("le-dailly")).toEqual([c((ttc * 0.095 * 60) / 360), c((ttc * 0.095 * 60) / 360 + 30), c(ttc - 668.97)]);
    expect(montants("le-dailly")).toEqual([638.97, 668.97, 39_687.03]);
    const avance = c(ttc * 0.9);
    expect(montants("l-affacturage")).toEqual([avance, c(c((avance * 0.07 * 60) / 360) + c(ttc * 0.01)), c(avance - 827.3)]);
    expect(montants("l-affacturage")[1]).toBe(827.3);
    const r = etape(UNE_CHAINE_NOUVELLE_A_60_JOURS, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["L'affacturage : 158,33 € de plus pour la garantie"]);
  });
});
