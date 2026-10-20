import type {
  CompanyRoundResult,
  EngineScenarioConfig,
  IncomeStatement,
  SalesEstimate,
} from "@/engine/types";
import { courrierParCode } from "@/config/courriers/registre";
import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { unitesVendues } from "@/components/ecart-d-estimation";
import { structureDuTour } from "@/pedagogy/verdict-du-tour";

/**
 * CE QUI A FAIT LE RÉSULTAT.
 *
 * Au rituel de fin de tour, l'explication tenait en une phrase : « la marge sur
 * les ventes ne couvre pas les charges de structure ». Juste, mais seule : un
 * élève lisait un verdict sans voir d'où il venait. Ce module dit, À PARTIR DES
 * COMPTES DU TOUR et de rien d'autre, ce qui a fait le chiffre :
 *
 *   · LA CASCADE DU RÉSULTAT — chiffre d'affaires, moins les coûts variables,
 *     égale la marge sur coût variable (un sous-total, lot P8), moins les
 *     charges de structure, moins ce qui vient sous l'excédent brut
 *     (amortissements, frais financiers, exceptionnel, impôt), égale le
 *     résultat net. Chaque marche est LUE dans le compte de résultat ; aucune
 *     n'est un reste calculé pour tomber juste. C'est précisément ce qui permet
 *     à une garde de vérifier que la somme retombe au centime sur le résultat
 *     (`tests/unit/lecture-du-resultat.test.ts`, sur de vrais tours de
 *     chaque scénario) : si une ligne du compte venait à manquer, la cascade
 *     ne fermerait plus, et la garde le dirait.
 *
 *   · LES CAUSES LES PLUS FORTES, CHIFFRÉES — les ventes manquées (la demande
 *     non servie), le prix pratiqué contre le prix moyen du marché, les ventes
 *     estimées contre les ventes réalisées. Chacune n'existe que si la donnée
 *     existe (pas d'estimation déposée, pas de cause « estimation »). Elles se
 *     classent par leur ÉCART RELATIF, la seule mesure commune honnête : on ne
 *     prétend pas convertir un écart de prix en euros de résultat, ce serait
 *     rejouer le marché.
 *
 * CE QUE CE N'EST PAS : ni un score, ni un conseil. Un constat chiffré, au
 * passé, comme le verdict du tour (`verdict-du-tour.ts`) qu'il prolonge.
 */

/** Une marche de la cascade : ce qu'elle apporte au résultat, signe compris. */
export interface MarcheDuResultat {
  cle: "ca" | "variables" | "marge" | "structure" | "sous-ebe" | "resultat";
  libelle: string;
  /** L'apport au résultat : positif pour le chiffre d'affaires, négatif pour une charge. */
  montant: number;
  /** Où la marche commence et où elle s'arrête, sur l'axe de la cascade. */
  debut: number;
  fin: number;
}

export interface DecompositionDuResultat {
  chiffreDAffaires: number;
  coutsVariables: number;
  marge: number;
  structure: number;
  sousLExcedent: number;
  resultat: number;
  marches: readonly MarcheDuResultat[];
}

/**
 * Ce qui vient SOUS l'excédent brut d'exploitation, compté comme une charge :
 * amortissements et moins-values de cession (l'écart entre l'EBE et le
 * résultat d'exploitation), frais financiers, charges exceptionnelles et
 * impôt, moins les produits financiers et exceptionnels. Tout est lu dans le
 * compte ; le sauvetage accordé par l'animateur y entre comme un produit.
 */
export function sousLExcedent(cr: IncomeStatement): number {
  return (
    cr.ebitda -
    cr.operatingIncome +
    cr.interest -
    (cr.financialIncome ?? 0) +
    (cr.exceptionalCharge ?? 0) -
    (cr.exceptionalIncome ?? 0) -
    (cr.rescueSubsidy ?? 0) +
    cr.tax
  );
}

