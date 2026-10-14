import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA GESTION DES INSCRIPTIONS (/admin/inscrits), VÉRIFIÉE CÔTÉ SERVEUR.
 *
 * Ajout du propriétaire : « la gestion des inscriptions ». Ce test pose :
 *  · la DÉSACTIVATION : connexion refusée, session en cours coupée (avec la VRAIE lecture de
 *    session, cookie signé compris), parties intactes ; la réactivation rend tout ;
 *  · le RATTACHEMENT à un établissement, le changement de rôle, le plafond de licence, le
 *    retrait (jamais du dernier établissement) ;
 *  · les RÉGLAGES : inscription libre, domaines autorisés ou bloqués, codes d'invitation
 *    (créer, révoquer, l'usage, l'état « invité ») ;
 *  · le JOURNAL : chaque geste réussi laisse une ligne (qui, quoi, sur qui) ;
 *  · tout est REFUSÉ sans administrateur de la plateforme, par le service comme par l'action.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
// Les cookies de la requête, simulés : la session est la vraie (lib/session.ts).
const magasin = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nom: string) => (magasin.has(nom) ? { value: magasin.get(nom) } : undefined),
    set: (nom: string, valeur: string) => magasin.set(nom, valeur),
    delete: (nom: string) => magasin.delete(nom),
  }),
  headers: async () => new Headers({ host: "127.0.0.1:3520" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
  notFound: () => {
    throw new Error("__notFound__");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { eq } = await import("drizzle-orm");
const { db } = await import("@/db");
const { games, inscritsJournal, organizationMembers, organizations, users } = await import("@/db/schema");
const { getSession, setSession, clearSession } = await import("@/lib/session");
const { COMPTE_DESACTIVE, getTeacherOrgId, loginTeacher, registerTeacher } = await import("@/services/auth.service");
const { createInvite, resolveInvite } = await import("@/services/admin.service");
const { createClassGame } = await import("@/services/game.service");
const inscrits = await import("@/services/inscrits.service");
const actions = await import("@/app/admin/inscrits/actions");
const { etablissementSousLicence, poserUneLicence } = await import("./helpers/licence");

const MDP = "motdepasse!";
let admin: string;
let prof: { userId: string; orgId: string };
let autre: { userId: string; orgId: string };
let gameId: string;

async function seConnecterComme(userId: string): Promise<void> {
  const [u] = await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, userId));
  await setSession(userId, "teacher", u!.v);
}

beforeAll(async () => {
  const [a] = await db
    .insert(users)
    .values({ email: "admin@plateforme.test", displayName: "Admin", isPlatformAdmin: true })
    .returning({ id: users.id });
  admin = a!.id;
  const r = await registerTeacher({ email: "prof@lycee-gestion.test", password: MDP, displayName: "Mme Gestion", schoolName: "Lycée Gestion" });
  if ("error" in r) throw new Error(r.error);
  prof = { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
  await poserUneLicence(prof.orgId, prof.userId);
  gameId = (
    await createClassGame({ teacherId: prof.userId, organizationId: prof.orgId, periodicity: "quarter", humanTeamsCount: 2, botCount: 1, level: 2 })
  ).gameId;
  autre = await etablissementSousLicence("Autre", { arene: "campus" });
});

describe("désactiver un compte", () => {
  it("connexion refusée, session coupée, parties intactes ; la réactivation rend tout", async () => {
    // Connecté : la session se lit.
    const ok = await loginTeacher({ email: "prof@lycee-gestion.test", password: MDP });
    expect("userId" in ok).toBe(true);
    await seConnecterComme(prof.userId);
    expect(await getSession()).toEqual({ userId: prof.userId, role: "teacher" });

    await inscrits.desactiverCompte(admin, prof.userId);

    // La session en cours est coupée, la connexion refusée, avec un message clair.
    expect(await getSession()).toBeNull();
    expect(await loginTeacher({ email: "prof@lycee-gestion.test", password: MDP })).toEqual({ error: COMPTE_DESACTIVE });
    // Même un cookie neuf signé pour la version courante ne passe pas (lancement LTI, RENATER).
    await seConnecterComme(prof.userId);
    expect(await getSession()).toBeNull();
    // Le mauvais mot de passe reste un mauvais mot de passe : l'état n'est pas révélé.
    expect(await loginTeacher({ email: "prof@lycee-gestion.test", password: "pas-le-bon" })).toEqual({ error: "Identifiants incorrects." });

    // Ses parties, son établissement : intacts.
    expect(await db.select({ id: games.id }).from(games).where(eq(games.id, gameId))).toHaveLength(1);
    expect(await getTeacherOrgId(prof.userId)).toBe(prof.orgId);

    // Le tableau, le filtre et l'export le disent.
    const fiche = (await inscrits.ficheDeLInscrit(admin, prof.userId))!;
    expect(fiche.desactiveLe).toBeInstanceOf(Date);
    expect(fiche.partiesDeClasse).toBe(1);
    const desactives = await inscrits.listerInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, etat: "desactive" });
    expect(desactives.lignes.map((l) => l.id)).toEqual([prof.userId]);
    expect(desactives.compteurs.desactives).toBe(1);
    const actifs = await inscrits.listerInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, etat: "actif" });
    expect(actifs.lignes.map((l) => l.id)).not.toContain(prof.userId);
    const { contenu } = await inscrits.exporterLesInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, q: "gestion" }, { consentants: false });
    const lignes = contenu.replace(/^﻿/, "").trimEnd().split("\r\n").map((l) => l.split(";"));
    expect(lignes[0]![9]).toBe("État");
    expect(lignes.find((l) => l[0] === "Mme Gestion")![9]).toMatch(/^désactivé le \d{2}\/\d{2}\/\d{4}$/);

    await inscrits.reactiverCompte(admin, prof.userId);
    const encore = await loginTeacher({ email: "prof@lycee-gestion.test", password: MDP });
    expect("userId" in encore).toBe(true);
    await seConnecterComme(prof.userId);
    expect(await getSession()).toEqual({ userId: prof.userId, role: "teacher" });
    expect((await inscrits.ficheDeLInscrit(admin, prof.userId))!.desactiveLe).toBeNull();
  });

  it("ni soi-même, ni un administrateur de la plateforme, ni un élève", async () => {
    await expect(inscrits.desactiverCompte(admin, admin)).rejects.toMatchObject({ raison: "soi-meme" });
    const [a2] = await db
      .insert(users)
      .values({ email: "admin2@plateforme.test", displayName: "Admin 2", isPlatformAdmin: true })
      .returning({ id: users.id });
    await expect(inscrits.desactiverCompte(admin, a2!.id)).rejects.toMatchObject({ raison: "admin" });
    const [eleve] = await db
      .insert(users)
      .values({ email: "guest-x@guest.business-arena.local", displayName: "Élève" })
      .returning({ id: users.id });
    await expect(inscrits.desactiverCompte(admin, eleve!.id)).rejects.toMatchObject({ raison: "inconnu" });
  });
});

