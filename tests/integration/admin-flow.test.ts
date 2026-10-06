import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Espace admin et déploiement multi-établissements sur Postgres embarqué :
 * admin général (bootstrap ADMIN_EMAILS) → création d'établissement + code
 * admin → l'admin d'établissement s'inscrit par code → invite ses enseignants
 * par code → l'enseignant crée une partie dans l'établissement. Réglages
 * globaux appliqués (jeu public, inscriptions libres).
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, organizationMembers, organizations, users } from "@/db/schema";
import { getTeacherOrgId, loginTeacher, registerTeacher } from "@/services/auth.service";
import {
  createEstablishment,
  getOrgDashboard,
  getPlatformConfig,
  getPlatformOverview,
  getStaffContext,
  createInvite,
  deactivateInvite,
  resolveInvite,
  updatePlatformConfig,
} from "@/services/admin.service";
import { createClassGame, createSoloGame } from "@/services/game.service";
import { answerFormatFromProfile } from "@/config/difficulty";
import {
  contrasteDeLaBande,
  etatDesContrastes,
  themeDepuisEtat,
  paletteDuSite,
  themeParDefaut,
  validerContrastes,
  THEME_DU_SITE_PAR_DEFAUT,
} from "@/config/theme-du-site";
import { THEMES, THEME_PAR_DEFAUT } from "@/config/themes";

let platformAdminId: string;
let orgId: string;
let adminInviteCode: string;
let orgAdminId: string;
let teacherId: string;

beforeAll(async () => {
  process.env.ADMIN_EMAILS = "direction@business-arena.fr, autre@exemple.fr";
  const result = await registerTeacher({
    email: "Direction@Business-Arena.fr",
    password: "motdepasse!",
    displayName: "Direction",
    schoolName: "Siège",
  });
  if ("error" in result) throw new Error(result.error);
  platformAdminId = result.userId;
});

describe("admin général", () => {
  it("l'e-mail listé dans ADMIN_EMAILS est promu admin plateforme", async () => {
    const context = await getStaffContext(platformAdminId);
    expect(context!.isPlatformAdmin).toBe(true);
  });

  it("crée un établissement avec son code d'invitation admin", async () => {
    const created = await createEstablishment({
      adminId: platformAdminId,
      name: "Lycée Jean-Monnet",
    });
    orgId = created.organizationId;
    adminInviteCode = created.adminInviteCode;
    expect(adminInviteCode).toMatch(/^[A-Z2-9]{8}$/);
    const overview = await getPlatformOverview(platformAdminId);
    const org = overview.organizations.find((o) => o.organizationId === orgId);
    expect(org?.name).toBe("Lycée Jean-Monnet");
    expect(org?.adminInvites.some((i) => i.code === adminInviteCode && i.active)).toBe(true);
  });

  it("les vues et réglages sont refusés aux non-admins", async () => {
    const someone = await db
      .insert(users)
      .values({ email: "personne@x.fr", displayName: "Personne" })
      .returning({ id: users.id });
    await expect(getPlatformOverview(someone[0]!.id)).rejects.toThrow();
    await expect(updatePlatformConfig(someone[0]!.id, {})).rejects.toThrow();
  });
});

describe("déploiement d'un établissement", () => {
  it("l'admin d'établissement s'inscrit avec le code et rejoint l'org (sans en créer)", async () => {
    const orgsBefore = (await db.select().from(organizations)).length;
    const result = await registerTeacher({
      email: "proviseur@monnet.fr",
      password: "motdepasse!",
      displayName: "Mme Proviseure",
      schoolName: "",
      inviteCode: adminInviteCode.toLowerCase(),
    });
    if ("error" in result) throw new Error(result.error);
    orgAdminId = result.userId;
    expect((await db.select().from(organizations)).length).toBe(orgsBefore); // pas de nouvelle org
    const membership = (
      await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, orgAdminId))
    )[0]!;
    expect(membership.organizationId).toBe(orgId);
    expect(membership.role).toBe("org_admin");
  });

  it("un code inconnu ou désactivé est refusé", async () => {
    const bad = await registerTeacher({
      email: "x@y.fr",
      password: "motdepasse!",
      displayName: "X",
      schoolName: "",
      inviteCode: "ZZZZZZZZ",
    });
    expect("error" in bad).toBe(true);
    const code = await createInvite({ organizationId: orgId, role: "teacher", createdBy: orgAdminId });
    const resolved = await resolveInvite(code);
    await deactivateInvite({
      inviteId: (await db.select().from((await import("@/db/schema")).orgInvites)).find((i) => i.code === code)!.id,
      organizationId: orgId,
    });
    expect(resolved).not.toBeNull();
    expect(await resolveInvite(code)).toBeNull();
  });

  it("l'admin d'établissement invite un enseignant qui rejoint avec le rôle teacher", async () => {
    const dashboard = await getOrgDashboard(orgAdminId);
    expect(dashboard.name).toBe("Lycée Jean-Monnet");
    const code = await createInvite({ organizationId: orgId, role: "teacher", createdBy: orgAdminId });

    const result = await registerTeacher({
      email: "prof.gestion@monnet.fr",
      password: "motdepasse!",
      displayName: "M. Gestion",
      schoolName: "",
      inviteCode: code,
    });
    if ("error" in result) throw new Error(result.error);
    teacherId = result.userId;
    const membership = (
      await db.select().from(organizationMembers).where(eq(organizationMembers.userId, teacherId))
    )[0]!;
    expect(membership.role).toBe("teacher");
    expect(membership.organizationId).toBe(orgId);
    // l'enseignant est rattaché à l'établissement pour ses parties
    expect(await getTeacherOrgId(teacherId)).toBe(orgId);
    // mais il n'a pas accès au tableau de bord d'admin
    await expect(getOrgDashboard(teacherId)).rejects.toThrow();
  });

  it("les parties de l'enseignant apparaissent dans le tableau de bord de l'établissement", async () => {
    await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });
    const dashboard = await getOrgDashboard(orgAdminId);
    expect(dashboard.stats.games).toBe(1);
    expect(dashboard.stats.teachers).toBe(2); // proviseure + enseignant
    expect(dashboard.teachers.find((t) => t.userId === teacherId)?.games).toBe(1);
  });
});

