import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";
import { suppliersOf, toGamme, toGammeDecisions } from "../gamme";
import { capaciteDeLAtelier } from "../investment/plafond";

/**
 * POURQUOI L'ATELIER NE LIVRERA PAS TOUT CE QUE L'ÉQUIPE CROIT VENDRE.
 *
 * L'alerte du résultat estimé disait seulement « vous ne pourrez livrer que
 * 6 080 enceintes, faute de stock et de capacité ». En gamme, l'élève voyait
 * ses ventes estimées (6 300) sous le plafond affiché (7 000, la capacité des
 * machines à plein) et ne comprenait pas : c'étaient les HEURES qui manquaient,
 * la NOVA Studio en demandant 0,50 par enceinte. Le moteur le savait
 * (`allocateProduction`) ; la feuille ne le disait pas.
 *
 * Ce module ne calcule RIEN de neuf sur la production : il LIT le tour estimé
 * que le moteur a rendu (plans retenus, production, capacités machine et
 * main-d'œuvre, rebuts, ruptures) et répartit le manque de chaque référence
 * entre ses causes :
 *  1. le plan (plus le stock d'ouverture) ne couvre pas les ventes estimées ;
 *  2. la référence n'est pas encore lancée (sa R&D ne couvre pas son coût) ;
 *  3. l'approvisionnement (rupture ou rationnement du fournisseur) ampute le plan ;
 *  4. la capacité du tour réduit les plans : machines (disponibilité) ou
 *     main-d'œuvre (heures), la plus basse des deux ;
 *  5. les rebuts retirent une part de la production.
 * Le manque d'une référence va d'abord au plan trop bas ; le reste se partage
 * entre les pertes 2 à 5 au prorata des unités que chacune retire.
 */

export type CauseDuManque =
  | "main-d-oeuvre"
  | "machines"
  | "plan"
  | "non-lancee"
  | "approvisionnement"
  | "rebuts";

/** Ce que l'analyse lit d'une référence du tour estimé. */
export interface ReferenceDuManque {
  code: string;
  nom: string;
  /** Les ventes que l'équipe estime. */
  estimees: number;
  /** Ce qu'elle pourra livrer au marché. */
  livrables: number;
  /** Le stock d'ouverture de la référence. */
  stockOuverture: number;
  /** Le plan de production saisi. */
  planSaisi: number;
  /** Le plan que le moteur retient (zéro pour une référence pas encore lancée). */
  planRetenu: number;
  /** Le plan après l'approvisionnement (rupture, rationnement). */
  planApprovisionne: number;
  /** Ce que l'atelier produit, après la capacité du tour. */
  produit: number;
  /** Les rebuts : produits, invendables. */
  rebuts: number;
  /** Heures de main-d'œuvre par unité. */
  heuresParUnite: number;
  /** Le fournisseur de la référence est en rupture ce tour. */
  rupture: boolean;
  /** Part des composants que le fournisseur livre (1 : tout). */
  rationnement: number;
}

export interface EntreeDuManque {
  /** Une gamme (au moins 2 références) : le manque se dit référence par référence. */
  gamme: boolean;
  references: ReferenceDuManque[];
  /** Capacité machine du tour, en unités (à plein × disponibilité). */
  capaciteMachine: number;
  /** Capacité machine à plein, en unités (atelier neuf, sans panne). */
  capaciteMachineAPlein: number;
  /** Capacité de la main-d'œuvre du tour, en unités, au mix planifié. */
  capaciteMainDOeuvre: number;
  effectif: number;
  /**
   * Mono-produit : une rupture d'approvisionnement ampute la disponibilité de
   * l'usine, pas le plan. La capacité machine réduite se lit alors comme une
   * cause d'approvisionnement.
   */
  ruptureDeLUsine?: boolean;
}

export interface LimiteDuManque {
  cause: CauseDuManque;
  /** Les unités de ventes estimées que cette cause fait manquer. */
  unites: number;
  /** Les références touchées, la plus touchée d'abord. */
  references: { code: string; nom: string; unites: number }[];
}

