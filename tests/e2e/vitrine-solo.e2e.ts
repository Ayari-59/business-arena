import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * LA VITRINE DU SOLO PUBLIC, DANS UN VRAI NAVIGATEUR.
 *
 * Allumée : NOVA se joue à tous les niveaux, les autres entreprises jusqu'au niveau 3 ;
 * au-delà, l'écran le dit et le serveur refuse. Le test allume le réglage dans la base,
 * puis le remet comme il l'a trouvé — éteint par défaut, tout le reste de la suite joue
 * à tous les niveaux.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let avant: unknown = null;

async function reglerVitrine(valeur: unknown | null): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante : ce test règle la vitrine en base");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    const ligne = await c.query("select settings from platform_settings where id = 1");
    const settings = { ...(ligne.rows[0]?.settings ?? {}) } as Record<string, unknown>;
    if (valeur === null) delete settings.vitrineSolo;
    else settings.vitrineSolo = valeur;
    if (ligne.rows.length) await c.query("update platform_settings set settings = $1 where id = 1", [settings]);
    else await c.query("insert into platform_settings (id, settings) values (1, $1)", [settings]);
  } finally {
    await c.end();
  }
}

async function lireVitrine(): Promise<unknown> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const ligne = await c.query("select settings from platform_settings where id = 1");
    return (ligne.rows[0]?.settings as Record<string, unknown> | undefined)?.vitrineSolo ?? null;
  } finally {
    await c.end();
  }
}

beforeAll(async () => {
  avant = await lireVitrine();
  await reglerVitrine({ active: true, entrepriseOuverte: "nova", niveauMaxAutres: 3 });
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
  await contexte.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  page = await contexte.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
  await reglerVitrine(avant);
});

async function ouvrirJouer() {
  await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

describe("la vitrine à deux étages", () => {
  it("chaque entreprise dit jusqu'où elle se joue", async () => {
    await ouvrirJouer();
    await page.getByText("Tous niveaux").waitFor({ state: "visible" });
    expect(await page.getByText("Tous niveaux").count()).toBe(1);
    expect(await page.getByText("Niveaux 1-3").count()).toBe(8);
  });

  it("NOVA se joue à tous les niveaux : aucun verrou", async () => {
    await ouvrirJouer();
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    await page.getByRole("button", { name: /^Niveau 6/ }).click();
    expect(await page.locator("input[name=level]").inputValue()).toBe("6");
    expect(await page.locator("[data-niveaux-reserves]").count()).toBe(0);
  });

  it("une autre entreprise s'arrête au niveau 3 et l'écran dit pourquoi, avec où s'adresser", async () => {
    await ouvrirJouer();
    await page.getByRole("button", { name: /L'ESCALE/ }).click();
    await page.getByRole("button", { name: /^Niveau 5/ }).click();
    // Le niveau demandé est réservé : on retombe au plus haut permis.
    expect(await page.locator("input[name=level]").inputValue()).toBe("3");
    const message = page.locator("[data-niveaux-reserves]");
    await message.waitFor({ state: "visible" });
    expect(await message.innerText()).toContain("Les niveaux 4 à 6 sont réservés aux établissements.");
    await message.getByRole("link", { name: /Prendre rendez-vous/ }).waitFor({ state: "visible" });
    await message.getByRole("link", { name: /espace enseignant/ }).waitFor({ state: "visible" });
  });

  it("passer de NOVA au niveau 6 à une autre entreprise ramène le niveau à 3", async () => {
    await ouvrirJouer();
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    await page.getByRole("button", { name: /^Niveau 6/ }).click();
    await page.getByRole("button", { name: /MAILLE/ }).click();
    expect(await page.locator("input[name=level]").inputValue()).toBe("3");
  });

  it("le serveur refuse un formulaire forgé : niveau réservé, retour sur /jouer avec le message", async () => {
    await ouvrirJouer();
    await page.getByRole("button", { name: /L'ESCALE/ }).click();
    // On force la valeur envoyée, comme le ferait un client qui contourne l'écran.
    await page.evaluate(() => {
      (document.querySelector("input[name=level]") as HTMLInputElement).value = "5";
    });
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/jouer\?reserve=1/, { timeout: 30_000 });
    await page.getByText(/sont réservés aux établissements/).first().waitFor({ state: "visible" });
  });

  it("une partie permise se lance normalement", async () => {
    await ouvrirJouer();
    await page.getByRole("button", { name: /L'ESCALE/ }).click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    if (page.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint (games.creator_ip).");
  });
});
