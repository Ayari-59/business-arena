import { describe, expect, it } from "vitest";
import { LE_PRET_DE_L_ANNEE as b, grilleDeLEmprunt } from "../../src/config/cours/bureaux/le-pret-de-l-annee";
import type { EtapeDeClassement, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { CONTRAT_DE_PRET } from "../../src/config/cours/monde/exercice-de-nova";
import { ECHEANCE_MAL_PASSEE, PREMIERE_ECHEANCE_DE_L_AVENANT, pretDeLAnnee } from "../../src/config/cours/monde/pret-de-l-annee";
import { enEcriture } from "../../src/pedagogy/cours/correcteur";
import { gardesDuBureau } from "../helpers/activites-du-lot-c";

/**
 * LE BUREAU « LE PRÊT DE L'ANNÉE » (monde/pret-de-l-annee.ts, bureaux/le-pret-de-l-annee.ts) : chaque
 * chiffre refait à la main depuis le contrat de la fiche de N, puis les gardes communes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = pretDeLAnnee();

describe("le prêt de l'année : chaque chiffre à la main", () => {
  it("le contrat de la fiche : 80 000 € à 5 % l'an, 20 trimestres, 4 000 € de capital par échéance", () => {
    expect(x.contrat).toBe(CONTRAT_DE_PRET);
    expect([x.contrat.capital, x.contrat.tauxAnnuel, x.tableau.length]).toEqual([80_000, 0.05, 20]);
    expect(x.i).toBe(0.0125);
    expect(x.capital).toBe(80_000 / 20);
  });

  it("les trois échéances de N : les intérêts sur le capital dû, au taux du trimestre", () => {
    expect([1, 2, 3].map((k) => x.e(k).interets)).toEqual([c(80_000 * 0.0125), c(76_000 * 0.0125), c(72_000 * 0.0125)]);
    expect([1, 2, 3].map((k) => x.e(k).echeance)).toEqual([5_000, 4_950, 4_900]);
    expect(x.annee.decaissements).toBe(5_000 + 4_950 + 4_900);
    expect(x.annee.interetsPayes).toBe(1_000 + 950 + 900);
  });

  it("l'erreur du président : l'échéance n° 1 en entier au 164, ses 1 000 € d'intérêts à ramener au 6611", () => {
    expect(ECHEANCE_MAL_PASSEE).toBe(1);
    expect(x.soldeDu164Avant).toBe(80_000 - 5_000);
    expect(x.correction).toBe(1_000);
  });

  it("les intérêts courus : 850 € de l'échéance de janvier, 88 jours sur 90, du 3 octobre au 31 décembre", () => {
    expect(x.suivante.interets).toBe(c(68_000 * 0.0125));
    expect([x.courus.jours, x.courus.joursDeLaPeriode]).toEqual([28 + 30 + 30, 90]);
    expect(x.courus.montant).toBe(c((850 * 88) / 90));
    expect(x.annee.chargeDInterets).toBe(c(2_850 + (850 * 88) / 90));
  });

  it("l'emprunt au 31 décembre : 68 000 € dus, 16 000 € dans les douze mois, 52 000 € au-delà", () => {
    expect(x.annee.capitalRestantDu).toBe(80_000 - 3 * 4_000);
    expect(x.annee.partAMoinsDUnAn).toBe(4 * 4_000);
    expect(x.partAPlusDUnAn).toBe(68_000 - 16_000);
  });

  it("la proposition de la banque : 64 000 € dus en avril N+1, 16 échéances constantes au même taux", () => {
    expect(PREMIERE_ECHEANCE_DE_L_AVENANT).toBe(5);
    expect(x.premiereDeLAvenant.capitalDebut).toBe(64_000);
    expect(x.restantes).toBe(16);
    expect(x.constante).toBe(c((64_000 * 0.0125) / (1 - 1.0125 ** -16)));
    expect(x.constante).toBeLessThan(x.premiereDeLAvenant.echeance);
  });

  it("les écritures passées rendent le 164 au capital dû et le 6611 à la charge de l'exercice", () => {
    const j = b.etapes.find((e) => e.id === "les-ecritures") as EtapeDuJournal;
    const solde = (compte: string, sens: 1 | -1) => c(j.ecritures.flatMap((e) => enEcriture(e.ecriture).lignes).filter((l) => l.compte === compte).reduce((t, l) => t + sens * (l.debit - l.credit), 0));
    expect(c(x.soldeDu164Avant + solde("164", -1))).toBe(x.annee.capitalRestantDu);
    expect(solde("6611", 1)).toBe(x.annee.chargeDInterets);
    expect(solde("1688", -1)).toBe(x.courus.montant);
  });

  it("le tableau de l'emprunt porte les chiffres du monde ; le classement met le relevé de janvier à la clôture", () => {
    const g = grilleDeLEmprunt();
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([14_850, 2_850, 831.11, 3_681.11, 68_000, 16_000, 52_000]);
    const tri = b.etapes[0] as EtapeDeClassement;
    expect(tri.elements.find((e) => e.code === "releve-janvier")!.categorie).toBe("a-la-cloture");
    expect(tri.elements.find((e) => e.code === "versement")!.categorie).toBe("rien");
  });
});

describe("le bureau « Le prêt de l'année »", () => {
  gardesDuBureau(b, "l-emprunt");
});
