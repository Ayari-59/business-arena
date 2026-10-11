import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companyStates, games, rounds, teams } from "@/db/schema";
import { peekEventDraw, tickEvents } from "@/engine/events";
import type { EngineScenarioConfig, EventInstance } from "@/engine/types";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { presetFromProfile } from "@/config/difficulty";
import type { Sector } from "@/config/scenarios/registry";
import { articleDeLaGazette } from "@/config/gazette/generateur";
import {
  articleAffiche,
  articlesParus,
  lireLEdition,
  validerLArticleDeLEnseignant,
  type ConsigneDeLEnseignant,
} from "@/config/gazette/edition";
import type { ArticleDeLaGazette } from "@/config/gazette/types";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { estArchivee, PARTIE_ARCHIVEE } from "@/services/archivage";
import {
  activeEventsOf,
  injectedEvents,
  readPendingEvents,
  type CourrierAnnonce,
} from "@/services/round-resolution.service";

/**
 * LA GAZETTE, CÔTÉ SERVEUR : ce que la classe lit à chaque tour, l'aperçu de
 * l'enseignant, ses consignes. (L'archive se fige à la clôture, dans
 * `round-resolution.service`, par `profilAvecLaGazetteParue`.)
 *
 * Tout passe par le générateur pur (`config/gazette/generateur`) : ce module ne
 * fait que lui donner les événements que le moteur verra, exactement ceux-là.
 * C'est la seule condition pour que l'article ne contredise jamais le tour :
 *   · NOUVEAUX : les courriers de marché distribués par l'enseignant pour ce
 *     tour (`injectedEvents`) et le tirage du moteur lu d'avance
 *     (`peekEventDraw`, mêmes entreprises triées, mêmes événements actifs) ;
 *   · EN COURS : les événements de marché laissés actifs par la clôture
 *     précédente.
 * Les plis adressés à UNE entreprise n'y entrent jamais : le journal parle de
 * ce qui concerne tout le marché.
 */

const duMarche = (liste: readonly EventInstance[]) => liste.filter((e) => e.scope === "market");

/** Les événements qu'un tour verra, tels que la clôture les passera au moteur. */
export function evenementsDuTour(args: {
  scenario: EngineScenarioConfig;
  tour: number;
  /** Les entreprises, triées par identifiant (l'ordre de la clôture). */
  companies: ReadonlyArray<{ id: string }>;
  actifs: readonly EventInstance[];
  annonces: readonly CourrierAnnonce[];
  graine: number;
}): { nouveaux: EventInstance[]; enCours: EventInstance[]; tires: EventInstance[]; injectes: EventInstance[] } {
  const injectes = injectedEvents(args.scenario, args.annonces, args.actifs);
  const tires = peekEventDraw({
    scenario: args.scenario,
    roundIndex: args.tour,
    companies: args.companies,
    activeEvents: [...args.actifs, ...injectes],
    seed: args.graine,
  });
  return {
    nouveaux: duMarche([...injectes, ...tires]),
    enCours: duMarche(args.actifs),
    tires,
    injectes,
  };
}

/** L'article que le générateur écrit pour un tour, à partir de ses événements. */
export function articleGenere(args: {
  secteur: Sector;
  scenario: EngineScenarioConfig;
  tour: number;
  niveau: number;
  /** L'emprunt est une décision du niveau joué (les titres qui y invitent en dépendent). */
  financementOuvert: boolean;
  graine: number;
  nouveaux: readonly EventInstance[];
  enCours: readonly EventInstance[];
}): ArticleDeLaGazette {
  return articleDeLaGazette({
    secteur: args.secteur,
    scenario: args.scenario,
    tour: args.tour,
    niveau: args.niveau,
    financementOuvert: args.financementOuvert,
    graine: args.graine,
    nouveaux: args.nouveaux,
    enCours: args.enCours,
  });
}

/** Ce qu'une partie charge pour écrire sa Gazette. */
interface PartiePourLaGazette {
  id: string;
  seed: number;
  currentRound: number;
  status: string;
  difficultyProfile: unknown;
  scenarioSnapshot: unknown;
}

async function compagniesDuTour(gameId: string, tour: number): Promise<{ id: string }[] | null> {
  const equipes = await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId));
  const etats = await db
    .select({ teamId: companyStates.teamId })
    .from(companyStates)
    .where(
      and(
        eq(companyStates.roundIndex, tour - 1),
        inArray(
          companyStates.teamId,
          equipes.map((t) => t.id),
        ),
      ),
    );
  if (equipes.length === 0 || etats.length !== equipes.length) return null;
  return etats.map((r) => ({ id: r.teamId })).sort((a, b) => a.id.localeCompare(b.id));
}

