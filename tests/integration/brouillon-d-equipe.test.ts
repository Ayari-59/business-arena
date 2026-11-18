import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE BROUILLON D'ÉQUIPE (`config/brouillon-d-equipe.ts`, `services/brouillon-equipe.service.ts`).
 *
 * La feuille de décision enregistre la saisie de l'équipe sur le serveur, dans la ligne
 * `decisions` du tour au statut `draft`. Ce fichier tient les promesses du chantier :
 *  - un coéquipier relit le brouillon, avec qui l'a modifié et quand ; une autre équipe, non ;
 *  - le dernier enregistrement gagne ; jamais par-dessus une décision validée ;
 *  - hors fenêtre du planning et pendant l'attente du lancement, rien ne s'enregistre ;
 *  - valider après un brouillon donne exactement la décision d'aujourd'hui ;
 *  - LA CLÔTURE NE JOUE JAMAIS UN BROUILLON : en classe, au tour d'essai et en solo, une
 *    équipe qui n'a qu'un brouillon est traitée exactement comme une équipe sans décision.
 *    Ces tests-là posent la ligne `draft` directement en base, comme le schéma le permettait
 *    déjà : ils se lisent rouges sur la clôture d'avant, qui jouait le brouillon.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { decisions, games, roundResults, rounds, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  createSoloGame,
  getTeacherGameView,
  joinGameByCode,
  resolveCurrentRound,
  setRoundWindows,
  submitTeamDecisions,
} from "@/services/game.service";
import { findUserTeam } from "@/services/round-resolution.service";
import * as brouillon from "@/services/brouillon-equipe.service";
import { SOURCE_RECONDUITE } from "@/config/decision-source";
import { LIMITES_DU_BROUILLON } from "@/config/brouillon-d-equipe";
import type { RoundDecisions } from "@/engine/types";
import { poserUneLicence } from "./helpers/licence";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

/** Un brouillon reconnaissable : un prix que personne ne joue par hasard. */
const DRAFT: RoundDecisions = { ...DECISIONS, price: 20, productionPlan: 900 };

let teacherId: string;
let orgId: string;
let compteur = 0;

async function eleve(nom: string): Promise<string> {
  compteur += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `brouillon-${compteur}@guest.business-arena.local`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "brouillon@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Brouillon",
    schoolName: "Lycée du Brouillon",
  });
  if ("error" in r) throw new Error(r.error);
  teacherId = r.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
  await poserUneLicence(orgId, teacherId);
});

/**
 * Une classe à deux équipes humaines et un bot, graine fixée : Alice et Bruno dans la
 * première équipe, Chloé dans la seconde (l'affectation va à l'équipe la moins remplie).
 */
async function classe(options: { essai?: boolean; seed?: number } = {}) {
  const { gameId, joinCode } = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    scenarioCode: "conseil",
    seed: options.seed ?? 1234,
    ...(options.essai ? { essai: { tours: 1, enchainement: "manuel" as const } } : {}),
  });
  const alice = await eleve("Alice");
  const chloe = await eleve("Chloé");
  const bruno = await eleve("Bruno");
  for (const [id, pseudo] of [
    [alice, "Alice"],
    [chloe, "Chloé"],
    [bruno, "Bruno"],
  ] as const) {
    const j = await joinGameByCode({ code: joinCode, userId: id, pseudo });
    if (!("gameId" in j)) throw new Error("adhésion refusée");
  }
  const equipeA = (await findUserTeam(gameId, alice)).team!;
  const equipeC = (await findUserTeam(gameId, chloe)).team!;
  expect((await findUserTeam(gameId, bruno)).team!.id).toBe(equipeA.id);
  expect(equipeC.id).not.toBe(equipeA.id);
  return { gameId, alice, bruno, chloe, equipeA: equipeA.id, equipeC: equipeC.id };
}

async function tourCourant(gameId: string) {
  const [g] = await db.select().from(games).where(eq(games.id, gameId));
  const [r] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.gameId, gameId), eq(rounds.index, g!.currentRound)));
  return r!;
}

async function ligne(roundId: string, teamId: string) {
  const [d] = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.roundId, roundId), eq(decisions.teamId, teamId)));
  return d;
}

/** Une ligne `draft` posée en base, telle que le schéma la permettait déjà (#398). */
async function brouillonEnBase(roundId: string, teamId: string) {
  await db.insert(decisions).values({
    roundId,
    teamId,
    payload: DRAFT,
    status: "draft",
    justification: "Une note de brouillon",
  });
}

