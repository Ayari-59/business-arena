import { createHmac, randomUUID } from "node:crypto";
import { cleDerivee } from "@/lib/cles";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import {
  LIBELLE_QUITTER_LA_PARTIE,
  LIEN_ADMINISTRATION,
  LIEN_ESPACE_ENSEIGNANT,
  LIEN_ETABLISSEMENT,
  NAVIGATION_ADMIN,
  NAVIGATION_ARENE,
  NAVIGATION_ENSEIGNANT,
} from "../../src/config/navigation";

/**
 * LES MENUS DES ESPACES SOUS COMPTE ET DE L'ARÈNE, dans un vrai navigateur.
 *
 * L'espace enseignant, l'établissement et l'administration posent la même
 * rangée de pastilles, lue dans le plan : ces gardes vérifient qu'elle est là,
 * dans l'ordre du plan, que la page courante s'y marque, que les sorties
 * (établissement, administration) ne se montrent qu'à qui y a droit, et que
 * l'arène porte le même petit menu sur ordinateur et dans le menu du
 * téléphone, fermé par « Quitter la partie ».
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

/** Une session signée comme lib/session.ts. */
async function connecter(ctx: BrowserContext, userId: string): Promise<void> {
  const now = Date.now();
  const corps = Buffer.from(JSON.stringify({ id: userId, role: "teacher", v: 1, iat: now, exp: now + 3600_000 })).toString("base64url");
  const signature = createHmac("sha256", cleDerivee("session", process.env.AUTH_SECRET!)).update(corps).digest("hex").slice(0, 32);
  await ctx.addCookies([{ name: "ba_session", value: `${corps}.${signature}`, url: BASE }]);
}

const ordinateur = () => navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
const telephone = () => navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 780 }, locale: "fr-FR" });

/** Les libellés des pastilles d'un repère de navigation, dans l'ordre du document (sans les gestes de compte). */
const libelles = (nav: ReturnType<Page["locator"]>) =>
  nav.locator("[data-pastille]").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
/** Les libellés de tous les liens d'un bloc. */
const liensDe = (bloc: ReturnType<Page["locator"]>) =>
  bloc.getByRole("link").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));

/** Les aplats orange dans la fenêtre : un seul bouton plein par écran. */
const pleinsALEcran = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && e.checkVisibility({ visibilityProperty: true });
      })
      .map((e) => e.textContent?.trim() ?? ""),
  );

const debordement = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

