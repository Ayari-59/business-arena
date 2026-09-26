import { randomInt } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  competitionEntries,
  competitionMembers,
  competitionStages,
  competitions,
  gameRankings,
  games,
  loginAttempts,
  players,
  teams,
  users,
} from "@/db/schema";
import { composeGroups, podium, qualifiers, type GroupStanding } from "@/competition";
import { apercuDePhase, LIMITES_CONCOURS } from "@/config/concours";
import {
  ALPHABET_REPRISE,
  codeDeReprisePlausible,
  FENETRE_REPRISE_MS,
  LONGUEUR_CODE_REPRISE,
  MAX_ECHECS_REPRISE,
  normaliserCodeDeReprise,
} from "@/config/reprise";
import { createGameCore } from "@/services/game-creation.service";
import { entitlementsForOrg } from "@/services/entitlements.service";
import { DEFAULT_QUIZ_MODE } from "@/config/difficulty";
import type { Periodicity } from "@/config/scenarios/periodicity";

/**
 * Moteur de concours (étape 13, doc 04) : un concours = un arbre de phases qui
 * ENGENDRENT des parties ordinaires (mode "competition" : décisions
 * verrouillées, indices limités — §25). Zéro modification du moteur
 * économique. Cycle : registration → qualification (groupes) → finale →
 * finished. L'organisateur clôt les tours de chaque partie via son pilotage
 * habituel (/teacher/games/[id]).
 */

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

interface CompetitionRules {
  joinCode: string;
  periodicity: Periodicity;
  groupSize: number; // équipes par partie de qualification (2-6)
  advancePerGroup: number; // qualifiés par groupe pour la finale
  seed: number;
}

const rulesOf = (c: { rules: unknown }): CompetitionRules => c.rules as CompetitionRules;

// ---------------------------------------------------------------------------
// Création et inscriptions
// ---------------------------------------------------------------------------

export async function createCompetition(args: {
  organizerId: string;
  organizationId: string;
  name: string;
  periodicity: Periodicity;
  groupSize: number;
  advancePerGroup: number;
}): Promise<{ competitionId: string; joinCode: string }> {
  // Palier gratuit : le mode concours est réservé à l'offre établissement.
  const ent = await entitlementsForOrg(args.organizationId);
  if (!ent.competitions) {
    throw new Error(
      "Les concours sont réservés à l'offre établissement. Activez une licence pour les ouvrir.",
    );
  }
  const { getOrCreateNovaScenarioIdPublic } = await import("./game-creation.service");
  const scenarioId = await getOrCreateNovaScenarioIdPublic();
  const joinCode = makeCode();
  const rules: CompetitionRules = {
    joinCode,
    periodicity: args.periodicity,
    groupSize: Math.min(Math.max(args.groupSize, 2), 6),
    advancePerGroup: Math.min(Math.max(args.advancePerGroup, 1), 4),
    seed: randomInt(1, 2 ** 31),
  };
  const inserted = await db
    .insert(competitions)
    .values({
      organizationId: args.organizationId,
      name: args.name.trim() || "Business Arena Championship",
      status: "registration",
      scenarioId,
      rules,
      joinCode,
      organizerId: args.organizerId,
    })
    .returning({ id: competitions.id });
  return { competitionId: inserted[0]!.id, joinCode };
}

/**
 * Inscription d'un joueur : crée l'équipe (team_label) ou la rejoint.
 *
 * Un joueur déjà inscrit n'est pas réinscrit ni déplacé : la réponse porte
 * alors `alreadyMember`, le nom de son équipe, pour que la page le dise au
 * lieu de rediriger en silence (vague 1, K4).
 */
/**
 * POURQUOI CE CODE DE CONCOURS NE PERMET PAS DE S'INSCRIRE, s'il y a une raison.
 *
 * Même motif que `refusDeRejoindre` : l'action créait un utilisateur invité
 * avant de savoir si le concours existe. Le refus se prononce d'abord, sur une
 * lecture seule. `joinCompetition` refait le contrôle et fait autorité.
 */
export async function refusDeSInscrire(code: string): Promise<string | null> {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.joinCode, code.trim().toUpperCase()))
  )[0];
  if (!competition) return "Code de concours inconnu.";
  if (competition.status !== "registration") return "Les inscriptions de ce concours sont closes.";
  return null;
}

export async function joinCompetition(args: {
  code: string;
  userId: string;
  teamLabel: string;
  pseudo?: string;
}): Promise<
  | { competitionId: string; alreadyMember?: string; codeDeReprise?: string }
  | { error: string }
