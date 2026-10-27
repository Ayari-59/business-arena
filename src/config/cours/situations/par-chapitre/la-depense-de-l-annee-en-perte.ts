import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import {
  LE_DEFICIT_REPORTE,
  TRIMESTRES_PAR_EXERCICE,
  deficitReporte,
  deuxExercices,
  lireDeuxExercices,
  surDeuxExercices,
} from "../../chapitres/le-deficit-reporte";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const centime = (x: number) => auCentime(x) || 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « LE DÉFICIT REPORTÉ » : LA DÉPENSE DE L'ANNÉE EN PERTE (fiscalité de
 * l'entreprise, palier 3).
 *
 * L'année du cours finit en perte. Le gérant renonce à doubler la maintenance au dernier trimestre :
 * « nous ne payons pas d'impôt cette année, la dépense ne nous ferait rien économiser ; attendons
 * l'an prochain ». L'élève refait le calcul du chapitre avec la dépense : elle grossit le déficit,
 * et le déficit imputé sur l'exercice suivant fait baisser son impôt du taux de la dépense.
 * L'économie n'est pas perdue : elle attend l'exercice suivant, comme elle l'aurait attendu si la
 * dépense y avait été faite.
 *
 * L'arène rejoue les deux exercices du chapitre (`surDeuxExercices`), le budget de maintenance du
 * trimestre 4 doublé, la seule décision changée. Le second exercice peut en sortir un peu changé
 * (la trésorerie suit un autre chemin, les charges financières avec elle) : le cas le dit, chiffres
 * de l'arène à l'appui.
 */

/** Le trimestre de la dépense : le dernier de l'exercice en perte. */
export const TRIMESTRE_DE_LA_DEPENSE = TRIMESTRES_PAR_EXERCICE;

/** Les deux exercices du chapitre, le budget de maintenance du dernier trimestre du premier doublé. */
export const deuxExercicesAvecLaDepense = (code: string) =>
  rejouerAvec(
    code,
    "la-depense-de-l-annee-en-perte:maintenance-doublee",
    (t, d) => (t === TRIMESTRE_DE_LA_DEPENSE ? { ...d, maintenanceBudget: d.maintenanceBudget * 2 } : undefined),
    surDeuxExercices(code),
  );

export type Verdict = "l-economie-attend" | "l-economie-attend-plus-loin";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La dépense de l'année en perte : le déficit qu'elle ajoute, l'impôt qu'elle fait économiser au second exercice. */
export function depenseDeLAnneeEnPerte(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const k = deficitReporte(c);
  const sans = deuxExercices(c.code);
  const avec = deuxExercicesAvecLaDepense(c.code);
  const i = TRIMESTRE_DE_LA_DEPENSE - 1;
  // Doubler le budget, c'est dépenser une seconde fois la maintenance du trimestre.
  const depense = centime(sans[i]!.incomeStatement.maintenanceCost);
  const deficitAvec = centime(k.deficit + depense);
  // Sur le même résultat du second exercice : le calcul du chapitre, avec le déficit grossi.
  const impot2Avec = centime(k.taux * Math.max(0, k.avantImpot2 - deficitAvec));
  const economie = centime(k.impot2 - impot2Avec);
  const a = lireDeuxExercices(avec, k.taux);
  const maintenance = (tours: typeof sans) => centime(tours.slice(0, TRIMESTRES_PAR_EXERCICE).reduce((t, r) => t + r.incomeStatement.maintenanceCost, 0));
  const verdict: Verdict = deficitAvec <= k.avantImpot2 ? "l-economie-attend" : "l-economie-attend-plus-loin";
  return {
    k,
    depense,
    deficitAvec,
    impot2Avec,
    economie,
    arene: {
      maintenanceSans: maintenance(sans),
      maintenanceAvec: maintenance(avec),
      avantImpot1: a.avantImpot1,
      deficit: a.deficit,
      avantImpot2: a.avantImpot2,
      impot2: a.impot2,
    },
    impot2EnMoins: centime(k.impot2 - a.impot2),
    ecartDuSecondExercice: centime(a.avantImpot2 - k.avantImpot2),
    // La maintenance de plus, telle que l'arène l'a passée au trimestre de la dépense.
    maintenanceEnPlus: centime(avec[i]!.incomeStatement.maintenanceCost - sans[i]!.incomeStatement.maintenanceCost),
    verdict,
  };
}

