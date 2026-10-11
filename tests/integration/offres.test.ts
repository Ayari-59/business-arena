import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * LA GRILLE, VÉRIFIÉE CÔTÉ SERVEUR : CLASSE, CAMPUS, ÉPISODES À PART, PAS D'ESSAI EN CLASSE.
 *
 * Décisions du propriétaire (octobre 2026) : « Les épisodes sont facturés à part. Les
 * offres : Classe 490, Campus 990. Sans les épisodes. La vente se fait sur devis. » et
 * « pas de possibilité de tester en classe ». Ce test pose les règles là où elles
 * tiennent quel que soit l'écran (services/acces.service.ts) :
 *  · la partie de classe et le concours ne se CRÉENT que sous licence de l'arène en
 *    cours ; sans licence, ou licence expirée, même refus, même message ;
 *  · une licence Classe ou Campus seule n'ouvre aucun épisode non démo ; une licence qui
 *    inclut les épisodes les ouvre, au compte comme à la cohorte ;
 *  · la cohorte d'enseignant exige une licence qui inclut les épisodes ;
 *  · une partie de classe commencée continue après la fin de la licence ;
 *  · le dossier enseignant et le relevé suivent la règle de la classe ;
 *  · la demande de devis est enregistrée, l'offre conservée, la notification envoyée,
 *    et la confirmation ne promet que ce qui est parti.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.7" }),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn() }));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis, orgLicences, users } from "@/db/schema";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { createCompetition } from "@/services/competition.service";
import {
  accesAuxEpisodes,
  ClasseReserveError,
  dossierOuvert,
  etatDeLOffre,
  OffreRequiseError,
  releveOuvert,
  verifierLaClasse,
} from "@/services/acces.service";
import { assertCanAddTeacher, getLicenceStatus, setOrgLicence } from "@/services/licence.service";
import { CohorteRefuseeError, creerCohorte, creerCohorteDeLEnseignant, rejoindreCohorte } from "@/services/cohortes.service";
import { episodeOuvert, EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { envoyerCourriel } from "@/lib/courriel";
import { envoyerDemandeDeDevisAction } from "@/app/devis/actions";
import { listerDemandesDeDevis } from "@/services/devis.service";
import { MENTION_TVA, REFUS_DE_LA_CLASSE } from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";
import type { RoundDecisions } from "@/engine/types";

const JOUR = 24 * 60 * 60 * 1000;
const NON_DEMO = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!;
const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let n = 0;
/** Un enseignant inscrit, administrateur de son établissement, sans licence. */
async function enseignant(): Promise<{ userId: string; orgId: string }> {
  n += 1;
  const r = await registerTeacher({
    email: `offres-${n}-${randomUUID()}@lycee.test`,
    password: "motdepasse!",
    displayName: `Prof ${n}`,
    schoolName: `Lycée des offres ${n}`,
  });
  if ("error" in r) throw new Error(r.error);
  return { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
}

/**
 * Une licence, du `debut` à la `fin` (en jours depuis aujourd'hui), avec son périmètre.
 * Une Classe porte une entreprise et un niveau (trois offres, migration 0038) : NOVA au
 * niveau 3 par défaut, celui des parties de ce fichier.
 */
async function licence(
  e: { userId: string; orgId: string },
  perimetre: { arene: "classe" | "campus" | null; episodes: boolean; niveaux?: number[] },
  debut = -10,
  fin = 300,
) {
  const { niveaux, ...reste } = perimetre;
  await setOrgLicence({
    adminId: e.userId,
    organizationId: e.orgId,
    label: "Licence des offres",
    startsAt: new Date(Date.now() + debut * JOUR),
    endsAt: new Date(Date.now() + fin * JOUR),
    maxTeachers: perimetre.arene === "classe" ? 1 : null,
    ...reste,
    ...(perimetre.arene === "classe" ? { entreprises: ["nova"], niveaux: niveaux ?? [3] } : {}),
  });
}

const classe = (e: { userId: string; orgId: string }, level = 3) =>
  createClassGame({
    teacherId: e.userId,
    organizationId: e.orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    level,
  });

const concours = (e: { userId: string; orgId: string }) =>
  createCompetition({
    organizerId: e.userId,
    organizationId: e.orgId,
    name: "Coupe des offres",
    periodicity: "quarter",
    groupSize: 3,
    advancePerGroup: 1,
  });

async function nouvelInvite(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `invite-${randomUUID()}@guest.test`, displayName: "Invité" })
    .returning({ id: users.id });
  return u!.id;
}

