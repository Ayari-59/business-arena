import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_EN_DEFICIT, LE_DEFICIT_REPORTE, deficitDePixel, exercicesChanges, suiteDe } from "../../chapitres/le-deficit-reporte";
import { DEPENSE_DE_L_ANNEE_EN_PERTE, RANG_DE_L_EXERCICE_EN_PERTE, TAUX_NORMAL } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DÉFICIT REPORTÉ » : LA DÉPENSE DE L'ANNÉE EN PERTE (fiscalité de
 * l'entreprise, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, sur les exercices de PIXEL & CO (monde/projets-et-financement.ts).
 * L'année N finit en perte. Le gérant veut repousser à N+1 une révision de l'entrepôt
 * (DEPENSE_DE_L_ANNEE_EN_PERTE, 5 000 €) : « cette année, nous ne payons pas d'impôt, la dépense ne
 * nous ferait rien économiser ». L'élève croise les deux calendriers : faite en N, la dépense grossit
 * le déficit, qui fait baisser l'impôt de N+2 de 25 % de son montant ; faite en N+1, elle fait baisser
 * le bénéfice de N+1, déjà effacé par le déficit, et l'économie arrive aussi en N+2. Le report en
 * arrière n'y change rien : la créance est bornée par le bénéfice de N−1. Le curseur montre jusqu'où
 * une dépense de N reste absorbée d'ici N+2 (15 000 €). La réponse demande un jugement : attendre ne
 * fait rien gagner.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le grand entretien et les deux exercices rejoués, la révision ajoutée
 * au trimestre 4, et le verdict « l'économie attend plus loin », qui ne se lisait dans aucune
 * entreprise.
 */

/** Les bornes du curseur de la dépense de N, en euros. */
export const DEPENSE_DU_CURSEUR = { min: 0, max: 30_000 } as const;

export type Verdict = "attendre-ne-gagne-rien" | "attendre-gagne";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const T = pct(TAUX_NORMAL * 100);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const N = RANG_DE_L_EXERCICE_EN_PERTE;

/** La dépense faite en N ou en N+1 : le déficit, l'impôt de N+2, la créance. */
export function depenseDeLAnneeEnPerte(c: Pick<Cas, "code">) {
  const x = deficitDePixel(c);
  const depense = DEPENSE_DE_L_ANNEE_EN_PERTE;
  const enN = suiteDe(exercicesChanges(x.ex, { chargeEnN: depense }), false);
  const enN1 = suiteDe(exercicesChanges(x.ex, { chargeEnN1: depense }), false);
  const enNAvecLArriere = suiteDe(exercicesChanges(x.ex, { chargeEnN: depense }), true);
  const impotN2 = (s: typeof enN) => s.exercices[N + 2]!.impot;
  const economieEnN = auCentime(x.impotN2 - impotN2(enN));
  const economieEnN1 = auCentime(x.impotN2 - impotN2(enN1));
  const verdict: Verdict = economieEnN >= economieEnN1 ? "attendre-ne-gagne-rien" : "attendre-gagne";
  return {
    x,
    depense,
    deficitAvec: auCentime(x.deficit + depense),
    restantApresN1: enN.exercices[N + 1]!.deficitRestant,
    impotN2EnN: impotN2(enN),
    economieEnN,
    resultatFiscalN1EnN1: enN1.exercices[N + 1]!.resultatFiscal,
    impotN1EnN1: enN1.exercices[N + 1]!.impot,
    impotN2EnN1: impotN2(enN1),
    economieEnN1,
    creanceAvec: enNAvecLArriere.exercices[N]!.creanceNee,
    /** La plus grande dépense de N que N+1 et N+2 absorbent encore : leurs bénéfices moins le déficit. */
    depenseAbsorbable: auCentime(x.absorbable - x.deficit),
    verdict,
  };
}