> {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.joinCode, args.code.trim().toUpperCase()))
  )[0];
  if (!competition) return { error: "Code de concours inconnu." };
  if (competition.status !== "registration")
    return { error: "Les inscriptions de ce concours sont closes." };
  const label = args.teamLabel.trim().slice(0, 40);
  if (!label) return { error: "Donnez un nom à votre équipe." };

  // Fast non-atomic pre-check (safety net, not authoritative)
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  const existing = entries.find((e) => e.memberUserIds.includes(args.userId));
  if (existing) return { competitionId: competition.id, alreadyMember: existing.teamLabel };

  // Atomic join: UPDATE with array_append + WHERE guards
  const updated = await db
    .update(competitionEntries)
    .set({
      memberUserIds: sql`array_append(${competitionEntries.memberUserIds}, ${args.userId}::uuid)`,
    })
    .where(
      and(
        eq(competitionEntries.competitionId, competition.id),
        sql`lower(${competitionEntries.teamLabel}) = lower(${label})`,
        sql`NOT (${args.userId}::uuid = ANY(${competitionEntries.memberUserIds}))`,
        sql`array_length(${competitionEntries.memberUserIds}, 1) < 6`,
      ),
    )
    .returning({ teamLabel: competitionEntries.teamLabel });

  // LE NOM CANONIQUE DE L'ÉQUIPE, ET NON CELUI QUI VIENT D'ÊTRE TAPÉ.
  // « les requins » rejoint bien « Les Requins », mais c'est le nom de
  // l'équipe qu'il faut retenir : sinon le membre garde la casse de sa propre
  // saisie, et l'organisateur lit deux équipes là où il n'y en a qu'une.
  let libelleCanonique = label;
  if (updated.length > 0) {
    libelleCanonique = updated[0]!.teamLabel;
  } else {
    // Determine why UPDATE returned 0 rows
    const sameLabel = entries.find((e) => e.teamLabel.toLowerCase() === label.toLowerCase());
    if (sameLabel) {
      if (sameLabel.memberUserIds.includes(args.userId))
        return { competitionId: competition.id, alreadyMember: sameLabel.teamLabel };
      return { error: "Cette équipe est complète (6 joueurs max)." };
    }
    // New team — INSERT with capacity guard
    if (entries.length >= 32) return { error: "Le concours est complet (32 équipes)." };
    try {
      await db.insert(competitionEntries).values({
        competitionId: competition.id,
        teamLabel: label,
        memberUserIds: [args.userId],
        organizationId: competition.organizationId,
        status: "registered",
      });
    } catch (err: unknown) {
      const pg = (err as { cause?: { code?: string } }).cause ?? (err as { code?: string });
      if (pg.code === "23505") {
        // Case-insensitive label collision — retry as join
        const retried = await db
          .update(competitionEntries)
          .set({
            memberUserIds: sql`array_append(${competitionEntries.memberUserIds}, ${args.userId}::uuid)`,
          })
          .where(
            and(
              eq(competitionEntries.competitionId, competition.id),
              sql`lower(${competitionEntries.teamLabel}) = lower(${label})`,
              sql`NOT (${args.userId}::uuid = ANY(${competitionEntries.memberUserIds}))`,
              sql`array_length(${competitionEntries.memberUserIds}, 1) < 6`,
            ),
          )
          .returning({ teamLabel: competitionEntries.teamLabel });
        if (retried.length === 0)
          return { error: "Cette équipe est complète (6 joueurs max)." };
        libelleCanonique = retried[0]!.teamLabel;
      } else {
        throw err;
      }
    }
  }
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  const codeDeReprise = await attribuerCodeDeReprise(
    competition.id,
    args.userId,
    libelleCanonique,
  );
  return { competitionId: competition.id, codeDeReprise };
}

/**
 * LE CODE PERSONNEL D'UN MEMBRE, POSÉ UNE FOIS POUR TOUTES.
 *
 * Il est tiré au sort dans l'alphabet des codes lisibles. La collision est
 * improbable (mille milliards de combinaisons) mais l'index l'interdit, donc
 * on retente plutôt que de laisser l'inscription échouer sur un coup de dé.
 *
 * Un membre qui a déjà son code le garde : ce serait le pire moment pour le
 * changer, puisqu'il l'a justement noté.
 */
