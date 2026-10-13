/**
 * LES CAPTURES DES GUIDES DE PRISE EN MAIN, PRISES SUR LES VRAIS PARCOURS.
 *
 * Le script joue l'application comme le feraient un enseignant, ses élèves, un candidat,
 * un référent et un formateur, dans un vrai navigateur, sur le build de production servi
 * localement et une base neuve. À chaque étape d'un guide (config/guides), il cadre
 * l'écran, dessine les repères déclarés par le guide (un cadre fin et un numéro) et
 * écrit deux fichiers WebP :
 *
 *   public/guides/<public>/<etape>.webp       pleine largeur (1280)
 *   public/guides/<public>/<etape>-768.webp   réduite, pour le téléphone
 *
 * Chaque fichier pèse moins de ~120 Ko : la qualité descend jusqu'à tenir.
 *
 * RELANCER APRÈS UN CHANGEMENT D'INTERFACE :
 *
 *   # une base neuve et le build servi (LTI_HTTP_LOCAL=1 et une LTI_PRIVATE_KEY d'essai
 *   # pour la capture de l'activité Moodle), puis :
 *   E2E_BASE_URL=http://127.0.0.1:3040 DATABASE_URL=… AUTH_SECRET=… \
 *     CHROMIUM_PATH=… npx tsx scripts/captures-des-guides.mts
 *
 *   # les PDF des quatre guides, depuis le même serveur :
 *   … npx tsx scripts/captures-des-guides.mts --pdf <dossier>
 *
 *   # une partie seulement : --groupes classe,essai,examen,episodes,etablissement,moodle,solo,mobile
 *
 * Il n'est lancé par aucune suite : il écrit dans public/, et ce qu'il écrit se relit
 * avant d'être commité. La garde tests/architecture/guides.test.ts vérifie ensuite que
 * chaque capture citée existe, aux dimensions déclarées.
 *
 * LES DONNÉES SONT FICTIVES : l'établissement est « École de démonstration », les
 * adresses sont en .example (domaine réservé, qui n'appartient à personne), les élèves
 * ont des prénoms et des noms d'emprunt.
 */
import { createHmac, randomBytes, randomUUID, type JsonWebKey } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { chromium, devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { GUIDES, LARGEUR_REDUITE, cheminDuGuide, type PublicDuGuide } from "../src/config/guides";
import { SimulateurLti } from "../tests/helpers/simulateur-lti";
import { CarnetDeNotes } from "../tests/helpers/carnet-de-notes";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3040";
const RACINE = process.cwd();
const POIDS_MAX = 120_000;
const args = process.argv.slice(2);
const DOSSIER_PDF = args.includes("--pdf") ? args[args.indexOf("--pdf") + 1] : null;
const GROUPES = args.includes("--groupes")
  ? new Set(args[args.indexOf("--groupes") + 1]!.split(","))
  : null;
const groupe = (nom: string) => !GROUPES || GROUPES.has(nom);

const journal: string[] = [];
const dire = (m: string) => {
  journal.push(m);
  console.log(m);
};

/* ── La base : un établissement fictif, sous licence, comme le poserait l'administrateur ── */

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

interface Monde {
  orgId: string;
  referent: string;
  enseignante: string;
}

/** L'École de démonstration, sa licence (arène, épisodes et examen), sa référente et une collègue. */
async function semerLeMonde(): Promise<Monde> {
  return base(async (c) => {
    const { rows } = await c.query(
      "insert into organizations (name, slug, kind) values ($1, $2, 'school') returning id",
      ["École de démonstration", `ecole-demo-${randomUUID().slice(0, 8)}`],
    );
    const orgId = rows[0].id as string;
    await c.query(
      `insert into org_licences (organization_id, label, starts_at, ends_at, arene, episodes, max_teachers,
         entreprises, niveaux, max_parties_en_cours, examen)
       values ($1, 'Licence 2026-2027', now() - interval '40 days', now() + interval '320 days', 'campus', true, null, null, null, null, true)`,
      [orgId],
    );
    const personne = async (adresse: string, nom: string, role: "teacher" | "org_admin") => {
      // Une adresse déjà prise (le script relancé sur la même base) reçoit un suffixe.
      const prise = (await c.query("select 1 from users where email = $1", [adresse])).rowCount;
      const email = prise ? adresse.replace("@", `.${randomUUID().slice(0, 4)}@`) : adresse;
      const r = await c.query("insert into users (email, display_name) values ($1, $2) returning id", [email, nom]);
      const id = r.rows[0].id as string;
      await c.query("insert into organization_members (user_id, organization_id, role) values ($1, $2, $3)", [
        id,
        orgId,
        role,
      ]);
      return id;
    };
    const referent = await personne("claire.martin@ecole-demo.example", "Claire Martin", "org_admin");
    const enseignante = await personne("nadia.roux@ecole-demo.example", "Nadia Roux", "teacher");
    await personne("karim.benali@ecole-demo.example", "Karim Benali", "teacher");
    return { orgId, referent, enseignante };
  });
}

/** Le jeton de session du personnel, signé comme le fait lib/session.ts. */
function jetonDeSession(userId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant");
  const now = Date.now();
  const corps = Buffer.from(
    JSON.stringify({ id: userId, role: "teacher", v: 1, iat: now, exp: now + 24 * 3600 * 1000 }),
    "utf8",
  ).toString("base64url");
  return `${corps}.${createHmac("sha256", secret).update(corps).digest("hex").slice(0, 32)}`;
}

/* ── Le navigateur ─────────────────────────────────────────────────────────── */

const navigateur: Browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=fr-FR"],
  // Les champs de date suivent la langue du système, pas celle de la page.
  env: { ...process.env, LANG: "fr_FR.UTF-8", LANGUAGE: "fr_FR:fr" },
});
/** La page qui encode les WebP et compose l'image du téléphone. */
const atelier: Page = await (await navigateur.newContext()).newPage();

async function contexte(options: { mobile?: boolean; hauteur?: number; session?: string } = {}): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    options.mobile
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR", reducedMotion: "reduce" }
      : {
          viewport: { width: 1280, height: options.hauteur ?? 800 },
          locale: "fr-FR",
          reducedMotion: "reduce",
          permissions: ["clipboard-read", "clipboard-write"],
        },
  );
  await c.addInitScript(() => {
    try {
      localStorage.setItem("install-prompt-ferme-le", String(Date.now()));
    } catch {
      /* stockage fermé : sans conséquence */
    }
  });
  if (options.session) {
    await c.addCookies([{ name: "ba_session", value: jetonDeSession(options.session), url: BASE }]);
  }
  return c;
}