describe("rattacher, retirer", () => {
  it("rattache à un autre établissement, change le rôle, retire ; jamais du dernier", async () => {
    await inscrits.rattacherAUnEtablissement(admin, prof.userId, autre.orgId, "teacher");
    let fiche = (await inscrits.ficheDeLInscrit(admin, prof.userId))!;
    expect(fiche.etablissements.map((e) => [e.id, e.role]).sort()).toEqual(
      [
        [prof.orgId, "org_admin"],
        [autre.orgId, "teacher"],
      ].sort(),
    );
    await inscrits.rattacherAUnEtablissement(admin, prof.userId, autre.orgId, "org_admin");
    fiche = (await inscrits.ficheDeLInscrit(admin, prof.userId))!;
    expect(fiche.etablissements.find((e) => e.id === autre.orgId)!.role).toBe("org_admin");

    await inscrits.retirerDUnEtablissement(admin, prof.userId, autre.orgId);
    fiche = (await inscrits.ficheDeLInscrit(admin, prof.userId))!;
    expect(fiche.etablissements.map((e) => e.id)).toEqual([prof.orgId]);
    await expect(inscrits.retirerDUnEtablissement(admin, prof.userId, prof.orgId)).rejects.toMatchObject({ raison: "dernier" });
    await expect(
      inscrits.rattacherAUnEtablissement(admin, prof.userId, "00000000-0000-4000-8000-000000000000", "teacher"),
    ).rejects.toMatchObject({ raison: "organisation" });
  });

  it("le plafond de la licence s'applique à un nouvel arrivant", async () => {
    const classe = await etablissementSousLicence("Classe pleine", { arene: "classe", entreprises: ["nova"], niveaux: [3] });
    await expect(inscrits.rattacherAUnEtablissement(admin, prof.userId, classe.orgId, "teacher")).rejects.toMatchObject({
      raison: "plafond",
    });
    const membres = await db.select().from(organizationMembers).where(eq(organizationMembers.organizationId, classe.orgId));
    expect(membres).toHaveLength(1);
  });

  it("l'action ramène à la fiche avec le fait accompli, ou le refus", async () => {
    await seConnecterComme(admin);
    const fd = new FormData();
    fd.set("organisation", autre.orgId);
    fd.set("role", "teacher");
    await expect(actions.rattacherAction(prof.userId, fd)).rejects.toThrow(`__redirect__/admin/inscrits/${prof.userId}?fait=rattache`);
    await expect(actions.retirerAction(prof.userId, autre.orgId)).rejects.toThrow(/fait=retire/);
    await expect(actions.retirerAction(prof.userId, prof.orgId)).rejects.toThrow(/refus=dernier/);
  });
});

