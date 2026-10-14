import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { classes, decisions, games, rounds, teams } from "@/db/schema";
import { estParDefaut, estReconduite, lireSource } from "@/config/decision-source";
import { scenarioByCode } from "@/config/scenarios/registry";
import type { EngineScenarioConfig } from "@/engine/types";

/**
 * CE QUE LA SÉANCE A VRAIMENT PRODUIT.
 *
 * Le tableau de bord d'une partie répond « qui gagne ». Cette vue-ci répond à
 * une autre question, celle qu'on se pose quand on essaie le jeu en classe pour
 * la première fois : OÙ LES ÉLÈVES CALENT-ILS ?
 *
 * Trois mesures, et une seule est un chiffre de jeu :
 *
 *  1. LA PARTICIPATION — combien d'équipes ont validé, tour après tour. La
 *     courbe qui descend dit le décrochage, et le tour où il commence.
 *
 *  2. L'ENGAGEMENT — parmi celles qui ont validé, combien ont laissé le prix ET
 *     le volume tels que l'écran les proposait. C'est la mesure la plus dure du
 *     lot : une équipe qui valide sans rien toucher n'a pas décidé, elle a
 *     cliqué. Le reste du produit peut être parfait, si ce chiffre est haut,
 *     l'arène occupe au lieu d'enseigner.
 *
 *  3. LE TEMPS — combien de minutes entre l'ouverture du tour et la validation.
 *     MÉDIANE et non moyenne : une seule équipe qui finit chez elle le soir
 *     décale une moyenne de classe, pas une médiane.
 *
 * Rien n'est calculé ici qui ne soit déjà enregistré : ces trois mesures se
 * lisent dans `decisions` (statut, horodatage de validation, source des pivots,
 * justification, prévision). Aucune instrumentation nouvelle, donc rien à
 * déployer avant une séance.
 */

export interface ObservationTour {
  index: number;
  /** Le tour a-t-il été clos ? Un tour en cours se lit autrement. */
  clos: boolean;
  /** Équipes humaines ayant validé elles-mêmes. */
  validees: number;
  /** Décisions reconduites par la clôture : personne n'a rien décidé. */
  reconduites: number;
  /** Validées, mais prix ET volume laissés tels quels. */
  parDefaut: number;
  /** Validées sans un mot de justification. */
  sansJustification: number;
  /** Validées avec une prévision chiffrée. */
  avecPrevision: number;
  /** Minutes entre l'ouverture du tour et la validation, médiane. */
  minutesMedianes: number | null;
}

export interface ObservationSeance {
  gameId: string;
  scenario: string;
  classe: string | null;
  /** Les équipes humaines de la partie : le dénominateur de tout le reste. */
  equipesHumaines: number;
  tours: ObservationTour[];
  /**
   * Le tour où la participation chute le plus, et de combien d'équipes. `null`
   * quand personne ne décroche — ou qu'il n'y a pas encore deux tours à
   * comparer.
   */
  decrochage: { tour: number; equipesPerdues: number } | null;
}

/** La médiane d'une série, arrondie à la minute. `null` si la série est vide. */
function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  const tri = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tri.length / 2);
  const v = tri.length % 2 === 0 ? (tri[milieu - 1]! + tri[milieu]!) / 2 : tri[milieu]!;
  return Math.round(v);
}

/**
 * L'observation d'une séance. `null` si la partie n'existe pas ou n'appartient
 * pas à cet enseignant — même garde que le reste de l'espace enseignant : on ne
 * lit jamais la classe d'un collègue.
 */
export async function getObservationSeance(
  gameId: string,
  teacherId: string,
): Promise<ObservationSeance | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const equipes = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humaines = equipes.filter((t) => t.controller === "human");
  const idsHumaines = new Set(humaines.map((t) => t.id));

  const tours = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).sort(
    (a, b) => a.index - b.index,
  );

  // Une seule requête pour toutes les décisions de la partie : une classe fait
  // une dizaine d'équipes sur six tours, la table tient en mémoire.
  const toutes = tours.length
    ? await db.select().from(decisions).where(inArray(decisions.roundId, tours.map((r) => r.id)))
    : [];

  const classe = game.classId
    ? ((await db.select().from(classes).where(eq(classes.id, game.classId)))[0]?.name ?? null)
    : null;

  const lignes: ObservationTour[] = tours.map((tour, rang) => {
    const duTour = toutes.filter((d) => d.roundId === tour.id && idsHumaines.has(d.teamId));
    // DEUX STATUTS POUR UNE MÊME CHOSE. Une équipe qui valide passe en
    // `validated` ; à la clôture du tour, sa ligne devient `locked`. Ne compter
    // que `validated` viderait la page dès qu'un tour est clos — c'est-à-dire
    // dans tous les cas qu'elle sert à regarder. `carried_over` est l'inverse :
    // la clôture a reconduit faute de décision.
    const validees = duTour.filter((d) => d.status === "validated" || d.status === "locked");
    const sources = validees.map((d) => lireSource(d.decisionSource));

    // QUAND LE TOUR S'EST OUVERT. `opensAt` n'est écrit que par le planning
    // de l'enseignant, et la plupart des séances se pilotent à la main : la
    // mesure du temps ne se déclenchait donc presque jamais. La clôture du
    // tour PRÉCÉDENT est le moment où celui-ci est devenu jouable — c'est le
    // même repère, et il existe toujours. Le premier tour reste sans repère
    // fiable hors planning : la partie peut avoir été créée la veille.
    const ouverture = tour.opensAt ?? tours[rang - 1]?.resolvedAt ?? null;

    const minutes = validees
      .filter((d) => d.validatedAt && ouverture)
      .map((d) => (d.validatedAt!.getTime() - ouverture!.getTime()) / 60000)
      // Une valeur négative n'a pas de sens (fenêtre déplacée après coup) et
      // fausserait la médiane : on l'écarte plutôt que de la ramener à zéro.
      .filter((m) => m >= 0);

    return {
      index: tour.index,
      clos: tour.status === "resolved",
      validees: validees.length,
      reconduites: duTour.filter((d) => estReconduite(lireSource(d.decisionSource))).length,
      parDefaut: sources.filter((s) => estParDefaut(s)).length,
      sansJustification: validees.filter((d) => !d.justification?.trim()).length,
      avecPrevision: validees.filter((d) => d.forecast != null).length,
      minutesMedianes: mediane(minutes),
    };
  });

  // Le décrochage se lit entre deux tours CLOS : un tour encore ouvert n'a pas
  // fini de recevoir ses décisions, et le compter ferait crier au décrochage
  // au beau milieu de la séance.
  const clos = lignes.filter((l) => l.clos);
  let decrochage: ObservationSeance["decrochage"] = null;
  for (let i = 1; i < clos.length; i++) {
    const perdues = clos[i - 1]!.validees - clos[i]!.validees;
    if (perdues > 0 && (!decrochage || perdues > decrochage.equipesPerdues)) {
      decrochage = { tour: clos[i]!.index, equipesPerdues: perdues };
    }
  }

  // L'instantané porte le CODE du scénario ; son nom d'affichage vit au
  // registre, qui suit les renommages.
  const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
  return {
    gameId,
    scenario: scenarioByCode(snapshot.code).shortName,
    classe,
    equipesHumaines: humaines.length,
    tours: lignes,
    decrochage,
  };
}
