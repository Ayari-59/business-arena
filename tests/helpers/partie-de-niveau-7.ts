import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { presetFromProfile } from "@/config/difficulty";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";
import { auCentime } from "./partie-nova-gamme";

/**
 * UNE PARTIE DE NIVEAU 7 CRÉÉE AVANT LE RETRAIT DU NIVEAU, REJOUÉE AU CENTIME.
 *
 * Le niveau 7 « Groupe » est retiré du produit (décision du propriétaire,
 * octobre 2026) : plus aucun écran ne le propose, plus aucune création ne
 * l'accepte. LES PARTIES DÉJÀ CRÉÉES À CE NIVEAU CONTINUENT DE SE JOUER, et
 * c'est ce que ce rejeu démontre. Deux choses les protègent, et le rejeu passe
 * par les deux :
 *
 *   · LEUR INSTANTANÉ. Une partie ne relit pas la configuration : elle rejoue
 *     le snapshot figé à sa création (`scenario` du témoin, relu par
 *     `parseScenarioConfig` comme à chaque clôture), bloc `groupe` compris.
 *   · LE GEL DE SES LEVIERS. Son `difficultyProfile` porte sa liste de leviers,
 *     croissance externe et externalisation comprises ; `presetFromProfile` la
 *     relit telle quelle, avec le monde du niveau (aucun indice, aléas doublés).
 *
 * Le témoin (`tests/fixtures/partie-de-niveau-7.json`) a été enregistré AVANT
 * le retrait et NE SE RÉGÉNÈRE PAS : un écart est une régression.
 */

export interface TemoinDuNiveau7 {
  note: string;
  seed: number;
  /** Le `difficultyProfile` de la partie, tel qu'il est écrit en base à sa création. */
  profil: { difficulty: { level: number; name: string; decisions: Record<string, boolean> } };
  /** L'instantané de la partie, tel qu'il est écrit en base (JSON). */
  scenario: Record<string, unknown>;
  /** Les états d'ouverture des entreprises, tels qu'ils sont posés à la création. */
  etats: CompanyState[];
  /** Le résumé au centime de chaque tour joué. */
  tours: unknown[];
}

/**
 * Rejoue la partie du témoin, de son premier tour au dernier, et rend le même
 * résumé au centime : compte de résultat, bilan, flux, production, seuil, part
 * de marché, valeur pour l'actionnaire, et les événements tirés.
 */
export function rejouerLaPartieDeNiveau7(temoin: TemoinDuNiveau7): unknown[] {
  const scenario = parseScenarioConfig(temoin.scenario);
  // LES LEVIERS FIGÉS DE LA PARTIE, relus de son profil : c'est le gel, pas la
  // configuration du produit, qui ouvre encore le rachat et la sous-traitance.
  const leviers = presetFromProfile(temoin.profil).decisions;
  let etats: CompanyState[] = structuredClone(temoin.etats).sort((a, b) => a.id.localeCompare(b.id));
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  const tours: unknown[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const etat of etats) {
      const p = precedents[etat.id];
      decisions[etat.id] = botDecisions((etat.botProfile ?? "balanced") as BotProfile, {
        scenario,
        state: etat,
        roundIndex: tour,
        lastSoldUnits: p ? soldUnits(p) : undefined,
        lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
        leviers,
      });
    }
    const sortie = simulateRound({
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: temoin.seed,
    });
    tours.push(
      auCentime(
        Object.fromEntries(
          etats.map((e) => {
            const res = sortie.results[e.id]!;
            return [
              e.id,
              {
                incomeStatement: res.incomeStatement,
                balanceSheet: res.balanceSheet,
                cashFlow: res.cashFlow,
                production: res.production,
                breakeven: res.breakeven,
                totalShare: res.market.totalShare,
                // Ce sur quoi le niveau 7 juge l'équipe, et ce que ses leviers font.
                groupe: res.groupe ?? null,
                events: sortie.newEvents.map((x) => x.code),
              },
            ];
          }),
        ),
      ),
    );
    precedents = sortie.results;
    etats = [...sortie.companies].sort((a, b) => a.id.localeCompare(b.id));
    evenements = sortie.events;
  }
  return tours;
}
