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
 * Les épisodes 31 à 40 sont classés par le même décompte, refait en points
 * (un par critère rempli) sur le modèle actuel : 0 ou 1 point, facile ; de 2
 * à 5, moyen ; 6 et plus, difficile. Refait ainsi, le décompte classe plus
 * bas que le document plusieurs des trente premiers ; on ne les a pas
 * reclassés pour ne pas changer les recommandations déjà faites.
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
  "commande-a-prix-casse": "difficile", // 31 (6 points)
  "produit-deficitaire": "moyen", // 32 (2 points)
  "faire-ou-faire-faire": "moyen", // 33 (5 points)
  "seuil-qui-bouge": "difficile", // 34 (10 points)
  "ecarts-du-budget": "moyen", // 35 (5 points)
  "atelier-sature": "moyen", // 36 (3 points)
  "investissement-a-choisir": "moyen", // 37 (4 points)
  "croissance-a-financer": "moyen", // 38 (3 points)
  "louer-ou-acheter": "difficile", // 39 (8 points)
  "client-a-risque": "moyen", // 40 (3 points)
};

export const PEU_DISCRIMINANTS: readonly string[] = [
  "trimestre-qui-derape",
  "equipe-qui-s-epuise",
  "collaborateur-qui-decroche",
];
