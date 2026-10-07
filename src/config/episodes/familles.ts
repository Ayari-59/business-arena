/**
 * LES SECTEURS ET LES FAMILLES D'ÉPISODES, pour la page de choix.
 *
 * Soixante-trois épisodes côte à côte ne se lisent plus : on les range d'abord
 * par secteur, une entreprise par secteur, puis par grand pan du métier de
 * manager. Chaque épisode est dans une famille et une seule, et les familles
 * d'un même secteur se suivent ; un test le vérifie sur le registre. Un
 * secteur sans famille n'a pas encore d'épisode : la page ne le montre pas.
 */
export interface Secteur {
  code: string;
  nom: string;
  /** L'entreprise où se jouent tous les épisodes du secteur. */
  entreprise: string;
  /** Une phrase sur l'entreprise. */
  texte: string;
}

export const SECTEURS: readonly Secteur[] = [
  {
    code: "negoce",
    nom: "Négoce et distribution",
    entreprise: "Arvel Distribution",
    texte:
      "Arvel Distribution fournit les artisans du bâtiment autour de Lyon : des agences et leurs comptoirs, un dépôt, des tournées de livraison.",
  },
  {
    code: "hotellerie",
    nom: "Hôtellerie-restauration",
    entreprise: "Groupe Escale",
    texte:
      "Le Groupe Escale, groupe familial de Savoie et de Haute-Savoie, réunit des hôtels, les restaurants de La Table d'Augustin et des salles de séminaire, avec son siège à Annecy.",
  },
  {
    code: "conseil",
    nom: "Conseil",
    entreprise: "Atlas Conseil",
    texte:
      "Atlas Conseil, cabinet de conseil en management et bureau d'études né à Nantes, vend le temps de ses consultants, qui ne se stocke pas.",
  },
];

export interface Famille {
  code: string;
  titre: string;
  texte: string;
  /** Le code du secteur, dans `SECTEURS`. */
  secteur: string;
  /** Les codes des épisodes, dans l'ordre où on les propose. */
  episodes: readonly string[];
  /**
   * Des épisodes de direction : on y décide pour l'entreprise, pas pour une
   * équipe. La recommandation ne les propose qu'à qui en a déjà joué un.
   */
  direction?: true;
}

export const FAMILLES: readonly Famille[] = [
  {
    code: "vendre",
    titre: "Vendre et fidéliser",
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
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
    secteur: "negoce",
    texte:
      "Pour les directeurs : concurrents, rachats, nouveaux marchés, réseau, grands comptes, les paris qui engagent l'entreprise.",
    direction: true,
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
  {
    code: "hotel-remplir",
    titre: "Remplir l'hôtel",
    secteur: "hotellerie",
    texte: "Prix, groupes, surréservation, note en ligne : vendre chaque chambre au bon client.",
    episodes: ["chambres-bradees", "seminaire-qui-evince", "surreservation", "note-qui-chute"],
  },
  {
    code: "hotel-couts",
    titre: "Tenir les coûts et la caisse",
    secteur: "hotellerie",
    texte: "Ratio matière, intersaison : la marge d'une cuisine et la trésorerie d'une saison.",
    episodes: ["ratio-matiere", "intersaison"],
  },
  {
    code: "hotel-service",
    titre: "Faire tourner l'hôtel",
    secteur: "hotellerie",
    texte: "Étages, cuisine, chantier : servir à l'heure quand le flux se grippe.",
    episodes: ["chambres-pas-pretes", "brigade-a-bout", "renovation-sans-fermer"],
  },
  {
    code: "hotel-saison",
    titre: "Recruter et garder en saison",
    secteur: "hotellerie",
    texte: "Saisonniers, postes vacants, apprentis : des équipes à rebâtir chaque année.",
    episodes: ["saisonniers-de-juillet", "postes-introuvables", "apprentis-qui-decrochent"],
  },
  {
    code: "hotel-strategie",
    titre: "Choisir et investir",
    secteur: "hotellerie",
    texte:
      "Pour les directeurs : laboratoire central, spa, enseigne, les paris qui engagent le groupe.",
    direction: true,
    episodes: ["cuisine-centrale", "spa-a-financer", "enseigne-a-la-porte"],
  },
];

/** Les épisodes de direction, que la recommandation garde pour qui en a déjà joué un. */
export const estUnEpisodeDeDirection = (code: string): boolean =>
  FAMILLES.some((f) => f.direction && f.episodes.includes(code));

/**
 * Le nombre d'épisodes, lu des familles plutôt que du registre : le menu du
 * site le cite sans charger les moteurs des épisodes. Le test des familles
 * garantit que les familles rangent exactement les épisodes du registre.
 */
export const NOMBRE_D_EPISODES = FAMILLES.reduce((n, f) => n + f.episodes.length, 0);

/** Les familles d'un secteur, dans l'ordre de la page. */
export const famillesDuSecteur = (code: string): readonly Famille[] =>
  FAMILLES.filter((f) => f.secteur === code);

/** Les secteurs qui ont au moins une famille, dans l'ordre de la page. */
export const secteursJoues = (): readonly Secteur[] =>
  SECTEURS.filter((s) => FAMILLES.some((f) => f.secteur === s.code));
