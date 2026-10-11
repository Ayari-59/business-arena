import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { FAMILLES, NOMBRE_D_EPISODES, SECTEURS } from "@/config/episodes/familles";
import { EPISODES_DE_DEMO, NIVEAU_DES_DEMOS } from "@/config/episodes/demos";
import type { CodeNiveau } from "@/config/episodes/niveaux";
import { QUI_FACTURE } from "@/config/editeur";
import { diplomesDesAteliers } from "@/config/formations";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import type { VitrineSolo } from "@/config/vitrine-solo";
import { NIVEAU_MAX } from "@/config/vitrine-solo";
import { formatEuro } from "@/lib/format";

/**
 * LA GRILLE TARIFAIRE, EN UN SEUL ENDROIT : LES NOMS, LES PRIX, LES TEXTES.
 *
 * La grille validée par le propriétaire (octobre 2026), dans ses mots : « Les épisodes
 * sont facturés à part. Les offres : Classe 490, Campus 990. Sans les épisodes. La vente
 * se fait sur devis. » Et, avant : « pas de tarification mensuelle, pas de possibilité de
 * tester en classe ».
 *
 *  · Découverte, gratuite : l'arène en solo aux niveaux gratuits, et une démonstration
 *    d'épisode manager par métier.
 *  · Classe, un enseignant et toutes ses classes ; Campus, tous les enseignants d'un
 *    établissement. Toutes deux ouvrent L'ARÈNE (niveaux avancés, parties de classe,
 *    suivi, ateliers, concours, relevé), et ni l'une ni l'autre n'ouvre les épisodes.
 *  · Épisodes manager, sur devis, à part : en classe ou en école (cohortes créées par
 *    l'enseignant), en entreprise ou en organisme de formation.
 *  · Toutes les offres se vendent SUR DEVIS. Les prix de Classe et Campus restent
 *    affichés : ce sont des prix de référence. Aucun paiement en ligne : chaque carte
 *    mène à une demande de devis écrite (`/devis?offre=…`).
 *
 * LES NOMS NE S'ÉCRIVENT QU'ICI. Les murs de licence, les messages du serveur, l'espace
 * enseignant, /admin et les métadonnées les lisent dans `OFFRES` et les phrases qui en
 * sont tirées ; la garde `tests/architecture/noms-des-offres.test.ts` refuse les anciens
 * noms partout ailleurs. Ce qui est vérifié côté serveur vit dans
 * `services/acces.service.ts`.
 *
 * Aucun chiffre de configuration dans la prose (CLAUDE.md) : prix, taux, délais, nombres
 * d'épisodes, d'ateliers et d'entreprises se lisent de la donnée.
 *
 * Ce module est lu par des pages et des services ; il ne l'est jamais par un composant
 * client (il tire le registre des scénarios). Un composant client reçoit le texte dont il
 * a besoin de la page serveur qui le rend.
 */

/* ---------------------------------------------------------------------------
 * LES NOMS.
 * ------------------------------------------------------------------------- */

/** Les offres de la grille, par code. Le code est celui des adresses (`?offre=`). */
export const OFFRES = {
  decouverte: { code: "decouverte", nom: "Découverte" },
  classe: { code: "classe", nom: "Classe" },
  campus: { code: "campus", nom: "Campus" },
  reseau: { code: "reseau", nom: "Réseaux d'établissements" },
  episodes: { code: "episodes", nom: "Épisodes manager" },
} as const;

/** Les deux offres de l'arène, celles qu'une licence porte comme « arène ». */
export type OffreDeLArene = "classe" | "campus";
export const OFFRES_DE_L_ARENE: readonly OffreDeLArene[] = ["classe", "campus"];
export const estUneOffreDeLArene = (v: unknown): v is OffreDeLArene =>
  v === "classe" || v === "campus";

