import { botDecisions, type BotProfile } from "../../engine/bots";
import { runGame } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { nomEntreprise } from "../scenarios/presentation";
import { auCentime } from "../../pedagogy/cours/etats";
import { METIERS, type CompteDuMetier } from "./metiers";

/**
 * LE CAS D'UNE ENTREPRISE : LES MONTANTS DU COURS, TIRÉS DE LA SIMULATION.
 *
 * Aucun chiffre du cours ne s'écrit à la main. Les apports et l'emprunt sont ceux
 * du bilan d'ouverture de l'entreprise dans l'arène ; l'équipement acheté est le
 * premier de son parc, au prix du catalogue d'équipements ; le loyer et le
 * personnel viennent de ses coûts fixes et de ses salaires ; les quantités vendues
 * et leurs prix, du PREMIER TRIMESTRE SIMULÉ par le moteur (une gestion équilibrée
 * face aux concurrents du scénario, graine fixe), ramené à un mois.
 *
 * Les ventes se partagent comme dans la simulation : les clients qui paient sur-le-
 * champ (segments sans délai de paiement) et les clients professionnels qui paient
 * à échéance (le délai de leur segment). Le fournisseur est payé au délai du
 * scénario. Le cas est donc déterministe : même entreprise, mêmes montants, pour
 * tous les élèves et pour la correction.
 */

export interface Facture {
  quantite: number;
  prixUnitaire: number;
  ht: number;
  tauxTva: number;
  tva: number;
  ttc: number;
}

export interface Cas {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  capital: number;
  emprunt: number;
  /**
   * L'équipement acheté à la création. Sa revente se fait, dans l'arène, à une fraction de
   * sa valeur nette comptable : `ratioDeRevente`, celle du catalogue d'équipements.
   */
  immobilisation: Facture & CompteDuMetier & { designation: string; date: number; ratioDeRevente: number };
  achat: Facture &
    CompteDuMetier & { designation: string; fournisseur: string; date: number; delai: number; echeance: number };
  venteComptant: Facture & CompteDuMetier & { qui: string; date: number };
  venteCredit: Facture & CompteDuMetier & { client: string; date: number; delai: number; echeance: number };
  loyer: { montant: number; date: number };
  /**
   * La paie de janvier : le brut, ce que le salarié en reçoit (le net), ce que
   * l'entreprise ajoute (les cotisations patronales), et la date où les
   * cotisations se paient à l'URSSAF.
   */
  personnel: {
    effectif: number;
    brut: number;
    tauxSalarial: number;
    cotisationsSalariales: number;
    net: number;
    tauxPatronal: number;
    cotisationsPatronales: number;
    cout: number;
    date: number;
    dateUrssaf: number;
  };
  dates: { capital: number; emprunt: number };
  /**
   * Le stock de marchandises sur un trimestre de l'arène, pour une entreprise qui en garde
   * un au début et à la fin (absent sinon : un service ne se stocke pas, et une entreprise
   * qui produit à la demande n'en a pas).
   */
  stock: StockDuTrimestre | null;
  /** L'année de l'arène, quatre trimestres, en grandes masses : la matière de la clôture. */
  annee: AnneeDeLArene;
  /**
   * Le contrat de l'emprunt, celui que l'entreprise rembourse dans l'arène : le taux
   * annuel du scénario, et l'échéancier du moteur (une échéance par trimestre, le même
   * capital remboursé à chacune : l'amortissement constant).
   */
  pret: { tauxAnnuel: number; nombreEcheances: number; capitalParEcheance: number };
  /**
   * Le même mois vu par le contrôle de gestion : les ventes du mois, leur prix moyen, les
   * coûts variables par unité, les charges fixes du mois (dont l'usure de l'équipement).
   */
  gestion: {
    quantite: number;
    chiffreDAffaires: number;
    prixMoyen: number;
    matiereParUnite: number;
    autresParUnite: number;
    autresCoutsVariables: string;
    coutVariableUnitaire: number;
    amortissement: number;
    dureeAmortissementMois: number;
    chargesFixes: number;
  };
}

