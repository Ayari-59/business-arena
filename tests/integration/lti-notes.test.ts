import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE RETOUR DES NOTES (LTI Advantage, AGS 1.3), DE BOUT EN BOUT CÔTÉ SERVEUR.
 *
 * Une plateforme factice (tests/helpers/carnet-de-notes.ts : un vrai serveur HTTP local)
 * sert le jeton OAuth 2 et le carnet de notes ; elle VÉRIFIE la signature de l'assertion
 * de l'outil par son JWKS, et la portée de chaque demande. Le simulateur de lancement
 * (tests/helpers/simulateur-lti.ts) poste les `id_token` aux vraies routes, avec la
 * revendication du service de notes. Les tâches d'après la réponse (`after`) sont
 * recueillies, puis jouées quand le test le décide.
 *
 * Ce qui est vérifié : l'activité garde ce que la plateforme accorde ; l'identifiant de
 * l'élève est gardé chiffré, et seulement si le service est accordé ; rien ne part avant
 * la publication ; la publication d'un examen à deux candidats fait arriver deux notes,
 * dans UNE colonne créée par l'outil ; le retrait les remet en attente ; une erreur 500
 * puis un succès au nouvel essai ; une erreur temporaire qui dure, reprise plus tard ;
 * une erreur définitive, qui attend « Renvoyer les notes » ; la colonne de la sélection
 * de contenu ; la progression d'une partie de classe ; une plateforme sans service : rien
 * n'est tenté.
 */

const { taches, bocal } = vi.hoisted(() => ({
  taches: [] as (() => unknown)[],
  bocal: new Map<string, { valeur: string; options?: Record<string, unknown> }>(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (f: () => unknown) => {
    taches.push(f);
  },
}));
vi.mock("next/headers", () => {
  const magasin = {
    get: (nom: string) => (bocal.has(nom) ? { name: nom, value: bocal.get(nom)!.valeur } : undefined),
    set: (nom: string, valeur: string, options?: Record<string, unknown>) => {
      if (options?.maxAge === 0) bocal.delete(nom);
      else bocal.set(nom, { valeur, options });
    },
    delete: (nom: string) => bocal.delete(nom),
  };
  return {
    cookies: async () => magasin,
    headers: async () => new Headers({ host: "outil.test", "x-forwarded-proto": "https" }),
  };
});
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  examenCandidats,
  games,
  ltiComptes,
  ltiLiens,
  ltiNotesEleves,
  ltiNotesEnvois,
  teams,
} from "@/db/schema";
import { GET as connexionGet } from "@/app/api/lti/connexion/route";
import { POST as lancementPost } from "@/app/api/lti/lancement/route";
import { inscrirePlateforme, type Plateforme } from "@/lti/plateformes";
import { hacherSub } from "@/lti/comptes";
import { clesDeLOutil } from "@/lti/cles";
import { relierLien } from "@/lti/liens";
import { reponseDeSelection } from "@/lti/selection";
import { creerTicket } from "@/lti/tickets";
import { dechiffrer } from "@/lib/chiffrement";
import { setSession } from "@/lib/session";
import { oublierLeJeton } from "@/lti/ags/jeton";
import {
  envoyerCeQuiAttend,
  preparerLesNotesDeLExamen,
  ressourceDeLExamen,
  synchroniserLesNotesDeLExamen,
  REPRISE_APRES_MS,
} from "@/lti/ags/envois";
import { etatDuRetourDesNotes } from "@/lti/ags/etat";
import { phrasesDuRetour } from "@/lti/ags/textes";
import {
  apresLeTour,
  commencerLExamen,
  creerExamen,
  noterLaCopieDeLaPartie,
  publierLesResultats,
  type SaisieDExamen,
} from "@/services/examen.service";
import { createClassGame, resolveCurrentRound } from "@/services/game.service";
import { publierExamenAction, renvoyerLesNotesAction, retirerPublicationAction } from "@/app/teacher/examens/actions";
import { closeRoundAction, commencerLaVraiePartieAction } from "@/app/teacher/actions";
import { neutralDecisions } from "@/engine/bots";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import type { CompanyState } from "@/engine/types";
import { etablissementSousLicence } from "./helpers/licence";
import { SimulateurLti, type Personne } from "../helpers/simulateur-lti";
import { CarnetDeNotes, PORTEES } from "../helpers/carnet-de-notes";

