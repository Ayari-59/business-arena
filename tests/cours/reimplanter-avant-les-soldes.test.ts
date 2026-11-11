import { describe, expect, it } from "vitest";
import { ENTREPRISES_DE_LA_REIMPLANTATION, REIMPLANTER_AVANT_LES_SOLDES, grilleDuReseau, rangDeLaReceveuse } from "../../src/config/cours/chapitres/reimplanter-avant-les-soldes";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { LINEAIRE, TACHES, planningDeGantt, renfortDuLundi, reseauPert } from "../../src/config/cours/monde/reimplantation";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_RAYONNAGE_QUI_RESISTE } from "../../src/config/cours/situations/par-chapitre/le-rayonnage-qui-resiste";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * RÉIMPLANTER AVANT LES SOLDES (BTS MCO, blocs 2 et 4), À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LE
 * RAYONNAGE QUI RÉSISTE.
 *
 * Refait à la main : les marges de janvier (col rond 15 900 €, cardigan 13 320 €, mérinos 6 660 €,
 * écharpe 6 270 €, bonnet 2 100 €) sur 24 m de linéaire ; la demande au linéaire (élasticité 0,3, à
 * l'unité inférieure) bornée par le stock du mois ; le réseau des neuf tâches, ses dates et ses marges ;
 * le planning à trois et à quatre personnes.
 */

const MARGE = { "col-rond": 15_900, cardigan: 13_320, merinos: 6_660, echarpe: 6_270, bonnet: 2_100 } as const;
const MU = { "col-rond": 26.5, cardigan: 37, merinos: 74, echarpe: 19, bonnet: 14 } as const;
const c2 = (x: number) => Math.round(x * 100) / 100 + 0;
const demande = (d: number, l0: number, l: number) => Math.floor(d * (1 + (0.3 * (l - l0)) / l0) + 1e-9);

describe("réimplanter avant les soldes : le chapitre et son cas", () => {
  it("au palier 4 du BTS MCO, blocs 2 et 4, au programme, à la boutique seule ; le cas lui est dédié", () => {
    const ch = REIMPLANTER_AVANT_LES_SOLDES;
    expect([ch.parcours, ch.palier]).toEqual(["mco", 4]);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale", "BTS MCO Bloc 4 · Manager l'équipe commerciale"]);
    gardeDuProgramme(ch, PROGRAMME.mco[4]!, () => "bts-mco", /^BTS MCO /);
    expect(PROGRAMME.mco[4]![PROGRAMME.mco[4]!.indexOf(ch.titre) - 1]).toBe("Communiquer et animer en local");
    expect([...ENTREPRISES_DE_LA_REIMPLANTATION]).toEqual(["boutique"]);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    gardeDuCas(LE_RAYONNAGE_QUI_RESISTE, ch);
  });

  it("la marge par mètre et les indices : le bonnet à 420 €, 0,21 et 0,23 ; le col rond à 2 650 €, 1,51 et 1,44", () => {
    expect(Object.values(LINEAIRE).reduce((t, x) => t + x, 0)).toBe(24);
    expect(attendus(REIMPLANTER_AVANT_LES_SOLDES, "la-marge-par-metre")).toEqual([2_650, 2_664, 1_665, 1_567.5, 420]);
    // Les parts à deux décimales, puis l'indice au centième, comme sur la copie.
    const ind = (num: number, tot: number, l: number) => c2(c2((num / tot) * 100) / c2((l / 24) * 100));
    expect(attendus(REIMPLANTER_AVANT_LES_SOLDES, "les-indices")).toEqual([ind(3_750, 87_450, 5), ind(2_100, 44_250, 5), ind(33_000, 87_450, 6), ind(15_900, 44_250, 6)]);
    expect([ind(3_750, 87_450, 5), ind(2_100, 44_250, 5), ind(33_000, 87_450, 6), ind(15_900, 44_250, 6)]).toEqual([0.21, 0.23, 1.51, 1.44]);
    expect(Object.values(MARGE).reduce((t, x) => t + x, 0)).toBe(44_250);
  });

  it("le laboratoire : 2,5 m du bonnet au col rond font gagner 1 665,50 € ; le cardigan, en rupture, ne gagne rien", () => {
    const gainCol = (m: number) => (demande(600, 6, 6 + m) - 600) * MU["col-rond"] - (150 - demande(150, 5, 5 - m)) * MU.bonnet;
    expect([gainCol(2), gainCol(2.5)]).toEqual([1_338, 1_665.5]);
    // Le cardigan : 384 demandés pour 360 en stock ; plus de linéaire ne vend rien de plus.
    const card = f.gamme.find((g) => g.code === "cardigan")!;
    expect(Math.min(demande(card.demandeDuMois, 5, 8), card.stockInitial + 240)).toBe(360);
    const e = gardeDuLaboratoire(REIMPLANTER_AVANT_LES_SOLDES, "le-laboratoire-du-lineaire");
    expect(e.defi(BOUTIQUE).solution).toEqual({ receveuse: rangDeLaReceveuse("col-rond"), metres: 2.5 });
    expect(attendus(REIMPLANTER_AVANT_LES_SOLDES, "l-ordre-en-ligne")).toEqual([c2(0.012 * 74), c2(0.05 * 14)]);
  });

  it("le réseau : 165 min, chemin critique A, B, D, F, I ; la vitrine peut durer 90 min ; marges libres 30, 0, 30", () => {
    const p = reseauPert();
    expect(p.fin).toBe(30 + 45 + 30 + 45 + 15);
    expect(p.critique).toEqual(["A", "B", "D", "F", "I"]);
    expect(p.lignes.map((l) => [l.code, l.debutAuPlusTot, l.debutAuPlusTard, l.margeTotale])).toEqual([
      ["A", 0, 0, 0],
      ["B", 30, 30, 0],
      ["C", 30, 60, 30],
      ["D", 75, 75, 0],
      ["E", 0, 60, 60],
      ["F", 105, 105, 0],
      ["G", 105, 135, 30],
      ["H", 60, 120, 60],
      ["I", 150, 150, 0],
    ]);
    const g = grilleDuReseau(BOUTIQUE);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.length).toBe(TACHES.length);
    gardeDuCurseur(REIMPLANTER_AVANT_LES_SOLDES, "la-vitrine-au-curseur", 90);
    expect(attendus(REIMPLANTER_AVANT_LES_SOLDES, "les-marges")).toEqual([30, 0, 30]);
  });

  it("le planning : à 3 personnes, 10 h pile ; à 4, 9 h 45 ; le renfort du lundi ne laisse aucun créneau sous le besoin", () => {
    expect([planningDeGantt(3).fin, planningDeGantt(4).fin, planningDeGantt(5).fin]).toEqual([180, 165, 165]);
    expect(attendus(REIMPLANTER_AVANT_LES_SOLDES, "l-equipe-limitee")).toEqual([180, 165, 0]);
    const r = renfortDuLundi(f);
    expect(r.creneaux.map((k) => [k.heure, k.presence, k.besoin])).toEqual([
      [15, 3, 2],
      [16, 3, 2],
      [17, 3, 2],
    ]);
    expect(r.toujoursCouvert).toBe(true);
    expect(juste(REIMPLANTER_AVANT_LES_SOLDES, "le-renfort")[0]).toMatch(/^Avancer ses heures/);
    expect(juste(REIMPLANTER_AVANT_LES_SOLDES, "la-decision")[0]).toMatch(/^2,50 m du bonnet au col rond/);
  });

  it("le cas : le rayonnage en 75 min repousse la fin à 195 min, 15 min après l'ouverture ; la vitrine a 90 min de marge", () => {
    expect(attendus(LE_RAYONNAGE_QUI_RESISTE, "le-nouveau-reseau")).toEqual([105, 195, 15, 90]);
    expect(juste(LE_RAYONNAGE_QUI_RESISTE, "ou-agir")[0]).toMatch(/^Sur le chemin critique/);
    expect(juste(LE_RAYONNAGE_QUI_RESISTE, "reponse")[0]).toMatch(/^Ouvrir à 10 h/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre et le cas", () => {
    gardesDeTexte(REIMPLANTER_AVANT_LES_SOLDES);
    gardesDeTexte(LE_RAYONNAGE_QUI_RESISTE);
  });
});
