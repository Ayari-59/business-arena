import { aLaMesureDuNiveau, neutralDecisions, type LeviersOuverts } from "@/engine/bots";
import {
  isMultiProduct,
  isProductAvailable,
  rdOpeningOf,
  scalarsOfGamme,
  suppliersOf,
  toGamme,
} from "@/engine/gamme";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  ProductDecisions,
  RoundDecisions,
} from "@/engine/types";

/**
 * Ce que le formulaire PROPOSE à une équipe pour un tour : la référence à
 * laquelle on compare ce qu'elle valide, pour savoir si elle a décidé.
 *
 * Au tour 1, le point de départ du secteur ; ensuite, les décisions du tour
 * précédent sans leurs dépenses ponctuelles, le plan recalculé sur la demande
 * constatée (`propositionDuTour`). Calculé ici, et une seule fois, parce que le serveur doit
 * refaire exactement le calcul du formulaire : une valeur proposée que le
 * serveur ne reconnaîtrait pas passerait pour une décision.
 */

/**
 * Le formulaire n'accepte pas n'importe quel nombre : ses champs avancent par
 * pas de 1, le prix par pas de 0,1. Une valeur proposée décimale rendrait le
 * tour insoumettable : le navigateur refuse la validation sans message, et
 * l'élève clique sans que rien ne se passe. Une valeur proposée doit être
 * soumettable telle quelle.
 */
export function auPas(d: RoundDecisions): RoundDecisions {
  // Gamme : chaque produit est mis au pas, et les scalaires sont REDÉRIVÉS des
  // produits (plan = somme, prix = moyenne pondérée), exactement comme l'action
  // serveur le fait d'une saisie : c'est la seule façon qu'une équipe qui
  // valide la proposition telle quelle soit reconnue comme telle.
  if (d.products) {
    const products = Object.fromEntries(
      Object.entries(d.products).map(([code, p]) => [
        code,
        {
          price: Math.round(p.price * 10) / 10,
          productionPlan: Math.round(p.productionPlan),
          ...(p.marketingBudget !== undefined
            ? { marketingBudget: Math.round(p.marketingBudget) }
            : {}),
          ...(p.qualityBudget !== undefined ? { qualityBudget: Math.round(p.qualityBudget) } : {}),
          ...(p.supplierChoice !== undefined ? { supplierChoice: p.supplierChoice } : {}),
          ...(p.rdBudget !== undefined ? { rdBudget: Math.round(p.rdBudget) } : {}),
        },
      ]),
    );
    const scalars = scalarsOfGamme(products);
    return {
      ...d,
      products,
      price: Math.round(scalars.price * 10) / 10,
      productionPlan: Math.round(scalars.productionPlan),
      marketingBudget: Math.round(scalars.marketingBudget),
      qualityBudget: Math.round(scalars.qualityBudget ?? d.qualityBudget),
      maintenanceBudget: Math.round(d.maintenanceBudget),
      ...(scalars.supplierChoice !== undefined ? { supplierChoice: scalars.supplierChoice } : {}),
      ...(scalars.rdBudget !== undefined
        ? { rdBudget: scalars.rdBudget }
        : d.rdBudget !== undefined
          ? { rdBudget: Math.round(d.rdBudget) }
          : {}),
      ...(d.brandMarketingBudget !== undefined
        ? { brandMarketingBudget: Math.round(d.brandMarketingBudget) }
        : {}),
    };
  }
  return {
    ...d,
    price: Math.round(d.price * 10) / 10,
    productionPlan: Math.round(d.productionPlan),
    marketingBudget: Math.round(d.marketingBudget),
    qualityBudget: Math.round(d.qualityBudget),
    maintenanceBudget: Math.round(d.maintenanceBudget),
    ...(d.rdBudget !== undefined ? { rdBudget: Math.round(d.rdBudget) } : {}),
  };
}