describe("les réglages des inscriptions", () => {
  it("inscription libre fermée : sans code, refusée ; avec un code, acceptée", async () => {
    await inscrits.reglerLesInscriptions(admin, { inscriptionLibre: false, domainesAutorises: "", domainesBloques: "" });
    expect((await inscrits.reglagesDesInscriptions(admin)).inscriptionLibre).toBe(false);
    const sans = await registerTeacher({ email: "libre@lycee.test", password: MDP, displayName: "X", schoolName: "Y" });
    expect(sans).toMatchObject({ error: expect.stringMatching(/fermées/) });
    const code = await createInvite({ organizationId: autre.orgId, role: "teacher", createdBy: admin });
    const avec = await registerTeacher({ email: "code@lycee.test", password: MDP, displayName: "X", schoolName: "", inviteCode: code });
    expect("userId" in avec).toBe(true);
    await inscrits.reglerLesInscriptions(admin, { inscriptionLibre: true, domainesAutorises: "", domainesBloques: "" });
  });

  it("domaines bloqués et autorisés, à l'inscription par le formulaire", async () => {
    const { ignores } = await inscrits.reglerLesInscriptions(admin, {
      inscriptionLibre: true,
      domainesAutorises: "ac-lille.fr\nuniv-lille.fr",
      domainesBloques: "etu.univ-lille.fr, n'importe",
    });
    expect(ignores).toEqual(["n'importe"]);
    expect(await inscrits.reglagesDesInscriptions(admin)).toEqual({
      inscriptionLibre: true,
      domainesAutorises: ["ac-lille.fr", "univ-lille.fr"],
      domainesBloques: ["etu.univ-lille.fr"],
    });
    const gmail = await registerTeacher({ email: "prof@gmail.com", password: MDP, displayName: "X", schoolName: "Y" });
    expect(gmail).toMatchObject({ error: expect.stringMatching(/réservées/) });
    const etu = await registerTeacher({ email: "x@etu.univ-lille.fr", password: MDP, displayName: "X", schoolName: "Y" });
    expect(etu).toMatchObject({ error: expect.stringMatching(/ne sont pas acceptées/) });
    const ok = await registerTeacher({ email: "prof@lycee.ac-lille.fr", password: MDP, displayName: "X", schoolName: "Y" });
    expect("userId" in ok).toBe(true);
    // Aucun compte n'a été créé pour les adresses refusées.
    expect(await db.select().from(users).where(eq(users.email, "prof@gmail.com"))).toHaveLength(0);
    await inscrits.reglerLesInscriptions(admin, { inscriptionLibre: true, domainesAutorises: "", domainesBloques: "" });
  });

  it("les codes d'invitation se listent et se désactivent", async () => {
    const code = await createInvite({ organizationId: prof.orgId, role: "teacher", createdBy: admin });
    const liste = await inscrits.listerCodesDInvitation(admin);
    const ligne = liste.find((c) => c.code === code)!;
    expect(ligne).toMatchObject({ actif: true, role: "teacher", etablissement: "Lycée Gestion" });
    await seConnecterComme(admin);
    await expect(actions.desactiverCodeAction(ligne.id)).rejects.toThrow("__redirect__/admin/inscrits?fait=code#codes");
    expect(await resolveInvite(code)).toBeNull();
    expect((await inscrits.listerCodesDInvitation(admin)).find((c) => c.code === code)!.actif).toBe(false);
  });

  it("un code créé ici inscrit malgré l'inscription libre fermée et hors des domaines autorisés ; l'usage, l'état « invité », la révocation", async () => {
    await inscrits.reglerLesInscriptions(admin, {
      inscriptionLibre: false,
      domainesAutorises: "ac-lille.fr",
      domainesBloques: "yopmail.com",
    });
    const code = await inscrits.creerCodeDInvitation(admin, autre.orgId, "teacher");
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    // Sans code : fermé. Avec le code : accepté, même en gmail (hors des autorisés).
    expect(await registerTeacher({ email: "invite@gmail.com", password: MDP, displayName: "Invité", schoolName: "" })).toMatchObject({
      error: expect.stringMatching(/réservées|fermées/),
    });
    const r = await registerTeacher({ email: "invite@gmail.com", password: MDP, displayName: "M. Invité", schoolName: "", inviteCode: code });
    if ("error" in r) throw new Error(r.error);
    // Un domaine BLOQUÉ reste bloqué, code ou pas.
    expect(
      await registerTeacher({ email: "x@yopmail.com", password: MDP, displayName: "X", schoolName: "", inviteCode: code }),
    ).toMatchObject({ error: expect.stringMatching(/ne sont pas acceptées/) });

    // L'usage du code, l'état « invité », la recherche par code, le filtre.
    const ligne = (await inscrits.listerCodesDInvitation(admin)).find((c) => c.code === code)!;
    expect(ligne).toMatchObject({ actif: true, utilisations: 1, etablissement: expect.stringMatching(/Autre/), role: "teacher" });
    expect(ligne.derniereUtilisationLe).toBeInstanceOf(Date);
    const fiche = (await inscrits.ficheDeLInscrit(admin, r.userId))!;
    expect(fiche.etat).toBe("invite");
    expect(fiche.invitation).toEqual({ code, etablissement: ligne.etablissement });
    expect(fiche.etablissements.map((e) => e.id)).toEqual([autre.orgId]);
    const parCode = await inscrits.listerInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, q: code.toLowerCase() });
    expect(parCode.lignes.map((l) => l.id)).toEqual([r.userId]);
    const invites = await inscrits.listerInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, etat: "invite" });
    expect(invites.lignes.map((l) => l.id)).toContain(r.userId);
    expect(invites.lignes.every((l) => l.etat === "invite")).toBe(true);
    expect(invites.compteurs.invites).toBe(invites.total);
    // « Actifs » comprend les invités ; l'export dit « invité (code …) ».
    const actifs = await inscrits.listerInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, etat: "actif" });
    expect(actifs.lignes.map((l) => l.id)).toContain(r.userId);
    const { contenu } = await inscrits.exporterLesInscrits(admin, { ...inscrits.FILTRES_PAR_DEFAUT, q: code }, { consentants: false });
    expect(contenu).toContain(`;invité (code ${code});`);

    // Révoqué : le code n'inscrit plus personne ; le compte déjà inscrit reste.
    await inscrits.desactiverCodeDInvitation(admin, ligne.id);
    expect(
      await registerTeacher({ email: "trop-tard@ac-lille.fr", password: MDP, displayName: "X", schoolName: "", inviteCode: code }),
    ).toMatchObject({ error: expect.stringMatching(/inconnu ou désactivé/) });
    expect((await inscrits.ficheDeLInscrit(admin, r.userId))!.etat).toBe("invite");
    await inscrits.reglerLesInscriptions(admin, { inscriptionLibre: true, domainesAutorises: "", domainesBloques: "" });
  });

  it("l'action de création : le code revient dans l'adresse ; pas de code pour le « grand public » ni sans établissement", async () => {
    await seConnecterComme(admin);
    const fd = new FormData();
    fd.set("organisation", prof.orgId);
    fd.set("role", "org_admin");
    await expect(actions.creerCodeAction(fd)).rejects.toThrow(/__redirect__\/admin\/inscrits\?fait=code-cree&code=[A-Z0-9]{8}#codes/);
    const [publique] = await db
      .insert(organizations)
      .values({ name: "Grand public", slug: `public-${Date.now()}`, kind: "public" })
      .returning({ id: organizations.id });
    await expect(inscrits.creerCodeDInvitation(admin, publique!.id, "teacher")).rejects.toMatchObject({ raison: "organisation" });
    const vide = new FormData();
    vide.set("organisation", "pas-un-uuid");
    await expect(actions.creerCodeAction(vide)).rejects.toThrow("__redirect__/admin/inscrits?refus=organisation#codes");
  });

  it("le formulaire de réglage passe par l'action", async () => {
    await seConnecterComme(admin);
    const fd = new FormData();
    fd.set("inscriptionLibre", "oui");
    fd.set("domainesAutorises", "");
    fd.set("domainesBloques", "yopmail.com");
    await expect(actions.reglerInscriptionsAction(fd)).rejects.toThrow("__redirect__/admin/inscrits?fait=reglages#reglages");
    expect((await inscrits.reglagesDesInscriptions(admin)).domainesBloques).toEqual(["yopmail.com"]);
  });
});

