import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Browser, type Page } from "playwright-core";
import { Client } from "pg";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * VALIDER LA PROPOSITION TROIS TOURS DE SUITE, SANS RIEN CHANGER, NE MÈNE PAS À LA CRISE.
 *
 * NOVA au niveau 2, une partie solo lancée depuis /jouer : à chaque tour, le
 * joueur parcourt la feuille et valide ce qu'elle propose, puis confirme « Oui,
 * je garde ces valeurs ». La proposition suit le tour (`propositionDuTour`) :
 * le volume proposé au tour 2 n'est plus celui du tour 1, la feuille dit d'où il
 * vient, et aucun tour ne se clôt en cessation de paiements (lu en base, dans la
 * trace du moteur, et à l'écran).
 */

let navigateur: Browser;
let page: Page;
let urlArene: string;
const plans: number[] = [];

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante : ce test lit la trace des tours en base");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

async function validerLaProposition(p: Page): Promise<void> {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(400);
  }
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(900);
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(1_200);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  const plan = p.locator('input[name="productionPlan"]').first();
  await plan.waitFor({ state: "attached", timeout: 30_000 });
  plans.push(Number(await plan.inputValue()));
  for (let k = 0; k < 20; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(250);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  await garder.first().waitFor({ state: "visible", timeout: 10_000 });
  // La feuille dit d'où vient la proposition, sous la question.
  const origine = (await texte(p)).toLowerCase();
  expect(origine).toMatch(
    plans.length === 1 ? /valeurs proposées au départ/ : /le volume suit vos ventes du tour passé et la saison/,
  );
  await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  const contexte = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  page = await contexte.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: /^Niveau 2/ }).click();
  expect(await page.locator("input[name=level]").inputValue()).toBe("2");
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("NOVA niveau 2 : la proposition validée trois tours de suite", () => {
  it("trois tours validés tels que proposés, aucune cessation de paiements", async () => {
    for (let tour = 1; tour <= 3; tour += 1) await validerLaProposition(page);
    // Le volume proposé suit le tour : celui du tour 2 n'est plus le plan de départ.
    expect(plans).toHaveLength(3);
    expect(plans[1]).not.toBe(plans[0]);

    const gameId = urlArene.split("/arena/")[1]!;
    const tours = await base((c) =>
      c
        .query<{ index: number; crise: string | null }>(
          `select r.index, rr.engine_trace->'treasury'->>'crisis' as crise
             from round_results rr
             join rounds r on r.id = rr.round_id
             join teams t on t.id = rr.team_id
            where r.game_id = $1 and t.controller = 'human'
            order by r.index`,
          [gameId],
        )
        .then((r) => r.rows),
    );
    expect(tours.map((t) => t.index)).toEqual([1, 2, 3]);
    expect(tours.filter((t) => t.crise === "true"), "tours clos en crise").toEqual([]);

    await page.goto(urlArene, { waitUntil: "networkidle" });
    expect(await page.getByRole("alert", { name: "Crise de trésorerie" }).count()).toBe(0);
    expect(await texte(page)).not.toMatch(/cessation de paiements/);
  }, 600_000);
});
