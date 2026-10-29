import { createHmac, randomUUID } from "node:crypto";
import { cleDerivee } from "@/lib/cles";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LES INSCRITS ET LES NOUVEAUTÉS, DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION.
 *
 * Demande du propriétaire (octobre 2026) : voir qui est inscrit, et pouvoir écrire aux
 * enseignants qui l'acceptent. Parcours :
 *  · l'administrateur de la plateforme voit la liste, cherche, filtre, exporte (le fichier
 *    se télécharge, avec les colonnes attendues, sans aucun élève) et l'export des
 *    consentants ; à 390 px, le tableau défile dans son conteneur, la page ne déborde pas ;
 *  · un enseignant s'inscrit en cochant la case, retrouve son choix dans « Mon compte »,
 *    le change, puis se désinscrit par le lien de son e-mail (celui de l'export) ;
 *  · la gestion des inscriptions : désactivation et réactivation, rattachement et retrait,
 *    inscription libre fermée puis rouverte, code d'invitation créé, utilisé (état
 *    « invité », usage du code), révoqué, et le journal des gestes.
 *
 * Les comptes de démonstration sont posés en base, marqués d'une étiquette propre à
 * l'exécution : la base n'est pas vidée entre deux passages.
 */

const CAPTURES = process.env.CAPTURES_INSCRITS;
if (CAPTURES) mkdirSync(CAPTURES, { recursive: true });
async function capture(page: Page, nom: string, pleine = true) {
  if (!CAPTURES) return;
  mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({ path: join(CAPTURES, `${nom}.png`), fullPage: pleine });
}

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

/** Une étiquette par exécution, dans chaque nom : la recherche isole les comptes de ce passage. */
const TAG = `t${Date.now().toString(36)}`;
const ELEVE_INVITE = `Eleve Invisible ${TAG}`;
const ELEVE_MEMBRE = `eleve-${TAG}@e2e.test`;

/** Une session signée comme lib/session.ts. */
async function connecter(ctx: BrowserContext, userId: string): Promise<void> {
  const now = Date.now();
  const corps = Buffer.from(JSON.stringify({ id: userId, role: "teacher", v: 1, iat: now, exp: now + 3600_000 })).toString("base64url");
  const signature = createHmac("sha256", cleDerivee("session", process.env.AUTH_SECRET!)).update(corps).digest("hex").slice(0, 32);
  await ctx.addCookies([{ name: "ba_session", value: `${corps}.${signature}`, url: BASE }]);
}

interface Compte {
  nom: string;
  email: string;
  org: "lycee" | "iut" | "college";
  role: "teacher" | "org_admin";
  inscritIlYA: number;
  connexionIlYA: number | null;
  consentement: "oui" | "non" | "retire";
  provenance: "inscription" | "lti";
}

/** Les comptes de démonstration : trois établissements, trois offres, des accords variés. */
const COMPTES: Compte[] = [
  { nom: `Claire Martin ${TAG}`, email: `claire.martin.${TAG}@lycee-hugo.fr`, org: "lycee", role: "org_admin", inscritIlYA: 120, connexionIlYA: 2, consentement: "oui", provenance: "inscription" },
  { nom: `Paul Bernard ${TAG}`, email: `paul.bernard.${TAG}@lycee-hugo.fr`, org: "lycee", role: "teacher", inscritIlYA: 10, connexionIlYA: 1, consentement: "non", provenance: "inscription" },
  { nom: `Sophie Leroy ${TAG}`, email: `sophie.leroy.${TAG}@iut-lille.fr`, org: "iut", role: "org_admin", inscritIlYA: 60, connexionIlYA: 20, consentement: "retire", provenance: "lti" },
  { nom: `Karim Haddad ${TAG}`, email: `karim.haddad.${TAG}@college-moulin.fr`, org: "college", role: "org_admin", inscritIlYA: 3, connexionIlYA: null, consentement: "oui", provenance: "inscription" },
];