/** « Offre Classe », « Offre Campus », « Offre Épisodes manager ». */
export const nomDOffre = (code: keyof typeof OFFRES): string => `Offre ${OFFRES[code].nom}`;

/** Ce qui ouvre l'arène, en une marque : « Offre Classe ou Campus ». */
export const MARQUE_DE_L_ARENE = `Offre ${OFFRES.classe.nom} ou ${OFFRES.campus.nom}`;

/** Ce qui ouvre l'arène, dans une phrase : « les offres Classe et Campus ». */
export const LES_OFFRES_DE_L_ARENE = `les offres ${OFFRES.classe.nom} et ${OFFRES.campus.nom}`;
const LES_OFFRES_DE_L_ARENE_EN_TETE = `Les offres ${OFFRES.classe.nom} et ${OFFRES.campus.nom}`;

/** Ce qui ouvre les épisodes, en une marque : « Épisodes manager · sur devis ». */
export const MARQUE_DES_EPISODES = `${OFFRES.episodes.nom} · sur devis`;

/* ---------------------------------------------------------------------------
 * LES PRIX ET LES CONDITIONS.
 * ------------------------------------------------------------------------- */

/**
 * LA TVA. Décision du propriétaire : l'entité qui vend (config/editeur.ts) est une
 * micro-entreprise en franchise de TVA. Les prix sont donc des prix nets : ni « HT », ni
 * « TTC », ni taux de TVA, et cette mention, exacte, là où un prix ou un devis se lit
 * (en-tête de /tarifs, conditions de vente, confirmation de demande de devis).
 */
export const MENTION_TVA = "TVA non applicable, art. 293 B du CGI";

/** Les deux offres de l'arène, par an : des prix de référence, vendus sur devis. */
export const PRIX: Record<OffreDeLArene, number> = {
  classe: 490,
  campus: 990,
};

/**
 * À partir de combien d'enseignants l'offre Campus coûte moins que autant d'offres
 * Classe. Calculé, jamais écrit : il suit les prix.
 */
export function seuilCampusAvantageux(): number {
  return Math.floor(PRIX.campus / PRIX.classe) + 1;
}

/** Le plafond d'enseignants que porte chaque offre de l'arène ; null : sans plafond. */
export const PLAFOND_D_ENSEIGNANTS: Record<OffreDeLArene, number | null> = {
  classe: 1,
  campus: null,
};

/** Les niveaux de l'arène ouverts dans l'offre gratuite ; les suivants sont payants. */
export const DERNIER_NIVEAU_GRATUIT = 3;

/** Les tours d'une partie complète en solo. */
export const TOURS_DE_LA_PARTIE_SOLO = 6;

/** Une démonstration d'épisode manager par métier des épisodes. */
export const EPISODES_DE_DEMONSTRATION = SECTEURS.filter((s) =>
  FAMILLES.some((f) => f.secteur === s.code),
).length;

/** Les réseaux d'établissements passent sur devis à partir de ce nombre. */
export const SEUIL_RESEAU_ETABLISSEMENTS = 10;

/** La cohorte animée des entreprises. */
export const COHORTE = { managers: 15, episodesMin: 3, episodesMax: 6 } as const;

/** Les conditions de vente. */
export const CONDITIONS = {
  /** Délai de paiement d'une facture, en jours. */
  delaiFactureJours: 30,
  /** Après la fin de l'offre, les parties et les résultats restent consultables. */
  consultationApresMois: 12,
  /** L'année scolaire de l'offre Campus. */
  anneeScolaire: { debut: "1er septembre", fin: "31 août" },
} as const;

const NIVEAUX = [...DIFFICULTY_PRESETS].sort((a, b) => a.level - b.level);
const nomsDesNiveaux = (de: number, a: number) =>
  NIVEAUX.filter((p) => p.level >= de && p.level <= a).map((p) => p.name);
