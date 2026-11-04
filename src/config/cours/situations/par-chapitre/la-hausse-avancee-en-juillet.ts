import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_MASSE_SALARIALE, masseDuChapitre } from "../../chapitres/la-masse-salariale-previsionnelle";
import { auCentime } from "../../monde/amortissement";
import { ENVELOPPE_DE_L_EFFET_DE_MASSE, HYPOTHESES_DU_BUDGET, budgetDeLaMasse, effetsDesHausses, type HausseGenerale } from "../../monde/masse-salariale-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA MASSE SALARIALE PRÉVISIONNELLE ET SES ÉCARTS » : LA HAUSSE AVANCÉE EN
 * JUILLET (contrôle de gestion, palier 4).
 *
 * Le délégué des opérateurs demande que la seconde hausse de 2 % tombe le 1er juillet au lieu du
 * 1er octobre (MOIS_DEMANDE). L'élève chiffre les trois effets de cette politique, ce qu'elle coûte au
 * budget de N + 1, salarié par salarié, et répond au regard de l'enveloppe de la direction (2,6 %).
 * Comme son chapitre, le cas se joue dans le monde du cours : `budgetDeLaMasse` et `effetsDesHausses`
 * calculent chaque hypothèse, le mois de la hausse en levier.
 */

/** Le mois que demande le délégué pour la seconde hausse : juillet. */
export const MOIS_DEMANDE = 7;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 1e4) / 100 + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres du cas : la politique du budget, celle que demande le délégué, et leur écart. */
export function hausseEnJuillet(c: Pick<Cas, "code">) {
  const x = masseDuChapitre(c);
  const hausses: HausseGenerale[] = [x.h1, { mois: MOIS_DEMANDE, taux: x.h2.taux }];
  const effets = effetsDesHausses(hausses);
  const budget = budgetDeLaMasse({ ...HYPOTHESES_DU_BUDGET, hausses });
  return {
    x,
    hausses,
    effets,
    budget,
    surcoutBrut: auCentime(budget.brute - x.budget.brute),
    surcoutCharge: auCentime(budget.chargee - x.budget.chargee),
    dansLEnveloppe: effets.masse <= 1 + ENVELOPPE_DE_L_EFFET_DE_MASSE + 1e-9,
  };
}

