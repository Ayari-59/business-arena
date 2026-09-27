import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * PROUVER L'USAGE EN LE COMPTANT.
 *
 * Les totaux publiés sur la page enseignants sortent de requêtes ; une règle
 * d'affichage bien testée ne dit rien de ce qu'elles comptent. Ce fichier les
 * fait tourner sur une vraie base, avec de vraies parties, pour vérifier :
 *
 * · QU'ELLES COMPTENT LA BONNE CHOSE. Un tour ouvert n'est pas un tour résolu,
 *   un brouillon n'est pas une décision validée, et une partie créée puis
 *   abandonnée n'est pas une partie jouée.
 * · QUE LE PLANCHER TIENT SUR DES CHIFFRES RÉELS : sous le seuil, la page ne
 *   reçoit rien du tout.
 * · QUE LE SOUVENIR D'UNE HEURE EST BIEN UN SOUVENIR : deux appels d'affilée
 *   ne comptent qu'une fois.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { classes, decisions, rounds, teams, users } from "@/db/schema";
import { createSoloGame } from "@/services/game.service";
import { PLANCHER } from "@/config/preuves-dusage";
import { oublierLesPreuves, preuvesDusage } from "@/services/preuves-dusage.service";

let invite: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ email: "invite@preuves.test", displayName: "Invité" })
    .returning({ id: users.id });
  invite = u!.id;
});

/** Marque `combien` tours de la partie comme résolus par le moteur. */
async function resoudre(gameId: string, combien: number): Promise<string[]> {
  const rows = await db
    .select({ id: rounds.id })
    .from(rounds)
    .where(sql`${rounds.gameId} = ${gameId}`)
    .orderBy(rounds.index)
    .limit(combien);
  for (const r of rows) {
    await db
      .update(rounds)
      .set({ resolvedAt: new Date() })
      .where(sql`${rounds.id} = ${r.id}`);
  }
  return rows.map((r) => r.id);
}

describe("les preuves d'usage", () => {
  it("se taisent tant que le plancher n'est pas franchi", async () => {
    oublierLesPreuves();
    // Une partie créée, un seul tour résolu : très loin du plancher.
    const gameId = await createSoloGame(invite, "quarter", 2, 3, false, undefined, 6);
    await resoudre(gameId, 1);
    expect(await preuvesDusage()).toBeNull();
  });

  it("comptent les tours résolus, pas les tours ouverts", async () => {
    // De quoi passer le plancher : chaque partie va au bout de ses six tours.
    const parties: string[] = [];
    for (let i = 0; i < PLANCHER.parties; i += 1) {
      const gameId = await createSoloGame(invite, "quarter", 2, 3, false, undefined, 6);
      await resoudre(gameId, 6);
      parties.push(gameId);
    }
    oublierLesPreuves();
    const p = (await preuvesDusage())!;
    expect(p).not.toBeNull();

    // Les tours résolus de la base, et rien d'autre : les tours en attente des
    // mêmes parties ne sont pas comptés.
    const resolus = (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(rounds)
        .where(sql`${rounds.resolvedAt} is not null`)
    )[0]!.n;
    const tous = (await db.select({ n: sql<number>`count(*)::int` }).from(rounds))[0]!.n;
    expect(p.tours).toBe(resolus);
    expect(p.tours).toBeLessThan(tous);
    // La partie du premier essai comptait déjà, avec son unique tour résolu.
    expect(p.parties).toBe(parties.length + 1);
  });

  it("ne comptent que les décisions validées, jamais les brouillons", async () => {
    // Une équipe ne dépose qu'une décision par tour (contrainte d'unicité) :
    // le brouillon va donc sur le tour suivant, pas sur le même.
    const [equipe] = await db.select({ id: teams.id }).from(teams).limit(1);
    const tours = await db
      .select({ id: rounds.id })
      .from(rounds)
      .where(sql`${rounds.resolvedAt} is not null`)
      .limit(2);
    const payload = { price: 59, productionPlan: 5000 } as never;
    await db.insert(decisions).values([
      { roundId: tours[0]!.id, teamId: equipe!.id, payload, status: "validated" },
      { roundId: tours[1]!.id, teamId: equipe!.id, payload, status: "draft" },
    ]);

    oublierLesPreuves();
    const p = (await preuvesDusage())!;
    const validees = (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(decisions)
        .where(sql`${decisions.status} = 'validated'`)
    )[0]!.n;
    const toutes = (await db.select({ n: sql<number>`count(*)::int` }).from(decisions))[0]!.n;
    expect(p.decisions).toBe(validees);
    expect(p.decisions).toBeLessThan(toutes);
  });

  it("comptent les classes créées, et datent leur relevé", async () => {
    const avant = (await preuvesDusage())!;
    await db.insert(classes).values({
      organizationId: await premiereOrganisation(),
      teacherId: invite,
      name: "2nde B",
      joinCode: `CL${Date.now().toString(36).slice(-6).toUpperCase()}`,
    });

    oublierLesPreuves();
    const apres = (await preuvesDusage())!;
    expect(apres.classes).toBe(avant.classes + 1);
    expect(apres.releveLe.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("ne recomptent pas à chaque visite", async () => {
    oublierLesPreuves();
    const premier = await preuvesDusage();
    // Une classe de plus, mais le souvenir tient une heure : le total ne bouge
    // pas tant qu'on ne l'oublie pas.
    await db.insert(classes).values({
      organizationId: await premiereOrganisation(),
      teacherId: invite,
      name: "1re STMG",
      joinCode: `CM${Date.now().toString(36).slice(-6).toUpperCase()}`,
    });
    expect((await preuvesDusage())!.classes).toBe(premier!.classes);
    oublierLesPreuves();
    expect((await preuvesDusage())!.classes).toBe(premier!.classes + 1);
  });
});

/** L'organisation d'une partie déjà créée : les classes en ont besoin. */
async function premiereOrganisation(): Promise<string> {
  const { games } = await import("@/db/schema");
  const [g] = await db.select({ id: games.organizationId }).from(games).limit(1);
  return g!.id;
}