export interface AnalyseDuManque {
  gamme: boolean;
  estimees: number;
  livrables: number;
  manquantes: number;
  /**
   * Ce que l'atelier peut vraiment produire ce tour, en unités, quand la
   * capacité est une limite ; `null` sinon.
   */
  capaciteDuTour: number | null;
  /** Ce que l'atelier peut produire ce tour au mix planifié : la plus basse des deux capacités. */
  capaciteAtelier: number;
  /** Ce que les plans demandaient à l'atelier (après l'approvisionnement). */
  demandeALAtelier: number;
  /** Disponibilité des machines (capacité du tour ÷ capacité à plein). */
  disponibilite: number;
  effectif: number;
  /** La référence planifiée la plus longue à produire (gamme). */
  plusLongueAProduire: string | null;
  /** Les causes, la plus contraignante d'abord. */
  limites: LimiteDuManque[];
  /** Les références dont le fournisseur rompt, ou rationne (part livrée), ce tour. */
  approvisionnement: { code: string; nom: string; rupture: boolean; rationnement: number }[];
  /** Les références qui manquent, la plus touchée d'abord. */
  references: { code: string; nom: string; manquantes: number; estimees: number; couverture: number }[];
}

/** Sous l'unité, rien ne manque : un reste de virgule flottante n'est pas une rupture. */
const SEUIL = 0.5;

/** L'analyse du manque, ou `null` quand rien ne manque (aucune alerte). Fonction pure. */
export function analyserLeManque(e: EntreeDuManque): AnalyseDuManque | null {
  const manqueDe = (r: ReferenceDuManque) => Math.max(0, r.estimees - r.livrables);
  const manquantes = e.references.reduce((s, r) => s + (manqueDe(r) < SEUIL ? 0 : manqueDe(r)), 0);
  if (manquantes < 1) return null;

  const demande = e.references.reduce((s, r) => s + Math.max(0, r.planApprovisionne), 0);
  const produit = e.references.reduce((s, r) => s + Math.max(0, r.produit), 0);
  const capacite = Math.min(e.capaciteMachine, e.capaciteMainDOeuvre);
  // La capacité limite quand l'atelier produit moins que les plans ne demandent.
  const capaciteLimite = demande - produit >= SEUIL;
  const causeDeCapacite: CauseDuManque =
    e.capaciteMainDOeuvre < e.capaciteMachine
      ? "main-d-oeuvre"
      : e.ruptureDeLUsine
        ? "approvisionnement"
        : "machines";

  const parCause = new Map<CauseDuManque, Map<string, number>>();
  const ajouter = (cause: CauseDuManque, r: ReferenceDuManque, unites: number) => {
    if (unites <= 0) return;
    const m = parCause.get(cause) ?? new Map<string, number>();
    m.set(r.code, (m.get(r.code) ?? 0) + unites);
    parCause.set(cause, m);
  };

  for (const r of e.references) {
    const manque = manqueDe(r);
    if (manque < SEUIL) continue;
    // 1. Le plan, stock compris, ne couvre pas l'estimation.
    const ecartAuPlan = Math.max(0, r.estimees - (r.stockOuverture + r.planSaisi));
    const auPlan = Math.min(manque, ecartAuPlan);
    ajouter("plan", r, auPlan);
    // 2 à 5. Ce qui reste se partage entre les unités perdues après le plan.
    const reste = manque - auPlan;
    if (reste < SEUIL) continue;
    const pertes: [CauseDuManque, number][] = [
      ["non-lancee", Math.max(0, r.planSaisi - r.planRetenu)],
      ["approvisionnement", Math.max(0, r.planRetenu - r.planApprovisionne)],
      [causeDeCapacite, capaciteLimite ? Math.max(0, r.planApprovisionne - r.produit) : 0],
      ["rebuts", Math.max(0, r.rebuts)],
    ];
    const total = pertes.reduce((s, [, u]) => s + u, 0);
    if (total <= 0) continue;
    for (const [cause, u] of pertes) ajouter(cause, r, (reste * u) / total);
  }

  const noms = new Map(e.references.map((r) => [r.code, r.nom]));
  const limites: LimiteDuManque[] = [...parCause.entries()]
    .map(([cause, m]) => ({
      cause,
      unites: [...m.values()].reduce((a, b) => a + b, 0),
      references: [...m.entries()]
        .map(([code, unites]) => ({ code, nom: noms.get(code) ?? code, unites }))
        .sort((a, b) => b.unites - a.unites),
    }))
    .filter((l) => l.unites >= SEUIL)
    .sort((a, b) => b.unites - a.unites);

  const capaciteDuTour = limites.some(
    (l) => l.cause === "main-d-oeuvre" || l.cause === "machines" || (l.cause === "approvisionnement" && e.ruptureDeLUsine),
  )
    ? capacite
    : null;

  const planifiees = e.references.filter((r) => r.planApprovisionne > 0);
  const plusLongue = planifiees.length > 1
    ? planifiees.reduce((a, b) => (b.heuresParUnite > a.heuresParUnite ? b : a))
    : null;

  return {
    gamme: e.gamme,
    estimees: e.references.reduce((s, r) => s + r.estimees, 0),
    livrables: e.references.reduce((s, r) => s + r.livrables, 0),
    manquantes,
    capaciteDuTour,
    capaciteAtelier: capacite,
    demandeALAtelier: demande,
    disponibilite: e.capaciteMachineAPlein > 0 ? Math.min(1, e.capaciteMachine / e.capaciteMachineAPlein) : 1,
    effectif: e.effectif,
    plusLongueAProduire: plusLongue?.nom ?? null,
    limites,
    approvisionnement: e.references
      .filter((r) => r.rupture || r.rationnement < 1)
      .map((r) => ({ code: r.code, nom: r.nom, rupture: r.rupture, rationnement: r.rationnement })),
    references: e.references
      .filter((r) => manqueDe(r) >= SEUIL)
      .map((r) => ({
        code: r.code,
        nom: r.nom,
        manquantes: manqueDe(r),
        estimees: r.estimees,
        couverture: r.stockOuverture + r.planSaisi,
      }))
      .sort((a, b) => b.manquantes - a.manquantes),
  };
}