export interface StockDuTrimestre {
  /** Le trimestre de l'année (1 à 4) : le premier qui commence et finit avec du stock. */
  trimestre: number;
  /** Les jours du cours (1 = 1er janvier) où il commence et finit. */
  debut: number;
  fin: number;
  initial: { quantite: number; valeur: number };
  achats: Facture;
  vendues: number;
  /** Le coût unitaire moyen pondéré du trimestre (stock initial et entrées). */
  cump: number;
  final: { quantite: number; valeur: number };
  /** Le coût d'achat des marchandises vendues : stock initial, plus achats, moins stock final. */
  coutDAchatDesVendues: number;
  ventes: Facture;
}

/**
 * L'ANNÉE DE L'ARÈNE EN GRANDES MASSES : les quatre trimestres additionnés, rangés comme
 * une balance avant inventaire. Le coût variable des unités produites ou achetées se partage
 * entre les achats et les autres coûts variables au prorata de leurs coûts unitaires ; le
 * personnel est celui de l'effectif de départ, le reste des charges fixes est le loyer et
 * les frais de structure. La dotation et la variation du stock sont les travaux d'inventaire.
 */
export interface AnneeDeLArene {
  ventes: number;
  achats: number;
  autresCoutsVariables: number;
  commissions: number;
  publicite: number;
  qualite: number;
  entretien: number;
  personnel: number;
  loyerEtFrais: number;
  interets: number;
  dotation: number;
  /** Le stock du 1er janvier et du 31 décembre, valorisé par l'arène ; absent pour un service. */
  stock: { nature: "marchandises" | "en-cours"; initial: number; final: number } | null;
  tauxIS: number;
  /** Ce que l'arène affiche pour l'année : des acomptes chaque trimestre, l'impôt de l'année au bout. */
  arene: { resultatAvantImpot: number; impot: number; resultatNet: number };
}

/** La graine du trimestre simulé : le même cas pour tous. */
export const GRAINE_DU_COURS = 20260101;

/** La part des ventes gardée pour la façon de payer que le premier trimestre n'a pas connue. */
const PART_DE_REPLI = 0.2;

const auCent = (x: number) => Math.round(x / 100) * 100;
const parDix = (x: number) => Math.max(10, Math.round(x / 10) * 10);

/**
 * LES TAUX DE COTISATIONS DE LA PAIE : des ordres de grandeur d'un salarié non cadre du
 * secteur privé, avant les allègements de charges. La part salariale se retient sur le
 * brut ; la part patronale s'y ajoute, à la charge de l'entreprise.
 */
export const TAUX_SALARIAL = 0.22;
export const TAUX_PATRONAL = 0.42;
/** Les cotisations du mois se paient à l'URSSAF le 15 du mois suivant (moins de 50 salariés). */
const JOUR_URSSAF = 31 + 15;

/**
 * La paie du mois, du coût que la simulation donne pour le personnel : ce coût est
 * le brut plus les cotisations patronales ; le brut s'en déduit, arrondi à la centaine.
 */
function paie(effectif: number, coutDuMois: number): Cas["personnel"] {
  const brut = auCent(coutDuMois / (1 + TAUX_PATRONAL));
  const cotisationsSalariales = Math.round(brut * TAUX_SALARIAL);
  const cotisationsPatronales = Math.round(brut * TAUX_PATRONAL);
  return {
    effectif,
    brut,
    tauxSalarial: TAUX_SALARIAL,
    cotisationsSalariales,
    net: brut - cotisationsSalariales,
    tauxPatronal: TAUX_PATRONAL,
    cotisationsPatronales,
    cout: brut + cotisationsPatronales,
    date: 28,
    dateUrssaf: JOUR_URSSAF,
  };
}

function facture(quantite: number, prixUnitaire: number, tauxTva: number): Facture {
  const ht = auCentime(quantite * prixUnitaire);
  const tva = auCentime(ht * tauxTva);
  return { quantite, prixUnitaire, ht, tauxTva, tva, ttc: auCentime(ht + tva) };
}