async function attribuerCodeDeReprise(
  competitionId: string,
  userId: string,
  teamLabel: string,
): Promise<string> {
  const existant = await db
    .select()
    .from(competitionMembers)
    .where(
      and(
        eq(competitionMembers.competitionId, competitionId),
        eq(competitionMembers.userId, userId),
      ),
    );
  if (existant[0]) return existant[0].recoveryCode;

  for (let essai = 0; essai < 8; essai++) {
    const code = Array.from(
      { length: LONGUEUR_CODE_REPRISE },
      () => ALPHABET_REPRISE[randomInt(ALPHABET_REPRISE.length)],
    ).join("");
    const pose = await db
      .insert(competitionMembers)
      .values({ competitionId, userId, teamLabel, recoveryCode: code })
      .onConflictDoNothing()
      .returning({ recoveryCode: competitionMembers.recoveryCode });
    if (pose[0]) return pose[0].recoveryCode;
    // Conflit : soit le code était pris, soit le membre existe déjà.
    const relu = await db
      .select()
      .from(competitionMembers)
      .where(
        and(
          eq(competitionMembers.competitionId, competitionId),
          eq(competitionMembers.userId, userId),
        ),
      );
    if (relu[0]) return relu[0].recoveryCode;
  }
  throw new Error("Impossible d'attribuer un code de reprise");
}

/** Le code personnel d'un membre, pour le lui réafficher ou le relire. */
export async function codeDeRepriseDe(
  competitionId: string,
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(competitionMembers)
    .where(
      and(
        eq(competitionMembers.competitionId, competitionId),
        eq(competitionMembers.userId, userId),
      ),
    );
  return rows[0]?.recoveryCode ?? null;
}

/** Les codes de tout un concours : la liste que l'organisateur relit à un élève. */
export async function codesDeRepriseDuConcours(
  competitionId: string,
  organizerId: string,
): Promise<{ teamLabel: string; pseudo: string; code: string }[]> {
  await loadOwnedCompetition(competitionId, organizerId);
  const rows = await db
    .select({
      teamLabel: competitionMembers.teamLabel,
      code: competitionMembers.recoveryCode,
      pseudo: users.displayName,
    })
    .from(competitionMembers)
    .innerJoin(users, eq(users.id, competitionMembers.userId))
    .where(eq(competitionMembers.competitionId, competitionId));
  return rows
    .map((r) => ({ teamLabel: r.teamLabel, pseudo: r.pseudo ?? "", code: r.code }))
    .sort((a, b) => a.teamLabel.localeCompare(b.teamLabel) || a.pseudo.localeCompare(b.pseudo));
}

/**
 * REPRENDRE SON IDENTITÉ AVEC SON CODE.
 *
 * Rend l'identité du membre à qui ce code appartient. Le message d'échec est
 * le même pour un code mal formé et pour un code inconnu : dire « ce code
 * n'existe pas » plutôt que « ce code est faux » apprendrait à un curieux
 * lesquels existent.
 *
 * Les tentatives sont comptées par adresse dans la table des échecs de
 * connexion, en base et non en mémoire, parce que l'application est servie
 * depuis plusieurs instances qui ne partagent rien.
 */
export const MARQUEUR_REPRISE = "reprise-de-concours";

export async function reprendreSonIdentite(args: {
  code: string;
  ip?: string | null;
  now?: number;
}): Promise<
  | { userId: string; competitionId: string; teamLabel: string }
  | { error: string }
> {
  const CODE_REFUSE = "Code de reprise inconnu. Vérifiez-le auprès de votre enseignant.";
  const ip = args.ip?.trim() || null;
  const now = args.now ?? Date.now();
  const depuis = new Date(now - FENETRE_REPRISE_MS);

  const echecs = ip
    ? await db
        .select()
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.email, MARQUEUR_REPRISE),
            eq(loginAttempts.ip, ip),
            gt(loginAttempts.createdAt, depuis),
          ),
        )
    : [];
  if (echecs.length >= MAX_ECHECS_REPRISE) {
    const plusAncien = Math.min(...echecs.map((e) => e.createdAt.getTime()));
    const minutes = Math.max(1, Math.ceil((plusAncien + FENETRE_REPRISE_MS - now) / 60_000));
    return { error: `Trop de tentatives, réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` };
  }

  const echec = async () => {
    await db
      .insert(loginAttempts)
      .values({ email: MARQUEUR_REPRISE, ip, createdAt: new Date(now) });
    return { error: CODE_REFUSE };
  };

  // Un code mal formé ne peut pas être le bon : même message, même compteur.
  if (!codeDeReprisePlausible(args.code)) return echec();
  const rows = await db
    .select()
    .from(competitionMembers)
    .where(eq(competitionMembers.recoveryCode, normaliserCodeDeReprise(args.code)));
  const membre = rows[0];
  if (!membre) return echec();

  // Succès : le compteur de cette adresse repart de zéro.
  if (ip)
    await db
      .delete(loginAttempts)
      .where(and(eq(loginAttempts.email, MARQUEUR_REPRISE), eq(loginAttempts.ip, ip)));
  return {
    userId: membre.userId,
    competitionId: membre.competitionId,
    teamLabel: membre.teamLabel,
  };
}