const OUTIL = "https://outil.test";
const SAISIE: SaisieDExamen = {
  nom: "Gestion L2 · partiel",
  scenarioCode: "nova",
  niveau: 1,
  tours: 1,
  dureeTourMinutes: null,
  ouverture: null,
  fermeture: null,
  questions: false,
  resultatEstime: false,
  tentatives: 1,
  modeGraine: "commune",
  grilleCode: "business-arena-2026",
};

let sim: SimulateurLti;
let simSansNotes: SimulateurLti;
let carnet: CarnetDeNotes;
let prof: { userId: string; orgId: string };
let plateforme: Plateforme;
let examenId: string;
let code: string;

async function jouerLesTaches(): Promise<void> {
  while (taches.length) await taches.shift()!();
}

async function attendreRedirection(f: () => Promise<unknown>): Promise<string> {
  try {
    await f();
  } catch (e) {
    const m = /__redirect__(.*)$/.exec((e as Error).message);
    if (m) return m[1]!;
    throw e;
  }
  throw new Error("aucune redirection");
}

/** Connexion OIDC puis lancement, par les vraies routes : la destination. */
async function lancement(p: Personne, s: SimulateurLti = sim): Promise<string> {
  bocal.clear();
  const q = new URLSearchParams({
    iss: s.issuer,
    login_hint: "indice",
    target_link_uri: `${OUTIL}/api/lti/lancement`,
    client_id: s.clientId,
    lti_deployment_id: s.deploymentId,
  });
  const c = await connexionGet(new Request(`${OUTIL}/api/lti/connexion?${q}`));
  const loc = new URL(c.headers.get("location")!);
  const r = await lancementPost(
    new Request(`${OUTIL}/api/lti/lancement`, {
      method: "POST",
      body: new URLSearchParams({ id_token: s.idToken(p, loc.searchParams.get("nonce")!), state: loc.searchParams.get("state")! }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }),
  );
  expect(r.status, await r.clone().text()).toBe(303);
  const u = new URL(r.headers.get("location")!);
  return u.pathname + u.search;
}

async function lienDe(ressource: string, p: Plateforme = plateforme) {
  return (
    await db
      .select()
      .from(ltiLiens)
      .where(and(eq(ltiLiens.plateformeId, p.id), eq(ltiLiens.resourceLinkId, ressource)))
  )[0]!;
}

async function eleveDe(sub: string, p: Plateforme = plateforme): Promise<string> {
  const [c] = await db
    .select()
    .from(ltiComptes)
    .where(and(eq(ltiComptes.plateformeId, p.id), eq(ltiComptes.subHache, hacherSub(p.sel, sub)), eq(ltiComptes.role, "eleve")));
  return c!.userId;
}

/** Le candidat passe l'examen d'un tour jusqu'à la remise ; sa copie est notée. */
async function passerLExamen(userId: string, nom: string): Promise<number> {
  const r = await commencerLExamen({ code, userId, identification: "lti", nom, numeroEtudiant: null });
  expect("gameId" in r).toBe(true);
  const gameId = (r as { gameId: string }).gameId;
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  const [etat] = await db
    .select()
    .from(companyStates)
    .where(and(eq(companyStates.teamId, equipe!.id), eq(companyStates.roundIndex, 0)));
  const decisions = neutralDecisions({ scenario: parseScenarioConfig(game!.scenarioSnapshot), state: etat!.state as CompanyState, roundIndex: 1 });
  await resolveCurrentRound({ gameId, userId, playerDecisions: decisions });
  expect(await apresLeTour(gameId)).toBe(true);
  await noterLaCopieDeLaPartie(gameId);
  const [c] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, gameId));
  expect(c!.note, JSON.stringify(c!.notation)).not.toBeNull();
  return c!.note!;
}

const lignesDuJournal = async () =>
  db.select().from(ltiNotesEnvois).where(eq(ltiNotesEnvois.ressource, ressourceDeLExamen(examenId)));

