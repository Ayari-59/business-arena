/**
 * LA MÉTHODE DE RÉFÉRENCE : l'étalon contre lequel on juge des décisions.
 *
 * Battre les bots ne dit pas qu'on a bien décidé : leur tempérament change
 * avec le marché. Il faut un étalon qui, lui, ne bouge pas.
 *
 * L'étalon était la GESTION NEUTRE DU SECTEUR, celle que le formulaire proposait
 * au premier tour (il en part toujours, à la qualité près : `qualiteProposee`,
 * engine/types.ts). Mesuré (rapport du lot « mérite durci ») : elle produit trop
 * peu et vend au prix du marché sans jamais le revoir, si bien qu'un seul
 * geste (relever le prix de 8 %, produire à la demande, baisser la qualité)
 * la battait sur la plupart des marchés possibles. Presque tout le monde
 * passait pour « solide ».
 *
 * L'étalon est maintenant LA GESTION D'UN BON GESTIONNAIRE : la neutre, tenue
 * tour par tour par quelqu'un qui lit ses comptes. Elle ne voit que ce que le
 * joueur voit au moment de décider, et rien d'autre :
 *
 *   · son propre tour passé : ventes, ventes manquées, stock, prix pratiqué ;
 *   · la saison du tour à jouer (« Saison du tour ») et celles des tours déjà
 *     joués, jamais celles des tours à venir (`sansAvenir`) ;
 *   · ce que le formulaire lui propose : la gestion neutre du secteur, sur ce
 *     même scénario privé de l'avenir, avec la qualité que le scénario fait
 *     proposer (`qualiteProposee`). Décision du propriétaire : quand le
 *     formulaire a cessé de proposer une qualité qui ne paie pas, un bon
 *     gestionnaire resté sur l'ancienne était battu par qui gardait le
 *     formulaire tel quel. Une partie créée avant ce champ garde son verdict.
 *
 * Elle ne lit ni la graine, ni les tirages, ni les décisions des concurrents.
 * Ses règles, référence par référence :
 *
 *   PRIX      au premier tour, le prix proposé ; ensuite, le prix du tour
 *             passé, relevé d'un pas quand la demande a dépassé ce que
 *             l'atelier pouvait offrir (des ventes manquées alors qu'il
 *             tournait à plein, ou plus d'un cinquième de la demande manqué),
 *             baissé d'un pas quand l'offre reste sur les bras (stock, offre
 *             périssable invendue, salle vide), jamais sous le coût variable
 *             + 15 % ; pour un abonnement, l'occupation de la salle ;
 *   VOLUME    la demande observée (ventes + ventes manquées), corrigée de la
 *             saison du tour par rapport à celle du tour passé et du pas de
 *             prix, avec une marge, moins le stock ; dans la capacité ;
 *   MARKETING le budget proposé, modulé par la saison du tour ;
 *   QUALITÉ   le budget proposé ; l'entretien de référence ;
 *   ÉQUIPE    le salaire du marché ; une embauche quand la main-d'œuvre bride
 *             la production et que des ventes ont manqué ;
 *   CRÉANCES  l'escompte quand la caisse est à découvert (moins cher que
 *             l'affacturage que la banque imposerait) ;
 *   INVESTIR  une machine quand ce sont les machines qui brident, qu'il reste
 *             deux tours pour qu'elle serve et que la caisse la paie ;
 *   EMPRUNT   la machine financée par un emprunt de son montant, le découvert
 *             consolidé comme le fait la neutre ;
 *   le reste comme la neutre (assurance de base, R&D d'entretien, placement
 *   de l'excédent), sans jamais appeler les associés ni distribuer.
 *
 * Ses deux réglages (le pas de prix, la marge de volume) sont fixés a priori,
 * les mêmes pour les neuf entreprises et les six niveaux : voir
 * `REGLAGES_DE_LA_REFERENCE`.
 *
 * ELLE JOUE LE MARCHÉ DE LA PARTIE, PUIS SES DÉCISIONS SONT REJOUÉES
 * (`partieDeLaReference`) : comme le joueur, elle décide sur le marché joué,
 * et ses décisions sont rejouées telles quelles sur les marchés possibles.
 *
 * Et rien de ce que le niveau n'ouvre pas : un levier fermé au joueur est
 * fermé à la méthode, au même défaut que celui que le formulaire envoie ; un
 * investissement plafonné pour lui l'est pour elle.
 *
 * UNE PARTIE À LA PROPOSITION À LA DEMANDE (`propositionALaDemande`,
 * engine/types.ts) a un autre bon gestionnaire : celui qui tient le formulaire et ne
 * s'en écarte que sur un signal net (`leFormulaireTenu`, plus bas). Les règles
 * ci-dessus restent, au centime, celles des parties d'avant.
 *
 * Déterministe et pure : même tour, même décision.
 */
