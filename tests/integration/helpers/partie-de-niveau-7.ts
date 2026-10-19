import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, players, teams } from "@/db/schema";
import { createGameCore } from "@/services/game-creation.service";
import type { Periodicity } from "@/config/scenarios/periodicity";

/** L'organisation du grand public, celle des parties solo (créée au besoin). */
async function orgPublique(): Promise<string> {
  const [trouvee] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, "public"));
  if (trouvee) return trouvee.id;
  const [creee] = await db
    .insert(organizations)
    .values({ name: "Grand public", slug: "public", kind: "public" })
    .returning({ id: organizations.id });
  return creee!.id;
}

/**
 * UNE PARTIE SOLO DE NIVEAU 7 « GROUPE », OUVERTE COMME AVANT LE RETRAIT.
 *
 * Le niveau 7 est retiré du produit (décision du propriétaire, octobre 2026) :
 * `createSoloGame` le refuse désormais, comme tout ce qui est au-delà des six
 * niveaux, et c'est gardé à part (tests/integration/acces-sans-licence.test.ts).
 *
 * Les parties DÉJÀ CRÉÉES à ce niveau, elles, se jouent et se rejouent, et
 * plusieurs tests ont à en ouvrir une pour le vérifier : la taille de départ
 * posée au tour 0, les situations de NOVA Home, l'adoption cachée, le rejeu au
 * centime du mérite. Elles passent donc par le CŒUR COMMUN de création
 * (`createGameCore`), celui-là même que `createSoloGame` appelle après ses
 * vérifications : la partie obtenue est, en base, exactement celle qu'une
 * création d'avant le retrait laissait — même instantané, mêmes états de tour 0,
 * même profil de difficulté figé.
 */
export async function ouvrirUnePartieDeNiveau7(args: {
  /** Le joueur humain, capitaine de son équipe. */
  userId: string;
  /** Entreprises en jeu, l'humaine comprise (défaut : 3). */
  companiesCount?: number;
  periodicity?: Periodicity;
  variableWorld?: boolean;
  /** Entreprise jouée ; seule NOVA en gamme porte un bloc de groupe. */
  scenarioCode?: string;
}): Promise<string> {
  const { gameId } = await createGameCore({
    organizationId: await orgPublique(),
    createdBy: args.userId,
    periodicity: args.periodicity ?? "quarter",
    kind: "solo",
    humanTeams: [{ name: "Mon entreprise" }],
    botCount: Math.max((args.companiesCount ?? 3) - 1, 1),
    level: 7,
    variableWorld: args.variableWorld ?? false,
    investmentStories: true,
    scenarioCode: args.scenarioCode ?? "nova",
    quizMode: "model",
  });
  const [humaine] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  await db.insert(players).values({ teamId: humaine!.id, userId: args.userId, role: "captain" });
  return gameId;
}
