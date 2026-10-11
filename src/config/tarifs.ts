import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { FAMILLES, NOMBRE_D_EPISODES, SECTEURS } from "@/config/episodes/familles";
import { EPISODES_DE_DEMO, NIVEAU_DES_DEMOS } from "@/config/episodes/demos";
import type { CodeNiveau } from "@/config/episodes/niveaux";
import { QUI_FACTURE } from "@/config/editeur";
import { diplomesDesAteliers } from "@/config/formations";
import {
  DEFAULT_SCENARIO_CODE,
  familyOf,
  SCENARIO_CHOICES,
  type Sector,
} from "@/config/scenarios/registry";
import type { VitrineSolo } from "@/config/vitrine-solo";
import { NIVEAU_MAX } from "@/config/vitrine-solo";
import { formatEuro } from "@/lib/format";

/**
 * LA GRILLE TARIFAIRE, EN UN SEUL ENDROIT : LES NOMS, LES PRIX, LES TEXTES.
 *
 * La grille validée par le propriétaire (octobre 2026), dans ses mots : « Je veux
 * formuler 3 offres scolaires dont une à 1 990 : offre Classe : un jeu paramétré pour une
 * classe ; une offre [Programme] : une entreprise avec possibilité d'utiliser plusieurs
 * classes et plusieurs niveaux ; une offre Campus avec entreprises et classes
 * illimitées. » L'offre du milieu s'appelle Programme (décision suivante : « aller davantage
 * vers les business schools » ; un programme d'école, Bachelor, Grande École, MSc, BTS, et
 * toutes ses promotions). Ses réponses : 290, 990 et 1 990 € par an ; Classe = une classe, une
 * entreprise et un niveau choisis à l'achat, autant de parties que voulu dans l'année
 * avec ce paramétrage ; enseignants : un, l'équipe du programme, sans limite. Avant :
 * « Les épisodes sont facturés à part. La vente se fait sur devis. » et « pas de
 * tarification mensuelle, pas de possibilité de tester en classe ».
 *
 *  · Découverte, gratuite : l'arène en solo aux niveaux gratuits, et une démonstration
 *    d'épisode manager par métier.
 *  · Classe, Programme, Campus : trois offres de L'ARÈNE (parties de classe, suivi,
 *    ateliers, concours, relevé), chacune avec son PARAMÉTRAGE (`PARAMETRAGE_DES_OFFRES` :
 *    entreprises, niveaux, enseignants, parties en cours). Aucune n'ouvre les épisodes.
 *  · Épisodes manager, sur devis, à part : en classe ou en école (cohortes créées par
 *    l'enseignant), en entreprise ou en organisme de formation.
 *  · Toutes les offres se vendent SUR DEVIS. Les prix de Classe, Programme et Campus restent
 *    affichés : ce sont des prix de référence. Aucun paiement en ligne : chaque carte
 *    mène à une demande de devis écrite (`/devis?offre=…`).
 *
 * LES NOMS NE S'ÉCRIVENT QU'ICI. Les murs de licence, les messages du serveur, l'espace
 * enseignant, /admin et les métadonnées les lisent dans `OFFRES` et les phrases qui en
 * sont tirées ; la garde `tests/architecture/noms-des-offres.test.ts` refuse les anciens
 * noms partout ailleurs. Ce qui est vérifié côté serveur vit dans
 * `services/acces.service.ts`, qui lit ici la règle (`horsLicence`) et ses phrases.
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
  programme: { code: "programme", nom: "Programme" },
  campus: { code: "campus", nom: "Campus" },
  reseau: { code: "reseau", nom: "Réseaux d'établissements" },
  episodes: { code: "episodes", nom: "Épisodes manager" },
} as const;

/** Les trois offres de l'arène, celles qu'une licence porte comme « arène », de la plus petite à la plus grande. */
export type OffreDeLArene = "classe" | "programme" | "campus";
export const OFFRES_DE_L_ARENE: readonly OffreDeLArene[] = ["classe", "programme", "campus"];
export const estUneOffreDeLArene = (v: unknown): v is OffreDeLArene =>
  typeof v === "string" && (OFFRES_DE_L_ARENE as readonly string[]).includes(v);

/** « Offre Classe », « Offre Programme », « Offre Campus », « Offre Épisodes manager ». */
export const nomDOffre = (code: keyof typeof OFFRES): string => `Offre ${OFFRES[code].nom}`;

