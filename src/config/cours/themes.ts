import { FAMILLES } from "../episodes/familles";

/**
 * LE CATALOGUE PAR THÈME (décision du propriétaire, octobre 2026).
 *
 * La page du cours rangeait les chapitres par parcours, et un parcours mêlait
 * une discipline (la comptabilité générale, le contrôle de gestion) et un
 * diplôme (le BTS MCO, le bac STMG). Un enseignant qui cherchait « le seuil de
 * rentabilité » le trouvait deux fois, sous deux parcours, sans savoir lequel
 * prendre. Le propriétaire a choisi d'entrer par le thème : une notion se range
 * une fois, sous son thème, et le diplôme devient un filtre qui compile le
 * programme.
 *
 * Chaque chapitre appartient à un thème et un seul ; la garde du catalogue le
 * vérifie. Les épisodes manager, joués en situation, s'y rangent par leur
 * famille : une famille va sous un thème, et un épisode que sa famille range
 * mal (l'équipier du libre-service, dans une famille d'employés de bureau)
 * se déplace seul.
 *
 * Chaque thème a désormais ses chapitres : l'organisation les a reçus avec le parcours
 * du BTS GPME, la stratégie avec le parcours « Stratégie et management » (octobre
 * 2026). Un thème sans chapitre ne vivrait que par ses épisodes, et la page le dirait
 * au lieu de le taire.
 */
export interface Theme {
  code: string;
  titre: string;
  /** Une phrase : ce que le thème fait travailler. */
  description: string;
  /** Les chapitres du thème, dans l'ordre où ils s'enchaînent. */
  chapitres: readonly string[];
  /** Les familles d'épisodes dont les épisodes travaillent ce thème. */
  familles: readonly string[];
}