/** Le premier trimestre de l'entreprise, joué par le moteur. */
function premierTrimestre(code: string): { joueur: CompanyRoundResult; depart: CompanyState } {
  const def = scenarioByCode(code);
  const scenario = { ...def.scenario, roundsCount: 1 };
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        // Un seul tour : pas de tour précédent à lire.
        (ctx: { state: CompanyState; roundIndex: number }) =>
          botDecisions(e.botProfile as BotProfile, { scenario, state: ctx.state, roundIndex: ctx.roundIndex }),
      ]),
    ),
  });
  const joueur = partie.rounds[0]!.results["joueur"]!;
  return { joueur, depart: entreprises[0]! };
}

/** Les débuts et fins de trimestre, en jours du cours. */
const DEBUTS_DES_TRIMESTRES = [1, 91, 182, 274];
const FINS_DES_TRIMESTRES = [90, 181, 273, 365];

/** Les quatre trimestres de l'arène, joués une fois par entreprise, dans le réglage du cours. */
const annees = new Map<string, { partie: ReturnType<typeof runGame>; depart: CompanyState }>();
export function anneeJouee(code: string) {
  const deja = annees.get(code);
  if (deja) return deja;
  const def = scenarioByCode(code);
  // L'année de l'arène telle qu'une partie créée aujourd'hui la joue : l'impôt sur l'exercice.
  const scenario = { ...def.scenario, roundsCount: FINS_DES_TRIMESTRES.length, impotSurLExercice: true };
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        (ctx: { state: CompanyState; roundIndex: number }) =>
          botDecisions(e.botProfile as BotProfile, { scenario, state: ctx.state, roundIndex: ctx.roundIndex }),
      ]),
    ),
  });
  const jouee = { partie, depart: entreprises[0]! };
  annees.set(code, jouee);
  return jouee;
}

function anneeDeLArene(code: string, achat: string): AnneeDeLArene {
  const def = scenarioByCode(code);
  const s = def.scenario;
  const { partie, depart } = anneeJouee(code);
  const somme = (f: (r: CompanyRoundResult) => number) =>
    auCentime(partie.rounds.reduce((t, tour) => t + f(tour.results["joueur"]!), 0));
  const is = (r: CompanyRoundResult) => r.incomeStatement;
  const variable = somme((r) => is(r).variableProductionCost);
  const m = s.product.materialCostPerUnit;
  const o = s.product.otherVariableCostPerUnit;
  const achats = auCentime((variable * m) / (m + o));
  const hr = s.hr!;
  const personnel = auCentime(hr.includedHeadcount * hr.salaryPerEmployeePerRound * partie.rounds.length);
  const fixes = somme((r) => is(r).fixedCosts);
  const variation = somme((r) => is(r).productionStocked);
  const initial = auCentime(depart.finishedGoods.quantity * depart.finishedGoods.unitCost);
  return {
    ventes: somme((r) => is(r).revenue),
    achats,
    autresCoutsVariables: auCentime(variable - achats),
    commissions: somme((r) => is(r).commissionCost ?? 0),
    publicite: somme((r) => is(r).marketingCost),
    qualite: somme((r) => is(r).qualityCost),
    entretien: somme((r) => is(r).maintenanceCost),
    personnel,
    loyerEtFrais: auCentime(fixes - personnel),
    interets: somme((r) => is(r).interest),
    dotation: somme((r) => is(r).depreciation),
    stock:
      initial > 0 || variation !== 0
        ? { nature: achat.startsWith("607") ? "marchandises" : "en-cours", initial, final: Math.max(0, auCentime(initial + variation)) }
        : null,
    tauxIS: s.finance.taxRate,
    arene: {
      resultatAvantImpot: somme((r) => is(r).pretaxIncome),
      impot: somme((r) => is(r).tax),
      resultatNet: somme((r) => is(r).netIncome),
    },
  };
}

/**
 * L'ANNÉE DE L'ARÈNE, POUR LE STOCK : les quatre trimestres joués par le moteur. Les
 * quantités (stock d'ouverture, unités achetées, unités vendues) sont celles du moteur ; la
 * valeur est celle de la comptabilité, au prix d'achat des marchandises et au coût moyen
 * pondéré.
 */
