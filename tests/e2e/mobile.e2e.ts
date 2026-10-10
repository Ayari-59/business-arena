import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  devices,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { COULEUR_DU_PAPIER } from "../../src/config/themes";

/**
 * L'APPLICATION, À LA MAIN D'UN TÉLÉPHONE.
 *
 * Mesuré sur un iPhone simulé (390 px, écran tactile) pendant une vraie partie :
 * l'invitation à installer couvrait quarante pour cent de l'écran en plein jeu,
 * treize commandes sur seize étaient sous 44 px, et un tiers du texte était en
 * 12 px. Rien de tout cela ne se voit depuis les tests de composants : il
 * faut un navigateur, une largeur et un doigt.
 *
 * Les gardes lisent ce qui est VISIBLE et mesuré, pas ce que la source promet.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({
    ...devices["iPhone 13"],
    locale: "fr-FR",
  });
  page = await contexte.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});


/**
 * LA HAUTEUR QU'IL FAUT À UNE CARTE : le bas de son contenu (hors barres fixes, hors tiroirs
 * fermés), plus la place du pied de page. Une carte tient sur un écran quand elle est
 * inférieure ou égale à la hauteur de l'écran. La règle est celle-là, et elle est mesurée.
 */
async function hauteurUtile(p: Page): Promise<number> {
  return p.evaluate(() => {
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      const st = getComputedStyle(e);
      return r.width > 1 && r.height > 1 && st.visibility !== "hidden" && st.display !== "none";
    };
    const fixe = (e: Element) => {
      for (let x: Element | null = e; x && x !== document.body; x = x.parentElement) {
        const pos = getComputedStyle(x).position;
        if (pos === "fixed" || pos === "sticky") return true;
      }
      return false;
    };
    // L'ARDOISE DU DIRIGEANT est au-dessus du parcours : chaque carte remonte à
    // son début, sous la barre et l'ardoise repliée (`--haut-collant`), et
    // l'ardoise sort de l'écran. Ce qui doit tenir sur l'écran, c'est donc la
    // carte comptée depuis là, et non depuis le haut de la page.
    const debut = document.querySelector("[data-debut-d-etape]");
    const collant = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--haut-collant"),
    );
    const decalage =
      debut && document.getElementById("ardoise-du-dirigeant") && collant > 0
        ? Math.max(0, debut.getBoundingClientRect().top + window.scrollY - collant)
        : 0;
    let bas = 0;
    for (const e of document.querySelectorAll("main *")) {
      if (!visible(e) || fixe(e)) continue;
      if (e.closest("details:not([open])") && !e.closest("summary")) continue;
      const feuille =
        (e.children.length === 0 && (e.textContent || "").trim().length > 0) ||
        ["INPUT", "SELECT", "TEXTAREA", "svg"].includes(e.tagName);
      if (feuille) bas = Math.max(bas, e.getBoundingClientRect().bottom + window.scrollY);
    }
    // LE PIED FIXE SE MESURE, il ne se suppose pas : il valait « environ
    // 76 px » tant qu'il ne portait que ses boutons, et une constante jugerait
    // qu'une carte tient alors qu'elle passe sous un pied devenu plus haut.
    // Repli sur 84 px quand aucun pied n'est trouvé (8 px d'air compris).
    let pied = 0;
    for (const e of document.querySelectorAll("body *")) {
      if (getComputedStyle(e).position !== "fixed") continue;
      const r = e.getBoundingClientRect();
      if (r.height < 8 || r.width < 200) continue;
      if (r.bottom < innerHeight - 24 || r.top < innerHeight / 2) continue;
      pied = Math.max(pied, r.height);
    }
    return Math.round(bas - decalage + (pied > 0 ? pied + 8 : 84));
  });
}

/** Les commandes visibles dont la taille tactile est sous le seuil. */
async function commandesTropPetites(p: Page) {
  return p.evaluate(() => {
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return (
        r.width > 1 &&
        r.height > 1 &&
        s.visibility !== "hidden" &&
        s.display !== "none"
      );
    };
    return [
      ...document.querySelectorAll(
        "button, summary, [role=button], [role=tab], a.bouton",
      ),
    ]
      .filter(visible)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          nom: (
            (e as HTMLElement).innerText ||
            e.getAttribute("aria-label") ||
            e.tagName
          )
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 40),
          l: Math.round(r.width),
          h: Math.round(r.height),
        };
      })
      .filter((c) => c.h < 44 || c.l < 44);
  });
}

describe("sur la vitrine, au toucher", () => {
  // LOT P4 : l'invitation recouvrait la vitrine dès l'arrivée. Elle attend
  // qu'une partie ait été jouée sur l'appareil (le témoin que pose l'arène).
  it("à la première visite, aucune invitation à installer", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.removeItem("partie-jouee-le");
      localStorage.removeItem("install-prompt-ferme-le");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_200);
    expect(
      await page.locator("[role=dialog][aria-label=\"Installer l'application\"]").count(),
      "l'invitation est rendue avant toute partie jouée",
    ).toBe(0);
  });

  it("après une partie, elle tient sur une ligne et ne couvre jamais un bouton", async () => {
    await page.evaluate(() => {
      localStorage.setItem("partie-jouee-le", String(Date.now()));
      localStorage.removeItem("install-prompt-ferme-le");
    });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const barre = page.locator("[role=dialog][aria-label=\"Installer l'application\"]");
    await barre.waitFor({ state: "attached", timeout: 10_000 });
    const hauteurEcran = page.viewportSize()!.height;
    const hauteurPage = await page.evaluate(() => document.body.scrollHeight);
    let montree = 0;
    for (let y = 0; y < hauteurPage; y += 300) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(450);
      const etat = await page.evaluate(() => {
        const b = document.querySelector<HTMLElement>(
          "[role=dialog][aria-label=\"Installer l'application\"]",
        )!;
        const r = b.getBoundingClientRect();
        if (b.hasAttribute("data-cede") || r.top >= innerHeight) return { montree: false, hauteur: 0, sous: [] };
        const sous = [
          ...document.querySelectorAll<HTMLElement>(
            "button, [role=button], .bouton-plein, .bouton-filet",
          ),
        ]
          .filter((e) => !b.contains(e))
          .filter((e) => {
            const q = e.getBoundingClientRect();
            const s = getComputedStyle(e);
            return (
              q.width > 1 && q.height > 1 && s.visibility !== "hidden" &&
              q.bottom > r.top && q.top < r.bottom && q.right > r.left && q.left < r.right
            );
          })
          .map((e) => (e.innerText || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 30));
        return { montree: true, hauteur: r.height, sous };
      });
      if (!etat.montree) continue;
      montree += 1;
      // Une ligne : bien moins d'un huitième de l'écran. Elle en couvrait 40 %.
      expect(etat.hauteur, `barre d'installation de ${etat.hauteur} px`).toBeLessThan(
        hauteurEcran / 8,
      );
      expect(etat.sous, `à ${y} px, l'invitation couvre : ${etat.sous.join(", ")}`).toEqual([]);
    }
    expect(montree, "l'invitation ne se montre jamais, même après une partie").toBeGreaterThan(0);
  }, 120_000);

  it("la barre du haut se touche du premier coup", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const nav = await page.evaluate(() => {
      const barre = document.querySelector("header")!;
      return [...barre.querySelectorAll("a[href], button")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 1 && r.height > 1;
        })
        .map((e) => {
          const r = e.getBoundingClientRect();
          return {
            nom: (
              e.getAttribute("aria-label") ||
              (e as HTMLElement).innerText ||
              ""
            ).trim(),
            l: Math.round(r.width),
            h: Math.round(r.height),
          };
        })
        .filter((c) => c.h < 44 || c.l < 44);
    });
    expect(
      nav,
      `commandes de la barre sous 44 px : ${JSON.stringify(nav)}`,
    ).toEqual([]);
  });
});

