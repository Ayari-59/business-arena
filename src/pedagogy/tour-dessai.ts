import { simulateRound } from "@/engine/simulation";
import { botDecisions } from "@/engine/bots";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import type { RoundDecisions, SimulationInput } from "@/engine/types";

/**
 * UN TOUR, TOUT DE SUITE, SANS COMPTE.
 *
 * La page d'accueil montrait un cockpit dessiné : « chiffre d'affaires
 * 346 920 € », « #2 NOVA 58,3 ». Des chiffres inventés, qui promettaient une
 * simulation sans jamais en faire tourner une — et un visiteur qui veut savoir
 * ce que c'est devait créer une partie pour le découvrir.
 *
 * À la place, un vrai tour : deux décisions, le moteur du jeu, et les chiffres
 * qui en sortent. C'est LE MÊME `simulateRound` que l'arène — aucune
 * approximation écrite pour la vitrine, sans quoi la vitrine finirait par
 * mentir sur le produit.
 *
 * RIEN N'EST ENREGISTRÉ. Pas de partie créée, pas de ligne en base, pas
 * d'identité : une fonction pure, à graine fixe, qui rend les chiffres d'un
 * tour et les oublie. Rejouer avec le même prix donne le même résultat, ce qui
 * est la moitié de ce qu'on veut faire comprendre : le marché répond à une
 * décision, il ne tire pas au sort.
 *
 * LE TOUR EST TOUJOURS LE PREMIER. Les tours suivants dépendent d'un stock, de
 * la qualité perçue et d'une trésorerie hérités : les enchaîner ici demanderait
 * de porter un état d'une requête à l'autre, donc de l'enregistrer quelque
 * part. Le tour 1 est le seul qui se rejoue à l'identique sans mémoire — et
 * c'est celui que l'élève joue pour de vrai cinq minutes plus tard.
 */

/** La graine du tirage. Fixe : le même essai rend le même tour. */
const GRAINE = 20260101;

/** Les budgets, posés à la valeur d'ouverture du scénario. */
const BUDGETS = { marketingBudget: 5000, qualityBudget: 3000, maintenanceBudget: 4000 } as const;

/** Ce que le visiteur décide : les deux leviers du premier tour. */
export const BORNES = {
  prix: { min: 40, max: 80, defaut: 59, pas: 1 },
  production: { min: 2000, max: 9000, defaut: 5000, pas: 500 },
} as const;

export interface TourDessai {
  prix: number;
  production: number;
  /** Ce que le marché a demandé à l'entreprise. */
  demande: number;
  /** Ce qui est sorti de l'atelier (la capacité peut brider le plan). */
  produit: number;
  vendu: number;
  /** La demande qu'on n'a pas pu servir, faute d'unités. */
  manque: number;
  /** Les unités produites et non vendues, qui dorment en stock. */
  invendus: number;
  chiffreDaffaires: number;
  resultat: number;
  tresorerie: number;
  /** Le plafond de l'atelier : le plan au-delà ne sert à rien. */
  capacite: number;
}

/** Ramène une saisie dans ses bornes, au pas près. L'entrée peut être n'importe quoi. */
export function borner(valeur: unknown, borne: { min: number; max: number; defaut: number }): number {
  // `Number(null)` vaut 0, `Number("")` aussi : un champ absent tomberait donc
  // sur la borne BASSE — le visiteur verrait le tour d'un prix à 40 € sans
  // l'avoir demandé. L'absence retombe sur le défaut, qui est ce que les
  // curseurs affichaient.
  if (valeur === null || valeur === undefined || valeur === "") return borne.defaut;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  if (!Number.isFinite(n)) return borne.defaut;
  return Math.min(borne.max, Math.max(borne.min, Math.round(n)));
}

