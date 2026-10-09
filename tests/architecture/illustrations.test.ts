import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PORTRAITS,
  PortraitDInterlocuteur,
  interlocuteurDe,
  type Interlocuteur,
} from "@/components/illustrations/portrait-d-interlocuteur";
import { Lettre, Message } from "@/components/courrier";
import { COURRIERS } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE } from "@/config/courriers/routine";
import { LETTRES_DE_MISSION } from "@/config/courriers/mission";
import { COURRIERS_EN_RETOUR } from "@/config/courriers/reponses";

/**
 * LES ILLUSTRATIONS DE L'ARÈNE (lot 6B) : des visages pour ceux qui écrivent
 * aux entreprises, dessinés en SVG inline dans une palette FERMÉE. (Les scènes
 * des entreprises viendront en photographies traitées, à part.)
 *
 * Ce que la garde tient :
 *   · chaque expéditeur du courrier est reconnu par une figure ;
 *   · aucune couleur hors de la palette : ni l'orange de l'action, ni l'or du
 *     verdict, ni le vert ou le rouge des résultats ;
 *   · ni texte, ni image, ni lien dans un dessin ;
 *   · l'accent passe par `var(--metier`, sans quoi l'illustration ne prendrait
 *     pas la couleur de l'entreprise jouée.
 */

const PALETTE = new Set([
  "#06152a",
  "#0b2545",
  "#0e2a4d",
  "#102f55",
  "#13355f",
  "#1b416f",
  "#234c80",
  "#2d5385",
  "#f1ede4",
  "#d9d2c3",
]);
/** Le repli de la teinte, hors d'une partie : il n'existe qu'au fond de `var(--metier, …)`. */
const REPLI_DE_LA_TEINTE = /var\(--metier,\s*#9fabff\)/g;

const DOSSIER = join(process.cwd(), "src", "components", "illustrations");

const portraits = (Object.keys(PORTRAITS) as Interlocuteur[]).map((qui) => ({
  nom: `portrait ${qui}`,
  html: renderToStaticMarkup(createElement(PortraitDInterlocuteur, { qui })),
}));
const dessins = portraits;

/** Les couleurs écrites dans un rendu ou un source, le repli de la teinte retiré. */
function couleurs(texte: string): string[] {
  const sansRepli = texte.replace(REPLI_DE_LA_TEINTE, "var(--metier)");
  return [
    ...(sansRepli.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((c) => c.toLowerCase()),
    ...(sansRepli.match(/\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/g) ?? []),
  ];
}

const TOUS_LES_COURRIERS = [
  ...COURRIERS,
  ...COURRIERS_DE_ROUTINE,
  ...LETTRES_DE_MISSION,
  ...COURRIERS_EN_RETOUR,
];

describe("un visage pour chaque expéditeur", () => {
  it("chaque expéditeur du courrier est reconnu par une figure", () => {
    const orphelins = [
      ...new Set(
        TOUS_LES_COURRIERS.filter((c) => interlocuteurDe(c.expediteur) === null).map(
          (c) => c.expediteur,
        ),
      ),
    ];
    expect(orphelins, `expéditeurs sans portrait :\n${orphelins.join("\n")}`).toEqual([]);
  });

  it("chaque figure signe au moins un courrier, et elles ne sont pas plus de huit", () => {
    const servies = new Set(TOUS_LES_COURRIERS.map((c) => interlocuteurDe(c.expediteur)));
    for (const qui of Object.keys(PORTRAITS)) expect(servies, qui).toContain(qui);
    expect(Object.keys(PORTRAITS).length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(PORTRAITS).length).toBeLessThanOrEqual(8);
  });

  it("la lettre et le courriel ouverts montrent le visage de qui écrit", () => {
    const lettre = TOUS_LES_COURRIERS.find((c) => c.pli !== "email")!;
    const courriel = TOUS_LES_COURRIERS.find((c) => c.pli === "email")!;
    for (const html of [
      renderToStaticMarkup(createElement(Lettre, { code: lettre.code })),
      renderToStaticMarkup(createElement(Message, { code: courriel.code })),
    ]) {
      expect(html).toMatch(/<svg[^>]*class="portrait-d-interlocuteur[^"]*print:hidden/);
    }
  });
});

describe("la palette fermée", () => {
  it.each(dessins)(
    "$nom : aucune couleur hors des marines, du blanc cassé et de la teinte",
    ({ html }) => {
      const hors = couleurs(html).filter((c) => !PALETTE.has(c));
      expect(hors).toEqual([]);
      // Pas de couleur nommée non plus (fill="orange", stroke="gold"…).
      const nommees = [...html.matchAll(/(?:fill|stroke)="([a-z]+)"/g)]
        .map((m) => m[1])
        .filter((v) => v !== "none");
      expect(nommees).toEqual([]);
    },
  );

  it.each(dessins)("$nom : l'accent passe par var(--metier", ({ html }) => {
    expect(html).toContain("var(--metier");
    // Et pas seulement en voile : une pièce au moins porte la teinte PLEINE
    // (le halo à 8 % des portraits ne suffit pas à dire l'entreprise).
    const teintes = html.match(/<\w+[^>]*style="(?:fill|stroke):var\(--metier[^"]*"[^>]*>/g) ?? [];
    const pleines = teintes.filter((e) => {
      const o = e.match(/opacity="([\d.]+)"/);
      return !o || Number(o[1]) >= 0.5;
    });
    expect(pleines.length).toBeGreaterThan(0);
    // Toute déclaration de style est une teinte du métier, rien d'autre.
    for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
      expect(style).toMatch(/^(?:fill|stroke):var\(--metier, #9fabff\)$/);
    }
  });

  it("les sources du dossier n'écrivent aucune couleur hors de la palette", () => {
    const hors: string[] = [];
    for (const f of readdirSync(DOSSIER)) {
      const source = readFileSync(join(DOSSIER, f), "utf8");
      for (const c of couleurs(source)) if (!PALETTE.has(c)) hors.push(`${f} : ${c}`);
      // Une couleur nommée dans un attribut (fill="orange", stroke={"gold"}…).
      for (const m of source.matchAll(/\b(?:fill|stroke|color|stopColor)=\{?"(?!none")([a-z]+)"/g))
        hors.push(`${f} : ${m[0]}`);
    }
    expect(hors).toEqual([]);
  });
});

describe("un dessin, rien qu'un dessin", () => {
  it.each(dessins)("$nom : ni texte, ni image, ni lien", ({ html }) => {
    expect(html).not.toMatch(/<(?:text|tspan|image|foreignObject|use|a)\b/);
    expect(html).not.toMatch(/\bhref=/);
  });

  it.each(dessins)("$nom : décoratif par défaut, et léger", ({ html }) => {
    expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/);
    expect(html).not.toContain("role=");
    expect(Buffer.byteLength(html)).toBeLessThan(8 * 1024);
  });

  it("avec un titre, il se lit comme une image", () => {
    const html = renderToStaticMarkup(
      createElement(PortraitDInterlocuteur, { qui: "banque", titre: "La banque" }),
    );
    expect(html).toMatch(/^<svg[^>]*role="img"[^>]*aria-label="La banque"/);
    expect(html).not.toContain("aria-hidden");
  });
});
