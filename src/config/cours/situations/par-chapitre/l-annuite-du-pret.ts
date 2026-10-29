import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { financer } from "../../chapitres/financer-l-entreprise";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FINANCER L'ENTREPRISE » : L'ANNUITÉ DU PRÊT
 * (Bac STMG, gestion et finance, palier 1).
 *
 * Les associés envisagent d'emprunter le prix du nouvel équipement, remboursé en parts
 * égales sur quelques années. Avant de signer, ils veulent savoir ce que le prêt coûtera
 * chaque année, et si ce que l'activité dégage suffit à payer la
 * première échéance. L'élève refait seul les calculs du chapitre (les intérêts d'une
 * année, la capacité d'autofinancement) et les prolonge sur la durée du prêt.
 *
 * Le cas est neuf par sa question : le chapitre chiffre les intérêts de la première année
 * pour choisir un financement ; le cas suit le prêt jusqu'au bout et le confronte à la
 * capacité d'autofinancement. L'équipement, son prix, le taux et la capacité
 * d'autofinancement sont ceux du chapitre (`financer`) : le premier exercice de NOVA, dans le monde
 * du cours.
 */

/**
 * La durée du prêt, en années : 5, la durée habituelle d'un prêt d'équipement pour une
 * petite entreprise, proche de la durée pendant laquelle l'équipement sert. Le capital se
 * rembourse en parts égales chaque année (l'amortissement constant), et les intérêts se
 * paient sur ce qui reste dû.
 */
export const DUREE_DU_PRET = 5;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function annuiteDuPret(c: Pick<Cas, "code">) {
  const f = financer(c);
  const taux = f.taux;
  const capital = auCentime(f.montant / DUREE_DU_PRET);
  const annuite = auCentime(capital + f.interets);
  return {
    ...f,
    capital,
    annuite,
    // Au début de la dernière année, il ne reste qu'une part de capital à rembourser.
    derniere: auCentime(capital * taux),
    resteDeLaCaf: auCentime(f.caf - annuite),
    couvre: f.caf >= annuite,
  };
}

