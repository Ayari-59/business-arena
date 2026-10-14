import { computeHr } from "../hr";
import { fleetCapacity } from "../simulation";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";

/**
 * LE PLAFOND D'INVESTISSEMENT QUAND LES RESSOURCES HUMAINES SONT FERMÉES.
 *
 * Le propriétaire : « au niveau 3, on peut investir dans des machines,
 * augmenter la capacité, mais on ne gère pas les RH et donc on ne peut pas
 * augmenter le personnel. » La production est le minimum de la capacité
 * machine et de la capacité main-d'œuvre (`allocateProduction`) : à effectif
 * fixé, une machine achetée au-delà de ce que l'équipe fait tourner ne produit
 * rien. Aux niveaux qui ouvrent l'investissement sans ouvrir les embauches,
 * on ne peut donc pas acheter plus de capacité que l'équipe ne peut en servir.
 *
 * UNE SEULE SOURCE. Ce module calcule le plafond ; la feuille de décision (la
 * borne et l'aide du champ), le refus du serveur, les concurrents pilotés et
 * la gestion de référence de « mérite ou chance » le lisent tous ici. Il ne
 * touche pas au moteur : une décision déjà enregistrée se rejoue telle quelle.
 *
 *   marge = capacité main-d'œuvre ÷ disponibilité − capacité machine
 *
 * · la capacité main-d'œuvre est celle que la feuille affiche : effectif ×
 *   heures × productivité × morale du tour ÷ heures par unité du produit de
 *   référence du scénario ;
 * · la capacité machine compte le parc en service ET les machines commandées
 *   au tour précédent, qui entrent en service à celui-ci ;
 * · la disponibilité (l'usure que l'entretien commande) s'applique aussi aux
 *   machines achetées : à 90 %, il faut 1 000 de capacité nominale pour en
 *   rendre 900. La marge est donc exprimée en capacité NOMINALE, celle qu'on
 *   achète ;
 * · elle s'arrondit à l'unité d'investissement : une machine entière par type
 *   (un parc typé), une unité de capacité (l'investissement homogène).
 */

/** Ce qui décide si le plafond s'applique : les deux leviers du niveau joué. */
export interface LeviersDuPlafond {
  hr: boolean;
  investment: boolean;
}

/** Le plafond ne vaut que là où l'on investit sans pouvoir embaucher. */
export function investissementPlafonne(leviers: LeviersDuPlafond | null | undefined): boolean {
  return !!leviers && leviers.investment && !leviers.hr;
}

export interface CapaciteDeLAtelier {
  /** Ce que l'équipe fait tourner par tour, en unités vendues. */
  mainDOeuvre: number;
  /** Capacité machine nominale : le parc en service et celui qui y entre à ce tour. */
  machine: number;
  /** Disponibilité machine (0..1) : ce que l'usure laisse de la capacité nominale. */
  disponibilite: number;
  /** Ce que les machines rendent vraiment : nominale × disponibilité. */
  machineDisponible: number;
  effectif: number;
  productivite: number;
  /** La morale du tour (indice de salaire), qui multiplie la productivité. */
  morale: number;
}

/**
 * La capacité de l'atelier à l'ouverture d'un tour. `rh` : les décisions RH du
 * tour, quand le niveau les ouvre (la morale en dépend) ; absentes, l'indice de
 * salaire reste celui du marché et la morale vaut 1.
 */
export function capaciteDeLAtelier(
  scenario: EngineScenarioConfig,
  state: CompanyState,
  rh?: RoundDecisions["hr"],
): CapaciteDeLAtelier {
  const machine = scenario.equipment
    ? fleetCapacity(
        [...(state.fleet ?? []), ...(state.pendingFleet ?? [])],
        new Map(scenario.equipment.types.map((t) => [t.code, t])),
      )
    : state.machineCapacity + (state.pendingCapacity ?? 0);
  const morale = computeHr({
    config: scenario.hr,
    decisions: rh,
    headcount: state.headcount,
    productivity: state.productivity,
  }).morale;
  const heuresParUnite = scenario.product.hoursPerUnit;
  const mainDOeuvre =
    heuresParUnite > 0
      ? (state.headcount * state.hoursPerEmployee * state.productivity * morale) / heuresParUnite
      : 0;
  const disponibilite = state.availability ?? 1;
  return {
    mainDOeuvre,
    machine,
    disponibilite,
    machineDisponible: machine * disponibilite,
    effectif: state.headcount,
    productivite: state.productivity,
    morale,
  };
}

/** Un type de machine, et combien on peut en acheter à ce tour sous le plafond. */
export interface MachineSousLePlafond {
  code: string;
  nom: string;
  capacite: number;
  maxParTour: number;
  /** Machines entières qui tiennent dans la marge (et dans le maximum par tour). */
  maxSousLePlafond: number;
}

export type UniteDInvestissement =
  | { type: "machines"; machines: MachineSousLePlafond[] }
  | { type: "capacite"; maxParTour: number; maxSousLePlafond: number };