function stockDuTrimestre(code: string, tauxAchat: number, tauxVente: number): StockDuTrimestre | null {
  const def = scenarioByCode(code);
  if (def.scenario.perishable) return null;
  const { partie, depart: departDeLAnnee } = anneeJouee(code);
  const prix = def.scenario.product.materialCostPerUnit;
  const depart = departDeLAnnee.finishedGoods;
  let initial = { quantite: Math.round(depart.quantity), valeur: auCentime(depart.quantity * depart.unitCost) };
  for (const [k, tour] of partie.rounds.entries()) {
    const r = tour.results["joueur"]!;
    const achetees = Math.round(r.production.produced);
    const segments = Object.values(r.market.bySegment);
    const vendues = Math.round(segments.reduce((t, v) => t + v.sold, 0));
    const achats = facture(achetees, prix, tauxAchat);
    const quantiteFinale = Math.max(0, initial.quantite + achetees - vendues);
    const cump = auCentime((initial.valeur + achats.ht) / (initial.quantite + achetees || 1));
    const final = { quantite: quantiteFinale, valeur: auCentime(quantiteFinale * cump) };
    if (initial.quantite > 0 && final.quantite > 0) {
      const chiffre = segments.reduce((t, v) => t + v.revenue, 0);
      return {
        trimestre: k + 1,
        debut: DEBUTS_DES_TRIMESTRES[k]!,
        fin: FINS_DES_TRIMESTRES[k]!,
        initial,
        achats,
        vendues,
        cump,
        final,
        coutDAchatDesVendues: auCentime(initial.valeur + achats.ht - final.valeur),
        ventes: facture(vendues, auCentime(chiffre / vendues), tauxVente),
      };
    }
    initial = final;
  }
  return null;
}

const caches = new Map<string, Cas>();

