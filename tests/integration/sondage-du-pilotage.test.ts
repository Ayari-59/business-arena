import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE SONDAGE DU PILOTAGE VOIT LES BROUILLONS (`api/games/[gameId]/submissions`).
 *
 * Le pilotage de l'enseignant sonde cette route toutes les 12 s et se recharge quand
 * le compte des validations ou l'heure de la dernière validation change. Un brouillon
 * d'équipe n'y changeait rien : l'enseignant devait recharger la page pour le voir.
 * La route rend donc aussi `dernierBrouillon`, l'heure du dernier brouillon modifié du
 * tour courant (le plus récent `modifie_le` des lignes `draft`), et RIEN D'AUTRE du
 * brouillon : ni sa saisie, ni le nom de son auteur.
 *
 * Elle reste réservée à l'enseignant propriétaire de la partie : 401 sans session,
 * 403 pour un autre enseignant et pour un élève de la partie.
 */

let session: { userId: string; role: "teacher" | "student" } | null = null;

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => ({ getSession: async () => session }));

import { db } from "@/db";
import { users } from "@/db/schema";
import { GET } from "@/app/api/games/[gameId]/submissions/route";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { createClassGame, joinGameByCode, submitTeamDecisions } from "@/services/game.service";
import { enregistrerLeBrouillon } from "@/services/brouillon-equipe.service";
import { poserUneLicence } from "./helpers/licence";

let prof: string;
let autreProf: string;
let gameId: string;
let alice: string;
let bruno: string;
let chloe: string;
const t1 = new Date(Date.now() - 10_000);

async function eleve(nom: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@guest.business-arena.local`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

async function enseignant(nom: string): Promise<string> {
  const r = await registerTeacher({
    email: `${randomUUID()}@lycee.test`,
    password: "motdepasse!",
    displayName: nom,
    schoolName: `Lycée ${nom}`,
  });
  if ("error" in r) throw new Error(r.error);
  await poserUneLicence((await getTeacherOrgId(r.userId))!, r.userId);
  return r.userId;
}

async function sonder(qui: string | null, role: "teacher" | "student" = "teacher") {
  session = qui ? { userId: qui, role } : null;
  const r = await GET(new Request(`http://local/api/games/${gameId}/submissions`), {
    params: Promise.resolve({ gameId }),
  });
  return { status: r.status, corps: (await r.json()) as Record<string, unknown> };
}

beforeAll(async () => {
  prof = await enseignant("Mme Pilote");
  autreProf = await enseignant("M. Voisin");
  const orgId = (await getTeacherOrgId(prof))!;
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    scenarioCode: "conseil",
    seed: 4321,
  });
  gameId = partie.gameId;
  alice = await eleve("Alice");
  chloe = await eleve("Chloé");
  bruno = await eleve("Bruno");
  for (const [id, pseudo] of [
    [alice, "Alice"],
    [chloe, "Chloé"],
    [bruno, "Bruno"],
  ] as const) {
    const j = await joinGameByCode({ code: partie.joinCode, userId: id, pseudo });
    if (!("gameId" in j)) throw new Error("adhésion refusée");
  }
}, 120_000);

describe("le sondage du pilotage voit les brouillons d'équipe", () => {
  it("l'heure du dernier brouillon change quand une équipe enregistre, et rien d'autre du brouillon ne sort", async () => {
    const avant = await sonder(prof);
    expect(avant.status).toBe(200);
    expect(avant.corps.dernierBrouillon).toBeNull();
    expect(avant.corps.submittedCount).toBe(0);

    await enregistrerLeBrouillon({
      gameId,
      userId: alice,
      saisie: { price: "71", productionPlan: "900", justification: "Un prix secret" },
      now: t1,
    });
    const apres = await sonder(prof);
    expect(apres.corps.dernierBrouillon).toBe(t1.toISOString());
    // Le compte des validations ne bouge pas : c'est un brouillon.
    expect(apres.corps.submittedCount).toBe(0);
    expect(apres.corps.derniereDecision).toBeNull();

    // Une autre équipe enregistre plus tard : c'est son heure qui compte.
    const t2 = new Date(Date.now() - 5_000);
    await enregistrerLeBrouillon({
      gameId,
      userId: chloe,
      saisie: { price: "64", productionPlan: "800", justification: "" },
      now: t2,
    });
    expect((await sonder(prof)).corps.dernierBrouillon).toBe(t2.toISOString());

    // Ni la saisie, ni le nom de l'auteur ne sortent par le sondage.
    const brut = JSON.stringify((await sonder(prof)).corps);
    expect(brut).not.toContain("Alice");
    expect(brut).not.toContain("Chloé");
    expect(brut).not.toContain("Un prix secret");
    expect(brut).not.toMatch(/"(saisie|modifiePar|par|price)"/);
  });

  it("une équipe qui valide ne laisse plus de brouillon : l'heure retombe sur celle des autres", async () => {
    const decisions = { price: 59, productionPlan: 4800, marketingBudget: 6000, qualityBudget: 3000, maintenanceBudget: 4000 };
    await submitTeamDecisions({ gameId, userId: chloe, payload: decisions });
    const corps = (await sonder(prof)).corps;
    expect(corps.submittedCount).toBe(1);
    expect(typeof corps.derniereDecision).toBe("string");
    // Il reste le brouillon d'Alice, le plus ancien.
    expect(corps.dernierBrouillon).toBe(t1.toISOString());
  });
});

describe("le sondage du pilotage reste réservé à l'enseignant propriétaire", () => {
  it("401 sans session", async () => {
    const r = await sonder(null);
    expect(r.status).toBe(401);
    expect(r.corps).not.toHaveProperty("dernierBrouillon");
  });

  it("403 pour un autre enseignant", async () => {
    const r = await sonder(autreProf);
    expect(r.status).toBe(403);
    expect(r.corps).not.toHaveProperty("dernierBrouillon");
  });

  it("403 pour un élève de la partie, même celui qui a écrit le brouillon", async () => {
    for (const qui of [alice, bruno]) {
      const r = await sonder(qui, "student");
      expect(r.status).toBe(403);
      expect(r.corps).not.toHaveProperty("dernierBrouillon");
    }
  });

  it("200 pour l'enseignant propriétaire", async () => {
    expect((await sonder(prof)).status).toBe(200);
  });
});
