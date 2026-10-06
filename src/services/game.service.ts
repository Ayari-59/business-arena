import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  decisions,
  gameRankings,
  games,
  players,
  roundResults,
  rounds,
  teams,
  users,
} from "@/db/schema";
import type { ScenarioVocabulary, Sector } from "@/config/scenarios/registry";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { estArchivee, PARTIE_ARCHIVEE } from "@/services/archivage";
import { choisirSonEquipe, peutChoisirSonEquipe } from "@/services/affectation.service";
import { attribuerCodeDeReprise } from "@/services/reprise.service";
import { lireSource, type DecisionSourceMap } from "@/config/decision-source";
import {
  presetFromProfile,
  quizModeFromProfile,
  type QuizMode,
  type AnswerFormat,
  answerFormatFromProfile,
} from "@/config/difficulty";
import { pseudoAffichable } from "@/config/invite";
import { champsOuverts, signesDeCadrage, signesDeSituation } from "@/config/duree-du-tour";
import { emblemeParCode } from "@/config/emblemes";
import { validerNomEquipe } from "@/config/nom-equipe";
import { PERSONALITY_LABELS, botPersonalityFromSeed } from "@/engine/bots";
import {
  missedSituationPolicyFromProfile,
  type MissedSituationPolicy,
} from "@/config/missed-situation";
import {
  findUserTeam,
  readPendingEvents,
} from "@/services/round-resolution.service";
import {
  demandesDeLaPartie,
  type DemandeAInstruire,
} from "@/services/subvention.service";
import { teamDisplayName } from "@/services/game-view.service";
import { entitlementsForOrg } from "@/services/entitlements.service";

// Re-exports depuis game-creation.service.ts pour compatibilité des consommateurs existants
export {
  createGameCore,
  createSoloGame,
  createClassGame,
  reinitialiserPartie,
  supprimerPartie,
  getOrCreateNovaScenarioIdPublic,
  type CreatedGame,
  type CreateGameArgs,
} from "@/services/game-creation.service";
export type { GameKind } from "@/services/game-creation.service";
import type { GameKind } from "@/services/game-creation.service";

// Re-exports depuis round-resolution.service.ts pour compatibilité des consommateurs existants
export {
  closeCurrentRound,
  distribuerUnCourrier,
  resolveCurrentRound,
  submitTeamDecisions,
  type CourrierAnnonce,
} from "@/services/round-resolution.service";

// Re-exports depuis game-view.service.ts pour compatibilité des consommateurs existants
export { getGameView, teamDisplayName } from "@/services/game-view.service";
export type { GameView, StudyReports } from "@/services/game-view.service";

/** Rejoindre une partie de classe par code : affectation à l'équipe la moins remplie. */
/**
 * POURQUOI CE CODE NE PERMET PAS D'ENTRER, s'il y a une raison.
 *
 * `joinGameByCode` répond déjà, mais il exige un `userId` — et l'action créait
 * donc un utilisateur invité AVANT de savoir si le code existe. Un code faux
 * laissait une ligne dans `users` ; une boucle en laissait autant qu'elle
 * faisait de requêtes. Le refus se prononce maintenant d'abord, sur une simple
 * lecture, et rien n'est créé tant que la partie n'est pas trouvée.
 *
 * Rend le message de refus, ou `null` si le code ouvre bien une partie.
 * `joinGameByCode` refait le contrôle : deux appels séparés, l'état peut
 * changer entre les deux, et c'est lui qui fait autorité.
 */
export async function refusDeRejoindre(code: string): Promise<string | null> {
  const game = (
    await db.select().from(games).where(eq(games.joinCode, code.trim().toUpperCase()))
  )[0];
  if (!game) return "Code de partie inconnu.";
  if (estArchivee(game)) return PARTIE_ARCHIVEE;
  if (game.status === "finished") return "Cette partie est terminée.";
  return null;
}

/**
 * LES ÉQUIPES DANS UN ORDRE QUI NE BOUGE PAS.
 *
 * Le QR d'une table doit désigner LA MÊME équipe toute la séance. L'ordre
 * d'affichage ne peut pas servir à cela : il est alphabétique, et les élèves
 * renomment leur équipe au premier tour — une étiquette imprimée le matin
 * aurait désigné la voisine l'après-midi. Le nom ne peut pas servir non plus,
 * pour la même raison.
 *
 * Reste l'ordre de création, que rien ne change : ni le renommage, ni la
 * remise à zéro, qui réutilise les mêmes lignes. Le rang qui en sort n'est pas
 * montré à l'enseignant — l'étiquette porte le NOM de l'équipe —, c'est une
 * poignée, et elle tient.
 *
 * Les équipes pilotées par un bot n'en reçoivent pas : personne ne s'assoit à
 * leur table.
 */
