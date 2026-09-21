import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
// L'action serveur ouvre la base à l'import : le composant n'a besoin que de
// sa référence pour être rendu en HTML statique.
vi.mock("@/app/join/actions", () => ({ libererLAppareilAction: async () => ({ error: null }) }));

import { IdentiteDeLAppareil } from "@/components/identite-de-lappareil";
import { NOM_INVITE_PAR_DEFAUT, pseudoAffichable } from "@/config/invite";

/**
 * L'APPAREIL PARTAGÉ.
 *
 * Le cookie invité dure un an et il n'existait aucune façon de le rendre : en
 * salle informatique, le deuxième élève d'un poste héritait de l'identité du
 * premier, son prénom écrasait celui d'avant, et les deux ne faisaient plus
 * qu'un seul joueur. Ces gardes tiennent le geste de sortie et le nom affiché.
 */

const rendre = (props: Parameters<typeof IdentiteDeLAppareil>[0]) =>
  renderToStaticMarkup(createElement(IdentiteDeLAppareil, props));

describe("le nom affichable", () => {
  it("écarte le nom par défaut, qui n'apprend rien", () => {
    expect(pseudoAffichable(NOM_INVITE_PAR_DEFAUT)).toBeNull();
    expect(pseudoAffichable("  Joueur invité  ")).toBeNull();
  });

  it("écarte le vide, garde un vrai prénom", () => {
    expect(pseudoAffichable(null)).toBeNull();
    expect(pseudoAffichable(undefined)).toBeNull();
    expect(pseudoAffichable("   ")).toBeNull();
    expect(pseudoAffichable(" Léa ")).toBe("Léa");
  });
});

describe("à l'entrée par code : un avertissement", () => {
  const html = rendre({ pseudo: "Léa", variante: "entree" });

  it("nomme l'occupant de l'appareil avant la saisie", () => {
    expect(html).toContain("Léa");
    expect(html).toContain("déjà utilisé par");
  });

  it("dit quand agir : avant le code, pas après", () => {
    expect(html).toContain("avant de saisir votre code");
  });

  it("offre la sortie", () => {
    expect(html).toContain("Ce n&#x27;est pas moi");
  });
});

describe("dans l'arène : un rappel", () => {
  const html = rendre({ pseudo: "Léa", equipe: "Les Fourmis", variante: "arene" });

  it("dit sous quel nom et dans quelle équipe on décide", () => {
    expect(html).toContain("Léa");
    expect(html).toContain("Les Fourmis");
    expect(html).toContain("Vous jouez sous le nom de");
  });

  it("ne crie pas : c'est un rappel, pas une alerte", () => {
    expect(html).not.toContain("déjà utilisé par");
  });
});

describe("le geste est réversible, et le dit", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("l'action efface le cookie et renvoie à l'entrée par code", () => {
    const action = lire("src/app/join/actions.ts");
    expect(action).toContain("clearGuestCookie");
    expect(action).toContain('redirect("/join")');
  });

  it("rien n'est supprimé en base : aucun delete dans le chemin de sortie", () => {
    const guest = lire("src/lib/guest.ts");
    // `store.delete` porte sur le cookie ; aucune suppression de ligne.
    expect(guest).toContain("store.delete(COOKIE)");
    expect(guest).not.toMatch(/db\s*\.\s*delete/);
  });

  it("les deux écrans le posent, et l'arène jamais en solo", () => {
    expect(lire("src/app/join/page.tsx")).toContain("<IdentiteDeLAppareil");
    const arene = lire("src/app/arena/[gameId]/page.tsx");
    expect(arene).toContain("<IdentiteDeLAppareil");
    expect(arene).toContain('view.kind !== "solo" && view.playerPseudo');
  });

  it("la vue expose le prénom de cet appareil", () => {
    expect(lire("src/services/game-view.service.ts")).toContain("playerPseudo");
  });
});