beforeAll(async () => {
  sim = await new SimulateurLti().demarrer(OUTIL);
  simSansNotes = await new SimulateurLti().demarrer(OUTIL);
  carnet = await new CarnetDeNotes(() => sim.clientId, async () => clesDeLOutil().publiques).demarrer();
  prof = await etablissementSousLicence("Notes");
  plateforme = await inscrirePlateforme({
    nom: "moodle · lycee.test",
    ...sim.description(),
    urlJeton: carnet.urlJeton,
    organizationId: prof.orgId,
    inscription: "manuelle",
  });
  ({ id: examenId, code } = await creerExamen(prof.userId, SAISIE));
  oublierLeJeton();
}, 120_000);

afterAll(async () => {
  await sim?.arreter();
  await simSansNotes?.arreter();
  await carnet?.arreter();
});

const notes: Record<string, number> = {};

describe("au lancement", () => {
  it("l'activité garde ce que la plateforme accorde (portées, adresse des colonnes)", async () => {
    expect(
      await lancement({ sub: "prof-notes", role: "enseignant", ressource: "act-examen", revendications: carnet.revendication() }),
    ).toBe("/lti/activite");
    const lien = await lienDe("act-examen");
    expect(lien.agsPortees?.sort()).toEqual([PORTEES.colonnes, PORTEES.resultats, PORTEES.notes].sort());
    expect(lien.agsLineitems).toBe(carnet.urlColonnes);
    expect(lien.agsLineitem).toBeNull();
    expect(await relierLien({ lienId: lien.id, enseignantId: prof.userId, cible: { type: "examen", id: examenId } })).toBe(true);
  });

  it("l'identifiant de l'élève est gardé CHIFFRÉ, jamais en clair", async () => {
    for (const [sub, prenom] of [
      ["eleve-ines", "Inès"],
      ["eleve-noe", "Noé"],
    ] as const) {
      expect(await lancement({ sub, role: "eleve", prenom, ressource: "act-examen", revendications: carnet.revendication() })).toBe(
        `/examen/${code}`,
      );
    }
    const lien = await lienDe("act-examen");
    const gardes = await db.select().from(ltiNotesEleves).where(eq(ltiNotesEleves.lienId, lien.id));
    expect(gardes).toHaveLength(2);
    for (const g of gardes) {
      expect(g.subChiffre).not.toMatch(/eleve-/);
      expect(g.subChiffre.startsWith("v1.")).toBe(true);
    }
    expect(gardes.map((g) => dechiffrer(g.subChiffre, `lti-ags:${process.env.AUTH_SECRET ?? "dev-secret-change-me"}`)).sort()).toEqual([
      "eleve-ines",
      "eleve-noe",
    ]);
    // Rien n'est parti pour un examen : sa note attend la publication.
    await jouerLesTaches();
    expect(carnet.demandesDeJeton).toHaveLength(0);
  });

  it("les deux candidats passent l'examen ; rien ne part avant la publication", async () => {
    notes["eleve-ines"] = await passerLExamen(await eleveDe("eleve-ines"), "Inès");
    notes["eleve-noe"] = await passerLExamen(await eleveDe("eleve-noe"), "Noé");
    await synchroniserLesNotesDeLExamen(examenId, { attentesMs: [0, 0] });
    expect(carnet.notes).toHaveLength(0);
    expect(carnet.demandesDeJeton).toHaveLength(0);
    const etat = await etatDuRetourDesNotes(examenId);
    expect(etat).toMatchObject({ accorde: true, publie: false, attendues: 0 });
    expect(phrasesDuRetour(etat!).resume.avant).toMatch(/partiront à la publication des résultats/);
  }, 240_000);
});

