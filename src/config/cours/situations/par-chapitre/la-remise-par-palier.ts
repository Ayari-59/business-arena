import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { NEGOCIATIONS } from "../../chapitres/negocier-le-prix";
import { affaire } from "../../chapitres/remises-et-conditions";
import { JOURS_PAR_AN } from "../../remises";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMISES ET CONDITIONS » : LA REMISE PAR PALIER
 * (BTS NDRC, palier 2).
 *
 * Le client professionnel du cas propose de grossir sa commande si la remise monte d'un
 * palier. Le responsable des ventes veut savoir si l'affaire y gagne. L'élève refait
 * seul le chemin du chapitre, deux fois : la facture, la marge, le coût du délai de
 * paiement et le résultat de la commande d'aujourd'hui, puis de la commande proposée ;
 * il cherche le volume qui paie la remise, et rend sa réponse.
 *
 * Le cas est neuf par sa question : la remise n'est plus celle du chapitre, et elle
 * s'échange contre un volume. La commande, le prix, le délai et la remise d'aujourd'hui
 * sont ceux du chapitre, lus par `affaire`.
 */

/**
 * La remise du palier supérieur : 8 % au lieu de 5 %. Trois points de plus, le pas
 * habituel d'une grille de remises par quantité entre professionnels.
 */
export const REMISE_DU_PALIER = 0.08;

/**
 * Ce que le client offre en échange : une commande plus grosse d'un cinquième, l'écart
 * qui sépare d'ordinaire deux paliers d'une grille de remises.
 */
export const COMMANDE_EN_PLUS = 0.2;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les deux commandes, et ce qui les sépare. */
export function remiseParPalier(c: Cas) {
  const a = affaire(c);
  const quantite = Math.round(a.quantite * (1 + COMMANDE_EN_PLUS));
  const brut = auCentime(quantite * a.prix);
  const remise = auCentime(brut * REMISE_DU_PALIER);
  const netCommercial = auCentime(brut - remise);
  const coutsVariables = auCentime(quantite * a.coutVariable);
  const marge = auCentime(netCommercial - coutsVariables);
  // Même calcul que le chapitre : le net commercial attend le délai, financé au taux de l'emprunt.
  const coutDuCredit = auCentime((netCommercial * c.pret.tauxAnnuel * a.delai) / JOURS_PAR_AN);
  const resultat = auCentime(marge - coutDuCredit);
  const prixDuPalier = auCentime(a.prix * (1 - REMISE_DU_PALIER));
  return {
    a,
    tauxDuPalier: REMISE_DU_PALIER * 100,
    enPlus: COMMANDE_EN_PLUS * 100,
    quantite,
    brut,
    remise,
    netCommercial,
    coutsVariables,
    marge,
    coutDuCredit,
    resultat,
    prixDuPalier,
    // La commande qui, au palier, laisse au moins la marge d'aujourd'hui : arrondie au-dessus.
    quantiteMinimale: Math.ceil(a.marge / (prixDuPalier - a.coutVariable) - 1e-9),
    gain: auCentime(resultat - a.resultatDeLAffaire),
    // Les erreurs classiques : ne regarder que la remise, confondre la facture et le gain,
    // oublier que le délai porte sur une facture plus grosse.
    remiseEnPlus: auCentime(remise - a.remise),
    factureEnPlus: auCentime(netCommercial - a.netCommercial),
    margeEnPlus: auCentime(marge - a.marge),
  };
}