export interface EquipeNumerotee {
  /** Le rang dans l'ordre de création, à partir de 1. */
  rang: number;
  teamId: string;
  nom: string;
}

export async function equipesNumerotees(gameId: string): Promise<EquipeNumerotee[]> {
  const rows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  return rows
    .filter((t) => t.controller === "human")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
    .map((t, i) => ({ rang: i + 1, teamId: t.id, nom: t.name }));
}

/**
 * CE QUE LE CARTON VA RÉELLEMENT FAIRE, pour le dire à l'élève avant qu'il
 * entre son prénom.
 *
 * L'écran annonçait d'abord le nom de l'équipe désignée, sans plus. Vérifié
 * dans un navigateur sur une partie au quatrième tour, cela donnait « Vous
 * rejoignez l'équipe Équipe 2 » à un élève qui restait dans son Équipe 3 : le
 * carton ne déplace plus personne une fois le premier tour clos. L'écran
 * mentait, et le service avait raison.
 *
 * Cette fonction répond donc pour CET appareil, en suivant exactement les
 * règles de l'entrée : rien si le carton ne désigne rien ici, sinon le nom de
 * l'équipe, celui de l'équipe déjà occupée s'il y en a une, et si le carton a
 * encore le pouvoir de déplacer.
 */
export interface PromesseDuCarton {
  /** L'équipe que désigne le carton. */
  equipe: string;
  /** L'équipe où l'appareil se trouve déjà dans cette partie, s'il y en a une. */
  sienne: string | null;
  /** Le carton mènera-t-il vraiment à `equipe` ? */
  deplacera: boolean;
}

export async function promesseDuCarton(args: {
  code: string;
  rang: number;
  userId: string | null;
}): Promise<PromesseDuCarton | null> {
  const game = (
    await db.select().from(games).where(eq(games.joinCode, args.code.trim().toUpperCase()))
  )[0];
  // En concours, l'équipe vient de l'inscription et le carton n'y peut rien.
  if (!game || game.mode === "competition") return null;
  const equipes = await equipesNumerotees(game.id);
  const visee = equipes.find((e) => e.rang === args.rang);
  if (!visee) return null;
  if (!args.userId) return { equipe: visee.nom, sienne: null, deplacera: true };

  const siennes = await db
    .select({ teamId: players.teamId })
    .from(players)
    .where(
      and(
        inArray(players.teamId, equipes.map((e) => e.teamId)),
        eq(players.userId, args.userId),
      ),
    );
  const sienne = equipes.find((e) => e.teamId === siennes[0]?.teamId) ?? null;
  if (!sienne) return { equipe: visee.nom, sienne: null, deplacera: true };
  return {
    equipe: visee.nom,
    sienne: sienne.nom,
    deplacera: sienne.teamId === visee.teamId || peutChoisirSonEquipe(game),
  };
}