describe("la publication", () => {
  it("deux candidats LTI : deux notes reçues, dans une colonne créée par l'outil, hors de la requête", async () => {
    await setSession(prof.userId, "teacher", 1);
    expect(await attendreRedirection(() => publierExamenAction(examenId))).toBe(`/teacher/examens/${examenId}?fait=publie`);
    // Posé au journal pendant la requête, parti après.
    expect((await lignesDuJournal()).map((l) => l.etat)).toEqual(["a-envoyer", "a-envoyer"]);
    expect(carnet.notes).toHaveLength(0);
    expect((await etatDuRetourDesNotes(examenId))!.enCours).toBe(2);
    await jouerLesTaches();

    // Le jeton : une assertion vérifiée, une seule demande pour toute la promotion.
    expect(carnet.refusDeJeton).toEqual([]);
    expect(carnet.demandesDeJeton).toHaveLength(1);
    expect(carnet.demandesDeJeton[0]!.claims).toMatchObject({ iss: sim.clientId, sub: sim.clientId, aud: carnet.urlJeton });
    expect(carnet.demandesDeJeton[0]!.kid).toBe(clesDeLOutil().kid);
    expect(carnet.demandesDeJeton[0]!.scope.split(" ").sort()).toEqual([PORTEES.colonnes, PORTEES.notes].sort());

    // La colonne : une, créée pour cette ressource, avec un libellé clair.
    expect(carnet.colonnes).toHaveLength(1);
    expect(carnet.colonnes[0]).toMatchObject({
      label: "Business Arena · Gestion L2 · partiel",
      scoreMaximum: 100,
      resourceId: `examen:${examenId}`,
      resourceLinkId: "act-examen",
      tag: "business-arena",
    });

    // Les notes.
    expect(carnet.notes).toHaveLength(2);
    for (const sub of ["eleve-ines", "eleve-noe"]) {
      const [s] = carnet.notesDe(sub);
      expect(s).toMatchObject({
        userId: sub,
        scoreGiven: Math.round(notes[sub]! * 10) / 10,
        scoreMaximum: 100,
        activityProgress: "Completed",
        gradingProgress: "FullyGraded",
        comment: "Business Arena · grille Business Arena 2026 v2",
      });
      expect(Number.isNaN(Date.parse(s!.timestamp as string))).toBe(false);
    }
    expect(carnet.notes.every((n) => n.type === "application/vnd.ims.lis.v1.score+json")).toBe(true);

    const journal = await lignesDuJournal();
    expect(journal.map((l) => [l.etat, l.codeHttp, l.essais])).toEqual([
      ["envoye", 200, 1],
      ["envoye", 200, 1],
    ]);
    expect(journal.every((l) => l.envoyeLe instanceof Date)).toBe(true);
    const p = phrasesDuRetour((await etatDuRetourDesNotes(examenId))!);
    expect(`${p.resume.avant}${p.resume.chiffre}`).toBe("Notes envoyées à Moodle : 2/2");
  });

  it("rien ne repart sans changement ; « Renvoyer les notes » renvoie tout, sans nouvelle colonne", async () => {
    await synchroniserLesNotesDeLExamen(examenId, { attentesMs: [0, 0] });
    expect(carnet.notes).toHaveLength(2);
    expect(await attendreRedirection(() => renvoyerLesNotesAction(examenId))).toBe(`/teacher/examens/${examenId}?fait=renvoi`);
    await jouerLesTaches();
    expect(carnet.notes).toHaveLength(4);
    expect(carnet.colonnes).toHaveLength(1);
    // Le jeton est toujours celui du cache.
    expect(carnet.demandesDeJeton).toHaveLength(1);
  });
});

describe("le retrait de la publication", () => {
  it("chaque note repart « en attente », sans note", async () => {
    expect(await attendreRedirection(() => retirerPublicationAction(examenId))).toBe(`/teacher/examens/${examenId}?fait=retire`);
    await jouerLesTaches();
    expect(carnet.notes).toHaveLength(6);
    for (const n of carnet.notes.slice(4)) {
      expect(n.score).toMatchObject({ gradingProgress: "Pending", activityProgress: "Completed" });
      expect(n.score).not.toHaveProperty("scoreGiven");
    }
    const p = phrasesDuRetour((await etatDuRetourDesNotes(examenId))!);
    expect(`${p.resume.avant}${p.resume.chiffre}`).toBe("Notes retirées de Moodle : 2/2");
  });
});