async function aller(p: Page, chemin: string): Promise<void> {
  const r = await p.goto(chemin.startsWith("http") ? chemin : `${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
  if (!r || r.status() >= 400) throw new Error(`${chemin} a répondu ${r?.status() ?? "rien"}`);
  await p.waitForLoadState("networkidle");
}

async function calme(p: Page): Promise<void> {
  await p.waitForLoadState("networkidle").catch(() => undefined);
  await p.evaluate(() => {
    for (const a of document.getAnimations()) a.finish();
    (document.activeElement as HTMLElement | null)?.blur?.();
  });
  await p.waitForTimeout(250);
}

/** Pose le haut de `cible` à `marge` pixels du haut de l'écran. */
async function cadrer(p: Page, cible: string, marge = 84): Promise<void> {
  const loc = p.locator(cible).first();
  await loc.waitFor({ state: "attached", timeout: 30_000 });
  await loc.scrollIntoViewIfNeeded().catch(() => undefined);
  const y = await loc.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  await p.evaluate((h) => window.scrollTo(0, Math.max(0, h)), y - marge);
  await calme(p);
}

/* ── Les repères, puis la photographie ─────────────────────────────────────── */

function captureDe(publicDuGuide: PublicDuGuide, etape: string) {
  const g = GUIDES.find((x) => x.public === publicDuGuide)!;
  const e = g.etapes.find((x) => x.capture.fichier === etape);
  if (!e) throw new Error(`aucune étape « ${etape} » dans le guide ${publicDuGuide}`);
  return e.capture;
}

/** Dessine les repères déclarés : un cadre fin autour de l'élément, et son numéro. */
async function annoter(p: Page, publicDuGuide: PublicDuGuide, etape: string): Promise<void> {
  const reperes = captureDe(publicDuGuide, etape).reperes;
  const boites: ({ x: number; y: number; width: number; height: number } | null)[] = [];
  for (const r of reperes) {
    const boite = await p
      .locator(r.cible)
      .first()
      .boundingBox({ timeout: 5_000 })
      .catch(() => null);
    const vue = p.viewportSize()!;
    if (!boite || boite.y + boite.height < 0 || boite.y > vue.height) {
      dire(`  ! repère introuvable à l'écran : ${publicDuGuide}/${etape} « ${r.cible} »`);
      boites.push(null);
    } else boites.push(boite);
  }
  await p.evaluate((liste) => {
    const calque = document.createElement("div");
    calque.id = "reperes-du-guide";
    calque.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
    liste.forEach((b, i) => {
      if (!b) return;
      const m = 5;
      const cadre = document.createElement("div");
      cadre.style.cssText = `position:absolute;left:${b.x - m}px;top:${b.y - m}px;width:${b.width + 2 * m}px;height:${b.height + 2 * m}px;border:2.5px solid #1d4ed8;border-radius:8px;box-shadow:0 0 0 2px rgba(255,255,255,.85)`;
      const pastille = document.createElement("div");
      pastille.textContent = String(i + 1);
      // Le numéro se pose À GAUCHE du cadre, hors de lui, pour ne rien masquer de
      // l'élément ni de son libellé ; contre le bord de l'écran, il passe à droite.
      const gauche = b.x - m - 32 >= 2 ? b.x - m - 32 : Math.min(b.x + b.width + m + 6, window.innerWidth - 30);
      const haut = Math.max(2, b.y - m);
      pastille.style.cssText = `position:absolute;left:${gauche}px;top:${haut}px;width:26px;height:26px;border-radius:50%;background:#1d4ed8;color:#fff;font:700 14px/26px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff`;
      calque.append(cadre, pastille);
    });
    document.body.append(calque);
  }, boites);
}

/** Une image PNG, encodée en WebP à la largeur voulue, sous le poids maximal. */
async function versWebp(png: Buffer, largeur: number, hauteur: number): Promise<Buffer> {
  const sortie = await atelier.evaluate(
    async ({ b64, largeur, hauteur, poids }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const toile = document.createElement("canvas");
      toile.width = largeur;
      toile.height = hauteur;
      const ctx = toile.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      let q = 0.86;
      let url = toile.toDataURL("image/webp", q);
      while (url.length * 0.75 > poids && q > 0.4) {
        q -= 0.06;
        url = toile.toDataURL("image/webp", q);
      }
      return url.slice(url.indexOf(",") + 1);
    },
    { b64: png.toString("base64"), largeur, hauteur, poids: POIDS_MAX },
  );
  return Buffer.from(sortie, "base64");
}

const ecrites: string[] = [];

async function ecrire(publicDuGuide: PublicDuGuide, etape: string, png: Buffer): Promise<void> {
  const c = captureDe(publicDuGuide, etape);
  const dossier = join(RACINE, "public", "guides", publicDuGuide);
  mkdirSync(dossier, { recursive: true });
  const pleine = await versWebp(png, c.largeur, c.hauteur);
  const reduite = await versWebp(png, LARGEUR_REDUITE, Math.round((c.hauteur * LARGEUR_REDUITE) / c.largeur));
  writeFileSync(join(dossier, `${etape}.webp`), pleine);
  writeFileSync(join(dossier, `${etape}-${LARGEUR_REDUITE}.webp`), reduite);
  ecrites.push(`${publicDuGuide}/${etape}`);
  dire(`· ${publicDuGuide}/${etape}.webp ${Math.round(pleine.length / 1024)} Ko, réduite ${Math.round(reduite.length / 1024)} Ko`);
}

/** Les repères, l'écran tel qu'il est, puis les deux WebP. */
async function photographier(p: Page, publicDuGuide: PublicDuGuide, etape: string): Promise<void> {
  const c = captureDe(publicDuGuide, etape);
  const vue = p.viewportSize()!;
  if (vue.width !== c.largeur || vue.height !== c.hauteur) {
    throw new Error(`${publicDuGuide}/${etape} : écran ${vue.width}×${vue.height}, capture déclarée ${c.largeur}×${c.hauteur}`);
  }
  // Le pointeur hors de la page : un survol laissé sur un élément le cadrerait.
  await p.mouse.move(1, 1);
  await calme(p);
  await annoter(p, publicDuGuide, etape);
  const png = await p.screenshot({ type: "png" });
  await p.evaluate(() => document.getElementById("reperes-du-guide")?.remove());
  await ecrire(publicDuGuide, etape, png);
}

