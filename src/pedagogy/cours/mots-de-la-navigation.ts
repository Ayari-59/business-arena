/**
 * CE QUE LE GUIDE D'UN CHAPITRE REÇOIT POUR S'ORIENTER (audit du cours du 25 novembre 2026, usage 1.3 et
 * 1.4) : le fil d'Ariane, le retour à la liste, le chapitre suivant et son accès. Ce module n'importe rien :
 * le guide est un composant du navigateur, et le calcul (pedagogy/cours/navigation-de-l-eleve.ts) lit le
 * registre du cours, qui ne doit pas l'y suivre (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */

/** Un pas du fil d'Ariane ; sans lien, c'est la page où l'on est. */
export interface PasDuFil {
  libelle: string;
  href?: string;
}

/**
 * CE QUI OUVRE OU FERME LE CHAPITRE SUIVANT, pour ce visiteur. La règle d'accès ne change pas
 * (services/cours.service.ts, `coursOuvert`) : elle se lit deux fois pour l'élève d'une classe, avec et
 * sans la libération de son enseignant, pour dire pourquoi un chapitre reste fermé.
 */
export type AccesDuSuivant = "ouvert" | "a-liberer" | "ferme-a-la-classe" | "hors-programme" | "reserve";

/** Ce que l'élève lit à côté d'un chapitre suivant fermé. */
export const MOT_DE_L_ACCES: Record<Exclude<AccesDuSuivant, "ouvert">, string> = {
  "a-liberer": "pas encore ouvert par votre enseignant",
  "ferme-a-la-classe": "pas encore ouvert pour votre classe",
  "hors-programme": "hors du programme de votre classe",
  reserve: "réservé aux établissements sous licence",
};

/** La suite du parcours, à la fin du chapitre : le chapitre suivant et son accès, ou la fin du parcours. */
export type SuiteDuParcours =
  | { genre: "suivant"; code: string; titre: string; href: string; acces: AccesDuSuivant }
  | { genre: "fin"; phrase: string };

/** Ce que le guide reçoit pour s'orienter : le fil d'Ariane, le bouton « Retour », et la suite. */
export interface NavigationDuChapitre {
  fil: readonly PasDuFil[];
  retour: { href: string; libelle: string };
  /** Null pour un cas pratique : il n'est dans aucun parcours, sa fin renvoie aux chapitres qu'il reprend. */
  suite: SuiteDuParcours | null;
}
