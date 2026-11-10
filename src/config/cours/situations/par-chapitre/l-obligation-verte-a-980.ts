import { arrondi2, eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_VALEUR } from "../../chapitres/la-valeur-et-le-temps";
import { EMETTEUR, NOTATION_DE_L_EMETTEUR, PLACEMENT_SANS_RISQUE, coursDeLObligation, obligationDuCas } from "../../monde/marche-financier";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE MARCHÉ FINANCIER » : L'OBLIGATION VERTE À 980 € (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'obligation verte du fournisseur coté de
 * NOVA, et le calcul de monde/marche-financier.ts (`obligationDuCas`).
 *
 * HYPOTHÈSES DU CAS (monde/marche-financier.ts, OBLIGATION_DU_CAS) : au 1er janvier N+3, il reste 3
 * ans à l'obligation (1 000 € de nominal, coupon de 4 %) ; elle se négocie 980 €. Une associée de
 * NOVA hésite à en acheter dix, ou à garder son argent sur un compte à terme à 3 %. Elle veut un
 * revenu sûr et peut attendre l'échéance : le risque de taux ne la touche pas, le risque de crédit
 * reste. L'élève refait seul le chemin du chapitre : coupon, rendement actuariel, puis une réponse.
 */

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

/** Les chiffres du cas, calculés une fois de la fiche, et l'encadrement du rendement. */
export function obligationAAcheter(_c?: Pick<Cas, "code">) {
  const x = obligationDuCas();
  const bas = Math.floor(x.rendement * 1000) / 1000;
  const haut = bas + 0.001;
  // Chaque cours au centime, comme sur la copie : l'interpolation part d'eux (deux-decimales.ts).
  const coursA = (t: number) => arrondi2(coursDeLObligation(x.obligation, t));
  const interpole = bas + ((haut - bas) * (coursA(bas) - x.cours)) / (coursA(bas) - coursA(haut));
  return { ...x, bas, haut, coursA, interpole };
}

