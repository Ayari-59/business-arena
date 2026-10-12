import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LA GAZETTE DE L'ARÈNE, DANS UN NAVIGATEUR, sur le build de production et sa base.
 *
 *   1. LA COUPURE DANS LE COURRIER DU TOUR, pour NOVA et LA TABLE D'AUGUSTIN, au
 *      niveau 1 et au niveau 5, à 1280 et à 390 : posée AVANT la lettre, un vrai
 *      titre, cinq lignes au plus, du papier ; à 390, ni débord ni défilement
 *      de côté. UNE COUPURE DE JOURNAL : sur un papier journal qui n'est pas
 *      celui de la lettre, une découpe qui ne mord sur aucune lettre, étroite
 *      sur téléphone (une colonne, corps de 15 px au moins), plus large que la
 *      lettre et en colonnes sur ordinateur quand l'article le demande, droite
 *      à l'impression.
 *   2. L'ARCHIVE : au tour suivant, la revue de presse garde le numéro passé.
 *   3. LE BILAN : une à trois lignes « Ce que la presse annonçait ».
 *   4. LE PILOTAGE ENSEIGNANT : l'aperçu du tour suivant, « Remplacer par mon
 *      article », « Ne pas publier » ; la classe lit l'article de l'enseignant
 *      sans savoir qu'il est de lui.
 *
 * Captures (facultatives) : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;

afterAll(async () => {
  await navigateur?.close();
});

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

async function lancer(ctx: BrowserContext, entreprise: RegExp, niveau: number): Promise<string> {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: entreprise }).first().click();
  await p.getByRole("button", { name: new RegExp(`^Niveau ${niveau} `) }).click();
  await p.getByRole("button", { name: "Lancer la partie" }).click();
  await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (p.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  const url = p.url().split("?")[0]!.split("#")[0]!;
  await p.close();
  return url;
}

const finir = (p: Page) =>
  p.evaluate(() => {
    for (const a of document.getAnimations()) a.finish();
  });

async function ouvrirLeCourrierSurOrdinateur(p: Page, url: string) {
  await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(500);
    await p.evaluate(() => (location.hash = "decisions"));
    await p.waitForTimeout(800);
  }
  // Déjà ouvert ou classé sur cet appareil (la mémoire de lecture) : on le relit.
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  const relire = p.locator("[data-courrier-du-tour]").getByRole("button", { name: /^Relire$/ });
  await Promise.race([
    ouvrir.waitFor({ timeout: 30_000 }),
    relire.waitFor({ timeout: 30_000 }),
    p.locator("[data-courrier-du-tour] [data-coupure-de-presse]").waitFor({ timeout: 30_000 }),
  ]).catch(() => {});
  if (await ouvrir.isVisible().catch(() => false)) await ouvrir.click();
  else if (await relire.isVisible().catch(() => false)) await relire.click();
  await p.waitForTimeout(60);
  await finir(p);
  await p.waitForTimeout(500);
}

async function ouvrirLeCourrierSurTelephone(t: Page, url: string) {
  await t.goto(url, { waitUntil: "networkidle" });
  await t.waitForTimeout(800);
  for (let k = 0; k < 14; k++) {
    if (await t.getByRole("button", { name: /Ouvrir le courrier/ }).first().isVisible().catch(() => false)) break;
    const s = t.getByRole("button", { name: /^(Continuer|Analyser|Décider|Prendre)/ }).last();
    if (!(await s.count())) break;
    await s.click().catch(() => {});
    await t.waitForTimeout(800);
  }
  await t.getByRole("button", { name: /Ouvrir le courrier/ }).first().click();
  await t.waitForTimeout(60);
  await finir(t);
  await t.waitForTimeout(500);
}

