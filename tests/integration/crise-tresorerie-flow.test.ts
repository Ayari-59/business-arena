import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA CRISE DE TRÉSORERIE, DE LA SIMULATION À L'ÉCRAN DE L'ÉLÈVE.
 *
 * Le moteur savait déclarer une cessation de paiements depuis longtemps. Ce
 * qui manquait, c'est le chemin jusqu'à l'élève : la crise ne se disait que
 * dans une ligne d'un onglet, et la défaillance uniquement dans le classement
 * — que l'animateur révèle quand il le décide. Une entreprise gelée pouvait
 * donc ne rien voir, et continuer à remplir un formulaire que le moteur
 * ignorait.
 *
 * Ce test joue une vraie partie jusqu'à la crise et vérifie ce que la VUE
 * en dit. C'est la classe de défaut qui compte ici : des pièces justes, et
 * rien qui les relie.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

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
import type { RoundDecisions } from "@/engine/types";

/**
 * La décision qui coule une entreprise : produire beaucoup, vendre à perte,
 * dépenser le reste. Le but n'est pas la vraisemblance, c'est d'atteindre le
 * découvert au-delà du plafond avec les créances déjà cédées.
 */
const RUINEUSE: RoundDecisions = {
  price: 10,
  productionPlan: 9000,
  marketingBudget: 60000,
  qualityBudget: 40000,
  maintenanceBudget: 30000,
};

let prof: string;
let eleve: string;
let gameId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "crise@lycee.test",
    password: "motdepasse!",
    displayName: "M. Crise",
    schoolName: "Lycée de la Cessation",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;
  // Niveau 3 : le financement est ouvert, donc la trésorerie est jouable.
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 3,
  });
  gameId = partie.gameId;
  const u = await db
    .insert(users)
    .values({ email: "coule@test.local", displayName: "Coulé" })
    .returning({ id: users.id });
  eleve = u[0]!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Coulé" });
  if ("error" in j) throw new Error(j.error);
});

const jouer = async (decisions: RoundDecisions) => {
  await submitTeamDecisions({ gameId, userId: eleve, payload: decisions });
  await closeCurrentRound({ gameId, teacherId: prof });
  return (await getGameView(gameId, eleve))!;
};

describe("la crise remonte jusqu'à l'élève", () => {
  it("avant toute crise, aucune alerte — on n'annonce pas un incendie éteint", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.alerteTresorerie).toBeNull();
  });

  it("le tour qui bascule en cessation de paiements lève l'alerte", async () => {
    const vue = await jouer(RUINEUSE);
    expect(vue.lastResult!.treasury!.crisis).toBe(true);

    const alerte = vue.alerteTresorerie!;
    expect(alerte).not.toBeNull();
    expect(alerte.crise).toBe(true);
    expect(alerte.defaillante).toBe(false);
    expect(alerte.toursConsecutifs).toBe(1);
    expect(alerte.toursAvantDefaillance).toBe(2);
    // Le montant à trouver, c'est le dépassement du plafond : c'est lui que
    // l'élève doit couvrir, pas la trésorerie nette brute.
    expect(alerte.manque).toBeCloseTo(
      -alerte.tresorerieNette - alerte.plafondDecouvert,
      6,
    );
    expect(alerte.manque).toBeGreaterThan(0);
  });

  it("le plafond annoncé par l'alerte est celui du dossier bancaire", async () => {
    // Deux calculs séparés finiraient par diverger, et l'écran dirait de
    // repasser sous un seuil qui n'est pas celui que la banque applique.
    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.alerteTresorerie!.plafondDecouvert).toBeCloseTo(
      vue.bankFile!.overdraftLimit,
      6,
    );
  });

  it("le second tour de crise gèle l'entreprise, et l'alerte le dit", async () => {
    const vue = await jouer(RUINEUSE);
    const alerte = vue.alerteTresorerie!;
    expect(alerte.defaillante).toBe(true);
    expect(alerte.toursConsecutifs).toBeGreaterThanOrEqual(2);
    // LE POINT : l'élève l'apprend sans que le classement soit révélé.
    expect(vue.classement.revele).toBe(false);
  });
});
