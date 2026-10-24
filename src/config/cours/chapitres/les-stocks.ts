import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas, StockDuTrimestre } from "../cas";
import { dateDuCours as date } from "../dates";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES STOCKS (comptabilité générale, palier 3).
 *
 * Un trimestre de l'arène, celui où l'entreprise commence et finit avec des marchandises
 * en stock. Les quantités sont celles du moteur (le stock d'ouverture, les unités
 * achetées, les unités vendues) ; la valeur est celle de la comptabilité, au prix d'achat
 * et au coût moyen pondéré. La méthode est celle de l'inventaire intermittent : les
 * achats vont en charges au fil du trimestre, et le stock ne se corrige qu'à l'arrêté,
 * par l'inventaire.
 *
 * Le chapitre ne se joue que dans les entreprises qui gardent un stock de marchandises
 * dans l'arène. Un service ne se stocke pas ; NOVA produit à la demande et n'a jamais de
 * stock ; le stock du bâtiment est un chantier en cours, qui se compte autrement.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const TRIMESTRES = ["premier", "deuxième", "troisième", "quatrième"];

/** Le stock du trimestre : le chapitre ne s'ouvre que dans les entreprises qui en ont un. */
export function stockDe(c: Cas): StockDuTrimestre {
  if (!c.stock) throw new Error(`${c.entreprise} n'a pas de stock de marchandises dans l'arène`);
  return c.stock;
}

/** Les grandeurs de l'arrêté, calculées une fois du stock. */
export function arrete(c: Cas) {
  const s = stockDe(c);
  const variation = auCentime(s.initial.valeur - s.final.valeur);
  const marge = auCentime(s.ventes.ht - s.coutDAchatDesVendues);
  return {
    ...s,
    trimestreEcrit: `${TRIMESTRES[s.trimestre - 1]} trimestre`,
    variation,
    augmente: s.final.valeur > s.initial.valeur,
    marge,
    tauxDeMarque: marge / s.ventes.ht,
  };
}

