/**
 * Suivi individuel des machines (granularité StratiRAC).
 *
 * Chaque machine porte son identifiant, son âge, son usure et son état
 * opérationnel. La capacité de l'entreprise est calculée sur les seules
 * machines opérationnelles — une machine en panne ne produit pas.
 */

import type { EquipmentItem, EquipmentTypeDef, MachineRecord } from "../types";

/**
 * Initialise un parc de MachineRecord depuis les lots EquipmentItem existants.
 * Appelé au premier tour d'une partie qui active le suivi individuel, ou lors
 * de la migration d'un état historique (fleet sans machineFleet).
 */
export function initMachineFleet(fleet: EquipmentItem[], roundIndex: number): MachineRecord[] {
  const records: MachineRecord[] = [];
  for (const item of fleet) {
    for (let i = 0; i < item.count; i++) {
      const age = Math.max(0, roundIndex - item.acquiredRound);
      // Usure initiale estimée : les machines plus vieilles sont plus usées.
      const estimatedWear = Math.min(0.5, age * 0.03);
      records.push({
        id: `${item.typeCode}-r${item.acquiredRound}-${i}`,
        typeCode: item.typeCode,
        purchasedRound: item.acquiredRound,
        age,
        wear: estimatedWear,
        isOperational: true,
        lastMaintenanceRound: item.acquiredRound,
      });
    }
  }
  return records;
}

/**
 * Calcule la capacité machine d'un parc individuel en ne comptant que
 * les machines opérationnelles.
 */
export function machineFleetCapacity(
  fleet: MachineRecord[],
  types: Map<string, EquipmentTypeDef>,
): number {
  return fleet.reduce((sum, machine) => {
    if (!machine.isOperational) return sum;
    const typ = types.get(machine.typeCode);
    return sum + (typ ? typ.capacityPerUnit : 0);
  }, 0);
}

/**
 * Met à jour le parc individuel en fin de tour :
 * - incrémente l'âge de chaque machine,
 * - calcule la nouvelle usure,
 * - tire aléatoirement des pannes pour les machines très usées.
 */
export function updateMachineFleet(args: {
  fleet: MachineRecord[];
  maintenanceBudget: number;
  maintenanceReference: number;
  types: Map<string, EquipmentTypeDef>;
  rng: () => number;
  roundIndex: number;
}): MachineRecord[] {
  const { fleet, maintenanceBudget, maintenanceReference, types, rng, roundIndex } = args;
  const maintenanceRatio =
    maintenanceReference > 0 ? Math.min(1, maintenanceBudget / maintenanceReference) : 1;

  return fleet.map((machine) => {
    const typ = types.get(machine.typeCode);
    const wearRate = typ?.wearRatePerRound ?? 0.05;
    const breakdownThreshold = typ?.breakdownThreshold ?? 0.7;
    const repairRate = typ?.maintenanceRepairRate ?? 0.1;

    const newAge = machine.age + 1;
    const wearIncrease = wearRate * (1 + newAge * 0.01) * (1 - maintenanceRatio * 0.4);
    const wearRepair = maintenanceRatio * repairRate;
    const newWear = Math.min(1, Math.max(0, machine.wear + wearIncrease - wearRepair));

    let isOperational = machine.isOperational;
    if (machine.isOperational && newWear > breakdownThreshold) {
      const breakdownProbability =
        ((newWear - breakdownThreshold) / (1 - breakdownThreshold)) * 0.3;
      if (rng() < breakdownProbability) {
        isOperational = false;
      }
    }

    if (!isOperational && maintenanceRatio >= 0.5) {
      const repairProbability = (maintenanceRatio - 0.5) * 0.4;
      if (rng() < repairProbability) {
        isOperational = true;
      }
    }

    const lastMaintenanceRound =
      maintenanceRatio > 0.3 ? roundIndex : machine.lastMaintenanceRound;

    return {
      ...machine,
      age: newAge,
      wear: newWear,
      isOperational,
      lastMaintenanceRound,
    };
  });
}

/**
 * Retire `count` machines du type `typeCode` du parc, en commençant par les
 * plus anciennes (FIFO).
 */
export function removeMachinesFromFleet(
  fleet: MachineRecord[],
  typeCode: string,
  count: number,
): MachineRecord[] {
  let toRemove = count;
  const candidates = fleet
    .filter((m) => m.typeCode === typeCode)
    .sort(
      (a, b) =>
        a.purchasedRound - b.purchasedRound ||
        (a.isOperational ? 0 : 1) - (b.isOperational ? 0 : 1),
    );
  const removedIds = new Set<string>();
  for (const machine of candidates) {
    if (toRemove <= 0) break;
    removedIds.add(machine.id);
    toRemove--;
  }
  return fleet.filter((m) => !removedIds.has(m.id));
}

/**
 * Crée de nouveaux enregistrements de machines pour un achat (mise en service
 * au tour suivant via pendingMachineFleet).
 */
export function createNewMachines(
  typeCode: string,
  count: number,
  roundIndex: number,
  existingFleetSize: number,
): MachineRecord[] {
  const machines: MachineRecord[] = [];
  for (let i = 0; i < count; i++) {
    machines.push({
      id: `${typeCode}-r${roundIndex}-${existingFleetSize + i}`,
      typeCode,
      purchasedRound: roundIndex,
      age: 0,
      wear: 0,
      isOperational: true,
      lastMaintenanceRound: roundIndex,
    });
  }
  return machines;
}

/**
 * Calcule le multiplicateur de maintenance effectif pour un parc individuel,
 * pondéré par la capacité de chaque machine opérationnelle.
 */
export function machineFleetMaintenanceMultiplier(
  fleet: MachineRecord[],
  types: Map<string, EquipmentTypeDef>,
): number {
  let totalCapacity = 0;
  let weightedSum = 0;
  for (const machine of fleet) {
    if (!machine.isOperational) continue;
    const typ = types.get(machine.typeCode);
    if (!typ) continue;
    totalCapacity += typ.capacityPerUnit;
    weightedSum += typ.capacityPerUnit * typ.maintenanceMultiplier;
  }
  return totalCapacity > 0 ? weightedSum / totalCapacity : 1;
}