let navigateur: Browser;
let adminId: string;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  await base(async (c) => {
    const { rows } = await c.query(
      "insert into users (email, display_name, is_platform_admin, provenance) values ($1, 'Admin E2E', true, 'inscription') returning id",
      [`admin-${randomUUID()}@e2e.test`],
    );
    adminId = rows[0].id;
    const orgs: Record<Compte["org"], string> = { lycee: "", iut: "", college: "" };
    for (const [code, nom, arene, episodes] of [
      ["lycee", `Lycée Victor Hugo ${TAG}`, "campus", true],
      ["iut", `IUT de Lille ${TAG}`, "programme", false],
      ["college", `Collège Jean Moulin ${TAG}`, null, false],
    ] as const) {
      const o = await c.query("insert into organizations (name, slug, kind) values ($1, $2, 'school') returning id", [nom, `e2e-${randomUUID()}`]);
      orgs[code] = o.rows[0].id;
      if (arene) {
        await c.query(
          `insert into org_licences (organization_id, label, starts_at, ends_at, arene, episodes, entreprises)
           values ($1, 'Licence e2e', now() - interval '10 days', now() + interval '300 days', $2, $3, $4)`,
          [orgs[code], arene, episodes, arene === "programme" ? ["nova"] : null],
        );
      }
    }
    for (const k of COMPTES) {
      const u = await c.query(
        `insert into users (email, display_name, created_at, derniere_connexion_le, provenance,
           nouveautes_consenties_le, nouveautes_version_du_texte, nouveautes_retirees_le)
         values ($1, $2, now() - ($3::text || ' days')::interval,
           case when $4::text is null then null else now() - ($4::text || ' days')::interval end, $5,
           case when $6::text = 'non' then null else now() - interval '2 days' end,
           case when $6::text = 'non' then null else '2026-10-v1' end,
           case when $6::text = 'retire' then now() - interval '1 day' else null end)
         returning id`,
        [k.email, k.nom, String(k.inscritIlYA), k.connexionIlYA === null ? null : String(k.connexionIlYA), k.provenance, k.consentement],
      );
      await c.query("insert into organization_members (user_id, organization_id, role) values ($1, $2, $3)", [u.rows[0].id, orgs[k.org], k.role]);
    }
    // Deux élèves, qui ne doivent apparaître nulle part : un invité, un membre « élève ».
    await c.query("insert into users (email, display_name) values ($1, $2)", [`guest-${randomUUID()}@guest.business-arena.local`, ELEVE_INVITE]);
    const e = await c.query("insert into users (email, display_name) values ($1, $2) returning id", [ELEVE_MEMBRE, `Eleve Membre ${TAG}`]);
    await c.query("insert into organization_members (user_id, organization_id, role) values ($1, $2, 'student')", [e.rows[0].id, orgs.lycee]);
  });
});

afterAll(async () => {
  await navigateur?.close();
});

async function pageAdmin(largeur = 1280): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: largeur < 500 ? 844 : 900 }, locale: "fr-FR", acceptDownloads: true });
  await connecter(ctx, adminId);
  return ctx.newPage();
}

const nomsDuTableau = (p: Page) => p.locator("[data-tableau-inscrits] tbody tr [data-nom-inscrit]").allInnerTexts();

/** Le CSV téléchargé : les octets, puis les lignes découpées au point-virgule. */
async function telecharger(p: Page, lien: string): Promise<{ nom: string; octets: Buffer; lignes: string[][] }> {
  const [dl] = await Promise.all([p.waitForEvent("download"), p.locator(lien).click()]);
  const chemin = await dl.path();
  const octets = readFileSync(chemin!);
  const lignes = octets
    .toString("utf8")
    .replace(/^﻿/, "")
    .trimEnd()
    .split("\r\n")
    .map((l) => l.split(";"));
  return { nom: dl.suggestedFilename(), octets, lignes };
}

const COLONNES = [
  "Nom",
  "E-mail",
  "Établissements et rôles",
  "Offre en cours",
  "Inscrit le",
  "Dernière connexion",
  "Parties de classe créées",
  "Cohortes créées",
  "Provenance",
  "État",
  "Nouveautés",
  "Accord le",
  "Version du texte accepté",
  "Retrait le",
];

