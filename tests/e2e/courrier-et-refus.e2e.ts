import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * LE COURRIER ADRESSÉ, ET LA DÉCISION QUI DIT POURQUOI ELLE NE PASSE PAS,
 * dans un navigateur, sur le build de production et sa base.
 *
 *   1. LE COURRIER : le nom de l'entreprise sur l'enveloppe (la fenêtre du
 *      destinataire) et en tête de la lettre, pour NOVA et LA TABLE
 *      D'AUGUSTIN, à 1280 et à 390 ; à 390, le nom long tient dans la fenêtre
 *      sans faire défiler la page de côté.
 *   2. LE REFUS DE LA FEUILLE (1280 et 390) : un champ vidé, un budget négatif
 *      dans un volet replié d'une autre étape (ou sur une autre carte) ; à
 *      l'envoi, le récapitulatif annoncé en tête, le champ marqué (cadre,
 *      `aria-invalid`, message relié), l'étape ou la carte ouverte, le champ
 *      au milieu de l'écran avec le focus ; corrigé, le refus disparaît.
 *   3. LE REFUS DU SERVEUR : un formulaire « périmé » (un prix caché de
 *      20 000 €, au-delà du garde-fou du schéma) ; le refus revient rattaché
 *      au champ du prix ; corrigé, l'envoi passe et le tour se simule.
 *
 * Captures (facultatives) : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;
let ordiNova: BrowserContext;
let ordiAugustin: BrowserContext;
let urlNova = "";
let urlAugustin = "";

async function lancer(ctx: BrowserContext, entreprise: RegExp): Promise<string> {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: entreprise }).first().click();
  await p.getByRole("button", { name: "Lancer la partie" }).click();
  await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (p.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  const url = p.url().split("?")[0]!.split("#")[0]!;
  await p.close();
  return url;
}

/** Un téléphone neuf (le courrier n'y est pas encore ouvert), pour le même invité. */
async function telephone(ctx: BrowserContext): Promise<BrowserContext> {
  const t = await navigateur.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    locale: "fr-FR",
  });
  await t.addCookies(await ctx.cookies());
  return t;
}

const figer = (p: Page) =>
  p.evaluate(() => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = 0;
    }
  });
const finir = (p: Page) =>
  p.evaluate(() => {
    for (const a of document.getAnimations()) a.finish();
  });