describe("pas d'essai en classe : la partie de classe et le concours", () => {
  it("sans licence : refusés, avec le message qui renvoie aux offres", async () => {
    const e = await enseignant();
    await expect(classe(e, 1)).rejects.toBeInstanceOf(ClasseReserveError);
    await expect(classe(e, 3)).rejects.toThrow(REFUS_DE_LA_CLASSE);
    await expect(concours(e)).rejects.toBeInstanceOf(ClasseReserveError);
    // Le refus est de la famille qui ajoute le lien vers les tarifs à l'écran.
    await expect(verifierLaClasse(e.orgId)).rejects.toBeInstanceOf(OffreRequiseError);
  });

  it("licence expirée : même refus, même message, que sans licence (PAR-02)", async () => {
    const e = await enseignant();
    await licence(e, { arene: "campus", episodes: true }, -400, -2);
    expect((await getLicenceStatus(e.orgId)).state).toBe("expiree");
    await expect(classe(e)).rejects.toThrow(REFUS_DE_LA_CLASSE);
    await expect(concours(e)).rejects.toThrow(REFUS_DE_LA_CLASSE);
  });

  it("licence à venir : même refus", async () => {
    const e = await enseignant();
    await licence(e, { arene: "classe", episodes: false }, 5, 300);
    await expect(classe(e)).rejects.toThrow(REFUS_DE_LA_CLASSE);
  });

  it("licence des seuls épisodes : la classe reste fermée", async () => {
    const e = await enseignant();
    await licence(e, { arene: null, episodes: true });
    await expect(classe(e)).rejects.toBeInstanceOf(ClasseReserveError);
  });

  it("offre Classe en cours : partie de classe à son niveau (jusqu'au 6), ou un concours (NOVA), acceptés", async () => {
    const e = await enseignant();
    await licence(e, { arene: "classe", episodes: false, niveaux: [6] });
    expect((await classe(e, 6)).joinCode).toBeTruthy();
    const f = await enseignant();
    await licence(f, { arene: "classe", episodes: false });
    expect((await concours(f)).competitionId).toBeTruthy();
  });

  it("offre Campus en cours : acceptés", async () => {
    const e = await enseignant();
    await licence(e, { arene: "campus", episodes: false });
    expect((await classe(e, 2)).joinCode).toBeTruthy();
    expect((await concours(e)).competitionId).toBeTruthy();
  });

  it("l'offre Classe couvre un enseignant : le second ne s'ajoute pas", async () => {
    const e = await enseignant();
    await licence(e, { arene: "classe", episodes: false });
    await expect(assertCanAddTeacher(e.orgId)).rejects.toThrow(/couvre 1 enseignant/);
  });

  it("une partie de classe commencée sous licence se poursuit une fois la licence expirée", async () => {
    const e = await enseignant();
    await licence(e, { arene: "classe", episodes: false });
    const partie = await classe(e, 3);
    const eleve = await nouvelInvite();
    const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Élève" });
    if ("error" in j) throw new Error(j.error);
    // La licence prend fin.
    await db
      .update(orgLicences)
      .set({ startsAt: new Date(Date.now() - 400 * JOUR), endsAt: new Date(Date.now() - JOUR) })
      .where(eq(orgLicences.organizationId, e.orgId));
    await expect(classe(e, 3)).rejects.toBeInstanceOf(ClasseReserveError);
    await submitTeamDecisions({ gameId: partie.gameId, userId: eleve, payload: DECISIONS });
    const clos = await closeCurrentRound({ gameId: partie.gameId, teacherId: e.userId });
    expect(clos.roundIndex).toBe(1);
  });
});

