import { describe, expect, it } from "vitest";
import { bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LA_PAIE_DE_JANVIER as b, grilleDuBulletin } from "../../src/config/cours/bureaux/la-paie-de-janvier";
import type { EtapeDeClassement } from "../../src/config/cours/bureaux/types";
import { TAUX_DE_LA_PAIE as t } from "../../src/config/cours/monde/exercice-de-nova";
import { AUGMENTATION_DEMANDEE_EN_NET, paieDeRouteEtCie } from "../../src/config/cours/monde/paie-de-route-et-cie";
import { bulletinDePaie } from "../../src/config/cours/monde/paie";
import { verifierUnBureau } from "../helpers/activites-du-cours";

/**
 * LE BUREAU DE LA PAIE DE JANVIER (monde/paie-de-route-et-cie.ts, bureaux/la-paie-de-janvier.ts).
 * Chaque chiffre refait à la main depuis le cas figé de ROUTE & CIE et les taux du cours ; puis la
 * forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = paieDeRouteEtCie();

describe("la paie de janvier, chaque chiffre à la main", () => {
  it("le cas figé et les taux du cours", () => {
    expect([x.p.effectif, x.p.brut]).toEqual([10, 29_100]);
    expect([t.salarialUrssaf, t.salarialRetraite, t.patronalUrssaf, t.patronalRetraite, t.prelevementALaSource]).toEqual([0.18, 0.04, 0.36, 0.06, 0.02]);
    // L'acompte : la moitié du net moyen, 22 698 ÷ 10 ÷ 2 = 1 134,90 €, arrondi à la centaine.
    expect(x.p.acompte).toBe(Math.round(22_698 / 10 / 2 / 100) * 100);
  });

  it("le bulletin récapitulatif, du brut au coût employeur", () => {
    expect(x.b.cotisationsSalariales).toEqual({ urssaf: 29_100 * 0.18, retraite: 29_100 * 0.04, total: 6_402 });
    expect(x.b.netAvantImpot).toBe(29_100 - 6_402);
    // Le net imposable : le net avant impôt plus la CSG et la CRDS non déductibles, 2,9 % de 98,25 % du brut.
    expect(x.b.netImposable).toBe(c(22_698 + c(29_100 * 0.9825 * 0.029)));
    expect(x.b.prelevementALaSource).toBe(c(23_527.13 * 0.02));
    expect(x.b.netAPayer).toBe(c(22_698 - 470.54 - 1_100));
    expect(x.b.coutEmployeur).toBe(29_100 + 29_100 * 0.42);
    expect(x.p.sortiesDeBanque).toBe(x.b.coutEmployeur);
    expect(grilleDuBulletin().lignes.at(-1)!.cellules[0]!.valeur).toBe(41_322);
  });

  it("l'augmentation de 100 € nets : le brut à rebours, et son coût", () => {
    expect(AUGMENTATION_DEMANDEE_EN_NET).toBe(100);
    // Le plus petit brut qui verse 100 € nets, au centime.
    expect(bulletinDePaie(x.augmentation.brut, t).netAPayer).toBeGreaterThanOrEqual(100);
    expect(bulletinDePaie(c(x.augmentation.brut - 0.01), t).netAPayer).toBeLessThan(100);
    expect(x.augmentation.brut).toBe(130.93);
    expect(x.augmentation.cout).toBe(c(130.93 + c(130.93 * 0.36) + c(130.93 * 0.06)));
    expect(x.augmentation.netSiBrutEgalNet).toBeLessThan(100);
  });

  it("la demande d'augmentation se chiffre, elle ne se saisit pas", () => {
    const pile = (b.etapes.find((e) => e.id === "la-pile") as EtapeDeClassement).elements;
    expect(pile.find((e) => e.code === "augmentation")!.categorie).toBe("a-chiffrer");
  });
});

describe("la forme, le service et la langue", () => {
  it("un bureau de 5 à 9 pièces et 3 à 6 étapes, que le chapitre ouvre", () => {
    verifierUnBureau(b, { pieces: [5, 9], etapes: [3, 6] });
    expect(bureauxDuChapitre("la-paie").map((y) => y.code)).toContain(b.code);
    expect(b.entreprise.nom).toBe("ROUTE & CIE");
  });
});
