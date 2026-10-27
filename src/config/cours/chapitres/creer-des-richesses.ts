import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CompanyRoundResult } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { METIERS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CRÉER DES RICHESSES ET LES MESURER (Seconde, sciences économiques et sociales,
 * palier 1).
 *
 * Le regard de l'économiste de seconde sur la production : une entreprise crée de la richesse
 * quand ce qu'elle produit vaut plus que ce qu'elle a acheté à d'autres entreprises pour le
 * produire. Le chapitre lit les comptes de l'année du cours : la production (le chiffre
 * d'affaires), les consommations intermédiaires (les achats et les services extérieurs), la
 * valeur ajoutée de l'entreprise ; puis celle de ses deux concurrents, et leur somme, la richesse
 * créée par tout le marché : l'idée du PIB, à l'échelle d'un marché. Enfin, ce que la valeur
 * ajoutée rémunère : les salaires, les intérêts, les impôts et le profit.
 *
 * Il ne double pas « La valeur ajoutée et son partage » (bac STMG, gestion et finance), qui
 * calcule le taux de valeur ajoutée de l'entreprise et la part de chacun de ses partenaires ; ni
 * « Le compte de résultat ». Ici, l'objet est la mesure de la richesse : ce qui se compte, ce qui
 * ne se compte pas deux fois, et l'addition des valeurs ajoutées de tout un marché.
 *
 * D'où viennent les chiffres. Les comptes des trois entreprises dans l'année du cours
 * (`anneeJouee`), tels que le moteur les tient, à l'euro près :
 *   · la production est le chiffre d'affaires de l'année ;
 *   · les achats pour produire sont le coût des unités vendues (matières ou marchandises, et les
 *     autres coûts de chaque vente, que `METIERS` décrit) ; les services extérieurs, les
 *     commissions des intermédiaires, la publicité, les dépenses de qualité, l'entretien, le loyer
 *     et les frais de structure (les charges fixes, moins le personnel) ;
 *   · les salaires et charges du personnel sont ceux de l'équipe que les charges fixes comptent
 *     déjà, plus ce que les décisions d'équipe y ajoutent (`hr.cost` : embauches, formation) ;
 *   · les intérêts, l'impôt, le bénéfice et l'usure de l'équipement (l'amortissement) sont ceux
 *     du compte de résultat.
 * Chaque ligne s'arrondit à l'euro ; le loyer et les frais de structure se déduisent des autres,
 * pour que la valeur ajoutée se partage à l'euro près : le profit est le bénéfice de l'année plus
 * l'usure de l'équipement, que l'entreprise garde pour le remplacer. Aucune hypothèse n'est
 * ajoutée.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** Les comptes d'un vendeur, sur les trimestres lus, rangés comme l'économiste les lit. */
export interface ComptesDuVendeur {
  id: string;
  nom: string;
  production: number;
  achats: number;
  commissions: number;
  publicite: number;
  qualite: number;
  entretien: number;
  loyerEtFrais: number;
  consommations: number;
  valeurAjoutee: number;
  salaires: number;
  interets: number;
  impots: number;
  /** Ce que l'entreprise garde : son bénéfice et l'usure de son équipement. */
  profit: number;
  benefice: number;
  amortissement: number;
  /** Les autres produits et charges hors activité (placements, exceptionnels) : nuls dans l'année du cours. */
  horsActivite: number;
}

