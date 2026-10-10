import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * MATIÈRES ET DONNÉES, MESURÉES DANS LE NAVIGATEUR (lot P3).
 *
 * Ce que seule la page servie peut dire, partie comprise (NOVA niveau 3) :
 *   1. UNE SEULE ARÊTE DE MÉTIER PAR ÉCRAN : on compte, fenêtre par fenêtre, les
 *      éléments coiffés de deux pixels à la teinte calculée de `--metier` (en
 *      ombre intérieure ou en bordure de tête) ; à l'étape Situation, aucune ;
 *      à chaque étape de la feuille, une au plus, celle du panneau de décision.
 *   2. LE COURRIER POSÉ : la lettre est large (≥ 560 px sur ordinateur), posée
 *      hors de tout panneau, inclinée de moins d'un degré ; « J'ai pris note »
 *      est à son pied ; sur téléphone, pleine largeur et droite.
 *   3. LA CASCADE DU RITUEL : cinq marches, debout sur ordinateur, couchées sur
 *      téléphone ; reliées (le filet qui sort d'une marche est au niveau de
 *      celui qui entre dans la suivante) ; le résultat ancré sur la ligne du
 *      zéro ; plus de grand triangle à côté du chiffre.
 *   4. UN TOUR CLOS : une seule rangée d'onglets, le sommaire d'ancres, et pas
 *      de filet de couleur autour d'un tour.
 */

let navigateur: Browser;
let ordi: BrowserContext;
let page: Page;
let urlArene: string;

const etapes = (p: Page) => p.locator('[aria-label="Étapes de décision"] li button');

