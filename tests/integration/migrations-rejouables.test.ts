import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import {
  MIGRATIONS_HISTORIQUES,
  instructionsDe,
  tagsSurDisque,
} from "../helpers/migrations";

/**
 * REJOUER LES MIGRATIONS, POUR DE VRAI.
 *
 * Le test d'architecture lit la FORME des fichiers : il cherche des
 * `IF NOT EXISTS` et des blocs DO. C'est une heuristique, et une heuristique se
 * trompe — la première version cherchait ses motifs jusque dans les
 * commentaires et accusait une migration parfaitement saine.
 *
 * Celui-ci ne lit rien : il EXÉCUTE. Sur un Postgres embarqué, il applique
 * toutes les migrations comme le ferait un environnement neuf, puis rejoue
 * celles qui doivent l'être — exactement ce que fait le déploiement quand on
 * remet au journal une migration déjà appliquée en production. Si une seule
 * instruction ne supporte pas d'être rejouée, ce test tombe, et le
 * déploiement aurait échoué de la même façon.
 *
 * C'est la garantie qui manquait le 13/09/2026 : ce jour-là, seule l'analyse du
 * texte disait que l'opération était sûre.
 */

async function appliquer(client: PGlite, tags: string[]): Promise<void> {
  for (const tag of tags) {
    for (const instruction of instructionsDe(tag)) {
      await client.exec(instruction);
    }
  }
}

describe("les migrations rejouables se rejouent vraiment", () => {
  it("un environnement neuf, puis une seconde passe sur les rejouables", async () => {
    const client = new PGlite();
    try {
      const tous = tagsSurDisque();
      // 1. L'environnement neuf : toutes les migrations, dans l'ordre.
      await appliquer(client, tous);

      // 2. La production : on rejoue celles que le journal peut redemander.
      const rejouables = tous.filter((t) => !MIGRATIONS_HISTORIQUES.has(t));
      expect(rejouables.length).toBeGreaterThan(0);
      await appliquer(client, rejouables);

      // 3. Et une troisième passe : rejouable veut dire rejouable, pas
      //    « supporte exactement une répétition ».
      await appliquer(client, rejouables);
    } finally {
      await client.close();
    }
  }, 120_000);

  it("les migrations de l'historique existent toutes sur disque", () => {
    // Une exemption qui ne désigne rien laisserait passer une migration
    // réelle sans que personne ne le voie.
    const surDisque = new Set(tagsSurDisque());
    for (const tag of MIGRATIONS_HISTORIQUES) {
      expect(surDisque.has(tag), `${tag}.sql est absent`).toBe(true);
    }
  });
});
