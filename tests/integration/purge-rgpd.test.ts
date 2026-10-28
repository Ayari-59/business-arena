import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA PURGE DE CHAQUE NUIT APPLIQUE LES DURÉES ANNONCÉES, ET RIEN DE PLUS.
 *
 * Les mentions légales promettent des durées (config/conservation.ts) ; ce test les
 * vérifie sur une vraie base : ce qui a dépassé sa durée part, ce qui ne l'a pas dépassée
 * reste. Les deux côtés comptent : une purge qui ne supprime rien ment aux familles, une
 * purge qui supprime trop efface le travail d'une classe.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  demandesDeDevis,
  examenCandidats,
  examens,
  games,
  loginAttempts,
  orientationRequests,
  players,
  rounds,
  teams,
  users,
} from "@/db/schema";
import { createClassGame, createSoloGame, joinGameByCode } from "@/services/game.service";
import { commencerLExamen, creerExamen, type SaisieDExamen } from "@/services/examen.service";
import { purger, seuilsDePurge, type BilanDePurge } from "@/services/purge.service";
import type { Courriel } from "@/lib/courriel";
import { etablissementSousLicence } from "./helpers/licence";

const JOUR = 24 * 60 * 60 * 1000;
const maintenant = new Date();
const ilYA = (jours: number) => new Date(maintenant.getTime() - jours * JOUR);

let n = 0;
async function invite(pseudo: string, creeLe = maintenant): Promise<string> {
  n += 1;
  const [u] = await db
    .insert(users)
    .values({
      email: `guest-purge-${n}-${Date.now()}@guest.business-arena.local`,
      displayName: pseudo,
      createdAt: creeLe,
      updatedAt: creeLe,
    })
    .returning({ id: users.id });
  return u!.id;
}

async function enseignant(email: string, derniereConnexion: Date, averti: Date | null = null): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email,
      displayName: `Prof ${email}`,
      passwordHash: "haché",
      provenance: "inscription",
      createdAt: derniereConnexion,
      updatedAt: derniereConnexion,
      derniereConnexionLe: derniereConnexion,
      avertiInactiviteLe: averti,
    })
    .returning({ id: users.id });
  return u!.id;
}

/** Vieillir une partie entière : elle, ses tours, ses équipes et ses joueurs. */
async function vieillir(gameId: string, date: Date): Promise<void> {
  await db.update(games).set({ createdAt: date, updatedAt: date }).where(eq(games.id, gameId));
  await db.update(rounds).set({ createdAt: date, updatedAt: date }).where(eq(rounds.gameId, gameId));
  const equipes = (await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId))).map((t) => t.id);
  if (equipes.length) {
    await db.update(players).set({ createdAt: date, updatedAt: date }).where(inArray(players.teamId, equipes));
  }
}

const existe = async (id: string) => (await db.select({ id: users.id }).from(users).where(eq(users.id, id))).length === 1;
const partieExiste = async (id: string) => (await db.select({ id: games.id }).from(games).where(eq(games.id, id))).length === 1;

const envoyes: Courriel[] = [];
let bilan: BilanDePurge;

type Cle =
  | "joueurSolo" | "soloVieilleIp" | "soloIpRecente" | "inviteInactif" | "soloDuDormeur" | "prof"
  | "inviteActif" | "classeRecente" | "classeAncienne" | "examenAncien" | "candidatAncien" | "examenRecent"
  | "devisAncien" | "devisRecent" | "orientationRecontactee" | "aAvertir" | "aSupprimer" | "avertiRecemment"
  | "revenu" | "demo" | "sansCourriel";
const ids = {} as Record<Cle, string>;

