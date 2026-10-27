import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { anneeJouee, type Cas } from "../../cas";
import { L_IMPOT_SUR_LES_SOCIETES, impotDeLAnnee } from "../../chapitres/l-impot-sur-les-societes";
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
 * CAS PRATIQUE DU CHAPITRE « L'IMPÔT SUR LES SOCIÉTÉS » : LA DÉPENSE DE FIN D'ANNÉE (fiscalité de
 * l'entreprise, palier 3).
 *
 * Le gérant veut doubler la maintenance au dernier trimestre, « pour payer moins d'impôt », et croit
 * que la dépense ne coûtera presque rien. L'élève refait le calcul du chapitre sur le résultat
 * diminué de la dépense : l'impôt de l'exercice, l'impôt économisé, ce que la dépense coûte après
 * impôt. Une charge déductible ne fait économiser que le taux de l'impôt, et rien au-delà de
 * l'impôt de l'exercice. Tenue par le bon gestionnaire, l'année du cours gagne partout bien plus que
 * la dépense : le verdict « jusqu'à l'impôt » (la dépense dépasse le bénéfice, l'exercice passe en
 * perte) ne se lit plus dans aucune entreprise ; ses textes restent, justes, pour une autre année.
 *
 * L'arène rejoue l'année du cours avec le budget de maintenance du trimestre 4 doublé, la seule
 * décision changée (`rejouerAvec`). La maintenance ne change ni les ventes ni rien d'autre de ce
 * trimestre dans l'arène : le résultat avant impôt baisse exactement de la dépense, la garde le
 * vérifie, et l'impôt de l'arène suit le calcul.
 */

/** Le trimestre de la dépense : le dernier de l'exercice. */
export const TRIMESTRE_DE_LA_DEPENSE = 4;

/** L'année du cours, le budget de maintenance du trimestre de la dépense doublé. */
export const anneeAvecLaDepense = (code: string) =>
  rejouerAvec(code, "la-depense-de-fin-d-annee:maintenance-doublee", (t, d) =>
    t === TRIMESTRE_DE_LA_DEPENSE ? { ...d, maintenanceBudget: d.maintenanceBudget * 2 } : undefined,
  );

export type Verdict = "le-taux-seulement" | "jusqu-a-l-impot";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La dépense, l'impôt qu'elle fait économiser, et ce que l'arène en fait. */
export function depenseDeFinDAnnee(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const k = impotDeLAnnee(c);
  const sans = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const avec = anneeAvecLaDepense(c.code);
  const i = TRIMESTRE_DE_LA_DEPENSE - 1;
  // Doubler le budget, c'est dépenser une seconde fois la maintenance du trimestre.
  const depense = centime(sans[i]!.incomeStatement.maintenanceCost);
  const avantImpotAvec = centime(k.avantImpot - depense);
  const impotAvec = centime(k.taux * Math.max(0, avantImpotAvec));
  const economie = centime(k.impot - impotAvec);
  const cout = centime(depense - economie);
  const deficitCree = centime(Math.max(0, -avantImpotAvec));
  const lire = (annee: typeof sans) => ({
    maintenance: centime(annee.reduce((t, r) => t + r.incomeStatement.maintenanceCost, 0)),
    avantImpot: centime(annee.reduce((t, r) => t + r.incomeStatement.pretaxIncome, 0)),
    impot: centime(annee.reduce((t, r) => t + r.incomeStatement.tax, 0)),
    resultatNet: centime(annee.reduce((t, r) => t + r.incomeStatement.netIncome, 0)),
  });
  const a = lire(sans);
  const b = lire(avec);
  const verdict: Verdict = avantImpotAvec >= 0 ? "le-taux-seulement" : "jusqu-a-l-impot";
  return {
    k,
    depense,
    avantImpotAvec,
    impotAvec,
    economie,
    cout,
    deficitCree,
    sans: a,
    avec: b,
    impotEnMoins: centime(a.impot - b.impot),
    netEnMoins: centime(a.resultatNet - b.resultatNet),
    // La maintenance de plus, telle que l'arène l'a passée au trimestre de la dépense.
    maintenanceEnPlus: centime(avec[i]!.incomeStatement.maintenanceCost - sans[i]!.incomeStatement.maintenanceCost),
    verdict,
  };
}

const T = TRIMESTRE_DE_LA_DEPENSE;

export const LA_DEPENSE_DE_FIN_D_ANNEE: Situation = {
  code: "la-depense-de-fin-d-annee",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: [L_IMPOT_SUR_LES_SOCIETES.code],
  commanditaire: "Le gérant",
  titre: "La dépense de fin d'année",
  accroche:
    "Le gérant veut doubler la maintenance au dernier trimestre, pour payer moins d'impôt : la dépense ne coûterait presque rien. Ce qu'elle fait vraiment économiser, ce qu'elle coûte après impôt, et ce que l'arène en fait.",
  objectifs: [
    "Calculer l'impôt d'un exercice après une charge de plus",
    "Calculer l'impôt économisé par une charge déductible, et ce qu'elle coûte après impôt",
    "Dire pourquoi l'économie ne dépasse pas l'impôt de l'exercice",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: L_IMPOT_SUR_LES_SOCIETES.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `« Au trimestre ${T}, doublons le budget de maintenance : ${eur(r.depense)} de plus. C'est ${eur(r.depense)} de bénéfice en moins, donc autant d'impôt en moins. La dépense ne nous coûtera presque rien. »`,
          `Pas de cours cette fois : vous avez le résultat de l'exercice ${dE(c.entreprise)} sans la dépense, son impôt et le taux, et les calculs sont ceux du chapitre. L'arène a rejoué l'année avec le budget de maintenance du trimestre ${T} doublé.`,
        ];
      },
      tableau: (c) => {
        const r = depenseDeFinDAnnee(c);
        return {
          titre: `L'exercice ${dE(c.entreprise)}, sans la dépense`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Résultat avant impôt de l'exercice", valeurs: [eur(r.k.avantImpot)] },
            { libelle: "Impôt sur les sociétés de l'exercice", valeurs: [eur(r.k.impot)] },
            { libelle: `Budget de maintenance du trimestre ${T}`, valeurs: [eur(r.depense)] },
            { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(r.k.tauxPct)] },
          ],
        };
      },
      repere: () => "À rendre : l'impôt que la dépense fait économiser, ce qu'elle coûte après impôt, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "economie",
      type: "montants",
      titre: "L'impôt économisé",
      notions: ["income_statement"],
      question: () =>
        "Si la dépense ne change rien d'autre, calculez le résultat avant impôt de l'exercice avec la dépense, l'impôt de l'exercice avec la dépense (rien sur un exercice en perte), l'impôt économisé, puis ce que la dépense coûte après impôt.",
      champs: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          {
            libelle: "Résultat avant impôt avec la dépense",
            attendu: r.avantImpotAvec,
            calcul: `${eur(r.k.avantImpot)} − ${eur(r.depense)} = ${eur(r.avantImpotAvec)}`,
          },
          {
            libelle: "Impôt de l'exercice avec la dépense",
            attendu: r.impotAvec,
            calcul: r.avantImpotAvec > 0 ? `${eur(r.avantImpotAvec)} × ${pct(r.k.tauxPct)} = ${eur(r.impotAvec)}` : `un exercice en perte : pas d'impôt, ${eur(0)}`,
            tolerance: 1,
          },
          { libelle: "Impôt économisé", attendu: r.economie, calcul: `${eur(r.k.impot)} − ${eur(r.impotAvec)} = ${eur(r.economie)}`, tolerance: 1 },
          { libelle: "Coût de la dépense après impôt", attendu: r.cout, calcul: `${eur(r.depense)} − ${eur(r.economie)} = ${eur(r.cout)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          r.verdict === "le-taux-seulement"
            ? `L'impôt ne paie que ${pct(r.k.tauxPct)} de la dépense, ${eur(r.economie)} ; ${c.entreprise} paie le reste, ${eur(r.cout)}, sur son résultat net.`
            : `La dépense dépasse le bénéfice de l'exercice : l'impôt tombe à zéro, et l'économie s'arrête là, à ${eur(r.economie)}. L'exercice passe en perte de ${eur(r.deficitCree)}, un déficit qui n'économisera de l'impôt que sur un exercice suivant en bénéfice.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["income_statement"],
      tableau: (c) => {
        const r = depenseDeFinDAnnee(c);
        return {
          titre: "L'exercice joué, sans et avec la dépense",
          colonnes: ["Sans la dépense", "Avec la dépense"],
          lignes: [
            { libelle: "Maintenance de l'exercice", valeurs: [eur(r.sans.maintenance), eur(r.avec.maintenance)] },
            { libelle: "Résultat avant impôt", valeurs: [eur(r.sans.avantImpot), eur(r.avec.avantImpot)] },
            { libelle: "Impôt sur les sociétés", valeurs: [eur(r.sans.impot), eur(r.avec.impot)] },
            { libelle: "Résultat net", valeurs: [eur(r.sans.resultatNet), eur(r.avec.resultatNet)] },
          ],
        };
      },
      question: () => "D'après le tableau, calculez l'impôt que l'arène a prélevé en moins sur l'exercice, puis la baisse du résultat net.",
      champs: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          { libelle: "Impôt en moins sur l'exercice", attendu: r.impotEnMoins, calcul: `${eur(r.sans.impot)} − ${eur(r.avec.impot)} = ${eur(r.impotEnMoins)}`, tolerance: 1 },
          { libelle: "Baisse du résultat net", attendu: r.netEnMoins, calcul: `${eur(r.sans.resultatNet)} − ${retranche(r.avec.resultatNet)} = ${eur(r.netEnMoins)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `L'arène retrouve votre calcul : ${eur(r.impotEnMoins)} d'impôt en moins, et un résultat net qui baisse de ${eur(r.netEnMoins)}, ce que la dépense coûte après impôt. La maintenance du trimestre ${T} n'a rien fait vendre de plus.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          {
            texte: `La dépense coûte ${eur(r.cout)} après impôt : l'impôt n'en paie que ${pct(r.k.tauxPct)}`,
            juste: r.verdict === "le-taux-seulement",
            retour:
              r.verdict === "le-taux-seulement"
                ? `Oui : ${eur(r.depense)} de maintenance en plus font ${eur(r.economie)} d'impôt en moins, et ${eur(r.cout)} de résultat net en moins. Une charge déductible ne coûte pas rien : elle coûte son montant, moins ${pct(r.k.tauxPct)}.`
                : `Non : la dépense dépasse le bénéfice, et l'impôt économisé, ${eur(r.economie)}, est moins de ${pct(r.k.tauxPct)} de la dépense.`,
          },
          {
            texte: "La dépense ne coûte presque rien : chaque euro de maintenance en plus fait un euro d'impôt en moins, jusqu'au dernier",
            juste: false,
            retour: `Non : un euro de charge en plus retire un euro au bénéfice, et seulement ${pct(r.k.tauxPct)} à l'impôt. Ici, ${eur(r.depense)} de dépense font ${eur(r.economie)} d'impôt en moins.`,
          },
          {
            texte: `L'impôt n'en paie que ${eur(r.economie)} : l'exercice passe en perte, le reste devient un déficit à reporter`,
            juste: r.verdict === "jusqu-a-l-impot",
            retour:
              r.verdict === "jusqu-a-l-impot"
                ? `Oui : la dépense, ${eur(r.depense)}, dépasse le bénéfice de l'exercice, ${eur(r.k.avantImpot)}. L'impôt tombe à zéro, l'économie s'arrête à l'impôt de l'exercice, et ${eur(r.deficitCree)} de perte se reportent : ils n'économiseront de l'impôt que sur un exercice suivant en bénéfice.`
                : `Non : l'exercice reste en bénéfice avec la dépense, ${eur(r.avantImpotAvec)}, et rien ne se reporte.`,
          },
        ];
      },
    },
  ],
};
