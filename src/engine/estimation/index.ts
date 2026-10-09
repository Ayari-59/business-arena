import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  IncomeStatement,
  OrderOfferDef,
  RoundDecisions,
  SalesEstimate,
  SegmentCode,
  SegmentConfig,
} from "../types";
import { mapGammeSegments, toGamme } from "../gamme";
import { simulateRound } from "../simulation";

/**
 * LE RÉSULTAT ESTIMÉ : CE QUE L'ÉQUIPE CROIT, AVANT QUE LE MARCHÉ NE RÉPONDE.
 *
 * L'équipe dit combien elle pense vendre, référence par référence ; on lui rend
 * le compte de résultat, la trésorerie et le stock que donneraient ces ventes,
 * avec SES décisions et l'état de SON entreprise à l'ouverture du tour.
 *
 * AUCUNE COMPTABILITÉ À PART. L'estimation est un appel de `simulateRound`, le
 * moteur du tour réel, avec une demande imposée (`SimulationInput.estimation`) :
 * production et capacités, stocks au CUMP, rebuts et retours, commandes fermes
 * et commande exceptionnelle, RH, RSE, R&D, amortissements, échéances et
 * intérêts, créances et dettes fournisseurs, découvert, impôt et report
 * déficitaire. Un compte estimé qui suivrait sa propre formule finirait par
 * diverger du compte réel sans que personne ne le voie ; celui-ci ne le peut
 * pas, et un test le prouve : rejoué avec les ventes réellement constatées, il
 * rend le résultat réel à l'euro près (`tests/engine/estimation.test.ts`).
 *
 * AUCUNE FUITE DU MARCHÉ. L'entreprise est seule dans ce tour estimé : ni
 * concurrents, ni demande du marché, ni élasticité. Les événements qui comptent
 * sont ceux que l'équipe connaît à l'ouverture (`dossier.events`) : ceux en
 * cours, ceux que l'enseignant a posés, et LE TIRAGE DU TOUR, que l'arène
 * retourne déjà face visible à l'ouverture (`peekEventDraw`, le courrier du
 * tour). Le navigateur reçoit un scénario expurgé des paramètres du marché
 * (`expurgerLeScenario`) et JAMAIS la graine : l'estimation n'en a pas besoin,
 * et des tests le vérifient.
 *
 * CE QUI RESTE HORS DE PORTÉE, ET C'EST VOULU : ce qui se tire à la CLÔTURE et
 * que personne ne peut connaître en décidant — une carte événement RSE (bad
 * buzz, sanction, éco-subvention) et une rupture d'approvisionnement. L'estimé
 * suppose le tour sans mauvaise surprise ; l'écart qu'une surprise creuse est
 * précisément ce que « le marché répond » montre. Chaque écart est nommé et
 * tenu par son propre test (`tests/engine/estimation.test.ts`).
 */

/** Ce qu'il faut pour estimer un tour, préparé à l'ouverture (côté serveur). */
export interface DossierDEstimation {
  /** Le scénario joué ; expurgé des paramètres du marché quand il part au navigateur. */
  scenario: EngineScenarioConfig;
  /** L'état de l'entreprise à l'ouverture du tour (clôture du tour précédent). */
  state: CompanyState;
  roundIndex: number;
  /**
   * Les événements qui joueront ce tour, tels que l'équipe les connaît à
   * l'ouverture : ceux en cours, ceux que l'enseignant a posés, et le tirage du
   * tour (déjà montré en courrier). C'est exactement la liste que la clôture
   * passera au moteur, d'où l'égalité du compte estimé et du compte réel.
   */
  events: EventInstance[];
  /** La commande exceptionnelle annoncée pour ce tour ; null sans commande. */
  orderOffer: OrderOfferDef | null;
  /**
   * La répartition des ventes d'une référence entre ses clientèles (poids par
   * segment) : le délai de règlement et la commission dépendent du canal. Par
   * défaut, celle que l'équipe a constatée au tour passé (`repartitionDesVentes`).
   */
  repartition: Record<SegmentCode, number>;
  /** Une subvention exceptionnelle déjà accordée pour ce tour, s'il y en a une. */
  rescueSubsidy?: number;
}

