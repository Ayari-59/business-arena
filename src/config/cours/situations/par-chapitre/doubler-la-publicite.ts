import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { AVEC_LA_PUBLICITE, ENTREPRISES_DU_CHOIX, POURQUOI_DECIDER, anneeAvecUnFacteur, type AnneeDuChoix } from "../../chapitres/decider-avec-des-chiffres";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER AVEC DES CHIFFRES » : DOUBLER LA PUBLICITÉ ?
 * (seconde, management et gestion, palier 1).
 *
 * Le responsable commercial est sûr de lui : en doublant la campagne que propose l'agence, NOVA
 * vendrait beaucoup plus. L'élève refait seul les trois temps du chapitre : il prévoit ce que coûte
 * le budget en plus et les ventes qu'il doit faire gagner pour se payer, constate ce que donne
 * l'année jouée avec le budget doublé, puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre comparait « avec » et « sans » publicité ; ici, on
 * compare la campagne proposée et le double, et c'est le budget EN PLUS qui doit se payer.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur le marché à trois : 4 000 € puis 8 000 €
 * de publicité par trimestre (monde/gestion-et-information.ts).
 */

/** Le budget proposé, en multiple de la campagne envisagée : le double. */
export const BUDGET_DOUBLE = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ventesEcrites = (n: number) => (Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "doubler" | "garder";

/** La campagne proposée, la campagne doublée, et ce que l'année donne avec chacune. */
export function publiciteDoublee() {
  const actuel = anneeAvecUnFacteur(AVEC_LA_PUBLICITE);
  const double = anneeAvecUnFacteur(BUDGET_DOUBLE);
  const budgetEnPlus = auCentime(double.publicite - actuel.publicite);
  const margeParVente = auCentime(actuel.marge / actuel.ventes);
  const ventesAGagner = Math.ceil(budgetEnPlus / margeParVente - 1e-9);
  const ventesGagnees = double.ventes - actuel.ventes;
  const margeGagnee = auCentime(double.marge - actuel.marge);
  const ecartDeResultat = auCentime(double.resultat - actuel.resultat);
  return {
    actuel,
    double,
    budgetEnPlus,
    margeParVente,
    ventesAGagner,
    ventesGagnees,
    margeGagnee,
    ecartDeResultat,
    verdict: (ecartDeResultat > 0 ? "doubler" : "garder") as Verdict,
    previsionJuste: (ventesGagnees >= ventesAGagner) === (ecartDeResultat > 0),
  };
}

function tableauDeLaCampagne(c: Cas): TableauDeDonnees {
  const k = publiciteDoublee();
  return {
    titre: `L'année ${dE(c.entreprise)}, avec la campagne proposée`,
    colonnes: ["Sur l'année"],
    lignes: [
      { libelle: "Publicité", valeurs: [eur(k.actuel.publicite)] },
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.actuel.ventes)] },
      { libelle: "Marge sur les ventes", valeurs: [eur(k.actuel.marge)] },
      { libelle: "Résultat de l'année", valeurs: [eur(k.actuel.resultat)] },
    ],
  };
}

