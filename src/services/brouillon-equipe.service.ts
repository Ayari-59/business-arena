import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { decisions, games, rounds, users } from "@/db/schema";
import {
  INTERVALLE_MINIMAL_MS,
  formulaireDuBrouillon,
  saisieDuBrouillon,
  type BrouillonServi,
  type EtatDuBrouillon,
  type SaisieDuBrouillon,
} from "@/config/brouillon-d-equipe";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { pseudoAffichable } from "@/config/invite";
import type { RoundDecisions } from "@/engine/types";
import { estArchivee, PARTIE_ARCHIVEE } from "@/services/archivage";
import { assertPlayable } from "@/services/play-lock";
import { findUserTeam } from "@/services/round-resolution.service";

/**
 * LE BROUILLON D'ÉQUIPE, CÔTÉ SERVEUR (`config/brouillon-d-equipe.ts`).
 *
 * Il vit dans la ligne `decisions` de l'équipe pour le tour en cours, au statut
 * `draft` : une seule ligne par équipe et par tour (l'index unique de la
 * table), le dernier enregistrement gagne.
 *
 * Les gardes sont celles de la validation (`submitTeamDecisions`) : membre
 * d'une équipe humaine de la partie, partie en cours et non archivée, tour
 * ouvert, fenêtre du planning et lancement du tour (`assertPlayable`). En plus :
 *  - une partie de classe seulement : en solo, il n'y a pas d'équipe à qui
 *    montrer le brouillon, et le brouillon local suffit ;
 *  - JAMAIS par-dessus une décision validée : l'écriture ne touche qu'une ligne
 *    encore `draft` (clause de l'upsert, donc sans course possible) ;
 *  - un même élève, une fois par seconde au plus (`INTERVALLE_MINIMAL_MS`).
 *
 * LECTURE : la saisie ne se lit que par un membre de l'équipe. L'enseignant
 * propriétaire de la partie la voit au pilotage, par la vue qui vérifie déjà
 * que la partie est la sienne (`getTeacherGameView`). Ni une autre équipe ni le
 * mur projeté n'y ont accès (`tests/architecture/brouillon-d-equipe.test.ts`).
 */

export const BROUILLON_APRES_VALIDATION =
  "Les décisions de l'équipe sont déjà validées : un nouvel envoi les remplace.";
export const BROUILLON_EN_SOLO = "Le brouillon d'équipe ne sert qu'en partie de classe.";
export const BROUILLON_TROP_RAPPROCHE = "Enregistrements trop rapprochés : réessayez dans un instant.";

type GameKind = "solo" | "class";
const kindDe = (profil: unknown): GameKind =>
  ((profil as { kind?: GameKind } | null)?.kind ?? "solo") as GameKind;

/** La partie, l'équipe de l'élève et le tour courant ; refuse comme la validation. */
async function contexte(gameId: string, userId: string) {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (estArchivee(game)) throw new Error(PARTIE_ARCHIVEE);
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  if (kindDe(game.difficultyProfile) !== "class") throw new Error(BROUILLON_EN_SOLO);
  const { team } = await findUserTeam(gameId, userId);
  if (!team) throw new Error("Vous n'êtes pas membre de cette partie");
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, game.currentRound)))
  )[0];
  return { game, team, roundRow };
}

/** Le prénom d'un élève, tel que l'écran le montre. */
async function prenom(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [u] = await db.select({ nom: users.displayName }).from(users).where(eq(users.id, userId));
  return pseudoAffichable(u?.nom);
}

/**
 * Les décisions que porte la saisie, pour le pilotage : la lecture de la
 * validation (`decisionsSaisies`), sans le schéma qui borne, puisqu'un
 * brouillon peut être incomplet. Le moteur ne les lit jamais.
 */
function decisionsDuBrouillon(saisie: SaisieDuBrouillon): RoundDecisions {
  return decisionsSaisies(formulaireDuBrouillon(saisie)).decisions;
}

/**
 * ENREGISTRER LE BROUILLON DE L'ÉQUIPE pour le tour en cours. Rend son état
 * (l'heure, qui sert de version, et le prénom de l'auteur).
 */
