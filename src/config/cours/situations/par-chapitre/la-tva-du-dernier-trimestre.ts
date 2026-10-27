import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_OU_LA_TVA_JOUE, POURQUOI_LA_TVA, declarationDeTva } from "../../chapitres/la-declaration-de-tva";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA DÉCLARATION DE TVA » : LA TVA DU DERNIER TRIMESTRE
 * (fiscalité, palier 3).
 *
 * L'expert-comptable prépare la déclaration du quatrième trimestre. La gérante veut savoir ce
 * qu'elle versera à l'État au trimestre suivant, et si ce sera plus ou moins que ce qu'elle
 * vient de verser au quatrième trimestre (la TVA du troisième, « TVA décaissée » du budget de
 * trésorerie de l'arène). L'élève refait la déclaration du chapitre sur un autre trimestre,
 * compare les deux versements, puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre déclare le deuxième trimestre, dont la TVA se
 * paie dans l'année ; celle du quatrième reste due au bilan du 31 décembre et se paie dans
 * l'exercice suivant. La réponse dépend de l'entreprise : chez l'une, la TVA de fin d'année est
 * plus lourde que celle d'avant, chez l'autre plus légère.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (mot: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(mot) ? `d'${mot}` : `de ${mot}`);

export type Verdict = "plus-lourde" | "plus-legere";

/** Le quatrième trimestre déclaré, et ce qu'il change au versement suivant. */
export function tvaDuDernierTrimestre(c: Cas) {
  const d = declarationDeTva(c);
  const troisieme = d.trimestres[2]!;
  const quatrieme = d.trimestres[3]!;
  const ecart = quatrieme.nette - quatrieme.versee;
  const verdict: Verdict = ecart > 0 ? "plus-lourde" : "plus-legere";
  return { d, troisieme, quatrieme, ecart, verdict };
}

export const LA_TVA_DU_DERNIER_TRIMESTRE: Situation = {
  code: "la-tva-du-dernier-trimestre",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: ["la-declaration-de-tva"],
  commanditaire: "L'expert-comptable",
  titre: "La TVA du dernier trimestre",
  accroche:
    "La déclaration du quatrième trimestre, à préparer pour l'expert-comptable : ce qui restera dû à l'État au 31 décembre, et si ce sera plus ou moins que ce que l'entreprise vient de lui verser.",
  objectifs: [
    "Calculer la TVA collectée, déductible et à décaisser d'un trimestre",
    "Comparer deux versements de TVA successifs",
    "Situer la TVA du dernier trimestre au bilan de fin d'année",
    "Répondre à l'expert-comptable, chiffre à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_OU_LA_TVA_JOUE, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La déclaration de fin d'année",
      texte: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `« Je prépare la déclaration de TVA du quatrième trimestre ${dE(c.entreprise)}. Faites-moi le calcul : TVA collectée, TVA déductible, TVA à décaisser. La gérante a versé ${eur(k.quatrieme.versee)} à l'État ce trimestre, pour le troisième ; elle veut savoir si le prochain versement sera plus lourd ou plus léger. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, au taux du scénario (${pct(k.d.taux)}), sur les ventes et les achats ${dE(k.d.nature)} du trimestre, tels que l'arène les a joués.`,
        ];
      },
      tableau: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return {
          titre: `Les deux derniers trimestres ${dE(c.entreprise)}`,
          colonnes: ["3e trimestre", "4e trimestre"],
          lignes: [
            { libelle: "Ventes (hors taxes)", valeurs: [eur(k.troisieme.ventes), eur(k.quatrieme.ventes)] },
            { libelle: `Achats ${dE(k.d.nature)} (hors taxes)`, valeurs: [eur(k.troisieme.achats), eur(k.quatrieme.achats)] },
            { libelle: "TVA à décaisser à la clôture", valeurs: [eur(k.troisieme.aDecaisser), "à calculer"] },
          ],
        };
      },
      repere: () => "À rendre : la TVA à décaisser du quatrième trimestre, l'écart avec le versement que la gérante vient de faire, et votre réponse.",
    },
    {
      id: "declaration",
      type: "montants",
      titre: "La déclaration du quatrième trimestre",
      notions: ["vat_payable"],
      question: () => "Calculez la TVA collectée et la TVA déductible du quatrième trimestre, à l'euro près, puis la TVA à décaisser.",
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const x = k.quatrieme;
        return [
          { libelle: "TVA collectée", attendu: x.collectee, calcul: `${eur(x.ventes)} × ${pct(k.d.taux)} = ${eur(x.collectee)}`, tolerance: 1 },
          { libelle: "TVA déductible", attendu: x.deductible, calcul: `${eur(x.achats)} × ${pct(k.d.taux)} = ${eur(x.deductible)}`, tolerance: 1 },
          { libelle: "TVA à décaisser", attendu: x.nette, calcul: `${eur(x.collectee)} − ${eur(x.deductible)} = ${eur(x.nette)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `C'est la ligne « TVA à décaisser » du bilan de l'arène au 31 décembre (${eur(k.quatrieme.aDecaisser)}) : une dette de l'exercice, que l'entreprise paiera au trimestre suivant, dans l'exercice d'après.`,
        ];
      },
    },
    {
      id: "comparer",
      type: "montants",
      titre: "Le prochain versement, face au dernier",
      notions: ["vat_payable", "cash_budget"],
      question: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return `Au quatrième trimestre, le budget de trésorerie a versé ${eur(k.quatrieme.versee)} à l'État, la TVA du troisième. Calculez l'écart entre la TVA du quatrième trimestre et ce versement (négatif si le prochain versement est plus léger).`;
      },
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          {
            libelle: "Écart, TVA du quatrième trimestre moins TVA versée au quatrième trimestre",
            attendu: k.ecart,
            calcul: `${eur(k.quatrieme.nette)} − ${eur(k.quatrieme.versee)} = ${eur(k.ecart)}`,
            tolerance: 3,
          },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const ventes = k.quatrieme.ventes - k.troisieme.ventes;
        const achats = k.quatrieme.achats - k.troisieme.achats;
        return [
          `D'un trimestre à l'autre, les ventes ont ${ventes >= 0 ? "augmenté" : "baissé"} de ${eur(Math.abs(ventes))} et les achats ont ${achats >= 0 ? "augmenté" : "baissé"} de ${eur(Math.abs(achats))} : la TVA à verser suit l'écart entre les deux, au taux de ${pct(k.d.taux)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'expert-comptable",
      notions: ["vat_payable"],
      question: () => "Quelle phrase envoyez-vous à l'expert-comptable ?",
      options: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const chiffres = `${eur(k.quatrieme.nette)} à verser au trimestre suivant, contre ${eur(k.quatrieme.versee)} versés ce trimestre`;
        return [
          {
            texte: "Un versement plus lourd : la gérante doit prévoir davantage de trésorerie",
            juste: k.verdict === "plus-lourde",
            retour: k.verdict === "plus-lourde" ? `Oui : ${chiffres}. Une dette de TVA qui reste au bilan du 31 décembre.` : `Non : ${chiffres}. Le versement sera plus léger.`,
          },
          {
            texte: "Un versement plus léger que le dernier, déjà inscrit au bilan",
            juste: k.verdict === "plus-legere",
            retour:
              k.verdict === "plus-legere"
                ? `Oui : ${chiffres}. Une dette de TVA qui reste au bilan du 31 décembre, plus légère que la précédente.`
                : `Non : ${chiffres}. Le versement sera plus lourd.`,
          },
          {
            texte: "Rien à prévoir : cette TVA est une charge déjà passée au résultat de l'année",
            juste: false,
            retour: `Non : la TVA n'est jamais une charge. ${eur(k.quatrieme.nette)} restent dus à l'État au 31 décembre, et sortiront de la trésorerie au trimestre suivant.`,
          },
        ];
      },
    },
  ],
};
