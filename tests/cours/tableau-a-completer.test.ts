import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { CalculsDuTableau, GrilleACompleter, RemarquesDuTableau } from "../../src/components/cours/tableau-a-completer";
import { servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { typographier } from "@/lib/typographie";
import {
  cleDeCellule,
  corrigerLeTableau,
  incoherencesDuTableau,
  remarquesDuTableau,
  solutionsDuTableau,
  totauxDuTableau,
  valeurASaisir,
  valeurEcrite,
  type TableauACompleter,
} from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LE TABLEAU À COMPLÉTER, UN TYPE D'ÉTAPE (novembre 2026) : la correction cellule par cellule, les
 * totaux de ligne et de colonne, la tolérance, la garde qui refuse un tableau dont les valeurs justes
 * ne font pas leurs totaux, la sérialisation de l'étape servie, et l'écran (au clavier, au téléphone).
 */

/** Un petit tableau de répartition : deux charges, deux centres, la colonne et la ligne de total. */
const PETIT: TableauACompleter = {
  titre: "Répartition",
  colonnes: ["Total", "Atelier", "Magasin"],
  colonneDeTotal: 0,
  lignes: [
    { libelle: "Loyer", cellules: [{ valeur: 1_000 }, { valeur: 600, saisir: true, calcul: "1 000 × 60 %" }, { valeur: 400, saisir: true, calcul: "1 000 × 40 %", indice: "le loyer multiplié par la clé" }] },
    { libelle: "Énergie", cellules: [{ valeur: 300 }, { valeur: 250, saisir: true, calcul: "300 − 50" }, { valeur: 50, saisir: true, calcul: "50" }] },
    {
      libelle: "Total",
      totalDe: { plus: [0, 1] },
      cellules: [
        { valeur: 1_300, saisir: true, calcul: "1 000 + 300" },
        { valeur: 850, saisir: true, calcul: "600 + 250" },
        { valeur: 450, saisir: true, calcul: "400 + 50" },
      ],
    },
    { libelle: "Coût unitaire", cellules: [{ valeur: null }, { valeur: 8.5, saisir: true, calcul: "850 ÷ 100", tolerance: 0.05 }, { valeur: null, texte: "sans objet" }] },
  ],
};

const juste = () => ({ ...solutionsDuTableau(PETIT) });

describe("la correction du tableau, cellule par cellule", () => {
  it("les solutions sont justes, et chaque total déclaré est vérifié", () => {
    expect(incoherencesDuTableau(PETIT)).toEqual([]);
    // Trois totaux de ligne (Loyer, Énergie, Total) et trois de colonne (la ligne Total).
    expect(totauxDuTableau(PETIT).map((t) => `${t.sens}:${t.ligne}:${t.colonne}`)).toEqual(["ligne:0:0", "ligne:1:0", "ligne:2:0", "colonne:2:0", "colonne:2:1", "colonne:2:2"]);
    expect(corrigerLeTableau(PETIT, juste())).toEqual({ juste: true, cellules: expect.any(Array), fausses: 0 });
  });

  it("une cellule fausse est signalée seule, avec son indice, sans la réponse", () => {
    const c = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(0, 2)]: "410" });
    expect(c.juste).toBe(false);
    expect(c.fausses).toBe(1);
    const loyer = c.cellules.find((x) => x.ligne === 0 && x.colonne === 2)!;
    expect(loyer.remarque).toBe("le nombre ne convient pas ; pensez au loyer multiplié par la clé");
    expect(loyer.remarque).not.toContain("400");
    // Le total de la colonne reste juste : seule la cellule fausse est signalée.
    expect(remarquesDuTableau(PETIT, c)).toContain("Loyer, Magasin : le nombre ne convient pas ; pensez au loyer multiplié par la clé.");
  });

  it("un total qui ne fait pas la somme de ce que l'élève a écrit n'est pas la même erreur qu'un total juste sur une cellule fausse", () => {
    const pasLaSomme = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(2, 1)]: "900" });
    expect(pasLaSomme.cellules.find((x) => x.ligne === 2 && x.colonne === 1)!.remarque).toMatch(/^ce total ne fait pas la somme de ce que vous avez écrit/);
    // L'élève a mis 260 pour l'énergie de l'atelier, et 860 au total : son total suit ses cellules.
    const suit = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(1, 1)]: "260", [cleDeCellule(2, 1)]: "860" });
    expect(suit.cellules.find((x) => x.ligne === 2 && x.colonne === 1)!.remarque).toMatch(/^ce total suit bien vos cellules, mais l'une d'elles est fausse/);
    // La colonne de total d'une ligne : 1 300 attendu, 1 310 écrit, la ligne des centres fait 1 300.
    const ligne = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(2, 0)]: "1310" });
    expect(ligne.cellules.find((x) => x.ligne === 2 && x.colonne === 0)!.remarque).toMatch(/reprenez les autres cellules de la ligne|reprenez les lignes que ce total additionne/);
  });

  it("vide, illisible, signe inverse : chacun sa remarque ; le signe moins typographique se lit", () => {
    const c = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(0, 1)]: "", [cleDeCellule(1, 1)]: "deux cents", [cleDeCellule(1, 2)]: "−50" });
    const r = (l: number, k: number) => c.cellules.find((x) => x.ligne === l && x.colonne === k)!.remarque;
    expect(r(0, 1)).toBe("la cellule est vide");
    expect(r(1, 1)).toBe("ce qui est écrit ne se lit pas comme un nombre");
    expect(r(1, 2)).toBe("le nombre convient, pas son signe");
  });

  it("la tolérance : le centime par défaut, celle de la cellule quand elle en a une", () => {
    expect(corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(0, 1)]: "600,01" }).juste).toBe(true);
    expect(corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(0, 1)]: "600,02" }).juste).toBe(false);
    expect(corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(3, 1)]: "8,54" }).juste).toBe(true);
    expect(corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(3, 1)]: "8,56" }).juste).toBe(false);
    expect(corrigerLeTableau({ ...PETIT, tolerance: 1 }, { ...juste(), [cleDeCellule(0, 1)]: "600,9" }).juste).toBe(true);
  });

  it("les valeurs s'écrivent à la française, le signe moins typographique", () => {
    expect(valeurASaisir(-1_092)).toBe("−1092");
    expect(valeurASaisir(23.779799999999998)).toBe("23,7798");
    expect(valeurEcrite({ valeur: -1_092 }).replace(/\s/g, " ")).toBe("−1 092 €");
    expect(valeurEcrite({ valeur: 590, unite: "jeux" })).toBe("590 jeux");
    expect(valeurEcrite({ valeur: null, texte: "100 € d'achats" })).toBe("100 € d'achats");
  });
});

