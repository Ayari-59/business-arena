import { describe, expect, it } from "vitest";
import { EPISODES } from "@/pedagogy/episodes/registre";

/**
 * LA BONNE OPTION NE SE TRAHIT PAS PAR SA LONGUEUR.
 *
 * Mesure d'octobre 2026 : dans 98 épisodes sur 113, la meilleure option d'une
 * décision était aussi la plus longue dans plus de deux décisions sur six. Un
 * élève qui prenait toujours l'option la plus détaillée trouvait la méthode
 * sans lire la situation. Les épisodes écrits depuis portaient déjà leur
 * propre garde (deux fois au plus) ; celle-ci vaut pour toute la bibliothèque.
 *
 * La meilleure option est celle de la première référence de l'épisode, le
 * chemin que le bilan donne pour modèle. On compare les titres, ce que l'élève
 * lit d'abord ; le détail porte les chiffres et n'entre pas dans la mesure.
 *
 * Les épisodes pas encore rééquilibrés sont listés ci-dessous. La liste ne
 * fait que raccourcir : un épisode corrigé doit en sortir (la garde échoue
 * s'il y reste), et aucun épisode ne peut y entrer.
 */

/** Le plafond des épisodes récents : la meilleure option est la plus longue deux fois au plus. */
const PLAFOND = 2;

const A_REEQUILIBRER = new Set<string>([
  "depot-qui-deborde",
  "reclamation-qui-enfle",
  "quai-dangereux",
  "panne-qui-paralyse",
  "tournees-qui-debordent",
  "equipe-qui-s-epuise",
  "collaborateur-qui-decroche",
  "agenda-qui-deborde",
  "equipe-dispersee",
  "cent-premiers-jours",
  "poste-qui-reste-vide",
  "talent-qui-veut-partir",
  "competences-qui-manquent",
  "preavis-de-greve",
  "projet-qui-glisse",
  "reorganisation-qui-coince",
  "fusion-des-agences",
  "nouveau-service",
  "commande-a-prix-casse",
  "produit-deficitaire",
  "seuil-qui-bouge",
  "client-a-risque",
  "discounter-qui-arrive",
  "concurrent-a-racheter",
  "marche-qui-s-ouvre",
  "fabricant-en-direct",
  "projet-a-arreter",
  "reseau-a-redessiner",
  "pari-du-reemploi",
  "grand-compte-exclusif",
  "chambres-bradees",
  "seminaire-qui-evince",
  "surreservation",
  "note-qui-chute",
  "ratio-matiere",
  "intersaison",
  "chambres-pas-pretes",
  "brigade-a-bout",
  "renovation-sans-fermer",
  "saisonniers-de-juillet",
  "postes-introuvables",
  "apprentis-qui-decrochent",
  "cuisine-centrale",
  "spa-a-financer",
  "enseigne-a-la-porte",
  "appels-d-offres-en-rafale",
  "livrable-refuse",
  "jours-non-factures",
  "forfait-trop-bas",
  "factures-qui-dorment",
  "staffing-du-lundi",
  "consultant-star",
  "promotion-refusee",
  "departs-a-deux-ans",
  "freelances-ou-embauches",
  "practice-a-reorienter",
  "assistant-ia",
  "associe-qui-part",
  "generaliste-ou-specialiste",
  "lits-vides",
  "sorties-qui-bloquent",
  "famille-qui-ecrit",
  "interim-qui-flambe",
  "section-en-deficit",
  "heure-a-domicile",
  "chutes-la-nuit",
  "dossier-de-soins",
  "postes-de-douze-heures",
  "absenteisme-qui-s-installe",
  "equipes-jour-et-nuit",
  "reconstruire-ou-regrouper",
  "association-a-reprendre",
  "virage-domiciliaire",
  "changements-de-format",
  "dlc-qui-tombe",
  "lot-a-rappeler",
  "negociations-annuelles",
  "promotion-qui-coute",
  "appel-d-offres-mdd",
  "producteurs-qui-arretent",
  "pot-a-remplacer",
  "energie-de-l-usine",
  "polyvalence-des-operateurs",
  "maintenance-qui-court",
  "pic-des-fetes",
  "export-a-ouvrir",
  "gamme-vegetale",
  "offre-de-rachat",
]);

/** Le nombre de décisions où la meilleure option a le titre le plus long (à égalité compris). */
function decisionsTrahies(code: string): number {
  const ep = EPISODES.find((e) => e.code === code)!;
  const meilleur = ep.references[0]!.chemin;
  return ep.etapes.filter((e, d) => {
    const longueurs = e.options.map((o) => o.t.length);
    return longueurs[meilleur[d]!]! >= Math.max(...longueurs);
  }).length;
}

describe("la longueur des options", () => {
  it("dans chaque épisode rééquilibré, la meilleure option n'est la plus longue que deux fois au plus", () => {
    const trahis = EPISODES.filter((e) => !A_REEQUILIBRER.has(e.code))
      .map((e) => ({ code: e.code, n: decisionsTrahies(e.code) }))
      .filter((x) => x.n > PLAFOND);
    expect(trahis.map((x) => `${x.code} (${x.n} sur 6)`)).toEqual([]);
  });

  it("la liste des épisodes à rééquilibrer est exacte : un épisode corrigé en sort", () => {
    const codes = new Set(EPISODES.map((e) => e.code));
    for (const code of A_REEQUILIBRER) {
      expect(codes.has(code), code).toBe(true);
      expect(decisionsTrahies(code), code).toBeGreaterThan(PLAFOND);
    }
  });
});
