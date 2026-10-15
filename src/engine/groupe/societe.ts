import type { CompanyState, EngineScenarioConfig } from "../types";
import { comptesDeLEtranger, coursMoyen, ebeDeReferenceEtranger, laCibleEtrangere, trajectoireDeLEtranger } from "./etranger";
import { chiffresDuFournisseur, comptesDuFournisseur, ebeDeReference, leFournisseur, valeurDUneSociete } from "./fournisseur";
import type { ComptesDUneFiliale, Filiale, PrixDeCession } from "./types";

/**
 * UNE SOCIÉTÉ RACHETABLE PAR SES TITRES (fournisseur, entreprise étrangère),
 * vue de la même façon par le rachat et par la consolidation : ses comptes
 * dans sa devise, ses cours, son EBE en euros, sa valeur.
 */
export interface Societe {
  nom: string;
  /** Comptes tour par tour, [0] le départ, dans sa devise. */
  comptes: ComptesDUneFiliale[];
  /** Cours de clôture de chaque tour (0 : le départ), euros pour une unité de devise. */
  cours: number[];
  /** EBE de chaque tour joué, en euros au cours moyen. */
  ebeEuros: number[];
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
    return {
      nom: f.nom,
      comptes,
      cours: comptes.map(() => 1),
      ebeEuros: comptes.slice(1).map((c) => c.ebe),
      ebeReference: ebeDeReference(f),
    };
  }
  const c = laCibleEtrangere(scenario, id);
  if (!c) return null;
  const comptes = comptesDeLEtranger(c, graine, n);
  const { cours } = trajectoireDeLEtranger(c, graine, n);
  return {
    nom: c.nom,
    comptes,
    cours,
    ebeEuros: comptes.slice(1).map((x, i) => x.ebe * coursMoyen(cours, i + 1)),
    ebeReference: ebeDeReferenceEtranger(c),
  };
}

/** Sa valeur des capitaux propres (100 %), en euros, au dernier cours de clôture. */
export function valeurDeLaSociete(scenario: EngineScenarioConfig, s: Societe): number {
  return valeurDUneSociete({
    comptes: s.comptes,
    ebe: s.ebeEuros,
    cours: s.cours[s.cours.length - 1]!,
    coursDeDepart: s.cours[0]!,
    multiple: scenario.groupe!.valorisation.multipleEBE,
    roundDays: scenario.roundDays,
    ebeReference: s.ebeReference,
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
