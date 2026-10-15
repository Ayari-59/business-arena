import type { EngineScenarioConfig } from "@/engine/types";
import { withoutRd } from "@/engine/gamme";
import { GROUPE_PAR_SCENARIO } from "@/config/groupe/nova";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  applyScoringWeightOverrides,
  presetByLevel,
  type DifficultyPreset,
  type EconomicOverrides,
  type ScoringWeightOverrides,
} from "@/config/difficulty";
import {
  avecInvestissementParNiveau,
  type CalendrierDesHistoires,
} from "@/config/investissement-par-niveau";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { applyPeriodicity, type Periodicity } from "@/config/scenarios/periodicity";
import { applyRoundsCount } from "@/config/scenarios/rounds";
import { applyScenarioVariability } from "@/config/scenarios/variability";

/**
 * LE SCÉNARIO JOUÉ : ce qu'une partie fige dans son snapshot à la création.
 *
 * Pipeline du snapshot (ADR-01 + ADR-10) : monde variable (la variante seedée
 * s'applique AVANT les réglages explicites de l'enseignant, qui gardent donc le
 * dernier mot) → paramètres économiques modulés (base trimestrielle) →
 * pondérations de l'IPG → taille du marché selon le nombre d'entreprises →
 * nombre de tours → périodicité → intensité d'événements du niveau → histoires
 * d'investissement du niveau → R&D retirée quand le niveau ne l'ouvre pas.
 *
 * Il vivait dans `createGameCore`. Il est sorti ici, pur, parce que deux
 * appelants doivent faire EXACTEMENT le même calcul : la création, et le rejeu
 * du bilan (`pedagogy/merite`), qui recompose le monde d'une autre graine pour
 * dire ce que les mêmes décisions auraient donné sur un autre marché. Deux
 * copies auraient divergé au premier réglage ajouté.
 */
export interface ReglagesDuScenarioJoue {
  /** Le scénario de base, tel que le registre (ou l'éditeur) le définit. */
  scenario: EngineScenarioConfig;
  /** La graine de la partie : elle ne sert ici qu'au monde variable. */
  seed: number;
  variableWorld?: boolean;
  /** Niveau 1-6 ; absent = comportement historique, sans préréglage. */
  level?: number;
  /** Déjà assainis (`sanitizeEconomicOverrides`) ; absents = aucun. */
  economicOverrides?: EconomicOverrides;
  scoringWeightOverrides?: ScoringWeightOverrides;
  /** Équipes humaines + bots : toutes se partagent le marché. */
  concurrents: number;
  roundsCount?: number;
  periodicity: Periodicity;
  investmentStories?: boolean;
  /**
   * Les leviers de la partie, quand ils diffèrent des préréglages actuels (une
   * partie créée avant la répartition d'octobre 2026, recomposée par le rejeu
   * du bilan). Absents : ceux du niveau, aujourd'hui.
   */
  leviers?: DifficultyPreset["decisions"];
  /** Le calendrier des histoires d'investissement ; absent : l'actuel. */
  calendrier?: CalendrierDesHistoires;
}

export function composerLeScenarioJoue(r: ReglagesDuScenarioJoue): EngineScenarioConfig {
  const preset = r.level ? presetByLevel.get(r.level as DifficultyPreset["level"]) : undefined;
  const base = r.variableWorld ? applyScenarioVariability(r.scenario, r.seed) : r.scenario;
  const snapshot = applyEventIntensity(
    applyPeriodicity(
      applyRoundsCount(
        applyMarketScale(
          applyScoringWeightOverrides(
            applyEconomicOverrides(base, r.economicOverrides),
            r.scoringWeightOverrides,
          ),
          r.concurrents,
        ),
        r.roundsCount,
      ),
      r.periodicity,
    ),
    preset?.eventProbabilityMultiplier ?? 1,
  );
  // Les histoires qui appellent l'investissement, posées selon le niveau. Une partie sans
  // niveau (aucun préréglage) garde le calendrier de son scénario, comme avant.
  const avecHistoires =
    preset && r.investmentStories
      ? avecInvestissementParNiveau(snapshot, preset.level, r.calendrier ?? "actuel")
      : snapshot;
  // R&D : un niveau qui ne l'ouvre pas ne doit pas laisser une référence à
  // développer hors de portée pour toute la partie. Le levier est retiré du
  // snapshot et les références à développer sont livrées prêtes.
  const leviers = r.leviers ?? preset?.decisions;
  const sansRd = preset && leviers && !leviers.rd ? withoutRd(avecHistoires) : avecHistoires;
  return avecLeGroupe(sansRd, leviers);
}

