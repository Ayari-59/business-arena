import { PRODUCT_FIELD_PREFIX } from "@/config/decision-source";
import {
  PREFIXE_FABRICATION_ETRANGERE,
  PREFIXE_RESEAU_ETRANGER,
  PREFIXE_SOUS_TRAITANCE,
} from "@/config/decisions-saisies";
import { PREFIXE_DES_MODULES } from "@/config/modules-saisis";
import { PREFIXE_VENTES_ESTIMEES } from "@/config/ventes-estimees";

/**
 * LE BROUILLON D'ÉQUIPE, ENREGISTRÉ SUR LE SERVEUR.
 *
 * Le brouillon local du navigateur (`lib/brouillon-decisions.ts`) gardait la
 * saisie d'un seul élève, sur un seul appareil : les coéquipiers ne voyaient
 * rien avant la validation, et l'enseignant ne voyait pas le travail en cours.
 * La feuille enregistre donc aussi la saisie sur le serveur, dans la ligne
 * `decisions` de l'équipe pour le tour en cours, au statut `draft`.
 *
 * Ce module est PUR : ce qu'on accepte d'enregistrer (les champs de la feuille,
 * bornés), les délais de l'enregistrement automatique, et la phrase « Modifié
 * par Léa à 14:32 ». Le service (`services/brouillon-equipe.service.ts`) écrit
 * et relit ; la feuille (`components/brouillon-d-equipe.tsx`) enregistre.
 *
 * Les règles, en clair :
 *  - une ligne par équipe et par tour, le dernier enregistrement gagne ;
 *  - un coéquipier qui a la feuille ouverte voit un bandeau quand un autre a
 *    enregistré, plutôt qu'un écrasement silencieux de ce qu'il tape ;
 *  - la validation transforme le brouillon en décision validée ;
 *  - la clôture ne joue JAMAIS un brouillon : une équipe qui n'a qu'un
 *    brouillon est reconduite, comme une équipe sans décision.
 */

export type SaisieDuBrouillon = Record<string, string>;

/** L'enregistrement part ce délai après la dernière frappe (et tout de suite à la sortie d'une étape). */
export const DELAI_D_ENREGISTREMENT_MS = 3_000;

/**
 * LE DÉBIT : un même élève n'enregistre pas plus d'une fois par seconde. La
 * feuille regroupe déjà ses envois (`DELAI_D_ENREGISTREMENT_MS`) ; la borne du
 * serveur ne vise qu'un envoi forgé ou une boucle.
 */
export const INTERVALLE_MINIMAL_MS = 1_000;

/** LA TAILLE : de quoi tenir la plus grande feuille (gamme, modules, groupe), pas davantage. */
export const LIMITES_DU_BROUILLON = {
  champs: 400,
  longueurDuNom: 120,
  longueurDUneValeur: 5_000,
  octets: 64_000,
} as const;

/** Les champs nommés de la feuille (`components/decision-form.tsx` et ses îlots). */
const CHAMPS_DE_LA_FEUILLE = new Set([
  "acceptOrder",
  "brandMarketingBudget",
  "capitalIncrease",
  "communicationAxis",
  "discount",
  "dividend",
  "equipmentBuyJson",
  "equipmentLeaseJson",
  "equipmentSellJson",
  "expectedCash",
  "expectedUnits",
  "factoring",
  "fire",
  "hire",
  "insurance",
  "justification",
  "leaseDecisionsJson",
  "loanRepayment",
  "machineCapacityUnits",
  "maintenanceBudget",
  "marketingBudget",
  "newLoan",
  "placement",
  "price",
  "productionPlan",
  "propositionDeVentes",
  "qualityBudget",
  "rachatAugmentation",
  "rachatCible",
  "rachatEmprunt",
  "rachatPaiement",
  "rachatPart",
  "rachatPrixMaximum",
  "rdBudget",
  "rseBudget",
  "rseInvestment",
  "salaryPercent",
  "studyFinance",
  "studyMarket",
  "studyPrice",
  "studyProject",
  "supplierChoice",
  "trainingBudget",
]);

