import type { CompanyState, EngineScenarioConfig } from "../types";
import {
  comptesDeLEtranger,
  coursMoyen,
  ebeDeReferenceEtranger,
  laCibleEtrangere,
  saisonDeLEtranger,
  trajectoireDeLEtranger,
  ventesLocales,
} from "./etranger";
import {
  chiffreExterieur,
  chiffresDuFournisseur,
  comptesDuFournisseur,
  ebeDeReference,
  leFournisseur,
  saisonDuFournisseur,
  valeurDUneSociete,
} from "./fournisseur";
import type { ComptesDUneFiliale, Filiale, PrixDeCession } from "./types";

/**
 * UNE SOCIÉTÉ RACHETABLE PAR SES TITRES (fournisseur, entreprise étrangère),
 * vue de la même façon par le rachat et par la consolidation : ses comptes
 * dans sa devise, ses cours, son EBE en euros, sa valeur.
 *
 * SA VALEUR EST HORS SAISON. La fenêtre de douze mois est complétée, tant
 * qu'elle est courte, par un EBE de référence qui est celui d'un tour moyen ;
 * un tour réel de basse saison y faisait baisser la valeur, et sa reprise le
 * besoin en fonds de roulement. Le prix demandé et le test de dépréciation
 * lisent donc chaque tour comme si sa saison valait 1 : l'EBE des ventes que
 * la saison retire (ou ajoute), et un besoin en fonds de roulement normal
 * (celui d'un tour sans saison, et pour une entreprise étrangère sans les
 * ventes perdues au risque pays, qui ne durent pas), la trésorerie qui va
 * avec. La croissance, le change, la perte du risque pays dans l'EBE et les
 * achats de la partie restent ce qu'ils sont. Sans cela, un rachat au prix
 * demandé se dépréciait dès la clôture de son tour, pour la seule saison.
 *
 * SA VALEUR EST AU COURS DE CLÔTURE, TOUT ENTIÈRE : l'EBE de la fenêtre et sa
 * dette nette, lus dans sa devise, convertis au même cours. Un EBE converti
 * aux cours passés face à une dette convertie au cours du jour faisait
 * baisser la valeur d'une société endettée quand sa devise montait.
 */
export interface Societe {
  nom: string;
  /** Comptes tour par tour, [0] le départ, dans sa devise. */
  comptes: ComptesDUneFiliale[];
  /** Cours de clôture de chaque tour (0 : le départ), euros pour une unité de devise. */
  cours: number[];
  /** EBE de chaque tour joué, en euros au cours moyen (l'historique pro forma du groupe). */
  ebeEuros: number[];
  /** EBE hors saison de chaque tour joué, dans sa devise (sa valeur). */
  ebeHorsSaison: number[];
  /** Besoin en fonds de roulement hors saison de chaque tour ([0] le départ), dans sa devise. */
  bfrHorsSaison: number[];
  /** L'EBE d'un tour moyen, dans sa devise : l'amorce de sa fenêtre de valeur. */
  ebeReference: number;
}

/** La société au bout de `n` tours joués (un fournisseur lit les achats notés de la partie). */
export function laSociete(
  scenario: EngineScenarioConfig,
  companies: readonly CompanyState[],
  graine: number,
  type: Filiale["type"],
  id: string,
  n: number,
): Societe | null {
  if (type === "fournisseur") {
    const f = leFournisseur(scenario, id);
    if (!f) return null;
    const comptes = comptesDuFournisseur(f, chiffresDuFournisseur(companies, id).slice(0, n), scenario.finance.taxRate);
    // Les ventes que la saison retire à ses clients hors partie (négatif en haute saison).
    const retire = (t: number) => chiffreExterieur(f, t) * (1 / saisonDuFournisseur(f, t) - 1);
    return {
      nom: f.nom,
      comptes,
      cours: comptes.map(() => 1),
      ebeEuros: comptes.slice(1).map((c) => c.ebe),
      ebeHorsSaison: comptes.slice(1).map((c, i) => c.ebe + retire(i + 1) * (1 - f.tauxDeCoutVariable)),
      bfrHorsSaison: comptes.map((c, t) => (t === 0 ? c.bfr : c.bfr + f.bfr * retire(t))),
      ebeReference: ebeDeReference(f),
    };
  }
  const c = laCibleEtrangere(scenario, id);
  if (!c) return null;
  const comptes = comptesDeLEtranger(c, graine, n);
  const { cours } = trajectoireDeLEtranger(c, graine, n);
  // Les ventes que la saison retire (négatif en haute saison), risque pays compris.
  const retire = (t: number) => comptes[t]!.chiffreDAffaires * (1 / saisonDeLEtranger(c, t) - 1);
  return {
    nom: c.nom,
    comptes,
    cours,
    ebeEuros: comptes.slice(1).map((x, i) => x.ebe * coursMoyen(cours, i + 1)),
    ebeHorsSaison: comptes.slice(1).map((x, i) => x.ebe + retire(i + 1) * (1 - c.tauxDeCoutVariable)),
    // Le besoin en fonds de roulement d'un tour normal : ni saison ni ventes perdues au risque pays, qui ne durent pas.
    bfrHorsSaison: comptes.map((x, t) => (t === 0 ? x.bfr : (c.bfr * ventesLocales(c, t)) / saisonDeLEtranger(c, t))),
    ebeReference: ebeDeReferenceEtranger(c) / c.change.coursInitial,
  };
}

/** Sa valeur des capitaux propres (100 %), hors saison, en euros, au dernier cours de clôture. */
export function valeurDeLaSociete(scenario: EngineScenarioConfig, s: Societe): number {
  const n = s.comptes.length - 1;
  const dernier = s.comptes[n]!;
  const bfr = s.bfrHorsSaison[n]!;
  // Le besoin en fonds de roulement d'un tour moyen ; la trésorerie, d'autant.
  const horsSaison = { ...dernier, bfr, tresorerie: dernier.tresorerie + dernier.bfr - bfr };
  const rc = s.cours[n]!;
  return valeurDUneSociete({
    comptes: [...s.comptes.slice(0, n), horsSaison],
    ebe: s.ebeHorsSaison.map((x) => x * rc),
    cours: rc,
    coursDeDepart: s.cours[0]!,
    multiple: scenario.groupe!.valorisation.multipleEBE,
    roundDays: scenario.roundDays,
    ebeReference: s.ebeReference * rc,
  }).valeur;
}

/** Le prix demandé pour une part de la société : le plus haut de son actif net et de sa valeur, prime de contrôle comprise. */
export function prixDeLaSociete(scenario: EngineScenarioConfig, s: Societe, part: number): PrixDeCession {
  const rc = s.cours[s.cours.length - 1]!;
  const actifNet = s.comptes[s.comptes.length - 1]!.capitauxPropres * rc * part;
  const valeurDeRendement = valeurDeLaSociete(scenario, s) * part;
  const base = Math.max(actifNet, valeurDeRendement);
  return { actifNet, valeurDeRendement, prix: base > 0 ? base * (1 + (scenario.groupe!.rachat?.primeDeControle ?? 0)) : 1 };
}

/** Le prix demandé pour le fournisseur à l'ouverture d'un tour : ses comptes jusqu'au tour d'avant. */
export function prixDuFournisseur(scenario: EngineScenarioConfig, companies: readonly CompanyState[], code: string): PrixDeCession | null {
  if (!scenario.groupe) return null;
  const s = laSociete(scenario, companies, 0, "fournisseur", code, chiffresDuFournisseur(companies, code).length);
  return s ? prixDeLaSociete(scenario, s, 1) : null;
}
