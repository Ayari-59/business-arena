import type { CompanyRoundResult } from "../engine/types";
import { formatEuro, formatPercent, formatUnits } from "../lib/format";

/**
 * Contexte des tours 2 et suivants (pendant du contexte écrit du tour 1).
 *
 * Le tour 1 peut porter un texte rédigé d'avance : la situation est la même
 * pour tout le monde. À partir du tour 2, elle ne l'est plus — ce qui fait le
 * contexte, c'est ce que le joueur vient de faire. Ce module lit le tour
 * écoulé et en tire :
 *
 * - un CONSTAT, une phrase de fait, avec le chiffre qui la fonde ;
 * - l'ARBITRAGE qui en découle, avec deux routes qui se défendent, chacune
 *   assortie de ce qu'elle rapporte ET de ce qu'elle coûte.
 *
 * Deux règles de conception, les mêmes qu'au tour 1 :
 *
 * - aucune route n'est proposée si le niveau de difficulté ne l'ouvre pas.
 *   Suggérer d'investir à un joueur qui n'a pas la décision sous les yeux
 *   serait un conseil impossible à suivre ;
 * - le module est PUR : il ne lit que le résultat du tour et les paramètres
 *   du scénario joué, jamais la base. Il se teste donc sans base.
 */

export interface BriefingRoute {
  label: string;
  gain: string;
  risque: string;
}

export interface RoundBriefing {
  /** Le code de la règle qui a parlé, pour les tests et le débogage. */
  code:
    | "treasury_crisis"
    | "demand_refused"
    | "stock_piling"
    | "operating_loss"
    | "capacity_tension"
    | "idle_cash"
    | "steady";
  /** Le constat : un fait du tour écoulé, avec son chiffre. */
  headline: string;
  question: string;
  routes: BriefingRoute[];
}

export interface BriefingInput {
  result: CompanyRoundResult;
  /** Le vocabulaire du métier : on ne « produit » pas des nuitées. */
  vocabulary: {
    unit: string;
    units: string;
    unitsGender: "m" | "f";
    productionPlanLabel: string;
    priceLabel: string;
    leftoverLabel: string;
  };
  /** Décisions ouvertes au niveau joué : une route fermée n'est pas proposée. */
  enabled: { finance: boolean; creances: boolean; investment: boolean; hr: boolean };
  /** Le scénario ouvre-t-il la mobilisation du poste clients ? */
  hasTreasuryTools: boolean;
  /** Le scénario propose-t-il d'acheter de la capacité ? */
  hasInvestmentOffer: boolean;
  /** Activité périssable : l'invendu ne se stocke pas, il est perdu. */
  perishable: boolean;
}

// Les mêmes fonctions que le reste de l'arène : un même montant doit s'écrire
// pareil dans le constat du tour et dans les comptes qui le justifient.
const euro = formatEuro;
const pct = formatPercent;
const units = formatUnits;

/**
 * Accorde un participe ou un adjectif avec l'unité vendue du secteur.
 *
 * « 205 enceintes sont restés » : la phrase était juste pour les couverts et
 * fausse pour les enceintes, parce qu'elle était écrite une fois pour sept
 * secteurs. Le genre vient désormais du vocabulaire du scénario.
 */
const accord = (v: { unitsGender: "m" | "f" }, mot: string) =>
  v.unitsGender === "f" ? `${mot}es` : `${mot}s`;

/** Volumes vendus et refusés du tour, tous segments confondus. */
function volumes(result: CompanyRoundResult): { sold: number; lost: number } {
  const segments = Object.values(result.market.bySegment);
  return {
    sold: segments.reduce((s, d) => s + d.sold, 0),
    lost: segments.reduce((s, d) => s + d.lost, 0),
  };
}

/** Au-delà de ce taux d'utilisation, l'outil n'a plus de marge pour un pic de demande. */
const SEUIL_DE_TENSION = 0.85;

/** Une caisse qui dépasse ce multiple des charges de structure du tour dort. */
const SEUIL_DE_CAISSE_QUI_DORT = 1.5;

