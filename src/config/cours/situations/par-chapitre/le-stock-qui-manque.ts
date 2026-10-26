import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { arrete } from "../../chapitres/les-stocks";
import { dateDuCours as date } from "../../dates";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES STOCKS » : LE STOCK QUI MANQUE (comptabilité générale,
 * palier 3).
 *
 * Le comptage physique de fin de trimestre trouve moins de marchandises en rayon que les
 * entrées et les sorties ne le prévoient : la démarque (vol, casse, erreurs de caisse). Le
 * gérant demande combien il en manque et ce que cela coûte à la marge du trimestre.
 * L'élève refait seul le chemin du chapitre : le stock théorique, l'écart, la valeur du
 * stock compté au coût moyen pondéré, les deux écritures d'inventaire, le coût d'achat
 * des marchandises vendues et la marge, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre suppose que le comptage retrouve le stock
 * calculé, et le dit seulement en passant ; ici, il en manque. Les quantités et les prix
 * sont ceux du trimestre du cas (`cas.ts`, `arrete`).
 */

/**
 * La démarque trouvée au comptage : 2 % du stock calculé, arrondi à l'unité. C'est l'ordre
 * de grandeur courant de la démarque inconnue dans le commerce de détail.
 */
export const TAUX_DE_DEMARQUE = 0.02;

const qte = (n: number) => n.toLocaleString("fr-FR");

/** Les chiffres de la réponse, calculés une fois du stock du trimestre. */
export function stockQuiManque(c: Cas) {
  const a = arrete(c);
  // Le stock théorique : ce que les entrées et les sorties laissent, celui du chapitre.
  const theorique = a.final.quantite;
  const manquantes = Math.round(theorique * TAUX_DE_DEMARQUE);
  const comptees = theorique - manquantes;
  // Le comptage fait foi : le stock final est celui qu'on a trouvé, au coût moyen pondéré.
  const valeurComptee = auCentime(comptees * a.cump);
  const coutDesVendues = auCentime(a.initial.valeur + a.achats.ht - valeurComptee);
  const demarque = auCentime(a.final.valeur - valeurComptee);
  return {
    ...a,
    theorique,
    manquantes,
    comptees,
    valeurComptee,
    coutDesVendues,
    marge: auCentime(a.ventes.ht - coutDesVendues),
    demarque,
    // Les erreurs classiques : compter les unités perdues au prix de vente, ou TVA comprise.
    auPrixDeVente: auCentime(manquantes * a.ventes.prixUnitaire),
    tvaComprise: auCentime(demarque * (1 + a.achats.tauxTva)),
  };
}