import { aLaMesureDuNiveau, neutralDecisions, variableCostPerUnit } from "@/engine/bots";
import { bornerLInvestissement, plafondDInvestissement } from "@/engine/investment/plafond";
import { isMultiProduct, scalarsOfGamme, toGamme } from "@/engine/gamme";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  ProductDecisions,
  RoundDecisions,
} from "@/engine/types";
import type { DifficultyPreset } from "@/config/difficulty";
import { partieFigee, type PartieARejouer } from "./rejeu";
import { sansAvenir } from "@/engine/market/sans-avenir";
import { avecLaQualiteProposee, propositionDuTour } from "@/services/decision-baseline";

/** Le nom de la référence dans les phrases du bilan. */
export const NOM_DE_LA_REFERENCE = "un bon gestionnaire";

/**
 * Ce que fait la référence, en une ligne, sous le titre du bilan. Ni chiffre ni
 * réglage : la règle se lit, les pas et les seuils restent dans le code.
 */
export const PHRASE_DE_LA_REFERENCE =
  "Un bon gestionnaire part de la gestion neutre du secteur et la tient tour par tour avec ce que vous voyiez : il produit selon la demande observée, relève son prix quand l'atelier ne suit plus, le baisse quand le stock reste, et règle son marketing sur la saison.";

/**
 * La même ligne pour une partie à la demande (`propositionALaDemande`), dont le bon
 * gestionnaire tient le formulaire (`leFormulaireTenu`) : ni chiffre ni seuil non plus.
 */
export const PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE =
  "Un bon gestionnaire part de ce que le formulaire vous proposait et le tient tour par tour avec ce que vous voyiez. Il relève son prix quand la demande dépasse nettement ce que l'atelier peut offrir, le baisse quand l'offre reste, le ramène sinon vers le prix du secteur, et ajoute ce que le formulaire ne propose pas : la recherche, une embauche ou une machine quand l'atelier bride.";

/** Ce que fait la référence de CETTE partie : celle de son instantané. */
export const phraseDeLaReference = (scenario: Pick<EngineScenarioConfig, "propositionALaDemande">): string =>
  scenario.propositionALaDemande === true ? PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE : PHRASE_DE_LA_REFERENCE;

/** « que » et « de » devant un nom, élidés devant une voyelle : « qu'un bon gestionnaire ». */
const elide = (mot: "que" | "de", x: string) => (/^[aeiouyhéèêàâîôû]/i.test(x) ? `${mot.slice(0, -1)}'${x}` : `${mot} ${x}`);
export const queLaReference = elide("que", NOM_DE_LA_REFERENCE);
export const deLaReference = elide("de", NOM_DE_LA_REFERENCE);

/**
 * Les deux réglages de la méthode, fixés a priori et non optimisés (voir le
 * rapport : une recherche en grille par métier en faisait un expert du moteur
 * que presque aucune décision raisonnée ne battait).
 */
export interface ReglagesDuGestionnaire {
  /** Le pas d'ajustement du prix d'un tour à l'autre. */
  pas: number;
  /** La marge de production sur la demande observée. */
  volume: number;
  /** Investir quand les machines brident (vrai par défaut ; faux pour les mesures). */
  investit?: boolean;
}
export const REGLAGES_DE_LA_REFERENCE: ReglagesDuGestionnaire = { pas: 0.05, volume: 1.05 };

/**
 * Les leviers qu'un niveau n'ouvre pas, ramenés à ce que le formulaire envoie
 * sans eux (`aLaMesureDuNiveau`, la règle des concurrents pilotés aussi) : la
 * qualité et l'entretien à leur valeur neutre (`neutre`, celle du champ caché),
 * et rien des autres. Puis la politique propre à la méthode : elle n'appelle
 * jamais les associés et ne distribue rien.
 */