/** La cascade du résultat d'un tour, lue dans son compte de résultat. */
export function decompositionDuResultat(cr: IncomeStatement): DecompositionDuResultat {
  const chiffreDAffaires = cr.revenue;
  // Le coût des unités vendues et la commission des canaux : ce que la vente
  // coûte, et qui se retranche AVANT la marge sur coût variable.
  const coutsVariables = cr.cogs + (cr.commissionCost ?? 0);
  const structure = structureDuTour(cr);
  const sous = sousLExcedent(cr);
  const marches: MarcheDuResultat[] = [];
  let niveau = 0;
  const poser = (cle: MarcheDuResultat["cle"], libelle: string, montant: number) => {
    marches.push({ cle, libelle, montant, debut: niveau, fin: niveau + montant });
    niveau += montant;
  };
  poser("ca", "Chiffre d'affaires", chiffreDAffaires);
  poser("variables", "Coûts variables", -coutsVariables);
  // LOT P8 : LA MARGE, LE SOUS-TOTAL QUE LE JEU ENSEIGNE. Le verdict dit « le
  // tour s'est joué sur la marge » : elle a sa ligne, comme dans le compte de
  // résultat du jeu (« = Marge sur coût variable »). C'est un SOLDE, une barre
  // entière de zéro à elle-même ; elle ne déplace pas le niveau atteint, qui
  // est déjà elle (chiffre d'affaires moins coûts variables).
  marches.push({
    cle: "marge",
    libelle: "Marge sur coût variable",
    montant: niveau,
    debut: 0,
    fin: niveau,
  });
  poser("structure", "Charges de structure", -structure);
  poser("sous-ebe", "Amortissements, intérêts, impôt", -sous);
  // Le résultat est une barre ENTIÈRE, de zéro à lui-même : c'est la marche
  // d'arrivée, et c'est le chiffre du compte, pas le niveau atteint.
  marches.push({
    cle: "resultat",
    libelle: "Résultat net",
    montant: cr.netIncome,
    debut: 0,
    fin: cr.netIncome,
  });
  return {
    chiffreDAffaires,
    coutsVariables,
    marge: cr.grossMargin,
    structure,
    sousLExcedent: sous,
    resultat: cr.netIncome,
    marches,
  };
}

/** Une cause chiffrée du résultat : un nom court, une phrase, et sa force relative. */
export interface CauseDuResultat {
  cle: "ventes-manquees" | "prix" | "estimation" | `alea:${string}`;
  titre: string;
  texte: string;
  /** L'écart relatif qui la classe (0,23 pour 23 %). */
  force: number;
}

/** En dessous d'un pour cent d'écart, une cause n'a rien fait : elle ne se dit pas. */
const SEUIL = 0.01;

const pourcent = (x: number) => `${Math.round(Math.abs(x) * 100)} %`;

