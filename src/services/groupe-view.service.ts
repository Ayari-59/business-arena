import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import {
  cleDeLaCible,
  coursDeLImport,
  dejaVendue,
  laSociete,
  prixDeLaSociete,
  prixDuFournisseur,
  trajectoireDeLEtranger,
  type CibleDeRachat,
  type EtatDuSite,
  type ResultatDuRachat,
  type SousTraitanceDUneReference,
  type TypeDeCible,
  type ValeurDeLEntreprise,
} from "@/engine/groupe";

/**
 * LA VUE DU NIVEAU 7 « GROUPE », préparée côté serveur pour l'arène.
 *
 * Ce que l'équipe sait, et rien de plus : la série de SA valeur, les cibles à
 * vendre avec ce qu'on en dit publiquement (prix demandé, fourchettes de
 * l'état d'un site, comptes publiés d'une société), l'état réel d'un site
 * seulement si l'équipe l'a audité, ses filiales, et les cours des devises
 * jusqu'au dernier tour clos. La graine n'y est jamais : ni l'état caché d'un
 * site non audité, ni un cours à venir ne peuvent s'en déduire.
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
  /** L'audit que l'équipe a fait : l'état réel révélé. */
  audit: EtatDuSite | null;
  /** L'équipe a demandé un audit pour le tour en cours. */
  auditDemande: boolean;
  /** La dernière offre de l'équipe sur cette cible, et ce qu'il en est advenu. */
  derniereOffre: { tour: number; statut: ResultatDuRachat["statut"]; motif: string | null } | null;
  site?: {
    lignes: { typeCode: string; count: number }[];
    remiseEnRoute: { min: number; max: number };
    remiseEnEtatParLigne: { min: number; max: number };
    passifEnvironnemental: { probabilite: number; montant: number };
    delai: number;
    chargesParTour: number;
    coutDeLAudit: number;
  };
  fournisseur?: { capacite: number; dernierChiffreDAffaires: number | null };
  etranger?: {
    pays: string;
    devise: string;
    parts: number[];
    /** Euros pour une unité de devise à la dernière clôture. */
    cours: number;
    reseau: boolean;
    fabrication: boolean;
  };
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
  sousTraitance: Record<string, SousTraitanceDUneReference> | null;
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
  /** La décision de l'équipe pour le tour en cours, si elle est déjà déposée. */
  enCours: RoundDecisions | null;
}): VueDuGroupe | null {
  const { scenario } = args;
  const g = scenario.groupe;
  if (!g) return null;
  const clos = Math.max(0, args.tourEnCours - 1);
  const moi = args.etats.find((e) => e.id === args.equipeId);
  const resultats = [...args.resultats].sort((a, b) => a.tour - b.tour);
  const valeurs = resultats.flatMap((r) => (r.result.groupe?.valeur ? [{ tour: r.tour, valeur: r.result.groupe.valeur }] : []));
  const audits = new Map<string, EtatDuSite>();
  const offres = new Map<string, CibleVue["derniereOffre"]>();
  for (const r of resultats) {
    const d = r.result.groupe?.diligence;
    if (d) audits.set(cleDeLaCible(d.cible), d.etat);
    const o = r.result.groupe?.rachat;
    if (o?.cible) offres.set(cleDeLaCible(o.cible), { tour: r.tour, statut: o.statut, motif: o.motif ?? null });
  }
  const statut = (c: CibleDeRachat): StatutDeCible => {
    const aMoi =
      c.type === "site_ferme"
        ? (moi?.groupe?.sites ?? []).some((s) => s.id === c.id)
        : (moi?.groupe?.filiales ?? []).some((f) => f.type === c.type && f.id === c.id);
    if (aMoi) return "a_vous";
    return dejaVendue(args.etats, c) ? "vendue" : "disponible";
  };
  const base = (c: CibleDeRachat, nom: string, recit: string): Omit<CibleVue, "prixDemande"> => ({
    type: c.type,
    id: c.id,
    nom,
    recit,
    statut: statut(c),
    audit: audits.get(cleDeLaCible(c)) ?? null,
    auditDemande: args.enCours?.diligence?.type === c.type && args.enCours.diligence.id === c.id,
    derniereOffre: offres.get(cleDeLaCible(c)) ?? null,
  });
  const cibles: CibleVue[] = [];
  for (const s of g.sites ?? []) {
    const c: CibleDeRachat = { type: "site_ferme", id: s.id };
    const b = base(c, s.nom, s.recit);
    cibles.push({
      ...b,
      prixDemande: b.statut === "disponible" ? s.prix : null,
      site: {
        lignes: s.lignes,
        remiseEnRoute: s.remiseEnRoute,
        remiseEnEtatParLigne: s.remiseEnEtatParLigne,
        passifEnvironnemental: s.passifEnvironnemental,
        delai: s.delai,
        chargesParTour: s.chargesParTour,
        coutDeLAudit: s.coutDeLAudit,
      },
    });
  }
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
        reseau: Boolean(e.reseau),
        fabrication: Boolean(e.fabrication),
      },
    });
  }
  const filiales = (moi?.groupe?.filiales ?? []).map((f) => {
    const e = f.type === "etranger" ? (g.etrangers ?? []).find((x) => x.id === f.id) : undefined;
    const cours = e ? trajectoireDeLEtranger(e, args.graine, clos).cours[clos]! : 1;
    return { type: f.type, id: f.id, nom: f.nom, part: f.part, tour: f.tour, devise: e?.devise ?? null, cours };
  });
  const imp = g.import;
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
    sousTraitance: g.sousTraitance ?? null,
  };
}