/** Le point de départ du secteur, servi quand il n'y a rien à reconduire. */
export function startingDecisionsFor(
  snapshot: EngineScenarioConfig,
  state: CompanyState | undefined,
  roundIndex: number,
  /** Les leviers figés de la partie : la proposition ne porte que ceux-là (`aLaMesureDuNiveau`). */
  leviers: LeviersOuverts | null = null,
): RoundDecisions {
  // Sans état persisté il n'y a pas de capacité à viser : on s'en tient alors
  // au prix de référence du secteur, jamais à celui d'un autre.
  if (!state) {
    const main = [...snapshot.market.segments].sort((a, b) => b.size - a.size)[0];
    // Gamme : chaque référence part du prix de sa clientèle dominante, plan à
    // zéro, marketing et qualité répartis à parts égales, fournisseur de
    // référence pour toutes.
    const gamme = toGamme(snapshot);
    const products = isMultiProduct(snapshot)
      ? Object.fromEntries(
          gamme.map((p) => {
            const dominant = [...p.market.segments].sort((a, b) => b.size - a.size)[0];
            // Le fournisseur de référence de LA référence : le premier de son
            // catalogue (le sien, sinon celui du scénario).
            const supplier = suppliersOf(p, snapshot)?.[0]?.code;
            return [
              p.code,
              {
                price: dominant?.refPrice ?? 50,
                productionPlan: 0,
                marketingBudget: (0.5 * snapshot.marketing.scale) / gamme.length,
                qualityBudget: (0.5 * snapshot.production.qualityScale) / gamme.length,
                ...(supplier !== undefined ? { supplierChoice: supplier } : {}),
                // R&D : rien de proposé, la décision d'investir est celle de l'équipe.
                ...(snapshot.rd ? { rdBudget: 0 } : {}),
              },
            ];
          }),
        )
      : undefined;
    return auPas({
      price: main?.refPrice ?? 50,
      productionPlan: 0,
      marketingBudget: 0.5 * snapshot.marketing.scale,
      qualityBudget: 0.5 * snapshot.production.qualityScale,
      maintenanceBudget: snapshot.production.maintenanceReference,
      ...(snapshot.rd ? { rdBudget: 0 } : {}),
      // Communication : la marque et l'axe sont un choix de l'équipe, rien de proposé.
      ...(snapshot.communication && products ? { brandMarketingBudget: 0 } : {}),
      ...(products ? { products } : {}),
    });
  }
  // La R&D n'est jamais proposée : investir pour lancer une référence ou
  // élever son niveau technique est la décision de l'équipe, pas du bot
  // équilibré qui sert de neutre pour le reste. Ni la marque, ni l'axe de
  // communication : le marketing proposé revient tout entier aux références.
  return auPas(
    sansRd(sansCommunication(aLaMesureDuNiveau(neutralDecisions({ scenario: snapshot, state, roundIndex }), leviers))),
  );
}

function sansCommunication(d: RoundDecisions): RoundDecisions {
  const { communicationAxis: _axe, ...reste } = d;
  void _axe;
  if (d.brandMarketingBudget === undefined || !d.products) return reste;
  const n = Object.keys(d.products).length;
  return {
    ...reste,
    brandMarketingBudget: 0,
    products: Object.fromEntries(
      Object.entries(d.products).map(([code, p]) => [
        code,
        p.marketingBudget !== undefined
          ? { ...p, marketingBudget: p.marketingBudget + (d.brandMarketingBudget ?? 0) / n }
          : p,
      ]),
    ),
  };
}

function sansRd(d: RoundDecisions): RoundDecisions {
  const rdParReference = Object.values(d.products ?? {}).some((p) => p.rdBudget !== undefined);
  if (d.rdBudget === undefined && !rdParReference) return d;
  return {
    ...d,
    ...(d.rdBudget !== undefined ? { rdBudget: 0 } : {}),
    ...(d.products
      ? {
          products: Object.fromEntries(
            Object.entries(d.products).map(([code, p]) => [
              code,
              p.rdBudget !== undefined ? { ...p, rdBudget: 0 } : p,
            ]),
          ),
        }
      : {}),
  };
}

/**
 * LA PROPOSITION NE RECONDUIT PAS UNE DÉPENSE PONCTUELLE.
 *
 * Une dépense ponctuelle vaut pour SON tour : la R&D qui lance une référence
 * (25 000 € pour la Studio, une fois), une étude, une machine, une embauche,
 * une formation, un emprunt, un apport, un dividende, un escompte, un
 * placement, une action qualité, un programme R&D, l'engagement RSE, une
 * commande exceptionnelle acceptée. Reprise d'un tour sur l'autre, elle se
 * paierait à chaque tour sans que personne ne l'ait redécidée : une équipe qui
 * finançait la Studio une fois, puis validait, la refinançait à chaque tour
 * et finissait en défaillance (12 parties sur 12).
 *
 * Ce qui reste : les choix qui durent (prix, plan, budgets marketing, qualité
 * et entretien, fournisseur, assurance, politique salariale, axe de
 * communication). Le formulaire ne reprenait déjà aucune de ces dépenses, sauf
 * la R&D et l'acceptation de la commande : elles sont retirées ici, pour les
 * deux, le serveur et le formulaire lisant la même proposition.
 */