/** Une étape qui échoue ne fait pas tomber les autres : elle est dite à la fin. */
const echecs: string[] = [];
async function etape(nom: string, f: () => Promise<void>): Promise<void> {
  try {
    await f();
  } catch (e) {
    echecs.push(`${nom} : ${(e as Error).message.split("\n")[0]}`);
    dire(`  ✗ ${nom} : ${(e as Error).message.split("\n")[0]}`);
  }
}

/* ── Les gestes de l'arène ─────────────────────────────────────────────────── */

/** Ouvre la feuille de décision du tour (après « Passer au tour », s'il est proposé). */
async function ouvrirLaFeuille(p: Page): Promise<void> {
  const passer = p.getByRole("button", { name: /Passer au tour/i }).first();
  if (await passer.isVisible().catch(() => false)) await passer.click();
  const raccourci = p.getByRole("button", { name: /Prendre mes décisions/ }).first();
  if (await raccourci.isVisible().catch(() => false)) await raccourci.click();
  else await p.getByRole("tab", { name: /Décider/ }).first().click();
  await p.locator("text=Votre feuille de décision").first().waitFor({ timeout: 30_000 });
  await calme(p);
}

async function jusquALaDerniereRubrique(p: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const suivant = p.getByRole("button", { name: /^Suivant/ }).first();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
    await p.waitForTimeout(250);
  }
}

