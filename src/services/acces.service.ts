import { and, eq, isNull, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  competitions,
  episodeCohortes,
  episodeMembres,
  games,
  organizations,
  scenarios,
} from "@/db/schema";
import { getTeacherOrgId } from "@/services/auth.service";
import {
  finDeLaDerniereLicenceDeLArene,
  getLicenceStatus,
  licenceEnCours,
  parametrageDe,
  type LicenceStatus,
} from "@/services/licence.service";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { getPlatformConfig } from "@/services/admin.service";
import { DEFAULT_SCENARIO_CODE, isBuiltInScenarioCode } from "@/config/scenarios/registry";
import { niveauReserve } from "@/config/vitrine-solo";
import {
  CONDITIONS,
  ENTREPRISE_DES_CONCOURS,
  entrepriseDuScenario,
  entrepriseDuSecteur,
  horsLicence,
  messageNiveauxReserves,
  REFUS_DE_LA_CLASSE,
  type HorsLicence,
  type OffreDeLArene,
  type OffreDuDevis,
  type ParametrageDeLicence,
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
 *  · « Sans les épisodes » : une licence de l'ARÈNE en cours (offre Classe, Programme ou
 *    Campus) ouvre les parties de classe, les concours, le dossier enseignant des
 *    ateliers et le relevé de notes, dans son paramétrage (voir plus bas) ;
 *  · « Les épisodes sont facturés à part » : seule une licence QUI INCLUT LES ÉPISODES
 *    ouvre les épisodes non démo (compte rattaché, cohorte d'enseignant, cohorte de
 *    l'administration) ; une licence de l'arène seule ne les ouvre pas ;
 *  · « pas de possibilité de tester en classe » : sans licence de l'arène en cours, ni
 *    partie de classe ni concours ne se CRÉENT. Une licence expirée (ou pas encore
 *    commencée) vaut une absence de licence : même règle, même message (audit PAR-02).
 *    Le solo public (niveaux 1 à 3) et les démonstrations d'épisodes restent gratuits ;
 *  · trois offres scolaires, Classe, Programme, Campus (octobre 2026) : la licence de
 *    l'arène porte son PARAMÉTRAGE (entreprises, niveaux, plafond d'enseignants, plafond
 *    de parties en cours). `verifierLaLicence` refuse la CRÉATION d'une partie de classe
 *    ou d'un concours qui en sort, avec une phrase qui dit ce qui bloque et l'offre qui
 *    l'ouvre (`horsLicence`, config/tarifs.ts). Les parties en cours ne sont jamais
 *    relues : ce qui a commencé se termine.
 *
 * L'écran montre la règle ; ce module la fait respecter. Il est appelé à la CRÉATION
 * d'une partie ou d'un concours et à l'OUVERTURE d'un épisode, jamais pendant une
 * partie : une partie ou un concours déjà créés se poursuivent jusqu'au bout, une
 * partie d'épisode déjà jouée est toujours gardée.
 */

/** Un refus qui renvoie aux offres : la page ajoute le lien vers les tarifs. */
export class OffreRequiseError extends Error {
  /** L'offre qui ouvre ce qui est refusé, si on la connaît : la page propose son devis. */
  readonly offre?: OffreDuDevis;
  constructor(message: string, offre?: OffreDuDevis) {
    super(message);
    this.name = "OffreRequiseError";
    this.offre = offre;
  }
}

/**
 * Le refus d'une création qui sort du paramétrage de la licence : une autre entreprise,
 * un autre niveau, une partie de trop, un enseignant de trop.
 */
