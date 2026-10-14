/**
 * LA MÉTHODE DE RÉFÉRENCE : l'étalon contre lequel on juge des décisions.
 *
 * Battre les bots ne dit pas qu'on a bien décidé : leur tempérament change
 * avec le marché. Il faut un étalon qui, lui, ne bouge pas.
 *
 * L'étalon était la GESTION NEUTRE DU SECTEUR, celle que le formulaire propose
 * au premier tour. Mesuré (rapport du lot « mérite durci ») : elle produit trop
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
 *   · la décision que le formulaire propose (la gestion neutre, sur ce même
 *     scénario privé de l'avenir).
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
import { commeEnBase, rejouer, type PartieARejouer } from "./rejeu";

/** Le nom de la référence dans les phrases du bilan. */
export const NOM_DE_LA_REFERENCE = "un bon gestionnaire";

/**
 * Ce que fait la référence, en une ligne, sous le titre du bilan. Ni chiffre ni
 * réglage : la règle se lit, les pas et les seuils restent dans le code.
 */
export const PHRASE_DE_LA_REFERENCE =
  "Un bon gestionnaire part de la gestion proposée et la tient tour par tour avec ce que vous voyiez : il produit selon la demande observée, relève son prix quand l'atelier ne suit plus, le baisse quand le stock reste, et règle son marketing sur la saison.";

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
 * LE SCÉNARIO SANS L'AVENIR : les saisons des tours à venir remplacées par
 * celle du tour à jouer. Le joueur ne voit que la saison du tour qu'il joue ; la
 * méthode non plus. Rien d'autre ne change.
 */
export function sansAvenir(scenario: EngineScenarioConfig, roundIndex: number): EngineScenarioConfig {
  const couper = (s: number[]): number[] => {
    const ici = s[roundIndex - 1] ?? s[s.length - 1] ?? 1;
    return s.map((v, i) => (i < roundIndex ? v : ici));
  };
  const segments = (segs: EngineScenarioConfig["market"]["segments"]) =>
    segs.map((g) => (g.seasonality ? { ...g, seasonality: couper(g.seasonality) } : g));
  return {
    ...scenario,
    market: {
      ...scenario.market,
      seasonality: couper(scenario.market.seasonality),
      segments: segments(scenario.market.segments),
    },
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => ({
            ...p,
            market: {
              ...p.market,
              ...(p.market.seasonality ? { seasonality: couper(p.market.seasonality) } : {}),
              segments: segments(p.market.segments),
            },
          })),
        }
      : {}),
  };
}

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
): { decision: RoundDecisions; neutre: RoundDecisions } {
  // Le formulaire propose la gestion neutre ; la méthode la calcule sur le
  // scénario privé de l'avenir, pour ne rien lire d'un tour à venir.
  const scenario = sansAvenir(ctx.scenario, ctx.roundIndex);
  const neutre = neutralDecisions({
    scenario,
    state: ctx.state,
    roundIndex: ctx.roundIndex,
    lastSoldUnits: ctx.lastSoldUnits,
    lastSoldByProduct: ctx.lastSoldByProduct,
  });
  const d: RoundDecisions = structuredClone(neutre);
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

  // MARKETING selon la saison du tour, QUALITÉ au niveau neutre.
  const facteurMarketing = Math.min(1.3, Math.max(0.7, saisonAu(scenario.market.seasonality, ctx.roundIndex)));
  if (multi && neutre.products) {
    const products: Record<string, ProductDecisions> = {};
    for (const [code, p] of Object.entries(neutre.products)) {
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
  return { decision: d, neutre };
}

/** La décision de la méthode de référence pour un tour. */
export function decisionDeReference(
  ctx: ContexteDeLaReference,
  ouverts: DifficultyPreset["decisions"] | null,
  reglages: ReglagesDuGestionnaire = REGLAGES_DE_LA_REFERENCE,
): RoundDecisions {
  const { decision: brute, neutre } = decisionDuBonGestionnaire(ctx, reglages);
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
  const prises: RoundDecisions[] = [];
  rejouer(partie, partie.graine, {
    type: "methode",
    decider: (c) => {
      const d = decisionDeReference(c, ouverts);
      prises.push(commeEnBase(d));
      return d;
    },
  });
  return {
    ...partie,
    decisions: prises,
    reconduits: prises.map(() => false),
    // L'IPG de la référence ne juge pas (le critère est le résultat net) :
    // elle n'a répondu à aucune situation.
    pedagogie: prises.map(() => ({})),
  };
}
