import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { games, players, teams, users } from "@/db/schema";
import { teamDisplayName } from "@/config/nom-equipe";

/**
 * QUI JOUE DANS QUELLE ÉQUIPE.
 *
 * En rejoignant par code, un élève est affecté d'office à l'équipe la moins
 * remplie : c'est juste ce qu'il faut pour démarrer une séance sans rien
 * organiser, et c'est faux dès que la classe a ses propres groupes. Deux
 * pannes le rappellent en salle :
 *
 *   1. L'élève arrive avec ses camarades et se retrouve seul ailleurs.
 *   2. Il revient au tour 3 depuis un autre poste ou un autre navigateur. Son
 *      cookie d'invité a disparu, le serveur ne le reconnaît pas et le range
 *      dans une équipe quelconque — sans message, et sans retour possible.
 *
 * D'où deux gestes, et deux seulement :
 *
 *   L'ÉLÈVE choisit son équipe lui-même, tant que le premier tour n'est pas
 *   clos. Après, non : le relevé de notes suit l'appartenance COURANTE, donc
 *   un élève qui changerait d'équipe au dernier tour emporterait le résultat
 *   économique de sa nouvelle équipe. La fenêtre du premier tour est celle où
 *   ce résultat n'existe pas encore.
 *
 *   L'ENSEIGNANT affecte n'importe quel élève à n'importe quelle équipe, à
 *   tout moment, parce qu'il est le seul à savoir qui est qui — et parce que
 *   la panne 2 arrive en plein milieu de partie.
 *
 * On ne déplace jamais que des élèves DÉJÀ inscrits dans la partie : entrer
 * dans une partie reste l'affaire du code d'invitation.
 */

export interface MembreDEquipe {
  userId: string;
  nom: string;
}

export interface EquipeEtSesMembres {
  teamId: string;
  nom: string;
  membres: MembreDEquipe[];
}

/** Les équipes humaines d'une partie et qui s'y trouve, dans l'ordre des noms. */
export async function compositionDesEquipes(gameId: string): Promise<EquipeEtSesMembres[]> {
  const teamRows = (await db.select().from(teams).where(eq(teams.gameId, gameId)))
    .filter((t) => t.controller === "human")
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  if (teamRows.length === 0) return [];

  const memberships = await db
    .select({ teamId: players.teamId, userId: players.userId, nom: users.displayName })
    .from(players)
    .innerJoin(users, eq(users.id, players.userId))
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));

  return teamRows.map((t) => ({
    teamId: t.id,
    nom: teamDisplayName(t.name),
    membres: memberships
      .filter((m) => m.teamId === t.id)
      .map((m) => ({ userId: m.userId, nom: m.nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  }));
}

/**
 * Le déplacement lui-même, une fois les droits vérifiés.
 *
 * L'appartenance est une clé primaire (équipe, élève) : on retire l'ancienne
 * ligne et on en écrit une neuve, en conservant le rôle. Rien d'autre ne bouge
 * — les décisions, les résultats et les situations appartiennent à l'ÉQUIPE,
 * pas au joueur.
 */
async function deplacer(args: {
  gameId: string;
  eleveId: string;
  teamId: string;
}): Promise<{ nomDeLEquipe: string }> {
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, args.gameId));
  const cible = teamRows.find((t) => t.id === args.teamId);
  if (!cible) throw new Error("Cette équipe n'appartient pas à la partie.");
  if (cible.controller !== "human") {
    throw new Error("Cette équipe est pilotée par l'ordinateur : on n'y place pas d'élève.");
  }

  const humaines = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humaines), eq(players.userId, args.eleveId)))
  )[0];
  if (!membership) throw new Error("Cet élève n'a pas encore rejoint la partie.");

  const nomDeLEquipe = teamDisplayName(cible.name);
  if (membership.teamId === args.teamId) return { nomDeLEquipe };

  await db
    .delete(players)
    .where(and(eq(players.teamId, membership.teamId), eq(players.userId, args.eleveId)));
  await db
    .insert(players)
    .values({ teamId: args.teamId, userId: args.eleveId, role: membership.role });
  return { nomDeLEquipe };
}

/**
 * L'enseignant affecte un élève de sa partie à l'une de ses équipes.
 *
 * À tout moment tant que la partie n'est pas archivée, parce que c'est en
 * cours de séance qu'on s'aperçoit d'une erreur d'appartenance. Le relevé de
 * notes suit l'appartenance courante : déplacer un élève au tour 4 lui
 * attribue le résultat économique de sa nouvelle équipe pour toute la partie.
 * L'écran le dit ; le service n'en fait pas une interdiction, parce qu'une
 * appartenance fausse est un défaut plus grave qu'un résultat déplacé.
 */
export async function affecterEleve(args: {
  gameId: string;
  teacherId: string;
  eleveId: string;
  teamId: string;
}): Promise<{ nomDeLEquipe: string }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable.");
  if (game.createdBy !== args.teacherId) throw new Error("Cette partie n'est pas la vôtre.");
  if (game.status === "archived") throw new Error("Cette partie est archivée.");
  return deplacer({ gameId: args.gameId, eleveId: args.eleveId, teamId: args.teamId });
}

/**
 * L'élève peut encore choisir son équipe : partie de classe, premier tour.
 *
 * JAMAIS EN CONCOURS. Là, l'équipe vient de l'inscription et elle se qualifie
 * d'un bloc : proposer de la quitter, c'est proposer de passer chez l'adversaire
 * en pleine poule, et laisser l'inscription et la partie se contredire.
 */
export function peutChoisirSonEquipe(game: {
  status: string;
  currentRound: number;
  mode?: string | null;
}): boolean {
  return game.status === "running" && game.currentRound === 1 && game.mode !== "competition";
}

/**
 * L'élève rejoint l'équipe de ses camarades, au premier tour.
 *
 * Passé ce tour, le refus est explicite et nomme le recours : l'enseignant.
 * Un message qui dit seulement « impossible » laisserait l'élève bloqué dans
 * l'équipe où le hasard l'a mis.
 */
export async function choisirSonEquipe(args: {
  gameId: string;
  userId: string;
  teamId: string;
}): Promise<{ nomDeLEquipe: string }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable.");
  if (game.mode === "competition") {
    throw new Error("En concours, votre équipe est celle de votre inscription.");
  }
  if (!peutChoisirSonEquipe(game)) {
    throw new Error(
      "Le premier tour est clos : demandez à votre enseignant de vous rattacher à votre équipe.",
    );
  }
  return deplacer({ gameId: args.gameId, eleveId: args.userId, teamId: args.teamId });
}