/**
 * L'entrée de l'analyse, lue dans le tour estimé : les plans saisis, l'état
 * d'ouverture, et ce que le moteur a rendu. Aucun calcul de production ici.
 */
export function entreeDuManque(args: {
  scenario: EngineScenarioConfig;
  state: CompanyState;
  decisions: RoundDecisions;
  ventes: Record<string, number>;
  livrables: Record<string, number>;
  resultat: CompanyRoundResult;
}): EntreeDuManque {
  const { scenario, state, resultat } = args;
  const gamme = toGamme(scenario);
  const multi = gamme.length > 1;
  const saisies = toGammeDecisions(args.decisions, gamme);
  const references: ReferenceDuManque[] = gamme.map((p, k) => {
    const detail = resultat.products?.[p.code];
    const planRetenu = multi ? (detail?.planned ?? 0) : resultat.production.planned;
    const rupture = multi
      ? detail?.supplier?.supplyDisruption === true
      : false;
    const fournisseur = rupture
      ? suppliersOf(p, scenario)?.find((s) => s.code === detail?.supplier?.code)
      : undefined;
    const coupe = rupture ? (fournisseur?.supplyRiskAvailabilityHit ?? 1) : 1;
    // L'estimation ne connaît aucun rationnement (le fournisseur partagé du
    // niveau 7 rationne à la clôture) : la part livrée vaut 1.
    const rationnement = 1;
    return {
      code: p.code,
      nom: multi ? p.name : p.code,
      estimees: Math.max(0, args.ventes[p.code] ?? 0),
      livrables: args.livrables[p.code] ?? 0,
      stockOuverture: multi
        ? (state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0)
        : state.finishedGoods.quantity,
      planSaisi: saisies[k]!.productionPlan,
      planRetenu,
      planApprovisionne: planRetenu * coupe * rationnement,
      produit: multi ? (detail?.produced ?? 0) : resultat.production.produced,
      rebuts: multi ? (detail?.defectUnits ?? 0) : (resultat.qualityCosts?.defectUnits ?? 0),
      heuresParUnite: p.hoursPerUnit,
      rupture,
      rationnement,
    };
  });
  return {
    gamme: multi,
    references,
    capaciteMachine: resultat.production.machineCapacity,
    capaciteMachineAPlein: capaciteDeLAtelier(scenario, state).machine,
    capaciteMainDOeuvre: resultat.production.laborCapacity,
    effectif: state.headcount,
    ...(!multi && resultat.supplier?.supplyDisruption ? { ruptureDeLUsine: true } : {}),
  };
}