/** Ce qui ouvre l'arène, en une marque : « Offre Classe, Programme ou Campus ». */
export const MARQUE_DE_L_ARENE = `Offre ${OFFRES.classe.nom}, ${OFFRES.programme.nom} ou ${OFFRES.campus.nom}`;

/** Ce qui ouvre l'arène, dans une phrase : « les offres Classe, Programme et Campus ». */
export const LES_OFFRES_DE_L_ARENE = `les offres ${OFFRES.classe.nom}, ${OFFRES.programme.nom} et ${OFFRES.campus.nom}`;
const LES_OFFRES_DE_L_ARENE_EN_TETE = `Les offres ${OFFRES.classe.nom}, ${OFFRES.programme.nom} et ${OFFRES.campus.nom}`;

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

/** Les trois offres de l'arène, par an : des prix de référence, vendus sur devis. */
export const PRIX: Record<OffreDeLArene, number> = {
  classe: 290,
  programme: 990,
  campus: 1990,
};

/**
 * LES MENTIONS COMPARATIVES, CALCULÉES SUR LES PRIX, JAMAIS ÉCRITES.
 *
 * Un Programme, c'est une entreprise et plusieurs groupes : il coûte moins que autant
 * d'offres Classe dès `seuilProgrammeAvantageux()` groupes (une Classe par groupe). Un
 * Campus, ce sont toutes les entreprises : il coûte moins que autant d'offres Programme
 * dès `seuilCampusAvantageux()` entreprises (un Programme par entreprise). « Moins cher »
 * s'entend strictement : à prix égal, la mention ne s'affiche pas plus tôt.
 */
export function seuilProgrammeAvantageux(): number {
  return Math.floor(PRIX.programme / PRIX.classe) + 1;
}
export function seuilCampusAvantageux(): number {
  return Math.floor(PRIX.campus / PRIX.programme) + 1;
}

/**
 * LE PARAMÉTRAGE DE CHAQUE OFFRE DE L'ARÈNE (décision du propriétaire, octobre 2026).
 *
 *  · entreprises : « une » (choisie à l'achat) ou « toutes » ;
 *  · niveaux : « un » (choisi à l'achat, de 1 à 6) ou « tous » ;
 *  · enseignants : un nombre, « devis » (l'équipe pédagogique et les intervenants du
 *    programme, plafond fixé au devis),
 *    ou null (sans limite) ;
 *  · partiesEnCours : les parties de classe et concours EN COURS en même temps ; null,
 *    sans plafond. « Une classe » se traduit par UNE PARTIE À LA FOIS : le produit n'a
 *    pas d'objet « classe » (la table `classes` existe, aucune page ne la remplit), et
 *    une partie de classe est ce qui réunit un groupe d'élèves. Autant de parties que
 *    voulu dans l'année, l'une après l'autre.
 */