// ---------------------------------------------------------------------------
// Phases : qualification → finale → clôture
// ---------------------------------------------------------------------------

async function loadOwnedCompetition(competitionId: string, organizerId: string) {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.id, competitionId))
  )[0];
  if (!competition || competition.organizerId !== organizerId)
    throw new Error("Concours introuvable ou non autorisé");
  return competition;
}

/** Crée une partie de phase et y installe les équipes-entries + leurs joueurs. */
async function createStageGame(args: {
  competition: { organizationId: string | null; organizerId: string };
  stageId: string;
  rules: CompetitionRules;
  entryLabels: string[];
  membersByLabel: Map<string, string[]>;
}): Promise<string> {
  const created = await createGameCore({
    organizationId: args.competition.organizationId!,
    createdBy: args.competition.organizerId,
    periodicity: args.rules.periodicity,
    kind: "class",
    humanTeams: args.entryLabels.map((label) => ({ name: label })),
    botCount: 0,
    mode: "competition",
    competitionStageId: args.stageId,
    // Un championnat se joue au même régime qu'une partie de classe : la
    // question du modèle d'analyse, sans les questions de connaissances. Sans
    // ce réglage explicite, les parties de concours retombaient sur le
    // comportement historique (tout servi) par simple omission.
    quizMode: DEFAULT_QUIZ_MODE,
  });
  const playerValues = created.teams.flatMap((team) =>
    (args.membersByLabel.get(team.name) ?? []).map((userId, i) => ({
      teamId: team.id,
      userId,
      role: i === 0 ? ("captain" as const) : ("member" as const),
    })),
  );
  if (playerValues.length > 0)
    await db.insert(players).values(playerValues).onConflictDoNothing();
  return created.gameId;
}

/** Clôt les inscriptions et lance la phase de qualification (groupes tirés au sort seedé). */
export async function startQualification(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ groups: number }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  if (competition.status !== "registration")
    throw new Error("Les qualifications sont déjà lancées");
  const rules = rulesOf(competition);
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  if (entries.length < 2) throw new Error("Il faut au moins 2 équipes inscrites");

  const stage = await db
    .insert(competitionStages)
    .values({
      competitionId: competition.id,
      index: 1,
      kind: "qualification",
      format: { teamsPerGame: rules.groupSize, advanceCount: rules.advancePerGroup },
      status: "running",
    })
    .returning({ id: competitionStages.id });

  const groups = composeGroups(entries.map((e) => e.teamLabel), rules.groupSize, rules.seed);
  const membersByLabel = new Map(entries.map((e) => [e.teamLabel, e.memberUserIds]));
  for (const group of groups) {
    await createStageGame({
      competition,
      stageId: stage[0]!.id,
      rules,
      entryLabels: group,
      membersByLabel,
    });
  }
  await db
    .update(competitionEntries)
    .set({ status: "active" })
    .where(eq(competitionEntries.competitionId, competition.id));
  await db
    .update(competitions)
    .set({ status: "running" })
    .where(eq(competitions.id, competition.id));
  return { groups: groups.length };
}

/** Classements d'une phase, par partie, exprimés en entries (labels d'équipe). */
async function stageStandings(stageId: string): Promise<GroupStanding[][]> {
  // Ordre STABLE, identique à celui de getCompetitionView : les classements
  // sont ensuite associés aux cartes de partie PAR INDEX. Sans ORDER BY, deux
  // requêtes non ordonnées peuvent renvoyer les lignes dans un ordre différent
  // (surtout pendant des clôtures concurrentes) et le classement d'un groupe
  // s'afficherait sous la carte d'un autre.
  const stageGames = await db
    .select()
    .from(games)
    .where(eq(games.competitionStageId, stageId))
    .orderBy(asc(games.id));
  if (stageGames.length === 0) return [];
  const gameIds = stageGames.map((g) => g.id);
  const allTeams = await db.select().from(teams).where(inArray(teams.gameId, gameIds));
  const allRankings = await db
    .select()
    .from(gameRankings)
    .where(inArray(gameRankings.gameId, gameIds));
  return stageGames.map((game) => {
    const teamRows = allTeams.filter((t) => t.gameId === game.id);
    const rankings = allRankings.filter((r) => r.gameId === game.id);
    return rankings.map((r) => {
      const detail = r.detail as {
        dimensions?: Record<string, number>;
        cumulativeNetIncome?: number;
      };
      return {
        entryId: teamRows.find((t) => t.id === r.teamId)?.name ?? "?",
        bpi: Number(r.bpi),
        financial: detail.dimensions?.["financial"] ?? 0,
        lastTreasury: detail.cumulativeNetIncome ?? 0,
      };
    });
  });
}

