import { leviersOuverts, type LevierDeDecision } from "@/config/decisions";
import type { DifficultyPreset } from "@/config/difficulty";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { COMMUNICATION_AXIS_LABELS } from "@/engine/market/communication";
import { toGamme } from "@/engine/gamme";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { formatDecimal, formatEuroCents, formatUnits } from "@/lib/format";

/**
 * LES DÉCISIONS D'UNE ÉQUIPE, LUES PAR SON ENSEIGNANT PENDANT LE TOUR.
 *
 * Le tableau des équipes du pilotage disait qui avait validé, par qui et à
 * quelle heure ; il ne disait pas QUOI. La vue de l'enseignant lit pourtant
 * déjà les lignes `decisions` du tour en cours. Ce module en fait des lignes
 * courtes, et c'est tout :
 *  - les décisions PRINCIPALES (prix, volume, fournisseur, marketing), celles
 *    que la ligne repliée montre ;
 *  - les AUTRES leviers que le niveau de la partie ouvre, derrière « Voir tout » ;
 *  - des REPÈRES : trois ou quatre phrases simples, tirées de ce que la
 *    décision porte déjà (le résultat estimé que le serveur a calculé à la
 *    validation, `estimationAConserver`) et des coûts du scénario que la
 *    feuille affiche. Aucun second calcul du tour : rien ici n'appelle le moteur.
 *
 * Les libellés sont ceux de la feuille : le vocabulaire du secteur pour le prix
 * et le volume, le registre des leviers (`config/decisions.ts`) pour le reste.
 *
 * CONFIDENTIEL. Ce qui sort d'ici n'est servi qu'au pilotage de l'enseignant
 * propriétaire de la partie (`getTeacherGameView`). Ni le mur projeté ni
 * l'arène des élèves ne le lisent, et une garde le vérifie
 * (`tests/architecture/decisions-au-pilotage.test.ts`).
 */

/** Une décision mise en mots : son libellé et sa valeur, déjà formatée. */
export interface DecisionLue {
  libelle: string;
  valeur: string;
}

/** Où en est la décision d'une équipe humaine pour le tour en cours. */
export type EtatDeLaDecision = "validee" | "brouillon" | "aucune";

export interface DecisionsAuPilotage {
  etat: EtatDeLaDecision;
  /** La ligne repliée : prix, volume, fournisseur, marketing. Vide sans décision. */
  principales: DecisionLue[];
  /** Les autres leviers ouverts, derrière « Voir tout ». */
  autres: DecisionLue[];
  /** Les repères, une courte phrase chacun ; vide quand rien n'est à signaler. */
  reperes: string[];
  /**
   * LE BROUILLON D'ÉQUIPE : qui l'a modifié en dernier, et quand (ISO). `null`
   * pour une décision validée ou sans auteur connu.
   */
  modification: { nom: string | null; quand: string } | null;
}

/** Ce qu'il faut savoir de la partie pour lire une décision. */
export interface CadreDeLecture {
  scenario: EngineScenarioConfig;
  vocabulaire: Pick<ScenarioVocabulary, "priceLabel" | "productionPlanLabel" | "units">;
  /** Les leviers ouverts de la partie, ceux figés à sa création (`presetFromProfile`). */
  drapeaux: DifficultyPreset["decisions"];
}

/** Les leviers de la ligne repliée, dans l'ordre de la feuille. */
const PRINCIPAUX = ["price", "productionPlan", "supplierChoice", "marketingBudget"] as const;

/**
 * LA PRODUCTION « TRÈS AU-DESSUS » DES VENTES ESTIMÉES : une fois et demie ce
 * que l'équipe a dit qu'elle vendrait. En dessous, c'est un stock de sécurité ;
 * au-dessus, la moitié de la production au moins attend en stock.
 */
export const SEUIL_DE_SURPRODUCTION = 1.5;

// Un brouillon peut porter un prix ou un volume vide : il se lit « — », pas « 0,00 € ».
const euros = (v: number | null | undefined) =>
  v === null || Number.isNaN(v) ? "—" : formatEuroCents(v ?? 0);
const unites = (v: number | null | undefined) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : formatUnits(v);
const ouiNon = (v: boolean | undefined) => (v ? "oui" : "non");

/** Le nom d'un fournisseur du scénario ; son code s'il n'y est plus. */
function nomDuFournisseur(scenario: EngineScenarioConfig, code: string | undefined): string {
  if (!code) return "aucun";
  return scenario.suppliers?.find((s) => s.code === code)?.name ?? code;
}

