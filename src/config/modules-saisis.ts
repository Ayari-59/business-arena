import type { RoundDecisions } from "@/engine/types";

/**
 * LES MODULES DU SCÉNARIO, LUS SUR LE FORMULAIRE.
 *
 * Les catalogues optionnels d'un scénario (actions qualité, hygiène et
 * sécurité, capacité, export, innovation, programme RSE, stratégie de prix,
 * plans de crise, partenariats, projets digitaux, marque) se décident par des
 * cases à cocher. Chaque case porte un NOM UNIQUE, `module.<décision>.<id>` :
 * le brouillon du navigateur range ses champs par nom, et des cases partageant
 * un même nom se seraient toutes recochées à la restauration.
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
] as const satisfies readonly (keyof RoundDecisions)[];

export type DecisionParIdentifiant = (typeof DECISIONS_PAR_IDENTIFIANT)[number];

/** Toutes les décisions de module exposées à l'écran. */
export type DecisionDeModule = DecisionParIdentifiant | "qualityActions" | "hsActions";

export const PREFIXE_DES_MODULES = "module.";

/** Le nom du champ d'une case de module : `module.<décision>.<id>`. */
export function champDeModule(decision: DecisionDeModule, id: string): string {
  return `${PREFIXE_DES_MODULES}${decision}.${id}`;
}

const estDecisionParIdentifiant = (x: string): x is DecisionParIdentifiant =>
  (DECISIONS_PAR_IDENTIFIANT as readonly string[]).includes(x);

/** Ce que les cases de module cochées décident, prêt à fusionner dans `RoundDecisions`. */
export type DecisionsDeModules = Pick<RoundDecisions, DecisionDeModule>;

/**
 * Lit les cases de module cochées. Seules les décisions qui portent au moins
 * un choix sont émises : rien coché, rien d'ajouté aux décisions du tour.
 */
export function modulesSaisis(entries: Iterable<[string, FormDataEntryValue]>): DecisionsDeModules {
  const parIdentifiant = new Map<DecisionParIdentifiant, string[]>();
  const qualite: { actionCode: string; level: number }[] = [];
  const securite: { actionCode: string }[] = [];
  for (const [nom, valeur] of entries) {
    if (!nom.startsWith(PREFIXE_DES_MODULES) || typeof valeur !== "string") continue;
    const reste = nom.slice(PREFIXE_DES_MODULES.length);
    const point = reste.indexOf(".");
    if (point <= 0) continue;
    const decision = reste.slice(0, point);
    const id = reste.slice(point + 1);
    if (!id) continue;
    if (decision === "qualityActions") {
      const niveau = Number(valeur);
      if (Number.isInteger(niveau) && niveau > 0) qualite.push({ actionCode: id, level: niveau });
    } else if (decision === "hsActions") {
      securite.push({ actionCode: id });
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
  return lu;
}
