import { describe, expect, it } from "vitest";
import { PROGRAMMER_LA_PRODUCTION, laboratoireDuProgramme } from "../../src/config/cours/chapitres/programmer-la-production";
import {
  BANC_DE_MESURE,
  formeCanonique,
  lancementAvance,
  lancementAvanceLeMoinsCher,
  leFacteurRareFaceAuBanc,
  ordonnancement,
  programmeOptimal,
  saturees,
  sommetsDuDomaine,
  valeurDUneHeureDePlus,
  cheminsDuLancement,
} from "../../src/config/cours/monde/programmation-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_BANC_PERD_UNE_JOURNEE, bancReduit } from "../../src/config/cours/situations/par-chapitre/le-banc-perd-une-journee";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * PROGRAMMER LA PRODUCTION (DCG UE11 § 3.2) : chaque chiffre refait à la main. Le mois de pointe de la
 * gamme : la Go servie d'abord (600 × 0,18 = 108 heures-machine, il en reste 700 − 108 = 592) ; la One
 * (marge 21 €, 0,3 heure-machine, 3 minutes au banc, 1 500 demandées) et la Studio (59 €, 0,5 heure,
 * 15 minutes, 400 demandées) ; le banc tourne 152 heures. Le lancement de la Go : 9 tâches, 17 semaines.
 */

const ch = PROGRAMMER_LA_PRODUCTION;

describe("programmer la production : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(new Set(ch.etapes.map((e) => e.titre)).size).toBe(ch.etapes.length);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    expect(ch.prerequis).toEqual(["cout-par-produit"]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("le programme linéaire, refait à la main", () => {
  it("la forme canonique : 0,3 x + 0,5 y ≤ 592 ; 0,05 x + 0,25 y ≤ 152 ; x ≤ 1 500 ; y ≤ 400 ; max 21 x + 59 y", () => {
    const f = formeCanonique();
    expect(f.go).toEqual({ unites: 600, heures: 108, marge: 9_000 });
    expect(f.contraintes.map((k) => [k.code, k.a, k.b, k.c])).toEqual([
      ["heures-machine", 0.3, 0.5, 592],
      ["banc", 0.05, 0.25, 152],
      ["demande-one", 1, 0, 1_500],
      ["demande-studio", 0, 1, 400],
    ]);
    expect(f.marge).toEqual({ x: 59 - 38, y: 129 - 70 });
    expect(juste(ch, "la-forme-canonique")[0]).toContain("592");
  });

  it("le plan du facteur rare demande (1 306 × 3 + 400 × 15) ÷ 60 = 165,3 heures de banc : 13,3 de trop", () => {
    const fr = leFacteurRareFaceAuBanc();
    expect([fr.studio, fr.go, fr.one, fr.marge]).toEqual([400, 600, 1_306, 23_600 + 9_000 + 21 * 1_306]);
    expect((1_306 * 3 + 400 * 15) / 60).toBeCloseTo(165.3, 9);
    expect([fr.heuresDuBanc, fr.manque]).toEqual([165.3, 13.3]);
    expect(attendus(ch, "le-banc-du-facteur-rare")).toEqual([165.3, 13.3]);
    // Classer par heure de banc ne marche pas mieux : 1 500 One (75 h), puis (152 − 75) ÷ 0,25 = 308 Studio, et 450 + 154 = 604 heures-machine > 592.
    expect(1_500 * 0.3 + ((152 - 1_500 * 0.05) / 0.25) * 0.5).toBe(604);
  });

  it("les sommets O, A, B, C, D, E ; l'optimum C = (1 440 ; 320), 21 × 1 440 + 59 × 320 = 49 120 €", () => {
    const o = programmeOptimal();
    expect(o.sommets.map((s) => [s.nom, s.x, s.y, s.marge])).toEqual([
      ["O", 0, 0, 0],
      ["A", 1_500, 0, 31_500],
      ["B", 1_500, 284, 31_500 + 59 * 284],
      ["C", 1_440, 320, 49_120],
      ["D", 1_040, 400, 21 * 1_040 + 23_600],
      ["E", 0, 400, 23_600],
    ]);
    // Le système : 6 × (0,05 x + 0,25 y = 152) − (0,3 x + 0,5 y = 592) donne y = 320, puis x = (592 − 160) ÷ 0,3 = 1 440.
    expect(6 * 152 - 592).toBe(320);
    expect((592 - 0.5 * 320) / 0.3).toBeCloseTo(1_440, 9);
    expect(o.optimal.nom).toBe("C");
    expect(saturees(o.usages)).toEqual(["heures-machine", "banc"]);
    expect(o.margeAvecLaGo).toBe(49_120 + 9_000);
    expect(attendus(ch, "le-sommet-des-deux-droites")).toEqual([320, 1_440]);
    expect(attendus(ch, "la-marge-du-mois")).toEqual([58_120, 60_026 - 58_120]);
    expect(incoherencesDuTableau(etape(ch, "les-sommets", "a-completer").grille(NOVA))).toEqual([]);
  });

  it("sans le banc, le programme linéaire retombe sur le plan du facteur rare : toutes les Studio, puis les One", () => {
    const sans = programmeOptimal({}, false);
    expect(sans.optimal.y).toBe(400);
    expect(sans.optimal.x).toBeCloseTo((592 - 200) / 0.3, 5);
    expect(Math.floor(sans.optimal.x)).toBe(leFacteurRareFaceAuBanc().one);
  });

  it("la valeur marginale : une heure de banc vaut 144 € (1 430 One, 326 Studio), une heure-machine 46 €, moins que les 83,33 € de la Go", () => {
    const banc = valeurDUneHeureDePlus("banc");
    expect([banc.plus.optimal.x, banc.plus.optimal.y, banc.valeur]).toEqual([1_430, 326, 144]);
    expect(21 * 1_430 + 59 * 326 - 49_120).toBe(144);
    expect(attendus(ch, "une-heure-de-banc-de-plus")).toEqual([326, 1_430, 144]);
    const hm = valeurDUneHeureDePlus("heures-machine");
    expect(hm.valeur).toBe(46);
    // La Go reste servie entière : elle tire 15 ÷ 0,18 = 83,33 € d'une heure-machine, et ne passe pas au banc.
    expect(15 / 0.18).toBeGreaterThan(hm.valeur);
    expect(BANC_DE_MESURE.minutesParUnite.go).toBe(0);
  });

  it("le laboratoire : le départ (1 300 One, 400 Studio) dépasse le banc ; seule la position (1 440 ; 320) relève le défi", () => {
    expect(laboratoireDuProgramme(1_300, 400).admissible).toBe(false);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-du-programme");
    expect(e.defi(NOVA).solution).toEqual({ one: 1_440, studio: 320 });
    expect(juste(ch, "predire-le-banc")).toEqual(["Non : il demande plus d'heures que le banc"]);
    expect(sommetsDuDomaine(formeCanonique()).length).toBe(6);
  });
});