export function selonLeNiveau(
  d: RoundDecisions,
  ouverts: DifficultyPreset["decisions"] | null,
  neutre: RoundDecisions = d,
): RoundDecisions {
  if (!ouverts) return d;
  const out = aLaMesureDuNiveau(d, ouverts, neutre);
  out.finance = ouverts.finance
    ? {
        newLoan: d.finance?.newLoan ?? 0,
        loanRepayment: d.finance?.loanRepayment ?? 0,
        capitalIncrease: 0,
        dividend: 0,
      }
    : { newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 };
  return out;
}

/**
 * LE SCÉNARIO SANS L'AVENIR (`engine/market/sans-avenir.ts`) : les saisons des
 * tours à venir remplacées par celle du tour à jouer.
 */
export { sansAvenir };

export interface ContexteDeLaReference {
  scenario: EngineScenarioConfig;
  state: CompanyState;
  roundIndex: number;
  lastSoldUnits?: number;
  lastSoldByProduct?: Record<string, number>;
  /** Son propre tour passé, tel que l'écran de résultats le montre. */
  resultatPrecedent?: CompanyRoundResult;
  /** Sa propre décision du tour passé. */
  decisionPrecedente?: RoundDecisions;
}

/** La saison d'un marché à un tour (1 hors calendrier). */
const saisonAu = (s: readonly number[] | undefined, tour: number) => (tour >= 1 ? (s?.[tour - 1] ?? 1) : 1);

/** La capacité de l'atelier : machines disponibles, ou main-d'œuvre si elle bride. */
function capacites(scenario: EngineScenarioConfig, state: CompanyState) {
  const machine = state.machineCapacity * state.availability;
  const heures = scenario.product.hoursPerUnit;
  const mainDOeuvre = heures > 0 ? (state.headcount * state.hoursPerEmployee * state.productivity) / heures : Infinity;
  return { machine, mainDOeuvre, atelier: Math.min(machine, mainDOeuvre) };
}

/** Ce qu'une référence a vendu, manqué, ce qui lui reste, et son prix, au tour passé. */
interface Lecture {
  vendu: number;
  manque: number;
  /** Ce qui a été produit (ou offert, pour une activité périssable). */
  produit: number;
  stock: number;
  prix: number | undefined;
}

function lireLeTourPasse(ctx: ContexteDeLaReference): Map<string, Lecture> {
  const lectures = new Map<string, Lecture>();
  const r = ctx.resultatPrecedent;
  const multi = isMultiProduct(ctx.scenario);
  for (const p of toGamme(ctx.scenario)) {
    let vendu = 0;
    let manque = 0;
    let produit = 0;
    if (r) {
      const parProduit = multi ? r.products?.[p.code] : undefined;
      if (parProduit) {
        vendu = parProduit.sold;
        manque = parProduit.lost;
        produit = parProduit.produced;
      } else {
        produit = r.production.produced;
        for (const s of p.market.segments) {
          vendu += r.market.bySegment[s.code]?.sold ?? 0;
          manque += r.market.bySegment[s.code]?.lost ?? 0;
        }
        if (!multi && r.subscription) {
          vendu += r.subscription.retained;
          manque += r.subscription.unserved;
        }
      }
    }
    const stock = multi
      ? (ctx.state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0)
      : ctx.state.finishedGoods.quantity;
    const prix = multi ? ctx.decisionPrecedente?.products?.[p.code]?.price : ctx.decisionPrecedente?.price;
    lectures.set(p.code, { vendu, manque, produit, stock, prix });
  }
  return lectures;
}

/**
 * Le sens du pas de prix que le tour passé commande : +1, −1 ou 0.
 *
 *   · RELEVER quand la demande a dépassé ce que l'atelier peut offrir : des
 *     ventes manquées alors qu'il tournait déjà à plein (s'il lui restait de la
 *     capacité, la réponse est de produire plus, pas de vendre plus cher), ou
 *     tout ce qui a été produit vendu à pleine capacité ; pour un abonnement,
 *     des adhérents refusés ou une salle pleine (occupation d'au moins 90 %) ;
 *   · BAISSER quand l'offre reste sur les bras : un stock qui dépasse le quart
 *     des ventes, ou, pour une activité qui ne se stocke pas, moins de 70 % de
 *     l'offre vendue ; pour un abonnement, une salle aux deux tiers vide.
 */
