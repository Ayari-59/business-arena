import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { aidRequests, games, rounds, teams } from "@/db/schema";
import { estArchivee, PARTIE_ARCHIVEE } from "@/services/archivage";

/**
 * LA SUBVENTION EXCEPTIONNELLE : l'écrit d'une équipe, la réponse d'un humain.
 *
 * Dernier maillon de la chaîne de crise. Un tour s'achève en cessation de
 * paiements ; le suivant exige un financement de sauvetage ; l'équipe emprunte
 * et fait appel aux associés ; et parfois les deux réunis ne suffisent pas.
 * Elle est alors devant un mur : plus rien à décider, et un formulaire qu'elle
 * ne peut pas satisfaire.
 *
 * Elle dépose ici un dossier — un montant, un motif — qui apparaît dans
 * l'espace de l'animateur. Lui seul tranche. C'est voulu : une aide de dernier
 * recours qui s'obtiendrait en cochant une case ne serait pas une aide, ce
 * serait un bouton « annuler la faillite ». En la faisant passer par une
 * personne, on rend au geste ce qu'il a de réel — il faut convaincre, et on
 * peut essuyer un refus.
 *
 * Accordée, la subvention est encaissée à la clôture du tour demandé, en
 * produit exceptionnel (voir `rescueSubsidies` du moteur). Refusée, elle laisse
 * l'équipe face aux conséquences — ce qui est aussi une leçon.
 */

export type StatutDemande = "pending" | "granted" | "refused";

export interface DemandeDeSubvention {
  id: string;
  roundIndex: number;
  /** Montant demandé, en euros. */
  montant: number;
  motif: string;
  statut: StatutDemande;
  /** Montant accordé ; `null` tant que l'animateur n'a pas tranché, et après un refus. */
  montantAccorde: number | null;
  /** Le mot de l'animateur à l'équipe. */
  note: string | null;
}

/**
 * Une demande vue de l'espace enseignant. Elle porte l'identifiant de l'équipe,
 * pas son nom : c'est la vue enseignante qui met les noms en forme, et lui
 * emprunter sa fonction ici ferait un cycle d'imports (elle aura besoin de ce
 * module).
 */
export interface DemandeAInstruire extends DemandeDeSubvention {
  teamId: string;
  /** Le tour visé est-il encore ouvert ? Un tour clos ne peut plus rien encaisser. */
  encoreUtile: boolean;
}

const euros = (v: string | null): number | null => (v === null ? null : Number(v));

function versDemande(row: typeof aidRequests.$inferSelect): DemandeDeSubvention {
  return {
    id: row.id,
    roundIndex: row.roundIndex,
    montant: Number(row.amount),
    motif: row.reason,
    statut: row.status,
    montantAccorde: euros(row.grantedAmount),
    note: row.decisionNote,
  };
}

/** La demande déposée par une équipe pour un tour donné, s'il y en a une. */
export async function demandeDuTour(
  teamId: string,
  roundIndex: number,
): Promise<DemandeDeSubvention | null> {
  const row = (
    await db
      .select()
      .from(aidRequests)
      .where(and(eq(aidRequests.teamId, teamId), eq(aidRequests.roundIndex, roundIndex)))
  )[0];
  return row ? versDemande(row) : null;
}

/**
 * Dépose la demande d'une équipe pour le tour en cours.
 *
 * Les gardes tenues ici sont STRUCTURELLES : partie en cours, équipe réelle,
 * montant sensé, une seule demande par tour. Que l'équipe soit bien au pied du
 * mur — en crise, leviers épuisés — se vérifie dans l'action serveur, qui lit
 * la vue de la partie ; le faire ici ferait dépendre ce module de la vue, qui
 * elle-même aura besoin de lui.
 */
export async function deposerDemande(args: {
  gameId: string;
  teamId: string;
  roundIndex: number;
  montant: number;
  motif: string;
}): Promise<DemandeDeSubvention> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (estArchivee(game)) throw new Error(PARTIE_ARCHIVEE);
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  if (args.roundIndex !== game.currentRound) {
    throw new Error("Ce tour n'est plus celui qui se joue.");
  }
  const team = (await db.select().from(teams).where(eq(teams.id, args.teamId)))[0];
  if (!team || team.gameId !== args.gameId) throw new Error("Équipe introuvable");

  const montant = Math.round(args.montant * 100) / 100;
  if (!Number.isFinite(montant) || montant <= 0) {
    throw new Error("Indiquez le montant que vous demandez.");
  }
  const motif = args.motif.trim();
  if (motif.length < 10) {
    throw new Error("Expliquez en une phrase ce que cette aide doit permettre.");
  }

  const deja = await demandeDuTour(args.teamId, args.roundIndex);
  if (deja) throw new Error("Vous avez déjà déposé une demande pour ce tour.");

  const [row] = await db
    .insert(aidRequests)
    .values({
      gameId: args.gameId,
      teamId: args.teamId,
      roundIndex: args.roundIndex,
      amount: montant.toFixed(2),
      reason: motif.slice(0, 1000),
    })
    .returning();
  return versDemande(row!);
}

