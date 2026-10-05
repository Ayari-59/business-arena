/**
 * LES FAMILLES D'ÉPISODES, pour la page de choix.
 *
 * Quarante-huit épisodes côte à côte ne se lisent plus : on les range par grand pan
 * du métier de manager. Chaque épisode est dans une famille et une seule ; un
 * test le vérifie sur le registre.
 */
export interface Famille {
  code: string;
  titre: string;
  texte: string;
  /** Les codes des épisodes, dans l'ordre où on les propose. */
  episodes: readonly string[];
}

export const FAMILLES: readonly Famille[] = [
  {
    code: "vendre",
    titre: "Vendre et fidéliser",
    texte: "Le chiffre, la marge et les clients : ce qui fait vivre une agence.",
    episodes: [
      "trimestre-qui-derape",
      "agence-qui-demarre",
      "appel-d-offres",
      "prix-qui-ne-passe-plus",
      "client-qui-s-en-va",
      "site-qui-ne-vend-pas",
    ],
  },
  {
    code: "chiffres",
    titre: "Piloter les chiffres",
    texte: "Budget, achats, trésorerie, indicateurs : décider sur les bons chiffres.",
    episodes: [
      "budget-qui-ne-tient-pas",
      "fournisseur-qui-augmente",
      "tresorerie-qui-fond",
      "indicateur-qui-ment",
      "facture-qui-flambe",
      "controle-qui-s-annonce",
    ],
  },
  {
    code: "operations",
    titre: "Faire tourner les opérations",
    texte: "Stocks, qualité, sécurité, livraisons, crise : quand le terrain se grippe.",
    episodes: [
      "depot-qui-deborde",
      "reclamation-qui-enfle",
      "quai-dangereux",
      "panne-qui-paralyse",
      "tournees-qui-debordent",
    ],
  },
  {
    code: "equipe",
    titre: "Manager une équipe",
    texte: "Charge, performance, délégation, distance : tenir une équipe dans la durée.",
    episodes: [
      "equipe-qui-s-epuise",
      "collaborateur-qui-decroche",
      "agenda-qui-deborde",
      "equipe-dispersee",
      "cent-premiers-jours",
    ],
  },
  {
    code: "talents",
    titre: "Recruter, développer, garder",
    texte: "Les personnes et les compétences, de l'embauche à la négociation sociale.",
    episodes: [
      "poste-qui-reste-vide",
      "talent-qui-veut-partir",
      "competences-qui-manquent",
      "preavis-de-greve",
    ],
  },
  {
    code: "changement",
    titre: "Conduire le changement",
    texte: "Projets, réorganisations, rachats, nouvelles offres : faire bouger sans casser.",
    episodes: [
      "projet-qui-glisse",
      "reorganisation-qui-coince",
      "fusion-des-agences",
      "nouveau-service",
    ],
  },
  {
    code: "controle",
    titre: "Calculer ses coûts",
    texte: "Coût marginal, coûts partiels, seuil, écarts, goulot : décider sur le bon coût.",
    episodes: [
      "commande-a-prix-casse",
      "produit-deficitaire",
      "faire-ou-faire-faire",
      "seuil-qui-bouge",
      "ecarts-du-budget",
      "atelier-sature",
    ],
  },
  {
    code: "finance",
    titre: "Financer et investir",
    texte: "Investissement, croissance, location, crédit client : l'argent qui engage l'avenir.",
    episodes: [
      "investissement-a-choisir",
      "croissance-a-financer",
      "louer-ou-acheter",
      "client-a-risque",
    ],
  },
  {
    code: "strategie",
    titre: "Choisir sa stratégie",
    texte:
      "Concurrents, rachats, nouveaux marchés, réseau, grands comptes : les paris qui engagent l'entreprise.",
    episodes: [
      "discounter-qui-arrive",
      "concurrent-a-racheter",
      "marche-qui-s-ouvre",
      "fabricant-en-direct",
      "projet-a-arreter",
      "reseau-a-redessiner",
      "pari-du-reemploi",
      "grand-compte-exclusif",
    ],
  },
];