describe("les épisodes se vendent à part", () => {
  it("une licence de l'arène seule (Classe ou Campus) n'ouvre pas un épisode non démo (compte)", async () => {
    for (const arene of ["classe", "campus"] as const) {
      const e = await enseignant();
      await licence(e, { arene, episodes: false });
      const acces = await accesAuxEpisodes({ userId: await nouvelInvite(), sessionUserId: e.userId });
      expect(acces.licence, arene).toBe(false);
      expect(episodeOuvert(acces, NON_DEMO.code), arene).toBe(false);
      // Les démonstrations restent, en Découverte.
      expect(episodeOuvert(acces, EPISODES_DE_DEMO[0], "decouverte")).toBe(true);
      expect(episodeOuvert(acces, EPISODES_DE_DEMO[0], "standard")).toBe(false);
    }
  });

  it("une licence qui inclut les épisodes les ouvre au compte, à tous les niveaux", async () => {
    const e = await enseignant();
    await licence(e, { arene: "campus", episodes: true });
    const acces = await accesAuxEpisodes({ userId: await nouvelInvite(), sessionUserId: e.userId });
    expect(episodeOuvert(acces, NON_DEMO.code, "expert")).toBe(true);
  });

  it("cohorte de l'administration : fermée sur une licence de l'arène seule, ouverte avec les épisodes", async () => {
    const arene = await enseignant();
    await licence(arene, { arene: "campus", episodes: false });
    const c1 = await creerCohorte("Arène seule", arene.orgId);
    const m1 = await nouvelInvite();
    await rejoindreCohorte(m1, c1.code);
    expect(episodeOuvert(await accesAuxEpisodes({ userId: m1 }), NON_DEMO.code)).toBe(false);

    const episodes = await enseignant();
    await licence(episodes, { arene: null, episodes: true });
    const c2 = await creerCohorte("Épisodes", episodes.orgId);
    const m2 = await nouvelInvite();
    await rejoindreCohorte(m2, c2.code);
    expect(episodeOuvert(await accesAuxEpisodes({ userId: m2 }), NON_DEMO.code, "standard")).toBe(true);
  });

  it("cohorte d'enseignant : refusée sans le périmètre épisodes, acceptée avec, et ouverte à l'élève", async () => {
    const sansEpisodes = await enseignant();
    await licence(sansEpisodes, { arene: "classe", episodes: false });
    await expect(
      creerCohorteDeLEnseignant({ enseignantId: sansEpisodes.userId, nom: "BTS", episodes: [NON_DEMO.code] }),
    ).rejects.toMatchObject({ raison: "licence" });
    await expect(
      creerCohorteDeLEnseignant({ enseignantId: sansEpisodes.userId, nom: "BTS", episodes: [NON_DEMO.code] }),
    ).rejects.toBeInstanceOf(CohorteRefuseeError);

    const avec = await enseignant();
    await licence(avec, { arene: "classe", episodes: true });
    const c = await creerCohorteDeLEnseignant({ enseignantId: avec.userId, nom: "BTS", episodes: [NON_DEMO.code] });
    const eleve = await nouvelInvite();
    await rejoindreCohorte(eleve, c.code);
    expect(episodeOuvert(await accesAuxEpisodes({ userId: eleve }), NON_DEMO.code, "standard")).toBe(true);
  });
});

describe("le dossier enseignant et le relevé suivent la règle de la classe", () => {
  it("dossier : fermé sans licence et licence expirée, ouvert sous licence de l'arène", async () => {
    const sans = await enseignant();
    expect(await dossierOuvert(sans.userId)).toBe(false);
    const expire = await enseignant();
    await licence(expire, { arene: "classe", episodes: false }, -400, -2);
    expect(await dossierOuvert(expire.userId)).toBe(false);
    const episodesSeuls = await enseignant();
    await licence(episodesSeuls, { arene: null, episodes: true });
    expect(await dossierOuvert(episodesSeuls.userId)).toBe(false);
    const avec = await enseignant();
    await licence(avec, { arene: "classe", episodes: false });
    expect(await dossierOuvert(avec.userId)).toBe(true);
  });

  it("relevé : fermé sans licence ; ouvert sous licence et dans les mois qui suivent sa fin ; fermé au-delà", async () => {
    const sans = await enseignant();
    expect(await releveOuvert(sans.orgId)).toBe(false);
    expect(await releveOuvert(null)).toBe(false);
    const avec = await enseignant();
    await licence(avec, { arene: "campus", episodes: false });
    expect(await releveOuvert(avec.orgId)).toBe(true);
    const recente = await enseignant();
    await licence(recente, { arene: "classe", episodes: false }, -400, -30);
    expect(await releveOuvert(recente.orgId)).toBe(true);
    const ancienne = await enseignant();
    await licence(ancienne, { arene: "classe", episodes: false }, -900, -400);
    expect(await releveOuvert(ancienne.orgId)).toBe(false);
  });
});