/** « A, B et C ». */
function enumeration(mots: readonly string[]): string {
  if (mots.length < 2) return mots.join("");
  return `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}
const DERNIER_NIVEAU = NIVEAUX[NIVEAUX.length - 1]!.level;

export const NIVEAUX_GRATUITS = {
  de: 1,
  a: DERNIER_NIVEAU_GRATUIT,
  noms: enumeration(nomsDesNiveaux(1, DERNIER_NIVEAU_GRATUIT)),
};
export const NIVEAUX_PAYANTS = {
  de: DERNIER_NIVEAU_GRATUIT + 1,
  a: DERNIER_NIVEAU,
  noms: enumeration(nomsDesNiveaux(DERNIER_NIVEAU_GRATUIT + 1, DERNIER_NIVEAU)),
};

/** « 490 € » : un prix affiché, au format de tout le site. */
export const prixAffiche = (montant: number) => formatEuro(montant);
/** « 490 € par an ». */
export const prixParAn = (montant: number) => `${prixAffiche(montant)} par an`;

/** Les ateliers adossés au référentiel d'un diplôme, et ces diplômes (une option compte pour son diplôme). */
export const ATELIERS_A_REFERENTIEL = ATELIERS.filter((a) => a.formations.length > 0);
export const DIPLOMES_DES_ATELIERS = diplomesDesAteliers(ATELIERS);

/* ---------------------------------------------------------------------------
 * LA DEMANDE DE DEVIS.
 * ------------------------------------------------------------------------- */

/** Ce qu'une demande de devis peut viser ; le code de l'adresse `/devis?offre=…`. */
export type OffreDuDevis = "classe" | "campus" | "reseau" | "episodes" | "entreprise";

export const OFFRES_DU_DEVIS: readonly OffreDuDevis[] = [
  "classe",
  "campus",
  "reseau",
  "episodes",
  "entreprise",
];

export const estUneOffreDuDevis = (v: unknown): v is OffreDuDevis =>
  typeof v === "string" && (OFFRES_DU_DEVIS as readonly string[]).includes(v);

/** L'adresse de la demande de devis, l'offre pré-remplie. */
export const lienDuDevis = (offre: OffreDuDevis): string => `/devis?offre=${offre}`;

/**
 * CE QUE LE FORMULAIRE DEMANDE, SELON LE PUBLIC. Un lycée a un UAI et compte des
 * enseignants ; une entreprise a un SIRET et compte des managers.
 */
export interface LibellesDuDevis {
  /** Le nom de ce qui est demandé, tel que le formulaire et l'e-mail le disent. */
  offre: string;
  organisation: string;
  exempleOrganisation: string;
  identifiant: string;
  effectif: string;
}

const ENSEIGNEMENT = {
  organisation: "Établissement",
  exempleOrganisation: "Lycée Jean-Monnet, Lille",
  identifiant: "UAI (facultatif)",
  effectif: "Nombre d'enseignants",
};

export const LIBELLES_DU_DEVIS: Record<OffreDuDevis, LibellesDuDevis> = {
  classe: { offre: nomDOffre("classe"), ...ENSEIGNEMENT },
  campus: { offre: nomDOffre("campus"), ...ENSEIGNEMENT },
  reseau: {
    offre: OFFRES.reseau.nom,
    ...ENSEIGNEMENT,
    organisation: "Réseau, groupe ou académie",
    exempleOrganisation: "Groupe scolaire, académie, région",
    effectif: "Nombre d'établissements",
  },
  episodes: {
    offre: `${OFFRES.episodes.nom}, en classe ou en école`,
    ...ENSEIGNEMENT,
    exempleOrganisation: "École, université, lycée",
  },
  entreprise: {
    offre: `${OFFRES.episodes.nom}, pour une entreprise ou un organisme de formation`,
    organisation: "Organisation",
    exempleOrganisation: "Entreprise, organisme de formation",
    identifiant: "SIRET (facultatif)",
    effectif: "Nombre de managers",
  },
};

/** Le bouton de chaque carte : une demande de devis écrite. */
export const LIBELLE_DU_DEVIS = "Demander un devis";

/* ---------------------------------------------------------------------------
 * LES OFFRES DE L'ARÈNE, DANS L'ORDRE DE LA PAGE.
 * ------------------------------------------------------------------------- */

/** Un bouton de carte : où il mène, ce qu'il dit, et s'il est l'action de l'écran. */
export interface BoutonDOffre {
  libelle: string;
  href: string;
  /** Le seul bouton plein de la page : l'offre qu'on veut vendre. */
  principal?: true;
}

export interface OffreEnseignement {
  code: "decouverte" | OffreDeLArene;
  nom: string;
  /** Pour qui, en une ligne. */
  pourQui: string;
  /** Le prix annuel de référence ; absent pour l'offre gratuite. */
  prix?: number;
  /** Ce qui distingue l'offre, en une mention neutre. */
  mention?: string;
  inclus: string[];
  /** Ce qu'il faut savoir avant de demander un devis. */
  precisions: string[];
  bouton: BoutonDOffre;
}

/** Ce que les offres de l'arène n'ouvrent pas, dit sur chaque carte. */
export const SANS_LES_EPISODES = "Sans les épisodes manager, qui se proposent à part, sur devis.";

export const OFFRES_ENSEIGNEMENT: readonly OffreEnseignement[] = [
  {
    code: "decouverte",
    nom: OFFRES.decouverte.nom,
    pourQui: "Sans compte, pour voir le simulateur de près.",
    inclus: [
      `L'arène en solo sur les ${SCENARIO_CHOICES.length} entreprises, niveaux ${NIVEAUX_GRATUITS.de} à ${NIVEAUX_GRATUITS.a} (${NIVEAUX_GRATUITS.noms}), en partie complète de ${TOURS_DE_LA_PARTIE_SOLO} tours.`,
      "Les fiches notions, le manuel et le guide.",
      `Un épisode manager de démonstration par métier (${EPISODES_DE_DEMONSTRATION} sur ${NOMBRE_D_EPISODES}), au niveau Découverte, avec son bilan.`,
    ],
    precisions: [`Les parties de classe et les concours commencent avec ${LES_OFFRES_DE_L_ARENE}.`],
    bouton: { libelle: "Tester le simulateur", href: "/jouer" },
  },
  {
    code: "classe",
    nom: OFFRES.classe.nom,
    pourQui: "Un enseignant, toutes ses classes.",
    prix: PRIX.classe,
    inclus: [
      `Tout ${OFFRES.decouverte.nom}.`,
      `Les niveaux ${NIVEAUX_PAYANTS.de} à ${NIVEAUX_PAYANTS.a} (${NIVEAUX_PAYANTS.noms}).`,
      "Les parties de classe : codes élèves sans compte ni e-mail, équipes, entreprises en concurrence.",
      "Le suivi : tableau de bord, observation, relevé de notes, révélation et projection en classe.",
      `Les ${ATELIERS.length} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont ${ATELIERS_A_REFERENTIEL.length} adossés au référentiel d'un diplôme (${DIPLOMES_DES_ATELIERS.map((d) => d.sigle).join(", ")}).`,
      "Les concours et le classement à l'IPG.",
    ],
    precisions: [SANS_LES_EPISODES, "À l'année, pour un enseignant."],
    bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("classe") },
  },
  {
    code: "campus",
    nom: OFFRES.campus.nom,
    pourQui: "Tous les enseignants d'un établissement, sans limite.",
    prix: PRIX.campus,
    mention: `Plus avantageux dès ${seuilCampusAvantageux()} enseignants`,
    inclus: [
      `Toute l'offre ${OFFRES.classe.nom}, pour chaque enseignant de l'établissement.`,
      "Un référent qui gère les accès.",
      "Une facture au nom de l'établissement.",
      `Une licence par année scolaire, du ${CONDITIONS.anneeScolaire.debut} au ${CONDITIONS.anneeScolaire.fin}.`,
    ],
    precisions: [
      SANS_LES_EPISODES,
      "Sur devis, puis bon de commande ou mandat administratif ; Chorus Pro pour les factures publiques.",
    ],
    bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("campus"), principal: true },
  },
];

