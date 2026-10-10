/**
 * LES SECTEURS ET LES FAMILLES D'ÉPISODES, pour la page de choix.
 *
 * Des dizaines d'épisodes côte à côte ne se lisent plus : on les range d'abord
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
  /**
   * LA TEINTE DU MÉTIER (lot 5A), empruntée aux jetons `--secteur-*` de
   * `globals.css`. Un épisode se joue dans une entreprise : la couleur qui dit
   * laquelle l'accompagne du premier message au bilan, comme dans l'arène. Les
   * cinq secteurs des épisodes ne sont pas ceux des scénarios de l'arène
   * (négoce, hôtellerie-restauration, conseil, santé, agroalimentaire) : chacun
   * emprunte donc le jeton dont la teinte le distingue le mieux des quatre
   * autres, et c'est ce nom, ici, qui en est la seule source.
   *
   * Les emprunts ont été REFAITS avec les teintes franches : les neuf familles
   * ne se répartissent plus sur la roue comme les teintes délavées du lot 5A,
   * et le meilleur cinq a changé. L'hôtellerie-restauration prend le jeton
   * `restauration` et l'agroalimentaire le jeton `transport` : ce choix fait
   * passer le plus petit écart entre les cinq de 3,3 à 6,9 (mesuré, les deux
   * côtés de la composition, déficience de vision comprise).
   *
   * LOT P6 : le jeton `services` est devenu un glacier (#12f8fe sur le marine),
   * qui se confond en deutéranopie avec le mauve de l'e-commerce (1,5 d'écart).
   * La santé, qui l'empruntait, prend le vert de l'abonnement : le pire écart
   * des cinq (vision normale et déficiences, les deux côtés) passe de 1,5 à
   * 5,35, au-dessus des 4,2 d'avant le lot, mesurés de la même façon.
   */
  teinte: string;
}

