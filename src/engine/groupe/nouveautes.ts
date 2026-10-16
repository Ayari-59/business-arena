import type { CompanyState, EngineScenarioConfig, ProductCode, ProductRdState } from "../types";
import { isProductAvailable, rdOpeningOf, type GammeProduct } from "../gamme";
import { fluxPropre } from "./flux-propre";
import type { NouveauteDuGroupe } from "./types";

/**
 * LES NOUVEAUTÉS DU NIVEAU 7 (NOVA Home) : une référence à développer propre
 * au niveau, qui enseigne l'innovation sur un marché nouveau.
 *
 * Ce module ne tient que des fonctions PURES. Tous les tirages se font sur des
 * flux propres dérivés de la graine (`fluxPropre`) : le retard de
 * certification, un par entreprise et par nouveauté ; la rupture du composant
 * critique, un par entreprise, par fournisseur et par tour. Aucun ne décale un
 * autre tirage de la partie. Une partie sans bloc `groupe.nouveautes`, ou dont
 * la gamme ne porte pas la nouveauté, ne passe jamais ici.
 */

/** Les nouveautés du snapshot présentes dans sa gamme, par code. */
export function nouveautesDeLaGamme(
  scenario: Pick<EngineScenarioConfig, "groupe">,
  gamme: readonly { code: ProductCode }[],
): Map<ProductCode, NouveauteDuGroupe> {
  const out = new Map<ProductCode, NouveauteDuGroupe>();
  for (const n of scenario.groupe?.nouveautes ?? []) if (gamme.some((p) => p.code === n.code)) out.set(n.code, n);
  return out;
}

/** La référence est-elle une nouveauté du groupe, dans cette gamme ? */
export function estUneNouveaute(
  scenario: Pick<EngineScenarioConfig, "groupe" | "products">,
  code: ProductCode,
): boolean {
  return (scenario.groupe?.nouveautes ?? []).some((n) => n.code === code) && (scenario.products ?? []).some((p) => p.code === code);
}

/** L'état d'adoption d'une nouveauté pour une partie : un tirage, parmi `n` états également probables. */
export function etatDAdoption(graine: number, code: ProductCode, n: number): number {
  if (n <= 1) return 0;
  return Math.min(n - 1, Math.floor(fluxPropre(graine, `nouveaute:${code}:adoption`).next() * n));
}

/** Le retard de certification d'une entreprise : un tirage, toujours le même pour la même partie. */
export function certificationRetardee(graine: number, entreprise: string, code: ProductCode, probabilite: number): boolean {
  if (probabilite <= 0) return false;
  return fluxPropre(graine, `nouveaute:${code}:certification:${entreprise}`).next() < probabilite;
}

/**
 * La R&D de clôture d'une nouveauté, étapes et retard compris : le démarrage
 * au tour où le seuil est atteint, et, au premier tour où la référence
 * deviendrait vendable, le retard tiré une fois pour toutes. Une référence
 * sans ces réglages garde son état tel quel.
 */
export function etapesDuDeveloppement(args: {
  produit: Pick<GammeProduct, "development">;
  suivant: ProductRdState;
  roundIndex: number;
  graine: number;
  entreprise: string;
  code: ProductCode;
}): ProductRdState {
  const dev = args.produit.development;
  if (!dev) return args.suivant;
  let rd = args.suivant;
  if (dev.seuilDeDemarrage !== undefined && rd.demarreAuTour === undefined && rd.invested >= dev.seuilDeDemarrage * dev.cost) {
    rd = { ...rd, demarreAuTour: args.roundIndex };
  }
  if (dev.risqueDeRetard && !rd.launched && !rd.certificationTiree && !rd.abandonnee) {
    const prochain = args.roundIndex + 1;
    if (isProductAvailable(args.produit, rd, prochain)) {
      const retard = certificationRetardee(args.graine, args.entreprise, args.code, dev.risqueDeRetard.probabilite);
      rd = {
        ...rd,
        certificationTiree: true,
        ...(retard ? { retardJusquAu: prochain + Math.max(1, dev.risqueDeRetard.tours) - 1 } : {}),
      };
    }
  }
  return rd;
}

/** La probabilité de rupture du composant au tour : plus forte aux pics de la saison de la nouveauté. */
export function probabiliteDeRuptureDuComposant(
  r: NonNullable<NouveauteDuGroupe["ruptures"]>[number],
  saison: number,
): number {
  return saison >= r.seuilDePic ? r.probabiliteAuxPics : r.probabilite;
}

/** Le composant critique rompt-il ce tour, pour cette entreprise ? Un tirage sur son flux propre. */
export function ruptureDuComposant(
  graine: number,
  r: NonNullable<NouveauteDuGroupe["ruptures"]>[number],
  saison: number,
  roundIndex: number,
  entreprise: string,
): boolean {
  return (
    fluxPropre(graine, `composant:${r.fournisseur}:${entreprise}:t${roundIndex}`).next() <
    probabiliteDeRuptureDuComposant(r, saison)
  );
}

/**
 * Les nouveautés au marché ce tour : celles qu'au moins une entreprise active
 * (non défaillante) peut vendre, d'après son état d'ouverture.
 */
