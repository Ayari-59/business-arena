import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { DEPART_DU_LABORATOIRE, FACTURER_ET_SE_FAIRE_PAYER, SOLUTION_DU_LABORATOIRE } from "../../src/config/cours/chapitres/facturer-et-se-faire-payer";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LE_COMITE_QUI_PAIE_EN_RETARD } from "../../src/config/cours/situations/par-chapitre/le-comite-qui-paie-en-retard";
import { attendus, casDedie, centime, curseur, juste, laboratoire, verifierLesTextes } from "./gardes-de-la-gestion-de-la-boutique";

/**
 * FACTURER ET SE FAIRE PAYER, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LE COMITÉ QUI PAIE EN RETARD.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de MAILLE & CO (les prix de la gamme, le
 * délai des comités) et les hypothèses du chapitre (la commande de 50 articles, la remise de 5 %,
 * l'escompte de 2 %, les taux de la banque), sans les fonctions du chapitre ni du monde. Puis les
 * gardes de texte.
 */

const prix = (code: string) => f.gamme.find((r) => r.code === code)!.prixHt;
const brut = 20 * prix("col-rond") + 5 * prix("merinos") + 15 * prix("echarpe") + 10 * prix("bonnet");
const netCommercial = centime(brut * 0.95);
const ttc = centime(netCommercial * 1.2);
const escompte = centime(netCommercial * 0.02);
const netFinancier = centime(netCommercial - escompte);
const decouvert = (montant: number, jours: number) => centime((montant * 0.075 * jours) / 360);