export const LA_HAUSSE_AVANCEE_EN_JUILLET: Situation = {
  code: "la-hausse-avancee-en-juillet",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["la-masse-salariale-previsionnelle"],
  commanditaire: "Le délégué des opérateurs",
  titre: "La hausse avancée en juillet",
  accroche: "Le délégué des opérateurs demande la seconde hausse dès juillet : même taux, un trimestre plus tôt. Que coûte ce changement de date, et tient-il dans l'enveloppe ?",
  objectifs: [
    "Calculer les effets de niveau, de masse et de report d'une hausse avancée",
    "Chiffrer ce que la nouvelle date coûte au budget de la masse salariale",
    "Rendre une réponse qui tienne compte de l'enveloppe et de l'année suivante",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_MASSE_SALARIALE,
    pourquoi: "ce cas reprend le chapitre « La masse salariale prévisionnelle et ses écarts », qui se calcule sur l'équipe de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du délégué",
      texte: (c) => {
        const n = hausseEnJuillet(c);
        return [
          `« Vous nous accordez ${pct(n.x.h2.taux)} en octobre. Donnez-les-nous en juillet : c'est le même taux, et l'équipe le touchera plus tôt. Pour vous, cela ne change pas grand-chose. »`,
          `Pas de cours cette fois : vous avez le budget de N + 1 et la méthode du chapitre. La direction tient à son enveloppe : les hausses ne font pas monter la masse de l'équipe de plus de ${pct(ENVELOPPE_DE_L_EFFET_DE_MASSE)}.`,
        ];
      },
      tableau: (c) => {
        const n = hausseEnJuillet(c);
        return {
          titre: "La politique du budget et celle que demande le délégué",
          colonnes: ["Budget", "Demande"],
          lignes: [
            { libelle: "Première hausse", valeurs: [`${pct(n.x.h1.taux)} le 1er janvier`, `${pct(n.x.h1.taux)} le 1er janvier`] },
            { libelle: "Seconde hausse", valeurs: [`${pct(n.x.h2.taux)} le 1er octobre`, `${pct(n.x.h2.taux)} le 1er juillet`] },
            { libelle: "Masse brute de N + 1", valeurs: [eur(n.x.budget.brute), "à calculer"] },
          ],
        };
      },
      repere: () => "À rendre : les trois effets de la demande, ce qu'elle coûte au budget de N + 1, et votre réponse.",
    },
    {
      id: "les-effets-en-juillet",
      type: "montants",
      titre: "Les trois effets en juillet",
      notions: ["payroll"],
      question: () =>
        "Base 100 en décembre N. Calculez, avec la seconde hausse en juillet, l'effet de niveau, l'effet de masse (somme des indices ÷ 1 200) et l'effet de report sur N + 2 (12 × indice de décembre ÷ somme des indices), en pour cent, au centième.",
      champs: (c) => {
        const e = hausseEnJuillet(c).effets;
        return [
          { libelle: "Effet de niveau (%)", attendu: auCentieme((e.niveau - 1) * 100), tolerance: 0.01, calcul: `${e.decembre.toLocaleString("fr-FR")} ÷ 100, soit +${pct(e.niveau - 1)}` },
          { libelle: "Effet de masse (%)", attendu: auCentieme((e.masse - 1) * 100), tolerance: 0.01, calcul: `(${MOIS_DEMANDE - 1} × ${e.indices[0]!.toLocaleString("fr-FR")} + ${13 - MOIS_DEMANDE} × ${e.decembre.toLocaleString("fr-FR")}) ÷ 1 200 = ${e.cumul.toLocaleString("fr-FR")} ÷ 1 200, soit +${pct(e.masse - 1)}` },
          { libelle: "Effet de report sur N + 2 (%)", attendu: auCentieme((e.report - 1) * 100), tolerance: 0.01, calcul: `12 × ${e.decembre.toLocaleString("fr-FR")} ÷ ${e.cumul.toLocaleString("fr-FR")}, soit +${pct(e.report - 1)}` },
        ];
      },
      explication: (c) => {
        const n = hausseEnJuillet(c);
        return [
          `L'effet de niveau ne change pas, ${pct(n.effets.niveau - 1)}. L'effet de masse passe de ${pct(n.x.effets.masse - 1)} à ${pct(n.effets.masse - 1)}, l'effet de report de ${pct(n.x.effets.report - 1)} à ${pct(n.effets.report - 1)} : ce que N + 1 paie de plus, N + 2 ne le paiera pas en report.`,
        ];
      },
    },
    {
      id: "ce-que-coute-juillet",
      type: "montants",
      titre: "Ce que coûte la nouvelle date",
      notions: ["payroll"],
      question: () =>
        "Reprenez le budget de N + 1 salarié par salarié avec la seconde hausse au 1er juillet : tous les salariés présents la reçoivent, recrues comprises. Calculez la masse brute de N + 1, le surcoût brut face au budget, puis le surcoût chargé.",
      champs: (c) => {
        const n = hausseEnJuillet(c);
        return [
          { libelle: "Masse brute de N + 1, hausse en juillet", attendu: n.budget.brute, calcul: `${n.budget.salaries.map((s) => eur(s.masse)).join(" + ")} = ${eur(n.budget.brute)}` },
          { libelle: "Surcoût brut face au budget", attendu: n.surcoutBrut, calcul: `${eur(n.budget.brute)} − ${eur(n.x.budget.brute)} = ${eur(n.surcoutBrut)}` },
          { libelle: "Surcoût chargé", attendu: n.surcoutCharge, calcul: `${eur(n.budget.chargee)} − ${eur(n.x.budget.chargee)} = ${eur(n.surcoutCharge)}` },
        ];
      },
      explication: (c) => {
        const n = hausseEnJuillet(c);
        return [
          `Le surcoût n'est que de ${eur(n.surcoutCharge)} chargés, mais l'équipe de décembre N voit sa masse monter de ${pct(n.effets.masse - 1)}, au-delà des ${pct(ENVELOPPE_DE_L_EFFET_DE_MASSE)} de l'enveloppe.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au délégué",
      notions: ["payroll", "pay_and_motivation"],
      question: () => "Quelle réponse lui rendez-vous ?",
      options: (c) => {
        const n = hausseEnJuillet(c);
        return [
          {
            texte: "Non en juillet : l'enveloppe ne le permet pas",
            juste: !n.dansLEnveloppe,
            retour: `Oui. L'effet de masse passerait à ${pct(n.effets.masse - 1)}, au-dessus des ${pct(ENVELOPPE_DE_L_EFFET_DE_MASSE)} que la direction s'est fixés. Le salaire de décembre serait le même : la date ne change que le coût de l'année, et ce que l'année suivante reporte.`,
          },
          {
            texte: "Oui : le taux est le même, la date ne coûte rien à NOVA",
            juste: false,
            retour: `Non : la date change l'effet de masse, de ${pct(n.x.effets.masse - 1)} à ${pct(n.effets.masse - 1)}, et coûte ${eur(n.surcoutCharge)} chargés de plus en N + 1.`,
          },
          {
            texte: "Oui : ce que N + 1 paie de plus, N + 2 le rendra par un report plus faible",
            juste: false,
            retour: `Non : N + 2 ne rend rien. Le salaire de décembre N + 1 est le même dans les deux cas, donc la masse de N + 2 aussi ; seul N + 1 paie plus. Le report plus faible, ${pct(n.effets.report - 1)}, se lit par rapport à une année N + 1 plus chère.`,
          },
        ];
      },
    },
  ],
};