export function casDeLEntreprise(code: string): Cas {
  const deja = caches.get(code);
  if (deja) return deja;
  const metier = METIERS[code];
  if (!metier) throw new Error(`Pas de cas de cours pour l'entreprise ${code}`);
  const def = scenarioByCode(code);
  const s = def.scenario;
  const { joueur, depart } = premierTrimestre(code);

  // Les ventes du trimestre, par façon de payer, ramenées à un mois.
  const delais = new Map(s.market.segments.map((g) => [g.code, g.paymentDelayDays ?? 0]));
  let comptant = { u: 0, ca: 0 };
  let credit = { u: 0, ca: 0 };
  for (const [seg, v] of Object.entries(joueur.market.bySegment)) {
    if ((delais.get(seg) ?? 0) === 0) comptant = { u: comptant.u + v.sold, ca: comptant.ca + v.revenue };
    else credit = { u: credit.u + v.sold, ca: credit.ca + v.revenue };
  }
  // Le délai du client professionnel : le plus long des segments qui paient à échéance.
  const delaiClient = Math.max(...s.market.segments.map((g) => g.paymentDelayDays ?? 0));
  // UN CHAPITRE A TOUJOURS SES DEUX VENTES. Une entreprise dont le premier trimestre
  // n'a vendu que d'une seule façon (NOVA ne vend à CampusTech qu'à partir du
  // troisième tour ; un cabinet de conseil n'a pas de client au comptant) en garde
  // une part pour l'autre, au même prix moyen : le total du mois reste celui de la
  // simulation.
  const total = { u: comptant.u + credit.u, ca: comptant.ca + credit.ca };
  if (comptant.u === 0 || credit.u === 0) {
    const part = { u: total.u * PART_DE_REPLI, ca: total.ca * PART_DE_REPLI };
    const reste = { u: total.u - part.u, ca: total.ca - part.ca };
    [comptant, credit] = comptant.u === 0 ? [part, reste] : [reste, part];
  }
  const prix = (g: { u: number; ca: number }) => Math.round(g.ca / g.u);
  const qComptant = parDix(comptant.u / 3);
  const qCredit = parDix(credit.u / 3);
  const quantite = qComptant + qCredit;

  const flotte = depart.fleet?.[0];
  const type = s.equipment?.types.find((t) => t.code === flotte?.typeCode);
  if (!flotte || !type) throw new Error(`L'entreprise ${code} n'a pas de parc d'équipement`);

  const hr = s.hr!;
  const pret = depart.loans?.[0];
  if (!pret || depart.loans!.length !== 1 || pret.remaining !== depart.finance.financialDebt) {
    throw new Error(`L'entreprise ${code} n'a pas un emprunt unique à échéancier`);
  }
  const delaiFournisseur = s.finance.supplierPaymentDelayDays;
  // Le fournisseur se paie au mois suivant : l'achat se date pour que son échéance y tombe.
  const dateAchat = Math.max(10, 32 - delaiFournisseur);
  // Le client paie après le fournisseur : le chapitre règle la dette, puis encaisse la créance.
  const dateVente = Math.max(20, dateAchat + delaiFournisseur - delaiClient + 1);

  const cas: Omit<Cas, "gestion"> & Partial<Pick<Cas, "gestion">> = {
    code,
    entreprise: nomEntreprise(def),
    unite: def.vocabulary.unit,
    unites: def.vocabulary.units,
    capital: depart.finance.equity,
    emprunt: depart.finance.financialDebt,
    dates: { capital: 2, emprunt: 3 },
    stock: stockDuTrimestre(code, metier.achat.tauxTva, metier.vente.tauxTva),
    annee: anneeDeLArene(code, metier.achat.compte),
    pret: {
      tauxAnnuel: s.finance.loanAnnualRate,
      nombreEcheances: Math.round(depart.finance.financialDebt / pret.perRound),
      capitalParEcheance: pret.perRound,
    },
    loyer: { montant: auCent((s.fixedCostsPerRound - hr.includedHeadcount * hr.salaryPerEmployeePerRound) / 3), date: 5 },
    immobilisation: {
      ...facture(flotte.count, type.costPerUnit, 0.2),
      ...metier.immobilisation,
      designation: type.name,
      date: 6,
      // Le même repli que le moteur quand le catalogue ne dit rien.
      ratioDeRevente: type.resaleRatio ?? 0.5,
    },
    achat: {
      ...facture(quantite, s.product.materialCostPerUnit, metier.achat.tauxTva),
      compte: metier.achat.compte,
      acceptes: metier.achat.acceptes,
      designation: metier.achat.designation(quantite.toLocaleString("fr-FR")),
      fournisseur: metier.achat.fournisseur,
      date: dateAchat,
      delai: delaiFournisseur,
      echeance: dateAchat + delaiFournisseur,
    },
    venteCredit: {
      ...facture(qCredit, prix(credit), metier.vente.tauxTva),
      compte: metier.vente.compte,
      acceptes: metier.vente.acceptes,
      client: metier.vente.client,
      date: dateVente,
      delai: delaiClient,
      echeance: dateVente + delaiClient,
    },
    personnel: paie(depart.headcount, (depart.headcount * hr.salaryPerEmployeePerRound) / 3),
    venteComptant: {
      ...facture(qComptant, prix(comptant), metier.vente.tauxTva),
      compte: metier.vente.compte,
      acceptes: metier.vente.acceptes,
      qui: metier.vente.comptant,
      date: 31,
    },
  };
  const quantiteVendue = cas.venteComptant.quantite + cas.venteCredit.quantite;
  const chiffreDAffaires = auCentime(cas.venteComptant.ht + cas.venteCredit.ht);
  const dureeAmortissementMois = type.depreciationRounds * 3;
  const amortissement = Math.round(cas.immobilisation.ht / dureeAmortissementMois);
  cas.gestion = {
    quantite: quantiteVendue,
    chiffreDAffaires,
    prixMoyen: auCentime(chiffreDAffaires / quantiteVendue),
    matiereParUnite: s.product.materialCostPerUnit,
    autresParUnite: s.product.otherVariableCostPerUnit,
    autresCoutsVariables: metier.autresCoutsVariables,
    coutVariableUnitaire: auCentime(s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit),
    amortissement,
    dureeAmortissementMois,
    chargesFixes: cas.loyer.montant + cas.personnel.cout + amortissement,
  };
  caches.set(code, cas as Cas);
  return cas as Cas;
}