/** Ce que la clôture a fait d'une équipe : sa ligne de décision et son résultat. */
async function apresLaCloture(roundId: string, teamId: string) {
  const d = (await ligne(roundId, teamId))!;
  const [r] = await db
    .select()
    .from(roundResults)
    .where(and(eq(roundResults.roundId, roundId), eq(roundResults.teamId, teamId)));
  return {
    status: d.status,
    payload: d.payload,
    decisionSource: d.decisionSource,
    justification: d.justification,
    validatedBy: d.validatedBy,
    revenue: r!.revenue,
    netIncome: r!.netIncome,
    netTreasury: r!.netTreasury,
  };
}

const saisieDe = (prix: string, volume = "900") => ({ price: prix, productionPlan: volume, justification: "On tente" });

describe("le brouillon se partage dans l'équipe, et seulement dans l'équipe", () => {
  it("un brouillon enregistré par Alice est relu par Bruno, avec qui et quand", async () => {
    const { gameId, alice, bruno } = await classe();
    const quand = new Date();
    const etat = await brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("73.7"), now: quand });
    expect(etat).toEqual({ quand: quand.toISOString(), par: "Alice", parVous: true });

    const lu = await brouillon.lireLeBrouillon({ gameId, userId: bruno });
    expect(lu).toEqual({
      saisie: { price: "73.7", productionPlan: "900", justification: "On tente" },
      quand: quand.toISOString(),
      par: "Alice",
      parVous: false,
    });
    // Alice le relit comme le sien.
    expect((await brouillon.lireLeBrouillon({ gameId, userId: alice }))!.parVous).toBe(true);
  });

  it("Chloé, d'une autre équipe, ne le lit pas, ni par la lecture ni par le sondage", async () => {
    const { gameId, alice, chloe, equipeA } = await classe();
    await brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("73.7") });
    expect(await brouillon.lireLeBrouillon({ gameId, userId: chloe })).toBeNull();
    // Un inconnu de la partie non plus.
    const intrus = await eleve("Intrus");
    expect(await brouillon.lireLeBrouillon({ gameId, userId: intrus })).toBeNull();
    // Le sondage de Chloé est celui de son équipe : il n'annonce rien.
    const tour = await tourCourant(gameId);
    const equipeC = (await findUserTeam(gameId, chloe)).team!.id;
    expect(await brouillon.etatDuBrouillon({ roundId: tour.id, teamId: equipeC, userId: chloe })).toBeNull();
    expect(await brouillon.etatDuBrouillon({ roundId: tour.id, teamId: equipeA, userId: alice })).toMatchObject({
      par: "Alice",
      parVous: true,
    });
  });

  it("le dernier enregistrement gagne, avec son auteur et son heure", async () => {
    const { gameId, alice, bruno, equipeA } = await classe();
    const t1 = new Date(Date.now() - 10_000);
    const t2 = new Date(Date.now() - 5_000);
    await brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("73.7"), now: t1 });
    await brouillon.enregistrerLeBrouillon({ gameId, userId: bruno, saisie: saisieDe("68.4"), now: t2 });
    const lu = (await brouillon.lireLeBrouillon({ gameId, userId: alice }))!;
    expect(lu.saisie.price).toBe("68.4");
    expect(lu).toMatchObject({ par: "Bruno", parVous: false, quand: t2.toISOString() });
    // Une seule ligne pour l'équipe et le tour.
    const tour = await tourCourant(gameId);
    const toutes = await db
      .select()
      .from(decisions)
      .where(and(eq(decisions.roundId, tour.id), eq(decisions.teamId, equipeA)));
    expect(toutes).toHaveLength(1);
    expect(toutes[0]!.status).toBe("draft");
    expect(toutes[0]!.modifiePar).toBe(bruno);
  });

  it("un même élève n'enregistre pas deux fois dans la même seconde", async () => {
    const { gameId, alice } = await classe();
    const t = new Date();
    await brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("70"), now: t });
    await expect(
      brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("71"), now: new Date(t.getTime() + 300) }),
    ).rejects.toThrow(brouillon.BROUILLON_TROP_RAPPROCHE);
    await expect(
      brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("72"), now: new Date(t.getTime() + 1_500) }),
    ).resolves.toBeTruthy();
  });

  it("la charge est bornée, et un champ que la feuille ne porte pas ne s'enregistre pas", async () => {
    const { gameId, alice, bruno } = await classe();
    const trop = Object.fromEntries(
      Array.from({ length: LIMITES_DU_BROUILLON.champs + 1 }, (_, i) => [`product.p${i}.price`, "1"]),
    );
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: trop })).rejects.toThrow(
      /trop grand/,
    );
    await expect(
      brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: { justification: "x".repeat(5_001) } }),
    ).rejects.toThrow(/trop grand/);
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: { price: 59 } })).rejects.toThrow(
      /illisible/,
    );
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: ["price"] })).rejects.toThrow(
      /illisible/,
    );
    await brouillon.enregistrerLeBrouillon({
      gameId,
      userId: alice,
      saisie: { price: "61", seed: "1", teamId: "autre", "product.bonnet.price": "40" },
    });
    expect((await brouillon.lireLeBrouillon({ gameId, userId: bruno }))!.saisie).toEqual({
      price: "61",
      "product.bonnet.price": "40",
    });
  });

  it("l'enseignant de la partie le voit au pilotage, « pas encore validé », avec qui et quand", async () => {
    const { gameId, alice, equipeA, equipeC } = await classe();
    const quand = new Date();
    await brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("20"), now: quand });
    const vue = (await getTeacherGameView(gameId, teacherId))!;
    const a = vue.teams.find((t) => t.teamId === equipeA)!;
    expect(a.hasSubmitted).toBe(false);
    expect(a.decisionsAuPilotage).toMatchObject({
      etat: "brouillon",
      modification: { nom: "Alice", quand: quand.toISOString() },
    });
    expect(a.decisionsAuPilotage!.principales.find((l) => /^20,00\s€$/u.test(l.valeur))).toBeTruthy();
    // Les repères ne s'appliquent au brouillon que pour le prix sous le coût variable.
    expect(a.decisionsAuPilotage!.reperes).toEqual(["Prix sous le coût variable : chaque vente fait perdre de l'argent."]);
    expect(vue.teams.find((t) => t.teamId === equipeC)!.decisionsAuPilotage!.etat).toBe("aucune");
  });
});

