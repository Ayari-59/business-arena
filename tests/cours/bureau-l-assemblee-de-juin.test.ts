import { describe, expect, it } from "vitest";
import { L_ASSEMBLEE_DE_JUIN as b, grilleDesCapitauxPropres } from "../../src/config/cours/bureaux/l-assemblee-de-juin";
import type { EtapeDeClassement, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { assembleeDeJuin } from "../../src/config/cours/monde/assemblee-de-juin";
import { affectationDeNova, augmentation } from "../../src/config/cours/monde/capitaux-propres";
import { enEcriture } from "../../src/pedagogy/cours/correcteur";
import { gardesDuBureau } from "../helpers/activites-du-lot-c";

/**
 * LE BUREAU « L'ASSEMBLÉE DE JUIN » (monde/assemblee-de-juin.ts) : l'affectation de la version unique,
 * l'augmentation de juin N+1 et ses frais sur la prime, refaites à la main, puis les gardes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = affectationDeNova();
const a = augmentation();
const j = assembleeDeJuin();

describe("l'assemblée de juin : chaque chiffre à la main", () => {
  it("l'affectation : 5 % du bénéfice en réserve légale, 2 € pour 15 000 actions, 45 000 € de réserves, le reste en report", () => {
    expect(x.reserveLegale).toBe(c(x.benefice * 0.05));
    expect(x.dividendes).toBe(2 * 15_000);
    expect(x.reportANouveau).toBe(c(x.benefice - x.reserveLegale - 30_000 - 45_000));
  });

  it("l'augmentation : 5 000 actions à 12 €, 50 000 € de capital, 10 000 € de prime, moins 2 000 € de frais", () => {
    expect([a.nouvelles, a.fonds, a.capital, a.prime]).toEqual([15_000 / 3, 5_000 * 12, 5_000 * 10, 5_000 * 2]);
    expect(a.frais.paye).toBe(2_000 * 1.2);
    expect(a.frais.primeRestante).toBe(10_000 - 2_000);
  });

  it("les capitaux propres au 1er juillet, la banque, la réserve légale à venir", () => {
    expect(j.capitauxPropres).toBe(c(150_000 + 50_000 + 8_000 + x.reserveLegale + 45_000 + x.reportANouveau));
    expect(j.capitauxPropres).toBe(c(x.capitauxPropresAvant - 30_000 + 60_000 - 2_000));
    expect(j.tresorerie).toBe(60_000 - 2_400 - 30_000);
    expect(a.plafondApres).toBe(200_000 / 10);
    expect(a.resteADoter).toBe(c(20_000 - x.reserveLegale));
    expect(grilleDesCapitauxPropres().lignes.at(-1)!.cellules[0]!.valeur).toBe(a.resteADoter);
  });

  it("les écritures passées font les capitaux propres du tableau, et la banque du relevé", () => {
    const e = b.etapes.find((y) => y.type === "journal") as EtapeDuJournal;
    const lignes = e.ecritures.flatMap((y) => enEcriture(y.ecriture).lignes);
    const credit = (re: RegExp) => c(lignes.filter((l) => re.test(l.compte)).reduce((t, l) => t + l.credit - l.debit, 0));
    expect(c(x.capitauxPropresAvant + credit(/^(10|11|12)/))).toBe(j.capitauxPropres);
    expect(-credit(/^512$/)).toBe(j.tresorerie);
  });

  it("le classement : le vote du dividende baisse les capitaux propres, son paiement ne les change pas, la proposition non votée non plus", () => {
    const t = b.etapes[0] as EtapeDeClassement;
    const cat = (code: string) => t.elements.find((y) => y.code === code)!.categorie;
    expect([cat("affectation"), cat("souscription"), cat("honoraires"), cat("dividendes"), cat("actionnaire")]).toEqual(["baisse", "monte", "baisse", "rien", "rien"]);
  });
});

describe("le bureau « L'assemblée de juin »", () => {
  gardesDuBureau(b, "les-capitaux-propres");
});
