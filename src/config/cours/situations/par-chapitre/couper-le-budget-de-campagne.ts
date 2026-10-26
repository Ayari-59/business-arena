import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { campagne } from "../../chapitres/cout-d-acquisition";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT D'ACQUISITION » : COUPER LE BUDGET DE CAMPAGNE ?
 * (BTS NDRC, palier 3).
 *
 * Le directeur financier veut économiser sur la publicité : il propose de couper de
 * moitié le budget de campagne du trimestre. L'élève refait seul le chemin du chapitre,
 * dans l'autre sens : le coût d'acquisition et la marge après acquisition d'aujourd'hui,
 * ce que la coupe ferait perdre en clients et en marge, ce que coûtaient les clients
 * perdus, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre se demandait s'il fallait dépenser plus ;
 * le directeur demande s'il faut dépenser moins. Les chiffres sont ceux du trimestre
 * rejoué par l'arène à plusieurs budgets (`campagne.ts`), lus par `campagne`.
 */

/**
 * Le budget envisagé, en part du budget du trimestre : la moitié. C'est le palier que
 * l'arène a rejoué sous le budget joué (`PALIERS_DE_BUDGET`), et la coupe qu'un
 * directeur financier propose d'ordinaire quand il cherche une économie visible.
 */
export const BUDGET_ENVISAGE = 0.5;

const qte = (n: number) => n.toLocaleString("fr-FR");

/** Le trimestre au budget joué et au budget coupé, et ce qui les sépare. */
export function coupeDuBudget(c: Cas) {
  const k = campagne(c);
  const coupe = k.budgets.find((b) => b.facteur === BUDGET_ENVISAGE)!;
  const economie = k.jouee.budget - coupe.budget;
  const nouveauxPerdus = k.jouee.nouveaux - coupe.nouveaux;
  const margePerdue = k.jouee.marge - coupe.marge;
  return {
    k,
    coupe,
    economie,
    nouveauxPerdus,
    commandesPerdues: k.jouee.commandes - coupe.commandes,
    margePerdue,
    effet: economie - margePerdue,
    cacDesPerdus: auCentime(economie / nouveauxPerdus),
    cacMoyenApres: auCentime(coupe.budget / coupe.nouveaux),
  };
}

