import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS, SUR POSTGRES EMBARQUÉ ET LE VRAI PIPELINE DE CLASSE.
 *
 * Une partie de classe à deux équipes de trois, deux tours : l'enseignant active
 * l'évaluation à mi-parcours et à la fin, avec auto-évaluation. Une équipe répond en
 * entier, l'autre à moitié ; le calcul, la publication, les notes d'équipe et l'export.
 * L'ISOLEMENT est vérifié sur les objets mêmes que les pages reçoivent : un étudiant ne
 * lit jamais les notes d'un autre ni leurs auteurs, un enseignant ne lit que ses parties.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, pairsEvaluations, pairsMoments, pairsReponses, players, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame, joinGameByCode } from "@/services/game.service";
import { createSoloGame, reinitialiserPartie } from "@/services/game-creation.service";
import {
  PairsRefusError,
  activerParDefaut,
  carteDeLEtudiant,
  enregistrerLesNotesDEquipe,
  enregistrerMesReponses,
  exportDesPairs,
  publierUnMoment,
  reglerLEvaluation,
  resumePourLePilotage,
  tableauDeLEnseignant,
  vueDeLEtudiant,
  type SaisieDesReponses,
} from "@/services/pairs.service";
import { CRITERES_PAR_DEFAUT } from "@/config/pairs/criteres";
import { poserUneLicence } from "./helpers/licence";

let prof: string;
let autreProf: string;
let gameId: string;
const eleves: Record<string, string> = {};
let equipe1: string[] = [];
let equipe2: string[] = [];
const CODES = CRITERES_PAR_DEFAUT.map((c) => c.code);

