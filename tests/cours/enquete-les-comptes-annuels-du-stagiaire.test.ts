import { describe, expect, it } from "vitest";
import { ENQUETES, enqueteParCode, enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { LES_COMPTES_ANNUELS_DU_STAGIAIRE as e } from "../../src/config/cours/enquetes/les-comptes-annuels-du-stagiaire";
import { comptesDuStagiaire, effetsDesErreurs } from "../../src/config/cours/monde/comptes-annuels-du-stagiaire";
import { etapeDe, verifierLaLangue, verifierLaTailleDeLEnquete, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * L'ENQUÊTE DES COMPTES ANNUELS DU STAGIAIRE (enquetes/les-comptes-annuels-du-stagiaire.ts,
 * monde/comptes-annuels-du-stagiaire.ts) : chacun des neuf montants refait à la main, le sien et le juste.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const m = Object.fromEntries(comptesDuStagiaire().map((x) => [x.code, x]));

describe("les montants du stagiaire, à la main", () => {
  it("le signe : la variation des stocks vaut 0 − 13 500 = −13 500 €, il écrit +13 500 €", () => {
    expect([m["variation-des-stocks"]!.juste, m["variation-des-stocks"]!.stagiaire]).toEqual([-13_500, 13_500]);
  });

  it("les justes : 377 744 + 236 400 + 1 500 de charges externes, 3 681,11 + 448,40 de charges financières, 60 000 − 9 861,11 d'immobilisations", () => {
    expect(m["charges-externes"]!.juste).toBe(c(377_744 + 236_400 + 1_500));
    expect(m["charges-financieres"]!.juste).toBe(c(3_681.11 + 448.4));
    expect(m["immobilisations"]!.juste).toBe(c(60_000 - 9_861.11));
    for (const k of ["charges-externes", "charges-financieres", "immobilisations"]) expect(m[k]!.stagiaire).toBe(m[k]!.juste);
  });

  it("la dépréciation prise pour une provision : 5 000 + 11 210 = 16 210 €, au lieu de 5 000 €", () => {
    expect([m["provisions"]!.juste, m["provisions"]!.stagiaire]).toEqual([5_000, 16_210]);
  });

  it("les intérêts courus : 68 000 + 831,11 = 68 831,11 €, il écrit 68 000 €", () => {
    expect([m["emprunts"]!.juste, m["emprunts"]!.stagiaire]).toEqual([68_831.11, 68_000]);
  });

  it("les échéances : 68 000 − 4 × 4 000 = 52 000 € à plus d'un an, il écrit 68 000 €", () => {
    expect([m["emprunt-a-plus-d-un-an"]!.juste, m["emprunt-a-plus-d-un-an"]!.stagiaire]).toEqual([c(68_000 - 4 * 4_000), 68_000]);
  });

  it("le brut : 432 256,34 € de bilan net, 432 256,34 + 9 861,11 + 11 210 = 453 327,45 € en brut, au-delà des 450 000 €", () => {
    expect([m["total-pour-les-seuils"]!.juste, m["total-pour-les-seuils"]!.stagiaire]).toEqual([432_256.34, c(432_256.34 + 9_861.11 + 11_210)]);
    const x = effetsDesErreurs();
    expect([x.seuilsJustes, x.seuilsDuStagiaire]).toEqual([1, 2]);
  });

  it("le prorata : 99 967,96 × 6 ÷ 12 = 49 983,98 €, au lieu des 41 135,17 € de la situation", () => {
    const s = c(640_681 - 238_898 - 291_944 - 45_000 - 18_900 - 4_930.56 + 1_967.29 - 1_840.56);
    expect(s).toBe(41_135.17);
    expect([m["resultat-du-semestre"]!.juste, m["resultat-du-semestre"]!.stagiaire]).toEqual([s, c((99_967.96 * 6) / 12)]);
  });

  it("le bilan du stagiaire : son passif dépasse l'actif de 11 210 − 831,11 = 10 378,89 €", () => {
    expect(effetsDesErreurs().ecartDuBilan).toBe(c(11_210 - 831.11));
  });
});

describe("l'enquête des comptes annuels du stagiaire", () => {
  it("est enregistrée, réservée, reprise du chapitre « Les comptes annuels »", () => {
    verifierLEnregistrement(e, "les-comptes-annuels", ENQUETES, enqueteParCode, enquetesDuChapitre);
  });

  it("le contrôle : neuf montants, trois justes, six erreurs de natures différentes", () => {
    const k = etapeDe(e, "le-controle", "classement");
    verifierLeClassement(k);
    verifierLaTailleDeLEnquete(e, k);
    expect(k.elements.map((x) => x.categorie)).toEqual(comptesDuStagiaire().map((x) => x.erreur ?? "juste"));
  });

  it("les montants justes, et la réponse au président", () => {
    verifierLeTableau(etapeDe(e, "les-montants", "etat"));
    verifierLesQuestions(etapeDe(e, "la-reponse", "reponse"));
  });

  it("la langue de la maison", () => {
    verifierLaLangue(e);
  });
});
