import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { budgetDuPointDeVente } from "../../chapitres/budget-du-point-de-vente";
import { COMMERCES_A_STOCK } from "../../chapitres/stock-du-point-de-vente";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET DU POINT DE VENTE » : RÉVISER LE BUDGET (BTS MCO,
 * palier 3).
 *
 * La direction relève la prévision de ventes du trimestre, sans toucher au stock voulu en
 * fin de trimestre. Elle demande le budget révisé : les ventes, ce qu'il faut acheter, la
 * marge commerciale attendue, et ce que les achats feront sortir de la caisse. L'élève
 * refait seul les lignes du budget du chapitre, avec la nouvelle prévision.
 *
 * Le cas est neuf par sa question : le chapitre bâtit le budget sur les ventes que l'arène a
 * jouées ; ici, la prévision monte, et l'on cherche ce qui monte avec elle. Le piège : les
 * achats ne montent pas du même pourcentage que les ventes, parce que les stocks de début
 * et de fin ne bougent pas. Le trimestre et les règles de paiement sont ceux du chapitre
 * (`budgetDuPointDeVente`).
 */

/**
 * La hausse de la prévision de ventes : 10 %. C'est ce qu'une direction ajoute à un budget
 * quand une opération commerciale est décidée pour le trimestre, ou quand le trimestre
 * précédent a dépassé la prévision : une révision franche, sans changer d'échelle.
 */
export const HAUSSE_DES_VENTES_PREVUES = 0.1;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

/** Les chiffres de la réponse, calculés une fois du cas. */
export function budgetRevise(c: Cas) {
  const b = budgetDuPointDeVente(c);
  const s = b.s;
  const unitesPrevues = Math.round(s.vendues * (1 + HAUSSE_DES_VENTES_PREVUES));
  const ventesHt = auCentime(unitesPrevues * s.ventes.prixUnitaire);
  const aAcheter = unitesPrevues + s.final.quantite - s.initial.quantite;
  const achatsHt = auCentime(aAcheter * s.achats.prixUnitaire);
  const achatsTtc = auCentime(achatsHt * (1 + s.achats.tauxTva));
  // Le coût d'achat des vendues, comme au chapitre : stock initial, plus achats, moins stock
  // final, les deux stocks restant ceux du trimestre.
  const coutDesVendues = auCentime(s.initial.valeur + achatsHt - s.final.valeur);
  const partDue = Math.min(1, b.delai / b.joursDuTour);
  const decaisse = auCentime(achatsTtc * (1 - partDue));
  return {
    ...b,
    unitesPrevues,
    ventesHt,
    ventesTtc: auCentime(ventesHt * (1 + s.ventes.tauxTva)),
    aAcheter,
    achatsHt,
    achatsTtc,
    coutDesVendues,
    margeBudgetee: auCentime(ventesHt - coutDesVendues),
    decaisse,
    detteFinale: auCentime(achatsTtc - decaisse),
    // Les erreurs classiques : monter les achats du même pourcentage que les ventes, ou
    // acheter ce qu'on prévoit de vendre en oubliant les stocks.
    achatsPlusDix: Math.round(b.aAcheter * (1 + HAUSSE_DES_VENTES_PREVUES)),
    ancienAAcheter: b.aAcheter,
  };
}

