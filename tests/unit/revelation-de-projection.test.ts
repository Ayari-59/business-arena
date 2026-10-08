import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RevelationDuMarche,
  rythmeDeRevelation,
  DEBUT_S,
  PAS_MAX_S,
  DEVOILEMENT_MAX_S,
  ENTREE_S,
  type LigneDeRevelation,
} from "@/components/revelation-du-marche";
import { VueDeProjection, type Panneau } from "@/components/vue-de-projection";

/**
 * « LE MARCHÉ A RÉPONDU », DEVANT LA CLASSE.
 *
 * Le rituel de fin de tour signe le produit en solo depuis le lot 3A. L'audit
 * demandait le même à la projection, là où il a le plus de sens : toute la
 * classe regarde l'écran pendant que l'enseignant clôt le tour. Ce qui doit
 * tenir, et qu'on casse pour le vérifier :
 *   · la révélation est COMPLÈTE à l'état final : chaque équipe, son résultat
 *     signé, sa trésorerie, le podium ; rien ne dépend d'une animation pour
 *     être lu, ni d'un script pour être capturé ;
 *   · les équipes se dévoilent de la DERNIÈRE à la PREMIÈRE, sans que la
 *     liste bouge ;
 *   · le podium prend l'or, l'argent et le bronze ;
 *   · la durée est bornée, quel que soit le nombre d'équipes ;
 *   · qui a demandé moins d'animation voit l'écran d'un coup ;
 *   · le mur n'a aucun aplat orange, et rien sous 18 px à l'écran de la salle ;
 *   · le rideau tient : un classement non révélé ne fuit pas, pas même un
 *     chiffre du tour.
 */

const LIGNES: LigneDeRevelation[] = [
  {
    rang: 1,
    nom: "Les Fourmis",
    resultat: "+12 000 €",
    sens: "gain",
    tresorerie: "48 000 €",
    decouvert: false,
    ipg: 62.4,
    defaillant: false,
  },
  {
    rang: 2,
    nom: "Atelier 9",
    resultat: "−294 €",
    sens: "perte",
    tresorerie: "21 500 €",
    decouvert: false,
    ipg: 51.8,
    defaillant: false,
  },
  {
    rang: 3,
    nom: "Vega",
    resultat: "−9 486 €",
    sens: "perte",
    tresorerie: "−3 200 €",
    decouvert: true,
    ipg: 30.2,
    defaillant: true,
  },
  {
    rang: 4,
    nom: "Boréal",
    resultat: "+900 €",
    sens: "gain",
    tresorerie: "12 000 €",
    decouvert: false,
    ipg: 28.5,
    defaillant: false,
  },
];

const rendre = (p: Partial<Parameters<typeof RevelationDuMarche>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(RevelationDuMarche, {
      surtitre: "Classement · Trimestre 2",
      titre: "Trimestre 2 · le marché a répondu",
      mention: "Indice de performance globale (IPG)",
      lignes: LIGNES,
      ...p,
    }),
  );

