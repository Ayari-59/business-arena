import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, episodeMembres, organizations } from "@/db/schema";
import { getTeacherOrgId } from "@/services/auth.service";
import {
  finDeLaDerniereLicenceDeLArene,
  getLicenceStatus,
  licenceEnCours,
  type LicenceStatus,
} from "@/services/licence.service";
import { getPlatformConfig } from "@/services/admin.service";
import { DEFAULT_SCENARIO_CODE } from "@/config/scenarios/registry";
import { niveauReserve } from "@/config/vitrine-solo";
import {
  CONDITIONS,
  messageNiveauxReserves,
  REFUS_DE_LA_CLASSE,
  type OffreDeLArene,
} from "@/config/tarifs";
import type { AccesAuxEpisodes } from "@/config/episodes/demos";

export {
  episodeOuvert,
  licencePourLEpisode,
  niveauxDeLEpisode,
  type AccesAuxEpisodes,
} from "@/config/episodes/demos";

/**
 * CE QU'OUVRE UNE LICENCE, VÉRIFIÉ CÔTÉ SERVEUR.
 *
 * Décisions du propriétaire (octobre 2026), avec la grille (config/tarifs.ts) :
 *  · « Classe 490, Campus 990. Sans les épisodes » : une licence de l'ARÈNE en cours
 *    (offre Classe ou Campus) ouvre les niveaux avancés, les parties de classe, les
 *    concours, le dossier enseignant des ateliers et le relevé de notes ;
 *  · « Les épisodes sont facturés à part » : seule une licence QUI INCLUT LES ÉPISODES
 *    ouvre les épisodes non démo (compte rattaché, cohorte d'enseignant, cohorte de
 *    l'administration) ; une licence Classe ou Campus seule ne les ouvre pas ;
 *  · « pas de possibilité de tester en classe » : sans licence de l'arène en cours, ni
 *    partie de classe ni concours ne se CRÉENT. Une licence expirée (ou pas encore
 *    commencée) vaut une absence de licence : même règle, même message (audit PAR-02).
 *    Le solo public (niveaux 1 à 3) et les démonstrations d'épisodes restent gratuits.
 *
 * L'écran montre la règle ; ce module la fait respecter. Il est appelé à la CRÉATION
 * d'une partie ou d'un concours et à l'OUVERTURE d'un épisode, jamais pendant une
 * partie : une partie ou un concours déjà créés se poursuivent jusqu'au bout, une
 * partie d'épisode déjà jouée est toujours gardée.
 */

/** Un refus qui renvoie aux offres : la page ajoute le lien vers les tarifs. */
export class OffreRequiseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OffreRequiseError";
  }
}

/** Le refus d'un niveau fermé, avec la phrase à montrer (le lien vers les tarifs suit). */
export class NiveauReserveError extends OffreRequiseError {
  constructor(message: string) {
    super(message);
    this.name = "NiveauReserveError";
  }
}

/** Le refus d'une partie de classe ou d'un concours sans licence de l'arène en cours. */
export class ClasseReserveError extends OffreRequiseError {
  constructor(message: string = REFUS_DE_LA_CLASSE) {
    super(message);
    this.name = "ClasseReserveError";
  }
}

const distincts = (v: readonly (string | null | undefined)[]) => [
  ...new Set(v.filter((o): o is string => !!o)),
];

/** L'une de ces organisations a-t-elle une licence de l'ARÈNE (Classe ou Campus) en cours ? */
export async function uneOrganisationSousLicence(
  organisations: readonly (string | null | undefined)[],
): Promise<boolean> {
  for (const org of distincts(organisations)) {
    if (await licenceEnCours(org, "arene")) return true;
  }
  return false;
}

/** L'une de ces organisations a-t-elle une licence en cours QUI INCLUT LES ÉPISODES ? */
export async function uneOrganisationAvecEpisodes(
  organisations: readonly (string | null | undefined)[],
): Promise<boolean> {
  for (const org of distincts(organisations)) {
    if (await licenceEnCours(org, "episodes")) return true;
  }
  return false;
}

