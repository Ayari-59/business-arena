import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { botDecisions } from "@/engine/bots";
import { SCENARIOS } from "@/config/scenarios/registry";
import type { CompanyState, SimulationInput } from "@/engine/types";
import {
  decompositionDuResultat,
  type DecompositionDuResultat,
  type MarcheDuResultat,
} from "@/components/lecture-du-resultat";
import {
  CeQuiAFaitLeResultat,
  POSTES_DE_COUT,
  SEUIL_DU_MARQUEUR,
  geometrieDuPartage,
  lectureDuResultat,
} from "@/components/ce-qui-a-fait-le-resultat";

/**
 * OÙ SONT PASSÉES VOS VENTES ? (lot P3, refait au lot P8 : piste A).
 *
 * Lot P3 : « Ce qui a fait le résultat » devenait une cascade debout. Lot P8 :
 * le propriétaire la voulait « plus parlante, plus évidente, avec plus de
 * couleurs ». C'est désormais DEUX BARRES À LA MÊME ÉCHELLE : les ventes, et
 * dessous ce qui les a « mangées » (trois postes de coût, chacun sa teinte),
 * puis ce qui reste — ou, en perte, ce qui manque, au-delà de la fin des
 * ventes. Ce que cette garde fige, sur les comptes de VRAIS tours de chaque
 * scénario, sur des tours en perte et sur de petits résultats :
 *
 *   · LA BARRE DES VENTES = LE CHIFFRE D'AFFAIRES, de zéro, à l'euro près ;
 *   · LA SOMME DES SEGMENTS = LES COÛTS TOTAUX (coûts variables, structure,
 *     bas du compte), segments jointifs, dans l'ordre du compte ;
 *   · LE RESTE = CA − COÛTS, à l'euro près, et il FINIT PILE à la fin des
 *     ventes ; EN PERTE, LE MANQUE est AU-DELÀ de la fin des ventes, et finit
 *     avec les coûts ;
 *   · UNE SEULE ÉCHELLE, dont le plus grand des deux totaux est le bout ;
 *   · LA MARGE SUR COÛT VARIABLE, de la fin des coûts variables à la fin des
 *     ventes, vaut celle du compte ;
 *   · LE PETIT RÉSULTAT : un marqueur sous 3 % de l'échelle, son montant écrit
 *     au bout des ventes ; un montant n'est jamais tronqué dans une barre ;
 *   · CHAQUE POSTE A SA TEINTE DISTINCTE (et distincte des couleurs
 *     réservées), SON NOM ET SON MONTANT SIGNÉ dans la légende ;
 *   · LA LECTURE EN MOTS, et la liste lisible au lecteur d'écran.
 */

/** Trois tours d'un scénario, chaque entreprise jouée par un robot. */
function comptes(code: string) {
  const def = SCENARIOS.find((d) => d.code === code)!;
  let etats: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils: Record<string, Parameters<typeof botDecisions>[0]> = {
    joueur: "balanced",
    ...Object.fromEntries(def.bots.map((b) => [b.id, b.profile])),
  };
  const sortie = [];
  for (let roundIndex = 1; roundIndex <= 3; roundIndex++) {
    const input = {
      scenario: def.scenario,
      roundIndex,
      companies: etats,
      decisions: Object.fromEntries(
        etats.map((e) => [
          e.id,
          botDecisions(profils[e.id]!, { scenario: def.scenario, state: e, roundIndex }),
        ]),
      ),
      activeEvents: [],
      seed: 23 + roundIndex,
    } as unknown as SimulationInput;
    const s = simulateRound(input);
    etats = s.companies;
    for (const e of etats) sortie.push(s.results[e.id]!.incomeStatement);
  }
  return sortie;
}

/** Une décomposition écrite à la main, comme `decompositionDuResultat` la pose. */
function tour(ca: number, variables: number, structure: number, sous: number): DecompositionDuResultat {
  const marches: MarcheDuResultat[] = [];
  let niveau = 0;
  const poser = (cle: MarcheDuResultat["cle"], libelle: string, montant: number) => {
    marches.push({ cle, libelle, montant, debut: niveau, fin: niveau + montant });
    niveau += montant;
  };
  poser("ca", "Chiffre d'affaires", ca);
  poser("variables", "Coûts variables", -variables);
  marches.push({ cle: "marge", libelle: "Marge sur coût variable", montant: niveau, debut: 0, fin: niveau });
  poser("structure", "Charges de structure", -structure);
  poser("sous-ebe", "Amortissements, intérêts, impôt", -sous);
  marches.push({ cle: "resultat", libelle: "Résultat net", montant: niveau, debut: 0, fin: niveau });
  return {
    chiffreDAffaires: ca,
    coutsVariables: variables,
    marge: ca - variables,
    structure,
    sousLExcedent: sous,
    resultat: niveau,
    marches,
  };
}

