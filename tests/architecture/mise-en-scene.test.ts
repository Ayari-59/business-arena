import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  PHOTOS_DES_ENTREPRISES,
  PhotoDuLieu,
  TAILLES_DES_PHOTOS,
  fichierDeLaPhoto,
} from "@/components/illustrations/scene-d-entreprise";
import { QuickConfigFields } from "@/components/quick-config-form";
import { OuvertureDeLaPartie } from "@/components/ouverture-de-la-partie";
import { CompositionDesLieux, GrilleDesLieux, LesNeufLieux } from "@/components/lieux-de-la-vitrine";
import { TuileDuLieu } from "@/components/tuile-du-lieu";
import { SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import { promesseEntreprise, teinteDuMetier } from "@/config/scenarios/presentation";

/**
 * LA MISE EN SCÈNE (lot P2) : LES LIEUX DEVIENNENT L'IMAGE DU PRODUIT.
 *
 * L'audit « cap premium » (écart 6) : les neuf photographies de lieux
 * n'apparaissaient qu'à l'étape Situation du premier tour ; la vitrine et le
 * choix de l'entreprise montraient des pictogrammes au trait, le tour 1
 * s'ouvrait sur une ardoise vide, et le bilan sur trois blocs plats. Ce que
 * cette garde tient :
 *
 *   · chacune des neuf entreprises de /jouer a sa carte PHOTO, qui reste un
 *     vrai contrôle (`aria-pressed`) ; la carte choisie a une coche ;
 *   · une photo mise en scène est décorative (`alt=""`, `aria-hidden`), a sa
 *     place réservée (`width`/`height` du fichier, relus dans les fichiers),
 *     se charge à l'approche de l'écran sauf en haut de page, et prend la
 *     réduite (`-768`) en vignette ;
 *   · la vitrine n'a plus d'anneau décoratif et montre ses lieux, du héros
 *     aux neuf métiers ;
 *   · au tour 1, l'ouverture remplace l'ardoise vide, et il n'y a qu'une
 *     photo à l'écran ; sur téléphone, le lieu ouvre le briefing ;
 *   · l'entrée du lieu est coupée par « moins de mouvement ».
 *
 * LOT P6 « NEUF LIEUX QUI PARLENT » : le nom et le métier passent SUR la
 * photo (`TuileDuLieu`, voile mesuré, teinte dans un trait), à /jouer comme
 * sur la vitrine ; /jouer revient à la grille de 3 × 3 sur téléphone, et la
 * bande des lieux de la vitrine devient une grille de 3 × 3.
 *
 * Le bilan (rang dit une fois, podium à trois hauteurs, « tour le plus
 * maîtrisé ») est gardé par tests/unit/bilan-de-partie.test.ts ; le contraste
 * du texte posé sur les photos, mesuré dans le navigateur, par
 * tests/e2e/mise-en-scene.e2e.ts.
 */

const RACINE = process.cwd();
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), "utf8");
const CSS = lire("src/app/globals.css");

const SCENARIOS_DE_JOUER = SCENARIO_CHOICES.map((s) => ({
  code: s.code,
  secteur: s.sector,
  label: s.shortName,
  sector: SECTOR_LABELS[s.sector],
  tagline: s.tagline,
  teinte: teinteDuMetier(s),
  promesse: promesseEntreprise(s),
}));

const CHOIX = renderToStaticMarkup(
  createElement(QuickConfigFields, {
    scenarios: SCENARIOS_DE_JOUER,
    levels: [1, 2, 3, 4, 5, 6].map((level) => ({ level, name: `N${level}`, tagline: "", decisions: 10 })),
    defaultScenario: "nova",
    lancement: createElement("button", { type: "submit" }, "Lancer la partie"),
  }),
);