export interface ParametrageDeLOffre {
  entreprises: "une" | "toutes";
  niveaux: "un" | "tous";
  enseignants: number | "devis" | null;
  partiesEnCours: number | null;
}
export const PARAMETRAGE_DES_OFFRES: Record<OffreDeLArene, ParametrageDeLOffre> = {
  classe: { entreprises: "une", niveaux: "un", enseignants: 1, partiesEnCours: 1 },
  programme: { entreprises: "une", niveaux: "tous", enseignants: "devis", partiesEnCours: null },
  campus: { entreprises: "toutes", niveaux: "tous", enseignants: null, partiesEnCours: null },
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
const PREMIER_NIVEAU = NIVEAUX[0]!.level;

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

/** « 290 € » : un prix affiché, au format de tout le site. */
export const prixAffiche = (montant: number) => formatEuro(montant);
/** « 290 € par an ». */
export const prixParAn = (montant: number) => `${prixAffiche(montant)} par an`;

/** Les ateliers adossés au référentiel d'un diplôme, et ces diplômes (une option compte pour son diplôme). */
export const ATELIERS_A_REFERENTIEL = ATELIERS.filter((a) => a.formations.length > 0);
export const DIPLOMES_DES_ATELIERS = diplomesDesAteliers(ATELIERS);

/* ---------------------------------------------------------------------------
 * LE PARAMÉTRAGE D'UNE LICENCE, ET CE QUI EN SORT.
 * ------------------------------------------------------------------------- */

/** Les entreprises de l'arène : une par famille, le code de sa tuile (celui que la licence porte). */
export const ENTREPRISES: readonly { code: string; nom: string; secteur: Sector }[] = SCENARIO_CHOICES.map(
  (s) => ({ code: s.code, nom: s.playerTeamName, secteur: s.sector }),
);

/** « NOVA », « L'ESCALE » : le nom d'une entreprise par son code. */
export const nomDeLEntreprise = (code: string): string =>
  ENTREPRISES.find((e) => e.code === code)?.nom ?? code;

/**
 * L'entreprise d'un code de scénario intégré : NOVA en gamme est NOVA. Null pour un code
 * hors registre (un scénario d'enseignant se rattache par son secteur,
 * `entrepriseDuSecteur`).
 */
export function entrepriseDuScenario(code: string | null | undefined): string | null {
  const c = code || DEFAULT_SCENARIO_CODE;
  const famille = familyOf(c);
  if (famille) return famille.head;
  return ENTREPRISES.some((e) => e.code === c) ? c : null;
}

/** L'entreprise d'un secteur : chaque entreprise de l'arène a le sien. */
export const entrepriseDuSecteur = (secteur: Sector): string | null =>
  ENTREPRISES.find((e) => e.secteur === secteur)?.code ?? null;

/** Les concours se jouent avec cette entreprise (services/competition.service.ts). */
export const ENTREPRISE_DES_CONCOURS = DEFAULT_SCENARIO_CODE;

/** Les niveaux de l'arène, du premier au dernier. */
export const NIVEAUX_DE_L_ARENE: readonly { niveau: number; nom: string }[] = NIVEAUX.map((p) => ({
  niveau: p.level,
  nom: p.name,
}));

/** « niveau 3 Pilotage ». */
export const nomDuNiveau = (n: number): string => {
  const nom = NIVEAUX.find((p) => p.level === n)?.name;
  return nom ? `niveau ${n} ${nom}` : `niveau ${n}`;
};

/** Ce qu'une licence de l'arène ouvre, tel qu'il est enregistré (org_licences, migration 0038). */
export interface ParametrageDeLicence {
  offre: OffreDeLArene;
  /** Les codes des entreprises ouvertes ; null : toutes. */
  entreprises: readonly string[] | null;
  /** Les niveaux ouverts ; null : tous. */
  niveaux: readonly number[] | null;
  /** Le plafond d'enseignants ; null : sans limite. */
  maxEnseignants: number | null;
  /** Le plafond de parties de classe et de concours en cours en même temps ; null : sans plafond. */
  maxPartiesEnCours: number | null;
}

/**
 * LE PARAMÉTRAGE QU'ON ENREGISTRE POUR UNE OFFRE, à partir de ce que l'admin a choisi
 * dans /admin. Lève, avec une phrase lisible, si un choix que l'offre demande manque :
 * l'entreprise (Classe, Programme), le niveau (Classe), le plafond d'enseignants
 * (Programme : il est fixé au devis).
 */
export function parametrageDeLOffre(
  offre: OffreDeLArene,
  choix: { entreprise?: string | null; niveau?: number | null; maxEnseignants?: number | null },
): ParametrageDeLicence {
  const regle = PARAMETRAGE_DES_OFFRES[offre];
  let entreprises: string[] | null = null;
  if (regle.entreprises === "une") {
    if (!choix.entreprise || !ENTREPRISES.some((e) => e.code === choix.entreprise)) {
      throw new Error(`L'offre ${OFFRES[offre].nom} porte une entreprise : choisissez-la.`);
    }
    entreprises = [choix.entreprise];
  }
  let niveaux: number[] | null = null;
  if (regle.niveaux === "un") {
    if (!choix.niveau || !NIVEAUX.some((p) => p.level === choix.niveau)) {
      throw new Error(`L'offre ${OFFRES[offre].nom} porte un niveau : choisissez-le.`);
    }
    niveaux = [choix.niveau];
  }
  let maxEnseignants: number | null;
  if (regle.enseignants === "devis") {
    if (!choix.maxEnseignants || !Number.isInteger(choix.maxEnseignants) || choix.maxEnseignants < 1) {
      throw new Error(
        `L'offre ${OFFRES[offre].nom} porte le nombre d'enseignants et d'intervenants fixé au devis : indiquez-le.`,
      );
    }
    maxEnseignants = choix.maxEnseignants;
  } else {
    maxEnseignants = regle.enseignants;
  }
  return { offre, entreprises, niveaux, maxEnseignants, maxPartiesEnCours: regle.partiesEnCours };
}

/** L'offre de l'arène au-dessus : Classe, puis Programme, puis Campus. */
const offreAuDessus = (o: OffreDeLArene): OffreDeLArene =>
  OFFRES_DE_L_ARENE[Math.min(OFFRES_DE_L_ARENE.indexOf(o) + 1, OFFRES_DE_L_ARENE.length - 1)]!;

const enseignants = (n: number) => `${n} ${n > 1 ? "enseignants et intervenants" : "enseignant"}`;

/** Ce que chaque offre ouvre aux enseignants, dans la phrase d'un refus. */
const ENSEIGNANTS_DE_L_OFFRE: Record<OffreDeLArene, string> = {
  classe: "un enseignant",
  programme: "l'équipe pédagogique et aux intervenants du programme",
  campus: "tous les enseignants et intervenants de l'école, sans limite",
};

/** Ce qui est demandé à la licence : une création de partie de classe ou de concours. */
export interface DemandeALaLicence {
  /** L'entreprise jouée ; null : un scénario qu'on ne sait rattacher à aucune entreprise. */
  entreprise?: string | null;
  /** Le niveau joué ; absent : la vérification ne porte pas sur le niveau (concours). */
  niveau?: number;
  /** Les enseignants rattachés à l'établissement. */
  enseignants?: number;
  /** Les parties de classe et concours en cours, et le nom de l'une d'elles. */
  partiesEnCours?: { nombre: number; laquelle: string | null };
}

/** Ce qui sort de la licence : quoi, la phrase qui le dit, et l'offre qui l'ouvre. */
export interface HorsLicence {
  quoi: "entreprise" | "niveau" | "enseignants" | "parties";
  message: string;
  /** L'offre qui ouvre ce qui bloque (le lien de devis la pré-remplit). */
  offre: OffreDeLArene;
}

/**
 * LA RÈGLE DE LA LICENCE, EN UNE FONCTION PURE : services/acces.service.ts l'applique
 * côté serveur, les pages la lisent pour marquer ce qui sort de la licence AVANT l'envoi.
 * Null : la demande est couverte. Chaque refus dit CE QUI bloque et ce que l'offre
 * au-dessus ouvre.
 */
export function horsLicence(p: ParametrageDeLicence, d: DemandeALaLicence): HorsLicence | null {
  const votre = `Votre offre ${OFFRES[p.offre].nom}`;
  if (d.entreprise !== undefined && p.entreprises !== null && !(d.entreprise && p.entreprises.includes(d.entreprise))) {
    const quoi = d.entreprise ? nomDeLEntreprise(d.entreprise) : "Ce scénario";
    return {
      quoi: "entreprise",
      offre: "campus",
      message: `${votre} couvre ${enumeration(p.entreprises.map(nomDeLEntreprise))}. ${quoi} n'en fait pas partie : l'offre ${OFFRES.campus.nom} ouvre les ${ENTREPRISES.length} entreprises.`,
    };
  }
  if (d.niveau !== undefined && p.niveaux !== null && !p.niveaux.includes(d.niveau)) {
    const offre: OffreDeLArene = p.offre === "classe" ? "programme" : "campus";
    return {
      quoi: "niveau",
      offre,
      message: `${votre} couvre le ${enumeration(p.niveaux.map(nomDuNiveau))}. Le ${nomDuNiveau(d.niveau)} n'en fait pas partie : l'offre ${OFFRES[offre].nom} ouvre les niveaux ${PREMIER_NIVEAU} à ${DERNIER_NIVEAU}${offre === "programme" ? " pour la même entreprise" : ""}.`,
    };
  }
  if (d.enseignants !== undefined && p.maxEnseignants !== null && d.enseignants > p.maxEnseignants) {
    const offre = offreAuDessus(p.offre);
    return {
      quoi: "enseignants",
      offre,
      message: `${votre} couvre ${enseignants(p.maxEnseignants)}, et l'établissement en compte ${d.enseignants}. L'offre ${OFFRES[offre].nom} ouvre l'arène à ${ENSEIGNANTS_DE_L_OFFRE[offre]}.`,
    };
  }
  if (d.partiesEnCours !== undefined && p.maxPartiesEnCours !== null && d.partiesEnCours.nombre >= p.maxPartiesEnCours) {
    const offre = offreAuDessus(p.offre);
    const enCours = d.partiesEnCours.laquelle
      ? `« ${d.partiesEnCours.laquelle} » est en cours`
      : "il y en a déjà en cours";
    const couvre =
      p.maxPartiesEnCours === 1
        ? `${votre} couvre un groupe à la fois, une partie de classe ou un concours en cours, et ${enCours}.`
        : `${votre} couvre ${p.maxPartiesEnCours} parties ou concours en cours à la fois, et ${enCours}.`;
    return {
      quoi: "parties",
      offre,
      message: `${couvre} Terminez ou rangez ce qui est en cours pour en créer une autre ; l'offre ${OFFRES[offre].nom} ouvre plusieurs groupes en même temps.`,
    };
  }
  return null;
}

/**
 * Un refus dit sans la valeur refusée (le code seul a voyagé dans l'adresse, comme sur la
 * page d'activité LTI) : ce que la licence couvre, et ce que l'offre au-dessus ouvre.
 */
export function refusSansLaDemande(p: ParametrageDeLicence, quoi: HorsLicence["quoi"]): string {
  const offre: OffreDeLArene =
    quoi === "entreprise" ? "campus" : quoi === "niveau" && p.offre === "classe" ? "programme" : offreAuDessus(p.offre);
  const couvre = `Votre offre ${OFFRES[p.offre].nom} couvre`;
  const ouvre = `L'offre ${OFFRES[offre].nom} ouvre`;
  switch (quoi) {
    case "entreprise":
      return `${couvre} ${enumeration((p.entreprises ?? []).map(nomDeLEntreprise))}. ${ouvre} les ${ENTREPRISES.length} entreprises.`;
    case "niveau":
      return `${couvre} le ${enumeration((p.niveaux ?? []).map(nomDuNiveau))}. ${ouvre} les niveaux ${PREMIER_NIVEAU} à ${DERNIER_NIVEAU}.`;
    case "enseignants":
      return `${couvre} ${enseignants(p.maxEnseignants ?? 0)}, et l'établissement en compte plus. ${ouvre} l'arène à ${ENSEIGNANTS_DE_L_OFFRE[offre]}.`;
    case "parties":
      return `${couvre} un groupe à la fois, et une partie ou un concours est en cours. ${ouvre} plusieurs groupes en même temps.`;
  }
}

/** La marque d'un choix hors licence (« Offre Campus »), ou null s'il est couvert. */
export function marqueHorsLicence(p: ParametrageDeLicence, d: DemandeALaLicence): string | null {
  const h = horsLicence(p, d);
  return h ? nomDOffre(h.offre) : null;
}

/**
 * Le paramétrage, en clair : « NOVA · niveau 3 Pilotage », « L'ESCALE · tous niveaux ».
 * Vide pour une licence sans restriction (Campus).
 */
export function parametrageEnClair(p: ParametrageDeLicence): string {
  if (p.entreprises === null && p.niveaux === null && p.offre === "campus") return "";
  return [
    p.entreprises === null ? "toutes les entreprises" : enumeration(p.entreprises.map(nomDeLEntreprise)),
    p.niveaux === null ? "tous niveaux" : enumeration(p.niveaux.map(nomDuNiveau)),
  ].join(" · ");
}

/* ---------------------------------------------------------------------------
 * LA DEMANDE DE DEVIS.
 * ------------------------------------------------------------------------- */

/** Ce qu'une demande de devis peut viser ; le code de l'adresse `/devis?offre=…`. */
export type OffreDuDevis = OffreDeLArene | "reseau" | "episodes" | "entreprise";

export const OFFRES_DU_DEVIS: readonly OffreDuDevis[] = [
  "classe",
  "programme",
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
 * CE QUE LE FORMULAIRE DEMANDE, SELON LE PUBLIC. Une école ou un lycée a un UAI et compte
 * des enseignants et des intervenants ; une entreprise a un SIRET et compte des managers.
 * Les offres Classe et Programme se paramètrent à l'achat : le formulaire demande
 * l'entreprise souhaitée, et pour Classe le niveau ; Classe est pour un enseignant, le
 * formulaire ne demande donc pas d'effectif.
 */
export interface LibellesDuDevis {
  /** Le nom de ce qui est demandé, tel que le formulaire et l'e-mail le disent. */
  offre: string;
  organisation: string;
  exempleOrganisation: string;
  identifiant: string;
  /** Le libellé de l'effectif ; absent : le formulaire ne le demande pas. */
  effectif?: string;
  /** Le formulaire demande l'entreprise souhaitée. */
  entreprise?: true;
  /** Le formulaire demande le niveau souhaité. */
  niveau?: true;
}

const ENSEIGNEMENT = {
  organisation: "École ou établissement",
  exempleOrganisation: "École de commerce, lycée, université",
  identifiant: "UAI (facultatif)",
  effectif: "Nombre d'enseignants et d'intervenants",
};

export const LIBELLES_DU_DEVIS: Record<OffreDuDevis, LibellesDuDevis> = {
  classe: {
    offre: nomDOffre("classe"),
    organisation: ENSEIGNEMENT.organisation,
    exempleOrganisation: ENSEIGNEMENT.exempleOrganisation,
    identifiant: ENSEIGNEMENT.identifiant,
    entreprise: true,
    niveau: true,
  },
  programme: {
    offre: nomDOffre("programme"),
    ...ENSEIGNEMENT,
    entreprise: true,
  },
  campus: { offre: nomDOffre("campus"), ...ENSEIGNEMENT },
  reseau: {
    offre: OFFRES.reseau.nom,
    ...ENSEIGNEMENT,
    organisation: "Réseau, groupe ou académie",
    exempleOrganisation: "Groupe d'écoles, groupe scolaire, académie, région",
    effectif: "Nombre d'établissements",
  },
  episodes: {
    offre: `${OFFRES.episodes.nom}, en cours ou en école`,
    ...ENSEIGNEMENT,
    exempleOrganisation: "École de commerce, université, lycée",
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

/** Les niveaux de l'arène, « 1 à 6 ». */
const TOUS_LES_NIVEAUX = `${PREMIER_NIVEAU} à ${DERNIER_NIVEAU}`;
const NOM_DES_CONCOURS = nomDeLEntreprise(ENTREPRISE_DES_CONCOURS);

/** Ce que toute offre de l'arène ouvre en cours : la partie de classe et son suivi. */
const LA_PARTIE_DE_CLASSE =
  "Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.";
const LE_SUIVI =
  "Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.";

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
    pourQui: "Un cours, un groupe : une entreprise et un niveau, choisis à l'achat.",
    prix: PRIX.classe,
    inclus: [
      `Une entreprise au choix parmi les ${ENTREPRISES.length}, et un niveau au choix de ${TOUS_LES_NIVEAUX}, fixés pour l'année.`,
      "Autant de parties que vous voulez dans l'année avec ce paramétrage, une à la fois.",
      LA_PARTIE_DE_CLASSE,
      LE_SUIVI,
      "Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.",
      `Un concours à la place d'une partie, si l'entreprise choisie est ${NOM_DES_CONCOURS} : les concours se jouent avec elle.`,
    ],
    precisions: [SANS_LES_EPISODES, "À l'année, pour un enseignant."],
    bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("classe") },
  },
  {
    code: "programme",
    nom: OFFRES.programme.nom,
    pourQui:
      "Un programme (Bachelor, Grande École, MSc, BTS…) : toutes ses promotions, tous les niveaux, une entreprise.",
    prix: PRIX.programme,
    mention: `Dès ${seuilProgrammeAvantageux()} groupes, moins cher que ${seuilProgrammeAvantageux()} offres ${OFFRES.classe.nom}`,
    inclus: [
      `Une entreprise au choix parmi les ${ENTREPRISES.length}, choisie à l'achat, à tous les niveaux, de ${TOUS_LES_NIVEAUX}.`,
      "Toutes les promotions et tous les groupes du programme, plusieurs parties en même temps.",
      "L'équipe pédagogique et les intervenants du programme, au nombre fixé au devis.",
      LA_PARTIE_DE_CLASSE,
      LE_SUIVI,
      "Les ateliers clés en main de cette entreprise, avec déroulé, corrigés et dossier enseignant.",
      `Les concours et le classement à l'IPG, si l'entreprise choisie est ${NOM_DES_CONCOURS} : les concours se jouent avec elle.`,
    ],
    precisions: [SANS_LES_EPISODES, "À l'année, pour l'équipe d'un programme."],
    bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("programme"), principal: true },
  },
  {
    code: "campus",
    nom: OFFRES.campus.nom,
    pourQui: `Toute l'école : les ${ENTREPRISES.length} entreprises, tous les programmes, enseignants et intervenants sans limite.`,
    prix: PRIX.campus,
    mention: `Dès ${seuilCampusAvantageux()} entreprises, moins cher que ${seuilCampusAvantageux()} offres ${OFFRES.programme.nom}`,
    inclus: [
      `Les ${ENTREPRISES.length} entreprises, à tous les niveaux, dans tous les programmes.`,
      "Des groupes, des enseignants et des intervenants sans limite.",
      `Les ${ATELIERS.length} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont ${ATELIERS_A_REFERENTIEL.length} adossés au référentiel d'un diplôme (${DIPLOMES_DES_ATELIERS.map((d) => d.sigle).join(", ")}).`,
      "Les concours et le classement à l'IPG.",
      "Un référent qui gère les accès.",
      "Une facture au nom de l'école.",
      `Une licence par année scolaire, du ${CONDITIONS.anneeScolaire.debut} au ${CONDITIONS.anneeScolaire.fin}.`,
    ],
    precisions: [
      SANS_LES_EPISODES,
      "Sur devis, puis bon de commande ou mandat administratif ; Chorus Pro pour les factures publiques.",
    ],
    bouton: { libelle: LIBELLE_DU_DEVIS, href: lienDuDevis("campus") },
  },
];

