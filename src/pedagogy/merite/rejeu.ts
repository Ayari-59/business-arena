/**
 * LE REJEU D'UNE PARTIE SOLO : les mêmes décisions, un autre marché.
 *
 * Une partie de l'arène se joue sous UNE graine : elle fixe la texture du
 * marché (monde variable), les événements tirés, le bruit de la demande et le
 * tempérament des concurrents. Le résultat obtenu mêle donc deux choses : ce
 * que le joueur a décidé, et ce que ce tirage-là en a fait. Pour les séparer,
 * on rejoue EXACTEMENT ses décisions, tour par tour et telles quelles, sous
 * d'autres graines : à chaque graine, le marché, les événements et les bots
 * sont retirés ; seules les décisions du joueur restent.
 *
 * Ce module refait, sans base de données, ce que fait la clôture d'un tour
 * (`services/round-resolution.service.ts`) puis le classement à l'IPG
 * (`services/scoring.service.ts`) : décisions des bots (stratégie du profil,
 * personnalité tirée de la graine, réaction au prix humain du tour précédent),
 * simulation, scores du tour, IPG de partie et rang. Il refait aussi ce que la
 * base fait aux nombres : les états, le détail du marché et les décisions
 * relus d'un tour à l'autre passent par du JSON trié comme le `jsonb` de
 * Postgres, et les montants que le classement relit sont arrondis au centime
 * comme les colonnes `numeric`. C'est ce qui permet la GARDE DE VÉRITÉ : sous
 * la graine d'origine, le rejeu doit retrouver la partie jouée au centime près
 * (tests/integration/merite.test.ts). Sans elle, rien ne dirait que le rejeu
 * rejoue bien la partie, et pas une partie voisine.
 *
 * Ce que le rejeu tient FIXE, faute de pouvoir le rejouer : les réponses du
 * joueur aux situations (et les leviers qu'elles suggéraient), qui entrent
 * dans l'IPG. Sous un autre marché, d'autres situations auraient pu s'ouvrir ;
 * on garde celles qu'il a vécues. Le résultat net et la trésorerie n'en
 * dépendent pas.
 *
 * Tout est pur : mêmes entrées, mêmes sorties.
 */
import { valeurCreee } from "@/engine/groupe";
import { botDecisions, botPersonalityFromSeed, soldByProduct, ventesDuTour, type BotProfile, type LeviersOuverts } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";
import { SOURCE_RECONDUITE, decisionSourceOf, type DecisionSourceMap } from "@/config/decision-source";
import type { LeverDirection } from "@/config/scenarios/situation-kit";
import { proposedDecisionsFor } from "@/services/decision-baseline";
import {
  BPI_V2_DIMENSIONS,
  computeRoundScoresV2,
  gameBpi,
  scoringWeightsByName,
  type PedagogyInputsV2,
} from "@/scoring/bpi";
import { coherencePivots } from "@/scoring/coherence";

/* ---------------------------------------------------------------------------
 * CE QUE LA BASE FAIT AUX NOMBRES.
 * ------------------------------------------------------------------------- */

const encodeur = new TextEncoder();
/** L'ordre des clés d'un objet `jsonb` : les plus courtes d'abord, puis octet par octet. */
function ordreJsonb(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  const [x, y] = [encodeur.encode(a), encodeur.encode(b)];
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) return x[i]! - y[i]!;
  }
  return x.length - y.length;
}

/**
 * Une valeur telle que la base la rend après l'avoir gardée en `jsonb` : les
 * clés réordonnées, `undefined` retiré, `-0` devenu `0`. L'ordre des clés n'est
 * pas un détail : le moteur somme des `Object.values`, et une somme de
 * flottants dépend de son ordre.
 */
export function commeEnBase<T>(valeur: T): T {
  return JSON.parse(
    JSON.stringify(valeur, (_cle, v: unknown) => {
      if (v === null || typeof v !== "object" || Array.isArray(v)) return v;
      const trie: Record<string, unknown> = {};
      for (const k of Object.keys(v).sort(ordreJsonb)) trie[k] = (v as Record<string, unknown>)[k];
      return trie;
    }),
  ) as T;
}

/** Un montant tel que la colonne `numeric(…, 2)` le garde, relu en nombre. */
export const auCentime = (v: number) => Number((Math.round(v * 100) / 100).toString());

