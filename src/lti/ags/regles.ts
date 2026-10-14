import { urlDePlateformeAdmise } from "../reseau";
import { ETIQUETTE, MARQUE, NOTE_MAXIMALE, PORTEES_AGS } from "./constantes";

/**
 * LES RÈGLES DU RETOUR DES NOTES, SANS BASE NI RÉSEAU : ce que la plateforme a accordé,
 * ce qui doit partir pour chaque élève, la forme exacte d'une note (un « score » AGS),
 * le choix de la colonne et le sens d'une réponse de la plateforme. Tout ce qui se
 * décide se décide ici ; `envois.ts` ne fait que l'appliquer.
 *
 * CE QUI PART, ET QUAND :
 *   · L'EXAMEN INDIVIDUEL. Rien avant la PUBLICATION des résultats : la note sur 100 de la
 *     copie retenue (la dernière remise), « terminée, notée », avec un commentaire court
 *     qui nomme la grille et sa version. Au retrait de la publication, la même ligne
 *     repart « en attente de note », sans note : le carnet ne garde pas une note que les
 *     candidats ne voient plus. Une copie remise sans note (le rejeu ne l'a pas jugée) :
 *     rien, l'enseignant la voit dans son suivi.
 *   · LA PARTIE DE CLASSE. La progression seulement, jamais de note : « en cours » pour
 *     l'élève entré dans une équipe, « terminée » quand la partie l'est. Une partie de
 *     classe se joue à plusieurs, contre les autres équipes et un marché ; un chiffre
 *     posé par l'outil dans le carnet d'un élève y passerait pour un jugement sur lui
 *     seul. La note reste l'affaire de l'enseignant, dans sa plateforme. Et la
 *     progression ne va que dans une colonne que la plateforme a créée elle-même :
 *     l'outil n'ajoute pas une colonne vide au carnet de chaque cours.
 */

/* ---------------------------------------------------------------------------
 * CE QUE LA PLATEFORME A ACCORDÉ.
 * ------------------------------------------------------------------------- */

export interface AgsDuLancement {
  /** Les portées accordées à l'outil (celles du service de notes seulement). */
  portees: string[];
  /** L'adresse des colonnes du cours (lineitems). */
  colonnes: string | null;
  /** La colonne de cette activité, si la plateforme l'a créée (lineitem). */
  colonne: string | null;
}

const PREFIXE_DES_PORTEES = "https://purl.imsglobal.org/spec/lti-ags/scope/";

/**
 * La revendication `…/lti-ags/claim/endpoint` d'un lancement, lue avec prudence : une
 * adresse hors HTTPS (ou mal formée) est ignorée, une portée inconnue aussi. Null : la
 * plateforme n'accorde pas le service, et rien ne change pour l'activité.
 */
export function lireLaRevendication(brute: unknown, env: NodeJS.ProcessEnv = process.env): AgsDuLancement | null {
  if (!brute || typeof brute !== "object" || Array.isArray(brute)) return null;
  const c = brute as Record<string, unknown>;
  const portees = Array.isArray(c.scope)
    ? [...new Set(c.scope.filter((s): s is string => typeof s === "string" && s.startsWith(PREFIXE_DES_PORTEES) && s.length < 200))]
    : [];
  const adresse = (v: unknown): string | null =>
    typeof v === "string" && v.length <= 2000 && urlDePlateformeAdmise(v, env) ? v : null;
  const colonnes = adresse(c.lineitems);
  const colonne = adresse(c.lineitem);
  if (portees.length === 0 && !colonnes && !colonne) return null;
  return { portees: portees.sort(), colonnes, colonne };
}

/** La plateforme accepte-t-elle des notes de l'outil ? */
export const accordeLesNotes = (portees: readonly string[] | null | undefined): boolean =>
  !!portees?.includes(PORTEES_AGS.notes);

/** L'outil peut-il créer une colonne ? */
export const peutCreerUneColonne = (portees: readonly string[] | null | undefined): boolean =>
  !!portees?.includes(PORTEES_AGS.colonnes);

/** L'outil peut-il lire les colonnes du cours ? */
export const peutLireLesColonnes = (portees: readonly string[] | null | undefined): boolean =>
  !!portees && (portees.includes(PORTEES_AGS.colonnes) || portees.includes(PORTEES_AGS.colonnesEnLecture));

/** Les portées à demander dans le jeton : celles qui servent, parmi celles accordées. */
export function porteesDuJeton(portees: readonly string[]): string[] {
  const utiles: string[] = [PORTEES_AGS.notes, PORTEES_AGS.colonnes];
  if (!portees.includes(PORTEES_AGS.colonnes)) utiles.push(PORTEES_AGS.colonnesEnLecture);
  return utiles.filter((p) => portees.includes(p)).sort();
}

/* ---------------------------------------------------------------------------
 * CE QUI DOIT PARTIR.
 * ------------------------------------------------------------------------- */

/** « note » : la note publiée ; « retrait » : en attente, sans note ; deux progressions sans note. */
export type Nature = "note" | "retrait" | "commencee" | "terminee";

