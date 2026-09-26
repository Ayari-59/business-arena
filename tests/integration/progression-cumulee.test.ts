import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA PROGRESSION SE CUMULE, MÊME ÉCRITE EN UN SEUL LOT.
 *
 * La progression s'écrivait une notion à la fois, un élève à la fois, une
 * situation à la fois : jusqu'à huit cents allers-retours en série pendant que
 * l'enseignant attend la clôture du tour. Elle part maintenant en une écriture
 * groupée.
 *
 * Ce que le groupement peut casser, et que cette garde surveille : le CUMUL.
 * `evidenceCount` compte les preuves accumulées et `mastery` se construit sur
 * la valeur précédente ; un lot qui écrirait des valeurs absolues mal calculées
 * remettrait l'élève à zéro à chaque tour sans que rien ne le signale. Et deux
 * situations qui touchent la même notion dans le même tour doivent compter
 * deux fois, tout en ne produisant qu'une ligne dans le lot — sans quoi
 * Postgres refuse l'upsert (« cannot affect row a second time »).
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { concepts, learningProgress, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame, joinGameByCode } from "@/services/game.service";
import { getTeamSituations, submitDiagnosis } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";

let prof: string;
let gameId: string;
let eleve: string;

/** Répond au diagnostic du tour, puis clôt : le débriefing écrit la progression. */
async function jouerUnTour(): Promise<string[]> {
  const { current } = await getTeamSituations(gameId, eleve);
  const notions: string[] = [];
  for (const s of current) {
    const def = situationByCode.get(s.code);
    if (!def) continue;
    await submitDiagnosis({
      instanceId: s.instanceId,
      userId: eleve,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    notions.push(...def.conceptCodes);
  }
  await closeCurrentRound({ gameId, teacherId: prof });
  return notions;
}

async function progression(code: string) {
  const [notion] = await db.select().from(concepts).where(eq(concepts.code, code));
  if (!notion) return null;
  const [ligne] = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, eleve), eq(learningProgress.conceptId, notion.id)));
  return ligne ?? null;
}

let notionsTour1: string[] = [];
let notionsTour2: string[] = [];

beforeAll(async () => {
  const r = await registerTeacher({
    email: "cumul@lycee.test",
    password: "motdepasse!",
    displayName: "M. Cumul",
    schoolName: "Lycée du Cumul",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    // GRAINE FIXE. Sans elle, les situations ouvertes changent d'une exécution
    // à l'autre, et le recouvrement entre les deux tours avec : la garde
    // passait ou échouait au hasard. Une garde intermittente ne garde rien.
    seed: 7,
  });
  gameId = partie.gameId;
  const [u] = await db
    .insert(users)
    .values({ email: "cumul@test.local", displayName: "Élève assidu" })
    .returning({ id: users.id });
  eleve = u!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: eleve });
  if ("error" in j) throw new Error(j.error);

  notionsTour1 = await jouerUnTour();
  notionsTour2 = await jouerUnTour();
});

describe("deux tours joués", () => {
  it("chaque notion vue au premier tour a laissé une preuve", async () => {
    expect(notionsTour1.length).toBeGreaterThan(0);
    for (const code of new Set(notionsTour1)) {
      const ligne = await progression(code);
      expect(ligne, `notion ${code}`).not.toBeNull();
      expect(Number(ligne!.evidenceCount), `notion ${code}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("une notion revue au second tour compte DEUX preuves, pas une", async () => {
    const revues = [...new Set(notionsTour2)].filter((c) => notionsTour1.includes(c));
    // Mesuré sur NOVA : trois notions reviennent d'un tour à l'autre, la
    // garde porte donc sur du réel. Si un jour un scénario n'en partage
    // aucune, elle n'a rien à dire — c'est le scénario qui en décide.
    expect(revues.length).toBeGreaterThan(0);
    for (const code of revues) {
      const ligne = await progression(code);
      expect(Number(ligne!.evidenceCount), `notion ${code} revue`).toBeGreaterThanOrEqual(2);
    }
  });

  it("aucune maîtrise n'est retombée à zéro", async () => {
    for (const code of new Set([...notionsTour1, ...notionsTour2])) {
      const ligne = await progression(code);
      if (!ligne) continue;
      expect(Number(ligne.mastery), `notion ${code}`).toBeGreaterThan(0);
    }
  });

  it("une notion vue deux fois dans le MÊME tour ne produit qu'une ligne", async () => {
    const lignes = await db
      .select({ conceptId: learningProgress.conceptId })
      .from(learningProgress)
      .where(eq(learningProgress.userId, eleve));
    expect(new Set(lignes.map((l) => l.conceptId)).size).toBe(lignes.length);
  });
});