/** Les réseaux d'établissements, sous les trois cartes. */
export const RESEAUX = {
  texte: `Groupes scolaires, académies, régions, réseaux d'écoles : à partir de ${SEUIL_RESEAU_ETABLISSEMENTS} établissements, sur devis.`,
  bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("reseau") } satisfies BoutonDOffre,
};

/* ---------------------------------------------------------------------------
 * LES ÉPISODES MANAGER : UNE OFFRE À PART, SUR DEVIS, SANS PRIX AFFICHÉ.
 * Le propriétaire teste d'abord les prix d'appel ; la page ne publie que les formules.
 * ------------------------------------------------------------------------- */

export interface FormuleDEpisodes {
  nom: string;
  inclus: string[];
}

/** En classe et en école : les cohortes que l'enseignant crée depuis son espace. */
export const FORMULE_EN_CLASSE: FormuleDEpisodes = {
  nom: "En classe et en école de commerce",
  inclus: [
    `Les ${NOMBRE_D_EPISODES} épisodes, choisis par l'enseignant pour chaque groupe.`,
    "Des cohortes créées depuis l'espace enseignant : les étudiants entrent par un code, sans compte.",
    "La vue de l'animateur, et une fiche de débrief pour les épisodes en classe.",
  ],
};

export const BOUTON_EN_CLASSE: BoutonDOffre = {
  libelle: LIBELLE_DU_DEVIS,
  href: lienDuDevis("episodes"),
};