/** Ce que l'enveloppe et la lettre du courrier du tour disent du destinataire. */
const lirePli = (p: Page) =>
  p.evaluate(() => {
    const zone = document.querySelector<HTMLElement>("[data-courrier-du-tour]")!;
    const env = zone.querySelector<HTMLElement>(".enveloppe, .courriel");
    const fenetre = env?.querySelector<HTMLElement>("[data-destinataire-du-pli]") ?? null;
    const lettre = zone.querySelector<HTMLElement>(".lettre, .message")!;
    const bloc = lettre.querySelector<HTMLElement>("[data-destinataire-de-la-lettre]");
    const boite = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
    const rl = boite(lettre)!;
    const rb = boite(bloc);
    const re = boite(env);
    const rf = boite(fenetre);
    return {
      courriel: lettre.classList.contains("message"),
      enveloppe: env?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      nomFenetre: fenetre?.querySelector("[data-nom-du-destinataire]")?.textContent?.trim() ?? null,
      fenetreDeborde: fenetre ? fenetre.scrollWidth > fenetre.clientWidth + 1 : false,
      fenetreSort: rf && re ? rf.right > re.right + 0.5 || rf.left < re.left - 0.5 : false,
      lettre: lettre.textContent?.replace(/\s+/g, " ").trim() ?? "",
      bloc: bloc?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      blocSort: rb ? rb.right > rl.right + 0.5 || rb.left < rl.left - 0.5 : false,
      blocADroite: rb ? rb.right > rl.left + rl.width * 0.6 : false,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

async function auCourrierSurOrdinateur(p: Page, url: string) {
  await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(500);
    await p.evaluate(() => (location.hash = "decisions"));
    await p.waitForTimeout(800);
  }
}

async function auCourrierSurTelephone(t: Page, url: string) {
  await t.goto(url, { waitUntil: "networkidle" });
  await t.waitForTimeout(800);
  for (let k = 0; k < 14; k++) {
    if (await t.getByRole("button", { name: /Ouvrir le courrier/ }).first().isVisible().catch(() => false)) return;
    const s = t.getByRole("button", { name: /^(Continuer|Analyser|Décider|Prendre)/ }).last();
    if (!(await s.count())) break;
    await s.click().catch(() => {});
    await t.waitForTimeout(800);
  }
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordiNova = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  ordiAugustin = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  urlNova = await lancer(ordiNova, /NOVA/);
  urlAugustin = await lancer(ordiAugustin, /AUGUSTIN/);
}, 240_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le nom de l'entreprise sur le courrier du tour", () => {
  for (const [entreprise, quel] of [
    ["NOVA", () => ({ ctx: ordiNova, url: urlNova })],
    ["LA TABLE D'AUGUSTIN", () => ({ ctx: ordiAugustin, url: urlAugustin })],
  ] as const) {
    it(`${entreprise}, à 1280 : la pile, l'enveloppe et l'en-tête de la lettre`, async () => {
      const { ctx, url } = quel();
      const p = await ctx.newPage();
      await auCourrierSurOrdinateur(p, url);
      const zone = p.locator("[data-courrier-du-tour]").first();
      await zone.scrollIntoViewIfNeeded();
      // La pile cachetée, avant l'ouverture : adressée à l'entreprise.
      const pile = await p.evaluate(() =>
        [...document.querySelectorAll("[data-courrier-du-tour] [data-nom-du-destinataire]")].map((e) =>
          e.textContent?.trim(),
        ),
      );
      expect(pile.length).toBeGreaterThan(0);
      for (const n of pile) expect(n).toBe(entreprise);
      if (CAPTURES) await zone.screenshot({ path: `${CAPTURES}/e2e-pile-${entreprise.length}-1280.png` });
      await p.getByRole("button", { name: /Ouvrir le courrier/ }).first().click();
      await p.waitForTimeout(40);
      await figer(p);
      const m = await lirePli(p);
      if (!m.courriel) {
        expect(m.nomFenetre).toBe(entreprise);
        expect(m.enveloppe).toContain("À l'attention de la direction");
        expect(m.fenetreDeborde).toBe(false);
      } else {
        expect(m.enveloppe).toContain(`À ${entreprise}`);
      }
      await finir(p);
      await p.waitForTimeout(400);
      const l = await lirePli(p);
      if (l.courriel) {
        expect(l.lettre).toContain(`${entreprise}, direction générale`);
      } else {
        expect(l.bloc).toMatch(new RegExp(`^${entreprise.replace(/'/g, "'")}(À l'attention de la direction générale|Direction générale)`));
        expect(l.blocSort).toBe(false);
        expect(l.blocADroite, "le bloc destinataire se pose à droite, comme une lettre d'affaires").toBe(true);
        // La ligne de date : le tour, tel que la partie le nomme.
        expect(l.lettre).toMatch(/(Tour|Trimestre|Mois|Année) 1/);
      }
      expect(l.lettre).not.toContain("Votre entreprise");
      expect(l.deCote).toBe(0);
      if (CAPTURES) await zone.screenshot({ path: `${CAPTURES}/e2e-lettre-${entreprise.length}-1280.png` });
      // L'enveloppe posée à côté de la lettre (pli seul, assez de place) porte le nom aussi.
      const posee = await p.evaluate(() => {
        const e = document.querySelector<HTMLElement>("[data-enveloppe-posee]");
        return e && e.getBoundingClientRect().width > 0 ? e.textContent?.replace(/\s+/g, " ").trim() : null;
      });
      if (posee !== null) expect(posee).toContain(entreprise);
      await p.close();
    }, 120_000);

    it(`${entreprise}, à 390 : le nom tient dans la fenêtre de l'enveloppe et en tête de la lettre`, async () => {
      const { ctx, url } = quel();
      const tel = await telephone(ctx);
      const t = await tel.newPage();
      await auCourrierSurTelephone(t, url);
      await t.getByRole("button", { name: /Ouvrir le courrier/ }).first().click();
      await t.waitForTimeout(40);
      await figer(t);
      const m = await lirePli(t);
      if (!m.courriel) {
        expect(m.nomFenetre).toBe(entreprise);
        expect(m.fenetreDeborde, "le nom déborde de la fenêtre").toBe(false);
        expect(m.fenetreSort, "la fenêtre sort de l'enveloppe").toBe(false);
      }
      expect(m.deCote, "défilement de côté").toBe(0);
      if (CAPTURES) await t.screenshot({ path: `${CAPTURES}/e2e-enveloppe-${entreprise.length}-390.png` });
      await finir(t);
      await t.waitForTimeout(400);
      const l = await lirePli(t);
      if (!l.courriel) {
        expect(l.bloc).toContain(entreprise);
        expect(l.blocSort, "le bloc destinataire sort de la lettre").toBe(false);
      }
      expect(l.deCote).toBe(0);
      if (CAPTURES) await t.screenshot({ path: `${CAPTURES}/e2e-lettre-${entreprise.length}-390.png` });
      await tel.close();
    }, 120_000);
  }
});

