import { soldUnits } from "../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../engine/types";
import { auCentime } from "../../pedagogy/cours/etats";
import { anneeJouee } from "./cas";

/**
 * LES ÉCARTS DU DEUXIÈME TRIMESTRE : LE RÉALISÉ DE L'ARÈNE FACE AU PRÉVU.
 *
 * Le prévu est celui du budget de trésorerie (`budget.ts`) : le premier trimestre de
 * l'année jouée, reconduit. Le réalisé, le deuxième. Chacun se résume par ses quantités
 * vendues (adhérents conservés compris, `soldUnits`), son prix moyen et sa marge sur coût
 * variable par unité, celle du compte de résultat de l'arène (commissions déduites). Les
 * charges fixes sont celles du compte de résultat : structure, publicité, qualité,
 * entretien, usure de l'équipement.
 *
 * Quantités à l'unité, prix et marges au centime : les écarts se calculent sur ces
 * grandeurs arrondies, celles que l'élève lit et emploie.
 */

export interface TrimestreResume {
  quantite: number;
  prix: number;
  margeUnitaire: number;
  chiffreDAffaires: number;
  marge: number;
  chargesFixes: number;
}

function resume(r: CompanyRoundResult): TrimestreResume {
  const is = r.incomeStatement;
  const quantite = Math.round(soldUnits(r));
  const prix = auCentime(is.revenue / quantite);
  const margeUnitaire = auCentime(is.grossMargin / quantite);
  const chargesFixes = Math.round(
    is.fixedCosts + is.marketingCost + is.qualityCost + is.maintenanceCost + is.depreciation + (is.engagementRse ?? 0) + (is.rdCost ?? 0),
  );
  return {
    quantite,
    prix,
    margeUnitaire,
    chiffreDAffaires: auCentime(quantite * prix),
    marge: auCentime(quantite * margeUnitaire),
    chargesFixes,
  };
}

const ecarts = new Map<string, ReturnType<typeof calculer>>();

function calculer(code: string) {
  const { partie } = anneeJouee(code);
  const prevu = resume(partie.rounds[0]!.results["joueur"]!);
  const realise = resume(partie.rounds[1]!.results["joueur"]!);
  const dq = realise.quantite - prevu.quantite;
  const chiffreDAffaires = {
    total: auCentime(realise.chiffreDAffaires - prevu.chiffreDAffaires),
    volume: auCentime(dq * prevu.prix),
    prix: auCentime((realise.prix - prevu.prix) * realise.quantite),
  };
  const marge = {
    total: auCentime(realise.marge - prevu.marge),
    volume: auCentime(dq * prevu.margeUnitaire),
    unitaire: auCentime((realise.margeUnitaire - prevu.margeUnitaire) * realise.quantite),
  };
  const chargesFixes = realise.chargesFixes - prevu.chargesFixes;
  return {
    prevu,
    realise,
    chiffreDAffaires,
    marge,
    chargesFixes,
    resultat: auCentime(marge.total - chargesFixes),
  };
}

/** Les écarts de l'entreprise, réalisé moins prévu : positifs, le réalisé fait mieux (sauf pour les charges). */
export function ecartsDuTrimestre(code: string) {
  const deja = ecarts.get(code);
  if (deja) return deja;
  const e = calculer(code);
  ecarts.set(code, e);
  return e;
}
