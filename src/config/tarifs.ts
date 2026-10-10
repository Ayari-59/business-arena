import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { FAMILLES, NOMBRE_D_EPISODES, SECTEURS } from "@/config/episodes/familles";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { formatEuro, formatPercent } from "@/lib/format";

/**
 * LA GRILLE TARIFAIRE, EN UN SEUL ENDROIT.
 *
 * C'est la grille que le propriétaire a validée : un palier gratuit pour
 * découvrir, deux abonnements pour faire cours, une offre sur devis pour les
 * entreprises et les organismes de formation. La page `/tarifs` la lit ; elle
 * n'écrit aucun prix, aucun taux, aucun délai à la main (CLAUDE.md : « aucun
 * chiffre de configuration dans une prose statique »). Changer un prix, c'est
 * changer une ligne ici, et la garde `tests/architecture/tarifs.test.ts`
 * relit ce que la page en tire.
 *
 * Le principe tient en une phrase : le gratuit montre, le payant organise.
 * L'élève ne paie jamais.
 *
 * CE QUE LA GRILLE ANNONCE ET QUE LE JEU NE FERME PAS ENCORE. Les niveaux 4 à
 * 6 et les épisodes au-delà de l'essai sont rangés dans les offres payantes ;
 * aujourd'hui ils restent ouverts à tous dans le jeu (`config/entitlements.ts`,
 * `config/vitrine-solo.ts`). Les fermer est une décision séparée : la page
 * annonce la grille, elle ne règle pas les accès.
 *
 * LE PAIEMENT EN LIGNE N'EXISTE PAS. « Commander » mène à la prise de
 * rendez-vous ; aucune page ne propose de payer.
 */

/** Le taux de TVA appliqué aux prix hors taxes. */
export const TAUX_TVA = 0.2;

/** Un prix toutes taxes comprises, à l'euro (les prix de la grille tombent juste). */
export function prixTTC(prixHT: number): number {
  return Math.round(prixHT * (1 + TAUX_TVA));
}

/** Les deux abonnements de l'enseignement, hors taxes, par an. */
export const PRIX_HT = {
  enseignant: 490,
  etablissement: 990,
} as const;

/**
 * À partir de combien d'enseignants l'offre Établissement coûte moins que
 * autant d'abonnements Enseignant. Calculé, jamais écrit : il suit les prix.
 */
export function seuilEtablissementAvantageux(): number {
  return Math.floor(PRIX_HT.etablissement / PRIX_HT.enseignant) + 1;
}

/** Les niveaux de l'arène ouverts dans l'offre gratuite ; les suivants sont payants. */
export const DERNIER_NIVEAU_GRATUIT = 3;

/** Les tours d'une partie complète en solo. */
export const TOURS_DE_LA_PARTIE_SOLO = 6;

/** Un épisode manager d'essai par métier des épisodes. */
export const EPISODES_D_ESSAI = SECTEURS.filter((s) => FAMILLES.some((f) => f.secteur === s.code)).length;

/** Les réseaux d'établissements passent sur devis à partir de ce nombre. */
export const SEUIL_RESEAU_ETABLISSEMENTS = 10;

/** La cohorte animée des entreprises. */
export const COHORTE = { managers: 15, episodesMin: 3, episodesMax: 6 } as const;