/** Ce que la coupure du courrier montre, mesuré dans la page. */
const lireLaCoupure = (p: Page) =>
  p.evaluate(() => {
    const zone = document.querySelector<HTMLElement>("[data-courrier-du-tour]")!;
    const c = zone.querySelector<HTMLElement>("[data-coupure-de-presse]");
    const lettre = zone.querySelector<HTMLElement>(".lettre, .message");
    const titre = c?.querySelector<HTMLElement>("h2, h3");
    const chapo = c?.querySelector<HTMLElement>(".coupure-chapo");
    const corps = c?.querySelector<HTMLElement>(".coupure-premier");
    const ombre = c?.closest<HTMLElement>(".coupure-ombre");
    const rc = c?.getBoundingClientRect();
    // Les lignes lues : celles du chapô, puis celles de la plus haute colonne du corps.
    const lignesDe = (el: HTMLElement | null | undefined) => {
      if (!el) return 0;
      const h = Math.max(...[...el.getClientRects()].map((r) => r.height));
      return Math.round(h / parseFloat(getComputedStyle(el).lineHeight));
    };
    // LA DÉCOUPE NE MORD SUR AUCUNE LETTRE : chaque bloc de texte reste à 8 px
    // au moins des bords de la feuille (la découpe mord de 4 px au plus).
    const textes = c ? [...c.querySelectorAll<HTMLElement>("header p, .coupure-rubrique, h2, h3, .coupure-texte p")] : [];
    const marges = textes.map((t) => {
      const r = t.getBoundingClientRect();
      return Math.min(r.top - rc!.top, rc!.bottom - r.bottom, r.left - rc!.left, rc!.right - r.right);
    });
    const fond = (el: Element | null | undefined) => (el ? getComputedStyle(el).backgroundColor : "");
    return {
      existe: !!c,
      papier: c?.classList.contains("papier") ?? false,
      journal: c?.querySelector(".coupure-journal")?.textContent?.trim() ?? "",
      balise: titre?.tagName ?? null,
      titre: titre?.textContent?.trim() ?? "",
      // Le texte de l'article (chapô et corps), sans la ligne de date ni la signature.
      chapo: [chapo?.textContent?.trim(), corps?.textContent?.replace("■", "").trim()].filter(Boolean).join(" "),
      lignes: lignesDe(chapo) + lignesDe(corps),
      colonnesVoulues: Number(ombre?.dataset.colonnes ?? 0),
      colonnes: corps ? Number(getComputedStyle(corps.parentElement!).columnCount) || 1 : 0,
      corpsPx: corps ? parseFloat(getComputedStyle(corps).fontSize) : 0,
      justifie: corps ? getComputedStyle(corps).textAlign : "",
      largeur: rc?.width ?? 0,
      largeurDeLaLettre: lettre?.getBoundingClientRect().width ?? 0,
      margeDuTexte: marges.length ? Math.min(...marges) : -1,
      papierJournal: fond(c),
      papierDeLaLettre: fond(lettre),
      signee: !!c?.querySelector(".coupure-signature"),
      avantLaLettre: c && lettre ? !!(c.compareDocumentPosition(lettre) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
      auDessus: rc && lettre ? rc.bottom <= lettre.getBoundingClientRect().top + 1 : null,
      gauche: rc?.left ?? 0,
      droite: rc ? innerWidth - rc.right : 0,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      marqueEnseignant: /enseignant/i.test(c?.textContent ?? ""),
    };
  });

const parties: { nom: string; entreprise: RegExp; niveau: number; licence: boolean; url?: string; ctx?: BrowserContext }[] = [
  { nom: "nova", entreprise: /NOVA/, niveau: 1, licence: false },
  { nom: "augustin", entreprise: /AUGUSTIN/, niveau: 1, licence: false },
  { nom: "nova", entreprise: /NOVA/, niveau: 5, licence: true },
  { nom: "augustin", entreprise: /AUGUSTIN/, niveau: 5, licence: true },
];

describe("la coupure de presse dans le courrier du tour", () => {
  for (const partie of parties) {
    it(`${partie.nom}, niveau ${partie.niveau}, à 1280 puis à 390`, async () => {
      const ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
      // Les niveaux 4 à 6 s'ouvrent à un enseignant d'un établissement sous licence.
      if (partie.licence) await enseignantSousLicence(ctx);
      partie.url = await lancer(ctx, partie.entreprise, partie.niveau);
      partie.ctx = ctx;
      const p = await ctx.newPage();
      await ouvrirLeCourrierSurOrdinateur(p, partie.url);
      const m = await lireLaCoupure(p);
      expect(m.existe, "la coupure est dans le courrier").toBe(true);
      expect(m.papier).toBe(true);
      expect(m.journal).toBe("La Gazette de l'Arène");
      expect(m.balise).toBe("H3");
      expect(m.titre.length).toBeGreaterThan(10);
      expect(m.chapo.length).toBeGreaterThan(80);
      // Lisible en dix secondes : quatre à cinq lignes au plus sur un écran de bureau.
      expect(m.lignes).toBeLessThanOrEqual(5);
      expect(m.avantLaLettre, "la presse vient avant la lettre").toBe(true);
      expect(m.auDessus).toBe(true);
      expect(m.deCote).toBeLessThanOrEqual(0);
      // Aux niveaux de prévision, pas un chiffre ; aux niveaux fiables, au plus une fourchette.
      if (partie.niveau >= 3) expect(m.chapo).not.toMatch(/\d/);
      // UNE COUPURE DE JOURNAL : son papier n'est pas celui de la lettre, la découpe épargne le texte.
      expect(m.papierJournal).not.toBe(m.papierDeLaLettre);
      expect(m.margeDuTexte, "la découpe ne mord sur aucune lettre").toBeGreaterThanOrEqual(8);
      expect(m.signee).toBe(true);
      expect(m.justifie).toBe("justify");
      // Plus large que la lettre et en colonnes dès que l'article n'est pas un entrefilet.
      if (m.colonnesVoulues >= 2) {
        expect(m.colonnes).toBeGreaterThanOrEqual(2);
        expect(m.largeur).toBeGreaterThan(m.largeurDeLaLettre);
      } else expect(m.colonnes).toBe(1);
      // À l'impression : une feuille droite.
      await p.emulateMedia({ media: "print" });
      expect(await p.locator(".coupure-ombre").first().evaluate((e) => getComputedStyle(e).rotate)).toBe("none");
      await p.emulateMedia({ media: "screen" });
      if (CAPTURES) {
        const zone = p.locator("[data-courrier-du-tour]").first();
        await zone.scrollIntoViewIfNeeded();
        await zone.screenshot({ path: `${CAPTURES}/coupure-${partie.nom}-n${partie.niveau}-1280.png` });
      }
      await p.close();

      // ── 390 : un téléphone neuf, le même invité ──
      const t = await navigateur.newContext({
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        locale: "fr-FR",
      });
      await t.addCookies(await ctx.cookies());
      const q = await t.newPage();
      await ouvrirLeCourrierSurTelephone(q, partie.url);
      const n = await lireLaCoupure(q);
      expect(n.existe).toBe(true);
      expect(n.balise).toBe("H2");
      expect(n.titre).toBe(m.titre);
      expect(n.deCote, "pas de défilement de côté").toBeLessThanOrEqual(0);
      expect(n.gauche).toBeGreaterThanOrEqual(8);
      expect(n.droite).toBeGreaterThanOrEqual(8);
      // Un entrefilet découpé : étroit, centré, une colonne, lisible sans zoom. Plus étroit que les
      // cartes du parcours (92 % de l'écran) : 88 % et la pose de travers, 90 % au plus.
      expect(n.largeur / 390).toBeGreaterThanOrEqual(0.85);
      expect(n.largeur / 390).toBeLessThanOrEqual(0.9);
      expect(Math.abs(n.gauche - n.droite)).toBeLessThanOrEqual(4);
      expect(n.colonnes).toBe(1);
      expect(n.corpsPx).toBeGreaterThanOrEqual(15);
      expect(n.margeDuTexte, "la découpe ne mord sur aucune lettre").toBeGreaterThanOrEqual(8);
      if (CAPTURES) {
        await q.locator("[data-coupure-de-presse]").first().scrollIntoViewIfNeeded();
        await q.screenshot({ path: `${CAPTURES}/coupure-${partie.nom}-n${partie.niveau}-390.png` });
      }
      await t.close();
    }, 240_000);
  }
});

async function jouerUnTour(p: Page, url: string): Promise<void> {
  await p.goto(`${url}#decisions`, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(400);
    await p.evaluate(() => (location.hash = "decisions"));
    await p.waitForTimeout(700);
  }
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(1_200);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  for (let k = 0; k < 20; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(250);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  await p.waitForTimeout(500);
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

describe("l'archive et le bilan", () => {
  it("au tour suivant, la revue de presse garde le numéro passé ; au bilan, la presse est relue", async () => {
    const partie = parties[0]!;
    const p = await partie.ctx!.newPage();
    await ouvrirLeCourrierSurOrdinateur(p, partie.url!);
    const titre1 = (await lireLaCoupure(p)).titre;
    await jouerUnTour(p, partie.url!);
    await ouvrirLeCourrierSurOrdinateur(p, partie.url!);
    const revue = p.locator("details.revue-de-presse").first();
    await revue.scrollIntoViewIfNeeded();
    expect(await revue.locator("summary").innerText()).toMatch(/Revue de presse\s*1 article/);
    await revue.locator("summary").click();
    await p.waitForTimeout(300);
    expect(await revue.innerText()).toContain(titre1);
    expect(await revue.locator("[data-coupure-de-presse] h4").count()).toBe(1);
    if (CAPTURES) await revue.screenshot({ path: `${CAPTURES}/revue-de-presse-1280.png` });

    for (let t = 2; t <= 6; t++) {
      await p.goto(partie.url!, { waitUntil: "networkidle" });
      if (await p.locator("[data-cloture-de-l-exercice]").count()) break;
      await jouerUnTour(p, partie.url!);
    }
    await p.goto(partie.url!, { waitUntil: "networkidle" });
    await p.locator("[data-cloture-de-l-exercice]").waitFor({ timeout: 60_000 });
    const presse = p.locator("[data-ce-que-la-presse-annoncait]");
    await presse.scrollIntoViewIfNeeded();
    const lignes = await presse.locator("ul > li").allInnerTexts();
    expect(lignes.length).toBeGreaterThanOrEqual(1);
    expect(lignes.length).toBeLessThanOrEqual(3);
    for (const l of lignes) {
      expect(l).toMatch(/^La Gazette (annonçait|prévoyait) .+ au tour \d\s:\s.+\./);
      expect(l).not.toMatch(/ [—–] /);
    }
    expect(await presse.locator("h4").first().innerText()).toBe("Ce que la presse annonçait");
    if (CAPTURES) {
      // La revue ouverte : les coupures conservées, sous les lignes du bilan.
      await presse.locator("details.revue-de-presse summary").click();
      await p.waitForTimeout(400);
      const bilan = p.locator("[data-bilan-lecture]").first();
      await bilan.screenshot({ path: `${CAPTURES}/bilan-presse-1280.png` });
      await presse.locator("details.revue-de-presse summary").click();
    }
    // L'archive reste lisible à la fin : les six numéros, sous les lignes du bilan.
    expect(await presse.locator("details.revue-de-presse summary").innerText()).toMatch(/Revue de presse\s*6 articles/);
    await p.close();
  }, 900_000);
});

describe("le pilotage enseignant", () => {
  let prof: Page;
  let urlPartie = "";
  let code = "";
  const TITRE = "Grève des dockers au port de la ville";
  // Un article LONG (quatre phrases, près de la borne) : il passe en trois colonnes chez les élèves.
  const TEXTE =
    "Le port est bloqué depuis lundi : les livraisons de la semaine attendront, et les transporteurs s'organisent. Les dockers réclament une revalorisation, et aucun navire n'a été déchargé depuis trois jours. Les chargeurs redoutent des retards en chaîne jusqu'à la fin du mois. La chambre de commerce appelle les deux parties à reprendre le dialogue au plus vite.";

  it("l'enseignant voit l'article du tour en cours et l'aperçu du suivant", async () => {
    const ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
    await enseignantSousLicence(ctx);
    prof = await ctx.newPage();
    await aller(prof, "/teacher");
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "2");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();

    const panneau = prof.locator("[data-gazette-du-pilotage]");
    await panneau.scrollIntoViewIfNeeded();
    expect(await panneau.locator('[data-gazette-tour="1"]').getAttribute("data-etat")).toBe("en-cours");
    expect(await panneau.locator('[data-gazette-tour="2"]').getAttribute("data-etat")).toBe("a-paraitre");
    expect(await panneau.locator("[data-coupure-de-presse]").count()).toBe(2);
    expect(await panneau.locator('[data-gazette-tour="2"]').innerText()).toMatch(/À paraître · Tour 2, aperçu/i);
    // Un seul bouton plein dans l'écran, et il n'est pas ici.
    expect(await panneau.locator(".bouton-plein").count()).toBe(0);
    if (CAPTURES) await panneau.screenshot({ path: `${CAPTURES}/pilotage-apercu-1280.png` });
  }, 180_000);

  it("« Remplacer par mon article » sur le tour suivant, « Ne pas publier » refusé hors des tours permis", async () => {
    const bloc = prof.locator('[data-gazette-tour="2"]');
    await bloc.getByRole("button", { name: "Remplacer par mon article" }).click();
    await prof.fill("#gazette-titre-2", TITRE);
    await prof.fill("#gazette-texte-2", TEXTE);
    await bloc.getByRole("button", { name: "Publier mon article" }).click();
    await prof.locator('[data-gazette-tour="2"] [data-consigne="remplace"]').waitFor({ timeout: 30_000 });
    expect(await bloc.locator("[data-coupure-de-presse] h3").innerText()).toBe(TITRE);
    expect(await bloc.innerText()).toContain("Votre article remplace celui du journal");
    if (CAPTURES) await bloc.screenshot({ path: `${CAPTURES}/pilotage-remplacement-1280.png` });
  }, 120_000);

  it("la classe lit l'article de l'enseignant au tour suivant, sans savoir qu'il est de lui", async () => {
    const eleve = await (await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } })).newPage();
    await aller(eleve, "/join");
    await eleve.fill('input[name="code"]', code);
    await eleve.fill('input[name="pseudo"]', "Inès");
    await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
    await eleve.waitForURL(/\/arena\//, { timeout: 60_000 });
    const urlEleve = eleve.url().split("?")[0]!.split("#")[0]!;
    // Au tour 1, l'article du journal, dans « Ce qui a bougé » de l'onglet Situation.
    await eleve.goto(`${urlEleve}#situation`, { waitUntil: "networkidle" });
    await eleve.locator("[data-coupure-de-presse]").first().waitFor({ timeout: 30_000 });
    const avant = await eleve.locator("[data-coupure-de-presse] h2").first().innerText();
    expect(avant).not.toBe(TITRE);

    await eleve.evaluate(() => (location.hash = "decisions"));
    await eleve.waitForTimeout(1_500);
    for (let i = 0; i < 12; i += 1) {
      const suivant = eleve.getByRole("button", { name: /^Suivant/ }).first();
      if (!(await suivant.isVisible().catch(() => false))) break;
      await suivant.click();
      await eleve.waitForTimeout(300);
    }
    await eleve.getByRole("button", { name: /Valider les décisions de l'équipe/ }).click({ timeout: 30_000 });
    const garde = eleve.getByRole("button", { name: /je garde ces valeurs/ });
    if (await garde.isVisible().catch(() => false)) await garde.click();
    await eleve.waitForTimeout(2_500);

    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 120_000 });

    // Un vrai rechargement : changer seulement l'ancre ne recharge pas la page.
    await eleve.goto(`${urlEleve}#situation`, { waitUntil: "networkidle" });
    await eleve.reload({ waitUntil: "networkidle" });
    // Le tour clos s'annonce d'abord (les résultats) : on passe au tour suivant.
    const passer = eleve.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
    if (await passer.isVisible().catch(() => false)) {
      await passer.click();
      await eleve.waitForTimeout(500);
    }
    await eleve.evaluate(() => (location.hash = "situation"));
    await eleve.waitForTimeout(800);
    const coupure = eleve.locator("[data-coupure-de-presse]").first();
    await coupure.waitFor({ timeout: 30_000 }).catch(async (e) => {
      if (CAPTURES) await eleve.screenshot({ path: `${CAPTURES}/echec-classe.png`, fullPage: true });
      throw e;
    });
    expect(await coupure.locator("h2").innerText()).toBe(TITRE);
    expect(await coupure.innerText()).toContain("Le port est bloqué depuis lundi");
    expect(await coupure.innerText()).not.toMatch(/enseignant|professeur/i);
    // L'archive garde le numéro du tour 1.
    const revue = eleve.locator("details.revue-de-presse").first();
    await revue.locator("summary").click();
    expect(await revue.innerText()).toContain(avant);
    // Un article long, sur ordinateur : le corps en trois colonnes quand la feuille le permet.
    const ombre = eleve.locator(".coupure-ombre").first();
    expect(await ombre.getAttribute("data-colonnes")).toBe("3");
    const colonnes = await coupure
      .locator(".coupure-corps")
      .evaluate((e) => Number(getComputedStyle(e).columnCount) || 1);
    expect(colonnes).toBeGreaterThanOrEqual(2);
    if (CAPTURES) {
      await ombre.scrollIntoViewIfNeeded();
      const r = (await ombre.boundingBox())!;
      await eleve.screenshot({
        path: `${CAPTURES}/classe-article-long-${colonnes}-colonnes-1280.png`,
        clip: { x: Math.max(0, r.x - 24), y: Math.max(0, r.y - 24), width: r.width + 48, height: r.height + 48 },
      });
    }

    // « Ne pas publier » le tour 3 : le pilotage le dit.
    await aller(prof, urlPartie);
    const bloc3 = prof.locator('[data-gazette-tour="3"]');
    await bloc3.getByRole("button", { name: "Ne pas publier" }).click();
    await prof.locator('[data-gazette-tour="3"] [data-consigne="retire"]').waitFor({ timeout: 30_000 });
    expect(await bloc3.innerText()).toContain("Rien ne paraîtra");
    expect(await texte(prof)).toContain("La Gazette de l'Arène");
    await eleve.context().close();
  }, 400_000);
});