describe("la couleur autour de la page", () => {
  it("la barre d'état prolonge le papier", async () => {
    await page.goto(`${BASE}/guide`, { waitUntil: "domcontentloaded" });
    const couleurs = await page
      .locator('meta[name="theme-color"]')
      .evaluateAll((ms) => ms.map((m) => m.getAttribute("content")));
    // Une seule balise : posée par le serveur, elle ne se double plus d'une
    // seconde écrite par une amorce.
    expect(couleurs).toEqual([COULEUR_DU_PAPIER]);
  });

  it("le manifeste prend les mêmes couleurs, et plus celles d'avant la charte", async () => {
    const reponse = await page.request.get(`${BASE}/manifest.webmanifest`);
    expect(reponse.status()).toBe(200);
    const m = await reponse.json();
    expect(m.theme_color).toBe(m.background_color);
    expect(m.theme_color).toBe(COULEUR_DU_PAPIER);
    expect(m.display).toBe("standalone");
    expect(
      m.icons.some((i: { purpose?: string }) => i.purpose === "maskable"),
    ).toBe(true);
  });

  it("la page déclare viewport-fit=cover pour aller jusqu'aux bords", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toContain("viewport-fit=cover");
  });
});

describe("pendant une partie", () => {
  beforeAll(async () => {
    // Une partie solo, comme le fait un élève : choisir un métier, lancer.
    await page.addInitScript(() =>
      localStorage.removeItem("install-prompt-ferme-le"),
    );
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /NOVA/ }).click();
    // Ces parcours testent le niveau 3 (qualité, financement…) : on le choisit, sans dépendre du niveau de départ.
    await page.getByRole("button", { name: /^Niveau 3/ }).click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    // Le serveur plafonne les parties par adresse et par heure : après plusieurs
    // passes de la suite sur la même base, l'écran de lancement renvoie ici. Le
    // dire vaut mieux qu'une minute d'attente suivie d'un délai dépassé.
    if (page.url().includes("trop=1")) {
      throw new Error(
        "Plafond de parties par heure atteint sur cette base : attendre une heure, ou libérer le compteur (games.creator_ip).",
      );
    }
    await page.waitForLoadState("networkidle");
    await page.locator("[data-ecran-de-jeu]").waitFor({ state: "visible" });
  }, 120_000);

  it("rien ne se pose par-dessus la partie : pas d'invitation à installer", async () => {
    await page.waitForTimeout(800);
    expect(
      await page
        .getByRole("dialog", { name: "Installer l'application" })
        .count(),
    ).toBe(0);
  });

  it("toute commande de l'écran de jeu fait 44 px au moins", async () => {
    const petites = await commandesTropPetites(page);
    expect(
      petites,
      `commandes sous 44 px : ${JSON.stringify(petites)}`,
    ).toEqual([]);
  });

  it("la barre du site cède la place à la barre de la partie", async () => {
    // Deux barres se doubleraient, et la première ne dit rien de la partie.
    expect(
      await page
        .locator(
          "body > header, header:has(nav[aria-label='Navigation principale'])",
        )
        .first()
        .isVisible(),
    ).toBe(false);
    await page
      .getByRole("button", { name: "Menu de la partie" })
      .waitFor({ state: "visible" });
    await page
      .getByText(/Tour 1(?:\/| sur )6/)
      .first()
      .waitFor({ state: "visible" });
    await page
      .getByRole("link", { name: "Quitter la partie" })
      .waitFor({ state: "visible" });
  });

  it("le nom de l'équipe n'est pas répété en grand sous la barre", async () => {
    // Il reste dans le document, pour une synthèse vocale, mais son conteneur est
    // réduit à un point : il n'occupe rien à l'écran.
    const h1 = page.locator("h1").first();
    expect(await h1.count()).toBe(1);
    const reduit = await h1.evaluate((el) => {
      for (
        let e: Element | null = el;
        e && e !== document.body;
        e = e.parentElement
      ) {
        const r = e.getBoundingClientRect();
        if (r.width <= 1 && r.height <= 1) return true;
      }
      return false;
    });
    expect(reduit, "le titre de l'équipe est encore affiché en grand").toBe(
      true,
    );
  });

  /** Le bouton du pied de page qui fait avancer le parcours, hors décisions. */
  const suite = () =>
    page.getByRole("button", { name: /^(Continuer|Analyser|Décider)/ }).last();

  /** Un parcours revient toujours au point de départ avant un test qui en dépend. */
  async function versLaPremiereCarte() {
    // Un hash identique ne déclenche rien : on passe par un autre pour que le parcours
    // revienne bien à sa première carte.
    await page.evaluate(() => (window.location.hash = "retour"));
    await page.evaluate(() => (window.location.hash = "situation"));
    await page.waitForTimeout(300);
  }

  /** Avance, un toucher à la fois, jusqu'à la première carte de décision. */
  async function versLesDecisions() {
    // Par le début : le formulaire se remonte, et repart de sa première carte.
    await versLaPremiereCarte();
    await page.evaluate(() => (window.location.hash = "decisions"));
    await page.locator("[data-titre-etape]").waitFor({ state: "visible" });
  }

  /** Le titre de l'étape, tel qu'il se lit en haut de l'écran : l'amorce du temps, puis le titre. */
  const titreDeLaCarte = async () =>
    `${await page.locator("[data-amorce-etape]").innerText()} ${await page.locator("[data-titre-etape]").innerText()}`
      .replace(/\s+/g, " ")
      .trim();

  const avancement = async () =>
    Number(
      await page
        .getByRole("progressbar", { name: "Avancement du tour" })
        .getAttribute("aria-valuenow"),
    );

  it("le briefing se lit une carte à la fois, sans onglets", async () => {
    await versLaPremiereCarte();
    expect(
      await page.locator('[role="tablist"]:visible').count(),
      "plus d'onglets sur téléphone : un parcours linéaire",
    ).toBe(0);
    const hauteur = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    const ecran = page.viewportSize()!.height;
    // Le briefing d'un seul bloc faisait 1 968 px.
    expect(hauteur, `${hauteur} px pour un écran de ${ecran}`).toBeLessThan(
      ecran * 1.6,
    );
    await suite().waitFor({ state: "visible" });
  });

  it("un seul bouton fait avancer, et la barre du haut suit", async () => {
    await versLaPremiereCarte();
    const avant = await avancement();
    await suite().click();
    await page.waitForTimeout(400);
    expect(await avancement()).toBeGreaterThan(avant);
    await page.getByRole("button", { name: "Retour" }).click();
    await page.waitForTimeout(400);
    expect(await avancement()).toBe(avant);
  });

  it("les analyses du tour tiennent sur un écran, en accordéon : un tiroir ouvert à la fois", async () => {
    await versLaPremiereCarte();
    for (let k = 0; k < 10; k++) {
      const analyser = page.getByRole("button", { name: /^Analyser/ });
      if (await analyser.count()) {
        await analyser.click();
        break;
      }
      await suite().click();
      await page.waitForTimeout(250);
    }
    await page.getByText(/\d\/\d rendues?/).waitFor({ state: "visible" });
    // Une situation = un tiroir, dont le résumé dit où elle en est.
    const tiroirs = page.locator("details:has(> summary:has-text('à analyser'))");
    expect(await tiroirs.count()).toBeGreaterThan(0);
    // Un seul est ouvert à la fois, et c'est le premier.
    const ouverts = await page
      .locator("details[open]:has(> summary:has-text('à analyser'))")
      .count();
    expect(ouverts).toBe(1);
    // Le diagnostic et le modèle se remplissent dans le tiroir ouvert ; le rendu attend d'être complet.
    const valider = page.getByRole("button", { name: "Valider mon analyse" }).first();
    expect(await valider.isDisabled()).toBe(true);
    await page.locator("details[open] input[type=checkbox]:visible").first().check({ force: true });
    const radios = page.locator("details[open] fieldset");
    for (let i = 0; i < (await radios.count()); i++) {
      const groupe = radios.nth(i);
      if (await groupe.locator("input[type=radio]").count())
        await groupe.locator("input[type=radio]").first().check({ force: true });
    }
    expect(await valider.isDisabled()).toBe(false);
    // Le pied du parcours reste en bas, avec « Retour » et « Continuer ».
    const continuer = page.getByRole("button", { name: /^Continuer|^Décider/ }).last();
    const bas = (await continuer.boundingBox())!;
    expect(bas.y + bas.height).toBeGreaterThan(page.viewportSize()!.height - 40);
  });

  it("en questions ouvertes : des zones de texte à la place des QCM, et le rendu attend de vraies phrases", async () => {
    // Le réglage est celui de l'enseignant ; on le pose en base comme le ferait
    // son action, puis on regarde l'écran de l'élève.
    const gameId = page.url().match(/\/arena\/([^/?#]+)/)![1]!;
    const { Client } = await import("pg");
    expect(process.env.DATABASE_URL, "DATABASE_URL manquante").toBeTruthy();
    const base = new Client({ connectionString: process.env.DATABASE_URL });
    await base.connect();
    try {
      await base.query(
        `update games set difficulty_profile = coalesce(difficulty_profile, '{}'::jsonb) || '{"answerFormat":"open"}'::jsonb where id = $1`,
        [gameId],
      );
    } finally {
      await base.end();
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await versLaPremiereCarte();
    for (let k = 0; k < 10; k++) {
      const analyser = page.getByRole("button", { name: /^Analyser/ });
      if (await analyser.count()) {
        await analyser.click();
        break;
      }
      await suite().click();
      await page.waitForTimeout(250);
    }
    await page.getByText(/\d\/\d rendues?/).waitFor({ state: "visible" });
    const ouvert = page.locator("details[open]:has(> summary:has-text('à analyser'))");
    expect(await ouvert.locator("input[type=checkbox]").count(), "plus de cases à cocher").toBe(0);
    expect(await ouvert.locator("input[type=radio]").count(), "plus de QCM").toBe(0);
    const zones = ouvert.locator("textarea:visible");
    expect(await zones.count()).toBeGreaterThanOrEqual(2);
    const valider = page.getByRole("button", { name: "Valider mon analyse" }).first();
    expect(await valider.isDisabled()).toBe(true);
    // Un mot ne vaut pas une réponse.
    await zones.first().fill("oui");
    expect(await valider.isDisabled()).toBe(true);
    for (let i = 0; i < (await zones.count()); i++) {
      await zones
        .nth(i)
        .fill("La demande baisse alors que le prix, la qualité et la trésorerie de l'entreprise se dégradent.");
    }
    expect(await valider.isDisabled()).toBe(false);
  });

  it("rendre l'analyse la laisse ouverte sur sa confirmation, au lieu de la replier", async () => {
    const valider = page.getByRole("button", { name: "Valider mon analyse" }).first();
    await valider.click();
    await page.getByText("✓ Analyse rendue").first().waitFor({ state: "visible", timeout: 15_000 });
    expect(
      await page.getByText(/Votre correction vous attend au débriefing/).first().isVisible(),
      "la confirmation doit se voir sans déplier quoi que ce soit",
    ).toBe(true);
  });

  it("un glissement du doigt fait avancer ou reculer d'une carte, sauf s'il part d'un curseur", async () => {
    await versLaPremiereCarte();
    const cdp = await contexte.newCDPSession(page);
    const glisser = async (x1: number, y1: number, x2: number, y2: number) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1 }] });
      for (let i = 1; i <= 6; i++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x1 + ((x2 - x1) * i) / 6, y: y1 + ((y2 - y1) * i) / 6 }],
        });
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(450);
    };
    const l = page.viewportSize()!.width;
    const avant = await avancement();
    await glisser(l - 40, 300, 40, 305);
    expect(await avancement(), "glisser vers la gauche avance").toBeGreaterThan(avant);
    await glisser(40, 300, l - 40, 295);
    expect(await avancement(), "glisser vers la droite revient").toBe(avant);
    // Un trait vertical est un défilement : la carte ne bouge pas.
    await glisser(200, 500, 190, 200);
    expect(await avancement()).toBe(avant);
  });

  it("un geste parti d'un curseur règle le montant, il ne tourne pas la carte", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 6; k++) {
      await page.waitForTimeout(350);
      if (await page.locator('input[type="range"]:visible').count()) break;
      await page.getByRole("button", { name: /^Continuer/ }).last().click();
    }
    const curseur = page.locator('input[type="range"]:visible').first();
    await curseur.waitFor({ state: "visible" });
    const titre = await titreDeLaCarte();
    const boite = (await curseur.boundingBox())!;
    const cdp = await contexte.newCDPSession(page);
    const y = boite.y + boite.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: boite.x + 30, y }] });
    for (let i = 1; i <= 6; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: boite.x + 30 + (boite.width - 90) * (i / 6), y }],
      });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(450);
    expect(await titreDeLaCarte(), "la carte est restée en place").toBe(titre);
  });

  it("« Situation » et « Contexte » ont la même forme : deux tiroirs ouverts, au même niveau", async () => {
    await versLaPremiereCarte();
    for (let k = 0; k < 8; k++) {
      const situation = page.locator('details:has(> summary:has-text("Situation"))');
      if (await situation.count()) {
        const contexte = page.locator('details:has(> summary:has-text("Contexte"))');
        expect(await situation.first().evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
        expect(await contexte.first().evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
        // Même niveau : ni l'un ni l'autre n'est dans l'autre.
        expect(await situation.first().locator("details").count()).toBe(0);
        return;
      }
      await suite().click();
      await page.waitForTimeout(250);
    }
    throw new Error("aucune carte ne porte « Situation » et « Contexte »");
  });

  it("« Détail par clientèle » et « Saison du tour » : même forme, fermés, et l'un referme l'autre", async () => {
    await versLaPremiereCarte();
    for (let k = 0; k < 8; k++) {
      const detail = page.locator('details:has(> summary:has-text("Détail par clientèle"))');
      if (await detail.count()) {
        const saison = page.locator('details:has(> summary:has-text("Saison du tour"))');
        const ouvert = (l: typeof detail) => l.first().evaluate((d) => (d as HTMLDetailsElement).open);
        expect(await ouvert(detail)).toBe(false);
        expect(await ouvert(saison)).toBe(false);
        // Même niveau : le détail n'est plus dans le panneau « Le marché ».
        expect(await page.locator('details:has(> summary:has-text("Détail par clientèle")) >> xpath=ancestor::details').count()).toBe(0);
        await detail.first().locator("> summary").click();
        expect(await ouvert(detail)).toBe(true);
        await saison.first().locator("> summary").click();
        expect(await ouvert(saison)).toBe(true);
        expect(await ouvert(detail), "ouvrir la saison doit refermer le détail").toBe(false);
        return;
      }
      await suite().click();
      await page.waitForTimeout(250);
    }
    throw new Error("aucune carte ne porte le détail par clientèle");
  });

  it("le financement ne porte que l'emprunt et le capital, le parc machines a sa propre carte", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 20; k++) {
      await page.waitForTimeout(300);
      if (/Faut-il financer/i.test(await titreDeLaCarte())) break;
      await page.getByRole("button", { name: /^Continuer/ }).last().click();
    }
    // Le financement ne porte que l'emprunt et le capital : le parc machines a sa carte
    // (« Investissement »), la suivante, ouverte dès le premier niveau.
    expect(await page.locator('input[name="newLoan"]:visible').count()).toBe(1);
    expect(await page.getByText(/Parc machines|Acheter/).filter({ visible: true }).count()).toBe(0);
    await page.getByRole("button", { name: /^Continuer/ }).last().click();
    await page.waitForTimeout(300);
    expect(await titreDeLaCarte()).not.toMatch(/Faut-il financer/i);
    expect(await page.locator('input[name="newLoan"]:visible').count()).toBe(0);
  });

  it("la première décision est la commande exceptionnelle, seule à l'écran", async () => {
    await versLesDecisions();
    expect(await titreDeLaCarte()).toMatch(/Décision · 1 sur \d+ Une commande/i);
    await page.getByRole("button", { name: "Accepter", exact: true }).waitFor();
    await page.getByRole("button", { name: "Refuser", exact: true }).waitFor();
    // Le prix n'est pas encore là : il vient APRÈS la réponse.
    expect(await page.locator('input[name="price"]:visible').count()).toBe(0);
  });

  it("répondre à la commande ouvre la décision suivante, et « Retour » revient", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    await page.waitForTimeout(400);
    // La décision 2 est « combien pensez-vous vendre ? » : l'estimation vient
    // AVANT le prix et le volume, c'est elle qui leur donne un sens. Le prix
    // suit, et c'est la décision 3.
    expect(await titreDeLaCarte()).toMatch(/Décision · 2 sur \d+ Combien pensez-vous vendre/i);
    await page.locator('input[name^="ventesEstimees."]:visible').waitFor();
    await page.getByRole("button", { name: /^Continuer/ }).last().click();
    await page.waitForTimeout(400);
    expect(await titreDeLaCarte()).toMatch(/Décision · 3 sur \d+ À quel prix/i);
    await page.locator('input[name="price"]:visible').waitFor();
    await page.getByRole("button", { name: "Retour" }).click();
    await page.waitForTimeout(400);
    expect(await titreDeLaCarte()).toMatch(/Décision · 2 sur/i);
  });

  it("le prix a ses repères, un curseur, et sa marge en direct", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    await page.waitForTimeout(400);
    // Passer la carte des ventes estimées, qui précède désormais le prix.
    await page.getByRole("button", { name: /^Continuer/ }).last().click();
    await page.waitForTimeout(400);
    await page.getByText(/Prix usuels/).waitFor({ state: "visible" });
    await page.getByText(/Coût variable/).waitFor({ state: "visible" });
    const champ = page.locator('input[name="price"]:visible');
    const curseur = page.locator('input[type="range"]:visible');
    const marge = page.getByText(/^Marge par/).locator("..");
    const avant = Number(await champ.inputValue());
    const margeAvant = await marge.innerText();
    // Le curseur écrit dans la saisie, qui reste la source de la valeur envoyée.
    const maxi = Number(await curseur.getAttribute("max"));
    // Du côté où il y a de la place : un test d'avant a pu déjà déplacer le curseur.
    await curseur.fill(String(Math.round(maxi * (avant < maxi / 2 ? 0.75 : 0.25))));
    await page.waitForTimeout(200);
    expect(Number(await champ.inputValue())).not.toBe(avant);
    expect(await marge.innerText(), "la marge ne suit pas le prix").not.toBe(
      margeAvant,
    );
    // Et la saisie au clavier déplace le curseur.
    await champ.fill("60");
    await page.waitForTimeout(200);
    expect(Number(await curseur.inputValue())).toBe(60);
    // Plus de boutons − et +.
    expect(await page.getByRole("button", { name: /Augmenter|Diminuer/ }).count()).toBe(0);
  });

  it("le curseur de volume s'arrête à ce que l'atelier peut produire, pas au double de la proposition", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 8; k++) {
      await page.waitForTimeout(350);
      if (/Combien produisez-vous/i.test(await titreDeLaCarte())) break;
      await page.getByRole("button", { name: /^Continuer/ }).last().click();
    }
    const champ = page.locator('input[name="productionPlan"]:visible');
    const curseur = page.locator('input[type="range"]:visible').first();
    await curseur.waitFor({ state: "visible" });
    const plafond = Number(await curseur.getAttribute("max"));
    const propose = Number(await champ.inputValue());
    // NOVA : 7 000 à la machine, 7 200 à la main-d'œuvre. Le double de la proposition montait au-delà.
    expect(plafond, "le haut du curseur est la capacité réelle").toBeLessThanOrEqual(7200);
    expect(plafond).toBeGreaterThanOrEqual(propose);
  });

  it("marketing, qualité et maintenance sont sur UNE carte, pas trois", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    const titres: string[] = [];
    for (let k = 0; k < 14; k++) {
      await page.waitForTimeout(300);
      const titre = await titreDeLaCarte();
      titres.push(titre);
      if (/Vos budgets du tour/i.test(titre)) break;
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page.getByRole("button", { name: /^Continuer/ }).last().click();
    }
    expect(titres.at(-1), `cartes vues : ${titres.join(" | ")}`).toMatch(/Vos budgets du tour/i);
    // Les trois montants sont sur cet écran.
    for (const nom of ["Marketing", "Qualité", "Maintenance"]) {
      expect(await page.getByText(nom, { exact: true }).first().isVisible(), `${nom} est sur la carte`).toBe(true);
    }
    // Et aucune carte à part ne leur est consacrée.
    expect(titres.some((t) => /Quel budget (marketing|qualité|maintenance)/i.test(t))).toBe(false);
  });

  it("chaque carte de décision tient sur UN écran, avec des commandes de 44 px", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    const ecran = page.viewportSize()!.height;
    const trop: string[] = [];
    const petites: string[] = [];
    let vues = 0;
    for (let k = 0; k < 30; k++) {
      await page.waitForTimeout(350);
      vues++;
      const titre = await titreDeLaCarte();
      // LA RÈGLE : une carte de décision tient sur un écran.
      const hauteur = await hauteurUtile(page);
      if (hauteur > ecran + 4)
        trop.push(`${titre.slice(0, 40)} : ${hauteur} px pour un écran de ${ecran}`);
      for (const c of await commandesTropPetites(page))
        petites.push(`${titre.slice(0, 30)} → ${JSON.stringify(c)}`);
      if (
        await page.getByRole("button", { name: /Valider et simuler/ }).count()
      )
        break;
      const texte = page.locator('textarea[name="justification"]');
      if ((await texte.count()) && (await texte.isVisible()))
        await texte.fill("Je vise le volume pour remplir l'atelier ce tour.");
      await page
        .getByRole("button", { name: /^Continuer/ })
        .last()
        .click();
    }
    expect(vues, "le parcours n'atteint pas le récapitulatif").toBeGreaterThan(
      8,
    );
    expect(trop, `cartes qui ne tiennent pas sur un écran : ${trop.join(" | ")}`).toEqual([]);
    expect(petites, `commandes sous 44 px : ${petites.join(" | ")}`).toEqual(
      [],
    );
  });

  it("les décisions dont on peut se passer montrent leurs champs d'emblée, sans question préalable", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 20; k++) {
      await page.waitForTimeout(300);
      if (/Faut-il financer/i.test(await titreDeLaCarte())) break;
      const texte = page.locator('textarea[name="justification"]');
      if ((await texte.count()) && (await texte.isVisible())) break;
      await page.getByRole("button", { name: /^Continuer/ }).last().click();
    }
    expect(await titreDeLaCarte()).toMatch(/Faut-il financer/i);
    // Pas de « regarder ou pas » : les champs sont là, à zéro, et Continuer avance.
    expect(await page.getByRole("button", { name: /^Non, |Oui, je regarde/ }).count()).toBe(0);
    expect(
      await page.locator("form input:visible, form select:visible").count(),
    ).toBeGreaterThan(0);
    await page.getByRole("button", { name: /^Continuer/ }).last().click();
    await page.waitForTimeout(300);
    expect(await titreDeLaCarte()).not.toMatch(/Faut-il financer/i);
  });

  it("dans le parcours, les tiroirs s'ouvrent : pas d'écran à moitié vide", async () => {
    await versLaPremiereCarte();
    for (let k = 0; k < 6; k++) {
      const resume = page.locator("details > summary:visible").first();
      if (await resume.count()) {
        expect(
          await resume.locator("..").evaluate((d) => (d as HTMLDetailsElement).open),
        ).toBe(true);
        return;
      }
      await suite().click();
      await page.waitForTimeout(250);
    }
    throw new Error("aucune carte du briefing ne porte un tiroir");
  });

  it("le récapitulatif relit les choix, renvoie à la carte touchée, et propose de valider", async () => {
    await versLesDecisions();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 30; k++) {
      await page.waitForTimeout(300);
      if (await page.getByText("Vos décisions du tour").count()) break;
      const texte = page.locator('textarea[name="justification"]');
      if ((await texte.count()) && (await texte.isVisible()))
        await texte.fill("Je vise le volume pour remplir l'atelier ce tour.");
      await page
        .getByRole("button", { name: /^Continuer/ })
        .last()
        .click();
    }
    await page.getByText("Vos décisions du tour").waitFor({ state: "visible" });
    await page.getByRole("button", { name: /Valider et simuler/ }).waitFor();
    // La relecture n'est pas comptée comme une décision de plus : sa carte se dit
    // « Dernière étape », dit en haut de l'écran.
    await page
      .getByText("Dernière étape")
      .first()
      .waitFor({ state: "visible" });
    expect(await page.getByText(/Décision · 13 sur 12/).count()).toBe(0);
    await page.getByRole("button", { name: /Prix de vente/ }).click();
    await page.waitForTimeout(400);
    expect(await titreDeLaCarte()).toMatch(/À quel prix/i);
  });

  it("le menu de la partie ne propose plus d'apparence : le site n'en a qu'une", async () => {
    await page.getByRole("button", { name: "Menu de la partie" }).click();
    await page
      .getByRole("link", { name: "Fiches notions" })
      .first()
      .waitFor({ state: "visible" });
    expect(await page.getByRole("button", { name: /^Thème / }).count()).toBe(0);
    expect(await page.getByText("Apparence").count()).toBe(0);
    await page.keyboard.press("Escape");
  });

  it("le texte de l'écran de jeu ne descend pas sous 14 px", async () => {
    const fautifs = await page.evaluate(() => {
      const racine = document.querySelector("[data-ecran-de-jeu]")!;
      const sortie: Record<string, number> = {};
      const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = parcours.nextNode())) {
        const t = n.textContent?.trim();
        const p = n.parentElement;
        if (!t || !p) continue;
        const r = p.getBoundingClientRect();
        if (
          r.width < 1 ||
          r.height < 1 ||
          getComputedStyle(p).visibility === "hidden"
        )
          continue;
        // Les graphiques dessinent leurs graduations en SVG : une légende d'axe
        // n'est pas un texte à lire à bras tendu.
        if (p.closest("svg")) continue;
        const px = parseFloat(getComputedStyle(p).fontSize);
        if (px < 13.9)
          sortie[`${Math.round(px)}px`] =
            (sortie[`${Math.round(px)}px`] ?? 0) + t.length;
      }
      return sortie;
    });
    expect(
      fautifs,
      `textes sous 14 px (caractères par taille) : ${JSON.stringify(fautifs)}`,
    ).toEqual({});
  });
});

