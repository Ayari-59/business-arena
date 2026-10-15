import type { RoundDecisions } from "@/engine/types";
import type { DecisionDeModule } from "@/engine/modules/ouverture";
import { MACHINE_ATELIER } from "@/engine/modules/effets";

export type { DecisionDeModule } from "@/engine/modules/ouverture";

/**
 * LES MODULES DU SCÉNARIO, LUS SUR LE FORMULAIRE.
 *
 * Les catalogues optionnels d'un scénario se décident par des cases à cocher,
 * ou par un nombre (l'effectif à former, le montant à tirer). Chaque champ
 * porte un NOM UNIQUE, `module.<décision>.<id>` : le brouillon du navigateur
 * range ses champs par nom, et des cases partageant un même nom se seraient
 * toutes recochées à la restauration. L'arrêt d'un élément en cours se coche
 * sous `module.arret.<décision>.<id>`.
 *
 * Cette lecture est pure et sert aux deux côtés, comme `decisions-saisies` :
 * le navigateur (résultat estimé) et l'action serveur (validation, puis
 * moteur). Un module absent du formulaire reste absent des décisions.
 */

/** Les décisions de module qui se décident par une liste d'identifiants. */
export const DECISIONS_PAR_IDENTIFIANT = [
  "activeCapacityOptionIds",
  "enteredMarketIds",
  "startedInnovationIds",
  "activeRseActionIds",
  "activePricingStrategyIds",
  "activeCrisisPlanIds",
  "activatePartnershipIds",
  "startDigitalProjectIds",
  "activeBrandActionIds",
  "activeCommercialActionIds",
  "activeContractIds",
  "activeHRPolicyIds",
  "startedRdActionIds",
] as const satisfies readonly (keyof RoundDecisions & DecisionDeModule)[];

export type DecisionParIdentifiant = (typeof DECISIONS_PAR_IDENTIFIANT)[number];

export const PREFIXE_DES_MODULES = "module.";
const ARRET = "arret";

/** Le nom du champ d'une case de module : `module.<décision>.<id>`. */
export function champDeModule(decision: DecisionDeModule, id: string): string {
  return `${PREFIXE_DES_MODULES}${decision}.${id}`;
}

/** Le nom de la case qui arrête un élément en cours : `module.arret.<décision>.<id>`. */
export function arretDeModule(decision: DecisionDeModule, id: string): string {
  return `${PREFIXE_DES_MODULES}${ARRET}.${decision}.${id}`;
}

const estDecisionParIdentifiant = (x: string): x is DecisionParIdentifiant =>
  (DECISIONS_PAR_IDENTIFIANT as readonly string[]).includes(x);

/** Ce que les champs de module décident, prêt à fusionner dans `RoundDecisions`. */
export type DecisionsDeModules = Pick<RoundDecisions, DecisionDeModule | "stoppedModuleItems">;

/** Coupe `a.b` à son premier point : `[a, b]`, ou `null`. */
function couper(x: string): [string, string] | null {
  const point = x.indexOf(".");
  if (point <= 0 || point === x.length - 1) return null;
  return [x.slice(0, point), x.slice(point + 1)];
}

/** Un nombre saisi à la française (espaces, virgule) ; `null` si vide ou illisible. */
function nombre(valeur: string): number | null {
  const net = valeur.replace(/[\s  ]/g, "").replace(",", ".");
  if (net === "") return null;
  const n = Number(net);
  return Number.isFinite(n) ? n : null;
}

/**
 * Lit les champs de module remplis. Seules les décisions qui portent au moins
 * un choix sont émises : rien coché ni saisi, rien d'ajouté aux décisions.
 */
export function modulesSaisis(entries: Iterable<[string, FormDataEntryValue]>): DecisionsDeModules {
  const parIdentifiant = new Map<DecisionParIdentifiant, string[]>();
  const qualite: { actionCode: string; level: number }[] = [];
  const securite: { actionCode: string }[] = [];
  const formation: { programId: string; enrolledCount: number }[] = [];
  const maintenance: { machineId: string; actionCode: string; level: number }[] = [];
  const tirages: { optionId: string; amount: number }[] = [];
  const arrets: { module: string; id: string }[] = [];
  for (const [nom, valeur] of entries) {
    if (!nom.startsWith(PREFIXE_DES_MODULES) || typeof valeur !== "string") continue;
    const coupe = couper(nom.slice(PREFIXE_DES_MODULES.length));
    if (!coupe) continue;
    const [decision, id] = coupe;
    if (decision === ARRET) {
      const cible = couper(id);
      if (cible && !arrets.some((a) => a.module === cible[0] && a.id === cible[1]))
        arrets.push({ module: cible[0], id: cible[1] });
    } else if (decision === "qualityActions") {
      const niveau = Number(valeur);
      if (Number.isInteger(niveau) && niveau > 0) qualite.push({ actionCode: id, level: niveau });
    } else if (decision === "hsActions") {
      securite.push({ actionCode: id });
    } else if (decision === "trainingEnrollments") {
      const effectif = nombre(valeur);
      if (effectif !== null && effectif > 0) formation.push({ programId: id, enrolledCount: effectif });
    } else if (decision === "financingDraws") {
      const montant = nombre(valeur);
      if (montant !== null && montant > 0) tirages.push({ optionId: id, amount: montant });
    } else if (decision === "maintenanceDecisions") {
      // `module.maintenanceDecisions.<type>.<niveau>` : sur tout l'atelier.
      const point = id.lastIndexOf(".");
      const niveau = Number(id.slice(point + 1));
      if (point > 0 && Number.isInteger(niveau) && niveau > 0)
        maintenance.push({ machineId: MACHINE_ATELIER, actionCode: id.slice(0, point), level: niveau });
    } else if (estDecisionParIdentifiant(decision)) {
      const liste = parIdentifiant.get(decision) ?? [];
      if (!liste.includes(id)) liste.push(id);
      parIdentifiant.set(decision, liste);
    }
  }
  const lu: DecisionsDeModules = {};
  for (const [decision, ids] of parIdentifiant) lu[decision] = ids;
  if (qualite.length > 0) lu.qualityActions = qualite;
  if (securite.length > 0) lu.hsActions = securite;
  if (formation.length > 0) lu.trainingEnrollments = formation;
  if (maintenance.length > 0) lu.maintenanceDecisions = maintenance;
  if (tirages.length > 0) lu.financingDraws = tirages;
  if (arrets.length > 0) lu.stoppedModuleItems = arrets;
  return lu;
}