/**
 * CE QUI PARLE AUX ÉCOLES (décision du propriétaire : « aller davantage vers les business
 * schools »), sur /tarifs et /ecoles. Rien n'y est promis qui n'existe pas :
 *  · le relevé de notes s'exporte en tableur, une ligne par étudiant (note sur 20,
 *    diagnostic, questions, rang, IPG, résultat) ; la maîtrise des notions se lit par
 *    partie. Il n'y a PAS de relevé par compétence : la phrase ne le dit pas ;
 *  · les ateliers portent leurs formats (semaine bloquée, séminaire de trois jours,
 *    journées banalisées) ; le concours fait des poules puis une finale ; entre plusieurs
 *    écoles ou campus, c'est l'option « Compétition inter-établissements », sur devis ;
 *  · l'intégration LTI 1.3 (Moodle, Canvas, Blackboard, Brightspace) est en ligne
 *    (src/lti, page /integration) : « incluse », avec le lien ; l'ENT du secondaire
 *    (GAR) est à l'étude ;
 *  · les épisodes manager, à part, sur devis.
 */
/** L'intégration aux plateformes de cours (src/lti) : en ligne, décrite sur /integration. */
export const INTEGRATION_LMS = {
  nom: "Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3)",
  etat: "Incluse",
  lien: { href: "/integration", libelle: "Voir l'intégration" },
} as const;