export const LA_REMISE_PAR_PALIER: Situation = {
  code: "la-remise-par-palier",
  parcours: "ndrc",
  palier: 2,
  blocs: [],
  reprend: ["remises-et-conditions"],
  commanditaire: "Le responsable des ventes",
  titre: "Une commande plus grosse contre une remise plus forte",
  accroche:
    "Le client commandera davantage si la remise monte d'un palier. Le responsable des ventes veut savoir si l'affaire y gagne, délai de paiement compris.",
  objectifs: [
    "Établir la facture et la marge d'une affaire à deux niveaux de remise",
    "Chiffrer le coût du délai de paiement de chaque commande",
    "Calculer le volume qui paie une remise plus forte",
    "Rédiger une réponse chiffrée au responsable des ventes",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce cas suit une affaire négociée avec un client professionnel, qui paie à échéance.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable des ventes",
      texte: (c) => {
        const r = remiseParPalier(c);
        return [
          `« ${majuscule(r.a.client)} nous fait une proposition : il passerait sa commande de ${qte(r.a.quantite)} à ${qte(r.quantite)} ${c.unites} si nous portons sa remise de ${pct(r.a.tauxDeRemise)} à ${pct(r.tauxDuPalier)}. Le reste ne change pas : le prix catalogue, et le paiement à ${qte(r.a.delai)} jours. Avant que je lui réponde, dites-moi si l'affaire y gagne, une fois le délai payé. »`,
          "Pas de cours cette fois : vous avez les chiffres de l'affaire, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = remiseParPalier(c);
        return {
          titre: `L'affaire · ${c.entreprise}`,
          colonnes: ["Aujourd'hui", "Proposition"],
          lignes: [
            { libelle: `Quantité commandée (${c.unites})`, valeurs: [qte(r.a.quantite), qte(r.quantite)] },
            { libelle: "Prix catalogue d'une unité, hors taxes", valeurs: [eur(r.a.prix), eur(r.a.prix)] },
            { libelle: "Remise sur la facture", valeurs: [pct(r.a.tauxDeRemise), pct(r.tauxDuPalier)] },
            { libelle: "Coût variable d'une unité", valeurs: [eur(r.a.coutVariable), eur(r.a.coutVariable)] },
            { libelle: "Délai de paiement", valeurs: [`${qte(r.a.delai)} jours`, `${qte(r.a.delai)} jours`] },
            { libelle: "Taux de l'emprunt de l'entreprise", valeurs: [pct(r.a.tauxDeLEmprunt), pct(r.a.tauxDeLEmprunt)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le résultat de la commande d'aujourd'hui et de la commande proposée, délai payé, le volume qui paie la remise, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La commande d'aujourd'hui",
      notions: ["contribution_margin", "payment_terms"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Avec la remise de ${pct(r.a.tauxDeRemise)}, calculez le net commercial, la marge sur coût variable de l'affaire, le coût du délai de paiement (net commercial × taux × jours ÷ 360), puis le résultat de l'affaire.`;
      },
      champs: (c) => {
        const { a } = remiseParPalier(c);
        return [
          { libelle: "Net commercial", attendu: a.netCommercial, calcul: `${qte(a.quantite)} × ${eur(a.prix)} × (1 − ${pct(a.tauxDeRemise)}) = ${eur(a.netCommercial)}` },
          { libelle: "Marge de l'affaire", attendu: a.marge, calcul: `${eur(a.netCommercial)} − ${qte(a.quantite)} × ${eur(a.coutVariable)} = ${eur(a.marge)}` },
          { libelle: "Coût du délai", attendu: a.coutDuCredit, tolerance: 1, calcul: `${eur(a.netCommercial)} × ${pct(a.tauxDeLEmprunt)} × ${qte(a.delai)} ÷ 360 = ${eur(a.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire", attendu: a.resultatDeLAffaire, tolerance: 1, calcul: `${eur(a.marge)} − ${eur(a.coutDuCredit)} = ${eur(a.resultatDeLAffaire)}` },
        ];
      },
      explication: (c) => {
        const { a } = remiseParPalier(c);
        return [
          `Aujourd'hui, l'affaire rapporte ${eur(a.resultatDeLAffaire)} à ${c.entreprise}, remise et délai payés. C'est la base à battre : la proposition du client ne vaut que si elle fait mieux.`,
        ];
      },
    },
    {
      id: "proposition",
      type: "montants",
      titre: "La commande proposée",
      notions: ["contribution_margin", "payment_terms"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Avec ${qte(r.quantite)} ${c.unites} et une remise de ${pct(r.tauxDuPalier)}, calculez le montant brut, la remise, le net commercial, la marge de l'affaire, le coût du délai, puis le résultat.`;
      },
      champs: (c) => {
        const r = remiseParPalier(c);
        return [
          { libelle: "Montant brut", attendu: r.brut, calcul: `${qte(r.quantite)} × ${eur(r.a.prix)} = ${eur(r.brut)}` },
          { libelle: "Remise", attendu: r.remise, calcul: `${eur(r.brut)} × ${pct(r.tauxDuPalier)} = ${eur(r.remise)}` },
          { libelle: "Net commercial", attendu: r.netCommercial, calcul: `${eur(r.brut)} − ${eur(r.remise)} = ${eur(r.netCommercial)}` },
          { libelle: "Marge de l'affaire", attendu: r.marge, calcul: `${eur(r.netCommercial)} − ${qte(r.quantite)} × ${eur(r.a.coutVariable)} = ${eur(r.marge)}` },
          { libelle: "Coût du délai", attendu: r.coutDuCredit, tolerance: 1, calcul: `${eur(r.netCommercial)} × ${pct(r.a.tauxDeLEmprunt)} × ${qte(r.a.delai)} ÷ 360 = ${eur(r.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire", attendu: r.resultat, tolerance: 1, calcul: `${eur(r.marge)} − ${eur(r.coutDuCredit)} = ${eur(r.resultat)}` },
        ];
      },
      explication: (c) => {
        const r = remiseParPalier(c);
        return [
          `La remise passe de ${eur(r.a.remise)} à ${eur(r.remise)}, et le délai coûte ${eur(r.coutDuCredit)} au lieu de ${eur(r.a.coutDuCredit)}, parce qu'il porte sur une facture plus grosse. En face, ${qte(r.quantite - r.a.quantite)} ${c.unites} de plus apportent ${accord(c, "chacun")} leur marge.`,
        ];
      },
    },
    {
      id: "volume",
      type: "montants",
      titre: "Le volume qui paie la remise",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Au palier, quel est le prix d'une unité après remise ? Combien de ${c.unites} faudrait-il au moins pour retrouver la marge d'aujourd'hui (${eur(r.a.marge)}), à l'unité supérieure ? Et que gagne l'affaire proposée sur celle d'aujourd'hui, en résultat ?`;
      },
      champs: (c) => {
        const r = remiseParPalier(c);
        return [
          { libelle: "Prix d'une unité au palier", attendu: r.prixDuPalier, calcul: `${eur(r.a.prix)} × (1 − ${pct(r.tauxDuPalier)}) = ${eur(r.prixDuPalier)}` },
          { libelle: "Commande minimale pour la même marge", attendu: r.quantiteMinimale, tolerance: 1, calcul: `${eur(r.a.marge)} ÷ (${eur(r.prixDuPalier)} − ${eur(r.a.coutVariable)}), arrondi au-dessus = ${qte(r.quantiteMinimale)}` },
          { libelle: "Écart de résultat (proposition − aujourd'hui)", attendu: r.gain, tolerance: 2, calcul: `${eur(r.resultat)} − ${eur(r.a.resultatDeLAffaire)} = ${eur(r.gain)}` },
        ];
      },
      explication: (c) => {
        const r = remiseParPalier(c);
        return [
          r.quantite >= r.quantiteMinimale
            ? `Il suffirait de ${qte(r.quantiteMinimale)} ${c.unites} pour payer la remise du palier ; le client en offre ${qte(r.quantite)}. La contrepartie dépasse la concession.`
            : `Il faudrait ${qte(r.quantiteMinimale)} ${c.unites} pour payer la remise du palier ; le client n'en offre que ${qte(r.quantite)}. La contrepartie ne paie pas la concession.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable des ventes",
      question: () => "Quelle phrase envoyez-vous au responsable des ventes ?",
      options: (c) => {
        const r = remiseParPalier(c);
        const gagne = r.gain > 0;
        return [
          {
            texte: gagne ? `Accepter : ${eur(r.gain)} de résultat en plus, délai payé` : `Refuser : ${eur(-r.gain)} de résultat en moins, délai payé`,
            juste: true,
            retour: `Oui : la commande proposée rapporte ${eur(r.resultat)}, celle d'aujourd'hui ${eur(r.a.resultatDeLAffaire)}, remise et délai payés. ${gagne ? `Le volume offert (${qte(r.quantite)} ${c.unites}) dépasse celui qui paie la remise (${qte(r.quantiteMinimale)}).` : `Le volume offert (${qte(r.quantite)} ${c.unites}) n'atteint pas celui qui paie la remise (${qte(r.quantiteMinimale)}).`}`,
          },
          {
            texte: `Refuser : la remise en plus nous coûte ${eur(r.remiseEnPlus)}`,
            juste: false,
            retour: `Non : la remise monte bien de ${eur(r.remiseEnPlus)}, mais les ${qte(r.quantite - r.a.quantite)} ${c.unites} en plus apportent leur marge. C'est le résultat de chaque commande qu'il faut comparer.`,
          },
          {
            texte: `Accepter : nous gagnerons ${eur(r.factureEnPlus)} de plus`,
            juste: false,
            retour: `Non : ${eur(r.factureEnPlus)}, c'est la facture en plus, pas le gain. Les ${c.unites} en plus coûtent leurs coûts variables, et le délai coûte davantage : l'écart de résultat est de ${eur(r.gain)}.`,
          },
          {
            texte: `Accepter : le résultat de l'affaire monte de ${eur(r.margeEnPlus)}`,
            juste: false,
            retour: `Non : ${eur(r.margeEnPlus)}, c'est l'écart de marge. Le délai porte sur une facture plus grosse et coûte ${eur(auCentime(r.coutDuCredit - r.a.coutDuCredit))} de plus : l'écart de résultat est de ${eur(r.gain)}.`,
          },
        ];
      },
    },
  ],
};
