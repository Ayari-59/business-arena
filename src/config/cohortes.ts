import { EPISODES_DE_DEMO } from "./episodes/demos";

/**
 * LES COHORTES CRÉÉES PAR L'ENSEIGNANT : CE QUE L'ÉCRAN DIT, ÉCRIT UNE FOIS.
 *
 * Décision du propriétaire (octobre 2026) : « des cohortes créées par l'enseignant ».
 * Depuis son espace, un enseignant sous licence crée une cohorte (un nom, des épisodes
 * choisis) ; ses élèves la rejoignent par son code, sans compte, et jouent ces épisodes
 * sous la licence de l'établissement. La grille dit « pas d'essai en classe » : sans
 * licence en cours, la création est refusée côté serveur
 * (services/cohortes.service.ts), même pour une cohorte des seules démonstrations.
 *
 * Les textes vivent ici pour que la page, l'action et les tests disent la même chose.
 * Aucun chiffre écrit à la main : le nombre de démonstrations se lit de la donnée.
 */

/** La longueur d'un nom de cohorte. */
export const NOM_DE_COHORTE_MAX = 120;

/** L'offre qui ouvre la création des cohortes, telle que l'écran la marque. */
export const OFFRE_DES_COHORTES = "Offres Enseignant et Établissement";

/** Le refus sans licence, avec ce qui reste possible (le lien vers les tarifs suit). */
export const REFUS_SANS_LICENCE = `Créer une cohorte demande une licence en cours de votre établissement. Sans elle, aucune cohorte ne se crée, pas même avec les seules démonstrations : les ${EPISODES_DE_DEMO.length} épisodes de démonstration se jouent sans cohorte, par leur lien.`;

/** Les refus de l'action, par code : l'adresse porte le code, jamais le texte. */
export const REFUS_DE_COHORTE = {
  licence: REFUS_SANS_LICENCE,
  organisation:
    "Votre compte n'est rattaché à aucun établissement : la cohorte n'a pas pu être créée.",
  nom: "Donnez un nom à la cohorte, par exemple la classe et le groupe.",
  episodes: "Cochez au moins un épisode.",
  introuvable: "Cette cohorte n'existe pas, ou elle n'est pas l'une des vôtres.",
} as const;

export type RefusDeCohorte = keyof typeof REFUS_DE_COHORTE;

export const estUnRefusDeCohorte = (v: string | undefined): v is RefusDeCohorte =>
  !!v && Object.hasOwn(REFUS_DE_COHORTE, v);

/** Ce qu'un élève voit d'une cohorte close, sur la page d'invitation. */
export const COHORTE_CLOSE =
  "Cette cohorte est close : elle n'accepte plus de nouveaux participants. Demandez le code de la nouvelle à votre enseignant.";