export interface PlafondDInvestissement extends CapaciteDeLAtelier {
  /** Le niveau ouvre l'investissement sans ouvrir les embauches. */
  applique: boolean;
  /**
   * La capacité nominale qu'on peut encore ajouter sans dépasser l'équipe
   * (entière, jamais négative). Calculée à tous les niveaux : là où le
   * plafond ne s'applique pas, elle dit seulement à partir d'où il faudra
   * embaucher.
   */
  marge: number;
  /** Ce qu'on achète dans ce scénario ; `null` s'il n'ouvre aucun investissement. */
  unite: UniteDInvestissement | null;
}

const EPSILON = 1e-6;

export function plafondDInvestissement(
  scenario: EngineScenarioConfig,
  state: CompanyState,
  leviers: LeviersDuPlafond | null | undefined,
  rh?: RoundDecisions["hr"],
): PlafondDInvestissement {
  const atelier = capaciteDeLAtelier(scenario, state, rh);
  const utile =
    atelier.disponibilite > 0 ? atelier.mainDOeuvre / atelier.disponibilite : atelier.mainDOeuvre;
  const marge = Math.max(0, Math.floor(utile - atelier.machine + EPSILON));
  const unite: UniteDInvestissement | null = scenario.equipment
    ? {
        type: "machines",
        machines: scenario.equipment.types.map((t) => ({
          code: t.code,
          nom: t.name,
          capacite: t.capacityPerUnit,
          maxParTour: t.maxPerRound,
          maxSousLePlafond:
            t.capacityPerUnit > 0
              ? Math.min(t.maxPerRound, Math.floor(marge / t.capacityPerUnit + EPSILON))
              : t.maxPerRound,
        })),
      }
    : scenario.investment
      ? {
          type: "capacite",
          maxParTour: scenario.investment.maxPerRound,
          maxSousLePlafond: Math.min(scenario.investment.maxPerRound, marge),
        }
      : null;
  return { ...atelier, applique: investissementPlafonne(leviers), marge, unite };
}

/**
 * La capacité NETTE qu'un investissement ajoute au tour suivant : les machines
 * achetées moins celles qu'on cède (parc typé), ou les unités achetées. Lue
 * sur l'unité du plafond, qui porte la capacité de chaque type : la feuille de
 * décision, qui n'a pas le scénario, fait ainsi le même calcul que le serveur.
 */
export function capaciteAjoutee(
  investissement: RoundDecisions["investment"],
  unite: UniteDInvestissement | null,
): number {
  if (!investissement || !unite) return 0;
  if (unite.type === "machines") {
    const capacite = new Map(unite.machines.map((m) => [m.code, m.capacite]));
    const somme = (lignes: { typeCode: string; quantity: number }[] | undefined) =>
      (lignes ?? []).reduce((s, l) => s + Math.max(0, l.quantity) * (capacite.get(l.typeCode) ?? 0), 0);
    return somme(investissement.equipmentBuy) - somme(investissement.equipmentSell);
  }
  return Math.max(0, investissement.machineCapacityUnits ?? 0);
}

/** L'investissement dépasse-t-il le plafond ? Toujours faux là où il ne s'applique pas. */
export function depasseLePlafond(
  plafond: Pick<PlafondDInvestissement, "applique" | "marge" | "unite">,
  investissement: RoundDecisions["investment"],
): boolean {
  if (!plafond.applique) return false;
  return capaciteAjoutee(investissement, plafond.unite) > plafond.marge + EPSILON;
}

/**
 * Ramène un investissement sous le plafond, pour qui décide sans formulaire
 * (les concurrents pilotés, la gestion de référence). Les achats sont réduits
 * dans l'ordre où ils sont demandés, machine entière par machine entière ; les
 * cessions restent, et la capacité qu'elles libèrent peut être rachetée.
 */
export function bornerLInvestissement(
  decisions: RoundDecisions,
  plafond: PlafondDInvestissement,
): RoundDecisions {
  const inv = decisions.investment;
  const unite = plafond.unite;
  if (!inv || !unite || !depasseLePlafond(plafond, inv)) return decisions;
  if (unite.type === "machines") {
    const capacite = new Map(unite.machines.map((m) => [m.code, m.capacite]));
    let reste = plafond.marge + capaciteAjoutee({ equipmentSell: inv.equipmentSell }, unite) * -1;
    const achats: { typeCode: string; quantity: number }[] = [];
    for (const l of inv.equipmentBuy ?? []) {
      const c = capacite.get(l.typeCode) ?? 0;
      const quantite = c > 0 ? Math.min(Math.max(0, l.quantity), Math.floor(reste / c + EPSILON)) : 0;
      if (quantite > 0) {
        achats.push({ typeCode: l.typeCode, quantity: quantite });
        reste -= quantite * c;
      }
    }
    return { ...decisions, investment: { ...inv, equipmentBuy: achats } };
  }
  return {
    ...decisions,
    investment: { ...inv, machineCapacityUnits: Math.min(inv.machineCapacityUnits ?? 0, plafond.marge) },
  };
}
