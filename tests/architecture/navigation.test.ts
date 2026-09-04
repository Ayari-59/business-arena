import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACTION_PRINCIPALE,
  NAVIGATION,
  liensDeTete,
  tousLesLiens,
} from "../../src/config/navigation";

/**
 * LE PLAN DU SITE NE SE RECOPIE PAS.
 *
 * Deux défauts d'une même origine : le menu masquait ses huit liens en dessous
 * de la barre des petits écrans sans rien mettre à la place, et le pied de page
 * d'accueil tenait sa propre liste, où la page qui aide à choisir sa simulation
 * n'était jamais entrée.
 *
 * Une liste écrite deux fois diverge toujours. Ces gardes vérifient donc trois
 * choses : que le registre ne mène nulle part, que le menu et le pied de page
 * le LISENT au lieu de le redire, et qu'une entrée y reste utilisable.
 */

/** L'adresse d'un lien, ramenée au fichier de route qui doit exister. */
function routeDe(href: string): string {
  return `src/app${href === "/" ? "" : href}/page.tsx`;
}

describe("plan du site", () => {
  it("chaque lien mène à une page qui existe", () => {
    // Le défaut le plus bête et le plus visible : une entrée de menu qui rend
    // une erreur. Elle ne se voit qu'en cliquant, donc jamais en développant.
    const morts = tousLesLiens()
      .map((l) => ({ ...l, route: routeDe(l.href) }))
      .filter((l) => !existsSync(l.route));
    expect(morts, `liens sans page :\n${morts.map((l) => `${l.href} → ${l.route}`).join("\n")}`)
      .toEqual([]);
  });

  it("aucune adresse n'est portée deux fois", () => {
    const adresses = tousLesLiens().map((l) => l.href);
    expect(adresses.length, "plan vide").toBeGreaterThan(5);
    expect([...new Set(adresses)].sort()).toEqual([...adresses].sort());
  });

  it("chaque entrée dit ce qu'on y trouve", () => {
    // « Parcours », « Guide » et « Notions » ne se distinguent pas pour qui
    // découvre le site : sans la phrase d'aide, on ouvre les trois.
    for (const lien of tousLesLiens()) {
      expect(lien.libelle.trim().length, `${lien.href} : libellé vide`).toBeGreaterThan(2);
      expect(lien.aide.trim().length, `${lien.href} : aide trop courte`).toBeGreaterThan(40);
    }
    for (const groupe of NAVIGATION) {
      expect(groupe.liens.length, `groupe « ${groupe.titre} » vide`).toBeGreaterThan(0);
    }
  });

  it("la barre ne remet pas tout le plan à plat", () => {
    // C'est l'encombrement d'origine : une rangée qui affiche tout n'affiche
    // plus rien. Les ancres hors du menu restent une minorité, et l'entrée
    // principale n'en fait pas partie puisqu'elle est tenue à part.
    const total = NAVIGATION.flatMap((g) => g.liens).length;
    expect(liensDeTete().length).toBeGreaterThan(0);
    expect(liensDeTete().length).toBeLessThan(total / 2 + 1);
    expect(liensDeTete().some((l) => l.href === ACTION_PRINCIPALE.href)).toBe(false);
  });

  it("le menu et le pied de page lisent le registre au lieu de l'écrire", () => {
    // La garde qui empêche le défaut de revenir : tant que les adresses ne
    // sont pas écrites dans ces deux blocs, elles ne peuvent pas s'y
    // désaccorder. La page d'accueil garde le droit de renvoyer vers une page
    // depuis son CORPS, ce qui est un lien éditorial et non une copie du plan :
    // on ne regarde donc que son pied.
    const menu = readFileSync("src/components/site-header.tsx", "utf-8");
    const accueil = readFileSync("src/app/page.tsx", "utf-8");
    const pied = accueil.slice(accueil.indexOf("<footer"), accueil.indexOf("</footer>"));
    expect(pied.length, "pied de page d'accueil introuvable").toBeGreaterThan(100);

    for (const [nom, bloc] of [
      ["le menu", menu],
      ["le pied de page d'accueil", pied],
    ] as const) {
      expect(
        nom === "le menu" ? menu : accueil,
        `${nom} n'importe pas le plan`,
      ).toContain("@/config/navigation");
      for (const lien of tousLesLiens()) {
        expect(bloc, `${nom} recopie l'adresse « ${lien.href} »`).not.toContain(
          `href="${lien.href}"`,
        );
        expect(bloc, `${nom} recopie le libellé « ${lien.libelle} »`).not.toContain(
          `>${lien.libelle}<`,
        );
      }
    }
  });
});
