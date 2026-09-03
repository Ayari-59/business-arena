/**
 * Clôture d'un tour par l'enseignant (vague 1, A2/A3).
 *
 * Constaté en production : un clic sur « Clore le tour » partait sans
 * confirmation, sans dire combien d'équipes avaient validé, et sans rien
 * montrer pendant les quinze secondes de simulation. Deux clics pouvaient
 * clore deux tours.
 *
 * Ce module est pur : les textes de la confirmation et les délais annoncés
 * pour les actions longues, partagés entre composants et tests.
 */

/** Textes des attentes longues, avec le délai annoncé. */
export const ATTENTES = {
  cloture: "Simulation en cours, environ 15 s",
  creationPartie: "Création de la partie en cours, environ 10 s",
  creationConcours: "Création du concours en cours, environ 10 s",
  tirageGroupes: "Tirage des groupes en cours, environ 10 s",
  finale: "Qualification et lancement de la finale en cours, environ 10 s",
  podium: "Clôture du concours en cours, environ 10 s",
} as const;

export interface ConfirmationCloture {
  titre: string;
  detail: string;
  irreversible: string;
  confirmer: string;
  annuler: string;
}

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

/** « Clore le tour 2 ? 3 équipes sur 5 ont validé leurs décisions… » */
export function confirmationCloture(args: {
  tour: number;
  validees: number;
  total: number;
}): ConfirmationCloture {
  const { tour, validees, total } = args;
  const ont = validees > 1 ? "ont" : "a";
  const reste = total - validees;
  const detail =
    total === 0
      ? "Aucune équipe d'élèves dans cette partie : seuls les concurrents automatiques jouent."
      : reste === 0
        ? `${pluriel(validees, "équipe")} sur ${total} ${ont} validé leurs décisions : toutes sont prêtes.`
        : `${pluriel(validees, "équipe")} sur ${total} ${ont} validé leurs décisions. ${
            reste > 1 ? `Les ${reste} autres reconduiront` : "L'autre reconduira"
          } les décisions du tour précédent.`;
  return {
    titre: `Clore le tour ${tour} ?`,
    detail,
    irreversible: "Cette action est irréversible : le tour sera simulé et les résultats publiés.",
    confirmer: "Clore et simuler",
    annuler: "Annuler",
  };
}
