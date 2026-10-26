import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { NEGOCIATIONS, negociation } from "../chapitres/negocier-le-prix";
import { affaire } from "../chapitres/remises-et-conditions";
import type { Situation } from "./types";

/**
 * CAS PRATIQUE : LA REMISE DU GRAND COMPTE (BTS NDRC, palier 3).
 *
 * Le client professionnel du cas met une grosse commande sur la table, à deux conditions :
 * une remise et un délai de paiement. Il promet de la renouveler s'il est satisfait.
 * L'élève rend ce que l'affaire rapporte avec et sans la remise, ce que coûte le délai, le
 * prix plancher, ce que vaut le client sur la durée promise, puis sa réponse au client.
 *
 * Aucun cours : les calculs sont ceux des chapitres « Négocier le prix » (le coût complet,
 * le plancher) et « Remises et conditions » (la facture, la marge, le coût du crédit
 * client), appelés tels quels (`negociation`, `affaire`). La remise est celle du cours
 * (`TAUX_DE_REMISE`), le délai celui du client du cas, le taux celui de l'emprunt de
 * l'entreprise. Seule la promesse de renouvellement est une hypothèse, posée ci-dessous.
 */

/**
 * La promesse du client : la même commande chaque trimestre pendant deux ans, soit huit
 * commandes. L'arène ne joue pas la fidélité d'un client professionnel ; ce nombre sert
 * à mesurer ce que la remise coûte, et ce que le client rapporte, quand elle se répète.
 */
export const COMMANDES_PROMISES = 8;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const negocie = (c: Cas) => (NEGOCIATIONS as readonly string[]).includes(c.code);

/** L'affaire, son plancher, et ce que vaut le client sur la durée promise. */
export function remiseDuGrandCompte(c: Cas) {
  const a = affaire(c);
  const n = negociation(c);
  const verdict: "couvre" | "sous-le-complet" | "sous-le-variable" =
    a.prixRemise >= n.coutComplet ? "couvre" : a.prixRemise >= n.coutVariable ? "sous-le-complet" : "sous-le-variable";
  return {
    a,
    n,
    valeurDuClient: auCentime(a.resultatDeLAffaire * COMMANDES_PROMISES),
    remiseSurLaDuree: auCentime(a.margeCedee * COMMANDES_PROMISES),
    verdict,
  };
}