describe("la garde du tableau refuse ce qui ne tient pas", () => {
  it("un total faux, une ligne trop courte, une cellule à saisir sans calcul, deux lignes du même nom", () => {
    const faux: TableauACompleter = {
      ...PETIT,
      lignes: [
        PETIT.lignes[0]!,
        { libelle: "Loyer", cellules: [{ valeur: 300 }, { valeur: 250, saisir: true }] },
        { ...PETIT.lignes[2]!, cellules: [{ valeur: 1_301, saisir: true, calcul: "?" }, ...PETIT.lignes[2]!.cellules.slice(1)] },
      ],
    };
    const fautes = incoherencesDuTableau(faux).map((f) => f.replace(/\s/g, " "));
    expect(fautes).toContain("deux lignes portent le même nom");
    expect(fautes.some((f) => f.includes("2 cellules pour 3 colonnes"))).toBe(true);
    expect(fautes.some((f) => f.includes("une cellule à saisir sans son calcul"))).toBe(true);
    expect(fautes.some((f) => f.startsWith("Total, Total : 1 301 ne fait pas son total"))).toBe(true);
  });

  it("chaque tableau à compléter du cours tient ses totaux, et ses solutions passent la correction, dans chaque entreprise", () => {
    let vus = 0;
    for (const source of [...CHAPITRES, ...SITUATIONS]) {
      for (const code of source.entreprises?.codes ?? ENTREPRISES_DU_COURS) {
        const cas = casDeLEntreprise(code);
        for (const e of chapitreDuCas(source, cas).etapes) {
          if (e.type !== "a-completer") continue;
          vus++;
          const g = e.grille(cas);
          expect(incoherencesDuTableau(g), `${source.code} / ${e.id}`).toEqual([]);
          expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste, `${source.code} / ${e.id}`).toBe(true);
          // Chaque cellule à saisir s'écrit comme on la tape, et se relit juste.
          for (const [cle, v] of Object.entries(solutionsDuTableau(g))) expect(v, `${source.code} / ${e.id} / ${cle}`).not.toMatch(/e[-+]|NaN|undefined/);
        }
      }
    }
    expect(vus).toBeGreaterThanOrEqual(13);
  });
});