export const COUPER_LE_BUDGET_DE_CAMPAGNE: Situation = {
  code: "couper-le-budget-de-campagne",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["cout-d-acquisition"],
  commanditaire: "Le directeur financier",
  titre: "Couper le budget de campagne ?",
  accroche:
    "Le directeur financier veut couper de moitié le budget de campagne pour faire des économies. Ce que l'entreprise y gagnerait, et ce qu'elle y perdrait.",
  objectifs: [
    "Calculer le coût d'acquisition et la marge après acquisition",
    "Mesurer les clients et la marge qu'une coupe de budget ferait perdre",
    "Calculer le coût des clients perdus et le comparer à ce qu'ils laissent",
    "Rédiger une réponse chiffrée au directeur financier",
  ],
  libre: false,
  entreprises: {
    codes: ["ecommerce"],
    pourquoi: "ce cas suit les nouveaux clients d'une campagne, et PIXEL & CO est l'entreprise de l'arène qui les distingue de ses clients fidèles.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const r = coupeDuBudget(c);
        return [
          `« Les comptes sont serrés. Je propose de couper de moitié le budget de campagne : ${eur(r.economie)} d'économie par trimestre, c'est concret. Avant que je tranche, dites-moi ce que ${c.entreprise} y perdrait, et si l'économie en vaut la peine. »`,
          "Pas de cours cette fois : l'arène a rejoué le trimestre aux deux budgets, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const { k, coupe } = coupeDuBudget(c);
        return {
          titre: `Le premier trimestre, rejoué à deux budgets · ${c.entreprise}`,
          colonnes: ["Budget du trimestre", "Moitié du budget"],
          lignes: [
            { libelle: "Budget de la campagne", valeurs: [eur(k.jouee.budget), eur(coupe.budget)] },
            { libelle: "Commandes de nouveaux clients", valeurs: [qte(k.jouee.nouveaux), qte(coupe.nouveaux)] },
            { libelle: "Commandes en tout", valeurs: [qte(k.jouee.commandes), qte(coupe.commandes)] },
            { libelle: "Marge sur les ventes", valeurs: [eur(k.jouee.marge), eur(coupe.marge)] },
            { libelle: "Prix d'une commande", valeurs: [eur(k.prix), eur(k.prix)] },
            { libelle: "Coût variable d'une commande", valeurs: [eur(k.coutVariable), eur(k.coutVariable)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût d'acquisition d'aujourd'hui, les clients et la marge que la coupe ferait perdre, ce que coûtaient ces clients, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Le coût d'un nouveau client aujourd'hui",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: () =>
        "Au budget du trimestre, calculez le coût d'acquisition d'un nouveau client, la marge d'une commande, puis la marge qui reste sur la première commande d'un nouveau client.",
      champs: (c) => {
        const { k } = coupeDuBudget(c);
        return [
          { libelle: "Coût d'acquisition", attendu: k.cac, calcul: `${eur(k.jouee.budget)} ÷ ${qte(k.jouee.nouveaux)} = ${eur(k.cac)}` },
          { libelle: "Marge par commande", attendu: k.margeParCommande, calcul: `${eur(k.prix)} − ${eur(k.coutVariable)} = ${eur(k.margeParCommande)}` },
          { libelle: "Marge après acquisition", attendu: k.margeApresAcquisition, calcul: `${eur(k.margeParCommande)} − ${eur(k.cac)} = ${eur(k.margeApresAcquisition)}` },
        ];
      },
      explication: (c) => {
        const { k } = coupeDuBudget(c);
        return [
          k.margeApresAcquisition > 0
            ? `Aujourd'hui, la première commande d'un nouveau client paie sa conquête et laisse encore ${eur(k.margeApresAcquisition)}. La question du directeur porte sur les clients que la coupe ferait disparaître : coûtent-ils plus qu'ils ne laissent ?`
            : `Aujourd'hui, la première commande d'un nouveau client ne paie pas sa conquête : il manque ${eur(-k.margeApresAcquisition)}. La question du directeur porte sur les clients que la coupe ferait disparaître.`,
        ];
      },
    },
    {
      id: "la-coupe",
      type: "montants",
      titre: "Ce que la coupe ferait perdre",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Avec la moitié du budget, calculez l'économie de budget, les commandes de nouveaux clients perdues, la marge perdue sur les ventes, puis l'effet de la coupe sur le résultat (économie − marge perdue ; négatif s'il baisse).",
      champs: (c) => {
        const r = coupeDuBudget(c);
        return [
          { libelle: "Économie de budget", attendu: r.economie, calcul: `${eur(r.k.jouee.budget)} − ${eur(r.coupe.budget)} = ${eur(r.economie)}` },
          { libelle: "Commandes de nouveaux clients perdues", attendu: r.nouveauxPerdus, calcul: `${qte(r.k.jouee.nouveaux)} − ${qte(r.coupe.nouveaux)} = ${qte(r.nouveauxPerdus)}` },
          { libelle: "Marge perdue", attendu: r.margePerdue, calcul: `${eur(r.k.jouee.marge)} − ${eur(r.coupe.marge)} = ${eur(r.margePerdue)}` },
          { libelle: "Effet sur le résultat", attendu: r.effet, calcul: `${eur(r.economie)} − ${eur(r.margePerdue)} = ${eur(r.effet)}` },
        ];
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          r.effet < 0
            ? `La coupe économise ${eur(r.economie)}, mais fait perdre ${eur(r.margePerdue)} de marge : le résultat du trimestre baisserait de ${eur(-r.effet)}. L'économie se voit sur la ligne publicité, la perte se cache dans les ventes.`
            : `La coupe économise ${eur(r.economie)} et ne fait perdre que ${eur(r.margePerdue)} de marge : le résultat du trimestre monterait de ${eur(r.effet)}.`,
          `La coupe ne fait pas perdre que des commandes de nouveaux clients : ${qte(r.commandesPerdues)} commandes en tout, dont ${qte(r.commandesPerdues - r.nouveauxPerdus)} d'autres clientèles que la campagne entraînait.`,
        ];
      },
    },
    {
      id: "clients-perdus",
      type: "montants",
      titre: "Ce que coûtaient les clients perdus",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Combien coûtait chacun des nouveaux clients que la coupe ferait perdre (économie ÷ commandes de nouveaux clients perdues) ? Et quel serait le coût d'acquisition moyen avec la moitié du budget ?",
      champs: (c) => {
        const r = coupeDuBudget(c);
        return [
          { libelle: "Coût d'un client perdu", attendu: r.cacDesPerdus, calcul: `${eur(r.economie)} ÷ ${qte(r.nouveauxPerdus)} = ${eur(r.cacDesPerdus)}` },
          { libelle: "Coût d'acquisition moyen, moitié du budget", attendu: r.cacMoyenApres, calcul: `${eur(r.coupe.budget)} ÷ ${qte(r.coupe.nouveaux)} = ${eur(r.cacMoyenApres)}` },
        ];
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          `La coupe retire d'abord les clients les plus chers à gagner : ${eur(r.cacDesPerdus)} chacun, plus que la moyenne. Le coût moyen baisserait donc à ${eur(r.cacMoyenApres)}. Mais ce qui compte est ailleurs : chacun de ces clients laissait ${eur(r.k.margeParCommande)} de marge sur sa commande, ${r.cacDesPerdus < r.k.margeParCommande ? "plus" : "moins"} qu'il ne coûtait.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = coupeDuBudget(c);
        const garder = r.effet < 0;
        return [
          {
            texte: garder
              ? `Garder : ${eur(r.economie)} économisés, ${eur(r.margePerdue)} de marge en moins`
              : `Couper : ${eur(r.economie)} économisés, ${eur(r.margePerdue)} de marge en moins`,
            juste: true,
            retour: `Oui : la coupe ${garder ? "ferait baisser" : "ferait monter"} le résultat de ${eur(Math.abs(r.effet))}. Les clients perdus coûtaient ${eur(r.cacDesPerdus)} chacun et laissaient ${eur(r.k.margeParCommande)} de marge sur leur commande, sans compter les commandes entraînées.`,
          },
          {
            texte: `Couper : un nouveau client ne coûterait plus que ${eur(r.cacMoyenApres)}`,
            juste: false,
            retour: `Non : le coût moyen baisse parce que la coupe retire les clients les plus chers, pas parce qu'elle rapporte. Le résultat, lui, ${garder ? "baisserait" : "monterait"} de ${eur(Math.abs(r.effet))}.`,
          },
          {
            texte: `Couper : les clients perdus coûtent ${eur(r.cacDesPerdus)}, plus que la moyenne`,
            juste: false,
            retour: `Non : un client se compare à ce qu'il laisse, pas à la moyenne. Il coûtait ${eur(r.cacDesPerdus)} et laissait ${eur(r.k.margeParCommande)} de marge sur sa commande.`,
          },
          {
            texte: `Couper : on ne perd que ${qte(r.commandesPerdues)} commandes sur ${qte(r.k.jouee.commandes)}`,
            juste: false,
            retour: `Non : ce n'est pas la part des commandes qui décide, c'est ce qu'elles laissaient. Elles emportent ${eur(r.margePerdue)} de marge, pour ${eur(r.economie)} d'économie.`,
          },
        ];
      },
    },
  ],
};