export const LA_REMISE_DU_GRAND_COMPTE: Situation = {
  code: "la-remise-du-grand-compte",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["negocier-le-prix", "remises-et-conditions"],
  commanditaire: "Un grand compte",
  titre: "La remise du grand compte",
  accroche:
    "Un gros client exige une remise et un délai de paiement pour signer, et promet de revenir. Chiffrer l'affaire, son plancher et la valeur du client, puis lui répondre.",
  objectifs: [
    "Calculer la marge d'une affaire avec et sans remise",
    "Calculer le coût d'un délai de paiement accordé au client",
    "Calculer le coût complet d'une unité, plancher d'un prix durable",
    "Mesurer ce que vaut un client qui renouvelle sa commande, et lui répondre",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "cette situation suit une négociation avec un client professionnel, là où le prix se discute affaire par affaire.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le courriel du client",
      si: negocie,
      texte: (c) => {
        const { a } = remiseDuGrandCompte(c);
        return [
          `« Nous sommes prêts à vous commander ${qte(a.quantite)} ${c.unites} au prix de ${eur(a.prix)} hors taxes, à deux conditions : une remise de ${pct(a.tauxDeRemise)} sur la facture, et un paiement à ${a.delai} jours. Si cette première commande nous donne satisfaction, nous vous passerons la même chaque trimestre pendant deux ans. Merci de nous répondre avant vendredi. » ${majuscule(a.client)}`,
          `Votre responsable vous transmet le courriel avec les chiffres ${dE(c.entreprise)}. Pas de cours cette fois : les calculs sont ceux que vous connaissez.`,
        ];
      },
      tableau: (c) => {
        const { a, n } = remiseDuGrandCompte(c);
        return {
          titre: `L'affaire et les coûts · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Quantité commandée (${c.unites})`, valeurs: [qte(a.quantite)] },
            { libelle: `Prix catalogue d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(a.prix)] },
            { libelle: "Remise demandée", valeurs: [pct(a.tauxDeRemise)] },
            { libelle: "Délai de paiement demandé", valeurs: [`${a.delai} jours`] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(a.coutVariable)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(n.chargesFixes)] },
            { libelle: `Quantité vendue dans le mois (${c.unites})`, valeurs: [qte(n.quantiteDuMois)] },
            { libelle: "Taux de l'emprunt de l'entreprise", valeurs: [pct(a.tauxDeLEmprunt)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge de l'affaire avec et sans remise, le coût du délai, le coût complet et le prix remisé d'une unité, ce que vaut le client sur deux ans, et votre réponse.",
    },
    {
      id: "l-affaire",
      type: "montants",
      titre: "Ce que rapporte l'affaire",
      notions: ["contribution_margin", "price_floor"],
      si: negocie,
      question: () =>
        "Calculez le montant brut de la commande, la remise, le net commercial et les coûts variables de l'affaire, puis la marge sans la remise (brut moins coûts variables) et avec la remise (net commercial moins coûts variables).",
      champs: (c) => {
        const { a } = remiseDuGrandCompte(c);
        return [
          { libelle: "Montant brut", attendu: a.brut, calcul: `${qte(a.quantite)} × ${eur(a.prix)} = ${eur(a.brut)}` },
          { libelle: "Remise", attendu: a.remise, calcul: `${eur(a.brut)} × ${pct(a.tauxDeRemise)} = ${eur(a.remise)}` },
          { libelle: "Net commercial", attendu: a.netCommercial, calcul: `${eur(a.brut)} − ${eur(a.remise)} = ${eur(a.netCommercial)}` },
          { libelle: "Coûts variables de l'affaire", attendu: a.coutsVariables, calcul: `${qte(a.quantite)} × ${eur(a.coutVariable)} = ${eur(a.coutsVariables)}` },
          { libelle: "Marge sans la remise", attendu: a.margeSansRemise, calcul: `${eur(a.brut)} − ${eur(a.coutsVariables)} = ${eur(a.margeSansRemise)}` },
          { libelle: "Marge avec la remise", attendu: a.marge, calcul: `${eur(a.netCommercial)} − ${eur(a.coutsVariables)} = ${eur(a.marge)}` },
        ];
      },
      explication: (c) => {
        const { a } = remiseDuGrandCompte(c);
        return [
          `La remise de ${pct(a.tauxDeRemise)} sur le prix retire ${eur(a.margeCedee)} à la marge, soit ${pct(a.partDeLaMargeCedee)} de la marge : elle se prend tout entière sur la marge, le coût ne bouge pas.`,
        ];
      },
    },
    {
      id: "le-delai",
      type: "montants",
      titre: "Ce que coûte le délai",
      notions: ["payment_terms"],
      si: negocie,
      question: () =>
        "Pendant le délai, l'entreprise attend son argent et le finance au taux de son emprunt. Calculez le coût du délai (net commercial × taux × jours ÷ 360), puis le résultat de l'affaire (la marge avec remise moins ce coût).",
      champs: (c) => {
        const { a } = remiseDuGrandCompte(c);
        return [
          { libelle: "Coût du délai", attendu: a.coutDuCredit, calcul: `${eur(a.netCommercial)} × ${pct(a.tauxDeLEmprunt)} × ${a.delai} ÷ 360 = ${eur(a.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire", attendu: a.resultatDeLAffaire, calcul: `${eur(a.marge)} − ${eur(a.coutDuCredit)} = ${eur(a.resultatDeLAffaire)}` },
        ];
      },
      explication: (c) => {
        const { a } = remiseDuGrandCompte(c);
        return [
          a.coutDuCredit < a.margeCedee
            ? `Le délai coûte ${eur(a.coutDuCredit)}, bien moins que la remise : des deux conditions, c'est la remise qui pèse.`
            : `Le délai coûte ${eur(a.coutDuCredit)}, plus que la remise elle-même : des deux conditions, c'est le délai qui pèse.`,
        ];
      },
    },
    {
      id: "le-plancher",
      type: "montants",
      titre: "Le prix plancher",
      notions: ["full_unit_cost", "price_floor"],
      si: negocie,
      question: () =>
        "Calculez la part des charges fixes d'une unité (charges fixes du mois ÷ quantité du mois), le coût complet d'une unité, puis le prix d'une unité après la remise.",
      champs: (c) => {
        const { a, n } = remiseDuGrandCompte(c);
        return [
          { libelle: "Part des charges fixes d'une unité", attendu: n.partDesFixes, calcul: `${eur(n.chargesFixes)} ÷ ${qte(n.quantiteDuMois)} = ${eur(n.partDesFixes)}` },
          { libelle: "Coût complet d'une unité", attendu: n.coutComplet, calcul: `${eur(n.coutVariable)} + ${eur(n.partDesFixes)} = ${eur(n.coutComplet)}` },
          { libelle: "Prix d'une unité après la remise", attendu: a.prixRemise, calcul: `${eur(a.prix)} × (1 − ${pct(a.tauxDeRemise)}) = ${eur(a.prixRemise)}` },
        ];
      },
      explication: (c) => {
        const { a, n, verdict } = remiseDuGrandCompte(c);
        return [
          verdict === "couvre"
            ? `Remisé, le prix (${eur(a.prixRemise)}) couvre encore le coût complet (${eur(n.coutComplet)}) : même répétée deux ans, l'affaire paie sa part des charges fixes.`
            : verdict === "sous-le-complet"
              ? `Remisé, le prix (${eur(a.prixRemise)}) couvre le coût variable mais pas le coût complet (${eur(n.coutComplet)}) : acceptable pour une affaire en plus, pas pour un client qui reviendra deux ans.`
              : `Remisé, le prix (${eur(a.prixRemise)}) ne couvre même pas le coût variable (${eur(n.coutVariable)}) : chaque unité vendue ferait perdre de l'argent.`,
        ];
      },
    },
    {
      id: "dans-le-temps",
      type: "montants",
      titre: "Ce que vaut le client sur deux ans",
      notions: ["customer_lifetime_value", "contribution_margin"],
      si: negocie,
      question: () =>
        `Si le client tient sa promesse (la même commande chaque trimestre pendant deux ans, soit ${COMMANDES_PROMISES} commandes), que rapporte-t-il en tout, au résultat de l'affaire ? Et combien la remise coûte-t-elle de marge sur la même durée ?`,
      champs: (c) => {
        const { a, valeurDuClient, remiseSurLaDuree } = remiseDuGrandCompte(c);
        return [
          { libelle: "Ce que rapporte le client sur deux ans", attendu: valeurDuClient, calcul: `${eur(a.resultatDeLAffaire)} × ${COMMANDES_PROMISES} = ${eur(valeurDuClient)}`, tolerance: 1 },
          { libelle: "Ce que coûte la remise sur deux ans", attendu: remiseSurLaDuree, calcul: `${eur(a.margeCedee)} × ${COMMANDES_PROMISES} = ${eur(remiseSurLaDuree)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const { valeurDuClient, remiseSurLaDuree } = remiseDuGrandCompte(c);
        return [
          valeurDuClient > 0
            ? `Sur deux ans, le client rapporterait ${eur(valeurDuClient)}, remise et délai payés. La remise, elle, coûterait ${eur(remiseSurLaDuree)} : une concession qui se répète à chaque commande.`
            : `Sur deux ans, le client ferait perdre ${eur(-valeurDuClient)} , une perte qui se répète à chaque commande.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au client",
      si: negocie,
      question: () => "Que répondez-vous au client ?",
      options: (c) => {
        const { a, n, verdict, valeurDuClient } = remiseDuGrandCompte(c);
        return [
          {
            texte: "Refuser : remisé, le prix ne couvre plus le coût variable",
            juste: verdict === "sous-le-variable",
            retour:
              verdict === "sous-le-variable"
                ? `Oui : à ${eur(a.prixRemise)}, chaque unité coûte plus qu'elle ne rapporte (${eur(n.coutVariable)} de coût variable).`
                : `Non : le prix remisé (${eur(a.prixRemise)}) reste au-dessus du coût variable (${eur(n.coutVariable)}).`,
          },
          {
            texte: "Signer : même remisé, notre prix couvre le coût complet",
            juste: verdict === "couvre",
            retour:
              verdict === "couvre"
                ? `Oui : ${eur(a.prixRemise)} contre ${eur(n.coutComplet)} de coût complet, et ${eur(valeurDuClient)} de résultat sur deux ans, délai payé.`
                : `Non : remisé, le prix (${eur(a.prixRemise)}) passe sous le coût complet (${eur(n.coutComplet)}).`,
          },
          {
            texte: "Signer à tout prix : un grand compte se garde même à perte",
            juste: false,
            retour: `Non : un client se garde s'il rapporte. Le plancher d'un prix qui dure deux ans est le coût complet, ${eur(n.coutComplet)} ici.`,
          },
          {
            texte: "Refuser la remise : remisé, le prix passe sous le coût complet",
            juste: verdict === "sous-le-complet",
            retour:
              verdict === "sous-le-complet"
                ? `Oui : pour un client qui revient deux ans, le plancher est le coût complet, ${eur(n.coutComplet)}, et le prix remisé n'est que de ${eur(a.prixRemise)}.`
                : verdict === "couvre"
                  ? `Non : remisé, le prix (${eur(a.prixRemise)}) reste au-dessus du coût complet (${eur(n.coutComplet)}).`
                  : `Pire : le prix remisé (${eur(a.prixRemise)}) passe même sous le coût variable (${eur(n.coutVariable)}).`,
          },
        ];
      },
    },
  ],
};