/** Les champs nommés par référence, par module, par machine ou par filiale. */
const PREFIXES_DE_LA_FEUILLE = [
  PRODUCT_FIELD_PREFIX,
  PREFIXE_VENTES_ESTIMEES,
  PREFIXE_DES_MODULES,
  "equipmentBuy.",
  PREFIXE_SOUS_TRAITANCE,
  PREFIXE_RESEAU_ETRANGER,
  PREFIXE_FABRICATION_ETRANGERE,
] as const;

/** Ce qui suit un préfixe : un code, des points, des tirets ; rien d'autre. */
const SUITE_PERMISE = /^[A-Za-z0-9_.-]+$/;

/** Le nom est-il celui d'un champ de la feuille ? Les autres ne s'enregistrent pas. */
export function champDeLaFeuille(nom: string): boolean {
  if (nom.length === 0 || nom.length > LIMITES_DU_BROUILLON.longueurDuNom) return false;
  if (CHAMPS_DE_LA_FEUILLE.has(nom)) return true;
  return PREFIXES_DE_LA_FEUILLE.some(
    (p) => nom.startsWith(p) && nom.length > p.length && SUITE_PERMISE.test(nom.slice(p.length)),
  );
}

/**
 * LA SAISIE REÇUE, BORNÉE. Un objet de chaînes, rien d'autre ; trop grand, trop
 * de champs ou une valeur trop longue : refusé. Un champ que la feuille ne porte
 * pas est écarté, comme la validation écarte ce que le schéma ne connaît pas :
 * il n'est jamais enregistré.
 */
export function saisieDuBrouillon(
  brut: unknown,
): { saisie: SaisieDuBrouillon; ecartes: number } | { refus: string } {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    return { refus: "Brouillon illisible." };
  }
  const entrees = Object.entries(brut as Record<string, unknown>);
  if (entrees.length > LIMITES_DU_BROUILLON.champs) return { refus: "Brouillon trop grand." };
  let octets = 0;
  const saisie: SaisieDuBrouillon = {};
  let ecartes = 0;
  for (const [nom, valeur] of entrees) {
    if (typeof valeur !== "string") return { refus: "Brouillon illisible." };
    if (valeur.length > LIMITES_DU_BROUILLON.longueurDUneValeur) {
      return { refus: "Brouillon trop grand : une valeur dépasse 5 000 signes." };
    }
    octets += nom.length + valeur.length;
    if (octets > LIMITES_DU_BROUILLON.octets) return { refus: "Brouillon trop grand." };
    if (!champDeLaFeuille(nom)) {
      ecartes += 1;
      continue;
    }
    saisie[nom] = valeur;
  }
  return { saisie, ecartes };
}

/** La saisie, telle qu'un `FormData` la porterait : ce que lit `decisionsSaisies`. */
export function formulaireDuBrouillon(saisie: SaisieDuBrouillon): FormData {
  const f = new FormData();
  for (const [nom, valeur] of Object.entries(saisie)) f.append(nom, valeur);
  return f;
}

const HEURE_FR = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

/** « Modifié par Léa à 14:32 », « Modifié par vous à 14:32 ». */
export function mentionDuBrouillon(nom: string | null, quand: Date, parVous = false): string {
  const heure = HEURE_FR.format(quand);
  if (parVous) return `Modifié par vous à ${heure}`;
  const propre = nom?.trim();
  return propre ? `Modifié par ${propre} à ${heure}` : `Modifié à ${heure}`;
}

/** Le bandeau du coéquipier : quelqu'un d'autre a enregistré pendant qu'il avait la feuille ouverte. */
export function bandeauDuBrouillon(nom: string | null, quand: Date): string {
  const heure = HEURE_FR.format(quand);
  const propre = nom?.trim();
  return propre
    ? `Brouillon modifié par ${propre} à ${heure}.`
    : `Brouillon modifié par un coéquipier à ${heure}.`;
}

/** Ce que le sondage rend de l'état du brouillon : jamais son contenu. */
export interface EtatDuBrouillon {
  /** L'heure de l'enregistrement (ISO), qui sert de version. */
  quand: string;
  /** Le prénom de qui l'a enregistré. */
  par: string | null;
  /** Est-ce l'élève qui sonde ? */
  parVous: boolean;
}

/** Le brouillon servi à la feuille : la saisie, et son état. */
export interface BrouillonServi extends EtatDuBrouillon {
  saisie: SaisieDuBrouillon;
}
