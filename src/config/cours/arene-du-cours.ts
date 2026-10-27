import { botDecisions, soldByProduct, type BotProfile } from "../../engine/bots";
import { soldUnits, type DecisionProvider, type DecisionProviderContext } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "../../engine/types";
import { decisionDeReference } from "../../pedagogy/merite/reference";
import { presetByLevel, type DifficultyPreset } from "../difficulty";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "../scenarios/scenario-joue";
import { VITRINE_SOLO_PAR_DEFAUT } from "../vitrine-solo";

/**
 * L'ARÈNE DU COURS, TELLE QU'UNE PARTIE CRÉÉE AUJOURD'HUI LA JOUE.
 *
 * Chaque chiffre du cours vient d'une année de l'arène que le cours rejoue lui-même :
 * l'année du cours (cas.ts), ses rejeux (gestion-de-la-pme.ts, ressources-humaines.ts),
 * les trois années, la décision et la gamme. Ils posaient chacun leur scénario et leurs
 * décisions, et jouaient l'arène d'avant les correctifs des parties nouvelles : des
 * concurrents qui vendaient sous leur coût et faisaient défaillance, un parc qui comptait
 * deux fois la même machine, et une gestion équilibrée qui ne voyait pas ses ventes du
 * tour d'avant et préparait trop ou trop peu.
 *
 * Ils passent tous par ici. Le scénario se compose comme celui d'une partie
 * (`composerLeScenarioJoue`, avec `CORRECTIFS_DES_PARTIES_NOUVELLES`) : un correctif
 * ajouté aux parties nouvelles vaut aussi pour le cours. Trois entreprises au trimestre,
 * sans niveau ni monde variable : le scénario du registre, ses seuls correctifs en plus.
 * Les concurrents décident comme les concurrents pilotés d'une partie : leur gestion lit
 * ses ventes du tour d'avant (`lastSoldUnits`, `lastSoldByProduct`), à la manière du lot
 * de l'examen (pedagogy/examen/lot.ts).
 *
 * L'ENTREPRISE DE L'ÉLÈVE, elle, joue le bon gestionnaire (`decisionDeReference`,
 * pedagogy/merite/reference.ts) : celui qui tient le formulaire d'une partie à la demande
 * et ne s'en écarte que sur un signal net. La gestion d'un concurrent produisait d'après
 * ses ventes passées, plafonnées par sa propre production : elle ne voyait pas les clients
 * qu'elle n'avait pas servis, NOVA n'en servait que 62 %, et aucune décision qui fait
 * monter la demande n'y faisait vendre davantage. Le formulaire, lui, propose de produire
 * la demande reçue, ventes manquées comprises (décision du propriétaire, octobre 2026).
 * Chaque tour, le bon gestionnaire part de la décision qu'il a jouée au tour d'avant,
 * celle qu'un rejeu a changée comprise, comme le formulaire d'une partie. Il ne décide
 * qu'avec les leviers d'un élève sans licence (`LEVIERS_DE_L_ELEVE`) : la qualité,
 * l'entretien, l'équipe et les créances, sans investissement ni recherche ; un chapitre
 * qui achète une machine part ainsi d'une année qui n'en a pas acheté.
 */

/** La graine du trimestre simulé : le même cas pour tous. */
export const GRAINE_DU_COURS = 20260101;

/** Le joueur et les deux premiers concurrents du scénario. */
const ENTREPRISES_DE_L_ANNEE = 3;

/**
 * LES CHIFFRES QU'UNE GESTION LIT, ARRONDIS AU BRUIT DES MOTEURS PRÈS.
 *
 * Le cours se calcule dans le navigateur de l'élève, et sur le serveur pour la projection
 * de l'enseignant. Les moteurs JavaScript n'arrondissent pas tous au même dernier chiffre
 * `Math.pow`, `Math.exp` ou `Math.log` (mesuré en octobre 2026 : Node 22 et Chromium
 * diffèrent sur un tiers des valeurs, vers 10⁻¹³). Les ventes de l'arène en héritent, et
 * une gestion qui compare ce qu'elle lit à un seuil peut basculer d'un côté dans un
 * navigateur et de l'autre sur le serveur : chez NOVA, le plan du bon gestionnaire au
 * quatrième trimestre valait 6 666,67 ici et 6 665,71 là. Chaque gestion du cours décide
 * donc sur l'état et le tour passé arrondis à `CHIFFRES_LUS` chiffres significatifs, qui
 * effacent ce bruit ; le moteur, lui, joue les décisions telles quelles.
 */
