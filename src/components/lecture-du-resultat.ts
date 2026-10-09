import type { CompanyRoundResult, IncomeStatement, SalesEstimate } from "@/engine/types";
import { formatEuro, formatUnits } from "@/lib/format";
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
 *     moins les charges de structure, moins ce qui vient sous l'excédent brut
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
  cle: "ca" | "variables" | "structure" | "sous-ebe" | "resultat";
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
  cle: "ventes-manquees" | "prix" | "estimation";
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

  return causes.sort((a, b) => b.force - a.force).slice(0, 3);
}
