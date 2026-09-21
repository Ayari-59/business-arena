import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { IndicesDeLaPartie } from "@/components/indices-de-la-partie";
import { maitriseDeLaPartie } from "@/pedagogy/maitrise-de-la-partie";

/**
 * CE QUE L'ENTREPRISE A FAIT, CE QUE L'ÉQUIPE A COMPRIS.
 *
 * Les deux étaient fondus dans l'IPG, où la part pédagogique pèse 5 % des
 * pondérations. L'élève lit en permanence ce qu'on lui montre, et optimise ce
 * qu'il lit. Les deux mesures s'affichent donc côte à côte, et séparées.
 */

const situation = (rendered: boolean, finalScore: number | null) => ({
  rendered,
  debrief: finalScore === null ? null : { finalScore },
});

describe("la maîtrise de la partie", () => {
  it("moyenne les situations rendues et débriefées", () => {
    const m = maitriseDeLaPartie([situation(true, 1), situation(true, 0.5)])!;
    expect(m.valeur).toBeCloseTo(0.75, 9);
    expect(m.sur20).toBe(15);
    expect(m.mesurees).toBe(2);
  });

  it("une situation non rendue n'est pas un zéro : elle ne compte pas", () => {
    // Même règle que le relevé de notes et le carnet d'usage. Compter un
    // silence pour zéro trancherait à la place de l'enseignant, en pleine
    // partie et sans qu'il l'ait vu.
    const m = maitriseDeLaPartie([situation(true, 1), situation(false, 0)])!;
    expect(m.valeur).toBe(1);
    expect(m.mesurees).toBe(1);
  });

  it("une situation rendue mais pas encore débriefée ne compte pas non plus", () => {
    expect(maitriseDeLaPartie([situation(true, null)])).toBeNull();
  });

  it("rien de mesuré vaut null, jamais zéro", () => {
    expect(maitriseDeLaPartie([])).toBeNull();
    expect(maitriseDeLaPartie([situation(false, null)])).toBeNull();
  });

  it("la note sur 20 s'arrondit au quart de point, comme le relevé", () => {
    expect(maitriseDeLaPartie([situation(true, 0.7)])!.sur20).toBe(14);
    expect(maitriseDeLaPartie([situation(true, 0.66)])!.sur20).toBe(13.25);
  });
});

describe("les deux indices à l'écran", () => {
  const rendre = (props: Parameters<typeof IndicesDeLaPartie>[0]) =>
    renderToStaticMarkup(createElement(IndicesDeLaPartie, props));

  const maitrise = maitriseDeLaPartie([situation(true, 0.8)]);

  it("nomme l'entreprise et la maîtrise, sans les additionner", () => {
    const html = rendre({ ipg: 62, rang: 2, total: 4, maitrise });
    expect(html).toContain("Entreprise 62");
    expect(html).toContain("Maîtrise 16/20");
    expect(html).toContain("#2/4");
    // Aucun troisième chiffre qui les fondrait : les pondérer appartient à
    // l'enseignant, pas au logiciel. On lit le TEXTE VISIBLE, infobulles
    // retirées — « moyenne de vos situations » y décrit la maîtrise elle-même,
    // ce qui est juste, et un garde qui s'en offusque ne mesure rien.
    const visible = html.replace(/ title="[^"]*"/g, "");
    expect(visible).not.toMatch(/total|global|score/i);
    // Deux pastilles, pas trois.
    expect(visible.match(/<span class="rounded-full/g)).toHaveLength(2);
  });

  it("le rang attend que l'enseignant ouvre le classement", () => {
    const html = rendre({ ipg: 62, rang: null, total: 4, maitrise });
    expect(html).not.toContain("#");
    expect(html).toContain("révélé par votre enseignant");
  });

  it("la maîtrise ne s'affiche pas tant qu'elle n'est pas mesurée", () => {
    const html = rendre({ ipg: 62, rang: 1, total: 4, maitrise: null });
    expect(html).toContain("Entreprise");
    expect(html).not.toContain("Maîtrise");
    // Surtout pas un zéro : ce serait lu comme une note.
    expect(html).not.toContain("0/20");
  });

  it("rien à montrer ne montre rien", () => {
    expect(rendre({ ipg: null, rang: null, total: 0, maitrise: null })).toBe("");
  });

  it("chaque indice dit ce qu'il mesure, en toutes lettres", () => {
    const html = rendre({ ipg: 62, rang: 2, total: 4, maitrise });
    expect(html).toContain("Ce que votre entreprise a fait");
    expect(html).toContain("Ce que vous avez compris");
  });
});

describe("l'arène affiche les deux", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/arena/[gameId]/page.tsx"),
    "utf8",
  );

  it("monte le composant et calcule la maîtrise sur les situations débriefées", () => {
    expect(page).toContain("<IndicesDeLaPartie");
    expect(page).toContain("maitriseDeLaPartie(");
  });

  it("l'en-tête ne porte plus un IPG seul", () => {
    // Le sigle reste légitime ailleurs (classement, tableau de bord, espace
    // enseignant) ; c'est en en-tête, affiché en permanence et seul, qu'il
    // faisait passer la compréhension pour un détail.
    const entete = page.slice(0, page.indexOf("</header>"));
    expect(entete).not.toMatch(/IPG\{?"?\s*\}?\s*\{?"?\s*\}?\s*\{view\.playerBpi/);
  });
});