/** Les conditions de vente. */
export const CONDITIONS = {
  /** Délai de paiement d'une facture, en jours. */
  delaiFactureJours: 30,
  /** Rappel avant l'échéance, en jours : il n'y a pas de reconduction tacite. */
  rappelAvantEcheanceJours: 30,
  /** Après la fin de l'abonnement, les parties et résultats restent consultables. */
  consultationApresMois: 12,
  /** L'année scolaire de la licence Établissement. */
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
/** « 20 % ». */
export const TVA_AFFICHEE = formatPercent(TAUX_TVA);

/** Un bouton de carte : où il mène, ce qu'il dit, et s'il est l'action de l'écran. */
export interface BoutonDOffre {
  libelle: string;
  href: string;
  /** Le seul bouton plein de la page : l'offre qu'on veut vendre. */
  principal?: true;
}

export interface OffreEnseignement {
  code: "decouverte" | "enseignant" | "etablissement";
  nom: string;
  /** Pour qui, en une ligne. */
  pourQui: string;
  /** Le prix HT annuel ; absent pour l'offre gratuite. */
  prixHT?: number;
  /** Ce qui distingue l'offre, en une mention neutre. */
  mention?: string;
  inclus: string[];
  /** Ce qu'il faut savoir avant de commander. */
  precisions: string[];
  bouton: BoutonDOffre;
}

/** LES TROIS OFFRES DE L'ENSEIGNEMENT, dans l'ordre de la page. */
export const OFFRES_ENSEIGNEMENT: readonly OffreEnseignement[] = [
  {
    code: "decouverte",
    nom: "Découverte",
    pourQui: "Sans compte, pour voir le simulateur de près.",
    inclus: [
      `L'arène en solo sur les ${SCENARIO_CHOICES.length} entreprises, niveaux ${NIVEAUX_GRATUITS.de} à ${NIVEAUX_GRATUITS.a} (${NIVEAUX_GRATUITS.noms}), en partie complète de ${TOURS_DE_LA_PARTIE_SOLO} tours.`,
      "Les fiches notions, le manuel et le guide.",
      `Un épisode manager d'essai par métier (${EPISODES_D_ESSAI} sur ${NOMBRE_D_EPISODES}), au niveau Découverte, avec son bilan.`,
    ],
    precisions: ["L'usage en classe commence avec l'abonnement Enseignant."],
    bouton: { libelle: "Tester le simulateur", href: "/jouer" },
  },
  {
    code: "enseignant",
    nom: "Enseignant",
    pourQui: "Un enseignant, toutes ses classes.",
    prixHT: PRIX_HT.enseignant,
    inclus: [
      "Tout Découverte.",
      `Les niveaux ${NIVEAUX_PAYANTS.de} à ${NIVEAUX_PAYANTS.a} (${NIVEAUX_PAYANTS.noms}).`,
      "Les parties de classe : codes élèves sans compte ni e-mail, équipes, entreprises en concurrence.",
      "Le suivi : tableau de bord, observation, carnet de notes, révélation et projection en classe.",
      `Les ${ATELIERS.length} ateliers clés en main alignés sur les référentiels (STMG, BTS CG, MCO, NDRC, GPME, MHR, BUT GEA, DCG…), avec déroulé, corrigés et dossier enseignant.`,
      "Les compétitions et le classement à l'IPG.",
    ],
    precisions: [
      "À l'année seulement.",
      "Pour découvrir avant de vous abonner : l'offre Découverte, en solo.",
    ],
    bouton: { libelle: "Commander", href: "/rendez-vous" },
  },
  {
    code: "etablissement",
    nom: "Établissement",
    pourQui: "Tous les enseignants d'un établissement, sans limite.",
    prixHT: PRIX_HT.etablissement,
    mention: `Plus avantageux dès ${seuilEtablissementAvantageux()} enseignants`,
    inclus: [
      "Toute l'offre Enseignant, pour chaque enseignant de l'établissement.",
      "Un référent qui gère les accès.",
      "Une facture au nom de l'établissement.",
      `Une licence par année scolaire, du ${CONDITIONS.anneeScolaire.debut} au ${CONDITIONS.anneeScolaire.fin}.`,
    ],
    precisions: ["Achat par bon de commande, sur facture, ou par Chorus Pro."],
    bouton: { libelle: "Demander un bon de commande", href: "/rendez-vous", principal: true },
  },
];

/** Les réseaux d'établissements, sous les trois cartes. */
export const RESEAUX = {
  texte: `Groupes scolaires, académies, régions, réseaux d'écoles : à partir de ${SEUIL_RESEAU_ETABLISSEMENTS} établissements, sur devis.`,
};

export interface FormuleEntreprise {
  nom: string;
  inclus: string[];
}

/**
 * LES ENTREPRISES ET LES ORGANISMES DE FORMATION : SUR DEVIS, SANS PRIX
 * AFFICHÉ. Le propriétaire teste d'abord les prix d'appel ; la page ne publie
 * que les formules.
 */
export const FORMULES_ENTREPRISES: readonly FormuleEntreprise[] = [
  {
    nom: "Parcours manager",
    inclus: [
      `Les ${NOMBRE_D_EPISODES} épisodes, en autonomie.`,
      "Le profil décisionnel, et la recommandation du prochain épisode.",
      "Un compte par manager.",
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

export const BOUTON_ENTREPRISES: BoutonDOffre = { libelle: "Demander un devis", href: "/rendez-vous" };

/** Les options : courtes, sans prix, sauf la seule qui est gratuite. */
export const OPTIONS: readonly { nom: string; prix: "Gratuit" | "Sur devis" }[] = [
  { nom: "Webinaire de prise en main, une session chaque mois", prix: "Gratuit" },
  { nom: "Formation d'une équipe pédagogique", prix: "Sur devis" },
  { nom: "Animation sur site", prix: "Sur devis" },
  { nom: "Scénario sur mesure : une entreprise fictive à l'image de la vôtre", prix: "Sur devis" },
  { nom: "Compétition inter-établissements", prix: "Sur devis" },
  { nom: "Connexion à votre ENT ou à votre LMS (SSO)", prix: "Sur devis" },
];

/**
 * LES CONDITIONS DE VENTE, en phrases. Le lieu d'hébergement n'y figure pas :
 * il n'est pas confirmé.
 */
export const CONDITIONS_DE_VENTE: readonly string[] = [
  `Prix hors taxes, TVA ${TVA_AFFICHEE} en sus.`,
  "Offre Enseignant : paiement par carte bancaire ou sur facture.",
  `Autres offres : facture à ${CONDITIONS.delaiFactureJours} jours, bon de commande et mandat administratif acceptés. Les factures publiques passent par Chorus Pro.`,
  "Durée : un an pour l'offre Enseignant et les offres entreprises, une année scolaire pour l'offre Établissement.",
  `Pas de reconduction tacite : un rappel vous est envoyé ${CONDITIONS.rappelAvantEcheanceJours} jours avant l'échéance.`,
  `À la fin de l'abonnement, les parties et les résultats restent consultables ${CONDITIONS.consultationApresMois} mois.`,
  "Les élèves jouent sans nom ni e-mail : un code suffit.",
];

/** Trois questions, pas plus. */
export const QUESTIONS_TARIFS: readonly { q: string; r: string }[] = [
  {
    q: "Les élèves paient-ils ?",
    r: "Non, jamais. Ils rejoignent la partie de leur enseignant avec un code, sans compte ni e-mail.",
  },
  {
    q: "Peut-on payer par bon de commande ?",
    r: "Oui. L'offre Établissement s'achète sur bon de commande ou sur facture, et les factures publiques passent par Chorus Pro.",
  },
  {
    q: "Peut-on essayer avec une classe ?",
    r: "Non. Découvrez le simulateur en solo avec l'offre gratuite ; l'usage en classe commence avec l'abonnement.",
  },
];
