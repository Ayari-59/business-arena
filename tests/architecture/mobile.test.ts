import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PREFIXES_DES_ECRANS_DE_JEU,
  estEcranDeJeu,
} from "../../src/config/ecrans-de-jeu";
import { THEMES, couleurDeBarre } from "../../src/config/themes";

/**
 * L'APPLICATION SUR UN TÉLÉPHONE : CE QUI SE GARDE DANS LA SOURCE.
 *
 * Les mesures (taille réelle des zones tactiles, des textes) sont dans
 * tests/e2e/mobile.e2e.ts, qui lance un navigateur. Ce fichier tient ce qu'un
 * navigateur ne dit pas : que les réglages d'installation viennent bien du site
 * et qu'un composant n'en réintroduit pas un autre en dur.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf-8");
const LAYOUT = lire("src/app/layout.tsx");
const GLOBALS = lire("src/app/globals.css");

describe("les écrans de jeu", () => {
  it("l'arène et la compétition en sont, la vitrine non", () => {
    expect(estEcranDeJeu("/arena/abc")).toBe(true);
    expect(estEcranDeJeu("/compete/abc")).toBe(true);
    for (const page of [
      "/",
      "/jouer",
      "/enseignants",
      "/guide",
      "/join",
      null,
      undefined,
    ]) {
      expect(estEcranDeJeu(page), String(page)).toBe(false);
    }
    expect(PREFIXES_DES_ECRANS_DE_JEU.length).toBeGreaterThan(0);
  });

  it("la page d'arène pose le marqueur que la feuille de style lit", () => {
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain(
      'data-ecran-de-jeu=""',
    );
    expect(GLOBALS).toMatch(/\[data-ecran-de-jeu\] \.text-xs/);
  });

  it("la règle de texte ne vise que l'écran étroit, jamais le poste de bureau", () => {
    // Un texte à 14 px sur un écran de projection n'est pas un défaut ; l'agrandir
    // partout élargirait aussi les tableaux denses du tableau de bord enseignant.
    expect(GLOBALS).toMatch(
      /@media \(max-width: 639px\) \{\s*\[data-ecran-de-jeu\]/,
    );
  });
});

describe("l'invitation à installer", () => {
  const SOURCE = lire("src/components/install-prompt.tsx");

  it("se tait sur les écrans de jeu", () => {
    expect(SOURCE).toContain("estEcranDeJeu");
    expect(SOURCE).toMatch(/if \(!visible \|\| enJeu\) return null/);
  });

  it("tient sur une ligne : pas de liste d'étapes, pas de paragraphe d'explication", () => {
    // Elle prenait quarante pour cent de l'écran avec un tutoriel en trois temps.
    expect(SOURCE).not.toContain("<ol");
    expect(SOURCE).not.toMatch(/sans barre de\s+navigateur/);
  });

  it("garde des commandes à la taille du pouce", () => {
    expect(SOURCE.match(/min-h-11/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("les réglages d'installation", () => {
  it("le manifeste vient de la configuration, plus d'un fichier figé", () => {
    expect(existsSync("src/app/manifest.ts")).toBe(true);
    expect(
      existsSync("public/manifest.json"),
      "un fichier statique masquerait le manifeste lu de la configuration",
    ).toBe(false);
    const manifeste = lire("src/app/manifest.ts");
    expect(manifeste).toContain("couleurDeBarre");
    expect(manifeste).toContain("themeParDefaut");
  });

  it("aucune couleur d'avant la charte ne traîne dans l'installation", () => {
    // #d97706 est l'amber brut de Tailwind, #020617 le gris d'usine : le site ne
    // sert ni l'un ni l'autre, et un téléphone les peignait autour de la page.
    for (const fichier of ["src/app/layout.tsx", "src/app/manifest.ts"]) {
      const source = lire(fichier);
      expect(source, fichier).not.toMatch(/#d97706|#020617/i);
    }
  });

  it("la couleur de la barre est le fond du thème, pour chaque thème", () => {
    for (const t of THEMES) expect(couleurDeBarre(t.code)).toBe(t.apercu.fond);
  });

  it("la mise en page pose la couleur de barre, et la corrige avec le thème choisi", () => {
    // La balise est posée par l'amorce, pas rendue par React : rendue puis
    // corrigée, elle se doublerait à l'hydratation (deux balises, deux couleurs).
    expect(LAYOUT).not.toContain('<meta name="theme-color"');
    expect(LAYOUT).toMatch(/createElement\("meta"\);m\.name="theme-color"/);
    expect(lire("src/components/theme-switcher.tsx")).toContain("theme-color");
    expect(LAYOUT).not.toMatch(/themeColor:/);
  });

  it("la page va jusqu'aux bords, et réserve la place de l'encoche", () => {
    expect(LAYOUT).toContain('viewportFit: "cover"');
    expect(GLOBALS).toMatch(/safe-area-inset-left/);
    expect(GLOBALS).toMatch(/safe-area-inset-right/);
  });
});

describe("le geste d'une application", () => {
  it("les commandes ne se sélectionnent pas et ne teintent pas l'écran au toucher", () => {
    expect(GLOBALS).toMatch(/-webkit-tap-highlight-color: transparent/);
    expect(GLOBALS).toMatch(/touch-action: manipulation/);
    expect(GLOBALS).toMatch(/user-select: none/);
  });

  it("les commandes de la barre se grossissent sur les appareils tactiles", () => {
    for (const [fichier, attendu] of [
      ["src/components/site-header.tsx", "pointer-coarse:min-h-11"],
      ["src/components/theme-switcher.tsx", "pointer-coarse:min-w-11"],
      ["src/components/tiroir.tsx", "pointer-coarse:min-h-11"],
      ["src/components/mandat-de-lequipe.tsx", "pointer-coarse:min-h-11"],
      ["src/components/segmented-tabs.tsx", "min-h-11"],
    ] as const) {
      expect(lire(fichier), fichier).toContain(attendu);
    }
  });
});

describe("les tiroirs de téléphone ne cachent pas ce qui décide", () => {
  const FORMULAIRE = lire("src/components/decision-form.tsx");

  it("une enveloppe « Aide » ne contient que du texte : aucun champ, choix ni case", () => {
    // La règle du site pour tout repli : il range ce qu'on consulte, jamais ce qui
    // décide. Un champ rangé dans un tiroir fermé serait une décision qu'on ne voit
    // pas, et le tour partirait avec sa valeur proposée.
    const blocs = [
      ...FORMULAIRE.matchAll(/<Aide[^>]*>([\s\S]*?)<\/Aide>/g),
    ].map((m) => m[1]!);
    expect(
      blocs.length,
      "plus aucune aide repliable dans le formulaire",
    ).toBeGreaterThanOrEqual(3);
    for (const bloc of blocs) {
      expect(bloc, bloc.slice(0, 80)).not.toMatch(
        /<(input|select|textarea|button|Field|label)\b/,
      );
    }
  });

  it("le choix du fournisseur reste hors de toute enveloppe d'aide", () => {
    // En mono-produit, ses boutons radio SONT la décision du tour.
    const radios = FORMULAIRE.indexOf('name="supplierChoice"');
    expect(radios).toBeGreaterThan(-1);
    const avant = FORMULAIRE.slice(0, radios);
    expect(avant.lastIndexOf("<Aide>")).toBeLessThanOrEqual(
      avant.lastIndexOf("</Aide>"),
    );
  });

  it("l'arène demande au serveur si l'on est sur téléphone, au lieu de le deviner au montage", () => {
    const page = lire("src/app/arena/[gameId]/page.tsx");
    expect(page).toContain("estUnTelephone");
    expect(page).toMatch(/<ParcoursMobile\b/);
    expect(page).toMatch(/telephone=\{telephone\}/);
  });

  it("les panneaux de chiffres se replient avec leur résumé, et l'enveloppe décorative disparaît", () => {
    expect(lire("src/components/decision-context.tsx")).toContain("repliable");
    expect(lire("src/components/courrier-du-tour.tsx")).toMatch(
      /h-40 w-60 shrink-0 max-sm:hidden/,
    );
  });
});

describe("la décision se découpe en étapes courtes", () => {
  const FORMULAIRE = lire("src/components/decision-form.tsx");

  it("chaque étape a sa section, et le fournisseur comme l'assurance ont la leur", () => {
    // « Vendre & s'approvisionner » pesait 1 329 px et « Trésorerie & couverture »
    // 1 242 : deux écrans chacune sur téléphone. Elles sont coupées en deux.
    for (const cle of [
      "vendre",
      "approvisionner",
      "budgets",
      "equipe",
      "financer",
      "tresorerie",
      "assurance",
      "prevoir",
    ]) {
      expect(FORMULAIRE, `section de l'étape « ${cle} »`).toContain(
        `data-etape={idx("${cle}")}`,
      );
      expect(FORMULAIRE, `visibilité de l'étape « ${cle} »`).toContain(
        `hidden={masquee("${cle}")}`,
      );
    }
    expect(FORMULAIRE).not.toContain('idx("couverture")');
  });

  it("le panneau des fournisseurs n'est rendu qu'à un seul endroit selon le mode", () => {
    // En gamme, il reste un catalogue sous « Vos références » ; en mono-produit il
    // porte le choix, dans l'étape « S'approvisionner ». Jamais les deux : deux
    // groupes de boutons radio de même nom se disputeraient la valeur envoyée.
    expect(FORMULAIRE).toContain("{gamme ? panneauFournisseurs : null}");
    expect(FORMULAIRE).toContain("{gamme ? null : panneauFournisseurs}");
  });

  it("l'étape des fournisseurs n'existe qu'en mono-produit, avec des fournisseurs à choisir", () => {
    expect(FORMULAIRE).toMatch(
      /approvisionnerVisible = !gamme && !!suppliersOffer && suppliersOffer\.length > 0/,
    );
  });
});

describe("financer et investir sont deux décisions", () => {
  const FORMULAIRE = lire("src/components/decision-form.tsx");

  it("chacune a sa carte : l'emprunt et le capital d'un côté, le parc machines de l'autre", () => {
    expect(FORMULAIRE).toContain('cle: "financement"');
    expect(FORMULAIRE).toContain('cle: "investissement"');
    expect(FORMULAIRE).toContain('carte="investissement"');
    expect(FORMULAIRE).toContain('<Carte cle="investissement">');
    // Le résumé du financement ne parle plus de machines.
    const financement = FORMULAIRE.slice(
      FORMULAIRE.indexOf('cle: "financement"'),
      FORMULAIRE.indexOf('cle: "investissement"'),
    );
    expect(financement).not.toContain("equipmentBuyJson");
  });
});

describe("le détail par clientèle et la saison du tour, côte à côte", () => {
  const PAGE = lire("src/app/arena/[gameId]/page.tsx");

  it("même forme, même groupe, fermés : ouvrir l'un referme l'autre", () => {
    expect(PAGE).toMatch(/<DetailParClientele[^>]*groupe="precisions"[^>]*ferme/);
    expect(PAGE).toMatch(/<SaisonDuTour[^>]*groupe="precisions"[^>]*ferme/);
    expect(lire("src/components/tiroir.tsx")).toContain("name={groupe}");
  });
});

describe("les résultats ne refont pas lire le courrier en grand", () => {
  it("sur téléphone, le courrier du tour clos tient en une ligne", () => {
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain("courrierResume={telephone}");
    const tableau = lire("src/components/period-dashboard.tsx");
    expect(tableau).toContain("courrierResume = false");
    expect(tableau).toMatch(/period\.events\.length > 0 && courrierResume/);
  });

  it("les tours passés ne sont posés qu'une fois sur téléphone : dans la carte des résultats", () => {
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain(
      "{telephone && !finished ? null : toursPasses}",
    );
  });
});

