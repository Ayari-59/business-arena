import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * OÙ LES ÉLÈVES CALENT — la mesure, sur une vraie base.
 *
 * Cette vue sert la première fois qu'on lâche le jeu devant une classe. Elle ne
 * peut donc pas se permettre d'être fausse au moment précis où on la regarde :
 * après la clôture d'un tour.
 *
 * Le piège est là, et il a failli passer. Une équipe qui valide passe en
 * `validated` ; à la CLÔTURE, sa ligne devient `locked`. Une première version
 * ne comptait que `validated` : elle affichait zéro participation sur tous les
 * tours clos, c'est-à-dire dans tous les cas qu'elle sert à regarder. Ce test
 * joue de vrais tours et les clôt, comme une séance.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { getObservationSeance } from "@/services/observation.service";
import type { RoundDecisions } from "@/engine/types";

/** Une décision où le joueur a bougé le prix et le volume : il a décidé. */
const DECIDE: RoundDecisions = {
  price: 62,
  productionPlan: 5200,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let prof: string;
let autreProf: string;

beforeAll(async () => {
  const lignes = await db
    .insert(users)
    .values([
      { email: "observation@test.local", displayName: "Mme Observation" },
      { email: "collegue@test.local", displayName: "M. Collègue" },
    ])
    .returning({ id: users.id });
  prof = lignes[0]!.id;
  autreProf = lignes[1]!.id;
});

describe("observation de séance", () => {
  it("compte la participation des tours CLOS, pas seulement des tours ouverts", async () => {
    const gameId = await createSoloGame(prof, "quarter", 3);
    await resolveCurrentRound({ gameId, userId: prof, playerDecisions: DECIDE });
    await resolveCurrentRound({ gameId, userId: prof, playerDecisions: DECIDE });

    const seance = await getObservationSeance(gameId, prof);
    expect(seance).not.toBeNull();
    expect(seance!.equipesHumaines).toBe(1);

    const clos = seance!.tours.filter((t) => t.clos);
    expect(clos.length).toBe(2);
    // LE CŒUR DU TEST : après clôture, la ligne est `locked` et doit compter.
    for (const tour of clos) {
      expect(tour.validees, `tour ${tour.index}`).toBe(1);
      expect(tour.reconduites, `tour ${tour.index}`).toBe(0);
    }
  });

  it("distingue celui qui décide de celui qui valide la valeur proposée", async () => {
    const gameId = await createSoloGame(prof, "quarter", 3);
    // Le tour 1 avec des valeurs choisies, le tour 2 en reprenant à l'identique
    // ce que le formulaire proposait — c'est-à-dire le tour précédent.
    await resolveCurrentRound({ gameId, userId: prof, playerDecisions: DECIDE });
    await resolveCurrentRound({ gameId, userId: prof, playerDecisions: DECIDE });

    const seance = await getObservationSeance(gameId, prof);
    const [tour1, tour2] = seance!.tours;
    // Au tour 1, les valeurs proposées sont celles du secteur : le joueur les a
    // changées. Au tour 2, la proposition EST le tour précédent, repris tel
    // quel : c'est un clic, pas une décision.
    expect(tour1!.parDefaut).toBe(0);
    expect(tour2!.parDefaut).toBe(1);
  });

  it("ne rend rien pour la partie d'un collègue", async () => {
    // La garde du reste de l'espace enseignant : on ne lit jamais la classe
    // d'un autre, même en connaissant l'identifiant de sa partie.
    const gameId = await createSoloGame(prof, "quarter", 3);
    await resolveCurrentRound({ gameId, userId: prof, playerDecisions: DECIDE });

    expect(await getObservationSeance(gameId, autreProf)).toBeNull();
    expect(await getObservationSeance(gameId, prof)).not.toBeNull();
  });

  it("une partie sans tour clos ne raconte rien plutôt que de mentir", async () => {
    const gameId = await createSoloGame(prof, "quarter", 3);
    const seance = await getObservationSeance(gameId, prof);
    expect(seance!.tours.every((t) => !t.clos)).toBe(true);
    expect(seance!.decrochage).toBeNull();
    // Aucun tour clos : aucune minute mesurable, et surtout aucun chiffre
    // inventé à zéro qui ferait croire à un décrochage.
    expect(seance!.tours.every((t) => t.validees === 0)).toBe(true);
  });
});
