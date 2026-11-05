import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { structureDuCas } from "../../chapitres/ratios-de-structure-et-bilan-financier";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DE_LA_STRUCTURE, auCentieme } from "../../monde/structure-financiere";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RATIOS DE STRUCTURE ET BILAN FINANCIER » : UN DIVIDENDE SOUS CONDITION
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le bilan financier de NOVA au 31 décembre
 * (monde/structure-financiere.ts).
 *
 * HYPOTHÈSES DU CAS : le projet d'affectation que votera l'assemblée de juin N+1 verse 2 € par action
 * (l'affectation unique du cours, comptabilite-approfondie.ts). Un actionnaire le trouve maigre et
 * demande DIVIDENDE_DEMANDE, 3 € par action. La banque qui finance la gamme a mis une condition au
 * prêt : une autonomie financière d'au moins AUTONOMIE_EXIGEE au bilan financier après répartition.
 * Un dividende voté devient une dette à moins d'un an et quitte les capitaux propres : le total du
 * bilan ne change pas. L'élève part du bilan financier avant tout dividende, refait seul le chemin :
 * l'autonomie avec le dividende demandé, puis le dividende le plus élevé qui tient la condition, puis
 * il répond.
 */

/** Le dividende que l'actionnaire demande, 3 € par action : hypothèse du cas. */
export const DIVIDENDE_DEMANDE = 45_000;

/** L'autonomie financière que la banque exige au bilan financier après répartition : hypothèse du cas. */
export const AUTONOMIE_EXIGEE = 0.45;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;

/** Les chiffres du cas. */
export function dividendeSousCondition(c: Pick<Cas, "code">) {
  const s = structureDuCas(c);
  const f = s.financier;
  // Le bilan financier avant tout dividende : celui du chapitre, le dividende du projet remis aux capitaux propres.
  const b = {
    ...f,
    capitauxPropres: auCentime(f.capitauxPropres + s.postes.dividende),
    dettesMoinsDUnAn: auCentime(f.dettesMoinsDUnAn - s.postes.dividende),
  };
  const capitauxPropres = auCentime(b.capitauxPropres - DIVIDENDE_DEMANDE);
  const dettesMoinsDUnAn = auCentime(b.dettesMoinsDUnAn + DIVIDENDE_DEMANDE);
  return {
    s,
    b,
    /** Le dividende du projet d'affectation, 2 € par action. */
    dividendeDuProjet: s.postes.dividende,
    capitauxPropres,
    dettesMoinsDUnAn,
    autonomie: auCentieme((capitauxPropres / b.totalPassif) * 100),
    liquiditeGenerale: auCentieme(b.actifMoinsDUnAn / dettesMoinsDUnAn),
    /** Le dividende le plus élevé, à l'euro inférieur : capitaux propres − autonomie exigée × total. */
    dividendeMaximal: Math.floor(b.capitauxPropres - AUTONOMIE_EXIGEE * b.totalPassif + 1e-9),
  };
}

export const UN_DIVIDENDE_SOUS_CONDITION: Situation = {
  code: "un-dividende-sous-condition",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["ratios-de-structure-et-bilan-financier"],
  commanditaire: "Un actionnaire",
  titre: "Un dividende sous condition",
  accroche: "Un actionnaire veut plus que le dividende du projet d'affectation ; la banque qui finance la gamme exige une autonomie financière minimale. Combien peut-on verser ?",
  objectifs: [
    "Reporter un dividende voté au bilan financier après répartition",
    "Recalculer l'autonomie financière et la liquidité générale",
    "Trouver le dividende le plus élevé que permet une condition de la banque, et rendre une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRUCTURE,
    pourquoi: "ce cas reprend le chapitre « Ratios de structure et bilan financier », qui se joue sur le bilan de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'actionnaire",
      texte: (c) => {
        const n = dividendeSousCondition(c);
        return [
          `« Le premier exercice a laissé ${eur(n.s.postes.resultat)} de bénéfice, et le projet d'affectation ne nous en verse que ${eur(n.dividendeDuProjet)}. Je demande un dividende de ${eur(DIVIDENDE_DEMANDE)}. La banque qui prête pour la gamme veut une autonomie financière d'au moins ${pct(AUTONOMIE_EXIGEE * 100)} au bilan financier après répartition : la tient-on encore ? Sinon, combien peut-on verser ? »`,
          "Pas de cours cette fois : vous avez le bilan financier du chapitre, avant tout dividende. Un dividende voté est une dette à moins d'un an envers les actionnaires.",
        ];
      },
      tableau: (c) => {
        const n = dividendeSousCondition(c);
        const b = n.b;
        return {
          titre: `Le bilan financier de ${n.s.entreprise}, avant répartition`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Actif à plus d'un an", valeurs: [eur(b.actifPlusDUnAn)] },
            { libelle: "Actif à moins d'un an", valeurs: [eur(b.actifMoinsDUnAn)] },
            { libelle: "Total", valeurs: [eur(b.totalActif)] },
            { libelle: "Capitaux propres", valeurs: [eur(b.capitauxPropres)] },
            { libelle: "Dettes à plus d'un an", valeurs: [eur(b.dettesPlusDUnAn)] },
            { libelle: "Dettes à moins d'un an", valeurs: [eur(b.dettesMoinsDUnAn)] },
          ],
        };
      },
      repere: () => "À rendre : l'autonomie avec le dividende demandé, le dividende le plus élevé qui tient la condition, et votre réponse.",
    },
    {
      id: "avec-le-dividende-demande",
      type: "montants",
      titre: "Avec le dividende demandé",
      notions: ["balance_sheet"],
      question: () =>
        `Le dividende de ${eur(DIVIDENDE_DEMANDE)} est voté. Calculez les capitaux propres et les dettes à moins d'un an après répartition, l'autonomie financière en pour cent au centième, puis la liquidité générale au centième.`,
      champs: (c) => {
        const n = dividendeSousCondition(c);
        const b = n.b;
        return [
          { libelle: "Capitaux propres après répartition", attendu: n.capitauxPropres, calcul: `${eur(b.capitauxPropres)} − ${eur(DIVIDENDE_DEMANDE)} = ${eur(n.capitauxPropres)}` },
          { libelle: "Dettes à moins d'un an après répartition", attendu: n.dettesMoinsDUnAn, calcul: `${eur(b.dettesMoinsDUnAn)} + ${eur(DIVIDENDE_DEMANDE)} = ${eur(n.dettesMoinsDUnAn)}` },
          { libelle: "Autonomie financière, en %", attendu: n.autonomie, calcul: `${eur(n.capitauxPropres)} ÷ ${eur(b.totalPassif)} = ${pct(n.autonomie)}, le total ne change pas`, tolerance: 0.01 },
          { libelle: "Liquidité générale", attendu: n.liquiditeGenerale, calcul: `${eur(b.actifMoinsDUnAn)} ÷ ${eur(n.dettesMoinsDUnAn)} = ${qte(n.liquiditeGenerale)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const n = dividendeSousCondition(c);
        return [`La liquidité reste confortable, ${qte(n.liquiditeGenerale)} ; mais l'autonomie tombe à ${pct(n.autonomie)}, sous la condition de la banque. La moins-value latente de la ligne y est pour beaucoup : elle a déjà rogné les capitaux propres.`];
      },
    },
    {
      id: "le-dividende-maximal",
      type: "montants",
      titre: "Le dividende le plus élevé",
      notions: ["balance_sheet"],
      question: () =>
        `Quel dividende, au plus, garde une autonomie financière d'au moins ${pct(AUTONOMIE_EXIGEE * 100)} ? Le total du bilan financier ne change pas. Arrondissez à l'euro inférieur.`,
      champs: (c) => {
        const n = dividendeSousCondition(c);
        const b = n.b;
        return [
          {
            libelle: "Dividende le plus élevé",
            attendu: n.dividendeMaximal,
            calcul: `${eur(b.capitauxPropres)} − ${qte(AUTONOMIE_EXIGEE)} × ${eur(b.totalPassif)} = ${eur(auCentime(b.capitauxPropres - AUTONOMIE_EXIGEE * b.totalPassif))}, soit ${eur(n.dividendeMaximal)} à l'euro inférieur`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const n = dividendeSousCondition(c);
        return [`Avec ${eur(n.dividendeMaximal)}, les capitaux propres font tout juste ${pct(AUTONOMIE_EXIGEE * 100)} du bilan financier. Un euro de plus, et la condition du prêt tombe. Le dividende du projet, ${eur(n.dividendeDuProjet)}, tient la condition.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'actionnaire",
      notions: ["balance_sheet"],
      question: () => "Quelle réponse rendez-vous à l'actionnaire ?",
      options: (c) => {
        const n = dividendeSousCondition(c);
        return [
          {
            texte: `${eur(n.dividendeMaximal)} au plus, pas ${eur(DIVIDENDE_DEMANDE)}`,
            juste: true,
            retour: `Oui. Au-delà, l'autonomie passe sous ${pct(AUTONOMIE_EXIGEE * 100)} et la banque peut exiger le remboursement du prêt de la gamme. Le reste du bénéfice, mis en réserve, renforce les capitaux propres pour le prochain emprunt.`,
          },
          {
            texte: `${eur(DIVIDENDE_DEMANDE)} : la liquidité générale reste à ${qte(n.liquiditeGenerale)}, bien au-dessus de 1`,
            juste: false,
            retour: `Non : la banque n'a pas posé sa condition sur la liquidité, mais sur l'autonomie, qui tomberait à ${pct(n.autonomie)}.`,
          },
          {
            texte: "Aucun dividende : tout versement rompt la condition de la banque",
            juste: false,
            retour: `Non : jusqu'à ${eur(n.dividendeMaximal)}, l'autonomie reste d'au moins ${pct(AUTONOMIE_EXIGEE * 100)}. Refuser tout dividende est un choix possible, pas une obligation.`,
          },
          {
            texte: `Tout le bénéfice, ${eur(n.s.postes.resultat)} : il appartient aux actionnaires, la banque n'a pas à en juger`,
            juste: false,
            retour: "Non : la condition du prêt engage NOVA. La rompre, c'est risquer le remboursement immédiat de l'emprunt.",
          },
        ];
      },
    },
  ],
};