export async function joinGameByCode(args: {
  code: string;
  userId: string;
  pseudo?: string;
  /** Le rang d'équipe porté par un QR de table, s'il y en avait un. */
  equipe?: number | null;
}): Promise<{ gameId: string } | { error: string }> {
  const game = (
    await db.select().from(games).where(eq(games.joinCode, args.code.trim().toUpperCase()))
  )[0];
  if (!game) return { error: "Code de partie inconnu." };
  if (estArchivee(game)) return { error: PARTIE_ARCHIVEE };
  if (game.status === "finished") return { error: "Cette partie est terminée." };

  const teamRows = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, game.id), eq(teams.controller, "human")));
  if (teamRows.length === 0) return { error: "Aucune équipe à rejoindre." };

  const memberships = await db
    .select()
    .from(players)
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));

  // Le pseudo s'enregistre AVANT le retour anticipé du joueur déjà inscrit.
  // Il ne s'écrivait qu'à la première adhésion : l'élève qui revenait et
  // corrigeait son prénom — champ obligatoire du formulaire, qu'il remplit
  // donc à chaque fois — voyait sa saisie disparaître en silence, et
  // l'enseignant gardait à l'écran le nom de la première fois.
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  // L'ÉQUIPE DEMANDÉE PAR LE CARTON DE TABLE, si elle existe dans CETTE
  // partie. Un rang qui ne désigne rien — carton d'une autre partie, adresse
  // tapée de travers — ne provoque rien : on retombe sur l'affectation
  // automatique, comportement d'avant le QR.
  //
  // JAMAIS EN CONCOURS. Là, l'équipe vient de l'inscription et elle se
  // qualifie d'un bloc : un carton qui la choisirait laisserait l'inscription
  // et la partie se contredire, exactement ce que `choisirSonEquipe` refuse
  // déjà à l'élève.
  const demandee =
    args.equipe && game.mode !== "competition"
      ? (await equipesNumerotees(game.id)).find((e) => e.rang === args.equipe)?.teamId
      : undefined;

  const dejaLa = memberships.find((m) => m.userId === args.userId);
  if (dejaLa) {
    // LE CARTON DÉPLACE ENCORE, AU PREMIER TOUR SEULEMENT.
    //
    // L'élève qui a d'abord scanné le QR de la partie a été réparti d'office,
    // puis s'est assis à une table : scanner le carton doit le rejoindre. Sans
    // cela l'ordre des deux scans décidait de son équipe, sans que rien ne le
    // dise.
    //
    // La permission n'est pas une nouvelle règle : c'est EXACTEMENT celle du
    // geste « rejoindre mes camarades » que l'élève a déjà dans l'arène —
    // partie de classe en cours, premier tour, hors concours. Passé ce tour,
    // les décisions et les résultats appartiennent à l'équipe, et un scan ne
    // déménage plus personne : le carton est alors sans effet, l'élève entre
    // comme avant, et c'est l'enseignant qui rattache.
    if (demandee && demandee !== dejaLa.teamId && peutChoisirSonEquipe(game)) {
      await choisirSonEquipe({ gameId: game.id, userId: args.userId, teamId: demandee });
    }
    // Le code de reprise aussi à ce passage-ci : les élèves entrés avant que
    // le code existe n'en ont pas, et c'est leur prochaine entrée qui le leur
    // donne, sans qu'ils aient rien à demander.
    await attribuerCodeDeReprise(game.id, args.userId);
    return { gameId: game.id };
  }

  // LA TABLE D'ABORD, LE REMPLISSAGE ENSUITE. Quand l'élève a scanné le carton
  // d'une table, il a choisi son équipe en s'asseyant : on ne la lui reprend
  // pas pour équilibrer les effectifs.
  const counts = new Map(teamRows.map((t) => [t.id, 0]));
  for (const m of memberships) counts.set(m.teamId, (counts.get(m.teamId) ?? 0) + 1);
  const target =
    demandee ?? [...counts.entries()].sort((a, b) => a[1] - b[1])[0]![0];

  await db.insert(players).values({ teamId: target, userId: args.userId, role: "member" });
  // SON CODE DÈS SON ENTRÉE. Le donner plus tard, à sa demande, laisserait
  // sans filet celui qui n'a jamais ouvert le tiroir — c'est-à-dire justement
  // celui qui perdra son appareil sans s'y être préparé. La liste de
  // l'enseignant est alors complète, et c'est elle le vrai recours.
  await attribuerCodeDeReprise(game.id, args.userId);
  return { gameId: game.id };
}

/**
 * L'équipe se donne un nom, tant que le premier tour n'est pas clos.
 *
 * Après, le nom se fige : un classement qui change d'intitulé en cours de
 * partie devient illisible, pour la classe comme pour le relevé de notes.
 *
 * En partie solo, jamais : le joueur reprend une entreprise qui existe déjà,
 * avec son nom et son secteur.
 */
export async function nommerEquipe(args: {
  gameId: string;
  userId: string;
  nom: string;
  /**
   * L'emblème choisi dans le catalogue, ou null pour n'en porter aucun. Il suit
   * la même fenêtre que le nom : le premier tour, et il se fige avec lui — un
   * classement dont les signes changent en cours de partie ne se lit pas mieux
   * qu'un classement dont les noms changent.
   */
  embleme?: string | null;
}): Promise<{ nom: string; embleme: string | null }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  // En solo, l'entreprise est celle du scénario : elle a son nom, son secteur
  // et son histoire, et c'est la mise en situation elle-même.
  if (((game.difficultyProfile as { kind?: GameKind } | null)?.kind ?? "solo") === "solo") {
    throw new Error("En solo, l'entreprise garde le nom du scénario.");
  }
  if (game.currentRound > 1) {
    throw new Error("Le nom se fige après le premier tour : celui-ci est déjà clos.");
  }
  // EN CONCOURS, LE NOM N'APPARTIENT PAS À L'ÉQUIPE MAIS AU TOURNOI.
  //
  // Le nom de l'équipe est celui de son inscription, et c'est LUI qui relie la
  // partie au concours : le classement d'une phase porte `teams.name`, et
  // qualifier compare ce nom au libellé de l'inscription. Un élève qui
  // renommait son équipe au premier tour la rendait donc introuvable au moment
  // de qualifier — éliminée alors qu'elle avait gagné —, et la phase suivante
  // se créait sans un seul joueur.
  if (game.mode === "competition") {
    throw new Error(
      "En concours, l'équipe garde le nom de son inscription : il la suit jusqu'au podium.",
    );
  }
  const { team, allTeams } = await findUserTeam(args.gameId, args.userId);
  if (!team) throw new Error("Vous n'êtes pas membre de cette partie");

  const valide = validerNomEquipe(args.nom);
  if ("erreur" in valide) throw new Error(valide.erreur);

  const prise = allTeams.some(
    (t) =>
      t.id !== team.id &&
      t.name.localeCompare(valide.nom, "fr", { sensitivity: "base" }) === 0,
  );
  if (prise) throw new Error("Une autre équipe porte déjà ce nom.");

  // Un code inconnu ne s'enregistre pas : la base ne connaît que du texte, et
  // c'est ici que le catalogue fait foi.
  const embleme =
    args.embleme === undefined ? team.embleme : (emblemeParCode(args.embleme)?.code ?? null);

  await db.update(teams).set({ name: valide.nom, embleme }).where(eq(teams.id, team.id));
  return { nom: valide.nom, embleme };
}

