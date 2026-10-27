import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import {
  AVEC_LA_PUBLICITE,
  anneeAvecLaPublicite,
  anneeDuChoix,
  type AnneeDuChoix,
} from "../../chapitres/decider-avec-des-chiffres";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER AVEC DES CHIFFRES » : DOUBLER LA PUBLICITÉ ?
 * (seconde, management et gestion, palier 1).
 *
 * Le responsable commercial est sûr de lui : en doublant la publicité, l'entreprise vendrait
 * beaucoup plus. L'élève refait seul les trois temps du chapitre : il prévoit ce que coûte le
 * budget en plus et les ventes qu'il doit faire gagner pour se payer, constate ce que l'arène
 * joue avec le budget doublé, puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre comparait « avec » et « sans » publicité ; ici,
 * on compare le budget d'aujourd'hui et le double, et c'est le budget EN PLUS qui doit se payer.
 * Les chiffres sont l'année du cours rejouée avec le budget doublé dès le premier trimestre, que
 * le formulaire reconduit ensuite (`anneeAvecLaPublicite`), face à l'année jouée avec le budget
 * actuel.
 */

/** Le budget proposé, en multiple du budget de publicité de chaque trimestre : le double. */
export const BUDGET_DOUBLE = 2;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ventesEcrites = (n: number) => (Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "doubler" | "garder";

/** Le budget actuel, le budget doublé, et ce que l'arène joue avec chacun. */
export function publiciteDoublee(c: Cas) {
  const actuel = anneeDuChoix(anneeAvecLaPublicite(c.code, AVEC_LA_PUBLICITE));
  const double = anneeDuChoix(anneeAvecLaPublicite(c.code, BUDGET_DOUBLE));
  const budgetEnPlus = double.publicite - actuel.publicite;
  const margeParVente = auCentime(actuel.marge / actuel.ventes);
  const ventesAGagner = Math.ceil(budgetEnPlus / margeParVente - 1e-9);
  const ventesGagnees = double.ventes - actuel.ventes;
  const margeGagnee = double.marge - actuel.marge;
  const ecartDeResultat = double.resultat - actuel.resultat;
  const verdict: Verdict = ecartDeResultat > 0 ? "doubler" : "garder";
  return {
    actuel,
    double,
    budgetEnPlus,
    margeParVente,
    ventesAGagner,
    ventesGagnees,
    margeGagnee,
    ecartDeResultat,
    verdict,
    previsionJuste: (ventesGagnees >= ventesAGagner) === (ecartDeResultat > 0),
  };
}

function tableauDeLAnneeActuelle(c: Cas): TableauDeDonnees {
  const k = publiciteDoublee(c);
  return {
    titre: `L'année ${dE(c.entreprise)}, avec le budget de publicité actuel`,
    colonnes: ["Sur l'année"],
    lignes: [
      { libelle: "Publicité", valeurs: [eur(k.actuel.publicite)] },
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.actuel.ventes)] },
      { libelle: "Marge sur les ventes", valeurs: [eur(k.actuel.marge)] },
      { libelle: "Résultat de l'activité", valeurs: [eur(k.actuel.resultat)] },
    ],
  };
}