export const L_ANNUITE_DU_PRET: Situation = {
  code: "l-annuite-du-pret",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["financer-l-entreprise"],
  commanditaire: "Les associés",
  titre: "L'annuité du prêt",
  accroche:
    "Les associés envisagent d'emprunter le prix du nouvel équipement. Avant de signer, ils veulent savoir ce que le prêt coûtera chaque année, et si l'activité dégage de quoi le rembourser.",
  objectifs: [
    "Calculer le capital remboursé chaque année et les intérêts d'un prêt à amortissement constant",
    "Calculer la première annuité et le coût total des intérêts",
    "Calculer la capacité d'autofinancement et la comparer à l'annuité",
    "Rédiger une réponse chiffrée aux associés",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend la deuxième ligne de NOVA et le premier exercice de la simulation du cours, ceux du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des associés",
      texte: (c) => {
        const r = annuiteDuPret(c);
        return [
          `« Pour le nouvel équipement, « ${r.equipement} », la banque nous propose de prêter les ${eur(r.montant)} au taux de ${pct(r.tauxDeLEmprunt)} par an, sur ${qte(DUREE_DU_PRET)} ans, le capital remboursé en parts égales chaque année. Avant de signer, nous voulons savoir ce que nous paierons la première année et la dernière, et si ce que dégage l'activité ${dE(r.entreprise)} suffit à payer cette première année. »`,
          "Pas de cours cette fois : vous avez les chiffres de l'année et les conditions du prêt, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = annuiteDuPret(c);
        return {
          titre: `Le prêt et l'année · ${r.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prix de l'équipement, hors taxes (${r.equipement})`, valeurs: [eur(r.montant)] },
            { libelle: "Taux du prêt, par an", valeurs: [pct(r.tauxDeLEmprunt)] },
            { libelle: "Durée du prêt (années)", valeurs: [qte(DUREE_DU_PRET)] },
            { libelle: "Résultat net de l'année", valeurs: [eur(r.resultatNet)] },
            { libelle: "Dotations de l'année (usure de la ligne, dépréciation, provision)", valeurs: [eur(r.dotation)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le capital remboursé chaque année, les intérêts et la première annuité, les intérêts de la dernière année, la capacité d'autofinancement et ce qu'il en reste, et votre réponse.",
    },
    {
      id: "la-premiere-annuite",
      type: "montants",
      titre: "La première annuité",
      notions: ["loan_schedule"],
      question: () =>
        "Chaque année, l'entreprise rembourse une part égale du capital, et paie les intérêts sur ce qu'elle doit encore. Calculez le capital remboursé chaque année, les intérêts de la première année, puis la première annuité (capital et intérêts).",
      champs: (c) => {
        const r = annuiteDuPret(c);
        return [
          { libelle: "Capital remboursé chaque année", attendu: r.capital, calcul: `${eur(r.montant)} ÷ ${qte(DUREE_DU_PRET)} = ${eur(r.capital)}` },
          { libelle: "Intérêts de la première année", attendu: r.interets, calcul: `${eur(r.montant)} × ${pct(r.tauxDeLEmprunt)} = ${eur(r.interets)}` },
          { libelle: "Première annuité", attendu: r.annuite, calcul: `${eur(r.capital)} + ${eur(r.interets)} = ${eur(r.annuite)}` },
        ];
      },
      explication: (c) => {
        const r = annuiteDuPret(c);
        return [
          `La première année, ${r.entreprise} paierait ${eur(r.annuite)} à la banque : les intérêts sont une charge, le capital remboursé n'en est pas une, mais il sort de la banque tout autant.`,
        ];
      },
    },
    {
      id: "sur-la-duree",
      type: "montants",
      titre: "Le prêt jusqu'au bout",
      notions: ["loan_schedule"],
      question: () =>
        "Au début de la dernière année, il ne reste qu'une part de capital à rembourser. Calculez les intérêts de la dernière année.",
      champs: (c) => {
        const r = annuiteDuPret(c);
        return [
          { libelle: "Intérêts de la dernière année", attendu: r.derniere, calcul: `${eur(r.capital)} × ${pct(r.tauxDeLEmprunt)} = ${eur(r.derniere)}` },
        ];
      },
      explication: (c) => {
        const r = annuiteDuPret(c);
        return [
          `Les intérêts baissent chaque année, de ${eur(r.interets)} à ${eur(r.derniere)}, parce que le capital dû baisse. Les intérêts sont le prix de ne pas payer l'équipement comptant.`,
        ];
      },
    },
    {
      id: "face-a-la-caf",
      type: "montants",
      titre: "Ce que l'activité dégage",
      notions: ["frng", "income_statement"],
      question: () =>
        "Calculez la capacité d'autofinancement de l'année (résultat net plus dotations), puis ce qu'il en resterait une fois payée la première annuité. Un résultat négatif dit qu'elle ne suffit pas.",
      champs: (c) => {
        const r = annuiteDuPret(c);
        return [
          { libelle: "Capacité d'autofinancement", attendu: r.caf, calcul: `${eur(r.resultatNet)} + ${eur(r.dotation)} = ${eur(r.caf)}`, tolerance: 1 },
          { libelle: "Reste après la première annuité", attendu: r.resteDeLaCaf, calcul: `${eur(r.caf)} − ${eur(r.annuite)} = ${eur(r.resteDeLaCaf)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = annuiteDuPret(c);
        return [
          r.couvre
            ? `Ce que l'activité ${dE(r.entreprise)} a dégagé cette année paie la première annuité, et il en reste ${eur(r.resteDeLaCaf)}.`
            : r.caf > 0
              ? `Ce que l'activité ${dE(r.entreprise)} a dégagé cette année ne paie pas la première annuité : il manque ${eur(-r.resteDeLaCaf)}, à prendre sur la trésorerie.`
              : `L'activité ${dE(r.entreprise)} n'a rien dégagé cette année : toute l'annuité, ${eur(r.annuite)}, serait à prendre sur la trésorerie.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse aux associés",
      question: () => "Quelle phrase envoyez-vous aux associés ?",
      options: (c) => {
        const r = annuiteDuPret(c);
        return [
          {
            texte: r.couvre
              ? `La première annuité, ${eur(r.annuite)}, tient dans notre capacité d'autofinancement`
              : `La première annuité, ${eur(r.annuite)}, dépasse notre capacité d'autofinancement`,
            juste: true,
            retour: `Oui : ${eur(r.capital)} de capital et ${eur(r.interets)} d'intérêts font ${eur(r.annuite)}, face à ${eur(r.caf)} de capacité d'autofinancement. ${r.couvre ? `Il en resterait ${eur(r.resteDeLaCaf)}.` : `Il manquerait ${eur(-r.resteDeLaCaf)}.`}`,
          },
          {
            texte: `La première annuité serait de ${eur(r.interets)} : nous ne paierions que les intérêts la première année`,
            juste: false,
            retour: `Non : le capital se rembourse dès la première année, ${eur(r.capital)}, en plus des intérêts. L'annuité est de ${eur(r.annuite)}.`,
          },
          {
            texte: `La première annuité serait de ${eur(r.capital)} : le prix de l'équipement divisé par la durée du prêt`,
            juste: false,
            retour: `Non : c'est le capital remboursé chaque année. La banque se paie aussi par les intérêts, ${eur(r.interets)} la première année : l'annuité est de ${eur(r.annuite)}.`,
          },
          {
            texte: "Aucune annuité à prévoir : l'amortissement de l'équipement remboursera le prêt",
            juste: false,
            retour: `Non : l'amortissement est l'usure de l'équipement, une charge qui ne fait sortir aucun argent. Le prêt, lui, se rembourse en argent : ${eur(r.annuite)} la première année.`,
          },
        ];
      },
    },
  ],
};