/** Les trois vendeurs de l'année du cours, l'entreprise de l'élève d'abord, sur les trimestres donnés (à partir de 1). */
export function comptesDuMarche(c: Cas, trimestres: readonly number[] = [1, 2, 3, 4]): ComptesDuVendeur[] {
  const def = scenarioByCode(c.code);
  const hr = def.scenario.hr!;
  const { partie } = anneeJouee(c.code);
  const ids = ["joueur", ...def.bots.slice(0, 2).map((b) => b.id)];
  return ids.map((id) => {
    const rs = trimestres.map((t) => partie.rounds[t - 1]!.results[id]!);
    const somme = (f: (r: CompanyRoundResult) => number) => Math.round(rs.reduce((t, r) => t + f(r), 0));
    const is = (r: CompanyRoundResult) => r.incomeStatement;
    const production = somme((r) => is(r).revenue);
    const achats = somme((r) => is(r).cogs);
    const commissions = somme((r) => is(r).commissionCost ?? 0);
    const publicite = somme((r) => is(r).marketingCost);
    const qualite = somme((r) => is(r).qualityCost);
    const entretien = somme((r) => is(r).maintenanceCost);
    const salaires = somme(() => hr.includedHeadcount * hr.salaryPerEmployeePerRound) + somme((r) => r.hr?.cost ?? 0);
    const interets = somme((r) => is(r).interest);
    const impots = somme((r) => is(r).tax);
    const benefice = somme((r) => is(r).netIncome);
    const amortissement = somme((r) => is(r).depreciation);
    const horsActivite = somme(
      (r) =>
        (is(r).financialIncome ?? 0) +
        (is(r).exceptionalIncome ?? 0) +
        (is(r).rescueSubsidy ?? 0) -
        (is(r).exceptionalCharge ?? 0) -
        (is(r).chargesDeRachat ?? 0),
    );
    // Le loyer et les frais de structure, déduits à l'euro près : le compte de résultat se boucle.
    const loyerEtFrais =
      production - achats - commissions - publicite - qualite - entretien - salaires - amortissement - interets + horsActivite - impots - benefice;
    const consommations = achats + commissions + publicite + qualite + entretien + loyerEtFrais;
    const valeurAjoutee = production - consommations;
    return {
      id,
      nom: id === "joueur" ? c.entreprise : def.bots.find((b) => b.id === id)!.name,
      production,
      achats,
      commissions,
      publicite,
      qualite,
      entretien,
      loyerEtFrais,
      consommations,
      valeurAjoutee,
      salaires,
      interets,
      impots,
      profit: valeurAjoutee - salaires - interets - impots,
      benefice,
      amortissement,
      horsActivite,
    };
  });
}

export type Verdict = "tous-en-benefice" | "meme-en-perte" | "sans-richesse";

/** Ce que le chapitre lit et calcule sur l'année du cours. */
export function richessesDuMarche(c: Cas) {
  const vendeurs = comptesDuMarche(c);
  const [e, a, b] = vendeurs as [ComptesDuVendeur, ComptesDuVendeur, ComptesDuVendeur];
  const somme = (f: (v: ComptesDuVendeur) => number) => vendeurs.reduce((t, v) => t + f(v), 0);
  const valeurAjouteeDuMarche = somme((v) => v.valeurAjoutee);
  const productionDuMarche = somme((v) => v.production);
  const consommationsDuMarche = somme((v) => v.consommations);
  const salairesDuMarche = somme((v) => v.salaires);
  const plusGrandeValeur = vendeurs.reduce((g, x) => (x.valeurAjoutee > g.valeurAjoutee ? x : g));
  const plusGrosChiffre = vendeurs.reduce((g, x) => (x.production > g.production ? x : g));
  const enPerte = vendeurs.filter((v) => v.benefice < 0);
  const verdict: Verdict = vendeurs.some((v) => v.valeurAjoutee <= 0)
    ? "sans-richesse"
    : enPerte.length > 0
      ? "meme-en-perte"
      : "tous-en-benefice";
  return {
    vendeurs,
    entreprise: e,
    concurrents: [a, b] as const,
    valeurAjouteeDuMarche,
    productionDuMarche,
    consommationsDuMarche,
    salairesDuMarche,
    partDesSalaires: auDixieme((salairesDuMarche / valeurAjouteeDuMarche) * 100),
    plusGrandeValeur,
    plusGrosChiffre,
    enPerte,
    verdict,
  };
}

