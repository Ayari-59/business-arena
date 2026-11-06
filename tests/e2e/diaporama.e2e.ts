import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "playwright-core";
import { BASE, aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { FOURNISSEURS_ET_BANQUE as chapitre } from "../../src/config/cours/chapitres/fournisseurs-et-banque";
import { fichierDuDiaporama, lienDuDiaporama } from "../../src/config/cours/diaporamas";
import { espacesOrdinaires } from "../../src/lib/typographie";

/**
 * LE DIAPORAMA DE L'ENSEIGNANT, DANS LE NAVIGATEUR (config/cours/diaporamas.ts) : l'enseignant sous
 * licence voit le bouton sur la page du chapitre et télécharge un PowerPoint valide ; l'élève de sa
 * classe ouvre le même chapitre sans voir le bouton, et l'adresse directe lui répond 403. Le visiteur
 * aussi.
 */

const PAGE = `/cours/${chapitre.code}?entreprise=boutique`;
const LIEN = lienDuDiaporama(chapitre.code);

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("/cours/[chapitre] : le diaporama de l'enseignant", () => {
  it("l'enseignant voit le bouton et télécharge un fichier pptx valide ; l'élève de sa classe ne le voit pas et reçoit 403", async () => {
    const ctxProf = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", acceptDownloads: true });
    const ctxEleve = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    await enseignantSousLicence(ctxProf);
    try {
      const prof = await ctxProf.newPage();
      await aller(prof, PAGE);
      const bouton = prof.locator(`a[data-diaporama="${chapitre.code}"]`);
      expect(await bouton.count()).toBe(1);
      expect(espacesOrdinaires(await bouton.innerText())).toBe("Télécharger le diaporama");
      expect(await bouton.getAttribute("href")).toBe(`${LIEN}?entreprise=boutique`);

      const [telechargement] = await Promise.all([prof.waitForEvent("download"), bouton.click()]);
      expect(telechargement.suggestedFilename()).toBe(fichierDuDiaporama(chapitre.code));
      const octets = readFileSync((await telechargement.path())!);
      expect(octets.subarray(0, 2).toString("latin1")).toBe("PK");
      const zip = await JSZip.loadAsync(octets);
      expect(await zip.file("[Content_Types].xml")!.async("string")).toContain("presentationml.slide+xml");
      const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
      expect(slides.length).toBeGreaterThan(20);
      expect(espacesOrdinaires(await zip.file("ppt/slides/slide1.xml")!.async("string"))).toContain(espacesOrdinaires(chapitre.titre));

      // Une classe de ce parcours, que l'élève rejoint : le chapitre lui est ouvert, le diaporama non.
      await aller(prof, "/teacher/cours");
      await prof.getByLabel("Nom de la classe").fill("BTS CG diaporama e2e");
      await prof.getByLabel("Parcours du cours").selectOption(chapitre.parcours);
      await prof.getByRole("button", { name: "Créer la classe" }).click();
      await prof.waitForURL(/\/teacher\/cours\/[0-9a-f-]{36}/, { timeout: 60_000 });
      const code = (await prof.locator("[data-code-de-classe]").innerText().then(espacesOrdinaires)).trim();

      const eleve = await ctxEleve.newPage();
      await aller(eleve, `/cours/rejoindre?code=${code}`);
      await eleve.getByLabel("Prénom ou pseudonyme").fill("Lou");
      await eleve.getByRole("button", { name: "Rejoindre la classe" }).click();
      await eleve.waitForURL(/\/cours\?classe=rejointe/, { timeout: 60_000 });
      await aller(eleve, PAGE);
      expect(await eleve.locator("h1").count()).toBeGreaterThan(0);
      expect(await eleve.getByText("Ce chapitre est réservé").count()).toBe(0);
      expect(await eleve.locator("[data-diaporama]").count()).toBe(0);
      expect(await eleve.getByText("Télécharger le diaporama").count()).toBe(0);
      const direct = await ctxEleve.request.get(`${BASE}${LIEN}?entreprise=boutique`, { maxRedirects: 0 });
      expect(direct.status()).toBe(403);
      expect(direct.headers()["content-type"] ?? "").not.toContain("presentation");

      // Le visiteur, sans compte ni classe : 403 aussi.
      const visiteur = await navigateur.newContext();
      const r = await visiteur.request.get(`${BASE}${LIEN}`, { maxRedirects: 0 });
      await visiteur.close();
      expect(r.status()).toBe(403);
    } finally {
      await ctxProf.close();
      await ctxEleve.close();
    }
  });
});