export function sansDepensesPonctuelles(d: RoundDecisions): RoundDecisions {
  const {
    hr,
    investment: _investissement,
    finance: _financement,
    treasury: _tresorerie,
    acceptOrder: _commande,
    studies: _etudes,
    qualityActions: _actionsQualite,
    startedRdActionIds: _programmesRd,
    stoppedModuleItems: _arrets,
    rse: _rse,
    salesEstimate: _ventesEstimees,
    ...durables
  } = d;
  void [_investissement, _financement, _tresorerie, _commande, _etudes, _actionsQualite, _programmesRd, _arrets, _rse, _ventesEstimees];
  return sansRd({
    ...durables,
    ...(hr?.salaryIndex !== undefined ? { hr: { salaryIndex: hr.salaryIndex } } : {}),
  });
}

/** Ce que l'équipe a sous les yeux du tour passé : ses ventes et ses ventes manquées, clientèle par clientèle. */
export type MarcheDuTourPasse = Record<string, Pick<CompanyRoundResult["market"]["bySegment"][string], "sold" | "lost">>;

/**
 * LA PROPOSITION D'UN TOUR : UNE BASE RAISONNABLE, CONSTRUITE SUR L'OUVERTURE DU TOUR.
 *
 * Au tour 1, le point de départ du secteur (`startingDecisionsFor`). Ensuite,
 * la décision du tour précédent sans ses dépenses ponctuelles
 * (`sansDepensesPonctuelles`) : prix, budgets, fournisseur, assurance restent
 * ceux que l'équipe a choisis. Seul le PLAN DE PRODUCTION se recalcule, et
 * c'est là que la proposition reconduite menait à la faillite : le plan du
 * tour 1 (65 % de l'atelier), gelé six tours, sous le point mort de NOVA
 * pendant que la demande dépassait la capacité ; le plan d'hiver de MAILLE &
 * CO (37 % de l'atelier) reconduit jusqu'aux pics de saison.
 *
 * Le plan proposé, référence par référence, avec ce que l'équipe sait à
 * l'ouverture et rien d'autre (ni la demande à venir, ni la graine) :
 *   - la demande qu'elle a reçue au tour passé, vendue ET manquée (la colonne
 *     « Manqué » de ses résultats) ;
 *   - corrigée de la saison connue, du tour passé à celui-ci ;
 *   - moins le stock d'ouverture, qui se vend d'abord ;
 *   - le tout dans la limite de l'atelier : ses machines et ses heures.
 * Une référence sans repère (tout juste lancée) repart du point de départ du
 * secteur. Ce n'est pas une stratégie : la proposition sert la demande
 * constatée, au prix que l'équipe a fixé, sans gonfler le stock. Elle ne
 * remplace pas le jugement de l'élève, qui voit la même colonne « Manqué ».
 *
 * Abonnement (la salle de sport) : la capacité se réserve aux adhérents, le
 * plan reconduit reste celui de l'équipe.
 */
export function propositionDuTour(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
  /** Le détail par clientèle du tour passé de l'équipe ; absent : le plan reconduit. */
  lastMarket?: MarcheDuTourPasse | null;
  leviers?: LeviersOuverts | null;
}): RoundDecisions {
  const leviers = args.leviers ?? null;
  if (!args.previousPayload) return premierTour(args.snapshot, args.state, args.roundIndex, leviers);
  const reconduite = sansDepensesPonctuelles(args.previousPayload);
  const { snapshot, state, roundIndex, lastMarket } = args;
  if (!state || !lastMarket || snapshot.subscription) return auPas(reconduite);

  const gamme = toGamme(snapshot);
  const multi = isMultiProduct(snapshot);
  const depart = startingDecisionsFor(snapshot, state, roundIndex, leviers);
  const plans = gamme.map((p) => {
    if (!isProductAvailable(p, rdOpeningOf(snapshot, state, p.code), roundIndex)) return 0;
    let demandee = 0;
    let attendue = 0;
    for (const seg of p.market.segments) {
      const recue = Math.max(0, lastMarket[seg.code]?.sold ?? 0) + Math.max(0, lastMarket[seg.code]?.lost ?? 0);
      demandee += recue;
      attendue += recue * saisonDuTour(seg.seasonality ?? p.market.seasonality, roundIndex);
    }
    const stock = multi
      ? (state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0)
      : state.finishedGoods.quantity;
    if (demandee <= 0) {
      // Aucun repère : la référence n'était pas encore en vente. Le départ du secteur.
      return multi ? (depart.products?.[p.code]?.productionPlan ?? 0) : depart.productionPlan;
    }
    return Math.max(0, attendue - stock);
  });
  const bornes = bornerALAtelier(plans, gamme, state);

  if (!multi) return auPas({ ...reconduite, productionPlan: bornes[0]! });
  const products: Record<string, ProductDecisions> = {};
  gamme.forEach((p, k) => {
    const avant = reconduite.products?.[p.code];
    const neuve = depart.products?.[p.code];
    // Une référence tout juste lancée n'avait ni plan, ni marketing, ni qualité :
    // elle reçoit ceux du départ du secteur, et son prix de référence.
    const lancee = !avant || (avant.productionPlan <= 0 && (avant.marketingBudget ?? 0) <= 0);
    products[p.code] = {
      ...(lancee && neuve ? neuve : (avant ?? neuve!)),
      ...(avant?.rdBudget !== undefined ? { rdBudget: avant.rdBudget } : {}),
      productionPlan: bornes[k]!,
    };
  });
  return auPas({ ...reconduite, products });
}

