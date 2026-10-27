import type { Cas } from "../../cas";
import { rejouerAvec } from "../../gestion-de-la-pme";
import {
  L_EFFET_DE_LEVIER,
  auCentieme,
  dE,
  effetDeLevier,
  eur,
  pct,
  points,
  rentabilitesDe,
  structureDe,
} from "../../chapitres/l-effet-de-levier";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EFFET DE LEVIER » : LE LEVIER FACE À LA HAUSSE DU TAUX (DSCG, UE2
 * Finance, palier 4).
 *
 * L'emprunt de l'entreprise est à taux variable, et la banque annonce une hausse. La directrice
 * financière demande si la dette jouera encore pour les associés. L'arène rejoue l'année du cours
 * avec le taux du scénario relevé (`finance.loanAnnualRate`, le paramètre `scenario` de
 * `rejouerAvec`) : l'exploitation ne bouge pas, les charges financières montent. L'élève refait
 * seul les calculs du chapitre au taux relevé (la rentabilité économique, le coût de
 * l'endettement net, la rentabilité des capitaux propres), puis cherche le taux à partir duquel
 * le levier s'inverse.
 *
 * Le cas est neuf par sa question : le chapitre faisait varier la structure à taux donné, le cas
 * fait varier le taux à structure donnée. Les chiffres de l'année sont ceux du chapitre
 * (`effetDeLevier`) ; ceux du taux relevé, la même lecture du bilan (`structureDe`) sur l'année
 * rejouée. Au taux relevé, l'année finit encore en bénéfice dans les trois entreprises : l'impôt
 * suit le taux, et la relation du levier tient ; le test le vérifie.
 */

/**
 * LA HAUSSE DU TAUX : 3 points, une hypothèse du cours. C'est l'ordre de grandeur de la remontée
 * des taux des crédits aux entreprises en 2022 et 2023, ce qu'un emprunt à taux variable a payé
 * en plus en deux ans. À 4 points, MARTEL & FILS finirait l'année en perte : l'impôt ne
 * suivrait plus le taux, et la relation du levier après impôt ne tiendrait plus.
 */
export const HAUSSE_DU_TAUX_VARIABLE = 0.03;

/** L'année du cours rejouée au taux relevé. */
export const anneeAuTauxReleve = (code: string) =>
  rejouerAvec(code, "l-effet-de-levier:hausse-du-taux", () => undefined, (s) => ({
    ...s,
    finance: { ...s.finance, loanAnnualRate: s.finance.loanAnnualRate + HAUSSE_DU_TAUX_VARIABLE },
  }));

export type Verdict = "tient" | "s-inverse" | "deja";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le levier au taux actuel et au taux relevé, et le taux où il s'inverse. */
export function levierFaceALaHausse(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const l = effetDeLevier(c);
  const releve = structureDe(anneeAuTauxReleve(c.code));
  const r2 = rentabilitesDe(releve, l.tauxIS);
  const tauxReleve = auCentieme(l.taux + HAUSSE_DU_TAUX_VARIABLE * 100);
  // À endettement net inchangé, le coût de la dette suit le taux : il égale Re au taux actuel × Re ÷ i.
  const tauxLimite = auCentieme((l.taux * l.r.re) / l.r.i);
  const verdict: Verdict = l.r.exact.re <= l.r.exact.i ? "deja" : r2.exact.re < r2.exact.i ? "s-inverse" : "tient";
  return { ...l, releve, r2, tauxReleve, tauxLimite, verdict, perteDeRcp: auCentieme(l.r.rcp - r2.rcp) };
}

function tableauDesDeuxTaux(c: Cas): TableauDeDonnees {
  const { s, releve, taux, tauxReleve } = levierFaceALaHausse(c);
  return {
    titre: `L'année ${dE(c.entreprise)}, au taux actuel et au taux relevé`,
    colonnes: ["Taux actuel", "Taux relevé"],
    lignes: [
      { libelle: "Taux annuel de l'emprunt", valeurs: [pct(taux), pct(tauxReleve)] },
      { libelle: "Résultat d'exploitation", valeurs: [eur(s.resultatDExploitation), eur(releve.resultatDExploitation)] },
      { libelle: "Charges financières", valeurs: [eur(s.chargesFinancieres), eur(releve.chargesFinancieres)] },
      { libelle: "Résultat net", valeurs: [eur(s.resultatNet), eur(releve.resultatNet)] },
      { libelle: "Actif économique au 31 décembre", valeurs: [eur(s.actifEconomique), eur(releve.actifEconomique)] },
      { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(s.capitauxPropres), eur(releve.capitauxPropres)] },
      { libelle: "Endettement net au 31 décembre", valeurs: [eur(s.endettementNet), eur(releve.endettementNet)] },
    ],
  };
}