function sensDuPrix(
  l: Lecture,
  ctx: { perissable: boolean; aPlein: boolean; occupation?: number },
): -1 | 0 | 1 {
  const demande = Math.max(1, l.vendu + l.manque);
  const manquees = l.manque > 0.05 * demande;
  if (ctx.occupation !== undefined) {
    if (manquees || ctx.occupation >= 0.9) return 1;
    if (ctx.occupation < 0.6) return -1;
    return 0;
  }
  if (ctx.aPlein && (manquees || (l.produit > 0 && l.vendu >= 0.97 * l.produit))) return 1;
  // Une demande qui dépasse l'offre de plus d'un cinquième : produire plus ne suffira pas.
  if (l.manque > 0.2 * demande) return 1;
  if (ctx.perissable ? l.produit > 0 && l.vendu < 0.7 * l.produit : l.stock > 0.25 * Math.max(1, l.vendu)) return -1;
  return 0;
}

/**
 * La décision du bon gestionnaire pour un tour, AVANT le filtre du niveau, et
 * la décision neutre du même tour (ce que porte un champ fermé).
 */
export function decisionDuBonGestionnaire(
  ctx: ContexteDeLaReference,
  reglages: ReglagesDuGestionnaire = REGLAGES_DE_LA_REFERENCE,
  /** Les leviers du niveau : le formulaire que tient le bon gestionnaire d'une partie à la demande les porte. */
  ouverts: DifficultyPreset["decisions"] | null = null,
): { decision: RoundDecisions; neutre: RoundDecisions } {
  if (ctx.scenario.propositionALaDemande === true) return leFormulaireTenu(ctx, reglages, ouverts);
  // La méthode part de la gestion neutre, calculée sur le scénario privé de
  // l'avenir pour ne rien lire d'un tour à venir ; `neutre` reste ce que porte
  // un champ fermé.
  const scenario = sansAvenir(ctx.scenario, ctx.roundIndex);
  const neutre = neutralDecisions({
    scenario,
    state: ctx.state,
    roundIndex: ctx.roundIndex,
    lastSoldUnits: ctx.lastSoldUnits,
    lastSoldByProduct: ctx.lastSoldByProduct,
  });
  // Sa qualité est celle que le formulaire propose (`qualiteProposee`) : un
  // bon gestionnaire part de ce que l'élève voit, et garder le formulaire tel
  // quel ne doit pas suffire à le battre (décision du propriétaire).
  const d: RoundDecisions = structuredClone(avecLaQualiteProposee(scenario, neutre));
  const premier = !ctx.resultatPrecedent || !ctx.decisionPrecedente;
  const lectures = lireLeTourPasse(ctx);
  const gamme = toGamme(scenario);
  const multi = isMultiProduct(scenario);
  const abonnement = scenario.subscription !== undefined;
  const { machine, mainDOeuvre, atelier } = capacites(scenario, ctx.state);
  const lecturePrix = {
    perissable: scenario.perishable === true,
    // L'atelier (partagé par la gamme) a-t-il tourné à plein au tour passé ?
    aPlein: (ctx.resultatPrecedent?.production.produced ?? 0) >= 0.9 * atelier,
    occupation: abonnement ? ctx.resultatPrecedent?.subscription?.occupancy : undefined,
  };

  // PRIX ET VOLUME, référence par référence.
  const plans: Record<string, number> = {};
  const prix: Record<string, number> = {};
  for (const p of gamme) {
    const l = lectures.get(p.code)!;
    const prixNeutre = multi ? (neutre.products?.[p.code]?.price ?? neutre.price) : neutre.price;
    const coutVariable = multi ? p.materialCostPerUnit + p.otherVariableCostPerUnit : variableCostPerUnit(scenario);
    const k = premier ? 1 : 1 + sensDuPrix(l, lecturePrix) * reglages.pas;
    prix[p.code] = premier || l.prix === undefined ? prixNeutre : Math.max(coutVariable * 1.15, l.prix * k);
    const planNeutre = multi ? (neutre.products?.[p.code]?.productionPlan ?? 0) : neutre.productionPlan;
    if (premier || abonnement || l.vendu + l.manque <= 0) {
      // Rien à lire (premier tour, référence pas encore vendue) ou un
      // portefeuille d'adhérents : le plan que propose le formulaire.
      plans[p.code] = planNeutre;
    } else {
      const saison =
        saisonAu(p.market.seasonality, ctx.roundIndex) / Math.max(0.05, saisonAu(p.market.seasonality, ctx.roundIndex - 1));
      plans[p.code] = Math.max(0, ((l.vendu + l.manque) * saison * reglages.volume) / k - l.stock);
    }
  }
  const total = Object.values(plans).reduce((s, v) => s + v, 0);
  const coupe = total > atelier && total > 0 ? atelier / total : 1;

  // MARKETING selon la saison du tour, QUALITÉ celle que le formulaire propose.
  const facteurMarketing = Math.min(1.3, Math.max(0.7, saisonAu(scenario.market.seasonality, ctx.roundIndex)));
  if (multi && neutre.products) {
    const products: Record<string, ProductDecisions> = {};
    for (const [code, p] of Object.entries(d.products ?? neutre.products)) {
      products[code] = {
        ...p,
        price: prix[code] ?? p.price,
        productionPlan: (plans[code] ?? p.productionPlan) * coupe,
        marketingBudget: (p.marketingBudget ?? 0) * facteurMarketing,
      };
    }
    const s = scalarsOfGamme(products);
    d.products = products;
    d.price = s.price;
    d.productionPlan = s.productionPlan;
    d.marketingBudget = neutre.marketingBudget * facteurMarketing;
    if (neutre.brandMarketingBudget !== undefined) d.brandMarketingBudget = neutre.brandMarketingBudget * facteurMarketing;
  } else {
    const code = gamme[0]!.code;
    d.price = prix[code]!;
    d.productionPlan = Math.min(atelier, plans[code]!);
    d.marketingBudget = neutre.marketingBudget * facteurMarketing;
  }

  equipeMachineEtCreances(d, ctx, scenario, lectures, { premier, machine, mainDOeuvre, reglages });
  return { decision: d, neutre };
}

