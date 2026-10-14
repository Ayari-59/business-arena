import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { decisions, gameRankings, games, roundResults, rounds, teams } from "@/db/schema";
import { SUIVENT_L_ESSAI } from "@/services/archives-d-essai";
import {
  BASCULE_PENDANT_UN_CALCUL,
  lireLEssai,
  profilDeDepart,
  type TourDEssai,
} from "@/config/tour-d-essai";
import type { Periodicity } from "@/config/scenarios/periodicity";
import type { RoundDecisions } from "@/engine/types";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { poserLEtatDeDepart } from "@/services/game-creation.service";

/**
 * LA BASCULE : DE L'ESSAI À LA VRAIE PARTIE.
 *
 * CONCEPTION RETENUE (et pourquoi). Deux voies existaient : marquer des tours
 * « essai » dans la partie et apprendre à chaque lecteur à les sauter, ou jouer
 * l'essai dans la partie puis le DÉPLACER, en bloc, dans une partie d'archive.
 *
 * La première oblige chacun des lecteurs de tours et d'états (classement, bilan,
 * mérite, relevé, profil, Gazette, LTI, carnet d'usage, une trentaine de fichiers) à
 * filtrer, aujourd'hui et pour toujours : un lecteur écrit demain qui oublie le
 * filtre compte l'essai sans que rien ne le signale. La seconde ne demande RIEN aux
 * lecteurs d'une partie : après la bascule, il n'y a plus un seul tour, une seule
 * décision, un seul état de l'essai sous la partie. Le classement, le bilan, le
 * mérite, le relevé ne peuvent pas compter ce qu'ils ne voient pas.
 *
 * Ce qu'elle demande en échange tient en deux listes, gardées par un test qui lit le
 * schéma (tests/architecture/tour-d-essai.test.ts) :
 *   · `SUIVENT_L_ESSAI` : chaque table qui porte un tour, une décision, un état ou un
 *     résultat, et que la bascule déplace vers l'archive ;
 *   · `RESTENT_A_LA_PARTIE` : chaque table qui pointe vers une partie ou une équipe et
 *     qui reste où elle est (les équipes, leurs membres, les codes, le lien LTI).
 * Une table nouvelle qui pointe vers une partie, une équipe ou un tour fait rougir le
 * test tant qu'elle n'est pas rangée dans l'une des deux.
 *
 * Et les quelques lecteurs TRANSVERSAUX (la liste de l'enseignant, son carnet d'usage,
 * les comptes de l'administration et de la page publique), qui lisent plusieurs parties
 * à la fois : ils écartent les archives par `horsArchivesDEssai`. Le même test recense
 * les lecteurs et exige ce filtre de chacun d'eux.
 *
 * PENDANT l'essai, la partie se joue comme une autre : classement du tour, résultats,
 * Gazette, tout s'affiche « comme d'habitude, pour apprendre ». Deux écritures qui
 * survivraient à la bascule sont tenues à l'écart : la progression de l'élève (profil,
 * notions) n'est pas nourrie par un tour d'essai (pedagogy.service, `debriefRound`), et
 * le relevé de notes ne s'ouvre pas sur l'essai.
 */

export {
  horsArchivesDEssai,
  partieQuiCompte,
  RESTENT_A_LA_PARTIE,
  SUIVENT_L_ESSAI,
  tourQuiCompte,
} from "@/services/archives-d-essai";

// ---------------------------------------------------------------------------
// La bascule
// ---------------------------------------------------------------------------

const nomDeColonne = (c: PgColumn) => sql.identifier(c.name);

/**
 * Le déplacement, en UNE instruction. Le pilote HTTP de Neon n'offre pas de
 * transaction ; une instruction à expressions de table modifiantes est, elle,
 * atomique : soit tout l'essai part dans l'archive, soit rien ne bouge. La même
 * instruction pose la marque `deplace`, qui empêche une bascule reprise de déplacer
 * une seconde fois (et d'emporter, cette fois, la vraie partie).
 */
