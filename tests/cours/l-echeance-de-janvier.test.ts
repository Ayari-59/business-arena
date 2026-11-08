import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre, lienDuBureau } from "../../src/config/cours/bureaux";
import { L_ECHEANCE_DE_JANVIER as b, chiffresDeLEcheance, grilleDeLEcheance, grilleDeLaReserve, grilleDesDeuxPaiements } from "../../src/config/cours/bureaux/l-echeance-de-janvier";
import type { EtapeDeClassement, EtapeDeReponse } from "../../src/config/cours/bureaux/types";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { textesDuBureau, verifierLaLangue, verifierLesQuestions } from "../helpers/activites-du-lot-e";

/**
 * LE BUREAU : L'ÉCHÉANCE DE JANVIER (bureaux/l-echeance-de-janvier.ts, monde/valeur-et-temps.ts). Chaque
 * chiffre refait à la main ; les tableaux justes avec leurs propres valeurs ; la pile, les étapes, la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = chiffresDeLEcheance();

describe("les chiffres de l'échéance, à la main", () => {
  it("le compte à terme : 133 000 € à 3 % pour une année, 3 990 € ; 3 934,58 € déjà comptés en N ; 55,42 € de N+1", () => {
    expect(x.interets).toBe(133_000 * 0.03);
    expect(x.courus).toBe(c((133_000 * 0.03 * 355) / 360));
    expect(x.partDeN1).toBe(c(3_990 - 3_934.58));
    expect(x.partDeN1).toBe(c((133_000 * 0.03 * 5) / 360));
    expect(x.verse).toBe(136_990);
  });

  it("les annuités du fournisseur : 5 × 35 000 €, leur valeur actuelle à 5 %, le surcoût, l'annuité de la banque", () => {
    const va = c(35_000 * ((1 - 1.05 ** -5) / 0.05));
    expect(x.offre.total).toBe(175_000);
    expect(x.offre.valeurActuelle).toBe(va);
    expect(x.offre.surcout).toBe(c(va - 150_000));
    expect(x.offre.annuiteDeLaBanque).toBe(c((150_000 * 0.05) / (1 - 1.05 ** -5)));
    expect(x.offre.tauxActuariel).toBeGreaterThan(0.05);
  });

  it("la réserve : 60 000 € × 1,02^5, le coefficient (1,03^5 − 1) ÷ 0,03, le versement, au pas de 500 € au-dessus", () => {
    expect(x.prixFutur).toBe(c(60_000 * 1.02 ** 5));
    expect(x.coefficient).toBe(Math.round(((1.03 ** 5 - 1) / 0.03) * 10_000) / 10_000);
    expect(x.versementNecessaire).toBe(c(x.prixFutur / ((1.03 ** 5 - 1) / 0.03)));
    expect(x.suffit).toBe(Math.ceil(x.versementNecessaire / 500) * 500);
    expect(x.versementSansInflation).toBe(c(60_000 / ((1.03 ** 5 - 1) / 0.03)));
    expect(x.reel).toBeCloseTo(1.03 / 1.02 - 1, 12);
  });
});

describe("le bureau de l'échéance", () => {
  it("est enregistré, réservé, repris du chapitre « La valeur et le temps », sans compter parmi les cas dédiés", () => {
    expect(BUREAUX).toContain(b);
    expect(bureauParCode(b.code)).toBe(b);
    expect(bureauxDuChapitre("la-valeur-et-le-temps")).toEqual([b]);
    expect(lienDuBureau(b)).toBe("/cours/bureau/l-echeance-de-janvier");
    expect(b.libre).toBe(false);
    const ch = CHAPITRES.find((y) => y.code === "la-valeur-et-le-temps")!;
    expect([b.parcours, b.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(205);
  });

  it("une pile de 5 à 9 pièces, 3 à 6 étapes, et chaque pièce que montre une étape existe", () => {
    expect(b.pile.length).toBeGreaterThanOrEqual(5);
    expect(b.pile.length).toBeLessThanOrEqual(9);
    expect(b.etapes.length).toBeGreaterThanOrEqual(3);
    expect(b.etapes.length).toBeLessThanOrEqual(6);
    expect(new Set(b.pile.map((p) => p.code)).size).toBe(b.pile.length);
    for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((y) => y.code), `${e.id} ${p}`).toContain(p);
  });

  it("ramener chaque somme à sa date : les trois catégories servent, les annuités s'actualisent", () => {
    const e = b.etapes[0] as EtapeDeClassement;
    expect(new Set(e.elements.map((y) => y.categorie))).toEqual(new Set(e.categories.map((k) => k.code)));
    expect(e.elements.find((y) => y.code === "annuites")!.categorie).toBe("actualiser");
    for (const y of e.elements) if (y.piece) expect(b.pile.map((p) => p.code)).toContain(y.piece);
  });

  it("les tableaux : cohérents, justes avec leurs propres valeurs", () => {
    for (const g of [grilleDeLEcheance(), grilleDesDeuxPaiements(), grilleDeLaReserve()]) {
      expect(incoherencesDuTableau(g), g.titre).toEqual([]);
      expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste, g.titre).toBe(true);
    }
  });

  it("répondre au président : une seule bonne option, jamais la plus longue", () => {
    verifierLesQuestions((b.etapes.at(-1) as EtapeDeReponse).questions);
  });

  it("la langue de tout ce qui est servi", () => {
    verifierLaLangue(textesDuBureau(b));
  });
});