export function causesDuResultat({
  result,
  prixPratique,
  prixDuMarche,
  estimation,
  unites,
  aleas = [],
}: {
  result: CompanyRoundResult;
  /** Le prix moyen pratiqué par l'équipe ce tour (benchmark du tour), s'il est connu. */
  prixPratique: number | null;
  /** Le prix moyen du marché ce tour (benchmark du tour), s'il est connu. */
  prixDuMarche: number | null;
  /** Ce que l'équipe avait estimé vendre, si elle l'a dit. */
  estimation: SalesEstimate | null | undefined;
  /** Le nom des unités du métier : « enceintes », « nuitées ». */
  unites: string;
  /**
   * Les aléas du tour (`aleasDuTour`, préparés côté serveur, qui connaît le
   * scénario). Ils s'AJOUTENT aux trois causes les plus fortes, sans en
   * prendre la place : un aléa n'est jamais écarté par un écart de prix.
   */
  aleas?: readonly AleaDuTour[];
}): CauseDuResultat[] {
  const causes: CauseDuResultat[] = [];
  const segments = Object.values(result.market.bySegment);

  // LES VENTES MANQUÉES : la demande adressée qu'on n'a pas pu servir (rupture).
  const manquees = segments.reduce((s, d) => s + d.lost, 0);
  const servies = segments.reduce((s, d) => s + d.sold, 0);
  const caDuMarche = segments.reduce((s, d) => s + d.revenue, 0);
  if (manquees >= 1 && servies + manquees > 0) {
    const part = manquees / (servies + manquees);
    // Au prix moyen réellement obtenu sur le marché ce tour : c'est un ordre de
    // grandeur, et la phrase le dit (« au prix pratiqué »).
    const prixMoyen = servies > 0 ? caDuMarche / servies : null;
    causes.push({
      cle: "ventes-manquees",
      titre: "Ventes manquées",
      texte:
        // Des noms, pas des participes : « enceintes », « nuitées », « repas »
        // n'ont pas le même genre, et la phrase doit s'écrire pour tous.
        `demande non servie de ${formatUnits(manquees)} ${unites} (${pourcent(part)} de la demande)` +
        (prixMoyen !== null
          ? `, soit environ ${formatEuro(manquees * prixMoyen)} de chiffre d'affaires au prix pratiqué.`
          : "."),
      force: part,
    });
  }

  // LE PRIX CONTRE LE MARCHÉ.
  if (prixPratique !== null && prixDuMarche !== null && prixDuMarche > 0) {
    const ecart = (prixPratique - prixDuMarche) / prixDuMarche;
    if (Math.abs(ecart) >= SEUIL) {
      causes.push({
        cle: "prix",
        titre: "Prix",
        texte: `${formatEuro(prixPratique)} contre ${formatEuro(prixDuMarche)} en moyenne sur le marché, ${pourcent(ecart)} ${ecart < 0 ? "sous" : "au-dessus du"} marché.`,
        force: Math.abs(ecart),
      });
    }
  }

  // CE QU'ON AVAIT ESTIMÉ, CONTRE CE QUI S'EST VENDU.
  if (estimation && estimation.units > 0) {
    const vendues = unitesVendues(result);
    const ecart = (vendues - estimation.units) / estimation.units;
    if (Math.abs(ecart) >= SEUIL) {
      causes.push({
        cle: "estimation",
        titre: "Estimation",
        texte: `ventes estimées ${formatUnits(estimation.units)} ${unites}, ventes réalisées ${formatUnits(vendues)} (${ecart > 0 ? "+" : "\u2212"}${pourcent(ecart)}).`,
        force: Math.abs(ecart),
      });
    }
  }

  return [
    ...causes.sort((a, b) => b.force - a.force).slice(0, 3),
    ...aleas.map((a) => ({
      cle: `alea:${a.cle}` as const,
      titre: "Aléa du tour",
      texte: a.texte,
      force: a.force,
    })),
  ];
}

/** Une cause est-elle un aléa du tour ? */
export const estUnAlea = (c: CauseDuResultat) => c.cle.startsWith("alea:");

/**
 * UN ALÉA DU TOUR, NOMMÉ ET, QUAND LES COMPTES LE DISENT, CHIFFRÉ.
 *
 * « Ce qui a fait le résultat » ne nommait jamais l'aléa : un élève dont la
 * production chutait à cause d'une panne ou d'une rupture lisait « Prix : 59 €
 * contre 59 € » et rien d'autre. Les événements de marché étaient annoncés en
 * début de tour, par le courrier ; mais pas au moment où l'élève lit son
 * résultat, c'est-à-dire au moment où il pourrait faire le lien. Et la rupture
 * d'approvisionnement, tirée à la clôture, n'était dite nulle part en
 * mono-produit.
 *
 * L'EFFET N'EST CHIFFRÉ QUE LÀ OÙ IL SE LIT SANS REJOUER LE MARCHÉ :
 *
 *  · une disponibilité amputée (panne, vague de froid, rupture en
 *    mono-produit) : le moteur produit `min(plan, capacité machine, capacité
 *    de main-d'œuvre)`, et la capacité machine du tour porte le facteur de
 *    l'aléa ; la diviser par ce facteur rend la capacité qu'on aurait eue
 *    sans lui, donc la production. Le test compare au tour rejoué, aléa
 *    neutralisé : c'est le chiffre du moteur ;
 *  · une amende ou une aide inscrite au scénario : son montant.
 *
 * Une variation de la demande ne se chiffre pas : il faudrait rejouer le
 * marché. L'aléa est alors nommé avec l'effet que son courrier annonce, et
 * rien d'inventé.
 */
export interface AleaDuTour {
  /** Le code de l'événement, ou « rupture ». */
  cle: string;
  texte: string;
  /** Ce que l'aléa a pesé, rapporté au tour (0 quand il ne se mesure pas). */
  force: number;
}

