import { neutralDecisions } from "@/engine/bots";
import { isMultiProduct, scalarsOfGamme, suppliersOf, toGamme } from "@/engine/gamme";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * Ce que le formulaire PROPOSE à une équipe pour un tour : la référence à
 * laquelle on compare ce qu'elle valide, pour savoir si elle a décidé.
 *
 * Au tour 1, le point de départ du secteur ; ensuite, les décisions du tour
 * précédent. Calculé ici, et une seule fois, parce que le serveur doit
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
  return auPas(sansRd(sansCommunication(neutralDecisions({ scenario: snapshot, state, roundIndex }))));
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
  if (d.rdBudget === undefined) return d;
  return {
    ...d,
    rdBudget: 0,
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

/** Les valeurs proposées pour ce tour : le tour précédent, sinon le départ. */
export function proposedDecisionsFor(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
}): RoundDecisions {
  return args.previousPayload
    ? auPas(args.previousPayload)
    : startingDecisionsFor(args.snapshot, args.state, args.roundIndex);
}
