/**
 * LA DIFFICULTÉ DE CHAQUE ÉPISODE, et ceux qui départagent mal.
 *
 * La difficulté compte les décisions où la bonne réponse se distingue mal :
 * le réflexe n'est pas l'option la pire, une option plus sûre concurrence la
 * meilleure, ou la deuxième option est à moins de 3 k€ de la meilleure. De 1
 * à 3 décisions de ce genre : facile ; 4 ou 5 : moyen ; 6 et plus : difficile
 * (document Parcours). Elle sert à recommander le prochain épisode : on ne
 * propose pas un épisode difficile à qui commence une compétence.
 *
 * Trois épisodes départagent mal : leurs décisions sont si serrées qu'un bon
 * et un moins bon manager y obtiennent des qualités proches. On ne les
 * recommande qu'en dernier.
 */
export type Difficulte = "facile" | "moyen" | "difficile";

export const DIFFICULTES: Readonly<Record<string, Difficulte>> = {
  "trimestre-qui-derape": "difficile", // 1
  "equipe-qui-s-epuise": "difficile", // 2
  "depot-qui-deborde": "moyen", // 3
  "budget-qui-ne-tient-pas": "difficile", // 4
  "projet-qui-glisse": "facile", // 5
  "fournisseur-qui-augmente": "facile", // 6
  "poste-qui-reste-vide": "difficile", // 7
  "reclamation-qui-enfle": "moyen", // 8
  "quai-dangereux": "moyen", // 9
  "reorganisation-qui-coince": "facile", // 10
  "tresorerie-qui-fond": "facile", // 11
  "agence-qui-demarre": "facile", // 12
  "panne-qui-paralyse": "moyen", // 13
  "collaborateur-qui-decroche": "difficile", // 14
  "indicateur-qui-ment": "moyen", // 15
  "appel-d-offres": "moyen", // 16
  "prix-qui-ne-passe-plus": "moyen", // 17
  "agenda-qui-deborde": "difficile", // 18
  "preavis-de-greve": "moyen", // 19
  "client-qui-s-en-va": "facile", // 20
  "tournees-qui-debordent": "facile", // 21
  "site-qui-ne-vend-pas": "facile", // 22
  "talent-qui-veut-partir": "difficile", // 23
  "competences-qui-manquent": "difficile", // 24
  "facture-qui-flambe": "moyen", // 25
  "controle-qui-s-annonce": "moyen", // 26
  "fusion-des-agences": "moyen", // 27
  "nouveau-service": "moyen", // 28
  "equipe-dispersee": "facile", // 29
  "cent-premiers-jours": "facile", // 30
};

export const PEU_DISCRIMINANTS: readonly string[] = [
  "trimestre-qui-derape",
  "equipe-qui-s-epuise",
  "collaborateur-qui-decroche",
];