describe("l'ordonnancement MPM du lancement de la Go, refait à la main", () => {
  it("les dates au plus tôt, au plus tard, les marges totales et libres, et le chemin critique A, B, D, G, I de 17 semaines", () => {
    const o = ordonnancement();
    // tâche : au plus tôt, au plus tard, marge totale, marge libre
    expect(Object.fromEntries(o.taches.map((t) => [t.code, [t.tot, t.tard, t.margeTotale, t.margeLibre]]))).toEqual({
      A: [0, 0, 0, 0],
      B: [3, 3, 0, 0],
      C: [3, 9, 6, 3], // fin au plus tôt 5 ; E commence au plus tôt en 8
      D: [8, 8, 0, 0],
      E: [8, 11, 3, 3], // G commence en 14 ; E finit en 11
      F: [8, 9, 1, 0], // H commence en 12 = la fin au plus tôt de F
      G: [14, 14, 0, 0],
      H: [12, 13, 1, 1],
      I: [16, 16, 0, 0],
    });
    expect(o.fin).toBe(3 + 5 + 6 + 2 + 1);
    expect(o.critiques).toEqual(["A", "B", "D", "G", "I"]);
    expect(cheminsDuLancement().map((c) => [c.taches.join(""), c.longueur])).toEqual([
      ["ABDGI", 17],
      ["ABFHI", 16],
      ["ABEGI", 14],
      ["ACEGI", 11],
    ]);
    for (const id of ["les-dates-au-plus-tot", "les-dates-au-plus-tard", "les-marges-libres"]) expect(incoherencesDuTableau(etape(ch, id, "a-completer").grille(NOVA)), id).toEqual([]);
    expect(juste(ch, "le-chemin-critique")[0]).toMatch(/^A, B, D, G, I : 17/);
    expect(juste(ch, "predire-le-retard")).toEqual(["Elle recule d'une semaine"]);
    expect(ordonnancement({ D: 7 }).fin).toBe(18);
    expect(ordonnancement({ F: 5 }).fin).toBe(17);
    expect(ordonnancement({ F: 5 }).taches.find((t) => t.code === "H")!.tot).toBe(13);
  });

  it("le lancement avancé : 2 semaines sur le moule (3 000 €) et 1 sur les essais (2 500 €), 15 semaines, seule solution", () => {
    const m = lancementAvanceLeMoinsCher();
    expect([m.gagneesSurLeMoule, m.gagneesSurLesEssais, m.fin, m.cout]).toEqual([2, 1, 15, 2 * 1_500 + 2_500]);
    expect(lancementAvance(3, 0).fin).toBe(16);
    expect(lancementAvance(0, 2).fin).toBe(17);
    expect(m.ordonnancement.critiques).toEqual(["A", "B", "D", "F", "G", "H", "I"]);
    gardeDuLaboratoire(ch, "le-laboratoire-du-lancement");
  });
});

describe("le cas dédié : le banc perd une journée", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_BANC_PERD_UNE_JOURNEE);
    gardeDuCas(LE_BANC_PERD_UNE_JOURNEE, ch);
  });

  it("à 144 heures, le croisement (1 520 ; 272) dépasse la demande : le programme est (1 500 ; 276), 47 784 €, 1 336 € de moins", () => {
    const x = bancReduit();
    expect(x.heuresDuBanc).toBe(144);
    expect([x.xCroisement, x.yCroisement]).toEqual([1_520, 272]);
    expect((6 * 144 - 592) / (6 * 0.25 - 0.5)).toBe(272);
    expect([x.reduit.optimal.x, x.reduit.optimal.y]).toEqual([1_500, 276]);
    expect((144 - 0.05 * 1_500) / 0.25).toBe(276);
    expect(x.reduit.optimal.marge).toBe(21 * 1_500 + 59 * 276);
    expect(x.perte).toBe(49_120 - 47_784);
    expect(saturees(x.reduit.usages)).toEqual(["banc", "demande-one"]);
    expect(attendus(LE_BANC_PERD_UNE_JOURNEE, "le-nouveau-sommet")).toEqual([1_520, 1_500, 276]);
    expect(attendus(LE_BANC_PERD_UNE_JOURNEE, "la-marge-perdue")).toEqual([47_784, 1_336]);
    expect(juste(LE_BANC_PERD_UNE_JOURNEE, "reponse").map((t) => t.replace(/\s/g, " "))).toEqual(["Accepter : le samedi rend 1 336 € pour 600 €"]);
  });
});
