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
  enabled: { finance: boolean; investment: boolean; hr: boolean };
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
    if (enabled.finance && input.hasTreasuryTools) {
      routes.push({
        label: "Mobiliser le poste clients",
        gain: "Les créances rentrent tout de suite au lieu d'attendre leur échéance. La caisse se remplit sans rien vendre de plus.",
        risque:
          "L'escompte et l'affacturage se paient. Une partie de la marge du tour part en frais financiers, et le problème revient au tour suivant s'il vient d'ailleurs.",
      });
    }
    routes.push({
      label: "Réduire la voilure",
      gain: `Moins de ${v.units} ${accord(v, "lancé")}, c'est moins d'argent immobilisé d'avance, et le ${v.leftoverLabel.toLowerCase()} déjà là qui s'écoule.`,
      risque:
        "Les charges de structure ne baissent pas, elles. Moins de volume, c'est moins de marge pour les couvrir, et le trou peut se creuser.",
    });
    routes.push({
      label: "Aller chercher du financement",
      gain: "Un apport ou un emprunt règle la question du tour et laisse l'activité intacte.",
      risque:
        "L'emprunt se rembourse par échéances qui tombent que la caisse soit pleine ou vide, et les associés ne suivent pas indéfiniment.",
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
        gain: "Vous servirez la demande que vous refusez aujourd'hui, et cela vaut pour tous les tours qui restent.",
        risque:
          "Cela se paie maintenant et n'entre en service qu'au tour suivant. Les amortissements, eux, tomberont ensuite à chaque tour, demande ou pas.",
      });
    }
    if (enabled.hr) {
      routes.push({
        label: "Renforcer l'équipe",
        gain: "Une embauche ou de la formation lève le plafond humain, souvent plus vite qu'un investissement.",
        risque:
          "Le recrutement coûte tout de suite et le renfort n'arrive qu'au tour suivant. Un salaire, une fois embauché, tombe chaque tour.",
      });
    }
    routes.push({
      label: `Monter votre ${v.priceLabel.toLowerCase()}`,
      gain: "Refuser des clients est le signe que votre prix est trop bas. La même capacité rapporte alors davantage, sans rien investir.",
      risque:
        "Les clientèles sensibles au prix partent chez le concurrent, et toutes ne reviennent pas au tour suivant.",
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
        : `Il vous reste ${units(unsold)} ${v.units} sur les bras, soit ${euro(result.balanceSheet.inventoryValue)} immobilisés en ${v.leftoverLabel.toLowerCase()}.`,
      question: perishable
        ? `Vous préparez encore avant de savoir. Vous visez quelle affluence ?`
        : `Ce ${v.leftoverLabel.toLowerCase()}, vous le videz ou vous l'assumez ?`,
      routes: [
        {
          label: `Baisser votre ${v.priceLabel.toLowerCase()}`,
          gain: "La demande remonte, l'invendu s'écoule, et l'argent immobilisé redevient de la trésorerie.",
          risque:
            "Chaque euro de moins est un euro de marge en moins sur TOUTES les ventes, pas seulement sur celles que vous rattrapez.",
        },
        {
          label: `Réduire votre ${v.productionPlanLabel.toLowerCase()}`,
          gain: "Vous cessez d'avancer de l'argent pour des ventes qui n'arrivent pas, et vous écoulez ce qui est déjà là.",
          risque:
            "Si la demande repart, vous n'aurez rien à servir, et une vente manquée ne se rattrape pas au tour suivant.",
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
          gain: `Chaque ${v.unit} de plus n'ajoute que son coût variable : tout le reste de son prix va couvrir la structure.`,
          risque:
            "Il faut baisser le prix pour l'obtenir, ce qui réduit précisément ce que chaque vente rapporte. Le volume gagné doit compenser la marge perdue.",
        },
        {
          label: "Chercher la marge",
          gain: "Un prix plus élevé fait rentrer davantage sur chaque vente, sans rien produire de plus.",
          risque:
            "Les clientèles sensibles au prix s'en vont, et un volume qui s'effondre laisse la structure encore plus découverte.",
        },
      ],
    };
  }

  // 5. Rien ne brûle : le vrai arbitrage devient celui qu'on ne fait pas quand
  //    tout va bien, et qui décide pourtant des tours suivants.
  return {
    code: "steady",
    headline: `Tour bouclé : ${euro(netIncome)} de résultat net et ${pct(result.market.totalShare)} du marché.`,
    question: "Rien ne brûle. Vous consolidez, ou vous poussez l'avantage ?",
    routes: [
      {
        label: "Pousser l'avantage",
        gain: "Prix agressif et budgets ouverts prennent de la part de marché pendant que vous en avez les moyens. La part gagnée se garde en partie d'un tour à l'autre.",
        risque:
          "Cela se paie tout de suite, et la trésorerie encaisse plus tard que le compte de résultat. Une croissance rapide vide la caisse avant d'avoir rapporté.",
      },
      {
        label: "Consolider",
        gain: "Marge tenue et trésorerie qui se reconstitue : vous serez en état d'encaisser un coup dur ou de saisir une occasion.",
        risque:
          "Pendant ce temps, vos concurrents prennent la part de marché que vous laissez, et elle se reprend plus cher qu'elle ne se garde.",
      },
    ],
  };
}