describe("les erreurs et les nouveaux essais", () => {
  it("une erreur 500, puis le succès au nouvel essai", async () => {
    await publierLesResultats(prof.userId, examenId, true);
    carnet.echecs.push(500);
    const avant = carnet.reponsesAuxNotes.length;
    await synchroniserLesNotesDeLExamen(examenId, { attentesMs: [0, 0] });
    expect(carnet.reponsesAuxNotes.slice(avant)).toEqual([500, 200, 200]);
    const journal = await lignesDuJournal();
    expect(journal.every((l) => l.etat === "envoye" && l.nature === "note")).toBe(true);
    expect(journal.map((l) => l.essais).sort()).toEqual([1, 2]);
  });

  it("une erreur temporaire qui dure : notée, puis reprise d'elle-même plus tard", async () => {
    carnet.echecs.push(503, 503, 503);
    await preparerLesNotesDeLExamen(examenId, { forcer: true });
    await envoyerCeQuiAttend(ressourceDeLExamen(examenId), { attentesMs: [0, 0] });
    const enErreur = (await lignesDuJournal()).filter((l) => l.etat === "erreur");
    expect(enErreur).toHaveLength(1);
    expect(enErreur[0]).toMatchObject({ temporaire: true, codeHttp: 503, essais: 3 });
    expect(enErreur[0]!.message).toBe("Moodle a rencontré une erreur (erreur 503).");
    expect(enErreur[0]!.prochainEssai).toBeInstanceOf(Date);
    const etat = (await etatDuRetourDesNotes(examenId))!;
    expect(phrasesDuRetour(etat).details).toEqual(["1 erreur : Moodle a rencontré une erreur (erreur 503). Nouvel essai prévu."]);
    expect(`${phrasesDuRetour(etat).resume.chiffre}`).toBe("1/2");
    // Trop tôt : rien. Passé le délai : la ligne repart.
    const n = carnet.notes.length;
    await envoyerCeQuiAttend(ressourceDeLExamen(examenId), { attentesMs: [0, 0] });
    expect(carnet.notes).toHaveLength(n);
    const plusTard = new Date(Date.now() + REPRISE_APRES_MS + 1_000);
    await envoyerCeQuiAttend(ressourceDeLExamen(examenId), { attentesMs: [0, 0], maintenant: () => plusTard });
    expect(carnet.notes).toHaveLength(n + 1);
    expect((await lignesDuJournal()).every((l) => l.etat === "envoye")).toBe(true);
  });

  it("une erreur définitive (403) attend « Renvoyer les notes »", async () => {
    carnet.echecs.push(403);
    await preparerLesNotesDeLExamen(examenId, { forcer: true });
    await envoyerCeQuiAttend(ressourceDeLExamen(examenId), { attentesMs: [0, 0] });
    const [e] = (await lignesDuJournal()).filter((l) => l.etat === "erreur");
    expect(e).toMatchObject({ temporaire: false, codeHttp: 403, essais: 1 });
    expect(e!.message).toMatch(/^Moodle a refusé l'accès au carnet de notes \(erreur 403\)/);
    const plusTard = new Date(Date.now() + REPRISE_APRES_MS * 3);
    const n = carnet.notes.length;
    await envoyerCeQuiAttend(ressourceDeLExamen(examenId), { attentesMs: [0, 0], maintenant: () => plusTard });
    expect(carnet.notes).toHaveLength(n);
    await synchroniserLesNotesDeLExamen(examenId, { forcer: true, attentesMs: [0, 0] });
    expect((await lignesDuJournal()).every((l) => l.etat === "envoye")).toBe(true);
  });
});

describe("la colonne créée par la plateforme (sélection de contenu)", () => {
  it("la réponse de sélection demande la colonne de l'examen", async () => {
    const ticket = await creerTicket({
      type: "selection",
      plateformeId: plateforme.id,
      dureeS: 600,
      donnees: { userId: prof.userId, retour: `${sim.base}/retour-selection`, donnees: null, deploymentId: sim.deploymentId },
    });
    const r = await reponseDeSelection({ ticket, cible: `examen:${examenId}`, origine: OUTIL });
    const jwt = /name="JWT" value="([^"]+)"/.exec(await r.text())![1]!;
    const charge = JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString());
    const [item] = charge["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"];
    expect(item.lineItem).toEqual({
      scoreMaximum: 100,
      label: "Business Arena · Gestion L2 · partiel",
      resourceId: `examen:${examenId}`,
      tag: "business-arena",
    });
  });

  it("une copie notée après la publication part d'elle-même, dans la colonne de la plateforme", async () => {
    const colonne = carnet.creerUneColonne({ label: "Business Arena · Gestion L2 · partiel", scoreMaximum: 100, resourceLinkId: "act-dl" });
    const avec = carnet.revendication({ colonne });
    expect(await lancement({ sub: "prof-notes", role: "enseignant", ressource: "act-dl", custom: { ba_cible: `examen:${examenId}` }, revendications: avec })).toBe("/lti/activite");
    // La sélection a été posée par le créateur de l'examen : l'activité se relie à son lancement.
    const lien = await lienDe("act-dl");
    expect(lien.cibleType).toBe("examen");
    expect(lien.agsLineitem).toBe(colonne);
    await lancement({ sub: "eleve-lou", role: "eleve", prenom: "Lou", ressource: "act-dl", revendications: avec });
    const colonnesAvant = carnet.colonnes.length;
    const note = await passerLExamen(await eleveDe("eleve-lou"), "Lou");
    const [s] = carnet.notesDe("eleve-lou");
    expect(s).toMatchObject({ scoreGiven: Math.round(note * 10) / 10, gradingProgress: "FullyGraded" });
    expect(carnet.notes.find((n) => n.score.userId === "eleve-lou")!.colonne).toBe(colonne);
    expect(carnet.colonnes).toHaveLength(colonnesAvant);
  }, 120_000);
});