/**
 * Les demandes d'une partie, pour l'animateur : celles qui attendent d'abord,
 * puis les tranchées, du tour le plus récent au plus ancien.
 */
export async function demandesDeLaPartie(gameId: string): Promise<DemandeAInstruire[]> {
  const rows = await db.select().from(aidRequests).where(eq(aidRequests.gameId, gameId));
  if (rows.length === 0) return [];

  const tours = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const clos = new Set(
    tours.filter((t) => t.status === "resolved").map((t) => t.index),
  );

  return rows
    .map((row) => ({
      ...versDemande(row),
      teamId: row.teamId,
      encoreUtile: !clos.has(row.roundIndex),
    }))
    .sort((a, b) => {
      // Ce qui attend une réponse passe devant : c'est la seule chose qui
      // demande un geste à l'animateur pendant la séance.
      if (a.statut !== b.statut) return a.statut === "pending" ? -1 : 1;
      return b.roundIndex - a.roundIndex;
    });
}

/**
 * L'animateur tranche. Accorder un montant inférieur au demandé est permis :
 * une aide partielle est un arbitrage, pas une erreur de saisie.
 *
 * Une demande déjà tranchée ne se reprend pas — la réponse donnée à la classe
 * est la réponse. Et un tour déjà clos ne peut plus rien encaisser : accorder
 * une aide qui n'arrivera jamais tromperait tout le monde, alors on le dit.
 */
export async function trancherDemande(args: {
  requestId: string;
  teacherId: string;
  accord: boolean;
  /** Montant accordé, en euros. Ignoré en cas de refus. */
  montant?: number;
  note?: string;
}): Promise<void> {
  const demande = (
    await db.select().from(aidRequests).where(eq(aidRequests.id, args.requestId))
  )[0];
  if (!demande) throw new Error("Demande introuvable");

  const game = (await db.select().from(games).where(eq(games.id, demande.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Demande introuvable");
  if (demande.status !== "pending") throw new Error("Cette demande a déjà été tranchée.");

  if (args.accord) {
    const tour = (
      await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.gameId, demande.gameId), eq(rounds.index, demande.roundIndex)))
    )[0];
    if (tour?.status === "resolved") {
      throw new Error(
        `Le tour ${demande.roundIndex} est déjà clos : la subvention n'y serait plus encaissée.`,
      );
    }
  }

  const demande_ = Number(demande.amount);
  const brut = args.montant ?? demande_;
  // On n'accorde pas plus que demandé : le dossier fixe le plafond, sans quoi
  // une faute de frappe de l'animateur offrirait un million à une équipe.
  const accorde = Math.min(Math.max(0, brut), demande_);

  await db
    .update(aidRequests)
    .set({
      status: args.accord ? "granted" : "refused",
      grantedAmount: args.accord ? (Math.round(accorde * 100) / 100).toFixed(2) : null,
      decisionNote: args.note?.trim() ? args.note.trim().slice(0, 1000) : null,
      decidedBy: args.teacherId,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aidRequests.id, args.requestId));
}

/**
 * Ce que l'animateur a accordé pour CE tour, par équipe — ce que le moteur
 * encaissera à la clôture. Les demandes refusées ou encore à l'étude n'y
 * figurent pas : elles ne valent rien en trésorerie.
 */
export async function subventionsAccordees(
  gameId: string,
  roundIndex: number,
): Promise<Record<string, number>> {
  const rows = await db
    .select()
    .from(aidRequests)
    .where(
      and(
        eq(aidRequests.gameId, gameId),
        eq(aidRequests.roundIndex, roundIndex),
        eq(aidRequests.status, "granted"),
      ),
    );
  const out: Record<string, number> = {};
  for (const row of rows) {
    const montant = Number(row.grantedAmount ?? 0);
    if (montant > 0) out[row.teamId] = montant;
  }
  return out;
}
