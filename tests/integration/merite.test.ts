import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";

/**
 * MÉRITE OU CHANCE, DE BOUT EN BOUT : des parties solo jouées jusqu'au bout par
 * le vrai pipeline (création, clôtures, scores, classement), puis rejouées.
 *
 * LA GARDE DE VÉRITÉ est ici : sous la graine d'origine, le rejeu pur
 * (`pedagogy/merite/rejeu.ts`) doit retrouver la partie gardée en base AU
 * CENTIME, tour par tour, équipe par équipe, jusqu'à l'IPG et au rang finals.
 * Elle tourne sur plusieurs métiers et niveaux : monde variable, gamme,
 * abonnement, situations rendues, prix du joueur qui fait réagir les bots.
 * Puis le verdict est calculé une fois, gardé, relu ; et les parties qui ne
 * doivent pas en avoir n'en ont pas, chacune avec sa raison.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { aidRequests, companyStates, games, roundResults, rounds, teams, users } from "@/db/schema";
import { createClassGame, createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { getTeamSituations, submitDiagnosis } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { neutralDecisions } from "@/engine/bots";
import type { CompanyState, RoundDecisions } from "@/engine/types";
import { prixDuFournisseur } from "@/engine/groupe";
import { rejouer } from "@/pedagogy/merite/rejeu";
import { partieDeLaReference } from "@/pedagogy/merite/reference";
import { GRAINES_DU_MERITE } from "@/pedagogy/merite/verdict";
import {
  ecartAvecLaPartie,
  lirePartieARejouer,
  meriteDeLaPartie,
  oublierLeMerite,
  statistiquesDuMerite,
  type PartieLue,
} from "@/services/merite.service";
import { placerSousLicence } from "./helpers/licence";

let userId: string;

beforeAll(async () => {
  userId = (
    await db
      .insert(users)
      .values({ email: "merite@test.local", displayName: "Joueur" })
      .returning({ id: users.id })
  )[0]!.id;
  await placerSousLicence(userId);
});

/**
 * Des décisions de joueur qui ne sont PAS celles proposées : la gestion neutre
 * du secteur, prix et volume déplacés selon le tour. Le prix change d'un tour à
 * l'autre : les bots réagissent au prix humain du tour précédent, et c'est un
 * chemin que le rejeu doit refaire.
 */
async function decisionsDuTour(gameId: string, tour: number): Promise<RoundDecisions> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const scenario = parseScenarioConfig(game!.scenarioSnapshot);
  const [equipe] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  const [etat] = await db
    .select()
    .from(companyStates)
    .where(eq(companyStates.teamId, equipe!.id))
    .orderBy(desc(companyStates.roundIndex))
    .limit(1);
  const base = neutralDecisions({ scenario, state: etat!.state as CompanyState, roundIndex: tour });
  const k = [1.12, 0.93, 1.05, 1.18, 0.97, 1.08, 1.0, 1.1][tour - 1] ?? 1;
  const products = base.products
    ? Object.fromEntries(
        Object.entries(base.products).map(([c, p]) => [c, { ...p, price: Math.round(p.price * k * 10) / 10 }]),
      )
    : undefined;
  return {
    ...base,
    ...(products ? { products } : {}),
    price: Math.round(base.price * k * 10) / 10,
    productionPlan: Math.round(base.productionPlan * (2 - k)),
    marketingBudget: Math.round(base.marketingBudget * k),
    finance: { newLoan: 0, loanRepayment: 0 },
  };
}

async function jouerJusquauBout(gameId: string, { repondre = true } = {}): Promise<void> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const tours = parseScenarioConfig(game!.scenarioSnapshot).roundsCount;
  for (let tour = 1; tour <= tours; tour += 1) {
    if (repondre && tour <= 2) {
      // Une situation rendue : ses scores entrent dans l'IPG, et le rejeu les tient fixes.
      const s = (await getTeamSituations(gameId, userId)).current[0];
      if (s) {
        const def = situationByCode.get(s.code)!;
        await submitDiagnosis({
          instanceId: s.instanceId,
          userId,
          selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id).slice(0, 1),
        });
      }
    }
    await resolveCurrentRound({ gameId, userId, playerDecisions: await decisionsDuTour(gameId, tour) });
  }
}

