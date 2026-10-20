import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { jetonDeSession } from "./helpers/licence";
import { DUREE_DU_LIEN_MS, jetonDeConfirmation } from "@/services/confirmation-email.service";

/**
 * L'ADRESSE CONFIRMÉE, DANS UN VRAI NAVIGATEUR (migration 0046, décision du propriétaire).
 *
 * Un enseignant s'inscrit par le formulaire du site. Il joue tout de suite ; « Mon compte »
 * lui dit que son adresse attend d'être confirmée et propose de renvoyer le lien. Dans
 * /admin, son établissement est déplié d'office et dit pourquoi aucune licence ne peut lui
 * être attribuée. Il ouvre le lien : la page le confirme, « Mon compte » ne demande plus
 * rien, et /admin montre le formulaire de licence.
 */

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

const TAG = randomUUID().slice(0, 8);
const PROF = { nom: `Prof Confirmé ${TAG}`, ecole: `Lycée de la confirmation ${TAG}`, email: `prof.${TAG}@lycee-confirmation.test` };

let navigateur: Browser;
let prof: BrowserContext;
let admin: BrowserContext;
let profId: string;

/** Un administrateur de la plateforme posé en base, avec sa session, comme les autres parcours. */
async function sessionAdmin(): Promise<BrowserContext> {
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  const { rows } = await base((c) =>
    c.query(
      "insert into users (email, display_name, is_platform_admin, provenance) values ($1, 'Admin E2E', true, 'inscription') returning id",
      [`admin-${randomUUID()}@e2e.test`],
    ),
  );
  await ctx.addCookies([{ name: "ba_session", value: jetonDeSession(rows[0].id as string), url: BASE }]);
  return ctx;
}

const blocDeLEtablissement = (page: Page) =>
  page.locator("div.rounded-xl.bg-slate-950", { hasText: PROF.ecole }).first();

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  prof = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  admin = await sessionAdmin();
}, 60_000);

afterAll(async () => {
  await prof?.close();
  await admin?.close();
  await navigateur?.close();
});

describe("l'adresse d'un enseignant inscrit par le site", () => {
  it("s'inscrit et arrive dans son espace sans attendre de confirmation", async () => {
    const page = await prof.newPage();
    await aller(page, "/teacher/login");
    await page.getByRole("button", { name: "Créer un compte" }).click();
    await page.fill('input[name="displayName"]', PROF.nom);
    await page.fill('input[name="schoolName"]', PROF.ecole);
    await page.fill('input[name="email"]', PROF.email);
    await page.fill('input[name="password"]', "motdepasse-e2e");
    await page.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    await page.waitForURL(/\/teacher$/, { timeout: 60_000 });
    profId = (await base((c) => c.query("select id from users where email = $1", [PROF.email]))).rows[0].id;
    const confirmee = (await base((c) => c.query("select email_confirme_le from users where id = $1", [profId]))).rows[0];
    expect(confirmee.email_confirme_le).toBeNull();
    await page.close();
  }, 120_000);

  it("« Mon compte » dit que l'adresse attend, et propose de renvoyer le lien", async () => {
    const page = await prof.newPage();
    await aller(page, "/teacher/compte");
    const section = page.locator("[data-adresse-a-confirmer]");
    expect(await section.innerText()).toMatch(/pas encore confirmée\. Vous pouvez jouer sans attendre/);
    await section.getByRole("button", { name: "Renvoyer le lien de confirmation" }).click();
    await page.waitForURL(/[?&]lien=/, { timeout: 30_000 });
    // Sans service d'envoi configuré ici, le lien ne part pas, et la page le dit honnêtement.
    expect(await page.locator("[data-adresse-a-confirmer] [role=status]").innerText()).toMatch(/n'a pas pu partir/);
    expect(await page.locator("[data-adresse-confirmee]").count()).toBe(0);
    await page.close();
  });

  it("dans /admin, l'établissement est déplié et dit pourquoi la licence attend ; pas de formulaire", async () => {
    const page = await admin.newPage();
    await aller(page, "/admin");
    const bloc = blocDeLEtablissement(page);
    const licence = bloc.locator("details", { hasText: "Licence" });
    expect(await licence.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    expect(await bloc.locator("[data-licence-en-attente-d-adresse]").innerText()).toContain(
      `Aucun administrateur de cet établissement n'a confirmé son adresse (${PROF.email})`,
    );
    expect(await bloc.locator("[data-formulaire-licence]").count()).toBe(0);
    await page.close();
  });

  it("un lien faux ne confirme rien ; le vrai confirme, une fois", async () => {
    const page = await prof.newPage();
    await aller(page, "/compte/confirmer?jeton=pas-un-jeton");
    expect(await page.locator("main").getAttribute("data-confirmation-adresse")).toBe("invalide");

    const jeton = jetonDeConfirmation({ id: profId, email: PROF.email }, new Date(Date.now() + DUREE_DU_LIEN_MS));
    await aller(page, `/compte/confirmer?jeton=${encodeURIComponent(jeton)}`);
    expect(await page.locator("main").getAttribute("data-confirmation-adresse")).toBe("confirme");
    expect(await texte(page)).toContain("Votre adresse est confirmée");

    await aller(page, `/compte/confirmer?jeton=${encodeURIComponent(jeton)}`);
    expect(await page.locator("main").getAttribute("data-confirmation-adresse")).toBe("deja");
    await page.close();
  });

  it("ensuite, « Mon compte » ne demande plus rien et /admin montre le formulaire de licence", async () => {
    const page = await prof.newPage();
    await aller(page, "/teacher/compte");
    expect(await page.locator("[data-adresse-a-confirmer]").count()).toBe(0);
    expect(await page.locator("[data-adresse-confirmee]").innerText()).toMatch(/^le \d{1,2} \S+ \d{4}$/);
    await page.close();

    const a = await admin.newPage();
    await aller(a, "/admin");
    const bloc = blocDeLEtablissement(a);
    expect(await bloc.locator("[data-licence-en-attente-d-adresse]").count()).toBe(0);
    expect(await bloc.locator("[data-formulaire-licence]").count()).toBe(1);
    await a.close();
  });
});