async function validerLaFeuille(p: Page): Promise<void> {
  await p.getByRole("button", { name: /Valider les décisions de l'équipe/ }).first().click({ timeout: 30_000 });
  const garde = p.getByRole("button", { name: /je garde ces valeurs/ });
  if (await garde.isVisible({ timeout: 4_000 }).catch(() => false)) await garde.click();
  await p.waitForTimeout(2_000);
}

/** Un tour solo (ou d'examen) avec les valeurs proposées, jusqu'à « Valider et simuler ». */
async function jouerUnTourSolo(p: Page, urlArene: string): Promise<void> {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(300);
  }
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(700);
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(800);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  const avancer = p.getByRole("button", { name: /^(Suivant|Continuer|Analyser|Décider|Accepter$)/ });
  for (let k = 0; k < 40; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    const vus = [];
    for (const b of await avancer.all()) if (await b.isVisible().catch(() => false)) vus.push(b);
    if (vus.length === 0) throw new Error("aucun bouton pour avancer dans le tour");
    await vus[vus.length - 1]!.click();
    await p.waitForTimeout(250);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

/** Un épisode manager joué jusqu'au bilan, en prenant la première option. */
async function jouerLEpisode(p: Page): Promise<void> {
  await p.getByRole("button", { name: "Commencer l'épisode" }).click();
  for (let pas = 0; pas < 140; pas += 1) {
    if ((await p.getByText("Votre axe de travail").count()) > 0) break;
    for (const nom of await p.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await p.$(`input[name="${nom}"]:checked`))) await p.locator(`input[name="${nom}"]`).first().check();
    }
    const prevision = p.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      const indice = (await prevision.getAttribute("placeholder")) ?? "100";
      await prevision.fill(indice.replace(",", ".").replace(/[^\d.-]/g, "") || "100");
    }
    const source = p.locator("main button[aria-expanded=false]:not([disabled])").first();
    if ((await source.count()) > 0 && pas % 3 === 0) {
      await source.click();
      continue;
    }
    await p.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  await p.getByText("le prochain épisode se cherche").waitFor({ state: "detached", timeout: 30_000 }).catch(() => undefined);
}

/* ── Les parcours ──────────────────────────────────────────────────────────── */

const ELEVES = ["Léa", "Hugo", "Inès", "Sami"];

async function parcoursDeLaClasse(monde: Monde): Promise<void> {
  const ctxProf = await contexte({ session: monde.enseignante });
  const prof = await ctxProf.newPage();

  // 1. Le compte : la page d'inscription, remplie avec des données de démonstration.
  await etape("enseignant/compte", async () => {
    const ctx = await contexte();
    const p = await ctx.newPage();
    await aller(p, "/teacher/login");
    await p.getByRole("button", { name: "Créer un compte" }).click();
    await p.fill('input[name="displayName"]', "Nadia Roux");
    await p.fill('input[name="inviteCode"]', "K7M2PR9T");
    await p.fill('input[name="email"]', "nadia.roux@ecole-demo.example");
    await p.fill('input[name="password"]', "une-phrase-de-passe");
    await cadrer(p, "form:has(input[name=displayName])", 110);
    await photographier(p, "enseignant", "compte");
    await ctx.close();
  });

  // 2 et 3. La création de la partie et ses réglages.
  await aller(prof, "/teacher");
  if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) await prof.locator("#nouvelle-partie > summary").click();
  await prof.selectOption('select[name="scenarioCode"]', "nova").catch(() => undefined);
  await prof.selectOption('select[name="humanTeamsCount"]', "2");
  await prof.selectOption('select[name="botCount"]', "2");
  await etape("enseignant/nouvelle-partie", async () => {
    await cadrer(prof, "#nouvelle-partie-titre", 90);
    await photographier(prof, "enseignant", "nouvelle-partie");
  });
  await prof.selectOption('select[name="periodicity"]', "quarter");
  await prof.selectOption('select[name="roundsCount"]', "3");
  await prof.selectOption('select[name="level"]', "2");
  // L'évaluation entre coéquipiers, cochée à la création : la carte paraîtra au bilan.
  await prof.locator('input[name="evaluationDesPairs"]').check();
  await etape("enseignant/reglages", async () => {
    await cadrer(prof, 'select[name="periodicity"]', 120);
    await photographier(prof, "enseignant", "reglages");
  });
  await prof.getByRole("button", { name: /Créer la partie/ }).click();
  await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
  const urlPartie = new URL(prof.url()).pathname;
  const code = (await prof.locator("#code-invitation").innerText()).trim();
  dire(`  partie ${urlPartie}, code ${code}`);

  // Les élèves : Léa et Hugo dans la première équipe, Inès et Sami dans la seconde.
  const eleves: Page[] = [];
  for (const [i, prenom] of ELEVES.entries()) {
    const ctx = await contexte();
    const p = await ctx.newPage();
    await aller(p, "/join");
    await p.fill('input[name="code"]', code);
    await p.fill('input[name="pseudo"]', prenom);
    if (i === 0) {
      await etape("etudiant/rejoindre", async () => {
        await cadrer(p, "h1", 140);
        await photographier(p, "etudiant", "rejoindre");
      });
    }
    await p.getByRole("button", { name: "Rejoindre la partie" }).click();
    await p.waitForURL(/\/arena\//, { timeout: 60_000 });
    await p.locator("text=Nommez votre entreprise").first().waitFor({ timeout: 60_000 });
    eleves.push(p);
  }
  const [lea, hugo] = eleves as [Page, Page, Page, Page];
  const urlArene = lea.url().split("#")[0]!.split("?")[0]!;

  // Le nom de l'entreprise, choisi par l'équipe de Léa.
  await etape("etudiant/equipe", async () => {
    await lea.locator('input[name="name"], input[placeholder*="nom de votre entreprise" i]').first().fill("Enceintes du Rhône");
    await cadrer(lea, "text=Nommez votre entreprise", 150);
    await photographier(lea, "etudiant", "equipe");
  });
  await lea.getByRole("button", { name: "Adopter ce nom" }).click().catch(() => undefined);
  await lea.waitForTimeout(1_500);
  await hugo.locator('input[name="name"], input[placeholder*="nom de votre entreprise" i]').first().fill("Sonora");
  await hugo.getByRole("button", { name: "Adopter ce nom" }).click().catch(() => undefined);

  // Le code de reprise, déplié.
  await etape("etudiant/reprise", async () => {
    await aller(lea, urlArene);
    const tiroir = lea.locator("summary", { hasText: "Mon code de reprise" }).first();
    await tiroir.click();
    await cadrer(lea, "text=Mon code de reprise", 260);
    await photographier(lea, "etudiant", "reprise");
  });

  // Le haut de l'écran.
  await etape("etudiant/cockpit", async () => {
    await aller(lea, urlArene);
    await cadrer(lea, "text=Demande de saison >> nth=0", 230);
    await photographier(lea, "etudiant", "cockpit");
  });

  // La feuille de décision, puis l'envoi.
  await etape("etudiant/feuille", async () => {
    await ouvrirLaFeuille(lea);
    await cadrer(lea, "text=Résultat estimé >> nth=0", 150);
    await photographier(lea, "etudiant", "feuille");
  });
  await etape("etudiant/envoyer", async () => {
    await jusquALaDerniereRubrique(lea);
    await cadrer(lea, "role=button[name=/Valider les décisions de l.équipe/]", 520);
    await photographier(lea, "etudiant", "envoyer");
  });
  await validerLaFeuille(lea);

  // Le pilotage : le code, l'état des décisions, la Gazette.
  await etape("enseignant/code", async () => {
    await aller(prof, urlPartie);
    await prof.evaluate(() => window.scrollTo(0, 0));
    await calme(prof);
    await photographier(prof, "enseignant", "code");
  });
  await etape("enseignant/tour", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).waitFor();
    await cadrer(prof, "text=Ce tour >> nth=0", 100);
    await photographier(prof, "enseignant", "tour");
    await prof.getByRole("button", { name: "Annuler" }).first().click();
  });
  await etape("enseignant/gazette", async () => {
    await cadrer(prof, "text=La Gazette de l'Arène >> nth=0", 90);
    await photographier(prof, "enseignant", "gazette");
  });

  // La clôture, puis la révélation au mur.
  const ctxMur = await contexte({ session: monde.enseignante, hauteur: 720 });
  const mur = await ctxMur.newPage();
  await aller(mur, `${urlPartie}/projection`);
  await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
  await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
  await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 120_000 });
  await etape("enseignant/revelation", async () => {
    await aller(mur, `${urlPartie}/projection`);
    await mur.getByRole("button", { name: /Classement/ }).first().click();
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Révéler le classement/ }).click({ timeout: 30_000 });
    await prof.waitForLoadState("networkidle");
    await prof.waitForTimeout(1_500);
    const revelee = await mur
      .waitForSelector("[data-revelation-du-marche]", { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (!revelee) {
      await aller(mur, `${urlPartie}/projection`);
      await mur.getByRole("button", { name: /Classement/ }).first().click();
      await mur.waitForSelector("[data-revelation-du-marche]", { timeout: 60_000 });
    }
    await mur.waitForFunction(
      () => !document.querySelector("[data-revelation-du-marche]")?.classList.contains("revelation"),
      undefined,
      { timeout: 30_000 },
    ).catch(() => undefined);
    await calme(mur);
    await photographier(mur, "enseignant", "revelation");
  });

  // Les résultats chez l'élève.
  await etape("etudiant/resultats", async () => {
    await aller(lea, urlArene);
    await cadrer(lea, "text=Le verdict >> nth=0", 150);
    await photographier(lea, "etudiant", "resultats");
  });

  // Le débrief.
  await etape("enseignant/debrief", async () => {
    await aller(prof, urlPartie);
    await cadrer(prof, "text=Vue pédagogique >> nth=0", 140);
    await photographier(prof, "enseignant", "debrief");
  });

  // La fin de la partie : les deux tours suivants, puis le bilan.
  for (const tour of [2, 3]) {
    await aller(lea, urlArene);
    await ouvrirLaFeuille(lea).catch(() => undefined);
    await jusquALaDerniereRubrique(lea);
    await validerLaFeuille(lea).catch(() => undefined);
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: new RegExp(`Clore le tour ${tour} et simuler`) }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.waitForLoadState("networkidle");
    await prof.waitForTimeout(4_000);
  }
  await aller(prof, urlPartie);
  const reveler = prof.getByRole("button", { name: /Révéler le classement/ }).first();
  if (await reveler.isVisible().catch(() => false)) {
    await reveler.click();
    await prof.waitForLoadState("networkidle");
    await prof.waitForTimeout(1_500);
  }
  await etape("etudiant/bilan", async () => {
    await aller(lea, urlArene);
    await lea.locator("[data-cloture-de-l-exercice]").waitFor({ timeout: 90_000 });
    await cadrer(lea, "[data-cloture-de-l-exercice]", 80);
    await photographier(lea, "etudiant", "bilan");
  });

  // L'ÉVALUATION ENTRE COÉQUIPIERS : chaque élève note les siens ; Léa est photographiée
  // avant d'envoyer ; l'enseignant saisit les notes d'équipe et se fait photographier.
  const evaluer = async (p: Page, notes: number[], photo = false) => {
    await aller(p, p.url().split("#")[0]!.split("?")[0]!.replace(/\/coequipiers$/, ""));
    const carte = p.locator('[data-carte-coequipiers="a-faire"]');
    await carte.waitFor({ timeout: 30_000 });
    await carte.locator("[data-lien-coequipiers]").click();
    await p.waitForURL(/\/coequipiers\?moment=fin/);
    await p.locator("[data-coequipier]").first().waitFor({ timeout: 30_000 });
    const blocs = p.locator("[data-coequipier]");
    const n = await blocs.count();
    for (let b = 0; b < n; b++) {
      const criteres = blocs.nth(b).locator("fieldset[data-critere]");
      for (let i = 0; i < (await criteres.count()); i++) {
        await criteres.nth(i).locator(`input[type="radio"][value="${notes[(b + i) % notes.length]}"]`).check();
      }
    }
    if (photo) {
      await cadrer(p, "[data-coequipier] >> nth=0", 120);
      await photographier(p, "etudiant", "coequipiers");
    }
    await p.getByRole("button", { name: "Envoyer mon évaluation" }).click();
    await p.waitForURL(/fait=envoyee/, { timeout: 30_000 });
  };
  await etape("etudiant/coequipiers", () => evaluer(lea, [4, 5, 4], true));
  for (const [i, e] of eleves.slice(1).entries()) {
    await evaluer(e, [[5, 4, 3], [4, 4, 5], [3, 5, 4]][i]!).catch((err: Error) =>
      dire(`  ! évaluation de l'élève ${i + 2} : ${err.message.split("\n")[0]}`),
    );
  }
  await etape("enseignant/coequipiers", async () => {
    await aller(prof, `${urlPartie}/coequipiers`);
    const notes = prof.locator('[data-moment="fin"] input[name^="note:"]');
    const nb = await notes.count();
    for (let i = 0; i < nb; i++) await notes.nth(i).fill(String(14 - i * 2));
    if (nb > 0) {
      await prof.getByRole("button", { name: "Enregistrer les notes d'équipe" }).click();
      await prof.waitForURL(/fait=notes/, { timeout: 30_000 });
    }
    await cadrer(prof, '[data-moment="fin"]', 90);
    await photographier(prof, "enseignant", "coequipiers");
  });

  await ctxMur.close();
  for (const e of eleves) await e.context().close();
  await ctxProf.close();
}

