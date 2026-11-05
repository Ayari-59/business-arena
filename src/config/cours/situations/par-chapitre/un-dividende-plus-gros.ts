import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_CAPITAUX_PROPRES } from "../../chapitres/les-capitaux-propres";
import { auCentime } from "../../monde/amortissement";
import { DIVIDENDE_PROPOSE_DU_CAS, INTERET_STATUTAIRE, affectationDeNova } from "../../monde/capitaux-propres";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES CAPITAUX PROPRES : CONSTITUER, AUGMENTER, AFFECTER » : UN DIVIDENDE
 * PLUS GROS (comptabilité générale, palier 4 ; BTS CG P2, 2.5.1 et 2.5.2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre (monde/capitaux-propres.ts) : le bénéfice
 * de N de NOVA, sa réserve légale et l'intérêt statutaire de ses statuts. Avant l'assemblée de juin
 * N + 1, une actionnaire propose un dividende plus haut que celui du projet (DIVIDENDE_PROPOSE_DU_CAS)
 * en gardant les réserves facultatives. L'élève refait seul le projet, constate qu'il dépasse le
 * bénéfice distribuable, trouve les réserves facultatives qui le rendent possible, passe
 * l'affectation corrigée et répond au président.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres du cas : le projet de l'actionnaire, puis le projet corrigé. */
export function dividendePlusGros() {
  const projet = affectationDeNova();
  const propose = affectationDeNova(DIVIDENDE_PROPOSE_DU_CAS, projet.reservesFacultatives);
  const corrige = affectationDeNova(DIVIDENDE_PROPOSE_DU_CAS, propose.reservesAuPlus);
  return { projet, propose, corrige, manque: auCentime(-propose.reportANouveau) };
}

export const UN_DIVIDENDE_PLUS_GROS: Situation = {
  code: "un-dividende-plus-gros",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-capitaux-propres"],
  commanditaire: "Le président de NOVA",
  titre: "Un dividende plus gros",
  accroche: "Une actionnaire veut un dividende plus haut, sans toucher aux réserves facultatives. Le bénéfice distribuable le permet-il ? Refaites le projet, corrigez-le et passez l'affectation.",
  objectifs: [
    "Calculer un dividende en intérêt statutaire et superdividende",
    "Comparer un projet d'affectation au bénéfice distribuable",
    "Enregistrer une affectation corrigée et la justifier",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_CAPITAUX_PROPRES,
    pourquoi: "ce cas reprend le chapitre « Les capitaux propres », qui suit l'assemblée de NOVA en juin N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'actionnaire",
      texte: () => {
        const n = dividendePlusGros();
        return [
          `« ${eur(n.projet.dividendeParAction)} par action, c'est trop peu pour une si belle année. Je propose ${eur(DIVIDENDE_PROPOSE_DU_CAS)}, et l'on garde les ${eur(n.projet.reservesFacultatives)} de réserves facultatives. » Le président vous demande si la proposition tient, et sinon ce qu'il faudrait changer.`,
          "Pas de cours cette fois : vous avez les chiffres du projet.",
        ];
      },
      tableau: () => {
        const x = dividendePlusGros().projet;
        return {
          titre: "NOVA, l'affectation du bénéfice de N",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Bénéfice de N", valeurs: [eur(x.benefice)] },
            { libelle: "Capital libéré", valeurs: [`${eur(x.capital)}, en ${qte(x.actions)} actions`] },
            { libelle: "Réserve légale", valeurs: [eur(x.reserveLegale)] },
            { libelle: "Intérêt statutaire", valeurs: [`${pct(INTERET_STATUTAIRE)} du capital libéré`] },
            { libelle: "Report à nouveau antérieur", valeurs: [eur(x.reportAnterieur)] },
          ],
        };
      },
      repere: () => "À rendre : le dividende proposé et ses deux parts, ce qui manque au bénéfice distribuable, l'affectation corrigée et votre réponse.",
    },
    {
      id: "le-dividende-propose",
      objectifs: [0],
      type: "montants",
      titre: "Le dividende proposé",
      notions: ["income_statement"],
      question: () => `Calculez le dividende total proposé, l'intérêt statutaire, puis le superdividende par action.`,
      champs: () => {
        const x = dividendePlusGros().propose;
        return [
          { libelle: "Dividende total", attendu: x.dividendes, calcul: `${eur(DIVIDENDE_PROPOSE_DU_CAS)} × ${qte(x.actions)} = ${eur(x.dividendes)}` },
          { libelle: "Intérêt statutaire", attendu: x.interetStatutaire, calcul: `${eur(x.capital)} × ${pct(INTERET_STATUTAIRE)} = ${eur(x.interetStatutaire)}` },
          { libelle: "Superdividende par action", attendu: x.superdividendeParAction, calcul: `(${eur(x.dividendes)} − ${eur(x.interetStatutaire)}) ÷ ${qte(x.actions)} = ${eur(x.superdividendeParAction)}` },
        ];
      },
      explication: () => {
        const x = dividendePlusGros().propose;
        return [`L'intérêt statutaire ne change pas avec la proposition : seul le superdividende monte, à ${eur(x.superdividendeParAction)} par action.`];
      },
    },
    {
      id: "ce-qui-manque",
      objectifs: [1],
      type: "montants",
      titre: "Face au bénéfice distribuable",
      notions: ["income_statement", "balance_sheet"],
      question: () => "Calculez le bénéfice distribuable, ce qui manquerait pour payer le dividende proposé et garder toutes les réserves facultatives, puis les réserves facultatives les plus fortes que ce dividende laisse possibles.",
      champs: () => {
        const n = dividendePlusGros();
        const x = n.propose;
        return [
          { libelle: "Bénéfice distribuable", attendu: x.distribuable, calcul: `${eur(x.benefice)} − ${eur(x.reserveLegale)} + ${eur(x.reportAnterieur)} = ${eur(x.distribuable)}` },
          { libelle: "Ce qui manque", attendu: n.manque, calcul: `${eur(x.dividendes)} + ${eur(x.reservesFacultatives)} − ${eur(x.distribuable)} = ${eur(n.manque)}` },
          { libelle: "Réserves facultatives au plus", attendu: x.reservesAuPlus, calcul: `${eur(x.distribuable)} − ${eur(x.dividendes)} = ${eur(x.reservesAuPlus)}` },
        ];
      },
      explication: () => {
        const n = dividendePlusGros();
        return [`L'assemblée ne peut pas affecter plus que le bénéfice distribuable : il manque ${eur(n.manque)}. Avec ce dividende, les réserves facultatives ne peuvent pas dépasser ${eur(n.propose.reservesAuPlus)}, et le report à nouveau tombe à zéro.`];
      },
    },
    {
      id: "l-affectation-corrigee",
      objectifs: [2],
      type: "ecriture",
      titre: "L'affectation corrigée, au journal",
      notions: ["balance_sheet"],
      evenement: () => "L'assemblée retient le dividende proposé et réduit les réserves facultatives à ce qui reste. Passez l'affectation du bénéfice.",
      ecriture: () => {
        const x = dividendePlusGros().corrige;
        return {
          date: "15 juin",
          libelle: "Affectation du résultat de N, projet corrigé",
          lignes: [
            { role: "le résultat, qui se solde", compte: "120", sens: "debit", montant: x.benefice, indice: "tout le bénéfice" },
            { role: "la réserve légale", compte: "1061", sens: "credit", montant: x.reserveLegale, indice: "la part de la loi" },
            { role: "les réserves facultatives", compte: "1068", sens: "credit", montant: x.reservesFacultatives, indice: "ce que le dividende laisse" },
            { role: "les dividendes dus aux associés", compte: "457", sens: "credit", montant: x.dividendes, indice: "le dividende total" },
          ],
        };
      },
      indices: () => ["Le résultat au débit, pour tout le bénéfice.", "Au crédit, les deux réserves et la dette de dividendes ; il ne reste rien en report à nouveau."],
      explication: () => {
        const n = dividendePlusGros();
        return [`Les capitaux propres après répartition tomberaient à ${eur(n.corrige.capitauxPropresApres)}, contre ${eur(n.projet.capitauxPropresApres)} avec le projet du président : la différence part en dividendes.`];
      },
    },
    {
      id: "reponse",
      objectifs: [1, 2],
      type: "choix",
      titre: "Votre réponse au président",
      notions: ["balance_sheet", "net_treasury"],
      question: () => {
        const n = dividendePlusGros();
        return `La proposition demande ${eur(n.propose.dividendes)} de dividendes et ${eur(n.projet.reservesFacultatives)} de réserves facultatives, pour ${eur(n.propose.distribuable)} de bénéfice distribuable. Que répondez-vous ?`;
      },
      options: () => {
        const n = dividendePlusGros();
        const ecart = Math.round((n.propose.dividendes - n.projet.dividendes) * 100) / 100;
        return [
          {
            texte: `Impossible telle quelle : il manque ${eur(n.manque)}`,
            juste: true,
            retour: `Oui. Le dividende est possible si les réserves facultatives tombent à ${eur(n.propose.reservesAuPlus)} ; il ferait sortir ${eur(ecart)} de plus que le projet, l'argent que NOVA garde pour sa seconde ligne.`,
          },
          {
            texte: "Possible : la réserve légale peut payer le complément du dividende",
            juste: false,
            retour: "Non : la réserve légale ne se distribue pas. Elle protège les créanciers, et la loi l'interdit au dividende.",
          },
          {
            texte: `Possible : le bénéfice de ${eur(n.propose.benefice)} couvre largement les deux montants`,
            juste: false,
            retour: `Non : c'est le bénéfice distribuable qui borne l'affectation, après la réserve légale : ${eur(n.propose.distribuable)}.`,
          },
        ];
      },
    },
  ],
};