/** Genre d'une partie (solo / classe). */
export async function getGameKind(gameId: string): Promise<GameKind> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return ((game.difficultyProfile as { kind?: GameKind }).kind ?? "solo") as GameKind;
}

/** Le vocabulaire du secteur joué : c'est lui qui nomme prix et volume. */
export async function getGameVocabulary(gameId: string): Promise<ScenarioVocabulary> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return (
    await resolveScenarioDefinition((game.scenarioSnapshot as { code?: string } | null)?.code)
  ).vocabulary;
}

// ---------------------------------------------------------------------------
// Lecture : vues enseignant (§27)
// ---------------------------------------------------------------------------

export interface TeacherGameSummary {
  gameId: string;
  joinCode: string | null;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  teamsCount: number;
  /** Le nom donné par l'enseignant, s'il en a donné un. */
  label: string | null;
  /** Combien d'élèves sont entrés : une partie vide se reconnaît de loin. */
  elevesCount: number;
  /**
   * Toutes les équipes humaines ont rendu leurs décisions du tour courant.
   *
   * C'est la seule chose qui appelle un geste de l'enseignant, et elle ne se
   * lisait qu'en ouvrant la partie. Fausse quand la partie est finie : il n'y
   * a plus rien à clore.
   */
  aClore: boolean;
  createdAt: Date;
  /** Rangée le… — absente tant que la partie est à sa place dans la liste. */
  archivedAt: Date | null;
  /** Le secteur joué, pour que la liste des parties ait un visage. */
  scenarioCode: string;
  scenarioTitle: string;
  /** Le nom court (« NOVA · gamme ») : sur téléphone, le titre entier ne tient pas. */
  scenarioShortName: string;
  sector: Sector;
}

/** La longueur d'un nom de partie : une ligne de liste, pas une phrase. */
export const NOM_PARTIE_MAX = 60;

/**
 * NOMMER SA PARTIE, POUR LA RETROUVER.
 *
 * La liste affichait six fois « NOVA » : le nom de la classe est la seule
 * chose qui distingue deux parties du même scénario. Il est facultatif, se
 * change à tout moment, et s'efface en validant un champ vide — une partie
 * sans nom reprend celui de son scénario.
 *
 * Personne d'autre ne le voit : ni les élèves, ni le classement, ni le relevé.
 * C'est une étiquette sur un dossier, pas un titre.
 */
