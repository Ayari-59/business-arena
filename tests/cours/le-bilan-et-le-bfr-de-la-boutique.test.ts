import { describe, expect, it } from "vitest";
import { DEPART_DU_LABORATOIRE, LE_BILAN_ET_LE_BFR_DE_LA_BOUTIQUE, SOLUTION_DU_LABORATOIRE } from "../../src/config/cours/chapitres/le-bilan-et-le-bfr-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LE_DECOUVERT_DEMANDE_AU_BANQUIER } from "../../src/config/cours/situations/par-chapitre/le-decouvert-demande-au-banquier";
import { attendus, casDedie, centime, curseur, juste, laboratoire, verifierLesTextes } from "./gardes-de-la-gestion-de-la-boutique";

/**
 * LE BILAN ET LE BFR DE LA BOUTIQUE, ET SON CAS : LE DÉCOUVERT DEMANDÉ AU BANQUIER.
 *
 * Le bilan au 31 décembre N − 1 refait à la main : le stock du 1er janvier N de la fiche, les créances
 * des comités et les dettes du façonnier (hypothèses du cours), la paie de décembre de l'équipe, le
 * résultat de l'exercice, le rayonnage amorti trois ans, l'emprunt remboursé trois fois. Puis le bilan
 * fonctionnel, les ratios, le délai, le dividende. Puis les gardes de texte.
 */

const stock = f.gamme.reduce((t, r) => t + r.stockInitial * r.coutDAchat, 0);
const resultat = 274_284.2;
const cp = 97_510 + 60_000 + resultat;
const fournisseurs = 48_000;
const fiscales = 10_100 * (0.22 + 0.42) + 18_000;
const creances = 38_400;
const passif = centime(cp + 5_000 + 28_000 + fournisseurs + fiscales);
const dispo = centime(passif - 45_000 - 4_000 - stock - creances);
const rs = centime(cp + 12_000 + 5_000 + 28_000);
const frng = centime(rs - 61_000);
const bfr = centime(stock + creances - fournisseurs - fiscales);
const aGarder = 2 * (13_600 + 14_342 + 1_500 + 920 + 333);

describe("le bilan et le BFR de la boutique", () => {
  const ch = LE_BILAN_ET_LE_BFR_DE_LA_BOUTIQUE;

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 3, et le cas est le sien", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier, ch.blocs]).toEqual(["mco", 4, ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]]);
    expect(PROGRAMME.mco[4]).toContain(ch.titre);
    expect(SITUATIONS).toContain(LE_DECOUVERT_DEMANDE_AU_BANQUIER);
    expect([stock, fiscales, dispo]).toEqual([24_990, 24_464, 424_868.2]);
  });

  it("l'amortissement, les capitaux propres, le fonds de roulement, refaits à la main", () => {
    expect(attendus(ch, "l-amortissement")).toEqual({ "Dotation de l'année": 4_000, "Amortissements cumulés": 12_000, "Valeur nette du rayonnage": 4_000, "Capitaux propres": cp });
    expect(attendus(ch, "le-fonds-de-roulement")).toEqual({ "Ressources stables": rs, "Fonds de roulement net global": frng, "Besoin en fonds de roulement": bfr, "Trésorerie nette": dispo });
    expect([frng, bfr]).toEqual([415_794.2, -9_074]);
    expect(centime(frng - bfr)).toBe(dispo);
  });

  it("le délai qui annule le BFR, le réassort au comptant, les ratios", () => {
    const parJour = fournisseurs / 45;
    expect(curseur(ch, "le-delai-qui-finance").attendu).toBe(Math.ceil((stock + creances - fiscales) / parJour));
    expect(curseur(ch, "le-delai-qui-finance").attendu).toBe(37);
    expect(juste(ch, "predire-le-comptant")).toBe("Deviendrait un besoin");
    const bfrComptant = centime(stock + creances - fiscales);
    expect(attendus(ch, "le-bfr-au-comptant")).toEqual({ "Dettes fournisseurs": 0, "Besoin en fonds de roulement": bfrComptant, "Trésorerie nette": centime(frng - bfrComptant) });
    const camv = 25_992 * 24.5;
    expect(attendus(ch, "les-ratios")).toEqual({
      "Autonomie financière (%)": centime((cp / passif) * 100),
      "Couverture des emplois stables": centime(rs / 61_000),
      "Liquidité générale": centime((stock + creances + dispo) / (fournisseurs + fiscales)),
      "Durée de stockage (jours)": centime((((23_400 + stock) / 2) / camv) * 360),
    });
  });

  it("le laboratoire du dividende, et le bilan après lui", () => {
    const l = laboratoire(ch, "le-laboratoire-du-dividende");
    expect([DEPART_DU_LABORATOIRE, SOLUTION_DU_LABORATOIRE]).toEqual([{ dividende: 320_000, delai: 0 }, { dividende: 320_000, delai: 45 }]);
    expect(l.reussi).toEqual([false, true]);
    const tn = (d: number, j: number) => frng - d - (stock + creances - (fournisseurs * j) / 45 - fiscales);
    for (const j of [0, 30, 45]) for (const d of [300_000, 310_000, 320_000]) expect(l.atteint({ dividende: d, delai: j }), `${d} ${j}`).toBe(d >= 320_000 && tn(d, j) >= aGarder);
    expect([tn(320_000, 0), tn(320_000, 30), aGarder].map(centime)).toEqual([56_868.2, 88_868.2, 61_390]);
    const cpApres = centime(cp - 320_000);
    expect(attendus(ch, "apres-le-dividende")).toEqual({
      "Capitaux propres": cpApres,
      "Fonds de roulement net global": centime(frng - 320_000),
      "Trésorerie nette": centime(dispo - 320_000),
      "Autonomie financière (%)": centime((cpApres / (passif - 320_000)) * 100),
    });
    expect(juste(ch, "la-provision-justifiee")).toMatch(/^Le fonds de roulement et le BFR baissent du même montant/);
    expect(juste(ch, "le-decouvert")).toMatch(/^Qu'un découvert finance un creux passager/);
    expect(juste(ch, "decider")).toMatch(/^Verser 320 000 €/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : le découvert demandé au banquier", () => {
  const s = LE_DECOUVERT_DEMANDE_AU_BANQUIER;

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, LE_BILAN_ET_LE_BFR_DE_LA_BOUTIQUE);
    expect(s.commanditaire).toBe("Le gérant");
  });

  it("le bilan au comptant, le plus gros dividende, l'autonomie : refaits à la main", () => {
    const bfrComptant = centime(stock + creances - fiscales);
    const tn = centime(frng - bfrComptant);
    expect(attendus(s, "au-comptant")).toEqual({ "Fonds de roulement net global": frng, "Besoin en fonds de roulement": bfrComptant, "Trésorerie nette": tn });
    const d = Math.floor(tn - aGarder);
    expect(d).toBe(315_478);
    expect(curseur(s, "le-dividende-au-curseur").attendu).toBe(d);
    const cpApres = centime(cp - d);
    const passifApres = centime(cpApres + 5_000 + 28_000 + fiscales);
    expect(attendus(s, "l-autonomie")).toEqual({ "Capitaux propres": cpApres, "Total du passif": passifApres, "Autonomie financière (%)": centime((cpApres / passifApres) * 100) });
    expect(juste(s, "reponse")).toMatch(/^Verser au plus 315 478 €/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