describe("réglages globaux du jeu", () => {
  it("désactiver le jeu public bloque createSoloGame ; réactiver le rétablit", async () => {
    await updatePlatformConfig(platformAdminId, { allowPublicPlay: false });
    await expect(createSoloGame(teacherId, "quarter", 2)).rejects.toThrow(/désactivées/);
    await updatePlatformConfig(platformAdminId, { allowPublicPlay: true });
    await expect(createSoloGame(teacherId, "quarter", 2)).resolves.toBeTruthy();
  });

  it("fermer l'auto-service bloque l'inscription sans code, pas celle avec code", async () => {
    await updatePlatformConfig(platformAdminId, { allowSelfServiceTeachers: false });
    const blocked = await registerTeacher({
      email: "libre@exemple.fr",
      password: "motdepasse!",
      displayName: "Libre",
      schoolName: "Mon école",
    });
    expect("error" in blocked).toBe(true);
    const code = await createInvite({ organizationId: orgId, role: "teacher", createdBy: orgAdminId });
    const allowed = await registerTeacher({
      email: "invite@monnet.fr",
      password: "motdepasse!",
      displayName: "Invité",
      schoolName: "",
      inviteCode: code,
    });
    expect("userId" in allowed).toBe(true);
    await updatePlatformConfig(platformAdminId, { allowSelfServiceTeachers: true });
  });

  it("le format des réponses en solo se règle ici : QCM par défaut, questions ouvertes sur demande", async () => {
    expect((await getPlatformConfig()).soloAnswerFormat).toBe("qcm");
    const formatDe = async (id: string) =>
      answerFormatFromProfile(
        (await db.select().from(games).where(eq(games.id, id)))[0]!.difficultyProfile,
      );
    expect(await formatDe(await createSoloGame(teacherId, "quarter", 2))).toBe("qcm");

    await updatePlatformConfig(platformAdminId, { soloAnswerFormat: "open" });
    expect((await getPlatformConfig()).soloAnswerFormat).toBe("open");
    const ouverte = await createSoloGame(teacherId, "quarter", 2);
    expect(await formatDe(ouverte)).toBe("open");

    // Le réglage vaut pour les parties lancées ensuite : celle-ci garde le sien.
    await updatePlatformConfig(platformAdminId, { soloAnswerFormat: "qcm" });
    expect(await formatDe(ouverte)).toBe("open");
    expect(await formatDe(await createSoloGame(teacherId, "quarter", 2))).toBe("qcm");
  });

  it("l'annonce est persistée et relue", async () => {
    await updatePlatformConfig(platformAdminId, { announcement: "Finale le 12 juin !" });
    expect((await getPlatformConfig()).announcement).toBe("Finale le 12 juin !");
  });

  it("l'adresse de contact par défaut active la demande d'information", async () => {
    // Sans réglage, une adresse par défaut est servie : le bouton « Nous
    // écrire » de la page d'orientation n'est plus inactif faute de mail.
    expect((await getPlatformConfig()).contactEmail).toBe("contact@business-arena.fr");
  });

  it("la connexion promeut aussi les e-mails bootstrap", async () => {
    const login = await loginTeacher({ email: "direction@business-arena.fr", password: "motdepasse!" });
    expect("userId" in login).toBe(true);
  });
});