/**
 * Le premier tour : le départ du secteur, à un détail près. En gamme, le plan
 * de départ anticipe la saison du tour SUIVANT (ratio borné entre 0,5 et 2) :
 * MAILLE & CO, dont la saison d'automne est la plus faible de l'année, se
 * voyait proposer 37 % de son atelier au premier tour. Le plan proposé vise
 * le tour qu'on joue : la même part de l'atelier, référence par référence,
 * sans ce pari sur la saison qui vient.
 */
function premierTour(
  snapshot: EngineScenarioConfig,
  state: CompanyState | undefined,
  roundIndex: number,
  leviers: LeviersOuverts | null,
): RoundDecisions {
  const depart = startingDecisionsFor(snapshot, state, roundIndex, leviers);
  if (!state || !depart.products || snapshot.subscription) return depart;
  const gamme = toGamme(snapshot);
  const disponibles = gamme.map((p) => isProductAvailable(p, rdOpeningOf(snapshot, state, p.code), roundIndex));
  const tailles = gamme.map((p, k) =>
    disponibles[k] ? p.market.segments.reduce((t, seg) => t + seg.size, 0) : 0,
  );
  const total = tailles.reduce((a, b) => a + b, 0);
  const machines = state.machineCapacity * state.availability;
  const plans = gamme.map((p, k) => {
    const stock = state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0;
    return total > 0 ? Math.max(0, machines * PART_DE_DEPART * (tailles[k]! / total) - stock) : 0;
  });
  const bornes = bornerALAtelier(plans, gamme, state);
  return auPas({
    ...depart,
    products: Object.fromEntries(
      gamme.map((p, k) => [p.code, { ...depart.products![p.code]!, productionPlan: bornes[k]! }]),
    ),
  });
}

/** La part de l'atelier que le départ du secteur engage (celle de la gestion neutre : 65 % × 1,05). */
const PART_DE_DEPART = 0.65 * 1.05;

/** La saison connue du tour, rapportée à celle du tour passé (bornée : un repère, pas un pari). */
function saisonDuTour(saison: readonly number[], roundIndex: number): number {
  const ici = saison[roundIndex - 1] ?? 1;
  const avant = saison[roundIndex - 2] ?? ici;
  if (avant <= 0) return 1;
  return Math.min(2, Math.max(0.5, ici / avant));
}

/** Les plans ramenés à ce que l'atelier peut sortir ce tour : ses machines, puis ses heures. */
function bornerALAtelier(
  plans: number[],
  gamme: ReturnType<typeof toGamme>,
  state: CompanyState,
): number[] {
  const machines = state.machineCapacity * state.availability;
  const heures = state.headcount * state.hoursPerEmployee * state.productivity;
  const total = plans.reduce((a, b) => a + b, 0);
  const heuresDemandees = plans.reduce(
    (t, x, k) => t + x * gamme[k]!.hoursPerUnit,
    0,
  );
  const coupe = Math.min(
    1,
    total > 0 && machines > 0 ? machines / total : 1,
    heuresDemandees > 0 && heures > 0 ? heures / heuresDemandees : 1,
  );
  // Arrondi vers le bas : une valeur proposée ne dépasse jamais la capacité.
  return plans.map((x) => Math.floor(x * coupe));
}

/**
 * Les valeurs proposées pour ce tour (`propositionDuTour`) : au tour 1 le
 * départ du secteur ; ensuite le tour précédent sans ses dépenses ponctuelles,
 * le plan recalculé sur la demande constatée.
 */
export function proposedDecisionsFor(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
  lastMarket?: MarcheDuTourPasse | null;
  leviers?: LeviersOuverts | null;
}): RoundDecisions {
  return propositionDuTour(args);
}