describe("l'espace enseignant et l'établissement", () => {
  it("les pastilles, dans l'ordre du plan, la page courante marquée, l'aide vers le guide", async () => {
    const ctx = await ordinateur();
    const { userId, orgId } = await enseignantSousLicence(ctx);
    const prof = await ctx.newPage();
    await aller(prof, "/teacher");
    const nav = prof.getByRole("navigation", { name: "Espace enseignant" });
    expect(await libelles(nav)).toEqual(NAVIGATION_ENSEIGNANT.map((p) => p.libelle));
    expect(await nav.locator('a[aria-current="page"]').innerText()).toBe("Mes parties");
    expect(await nav.getByRole("link", { name: "Aide", exact: true }).getAttribute("href")).toBe("/guides/enseignant");
    // Sans le droit : ni établissement ni administration.
    expect(await nav.getByRole("link", { name: LIEN_ETABLISSEMENT.libelle }).count()).toBe(0);
    expect(await nav.getByRole("link", { name: LIEN_ADMINISTRATION.libelle }).count()).toBe(0);
    expect((await pleinsALEcran(prof)).length, "un seul bouton plein à l'écran").toBeLessThanOrEqual(1);

    // Chaque pastille mène à sa page, qui la marque à son tour.
    for (const p of NAVIGATION_ENSEIGNANT.filter((p) => p.code !== "aide")) {
      await aller(prof, p.href);
      const courante = prof.getByRole("navigation", { name: "Espace enseignant" }).locator('a[aria-current="page"]');
      expect(await courante.innerText(), p.href).toBe(p.libelle);
      expect(await prof.getByRole("heading", { level: 1 }).count(), p.href).toBe(1);
    }

    // L'administrateur de l'établissement voit la sortie vers son établissement, à droite.
    await base((c) => c.query("update organization_members set role = 'org_admin' where user_id = $1 and organization_id = $2", [userId, orgId]));
    await aller(prof, "/teacher");
    const sortie = prof.getByRole("navigation", { name: "Espace enseignant" }).getByRole("link", { name: LIEN_ETABLISSEMENT.libelle });
    expect(await sortie.getAttribute("href")).toBe(LIEN_ETABLISSEMENT.href);
    await sortie.click();
    await prof.waitForURL(`${BASE}/org`, { timeout: 30_000 });
    const etab = prof.getByRole("navigation", { name: "Mon établissement" });
    expect(await etab.locator('a[aria-current="page"]').innerText()).toBe(LIEN_ETABLISSEMENT.libelle);
    expect(await etab.getByRole("link", { name: LIEN_ESPACE_ENSEIGNANT.libelle }).getAttribute("href")).toBe("/teacher");
    expect(await etab.getByRole("link", { name: LIEN_ADMINISTRATION.libelle }).count(), "pas d'administration sans le droit").toBe(0);
    await ctx.close();
  }, 120_000);

  it("sur téléphone, les pastilles font 44 px et rien ne déborde", async () => {
    const ctx = await telephone();
    await enseignantSousLicence(ctx);
    const prof = await ctx.newPage();
    await aller(prof, "/teacher");
    const nav = prof.getByRole("navigation", { name: "Espace enseignant" });
    const hauteurs = await nav.locator("[data-pastille]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(hauteurs.length).toBe(NAVIGATION_ENSEIGNANT.length);
    for (const h of hauteurs) expect(h, "pastille trop basse au doigt").toBeGreaterThanOrEqual(43);
    expect(await debordement(prof), "l'espace enseignant déborde à 390 px").toBeLessThanOrEqual(0);
    await ctx.close();
  }, 60_000);
});

describe("l'administration générale", () => {
  let adminId: string;
  beforeAll(async () => {
    adminId = await base(async (c) => {
      const { rows } = await c.query(
        "insert into users (email, display_name, is_platform_admin, provenance) values ($1, 'Admin E2E', true, 'inscription') returning id",
        [`admin-menus-${randomUUID()}@e2e.test`],
      );
      return rows[0].id as string;
    });
  });

  it("la même rangée de pastilles sur ses sept pages, la page courante marquée", async () => {
    const ctx = await ordinateur();
    await connecter(ctx, adminId);
    const p = await ctx.newPage();
    for (const pastille of NAVIGATION_ADMIN) {
      await aller(p, pastille.href);
      const nav = p.getByRole("navigation", { name: "Administration" });
      expect(await libelles(nav), pastille.href).toEqual([...NAVIGATION_ADMIN.map((x) => x.libelle), LIEN_ESPACE_ENSEIGNANT.libelle]);
      expect(await nav.locator('a[aria-current="page"]').innerText(), pastille.href).toBe(pastille.libelle);
      expect(await p.getByRole("heading", { level: 1 }).count(), pastille.href).toBe(1);
      expect(await p.getByRole("link", { name: /← Plateforme|Landing/ }).count(), `${pastille.href} garde un ancien lien`).toBe(0);
    }
    // Le propriétaire voit « Administration » dans son espace enseignant.
    await aller(p, "/teacher");
    const admin = p.getByRole("navigation", { name: "Espace enseignant" }).getByRole("link", { name: LIEN_ADMINISTRATION.libelle });
    expect(await admin.getAttribute("href")).toBe("/admin");
    await ctx.close();
  }, 120_000);

  it("sur téléphone, rien ne déborde", async () => {
    const ctx = await telephone();
    await connecter(ctx, adminId);
    const p = await ctx.newPage();
    for (const chemin of ["/admin", "/admin/inscrits", "/admin/offres"]) {
      await aller(p, chemin);
      expect(await debordement(p), `${chemin} déborde à 390 px`).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  }, 60_000);
});

describe("l'arène", () => {
  it("le même petit menu sur ordinateur et dans le menu du téléphone, fermé par « Quitter la partie »", async () => {
    const ctxProf = await ordinateur();
    await enseignantSousLicence(ctxProf);
    const prof = await ctxProf.newPage();
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) await prof.locator("#nouvelle-partie > summary").click();
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    const code = (await prof.locator("#code-invitation").innerText()).trim();
    await ctxProf.close();

    const attendus = [...NAVIGATION_ARENE.map((l) => l.libelle), LIBELLE_QUITTER_LA_PARTIE];
    for (const [nom, contexte] of [
      ["ordinateur", await ordinateur()],
      ["téléphone", await telephone()],
    ] as const) {
      const eleve = await contexte.newPage();
      await aller(eleve, `/join?code=${code}`);
      await eleve.fill('input[name="pseudo"]', "Léa");
      await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
      await eleve.waitForURL(/\/arena\//, { timeout: 60_000 });
      await eleve.waitForLoadState("networkidle");
      // L'arène arrive en flux (loading.tsx) : on attend la partie, pas le réseau.
      await eleve.locator("[data-ecran-de-jeu] #mon-profil").waitFor({ state: "attached", timeout: 60_000 });
      if (nom === "ordinateur") {
        const menu = eleve.locator("main [data-menu-de-l-arene]");
        await menu.waitFor({ state: "visible", timeout: 30_000 });
        expect(await liensDe(menu)).toEqual(attendus);
        // En classe, « Quitter la partie » ramène à l'accueil, comme avant.
        expect(await menu.getByRole("link", { name: LIBELLE_QUITTER_LA_PARTIE }).getAttribute("href")).toBe("/");
        expect(await menu.locator("[data-lien-guide-etudiant]").getAttribute("href")).toBe("/guides/etudiant");
      } else {
        // La barre du site s'efface ; le menu de la partie porte le cockpit, puis le même menu.
        await eleve.getByRole("button", { name: "Menu de la partie" }).waitFor({ state: "visible", timeout: 30_000 });
        expect(await eleve.locator("main [data-menu-de-l-arene]").isVisible()).toBe(false);
        await eleve.getByRole("button", { name: "Menu de la partie" }).click();
        const panneau = eleve.locator("[data-barre-collante] .carte").first();
        const liens = await panneau.getByRole("link").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
        expect(liens.slice(0, 1)).toEqual(["Cockpit de prévision"]);
        expect(liens.slice(1, 1 + attendus.length)).toEqual(attendus);
        expect(await panneau.getByRole("link", { name: LIBELLE_QUITTER_LA_PARTIE }).getAttribute("href")).toBe("/");
        expect(await debordement(eleve), "l'arène déborde à 390 px").toBeLessThanOrEqual(0);
        await eleve.keyboard.press("Escape");
      }
      await contexte.close();
    }
  }, 180_000);
});