export const SECTEURS: readonly Secteur[] = [
  {
    code: "negoce",
    teinte: "commerce",
    nom: "Négoce et distribution",
    entreprise: "Arvel Distribution",
    texte:
      "Arvel Distribution fournit les artisans du bâtiment autour de Lyon : des agences et leurs comptoirs, un dépôt, des tournées de livraison.",
  },
  {
    code: "hotellerie",
    teinte: "restauration",
    nom: "Hôtellerie-restauration",
    entreprise: "Groupe Escale",
    texte:
      "Le Groupe Escale, groupe familial de Savoie et de Haute-Savoie, réunit des hôtels, les restaurants de La Table d'Augustin et des salles de séminaire, avec son siège à Annecy.",
  },
  {
    code: "conseil",
    teinte: "services",
    nom: "Conseil",
    entreprise: "Atlas Conseil",
    texte:
      "Atlas Conseil, cabinet de conseil en management et bureau d'études né à Nantes, vend le temps de ses consultants, qui ne se stocke pas.",
  },
  {
    code: "sante",
    teinte: "abonnement",
    nom: "Santé et médico-social",
    entreprise: "Association Solvanne",
    texte:
      "L'Association Solvanne, association à but non lucratif née à Dijon, gère une clinique de réadaptation, des EHPAD, des services à domicile et un pôle handicap, avec l'argent public d'un tarif qu'elle ne fixe pas.",
  },
  {
    code: "agroalimentaire",
    teinte: "transport",
    nom: "Industrie agroalimentaire",
    entreprise: "Laiterie de Kerbrélan",
    texte:
      "La Laiterie de Kerbrélan, laiterie familiale bretonne, fabrique dans ses usines de Loudéac et de Pontivy des yaourts, du fromage blanc et des desserts, sous sa marque et pour les marques des distributeurs, qu'elle vend à la grande distribution.",
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
  {
    code: "conseil-vendre",
    titre: "Vendre et tenir une mission",
    secteur: "conseil",
    texte:
      "Appels d'offres, périmètre, livrable : gagner la mission, puis la livrer sans la perdre.",
    episodes: ["appels-d-offres-en-rafale", "client-qui-en-demande-plus", "livrable-refuse"],
  },
  {
    code: "conseil-marge",
    titre: "Piloter la marge et la trésorerie",
    secteur: "conseil",
    texte: "Jours non facturés, forfaits, en-cours : la marge d'un cabinet se perd jour par jour.",
    episodes: ["jours-non-factures", "forfait-trop-bas", "factures-qui-dorment"],
  },
  {
    code: "conseil-equipe",
    titre: "Staffer et manager",
    secteur: "conseil",
    texte: "Staffing, consultant star, promotion : tenir une équipe dont le temps est le produit.",
    episodes: ["staffing-du-lundi", "consultant-star", "promotion-refusee"],
  },
  {
    code: "conseil-talents",
    titre: "Recruter, garder, faire évoluer",
    secteur: "conseil",
    texte:
      "Départs, freelances, reconversion : un cabinet ne vaut que ce que valent ses consultants.",
    episodes: ["departs-a-deux-ans", "freelances-ou-embauches", "practice-a-reorienter"],
  },
  {
    code: "conseil-strategie",
    titre: "Décider pour le cabinet",
    secteur: "conseil",
    texte:
      "Pour la direction : assistant d'IA, départ d'un associé, positionnement, les paris qui engagent le cabinet.",
    direction: true,
    episodes: ["assistant-ia", "associe-qui-part", "generaliste-ou-specialiste"],
  },
  {
    code: "sante-accueillir",
    titre: "Accueillir et orienter",
    secteur: "sante",
    texte:
      "Lits vides, sorties qui bloquent, familles : le parcours d'un patient, de l'entrée à la sortie.",
    episodes: ["lits-vides", "sorties-qui-bloquent", "famille-qui-ecrit"],
  },
  {
    code: "sante-budget",
    titre: "Tenir le budget",
    secteur: "sante",
    texte:
      "Intérim, sections tarifaires, heure à domicile : un budget fixé par d'autres, à tenir quand même.",
    episodes: ["interim-qui-flambe", "section-en-deficit", "heure-a-domicile"],
  },
  {
    code: "sante-soins",
    titre: "Organiser les soins",
    secteur: "sante",
    texte:
      "Chutes, dossier de soins, postes de douze heures : la qualité des soins tient à leur organisation.",
    episodes: ["chutes-la-nuit", "dossier-de-soins", "postes-de-douze-heures"],
  },
  {
    code: "sante-equipes",
    titre: "Les équipes soignantes",
    secteur: "sante",
    texte: "Absentéisme, formation, jour et nuit : garder des soignants, c'est garder le soin.",
    episodes: ["absenteisme-qui-s-installe", "former-ses-soignants", "equipes-jour-et-nuit"],
  },
  {
    code: "sante-strategie",
    titre: "Décider pour l'association",
    secteur: "sante",
    texte:
      "Pour la direction : reconstruire, reprendre une association, virage domiciliaire, les paris qui engagent l'association.",
    direction: true,
    episodes: ["reconstruire-ou-regrouper", "association-a-reprendre", "virage-domiciliaire"],
  },
  {
    code: "agro-produire",
    titre: "Produire et livrer",
    secteur: "agroalimentaire",
    texte:
      "Changements de format, DLC, rappel d'un lot : produire juste ce qui se vend, avant que ça ne périme.",
    episodes: ["changements-de-format", "dlc-qui-tombe", "lot-a-rappeler"],
  },
  {
    code: "agro-distribution",
    titre: "Vendre à la grande distribution",
    secteur: "agroalimentaire",
    texte:
      "Négociations annuelles, promotions, appels d'offres MDD : des clients concentrés, des règles fixées par la loi.",
    episodes: ["negociations-annuelles", "promotion-qui-coute", "appel-d-offres-mdd"],
  },
  {
    code: "agro-amont",
    titre: "Le lait, l'énergie, les emballages",
    secteur: "agroalimentaire",
    texte:
      "Producteurs, pots, énergie : une matière première qu'on ne choisit pas au jour le jour, et ce qui l'entoure.",
    episodes: ["producteurs-qui-arretent", "pot-a-remplacer", "energie-de-l-usine"],
  },
  {
    code: "agro-equipes",
    titre: "Les équipes de l'usine",
    secteur: "agroalimentaire",
    texte:
      "Polyvalence, maintenance, pic des fêtes : une usine tient par ceux qui la conduisent et l'entretiennent.",
    episodes: ["polyvalence-des-operateurs", "maintenance-qui-court", "pic-des-fetes"],
  },
  {
    code: "agro-strategie",
    titre: "Décider pour la laiterie",
    secteur: "agroalimentaire",
    texte:
      "Pour la direction : ouvrir l'export, lancer une gamme végétale, répondre à une offre de rachat, les paris qui engagent la laiterie.",
    direction: true,
    episodes: ["export-a-ouvrir", "gamme-vegetale", "offre-de-rachat"],
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

/** La teinte à publier pour un épisode (`data-metier`, globals.css « LOT 5A »). */
export function teinteDuMetierDeLEpisode(codeEpisode: string): string | undefined {
  const famille = FAMILLES.find((f) => f.episodes.includes(codeEpisode));
  return famille ? SECTEURS.find((s) => s.code === famille.secteur)?.teinte : undefined;
}

/** Les secteurs qui ont au moins une famille, dans l'ordre de la page. */
export const secteursJoues = (): readonly Secteur[] =>
  SECTEURS.filter((s) => FAMILLES.some((f) => f.secteur === s.code));
