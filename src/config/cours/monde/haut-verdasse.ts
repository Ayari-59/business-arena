/**
 * LE MONDE DU COURS : LA COMMUNAUTÉ DE COMMUNES DU HAUT-VERDASSE, L'ORGANISATION PUBLIQUE DU COURS.
 *
 * Le programme du bac STMG demande une organisation publique à côté des entreprises (management de
 * première 1.2, 3.2 et 3.3 ; sciences de gestion et numérique T1.2 ; enseignement commun de
 * terminale 1.1 et 3.1). Décision du propriétaire (novembre 2026) : le monde du cours en reçoit une,
 * fictive, avec une association sportive qui lui répond (haut-verdasse-handball.ts).
 *
 * Le nom était déjà dans le monde : la communauté de communes est un client public d'ATLAS CONSEIL
 * (atlas-conseil.ts, compte « verdasse »). Le Haut-Verdasse est un territoire inventé, sans
 * rapport avec une collectivité réelle.
 *
 * UN ÉTABLISSEMENT PUBLIC DE COOPÉRATION INTERCOMMUNALE : quatorze communes mettent en commun des
 * services qu'aucune ne pourrait tenir seule. Il est dirigé par des élus (le conseil communautaire,
 * son président et ses vice-présidents), et ses services sont tenus par des agents territoriaux. Il
 * ne cherche pas le profit : il rend un service public, financé surtout par l'impôt et les
 * dotations de l'État, les usagers n'en payant qu'une part.
 *
 * LE BUDGET DE FONCTIONNEMENT DE L'ANNÉE N est voté en équilibre (règle de l'équilibre réel des
 * collectivités) : l'excédent des recettes sur les dépenses courantes n'est pas un bénéfice, il est
 * viré à la section d'investissement pour financer les travaux (l'autofinancement). Les chiffres
 * sont des hypothèses du cours, ronds, à l'échelle d'un territoire de 21 000 habitants ; la garde
 * tests/cours/organisations-du-territoire.test.ts refait chaque total.
 */

/** Une ligne du budget, en euros. */
export interface LigneDuBudget {
  code: string;
  libelle: string;
  montant: number;
}

/** Un service rendu au public, et ce qu'il compte. */
export interface ServiceDuTerritoire {
  code: string;
  nom: string;
  /** Le service de la communauté qui le tient. */
  service: "sports" | "culture";
  description: string;
  /** Les agents qui y travaillent (compris dans l'effectif de la communauté). */
  agents: number;
}

