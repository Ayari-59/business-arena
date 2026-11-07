import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `ecrireEnUnBloc` (src/db/en-un-bloc.ts) : avec le pilote HTTP de Neon, qui a `batch` et
 * refuse `transaction`, les requêtes partent en UN lot ; sans `batch` (node-postgres, PGlite),
 * elles s'exécutent dans une transaction. Le pilote est simulé : c'est le chemin de la
 * production que les tests d'intégration, sur PGlite, ne peuvent pas prendre.
 */
const pilote = vi.hoisted(() => ({
  batch: undefined as undefined | ((q: unknown[]) => Promise<unknown>),
  transaction: vi.fn(async () => {
    throw new Error("No transactions support in neon-http driver");
  }),
}));
vi.mock("@/db", () => ({ db: pilote }));

import { ecrireEnUnBloc } from "@/db/en-un-bloc";

describe("écrire en un bloc", () => {
  beforeEach(() => {
    pilote.transaction.mockClear();
  });

  it("sous Neon, un seul lot, jamais de transaction", async () => {
    const lot = vi.fn(async () => []);
    pilote.batch = lot;
    await ecrireEnUnBloc(() => ["effacer", "inserer"] as never);
    expect(lot).toHaveBeenCalledTimes(1);
    expect(lot).toHaveBeenCalledWith(["effacer", "inserer"]);
    expect(pilote.transaction).not.toHaveBeenCalled();
  });

  it("sous Neon, un lot vide ne part pas", async () => {
    const lot = vi.fn(async () => []);
    pilote.batch = lot;
    await ecrireEnUnBloc(() => []);
    expect(lot).not.toHaveBeenCalled();
  });

  it("sans lot, une transaction qui reçoit le client de la transaction", async () => {
    pilote.batch = undefined;
    const tx = { nom: "tx" };
    const ordre: string[] = [];
    pilote.transaction.mockImplementationOnce((async (f: (t: unknown) => Promise<void>) => f(tx)) as never);
    await ecrireEnUnBloc((client) => {
      expect(client).toBe(tx);
      return [Promise.resolve().then(() => ordre.push("effacer")), Promise.resolve().then(() => ordre.push("inserer"))] as never;
    });
    expect(pilote.transaction).toHaveBeenCalledTimes(1);
    expect(ordre).toEqual(["effacer", "inserer"]);
  });
});