describe("sur ordinateur, ce qui est consulté reste à plat", () => {
  let ordi: BrowserContext;
  let p: Page;
  beforeAll(async () => {
    ordi = await navigateur.newContext({
      viewport: { width: 1280, height: 900 },
      locale: "fr-FR",
    });
    p = await ordi.newPage();
    await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await p.waitForLoadState("networkidle");
    await p.getByRole("button", { name: /NOVA/ }).click();
    // Ces parcours testent le niveau 3 (qualité, financement…) : on le choisit, sans dépendre du niveau de départ.
    await p.getByRole("button", { name: /^Niveau 3/ }).click();
    await p.getByRole("button", { name: "Lancer la partie" }).click();
    await p.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    if (p.url().includes("trop=1")) {
      throw new Error(
        "Plafond de parties par heure atteint sur cette base : attendre une heure, ou libérer le compteur (games.creator_ip).",
      );
    }
    await p.waitForLoadState("networkidle");
  }, 120_000);

  it("les panneaux de chiffres sont des cartes ouvertes, pas des tiroirs", async () => {
    await p
      .getByRole("heading", { name: "Votre entreprise" })
      .waitFor({ state: "visible" });
    await p
      .getByRole("heading", { name: "Le marché" })
      .waitFor({ state: "visible" });
    expect(await p.getByText("Charges de structure").first().isVisible()).toBe(
      true,
    );
  });

  it("aucun tiroir « Comprendre » : les textes d'aide restent en clair", async () => {
    await p
      .locator('[role="tablist"] button[role="tab"]:visible', {
        hasText: "Décider",
      })
      .click();
    await p.waitForTimeout(400);
    expect(await p.locator("summary", { hasText: "Comprendre" }).count()).toBe(
      0,
    );
  });

  it("la partie garde la barre du site, des onglets en haut, et aucune barre d'application", async () => {
    expect(
      await p.getByRole("button", { name: "Menu de la partie" }).isVisible(),
    ).toBe(false);
    expect(
      await p
        .getByRole("navigation", { name: "Navigation principale" })
        .isVisible(),
    ).toBe(true);
    const onglets = p.locator('[role="tablist"] button[role="tab"]:visible');
    expect(await onglets.count()).toBe(3);
    const box = (await onglets.first().boundingBox())!;
    // LOT P2 : au tour 1, le lieu ouvre la partie en pleine largeur, AU-DESSUS
    // de la bande de marché et des étapes ; les onglets descendent donc sous
    // lui (à 686 px dans une fenêtre de 900, contre moins de 450 avec l'ardoise
    // vide). Ce que la garde tient ne change pas : sur ordinateur, les onglets
    // sont EN HAUT du tour, dans le flux de la page et dans le premier écran,
    // jamais collés au bas de la fenêtre comme sur un téléphone.
    const fenetre = p.viewportSize()!.height;
    const tablist = p.locator('[role="tablist"]:visible').first();
    const position = await tablist.evaluate((t) => {
      for (let e: Element | null = t; e && e !== document.body; e = e.parentElement) {
        const pos = getComputedStyle(e).position;
        if (pos === "fixed" || pos === "sticky") return pos;
      }
      return "flux";
    });
    expect(position, "les onglets ne se collent au bas qu'au téléphone").toBe("flux");
    expect(box.y + box.height, "les onglets sont sous le premier écran").toBeLessThanOrEqual(fenetre);
    expect(
      fenetre - (box.y + box.height),
      "les onglets ne se collent au bas qu'au téléphone",
    ).toBeGreaterThan(100);
    // Et ils précèdent le contenu du tour.
    const avant = await tablist.evaluate((t) => {
      const panneau = document.querySelector('[role="tabpanel"]');
      return panneau ? Boolean(t.compareDocumentPosition(panneau) & 4) : true;
    });
    expect(avant).toBe(true);
    expect(await p.locator("form header").count()).toBe(0);
  });
});

