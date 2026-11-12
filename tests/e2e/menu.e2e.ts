import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Locator, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { LIENS_LEGAUX, NAVIGATION, lienDuPlan, liensDAcces, liensDeTete, phraseCourte } from "../../src/config/navigation";

/**
 * La navigation, à la largeur d'un téléphone comme à celle d'un vidéoprojecteur.
 *
 * Le défaut réparé ici ne se voyait dans aucun test unitaire : les liens du
 * menu étaient tous marqués « masqué en dessous de la barre des petits écrans »
 * et rien ne les remplaçait. Le code était juste, les liens présents dans le
 * document, et un élève sur son téléphone n'avait AUCUN moyen d'aller nulle
 * part. Seul un vrai navigateur, à une vraie largeur, peut le dire.
 *
 * La garde ne lit donc pas le document mais ce qui est réellement VISIBLE, et
 * elle parcourt le registre du plan : une page ajoutée demain sera vérifiée
 * sans qu'on y pense.
 *
 * UN PANNEAU PAR MOT (le propriétaire, 12 novembre 2026, la maquette A). Sur
 * grand écran, plus de bouton « Menu » : chaque mot de la barre ouvre son
 * panneau, au survol après un court délai, au clic et au clavier ; sur
 * téléphone, « Menu » ouvre la liste des groupes, puis un groupe. Ce que le
 * rendu porte est gardé par tests/architecture/panneaux-du-menu.test.ts ; ce
 * fichier vérifie ce que la souris, le doigt et le clavier en font.
 */
const LARGEURS = [
  { nom: "téléphone", taille: { width: 390, height: 780 } },
  { nom: "grand écran", taille: { width: 1280, height: 900 } },
];
const TELEPHONE = LARGEURS[0]!.taille;
const GRAND_ECRAN = LARGEURS[1]!.taille;

/** Toutes les adresses du plan : la page de chaque groupe, ses entrées, les deux portes. */
const ADRESSES = [...new Set([...NAVIGATION.flatMap((g) => [g.entree, ...g.liens.map((l) => l.href)]), ...liensDAcces().map((l) => l.href)])];

let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const mot = (p: Page, code: string) => p.locator(`[data-mot-de-la-barre="${code}"]`);
const panneau = (p: Page, code: string) => p.locator(`[data-panneau-du-groupe="${code}"]`);
const panneauxOuverts = (p: Page) => p.locator("[data-panneau-du-groupe]:visible");
const menu = (p: Page) => p.locator("#plan-du-site");
const rangee = (p: Page, code: string) => p.locator(`#plan-du-site [data-groupe-du-menu="${code}"]`);
const groupeOuvert = (p: Page, code: string) => p.locator(`#plan-du-site [data-groupe-du-plan="${code}"]`);
/** L'élément qui a le focus, par ce qui le désigne dans ces tests. */
const focus = (p: Page) =>
  p.evaluate(() => {
    const e = document.activeElement as HTMLElement | null;
    return e?.getAttribute("data-mot-de-la-barre") ?? e?.getAttribute("href") ?? e?.id ?? e?.tagName ?? null;
  });

/** Une cible occupe-t-elle RÉELLEMENT une place dans la fenêtre, une fois amenée dedans ? */
async function aLEcran(cible: Locator, hauteur: number): Promise<boolean> {
  if (!(await cible.isVisible())) return false;
  await cible.scrollIntoViewIfNeeded();
  const boite = await cible.boundingBox();
  return !!boite && boite.y + boite.height > 0 && boite.y < hauteur;
}

/** Ouvre un panneau au clic, et attend la fin de son entrée en fondu. */
async function ouvrirLePanneau(p: Page, code: string): Promise<Locator> {
  await mot(p, code).click();
  const ouvert = panneau(p, code);
  await ouvert.waitFor({ state: "visible" });
  await ouvert.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
  return ouvert;
}