/** Les entreprises et les organismes de formation. */
export const FORMULES_ENTREPRISES: readonly FormuleDEpisodes[] = [
  {
    nom: "Parcours manager",
    inclus: [
      `Les ${NOMBRE_D_EPISODES} épisodes, en autonomie.`,
      "Le profil décisionnel, et la recommandation du prochain épisode.",
      "Sans compte à créer : un code de cohorte pour entrer, un code de reprise pour changer d'appareil.",
    ],
  },
  {
    nom: "Cohorte animée",
    inclus: [
      `${COHORTE.managers} managers, ${COHORTE.episodesMin} à ${COHORTE.episodesMax} épisodes choisis, un code de cohorte.`,
      "La vue de l'animateur.",
      "Une demi-journée de lancement, et un débrief animé à distance.",
    ],
  },
  {
    nom: "Organisme de formation",
    inclus: [
      "Des animateurs sans limite, des cohortes à volonté.",
      `Le guide de débrief des ${NOMBRE_D_EPISODES} épisodes.`,
    ],
  },
];

export const BOUTON_ENTREPRISES: BoutonDOffre = {
  libelle: LIBELLE_DU_DEVIS,
  href: lienDuDevis("entreprise"),
};

/* ---------------------------------------------------------------------------
 * LES OPTIONS, LES CONDITIONS, LES QUESTIONS.
 * ------------------------------------------------------------------------- */

/**
 * LA CONNEXION À UN ENT OU À UN LMS. Une étude est en cours ; rien n'est promis, rien
 * n'est daté. /tarifs et /ecoles disent la même chose, d'ici.
 */
export const CONNEXION_ENT = {
  nom: "Connexion à votre ENT ou à votre LMS",
  prix: "Nous contacter",
  reponse:
    "Connexion ENT ou LMS : nous contacter. Les participants rejoignent aujourd'hui par un code, sans compte, et le relevé de notes de l'arène s'exporte en tableur.",
} as const;