export const THEMES: readonly Theme[] = [
  {
    code: "comptabilite",
    titre: "Comptabilité générale",
    description:
      "Du flux au journal, du journal au bilan : chaque opération passée par l'élève, et les états qu'il construit.",
    chapitres: [
      "les-flux-de-l-entreprise",
      "charges-produits-encaissements",
      "creation-premier-bilan",
      "remises-et-reglements",
      "la-paie",
      "l-emprunt",
      "immobilisations",
      "les-stocks",
      "la-cloture",
      "depreciations-et-provisions",
      "regularisations-de-fin-d-exercice",
      "la-declaration-de-tva",
      "la-tva-et-la-tresorerie",
      "l-impot-sur-les-societes",
      "le-deficit-reporte",
    ],
    familles: [],
  },
  {
    code: "analyse-financiere",
    titre: "Analyse financière et financement",
    description:
      "Lire les comptes d'une entreprise : ce qu'elle a gagné, ce qu'elle possède, ce qu'elle doit, et comment elle se finance.",
    chapitres: [
      "lire-le-compte-de-resultat",
      "lire-le-bilan",
      "valeur-ajoutee-et-partage",
      "rentabilite",
      "fonds-de-roulement-et-tresorerie",
      "financer-l-entreprise",
      "soldes-intermediaires-de-gestion",
      "bilan-fonctionnel-et-bfr",
      "le-client-qui-paie-tard",
      "le-projet-d-entreprise",
    ],
    familles: ["finance"],
  },
  {
    code: "controle-de-gestion",
    titre: "Contrôle de gestion",
    description:
      "Des coûts aux décisions : marges, seuil de rentabilité, coûts complets, budgets, écarts et tableaux de bord.",
    chapitres: [
      "prix-cout-et-marge",
      "decider-avec-des-chiffres",
      "evaluer-son-activite",
      "le-cout-matiere",
      "occupation-et-revenu-par-chambre",
      "seuil-de-rentabilite",
      "cout-complet",
      "cout-par-produit",
      "budget-de-tresorerie",
      "analyse-des-ecarts",
      "tableau-de-bord",
      "decider-prix-fabriquer-acheter",
    ],
    familles: ["chiffres", "controle", "hotel-couts", "conseil-marge", "sante-budget"],
  },
  {
    code: "marketing",
    titre: "Marketing",
    description:
      "Le marché, les clients, le prix, la communication et la distribution : les questions du mercaticien, chiffres à l'appui.",
    chapitres: [
      "marche-et-part-de-marche",
      "segmenter-et-cibler",
      "prix-psychologique",
      "demande-et-prix",
      "le-prix-selon-la-saison",
      "ce-que-rapporte-la-communication",
      "canaux-de-distribution",
    ],
    familles: ["hotel-remplir"],
  },
  {
    code: "vente",
    titre: "Vente et relation client",
    description:
      "Négocier, accorder une remise, garder un client, acquérir le suivant : ce que rapporte une affaire, et un portefeuille.",
    chapitres: [
      "negocier-le-prix",
      "remises-et-conditions",
      "valeur-d-un-client",
      "cout-d-acquisition",
      "commissions-des-partenaires",
      "portefeuille-abc",
      "tableau-de-bord-commercial",
    ],
    familles: ["vendre", "conseil-vendre", "agro-distribution", "sante-accueillir"],
  },
  {
    code: "point-de-vente",
    titre: "Commerce et point de vente",
    description:
      "La marge, le stock, l'assortiment, la promotion, le budget et l'équipe d'un magasin : la gestion opérationnelle d'une unité commerciale.",
    chapitres: [
      "taux-de-marque-et-coefficient",
      "indicateurs-du-point-de-vente",
      "stock-du-point-de-vente",
      "prevoir-les-ventes",
      "budget-du-point-de-vente",
      "seuil-du-point-de-vente",
      "promotion-qui-paie",
      "assortiment",
      "equipe-et-planning",
      "tableau-de-bord-du-manager",
    ],
    familles: [],
  },
  {
    code: "ressources-humaines",
    titre: "Ressources humaines et management",
    description:
      "L'effectif et ce qu'il coûte, le salaire, le recrutement, les compétences, la cohésion d'une équipe et le changement.",
    chapitres: [
      "effectif-et-masse-salariale",
      "salaire-brut-net-cout",
      "recruter",
      "remuneration-et-motivation",
      "former",
      "indicateurs-sociaux",
      "le-depart-d-un-salarie",
      "la-productivite-du-service",
    ],
    familles: [
      "equipe",
      "talents",
      "changement",
      "hotel-saison",
      "conseil-equipe",
      "conseil-talents",
      "sante-equipes",
      "agro-equipes",
    ],
  },
  {
    code: "organisation",
    titre: "Organisation, production et systèmes d'information",
    description:
      "Faire tourner l'activité : les flux, la qualité, la sécurité, les processus administratifs et les systèmes d'information.",
    chapitres: [
      "organiser-l-activite",
      "choisir-son-fournisseur",
      "s-assurer-contre-les-aleas",
      "le-cout-de-la-non-qualite",
      "entretenir-l-outil",
      "des-donnees-a-l-information",
      "construire-un-indicateur-juste",
      "une-donnee-fausse",
      "ce-que-coute-un-outil-numerique",
    ],
    familles: ["operations", "premier-poste", "hotel-service", "sante-soins", "agro-produire", "agro-amont"],
  },
  {
    code: "strategie",
    titre: "Stratégie",
    description:
      "Les choix de direction : un marché à ouvrir, un concurrent à racheter, un investissement, une organisation à redessiner.",
    chapitres: [
      "le-diagnostic-strategique",
      "se-fixer-des-objectifs",
      "couts-ou-differenciation",
      "lire-la-strategie-des-concurrents",
      "croitre-en-investissant",
      "la-responsabilite-societale",
    ],
    familles: ["strategie", "hotel-strategie", "conseil-strategie", "sante-strategie", "agro-strategie"],
  },
];

/**
 * LES ÉPISODES QUE LEUR FAMILLE RANGE MAL. L'équipier du libre-service est dans
 * la famille des premiers postes, rangée sous l'organisation ; ce qu'il fait
 * (recevoir, réassortir, conseiller) est le commerce d'un magasin.
 */
const THEME_DE_L_EPISODE: Readonly<Record<string, string>> = {
  "libre-service-qui-perd": "point-de-vente",
};

/** Le thème d'un chapitre, ou undefined s'il n'est rangé nulle part (la garde l'interdit). */
export function themeDuChapitre(code: string): Theme | undefined {
  return THEMES.find((t) => t.chapitres.includes(code));
}

/** Le thème d'un épisode : celui que fixe l'exception, sinon celui de sa famille. */
export function themeDeLEpisode(code: string): Theme | undefined {
  const force = THEME_DE_L_EPISODE[code];
  if (force) return THEMES.find((t) => t.code === force);
  const famille = FAMILLES.find((f) => f.episodes.includes(code));
  return famille ? THEMES.find((t) => t.familles.includes(famille.code)) : undefined;
}

/** Les épisodes d'un thème, dans l'ordre des familles. */
export function episodesDuTheme(theme: Theme): string[] {
  return FAMILLES.flatMap((f) => f.episodes).filter((code) => themeDeLEpisode(code)?.code === theme.code);
}