function instructionDeDeplacement(args: {
  partie: string;
  archive: string;
  correspondances: { ancien: string; nouveau: string }[];
}): SQL {
  const m = sql.join(
    args.correspondances.map((c) => sql`(${c.ancien}::uuid, ${c.nouveau}::uuid)`),
    sql`, `,
  );
  const etapes = SUIVENT_L_ESSAI.map((t, i) => {
    const nom = sql.identifier(getTableConfig(t.table).name);
    const alias = sql.identifier(`etape_${i}`);
    if (t.partie) {
      const equipe = t.equipe
        ? sql`, ${nomDeColonne(t.equipe)} = coalesce((select m.nouveau from m where m.ancien = x.${nomDeColonne(t.equipe)}), x.${nomDeColonne(t.equipe)})`
        : sql``;
      return sql`${alias} as (update ${nom} x set ${nomDeColonne(t.partie)} = ${args.archive}::uuid${equipe} where x.${nomDeColonne(t.partie)} = ${args.partie}::uuid and exists (select 1 from garde) returning 1)`;
    }
    const equipe = nomDeColonne(t.equipe!);
    const etat = t.etatAvecIdentifiant
      ? sql`, ${nomDeColonne(t.etatAvecIdentifiant)} = jsonb_set(x.${nomDeColonne(t.etatAvecIdentifiant)}, '{id}', to_jsonb(m.nouveau::text))`
      : sql``;
    return sql`${alias} as (update ${nom} x set ${equipe} = m.nouveau${etat} from m where x.${equipe} = m.ancien and exists (select 1 from garde) returning 1)`;
  });
  // LA GARDE : rien ne bouge si la marque est déjà posée. Une bascule reprise après
  // que l'état de départ a été reposé emporterait sinon la VRAIE partie dans l'archive.
  const garde = sql`garde as (select 1 from ${games} where ${games.id} = ${args.partie}::uuid and coalesce((${games.essai}->>'deplace')::boolean, false) = false)`;
  return sql`with m(ancien, nouveau) as (values ${m}), ${garde}, ${sql.join(etapes, sql`, `)}, marque as (update ${games} set essai = essai || '{"deplace": true}'::jsonb where id = ${args.partie}::uuid returning 1) select 1`;
}

/** L'erreur d'une bascule refusée : le message est fait pour l'écran. */
export class BasculeRefuseeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BasculeRefuseeError";
  }
}

async function unTourEnCalcul(gameId: string): Promise<boolean> {
  const [n] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rounds)
    .where(and(eq(rounds.gameId, gameId), eq(rounds.status, "resolving")));
  return (n?.n ?? 0) > 0;
}

/**
 * « COMMENCER LA VRAIE PARTIE ». Toutes les entreprises repartent de l'état initial du
 * scénario ; les équipes, leurs membres et les codes restent ; l'essai joué part dans
 * l'archive que l'animateur relit pour le débrief.
 *
 * Refusée pendant le calcul d'un tour d'essai. Idempotente : une partie déjà basculée
 * est rendue telle quelle, et une bascule interrompue reprend où elle s'était arrêtée.
 */
