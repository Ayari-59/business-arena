import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { Client } from "pg";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LA CAPACITÉ DU TOUR, DITE SUR LA FEUILLE : LE CAS DES PHOTOS, DANS UN NAVIGATEUR.
 *
 * Une partie NOVA en gamme (niveau 4), la NOVA Studio déjà lancée (sa R&D posée en
 * base, comme après un premier tour qui l'a financée). Les plans demandent 6 300
 * enceintes, sous les 7 000 des machines, mais 2 250 heures pour 2 160 : l'alerte du
 * résultat estimé doit dire la capacité réelle du tour et nommer la main-d'œuvre,
 * sur ordinateur (le cadran) comme sur téléphone (le tiroir de la ligne estimée).
 *
 * `CAPTURES=<dossier>` : les deux écrans y sont enregistrés, à 1280 et à 390 px.
 */

const PLANS: Record<string, number> = { "nova-go": 1_000, "nova-one": 2_900, "nova-studio": 2_400 };
const CAPTURES = process.env.CAPTURES;

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlArene: string;

async function enBase(f: (c: Client) => Promise<void>): Promise<void> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await f(c);
  } finally {
    await c.end();
  }
}

/** Les plans et les ventes estimées, posés comme une frappe (les cartes cachées comprises). */
async function saisir(p: Page): Promise<void> {
  await p.evaluate((plans) => {
    const poser = (nom: string, valeur: number) => {
      const champ = document.querySelector<HTMLInputElement>(`input[name="${nom}"]`);
      if (!champ) throw new Error(`champ absent : ${nom}`);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(champ, String(valeur));
      champ.dispatchEvent(new Event("input", { bubbles: true }));
      champ.dispatchEvent(new Event("change", { bubbles: true }));
    };
    for (const [code, n] of Object.entries(plans)) {
      poser(`product.${code}.productionPlan`, n);
      poser(`ventesEstimees.${code}`, n);
    }
  }, PLANS);
  await p.waitForTimeout(1_200);
}

let capaciteVue = 0;

/**
 * L'alerte du cas des photos, lue : la capacité du tour, sous les 6 300 demandés et
 * sous les 7 000 des machines, la main-d'œuvre nommée, chaque référence chiffrée, et
 * le livrable égal à la capacité (aucun stock d'ouverture). Les chiffres exacts
 * dépendent du réglage du niveau (le moral de l'équipe y joue) : le test unitaire
 * `tests/unit/resultat-estime-capacite.test.ts` tient les nombres au scénario brut.
 */
function lireLAlerte(alerte: string): number {
  const m = alerte.match(
    /Ce tour, votre atelier peut produire environ ([\d ]+) enceintes, pas 6 300 : vos 4 salariés n'ont pas assez d'heures\./,
  );
  expect(m, alerte).not.toBeNull();
  const capacite = Number(m![1]!.replace(/ /g, ""));
  expect(capacite).toBeLessThan(6_300);
  expect(alerte).toContain(`Vous ne pourrez livrer que ${m![1]} enceintes :`);
  expect(alerte).toMatch(/Il manquerait [\d ]+ NOVA One, [\d ]+ NOVA Studio et [\d ]+ NOVA Go\./);
  expect(alerte).not.toContain("faute de stock et de capacité");
  return capacite;
}

const lisible = (t: string) => t.replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  await enseignantSousLicence(contexte);
  page = await contexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("la capacité du tour, sur la feuille d'une gamme NOVA", () => {
  it("une partie NOVA en gamme, la Studio lancée", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    await page.getByRole("button", { name: /^Niveau 4/ }).click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\//, { timeout: 90_000 });
    urlArene = page.url().split("?")[0]!.split("#")[0]!;
    const partie = urlArene.split("/arena/")[1]!;
    await enBase(async (c) => {
      const { rowCount } = await c.query(
        `update company_states set state = jsonb_set(state, '{rdByProduct}',
           '{"nova-studio": {"invested": 25000, "launched": true, "launchRound": 1, "techLevel": 0}}'::jsonb)
         where team_id in (select id from teams where game_id = $1)`,
        [partie],
      );
      expect(rowCount, "aucun état d'entreprise à compléter").toBeGreaterThan(0);
    });
  }, 180_000);

  it("sur ordinateur, le cadran dit la capacité du tour et la main-d'œuvre", async () => {
    await page.goto(urlArene, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.locator('input[name="ventesEstimees.nova-studio"]').waitFor({ state: "attached", timeout: 30_000 });
    await saisir(page);
    const cadran = page.locator("[data-resultat-estime]");
    await cadran.locator("summary").first().click();
    const alerte = lisible(await page.locator("[data-alerte-du-manque]").innerText());
    capaciteVue = lireLAlerte(alerte);
    expect(alerte).toContain("une embauche ne compterait qu'au tour suivant");
    // Le panneau de capacité ne désigne plus de goulot en gamme : il dépend du mix.
    const vu = lisible(await page.locator("body").innerText()).toLowerCase();
    expect(vu).toContain("comptée en nova one");
    expect(vu).toContain("goulot selon le mix");
    expect(vu).toContain("les heures dépendent des références produites");
    if (CAPTURES) {
      await page.locator("[data-alerte-du-manque]").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${CAPTURES}/capacite-gamme-1280.png` });
    }
  }, 120_000);

  it("sur téléphone, le tiroir de la ligne estimée dit la même alerte", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await contexte.storageState(),
    });
    const q = await tel.newPage();
    try {
      await q.goto(urlArene, { waitUntil: "domcontentloaded" });
      await q.waitForLoadState("networkidle");
      if (CAPTURES) await q.screenshot({ path: `${CAPTURES}/faits-cles-gamme-390.png` });
      const passer = q.getByRole("button", { name: /Passer au /i }).first();
      if (await passer.isVisible().catch(() => false)) {
        await passer.click();
        await q.waitForTimeout(800);
      }
      await q.evaluate(() => {
        location.hash = "decisions";
      });
      await q.locator('input[name="ventesEstimees.nova-studio"]').waitFor({ state: "attached", timeout: 30_000 });
      await saisir(q);
      const ligne = q.locator("[data-ligne-estimee]:visible");
      await ligne.locator("summary").click();
      const alerte = lisible(await q.locator("[data-ligne-estimee] [data-alerte-du-manque]").innerText());
      // La même capacité que sur ordinateur : le même calcul, la même phrase.
      expect(lireLAlerte(alerte)).toBe(capaciteVue);
      // Le tiroir tient dans la largeur : aucun défilement horizontal.
      const large = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(large, "la page défile en largeur").toBeLessThanOrEqual(0);
      if (CAPTURES) await q.screenshot({ path: `${CAPTURES}/capacite-gamme-390.png` });
    } finally {
      await tel.close();
    }
  }, 180_000);
});