describe("le brouillon s'arrête où la validation s'arrête", () => {
  it("jamais par-dessus une décision validée", async () => {
    const { gameId, alice, bruno, equipeA } = await classe();
    await submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS });
    await expect(
      brouillon.enregistrerLeBrouillon({ gameId, userId: bruno, saisie: saisieDe("20") }),
    ).rejects.toThrow(brouillon.BROUILLON_APRES_VALIDATION);
    const d = (await ligne((await tourCourant(gameId)).id, equipeA))!;
    expect(d.status).toBe("validated");
    expect(d.payload).toEqual(DECISIONS);
    expect(await brouillon.lireLeBrouillon({ gameId, userId: bruno })).toBeNull();
  });

  it("refusé pendant l'attente du lancement, comme la validation", async () => {
    const { gameId, alice } = await classe();
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    const message = "Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.";
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(message);
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("70") })).rejects.toThrow(
      message,
    );
  });

  it("refusé hors des fenêtres du planning, comme la validation", async () => {
    const { gameId, alice } = await classe();
    const passee = new Date(Date.now() - 60_000);
    await setRoundWindows({
      gameId,
      teacherId,
      windows: [{ index: 1, opensAt: new Date(Date.now() - 3_600_000), deadline: passee }],
    });
    // Le même refus que la validation, dans les mêmes mots.
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(
      /Ce tour est clôturé depuis le/,
    );
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: alice, saisie: saisieDe("70") })).rejects.toThrow(
      /^Ce tour est clôturé depuis le/,
    );
  });

  it("refusé en solo : il n'y a pas d'équipe à qui le montrer", async () => {
    const joueur = await eleve("Solène");
    const gameId = await createSoloGame(joueur, "quarter", 2);
    await expect(brouillon.enregistrerLeBrouillon({ gameId, userId: joueur, saisie: saisieDe("70") })).rejects.toThrow(
      brouillon.BROUILLON_EN_SOLO,
    );
  });
});

