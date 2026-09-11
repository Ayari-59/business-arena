import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * UNE PARTIE À GAMME SE JOUE DE BOUT EN BOUT, BASE COMPRISE.
 *
 * Le moteur savait simuler cinq références ; rien ne garantissait que le
 * détail survive à la base et revienne à l'écran. Ce test crée une partie
 * MAILLE & CO, lit ce que la vue propose (une décision par référence), joue
 * un tour avec ce détail, et vérifie que la vue le rend — décisions, ventes et
 * stock par référence, clientèles de toutes les références — et qu'une équipe
 * qui valide la proposition telle quelle est reconnue comme telle.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { decisions, users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import { scalarsOfGamme } from "@/engine/gamme";
import { cockpitEquipe } from "@/services/cockpit.service";
import { referencesResolues } from "@/config/ateliers/cockpit";
import type { RoundDecisions } from "@/engine/types";

let userId: string;
let gameId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "maille@test.local", displayName: "Maille" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  // Niveau 3 : c'est le niveau à partir duquel MAILLE & CO se joue en gamme
  // (en dessous, la famille donne la boutique en un seul article).
  gameId = await createSoloGame(userId, "quarter", 2, 3, false, "boutique");
});

const CODES = ["pull-col-rond", "cardigan", "pull-merinos", "echarpe", "bonnet"];

describe("MAILLE & CO dans l'arène", () => {
  it("la vue expose la gamme, ses clientèles et une proposition par référence", async () => {
    const view = (await getGameView(gameId, userId))!;
    expect(view.gamme?.map((p) => p.code)).toEqual(CODES);
    // Toutes les clientèles (3 + 2 + 2 + 2 + 2), pas seulement celles du cœur de gamme.
    expect(Object.keys(view.segmentNames)).toHaveLength(11);
    expect(view.intro.segments).toHaveLength(11);
    expect(view.salesHistory.segments).toHaveLength(11);
    // Le stock d'ouverture par référence.
    expect(view.gamme!.find((p) => p.code === "bonnet")!.stock).toBe(250);
    // La proposition porte une décision par référence, cohérente avec ses scalaires.
    const proposed = view.proposedDecisions;
    expect(Object.keys(proposed.products ?? {})).toEqual(CODES);
    const scalars = scalarsOfGamme(proposed.products!);
    expect(proposed.productionPlan).toBe(Math.round(scalars.productionPlan));
    expect(proposed.price).toBeCloseTo(Math.round(scalars.price * 10) / 10, 9);
    for (const p of Object.values(proposed.products!)) expect(p.productionPlan).toBeGreaterThan(0);
  });

  it("un tour joué avec le détail par référence revient à l'écran référence par référence", async () => {
    const before = (await getGameView(gameId, userId))!;
    // On valide la proposition telle quelle : c'est une décision « par défaut ».
    const payload: RoundDecisions = before.proposedDecisions;
    await resolveCurrentRound({ gameId, userId, playerDecisions: payload });

    const view = (await getGameView(gameId, userId))!;
    const period = view.periods[0]!;
    // Les clés d'un objet JSON reviennent de la base dans son ordre à elle.
    expect(Object.keys(period.result.products ?? {}).sort()).toEqual([...CODES].sort());
    for (const code of CODES) {
      const p = period.result.products![code]!;
      expect(p.planned).toBeCloseTo(payload.products![code]!.productionPlan, 6);
      expect(p.price).toBeCloseTo(payload.products![code]!.price, 6);
      expect(p.sold).toBeGreaterThan(0);
      expect(Number.isFinite(p.stock.quantity)).toBe(true);
    }
    // Les décisions rendues gardent leur détail.
    expect(period.decisions?.products).toEqual(payload.products);
    expect(view.lastDecisions?.products).toEqual(payload.products);
    // Le stock affiché pour le tour suivant est celui du moteur, par référence.
    expect(view.gamme!.find((p) => p.code === "bonnet")!.stock).toBe(
      Math.round(period.result.products!["bonnet"]!.stock.quantity),
    );
    // L'historique des ventes couvre les onze clientèles.
    expect(view.salesHistory.rounds[0]!.bySegment).toHaveLength(11);

    // Validée sans y toucher : les deux pivots sont « par défaut ».
    const row = (await db.select().from(decisions))[0]!;
    expect(row.decisionSource).toEqual({ price: "default", productionPlan: "default" });
  });

  it("une décision scalaire (sans détail) reste jouable : la gamme se partage à parts égales", async () => {
    const view = (await getGameView(gameId, userId))!;
    const scalar: RoundDecisions = {
      price: 55,
      productionPlan: 3000,
      marketingBudget: 4000,
      qualityBudget: 0,
      maintenanceBudget: 3000,
    };
    await resolveCurrentRound({ gameId, userId, playerDecisions: scalar });
    const after = (await getGameView(gameId, userId))!;
    const period = after.periods[view.periods.length]!;
    expect(Object.keys(period.result.products ?? {}).sort()).toEqual([...CODES].sort());
    for (const code of CODES) {
      expect(period.result.products![code]!.planned).toBeCloseTo(600, 6);
      expect(period.result.products![code]!.price).toBe(55);
    }
  });
});

describe("le cockpit de l'équipe", () => {
  it("couvre les tours restants, part de l'état réel et porte l'historique joué", async () => {
    const view = (await getGameView(gameId, userId))!;
    const spec = (await cockpitEquipe(view))!;
    expect(spec.feuilles.map((f) => f.nom)).toEqual([
      "Paramètres",
      "Prévision logistique",
      "Prévision résultat",
      "Historique",
    ]);
    // Deux tours joués : le cockpit commence au tour 3 (la partie en compte 2 ici → tour 3 hors partie ⇒ dernier tour).
    const logistique = spec.feuilles[1]!;
    const entetes = logistique.lignes[3]!.slice(1).map((c) => c.v);
    expect(entetes[0]).toMatch(/^Tour \d$/);
    // Le stock d'ouverture de chaque référence est celui du moteur.
    const parametres = spec.feuilles[0]!;
    const bonnet = parametres.lignes.find((l) => l[0]?.v === "Bonnet")!;
    expect(bonnet[6]!.v).toBe(view.ouverture.stocks["bonnet"]);
    // L'historique porte les deux tours joués, référence par référence.
    const historique = spec.feuilles[3]!;
    expect(historique.lignes[3]!.slice(1).map((c) => c.v)).toEqual(["Tour 1", "Tour 2"]);
    // Et aucune formule ne vise le vide.
    const perdues = referencesResolues(spec).flatMap((r) => r.cibles.filter((c) => c.startsWith("?")));
    expect(perdues).toEqual([]);
  });
});
