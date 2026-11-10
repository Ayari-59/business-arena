import { eur, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DU_PROJET, INTEGRATEUR, retardsDuCas } from "../../monde/projet-pgi-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CONDUIRE UN PROJET DE SYSTÈME D'INFORMATION » : DÉMARRER LE PGI À LA DATE
 * PRÉVUE ? (Bac STMG, systèmes d'information de gestion de terminale, palier 1).
 *
 * Le chapitre planifiait le projet et trouvait la marge de la reprise ; le cas lit 2 retards, l'un sur
 * une tâche qui a de la marge, l'autre sur une tâche critique, et fait décider le président.
 * Hypothèses : monde/projet-pgi-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la nouvelle fin du projet est un jour du planning, une quantité
 * entière, déclarée comme telle.
 */

const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;

export const DEMARRER_LE_PGI_A_LA_DATE_PREVUE: Situation = {
  code: "demarrer-le-pgi-a-la-date-prevue",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["conduire-un-projet-de-si"],
  commanditaire: "Le président",
  titre: "Démarrer le PGI à la date prévue ?",
  accroche: "La formation est reportée, le paramétrage s'allonge. Le président voudrait garder sa date de démarrage : le projet le permet-il, et à quel prix ?",
  objectifs: ["Lire l'effet de 2 retards sur la fin d'un projet", "Chiffrer le surcoût", "Répondre au président, planning à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_PROJET, pourquoi: "le cas reprend le planning du projet de PGI de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = retardsDuCas();
        return [
          `« L'intégrateur ne peut former les opérateurs que ${jours(k.formation)} plus tard que prévu, et le paramétrage prendra ${jours(k.parametrage)} de plus, à ${eur(INTEGRATEUR.parJour)} la journée. J'avais annoncé le démarrage pour la fin du jour ${qte(k.prevue)}. Pouvons-nous la tenir ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre, et le planning est le sien.",
        ];
      },
      repere: () => "À rendre : la nouvelle fin du projet, le surcoût, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "La nouvelle fin, le surcoût",
      question: () => "Refaites le planning avec les 2 retards : à quel jour le projet finit-il ? Puis calculez le surcoût de l'intégrateur.",
      champs: () => {
        const k = retardsDuCas();
        return [
          { libelle: "Nouvelle fin du projet (jour)", nature: "quantite", attendu: k.fin, calcul: `Le paramétrage, critique, décale tout de ${jours(k.parametrage)} : ${qte(k.prevue)} + ${qte(k.parametrage)} = ${qte(k.fin)} ; la formation reste dans sa marge de ${jours(k.margeDeLaFormation)}` },
          { libelle: "Surcoût de l'intégrateur", attendu: k.surcout, calcul: `${qte(k.parametrage)} × ${eur(INTEGRATEUR.parJour)} = ${eur(k.surcout)}` },
        ];
      },
      explication: () => [`Le report de la formation ne coûte rien : elle a ${jours(retardsDuCas().margeDeLaFormation)} de marge. Seul le paramétrage, critique, décale le démarrage.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = retardsDuCas();
        return [
          { texte: `Annoncer un démarrage décalé de ${jours(k.decalage)}`, juste: true, retour: `Oui : le paramétrage est sur le chemin critique, et rien ne se rattrape sans toucher à la qualité. Le président prévient les utilisateurs et le comité de pilotage, et garde une recette complète. Le surcoût est de ${eur(k.surcout)}.` },
          { texte: `Garder la date en raccourcissant la recette de ${jours(k.parametrage)}`, juste: false, retour: "Non : on gagne du délai en prenant le risque de démarrer avec des anomalies bloquantes." },
          { texte: `Décaler de ${jours(k.formation + k.parametrage)}, en additionnant les 2 retards`, juste: false, retour: "Non : les retards ne s'additionnent pas. La formation reste dans sa marge, seul le paramétrage compte." },
        ];
      },
    },
  ],
};