const T = TRIMESTRE_DE_LA_DEPENSE;

export const LA_DEPENSE_DE_L_ANNEE_EN_PERTE: Situation = {
  code: "la-depense-de-l-annee-en-perte",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: [LE_DEFICIT_REPORTE.code],
  commanditaire: "Le gérant",
  titre: "La dépense de l'année en perte",
  accroche:
    "L'année finit en perte, et le gérant renonce à une dépense de maintenance : sans impôt à payer, elle ne ferait rien économiser. Ce que la dépense ajoute au déficit, et l'impôt qu'elle fait économiser l'exercice suivant.",
  objectifs: [
    "Calculer le déficit reportable après une charge de plus",
    "Calculer l'impôt de l'exercice suivant avec ce déficit, et l'impôt économisé",
    "Lire dans l'arène rejouée ce que la dépense change aux deux exercices",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LE_DEFICIT_REPORTE.entreprises!,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Ce que propose le gérant",
      texte: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          `« Nous voulions doubler le budget de maintenance au trimestre ${T}, ${eur(r.depense)} de plus. Mais cette année, nous sommes en perte : nous ne payons pas d'impôt, et la dépense ne nous ferait rien économiser. Attendons l'an prochain, où elle fera baisser l'impôt. »`,
          `Pas de cours cette fois : vous avez les deux exercices ${dE(c.entreprise)}, tels que l'arène les a joués, et les calculs sont ceux du chapitre. L'arène a rejoué les deux exercices avec le budget de maintenance du trimestre ${T} doublé.`,
        ];
      },
      tableau: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return {
          titre: `Les deux exercices ${dE(c.entreprise)}, sans la dépense`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Résultat avant impôt du premier exercice", valeurs: [eur(r.k.avantImpot1)] },
            { libelle: "Déficit reportable à la clôture", valeurs: [eur(r.k.deficit)] },
            { libelle: `Budget de maintenance du trimestre ${T}`, valeurs: [eur(r.depense)] },
            { libelle: "Résultat avant impôt du second exercice", valeurs: [eur(r.k.avantImpot2)] },
            { libelle: "Impôt sur les sociétés du second exercice", valeurs: [eur(r.k.impot2)] },
            { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(r.k.tauxPct)] },
          ],
        };
      },
      repere: () => "À rendre : ce que la dépense ajoute au déficit, l'impôt qu'elle fait économiser, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "deficit",
      type: "montants",
      titre: "Le déficit et l'impôt suivant",
      notions: ["income_statement"],
      question: () =>
        `Si la dépense est faite au trimestre ${T} et ne change rien d'autre, calculez le déficit reportable à la clôture du premier exercice, l'impôt du second exercice sur le même résultat avec ce déficit, puis l'impôt que la dépense fait économiser.`,
      champs: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          { libelle: "Déficit reportable avec la dépense", attendu: r.deficitAvec, calcul: `${eur(r.k.deficit)} + ${eur(r.depense)} = ${eur(r.deficitAvec)}` },
          {
            libelle: "Impôt du second exercice avec ce déficit",
            attendu: r.impot2Avec,
            calcul:
              r.k.avantImpot2 > r.deficitAvec
                ? `(${eur(r.k.avantImpot2)} − ${eur(r.deficitAvec)}) × ${pct(r.k.tauxPct)} = ${eur(r.impot2Avec)}`
                : `le déficit dépasse le bénéfice : pas d'impôt, ${eur(0)}`,
            tolerance: 1,
          },
          { libelle: "Impôt économisé par la dépense", attendu: r.economie, calcul: `${eur(r.k.impot2)} − ${eur(r.impot2Avec)} = ${eur(r.economie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          r.verdict === "l-economie-attend"
            ? `La dépense ne fait rien économiser cette année, mais elle grossit le déficit de ${eur(r.depense)}, et le déficit fait baisser l'impôt du second exercice de ${pct(r.k.tauxPct)} de ce montant, ${eur(r.economie)}. Faite l'an prochain, la même dépense aurait fait économiser autant.`
            : `Le déficit grossi dépasse le bénéfice du second exercice : l'économie n'est que de ${eur(r.economie)} cette fois, le reste attend un exercice suivant en bénéfice.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue les deux exercices",
      notions: ["income_statement"],
      tableau: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return {
          titre: "Les deux exercices joués, sans et avec la dépense",
          colonnes: ["Sans la dépense", "Avec la dépense"],
          lignes: [
            { libelle: "Maintenance du premier exercice", valeurs: [eur(r.arene.maintenanceSans), eur(r.arene.maintenanceAvec)] },
            { libelle: "Résultat avant impôt du premier exercice", valeurs: [eur(r.k.avantImpot1), eur(r.arene.avantImpot1)] },
            { libelle: "Déficit reportable à la clôture", valeurs: [eur(r.k.deficit), eur(r.arene.deficit)] },
            { libelle: "Résultat avant impôt du second exercice", valeurs: [eur(r.k.avantImpot2), eur(r.arene.avantImpot2)] },
            { libelle: "Impôt sur les sociétés du second exercice", valeurs: [eur(r.k.impot2), eur(r.arene.impot2)] },
          ],
        };
      },
      question: () => "D'après le tableau, calculez l'impôt du second exercice que la dépense a fait économiser dans l'arène, puis l'écart de résultat avant impôt du second exercice (avec la dépense, moins sans).",
      champs: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          { libelle: "Impôt du second exercice en moins", attendu: r.impot2EnMoins, calcul: `${eur(r.k.impot2)} − ${eur(r.arene.impot2)} = ${eur(r.impot2EnMoins)}`, tolerance: 1 },
          {
            libelle: "Écart de résultat du second exercice",
            attendu: r.ecartDuSecondExercice,
            calcul: `${eur(r.arene.avantImpot2)} − ${retranche(r.k.avantImpot2)} = ${eur(r.ecartDuSecondExercice)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        const ecart = Math.abs(r.ecartDuSecondExercice) >= 1;
        return [
          ecart
            ? `L'arène fait économiser ${eur(r.impot2EnMoins)} d'impôt sur le second exercice, pour ${eur(r.economie)} dans votre calcul : le second exercice n'a pas fini tout à fait pareil (${eur(r.ecartDuSecondExercice)} de résultat avant impôt), parce que la trésorerie a suivi un autre chemin, et les charges financières avec elle. L'essentiel de l'économie vient bien du déficit grossi.`
            : `L'arène retrouve votre calcul : ${eur(r.impot2EnMoins)} d'impôt en moins sur le second exercice. Le second exercice finit au même résultat avant impôt : seul le déficit a changé.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          {
            texte: `Attendre ne fait rien gagner : la dépense grossit le déficit, et l'impôt suivant baisse de ${eur(r.economie)}`,
            juste: r.verdict === "l-economie-attend",
            retour:
              r.verdict === "l-economie-attend"
                ? `Oui : faite cette année, la dépense ajoute ${eur(r.depense)} au déficit, qui retire autant au bénéfice taxé du second exercice ; l'impôt baisse de ${pct(r.k.tauxPct)} de la dépense, comme si elle avait été faite l'an prochain. L'économie d'impôt d'une charge n'est pas perdue l'année d'une perte : elle attend.`
                : `Non : le déficit grossi dépasse le bénéfice du second exercice, et une part de l'économie attend un exercice plus lointain.`,
          },
          {
            texte: "Vous avez raison : une charge passée l'année d'une perte n'économise aucun impôt, ni cette année ni les suivantes",
            juste: false,
            retour: `Non : la charge grossit le déficit, et le déficit fait baisser l'impôt de l'exercice suivant, ici de ${eur(r.economie)}.`,
          },
          {
            texte: "L'économie attendra plus loin : le second exercice ne suffit pas à absorber le déficit grossi",
            juste: r.verdict === "l-economie-attend-plus-loin",
            retour:
              r.verdict === "l-economie-attend-plus-loin"
                ? `Oui : le déficit grossi, ${eur(r.deficitAvec)}, dépasse le bénéfice du second exercice, ${eur(r.k.avantImpot2)}.`
                : `Non : le second exercice gagne ${eur(r.k.avantImpot2)}, plus que le déficit grossi, ${eur(r.deficitAvec)}, qui s'y impute en entier.`,
          },
        ];
      },
    },
  ],
};