beforeAll(async () => {
  // Tentatives de connexion.
  await db.insert(loginAttempts).values([
    { email: "vieille@lycee.test", ip: "10.0.0.1", createdAt: new Date(maintenant.getTime() - 25 * 60 * 60 * 1000) },
    { email: "recente@lycee.test", ip: "10.0.0.2", createdAt: new Date(maintenant.getTime() - 60 * 60 * 1000) },
  ]);

  // Parties solo : l'adresse IP d'il y a 8 jours part, celle d'hier reste.
  ids.joueurSolo = await invite("Solo");
  ids.soloVieilleIp = await createSoloGame(ids.joueurSolo, "quarter", 2, 1, false, "nova", undefined, "203.0.113.8");
  await db.update(games).set({ createdAt: ilYA(8) }).where(eq(games.id, ids.soloVieilleIp));
  ids.soloIpRecente = await createSoloGame(ids.joueurSolo, "quarter", 2, 1, false, "nova", undefined, "203.0.113.9");
  await db.update(games).set({ createdAt: ilYA(1) }).where(eq(games.id, ids.soloIpRecente));

  // Un invité inactif depuis 13 mois, avec sa partie solo : tous deux partent.
  ids.inviteInactif = await invite("Dormeur", ilYA(400));
  ids.soloDuDormeur = await createSoloGame(ids.inviteInactif, "quarter", 2, 1, false, "nova");
  await vieillir(ids.soloDuDormeur, ilYA(400));

  // Un invité ancien mais qui joue en ce moment dans une classe : il reste.
  const prof = await etablissementSousLicence("Purge");
  ids.prof = prof.userId;
  ids.inviteActif = await invite("Assidu", ilYA(800));
  const classeRecente = await createClassGame({
    teacherId: prof.userId,
    organizationId: prof.orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    seed: 3,
  });
  ids.classeRecente = classeRecente.gameId;
  const j = await joinGameByCode({ code: classeRecente.joinCode!, userId: ids.inviteActif });
  if ("error" in j) throw new Error(j.error);

  // Une partie de classe sans activité depuis 13 mois : elle part, l'enseignant reste.
  const classeAncienne = await createClassGame({
    teacherId: prof.userId,
    organizationId: prof.orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    seed: 4,
  });
  ids.classeAncienne = classeAncienne.gameId;
  await vieillir(ids.classeAncienne, ilYA(400));

  // Un examen passé il y a 13 mois : nom, numéro et note partent ; un examen récent reste.
  const saisie: SaisieDExamen = {
    nom: "Partiel ancien",
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
  const ancien = await creerExamen(prof.userId, saisie);
  ids.examenAncien = ancien.id;
  ids.candidatAncien = await invite("Candidat", ilYA(400));
  const c = await commencerLExamen({
    code: ancien.code,
    userId: ids.candidatAncien,
    identification: "saisie",
    nom: "Alice Ancienne",
    numeroEtudiant: "219999",
  });
  if (!("gameId" in c)) throw new Error(JSON.stringify(c));
  await db.update(examens).set({ createdAt: ilYA(400), updatedAt: ilYA(400) }).where(eq(examens.id, ancien.id));
  await db.update(examenCandidats).set({ commenceLe: ilYA(400), createdAt: ilYA(400) }).where(eq(examenCandidats.examenId, ancien.id));
  await vieillir(c.gameId, ilYA(400));
  ids.examenRecent = (await creerExamen(prof.userId, { ...saisie, nom: "Partiel récent" })).id;

  // Les demandes : une de 4 ans part ; une ancienne traitée il y a un an reste.
  const devis = {
    offre: "classe",
    nom: "Mme Devis",
    fonction: "Proviseure",
    organisation: "Lycée",
    email: "devis@lycee.test",
  };
  const [vieux] = await db
    .insert(demandesDeDevis)
    .values({ ...devis, createdAt: ilYA(4 * 365), updatedAt: ilYA(4 * 365) })
    .returning({ id: demandesDeDevis.id });
  ids.devisAncien = vieux!.id;
  const [recent] = await db.insert(demandesDeDevis).values(devis).returning({ id: demandesDeDevis.id });
  ids.devisRecent = recent!.id;
  const [orientation] = await db
    .insert(orientationRequests)
    .values({
      name: "M. Orientation",
      school: "Lycée",
      email: "orientation@lycee.test",
      diplome: "bts-cg",
      semestre: "1",
      objectif: "x",
      recommendation: {},
      createdAt: ilYA(4 * 365),
      updatedAt: ilYA(4 * 365),
      handledAt: ilYA(365),
    })
    .returning({ id: orientationRequests.id });
  ids.orientationRecontactee = orientation!.id;

  // Les enseignants inactifs.
  ids.aAvertir = await enseignant("bientot@lycee.test", ilYA(3 * 365 - 20));
  ids.aSupprimer = await enseignant("parti@lycee.test", ilYA(3 * 365 + 40), ilYA(31));
  ids.avertiRecemment = await enseignant("delai@lycee.test", ilYA(3 * 365 + 5), ilYA(10));
  ids.revenu = await enseignant("revenu@lycee.test", ilYA(5), ilYA(40));
  ids.demo = await enseignant("prof@demo.business-arena.fr", ilYA(5 * 365));
  ids.sansCourriel = await enseignant("injoignable@lycee.test", ilYA(3 * 365 - 20));

  bilan = await purger({
    maintenant,
    envoyer: async (c) => {
      // L'hébergement sans clé : rien ne part pour cette adresse-là.
      if (c.a === "injoignable@lycee.test") return { envoye: false, raison: "non_configure" };
      envoyes.push(c);
      return { envoye: true };
    },
  });
}, 180_000);

describe("les seuils", () => {
  it("se calculent à partir de l'heure seule, avec les durées décidées", () => {
    const s = seuilsDePurge(new Date("2027-06-15T02:00:00Z"));
    expect(s.tentatives.toISOString()).toBe("2027-06-14T02:00:00.000Z");
    expect(s.ipSolo.toISOString()).toBe("2027-06-08T02:00:00.000Z");
    expect(s.invites.toISOString()).toBe("2026-06-15T02:00:00.000Z");
    expect(s.parties.toISOString()).toBe("2026-06-15T02:00:00.000Z");
    expect(s.examens.toISOString()).toBe("2026-06-15T02:00:00.000Z");
    expect(s.enseignantsASupprimer.toISOString()).toBe("2024-06-15T02:00:00.000Z");
    expect(s.enseignantsAAvertir.toISOString()).toBe("2024-07-15T02:00:00.000Z");
    expect(s.demandes.toISOString()).toBe("2024-06-15T02:00:00.000Z");
  });
});

describe("la purge", () => {
  it("supprime les tentatives de connexion de plus de 24 heures, garde les autres", async () => {
    const restent = (await db.select({ email: loginAttempts.email }).from(loginAttempts)).map((r) => r.email);
    expect(restent).toContain("recente@lycee.test");
    expect(restent).not.toContain("vieille@lycee.test");
    expect(bilan.tentatives).toBeGreaterThanOrEqual(1);
  });

  it("efface l'adresse IP des parties solo après 7 jours, sans supprimer la partie", async () => {
    const [vieille] = await db.select().from(games).where(eq(games.id, ids.soloVieilleIp));
    const [recente] = await db.select().from(games).where(eq(games.id, ids.soloIpRecente));
    expect(vieille!.creatorIp).toBeNull();
    expect(recente!.creatorIp).toBe("203.0.113.9");
  });

  it("supprime l'invité inactif depuis 12 mois et sa partie, garde celui qui joue", async () => {
    expect(await existe(ids.inviteInactif)).toBe(false);
    expect(await partieExiste(ids.soloDuDormeur)).toBe(false);
    expect(await existe(ids.inviteActif)).toBe(true);
    expect(await existe(ids.joueurSolo)).toBe(true);
  });

  it("supprime la partie sans activité depuis un an, garde la partie en cours et l'enseignant", async () => {
    expect(await partieExiste(ids.classeAncienne)).toBe(false);
    expect(await partieExiste(ids.classeRecente)).toBe(true);
    expect(await existe(ids.prof)).toBe(true);
  });

  it("supprime l'examen d'il y a plus d'un an avec nom, numéro et note, garde le récent", async () => {
    expect(await db.select().from(examens).where(eq(examens.id, ids.examenAncien))).toEqual([]);
    expect(await db.select().from(examenCandidats).where(eq(examenCandidats.examenId, ids.examenAncien))).toEqual([]);
    expect((await db.select().from(examens).where(eq(examens.id, ids.examenRecent))).length).toBe(1);
  });

  it("supprime les demandes 3 ans après le dernier contact, pas avant", async () => {
    const devis = (await db.select({ id: demandesDeDevis.id }).from(demandesDeDevis)).map((d) => d.id);
    expect(devis).not.toContain(ids.devisAncien);
    expect(devis).toContain(ids.devisRecent);
    const o = await db.select().from(orientationRequests).where(eq(orientationRequests.id, ids.orientationRecontactee));
    expect(o.length).toBe(1);
  });

  it("avertit par e-mail un mois avant, et note la date de l'avertissement", async () => {
    expect(envoyes.map((c) => c.a)).toContain("bientot@lycee.test");
    const [u] = await db.select().from(users).where(eq(users.id, ids.aAvertir));
    expect(u!.avertiInactiviteLe?.getTime()).toBe(maintenant.getTime());
    expect(await existe(ids.aAvertir)).toBe(true);
    const courriel = envoyes.find((c) => c.a === "bientot@lycee.test")!;
    expect(courriel.texte).toContain("/teacher/login");
  });

  it("n'ouvre pas le compte à rebours quand l'e-mail n'est pas parti", async () => {
    const [u] = await db.select().from(users).where(eq(users.id, ids.sansCourriel));
    expect(u!.avertiInactiviteLe).toBeNull();
    expect(bilan.avertissementsNonEnvoyes).toBe(1);
  });

  it("supprime le compte averti depuis plus d'un mois, pas celui averti il y a 10 jours", async () => {
    expect(await existe(ids.aSupprimer)).toBe(false);
    expect(await existe(ids.avertiRecemment)).toBe(true);
    expect(bilan.enseignantsSupprimes).toBe(1);
  });

  it("ne touche ni l'enseignant revenu après l'avertissement, ni un compte de démonstration", async () => {
    expect(await existe(ids.revenu)).toBe(true);
    expect(await existe(ids.demo)).toBe(true);
    expect(envoyes.map((c) => c.a)).not.toContain("revenu@lycee.test");
    expect(envoyes.map((c) => c.a)).not.toContain("prof@demo.business-arena.fr");
  });

  it("rejouée aussitôt, ne supprime plus rien et n'envoie rien de plus", async () => {
    const avant = envoyes.length;
    const encore = await purger({ maintenant, envoyer: async () => ({ envoye: false, raison: "non_configure" }) });
    expect(encore.parties).toBe(0);
    expect(encore.invites).toBe(0);
    expect(encore.examens).toBe(0);
    expect(encore.enseignantsSupprimes).toBe(0);
    expect(envoyes.length).toBe(avant);
  });
});