/**
 * LA PHASE QUI SE TERMINE, ET CE QU'ELLE QUALIFIE.
 *
 * Un concours n'a plus deux phases mais autant que l'organisateur en lance :
 * des poules, puis d'autres poules s'il le veut, puis la finale. Tout ce qui
 * enchaîne passe donc par ici — la phase en cours, quel que soit son type, et
 * les équipes qui en sortent.
 *
 * Le nombre de qualifiées se lit sur le FORMAT DE LA PHASE et non sur les
 * règles du concours : chaque phase porte le sien depuis sa création, et c'est
 * ce qui permet de qualifier deux équipes par poule en demi-finale après n'en
 * avoir qualifié qu'une en préliminaire.
 */
async function phaseQuiSeTermine(competitionId: string): Promise<{
  stage: typeof competitionStages.$inferSelect;
  standings: GroupStanding[][];
  qualifieesParPoule: number;
}> {
  const stages = await db
    .select()
    .from(competitionStages)
    .where(eq(competitionStages.competitionId, competitionId));
  const stage = stages.find((s) => s.status === "running");
  if (!stage) throw new Error("Aucune phase en cours");

  const stageGames = await db.select().from(games).where(eq(games.competitionStageId, stage.id));
  if (stageGames.length === 0 || stageGames.some((g) => g.status !== "finished"))
    throw new Error("Toutes les parties de cette phase doivent être terminées");

  const format = (stage.format ?? {}) as { advanceCount?: number };
  return {
    stage,
    standings: await stageStandings(stage.id),
    qualifieesParPoule: Math.max(1, format.advanceCount ?? 1),
  };
}

/**
 * Clôt la phase qui s'achève : elle passe en terminée, les qualifiées restent
 * actives, les autres sont éliminées. Un même geste après chaque phase, pour
 * que le statut d'une équipe dise toujours si elle joue encore.
 */
async function cloreLaPhase(
  competitionId: string,
  stageId: string,
  survivantes: string[],
): Promise<void> {
  await db
    .update(competitionStages)
    .set({ status: "finished" })
    .where(eq(competitionStages.id, stageId));
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  for (const entry of entries) {
    await db
      .update(competitionEntries)
      .set({ status: survivantes.includes(entry.teamLabel) ? "active" : "eliminated" })
      .where(
        and(
          eq(competitionEntries.competitionId, competitionId),
          eq(competitionEntries.teamLabel, entry.teamLabel),
        ),
      );
  }
}

/**
 * UNE PHASE INTERMÉDIAIRE DE POULES (demi-finales, tour 2…).
 *
 * Les qualifiées de la phase en cours sont retirées au sort dans de nouvelles
 * poules. La graine du tirage est celle du concours DÉCALÉE PAR L'INDEX de la
 * phase : sans ce décalage, deux phases successives mélangeraient la même
 * liste dans le même ordre, et les équipes se retrouveraient ensemble deux
 * fois de suite sans que rien ne l'explique.
 *
 * Le nom saisi par l'organisateur vit dans le format de la phase, en jsonb :
 * aucune colonne à ajouter, et l'affichage sait dire « Demi-finales » plutôt
 * que « Phase 2 ».
 */
export async function startIntermediateStage(args: {
  competitionId: string;
  organizerId: string;
  groupSize: number;
  advancePerGroup: number;
  nom?: string;
}): Promise<{ groups: number; survivors: string[] }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  const rules = rulesOf(competition);
  const { stage, standings, qualifieesParPoule } = await phaseQuiSeTermine(competition.id);
  if (stage.kind === "final") throw new Error("La finale ne se prolonge pas : clôturez le concours");

  const survivantes = qualifiers(standings, qualifieesParPoule);
  const taille = Math.min(
    Math.max(args.groupSize, LIMITES_CONCOURS.tailleGroupe.min),
    LIMITES_CONCOURS.tailleGroupe.max,
  );
  const qualifiees = Math.min(
    Math.max(args.advancePerGroup, LIMITES_CONCOURS.qualifiesParGroupe.min),
    LIMITES_CONCOURS.qualifiesParGroupe.max,
  );
  // Le même aperçu que celui montré à l'organisateur avant de confirmer : ce
  // qui est refusé à l'écran doit l'être ici, et pour la même raison.
  const apercu = apercuDePhase(survivantes.length, taille, qualifiees);
  if (!apercu.possible) throw new Error(apercu.empechement!);

  const index = stage.index + 1;
  const nouvelle = await db
    .insert(competitionStages)
    .values({
      competitionId: competition.id,
      index,
      kind: "semifinal",
      format: { teamsPerGame: taille, advanceCount: qualifiees, nom: args.nom?.trim() || null },
      status: "running",
    })
    .returning({ id: competitionStages.id });

  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  const membersByLabel = new Map(entries.map((e) => [e.teamLabel, e.memberUserIds]));
  const poules = composeGroups(survivantes, taille, rules.seed + index);
  for (const poule of poules) {
    await createStageGame({
      competition,
      stageId: nouvelle[0]!.id,
      rules,
      entryLabels: poule,
      membersByLabel,
    });
  }

  await cloreLaPhase(competition.id, stage.id, survivantes);
  return { groups: poules.length, survivors: survivantes };
}