export class LicenceDepasseeError extends OffreRequiseError {
  readonly quoi: HorsLicence["quoi"];
  constructor(hors: HorsLicence) {
    super(hors.message, hors.offre);
    this.name = "LicenceDepasseeError";
    this.quoi = hors.quoi;
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

/** L'une de ces organisations a-t-elle une licence de l'ARÈNE (Classe, Programme ou Campus) en cours ? */
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

/**
 * L'entreprise d'un code de scénario : celle du registre (NOVA en gamme est NOVA), ou,
 * pour un scénario d'enseignant, celle de son secteur (un scénario d'enseignant part
 * toujours d'une entreprise intégrée, services/scenario-editor.service.ts). Null : on ne
 * sait pas la rattacher, et une licence restreinte ne l'ouvre pas.
 */
export async function entrepriseDe(code: string | null | undefined): Promise<string | null> {
  if (!code || isBuiltInScenarioCode(code)) return entrepriseDuScenario(code);
  try {
    return entrepriseDuSecteur((await resolveScenarioDefinition(code)).sector);
  } catch {
    return null;
  }
}

/**
 * LES PARTIES DE CLASSE ET LES CONCOURS EN COURS d'un établissement, et le nom de l'un
 * d'eux : ce que compte le plafond de l'offre Classe (« un groupe à la fois »). Une partie
 * terminée ou rangée ne compte pas ; une partie de concours compte avec son concours.
 */
export async function partiesEnCours(
  organizationId: string,
): Promise<{ nombre: number; laquelle: string | null }> {
  const [parties, lesConcours] = await Promise.all([
    db
      .select({ label: games.label, titre: scenarios.title })
      .from(games)
      .innerJoin(scenarios, eq(scenarios.id, games.scenarioId))
      .where(
        and(
          eq(games.organizationId, organizationId),
          isNull(games.competitionStageId),
          isNull(games.archivedAt),
          notInArray(games.status, ["finished", "archived"]),
          sql`${games.difficultyProfile}->>'kind' = 'class'`,
        ),
      ),
    db
      .select({ nom: competitions.name })
      .from(competitions)
      .where(and(eq(competitions.organizationId, organizationId), ne(competitions.status, "finished"))),
  ]);
  const premiere = parties[0];
  return {
    nombre: parties.length + lesConcours.length,
    laquelle: premiere ? (premiere.label ?? premiere.titre) : (lesConcours[0]?.nom ?? null),
  };
}

/** La licence de l'arène EN COURS d'un établissement, avec son paramétrage ; null sans. */
export async function licenceDeLArene(
  organizationId: string,
  now: Date = new Date(),
): Promise<{ statut: LicenceStatus; parametrage: ParametrageDeLicence } | null> {
  const statut = await getLicenceStatus(organizationId, now, "arene");
  if (statut.state !== "active" && statut.state !== "bientot_expiree") return null;
  const parametrage = statut.licence ? parametrageDe(statut.licence) : null;
  return parametrage ? { statut, parametrage } : null;
}

/**
 * LA RÈGLE DE LA LICENCE, À LA CRÉATION d'une partie de classe ou d'un concours.
 *
 * Sans licence de l'arène en cours : `ClasseReserveError` (« pas d'essai en classe »).
 * Avec : refus si l'entreprise, le niveau, le nombre d'enseignants ou le nombre de
 * parties en cours sort du paramétrage (`LicenceDepasseeError`, la phrase et l'offre qui
 * l'ouvre). Un concours se joue avec NOVA et n'a pas de niveau : on vérifie
 * l'entreprise, pas le niveau (il se joue au premier, ouvert à tous en solo).
 */
export async function verifierLaLicence(
  organizationId: string,
  demande: { scenarioCode?: string | null; niveau?: number; concours?: boolean },
): Promise<void> {
  const lic = await licenceDeLArene(organizationId);
  if (!lic) throw new ClasseReserveError();
  const { statut, parametrage } = lic;
  const hors = horsLicence(parametrage, {
    entreprise: demande.concours
      ? ENTREPRISE_DES_CONCOURS
      : await entrepriseDe(demande.scenarioCode ?? DEFAULT_SCENARIO_CODE),
    niveau: demande.concours ? undefined : (demande.niveau ?? 1),
    enseignants: statut.teachers,
    partiesEnCours:
      parametrage.maxPartiesEnCours === null ? undefined : await partiesEnCours(organizationId),
  });
  if (hors) throw new LicenceDepasseeError(hors);
}

/**
 * Ressortir une partie rangée et pas finie la remet EN COURS : sous un plafond de parties
 * en cours (offre Classe), on ne la ressort que s'il reste une place. Sans licence en
 * cours, rien ne s'y oppose : la partie existait déjà.
 */
export async function verifierLaReprise(organizationId: string): Promise<void> {
  const lic = await licenceDeLArene(organizationId);
  if (!lic || lic.parametrage.maxPartiesEnCours === null) return;
  const hors = horsLicence(lic.parametrage, { partiesEnCours: await partiesEnCours(organizationId) });
  if (hors) throw new LicenceDepasseeError(hors);
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
  arene: (LicenceStatus & { offre: OffreDeLArene; parametrage: ParametrageDeLicence }) | null;
  /** Les parties de classe et concours en cours, quand la licence en cours les plafonne. */
  partiesEnCours: { nombre: number; laquelle: string | null } | null;
  /** La licence qui inclut les épisodes, si elle est en cours. */
  episodes: LicenceStatus | null;
}

export async function etatDeLOffre(userId: string, now: Date = new Date()): Promise<EtatDeLOffre> {
  const org = await getTeacherOrgId(userId);
  if (!org) return { etablissement: null, arene: null, episodes: null, partiesEnCours: null };
  const [[ligne], arene, episodes] = await Promise.all([
    db.select({ nom: organizations.name }).from(organizations).where(eq(organizations.id, org)),
    getLicenceStatus(org, now, "arene"),
    getLicenceStatus(org, now, "episodes"),
  ]);
  const enCours = (st: LicenceStatus) => st.state === "active" || st.state === "bientot_expiree";
  const parametrage = arene.licence ? parametrageDe(arene.licence) : null;
  return {
    etablissement: ligne?.nom ?? null,
    arene:
      arene.licence && arene.licence.arene && parametrage
        ? { ...arene, offre: arene.licence.arene, parametrage }
        : null,
    episodes: episodes.licence && enCours(episodes) ? episodes : null,
    partiesEnCours:
      parametrage && parametrage.maxPartiesEnCours !== null && enCours(arene)
        ? await partiesEnCours(org)
        : null,
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
 * ÉPISODES compte : une licence de l'arène seule n'ouvre que l'arène.
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