export async function nommerLaPartie(args: {
  gameId: string;
  teacherId: string;
  nom: string;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  const propre = args.nom.trim().slice(0, NOM_PARTIE_MAX);
  await db
    .update(games)
    .set({ label: propre.length > 0 ? propre : null })
    .where(eq(games.id, args.gameId));
}

export async function getTeacherGames(
  teacherId: string,
  /** Par défaut la liste ne montre que les parties à leur place. */
  inclureArchivees = false,
): Promise<TeacherGameSummary[]> {
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.createdBy, teacherId))
    .orderBy(desc(games.createdAt));
  const classGames = rows.filter(
    (g) =>
      (g.difficultyProfile as { kind?: string }).kind === "class" &&
      (inclureArchivees || g.archivedAt === null),
  );
  if (classGames.length === 0) return [];
  const gameIds = classGames.map((g) => g.id);
  const allTeams = await db
    .select({ gameId: teams.gameId, teamId: teams.id })
    .from(teams)
    .where(and(inArray(teams.gameId, gameIds), eq(teams.controller, "human")));
  const countByGame = new Map<string, number>();
  for (const t of allTeams) countByGame.set(t.gameId, (countByGame.get(t.gameId) ?? 0) + 1);

  // COMBIEN D'ÉLÈVES, ET QUI A RENDU. Trois requêtes groupées pour toute la
  // liste, et non trois par partie : la page en affiche autant qu'il y a de
  // classes dans l'année.
  const teamIds = allTeams.map((t) => t.teamId);
  const partieDeLEquipe = new Map(allTeams.map((t) => [t.teamId, t.gameId]));
  const inscrits =
    teamIds.length > 0
      ? await db
          .select({ teamId: players.teamId })
          .from(players)
          .where(inArray(players.teamId, teamIds))
      : [];
  const elevesParPartie = new Map<string, number>();
  for (const p of inscrits) {
    const g = partieDeLEquipe.get(p.teamId);
    if (g) elevesParPartie.set(g, (elevesParPartie.get(g) ?? 0) + 1);
  }

  const toursCourants = await db
    .select({ id: rounds.id, gameId: rounds.gameId, index: rounds.index })
    .from(rounds)
    .where(inArray(rounds.gameId, gameIds));
  const tourCourantDe = new Map<string, string>();
  for (const g of classGames) {
    const r = toursCourants.find((t) => t.gameId === g.id && t.index === g.currentRound);
    if (r) tourCourantDe.set(g.id, r.id);
  }
  const roundIds = [...tourCourantDe.values()];
  const rendues =
    roundIds.length > 0
      ? await db
          .select({ roundId: decisions.roundId, teamId: decisions.teamId })
          .from(decisions)
          .where(
            and(
              inArray(decisions.roundId, roundIds),
              inArray(decisions.status, ["validated", "locked"]),
            ),
          )
      : [];
  const renduesParPartie = new Map<string, number>();
  for (const d of rendues) {
    const g = partieDeLEquipe.get(d.teamId);
    if (g) renduesParPartie.set(g, (renduesParPartie.get(g) ?? 0) + 1);
  }
  return Promise.all(
    classGames.map(async (g) => {
      const def = await resolveScenarioDefinition(
        (g.scenarioSnapshot as { code?: string } | null)?.code,
      );
      return {
        gameId: g.id,
        joinCode: g.joinCode,
        status: g.status,
        currentRound: g.currentRound,
        roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
        roundDays: (g.scenarioSnapshot as { roundDays: number }).roundDays,
        teamsCount: countByGame.get(g.id) ?? 0,
        label: g.label,
        elevesCount: elevesParPartie.get(g.id) ?? 0,
        aClore:
          g.status === "running" &&
          (countByGame.get(g.id) ?? 0) > 0 &&
          (renduesParPartie.get(g.id) ?? 0) >= (countByGame.get(g.id) ?? 0),
        createdAt: g.createdAt,
        archivedAt: g.archivedAt,
        scenarioCode: def.code,
        scenarioTitle: def.title,
        scenarioShortName: def.shortName,
        sector: def.sector,
      };
    }),
  );
}

/**
 * Règle les questions posées dans les situations d'une partie en cours. Le
 * réglage vit dans le profil de difficulté (jsonb) : aucune migration, et les
 * situations DÉJÀ débriefées gardent le score obtenu sous l'ancien réglage.
 */