/** Lance la finale : qualifie les meilleures de la phase en cours (doc 04 §3). */
export async function startFinal(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ finalists: string[] }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  const rules = rulesOf(competition);
  const { stage, standings, qualifieesParPoule } = await phaseQuiSeTermine(competition.id);
  if (stage.kind === "final") throw new Error("La finale est déjà lancée");

  const targetCount = Math.min(
    LIMITES_CONCOURS.finalistesMax,
    Math.max(2, standings.length * qualifieesParPoule),
  );
  const finalists = qualifiers(standings, qualifieesParPoule, targetCount);
  if (finalists.length < 2) throw new Error("Pas assez de qualifiés pour une finale");

  const finalStage = await db
    .insert(competitionStages)
    .values({
      competitionId: competition.id,
      index: stage.index + 1,
      kind: "final",
      format: { teamsPerGame: finalists.length, advanceCount: 1 },
      status: "running",
    })
    .returning({ id: competitionStages.id });

  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  const membersByLabel = new Map(entries.map((e) => [e.teamLabel, e.memberUserIds]));
  await createStageGame({
    competition,
    stageId: finalStage[0]!.id,
    rules,
    entryLabels: finalists,
    membersByLabel,
  });

  await cloreLaPhase(competition.id, stage.id, finalists);
  return { finalists };
}

/** Clôt le concours une fois la finale terminée : podium et vainqueur. */
export async function finishCompetition(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ podium: string[] }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  const stages = await db
    .select()
    .from(competitionStages)
    .where(eq(competitionStages.competitionId, competition.id));
  const finalStage = stages.find((s) => s.kind === "final");
  if (!finalStage) throw new Error("La finale n'a pas été lancée");
  const finalGames = await db
    .select()
    .from(games)
    .where(eq(games.competitionStageId, finalStage.id));
  if (finalGames.some((g) => g.status !== "finished"))
    throw new Error("La finale n'est pas terminée");

  const standings = await stageStandings(finalStage.id);
  const ranking = podium(standings[0] ?? []);
  const winner = ranking[0];
  // La finale se clôt comme les autres phases : plus personne n'est « en
  // lice » dans un concours terminé. Le vainqueur reçoit ensuite son statut.
  await cloreLaPhase(competition.id, finalStage.id, []);
  if (winner) {
    await db
      .update(competitionEntries)
      .set({ status: "winner" })
      .where(
        and(
          eq(competitionEntries.competitionId, competition.id),
          eq(competitionEntries.teamLabel, winner),
        ),
      );
  }
  await db
    .update(competitions)
    .set({ status: "finished" })
    .where(eq(competitions.id, competition.id));
  return { podium: ranking };
}

/**
 * Fenêtre d'une étape de concours (planning) : les parties de cette étape ne
 * sont jouables qu'entre `startsAt` et `endsAt`. Chaque borne peut être null.
 * L'ouverture doit précéder la fermeture. Le verrou d'étape se combine à la
 * fenêtre de chaque partie et de chaque tour (intersection des fenêtres).
 */
export async function setStageWindow(args: {
  competitionId: string;
  stageId: string;
  organizerId: string;
  startsAt: Date | null;
  endsAt: Date | null;
}): Promise<void> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  if (args.startsAt && args.endsAt && args.startsAt.getTime() > args.endsAt.getTime()) {
    throw new Error("L'ouverture doit précéder la fermeture.");
  }
  const result = await db
    .update(competitionStages)
    .set({ startsAt: args.startsAt, endsAt: args.endsAt })
    .where(
      and(
        eq(competitionStages.id, args.stageId),
        eq(competitionStages.competitionId, competition.id),
      ),
    )
    .returning({ id: competitionStages.id });
  if (result.length === 0) throw new Error("Étape introuvable");
}