/**
 * ÉQUIPE, MACHINE, CRÉANCES : les mêmes règles pour le bon gestionnaire d'avant et
 * pour celui qui tient le formulaire à la demande (`d` est complétée en place).
 */
function equipeMachineEtCreances(
  d: RoundDecisions,
  ctx: ContexteDeLaReference,
  scenario: EngineScenarioConfig,
  lectures: Map<string, Lecture>,
  o: { premier: boolean; machine: number; mainDOeuvre: number; reglages: ReglagesDuGestionnaire },
): void {
  const { premier, machine, mainDOeuvre, reglages } = o;
  // ÉQUIPE : une embauche quand la main-d'œuvre bride et que des ventes ont manqué.
  if (scenario.hr && !premier) {
    const manque = [...lectures.values()].reduce((s, l) => s + l.manque, 0);
    const vendu = [...lectures.values()].reduce((s, l) => s + l.vendu, 0);
    const bride = mainDOeuvre < machine * 0.95 && manque > 0.05 * Math.max(1, vendu + manque);
    d.hr = { ...(d.hr ?? { salaryIndex: 1 }), hire: bride ? Math.min(1, scenario.hr.maxHiresPerRound) : 0 };
  }
  // INVESTISSEMENT : une machine de plus quand c'est elle qui bride (des ventes
  // manquées au-delà de 15 % de la demande, l'équipe suffit), qu'il reste au
  // moins deux tours pour qu'elle serve, et que la caisse et le découvert la
  // paient ; la machine la plus capacitaire pour son prix. Financée par un
  // emprunt de son montant là où l'emprunt est ouvert.
  const machinesManquent = (() => {
    if (premier || reglages.investit === false || ctx.roundIndex > scenario.roundsCount - 2) return false;
    const manque = [...lectures.values()].reduce((s, l) => s + l.manque, 0);
    const vendu = [...lectures.values()].reduce((s, l) => s + l.vendu, 0);
    return machine <= mainDOeuvre && manque > 0.15 * Math.max(1, vendu + manque);
  })();
  if (machinesManquent) {
    const enveloppe = ctx.state.finance.cash + scenario.finance.overdraftLimit;
    let cout = 0;
    if (scenario.equipment) {
      const type = [...scenario.equipment.types]
        .filter((t) => t.maxPerRound > 0)
        .sort((a, b) => b.capacityPerUnit / b.costPerUnit - a.capacityPerUnit / a.costPerUnit)[0];
      if (type && type.costPerUnit <= enveloppe) {
        d.investment = { equipmentBuy: [{ typeCode: type.code, quantity: 1 }] };
        cout = type.costPerUnit;
      }
    } else if (scenario.investment && scenario.investment.maxPerRound > 0) {
      const unites = Math.min(2, scenario.investment.maxPerRound);
      if (unites * scenario.investment.costPerCapacityUnit <= enveloppe) {
        d.investment = { machineCapacityUnits: unites };
        cout = unites * scenario.investment.costPerCapacityUnit;
      }
    }
    if (cout > 0 && (scenario.finance.loanDurationRounds ?? 0) > 0) {
      d.finance = { ...(d.finance ?? {}), newLoan: (d.finance?.newLoan ?? 0) + cout };
    }
  }
  // CRÉANCES : l'escompte quand la caisse est à découvert.
  if (scenario.treasury && ctx.state.finance.overdraft > 0 && ctx.state.finance.receivables > 0) {
    d.treasury = { ...(d.treasury ?? {}), discount: ctx.state.finance.receivables * scenario.treasury.discountMaxShare };
  }
}

