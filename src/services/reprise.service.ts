import { and, eq, gt, inArray } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "@/db";
import { gameRecoveries, games, players, teams, users } from "@/db/schema";
import { loginAttempts } from "@/db/schema";
import {
  ALPHABET_REPRISE,
  FENETRE_REPRISE_MS,
  LONGUEUR_CODE_REPRISE,
  MAX_ECHECS_REPRISE,
  codeDeReprisePlausible,
  normaliserCodeDeReprise,
} from "@/config/reprise";
import { estArchivee, PARTIE_ARCHIVEE } from "@/services/archivage";

/**
 * SE RENDRE À SOI-MÊME, DANS UNE PARTIE DE CLASSE.
 *
 * L'élève n'a ni compte ni mot de passe : il est reconnu par un cookie
 * invité, donc par son navigateur. Il change de poste, vide ses cookies, passe
 * au téléphone — et l'application ne le reconnaît plus. Elle le rangeait alors
 * dans une équipe quelconque, sans message et sans retour possible, ce que
 * `affectation.service` décrivait déjà comme l'une de ses deux pannes de salle.
 *
 * Le concours avait son remède depuis la migration 0025 : un code personnel
 * de huit caractères. La classe l'a maintenant aussi, dans la même forme et
 * avec les mêmes protections — c'est le même geste pour l'élève, il n'a pas à
 * apprendre deux mécaniques selon le type de partie.
 *
 * CE CODE EST UNE CLÉ, PAS UNE AFFICHE. Les QR de la partie et des tables sont
 * faits pour être vus de toute la salle ; celui-ci ouvre l'identité de son
 * porteur. Il ne va donc ni sur la projection, ni sur les cartons, ni sur la
 * fiche imprimée : il vit sur l'écran de l'élève et dans la liste de
 * l'enseignant, repliée.
 */

// ---------------------------------------------------------------------------
// La garde des tentatives, commune au concours et à la classe
// ---------------------------------------------------------------------------

/**
 * UN CODE DE HUIT CARACTÈRES SE DEVINE, SI ON LAISSE ESSAYER.
 *
 * Les tentatives sont comptées PAR ADRESSE dans la table des échecs de
 * connexion, en base et non en mémoire, parce que l'application est servie
 * depuis plusieurs instances qui ne partagent rien.
 *
 * Le refus ne dit jamais ce qui existe : un code mal formé et un code inconnu
 * rendent le même message et pèsent le même poids dans le compteur. Sans cela,
 * la différence entre les deux réponses aurait appris à quoi ressemble un vrai
 * code.
 */
export interface GardeDeReprise {
  /** Message à rendre tel quel quand l'adresse a trop essayé, sinon null. */
  refus: string | null;
  /** À appeler sur un échec : il compte. */
  echec: () => Promise<void>;
  /** À appeler sur un succès : l'adresse repart de zéro. */
  succes: () => Promise<void>;
}