/** Le tour 2 des maquettes : +40 009 € pour 334 168 € de ventes. */
const benefice = () => tour(334_168, 169_339, 105_887, 18_933);
/** Le tour 1 des maquettes : −3 704 € pour 297 006 € (une petite perte). */
const petitePerte = () => tour(297_006, 189_510, 105_200, 6_000);
/** Une grosse perte, prix bradé : −124 641 € pour 180 702 €. */
const grossePerte = () => tour(180_702, 190_000, 105_343, 10_000);
/** Un petit bénéfice : +878 € pour 297 124 €. */
const petitGain = () => tour(297_124, 186_394, 103_990, 5_862);

/** Le balisage rendu, ses apostrophes et ses espaces insécables ramenés au texte courant. */
const lisible = (html: string) => html.replace(/&#x27;/g, "'").replace(/\s/g, " ");
const rendre = (d: DecompositionDuResultat, forme: "rituel" | "synthese" = "rituel") =>
  lisible(renderToStaticMarkup(createElement(CeQuiAFaitLeResultat, { decomposition: d, causes: [], forme })));

function verifierLePartage(d: DecompositionDuResultat, nom: string) {
  const g = geometrieDuPartage(d);
  const euros = (fraction: number) => fraction * g.total;
  const autres = Math.max(0, -d.sousLExcedent);
  const couts = d.coutsVariables + d.structure + Math.max(0, d.sousLExcedent);
  // LA BARRE DES VENTES = LE CHIFFRE D'AFFAIRES, de zéro.
  expect(g.ventes.debut, nom).toBe(0);
  expect(Math.abs(euros(g.ventes.fin) - d.chiffreDAffaires), `${nom} : ventes`).toBeLessThan(1);
  expect(
    Math.abs(euros(g.finDesVentes) - (d.chiffreDAffaires + autres)),
    `${nom} : fin des ventes`,
  ).toBeLessThan(1);
  // LA SOMME DES SEGMENTS = LES COÛTS TOTAUX, segments jointifs, dans l'ordre du compte.
  expect(g.segments.map((s) => s.cle), nom).toEqual(["variables", "structure", "sous-ebe"]);
  expect(g.segments[0]!.debut, nom).toBe(0);
  for (let i = 1; i < g.segments.length; i++) {
    expect(g.segments[i]!.debut, `${nom} : segment ${i}`).toBeCloseTo(g.segments[i - 1]!.fin, 12);
  }
  const somme = g.segments.reduce((s, x) => s + x.montant, 0);
  expect(Math.abs(somme - couts), `${nom} : somme des segments`).toBeLessThan(1);
  expect(Math.abs(euros(g.segments.at(-1)!.fin) - couts), `${nom} : fin des coûts`).toBeLessThan(1);
  for (const s of g.segments) expect(Math.abs(euros(s.fin - s.debut) - s.montant), nom).toBeLessThan(1);
  // UNE SEULE ÉCHELLE : tout entre 0 et 1, le plus long des deux totaux au bout.
  const bornes = [g.ventes.fin, g.finDesVentes, ...g.segments.flatMap((s) => [s.debut, s.fin])];
  for (const v of bornes) {
    expect(v, nom).toBeGreaterThanOrEqual(0);
    expect(v, nom).toBeLessThanOrEqual(1 + 1e-12);
  }
  expect(Math.max(g.finDesVentes, g.segments.at(-1)!.fin), nom).toBeCloseTo(1, 12);
  // LE RESTE = CA − COÛTS, il finit PILE à la fin des ventes ; LE MANQUE est AU-DELÀ.
  if (d.resultat >= 0) {
    expect(g.manque, nom).toBeNull();
    expect(g.reste!.debut, nom).toBeCloseTo(g.segments.at(-1)!.fin, 12);
    expect(g.reste!.fin, `${nom} : le reste finit pile à la fin des ventes`).toBe(g.finDesVentes);
    expect(Math.abs(g.reste!.montant - d.resultat), `${nom} : reste`).toBeLessThan(1);
    expect(Math.abs(euros(g.reste!.fin - g.reste!.debut) - d.resultat), nom).toBeLessThan(1);
  } else {
    expect(g.reste, nom).toBeNull();
    expect(g.manque!.debut, `${nom} : le manque commence à la fin des ventes`).toBe(g.finDesVentes);
    expect(g.manque!.debut, nom).toBeGreaterThanOrEqual(g.ventes.fin);
    expect(g.manque!.fin, `${nom} : le manque finit avec les coûts`).toBeCloseTo(g.segments.at(-1)!.fin, 12);
    expect(Math.abs(g.manque!.montant + d.resultat), `${nom} : manque`).toBeLessThan(1);
  }
  // LA MARGE SUR COÛT VARIABLE : de la fin des coûts variables à la fin des ventes.
  expect(g.marge.debut, nom).toBeCloseTo(g.segments[0]!.fin, 12);
  expect(g.marge.fin, nom).toBe(g.ventes.fin);
  expect(Math.abs(g.marge.montant - d.marge), `${nom} : marge`).toBeLessThan(1);
  // LE MARQUEUR : sous 3 % de l'échelle, et seulement là.
  expect(g.marqueur, nom).toBe(Math.abs(d.resultat) / g.total < SEUIL_DU_MARQUEUR);
  return g;
}

describe("le partage des ventes : sa géométrie", () => {
  it.each(SCENARIOS.map((d) => d.code))("%s : sur de vrais tours", (code) => {
    let vus = 0;
    for (const cr of comptes(code)) {
      const d = decompositionDuResultat(cr);
      if (d.marches.every((m) => m.montant === 0)) continue;
      verifierLePartage(d, code);
      // La marge est celle du compte, le résultat celui du compte.
      expect(Math.abs(d.marge - cr.grossMargin), code).toBeLessThan(1);
      expect(d.resultat).toBe(cr.netIncome);
      vus++;
    }
    expect(vus, `${code} : aucun tour à dessiner`).toBeGreaterThan(0);
  });

  it("un bénéfice : le reste (40 009 €) finit pile sous la fin des ventes", () => {
    const g = verifierLePartage(benefice(), "bénéfice");
    expect(benefice().resultat).toBe(40_009);
    expect(g.finDesVentes).toBe(1);
    expect(g.reste!.fin).toBe(1);
    expect(g.marqueur).toBe(false);
  });

  it("une perte : les coûts dépassent la barre des ventes, le manque est au-delà de leur fin", () => {
    for (const [d, nom] of [
      [petitePerte(), "petite perte"],
      [grossePerte(), "grosse perte"],
    ] as const) {
      const g = verifierLePartage(d, nom);
      expect(g.finDesVentes, nom).toBeLessThan(1);
      expect(g.segments.at(-1)!.fin, nom).toBeCloseTo(1, 12);
      expect(g.manque!.debut, nom).toBeGreaterThan(g.ventes.fin - 1e-12);
    }
    expect(petitePerte().resultat).toBe(-3_704);
    expect(geometrieDuPartage(petitePerte()).marqueur).toBe(true);
    expect(geometrieDuPartage(grossePerte()).marqueur).toBe(false);
  });

  it("un « bas du compte » négatif est un produit : il prolonge les ventes, il ne se dessine pas en coût", () => {
    const d = tour(200_000, 120_000, 70_000, -15_000);
    const g = verifierLePartage(d, "autres produits");
    expect(g.autresProduits!.montant).toBe(15_000);
    expect(g.segments.at(-1)!.montant).toBe(0);
    expect(rendre(d)).toContain('data-poste="autres-produits"');
  });
});

describe("le petit résultat se voit, et rien n'est tronqué", () => {
  it("+878 € ou −3 704 € : le marqueur, le montant au bout des ventes, la phrase", () => {
    for (const [d, texte] of [
      [petitGain(), "dont il reste 878 €"],
      [petitePerte(), "il manque 3 704 €"],
    ] as const) {
      expect(geometrieDuPartage(d).marqueur).toBe(true);
      const html = rendre(d);
      expect(html).toMatch(/data-partage="rituel" data-sens="(benefice|perte)" data-marqueur=""/);
      expect(html).toContain(`<span data-etiquette-du-solde="" class="partage-etiquette-solde">${texte}</span>`);
    }
    // Un reste court (12 % de l'échelle) s'écrit aussi au bout des ventes ; un reste
    // large (un tiers de l'échelle) s'écrit dans sa propre barre, pas deux fois.
    expect(rendre(benefice())).toContain("dont il reste 40 009 €");
    expect(rendre(tour(400_000, 150_000, 100_000, 20_000))).not.toContain("data-etiquette-du-solde");
  });

  it("la feuille : marqueur épais et plus haut que les barres ; un montant n'est écrit dans une barre que si elle le contient", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const bloc = css.slice(css.indexOf("LA CASCADE DU RÉSULTAT ──"), css.indexOf("LE COURRIER POSÉ ──"));
    const marqueur = bloc.match(
      /\.partage\[data-marqueur\] \.partage-reste,\s*\.partage\[data-marqueur\] \.partage-manque \{([^}]*)\}/,
    )?.[1];
    expect(marqueur).toMatch(/width: 4px;/);
    expect(marqueur).toMatch(/top: -4px;/);
    expect(marqueur).toMatch(/bottom: -4px;/);
    // Une barre garde 3 px au moins, sans fausser son début ni sa fin.
    expect(bloc).toMatch(
      /\.partage-troncon \{[^}]*width: max\(3px, calc\(\(var\(--fin\) - var\(--debut\)\) \* 100%\)\);/,
    );
    // Le montant dans la barre : caché par défaut, montré par une requête de conteneur sur la barre.
    expect(bloc).toMatch(/\.partage-troncon \{[^}]*container-type: inline-size;/);
    expect(bloc).toMatch(/\.partage-etiquette \{[^}]*display: none;[^}]*white-space: nowrap;/);
    expect(bloc).toMatch(/@container \(min-width: 5\.5rem\) \{\s*\.partage-etiquette \{\s*display: block;/);
    expect(bloc).not.toMatch(/overflow: hidden|text-overflow/);
    // Des barres de 24 px au plus.
    expect(bloc).toMatch(/--partage-epaisseur: 1\.5rem;/);
  });
});

