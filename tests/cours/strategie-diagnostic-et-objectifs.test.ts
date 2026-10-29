import { describe, expect, it } from "vitest";
import { LE_DIAGNOSTIC_STRATEGIQUE } from "../../src/config/cours/chapitres/le-diagnostic-strategique";
import { constatsDuDiagnostic } from "../../src/config/cours/monde/direction-de-nova";
import { PROGRAMME } from "../../src/config/cours/registre";
import { DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS, clientsRepartis } from "../../src/config/cours/situations/par-chapitre/des-clients-repartis-sans-etre-servis";
import type { Situation } from "../../src/config/cours/situations/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LE DIAGNOSTIC STRATÉGIQUE SUR LE MONDE DU COURS (lot M6), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur les fiches de NOVA : le premier exercice (79 225,96 € de bénéfice, 252 669,45 €
 * de trésorerie), la demande de N (23 609 enceintes) et de N + 1 (5 800, 7 400, 6 200 et 7 800), la
 * ligne de 7 000 et l'équipe de 7 200 par trimestre, 21 € de marge, 1 875 € de salaire face aux
 * 1 950 € puis 2 000 € du marché, le seuil de démission à 95 %, SoundBox à 51 €, Sonora et sa perte
 * probable de 40 %. « Se fixer des objectifs », l'autre chapitre du palier, est gardé par
 * pilotage-et-decision.test.ts.
 */


function reponseSansIndice(s: Situation) {
  const e = etape(chapitreDuCas(s, NOVA), s.etapes.at(-1)!.id, "choix");
  const options = e.options(NOVA, VIDE);
  const bonne = options.find((o) => o.juste)!;
  expect(bonne.texte.length, `${s.code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(LE_DIAGNOSTIC_STRATEGIQUE, PROGRAMME.strategie[1]!);
    gardeDuCas(DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS, LE_DIAGNOSTIC_STRATEGIQUE);
    reponseSansIndice(DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(LE_DIAGNOSTIC_STRATEGIQUE);
  });
});

describe("le diagnostic stratégique", () => {
  it("les chiffres : la demande monte de 15,2 %, la ligne en servira 95,6 %, le salaire paie 93,8 % du marché", () => {
    const demandeN = 4_778 + 6_081 + 5_810 + 6_940;
    expect(attendus(LE_DIAGNOSTIC_STRATEGIQUE, "chiffres")).toEqual([
      Math.round(((27_200 - demandeN) / demandeN) * 1000) / 10,
      Math.round(((27_200 - 1_200) / 27_200) * 1000) / 10,
      Math.round((1_875 / 2_000) * 1000) / 10,
    ]);
    expect(attendus(LE_DIAGNOSTIC_STRATEGIQUE, "chiffres")).toEqual([15.2, 95.6, 93.8]);
  });

  it("le tri : deux forces, deux faiblesses, une opportunité, trois menaces, chacune par sa règle", () => {
    expect(Object.values(triDe(LE_DIAGNOSTIC_STRATEGIQUE, "ranger")).sort()).toEqual(["faiblesse", "faiblesse", "force", "force", "menace", "menace", "menace", "opportunite"]);
    const k = Object.fromEntries(constatsDuDiagnostic().map((x) => [x.code, [x.montant, x.categorie]]));
    expect(k).toEqual({
      resultat: [79_225.96, "force"],
      tresorerie: [252_669.45, "force"],
      refusees: [(7_400 - 7_000) + (7_800 - 7_000), "faiblesse"],
      salaire: [93.8, "faiblesse"],
      demande: [15.2, "opportunite"],
      "marche-du-travail": [2_000, "menace"],
      concurrent: [51, "menace"],
      client: [40, "menace"],
    });
    // À 1 900 €, le salaire redevient une force.
    expect(constatsDuDiagnostic(1_900).find((x) => x.code === "salaire")!.categorie).toBe("force");
    expect(juste(LE_DIAGNOSTIC_STRATEGIQUE, "conclusion")).toEqual(["Corriger d'abord la faiblesse qui empêche de la saisir"]);
    expect(juste(LE_DIAGNOSTIC_STRATEGIQUE, "interne-ou-externe")).toEqual(["Du diagnostic externe : une menace"]);
  });

  it("le curseur : la paie reste une force tant que le marché paie au plus 1 973 €", () => {
    gardeDuCurseur(LE_DIAGNOSTIC_STRATEGIQUE, "le-marche-qui-monte", Math.floor(1_875 / 0.95));
    expect([1_875 >= 1_973 * 0.95, 1_875 >= 1_974 * 0.95]).toEqual([true, false]);
  });

  it("le laboratoire : 1 900 € est le plus petit salaire, de 25 en 25 €, au-dessus du seuil de 2 000 × 95 %", () => {
    const e = gardeDuLaboratoire(LE_DIAGNOSTIC_STRATEGIQUE, "le-laboratoire-du-diagnostic");
    expect(e.defi(NOVA).solution).toEqual({ salaire: 2_000 * 0.95 });
  });
});

describe("le cas du chapitre", () => {
  it("des clients repartis : Noël refuse 800 enceintes, 16 800 € de marge ; la ligne borne, l'équipe a 200 de jeu", () => {
    const k = clientsRepartis();
    expect([k.trimestre, k.production, k.refusees, k.margePerdue, k.goulot, k.jeuDeLEquipe, k.verdict]).toEqual([4, 7_000, 7_800 - 7_000, 800 * 21, "outil", 7_200 - 7_000, "capacite"]);
  });
});