/** Les options : courtes, sans prix ; la seule gratuite est le rendez-vous qui existe. */
export const OPTIONS: readonly { nom: string; prix: "Gratuit" | "Sur devis" | "Nous contacter" }[] = [
  { nom: "Un rendez-vous téléphonique de prise en main, à la demande", prix: "Gratuit" },
  { nom: "Formation d'une équipe pédagogique", prix: "Sur devis" },
  { nom: "Animation sur site", prix: "Sur devis" },
  { nom: "Scénario sur mesure : une entreprise fictive à l'image de la vôtre", prix: "Sur devis" },
  { nom: "Compétition inter-établissements", prix: "Sur devis" },
  { nom: CONNEXION_ENT.nom, prix: CONNEXION_ENT.prix },
];

/**
 * LES CONDITIONS DE VENTE, en phrases. Ni paiement par carte (le site n'encaisse rien),
 * ni rappel par courriel (aucun envoi ne le fait) : l'échéance se lit dans l'espace
 * enseignant. Le lieu d'hébergement n'y figure pas : il n'est pas confirmé.
 */
export const CONDITIONS_DE_VENTE: readonly string[] = [
  `Prix annuels, établis sur devis. ${MENTION_TVA}.`,
  "Toutes les offres se vendent sur devis : vous recevez un devis écrit, vous le retournez signé ou vous émettez un bon de commande, la licence est ouverte, puis la facture suit.",
  QUI_FACTURE,
  `Facture payable à ${CONDITIONS.delaiFactureJours} jours, par virement ou par mandat administratif. Les factures publiques passent par Chorus Pro.`,
  `Durée : un an pour l'offre ${OFFRES.classe.nom} et les épisodes manager, une année scolaire pour l'offre ${OFFRES.campus.nom}.`,
  "Pas de reconduction tacite : l'échéance s'affiche dans l'espace enseignant, et le renouvellement passe par un nouveau devis.",
  `À la fin de l'offre, les parties et les résultats restent consultables ${CONDITIONS.consultationApresMois} mois, relevé de notes compris.`,
  "Les élèves jouent sans nom ni e-mail : un code suffit.",
];

/** Les questions qu'on nous pose avant d'acheter. */
export const QUESTIONS_TARIFS: readonly { q: string; r: string }[] = [
  {
    q: "Les élèves paient-ils ?",
    r: "Non, jamais. Ils rejoignent la partie de leur enseignant avec un code, sans compte ni e-mail.",
  },
  {
    q: "Comment commander ?",
    r: "Demandez un devis écrit depuis cette page : il précise l'offre, le nombre d'enseignants et la durée. Bon de commande, mandat administratif et Chorus Pro sont acceptés.",
  },
  {
    q: "Peut-on essayer avec une classe ?",
    r: `Non. Découvrez le simulateur en solo avec l'offre gratuite ; les parties de classe commencent avec ${LES_OFFRES_DE_L_ARENE}.`,
  },
  {
    q: "Les épisodes manager sont-ils inclus ?",
    r: `Non. ${LES_OFFRES_DE_L_ARENE_EN_TETE} ouvrent l'arène. Les épisodes manager se proposent à part, sur devis, en classe comme en entreprise ; ${EPISODES_DE_DEMO.length} démonstrations restent gratuites.`,
  },
];

/* ---------------------------------------------------------------------------
 * LES PHRASES QUE LE RESTE DU SITE TIRE DE LA GRILLE.
 * ------------------------------------------------------------------------- */

/** La ligne de prix des bandes finales (/enseignants, /ecoles, /fonctionnalites). */
export const LIGNE_DE_PRIX = `${nomDOffre("classe")} ${prixParAn(PRIX.classe)}, offre ${OFFRES.campus.nom} ${prixParAn(PRIX.campus)}, sur devis. Les épisodes manager se proposent à part, sur devis.`;