export function nouveautesAuMarche(
  scenario: EngineScenarioConfig,
  gamme: readonly GammeProduct[],
  companies: readonly CompanyState[],
  roundIndex: number,
  nouveautes: ReadonlyMap<ProductCode, NouveauteDuGroupe>,
): Set<ProductCode> {
  const out = new Set<ProductCode>();
  for (const code of nouveautes.keys()) {
    const p = gamme.find((x) => x.code === code)!;
    if (
      companies.some(
        (c) =>
          c.status !== "defaillant" &&
          isProductAvailable(p, rdOpeningOf(scenario, c, code), roundIndex),
      )
    )
      out.add(code);
  }
  return out;
}

/**
 * LA MIGRATION : une part du potentiel des segments d'origine passe au
 * segment de la nouveauté, quand elle est au marché ; sinon ce segment ne
 * reçoit rien. Le potentiel total est conservé. Modifie `potentiels`.
 */
export function migrer(
  potentiels: Record<string, number>,
  n: NouveauteDuGroupe,
  auMarche: boolean,
): number {
  let flux = 0;
  if (auMarche) {
    for (const [segment, part] of Object.entries(n.migration.parts)) {
      const p = potentiels[segment];
      if (p === undefined || part <= 0) continue;
      const m = p * part;
      potentiels[segment] = p - m;
      flux += m;
    }
  }
  potentiels[n.migration.vers] = flux;
  return flux;
}

/**
 * LES FRAIS DE DÉVELOPPEMENT IMMOBILISÉS D'UNE NOUVEAUTÉ, au tour.
 *
 * Tant que la référence n'est pas lancée, la R&D qui couvre son coût est
 * immobilisée (frais de développement, 203) : elle sort de la caisse, entre à
 * l'actif, et ne pèse ni sur l'EBE ni sur la valeur. Au-delà du coût, ou une
 * fois lancée, la R&D reste une charge (le niveau technique). L'amortissement
 * est linéaire sur `duree` tours à partir du lancement. La DÉPRÉCIATION :
 *   - à l'abandon, toute la valeur nette ;
 *   - après le lancement, ce qui dépasse la valeur d'utilité, la contribution
 *     moyenne de la référence depuis son lancement (marge sur coût variable
 *     moins plateforme) sur les tours d'amortissement qui restent.
 * Elle est irréversible.
 *
 * LE TEST N'A LIEU QU'APRÈS UNE FENÊTRE D'OBSERVATION. Un seul tour de
 * lancement ne dit rien de la valeur d'utilité : il porte la montée en
 * charge, la saison, une catégorie qui se fait connaître. Lu seul, il
 * dépréciait un lancement normal le jour même. Le test se fait donc à partir
 * du `TOURS_D_OBSERVATION`-ième tour de vente, sur la moyenne des tours
 * observés ; avant, seul un indice objectif l'avance : une contribution
 * négative deux tours de suite (des ventes nulles en sont une). L'état
 * d'adoption, que l'équipe ne connaît pas, n'y entre jamais : une
 * dépréciation qui le lirait le révélerait.
 */
export const TOURS_D_OBSERVATION = 3;

export function fraisDeDeveloppement(args: {
  ouverture: ProductRdState | null;
  cout: number;
  budget: number;
  auMarche: boolean;
  abandon: boolean;
  duree: number;
  /** Contribution du tour (absente avant le lancement). */
  contribution?: number;
}): {
  immobiliseCeTour: number;
  amortissement: number;
  depreciation: number;
  immobilise: number;
  amorti: number;
  contributions: number[] | undefined;
} {
  const o = args.ouverture;
  const dejaImmobilise = o?.immobilise ?? 0;
  const dejaAmorti = o?.amorti ?? 0;
  const lancee = o?.launched ?? false;
  const immobiliseCeTour = !lancee && !args.abandon && !o?.abandonnee ? Math.max(0, Math.min(args.budget, args.cout - (o?.invested ?? 0))) : 0;
  const immobilise = dejaImmobilise + immobiliseCeTour;
  let vnc = immobilise - dejaAmorti;
  let amortissement = 0;
  let depreciation = 0;
  const contributions = args.contribution !== undefined ? [...(o?.contributions ?? []), args.contribution] : o?.contributions;
  if (args.abandon) {
    depreciation = Math.max(0, vnc);
    vnc = 0;
  } else if (args.auMarche && vnc > 0) {
    amortissement = Math.min(vnc, immobilise / Math.max(1, args.duree));
    vnc -= amortissement;
    const tours = contributions?.length ?? 0;
    const restants = Math.max(0, args.duree - tours);
    const moyenne = tours > 0 ? contributions!.reduce((a, b) => a + b, 0) / tours : 0;
    const utilite = Math.max(0, moyenne * restants);
    // Le test, après la fenêtre d'observation, ou plus tôt sur une perte constatée deux tours de suite.
    const pertesDeSuite = tours >= 2 && contributions![tours - 1]! < 0 && contributions![tours - 2]! < 0;
    const teste = tours >= TOURS_D_OBSERVATION || pertesDeSuite;
    if (teste && vnc > utilite) {
      depreciation = vnc - utilite;
      vnc = utilite;
    }
  }
  return {
    immobiliseCeTour,
    amortissement,
    depreciation,
    immobilise,
    amorti: dejaAmorti + amortissement + depreciation,
    contributions,
  };
}
