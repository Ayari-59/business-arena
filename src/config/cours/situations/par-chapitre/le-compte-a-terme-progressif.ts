import { eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_VALEUR } from "../../chapitres/la-valeur-et-le-temps";
import { INFLATION_PREVUE, compteProgressif } from "../../monde/valeur-et-temps";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR ET LE TEMPS » : LE COMPTE À TERME PROGRESSIF (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la banque de NOVA et son compte à terme
 * ordinaire à 3 %, et le compte progressif de monde/valeur-et-temps.ts (`compteProgressif`).
 *
 * HYPOTHÈSES DU CAS (monde/valeur-et-temps.ts, COMPTE_PROGRESSIF) : 50 000 € dont NOVA n'aura pas
 * besoin avant deux ans ; la banque propose 2 % la première année puis 4,2 % la seconde, intérêts
 * capitalisés, ou 3 % les deux ans ; l'inflation prévue est de 2 %. La moyenne des deux taux
 * (3,1 %) trompe : le taux actuariel du progressif est un peu plus bas. L'élève refait seul le
 * chemin du chapitre : valeur acquise, taux actuariel, taux réel, puis une réponse.
 */

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const nb = (x: number) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: 6 });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres du cas, calculés une fois de la fiche. */
export function compteDuCas(_c?: Pick<Cas, "code">) {
  return compteProgressif();
}