async function eleve(nom: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `guest-${nom}-${Math.random()}@guest.business-arena.local`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

async function enseignant(email: string): Promise<{ id: string; org: string }> {
  const r = await registerTeacher({ email, password: "motdepasse!", displayName: email, schoolName: "Lycée" });
  if ("error" in r) throw new Error(r.error);
  const org = (await getTeacherOrgId(r.userId))!;
  await poserUneLicence(org, r.userId);
  return { id: r.userId, org };
}

/** Une saisie où chaque cible reçoit la même note sur tous les critères. */
function saisie(notes: Record<string, number>, commentaires: Record<string, string> = {}): SaisieDesReponses {
  return Object.fromEntries(
    Object.entries(notes).map(([id, n]) => [id, { notes: Object.fromEntries(CODES.map((c) => [c, String(n)])), commentaire: commentaires[id] }]),
  );
}

const refus = async (p: Promise<unknown>, raison: string) => {
  await expect(p).rejects.toBeInstanceOf(PairsRefusError);
  await expect(p).rejects.toMatchObject({ raison });
};

beforeAll(async () => {
  const p = await enseignant("prof-pairs@lycee.fr");
  prof = p.id;
  autreProf = (await enseignant("autre-pairs@lycee.fr")).id;
  const cree = await createClassGame({
    teacherId: prof,
    organizationId: p.org,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 0,
    roundsCount: 2,
  });
  gameId = cree.gameId;
  // Six élèves entrés par le code : la répartition remplit l'équipe la moins remplie.
  for (const nom of ["Alice", "Bruno", "Chloé", "David", "Emma", "Farid"]) {
    eleves[nom] = await eleve(nom);
    const j = await joinGameByCode({ code: cree.joinCode, userId: eleves[nom]!, pseudo: nom });
    expect("gameId" in j).toBe(true);
  }
  const lignes = await db.select().from(players);
  const equipes = (await db.select().from(teams).where(eq(teams.gameId, gameId))).sort((a, b) => a.name.localeCompare(b.name));
  equipe1 = lignes.filter((l) => l.teamId === equipes[0]!.id).map((l) => l.userId);
  equipe2 = lignes.filter((l) => l.teamId === equipes[1]!.id).map((l) => l.userId);
  expect(equipe1).toHaveLength(3);
  expect(equipe2).toHaveLength(3);
}, 120_000);

describe("l'enseignant active l'évaluation", () => {
  it("sur sa partie de classe seulement, avec des réglages valables", async () => {
    const reglages = {
      active: true,
      moments: ["mi_parcours", "fin"],
      criteresCoches: CODES,
      criteresLibres: [],
      autoEvaluation: true,
      commentaire: true,
      borneBasse: 0.8,
      borneHaute: 1.2,
      bareme: 20,
    };
    await refus(reglerLEvaluation(autreProf, gameId, reglages), "introuvable");
    await refus(reglerLEvaluation(prof, gameId, { ...reglages, moments: [] }), "saisie");
    await refus(reglerLEvaluation(prof, gameId, { ...reglages, borneBasse: 0.75 }), "saisie");
    await refus(reglerLEvaluation(prof, gameId, { ...reglages, bareme: 30 }), "saisie");
    expect(await reglerLEvaluation(prof, gameId, reglages)).toEqual({ figes: false });
    const t = await tableauDeLEnseignant(prof, gameId);
    expect(t?.reglages?.moments).toEqual(["mi_parcours", "fin"]);
    expect(t?.moments.map((m) => m.etat)).toEqual(["a-venir", "a-venir"]);
    expect(t?.moments[0]?.ouvreApresLeTour).toBe(1);
  });

  it("pas sur une partie solo", async () => {
    const solo = await createSoloGame(eleves.Alice!);
    await refus(activerParDefaut(eleves.Alice!, solo), "introuvable");
    expect(await vueDeLEtudiant(solo, eleves.Alice!)).toBeNull();
  });

  it("avant mi-parcours, l'étudiant ne voit rien et ne peut rien envoyer", async () => {
    expect(await carteDeLEtudiant(gameId, equipe1[0]!)).toBeNull();
    const vue = await vueDeLEtudiant(gameId, equipe1[0]!);
    expect(vue?.moments).toEqual([]);
    await refus(enregistrerMesReponses(gameId, equipe1[0]!, "mi_parcours", saisie({ [equipe1[1]!]: 4, [equipe1[2]!]: 4, [equipe1[0]!]: 4 })), "ferme");
    expect(await resumePourLePilotage(prof, gameId)).toEqual({ active: true, ouverts: 0, publies: 0 });
  });
});

describe("à mi-parcours : réponses partielles, calcul, publication", () => {
  it("la clôture du premier tour ouvre la mi-parcours", async () => {
    await closeCurrentRound({ gameId, teacherId: prof });
    expect(await carteDeLEtudiant(gameId, equipe1[0]!)).toEqual({ moment: "mi_parcours", etat: "a-faire", coequipiers: 2 });
    const vue = await vueDeLEtudiant(gameId, equipe1[0]!);
    expect(vue?.coequipiers.map((c) => c.userId).sort()).toEqual([equipe1[1], equipe1[2]].sort());
    expect(vue?.autoEvaluation).toBe(true);
  });

  it("une saisie incomplète, hors échelle ou d'un non-membre est refusée", async () => {
    const [a, b, c] = equipe1 as [string, string, string];
    await refus(enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 4, [a]: 4 })), "saisie");
    await refus(enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 6, [c]: 4, [a]: 4 })), "saisie");
    await refus(enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 4, [c]: 4 })), "saisie");
    await refus(enregistrerMesReponses(gameId, a, "fin", saisie({ [b]: 4, [c]: 4, [a]: 4 })), "ferme");
    const intrus = await eleve("Intrus");
    await refus(enregistrerMesReponses(gameId, intrus, "mi_parcours", saisie({ [b]: 1, [c]: 1 })), "membre");
    expect(await db.select().from(pairsReponses)).toHaveLength(0);
  });

  it("une équipe répond en entier, l'autre à moitié ; une réponse se modifie tant que c'est ouvert", async () => {
    const [a, b, c] = equipe1 as [string, string, string];
    const [d, e] = equipe2 as [string, string, string];
    // A note d'abord tout le monde à 3, puis se ravise : seule la dernière réponse compte.
    await enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 3, [c]: 3, [a]: 3 }));
    await enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 5, [c]: 3, [a]: 5 }, { [c]: "Absent deux séances sur trois." }));
    // Une cible d'une autre équipe glissée dans la saisie est ignorée, jamais écrite.
    await enregistrerMesReponses(gameId, b, "mi_parcours", { ...saisie({ [a]: 4, [c]: 2, [b]: 4 }), [d]: { notes: Object.fromEntries(CODES.map((k) => [k, "1"])) } });
    await enregistrerMesReponses(gameId, c, "mi_parcours", saisie({ [a]: 4, [b]: 4, [c]: 5 }));
    await enregistrerMesReponses(gameId, d, "mi_parcours", saisie({ [e]: 2, [equipe2[2]!]: 4, [d]: 4 }, { [e]: "Je ne l'ai pas vu." }));
    const ecrites = await db.select().from(pairsReponses);
    expect(ecrites).toHaveLength(12);
    expect(ecrites.some((r) => r.evaluateurId === b && r.evalueId === d)).toBe(false);
    expect(await carteDeLEtudiant(gameId, a)).toMatchObject({ etat: "envoyee" });
    expect(await carteDeLEtudiant(gameId, e)).toMatchObject({ etat: "a-faire" });
  });

  it("l'enseignant voit le taux de réponse, les facteurs, les signaux et les commentaires avec leur auteur", async () => {
    const t = (await tableauDeLEnseignant(prof, gameId))!;
    const mi = t.moments.find((m) => m.moment === "mi_parcours")!;
    expect(mi.etat).toBe("ouvert");
    const [e1, e2] = mi.equipes as [(typeof mi.equipes)[number], (typeof mi.equipes)[number]];
    expect([e1.repondants, e1.membres]).toEqual([3, 3]);
    expect(e1.enAttente).toEqual([]);
    expect([e2.repondants, e2.membres]).toEqual([1, 3]);
    expect(e2.enAttente).toHaveLength(2);
    const ligne = (id: string) => [...e1.lignes, ...e2.lignes].find((l) => l.userId === id)!;
    const [a, b, c] = equipe1 as [string, string, string];
    // Le cas d'école de l'unitaire : A 1,17 ; B 1,13 ; C ramené à 0,8.
    expect(ligne(a).resultat.facteur).toBe(1.17);
    expect(ligne(b).resultat.facteur).toBe(1.13);
    expect(ligne(c).resultat.facteur).toBe(0.8);
    expect(ligne(c).resultat.signaux.map((s) => s.code)).toContain("borne");
    // C se met 5, ses pairs lui donnent 2,5 : il se surestime.
    expect(ligne(c).resultat.signaux).toContainEqual({ code: "auto-surestime", ecart: 2.5 });
    expect(ligne(a).identification).toBe("saisie");
    // Équipe 2 : D seul a répondu ; ses notes comptent, E et F reçoivent quand même.
    const [d, e] = equipe2 as [string, string, string];
    expect(ligne(d).resultat.regle).toBe("personne-ne-l-a-note");
    expect(ligne(e).resultat.evaluateurs).toBe(1);
    expect(ligne(e).resultat.facteur).toBe(0.8);
    expect(mi.commentaires).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ auteur: "Alice", texte: "Absent deux séances sur trois." }),
        expect.objectContaining({ texte: "Je ne l'ai pas vu." }),
      ]),
    );
    expect(t.figes).toBe(true);
  });

  it("une fois des réponses données, les critères et l'auto-évaluation sont figés", async () => {
    const r = await reglerLEvaluation(prof, gameId, {
      active: true,
      moments: ["mi_parcours", "fin"],
      criteresCoches: ["decisions"],
      criteresLibres: [],
      autoEvaluation: false,
      commentaire: true,
      borneBasse: 0.8,
      borneHaute: 1.2,
      bareme: 20,
    });
    expect(r.figes).toBe(true);
    const e = (await db.select().from(pairsEvaluations).where(eq(pairsEvaluations.gameId, gameId)))[0]!;
    expect(e.criteres.map((c) => c.code)).toEqual(CODES);
    expect(e.autoEvaluation).toBe(true);
  });

  it("avant publication, l'étudiant ne lit rien de ce qu'il a reçu", async () => {
    const vue = (await vueDeLEtudiant(gameId, equipe1[2]!))!;
    expect(vue.moments[0]?.resultats).toBeNull();
  });

  it("un autre enseignant ne lit, ne publie et n'exporte rien", async () => {
    expect(await tableauDeLEnseignant(autreProf, gameId)).toBeNull();
    expect(await exportDesPairs(autreProf, gameId)).toBeNull();
    expect(await resumePourLePilotage(autreProf, gameId)).toBeNull();
    await refus(publierUnMoment(autreProf, gameId, "mi_parcours", true), "introuvable");
    await refus(enregistrerLesNotesDEquipe(autreProf, gameId, "mi_parcours", {}), "introuvable");
    await refus(publierUnMoment(prof, gameId, "fin", true), "ferme");
  });

  it("publier clôt les réponses ; l'étudiant voit ses moyennes, sans auteur ni commentaire", async () => {
    await publierUnMoment(prof, gameId, "mi_parcours", true);
    const [a, b, c] = equipe1 as [string, string, string];
    await refus(enregistrerMesReponses(gameId, a, "mi_parcours", saisie({ [b]: 1, [c]: 1, [a]: 1 })), "ferme");
    expect(await carteDeLEtudiant(gameId, c)).toEqual({ moment: "mi_parcours", etat: "publiee", coequipiers: 2 });
    const vue = (await vueDeLEtudiant(gameId, c))!;
    const mi = vue.moments[0]!;
    expect(mi.resultats).toEqual({
      evaluateurs: 2,
      moyennes: Object.fromEntries(CODES.map((k) => [k, 2.5])),
      moyenne: 2.5,
      auto: Object.fromEntries(CODES.map((k) => [k, 5])),
    });
    // Rien de ce qu'il lit ne nomme un auteur ni ne porte un commentaire, ni les notes
    // qu'un autre a reçues : ses propres réponses seules, et ses moyennes.
    const lu = JSON.stringify(vue);
    expect(lu).not.toContain("Absent deux séances");
    expect(lu).not.toContain("Je ne l'ai pas vu");
    expect(lu).not.toMatch(/evaluateurId|"evaluateur"|evalueId|facteur|signaux/);
    expect(Object.keys(mi.mesReponses).sort()).toEqual([a, b, c].sort());
    // Ce qu'il a donné, lui : ses notes à lui, pas celles qu'il a reçues.
    expect(mi.mesReponses[a]?.notes.decisions).toBe(4);
    // Un étudiant de l'autre équipe ne voit pas l'équipe 1.
    const autre = JSON.stringify(await vueDeLEtudiant(gameId, equipe2[0]!));
    for (const id of equipe1) expect(autre).not.toContain(id);
  });

  it("retirer la publication rouvre les réponses", async () => {
    await publierUnMoment(prof, gameId, "mi_parcours", false);
    expect(await carteDeLEtudiant(gameId, equipe1[0]!)).toMatchObject({ etat: "envoyee" });
    await publierUnMoment(prof, gameId, "mi_parcours", true);
  });
});