const organisationsDes = (comptes: readonly (string | null | undefined)[]) =>
  Promise.all(distincts(comptes).map((c) => getTeacherOrgId(c)));

/** L'un de ces comptes est-il rattaché, comme enseignant, à une organisation sous licence de l'arène ? */
export async function unCompteSousLicence(
  comptes: readonly (string | null | undefined)[],
): Promise<boolean> {
  return uneOrganisationSousLicence(await organisationsDes(comptes));
}

/** L'un de ces comptes est-il rattaché à une organisation dont la licence inclut les épisodes ? */
export async function unCompteAvecEpisodes(
  comptes: readonly (string | null | undefined)[],
): Promise<boolean> {
  return uneOrganisationAvecEpisodes(await organisationsDes(comptes));
}

/**
 * Lève si l'établissement ne peut pas CRÉER de partie de classe ni de concours : sans
 * licence de l'arène en cours, qu'il n'en ait jamais eu, qu'elle ait expiré ou qu'elle
 * ne soit pas encore commencée. Même message dans les trois cas.
 */
export async function verifierLaClasse(organizationId: string): Promise<void> {
  if (!(await uneOrganisationSousLicence([organizationId]))) throw new ClasseReserveError();
}

/** Le dossier enseignant d'un atelier (les corrigés) : même règle que la classe. */
export async function dossierOuvert(userId: string): Promise<boolean> {
  return unCompteSousLicence([userId]);
}

/**
 * Le relevé de notes : même règle que la classe, avec ce que promettent les conditions
 * de vente : les résultats restent téléchargeables quelques mois après la fin de l'offre
 * (`CONDITIONS.consultationApresMois`). Sans aucune licence de l'arène, il est fermé.
 */
export async function releveOuvert(organizationId: string | null, now: Date = new Date()): Promise<boolean> {
  if (!organizationId) return false;
  if (await uneOrganisationSousLicence([organizationId])) return true;
  const fin = await finDeLaDerniereLicenceDeLArene(organizationId);
  if (!fin || fin > now) return false;
  const limite = new Date(fin);
  limite.setMonth(limite.getMonth() + CONDITIONS.consultationApresMois);
  return now <= limite;
}

/**
 * L'ÉTAT DE L'OFFRE DE L'ENSEIGNANT, pour la ligne d'en-tête de /teacher (audit PAR-13).
 * L'arène et les épisodes se lisent séparément : une licence peut porter l'un, l'autre ou
 * les deux, et deux licences peuvent coexister.
 */
export interface EtatDeLOffre {
  /** L'établissement de l'enseignant, s'il en a un. */
  etablissement: string | null;
  /** La licence de l'arène lue (en cours, à renouveler, expirée ou à venir) ; null : aucune. */
  arene: (LicenceStatus & { offre: OffreDeLArene }) | null;
  /** La licence qui inclut les épisodes, si elle est en cours. */
  episodes: LicenceStatus | null;
}

export async function etatDeLOffre(userId: string, now: Date = new Date()): Promise<EtatDeLOffre> {
  const org = await getTeacherOrgId(userId);
  if (!org) return { etablissement: null, arene: null, episodes: null };
  const [[ligne], arene, episodes] = await Promise.all([
    db.select({ nom: organizations.name }).from(organizations).where(eq(organizations.id, org)),
    getLicenceStatus(org, now, "arene"),
    getLicenceStatus(org, now, "episodes"),
  ]);
  const enCours = (st: LicenceStatus) => st.state === "active" || st.state === "bientot_expiree";
  return {
    etablissement: ligne?.nom ?? null,
    arene:
      arene.licence && arene.licence.arene
        ? { ...arene, offre: arene.licence.arene }
        : null,
    episodes: episodes.licence && enCours(episodes) ? episodes : null,
  };
}