/* ---------------------------------------------------------------------------
 * LA PARTIE À REJOUER.
 * ------------------------------------------------------------------------- */

export interface EquipeDuRejeu {
  id: string;
  controller: "human" | "bot";
  botProfile: string | null;
}

/** Ce que le joueur a vécu d'un tour, hors marché : ses réponses aux situations. */
export interface PedagogieDuTour {
  situationScores: number[];
  leviers: { field: string; direction: LeverDirection }[];
}

export interface PartieARejouer {
  /** La graine jouée. */
  graine: number;
  /** L'équipe du joueur. */
  joueur: string;
  equipes: readonly EquipeDuRejeu[];
  /** Les états d'ouverture (tour 0), tels que la base les garde. */
  etatsInitiaux: readonly CompanyState[];
  tours: number;
  /**
   * Le monde d'une graine : le snapshot recomposé (monde variable), ou le
   * snapshot joué tel quel quand il ne peut pas l'être.
   */
  scenarioPour: (graine: number) => EngineScenarioConfig;
  /** Les décisions du joueur, tour par tour (indice 0 = tour 1), telles que la base les garde. */
  decisions: readonly RoundDecisions[];
  /** Les tours où la clôture a reconduit faute de saisie. */
  reconduits: readonly boolean[];
  /** Par tour, par équipe : les situations rendues et leurs leviers. Tenues fixes. */
  pedagogie: readonly Readonly<Record<string, PedagogieDuTour>>[];
  /** Les événements actifs au départ (vide pour une partie ordinaire). */
  evenementsInitiaux?: readonly EventInstance[];
  /**
   * Le niveau ouvre l'investissement sans les embauches : les concurrents
   * pilotés investissent sous le plafond, comme à la clôture.
   */
  investissementPlafonne?: boolean;
  /**
   * Les leviers figés de la partie : les concurrents pilotés et les valeurs
   * proposées s'y tiennent, comme à la clôture. Absents (partie d'avant la
   * répartition d'octobre 2026) : tout, comme alors.
   */
  leviers?: LeviersOuverts | null;
  /**
   * Les leviers du niveau tels que la clôture les passe au moteur
   * (`presetFromProfile(...).decisions`) : une crise n'est tirée qu'aux
   * parties qui offrent les plans de crise. Absents : aucune crise tirée.
   */
  leviersDuNiveau?: LeviersOuverts | null;
}

/** Qui décide pour le joueur : ses décisions jouées, ou une méthode. */
export type DecideurDuJoueur =
  | { type: "joueur" }
  | {
      type: "methode";
      decider: (ctx: {
        scenario: EngineScenarioConfig;
        state: CompanyState;
        roundIndex: number;
        lastSoldUnits?: number;
        lastSoldByProduct?: Record<string, number>;
        /**
         * Ce que l'équipe a sous les yeux de son tour passé, et rien d'autre :
         * son propre résultat (ventes, ruptures, coûts) et sa propre décision,
         * tels que la base les rend. Absents au premier tour.
         */
        resultatPrecedent?: CompanyRoundResult;
        decisionPrecedente?: RoundDecisions;
      }) => RoundDecisions;
    };

export interface IssueDUneEquipe {
  ipg: number;
  rang: number;
  resultatNetCumule: number;
  /** Le chiffre d'affaires cumulé : l'échelle d'un écart quand le résultat est proche de zéro. */
  chiffreDAffairesCumule: number;
  tresorerieFinale: number;
  /**
   * La trésorerie nette la plus basse des tours de la partie (fin de chaque tour) : le
   * creux que les décisions ont fait traverser à l'entreprise.
   */
  tresorerieLaPlusBasse: number;
  defaillant: boolean;
  /** Niveau 7 : la rentabilité totale par action du dernier tour (le rang s'y fait) et la valeur créée en euros. */
  rentabiliteTotale?: number;
  valeurCreee?: number;
}

export interface TourRejoue {
  /** Par équipe, les montants tels que les colonnes du tour les gardent. */
  parEquipe: Record<
    string,
    { revenue: string; netIncome: string; cash: string; netTreasury: string }
  >;
  /** Les codes d'événements visibles par chaque équipe ce tour. */
  evenements: Record<string, string[]>;
}