/**
 * LES SEUILS DE L'EXCÈS NET (partie à la demande) : le prix ne se relève que quand
 * la demande attendue dépasse l'atelier de plus que cela. Plus haut pour une activité
 * périssable : une place vide ne se revend pas, il faut un excès net avant de la
 * renchérir. Fixés a priori, les mêmes partout (rapport « mesure-gestionnaire »).
 */
export const EXCES_NET = { stockable: 1.2, perissable: 1.5 } as const;

/**
 * LE BON GESTIONNAIRE D'UNE PARTIE À LA DEMANDE (`propositionALaDemande`,
 * engine/types.ts) : LE FORMULAIRE TENU, RELEVÉ SUR UN EXCÈS NET.
 *
 * Mesuré (rapport « mesure-gestionnaire ») : face au formulaire qui planifie sur la
 * demande, le bon gestionnaire d'avant perdait dans les secteurs où une règle de volume
 * correcte suffit (transport, e-commerce, hôtel, bistrot, bâtiment) ; valider le
 * formulaire y était jugé « solide ». Trois de ses règles le faisaient perdre : un
 * relèvement de prix sur une rupture qu'il avait lui-même créée (un plan du tour 1
 * sous l'atelier), un prix sans ancre qui ne revenait jamais, et un volume à la saison
 * du marché du produit plutôt qu'à celle de chaque clientèle. Il part donc du
 * formulaire, et ne s'en écarte que sur un signal net :
 *
 *   BASE      la proposition du formulaire, telle que l'élève la voit
 *             (`propositionDuTour`), aux leviers du niveau, sa propre décision du
 *             tour passé reconduite ; un champ que le niveau ferme y prend la valeur
 *             du formulaire (sinon un écart d'un euro ferait le verdict) ;
 *   PRIX      relevé d'un pas quand la référence a manqué des ventes au tour passé ET
 *             que la demande attendue du tour (ventes et ventes manquées, à la saison
 *             de chaque clientèle, moins le stock) dépasse l'atelier d'un excès net
 *             (`EXCES_NET`) ; sinon baissé d'un pas quand l'offre reste (un stock que
 *             le plan n'absorbe pas, une offre périssable invendue) ; sinon ramené
 *             d'un pas vers le prix de référence du secteur, par en haut comme par en
 *             bas ; jamais sous le coût variable + 15 % ; un abonnement garde la règle
 *             d'occupation ;
 *   VOLUME    le plan du formulaire, divisé par le pas de prix ;
 *   MARKETING celui du formulaire, sans modulation par la saison ;
 *   R&D       celle de la gestion neutre (lancer et entretenir les références), que
 *             le formulaire ne propose pas ;
 *   le reste comme le bon gestionnaire d'avant : l'embauche, la machine et son
 *   emprunt, l'escompte.
 *
 * Là où rien ne commande un écart, il EST le formulaire, au centime ; l'égalité ne
 * compte pas comme battue (`sontSolides`). Il ne lit, comme avant, que son propre tour
 * passé, la saison du tour et des tours joués, et ce que le formulaire lui montre.
 */
