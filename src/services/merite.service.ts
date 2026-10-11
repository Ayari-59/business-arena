import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  aidRequests,
  companyStates,
  decisions,
  gameRankings,
  games,
  roundResults,
  rounds,
  teams,
} from "@/db/schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { SCENARIO_CHOICES, familyOf } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { periodLabel, type Periodicity } from "@/config/scenarios/periodicity";
import { presetByLevel, type EconomicOverrides, type ScoringWeightOverrides } from "@/config/difficulty";
import { NIVEAU_MAX } from "@/config/vitrine-solo";
import { ENGINE_VERSION } from "@/engine/simulation";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { readExpectedLevers, readPedagogyInputs } from "@/services/scoring.service";
import { commeEnBase, rejouer, type IssueDuRejeu, type PartieARejouer, type PedagogieDuTour } from "@/pedagogy/merite/rejeu";
import { decisionDeReference } from "@/pedagogy/merite/reference";
import { GRAINES_DU_MERITE, verdictDuMerite, type VerdictDuMerite } from "@/pedagogy/merite/verdict";

/**
 * MÉRITE OU CHANCE, CÔTÉ SERVEUR : lire une partie solo terminée, la rejouer,
 * garder le verdict.
 *
 * LE CALCUL : la partie sous sa propre graine (la garde de vérité), puis les
 * décisions du joueur et la méthode de référence sous les trente marchés
 * possibles : 61 parties de six tours. Mesuré : de l'ordre d'une seconde (voir
 * le rapport du lot). C'est trop pour le rendu d'une page qui doit rester
 * rapide : la page de la partie le DIFFÈRE (une frontière `Suspense`, les trois
 * blocs arrivent quand ils sont prêts), et la clôture du dernier tour le lance
 * dès la fin de la partie (`after`), pour qu'il soit prêt quand le joueur lit
 * son bilan.
 *
 * LE CACHE : mémoïsé par partie ET par version (moteur + rejeu), en mémoire du
 * serveur. Pas de table : une partie terminée ne change plus, et le calcul se
 * refait à la demande, à l'identique (tout est seedé), sur une instance qui ne
 * l'a pas encore. La promesse est gardée, pas seulement le résultat : deux
 * lectures simultanées ne calculent qu'une fois.
 *
 * PAS DE VERDICT, et on dit pourquoi, quand la partie n'est pas une partie solo
 * terminée, quand un geste humain hors décisions y est entré (une subvention
 * accordée, un courrier distribué à la main), ou quand la rejouer sous sa
 * graine ne la retrouve plus au centime : un verdict sur une partie voisine
 * serait faux, et dit avec assurance.
 */

/** Change quand le rejeu, la référence ou le verdict changent : l'ancien cache ne vaut plus. */
export const VERSION_DU_MERITE = 1;
export const cleDuMerite = (gameId: string) => `${gameId}:${ENGINE_VERSION}:${VERSION_DU_MERITE}`;

export type RaisonSansVerdict =
  | "introuvable"
  | "pas-solo"
  | "en-cours"
  | "geste-humain"
  | "rejeu-infidele";

export const RAISONS_SANS_VERDICT: Record<RaisonSansVerdict, string> = {
  introuvable: "Cette partie est introuvable.",
  "pas-solo":
    "La part du hasard se mesure en solo : en classe, le marché dépend aussi des décisions des autres équipes.",
  "en-cours":
    "La partie n'est pas allée à son terme : la part du hasard se mesure sur une partie jouée jusqu'au dernier tour.",
  "geste-humain":
    "Un geste de l'animateur est entré dans cette partie (un courrier distribué ou une subvention accordée) : la rejouer sans lui ne serait plus votre partie.",
  "rejeu-infidele":
    "Le jeu a évolué depuis votre partie : la rejouer ne la retrouve plus exactement, et un verdict serait faux.",
};

export type MeriteDeLaPartie =
  | {
      etat: "verdict";
      verdict: VerdictDuMerite;
      /** Le monde (texture du marché) a-t-il pu être retiré à chaque marché, ou seulement les tirages ? */
      mondeRetire: boolean;
      niveau: number;
      /** Le temps du calcul, en millisecondes. */
      duree: number;
    }
  | { etat: "sans-verdict"; raison: RaisonSansVerdict; message: string };