/** L'ENT du secondaire : rien n'est promis, rien n'est daté. */
export const ENT_DU_SECONDAIRE = { nom: "ENT du secondaire (GAR)", etat: "À l'étude" } as const;

/** Ce que le relevé de l'arène contient vraiment (app/teacher/games/[gameId]/releve). */
export const LE_RELEVE_DE_L_ARENE =
  "Dans l'arène, le relevé s'exporte en tableur, une ligne par étudiant : note sur 20, diagnostic, questions, rang, indice de performance globale ; la maîtrise des notions se lit partie par partie.";

export const ARGUMENTS_POUR_LES_ECOLES: readonly {
  titre: string;
  texte: string;
  lien?: { href: string; libelle: string };
}[] = [
  {
    titre: "Des traces pour l'accréditation",
    texte: `Pour l'assurance of learning (AACSB, EQUIS). ${LE_RELEVE_DE_L_ARENE} Le relevé ne suit pas la grille de compétences de votre école : il se reprend dans la vôtre. Les épisodes manager, eux, mesurent un profil de compétences.`,
  },
  {
    titre: "Séminaires et compétitions",
    texte:
      "Les ateliers se placent en semaine bloquée, en séminaire de trois jours ou en journées banalisées. Le concours met les groupes en poules, puis en finale, classés à l'indice de performance globale. Entre plusieurs écoles ou campus : sur devis.",
  },
  {
    titre: `${INTEGRATION_LMS.nom} : ${INTEGRATION_LMS.etat.toLowerCase()}`,
    texte: `L'activité se place dans le cours ; l'étudiant clique et arrive dans sa partie, sans compte ni code. ${ENT_DU_SECONDAIRE.nom} : ${ENT_DU_SECONDAIRE.etat.toLowerCase()}.`,
    lien: INTEGRATION_LMS.lien,
  },
  {
    titre: OFFRES.episodes.nom,
    texte:
      "Pour les MBA, les cours de leadership et la formation continue (Executive Education) : des trimestres joués dans la peau d'un manager. À part, sur devis.",
  },
];

