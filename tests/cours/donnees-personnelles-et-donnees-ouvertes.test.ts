import { describe, expect, it } from "vitest";
import { DONNEES_PERSONNELLES_ET_DONNEES_OUVERTES as CH } from "../../src/config/cours/chapitres/donnees-personnelles-et-donnees-ouvertes";
import { DESTINATAIRES_QUI_PAIENT, campagne, clienteleDeJanvier } from "../../src/config/cours/monde/fichier-de-maille";
import { ECRIRE_A_TOUTES_LES_CLIENTES, ecrireAToutes } from "../../src/config/cours/situations/par-chapitre/ecrire-a-toutes-les-clientes";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « DONNÉES PERSONNELLES ET DONNÉES OUVERTES » (SGN T2.1), ET SON CAS, CHEZ MAILLE & CO.
 *
 * Refait à la main sur les achats de janvier : les fidèles, 200 × 55 + 220 × 75 + 55 × 135 + 90 × 35 + 30 × 25
 * = 38 825 € en 340 passages (114,19 €) ; les passants, 320 × 55 + 140 × 75 + 15 × 135 + 180 × 35 + 80 × 25
 * = 38 425 € en 600 passages (64,04 €). La marge des fidèles : 200 × 26,50 + 220 × 37 + 55 × 74 + 90 × 19 +
 * 30 × 14 = 19 640 €, 57,76 € par passage ; une campagne rapporte 3 % × 57,76 = 1,7328 € par destinataire,
 * 600 € ÷ 1,7328 = 346,3 : 347 consentantes. 1 200 cartes pour 9 400 femmes : 12,8 %.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la SGN, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 2 · Numérique et intelligence collective");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("des données à l'information, et sa valeur", () => {
  it("les paniers moyens : 114,19 € et 64,04 €", () => {
    expect(clienteleDeJanvier("fideles").chiffreDAffaires).toBe(38_825);
    expect(clienteleDeJanvier("passants").chiffreDAffaires).toBe(38_425);
    expect(attendusSgn(CH, "le-panier-moyen")).toEqual([114.19, 64.04]);
  });

  it("la donnée ouverte : 12,77 %", () => {
    expect(attendusSgn(CH, "la-donnee-ouverte")).toEqual([12.77]);
  });

  it("le curseur : 347 consentantes", () => {
    expect(clienteleDeJanvier("fideles").margeParTicket).toBe(57.76);
    expect(DESTINATAIRES_QUI_PAIENT).toBe(347);
    gardeDuCurseurSgn(CH, "la-valeur-de-l-information", 347);
    expect(campagne(347).gain).toBeGreaterThanOrEqual(0);
    expect(campagne(346).gain).toBeLessThan(0);
  });

  it("la donnée de santé est sensible ; la vente du fichier est refusée", () => {
    expect(triSgn(CH, "donnees-personnelles")["Une allergie à la laine notée par une vendeuse"]).toBe("sensible");
    expect(justeSgn(CH, "la-finalite")[0]).toMatch(/^Non/);
  });
});

describe("le cas du chapitre", () => {
  it("334,20 € aujourd'hui, 784 € après la demande en caisse", () => {
    gardeDuCasSgn(ECRIRE_A_TOUTES_LES_CLIENTES, CH);
    const k = ecrireAToutes();
    expect([k.aujourdhui.gain, k.apres.gain]).toEqual([334.2, 784]);
  });

  it("le corrigé suit le chemin de l'élève : le gain par destinataire au centime, puis le gain sur ce qui est affiché", () => {
    for (const c of Object.values(ecrireAToutes())) {
      expect(c.parDestinataire).toBe(Math.round(c.parDestinataire * 100) / 100);
      expect(c.gain).toBe(Math.round((c.destinataires * c.parDestinataire - c.cout) * 100) / 100);
    }
  });
});