export interface GazetteDuTour {
  /** Ce que la classe lit ce tour ; null quand l'enseignant n'a rien publié. */
  article: ArticleDeLaGazette | null;
  /** L'article est celui du journal : il porte les événements de marché, les circulaires se taisent. */
  porteLeMarche: boolean;
  /** Les articles des tours clos, du plus récent au plus ancien. */
  revue: ArticleDeLaGazette[];
}

/**
 * La Gazette d'une partie, vue par un élève : l'article du tour en cours (s'il
 * y en a un) et la revue de presse des tours clos.
 */
export async function gazetteDeLaPartie(game: PartiePourLaGazette): Promise<GazetteDuTour> {
  const edition = lireLEdition(game.difficultyProfile);
  const revue = articlesParus(edition)
    .filter((a) => game.status === "finished" || a.tour < game.currentRound)
    .reverse();
  if (game.status === "finished") return { article: null, porteLeMarche: false, revue };
  const genere = await articleDuTourCourant(game);
  if (!genere) return { article: null, porteLeMarche: false, revue };
  const { article, porteLeMarche } = articleAffiche(genere, edition.enseignant[String(game.currentRound)]);
  return { article, porteLeMarche, revue };
}

/** L'article du générateur pour le tour en cours (avant toute consigne de l'enseignant). */
export async function articleDuTourCourant(game: PartiePourLaGazette): Promise<ArticleDeLaGazette | null> {
  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const companies = await compagniesDuTour(game.id, game.currentRound);
  if (!companies) return null;
  const definition = await resolveScenarioDefinition(scenario.code);
  const ev = evenementsDuTour({
    scenario,
    tour: game.currentRound,
    companies,
    actifs: activeEventsOf(game.difficultyProfile),
    annonces: readPendingEvents(game.difficultyProfile),
    graine: Number(game.seed),
  });
  return articleGenere({
    secteur: definition.sector,
    scenario,
    tour: game.currentRound,
    niveau: presetFromProfile(game.difficultyProfile).level,
    financementOuvert: presetFromProfile(game.difficultyProfile).decisions.finance,
    graine: Number(game.seed),
    nouveaux: ev.nouveaux,
    enCours: ev.enCours,
  });
}

/**
 * L'APERÇU DU TOUR SUIVANT, pour l'enseignant : la clôture du tour en cours
 * laissera actifs les événements d'aujourd'hui moins ceux qui s'éteignent
 * (`tickEvents`), puis le moteur tirera le tour suivant de la même graine.
 * Un courrier que l'enseignant distribuera au tour suivant n'y est pas encore :
 * l'aperçu le dit.
 */
export async function articleDuTourSuivant(game: PartiePourLaGazette): Promise<ArticleDeLaGazette | null> {
  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const suivant = game.currentRound + 1;
  if (suivant > scenario.roundsCount) return null;
  const companies = await compagniesDuTour(game.id, game.currentRound);
  if (!companies) return null;
  const definition = await resolveScenarioDefinition(scenario.code);
  const actifs = activeEventsOf(game.difficultyProfile);
  const aujourdhui = evenementsDuTour({
    scenario,
    tour: game.currentRound,
    companies,
    actifs,
    annonces: readPendingEvents(game.difficultyProfile),
    graine: Number(game.seed),
  });
  const actifsDemain = tickEvents([...actifs, ...aujourdhui.injectes, ...aujourdhui.tires]);
  const demain = evenementsDuTour({
    scenario,
    tour: suivant,
    companies,
    actifs: actifsDemain,
    annonces: [],
    graine: Number(game.seed),
  });
  return articleGenere({
    secteur: definition.sector,
    scenario,
    tour: suivant,
    niveau: presetFromProfile(game.difficultyProfile).level,
    financementOuvert: presetFromProfile(game.difficultyProfile).decisions.finance,
    graine: Number(game.seed),
    nouveaux: demain.nouveaux,
    enCours: demain.enCours,
  });
}