export async function setQuizMode(args: {
  gameId: string;
  teacherId: string;
  mode: QuizMode;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  const profile = (game.difficultyProfile as Record<string, unknown> | null) ?? {};
  await db
    .update(games)
    .set({ difficultyProfile: { ...profile, quizMode: args.mode } })
    .where(eq(games.id, args.gameId));
}

/**
 * Règle le format des réponses (QCM ou questions ouvertes). Même place que le mode des
 * questions : le profil de difficulté (jsonb), sans migration. Les situations déjà
 * rendues gardent ce qu'elles ont rendu ; les suivantes se répondent dans le nouveau format.
 */
export async function setAnswerFormat(args: {
  gameId: string;
  teacherId: string;
  format: AnswerFormat;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  const profile = (game.difficultyProfile as Record<string, unknown> | null) ?? {};
  await db
    .update(games)
    .set({ difficultyProfile: { ...profile, answerFormat: args.format } })
    .where(eq(games.id, args.gameId));
}

/**
 * RANGER UNE PARTIE, ET LA RESSORTIR.
 *
 * En fin d'année, la liste d'un enseignant porte toutes les parties de
 * l'année, dont beaucoup jamais closes : on ne clôt pas la dernière séance de
 * juin, on part en vacances. Archiver les sort de la liste, empêche d'y entrer
 * et d'y jouer, et ne détruit rien.
 *
 * UNE PARTIE EN COURS S'ARCHIVE AUSSI, délibérément : c'est précisément le cas
 * du ménage de fin d'année. Le risque est tenu par la réversibilité — le geste
 * se défait, et la partie retrouve exactement l'état qu'elle avait, puisque
 * son statut n'a pas bougé.
 */
export async function archiverPartie(args: {
  gameId: string;
  teacherId: string;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  if (game.archivedAt) return;
  await db.update(games).set({ archivedAt: new Date() }).where(eq(games.id, args.gameId));
}

/** Ressort une partie rangée. Elle retrouve l'état exact qu'elle avait. */
export async function desarchiverPartie(args: {
  gameId: string;
  teacherId: string;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  await db.update(games).set({ archivedAt: null }).where(eq(games.id, args.gameId));
}

/**
 * Lève le rideau sur le classement d'un tour résolu — ou le referme.
 *
 * En classe et en concours, c'est l'animateur qui révèle : sans cela, la classe
 * lisait le classement sur son téléphone avant même qu'il ne le projette. Tour
 * par tour, pour que chaque clôture redevienne un moment.
 *
 * On ne révèle qu'un tour RÉSOLU : un tour en cours n'a pas de classement, et
 * l'ouvrir d'avance ne montrerait que celui du tour précédent, sous un mauvais
 * numéro.
 */
export async function setRankingRevealed(args: {
  gameId: string;
  teacherId: string;
  roundIndex: number;
  revealed: boolean;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  const round = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, args.roundIndex)))
  )[0];
  if (!round) throw new Error("Tour introuvable");
  if (round.status !== "resolved") {
    throw new Error("Le classement d'un tour qui n'est pas clos n'existe pas encore.");
  }
  await db
    .update(rounds)
    .set({ rankingRevealedAt: args.revealed ? new Date() : null })
    .where(eq(rounds.id, round.id));
}

/**
 * Fenêtre globale de jeu (planning) : la partie n'est jouable qu'entre ces deux
 * instants. Chacun peut être null (pas de borne). L'ouverture doit précéder la
 * fermeture. Le verrou par tour et l'étape de concours s'appliquent en plus.
 */
export async function setGameSchedule(args: {
  gameId: string;
  teacherId: string;
  opensAt: Date | null;
  closesAt: Date | null;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  if (args.opensAt && args.closesAt && args.opensAt.getTime() > args.closesAt.getTime()) {
    throw new Error("L'ouverture doit précéder la fermeture.");
  }
  await db
    .update(games)
    .set({ opensAt: args.opensAt, closesAt: args.closesAt })
    .where(eq(games.id, args.gameId));
}

/**
 * Fenêtres par tour (planning fin) : chaque tour n'est jouable qu'entre son
 * ouverture et son échéance. Chaque borne peut être null. Le verrou par tour se
 * combine à la fenêtre globale de la partie et à celle de l'étape de concours :
 * l'élève joue pendant l'intersection des fenêtres posées.
 *
 * On n'écrit que les tours cités (par leur index 1..N) et on ignore un index
 * inconnu : la mise à jour est ciblée, un tour absent reste inchangé.
 */
export async function setRoundWindows(args: {
  gameId: string;
  teacherId: string;
  windows: { index: number; opensAt: Date | null; deadline: Date | null }[];
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  for (const w of args.windows) {
    if (w.opensAt && w.deadline && w.opensAt.getTime() > w.deadline.getTime()) {
      throw new Error(`Tour ${w.index} : l'ouverture doit précéder l'échéance.`);
    }
  }
  for (const w of args.windows) {
    await db
      .update(rounds)
      .set({ opensAt: w.opensAt, deadline: w.deadline })
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, w.index)));
  }
}