export const LA_DEPENSE_DE_L_ANNEE_EN_PERTE: Situation = {
  code: "la-depense-de-l-annee-en-perte",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: [LE_DEFICIT_REPORTE.code],
  commanditaire: "Le gérant",
  titre: "La dépense de l'année en perte",
  accroche:
    "L'année finit en perte, et le gérant veut repousser une révision de l'entrepôt à l'an prochain, où elle ferait baisser l'impôt. Faite cette année ou l'an prochain : ce qu'elle fait économiser, et quand.",
  objectifs: [
    "Calculer le déficit après une charge de plus, et l'impôt des exercices qui l'absorbent",
    "Comparer l'économie d'une charge passée l'année de la perte ou l'année suivante",
    "Dire ce que le report en arrière change, ou ne change pas",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_EN_DEFICIT, pourquoi: LE_DEFICIT_REPORTE.entreprises!.pourquoi },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Ce que propose le gérant",
      texte: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          `« La révision de l'entrepôt coûte ${eur(r.depense)}. Cette année, nous sommes en perte : nous ne payons pas d'impôt, la dépense ne nous ferait rien économiser. Repoussons-la en janvier : l'an prochain, nous serons en bénéfice, et elle fera baisser notre impôt. »`,
          `Pas de cours cette fois : vous avez les exercices ${dE(r.x.entreprise)} du chapitre, et les calculs sont ceux du chapitre. La révision ne change ni les ventes ni rien d'autre, quelle que soit l'année où elle est faite.`,
        ];
      },
      tableau: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        const x = r.x;
        return {
          titre: `Les exercices ${dE(x.entreprise)}, sans la révision`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Bénéfice fiscal de N−1, mis en réserve", valeurs: [eur(x.rf[N - 1]!)] },
            { libelle: "Déficit fiscal de N", valeurs: [eur(x.deficit)] },
            { libelle: "Bénéfice fiscal de N+1", valeurs: [eur(x.rf[N + 1]!)] },
            { libelle: "Bénéfice fiscal de N+2", valeurs: [eur(x.rf[N + 2]!)] },
            { libelle: "Impôt de N+2, déficit reporté en avant", valeurs: [eur(x.impotN2)] },
            { libelle: "Taux de l'impôt", valeurs: [T] },
            { libelle: "La révision de l'entrepôt", valeurs: [eur(r.depense)] },
          ],
        };
      },
      repere: () => "À rendre : ce que la révision fait économiser faite cette année, et faite l'an prochain, ce que change le report en arrière, et votre réponse.",
    },
    {
      id: "faite-en-n",
      type: "montants",
      titre: "La révision faite cette année",
      notions: ["income_statement"],
      question: () => "Si la révision est faite en N et ne change rien d'autre, calculez le déficit de N, le déficit qui reste après N+1, l'impôt de N+2, puis l'impôt que la révision fait économiser.",
      champs: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        const x = r.x;
        return [
          { libelle: "Déficit de N avec la révision", attendu: r.deficitAvec, calcul: `${eur(x.deficit)} + ${eur(r.depense)} = ${eur(r.deficitAvec)}` },
          { libelle: "Déficit qui reste après N+1", attendu: r.restantApresN1, calcul: `${eur(r.deficitAvec)} − ${eur(x.rf[N + 1]!)} = ${eur(r.restantApresN1)}` },
          { libelle: "Impôt de N+2", attendu: r.impotN2EnN, calcul: `(${eur(x.rf[N + 2]!)} − ${eur(r.restantApresN1)}) × ${T} = ${eur(r.impotN2EnN)}` },
          { libelle: "Impôt économisé", attendu: r.economieEnN, calcul: `${eur(x.impotN2)} − ${eur(r.impotN2EnN)} = ${eur(r.economieEnN)}` },
        ];
      },
      explication: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [`La révision ne fait rien économiser en N, mais elle grossit le déficit de ${eur(r.depense)}, et le déficit fait baisser l'impôt de N+2 de ${T} de ce montant, ${eur(r.economieEnN)}. L'économie n'est pas perdue : elle attend.`];
      },
    },
    {
      id: "faite-en-n1",
      type: "montants",
      titre: "La révision repoussée",
      notions: ["income_statement", "balance_sheet"],
      question: () =>
        "Croisez avec le calendrier du gérant : la révision faite en N+1, le déficit de N inchangé. Calculez le bénéfice fiscal de N+1, l'impôt de N+1, l'impôt de N+2, puis la créance qu'aurait donnée le report en arrière, la révision faite en N.",
      champs: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        const x = r.x;
        return [
          { libelle: "Bénéfice fiscal de N+1 avec la révision", attendu: r.resultatFiscalN1EnN1, calcul: `${eur(x.rf[N + 1]!)} − ${eur(r.depense)} = ${eur(r.resultatFiscalN1EnN1)}` },
          { libelle: "Impôt de N+1", attendu: r.impotN1EnN1, calcul: `${eur(r.resultatFiscalN1EnN1)}, moins que le déficit de ${eur(x.deficit)} : rien d'imposable, ${eur(r.impotN1EnN1)}` },
          {
            libelle: "Impôt de N+2 avec la révision en N+1",
            attendu: r.impotN2EnN1,
            calcul: `(${eur(x.rf[N + 2]!)} − (${eur(x.deficit)} − ${eur(r.resultatFiscalN1EnN1)})) × ${T} = ${eur(r.impotN2EnN1)}`,
          },
          {
            libelle: "Créance de report en arrière, la révision faite en N",
            attendu: r.creanceAvec,
            calcul: `${T} du plus petit du déficit (${eur(r.deficitAvec)}) et du bénéfice de N−1 (${eur(x.rf[N - 1]!)}) = ${eur(r.creanceAvec)}`,
          },
        ];
      },
      explication: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          `Repoussée en N+1, la révision fait baisser un bénéfice que le déficit efface déjà : N+1 ne paie rien de toute façon. Le déficit restant, plus grand de ${eur(r.depense)}, fait baisser l'impôt de N+2 : ${eur(r.impotN2EnN1)}, comme la révision faite en N. Les deux calendriers économisent ${eur(r.economieEnN)}, la même année.`,
          `Le report en arrière ne départage pas non plus : la créance reste de ${eur(r.creanceAvec)}, bornée par le bénéfice de N−1, et la révision s'ajoute au déficit reporté en avant.`,
        ];
      },
    },
    {
      id: "le-deficit-au-curseur",
      type: "curseur",
      titre: "Jusqu'où le déficit est absorbé",
      notions: ["income_statement"],
      question: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return `Et si la dépense de N était plus grosse ? Faites-la varier de ${eur(DEPENSE_DU_CURSEUR.min)} à ${eur(DEPENSE_DU_CURSEUR.max)}. Une droite donne les bénéfices fiscaux de N+1 et N+2 (${eur(r.x.absorbable)}), l'autre le déficit de N avec la dépense. Placez le curseur sur la plus grande dépense que N+1 et N+2 absorbent encore en entier, puis validez.`;
      },
      grandeur: () => ({ libelle: "Dépense de N", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: depenseDeLAnneeEnPerte(c).depenseAbsorbable, min: DEPENSE_DU_CURSEUR.min, max: DEPENSE_DU_CURSEUR.max }),
      zones: ["Économisée d'ici N+2", "Une part attend après N+2"],
      rates: () => ({
        dessous: "N+1 et N+2 absorbent encore une dépense plus grande : cherchez la plus grande.",
        dessus: "À cette position, une part du déficit attend encore après N+2.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, d) => {
        const r = depenseDeLAnneeEnPerte(c);
        const s = suiteDe(exercicesChanges(r.x.ex, { chargeEnN: d }), false);
        return [
          { libelle: "Déficit de N", montant: auCentime(r.x.deficit + d) },
          { libelle: "Déficit qui attend encore après N+2", montant: s.deficitRestant },
          { libelle: "Impôt de N+2", montant: s.exercices[N + 2]!.impot },
          { libelle: "Impôt économisé d'ici N+2", montant: auCentime(r.x.impotN2 - s.exercices[N + 2]!.impot), fort: true },
        ];
      },
      droites: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return { produit: () => r.x.absorbable, cout: (d) => r.x.deficit + d, libelles: ["Bénéfices fiscaux de N+1 et N+2", "Déficit de N avec la dépense"] };
      },
      explication: (c) => {
        const r = depenseDeLAnneeEnPerte(c);
        return [
          `Jusqu'à ${eur(r.depenseAbsorbable)}, chaque euro dépensé en N fait économiser ${T} d'impôt en N+2. Au-delà, l'impôt de N+2 est déjà nul : le reste attend les exercices suivants, sans être perdu. La révision, ${eur(r.depense)}, est loin de cette limite.`,
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
            texte: `Attendre ne fait rien gagner : ${eur(r.economieEnN)} d'impôt en moins en N+2 dans les deux cas`,
            juste: r.verdict === "attendre-ne-gagne-rien",
            retour:
              r.verdict === "attendre-ne-gagne-rien"
                ? `Oui : faite en N, la révision grossit le déficit ; faite en N+1, elle baisse un bénéfice que le déficit efface déjà. Dans les deux cas, l'impôt de N+2 baisse de ${eur(r.economieEnN)}. Si la révision est utile maintenant, rien ne justifie de la repousser.`
                : `Non : repoussée, la révision ferait économiser ${eur(r.economieEnN1)}.`,
          },
          {
            texte: "Vous avez raison : une charge de l'année en perte n'économise aucun impôt, ni cette année ni plus tard",
            juste: false,
            retour: `Non : la charge grossit le déficit, et le déficit fait baisser l'impôt de N+2 de ${eur(r.economieEnN)}.`,
          },
          {
            texte: `Repoussez-la : en N+1, elle fera économiser ${eur(r.economieEnN)} dès N+1`,
            juste: r.verdict === "attendre-gagne",
            retour: `Non : N+1 ne paie déjà rien, son bénéfice est effacé par le déficit. L'économie arrive en N+2, comme si la révision était faite en N.`,
          },
          {
            texte: `Faites-la en N : le report en arrière vous rendra ${eur(r.economieEnN)} de plus dès la clôture`,
            juste: false,
            retour: `Non : la créance reste de ${eur(r.creanceAvec)}, bornée par le bénéfice de N−1. Le déficit en plus se reporte en avant.`,
          },
        ];
      },
    },
  ],
};