export interface ReferenceEstimee {
  code: string;
  /** Ce que l'équipe pense vendre au marché. */
  estimees: number;
  /** Ce qu'elle pourra effectivement livrer au marché (stock + production du tour). */
  livrables: number;
  /** Ce qui manquera si l'estimation se réalise : estimées − livrables. */
  manquantes: number;
  /** Le stock de fin de tour, en unités. */
  stockFinal: number;
}

export interface ResultatEstime {
  references: ReferenceEstimee[];
  ventesEstimees: number;
  ventesLivrables: number;
  manquantes: number;
  /** Chiffre d'affaires du tour, commandes fermes et commande exceptionnelle comprises. */
  chiffreDAffaires: number;
  resultatNet: number;
  /** Trésorerie nette de fin de tour, celle que le rituel du marché affiche. */
  tresorerieNette: number;
  /** Le stock final, en unités et en valeur (CUMP). */
  stockFinal: { unites: number; valeur: number };
  /** Le compte de résultat estimé, ligne à ligne. */
  compte: IncomeStatement;
  /** Le résultat complet du tour estimé, pour qui veut aller plus loin (tests, serveur). */
  resultat: CompanyRoundResult;
}

/** Les ventes estimées d'une référence, réparties entre ses segments selon `repartition`. */
function demandeParSegment(
  segments: readonly SegmentConfig[],
  unites: number,
  repartition: Record<SegmentCode, number>,
): Record<SegmentCode, number> {
  const poids = segments.map((s) => Math.max(0, repartition[s.code] ?? 0));
  const total = poids.reduce((a, b) => a + b, 0);
  const demande: Record<SegmentCode, number> = {};
  segments.forEach((s, i) => {
    // Sans repère (aucune vente passée, aucun poids) : parts égales.
    const part = total > 0 ? poids[i]! / total : 1 / segments.length;
    demande[s.code] = Math.max(0, unites) * part;
  });
  return demande;
}

/**
 * Estime le tour : les décisions du formulaire, les ventes que l'équipe croit
 * faire (par code de référence ; mono-produit : le code du produit), et le
 * dossier d'ouverture. Fonction pure et déterministe.
 */
export function estimerLeTour(
  dossier: DossierDEstimation,
  decisions: RoundDecisions,
  ventes: Record<string, number>,
): ResultatEstime {
  const { scenario, state } = dossier;
  const gamme = toGamme(scenario);
  const demande: Record<SegmentCode, number> = {};
  for (const p of gamme) {
    Object.assign(
      demande,
      demandeParSegment(p.market.segments, ventes[p.code] ?? 0, dossier.repartition),
    );
  }
  const sortie = simulateRound({
    scenario,
    roundIndex: dossier.roundIndex,
    companies: [state],
    decisions: { [state.id]: decisions },
    activeEvents: dossier.events,
    // Aucun tirage en estimation : la graine ne sert à rien, et le navigateur
    // ne la connaît pas.
    seed: 0,
    ...(dossier.rescueSubsidy && dossier.rescueSubsidy > 0
      ? { rescueSubsidies: { [state.id]: dossier.rescueSubsidy } }
      : {}),
    estimation: { demand: { [state.id]: demande }, orderOffer: dossier.orderOffer },
  });
  const resultat = sortie.results[state.id]!;
  const suivant = sortie.companies[0]!;
  const multi = gamme.length > 1;

  const references: ReferenceEstimee[] = gamme.map((p) => {
    const estimees = Math.max(0, ventes[p.code] ?? 0);
    const livrables = p.market.segments.reduce(
      (s, seg) => s + (resultat.market.bySegment[seg.code]?.sold ?? 0),
      0,
    );
    const stock = multi
      ? (suivant.finishedGoodsByProduct?.[p.code]?.quantity ?? 0)
      : suivant.finishedGoods.quantity;
    // Un reste de virgule flottante n'est pas une rupture : sous l'unité, rien
    // ne manque.
    const manque = estimees - livrables;
    return {
      code: p.code,
      estimees,
      livrables,
      manquantes: manque < 0.5 ? 0 : manque,
      stockFinal: stock,
    };
  });
  const somme = (f: (r: ReferenceEstimee) => number) => references.reduce((s, r) => s + f(r), 0);
  return {
    references,
    ventesEstimees: somme((r) => r.estimees),
    ventesLivrables: somme((r) => r.livrables),
    manquantes: somme((r) => r.manquantes),
    chiffreDAffaires: resultat.incomeStatement.revenue,
    resultatNet: resultat.incomeStatement.netIncome,
    tresorerieNette: resultat.functionalBalance.netTreasury,
    stockFinal: {
      unites: suivant.finishedGoods.quantity,
      valeur: resultat.balanceSheet.inventoryValue,
    },
    compte: resultat.incomeStatement,
    resultat,
  };
}