describe("les photos mises en scène", () => {
  it("la taille déclarée de chaque photo est celle de son fichier", async () => {
    expect(Object.keys(TAILLES_DES_PHOTOS).sort()).toEqual(Object.keys(PHOTOS_DES_ENTREPRISES).sort());
    for (const [code, t] of Object.entries(TAILLES_DES_PHOTOS)) {
      const m = await sharp(join(RACINE, "public", fichierDeLaPhoto(code))).metadata();
      expect({ largeur: m.width, hauteur: m.height }, code).toEqual(t);
      const r = await sharp(join(RACINE, "public", fichierDeLaPhoto(code, true))).metadata();
      expect(r.width, `${code} réduite`).toBe(768);
    }
  });

  it("une photo est décorative, sa place est réservée, et elle attend l'écran par défaut", () => {
    const html = renderToStaticMarkup(createElement(PhotoDuLieu, { scenario: "hotel" }));
    expect(html).toMatch(/^<img /);
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="1536"');
    expect(html).toContain('height="1024"');
    // Les deux tailles au choix du navigateur, et le cadrage du registre.
    expect(html).toContain(`srcSet="${fichierDeLaPhoto("hotel", true)} 768w, ${fichierDeLaPhoto("hotel")} 1536w"`);
    expect(html).toContain(`object-position:50% ${PHOTOS_DES_ENTREPRISES.hotel!.cadrage}%`);
  });

  it("en haut de page, elle est demandée d'emblée et en premier ; en vignette, la réduite seule", () => {
    const haut = renderToStaticMarkup(createElement(PhotoDuLieu, { scenario: "nova", prioritaire: true }));
    expect(haut).toContain('loading="eager"');
    expect(haut).toMatch(/fetchPriority="high"/i);
    const vignette = renderToStaticMarkup(createElement(PhotoDuLieu, { scenario: "nova", petit: true }));
    expect(vignette).toContain(`src="${fichierDeLaPhoto("nova", true)}"`);
    expect(vignette).not.toContain("srcSet");
    expect(vignette).toContain('width="768"');
    // Une variante de gamme montre le lieu de son entreprise.
    expect(renderToStaticMarkup(createElement(PhotoDuLieu, { scenario: "hotel-gamme" }))).toContain(
      'data-lieu-photo="hotel"',
    );
  });
});

