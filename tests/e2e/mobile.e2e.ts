import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  devices,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { THEMES, couleurDeBarre } from "../../src/config/themes";

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
  it("l'invitation à installer tient sur une ligne et reste sous le pouce", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const barre = page.getByRole("dialog", { name: "Installer l'application" });
    await barre.waitFor({ state: "visible", timeout: 10_000 });
    const boite = (await barre.boundingBox())!;
    const hauteurEcran = page.viewportSize()!.height;
    // Une ligne : bien moins d'un huitième de l'écran. Elle en couvrait 40 %.
    expect(
      boite.height,
      `barre d'installation de ${boite.height} px`,
    ).toBeLessThan(hauteurEcran / 8);
  });

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
  it("la barre d'état prend le fond du thème, et le suit quand on change de thème", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    for (const t of THEMES) {
      await page
        .getByRole("button", { name: `Thème ${t.nom.toLowerCase()}` })
        .click();
      const couleur = await page
        .locator('meta[name="theme-color"]')
        .getAttribute("content");
      expect(couleur, `thème ${t.code}`).toBe(couleurDeBarre(t.code));
    }
  });

  it("un visiteur qui a choisi un thème retrouve sa couleur de barre dès l'ouverture", async () => {
    const autre = THEMES[0]!;
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: `Thème ${autre.nom.toLowerCase()}` })
      .click();
    await page.goto(`${BASE}/guide`, { waitUntil: "domcontentloaded" });
    const couleur = await page
      .locator('meta[name="theme-color"]')
      .getAttribute("content");
    expect(couleur).toBe(couleurDeBarre(autre.code));
  });

  it("le manifeste prend les mêmes couleurs, et plus celles d'avant la charte", async () => {
    const reponse = await page.request.get(`${BASE}/manifest.webmanifest`);
    expect(reponse.status()).toBe(200);
    const m = await reponse.json();
    expect(m.theme_color).toBe(m.background_color);
    expect(THEMES.map((t) => t.apercu.fond)).toContain(m.theme_color);
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
      .getByText(/Tour 1 sur 6/)
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

  it("les trois étapes sont des onglets collés au bas de l'écran, et le restent au défilement", async () => {
    const onglets = page.locator('[role="tablist"] button[role="tab"]:visible');
    expect(await onglets.count()).toBe(3);
    const hauteur = page.viewportSize()!.height;
    const position = async () => {
      const b = (await onglets.first().boundingBox())!;
      return { bas: Math.round(b.y + b.height), haut: Math.round(b.y) };
    };
    const avant = await position();
    // Le bas de la barre est le bas de l'écran (aux marges de sécurité près).
    expect(
      avant.bas,
      `bas des onglets à ${avant.bas} px sur ${hauteur}`,
    ).toBeGreaterThanOrEqual(hauteur - 2);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(300);
    expect(await position()).toEqual(avant);
    await page.mouse.wheel(0, -2000);
  });

  it("l'action qui mène à l'étape suivante est fixée au-dessus des onglets", async () => {
    const suivant = page
      .getByRole("button", { name: /^Analyser/ })
      .filter({ hasNot: page.locator("[role=tab]") });
    const bouton = suivant.last();
    await bouton.waitFor({ state: "visible" });
    const b = (await bouton.boundingBox())!;
    const onglet = (await page
      .locator('[role="tablist"] button[role="tab"]:visible')
      .first()
      .boundingBox())!;
    expect(b.y + b.height, "l'action est sous les onglets").toBeLessThanOrEqual(
      onglet.y + 1,
    );
    expect(b.height, `bouton de ${b.height} px`).toBeGreaterThanOrEqual(44);
  });

  it("toucher une étape change d'étape et repart du haut de l'écran", async () => {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(200);
    await page
      .locator('[role="tablist"] button[role="tab"]:visible', {
        hasText: "Analyser",
      })
      .click();
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
    ).toBeLessThanOrEqual(2);
    const retenu = page.locator(
      '[role="tablist"] button[role="tab"][aria-selected="true"]:visible',
    );
    expect((await retenu.innerText()).trim()).toContain("Analyser");
  });

  it("à la dernière étape, l'action du formulaire suit l'écran et reste au-dessus des onglets", async () => {
    await page
      .locator('[role="tablist"] button[role="tab"]:visible', {
        hasText: "Décider",
      })
      .click();
    await page.waitForTimeout(500);
    const action = page
      .getByRole("button", { name: /Suivant|Valider/ })
      .first();
    // Le pied du formulaire se colle quand le formulaire entre à l'écran : on y
    // arrive comme un élève, en défilant jusqu'à lui.
    await action.evaluate((el) => {
      const form = el.closest("form")!;
      window.scrollTo(
        0,
        form.getBoundingClientRect().top + window.scrollY - 120,
      );
    });
    await page.waitForTimeout(400);
    await action.waitFor({ state: "visible" });
    const onglet = (await page
      .locator('[role="tablist"] button[role="tab"]:visible')
      .first()
      .boundingBox())!;
    const b = (await action.boundingBox())!;
    expect(b.y, "l'action sort de l'écran par le haut").toBeGreaterThanOrEqual(
      0,
    );
    expect(
      b.y + b.height,
      `action à ${Math.round(b.y + b.height)} px, onglets à ${Math.round(onglet.y)} px`,
    ).toBeLessThanOrEqual(onglet.y + 1);
    // « Précédent » est à sa gauche, et tous deux se touchent à 44 px au moins.
    const precedent = (await page
      .getByRole("button", { name: /Précédent/ })
      .boundingBox())!;
    expect(precedent.x, "« Précédent » doit précéder l'action").toBeLessThan(
      b.x,
    );
    expect(precedent.height).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    // Et elle y reste quand on descend plus bas dans le formulaire.
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const plusBas = (await action.boundingBox())!;
    expect(plusBas.y + plusBas.height).toBeLessThanOrEqual(onglet.y + 1);
    expect(plusBas.y).toBeGreaterThanOrEqual(0);
  });

  it("l'apparence se choisit depuis le menu de la partie", async () => {
    await page.getByRole("button", { name: "Menu de la partie" }).click();
    await page
      .getByRole("button", { name: "Thème sombre" })
      .waitFor({ state: "visible" });
    await page
      .getByRole("link", { name: "Fiches notions" })
      .first()
      .waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    expect(
      await page.getByRole("button", { name: "Thème sombre" }).isVisible(),
    ).toBe(false);
  });

  it("sur grand écran, la partie garde la barre du site et ni la barre du bas ni celle du haut", async () => {
    const taille = page.viewportSize()!;
    await page.setViewportSize({ width: 1280, height: 900 });
    try {
      await page.waitForTimeout(300);
      expect(
        await page
          .getByRole("button", { name: "Menu de la partie" })
          .isVisible(),
      ).toBe(false);
      expect(
        await page
          .locator('[role="tablist"] button[role="tab"]:visible')
          .count(),
      ).toBe(3);
      const box = (await page
        .locator('[role="tablist"] button[role="tab"]:visible')
        .first()
        .boundingBox())!;
      expect(
        box.y,
        "les onglets du bas ne doivent pas s'afficher en bas sur grand écran",
      ).toBeLessThan(450);
      expect(
        await page
          .getByRole("navigation", { name: "Navigation principale" })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.setViewportSize(taille);
    }
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