describe("le journal des gestes", () => {
  it("chaque geste réussi laisse une ligne : qui, quoi, sur quel compte", async () => {
    const lignes = await db.select().from(inscritsJournal);
    const gestes = new Set(lignes.map((l) => l.geste));
    for (const g of ["desactivation", "reactivation", "rattachement", "retrait", "reglages", "code-cree", "code-revoque"]) {
      expect(gestes, g).toContain(g);
    }
    expect(lignes.every((l) => l.adminId === admin)).toBe(true);
    const surLeProf = await inscrits.lireLeJournal(admin, { cible: prof.userId, n: 50 });
    expect(surLeProf.map((j) => j.geste)).toEqual(expect.arrayContaining(["desactivation", "reactivation", "rattachement", "retrait"]));
    expect(surLeProf.every((j) => j.cible?.id === prof.userId && j.admin === "Admin")).toBe(true);
    expect(surLeProf.find((j) => j.geste === "rattachement")!.detail).toMatch(/Autre.* \((enseignant|administrateur)\)/);
    // Le plus récent d'abord.
    const tout = await inscrits.lireLeJournal(admin, { n: 200 });
    expect(tout.map((j) => j.le.getTime())).toEqual([...tout.map((j) => j.le.getTime())].sort((a, b) => b - a));
  });

  it("un geste refusé ou sans effet ne laisse rien", async () => {
    const avant = (await db.select().from(inscritsJournal)).length;
    await expect(inscrits.desactiverCompte(admin, admin)).rejects.toMatchObject({ raison: "soi-meme" });
    await inscrits.reactiverCompte(admin, prof.userId); // déjà actif
    await inscrits.desactiverCodeDInvitation(admin, "00000000-0000-4000-8000-000000000000");
    expect((await db.select().from(inscritsJournal)).length).toBe(avant);
  });
});

