import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CAMPUSTECH NE « CONVIENT » PAS DE 80 JOURS.
 *
 * La loi (C. com., art. L441-10) plafonne le délai de paiement convenu entre
 * professionnels à 60 jours après la facture. Le monde du cours le dit déjà
 * (`DELAI_CONVENU_DE_CAMPUSTECH` = 60, `RETARD_DE_CAMPUSTECH` = 20) ; l'arène,
 * elle, présentait « CampusTech paie à 80 jours » comme une condition
 * commerciale. La mécanique ne change pas (le moteur encaisse toujours à
 * 80 jours, `paymentDelayDays: 80`) : seul le texte doit dire que 80 jours,
 * c'est 60 convenus plus un retard.
 *
 * La garde lit les textes de l'arène (hors cours, que d'autres tiennent) :
 * toute phrase qui nomme le client (CampusTech, le compte-clé, la chaîne de
 * magasins) avec 80 jours doit aussi dire les 60 jours convenus et le retard.
 */
const RACINES = [
  "src/config/scenarios",
  "src/config/ateliers",
  "src/config/courriers",
  "src/config/gazette",
  "src/config/episodes",
  "src/config/pedagogy",
];

const fichiers = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? fichiers(p) : /\.tsx?$/.test(n) ? [p] : [];
  });

const CLIENT = /CampusTech|compte-clé|chaîne de magasins/;
const QUATRE_VINGTS = /\b80 ?j(ours)?\b|quatre-vingts(?! (magasins|points|kilomètres|palettes|couverts|étals|pour cent|euros))/;

describe("le délai de CampusTech dans l'arène", () => {
  it("80 jours n'est jamais présenté comme le délai convenu", () => {
    const fautifs: string[] = [];
    for (const f of RACINES.flatMap(fichiers)) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          if (!CLIENT.test(ligne) || !QUATRE_VINGTS.test(ligne)) return;
          const ditLeConvenu = /60 ?j|soixante/.test(ligne);
          const ditLeRetard = /retard/.test(ligne);
          if (!(ditLeConvenu && ditLeRetard)) fautifs.push(`${f}:${i + 1}`);
        });
    }
    expect(fautifs, `80 jours présentés comme délai convenu :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("la mécanique reste celle d'un encaissement à 80 jours", async () => {
    const { novaScenario } = await import("../../src/config/scenarios/nova");
    const seg = novaScenario.market.segments.find((s) => s.code === "campustech");
    expect(seg?.paymentDelayDays).toBe(80);
  });
});
