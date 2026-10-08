import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";
import { mesurerContraste } from "./helpers/contraste";

/**
 * « LE MARCHÉ A RÉPONDU », DANS LA SALLE.
 *
 * Ce parcours joue le moment de la séance que rien d'autre ne voit : l'écran
 * de pilotage clôt le tour et lève le rideau, et le VIDÉOPROJECTEUR — un autre
 * onglet, sur un écran de 1920 — dévoile le classement devant la classe. Ce
 * qu'on vérifie ne vit dans aucune pièce prise à part :
 *   · le rideau tient jusqu'à la révélation (rien du tour ne fuit au mur) ;
 *   · la clôture faite au pilotage déclenche la révélation au mur, sans que
 *     personne touche à ce second onglet ;
 *   · la révélation se termine d'elle-même sur un état COMPLET : toutes les
 *     équipes, leurs résultats, le podium, et plus aucune animation en cours ;
 *   · rechargée, la page montre cet état final sans rejouer quoi que ce soit ;
 *   · l'enseignant peut la rejouer, et la passer d'une touche ;
 *   · qui a demandé moins d'animation voit l'écran entier du premier coup ;
 *   · à huit mètres : aucun texte sous 18 px, aucun sous le seuil WCAG.
 */

const EMAIL = unique("prof-revelation");
const MOTDEPASSE = "Projection2026!";

let navigateur: Browser;
let seance: BrowserContext;
let prof: Page;
let mur: Page;
let urlPartie: string;
let code: string;