describe("/admin/inscrits : l'administrateur de la plateforme", () => {
  it("refusée sans session (connexion) et à un enseignant (son espace) ; l'export répond 401 et 403", async () => {
    const anonyme = await (await navigateur.newContext()).newPage();
    await anonyme.goto(`${BASE}/admin/inscrits`);
    expect(anonyme.url()).toContain("/teacher/login");
    expect((await anonyme.request.get(`${BASE}/admin/inscrits/export`)).status()).toBe(401);
    const ctx = await navigateur.newContext();
    const { rows } = await base((c) => c.query("select u.id from users u where u.email = $1", [COMPTES[0]!.email]));
    await connecter(ctx, rows[0].id);
    const prof = await ctx.newPage();
    await prof.goto(`${BASE}/admin/inscrits`);
    expect(new URL(prof.url()).pathname).toBe("/teacher");
    expect((await prof.request.get(`${BASE}/admin/inscrits/export`)).status()).toBe(403);
    await anonyme.context().close();
    await ctx.close();
  });

  it("voit la liste et les compteurs, cherche, filtre", async () => {
    const p = await pageAdmin();
    await aller(p, "/admin");
    await p.getByRole("navigation", { name: "Administration" }).getByRole("link", { name: "Inscrits", exact: true }).click();
    await p.waitForURL(/\/admin\/inscrits$/);
    await p.waitForLoadState("networkidle");
    const vu = await texte(p);
    for (const libelle of ["Enseignants", "Établissements", "Sous licence", "Consentants", "Nouveaux (30 j)"]) {
      expect(vu).toContain(libelle);
    }
    expect(vu).not.toContain(ELEVE_INVITE);

    // La recherche (sans accent : « lycee victor »), par l'établissement.
    await p.fill('input[name="q"]', `lycee victor hugo ${TAG}`);
    await p.getByRole("button", { name: "Filtrer" }).click();
    await p.waitForURL(/q=/);
    expect((await nomsDuTableau(p)).sort()).toEqual([`Claire Martin ${TAG}`, `Paul Bernard ${TAG}`]);
    expect(await texte(p)).not.toContain(`Eleve Membre ${TAG}`);

    // Toute l'étiquette : les quatre comptes, aucun élève, et la capture à 1280.
    await aller(p, `/admin/inscrits?q=${TAG}`);
    expect((await nomsDuTableau(p)).sort()).toEqual(COMPTES.map((k) => k.nom).sort());
    const ligne = await p.locator("[data-tableau-inscrits] tbody tr", { hasText: `Claire Martin ${TAG}` }).innerText();
    expect(ligne).toContain(`Lycée Victor Hugo ${TAG}`);
    expect(ligne).toContain("administrateur");
    expect(ligne).toContain("Campus + Épisodes manager");
    expect(ligne).toMatch(/oui, le/);
    await capture(p, "admin-inscrits-1280", false);
    await capture(p, "admin-inscrits-1280-entiere");

    // Filtre d'offre.
    await p.selectOption('select[name="offre"]', "programme");
    await p.getByRole("button", { name: "Filtrer" }).click();
    await p.waitForURL(/offre=programme/);
    expect(await nomsDuTableau(p)).toEqual([`Sophie Leroy ${TAG}`]);
    expect(await texte(p)).toContain("Plateforme LTI");

    // Consentants seulement, puis les nouveaux de 30 jours.
    await aller(p, `/admin/inscrits?q=${TAG}`);
    await p.selectOption('select[name="consentement"]', "oui");
    await p.getByRole("button", { name: "Filtrer" }).click();
    await p.waitForURL(/consentement=oui/);
    expect((await nomsDuTableau(p)).sort()).toEqual([`Claire Martin ${TAG}`, `Karim Haddad ${TAG}`]);
    await aller(p, `/admin/inscrits?q=${TAG}`);
    await p.check('input[name="nouveaux"]');
    await p.selectOption('select[name="tri"]', "anciens");
    await p.getByRole("button", { name: "Filtrer" }).click();
    await p.waitForURL(/nouveaux=1/);
    expect(await nomsDuTableau(p)).toEqual([`Paul Bernard ${TAG}`, `Karim Haddad ${TAG}`]);
    await p.context().close();
  });

  it("exporte : le fichier se télécharge, daté, avec les colonnes attendues et sans élève", async () => {
    const p = await pageAdmin();
    await aller(p, `/admin/inscrits?q=${TAG}`);
    const tout = await telecharger(p, "[data-export-inscrits]");
    expect(tout.nom).toMatch(/^inscrits-\d{4}-\d{2}-\d{2}\.csv$/);
    expect([...tout.octets.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(tout.lignes[0]).toEqual(COLONNES);
    expect(tout.lignes.slice(1).map((l) => l[0]).sort()).toEqual(COMPTES.map((k) => k.nom).sort());
    const brut = tout.octets.toString("utf8");
    expect(brut).not.toContain(ELEVE_INVITE);
    expect(brut).not.toContain(ELEVE_MEMBRE);
    const martin = tout.lignes.find((l) => l[0] === `Claire Martin ${TAG}`)!;
    expect(martin[1]).toBe(COMPTES[0]!.email);
    expect(martin[3]).toBe("Campus + Épisodes manager");
    expect(martin[9]).toBe("actif");
    expect(martin[10]).toBe("oui");
    if (CAPTURES) writeFileSync(join(CAPTURES, "extrait-export.csv"), tout.octets);

    const consentants = await telecharger(p, "[data-export-consentants]");
    expect(consentants.nom).toMatch(/^inscrits-consentants-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(consentants.lignes[0]).toEqual([...COLONNES, "Lien de désinscription"]);
    expect(consentants.lignes.slice(1).map((l) => l[0]).sort()).toEqual([`Claire Martin ${TAG}`, `Karim Haddad ${TAG}`]);
    expect(consentants.lignes[1]![14]).toMatch(/\/nouveautes\/desinscription\?jeton=/);
    if (CAPTURES) writeFileSync(join(CAPTURES, "extrait-export-consentants.csv"), consentants.octets);
    await p.context().close();
  });

  it("à 390 px : la page ne déborde pas, le tableau défile dans son conteneur", async () => {
    const p = await pageAdmin(390);
    await aller(p, `/admin/inscrits?q=${TAG}`);
    const m = await p.evaluate(() => {
      const t = document.querySelector("[data-tableau-inscrits]")!;
      return {
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tableau: t.scrollWidth - t.clientWidth,
        overflow: getComputedStyle(t).overflowX,
      };
    });
    expect(m.page).toBe(0);
    expect(m.tableau).toBeGreaterThan(0);
    expect(m.overflow).toBe("auto");
    await capture(p, "admin-inscrits-390");
    await p.context().close();
  });
});

describe("la gestion des inscriptions : l'administrateur de la plateforme", () => {
  const PAUL = COMPTES[1]!;
  const KARIM = COMPTES[3]!;
  const MDP = "motdepasse-e2e";

  it("les réglages des inscriptions sont en tête de la page", async () => {
    const p = await pageAdmin();
    await aller(p, `/admin/inscrits?q=${TAG}`);
    const reglages = p.locator("[data-reglages-inscriptions]");
    expect(await reglages.innerText()).toMatch(/Inscription libre : (ouverte|fermée)/);
    await reglages.locator("summary").click();
    expect(await p.locator('textarea[name="domainesBloques"]').isVisible()).toBe(true);
    expect(await p.locator("[data-codes-invitation]").isVisible()).toBe(true);
    await capture(p, "admin-inscrits-reglages", false);
    await p.context().close();
  });

  it("désactive un compte : session coupée, connexion refusée ; puis le réactive", async () => {
    // Paul a un mot de passe et une session ouverte dans son navigateur.
    const { rows } = await base(async (c) => {
      await c.query("update users set password_hash = $1 where email = $2", [await bcrypt.hash(MDP, 10), PAUL.email]);
      return c.query("select id from users where email = $1", [PAUL.email]);
    });
    const paulId = rows[0].id as string;
    const ctxPaul = await navigateur.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    await connecter(ctxPaul, paulId);
    const paul = await ctxPaul.newPage();
    await aller(paul, "/teacher");
    expect(new URL(paul.url()).pathname).toBe("/teacher");

    const p = await pageAdmin();
    await aller(p, `/admin/inscrits?q=${encodeURIComponent(PAUL.nom)}`);
    await p.locator("[data-nom-inscrit]", { hasText: PAUL.nom }).click();
    await p.waitForURL(new RegExp(`/admin/inscrits/${paulId}$`));
    await p.waitForLoadState("networkidle");
    expect(await p.locator("[data-etat-du-compte]").getAttribute("data-etat-du-compte")).toBe("actif");
    await p.getByRole("button", { name: "Désactiver le compte" }).click();
    await p.waitForURL(/fait=desactive/, { timeout: 30_000 });
    expect(await p.locator("[data-etat-du-compte]").getAttribute("data-etat-du-compte")).toBe("desactive");
    await capture(p, "fiche-inscrit-desactive");

    // Sa session est coupée : la page suivante le renvoie à la connexion.
    await paul.goto(`${BASE}/teacher`);
    expect(new URL(paul.url()).pathname).toBe("/teacher/login");
    // Et la connexion est refusée, avec un message clair.
    await paul.fill('input[name="email"]', PAUL.email);
    await paul.fill('input[name="password"]', MDP);
    await paul.locator("form button[type=submit]").click();
    await paul.getByText("Ce compte a été désactivé").waitFor({ timeout: 30_000 });
    await capture(paul, "connexion-compte-desactive", false);

    // La liste le dit, et le filtre « désactivés » le trouve.
    await aller(p, `/admin/inscrits?q=${TAG}&etat=desactive`);
    expect(await nomsDuTableau(p)).toEqual([PAUL.nom]);
    expect(await p.locator(`[data-tableau-inscrits] tbody tr td[data-etat="desactive"]`).count()).toBe(1);

    // Réactivé, il se reconnecte.
    await aller(p, `/admin/inscrits/${paulId}`);
    await p.getByRole("button", { name: "Réactiver le compte" }).click();
    await p.waitForURL(/fait=reactive/, { timeout: 30_000 });
    await aller(paul, "/teacher/login");
    await paul.fill('input[name="email"]', PAUL.email);
    await paul.fill('input[name="password"]', MDP);
    await paul.locator("form button[type=submit]").click();
    await paul.waitForURL(/\/teacher$/, { timeout: 30_000 });
    await ctxPaul.close();
    await p.context().close();
  });

  it("rattache un compte à un autre établissement, et ouvre la fiche de l'établissement", async () => {
    const p = await pageAdmin();
    await aller(p, `/admin/inscrits?q=${encodeURIComponent(KARIM.nom)}`);
    await p.locator("[data-nom-inscrit]", { hasText: KARIM.nom }).click();
    await p.waitForURL(/\/admin\/inscrits\/[0-9a-f-]{36}$/);
    await p.waitForLoadState("networkidle");
    await p.locator('select[name="organisation"]').selectOption({ label: `Lycée Victor Hugo ${TAG}` });
    await p.getByRole("button", { name: "Rattacher", exact: true }).click();
    await p.waitForURL(/fait=rattache/, { timeout: 30_000 });
    const etablissements = await p.locator("[data-etablissements-de-l-inscrit] li").allInnerTexts();
    expect(etablissements.some((t) => t.includes(`Lycée Victor Hugo ${TAG}`) && t.includes("enseignant"))).toBe(true);
    expect(etablissements).toHaveLength(2);
    await capture(p, "fiche-inscrit-rattache");
    // Retirer du collège : il lui reste le lycée.
    await p
      .locator("[data-etablissements-de-l-inscrit] li", { hasText: `Collège Jean Moulin ${TAG}` })
      .getByRole("button", { name: "Retirer de cet établissement" })
      .click();
    await p.waitForURL(/fait=retire/, { timeout: 30_000 });
    expect(await p.locator("[data-etablissements-de-l-inscrit] li").count()).toBe(1);
    // La fiche de l'établissement : son bloc dans /admin.
    await p.getByRole("link", { name: "Fiche de l'établissement" }).click();
    await p.waitForURL(/\/admin#etablissement-/);
    const ancre = new URL(p.url()).hash.slice(1);
    expect(await p.locator(`#${ancre}`).innerText()).toContain(`Lycée Victor Hugo ${TAG}`);
    await p.context().close();
  });
});

describe("les codes d'invitation et l'inscription libre : l'administrateur de la plateforme", () => {
  const INVITE = { nom: `Lea Invitee ${TAG}`, email: `lea.invitee.${TAG}@gmail.com` };
  let libreAuDepart = true;

  /** Le réglage de la plateforme tel qu'il était : les autres parcours inscrivent librement. */
  beforeAll(async () => {
    const { rows } = await base((c) => c.query("select settings from platform_settings where id = 1"));
    libreAuDepart = rows[0]?.settings?.allowSelfServiceTeachers !== false;
  });
  afterAll(async () => {
    await base((c) =>
      c.query(
        `update platform_settings set settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{allowSelfServiceTeachers}', $1::jsonb) where id = 1`,
        [JSON.stringify(libreAuDepart)],
      ),
    );
  });

  async function sInscrire(page: Page, code: string | null): Promise<void> {
    await aller(page, "/teacher/login");
    await page.getByRole("button", { name: "Créer un compte" }).click();
    await page.fill('input[name="displayName"]', INVITE.nom);
    await page.fill('input[name="schoolName"]', "");
    await page.fill('input[name="email"]', INVITE.email);
    await page.fill('input[name="password"]', "motdepasse-e2e");
    if (code !== null) await page.fill('input[name="inviteCode"]', code);
    await page.getByRole("button", { name: "Créer mon compte enseignant" }).click();
  }

  it("ferme l'inscription libre, crée un code, l'enseignant s'inscrit par le code, l'usage et l'état « invité » se voient, puis le code est révoqué", async () => {
    const p = await pageAdmin();
    await aller(p, "/admin/inscrits");
    // 1. L'inscription libre se ferme depuis /admin/inscrits (et /admin le dit).
    await p.locator("[data-reglages-inscriptions] summary").click();
    await p.locator('input[name="inscriptionLibre"][value="non"]').check();
    await p.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await p.waitForURL(/fait=reglages/, { timeout: 30_000 });
    expect(await p.locator("[data-reglages-inscriptions] summary").innerText()).toContain("Inscription libre : fermée");
    await aller(p, "/admin");
    expect(await texte(p)).toContain("Inscription des enseignants (sur code seulement)");

    // 2. Sans code, l'inscription est refusée.
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const lea = await ctx.newPage();
    await sInscrire(lea, null);
    await lea.getByText("Les inscriptions libres sont fermées").waitFor({ timeout: 30_000 });

    // 3. Un code pour le collège, créé ici.
    await aller(p, "/admin/inscrits");
    await p.locator("[data-reglages-inscriptions] summary").click();
    await p.locator('[data-creer-code] select[name="organisation"]').selectOption({ label: `Collège Jean Moulin ${TAG}` });
    await p.getByRole("button", { name: "Créer un code" }).click();
    await p.waitForURL(/fait=code-cree/, { timeout: 30_000 });
    const code = (await p.locator("[data-code-cree]").getAttribute("data-code-cree"))!;
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(await p.locator(`[data-code-invitation="${code}"] [data-usage-code]`).getAttribute("data-usage-code")).toBe("0");

    // 4. Avec le code, l'inscription passe (inscription libre fermée).
    await sInscrire(lea, code);
    await lea.waitForURL(/\/teacher$/, { timeout: 30_000 });
    await ctx.close();

    // 5. L'usage du code, l'état « invité », le filtre.
    await aller(p, "/admin/inscrits");
    await p.locator("[data-reglages-inscriptions] summary").click();
    const usage = p.locator(`[data-code-invitation="${code}"] [data-usage-code]`);
    expect(await usage.getAttribute("data-usage-code")).toBe("1");
    await capture(p, "admin-inscrits-codes", false);
    await usage.click();
    await p.waitForURL(new RegExp(`q=${code}`));
    expect(await nomsDuTableau(p)).toEqual([INVITE.nom]);
    expect(await p.locator(`[data-tableau-inscrits] tbody tr td[data-etat="invite"]`).innerText()).toContain(code);
    await aller(p, `/admin/inscrits?q=${TAG}`);
    await p.selectOption('select[name="etat"]', "invite");
    await p.getByRole("button", { name: "Filtrer" }).click();
    await p.waitForURL(/etat=invite/);
    expect(await nomsDuTableau(p)).toEqual([INVITE.nom]);
    await capture(p, "admin-inscrits-etat-invite", false);

    // 6. Révoqué : le code n'inscrit plus.
    await aller(p, "/admin/inscrits");
    await p.locator("[data-reglages-inscriptions] summary").click();
    await p.locator(`[data-code-invitation="${code}"]`).getByRole("button", { name: "Révoquer" }).click();
    await p.waitForURL(/[?&]fait=code(?:#|&|$)/, { timeout: 30_000 });
    expect(await p.locator(`[data-code-invitation="${code}"]`).innerText()).toContain("révoqué");
    const ctx2 = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const autre = await ctx2.newPage();
    await aller(autre, "/teacher/login");
    await autre.getByRole("button", { name: "Créer un compte" }).click();
    await autre.fill('input[name="displayName"]', `Trop Tard ${TAG}`);
    await autre.fill('input[name="email"]', `trop.tard.${TAG}@e2e.test`);
    await autre.fill('input[name="password"]', "motdepasse-e2e");
    await autre.fill('input[name="inviteCode"]', code);
    await autre.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    await autre.getByText("Code d'invitation inconnu ou désactivé").waitFor({ timeout: 30_000 });
    await ctx2.close();

    // 7. Rouverte, et le journal garde chaque geste.
    await p.locator('input[name="inscriptionLibre"][value="oui"]').check();
    await p.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await p.waitForURL(/fait=reglages/, { timeout: 30_000 });
    expect(await p.locator("[data-reglages-inscriptions] summary").innerText()).toContain("Inscription libre : ouverte");
    const journal = p.locator("[data-journal-inscrits]");
    for (const geste of ["reglages", "code-cree", "code-revoque", "desactivation", "reactivation", "rattachement"]) {
      expect(await journal.locator(`[data-geste="${geste}"]`).count(), geste).toBeGreaterThan(0);
    }
    expect(await journal.innerText()).toContain(code);
    await journal.scrollIntoViewIfNeeded();
    await capture(p, "admin-inscrits-journal", false);
    await p.context().close();
  });
});

describe("le consentement aux nouveautés : l'enseignant", () => {
  const EMAIL = `nouveautes-${TAG}@lycee-e2e.fr`;
  let prof: Page;

  beforeAll(async () => {
    prof = await (await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" })).newPage();
  });
  afterAll(async () => {
    await prof?.context().close();
  });

  it("s'inscrit en cochant la case, qui n'est jamais cochée d'avance", async () => {
    await aller(prof, "/teacher/login");
    await prof.getByRole("button", { name: "Créer un compte" }).click();
    const caseNouveautes = prof.locator('input[name="nouveautes"]');
    expect(await caseNouveautes.isChecked()).toBe(false);
    expect(await prof.locator("[data-case-nouveautes]").innerText()).toContain(
      "Recevoir les nouveautés de Business Arena, au plus une fois par mois. Désinscription en un clic.",
    );
    await prof.fill('input[name="displayName"]', `Mme Nouveautés ${TAG}`);
    await prof.fill('input[name="schoolName"]', `Lycée des Nouveautés ${TAG}`);
    await prof.fill('input[name="email"]', EMAIL);
    await prof.fill('input[name="password"]', "motdepasse-e2e");
    await caseNouveautes.check();
    await capture(prof, "inscription-avec-la-case");
    await prof.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    await prof.waitForURL(/\/teacher$/, { timeout: 30_000 });
    const { rows } = await base((c) =>
      c.query("select nouveautes_consenties_le, nouveautes_version_du_texte, provenance from users where email = $1", [EMAIL]),
    );
    expect(rows[0].nouveautes_consenties_le).toBeInstanceOf(Date);
    expect(rows[0].nouveautes_version_du_texte).toBe("2026-10-v1");
    expect(rows[0].provenance).toBe("inscription");
  });

  it("retrouve son choix dans « Mon compte », le retire, puis le redonne", async () => {
    await prof.getByRole("link", { name: "Mon compte" }).click();
    await prof.waitForURL(/\/teacher\/compte$/);
    await prof.waitForLoadState("networkidle");
    expect(await prof.locator("[data-etat-nouveautes]").getAttribute("data-etat-nouveautes")).toBe("oui");
    expect(await texte(prof)).toContain("Vous recevez les nouveautés depuis le");
    expect(await prof.locator('input[name="nouveautes"]').isChecked()).toBe(true);
    await capture(prof, "reglage-espace-enseignant");
    await prof.locator('input[name="nouveautes"]').uncheck();
    await prof.getByRole("button", { name: "Enregistrer mon choix" }).click();
    await prof.waitForURL(/fait=non/, { timeout: 30_000 });
    expect(await texte(prof)).toContain("vous ne recevrez plus les nouveautés");
    expect(await prof.locator('input[name="nouveautes"]').isChecked()).toBe(false);
    await prof.locator('input[name="nouveautes"]').check();
    await prof.getByRole("button", { name: "Enregistrer mon choix" }).click();
    await prof.waitForURL(/fait=oui/, { timeout: 30_000 });
    expect(await prof.locator("[data-etat-nouveautes]").getAttribute("data-etat-nouveautes")).toBe("oui");
  });

  it("se désinscrit par le lien de son e-mail, sans connexion ; le lien rejoué ne fait rien de plus", async () => {
    // Le lien est celui que l'export des consentants donne pour ce compte.
    const admin = await pageAdmin();
    const r = await admin.request.get(`${BASE}/admin/inscrits/export?q=${encodeURIComponent(EMAIL)}&consentants=1`);
    expect(r.status()).toBe(200);
    const lignes = (await r.text()).replace(/^﻿/, "").trimEnd().split("\r\n").map((l) => l.split(";"));
    expect(lignes).toHaveLength(2);
    const lien = lignes[1]![14]!;
    await admin.context().close();

    const lecteur = await (await navigateur.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" })).newPage();
    await lecteur.goto(lien);
    await lecteur.waitForLoadState("networkidle");
    expect(await lecteur.locator("main").getAttribute("data-desinscription")).toBe("desinscrit");
    expect(await texte(lecteur)).toContain("Vous êtes désinscrit des nouveautés");
    await capture(lecteur, "desinscription-confirmee", false);
    const { rows } = await base((c) => c.query("select nouveautes_retirees_le from users where email = $1", [EMAIL]));
    expect(rows[0].nouveautes_retirees_le).toBeInstanceOf(Date);

    await lecteur.goto(lien);
    expect(await lecteur.locator("main").getAttribute("data-desinscription")).toBe("deja");
    await lecteur.goto(`${BASE}/nouveautes/desinscription?jeton=${encodeURIComponent(lien.split("jeton=")[1]!.slice(0, -4))}abcd`);
    expect(await lecteur.locator("main").getAttribute("data-desinscription")).toBe("invalide");
    await lecteur.context().close();

    // Et l'espace enseignant le dit.
    await aller(prof, "/teacher/compte");
    expect(await prof.locator("[data-etat-nouveautes]").getAttribute("data-etat-nouveautes")).toBe("non");
  });
});