export interface TeacherGameView {
  gameId: string;
  joinCode: string | null;
  /** Le nom donné par l'enseignant à cette partie, s'il en a donné un. */
  label: string | null;
  status: string;
  mode: "learning" | "competition" | "contest";
  /** Cartes annoncées pour le prochain tour (teamId null = toute la classe). */
  pendingEvents: { code: string; teamId: string | null; teamName: string | null }[];
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  /** Fenêtre globale de jeu (planning), en ISO ou null. */
  opensAt: string | null;
  closesAt: string | null;
  /** Fenêtre de chaque tour (planning fin), triée par index. Dates en ISO ou null. */
  rounds: {
    index: number;
    status: string;
    opensAt: string | null;
    deadline: string | null;
    /** Le classement de ce tour a-t-il été révélé aux élèves ? */
    rankingRevealed: boolean;
  }[];
  /** Freemium : la partie s'est arrêtée avant la fin du scénario, faute de licence. */
  planCapped: boolean;
  /** Freemium : l'export du relevé est-il ouvert (licence) ? Sinon on propose l'upsell. */
  canExportGradebook: boolean;
  /** Secteur joué : titre du scénario et codes d'événements de SA liasse. */
  scenarioCode: string;
  scenarioTitle: string;
  sector: Sector;
  scenarioEventCodes: string[];
  /** Questions posées dans les situations de cette partie. */
  quizMode: QuizMode;
  /** Comment on y répond : en cochant, ou en écrivant. */
  answerFormat: AnswerFormat;
  /** Politique des situations manquées (consultation seule / rattrapage 50 %). */
  missedPolicy: MissedSituationPolicy;
  /**
   * Réglages figés à la création, que l'enseignant ne peut plus consulter
   * ailleurs : le niveau n'était lisible que côté élève, et la case du monde
   * variable nulle part.
   */
  difficulty: { level: number; name: string; hintMaxLevel: number };
  variableWorld: boolean;
  /**
   * De quoi estimer le temps qu'un tour demande aux élèves, avant la première
   * séance : le volume de texte à lire, les champs que le niveau ouvre, et si
   * les questions de connaissances sont posées. Le modèle vit dans
   * `config/duree-du-tour` ; ici on ne fournit que les faits.
   */
  chargeDuTour: {
    signesDeCadrage: number;
    signesDeSituation: number;
    champs: number;
    avecQuiz: boolean;
  };
  teams: {
    teamId: string;
    name: string;
    controller: "human" | "bot";
    /** Personnalité du bot (réservée à l'enseignant) ; null pour une équipe humaine. */
    botPersonality: string | null;
    playerNames: string[];
    hasSubmitted: boolean;
    /** Source des pivots (prix, volume) des décisions validées ce tour ; null sans validation. */
    decisionSource: DecisionSourceMap | null;
    /** La justification écrite par l'équipe pour ce tour ; null si vide ou non validée. */
    justification: string | null;
    /**
     * Qui, dans l'équipe, a validé ce tour et à quelle heure. La table le
     * notait déjà à chaque envoi, sans que ces colonnes soient relues : le
     * tableau affichait « ✓ validées » sans dire par qui, et l'enseignant qui
     * voit un élève inactif ne pouvait pas savoir si son équipe avait envoyé
     * sans lui. Null pour un bot ou tant que rien n'est validé.
     */
    validation: { nom: string | null; quand: string } | null;
    lastNetIncome: number | null;
    lastNetTreasury: number | null;
  }[];
  ranking: {
    name: string;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
    /** Entreprise en cessation de paiements caractérisée (V2 couche 2, #5). */
    defaillant: boolean;
  }[];
  /**
   * LES DEMANDES DE SUBVENTION EXCEPTIONNELLE, à instruire ou déjà tranchées.
   *
   * Une équipe au pied du mur — plus d'emprunt possible, plus d'apport — n'a
   * plus qu'un geste : déposer un dossier. C'est ici qu'il arrive, et nulle
   * part ailleurs : l'animateur est le seul à pouvoir l'accorder.
   */
  aidRequests: (DemandeAInstruire & { teamName: string })[];
}