/** Ce qu'un facteur de disponibilité a fait à la production du tour (mono-produit). */
function effetSurLaProduction(
  result: CompanyRoundResult,
  facteur: number,
  unites: string,
): { texte: string; force: number } | null {
  if (!(facteur > 0) || facteur === 1) return null;
  const p = result.production;
  const sans = Math.max(0, Math.min(p.planned, p.machineCapacity / facteur, p.laborCapacity));
  const ecart = sans - p.produced;
  if (Math.abs(ecart) < 0.5) {
    return {
      texte: "aucun sur la production, le plan restait sous la capacité de l'atelier",
      force: 0,
    };
  }
  return {
    texte: `une production ${ecart > 0 ? "amputée" : "accrue"} de ${formatUnits(Math.abs(ecart))} ${unites}`,
    force: Math.abs(ecart) / Math.max(1, sans),
  };
}

export function aleasDuTour({
  scenario,
  result,
  codes,
  unites,
}: {
  scenario: Pick<EngineScenarioConfig, "events" | "suppliers">;
  result: CompanyRoundResult;
  /** Les événements apparus ce tour qui concernent l'équipe (trace du tour). */
  codes: readonly string[];
  unites: string;
}): AleaDuTour[] {
  const mono = !result.products;
  const aleas: AleaDuTour[] = [];
  const ca = Math.max(1, Math.abs(result.incomeStatement.revenue));

  for (const code of new Set(codes)) {
    const courrier = courrierParCode.get(code);
    const nom = `« ${courrier?.objet ?? code} »`;
    const annonce = courrier?.effet ? ` : ${courrier.effet}` : "";
    const def = scenario.events.find((e) => e.code === code);
    let mesure: { texte: string; force: number } | null = null;
    if (result.insurance?.neutralizedEvents.includes(code)) {
      mesure = { texte: "aucun, votre assurance l'a neutralisé", force: 0 };
    } else if (def) {
      const somme = (cible: string) =>
        def.modifiers
          .filter((m) => m.target === cible && m.op === "add")
          .reduce((t, m) => t + m.value, 0);
      const amende = somme("financial_penalty");
      const aide = somme("financial_aid");
      const disponibilite = def.modifiers
        .filter((m) => m.target === "availability" && m.op === "mul")
        .reduce((t, m) => t * m.value, 1);
      if (amende > 0) {
        mesure = { texte: `${formatEuro(amende)} de charge exceptionnelle`, force: amende / ca };
      } else if (aide > 0) {
        mesure = { texte: `${formatEuro(aide)} de produit exceptionnel`, force: aide / ca };
      } else if (mono) {
        mesure = effetSurLaProduction(result, disponibilite, unites);
      }
    }
    aleas.push({
      cle: code,
      texte: `${nom}${annonce}.${mesure ? ` Effet : ${mesure.texte}.` : ""}`,
      force: mesure?.force ?? 0,
    });
  }

  // LA RUPTURE D'APPROVISIONNEMENT, tirée à la clôture et jamais annoncée.
  if (mono && result.supplier?.supplyDisruption) {
    const fournisseur = scenario.suppliers?.find((f) => f.code === result.supplier!.code);
    const mesure = fournisseur
      ? effetSurLaProduction(result, fournisseur.supplyRiskAvailabilityHit, unites)
      : null;
    aleas.push({
      cle: "rupture",
      texte: `rupture d'approvisionnement chez ${result.supplier.name}.${mesure ? ` Effet : ${mesure.texte}.` : ""}`,
      force: mesure?.force ?? 0,
    });
  } else if (!mono && result.products) {
    const touchees = Object.entries(result.products)
      .filter(([, p]) => p.supplier?.supplyDisruption)
      .map(([, p]) => p.supplier!.name);
    if (touchees.length > 0) {
      aleas.push({
        cle: "rupture",
        texte: `rupture d'approvisionnement chez ${[...new Set(touchees)].join(", ")} : la production des références qu'il fournit est amputée.`,
        force: 0,
      });
    }
  }
  return aleas;
}

/**
 * L'indication sous la tuile de production d'un tour clos. En mono-produit, la
 * rupture d'approvisionnement n'était dite NULLE PART (le tableau des
 * références, qui la signale, n'existe qu'en gamme) : elle l'est ici, là où
 * l'élève regarde ce que son atelier a produit.
 */
export function indicationDeProduction(result: CompanyRoundResult): string {
  const utilisation = `Utilisation : ${formatPercent(result.production.utilizationRate)}`;
  return !result.products && result.supplier?.supplyDisruption
    ? `Rupture d'approvisionnement chez ${result.supplier.name} · ${utilisation}`
    : utilisation;
}