async function parcoursDesCohortes(monde: Monde): Promise<void> {
  const ctxProf = await contexte({ session: monde.enseignante });
  const prof = await ctxProf.newPage();
  const cocher = async (code: string) => {
    const c = prof.locator(`input[name="episodes"][value="${code}"]`);
    if (!(await c.isVisible())) await prof.locator(`details[data-repliable]:has(input[value="${code}"]) > summary`).click();
    await c.check();
  };
  const creer = async (nom: string, episodes: string[], capture?: () => Promise<void>) => {
    await aller(prof, "/teacher/cohortes");
    const f = prof.locator("#nouvelle-cohorte");
    if ((await f.getAttribute("open")) === null) await f.locator(":scope > summary").click();
    await prof.getByLabel("Nom de la cohorte").fill(nom);
    for (const e of episodes) await cocher(e);
    if (capture) await capture();
    await prof.getByRole("button", { name: "Créer la cohorte" }).click();
    await prof.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}/, { timeout: 60_000 });
    return {
      url: new URL(prof.url()).pathname,
      lien: (await prof.locator("[data-lien-de-la-cohorte]").textContent())!.trim(),
    };
  };

  // La cohorte de l'enseignant.
  await etape("enseignant/cohortes", async () => {
    await creer("Terminale STMG · groupe B", ["depot-qui-deborde", "agence-qui-demarre"]);
    await cadrer(prof, "h1", 120);
    await photographier(prof, "enseignant", "cohortes");
  });

  // La cohorte du formateur : le formulaire, puis la page de la cohorte.
  let cohorte = { url: "", lien: "" };
  await etape("formateur/cohorte", async () => {
    cohorte = await creer("Managers de proximité · session de mars", ["trimestre-qui-derape", "depot-qui-deborde"], async () => {
      await cadrer(prof, "#nouvelle-cohorte", 90);
      await photographier(prof, "formateur", "cohorte");
    });
  });
  await etape("formateur/diffuser", async () => {
    await aller(prof, cohorte.url);
    await cadrer(prof, "h1", 120);
    await photographier(prof, "formateur", "diffuser");
  });

  // Six participants rejoignent ; cinq jouent un épisode. La vue de l'animateur ne montre
  // ses agrégats qu'au-delà d'un seuil de membres (pour qu'aucun ne soit reconnaissable) :
  // la capture la montre remplie.
  const participants: BrowserContext[] = [];
  for (let i = 0; i < 6; i++) {
    const ctxP = await contexte();
    participants.push(ctxP);
    const q = await ctxP.newPage();
    await aller(q, cohorte.lien);
    await q.getByRole("button", { name: "Rejoindre la cohorte" }).click();
    await q.locator("[data-episodes-de-ma-cohorte] a").first().waitFor({ timeout: 30_000 });
    if (i < 5) {
      await q.locator("[data-episodes-de-ma-cohorte] a").nth(i % 2).click();
      await q.waitForURL(/\/entreprises\/episode\//);
      await jouerLEpisode(q).catch((e: Error) => dire(`  ! épisode du participant ${i + 1} : ${e.message.split("\n")[0]}`));
    }
  }

  await etape("formateur/animation", async () => {
    await aller(prof, "/teacher/cohortes");
    const carte = prof.locator("[data-cohorte]", { hasText: "Managers de proximité" }).first();
    await carte.getByRole("link", { name: "Vue de l'animateur" }).click();
    await prof.waitForURL(/\/entreprises\/episode\/animation\//);
    await calme(prof);
    await cadrer(prof, "h1", 120);
    await photographier(prof, "formateur", "animation");
  });
  for (const c of participants) await c.close();
  await ctxProf.close();
}

async function parcoursDesEpisodes(monde: Monde): Promise<void> {
  const ctx = await contexte({ session: monde.enseignante });
  const p = await ctx.newPage();
  await etape("formateur/catalogue", async () => {
    await aller(p, "/entreprises/episode");
    await cadrer(p, "h1", 120);
    await photographier(p, "formateur", "catalogue");
  });
  await etape("formateur/episode", async () => {
    await aller(p, "/entreprises/episode/depot-qui-deborde?hasard=7");
    await cadrer(p, "text=Votre mandat pour le trimestre", 100);
    await photographier(p, "formateur", "episode");
  });
  await etape("formateur/bilan", async () => {
    await aller(p, "/entreprises/episode/depot-qui-deborde?hasard=7");
    await jouerLEpisode(p);
    await cadrer(p, "text=Bilan de l'épisode >> nth=0", 110);
    await photographier(p, "formateur", "bilan");
  });
  await etape("formateur/profil", async () => {
    await aller(p, "/entreprises/episode/agence-qui-demarre?hasard=7");
    await jouerLEpisode(p);
    await aller(p, "/entreprises/episode/profil");
    const choix = p.getByLabel("La compétence que je travaille");
    if (await choix.count()) {
      const valeurs = await choix.locator("option").evaluateAll((os) =>
        os.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
      );
      if (valeurs[0]) {
        await choix.selectOption(valeurs[0]);
        await p.getByRole("button", { name: "Choisir", exact: true }).click();
        await p.waitForLoadState("networkidle");
      }
    }
    await aller(p, "/entreprises/episode/profil");
    await cadrer(p, "text=La compétence que je travaille >> nth=0", 420);
    await photographier(p, "formateur", "profil");
  });
  await ctx.close();
}

async function parcoursDeLExamen(monde: Monde): Promise<void> {
  const ctxProf = await contexte({ session: monde.enseignante });
  const prof = await ctxProf.newPage();
  await aller(prof, "/teacher/examens");
  const f = prof.locator("#nouvel-examen");
  if ((await f.getAttribute("open")) === null) await f.locator(":scope > summary").click();
  await prof.getByLabel("Nom de l'examen").fill("Gestion L2 · examen de fin de semestre");
  await prof.getByLabel("Niveau").selectOption("1");
  await prof.getByLabel("Nombre de tours").fill("2");
  await prof.getByLabel("Durée maximale d'un tour (minutes)").fill("30");
  await prof.getByLabel(/Un lot de \d+ marchés d'égale difficulté/).check();
  await etape("enseignant/examen-creation", async () => {
    await cadrer(prof, "#nouvel-examen", 90);
    await photographier(prof, "enseignant", "examen-creation");
  });
  await prof.getByRole("button", { name: "Créer l'examen" }).click();
  await prof.waitForURL(/\/teacher\/examens\/[0-9a-f-]{36}/, { timeout: 120_000 });
  const examenId = prof.url().match(/examens\/([0-9a-f-]{36})/)![1]!;
  const code = (await prof.locator("#code-de-l-examen").textContent())!.trim();

  for (const [i, [nom, numero]] of [
    ["Camille Durand", "21 0042"],
    ["Yanis Lefort", "21 0057"],
  ].entries()) {
    const ctx = await contexte();
    const c = await ctx.newPage();
    await aller(c, `/examen/${code}`);
    await c.getByLabel("Nom et prénom").fill(nom!);
    await c.getByLabel(/Numéro d'étudiant/).fill(numero!);
    if (i === 0) {
      await etape("etudiant/examen", async () => {
        await cadrer(c, "text=Les règles >> nth=0", 90);
        await photographier(c, "etudiant", "examen");
      });
    }
    await c.getByRole("button", { name: "Commencer l'examen" }).click();
    await c.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 120_000 });
    const url = c.url().split("?")[0]!.split("#")[0]!;
    for (let t = 1; t <= 2; t++) await jouerUnTourSolo(c, url);
    await ctx.close();
  }
  for (let i = 0; i < 20; i++) {
    await aller(prof, `/teacher/examens/${examenId}`);
    if ((await prof.locator('[data-etat="notee"]').count()) >= 2) break;
    await prof.waitForTimeout(1_500);
  }
  await etape("enseignant/examen-suivi", async () => {
    await cadrer(prof, "text=Suivi en direct >> nth=0", 100);
    await photographier(prof, "enseignant", "examen-suivi");
  });
  await etape("enseignant/accreditation", async () => {
    await aller(prof, `/teacher/examens/${examenId}/accreditation`);
    await prof.evaluate(() => window.scrollTo(0, 0));
    await photographier(prof, "enseignant", "accreditation");
  });
  await etape("enseignant/carnet", async () => {
    await aller(prof, "/teacher/usage");
    await cadrer(prof, "h1", 120);
    await photographier(prof, "enseignant", "carnet");
  });
  await ctxProf.close();
}

async function parcoursSolo(): Promise<void> {
  const ctx = await contexte();
  const p = await ctx.newPage();
  await aller(p, "/jouer");
  await p.getByRole("button", { name: /NOVA/ }).first().click();
  await p.getByRole("button", { name: /^Niveau 1/ }).click();
  await p.getByRole("button", { name: "Lancer la partie" }).click();
  await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (p.url().includes("trop=1")) throw new Error("plafond de parties solo atteint : relancer sur une base neuve");
  const url = p.url().split("?")[0]!.split("#")[0]!;
  for (let t = 1; t <= 8; t++) {
    await p.goto(url, { waitUntil: "networkidle" });
    if (await p.locator("[data-cloture-de-l-exercice]").count()) break;
    await jouerUnTourSolo(p, url);
  }
  await etape("etudiant/merite", async () => {
    await aller(p, url);
    await p.locator("[data-merite-de-la-partie]").waitFor({ timeout: 120_000 });
    await cadrer(p, "[data-merite-de-la-partie]", 80);
    await photographier(p, "etudiant", "merite");
  });
  await ctx.close();
}

async function parcoursDeLEtablissement(monde: Monde): Promise<void> {
  const ctx = await contexte({ session: monde.referent });
  const p = await ctx.newPage();
  await etape("etablissement/licence", async () => {
    await aller(p, "/org");
    await p.evaluate(() => window.scrollTo(0, 0));
    await photographier(p, "etablissement", "licence");
  });
  await etape("etablissement/enseignants", async () => {
    await aller(p, "/org");
    await p.getByRole("button", { name: "+ générer un code enseignant" }).click();
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(1_000);
    await cadrer(p, "text=Inviter des enseignants", 110);
    await photographier(p, "etablissement", "enseignants");
  });
  for (const [id, fichier] of [
    ["#dynamique", "moodle-court"],
    ["#manuelle", "moodle-manuel"],
    ["#renater", "renater"],
  ] as const) {
    await etape(`etablissement/${fichier}`, async () => {
      await aller(p, "/integration");
      await cadrer(p, id, 100);
      await photographier(p, "etablissement", fichier);
    });
  }
  await etape("etablissement/donnees", async () => {
    await aller(p, "/mentions-legales");
    await cadrer(p, "text=Données personnelles (RGPD)", 110);
    await photographier(p, "etablissement", "donnees");
  });
  await ctx.close();
}

/** LE TOUR D'ESSAI : une partie à un tour d'essai, une équipe qui le joue, le pilotage pendant l'essai. */
async function parcoursDeLEssai(monde: Monde): Promise<void> {
  const ctxProf = await contexte({ session: monde.enseignante });
  const prof = await ctxProf.newPage();
  await aller(prof, "/teacher");
  if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) await prof.locator("#nouvelle-partie > summary").click();
  await prof.selectOption('select[name="scenarioCode"]', "nova").catch(() => undefined);
  await prof.selectOption('select[name="humanTeamsCount"]', "2");
  await prof.selectOption('select[name="botCount"]', "1");
  await prof.selectOption('select[name="roundsCount"]', "3");
  await prof.locator('input[name="toursDEssai"][value="1"]').check();
  await prof.getByRole("button", { name: /Créer la partie/ }).click();
  await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
  const urlPartie = new URL(prof.url()).pathname;
  const code = (await prof.locator("#code-invitation").innerText()).trim();
  const ctx = await contexte();
  const p = await ctx.newPage();
  await aller(p, "/join");
  await p.fill('input[name="code"]', code);
  await p.fill('input[name="pseudo"]', "Maya");
  await p.getByRole("button", { name: "Rejoindre la partie" }).click();
  await p.waitForURL(/\/arena\//, { timeout: 60_000 });
  await p.locator('[data-bandeau-d-essai="essai"]').waitFor({ timeout: 60_000 });
  await ouvrirLaFeuille(p).catch(() => undefined);
  await jusquALaDerniereRubrique(p);
  await validerLaFeuille(p).catch(() => undefined);
  await etape("enseignant/essai", async () => {
    await aller(prof, urlPartie);
    await cadrer(prof, "text=Tour d'essai · ne compte pas", 110);
    await photographier(prof, "enseignant", "essai");
  });
  await ctx.close();
  await ctxProf.close();
}

/**
 * MOODLE, PAR LE SIMULATEUR DE PLATEFORME DES TESTS, AVEC SON CARNET DE NOTES : l'activité
 * d'un cours ouverte par l'enseignante (première ouverture : « Que doit ouvrir cette
 * activité ? »), un examen relié à l'activité, une candidate venue du cours, la
 * publication, et l'encart « Le carnet de notes de Moodle » qui dit la note envoyée.
 */
async function parcoursDeMoodle(monde: Monde): Promise<void> {
  const sim = await new SimulateurLti().demarrer(BASE);
  const carnet = await new CarnetDeNotes(
    () => sim.clientId,
    async () => ((await (await fetch(`${BASE}/api/lti/jwks`)).json()) as { keys: JsonWebKey[] }).keys,
  ).demarrer();
  try {
    const d = sim.description();
    await base((c) =>
      c.query(
        `insert into lti_plateformes (nom, issuer, client_id, deployment_ids, url_authentification, url_jeton, url_jwks, organization_id, sel)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)`,
        [
          "Moodle de l'École de démonstration",
          d.issuer,
          d.clientId,
          JSON.stringify(d.deploymentIds),
          d.urlAuthentification,
          carnet.urlJeton,
          d.urlJwks,
          monde.orgId,
          randomBytes(16).toString("base64url"),
        ],
      ),
    );
    const ressource = `act-${randomUUID().slice(0, 6)}`;
    const prof = `ens-${randomUUID().slice(0, 6)}`;
    const lancer = async (p: Page, personne: Parameters<SimulateurLti["preparer"]>[0]) => {
      await p.goto(sim.preparer({ ...personne, revendications: carnet.revendication() }));
      await p.waitForURL((u) => u.origin === new URL(BASE).origin && !u.pathname.startsWith("/api/"), { timeout: 30_000 });
      await p.waitForLoadState("networkidle");
    };
    const ctx = await contexte();
    const q = await ctx.newPage();
    await etape("etablissement/moodle-activite", async () => {
      await lancer(q, {
        sub: prof,
        role: "enseignant",
        prenom: "Nadia",
        ressource,
        titre: "Simulation de gestion · semestre 2",
        cours: "BTS MCO · première année",
      });
      await calme(q);
      await cadrer(q, "h1", 120);
      await photographier(q, "etablissement", "moodle-activite");
    });
    await etape("etablissement/notes", async () => {
      // L'examen, créé dans l'espace enseignant (la session LTI y donne accès), puis relié.
      await aller(q, "/teacher/examens");
      const f = q.locator("#nouvel-examen");
      if ((await f.getAttribute("open")) === null) await f.locator(":scope > summary").click();
      await q.getByLabel("Nom de l'examen").fill("Partiel de gestion · semestre 2");
      await q.getByLabel("Niveau").selectOption("1");
      await q.getByLabel("Nombre de tours").fill("1");
      await q.getByRole("button", { name: "Créer l'examen" }).click();
      await q.waitForURL(/\/teacher\/examens\/[0-9a-f-]{36}/, { timeout: 120_000 });
      const examenId = q.url().match(/examens\/([0-9a-f-]{36})/)![1]!;
      await lancer(q, { sub: prof, role: "enseignant", ressource });
      await q.getByRole("button", { name: /Relier l'activité à cet examen/ }).click();
      await q.waitForURL(new RegExp(`/teacher/examens/${examenId}`), { timeout: 30_000 });
      // Une candidate venue du cours passe l'examen.
      const ctxC = await contexte();
      const c = await ctxC.newPage();
      await lancer(c, { sub: `etu-${randomUUID().slice(0, 6)}`, role: "eleve", prenom: "Inès", ressource });
      await c.getByRole("button", { name: "Commencer l'examen" }).click();
      await c.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 120_000 });
      const urlArene = c.url().split("?")[0]!.split("#")[0]!;
      await jouerUnTourSolo(c, urlArene);
      await c.goto(urlArene, { waitUntil: "networkidle" });
      await c.locator("[data-recu-d-examen]").waitFor({ timeout: 60_000 });
      await ctxC.close();
      for (let i = 0; i < 30; i++) {
        await aller(q, `/teacher/examens/${examenId}`);
        if ((await q.locator('[data-etat="notee"]').count()) === 1) break;
        await q.waitForTimeout(2_000);
      }
      await q.getByRole("button", { name: "Publier les résultats" }).click();
      await q.waitForURL(/fait=publie/, { timeout: 60_000 });
      for (let i = 0; i < 30; i++) {
        const lu = (await q.locator("[data-resume-du-retour]").innerText().catch(() => "")).replace(/[  ]/g, " ");
        if (/^Notes envoyées à Moodle : 1\/1$/.test(lu)) break;
        await q.waitForTimeout(2_000);
        await aller(q, `/teacher/examens/${examenId}`);
      }
      await cadrer(q, "[data-retour-des-notes]", 200);
      await photographier(q, "etablissement", "notes");
    });
    await ctx.close();
  } finally {
    await sim.arreter();
    await carnet.arreter();
  }
}

/** Trois écrans de téléphone, côte à côte, sur une image de la largeur des autres. */
async function parcoursDuTelephone(monde: Monde): Promise<void> {
  await etape("etudiant/mobile", async () => {
    const ctxProf = await contexte({ session: monde.enseignante });
    const prof = await ctxProf.newPage();
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) await prof.locator("#nouvelle-partie > summary").click();
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "2");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    const code = (await prof.locator("#code-invitation").innerText()).trim();
    const ctx = await contexte({ mobile: true });
    const p = await ctx.newPage();
    const ecrans: Buffer[] = [];
    await aller(p, `/join?code=${code}`);
    await p.fill('input[name="pseudo"]', "Lina");
    ecrans.push(await p.screenshot({ type: "png" }));
    await p.getByRole("button", { name: "Rejoindre la partie" }).click();
    await p.waitForURL(/\/arena\//, { timeout: 60_000 });
    await p.locator("text=/Tour 1/").first().waitFor({ timeout: 60_000 });
    await p.waitForTimeout(1_500);
    await calme(p);
    ecrans.push(await p.screenshot({ type: "png" }));
    // SUR TÉLÉPHONE, LE TOUR SE DÉROULE EN ÉCRANS (« Briefing · 1 sur … », « Continuer ») :
    // on avance jusqu'au premier écran de décision.
    for (let i = 0; i < 12; i++) {
      if (await p.locator('input[name$="price"], input[name="price"]').first().isVisible().catch(() => false)) break;
      const avancer = p.getByRole("button", { name: /^(Continuer|Suivant|Analyser|Décider|Prendre mes décisions)/ });
      const vus = [];
      for (const b of await avancer.all()) if (await b.isVisible().catch(() => false)) vus.push(b);
      if (vus.length === 0) break;
      await vus[vus.length - 1]!.click();
      await p.waitForTimeout(500);
    }
    await calme(p);
    ecrans.push(await p.screenshot({ type: "png" }));
    const c = captureDe("etudiant", "mobile");
    const png = await atelier.evaluate(
      async ({ images, largeur, hauteur }) => {
        const toile = document.createElement("canvas");
        toile.width = largeur;
        toile.height = hauteur;
        const ctx = toile.getContext("2d")!;
        ctx.fillStyle = "#eef2f7";
        ctx.fillRect(0, 0, largeur, hauteur);
        const h = hauteur - 64;
        const w = Math.round((h * 390) / 844);
        const ecart = Math.round((largeur - 3 * w) / 4);
        for (const [i, b64] of images.entries()) {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const x = ecart + i * (w + ecart);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, 32, w, h, 22);
          ctx.clip();
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, x, 32, w, h);
          ctx.restore();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#9aa7ba";
          ctx.beginPath();
          ctx.roundRect(x, 32, w, h, 22);
          ctx.stroke();
        }
        const url = toile.toDataURL("image/png");
        return url.slice(url.indexOf(",") + 1);
      },
      { images: ecrans.map((b) => b.toString("base64")), largeur: c.largeur, hauteur: c.hauteur },
    );
    await ecrire("etudiant", "mobile", Buffer.from(png, "base64"));
    await ctx.close();
    await ctxProf.close();
  });
}

