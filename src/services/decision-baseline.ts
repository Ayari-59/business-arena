import { aLaMesureDuNiveau, neutralDecisions, soldByProduct, type LeviersOuverts } from "@/engine/bots";
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
 * précédent sans leurs dépenses ponctuelles, le plan recalculé sur les ventes
 * réalisées (`propositionDuTour`). Calculé ici, et une seule fois, parce que le serveur doit
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
 * LA PROPOSITION D'UN TOUR : UNE BASE NEUTRE, QUI NE MÈNE PAS À LA FAILLITE.
 *
 * Ni une stratégie ni une aide à gagner : une équipe qui la valide sans rien
 * changer finit à peu près où finit la gestion neutre du secteur
 * (`neutralDecisions`, l'étalon de l'examen), loin derrière un bon
 * gestionnaire (`pedagogy/merite/reference`). Ce qu'elle ne fait plus, c'est
 * reconduire six tours la gestion neutre du TOUR 1 : un plan à 65 % de
 * l'atelier, gelé sous le point mort de NOVA pendant que la demande montait.
 *
 * Au tour 1, le départ du secteur (`startingDecisionsFor`). Ensuite, la
 * décision du tour précédent sans ses dépenses ponctuelles
 * (`sansDepensesPonctuelles`) : prix, budgets, fournisseur et assurance
 * restent ceux de l'équipe, sans aucune hausse de prix. Seul le PLAN se
 * recalcule, comme la gestion neutre le recalcule à chaque tour : les ventes
 * RÉALISÉES du tour passé (pas la demande manquée), +5 %, la saison, la moitié
 * du stock d'ouverture déduite, dans la capacité de l'atelier.
 *
 * Et un seul garde-fou, contre la faillite : le PLANCHER DU POINT MORT. Quand
 * le tour passé s'est soldé par une perte, que l'entreprise ouvre le tour à
 * découvert et que des ventes ont manqué, rester sous le point mort serait
 * perdre encore, à découvert, alors que la demande permettait de le passer.
 * Le plan monte alors au point mort que les résultats du tour passé
 * affichent, jamais au-delà de la demande reçue (ventes et ventes manquées, à
 * la saison du tour) ni de l'atelier. Mesuré : il ne joue qu'en cas de
 * difficulté, et la proposition finit à quelques pour cent de la gestion
 * neutre là où elle n'en a pas besoin.
 *
 * Ni la demande à venir, ni la graine : rien que ce que l'élève a sous les yeux.
 * Abonnement (la salle de sport) : le plan reconduit reste celui de l'équipe.
 */
export function propositionDuTour(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
  /** Le détail par clientèle du tour passé de l'équipe ; absent : le plan reconduit. */
  lastMarket?: MarcheDuTourPasse | null;
  /** Le point mort du tour passé, en unités (`breakeven.breakEvenUnits` de ses résultats). */
  lastBreakEven?: number | null;
  /** Le résultat net du tour passé. */
  lastNetIncome?: number | null;
  leviers?: LeviersOuverts | null;
}): RoundDecisions {
  const leviers = args.leviers ?? null;
  if (!args.previousPayload) return startingDecisionsFor(args.snapshot, args.state, args.roundIndex, leviers);
  const reconduite = sansDepensesPonctuelles(args.previousPayload);
  const { snapshot, state, roundIndex, lastMarket } = args;
  if (!state || !lastMarket || snapshot.subscription) return auPas(reconduite);

  const gamme = toGamme(snapshot);
  const multi = isMultiProduct(snapshot);
  // LE PLAN DE LA GESTION NEUTRE, sur les ventes réalisées du tour passé.
  const neutre = neutralDecisions({
    scenario: snapshot,
    state,
    roundIndex,
    lastSoldUnits: Object.values(lastMarket).reduce((t, x) => t + Math.max(0, x.sold), 0),
    lastSoldByProduct: soldByProduct(snapshot, lastMarket),
  });
  const plans = gamme.map((p) =>
    multi ? (neutre.products?.[p.code]?.productionPlan ?? 0) : neutre.productionPlan,
  );

  // LE PLANCHER DU POINT MORT, quand la perte, le découvert et la demande l'appellent.
  const demandes = gamme.map((p) => {
    if (!isProductAvailable(p, rdOpeningOf(snapshot, state, p.code), roundIndex)) return 0;
    const recue = p.market.segments.reduce((t, seg) => {
      const r = Math.max(0, lastMarket[seg.code]?.sold ?? 0) + Math.max(0, lastMarket[seg.code]?.lost ?? 0);
      return t + r * saisonDuTour(seg.seasonality ?? p.market.seasonality, roundIndex);
    }, 0);
    const stock = multi ? (state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0) : state.finishedGoods.quantity;
    return Math.max(0, recue - stock);
  });
  const pointMort = args.lastBreakEven ?? 0;
  const total = plans.reduce((a, b) => a + b, 0);
  const demande = demandes.reduce((a, b) => a + b, 0);
  const perte = (args.lastNetIncome ?? 0) < 0;
  const aDecouvert = state.finance.overdraft > 0;
  if (perte && aDecouvert && pointMort > 0 && total < pointMort && demande > total) {
    const vise = Math.min(pointMort * 1.02, demande);
    const nonServie = demandes.map((d, k) => Math.max(0, d - plans[k]!));
    const somme = nonServie.reduce((a, b) => a + b, 0);
    // Chaque référence monte en proportion de la demande qu'elle n'aurait pas servie.
    if (somme > 0) nonServie.forEach((n, k) => (plans[k] = plans[k]! + ((vise - total) * n) / somme));
  }
  const bornes = bornerALAtelier(plans, gamme, state);

  if (!multi) return auPas({ ...reconduite, productionPlan: bornes[0]! });
  const depart = startingDecisionsFor(snapshot, state, roundIndex, leviers);
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
 * le plan recalculé comme celui de la gestion neutre, sur les ventes réalisées.
 */
export function proposedDecisionsFor(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
  lastMarket?: MarcheDuTourPasse | null;
  lastBreakEven?: number | null;
  lastNetIncome?: number | null;
  leviers?: LeviersOuverts | null;
}): RoundDecisions {
  return propositionDuTour(args);
}