/** L'état des refus, lu dans la page. */
const lireRefus = (p: Page) =>
  p.evaluate(() => {
    const recap = document.querySelector<HTMLElement>("[data-recapitulatif-des-erreurs]");
    const fautifs = [...document.querySelectorAll<HTMLElement>('form [aria-invalid="true"]')].map((e) => {
      const r = e.getBoundingClientRect();
      const ids = (e.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
      const cadre = e.closest<HTMLElement>(".champ");
      return {
        nom: e.getAttribute("name"),
        message: ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" "),
        visible: r.height > 0,
        cadre: cadre ? getComputedStyle(cadre).borderTopColor : null,
      };
    });
    const actif = document.activeElement as HTMLElement | null;
    const ra = actif?.getBoundingClientRect();
    return {
      recap: recap ? recap.textContent?.replace(/\s+/g, " ").trim() ?? "" : null,
      role: recap?.getAttribute("role") ?? null,
      liens: recap ? [...recap.querySelectorAll("a[data-lien-du-refus]")].map((a) => a.getAttribute("data-lien-du-refus")) : [],
      fautifs,
      focus: actif?.getAttribute("name") ?? actif?.tagName ?? null,
      focusAuMilieu: ra ? ra.top >= 0 && ra.bottom <= innerHeight && ra.height > 0 : false,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

/** Le rouge des refus (le rouge 400 de la charte, #f87171), lu dans le cadre du champ. */
const estRouge = (couleur: string | null) => {
  const m = couleur?.match(/\d+/g)?.map(Number);
  return !!m && m[0]! > 200 && m[1]! < 150 && m[2]! < 150;
};

/** La carte de la commande exceptionnelle veut une réponse : on la refuse. */
async function repondreALaCommande(p: Page): Promise<boolean> {
  const refuser = p.getByRole("button", { name: /^Refuser$/ }).last();
  if (await refuser.isVisible().catch(() => false)) {
    await refuser.click();
    await p.waitForTimeout(400);
    return true;
  }
  return false;
}

async function allerAValider(p: Page, telephone: boolean) {
  for (let k = 0; k < 24; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) return;
    if (telephone && (await repondreALaCommande(p))) continue;
    await p
      .getByRole("button", { name: telephone ? /^Continuer/ : /^Suivant/ })
      .last()
      .click();
    await p.waitForTimeout(300);
  }
}

/** Glisse un prix « périmé » avant le vrai champ : le serveur le lira, la feuille ne le voit pas. */
const forgerUnPrix = (p: Page, valeur: string) =>
  p.evaluate((valeur) => {
    const f = document.querySelector<HTMLFormElement>("form[data-debut-d-etape]")!;
    const cache = document.createElement("input");
    cache.type = "hidden";
    cache.name = "price";
    cache.value = valeur;
    cache.dataset.forge = "";
    f.prepend(cache);
  }, valeur);
const retirerLaForge = (p: Page) => p.evaluate(() => document.querySelector("[data-forge]")?.remove());

async function valider(p: Page) {
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  await p.waitForTimeout(500);
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
}

describe("une décision refusée dit pourquoi, et où", () => {
  it("à 1280 : récapitulatif, champ marqué, volet rouvert, focus ; corrigé, puis refus du serveur, puis envoi", async () => {
    const p = await ordiNova.newPage();
    await auCourrierSurOrdinateur(p, urlNova);
    const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await p.waitForTimeout(1_500);
    }
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
    await p.waitForTimeout(400);

    // Un budget négatif à l'étape « Budgéter », son volet REPLIÉ, puis le prix vidé.
    await p.getByRole("button", { name: /^Budgéter/ }).first().click();
    await p.waitForTimeout(300);
    await p.locator('input[name="marketingBudget"]').fill("-5");
    await p.evaluate(() => {
      document.querySelector('input[name="marketingBudget"]')!.closest("details")!.open = false;
    });
    await p.getByRole("button", { name: /^Vendre/ }).first().click();
    await p.waitForTimeout(300);
    await p.locator('input[name="price"]').fill("");
    await allerAValider(p, false);
    await valider(p);
    await p.waitForTimeout(700);

    let r = await lireRefus(p);
    expect(r.role).toBe("alert");
    expect(r.recap).toMatch(/^2 décisions ne passent pas/);
    expect(r.liens).toEqual(["price", "marketingBudget"]);
    expect(r.recap).toContain("Prix de vente : la case est vide. Saisissez au moins 1 €.");
    expect(r.recap).toMatch(/Budget marketing : −5 € est sous le minimum accepté\. Minimum accepté : 0 €\./);
    // Le premier champ fautif a le focus, au milieu de l'écran, sur son étape.
    expect(r.focus).toBe("price");
    expect(r.focusAuMilieu).toBe(true);
    const prix = r.fautifs.find((f) => f.nom === "price")!;
    expect(prix.visible).toBe(true);
    expect(prix.message).toBe("La case est vide. Saisissez au moins 1 €.");
    expect(estRouge(prix.cadre), `cadre ${prix.cadre}`).toBe(true);
    expect(r.deCote).toBe(0);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/e2e-refus-navigateur-1280.png` });

    // Le lien du récapitulatif mène au budget : son étape s'affiche, son volet se rouvre.
    await p.locator('[data-lien-du-refus="marketingBudget"]').click();
    await p.waitForTimeout(500);
    r = await lireRefus(p);
    expect(r.focus).toBe("marketingBudget");
    expect(r.focusAuMilieu).toBe(true);
    expect(
      await p.evaluate(() => document.querySelector('input[name="marketingBudget"]')!.closest("details")!.open),
    ).toBe(true);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/e2e-refus-replie-1280.png` });

    // Corrigé à la frappe : le refus du budget s'en va, celui du prix reste.
    await p.locator('input[name="marketingBudget"]').fill("8000");
    await p.waitForTimeout(300);
    r = await lireRefus(p);
    expect(r.fautifs.map((f) => f.nom)).toEqual(["price"]);
    expect(r.recap).toMatch(/^Une décision ne passe pas/);
    await p.locator('[data-lien-du-refus="price"]').click();
    await p.waitForTimeout(400);
    await p.locator('input[name="price"]').fill("85");
    await p.waitForTimeout(300);
    r = await lireRefus(p);
    expect(r.recap).toBeNull();
    expect(r.fautifs).toEqual([]);

    // LE REFUS DU SERVEUR : un prix « périmé » de 20 000 €, rattaché au champ du prix.
    await forgerUnPrix(p, "20000");
    await allerAValider(p, false);
    await valider(p);
    await p.locator("[data-recapitulatif-des-erreurs]").waitFor({ timeout: 60_000 });
    await p.waitForTimeout(600);
    r = await lireRefus(p);
    expect(r.recap?.replace(/[  ]/g, " ")).toContain(
      "Prix de vente : 20 000 € dépasse le maximum accepté. Maximum accepté : 10 000 €.",
    );
    expect(r.recap).not.toMatch(/invalides|Invalid|expected/i);
    expect(r.liens).toEqual(["price"]);
    expect(r.fautifs.map((f) => f.nom)).toEqual(["price"]);
    expect(r.focus).toBe("price");
    expect(r.focusAuMilieu).toBe(true);
    expect(p.url()).not.toMatch(/simule/);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/e2e-refus-serveur-1280.png` });

    // Corrigé (le prix touché, la forge retirée) : le refus tombe, l'envoi passe.
    await retirerLaForge(p);
    await p.locator('input[name="price"]').fill("86");
    await p.waitForTimeout(300);
    expect((await lireRefus(p)).fautifs).toEqual([]);
    await allerAValider(p, false);
    await valider(p);
    await p.waitForURL(/simule/, { timeout: 180_000 });
    await p.close();
  }, 300_000);

  it("à 390 : la carte refusée garde son champ ; à l'envoi, la carte du champ s'ouvre ; refus du serveur ; puis envoi", async () => {
    const tel = await telephone(ordiAugustin);
    const t = await tel.newPage();
    await auCourrierSurTelephone(t, urlAugustin);
    // Ouvrir le courrier et passer jusqu'à la feuille de décision.
    for (let k = 0; k < 16; k++) {
      if (await t.locator('input[name="price"]').first().isVisible().catch(() => false)) break;
      const o = t.getByRole("button", { name: /Ouvrir le courrier/ }).first();
      if (await o.isVisible().catch(() => false)) {
        await o.click();
        await t.waitForTimeout(1_500);
        continue;
      }
      if (await repondreALaCommande(t)) continue;
      await t.getByRole("button", { name: /^(Continuer|Analyser|Décider|Prendre)/ }).last().click().catch(() => {});
      await t.waitForTimeout(700);
    }
    const prix = t.locator('input[name="price"]').first();
    await expect(prix.isVisible()).resolves.toBe(true);

    // « Continuer » sur un prix vide : la carte reste, le champ se marque et garde le focus.
    await prix.fill("");
    await t.getByRole("button", { name: /^Continuer/ }).last().click();
    await t.waitForTimeout(500);
    let r = await lireRefus(t);
    expect(r.recap, "pas de récapitulatif pour une carte").toBeNull();
    expect(r.fautifs.map((f) => f.nom)).toEqual(["price"]);
    expect(r.fautifs[0]!.message).toMatch(/^La case est vide\. Saisissez au moins 1 €\./);
    expect(r.focus).toBe("price");
    expect(r.deCote).toBe(0);
    if (CAPTURES) await t.screenshot({ path: `${CAPTURES}/e2e-refus-carte-390.png` });
    await prix.fill("24");
    await t.waitForTimeout(300);
    expect((await lireRefus(t)).fautifs).toEqual([]);

    // Jusqu'au récapitulatif ; puis le prix (sur sa carte, masquée) se vide :
    // une saisie restaurée d'un brouillon, par exemple.
    await allerAValider(t, true);
    await t.evaluate(() => {
      const champ = document.querySelector<HTMLInputElement>('input[name="price"]')!;
      const poser = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      poser.call(champ, "");
      champ.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await valider(t);
    await t.waitForTimeout(800);
    r = await lireRefus(t);
    expect(r.role).toBe("alert");
    expect(r.recap).toMatch(/^Une décision ne passe pas/);
    expect(r.recap).toContain("Ticket moyen : la case est vide.");
    expect(r.focus).toBe("price");
    expect(r.fautifs[0]!.visible, "la carte du prix ne s'est pas ouverte").toBe(true);
    expect(r.focusAuMilieu).toBe(true);
    expect(r.deCote).toBe(0);
    if (CAPTURES) await t.screenshot({ path: `${CAPTURES}/e2e-refus-navigateur-390.png` });
    await prix.fill("24");
    await t.waitForTimeout(300);
    r = await lireRefus(t);
    expect(r.recap).toBeNull();

    // Le refus du serveur, rattaché au prix.
    await forgerUnPrix(t, "20000");
    await allerAValider(t, true);
    await valider(t);
    await t.locator("[data-recapitulatif-des-erreurs]").waitFor({ timeout: 60_000 });
    await t.waitForTimeout(800);
    r = await lireRefus(t);
    expect(r.recap?.replace(/[  ]/g, " ")).toContain("Ticket moyen : 20 000 € dépasse le maximum accepté.");
    expect(r.fautifs.map((f) => f.nom)).toEqual(["price"]);
    expect(r.focus).toBe("price");
    expect(r.fautifs[0]!.visible).toBe(true);
    expect(r.deCote).toBe(0);
    if (CAPTURES) await t.screenshot({ path: `${CAPTURES}/e2e-refus-serveur-390.png` });

    await retirerLaForge(t);
    await prix.fill("25");
    await t.waitForTimeout(300);
    expect((await lireRefus(t)).fautifs).toEqual([]);
    await allerAValider(t, true);
    await valider(t);
    await t.waitForURL(/simule/, { timeout: 180_000 });
    await tel.close();
  }, 300_000);
});
