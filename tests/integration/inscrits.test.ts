import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LES INSCRITS, LEUR EXPORT ET LE CONSENTEMENT AUX NOUVEAUTÉS, VÉRIFIÉS CÔTÉ SERVEUR.
 *
 * Demande du propriétaire (octobre 2026) : « Comment voir qui est inscrit sur le site ? Les
 * professeurs, comment les contacter ? ». Ce test pose les règles là où elles tiennent
 * quel que soit l'écran :
 *  · la page, le service et l'export sont refusés sans session, et à un administrateur
 *    d'établissement : seul l'administrateur de la plateforme les lit ;
 *  · AUCUN ÉLÈVE, ni à l'écran ni dans l'export : ni l'invité qui a rejoint une partie par
 *    code, ni le membre « élève » d'un établissement, ni l'élève venu d'une plateforme ;
 *  · les colonnes disent juste : établissements et rôles, offre en cours, parties de classe
 *    et cohortes créées, provenance, dernière connexion, consentement ;
 *  · recherche, filtres, tri, pagination ; l'export « consentants » et son lien ;
 *  · l'inscription avec et sans la case (jamais cochée par défaut), le réglage dans
 *    l'espace enseignant, la désinscription par jeton valide, faux, déjà utilisé, et par
 *    le POST de la messagerie (RFC 8058).
 * Les actions serveur et les routes sont appelées pour de vrai, avec la session qu'on leur
 * donne ; seule la redirection de Next est remplacée par une exception lisible.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
  notFound: () => {
    throw new Error("__notFound__");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "127.0.0.1:3520" }),
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { sqlDe } from "../helpers/migrations";
import { db } from "@/db";
import { ltiComptes, ltiPlateformes, organizationMembers, samlComptes, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { envoyerCourriel } from "@/lib/courriel";
import { getTeacherOrgId, loginTeacher, registerTeacher } from "@/services/auth.service";
import { createClassGame, joinGameByCode } from "@/services/game.service";
import { creerCohorteDeLEnseignant } from "@/services/cohortes.service";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { TEXTE_DU_CONSENTEMENT, VERSION_DU_TEXTE } from "@/config/nouveautes";
import {
  COLONNES_DE_L_EXPORT,
  COLONNE_DU_LIEN,
  exporterLesInscrits,
  FILTRES_PAR_DEFAUT,
  lireLesFiltres,
  listerInscrits,
  TAILLE_DE_PAGE,
  type FiltresDesInscrits,
} from "@/services/inscrits.service";
import {
  courrielDeNouveautes,
  desinscrireParJeton,
  enregistrerConsentement,
  jetonDeDesinscription,
  lienDeDesinscription,
} from "@/services/nouveautes.service";
import { registerAction } from "@/app/teacher/actions";
import { reglerNouveautesAction } from "@/app/teacher/compte/actions";
import { GET as exporter } from "@/app/admin/inscrits/export/route";
import { POST as desinscrireEnUnClic, GET as ouvrirLeLienDeLEnTete } from "@/app/api/nouveautes/desinscription/route";
import AdminInscritsPage from "@/app/admin/inscrits/page";
import { etablissementSousLicence, poserUneLicence } from "./helpers/licence";

const session = vi.mocked(getSession);
const commeCompte = (userId: string | null) =>
  session.mockResolvedValue(userId ? { userId, role: "teacher" } : null);
const filtres = (f: Partial<FiltresDesInscrits> = {}): FiltresDesInscrits => ({ ...FILTRES_PAR_DEFAUT, ...f });
const JOUR = 24 * 60 * 60 * 1000;

let admin: string;
/** Un enseignant sous licence Campus + épisodes, avec une partie, une cohorte, un élève. */
let campus: { userId: string; orgId: string };
/** Un administrateur d'établissement sans licence (Découverte), inscrit avec la case. */
let decouverte: string;
let codeDeLaPartie: string;
const ELEVE_INVITE = "Pseudo-Eleve-Invite";
const ELEVE_MEMBRE = "eleve.membre@lycee.test";
const ELEVE_LTI = "Prenom-Eleve-LTI";
const ETUDIANT_RENATER = "Etudiant-Renater";

async function inscrire(email: string, nom: string, etablissement: string, nouveautes?: boolean): Promise<string> {
  const r = await registerTeacher({ email, password: "motdepasse!", displayName: nom, schoolName: etablissement, nouveautes });
  if ("error" in r) throw new Error(r.error);
  return r.userId;
}

beforeAll(async () => {
  const [a] = await db
    .insert(users)
    .values({ email: "admin@business-arena.test", displayName: "Admin", isPlatformAdmin: true, provenance: "inscription" })
    .returning({ id: users.id });
  admin = a!.id;

  campus = await etablissementSousLicence("Sous Campus", { arene: "campus", episodes: true });
  await db.update(users).set({ displayName: "Mme Lefèvre" }).where(eq(users.id, campus.userId));
  const partie = await createClassGame({
    teacherId: campus.userId,
    organizationId: campus.orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    level: 2,
  });
  codeDeLaPartie = partie.joinCode;
  await creerCohorteDeLEnseignant({ enseignantId: campus.userId, nom: "Seconde 4", episodes: [EPISODES_DE_DEMO[0]] });

  // L'élève invité qui rejoint la partie par son code.
  const [invite] = await db
    .insert(users)
    .values({ email: `guest-${randomUUID()}@guest.business-arena.local`, displayName: ELEVE_INVITE })
    .returning({ id: users.id });
  const rejoint = await joinGameByCode({ code: codeDeLaPartie, userId: invite!.id, pseudo: ELEVE_INVITE });
  expect("gameId" in rejoint).toBe(true);
  // Un compte membre de l'établissement en tant qu'ÉLÈVE seulement.
  const [membre] = await db
    .insert(users)
    .values({ email: ELEVE_MEMBRE, displayName: "Eleve Membre" })
    .returning({ id: users.id });
  await db.insert(organizationMembers).values({ userId: membre!.id, organizationId: campus.orgId, role: "student" });

  decouverte = await inscrire("direction@college-ecole.test", "M. Durand", "Collège Émile Zola", true);

  // Un enseignant et un élève venus d'une plateforme LTI.
  const [p] = await db
    .insert(ltiPlateformes)
    .values({
      nom: "Moodle",
      issuer: "https://moodle.test",
      clientId: "c",
      urlAuthentification: "https://moodle.test/auth",
      urlJeton: "https://moodle.test/token",
      urlJwks: "https://moodle.test/jwks",
      organizationId: campus.orgId,
      sel: "sel",
    })
    .returning({ id: ltiPlateformes.id });
  const idLti = randomUUID();
  await db.insert(users).values({
    id: idLti,
    email: `lti-${idLti}@lti.business-arena.local`,
    displayName: "M. Moodle",
    provenance: "lti",
  });
  await db.insert(ltiComptes).values({ plateformeId: p!.id, subHache: "h1", role: "enseignant", userId: idLti, courriel: "moodle.prof@lycee.test" });
  await db.insert(organizationMembers).values({ userId: idLti, organizationId: campus.orgId, role: "teacher" });
  const idEleve = randomUUID();
  await db.insert(users).values({ id: idEleve, email: `guest-${idEleve}@guest.business-arena.local`, displayName: ELEVE_LTI });
  await db.insert(ltiComptes).values({ plateformeId: p!.id, subHache: "h2", role: "eleve", userId: idEleve });

  // Un enseignant et un étudiant venus de la fédération RENATER.
  const idRenater = randomUUID();
  await db.insert(users).values({
    id: idRenater,
    email: `saml-${idRenater}@saml.business-arena.local`,
    displayName: "Mme Renater",
    provenance: "renater",
  });
  await db.insert(samlComptes).values({
    idpEntityId: "https://idp.univ.test",
    identifiantHache: "r1",
    role: "enseignant",
    userId: idRenater,
    organizationId: campus.orgId,
    courriel: "renater.prof@univ.test",
  });
  await db.insert(organizationMembers).values({ userId: idRenater, organizationId: campus.orgId, role: "teacher" });
  const idEtudiant = randomUUID();
  await db.insert(users).values({ id: idEtudiant, email: `guest-${idEtudiant}@guest.business-arena.local`, displayName: ETUDIANT_RENATER });
  await db.insert(samlComptes).values({ idpEntityId: "https://idp.univ.test", identifiantHache: "r2", role: "etudiant", userId: idEtudiant });
});

describe("l'accès : l'administrateur de la plateforme, et lui seul", () => {
  it("le service refuse un administrateur d'établissement", async () => {
    await expect(listerInscrits(decouverte)).rejects.toThrow(/administrateur de la plateforme/);
    await expect(exporterLesInscrits(decouverte, filtres(), { consentants: false })).rejects.toThrow();
  });

  it("l'export : 401 sans session, 403 pour un administrateur d'établissement, 200 pour l'admin", async () => {
    commeCompte(null);
    expect((await exporter(new Request("http://127.0.0.1/admin/inscrits/export"))).status).toBe(401);
    commeCompte(decouverte);
    expect((await exporter(new Request("http://127.0.0.1/admin/inscrits/export"))).status).toBe(403);
    commeCompte(admin);
    const r = await exporter(new Request("http://127.0.0.1/admin/inscrits/export"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(r.headers.get("content-disposition")).toMatch(/^attachment; filename="inscrits-\d{4}-\d{2}-\d{2}\.csv"$/);
  });

  it("la page : renvoi à la connexion sans session, vers l'espace enseignant pour un admin d'établissement", async () => {
    commeCompte(null);
    await expect(AdminInscritsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("__redirect__/teacher/login");
    commeCompte(decouverte);
    await expect(AdminInscritsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("__redirect__/teacher");
    commeCompte(admin);
    await expect(AdminInscritsPage({ searchParams: Promise.resolve({ q: "lefevre" }) })).resolves.toBeTruthy();
  });
});

describe("le tableau : le personnel seulement, et ce qu'il fait de la plateforme", () => {
  it("aucun élève : ni invité, ni membre « élève », ni élève LTI, ni étudiant RENATER", async () => {
    const { lignes } = await listerInscrits(admin);
    const noms = lignes.map((l) => l.nom);
    expect(noms).toEqual(expect.arrayContaining(["Admin", "Mme Lefèvre", "M. Durand", "M. Moodle"]));
    expect(noms).not.toContain(ELEVE_INVITE);
    expect(noms).not.toContain("Eleve Membre");
    expect(noms).not.toContain(ELEVE_LTI);
    expect(noms).not.toContain(ETUDIANT_RENATER);
    expect(noms).toContain("Mme Renater");
  });

  it("les colonnes : établissement et rôle, offre, parties de classe, cohortes, provenance, connexion", async () => {
    const { lignes } = await listerInscrits(admin);
    const lefevre = lignes.find((l) => l.nom === "Mme Lefèvre")!;
    expect(lefevre.etablissements).toEqual([expect.objectContaining({ role: "org_admin" })]);
    expect(lefevre.offre).toEqual({ arene: "campus", episodes: true });
    expect(lefevre.partiesDeClasse).toBe(1);
    expect(lefevre.cohortes).toBe(1);
    expect(lefevre.provenance).toBe("inscription");
    expect(lefevre.derniereConnexionLe).toBeInstanceOf(Date);

    const durand = lignes.find((l) => l.nom === "M. Durand")!;
    expect(durand.offre).toEqual({ arene: null, episodes: false });
    expect(durand.etablissements[0]).toMatchObject({ nom: "Collège Émile Zola", role: "org_admin" });

    // L'enseignant LTI : son adresse est le courriel transmis, pas l'adresse technique.
    const moodle = lignes.find((l) => l.nom === "M. Moodle")!;
    expect(moodle.provenance).toBe("lti");
    expect(moodle.email).toBe("moodle.prof@lycee.test");
    expect(moodle.etablissements[0]).toMatchObject({ role: "teacher" });
    expect(moodle.offre.arene).toBe("campus");

    // L'enseignant RENATER : la provenance, le courriel transmis par son établissement.
    const renater = lignes.find((l) => l.nom === "Mme Renater")!;
    expect(renater.provenance).toBe("renater");
    expect(renater.email).toBe("renater.prof@univ.test");

    const a = lignes.find((l) => l.nom === "Admin")!;
    expect(a.adminPlateforme).toBe(true);
    expect(a.etablissements).toEqual([]);
  });

  it("la dernière connexion avance à la connexion par mot de passe", async () => {
    const avant = (await listerInscrits(admin)).lignes.find((l) => l.nom === "M. Durand")!.derniereConnexionLe!;
    await new Promise((r) => setTimeout(r, 20));
    const ok = await loginTeacher({ email: "direction@college-ecole.test", password: "motdepasse!" });
    expect("userId" in ok).toBe(true);
    const apres = (await listerInscrits(admin)).lignes.find((l) => l.nom === "M. Durand")!.derniereConnexionLe!;
    expect(apres.getTime()).toBeGreaterThan(avant.getTime());
  });

  it("les compteurs portent sur tous les inscrits, quels que soient les filtres", async () => {
    const tout = await listerInscrits(admin);
    const filtre = await listerInscrits(admin, filtres({ q: "zola" }));
    expect(filtre.compteurs).toEqual(tout.compteurs);
    expect(tout.compteurs.enseignants).toBe(tout.total);
    expect(tout.compteurs.etablissementsSousLicence).toBeGreaterThanOrEqual(1);
    expect(tout.compteurs.etablissementsSousLicence).toBeLessThan(tout.compteurs.etablissements);
    expect(tout.compteurs.consentants).toBe(tout.lignes.filter((l) => l.consentement.consent).length);
  });

  it("recherche sans accents (nom, e-mail, établissement) et filtres", async () => {
    expect((await listerInscrits(admin, filtres({ q: "lefevre" }))).lignes.map((l) => l.nom)).toEqual(["Mme Lefèvre"]);
    expect((await listerInscrits(admin, filtres({ q: "EMILE zola" }))).lignes.map((l) => l.nom)).toEqual(["M. Durand"]);
    expect((await listerInscrits(admin, filtres({ q: "moodle.prof@" }))).lignes.map((l) => l.nom)).toEqual(["M. Moodle"]);
    const campusSeul = (await listerInscrits(admin, filtres({ offre: "campus" }))).lignes.map((l) => l.nom);
    expect(campusSeul).toEqual(expect.arrayContaining(["Mme Lefèvre", "M. Moodle"]));
    expect(campusSeul).not.toContain("M. Durand");
    expect((await listerInscrits(admin, filtres({ offre: "episodes" }))).lignes.every((l) => l.offre.episodes)).toBe(true);
    expect((await listerInscrits(admin, filtres({ offre: "decouverte" }))).lignes.map((l) => l.nom)).toContain("M. Durand");
    const consentants = (await listerInscrits(admin, filtres({ consentement: "oui" }))).lignes;
    expect(consentants.map((l) => l.nom)).toContain("M. Durand");
    expect(consentants.every((l) => l.consentement.consent)).toBe(true);
  });

  it("« inscrits depuis 30 jours », tri par date et pagination", async () => {
    await db.update(users).set({ createdAt: new Date(Date.now() - 90 * JOUR) }).where(eq(users.id, admin));
    const nouveaux = (await listerInscrits(admin, filtres({ nouveaux: true }))).lignes.map((l) => l.nom);
    expect(nouveaux).not.toContain("Admin");
    expect(nouveaux).toContain("M. Durand");
    const anciens = (await listerInscrits(admin, filtres({ tri: "anciens" }))).lignes;
    expect(anciens[0]!.nom).toBe("Admin");
    const recents = (await listerInscrits(admin)).lignes;
    expect(recents.at(-1)!.nom).toBe("Admin");

    for (let i = 0; i < TAILLE_DE_PAGE; i++) {
      await db.insert(users).values({ email: `prof${i}@masse.test`, displayName: `Prof ${i}`, provenance: "inscription" }).returning();
    }
    const masse = await db.select({ id: users.id }).from(users);
    const profs = (await db.select().from(users)).filter((u) => u.email.endsWith("@masse.test"));
    await db.insert(organizationMembers).values(profs.map((u) => ({ userId: u.id, organizationId: campus.orgId, role: "teacher" as const })));
    expect(masse.length).toBeGreaterThan(TAILLE_DE_PAGE);
    const p1 = await listerInscrits(admin);
    const p2 = await listerInscrits(admin, filtres({ page: 2 }));
    expect(p1.pages).toBe(2);
    expect(p1.lignes).toHaveLength(TAILLE_DE_PAGE);
    expect(p2.lignes.length).toBe(p1.total - TAILLE_DE_PAGE);
    expect(new Set([...p1.lignes, ...p2.lignes].map((l) => l.id)).size).toBe(p1.total);
    // Une page au-delà de la dernière retombe sur la dernière.
    expect((await listerInscrits(admin, filtres({ page: 99 }))).page).toBe(2);
  });

  it("les filtres se lisent dans l'adresse ; une valeur inconnue retombe au défaut", () => {
    expect(
      lireLesFiltres({ q: " zola ", offre: "campus", consentement: "oui", etat: "desactive", nouveaux: "1", tri: "anciens", page: "2" }),
    ).toEqual({
      q: "zola",
      offre: "campus",
      consentement: "oui",
      etat: "desactive",
      nouveaux: true,
      tri: "anciens",
      page: 2,
    });
    expect(lireLesFiltres({ offre: "entreprise", consentement: "peut-etre", etat: "x", page: "-3", tri: "x" })).toEqual(FILTRES_PAR_DEFAUT);
  });
});

describe("l'export CSV", () => {
  const lire = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n").map((l) => l.split(";"));

  it("BOM, point-virgule, les colonnes du tableau, aucune donnée d'élève", async () => {
    commeCompte(admin);
    const r = await exporter(new Request("http://127.0.0.1/admin/inscrits/export"));
    // La signature d'octets UTF-8 en tête (Response.text() la retire au décodage).
    const octets = new Uint8Array(await r.arrayBuffer());
    expect([...octets.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const brut = new TextDecoder().decode(octets);
    const lignes = lire(brut);
    expect(lignes[0]).toEqual([...COLONNES_DE_L_EXPORT]);
    expect(lignes.every((l) => l.length === COLONNES_DE_L_EXPORT.length)).toBe(true);
    for (const interdit of [ELEVE_INVITE, ELEVE_MEMBRE, "Eleve Membre", ELEVE_LTI, ETUDIANT_RENATER, "business-arena.local"]) {
      expect(brut, interdit).not.toContain(interdit);
    }
    const lefevre = lignes.find((l) => l[0] === "Mme Lefèvre")!;
    expect(lefevre[2]).toMatch(/\(administrateur\)$/);
    expect(lefevre[3]).toBe("Campus + Épisodes manager");
    expect(lefevre[4]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(lefevre[6]).toBe("1");
    expect(lefevre[7]).toBe("1");
    expect(lefevre[8]).toBe("Inscription directe");
    expect(lignes.find((l) => l[0] === "M. Moodle")![8]).toBe("Plateforme LTI");
    expect(lignes.find((l) => l[0] === "Mme Renater")![8]).toBe("RENATER");
  });

  it("les filtres de la page s'appliquent à l'export", async () => {
    commeCompte(admin);
    const r = await exporter(new Request("http://127.0.0.1/admin/inscrits/export?q=zola"));
    const lignes = lire(await r.text());
    expect(lignes.slice(1).map((l) => l[0])).toEqual(["M. Durand"]);
  });

  it("« consentants seulement » : ceux qui consentent et ont une adresse, avec leur lien", async () => {
    await enregistrerConsentement(campus.userId, false);
    commeCompte(admin);
    const r = await exporter(new Request("http://127.0.0.1/admin/inscrits/export?consentants=1"));
    expect(r.headers.get("content-disposition")).toMatch(/filename="inscrits-consentants-\d{4}-\d{2}-\d{2}\.csv"/);
    const lignes = lire(await r.text());
    expect(lignes[0]).toEqual([...COLONNES_DE_L_EXPORT, COLONNE_DU_LIEN]);
    const noms = lignes.slice(1).map((l) => l[0]);
    expect(noms).toContain("M. Durand");
    expect(noms).not.toContain("Mme Lefèvre");
    const durand = lignes.find((l) => l[0] === "M. Durand")!;
    expect(durand[9]).toBe("actif");
    expect(durand[10]).toBe("oui");
    expect(durand[12]).toBe(VERSION_DU_TEXTE);
    expect(durand[14]).toBe(`http://127.0.0.1:3520/nouveautes/desinscription?jeton=${encodeURIComponent(jetonDeDesinscription(decouverte))}`);
  });

  it("une cellule qui commence par = est neutralisée", async () => {
    const id = await inscrire("formule@lycee.test", "=HYPERLINK(\"http://x\")", "Lycée ;Formule");
    const { contenu } = await exporterLesInscrits(admin, filtres({ q: "formule@" }), { consentants: false });
    const ligne = contenu.split("\r\n")[1]!;
    expect(ligne.startsWith(`"'=HYPERLINK(""http://x"")";`)).toBe(true);
    expect(ligne).toContain(`"Lycée ;Formule (administrateur)"`);
    await db.delete(users).where(eq(users.id, id));
  });
});

describe("le consentement aux nouveautés", () => {
  it("inscription SANS la case : aucun accord enregistré", async () => {
    const id = await inscrire("sans.case@lycee.test", "Sans Case", "Lycée Sans");
    const [u] = await db.select().from(users).where(eq(users.id, id));
    expect(u!.nouveautesConsentiesLe).toBeNull();
    expect(u!.nouveautesVersionDuTexte).toBeNull();
    expect(u!.provenance).toBe("inscription");
  });

  it("inscription AVEC la case, par l'action du formulaire : date et version du texte", async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({
      displayName: "Avec Case",
      email: "avec.case@lycee.test",
      password: "motdepasse!",
      schoolName: "Lycée Avec",
      inviteCode: "",
      nouveautes: "oui",
    })) {
      fd.set(k, v);
    }
    await expect(registerAction({ error: null }, fd)).rejects.toThrow("__redirect__/teacher");
    const [u] = await db.select().from(users).where(eq(users.email, "avec.case@lycee.test"));
    expect(u!.nouveautesConsentiesLe).toBeInstanceOf(Date);
    expect(u!.nouveautesVersionDuTexte).toBe(VERSION_DU_TEXTE);
    expect(u!.nouveautesRetireesLe).toBeNull();

    // Le même formulaire sans la case n'enregistre rien.
    fd.set("email", "toujours.sans@lycee.test");
    fd.delete("nouveautes");
    await expect(registerAction({ error: null }, fd)).rejects.toThrow("__redirect__/teacher");
    const [v] = await db.select().from(users).where(eq(users.email, "toujours.sans@lycee.test"));
    expect(v!.nouveautesConsentiesLe).toBeNull();
  });

  it("le réglage de l'espace enseignant coche et décoche, sans effacer la date de l'accord", async () => {
    const id = await inscrire("reglage@lycee.test", "Réglage", "Lycée Réglage");
    commeCompte(id);
    const coche = new FormData();
    coche.set("nouveautes", "oui");
    await expect(reglerNouveautesAction(coche)).rejects.toThrow("__redirect__/teacher/compte?fait=oui#nouveautes");
    const [a] = await db.select().from(users).where(eq(users.id, id));
    expect(a!.nouveautesConsentiesLe).toBeInstanceOf(Date);
    // Re-cocher ne change pas la date de l'accord.
    await expect(reglerNouveautesAction(coche)).rejects.toThrow(/fait=oui/);
    const [b] = await db.select().from(users).where(eq(users.id, id));
    expect(b!.nouveautesConsentiesLe!.getTime()).toBe(a!.nouveautesConsentiesLe!.getTime());
    await expect(reglerNouveautesAction(new FormData())).rejects.toThrow("__redirect__/teacher/compte?fait=non#nouveautes");
    const [c] = await db.select().from(users).where(eq(users.id, id));
    expect(c!.nouveautesRetireesLe).toBeInstanceOf(Date);
    expect(c!.nouveautesConsentiesLe!.getTime()).toBe(a!.nouveautesConsentiesLe!.getTime());
    // Sans session : la connexion.
    commeCompte(null);
    await expect(reglerNouveautesAction(coche)).rejects.toThrow("__redirect__/teacher/login");
  });

  it("désinscription par jeton : valide, puis déjà utilisé, puis faux", async () => {
    const id = await inscrire("jeton@lycee.test", "Jeton", "Lycée Jeton", true);
    const jeton = jetonDeDesinscription(id);
    expect(lienDeDesinscription({ id })).toBe(
      `https://www.business-arena.fr/nouveautes/desinscription?jeton=${encodeURIComponent(jeton)}`,
    );
    const r1 = await desinscrireParJeton(jeton);
    expect(r1.etat).toBe("desinscrit");
    const [u] = await db.select().from(users).where(eq(users.id, id));
    expect(u!.nouveautesRetireesLe).toBeInstanceOf(Date);
    const r2 = await desinscrireParJeton(jeton);
    expect(r2).toEqual({ etat: "deja", le: u!.nouveautesRetireesLe });

    // Signature altérée, compte d'un autre, compte inconnu, forme quelconque.
    const autre = await inscrire("autre.jeton@lycee.test", "Autre", "Lycée Autre", true);
    const [, sig] = jeton.split(".");
    expect((await desinscrireParJeton(`${autre}.${sig}`)).etat).toBe("invalide");
    expect((await desinscrireParJeton(`${jeton.slice(0, -2)}xx`)).etat).toBe("invalide");
    expect((await desinscrireParJeton(jetonDeDesinscription(randomUUID()))).etat).toBe("invalide");
    expect((await desinscrireParJeton("n'importe quoi")).etat).toBe("invalide");
    expect((await desinscrireParJeton(undefined)).etat).toBe("invalide");
    // L'autre compte n'a pas été touché.
    const [v] = await db.select().from(users).where(eq(users.id, autre));
    expect(v!.nouveautesRetireesLe).toBeNull();
    // Un compte qui n'a jamais consenti : rien à retirer.
    const jamais = await inscrire("jamais@lycee.test", "Jamais", "Lycée Jamais");
    expect((await desinscrireParJeton(jetonDeDesinscription(jamais))).etat).toBe("jamais");
  });

  it("le bouton de la messagerie (RFC 8058) : POST en un clic ; GET renvoie à la page", async () => {
    const id = await inscrire("messagerie@lycee.test", "Messagerie", "Lycée Messagerie", true);
    const adresse = `http://127.0.0.1:3520/api/nouveautes/desinscription?jeton=${encodeURIComponent(jetonDeDesinscription(id))}`;
    const ouvert = await ouvrirLeLienDeLEnTete(new Request(adresse));
    expect(ouvert.status).toBe(303);
    expect(ouvert.headers.get("location")).toContain("/nouveautes/desinscription?jeton=");
    const [avant] = await db.select().from(users).where(eq(users.id, id));
    expect(avant!.nouveautesRetireesLe).toBeNull();
    const r = await desinscrireEnUnClic(new Request(adresse, { method: "POST", body: "List-Unsubscribe=One-Click" }));
    expect(r.status).toBe(200);
    const [apres] = await db.select().from(users).where(eq(users.id, id));
    expect(apres!.nouveautesRetireesLe).toBeInstanceOf(Date);
    const faux = await desinscrireEnUnClic(new Request("http://127.0.0.1/api/nouveautes/desinscription?jeton=faux", { method: "POST" }));
    expect(faux.status).toBe(400);
  });

  it("l'e-mail de nouveautés : refusé sans accord ; sinon lien en pied et en-tête List-Unsubscribe", async () => {
    const id = await inscrire("courriel@lycee.test", "Courriel", "Lycée Courriel");
    const lire = async () => (await db.select().from(users).where(eq(users.id, id)))[0]!;
    expect(courrielDeNouveautes(await lire(), { sujet: "Nouveau", texte: "Bonjour" })).toBeNull();
    await enregistrerConsentement(id, true);
    const c = courrielDeNouveautes(await lire(), { sujet: "Nouveau", texte: "Bonjour" })!;
    expect(c.a).toBe("courriel@lycee.test");
    expect(c.texte).toContain(lienDeDesinscription({ id }));
    expect(c.desinscription).toContain("/api/nouveautes/desinscription?jeton=");
    const poster = vi.fn(async () => ({ ok: true, status: 200 }));
    await envoyerCourriel(c, { RESEND_API_KEY: "re_test" }, poster as unknown as typeof fetch);
    const corps = JSON.parse(String((poster.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(corps.headers).toEqual({
      "List-Unsubscribe": `<${c.desinscription}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    // Un compte LTI sans courriel transmis n'a pas d'adresse : rien à envoyer.
    const sansAdresse = { ...(await lire()), email: `lti-${id}@lti.business-arena.local`, courrielTransmis: null };
    expect(courrielDeNouveautes(sansAdresse, { sujet: "Nouveau", texte: "Bonjour" })).toBeNull();
  });

  it("le texte de la case est celui que la page d'inscription montre", () => {
    expect(TEXTE_DU_CONSENTEMENT).toBe(
      "Recevoir les nouveautés de Business Arena, au plus une fois par mois. Désinscription en un clic.",
    );
  });
});

describe("la migration 0040", () => {
  it("rejouée, elle donne une provenance au personnel d'avant, et aucune à un élève", async () => {
    const tous = await db.select().from(users);
    const idLti = tous.find((u) => u.displayName === "M. Moodle")!.id;
    const idRenater = tous.find((u) => u.displayName === "Mme Renater")!.id;
    for (const id of [decouverte, idLti, idRenater]) {
      await db.update(users).set({ provenance: null }).where(eq(users.id, id));
    }
    for (const instruction of sqlDe("0040_inscrits_et_nouveautes").split("--> statement-breakpoint")) {
      if (instruction.trim()) await db.execute(sql.raw(instruction));
    }
    const lire = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0]!;
    expect((await lire(decouverte)).provenance).toBe("inscription");
    expect((await lire(idLti)).provenance).toBe("lti");
    expect((await lire(idRenater)).provenance).toBe("renater");
    const [eleve] = await db.select().from(users).where(eq(users.email, ELEVE_MEMBRE));
    expect(eleve!.provenance).toBeNull();
  });

  it("une licence Classe se lit « Classe » dans le tableau", async () => {
    const orgId = (await getTeacherOrgId(decouverte))!;
    await poserUneLicence(orgId, decouverte, { arene: "classe", entreprises: ["nova"], niveaux: [1] });
    const { lignes } = await listerInscrits(admin, filtres({ offre: "classe" }));
    expect(lignes.map((l) => l.nom)).toContain("M. Durand");
  });
});
