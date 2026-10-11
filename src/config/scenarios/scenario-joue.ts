import type { EngineScenarioConfig } from "@/engine/types";
import { withoutRd } from "@/engine/gamme";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  applyScoringWeightOverrides,
  presetByLevel,
  type EconomicOverrides,
  type ScoringWeightOverrides,
} from "@/config/difficulty";
import { avecInvestissementParNiveau } from "@/config/investissement-par-niveau";
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
}

export function composerLeScenarioJoue(r: ReglagesDuScenarioJoue): EngineScenarioConfig {
  const preset = r.level ? presetByLevel.get(r.level as 1 | 2 | 3 | 4 | 5 | 6) : undefined;
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
    preset && r.investmentStories ? avecInvestissementParNiveau(snapshot, preset.level) : snapshot;
  // R&D : un niveau qui ne l'ouvre pas ne doit pas laisser une référence à
  // développer hors de portée pour toute la partie. Le levier est retiré du
  // snapshot et les références à développer sont livrées prêtes.
  return preset && !preset.decisions.rd ? withoutRd(avecHistoires) : avecHistoires;
}