/** La valeur d'un levier dans une décision ; `null` quand le levier n'y figure pas. */
function valeurDuLevier(champ: string, d: RoundDecisions, cadre: CadreDeLecture): string | null {
  const s = cadre.scenario;
  switch (champ) {
    case "price":
      return euros(d.price);
    case "productionPlan":
      return `${unites(d.productionPlan)} ${cadre.vocabulaire.units}`;
    case "acceptOrder":
      return d.acceptOrder === undefined ? null : ouiNon(d.acceptOrder);
    case "supplierChoice":
      return d.supplierChoice === undefined ? null : nomDuFournisseur(s, d.supplierChoice);
    case "marketingBudget":
      return euros(d.marketingBudget);
    case "qualityBudget":
      return euros(d.qualityBudget);
    case "maintenanceBudget":
      return euros(d.maintenanceBudget);
    case "rdBudget":
      return euros(d.rdBudget);
    case "brandMarketingBudget":
      return euros(d.brandMarketingBudget);
    case "communicationAxis":
      return d.communicationAxis ? COMMUNICATION_AXIS_LABELS[d.communicationAxis].label : "aucun";
    case "hire":
      return formatUnits(d.hr?.hire ?? 0);
    case "fire":
      return formatUnits(d.hr?.fire ?? 0);
    case "trainingBudget":
      return euros(d.hr?.trainingBudget);
    case "salaryPercent":
      return `${formatDecimal((d.hr?.salaryIndex ?? 1) * 100, 2)} %`;
    case "rseBudget":
      return euros(d.rse?.budget);
    case "rseInvestment":
      return euros(d.rse?.investment);
    case "newLoan":
      return euros(d.finance?.newLoan);
    case "loanRepayment":
      return euros(d.finance?.loanRepayment);
    case "capitalIncrease":
      return euros(d.finance?.capitalIncrease);
    case "machineCapacityUnits":
      return formatUnits(d.investment?.machineCapacityUnits ?? 0);
    case "dividend":
      return euros(d.finance?.dividend);
    case "discount":
      return euros(d.treasury?.discount);
    case "factoring":
      return euros(d.treasury?.factoring);
    case "placement":
      return euros(d.treasury?.placement);
    case "insurance": {
      if (!d.insurance) return "non";
      if (d.insurance === true) return "oui";
      return s.insurance?.formulas?.find((f) => f.code === d.insurance)?.name ?? "oui";
    }
    case "studyMarket":
      return d.studies ? ouiNon(d.studies.market) : null;
    case "studyPrice":
      return d.studies ? ouiNon(d.studies.price) : null;
    case "studyFinance":
      return d.studies ? ouiNon(d.studies.finance) : null;
    case "studyProject":
      return d.studies ? ouiNon(d.studies.project) : null;
    default:
      return null;
  }
}

/** Le libellé d'un levier : celui du secteur pour le prix et le volume, sinon celui du registre. */
function libelleDuLevier(l: LevierDeDecision, cadre: CadreDeLecture): string {
  if (l.champ === "price") return cadre.vocabulaire.priceLabel;
  if (l.champ === "productionPlan") return cadre.vocabulaire.productionPlanLabel;
  return l.nom;
}

/** Les leviers « secteur » qu'aucun scénario n'offre ici ne se lisent pas. */
function offertParLeScenario(champ: string, s: EngineScenarioConfig): boolean {
  if (champ === "supplierChoice") return (s.suppliers?.length ?? 0) > 0;
  if (champ === "acceptOrder") return (s.orderOffers?.length ?? 0) > 0;
  return true;
}

/**
 * Les décisions d'une équipe, mises en lignes. En gamme, le prix, le volume et
 * le fournisseur se lisent référence par référence, comme sur la feuille.
 */
export function lireLesDecisions(
  d: RoundDecisions,
  cadre: CadreDeLecture,
): { principales: DecisionLue[]; autres: DecisionLue[] } {
  const s = cadre.scenario;
  const ouverts = leviersOuverts(cadre.drapeaux, s).filter((l) => offertParLeScenario(l.champ, s));
  const gamme = d.products ? toGamme(s).filter((p) => d.products![p.code]) : [];
  const principales: DecisionLue[] = [];
  const autres: DecisionLue[] = [];
  for (const l of ouverts) {
    const principal = (PRINCIPAUX as readonly string[]).includes(l.champ);
    const libelle = libelleDuLevier(l, cadre);
    // GAMME : une ligne par référence, sous le nom qu'elle porte à l'écran.
    if (gamme.length > 0 && (l.champ === "price" || l.champ === "productionPlan" || l.champ === "supplierChoice")) {
      for (const p of gamme) {
        const own = d.products![p.code]!;
        const valeur =
          l.champ === "price"
            ? euros(own.price)
            : l.champ === "productionPlan"
              ? `${unites(own.productionPlan)} ${cadre.vocabulaire.units}`
              : nomDuFournisseur(s, own.supplierChoice ?? d.supplierChoice);
        principales.push({ libelle: `${libelle} · ${p.name}`, valeur });
      }
      continue;
    }
    const valeur = valeurDuLevier(l.champ, d, cadre);
    if (valeur === null) continue;
    (principal ? principales : autres).push({ libelle, valeur });
  }
  return { principales, autres };
}