describe("valider après un brouillon donne la décision d'aujourd'hui", () => {
  it("même ligne validée, même résultat, et la saisie du brouillon ne reste pas", async () => {
    const avec = await classe({ seed: 777 });
    const sans = await classe({ seed: 777 });
    await brouillon.enregistrerLeBrouillon({ gameId: avec.gameId, userId: avec.bruno, saisie: saisieDe("20") });
    for (const p of [avec, sans]) {
      await submitTeamDecisions({ gameId: p.gameId, userId: p.alice, payload: DECISIONS, justification: "Notre note" });
    }
    const tA = await tourCourant(avec.gameId);
    const tS = await tourCourant(sans.gameId);
    const dA = (await ligne(tA.id, avec.equipeA))!;
    const dS = (await ligne(tS.id, sans.equipeA))!;
    expect(dA.status).toBe("validated");
    expect(dA.payload).toEqual(dS.payload);
    expect(dA.payload).toEqual(DECISIONS);
    expect(dA.decisionSource).toEqual(dS.decisionSource);
    expect(dA.justification).toBe("Notre note");
    expect(dA.validatedBy).toBe(avec.alice);
    expect(dA.saisie).toBeNull();
    expect(await brouillon.lireLeBrouillon({ gameId: avec.gameId, userId: avec.bruno })).toBeNull();

    for (const p of [avec, sans]) await closeCurrentRound({ gameId: p.gameId, teacherId, expectedRound: 1 });
    const rA = await apresLaCloture(tA.id, avec.equipeA);
    const rS = await apresLaCloture(tS.id, sans.equipeA);
    expect({ ...rA, validatedBy: null }).toEqual({ ...rS, validatedBy: null });
    expect(rA.status).toBe("locked");
  });
});

describe("la clôture ne joue jamais un brouillon", () => {
  it("en classe : l'équipe qui n'a qu'un brouillon est reconduite, comme sans décision", async () => {
    const avec = await classe({ seed: 4242 });
    const sans = await classe({ seed: 4242 });
    const tA = await tourCourant(avec.gameId);
    const tS = await tourCourant(sans.gameId);
    await brouillonEnBase(tA.id, avec.equipeA);
    for (const p of [avec, sans]) await closeCurrentRound({ gameId: p.gameId, teacherId, expectedRound: 1 });

    const rA = await apresLaCloture(tA.id, avec.equipeA);
    const rS = await apresLaCloture(tS.id, sans.equipeA);
    expect(rA.status).toBe("carried_over");
    expect(rA.decisionSource).toEqual(SOURCE_RECONDUITE);
    expect(rA.payload.price).not.toBe(DRAFT.price);
    expect(rA).toEqual(rS);
    // Rien du brouillon ne reste sur la ligne close.
    const d = (await ligne(tA.id, avec.equipeA))!;
    expect(d.justification).toBeNull();
    expect(d.saisie).toBeNull();
    // L'autre équipe et le bot ne bougent pas non plus.
    expect(await apresLaCloture(tA.id, avec.equipeC)).toEqual(await apresLaCloture(tS.id, sans.equipeC));
  });

  it("le tour suivant part de la reconduction, pas du brouillon", async () => {
    const p = await classe({ seed: 99 });
    const t1 = await tourCourant(p.gameId);
    await brouillon.enregistrerLeBrouillon({ gameId: p.gameId, userId: p.alice, saisie: saisieDe("20") });
    await closeCurrentRound({ gameId: p.gameId, teacherId, expectedRound: 1 });
    const d = (await ligne(t1.id, p.equipeA))!;
    expect(d.status).toBe("carried_over");
    expect(d.payload.price).not.toBe(20);
    expect(d.modifiePar).toBeNull();
    expect(d.modifieLe).toBeNull();
  });

  it("au tour d'essai : même règle", async () => {
    const avec = await classe({ seed: 31, essai: true });
    const sans = await classe({ seed: 31, essai: true });
    const tA = await tourCourant(avec.gameId);
    const tS = await tourCourant(sans.gameId);
    await brouillonEnBase(tA.id, avec.equipeA);
    for (const p of [avec, sans]) await closeCurrentRound({ gameId: p.gameId, teacherId, expectedRound: 1 });
    const rA = await apresLaCloture(tA.id, avec.equipeA);
    expect(rA.status).toBe("carried_over");
    expect(rA).toEqual(await apresLaCloture(tS.id, sans.equipeA));
  });

  it("en solo : la décision jouée est celle du joueur, jamais un brouillon resté en base", async () => {
    const joueur = await eleve("Solal");
    const gameId = await createSoloGame(joueur, "quarter", 2);
    const tour = await tourCourant(gameId);
    const equipe = (await findUserTeam(gameId, joueur)).team!.id;
    await brouillonEnBase(tour.id, equipe);
    await resolveCurrentRound({ gameId, userId: joueur, playerDecisions: DECISIONS });
    const d = (await ligne(tour.id, equipe))!;
    expect(d.status).toBe("locked");
    expect(d.payload).toEqual(DECISIONS);
    // Et les bots jouent leurs stratégies, sans ligne de brouillon.
    const bots = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "bot")));
    for (const b of bots) expect((await ligne(tour.id, b.id))!.status).toBe("locked");
  });
});
