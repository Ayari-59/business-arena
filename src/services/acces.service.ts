import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, episodeMembres } from "@/db/schema";
import { getTeacherOrgId } from "@/services/auth.service";
import { entitlementsForOrg } from "@/services/entitlements.service";
import { getPlatformConfig } from "@/services/admin.service";
import { DEFAULT_SCENARIO_CODE } from "@/config/scenarios/registry";
import { messageNiveauxReserves, niveauReserve } from "@/config/vitrine-solo";
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
 * Décision du propriétaire (octobre 2026) : sans licence en cours, l'arène se joue aux
 * niveaux 1 à 3 (config/vitrine-solo.ts) et seuls les épisodes de démonstration se
 * lancent, en Découverte (config/episodes/demos.ts). Une licence en cours (`active` ou
 * `bientot_expiree`, lue par `entitlementsForOrg`) ouvre tout.
 *
 * L'écran montre la règle ; ce module la fait respecter. Il est appelé à la CRÉATION
 * d'une partie et à l'OUVERTURE d'un épisode, jamais pendant une partie : une partie
 * commencée à un niveau fermé se poursuit jusqu'au bout, une partie d'épisode déjà
 * jouée est toujours gardée.
 */

/** Le refus d'un niveau fermé, avec la phrase à montrer (le lien vers les tarifs suit). */
export class NiveauReserveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NiveauReserveError";
  }
}

/** L'une de ces organisations a-t-elle une licence en cours ? */
export async function uneOrganisationSousLicence(
  organisations: readonly (string | null | undefined)[],
): Promise<boolean> {
  for (const org of new Set(organisations.filter((o): o is string => !!o))) {
    if ((await entitlementsForOrg(org)).plan === "full") return true;
  }
  return false;
}

/** L'un de ces comptes est-il rattaché, comme enseignant, à une organisation sous licence ? */
export async function unCompteSousLicence(
  comptes: readonly (string | null | undefined)[],
): Promise<boolean> {
  const organisations = await Promise.all(
    [...new Set(comptes.filter((c): c is string => !!c))].map((c) => getTeacherOrgId(c)),
  );
  return uneOrganisationSousLicence(organisations);
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
 * Qui joue les épisodes et sous quelle licence. `userId` est l'identité qui joue (le
 * cookie invité, qui garde les parties) ; `sessionUserId`, le compte enseignant
 * connecté sur ce navigateur, s'il y en a un.
 *
 *  · la cohorte : un manager entré par le code d'une cohorte dont l'organisation est
 *    sous licence joue tous les épisodes ; celle d'un ENSEIGNANT (créée depuis son
 *    espace) ne prête la licence qu'aux épisodes qu'il y a mis, et une cohorte CLOSE
 *    n'ouvre plus rien de neuf (une partie commencée se termine : `enregistrerPartie`
 *    garde toujours la partie jouée) ;
 *  · le compte : celui rattaché à une organisation sous licence ouvre tout, même pour
 *    qui suit par ailleurs une cohorte restreinte.
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
        (await uneOrganisationSousLicence([cohorte.org]))
      ) {
        if (!cohorte.episodes) return { licence: true, source: "cohorte" };
        restreinte = cohorte.episodes;
      }
    }
    if (await unCompteSousLicence([args.userId, args.sessionUserId])) {
      return { licence: true, source: "compte" };
    }
    if (restreinte) return { licence: true, source: "cohorte", episodes: restreinte };
  } catch (e) {
    // Une panne de lecture n'ouvre rien : les démonstrations restent jouables.
    console.error("[acces] lecture de la licence échouée :", e);
  }
  return { licence: false, source: null };
}