export async function commencerLaVraiePartie(args: {
  gameId: string;
  teacherId: string;
}): Promise<{ archiveId: string; dejaFaite: boolean }> {
  const [game] = await db.select().from(games).where(eq(games.id, args.gameId));
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  const essai = lireLEssai(game.essai);
  if (!essai) throw new BasculeRefuseeError("Cette partie n'a pas de tour d'essai.");
  if (essai.phase === "fini") return { archiveId: essai.archive ?? "", dejaFaite: true };

  if (essai.phase !== "bascule") {
    // LE VERROU : la phase passe à « bascule » en une instruction, et seulement si aucun
    // tour ne se calcule. La résolution d'un tour fait le contrôle symétrique : de deux
    // gestes simultanés, l'un au moins voit l'autre et renonce.
    const [pris] = await db
      .update(games)
      .set({ essai: sql`${games.essai} || '{"phase": "bascule"}'::jsonb` })
      .where(
        and(
          eq(games.id, args.gameId),
          sql`${games.essai}->>'phase' in ('en_cours', 'termine')`,
          sql`not exists (select 1 from ${rounds} where ${rounds.gameId} = ${args.gameId} and ${rounds.status} = 'resolving')`,
        ),
      )
      .returning({ id: games.id });
    if (!pris) {
      if (await unTourEnCalcul(args.gameId)) throw new BasculeRefuseeError(BASCULE_PENDANT_UN_CALCUL);
      // Une autre requête vient de prendre le verrou, ou de finir : on relit.
      return commencerLaVraiePartie(args);
    }
    if (await unTourEnCalcul(args.gameId)) {
      await db
        .update(games)
        .set({ essai: { ...essai } })
        .where(eq(games.id, args.gameId));
      throw new BasculeRefuseeError(BASCULE_PENDANT_UN_CALCUL);
    }
  }

  // 1. L'ARCHIVE : une partie close, sans code ni élève, que seul l'animateur relit.
  await db
    .insert(games)
    .values({
      organizationId: game.organizationId,
      classId: game.classId,
      scenarioId: game.scenarioId,
      scenarioSnapshot: game.scenarioSnapshot,
      engineVersion: game.engineVersion,
      seed: game.seed,
      mode: game.mode,
      difficultyProfile: game.difficultyProfile,
      status: "finished",
      currentRound: game.currentRound,
      createdBy: game.createdBy,
      essaiDe: game.id,
    })
    .onConflictDoNothing({ target: games.essaiDe });
  const [archive] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.essaiDe, game.id));
  if (!archive) throw new Error("L'archive de l'essai n'a pas pu être créée.");

  const equipes = await db.select().from(teams).where(eq(teams.gameId, game.id));

  // 2 et 3. LES ÉQUIPES DE L'ARCHIVE, puis LE DÉPLACEMENT, une seule fois.
  if (!essai.deplace) {
    await db
      .insert(teams)
      .values(
        equipes.map((t) => ({
          gameId: archive.id,
          name: t.name,
          controller: t.controller,
          botProfile: t.botProfile,
          embleme: t.embleme,
        })),
      )
      .onConflictDoNothing();
    const copies = await db.select().from(teams).where(eq(teams.gameId, archive.id));
    const correspondances = equipes.map((t) => {
      const copie = copies.find((c) => c.name === t.name);
      if (!copie) throw new Error(`L'équipe ${t.name} n'a pas de copie dans l'archive.`);
      return { ancien: t.id, nouveau: copie.id };
    });
    await db.execute(instructionDeDeplacement({ partie: game.id, archive: archive.id, correspondances }));
  }

  // 4. L'ARCHIVE NE GARDE QUE CE QUI A ÉTÉ JOUÉ : un tour d'essai ouvert au moment de la
  // bascule n'a ni résultat ni débrief, il part avec ses brouillons.
  const toursArchives = await db
    .select({ index: rounds.index, status: rounds.status })
    .from(rounds)
    .where(eq(rounds.gameId, archive.id));
  const clos = toursArchives.filter((r) => r.status === "resolved").map((r) => r.index);
  if (toursArchives.length > clos.length) {
    await db
      .delete(rounds)
      .where(and(eq(rounds.gameId, archive.id), sql`${rounds.status} <> 'resolved'`));
  }
  await db
    .update(games)
    .set({ currentRound: clos.length > 0 ? Math.max(...clos) : 1 })
    .where(eq(games.id, archive.id));

  // 5. LA PARTIE REPREND SA GRAINE ET SON SCÉNARIO, et son profil perd l'état de jeu de
  // l'essai (événements en cours, courriers, Gazette parue) : la Gazette du vrai tour 1
  // est celle d'une partie qui n'a jamais été jouée.
  const scenarioReel = essai.scenario ?? game.scenarioSnapshot;
  await db
    .update(games)
    .set({
      seed: essai.graine,
      scenarioSnapshot: scenarioReel,
      difficultyProfile: profilDeDepart(game.difficultyProfile),
      currentRound: 1,
      status: "running",
    })
    .where(eq(games.id, game.id));

  // 6. L'ÉTAT DE DÉPART, posé par la fonction de la création elle-même : la vraie
  // partie commence exactement comme une partie neuve.
  const [dejaPose] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rounds)
    .where(eq(rounds.gameId, game.id));
  if ((dejaPose?.n ?? 0) === 0) {
    const definition = await resolveScenarioDefinition(scenarioReel.code);
    const periodicity = ((game.difficultyProfile as { periodicity?: Periodicity } | null)
      ?.periodicity ?? "quarter") as Periodicity;
    await poserLEtatDeDepart({
      gameId: game.id,
      equipes,
      definition,
      periodicity,
      roundsCount: scenarioReel.roundsCount,
    });
  }

  // 7. LA VRAIE PARTIE A COMMENCÉ. Le scénario réel n'a plus à attendre dans `essai`.
  const fini: TourDEssai = {
    tours: essai.tours,
    enchainement: essai.enchainement,
    phase: "fini",
    graine: essai.graine,
    archive: archive.id,
    basculeLe: new Date().toISOString(),
  };
  await db.update(games).set({ essai: fini }).where(eq(games.id, game.id));
  return { archiveId: archive.id, dejaFaite: false };
}

