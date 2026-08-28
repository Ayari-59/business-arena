import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * La licence d'établissement : ce qui est vendu, et ce qui est refusé.
 *
 * Trois décisions sont fixées ici, et chacune protège quelqu'un.
 *
 * L'ABSENCE de licence vaut accès libre. Une frontière qui se refermerait
 * d'elle-même sur les établissements existants, sur une démonstration ou sur
 * un essai serait une régression déguisée en modèle économique.
 *
 * Une licence expirée n'interrompt JAMAIS une classe en cours : elle empêche
 * d'en ouvrir une nouvelle. Un trimestre commencé se finit, sans quoi ce
 * seraient les élèves qui paieraient un retard de mandatement.
 *
 * Le plafond porte sur les ENSEIGNANTS, l'unité que l'établissement reconnaît
 * sur un devis, et jamais sur les élèves, dont le nombre bouge en cours
 * d'année.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { createInvite } from "@/services/admin.service";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import {
  assertCanCreateGame,
  getLicenceStatus,
  listOrgLicences,
  setOrgLicence,
} from "@/services/licence.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

const JOUR = 24 * 60 * 60 * 1000;
const dans = (jours: number) => new Date(Date.now() + jours * JOUR);

let prof: string;
let orgId: string;

async function nouvelEtablissement(email: string, nom: string) {
  const r = await registerTeacher({
    email,
    password: "motdepasse!",
    displayName: nom,
    schoolName: `Lycée ${nom}`,
  });
  if ("error" in r) throw new Error(r.error);
  return { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
}

beforeAll(async () => {
  const e = await nouvelEtablissement("licence@lycee.test", "Licence");
  prof = e.userId;
  orgId = e.orgId;
});

describe("licence d'établissement", () => {
  it("sans licence, tout reste ouvert : la limite n'existe que si on l'a vendue", async () => {
    const statut = await getLicenceStatus(orgId);
    expect(statut.state).toBe("libre");
    expect(statut.licence).toBeNull();
    expect(statut.blocking).toBeNull();
    await expect(assertCanCreateGame(orgId)).resolves.toBeUndefined();
  });

  it("une licence en cours laisse créer, et dit ce qu'il reste", async () => {
    await setOrgLicence({
      adminId: prof,
      organizationId: orgId,
      label: "Année scolaire 2026-2027",
      startsAt: dans(-10),
      endsAt: dans(200),
      maxTeachers: 3,
      reference: "BC-2026-114",
      amountCents: 90_000,
    });

    const statut = await getLicenceStatus(orgId);
    expect(statut.state).toBe("active");
    expect(statut.licence!.label).toBe("Année scolaire 2026-2027");
    expect(statut.licence!.reference).toBe("BC-2026-114");
    expect(statut.daysLeft).toBeGreaterThan(100);
    expect(statut.blocking).toBeNull();

    const partie = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
    });
    expect(partie.joinCode).toMatch(/^[A-Z2-9]{6}$/);
  });

  it("l'approche de l'échéance se signale avant de bloquer", async () => {
    const e = await nouvelEtablissement("bientot@lycee.test", "Bientot");
    await setOrgLicence({
      adminId: e.userId,
      organizationId: e.orgId,
      label: "Licence qui s'achève",
      startsAt: dans(-300),
      endsAt: dans(12),
      maxTeachers: null,
    });
    const statut = await getLicenceStatus(e.orgId);
    expect(statut.state).toBe("bientot_expiree");
    expect(statut.daysLeft).toBeLessThanOrEqual(12);
    // signalée, mais toujours pas bloquante : on prévient, on n'interdit pas
    expect(statut.blocking).toBeNull();
    await expect(assertCanCreateGame(e.orgId)).resolves.toBeUndefined();
  });

  it("une licence expirée ferme la création NEUVE et laisse finir les classes en cours", async () => {
    const e = await nouvelEtablissement("expiree@lycee.test", "Expiree");
    // une partie ouverte pendant que la licence courait
    const partie = await createClassGame({
      teacherId: e.userId,
      organizationId: e.orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
    });
    const eleve = await db
      .insert(users)
      .values({ email: "eleve-expire@test.local", displayName: "Élève" })
      .returning({ id: users.id });
    const j = await joinGameByCode({
      code: partie.joinCode,
      userId: eleve[0]!.id,
      pseudo: "Élève",
    });
    if ("error" in j) throw new Error(j.error);

    // puis la licence expire
    await setOrgLicence({
      adminId: e.userId,
      organizationId: e.orgId,
      label: "Licence échue",
      startsAt: dans(-400),
      endsAt: dans(-5),
      maxTeachers: null,
    });
    const statut = await getLicenceStatus(e.orgId);
    expect(statut.state).toBe("expiree");
    expect(statut.blocking).toContain("expiré");

    // plus aucune partie nouvelle
    await expect(
      createClassGame({
        teacherId: e.userId,
        organizationId: e.orgId,
        periodicity: "quarter",
        humanTeamsCount: 1,
        botCount: 1,
      }),
    ).rejects.toThrow(/expiré/);

    // mais la classe en cours va jusqu'au bout : décisions et clôture passent
    await submitTeamDecisions({ gameId: partie.gameId, userId: eleve[0]!.id, payload: DECISIONS });
    const clos = await closeCurrentRound({ gameId: partie.gameId, teacherId: e.userId });
    expect(clos.roundIndex).toBe(1);
  });

  it("le plafond porte sur les enseignants, et refuse avant de créer le compte", async () => {
    const e = await nouvelEtablissement("plafond@lycee.test", "Plafond");
    await setOrgLicence({
      adminId: e.userId,
      organizationId: e.orgId,
      label: "Licence à un seul enseignant",
      startsAt: dans(-10),
      endsAt: dans(200),
      maxTeachers: 1,
    });

    const code = await createInvite({
      organizationId: e.orgId,
      role: "teacher",
      createdBy: e.userId,
    });
    const refuse = await registerTeacher({
      email: "second@lycee.test",
      password: "motdepasse!",
      displayName: "Second",
      schoolName: "peu importe",
      inviteCode: code,
    });
    expect("error" in refuse).toBe(true);
    if ("error" in refuse) expect(refuse.error).toContain("1 enseignant");

    // et le compte n'a PAS été créé : l'e-mail reste libre pour plus tard
    const compte = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "second@lycee.test"));
    expect(compte).toHaveLength(0);
  });

  it("les élèves ne comptent pas dans le plafond", async () => {
    const e = await nouvelEtablissement("eleves@lycee.test", "Eleves");
    await setOrgLicence({
      adminId: e.userId,
      organizationId: e.orgId,
      label: "Licence à un enseignant",
      startsAt: dans(-10),
      endsAt: dans(200),
      maxTeachers: 1,
    });
    const partie = await createClassGame({
      teacherId: e.userId,
      organizationId: e.orgId,
      periodicity: "quarter",
      humanTeamsCount: 4,
      botCount: 1,
    });
    for (let i = 0; i < 6; i++) {
      const u = await db
        .insert(users)
        .values({ email: `foule-${i}@test.local`, displayName: `Élève ${i}` })
        .returning({ id: users.id });
      const j = await joinGameByCode({
        code: partie.joinCode,
        userId: u[0]!.id,
        pseudo: `Élève ${i}`,
      });
      if ("error" in j) throw new Error(j.error);
    }
    const statut = await getLicenceStatus(e.orgId);
    expect(statut.teachers).toBe(1);
    expect(statut.blocking).toBeNull();
  });

  it("l'historique des licences est conservé : une vente ne s'efface pas", async () => {
    const licences = await listOrgLicences(orgId);
    expect(licences.length).toBeGreaterThanOrEqual(1);
    expect(licences[0]!.amountCents).toBe(90_000);
  });
});
