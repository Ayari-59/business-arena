import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PREFIXES_DES_ECRANS_DE_JEU,
  estEcranDeJeu,
} from "../../src/config/ecrans-de-jeu";
import { COULEUR_DU_PAPIER } from "../../src/config/themes";

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
  it("le manifeste est engendré, plus un fichier figé", () => {
    expect(existsSync("src/app/manifest.ts")).toBe(true);
    expect(
      existsSync("public/manifest.json"),
      "un fichier statique masquerait le manifeste engendré",
    ).toBe(false);
    const manifeste = lire("src/app/manifest.ts");
    expect(manifeste).toContain("COULEUR_DU_PAPIER");
  });

  it("aucune couleur d'avant la charte ne traîne dans l'installation", () => {
    // #d97706 est l'amber brut de Tailwind, #020617 le gris d'usine : le site ne
    // sert ni l'un ni l'autre, et un téléphone les peignait autour de la page.
    for (const fichier of ["src/app/layout.tsx", "src/app/manifest.ts"]) {
      const source = lire(fichier);
      expect(source, fichier).not.toMatch(/#d97706|#020617/i);
    }
  });

  it("la barre du téléphone prolonge le papier", () => {
    // Le site n'a plus qu'un habillage : la couleur de barre ne dépend plus d'un
    // choix du visiteur, elle se déclare donc au viewport, une fois, côté
    // serveur, et ne s'écrit plus par une amorce.
    expect(COULEUR_DU_PAPIER).toMatch(/^#[0-9a-f]{6}$/);
    expect(LAYOUT).toMatch(/themeColor: COULEUR_DU_PAPIER/);
    expect(LAYOUT).not.toContain('m.name="theme-color"');
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

describe("les résultats d'un tour clos : leurs trois onglets de détail, le reste est à la demande", () => {
  it("une carte « Résultats » qui n'a que le tableau de bord (Synthèse, Marché, Finance), sans le menu Situation / Décisions / Résultats", () => {
    const page = lire("src/app/arena/[gameId]/page.tsx");
    const carte = page.slice(page.indexOf("const resultatsCartes"), page.indexOf("const briefingCartes"));
    expect(carte, "pas de menu de navigation dans la carte des résultats").not.toContain("ongletsDuTour(");
    expect(carte).toContain("<PeriodDashboard");
    // Le débriefing et les décisions du tour restent lisibles, dans un tiroir fermé.
    expect(carte).toMatch(/Débriefing et décisions de ce tour[\s\S]{0,40}ferme/);
    expect(page).toMatch(/Tours précédents et réussites[\s\S]{0,80}ferme/);
    expect(page).toContain('cle: "resultats"');
  });
});

describe("on sait toujours à quel temps du tour on est", () => {
  it("cinq temps, chacun un nom et une teinte, écrits en toutes lettres", () => {
    const phases = lire("src/config/phases-du-tour.ts");
    for (const cle of ["resultats", "briefing", "analyse", "courrier", "decision"]) {
      expect(phases, `phase « ${cle} »`).toContain(`${cle}: {`);
    }
    // Des classes entières : Tailwind ne lit pas une classe fabriquée par morceaux.
    expect(phases).not.toMatch(/`(text|bg)-\$\{/);
  });

  it("la barre du haut porte le titre de l'étape, dans la teinte du temps ; les cartes n'ont plus d'en-tête à elles", () => {
    const barre = lire("src/components/barre-de-jeu.tsx");
    expect(barre).toContain("progression.segments.map");
    expect(barre).toContain("PHASES[segment.phase].fond");
    expect(barre).toContain("PHASES[enTete.phase].texte");
    expect(barre).toContain("data-titre-etape");
    // Un seul titre : ni le parcours, ni les analyses, ni les décisions ne le redisent en tête de carte.
    expect(lire("src/components/parcours-mobile.tsx")).not.toContain("PHASES[courante.phase].texte");
    expect(lire("src/components/situation-panel.tsx")).not.toContain("PHASES.analyse.texte");
    expect(lire("src/components/decision-form.tsx")).not.toContain("PHASES.decision.texte");
  });

  it("les écrans que le parcours ne connaît pas (analyses, décisions) donnent leur titre à la barre", () => {
    expect(lire("src/components/situation-panel.tsx")).toContain("definirEntete");
    expect(lire("src/components/decision-form.tsx")).toContain("definirEntete");
  });
});

/**
 * L'ARÈNE SUR TÉLÉPHONE : UNE SEULE BARRE FIXE, UN SEUL APLAT ORANGE.
 *
 * Mesuré dans le navigateur (390 × 844) : entre l'en-tête, les tuiles, le
 * bandeau du tour clos et DEUX barres fixes en bas (l'action de l'étape, puis
 * les onglets), il restait environ 200 px pour le champ à remplir, et
 * « Valider mon analyse » côtoyait « Décider → », deux aplats orange.
 */
describe("l'arène sur téléphone", () => {
  const ONGLETS = lire("src/components/segmented-tabs.tsx");

  it("les onglets d'étape restent en haut : la seule barre fixe porte l'action de l'étape", () => {
    // Deux listes d'onglets dans le fichier : le fil guidé et les onglets simples.
    expect(ONGLETS.match(/role="tablist"/g) ?? []).toHaveLength(2);
    const fixes = ONGLETS.match(/fixed inset-x-0 bottom-0/g) ?? [];
    expect(fixes).toHaveLength(1);
    expect(ONGLETS).toMatch(/\{guided && suivant \? \(/);
  });

  it("une étape qui porte sa propre action fait passer le bouton suivant en filet", () => {
    expect(lire("src/components/situation-panel.tsx")).toContain("data-action-de-l-etape");
    expect(lire("src/components/courrier-du-tour.tsx")).toContain("data-action-de-l-etape");
    for (const chemin of [
      "src/components/segmented-tabs.tsx",
      "src/components/parcours-mobile.tsx",
      "src/components/decision-form.tsx",
    ]) {
      const source = lire(chemin);
      expect(source, chemin).toContain("querySelector");
      expect(source, chemin).toContain("[data-action-de-l-etape]");
      expect(source, chemin).toMatch(/actionPropre[\s\S]{0,80}"secondaire"/);
    }
  });

  it("une étape remonte à son début, sous ce qui colle en haut, pas en haut de la page", () => {
    for (const chemin of [
      "src/components/segmented-tabs.tsx",
      "src/components/parcours-mobile.tsx",
      "src/components/decision-form.tsx",
    ]) {
      const source = lire(chemin);
      expect(source, chemin).not.toContain("window.scrollTo({ top: 0 })");
      expect(source, chemin).toContain("allerAuDebutDEtape(");
      expect(source, chemin).toContain("data-debut-d-etape");
    }
    expect(GLOBALS).toMatch(/\[data-debut-d-etape\][^{]*\{\s*scroll-margin-top: var\(--haut-collant/);
  });
});
