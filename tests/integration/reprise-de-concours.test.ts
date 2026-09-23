import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * RETROUVER SON ÉQUIPE APRÈS AVOIR PERDU SON APPAREIL.
 *
 * Un élève de concours n'a ni compte ni mot de passe : le cookie invité est
 * toute sa mémoire. Changer de poste, vider ses cookies ou passer au téléphone
 * le rendait méconnaissable — et, une fois les inscriptions closes, l'excluait
 * de son propre tournoi. Ce parcours vérifie que son code personnel lui rend
 * la MÊME identité, pas une nouvelle, et à toutes les étapes du concours.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { competitionEntries, competitionMembers, loginAttempts, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  codeDeRepriseDe,
  codesDeRepriseDuConcours,
  createCompetition,
  getPlayerCompetition,
  joinCompetition,
  MARQUEUR_REPRISE,
  reprendreSonIdentite,
  startQualification,
} from "@/services/competition.service";
import { MAX_ECHECS_REPRISE, normaliserCodeDeReprise } from "@/config/reprise";

let organizerId: string;
let competitionId: string;
let joinCode: string;
const lea = { userId: "", code: "" };
const tom = { userId: "", code: "" };

async function eleve(nom: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${nom}@reprise.local`, displayName: nom })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "orga@reprise.fr",
    password: "motdepasse!",
    displayName: "Mme Martin",
    schoolName: "IUT GEA",
  });
  if ("error" in result) throw new Error(result.error);
  organizerId = result.userId;
  const created = await createCompetition({
    organizerId,
    organizationId: (await getTeacherOrgId(organizerId))!,
    name: "Tournoi de reprise",
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  competitionId = created.competitionId;
  joinCode = created.joinCode;
});

describe("le code est remis à l'inscription", () => {
  it("chaque membre reçoit son code, et deux membres n'ont pas le même", async () => {
    lea.userId = await eleve("lea");
    tom.userId = await eleve("tom");
    const r1 = await joinCompetition({
      code: joinCode,
      userId: lea.userId,
      teamLabel: "Les Requins",
      pseudo: "Léa",
    });
    const r2 = await joinCompetition({
      code: joinCode,
      userId: tom.userId,
      teamLabel: "les requins", // même équipe, saisie à la va-vite
      pseudo: "Tom",
    });
    if ("error" in r1 || "error" in r2) throw new Error("inscription refusée");
    lea.code = r1.codeDeReprise!;
    tom.code = r2.codeDeReprise!;

    expect(lea.code).toHaveLength(8);
    expect(lea.code).toBe(normaliserCodeDeReprise(lea.code));
    // Le code appartient au JOUEUR, pas à l'équipe : deux coéquipiers ne
    // partagent pas le leur, sinon l'un jouerait pour l'autre.
    expect(tom.code).not.toBe(lea.code);
    // Une seule équipe, deux membres.
    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId));
    expect(entries).toHaveLength(1);
    expect(entries[0]!.memberUserIds).toHaveLength(2);
  });

  it("se réinscrire ne change pas le code déjà noté", async () => {
    const avant = await codeDeRepriseDe(competitionId, lea.userId);
    await joinCompetition({ code: joinCode, userId: lea.userId, teamLabel: "Les Requins" });
    expect(await codeDeRepriseDe(competitionId, lea.userId)).toBe(avant);
  });

  it("l'organisateur peut relire les codes de son concours", async () => {
    const codes = await codesDeRepriseDuConcours(competitionId, organizerId);
    expect(codes).toHaveLength(2);
    expect(codes.map((c) => c.pseudo).sort()).toEqual(["Léa", "Tom"]);
    expect(codes.every((c) => c.teamLabel === "Les Requins")).toBe(true);
    // Mais seulement de SON concours.
    await expect(codesDeRepriseDuConcours(competitionId, tom.userId)).rejects.toThrow();
  });
});

describe("la reprise rend la même identité", () => {
  it("le code de Léa rend l'identité de Léa, et son équipe", async () => {
    const repris = await reprendreSonIdentite({ code: lea.code, ip: "10.0.0.1" });
    if ("error" in repris) throw new Error(repris.error);
    expect(repris.userId).toBe(lea.userId);
    expect(repris.competitionId).toBe(competitionId);
    expect(repris.teamLabel).toBe("Les Requins");
  });

  it("le code se retape comme il se lit : tiret, minuscules, espaces", async () => {
    const tel = `${lea.code.slice(0, 4)}-${lea.code.slice(4)}`.toLowerCase();
    const repris = await reprendreSonIdentite({ code: ` ${tel} `, ip: "10.0.0.1" });
    expect("error" in repris ? repris.error : repris.userId).toBe(lea.userId);
  });

  it("un code inconnu est refusé sans dire lesquels existent", async () => {
    const refus = await reprendreSonIdentite({ code: "ZZZZ-ZZZZ", ip: "10.0.0.2" });
    expect("error" in refus && refus.error).toMatch(/inconnu/i);
    // Un code mal formé reçoit le même message qu'un code inconnu.
    const malforme = await reprendreSonIdentite({ code: "abc", ip: "10.0.0.2" });
    expect("error" in malforme && malforme.error).toBe("error" in refus && refus.error);
  });
});

describe("les tentatives sont comptées", () => {
  it("après trop d'échecs, la même adresse attend", async () => {
    const ip = "10.0.0.9";
    for (let i = 0; i < MAX_ECHECS_REPRISE; i++) {
      await reprendreSonIdentite({ code: "ZZZZ-ZZZZ", ip });
    }
    const bloque = await reprendreSonIdentite({ code: lea.code, ip });
    expect("error" in bloque && bloque.error).toMatch(/Trop de tentatives/);

    // Une autre adresse n'est pas punie pour celle-là.
    const ailleurs = await reprendreSonIdentite({ code: lea.code, ip: "10.0.0.10" });
    expect("error" in ailleurs).toBe(false);

    // Et le compteur de l'adresse bloquée n'a pas touché celui de la connexion
    // enseignante : ce sont deux marqueurs distincts.
    const echecs = await db.select().from(loginAttempts).where(eq(loginAttempts.ip, ip));
    expect(echecs.every((e) => e.email === MARQUEUR_REPRISE)).toBe(true);
  });

  it("une reprise réussie remet le compteur de son adresse à zéro", async () => {
    const ip = "10.0.0.11";
    await reprendreSonIdentite({ code: "ZZZZ-ZZZZ", ip });
    expect(await db.select().from(loginAttempts).where(eq(loginAttempts.ip, ip))).toHaveLength(1);
    await reprendreSonIdentite({ code: tom.code, ip });
    expect(await db.select().from(loginAttempts).where(eq(loginAttempts.ip, ip))).toHaveLength(0);
  });
});

describe("une fois les inscriptions closes", () => {
  it("la reprise marche encore, et ramène à la partie en cours", async () => {
    // Le cas qui n'avait aucun recours : le tournoi tourne, l'élève a changé
    // d'appareil, et il ne peut plus se réinscrire.
    // Une deuxième équipe, sans quoi il n'y a pas de poule à tirer.
    const rival = await eleve("rival");
    await joinCompetition({ code: joinCode, userId: rival, teamLabel: "Les Dauphins" });
    await startQualification({ competitionId, organizerId });
    expect(
      "error" in (await joinCompetition({ code: joinCode, userId: await eleve("tard"), teamLabel: "X" })),
    ).toBe(true);

    const repris = await reprendreSonIdentite({ code: tom.code, ip: "10.0.0.12" });
    if ("error" in repris) throw new Error(repris.error);
    expect(repris.userId).toBe(tom.userId);

    const mine = await getPlayerCompetition(competitionId, repris.userId);
    expect(mine!.myTeamLabel).toBe("Les Requins");
    expect(mine!.myGameId).not.toBeNull();
  });

  it("le code reste lisible par son propriétaire et par l'organisateur", async () => {
    expect(await codeDeRepriseDe(competitionId, tom.userId)).toBe(tom.code);
    const rows = await db
      .select()
      .from(competitionMembers)
      .where(eq(competitionMembers.competitionId, competitionId));
    // Léa, Tom et la rivale inscrite juste avant le tirage : un code chacun.
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((r) => r.recoveryCode)).size).toBe(3);
  });
});
