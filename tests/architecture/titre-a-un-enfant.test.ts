import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN <title> NE PORTE QU'UNE CHAÎNE.
 *
 * L'infobulle d'un point de courbe s'écrivait `{libellé} : {valeur}` : trois
 * enfants. React 19 rend VIDE, côté serveur, un <title> qui en a plusieurs ;
 * le navigateur, lui, écrivait le texte. L'écart se payait d'une erreur
 * d'hydratation (#418) à chaque ouverture de l'arène à partir du deuxième
 * tour, et la page se reconstruisait entière côté client. Un gabarit de
 * chaîne, `{`${libellé} : ${valeur}`}`, n'a qu'un enfant.
 */

function sources(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...sources(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

/** Le contenu d'un <title> n'a qu'un enfant : du texte seul, ou une seule expression. */
function titresAPlusieursEnfants(source: string): string[] {
  const fautes: string[] = [];
  for (const m of source.matchAll(/<title>((?:(?!<title>)[\s\S])*?)<\/title>/g)) {
    const contenu = m[1]!.trim();
    const texteSeul = !contenu.includes("{");
    // Une seule expression : `{…}` d'un bout à l'autre, sans `}` puis `{` au
    // premier niveau (les gabarits de chaîne, mis de côté, en ont à l'intérieur).
    const sansGabarits = contenu.replace(/`[^`]*`/g, "``");
    const uneExpression = /^\{[\s\S]*\}$/.test(sansGabarits) && !/\}[^{}]*\{/.test(sansGabarits);
    if (!texteSeul && !uneExpression) fautes.push(contenu.replace(/\s+/g, " "));
  }
  return fautes;
}

describe("le titre d'un élément ne porte qu'une chaîne", () => {
  it("le détecteur reconnaît un titre à plusieurs enfants", () => {
    expect(titresAPlusieursEnfants("<title>{a} : {b}</title>")).toHaveLength(1);
    expect(titresAPlusieursEnfants("<title>T{n}</title>")).toHaveLength(1);
    expect(titresAPlusieursEnfants("<title>{`${a} : ${b}`}</title>")).toEqual([]);
    expect(titresAPlusieursEnfants("<title>Texte seul</title>")).toEqual([]);
  });

  it("aucun composant n'écrit un <title> à plusieurs enfants", () => {
    const fichiers = sources("src");
    expect(fichiers.length).toBeGreaterThan(50);
    const fautes = fichiers.flatMap((f) =>
      titresAPlusieursEnfants(readFileSync(f, "utf8")).map((t) => `${f} : ${t}`),
    );
    expect(fautes).toEqual([]);
  });
});
