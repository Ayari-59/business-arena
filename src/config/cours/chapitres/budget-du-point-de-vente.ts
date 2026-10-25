import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas, StockDuTrimestre } from "../cas";
import type { Chapitre } from "../types";
import { COMMERCES_A_STOCK } from "./stock-du-point-de-vente";

/**
 * CHAPITRE : LE BUDGET DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * Le trimestre chiffré avant qu'il commence : le budget des ventes, le budget des achats
 * (ce qu'il faut acheter pour vendre et finir avec le stock voulu), la marge commerciale
 * budgétée, puis ce que les achats feront sortir de la caisse dans le trimestre, et ce qui
 * restera dû au fournisseur.
 *
 * Aucune hypothèse : le trimestre est celui du chapitre « Le stock du point de vente »
 * (`cas.stock`) ; ses ventes et son stock final, que l'arène a joués, tiennent lieu de
 * prévision et d'objectif. La part des achats payée dans le trimestre suit la règle du
 * moteur : un fournisseur à N jours laisse dû, en fin de tour, N ÷ (jours du tour) des
 * achats du tour (`engine/simulation`, `payableRatio`).
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const stockDe = (c: Cas): StockDuTrimestre => {
  if (!c.stock) throw new Error(`Pas de stock pour ${c.code}`);
  return c.stock;
};

/** Le budget du trimestre, ligne à ligne. */
export function budgetDuPointDeVente(c: Cas) {
  const s = stockDe(c);
  const joursDuTour = scenarioByCode(c.code).scenario.roundDays;
  const delai = c.achat.delai;
  const ventesHt = s.ventes.ht;
  const ventesTtc = s.ventes.ttc;
  const aAcheter = s.vendues + s.final.quantite - s.initial.quantite;
  const achatsHt = auCentime(aAcheter * s.achats.prixUnitaire);
  const achatsTtc = auCentime(achatsHt * (1 + s.achats.tauxTva));
  const partDue = Math.min(1, delai / joursDuTour);
  const decaisse = auCentime(achatsTtc * (1 - partDue));
  return {
    s,
    joursDuTour,
    delai,
    ventesHt,
    ventesTtc,
    aAcheter,
    achatsHt,
    achatsTtc,
    margeBudgetee: auCentime(ventesHt - s.coutDAchatDesVendues),
    partPayee: Math.round((1 - partDue) * 1000) / 10,
    decaisse,
    detteFinale: auCentime(achatsTtc - decaisse),
  };
}

