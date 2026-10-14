import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { QuiFaitQuoi } from "@/components/qui-fait-quoi";
import { ATELIERS } from "@/config/ateliers";

/**
 * TROIS RÔLES, ET RIEN QU'ON NE SACHE TENIR.
 *
 * La bande dit ce que font un élève, un enseignant et un établissement. Deux
 * façons pour elle de se mettre à mentir sans que personne le voie.
 *
 * LA PREMIÈRE EST LE LIEN MORT : une colonne qui renvoie vers une page ou une
 * ancre qui n'existe plus. « Côté établissements » est une ancre dans une
 * section repliée du guide, exactement le genre d'adresse qui survit à la
 * suppression de sa cible.
 *
 * LA SECONDE EST LE TARIF. Le produit a un palier gratuit et des licences,
 * mais ce qui est ouvert ou fermé se règle dans la configuration de
 * plateforme, et vaut « tout ouvert » par défaut : une phrase qui dit ici ce
 * qui est payant serait fausse la plupart du temps, et personne ne penserait
 * à la corriger en changeant un réglage.
 */

const SRC = join(process.cwd(), "src");
const rendu = renderToStaticMarkup(createElement(QuiFaitQuoi));
const source = readFileSync(join(SRC, "components", "qui-fait-quoi.tsx"), "utf8");

/** Le code seul : la prose qui explique la règle cite forcément les mots gardés. */
const codeSeul = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

describe("qui fait quoi", () => {
  it("nomme les trois rôles", () => {
    for (const role of ["L&#x27;élève", "L&#x27;enseignant", "L&#x27;établissement"]) {
      expect(rendu, `le rôle « ${role} » manque`).toContain(role);
    }
  });

  it("mène vers des pages qui existent", () => {
    const liens = [...rendu.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);
    expect(liens.length).toBe(3);
    for (const lien of liens) {
      const [chemin, ancre] = lien.split("#");
      const page = chemin === "/" ? "app/page.tsx" : `app${chemin}/page.tsx`;
      expect(existsSync(join(SRC, page)), `${lien} ne mène nulle part`).toBe(true);
      // Une ancre doit exister dans la page visée, sinon le lecteur arrive en
      // haut d'un guide de cinq mètres.
      if (ancre) {
        expect(readFileSync(join(SRC, page), "utf8"), `l'ancre « #${ancre} » n'existe pas`).toContain(
          `id="${ancre}"`,
        );
      }
    }
  });

  it("compte les ateliers dans le registre au lieu de les écrire", () => {
    expect(rendu).toContain(`${ATELIERS.length} ateliers`);
    expect(codeSeul).toContain("ATELIERS.length");
  });

  it("ne parle ni de prix ni de palier", () => {
    // Ce qui est ouvert se règle dans la configuration de plateforme : la
    // vitrine dit ce que chaque rôle FAIT, jamais ce qu'il coûte.
    for (const mot of ["€", "gratuit", "payant", "licence", "abonnement", "tarif", "offre établissement"]) {
      expect(codeSeul.toLowerCase(), `la bande parle de « ${mot} »`).not.toContain(mot.toLowerCase());
    }
  });

  it("est posée sur l'accueil", () => {
    expect(readFileSync(join(SRC, "app", "page.tsx"), "utf8")).toContain("<QuiFaitQuoi");
  });
});