export interface IssueDuRejeu {
  graine: number;
  /** L'issue du joueur (ou de la méthode qui joue à sa place). */
  joueur: IssueDUneEquipe;
  sur: number;
  /** Le résultat net du joueur, tour par tour. */
  resultatParTour: number[];
  parEquipe: Record<string, IssueDUneEquipe>;
  tours: TourRejoue[];
}

const toMoney = (v: number) => (Math.round(v * 100) / 100).toString();

/**
 * Rejoue la partie sous une graine. Pour le joueur, ses décisions jouées
 * (`{ type: "joueur" }`) ou une méthode qui décide à sa place, tour après tour,
 * sur l'état qu'elle a elle-même produit.
 */
export function rejouer(
  partie: PartieARejouer,
  graine: number,
  decideur: DecideurDuJoueur = { type: "joueur" },
): IssueDuRejeu {
  const scenario = partie.scenarioPour(graine);
  const ids = partie.equipes.map((e) => e.id);
  const humaines = partie.equipes.filter((e) => e.controller === "human").map((e) => e.id);

  // L'ordre STABLE des entreprises passées au moteur, comme à la clôture : par id.
  let etats = commeEnBase([...partie.etatsInitiaux]).sort((a, b) => a.id.localeCompare(b.id));
  let evenements: EventInstance[] = commeEnBase([...(partie.evenementsInitiaux ?? [])]);
  let precedentes: Record<string, RoundDecisions> = {};
  let resultatsPrecedents: Record<string, CompanyRoundResult> = {};
  let netPrecedent: Record<string, number> = {};
  const toursRejoues: TourRejoue[] = [];
  const scoresParTour: Record<string, { index: number; bpi: number }[]> = {};
  const sommes: Record<string, Map<string, { sum: number; n: number }>> = {};
  const netCumule: Record<string, number> = {};
  const caCumule: Record<string, number> = {};
  const tresorerie: Record<string, number> = {};
  const creux: Record<string, number> = {};
  /** Niveau 7 : la dernière valeur de chaque entreprise. */
  const valeurs: Record<string, { rta: number; creee: number }> = {};
  const resultatParTour: number[] = [];
  const poids = scoringWeightsByName(scenario.scoring);
  for (const id of ids) {
    scoresParTour[id] = [];
    sommes[id] = new Map();
    netCumule[id] = 0;
    caCumule[id] = 0;
    tresorerie[id] = 0;
    creux[id] = Infinity;
  }

  for (let tour = 1; tour <= partie.tours; tour += 1) {
    const indice = tour - 1;
    // Ventes du tour précédent, relues comme la clôture les relit : le détail du
    // marché en `jsonb`, plus les adhérents conservés.
    const vendu: Record<string, number> = {};
    const venduParProduit: Record<string, Record<string, number>> = {};
    for (const [id, r] of Object.entries(resultatsPrecedents)) {
      const bySegment = commeEnBase(r.market.bySegment);
      vendu[id] = ventesDuTour(bySegment, commeEnBase(r.subscription ?? null));
      const parProduit = soldByProduct(scenario, bySegment);
      if (parProduit) venduParProduit[id] = parProduit;
    }
    const prixHumains = humaines
      .map((id) => precedentes[id]?.price)
      .filter((p): p is number => typeof p === "number" && p > 0);
    const humanAvgPrice = prixHumains.length
      ? prixHumains.reduce((a, c) => a + c, 0) / prixHumains.length
      : undefined;

    const decisions: Record<string, RoundDecisions> = {};
    const reconduites = new Set<string>();
    for (const e of partie.equipes) {
      const state = etats.find((s) => s.id === e.id);
      if (!state) throw new Error(`État manquant pour ${e.id}`);
      if (e.controller === "bot") {
        const profil = (e.botProfile ?? "balanced") as BotProfile;
        decisions[e.id] = botDecisions(profil, {
          scenario,
          state,
          roundIndex: tour,
          lastSoldUnits: vendu[e.id],
          lastSoldByProduct: venduParProduit[e.id],
          humanAvgPrice,
          personality: botPersonalityFromSeed(graine, profil),
          investissementPlafonne: partie.investissementPlafonne === true,
          leviers: partie.leviers ?? null,
        });
        continue;
      }
      if (e.id !== partie.joueur) throw new Error("Le rejeu ne connaît qu'un joueur humain");
      if (decideur.type === "methode") {
        decisions[e.id] = decideur.decider({
          scenario,
          state,
          roundIndex: tour,
          lastSoldUnits: vendu[e.id],
          lastSoldByProduct: venduParProduit[e.id],
          resultatPrecedent: resultatsPrecedents[e.id] ? commeEnBase(resultatsPrecedents[e.id]!) : undefined,
          decisionPrecedente: precedentes[e.id],
        });
      } else {
        const jouee = partie.decisions[indice];
        if (!jouee) throw new Error(`Décisions du tour ${tour} manquantes`);
        decisions[e.id] = jouee;
        if (partie.reconduits[indice]) reconduites.add(e.id);
      }
    }

    const sortie = simulateRound({
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: graine,
      ...(partie.leviersDuNiveau ? { leviers: partie.leviersDuNiveau } : {}),
    });

    // Les scores du tour, comme `persistRoundScores` les calcule.
    const entreprises = partie.equipes.map((e) => {
      const state = etats.find((s) => s.id === e.id);
      const proposees = proposedDecisionsFor({
        snapshot: scenario,
        state,
        roundIndex: tour,
        previousPayload: precedentes[e.id],
        // Le détail du tour passé, tel que la base le garde (`marketDetail`).
        lastMarket: resultatsPrecedents[e.id] ? commeEnBase(resultatsPrecedents[e.id]!.market.bySegment) : null,
        lastBreakEven: resultatsPrecedents[e.id]?.breakeven.breakEvenUnits ?? null,
        lastNetIncome: resultatsPrecedents[e.id]?.incomeStatement.netIncome ?? null,
        leviers: partie.leviers ?? null,
      });
      const source: DecisionSourceMap = reconduites.has(e.id)
        ? SOURCE_RECONDUITE
        : decisionSourceOf(decisions[e.id]!, proposees);
      const peda = partie.pedagogie[indice]?.[e.id];
      const pedagogy: PedagogyInputsV2 = {
        situationScores: peda?.situationScores ?? [],
        carried: reconduites.has(e.id),
        coherence: coherencePivots({
          levers: peda?.leviers ?? [],
          source,
          decisions: decisions[e.id]!,
          proposed: proposees,
        }),
        previousNetIncome: netPrecedent[e.id] ?? 0,
      };
      return { companyId: e.id, result: sortie.results[e.id]!, pedagogy };
    });
    const scores = computeRoundScoresV2(scenario, entreprises);
    for (const s of scores) {
      // Le classement relit les dimensions arrondies à deux décimales.
      let bpi = 0;
      for (const dimension of BPI_V2_DIMENSIONS) {
        const valeur = Number(s.normalized[dimension].toFixed(2));
        bpi += (poids[dimension] ?? 0) * valeur;
        const agg = sommes[s.companyId]!.get(dimension) ?? { sum: 0, n: 0 };
        agg.sum += valeur;
        agg.n += 1;
        sommes[s.companyId]!.set(dimension, agg);
      }
      scoresParTour[s.companyId]!.push({ index: tour, bpi });
    }

    const visibles = (id: string) =>
      sortie.newEvents.filter((e) => e.scope === "market" || e.companyId === id).map((e) => e.code);
    const tourRejoue: TourRejoue = { parEquipe: {}, evenements: {} };
    for (const id of ids) {
      const r = sortie.results[id]!;
      tourRejoue.parEquipe[id] = {
        revenue: toMoney(r.incomeStatement.revenue),
        netIncome: toMoney(r.incomeStatement.netIncome),
        cash: toMoney(r.balanceSheet.cash),
        netTreasury: toMoney(r.functionalBalance.netTreasury),
      };
      tourRejoue.evenements[id] = visibles(id);
      netCumule[id] = netCumule[id]! + auCentime(r.incomeStatement.netIncome);
      caCumule[id] = caCumule[id]! + auCentime(r.incomeStatement.revenue);
      tresorerie[id] = auCentime(r.functionalBalance.netTreasury);
      creux[id] = Math.min(creux[id]!, tresorerie[id]!);
      const v = r.groupe?.valeur;
      if (v && scenario.groupe) {
        valeurs[id] = { rta: v.rentabiliteTotale, creee: valeurCreee(v, scenario.groupe.valorisation.actionsInitiales) };
      }
    }
    toursRejoues.push(tourRejoue);
    resultatParTour.push(auCentime(sortie.results[partie.joueur]!.incomeStatement.netIncome));

    // Ce que le tour suivant relira de la base.
    netPrecedent = Object.fromEntries(
      ids.map((id) => [id, auCentime(sortie.results[id]!.incomeStatement.netIncome)]),
    );
    precedentes = commeEnBase(decisions);
    resultatsPrecedents = sortie.results;
    etats = commeEnBase(sortie.companies).sort((a, b) => a.id.localeCompare(b.id));
    evenements = commeEnBase(sortie.events);
  }

  // Le classement final, comme `updateRankings` le calcule.
  const lignes = ids.map((id) => {
    const financier = sommes[id]!.get("financial");
    return {
      id,
      bpi: gameBpi(scoresParTour[id]!),
      financialAvg: financier ? financier.sum / financier.n : 0,
      lastTreasury: tresorerie[id]!,
    };
  });
  const defaillante = (id: string) => (etats.find((s) => s.id === id)?.status ?? "active") === "defaillant";
  if (scenario.groupe) {
    // Niveau 7 : à la rentabilité totale pour l'actionnaire, comme `updateRankings`.
    lignes.sort(
      (a, b) =>
        Number(defaillante(a.id)) - Number(defaillante(b.id)) ||
        (valeurs[b.id]?.rta ?? -Infinity) - (valeurs[a.id]?.rta ?? -Infinity) ||
        b.bpi - a.bpi,
    );
  } else {
    lignes.sort(
      (a, b) => b.bpi - a.bpi || b.financialAvg - a.financialAvg || b.lastTreasury - a.lastTreasury,
    );
  }
  const parEquipe: Record<string, IssueDUneEquipe> = {};
  lignes.forEach((l, i) => {
    parEquipe[l.id] = {
      // L'IPG tel que le classement le garde : deux décimales.
      ipg: Number(l.bpi.toFixed(2)),
      rang: i + 1,
      resultatNetCumule: Math.round(netCumule[l.id]! * 100) / 100,
      chiffreDAffairesCumule: Math.round(caCumule[l.id]! * 100) / 100,
      tresorerieFinale: tresorerie[l.id]!,
      tresorerieLaPlusBasse: Number.isFinite(creux[l.id]!) ? creux[l.id]! : tresorerie[l.id]!,
      defaillant: defaillante(l.id),
      ...(valeurs[l.id] ? { rentabiliteTotale: valeurs[l.id]!.rta, valeurCreee: Math.round(valeurs[l.id]!.creee * 100) / 100 } : {}),
    };
  });
  return {
    graine,
    joueur: parEquipe[partie.joueur]!,
    sur: ids.length,
    resultatParTour,
    parEquipe,
    tours: toursRejoues,
  };
}

