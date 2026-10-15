import type { CompanyState, EngineScenarioConfig, ProductCode, RoundDecisions, SupplierDef } from "../types";
import { suppliersOf, toGamme } from "../gamme";
import { actifEconomique, detteNette, ebeDouzeMois, toursParAn } from "./valorisation";
import type { ComptesDUneFiliale, FournisseurRachetable, PrixDeCession } from "./types";

/**
 * RACHETER UN FOURNISSEUR (niveau 7) : l'intégration verticale.
 *
 * LE MODÈLE COMPACT. Un fournisseur n'est pas une entreprise de la partie :
 * son chiffre d'affaires d'un tour est la somme des achats que lui font
 * toutes les entreprises de la partie, équipes et concurrents simulés ; son
 * EBE, ce qui reste après son coût variable et ses charges fixes. Il
 * renouvelle ses immobilisations au rythme où elles s'amortissent, sa dette
 * reste, son besoin en fonds de roulement suit son chiffre d'affaires, et sa
 * trésorerie fait le reste. Tout se recalcule des achats de la partie : pur.
 *
 * SA VALEUR, comme celle des entreprises : le plus haut de son actif net et
 * de sa valeur de rendement (multiple × EBE des douze derniers mois, moins sa
 * dette nette). Le prix demandé y ajoute la prime de contrôle.
 *
 * UNE FOIS RACHETÉ, sa capacité est celle qu'on a achetée : quand les
 * commandes la dépassent, il sert le groupe d'abord et rationne les autres au
 * prorata. Les autres clients paient toujours le prix du marché ; les achats
 * du groupe, consolidés, ne coûtent plus que leur coût (`consolidation.ts`).
 *
 * LES CONCURRENTS SIMULÉS ET LE FOURNISSEUR D'UN CONCURRENT, règle
 * déterministe : à partir du tour qui suit le rachat, un concurrent simulé
 * quitte un fournisseur racheté par une autre entreprise de la partie s'il
 * achète au prix (profils agressif et croissance : il ne confie pas ses
 * volumes à un concurrent qui fixe ses prix), ou s'il a été rationné au tour
 * d'avant ; il passe, référence par référence, au premier autre fournisseur
 * de son catalogue, et ne revient pas. Les équipes décident elles-mêmes.
 */

export const leFournisseur = (scenario: EngineScenarioConfig, code: string): FournisseurRachetable | undefined =>
  scenario.groupe?.fournisseurs?.find((f) => f.code === code);

/** Le chiffre d'affaires du fournisseur à chaque tour joué : la somme des achats de toutes les entreprises. */
export function chiffresDuFournisseur(companies: readonly CompanyState[], code: string): number[] {
  const n = Math.max(0, ...companies.map((c) => c.groupe?.achats[code]?.length ?? 0));
  return Array.from({ length: n }, (_, t) => companies.reduce((s, c) => s + (c.groupe?.achats[code]?.[t] ?? 0), 0));
}

/** Les comptes du fournisseur, tour par tour, de ses chiffres d'affaires ; [0] est son bilan de départ. */
export function comptesDuFournisseur(f: FournisseurRachetable, chiffres: readonly number[], tauxDImpot: number): ComptesDUneFiliale[] {
  const depart: ComptesDUneFiliale = {
    chiffreDAffaires: 0,
    ebe: 0,
    amortissement: 0,
    interets: 0,
    impot: 0,
    resultat: 0,
    immobilisations: f.immobilisations,
    bfr: 0,
    tresorerie: f.tresorerie,
    dette: f.dette,
    capitauxPropres: f.immobilisations + f.tresorerie - f.dette,
  };
  const out = [depart];
  for (const ca of chiffres) {
    const p = out[out.length - 1]!;
    const ebe = ca * (1 - f.tauxDeCoutVariable) - f.chargesFixesParTour;
    const amortissement = f.immobilisations / f.dureeDAmortissement;
    const interets = f.tauxDInteretParTour * f.dette;
    const avantImpot = ebe - amortissement - interets;
    const impot = tauxDImpot * Math.max(0, avantImpot);
    const resultat = avantImpot - impot;
    const bfr = f.bfr * ca;
    out.push({
      chiffreDAffaires: ca,
      ebe,
      amortissement,
      interets,
      impot,
      resultat,
      immobilisations: f.immobilisations,
      bfr,
      // les immobilisations sont renouvelées au rythme de leur amortissement
      tresorerie: p.tresorerie + ebe - interets - impot - amortissement - (bfr - p.bfr),
      dette: f.dette,
      capitauxPropres: p.capitauxPropres + resultat,
    });
  }
  return out;
}

