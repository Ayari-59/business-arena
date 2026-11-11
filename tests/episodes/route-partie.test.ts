import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LA ROUTE D'UN GESTE REFAIT LE CONTRÔLE D'ACCÈS À CHAQUE FOIS (audit du 10 novembre 2026, P1-1).
 *
 * Le contrôle de la page ne protégeait que l'affichage. Désormais rien d'un épisode ne part sans
 * le droit de le jouer : la route relit l'accès (services/acces.service.ts) à chaque geste, ne lit
 * la base que pour lui, et refuse un épisode ou un niveau fermé sans rien en dire.
 */

const acces = vi.hoisted(() => ({
  courant: { licence: false, source: null } as {
    licence: boolean;
    source: "cohorte" | "compte" | null;
    episodes?: readonly string[];
    demos?: readonly string[];
  },
  appels: 0,
}));

vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => null }));
vi.mock("@/lib/session", () => ({ getSession: async () => null }));
vi.mock("@/services/acces.service", async () => {
  const regles = await import("@/config/episodes/demos");
  return {
    accesAuxEpisodes: async () => {
      acces.appels += 1;
      return acces.courant;
    },
    niveauxDeLEpisode: regles.niveauxDeLEpisode,
    licencePourLEpisode: regles.licencePourLEpisode,
  };
});

import { POST } from "@/app/api/episodes/partie/route";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { estUneDemo } from "@/config/episodes/demos";

const DEMO = "client-qui-s-en-va";
const PAYANT = "concurrent-a-racheter";

const appeler = (corps: unknown) =>
  POST(new Request("http://localhost/api/episodes/partie", { method: "POST", body: typeof corps === "string" ? corps : JSON.stringify(corps) }));

const commencer = (code: string, niveau = "decouverte") => ({
  code,
  geste: "commencer",
  niveau,
  graine: 7,
  decisions: [],
  consultes: [],
});

beforeEach(() => {
  acces.courant = { licence: false, source: null };
  acces.appels = 0;
});

describe("POST /api/episodes/partie", () => {
  it("une démonstration se joue sans compte, en Découverte, par le même chemin", async () => {
    expect(estUneDemo(DEMO)).toBe(true);
    const r = await appeler(commencer(DEMO));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    const vue = await r.json();
    expect(vue.etape.indice).toBe(0);
    expect(vue.etape.messages.length).toBeGreaterThan(0);
    expect(vue.consequence).toBeNull();
    expect(vue.bilan).toBeNull();
    expect(acces.appels).toBe(1);
  });

  it("sans licence, une démonstration ne se joue pas à un autre niveau", async () => {
    const r = await appeler(commencer(DEMO, "standard"));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ refus: "licence" });
  });

  it("sans licence, un épisode payant ne dit rien de lui", async () => {
    expect(estUneDemo(PAYANT)).toBe(false);
    const ep = episodeParCode(PAYANT)!;
    for (const niveau of ["decouverte", "standard", "expert"]) {
      const r = await appeler(commencer(PAYANT, niveau));
      expect(r.status).toBe(403);
      const corps = await r.text();
      expect(corps).toBe(JSON.stringify({ refus: "licence" }));
      expect(corps).not.toContain(ep.etapes[0]!.titre);
    }
  });

  it("une licence de cohorte limitée à d'autres épisodes ne l'ouvre pas ; une licence qui le couvre, oui, à tous les niveaux", async () => {
    acces.courant = { licence: true, source: "cohorte", episodes: ["trimestre-qui-derape"] };
    expect((await appeler(commencer(PAYANT, "standard"))).status).toBe(403);
    acces.courant = { licence: true, source: "compte" };
    for (const niveau of ["decouverte", "standard", "expert"]) {
      expect((await appeler(commencer(PAYANT, niveau))).status).toBe(200);
    }
  });

  it("les démonstrations réglées dans /admin/offres sont celles qui s'ouvrent", async () => {
    acces.courant = { licence: false, source: null, demos: [PAYANT] };
    expect((await appeler(commencer(PAYANT))).status).toBe(200);
    expect((await appeler(commencer(DEMO))).status).toBe(403);
  });

  it("une demande qui ne tient pas dans l'épisode est refusée", async () => {
    const ep = episodeParCode(DEMO)!;
    const base = { ...commencer(DEMO), geste: "verifier" };
    const aide = ep.etapes[0]!.sources.find((s) => s.nature === "aide");
    const refus = [
      { ...base, decisions: [ep.etapes[0]!.options.length] },
      { ...base, consultes: [["une-source-qui-n-existe-pas"]] },
      { ...base, consultes: [[], [ep.etapes[1]!.sources[0]!.id]] },
      { ...base, consultes: [[ep.etapes[0]!.sources[0]!.id, ep.etapes[0]!.sources[0]!.id]] },
    ];
    for (const corps of refus) {
      const r = await appeler(corps);
      expect(r.status, JSON.stringify(corps)).toBe(400);
    }
    // En Expert : pas de conseil d'un proche, une demi-journée au-delà des jours sans perte, une
    // seule vérification aux décisions suivantes.
    acces.courant = { licence: true, source: "compte" };
    const expert = { ...base, niveau: "expert" };
    if (aide) expect((await appeler({ ...expert, consultes: [[aide.id]] })).status).toBe(400);
    const sansAide = ep.etapes[0]!.sources.filter((s) => s.nature !== "aide").map((s) => s.id);
    expect((await appeler({ ...expert, consultes: [sansAide] })).status).toBe(400);
    const deux = ep.etapes[1]!.sources.filter((s) => s.nature !== "aide").slice(0, 2).map((s) => s.id);
    expect((await appeler({ ...expert, decisions: [0], consultes: [[], deux] })).status).toBe(400);
    expect((await appeler({ ...expert, decisions: [0], consultes: [[], deux.slice(0, 1)] })).status).toBe(200);
  });

  it("un corps illisible, un épisode inconnu", async () => {
    expect((await appeler("{pas du json")).status).toBe(400);
    expect((await appeler({ code: DEMO })).status).toBe(400);
    expect((await appeler(commencer("un-episode-qui-n-existe-pas"))).status).toBe(404);
  });

  it("la conséquence ne part qu'après la décision, le bilan qu'à la fin", async () => {
    const ep = episodeParCode(DEMO)!;
    const n = ep.etapes.length;
    let decisions: number[] = [];
    for (let i = 0; i < n; i += 1) {
      decisions = [...decisions, 0];
      const fin =
        i === n - 1
          ? { diagnostic: ep.diagnostics[0]!.id, reevaluation: { choix: "maintient", principal: null }, prevision: ep.prevision.min, confiance: 60 }
          : null;
      const r = await appeler({ ...commencer(DEMO), geste: "valider", decisions, fin });
      expect(r.status).toBe(200);
      const vue = await r.json();
      expect(vue.consequence.indice).toBe(i);
      expect(vue.bilan === null).toBe(i < n - 1);
    }
  });
});