describe("sur un petit téléphone (iPhone SE, 375 px)", () => {
  let petit: Page;
  let ctxPetit: BrowserContext;
  beforeAll(async () => {
    ctxPetit = await navigateur.newContext({ ...devices["iPhone SE"], locale: "fr-FR" });
    petit = await ctxPetit.newPage();
    await petit.addInitScript(() => localStorage.removeItem("install-prompt-ferme-le"));
    await petit.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await petit.waitForLoadState("networkidle");
    await petit.getByRole("button", { name: /NOVA/ }).click();
    // Ces parcours testent le niveau 3 (qualité, financement…) : on le choisit, sans dépendre du niveau de départ.
    await petit.getByRole("button", { name: /^Niveau 3/ }).click();
    await petit.getByRole("button", { name: "Lancer la partie" }).click();
    await petit.waitForURL(/\/arena\//, { timeout: 60_000 });
    await petit.waitForLoadState("networkidle");
    await petit.locator("[data-ecran-de-jeu]").waitFor({ state: "visible" });
  }, 120_000);
  afterAll(async () => {
    await ctxPetit?.close();
  });

  const suite = () => petit.getByRole("button", { name: /^(Continuer|Analyser|Décider)/ }).last();

  it("les boutons de chaque carte tiennent dans la largeur, « Accepter » compris", async () => {
    await petit.evaluate(() => (window.location.hash = "decisions"));
    await petit.locator("[data-titre-etape]").waitFor({ state: "visible" });
    await petit.getByRole("button", { name: "Accepter", exact: true }).waitFor({ state: "visible" });
    const largeur = petit.viewportSize()!.width;
    const dehors = await petit.evaluate((w) => {
      return [...document.querySelectorAll("button")]
        .filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 1 && r.height > 1 && (r.right > w + 1 || r.left < -1);
        })
        .map((b) => b.textContent?.trim());
    }, largeur);
    expect(dehors, `boutons hors écran : ${dehors.join(", ")}`).toEqual([]);
  });

  it("valider rend la main tout de suite : l'attente prend l'écran, puis le bilan du tour s'affiche", async () => {
    await petit.getByRole("button", { name: "Accepter", exact: true }).click();
    for (let k = 0; k < 30; k++) {
      await petit.waitForTimeout(300);
      if (await petit.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      // La note « Qu'attendez-vous de ces choix ? » reste vide : elle ne bloque pas.
      await suite().click();
    }
    await petit.getByRole("button", { name: /Valider et simuler/ }).click();
    // Avec les valeurs proposées, une question demande de confirmer : elle est à l'écran.
    const oui = petit.getByRole("button", { name: /Oui, je garde/ });
    if (await oui.count()) {
      const bas = (await oui.boundingBox())!;
      expect(bas.y + bas.height, "la confirmation doit être dans l'écran").toBeLessThanOrEqual(
        petit.viewportSize()!.height,
      );
      await oui.click();
    }
    await petit.getByText("Résultat net du tour").waitFor({ state: "visible", timeout: 60_000 });
    expect(await petit.getByText("Trésorerie").first().isVisible()).toBe(true);
    await petit.getByText(/Voir les résultats/).first().waitFor({ state: "visible" });
  }, 120_000);

  it("la carte des résultats n'a que ses trois onglets de détail, pas le menu de navigation du tour", async () => {
    await petit.getByText(/Voir les résultats/).first().click();
    await petit.getByRole("tab", { name: /Synthèse/ }).waitFor({ state: "visible", timeout: 30_000 });
    const onglets = (await petit.locator('[role="tablist"] [role="tab"]:visible').allInnerTexts()).map((t) =>
      t.replace(/\s+/g, " ").trim(),
    );
    expect(onglets, `onglets visibles : ${onglets.join(" | ")}`).toHaveLength(3);
    expect(onglets.join(" ")).toMatch(/Synthèse/);
    expect(onglets.join(" ")).toMatch(/Marché/);
    expect(onglets.join(" ")).toMatch(/Finance/);
    expect(onglets.join(" ")).not.toMatch(/Situation|Décisions/);
    // Le débriefing et les décisions du tour restent à la demande, dans un tiroir.
    expect(await petit.locator("summary", { hasText: "Débriefing et décisions de ce tour" }).count()).toBe(1);
  }, 60_000);

  /**
   * UN TABLEAU FINANCIER DÉFILE DANS SON CONTENEUR, LA PAGE JAMAIS.
   *
   * Les comptes se lisent en vrais tableaux : poste, chiffre du tour, écart au
   * tour précédent, pourcentage. L'historique des ventes en compte neuf de
   * front, et sur 375 px il ne tient pas — c'est le cas qui compte. La faute
   * classique est alors de laisser partir la PAGE vers la droite : on perd la
   * barre, les boutons sortent du champ, et on ne sait plus revenir. L'autre
   * est de laisser filer l'intitulé de ligne avec les colonnes : il reste une
   * grille de nombres dont on ne sait plus de quel tour ils viennent.
   *
   * Mesuré dans le navigateur : aucune lecture de source ne dit OÙ le
   * débordement atterrit.
   */
  it("les comptes sont des tableaux, et c'est leur conteneur qui défile, pas la page", async () => {
    await petit.getByRole("tab", { name: /^Finance/ }).click();
    await petit.locator(".tableau-financier table").first().waitFor({ state: "visible", timeout: 30_000 });

    // Un vrai tableau : des en-têtes de colonne, des en-têtes de ligne. Ils
    // sont composés en capitales, d'où la lecture sans égard à la casse.
    const entetes = await petit.locator('.tableau-financier thead th[scope="col"]').allInnerTexts();
    expect(entetes.join(" | "), "en-têtes de colonne").toMatch(/poste/i);
    expect(entetes.join(" | "), "la colonne d'écart").toMatch(/écart/i);
    expect(await petit.locator('.tableau-financier tbody th[scope="row"]').count()).toBeGreaterThan(5);

    // L'historique des ventes : neuf colonnes, qui ne tiennent pas sur 375 px.
    const historique = petit.locator("summary", { hasText: "Historique de vos ventes" }).first();
    await historique.click();
    await petit.waitForTimeout(600);

    const avant = await petit.evaluate(() => ({
      racine: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      corps: document.body.scrollWidth - document.body.clientWidth,
      // Un conteneur qui a VRAIMENT de quoi défiler : sans lui, cette garde ne
      // garde rien (le compte de résultat, lui, tient dans la largeur).
      aDefiler: [...document.querySelectorAll(".tableau-financier")].filter(
        (t) => t.scrollWidth - t.clientWidth > 40,
      ).length,
    }));
    expect(avant.aDefiler, "aucun tableau assez large : la garde ne garderait rien").toBeGreaterThan(0);
    expect(avant.racine, "la page part à droite").toBe(0);
    expect(avant.corps).toBe(0);

    // On pousse chaque tableau à fond vers la droite : la page ne bouge
    // toujours pas, et l'intitulé de ligne reste sous les yeux.
    const apres = await petit.evaluate(() => {
      const larges = [...document.querySelectorAll<HTMLElement>(".tableau-financier")].filter(
        (t) => t.scrollWidth - t.clientWidth > 40,
      );
      for (const t of larges) t.scrollLeft = t.scrollWidth;
      const tete = larges[0]!.querySelector<HTMLElement>('tbody th[scope="row"]');
      const boite = tete?.getBoundingClientRect();
      return {
        racine: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        corps: document.body.scrollWidth - document.body.clientWidth,
        intituleVisible: Boolean(boite && boite.left >= -1 && boite.right <= innerWidth + 1 && boite.width > 10),
        intituleLu: tete?.textContent?.trim() ?? "",
      };
    });
    expect(apres.racine, "la page part à droite après défilement du tableau").toBe(0);
    expect(apres.corps).toBe(0);
    expect(apres.intituleVisible, `intitulé emporté par le défilement : « ${apres.intituleLu} »`).toBe(true);
    expect(apres.intituleLu.length).toBeGreaterThan(1);
  }, 60_000);
});