const PARTIES: { nom: string; secteur: string; niveau: number; entreprises: number }[] = [
  { nom: "NOVA, niveau 3, trois entreprises", secteur: "nova", niveau: 3, entreprises: 3 },
  { nom: "l'hôtel, niveau 1, quatre entreprises", secteur: "hotel", niveau: 1, entreprises: 4 },
  { nom: "la salle de sport (abonnement), niveau 2", secteur: "fitness", niveau: 2, entreprises: 3 },
  { nom: "NOVA en gamme, niveau 6", secteur: "nova", niveau: 6, entreprises: 3 },
  { nom: "MAILLE & CO, niveau 4", secteur: "boutique", niveau: 4, entreprises: 3 },
];

describe("la garde de vérité : sous sa graine, le rejeu retrouve la partie au centime", () => {
  for (const p of PARTIES) {
    it(p.nom, async () => {
      const gameId = await createSoloGame(userId, "quarter", p.entreprises, p.niveau, true, p.secteur);
      await jouerJusquauBout(gameId);
      const lue = (await lirePartieARejouer(gameId)) as PartieLue;
      expect(typeof lue, String(lue)).toBe("object");
      // Le monde variable se recompose à l'identique : chaque marché possible a sa texture.
      expect(lue.mondeRetire).toBe(true);
      const rejeu = rejouer(lue.partie, lue.partie.graine);
      expect(ecartAvecLaPartie(lue, rejeu)).toBeNull();
      // Et, écrit en toutes lettres pour le joueur : son résultat net de chaque tour, au centime
      // (la colonne `numeric` rend « 79931.70 », le rejeu « 79931.7 » : on compare des nombres).
      const gardes = lue.tours.map((t) => Number(t.parEquipe[lue.partie.joueur]!.netIncome));
      const rejoues = rejeu.tours.map((t) => Number(t.parEquipe[lue.partie.joueur]!.netIncome));
      expect(rejoues).toEqual(gardes);
      // Un autre marché donne une autre partie : le rejeu n'est pas une copie.
      const ailleurs = rejouer(lue.partie, lue.partie.graine + 1);
      expect(ailleurs.joueur.resultatNetCumule).not.toBe(rejeu.joueur.resultatNetCumule);
    }, 120_000);
  }

  it("la garde sait tomber : un centime touché en base, et le rejeu ne la retrouve plus", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 2, true, "nova");
    await jouerJusquauBout(gameId, { repondre: false });
    const [tour3] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, 3)));
    const [ligne] = await db.select().from(roundResults).where(eq(roundResults.roundId, tour3!.id)).limit(1);
    await db
      .update(roundResults)
      .set({ netIncome: (Number(ligne!.netIncome) + 0.01).toFixed(2) })
      .where(and(eq(roundResults.roundId, tour3!.id), eq(roundResults.teamId, ligne!.teamId)));
    const lue = (await lirePartieARejouer(gameId)) as PartieLue;
    expect(ecartAvecLaPartie(lue, rejouer(lue.partie, lue.partie.graine))).toMatch(/tour 3/);
    const m = await meriteDeLaPartie(gameId);
    expect(m.etat === "sans-verdict" && m.raison).toBe("rejeu-infidele");
  }, 120_000);
});

