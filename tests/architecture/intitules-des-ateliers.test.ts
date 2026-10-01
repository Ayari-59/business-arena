import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";

/**
 * CHAQUE ATELIER PORTE UN INTITULÉ QUI NE DÉSIGNE QUE LUI.
 *
 * L'atelier tirait son identité de son diplôme : la fiche s'appelait
 * « Découvrir la gestion d'une entreprise en quatre séances », et c'est le mot
 * STMG posé à côté qui disait de quoi il s'agissait. Deux conséquences.
 *
 * LA PREMIÈRE EST QUE DEUX ATELIERS SE RESSEMBLAIENT. « Découvrir la gestion
 * en tenant une boutique » et « Découvrir la gestion d'une entreprise en
 * quatre séances » ouvraient sur les mêmes trois mots et promettaient la même
 * chose ; seul le diplôme les séparait, et une liste qui les montre côte à
 * côte n'en montrait qu'un.
 *
 * LA SECONDE EST QU'UN ATELIER NE POUVAIT PAS SERVIR DEUX FORMATIONS. Si le
 * nom ne tient que par le diplôme, le rattacher à un second le rend
 * incompréhensible. Un intitulé qui se suffit est la condition d'un
 * rattachement multiple, pas un ornement.
 *
 * La règle garde ce qui s'est réellement produit : des titres identiques, et
 * des titres dont on ne distingue pas le début.
 */

/** Les mots pleins d'un titre, accents dépliés : « de », « la », « en » ne distinguent rien. */
const VIDES = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "un",
  "une",
  "en",
  "et",
  "au",
  "aux",
  "sur",
  "pour",
  "dans",
  "son",
  "sa",
  "ses",
  "a",
  "l",
  "d",
]);

function ouverture(titre: string, combien: number): string {
  const mots = titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .match(/[a-z0-9]+/g);
  return (mots ?? [])
    .filter((m) => !VIDES.has(m))
    .slice(0, combien)
    .join(" ");
}

describe("les intitulés des ateliers", () => {
  it("il y en a un par atelier, et aucun n'est vide", () => {
    expect(ATELIERS.length).toBeGreaterThan(5);
    for (const a of ATELIERS) {
      expect(
        a.titre.trim().length,
        `${a.code} n'a pas d'intitulé`,
      ).toBeGreaterThan(10);
    }
  });

  it("deux ateliers ne portent jamais le même", () => {
    const titres = ATELIERS.map((a) => a.titre);
    const doubles = titres.filter((t, i) => titres.indexOf(t) !== i);
    expect(doubles, `intitulés en double :\n${doubles.join("\n")}`).toEqual([]);
  });

  it("deux intitulés ne commencent jamais par les trois mêmes mots pleins", () => {
    // C'est la faute réelle, et elle ne se voit pas en lisant un fichier à la
    // fois : il faut les mettre côte à côte, ce qu'aucune relecture ne fait.
    const par = new Map<string, string[]>();
    for (const a of ATELIERS) {
      const cle = ouverture(a.titre, 3);
      par.set(cle, [...(par.get(cle) ?? []), `${a.code} « ${a.titre} »`]);
    }
    const collisions = [...par.entries()]
      .filter(([, codes]) => codes.length > 1)
      .map(([cle, codes]) => `« ${cle}… » : ${codes.join(" | ")}`);
    expect(
      collisions,
      `ouvertures partagées :\n${collisions.join("\n")}`,
    ).toEqual([]);
  });

  it("aucun intitulé ne se repose sur le nom du diplôme pour dire ce qu'il est", () => {
    // Un titre qui porte « BTS MCO » devient faux le jour où l'atelier sert un
    // second diplôme, et c'est précisément ce vers quoi on va. Le titre dit ce
    // qu'on fait ; le rattachement se déclare ailleurs.
    for (const a of ATELIERS) {
      expect(a.titre, `${a.code} met son diplôme dans son titre`).not.toMatch(
        /\b(BTS|BUT|DCG|STMG|baccalaur)/i,
      );
    }
  });
});
