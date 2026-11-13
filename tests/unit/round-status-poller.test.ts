import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASE_MS,
  CADENCE_DE_SEANCE_MS,
  DUREE_DE_SEANCE_MS,
  MAX_MS,
  prochainDelai,
  requetesParMinute,
} from "@/lib/cadence-du-sondage";

/**
 * Tests for the RoundStatusPoller polling logic.
 *
 * The component is a React client component. We extract and test the core
 * behavioral contracts here without React rendering:
 * 1. Triggers refresh when data changes
 * 2. No refresh when data is unchanged
 * 3. Pauses when the tab is hidden
 * 4. Fetches immediately on visibility return
 * 5. No concurrent fetches
 * 6. Silent on network errors
 */

function createPollerLogic(opts: {
  endpoint: string;
  initialState: { currentRound: number; roundStatus: string; submittedCount?: number };
  onRefresh: () => void;
  isHidden?: () => boolean;
}) {
  let state = { ...opts.initialState };
  let fetching = false;
  const fetchMock = vi.fn<() => Promise<Response>>();
  const isHidden = opts.isHidden ?? (() => false);

  async function poll() {
    if (isHidden()) return;
    if (fetching) return;
    fetching = true;
    try {
      const res = await fetchMock();
      if (!res.ok) return;
      const data = await res.json();

      let changed = false;
      if (data.currentRound !== state.currentRound) changed = true;
      if (data.roundStatus !== state.roundStatus) changed = true;
      if (
        opts.endpoint === "submissions" &&
        typeof data.submittedCount === "number" &&
        data.submittedCount !== state.submittedCount
      ) {
        changed = true;
      }

      if (changed) {
        state = { ...data };
        opts.onRefresh();
      }
    } catch {
      // silent
    } finally {
      fetching = false;
    }
  }

  return { poll, fetchMock };
}

function mockResponse(data: Record<string, unknown>, ok = true): Response {
  return { ok, json: () => Promise.resolve(data) } as Response;
}

describe("RoundStatusPoller logic", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("triggers refresh when currentRound changes", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 2, roundStatus: "open", gameStatus: "running" }),
    );
    await poll();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("triggers refresh when roundStatus changes", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 1, roundStatus: "resolved", gameStatus: "running" }),
    );
    await poll();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("triggers refresh when submittedCount changes (submissions endpoint)", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "submissions",
      initialState: { currentRound: 1, roundStatus: "open", submittedCount: 0 },
      onRefresh,
    });
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 1, roundStatus: "open", submittedCount: 1, totalHumanTeams: 3 }),
    );
    await poll();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("does not trigger refresh when nothing changes", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 1, roundStatus: "open", gameStatus: "running" }),
    );
    await poll();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("does not poll when tab is hidden", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
      isHidden: () => true,
    });
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 2, roundStatus: "open", gameStatus: "running" }),
    );
    await poll();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("fetches immediately when tab becomes visible", async () => {
    let hidden = true;
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
      isHidden: () => hidden,
    });

    fetchMock.mockResolvedValue(
      mockResponse({ currentRound: 2, roundStatus: "open", gameStatus: "running" }),
    );

    await poll();
    expect(fetchMock).not.toHaveBeenCalled();

    hidden = false;
    await poll();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("silently ignores network errors", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    await poll();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("silently ignores non-OK responses", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });
    fetchMock.mockResolvedValueOnce(mockResponse({}, false));
    await poll();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("does not trigger multiple concurrent fetches", async () => {
    const onRefresh = vi.fn();
    const { poll, fetchMock } = createPollerLogic({
      endpoint: "round-status",
      initialState: { currentRound: 1, roundStatus: "open" },
      onRefresh,
    });

    let resolveFirst!: (v: Response) => void;
    const firstFetch = new Promise<Response>((r) => { resolveFirst = r; });
    fetchMock.mockReturnValueOnce(firstFetch);
    fetchMock.mockResolvedValueOnce(
      mockResponse({ currentRound: 2, roundStatus: "open", gameStatus: "running" }),
    );

    const p1 = poll();
    const p2 = poll();

    resolveFirst(mockResponse({ currentRound: 1, roundStatus: "open", gameStatus: "running" }));
    await p1;
    await p2;

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

/**
 * LA CADENCE EN SÉANCE (séance d'essai, P1-2). Le mur disait « 2 / 4 » quand
 * le pilotage comptait 3 sur 4, et l'élève voyait ses résultats 42 s à 3 min
 * après la clôture : le sondeur partait à 60 s et reculait jusqu'à 180 s.
 */

describe("la cadence du sondeur", () => {
  it("sonde toutes les 10 à 15 s pendant une séance", () => {
    expect(CADENCE_DE_SEANCE_MS).toBeGreaterThanOrEqual(10_000);
    expect(CADENCE_DE_SEANCE_MS).toBeLessThanOrEqual(15_000);
  });

  it("ne recule pas pendant une séance, même quand rien ne bouge", () => {
    let delai = CADENCE_DE_SEANCE_MS;
    let ecoule = 0;
    // 20 minutes d'attente sans rien de neuf : un tour entier.
    while (ecoule < 20 * 60_000) {
      delai = prochainDelai({ delai, change: false, depuisLeDernierMouvementMs: ecoule });
      expect(delai).toBe(CADENCE_DE_SEANCE_MS);
      ecoule += delai;
    }
  });

  it("ralentit jusqu'à 3 min pour un onglet oublié, une fois la séance finie", () => {
    let delai = CADENCE_DE_SEANCE_MS;
    const vus: number[] = [];
    for (let i = 0; i < 8; i++) {
      delai = prochainDelai({ delai, change: false, depuisLeDernierMouvementMs: DUREE_DE_SEANCE_MS + i });
      vus.push(delai);
    }
    expect(vus[0]).toBe(BASE_MS);
    expect(Math.max(...vus)).toBe(MAX_MS);
  });

  it("repart à la cadence de séance dès que quelque chose bouge", () => {
    expect(prochainDelai({ delai: MAX_MS, change: true, depuisLeDernierMouvementMs: 0 })).toBe(CADENCE_DE_SEANCE_MS);
  });

  it("garde une charge raisonnable pour une classe de 35", () => {
    // 35 téléphones, le pilotage et le mur, tous visibles : 37 pages.
    const parMinute = requetesParMinute(37);
    expect(parMinute).toBe(185);
    // Soit environ 3 requêtes par seconde, et rien pour un onglet caché.
    expect(parMinute / 60).toBeLessThan(3.5);
  });

  const source = readFileSync(join(process.cwd(), "src/components/round-status-poller.tsx"), "utf8");

  it("le sondeur suit cette cadence, et ne sonde pas un onglet caché", () => {
    expect(source).toContain("prochainDelai({");
    expect(source).toContain("let delay = CADENCE_DE_SEANCE_MS;");
    expect(source).toMatch(/if \(document\.hidden\) return;/);
    expect(source).not.toMatch(/delay \* 1\.5/);
  });

  it("une révélation recharge la page qui l'attend", () => {
    expect(source).toContain("data.dernierTourRevele");
    for (const route of ["round-status", "submissions"]) {
      const r = readFileSync(join(process.cwd(), `src/app/api/games/[gameId]/${route}/route.ts`), "utf8");
      expect(r, route).toContain("dernierTourRevele,");
    }
  });
});
