import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mentionDeValidation } from "@/config/validation-du-tour";

/**
 * QUI A VALIDÉ, ET QUAND.
 *
 * `decisions.validated_by` et `decisions.validated_at` étaient écrits à chaque
 * envoi et relus NULLE PART. Une équipe de trois élèves sur trois écrans
 * s'écrasait donc en silence, et l'enseignant lisait « ✓ validées » sans
 * savoir par qui. La donnée existait : il ne manquait que la phrase.
 */

const QUAND = new Date("2026-09-22T12:32:00Z"); // 14:32 à Paris

describe("la mention de validation", () => {
  it("nomme la personne et l'heure", () => {
    expect(mentionDeValidation("Léa", QUAND)).toBe("Validé par Léa à 14:32");
  });

  it("se passe du nom quand on ne l'a pas, sans « par null »", () => {
    expect(mentionDeValidation(null, QUAND)).toBe("Validé à 14:32");
    expect(mentionDeValidation("   ", QUAND)).toBe("Validé à 14:32");
  });

  it("donne une heure absolue, qui ne vieillit pas entre le serveur et l'écran", () => {
    // Un « il y a 4 minutes » rendu par le serveur serait déjà faux à
    // l'affichage, et demanderait un rafraîchissement pour rien.
    const source = readFileSync(join(process.cwd(), "src/config/validation-du-tour.ts"), "utf8");
    expect(source).toContain('timeZone: "Europe/Paris"');
    expect(source).not.toContain("Date.now()");
  });
});

describe("la même phrase des deux côtés", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("l'équipe la voit au-dessus de ses champs, avec ce qu'elle implique", () => {
    const arene = lire("src/app/arena/[gameId]/page.tsx");
    expect(arene).toContain("mentionDeValidation");
    expect(arene).toContain("view.pendingDecisionsPar");
    // L'écrasement est dit : c'est le risque réel de deux écrans pour une équipe.
    expect(arene).toContain("votre envoi remplacera le sien");
  });

  it("l'enseignant la voit dans la colonne « Décisions »", () => {
    const prof = lire("src/app/teacher/games/[gameId]/page.tsx");
    expect(prof).toContain("mentionDeValidation");
    expect(prof).toContain("t.validation");
  });

  it("les deux vues lisent les colonnes déjà écrites, sans migration", () => {
    expect(lire("src/services/game-view.service.ts")).toContain("pendingDecisionRow.validatedAt");
    expect(lire("src/services/game.service.ts")).toContain("d.validatedBy");
    // La colonne existait bien avant : rien n'est ajouté au schéma.
    expect(lire("src/db/schema/game.ts")).toContain('validatedBy: uuid("validated_by")');
  });

  it("jamais en solo : l'équipe s'y résume au joueur", () => {
    expect(lire("src/services/game-view.service.ts")).toContain('kindDeLaPartie !== "solo"');
  });
});
