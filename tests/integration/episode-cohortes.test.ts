import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/** Une cohorte se rejoint par son code, s'anime par sa clé ; un profil se reprend par son code. */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { EPISODES } from "@/pedagogy/episodes/registre";
import {
  codeDeRepriseDuProfil,
  cohorteDe,
  creerCohorte,
  listerCohortes,
  quitterCohorte,
  renouvelerCleAnimateur,
  rejoindreCohorte,
  reprendreProfil,
  vueDeLAnimateur,
} from "@/services/cohortes.service";
import { enregistrerPartie } from "@/services/episode-parties.service";

const ep = EPISODES[2]!;
const ids: string[] = [];

beforeAll(async () => {
  const lignes = await db
    .insert(users)
    .values(
      Array.from({ length: 6 }, (_, i) => ({
        email: `manager${i}@cohorte.test`,
        displayName: `Manager ${i}`,
      })),
    )
    .returning({ id: users.id });
  ids.push(...lignes.map((l) => l.id));
});

const jouer = (userId: string, option: number) =>
  enregistrerPartie(userId, {
    cle: randomUUID(),
    code: ep.code,
    niveau: "standard",
    graine: 3,
    chemin: ep.references[0]!.chemin.map((o, d) => (d === 0 ? option : o)),
    consultes: [],
    jours: 2,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: ep.prevision.min,
    confiance: 50,
  });

describe("les cohortes d'épisodes", () => {
  let code = "";
  let cle = "";

  it("se créent avec un code lisible et une clé d'animateur longue", async () => {
    const c = await creerCohorte("Acmé · managers de proximité");
    expect(c.code).toMatch(/^ACMEMA-[A-Z0-9]{4}$/);
    expect(c.cleAnimateur.length).toBeGreaterThanOrEqual(24);
    code = c.code;
    cle = c.cleAnimateur;
  });

  it("se rejoignent par leur code, saisi en minuscules ou non ; un code inconnu est refusé", async () => {
    expect(await rejoindreCohorte(ids[0]!, code.toLowerCase())).toEqual({
      ok: true,
      nom: "Acmé · managers de proximité",
    });
    expect((await rejoindreCohorte(ids[0]!, "INCONNU-0000")).ok).toBe(false);
    expect((await cohorteDe(ids[0]!))?.code).toBe(code);
  });

  it("n'ouvrent la vue de l'animateur qu'à sa clé, et rien sous cinq membres", async () => {
    expect(await vueDeLAnimateur("pas-la-bonne-cle-du-tout")).toBeNull();
    await jouer(ids[0]!, 0);
    const vue = (await vueDeLAnimateur(cle))!;
    expect(vue.vue).toMatchObject({ membres: 1, episodesJoues: 1, detail: false, episodes: [] });
  });

  it("montrent la répartition des choix quand cinq membres ont joué l'épisode", async () => {
    for (const [i, option] of [
      [1, 1],
      [2, 1],
      [3, 2],
      [4, 0],
    ] as const) {
      await rejoindreCohorte(ids[i]!, code);
      await jouer(ids[i]!, option);
    }
    // Une personne hors cohorte ne compte pas.
    await jouer(ids[5]!, 3);
    const { vue } = (await vueDeLAnimateur(cle))!;
    expect(vue.membres).toBe(5);
    const e = vue.episodes.find((x) => x.code === ep.code)!;
    expect(e.joueurs).toBe(5);
    expect(e.decisions![0]!.options.map((o) => o.part).slice(0, 4)).toEqual([0.4, 0.4, 0.2, 0]);
  });

  it("se quittent : la personne sort des agrégats", async () => {
    await quitterCohorte(ids[4]!);
    expect(await cohorteDe(ids[4]!)).toBeNull();
    expect((await vueDeLAnimateur(cle))!.vue.membres).toBe(4);
  });
});

describe("le code de reprise du profil", () => {
  it("se crée à la demande, une seule fois, et rend la personne qui le porte", async () => {
    expect(await codeDeRepriseDuProfil(ids[0]!)).toBeNull();
    const c = await codeDeRepriseDuProfil(ids[0]!, true);
    expect(c).toMatch(/^[A-Z2-9]{8}$/);
    expect(await codeDeRepriseDuProfil(ids[0]!, true)).toBe(c);
    const saisi = `${c!.slice(0, 4).toLowerCase()}-${c!.slice(4)}`;
    expect(await reprendreProfil({ code: saisi, ip: "10.0.0.1" })).toEqual({
      ok: true,
      userId: ids[0],
    });
  });

  it("refuse un code inconnu sans dire s'il existe, et bloque qui essaie trop", async () => {
    const r = await reprendreProfil({ code: "ZZZZ-ZZZZ", ip: "10.0.0.2" });
    expect(r).toEqual({
      ok: false,
      erreur: "Ce code ne correspond à aucun profil. Vérifiez-le et réessayez.",
    });
    expect((await reprendreProfil({ code: "court", ip: "10.0.0.2" })).ok).toBe(false);
    for (let i = 0; i < 10; i++) await reprendreProfil({ code: "ZZZZ-ZZZZ", ip: "10.0.0.3" });
    const bloque = await reprendreProfil({ code: "ZZZZ-ZZZZ", ip: "10.0.0.3" });
    expect(bloque.ok === false && bloque.erreur).toMatch(/Trop de tentatives/);
  });
});

describe("l'administration des cohortes", () => {
  it("liste les cohortes, la plus récente d'abord, avec leur nombre de membres", async () => {
    const vide = await creerCohorte("Cohorte vide");
    const liste = await listerCohortes();
    expect(liste[0]).toMatchObject({ code: vide.code, membres: 0 });
    const acme = liste.find((c) => c.nom === "Acmé · managers de proximité")!;
    expect(acme.membres).toBe(4);
  });

  it("remplace la clé de l'animateur : l'ancienne n'ouvre plus rien, les membres restent", async () => {
    const acme = (await listerCohortes()).find((c) => c.nom === "Acmé · managers de proximité")!;
    const nouvelle = await renouvelerCleAnimateur(acme.id);
    expect(nouvelle).not.toBe(acme.cleAnimateur);
    expect(await vueDeLAnimateur(acme.cleAnimateur)).toBeNull();
    expect((await vueDeLAnimateur(nouvelle!))!.vue.membres).toBe(4);
    expect(await renouvelerCleAnimateur("00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