/**
 * L'enchaînement automatique, après la clôture du dernier tour d'essai. Un échec ne
 * casse pas la clôture : la partie reste « essai terminé », et le bouton de
 * l'animateur reprend la bascule là où elle s'est arrêtée.
 */
export async function enchainerSiDemande(gameId: string): Promise<boolean> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const essai = lireLEssai(game?.essai);
  if (!game || !essai || essai.phase !== "termine" || essai.enchainement !== "auto") return false;
  try {
    await commencerLaVraiePartie({ gameId, teacherId: game.createdBy });
    return true;
  } catch (error) {
    console.warn(
      "[tour-d-essai] enchaînement automatique interrompu :",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Revoir l'essai
// ---------------------------------------------------------------------------

export interface EssaiRevu {
  gameId: string;
  archiveId: string;
  tours: {
    index: number;
    equipes: {
      nom: string;
      bot: boolean;
      chiffreDAffaires: number;
      resultatNet: number;
      tresorerie: number;
      partDeMarche: number;
      prix: number | null;
      volume: number | null;
    }[];
  }[];
  classement: { nom: string; bot: boolean; rang: number; ipg: number }[];
}

/** L'essai joué, relu depuis son archive, pour le débrief ; null sans archive ou à un autre. */
export async function revoirLEssai(args: {
  gameId: string;
  teacherId: string;
}): Promise<EssaiRevu | null> {
  const [game] = await db.select().from(games).where(eq(games.id, args.gameId));
  if (!game || game.createdBy !== args.teacherId) return null;
  const [archive] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.essaiDe, game.id));
  if (!archive) return null;

  const equipes = await db.select().from(teams).where(eq(teams.gameId, archive.id));
  const nomDe = new Map(equipes.map((t) => [t.id, t]));
  const tours = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.gameId, archive.id), eq(rounds.status, "resolved")))
    .orderBy(asc(rounds.index));
  const idsDesTours = tours.map((r) => r.id);
  const [resultats, rendues, classement] = await Promise.all([
    idsDesTours.length
      ? db.select().from(roundResults).where(inArray(roundResults.roundId, idsDesTours))
      : Promise.resolve([]),
    idsDesTours.length
      ? db.select().from(decisions).where(inArray(decisions.roundId, idsDesTours))
      : Promise.resolve([]),
    db.select().from(gameRankings).where(eq(gameRankings.gameId, archive.id)),
  ]);

  return {
    gameId: game.id,
    archiveId: archive.id,
    tours: tours.map((r) => ({
      index: r.index,
      equipes: resultats
        .filter((x) => x.roundId === r.id)
        .map((x) => {
          const payload = rendues.find((d) => d.roundId === r.id && d.teamId === x.teamId)
            ?.payload as RoundDecisions | undefined;
          const equipe = nomDe.get(x.teamId);
          return {
            nom: equipe?.name ?? "Équipe",
            bot: equipe?.controller === "bot",
            chiffreDAffaires: Number(x.revenue),
            resultatNet: Number(x.netIncome),
            tresorerie: Number(x.netTreasury),
            partDeMarche: Number(x.marketShare),
            prix: typeof payload?.price === "number" ? payload.price : null,
            volume: typeof payload?.productionPlan === "number" ? payload.productionPlan : null,
          };
        })
        .sort((a, b) => b.resultatNet - a.resultatNet),
    })),
    classement: classement
      .map((c) => ({
        nom: nomDe.get(c.teamId)?.name ?? "Équipe",
        bot: nomDe.get(c.teamId)?.controller === "bot",
        rang: c.rank,
        ipg: Number(c.bpi),
      }))
      .sort((a, b) => a.rang - b.rang),
  };
}