/** Ce que la validation garde de l'estimation, avec les décisions du tour. */
export function estimationAConserver(
  ventes: Record<string, number>,
  estime: ResultatEstime | null,
): SalesEstimate {
  const byProduct = Object.fromEntries(
    Object.entries(ventes).map(([code, n]) => [code, Math.max(0, n)]),
  );
  return {
    byProduct,
    units: Object.values(byProduct).reduce((a, b) => a + b, 0),
    ...(estime
      ? {
          estimate: {
            revenue: estime.chiffreDAffaires,
            netIncome: estime.resultatNet,
            netTreasury: estime.tresorerieNette,
            deliverableUnits: estime.ventesLivrables,
          },
        }
      : {}),
  };
}

/**
 * LA RÉPARTITION PAR DÉFAUT : celle que l'équipe a constatée. Les ventes du
 * tour passé, segment par segment (ses propres résultats, qu'elle a sous les
 * yeux). Au premier tour, ou pour une référence qui n'a rien vendu, la
 * répartition suit la taille de base des clientèles ouvertes ce tour : une
 * proportion, jamais un volume.
 */
export function repartitionDesVentes(
  scenario: EngineScenarioConfig,
  roundIndex: number,
  dernier: Pick<CompanyRoundResult, "market"> | null,
): Record<SegmentCode, number> {
  const repartition: Record<SegmentCode, number> = {};
  for (const p of toGamme(scenario)) {
    const vendus = p.market.segments.map((s) => dernier?.market.bySegment[s.code]?.sold ?? 0);
    const total = vendus.reduce((a, b) => a + b, 0);
    p.market.segments.forEach((s, i) => {
      const saison = s.seasonality?.[roundIndex - 1] ?? 1;
      repartition[s.code] = total > 0 ? vendus[i]! / total : Math.max(0, s.size * saison);
    });
    // Les poids de taille sont ramenés à une proportion : seule la part sort.
    if (total <= 0) {
      const somme = p.market.segments.reduce((a, s) => a + repartition[s.code]!, 0);
      for (const s of p.market.segments) {
        repartition[s.code] = somme > 0 ? repartition[s.code]! / somme : 0;
      }
    }
  }
  return repartition;
}

/**
 * LE SCÉNARIO SANS SON MARCHÉ, pour le navigateur. L'estimation n'en lit que
 * les codes de segments, leurs délais de règlement et leurs commissions : tout
 * ce qui fait la demande (taille, croissance, élasticité, seuils, sensibilités,
 * fidélité, intensité concurrentielle, attraction extérieure) est neutralisé,
 * comme le paquet d'événements à tirer et le pool des commandes. Ce que le
 * joueur voit déjà (prix usuel des clientèles, saisonnalité) reste.
 */
export function expurgerLeScenario(scenario: EngineScenarioConfig): EngineScenarioConfig {
  const neutre = (s: SegmentConfig): SegmentConfig => ({
    code: s.code,
    name: s.name,
    size: 0,
    growth: 0,
    priceElasticity: -1,
    refPrice: s.refPrice,
    minAcceptablePrice: 0,
    psychThresholds: [],
    marketingSensitivity: 0,
    qualitySensitivity: 0,
    loyalty: 0,
    priceEffectBounds: { min: 1, max: 1 },
    paymentDelayDays: s.paymentDelayDays,
    ...(s.commissionRate !== undefined ? { commissionRate: s.commissionRate } : {}),
    ...(s.seasonality ? { seasonality: s.seasonality } : {}),
  });
  const sansMarche = mapGammeSegments(scenario, neutre);
  return {
    ...sansMarche,
    market: { ...sansMarche.market, outsideAttraction: 0, competitionIntensity: 1 },
    ...(sansMarche.products
      ? {
          products: sansMarche.products.map((p) => {
            const { outsideAttraction: _o, competitionIntensity: _c, ...marche } = p.market;
            return { ...p, market: marche };
          }),
        }
      : {}),
    events: [],
    scriptedEvents: [],
    orderOffers: undefined,
    bots: undefined,
  };
}
