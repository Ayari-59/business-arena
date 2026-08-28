import { chromium, type Browser, type Page } from "playwright-core";

/**
 * Un navigateur, pour la seule chose que les tests unitaires ne savent pas voir.
 *
 * Les deux recettes menées à la main ont trouvé douze écarts, dont aucun n'était
 * visible depuis la suite ordinaire : un bouton proposé puis refusé, des libellés
 * anglais sur un écran noté, un montant à trois décimales, un accord fautif, un
 * chiffre juste des deux côtés et faux à leur rencontre. Tous vivent entre les
 * pièces, pas dedans.
 */

/** Le binaire fourni par l'image, ou celui que Playwright installe en CI. */
const CHEMIN = process.env.CHROMIUM_PATH;

export async function ouvrirNavigateur(): Promise<Browser> {
  return chromium.launch({
    ...(CHEMIN ? { executablePath: CHEMIN } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

export const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3040";

/**
 * Va sur une page et attend qu'elle soit RÉELLEMENT utilisable.
 *
 * Le rendu serveur arrive avant l'hydratation. Un clic envoyé entre les deux
 * part en soumission native du formulaire, qui recharge la page sans rien
 * faire : le parcours échouait ainsi sur l'écran d'inscription de l'élève, non
 * parce que le produit était cassé mais parce que le test cliquait trop tôt.
 */
export async function aller(page: Page, chemin: string): Promise<void> {
  const reponse = await page.goto(`${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
  if (!reponse || reponse.status() >= 400) {
    throw new Error(`${chemin} a répondu ${reponse?.status() ?? "rien"}`);
  }
  await page.waitForLoadState("networkidle");
}

/** Le texte visible de la page, espaces insécables normalisés. */
export async function texte(page: Page): Promise<string> {
  const brut = await page.locator("body").innerText();
  return brut.replace(/[  ]/g, " ");
}

/** Un e-mail unique par exécution : la base n'est pas vidée entre deux passages. */
export const unique = (prefixe: string) =>
  `${prefixe}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;
