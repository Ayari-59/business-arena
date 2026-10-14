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
 *   3. LE PARTAGE DES VENTES AU VERDICT (lot P8, piste A, qui remplace la
 *      cascade debout du lot P3) : au rituel 1280 et 390 comme au tour clos,
 *      la barre des ventes = le chiffre d'affaires ; la barre des coûts = la
 *      somme des trois postes, chacun dans sa teinte distincte ; le reste finit
 *      pile sous la fin des ventes, ou le manque est au-delà ; le résultat se
 *      voit (barre ou marqueur) et s'écrit en mots ; chaque poste a son nom et
 *      son montant signé dans la légende ; aucun montant tronqué dans une
 *      barre ; les boutons du rituel restent dans la fenêtre ; plus de grand
 *      triangle à côté du chiffre.
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

describe("le partage des ventes au verdict (lot P8, piste A : « où sont passés vos … € de ventes ? »)", () => {
  let urlRituel = "";

  /** Ce que le navigateur a dessiné : les deux barres, le trait, la légende, la phrase. */
  const mesurer = (p: Page, racine = "[data-ce-qui-a-fait-le-resultat]") =>
    p.evaluate((racine) => {
      // Le partage affiché (une copie repliée ou masquée n'a pas de boîte).
      const R = [...document.querySelectorAll<HTMLElement>(racine)].find(
        (e) => e.getBoundingClientRect().height > 0,
      )!;
      const r = (el: Element | null | undefined) =>
        el ? (el.getBoundingClientRect().toJSON() as DOMRect) : null;
      const euros = (t: string | null | undefined) => {
        const n = Number((t ?? "").replace(/[^\d]/g, ""));
        return /^\s*[−-]/.test(t ?? "") ? -n : n;
      };
      const etiquettes = [...R.querySelectorAll<HTMLElement>(".partage-troncon")].flatMap((t) =>
        [...t.querySelectorAll<HTMLElement>(".partage-etiquette, .partage-etiquette-solde")]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => ({ boite: r(e)!, barre: r(t)!, texte: e.textContent ?? "", deborde: e.scrollWidth > e.clientWidth + 1 })),
      );
      return {
        dessin: r(R.querySelector(".partage-dessin"))!,
        question: R.querySelector(".partage-question")?.textContent ?? "",
        ventes: r(R.querySelector("[data-barre-ventes]"))!,
        couleurVentes: getComputedStyle(R.querySelector("[data-barre-ventes]")!).backgroundColor,
        segments: [...R.querySelectorAll<HTMLElement>("[data-segment]")].map((s) => ({
          cle: s.dataset.segment!,
          boite: r(s)!,
          couleur: getComputedStyle(s).backgroundColor,
        })),
        reste: r(R.querySelector("[data-reste]")),
        couleurReste: R.querySelector("[data-reste]") ? getComputedStyle(R.querySelector("[data-reste]")!).backgroundColor : null,
        manque: r(R.querySelector("[data-manque]")),
        fin: r(R.querySelector("[data-fin-des-ventes]"))!,
        marqueur: R.querySelector("[data-partage]")!.hasAttribute("data-marqueur"),
        postes: [...R.querySelectorAll<HTMLElement>("[data-legende] [data-poste]")].map((li) => ({
          cle: li.dataset.poste!,
          nom: li.querySelector(".partage-poste-nom")?.textContent ?? "",
          montant: li.querySelector("[data-montant]")?.textContent ?? "",
          euros: euros(li.querySelector("[data-montant]")?.textContent),
          tabulaires: getComputedStyle(li.querySelector("[data-montant]")!).fontVariantNumeric,
          pastille: getComputedStyle(li.querySelector(".partage-pastille")!).backgroundColor,
        })),
        conclusion: R.querySelector("[data-lecture-du-resultat] .partage-phrase")?.textContent ?? "",
        resultat: euros(R.querySelector("[data-lecture-du-resultat] [data-montant]")?.textContent),
        marge: R.querySelector("[data-marge]")?.textContent ?? "",
        etiquettes,
        debord: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    }, racine);

  /** Les règles du partage, les mêmes partout où il est posé (rituel, tour clos), sur ordinateur et téléphone. */
  function verifierLePartage(m: Awaited<ReturnType<typeof mesurer>>) {
    const ca = Number(m.question.replace(/[^\d]/g, ""));
    const couts = -m.postes.reduce((s, p) => s + p.euros, 0);
    // Le compte tient, à l'euro près (chaque montant affiché est arrondi) : CA − coûts = résultat.
    expect(Math.abs(ca - couts - m.resultat), "CA − coûts = résultat").toBeLessThanOrEqual(2);
    // L'échelle : une même origine, le plus grand des deux totaux au bout.
    const origine = m.dessin.left;
    const largeur = m.dessin.width;
    const total = Math.max(ca, couts);
    const px = (euros: number) => (euros / total) * largeur;
    expect(Math.abs(m.ventes.left - origine)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.segments[0]!.boite.left - origine)).toBeLessThanOrEqual(1);
    // LA BARRE DES VENTES = LE CHIFFRE D'AFFAIRES.
    expect(Math.abs(m.ventes.width - px(ca)), "barre des ventes").toBeLessThanOrEqual(2);
    // LA SOMME DES SEGMENTS = LES COÛTS : la barre des coûts finit à leur total.
    expect(m.segments.map((s) => s.cle)).toEqual(["variables", "structure", "sous-ebe"].slice(0, m.segments.length));
    expect(Math.abs(m.segments.at(-1)!.boite.right - origine - px(couts)), "fin des coûts").toBeLessThanOrEqual(3.5);
    for (let i = 1; i < m.segments.length; i++) {
      // Jointifs, à l'espace de 2 px près.
      expect(m.segments[i]!.boite.left - m.segments[i - 1]!.boite.right).toBeLessThanOrEqual(2.5);
      expect(m.segments[i]!.boite.width, "un segment garde 3 px").toBeGreaterThanOrEqual(2.9);
    }
    // Le trait de fin des ventes.
    expect(Math.abs(m.fin.left + m.fin.width / 2 - m.ventes.right)).toBeLessThanOrEqual(1.5);
    expect(m.fin.top).toBeLessThanOrEqual(m.ventes.top);
    expect(m.fin.bottom).toBeGreaterThanOrEqual(m.segments[0]!.boite.bottom);
    // CHAQUE POSTE SA TEINTE : trois teintes distinctes, distinctes des ventes, du vert et du rouge.
    const teintes = m.segments.map((s) => s.couleur);
    expect(new Set(teintes).size).toBe(teintes.length);
    for (const t of teintes) expect([m.couleurVentes, "rgb(60, 207, 126)", "rgb(255, 112, 112)"]).not.toContain(t);
    // LA LÉGENDE : chaque poste, sa pastille à la teinte de son segment, son nom, son montant signé, tabulaire.
    expect(m.postes.map((p) => p.cle)).toEqual(["variables", "structure", "sous-ebe"]);
    for (const p of m.postes) {
      expect(p.nom.length, p.cle).toBeGreaterThan(5);
      expect(p.montant.trim(), p.cle).toMatch(/^[−+]?\d/);
      if (p.euros !== 0) expect(p.montant.trim(), p.cle).toMatch(/^−/);
      expect(p.tabulaires).toContain("tabular-nums");
      const s = m.segments.find((x) => x.cle === p.cle);
      if (s) expect(p.pastille, p.cle).toBe(s.couleur);
    }
    // LE RESTE finit pile sous la fin des ventes ; LE MANQUE est au-delà, et finit avec les coûts.
    if (m.resultat >= 0) {
      expect(m.reste, "le reste").not.toBeNull();
      expect(m.manque).toBeNull();
      expect(m.couleurReste).toBe("rgb(60, 207, 126)");
      expect(m.reste!.right).toBeLessThanOrEqual(m.ventes.right + 1);
      if (!m.marqueur) {
        expect(Math.abs(m.reste!.right - m.ventes.right), "le reste finit sous la fin des ventes").toBeLessThanOrEqual(1);
        expect(Math.abs(m.reste!.width - px(m.resultat)), "le reste = CA − coûts").toBeLessThanOrEqual(3);
      }
      expect(m.conclusion.replace(/\s/g, " ")).toMatch(/^Il vous reste [\d ]+ € : c'est votre bénéfice\.$/);
    } else {
      expect(m.manque, "le manque").not.toBeNull();
      expect(m.reste).toBeNull();
      expect(m.manque!.left, "le manque est au-delà de la fin des ventes").toBeGreaterThanOrEqual(m.ventes.right);
      if (!m.marqueur) expect(Math.abs(m.manque!.right - m.segments.at(-1)!.boite.right)).toBeLessThanOrEqual(1.5);
      expect(m.conclusion.replace(/\s/g, " ")).toMatch(
        /^Vos coûts dépassent vos ventes de [\d ]+ € : c'est votre perte\.$/,
      );
    }
    expect(Number(m.conclusion.replace(/[^\d]/g, ""))).toBe(Math.abs(m.resultat));
    // LE RÉSULTAT SE VOIT, même petit : une barre, ou le marqueur, plus haut que les barres.
    const solde = (m.reste ?? m.manque)!;
    expect(solde.width).toBeGreaterThanOrEqual(3.5);
    if (m.marqueur) expect(solde.height).toBeGreaterThan(m.ventes.height);
    // Rien n'est tronqué : un montant écrit dans une barre tient dans sa barre.
    for (const e of m.etiquettes) {
      expect(e.deborde, e.texte).toBe(false);
      expect(e.boite.left, e.texte).toBeGreaterThanOrEqual(e.barre.left - 0.5);
      expect(e.boite.right, e.texte).toBeLessThanOrEqual(e.barre.right + 0.5);
    }
    // La marge sur coût variable est écrite.
    expect(m.marge).toMatch(/Marge sur coût variable/);
    expect(m.debord).toBe(0);
  }

  it("au rituel, sur ordinateur : deux barres à la même échelle, la légende, la phrase ; l'action reste dans la fenêtre", async () => {
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
    verifierLePartage(m);
    // Les barres sont lisibles : au moins 500 px de large à 1280.
    expect(m.dessin.width).toBeGreaterThanOrEqual(500);
    // Le montant de la phrase est le résultat annoncé en grand.
    const grand = await page.evaluate(
      () => document.querySelector('[data-temps="2"] .chiffre-qui-arrive')?.textContent ?? "",
    );
    expect(Math.abs(m.resultat)).toBe(Number(grand.replace(/[^\d]/g, "")));
    // Les boutons du rituel restent dans le premier écran (1280 × 800).
    await page.evaluate(() => window.scrollTo(0, 0));
    const boutons = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-temps="4"] a')].map((a) => a.getBoundingClientRect().bottom),
    );
    expect(boutons.length).toBeGreaterThanOrEqual(2);
    for (const b of boutons) expect(b, "un bouton du rituel sous la fenêtre").toBeLessThanOrEqual(800);
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

  it("au rituel, sur téléphone : le même partage, sans débordement", async () => {
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
    verifierLePartage(await mesurer(t));
    await tel.close();
  }, 120_000);

  it("au verdict d'un tour clos : les mêmes règles", async () => {
    const q = await ordi.newPage();
    await q.goto(`${urlArene}#dernier-resultat`, { waitUntil: "networkidle" });
    const racine = "#dernier-resultat [data-ce-qui-a-fait-le-resultat]";
    await q.locator(`${racine} >> visible=true`).first().waitFor({ state: "visible", timeout: 30_000 });
    await q.waitForTimeout(800);
    const m = await mesurer(q, racine);
    verifierLePartage(m);
    expect(m.dessin.width).toBeGreaterThanOrEqual(500);
    await q.close();
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
