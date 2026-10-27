import { withoutRd } from "../../engine/gamme";
import { runGame } from "../../engine/simulation/runGame";
import type { CompanyState } from "../../engine/types";
import { auCentime } from "../../pedagogy/cours/etats";
import { familyOf, scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS } from "./cas";
import { decisionsDuCours, scenarioDuCours } from "./arene-du-cours";

/**
 * LA GAMME DU MOIS : CE QUE LE MOTEUR VEND, RÉFÉRENCE PAR RÉFÉRENCE.
 *
 * Six des neuf entreprises jouent une gamme dans l'arène, à partir d'un niveau (le 4, le 3
 * pour MAILLE & CO) : NOVA ses trois enceintes, L'ESCALE ses trois chambres, et ainsi de
 * suite. Le chapitre « Coût par produit » se joue sur leur premier trimestre en gamme,
 * simulé par le moteur dans le même réglage que les autres cas du cours (gestion
 * équilibrée face à deux concurrents, même graine), ramené à un mois. La référence à bâtir
 * par la R&D y est livrée prête, comme au niveau qui ouvre la gamme.
 *
 * Rien n'est inventé : les quantités, les prix, le coût variable de chaque référence, sa
 * publicité et son budget qualité viennent du tour joué ; les heures de travail par unité,
 * de la fiche de chaque référence ; les charges communes (structure, entretien, usure de
 * l'équipement), du compte de résultat du tour.
 */

export interface ReferenceDuMois {
  code: string;
  nom: string;
  quantite: number;
  prix: number;
  chiffreDAffaires: number;
  coutVariableUnitaire: number;
  /** Publicité et qualité de la référence : des charges fixes, mais propres à elle. */
  publicite: number;
  qualite: number;
  heuresParUnite: number;
}

/**
 * Une ligne du portefeuille : une clientèle d'une référence (chaque référence a ses propres
 * clientèles dans l'arène). Ce que l'arène connaît de plus fin sur les clients : elle ne suit
 * pas de client un par un.
 */
export interface CompteDuPortefeuille {
  code: string;
  nom: string;
  reference: string;
  quantite: number;
  chiffreDAffaires: number;
  /** Ce qu'il reste une fois payés le coût variable des unités et la commission d'un partenaire. */
  marge: number;
}

export interface GammeDuMois {
  /** Le niveau de l'arène à partir duquel l'entreprise joue sa gamme. */
  niveau: number;
  /** Ce que la gamme fait jouer, en clair (« la gamme Go, One et Studio »). */
  libelle: string;
  references: ReferenceDuMois[];
  /** Les clientèles de chaque référence, celles qui ont acheté dans le mois. */
  comptes: CompteDuPortefeuille[];
  /** Les charges communes du mois, que rien ne rattache à une seule référence. */
  communes: { structure: number; entretien: number; usure: number };
}

const parTrois = (x: number) => Math.round(x / 3);
const gammes = new Map<string, GammeDuMois | null>();

/** La gamme de l'entreprise, ou null si elle n'en joue pas (VOLT FITNESS, MARTEL & FILS, ROUTE & CIE). */
export function gammeDuMois(code: string): GammeDuMois | null {
  if (gammes.has(code)) return gammes.get(code)!;
  const famille = familyOf(code);
  if (!famille) {
    gammes.set(code, null);
    return null;
  }
  const def = scenarioByCode(famille.gamme);
  const scenario = scenarioDuCours(withoutRd(def.scenario), 1);
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, scenario),
  });
  const joueur = partie.rounds[0]!.results["joueur"]!;
  const references = (scenario.products ?? []).flatMap((d): ReferenceDuMois[] => {
    const p = joueur.products?.[d.code];
    if (!p) return [];
    const quantite = Math.max(1, Math.round(p.sold / 3));
    return [
      {
        code: d.code,
        nom: d.shortName ?? d.name,
        quantite,
        prix: p.price,
        chiffreDAffaires: auCentime(quantite * p.price),
        coutVariableUnitaire: p.unitVariableCost,
        publicite: parTrois(p.marketingBudget),
        qualite: parTrois(p.qualityBudget),
        heuresParUnite: d.hoursPerUnit,
      },
    ];
  });
  const comptes = (scenario.products ?? []).flatMap((d) =>
    d.market.segments.flatMap((seg): CompteDuPortefeuille[] => {
      const v = joueur.market.bySegment[seg.code];
      const cv = joueur.products?.[d.code]?.unitVariableCost;
      if (!v || v.sold < 0.5 || cv === undefined) return [];
      return [
        {
          code: seg.code,
          nom: seg.name,
          reference: d.shortName ?? d.name,
          quantite: Math.round(v.sold / 3),
          chiffreDAffaires: Math.round(v.revenue / 3),
          marge: Math.round((v.revenue - v.sold * cv - (v.commission ?? 0)) / 3),
        },
      ];
    }),
  );
  const cr = joueur.incomeStatement;
  const gamme: GammeDuMois = {
    niveau: famille.gammeFromLevel,
    libelle: famille.gammeLabel,
    references,
    comptes,
    communes: { structure: parTrois(cr.fixedCosts), entretien: parTrois(cr.maintenanceCost), usure: parTrois(cr.depreciation) },
  };
  gammes.set(code, gamme);
  return gamme;
}