describe("thème graphique", () => {
  // Le réglage vit dans la même ligne que les autres réglages globaux : il doit
  // survivre à une relecture, ne rien casser chez ses voisins, et s'effacer
  // d'un seul geste.
  it("un réglage valide s'enregistre et se relit, sans toucher aux autres réglages", async () => {
    await updatePlatformConfig(platformAdminId, {
      announcement: "Maintenance ce soir",
    });
    const etat = {
      ...etatDesContrastes(THEME_DU_SITE_PAR_DEFAUT),
      "accueil.chiffres": false,
      "accueil.boucle": true,
    };
    expect(validerContrastes(etat)).toEqual([]);
    await updatePlatformConfig(platformAdminId, {
      theme: themeDepuisEtat(etat),
    });

    const relu = await getPlatformConfig();
    expect(contrasteDeLaBande(relu.theme, "accueil.chiffres")).toBe(false);
    expect(contrasteDeLaBande(relu.theme, "accueil.boucle")).toBe(true);
    // Une bande qu'on n'a pas touchée suit toujours son état d'origine.
    expect(contrasteDeLaBande(relu.theme, "enseignants.chiffres")).toBe(true);
    // Les autres réglages ne bougent pas : le thème s'écrit à côté, pas par-dessus.
    expect(relu.announcement).toBe("Maintenance ce soir");
    expect(relu.allowPublicPlay).toBe(true);
  });

  it("ne stocke que les écarts à l'état d'origine", async () => {
    const relu = await getPlatformConfig();
    expect(Object.keys(relu.theme.contrastes).sort()).toEqual([
      "accueil.boucle",
      "accueil.chiffres",
    ]);
  });

  it("un identifiant de bande disparu depuis est ignoré à la lecture, sans erreur", async () => {
    await updatePlatformConfig(platformAdminId, {
      theme: { contrastes: { "bande.supprimee": true, "accueil.hero": true } },
    });
    const relu = await getPlatformConfig();
    expect(relu.theme.contrastes).toEqual({ "accueil.hero": true });
  });

  it("rétablir l'état d'origine efface tous les écarts", async () => {
    await updatePlatformConfig(platformAdminId, {
      theme: THEME_DU_SITE_PAR_DEFAUT,
    });
    const relu = await getPlatformConfig();
    expect(relu.theme.contrastes).toEqual({});
    expect(contrasteDeLaBande(relu.theme, "accueil.hero")).toBe(false);
    expect(contrasteDeLaBande(relu.theme, "accueil.chiffres")).toBe(true);
  });

  it("est refusé à qui n'est pas administrateur de la plateforme", async () => {
    const intrus = await db
      .insert(users)
      .values({ email: "intrus-theme@x.fr", displayName: "Intrus" })
      .returning({ id: users.id });
    await expect(
      updatePlatformConfig(intrus[0]!.id, {
        theme: { contrastes: { "accueil.hero": true } },
      }),
    ).rejects.toThrow();
    const relu = await getPlatformConfig();
    expect(relu.theme.contrastes).toEqual({});
  });

  it("le thème d'ouverture s'enregistre à côté des bandes, et se rétablit avec elles", async () => {
    const autre = THEMES.find((t) => t.code !== THEME_PAR_DEFAUT)!.code;
    await updatePlatformConfig(platformAdminId, {
      theme: themeDepuisEtat({ ...etatDesContrastes(THEME_DU_SITE_PAR_DEFAUT), "accueil.chiffres": false, "accueil.boucle": true }, autre),
    });
    const relu = await getPlatformConfig();
    expect(themeParDefaut(relu.theme)).toBe(autre);
    expect(contrasteDeLaBande(relu.theme, "accueil.boucle")).toBe(true);

    await updatePlatformConfig(platformAdminId, { theme: THEME_DU_SITE_PAR_DEFAUT });
    expect(themeParDefaut((await getPlatformConfig()).theme)).toBe(THEME_PAR_DEFAUT);
  });

  it("la palette s'enregistre à côté du reste, et se rétablit avec lui", async () => {
    await updatePlatformConfig(platformAdminId, {
      theme: themeDepuisEtat(etatDesContrastes(THEME_DU_SITE_PAR_DEFAUT), THEME_PAR_DEFAUT, "cobalt"),
    });
    const relu = await getPlatformConfig();
    expect(paletteDuSite(relu.theme)).toBe("cobalt");
    expect(contrasteDeLaBande(relu.theme, "accueil.chiffres")).toBe(true);

    await updatePlatformConfig(platformAdminId, { theme: THEME_DU_SITE_PAR_DEFAUT });
    expect(paletteDuSite((await getPlatformConfig()).theme)).toBe("laiton");
  });
});