/**
 * Lève si ce niveau est fermé à qui crée la partie. `licence` est établie par
 * l'appelant, côté serveur, à partir de l'organisation ou du compte qui crée.
 */
export async function verifierLeNiveau(args: {
  niveau: number | undefined;
  scenarioCode: string | undefined;
  licence: () => Promise<boolean>;
}): Promise<void> {
  if (args.niveau === undefined) return;
  const { vitrineSolo } = await getPlatformConfig();
  const code = args.scenarioCode ?? DEFAULT_SCENARIO_CODE;
  if (!niveauReserve(vitrineSolo, code, args.niveau)) return;
  if (await args.licence()) return;
  throw new NiveauReserveError(messageNiveauxReserves(vitrineSolo));
}

/* ---------------------------------------------------------------------------
 * LES ÉPISODES.
 * ------------------------------------------------------------------------- */

/**
 * La cohorte que suit cette personne, s'il y en a une : son organisation, les épisodes
 * qu'elle ouvre (nul : tous) et si elle est close.
 */
async function laCohorteDe(
  userId: string,
): Promise<{ org: string | null; episodes: string[] | null; close: boolean } | null> {
  const [m] = await db
    .select({
      org: episodeCohortes.organizationId,
      episodes: episodeCohortes.episodes,
      closeLe: episodeCohortes.closeLe,
    })
    .from(episodeMembres)
    .innerJoin(episodeCohortes, eq(episodeCohortes.id, episodeMembres.cohorteId))
    .where(eq(episodeMembres.userId, userId));
  return m ? { org: m.org, episodes: m.episodes ?? null, close: m.closeLe !== null } : null;
}

/**
 * Cette personne suit-elle une cohorte (un élève ou un manager entré par un code) ?
 * Devant elle, un épisode fermé ne fait jamais de vente (audit C-02).
 */
export async function suitUneCohorte(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await laCohorteDe(userId)) !== null;
  } catch {
    return false;
  }
}

/**
 * Qui joue les épisodes et sous quelle licence. `userId` est l'identité qui joue (le
 * cookie invité, qui garde les parties) ; `sessionUserId`, le compte enseignant
 * connecté sur ce navigateur, s'il y en a un. Seule une licence QUI INCLUT LES
 * ÉPISODES compte : une licence Classe ou Campus seule n'ouvre que l'arène.
 *
 *  · la cohorte : un manager entré par le code d'une cohorte dont l'organisation a une
 *    licence épisodes en cours joue tous les épisodes ; celle d'un ENSEIGNANT (créée
 *    depuis son espace) ne prête la licence qu'aux épisodes qu'il y a mis, et une
 *    cohorte CLOSE n'ouvre plus rien de neuf (une partie commencée se termine :
 *    `enregistrerPartie` garde toujours la partie jouée) ;
 *  · le compte : celui rattaché à une organisation dont la licence inclut les épisodes
 *    ouvre tout, même pour qui suit par ailleurs une cohorte restreinte.
 */
export async function accesAuxEpisodes(args: {
  userId: string | null;
  sessionUserId?: string | null;
}): Promise<AccesAuxEpisodes> {
  try {
    let restreinte: readonly string[] | null = null;
    if (args.userId) {
      const cohorte = await laCohorteDe(args.userId);
      if (
        cohorte &&
        !cohorte.close &&
        cohorte.org &&
        (await uneOrganisationAvecEpisodes([cohorte.org]))
      ) {
        if (!cohorte.episodes) return { licence: true, source: "cohorte" };
        restreinte = cohorte.episodes;
      }
    }
    if (await unCompteAvecEpisodes([args.userId, args.sessionUserId])) {
      return { licence: true, source: "compte" };
    }
    if (restreinte) return { licence: true, source: "cohorte", episodes: restreinte };
  } catch (e) {
    // Une panne de lecture n'ouvre rien : les démonstrations restent jouables.
    console.error("[acces] lecture de la licence échouée :", e);
  }
  return { licence: false, source: null };
}
