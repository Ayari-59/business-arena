import type { CompanyRoundResult, CompanyState, EngineScenarioConfig } from "@/engine/types";
import { conditionsBancaires, confianceServie } from "@/engine/finance/bank";
import { toGamme } from "@/engine/gamme";
import {
  cleDeLaCible,
  coursDeLImport,
  dejaVendue,
  laSociete,
  prixDeLaSociete,
  prixDuFournisseur,
  seuilDIndifference,
  trajectoireDeLEtranger,
  valeurDOuverture,
  type CibleDeRachat,
  type ResultatDuRachat,
  type SeuilDIndifference,
  type SituationDeLAcquereur,
  type TrancheDeSousTraitance,
  type TypeDeCible,
  type ValeurDeLEntreprise,
} from "@/engine/groupe";

/**
 * LA VUE DU NIVEAU 7 « GROUPE », préparée côté serveur pour l'arène.
 *
 * Ce que l'équipe sait, et rien de plus : la série de SA valeur, les cibles à
 * vendre avec ce qu'on en dit publiquement (prix demandé, comptes publiés
 * d'une société), ses filiales, et les cours des devises jusqu'au dernier
 * tour clos. La graine n'y est jamais : aucun cours à venir ne peut s'en
 * déduire.
 */

export type StatutDeCible = "disponible" | "a_vous" | "vendue";

export interface CibleVue {
  type: TypeDeCible;
  id: string;
  nom: string;
  recit: string;
  statut: StatutDeCible;
  /** Prix demandé à l'ouverture du tour (100 % pour une entreprise étrangère) ; null si vendue. */
  prixDemande: number | null;
  /** La dernière offre de l'équipe sur cette cible, et ce qu'il en est advenu. */
  derniereOffre: { tour: number; statut: ResultatDuRachat["statut"]; motif: string | null } | null;
  fournisseur?: { capacite: number; dernierChiffreDAffaires: number | null };
  etranger?: {
    pays: string;
    devise: string;
    parts: number[];
    /** Euros pour une unité de devise à la dernière clôture. */
    cours: number;
    /** Le prix demandé de chaque part proposée. */
    prixDesParts: { part: number; prix: number }[];
    /** Son réseau, en devise locale : unités par tour, prix local par référence, coût par unité, frais fixes du tour employé. */
    reseau: { capacite: number; prix: Record<string, number>; coutParUnite: number; coutFixeParTour: number } | null;
    /** Son usine, en devise locale : unités par tour, coût par référence, qualité livrée, frais fixes du tour employé. */
    fabrication: { capacite: number; cout: Record<string, number>; qualite: number; coutFixeParTour: number } | null;
  };
}

/** Une référence que le sous-traitant fabrique : son barème, et l'arbitrage face à une ligne en propre. */
export interface SousTraitanceVue {
  code: string;
  nom: string;
  tranches: TrancheDeSousTraitance[];
  plafond: number;
  qualite: number;
  /** Coût variable d'une unité fabriquée en propre (matière et autres coûts variables). */
  coutVariableInterne: number;
  seuil: SeuilDIndifference | null;
}

export interface VueDuGroupe {
  /** La valeur de l'équipe, tour par tour clos. */
  valeurs: { tour: number; valeur: ValeurDeLEntreprise }[];
  regles: {
    tourMin: number;
    tourMinTitres: number;
    seuilDeControle: number;
    decoteDEmission: number;
    primeDeControle: number;
    fraisDeTransaction: number;
    actionsInitiales: number;
  } | null;
  cibles: CibleVue[];
  filiales: { type: "fournisseur" | "etranger"; id: string; nom: string; part: number; tour: number; devise: string | null; cours: number }[];
  /** Les cours connus des devises des entreprises étrangères (de la clôture du tour 0 à la dernière). */
  change: { devise: string; pays: string; cours: number[] }[];
  /** L'import risqué : sa devise et ses cours connus, ses risques de rupture. */
  import: { code: string; devise: string; cours: number[]; probabilite: number; probabiliteAuxPics: number } | null;
  sousTraitance: SousTraitanceVue[] | null;
  /**
   * L'équipe à l'ouverture du tour, telle que le moteur juge son offre : le
   * tour, le dernier tour, et sa situation (trésorerie, dette, actions, valeur
   * d'ouverture, découvert autorisé). `null` si son état manque.
   */
  ouverture: {
    tour: number;
    dernierTour: number;
    maxDebtToEquity: number | null;
    situation: SituationDeLAcquereur;
    valeurParAction: number;
  } | null;
}