/**
 * UNE PARTIE DÉCIDÉE PAR UNE MÉTHODE, PUIS GELÉE : la méthode joue le marché de
 * la partie (sa graine), tour par tour, avec ce que le joueur voyait ; ses
 * décisions sont gardées telles que la base les garderait, et la partie rendue
 * les porte comme si elles avaient été jouées.
 *
 * C'est le seul mécanisme par lequel un étalon devient comparable au candidat :
 * rejouée sous les marchés possibles, cette partie rejoue des décisions FIXES,
 * exactement comme celles du candidat. Les deux étalons passent par ici
 * (`partieDeLaReference`, `rejeuxDeLEtalon`), pour qu'aucun n'ait un second
 * mécanisme à lui.
 */
export function partieFigee(
  partie: PartieARejouer,
  decider: Extract<DecideurDuJoueur, { type: "methode" }>["decider"],
): PartieARejouer {
  const prises: RoundDecisions[] = [];
  rejouer(partie, partie.graine, {
    type: "methode",
    decider: (c) => {
      const d = decider(c);
      prises.push(commeEnBase(d));
      return d;
    },
  });
  return {
    ...partie,
    decisions: prises,
    reconduits: prises.map(() => false),
    // L'IPG d'un étalon ne juge pas (le critère est le résultat net) : il n'a
    // répondu à aucune situation.
    pedagogie: prises.map(() => ({})),
  };
}
