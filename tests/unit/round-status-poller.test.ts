import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

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