const sansVerdict = (raison: RaisonSansVerdict): MeriteDeLaPartie => ({
  etat: "sans-verdict",
  raison,
  message: RAISONS_SANS_VERDICT[raison],
});

interface ProfilDeLaPartie {
  kind?: string;
  level?: number;
  periodicity?: Periodicity;
  variableWorld?: boolean;
  investmentStories?: boolean;
  economicOverrides?: EconomicOverrides;
  scoringWeightOverrides?: ScoringWeightOverrides;
  difficulty?: { level?: number };
  pendingEvents?: unknown[];
}

/** Ce qu'il faut pour rejouer, lu de la base. */
export interface PartieLue {
  partie: PartieARejouer;
  niveau: number;
  /** Le niveau au sens du préréglage (absent pour une partie sans niveau). */
  preset: ReturnType<typeof presetByLevel.get>;
  mondeRetire: boolean;
  /** Ce que la base garde de chaque tour, pour la garde de vérité. */
  tours: {
    parEquipe: Record<string, { revenue: string; netIncome: string; cash: string; netTreasury: string }>;
    evenements: Record<string, string[]>;
  }[];
  classement: Record<string, { bpi: string; rank: number }>;
  libelles: string[];
  entreprise: string;
}

/** Lit une partie solo terminée ; une raison si elle n'est pas éligible. */
export async function lirePartieARejouer(gameId: string): Promise<PartieLue | RaisonSansVerdict> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) return "introuvable";
  const profil = (game.difficultyProfile ?? {}) as ProfilDeLaPartie;
  if (profil.kind !== "solo" || game.mode !== "learning") return "pas-solo";
  if (game.status !== "finished") return "en-cours";
  const snapshot = parseScenarioConfig(game.scenarioSnapshot);

  const equipes = await db
    .select({ id: teams.id, controller: teams.controller, botProfile: teams.botProfile })
    .from(teams)
    .where(eq(teams.gameId, gameId));
  const humaines = equipes.filter((e) => e.controller === "human");
  if (humaines.length !== 1) return "pas-solo";
  const joueur = humaines[0]!.id;
  const ids = equipes.map((e) => e.id);

  const lesTours = await db
    .select()
    .from(rounds)
    .where(eq(rounds.gameId, gameId))
    .orderBy(asc(rounds.index));
  if (
    lesTours.length !== snapshot.roundsCount ||
    lesTours.some((t, i) => t.index !== i + 1 || t.status !== "resolved")
  ) {
    return "en-cours";
  }
  const accordees = await db
    .select({ id: aidRequests.id })
    .from(aidRequests)
    .where(and(eq(aidRequests.gameId, gameId), eq(aidRequests.status, "granted")));
  if (accordees.length > 0) return "geste-humain";

  const initiaux = await db
    .select()
    .from(companyStates)
    .where(and(inArray(companyStates.teamId, ids), eq(companyStates.roundIndex, 0)));
  if (initiaux.length !== ids.length) return "en-cours";
  const roundIds = lesTours.map((t) => t.id);
  const [lignesDecisions, lignesResultats, lignesClassement] = await Promise.all([
    db
      .select({ roundId: decisions.roundId, payload: decisions.payload, status: decisions.status })
      .from(decisions)
      .where(and(inArray(decisions.roundId, roundIds), eq(decisions.teamId, joueur))),
    db
      .select({
        roundId: roundResults.roundId,
        teamId: roundResults.teamId,
        revenue: roundResults.revenue,
        netIncome: roundResults.netIncome,
        cash: roundResults.cash,
        netTreasury: roundResults.netTreasury,
        engineTrace: roundResults.engineTrace,
      })
      .from(roundResults)
      .where(inArray(roundResults.roundId, roundIds)),
    db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId)),
  ]);

  const decisionsDuJoueur: RoundDecisions[] = [];
  const reconduits: boolean[] = [];
  const pedagogie: Record<string, PedagogieDuTour>[] = [];
  const tours: PartieLue["tours"] = [];
  for (const t of lesTours) {
    const d = lignesDecisions.find((x) => x.roundId === t.id);
    if (!d) return "en-cours";
    decisionsDuJoueur.push(d.payload as RoundDecisions);
    reconduits.push(d.status === "carried_over");
    const [scores, leviers] = await Promise.all([readPedagogyInputs(t.id), readExpectedLevers(t.id)]);
    const parEquipe: Record<string, PedagogieDuTour> = {};
    for (const id of ids) {
      parEquipe[id] = {
        situationScores: scores.get(id)?.situationScores ?? [],
        leviers: leviers.get(id) ?? [],
      };
    }
    pedagogie.push(parEquipe);
    const ligne: PartieLue["tours"][number] = { parEquipe: {}, evenements: {} };
    for (const r of lignesResultats.filter((x) => x.roundId === t.id)) {
      ligne.parEquipe[r.teamId] = {
        revenue: String(r.revenue),
        netIncome: String(r.netIncome),
        cash: String(r.cash),
        netTreasury: String(r.netTreasury),
      };
      ligne.evenements[r.teamId] = ((r.engineTrace as { events?: string[] } | null)?.events ?? []).slice();
    }
    tours.push(ligne);
  }

  // LE MONDE D'UNE GRAINE. Une partie solo naît en monde variable : sa texture
  // (taille des segments, saison, délais…) vient de sa graine. On la recompose
  // pour chaque marché possible, avec le calcul de la création, à condition
  // que la recomposer sous la graine jouée retrouve EXACTEMENT le snapshot
  // gardé. Sinon (scénario retouché depuis, réglages d'avant ce calcul), le
  // monde reste celui de la partie, et seuls les tirages changent.
  const definition = await resolveScenarioDefinition(snapshot.code);
  const level = profil.difficulty?.level;
  const composer = (graine: number): EngineScenarioConfig =>
    parseScenarioConfig(
      commeEnBase(
        composerLeScenarioJoue({
          scenario: definition.scenario,
          seed: graine,
          variableWorld: profil.variableWorld === true,
          level,
          economicOverrides: profil.economicOverrides,
          scoringWeightOverrides: profil.scoringWeightOverrides,
          concurrents: equipes.length,
          roundsCount: snapshot.roundsCount,
          periodicity: profil.periodicity ?? "quarter",
          investmentStories: profil.investmentStories === true,
        }),
      ),
    );
  let mondeRetire = false;
  try {
    mondeRetire =
      profil.variableWorld === true &&
      JSON.stringify(composer(Number(game.seed))) === JSON.stringify(snapshot);
  } catch {
    mondeRetire = false;
  }
  const mondes = new Map<number, EngineScenarioConfig>();
  const scenarioPour = (graine: number): EngineScenarioConfig => {
    if (!mondeRetire || graine === Number(game.seed)) return snapshot;
    const deja = mondes.get(graine);
    if (deja) return deja;
    const monde = composer(graine);
    mondes.set(graine, monde);
    return monde;
  };

  const classement: PartieLue["classement"] = {};
  for (const r of lignesClassement) classement[r.teamId] = { bpi: String(r.bpi), rank: r.rank };
  const roundDays = (snapshot as { roundDays: number }).roundDays;
  return {
    partie: {
      graine: Number(game.seed),
      joueur,
      equipes: equipes.map((e) => ({ id: e.id, controller: e.controller, botProfile: e.botProfile })),
      etatsInitiaux: initiaux.map((r) => r.state as CompanyState),
      tours: snapshot.roundsCount,
      scenarioPour,
      decisions: decisionsDuJoueur,
      reconduits,
      pedagogie,
    },
    niveau: profil.difficulty?.level ?? profil.level ?? 1,
    preset: level ? presetByLevel.get(level as 1 | 2 | 3 | 4 | 5 | 6) : undefined,
    mondeRetire,
    tours,
    classement,
    libelles: lesTours.map((t) => periodLabel(roundDays, t.index)),
    entreprise: familyOf(snapshot.code)?.head ?? snapshot.code,
  };
}

