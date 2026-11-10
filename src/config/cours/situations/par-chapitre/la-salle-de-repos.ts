import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ACTIONS_QVT, COUT_D_UN_JOUR_D_ABSENCE, ENTREPRISES_DE_LA_COHESION, actionSeule } from "../../monde/cohesion-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FÉDÉRER LES ACTEURS » : LA SALLE DE REPOS ? (Bac STMG, enseignement commun de
 * terminale, palier 1).
 *
 * Le chapitre retenait des actions de qualité de vie au travail sur une liste ; le cas juge celle que
 * l'équipe réclame le plus, et la façon de décider avec elle. Hypothèses : monde/cohesion-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

const SALLE = ACTIONS_QVT.length - 1;
export const laSalleDeRepos = () => ({ salle: actionSeule(SALLE), sieges: actionSeule(0) });

export const LA_SALLE_DE_REPOS: Situation = {
  code: "la-salle-de-repos",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["federer-les-acteurs"],
  commanditaire: "Le président",
  titre: "La salle de repos ?",
  accroche: "L'équipe réclame une salle de repos rénovée. Elle coûte plus que les absences qu'elle évite. Faut-il dire non ?",
  objectifs: ["Chiffrer une action de qualité de vie au travail", "La comparer à une autre", "Répondre au président, en pensant à la façon de décider"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_COHESION, pourquoi: "le cas reprend l'équipe de NOVA et ses absences." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const { salle, sieges } = laSalleDeRepos();
        return [
          `« Toute l'équipe me demande ${salle.nom} : ${eur(salle.cout)} par an, pour ${qte(salle.joursEvites)} jours d'absence évités, à ${eur(COUT_D_UN_JOUR_D_ABSENCE)} le jour. Les médecins du travail conseillent plutôt ${sieges.nom} : ${eur(sieges.cout)}, ${qte(sieges.joursEvites)} jours évités. Je ne peux payer qu'une des deux cette année. » Le président`,
          "Pas de cours cette fois : les calculs et les notions sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : ce que laisse chaque action, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Ce que laisse chaque action",
      question: () => "Calculez ce que laisse chaque action dans l'année (les jours évités, à leur coût, moins le coût de l'action).",
      champs: () => {
        const { salle, sieges } = laSalleDeRepos();
        return [
          { libelle: "Ce que laisse la salle de repos", attendu: salle.gain, calcul: `${qte(salle.joursEvites)} × ${eur(COUT_D_UN_JOUR_D_ABSENCE)} − ${eur(salle.cout)} = ${eur(salle.gain)}` },
          { libelle: "Ce que laissent les sièges et les tapis", attendu: sieges.gain, calcul: `${qte(sieges.joursEvites)} × ${eur(COUT_D_UN_JOUR_D_ABSENCE)} − ${eur(sieges.cout)} = ${eur(sieges.gain)}` },
        ];
      },
      explication: () => {
        const { salle, sieges } = laSalleDeRepos();
        return [`La salle coûte ${eur(-salle.gain)} de plus qu'elle n'évite ; les sièges laissent ${eur(sieges.gain)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const { sieges } = laSalleDeRepos();
        return [
          {
            texte: "Les sièges d'abord, expliqués et décidés avec l'équipe",
            juste: true,
            retour: `Oui : les sièges laissent ${eur(sieges.gain)} et protègent la santé. Expliquer les chiffres à l'équipe, et prévoir la salle pour l'année suivante, garde son adhésion : la décision se prend avec elle, pas contre elle.`,
          },
          {
            texte: "La salle, sans discuter : quand toute l'équipe demande, on cède",
            juste: false,
            retour: "Non : céder sans expliquer prive NOVA d'une action plus utile, et ne dit pas pourquoi. Le style participatif n'est pas l'absence de choix.",
          },
          {
            texte: "Les sièges, imposés sans explication : les chiffres suffisent",
            juste: false,
            retour: "Non : imposer sans expliquer déçoit une équipe qui avait fait une demande. Les chiffres se partagent pour être compris.",
          },
        ];
      },
    },
  ],
};