/* ── Les PDF ───────────────────────────────────────────────────────────────── */

async function lesPdf(dossier: string): Promise<void> {
  mkdirSync(dossier, { recursive: true });
  const ctx = await contexte();
  const p = await ctx.newPage();
  for (const g of GUIDES) {
    await aller(p, cheminDuGuide(g.public));
    // Les images sont chargées à la demande : on les fait toutes venir avant d'imprimer.
    await p.evaluate(async () => {
      for (const img of document.querySelectorAll("img")) img.loading = "eager";
      await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
    });
    await p.emulateMedia({ media: "print" });
    const pdf = await p.pdf({ format: "A4", preferCSSPageSize: true, printBackground: false });
    await p.emulateMedia({ media: "screen" });
    const chemin = join(dossier, `business-arena-${g.public === "etudiant" ? "guide-etudiant" : `guide-${g.public}`}.pdf`);
    writeFileSync(chemin, pdf);
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    dire(`· ${chemin} : ${pages} pages, ${Math.round(pdf.length / 1024)} Ko`);
  }
  await ctx.close();
}

/* ── Le déroulé ────────────────────────────────────────────────────────────── */


try {
  if (DOSSIER_PDF) {
    await lesPdf(DOSSIER_PDF);
  } else {
    const monde = await semerLeMonde();
    dire(`École de démonstration : ${monde.orgId}`);
    if (groupe("classe")) await parcoursDeLaClasse(monde);
    if (groupe("essai")) await parcoursDeLEssai(monde);
    if (groupe("examen")) await parcoursDeLExamen(monde);
    if (groupe("episodes")) {
      await parcoursDesEpisodes(monde);
      await parcoursDesCohortes(monde);
    }
    if (groupe("etablissement")) await parcoursDeLEtablissement(monde);
    if (groupe("moodle")) await parcoursDeMoodle(monde);
    if (groupe("solo")) await etape("solo", parcoursSolo);
    if (groupe("mobile")) await parcoursDuTelephone(monde);
    const attendues = GUIDES.flatMap((g) => g.etapes.map((e) => `${g.public}/${e.capture.fichier}`));
    const manquantes = attendues.filter((a) => !ecrites.includes(a));
    dire(`\n${ecrites.length} captures écrites sur ${attendues.length}.`);
    if (manquantes.length) dire(`Non écrites ce coup-ci : ${manquantes.join(", ")}`);
  }
} finally {
  await navigateur.close();
}
if (echecs.length) {
  console.error(`\n${echecs.length} étape(s) en échec :\n${echecs.join("\n")}`);
  process.exitCode = 1;
}
