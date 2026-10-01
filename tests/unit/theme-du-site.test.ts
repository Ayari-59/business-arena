import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BANDES } from "../../src/config/bandes";
import { Bande, interieurADeContreJour } from "../../src/components/bande";
import {
  THEME_DU_SITE_PAR_DEFAUT,
  contrasteDeLaBande,
  etatDesContrastes,
  normaliserTheme,
  themeDepuisEtat,
  themeParDefaut,
  validerContrastes,
  validerThemeParDefaut,
} from "../../src/config/theme-du-site";
import { THEMES, THEME_DORIGINE, THEME_PAR_DEFAUT } from "../../src/config/themes";

/**
 * CE QUE L'ADMINISTRATEUR PEUT RÉGLER, ET CE QU'ON LUI REFUSE.
 *
 * Le refus est le cœur du réglage : sans lui, trois bandes sombres dans la même
 * fenêtre sont un clic d'admin, et le site perd ce que ses règles lui
 * garantissaient. Chaque scénario ci-dessous est un état qu'une main pourrait
 * composer sans y penser.
 */

const ORIGINE = etatDesContrastes(THEME_DU_SITE_PAR_DEFAUT);
const avec = (mod: Record<string, boolean>) => ({ ...ORIGINE, ...mod });

describe("le thème d'origine", () => {
  it("respecte ses propres règles", () => {
    expect(validerContrastes(ORIGINE)).toEqual([]);
  });

  it("ne stocke aucun écart", () => {
    expect(THEME_DU_SITE_PAR_DEFAUT.contrastes).toEqual({});
    expect(themeDepuisEtat(ORIGINE).contrastes).toEqual({});
  });
});