describe("le niveau 7 « Groupe » : création réservée, taille de départ, rejeu au centime", () => {
  let admin: string;
  beforeAll(async () => {
    admin = (
      await db
        .insert(users)
        .values({ email: "admin-groupe@test.local", displayName: "Administration", isPlatformAdmin: true })
        .returning({ id: users.id })
    )[0]!.id;
    await placerSousLicence(admin);
  });

  // LE DRAPEAU D'ADMINISTRATION NE LE COMMANDE PLUS (décision du propriétaire,
  // octobre 2026 : le niveau 7 sort de l'avant-première et entre dans les offres).
  // Ce que ce test gardait — « seul un administrateur le crée » — a été retiré
  // délibérément ; ce qui reste gardé, ce sont les deux limites techniques, et le
  // fait qu'une licence est bien exigée. Le détail en solo comme en classe :
  // tests/integration/acces-sans-licence.test.ts.
  it("un enseignant sous licence, sans le drapeau d'administration, le crée ; et seulement avec NOVA", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 7, true, "nova");
    expect(gameId).toBeTruthy();
    await expect(createSoloGame(admin, "quarter", 3, 7, true, "hotel")).rejects.toThrow(/NOVA/);
  });

  it("l'état du tour 0 porte la taille de départ ; un rachat de fournisseur, la sous-traitance se rejouent au centime", async () => {
    const gameId = await createSoloGame(admin, "quarter", 3, 7, true, "nova");
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    const scenario = parseScenarioConfig(game!.scenarioSnapshot);
    const facteur = scenario.groupe!.depart!.facteur;
    const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
    const [depart] = await db
      .select()
      .from(companyStates)
      .where(and(eq(companyStates.teamId, equipe!.id), eq(companyStates.roundIndex, 0)));
    const etat0 = depart!.state as CompanyState;
    expect(etat0.groupe).toBeDefined();
    expect(etat0.machineCapacity).toBeCloseTo(7000 * facteur, 6);
    for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
      const d = await decisionsDuTour(gameId, tour);
      if (tour === 2) {
        // Le prix demandé à l'ouverture du tour 2, sur les états de toute la partie ;
        // emprunter le prix, et de quoi couvrir le découvert du tour 1.
        const ouverture = await db
          .select()
          .from(companyStates)
          .innerJoin(teams, eq(teams.id, companyStates.teamId))
          .where(and(eq(teams.gameId, gameId), eq(companyStates.roundIndex, 1)));
        const etats = ouverture.map((o) => o.company_states.state as CompanyState);
        const prix = prixDuFournisseur(scenario, etats, "standard")!.prix;
        const f = ouverture.find((o) => o.teams.id === equipe!.id)!.company_states.state as CompanyState;
        d.rachat = {
          cible: { type: "fournisseur", id: "standard" },
          prixMaximum: prix,
          paiement: "numeraire",
          emprunt: prix + Math.max(0, f.finance.overdraft - f.finance.cash) + 20000,
        };
      }
      if (tour >= 3) d.sousTraitance = { "nova-go": 500 };
      await resolveCurrentRound({ gameId, userId: admin, playerDecisions: d });
    }
    const [fin] = await db
      .select()
      .from(companyStates)
      .where(eq(companyStates.teamId, equipe!.id))
      .orderBy(desc(companyStates.roundIndex))
      .limit(1);
    expect((fin!.state as CompanyState).groupe!.filiales.map((x) => x.id)).toEqual(["standard"]);
    const lue = (await lirePartieARejouer(gameId)) as PartieLue;
    expect(typeof lue, String(lue)).toBe("object");
    const rejeu = rejouer(lue.partie, lue.partie.graine);
    expect(ecartAvecLaPartie(lue, rejeu)).toBeNull();
    expect(rejeu.joueur.rentabiliteTotale).toBeDefined();
  }, 180_000);
});

