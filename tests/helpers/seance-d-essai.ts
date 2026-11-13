import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { leviersFigesDuProfil, presetByLevel, profilDuNiveau, type DifficultyPreset } from "@/config/difficulty";
import { botDecisions, botPersonalityFromSeed, soldByProduct, ventesDuTour, type BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import { simulateRound } from "@/engine/simulation";
import { auPas, proposedDecisionsFor } from "@/services/decision-baseline";
import { carryOverDecisions } from "@/services/decision.service";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * LA SÉANCE D'ESSAI DU 13 NOVEMBRE 2026, REJOUÉE SANS NAVIGATEUR.
 *
 * Une partie de classe aux réglages par défaut : NOVA, niveau 3, 4 équipes et
 * 1 concurrent simulé (SoundBox), au trimestre, monde variable, histoires
 * d'investissement, 6 tours. Chaque équipe valide la proposition du formulaire,
 * sauf les champs qu'elle a saisis dans la séance (`zz-seance-3-tour.e2e.ts`) :
 *
 *  · Sonora (prudente) : 65 €, 4 500 produites, marketing 6 000 €, commande acceptée ;
 *  · BassBoost (le prix bas) : 42 € puis 39 € puis 49 €, 7 000 produites, marketing
 *    12 000 €, fournisseur à bas coût, 2 embauches au tour 1, commande acceptée ;
 *  · Écho Premium (« Viser la valeur ») : 78 €, 3 200 produites, marketing 8 000 €,
 *    qualité 5 000 €, fournisseur premium, étude de marché aux tours 1 et 2,
 *    commande refusée ;
 *  · l'équipe 4 : 60 €, le reste proposé ; au tour 2 elle ne valide pas, et ses
 *    décisions sont reconduites.
 *
 * La graine de la séance n'est pas connue : la partie se rejoue sur plusieurs graines.
 */

export type NomDEquipe = "Sonora" | "BassBoost" | "Écho Premium" | "Équipe 4";

export interface ChoixDuTour {
  prix: number;
  production?: number;
  commande: boolean;
  marketing?: number;
  qualite?: number;
  fournisseur?: string;
  embauches?: number;
  etude?: boolean;
}

export type Trajectoire = (tour: number) => ChoixDuTour;

export const TRAJECTOIRES: Record<NomDEquipe, Trajectoire> = {
  Sonora: () => ({ prix: 65, production: 4500, commande: true, marketing: 6000 }),
  BassBoost: (t) => ({
    prix: t === 1 ? 42 : t === 2 ? 39 : 49,
    production: 7000,
    commande: true,
    marketing: 12_000,
    fournisseur: "lowcost",
    embauches: t === 1 ? 2 : 0,
  }),
  "Écho Premium": (t) => ({
    prix: 78,
    production: 3200,
    commande: false,
    marketing: 8000,
    qualite: 5000,
    fournisseur: "premium",
    etude: t <= 2,
  }),
  "Équipe 4": () => ({ prix: 60, commande: true }),
};

/**
 * UNE ÉQUIPE QUI FAIT N'IMPORTE QUOI : un prix sous le coût variable, l'atelier à fond et
 * un gros budget de marketing, à chaque tour. Elle doit pouvoir s'arrêter, au tour 4 ou après.
 */
export const N_IMPORTE_QUOI: Trajectoire = () => ({
  prix: 25,
  production: 7000,
  commande: true,
  marketing: 30_000,
  qualite: 15_000,
});

export interface LigneDuTour {
  tour: number;
  equipe: string;
  statut: "active" | "defaillant";
  tresorerieNette: number;
  resultat: number;
  ventes: number;
}

export interface ReglageDeLaSeance {
  graine: number;
  /** Les équipes humaines jouées, dans l'ordre de la séance. */
  equipes?: { nom: string; trajectoire: Trajectoire; absentAuTour?: number }[];
  tours?: number;
  /** Le genre de partie : la classe de la séance, ou une partie solo au même niveau. */
  genre?: "class" | "solo";
  niveau?: number;
  /**
   * La partie composée SANS son genre, comme avant la règle « pas avant le tour 4 » :
   * le scénario de la même classe, tel que la création le figeait jusque-là.
   */
  commeAvant?: boolean;
  /** Pour mesurer : la sortie brute de chaque tour, avec les décisions jouées. */
  espion?: (
    tour: number,
    sortie: ReturnType<typeof simulateRound>,
    decisions: Record<string, RoundDecisions>,
    ouverture: { scenario: EngineScenarioConfig; etats: CompanyState[]; evenements: EventInstance[]; equipes: { id: string; nom: string }[] },
  ) => void;
}

export const EQUIPES_DE_LA_SEANCE: NonNullable<ReglageDeLaSeance["equipes"]> = [
  { nom: "Sonora", trajectoire: TRAJECTOIRES.Sonora },
  { nom: "BassBoost", trajectoire: TRAJECTOIRES.BassBoost },
  { nom: "Écho Premium", trajectoire: TRAJECTOIRES["Écho Premium"] },
  { nom: "Équipe 4", trajectoire: TRAJECTOIRES["Équipe 4"], absentAuTour: 2 },
];

/** Le scénario figé d'une partie, comme `createGameCore` le compose. */
export function scenarioDeLaSeance(r: { graine: number; concurrents: number; genre?: "class" | "solo"; niveau: number }): EngineScenarioConfig {
  const def = scenarioByCode(scenarioCodeForLevel("nova", r.niveau));
  return composerLeScenarioJoue({
    scenario: def.scenario,
    seed: r.graine,
    variableWorld: true,
    level: r.niveau,
    concurrents: r.concurrents,
    periodicity: "quarter",
    investmentStories: true,
    ...(r.genre === "class" ? { genre: "class" as const } : {}),
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
  });
}

function appliquer(base: RoundDecisions, c: ChoixDuTour): RoundDecisions {
  return auPas({
    ...base,
    price: c.prix,
    ...(c.production !== undefined ? { productionPlan: c.production } : {}),
    ...(c.marketing !== undefined ? { marketingBudget: c.marketing } : {}),
    ...(c.qualite !== undefined ? { qualityBudget: c.qualite } : {}),
    ...(c.fournisseur !== undefined ? { supplierChoice: c.fournisseur } : {}),
    acceptOrder: c.commande,
    ...(c.embauches ? { hr: { ...(base.hr ?? {}), hire: c.embauches } } : {}),
    ...(c.etude ? { studies: { ...(base.studies ?? {}), market: true } } : {}),
  });
}

/** La partie, tour par tour : une ligne par équipe humaine et par tour. */
export function jouerLaSeance(r: ReglageDeLaSeance): LigneDuTour[] {
  const niveau = r.niveau ?? 3;
  const genre = r.genre ?? "class";
  const def = scenarioByCode(scenarioCodeForLevel("nova", niveau));
  const humaines = r.equipes ?? EQUIPES_DE_LA_SEANCE;
  const bots = genre === "class" ? def.bots.slice(0, 1) : def.bots.slice(0, 2);
  const scenario = scenarioDeLaSeance({
    graine: r.graine,
    concurrents: humaines.length + bots.length,
    genre: r.commeAvant ? undefined : genre,
    niveau,
  });
  const preset = presetByLevel.get(niveau as DifficultyPreset["level"])!;
  const leviers = leviersFigesDuProfil({ difficulty: profilDuNiveau(preset) });
  const plafonne = investissementPlafonne(preset.decisions);
  const equipes = [
    ...humaines.map((h, i) => ({ id: `h${i}`, nom: h.nom, h, profil: undefined as BotProfile | undefined })),
    ...bots.map((b, i) => ({ id: `z-bot${i}`, nom: b.name, h: undefined, profil: b.profile as BotProfile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(def.company(e.id, e.nom, e.profil ? "bot" : "human", e.profil), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  const precedentes: Record<string, RoundDecisions> = {};
  const lignes: LigneDuTour[] = [];
  const tours = r.tours ?? 6;
  for (let tour = 1; tour <= tours; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    const prixHumains = humaines.map((_, i) => precedentes[`h${i}`]?.price).filter((p): p is number => !!p);
    const humanAvgPrice = prixHumains.length ? prixHumains.reduce((a, b) => a + b, 0) / prixHumains.length : undefined;
    for (const e of equipes) {
      const etat = etats.find((c) => c.id === e.id)!;
      const p = precedents[e.id];
      if (e.profil) {
        decisions[e.id] = botDecisions(e.profil, {
          scenario,
          state: etat,
          roundIndex: tour,
          lastSoldUnits: p ? ventesDuTour(p.market.bySegment, p.subscription) : undefined,
          lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
          humanAvgPrice,
          personality: botPersonalityFromSeed(r.graine, e.profil),
          leviers,
          investissementPlafonne: plafonne,
        });
        continue;
      }
      if (e.h!.absentAuTour === tour && precedentes[e.id]) {
        decisions[e.id] = carryOverDecisions(precedentes[e.id]!);
        continue;
      }
      const proposee = proposedDecisionsFor({
        snapshot: scenario,
        state: etat,
        roundIndex: tour,
        previousPayload: precedentes[e.id] ?? null,
        lastMarket: p?.market.bySegment ?? null,
        lastBreakEven: p?.breakeven.breakEvenUnits ?? null,
        lastNetIncome: p?.incomeStatement.netIncome ?? null,
        leviers,
      });
      decisions[e.id] = appliquer(proposee, e.h!.trajectoire(tour));
    }
    const sortie = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: evenements, seed: r.graine });
    r.espion?.(tour, sortie, decisions, {
      scenario,
      etats,
      evenements,
      equipes: equipes.filter((e) => !e.profil).map((e) => ({ id: e.id, nom: e.nom })),
    });
    for (const e of equipes) {
      if (e.profil) continue;
      const res = sortie.results[e.id]!;
      const etat = sortie.companies.find((c) => c.id === e.id)!;
      lignes.push({
        tour,
        equipe: e.nom,
        statut: etat.status === "defaillant" ? "defaillant" : "active",
        tresorerieNette: Math.round(res.functionalBalance.netTreasury),
        resultat: Math.round(res.incomeStatement.netIncome),
        ventes: Math.round(ventesDuTour(res.market.bySegment, res.subscription)),
      });
      precedentes[e.id] = decisions[e.id]!;
    }
    etats = sortie.companies;
    evenements = sortie.events;
    precedents = sortie.results;
  }
  return lignes;
}

/** Le premier tour où l'équipe est à l'arrêt ; `null` si elle tient toute la partie. */
export function premierArret(lignes: LigneDuTour[], equipe: string): number | null {
  return lignes.find((l) => l.equipe === equipe && l.statut === "defaillant")?.tour ?? null;
}
