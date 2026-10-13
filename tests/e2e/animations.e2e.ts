import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { ATELIERS } from "../../src/config/ateliers";
import { chargeDesSeances } from "../../src/config/ateliers/duree-des-seances";
import { adaptationsDuNiveau } from "../../src/config/ateliers/adaptations";
import {
  entreprisesEtFormations,
  formationsServiesEnPlus,
  sertEnClair,
} from "../../src/config/scenarios/formations-servies";
import { SUR_MESURE } from "../../src/config/sur-mesure";

/**
 * LES ATELIERS, APRÈS L'AUDIT D'OCTOBRE 2026 : la liste dit les formations que
 * chaque entreprise sert, la fiche dit ce que chaque tour demande et comment
 * adapter le niveau, et les situations sur mesure ont leur encart. Tout ce qui
 * s'affiche se lit dans les registres : le test compare au registre, jamais à
 * une phrase figée.
 */
let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
});

afterAll(async () => {
  await navigateur?.close();
});

describe("la liste des ateliers", () => {
  it("dit, par entreprise, les ateliers et les formations servies, puis l'encart sur mesure", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await aller(page, "/animations");
    const vu = await texte(page);
    expect(vu).toContain("Une même entreprise, plusieurs formations");
    for (const { scenario, formations } of entreprisesEtFormations()) {
      expect(vu, `${scenario.code} absent de la section`).toContain(scenario.playerTeamName);
      if (formations.length > 0) expect(vu, `${scenario.code} : formations servies`).toContain(sertEnClair(formations));
    }
    const lignes = await page.locator("[data-entreprises-et-formations] > li").count();
    expect(lignes).toBe(entreprisesEtFormations().length);
    // L'encart sur mesure, avec ses deux gestes.
    expect(vu).toContain(SUR_MESURE.titre);
    expect(vu).toContain(SUR_MESURE.delai.titre);
    const encart = page.locator("[data-sur-mesure]");
    expect(await encart.count()).toBe(1);
    expect(await encart.locator(`a[href="${SUR_MESURE.appel.rendezVous.href}"]`).count()).toBe(1);
    expect(await encart.locator(`a[href="${SUR_MESURE.appel.devis.href}"]`).count()).toBe(1);
    // Le tableau porte les formations servies sous chaque entreprise.
    expect((vu.match(/Sert : /g) ?? []).length).toBeGreaterThanOrEqual(ATELIERS.length);
  });
});

describe("la fiche d'un atelier", () => {
  it("écrit ce que chaque tour demande, les deux crans voisins, et les formations que l'entreprise sert aussi", async () => {
    const cg1 = ATELIERS.find((a) => a.code === "cg1")!;
    await page.setViewportSize({ width: 1280, height: 900 });
    await aller(page, "/animations/cg1");
    const vu = await texte(page);
    // Une ligne par séance jouée, avec les deux chiffres du registre.
    const lignes = page.locator("[data-tour-demande]");
    const charge = chargeDesSeances(cg1);
    expect(await lignes.count()).toBe(charge.length);
    for (const [i, c] of charge.entries()) {
      const ligne = await lignes.nth(i).innerText();
      expect(ligne).toContain(`Le tour demande ≈ ${c.estimation.minutes} min`);
      expect(ligne).toContain(`le déroulé lui en donne ${c.minutesDeJeu}`);
    }
    // Adapter le niveau : un cran plus bas, un cran plus haut.
    expect(vu).toContain("Adapter le niveau");
    const { bas, haut } = adaptationsDuNiveau(cg1);
    const carteBas = await page.locator('[data-adaptation="bas"]').innerText();
    expect(carteBas).toContain(`niveau ${bas!.niveau} · ${bas!.niveauNom}`);
    for (const l of bas!.ferme) expect(carteBas.toLowerCase()).toContain(l.toLowerCase());
    const carteHaut = await page.locator('[data-adaptation="haut"]').innerText();
    expect(carteHaut).toContain(`niveau ${haut!.niveau} · ${haut!.niveauNom}`);
    expect(carteHaut).toContain(haut!.bascule!.vers);
    // L'entreprise sert aussi d'autres formations.
    const aussi = formationsServiesEnPlus(cg1);
    expect(aussi.length).toBeGreaterThan(0);
    expect(await page.locator("[data-sert-aussi]").innerText()).toContain(sertEnClair(aussi));
    // Le créneau conseillé et son découpage.
    expect(await page.locator("[data-creneau-conseille]").count()).toBe(cg1.creneauConseille ? 1 : 0);
  });

  it("une fiche de concours dit qu'elle ne s'adapte pas", async () => {
    const campus = ATELIERS.find((a) => a.reglages.concours)!;
    await aller(page, `/animations/${campus.code}`);
    expect(await page.locator("[data-adaptation-aucune]").count()).toBe(1);
  });
});
