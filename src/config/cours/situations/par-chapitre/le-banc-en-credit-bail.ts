import { arrondi2, eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_FINANCEMENT } from "../../chapitres/emprunt-ou-credit-bail";
import { BANC, CREDIT_BAIL_DE_LA_LIGNE, CREDIT_BAIL_DU_BANC, LIGNE_A_FINANCER, EMPRUNT_DU_BANC, TAUX_DE_L_IMPOT, comparaisonDuBanc } from "../../monde/financement-de-la-gamme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « EMPRUNT OU CRÉDIT-BAIL » : LE BANC EN CRÉDIT-BAIL (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le banc de mesure acoustique de
 * nova-gestion.ts (30 000 € HT, amorti sur 60 mois), que NOVA reprend en N+1, et la comparaison de
 * monde/financement-de-la-gamme.ts (`comparaisonDuBanc`).
 *
 * HYPOTHÈSES DU CAS (monde/financement-de-la-gamme.ts, CREDIT_BAIL_DU_BANC) : un fabricant propose le
 * banc en crédit-bail sur 5 ans, 6 600 € de redevance à chaque fin d'année, une option de 1 500 €, le
 * banc racheté amorti sur un an ; la banque le prêterait à 5 % sur 5 ans. Le banc s'amortit sur 5 ans,
 * la durée du contrat : l'économie perdue s'arrête avec lui, et l'option rachète un banc déjà amorti.
 * Cette fois, le crédit-bail l'emporte, de peu : l'élève refait seul le chemin du chapitre et doit
 * voir que la réponse change avec le contrat.
 */

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function bancEnCreditBail(_c?: Pick<Cas, "code">) {
  const x = comparaisonDuBanc();
  const d = x.creditBail.dates;
  const cb = CREDIT_BAIL_DU_BANC;
  const dotation = arrondi2(BANC.montant / BANC.dureeDAmortissement);
  return {
    x,
    d,
    cb,
    dotation,
    t: TAUX_DE_L_IMPOT,
    r: x.coutDeLEmprunt,
    decaissements: arrondi2(cb.valeur - x.vanDuCreditBail),
  };
}