/**
 * L'EXAMEN : ce qui doit partir pour un candidat, ou null (rien, ou rien de neuf).
 * `deja` : la nature de la dernière ligne du journal pour ce candidat et cette activité.
 */
export function natureVoulueDeLExamen(args: {
  publie: boolean;
  remise: boolean;
  note: number | null;
  deja: Nature | null;
}): Nature | null {
  if (args.publie) return args.remise && args.note !== null && Number.isFinite(args.note) ? "note" : null;
  // Publication retirée : seule une note déjà partie (ou en partance) se retire.
  return args.deja === "note" || args.deja === "retrait" ? "retrait" : null;
}

/**
 * LA PARTIE DE CLASSE : la progression d'un élève entré dans une équipe. Pendant un tour
 * d'essai (config/tour-d-essai.ts), rien ne part : l'essai ne compte pas, et la partie
 * n'est ni commencée ni terminée au sens du carnet de notes.
 */
export function natureVoulueDeLaPartie(args: { joueur: boolean; terminee: boolean; essai?: boolean }): Nature | null {
  if (!args.joueur || args.essai) return null;
  return args.terminee ? "terminee" : "commencee";
}

/* ---------------------------------------------------------------------------
 * LA NOTE TELLE QU'ELLE PART (un « score » AGS).
 * ------------------------------------------------------------------------- */

export interface ScoreAgs {
  userId: string;
  timestamp: string;
  activityProgress: "InProgress" | "Completed";
  gradingProgress: "FullyGraded" | "Pending" | "NotReady";
  scoreGiven?: number;
  scoreMaximum?: number;
  comment?: string;
}

/** La note bornée à [0, 100], à une décimale. Lève si ce n'est pas un nombre. */
export function borneLaNote(note: number): number {
  if (typeof note !== "number" || !Number.isFinite(note)) throw new RangeError("note illisible");
  const bornee = Math.min(NOTE_MAXIMALE, Math.max(0, note));
  return Math.round(bornee * 10) / 10 + 0;
}

/** Le commentaire d'une note d'examen : la marque, la grille et sa version. */
export function commentaireDeLExamen(grille: { nom?: unknown; version?: unknown } | null | undefined): string {
  const nom = typeof grille?.nom === "string" && grille.nom.trim() ? grille.nom.trim().slice(0, 80) : "de l'examen";
  const version = typeof grille?.version === "number" ? ` v${grille.version}` : "";
  return `${MARQUE} · grille ${nom}${version}`;
}

export const COMMENTAIRE_DU_RETRAIT = `${MARQUE} · résultats retirés, en attente de publication`;

/** Le libellé d'une colonne créée par l'outil. */
export const libelleDeLaColonne = (nom: string): string => `${MARQUE} · ${nom.trim().slice(0, 120)}`;

export function scoreAgs(args: {
  sub: string;
  nature: Nature;
  note?: number | null;
  commentaire?: string | null;
  maintenant: Date;
}): ScoreAgs {
  if (!args.sub) throw new RangeError("identifiant de l'élève absent");
  const base = { userId: args.sub, timestamp: args.maintenant.toISOString() };
  const commentaire = args.commentaire ? { comment: args.commentaire.slice(0, 500) } : {};
  switch (args.nature) {
    case "note": {
      if (args.note === null || args.note === undefined) throw new RangeError("note absente");
      return {
        ...base,
        activityProgress: "Completed",
        gradingProgress: "FullyGraded",
        scoreGiven: borneLaNote(args.note),
        scoreMaximum: NOTE_MAXIMALE,
        ...commentaire,
      };
    }
    case "retrait":
      return { ...base, activityProgress: "Completed", gradingProgress: "Pending", ...commentaire };
    case "commencee":
      return { ...base, activityProgress: "InProgress", gradingProgress: "NotReady" };
    case "terminee":
      return { ...base, activityProgress: "Completed", gradingProgress: "NotReady" };
  }
}

/* ---------------------------------------------------------------------------
 * LES ADRESSES ET LA COLONNE.
 * ------------------------------------------------------------------------- */

/** L'adresse des notes d'une colonne : `<colonne>/scores`, la requête (`?type_id=…`) gardée. */
export function adresseDesNotes(colonne: string): string {
  const u = new URL(colonne);
  u.pathname = `${u.pathname.replace(/\/+$/, "")}/scores`;
  return u.toString();
}

/** L'adresse des colonnes du cours, filtrée sur l'activité et la ressource. */
export function adresseDesColonnes(colonnes: string, filtre: { resourceLinkId?: string; resourceId?: string }): string {
  const u = new URL(colonnes);
  if (filtre.resourceLinkId) u.searchParams.set("resource_link_id", filtre.resourceLinkId);
  if (filtre.resourceId) u.searchParams.set("resource_id", filtre.resourceId);
  return u.toString();
}

export interface ColonneLue {
  id?: unknown;
  resourceId?: unknown;
  resourceLinkId?: unknown;
}

export type ChoixDeColonne =
  | { quoi: "plateforme" | "connue" | "trouvee"; url: string }
  | { quoi: "lire" }
  | { quoi: "creer" }
  | { quoi: "aucune"; raison: "pas-de-colonne" | "pas-d-adresse" };