function leFormulaireTenu(
  ctx: ContexteDeLaReference,
  reglages: ReglagesDuGestionnaire,
  ouverts: DifficultyPreset["decisions"] | null,
): { decision: RoundDecisions; neutre: RoundDecisions } {
  const scenario = sansAvenir(ctx.scenario, ctx.roundIndex);
  // La gestion neutre ne donne plus que le prix de référence, le plan d'un abonnement
  // et la R&D.
  const neutre = neutralDecisions({
    scenario,
    state: ctx.state,
    roundIndex: ctx.roundIndex,
    lastSoldUnits: ctx.lastSoldUnits,
    lastSoldByProduct: ctx.lastSoldByProduct,
  });
  const r = ctx.resultatPrecedent;
  const premier = !r || !ctx.decisionPrecedente;
  const formulaire = !r || !ctx.decisionPrecedente
    ? propositionDuTour({ snapshot: scenario, state: ctx.state, roundIndex: ctx.roundIndex, previousPayload: null, leviers: ouverts })
    : propositionDuTour({
        snapshot: scenario,
        state: ctx.state,
        roundIndex: ctx.roundIndex,
        previousPayload: ctx.decisionPrecedente,
        lastMarket: r.market.bySegment,
        lastBreakEven: r.breakeven.breakEvenUnits,
        lastNetIncome: r.incomeStatement.netIncome,
        leviers: ouverts,
      });
  const d: RoundDecisions = structuredClone(formulaire);
  const lectures = lireLeTourPasse(ctx);
  const gamme = toGamme(scenario);
  const multi = isMultiProduct(scenario);
  const abonnement = scenario.subscription !== undefined;
  const { machine, mainDOeuvre, atelier } = capacites(scenario, ctx.state);
  const lecturePrix = {
    perissable: scenario.perishable === true,
    aPlein: (r?.production.produced ?? 0) >= 0.9 * atelier,
    occupation: abonnement ? r?.subscription?.occupancy : undefined,
  };

  // LA DEMANDE ATTENDUE du tour, référence par référence : ce que chaque clientèle a
  // demandé au tour passé, à sa saison du tour rapportée à celle du tour passé.
  const saisonDuTour = (s: readonly number[] | undefined) => {
    const ici = saisonAu(s, ctx.roundIndex);
    const avant = saisonAu(s, ctx.roundIndex - 1);
    return avant <= 0 ? 1 : Math.min(2, Math.max(0.5, ici / avant));
  };
  const attendue: Record<string, number> = {};
  for (const p of gamme) {
    let a = 0;
    if (r) {
      for (const seg of p.market.segments) {
        const x = r.market.bySegment[seg.code];
        if (x) a += (Math.max(0, x.sold) + Math.max(0, x.lost)) * saisonDuTour(seg.seasonality ?? p.market.seasonality);
      }
      if (!multi && r.subscription) a += r.subscription.retained + r.subscription.unserved;
    }
    attendue[p.code] = a;
  }
  const attendueTotale =
    Object.values(attendue).reduce((a, b) => a + b, 0) - gamme.reduce((t, p) => t + lectures.get(p.code)!.stock, 0);
  const excesNet =
    attendueTotale > (lecturePrix.perissable ? EXCES_NET.perissable : EXCES_NET.stockable) * atelier;

  // PRIX ET VOLUME, référence par référence.
  const plans: Record<string, number> = {};
  const prix: Record<string, number> = {};
  for (const p of gamme) {
    const l = lectures.get(p.code)!;
    const prixNeutre = multi ? (neutre.products?.[p.code]?.price ?? neutre.price) : neutre.price;
    const coutVariable = multi ? p.materialCostPerUnit + p.otherVariableCostPerUnit : variableCostPerUnit(scenario);
    let k = premier ? 1 : 1 + sensDuPrix(l, lecturePrix) * reglages.pas;
    if (!premier && !abonnement && l.prix !== undefined) {
      const manquees = l.manque > 0.05 * Math.max(1, l.vendu + l.manque);
      let sens = sensDuPrix(l, lecturePrix);
      // Un stock que le plan absorbe déjà (pas plus que la demande attendue) ne commande pas de baisse.
      if (!lecturePrix.perissable && sens < 0 && l.stock <= attendue[p.code]!) sens = 0;
      if (excesNet && manquees) k = 1 + reglages.pas;
      else if (sens < 0) k = 1 - reglages.pas;
      else if (l.prix > prixNeutre * 1.0001) k = Math.max(prixNeutre / l.prix, 1 - reglages.pas);
      else if (l.prix < prixNeutre * 0.9999) k = Math.min(prixNeutre / l.prix, 1 + reglages.pas);
      else k = 1;
    }
    prix[p.code] = premier || l.prix === undefined ? prixNeutre : Math.max(coutVariable * 1.15, l.prix * k);
    const planNeutre = multi ? (neutre.products?.[p.code]?.productionPlan ?? 0) : neutre.productionPlan;
    if (abonnement) plans[p.code] = planNeutre;
    else {
      const planDuFormulaire = multi
        ? (formulaire.products?.[p.code]?.productionPlan ?? planNeutre)
        : formulaire.productionPlan;
      plans[p.code] = planDuFormulaire / k;
    }
  }
  const total = Object.values(plans).reduce((s, v) => s + v, 0);
  const coupe = total > atelier && total > 0 ? atelier / total : 1;

  // MARKETING ET QUALITÉ : ceux du formulaire.
  if (multi && neutre.products) {
    const products: Record<string, ProductDecisions> = {};
    for (const [code, p] of Object.entries(d.products ?? neutre.products)) {
      products[code] = {
        ...p,
        price: prix[code] ?? p.price,
        productionPlan: (plans[code] ?? p.productionPlan) * coupe,
        marketingBudget: p.marketingBudget ?? 0,
      };
    }
    const s = scalarsOfGamme(products);
    d.products = products;
    d.price = s.price;
    d.productionPlan = s.productionPlan;
    d.marketingBudget = formulaire.marketingBudget;
    if (formulaire.brandMarketingBudget !== undefined) d.brandMarketingBudget = formulaire.brandMarketingBudget;
  } else {
    const code = gamme[0]!.code;
    d.price = prix[code]!;
    d.productionPlan = Math.min(atelier, plans[code]!);
    d.marketingBudget = formulaire.marketingBudget;
  }

  // R&D : celle de la gestion neutre, que le formulaire ne propose jamais.
  if (neutre.rdBudget !== undefined) d.rdBudget = neutre.rdBudget;
  if (d.products && neutre.products) {
    for (const [code, p] of Object.entries(neutre.products)) {
      if (p.rdBudget !== undefined && d.products[code]) d.products[code] = { ...d.products[code]!, rdBudget: p.rdBudget };
    }
  }
  equipeMachineEtCreances(d, ctx, scenario, lectures, { premier, machine, mainDOeuvre, reglages });
  return { decision: d, neutre: formulaire };
}