describe("la révélation est complète à l'état final", () => {
  it("dit le tour, chaque équipe, son résultat signé et sa trésorerie, sans animation", () => {
    const html = rendre();
    expect(html).toContain("le marché a répondu");
    expect(html).toContain("Indice de performance globale (IPG)");
    for (const l of LIGNES) {
      expect(html, l.nom).toContain(l.nom);
      expect(html, `${l.nom} : résultat`).toContain(l.resultat!);
      expect(html, `${l.nom} : trésorerie`).toContain(l.tresorerie!);
    }
    // Le signe moins typographique, pas un trait d'union.
    expect(html).toMatch(/−294/);
    // Les quatre rangs sont écrits dans leur pastille.
    for (const rang of [1, 2, 3, 4])
      expect(html).toMatch(new RegExp(`pastille-rang[^>]*>${rang}<`));
    // Et l'état final ne porte PAS la classe qui joue les temps.
    expect(html).not.toContain('class="revelation');
  });

  it("le gain est vert, la perte rouge, la trésorerie à l'encre sauf en découvert", () => {
    const html = rendre();
    expect(html).toContain("text-emerald-300");
    expect(html).toContain("text-red-300");
    // Aucun voile teinté : la charte ne dilue ni le vert ni le rouge.
    expect(html).not.toMatch(/bg-(?:emerald|red|rose|green)-\d/);
    expect(html).not.toMatch(/from-|to-emerald|to-red/);
    // Le découvert est la seule trésorerie rouge : trois lignes sur quatre
    // portent l'encre claire.
    expect((html.match(/text-slate-300[^"]*" *>/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("l'animation n'ajoute rien : le même texte, à un attribut près", () => {
    const sansTexte = (html: string) => html.replace(/<[^>]+>/g, "|");
    expect(sansTexte(rendre({ animer: true }))).toBe(sansTexte(rendre({ animer: false })));
    expect(rendre({ animer: true })).toContain("revelation");
  });

  it("sans chiffres de tour (aucun tour clos encore lu), le classement se projette quand même", () => {
    const html = rendre({
      lignes: LIGNES.map((l) => ({ ...l, resultat: null, tresorerie: null })),
    });
    expect(html).toContain("Les Fourmis");
    expect(html).not.toContain("Résultat du tour");
    expect(html).toContain("marche-de-podium-1");
  });
});

describe("de la dernière place à la première", () => {
  it("l'ordre du document est le classement, l'ordre d'apparition l'inverse", () => {
    const html = rendre({ animer: true });
    const lignes = [...html.matchAll(/data-revelation-rang="(\d)" style="--i:(\d)"/g)].map((m) => ({
      rang: Number(m[1]),
      i: Number(m[2]),
    }));
    // Les quatre lignes, dans l'ordre du classement.
    expect(lignes.map((l) => l.rang)).toEqual([1, 2, 3, 4]);
    // Et leur rang d'apparition est l'inverse : la dernière place s'allume
    // d'abord (`--i: 0`), la première en dernier.
    expect(lignes.map((l) => l.i)).toEqual([3, 2, 1, 0]);
  });

  it("la place de chaque équipe est réservée dès le premier instant", () => {
    // L'animation ne joue que sur l'opacité et un décalage : une ligne qui
    // apparaîtrait en poussant les autres serait illisible sur un mur.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const bloc = css.slice(css.indexOf("LOT 4B"));
    const image = bloc.slice(bloc.indexOf("@keyframes revelation-entree"), bloc.indexOf("}\n}"));
    expect(image).toMatch(/opacity: 0/);
    expect(image).toMatch(/transform: translateY/);
    expect(image).not.toMatch(/height|margin|display|width/);
  });
});

describe("le podium, en or, argent et bronze", () => {
  it("les trois premières places prennent leur métal, l'or au centre", () => {
    const html = rendre();
    const podium = html.slice(html.indexOf('aria-label="Podium du classement"'));
    for (const rang of [1, 2, 3]) {
      expect(podium, `marche ${rang}`).toContain(`marche-de-podium-${rang}`);
    }
    // L'or est au milieu : argent, or, bronze dans l'ordre du document.
    expect(podium.indexOf("marche-de-podium-2")).toBeLessThan(podium.indexOf("marche-de-podium-1"));
    expect(podium.indexOf("marche-de-podium-1")).toBeLessThan(podium.indexOf("marche-de-podium-3"));
    // La quatrième place n'a pas de marche.
    expect(podium).not.toContain("Boréal");
    expect(podium).toContain('data-podium="projection"');
  });
});

describe("la révélation est bornée, et s'efface pour qui en demande moins", () => {
  it("quatre équipes ou douze, elle tient dans le même temps", () => {
    for (const n of [1, 2, 4, 6, 12, 30]) {
      const r = rythmeDeRevelation(n);
      expect(r.pas, `${n} équipes : le pas`).toBeLessThanOrEqual(PAS_MAX_S);
      expect(r.duree, `${n} équipes : la durée`).toBeLessThanOrEqual(
        DEBUT_S + DEVOILEMENT_MAX_S + PAS_MAX_S + ENTREE_S,
      );
      // Et la borne en secondes, écrite ici et nulle part ailleurs : une
      // révélation de classe ne dure pas plus de quatre secondes et demie,
      // quels que soient les réglages du composant.
      expect(r.duree, `${n} équipes : plus de 4,5 s`).toBeLessThanOrEqual(4.5);
    }
    // Ce que le cahier des charges demande : quatre à six équipes dévoilées
    // en quatre secondes au plus, podium compris.
    expect(rythmeDeRevelation(4).duree).toBeLessThanOrEqual(4);
    expect(rythmeDeRevelation(6).duree).toBeLessThanOrEqual(4);
    // Et elle prend un temps : un dévoilement instantané n'est pas un rituel.
    expect(rythmeDeRevelation(6).duree).toBeGreaterThan(2);
  });

  it("les durées ne s'écrivent qu'en jetons, et la feuille les coupe sur demande", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const bloc = css.slice(css.indexOf("LOT 4B"));
    const jetons = bloc.slice(bloc.indexOf("[data-revelation-du-marche] {"));
    for (const nom of ["debut", "pas", "entree", "fin"]) {
      expect(jetons, `--revelation-${nom}`).toMatch(new RegExp(`--revelation-${nom}: [\\d.]+s`));
    }
    // Aucune durée écrite à la main dans les règles d'animation : elles
    // n'existent qu'en jetons, et le composant les ajuste.
    const regles = bloc.slice(bloc.indexOf(".revelation > "));
    expect(regles.match(/[\s(]\d+(?:\.\d+)?s/g) ?? []).toEqual([]);
    // Qui a demandé moins d'animation voit l'écran entier d'un coup.
    expect(bloc).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.revelation > \[data-temps\],\s*\.revelation \[data-revelation-rang\] \{\s*animation: none;/,
    );
    // `both` : un temps arrivé reste visible, et l'état final est complet.
    expect(bloc).toContain("cubic-bezier(0.2, 0.7, 0.2, 1) both");
  });
});

describe("écrit pour le fond de la salle", () => {
  const sources = ["revelation-du-marche", "podium"].map((n) => ({
    nom: n,
    texte: readFileSync(join(process.cwd(), `src/components/${n}.tsx`), "utf8"),
  }));

  /**
   * La taille d'un `text-[…]` de Tailwind sur un vidéoprojecteur de salle,
   * 1920 × 1080, en pixels. `clamp()`, `min()` et `max()` sont évalués comme
   * le ferait le navigateur, parce que la hauteur borne autant que la largeur :
   * c'est elle qui décide si le podium tient sous la liste.
   */
  const VW = 1920 / 100;
  const VH = 1080 / 100;

  /** Les arguments d'une fonction CSS, découpés sur les virgules de premier niveau. */
  function arguments_(contenu: string): string[] {
    const sortie: string[] = [];
    let profondeur = 0;
    let debut = 0;
    for (let i = 0; i < contenu.length; i += 1) {
      const c = contenu[i];
      if (c === "(") profondeur += 1;
      else if (c === ")") profondeur -= 1;
      else if (c === "," && profondeur === 0) {
        sortie.push(contenu.slice(debut, i));
        debut = i + 1;
      }
    }
    sortie.push(contenu.slice(debut));
    return sortie.map((v) => v.trim());
  }

  function taille(expression: string): number {
    const e = expression.trim();
    const fonction = /^(clamp|min|max)\((.*)\)$/.exec(e);
    if (fonction) {
      const valeurs = arguments_(fonction[2]!).map(taille);
      if (fonction[1] === "min") return Math.min(...valeurs);
      if (fonction[1] === "max") return Math.max(...valeurs);
      const [bas, souple, haut] = valeurs;
      return Math.min(Math.max(bas!, souple!), haut!);
    }
    if (e.endsWith("vw")) return Number(e.slice(0, -2)) * VW;
    if (e.endsWith("vh")) return Number(e.slice(0, -2)) * VH;
    if (e.endsWith("rem")) return Number(e.slice(0, -3)) * 16;
    if (e.endsWith("px")) return Number(e.slice(0, -2));
    throw new Error(`unité inconnue : ${e}`);
  }

  it("le calculateur de tailles lit le clamp, le min et le max comme un navigateur", () => {
    expect(taille("1rem")).toBe(16);
    expect(taille("2vw")).toBeCloseTo(38.4);
    expect(taille("2vh")).toBeCloseTo(21.6);
    expect(taille("clamp(1rem,2.6vw,2.2rem)")).toBeCloseTo(35.2);
    expect(taille("clamp(1rem,min(2.6vw,3.6vh),2.2rem)")).toBeCloseTo(35.2);
    expect(taille("clamp(1rem,min(1vw,1vh),2.2rem)")).toBeCloseTo(16);
  });

  it("aucun texte sous 18 px sur l'écran de projection", () => {
    const mesures = sources.flatMap(({ nom, texte }) =>
      [...texte.matchAll(/text-\[((?:clamp|min|max)\(.*?\))\](?=[\s"'`])/g)].map((m) => ({
        nom,
        classe: m[0],
        px: taille(m[1]!),
      })),
    );
    expect(mesures.length, "aucune taille mesurée : la garde ne garde rien").toBeGreaterThan(8);
    const petits = mesures
      .filter((m) => m.px < 18)
      .map((m) => `${m.nom} : ${m.classe} → ${m.px.toFixed(1)} px`);
    expect(petits, `trop petit pour huit mètres :\n${petits.join("\n")}`).toEqual([]);
  });

  it("les chiffres sont tabulaires, et le résultat le plus grand de sa ligne", () => {
    const source = sources[0]!.texte;
    expect((source.match(/tabular-nums/g) ?? []).length).toBeGreaterThanOrEqual(3);
    const resultat = taille("clamp(1.1rem,min(2.8vw,3.9vh),2.4rem)");
    const tresorerie = taille("clamp(1rem,min(2.2vw,3.1vh),1.9rem)");
    expect(source).toContain("text-[clamp(1.1rem,min(2.8vw,3.9vh),2.4rem)]");
    expect(resultat).toBeGreaterThan(tresorerie);
  });
});

/** La projection entière : le mur, pas seulement la révélation. */
const PROJECTION = {
  gameId: "g1",
  joinCode: "K7M2PR",
  qr: null,
  adresse: "www.business-arena.fr/join",
  elevesConnectes: 9,
  equipes: [
    { nom: "Les Fourmis", aValide: true },
    { nom: "Atelier 9", aValide: true },
  ],
  libelleTour: "Trimestre 3",
  echeance: null,
  classement: LIGNES.map((l) => ({
    rang: l.rang,
    nom: l.nom,
    ipg: l.ipg!,
    defaillant: l.defaillant,
    resultat: l.resultat,
    sens: l.sens,
    tresorerie: l.tresorerie,
    decouvert: l.decouvert,
  })),
  classementRevele: true,
  libelleTourClos: "Trimestre 2",
  tourRevele: 2,
  finished: false,
  retour: "/teacher/games/g1",
};

const mur = (p: Partial<typeof PROJECTION> & { defaut: Panneau }) =>
  renderToStaticMarkup(createElement(VueDeProjection, { ...PROJECTION, ...p }));

describe("le mur de la classe", () => {
  it("projette la révélation du classement, avec les chiffres du tour", () => {
    const html = mur({ defaut: "classement" });
    expect(html).toContain("Trimestre 2 · le marché a répondu");
    expect(html).toContain("+12 000 €");
    expect(html).toContain("48 000 €");
    expect(html).toContain("marche-de-podium-1");
    expect(html).toContain("Rejouer la révélation");
  });

  it("n'a aucun aplat orange : le seul geste orange de la séance est au pilotage", () => {
    // Le mur ne porte AUCUN geste : clore le tour et révéler le classement se
    // font sur l'écran de pilotage, et c'est là que l'orange plein vit. Ici,
    // tout est en filet — onglets, retour, passer et rejouer la révélation.
    for (const defaut of ["code", "tour", "classement"] as const) {
      const html = mur({ defaut });
      expect((html.match(/bouton-plein/g) ?? []).length, defaut).toBe(0);
    }
  });

  it("ne piège pas le clavier et annonce le classement poliment", () => {
    const html = mur({ defaut: "classement" });
    expect(html).toContain('aria-live="polite"');
    // Pas de boîte modale : la révélation est un panneau, on en sort par
    // Échap ou par la barre de commande, jamais en cherchant une sortie.
    expect(html).not.toContain("aria-modal");
    expect(html).not.toContain("tabindex");
  });

  it("le rideau tient : rien du tour ne fuit avant la révélation aux élèves", () => {
    const html = mur({ defaut: "classement", classementRevele: false });
    expect(html).toContain("sous embargo");
    for (const interdit of ["+12 000", "48 000", "62,4", "pastille-rang", "marche-de-podium"]) {
      expect(html, interdit).not.toContain(interdit);
    }
  });
});

describe("la projection ne reste jamais sur un écran intermédiaire", () => {
  const source = readFileSync(join(process.cwd(), "src/components/vue-de-projection.tsx"), "utf8");

  it("un tour déjà dévoilé est noté AVANT d'être joué : recharger montre l'état final", () => {
    const effet = source.slice(
      source.indexOf("const memoire = `ba-revelation:"),
      source.indexOf("}, [gameId, tourRevele]"),
    );
    expect(effet).toContain("localStorage.setItem");
    expect(effet.indexOf("localStorage.setItem")).toBeLessThan(effet.indexOf("jouer()"));
  });

  it("trois sorties vers l'état final : le temps, Échap, et l'onglet qu'on quitte", () => {
    expect(source).toContain('e.key === "Escape"');
    expect(source).toContain("document.hidden");
    expect(source).toContain("setTimeout(() => setEnCours(false)");
  });

  it("le pilotage prévient le mur, et le sondeur ne s'arrête pas", () => {
    const projection = readFileSync(
      join(process.cwd(), "src/app/teacher/games/[gameId]/projection/page.tsx"),
      "utf8",
    );
    expect(projection).toContain("<EchoDeSeance");
    expect(projection).toContain("insistant");
    const pilotage = readFileSync(
      join(process.cwd(), "src/app/teacher/games/[gameId]/page.tsx"),
      "utf8",
    );
    expect(pilotage).toContain("<SignalDeSeance");
  });
});