/**
 * LA COLONNE D'UNE RESSOURCE, une seule par ressource, dans cet ordre :
 *   1. celle que la plateforme a créée pour l'activité (sélection de contenu, ou
 *      « accepter les notes de l'outil ») : c'est elle que l'enseignant attend ;
 *   2. celle que l'outil a déjà créée pour CETTE ressource ;
 *   3. celle qui porte déjà l'identifiant de ressource dans le cours (un envoi précédent
 *      dont l'adresse s'est perdue) : on la lit avant d'en créer une ;
 *   4. sinon, la créer, si la ressource le permet (l'examen) et la plateforme aussi.
 * `existantes` : null tant que les colonnes du cours n'ont pas été lues.
 */
export function choisirLaColonne(args: {
  colonneDeLaPlateforme: string | null;
  colonneCreee: { url: string | null; ressource: string | null };
  ressource: string;
  resourceLinkId: string;
  existantes: ColonneLue[] | null;
  colonnes: string | null;
  portees: readonly string[];
  creerPermis: boolean;
}): ChoixDeColonne {
  if (args.colonneDeLaPlateforme) return { quoi: "plateforme", url: args.colonneDeLaPlateforme };
  if (!args.creerPermis) return { quoi: "aucune", raison: "pas-de-colonne" };
  if (args.colonneCreee.url && args.colonneCreee.ressource === args.ressource) {
    return { quoi: "connue", url: args.colonneCreee.url };
  }
  if (!args.colonnes) return { quoi: "aucune", raison: "pas-d-adresse" };
  if (args.existantes === null && peutLireLesColonnes(args.portees)) return { quoi: "lire" };
  const trouvee = (args.existantes ?? []).find(
    (c) =>
      c.resourceId === args.ressource &&
      (c.resourceLinkId === undefined || c.resourceLinkId === args.resourceLinkId) &&
      typeof c.id === "string",
  );
  if (trouvee) return { quoi: "trouvee", url: trouvee.id as string };
  if (peutCreerUneColonne(args.portees)) return { quoi: "creer" };
  return { quoi: "aucune", raison: "pas-de-colonne" };
}

/** Le corps d'une colonne créée par l'outil. */
export function colonneACreer(args: { nom: string; ressource: string; resourceLinkId: string }) {
  return {
    scoreMaximum: NOTE_MAXIMALE,
    label: libelleDeLaColonne(args.nom),
    resourceId: args.ressource,
    resourceLinkId: args.resourceLinkId,
    tag: ETIQUETTE,
  };
}

/* ---------------------------------------------------------------------------
 * LA RÉPONSE DE LA PLATEFORME, DITE À L'ENSEIGNANT.
 * ------------------------------------------------------------------------- */

const FAMILLES: readonly [RegExp, string][] = [
  [/moodle/i, "Moodle"],
  [/canvas/i, "Canvas"],
  [/blackboard/i, "Blackboard"],
  [/brightspace|desire2learn|\bd2l\b/i, "Brightspace"],
  [/sakai/i, "Sakai"],
];

/** Le nom de la plateforme pour l'enseignant : « Moodle », ou « la plateforme de cours ». */
export function nomDeLaPlateforme(nom: string | null | undefined): string {
  for (const [motif, marque] of FAMILLES) if (motif.test(nom ?? "")) return marque;
  return "la plateforme de cours";
}

export const majuscule = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export interface Issue {
  ok: boolean;
  /** Un nouvel essai a-t-il une chance d'aboutir sans que personne ne fasse rien ? */
  temporaire: boolean;
  message: string | null;
}

/**
 * Ce que veut dire une réponse de la plateforme (`statut` : le code HTTP, ou « reseau »
 * quand elle n'a pas répondu). Temporaire : injoignable, 408, 429, 5xx. Le reste
 * (accès refusé, colonne introuvable, note refusée) ne s'arrange pas en réessayant.
 */
export function issueDeLEnvoi(statut: number | "reseau", plateforme: string): Issue {
  const P = majuscule(plateforme);
  if (statut === "reseau") return { ok: false, temporaire: true, message: `${P} n'a pas répondu à temps.` };
  if (statut >= 200 && statut < 300) return { ok: true, temporaire: false, message: null };
  if (statut === 408 || statut === 429) {
    return { ok: false, temporaire: true, message: `${P} a demandé d'attendre avant un nouvel envoi (erreur ${statut}).` };
  }
  if (statut >= 500) return { ok: false, temporaire: true, message: `${P} a rencontré une erreur (erreur ${statut}).` };
  if (statut === 401 || statut === 403) {
    return {
      ok: false,
      temporaire: false,
      message: `${P} a refusé l'accès au carnet de notes (erreur ${statut}). Vérifiez que l'outil peut y renvoyer les notes.`,
    };
  }
  if (statut === 404) {
    return { ok: false, temporaire: false, message: `${P} ne trouve plus la colonne de notes de l'activité (erreur 404).` };
  }
  return { ok: false, temporaire: false, message: `${P} a refusé la note (erreur ${statut}).` };
}