/**
 * LA GARDE DE VÉRITÉ : sous sa graine, le rejeu retrouve-t-il la partie gardée,
 * au centime, tour par tour et équipe par équipe, jusqu'au classement final ?
 * Rend la première différence trouvée, ou `null`.
 */
export function ecartAvecLaPartie(lue: PartieLue, rejeu: IssueDuRejeu): string | null {
  for (let i = 0; i < lue.tours.length; i += 1) {
    const garde = lue.tours[i]!;
    const refait = rejeu.tours[i];
    if (!refait) return `tour ${i + 1} absent du rejeu`;
    for (const [id, montants] of Object.entries(garde.parEquipe)) {
      const autre = refait.parEquipe[id];
      for (const cle of ["revenue", "netIncome", "cash", "netTreasury"] as const) {
        if (Number(montants[cle]) !== Number(autre?.[cle])) {
          return `tour ${i + 1}, équipe ${id}, ${cle} : ${montants[cle]} gardé, ${autre?.[cle]} rejoué`;
        }
      }
      // Un événement gardé que le tirage n'a pas produit : un courrier distribué à la main.
      const tires = new Set(refait.evenements[id] ?? []);
      const ajoute = (garde.evenements[id] ?? []).find((c) => !tires.has(c));
      if (ajoute) return `tour ${i + 1}, équipe ${id} : événement « ${ajoute} » hors tirage`;
    }
  }
  for (const [id, c] of Object.entries(lue.classement)) {
    const r = rejeu.parEquipe[id];
    if (!r || r.rang !== c.rank || r.ipg.toFixed(2) !== Number(c.bpi).toFixed(2)) {
      return `classement de ${id} : IPG ${c.bpi} rang ${c.rank} gardés, IPG ${r?.ipg} rang ${r?.rang} rejoués`;
    }
  }
  return null;
}