export function roundBriefing(input: BriefingInput): RoundBriefing {
  const { result, vocabulary: v, enabled, perishable } = input;
  const { sold, lost } = volumes(result);
  const { netTreasury } = result.functionalBalance;
  const { operatingIncome, netIncome } = result.incomeStatement;
  const unsold = Math.max(0, result.production.produced - sold);

  // 1. La trésorerie d'abord : une entreprise ne meurt pas d'une perte, elle
  //    meurt de ne plus pouvoir payer. Tout le reste attend.
  if (result.balanceSheet.overdraft > 0.5 || netTreasury < 0) {
    const routes: BriefingRoute[] = [];
    if (enabled.creances && input.hasTreasuryTools) {
      routes.push({
        label: "Mobiliser le poste clients",
        gain: "Les créances rentrent tout de suite, sans rien vendre de plus.",
        risque:
          "L'escompte se paie en frais financiers, et le problème revient s'il vient d'ailleurs.",
      });
    }
    routes.push({
      label: "Réduire la voilure",
      // Le métier qui ne stocke pas n'a rien qui « s'écoule » : la seconde
      // moitié de la phrase ne vaut que pour les secteurs à stock. Elle disait
      // sinon « le nuitées perdues déjà là qui s'écoule ».
      gain: perishable
        ? `Moins de ${v.units} ${accord(v, "lancé")}, c'est moins d'argent sorti d'avance.`
        : `Moins de ${v.units} ${accord(v, "lancé")}, et la réserve déjà payée qui s'écoule.`,
      risque:
        "Les charges de structure ne baissent pas, elles : le trou peut se creuser.",
    });
    routes.push({
      label: "Aller chercher du financement",
      gain: "La question du tour est réglée, et l'activité reste intacte.",
      risque:
        "Les échéances tombent que la caisse soit pleine ou vide.",
    });
    return {
      code: "treasury_crisis",
      headline:
        result.balanceSheet.overdraft > 0.5
          ? `Votre trésorerie nette est à ${euro(netTreasury)} et la banque a ouvert un découvert de ${euro(result.balanceSheet.overdraft)}.`
          : `Votre trésorerie nette est passée à ${euro(netTreasury)}.`,
      question: "Il faut faire rentrer de l'argent ce tour-ci. Vous le prenez où ?",
      routes,
    };
  }

  // 2. De la demande refusée : le signal le plus coûteux, parce qu'il ne se
  //    voit pas dans les comptes. Une vente manquée ne laisse aucune trace.
  if (sold > 0 && lost > 0.05 * sold) {
    const routes: BriefingRoute[] = [];
    if (enabled.investment && input.hasInvestmentOffer) {
      routes.push({
        label: "Acheter de la capacité",
        gain: "Vous servirez la demande refusée, et pour tous les tours qui restent.",
        risque:
          "Payé maintenant, en service au tour suivant, amorti à chaque tour ensuite.",
      });
    }
    if (enabled.hr) {
      routes.push({
        label: "Renforcer l'équipe",
        gain: "Une embauche lève le plafond humain, souvent plus vite qu'une machine.",
        risque:
          "Le renfort n'arrive qu'au tour suivant, et le salaire tombe ensuite chaque tour.",
      });
    }
    routes.push({
      label: `Monter votre ${v.priceLabel.toLowerCase()}`,
      gain: "Refuser des clients dit que le prix est trop bas : la capacité rapporte plus.",
      risque:
        "Les clientèles sensibles au prix partent, et ne reviennent pas toutes.",
    });
    return {
      code: "demand_refused",
      headline: `Vous avez laissé partir ${units(lost)} ${v.units} faute de pouvoir les servir, sur ${units(sold + lost)} ${accord(v, "demandé")}.`,
      question: "La demande dépasse ce que vous savez servir. Qu'est-ce que vous faites ?",
      routes,
    };
  }

  // 3. L'invendu : de l'argent déjà sorti qui n'est pas encore rentré, ou qui
  //    ne rentrera jamais quand l'activité est périssable.
  if (unsold > 0.08 * Math.max(sold, 1)) {
    return {
      code: "stock_piling",
      headline: perishable
        ? `Vous avez prévu ${units(unsold)} ${v.units} de plus que vous n'en avez ${accord(v, "vendu")}. Dans ce métier, ${v.unitsGender === "f" ? "elles" : "ils"} sont ${accord(v, "perdu")}.`
        : // Pas de complément de lieu ici : le libellé du secteur est un nom, pas
          // un endroit. « immobilisés en stock en réserve » pour la boutique,
          // « en jours non facturés » ailleurs. La question qui suit le reprend
          // là où il se lit bien.
          `Il vous reste ${units(unsold)} ${v.units} sur les bras, soit ${euro(result.balanceSheet.inventoryValue)} immobilisés.`,
      question: perishable
        ? `Vous préparez encore avant de savoir. Vous visez quelle affluence ?`
        : `Ce ${v.leftoverLabel.toLowerCase()}, vous le videz ou vous l'assumez ?`,
      routes: [
        {
          label: `Baisser votre ${v.priceLabel.toLowerCase()}`,
          gain: "L'invendu s'écoule, et l'argent immobilisé redevient de la trésorerie.",
          risque:
            "Un euro de moins, c'est un euro de marge en moins sur TOUTES les ventes.",
        },
        {
          label: `Réduire votre ${v.productionPlanLabel.toLowerCase()}`,
          gain: "Vous cessez d'avancer de l'argent pour des ventes qui n'arrivent pas.",
          risque:
            "Si la demande repart, vous n'aurez rien à servir, et elle ne revient pas.",
        },
      ],
    };
  }

  // 4. La perte d'exploitation : l'activité elle-même ne couvre pas ses coûts.
  if (operatingIncome < 0) {
    return {
      code: "operating_loss",
      headline: `Votre résultat d'exploitation est négatif : ${euro(operatingIncome)}. L'activité du tour n'a pas couvert ses charges.`,
      question: "Le volume ne suffit pas à porter la structure. Sur quel levier jouez-vous ?",
      routes: [
        {
          label: "Chercher le volume",
          gain: `Chaque ${v.unit} de plus n'ajoute que son coût variable : le reste couvre la structure.`,
          risque:
            "Il faut baisser le prix : le volume gagné doit compenser la marge perdue.",
        },
        {
          label: "Chercher la marge",
          gain: "Chaque vente rapporte davantage, sans rien produire de plus.",
          risque:
            "Les clientèles sensibles au prix s'en vont, et la structure reste à couvrir.",
        },
      ],
    };
  }

  // 5. Rien ne brûle, mais l'outil approche de son plafond. La capacité achetée
  //    ce tour ne sert qu'au tour suivant : investir se décide AVANT de manquer
  //    de place, pas après avoir refusé des clients (c'est la règle 2, qui
  //    arrive toujours un tour trop tard).
  if (
    enabled.investment &&
    input.hasInvestmentOffer &&
    result.production.utilizationRate >= SEUIL_DE_TENSION &&
    sold > 0
  ) {
    return {
      code: "capacity_tension",
      headline: `Votre outil a tourné à ${pct(result.production.utilizationRate)} de sa capacité : il ne reste presque aucune marge si la demande monte.`,
      question: "Une capacité achetée ce tour ne sert qu'au tour suivant. Vous anticipez ou vous attendez ?",
      routes: [
        {
          label: "Investir avant le pic",
          gain: "Quand la demande monte, vous êtes prêt à la servir au lieu de la refuser.",
          risque: "Payé tout de suite, amorti ensuite : si la demande ne vient pas, la capacité pèse sur vos marges.",
        },
        {
          label: "Attendre un signe de la demande",
          gain: "Vous ne payez que pour une demande qui existe.",
          risque: "Le jour où elle vient, il faudra un tour de plus avant de pouvoir la servir.",
        },
      ],
    };
  }

  // 6. Une caisse qui dort. Pas de découvert, rien d'urgent : le solde dépasse
  //    une fois et demie les charges de structure. C'est un coût d'opportunité,
  //    et il ne se lit dans aucun compte.
  if (
    enabled.investment &&
    input.hasInvestmentOffer &&
    result.balanceSheet.overdraft < 0.5 &&
    result.incomeStatement.fixedCosts > 0 &&
    result.balanceSheet.cash > SEUIL_DE_CAISSE_QUI_DORT * result.incomeStatement.fixedCosts
  ) {
    return {
      code: "idle_cash",
      headline: `Vous avez ${euro(result.balanceSheet.cash)} en caisse, de quoi tenir plus d'un tour et demi de charges de structure sans rien vendre.`,
      question: "Cet argent ne rapporte rien en caisse. Vous le gardez ou vous le mettez au travail ?",
      routes: [
        {
          label: "Le mettre au travail",
          gain: "Une capacité en plus, ou un emprunt en moins : l'argent rapporte au lieu de dormir.",
          risque: "Il ne sera plus là pour absorber un coup dur, et une machine ne se revend pas au prix payé.",
        },
        {
          label: "Le garder",
          gain: "Une caisse pleine encaisse un mauvais trimestre sans emprunter.",
          risque: "Vos concurrents investissent pendant que vous attendez.",
        },
      ],
    };
  }

  // 7. Rien ne brûle : le vrai arbitrage devient celui qu'on ne fait pas quand
  //    tout va bien, et qui décide pourtant des tours suivants.
  return {
    code: "steady",
    headline: `Tour bouclé : ${euro(netIncome)} de résultat net et ${pct(result.market.totalShare)} du marché.`,
    question: "Rien ne brûle. Vous consolidez, ou vous poussez l'avantage ?",
    routes: [
      {
        label: "Pousser l'avantage",
        gain: "Prix agressif et budgets ouverts prennent de la part de marché, qui se garde.",
        risque:
          "La trésorerie encaisse plus tard que le résultat : la caisse se vide d'abord.",
      },
      {
        label: "Consolider",
        gain: "Marge tenue et caisse qui se reconstitue : de quoi encaisser un coup dur.",
        risque:
          "Vos concurrents prennent la part que vous laissez, et elle se reprend cher.",
      },
    ],
  };
}