export const L_OBLIGATION_VERTE_A_980: Situation = {
  code: "l-obligation-verte-a-980",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-marche-financier"],
  commanditaire: "Une associée",
  titre: "L'obligation verte à 980 €",
  accroche: "Une associée de NOVA hésite entre l'obligation verte du fournisseur, sous le pair, et un compte à terme. Que rapporte vraiment l'obligation, et à quel risque ?",
  objectifs: [
    "Calculer le coupon et le taux de rendement actuariel d'une obligation achetée sous le pair",
    "Distinguer le risque de taux et le risque de crédit d'une obligation",
    "Rendre une réponse chiffrée à un investisseur",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "ce cas reprend le chapitre « Le marché financier », qui se lit par le fournisseur coté de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'associée",
      texte: () => {
        const x = obligationAAcheter();
        return [
          `« J'ai ${eur(x.mise)} à placer. L'obligation verte d'${EMETTEUR} se négocie ${eur(x.cours)}, sous son nominal. Il lui reste ${x.obligation.dureeRestante} ans. Ma banque m'offre ${pct(PLACEMENT_SANS_RISQUE)} sur un compte à terme. Je veux un revenu sûr, et je n'aurai pas besoin de cet argent avant l'échéance. Qu'en pensez-vous ? »`,
          "Pas de cours cette fois : vous avez le titre, son cours, et la méthode du chapitre.",
        ];
      },
      tableau: () => {
        const x = obligationAAcheter();
        return {
          titre: `L'obligation verte d'${EMETTEUR}`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Nominal", valeurs: [eur(x.obligation.nominal)] },
            { libelle: "Taux nominal", valeurs: [pct(x.obligation.tauxNominal)] },
            { libelle: "Remboursement", valeurs: [`au pair, in fine, dans ${x.obligation.dureeRestante} ans`] },
            { libelle: "Cours", valeurs: [eur(x.cours)] },
            { libelle: "Note de l'émetteur", valeurs: [NOTATION_DE_L_EMETTEUR] },
          ],
        };
      },
      repere: () => "À rendre : le coupon, le rendement actuariel d'un achat à ce cours, les risques qui restent, et votre réponse.",
    },
    {
      id: "le-rendement",
      type: "montants",
      titre: "Ce que rapporte l'obligation",
      notions: ["irr_payback", "discounting"],
      question: () => {
        const x = obligationAAcheter();
        return `Calculez le coupon d'une obligation, ce que les ${x.quantite} obligations rapportent jusqu'à l'échéance (coupons et gain au remboursement). Puis calculez le taux de rendement actuariel d'un achat à ${eur(x.cours)} : il est entre ${pct(x.bas)} et ${pct(x.haut)}, en pour cent au centième.`;
      },
      champs: () => {
        const x = obligationAAcheter();
        const a = x.coursA(x.bas);
        const b = x.coursA(x.haut);
        return [
          { libelle: "Coupon d'une obligation", attendu: x.coupon, calcul: `${eur(x.obligation.nominal)} × ${pct(x.obligation.tauxNominal)} = ${eur(x.coupon)}` },
          { libelle: `Gain des ${x.quantite} obligations jusqu'à l'échéance`, attendu: x.gain, calcul: `${x.quantite} × (${x.obligation.dureeRestante} × ${eur(x.coupon)} + ${eur(x.plusValueParTitre)}) = ${eur(x.gain)}` },
          {
            libelle: "Taux de rendement actuariel, en %",
            attendu: arrondi2(x.interpole * 100),
            calcul: `à ${pct(x.bas)} les flux valent ${eur(a)}, à ${pct(x.haut)} ${eur(b)} ; ${pct(x.bas)} + 0,1 point × (${eur(a)} − ${eur(x.cours)}) ÷ (${eur(a)} − ${eur(b)}) = ${pct(x.interpole)}`,
          },
        ];
      },
      explication: () => {
        const x = obligationAAcheter();
        return [`Le coupon rapporte ${pct(x.courant)} du prix payé ; le gain au remboursement ajoute le reste. Gardée jusqu'à l'échéance, l'obligation rapporte ${pct(x.rendement)} par an, contre ${pct(PLACEMENT_SANS_RISQUE)} pour le compte à terme.`];
      },
    },
    {
      id: "les-risques",
      type: "choix",
      titre: "Les risques qui restent",
      notions: ["discounting"],
      question: () => "L'associée gardera ses obligations jusqu'au remboursement. Quel risque porte-t-elle encore ?",
      options: () => [
        {
          texte: "Celui que l'émetteur ne paie pas",
          juste: true,
          retour: `Oui. Gardée jusqu'à l'échéance, l'obligation rapporte son taux actuariel quels que soient les taux du marché : le risque de taux ne la touche pas. Reste le risque de crédit, que la note ${NOTATION_DE_L_EMETTEUR} dit modéré. L'écart de rendement avec le compte à terme le rémunère.`,
        },
        { texte: "Celui d'une hausse des taux, qui ferait baisser le cours", juste: false, retour: "Une hausse des taux ferait baisser le cours ; mais elle ne revend pas avant l'échéance, où elle sera remboursée au pair. Ce risque ne la touche que si elle doit vendre." },
        { texte: "Aucun : une obligation verte est garantie par l'État", juste: false, retour: "Aucune garantie de l'État ici : le label vert dit l'usage des fonds, pas la solidité de l'émetteur. Le risque de crédit reste." },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associée",
      notions: ["irr_payback"],
      question: () => "Quelle réponse rendez-vous à l'associée ?",
      options: () => {
        const x = obligationAAcheter();
        return [
          {
            texte: `L'obligation : ${pct(x.rendement)} par an, pour un risque de crédit modéré`,
            juste: true,
            retour: `Oui. Elle rapporte ${eur(x.gain)} en ${x.obligation.dureeRestante} ans, contre ${eur(arrondi2(x.mise * ((1 + PLACEMENT_SANS_RISQUE) ** x.obligation.dureeRestante - 1)))} d'intérêts au compte à terme. L'écart paie le risque que l'émetteur ne rembourse pas : à elle de dire s'il le vaut.`,
          },
          {
            texte: `Le compte à terme : l'obligation ne rapporte que ${pct(x.obligation.tauxNominal)}, à peine plus que lui, avec un risque en plus`,
            juste: false,
            retour: `Le taux nominal ne dit que le coupon. Achetée ${eur(x.cours)}, l'obligation rapporte ${pct(x.rendement)} par an jusqu'à l'échéance.`,
          },
          {
            texte: "L'obligation, sans risque : elle sera remboursée au pair, quoi qu'il arrive aux taux",
            juste: false,
            retour: "Les taux ne la toucheront pas si elle attend l'échéance ; mais le remboursement dépend de la solidité de l'émetteur. Le risque de crédit reste.",
          },
        ];
      },
    },
  ],
};