/** Les lignes des comptes d'un vendeur : les consommations intermédiaires, puis le partage de la valeur ajoutée. */
export function lignesDesComptes(v: ComptesDuVendeur) {
  const lignes: { code: string; libelle: string; montant: number; categorie: "ci" | "partage"; pourquoi: string }[] = [
    {
      code: "achats",
      libelle: "Achats pour produire",
      montant: v.achats,
      categorie: "ci",
      pourquoi: "Ce que chaque vente demande d'acheter à des fournisseurs, et qui disparaît dans la production : une consommation intermédiaire.",
    },
  ];
  if (v.commissions > 0)
    lignes.push({
      code: "commissions",
      libelle: "Commissions des intermédiaires",
      montant: v.commissions,
      categorie: "ci",
      pourquoi: "Un service acheté à une autre entreprise, qui vend pour le compte de celle-ci : une consommation intermédiaire.",
    });
  lignes.push({
    code: "publicite",
    libelle: "Publicité",
    montant: v.publicite,
    categorie: "ci",
    pourquoi: "Un service acheté aux médias et aux agences : une consommation intermédiaire.",
  });
  if (v.qualite > 0)
    lignes.push({
      code: "qualite",
      libelle: "Dépenses de qualité",
      montant: v.qualite,
      categorie: "ci",
      pourquoi: "Des contrôles et de meilleures fournitures, achetés à d'autres entreprises : une consommation intermédiaire.",
    });
  lignes.push(
    {
      code: "entretien",
      libelle: "Entretien de l'équipement",
      montant: v.entretien,
      categorie: "ci",
      pourquoi: "Un service et des pièces achetés à d'autres entreprises : une consommation intermédiaire.",
    },
    {
      code: "loyer",
      libelle: "Loyer et frais de structure",
      montant: v.loyerEtFrais,
      categorie: "ci",
      pourquoi: "Le local, l'énergie, l'assurance : des services achetés à d'autres. Une consommation intermédiaire.",
    },
    {
      code: "salaires",
      libelle: "Salaires et charges du personnel",
      montant: v.salaires,
      categorie: "partage",
      pourquoi: "La rémunération du travail de l'équipe, qui crée la richesse : une part de la valeur ajoutée.",
    },
    {
      code: "interets",
      libelle: "Intérêts de l'emprunt",
      montant: v.interets,
      categorie: "partage",
      pourquoi: "La rémunération de la banque, qui a prêté de quoi produire : une part de la valeur ajoutée.",
    },
  );
  if (v.impots > 0)
    lignes.push({
      code: "impots",
      libelle: "Impôt sur les bénéfices",
      montant: v.impots,
      categorie: "partage",
      pourquoi: "Ce que l'État prélève sur la richesse créée, pour financer ses services : une part de la valeur ajoutée.",
    });
  return lignes;
}

const CATEGORIES = [
  { code: "ci", libelle: "Consommation intermédiaire" },
  { code: "partage", libelle: "Partage de la valeur ajoutée" },
] as const;