describe("l'état de l'offre, pour l'en-tête de l'espace enseignant", () => {
  it("dit l'offre de l'arène, l'établissement, la fin, et les épisodes s'ils sont inclus", async () => {
    const sans = await enseignant();
    expect(await etatDeLOffre(sans.userId)).toMatchObject({ arene: null, episodes: null });

    const campus = await enseignant();
    await licence(campus, { arene: "campus", episodes: true });
    const etat = await etatDeLOffre(campus.userId);
    expect(etat.arene).toMatchObject({ offre: "campus", state: "active" });
    expect(etat.episodes?.licence?.episodes).toBe(true);
    expect(etat.etablissement).toMatch(/^Lycée des offres/);

    const bientot = await enseignant();
    await licence(bientot, { arene: "classe", episodes: false }, -300, 10);
    expect((await etatDeLOffre(bientot.userId)).arene).toMatchObject({ offre: "classe", state: "bientot_expiree" });

    const expiree = await enseignant();
    await licence(expiree, { arene: "classe", episodes: false }, -400, -2);
    expect((await etatDeLOffre(expiree.userId)).arene).toMatchObject({ offre: "classe", state: "expiree" });
  });
});

describe("une licence porte son périmètre", () => {
  it("par défaut (licence d'avant la décision, ligne insérée sans périmètre) : l'arène, sans les épisodes", async () => {
    const e = await enseignant();
    await db.insert(orgLicences).values({
      organizationId: e.orgId,
      label: "Licence ancienne",
      startsAt: new Date(Date.now() - 10 * JOUR),
      endsAt: new Date(Date.now() + 300 * JOUR),
    });
    const [l] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, e.orgId));
    expect(l).toMatchObject({ arene: "campus", episodes: false });
    expect((await classe(e)).joinCode).toBeTruthy();
    const acces = await accesAuxEpisodes({ userId: await nouvelInvite(), sessionUserId: e.userId });
    expect(acces.licence).toBe(false);
  });

  it("une licence sans l'arène ni les épisodes est refusée", async () => {
    const e = await enseignant();
    await expect(licence(e, { arene: null, episodes: false })).rejects.toThrow(/choisissez/);
  });
});

describe("la demande de devis écrite", () => {
  const formulaire = (champs: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(champs)) f.set(k, v);
    return f;
  };
  const ETAT = { error: null, ok: null, values: null };

  it("est enregistrée avec son offre, notifie l'adresse de contact, et dit la vérité sur l'accusé", async () => {
    const envoi = vi.mocked(envoyerCourriel);
    envoi.mockReset();
    // La notification part ; l'accusé au demandeur, non.
    envoi.mockImplementation(async (c) =>
      c.a === "contact@business-arena.fr" ? { envoye: true } : { envoye: false, raison: "non_configure" },
    );
    const r = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({
        offre: "campus",
        nom: "Claire Martin",
        fonction: "Proviseure adjointe",
        organisation: "Lycée Pasteur",
        identifiant: "0590001A",
        effectif: "7",
        email: "claire.martin@lycee.test",
        message: "Pour la rentrée.",
        site: "",
      }),
    );
    expect(r.error).toBeNull();
    expect(r.ok).toEqual({ email: "claire.martin@lycee.test", offre: "campus", accuseEnvoye: false });

    const [d] = (await listerDemandesDeDevis()).filter((x) => x.email === "claire.martin@lycee.test");
    expect(d).toMatchObject({
      offre: "campus",
      organisation: "Lycée Pasteur",
      identifiant: "0590001A",
      effectif: 7,
      notificationEnvoyee: true,
      accuseEnvoye: false,
      traiteeLe: null,
    });
    const notification = envoi.mock.calls.find(([c]) => c.a === "contact@business-arena.fr")![0];
    expect(notification.sujet).toContain("Offre Campus");
    expect(notification.texte).toContain("Lycée Pasteur");
    expect(notification.texte).toContain(VENDEUR.nom);
    expect(notification.texte).toContain(MENTION_TVA);
    expect(notification.repondreA).toBe("claire.martin@lycee.test");
  });

  it("garde l'offre « entreprise » et refuse une offre inconnue", async () => {
    vi.mocked(envoyerCourriel).mockResolvedValue({ envoye: true });
    const ok = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({
        offre: "entreprise",
        nom: "Paul Durand",
        fonction: "Responsable formation",
        organisation: "Groupe Durand",
        email: "paul@entreprise.test",
        site: "",
      }),
    );
    expect(ok.ok).toMatchObject({ offre: "entreprise", accuseEnvoye: true });
    const rows = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, "paul@entreprise.test"));
    expect(rows.map((x) => x.offre)).toEqual(["entreprise"]);

    const ko = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ offre: "gratuit", nom: "X Y", fonction: "Z Z", organisation: "W W", email: "x@y.test", site: "" }),
    );
    expect(ko.ok).toBeNull();
    expect(ko.error).toBeTruthy();
    expect(ko.values?.nom).toBe("X Y");
  });
});
