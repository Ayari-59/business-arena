import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE DROIT À L'EFFACEMENT ET À LA PORTABILITÉ (RGPD), POUR DE VRAI.
 *
 * « Supprimer mon compte » doit emporter ce que l'enseignant a créé (parties, classes,
 * examens avec noms et numéros d'étudiant) et les élèves sans compte qui n'y étaient
 * rattachés que par lui, sans toucher à un autre enseignant ni à un élève qui joue
 * ailleurs. « Exporter mes données » ne doit sortir que les données du compte. Et
 * l'administration supprime, sur demande, un établissement entier ou un élève.
 *
 * Les quatre clés `restrict` du schéma (games.created_by, classes.teacher_id,
 * competitions.organizer_id, hint_usages.user_id) font échouer une suppression naïve :
 * ces tests le verraient.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  classMembers,
  classes,
  examenCandidats,
  examens,
  games,
  organizations,
  players,
  users,
} from "@/db/schema";
import { createClassGame, joinGameByCode } from "@/services/game.service";
import { commencerLExamen, creerExamen, type SaisieDExamen } from "@/services/examen.service";
import { exporterMesDonnees } from "@/services/export-donnees.service";
import {
  REFUS_EFFACEMENT,
  supprimerCompteEnseignant,
  supprimerUnEleve,
  supprimerUnEtablissement,
} from "@/services/effacement.service";
import { etablissementSousLicence } from "./helpers/licence";

const SAISIE: SaisieDExamen = {
  nom: "Partiel RGPD",
  scenarioCode: "nova",
  niveau: 2,
  tours: 3,
  dureeTourMinutes: null,
  ouverture: null,
  fermeture: null,
  questions: false,
  resultatEstime: false,
  tentatives: 1,
  modeGraine: "lot",
  grilleCode: "business-arena-2026",
};

let n = 0;
async function eleve(pseudo: string): Promise<string> {
  n += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `guest-rgpd-${n}-${Date.now()}@guest.business-arena.local`, displayName: pseudo })
    .returning({ id: users.id });
  return u!.id;
}

async function existe(id: string): Promise<boolean> {
  return (await db.select({ id: users.id }).from(users).where(eq(users.id, id))).length === 1;
}

/** Un enseignant avec une partie rejointe par deux élèves, une classe et un examen passé. */
async function enseignantAvecDesEleves(nom: string) {
  const prof = await etablissementSousLicence(nom);
  const partie = await createClassGame({
    teacherId: prof.userId,
    organizationId: prof.orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    seed: 11,
  });
  const lea = await eleve(`Léa ${nom}`);
  const tom = await eleve(`Tom ${nom}`);
  for (const id of [lea, tom]) {
    const j = await joinGameByCode({ code: partie.joinCode!, userId: id });
    if ("error" in j) throw new Error(j.error);
  }
  const [classe] = await db
    .insert(classes)
    .values({ organizationId: prof.orgId, teacherId: prof.userId, name: `Classe ${nom}`, joinCode: `C${n}${Date.now()}` })
    .returning({ id: classes.id });
  await db.insert(classMembers).values({ classId: classe!.id, userId: lea });
  const ex = await creerExamen(prof.userId, SAISIE);
  const candidat = await eleve(`Candidat ${nom}`);
  const c = await commencerLExamen({
    code: ex.code,
    userId: candidat,
    identification: "saisie",
    nom: `Alice ${nom}`,
    numeroEtudiant: `21${n}0001`,
  });
  if (!("gameId" in c)) throw new Error(JSON.stringify(c));
  return { prof, partie, lea, tom, classeId: classe!.id, examenId: ex.id, candidat, partieDExamen: c.gameId };
}

let a: Awaited<ReturnType<typeof enseignantAvecDesEleves>>;
let b: Awaited<ReturnType<typeof enseignantAvecDesEleves>>;
let partout: string;

beforeAll(async () => {
  a = await enseignantAvecDesEleves("Alpha");
  b = await enseignantAvecDesEleves("Beta");
  // Un élève qui joue chez les deux : supprimer A ne doit pas le supprimer.
  partout = await eleve("Partout");
  for (const p of [a.partie, b.partie]) {
    const j = await joinGameByCode({ code: p.joinCode!, userId: partout });
    if ("error" in j) throw new Error(j.error);
  }
}, 120_000);

describe("« Exporter mes données »", () => {
  it("rend le compte et ce qu'il a créé, sans aucune donnée d'un autre compte", async () => {
    const e = await exporterMesDonnees(a.prof.userId);
    expect(e).not.toBeNull();
    expect(e!.compte.id).toBe(a.prof.userId);
    expect(e!.parties.map((p) => p.id)).toContain(a.partie.gameId);
    expect(e!.parties.find((p) => p.id === a.partie.gameId)!.eleves).toBe(3);
    expect(e!.examens).toHaveLength(1);
    expect(e!.examens[0]!.candidats).toBe(1);
    const texte = JSON.stringify(e);
    // Ni secret, ni élève, ni autre enseignant.
    expect(texte).not.toMatch(/password|motdepasse|sessionVersion/i);
    for (const etranger of ["Léa Alpha", "Tom Alpha", "Alice Alpha", "Partout", "Beta"]) {
      expect(texte, etranger).not.toContain(etranger);
    }
    expect(texte).not.toContain(b.prof.userId);
    expect(texte).not.toContain(b.partie.gameId);
    expect(texte).not.toContain(a.lea);
  });
});

