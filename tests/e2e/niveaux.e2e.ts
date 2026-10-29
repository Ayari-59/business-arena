import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { Client } from "pg";

/**
 * LES NIVEAUX, CLAIRS ET COHÉRENTS, dans un navigateur, sur le build de
 * production et sa base.
 *
 *   1. /jouer : sous le choix du niveau, le tableau du niveau choisi (Vous
 *      décidez, Géré pour vous, Au niveau suivant), à 1280 et à 390, pour les
 *      six niveaux (4 à 6 sous licence) ; il change avec le niveau ; le comparatif se déplie sur ordinateur et ne paraît pas
 *      sur téléphone ; un seul bouton plein ; pas de défilement de côté.
 *   2. L'arène, une partie NOVA de niveau 3 créée avant la répartition
 *      d'octobre 2026 (seules ces parties investissent sans embaucher) : la
 *      ligne d'aide du plafond sous le parc machines ; une ligne achetée au-delà de l'équipe est refusée par la
 *      feuille (récapitulatif, case marquée, focus), puis par le serveur sur un
 *      formulaire forgé ; corrigé, le tour se joue. Au tour 2, le courrier qui
 *      appelle l'investissement dit le plafond à son pied.
 *
 * Captures (facultatives) : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const ordinateur = () => navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
const telephone = () =>
  navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" });

/** Le tableau affiché : son niveau, ses trois blocs, et ce qui déborde. */
const lireTableau = (p: Page) =>
  p.evaluate(() => {
    const t = document.querySelector<HTMLElement>("[data-tableau-du-niveau]");
    const bloc = (cle: string) =>
      [...(t?.querySelectorAll(`[data-bloc="${cle}"] li`) ?? [])].map((li) => li.lastElementChild?.textContent?.replace(/\s+/g, " ").trim() ?? "");
    const titres = [...(t?.querySelectorAll("h3") ?? [])].map((h) => h.textContent?.trim());
    const comparatif = document.querySelector<HTMLElement>("[data-comparatif-des-niveaux]");
    const pleins = [...document.querySelectorAll<HTMLElement>(".bouton-plein")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
    });
    const r = t?.getBoundingClientRect();
    return {
      niveau: t?.dataset.tableauDuNiveau ?? null,
      titres,
      decidez: bloc("decidez"),
      gere: bloc("gere"),
      suivant: bloc("suivant"),
      comparatifVisible: comparatif ? comparatif.getBoundingClientRect().height > 0 : false,
      pleins: pleins.map((e) => e.textContent?.trim()),
      sort: r ? r.right > innerWidth + 0.5 || r.left < -0.5 : true,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

async function choisirLeNiveau(p: Page, n: number) {
  await p.getByRole("button", { name: new RegExp(`^Niveau ${n} `) }).click();
  await p.waitForTimeout(250);
}

async function capturerLeTableau(p: Page, nom: string) {
  if (!CAPTURES) return;
  const t = p.locator("[data-tableau-du-niveau]");
  await t.scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${CAPTURES}/${nom}.png` });
}

describe("/jouer : le tableau des niveaux", () => {
  for (const largeur of [1280, 390] as const) {
    it(`à ${largeur} : les six niveaux, l'un après l'autre, le tableau suit le curseur`, async () => {
      const ctx: BrowserContext = largeur === 1280 ? await ordinateur() : await telephone();
      const p = await ctx.newPage();
      await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });

      // Niveau 1 à l'ouverture, comme la page le conseille (audit UX du 29 octobre 2026, P1-8) :
      // le prix, la production et le marketing ; le budget qualité au suivant.
      let t = await lireTableau(p);
      expect(t.niveau).toBe("1");
      expect(t.titres).toEqual(["Vous décidez", "Géré pour vous", "Au niveau suivant"]);
      expect(t.decidez).toEqual([
        "Le prix, la production et le marketing",
        "Le fournisseur, les commandes exceptionnelles et les études, selon l'entreprise",
      ]);
      expect(t.gere).toContain("La qualité, tenue au niveau du marché");
      expect(t.suivant).toContain("Le budget qualité");
      expect(t.pleins).toEqual(["Lancer la partie"]);
      expect(t.sort).toBe(false);
      expect(t.deCote).toBe(0);
      expect(t.comparatifVisible).toBe(largeur === 1280);
      await capturerLeTableau(p, `jouer-niveau-1-${largeur}`);

      // Il change avec le niveau : 2, puis 3.
      await choisirLeNiveau(p, 2);
      expect((await lireTableau(p)).niveau).toBe("2");
      await capturerLeTableau(p, `jouer-niveau-2-${largeur}`);
      // Niveau 3 : l'équipe et les créances ; l'emprunt et l'investissement au suivant.
      await choisirLeNiveau(p, 3);
      t = await lireTableau(p);
      expect(t.niveau).toBe("3");
      expect(t.decidez).toContain("Les embauches, la formation et les salaires");
      expect(t.decidez).toContain("Les créances clients : escompte et affacturage");
      expect(t.gere).toContain("La banque : le découvert couvre un manque, sans emprunt à décider");
      expect(t.suivant).toEqual(
        expect.arrayContaining(["L'emprunt et l'apport des associés", "L'investissement en capacité", "L'assurance"]),
      );
      expect(t.deCote).toBe(0);
      await capturerLeTableau(p, `jouer-niveau-3-${largeur}`);

      if (largeur === 1280) {
        await p.getByRole("button", { name: /^Comparer les 6 niveaux/ }).click();
        await p.waitForTimeout(250);
        const comp = await p.evaluate(() => {
          const tab = document.querySelector<HTMLTableElement>("[data-tableau-comparatif]");
          const r = tab?.getBoundingClientRect();
          const ligne = (nom: string) =>
            [...(tab?.querySelectorAll("tbody tr") ?? [])]
              .find((tr) => tr.querySelector("th")?.textContent?.trim() === nom)
              ?.querySelectorAll("td")
              .length ?? 0;
          return {
            colonnes: tab?.querySelectorAll("thead th").length ?? 0,
            lignes: tab?.querySelectorAll("tbody tr").length ?? 0,
            verrous: tab?.querySelectorAll("thead svg").length ?? 0,
            investissement: ligne("Investissement"),
            sort: r ? r.right > innerWidth : true,
          };
        });
        expect(comp.colonnes).toBe(7);
        expect(comp.lignes).toBeGreaterThan(10);
        expect(comp.investissement).toBe(6);
        // Les niveaux 4 à 6 sous licence restent visibles, marqués.
        expect(comp.verrous).toBe(3);
        expect(comp.sort).toBe(false);
        if (CAPTURES) {
          await p.locator("[data-comparatif-des-niveaux]").scrollIntoViewIfNeeded();
          await p.screenshot({ path: `${CAPTURES}/jouer-comparatif-1280.png`, fullPage: false });
        }
      }

      // Sans licence, le niveau 4 ne se choisit pas ; sous licence, les niveaux 4 à 6.
      await enseignantSousLicence(ctx);
      await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
      await choisirLeNiveau(p, 4);
      t = await lireTableau(p);
      expect(t.niveau).toBe("4");
      expect(t.decidez).toEqual(
        expect.arrayContaining(["L'emprunt et l'apport des associés", "L'investissement en capacité", "L'assurance"]),
      );
      expect(t.decidez).not.toContain("L'investissement, à hauteur de votre équipe");
      expect(t.deCote).toBe(0);
      await capturerLeTableau(p, `jouer-niveau-4-${largeur}`);
      await choisirLeNiveau(p, 5);
      t = await lireTableau(p);
      expect(t.niveau).toBe("5");
      expect(t.decidez).toEqual(expect.arrayContaining(["La recherche et développement", "L'engagement RSE"]));
      await capturerLeTableau(p, `jouer-niveau-5-${largeur}`);
      await choisirLeNiveau(p, 6);
      t = await lireTableau(p);
      expect(t.niveau).toBe("6");
      expect(t.decidez).toContain("Le dividende versé aux associés");
      expect(t.gere).toEqual([]);
      expect(t.deCote).toBe(0);
      await capturerLeTableau(p, `jouer-niveau-6-${largeur}`);
      await ctx.close();
    }, 120_000);
  }
});

/** L'état des refus, lu dans la page (comme `courrier-et-refus`). */
const lireRefus = (p: Page) =>
  p.evaluate(() => {
    const recap = document.querySelector<HTMLElement>("[data-recapitulatif-des-erreurs]");
    const fautifs = [...document.querySelectorAll<HTMLElement>('form [aria-invalid="true"]')].map((e) => {
      const ids = (e.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
      return {
        nom: e.getAttribute("name"),
        message: ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" "),
        visible: e.getBoundingClientRect().height > 0,
      };
    });
    const actif = document.activeElement as HTMLElement | null;
    const ra = actif?.getBoundingClientRect();
    return {
      recap: recap ? (recap.textContent?.replace(/\s+/g, " ").trim() ?? "") : null,
      liens: recap ? [...recap.querySelectorAll("a[data-lien-du-refus]")].map((a) => a.getAttribute("data-lien-du-refus")) : [],
      fautifs,
      focus: actif?.getAttribute("name") ?? null,
      focusVisible: ra ? ra.top >= 0 && ra.bottom <= innerHeight && ra.height > 0 : false,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

const espaces = (s: string | null | undefined) => (s ?? "").replace(/[  ]/g, " ");

async function allerAValider(p: Page) {
  for (let k = 0; k < 24; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) return;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(300);
  }
}

async function valider(p: Page) {
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  await p.waitForTimeout(500);
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
}

/**
 * Une partie créée AVANT la répartition d'octobre 2026 : son profil ne figeait
 * que le niveau, et elle relit les leviers de son époque (l'investissement sans
 * les embauches aux niveaux 1 à 3). C'est là que le plafond s'applique encore.
 */
async function commeAvantLaRepartition(url: string) {
  const gameId = url.split("/arena/")[1]!.split(/[?#/]/)[0]!;
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const r = await c.query(
      // Le profil ne fige que le niveau, et le calendrier des histoires est celui
      // de l'époque : au niveau 3, le signe et la fenêtre de taux au tour 2.
      `update games set difficulty_profile = jsonb_set(difficulty_profile, '{difficulty}',
         (difficulty_profile->'difficulty') - 'decisions'),
         scenario_snapshot = jsonb_set(scenario_snapshot, '{scriptedEvents}',
           (scenario_snapshot->'scriptedEvents') ||
           '[{"round":2,"eventCode":"nova_inv_signal"},{"round":2,"eventCode":"nova_inv_taux"},{"round":3,"eventCode":"nova_inv_grand_compte"}]'::jsonb)
       where id = $1
       returning difficulty_profile->'difficulty' as d`,
      [gameId],
    );
    if (r.rowCount !== 1) throw new Error(`partie ${gameId} introuvable`);
    expect(r.rows[0].d.decisions).toBeUndefined();
  } finally {
    await c.end();
  }
}

describe("l'arène, une partie de niveau 3 d'avant la répartition : le plafond d'investissement", () => {
  it("à 1280 : l'aide sous le parc, le refus de la feuille, celui du serveur, puis l'envoi", async () => {
    const ctx = await ordinateur();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /NOVA/ }).first().click();
    await choisirLeNiveau(p, 3);
    await p.getByRole("button", { name: "Lancer la partie" }).click();
    await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
    if (p.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
    const url = p.url().split("?")[0]!.split("#")[0]!;
    // La page d'arrivée a fini de se servir (elle peut réécrire le profil) avant qu'on le retouche.
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(1_500);
    await commeAvantLaRepartition(url);
    // Une vraie navigation : changer seulement l'ancre ne recharge pas la page.
    await p.goto("about:blank");
    await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
    if (await passer.isVisible().catch(() => false)) {
      await passer.click();
      await p.waitForTimeout(500);
      await p.evaluate(() => (location.hash = "decisions"));
      await p.waitForTimeout(800);
    }
    const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await p.waitForTimeout(1_500);
    }
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
    await p.waitForTimeout(400);

    // L'étape « Financer & investir » : l'aide du plafond, avant toute erreur.
    await p.getByRole("button", { name: /^Financer & investir/ }).first().click();
    await p.waitForTimeout(400);
    const aide = p.locator("[data-aide-du-plafond]");
    await aide.scrollIntoViewIfNeeded();
    expect(espaces(await aide.textContent())).toBe(
      "Jusqu'à 200 enceintes de capacité en plus à ce niveau. La plus petite, Ligne manuelle, en ajoute 1 000 : aucune n'entre sous ce plafond.",
    );
    const achat = p.locator('input[name="equipmentBuy.manual"]');
    expect(await achat.getAttribute("max")).toBe("0");
    expect((await lireRefus(p)).fautifs).toEqual([]);
    if (CAPTURES) {
      await aide.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await p.waitForTimeout(200);
      await p.screenshot({ path: `${CAPTURES}/arene-n3-aide-du-plafond-1280.png` });
    }

    // Une ligne manuelle (1 000) au-delà de la marge (200) : la feuille refuse.
    const MESSAGE =
      "Investissement : votre équipe de 4 personnes fait tourner 7 200 enceintes par tour ; vos machines en font déjà 7 000. Au-delà de 200 enceintes de capacité en plus, une machine resterait à l'arrêt. Les embauches s'ouvrent au niveau 4.";
    await achat.fill("1");
    await p.waitForTimeout(200);
    await allerAValider(p);
    await valider(p);
    await p.waitForTimeout(700);
    let r = await lireRefus(p);
    expect(r.recap).toMatch(/^Une décision ne passe pas/);
    expect(espaces(r.recap)).toContain(MESSAGE);
    expect(r.liens).toEqual(["equipmentBuy.manual"]);
    expect(r.fautifs.map((f) => f.nom)).toEqual(["equipmentBuy.manual"]);
    expect(espaces(r.fautifs[0]!.message)).toBe(MESSAGE);
    expect(r.fautifs[0]!.visible).toBe(true);
    expect(r.focus).toBe("equipmentBuy.manual");
    expect(r.focusVisible).toBe(true);
    expect(r.deCote).toBe(0);
    expect(p.url()).not.toMatch(/simule/);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/arene-n3-refus-feuille-1280.png` });
    if (CAPTURES) {
      await p.locator("[data-recapitulatif-des-erreurs]").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${CAPTURES}/arene-n3-refus-recapitulatif-1280.png` });
    }

    // Corrigé à la frappe : le refus tombe.
    await achat.fill("0");
    await p.waitForTimeout(300);
    r = await lireRefus(p);
    expect(r.recap).toBeNull();
    expect(r.fautifs).toEqual([]);

    // LE SERVEUR : un parc « périmé » glissé avant le vrai, une ligne achetée.
    await p.evaluate(() => {
      const f = document.querySelector<HTMLFormElement>("form[data-debut-d-etape]")!;
      const cache = document.createElement("input");
      cache.type = "hidden";
      cache.name = "equipmentBuyJson";
      cache.value = JSON.stringify([{ typeCode: "manual", quantity: 1 }]);
      cache.dataset.forge = "";
      f.prepend(cache);
    });
    await allerAValider(p);
    await valider(p);
    await p.locator("[data-recapitulatif-des-erreurs]").waitFor({ timeout: 60_000 });
    await p.waitForTimeout(800);
    r = await lireRefus(p);
    expect(espaces(r.recap)).toContain(MESSAGE);
    expect(r.liens).toEqual(["equipmentBuy.manual"]);
    expect(r.fautifs.map((f) => f.nom)).toEqual(["equipmentBuy.manual"]);
    expect(r.focus).toBe("equipmentBuy.manual");
    expect(p.url()).not.toMatch(/simule/);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/arene-n3-refus-serveur-1280.png` });

    // La forge retirée : l'envoi passe, le tour se simule.
    await p.evaluate(() => document.querySelector("[data-forge]")?.remove());
    await achat.fill("0");
    await p.waitForTimeout(300);
    await allerAValider(p);
    await valider(p);
    await p.waitForURL(/simule/, { timeout: 180_000 });

    // Tour 2 : le courrier qui appelle l'investissement (« un signe… ») porte, à
    // son pied, le plafond du tour.
    await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    const passer2 = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
    if (await passer2.isVisible().catch(() => false)) {
      await passer2.click();
      await p.waitForTimeout(500);
      await p.evaluate(() => (location.hash = "decisions"));
      await p.waitForTimeout(800);
    }
    await p.getByRole("button", { name: /Ouvrir le courrier/ }).first().click();
    await p.waitForTimeout(2_000);
    const noteDuCourrier = p.locator("[data-note-d-investissement]");
    await noteDuCourrier.scrollIntoViewIfNeeded();
    expect(espaces(await noteDuCourrier.textContent())).toContain(
      "À ce niveau, sans embauches, on n'investit qu'à hauteur de ce que l'équipe fait tourner. Jusqu'à 200 enceintes de capacité en plus à ce niveau.",
    );
    if (CAPTURES) {
      await noteDuCourrier.evaluate((e) => e.scrollIntoView({ block: "end" }));
      await p.waitForTimeout(300);
      await p.screenshot({ path: `${CAPTURES}/arene-n3-courrier-tour-2-1280.png` });
    }
    await ctx.close();
  }, 300_000);
});