export async function garderLesTentatives(args: {
  /** Ce qui distingue ce type de reprise des autres dans la table. */
  marqueur: string;
  ip?: string | null;
  now?: number;
}): Promise<GardeDeReprise> {
  const ip = args.ip?.trim() || null;
  const now = args.now ?? Date.now();
  const depuis = new Date(now - FENETRE_REPRISE_MS);

  const echecs = ip
    ? await db
        .select()
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.email, args.marqueur),
            eq(loginAttempts.ip, ip),
            gt(loginAttempts.createdAt, depuis),
          ),
        )
    : [];

  let refus: string | null = null;
  if (echecs.length >= MAX_ECHECS_REPRISE) {
    const plusAncien = Math.min(...echecs.map((e) => e.createdAt.getTime()));
    const minutes = Math.max(1, Math.ceil((plusAncien + FENETRE_REPRISE_MS - now) / 60_000));
    refus = `Trop de tentatives, réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
  }

  return {
    refus,
    echec: async () => {
      await db
        .insert(loginAttempts)
        .values({ email: args.marqueur, ip, createdAt: new Date(now) });
    },
    succes: async () => {
      if (ip)
        await db
          .delete(loginAttempts)
          .where(and(eq(loginAttempts.email, args.marqueur), eq(loginAttempts.ip, ip)));
    },
  };
}

// ---------------------------------------------------------------------------
// Le code d'un joueur de classe
// ---------------------------------------------------------------------------

/** Ce qui distingue les reprises de classe dans la table des échecs. */
export const MARQUEUR_REPRISE_PARTIE = "reprise-de-partie";

function tirerUnCode(): string {
  return Array.from(
    { length: LONGUEUR_CODE_REPRISE },
    () => ALPHABET_REPRISE[randomInt(ALPHABET_REPRISE.length)],
  ).join("");
}

/**
 * Le code personnel d'un élève dans une partie, créé s'il n'existe pas encore.
 *
 * Un élève qui a déjà le sien le garde : ce serait le pire moment pour le
 * changer, puisqu'il l'a justement noté. La collision est improbable — mille
 * milliards de combinaisons — mais l'index l'interdit, donc on retente plutôt
 * que de laisser l'entrée échouer sur un coup de dé.
 */
export async function attribuerCodeDeReprise(gameId: string, userId: string): Promise<string> {
  const existant = await db
    .select()
    .from(gameRecoveries)
    .where(and(eq(gameRecoveries.gameId, gameId), eq(gameRecoveries.userId, userId)));
  if (existant[0]) return existant[0].recoveryCode;

  for (let essai = 0; essai < 8; essai += 1) {
    const pose = await db
      .insert(gameRecoveries)
      .values({ gameId, userId, recoveryCode: tirerUnCode() })
      .onConflictDoNothing()
      .returning({ recoveryCode: gameRecoveries.recoveryCode });
    if (pose[0]) return pose[0].recoveryCode;
    // Conflit : soit le code était pris, soit l'élève en avait déjà un.
    const relu = await db
      .select()
      .from(gameRecoveries)
      .where(and(eq(gameRecoveries.gameId, gameId), eq(gameRecoveries.userId, userId)));
    if (relu[0]) return relu[0].recoveryCode;
  }
  throw new Error("Impossible d'attribuer un code de reprise");
}

/** Le code d'un élève, pour le lui réafficher. Null s'il n'en a pas. */
export async function codeDeRepriseDuJoueur(
  gameId: string,
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(gameRecoveries)
    .where(and(eq(gameRecoveries.gameId, gameId), eq(gameRecoveries.userId, userId)));
  return rows[0]?.recoveryCode ?? null;
}

/**
 * EN TIRER UN AUTRE, ET RENDRE L'ANCIEN INUTILE.
 *
 * Un code se lit par-dessus l'épaule, ou se photographie sur un écran laissé
 * ouvert. L'élève qui s'en aperçoit doit pouvoir refermer la porte lui-même,
 * sans rien demander à personne — sans quoi le seul recours serait de prévenir
 * l'enseignant, c'est-à-dire d'avouer.
 */
export async function regenererCodeDeReprise(gameId: string, userId: string): Promise<string> {
  for (let essai = 0; essai < 8; essai += 1) {
    try {
      const pose = await db
        .update(gameRecoveries)
        .set({ recoveryCode: tirerUnCode(), updatedAt: new Date() })
        .where(and(eq(gameRecoveries.gameId, gameId), eq(gameRecoveries.userId, userId)))
        .returning({ recoveryCode: gameRecoveries.recoveryCode });
      // Aucune ligne : l'élève n'avait pas encore de code. Lui en donner un
      // premier est exactement ce qu'il demandait.
      if (pose[0]) return pose[0].recoveryCode;
      return attribuerCodeDeReprise(gameId, userId);
    } catch {
      // Un code déjà pris ailleurs : l'index l'interdit, on retire au sort.
      // `onConflictDoNothing` n'existe pas sur un UPDATE, d'où ce rattrapage.
    }
  }
  throw new Error("Impossible de renouveler le code de reprise");
}

export interface PlaceRetrouvee {
  userId: string;
  gameId: string;
  equipe: string;
  pseudo: string | null;
}

/**
 * LE CODE REND SA PLACE À SON PROPRIÉTAIRE.
 *
 * Ne vérifie que le code : c'est l'appelant qui pose ensuite le cookie. La
 * partie rangée refuse, comme elle refuse d'être rejointe — un code n'est pas
 * une porte dérobée vers une partie fermée.
 */
export async function reprendreSaPlace(args: {
  code: string;
  ip?: string | null;
  now?: number;
}): Promise<PlaceRetrouvee | { error: string }> {
  const CODE_REFUSE =
    "Code de reprise inconnu. Vérifiez chaque caractère ; en classe, votre enseignant peut vous le relire.";
  const garde = await garderLesTentatives({
    marqueur: MARQUEUR_REPRISE_PARTIE,
    ip: args.ip,
    now: args.now,
  });
  if (garde.refus) return { error: garde.refus };

  const rate = async () => {
    await garde.echec();
    return { error: CODE_REFUSE };
  };

  // Un code mal formé ne peut pas être le bon : même message, même compteur.
  if (!codeDeReprisePlausible(args.code)) return rate();
  const ligne = (
    await db
      .select()
      .from(gameRecoveries)
      .where(eq(gameRecoveries.recoveryCode, normaliserCodeDeReprise(args.code)))
  )[0];
  if (!ligne) return rate();

  const game = (await db.select().from(games).where(eq(games.id, ligne.gameId)))[0];
  if (!game) return rate();
  // Une partie rangée ne se rejoint pas : le code ne la rouvre pas non plus.
  // Le compteur ne bouge pas, lui — le code était bon, et le porteur n'a rien
  // à se reprocher.
  if (estArchivee(game)) return { error: PARTIE_ARCHIVEE };

  await garde.succes();

  const equipes = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, ligne.gameId), eq(teams.controller, "human")));
  const appartenance = (
    await db
      .select()
      .from(players)
      .where(
        and(
          inArray(players.teamId, equipes.map((t) => t.id)),
          eq(players.userId, ligne.userId),
        ),
      )
  )[0];
  const pseudo = (
    await db.select({ nom: users.displayName }).from(users).where(eq(users.id, ligne.userId))
  )[0]?.nom;

  return {
    userId: ligne.userId,
    gameId: ligne.gameId,
    equipe: equipes.find((t) => t.id === appartenance?.teamId)?.name ?? "",
    pseudo: pseudo ?? null,
  };
}

/**
 * LES CODES DE TOUTE UNE PARTIE : la liste que l'enseignant relit à un élève.
 *
 * Le chemin de secours réel d'une salle de classe, c'est l'enseignant. Un
 * élève qui a changé de poste ET perdu son code vient le lui demander ; sans
 * cette liste, personne au monde ne pourrait le lui rendre.
 */
export async function codesDeRepriseDeLaPartie(
  gameId: string,
  teacherId: string,
): Promise<{ teamLabel: string; pseudo: string; code: string }[]> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return [];

  const equipes = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  const nomDEquipe = new Map(equipes.map((t) => [t.id, t.name]));
  const appartenances = await db
    .select()
    .from(players)
    .where(inArray(players.teamId, equipes.map((t) => t.id)));
  const equipeDe = new Map(appartenances.map((p) => [p.userId, nomDEquipe.get(p.teamId) ?? ""]));

  const codes = await db.select().from(gameRecoveries).where(eq(gameRecoveries.gameId, gameId));
  if (codes.length === 0) return [];
  const noms = new Map(
    (
      await db
        .select({ id: users.id, nom: users.displayName })
        .from(users)
        .where(inArray(users.id, codes.map((c) => c.userId)))
    ).map((u) => [u.id, u.nom]),
  );

  return codes
    .map((c) => ({
      teamLabel: equipeDe.get(c.userId) ?? "",
      pseudo: noms.get(c.userId) ?? "",
      code: c.recoveryCode,
    }))
    .sort(
      (a, b) =>
        a.teamLabel.localeCompare(b.teamLabel, "fr", { numeric: true }) ||
        a.pseudo.localeCompare(b.pseudo, "fr"),
    );
}

/**
 * LES ÉLÈVES ENTRÉS AVANT QUE LE CODE EXISTE.
 *
 * Une partie commencée avant cette fonctionnalité a des joueurs sans clé, et
 * leur prochaine entrée par code leur en donnera une — sauf qu'ils n'entreront
 * plus, justement parce qu'ils sont déjà dedans. Ce geste comble le trou d'un
 * coup, depuis la page de la partie, sans toucher aux codes déjà notés.
 *
 * Rend le nombre de codes créés.
 */
export async function creerLesCodesManquants(
  gameId: string,
  teacherId: string,
): Promise<number> {
  const sans = await joueursSansCode(gameId, teacherId);
  for (const userId of sans) await attribuerCodeDeReprise(gameId, userId);
  return sans.length;
}

/** Les élèves de cette partie qui n'ont pas encore de code. */
export async function joueursSansCode(gameId: string, teacherId: string): Promise<string[]> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return [];

  const equipes = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  if (equipes.length === 0) return [];
  const joueurs = await db
    .select({ userId: players.userId })
    .from(players)
    .where(inArray(players.teamId, equipes.map((t) => t.id)));
  const avecCode = new Set(
    (await db.select().from(gameRecoveries).where(eq(gameRecoveries.gameId, gameId))).map(
      (c) => c.userId,
    ),
  );
  return [...new Set(joueurs.map((j) => j.userId))].filter((id) => !avecCode.has(id));
}
