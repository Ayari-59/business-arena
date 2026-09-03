import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXPLICATIONS_CONCOURS,
  derouleConcours,
  etapeCourante,
  messageDejaInscrit,
} from "@/config/concours";
import { CompetitionSettings, CompetitionSteps } from "@/components/competition-steps";

/**
 * LE CONCOURS S'EXPLIQUE, ET SE RETROUVE.
 *
 * Constaté en production : la page enseignant d'un concours n'affichait ni
 * ses réglages ni où l'on en est, et ne ramenait pas à la liste ; /compete
 * demandait un code sans dire ce qu'est un concours ; un joueur déjà inscrit
 * qui ressaisissait le code était redirigé sans un mot.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
}));
vi.mock("@/lib/guest", () => ({
  getOrCreateGuestUserId: vi.fn(async () => "invite-1"),
  getGuestUserId: vi.fn(async () => "invite-1"),
}));
vi.mock("@/services/competition.service", () => ({
  joinCompetition: vi.fn(),
}));

const { joinCompetition } = await import("@/services/competition.service");
const { joinCompetitionAction } = await import("@/app/compete/actions");
const { CompetitionJoinForm } = await import("@/components/competition-join-form");
const { default: CompetePage } = await import("@/app/compete/page");

const REGLES = { periodicity: "quarter" as const, groupSize: 3, advancePerGroup: 1 };

function concours(partiel: Partial<Parameters<typeof derouleConcours>[0]> = {}) {
  return {
    status: "registration",
    joinCode: "R4KT7B",
    entries: [{}, {}, {}, {}],
    stages: [],
    rules: REGLES,
    ...partiel,
  };
}

beforeEach(() => {
  vi.mocked(joinCompetition).mockReset();
});

describe("le déroulé d'un concours", () => {
  it("l'étape courante suit le statut et les phases créées", () => {
    expect(etapeCourante({ status: "registration", stages: [] })).toBe(0);
    expect(etapeCourante({ status: "running", stages: [{ kind: "qualification", games: [] }] })).toBe(1);
    expect(
      etapeCourante({
        status: "running",
        stages: [{ kind: "qualification", games: [] }, { kind: "final", games: [] }],
      }),
    ).toBe(2);
    expect(etapeCourante({ status: "finished", stages: [] })).toBe(3);
  });

  it("quatre étapes, détaillées avec les réglages du concours", () => {
    const d = derouleConcours(concours());
    expect(d.etapes.map((e) => e.nom)).toEqual(["Inscriptions", "Qualifications", "Finale", "Podium"]);
    expect(d.etapes.map((e) => e.etat)).toEqual(["courante", "a_venir", "a_venir", "a_venir"]);
    expect(d.etapes[0]!.detail).toBe("4 équipes inscrites avec le code R4KT7B.");
    expect(d.etapes[1]!.detail).toBe(
      "Des groupes de 3 équipes tirés au sort, 1 qualifié par groupe au score BPI.",
    );
    const enQualif = derouleConcours(
      concours({ status: "running", stages: [{ kind: "qualification", games: [{}, {}] }] }),
    );
    expect(enQualif.etapes.map((e) => e.etat)).toEqual(["passee", "courante", "a_venir", "a_venir"]);
    expect(enQualif.etapes[1]!.detail).toMatch(/^2 groupes de 3 équipes/);
  });
});

describe("la page enseignant du concours", () => {
  it("le bloc Réglages relit ce qui a été choisi à la création", () => {
    const html = renderToStaticMarkup(
      createElement(CompetitionSettings, { rules: REGLES, joinCode: "R4KT7B" }),
    );
    expect(html).toContain("Réglages");
    expect(html).toContain("R4KT7B");
    expect(html).toContain("Un trimestre par tour");
    expect(html).toContain("3 équipes par partie de qualification");
    expect(html).toContain("1 par groupe → finale");
  });

  it("le bloc Déroulé met l'étape en cours en avant", () => {
    const html = renderToStaticMarkup(
      createElement(CompetitionSteps, {
        concours: concours({ status: "running", stages: [{ kind: "qualification", games: [{}] }] }),
      }),
    );
    expect(html).toContain("Déroulé");
    expect(html.match(/<li /g)?.length).toBe(4);
    expect(html.match(/aria-current="step"/g)?.length).toBe(1);
    expect(html).toMatch(/aria-current="step"[^>]*data-etat="courante"[^>]*>.*?Qualifications · en cours/);
    expect(html).toContain("✓ Inscriptions");
  });

  it("la page porte les deux blocs et le lien de retour", () => {
    const source = readFileSync("src/app/teacher/competitions/[competitionId]/page.tsx", "utf8");
    expect(source).toContain("<CompetitionSettings");
    expect(source).toContain("<CompetitionSteps");
    expect(source).toContain("← Mes parties et concours");
    expect(source).toMatch(/href="\/teacher"/);
  });
});

describe("/compete explique le concours", () => {
  it("cinq lignes et un lien vers le guide", () => {
    expect(EXPLICATIONS_CONCOURS).toHaveLength(5);
    const html = renderToStaticMarkup(createElement(CompetePage));
    for (const ligne of EXPLICATIONS_CONCOURS) {
      expect(html).toContain(ligne.replace(/'/g, "&#x27;"));
    }
    expect(html).toContain('href="/guide#concours"');
    // Le formulaire reste là, sous les explications.
    expect(html.indexOf("Un concours, c&#x27;est quoi ?")).toBeLessThan(html.indexOf('name="code"'));
  });

  it("l'ancre existe dans le guide, avec les quatre étapes", () => {
    const source = readFileSync("src/app/guide/page.tsx", "utf8");
    expect(source).toContain('id="concours"');
    expect(source).toContain('{ id: "concours"');
    for (const etape of ["Inscriptions", "Qualifications", "Finale", "Podium"]) {
      expect(source).toContain(`title="${etape}"`);
    }
  });
});

describe("un joueur déjà inscrit", () => {
  function formulaire(champs: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(champs)) fd.set(k, v);
    return fd;
  }
  const ETAT = { error: null, dejaInscrit: null };

  it("est prévenu avec le nom de son équipe, sans redirection", async () => {
    vi.mocked(joinCompetition).mockResolvedValue({ competitionId: "c-1", alreadyMember: "Alpha" });
    const etat = await joinCompetitionAction(
      ETAT,
      formulaire({ code: "R4KT7B", teamLabel: "Autre", pseudo: "Léa" }),
    );
    expect(etat).toEqual({ error: null, dejaInscrit: { competitionId: "c-1", teamLabel: "Alpha" } });
  });

  it("une inscription nouvelle redirige comme avant", async () => {
    vi.mocked(joinCompetition).mockResolvedValue({ competitionId: "c-1" });
    await expect(
      joinCompetitionAction(ETAT, formulaire({ code: "R4KT7B", teamLabel: "Alpha", pseudo: "Léa" })),
    ).rejects.toThrow("__redirect__/compete/c-1");
  });

  it("le formulaire affiche le message et « Ouvrir mon équipe »", () => {
    const html = renderToStaticMarkup(
      createElement(CompetitionJoinForm, {
        initialState: { error: null, dejaInscrit: { competitionId: "c-1", teamLabel: "Alpha" } },
      }),
    );
    expect(html).toContain(messageDejaInscrit("Alpha").replace(/'/g, "&#x27;"));
    expect(html).toContain("Vous êtes déjà inscrit dans l&#x27;équipe Alpha de ce concours");
    expect(html).toMatch(/<a[^>]*href="\/compete\/c-1"[^>]*>Ouvrir mon équipe/);
  });
});
