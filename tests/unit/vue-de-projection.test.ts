import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { VueDeProjection, type Panneau } from "@/components/vue-de-projection";

/**
 * CE QUE LA CLASSE VOIT AU MUR.
 *
 * Toutes les pages enseignantes sont écrites pour un écran à cinquante
 * centimètres. Du fond d'une salle, le code d'invitation (3xl), l'état des
 * validations (text-sm dans un tableau) et le classement (text-sm) sont
 * illisibles : la séance se tenait à la voix.
 */

const EQUIPES = [
  { nom: "Les Fourmis", aValide: true },
  { nom: "Vega", aValide: false },
  { nom: "Atelier 9", aValide: true },
];

const CLASSEMENT = [
  { rang: 1, nom: "Les Fourmis", ipg: 62.4, defaillant: false },
  { rang: 2, nom: "Atelier 9", ipg: 51.8, defaillant: false },
  { rang: 3, nom: "Vega", ipg: 30.2, defaillant: true },
];

const base: Omit<Parameters<typeof VueDeProjection>[0], "defaut"> = {
  joinCode: "K7M2PR",
  adresse: "www.business-arena.fr/join",
  elevesConnectes: 9,
  equipes: EQUIPES,
  libelleTour: "Trimestre 3",
  echeance: null,
  classement: CLASSEMENT,
  classementRevele: true,
  libelleTourClos: "Trimestre 2",
  finished: false,
  retour: "/teacher/games/g1",
};

const rendre = (p: Partial<typeof base> & { defaut: Panneau }) =>
  renderToStaticMarkup(createElement(VueDeProjection, { ...base, ...p }));

describe("un panneau à la fois", () => {
  it("le code d'entrée ne montre ni les validations ni le classement", () => {
    const html = rendre({ defaut: "code" });
    expect(html).toContain("K7M2PR");
    expect(html).toContain("www.business-arena.fr/join");
    expect(html).toContain("9 élèves connectés");
    expect(html).not.toContain("Les Fourmis");
  });

  it("le tour montre le compte, l'accord, et les noms", () => {
    const html = rendre({ defaut: "tour" });
    expect(html).toContain("2 / 3");
    expect(html).toContain("équipes ont validé");
    // « il manque deux équipes » ne dit pas lesquelles : chacune se cherche.
    for (const e of EQUIPES) expect(html).toContain(e.nom);
    expect(html).not.toContain("K7M2PR");
  });

  it("une seule équipe : le verbe s'accorde", () => {
    const html = rendre({ defaut: "tour", equipes: [EQUIPES[0]!] });
    expect(html).toContain("équipe a validé");
    expect(html).not.toContain("équipes ont validé");
  });

  it("le classement montre le rang, le nom et l'IPG", () => {
    const html = rendre({ defaut: "classement" });
    expect(html).toContain("#1");
    expect(html).toContain("62.4");
    expect(html).toContain("Trimestre 2");
    // Sans cette ligne, la colonne de droite est une suite de décimales sans
    // unité : le sigle n'apparaît nulle part ailleurs sur le mur.
    expect(html).toContain("Indice de performance globale (IPG)");
  });

  it("l'heure de fermeture s'affiche dès le rendu serveur, avant tout script", () => {
    // C'est le panneau qu'on laisse vingt minutes au mur : il ne s'ouvre pas
    // sur un trou en attendant l'hydratation.
    const html = rendre({ defaut: "tour", echeance: "2026-09-22T12:40:00Z" });
    expect(html).toContain("Ferme");
    expect(html).toContain("14:40");
  });
});

describe("le rideau tient jusque sur le mur", () => {
  it("un classement non révélé ne se projette pas", () => {
    const html = rendre({ defaut: "classement", classementRevele: false });
    expect(html).toContain("sous embargo");
    // Aucun chiffre ne fuit : c'est tout l'objet du rideau.
    expect(html).not.toContain("62.4");
    expect(html).not.toContain("#1");
  });

  it("sans tour clos, il annonce l'attente plutôt qu'un vide", () => {
    const html = rendre({ defaut: "classement", classement: [], libelleTourClos: null });
    expect(html).toContain("après le premier tour clos");
  });
});

describe("écrit pour le fond de la salle", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/vue-de-projection.tsx"),
    "utf8",
  );

  it("les tailles du message suivent la largeur de l'écran", () => {
    // Le même écran sert un vidéoprojecteur de salle et un portable en table
    // ronde : une taille figée conviendrait à l'un ou à l'autre, jamais aux deux.
    const clamps = source.match(/text-\[clamp\([^\]]+\)\]/g) ?? [];
    expect(clamps.length).toBeGreaterThan(8);
    for (const c of clamps) expect(c, `${c} : borne basse sous 0,8 rem`).toMatch(/clamp\((?:0\.[89]|[1-9])/);
  });

  it("le code d'invitation est le plus gros caractère de la page", () => {
    expect(source).toContain("text-[clamp(3rem,17vw,11rem)]");
  });
});

describe("branchée à la séance", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("la page choisit le panneau d'ouverture d'après le moment de la partie", () => {
    const page = lire("src/app/teacher/games/[gameId]/projection/page.tsx");
    expect(page).toContain("const defaut: Panneau");
    expect(page).toContain("elevesConnectes === 0");
    expect(page).toContain("rankingRevealed");
  });

  it("une validation apparaît au mur sans toucher au clavier", () => {
    const page = lire("src/app/teacher/games/[gameId]/projection/page.tsx");
    expect(page).toContain("<RoundStatusPoller");
    expect(page).toContain('endpoint="submissions"');
  });

  it("l'échéance projetée est la première borne qui tombe", () => {
    const page = lire("src/app/teacher/games/[gameId]/projection/page.tsx");
    expect(page).toContain("tourCourant?.deadline");
    expect(page).toContain("view.closesAt");
  });

  it("le pilotage y mène, en premier lien du ticket", () => {
    const pilotage = lire("src/app/teacher/games/[gameId]/page.tsx");
    expect(pilotage).toContain("Projeter pour la classe");
    // DANS LE TICKET, et non dans le fichier : un import qui cite
    // `/observation` en tête de page faisait échouer une comparaison de
    // positions faite sur la source entière.
    const ticket = pilotage.slice(pilotage.indexOf('aria-label="Code d\'invitation"'));
    expect(ticket.indexOf("/projection")).toBeGreaterThan(-1);
    expect(ticket.indexOf("/projection")).toBeLessThan(ticket.indexOf("/observation"));
  });
});