describe("une partie de classe : la progression, jamais une note", () => {
  it("« en cours » à l'entrée, « terminée » à la fin, dans la colonne de la plateforme seulement", async () => {
    const { gameId } = await createClassGame({
      teacherId: prof.userId,
      organizationId: prof.orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 1,
      roundsCount: 3,
    });
    const colonne = carnet.creerUneColonne({ label: "Simulation", scoreMaximum: 20, resourceLinkId: "act-partie" });
    const avec = carnet.revendication({ colonne });
    await lancement({ sub: "prof-notes", role: "enseignant", ressource: "act-partie", revendications: avec });
    expect(await relierLien({ lienId: (await lienDe("act-partie")).id, enseignantId: prof.userId, cible: { type: "partie", id: gameId } })).toBe(true);
    // Une autre activité vers la même partie, SANS colonne de la plateforme : rien n'y part.
    await lancement({ sub: "prof-notes", role: "enseignant", ressource: "act-partie-2", revendications: carnet.revendication() });
    expect(await relierLien({ lienId: (await lienDe("act-partie-2")).id, enseignantId: prof.userId, cible: { type: "partie", id: gameId } })).toBe(true);
    const colonnes = carnet.colonnes.length;

    expect(await lancement({ sub: "eleve-sam", role: "eleve", prenom: "Sam", ressource: "act-partie", revendications: avec })).toBe(`/arena/${gameId}`);
    expect(await lancement({ sub: "eleve-zoe", role: "eleve", prenom: "Zoé", ressource: "act-partie-2", revendications: carnet.revendication() })).toBe(
      `/arena/${gameId}`,
    );
    await jouerLesTaches();
    expect(carnet.notesDe("eleve-sam")).toEqual([expect.objectContaining({ activityProgress: "InProgress", gradingProgress: "NotReady" })]);
    expect(carnet.notesDe("eleve-sam")[0]).not.toHaveProperty("scoreGiven");
    expect(carnet.notesDe("eleve-zoe")).toEqual([]);

    await setSession(prof.userId, "teacher", 1);
    for (let tour = 1; tour <= 3; tour += 1) {
      const fd = new FormData();
      fd.set("roundIndex", String(tour));
      expect(await closeRoundAction(gameId, { error: null }, fd)).toEqual({ error: null });
    }
    await jouerLesTaches();
    const recues = carnet.notesDe("eleve-sam");
    expect(recues).toHaveLength(2);
    expect(recues[1]).toMatchObject({ activityProgress: "Completed", gradingProgress: "NotReady" });
    expect(recues[1]).not.toHaveProperty("scoreGiven");
    expect(carnet.notesDe("eleve-zoe")).toEqual([]);
    expect(carnet.colonnes).toHaveLength(colonnes);
  }, 180_000);

  it("un tour d'essai : rien ne part pendant l'essai, « commencée » à la vraie partie, « terminée » à sa fin seulement", async () => {
    // config/tour-d-essai.ts : un tour d'essai, puis deux vrais tours.
    const { gameId } = await createClassGame({
      teacherId: prof.userId,
      organizationId: prof.orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 1,
      roundsCount: 2,
      essai: { tours: 1, enchainement: "manuel" },
    });
    const colonne = carnet.creerUneColonne({ label: "Simulation avec essai", scoreMaximum: 20, resourceLinkId: "act-essai" });
    const avec = carnet.revendication({ colonne });
    await lancement({ sub: "prof-notes", role: "enseignant", ressource: "act-essai", revendications: avec });
    expect(await relierLien({ lienId: (await lienDe("act-essai")).id, enseignantId: prof.userId, cible: { type: "partie", id: gameId } })).toBe(true);

    // L'élève entre PENDANT l'essai : rien ne part.
    expect(await lancement({ sub: "eleve-noa", role: "eleve", prenom: "Noa", ressource: "act-essai", revendications: avec })).toBe(`/arena/${gameId}`);
    await jouerLesTaches();
    expect(carnet.notesDe("eleve-noa")).toEqual([]);

    // Le dernier tour d'essai est clos : toujours rien, et surtout pas « terminée ».
    await setSession(prof.userId, "teacher", 1);
    const fd = new FormData();
    fd.set("roundIndex", "1");
    expect(await closeRoundAction(gameId, { error: null }, fd)).toEqual({ error: null });
    await jouerLesTaches();
    expect(carnet.notesDe("eleve-noa")).toEqual([]);

    // La vraie partie commence : « commencée », jamais « terminée ».
    expect(await commencerLaVraiePartieAction(gameId, { error: null }, new FormData())).toEqual({ error: null });
    await jouerLesTaches();
    expect(carnet.notesDe("eleve-noa")).toEqual([expect.objectContaining({ activityProgress: "InProgress", gradingProgress: "NotReady" })]);

    // La vraie partie va au bout : « terminée », une fois.
    for (let tour = 1; tour <= 2; tour += 1) {
      const f = new FormData();
      f.set("roundIndex", String(tour));
      expect(await closeRoundAction(gameId, { error: null }, f)).toEqual({ error: null });
    }
    await jouerLesTaches();
    const recues = carnet.notesDe("eleve-noa");
    expect(recues).toHaveLength(2);
    expect(recues[1]).toMatchObject({ activityProgress: "Completed", gradingProgress: "NotReady" });
    expect(recues.every((n) => !("scoreGiven" in n))).toBe(true);
  }, 240_000);
});

