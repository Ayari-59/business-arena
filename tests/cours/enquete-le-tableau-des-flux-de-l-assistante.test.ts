import { describe, expect, it } from "vitest";
import { ENQUETES, enqueteParCode, enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE as e, grilleDesFluxCorriges } from "../../src/config/cours/enquetes/le-tableau-des-flux-de-l-assistante";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { ERREURS_DES_FLUX, fluxDeLAssistante, fluxJustes, totauxDesFlux } from "../../src/config/cours/monde/flux-de-l-assistante";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { etapeDe, verifierLaLangue, verifierLaTailleDeLEnquete, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * L'ENQUÊTE DU TABLEAU DES FLUX DE L'ASSISTANTE (enquetes/le-tableau-des-flux-de-l-assistante.ts,
 * monde/flux-de-l-assistante.ts) : les deux tableaux refaits à la main ; le juste retombe sur la
 * trésorerie du bilan, celui de l'assistante s'en écarte de la somme de ses erreurs.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("les deux tableaux, à la main", () => {
  it("le juste : 94 087,07 de marge brute, un besoin net de 10 627,62 − 11 210 = −582,38 €, et 252 669,45 € à la clôture", () => {
    const t = totauxDesFlux(fluxJustes(f));
    expect(t.margeBrute).toBe(c(79_225.96 + 9_861.11 + 5_000));
    expect(fluxJustes(f).variationDuBesoin).toBe(c(10_627.62 - 11_210));
    expect(t.activite).toBe(c(94_087.07 + 582.38));
    expect(t.investissement).toBe(-60_000);
    expect(t.financement).toBe(c(150_000 + 80_000 - 12_000));
    expect(t.cloture).toBe(c(94_669.45 - 60_000 + 218_000));
    expect(t.cloture).toBe(252_669.45);
  });

  it("celui de l'assistante : la dépréciation, le signe, la TVA, les intérêts, le dividende", () => {
    const a = fluxDeLAssistante(f);
    expect(a.amortissementsEtProvisions).toBe(c(14_861.11 + 11_210));
    expect(a.variationDuBesoin).toBe(582.38);
    expect(a.acquisitions).toBe(-72_000);
    expect(a.remboursements).toBe(c(-12_000 - (1_000 + 950 + 900)));
    expect(a.dividendes).toBe(-30_000);
    const ecart = c(11_210 - 2 * 582.38 - 12_000 - 2_850 - 30_000);
    expect(c(totauxDesFlux(a).cloture - 252_669.45)).toBe(ecart);
    expect(ecart).toBe(-34_804.76);
    expect(Object.keys(ERREURS_DES_FLUX).length).toBe(5);
  });
});

describe("l'enquête du tableau des flux de l'assistante", () => {
  it("est enregistrée, réservée, reprise du chapitre « Le tableau des flux de trésorerie »", () => {
    verifierLEnregistrement(e, "le-tableau-des-flux-de-tresorerie", ENQUETES, enqueteParCode, enquetesDuChapitre);
  });

  it("le contrôle : huit lignes, trois justes, cinq erreurs de natures différentes", () => {
    const k = etapeDe(e, "le-controle", "classement");
    verifierLeClassement(k);
    verifierLaTailleDeLEnquete(e, k);
  });

  it("le tableau corrigé : cohérent dans les deux colonnes, la clôture du bilan", () => {
    verifierLeTableau(etapeDe(e, "le-tableau", "etat"));
    expect(grilleDesFluxCorriges().lignes.at(-1)!.cellules.map((x) => x.valeur)).toEqual([217_864.69, 252_669.45]);
  });

  it("répondre au président", () => {
    const q = etapeDe(e, "la-reponse", "reponse");
    verifierLesQuestions(q);
    expect(espacesOrdinaires(q.questions[0]!.question)).toContain("34 804,76 €");
  });

  it("la langue de la maison", () => {
    verifierLaLangue(e);
  });
});
