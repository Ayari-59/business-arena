import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * Le texte de la page, insensible à la casse : plusieurs intitulés sont rendus
 * en petites capitales par la feuille (`uppercase`), et `innerText` rend le
 * texte TRANSFORMÉ. Chercher « Résultat estimé » dans « RÉSULTAT ESTIMÉ »
 * échouerait sans que rien ne soit cassé.
 */
const dit = async (p: Page, ...attendus: string[]) => {
  const t = (await texte(p)).toLowerCase();
  for (const a of attendus) expect(t, `« ${a} » absent de la page`).toContain(a.toLowerCase());
};

/**
 * « VOUS DÉCIDEZ, LE MARCHÉ RÉPOND » — LE CHEMIN ENTIER, DANS UN NAVIGATEUR.
 *
 * Trois pièces se rencontrent ici, et leur rencontre ne se voit nulle part
 * ailleurs : la feuille de décision qui calcule l'estimation DANS le navigateur
 * (si un import serveur se glissait dans la chaîne du moteur, la page tomberait
 * ici et seulement ici), l'action serveur qui conserve le compte estimé avec les
 * décisions, et la fin de tour qui remet les deux en face l'un de l'autre.
 *
 * Le parcours : saisir des ventes estimées, voir l'encart changer À LA FRAPPE,
 * valider, retrouver « Vous aviez estimé … le marché a donné … » au rituel,
 * puis le tableau estimé / réel dans les résultats du tour passé.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlArene: string;

/** Les quatre chiffres de l'encart, lus dans la page. */
async function encart(p: Page): Promise<Record<string, string> | null> {
  return p.evaluate(() => {
    const racine = document.querySelector("[data-resultat-estime]");
    if (!racine) return null;
    const out: Record<string, string> = {};
    for (const bloc of racine.querySelectorAll("dl > div")) {
      const dt = bloc.querySelector("dt")?.textContent?.trim();
      const dd = bloc.querySelector("dd")?.textContent?.replace(/\s+/g, " ").trim();
      if (dt && dd) out[dt] = dd;
    }
    return out;
  });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({
    locale: "fr-FR",
    viewport: { width: 1280, height: 900 },
  });
  page = await contexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le résultat estimé, de la saisie au verdict", () => {
  it("une partie solo NOVA démarre et la feuille demande d'abord les ventes estimées", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
    if (page.url().includes("trop=1")) {
      throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
    }
    await page.waitForLoadState("networkidle");
    urlArene = page.url().split("?")[0]!.split("#")[0]!;

    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    // Le champ existe, et il est AVANT le prix dans l'ordre du document.
    const champ = page.locator('input[name^="ventesEstimees."]').first();
    await champ.waitFor({ state: "visible", timeout: 30_000 });
    const ordre = await page.evaluate(() => {
      const estime = document.querySelector('input[name^="ventesEstimees."]');
      const prix = document.querySelector('input[name="price"]');
      if (!estime || !prix) return null;
      return estime.compareDocumentPosition(prix) & Node.DOCUMENT_POSITION_FOLLOWING
        ? "avant"
        : "apres";
    });
    expect(ordre, "les ventes estimées doivent précéder le prix").toBe("avant");
    // LOT P4 : AU PREMIER TOUR, UNE PROPOSITION PLAUSIBLE, MARQUÉE. Le champ part
    // du plan de production que la feuille propose déjà (un chiffre sous les
    // yeux du joueur, rien du moteur), il est marqué « Proposition — à
    // ajuster », et le résultat estimé parle d'emblée.
    await page.waitForTimeout(900);
    const plan = Number(await page.locator('input[name="productionPlan"]').first().inputValue());
    expect(plan, "le plan de production proposé").toBeGreaterThan(0);
    expect(Number(await champ.inputValue())).toBe(Math.round(plan));
    const marque = page.locator("[data-proposition-de-ventes]:visible");
    expect(await marque.count()).toBe(1);
    expect(await marque.innerText()).toMatch(/Proposition — à ajuster/);
    expect(await page.locator('input[name="propositionDeVentes"]').count()).toBe(1);
    const propose = await encart(page);
    expect(propose, "le résultat estimé reste muet au premier tour").not.toBeNull();
    expect(Object.keys(propose!)).toContain("Résultat net");
  }, 180_000);

  it("zéro vente estimée : pas de zéros, une invitation ; une saisie efface la proposition", async () => {
    const champ = page.locator('input[name^="ventesEstimees."]').first();
    await champ.fill("0");
    await page.waitForTimeout(900);
    // Un encart de zéros à côté d'un champ vide est un meuble, pas une information.
    // LOT P7 : le cadran collant reste à sa place, mais n'écrit aucun chiffre ; il
    // invite à estimer et mène au champ.
    expect(await encart(page), "des chiffres sans ventes estimées").toEqual({});
    const cadran = page.locator("[data-resultat-estime]");
    expect(await cadran.innerText()).toContain("Estimez vos ventes pour voir le résultat");
    expect(await cadran.innerText()).not.toMatch(/\d\s?€/);
    expect(await cadran.getByRole("link", { name: /ventes estimées/ }).count()).toBe(1);
    // La saisie a fait de la proposition l'estimation du joueur : plus de
    // marqueur, plus de témoin caché.
    expect(await page.locator("[data-proposition-de-ventes]").count()).toBe(0);
    expect(await page.locator('input[name="propositionDeVentes"]').count()).toBe(0);
  }, 60_000);

  it("l'encart apparaît à la frappe, et change quand l'estimation change", async () => {
    const champ = page.locator('input[name^="ventesEstimees."]').first();
    await champ.fill("1200");
    await page.waitForTimeout(900);
    const premier = await encart(page);
    expect(premier, "l'encart n'est pas apparu").not.toBeNull();
    expect(Object.keys(premier!)).toEqual(
      expect.arrayContaining([
        "Chiffre d'affaires",
        "Résultat net",
        "Trésorerie fin de tour",
        "Stock final",
      ]),
    );
    // Le libellé est sans ambiguïté.
    await dit(page, "Résultat estimé", "selon vos ventes estimées");

    // Deux fois plus de ventes estimées : le chiffre d'affaires estimé monte.
    await champ.fill("2400");
    await page.waitForTimeout(900);
    const second = await encart(page);
    expect(second!["Chiffre d'affaires"]).not.toBe(premier!["Chiffre d'affaires"]);
    const euros = (t: string) => Number(t.replace(/[^\d-]/g, ""));
    expect(euros(second!["Chiffre d'affaires"]!)).toBeGreaterThan(
      euros(premier!["Chiffre d'affaires"]!),
    );

    // Le compte estimé, ligne à ligne, derrière un repli.
    const repli = page.locator("[data-resultat-estime] details").first();
    expect(await repli.count()).toBe(1);
    expect(await repli.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(false);
    await repli.locator("summary").click();
    await page.waitForTimeout(300);
    expect(await page.locator("[data-resultat-estime] table").innerText()).toContain(
      "RÉSULTAT NET",
    );
  }, 180_000);

  it("estimer plus que ce qu'on peut livrer se dit, et pas en rouge", async () => {
    await page.locator('input[name^="ventesEstimees."]').first().fill("40000");
    await page.waitForTimeout(900);
    const bloc = page.locator("[data-resultat-estime]");
    expect(await bloc.innerText()).toContain("Vous ne pourrez livrer que");
    // CHARTE : une estimation n'est pas un résultat. Aucun texte de l'encart ne
    // prend le vert ni le rouge francs.
    const teintes = await bloc.evaluate((racine) => {
      const vus: string[] = [];
      for (const el of racine.querySelectorAll("*")) {
        const c = getComputedStyle(el as Element).color;
        if ((el as HTMLElement).innerText?.trim()) vus.push(c);
      }
      return vus;
    });
    // Le vert (#34d399-ish) et le rouge (#f87171-ish) de la charte ont un canal
    // dominant marqué ; l'encre du marine est quasi neutre.
    const criards = teintes.filter((c) => {
      const [r, g, b] = (c.match(/\d+/g) ?? []).map(Number) as [number, number, number];
      if (r === undefined) return false;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max - min > 60;
    });
    expect(criards, `couleurs de résultat dans l'encart : ${criards.join(", ")}`).toEqual([]);
  }, 120_000);

  it("validé, le rituel dit ce qu'on avait estimé et ce que le marché a donné", async () => {
    await page.locator('input[name^="ventesEstimees."]').first().fill("3000");
    await page.waitForTimeout(600);
    // Parcourir les étapes jusqu'à « Valider et simuler ».
    for (let k = 0; k < 20; k++) {
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page
        .getByRole("button", { name: /^Suivant/ })
        .last()
        .click();
      await page.waitForTimeout(250);
    }
    await page
      .getByRole("button", { name: /Valider et simuler/ })
      .first()
      .click();
    const garder = page.getByRole("button", { name: /Oui, je garde/ });
    if (await garder.count()) await garder.first().click();
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");

    await dit(
      page,
      "le marché a répondu",
      "Vous aviez estimé",
      "le marché a donné",
      "Ventes estimées",
    );
    expect(await page.locator("[data-ecart-d-estimation]").count()).toBe(1);
  }, 240_000);

  it("dans les résultats du tour passé, le tableau estimé / réel", async () => {
    await page.goto(`${urlArene}#dernier-resultat`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await dit(page, "Votre estimation, et ce que le marché a donné");
    const tableau = page.locator("section[aria-label^='Ce que vous aviez estimé'] table").first();
    await tableau.waitFor({ state: "attached", timeout: 30_000 });
    // Les intitulés de colonne sont rendus en petites capitales par la feuille,
    // comme ceux des comptes : on compare sans la casse.
    const lignes = (await tableau.innerText()).replace(/\s+/g, " ").toLowerCase();
    for (const poste of ["Ventes", "Chiffre d'affaires", "Résultat net", "Trésorerie nette"]) {
      expect(lignes, `${poste} absent du tableau`).toContain(poste.toLowerCase());
    }
    for (const colonne of ["Estimé", "Réel", "Écart"]) {
      expect(lignes, `colonne ${colonne} absente`).toContain(colonne.toLowerCase());
    }
    // L'écart est SIGNÉ : un vrai moins, ou un plus.
    expect(lignes).toMatch(/[+−]\s?\d/);
  }, 180_000);

  it("sur téléphone, la ligne compacte se lit là où elle sert, sans seconde barre fixe", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await contexte.storageState(),
    });
    const q = await tel.newPage();
    await q.goto(urlArene, { waitUntil: "domcontentloaded" });
    await q.waitForLoadState("networkidle");
    const passer = q.getByRole("button", { name: /Passer au /i }).first();
    if (await passer.isVisible().catch(() => false)) {
      await passer.click();
      await q.waitForTimeout(800);
    }
    await q.evaluate(() => {
      location.hash = "decisions";
    });
    await q.waitForTimeout(1_500);
    // En parcours, une décision par écran : la commande exceptionnelle ouvre le
    // tour, les ventes estimées viennent juste après.
    const champ = q.locator('input[name^="ventesEstimees."]:visible').first();
    for (let k = 0; k < 6 && (await champ.count()) === 0; k += 1) {
      const accepter = q.getByRole("button", { name: "Accepter", exact: true });
      if ((await accepter.count()) && (await accepter.first().isVisible())) {
        await accepter.first().click();
      } else {
        await q
          .getByRole("button", { name: /^(Continuer|Suivant)/ })
          .last()
          .click();
      }
      await q.waitForTimeout(500);
    }
    await champ.waitFor({ state: "visible", timeout: 30_000 });
    await champ.fill("2500");
    await q.waitForTimeout(900);
    const ligne = q.locator("[data-ligne-estimee]:visible");
    expect(await ligne.count()).toBe(1);
    // LOT P7 : la ligne vit dans la barre du parcours, « Rés. estimé … ».
    expect(await ligne.innerText()).toMatch(/Rés\. estimé\s+−?[\d\s\u202f\u00a0]+€/);
    // LOT 3A : une seule barre fixe au bas de l'écran, et la ligne n'en fait
    // pas une seconde — elle vit dans le flux de la carte (mesuré : posée dans
    // le pied fixe, elle coûtait 65 px à CHAQUE carte, et quatre cartes déjà
    // serrées passaient sous le pied).
    const barres = await q.evaluate(() => {
      const H = innerHeight;
      let n = 0;
      let dansLaBarre = false;
      for (const el of document.querySelectorAll("body *")) {
        const s = getComputedStyle(el);
        if (s.position !== "fixed") continue;
        const r = el.getBoundingClientRect();
        if (r.height < 8 || r.width < 200 || r.bottom < H - 24 || r.top < H / 2) continue;
        n += 1;
        if (el.querySelector("[data-ligne-estimee]")) dansLaBarre = true;
      }
      return { n, dansLaBarre };
    });
    expect(barres.n, "plus d'une barre fixe au bas de l'écran").toBeLessThanOrEqual(1);
    expect(barres.dansLaBarre, "la ligne estimée alourdit la barre fixe").toBe(false);
    // Et la carte entière tient sur l'écran, ligne comprise. LOT P7 : la ligne
    // est dans la barre, hors du formulaire ; on mesure la feuille du champ (la
    // garde ne se desserre pas : un formulaire introuvable la fait échouer).
    const debordement = await q.evaluate(() => {
      const carte = document.querySelector('input[name^="ventesEstimees."]')?.closest("form");
      return carte ? Math.round(carte.getBoundingClientRect().height - innerHeight) : 1;
    });
    expect(debordement, "la carte des ventes estimées déborde de l'écran").toBeLessThan(0);
    await tel.close();
  }, 180_000);
});