export const CHIFFRES_LUS = 12;

/** Une copie où chaque nombre est arrondi à `CHIFFRES_LUS` chiffres significatifs. */
export function auBruitPres<T>(x: T): T {
  if (typeof x === "number") return (Number.isFinite(x) && x !== 0 ? Number(x.toPrecision(CHIFFRES_LUS)) : x) as T;
  if (Array.isArray(x)) return x.map(auBruitPres) as T;
  if (x !== null && typeof x === "object") {
    return Object.fromEntries(Object.entries(x as Record<string, unknown>).map(([k, v]) => [k, auBruitPres(v)])) as T;
  }
  return x;
}

/** Ce qu'une gestion lit pour décider : l'état et le tour passé, au bruit des moteurs près. */
function contexteLu(ctx: DecisionProviderContext): { state: CompanyState; avant: CompanyRoundResult | undefined } {
  return { state: auBruitPres(ctx.state), avant: ctx.lastResult ? auBruitPres(ctx.lastResult) : undefined };
}

/** Le scénario du registre, joué sur `tours` trimestres avec les correctifs des parties nouvelles. */
export function scenarioDuCours(scenario: EngineScenarioConfig, tours: number): EngineScenarioConfig {
  return composerLeScenarioJoue({
    scenario,
    seed: GRAINE_DU_COURS,
    concurrents: ENTREPRISES_DE_L_ANNEE,
    roundsCount: tours,
    periodicity: "quarter",
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
  });
}

/** La décision d'une gestion au trimestre, qui lit ses ventes du trimestre d'avant. */
export function decisionDuCours(
  profil: BotProfile,
  scenario: EngineScenarioConfig,
  ctx: DecisionProviderContext,
): RoundDecisions {
  const { state, avant } = contexteLu(ctx);
  return botDecisions(profil, {
    scenario,
    state,
    roundIndex: ctx.roundIndex,
    lastSoldUnits: avant ? soldUnits(avant) : undefined,
    lastSoldByProduct: avant ? soldByProduct(scenario, avant.market.bySegment) : undefined,
  });
}

/**
 * Les leviers de l'élève : ceux du plus haut niveau qu'il joue sans licence
 * (`niveauMaxAutres` de la vitrine, le `NIVEAU_SANS_LICENCE` des missions).
 */
export const NIVEAU_DE_L_ELEVE = VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres;
export const LEVIERS_DE_L_ELEVE: DifficultyPreset["decisions"] =
  presetByLevel.get(NIVEAU_DE_L_ELEVE as DifficultyPreset["level"])!.decisions;

/** Le code de l'entreprise de l'élève dans les parties du cours. */
export const JOUEUR = "joueur";

/** Ce qu'un rejeu change à la décision de l'élève d'un trimestre ; absent ou rien : elle reste. */
export type ChangementDuJoueur = (tour: number, decision: RoundDecisions) => RoundDecisions | undefined;

/**
 * Les décisions d'une partie du cours : l'élève joue le bon gestionnaire, que `change`
 * peut modifier, et chaque concurrent sa gestion. Chaque appel donne une partie neuve :
 * le bon gestionnaire se souvient de sa décision du tour d'avant.
 */
export function decisionsDuCours(
  entreprises: readonly CompanyState[],
  scenario: EngineScenarioConfig,
  change: ChangementDuJoueur = () => undefined,
): Record<string, DecisionProvider> {
  let precedente: RoundDecisions | undefined;
  const joueur: DecisionProvider = (ctx) => {
    const { state, avant } = contexteLu(ctx);
    const base = decisionDeReference(
      {
        scenario,
        state,
        roundIndex: ctx.roundIndex,
        lastSoldUnits: avant ? soldUnits(avant) : undefined,
        lastSoldByProduct: avant ? soldByProduct(scenario, avant.market.bySegment) : undefined,
        resultatPrecedent: avant,
        decisionPrecedente: precedente,
      },
      LEVIERS_DE_L_ELEVE,
    );
    const jouee = change(ctx.roundIndex, base) ?? base;
    precedente = jouee;
    return jouee;
  };
  return Object.fromEntries(
    entreprises.map((e) => [
      e.id,
      e.id === JOUEUR ? joueur : (ctx: DecisionProviderContext) => decisionDuCours(e.botProfile as BotProfile, scenario, ctx),
    ]),
  );
}
