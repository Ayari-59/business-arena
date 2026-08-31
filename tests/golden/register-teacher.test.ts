import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { organizationMembers, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";

beforeAll(async () => {
  process.env.ADMIN_EMAILS = "";
});

describe("registerTeacher — idempotent recovery", () => {
  it("normal registration creates user + organization", async () => {
    const r = await registerTeacher({
      email: "fresh@register-test.local",
      password: "motdepasse!",
      displayName: "Fresh",
      schoolName: "École Test",
    });
    expect("userId" in r).toBe(true);
    if (!("userId" in r)) return;
    const orgId = await getTeacherOrgId(r.userId);
    expect(orgId).toBeTruthy();
  });

  it("duplicate with complete registration returns error", async () => {
    const r = await registerTeacher({
      email: "dup@register-test.local",
      password: "motdepasse!",
      displayName: "Dup",
      schoolName: "École",
    });
    expect("userId" in r).toBe(true);
    const r2 = await registerTeacher({
      email: "dup@register-test.local",
      password: "motdepasse!",
      displayName: "Dup",
      schoolName: "École",
    });
    expect("error" in r2).toBe(true);
  });

  it("orphan user (no org membership) recovers on retry with correct password", async () => {
    const email = "orphan@register-test.local";
    // Create orphan: insert user manually without org membership
    await db.insert(users).values({
      email,
      passwordHash: await import("bcryptjs").then((b) => b.default.hash("motdepasse!", 10)),
      displayName: "Orphan",
    });
    const orphanRow = (await db.select().from(users).where(eq(users.email, email)))[0]!;
    const memberships = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, orphanRow.id));
    expect(memberships).toHaveLength(0);

    // Retry registration with same password → should recover
    const r = await registerTeacher({
      email,
      password: "motdepasse!",
      displayName: "Orphan",
      schoolName: "Recovered School",
    });
    expect("userId" in r).toBe(true);
    if (!("userId" in r)) return;
    expect(r.userId).toBe(orphanRow.id);

    const orgId = await getTeacherOrgId(r.userId);
    expect(orgId).toBeTruthy();
  });

  it("orphan user with wrong password returns error", async () => {
    const email = "orphan-bad@register-test.local";
    await db.insert(users).values({
      email,
      passwordHash: await import("bcryptjs").then((b) => b.default.hash("correct-pass", 10)),
      displayName: "OrphanBad",
    });

    const r = await registerTeacher({
      email,
      password: "wrong-pass",
      displayName: "OrphanBad",
      schoolName: "School",
    });
    expect("error" in r).toBe(true);
  });

  it("concurrent registration does not crash or duplicate", async () => {
    const email = "concurrent@register-test.local";
    const [a, b] = await Promise.allSettled([
      registerTeacher({
        email,
        password: "motdepasse!",
        displayName: "ConcA",
        schoolName: "School A",
      }),
      registerTeacher({
        email,
        password: "motdepasse!",
        displayName: "ConcB",
        schoolName: "School B",
      }),
    ]);

    const fulfilled = [a, b].filter(
      (r) => r.status === "fulfilled" && "userId" in r.value,
    ) as PromiseFulfilledResult<{ userId: string }>[];
    // At least one succeeds with a userId
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // Only one user row exists
    const rows = await db.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });
});