export const LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX: Situation = {
  code: "le-levier-face-a-la-hausse-du-taux",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [L_EFFET_DE_LEVIER.code],
  commanditaire: "La directrice financière",
  titre: "Le levier face à la hausse du taux",
  accroche:
    "L'emprunt est à taux variable, et la banque annonce une hausse. La dette jouera-t-elle encore pour les associés ? Les rentabilités au taux relevé, et le taux à partir duquel le levier s'inverse.",
  objectifs: [
    "Calculer la rentabilité économique et le coût de l'endettement net après impôt",
    "Calculer la rentabilité des capitaux propres au taux relevé",
    "Trouver le taux d'emprunt à partir duquel le levier s'inverse",
    "Répondre à la directrice financière, chiffre à l'appui",
  ],
  libre: false,
  entreprises: L_EFFET_DE_LEVIER.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice financière",
      texte: (c) => {
        const { taux, tauxReleve } = levierFaceALaHausse(c);
        return [
          `« Notre emprunt est à taux variable, et la banque annonce que son taux passera de ${pct(taux)} à ${pct(tauxReleve)}. Jusqu'ici, la dette ${dE(c.entreprise)} a-t-elle joué pour les associés, et jouera-t-elle encore au nouveau taux ? À partir de quel taux se retournerait-elle contre eux ? »`,
          "Pas de cours cette fois : l'arène a rejoué l'année au taux relevé, tout le reste égal, et les calculs sont ceux du chapitre. Les rentabilités se calculent après impôt, au taux de l'arène, et sur le bilan du 31 décembre.",
        ];
      },
      tableau: tableauDesDeuxTaux,
      repere: () => "À rendre : les rentabilités au taux relevé, le taux où le levier s'inverse, et votre réponse.",
    },
    {
      id: "au-taux-releve",
      type: "montants",
      titre: "Les rentabilités au taux relevé",
      notions: ["profitability_vs_return", "loan_schedule"],
      tableau: tableauDesDeuxTaux,
      question: (c) => {
        const { tauxISPct } = levierFaceALaHausse(c);
        return `Au taux relevé, calculez la rentabilité économique après impôt (le résultat d'exploitation après impôt rapporté à l'actif économique), le coût de l'endettement net après impôt (les charges financières après impôt rapportées à l'endettement net), et la rentabilité des capitaux propres (le résultat net rapporté aux capitaux propres), en %. L'impôt est de ${pct(tauxISPct)}.`;
      },
      champs: (c) => {
        const { releve, r2 } = levierFaceALaHausse(c);
        return [
          {
            libelle: "Rentabilité économique au taux relevé, Re (%)",
            attendu: r2.re,
            calcul: `${eur(r2.exploitationApresImpot)} ÷ ${eur(releve.actifEconomique)} × 100 = ${pct(r2.re)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Coût de l'endettement net au taux relevé, i (%)",
            attendu: r2.i,
            calcul: `${eur(r2.chargesApresImpot)} ÷ ${eur(releve.endettementNet)} × 100 = ${pct(r2.i)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Rcp au taux relevé (%)",
            attendu: r2.rcp,
            calcul: `${eur(releve.resultatNet)} ÷ ${eur(releve.capitauxPropres)} × 100 = ${pct(r2.rcp)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const { r, r2, perteDeRcp } = levierFaceALaHausse(c);
        return [
          `L'outil rapporte la même chose aux deux taux, ${pct(r2.re)} : la hausse ne touche que le financement. Le coût de l'endettement net passe de ${pct(r.i)} à ${pct(r2.i)}, et la rentabilité des associés perd ${points(perteDeRcp)}, de ${pct(r.rcp)} à ${pct(r2.rcp)}.`,
        ];
      },
    },
    {
      id: "taux-limite",
      type: "montants",
      titre: "Le taux où le levier s'inverse",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: (c) => {
        const { taux } = levierFaceALaHausse(c);
        return `À endettement net inchangé, le coût de la dette est proportionnel au taux de l'emprunt. Calculez le coût de l'endettement net après impôt au taux actuel, ${pct(taux)} (en %), puis le taux de l'emprunt où il égalerait la rentabilité économique : le taux actuel × Re ÷ i (en %).`;
      },
      champs: (c) => {
        const { s, r, taux, tauxLimite } = levierFaceALaHausse(c);
        return [
          {
            libelle: "Coût de l'endettement net au taux actuel, i (%)",
            attendu: r.i,
            calcul: `${eur(r.chargesApresImpot)} ÷ ${eur(s.endettementNet)} × 100 = ${pct(r.i)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Taux de l'emprunt où le levier s'inverse (%)",
            attendu: tauxLimite,
            calcul: `${pct(taux)} × ${pct(r.re)} ÷ ${pct(r.i)} = ${pct(tauxLimite)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const { taux, tauxReleve, tauxLimite } = levierFaceALaHausse(c);
        return [
          tauxLimite <= taux
            ? `Le levier s'inverse dès ${pct(tauxLimite)}, sous le taux actuel de ${pct(taux)} : la dette coûte déjà plus que l'outil ne rapporte, et la hausse ne fait qu'alourdir la massue.`
            : tauxLimite > tauxReleve
              ? `Le levier s'inverserait à ${pct(tauxLimite)}, au-dessus des ${pct(tauxReleve)} annoncés : la marge se réduit, mais la dette rapporte encore plus qu'elle ne coûte.`
              : `Le levier s'inverse à ${pct(tauxLimite)}, sous les ${pct(tauxReleve)} annoncés : au nouveau taux, la dette coûtera plus que l'outil ne rapporte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice financière",
      question: () => "Quelle phrase envoyez-vous à la directrice financière ?",
      options: (c) => {
        const { r, r2, tauxReleve, tauxLimite, verdict } = levierFaceALaHausse(c);
        return [
          {
            texte: "Le levier tient : l'outil rapportera encore plus que la dette ne coûtera",
            juste: verdict === "tient",
            retour:
              verdict === "tient"
                ? `Oui : au taux relevé, l'outil rapporte ${pct(r2.re)} et l'endettement net coûte ${pct(r2.i)}. Les associés gardent un effet de levier, ${pct(r2.rcp)} contre ${pct(r.rcp)} avant la hausse, tant que le taux reste sous ${pct(tauxLimite)}.`
                : verdict === "deja"
                  ? `Non : la dette coûte déjà ${pct(r.i)} au taux actuel, plus que les ${pct(r.re)} que rapporte l'outil.`
                  : `Non : au taux relevé, l'endettement net coûte ${pct(r2.i)}, plus que les ${pct(r2.re)} de l'outil.`,
          },
          {
            texte: "Le levier s'inverse : au nouveau taux, la dette coûtera plus que l'outil ne rapportera",
            juste: verdict === "s-inverse",
            retour:
              verdict === "s-inverse"
                ? `Oui : le levier s'inverse à ${pct(tauxLimite)}, sous les ${pct(tauxReleve)} annoncés. Au taux relevé, l'endettement net coûte ${pct(r2.i)} pour un outil qui rapporte ${pct(r2.re)}.`
                : verdict === "deja"
                  ? `Non : il ne s'inverse pas au nouveau taux, il est déjà inversé au taux actuel, dès ${pct(tauxLimite)}.`
                  : `Non : le levier ne s'inverserait qu'à ${pct(tauxLimite)}, au-dessus des ${pct(tauxReleve)} annoncés.`,
          },
          {
            texte: "Le levier jouait déjà contre les associés : la hausse aggrave la massue",
            juste: verdict === "deja",
            retour:
              verdict === "deja"
                ? `Oui : au taux actuel, l'endettement net coûte ${pct(r.i)} et l'outil ne rapporte que ${pct(r.re)}. Au taux relevé, la rentabilité des associés tombe de ${pct(r.rcp)} à ${pct(r2.rcp)}. Réduire la dette, ou la trésorerie oisive qui la renchérit, devient urgent.`
                : `Non : au taux actuel, l'outil rapporte ${pct(r.re)}, plus que les ${pct(r.i)} que coûte l'endettement net.`,
          },
        ];
      },
    },
  ],
};
