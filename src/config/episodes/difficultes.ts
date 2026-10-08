/**
 * LA DIFFICULTÉ DE CHAQUE ÉPISODE, et ceux qui départagent mal.
 *
 * La difficulté compte, décision par décision, ce qui rend la bonne réponse
 * difficile à distinguer : le réflexe n'est pas l'option la pire, une option
 * plus sûre concurrence la meilleure, la deuxième option est proche de la
 * meilleure. Un point par critère rempli, sur les six décisions : 0 ou 1
 * point, facile ; de 2 à 5, moyen ; 6 et plus, difficile. La règle et ses
 * seuils, ceux du bilan, sont dans `src/pedagogy/episodes/difficulte.ts`, et
 * s'appliquent à tous les épisodes ; un test vérifie le tableau.
 *
 * Elle sert à recommander le prochain épisode : on ne propose pas un épisode
 * difficile à qui commence une compétence.
 *
 * Quinze épisodes départagent mal : quatre de leurs décisions au moins sont si
 * serrées qu'un bon et un moins bon manager y obtiennent des qualités proches.
 * On ne les recommande qu'en dernier.
 */
export type Difficulte = "facile" | "moyen" | "difficile";

export const DIFFICULTES: Readonly<Record<string, Difficulte>> = {
  "trimestre-qui-derape": "difficile", // 1 (8 points)
  "equipe-qui-s-epuise": "difficile", // 2 (6 points)
  "depot-qui-deborde": "moyen", // 3 (5 points)
  "budget-qui-ne-tient-pas": "moyen", // 4 (5 points)
  "projet-qui-glisse": "facile", // 5 (1 point)
  "fournisseur-qui-augmente": "facile", // 6 (0 point)
  "poste-qui-reste-vide": "moyen", // 7 (4 points)
  "reclamation-qui-enfle": "moyen", // 8 (3 points)
  "quai-dangereux": "difficile", // 9 (6 points)
  "reorganisation-qui-coince": "facile", // 10 (0 point)
  "tresorerie-qui-fond": "facile", // 11 (0 point)
  "agence-qui-demarre": "facile", // 12 (1 point)
  "panne-qui-paralyse": "moyen", // 13 (2 points)
  "collaborateur-qui-decroche": "difficile", // 14 (7 points)
  "indicateur-qui-ment": "moyen", // 15 (2 points)
  "appel-d-offres": "moyen", // 16 (2 points)
  "prix-qui-ne-passe-plus": "moyen", // 17 (3 points)
  "agenda-qui-deborde": "difficile", // 18 (8 points)
  "preavis-de-greve": "facile", // 19 (1 point)
  "client-qui-s-en-va": "facile", // 20 (1 point)
  "tournees-qui-debordent": "moyen", // 21 (4 points)
  "site-qui-ne-vend-pas": "facile", // 22 (1 point)
  "talent-qui-veut-partir": "facile", // 23 (1 point)
  "competences-qui-manquent": "moyen", // 24 (4 points)
  "facture-qui-flambe": "moyen", // 25 (3 points)
  "controle-qui-s-annonce": "moyen", // 26 (2 points)
  "fusion-des-agences": "facile", // 27 (1 point)
  "nouveau-service": "facile", // 28 (1 point)
  "equipe-dispersee": "facile", // 29 (0 point)
  "cent-premiers-jours": "facile", // 30 (0 point)
  "commande-a-prix-casse": "difficile", // 31 (6 points)
  "produit-deficitaire": "moyen", // 32 (2 points)
  "faire-ou-faire-faire": "moyen", // 33 (5 points)
  "seuil-qui-bouge": "difficile", // 34 (10 points)
  "ecarts-du-budget": "moyen", // 35 (5 points)
  "atelier-sature": "moyen", // 36 (3 points)
  "investissement-a-choisir": "difficile", // 37 (6 points)
  "croissance-a-financer": "moyen", // 38 (3 points)
  "louer-ou-acheter": "difficile", // 39 (8 points)
  "client-a-risque": "difficile", // 40 (7 points)
  "discounter-qui-arrive": "moyen", // 41 (4 points)
  "concurrent-a-racheter": "moyen", // 42 (5 points)
  "marche-qui-s-ouvre": "difficile", // 43 (6 points)
  "fabricant-en-direct": "moyen", // 44 (4 points)
  "projet-a-arreter": "moyen", // 45 (3 points)
  "reseau-a-redessiner": "moyen", // 46 (5 points)
  "pari-du-reemploi": "facile", // 47 (1 point)
  "grand-compte-exclusif": "moyen", // 48 (2 points)
  "chambres-bradees": "moyen", // 49 (5 points)
  "seminaire-qui-evince": "difficile", // 50 (6 points)
  surreservation: "facile", // 51 (1 point)
  "note-qui-chute": "difficile", // 52 (6 points)
  "ratio-matiere": "difficile", // 53 (6 points)
  intersaison: "moyen", // 54 (3 points)
  "chambres-pas-pretes": "difficile", // 55 (7 points)
  "brigade-a-bout": "moyen", // 56 (4 points)
  "renovation-sans-fermer": "moyen", // 57 (5 points)
  "saisonniers-de-juillet": "difficile", // 58 (6 points)
  "postes-introuvables": "moyen", // 59 (5 points)
  "apprentis-qui-decrochent": "difficile", // 60 (7 points)
  "cuisine-centrale": "difficile", // 61 (9 points)
  "spa-a-financer": "moyen", // 62 (4 points)
  "enseigne-a-la-porte": "difficile", // 63 (8 points)
  "appels-d-offres-en-rafale": "moyen", // 64 (4 points)
  "client-qui-en-demande-plus": "facile", // 65 (0 point)
  "livrable-refuse": "difficile", // 66 (7 points)
  "jours-non-factures": "moyen", // 67 (3 points)
  "forfait-trop-bas": "moyen", // 68 (3 points)
  "factures-qui-dorment": "moyen", // 69 (3 points)
  "staffing-du-lundi": "moyen", // 70 (4 points)
  "consultant-star": "moyen", // 71 (4 points)
  "promotion-refusee": "facile", // 72 (1 point)
  "departs-a-deux-ans": "moyen", // 73 (4 points)
  "freelances-ou-embauches": "difficile", // 74 (7 points)
  "practice-a-reorienter": "moyen", // 75 (2 points)
  "assistant-ia": "facile", // 76 (1 point)
  "associe-qui-part": "moyen", // 77 (4 points)
  "generaliste-ou-specialiste": "moyen", // 78 (5 points)
  "lits-vides": "moyen", // 79 (3 points)
  "sorties-qui-bloquent": "moyen", // 80 (5 points)
  "famille-qui-ecrit": "moyen", // 81 (5 points)
  "interim-qui-flambe": "moyen", // 82 (3 points)
  "section-en-deficit": "moyen", // 83 (4 points)
  "heure-a-domicile": "moyen", // 84 (2 points)
  "chutes-la-nuit": "difficile", // 85 (7 points)
  "dossier-de-soins": "moyen", // 86 (4 points)
  "postes-de-douze-heures": "moyen", // 87 (4 points)
  "absenteisme-qui-s-installe": "moyen", // 88 (3 points)
  "former-ses-soignants": "moyen", // 89 (3 points)
  "equipes-jour-et-nuit": "moyen", // 90 (4 points)
  "reconstruire-ou-regrouper": "moyen", // 91 (5 points)
  "association-a-reprendre": "moyen", // 92 (2 points)
  "virage-domiciliaire": "moyen", // 93 (2 points)
  "changements-de-format": "facile", // 94 (1 point)
  "dlc-qui-tombe": "moyen", // 95 (2 points)
  "lot-a-rappeler": "moyen", // 96 (2 points)
  "negociations-annuelles": "facile", // 97 (1 point)
  "promotion-qui-coute": "facile", // 98 (1 point)
  "appel-d-offres-mdd": "moyen", // 99 (2 points)
  "producteurs-qui-arretent": "moyen", // 100 (4 points)
  "pot-a-remplacer": "facile", // 101 (1 point)
  "energie-de-l-usine": "facile", // 102 (0 point)
  "polyvalence-des-operateurs": "moyen", // 103 (4 points)
  "maintenance-qui-court": "moyen", // 104 (3 points)
  "pic-des-fetes": "moyen", // 105 (3 points)
  "export-a-ouvrir": "difficile", // 106 (7 points)
  "gamme-vegetale": "moyen", // 107 (3 points)
  "offre-de-rachat": "difficile", // 108 (6 points)
};

export const PEU_DISCRIMINANTS: readonly string[] = [
  "trimestre-qui-derape",
  "equipe-qui-s-epuise",
  "collaborateur-qui-decroche",
  "commande-a-prix-casse",
  "seuil-qui-bouge",
  "ecarts-du-budget",
  "louer-ou-acheter",
  "chambres-bradees",
  "seminaire-qui-evince",
  "ratio-matiere",
  "chambres-pas-pretes",
  "saisonniers-de-juillet",
  "apprentis-qui-decrochent",
  "cuisine-centrale",
  "spa-a-financer",
  "famille-qui-ecrit",
  "chutes-la-nuit",
  "postes-de-douze-heures",
];
