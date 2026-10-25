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
  "equipe-qui-s-epuise": "difficile", // 18 (6 points)
  "depot-qui-deborde": "moyen", // 13 (5 points)
  "budget-qui-ne-tient-pas": "moyen", // 7 (5 points)
  "projet-qui-glisse": "facile", // 27 (1 point)
  "fournisseur-qui-augmente": "facile", // 8 (0 point)
  "poste-qui-reste-vide": "moyen", // 23 (4 points)
  "reclamation-qui-enfle": "moyen", // 14 (3 points)
  "quai-dangereux": "difficile", // 15 (6 points)
  "reorganisation-qui-coince": "facile", // 28 (0 point)
  "tresorerie-qui-fond": "facile", // 9 (0 point)
  "agence-qui-demarre": "facile", // 2 (1 point)
  "panne-qui-paralyse": "moyen", // 16 (2 points)
  "collaborateur-qui-decroche": "difficile", // 19 (7 points)
  "indicateur-qui-ment": "moyen", // 10 (2 points)
  "appel-d-offres": "moyen", // 3 (2 points)
  "prix-qui-ne-passe-plus": "moyen", // 4 (3 points)
  "agenda-qui-deborde": "difficile", // 20 (8 points)
  "preavis-de-greve": "facile", // 26 (1 point)
  "client-qui-s-en-va": "facile", // 5 (1 point)
  "tournees-qui-debordent": "moyen", // 17 (4 points)
  "site-qui-ne-vend-pas": "facile", // 6 (1 point)
  "talent-qui-veut-partir": "facile", // 24 (1 point)
  "competences-qui-manquent": "moyen", // 25 (4 points)
  "facture-qui-flambe": "moyen", // 11 (3 points)
  "controle-qui-s-annonce": "moyen", // 12 (2 points)
  "fusion-des-agences": "facile", // 29 (1 point)
  "nouveau-service": "facile", // 30 (1 point)
  "equipe-dispersee": "facile", // 21 (0 point)
  "cent-premiers-jours": "facile", // 22 (0 point)
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
  "libre-service-qui-perd": "facile", // 49 (1 point)
  "bureau-qui-s-echauffe": "moyen", // 50 (3 points)
  "chambres-bradees": "moyen", // 51 (5 points)
  "seminaire-qui-evince": "difficile", // 52 (6 points)
  surreservation: "facile", // 53 (1 point)
  "note-qui-chute": "difficile", // 54 (6 points)
  "ratio-matiere": "difficile", // 55 (6 points)
  intersaison: "moyen", // 56 (3 points)
  "chambres-pas-pretes": "difficile", // 57 (7 points)
  "brigade-a-bout": "moyen", // 58 (4 points)
  "renovation-sans-fermer": "moyen", // 59 (5 points)
  "saisonniers-de-juillet": "difficile", // 60 (6 points)
  "postes-introuvables": "moyen", // 61 (5 points)
  "apprentis-qui-decrochent": "difficile", // 62 (7 points)
  "diplome-qui-compte": "moyen", // 63 (4 points)
  "cuisine-centrale": "difficile", // 64 (9 points)
  "spa-a-financer": "moyen", // 65 (4 points)
  "enseigne-a-la-porte": "difficile", // 66 (8 points)
  "appels-d-offres-en-rafale": "moyen", // 67 (4 points)
  "client-qui-en-demande-plus": "facile", // 68 (0 point)
  "livrable-refuse": "difficile", // 69 (7 points)
  "jours-non-factures": "moyen", // 70 (3 points)
  "forfait-trop-bas": "moyen", // 71 (3 points)
  "factures-qui-dorment": "moyen", // 72 (3 points)
  "staffing-du-lundi": "moyen", // 73 (4 points)
  "consultant-star": "moyen", // 74 (4 points)
  "promotion-refusee": "facile", // 75 (1 point)
  "departs-a-deux-ans": "moyen", // 76 (4 points)
  "freelances-ou-embauches": "difficile", // 77 (7 points)
  "practice-a-reorienter": "moyen", // 78 (2 points)
  "assistant-ia": "facile", // 79 (1 point)
  "associe-qui-part": "moyen", // 80 (4 points)
  "generaliste-ou-specialiste": "moyen", // 81 (5 points)
  "lits-vides": "moyen", // 82 (3 points)
  "sorties-qui-bloquent": "moyen", // 83 (5 points)
  "famille-qui-ecrit": "moyen", // 84 (5 points)
  "repit-a-creer": "moyen", // 85 (2 points)
  "interim-qui-flambe": "moyen", // 86 (3 points)
  "section-en-deficit": "moyen", // 87 (4 points)
  "heure-a-domicile": "moyen", // 88 (2 points)
  "chutes-la-nuit": "difficile", // 89 (7 points)
  "dossier-de-soins": "moyen", // 90 (4 points)
  "postes-de-douze-heures": "moyen", // 91 (4 points)
  "absenteisme-qui-s-installe": "moyen", // 92 (3 points)
  "former-ses-soignants": "moyen", // 93 (3 points)
  "equipes-jour-et-nuit": "moyen", // 94 (4 points)
  "reconstruire-ou-regrouper": "moyen", // 95 (5 points)
  "association-a-reprendre": "moyen", // 96 (2 points)
  "virage-domiciliaire": "moyen", // 97 (2 points)
  "changements-de-format": "facile", // 98 (1 point)
  "dlc-qui-tombe": "moyen", // 99 (2 points)
  "lot-a-rappeler": "moyen", // 100 (2 points)
  "negociations-annuelles": "facile", // 101 (1 point)
  "promotion-qui-coute": "facile", // 102 (1 point)
  "appel-d-offres-mdd": "moyen", // 103 (2 points)
  "edi-qui-s-impose": "moyen", // 104 (3 points)
  "producteurs-qui-arretent": "moyen", // 105 (4 points)
  "pot-a-remplacer": "facile", // 106 (1 point)
  "energie-de-l-usine": "facile", // 107 (0 point)
  "polyvalence-des-operateurs": "moyen", // 108 (4 points)
  "maintenance-qui-court": "moyen", // 109 (3 points)
  "pic-des-fetes": "moyen", // 110 (3 points)
  "export-a-ouvrir": "difficile", // 111 (7 points)
  "gamme-vegetale": "moyen", // 112 (3 points)
  "offre-de-rachat": "difficile", // 113 (6 points)
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