export function jouerUnTourDessai(saisie: { prix: unknown; production: unknown }): TourDessai {
  const prix = borner(saisie.prix, BORNES.prix);
  const production = borner(saisie.production, BORNES.production);

  const joueur = novaCompany("essai", "Votre atelier", "human");
  const rival = novaCompany("rival", "SoundBox", "bot", "balanced");
  const decisions: RoundDecisions = { price: prix, productionPlan: production, ...BUDGETS } as RoundDecisions;

  const sortie = simulateRound({
    scenario: novaScenario,
    roundIndex: 1,
    companies: [joueur, rival],
    decisions: {
      essai: decisions,
      rival: botDecisions("balanced", { scenario: novaScenario, state: rival, roundIndex: 1 }),
    },
    activeEvents: [],
    seed: GRAINE,
  } as SimulationInput);

  const r = sortie.results["essai"]!;
  // `bySegment` est indexé par code de segment : on somme les valeurs, typées
  // au passage, plutôt que de faire confiance à l'index.
  const segments = Object.values(r.market.bySegment) as { demandForCompany: number; sold: number }[];
  const demande = segments.reduce((t, s) => t + s.demandForCompany, 0);
  const vendu = segments.reduce((t, s) => t + s.sold, 0);

  return {
    prix,
    production,
    demande: Math.round(demande),
    produit: Math.round(r.production.produced),
    vendu: Math.round(vendu),
    manque: Math.max(0, Math.round(demande - vendu)),
    invendus: Math.max(0, Math.round(r.production.produced - vendu)),
    chiffreDaffaires: r.incomeStatement.revenue,
    resultat: r.incomeStatement.netIncome,
    tresorerie: r.functionalBalance.netTreasury,
    capacite: Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity)),
  };
}

/** Une leçon du tour, dans la voix des lectures de comptes : un constat, un ton. */
export interface LeconDessai {
  ton: "bon" | "mauvais" | "neutre";
  texte: string;
}

/**
 * CE QUE L'ESSAI A MONTRÉ, en deux lignes au plus.
 *
 * Quatre chiffres ne s'expliquent pas tout seuls : un visiteur qui voit
 * « résultat + 49 490 € » et « trésorerie + 5 456 € » ne sait pas qu'il vient
 * de rencontrer la leçon centrale du jeu. Les constats sont ordonnés du plus
 * décisif au moins ; on en garde deux, parce qu'une vitrine n'est pas un cours.
 */
export function leconsDeLessai(t: TourDessai): LeconDessai[] {
  const lecons: LeconDessai[] = [];
  const nombre = (n: number) => Math.round(n).toLocaleString("fr-FR");

  // 1. Le plafond de l'atelier : le plan au-delà ne produit rien de plus.
  if (t.production > t.capacite) {
    lecons.push({
      ton: "neutre",
      texte: `Votre plan de ${nombre(t.production)} dépassait l'atelier : il ne sait pas sortir plus de ${nombre(t.capacite)} enceintes, et c'est ce qu'il a produit.`,
    });
  }

  // 2. Ce que le prix a fait au marché : trop bas, la demande dépasse ce qu'on
  //    peut servir ; trop haut, les unités restent sur les bras.
  if (t.manque > 0) {
    lecons.push({
      ton: "mauvais",
      texte: `${nombre(t.manque)} clients sont repartis sans acheter : la demande à ce prix dépasse ce que vous avez sorti.`,
    });
  } else if (t.invendus > 0) {
    lecons.push({
      ton: "mauvais",
      texte: `${nombre(t.invendus)} enceintes n'ont pas trouvé preneur : produites, payées, et restées en stock.`,
    });
  }

  // 3. LA LEÇON CENTRALE DU JEU, quand elle se présente : gagner de l'argent et
  //    en avoir en caisse sont deux choses différentes.
  if (t.resultat > 0 && t.tresorerie < t.resultat / 2) {
    lecons.push({
      ton: "mauvais",
      texte: "Vous gagnez de l'argent et il n'en reste presque pas en caisse : le stock et les délais de paiement l'ont immobilisé.",
    });
  } else if (t.resultat > 0) {
    lecons.push({ ton: "bon", texte: "Le tour est bénéficiaire, et la trésorerie suit." });
  } else {
    lecons.push({
      ton: "mauvais",
      texte: "Les charges de structure tombent quoi qu'il arrive : à ce niveau de ventes, elles ne sont pas couvertes.",
    });
  }

  return lecons.slice(0, 2);
}