export async function getTeacherGameView(
  gameId: string,
  teacherId: string,
): Promise<TeacherGameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);

  const memberships = await db
    .select({ teamId: players.teamId, userId: players.userId, name: users.displayName })
    .from(players)
    .innerJoin(users, eq(users.id, players.userId))
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));

  const submitted = currentRoundRow
    ? await db.select().from(decisions).where(eq(decisions.roundId, currentRoundRow.id))
    : [];

  const lastResolved = gameRounds
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];
  const lastResults = lastResolved
    ? await db.select().from(roundResults).where(eq(roundResults.roundId, lastResolved.id))
    : [];

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const demandes = await demandesDeLaPartie(gameId);
  const snapshotDefinition = await resolveScenarioDefinition(
    (game.scenarioSnapshot as { code?: string } | null)?.code,
  );

  // Ce que ce tour demande à l'élève, en faits bruts : le modèle de durée en
  // tire des minutes. Le scénario est déjà résolu ici (intégré ou enseignant),
  // et le niveau dit quels leviers sont ouverts.
  const presetDuJeu = presetFromProfile(game.difficultyProfile);
  const chargeDuTour = {
    signesDeCadrage: signesDeCadrage(snapshotDefinition),
    signesDeSituation: signesDeSituation(snapshotDefinition.situations, game.currentRound),
    champs: champsOuverts(presetDuJeu.decisions),
    avecQuiz: quizModeFromProfile(game.difficultyProfile) !== "off",
  };

  return {
    gameId,
    joinCode: game.joinCode,
    label: game.label,
    status: game.status,
    mode: game.mode,
    pendingEvents: readPendingEvents(game.difficultyProfile).map((card) => ({
      code: card.code,
      teamId: card.teamId,
      teamName: card.teamId
        ? (teamRows.find((t) => t.id === card.teamId)?.name ?? null)
        : null,
    })),
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    opensAt: game.opensAt ? game.opensAt.toISOString() : null,
    closesAt: game.closesAt ? game.closesAt.toISOString() : null,
    planCapped: Boolean(
      (game.difficultyProfile as { planCapped?: boolean } | null)?.planCapped,
    ),
    canExportGradebook: (await entitlementsForOrg(game.organizationId)).gradebookExport,
    rounds: [...gameRounds]
      .sort((a, b) => a.index - b.index)
      .map((r) => ({
        index: r.index,
        status: r.status,
        opensAt: r.opensAt ? r.opensAt.toISOString() : null,
        deadline: r.deadline ? r.deadline.toISOString() : null,
        rankingRevealed: r.rankingRevealedAt != null,
      })),
    scenarioCode: snapshotDefinition.code,
    scenarioTitle: snapshotDefinition.title,
    sector: snapshotDefinition.sector,
    // La liasse vient du SNAPSHOT, pas de la version courante du scénario :
    // une partie lancée joue les règles avec lesquelles elle a commencé.
    scenarioEventCodes: (
      (game.scenarioSnapshot as { events?: { code: string }[] }).events ?? []
    ).map((e) => e.code),
    quizMode: quizModeFromProfile(game.difficultyProfile),
    answerFormat: answerFormatFromProfile(game.difficultyProfile),
    missedPolicy: missedSituationPolicyFromProfile(
      game.difficultyProfile,
      (game.difficultyProfile as { kind?: string } | null)?.kind,
    ),
    difficulty: (() => {
      const preset = presetFromProfile(game.difficultyProfile);
      return { level: preset.level, name: preset.name, hintMaxLevel: preset.hintMaxLevel };
    })(),
    variableWorld:
      (game.difficultyProfile as { variableWorld?: boolean } | null)?.variableWorld === true,
    chargeDuTour,
    teams: teamRows.map((t) => {
      const last = lastResults.find((r) => r.teamId === t.id);
      return {
        teamId: t.id,
        name: teamDisplayName(t.name),
        controller: t.controller,
        botPersonality:
          t.controller === "bot"
            ? PERSONALITY_LABELS[botPersonalityFromSeed(Number(game.seed), t.botProfile ?? "balanced")]
            : null,
        playerNames: memberships.filter((m) => m.teamId === t.id).map((m) => m.name),
        hasSubmitted:
          t.controller === "bot" ||
          submitted.some((d) => d.teamId === t.id && d.status === "validated"),
        decisionSource: lireSource(
          submitted.find((d) => d.teamId === t.id && d.status === "validated")?.decisionSource,
        ),
        justification:
          submitted.find((d) => d.teamId === t.id && d.status === "validated")?.justification ?? null,
        validation: (() => {
          if (t.controller === "bot") return null;
          const d = submitted.find((x) => x.teamId === t.id && x.status === "validated");
          if (!d?.validatedAt) return null;
          return {
            nom: pseudoAffichable(memberships.find((m) => m.userId === d.validatedBy)?.name),
            quand: d.validatedAt.toISOString(),
          };
        })(),
        lastNetIncome: last ? Number(last.netIncome) : null,
        lastNetTreasury: last ? Number(last.netTreasury) : null,
      };
    }),
    ranking: rankingRows
      .map((r) => ({
        name: teamDisplayName(teamRows.find((t) => t.id === r.teamId)?.name ?? "?"),
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
        defaillant: Boolean((r.detail as { defaillant?: boolean })?.defaillant),
      }))
      .sort((a, b) => a.rank - b.rank),
    // Le service des subventions ne connaît que des identifiants d'équipe : la
    // mise en forme des noms appartient à cette vue, et la lui emprunter de
    // là-bas ferait un cycle d'imports.
    aidRequests: demandes.map((d) => ({
      ...d,
      teamName: teamDisplayName(teamRows.find((t) => t.id === d.teamId)?.name ?? "?"),
    })),
  };
}
