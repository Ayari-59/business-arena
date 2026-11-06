import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LE_DIAGNOSTIC_POUR_L_ASSEMBLEE as b, grilleDesRatiosDeNPlus2, jugementDuRatio } from "../../src/config/cours/bureaux/le-diagnostic-pour-l-assemblee";
import { etapeDe, verifierLaLangue, verifierLaTailleDuBureau, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * LE BUREAU DU DIAGNOSTIC POUR L'ASSEMBLÉE (bureaux/le-diagnostic-pour-l-assemblee.ts) : les dix ratios
 * de N+2 refaits à la main sur les comptes résumés de NOVA, et chaque jugement dans le sens du ratio.
 */

const r = (v: number) => Math.round(v * 100) / 100 + 0;

describe("les ratios de N+2, à la main", () => {
  it("chacun, sur les comptes résumés de N+1 et de N+2", () => {
    const v = Object.fromEntries(grilleDesRatiosDeNPlus2().lignes.map((l) => [l.libelle, l.cellules[0]!.valeur]));
    expect(v["Croissance du chiffre d'affaires"]).toBe(r((1_998_700 / 1_767_100 - 1) * 100));
    expect(v["Taux de valeur ajoutée"]).toBe(r((467_400 / 1_998_700) * 100));
    expect(v["Taux de marge brute"]).toBe(r((267_066 / 1_998_700) * 100));
    expect(v["Rentabilité financière"]).toBe(r((177_849 / 516_658.93) * 100));
    expect(v["Endettement"]).toBe(r(36_000 / 516_658.93));
    expect(v["Liquidité générale"]).toBe(r(588_927.84 / 155_874.74));
    expect(v["Délai des clients"]).toBe(r((266_493.33 * 360) / (1_998_700 * 1.2)));
    expect(v["Durée du stock"]).toBe(r((54_000 * 360) / 727_447.37));
    expect(v["Taux d'usure de l'outil"]).toBe(r((76_394.17 / 180_000) * 100));
    expect(v["Électricité par enceinte"]).toBe(r(49_360 / 32_800));
  });

  it("le jugement : le niveau face au secteur, puis la tendance, dans le sens du ratio", () => {
    expect(jugementDuRatio({ valeur: 40, nPlus1: 32, secteur: 45, baisseEstUnProgres: true })).toBe("vigilance");
    expect(jugementDuRatio({ valeur: 0.07, nPlus1: 0.14, secteur: 0.6, baisseEstUnProgres: true })).toBe("fort");
    expect(jugementDuRatio({ valeur: 23.39, nPlus1: 20.18, secteur: 28, baisseEstUnProgres: false })).toBe("retrait");
  });
});

describe("le bureau du diagnostic pour l'assemblée", () => {
  it("est enregistré, réservé, repris du chapitre du diagnostic", () => {
    verifierLEnregistrement(b, "le-diagnostic-financier-et-extra-financier", BUREAUX, bureauParCode, bureauxDuChapitre);
    verifierLaTailleDuBureau(b);
  });

  it("les ratios, puis le jugement : trois verdicts, quatre reculs derrière de bons niveaux", () => {
    verifierLeTableau(etapeDe(b, "les-ratios", "etat"));
    const e = etapeDe(b, "le-jugement", "classement");
    verifierLeClassement(e);
    expect(e.elements.filter((x) => x.categorie === "vigilance").map((x) => x.code)).toEqual(["croissance", "delai-clients", "stock", "usure"]);
    expect(e.elements.filter((x) => x.categorie === "retrait").map((x) => x.code)).toEqual(["valeur-ajoutee"]);
    // Le jugement ne montre pas la valeur que l'étape des ratios fait calculer.
    for (const x of e.elements) expect(x.montant).toBeUndefined();
  });

  it("la conclusion", () => {
    verifierLesQuestions(etapeDe(b, "la-conclusion", "reponse"));
  });

  it("la langue de la maison", () => {
    verifierLaLangue(b);
  });
});
