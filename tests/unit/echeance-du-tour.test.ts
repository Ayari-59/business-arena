import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { EcheanceDuTour } from "@/components/echeance-du-tour";
import {
  echeanceDuTour,
  SEUIL_DECOMPTE_MINUTES,
  SEUIL_URGENCE_MINUTES,
} from "@/config/echeance";

/**
 * L'ÉCHÉANCE SE VOIT AVANT, PAS APRÈS.
 *
 * Le planning existait et le verrou tombait au bon moment, mais
 * `playLockMessage` rend null tant que c'est jouable : l'élève découvrait la
 * date limite en étant refusé, après vingt minutes de saisie.
 */

const A = (minutes: number) => new Date(Date.UTC(2026, 8, 22, 12, 0, 0) + minutes * 60_000);
const MAINTENANT = A(0);

describe("ce qu'on dit d'une échéance", () => {
  it("donne toujours la date, en heure de Paris", () => {
    const e = echeanceDuTour(A(30), MAINTENANT);
    expect(e.absolu).toContain("septembre");
    // 12:00 UTC en septembre = 14:00 à Paris.
    expect(e.absolu).toContain("à 14:30");
  });

  it("n'écrit qu'un seul « à » : le formateur combiné en mettait déjà un", () => {
    expect(echeanceDuTour(A(30), MAINTENANT).absolu).not.toContain("à à");
  });

  it("annonce le temps restant tant qu'il compte", () => {
    expect(echeanceDuTour(A(12), MAINTENANT).restant).toBe("dans 12 minutes");
    expect(echeanceDuTour(A(90), MAINTENANT).restant).toBe("dans 1 h 30");
    expect(echeanceDuTour(A(120), MAINTENANT).restant).toBe("dans 2 h");
  });

  it("se tait au-delà du seuil : « dans 5 h 20 » ne change aucune décision", () => {
    expect(echeanceDuTour(A(SEUIL_DECOMPTE_MINUTES + 1), MAINTENANT).restant).toBeNull();
    // La date, elle, reste : c'est elle qu'on note dans l'agenda.
    expect(echeanceDuTour(A(400), MAINTENANT).absolu).toContain("septembre");
  });

  it("passe en urgence dans les dix dernières minutes, pas avant", () => {
    expect(echeanceDuTour(A(SEUIL_URGENCE_MINUTES), MAINTENANT).urgence).toBe(true);
    expect(echeanceDuTour(A(SEUIL_URGENCE_MINUTES + 1), MAINTENANT).urgence).toBe(false);
  });

  it("une échéance passée est passée, et n'est plus urgente", () => {
    const e = echeanceDuTour(A(-1), MAINTENANT);
    expect(e.depassee).toBe(true);
    expect(e.urgence).toBe(false);
    expect(e.restant).toBeNull();
  });
});

describe("le rendu serveur ne promet que ce qui ne bouge pas", () => {
  const html = renderToStaticMarkup(
    createElement(EcheanceDuTour, { closesAt: A(12).toISOString() }),
  );

  it("affiche la date, jamais le temps restant", () => {
    expect(html).toContain("à 14:12");
    // Calculé au rendu serveur, « dans 12 minutes » serait déjà faux à
    // l'affichage et ferait diverger l'hydratation.
    expect(html).not.toContain("dans 12 minutes");
  });

  it("dit ce qu'il faut faire, pas seulement l'heure", () => {
    expect(html).toContain("Validez avant");
  });

  it("la pastille d'en-tête ne porte que l'heure, pas la date entière", () => {
    const pastille = renderToStaticMarkup(
      createElement(EcheanceDuTour, { closesAt: A(30).toISOString(), compact: true }),
    );
    expect(pastille).toContain("Ferme à 14:30");
    // « Ferme lundi 21 septembre à 14:30 » tient toute la largeur d'un
    // téléphone ; la date complète reste dans l'infobulle.
    expect(pastille).not.toMatch(/>[^<]*septembre/);
    expect(pastille).toContain('title="Ce tour ferme');
  });

  it("une date illisible n'affiche rien plutôt qu'un « Invalid Date »", () => {
    expect(renderToStaticMarkup(createElement(EcheanceDuTour, { closesAt: "n'importe quoi" }))).toBe("");
  });
});

describe("branchée aux deux endroits où elle sert", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("l'en-tête de l'arène la porte, et seulement quand le tour est ouvert", () => {
    const arene = lire("src/app/arena/[gameId]/page.tsx");
    expect(arene).toContain("view.playLock.playable && view.playLock.closesAt");
    expect(arene).toContain("<EcheanceDuTour");
  });

  it("le formulaire la reçoit et la montre contre le bouton « Valider »", () => {
    const arene = lire("src/app/arena/[gameId]/page.tsx");
    expect(arene).toContain("echeance={view.playLock.closesAt}");
    const form = lire("src/components/decision-form.tsx");
    // Jamais en même temps que le verrou : celui-ci dit déjà qu'il est trop tard.
    expect(form).toContain("{echeance && !verrou ? <EcheanceDuTour");
  });
});