/** Les réseaux d'établissements, sous les cartes. */
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
 * Les options : courtes, sans prix ; la seule gratuite est le rendez-vous qui existe.
 * L'intégration LTI 1.3 est incluse (src/lti) ; l'ENT du secondaire (GAR) est à l'étude.
 */
export const OPTIONS: readonly { nom: string; prix: "Gratuit" | "Sur devis" | "Incluse" | "À l'étude" }[] = [
  { nom: "Un rendez-vous téléphonique de prise en main, à la demande", prix: "Gratuit" },
  { nom: "Formation d'une équipe pédagogique", prix: "Sur devis" },
  { nom: "Animation sur site", prix: "Sur devis" },
  { nom: "Scénario sur mesure : une entreprise fictive à l'image de la vôtre", prix: "Sur devis" },
  { nom: "Compétition inter-établissements", prix: "Sur devis" },
  { nom: INTEGRATION_LMS.nom, prix: INTEGRATION_LMS.etat },
  { nom: ENT_DU_SECONDAIRE.nom, prix: ENT_DU_SECONDAIRE.etat },
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
  `Durée : un an pour les offres ${OFFRES.classe.nom} et ${OFFRES.programme.nom} et pour les épisodes manager, une année scolaire pour l'offre ${OFFRES.campus.nom}.`,
  `Les offres ${OFFRES.classe.nom} et ${OFFRES.programme.nom} se paramètrent à l'achat : l'entreprise, et pour ${OFFRES.classe.nom} le niveau, sont écrits sur le devis et ouverts pour l'année.`,
  "Pas de reconduction tacite : l'échéance s'affiche dans l'espace enseignant, et le renouvellement passe par un nouveau devis.",
  `À la fin de l'offre, les parties et les résultats restent consultables ${CONDITIONS.consultationApresMois} mois, relevé de notes compris.`,
  "Les étudiants et les élèves jouent sans nom ni e-mail : un code suffit.",
];