export const LE_COMPTE_A_TERME_PROGRESSIF: Situation = {
  code: "le-compte-a-terme-progressif",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["la-valeur-et-le-temps"],
  commanditaire: "Le dirigeant",
  titre: "Le compte à terme progressif",
  accroche: "La banque propose un taux qui monte d'une année sur l'autre. Sa moyenne dépasse le taux fixe. Le placement rapporte-t-il vraiment plus ?",
  objectifs: [
    "Calculer la valeur acquise d'un placement à taux variables, intérêts capitalisés",
    "En tirer le taux actuariel annuel et le taux réel",
    "Rendre une réponse chiffrée, et dire pourquoi la moyenne des taux trompe",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "ce cas reprend le chapitre « La valeur et le temps », qui se joue sur la réserve de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: () => {
        const k = compteDuCas();
        return [
          `« J'ai ${eur(k.capital)} dont nous n'aurons pas besoin avant ${k.n} ans. La banque propose un compte progressif : ${pct(k.taux[0]!)} la première année, ${pct(k.taux[1]!)} la seconde. Sa moyenne fait ${pct(k.moyenne)}, plus que les ${pct(k.tauxFixe)} du compte ordinaire. Je signe ? »`,
          "Pas de cours cette fois : vous avez les deux offres, et la méthode du chapitre.",
        ];
      },
      tableau: () => {
        const k = compteDuCas();
        return {
          titre: `${eur(k.capital)} placés ${k.n} ans, intérêts capitalisés`,
          colonnes: ["Taux"],
          lignes: [
            { libelle: "Compte progressif, année 1", valeurs: [pct(k.taux[0]!)] },
            { libelle: "Compte progressif, année 2", valeurs: [pct(k.taux[1]!)] },
            { libelle: "Compte ordinaire, chaque année", valeurs: [pct(k.tauxFixe)] },
            { libelle: "Inflation prévue", valeurs: [`${pct(INFLATION_PREVUE)} par an`] },
          ],
        };
      },
      repere: () => "À rendre : la valeur acquise de chaque compte, le taux actuariel du progressif, son taux réel, et votre réponse.",
    },
    {
      id: "les-valeurs-acquises",
      type: "montants",
      titre: "Les valeurs acquises",
      notions: ["discounting"],
      question: (c) => {
        const k = compteDuCas(c);
        return `Calculez ce que vaut le compte progressif au bout d'un an, puis au bout de ${k.n} ans ; puis ce que vaut le compte ordinaire au bout de ${k.n} ans.`;
      },
      champs: (c) => {
        const k = compteDuCas(c);
        return [
          { libelle: "Compte progressif, au bout d'un an", attendu: k.apresUnAn, calcul: `${eur(k.capital)} × ${nb(1 + k.taux[0]!)} = ${eur(k.apresUnAn)}` },
          { libelle: `Compte progressif, au bout de ${k.n} ans`, attendu: k.acquisProgressif, calcul: `${eur(k.apresUnAn)} × ${nb(1 + k.taux[1]!)} = ${eur(k.acquisProgressif)}` },
          { libelle: `Compte ordinaire, au bout de ${k.n} ans`, attendu: k.acquisFixe, calcul: `${eur(k.capital)} × ${nb(1 + k.tauxFixe)}^${k.n} = ${eur(k.acquisFixe)}` },
        ];
      },
      explication: (c) => {
        const k = compteDuCas(c);
        return [`Le progressif rapporte ${eur(k.ecart)} de plus en ${k.n} ans. La seconde année, son taux s'applique à un capital déjà grossi de la première : c'est la capitalisation.`];
      },
    },
    {
      id: "les-taux",
      type: "montants",
      titre: "Le taux actuariel et le taux réel",
      notions: ["discounting", "irr_payback"],
      question: (c) => {
        const k = compteDuCas(c);
        return `Le taux actuariel du progressif est le taux fixe qui donnerait la même valeur acquise : (valeur acquise ÷ capital)^(1 ÷ ${k.n}) − 1. Calculez-le en pour cent au centième, puis son taux réel avec ${pct(INFLATION_PREVUE)} d'inflation.`;
      },
      champs: (c) => {
        const k = compteDuCas(c);
        return [
          { libelle: "Taux actuariel du progressif, en %", attendu: auCentime(k.tauxActuariel * 100), calcul: `(${eur(k.acquisProgressif)} ÷ ${eur(k.capital)})^(1 ÷ ${k.n}) − 1 = ${pct(k.tauxActuariel)}`, tolerance: 0.01 },
          { libelle: "Taux réel du progressif, en %", attendu: auCentime(k.reelProgressif * 100), calcul: `${nb(1 + Math.round(k.tauxActuariel * 10_000) / 10_000)} ÷ ${nb(1 + INFLATION_PREVUE)} − 1 = ${pct(k.reelProgressif)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = compteDuCas(c);
        return [
          `Le progressif rapporte ${pct(k.tauxActuariel)} l'an, et non ${pct(k.moyenne)} : la moyenne des taux surestime toujours un peu le taux actuariel. Il bat quand même les ${pct(k.tauxFixe)} du compte ordinaire.`,
          `En pouvoir d'achat, il rapporte ${pct(k.reelProgressif)} par an, contre ${pct(k.reelFixe)} pour le compte ordinaire.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["discounting"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: () => {
        const k = compteDuCas();
        return [
          {
            texte: `Le progressif, de peu : ${pct(k.tauxActuariel)} l'an`,
            juste: true,
            retour: `Oui. Il rapporte ${eur(k.ecart)} de plus en ${k.n} ans. Mais son avantage tient à la seconde année : si NOVA devait sortir au bout d'un an, elle n'aurait eu que ${pct(k.taux[0]!)}. À vérifier avant de signer.`,
          },
          {
            texte: `Indifférent : sur ${k.n} ans, les deux comptes rendent la même somme`,
            juste: false,
            retour: `Non : le progressif rend ${eur(k.acquisProgressif)}, le compte ordinaire ${eur(k.acquisFixe)}. Et sa moyenne, ${pct(k.moyenne)}, n'est pas son taux : son taux actuariel est de ${pct(k.tauxActuariel)}.`,
          },
          {
            texte: `Le compte ordinaire : le progressif ne rapporte que ${pct(k.taux[0]!)} la première année`,
            juste: false,
            retour: `Un placement se juge sur toute sa durée : sur ${k.n} ans, le progressif rapporte ${eur(k.ecart)} de plus.`,
          },
        ];
      },
    },
  ],
};