describe("l'étape servie : des données, sans fonction", () => {
  it("le tableau à compléter survit à la sérialisation, et garde ses valeurs et ses totaux", () => {
    const chapitre = CHAPITRES.find((c) => c.code === "le-cout-complet-pas-a-pas")!;
    const servi = servirLeChapitre(chapitre, casDeLEntreprise("nova"));
    const etapes = servi.etapes.filter((e) => e.type === "a-completer");
    expect(etapes.length).toBeGreaterThan(5);
    for (const e of etapes) {
      expect(JSON.parse(JSON.stringify(e))).toEqual(e);
      if (e.type !== "a-completer") continue;
      expect(typeof e.question).toBe("string");
      expect(e.objectifs?.length).toBeGreaterThan(0);
      const source = chapitre.etapes.find((x) => x.id === e.id)!;
      if (source.type === "a-completer") expect(e.grille).toEqual(typographier(source.grille(casDeLEntreprise("nova"))));
    }
  });
});

describe("le tableau à l'écran : lisible au clavier, au lecteur d'écran et au téléphone", () => {
  const rendu = (correction: ReturnType<typeof corrigerLeTableau> | null, fait = false, saisies: Record<string, string> = {}) =>
    renderToStaticMarkup(createElement(GrilleACompleter, { grille: PETIT, saisies, onSaisie: () => {}, correction, fait }));

  it("un vrai tableau, ses en-têtes, une case nommée « ligne, colonne », le clavier numérique, et le défilement du tableau seul", () => {
    const html = rendu(null);
    expect(html).toContain("<table");
    expect(html).toMatch(/<th[^>]*scope="col"[^>]*>Atelier<\/th>/);
    expect(html).toMatch(/<th[^>]*scope="row"[^>]*>.*Loyer/);
    expect(html).toContain('aria-label="Loyer, Atelier"');
    expect(html).toContain('aria-label="Coût unitaire, Atelier"');
    expect(html.match(/inputMode="decimal"/g)?.length).toBe(8);
    // Le tableau défile seul, de côté ; la colonne des libellés reste en place ; la zone se prend au clavier.
    expect(html).toMatch(/data-defilement-du-tableau=""/);
    expect(html).toMatch(/class="max-w-full overflow-x-auto[^"]*"[^>]*role="region"[^>]*tabindex="0"/);
    expect(html).toMatch(/<th[^>]*scope="row" class="sticky left-0/);
    // Les cellules données s'écrivent, le texte d'une cellule donnée aussi.
    expect(html.replace(/\s/g, " ")).toContain("1 000 €");
    expect(html).toContain("sans objet");
    // Un seul bouton de signe, qui ne dit rien du signe attendu tant qu'aucune case n'est touchée.
    expect(html).toContain('aria-label="Changer le signe de la case touchée"');
  });

  it("après vérification, chaque case fausse est marquée et décrite par sa remarque", () => {
    const correction = corrigerLeTableau(PETIT, { ...juste(), [cleDeCellule(0, 1)]: "" });
    const html = rendu(correction, false, { ...juste(), [cleDeCellule(0, 1)]: "" });
    expect(html).toMatch(/aria-label="Loyer, Atelier" aria-invalid="true" aria-describedby="[^"]*remarque-0-1"/);
    expect(html).toMatch(/aria-label="Loyer, Magasin" aria-invalid="false"/);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Loyer, Atelier : </strong>la cellule est vide.");
    expect(html).toMatch(/id="[^"]*remarque-0-1"/);
    const seules = renderToStaticMarkup(createElement(RemarquesDuTableau, { grille: PETIT, correction, racine: "r" }));
    expect(seules).toContain("Une case ne convient pas encore");
  });

  it("une fois réussi : les cases ne se modifient plus, et le calcul de chaque case se lit", () => {
    const html = rendu(null, true, juste());
    expect(html.match(/disabled=""/g)?.length).toBe(8);
    expect(html).not.toContain("Changer le signe");
    const calculs = renderToStaticMarkup(createElement(CalculsDuTableau, { grille: PETIT }));
    expect(calculs).toContain("Loyer, Atelier : </strong>1 000 × 60 %");
  });

  it("le guide sert l'étape, la corrige à la vérification et propose la correction après deux essais", () => {
    const guide = readFileSync(join(process.cwd(), "src/components/cours/chapitre-guide.tsx"), "utf8");
    expect(guide).toContain('{etape.type === "a-completer" && <EtapeACompleter etape={etape} {...props} />}');
    const etape = guide.slice(guide.indexOf("function EtapeACompleter"), guide.indexOf("/** Le graphique de la simulation"));
    expect(etape).toContain("corrigerLeTableau(grille, saisies)");
    expect(etape).toContain("remarques: remarquesDuTableau(grille, c)");
    expect(etape).toContain("classe || essais >= ESSAIS_AVANT_LA_CORRECTION");
    expect(etape).toContain("<CalculsDuTableau grille={grille} />");
  });
});
