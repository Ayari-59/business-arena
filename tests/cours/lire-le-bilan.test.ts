import { describe, expect, it } from "vitest";
import { LIRE_LE_BILAN, SOLUTION_DU_BILAN, bilanDeFinDAnnee, bilanDuLaboratoire, empruntPossible } from "../../src/config/cours/chapitres/lire-le-bilan";
import { L_INVESTISSEUSE_AU_CAPITAL, investisseuseAuCapital } from "../../src/config/cours/situations/par-chapitre/l-investisseuse-au-capital";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LE BILAN, AU 31 DÉCEMBRE DU PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS :
 * L'INVESTISSEUSE AU CAPITAL.
 *
 * Refait à la main sur les postes (épinglés dans tests/cours/comptes-du-lycee.test.ts) : l'actif,
 * 432 256,34 € ; les capitaux propres, 229 225,96 € ; l'emprunt, 68 000 € ; l'argent disponible,
 * 136 934,58 € placés et 115 734,87 € en banque ; les dettes de l'année, 130 030,38 €.
 */

const ch = chapitreDuCas(LIRE_LE_BILAN, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("le bilan de NOVA", () => {
  const b = bilanDeFinDAnnee(NOVA);

  it("les totaux et les équilibres se refont à la main", () => {
    expect(etape(ch, "equilibre", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([432_256.34, c(432_256.34 - 229_225.96), 432_256.34]);
    expect(b.partDesAssocies).toBe(53); // 229 225,96 ÷ 432 256,34 = 53,03 %
    expect(b.rapportDEndettement).toBe(0.3); // 68 000 ÷ 229 225,96 = 0,297
    expect(b.disponible).toBe(c(136_934.58 + 115_734.87));
    expect(b.aCourtTerme).toBe(c(81_000 + 41_119.27 + 7_911.11));
  });

  it("le tri range treize postes moins le découvert nul, et la trésorerie est positive", () => {
    const el = etape(ch, "ranger", "tri").elements(NOVA);
    expect(el).toHaveLength(12);
    expect(el.filter((x) => x.categorie === "actif")).toHaveLength(6);
    expect(el.every((x) => x.pourquoi.length > 0)).toBe(true);
    const juste = etape(ch, "tresorerie", "choix").options(NOVA, VIDE).filter((o) => o.juste);
    expect(juste.map((o) => o.texte)).toEqual(["Elle a plus d'argent disponible que de découvert : sa trésorerie est positive"]);
  });

  it("le curseur : 161 225 € d'emprunt nouveau, la règle des banques tenue", () => {
    expect(empruntPossible(b)).toBe(Math.floor(229_225.96 - 68_000));
    const e = gardeDuCurseur(ch, "jusqu-ou-emprunter", 161_225);
    expect(e.lecture(NOVA, 161_225)[1]!.montant).toBe(229_225);
  });

  it("le laboratoire : 100 000 € d'équipement et 30 000 € de dividende font passer l'argent disponible sous les dettes de l'année", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-bilan");
    expect(SOLUTION_DU_BILAN).toEqual({ equipement: 100_000, dividende: 30_000 });
    const x = bilanDuLaboratoire(b, SOLUTION_DU_BILAN);
    expect(x.decouvert).toBe(c(130_000 - 115_734.87));
    expect(x.disponible).toBe(136_934.58);
    expect(x.aCourtTerme).toBe(c(130_030.38 + 14_265.13));
    expect(x.actif).toBe(x.passif);
    expect(x.actif).toBe(c(432_256.34 + 100_000 - 115_734.87));
    // 120 000 € d'équipement seul ne suffisent pas ; 130 000 € suffisent.
    const defi = etape(ch, "le-laboratoire-du-bilan", "simulation").defi(NOVA);
    expect(defi.atteint({ equipement: 120_000, dividende: 0 })).toBe(false);
    expect(defi.atteint({ equipement: 130_000, dividende: 0 })).toBe(true);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LIRE_LE_BILAN);
  });
});

describe("le cas : l'investisseuse au capital", () => {
  const r = investisseuseAuCapital(NOVA);
  it("un quart des capitaux propres, arrondi à la centaine, en banque", () => {
    expect(r.apport).toBe(57_300); // 229 225,96 × 20 % ÷ 80 % = 57 306,49
    expect(r.comble).toBe(0);
    expect(r.capitauxPropresApres).toBe(c(229_225.96 + 57_300));
    expect(r.total).toBe(c(432_256.34 + 57_300));
    expect(r.autonomieApres).toBe(58.5); // 286 525,96 ÷ 489 556,34 = 58,53 %
    expect(r.sansLeTotal).toBe(66.3); // 286 525,96 ÷ 432 256,34
    expect(r.tresorerieApres).toBe(c(252_669.45 + 57_300));
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(L_INVESTISSEUSE_AU_CAPITAL);
  });
});