/**
 * LES REPÈRES : ce qu'un enseignant voudrait voir avant de clore, en une
 * phrase chacun. Quatre, pas davantage, et tous tirés de ce qui existe :
 *  1. un prix sous le coût variable que la feuille affiche à l'équipe
 *     (matières, au multiplicateur du fournisseur choisi, et autres coûts
 *     variables du scénario) ;
 *  2. un résultat estimé en perte, et 3. une trésorerie estimée en découvert,
 *     tous deux lus dans l'estimation que le SERVEUR a calculée à la
 *     validation (`salesEstimate.estimate`) ;
 *  4. une production très au-dessus des ventes que l'équipe a elle-même
 *     estimées (`SEUIL_DE_SURPRODUCTION`).
 * Une équipe qui n'a rien estimé n'a que le premier : les trois autres
 * supposent son estimation.
 */
export function reperesDesDecisions(d: RoundDecisions, scenario: EngineScenarioConfig): string[] {
  const reperes: string[] = [];

  // 1. Le prix sous le coût variable, référence par référence en gamme.
  const multiplicateur = (code: string | undefined) =>
    scenario.suppliers?.find((f) => f.code === code)?.costMultiplier ?? 1;
  const gamme = toGamme(scenario);
  const sousLeCout = gamme.filter((p) => {
    const own = d.products?.[p.code];
    if (d.products && !own) return false;
    const prix = own ? own.price : d.price;
    const fournisseur = own?.supplierChoice ?? d.supplierChoice;
    const cout = p.materialCostPerUnit * multiplicateur(fournisseur) + p.otherVariableCostPerUnit;
    return Number.isFinite(prix) && prix < cout;
  });
  if (sousLeCout.length > 0) {
    reperes.push(
      d.products
        ? `Prix sous le coût variable pour ${sousLeCout.map((p) => p.name).join(", ")} : chaque vente fait perdre de l'argent.`
        : "Prix sous le coût variable : chaque vente fait perdre de l'argent.",
    );
  }

  const estimation = d.salesEstimate;
  // 2. et 3. Le compte que le serveur a estimé à la validation.
  if (estimation?.estimate) {
    if (estimation.estimate.netIncome < 0) {
      reperes.push(`Résultat estimé en perte : ${formatEuroCents(estimation.estimate.netIncome)}.`);
    }
    if (estimation.estimate.netTreasury < 0) {
      reperes.push(
        `Trésorerie estimée en découvert à la fin du tour : ${formatEuroCents(estimation.estimate.netTreasury)}.`,
      );
    }
  }

  // 4. Produire bien plus qu'on ne pense vendre.
  if (
    estimation &&
    estimation.units > 0 &&
    Number.isFinite(d.productionPlan) &&
    d.productionPlan >= SEUIL_DE_SURPRODUCTION * estimation.units
  ) {
    reperes.push(
      `Production très au-dessus des ventes estimées : ${formatUnits(d.productionPlan)} contre ${formatUnits(estimation.units)}.`,
    );
  }
  return reperes;
}

/**
 * LA LECTURE D'UNE ÉQUIPE HUMAINE : la décision validée, sinon un brouillon
 * enregistré (« pas encore validé »), sinon rien. `ligne` est la ligne
 * `decisions` du tour en cours, quand il y en a une.
 */
export function lireLaDecisionDuTour(
  ligne: { status: string; payload: RoundDecisions } | undefined,
  cadre: CadreDeLecture,
  /** Pour un brouillon : qui l'a modifié en dernier, et quand. */
  modification: { nom: string | null; quand: string } | null = null,
): DecisionsAuPilotage {
  if (!ligne || (ligne.status !== "validated" && ligne.status !== "draft")) {
    return { etat: "aucune", principales: [], autres: [], reperes: [], modification: null };
  }
  const { principales, autres } = lireLesDecisions(ligne.payload, cadre);
  const brouillon = ligne.status === "draft";
  const reperes = reperesDesDecisions(ligne.payload, cadre.scenario);
  return {
    etat: brouillon ? "brouillon" : "validee",
    principales,
    autres,
    // LES REPÈRES D'UN BROUILLON : le seul prix sous le coût variable, qui se lit
    // sur la saisie sans rien supposer. Les trois autres lisent le résultat que le
    // serveur estime À LA VALIDATION, qu'un brouillon n'a pas encore.
    reperes: brouillon ? reperes.filter((r) => r.startsWith("Prix sous le coût variable")) : reperes,
    modification: brouillon ? modification : null,
  };
}