describe("le menu du site", () => {
  it("sur téléphone, donne accès à tout le plan : la liste des groupes, puis chaque groupe et son bouton", async () => {
    await page.setViewportSize(TELEPHONE);
    await aller(page, "/");
    const bouton = page.getByRole("button", { name: "Menu" });
    expect(await bouton.isVisible(), "pas de bouton « Menu » sur téléphone").toBe(true);
    await bouton.click();
    await menu(page).waitFor({ state: "visible" });
    const vus = new Set<string>();
    const invisibles: string[] = [];
    // Les deux portes, en tête de la liste.
    for (const porte of liensDAcces()) {
      const cible = page.locator(`#plan-du-site [data-portes-du-menu] a[href="${porte.href}"]`);
      if (await aLEcran(cible, TELEPHONE.height)) vus.add(porte.href);
      else invisibles.push(`${porte.href} (porte)`);
    }
    // Chaque groupe : on le touche, on y trouve son bouton et ses entrées, et « Retour » ramène à la liste.
    for (const g of NAVIGATION) {
      await rangee(page, g.code).click();
      const vue = groupeOuvert(page, g.code);
      await vue.waitFor({ state: "visible" });
      expect(await page.locator("#plan-du-site [data-liste-des-groupes]").isVisible(), `${g.code} : la liste reste affichée`).toBe(false);
      for (const href of [g.entree, ...g.liens.map((l) => l.href)]) {
        const cibles = vue.locator(`a[href="${href}"]`);
        if ((await cibles.count()) === 0) invisibles.push(`${href} (absent de ${g.code})`);
        for (let i = 0; i < (await cibles.count()); i += 1) {
          if (await aLEcran(cibles.nth(i), TELEPHONE.height)) vus.add(href);
          else invisibles.push(`${href} (hors écran dans ${g.code})`);
        }
      }
      // « Retour » : la liste revient, le menu reste ouvert, et le focus revient au groupe.
      await vue.getByRole("button", { name: /^Retour/ }).click();
      await page.locator("#plan-du-site [data-liste-des-groupes]").waitFor({ state: "visible" });
      expect(await menu(page).isVisible(), "« Retour » a fermé le menu").toBe(true);
      expect(await page.evaluate(() => document.activeElement?.id)).toBe(`plan-groupe-${g.code}`);
    }
    const manquent = ADRESSES.filter((h) => !vus.has(h));
    expect([...manquent, ...invisibles], `injoignable sur téléphone : ${[...manquent, ...invisibles].join(", ")}`).toEqual([]);
    await page.keyboard.press("Escape");
  });

  it("sur grand écran, donne accès à tout le plan, sans bouton « Menu » : chaque mot ouvre son panneau", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/");
    expect(await page.getByRole("button", { name: "Menu" }).isVisible(), "un bouton « Menu » sur grand écran").toBe(false);
    const vus = new Set<string>();
    const invisibles: string[] = [];
    // Les deux portes, à droite de la barre.
    for (const porte of liensDAcces()) {
      const cible = page.getByRole("navigation", { name: "Navigation principale" }).locator(`a[href="${porte.href}"]`).first();
      if (await aLEcran(cible, GRAND_ECRAN.height)) vus.add(porte.href);
      else invisibles.push(`${porte.href} (porte)`);
    }
    for (const g of NAVIGATION) {
      const ouvert = await ouvrirLePanneau(page, g.code);
      expect(await panneauxOuverts(page).count(), `${g.code} : un seul panneau ouvert`).toBe(1);
      for (const href of [g.entree, ...g.liens.map((l) => l.href)]) {
        const cibles = ouvert.locator(`a[href="${href}"]`);
        if ((await cibles.count()) === 0) invisibles.push(`${href} (absent du panneau ${g.code})`);
        for (let i = 0; i < (await cibles.count()); i += 1) {
          if (await aLEcran(cibles.nth(i), GRAND_ECRAN.height)) vus.add(href);
          else invisibles.push(`${href} (hors écran dans ${g.code})`);
        }
      }
    }
    await page.keyboard.press("Escape");
    const manquent = ADRESSES.filter((h) => !vus.has(h));
    expect([...manquent, ...invisibles], `injoignable sur grand écran : ${[...manquent, ...invisibles].join(", ")}`).toEqual([]);
  });

  for (const largeur of LARGEURS) {
    it(`la barre ne déborde pas sur ${largeur.nom}`, async () => {
      // L'encombrement d'origine : huit liens, deux boutons et une marque sur
      // une seule ligne. Le débordement horizontal ne se voit pas en lisant le
      // code, et il coupe la fin de la rangée.
      await page.setViewportSize(largeur.taille);
      await aller(page, "/");
      const debord = await page.evaluate(() => {
        const barre = document.querySelector("header");
        if (!barre) return -1;
        return barre.scrollWidth - barre.clientWidth;
      });
      expect(debord, `la barre déborde de ${debord} px sur ${largeur.nom}`).toBeLessThanOrEqual(0);
    });
  }

  it("sur téléphone, la liste et chaque groupe tiennent dans le menu, sans déborder de côté", async () => {
    await page.setViewportSize(TELEPHONE);
    await aller(page, "/notions");
    // La barre d'action du téléphone se montre une fois la page défilée : le menu doit passer devant elle.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.evaluate(() => window.scrollTo(0, 1100));
    await page.getByRole("button", { name: "Menu" }).click();
    const mesurer = () =>
      page.evaluate(() => {
        const cadre = document.querySelector("#plan-du-site")!;
        const r = cadre.getBoundingClientRect();
        const dehors = [...cadre.querySelectorAll("a, button")]
          .filter((e) => (e as HTMLElement).offsetParent)
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.left < r.left - 0.5 || b.right > r.right + 0.5;
          })
          .map((e) => e.textContent?.trim());
        return {
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          cadre: cadre.scrollWidth - cadre.clientWidth,
          // Le menu va du bas de la barre au bas de l'écran, et rien ne le couvre (la barre d'action).
          bas: Math.round(innerHeight - r.bottom),
          couvert: !document.elementFromPoint(innerWidth / 2, innerHeight - 4)?.closest("#plan-du-site"),
          dehors,
        };
      });
    await page.locator("#plan-du-site [data-liste-des-groupes]").waitFor({ state: "visible" });
    // Mesuré une fois ouvert : pendant son fondu, le menu monte d'un cran et se resserre.
    await menu(page).evaluate((e) => Promise.all(e.getAnimations({ subtree: true }).map((a) => a.finished)));
    const mesures = [{ ou: "la liste", ...(await mesurer()) }];
    for (const g of NAVIGATION) {
      await rangee(page, g.code).click();
      await groupeOuvert(page, g.code).waitFor({ state: "visible" });
      mesures.push({ ou: g.code, ...(await mesurer()) });
      await groupeOuvert(page, g.code).getByRole("button", { name: /^Retour/ }).click();
    }
    for (const m of mesures) {
      expect(m.page, JSON.stringify(m)).toBeLessThanOrEqual(0);
      expect(m.cadre, JSON.stringify(m)).toBeLessThanOrEqual(0);
      expect(m.dehors, JSON.stringify(m)).toEqual([]);
      expect(Math.abs(m.bas), `${m.ou} : le menu ne descend pas jusqu'au bas de l'écran`).toBeLessThanOrEqual(1);
      expect(m.couvert, `${m.ou} : le bas du menu est couvert`).toBe(false);
    }
    await page.keyboard.press("Escape");
  });

  it("sur grand écran, chaque panneau tient dans la largeur, ses cartes aussi", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/");
    for (const g of NAVIGATION) {
      await ouvrirLePanneau(page, g.code);
      const m = await panneau(page, g.code).evaluate((p) => {
        const r = p.getBoundingClientRect();
        const dehors = [...p.querySelectorAll("a, button")]
          .filter((e) => (e as HTMLElement).offsetParent)
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.bottom > innerHeight;
          })
          .map((e) => e.textContent?.trim());
        return {
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          panneau: p.scrollWidth - p.clientWidth,
          // Toute la largeur, collé sous la barre.
          largeur: Math.round(r.width - document.documentElement.clientWidth),
          colle: Math.round(r.top - document.querySelector("header nav")!.getBoundingClientRect().bottom),
          dehors,
        };
      });
      expect(m, g.code).toMatchObject({ page: 0, largeur: 0, colle: 0, dehors: [] });
      expect(m.panneau, g.code).toBeLessThanOrEqual(0);
    }
    await page.keyboard.press("Escape");
  });

  it("se referme à la touche d'échappement, et rend le focus à ce qui l'avait ouvert", async () => {
    // Un menu resté ouvert recouvre la page qu'on vient d'ouvrir.
    await page.setViewportSize(TELEPHONE);
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const porte = page.locator(`#plan-du-site a[href="${liensDAcces()[0]!.href}"]`);
    expect(await porte.isVisible()).toBe(true);
    await porte.focus();
    await page.keyboard.press("Escape");
    await expect.poll(() => porte.isVisible()).toBe(false);
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim()), "le focus ne revient pas à « Menu »").toBe("Menu");
    // Sur grand écran : le panneau se ferme, et le focus revient au mot.
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/");
    const ouvert = await ouvrirLePanneau(page, "arene");
    await ouvert.locator("a").first().focus();
    await page.keyboard.press("Escape");
    await expect.poll(() => ouvert.isVisible()).toBe(false);
    expect(await focus(page)).toBe("arene");
  });

  it("conduit à la page demandée, et se referme en arrivant", async () => {
    const lien = lienDuPlan("/notions");
    // Sur grand écran, par le panneau de « Cours ».
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/");
    const ouvert = await ouvrirLePanneau(page, "cours");
    await ouvert.locator(`a[href="${lien.href}"]`).click();
    await page.waitForURL(new RegExp(`${lien.href}$`), { timeout: 30_000 });
    await expect.poll(() => panneauxOuverts(page).count()).toBe(0);
    // Sur téléphone, par la liste, puis le groupe.
    await page.setViewportSize(TELEPHONE);
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    await rangee(page, "cours").click();
    await groupeOuvert(page, "cours").locator(`a[href="${lien.href}"]`).click();
    await page.waitForURL(new RegExp(`${lien.href}$`), { timeout: 30_000 });
    await expect.poll(() => menu(page).isVisible()).toBe(false);
  });

  it("signale la page où l'on se trouve : le mot de son groupe dans la barre, sa carte dans le panneau", async () => {
    // Sans ce repère, le menu est une liste de départs sans point de départ.
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/entreprises");
    expect(await page.locator('[data-mot-de-la-barre][aria-current="true"]').innerText()).toBe("Arène");
    const ouvert = await ouvrirLePanneau(page, "arene");
    const courante = ouvert.locator('a[href="/entreprises"][aria-current="page"]');
    expect(await courante.isVisible()).toBe(true);
    expect(await courante.getAttribute("aria-labelledby").then((id) => page.locator(`[id="${id}"]`).innerText())).toBe(
      lienDuPlan("/entreprises").libelle,
    );
    await page.keyboard.press("Escape");
  });
});