describe("une plateforme qui n'accorde pas le service de notes", () => {
  it("continue de marcher comme avant, et rien n'est tenté", async () => {
    const autre = await inscrirePlateforme({
      nom: "Moodle sans notes",
      ...simSansNotes.description(),
      organizationId: prof.orgId,
      inscription: "manuelle",
    });
    const { id: autreExamen, code: autreCode } = await creerExamen(prof.userId, SAISIE);
    await lancement({ sub: "prof-sans", role: "enseignant", ressource: "act-sans" }, simSansNotes);
    const lien = await lienDe("act-sans", autre);
    expect(lien.agsPortees).toBeNull();
    expect(await relierLien({ lienId: lien.id, enseignantId: prof.userId, cible: { type: "examen", id: autreExamen } })).toBe(true);
    expect(await lancement({ sub: "eleve-sans", role: "eleve", prenom: "Ada", ressource: "act-sans" }, simSansNotes)).toBe(`/examen/${autreCode}`);
    expect(await db.select().from(ltiNotesEleves).where(eq(ltiNotesEleves.lienId, lien.id))).toEqual([]);
    const jetons = carnet.demandesDeJeton.length;
    const recues = carnet.notes.length;
    await publierLesResultats(prof.userId, autreExamen, true);
    await synchroniserLesNotesDeLExamen(autreExamen, { attentesMs: [0, 0] });
    await jouerLesTaches();
    expect(carnet.demandesDeJeton).toHaveLength(jetons);
    expect(carnet.notes).toHaveLength(recues);
    expect(await db.select().from(ltiNotesEnvois).where(eq(ltiNotesEnvois.lienId, lien.id))).toEqual([]);
    const etat = (await etatDuRetourDesNotes(autreExamen))!;
    expect(etat.accorde).toBe(false);
    expect(phrasesDuRetour(etat).resume.avant).toBe(
      "Moodle n'a pas accordé le retour des notes à l'activité de cet examen : les notes se recopient à la main.",
    );
  });
});