/** Les questions qu'on nous pose avant d'acheter. */
export const QUESTIONS_TARIFS: readonly { q: string; r: string }[] = [
  {
    q: "Les étudiants paient-ils ?",
    r: "Non, jamais. Ils rejoignent la partie de leur enseignant avec un code, sans compte ni e-mail.",
  },
  {
    q: "Comment commander ?",
    r: `Demandez un devis écrit depuis cette page : il précise l'offre, l'entreprise et le niveau pour ${OFFRES.classe.nom}, l'entreprise et le nombre d'enseignants et d'intervenants pour ${OFFRES.programme.nom}, et la durée. Bon de commande, mandat administratif et Chorus Pro sont acceptés.`,
  },
  {
    q: `Quelle différence entre ${OFFRES.classe.nom}, ${OFFRES.programme.nom} et ${OFFRES.campus.nom} ?`,
    r: `${OFFRES.classe.nom} : un enseignant, un groupe à la fois, une entreprise et un niveau. ${OFFRES.programme.nom} : l'équipe d'un programme, toutes ses promotions en même temps, une entreprise à tous les niveaux. ${OFFRES.campus.nom} : toute l'école, les ${ENTREPRISES.length} entreprises, sans limite d'enseignants, d'intervenants ni de groupes.`,
  },
  {
    q: "Peut-on essayer avec un groupe ?",
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
export const LIGNE_DE_PRIX = `${nomDOffre("classe")} ${prixParAn(PRIX.classe)}, offre ${OFFRES.programme.nom} ${prixParAn(PRIX.programme)}, offre ${OFFRES.campus.nom} ${prixParAn(PRIX.campus)}, sur devis. Les épisodes manager se proposent à part, sur devis.`;

/** La réponse du guide à « Combien ça coûte ? » (audit C-08). */
export const REPONSE_COMBIEN = `La découverte en solo est gratuite, sans compte. Pour faire cours, sur devis : l'offre ${OFFRES.classe.nom} coûte ${prixParAn(PRIX.classe)} pour un groupe (une entreprise et un niveau choisis), l'offre ${OFFRES.programme.nom} ${prixParAn(PRIX.programme)} pour un programme (une entreprise, tous les niveaux, toutes les promotions), l'offre ${OFFRES.campus.nom} ${prixParAn(PRIX.campus)} pour toute l'école. Les épisodes manager se proposent à part, sur devis.`;

/** Les niveaux fermés, et ce qui les ouvre : « Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus. » */
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