/** Ce que voit l'enseignant dans son pilotage. */
export interface GazetteDeLEnseignant {
  tours: {
    tour: number;
    /** « en-cours » : la classe le lit déjà ; « a-paraitre » : il paraîtra à l'ouverture du tour. */
    etat: "en-cours" | "a-paraitre";
    /** L'article du générateur. */
    genere: ArticleDeLaGazette;
    consigne: ConsigneDeLEnseignant | null;
  }[];
}

/** La Gazette du pilotage : le tour en cours et le suivant, avec leurs consignes. */
export async function gazetteDeLEnseignant(game: PartiePourLaGazette): Promise<GazetteDeLEnseignant | null> {
  if (game.status !== "running") return null;
  const edition = lireLEdition(game.difficultyProfile);
  const tours: GazetteDeLEnseignant["tours"] = [];
  const maintenant = await articleDuTourCourant(game);
  if (maintenant)
    tours.push({
      tour: game.currentRound,
      etat: "en-cours",
      genere: maintenant,
      consigne: edition.enseignant[String(game.currentRound)] ?? null,
    });
  const ensuite = await articleDuTourSuivant(game);
  if (ensuite)
    tours.push({
      tour: ensuite.tour,
      etat: "a-paraitre",
      genere: ensuite,
      consigne: edition.enseignant[String(ensuite.tour)] ?? null,
    });
  return { tours };
}

/**
 * LA CONSIGNE DE L'ENSEIGNANT : remplacer l'article d'un tour par le sien, ne
 * rien publier, ou rendre la main au journal. Contrôlée ici, côté serveur :
 * l'enseignant qui a créé la partie, une partie de classe en cours et non
 * archivée, le tour en cours ou le suivant, un article borné.
 */
export async function consignerLaGazette(args: {
  gameId: string;
  teacherId: string;
  tour: number;
  mode: "remplace" | "retire" | "retablir";
  titre?: unknown;
  texte?: unknown;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const [game] = await db.select().from(games).where(eq(games.id, args.gameId));
  if (!game) return { ok: false, erreur: "Partie introuvable." };
  if (game.createdBy !== args.teacherId)
    return { ok: false, erreur: "Seul l'enseignant qui a créé la partie peut modifier sa Gazette." };
  if (estArchivee(game)) return { ok: false, erreur: PARTIE_ARCHIVEE };
  if ((game.difficultyProfile as { kind?: string } | null)?.kind !== "class")
    return { ok: false, erreur: "La Gazette ne se modifie que dans une partie de classe." };
  if (game.status !== "running") return { ok: false, erreur: "Cette partie est terminée." };
  const scenario = game.scenarioSnapshot as { roundsCount?: number };
  const tour = Math.trunc(Number(args.tour));
  if (
    !Number.isFinite(tour) ||
    (tour !== game.currentRound && tour !== game.currentRound + 1) ||
    tour > (scenario.roundsCount ?? 0)
  )
    return { ok: false, erreur: "Ce tour n'est plus modifiable : seuls le tour en cours et le suivant le sont." };
  const [ligne] = await db
    .select({ status: rounds.status })
    .from(rounds)
    .where(and(eq(rounds.gameId, game.id), eq(rounds.index, tour)));
  if (ligne && ligne.status !== "open" && ligne.status !== "pending")
    return { ok: false, erreur: "Ce tour est déjà clos : son article est paru." };

  const edition = lireLEdition(game.difficultyProfile);
  const enseignant = { ...edition.enseignant };
  if (args.mode === "retablir") delete enseignant[String(tour)];
  else if (args.mode === "retire") enseignant[String(tour)] = { mode: "retire" };
  else {
    const v = validerLArticleDeLEnseignant(args.titre, args.texte);
    if (!v.ok) return { ok: false, erreur: v.erreur };
    enseignant[String(tour)] = { mode: "remplace", titre: v.titre, texte: v.texte };
  }
  await db
    .update(games)
    .set({
      difficultyProfile: {
        ...((game.difficultyProfile as object) ?? {}),
        gazette: { parus: edition.parus, enseignant },
      },
    })
    .where(eq(games.id, game.id));
  return { ok: true };
}

/** La Gazette du pilotage d'une partie de classe, pour son enseignant ; null ailleurs. */
export async function gazetteDuPilotage(
  gameId: string,
  teacherId: string,
): Promise<GazetteDeLEnseignant | null> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game || game.createdBy !== teacherId) return null;
  if ((game.difficultyProfile as { kind?: string } | null)?.kind !== "class") return null;
  if (estArchivee(game)) return null;
  return gazetteDeLEnseignant(game);
}
