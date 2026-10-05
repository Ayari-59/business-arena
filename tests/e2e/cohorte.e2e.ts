import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";

/**
 * UNE COHORTE, DE L'INVITATION À LA VUE DE L'ANIMATEUR.
 *
 * La cohorte est créée par le script de l'équipe ; un manager la rejoint par
 * le lien d'invitation, joue un épisode, puis reprend son profil sur un autre
 * appareil avec son code. L'animateur, par sa clé, ne voit que des totaux.
 */

let navigateur: Browser;
let invitation = "";
let animation = "";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  const sortie = execFileSync(
    "npx",
    ["tsx", "scripts/creer-cohorte.ts", "Cohorte de recette", BASE],
    { encoding: "utf8", env: process.env },
  );
  invitation = sortie.match(/https?:\/\/\S+\/rejoindre\?code=\S+/)![0];
  animation = sortie.match(/https?:\/\/\S+\/animation\/\S+/)![0];
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

async function jouer(page: Page, code: string) {
  const ep = episodeParCode(code)!;
  await page.goto(`${BASE}/entreprises/episode/${code}?hasard=7`);
  await page.getByRole("button", { name: "Commencer l'épisode" }).click();
  for (let pas = 0; pas < 120; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) break;
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) {
        await page.locator(`input[name="${nom}"]`).first().check();
      }
    }
    const prevision = page.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      await prevision.fill(ep.prevision.placeholder.replace(",", ".").replace(/\s/g, ""));
    }
    await page.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  await expect
    .poll(() => page.getByText("le prochain épisode se cherche").count(), { timeout: 30_000 })
    .toBe(0);
}

describe("une cohorte", () => {
  it("se rejoint, se joue, se reprend ailleurs, et l'animateur n'en voit que des totaux", async () => {
    const appareil = await navigateur.newContext({ locale: "fr-FR" });
    const page = await appareil.newPage();
    await page.goto(invitation);
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe(
      "Rejoindre « Cohorte de recette »",
    );
    expect(await page.getByText("votre nom, votre profil, vos scores").count()).toBe(1);
    await page.getByRole("button", { name: "Rejoindre la cohorte" }).click();
    await expect
      .poll(() => page.getByText("Vous avez rejoint la cohorte « Cohorte de recette »").count())
      .toBe(1);
    const code = (await page.locator("#reprise .font-mono").textContent())!.trim();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    await jouer(page, "depot-qui-deborde");

    const animateur = await navigateur.newPage();
    await animateur.goto(animation);
    expect(await animateur.getByRole("heading", { level: 1 }).textContent()).toBe(
      "Cohorte « Cohorte de recette »",
    );
    expect(await animateur.getByText(/1 membre, dont 1 avec au moins un épisode/).count()).toBe(1);
    expect(await animateur.getByText(/Moins de 5 membres/).count()).toBe(1);
    expect(await animateur.getByText("Le dépôt qui déborde").count()).toBe(0);
    await animateur.goto(`${BASE}/entreprises/episode/animation/une-cle-qui-n-existe-pas-du-tout`);
    expect(await animateur.getByText(/Cohorte de recette/).count()).toBe(0);
    await animateur.close();

    // Un autre appareil : le code rend le profil, la cohorte avec lui.
    const autre = await navigateur.newContext({ locale: "fr-FR" });
    const p2 = await autre.newPage();
    await p2.goto(`${BASE}/entreprises/episode/reprendre`);
    await p2.getByLabel("Votre code de reprise").fill("ZZZZ-ZZZZ");
    await p2.getByRole("button", { name: "Reprendre mon profil" }).click();
    await expect.poll(() => p2.getByText("Ce code ne correspond à aucun profil").count()).toBe(1);
    await p2.getByLabel("Votre code de reprise").fill(code.toLowerCase());
    await p2.getByRole("button", { name: "Reprendre mon profil" }).click();
    await expect
      .poll(() => p2.getByText("Votre profil est de retour sur cet appareil").count())
      .toBe(1);
    expect(await p2.getByText("Établi sur 1 épisode joué").count()).toBe(1);
    expect(await p2.getByText("« Cohorte de recette »").count()).toBeGreaterThan(0);
    await appareil.close();
    await autre.close();
  }, 180_000);
});
