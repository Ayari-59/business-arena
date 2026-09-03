import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONCEPTS, conceptByCode } from "../../src/config/pedagogy/concepts";

/**
 * CHAQUE CHIFFRE DES COMPTES DE L'ÉLÈVE A UNE FICHE, OU EST DÉCLARÉ SANS.
 *
 * Le registre des notions s'est construit par le haut : on partait des
 * référentiels, on regardait ce qu'ils nomment, on ajoutait. C'est le mauvais
 * sens. La question qui compte n'est pas « qu'est-ce que l'arrêté nomme »,
 * c'est « qu'est-ce que l'élève lit sans pouvoir le comprendre ».
 *
 * Or il lit ses propres comptes à chaque clôture, et le compte de résultat lui
 * annonce « Excédent brut d'exploitation », « Dotations aux amortissements »,
 * « Coût complet unitaire ». Ces trois lignes n'avaient aucune fiche, et la
 * seconde en avait une TROMPEUSE : le registre portait « Tableau
 * d'amortissement », qui parle du remboursement d'un emprunt et n'a rien à
 * voir avec la dotation d'une immobilisation. L'élève qui cherchait tombait
 * sur la mauvaise.
 *
 * Rien ne le signalait, parce que rien ne reliait l'écran au registre. Cette
 * garde établit ce lien, et elle oblige à trancher : un libellé ajouté au
 * compte de résultat est soit rattaché à une notion, soit déclaré comme n'en
 * étant pas une. Elle a été écrite après avoir constaté qu'une ligne ajoutée
 * le matin même, « Commissions des canaux partenaires », était déjà dans le
 * cas.
 */

/**
 * Ce que chaque ligne des comptes enseigne. Une table DÉCLARÉE, et non une
 * correspondance devinée : l'écran dit « charges de structure » là où le
 * registre dit « coûts fixes », et aucun rapprochement automatique ne peut
 * décider que ce sont la même chose. C'est un choix pédagogique, il s'écrit.
 */
const FICHE_DE_LA_LIGNE: Record<string, string> = {
  "Chiffre d'affaires": "revenue",
  "− Coût variable des ventes": "variable_costs",
  "− Commissions des canaux partenaires": "distribution_commission",
  "= Marge sur coût variable": "contribution_margin",
  "− Charges de structure": "fixed_costs",
  "= Excédent brut d'exploitation (EBE)": "ebitda_margin",
  "− Dotations aux amortissements": "depreciation",
  "Stocks de produits finis": "stock",
  "Créances clients": "bfr",
  "Dettes fournisseurs": "bfr",
  "Dettes financières": "loan_schedule",
  "Disponibilités": "net_treasury",
  "Concours bancaires (découvert)": "net_treasury",
  "Capitaux propres": "frng",
  "Immobilisations nettes": "frng",
  "= Coût variable unitaire": "variable_costs",
  "Prix de vente": "psych_price",
  "= Marge sur coût variable / unité": "contribution_margin",
  "Coût complet unitaire (≈ variables + structure / vendues)": "full_unit_cost",
  "Coûts variables": "variable_costs",
  "Charges de structure (budgets et amortissements compris)": "fixed_costs",
  "Seuil de rentabilité": "breakeven",
  "Marge de sécurité": "safety_margin",
  "Indice de sécurité": "safety_margin",
  "Trésorerie d'ouverture": "net_treasury",
  "= Trésorerie de clôture": "net_treasury",
};

/**
 * Ce qui s'affiche sans être une notion à enseigner : un titre de panneau, un
 * total qui n'est que la somme au dessus, une ligne de budget que l'élève a
 * lui même saisie, un poste fiscal ou financier qui se lit sans méthode.
 *
 * La liste est explicite EXPRÈS. Déclarer qu'une ligne n'enseigne rien est une
 * décision ; la laisser tomber dans un trou n'en est pas une.
 */
const SANS_FICHE: string[] = [
  "Vos comptes du tour",
  "TOTAL ACTIF",
  "TOTAL PASSIF",
  "− Marketing",
  "− Qualité",
  "− Maintenance",
  "− Impôt sur les sociétés",
  "dont déficit antérieur imputé (report)",
  "− Charges financières (intérêts, agios, mobilisations)",
  "+ Produits financiers (placement)",
  "= RÉSULTAT NET",
  "= Résultat d'exploitation",
  "Production stockée (± Δ stock)",
  "Valeurs mobilières de placement",
];

const libelles = () => {
  const src = readFileSync("src/components/financial-statements.tsx", "utf8");
  return [...new Set([...src.matchAll(/label="([^"]+)"/g)].map((m) => m[1]!))];
};

describe("les comptes de l'élève se lisent", () => {
  it("chaque ligne affichée est rattachée à une fiche, ou déclarée sans", () => {
    const orphelines = libelles().filter(
      (l) => !(l in FICHE_DE_LA_LIGNE) && !SANS_FICHE.includes(l),
    );
    expect(
      orphelines,
      `l'élève lit ces lignes dans ses comptes sans que rien ne dise ce qu'elles sont :\n${orphelines.join("\n")}`,
    ).toEqual([]);
  });

  it("chaque fiche promise par la table existe au registre", () => {
    const absentes = [...new Set(Object.values(FICHE_DE_LA_LIGNE))].filter(
      (code) => !conceptByCode.has(code),
    );
    expect(
      absentes,
      `des lignes renvoient à des fiches qui n'existent pas : ${absentes.join(", ")}`,
    ).toEqual([]);
  });

  it("la table ne rattache aucune ligne qui n'est plus affichée", () => {
    // Une table qui garde des lignes disparues finit par mentir dans l'autre
    // sens : on croit une ligne couverte alors qu'elle n'existe plus.
    const affiches = libelles();
    const fantomes = [...Object.keys(FICHE_DE_LA_LIGNE), ...SANS_FICHE].filter(
      (l) => !affiches.includes(l),
    );
    expect(fantomes, `lignes déclarées mais plus affichées : ${fantomes.join(" · ")}`).toEqual([]);
  });

  it("aucune fiche du registre n'est un doublon d'une autre", () => {
    const noms = CONCEPTS.map((c) => c.name.toLowerCase().trim());
    expect(new Set(noms).size, "deux fiches portent le même nom").toBe(noms.length);
    const codes = CONCEPTS.map((c) => c.code);
    expect(new Set(codes).size, "deux fiches portent le même code").toBe(codes.length);
  });
});