describe("le lancement d'une partie, sur téléphone", () => {
  it("le choix du métier est à l'écran dès l'ouverture, sans défiler", async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const p = await ctx.newPage();
    try {
      await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
      await p.waitForLoadState("networkidle");
      const nova = p.getByRole("button", { name: /NOVA/ });
      await nova.waitFor({ state: "visible" });
      const boite = (await nova.boundingBox())!;
      expect(
        boite.y + boite.height,
        `NOVA est à ${Math.round(boite.y)} px pour un écran de ${p.viewportSize()!.height}`,
      ).toBeLessThanOrEqual(p.viewportSize()!.height);
    } finally {
      await ctx.close();
    }
  });
});

describe("une gamme (ATLAS CONSEIL, niveau 5), sur téléphone", () => {
  it("chaque référence tient sur UNE carte, compacte, qui tient (à peu près) sur un écran", async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const p = await ctx.newPage();
    try {
      await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
      await p.waitForLoadState("networkidle");
      await p.getByRole("button", { name: /ATLAS/ }).click();
      await p.getByRole("button", { name: /^Niveau 5/ }).click();
      await p.getByRole("button", { name: "Lancer la partie" }).click();
      await p.waitForURL(/\/arena\//, { timeout: 60_000 });
      await p.waitForLoadState("networkidle");
      await p.evaluate(() => (window.location.hash = "decisions"));
      await p.locator("[data-titre-etape]").waitFor({ state: "visible" });
      const accepter = p.getByRole("button", { name: "Accepter", exact: true });
      if (await accepter.count()) await accepter.click();
      // Les ventes estimées ouvrent la série, avant les cartes des références.
      await p.waitForTimeout(350);
      if (/pensez-vous vendre/i.test(await p.locator("[data-titre-etape]").innerText())) {
        await p.getByRole("button", { name: /^Continuer/ }).last().click();
      }
      const ecran = p.viewportSize()!.height;
      const cartes: string[] = [];
      const hautes: string[] = [];
      for (let k = 0; k < 8; k++) {
        await p.waitForTimeout(350);
        const titre = (await p.locator("[data-titre-etape]").innerText()).replace(/\s+/g, " ");
        if (!/Vos choix pour/.test(titre)) break;
        cartes.push(titre);
        // Les cadres de montant ont tous la même largeur : ils ne se calent plus sur le chiffre.
        if (cartes.length === 1) {
          const largeurs = await p.evaluate(() =>
            [...document.querySelectorAll("label > span.champ")]
              .filter((e) => e.getBoundingClientRect().width > 1)
              .map((e) => Math.round(e.getBoundingClientRect().width)),
          );
          expect(largeurs.length, "des champs compacts sont affichés").toBeGreaterThanOrEqual(3);
          expect(new Set(largeurs).size, `largeurs des cadres : ${largeurs.join(", ")}`).toBe(1);
        }
        // Cinq champs chiffrés et un fournisseur par carte : on tolère une petite marge, pas un demi-écran.
        const h = await hauteurUtile(p);
        if (h > ecran + 30) hautes.push(`${titre} : ${h} px`);
        await p.getByRole("button", { name: /^Continuer/ }).last().click();
      }
      // Une carte par référence : ni plus, ni moins.
      expect(cartes.length, `cartes de référence : ${cartes.join(" | ")}`).toBeGreaterThanOrEqual(2);
      expect(new Set(cartes).size, "chaque référence a sa carte, et une seule").toBe(cartes.length);
      expect(hautes, `cartes trop hautes pour un écran de ${ecran} px : ${hautes.join(" | ")}`).toEqual([]);
    } finally {
      await ctx.close();
    }
  }, 120_000);
});