/**
 * LE NIVEAU 7 « GROUPE » : son bloc, posé au seul niveau qui ouvre la
 * croissance externe ou l'externalisation, et seulement pour un scénario qui
 * en porte un (`config/groupe`). La demande est celle du scénario, saisons,
 * pics et grand compte compris : s'y préparer fait partie du jeu. Les
 * tranches et le plafond du sous-traitant, les charges d'un site et son délai
 * de remise en route, écrits au trimestre, suivent la périodicité.
 *
 * LA TAILLE DE DÉPART. Les entreprises du niveau 7 démarrent plus grandes
 * (`groupe.depart`, appliqué à leur état par le moteur) ; la structure du
 * scénario qui suit la taille d'une entreprise suit le même facteur
 * (`agrandirLeScenario`), comme les tranches du sous-traitant. Le marché,
 * lui, reste celui du scénario.
 */
function avecLeGroupe(
  scenario: EngineScenarioConfig,
  leviers: DifficultyPreset["decisions"] | undefined,
): EngineScenarioConfig {
  if (!leviers || !(leviers.croissanceExterne || leviers.externalisation)) return scenario;
  const cfg = GROUPE_PAR_SCENARIO[scenario.code];
  if (!cfg) return scenario;
  const k = scenario.roundDays / 90;
  const f = cfg.depart?.facteur ?? 1;
  return {
    ...agrandirLeScenario(scenario, f),
    groupe: {
      ...(cfg.depart ? { depart: { ...cfg.depart } } : {}),
      valorisation: { ...cfg.valorisation },
      ...(leviers.croissanceExterne && cfg.rachat ? { rachat: { ...cfg.rachat } } : {}),
      ...(leviers.croissanceExterne && cfg.fournisseurs
        ? {
            fournisseurs: cfg.fournisseurs.map((f) => ({
              ...f,
              chargesFixesParTour: f.chargesFixesParTour * k,
              clientsExterieurs: { ...f.clientsExterieurs, chiffreDAffaires: f.clientsExterieurs.chiffreDAffaires * k },
              capacite: f.capacite * k,
              dureeDAmortissement: f.dureeDAmortissement / k,
              tauxDInteretParTour: f.tauxDInteretParTour * k,
            })),
          }
        : {}),
      ...(leviers.croissanceExterne && cfg.import ? { import: { ...cfg.import } } : {}),
      ...(leviers.croissanceExterne && cfg.sites
        ? {
            sites: cfg.sites.map((site) => ({
              ...site,
              chargesParTour: site.chargesParTour * k,
              delai: Math.max(1, Math.round(site.delai / k)),
            })),
          }
        : {}),
      ...(leviers.externalisation && cfg.sousTraitance
        ? {
            sousTraitance: Object.fromEntries(
              Object.entries(cfg.sousTraitance).map(([code, ref]) => [
                code,
                {
                  ...ref,
                  plafond: ref.plafond * k * f,
                  tranches: ref.tranches.map((t) => (t.jusqua === undefined ? { ...t } : { ...t, jusqua: t.jusqua * k * f })),
                },
              ]),
            ),
          }
        : {}),
    },
  };
}

/**
 * La structure du scénario qui suit la taille d'une entreprise, multipliée
 * par le facteur de départ : effectif inclus (et ses salaires dans les
 * charges fixes), plafonds d'effectif et d'embauche, budgets d'entretien et
 * de qualité de référence, découvert autorisé. Le reste des charges fixes, la
 * structure, ne bouge pas. Le marché (segments, saisons, prix, événements)
 * ne change pas.
 */
export function agrandirLeScenario(scenario: EngineScenarioConfig, facteur: number): EngineScenarioConfig {
  if (facteur === 1) return scenario;
  // La structure ne double pas avec l'atelier : les charges fixes ne gagnent
  // que les salaires de l'effectif inclus en plus.
  const inclusEnPlus = scenario.hr ? Math.round(scenario.hr.includedHeadcount * facteur) - scenario.hr.includedHeadcount : 0;
  return {
    ...scenario,
    fixedCostsPerRound: scenario.fixedCostsPerRound + inclusEnPlus * (scenario.hr?.salaryPerEmployeePerRound ?? 0),
    production: {
      ...scenario.production,
      maintenanceReference: scenario.production.maintenanceReference * facteur,
      qualityScale: scenario.production.qualityScale * facteur,
    },
    finance: { ...scenario.finance, overdraftLimit: scenario.finance.overdraftLimit * facteur },
    ...(scenario.hr
      ? {
          hr: {
            ...scenario.hr,
            includedHeadcount: Math.round(scenario.hr.includedHeadcount * facteur),
            maxHeadcount: Math.round(scenario.hr.maxHeadcount * facteur),
            maxHiresPerRound: Math.round(scenario.hr.maxHiresPerRound * facteur),
          },
        }
      : {}),
  };
}