/**
 * LES PANNEAUX À LA SOURIS ET AU CLAVIER, sur grand écran (la maquette A) : au survol après un court
 * délai, au clic et au clavier ; un seul à la fois ; un clic sur un mot que le survol vient d'ouvrir
 * ne le referme pas par surprise ; la sortie du panneau au clavier, Échap ou un clic dehors le ferment.
 */
describe("les panneaux, à la souris et au clavier", () => {
  /** Le centre d'un élément, pour y poser la souris. */
  const centre = async (cible: Locator) => {
    const b = (await cible.boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };

  it("au survol : rien en passant, le panneau après un court délai, l'autre panneau d'un mot à l'autre, la fermeture en sortant", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/notions");
    await page.mouse.move(20, 850);
    // En passant sur un mot sans s'y poser, rien ne s'ouvre.
    const cours = await centre(mot(page, "cours"));
    await page.mouse.move(cours.x, cours.y);
    await page.mouse.move(20, 850);
    await page.waitForTimeout(400);
    expect(await panneauxOuverts(page).count(), "un panneau s'ouvre au passage de la souris").toBe(0);
    // Posée sur le mot, la souris ouvre son panneau après un court délai, pas avant.
    const debut = Date.now();
    await page.mouse.move(cours.x, cours.y);
    await panneau(page, "cours").waitFor({ state: "visible" });
    expect(Date.now() - debut, "le panneau s'ouvre sans délai").toBeGreaterThanOrEqual(140);
    expect(await mot(page, "cours").getAttribute("aria-expanded")).toBe("true");
    // D'un mot à l'autre, le panneau change : un seul ouvert.
    const arene = await centre(mot(page, "arene"));
    await page.mouse.move(arene.x, arene.y);
    await panneau(page, "arene").waitFor({ state: "visible" });
    expect(await panneauxOuverts(page).count()).toBe(1);
    expect(await mot(page, "cours").getAttribute("aria-expanded")).toBe("false");
    // La souris descend dans le panneau : il reste ; elle s'en va : il se ferme.
    const premiere = await centre(panneau(page, "arene").locator("[data-entree-du-panneau]").first());
    await page.mouse.move(premiere.x, premiere.y, { steps: 4 });
    await page.waitForTimeout(500);
    expect(await panneau(page, "arene").isVisible(), "le panneau se ferme sous la souris").toBe(true);
    await page.mouse.move(20, 880);
    await expect.poll(() => panneauxOuverts(page).count(), { timeout: 3_000 }).toBe(0);
  });

  it("au clic : le mot que le survol vient d'ouvrir reste ouvert, un second clic le ferme, un clic dehors aussi", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/notions");
    // Le survol ouvre, puis le clic : le panneau ne se referme pas sous la main qui l'a fait venir.
    await mot(page, "episodes").hover();
    await panneau(page, "episodes").waitFor({ state: "visible" });
    await mot(page, "episodes").click();
    await page.waitForTimeout(400);
    expect(await panneau(page, "episodes").isVisible(), "le clic a refermé le panneau que le survol venait d'ouvrir").toBe(true);
    // Ouvert au clic, il reste quand la souris s'en va.
    await page.mouse.move(20, 880);
    await page.waitForTimeout(700);
    expect(await panneau(page, "episodes").isVisible(), "ouvert au clic, il se ferme quand la souris s'en va").toBe(true);
    // Un second clic sur le mot le ferme.
    await mot(page, "episodes").click();
    await expect.poll(() => panneau(page, "episodes").isVisible()).toBe(false);
    // Un clic dehors le ferme aussi.
    await ouvrirLePanneau(page, "offres");
    await page.mouse.move(20, 880);
    await page.mouse.click(20, 880);
    await expect.poll(() => panneauxOuverts(page).count()).toBe(0);
    // Un lien du panneau le ferme en menant à sa page.
    const aide = await ouvrirLePanneau(page, "aide");
    await aide.locator("[data-appel-du-groupe]").click();
    await page.waitForURL(/\/guides$/, { timeout: 30_000 });
    await expect.poll(() => panneauxOuverts(page).count()).toBe(0);
    // Un changement de page le ferme aussi, sans clic ni touche dans la barre (le retour du navigateur).
    await mot(page, "cours").focus();
    await page.keyboard.press("Enter");
    await panneau(page, "cours").waitFor({ state: "visible" });
    await page.evaluate(() => history.back());
    await page.waitForURL(/\/notions$/, { timeout: 30_000 });
    await expect.poll(() => panneauxOuverts(page).count()).toBe(0);
  });

  it("au clavier : Entrée ouvre, la tabulation passe du mot à son panneau puis le referme en le quittant, Échap rend le focus au mot", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/notions");
    await page.getByRole("link", { name: "Accueil" }).focus();
    await page.keyboard.press("Tab");
    expect(await focus(page), "la tabulation ne passe pas du logo au premier mot").toBe("cours");
    await page.keyboard.press("Enter");
    await panneau(page, "cours").waitFor({ state: "visible" });
    expect(await mot(page, "cours").getAttribute("aria-expanded")).toBe("true");
    // Du mot à son panneau : le bouton du groupe, puis ses entrées, dans l'ordre.
    const cours = NAVIGATION.find((g) => g.code === "cours")!;
    for (const href of [cours.entree, ...cours.liens.map((l) => l.href)]) {
      await page.keyboard.press("Tab");
      expect(await focus(page)).toBe(href);
    }
    // En quittant le panneau, il se ferme, et le focus est au mot suivant.
    await page.keyboard.press("Tab");
    expect(await focus(page)).toBe("arene");
    await expect.poll(() => panneau(page, "cours").isVisible()).toBe(false);
    // En arrière aussi.
    await page.keyboard.press("Enter");
    await panneau(page, "arene").waitFor({ state: "visible" });
    await page.keyboard.press("Shift+Tab");
    expect(await focus(page)).toBe("cours");
    await expect.poll(() => panneau(page, "arene").isVisible()).toBe(false);
    // Échap, depuis le panneau, le ferme et rend le focus au mot.
    await page.keyboard.press("Enter");
    await panneau(page, "cours").waitFor({ state: "visible" });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect.poll(() => panneau(page, "cours").isVisible()).toBe(false);
    expect(await focus(page)).toBe("cours");
    expect(await mot(page, "cours").getAttribute("aria-expanded")).toBe("false");
  });
});