describe("tout est refusé sans administrateur de la plateforme", () => {
  it("le service refuse un administrateur d'établissement et un enseignant", async () => {
    for (const qui of [prof.userId, autre.userId]) {
      await expect(inscrits.desactiverCompte(qui, autre.userId)).rejects.toThrow(/administrateur de la plateforme/);
      await expect(inscrits.reactiverCompte(qui, autre.userId)).rejects.toThrow(/administrateur de la plateforme/);
      await expect(inscrits.rattacherAUnEtablissement(qui, qui, autre.orgId, "org_admin")).rejects.toThrow(/administrateur de la plateforme/);
      await expect(inscrits.retirerDUnEtablissement(qui, qui, autre.orgId)).rejects.toThrow(/administrateur de la plateforme/);
      await expect(
        inscrits.reglerLesInscriptions(qui, { inscriptionLibre: true, domainesAutorises: "", domainesBloques: "" }),
      ).rejects.toThrow();
      await expect(inscrits.listerCodesDInvitation(qui)).rejects.toThrow();
      await expect(inscrits.desactiverCodeDInvitation(qui, "00000000-0000-4000-8000-000000000000")).rejects.toThrow();
      await expect(inscrits.creerCodeDInvitation(qui, autre.orgId, "teacher")).rejects.toThrow(/administrateur de la plateforme/);
      await expect(inscrits.lireLeJournal(qui)).rejects.toThrow(/administrateur de la plateforme/);
    }
  });

  it("les actions : sans session, la connexion ; avec la session d'un enseignant, un refus", async () => {
    await clearSession();
    await expect(actions.desactiverCompteAction(autre.userId)).rejects.toThrow("__redirect__/teacher/login");
    await seConnecterComme(prof.userId);
    await expect(actions.desactiverCompteAction(autre.userId)).rejects.toThrow(/administrateur de la plateforme/);
    const fd = new FormData();
    fd.set("inscriptionLibre", "non");
    await expect(actions.reglerInscriptionsAction(fd)).rejects.toThrow(/administrateur de la plateforme/);
    const fc = new FormData();
    fc.set("organisation", autre.orgId);
    fc.set("role", "org_admin");
    await expect(actions.creerCodeAction(fc)).rejects.toThrow(/administrateur de la plateforme/);
    // Rien n'a bougé.
    expect((await inscrits.ficheDeLInscrit(admin, autre.userId))!.desactiveLe).toBeNull();
    expect((await inscrits.reglagesDesInscriptions(admin)).inscriptionLibre).toBe(true);
  });
});