describe("les refus", () => {
  it("une page ne peut pas perdre toutes ses coupures", () => {
    const fautes = validerContrastes(avec({ "guide.finale": false }));
    expect(fautes.join("\n")).toMatch(/Guide : aucune bande à contre-jour/);
  });

  it("trois bandes à contre-jour sur une page sont refusées", () => {
    const fautes = validerContrastes(
      avec({ "accueil.boucle": true, "accueil.commencer": true }),
    );
    expect(fautes.join("\n")).toMatch(
      /Accueil : 4 bandes à contre-jour, 2 au plus/,
    );
  });

  it("deux bandes qui se suivent sont refusées, nommées dans les mots de l'admin", () => {
    const fautes = validerContrastes(
      avec({ "accueil.commencer": true, "accueil.hero": false }),
    );
    // Les chiffres et « Par où commencer » se suivent : le message les nomme.
    const texte = fautes.join("\n");
    expect(texte).toMatch(
      /« Les chiffres » et « Par où commencer » se suivent/,
    );
    expect(texte, "un identifiant technique fuit dans le message").not.toMatch(
      /accueil\./,
    );
  });

  it("une bande qui n'ouvre pas la page avec son titre ne peut pas être en tête", () => {
    const fautes = validerContrastes(
      avec({ "entreprises.accroche": true, "entreprises.differences": false }),
    );
    // L'accroche porte le titre : elle PEUT ouvrir la page en contre-jour.
    expect(fautes.join("\n")).not.toMatch(/sans porter le titre/);
    const sans = validerContrastes(
      avec({
        "fonctionnalites.intro": true,
        "fonctionnalites.chiffres": false,
      }),
    );
    expect(sans.join("\n")).toMatch(
      /« L'introduction » ouvre la page sans porter le titre/,
    );
  });

  it("une page d'article, listée en partie, ne subit pas les règles de voisinage", () => {
    // Le guide ne liste que sa bande finale : elle n'est pas en tête de page.
    expect(validerContrastes(ORIGINE).join("\n")).not.toMatch(
      /Guide|Notions|Parcours/,
    );
  });

  it("un identifiant inconnu est refusé", () => {
    expect(
      validerContrastes({ ...ORIGINE, "nulle-part.bande": true }).join("\n"),
    ).toMatch(/n'existe pas/);
  });

  it("un réglage valide est accepté : le titre clair, la boucle à contre-jour", () => {
    expect(
      validerContrastes(
        avec({ "accueil.hero": false, "accueil.boucle": true }),
      ),
    ).toEqual([]);
  });

  it("tout refus est écrit en français, et dit où", () => {
    const fautes = validerContrastes(
      avec({ "accueil.boucle": true, "accueil.commencer": true }),
    );
    for (const f of fautes) expect(f).toMatch(/^[A-ZÉ][^:]+ : /);
  });
});

describe("la lecture d'un thème enregistré", () => {
  it("ne garde que ce qui désigne une bande réelle et diffère de l'origine", () => {
    const lu = normaliserTheme({
      contrastes: {
        "accueil.hero": false, // diffère : gardé
        "accueil.chiffres": true, // identique à l'origine : jeté
        "bande.disparue": true, // inconnue : jetée
        "accueil.boucle": "oui", // pas un booléen : jeté
      },
    });
    expect(lu.contrastes).toEqual({ "accueil.hero": false });
  });

  it("survit à une valeur absente ou absurde", () => {
    for (const brut of [
      undefined,
      null,
      42,
      "x",
      [],
      { contrastes: null },
      { contrastes: 3 },
    ]) {
      expect(normaliserTheme(brut)).toEqual({ contrastes: {} });
    }
  });

  it("une bande ajoutée demain reçoit son état d'origine, pas un état figé", () => {
    // Le réglage stocke des ÉCARTS : une bande absente du réglage suit toujours
    // le registre. Une carte complète figerait l'état du jour d'enregistrement.
    const theme = themeDepuisEtat(avec({ "accueil.hero": false }));
    for (const b of BANDES) {
      if (b.id === "accueil.hero") continue;
      expect(contrasteDeLaBande(theme, b.id), b.id).toBe(b.contrasteParDefaut);
    }
  });

  it("aller et retour : un état complet, réduit aux écarts, redonne le même état", () => {
    const etat = avec({ "accueil.hero": false, "accueil.boucle": true });
    expect(etatDesContrastes(themeDepuisEtat(etat))).toEqual(etat);
  });
});

describe("le composant Bande", () => {
  const rendu = (contraste: boolean, interieur: string) =>
    renderToStaticMarkup(
      createElement(Bande, {
        id: "accueil.boucle",
        contraste,
        interieur,
        children: createElement("p", null, "x"),
      }),
    );

  it("pose le contre-jour quand on le lui demande, et pas sinon", () => {
    expect(rendu(true, "mx-auto px-6 py-14")).toContain("contre-jour");
    expect(rendu(false, "mx-auto px-6 py-14")).not.toContain("contre-jour");
  });

  it("nomme la bande par data-bande, sans toucher à un id d'ancre", () => {
    expect(rendu(false, "x")).toContain('data-bande="accueil.boucle"');
    expect(rendu(false, "x")).not.toMatch(/<section[^>]* id=/);
  });

  it("à l'état clair, le conteneur est exactement celui d'avant", () => {
    expect(rendu(false, "mx-auto max-w-5xl px-6 pb-16")).toContain(
      'class="mx-auto max-w-5xl px-6 pb-16"',
    );
  });

  it("à contre-jour, une bande qui n'avait qu'une marge basse reçoit une marge symétrique", () => {
    expect(interieurADeContreJour("mx-auto max-w-5xl px-6 pb-16")).toBe(
      "mx-auto max-w-5xl px-6 py-14",
    );
    expect(interieurADeContreJour("px-6 pt-16 pb-12 lg:pb-24")).toBe(
      "px-6 py-14",
    );
  });

  it("à contre-jour, une bande qui avait déjà une marge symétrique la garde", () => {
    const deja = "mx-auto max-w-6xl px-6 py-12 sm:py-16";
    expect(interieurADeContreJour(deja)).toBe(deja);
  });
});

describe("le thème d'ouverture", () => {
  const AUTRE = THEMES.find((t) => t.code !== THEME_PAR_DEFAUT)!.code;

  it("tant que rien n'est réglé, c'est le thème d'usine", () => {
    expect(themeParDefaut(THEME_DU_SITE_PAR_DEFAUT)).toBe(THEME_PAR_DEFAUT);
    expect(themeParDefaut(undefined)).toBe(THEME_PAR_DEFAUT);
  });

  it("ne se stocke que s'il diffère de l'usine", () => {
    expect(themeDepuisEtat(ORIGINE, THEME_PAR_DEFAUT)).toEqual({ contrastes: {} });
    expect(themeDepuisEtat(ORIGINE, AUTRE)).toEqual({ contrastes: {}, parDefaut: AUTRE });
  });

  it("se relit, et un code inconnu retombe sur l'usine sans erreur", () => {
    expect(themeParDefaut(normaliserTheme({ parDefaut: AUTRE }))).toBe(AUTRE);
    expect(themeParDefaut(normaliserTheme({ parDefaut: "sepia" }))).toBe(THEME_PAR_DEFAUT);
    expect(themeParDefaut(normaliserTheme({ parDefaut: 3 }))).toBe(THEME_PAR_DEFAUT);
    expect(normaliserTheme({ parDefaut: THEME_PAR_DEFAUT })).toEqual({ contrastes: {} });
  });

  it("refuse un code qui n'est pas un thème du site", () => {
    expect(validerThemeParDefaut(AUTRE)).toEqual([]);
    expect(validerThemeParDefaut(THEME_DORIGINE)).toEqual([]);
    expect(validerThemeParDefaut("sepia")).toHaveLength(1);
    expect(validerThemeParDefaut(null)).toHaveLength(1);
  });
});
