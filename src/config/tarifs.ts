import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { NOMBRE_D_EPISODES } from "@/config/episodes/familles";
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
import { NIVEAU_MAX, VITRINE_SOLO_PAR_DEFAUT } from "@/config/vitrine-solo";
import { NIVEAUX as NIVEAUX_DES_EPISODES } from "@/config/episodes/niveaux";
import {
  parametresAreneDe,
  palierDeLArene,
  vueDesTarifs,
  nomDansLeDevis,
  type Catalogue,
  type CompositionDeModule,
  type ModuleDuCatalogue,
  type OffreDuCatalogue,
  type ParametresArene,
  euros,
} from "@/config/catalogue";
import { DECOUVERTE_PAR_DEFAUT, niveauMaxSansLicence, type ReglageDeLaDecouverte } from "@/config/decouverte";

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
 * DEPUIS LE CATALOGUE EN BASE (migration 0041, /admin/offres) : les offres, leurs prix,
 * leurs textes et leurs modules, la Découverte et les codes promo s'éditent dans
 * l'administration et se lisent au catalogue (services/catalogue.service.ts). Ce module en
 * garde la VALEUR PAR DÉFAUT (`CATALOGUE_PAR_DEFAUT`, ce que la migration a versé) et ce
 * qui ne s'édite pas : les noms cités par les murs de licence, les textes juridiques
 * (franchise de TVA, conditions de vente), les règles de la licence.
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

/**
 * Les trois offres de l'arène, par an : des prix de référence, vendus sur devis. Valeur
 * par défaut du catalogue : le prix en vigueur se lit au catalogue (/admin/offres).
 */
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
export const DERNIER_NIVEAU_GRATUIT = VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres;

/** Les tours d'une partie complète en solo. */
export const TOURS_DE_LA_PARTIE_SOLO = 6;

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
 * LE PARAMÉTRAGE QU'ON ENREGISTRE POUR UNE OFFRE DU CATALOGUE, à partir de ses paramètres
 * d'arène et de ce que l'admin a choisi dans /admin. Lève, avec une phrase lisible, si un
 * choix que l'offre demande manque : l'entreprise (une au choix), le niveau (un au choix),
 * le plafond d'enseignants (fixé au devis). Le palier enregistré (Classe, Programme,
 * Campus) est celui que dessinent les paramètres (`palierDeLArene`).
 */
export function parametrageDepuisLOffre(
  nom: string,
  regle: ParametresArene,
  choix: { entreprise?: string | null; niveau?: number | null; maxEnseignants?: number | null },
): ParametrageDeLicence {
  let entreprises: string[] | null = null;
  if (regle.entreprises === "une") {
    if (!choix.entreprise || !ENTREPRISES.some((e) => e.code === choix.entreprise)) {
      throw new Error(`L'offre ${nom} porte une entreprise : choisissez-la.`);
    }
    entreprises = [choix.entreprise];
  }
  let niveaux: number[] | null = null;
  if (regle.niveaux === "un") {
    if (!choix.niveau || !NIVEAUX.some((p) => p.level === choix.niveau)) {
      throw new Error(`L'offre ${nom} porte un niveau : choisissez-le.`);
    }
    niveaux = [choix.niveau];
  }
  let maxEnseignants: number | null;
  if (regle.enseignants === "devis") {
    if (!choix.maxEnseignants || !Number.isInteger(choix.maxEnseignants) || choix.maxEnseignants < 1) {
      throw new Error(
        `L'offre ${nom} porte le nombre d'enseignants et d'intervenants fixé au devis : indiquez-le.`,
      );
    }
    maxEnseignants = choix.maxEnseignants;
  } else {
    maxEnseignants = regle.enseignants;
  }
  return { offre: palierDeLArene(regle), entreprises, niveaux, maxEnseignants, maxPartiesEnCours: regle.partiesEnCours };
}

