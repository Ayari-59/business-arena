import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre, lienDuBureau } from "../../src/config/cours/bureaux";
import { LA_PREMIERE_CONSOLIDATION as b, VENTES_A_AUDIO_COMPTOIR, grilleDesEliminations, grilleDuGroupe, grilleDuPartage } from "../../src/config/cours/bureaux/la-premiere-consolidation";
import type { EtapeDeClassement, EtapeDeReponse } from "../../src/config/cours/bureaux/types";
import { VENTES_A_LA_FILIALE, groupeNova } from "../../src/config/cours/monde/groupe-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { textesDuBureau, verifierLaLangue, verifierLesQuestions } from "../helpers/activites-du-lot-e";
import { NOMBRE_DE_CAS_DEDIES } from "../helpers/nombre-de-cas-dedies";

/**
 * LE BUREAU : LA PREMIÈRE CONSOLIDATION (bureaux/la-premiere-consolidation.ts, monde/groupe-nova.ts).
 * Chaque chiffre refait à la main ; l'hypothèse du bureau ; les tableaux justes avec leurs propres
 * valeurs ; la pile, les étapes, la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const g = groupeNova();

describe("les chiffres de la consolidation, à la main", () => {
  it("les éliminations : 1 200 × 59 €, 100 × 59 € × 1,2, 12 000 €, 12 000 € × 4 % × 6 ÷ 12", () => {
    expect(grilleDesEliminations().lignes.map((l) => l.cellules[0]!.valeur)).toEqual([1_200 * 59, c(100 * 59 * 1.2), 12_000, c((12_000 * 0.04 * 6) / 12), 0]);
  });

  it("le résultat de la filiale : 1 200 × 79 € − ses achats, ses charges, les intérêts, l'impôt à 15 %", () => {
    const avantImpot = c(1_200 * 79 - 70_800 - 8_500 - 9_300 - 240);
    expect(g.resultat).toBe(c(avantImpot - c(avantImpot * 0.15)));
    expect(grilleDuPartage().lignes[1]!.cellules[2]!.valeur).toBe(g.resultat);
  });

  it("le partage : 80 % et 20 % du capital et du résultat ; le chiffre d'affaires du groupe", () => {
    expect(g.partDuGroupe.capital).toBe(8_000);
    expect(g.minoritaires.total).toBe(c(2_000 + g.resultat - c(g.resultat * 0.8)));
    expect(g.chiffreDAffairesDuGroupe).toBe(c(g.chiffreDAffairesDeNova + 94_800 - 70_800));
  });

  it("l'hypothèse du bureau : 150 One à AUDIO COMPTOIR, une part des ventes de la filiale, sans en changer le chiffre", () => {
    expect(VENTES_A_AUDIO_COMPTOIR.enceintes).toBe(150);
    expect(VENTES_A_AUDIO_COMPTOIR.enceintes).toBeLessThan(VENTES_A_LA_FILIALE.enceintes);
    expect(g.chiffreDAffairesDeLaFiliale).toBe(1_200 * 79);
  });
});

describe("le bureau de la consolidation", () => {
  it("est enregistré, réservé, repris du chapitre « Initiation à la consolidation », sans compter parmi les cas dédiés", () => {
    expect(BUREAUX).toContain(b);
    expect(bureauParCode(b.code)).toBe(b);
    expect(bureauxDuChapitre("initiation-a-la-consolidation")).toEqual([b]);
    expect(lienDuBureau(b)).toBe("/cours/bureau/la-premiere-consolidation");
    expect(b.libre).toBe(false);
    const ch = CHAPITRES.find((y) => y.code === "initiation-a-la-consolidation")!;
    expect([b.parcours, b.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(NOMBRE_DE_CAS_DEDIES);
  });

  it("une pile de 5 à 9 pièces, 3 à 6 étapes, et chaque pièce que montre une étape existe", () => {
    expect(b.pile.length).toBeGreaterThanOrEqual(5);
    expect(b.pile.length).toBeLessThanOrEqual(9);
    expect(b.etapes.length).toBeGreaterThanOrEqual(3);
    expect(b.etapes.length).toBeLessThanOrEqual(6);
    for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((y) => y.code), `${e.id} ${p}`).toContain(p);
  });

  it("trier : les quatre opérations réciproques s'éliminent, AUDIO COMPTOIR se garde, le capital et le résultat se partagent", () => {
    const e = b.etapes[0] as EtapeDeClassement;
    const de = (k: string) => e.elements.filter((y) => y.categorie === k).map((y) => y.code);
    expect(de("eliminer")).toEqual(["ventes", "creance", "pret", "interets"]);
    expect(de("garder")).toContain("audio");
    expect(de("partager")).toEqual(["capital", "resultat"]);
    for (const y of e.elements) expect(b.pile.map((p) => p.code)).toContain(y.piece);
  });

  it("les tableaux : cohérents, justes avec leurs propres valeurs", () => {
    for (const t of [grilleDesEliminations(), grilleDuGroupe(), grilleDuPartage()]) {
      expect(incoherencesDuTableau(t), t.titre).toEqual([]);
      expect(corrigerLeTableau(t, solutionsDuTableau(t)).juste, t.titre).toBe(true);
    }
    expect(grilleDuGroupe().lignes[0]!.cellules[3]!.valeur).toBe(g.chiffreDAffairesDuGroupe);
  });

  it("répondre au président : une seule bonne option, jamais la plus longue", () => {
    verifierLesQuestions((b.etapes.at(-1) as EtapeDeReponse).questions);
  });

  it("la langue de tout ce qui est servi", () => {
    verifierLaLangue(textesDuBureau(b));
  });
});