describe("à la fin : notes d'équipe, note individuelle, export", () => {
  it("la fin de partie ouvre le second moment, qui passe devant le premier", async () => {
    await closeCurrentRound({ gameId, teacherId: prof });
    expect(await carteDeLEtudiant(gameId, equipe1[0]!)).toEqual({ moment: "fin", etat: "a-faire", coequipiers: 2 });
    expect(await resumePourLePilotage(prof, gameId)).toEqual({ active: true, ouverts: 1, publies: 1 });
  });

  it("les notes d'équipe se saisissent sur le barème, et la note individuelle suit le facteur", async () => {
    const t0 = (await tableauDeLEnseignant(prof, gameId))!;
    const [id1, id2] = t0.moments[0]!.equipes.map((e) => e.teamId) as [string, string];
    await refus(enregistrerLesNotesDEquipe(prof, gameId, "mi_parcours", { [id1]: "24" }), "saisie");
    await enregistrerLesNotesDEquipe(prof, gameId, "mi_parcours", { [id1]: "14", [id2]: "" });
    const t = (await tableauDeLEnseignant(prof, gameId))!;
    const e1 = t.moments[0]!.equipes[0]!;
    expect(e1.noteDEquipe).toBe(14);
    expect(e1.lignes.find((l) => l.userId === equipe1[0])!.noteIndividuelle).toBe(16.4);
    expect(e1.lignes.find((l) => l.userId === equipe1[2])!.noteIndividuelle).toBe(11.2);
    expect(t.moments[0]!.equipes[1]!.noteDEquipe).toBeNull();
  });

  it("l'export : une ligne par étudiant et par moment, sans adresse ni commentaire", async () => {
    const f = (await exportDesPairs(prof, gameId, new Date("2026-10-12T09:00:00Z")))!;
    expect(f.nom).toMatch(/^coequipiers-.+-2026-10-12\.csv$/);
    const lignes = f.contenu.replace(/^﻿/, "").trim().split("\r\n");
    expect(lignes).toHaveLength(1 + 6 * 2);
    expect(lignes.find((l) => l.includes("Alice") && l.includes("mi-parcours"))).toContain(";14;16,4;");
    expect(f.contenu).not.toMatch(/@|Absent deux séances/);
  });
});