export const REVISER_LE_BUDGET: Situation = {
  code: "reviser-le-budget",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["budget-du-point-de-vente"],
  commanditaire: "La direction",
  titre: "Réviser le budget du trimestre",
  accroche:
    "La direction relève la prévision de ventes du trimestre. Elle veut le budget révisé : ce qu'il faut acheter, la marge attendue, et ce que la caisse paiera.",
  objectifs: [
    "Établir le budget des ventes révisé, hors taxes et toutes taxes comprises",
    "Calculer les quantités à acheter quand les ventes prévues changent",
    "Calculer la marge commerciale budgétée",
    "Calculer les achats décaissés dans le trimestre et ce qui reste dû, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES_A_STOCK,
    pourquoi: "ce cas budgète des achats de marchandises et un stock, et elle n'en garde pas.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = budgetRevise(c);
        return [
          `« Nous relevons de ${pct(HAUSSE_DES_VENTES_PREVUES * 100)} la prévision de ventes du trimestre ${r.s.trimestre}, au même prix moyen. Le stock voulu en fin de trimestre ne change pas. Je veux le budget révisé de ${c.entreprise} : les ventes, les quantités à acheter, la marge commerciale attendue, et ce que les achats feront sortir de la caisse dans le trimestre. »`,
          `Pas de cours cette fois : vous avez le budget de départ, et la méthode est celle du chapitre. Dans l'arène, sur un trimestre de ${qte(r.joursDuTour)} jours d'achats réguliers, la part des achats encore due au fournisseur en fin de trimestre est de ${qte(r.delai)} ÷ ${qte(r.joursDuTour)}, pour un paiement à ${qte(r.delai)} jours.`,
        ];
      },
      tableau: (c) => {
        const r = budgetRevise(c);
        return {
          titre: `${c.entreprise} · le budget de départ du trimestre ${r.s.trimestre}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Unités vendues prévues au départ", valeurs: [qte(r.s.vendues)] },
            { libelle: "Prix de vente moyen, hors taxes", valeurs: [eur(r.s.ventes.prixUnitaire)] },
            { libelle: "Taux de TVA sur les ventes", valeurs: [pct(r.s.ventes.tauxTva * 100)] },
            { libelle: "Stock au début du trimestre (unités)", valeurs: [qte(r.s.initial.quantite)] },
            { libelle: "Stock voulu en fin de trimestre (unités)", valeurs: [qte(r.s.final.quantite)] },
            { libelle: "Prix d'achat d'une unité, hors taxes", valeurs: [eur(r.s.achats.prixUnitaire)] },
            { libelle: "Taux de TVA sur les achats", valeurs: [pct(r.s.achats.tauxTva * 100)] },
            { libelle: "Valeur du stock au début, puis voulu en fin", valeurs: [`${eur(r.s.initial.valeur)} puis ${eur(r.s.final.valeur)}`] },
            { libelle: "Délai de paiement du fournisseur (jours)", valeurs: [qte(r.delai)] },
          ],
        };
      },
      repere: () =>
        "À rendre : les ventes révisées, les unités et les achats à prévoir, la marge commerciale budgétée, ce que la caisse paiera dans le trimestre, et votre réponse.",
    },
    {
      id: "les-ventes",
      type: "montants",
      titre: "Les ventes révisées",
      notions: ["revenue", "vat_payable"],
      question: () =>
        `Calculez les unités à vendre avec la prévision relevée de ${pct(HAUSSE_DES_VENTES_PREVUES * 100)} (à l'unité), puis le budget des ventes hors taxes et toutes taxes comprises.`,
      champs: (c) => {
        const r = budgetRevise(c);
        return [
          { libelle: "Unités à vendre", attendu: r.unitesPrevues, tolerance: 1, calcul: `${qte(r.s.vendues)} × ${(1 + HAUSSE_DES_VENTES_PREVUES).toLocaleString("fr-FR")} = ${qte(r.unitesPrevues)}` },
          { libelle: "Ventes hors taxes", attendu: r.ventesHt, tolerance: 0.5, calcul: `${qte(r.unitesPrevues)} × ${eur(r.s.ventes.prixUnitaire)} = ${eur(r.ventesHt)}` },
          { libelle: "Ventes toutes taxes comprises", attendu: r.ventesTtc, tolerance: 0.5, calcul: `${eur(r.ventesHt)} × ${(1 + r.s.ventes.tauxTva).toLocaleString("fr-FR")} = ${eur(r.ventesTtc)}` },
        ];
      },
      explication: (c) => {
        const r = budgetRevise(c);
        return [`Le chiffre d'affaires budgété de ${c.entreprise} passe à ${eur(r.ventesHt)} hors taxes, ${pct(HAUSSE_DES_VENTES_PREVUES * 100)} de plus que le budget de départ (${eur(r.s.ventes.ht)}).`];
      },
    },
    {
      id: "les-achats",
      type: "montants",
      titre: "Les achats révisés",
      notions: ["stock", "margin_rates"],
      question: () =>
        "Combien d'unités faut-il acheter pour servir ces ventes et finir avec le stock voulu ? Chiffrez ces achats hors taxes, puis la marge commerciale budgétée : les ventes hors taxes moins le coût d'achat des marchandises vendues (stock initial, plus achats, moins stock final, en valeur).",
      champs: (c) => {
        const r = budgetRevise(c);
        return [
          { libelle: "Unités à acheter", attendu: r.aAcheter, tolerance: 1, calcul: `${qte(r.unitesPrevues)} + ${qte(r.s.final.quantite)} − ${qte(r.s.initial.quantite)} = ${qte(r.aAcheter)}` },
          { libelle: "Achats hors taxes", attendu: r.achatsHt, tolerance: 0.5, calcul: `${qte(r.aAcheter)} × ${eur(r.s.achats.prixUnitaire)} = ${eur(r.achatsHt)}` },
          { libelle: "Marge commerciale budgétée", attendu: r.margeBudgetee, tolerance: 1, calcul: `${eur(r.ventesHt)} − (${eur(r.s.initial.valeur)} + ${eur(r.achatsHt)} − ${eur(r.s.final.valeur)}) = ${eur(r.margeBudgetee)}` },
        ];
      },
      explication: (c) => {
        const r = budgetRevise(c);
        return [
          `Les ventes prennent ${qte(r.unitesPrevues - r.s.vendues)} unités de plus, et les achats exactement autant : ${qte(r.aAcheter)} au lieu de ${qte(r.ancienAAcheter)}. Les stocks de début et de fin ne bougent pas, ils ne demandent rien de plus.`,
        ];
      },
    },
    {
      id: "la-caisse",
      type: "montants",
      titre: "Ce que la caisse paiera",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const r = budgetRevise(c);
        return `Calculez les achats toutes taxes comprises, la part décaissée dans le trimestre (le fournisseur est payé à ${qte(r.delai)} jours, sur ${qte(r.joursDuTour)} jours), et ce qui restera dû au fournisseur en fin de trimestre.`;
      },
      champs: (c) => {
        const r = budgetRevise(c);
        return [
          { libelle: "Achats toutes taxes comprises", attendu: r.achatsTtc, tolerance: 0.5, calcul: `${eur(r.achatsHt)} × ${(1 + r.s.achats.tauxTva).toLocaleString("fr-FR")} = ${eur(r.achatsTtc)}` },
          { libelle: "Décaissé dans le trimestre", attendu: r.decaisse, tolerance: 0.5, calcul: `${eur(r.achatsTtc)} × (1 − ${qte(r.delai)} ÷ ${qte(r.joursDuTour)}) = ${eur(r.decaisse)}` },
          { libelle: "Dû au fournisseur en fin de trimestre", attendu: r.detteFinale, tolerance: 0.5, calcul: `${eur(r.achatsTtc)} − ${eur(r.decaisse)} = ${eur(r.detteFinale)}` },
        ];
      },
      explication: (c) => {
        const r = budgetRevise(c);
        return [
          `Sur ${eur(r.achatsTtc)} d'achats, ${eur(r.decaisse)} sortiront de la caisse de ${c.entreprise} ce trimestre, et ${eur(r.detteFinale)} au trimestre suivant : le budget de trésorerie doit les porter tous les deux.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = budgetRevise(c);
        return [
          {
            texte: `Il faut acheter ${qte(r.aAcheter)} unités, soit ${eur(r.achatsHt)} hors taxes`,
            juste: true,
            retour: `Oui : ${qte(r.unitesPrevues)} à vendre, plus ${qte(r.s.final.quantite)} à garder, moins ${qte(r.s.initial.quantite)} déjà en réserve. La marge budgétée passe à ${eur(r.margeBudgetee)}, et ${eur(r.decaisse)} sortiront de la caisse dans le trimestre.`,
          },
          {
            texte: `Il faut acheter ${qte(r.achatsPlusDix)} unités : ${pct(HAUSSE_DES_VENTES_PREVUES * 100)} de plus que le budget de départ, comme les ventes`,
            juste: false,
            retour: `Non : les achats de départ, ${qte(r.ancienAAcheter)} unités, servaient aussi à faire passer le stock de ${qte(r.s.initial.quantite)} à ${qte(r.s.final.quantite)}. Cette part ne grandit pas avec les ventes : seules les ${qte(r.unitesPrevues - r.s.vendues)} unités vendues en plus s'ajoutent, soit ${qte(r.aAcheter)}.`,
          },
          {
            texte: `Il faut acheter ${qte(r.unitesPrevues)} unités, autant que nous prévoyons d'en vendre`,
            juste: false,
            retour: `Non : on part avec ${qte(r.s.initial.quantite)} unités et l'on veut en garder ${qte(r.s.final.quantite)}. Unités à acheter = ventes prévues + stock final voulu − stock initial = ${qte(r.aAcheter)}.`,
          },
        ];
      },
    },
  ],
};