export const LES_STOCKS: Chapitre = {
  code: "les-stocks",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
  ],
  titre: "Les stocks",
  accroche:
    "Ce qui reste en rayon à la fin du trimestre : l'inventaire, la variation des stocks, et pourquoi les achats ne sont pas le coût de ce qu'on a vendu.",
  objectifs: [
    "Enregistrer les achats et les ventes d'un trimestre",
    "Valoriser un stock au coût moyen pondéré",
    "Passer les écritures d'inventaire : annuler le stock initial, constater le stock final",
    "Calculer le coût d'achat des marchandises vendues et la marge commerciale",
    "Expliquer ce que la variation des stocks change au résultat",
  ],
  libre: false,
  entreprises: {
    codes: ["boutique", "ecommerce"],
    pourquoi:
      "dans l'arène, elle ne garde pas de marchandises en stock d'un trimestre à l'autre (un service ne se stocke pas, et une entreprise qui produit à la demande n'a pas de stock).",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui reste en rayon",
      notions: ["stock"],
      texte: (c) => {
        const a = arrete(c);
        return [
          `Au ${date(a.debut)}, au début du ${a.trimestreEcrit} de l'arène, ${c.entreprise} a ${qte(a.initial.quantite)} unités de marchandises en stock, pour ${eur(a.initial.valeur)}. Pendant le trimestre, elle en achète ${qte(a.achats.quantite)} et en vend ${qte(a.vendues)}. Ces quantités sont celles de la simulation.`,
          "La comptabilité tient les stocks par l'inventaire intermittent : chaque achat va en charges au compte 607, au fil du trimestre, et le compte de stock ne bouge pas. À l'arrêté des comptes, on compte ce qui reste, et l'on corrige.",
          `Votre travail : l'arrêté du ${date(a.fin)}.`,
        ];
      },
      repere: () =>
        "Les achats ne sont pas le coût de ce qu'on a vendu : une part des marchandises vendues sortait du stock initial, une part des achats reste en stock. L'inventaire fait la différence.",
    },
    {
      id: "achats",
      type: "ecriture",
      titre: "Les achats du trimestre",
      notions: ["stock", "vat_payable"],
      evenement: (c) => {
        const a = arrete(c);
        return `Le récapitulatif des factures du trimestre : ${qte(a.achats.quantite)} unités achetées à ${eur(a.achats.prixUnitaire)} hors taxes, à ${c.achat.fournisseur}, payables à échéance.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Récapitulatif des achats du trimestre",
          lignes: [
            { role: "les achats de marchandises", compte: "607", sens: "debit", montant: a.achats.ht, indice: "le total hors taxes des factures" },
            { role: "la TVA déductible", compte: "44566", sens: "debit", montant: a.achats.tva, indice: "la TVA des factures" },
            { role: "la dette fournisseur", compte: "401", sens: "credit", montant: a.achats.ttc, indice: "le total des factures, taxes comprises" },
          ],
        };
      },
      indices: () => [
        "Des marchandises achetées pour être revendues : classe 6, les achats de marchandises.",
        "La TVA se déduit ; le fournisseur attend le total, taxes comprises.",
      ],
      explication: (c) => {
        const a = arrete(c);
        return [`${eur(a.achats.ht)} d'achats au débit du 607. En inventaire intermittent, c'est tout : le stock ne bouge pas encore.`];
      },
      vue: "resultat",
    },
    {
      id: "ventes",
      type: "ecriture",
      titre: "Les ventes du trimestre",
      notions: ["revenue", "vat_payable"],
      evenement: (c) => {
        const a = arrete(c);
        return `Le récapitulatif des ventes du trimestre : ${qte(a.vendues)} unités, à ${eur(a.ventes.prixUnitaire)} hors taxes en moyenne. Pour l'écriture, on les passe toutes en créances sur les clients.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Récapitulatif des ventes du trimestre",
          lignes: [
            { role: "la créance sur les clients", compte: "411", sens: "debit", montant: a.ventes.ttc, indice: "le total des ventes, taxes comprises" },
            { role: "les ventes de marchandises", compte: "707", sens: "credit", montant: a.ventes.ht, indice: "le total hors taxes des ventes" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: a.ventes.tva, indice: "la TVA des ventes" },
          ],
        };
      },
      indices: () => ["Les clients doivent le total, taxes comprises.", "Le produit : les ventes de marchandises, hors taxes. La TVA est due à l'État."],
      explication: (c) => {
        const a = arrete(c);
        return [`Le compte de résultat porte ${eur(a.ventes.ht)} de ventes et ${eur(a.achats.ht)} d'achats. Ce résultat-là est faux : il ne tient pas compte du stock.`];
      },
      vue: "resultat",
    },
    {
      id: "achats-ou-cout",
      type: "choix",
      titre: "Les achats, est-ce le coût ?",
      notions: ["stock"],
      question: (c) => {
        const a = arrete(c);
        return `Le compte 607 porte ${eur(a.achats.ht)}. Est-ce le coût des ${qte(a.vendues)} unités vendues ?`;
      },
      options: (c) => {
        const a = arrete(c);
        return [
          {
            texte: "Oui : ce qu'on a acheté, c'est ce qu'on a vendu.",
            juste: false,
            retour: `Pas ce trimestre : ${qte(a.achats.quantite)} unités achetées, ${qte(a.vendues)} vendues. Et les ventes ont puisé aussi dans le stock du ${date(a.debut)}.`,
          },
          {
            texte: "Non : il faut ajouter le stock du début, qu'on a vendu en partie, et retirer ce qui reste en stock à la fin.",
            juste: true,
            retour: "C'est cela : coût d'achat des marchandises vendues = stock initial + achats − stock final. Il faut donc compter le stock final : c'est l'inventaire.",
          },
          {
            texte: "Non : il faut ajouter la TVA payée au fournisseur.",
            juste: false,
            retour: "La TVA se déduit, elle n'est pas un coût. Ce qui manque, c'est le stock.",
          },
        ];
      },
    },
    {
      id: "inventaire",
      type: "montants",
      titre: "L'inventaire",
      notions: ["stock"],
      question: (c) => {
        const a = arrete(c);
        return `Au ${date(a.fin)}, on compte ce qui reste. Stock initial : ${qte(a.initial.quantite)} unités pour ${eur(a.initial.valeur)} ; achats : ${qte(a.achats.quantite)} unités pour ${eur(a.achats.ht)} ; ventes : ${qte(a.vendues)} unités. Le stock se valorise au coût moyen pondéré du trimestre. Calculez.`;
      },
      champs: (c) => {
        const a = arrete(c);
        return [
          {
            libelle: "Stock final, en unités",
            attendu: a.final.quantite,
            calcul: `${qte(a.initial.quantite)} + ${qte(a.achats.quantite)} − ${qte(a.vendues)} = ${qte(a.final.quantite)} unités`,
          },
          {
            libelle: "Coût moyen pondéré d'une unité",
            attendu: a.cump,
            calcul: `(${eur(a.initial.valeur)} + ${eur(a.achats.ht)}) ÷ (${qte(a.initial.quantite)} + ${qte(a.achats.quantite)}) = ${eur(a.cump)}`,
          },
          { libelle: "Valeur du stock final", attendu: a.final.valeur, calcul: `${qte(a.final.quantite)} × ${eur(a.cump)} = ${eur(a.final.valeur)}` },
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: a.coutDAchatDesVendues,
            calcul: `${eur(a.initial.valeur)} + ${eur(a.achats.ht)} − ${eur(a.final.valeur)} = ${eur(a.coutDAchatDesVendues)}`,
          },
        ];
      },
      explication: (c) => {
        const a = arrete(c);
        return [
          `Le coût de ce qu'on a vendu, ${eur(a.coutDAchatDesVendues)}, n'est pas le montant des achats, ${eur(a.achats.ht)}. L'écart, ${eur(Math.abs(a.variation))}, c'est la variation du stock : il ${a.augmente ? "a augmenté" : "a baissé"} pendant le trimestre.`,
          "Dans la réalité, l'inventaire est un comptage physique : ce que l'on trouve en rayon peut être moins que ce que les calculs prévoient (casse, vol, erreurs). C'est le comptage qui fait foi.",
        ];
      },
    },
    {
      id: "annulation-stock-initial",
      type: "ecriture",
      titre: "Le stock initial s'annule",
      notions: ["stock"],
      evenement: (c) => {
        const a = arrete(c);
        return `Première écriture d'inventaire : le stock du ${date(a.debut)}, ${eur(a.initial.valeur)}, est sorti du bilan. Il a été vendu ou il est encore là ; dans les deux cas, l'inventaire le remplacera par le stock compté.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Annulation du stock initial",
          lignes: [
            { role: "la variation des stocks, en charge", compte: "6037", acceptes: ["603"], sens: "debit", montant: a.initial.valeur, indice: "la valeur du stock initial" },
            { role: "le stock initial qui sort du bilan", compte: "37", acceptes: ["370"], sens: "credit", montant: a.initial.valeur, indice: "la valeur du stock initial" },
          ],
        };
      },
      indices: () => [
        "Le stock de marchandises (classe 3) se vide : il passe au crédit.",
        "En face, une charge : la variation des stocks de marchandises, juste à côté des achats (603).",
      ],
      explication: (c) => {
        const a = arrete(c);
        return [`Le stock initial entre dans les charges du trimestre, comme s'il avait été acheté : ${eur(a.initial.valeur)} au débit du 6037.`];
      },
      vue: "resultat",
    },
    {
      id: "constatation-stock-final",
      type: "ecriture",
      titre: "Le stock final se constate",
      notions: ["stock"],
      evenement: (c) => {
        const a = arrete(c);
        return `Deuxième écriture : le stock compté au ${date(a.fin)}, ${eur(a.final.valeur)}, entre au bilan.`;
      },
      ecriture: (c) => {
        const a = arrete(c);
        return {
          date: date(a.fin),
          libelle: "Constatation du stock final",
          lignes: [
            { role: "le stock final qui entre au bilan", compte: "37", acceptes: ["370"], sens: "debit", montant: a.final.valeur, indice: "la valeur du stock final" },
            { role: "la variation des stocks, en moins des charges", compte: "6037", acceptes: ["603"], sens: "credit", montant: a.final.valeur, indice: "la valeur du stock final" },
          ],
        };
      },
      indices: () => [
        "C'est l'écriture inverse de la précédente, pour le stock compté.",
        "Le stock (classe 3) au débit ; la variation des stocks au crédit, qui retire des charges ce qui n'a pas été vendu.",
      ],
      explication: (c) => {
        const a = arrete(c);
        return [
          `Le compte 6037 a maintenant un solde ${a.augmente ? "créditeur" : "débiteur"} de ${eur(Math.abs(a.variation))}. Achats et variation réunis font ${eur(a.coutDAchatDesVendues)} : le coût d'achat des marchandises vendues. Le compte de résultat est juste.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "effet-sur-le-resultat",
      type: "choix",
      titre: "La variation et le résultat",
      notions: ["stock", "income_statement"],
      question: (c) => {
        const a = arrete(c);
        return `Le stock est passé de ${eur(a.initial.valeur)} à ${eur(a.final.valeur)}. Par rapport à un résultat qui ne compterait que les achats, le vrai résultat est :`;
      },
      options: (c) => {
        const a = arrete(c);
        const plus = a.augmente;
        return [
          {
            texte: `Plus élevé, de ${eur(Math.abs(a.variation))}.`,
            juste: plus,
            retour: plus
              ? "Oui : une part des achats est encore en stock. Ce n'est pas un coût du trimestre, c'est un actif ; la variation la retire des charges."
              : "Non : le stock a baissé. Les ventes ont consommé plus que les achats ; la variation ajoute cette baisse aux charges.",
          },
          {
            texte: `Plus faible, de ${eur(Math.abs(a.variation))}.`,
            juste: !plus,
            retour: !plus
              ? "Oui : le stock a baissé, les ventes ont puisé dans le stock du début. Ce stock consommé est un coût du trimestre, que la variation ajoute aux charges."
              : "Non : le stock a augmenté. Une part des achats n'a pas été vendue ; ce n'est pas un coût du trimestre.",
          },
          { texte: "Le même : un stock n'est qu'un chiffre au bilan.", juste: false, retour: "Le stock change le coût de ce qu'on a vendu : c'est tout l'objet de l'inventaire." },
        ];
      },
      vue: "resultat",
    },
    {
      id: "marge",
      type: "montants",
      titre: "La marge commerciale",
      notions: ["stock", "margin_rates"],
      question: (c) => {
        const a = arrete(c);
        return `Les ventes du ${a.trimestreEcrit} font ${eur(a.ventes.ht)} hors taxes. Calculez la marge commerciale, puis le taux de marque (la marge rapportée aux ventes).`;
      },
      champs: (c) => {
        const a = arrete(c);
        return [
          { libelle: "Coût d'achat des marchandises vendues", attendu: a.coutDAchatDesVendues, calcul: `${eur(a.achats.ht)} ${a.variation >= 0 ? "+" : "−"} ${eur(Math.abs(a.variation))} = ${eur(a.coutDAchatDesVendues)}` },
          { libelle: "Marge commerciale", attendu: a.marge, calcul: `${eur(a.ventes.ht)} − ${eur(a.coutDAchatDesVendues)} = ${eur(a.marge)}` },
          {
            libelle: "Taux de marque, en %",
            attendu: auCentime(a.tauxDeMarque * 100),
            calcul: `${eur(a.marge)} ÷ ${eur(a.ventes.ht)} = ${pct(a.tauxDeMarque)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const a = arrete(c);
        return [
          `Sur chaque euro de ventes, ${c.entreprise} garde ${pct(a.tauxDeMarque)} pour payer ses autres charges : le loyer, le personnel, l'usure de ses équipements. Le compte de résultat du chapitre, qui ne porte que les achats, la variation et les ventes, montre exactement cette marge.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "stock-qui-dort",
      type: "choix",
      titre: "Un stock, ça coûte",
      notions: ["stock", "bfr"],
      question: (c) => {
        const a = arrete(c);
        return `Au ${date(a.fin)}, ${eur(a.final.valeur)} de marchandises attendent en rayon. Qu'est-ce que cela représente pour ${c.entreprise} ?`;
      },
      options: () => [
        {
          texte: "De l'argent immobilisé : payé au fournisseur, pas encore revenu des clients.",
          juste: true,
          retour:
            "C'est cela. Le stock est un actif, mais il pèse sur la trésorerie : c'est l'un des postes du besoin en fonds de roulement. Il faut assez de stock pour ne pas manquer de ventes, pas plus.",
        },
        {
          texte: "Une perte : ce qui n'est pas vendu est perdu.",
          juste: false,
          retour: "Des marchandises qui se gardent se vendront au trimestre suivant. Elles ne perdent leur valeur que si elles s'abîment ou passent de mode : on les déprécie alors, au palier suivant.",
        },
        {
          texte: "Un bénéfice : le stock augmente l'actif.",
          juste: false,
          retour: "Il augmente l'actif, mais il ne rapporte rien tant qu'il n'est pas vendu, et il a été payé.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["stock"],
      texte: (c) => {
        const a = arrete(c);
        return [
          `Vous avez arrêté le ${a.trimestreEcrit} de ${c.entreprise} : l'inventaire de ${qte(a.final.quantite)} unités, valorisé au coût moyen pondéré, les deux écritures d'inventaire, le coût d'achat des marchandises vendues et la marge commerciale.`,
          "Dans l'arène, le stock se lit dans le bilan de chaque trimestre : un stock qui grossit trimestre après trimestre est souvent le premier signe d'une prévision de ventes trop optimiste.",
        ];
      },
      repere: () =>
        "Coût d'achat des marchandises vendues = stock initial + achats − stock final. À l'arrêté : on annule le stock initial (6037 au débit), on constate le stock final (6037 au crédit).",
    },
  ],
};
