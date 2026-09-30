import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARCOURS } from "@/config/parcours";
import { ATELIERS, atelierByCode } from "@/config/ateliers";

/**
 * AUCUNE FILIÈRE SERVIE N'EST DITE ABSENTE.
 *
 * La page des parcours citait quatre diplômes, et sa bande finale invitait
 * « BUT GEA, DCG, bachelors » à nous écrire — alors que BUT GEA et DCG ont
 * chacun un atelier publié, avec son déroulé, ses livrables et son
 * évaluation. Un enseignant de DCG lisait donc, sur la page faite pour lui
 * répondre, que sa filière n'existait pas ici.
 *
 * Le défaut n'est pas qu'il manque des parcours : en écrire un demande de lire
 * un arrêté, et les inventer serait prêter à des diplômes des blocs qu'ils ne
 * portent pas. Le défaut est que la page IGNORAIT les ateliers, donc ne
 * pouvait pas savoir ce qu'elle servait déjà.
 *
 * LA GARDE : tout atelier publié est soit revendiqué par un parcours, soit
 * cité par la page. Un atelier ajouté demain apparaît sans qu'on y pense ; un
 * atelier oublié fait échouer ce test plutôt qu'une page.
 */

const PAGE = readFileSync(join(process.cwd(), "src/app/parcours/page.tsx"), "utf8");

describe("les parcours et les ateliers", () => {
  it("chaque parcours revendique des ateliers qui existent", () => {
    for (const p of PARCOURS) {
      expect(p.ateliers.length, `le parcours ${p.code} ne revendique aucun atelier`).toBeGreaterThan(0);
      for (const code of p.ateliers) {
        expect(atelierByCode.get(code), `${p.code} revendique l'atelier inconnu « ${code} »`).toBeTruthy();
      }
    }
  });

  it("aucun atelier n'est revendiqué par deux parcours", () => {
    const vus = new Map<string, string>();
    const doubles: string[] = [];
    for (const p of PARCOURS) {
      for (const code of p.ateliers) {
        if (vus.has(code)) doubles.push(`${code} : ${vus.get(code)} et ${p.code}`);
        vus.set(code, p.code);
      }
    }
    expect(doubles, `ateliers revendiqués deux fois :\n${doubles.join("\n")}`).toEqual([]);
  });

  it("la page cite les ateliers qu'aucun parcours ne revendique", () => {
    // C'est la règle qui manquait : sans elle, un atelier publié pouvait
    // rester invisible sur la page censée dire ce qui est couvert.
    const couverts = new Set(PARCOURS.flatMap((p) => p.ateliers));
    const restants = ATELIERS.filter((a) => !couverts.has(a.code));
    expect(restants.length, "aucun atelier hors parcours : la règle ne garde plus rien").toBeGreaterThan(0);
    expect(PAGE).toContain("AUTRES_FILIERES");
    expect(PAGE).toContain("!couverts.has(a.code)");
    // La liste se DÉDUIT : aucun code d'atelier n'est recopié dans la page.
    for (const a of restants) {
      expect(PAGE, `l'atelier « ${a.code} » est recopié dans la page`).not.toContain(`"${a.code}"`);
    }
  });

  it("n'invite plus à écrire les diplômes qui ont déjà un atelier", () => {
    // Le texte nommait BUT GEA et DCG comme absents. Les nommer quelque part
    // n'est pas interdit — les citer comme non servis l'est.
    const couverts = new Set(PARCOURS.flatMap((p) => p.ateliers));
    const servis = ATELIERS.filter((a) => !couverts.has(a.code)).map((a) => a.diplome);
    const bandeFinale = PAGE.slice(PAGE.indexOf("<BandeFinale"));
    for (const diplome of new Set(servis)) {
      const sigle = diplome.replace(/^BTS |^BUT /, "").split(/[ ·,]/)[0]!;
      if (sigle.length < 3) continue;
      expect(
        bandeFinale,
        `la bande finale nomme « ${sigle} » comme absent, alors qu'il a un atelier`,
      ).not.toContain(sigle);
    }
  });
});
