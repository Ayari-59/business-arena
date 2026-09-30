import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { GESTES, SOCLE } from "@/config/competences";
import { DESTINATION, rapportDuSocle } from "../../scripts/socle-des-competences";

/**
 * LE SOCLE NE PERD AUCUNE COMPÉTENCE EN ROUTE.
 *
 * Les treize ateliers écrivent 251 compétences pour 247 textes distincts :
 * chacun réécrit les siennes, même quand le geste est le même. Le socle les
 * rassemble, et c'est là que se joue le risque : une phrase qu'aucun geste ne
 * reprend est une compétence qui disparaîtra le jour de la migration, sans
 * qu'aucune page ne change et sans qu'aucun test n'échoue.
 *
 * TROIS FAUTES POSSIBLES, TOUTES SILENCIEUSES.
 *
 * L'OUBLI : une phrase que personne ne reprend. C'est la seule qui détruit
 * quelque chose, donc c'est la règle principale.
 *
 * LE FANTÔME : une coordonnée qui ne désigne rien, parce qu'une séance a été
 * remaniée depuis. Le geste garde alors une origine imaginaire, et le rapport
 * affiche une ligne vide que personne ne relit.
 *
 * LE DOUBLON : une phrase reprise par deux gestes. Elle serait comptée deux
 * fois dans toute correspondance avec un référentiel, et gonflerait la
 * couverture annoncée d'un diplôme.
 */

const CORPUS = new Map<string, string>();
for (const a of ATELIERS) {
  for (const s of a.seances) {
    s.competences.forEach((texte, i) => CORPUS.set(`${a.code}:${s.numero}:${i}`, texte));
  }
}

const PRIS = new Map<string, string[]>();
for (const g of GESTES) for (const o of g.origines) PRIS.set(o, [...(PRIS.get(o) ?? []), g.code]);

describe("le socle de compétences", () => {
  it("garde toutes les compétences écrites dans les ateliers", () => {
    expect(CORPUS.size, "aucune compétence au registre").toBeGreaterThan(200);
    const oubliees = [...CORPUS.entries()].filter(([cle]) => !PRIS.has(cle));
    expect(
      oubliees.map(([cle, texte]) => `${cle} ${texte}`),
      `compétences qu'aucun geste ne reprend :\n${oubliees.map(([c, t]) => `${c} ${t}`).join("\n")}`,
    ).toEqual([]);
  });

  it("ne cite aucune phrase qui n'existe pas", () => {
    const fantomes = [...PRIS.keys()].filter((c) => !CORPUS.has(c));
    expect(fantomes, `coordonnées qui ne désignent rien :\n${fantomes.join("\n")}`).toEqual([]);
  });

  it("ne reprend aucune phrase deux fois", () => {
    const doubles = [...PRIS.entries()]
      .filter(([, gestes]) => gestes.length > 1)
      .map(([cle, gestes]) => `${cle} → ${gestes.join(", ")}`);
    expect(doubles, `phrases reprises deux fois :\n${doubles.join("\n")}`).toEqual([]);
  });

  it("chaque geste a un code unique, un énoncé à la première personne, et une origine", () => {
    const codes = GESTES.map((g) => g.code);
    expect(codes.length, "socle vide").toBeGreaterThan(20);
    expect(new Set(codes).size, "deux gestes portent le même code").toBe(codes.length);
    for (const g of GESTES) {
      expect(g.origines.length, `${g.code} ne vient d'aucune phrase`).toBeGreaterThan(0);
      // La première personne n'est pas un style : c'est la forme qu'attend un
      // passeport professionnel, et elle oblige à nommer un acte plutôt qu'un
      // chapitre. Les 251 phrases d'origine la respectent toutes.
      expect(g.enonce, `${g.code} : « ${g.enonce} »`).toMatch(/^(Je |J'|Je')/);
      expect(g.code, `${g.code} n'est pas un code lisible`).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("chaque famille a un propos et des gestes", () => {
    expect(SOCLE.length).toBeGreaterThan(5);
    for (const f of SOCLE) {
      expect(f.gestes.length, `la famille ${f.code} est vide`).toBeGreaterThan(0);
      expect(f.propos.length, `la famille ${f.code} ne dit pas ce qu'elle recouvre`).toBeGreaterThan(20);
    }
  });

  it("le rapport de docs/ n'a pas vieilli", () => {
    // Un rapport périmé dit le contraire de la donnée, ce qui est pire que pas
    // de rapport : c'est sur lui qu'on arbitre.
    const ecrit = readFileSync(join(process.cwd(), DESTINATION), "utf8");
    expect(
      ecrit.trim(),
      `${DESTINATION} a vieilli : npx tsx scripts/socle-des-competences.ts --ecrire`,
    ).toBe(rapportDuSocle().trim());
  });
});
