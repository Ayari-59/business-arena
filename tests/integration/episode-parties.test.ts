import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Les parties d'épisodes manager sont gardées une fois, telles qu'elles ont
 * été jouées, et seulement si elles sont possibles dans leur épisode.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { effacerParties, enregistrerPartie, partiesDe } from "@/services/episode-parties.service";

const ep = EPISODES[0]!;
let manon: string;
let paul: string;

function entree(change: Record<string, unknown> = {}) {
  return {
    cle: randomUUID(),
    code: ep.code,
    niveau: "standard",
    graine: 42,
    chemin: [...ep.references[0]!.chemin],
    consultes: [[ep.etapes[0]!.sources[0]!.id], []],
    jours: 2,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "corrige", principal: ep.diagnostics[1]!.id },
    prevision: ep.prevision.min,
    confiance: 60,
    ...change,
  };
}

beforeAll(async () => {
  const [a, b] = await db
    .insert(users)
    .values([
      { email: "manon@episodes.test", displayName: "Manon" },
      { email: "paul@episodes.test", displayName: "Paul" },
    ])
    .returning({ id: users.id });
  manon = a!.id;
  paul = b!.id;
});

describe("enregistrer une partie d'épisode", () => {
  it("garde la partie, et la marque comme la première de cet épisode", async () => {
    const e = entree();
    const r = await enregistrerPartie(manon, e);
    expect(r).toMatchObject({ ok: true, premiere: true, dejaGardee: false });
    const [gardee] = await partiesDe(manon);
    expect(gardee).toMatchObject({ code: ep.code, versionModele: 1, premiere: true });
    expect(gardee!.partie).toEqual({
      graine: 42,
      chemin: e.chemin,
      consultes: e.consultes,
      jours: 2,
      diagnostic: e.diagnostic,
      reevaluation: e.reevaluation,
      prevision: e.prevision,
      confiance: 60,
      niveau: "standard",
    });
  });

  it("n'écrit pas deux fois la même partie quand le bilan est rechargé", async () => {
    const e = entree();
    const premier = await enregistrerPartie(paul, e);
    const second = await enregistrerPartie(paul, e);
    expect(second).toEqual({ ...premier, dejaGardee: true });
    expect(await partiesDe(paul)).toHaveLength(1);
  });

  it("ne marque comme première que la première partie de chaque épisode", async () => {
    const r = await enregistrerPartie(manon, entree({ graine: 7 }));
    expect(r).toMatchObject({ ok: true, premiere: false });
    const autre = EPISODES[1]!;
    const r2 = await enregistrerPartie(manon, {
      ...entree(),
      code: autre.code,
      chemin: [...autre.references[0]!.chemin],
      consultes: [],
      diagnostic: autre.diagnostics[0]!.id,
      reevaluation: { choix: "maintient", principal: null },
      prevision: autre.prevision.min,
    });
    expect(r2).toMatchObject({ ok: true, premiere: true });
    const parties = await partiesDe(manon);
    expect(parties.map((p) => [p.code, p.premiere])).toEqual([
      [ep.code, true],
      [ep.code, false],
      [autre.code, true],
    ]);
  });

  it("refuse une partie impossible dans son épisode", async () => {
    const refus = [
      entree({ code: "episode-inconnu" }),
      entree({ chemin: [0, 0] }),
      entree({ chemin: [9, 0, 0, 0, 0, 0] }),
      entree({ consultes: [["source-inventee"]] }),
      entree({ diagnostic: "invente" }),
      entree({ reevaluation: { choix: "corrige", principal: "invente" } }),
      entree({ prevision: ep.prevision.max + 1 }),
      entree({ confiance: 140 }),
      entree({ niveau: "facile" }),
      entree({ cle: "pas-une-cle" }),
      "n'importe quoi",
    ];
    for (const e of refus) {
      const r = await enregistrerPartie(paul, e);
      expect(r.ok, JSON.stringify(e).slice(0, 80)).toBe(false);
    }
    expect(await partiesDe(paul)).toHaveLength(1);
  });

  it("ne montre à chacun que ses parties, et les efface à sa demande", async () => {
    expect((await partiesDe(paul)).every((p) => p.code === ep.code)).toBe(true);
    expect(await effacerParties(manon)).toBe(3);
    expect(await partiesDe(manon)).toEqual([]);
    expect(await partiesDe(paul)).toHaveLength(1);
  });
});