function tableauDesDeuxBudgets(c: Cas): TableauDeDonnees {
  const k = publiciteDoublee(c);
  const ligne = (libelle: string, f: (a: AnneeDuChoix) => string) => ({ libelle, valeurs: [f(k.actuel), f(k.double)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec chaque budget`,
    colonnes: ["Budget actuel", "Budget doublé"],
    lignes: [
      ligne("Publicité", (a) => eur(a.publicite)),
      ligne(`Ventes (${c.unites})`, (a) => qte(a.ventes)),
      ligne("Marge sur les ventes", (a) => eur(a.marge)),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

export const DOUBLER_LA_PUBLICITE: Situation = {
  code: "doubler-la-publicite",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["decider-avec-des-chiffres"],
  commanditaire: "Le responsable commercial",
  titre: "Doubler la publicité ?",
  accroche:
    "Le responsable commercial veut doubler le budget de publicité : on vendrait beaucoup plus, dit-il. Prévoir ce que le budget en plus doit rapporter, constater ce que l'arène en fait, puis lui répondre.",
  objectifs: [
    "Chiffrer ce que coûte une dépense en plus",
    "Calculer les ventes qu'elle doit faire gagner pour se payer",
    "Comparer la prévision à ce que l'arène a joué",
    "Répondre au responsable commercial, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du responsable commercial",
      tableau: tableauDeLAnneeActuelle,
      texte: (c) => {
        const k = publiciteDoublee(c);
        return [
          `« Cette année, nous avons dépensé ${eur(k.actuel.publicite)} en publicité. Si nous mettons le double, nous vendrons beaucoup plus, j'en suis sûr. Dites-moi ce que le budget en plus doit faire gagner pour se payer, ce qu'il a vraiment donné, et si je dois le demander à la direction. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec le budget doublé, les mêmes concurrents et la même façon de gérer.",
        ];
      },
      repere: () => "À rendre : les ventes que le budget en plus doit faire gagner, ce qu'il a donné dans l'arène, et votre réponse.",
    },
    {
      id: "prevoir",
      type: "montants",
      titre: "Prévoir : ce que le budget en plus doit rapporter",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      question: () =>
        "Calculez le budget de publicité en plus (le double, moins le budget actuel), la marge d'une vente (marge sur les ventes ÷ ventes, au centime), puis les ventes que le budget en plus doit faire gagner pour se payer (arrondi à l'unité supérieure).",
      champs: (c) => {
        const k = publiciteDoublee(c);
        return [
          {
            libelle: "Budget de publicité en plus",
            attendu: k.budgetEnPlus,
            calcul: `${eur(k.double.publicite)} − ${eur(k.actuel.publicite)} = ${eur(k.budgetEnPlus)}`,
            tolerance: 1,
          },
          {
            libelle: "Marge d'une vente",
            attendu: k.margeParVente,
            calcul: `${eur(k.actuel.marge)} ÷ ${qte(k.actuel.ventes)} = ${eur(k.margeParVente)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Ventes que le budget en plus doit faire gagner",
            attendu: k.ventesAGagner,
            calcul: `${eur(k.budgetEnPlus)} ÷ ${eur(k.margeParVente)} = ${qte(k.ventesAGagner)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = publiciteDoublee(c);
        return [`Pour se payer, le budget en plus doit faire gagner au moins ${qte(k.ventesAGagner)} ventes dans l'année ${dE(c.entreprise)}.`];
      },
    },
    {
      id: "constater",
      type: "montants",
      titre: "Constater : l'arène rejoue l'année",
      notions: ["contribution_margin", "income_statement"],
      tableau: tableauDesDeuxBudgets,
      question: () =>
        "L'arène a rejoué l'année avec le budget doublé. Calculez les ventes gagnées avec le budget doublé, puis l'écart de résultat de l'activité (budget doublé moins budget actuel).",
      champs: (c) => {
        const k = publiciteDoublee(c);
        return [
          {
            libelle: "Ventes gagnées avec le budget doublé",
            attendu: k.ventesGagnees,
            calcul: `${qte(k.double.ventes)} − ${qte(k.actuel.ventes)} = ${qte(k.ventesGagnees)}`,
            tolerance: 0,
          },
          {
            libelle: "Écart de résultat de l'activité, budget doublé moins budget actuel",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.double.resultat)} − ${retranche(k.actuel.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = publiciteDoublee(c);
        const prevision = k.previsionJuste
          ? "La prévision avait vu juste."
          : k.ventesGagnees < k.ventesAGagner
            ? `La prévision disait le contraire : les ventes gagnées ont laissé plus de marge que les ${eur(k.margeParVente)} d'une vente moyenne.`
            : `La prévision disait le contraire : les ventes gagnées ont laissé moins de marge que les ${eur(k.margeParVente)} d'une vente moyenne.`;
        return [
          `Il fallait ${qte(k.ventesAGagner)} ventes de plus pour payer le budget en plus ; ${k.ventesGagnees > 0 ? `le budget doublé en a fait gagner ${qte(k.ventesGagnees)}, et ${eur(k.margeGagnee)} de marge` : "le budget doublé n'en a fait gagner aucune"}, pour ${eur(k.budgetEnPlus)} de dépense en plus. ${prevision}`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable commercial",
      notions: ["contribution_margin"],
      question: () => "Quelle phrase envoyez-vous au responsable commercial ?",
      options: (c) => {
        const k = publiciteDoublee(c);
        const chiffres = `Le budget doublé ${k.ventesGagnees > 0 ? `a fait gagner ${ventesEcrites(k.ventesGagnees)} et ${eur(k.margeGagnee)} de marge` : "n'a fait gagner aucune vente"}, pour ${eur(k.budgetEnPlus)} de dépense en plus : le résultat de l'activité ${k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`}.`;
        const doubler = k.verdict === "doubler";
        return [
          {
            texte: "Doublez-la : le budget en plus rapporte plus qu'il ne coûte",
            juste: doubler,
            retour: doubler ? `Oui. ${chiffres}` : `Non. ${chiffres}`,
          },
          {
            texte: "Gardez le budget actuel : le budget en plus coûte plus qu'il ne rapporte",
            juste: !doubler,
            retour: !doubler
              ? `Oui. ${chiffres} ${k.ventesGagnees > 0 ? "Vendre un peu plus ne suffit pas : il faut que la marge gagnée paie la dépense." : "La publicité en plus n'a rien fait vendre : c'est une dépense sans contrepartie."}`
              : `Non. ${chiffres}`,
          },
          {
            texte: "Doublez-la : plus de ventes, c'est forcément plus de résultat à la fin de l'année",
            juste: false,
            retour: `Non : une vente de plus ne laisse que sa marge, et la publicité en plus se paie. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
