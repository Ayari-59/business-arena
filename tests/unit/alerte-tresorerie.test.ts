import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlerteTresorerie } from "@/components/alerte-tresorerie";
import type { GameView } from "@/services/game-view.service";

/**
 * UNE ÉQUIPE GELÉE NE VOYAIT RIEN.
 *
 * La cessation de paiements se disait à deux endroits : une ligne rouge dans
 * l'onglet Finance d'une carte de tour — il fallait ouvrir l'onglet —, et le
 * statut « défaillante » dans le classement, que l'animateur révèle quand il
 * le décide. Une entreprise à l'arrêt pouvait donc continuer à recevoir des
 * décisions que le moteur ignorait en silence.
 *
 * Ce que ce test garde : l'alerte dit le montant qui manque et le nombre de
 * tours restants. Sans le montant, l'élève ne sait pas quoi viser ; sans le
 * compte à rebours, il ne sait pas qu'il y en a un.
 */

type Alerte = NonNullable<GameView["alerteTresorerie"]>;

const alerte = (over: Partial<Alerte> = {}): Alerte => ({
  crise: true,
  defaillante: false,
  toursConsecutifs: 1,
  toursAvantDefaillance: 2,
  tresorerieNette: -76000,
  plafondDecouvert: 30000,
  manque: 46000,
  financementObligatoire: true,
  ...over,
});

const rendu = (a: Alerte) => renderToStaticMarkup(createElement(AlerteTresorerie, { alerte: a }));

describe("AlerteTresorerie", () => {
  it("en crise, elle dit ce qui manque et ce qui arrive si rien ne change", () => {
    const html = rendu(alerte());
    expect(html).toMatch(/46\s000\s€/);
    expect(html).toMatch(/30\s000\s€/);
    // Un compte à rebours qu'on ne voit pas n'en est pas un.
    expect(html).toContain("Encore un tour");
    // Et les leviers sont nommés : on ne demande pas de deviner.
    expect(html).toContain("Emprunt");
    expect(html).toContain("apport des associés");
  });

  it("le compte à rebours s'accorde avec le nombre de tours restants", () => {
    const html = rendu(alerte({ toursConsecutifs: 1, toursAvantDefaillance: 4 }));
    expect(html).toContain("Encore 3 tours");
  });

  it("défaillante, elle dit l'arrêt et le seul chemin qui en sort", () => {
    const html = rendu(alerte({ defaillante: true, toursConsecutifs: 2 }));
    expect(html).toContain("cessation de paiements");
    expect(html).toContain("ne produit plus");
    // Le montant du retour à flot, pas seulement le constat de l'arrêt.
    expect(html).toMatch(/46\s000\s€/);
    expect(html).not.toContain("Encore");
  });

  it("c'est une alerte, au sens des lecteurs d'écran", () => {
    // Un bandeau que seule la couleur signale n'existe pas pour tout le monde.
    expect(rendu(alerte())).toContain('role="alert"');
    expect(rendu(alerte({ defaillante: true }))).toContain('role="alert"');
  });
});