export function vueDuGroupe(args: {
  scenario: EngineScenarioConfig;
  graine: number;
  /** Le tour en cours (à décider) ; les tours clos sont ceux d'avant. */
  tourEnCours: number;
  /** Les états d'ouverture du tour en cours, toutes les entreprises de la partie. */
  etats: CompanyState[];
  equipeId: string;
  /** Les résultats de l'équipe, par tour clos. */
  resultats: { tour: number; result: CompanyRoundResult }[];
}): VueDuGroupe | null {
  const { scenario } = args;
  const g = scenario.groupe;
  if (!g) return null;
  const clos = Math.max(0, args.tourEnCours - 1);
  const moi = args.etats.find((e) => e.id === args.equipeId);
  const resultats = [...args.resultats].sort((a, b) => a.tour - b.tour);
  const valeurs = resultats.flatMap((r) => (r.result.groupe?.valeur ? [{ tour: r.tour, valeur: r.result.groupe.valeur }] : []));
  const offres = new Map<string, CibleVue["derniereOffre"]>();
  for (const r of resultats) {
    const o = r.result.groupe?.rachat;
    if (o?.cible) offres.set(cleDeLaCible(o.cible), { tour: r.tour, statut: o.statut, motif: o.motif ?? null });
  }
  const statut = (c: CibleDeRachat): StatutDeCible => {
    const aMoi = (moi?.groupe?.filiales ?? []).some((f) => f.type === c.type && f.id === c.id);
    if (aMoi) return "a_vous";
    return dejaVendue(args.etats, c) ? "vendue" : "disponible";
  };
  const base = (c: CibleDeRachat, nom: string, recit: string): Omit<CibleVue, "prixDemande"> => ({
    type: c.type,
    id: c.id,
    nom,
    recit,
    statut: statut(c),
    derniereOffre: offres.get(cleDeLaCible(c)) ?? null,
  });
  const cibles: CibleVue[] = [];
  for (const f of g.fournisseurs ?? []) {
    const c: CibleDeRachat = { type: "fournisseur", id: f.code };
    const b = base(c, f.nom, f.recit);
    const prix = b.statut === "disponible" ? (prixDuFournisseur(scenario, args.etats, f.code)?.prix ?? null) : null;
    const soc = laSociete(scenario, args.etats, args.graine, "fournisseur", f.code, clos);
    cibles.push({
      ...b,
      prixDemande: prix,
      fournisseur: { capacite: f.capacite, dernierChiffreDAffaires: clos > 0 ? (soc?.comptes[clos]?.chiffreDAffaires ?? null) : null },
    });
  }
  const change: VueDuGroupe["change"] = [];
  for (const e of g.etrangers ?? []) {
    const c: CibleDeRachat = { type: "etranger", id: e.id };
    const b = base(c, e.nom, e.recit);
    const soc = laSociete(scenario, args.etats, args.graine, "etranger", e.id, clos)!;
    const { cours } = trajectoireDeLEtranger(e, args.graine, clos);
    change.push({ devise: e.devise, pays: e.pays, cours });
    cibles.push({
      ...b,
      prixDemande: b.statut === "disponible" ? prixDeLaSociete(scenario, soc, 1).prix : null,
      etranger: {
        pays: e.pays,
        devise: e.devise,
        parts: e.parts,
        cours: cours[clos]!,
        prixDesParts: b.statut === "disponible" ? e.parts.map((part) => ({ part, prix: prixDeLaSociete(scenario, soc, part).prix })) : [],
        reseau: e.reseau ? { ...e.reseau } : null,
        fabrication: e.fabrication ? { ...e.fabrication } : null,
      },
    });
  }
  const filiales = (moi?.groupe?.filiales ?? []).map((f) => {
    const e = f.type === "etranger" ? (g.etrangers ?? []).find((x) => x.id === f.id) : undefined;
    const cours = e ? trajectoireDeLEtranger(e, args.graine, clos).cours[clos]! : 1;
    return { type: f.type, id: f.id, nom: f.nom, part: f.part, tour: f.tour, devise: e?.devise ?? null, cours };
  });
  const imp = g.import;
  const sousTraitance: SousTraitanceVue[] | null = g.sousTraitance
    ? toGamme(scenario).flatMap((p) => {
        const ref = g.sousTraitance![p.code];
        if (!ref) return [];
        const coutVariableInterne = p.materialCostPerUnit + p.otherVariableCostPerUnit;
        return [
          {
            code: p.code,
            nom: p.name,
            tranches: ref.tranches,
            plafond: ref.plafond,
            qualite: ref.qualite,
            coutVariableInterne,
            seuil: seuilDIndifference({
              ref,
              coutVariableInterne,
              heuresParUnite: p.hoursPerUnit,
              heuresParPersonne: moi?.hoursPerEmployee ?? 0,
              salaireParTour: scenario.hr?.salaryPerEmployeePerRound ?? 0,
              lignes: (scenario.equipment?.types ?? []).map((t) => ({
                code: t.code,
                nom: t.name,
                cout: t.costPerUnit,
                amortissement: t.depreciationRounds,
                capacite: t.capacityPerUnit,
              })),
            }),
          },
        ];
      })
    : null;
  const ouverture: VueDuGroupe["ouverture"] = (() => {
    const v = moi ? valeurDOuverture(moi, scenario) : null;
    if (!moi || !moi.groupe || !v) return null;
    const bank = scenario.finance.bank;
    const limite = bank
      ? conditionsBancaires(
          confianceServie(moi, scenario),
          { overdraftLimit: scenario.finance.overdraftLimit, overdraftAnnualRate: scenario.finance.overdraftAnnualRate },
          bank,
        ).overdraftLimit
      : scenario.finance.overdraftLimit;
    return {
      tour: args.tourEnCours,
      dernierTour: scenario.roundsCount,
      maxDebtToEquity: scenario.finance.maxDebtToEquity ?? null,
      valeurParAction: v.valeurParAction,
      situation: {
        cash: moi.finance.cash,
        overdraft: moi.finance.overdraft,
        equity: moi.finance.equity,
        financialDebt: moi.finance.financialDebt,
        actions: moi.groupe.actions,
        valeurParAction: v.valeurParAction,
        limiteDeDecouvert: limite,
      },
    };
  })();
  const saison = scenario.market.seasonality;
  return {
    valeurs,
    regles: g.rachat
      ? {
          tourMin: g.rachat.tourMin,
          tourMinTitres: g.rachat.tourMinTitres ?? g.rachat.tourMin,
          seuilDeControle: g.rachat.seuilDeControle,
          decoteDEmission: g.rachat.decoteDEmission,
          primeDeControle: g.rachat.primeDeControle,
          fraisDeTransaction: g.rachat.fraisDeTransaction,
          actionsInitiales: g.valorisation.actionsInitiales,
        }
      : null,
    cibles,
    filiales,
    change,
    import: imp
      ? {
          code: imp.code,
          devise: imp.change.devise,
          cours: coursDeLImport(args.graine, imp, clos),
          probabilite: imp.rupture.probabilite,
          probabiliteAuxPics: saison.some((x) => x >= imp.rupture.seuilDePic) ? imp.rupture.probabiliteAuxPics : imp.rupture.probabilite,
        }
      : null,
    sousTraitance,
    ouverture,
  };
}