/** La décision de la méthode de référence pour un tour. */
export function decisionDeReference(
  ctx: ContexteDeLaReference,
  ouverts: DifficultyPreset["decisions"] | null,
  reglages: ReglagesDuGestionnaire = REGLAGES_DE_LA_REFERENCE,
): RoundDecisions {
  const { decision: brute, neutre } = decisionDuBonGestionnaire(ctx, reglages, ouverts);
  const decision = selonLeNiveau(brute, ouverts, neutre);
  // LE PLAFOND D'INVESTISSEMENT : la méthode n'achète pas plus de capacité que
  // le joueur ne le peut au même niveau (`engine/investment/plafond`).
  return bornerLInvestissement(decision, plafondDInvestissement(ctx.scenario, ctx.state, ouverts, decision.hr));
}

/**
 * LA PARTIE DE LA RÉFÉRENCE : un bon gestionnaire joue le marché de la partie
 * (sa graine), tour par tour, avec ce que le joueur voyait ; ses décisions sont
 * gardées, puis rejouées TELLES QUELLES sous les marchés possibles, exactement
 * comme celles du joueur. Les deux sont alors jugés à armes égales : chacun a
 * décidé sur le marché joué, aucun ne se réadapte aux autres.
 */
export function partieDeLaReference(
  partie: PartieARejouer,
  ouverts: Parameters<typeof decisionDeReference>[1],
): PartieARejouer {
  return partieFigee(partie, (c) => decisionDeReference(c, ouverts));
}
