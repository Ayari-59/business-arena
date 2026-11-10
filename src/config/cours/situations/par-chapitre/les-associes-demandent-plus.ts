import { arrondi2, eur, pct } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_LA_PERFORMANCE } from "../../chapitres/la-performance-globale";
import { HYPOTHESES_DE_LA_PERFORMANCE, partageDuBenefice, performanceDeNova } from "../../monde/performance-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PERFORMANCE GLOBALE AU TABLEAU DE BORD » : LES ASSOCIÉS DEMANDENT PLUS
 * (Bac STMG, SGN de première, palier 1).
 *
 * Un associé demande 40 000 € de dividendes (DIVIDENDE_DEMANDE, hypothèse du cas). La seconde ligne coûte
 * ce que le président voulait autofinancer, 80 000 € : ce qui manquera s'empruntera. Les calculs sont
 * ceux du chapitre (l'autofinancement qui reste, la part distribuée).
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part du bénéfice distribuée se donnait au dixième de
 * point, elle est à deux décimales ; les montants au centime.
 */


export const DIVIDENDE_DEMANDE = 40_000;

export function lesAssociesDemandentPlus() {
  const k = partageDuBenefice(DIVIDENDE_DEMANDE);
  const manque = Math.max(0, arrondi2(HYPOTHESES_DE_LA_PERFORMANCE.autofinancementVoulu - k.autofinancement));
  return { ...k, manque };
}

export const LES_ASSOCIES_DEMANDENT_PLUS: Situation = {
  code: "les-associes-demandent-plus",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["la-performance-globale"],
  commanditaire: "Le président",
  titre: "Les associés demandent plus",
  accroche: "Un associé demande un dividende plus gros. La seconde ligne de montage devait être payée par l'autofinancement. Ce que coûterait de le suivre.",
  objectifs: ["Chiffrer l'autofinancement qui reste après un dividende", "Mesurer ce qu'il faudrait emprunter", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PERFORMANCE,
    pourquoi: "le cas reprend l'année N de NOVA du chapitre, son bénéfice et sa capacité d'autofinancement.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const p = performanceDeNova();
        return [
          `« Un associé demande ${eur(DIVIDENDE_DEMANDE)} de dividendes sur un bénéfice de ${eur(p.resultatNet)}. Notre capacité d'autofinancement est de ${eur(p.caf)}, et la seconde ligne coûte ${eur(HYPOTHESES_DE_LA_PERFORMANCE.autofinancementVoulu)}. Si je le suis, combien me faudra-t-il emprunter ? » Le président`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la part du bénéfice distribuée, l'autofinancement qui reste, ce qu'il faudrait emprunter, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Ce qui reste, ce qui manque",
      notions: ["profitability_vs_return"],
      question: () => "Calculez la part du bénéfice distribuée (à deux décimales), l'autofinancement qui reste, et ce qu'il faudrait emprunter pour payer la seconde ligne.",
      champs: () => {
        const p = performanceDeNova();
        const k = lesAssociesDemandentPlus();
        return [
          { libelle: "Part du bénéfice distribuée (%)", attendu: k.partDistribueePct, calcul: `${eur(DIVIDENDE_DEMANDE)} ÷ ${eur(p.resultatNet)} × 100 = ${pct(k.partDistribueePct)}` },
          { libelle: "Autofinancement qui reste", attendu: k.autofinancement, calcul: `${eur(p.caf)} − ${eur(DIVIDENDE_DEMANDE)} = ${eur(k.autofinancement)}` },
          { libelle: "À emprunter pour la ligne", attendu: k.manque, calcul: `${eur(HYPOTHESES_DE_LA_PERFORMANCE.autofinancementVoulu)} − ${eur(k.autofinancement)} = ${eur(k.manque)}` },
        ];
      },
      explication: () => {
        const k = lesAssociesDemandentPlus();
        return [`Verser ${pct(k.partDistribueePct)} du bénéfice laisse ${eur(k.autofinancement)} : il faudrait emprunter ${eur(k.manque)}, et payer des intérêts.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = lesAssociesDemandentPlus();
        return [
          {
            texte: `Il faudrait emprunter ${eur(k.manque)} : un dividende plus bas évite la dette`,
            juste: k.manque > 0,
            retour: k.manque > 0 ? `Oui : la performance financière pour les associés aujourd'hui se paierait d'une dette pour l'entreprise. Un dividende de ${eur(HYPOTHESES_DE_LA_PERFORMANCE.dividendeVoulu)} garde la ligne autofinancée.` : "Non : l'autofinancement suffit.",
          },
          {
            texte: "Rien à emprunter : le bénéfice de l'année est assez grand pour payer la ligne et le dividende",
            juste: k.manque === 0,
            retour: k.manque > 0 ? `Non : une fois les ${eur(DIVIDENDE_DEMANDE)} versés, l'autofinancement ne couvre plus la ligne.` : "Oui : l'autofinancement suffit.",
          },
          {
            texte: "Verser le dividende et renoncer à la seconde ligne, qui ne sert que le président",
            juste: false,
            retour: "Non : la ligne sert la performance commerciale de demain, et donc les associés eux-mêmes. Il s'agit d'arbitrer, pas de renoncer.",
          },
        ];
      },
    },
  ],
};