export const LE_STOCK_QUI_MANQUE: Situation = {
  code: "le-stock-qui-manque",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["les-stocks"],
  commanditaire: "Le gérant",
  titre: "Le stock qui manque à l'inventaire",
  accroche:
    "Le comptage de fin de trimestre trouve moins de marchandises en rayon que prévu. Le gérant veut savoir combien il en manque, et ce que cela coûte à la marge.",
  objectifs: [
    "Calculer un stock théorique et l'écart avec le stock compté",
    "Valoriser le stock compté au coût moyen pondéré",
    "Passer les écritures d'inventaire avec le stock compté",
    "Calculer le coût d'achat des marchandises vendues et la marge commerciale",
    "Chiffrer la démarque pour le gérant",
  ],
  libre: false,
  entreprises: {
    codes: ["boutique", "ecommerce"],
    pourquoi:
      "dans l'arène, elle ne garde pas de marchandises en stock d'un trimestre à l'autre (un service ne se stocke pas, et une entreprise qui produit à la demande n'a pas de stock).",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = stockQuiManque(c);
        return [
          `« L'inventaire du ${date(r.fin)} a compté ${qte(r.comptees)} unités en rayon. D'après nos achats et nos ventes du ${r.trimestreEcrit}, il devrait y en avoir davantage. Combien nous en manque-t-il, et combien cela coûte-t-il à notre marge du trimestre ? »`,
          "Pas de cours cette fois : vous avez les chiffres du trimestre et le résultat du comptage, et la méthode est celle du chapitre. À vous de l'enchaîner. Le stock se valorise au coût moyen pondéré du trimestre, en inventaire intermittent.",
        ];
      },
      tableau: (c) => {
        const r = stockQuiManque(c);
        return {
          titre: `Le ${r.trimestreEcrit} · ${c.entreprise}`,
          colonnes: ["Unités", "Montant hors taxes"],
          lignes: [
            { libelle: `Stock au ${date(r.debut)}`, valeurs: [qte(r.initial.quantite), eur(r.initial.valeur)] },
            { libelle: `Achats du trimestre, à ${eur(r.achats.prixUnitaire)} l'unité`, valeurs: [qte(r.achats.quantite), eur(r.achats.ht)] },
            { libelle: "Ventes du trimestre", valeurs: [qte(r.vendues), eur(r.ventes.ht)] },
            { libelle: `Unités comptées en rayon le ${date(r.fin)}`, valeurs: [qte(r.comptees), "à valoriser"] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'écart d'inventaire et la valeur du stock compté, les deux écritures d'inventaire, le coût d'achat des marchandises vendues, la marge et ce que coûte la démarque, et votre réponse.",
    },
    {
      id: "ecart",
      type: "montants",
      titre: "L'écart d'inventaire",
      notions: ["stock"],
      question: () =>
        "Combien d'unités devrait-il rester d'après les entrées et les sorties ? Combien en manque-t-il ? Calculez ensuite le coût moyen pondéré du trimestre et la valeur du stock compté.",
      champs: (c) => {
        const r = stockQuiManque(c);
        return [
          {
            libelle: "Stock théorique, en unités",
            attendu: r.theorique,
            calcul: `${qte(r.initial.quantite)} + ${qte(r.achats.quantite)} − ${qte(r.vendues)} = ${qte(r.theorique)} unités`,
          },
          { libelle: "Unités manquantes", attendu: r.manquantes, calcul: `${qte(r.theorique)} − ${qte(r.comptees)} = ${qte(r.manquantes)} unités` },
          {
            libelle: "Coût moyen pondéré d'une unité",
            attendu: r.cump,
            calcul: `(${eur(r.initial.valeur)} + ${eur(r.achats.ht)}) ÷ (${qte(r.initial.quantite)} + ${qte(r.achats.quantite)}) = ${eur(r.cump)}`,
          },
          { libelle: "Valeur du stock compté", attendu: r.valeurComptee, calcul: `${qte(r.comptees)} × ${eur(r.cump)} = ${eur(r.valeurComptee)}` },
        ];
      },
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `Il manque ${qte(r.manquantes)} unités sur ${qte(r.theorique)}. C'est le comptage qui fait foi : le stock final vaut ${eur(r.valeurComptee)}, pas les ${eur(r.final.valeur)} que les calculs prévoyaient.`,
        ];
      },
    },
    {
      id: "annulation-stock-initial",
      type: "ecriture",
      titre: "Le stock initial s'annule",
      notions: ["stock"],
      evenement: (c) => {
        const r = stockQuiManque(c);
        return `Le ${date(r.fin)}, première écriture d'inventaire : le stock du ${date(r.debut)}, ${eur(r.initial.valeur)}, sort du bilan.`;
      },
      ecriture: (c) => {
        const r = stockQuiManque(c);
        return {
          date: date(r.fin),
          libelle: "Annulation du stock initial",
          lignes: [
            { role: "la variation des stocks, en charge", compte: "6037", acceptes: ["603"], sens: "debit", montant: r.initial.valeur, indice: "la valeur du stock initial" },
            { role: "le stock initial qui sort du bilan", compte: "37", acceptes: ["370"], sens: "credit", montant: r.initial.valeur, indice: "la valeur du stock initial" },
          ],
        };
      },
      indices: () => [
        "Le stock de marchandises (classe 3) se vide : il passe au crédit.",
        "En face, une charge : la variation des stocks de marchandises, à côté des achats (603).",
      ],
      explication: (c) => {
        const r = stockQuiManque(c);
        return [`Le stock du début entre dans les charges du trimestre : ${eur(r.initial.valeur)} au débit du 6037.`];
      },
      vue: "resultat",
    },
    {
      id: "constatation-stock-compte",
      type: "ecriture",
      titre: "Le stock compté entre au bilan",
      notions: ["stock"],
      evenement: (c) => {
        const r = stockQuiManque(c);
        return `Deuxième écriture : constatez le stock final du ${date(r.fin)}, celui que l'inventaire a trouvé.`;
      },
      ecriture: (c) => {
        const r = stockQuiManque(c);
        return {
          date: date(r.fin),
          libelle: "Constatation du stock final compté",
          lignes: [
            { role: "le stock compté qui entre au bilan", compte: "37", acceptes: ["370"], sens: "debit", montant: r.valeurComptee, indice: "la valeur du stock compté" },
            { role: "la variation des stocks, en moins des charges", compte: "6037", acceptes: ["603"], sens: "credit", montant: r.valeurComptee, indice: "la valeur du stock compté" },
          ],
        };
      },
      indices: () => [
        "C'est l'écriture inverse de la précédente, pour le stock final.",
        "Le montant : pas le stock que les calculs prévoyaient, mais les unités comptées, au coût moyen pondéré.",
      ],
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `Les unités disparues ne sont plus à l'actif : elles restent dans les charges du trimestre, avec celles qu'on a vendues. Le 6037 ne retire des charges que les ${eur(r.valeurComptee)} vraiment en rayon.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que coûte la démarque",
      notions: ["stock", "margin_rates"],
      question: () =>
        "Avec le stock compté, calculez le coût d'achat des marchandises vendues et la marge commerciale du trimestre. Puis ce que la démarque a coûté à la marge.",
      champs: (c) => {
        const r = stockQuiManque(c);
        return [
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: r.coutDesVendues,
            calcul: `${eur(r.initial.valeur)} + ${eur(r.achats.ht)} − ${eur(r.valeurComptee)} = ${eur(r.coutDesVendues)}`,
          },
          { libelle: "Marge commerciale", attendu: r.marge, calcul: `${eur(r.ventes.ht)} − ${eur(r.coutDesVendues)} = ${eur(r.marge)}` },
          { libelle: "Coût de la démarque", attendu: r.demarque, calcul: `${qte(r.manquantes)} × ${eur(r.cump)} = ${eur(r.demarque)}` },
        ];
      },
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `Sans démarque, la marge du trimestre aurait été de ${eur(auCentime(r.marge + r.demarque))}. Les ${qte(r.manquantes)} unités disparues ont été payées au fournisseur et ne seront jamais vendues : ${c.entreprise} perd leur coût d'achat, ${eur(r.demarque)}.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = stockQuiManque(c);
        return [
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.demarque)} de marge perdue`,
            juste: true,
            retour: `Oui : ${qte(r.theorique)} unités attendues, ${qte(r.comptees)} comptées. Chacune a coûté ${eur(r.cump)} au coût moyen pondéré : ${qte(r.manquantes)} × ${eur(r.cump)} = ${eur(r.demarque)} en moins sur la marge.`,
          },
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.auPrixDeVente)} de marge perdue, au prix de vente`,
            juste: false,
            retour: `Non : la marge perd ce que les unités ont coûté, pas ce qu'elles auraient rapporté. Elles ne figuraient pas dans les ventes ; elles sortent du stock à ${eur(r.cump)} l'unité : ${eur(r.demarque)}.`,
          },
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.tvaComprise)} de marge perdue, TVA comprise`,
            juste: false,
            retour: `Non : la TVA payée au fournisseur se déduit, elle n'est pas un coût. Le stock se compte hors taxes : ${eur(r.demarque)}.`,
          },
          {
            texte: "Aucun effet sur la marge : un écart de stock ne touche que le bilan",
            juste: false,
            retour: `Non : le stock final vient en moins des charges. Plus petit, il en retire moins, et le coût d'achat des marchandises vendues monte de ${eur(r.demarque)}.`,
          },
        ];
      },
    },
  ],
};