/** Le bilan d'une filiale au format des entreprises, pour la valoriser comme elles. */
export const bilanDUneFiliale = (c: ComptesDUneFiliale, cours = 1) => ({
  fixedAssetsNet: c.immobilisations * cours,
  inventoryValue: 0,
  receivables: c.bfr * cours,
  cash: Math.max(0, c.tresorerie) * cours,
  equity: c.capitauxPropres * cours,
  financialDebt: c.dette * cours,
  payables: 0,
  overdraft: Math.max(0, -c.tresorerie) * cours,
});

/**
 * La valeur d'une société compacte à la clôture d'un tour : le plus haut de
 * son actif économique et de sa valeur de rendement, moins sa dette nette.
 * La fenêtre est complétée, tant qu'elle est courte, par l'EBE qui donne à
 * la société de départ sa valeur comptable. `ebe` en euros.
 */
export function valeurDUneSociete(args: {
  comptes: ComptesDUneFiliale[];
  ebe: number[];
  cours: number;
  coursDeDepart: number;
  multiple: number;
  roundDays: number;
}): { valeur: number; ebeDouzeMois: number } {
  const depart = bilanDUneFiliale(args.comptes[0]!, args.coursDeDepart);
  const ebeReference = Math.max(0, depart.equity + detteNette(depart)) / (args.multiple * toursParAn(args.roundDays));
  const e = ebeDouzeMois({ ebe: args.ebe, ebeReference }, args.roundDays);
  const b = bilanDUneFiliale(args.comptes[args.comptes.length - 1]!, args.cours);
  const ve = Math.max(args.multiple * Math.max(0, e), actifEconomique(b));
  return { valeur: Math.max(0, ve - detteNette(b)), ebeDouzeMois: e };
}

/** Le prix demandé pour le fournisseur à l'ouverture d'un tour : ses comptes jusqu'au tour d'avant. */
export function prixDuFournisseur(scenario: EngineScenarioConfig, companies: readonly CompanyState[], code: string): PrixDeCession | null {
  const f = leFournisseur(scenario, code);
  const g = scenario.groupe;
  if (!f || !g) return null;
  const comptes = comptesDuFournisseur(f, chiffresDuFournisseur(companies, code), scenario.finance.taxRate);
  const actifNet = comptes[comptes.length - 1]!.capitauxPropres;
  const valeurDeRendement = valeurDUneSociete({
    comptes,
    ebe: comptes.slice(1).map((c) => c.ebe),
    cours: 1,
    coursDeDepart: 1,
    multiple: g.valorisation.multipleEBE,
    roundDays: scenario.roundDays,
  }).valeur;
  const base = Math.max(actifNet, valeurDeRendement);
  return { actifNet, valeurDeRendement, prix: base > 0 ? base * (1 + (g.rachat?.primeDeControle ?? 0)) : 1 };
}

/** Le fournisseur auquel une décision achète une référence, résolu comme le moteur le résout. */
export function fournisseurDeLaReference(
  scenario: EngineScenarioConfig,
  d: RoundDecisions,
  code: ProductCode,
): SupplierDef | null {
  const p = toGamme(scenario).find((x) => x.code === code);
  const catalogue = p ? suppliersOf(p, scenario) : null;
  if (!catalogue) return null;
  const choix = d.products?.[code]?.supplierChoice ?? d.supplierChoice;
  return catalogue.find((s) => s.code === choix) ?? catalogue[0]!;
}

/** Ce qu'une décision commande à un fournisseur ce tour, référence par référence : le plan, au prix matières du fournisseur. */
export function commandesAuFournisseur(scenario: EngineScenarioConfig, d: RoundDecisions, code: string): Record<ProductCode, number> {
  const out: Record<ProductCode, number> = {};
  for (const p of toGamme(scenario)) {
    const s = fournisseurDeLaReference(scenario, d, p.code);
    if (s?.code !== code) continue;
    const plan = d.products?.[p.code]?.productionPlan ?? (toGamme(scenario).length === 1 ? d.productionPlan : 0);
    out[p.code] = Math.max(0, plan) * p.materialCostPerUnit * s.costMultiplier;
  }
  return out;
}

/** Les profils qui quittent d'emblée le fournisseur d'un concurrent : ceux qui achètent au prix. */
export const PROFILS_QUI_PARTENT: readonly string[] = ["price_aggressive", "growth"];

/**
 * Le concurrent simulé quitte le fournisseur d'un concurrent : chaque
 * référence qu'il lui achète passe au premier autre fournisseur de son catalogue.
 */
export function quitterLeFournisseur(scenario: EngineScenarioConfig, d: RoundDecisions, code: string): RoundDecisions {
  const products = { ...(d.products ?? {}) };
  let change = false;
  for (const p of toGamme(scenario)) {
    if (fournisseurDeLaReference(scenario, d, p.code)?.code !== code || !products[p.code]) continue;
    const autre = suppliersOf(p, scenario)!.find((x) => x.code !== code);
    if (!autre) continue;
    products[p.code] = { ...products[p.code]!, supplierChoice: autre.code };
    change = true;
  }
  return change ? { ...d, products } : d;
}