describe("choisir son entreprise : neuf cartes photo", () => {
  const cartes = [...CHOIX.matchAll(/<button[^>]*data-carte-entreprise="([^"]+)"[\s\S]*?<\/button>/g)];

  it("les neuf entreprises ont leur carte, chacune avec sa photo (la réduite, différée)", () => {
    expect(cartes.map((c) => c[1])).toEqual(SCENARIO_CHOICES.map((s) => s.code));
    for (const [carte, code] of cartes) {
      expect(carte, code).toMatch(/aria-pressed="(?:true|false)"/);
      expect(carte, code).toContain(`src="${fichierDeLaPhoto(code!, true)}"`);
      expect(carte, code).toContain('loading="lazy"');
      expect(carte, code).toMatch(/<img[^>]*aria-hidden="true"/);
    }
  });

  it("chaque carte dit le nom et le métier SUR la photo, la teinte dans un trait, et la promesse du registre", () => {
    for (const s of SCENARIOS_DE_JOUER) {
      const carte = cartes.find((c) => c[1] === s.code)![0];
      expect(carte).toContain(`data-metier="${s.teinte}"`);
      // Lot P6 : le nom et le métier sont dans le bloc posé sur la photo,
      // et la photo est dans la même tuile.
      const tuile = carte.slice(carte.indexOf("data-tuile-du-lieu"));
      expect(tuile).toMatch(/<img[^>]*data-lieu-photo/);
      const surPhoto = tuile.slice(tuile.indexOf("data-texte-sur-photo"));
      expect(surPhoto).toContain(s.label.replace(/'/g, "&#x27;").replace(/&(?!#)/g, "&amp;"));
      expect(surPhoto).toContain(s.sector);
      // La teinte ne s'écrit pas sur la photo : elle est dans le trait.
      expect(surPhoto).toContain("data-trait-du-metier");
      expect(surPhoto).not.toMatch(/text-\[color:var\(--metier/);
      expect(s.promesse, s.code).toBeTruthy();
      expect(carte).toContain(s.promesse!.replace(/'/g, "&#x27;"));
    }
  });

  it("sur téléphone, trois colonnes de tuiles ; deux puis trois colonnes de cartes au-delà", () => {
    const grille = CHOIX.match(/<div data-grille-des-entreprises=""[^>]*class="([^"]+)"/)?.[1] ?? "";
    expect(grille.split(" ")).toEqual(expect.arrayContaining(["grid", "grid-cols-3", "sm:grid-cols-2", "lg:grid-cols-3"]));
    // L'accroche ne se pose pas dans une tuile de téléphone.
    const carte = cartes[0]![0];
    const accroche = carte.slice(carte.lastIndexOf("<span", carte.indexOf(SCENARIOS_DE_JOUER[0]!.promesse!)));
    expect(accroche).toMatch(/max-sm:hidden|^<span class="[^"]*"/);
    expect(carte).toMatch(/class="[^"]*max-sm:hidden[^"]*"><span[^>]*>Prenez les commandes/);
  });

  it("la carte choisie : un filet plein et une coche, pas un fond délavé ; une seule à la fois", () => {
    const choisies = cartes.filter((c) => c[0].includes('aria-pressed="true"'));
    expect(choisies.map((c) => c[1])).toEqual(["nova"]);
    const choisie = choisies[0]![0];
    expect(choisie).toContain("border-amber-400 ring-1 ring-amber-400");
    expect(choisie).not.toMatch(/bg-amber-\d+\/\d+/);
    expect(choisie).toContain("data-coche");
    for (const c of cartes.filter((c) => c[0].includes('aria-pressed="false"'))) {
      expect(c[0]).not.toContain("data-coche");
    }
  });

  it("un seul bouton de lancement, dans le résumé collant", () => {
    const resume = CHOIX.slice(CHOIX.indexOf("data-resume-de-lancement"));
    expect(CHOIX.slice(0, CHOIX.indexOf("data-resume-de-lancement"))).not.toContain("Lancer la partie");
    expect(resume).toMatch(/^[^>]*class="[^"]*\bsticky bottom-0\b/);
    expect(resume).toContain("NOVA · Niveau 3");
    expect(resume.match(/Lancer la partie/g) ?? []).toHaveLength(1);
    const page = lire("src/app/jouer/page.tsx");
    expect(page.match(/Lancer la partie/g) ?? []).toHaveLength(1);
    expect(page).toMatch(/lancement=\{\s*\/\/[^\n]*\n\s*<SubmitButton/);
  });
});

describe("la vitrine montre ses lieux", () => {
  const ACCUEIL = lire("src/app/page.tsx");

  it("le grand anneau décoratif est retiré du héros ; la composition des lieux prend sa place", () => {
    expect(ACCUEIL).not.toContain("<HaloDePage");
    const heros = ACCUEIL.slice(ACCUEIL.indexOf('id="accueil.hero"'), ACCUEIL.indexOf("<BandeauDeLaPartie"));
    expect(heros).toContain("<CompositionDesLieux");
    expect(heros).toContain("<GrilleDesLieux");
    // Le titre vient avant les photos dans le document : il est lu d'abord.
    expect(heros.indexOf("<h1")).toBeLessThan(heros.indexOf("<CompositionDesLieux"));
    // Et la grille du téléphone vient APRÈS le bouton du héros (lot P6 :
    // « Tester le simulateur », qui remplace « Commencer une partie »).
    expect(heros).not.toMatch(/>\s*Commencer une partie\s*</);
    expect(heros.indexOf("Tester le simulateur")).toBeGreaterThan(0);
    expect(heros.indexOf("Tester le simulateur")).toBeLessThan(heros.indexOf("<GrilleDesLieux"));
  });

  it("la composition : trois ou quatre lieux, nommés en vrai texte SUR la photo, chargés d'emblée", () => {
    const html = renderToStaticMarkup(createElement(CompositionDesLieux));
    const lieux = html.match(/<figure/g) ?? [];
    expect(lieux.length).toBeGreaterThanOrEqual(3);
    expect(lieux.length).toBeLessThanOrEqual(4);
    // Lot P6 : plus de légende sous la photo ; un texte sur la photo par lieu.
    expect(html.match(/data-texte-sur-photo/g) ?? []).toHaveLength(lieux.length);
    expect(html.match(/data-trait-du-metier/g) ?? []).toHaveLength(lieux.length);
    expect(html.match(/data-metier="/g) ?? []).toHaveLength(lieux.length);
    expect(html).not.toContain('loading="lazy"');
  });

  it("sur téléphone, les neuf lieux en grille de 3 × 3, nommés sur la photo, la réduite seule", () => {
    const html = renderToStaticMarkup(createElement(GrilleDesLieux));
    expect(html).toMatch(/<ul data-grille-des-lieux=""[^>]*class="[^"]*\bgrid grid-cols-3\b/);
    expect(html.match(/<li/g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
    expect(html.match(/data-texte-sur-photo/g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
    expect(html).toContain(`src="${fichierDeLaPhoto("nova", true)}"`);
    expect(html).not.toContain("srcSet");
    // Sous la ligne de flottaison : elles attendent l'écran.
    expect(html.match(/loading="lazy"/g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
  });

  it("la tuile du lieu : photo décorative, voile, nom et métier en vrai texte, teinte dans un trait", () => {
    const html = renderToStaticMarkup(
      createElement(TuileDuLieu, { code: "fitness", nom: "VOLT FITNESS", metier: "Abonnement" }),
    );
    expect(html).toMatch(/^<span data-tuile-du-lieu="fitness" class="ardoise /);
    expect(html).toMatch(/<img[^>]*alt=""[^>]*aria-hidden="true"/);
    expect(html).toContain("voile-du-lieu");
    const texte = html.slice(html.indexOf("data-texte-sur-photo"));
    expect(texte).toContain(">VOLT FITNESS<");
    expect(texte).toContain(">Abonnement<");
    expect(texte).toMatch(/data-trait-du-metier=""[^>]*bg-\[color:var\(--metier/);
    expect(texte).not.toMatch(/text-\[color:var\(--metier/);
    expect(CSS).toMatch(/\n\.voile-du-lieu \{[^}]*linear-gradient\(\s*to top/);
  });

  it("les neuf métiers, plus bas, sont des photos et non plus des pictogrammes", () => {
    const metiers = ACCUEIL.slice(ACCUEIL.indexOf('id="accueil.metiers"'), ACCUEIL.indexOf("<QuiFaitQuoi"));
    expect(metiers).toContain("<LesNeufLieux");
    expect(metiers).not.toContain("<PictoSecteur");
    const html = renderToStaticMarkup(createElement(LesNeufLieux));
    expect(html.match(/<img /g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
    expect(html.match(/loading="lazy"/g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
    // Lot P6 : même traitement, le nom sur la photo.
    expect(html.match(/data-texte-sur-photo/g) ?? []).toHaveLength(SCENARIO_CHOICES.length);
  });
});

describe("l'ouverture de la partie : le lieu, avant tout chiffre", () => {
  const ARENE = lire("src/app/arena/[gameId]/page.tsx");

  it("au tour 1, l'ouverture prend la place de l'ardoise ; dès le tour 2, l'ardoise revient", () => {
    const tete = ARENE.slice(ARENE.indexOf("const tableauNode"), ARENE.indexOf("</TableauDeBord>"));
    expect(tete).toMatch(/if \(premierTour\) \{\s*return telephone \? null : \(\s*<OuvertureDeLaPartie/);
    expect(tete.indexOf("<OuvertureDeLaPartie")).toBeLessThan(tete.indexOf("<TableauDeBord"));
  });

  it("au tour 1, une seule photo : la feuille de présentation ne la répète pas sur ordinateur", () => {
    const presentation = ARENE.slice(
      ARENE.indexOf("const presentation = premierTour"),
      ARENE.indexOf("const chiffres ="),
    );
    expect(presentation).not.toContain("<SceneDEntreprise");
    expect(presentation).not.toContain("<PhotoDuLieu");
    // La seule photo de la présentation est l'ouverture du téléphone.
    expect(presentation).toMatch(/\{telephone \? \(\s*<div\s+data-en-tete-illustre[\s\S]*?<OuvertureDeLaPartie\s+forme="carte"/);
  });

  it("sur téléphone, la carte du lieu ouvre le briefing", () => {
    const cartes = ARENE.slice(ARENE.indexOf("const briefingCartes"));
    const premiere = cartes.indexOf('cle: "');
    expect(cartes.slice(premiere, premiere + 30)).toContain('cle: "presentation"');
  });

  it("le nom, le métier et la prise de poste sont du texte, posé sur un voile ; la photo est décorative", () => {
    const html = renderToStaticMarkup(
      createElement(OuvertureDeLaPartie, {
        scenario: "nova",
        secteur: "industrie",
        entreprise: "NOVA",
        metier: "Industrie · Niveau 3 · Pilotage",
        description: "Fabricant d'enceintes portables.",
        tour: "Tour 1 / 6",
        phrase: "Prenez les commandes.",
      }),
    );
    expect(html).toMatch(/<h2[^>]*>NOVA<\/h2>/);
    expect(html).toContain("Tour 1 / 6");
    expect(html).toMatch(/<img[^>]*aria-hidden="true"[^>]*data-lieu-photo="nova"/);
    expect(html).toContain('loading="eager"');
    expect(html).toContain("voile-de-scene");
    // Sur téléphone, le tour n'est pas redit : la barre de la partie le porte.
    const carte = renderToStaticMarkup(
      createElement(OuvertureDeLaPartie, {
        scenario: "nova",
        secteur: "industrie",
        entreprise: "NOVA",
        metier: "Industrie",
        description: "",
        phrase: "",
        forme: "carte",
      }),
    );
    expect(carte).not.toContain("Tour 1");
    expect(carte).toContain(`src="${fichierDeLaPhoto("nova", true)}"`);
  });

  it("les voiles existent, et l'entrée du lieu se coupe avec « moins de mouvement »", () => {
    expect(CSS).toMatch(/\n\.voile-de-scene \{[^}]*linear-gradient/);
    expect(CSS).toMatch(/\n\.voile-de-cloture \{[^}]*linear-gradient/);
    const coupure = CSS.slice(CSS.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(coupure.slice(0, coupure.indexOf("animation: none"))).toContain(".entree-du-lieu");
  });
});
