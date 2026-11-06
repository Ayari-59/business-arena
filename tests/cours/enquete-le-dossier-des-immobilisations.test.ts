import { describe, expect, it } from "vitest";
import type { EtapeDeClassement, EtapeDeRectification } from "../../src/config/cours/bureaux/types";
import { LE_DOSSIER_DES_IMMOBILISATIONS as e, grilleDesEffets } from "../../src/config/cours/enquetes/le-dossier-des-immobilisations";
import { dossierDesImmobilisations, effetSurLeResultat, rectificationsDuDossier } from "../../src/config/cours/monde/dossier-des-immobilisations";
import { gardesDuBureau } from "../helpers/activites-du-lot-c";

/**
 * L'ENQUÊTE « LE DOSSIER DES IMMOBILISATIONS » (monde/dossier-des-immobilisations.ts) : les écritures
 * justes du chapitre et celles de l'alternant, refaites à la main ; l'effet de chaque rectification ;
 * puis les gardes communes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const d = dossierDesImmobilisations();
const ec = (code: string) => d.find((x) => x.code === code)!;
const r = rectificationsDuDossier();

describe("le dossier des immobilisations : chaque chiffre à la main", () => {
  it("huit écritures, trois justes, cinq fausses de cinq natures", () => {
    expect(d).toHaveLength(8);
    expect(d.filter((x) => !x.erreur).map((x) => x.code)).toEqual(["production", "octroi", "versement"]);
    expect(new Set(d.filter((x) => x.erreur).map((x) => x.erreur)).size).toBe(5);
    for (const x of d.filter((y) => !y.erreur)) expect(x.alternant).toEqual(x.juste);
  });

  it("l'acompte : 30 % de 14 000 €, sans TVA ; l'alternant en a tiré 700 € de TVA", () => {
    expect(ec("acompte").juste[0]).toEqual({ compte: "238", debit: 14_000 * 0.3, credit: 0 });
    expect(ec("acompte").alternant.map((l) => l.debit)).toEqual([3_500, 700, 0]);
  });

  it("la cabine : 3 800 € + 140 h × 32 € + 1 720 € ; 400 heures sur 5 000, et non 90 jours sur 5 ans", () => {
    const cout = 3_800 + 140 * 32 + 1_720;
    expect(ec("production").juste[0]!.debit).toBe(cout);
    expect(ec("dotation").juste[0]!.debit).toBe(c((cout * 400) / 5_000));
    expect(ec("dotation").alternant[0]!.debit).toBe(c(((cout / 5) * 90) / 360));
  });

  it("la subvention : 30 % de 12 000 € ; 3 600 € ÷ 6 × 359 ÷ 360 au résultat, et non 3 600 € d'un coup", () => {
    expect(ec("octroi").juste[1]).toEqual({ compte: "131", debit: 0, credit: 12_000 * 0.3 });
    expect(ec("quote-part").juste[1]!.credit).toBe(c((3_600 / 6) * (359 / 360)));
    expect(ec("quote-part").alternant[1]!.credit).toBe(3_600);
  });

  it("la redevance : 6 600 € et 20 % de TVA au 44566 ; la provision : 7 200 € ÷ 3, hors taxes", () => {
    expect(ec("redevance").juste.map((l) => l.compte)).toEqual(["6122", "44566", "512"]);
    expect(ec("redevance").alternant.map((l) => l.compte)).toEqual(["6122", "44562", "512"]);
    expect(ec("redevance").juste[2]!.credit).toBe(6_600 * 1.2);
    expect(ec("provision").juste[0]!.debit).toBe(7_200 / 3);
    expect(ec("provision").alternant[0]!.debit).toBe(c((7_200 * 1.2) / 3));
  });

  it("l'effet des rectifications : 0, −300 €, −3 001,67 €, 0, +480 € ; au total −2 821,67 €", () => {
    expect(effetSurLeResultat([{ compte: "6811", debit: 100, credit: 0 }, { compte: "777", debit: 0, credit: 30 }])).toBe(-70);
    expect(r.ecarts.map((x) => x.ecart)).toEqual([0, c(500 - 800), c(598.33 - 3_600), 0, c(2_880 - 2_400)]);
    expect(r.total).toBe(c(-300 - 3_001.67 + 480));
    expect(grilleDesEffets().lignes.at(-1)!.cellules[0]!.valeur).toBe(r.total);
    // Le tableau a une ligne par écriture du dossier : il ne dit pas lesquelles sont fausses.
    expect(grilleDesEffets().lignes).toHaveLength(d.length + 1);
  });

  it("le tri et la rectification suivent le dossier", () => {
    const tri = e.etapes[0] as EtapeDeClassement;
    const rect = e.etapes[1] as EtapeDeRectification;
    expect(tri.elements.filter((x) => x.categorie === "fausse").map((x) => x.code)).toEqual(rect.ecritures.map((x) => x.id));
    expect(rect.ecritures.map((x) => x.raison)).toEqual(d.filter((x) => x.erreur).map((x) => x.erreur));
  });
});

describe("l'enquête « Le dossier des immobilisations »", () => {
  gardesDuBureau(e, "acquerir-et-financer-une-immobilisation");
});