function tableauDesComptes(c: Cas): TableauDeDonnees {
  const k = richessesDuMarche(c);
  return {
    titre: `Les comptes de l'année ${dE(c.entreprise)}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Production (chiffre d'affaires)", valeurs: [eur(k.entreprise.production)] },
      ...lignesDesComptes(k.entreprise).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
    ],
  };
}

function tableauDuMarche(c: Cas): TableauDeDonnees {
  const k = richessesDuMarche(c);
  return {
    titre: "La production et les consommations des trois vendeurs, sur l'année",
    colonnes: k.vendeurs.map((v) => v.nom),
    lignes: [
      { libelle: "Production (chiffre d'affaires)", valeurs: k.vendeurs.map((v) => eur(v.production)) },
      { libelle: "Consommations intermédiaires", valeurs: k.vendeurs.map((v) => eur(v.consommations)) },
    ],
  };
}

function tableauDuPartage(c: Cas): TableauDeDonnees {
  const k = richessesDuMarche(c);
  return {
    titre: "Ce que la valeur ajoutée de chaque vendeur rémunère, sur l'année",
    colonnes: k.vendeurs.map((v) => v.nom),
    lignes: [
      { libelle: "Valeur ajoutée", valeurs: k.vendeurs.map((v) => eur(v.valeurAjoutee)) },
      { libelle: "Salaires et charges du personnel", valeurs: k.vendeurs.map((v) => eur(v.salaires)) },
      { libelle: "Intérêts de l'emprunt", valeurs: k.vendeurs.map((v) => eur(v.interets)) },
      { libelle: "Impôt sur les bénéfices", valeurs: k.vendeurs.map((v) => eur(v.impots)) },
    ],
  };
}

function tableauDesBenefices(c: Cas): TableauDeDonnees {
  const k = richessesDuMarche(c);
  return {
    titre: "La richesse créée et le bénéfice de chaque vendeur, sur l'année",
    colonnes: k.vendeurs.map((v) => v.nom),
    lignes: [
      { libelle: "Valeur ajoutée", valeurs: k.vendeurs.map((v) => eur(v.valeurAjoutee)) },
      { libelle: "Bénéfice de l'année", valeurs: k.vendeurs.map((v) => eur(v.benefice)) },
    ],
  };
}

export const CREER_DES_RICHESSES: Chapitre = {
  code: "creer-des-richesses",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?"],
  titre: "Créer des richesses et les mesurer",
  accroche:
    "Une entreprise qui vend pour un million d'euros n'a pas créé un million de richesse : une part de ce prix paie ce que d'autres ont produit. Mesurer la valeur ajoutée d'une entreprise, puis celle de tout son marché.",
  objectifs: [
    "Distinguer la production et les consommations intermédiaires",
    "Calculer la valeur ajoutée d'une entreprise",
    "Additionner les valeurs ajoutées d'un marché, comme le PIB le fait pour un pays",
    "Dire ce que la valeur ajoutée rémunère : salaires, intérêts, impôts et profit",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Produire, c'est créer des richesses",
      notions: ["revenue", "income_statement"],
      tableau: tableauDesComptes,
      texte: (c) => {
        const k = richessesDuMarche(c);
        return [
          `Dans l'année du cours, ${c.entreprise} a vendu pour ${eur(k.entreprise.production)} : c'est sa production, mesurée par son chiffre d'affaires. Mais pour produire, elle a acheté à d'autres entreprises des biens et des services qui ont disparu dans sa production : les achats pour produire (y compris ${METIERS[c.code]!.autresCoutsVariables}), la publicité, l'entretien, le loyer. Ce sont ses consommations intermédiaires.`,
          "Ces consommations sont des richesses que d'autres entreprises ont créées. La richesse que l'entreprise crée elle-même, par le travail de son équipe et son équipement, est ce qui reste : sa valeur ajoutée. Elle sert ensuite à payer ceux qui ont aidé à la créer.",
        ];
      },
      repere: () => "Valeur ajoutée = production − consommations intermédiaires.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Acheté à d'autres, ou partagé",
      notions: ["income_statement"],
      question: () =>
        "Rangez chaque ligne des comptes : c'est une consommation intermédiaire (un bien ou un service acheté à une autre entreprise et utilisé pour produire), ou une part de la valeur ajoutée versée à ceux qui ont aidé à la créer.",
      categories: CATEGORIES,
      elements: (c) => lignesDesComptes(richessesDuMarche(c).entreprise).map(({ libelle, montant, categorie, pourquoi }) => ({ libelle, montant, categorie, pourquoi })),
      explication: () => [
        "Les consommations intermédiaires se retirent de la production : elles sont la richesse d'autres entreprises. Les salaires, les intérêts et l'impôt, eux, ne s'en retirent pas : ils sont payés avec la richesse que l'entreprise a créée.",
      ],
    },
    {
      id: "valeur-ajoutee",
      type: "montants",
      titre: "La valeur ajoutée de l'entreprise",
      notions: ["income_statement", "revenue"],
      tableau: tableauDesComptes,
      question: (c) => `Calculez les consommations intermédiaires ${dE(c.entreprise)} sur l'année, puis sa valeur ajoutée.`,
      champs: (c) => {
        const e = richessesDuMarche(c).entreprise;
        const ci = lignesDesComptes(e).filter((l) => l.categorie === "ci");
        return [
          { libelle: "Consommations intermédiaires", attendu: e.consommations, calcul: `${ci.map((l) => eur(l.montant)).join(" + ")} = ${eur(e.consommations)}` },
          { libelle: `Valeur ajoutée ${dE(c.entreprise)}`, attendu: e.valeurAjoutee, calcul: `${eur(e.production)} − ${eur(e.consommations)} = ${eur(e.valeurAjoutee)}` },
        ];
      },
      explication: (c) => {
        const e = richessesDuMarche(c).entreprise;
        const part = auDixieme((e.valeurAjoutee / e.production) * 100);
        return [
          `Sur ${eur(e.production)} de ventes, ${c.entreprise} a créé ${eur(e.valeurAjoutee)} de richesse, soit ${pct(part)} de sa production. Le reste, ${eur(e.consommations)}, paie la production d'autres entreprises.`,
        ];
      },
    },
    {
      id: "valeur-du-marche",
      type: "montants",
      titre: "La richesse créée par tout le marché",
      notions: ["income_statement", "revenue"],
      tableau: tableauDuMarche,
      question: (c) => {
        const k = richessesDuMarche(c);
        const [a, b] = k.concurrents;
        return `${c.entreprise} n'est pas seule sur son marché. Calculez la valeur ajoutée ${dE(a.nom)} et celle ${dE(b.nom)}, puis la valeur ajoutée du marché : la somme des valeurs ajoutées des trois vendeurs (celle ${dE(c.entreprise)} est de ${eur(k.entreprise.valeurAjoutee)}).`;
      },
      champs: (c) => {
        const k = richessesDuMarche(c);
        const [a, b] = k.concurrents;
        return [
          { libelle: `Valeur ajoutée ${dE(a.nom)}`, attendu: a.valeurAjoutee, calcul: `${eur(a.production)} − ${eur(a.consommations)} = ${eur(a.valeurAjoutee)}` },
          { libelle: `Valeur ajoutée ${dE(b.nom)}`, attendu: b.valeurAjoutee, calcul: `${eur(b.production)} − ${eur(b.consommations)} = ${eur(b.valeurAjoutee)}` },
          {
            libelle: "Valeur ajoutée du marché",
            attendu: k.valeurAjouteeDuMarche,
            calcul: `${k.vendeurs.map((v) => eur(v.valeurAjoutee)).join(" + ")} = ${eur(k.valeurAjouteeDuMarche)}`,
          },
        ];
      },
      explication: (c) => {
        const k = richessesDuMarche(c);
        return [
          `Le marché ${dE(c.entreprise)} a créé ${eur(k.valeurAjouteeDuMarche)} de richesse dans l'année. Un pays mesure sa production de la même façon : le produit intérieur brut (PIB) est la somme des valeurs ajoutées de tous ceux qui produisent sur son territoire.`,
        ];
      },
    },
    {
      id: "sans-double-compte",
      type: "choix",
      titre: "Pourquoi additionner les valeurs ajoutées",
      notions: ["income_statement"],
      question: () => "Pour mesurer la richesse créée par le marché, pourquoi additionner les valeurs ajoutées plutôt que les chiffres d'affaires ?",
      options: (c) => {
        const k = richessesDuMarche(c);
        return [
          {
            texte: "Pour ne pas compter deux fois ce que d'autres entreprises ont produit",
            juste: true,
            retour: `Oui : les trois chiffres d'affaires font ${eur(k.productionDuMarche)}, mais ${eur(k.consommationsDuMarche)} paient des biens et des services produits par d'autres entreprises, les fournisseurs, qui comptent déjà cette richesse dans leur propre valeur ajoutée. Additionner les chiffres d'affaires la compterait deux fois.`,
          },
          {
            texte: "Parce que la valeur ajoutée est toujours plus grande que le chiffre d'affaires",
            juste: false,
            retour: `Non : c'est l'inverse. La valeur ajoutée du marché, ${eur(k.valeurAjouteeDuMarche)}, est plus petite que ses chiffres d'affaires réunis, ${eur(k.productionDuMarche)} : on en a retiré les consommations intermédiaires.`,
          },
          {
            texte: "Parce que le chiffre d'affaires ne compte que les ventes au comptant",
            juste: false,
            retour: `Non : le chiffre d'affaires compte toutes les ventes de l'année. S'il ne mesure pas la richesse créée, c'est qu'il comprend les ${eur(k.consommationsDuMarche)} de consommations intermédiaires, déjà comptées chez les fournisseurs.`,
          },
        ];
      },
    },
    {
      id: "qui-cree-le-plus",
      type: "choix",
      titre: "Qui crée le plus de richesse",
      notions: ["income_statement", "revenue"],
      tableau: tableauDuMarche,
      question: () => "Lequel des trois vendeurs crée le plus de richesse dans l'année ?",
      options: (c) => {
        const k = richessesDuMarche(c);
        const g = k.plusGrandeValeur;
        const ch = k.plusGrosChiffre;
        return k.vendeurs.map((v) => ({
          texte: v.nom,
          juste: v === g,
          retour:
            v === g
              ? `Oui : ${eur(g.valeurAjoutee)} de valeur ajoutée. ${
                  g === ch
                    ? `C'est aussi le plus gros chiffre d'affaires du marché, ${eur(g.production)}.`
                    : `Pourtant, c'est ${ch.nom} qui vend le plus, ${eur(ch.production)} : il achète davantage à d'autres entreprises (${eur(ch.consommations)}), et crée moins lui-même. Le chiffre d'affaires ne mesure pas la richesse créée.`
                }`
              : `Non : ${v.nom} crée ${eur(v.valeurAjoutee)}, contre ${eur(g.valeurAjoutee)} pour ${g.nom}.${v === ch ? " Il vend le plus, mais il achète aussi le plus à d'autres." : ""}`,
        }));
      },
    },
    {
      id: "partage",
      type: "montants",
      titre: "Ce que la valeur ajoutée rémunère",
      notions: ["payroll", "income_statement"],
      tableau: tableauDuPartage,
      question: (c) =>
        `La valeur ajoutée paie ceux qui ont aidé à la créer : les salariés (salaires), la banque (intérêts), l'État (impôts), et l'entreprise elle-même (le profit, ce qui reste). Calculez le profit ${dE(c.entreprise)}, puis les salaires versés par les trois vendeurs, et la part des salaires dans la valeur ajoutée du marché, au dixième.`,
      champs: (c) => {
        const k = richessesDuMarche(c);
        const e = k.entreprise;
        return [
          {
            libelle: `Profit ${dE(c.entreprise)}`,
            attendu: e.profit,
            calcul: `${eur(e.valeurAjoutee)} − ${eur(e.salaires)} − ${eur(e.interets)} − ${eur(e.impots)} = ${eur(e.profit)}`,
          },
          {
            libelle: "Salaires versés par les trois vendeurs",
            attendu: k.salairesDuMarche,
            calcul: `${k.vendeurs.map((v) => eur(v.salaires)).join(" + ")} = ${eur(k.salairesDuMarche)}`,
          },
          {
            libelle: "Part des salaires dans la valeur ajoutée du marché (%)",
            attendu: k.partDesSalaires,
            calcul: `${eur(k.salairesDuMarche)} ÷ ${eur(k.valeurAjouteeDuMarche)} × 100 = ${pct(k.partDesSalaires)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = richessesDuMarche(c);
        const e = k.entreprise;
        return [
          `${c.entreprise} garde ${eur(e.profit)} de profit : son bénéfice de l'année, ${eur(e.benefice)}, et de quoi remplacer son équipement usé, ${eur(e.amortissement)}.`,
          `Sur le marché, ${pct(k.partDesSalaires)} de la richesse créée paie le travail. ${k.partDesSalaires > 50 ? "Les salaires en sont la plus grosse part : la richesse créée paie d'abord le travail qui la crée." : "Le travail en reçoit moins de la moitié : le profit, les intérêts et les impôts se partagent le reste."}`,
        ];
      },
    },
    {
      id: "richesse-et-benefice",
      type: "choix",
      titre: "Créer de la richesse, faire un bénéfice",
      notions: ["income_statement"],
      tableau: tableauDesBenefices,
      question: (c) => `Laquelle de ces phrases est juste pour le marché ${dE(c.entreprise)}, cette année ?`,
      options: (c) => {
        const k = richessesDuMarche(c);
        const perte = k.enPerte
          .map(
            (v) =>
              `${v.nom} finit l'année avec une perte de ${eur(-v.benefice)}, mais crée ${eur(v.valeurAjoutee)} de valeur ajoutée : ${
                v.profit >= 0
                  ? `elle paie ses salariés, la banque et l'État, et laisse un profit de ${eur(v.profit)}, trop peu pour couvrir l'usure de son équipement (${eur(v.amortissement)})`
                  : `cette richesse ne suffit pas à payer ses salariés, la banque et l'État, il manque ${eur(-v.profit)}`
              }`,
          )
          .join(" ; ");
        const faits =
          k.verdict === "meme-en-perte"
            ? `${perte}. Créer de la richesse et faire un bénéfice, ce n'est pas la même chose.`
            : k.verdict === "tous-en-benefice"
              ? `les trois vendeurs créent de la richesse (${k.vendeurs.map((v) => eur(v.valeurAjoutee)).join(", ")}) et finissent l'année en bénéfice.`
              : `${k.vendeurs.filter((v) => v.valeurAjoutee <= 0).map((v) => v.nom).join(" et ")} a acheté à d'autres plus qu'il n'a produit.`;
        return [
          {
            texte: "Chaque vendeur crée de la richesse, même celui qui finit en perte",
            juste: k.verdict === "meme-en-perte",
            retour: k.verdict === "meme-en-perte" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Chaque vendeur crée de la richesse, et tous finissent en bénéfice",
            juste: k.verdict === "tous-en-benefice",
            retour: k.verdict === "tous-en-benefice" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "L'un des vendeurs ne crée aucune richesse",
            juste: k.verdict === "sans-richesse",
            retour: k.verdict === "sans-richesse" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "payroll"],
      texte: (c) => {
        const k = richessesDuMarche(c);
        const e = k.entreprise;
        return [
          `Dans l'année du cours, ${c.entreprise} produit ${eur(e.production)} et crée ${eur(e.valeurAjoutee)} de valeur ajoutée. Avec ses deux concurrents, le marché crée ${eur(k.valeurAjouteeDuMarche)} de richesse, dont ${pct(k.partDesSalaires)} paient les salaires.`,
          "Mesurer la richesse créée, c'est retirer de la production ce que d'autres ont produit : les consommations intermédiaires. Additionner les valeurs ajoutées de tous les producteurs donne la richesse d'un marché, et pour un pays le PIB. Cette richesse rémunère le travail (les salaires), la banque (les intérêts), l'État (les impôts) et l'entreprise (le profit).",
        ];
      },
      repere: () =>
        "Valeur ajoutée = production − consommations intermédiaires. PIB = somme des valeurs ajoutées. Valeur ajoutée = salaires + intérêts + impôts + profit.",
    },
  ],
};