/**
 * Réglage de la page publique d'annonce par l'organisateur. Contrôle
 * d'appartenance via organizerId ; les champs libres sont bornés côté appelant
 * (action). `visible` bascule la page en ligne (true) ou en 404 (false).
 */
export async function setPublicPage(args: {
  competitionId: string;
  organizerId: string;
  visible: boolean;
  tagline: string | null;
  description: string | null;
  organizerLabel: string | null;
  accent: string | null;
}): Promise<void> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  await db
    .update(competitions)
    .set({
      publicVisible: args.visible,
      tagline: args.tagline,
      description: args.description,
      organizerLabel: args.organizerLabel,
      accent: args.accent,
    })
    .where(eq(competitions.id, competition.id));
}

export interface PublicCompetition {
  name: string;
  status: string;
  joinCode: string;
  tagline: string | null;
  description: string | null;
  organizerLabel: string | null;
  accent: string | null;
  /** Nombre d'équipes déjà inscrites. */
  entriesCount: number;
  /** Étapes datées (planning), pour le programme public. Dates en ISO ou null. */
  stages: { kind: string; startsAt: string | null; endsAt: string | null }[];
}

/**
 * La page publique d'un concours, par son code. Renvoie null si le concours
 * n'existe pas ou n'a pas été publié (public_visible faux) : la page est alors
 * un 404, jamais un aperçu du concours d'un autre. Ne renvoie rien
 * d'identifiant sur l'organisateur ni sur les équipes — c'est une page ouverte.
 */
export async function getPublicCompetition(code: string): Promise<PublicCompetition | null> {
  const competition = (
    await db
      .select()
      .from(competitions)
      .where(eq(competitions.joinCode, code.trim().toUpperCase()))
  )[0];
  if (!competition || !competition.publicVisible) return null;

  const entries = await db
    .select({ teamLabel: competitionEntries.teamLabel })
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));

  const stages = (
    await db
      .select()
      .from(competitionStages)
      .where(eq(competitionStages.competitionId, competition.id))
  ).sort((a, b) => a.index - b.index);

  return {
    name: competition.name,
    status: competition.status,
    joinCode: competition.joinCode,
    tagline: competition.tagline,
    description: competition.description,
    organizerLabel: competition.organizerLabel,
    accent: competition.accent,
    entriesCount: entries.length,
    stages: stages.map((s) => ({
      kind: s.kind,
      startsAt: s.startsAt ? s.startsAt.toISOString() : null,
      endsAt: s.endsAt ? s.endsAt.toISOString() : null,
    })),
  };
}