describe("recommencer la partie", () => {
  it("efface les réponses et les publications, garde les réglages", async () => {
    await reinitialiserPartie({ gameId, teacherId: prof });
    expect(await db.select().from(pairsReponses)).toHaveLength(0);
    expect(await db.select().from(pairsMoments)).toHaveLength(0);
    expect(await db.select().from(pairsEvaluations)).toHaveLength(1);
    expect(await carteDeLEtudiant(gameId, equipe1[0]!)).toBeNull();
    // Pour que la suppression ci-dessous ait de quoi effacer.
    await closeCurrentRound({ gameId, teacherId: prof });
    await enregistrerMesReponses(gameId, equipe1[0]!, "mi_parcours", saisie({ [equipe1[1]!]: 4, [equipe1[2]!]: 4, [equipe1[0]!]: 4 }));
    await publierUnMoment(prof, gameId, "mi_parcours", true);
    expect(await db.select().from(pairsReponses)).toHaveLength(3);
  }, 60_000);
});

describe("RGPD : tout part avec la partie", () => {
  it("supprimer la partie efface l'évaluation, les moments et les réponses", async () => {
    await db.delete(games).where(eq(games.id, gameId));
    expect(await db.select().from(pairsEvaluations)).toHaveLength(0);
    expect(await db.select().from(pairsMoments)).toHaveLength(0);
    expect(await db.select().from(pairsReponses)).toHaveLength(0);
  });
});
