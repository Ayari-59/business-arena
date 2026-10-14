import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UNE AIDE DE CHAMP EST UNE PHRASE FINIE (lot P4).
 *
 * L'audit premium l'avait relevé sous le prix de la feuille de décision :
 * « Attention aux seuils psychologiques… ». Des points de suspension sous un
 * champ font inachevé : l'aide dit quelque chose de juste et complet, ou elle
 * n'est pas là.
 *
 * Ce que la garde lit : toute valeur littérale (chaîne ou gabarit) donnée à
 * une aide — `hint`, `aide`, `help`, `indication`, en attribut JSX ou en
 * propriété — dans `src/components` et `src/config`. Ce qu'elle ne lit pas,
 * exprès : les `prompt` des questions de situation, qui sont des DÉBUTS DE
 * PHRASE à compléter (« La marge sur coût variable unitaire, c'est… » : les
 * options la terminent), les libellés d'attente des boutons (« Envoi… »), les
 * textes indicatifs des champs vides et les répliques des épisodes.
 */
const RACINES = ["src/components", "src/config"].map((r) => join(process.cwd(), r));

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

const AIDE =
  /\b(hint|aide|help|indication)\s*(?:=\s*\{?|:)\s*(["'`])((?:\\.|(?!\2)[^\\])*)\2/g;

const aides = RACINES.flatMap(fichiers).flatMap((f) => {
  const source = readFileSync(f, "utf8");
  return [...source.matchAll(AIDE)].map((m) => ({
    fichier: f.slice(process.cwd().length + 1),
    cle: m[1]!,
    texte: m[3]!,
  }));
});

describe("les aides des champs", () => {
  it("la garde lit vraiment les aides (elle n'est pas aveugle)", () => {
    expect(aides.length).toBeGreaterThan(200);
    // L'aide du prix de la feuille de décision, celle que l'audit citait.
    expect(
      aides.some(
        (a) => a.fichier.endsWith("decision-form.tsx") && /prix rond/.test(a.texte),
      ),
    ).toBe(true);
  });

  it("aucune ne finit par des points de suspension", () => {
    const suspendues = aides
      .filter((a) => /(…|\.\.\.)\s*$/.test(a.texte))
      .map((a) => `${a.fichier} · ${a.cle} : « ${a.texte.slice(-60)} »`);
    expect(suspendues, suspendues.join("\n")).toEqual([]);
  });
});