describe("facturer et se faire payer, à la boutique du monde du cours", () => {
  const ch = FACTURER_ET_SE_FAIRE_PAYER;

  it("se joue chez MAILLE & CO seule, au palier 3 du BTS MCO, bloc 3, et le cas est le sien", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    expect(PROGRAMME.mco[3]).toContain(ch.titre);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).not.toBeNull();
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(LE_COMITE_QUI_PAIE_EN_RETARD);
    // Le délai des comités est celui de la fiche.
    expect(f.clienteles.find((c) => c.code === "comites")!.delaiDeReglement).toBe(45);
  });

  it("la facture à 45 jours, puis comptant avec l'escompte, refaites à la main", () => {
    expect([brut, netCommercial, ttc]).toEqual([2_550, 2_422.5, 2_907]);
    expect(attendus(ch, "la-facture")).toEqual({ "Montant brut": 2_550, Remise: 127.5, "Net commercial": 2_422.5, TVA: 484.5, "Net à payer": 2_907 });
    expect([escompte, netFinancier]).toEqual([48.45, 2_374.05]);
    expect(attendus(ch, "l-escompte-chiffre")).toEqual({
      Escompte: 48.45,
      "Net financier": 2_374.05,
      "TVA sur le net financier": 474.81,
      "Net à payer comptant": 2_848.86,
      "Coût du découvert à 45 jours": decouvert(ttc, 45),
    });
    expect(decouvert(ttc, 45)).toBe(27.25);
    expect(juste(ch, "les-mentions")).toBe("Les pénalités de retard et l'indemnité de 40 €");
  });

  it("l'échéance et le plafond légal, les pénalités d'un retard de 30 jours", () => {
    // Le 10 février + 45 jours : 18 jours en février, 27 en mars ; + 60 jours : le 11 avril.
    expect(juste(ch, "l-echeance")).toBe("Non : la loi plafonne à 60 jours date de facture, le 11 avril");
    const taux = 0.0215 + 0.1;
    const penalites = centime((ttc * taux * 30) / 365);
    expect(attendus(ch, "les-penalites")).toEqual({ "Taux des pénalités (%)": 12.15, "Pénalités de retard": penalites, "Total réclamé au comité": centime(penalites + 40) });
    expect(penalites).toBe(29.03);
  });

  it("le curseur du délai : jusqu'à 80 jours, le découvert coûte moins que l'escompte", () => {
    const n = Math.floor((48.45 * 360) / (ttc * 0.075) + 1e-9);
    expect(n).toBe(80);
    const k = curseur(ch, "le-delai-au-curseur");
    expect([k.attendu, k.bornes]).toEqual([80, [0, 120]]);
    expect(k.lecture).toEqual({ "Coût de l'escompte": 48.45, "Coût du découvert sur le délai": decouvert(ttc, 80), "Ce que le crédit fait gagner sur l'escompte": 0 });
    expect(juste(ch, "predire-l-escompte")).toBe("Moins que l'escompte");
  });

  it("le laboratoire de l'escompte : au moins 1 %, sans coûter plus que le découvert", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-escompte");
    expect([DEPART_DU_LABORATOIRE, SOLUTION_DU_LABORATOIRE]).toEqual([{ escompte: 2, delai: 45 }, { escompte: 1, delai: 45 }]);
    expect(l.reussi).toEqual([false, true]);
    // À la main : un escompte t (en %) coûte netCommercial × t ; il réussit si t ≥ 1 et s'il ne dépasse pas le découvert.
    const reussit = (t: number, d: number) => t >= 1 && centime((netCommercial * t) / 100) <= decouvert(ttc, d);
    const reussies = [30, 45, 60].flatMap((d) => [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3].filter((t) => reussit(t, d)).map((t) => `${t} à ${d}`));
    expect(reussies).toEqual(["1 à 45", "1 à 60", "1.25 à 60", "1.5 à 60"]);
    for (const d of [30, 45, 60]) for (const t of [0.75, 1, 1.5, 2]) expect(l.atteint({ escompte: t, delai: d }), `${t} à ${d}`).toBe(reussit(t, d));
    expect(l.auDepart["Taux annuel de l'escompte"]).toBe(centime((48.45 / 2_374.05) * 8 * 100));
  });

  it("l'autonome et l'expert : le taux annuel, les trois financements, les verdicts", () => {
    expect(attendus(ch, "le-taux-de-l-escompte")).toEqual({ "Taux annuel de l'escompte (%)": centime((escompte / netFinancier) * (360 / 45) * 100) });
    expect(centime((escompte / netFinancier) * 8 * 100)).toBe(16.33);
    const lcr = centime((ttc * 0.06 * 45) / 360 + 8);
    const factor = centime(centime((ttc * 0.062 * 45) / 360) + centime(ttc * 0.009));
    expect(attendus(ch, "financer-la-creance")).toEqual({
      "Coût · Découvert autorisé": decouvert(ttc, 45),
      "Coût · Escompte d'une LCR": lcr,
      "Coût · Affacturage": factor,
    });
    expect([lcr, factor]).toEqual([29.8, 48.69]);
    expect(juste(ch, "le-mode-de-reglement")).toMatch(/^Une LCR/);
    expect(juste(ch, "decider")).toBe("Garder les 45 jours et financer au découvert");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : le comité qui paie en retard", () => {
  const s = LE_COMITE_QUI_PAIE_EN_RETARD;

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, FACTURER_ET_SE_FAIRE_PAYER);
    expect(s.commanditaire).toBe("Le gérant");
  });

  it("la facture de janvier, le retard, le financement : refaits à la main", () => {
    // La commande de janvier : 10 cols ronds, 20 mérinos, 10 écharpes, 5 bonnets, au prix de la gamme, sans remise (45 articles).
    const ht = 10 * prix("col-rond") + 20 * prix("merinos") + 10 * prix("echarpe") + 5 * prix("bonnet");
    const t = centime(ht * 1.2);
    expect([ht, t]).toEqual([3_725, 4_470]);
    expect(attendus(s, "la-facture")).toEqual({ "Net commercial": ht, TVA: centime(ht * 0.2), "Net à payer": t });
    // Facturée le 12 janvier, due le 26 février (19 + 26 jours), payée le 23 mars : 25 jours de retard, 70 jours de crédit.
    const pen = centime((t * 0.1215 * 25) / 365);
    expect(attendus(s, "le-retard")).toEqual({ "Pénalités de retard": pen, "Total réclamé au comité": centime(pen + 40) });
    expect([pen, decouvert(t, 25), decouvert(t, 70)]).toEqual([37.2, 23.28, 65.19]);
    expect(attendus(s, "financer-le-retard")).toEqual({ "Coût du découvert sur le retard": decouvert(t, 25), "Coût du découvert sur tout le crédit": decouvert(t, 70) });
    const k = curseur(s, "le-retard-qui-se-paie");
    expect([k.attendu, k.bornes]).toEqual([Math.floor(40 / ((t * 0.075) / 360)), [0, 90]]);
    expect(k.attendu).toBe(42);
    expect(juste(s, "reponse")).toBe("Réclamer 77,20 € et passer ce comité à la LCR");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