describe("« Supprimer mon compte »", () => {
  it("emporte ses parties, classes et examens, et les élèves qui n'étaient qu'à lui", async () => {
    const r = await supprimerCompteEnseignant(a.prof.userId);
    expect(r.ok).toBe(true);
    expect(await existe(a.prof.userId)).toBe(false);
    expect(await db.select().from(games).where(inArray(games.id, [a.partie.gameId, a.partieDExamen]))).toEqual([]);
    expect(await db.select().from(classes).where(eq(classes.id, a.classeId))).toEqual([]);
    expect(await db.select().from(examens).where(eq(examens.id, a.examenId))).toEqual([]);
    expect(await db.select().from(examenCandidats).where(eq(examenCandidats.examenId, a.examenId))).toEqual([]);
    // Les élèves rattachés à lui seul sont partis, avec le candidat de son examen.
    for (const id of [a.lea, a.tom, a.candidat]) expect(await existe(id)).toBe(false);
  });

  it("ne touche ni un autre enseignant, ni ses élèves, ni l'élève qui joue aussi ailleurs", async () => {
    expect(await existe(b.prof.userId)).toBe(true);
    for (const id of [b.lea, b.tom, b.candidat, partout]) expect(await existe(id)).toBe(true);
    expect((await db.select().from(games).where(eq(games.id, b.partie.gameId))).length).toBe(1);
    expect((await db.select().from(players).where(eq(players.userId, partout))).length).toBe(1);
    expect((await db.select().from(examens).where(eq(examens.id, b.examenId))).length).toBe(1);
  });

  it("refuse un compte administrateur de la plateforme et un compte de démonstration", async () => {
    const [admin] = await db
      .insert(users)
      .values({ email: `admin-${Date.now()}@lycee.test`, displayName: "Admin", isPlatformAdmin: true, passwordHash: "x" })
      .returning({ id: users.id });
    expect(await supprimerCompteEnseignant(admin!.id)).toEqual({ ok: false, raison: REFUS_EFFACEMENT.administrateur });
    const [demo] = await db
      .insert(users)
      .values({ email: "prof@demo.business-arena.fr", displayName: "Démo", passwordHash: "x" })
      .returning({ id: users.id });
    expect(await supprimerCompteEnseignant(demo!.id)).toEqual({ ok: false, raison: REFUS_EFFACEMENT.demonstration });
    expect(await existe(admin!.id)).toBe(true);
    expect(await existe(demo!.id)).toBe(true);
  });
});

describe("les effacements sur demande de l'administration", () => {
  it("un élève : son identité, sa partie d'examen et sa note, mais pas la partie de classe", async () => {
    const r = await supprimerUnEleve(b.candidat);
    expect(r.ok).toBe(true);
    expect(await existe(b.candidat)).toBe(false);
    expect(await db.select().from(games).where(eq(games.id, b.partieDExamen))).toEqual([]);
    expect(await db.select().from(examenCandidats).where(eq(examenCandidats.examenId, b.examenId))).toEqual([]);
    expect((await db.select().from(games).where(eq(games.id, b.partie.gameId))).length).toBe(1);
  });

  it("refuse d'effacer un enseignant comme s'il était un élève", async () => {
    expect(await supprimerUnEleve(b.prof.userId)).toEqual({ ok: false, raison: REFUS_EFFACEMENT.pasUnEleve });
    expect(await existe(b.prof.userId)).toBe(true);
  });

  it("un établissement entier : ses enseignants, ses parties, ses examens et ses élèves", async () => {
    const r = await supprimerUnEtablissement(b.prof.orgId);
    expect(r.ok).toBe(true);
    expect(await db.select().from(organizations).where(eq(organizations.id, b.prof.orgId))).toEqual([]);
    expect(await existe(b.prof.userId)).toBe(false);
    for (const id of [b.lea, b.tom, partout]) expect(await existe(id)).toBe(false);
    expect(await db.select().from(games).where(eq(games.id, b.partie.gameId))).toEqual([]);
    expect(await db.select().from(examens).where(eq(examens.id, b.examenId))).toEqual([]);
  });

  it("refuse l'établissement « Grand public », qui porte les parties solo", async () => {
    const [pub] = await db
      .insert(organizations)
      .values({ name: "Grand public", slug: `public-${Date.now()}`, kind: "public" })
      .returning({ id: organizations.id });
    expect(await supprimerUnEtablissement(pub!.id)).toEqual({ ok: false, raison: REFUS_EFFACEMENT.etablissementPublic });
  });
});