describe("le verdict : calculé une fois, gardé, relu", () => {
  it("une partie solo jouée jusqu'au bout a son verdict, et le relire ne recalcule pas", async () => {
    oublierLeMerite();
    const gameId = await createSoloGame(userId, "quarter", 3, 3, true, "nova");
    await jouerJusquauBout(gameId);
    const avant = statistiquesDuMerite.calculs;
    const premier = await meriteDeLaPartie(gameId);
    expect(premier.etat).toBe("verdict");
    expect(statistiquesDuMerite.calculs).toBe(avant + 1);
    const relu = await meriteDeLaPartie(gameId);
    expect(relu).toBe(premier);
    expect(statistiquesDuMerite.calculs).toBe(avant + 1);
    if (premier.etat !== "verdict") return;
    const v = premier.verdict;
    expect(v.n).toBe(30);
    expect(v.joueur).toHaveLength(30);
    expect(v.reference).toHaveLength(30);
    expect(["merite", "malchance", "chance", "lecon"]).toContain(v.cas);
    expect(v.joue.place).toBeGreaterThanOrEqual(1);
    expect(v.joue.place).toBeLessThanOrEqual(30);
    expect(v.constats.length).toBeGreaterThanOrEqual(2);
    expect(premier.duree).toBeGreaterThan(0);
    // LA RÉFÉRENCE DU VERDICT : un bon gestionnaire qui a joué le marché de la
    // partie, ses décisions rejouées telles quelles, comme celles du joueur.
    const lue = (await lirePartieARejouer(gameId)) as PartieLue;
    const laReference = partieDeLaReference(lue.partie, lue.preset?.decisions ?? null);
    expect(laReference.decisions).toHaveLength(lue.partie.tours);
    for (const i of [0, 13, 29]) {
      expect(v.reference[i]!.resultat).toBe(rejouer(laReference, GRAINES_DU_MERITE[i]!).joueur.resultatNetCumule);
    }
    console.info(
      `[merite] calcul complet : ${premier.duree} ms, cas ${v.cas}, ${v.battues}/30, écart ${Math.round(v.ecart.relatif * 100)} %`,
    );
  }, 120_000);

  it("deux lectures simultanées ne calculent qu'une fois", async () => {
    oublierLeMerite();
    const gameId = await createSoloGame(userId, "quarter", 3, 1, true, "nova");
    await jouerJusquauBout(gameId, { repondre: false });
    const avant = statistiquesDuMerite.calculs;
    const [a, b] = await Promise.all([meriteDeLaPartie(gameId), meriteDeLaPartie(gameId)]);
    expect(a).toBe(b);
    expect(statistiquesDuMerite.calculs).toBe(avant + 1);
  }, 120_000);
});

describe("pas de verdict, et on dit pourquoi", () => {
  it("une partie abandonnée en cours", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1, true, "nova");
    await resolveCurrentRound({ gameId, userId, playerDecisions: await decisionsDuTour(gameId, 1) });
    const m = await meriteDeLaPartie(gameId);
    expect(m.etat === "sans-verdict" && m.raison).toBe("en-cours");
    if (m.etat === "sans-verdict") expect(m.message).toMatch(/dernier tour/);
  }, 60_000);

  it("une partie de classe", async () => {
    const { gameId } = await createClassGame({
      teacherId: userId,
      organizationId: (await db.select({ o: games.organizationId }).from(games).limit(1))[0]!.o,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    }).catch(async () => {
      // Sans organisation sous licence pour ce compte, la classe ne se crée pas :
      // on pose directement la marque d'une classe sur une partie solo.
      const id = await createSoloGame(userId, "quarter", 3, 1, true, "nova");
      const [g] = await db.select().from(games).where(eq(games.id, id));
      await db
        .update(games)
        .set({ difficultyProfile: { ...(g!.difficultyProfile as object), kind: "class" } })
        .where(eq(games.id, id));
      return { gameId: id };
    });
    const m = await meriteDeLaPartie(gameId);
    expect(m.etat === "sans-verdict" && m.raison).toBe("pas-solo");
  }, 60_000);

  it("une subvention accordée par l'animateur", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1, true, "nova");
    await jouerJusquauBout(gameId, { repondre: false });
    const [equipe] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
    await db.insert(aidRequests).values({
      gameId,
      teamId: equipe!.id,
      roundIndex: 2,
      amount: "1000",
      reason: "test",
      status: "granted",
      grantedAmount: "1000",
    });
    const m = await meriteDeLaPartie(gameId);
    expect(m.etat === "sans-verdict" && m.raison).toBe("geste-humain");
  }, 120_000);
});