/** Le calcul complet, sans cache. */
export async function calculerLeMerite(gameId: string): Promise<MeriteDeLaPartie> {
  const debut = performance.now();
  const lue = await lirePartieARejouer(gameId);
  if (typeof lue === "string") return sansVerdict(lue);
  const joue = rejouer(lue.partie, lue.partie.graine);
  const ecart = ecartAvecLaPartie(lue, joue);
  if (ecart) {
    const horsTirage = ecart.includes("hors tirage");
    console.warn(`[merite] ${gameId} : ${ecart}`);
    return sansVerdict(horsTirage ? "geste-humain" : "rejeu-infidele");
  }
  const ouverts = lue.preset?.decisions ?? null;
  const reference = { type: "methode" as const, decider: (c: Parameters<typeof decisionDeReference>[0]) => decisionDeReference(c, ouverts) };
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(lue.partie, g));
  const references = GRAINES_DU_MERITE.map((g) => rejouer(lue.partie, g, reference));
  const verdict = verdictDuMerite({
    joue,
    joueur,
    reference: references,
    libelles: lue.libelles,
    niveau: lue.niveau,
    niveauMax: NIVEAU_MAX,
    entreprise: lue.entreprise,
    entreprises: SCENARIO_CHOICES.map((s) => s.code),
  });
  statistiquesDuMerite.calculs += 1;
  return {
    etat: "verdict",
    verdict,
    mondeRetire: lue.mondeRetire,
    niveau: lue.niveau,
    duree: Math.round(performance.now() - debut),
  };
}

/* ---------------------------------------------------------------------------
 * LE CACHE.
 * ------------------------------------------------------------------------- */

/** Combien de calculs ont été faits (pas de lectures) : la garde d'intégration le lit. */
export const statistiquesDuMerite = { calculs: 0 };

/** Au-delà, la plus ancienne entrée sort : quelques centaines de verdicts tiennent en mémoire. */
const PLAFOND_DU_CACHE = 500;
const cache = new Map<string, Promise<MeriteDeLaPartie>>();

/**
 * Le mérite d'une partie, calculé une fois par partie et par version. Un
 * verdict impossible pour une raison qui peut changer (partie en cours) n'est
 * pas gardé ; une panne non plus.
 */
export function meriteDeLaPartie(gameId: string): Promise<MeriteDeLaPartie> {
  const cle = cleDuMerite(gameId);
  const deja = cache.get(cle);
  if (deja) return deja;
  const calcul = calculerLeMerite(gameId).then(
    (m) => {
      if (m.etat === "sans-verdict" && m.raison === "en-cours") cache.delete(cle);
      return m;
    },
    (e: unknown) => {
      cache.delete(cle);
      throw e;
    },
  );
  cache.set(cle, calcul);
  if (cache.size > PLAFOND_DU_CACHE) cache.delete(cache.keys().next().value!);
  return calcul;
}

/** Vide le cache (tests). */
export function oublierLeMerite(): void {
  cache.clear();
}