export const LE_BANC_EN_CREDIT_BAIL: Situation = {
  code: "le-banc-en-credit-bail",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["emprunt-ou-credit-bail"],
  commanditaire: "Le dirigeant",
  titre: "Le banc en crédit-bail",
  accroche: "Le fabricant du banc de mesure propose un crédit-bail. Pour la ligne, l'emprunt l'emportait. Et pour le banc ?",
  objectifs: [
    "Établir les flux d'un crédit-bail après impôt",
    "Les actualiser au coût de l'emprunt après impôt",
    "Rendre une réponse chiffrée, et dire pourquoi elle diffère de celle de la ligne",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "ce cas reprend le chapitre « Emprunt ou crédit-bail », qui se joue sur les investissements de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: () => {
        const n = bancEnCreditBail();
        return [
          `« Pour la ligne, l'emprunt l'a emporté. Le fabricant du banc de mesure me propose maintenant un crédit-bail : ${n.cb.dureeAns} redevances de ${eur(n.cb.redevance)} et une option de ${eur(n.cb.option)}. La banque, elle, prêterait les ${eur(BANC.montant)} à ${pct(EMPRUNT_DU_BANC.taux)}. Lequel dois-je signer ? »`,
          "Pas de cours cette fois : vous avez les deux offres, et la méthode du chapitre.",
        ];
      },
      tableau: () => {
        const n = bancEnCreditBail();
        return {
          titre: `${BANC.libelle}, ${eur(BANC.montant)} HT`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Emprunt bancaire", valeurs: [`${pct(EMPRUNT_DU_BANC.taux)} sur ${EMPRUNT_DU_BANC.dureeAns} ans, capital remboursé en parts égales`] },
            { libelle: "Crédit-bail", valeurs: [`${n.cb.dureeAns} redevances de ${eur(n.cb.redevance)}, chaque fin d'année ; option de ${eur(n.cb.option)} à la fin`] },
            { libelle: "Banc acheté", valeurs: [`amorti en linéaire sur ${BANC.dureeDAmortissement} ans, ${eur(n.dotation)} par an`] },
            { libelle: "Banc racheté à l'option", valeurs: [`amorti sur ${n.cb.dureeDAmortissementDeLOption} an`] },
            { libelle: "Impôt sur les bénéfices", valeurs: [pct(n.t)] },
          ],
        };
      },
      repere: () => "À rendre : les flux du crédit-bail après impôt, leur VAN au coût de l'emprunt, et votre réponse.",
    },
    {
      id: "les-flux",
      type: "montants",
      titre: "Les flux du crédit-bail",
      notions: ["depreciation"],
      question: () => "Calculez la redevance nette d'impôt, l'économie d'impôt perdue chaque année sur l'amortissement du banc, le flux d'une année ordinaire du contrat, celui de la dernière, option comprise, puis celui de l'année qui suit.",
      champs: () => {
        const n = bancEnCreditBail();
        const d1 = n.d[1]!;
        const fin = n.d[n.cb.dureeAns]!;
        const apres = n.d[n.cb.dureeAns + 1]!;
        return [
          { libelle: "Redevance nette d'impôt", attendu: d1.redevanceNette, calcul: `${eur(n.cb.redevance)} × (1 − ${pct(n.t)}) = ${eur(d1.redevanceNette)}` },
          { libelle: "Économie d'impôt perdue chaque année", attendu: d1.economiePerdue, calcul: `${eur(n.dotation)} × ${pct(n.t)} = ${eur(d1.economiePerdue)}` },
          { libelle: "Flux d'une année ordinaire", attendu: d1.flux, calcul: `− ${eur(d1.redevanceNette)} − ${eur(d1.economiePerdue)} = ${eur(d1.flux)}` },
          { libelle: "Flux de la dernière année", attendu: fin.flux, calcul: `${eur(d1.flux)} − ${eur(n.cb.option)} d'option = ${eur(fin.flux)}` },
          {
            libelle: "Flux de l'année qui suit le contrat",
            attendu: apres.flux,
            calcul: `${eur(n.cb.option)} × ${pct(n.t)} = ${eur(apres.economieSurLOption)} d'impôt économisé ; le banc acheté serait déjà amorti, il n'y a plus rien de perdu`,
          },
        ];
      },
      explication: () => {
        const n = bancEnCreditBail();
        return [`Le banc s'amortit sur ${BANC.dureeDAmortissement} ans, la durée du contrat : l'économie perdue s'arrête avec lui. L'option rachète un banc déjà amorti, et son amortissement rend un peu d'impôt l'année suivante, ${eur(n.d[n.cb.dureeAns + 1]!.flux)}.`];
      },
    },
    {
      id: "la-comparaison",
      type: "montants",
      titre: "La comparaison",
      notions: ["discounting", "irr_payback"],
      question: () => {
        const n = bancEnCreditBail();
        return `Calculez le coût de l'emprunt après impôt, en pour cent, puis la valeur actuelle des décaissements du crédit-bail à ce taux, et la VAN du crédit-bail : le prix évité, ${eur(n.cb.valeur)}, moins cette valeur actuelle.`;
      },
      champs: () => {
        const n = bancEnCreditBail();
        const termes = n.x.creditBail.flux.slice(1).map((f, i) => `${f < 0 ? eur(-f) : `(${eur(-f)})`} × ${(1 + n.r).toLocaleString("fr-FR", { maximumFractionDigits: 4 })}^−${i + 1}`);
        return [
          { libelle: "Coût de l'emprunt après impôt, en %", attendu: arrondi2(n.r * 100), calcul: `${pct(EMPRUNT_DU_BANC.taux)} × (1 − ${pct(n.t)}) = ${pct(n.r)}`, tolerance: 0.01 },
          { libelle: "Valeur actuelle des décaissements", attendu: n.decaissements, calcul: `${termes.join(" + ")} = ${eur(n.decaissements)}` },
          { libelle: "VAN du crédit-bail", attendu: n.x.vanDuCreditBail, calcul: `${eur(n.cb.valeur)} − ${eur(n.decaissements)} = ${eur(n.x.vanDuCreditBail)}` },
        ];
      },
      explication: () => {
        const n = bancEnCreditBail();
        return [`La VAN est positive : au coût de l'emprunt, le crédit-bail coûte ${eur(n.x.vanDuCreditBail)} de moins. Son taux actuariel après impôt, ${pct(n.x.tauxDuCreditBail)}, passe sous les ${pct(n.r)} de l'emprunt.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["irr_payback"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: () => {
        const n = bancEnCreditBail();
        return [
          {
            texte: `Le crédit-bail, de peu : ${eur(n.x.vanDuCreditBail)}`,
            juste: true,
            retour: `Oui. Le contrat ne fait perdre l'amortissement que pendant sa durée, et son option rachète un banc qui rend encore de l'impôt : il coûte ${pct(n.x.tauxDuCreditBail)} après impôt, contre ${pct(n.r)}. L'écart est mince ; une clause de plus, un dépôt de garantie, suffirait à le renverser.`,
          },
          {
            texte: "L'emprunt, comme pour la ligne : le crédit-bail coûte toujours plus",
            juste: false,
            retour: `Non : la réponse dépend du contrat. Pour la ligne, amortie sur ${LIGNE_A_FINANCER.dureeDAmortissement} ans pour un contrat de ${CREDIT_BAIL_DE_LA_LIGNE.dureeAns}, NOVA perdait l'amortissement plus longtemps, et l'option était plus chère.`,
          },
          {
            texte: `L'emprunt : ${eur(n.cb.dureeAns * n.cb.redevance)} de redevances dépassent ${eur(BANC.montant)}`,
            juste: false,
            retour: "Comparer des redevances au prix, sans impôt ni actualisation, ne dit rien : un emprunt aussi coûte plus que son capital. Il faut comparer des flux après impôt, en valeur actuelle.",
          },
        ];
      },
    },
  ],
};