/** Le paramétrage d'une des trois offres de la grille (ses paramètres par défaut). */
export function parametrageDeLOffre(
  offre: OffreDeLArene,
  choix: { entreprise?: string | null; niveau?: number | null; maxEnseignants?: number | null },
): ParametrageDeLicence {
  return { ...parametrageDepuisLOffre(OFFRES[offre].nom, PARAMETRAGE_DES_OFFRES[offre], choix), offre };
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

/** L'adresse de la demande de devis, l'offre pré-remplie (une offre du catalogue, par son code). */
export const lienDuDevis = (offre: string): string => `/devis?offre=${offre}`;

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

/** Ce que le formulaire demande, selon le public de l'offre (`formulaire` au catalogue). */
const PAR_FORMULAIRE: Record<OffreDuCatalogue["formulaire"], Omit<LibellesDuDevis, "offre">> = {
  etablissement: { ...ENSEIGNEMENT },
  reseau: {
    ...ENSEIGNEMENT,
    organisation: LIBELLES_DU_DEVIS.reseau.organisation,
    exempleOrganisation: LIBELLES_DU_DEVIS.reseau.exempleOrganisation,
    effectif: LIBELLES_DU_DEVIS.reseau.effectif!,
  },
  entreprise: {
    organisation: LIBELLES_DU_DEVIS.entreprise.organisation,
    exempleOrganisation: LIBELLES_DU_DEVIS.entreprise.exempleOrganisation,
    identifiant: LIBELLES_DU_DEVIS.entreprise.identifiant,
    effectif: LIBELLES_DU_DEVIS.entreprise.effectif!,
  },
};

/**
 * LES LIBELLÉS DU FORMULAIRE POUR UNE OFFRE DU CATALOGUE : le public (une école, un réseau,
 * une entreprise), et ce que son arène se paramètre à l'achat (l'entreprise, le niveau ;
 * pas d'effectif pour une offre d'un seul enseignant). Les offres de la grille gardent
 * leur exemple d'organisation.
 */
export function libellesDuDevisDe(o: OffreDuCatalogue): LibellesDuDevis {
  const p = parametresAreneDe(o);
  const { effectif, ...base } = PAR_FORMULAIRE[o.formulaire];
  const l: LibellesDuDevis = {
    ...base,
    offre: nomDansLeDevis(o),
    exempleOrganisation: estUneOffreDuDevis(o.code)
      ? LIBELLES_DU_DEVIS[o.code].exempleOrganisation
      : base.exempleOrganisation,
  };
  if (effectif && !(o.formulaire === "etablissement" && p?.enseignants === 1)) l.effectif = effectif;
  if (p?.entreprises === "une") l.entreprise = true;
  if (p?.niveaux === "un") l.niveau = true;
  return l;
}

/* ---------------------------------------------------------------------------
 * LE CATALOGUE PAR DÉFAUT : LA GRILLE D'OCTOBRE 2026, TELLE QUE LA BASE LA REÇOIT.
 *
 * Demande du propriétaire : « gérer l'offre depuis le panneau admin ». Le catalogue vit en
 * base (migration 0041, /admin/offres, services/catalogue.service.ts) ; la grille
 * ci-dessous en est la VALEUR PAR DÉFAUT (base vide, panne de lecture, tests) et ce que
 * la migration y a versé, texte pour texte (tests/integration/catalogue-offres.test.ts
 * compare la base migrée à cette grille, et tests/architecture/tarifs.test.ts compare
 * son rendu à la grille figée `tests/fixtures/grille-d-octobre-2026.json`).
 *
 * Les textes portent des VARIABLES (`{entreprises}`, `{demos}`…) que le rendu remplit
 * (`variablesDuCatalogue`) : un nombre tiré du registre ou d'un réglage ne s'écrit pas
 * en base. Les textes juridiques (franchise de TVA, vendeur, conditions de vente) restent
 * ici et dans config/editeur.ts : ils ne s'éditent pas depuis /admin.
 * ------------------------------------------------------------------------- */

/** Le bouton de chaque carte : une demande de devis écrite. */
export const LIBELLE_DU_DEVIS = "Demander un devis";

/** Ce que les offres de l'arène n'ouvrent pas, dit sur chaque carte. */
export const SANS_LES_EPISODES = "Sans les épisodes manager, qui se proposent à part, sur devis.";

/** Les niveaux de l'arène, « 1 à 6 ». */
const TOUS_LES_NIVEAUX = `${PREMIER_NIVEAU} à ${DERNIER_NIVEAU}`;

/** Ce que toute offre de l'arène ouvre en cours : la partie de classe et son suivi. */
const LA_PARTIE_DE_CLASSE =
  "Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.";
const LE_SUIVI =
  "Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.";

/** L'intégration aux plateformes de cours (src/lti) : en ligne, décrite sur /integration. */
export const INTEGRATION_LMS = {
  nom: "Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3)",
  etat: "Incluse",
  lien: { href: "/integration", libelle: "Voir l'intégration" },
} as const;

/** L'ENT du secondaire : rien n'est promis, rien n'est daté. */
export const ENT_DU_SECONDAIRE = { nom: "ENT du secondaire (GAR)", etat: "À l'étude" } as const;

/**
 * LES VARIABLES DES TEXTES DU CATALOGUE, et ce qu'elles valent : le registre (entreprises,
 * niveaux, épisodes, ateliers), les conditions, et le réglage de la Découverte (niveaux
 * ouverts en solo, démonstrations). /admin/offres les liste à côté des champs.
 */
export function variablesDuCatalogue(d: ReglageDeLaDecouverte = DECOUVERTE_PAR_DEFAUT): Record<string, string> {
  const max = niveauMaxSansLicence(d);
  return {
    entreprises: String(ENTREPRISES.length),
    niveaux: TOUS_LES_NIVEAUX,
    niveauxDecouverte: `${PREMIER_NIVEAU} à ${max}`,
    nomsDesNiveauxDecouverte: enumeration(nomsDesNiveaux(PREMIER_NIVEAU, max)),
    toursSolo: String(TOURS_DE_LA_PARTIE_SOLO),
    demos: String(d.demos.length),
    niveauDesDemos: NIVEAUX_DES_EPISODES.find((n) => n.code === d.niveauDesDemos)?.nom ?? d.niveauDesDemos,
    episodes: String(NOMBRE_D_EPISODES),
    ateliers: String(ATELIERS.length),
    ateliersReferentiel: String(ATELIERS_A_REFERENTIEL.length),
    diplomes: DIPLOMES_DES_ATELIERS.map((x) => x.sigle).join(", "),
    entrepriseDesConcours: nomDeLEntreprise(ENTREPRISE_DES_CONCOURS),
    debutAnneeScolaire: CONDITIONS.anneeScolaire.debut,
    finAnneeScolaire: CONDITIONS.anneeScolaire.fin,
    seuilReseau: String(SEUIL_RESEAU_ETABLISSEMENTS),
    managers: String(COHORTE.managers),
    episodesMin: String(COHORTE.episodesMin),
    episodesMax: String(COHORTE.episodesMax),
    lesOffresDeLArene: LES_OFFRES_DE_L_ARENE,
  };
}

/** Les noms des variables, pour la validation et l'aide de /admin/offres. */
export const VARIABLES_DU_CATALOGUE: readonly string[] = Object.keys(variablesDuCatalogue());

/** Les paramètres de l'arène des trois offres de la grille. */
const arene = (code: OffreDeLArene): CompositionDeModule => ({ module: "arene", parametres: { ...PARAMETRAGE_DES_OFFRES[code] } });

const COMMUN = {
  libelleTarif: null,
  precisions: [] as string[],
  formules: [] as { nom: string; inclus: string[] }[],
  mention: null,
  visible: true,
  miseEnAvant: false,
  devisLibelle: null,
  formulaire: "etablissement" as const,
};

const devis = (code: string) => ({ libelle: LIBELLE_DU_DEVIS, cible: `/devis?offre=${code}` });
const option = (
  code: string,
  ordre: number,
  nom: string,
  tarif: OffreDuCatalogue["tarif"],
  modules: string[],
  libelleTarif: string | null = null,
): OffreDuCatalogue => ({
  ...COMMUN,
  code,
  rubrique: "option",
  public: "enseignement",
  nom,
  sousTitre: "",
  tarif,
  prixCents: null,
  libelleTarif,
  inclus: [],
  modules: modules.map((module) => ({ module })),
  ordre,
  bouton: { libelle: "", cible: "" },
});

/** Les modules de la grille : trois à effet (l'arène, les épisodes, l'examen individuel), les autres descriptifs. */
export const MODULES_PAR_DEFAUT: readonly ModuleDuCatalogue[] = [
  {
    code: "arene",
    nom: "L'arène",
    description:
      "Le simulateur en classe : parties de classe, suivi, ateliers, concours, relevé. Se paramètre : entreprises, niveaux, enseignants, parties en cours.",
    effet: "arene",
    actif: true,
    ordre: 10,
  },
  {
    code: "episodes",
    nom: OFFRES.episodes.nom,
    description: "Les trimestres joués dans la peau d'un manager, au-delà des démonstrations, et le profil décisionnel.",
    effet: "episodes",
    actif: true,
    ordre: 20,
  },
  {
    code: "examen",
    nom: "Examen individuel",
    description:
      "Une partie solo notée sur une grille fixe, la même pour tous les candidats, et un relevé par compétence pour le dossier d'accréditation.",
    effet: "examen",
    actif: true,
    ordre: 25,
  },
  {
    code: "lti",
    nom: "Intégration LMS",
    description: "L'activité placée dans Moodle, Canvas, Blackboard ou Brightspace (LTI 1.3).",
    effet: null,
    actif: true,
    ordre: 30,
  },
  {
    code: "renater",
    nom: "Connexion établissement",
    description: "Se connecter avec son établissement, par la fédération d'identités RENATER.",
    effet: null,
    actif: true,
    ordre: 40,
  },
  {
    code: "accompagnement",
    nom: "Accompagnement",
    description: "La prise en main, la formation d'une équipe pédagogique, l'animation sur site.",
    effet: null,
    actif: true,
    ordre: 50,
  },
  {
    code: "concours",
    nom: "Compétition inter-établissements",
    description: "Un concours entre plusieurs écoles ou campus, organisé avec vous.",
    effet: null,
    actif: true,
    ordre: 60,
  },
];

/** Les offres de la grille, dans l'ordre de /tarifs. */
export const OFFRES_PAR_DEFAUT: readonly OffreDuCatalogue[] = [
  {
    ...COMMUN,
    code: "decouverte",
    rubrique: "arene",
    public: "enseignement",
    nom: OFFRES.decouverte.nom,
    sousTitre: "Sans compte, pour voir le simulateur de près.",
    tarif: "gratuit",
    prixCents: null,
    inclus: [
      "L'arène en solo sur les {entreprises} entreprises, niveaux {niveauxDecouverte} ({nomsDesNiveauxDecouverte}), en partie complète de {toursSolo} tours.",
      "Les fiches notions, le manuel et le guide.",
      "Un épisode manager de démonstration par métier ({demos} sur {episodes}), au niveau {niveauDesDemos}, avec son bilan.",
    ],
    precisions: ["Les parties de classe et les concours commencent avec {lesOffresDeLArene}."],
    modules: [],
    ordre: 10,
    bouton: { libelle: "Tester le simulateur", cible: "/jouer" },
  },
  {
    ...COMMUN,
    code: "classe",
    rubrique: "arene",
    public: "enseignement",
    nom: OFFRES.classe.nom,
    sousTitre: "Un cours, un groupe : une entreprise et un niveau, choisis à l'achat.",
    tarif: "prix",
    prixCents: PRIX.classe * 100,
    inclus: [
      "Une entreprise au choix parmi les {entreprises}, et un niveau au choix de {niveaux}, fixés pour l'année.",
      "Autant de parties que vous voulez dans l'année avec ce paramétrage, une à la fois.",
      LA_PARTIE_DE_CLASSE,
      LE_SUIVI,
      "Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.",
      "Un concours à la place d'une partie, si l'entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle.",
    ],
    precisions: [SANS_LES_EPISODES, "À l'année, pour un enseignant."],
    modules: [arene("classe")],
    ordre: 20,
    bouton: devis("classe"),
  },
  {
    ...COMMUN,
    code: "programme",
    rubrique: "arene",
    public: "enseignement",
    nom: OFFRES.programme.nom,
    sousTitre:
      "Un programme (Bachelor, Grande École, MSc, BTS…) : toutes ses promotions, tous les niveaux, une entreprise.",
    tarif: "prix",
    prixCents: PRIX.programme * 100,
    mention: { mode: "calculee", reference: "classe", unite: "groupes" },
    inclus: [
      "Une entreprise au choix parmi les {entreprises}, choisie à l'achat, à tous les niveaux, de {niveaux}.",
      "Toutes les promotions et tous les groupes du programme, plusieurs parties en même temps.",
      "L'équipe pédagogique et les intervenants du programme, au nombre fixé au devis.",
      LA_PARTIE_DE_CLASSE,
      LE_SUIVI,
      "Les ateliers clés en main de cette entreprise, avec déroulé, corrigés et dossier enseignant.",
      "Les concours et le classement à l'IPG, si l'entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle.",
    ],
    precisions: [SANS_LES_EPISODES, "À l'année, pour l'équipe d'un programme."],
    // L'examen individuel (migration 0042) : inclus dans Programme et Campus, pas dans Classe.
    modules: [arene("programme"), { module: "examen" }],
    ordre: 30,
    miseEnAvant: true,
    bouton: devis("programme"),
  },
  {
    ...COMMUN,
    code: "campus",
    rubrique: "arene",
    public: "enseignement",
    nom: OFFRES.campus.nom,
    sousTitre: "Toute l'école : les {entreprises} entreprises, tous les programmes, enseignants et intervenants sans limite.",
    tarif: "prix",
    prixCents: PRIX.campus * 100,
    mention: { mode: "calculee", reference: "programme", unite: "entreprises" },
    inclus: [
      "Les {entreprises} entreprises, à tous les niveaux, dans tous les programmes.",
      "Des groupes, des enseignants et des intervenants sans limite.",
      "Les {ateliers} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont {ateliersReferentiel} adossés au référentiel d'un diplôme ({diplomes}).",
      "Les concours et le classement à l'IPG.",
      "Un référent qui gère les accès.",
      "Une facture au nom de l'école.",
      "Une licence par année scolaire, du {debutAnneeScolaire} au {finAnneeScolaire}.",
    ],
    precisions: [
      SANS_LES_EPISODES,
      "Sur devis, puis bon de commande ou mandat administratif ; Chorus Pro pour les factures publiques.",
    ],
    // L'examen individuel (migration 0042) : inclus dans Programme et Campus, pas dans Classe.
    modules: [arene("campus"), { module: "examen" }],
    ordre: 40,
    bouton: devis("campus"),
  },
  {
    ...COMMUN,
    code: "reseau",
    rubrique: "reseau",
    public: "enseignement",
    nom: OFFRES.reseau.nom,
    sousTitre: "Groupes scolaires, académies, régions, réseaux d'écoles : à partir de {seuilReseau} établissements, sur devis.",
    tarif: "devis",
    prixCents: null,
    inclus: [],
    modules: [arene("campus")],
    ordre: 50,
    bouton: devis("reseau"),
    formulaire: "reseau",
  },
  {
    ...COMMUN,
    code: "episodes",
    rubrique: "episodes",
    public: "enseignement",
    nom: OFFRES.episodes.nom,
    sousTitre: "En classe et en école de commerce",
    tarif: "devis",
    prixCents: null,
    inclus: [
      "Les {episodes} épisodes, choisis par l'enseignant pour chaque groupe.",
      "Des cohortes créées depuis l'espace enseignant : les étudiants entrent par un code, sans compte.",
      "La vue de l'animateur, et une fiche de débrief pour les épisodes en classe.",
    ],
    modules: [{ module: "episodes" }],
    ordre: 60,
    bouton: devis("episodes"),
    devisLibelle: `${OFFRES.episodes.nom}, en cours ou en école`,
  },
  {
    ...COMMUN,
    code: "entreprise",
    rubrique: "episodes",
    public: "entreprises",
    nom: "Entreprises et organismes de formation",
    sousTitre: "",
    tarif: "devis",
    prixCents: null,
    inclus: [],
    formules: [
      {
        nom: "Parcours manager",
        inclus: [
          "Les {episodes} épisodes, en autonomie.",
          "Le profil décisionnel, et la recommandation du prochain épisode.",
          "Sans compte à créer : un code de cohorte pour entrer, un code de reprise pour changer d'appareil.",
        ],
      },
      {
        nom: "Cohorte animée",
        inclus: [
          "{managers} managers, {episodesMin} à {episodesMax} épisodes choisis, un code de cohorte.",
          "La vue de l'animateur.",
          "Une demi-journée de lancement, et un débrief animé à distance.",
        ],
      },
      {
        nom: "Organisme de formation",
        inclus: ["Des animateurs sans limite, des cohortes à volonté.", "Le guide de débrief des {episodes} épisodes."],
      },
    ],
    modules: [{ module: "episodes" }],
    ordre: 70,
    bouton: devis("entreprise"),
    devisLibelle: `${OFFRES.episodes.nom}, pour une entreprise ou un organisme de formation`,
    formulaire: "entreprise",
  },
  // Les options : courtes, sans prix ; la seule gratuite est le rendez-vous qui existe.
  // L'intégration LTI 1.3 est incluse (src/lti) ; l'ENT du secondaire (GAR) est à l'étude.
  option("prise-en-main", 100, "Un rendez-vous téléphonique de prise en main, à la demande", "gratuit", ["accompagnement"]),
  option("formation-equipe", 110, "Formation d'une équipe pédagogique", "devis", ["accompagnement"]),
  option("animation-sur-site", 120, "Animation sur site", "devis", ["accompagnement"]),
  option("scenario-sur-mesure", 130, "Scénario sur mesure : une entreprise fictive à l'image de la vôtre", "devis", []),
  option("competition-inter-etablissements", 140, "Compétition inter-établissements", "devis", ["concours"]),
  option("integration-lms", 150, INTEGRATION_LMS.nom, "inclus", ["lti"], INTEGRATION_LMS.etat),
  option("ent-du-secondaire", 160, ENT_DU_SECONDAIRE.nom, "etude", []),
];

/** Le catalogue par défaut : celui d'une base vide, et ce que la migration 0041 a versé. */
export const CATALOGUE_PAR_DEFAUT: Catalogue = { modules: [...MODULES_PAR_DEFAUT], offres: [...OFFRES_PAR_DEFAUT] };

/** Les variables par défaut (la Découverte par défaut). */
export const VARIABLES_PAR_DEFAUT: Readonly<Record<string, string>> = variablesDuCatalogue();

/* ---------------------------------------------------------------------------
 * LA GRILLE PAR DÉFAUT, RENDUE : les formes que lisaient /tarifs, /ecoles et les tests
 * avant le catalogue en base. Elles se TIRENT du catalogue par défaut, elles ne se
 * recopient pas ; les pages lisent le catalogue en base.
 * ------------------------------------------------------------------------- */

const VUE_PAR_DEFAUT = vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT);