/** Les arêtes de métier : visibles dans la fenêtre (`fenetre`), ou dans toute la page affichée. */
async function aretes(p: Page, fenetre: boolean): Promise<string[]> {
  return p.evaluate((fenetre) => {
    const main = document.querySelector("main[data-ecran-de-jeu]")!;
    const sonde = document.createElement("span");
    sonde.style.color = "var(--metier)";
    main.appendChild(sonde);
    const metier = getComputedStyle(sonde).color;
    sonde.remove();
    return [...main.querySelectorAll<HTMLElement>("*")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 120 || r.height < 24) return false;
        if (fenetre && (r.bottom <= 0 || r.top >= innerHeight)) return false;
        const s = getComputedStyle(e);
        if (s.visibility === "hidden") return false;
        const parOmbre = s.boxShadow.includes(`${metier} 0px 2px 0px 0px inset`);
        const parBord = parseFloat(s.borderTopWidth) >= 2 && s.borderTopColor === metier;
        return parOmbre || parBord;
      })
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)}`);
  }, fenetre);
}

/** Le pire nombre d'arêtes vues ensemble, en balayant la page de haut en bas. */
async function pireFenetre(p: Page): Promise<string[]> {
  const hauteur = await p.evaluate(() => document.body.scrollHeight);
  const pas = Math.round((await p.evaluate(() => innerHeight)) / 3);
  let pire: string[] = [];
  for (let y = 0; y <= hauteur; y += pas) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(50);
    const a = await aretes(p, true);
    if (a.length > pire.length) pire = a;
  }
  return pire;
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordi = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  page = await ordi.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: /^Niveau 3/ }).click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
  await page.waitForLoadState("networkidle");
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("une seule arête de métier par écran", () => {
  it("à l'étape Situation, aucune : il n'y a rien à décider", async () => {
    await page.waitForTimeout(800);
    expect(await pireFenetre(page)).toEqual([]);
    expect(await aretes(page, false)).toEqual([]);
  }, 60_000);

  it("à chaque étape de la feuille, une au plus : celle du panneau de décision en cours", async () => {
    await page.evaluate(() => (window.location.hash = "decisions"));
    await page.waitForTimeout(1_200);
    await etapes(page).first().waitFor({ state: "visible", timeout: 30_000 });
    const n = await etapes(page).count();
    expect(n).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < n; i++) {
      await etapes(page).nth(i).click();
      await page.waitForTimeout(250);
      const pire = await pireFenetre(page);
      expect(pire.length, `étape ${i + 1} : ${pire.join(" + ")}`).toBeLessThanOrEqual(1);
      const toutes = await aretes(page, false);
      expect(toutes.length, `étape ${i + 1}, toute la page : ${toutes.join(" + ")}`).toBeLessThanOrEqual(1);
      // LOT P7 : le cadran du résultat estimé colle en tête de la feuille, à
      // chaque étape ; c'est LUI qui porte l'arête, jamais un panneau de décision
      // en plus.
      expect(toutes, `étape ${i + 1}`).toHaveLength(1);
      expect(toutes[0]).toMatch(/cadran-estime/);
      expect(pire[0] ?? "", `étape ${i + 1}, fenêtre`).toMatch(/cadran-estime/);
    }
    // Et les panneaux qu'on consulte sont plats : ni sol, ni ombre.
    await etapes(page).first().click();
    await page.waitForTimeout(250);
    const plats = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main .panneau-info")]
        .filter((e) => e.offsetParent !== null && !e.parentElement!.closest(".panneau-info, .panneau-decision"))
        .map((e) => {
          const s = getComputedStyle(e);
          return { fond: s.backgroundColor, ombre: s.boxShadow };
        }),
    );
    expect(plats.length).toBeGreaterThan(1);
    for (const p of plats) {
      expect(p.fond).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      expect(p.ombre).toBe("none");
    }
  }, 240_000);
});

describe("le courrier posé", () => {
  it("sur ordinateur : une lettre large, hors de tout panneau, à peine inclinée, la note à son pied", async () => {
    await etapes(page).first().click();
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    await ouvrir.click();
    await page.waitForTimeout(2_200);
    const m = await page.evaluate(() => {
      const section = document.querySelector("[data-courrier-du-tour]")!;
      const lettres = [...section.querySelectorAll<HTMLElement>(".lettre, .message")];
      const scenes = [...section.querySelectorAll<HTMLElement>(".courriers-poses > *")];
      const angle = (e: HTMLElement) => {
        const t = getComputedStyle(e).transform;
        const v = t.match(/matrix\(([^)]+)\)/)?.[1]?.split(",").map(Number);
        return v ? (Math.atan2(v[1]!, v[0]!) * 180) / Math.PI : 0;
      };
      const note = [...section.querySelectorAll("button")].find((b) => /pris note/.test(b.textContent ?? ""))!;
      const grille = section.querySelector<HTMLElement>(".courriers-poses")!;
      return {
        largeurs: lettres.map((l) => Math.round(l.getBoundingClientRect().width)),
        angles: scenes.map(angle),
        dansUnPanneau: Boolean(section.closest(".panneau-info, .panneau-decision, .carte")),
        basDesLettres: Math.max(...lettres.map((l) => l.getBoundingClientRect().bottom)),
        // L'enveloppe animée de l'ouverture ne reste pas à l'écran.
        enveloppes: [...section.querySelectorAll<HTMLElement>(".enveloppe")].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 1 && r.height > 1 && getComputedStyle(e).opacity !== "0";
        }).length,
        // LOT P7 : L'ENVELOPPE POSÉE, quand elle est là.
        courriel: lettres.length === 1 && lettres[0]!.classList.contains("message"),
        largeurLettre: lettres[0]!.offsetWidth,
        posee: (() => {
          const e = section.querySelector<HTMLElement>("[data-enveloppe-posee]");
          if (!e || e.getBoundingClientRect().width < 1) return null;
          const rabat = e.querySelector<SVGGraphicsElement>("[data-rabat]")!.getBBox();
          const corps = e.querySelector<SVGGraphicsElement>("[data-corps]")!.getBBox();
          const re = e.getBoundingClientRect();
          const rl = lettres[0]!.getBoundingClientRect();
          return {
            ecartDuRabat: Math.abs(rabat.y + rabat.height - corps.y),
            bordsDuRabat: Math.abs(rabat.x - corps.x) + Math.abs(rabat.x + rabat.width - (corps.x + corps.width)),
            chevauche: !(re.right <= rl.left || re.left >= rl.right || re.bottom <= rl.top || re.top >= rl.bottom),
            pointilles: [...e.querySelectorAll<HTMLElement>("*")].filter((x) => {
              const st = getComputedStyle(x);
              return /dashed|dotted/.test(`${st.borderTopStyle} ${st.borderLeftStyle} ${st.outlineStyle}`);
            }).length,
            cache: e.getAttribute("aria-hidden"),
          };
        })(),
        note: note.getBoundingClientRect().toJSON() as DOMRect,
        droiteDeLaGrille: grille.getBoundingClientRect().right,
      };
    });
    expect(m.dansUnPanneau, "le courrier est encore rangé dans un panneau").toBe(false);
    for (const l of m.largeurs) expect(l, "la lettre est trop étroite").toBeGreaterThanOrEqual(560);
    for (const a of m.angles) {
      expect(Math.abs(a), "la lettre n'est pas posée de biais").toBeGreaterThan(0.2);
      expect(Math.abs(a), "la lettre penche de plus d'un degré").toBeLessThanOrEqual(1);
    }
    expect(m.note.top, "« J'ai pris note » n'est pas au pied de la lettre").toBeGreaterThan(m.basDesLettres);
    expect(m.enveloppes, "l'enveloppe de l'ouverture reste à l'écran").toBe(0);
    // LOT P7 (déplacé du lot P4, qui interdisait l'enveloppe) : à 1280 et pour un
    // pli seul, l'enveloppe est posée à côté ; son rabat est ANCRÉ au corps (même
    // bord, d'un côté à l'autre), elle ne porte aucune étiquette en pointillé, ne
    // recouvre pas la lettre, et la lettre garde ses 40 rem. Un courriel n'en a pas.
    expect(m.largeurLettre, "la lettre a perdu ses 40 rem").toBeGreaterThanOrEqual(640);
    if (m.largeurs.length === 1 && !m.courriel) {
      expect(m.posee, "pas d'enveloppe à côté du pli seul").not.toBeNull();
      expect(m.posee!.ecartDuRabat, "le rabat flotte").toBeLessThanOrEqual(0.5);
      expect(m.posee!.bordsDuRabat, "le rabat déborde du corps").toBeLessThanOrEqual(0.5);
      expect(m.posee!.pointilles, "une étiquette en pointillé").toBe(0);
      expect(m.posee!.chevauche, "l'enveloppe recouvre la lettre").toBe(false);
      expect(m.posee!.cache).toBe("true");
    } else {
      expect(m.posee).toBeNull();
    }
    expect(m.note.top - m.basDesLettres).toBeLessThan(60);
    expect(Math.abs(m.note.right - m.droiteDeLaGrille)).toBeLessThanOrEqual(2);
  }, 60_000);

  it("sur téléphone : la lettre prend la largeur utile, et reste droite", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const t = await tel.newPage();
    // L'appareil retient le courrier ouvert : on le relit tel qu'il est posé.
    await t.goto(urlArene, { waitUntil: "networkidle" });
    for (let k = 0; k < 12; k++) {
      if (await t.locator("[data-courrier-du-tour] .lettre, [data-courrier-du-tour] .message").count()) break;
      const o = t.getByRole("button", { name: /Ouvrir le courrier/ }).first();
      if (await o.isVisible().catch(() => false)) {
        await o.click();
        await t.waitForTimeout(1_800);
        continue;
      }
      const s = t.getByRole("button", { name: /^(Continuer|Analyser|Décider)/ }).last();
      if (!(await s.count())) break;
      await s.click().catch(() => {});
      await t.waitForTimeout(800);
    }
    const m = await t.evaluate(() => {
      const l = document.querySelector<HTMLElement>("[data-courrier-du-tour] .lettre, [data-courrier-du-tour] .message")!;
      const scene = document.querySelector<HTMLElement>("[data-courrier-du-tour] .courriers-poses > *")!;
      return {
        largeur: l.getBoundingClientRect().width,
        transform: getComputedStyle(scene).transform,
        debord: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // LOT P7 : sur téléphone, aucune enveloppe.
        enveloppes: [...document.querySelectorAll<HTMLElement>("[data-enveloppe-posee]")].filter(
          (e) => e.getBoundingClientRect().width > 0,
        ).length,
      };
    });
    expect(m.largeur).toBeGreaterThanOrEqual(340);
    expect(m.transform).toBe("none");
    expect(m.debord).toBe(0);
    expect(m.enveloppes, "une enveloppe sur téléphone").toBe(0);
    await tel.close();
  }, 120_000);
});

describe("la cascade du verdict", () => {
  let urlRituel = "";

  /** La géométrie mesurée : les barres, les filets, la ligne du zéro. */
  const mesurer = (p: Page) =>
    p.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-ce-qui-a-fait-le-resultat] [data-marche]")].map((li) => {
        const r = (sel: string) => li.querySelector<HTMLElement>(sel)?.getBoundingClientRect().toJSON() as DOMRect | undefined;
        return {
          cle: li.dataset.marche!,
          barre: r(".cascade-barre")!,
          zero: r(".cascade-zero")!,
          entrant: r(".cascade-lien-entrant"),
          sortant: r(".cascade-lien-sortant"),
          valeur: li.lastElementChild?.textContent ?? "",
        };
      }),
    );

  it("au rituel, sur ordinateur : cinq marches debout, reliées, le résultat ancré au zéro, sans grand triangle", async () => {
    // La note du courrier, puis la dernière étape.
    const note = page.getByRole("button", { name: /pris note/ });
    if (await note.count()) await note.first().click();
    const n = await etapes(page).count();
    await etapes(page).nth(n - 1).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Valider et simuler/ }).click();
    await page.waitForTimeout(800);
    const oui = page.getByRole("button", { name: /Oui, je garde/ });
    if (await oui.count()) await oui.first().click();
    await page.waitForURL(/simule/, { timeout: 120_000 });
    urlRituel = page.url();
    await page.locator("[data-ce-qui-a-fait-le-resultat]").waitFor({ state: "visible" });
    await page.waitForTimeout(1_800);
    const m = await mesurer(page);
    expect(m.map((x) => x.cle)).toEqual(["ca", "variables", "structure", "sous-ebe", "resultat"]);
    // Debout : le chiffre d'affaires est une colonne, sur ≤ 24 px de large.
    expect(m[0]!.barre.height).toBeGreaterThan(m[0]!.barre.width);
    expect(m[0]!.barre.width).toBeLessThanOrEqual(24.5);
    // Une seule ligne du zéro, à la même hauteur dans toutes les colonnes.
    for (const x of m) expect(Math.abs(x.zero.top - m[0]!.zero.top)).toBeLessThanOrEqual(1);
    // Le chiffre d'affaires et le résultat partent du zéro.
    const zero = m[0]!.zero.top;
    expect(Math.abs(m[0]!.barre.bottom - zero)).toBeLessThanOrEqual(1.5);
    const res = m[4]!;
    const ancre = Math.min(Math.abs(res.barre.bottom - zero), Math.abs(res.barre.top - zero));
    expect(ancre, "le résultat n'est pas ancré à la ligne de base").toBeLessThanOrEqual(1.5);
    // Les marches sont reliées : le filet qui sort de l'une est à la hauteur de
    // celui qui entre dans la suivante, et ils se touchent.
    for (let i = 0; i < 4; i++) {
      const s = m[i]!.sortant!;
      const e = m[i + 1]!.entrant!;
      expect(Math.abs(s.top - e.top), `filet ${i}→${i + 1}`).toBeLessThanOrEqual(1);
      expect(Math.abs(s.right - e.left), `filet ${i}→${i + 1}`).toBeLessThanOrEqual(1);
    }
    // Plus de grand triangle : le chiffre porte son signe et sa couleur.
    const chiffre = await page.evaluate(() => {
      const p = document.querySelector<HTMLElement>("[data-chiffre-du-verdict]")!;
      return { texte: p.innerText, couleur: getComputedStyle(p).color };
    });
    expect(chiffre.texte).not.toMatch(/[▲▼]/);
    expect(chiffre.texte.trim()).toMatch(/^[+−]/);
    expect(chiffre.couleur).not.toBe("rgb(246, 243, 236)");
    expect(await page.locator("[data-temps='2'] [data-fleche-fine]").count()).toBeLessThanOrEqual(1);
  }, 180_000);

  it("au rituel, sur téléphone : la même cascade, couchée, sans débordement", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const t = await tel.newPage();
    await t.goto(urlRituel, { waitUntil: "networkidle" });
    await t.locator("[data-ce-qui-a-fait-le-resultat]").waitFor({ state: "visible" });
    await t.waitForTimeout(1_500);
    const m = await mesurer(t);
    expect(m).toHaveLength(5);
    expect(m[0]!.barre.width).toBeGreaterThan(m[0]!.barre.height);
    for (let i = 0; i < 4; i++) {
      expect(Math.abs(m[i]!.sortant!.left - m[i + 1]!.entrant!.left), `filet ${i}→${i + 1}`).toBeLessThanOrEqual(1);
    }
    const debord = await t.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debord).toBe(0);
    await tel.close();
  }, 120_000);
});

describe("un tour clos : une seule navigation", () => {
  it("une rangée d'onglets, un sommaire d'ancres, et pas de filet de couleur autour du tour", async () => {
    await page.getByRole("link", { name: /Voir les résultats/ }).first().click();
    await page.waitForURL(/\/arena\//, { timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    const tour = page.locator("#dernier-resultat");
    await tour.waitFor({ state: "visible", timeout: 30_000 });
    expect(await tour.locator('[role="tablist"]:visible').count()).toBe(1);
    const sommaire = tour.getByRole("navigation", { name: /^Résultats du / });
    const liens = await sommaire.getByRole("link").allInnerTexts();
    expect(liens.map((l) => l.trim())).toEqual(["Synthèse", "Marché", "Finance"]);
    await sommaire.getByRole("link", { name: "Finance", exact: true }).click();
    await page.waitForTimeout(900);
    const finance = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>("[data-face-du-tour='finance']")!;
      return s.getBoundingClientRect().top;
    });
    expect(finance).toBeGreaterThanOrEqual(0);
    expect(finance).toBeLessThan(260);
    const cadre = await tour.evaluate((e) => {
      const s = getComputedStyle(e);
      const numero = e.querySelector("summary > span")!;
      return {
        gauche: parseFloat(s.borderLeftWidth),
        tout: parseFloat(s.borderTopWidth) + parseFloat(s.borderRightWidth) + parseFloat(s.borderBottomWidth),
        cercle: parseFloat(getComputedStyle(numero).borderTopWidth),
        liste: Boolean(e.closest("[data-liste-des-tours]")),
      };
    });
    expect(cadre.gauche, "le tour est cerné d'un filet de couleur").toBe(0);
    expect(cadre.cercle, "le numéro du tour est cerné de couleur").toBe(0);
    expect(cadre.liste).toBe(true);
  }, 120_000);
});

describe("ajouts : le résumé collant de /jouer", () => {
  it("à 1280, il prend les bords exacts de la grille des entreprises", async () => {
    const ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
    for (const y of [0, 400]) {
      await p.evaluate((y) => window.scrollTo(0, y), y);
      await p.waitForTimeout(200);
      const m = await p.evaluate(() => {
        const barre = document.querySelector("[data-resume-de-lancement]")!.getBoundingClientRect();
        const cartes = [...document.querySelectorAll("button[aria-pressed]")]
          .map((b) => b.getBoundingClientRect())
          .filter((r) => r.width > 200);
        return {
          gauche: barre.left - Math.min(...cartes.map((r) => r.left)),
          droite: barre.right - Math.max(...cartes.map((r) => r.right)),
        };
      });
      expect(Math.abs(m.gauche), `défilement ${y} : bord gauche`).toBeLessThanOrEqual(1);
      expect(Math.abs(m.droite), `défilement ${y} : bord droit`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  }, 60_000);
});