export async function enregistrerLeBrouillon(args: {
  gameId: string;
  userId: string;
  saisie: unknown;
  now?: Date;
}): Promise<EtatDuBrouillon> {
  const lue = saisieDuBrouillon(args.saisie);
  if ("refus" in lue) throw new Error(lue.refus);
  const { game, team, roundRow } = await contexte(args.gameId, args.userId);
  if (!roundRow || roundRow.status !== "open") throw new Error("Ce tour n'est pas ouvert");
  // LE PLANNING ET LE LANCEMENT, comme la validation : hors fenêtre, ou tant
  // que le tour attend son professeur, rien ne s'enregistre.
  await assertPlayable(game, roundRow);

  const quand = args.now ?? new Date();
  const seuil = new Date(quand.getTime() - INTERVALLE_MINIMAL_MS);
  const ecrit = await db
    .insert(decisions)
    .values({
      roundId: roundRow.id,
      teamId: team.id,
      payload: decisionsDuBrouillon(lue.saisie),
      status: "draft",
      saisie: lue.saisie,
      modifiePar: args.userId,
      modifieLe: quand,
    })
    .onConflictDoUpdate({
      target: [decisions.roundId, decisions.teamId],
      set: {
        payload: decisionsDuBrouillon(lue.saisie),
        saisie: lue.saisie,
        modifiePar: args.userId,
        modifieLe: quand,
        updatedAt: quand,
      },
      // Une ligne validée (ou close) ne se réécrit jamais en brouillon ; un même
      // élève n'enregistre pas deux fois dans la même seconde.
      setWhere: sql`${decisions.status} = 'draft' and (${decisions.modifiePar} is distinct from ${args.userId} or ${decisions.modifieLe} is null or ${decisions.modifieLe} <= ${seuil.toISOString()})`,
    })
    .returning({ id: decisions.id });
  if (!ecrit[0]) {
    const [ligne] = await db
      .select({ status: decisions.status })
      .from(decisions)
      .where(and(eq(decisions.roundId, roundRow.id), eq(decisions.teamId, team.id)));
    throw new Error(ligne && ligne.status !== "draft" ? BROUILLON_APRES_VALIDATION : BROUILLON_TROP_RAPPROCHE);
  }
  return { quand: quand.toISOString(), par: await prenom(args.userId), parVous: true };
}

/**
 * LE BROUILLON DE L'ÉQUIPE DE L'ÉLÈVE, pour le tour en cours : sa saisie et
 * son état. `null` sans brouillon, après la validation, hors partie de classe,
 * ou pour qui n'est pas de l'équipe.
 */
export async function lireLeBrouillon(args: { gameId: string; userId: string }): Promise<BrouillonServi | null> {
  const c = await contexte(args.gameId, args.userId).catch(() => null);
  if (!c?.roundRow || c.roundRow.status !== "open") return null;
  const [ligne] = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.roundId, c.roundRow.id), eq(decisions.teamId, c.team.id)));
  if (!ligne || ligne.status !== "draft" || !ligne.saisie || !ligne.modifieLe) return null;
  return {
    saisie: ligne.saisie,
    quand: ligne.modifieLe.toISOString(),
    par: await prenom(ligne.modifiePar),
    parVous: ligne.modifiePar === args.userId,
  };
}

/**
 * L'ÉTAT DU BROUILLON D'UNE ÉQUIPE, pour le sondage de l'arène : l'heure et
 * l'auteur, JAMAIS la saisie. L'appelant a déjà vérifié que l'élève est de
 * cette équipe (`api/games/[gameId]/round-status`).
 */
export async function etatDuBrouillon(args: {
  roundId: string;
  teamId: string;
  userId: string;
}): Promise<EtatDuBrouillon | null> {
  const [ligne] = await db
    .select({ status: decisions.status, quand: decisions.modifieLe, par: decisions.modifiePar, nom: users.displayName })
    .from(decisions)
    .leftJoin(users, eq(users.id, decisions.modifiePar))
    .where(and(eq(decisions.roundId, args.roundId), eq(decisions.teamId, args.teamId)));
  if (!ligne || ligne.status !== "draft" || !ligne.quand) return null;
  return { quand: ligne.quand.toISOString(), par: pseudoAffichable(ligne.nom), parVous: ligne.par === args.userId };
}