/** Un bouton de carte : où il mène, ce qu'il dit, et s'il est l'action de l'écran. */
export interface BoutonDOffre {
  libelle: string;
  href: string;
  /** Le seul bouton plein de la page : l'offre qu'on veut vendre. */
  principal?: true;
}

export interface OffreEnseignement {
  code: string;
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

const versBouton = (b: { libelle: string; href: string; principal: boolean }): BoutonDOffre =>
  b.principal ? { libelle: b.libelle, href: b.href, principal: true } : { libelle: b.libelle, href: b.href };

export const OFFRES_ENSEIGNEMENT: readonly OffreEnseignement[] = VUE_PAR_DEFAUT.cartes.map((c) => ({
  code: c.code,
  nom: c.nom,
  pourQui: c.pourQui,
  ...(c.prixCents !== null ? { prix: c.prixCents / 100 } : {}),
  ...(c.mention ? { mention: c.mention } : {}),
  inclus: c.inclus,
  precisions: c.precisions,
  bouton: versBouton(c.bouton),
}));

/** Le libellé d'une offre de la grille dans le catalogue par défaut. */
const colonne = (code: string) => VUE_PAR_DEFAUT.episodes!.colonnes.find((c) => c.code === code)!;
const reseauParDefaut = VUE_PAR_DEFAUT.reseaux.find((r) => r.code === "reseau")!;

/** Les réseaux d'établissements, sous les cartes. */
export const RESEAUX = { texte: reseauParDefaut.texte, bouton: versBouton(reseauParDefaut.bouton) };

export interface FormuleDEpisodes {
  nom: string;
  inclus: string[];
}

/** En classe et en école : les cohortes que l'enseignant crée depuis son espace. */
export const FORMULE_EN_CLASSE: FormuleDEpisodes = { nom: colonne("episodes").titre, inclus: colonne("episodes").inclus };
export const BOUTON_EN_CLASSE: BoutonDOffre = versBouton(colonne("episodes").bouton);
/** Les entreprises et les organismes de formation. */
export const FORMULES_ENTREPRISES: readonly FormuleDEpisodes[] = colonne("entreprise").formules;
export const BOUTON_ENTREPRISES: BoutonDOffre = versBouton(colonne("entreprise").bouton);

/** Les options, et leur tarif en un mot. */
export const OPTIONS: readonly { nom: string; prix: string }[] = VUE_PAR_DEFAUT.options.map((o) => ({
  nom: o.nom,
  prix: o.prix,
}));

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

/* ---------------------------------------------------------------------------
 * LES CONDITIONS, LES QUESTIONS.
 * ------------------------------------------------------------------------- */

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

/** « 290 € par an » d'une offre du catalogue ; « sur devis » si elle n'a pas de prix. */
function prixAnnuelDe(c: Catalogue, code: OffreDeLArene): string {
  const o = c.offres.find((x) => x.code === code);
  return o && o.tarif === "prix" && o.prixCents ? `${euros(o.prixCents)} par an` : "sur devis";
}

/**
 * La ligne de prix des bandes finales (/enseignants, /ecoles, /fonctionnalites), lue au
 * catalogue. Prix cachés (`prix` faux, le réglage par défaut) : aucun montant, des offres
 * sur mesure, sur devis.
 */
export const ligneDePrix = (c: Catalogue, prix = true): string =>
  !prix
    ? `${LES_OFFRES_DE_L_ARENE_EN_TETE} se construisent sur mesure, sur devis. Les épisodes manager se proposent à part, sur devis.`
    : `${nomDOffre("classe")} ${prixAnnuelDe(c, "classe")}, offre ${OFFRES.programme.nom} ${prixAnnuelDe(c, "programme")}, offre ${OFFRES.campus.nom} ${prixAnnuelDe(c, "campus")}, sur devis. Les épisodes manager se proposent à part, sur devis.`;
export const LIGNE_DE_PRIX = ligneDePrix(CATALOGUE_PAR_DEFAUT);

/** La réponse du guide à « Combien ça coûte ? » (audit C-08), lue au catalogue ; sans montant si les prix sont cachés. */
export const reponseCombien = (c: Catalogue, prix = true): string =>
  !prix
    ? `La découverte en solo est gratuite, sans compte. Pour faire cours, chaque offre se construit sur mesure et se vend sur devis : l'offre ${OFFRES.classe.nom} pour un groupe (une entreprise et un niveau choisis), l'offre ${OFFRES.programme.nom} pour un programme (une entreprise, tous les niveaux, toutes les promotions), l'offre ${OFFRES.campus.nom} pour toute l'école. Les épisodes manager se proposent à part, sur devis.`
    : `La découverte en solo est gratuite, sans compte. Pour faire cours, sur devis : l'offre ${OFFRES.classe.nom} coûte ${prixAnnuelDe(c, "classe")} pour un groupe (une entreprise et un niveau choisis), l'offre ${OFFRES.programme.nom} ${prixAnnuelDe(c, "programme")} pour un programme (une entreprise, tous les niveaux, toutes les promotions), l'offre ${OFFRES.campus.nom} ${prixAnnuelDe(c, "campus")} pour toute l'école. Les épisodes manager se proposent à part, sur devis.`;
export const REPONSE_COMBIEN = reponseCombien(CATALOGUE_PAR_DEFAUT);

/** La description de /tarifs pour les moteurs, lue au catalogue ; sans montant si les prix sont cachés. */
export const descriptionDesTarifs = (c: Catalogue, prix = true): string =>
  !prix
    ? `Gratuit pour découvrir le simulateur en solo. ${LES_OFFRES_DE_L_ARENE_EN_TETE} et les épisodes manager se construisent sur mesure : chaque offre aboutit à un devis écrit. L'étudiant ne paie jamais.`
    : `Gratuit pour découvrir le simulateur en solo. ${nomDOffre("classe")} à ${prixAnnuelDe(c, "classe")}, offre ${OFFRES.programme.nom} à ${prixAnnuelDe(c, "programme")}, offre ${OFFRES.campus.nom} à ${prixAnnuelDe(c, "campus")}, épisodes manager à part : tout se vend sur devis. ${MENTION_TVA}. L'étudiant ne paie jamais.`;

/** Les niveaux fermés, et ce qui les ouvre : « Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus. » */
export function messageNiveauxReserves(vitrine: VitrineSolo): string {
  const premier = vitrine.niveauMaxAutres + 1;
  return premier >= NIVEAU_MAX
    ? `Le niveau ${NIVEAU_MAX} est inclus dans ${LES_OFFRES_DE_L_ARENE}.`
    : `Les niveaux ${premier} à ${NIVEAU_MAX} sont inclus dans ${LES_OFFRES_DE_L_ARENE}.`;
}

/**
 * Le refus d'une partie de classe ou d'un concours sans offre de l'arène en cours ; les
 * niveaux du solo sont ceux de la Découverte (réglée dans /admin/offres).
 */
export const refusDeLaClasse = (vitrine: VitrineSolo = VITRINE_SOLO_PAR_DEFAUT): string =>
  `Les parties de classe et les concours sont inclus dans ${LES_OFFRES_DE_L_ARENE}. Sans offre en cours, l'arène se joue en solo, aux niveaux ${NIVEAUX_GRATUITS.de} à ${vitrine.active ? vitrine.niveauMaxAutres : NIVEAU_MAX}. Les parties déjà créées se poursuivent.`;
/** Le même refus, avec la Découverte par défaut (niveaux 1 à 3). */
export const REFUS_DE_LA_CLASSE = refusDeLaClasse();

/** Le refus du dossier enseignant d'un atelier (les corrigés) sans offre de l'arène en cours. */
export const REFUS_DU_DOSSIER = `Le dossier enseignant des ateliers, avec ses corrigés, est inclus dans ${LES_OFFRES_DE_L_ARENE}.`;

/** Le refus du relevé de notes sans offre de l'arène, ni fin d'offre récente. */
export const REFUS_DU_RELEVE = `Le relevé de notes est inclus dans ${LES_OFFRES_DE_L_ARENE}, et reste téléchargeable ${CONDITIONS.consultationApresMois} mois après la fin de l'offre.`;

/** Le refus d'une cohorte d'épisodes sans offre qui inclut les épisodes ; `demos` : les démonstrations de la Découverte. */
export const refusDesCohortes = (demos: number = EPISODES_DE_DEMO.length): string =>
  `Créer une cohorte demande une offre qui inclut les épisodes manager (${MARQUE_DES_EPISODES}). ${LES_OFFRES_DE_L_ARENE_EN_TETE} seules ne les ouvrent pas. ${demos > 1 ? `Les ${demos} épisodes de démonstration se jouent` : demos === 1 ? "L'épisode de démonstration se joue" : "Les épisodes de démonstration se jouent"} sans cohorte, par leur lien.`;
export const REFUS_DES_COHORTES = refusDesCohortes();

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
