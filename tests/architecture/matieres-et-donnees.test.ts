import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MATIÈRES ET DONNÉES (lot P3).
 *
 * L'audit « cap premium » (écart 3) : tous les panneaux du cockpit portaient le
 * même filet lilas de 2 px en tête, le même dégradé, la même ombre. Le panneau
 * où l'on décide pesait autant que celui où l'on consulte, et l'arête du
 * métier, répétée partout, n'était plus qu'un motif. Ce que cette garde fige,
 * dans l'arène (la fermeture des imports de `src/app/arena`) :
 *
 *   1. TROIS RÔLES, LES SEULS HABILLAGES DE PANNEAU : le panneau de DÉCISION
 *      (`panneau-decision` : relevé, arête du métier), le panneau
 *      d'INFORMATION (`panneau-info` : plat, filet discret), le DOCUMENT
 *      (`papier`). Plus de `panneau` nu, plus d'`arete-metier`, plus de
 *      `carte` hors de l'objet flottant nommé (le menu de la barre), plus de
 *      filet de signe vert ou rouge sur un panneau.
 *   2. L'ARÊTE DU MÉTIER N'EXISTE QUE SUR LE PANNEAU DE DÉCISION, et une seule
 *      fois par écran : la feuille la pose sur le premier panneau de décision
 *      d'une étape et la retire à ceux qui le suivent. (Mesuré à l'écran par
 *      `tests/e2e/matieres-et-donnees.e2e.ts`.)
 *   3. PLUS DE POINTILLÉ dans l'arène, hors de deux objets imités du courrier
 *      (le tampon de l'enveloppe et la fenêtre du destinataire).
 *   4. UNE SEULE NAVIGATION D'ONGLETS dans un tour clos : le tableau de bord y
 *      devient un sommaire d'ancres.
 *   5. LE COURRIER POSÉ, et le verdict sans grand triangle.
 *   6. (lot P7) LE CADRAN DU RÉSULTAT ESTIMÉ, quatrième rôle : collant en tête
 *      de la feuille, relevé, il porte l'arête de la feuille à la place du
 *      panneau de décision ; et L'ENVELOPPE POSÉE, redessinée, rabat ancré,
 *      sans étiquette en pointillé.
 * La cascade du verdict a sa propre garde : `tests/unit/cascade-du-resultat.test.ts`.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");
const lire = (p: string) => readFileSync(join(RACINE, p), "utf8");
const CSS = lire("src/app/globals.css");

function tous(dossier: string): string[] {
  return readdirSync(dossier).flatMap((e) => {
    const c = join(dossier, e);
    return statSync(c).isDirectory() ? tous(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

function resoudre(depuis: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(depuis), spec);
  else return null;
  for (const c of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/** L'arène : la fermeture des imports de `src/app/arena`, dans `src/components` et `src/app`. */
function arene(): string[] {
  const vus = new Set<string>();
  const pile = [...tous(join(SRC, "app/arena"))];
  while (pile.length) {
    const f = pile.pop()!;
    if (vus.has(f)) continue;
    vus.add(f);
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(
      /(?:import|export)[\s\S]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g,
    )) {
      const r = resoudre(f, (m[1] ?? m[2])!);
      if (r && !vus.has(r)) pile.push(r);
    }
  }
  return [...vus].filter((f) => /\/src\/(?:components|app)\//.test(f)).sort();
}

/** Le code sans ses commentaires : un commentaire qui raconte l'ancien habillage n'est pas du style. */
const code = (source: string) =>
  source
    // Un commentaire JSX commence par `{/*` : sans ce préfixe exact, l'accolade
    // d'une interface suivie de sa documentation passerait pour l'un d'eux.
    .replace(/\{\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

/** Les chaînes de classes d'un fichier : `className="…"`, `className={`…`}`, et les constantes de classes. */
function classes(source: string): string[] {
  return [
    ...source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g),
    ...source.matchAll(/:\s*"((?:[\w:[\]/.-]+\s+)*(?:panneau|carte|arete-metier)[\w-]*(?:\s+[\w:[\]/.-]+)*)"/g),
  ].map((m) => (m[1] ?? m[2] ?? "").trim());
}

const ARENE = arene().map((f) => ({ nom: f.slice(SRC.length + 1), code: code(readFileSync(f, "utf8")) }));

/** Une règle de la feuille : le texte entre l'accolade de son sélecteur exact et la suivante. */
function regle(selecteur: string): string {
  const i = CSS.indexOf(`\n${selecteur} {`);
  expect(i, `règle « ${selecteur} » introuvable`).toBeGreaterThan(-1);
  return CSS.slice(i, CSS.indexOf("}", i));
}

const CSS_SANS_COMMENTAIRES = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

describe("1. trois rôles, les seuls habillages de panneau de l'arène", () => {
  it("le périmètre est bien l'arène (feuille de décision, tours clos, verdict, courrier)", () => {
    const noms = ARENE.map((f) => f.nom);
    for (const attendu of [
      "components/decision-form.tsx",
      "components/period-dashboard.tsx",
      "components/tour-simule.tsx",
      "components/courrier-du-tour.tsx",
      "components/tiroir.tsx",
      "components/bande-de-marche.tsx",
      "components/resultat-estime.tsx",
    ]) {
      expect(noms).toContain(attendu);
    }
  });

  it("les deux rôles du cockpit sont définis dans la feuille, une fois, avec leur matière", () => {
    const decision = regle(".panneau-decision");
    expect(decision).toContain("background-color: var(--sol-panneau");
    expect(decision).toContain("var(--ombre-douce)");
    expect(decision).not.toContain("--metier");
    const info = regle(".panneau-info");
    expect(info).toContain("border: 1px solid var(--filet-information)");
    expect(info).toContain("background-color: transparent");
    expect(info).toContain("background-image: none");
    expect(info).toContain("box-shadow: none");
    // L'ancien habillage unique n'existe plus.
    expect(CSS_SANS_COMMENTAIRES).not.toMatch(/(^|[\s,}])\.panneau\s*[{,.:]/m);
    expect(CSS_SANS_COMMENTAIRES).not.toMatch(/\.arete-metier\b/);
  });

  it("aucun composant de l'arène ne s'habille autrement qu'avec un rôle", () => {
    const fautes: string[] = [];
    for (const f of ARENE) {
      for (const c of classes(f.code)) {
        // Une interpolation (`${carte ? "" : "rounded-xl"}`) est du code : seules
        // ses chaînes sont des classes (le nom `carte` d'une variable n'en est pas une).
        const interpolees = [...c.matchAll(/\$\{[^}]*\}/g)].flatMap((m) =>
          [...m[0].matchAll(/"([^"]*)"/g)].map((x) => x[1]!),
        );
        const mots = [c.replace(/\$\{[^}]*\}/g, " "), ...interpolees].join(" ").split(/\s+/);
        if (mots.includes("panneau")) fautes.push(`${f.nom} : « panneau » nu`);
        if (mots.includes("arete-metier")) fautes.push(`${f.nom} : arete-metier`);
        // `carte` : le seul objet flottant de l'arène, le menu de la barre.
        if (mots.includes("carte") && f.nom !== "components/barre-de-jeu.tsx") {
          fautes.push(`${f.nom} : carte (« ${c.slice(0, 60)} »)`);
        }
        if (mots.includes("lumiere-de-scene") && f.nom !== "app/arena/[gameId]/page.tsx") {
          fautes.push(`${f.nom} : lumière de scène sur un panneau`);
        }
        // Un filet de signe vert ou rouge sur un panneau : le rouge va au chiffre seul.
        if (mots.some((m) => /^border-l-(?:emerald|red|rose)-\d/.test(m))) {
          fautes.push(`${f.nom} : filet de signe (« ${c.slice(0, 60)} »)`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it("le menu de la barre reste la seule carte, et la lumière de scène ne vit que sur le sol de l'arène", () => {
    const barre = ARENE.find((f) => f.nom === "components/barre-de-jeu.tsx")!;
    expect(classes(barre.code).filter((c) => c.split(/\s+/).includes("carte"))).toHaveLength(1);
    const page = ARENE.find((f) => f.nom === "app/arena/[gameId]/page.tsx")!;
    const scenes = classes(page.code).filter((c) => c.split(/\s+/).includes("lumiere-de-scene"));
    expect(scenes).toHaveLength(1);
    expect(page.code).toMatch(/<main id="main" data-ecran-de-jeu=""[^>]*className="ardoise lumiere-de-scene/);
  });

  it("chaque panneau de l'arène a pris le rôle de l'inventaire du lot", () => {
    // Le panneau de DÉCISION : là où l'on saisit, et lui seul.
    expect(lire("src/components/decision-form.tsx")).toContain('tone = "panneau-decision"');
    // Les panneaux d'INFORMATION : ce qu'on consulte.
    const info: [string, RegExp][] = [
      ["src/components/aide-repliable.tsx", /<div className="panneau-info /], // capacité de production, repères
      ["src/components/bande-de-marche.tsx", /className="panneau-info /],
      // LOT P7 : le résultat estimé n'est plus un panneau d'information plat (il
      // ne se voyait pas) ; il a son rôle, le cadran (voir le bloc 6).
      ["src/components/tableau-de-bord.tsx", /className="ardoise panneau-info /], // l'ardoise
      ["src/components/tiroir.tsx", /"panneau-info group"/],
      ["src/components/decision-context.tsx", /className="panneau-info /], // arbitrage, paramètres
      ["src/components/revelation-du-tour.tsx", /className=\{`panneau-info /], // verdict d'un tour clos
      ["src/components/period-dashboard.tsx", /className="panneau-info /], // graphiques, classement, RSE
      ["src/components/study-reports.tsx", /<article className="panneau-info /],
    ];
    for (const [fichier, motif] of info) expect(lire(fichier), fichier).toMatch(motif);
    // Les panneaux de décision ne servent nulle part ailleurs.
    const decisions = ARENE.filter((f) => /panneau-decision/.test(f.code)).map((f) => f.nom);
    expect(decisions).toEqual(["components/decision-form.tsx"]);
  });
});

describe("2. l'arête du métier : le panneau de décision en cours, une fois par écran", () => {
  it("la teinte du métier ne coiffe un panneau du cockpit qu'en tête du panneau de décision", () => {
    // Toutes les arêtes de métier de la feuille (ombre intérieure de 2 px, ou bordure de tête).
    const aretes = [
      ...CSS_SANS_COMMENTAIRES.matchAll(
        /([^{}]+)\{[^}]*(?:inset 0 2px 0(?: 0)? var\(--metier|border-top:\s*2px solid var\(--metier)[^}]*\}/g,
      ),
    ].map((m) => m[1]!.trim());
    expect(aretes).toEqual([
      // Les épisodes, hors du cockpit : leurs cartes gardent leur filet (lot 5A).
      "[data-metier] .carte:not(.ardoise):not(.carte .carte):not([data-ecran-de-jeu] *)",
      "[data-metier] .panneau-decision",
      // LOT P7 : le cadran du résultat estimé, qui la prend au panneau de
      // décision quand il est là (voir le bloc 6).
      "[data-metier] .cadran-estime",
    ]);
  });

  it("le panneau de décision qui en suit un autre perd l'arête", () => {
    const suite = regle("[data-metier] .panneau-decision ~ .panneau-decision");
    expect(suite).toContain("inset 0 1px 0 var(--arete-lumiere)");
    expect(suite).not.toContain("--metier");
    // Et le cadre du tour en cours n'en porte plus.
    expect(CSS_SANS_COMMENTAIRES).not.toMatch(/#tour-en-cours\s*\{[^}]*--metier/);
  });

  it("une tuile de chiffre ne porte plus de bande de couleur (ni métier, ni signe)", () => {
    const tuile = code(lire("src/components/kpi-card.tsx"));
    expect(tuile).not.toMatch(/stripe|inset-y-0 left-0 w-1|--metier/);
  });
});

describe("3. plus de pointillé dans l'arène", () => {
  it("hors des deux objets imités du courrier, aucun `border-dashed`", () => {
    const pointilles = ARENE.flatMap((f) =>
      [...f.code.matchAll(/border-dashed/g)].map(() => f.nom),
    );
    // Le tampon de l'enveloppe (la nature du pli) et la fenêtre du destinataire :
    // des OBJETS qui imitent le vrai courrier, pas des cadres d'interface.
    expect(pointilles).toEqual(["components/courrier.tsx", "components/courrier.tsx"]);
    const courrier = lire("src/components/courrier.tsx");
    expect(courrier).toMatch(/-rotate-2 rounded-md border border-dashed/); // le tampon
    expect(courrier).toMatch(/creux filet inline-block rounded-md border border-dashed/); // la fenêtre
    // /jouer aussi : le repli des options du marché a un filet plein.
    expect(lire("src/components/quick-config-form.tsx")).not.toContain("border-dashed");
  });

  it("la feuille ne trace plus de pointillé sur un repli, ni ailleurs que sur l'échelle vide d'un épisode", () => {
    const dashed = [...CSS_SANS_COMMENTAIRES.matchAll(/([^{}]+)\{[^}]*dashed[^}]*\}/g)].map((m) =>
      m[1]!.trim(),
    );
    expect(dashed).toEqual([".echelle.echelle-vide"]);
  });
});

describe("4. un tour clos : une seule navigation d'onglets", () => {
  it("le tableau de bord d'un tour clos se lit en sommaire, sous les onglets du tour", () => {
    const tableau = lire("src/components/period-dashboard.tsx");
    expect(tableau).toContain('navigation = "sommaire"');
    expect(tableau).toContain("<SommaireDuTour");
    expect(tableau).toMatch(/if \(navigation === "onglets"\) \{\s*return <DashboardTabs>/);
    const page = lire("src/app/arena/[gameId]/page.tsx");
    const onglets = page.slice(page.indexOf("const ongletsDuTour"), page.indexOf("const toursPassesDe"));
    expect(onglets).toContain("<SegmentedTabs");
    expect(onglets).toContain("<PeriodDashboard");
    expect(onglets).not.toContain('navigation="onglets"');
    // Les onglets du tableau de bord ne restent que là où ils sont la seule navigation :
    // la carte « Résultats » du téléphone.
    expect(page.match(/navigation="onglets"/g) ?? []).toHaveLength(1);
    const carte = page.slice(page.indexOf("const resultatsCartes"), page.indexOf("const briefingCartes"));
    expect(carte).toContain('navigation="onglets"');
  });

  it("le sommaire n'a pas de cadre d'onglet : des ancres, la face lue à la teinte du métier", () => {
    const sommaire = code(lire("src/components/sommaire-du-tour.tsx"));
    expect(sommaire).not.toMatch(/role="tab|tablist|bg-slate-700|rounded-lg bg-slate-950/);
    expect(sommaire).toContain("href={`#${idBase}-${f.cle}`}");
    expect(sommaire).toContain('aria-current={active ? "location" : undefined}');
    expect(sommaire).toContain("var(--metier,var(--color-slate-300))");
    expect(sommaire).not.toMatch(/amber|orange|accent/);
    expect(sommaire).toMatch(/lg:sticky lg:top-24/);
  });

  it("un tour en perte n'est pas cerné de rouge : la liste des tours, le chiffre seul en couleur", () => {
    const page = code(lire("src/app/arena/[gameId]/page.tsx"));
    const liste = page.slice(page.indexOf("const toursPassesDe"), page.indexOf("const toursPasses ="));
    expect(liste).toMatch(/data-liste-des-tours=""\s+className="panneau-info divide-y/);
    const ligne = liste.slice(liste.indexOf("data-tour-passe"), liste.indexOf("</summary>"));
    expect(ligne).not.toMatch(/border-l-|border-emerald|border-red|border-2/);
    // Le résultat du tour garde sa couleur, sur le chiffre.
    expect(ligne).toMatch(/netIncome >= 0 \? "text-emerald-300" : "text-red-300"/);
  });
});

describe("5. le courrier posé, le verdict sans grand triangle", () => {
  it("le courrier du tour n'est plus dans un panneau ; la lettre se pose seule, la note au pied", () => {
    const courrier = code(lire("src/components/courrier-du-tour.tsx"));
    const section = courrier.slice(courrier.indexOf("data-courrier-du-tour"));
    expect(section).not.toMatch(/className="[^"]*\b(?:carte|panneau-info|panneau-decision)\b/);
    expect(section).toContain('grilleDeCourriers(vide ? 1 : plis.length, "posee")');
    // LOT P4 avait retiré l'enveloppe ouverte (rabat flottant, étiquette en
    // pointillé serrée). LOT P7 : elle revient REDESSINÉE (bloc 6), à côté d'un
    // pli seul, hors du parcours du téléphone ; l'ancienne n'existe plus.
    expect(CSS).not.toContain(".enveloppe-ouverte");
    expect(section).toMatch(/\{seul && !enParcours \? \(\s*<EnveloppeOuverte /);
    expect(section.match(/<EnveloppeOuverte /g) ?? []).toHaveLength(1);
    expect(section).toContain('"mx-auto w-full sm:max-w-[40rem]"');
    // « J'ai pris note » vient APRÈS les lettres, au pied de la colonne de la lettre.
    expect(section.indexOf("pris note")).toBeGreaterThan(section.indexOf("<CourrierRecommande"));
    expect(lire("src/components/courrier.tsx")).toMatch(/"courriers-poses grid"/);
  });

  it("la rotation de la lettre est sous un degré, et jamais sur téléphone", () => {
    const i = CSS.indexOf("LE COURRIER POSÉ");
    const bloc = CSS.slice(i, CSS.indexOf("@media print", i));
    const rotations = [...bloc.matchAll(/rotate\((-?[\d.]+)deg\)/g)].map((m) => Number(m[1]));
    expect(rotations.length).toBeGreaterThan(0);
    // Les seules rotations du bloc sont celles des lettres posées.
    const lettres = [...bloc.matchAll(/\.courriers-poses[^{]*\{\s*transform: rotate\((-?[\d.]+)deg\)/g)].map(
      (m) => Number(m[1]),
    );
    expect(lettres.length).toBe(2);
    for (const r of lettres) expect(Math.abs(r)).toBeLessThanOrEqual(1);
    // Toutes les rotations de lettre sont dans le bloc d'écran large.
    const large = bloc.slice(bloc.indexOf("@media (min-width: 640px)"));
    expect(large.indexOf(".courriers-poses > *")).toBeGreaterThan(-1);
    expect(bloc.slice(0, bloc.indexOf("@media (min-width: 640px)"))).not.toMatch(
      /\.courriers-poses[^{]*\{[^}]*rotate/,
    );
  });

  it("le chiffre du rituel n'a plus de grand triangle ; l'écart garde une flèche fine", () => {
    const verdict = code(lire("src/components/verdict-du-marche.tsx"));
    expect(verdict).toContain("{chiffre.sens && !ecran ? (");
    expect(verdict).not.toMatch(/text-4xl sm:text-5xl/);
    expect(verdict).toContain("<FlecheFine sens={ecart.sens} />");
    expect(verdict).toMatch(/strokeWidth="1\.5"/);
  });
});

describe("6. lot P7 : le cadran du résultat estimé, l'enveloppe posée", () => {
  it("le cadran est un rôle à lui : collant sous les barres, relevé, l'arête du métier", () => {
    const cadran = regle(".cadran-estime");
    expect(cadran).toContain("position: sticky");
    expect(cadran).toContain("top: var(--haut-collant");
    expect(cadran).toContain("background-color: var(--sol-panneau");
    expect(cadran).toContain("inset 0 1px 0 var(--arete-lumiere)");
    expect(cadran).toContain("var(--ombre-douce)");
    expect(regle("[data-metier] .cadran-estime")).toContain("inset 0 2px 0 var(--metier");
    // Ce n'est ni un panneau d'information, ni un panneau de décision.
    const encart = lire("src/components/resultat-estime.tsx");
    expect(encart).toMatch(/className="cadran-estime"/);
    expect(code(encart)).not.toMatch(/panneau-info|panneau-decision/);
    // Et il est seul à porter ce rôle.
    const porteurs = ARENE.filter((f) => /cadran-estime/.test(f.code)).map((f) => f.nom);
    expect(porteurs).toEqual(["components/resultat-estime.tsx"]);
  });

  it("une seule arête par écran : quand le cadran est là, le panneau de décision perd la sienne", () => {
    const sans = regle("[data-metier] form:has(> .cadran-estime) .panneau-decision");
    expect(sans).toContain("inset 0 1px 0 var(--arete-lumiere)");
    expect(sans).not.toContain("--metier");
    // Le cadran est le premier enfant de la feuille, avant la piste des étapes :
    // il colle tant que la feuille est à l'écran, de la première étape à la
    // validation.
    const feuille = code(lire("src/components/decision-form.tsx"));
    const debut = feuille.indexOf("onInvalidCapture={revelerFamilleInvalide}");
    const cadran = feuille.indexOf("<EncartResultatEstime", debut);
    expect(cadran).toBeGreaterThan(debut);
    expect(cadran).toBeLessThan(feuille.indexOf("data-piste-des-etapes", debut));
    expect(cadran).toBeLessThan(feuille.indexOf("propositionDeVentes", debut));
    expect(feuille.match(/<EncartResultatEstime\b/g) ?? []).toHaveLength(1);
  });

  it("l'enveloppe, quand elle est là : rabat ancré, sans étiquette en pointillé, un décor", () => {
    const source = lire("src/components/courrier.tsx");
    const env = code(source.slice(source.indexOf("export function EnveloppeOuverte")));
    const corpsDe = env.slice(0, env.indexOf("\nexport function"));
    expect(corpsDe).toContain("aria-hidden");
    expect(corpsDe).toContain('data-enveloppe-posee=""');
    // Un courriel n'a pas d'enveloppe.
    expect(corpsDe).toContain('c.pli === "email"');
    // LE RABAT EST ANCRÉ : il est dans le MÊME dessin que le corps, et sa base
    // est le bord haut du corps (même ordonnée, d'un bord à l'autre).
    const rabat = corpsDe.match(/data-rabat="" d="M0 (\d+) L[^"]* L216 (\d+) Z"/);
    const corps = corpsDe.match(/data-corps=""\s+d="M0 (\d+) H216 /);
    expect(rabat, "le rabat n'est plus un chemin du dessin").not.toBeNull();
    expect(corps, "le corps n'est plus un chemin du dessin").not.toBeNull();
    expect(rabat![1]).toBe(corps![1]);
    expect(rabat![2]).toBe(corps![1]);
    expect(corpsDe.match(/<svg\b/g)?.length, "le corps et le rabat, un seul dessin").toBe(2); // la forme, et l'oblitération
    // Pas d'étiquette : ni pointillé, ni capitales, ni la nature du pli (elle reste sur la lettre).
    expect(corpsDe).not.toMatch(/dashed|dotted|uppercase|NATURES|nature\.|cachet-or/);
    // Le papier, un cran plus foncé que la lettre ; l'ombre, sur la forme entière.
    expect(regle(".enveloppe-posee-forme")).toMatch(/filter: drop-shadow/);
    expect(corpsDe).toMatch(/data-corps=""[^>]*fill="#eef1f5"/);
    expect(corpsDe).toMatch(/data-rabat="" d="[^"]*" fill="#dfe5ed"/);
  });

  it("l'enveloppe se pose si la place le permet, jamais sur téléphone, et sa rotation est statique", () => {
    const p7 = CSS.slice(CSS.indexOf("LOT P7 — LE RÉSULTAT ESTIMÉ SOUS LES YEUX"));
    // Cachée par défaut ; posée seulement quand la SECTION a la place de la
    // lettre (40 rem) et de deux marges d'enveloppe.
    expect(p7).toMatch(/\.enveloppe-posee \{\s*display: none;/);
    expect(p7).toMatch(/@container \(min-width: 72\.5rem\) \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 40rem minmax\(0, 1fr\)/);
    expect(p7).toMatch(/\.courrier-pose-seul-grille > \.enveloppe-posee \{\s*display: block;/);
    // Une rotation, faible, et rien qui s'anime (pas de coupure de mouvement à prévoir).
    const env = p7.slice(p7.indexOf("L'ENVELOPPE POSÉE ─"));
    const rotations = [...env.matchAll(/\.enveloppe-posee \{[^}]*rotate\((-?[\d.]+)deg\)/g)].map((m) => Number(m[1]));
    expect(rotations).toHaveLength(1);
    expect(Math.abs(rotations[0]!)).toBeLessThanOrEqual(3);
    expect(env).not.toMatch(/animation|transition/);
    // Hors du parcours du téléphone (voir le bloc 5) : `enParcours` l'écarte.
    expect(lire("src/components/courrier-du-tour.tsx")).toContain('className={seul && !enParcours ? "courrier-pose-seul" : ""}');
  });
});

describe("ajouts : le résumé collant de /jouer", () => {
  it("s'aligne sur la grille des entreprises : plus de marge négative qui le faisait déborder", () => {
    const choix = lire("src/components/quick-config-form.tsx");
    const balise = choix.slice(choix.indexOf("data-resume-de-lancement"));
    const classe = balise.match(/className="([^"]*)"/)![1]!;
    expect(classe).toMatch(/\bsticky bottom-0\b/);
    expect(classe).not.toMatch(/(?:^|\s)(?:sm:|md:|lg:)?-m[xlr]-/);
    expect(classe).toMatch(/\brounded-xl\b/);
  });
});
