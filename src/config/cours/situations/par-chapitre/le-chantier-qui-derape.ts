import { eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import { CHANTIER_ARPEGE, COUT_REESTIME, contratALAvancement } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES CONTRATS À LONG TERME » (DCG · Comptabilité approfondie, palier 4).
 *
 * En janvier N + 2, avant l'arrêté des comptes de N + 1, le chef de chantier annonce que la
 * sonorisation de la salle Arpège coûtera `COUT_REESTIME` au lieu du coût prévu : il faut refaire
 * l'acoustique d'une galerie. Le président veut le résultat du contrat en N + 1, et
 * savoir quoi passer. L'élève refait les calculs du chapitre (`contratALAvancement`) sur le coût
 * réestimé.
 */

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

export const chantierQuiDerape = () => contratALAvancement(CHANTIER_ARPEGE.coutsEngages, COUT_REESTIME);

export const LE_CHANTIER_QUI_DERAPE: Situation = {
  code: "le-chantier-qui-derape",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: [],
  reprend: ["les-contrats-a-long-terme"],
  commanditaire: "Le président",
  titre: "Le chantier qui dérape",
  accroche: "Le coût du chantier de la salle Arpège dépasse son prix : ce que l'exercice doit porter, avant même la livraison.",
  objectifs: ["Recalculer l'avancement sur un coût réestimé", "Calculer la provision pour perte à terminaison", "Répondre au président, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend le chantier de NOVA pour la salle Arpège, celui du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => [
        `« Le chef de chantier vient de m'appeler : la galerie de la salle Arpège est à reprendre, le chantier coûtera ${eur(COUT_REESTIME)} et non ${eur(CHANTIER_ARPEGE.coutTotalEstime)}. Nous n'en sommes qu'au début. Qu'est-ce que cela change aux comptes de N + 1, que nous arrêtons la semaine prochaine ? » Le président`,
        "Pas de cours cette fois : l'avancement et la perte à terminaison, vous savez les calculer.",
      ],
      tableau: () => ({
        titre: "Le chantier au 31 décembre N + 1",
        colonnes: ["Valeur"],
        lignes: [
          { libelle: "Prix ferme", valeurs: [eur(CHANTIER_ARPEGE.prix)] },
          { libelle: "Coûts engagés", valeurs: [eur(CHANTIER_ARPEGE.coutsEngages)] },
          { libelle: "Coût total réestimé", valeurs: [eur(COUT_REESTIME)] },
        ],
      }),
      repere: () => "À rendre : l'avancement, la provision pour perte à terminaison, le résultat du contrat en N + 1, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le contrat, recalculé",
      notions: ["revenue", "income_statement"],
      question: () => "Calculez l'avancement sur le coût réestimé (en pourcentage, au centième), la provision pour perte à terminaison, puis le résultat du contrat en N + 1.",
      champs: () => {
        const a = chantierQuiDerape();
        return [
          { libelle: "Avancement (%)", attendu: a.avancementPct, calcul: `${eur(a.coutsEngages)} ÷ ${eur(a.coutTotal)} × 100 = ${pct(a.avancement)}`, tolerance: 0.01 },
          {
            libelle: "Provision pour perte à terminaison",
            attendu: a.provisionPourPerte,
            calcul: `l'avancement prend déjà ${eur(a.prix)} × ${eur(a.coutsEngages)} ÷ ${eur(a.coutTotal)} − ${eur(a.coutsEngages)} = ${eur(a.resultatALAvancement)} ; reste à provisionner ${eur(-a.resultatTotal)} − ${eur(-a.resultatALAvancement)} = ${eur(a.provisionPourPerte)}`,
          },
          { libelle: "Résultat du contrat en N + 1", attendu: a.resultatDeLExercice, calcul: `${eur(a.resultatALAvancement)} − ${eur(a.provisionPourPerte)} = ${eur(a.resultatDeLExercice)}` },
        ];
      },
      explication: () => {
        const a = chantierQuiDerape();
        return [`À peine commencé, le contrat fait perdre ${eur(-a.resultatDeLExercice)} à N + 1 : toute la perte, et pas seulement sa part à l'avancement.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const a = chantierQuiDerape();
        return [
          {
            texte: `Porter toute la perte, ${eur(-a.resultatTotal)}, sur N + 1`,
            juste: true,
            retour: `Oui : ${eur(-a.resultatALAvancement)} par l'avancement, ${eur(a.provisionPourPerte)} par la provision pour perte à terminaison. La perte est connue avant l'arrêté des comptes : la prudence la rattache à N + 1.`,
          },
          {
            texte: `Ne porter que la part de la perte à l'avancement, ${eur(-a.resultatALAvancement)}, le reste en N + 2`,
            juste: false,
            retour: "Non : la méthode à l'avancement répartit une marge, pas une perte. Une perte à terminaison se constate en entier dès qu'elle est connue.",
          },
          {
            texte: "Rien en N + 1 : la galerie se reprendra en N + 2, la perte sera de N + 2",
            juste: false,
            retour: "Non : l'événement est connu avant l'arrêté des comptes et concerne un contrat en cours au 31 décembre ; la perte appartient à N + 1.",
          },
        ];
      },
    },
  ],
};