describe("un niveau complet (NOVA niveau 6), sur téléphone", () => {
  it("aucun cadre de montant ne recouvre son étiquette, et rien ne déborde, sur aucune carte", async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const p = await ctx.newPage();
    try {
      await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
      await p.waitForLoadState("networkidle");
      await p.getByRole("button", { name: /NOVA/ }).click();
      await p.getByRole("button", { name: /^Niveau 6/ }).click();
      await p.getByRole("button", { name: "Lancer la partie" }).click();
      await p.waitForURL(/\/arena\//, { timeout: 60_000 });
      await p.waitForLoadState("networkidle");
      await p.evaluate(() => (window.location.hash = "decisions"));
      await p.locator("[data-titre-etape]").waitFor({ state: "visible" });
      const accepter = p.getByRole("button", { name: "Accepter", exact: true });
      if (await accepter.count()) await accepter.click();
      const largeur = p.viewportSize()!.width;
      const fautes: string[] = [];
      for (let k = 0; k < 30; k++) {
        await p.waitForTimeout(300);
        const titre = (await p.locator("[data-titre-etape]").innerText()).replace(/\s+/g, " ");
        const constat = await p.evaluate((w) => {
          const visible = (e: Element) => {
            const r = e.getBoundingClientRect();
            const st = getComputedStyle(e);
            return r.width > 1 && r.height > 1 && st.visibility !== "hidden" && st.display !== "none";
          };
          const chevauche = (a: DOMRect, b: DOMRect) =>
            a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
          const lignes: string[] = [];
          // Une ligne compacte : l'étiquette (premier enfant) et le cadre du montant.
          for (const l of document.querySelectorAll("main label")) {
            const cadre = l.querySelector(":scope > span.champ");
            const etiquette = l.querySelector(":scope > span:not(.champ)");
            if (!cadre || !etiquette || !visible(cadre) || !visible(etiquette)) continue;
            if (chevauche(cadre.getBoundingClientRect(), etiquette.getBoundingClientRect()))
              lignes.push(`recouvre : ${etiquette.textContent?.trim()}`);
          }
          for (const e of document.querySelectorAll("main label, main select, main input")) {
            if (!visible(e)) continue;
            const r = e.getBoundingClientRect();
            if (r.right > w + 1 || r.left < -1) lignes.push(`déborde : ${(e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 30)}`);
          }
          return lignes;
        }, largeur);
        for (const c of constat) fautes.push(`${titre.slice(0, 35)} → ${c}`);
        if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
        const texte = p.locator('textarea[name="justification"]');
        if ((await texte.count()) && (await texte.isVisible())) await texte.fill("Je vise le volume.");
        await p.getByRole("button", { name: /^Continuer/ }).last().click();
      }
      expect(fautes, `défauts de mise en page : ${fautes.join(" | ")}`).toEqual([]);
    } finally {
      await ctx.close();
    }
  }, 180_000);
});