/** OKLab ×100 et contraste WCAG : de quoi vérifier les teintes comme `dataviz` les vérifie. */
const lin = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
const oklab = (hex: string) => {
  const [r, g, b] = lin(hex) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const ecart = (a: string, b: string) => {
  const [x, y] = [oklab(a), oklab(b)];
  return 100 * Math.hypot(x[0]! - y[0]!, x[1]! - y[1]!, x[2]! - y[2]!);
};
const lum = (hex: string) => {
  const [r, g, b] = lin(hex) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

describe("chaque poste a sa teinte, son nom et son montant", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const marine = css.slice(css.indexOf("LA DONNÉE : UNE SEULE PALETTE"));
  const jeton = (nom: string) => marine.match(new RegExp(`--${nom}: (#[0-9a-f]{6});`))![1]!;
  const teintes = POSTES_DE_COUT.map((p) => jeton(p.creneau.slice(2)));
  const VERT = "#3ccf7e";
  const ROUGE = "#ff7070";
  const RESERVEES = ["#8fb0dc", VERT, ROUGE, "#ff8a1f", "#f4b400"];

  it("trois créneaux de données distincts, dans un ordre fixe, hors des couleurs réservées", () => {
    expect(POSTES_DE_COUT.map((p) => p.creneau)).toEqual(["--serie-4", "--serie-3", "--serie-2"]);
    expect(teintes).toEqual(["#8f81e5", "#33a6a0", "#a565b9"]);
    expect(new Set(teintes).size).toBe(3);
    for (const t of teintes) expect(RESERVEES).not.toContain(t);
    // Voisins dans la barre des coûts, puis le dernier contre le vert du reste et le rouge du manque :
    // ≥ 15 d'écart perçu en vision normale (le plancher dur de `dataviz`).
    const voisins: [string, string][] = [
      [teintes[0]!, teintes[1]!],
      [teintes[1]!, teintes[2]!],
      [teintes[2]!, VERT],
      [teintes[2]!, ROUGE],
    ];
    for (const [a, b] of voisins) expect(ecart(a, b), `${a} / ${b}`).toBeGreaterThanOrEqual(15);
    // Distincts du bleu donnée des ventes, posé au-dessus.
    for (const t of teintes) expect(ecart(t, "#8fb0dc"), t).toBeGreaterThanOrEqual(12);
  });

  it("lisibles sur le marine (≥ 3:1), et l'encre posée dessus tient 4,5:1 — sauf le prune, qui ne porte aucun texte", () => {
    for (const t of teintes) {
      expect(contraste(t, "#0b2545"), t).toBeGreaterThanOrEqual(3);
      expect(contraste(t, "#061529"), t).toBeGreaterThanOrEqual(3);
    }
    expect(contraste("#0b2545", teintes[0]!)).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#0b2545", teintes[1]!)).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#0b2545", teintes[2]!)).toBeLessThan(4.5);
    expect(css).toMatch(/\.partage-cout\[data-segment="sous-ebe"\] \.partage-etiquette \{\s*display: none;/);
    for (const t of ["#8fb0dc", VERT, ROUGE]) expect(contraste("#0b2545", t), t).toBeGreaterThanOrEqual(4.5);
  });

  it("la légende : chaque poste, sa pastille à sa teinte, son nom, son montant signé en chiffres tabulaires", () => {
    const html = rendre(benefice(), "synthese");
    const postes = [
      ...html.matchAll(
        /<li data-poste="([\w-]+)" class="partage-poste"><span aria-hidden="true" class="partage-pastille" style="--teinte:var\((--serie-\d)\)"><\/span><span class="partage-poste-nom[^"]*">([^<]*)<\/span><span data-montant="" class="partage-montant tabular-nums[^"]*">([^<]*)<\/span>/g,
      ),
    ].map((m) => [m[1], m[2], m[3], m[4]]);
    expect(postes).toEqual([
      ["variables", "--serie-4", "Coûts variables", "−169 339 €"],
      ["structure", "--serie-3", "Charges de structure", "−105 887 €"],
      ["sous-ebe", "--serie-2", "Amortissements, intérêts, impôt", "−18 933 €"],
    ]);
    // Chaque segment dessiné porte la teinte de son poste.
    for (const p of POSTES_DE_COUT) {
      expect(html).toMatch(new RegExp(`data-segment="${p.cle}"[^>]*--teinte:var\\(${p.creneau}\\)`));
    }
    // Le texte n'a jamais la couleur d'une série.
    expect(html.match(/class="[^"]*(text-emerald|text-red|text-\[var)/g)).toBeNull();
  });
});

describe("le résultat en mots, et le lecteur d'écran", () => {
  it("la phrase : bénéfice, perte, équilibre — le mot dit le sens, pas la couleur", () => {
    const b = lectureDuResultat(40_009);
    expect(`${b.avant}${lisible(b.montant)}${b.apres}${b.mot}.`).toBe(
      "Il vous reste 40 009 € : c'est votre bénéfice.",
    );
    const p = lectureDuResultat(-3_704);
    expect(`${p.avant}${lisible(p.montant)}${p.apres}${p.mot}.`).toBe(
      "Vos coûts dépassent vos ventes de 3 704 € : c'est votre perte.",
    );
    expect(lectureDuResultat(0.3).mot).toBe("équilibre");
    expect(rendre(petitePerte())).toMatch(
      /data-lecture-du-resultat="" data-mot="perte"[\s\S]*?Vos coûts dépassent vos ventes de <strong[^>]*>3 704 €<\/strong> : c'est votre <strong[^>]*>perte<\/strong>\.[\s\S]*?<span data-montant=""[^>]*>−3 704 €<\/span>/,
    );
    expect(rendre(benefice())).toMatch(/Il vous reste <strong[^>]*>40 009 €<\/strong>[\s\S]*?>\+40 009 €</);
  });

  it("la question dit les ventes ; la marge sur coût variable est écrite, sous son accolade", () => {
    const html = rendre(benefice());
    expect(html).toMatch(/Où sont passés vos <span[^>]*>334 168 €<\/span> de ventes ?/);
    expect(html).toMatch(/data-marge=""[\s\S]*?Marge sur coût variable <span[^>]*>\+164 829 €<\/span>/);
    expect(html).toContain('data-accolade-marge=""');
  });

  it("se lit au lecteur d'écran : la question, la marge, la légende nommée, la phrase ; le dessin est caché", () => {
    const html = rendre(grossePerte());
    expect(html).toMatch(/<div aria-hidden="true" class="partage-dessin">/);
    expect(html).toMatch(/<ul aria-label="Ce qui a pris sur vos ventes, poste par poste" data-legende=""/);
    const texte = html
      .replace(/<div aria-hidden="true" class="partage-dessin">[\s\S]*?(?=<p data-marge)/, "")
      .replace(/<span aria-hidden="true"[^>]*><\/span>/g, "")
      .replace(/<[^>]+>/g, "|")
      .replace(/\|+/g, "|");
    expect(texte).toContain("Où sont passés vos |180 702 €| de ventes ?");
    expect(texte).toContain("|Marge sur coût variable |−9 298 €|");
    expect(texte).toContain("|Coûts variables|−190 000 €|");
    expect(texte).toContain("|Charges de structure|−105 343 €|");
    expect(texte).toContain("|Amortissements, intérêts, impôt|−10 000 €|");
    expect(texte).toContain("Vos coûts dépassent vos ventes de |124 641 €| : c'est votre |perte|.|−124 641 €|");
    expect(texte).not.toContain("Ventes 180 702 €");
  });
});