/** Les codes des concours publiés (pour le plan du site). */
export async function getPublicCompetitionCodes(): Promise<string[]> {
  const rows = await db
    .select({ joinCode: competitions.joinCode })
    .from(competitions)
    .where(eq(competitions.publicVisible, true));
  return rows.map((r) => r.joinCode);
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

export interface CompetitionView {
  competitionId: string;
  name: string;
  status: string;
  joinCode: string;
  organizerId: string;
  /** Réglages fixés à la création : ce que l'organisateur doit pouvoir relire. */
  rules: { periodicity: Periodicity; groupSize: number; advancePerGroup: number };
  entries: { teamLabel: string; members: number; status: string }[];
  stages: {
    stageId: string;
    index: number;
    kind: string;
    status: string;
    /**
     * Le format figé à la création de la phase : taille des poules, équipes
     * qualifiées, et le nom que l'organisateur lui a donné. C'est lui, et non
     * les règles du concours, qui décrit une phase intermédiaire.
     */
    format: { teamsPerGame?: number; advanceCount?: number; nom?: string | null };
    /** Fenêtre de l'étape (planning), en ISO ou null. */
    startsAt: string | null;
    endsAt: string | null;
    games: {
      gameId: string;
      status: string;
      currentRound: number;
      roundsCount: number;
      standings: { entryId: string; bpi: number }[];
    }[];
  }[];
  podium: string[] | null;
  /** Réglages de la page publique d'annonce (pour préremplir le panneau prof). */
  publicPage: {
    visible: boolean;
    tagline: string | null;
    description: string | null;
    organizerLabel: string | null;
    accent: string | null;
  };
}

export async function getCompetitionView(competitionId: string): Promise<CompetitionView | null> {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.id, competitionId))
  )[0];
  if (!competition) return null;
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  const stages = (
    await db
      .select()
      .from(competitionStages)
      .where(eq(competitionStages.competitionId, competitionId))
  ).sort((a, b) => a.index - b.index);

  const stageViews = [];
  for (const stage of stages) {
    // Même ORDER BY que stageStandings : l'association standings[i] ↔ carte de
    // partie se fait par index, les deux ordres doivent coïncider.
    const stageGames = await db
      .select()
      .from(games)
      .where(eq(games.competitionStageId, stage.id))
      .orderBy(asc(games.id));
    const standings = await stageStandings(stage.id);
    stageViews.push({
      stageId: stage.id,
      index: stage.index,
      kind: stage.kind,
      status: stage.status,
      format: (stage.format ?? {}) as { teamsPerGame?: number; advanceCount?: number; nom?: string | null },
      startsAt: stage.startsAt ? stage.startsAt.toISOString() : null,
      endsAt: stage.endsAt ? stage.endsAt.toISOString() : null,
      games: stageGames.map((g, i) => ({
        gameId: g.id,
        status: g.status,
        currentRound: g.currentRound,
        roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
        standings: (standings[i] ?? [])
          .sort((a, b) => b.bpi - a.bpi)
          .map((s) => ({ entryId: s.entryId, bpi: s.bpi })),
      })),
    });
  }

  let finalPodium: string[] | null = null;
  if (competition.status === "finished") {
    const finalStage = stages.find((s) => s.kind === "final");
    if (finalStage) {
      const standings = await stageStandings(finalStage.id);
      finalPodium = podium(standings[0] ?? []);
    }
  }

  const rules = rulesOf(competition);
  return {
    competitionId,
    name: competition.name,
    status: competition.status,
    joinCode: competition.joinCode,
    organizerId: competition.organizerId,
    rules: {
      periodicity: rules.periodicity,
      groupSize: rules.groupSize,
      advancePerGroup: rules.advancePerGroup,
    },
    entries: entries.map((e) => ({
      teamLabel: e.teamLabel,
      members: e.memberUserIds.length,
      status: e.status,
    })),
    stages: stageViews,
    podium: finalPodium,
    publicPage: {
      visible: competition.publicVisible,
      tagline: competition.tagline,
      description: competition.description,
      organizerLabel: competition.organizerLabel,
      accent: competition.accent,
    },
  };
}

/** Concours d'un organisateur (liste, plus récents d'abord). */
export async function getOrganizerCompetitions(organizerId: string) {
  const rows = await db
    .select()
    .from(competitions)
    .where(eq(competitions.organizerId, organizerId))
    .orderBy(desc(competitions.createdAt));
  if (rows.length === 0) return [];
  const allEntries = await db
    .select({ competitionId: competitionEntries.competitionId })
    .from(competitionEntries)
    .where(inArray(competitionEntries.competitionId, rows.map((c) => c.id)));
  const countByComp = new Map<string, number>();
  for (const e of allEntries) countByComp.set(e.competitionId, (countByComp.get(e.competitionId) ?? 0) + 1);
  return rows.map((c) => ({
    competitionId: c.id,
    name: c.name,
    status: c.status,
    joinCode: c.joinCode,
    entriesCount: countByComp.get(c.id) ?? 0,
    createdAt: c.createdAt,
  }));
}

/** Le concours auquel participe un joueur, et sa partie en cours s'il y en a une. */
export async function getPlayerCompetition(
  competitionId: string,
  userId: string,
): Promise<{ view: CompetitionView; myGameId: string | null; myTeamLabel: string | null } | null> {
  const view = await getCompetitionView(competitionId);
  if (!view) return null;
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  const mine = entries.find((e) => e.memberUserIds.includes(userId));
  const isOrganizer = view.organizerId === userId;
  if (!mine && !isOrganizer) return null;

  let myGameId: string | null = null;
  if (mine) {
    const competitionGameIds = new Set(
      view.stages.flatMap((s) => s.games.map((g) => g.gameId)),
    );
    const membership = await db.select().from(players).where(eq(players.userId, userId));
    if (membership.length > 0) {
      const teamRows = await db
        .select()
        .from(teams)
        .where(inArray(teams.id, membership.map((m) => m.teamId)));
      const myGameIds = teamRows
        .map((t) => t.gameId)
        .filter((gid) => competitionGameIds.has(gid));
      if (myGameIds.length > 0) {
        const running = view.stages
          .flatMap((s) => s.games)
          .filter((g) => myGameIds.includes(g.gameId))
          .sort((a, b) => (a.status === "running" ? -1 : 1) - (b.status === "running" ? -1 : 1));
        myGameId = running[0]?.gameId ?? null;
      }
    }
  }
  return { view, myGameId, myTeamLabel: mine?.teamLabel ?? null };
}