/**
 * UN MENU PAR PRODUIT, UN MOT PAR ENTRÉE (novembre 2026).
 *
 * La barre, ses panneaux et le pied de page lisent le même registre : ces
 * gardes vérifient, dans un vrai navigateur, que les trois disent les mêmes
 * mots, vers les mêmes pages, que la page courante se marque dans chacun, et
 * que le pied de page tient en cinq colonnes sur grand écran et en deux sur
 * téléphone.
 */
describe("la barre, le menu et le pied de page lisent le même plan", () => {
  const textes = (locator: ReturnType<Page["locator"]>) =>
    locator.evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
  const adresses = (locator: ReturnType<Page["locator"]>) =>
    locator.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  const sansInsecables = (t: string) => t.replace(/[\u00a0\u202f]/g, " ").trim();

  it("sur grand écran, la barre porte les mots des groupes et les deux portes ; chaque panneau, sa phrase, son bouton et ses entrées", async () => {
    await page.setViewportSize(GRAND_ECRAN);
    await aller(page, "/tarifs");
    const barre = page.getByRole("navigation", { name: "Navigation principale" });
    // Les mots : des boutons, un par groupe, dans l'ordre du plan.
    const mots = barre.locator("[data-mot-de-la-barre]");
    expect(await textes(mots)).toEqual(liensDeTete().map((l) => l.libelle));
    for (const g of NAVIGATION) expect(await barre.getByRole("button", { name: g.titre, exact: true }).isVisible(), g.titre).toBe(true);
    // Les portes : un mot à l'écran, un nom plus long qui commence par lui.
    for (const l of liensDAcces()) {
      const porte = barre.getByRole("link", { name: l.nom ?? l.libelle, exact: true });
      expect(await porte.isVisible(), l.libelle).toBe(true);
      expect((await porte.innerText()).trim()).toBe(l.libelle);
      expect(l.nom ?? l.libelle).toMatch(new RegExp(`^${l.libelle}`));
    }
    // La page courante se marque dans la barre : « Offres » sur /tarifs.
    expect(await barre.locator('[data-mot-de-la-barre][aria-current="true"]').innerText()).toBe("Offres");
    // Chaque panneau : la phrase s'il en a une, le bouton vers la page du groupe, puis ses entrées,
    // chacune son mot et sa ligne ; ni porte ni lien légal.
    for (const g of NAVIGATION) {
      const ouvert = await ouvrirLePanneau(page, g.code);
      const phrase = ouvert.locator("[data-phrase-du-groupe]");
      if (g.phrase) expect(sansInsecables(await phrase.innerText()), g.titre).toBe(g.phrase);
      else expect(await phrase.count(), g.titre).toBe(0);
      const appel = ouvert.locator("[data-appel-du-groupe]");
      expect([(await appel.innerText()).trim(), await appel.getAttribute("href")], g.titre).toEqual([g.appel, g.entree]);
      const cartes = ouvert.locator("[data-entree-du-panneau]");
      expect(await adresses(cartes), g.titre).toEqual(g.liens.map((l) => l.href));
      for (const [i, l] of g.liens.entries()) {
        const carte = cartes.nth(i);
        expect(await carte.isVisible(), l.libelle).toBe(true);
        // Son nom est son mot (la ligne n'en est que la description).
        expect(await ouvert.getByRole("link", { name: l.libelle, exact: true }).getAttribute("href"), l.libelle).toBe(l.href);
        expect(sansInsecables(await carte.locator("[data-ligne-de-l-entree]").innerText()), l.libelle).toBe(l.ligne);
      }
      expect(await ouvert.locator("[data-entree-du-panneau][aria-current='page']").count(), g.titre).toBe(0);
      for (const l of [...LIENS_LEGAUX, ...liensDAcces()]) expect(await ouvert.locator(`a[href="${l.href}"]`).count(), `${g.titre} : ${l.href}`).toBe(0);
    }
    // Le bouton de « Offres » mène à la page où l'on est : il le dit, et lui seul.
    await ouvrirLePanneau(page, "offres");
    expect(await page.locator("[data-panneau-du-groupe] [aria-current='page']").evaluateAll((els) => els.map((e) => e.getAttribute("href")))).toEqual([
      "/tarifs",
    ]);
    await page.keyboard.press("Escape");
  });

  it("sur téléphone, la liste : les portes en tête, puis les groupes sous les mots de la barre, chacun avec sa phrase courte", async () => {
    await page.setViewportSize(TELEPHONE);
    await aller(page, "/tarifs");
    await page.getByRole("button", { name: "Menu" }).click();
    const portes = page.locator("#plan-du-site [data-portes-du-menu] a");
    await portes.first().waitFor({ state: "visible" });
    expect(await textes(portes)).toEqual(liensDAcces().map((l) => l.libelle));
    expect(await adresses(portes)).toEqual(liensDAcces().map((l) => l.href));
    expect(await textes(page.locator("#plan-du-site [data-titre-du-groupe]"))).toEqual(NAVIGATION.map((g) => g.titre));
    expect(await textes(page.locator("#plan-du-site [data-phrase-courte]"))).toEqual(
      NAVIGATION.map((g) => phraseCourte(g)).filter((p): p is string => !!p),
    );
    // La page courante : le groupe des offres est marqué, et dans le groupe, son bouton.
    expect(await page.locator('#plan-du-site [data-groupe-du-menu][aria-current="true"]').getAttribute("data-groupe-du-menu")).toBe("offres");
    await rangee(page, "offres").click();
    expect(await groupeOuvert(page, "offres").locator("[data-appel-du-groupe]").getAttribute("aria-current")).toBe("page");
    // Le légal n'est pas dans le menu : il tient sur une petite ligne, au pied de page.
    for (const l of LIENS_LEGAUX) {
      expect(await page.locator(`#plan-du-site a[href="${l.href}"]`).count(), l.href).toBe(0);
    }
    await page.keyboard.press("Escape");
  });

  it("les règles du jeu : « Règles » au menu, sous leur adresse d'origine ; la page garde son titre", async () => {
    await aller(page, "/guide");
    expect(lienDuPlan("/guide").libelle).toBe("Règles");
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toBe("Règles du jeu");
    expect(await page.title()).toContain("Règles du jeu");
  });

  for (const largeur of LARGEURS) {
    it(`le pied de page déroule le plan sur ${largeur.nom}`, async () => {
      await page.setViewportSize(largeur.taille);
      await aller(page, "/notions");
      const pied = page.locator("footer [data-plan-du-pied]");
      await pied.scrollIntoViewIfNeeded();
      // Un bloc par groupe, dans l'ordre du plan, sous le mot de la barre, vers la même page.
      const blocs = pied.locator("[data-groupe-du-pied]");
      expect(await blocs.evaluateAll((els) => els.map((e) => e.getAttribute("data-groupe-du-pied")))).toEqual(
        NAVIGATION.map((g) => g.code),
      );
      for (const [i, g] of NAVIGATION.entries()) {
        const titre = blocs.nth(i).locator(":scope > :first-child");
        expect((await titre.innerText()).trim(), g.code).toBe(g.titre);
        expect(await titre.getAttribute("href"), g.code).toBe(g.entree);
      }
      // Chaque entrée y est, sauf la page où l'on est, posée en texte et marquée.
      for (const lien of NAVIGATION.flatMap((g) => g.liens)) {
        if (lien.href === "/notions") {
          expect(await pied.locator('[aria-current="page"]').innerText()).toBe(lien.libelle);
          continue;
        }
        const a = pied.locator(`ul a[href="${lien.href}"]`);
        expect(await a.count(), `${lien.href} manque au pied de page`).toBe(1);
        expect((await a.innerText()).trim(), lien.href).toBe(lien.libelle);
      }
      expect(await pied.locator('a[href="/notions"]').count(), "le pied propose la page où l'on est").toBe(0);
      // Ni phrase ni lien légal dans les colonnes ; le légal, en petit, tout en bas : Mentions · CGV · CGU.
      for (const g of NAVIGATION.filter((x) => x.phrase)) expect(await pied.innerText()).not.toContain(g.phrase!.slice(0, 20));
      for (const l of LIENS_LEGAUX) expect(await pied.locator(`a[href="${l.href}"]`).count(), l.href).toBe(0);
      const ligne = page.locator("footer [data-ligne-legale]");
      await ligne.scrollIntoViewIfNeeded();
      expect(await ligne.isVisible()).toBe(true);
      expect(await textes(ligne.locator("a"))).toEqual(LIENS_LEGAUX.map((l) => l.libelle));
      expect(await adresses(ligne.locator("a"))).toEqual(LIENS_LEGAUX.map((l) => l.href));
      const corps = await ligne.locator("a").first().evaluate((a) => parseFloat(getComputedStyle(a).fontSize));
      expect(corps, "la ligne légale n'est pas en petit").toBeLessThanOrEqual(12.5);
      const basDuPlan = (await pied.boundingBox())!;
      const haut = (await ligne.boundingBox())!;
      expect(haut.y, "la ligne légale n'est pas sous le plan").toBeGreaterThan(basDuPlan.y + basDuPlan.height);
      // Cinq colonnes sur une rangée sur grand écran ; deux colonnes sur trois rangées sur téléphone.
      const cases = await blocs.evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { gauche: Math.round(r.left), haut: Math.round(r.top) };
        }),
      );
      expect(cases).toHaveLength(5);
      const colonnes = new Set(cases.map((c) => c.gauche)).size;
      const rangees = new Set(cases.map((c) => c.haut)).size;
      expect(colonnes, `colonnes à ${cases.map((c) => c.gauche).join(", ")}`).toBe(largeur.nom === "téléphone" ? 2 : 5);
      expect(rangees, `rangées à ${cases.map((c) => c.haut).join(", ")}`).toBe(largeur.nom === "téléphone" ? 3 : 1);
      // L'adresse de contact, en texte, et aucun débordement.
      expect((await page.locator("footer [data-contact-pied]").innerText()).trim().length).toBeGreaterThan(3);
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(debord, `la page déborde de ${debord} px`).toBeLessThanOrEqual(0);
    });
  }
});