describe("niveau 2 : une crise de trésorerie se traverse sans verrou", () => {
  it("à 1280 : la banque en lecture seule, un tour ruineux, l'alerte sans emprunt exigé, le tour suivant validé", async () => {
    const ctx = await ordinateur();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /NOVA/ }).first().click();
    await choisirLeNiveau(p, 2);
    await p.getByRole("button", { name: "Lancer la partie" }).click();
    await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
    if (p.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
    const url = p.url().split("?")[0]!.split("#")[0]!;

    const auxDecisions = async () => {
      await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
      await p.waitForTimeout(900);
      const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
      if (await passer.isVisible().catch(() => false)) {
        await passer.click();
        await p.waitForTimeout(500);
        await p.evaluate(() => (location.hash = "decisions"));
        await p.waitForTimeout(800);
      }
      const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
      if (await ouvrir.isVisible().catch(() => false)) {
        await ouvrir.click();
        await p.waitForTimeout(1_500);
      }
      const note = p.getByRole("button", { name: /pris note/ }).first();
      if (await note.isVisible().catch(() => false)) await note.click();
      await p.waitForTimeout(400);
    };

    // Tour 1 : ni emprunt ni investissement à l'écran ; la banque se lit, sans champ.
    await auxDecisions();
    expect(await p.locator('input[name="newLoan"]').count()).toBe(0);
    expect(await p.getByRole("button", { name: /^Financer/ }).count()).toBe(0);
    await p.getByRole("button", { name: /^Budgéter/ }).first().click();
    await p.waitForTimeout(400);
    const banque = p.locator("[data-banque-en-lecture]");
    await banque.scrollIntoViewIfNeeded();
    const texteBanque = espaces(await banque.textContent());
    expect(texteBanque).toContain("Découvert autorisé");
    expect(texteBanque).toContain("L'emprunt et l'apport des associés s'ouvrent au niveau 4.");
    if (CAPTURES) {
      await banque.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await p.waitForTimeout(200);
      await p.screenshot({ path: `${CAPTURES}/arene-n2-banque-en-lecture-1280.png` });
    }

    // Un tour ruineux : vendre à perte, produire à plein, dépenser le reste.
    await p.locator('input[name="marketingBudget"]').fill("60000");
    await p.locator('input[name="qualityBudget"]').fill("40000");
    await p.locator('input[name="maintenanceBudget"]').fill("30000");
    await p.getByRole("button", { name: /^Vendre/ }).first().click();
    await p.waitForTimeout(300);
    await p.locator('input[name="price"]').fill("10");
    await p.locator('input[name="productionPlan"]').fill("7000");
    await allerAValider(p);
    await valider(p);
    await p.waitForURL(/simule/, { timeout: 180_000 });

    // Tour 2 : la crise est dite, sans réclamer d'emprunt ; aucun verrou.
    await p.goto(url, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    const alerte = p.getByRole("alert", { name: "Crise de trésorerie" });
    await alerte.waitFor({ timeout: 30_000 });
    const texteAlerte = espaces(await alerte.textContent());
    expect(texteAlerte).toContain("la banque couvre le manque par le découvert");
    expect(texteAlerte).not.toContain("Emprunt, apport des associés, cession");
    if (CAPTURES) {
      await alerte.scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${CAPTURES}/arene-n2-crise-alerte-1280.png` });
    }
    await auxDecisions();
    expect(await p.getByText("Financement de sauvetage exigé").count()).toBe(0);
    await allerAValider(p);
    const bouton = p.getByRole("button", { name: /Valider et simuler/ }).first();
    expect(await bouton.isDisabled()).toBe(false);
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/arene-n2-crise-validation-1280.png` });
    await valider(p);
    await p.waitForURL(/simule/, { timeout: 180_000 });
    if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/arene-n2-crise-tour-simule-1280.png` });
    await ctx.close();
  }, 400_000);
});