/** Ce que la révélation sait de son état, lu dans le navigateur. */
async function etatDuMur(page: Page) {
  return page.evaluate(() => {
    const racine = document.querySelector("[data-revelation-du-marche]");
    if (!racine) return null;
    const lignes = [...racine.querySelectorAll("[data-revelation-rang]")].map((li) => ({
      rang: Number(li.getAttribute("data-revelation-rang")),
      opacite: Number(getComputedStyle(li).opacity),
      texte: (li as HTMLElement).innerText.replace(/\s+/g, " ").trim(),
    }));
    const marches = [...racine.querySelectorAll("[data-podium] div")].map((d) =>
      [...d.classList].find((c) => /^marche-de-podium-\d$/.test(c)),
    );
    return {
      joue: racine.classList.contains("revelation"),
      animations: racine.getAnimations({ subtree: true }).filter((a) => a.playState === "running")
        .length,
      lignes,
      marches,
      podiumOpacite: Number(getComputedStyle(racine.querySelector('[data-temps="3"]')!).opacity),
    };
  });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  // LE PILOTAGE ET LE MUR SONT DEUX ONGLETS DU MÊME NAVIGATEUR, le portable de
  // l'enseignant et le vidéoprojecteur branché dessus : c'est ainsi qu'une
  // séance se tient, et c'est la condition pour que le pilotage puisse
  // prévenir le mur directement. Un contexte séparé serait un autre profil.
  seance = await navigateur.newContext();
  prof = await seance.newPage();
  mur = await seance.newPage();
  await mur.setViewportSize({ width: 1920, height: 1080 });
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("la révélation du classement en projection", () => {
  it("un enseignant crée une partie à six équipes", async () => {
    await aller(prof, "/teacher/login");
    await prof.getByRole("button", { name: "Créer un compte" }).click();
    await prof.fill('input[name="displayName"]', "Mme Projection");
    await prof.fill('input[name="schoolName"]', "Lycée du Mur");
    await prof.fill('input[name="email"]', EMAIL);
    await prof.fill('input[name="password"]', MOTDEPASSE);
    await prof.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    await prof.waitForURL(/\/teacher$/, { timeout: 60_000 });

    await prof.selectOption('select[name="humanTeamsCount"]', "2");
    await prof.selectOption('select[name="botCount"]', "4");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
  }, 180_000);

  it("une élève rejoint et valide, et le mur dit où en est le tour", async () => {
    const eleve = await (await navigateur.newContext()).newPage();
    await aller(eleve, "/join");
    await eleve.fill('input[name="code"]', code);
    await eleve.fill('input[name="pseudo"]', "Inès");
    await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
    await eleve.waitForURL(/\/arena\//, { timeout: 60_000 });
    // La feuille de décision est en étapes : on avance sans rien changer, puis
    // on valide — l'équipe assume les valeurs proposées.
    await eleve.evaluate(() => {
      location.hash = "decisions";
    });
    await eleve.waitForTimeout(1_500);
    for (let i = 0; i < 12; i += 1) {
      const suivant = eleve.getByRole("button", { name: /^Suivant/ }).first();
      if (!(await suivant.isVisible().catch(() => false))) break;
      await suivant.click();
      await eleve.waitForTimeout(300);
    }
    await eleve
      .getByRole("button", { name: /Valider les décisions de l'équipe/ })
      .click({ timeout: 30_000 });
    const garde = eleve.getByRole("button", { name: /je garde ces valeurs/ });
    if (await garde.isVisible().catch(() => false)) await garde.click();
    await eleve.waitForTimeout(2_500);
    await eleve.context().close();

    await aller(mur, `${urlPartie}/projection`);
    const vu = await texte(mur);
    expect(vu).toContain("validé");
  }, 180_000);

  it("le rideau tient : avant la révélation, rien du tour ne fuit au mur", async () => {
    await prof
      .getByRole("button", { name: /Clore le tour 1 et simuler/ })
      .click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 120_000 });

    // Le mur a appris la clôture par le pilotage ; le classement, lui, n'est
    // pas encore révélé aux élèves : il reste sous embargo.
    await aller(mur, `${urlPartie}/projection`);
    await mur.getByRole("button", { name: /Classement/ }).click();
    const vu = await texte(mur);
    expect(vu).toContain("sous embargo");
    expect(await etatDuMur(mur), "la révélation ne doit pas être rendue").toBeNull();
  }, 180_000);

  it("le classement révélé, le mur joue la révélation sans qu'on y touche", async () => {
    // Le mur est déjà ouvert ET ne reçoit aucun clic : c'est le geste fait au
    // PILOTAGE qui doit le réveiller.
    await prof.getByRole("button", { name: /Révéler le classement/ }).click({ timeout: 30_000 });
    await mur.waitForSelector("[data-revelation-du-marche]", { timeout: 120_000 });

    const pendant = await etatDuMur(mur);
    expect(pendant, "la révélation n'est pas rendue").not.toBeNull();
    // Six équipes, dans l'ordre du classement.
    expect(pendant!.lignes.map((l) => l.rang)).toEqual([1, 2, 3, 4, 5, 6]);
    // Et le podium, or, argent, bronze.
    expect(pendant!.marches).toEqual([
      "marche-de-podium-2",
      "marche-de-podium-1",
      "marche-de-podium-3",
    ]);
    expect(await texte(mur)).toContain("le marché a répondu");
  }, 180_000);

  it("elle se termine d'elle-même sur un état complet, sans animation en cours", async () => {
    // La durée est bornée : au bout de son temps, plus rien ne bouge et tout
    // est lisible. C'est l'état qu'une capture d'écran doit trouver.
    await mur.waitForFunction(
      () => {
        const r = document.querySelector("[data-revelation-du-marche]");
        return !!r && !r.classList.contains("revelation");
      },
      { timeout: 20_000 },
    );
    const final = await etatDuMur(mur);
    expect(final!.joue).toBe(false);
    expect(final!.animations, "des animations tournent encore").toBe(0);
    for (const l of final!.lignes) {
      expect(l.opacite, `ligne ${l.rang} invisible`).toBe(1);
      // Chaque ligne porte un montant : la révélation n'est pas qu'un nom.
      expect(l.texte, `ligne ${l.rang} sans montant`).toMatch(/€/);
    }
    expect(final!.podiumOpacite).toBe(1);
  }, 120_000);

  it("rechargée, elle montre l'état final sans rien rejouer", async () => {
    await aller(mur, `${urlPartie}/projection`);
    await mur.waitForSelector("[data-revelation-du-marche]", { timeout: 60_000 });
    const rouverte = await etatDuMur(mur);
    // Le tour a déjà été dévoilé dans ce navigateur : le mur ouvre sur le
    // classement complet, immobile.
    expect(rouverte!.joue).toBe(false);
    expect(rouverte!.lignes.every((l) => l.opacite === 1)).toBe(true);
    expect(rouverte!.lignes).toHaveLength(6);
  }, 120_000);

  it("l'enseignant la rejoue, et la passe d'une touche", async () => {
    await mur.getByRole("button", { name: /Rejouer la révélation/ }).click();
    await mur.waitForTimeout(200);
    expect((await etatDuMur(mur))!.joue).toBe(true);
    // Échap : la révélation s'arrête, et l'écran saute à son état final.
    await mur.keyboard.press("Escape");
    await mur.waitForTimeout(200);
    const apres = await etatDuMur(mur);
    expect(apres!.joue).toBe(false);
    expect(apres!.lignes.every((l) => l.opacite === 1)).toBe(true);
  }, 120_000);

  it("qui a demandé moins d'animation voit l'écran entier du premier coup", async () => {
    const sobre = await navigateur.newContext({
      viewport: { width: 1920, height: 1080 },
      reducedMotion: "reduce",
      storageState: await seance.storageState(),
    });
    const page = await sobre.newPage();
    await aller(page, `${urlPartie}/projection`);
    await page.getByRole("button", { name: /Classement/ }).click();
    await page.waitForSelector("[data-revelation-du-marche]", { timeout: 60_000 });
    // On la LANCE : ce navigateur a déjà vu ce tour, et une révélation qui ne
    // se joue pas ne prouverait rien du respect de la demande.
    await page.getByRole("button", { name: /Rejouer la révélation/ }).click();
    await page.waitForTimeout(150);
    // Aucune attente de plus : tout est déjà là, et aucune animation ne tourne.
    const vu = await etatDuMur(page);
    expect(vu!.joue, "la révélation ne se joue pas : la garde ne garde rien").toBe(true);
    expect(
      vu!.lignes.every((l) => l.opacite === 1),
      "des lignes sont masquées",
    ).toBe(true);
    expect(vu!.podiumOpacite).toBe(1);
    expect(vu!.animations).toBe(0);
    await sobre.close();
  }, 120_000);

  it("tient dans l'écran : un mur ne se fait pas défiler", async () => {
    // Le titre, les six équipes ET le podium doivent être là ensemble, sur un
    // vidéoprojecteur comme sur le portable d'une table ronde. Un podium sous
    // la ligne de flottaison, personne dans la salle ne le voit.
    const debords: string[] = [];
    try {
      for (const [largeur, hauteur] of [
        [1920, 1080],
        [1280, 800],
      ] as const) {
        await mur.setViewportSize({ width: largeur, height: hauteur });
        await aller(mur, `${urlPartie}/projection`);
        await mur.waitForSelector("[data-revelation-du-marche]", { timeout: 60_000 });
        const debord = await mur.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        );
        if (debord > 0) debords.push(`${largeur} × ${hauteur} : ${debord} px de trop`);
      }
    } finally {
      // Le mur retrouve sa taille même si la mesure échoue : sans cela, les
      // tests suivants mesureraient un écran de 1280 en croyant voir la salle.
      await mur.setViewportSize({ width: 1920, height: 1080 });
    }
    expect(debords, debords.join("\n")).toEqual([]);
  }, 120_000);

  it("se lit à huit mètres : rien sous 18 px, rien sous le seuil WCAG", async () => {
    await aller(mur, `${urlPartie}/projection`);
    await mur.waitForSelector("[data-revelation-du-marche]", { timeout: 60_000 });
    const petits = await mur.evaluate(() => {
      const racine = document.querySelector("[data-revelation-du-marche]")!;
      const vus: string[] = [];
      for (const el of racine.querySelectorAll("*")) {
        const t = (el as HTMLElement).innerText?.trim();
        if (!t || el.children.length > 0) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < 18) vus.push(`${px} px · ${t.slice(0, 40)}`);
      }
      return vus;
    });
    expect(petits, `textes trop petits pour la salle :\n${petits.join("\n")}`).toEqual([]);

    const mesures = await mesurerContraste(mur, "clair");
    const sous = mesures
      .filter((m) => m.ratio < m.seuil)
      .map((m) => `${m.texte} : ${m.ratio.toFixed(2)} pour ${m.seuil}`);
    expect(sous, `sous le seuil WCAG :\n${sous.join("\n")}`).toEqual([]);
  }, 120_000);
});