export const HAUT_VERDASSE = {
  code: "haut-verdasse",
  nom: "Communauté de communes du Haut-Verdasse",
  court: "le Haut-Verdasse",
  /** L'organisation publique : un établissement public de coopération intercommunale. */
  categorie: "publique",
  forme: "Établissement public de coopération intercommunale (communauté de communes)",
  presentation:
    "Quatorze communes rurales et une petite ville centre réunies pour tenir ensemble leurs équipements sportifs et culturels : une piscine, un gymnase et une médiathèque.",
  communes: 14,
  habitants: 21_000,
  /** Les élus : le conseil communautaire, désigné lors des élections municipales, élit le président et ses vice-présidents. */
  elus: {
    conseillersCommunautaires: 38,
    vicePresidents: 6,
    president: "le président de la communauté de communes, maire de la ville centre",
    /** La vice-présidente chargée des sports, qui suit la relation avec les clubs. */
    viceAuxSports: "la vice-présidente chargée des sports et de la vie associative",
  },
  /** Les agents : des fonctionnaires territoriaux et quelques contractuels, sous l'autorité de la directrice générale des services. */
  agents: {
    effectif: 120,
    direction: "la directrice générale des services",
    /** Le coût moyen d'un agent sur l'année, charges comprises : effectif × coût moyen = dépenses de personnel. */
    coutMoyenAnnuel: 40_000,
  },
  /** Les missions de service public : ce que la communauté doit à tout usager. */
  missions: [
    "Offrir à tous les habitants l'accès au sport, à la lecture et à la culture, quels que soient leurs revenus.",
    "Accueillir les écoles et les collèges du territoire pour l'apprentissage de la natation et l'éducation physique.",
    "Soutenir les associations du territoire par des subventions et la mise à disposition des équipements.",
  ],
  /** Les principes du service public (continuité, égalité, adaptabilité), tels que la communauté les applique. */
  principes: [
    { code: "continuite", nom: "Continuité", exemple: "La piscine reste ouverte l'été, quand les écoles sont fermées." },
    { code: "egalite", nom: "Égalité", exemple: "Le même tarif pour tous les habitants, réduit pour les enfants et les demandeurs d'emploi." },
    { code: "adaptabilite", nom: "Adaptabilité", exemple: "La médiathèque prête désormais des livres numériques et ouvre le samedi après-midi." },
  ],
  /** Les usagers des services. */
  usagers: [
    "les habitants des quatorze communes",
    "les élèves des écoles et des deux collèges",
    "les associations sportives et culturelles",
  ],
  services: [
    {
      code: "piscine",
      nom: "Piscine intercommunale",
      service: "sports",
      description: "Un bassin de 25 mètres et un bassin d'apprentissage ; 52 000 entrées par an, dont les scolaires.",
      agents: 14,
    },
    {
      code: "gymnase",
      nom: "Gymnase intercommunal",
      service: "sports",
      description: "Une salle de sports collectifs, occupée par les collèges en journée et par les clubs le soir et le week-end.",
      agents: 3,
    },
    {
      code: "mediatheque",
      nom: "Médiathèque du Haut-Verdasse",
      service: "culture",
      description: "38 000 livres, disques et films ; 4 200 inscrits, gratuite pour les moins de 18 ans.",
      agents: 9,
    },
  ] satisfies readonly ServiceDuTerritoire[],
  /** Le budget de fonctionnement de l'année N, voté en équilibre. */
  budget: {
    recettes: [
      { code: "dotations", libelle: "Dotations de l'État", montant: 3_100_000 },
      { code: "impots", libelle: "Impôts locaux", montant: 5_200_000 },
      { code: "usagers", libelle: "Recettes des usagers (entrées, abonnements, locations)", montant: 700_000 },
    ],
    depenses: [
      { code: "personnel", libelle: "Dépenses de personnel", montant: 4_800_000 },
      { code: "fonctionnement", libelle: "Charges de fonctionnement (énergie, entretien, achats)", montant: 3_300_000 },
      { code: "subventions", libelle: "Subventions aux associations", montant: 400_000 },
      { code: "autofinancement", libelle: "Virement à la section d'investissement", montant: 500_000 },
    ],
  } satisfies { recettes: readonly LigneDuBudget[]; depenses: readonly LigneDuBudget[] },
  /** Ce que paient les usagers, service par service : la part des 700 000 € de recettes des usagers. */
  recettesDesUsagers: [
    { code: "piscine", libelle: "Entrées et abonnements de la piscine", montant: 410_000 },
    { code: "mediatheque", libelle: "Abonnements adultes de la médiathèque", montant: 30_000 },
    { code: "gymnase", libelle: "Locations du gymnase", montant: 20_000 },
    { code: "autres", libelle: "Accueil de loisirs et autres services", montant: 240_000 },
  ] satisfies readonly LigneDuBudget[],
} as const;

/**
 * CE QUE LA COMMUNAUTÉ DONNE AU CLUB DE HANDBALL (haut-verdasse-handball.ts), voté par le conseil
 * communautaire et compris dans ses 400 000 € de subventions aux associations.
 */
export const SOUTIEN_AU_HANDBALL = {
  /** La subvention de fonctionnement de l'année, versée en une fois en mars. */
  subvention: 18_000,
  /**
   * LA MISE À DISPOSITION DU GYMNASE, gratuite : des créneaux du soir et du week-end. La
   * communauté la valorise au tarif de location qu'elle applique aux autres utilisateurs ; le club
   * l'inscrit en contribution en nature, hors de son budget en argent.
   */
  gymnase: { heuresParSemaine: 6, semaines: 32, tarifHoraire: 25 },
} as const;

/** La valeur de la mise à disposition du gymnase sur l'année : heures × semaines × tarif. */
export const VALEUR_DE_LA_MISE_A_DISPOSITION =
  SOUTIEN_AU_HANDBALL.gymnase.heuresParSemaine * SOUTIEN_AU_HANDBALL.gymnase.semaines * SOUTIEN_AU_HANDBALL.gymnase.tarifHoraire;

/** La somme d'une liste de lignes du budget. */
export const totalDe = (lignes: readonly LigneDuBudget[]): number => lignes.reduce((n, l) => n + l.montant, 0);
