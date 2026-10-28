import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_CONDITIONS, conditionsDeKerval, ficheDe } from "../../chapitres/remises-et-conditions";
import { auCentime } from "../../monde/amortissement";
import { JOURS_DE_L_ANNEE_BANCAIRE } from "../../monde/delais-et-tva";
import { affaireAuxConditions } from "../../monde/delais";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMISES ET CONDITIONS » : LA REMISE PAR PALIER (BTS NDRC, palier 2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'affaire de Kerval Distribution chez ATLAS
 * CONSEIL (monde/delais-et-tva.ts, `ATLAS_CONDITIONS`), calculée par le modèle des délais
 * (monde/delais.ts, `affaireAuxConditions`). Le cas ne lit du cas de l'arène que son code.
 *
 * Kerval propose de passer sa commande de 40 à 48 journées si la remise monte de 5 % à 8 %. Le
 * responsable des ventes veut savoir si l'affaire y gagne, délai payé, et à partir de quel volume il
 * peut accorder ce palier. L'élève refait seul le chemin du chapitre, deux fois (la commande
 * d'aujourd'hui, la commande proposée : 23 944 € contre 27 598,08 €), trouve au curseur la plus petite
 * commande qui garde le résultat d'aujourd'hui au palier (42 journées), remonte à la plus forte remise
 * que 48 journées paieraient (17,66 %), et rend une réponse qui demande un jugement : accepter, mais
 * n'accorder les 8 % qu'à partir du volume qui les paie (à 40 journées, le palier ferait perdre
 * 945,60 €).
 *
 * Le délai se finance hors taxes, comme au chapitre (une prestation de services ne doit sa TVA qu'à
 * l'encaissement). Le cas ne fait pas jouer l'escompte : la question est celle du volume.
 */

/**
 * La remise du palier supérieur : 8 % au lieu de 5 %. Trois points de plus, le pas habituel d'une
 * grille de remises par quantité entre professionnels.
 */
export const REMISE_DU_PALIER = 0.08;

/**
 * Ce que le client offre en échange : une commande plus grosse d'un cinquième, l'écart qui sépare
 * d'ordinaire deux paliers d'une grille de remises.
 */
export const COMMANDE_EN_PLUS = 0.2;

/** Les bornes du curseur du cas, en journées commandées au palier. */
export const JOURNEES_DU_PALIER = { min: 30, max: 60 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (part: number) => `${qte(Math.round(part * 10_000) / 100)} %`;

/** Les deux commandes, et ce qui les sépare. */
export function remiseParPalier(c: Pick<Cas, "code">) {
  const k = conditionsDeKerval(c);
  const f = ficheDe(c);
  const journees = Math.round(k.journees * (1 + COMMANDE_EN_PLUS));
  const p = affaireAuxConditions(f, { remise: REMISE_DU_PALIER, journees });
  // Une journée au palier, délai payé : son prix remisé, moins son coût variable, moins le crédit de ce prix.
  const creditDUneJournee = auCentime((p.prixRemise * k.taux * k.delai) / JOURS_DE_L_ANNEE_BANCAIRE);
  const resultatDUneJournee = auCentime(p.margeParJourneeRemisee - creditDUneJournee);
  const commandeMinimale = Math.ceil(k.resultat / resultatDUneJournee - 1e-9);
  // À rebours : la remise la plus forte que la commande proposée paie, au centième de point inférieur.
  // Résultat = net commercial × (1 − taux × délai ÷ 360) − coûts variables ≥ résultat d'aujourd'hui.
  const netCommercialNecessaire = (k.resultat + p.coutsVariables) / (1 - (k.taux * k.delai) / JOURS_DE_L_ANNEE_BANCAIRE);
  const remiseLaPlusForte = Math.floor((1 - netCommercialNecessaire / p.facture.brut) * 10_000 + 1e-9) / 10_000;
  // Le palier accordé sans condition de volume : la commande d'aujourd'hui, au taux du palier.
  const sansCondition = affaireAuxConditions(f, { remise: REMISE_DU_PALIER });
  return {
    k,
    tauxDuPalier: REMISE_DU_PALIER,
    journees,
    brut: p.facture.brut,
    remise: p.facture.reductions[0]!.montant,
    netCommercial: p.facture.netCommercial,
    coutsVariables: p.coutsVariables,
    marge: p.marge,
    coutDuCredit: p.coutDuCredit,
    resultat: p.resultat,
    prixDuPalier: p.prixRemise,
    margeParJournee: p.margeParJourneeRemisee,
    creditDUneJournee,
    resultatDUneJournee,
    commandeMinimale,
    remiseLaPlusForte,
    gain: auCentime(p.resultat - k.resultat),
    sansCondition: { resultat: sansCondition.resultat, perte: auCentime(k.resultat - sansCondition.resultat) },
    // Les erreurs classiques : ne regarder que la remise, confondre la facture et le gain, oublier que le
    // délai porte sur une facture plus grosse.
    remiseEnPlus: auCentime(p.facture.reductions[0]!.montant - k.montantDeLaRemise),
    factureEnPlus: auCentime(p.facture.netCommercial - k.netCommercial),
    margeEnPlus: auCentime(p.marge - k.marge),
    creditEnPlus: auCentime(p.coutDuCredit - k.coutDuCredit),
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
    "Kerval Distribution commandera davantage si la remise monte d'un palier. Le responsable des ventes veut savoir si l'affaire y gagne, délai de paiement compris, et à partir de quel volume accorder ce palier.",
  objectifs: [
    "Établir la facture et la marge d'une affaire à deux niveaux de remise",
    "Chiffrer le coût du délai de paiement de chaque commande",
    "Trouver le volume qui paie une remise plus forte, et la remise que paie un volume",
    "Rédiger une réponse chiffrée au responsable des ventes",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_CONDITIONS,
    pourquoi:
      "ce cas se joue chez ATLAS CONSEIL, le cabinet de la simulation du cours : une affaire avec un client professionnel qui paie à échéance, et des prestations de services, dont la TVA n'est due qu'à l'encaissement.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable des ventes",
      texte: (c) => {
        const r = remiseParPalier(c);
        return [
          `« ${r.k.client} nous fait une proposition : passer sa commande de ${qte(r.k.journees)} à ${qte(r.journees)} journées si nous portons sa remise de ${pct(r.k.remise)} à ${pct(r.tauxDuPalier)}. Le reste ne change pas : le prix catalogue, et le paiement à ${qte(r.k.delai)} jours. Dites-moi si l'affaire y gagne, une fois le délai payé, et à partir de combien de journées je peux accorder ce palier sans y perdre. »`,
          "Pas de cours cette fois : vous avez les chiffres de l'affaire, et la méthode est celle du chapitre. Le délai se finance sur le découvert, hors taxes : la TVA d'une prestation de services n'est due qu'à l'encaissement.",
        ];
      },
      tableau: (c) => {
        const r = remiseParPalier(c);
        return {
          titre: `L'affaire ${r.k.client} · ${r.k.entreprise}`,
          colonnes: ["Aujourd'hui", "Proposition"],
          lignes: [
            { libelle: "Journées commandées", valeurs: [qte(r.k.journees), qte(r.journees)] },
            { libelle: "Prix catalogue d'une journée (HT)", valeurs: [eur(r.k.prix), eur(r.k.prix)] },
            { libelle: "Remise sur la commande", valeurs: [pct(r.k.remise), pct(r.tauxDuPalier)] },
            { libelle: "Coût variable d'une journée (HT)", valeurs: [eur(r.k.coutVariable), eur(r.k.coutVariable)] },
            { libelle: "Délai de paiement", valeurs: [`${qte(r.k.delai)} jours`, `${qte(r.k.delai)} jours`] },
            { libelle: "Taux du découvert du cabinet, l'an", valeurs: [pct(r.k.taux), pct(r.k.taux)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le résultat de la commande d'aujourd'hui et de la commande proposée, délai payé, la plus petite commande qui paie le palier, la plus forte remise que paie la commande proposée, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La commande d'aujourd'hui",
      notions: ["contribution_margin", "payment_terms"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Avec la remise de ${pct(r.k.remise)}, calculez le net commercial, la marge sur coût variable de l'affaire, le coût du délai de paiement, puis le résultat de l'affaire.`;
      },
      champs: (c) => {
        const { k } = remiseParPalier(c);
        return [
          { libelle: "Net commercial (HT)", attendu: k.netCommercial, calcul: `${qte(k.journees)} × ${eur(k.prix)} × (1 − ${pct(k.remise)}) = ${eur(k.netCommercial)}` },
          { libelle: "Marge de l'affaire (HT)", attendu: k.marge, calcul: `${eur(k.netCommercial)} − ${qte(k.journees)} × ${eur(k.coutVariable)} = ${eur(k.marge)}` },
          { libelle: "Coût du délai", attendu: k.coutDuCredit, calcul: `${eur(k.netCommercial)} × ${pct(k.taux)} × ${qte(k.delai)} ÷ 360 = ${eur(k.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire (HT)", attendu: k.resultat, calcul: `${eur(k.marge)} − ${eur(k.coutDuCredit)} = ${eur(k.resultat)}` },
        ];
      },
      explication: (c) => {
        const { k } = remiseParPalier(c);
        return [
          `Aujourd'hui, l'affaire rapporte ${eur(k.resultat)} au cabinet, remise et délai payés. C'est la base à battre : la proposition du client ne vaut que si elle fait mieux.`,
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
        return `Avec ${qte(r.journees)} journées et une remise de ${pct(r.tauxDuPalier)}, calculez le montant brut, la remise, le net commercial, la marge de l'affaire, le coût du délai, puis le résultat.`;
      },
      champs: (c) => {
        const r = remiseParPalier(c);
        return [
          { libelle: "Montant brut (HT)", attendu: r.brut, calcul: `${qte(r.journees)} × ${eur(r.k.prix)} = ${eur(r.brut)}` },
          { libelle: "Remise", attendu: r.remise, calcul: `${eur(r.brut)} × ${pct(r.tauxDuPalier)} = ${eur(r.remise)}` },
          { libelle: "Net commercial (HT)", attendu: r.netCommercial, calcul: `${eur(r.brut)} − ${eur(r.remise)} = ${eur(r.netCommercial)}` },
          { libelle: "Marge de l'affaire (HT)", attendu: r.marge, calcul: `${eur(r.netCommercial)} − ${qte(r.journees)} × ${eur(r.k.coutVariable)} = ${eur(r.marge)}` },
          { libelle: "Coût du délai", attendu: r.coutDuCredit, calcul: `${eur(r.netCommercial)} × ${pct(r.k.taux)} × ${qte(r.k.delai)} ÷ 360 = ${eur(r.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire (HT)", attendu: r.resultat, calcul: `${eur(r.marge)} − ${eur(r.coutDuCredit)} = ${eur(r.resultat)}` },
        ];
      },
      explication: (c) => {
        const r = remiseParPalier(c);
        return [
          `La remise passe de ${eur(r.k.montantDeLaRemise)} à ${eur(r.remise)}, et le délai coûte ${eur(r.coutDuCredit)} au lieu de ${eur(r.k.coutDuCredit)}, parce qu'il porte sur une facture plus grosse. En face, ${qte(r.journees - r.k.journees)} journées de plus apportent chacune leur marge : l'affaire rapporte ${eur(r.resultat)}.`,
        ];
      },
    },
    {
      id: "le-palier-au-curseur",
      type: "curseur",
      titre: "La plus petite commande au palier",
      notions: ["contribution_margin", "payment_terms"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Faites varier la commande au palier de ${pct(r.tauxDuPalier)}, de ${qte(JOURNEES_DU_PALIER.min)} à ${qte(JOURNEES_DU_PALIER.max)} journées. Une droite donne le résultat de l'affaire au palier, délai payé ; l'autre, le résultat d'aujourd'hui, ${eur(r.k.resultat)}. Placez le curseur sur la plus petite commande qui le garde, puis validez.`;
      },
      grandeur: () => ({ libelle: "Journées commandées au palier", unite: "journées" }),
      cible: (c) => {
        const r = remiseParPalier(c);
        return { attendu: r.commandeMinimale, min: JOURNEES_DU_PALIER.min, max: JOURNEES_DU_PALIER.max };
      },
      zones: ["Le palier paie", "Le palier coûte"],
      rates: () => ({
        dessous: "À cette commande, le palier rapporte moins que l'affaire d'aujourd'hui.",
        dessus: "Avec moins de journées, le palier garde encore le résultat d'aujourd'hui : cherchez la plus petite commande.",
      }),
      montrer: "Montrer la commande",
      lecture: (c, q) => {
        const r = remiseParPalier(c);
        return [
          { libelle: "Marge au palier (HT)", montant: auCentime(q * r.margeParJournee) },
          { libelle: "Coût du délai", montant: auCentime(q * r.creditDUneJournee) },
          { libelle: "Résultat au palier, délai payé", montant: auCentime(q * r.resultatDUneJournee), fort: true },
          { libelle: "Résultat d'aujourd'hui", montant: r.k.resultat },
        ];
      },
      droites: (c) => {
        const r = remiseParPalier(c);
        return {
          produit: (q) => q * r.resultatDUneJournee,
          cout: () => r.k.resultat,
          libelles: ["Résultat de l'affaire au palier", "Résultat de l'affaire d'aujourd'hui"],
        };
      },
      explication: (c) => {
        const r = remiseParPalier(c);
        const avant = r.commandeMinimale - 1;
        return [
          `Au palier, une journée rapporte ${eur(r.resultatDUneJournee)}, délai payé : ${eur(r.prixDuPalier)} moins ${eur(r.k.coutVariable)} de coût variable et ${eur(r.creditDUneJournee)} de crédit. À ${qte(avant)} journées, l'affaire ne rapporterait que ${eur(auCentime(avant * r.resultatDUneJournee))} ; à ${qte(r.commandeMinimale)}, ${eur(auCentime(r.commandeMinimale * r.resultatDUneJournee))}.`,
          `Le palier ne paie qu'à partir de ${qte(r.commandeMinimale)} journées. ${r.k.client} en propose ${qte(r.journees)} : la contrepartie dépasse la concession, à condition qu'elle soit tenue.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le volume et la remise, à rebours",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const r = remiseParPalier(c);
        return `Reprenez le curseur par le calcul. Quel résultat une journée laisse-t-elle au palier, délai payé ? Quelle est la plus petite commande qui garde le résultat d'aujourd'hui ? Puis, à l'inverse : avec ${qte(r.journees)} journées, quelle remise la plus forte (en %, au centième inférieur) garderait encore ce résultat ? Enfin, que gagne la proposition sur l'affaire d'aujourd'hui ?`;
      },
      champs: (c) => {
        const r = remiseParPalier(c);
        const necessaire = auCentime((r.k.resultat + r.coutsVariables) / (1 - (r.k.taux * r.k.delai) / JOURS_DE_L_ANNEE_BANCAIRE));
        return [
          {
            libelle: "Résultat d'une journée au palier",
            attendu: r.resultatDUneJournee,
            calcul: `${eur(r.prixDuPalier)} − ${eur(r.k.coutVariable)} − ${eur(r.prixDuPalier)} × ${pct(r.k.taux)} × ${qte(r.k.delai)} ÷ 360 = ${eur(r.resultatDUneJournee)}`,
          },
          {
            libelle: "Commande minimale au palier",
            attendu: r.commandeMinimale,
            calcul: `${eur(r.k.resultat)} ÷ ${eur(r.resultatDUneJournee)} = ${qte(auCentime(r.k.resultat / r.resultatDUneJournee))}, soit ${qte(r.commandeMinimale)} journées à la journée supérieure`,
          },
          {
            libelle: `Remise la plus forte sur ${qte(r.journees)} journées (%)`,
            attendu: Math.round(r.remiseLaPlusForte * 10_000) / 100,
            tolerance: 0.01,
            calcul: `Le net commercial doit couvrir (${eur(r.k.resultat)} + ${eur(r.coutsVariables)}) ÷ (1 − ${pct(r.k.taux)} × ${qte(r.k.delai)} ÷ 360) = ${eur(necessaire)} ; remise = 1 − ${eur(necessaire)} ÷ ${eur(r.brut)} = ${pct(r.remiseLaPlusForte)}`,
          },
          { libelle: "Résultat gagné par la proposition", attendu: r.gain, calcul: `${eur(r.resultat)} − ${eur(r.k.resultat)} = ${eur(r.gain)}` },
        ];
      },
      explication: (c) => {
        const r = remiseParPalier(c);
        return [
          `Il suffirait de ${qte(r.commandeMinimale)} journées pour payer le palier ; ${r.k.client} en offre ${qte(r.journees)}. À l'inverse, ${qte(r.journees)} journées paieraient jusqu'à ${pct(r.remiseLaPlusForte)} de remise : les ${pct(r.tauxDuPalier)} demandés laissent ${eur(r.gain)} de résultat en plus.`,
          `Le palier ne vaut que par le volume : accordé sur les ${qte(r.k.journees)} journées d'aujourd'hui, il ne laisserait que ${eur(r.sansCondition.resultat)}, ${eur(r.sansCondition.perte)} de moins qu'aujourd'hui.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable des ventes",
      question: () => "Quelle réponse envoyez-vous au responsable des ventes ?",
      options: (c) => {
        const r = remiseParPalier(c);
        const gagne = r.gain > 0;
        return [
          {
            texte: gagne ? `Accepter, et n'accorder les ${pct(r.tauxDuPalier)} qu'à partir de ${qte(r.commandeMinimale)} journées` : `Refuser : à ${qte(r.journees)} journées, le palier ne se paie pas`,
            juste: true,
            retour: gagne
              ? `Oui : la commande proposée rapporte ${eur(r.resultat)}, celle d'aujourd'hui ${eur(r.k.resultat)}, remise et délai payés, soit ${eur(r.gain)} de plus. Mais le palier ne se paie qu'à partir de ${qte(r.commandeMinimale)} journées : c'est le plancher à écrire dans les conditions, pour que la remise suive le volume réellement commandé.`
              : `Oui : la commande proposée ne rapporte que ${eur(r.resultat)}, contre ${eur(r.k.resultat)} aujourd'hui ; il faudrait ${qte(r.commandeMinimale)} journées pour payer le palier.`,
          },
          {
            texte: `Refuser : la remise en plus nous coûte ${eur(r.remiseEnPlus)}`,
            juste: false,
            retour: `Non : la remise monte bien de ${eur(r.remiseEnPlus)}, mais les ${qte(r.journees - r.k.journees)} journées en plus apportent leur marge. C'est le résultat de chaque commande qu'il faut comparer : ${eur(r.gain)} de plus.`,
          },
          {
            texte: `Accepter : l'affaire nous rapporte ${eur(r.factureEnPlus)} de plus`,
            juste: false,
            retour: `Non : ${eur(r.factureEnPlus)}, c'est la facture hors taxes en plus, pas le gain. Les journées en plus coûtent leurs coûts variables, et le délai coûte davantage : l'écart de résultat est de ${eur(r.gain)}.`,
          },
          {
            texte: `Accepter : le résultat de l'affaire monte de ${eur(r.margeEnPlus)}`,
            juste: false,
            retour: `Non : ${eur(r.margeEnPlus)}, c'est l'écart de marge. Le délai porte sur une facture plus grosse et coûte ${eur(r.creditEnPlus)} de plus : l'écart de résultat est de ${eur(r.gain)}.`,
          },
          {
            texte: `Accepter, et accorder les ${pct(r.tauxDuPalier)} dès les ${qte(r.k.journees)} journées d'aujourd'hui`,
            juste: false,
            retour: `Non : le gain vient du volume, pas du palier. Accordés sur ${qte(r.k.journees)} journées, les ${pct(r.tauxDuPalier)} ne laisseraient que ${eur(r.sansCondition.resultat)}, ${eur(r.sansCondition.perte)} de moins qu'aujourd'hui : une remise par palier se donne contre le volume qui la paie.`,
          },
        ];
      },
    },
  ],
};