export const BUDGET_DU_POINT_DE_VENTE: Chapitre = {
  code: "budget-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "BUT TC · Piloter un espace de vente",
  ],
  titre: "Le budget du point de vente",
  accroche:
    "Le trimestre chiffré avant qu'il commence : ce qu'on vendra, ce qu'il faut acheter pour le vendre, la marge attendue, et ce que les achats feront sortir de la caisse.",
  objectifs: [
    "Établir le budget des ventes, hors taxes et toutes taxes comprises",
    "Calculer les quantités à acheter à partir des ventes et des stocks",
    "Établir le budget des achats et la marge commerciale budgétée",
    "Calculer les achats payés dans le trimestre et ce qui reste dû au fournisseur",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES_A_STOCK,
    pourquoi: "ce chapitre budgète des achats de marchandises et un stock, et elle n'en garde pas.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chiffrer avant de vivre",
      notions: ["cash_budget"],
      texte: (c) => {
        const s = stockDe(c);
        return [
          `Avant le trimestre ${s.trimestre}, la direction de ${c.entreprise} demande au manager son budget : combien il vendra, combien il achètera, et ce qui restera.`,
          `Le manager prévoit de vendre ${qte(s.vendues)} unités au prix moyen de ${eur(s.ventes.prixUnitaire)} hors taxes, et veut finir le trimestre avec ${qte(s.final.quantite)} unités en réserve. Il en a ${qte(s.initial.quantite)} au départ, achetées ${eur(s.achats.prixUnitaire)} pièce hors taxes.`,
        ];
      },
      repere: () => "Quantités à acheter = ventes prévues + stock final voulu − stock initial.",
    },
    {
      id: "budget-des-ventes",
      type: "montants",
      titre: "Le budget des ventes",
      notions: ["revenue", "vat_payable"],
      question: (c) => {
        const s = stockDe(c);
        return `Calculez le budget des ventes du trimestre : ${qte(s.vendues)} unités à ${eur(s.ventes.prixUnitaire)} hors taxes, puis avec la TVA de ${pct(s.ventes.tauxTva * 100)}.`;
      },
      champs: (c) => {
        const b = budgetDuPointDeVente(c);
        return [
          { libelle: "Ventes hors taxes", attendu: b.ventesHt, calcul: `${qte(b.s.vendues)} × ${eur(b.s.ventes.prixUnitaire)} = ${eur(b.ventesHt)}` },
          {
            libelle: "Ventes toutes taxes comprises",
            attendu: b.ventesTtc,
            calcul: `${eur(b.ventesHt)} × ${(1 + b.s.ventes.tauxTva).toLocaleString("fr-FR")} = ${eur(b.ventesTtc)}`,
          },
        ];
      },
      explication: (c) => {
        const b = budgetDuPointDeVente(c);
        return [`Le chiffre d'affaires budgété est de ${eur(b.ventesHt)} hors taxes. Les clients paieront ${eur(b.ventesTtc)} : la différence est la TVA, que ${c.entreprise} reversera.`];
      },
    },
    {
      id: "quantites-a-acheter",
      type: "montants",
      titre: "Ce qu'il faut acheter",
      notions: ["stock"],
      question: (c) => {
        const s = stockDe(c);
        return `Pour vendre ${qte(s.vendues)} unités et finir avec ${qte(s.final.quantite)} en réserve, en partant de ${qte(s.initial.quantite)}, combien ${c.entreprise} doit-elle en acheter ? Puis chiffrez ces achats, hors taxes, à ${eur(s.achats.prixUnitaire)} pièce.`;
      },
      champs: (c) => {
        const b = budgetDuPointDeVente(c);
        const s = b.s;
        return [
          {
            libelle: "Unités à acheter",
            attendu: b.aAcheter,
            calcul: `${qte(s.vendues)} + ${qte(s.final.quantite)} − ${qte(s.initial.quantite)} = ${qte(b.aAcheter)}`,
          },
          { libelle: "Achats hors taxes", attendu: b.achatsHt, calcul: `${qte(b.aAcheter)} × ${eur(s.achats.prixUnitaire)} = ${eur(b.achatsHt)}` },
        ];
      },
      explication: (c) => {
        const b = budgetDuPointDeVente(c);
        return [
          `${qte(b.aAcheter)} unités à acheter : c'est exactement ce que l'arène a acheté ce trimestre-là. Le stock voulu en fin de trimestre pèse autant que les ventes sur ce que l'on commande.`,
        ];
      },
    },
    {
      id: "marge-budgetee",
      type: "montants",
      titre: "La marge commerciale budgétée",
      notions: ["margin_rates"],
      question: (c) => {
        const b = budgetDuPointDeVente(c);
        return `Les unités vendues auront coûté ${eur(b.s.coutDAchatDesVendues)} à l'achat (le coût d'achat des marchandises vendues du chapitre sur le stock). Calculez la marge commerciale budgétée, hors taxes.`;
      },
      champs: (c) => {
        const b = budgetDuPointDeVente(c);
        return [{ libelle: "Marge commerciale budgétée", attendu: b.margeBudgetee, calcul: `${eur(b.ventesHt)} − ${eur(b.s.coutDAchatDesVendues)} = ${eur(b.margeBudgetee)}` }];
      },
      explication: (c) => {
        const b = budgetDuPointDeVente(c);
        return [
          `La marge se calcule sur ce qui est vendu, pas sur ce qui est acheté : les ${eur(b.achatsHt)} d'achats comprennent le stock qui reste en réserve, et qui ne sera marge qu'une fois vendu.`,
        ];
      },
    },
    {
      id: "achats-et-caisse",
      type: "montants",
      titre: "Ce que les achats font sortir de la caisse",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const b = budgetDuPointDeVente(c);
        return `Le fournisseur se paie à ${qte(b.delai)} jours. Dans l'arène, sur un trimestre de ${qte(b.joursDuTour)} jours d'achats réguliers, la part des achats encore due en fin de trimestre est de ${qte(b.delai)} ÷ ${qte(b.joursDuTour)}. Calculez les achats toutes taxes comprises (TVA de ${pct(b.s.achats.tauxTva * 100)}), la part payée dans le trimestre en pourcentage, le montant décaissé, et ce qui reste dû au fournisseur.`;
      },
      champs: (c) => {
        const b = budgetDuPointDeVente(c);
        return [
          { libelle: "Achats toutes taxes comprises", attendu: b.achatsTtc, calcul: `${eur(b.achatsHt)} × ${(1 + b.s.achats.tauxTva).toLocaleString("fr-FR")} = ${eur(b.achatsTtc)}` },
          { libelle: "Part payée dans le trimestre (%)", attendu: b.partPayee, calcul: `(1 − ${qte(b.delai)} ÷ ${qte(b.joursDuTour)}) × 100 = ${pct(b.partPayee)}`, tolerance: 0.1 },
          { libelle: "Décaissé dans le trimestre", attendu: b.decaisse, calcul: `${eur(b.achatsTtc)} × ${pct(b.partPayee)} = ${eur(b.decaisse)}`, tolerance: 0.05 },
          { libelle: "Dû au fournisseur en fin de trimestre", attendu: b.detteFinale, calcul: `${eur(b.achatsTtc)} − ${eur(b.decaisse)} = ${eur(b.detteFinale)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const b = budgetDuPointDeVente(c);
        return [
          `Sur ${eur(b.achatsTtc)} d'achats, ${eur(b.decaisse)} sortent de la caisse ce trimestre ; ${eur(b.detteFinale)} restent dus au fournisseur et seront payés au trimestre suivant. C'est la ligne « Dettes fournisseurs » du bilan, et une ligne du budget de trésorerie du trimestre d'après.`,
        ];
      },
    },
    {
      id: "si-on-se-trompe",
      type: "choix",
      titre: "Si la prévision était trop haute",
      notions: ["stock", "cash_budget"],
      question: (c) => `Le trimestre se termine : ${c.entreprise} a vendu moins que prévu, mais a acheté ce que le budget disait. Que se passe-t-il ?`,
      options: () => [
        {
          texte: "Le stock final est plus gros que voulu, et l'argent des achats dort en réserve.",
          juste: true,
          retour: "Oui. Les achats ont été faits pour des ventes qui ne sont pas venues : ce qui n'est pas vendu reste en stock. Il est payé, ou le sera, mais ne rapporte rien tant qu'il n'est pas vendu. D'où l'intérêt de suivre le budget mois par mois, et d'ajuster les commandes.",
        },
        {
          texte: "Rien : le budget a été respecté puisque les achats sont conformes.",
          juste: false,
          retour: "Le budget n'est pas respecté : les ventes sont sous la prévision. Un budget se suit dans l'écart entre le prévu et le réalisé, ligne par ligne.",
        },
        {
          texte: "La marge commerciale est plus forte, puisqu'on a acheté plus.",
          juste: false,
          retour: "La marge se calcule sur ce qui est vendu : moins de ventes, c'est moins de marge, quel que soit le volume acheté.",
        },
      ],
    },
  ],
};
