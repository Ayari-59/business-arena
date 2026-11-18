import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LE PILOTAGE SE RECHARGE QUAND UN BROUILLON D'ÉQUIPE CHANGE
 * (`components/round-status-poller.tsx`, endpoint « submissions »).
 *
 * Ce test fait tourner le VRAI sondeur, pas une copie de sa logique : les deux
 * crochets de React qu'il emploie (`useRef`, `useEffect`) sont remplacés par des
 * versions qui exécutent l'effet tout de suite, `useRouter` par un routeur dont on
 * compte les `refresh`, et `fetch` rend ce que la route `submissions` rendrait.
 * Les minuteurs sont simulés : un sondage part toutes les 12 s.
 */

const effets: Array<() => void | (() => void)> = [];
const refresh = vi.fn();

vi.mock("react", () => ({
  useRef: <T,>(v: T) => ({ current: v }),
  useEffect: (f: () => void | (() => void)) => {
    effets.push(f);
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { RoundStatusPoller } from "@/components/round-status-poller";
import { CADENCE_DE_SEANCE_MS } from "@/lib/cadence-du-sondage";

type Reponse = Record<string, unknown>;
let reponse: Reponse;
const fetchMock = vi.fn(async () => ({ ok: true, json: async () => reponse }) as Response);
let nettoyages: Array<() => void> = [];

const T0 = "2026-11-18T09:00:00.000Z";
const T1 = "2026-11-18T09:00:20.000Z";

function sondage(p: Partial<Reponse> = {}): Reponse {
  return {
    currentRound: 1,
    roundStatus: "open",
    submittedCount: 0,
    totalHumanTeams: 2,
    dernierTourRevele: null,
    derniereDecision: null,
    dernierBrouillon: T0,
    ...p,
  };
}

/** Monte le sondeur du pilotage, tel que la page le rend. */
function monter(props: { dernierBrouillon?: string | null; submittedCount?: number; mur?: boolean } = {}) {
  effets.length = 0;
  RoundStatusPoller({
    gameId: "partie",
    currentRound: 1,
    roundStatus: "open",
    endpoint: "submissions",
    submittedCount: props.submittedCount ?? 0,
    derniereDecision: null,
    ...(props.mur ? { insistant: true } : { dernierBrouillon: props.dernierBrouillon === undefined ? T0 : props.dernierBrouillon }),
  } as Parameters<typeof RoundStatusPoller>[0]);
  for (const f of effets) {
    const n = f();
    if (typeof n === "function") nettoyages.push(n);
  }
}

const unSondage = () => vi.advanceTimersByTimeAsync(CADENCE_DE_SEANCE_MS);

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  reponse = sondage();
});

afterEach(() => {
  for (const n of nettoyages) n();
  nettoyages = [];
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("le sondeur du pilotage et les brouillons d'équipe", () => {
  it("ne recharge rien tant que l'heure du dernier brouillon ne change pas", async () => {
    monter();
    await unSondage();
    await unSondage();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/games/partie/submissions");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("recharge la page quand une équipe enregistre un brouillon (l'heure change)", async () => {
    monter();
    await unSondage();
    expect(refresh).not.toHaveBeenCalled();
    reponse = sondage({ dernierBrouillon: T1 });
    await unSondage();
    expect(refresh).toHaveBeenCalledTimes(1);
    // Le sondage suivant, sans nouveau brouillon, ne recharge plus.
    await unSondage();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("recharge quand le premier brouillon du tour apparaît, la page n'en ayant aucun", async () => {
    monter({ dernierBrouillon: null });
    reponse = sondage({ dernierBrouillon: T1 });
    await unSondage();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("un brouillon enregistré avant le premier sondage n'échappe pas au pilotage", async () => {
    // La page a rendu T0 ; l'équipe enregistre avant les 12 premières secondes.
    monter({ dernierBrouillon: T0 });
    reponse = sondage({ dernierBrouillon: T1 });
    await unSondage();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("garde la cadence de séance : un sondage toutes les 12 s, pas plus vite", async () => {
    monter();
    reponse = sondage({ dernierBrouillon: T1 });
    await vi.advanceTimersByTimeAsync(CADENCE_DE_SEANCE_MS - 1);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(CADENCE_DE_SEANCE_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("s'arrête comme avant une fois toutes les équipes validées", async () => {
    monter({ submittedCount: 2, dernierBrouillon: null });
    reponse = sondage({ submittedCount: 2, dernierBrouillon: null });
    await unSondage();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await unSondage();
    await unSondage();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("le mur de la classe, qui sonde la même route sans montrer les brouillons, ne se recharge pas pour eux", async () => {
    monter({ mur: true });
    await unSondage();
    reponse = sondage({ dernierBrouillon: T1 });
    await unSondage();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refresh).not.toHaveBeenCalled();
  });
});
