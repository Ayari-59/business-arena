import { describe, expect, it } from "vitest";
import { bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LE_REMPLACEMENT_DE_LA_CUISINE as b, grilleDuRemplacement } from "../../src/config/cours/bureaux/le-remplacement-de-la-cuisine";
import type { EtapeDeClassement, EtapeDeReponse, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { DATE_DE_REVENTE, DEVIS_DU_FOURNISSEUR, PRIX_DE_L_OCCASION, TAUX_DE_TVA_DE_LA_CESSION } from "../../src/config/cours/chapitres/immobilisations";
import { MISE_EN_SERVICE_DE_LA_NOUVELLE, remplacementDeLaCuisine } from "../../src/config/cours/monde/remplacement-de-la-cuisine";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { verifierUnBureau } from "../helpers/activites-du-cours";

/**
 * LE BUREAU DU REMPLACEMENT DE LA CUISINE (monde/remplacement-de-la-cuisine.ts,
 * bureaux/le-remplacement-de-la-cuisine.ts). Chaque chiffre refait à la main depuis le cas figé de LA
 * TABLE D'AUGUSTIN et les hypothèses du chapitre « Immobilisations et amortissements » ; puis la forme,
 * le service et la langue (tests/helpers/activites-du-cours.ts).
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = remplacementDeLaCuisine();
const etape = <T>(id: string) => b.etapes.find((e) => e.id === id) as T;

describe("le remplacement, chaque chiffre à la main", () => {
  const i = casDeLEntreprise("bistrot").immobilisation;

  it("l'ancienne cuisine : le cas figé, amortie jusqu'au 30 juin de la 3e année", () => {
    // 30 000 € HT, mise en service le 6 janvier, 5 ans : 6 000 € par an.
    expect([i.ht, i.date, i.compte, x.ancienne.duree]).toEqual([30_000, 6, "2154", 5]);
    expect(DATE_DE_REVENTE).toEqual({ jour: 30, mois: 6, exercice: 2 });
    // 1re année : 355 jours (du 6 au 30 janvier, 25 jours, puis 11 mois de 30) ; 6 000 × 355 ÷ 360.
    expect(x.ancienne.premiere).toBe(c((6_000 * 355) / 360));
    expect(x.ancienne.deuxieme).toBe(6_000);
    // 3e année, du 1er janvier au 30 juin : 180 jours, 3 000 €.
    expect(x.ancienne.dotation).toBe(c((6_000 * 180) / 360));
    expect(x.ancienne.cumul).toBe(c(5_916.67 + 6_000 + 3_000));
    expect(x.ancienne.valeurNette).toBe(c(30_000 - 14_916.67));
  });

  it("la cession : 40 % du prix neuf, TVA à 20 %, une moins-value", () => {
    expect(PRIX_DE_L_OCCASION).toBe(0.4);
    expect(TAUX_DE_TVA_DE_LA_CESSION).toBe(0.2);
    expect(x.ancienne.prix).toBe(12_000);
    expect(x.ancienne.tvaDuPrix).toBe(2_400);
    expect(x.ancienne.prixTtc).toBe(14_400);
    expect(x.ancienne.resultat).toBe(c(12_000 - 15_083.33));
  });

  it("la nouvelle cuisine : le devis du chapitre, mise en service le 1er juillet", () => {
    expect(DEVIS_DU_FOURNISSEUR).toEqual({ remise: 0.05, livraison: 0.02, installation: 0.04, formation: 0.015, entretien: 0.025 });
    expect(MISE_EN_SERVICE_DE_LA_NOUVELLE).toEqual({ jour: 1, mois: 7, exercice: 2 });
    // 30 000 − 1 500 + 600 + 1 200 = 30 300 € ; formation 450 € et entretien 750 €, en charges.
    expect(x.nouvelle.cout).toBe(30_300);
    expect(x.nouvelle.charges).toBe(1_200);
    expect([x.nouvelle.tvaDuCout, x.nouvelle.tvaDesCharges, x.nouvelle.ttc]).toEqual([6_060, 240, 37_800]);
    // 30 300 ÷ 5 × 180 ÷ 360 = 3 030 €.
    expect(x.nouvelle.jours).toBe(180);
    expect(x.nouvelle.dotation).toBe(3_030);
  });

  it("le tableau tombe sur les mêmes chiffres, et les écritures les passent", () => {
    const g = grilleDuRemplacement();
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([30_000, 11_916.67, 3_000, 14_916.67, 15_083.33, 12_000, -3_083.33, 30_300, 3_030]);
    const j = etape<EtapeDuJournal>("les-ecritures");
    const cession = j.ecritures.find((e) => e.id === "cession")!.ecriture;
    expect(cession.lignes.find((l) => l.compte === "675")!.montant).toBe(15_083.33);
    expect(cession.lignes.find((l) => l.compte === "775")!.montant).toBe(12_000);
    const achat = j.ecritures.find((e) => e.id === "achat")!.ecriture;
    expect(achat.lignes.find((l) => l.compte === "404")!.montant).toBe(37_800);
  });

  it("le piège : le devis ne se saisit pas, la formation et l'entretien sont des charges", () => {
    expect(etape<EtapeDeClassement>("la-pile").elements.find((e) => e.code === "devis")!.categorie).toBe("rien");
    const lignes = etape<EtapeDeClassement>("la-facture").elements;
    expect(lignes.filter((e) => e.categorie === "charge").map((e) => e.code)).toEqual(["formation", "entretien"]);
    const q = etape<EtapeDeReponse>("la-reponse").questions;
    expect(espacesOrdinaires(q[0]!.options.find((o) => o.juste)!.texte)).toContain("3 083,33 €");
  });
});

describe("la forme, le service et la langue", () => {
  it("un bureau de 5 à 9 pièces et 3 à 6 étapes, que le chapitre ouvre", () => {
    verifierUnBureau(b, { pieces: [5, 9], etapes: [3, 6] });
    expect(bureauxDuChapitre("immobilisations").map((y) => y.code)).toContain(b.code);
    expect(b.entreprise.nom).toBe("LA TABLE D'AUGUSTIN");
  });
});