function tableauDesDeuxBudgets(c: Cas): TableauDeDonnees {
  const k = publiciteDoublee();
  const ligne = (libelle: string, f: (a: AnneeDuChoix) => string) => ({ libelle, valeurs: [f(k.actuel), f(k.double)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, jouée avec chaque budget`,
    colonnes: ["Campagne proposée", "Budget doublé"],
    lignes: [
      ligne("Publicité", (a) => eur(a.publicite)),
      ligne(`Ventes (${c.unites})`, (a) => qte(a.ventes)),
      ligne("Marge sur les ventes", (a) => eur(a.marge)),
      ligne("Résultat de l'année", (a) => eur(a.resultat)),
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
    "Le responsable commercial veut doubler la campagne de publicité : on vendrait beaucoup plus, dit-il. Prévoir ce que le budget en plus doit rapporter, constater ce qu'il donne, puis lui répondre.",
  objectifs: [
    "Chiffrer ce que coûte une dépense en plus",
    "Calculer les ventes qu'elle doit faire gagner pour se payer",
    "Comparer la prévision à ce que l'année a donné",
    "Répondre au responsable commercial, chiffres à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_CHOIX, pourquoi: POURQUOI_DECIDER },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du responsable commercial",
      tableau: tableauDeLaCampagne,
      texte: () => {
        const k = publiciteDoublee();
        return [
          `« L'agence nous propose ${eur(k.actuel.publicite)} de publicité sur l'année. Si nous mettons le double, nous vendrons beaucoup plus, j'en suis sûr. Dites-moi ce que le budget en plus doit faire gagner pour se payer, ce qu'il donne vraiment, et si je dois le demander à la direction. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'année a été rejouée avec le budget doublé, face aux mêmes concurrents.",
        ];
      },
      repere: () => "À rendre : les ventes que le budget en plus doit faire gagner, ce qu'il a donné, et votre réponse.",
    },
    {
      id: "prevoir",
      type: "montants",
      titre: "Prévoir : ce que le budget en plus doit rapporter",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      question: () =>
        "Calculez le budget de publicité en plus (le double, moins la campagne proposée), la marge d'une vente (marge sur les ventes ÷ ventes, au centime), puis les ventes que le budget en plus doit faire gagner pour se payer (arrondi à l'unité supérieure).",
      champs: () => {
        const k = publiciteDoublee();
        return [
          { libelle: "Budget de publicité en plus", attendu: k.budgetEnPlus, calcul: `${eur(k.double.publicite)} − ${eur(k.actuel.publicite)} = ${eur(k.budgetEnPlus)}` },
          { libelle: "Marge d'une vente", attendu: k.margeParVente, calcul: `${eur(k.actuel.marge)} ÷ ${qte(k.actuel.ventes)} = ${eur(k.margeParVente)}`, tolerance: 0.01 },
          { libelle: "Ventes que le budget en plus doit faire gagner", attendu: k.ventesAGagner, calcul: `${eur(k.budgetEnPlus)} ÷ ${eur(k.margeParVente)} = ${qte(k.ventesAGagner)}, à l'unité supérieure` },
        ];
      },
      explication: (c) => [`Pour se payer, le budget en plus doit faire gagner au moins ${qte(publiciteDoublee().ventesAGagner)} ventes dans l'année ${dE(c.entreprise)}.`],
    },
    {
      id: "constater",
      type: "montants",
      titre: "Constater : l'année rejouée",
      notions: ["contribution_margin", "income_statement"],
      tableau: tableauDesDeuxBudgets,
      question: () => "Calculez les ventes gagnées avec le budget doublé, puis l'écart de résultat de l'année (budget doublé moins campagne proposée).",
      champs: () => {
        const k = publiciteDoublee();
        return [
          { libelle: "Ventes gagnées avec le budget doublé", attendu: k.ventesGagnees, calcul: `${qte(k.double.ventes)} − ${qte(k.actuel.ventes)} = ${qte(k.ventesGagnees)}` },
          { libelle: "Écart de résultat de l'année, budget doublé moins campagne proposée", attendu: k.ecartDeResultat, calcul: `${eur(k.double.resultat)} − ${eur(k.actuel.resultat)} = ${eur(k.ecartDeResultat)}` },
        ];
      },
      explication: () => {
        const k = publiciteDoublee();
        return [
          `Il fallait ${qte(k.ventesAGagner)} ventes de plus pour payer le budget en plus ; le budget doublé en a fait gagner ${qte(k.ventesGagnees)}, et ${eur(k.margeGagnee)} de marge, pour ${eur(k.budgetEnPlus)} de dépense en plus. ${k.previsionJuste ? "La prévision avait vu juste." : "La prévision disait le contraire."}`,
          "Doubler la publicité ne double pas les clients : chaque euro en plus en fait venir moins que le précédent.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable commercial",
      notions: ["contribution_margin"],
      question: () => "Quelle phrase envoyez-vous au responsable commercial ?",
      options: () => {
        const k = publiciteDoublee();
        const chiffres = `Le budget doublé fait gagner ${ventesEcrites(k.ventesGagnees)} et ${eur(k.margeGagnee)} de marge, pour ${eur(k.budgetEnPlus)} de dépense en plus : le résultat de l'année ${k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`}.`;
        const doubler = k.verdict === "doubler";
        return [
          { texte: "Doublez-la : le budget en plus rapporte plus qu'il ne coûte", juste: doubler, retour: doubler ? `Oui. ${chiffres}` : `Non. ${chiffres}` },
          { texte: "Gardez la campagne proposée : le budget en plus coûte plus qu'il ne rapporte", juste: !doubler, retour: !doubler ? `Oui. ${chiffres} Vendre un peu plus ne suffit pas : il faut que la marge gagnée paie la dépense.` : `Non. ${chiffres}` },
          { texte: "Doublez-la : plus de ventes, c'est forcément plus de résultat à la fin de l'année", juste: false, retour: `Non : une vente de plus ne laisse que sa marge, et la publicité en plus se paie. ${chiffres}` },
        ];
      },
    },
  ],
};
