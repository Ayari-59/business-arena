import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE FILET DE SÉCURITÉ DOIT ATTRAPER QUELQU'UN.
 *
 * Aux niveaux 1 à 3, ni emprunt ni apport des associés ne se décident. Une
 * équipe défaillante y restait à l'arrêt jusqu'à la fin de la partie : aucun
 * geste à faire, et l'enseignant n'en avait aucun non plus, puisque la seule
 * voie d'argent vers une équipe passe par une demande de subvention que le
 * bandeau ne proposait qu'aux niveaux qui ouvrent le financement.
 *
 * Et même proposée, la subvention ne dégelait jamais : le montant demandable
 * était plafonné au « manque » de la dernière clôture, alors que la subvention
 * est imposée, que le premier tour d'arrêt creuse encore le découvert, et que
 * le plafond de la banque rétrécit. Accordée en entier, elle laissait l'équipe
 * gelée, et l'enseignant ne savait pas pourquoi.
 *
 * Ce test joue le geste tel qu'il se fait en classe : une équipe défaillante
 * au niveau 2 dépose sa demande avec le montant que le formulaire lui propose,
 * l'enseignant l'accorde tel quel, et au tour suivant l'équipe décide de
 * nouveau, et ses décisions sont simulées.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
let invite = "";
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => invite }));

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { demandesDeLaPartie, trancherDemande } from "@/services/subvention.service";
import { montantDemandable } from "@/services/sauvetage";
import type { RoundDecisions } from "@/engine/types";
import { poserUneLicence } from "./helpers/licence";

const { demanderSubventionAction } = await import("@/app/arena/[gameId]/actions");

/** Produire beaucoup, vendre à perte, dépenser le reste : la ruine méthodique. */
const RUINEUSE: RoundDecisions = {
  price: 10,
  productionPlan: 9000,
  marketingBudget: 60000,
  qualityBudget: 40000,
  maintenanceBudget: 30000,
};

let prof = "";
let gameId = "";

beforeAll(async () => {
  const r = await registerTeacher({
    email: "degel@lycee.test",
    password: "motdepasse!",
    displayName: "M. Dégel",
    schoolName: "Lycée du Filet",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;
  await poserUneLicence(orgId, prof);
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    // Niveau 2 : ni emprunt ni apport des associés.
    level: 2,
  });
  gameId = partie.gameId;
  invite = (
    await db
      .insert(users)
      .values({ email: "gelee@test.local", displayName: "Gelée" })
      .returning({ id: users.id })
  )[0]!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: invite, pseudo: "Gelée" });
  if ("error" in j) throw new Error(j.error);
});

const jouer = async (decisions: RoundDecisions) => {
  await submitTeamDecisions({ gameId, userId: invite, payload: decisions });
  await closeCurrentRound({ gameId, teacherId: prof });
  return (await getGameView(gameId, invite))!;
};

describe("une équipe défaillante au niveau 2", () => {
  it("deux tours de ruine la mettent à l'arrêt, sans financement à décider", async () => {
    await jouer(RUINEUSE);
    const vue = await jouer(RUINEUSE);
    expect(vue.enabledDecisions.finance).toBe(false);
    expect(vue.alerteTresorerie?.defaillante).toBe(true);
    // Pas de verrou de sauvetage à ce niveau : ce qui est voulu, et tenu par
    // `crise-sans-financement.test.ts`.
    expect(vue.exigenceSauvetage).toBeNull();
  }, 120_000);

  it("demande le montant proposé, l'enseignant l'accorde, et elle décide de nouveau", async () => {
    const vue = (await getGameView(gameId, invite))!;
    const alerte = vue.alerteTresorerie!;
    // LE MONTANT QUE LE FORMULAIRE PROPOSE, et qu'il ne laisse pas dépasser.
    const propose = montantDemandable({ alerte, exigence: vue.exigenceSauvetage });
    expect(propose).not.toBeNull();
    // Plus que le « manque » de la dernière clôture : c'est le point.
    expect(propose!).toBeGreaterThan(alerte.manque);

    const fd = new FormData();
    fd.set("montant", String(propose));
    fd.set("motif", "Repartir pour écouler le stock invendu et revenir à l'équilibre.");
    expect((await demanderSubventionAction(gameId, { error: null }, fd)).error).toBeNull();

    // L'enseignant accorde ce qui est demandé, d'un geste.
    const demande = (await demandesDeLaPartie(gameId))[0]!;
    expect(demande.montant).toBe(propose);
    await trancherDemande({ requestId: demande.id, teacherId: prof, accord: true });

    // La clôture encaisse la subvention : l'entreprise repart.
    const apres = await jouer(RUINEUSE);
    expect(apres.lastResult!.incomeStatement.rescueSubsidy).toBeCloseTo(propose!, 2);
    expect(apres.lastResult!.treasury!.crisis).toBe(false);
    expect(apres.alerteTresorerie).toBeNull();

    // Et au tour suivant, ses décisions sont de nouveau simulées : elle produit
    // ce qu'elle décide de produire, et elle vend. (Le volume proposé peut être
    // nul, le stock des tours de ruine suffisant : on en décide un.)
    const relance = await jouer({ ...apres.proposedDecisions, productionPlan: 500 });
    expect(relance.lastResult!.production.produced).toBeGreaterThan(0);
    expect(relance.lastResult!.incomeStatement.revenue).toBeGreaterThan(0);
  }, 180_000);
});