/** La réponse du guide à « Combien ça coûte ? » (audit C-08). */
export const REPONSE_COMBIEN = `La découverte en solo est gratuite, sans compte. Pour la classe, l'offre ${OFFRES.classe.nom} coûte ${prixParAn(PRIX.classe)} pour un enseignant, l'offre ${OFFRES.campus.nom} ${prixParAn(PRIX.campus)} pour tout l'établissement, sur devis. Les épisodes manager se proposent à part, sur devis.`;

/** Les niveaux fermés, et ce qui les ouvre : « Les niveaux 4 à 6 sont inclus dans les offres Classe et Campus. » */
export function messageNiveauxReserves(vitrine: VitrineSolo): string {
  const premier = vitrine.niveauMaxAutres + 1;
  return premier >= NIVEAU_MAX
    ? `Le niveau ${NIVEAU_MAX} est inclus dans ${LES_OFFRES_DE_L_ARENE}.`
    : `Les niveaux ${premier} à ${NIVEAU_MAX} sont inclus dans ${LES_OFFRES_DE_L_ARENE}.`;
}

/** Le refus d'une partie de classe ou d'un concours sans offre de l'arène en cours. */
export const REFUS_DE_LA_CLASSE = `Les parties de classe et les concours sont inclus dans ${LES_OFFRES_DE_L_ARENE}. Sans offre en cours, l'arène se joue en solo, aux niveaux ${NIVEAUX_GRATUITS.de} à ${NIVEAUX_GRATUITS.a}. Les parties déjà créées se poursuivent.`;

/** Le refus du dossier enseignant d'un atelier (les corrigés) sans offre de l'arène en cours. */
export const REFUS_DU_DOSSIER = `Le dossier enseignant des ateliers, avec ses corrigés, est inclus dans ${LES_OFFRES_DE_L_ARENE}.`;

/** Le refus du relevé de notes sans offre de l'arène, ni fin d'offre récente. */
export const REFUS_DU_RELEVE = `Le relevé de notes est inclus dans ${LES_OFFRES_DE_L_ARENE}, et reste téléchargeable ${CONDITIONS.consultationApresMois} mois après la fin de l'offre.`;

/** Le refus d'une cohorte d'épisodes sans offre qui inclut les épisodes. */
export const REFUS_DES_COHORTES = `Créer une cohorte demande une offre qui inclut les épisodes manager (${MARQUE_DES_EPISODES}). ${LES_OFFRES_DE_L_ARENE_EN_TETE} seules ne les ouvrent pas. Les ${EPISODES_DE_DEMO.length} épisodes de démonstration se jouent sans cohorte, par leur lien.`;

/** Sans licence épisodes : ce que l'offre ouvre (le lien vers le devis suit). `total` : les épisodes du registre. */
export const ceQuOuvrentLesEpisodes = (total: number): string =>
  `L'offre ${OFFRES.episodes.nom}, sur devis, ouvre les ${total} épisodes aux niveaux Standard et Expert, et le profil décisionnel qu'ils construisent.`;

/** Le conseil de niveau sans licence épisodes : la démonstration ne se joue qu'en Découverte. */
export const POURQUOI_LA_DECOUVERTE = `Sans licence, les démonstrations se jouent en Découverte, qui ne compte pas dans le profil. Les niveaux Standard et Expert, qui le construisent, sont inclus dans l'offre ${OFFRES.episodes.nom}, sur devis.`;

/**
 * Le niveau conseillé sans licence épisodes : la démonstration ne se joue qu'en
 * Découverte, et le profil ne compte pas la Découverte. Le conseil le dit plutôt que de
 * proposer un niveau qui ne se lance pas.
 */
export const CONSEIL_SANS_LICENCE: { niveau: CodeNiveau; pourquoi: string } = {
  niveau: NIVEAU_DES_DEMOS,
  pourquoi: POURQUOI_LA_DECOUVERTE,
};

/** Devant un élève : jamais de message de vente (audit C-02). */
export const EPISODE_FERME_POUR_L_ELEVE =
  "Cet épisode n'est pas ouvert sur cet appareil ; demandez le lien à votre enseignant.";
