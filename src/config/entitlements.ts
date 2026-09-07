/**
 * Freemium : ce qui est gratuit, ce qui est payant.
 *
 * Le produit est un SaaS « land & expand » : un enseignant entre gratuitement,
 * l'établissement passe en licence. Une licence en cours ouvre TOUT ; en son
 * absence, l'accès est gratuit mais BORNÉ par le palier ci-dessous.
 *
 * Ces bornes ne sont pas figées dans le code : elles vivent dans la config
 * plateforme (admin), et l'administrateur les règle depuis /admin. Les valeurs
 * ici ne sont que le DÉFAUT au premier démarrage, avant tout réglage.
 *
 * Rappel de garde : historiquement « pas de licence = accès libre illimité ».
 * Ce palier renverse ce défaut en un accès libre LIMITÉ (freemium). Le passage
 * s'applique à tout compte sans licence active.
 */

export interface FreeTier {
  /**
   * Nombre de tours jouables en gratuit. La partie se termine à ce tour, même
   * si le scénario en prévoit davantage : c'est le mur « ne va pas au bout ».
   * `null` = pas de limite de tours (le scénario va jusqu'à son terme).
   */
  maxRounds: number | null;
  /** Le mode concours (qualifications, finale, page publique) est-il ouvert ? */
  competitions: boolean;
  /** Le feedback IA (notation de la justification, débrief personnalisé) est-il ouvert ? */
  ai: boolean;
  /** L'export du relevé de notes (tableur) et la vue détaillée sont-ils ouverts ? */
  gradebookExport: boolean;
}

/**
 * Palier gratuit PAR DÉFAUT : tout ouvert.
 *
 * Choix de déploiement : le freemium est ÉTEINT tant que l'administrateur ne
 * l'allume pas depuis /admin. Sans config (première mise en ligne, ou incident
 * de lecture), l'accès reste complet — on ne coupe donc jamais un pilote ni un
 * établissement existant au moment du déploiement. L'admin resserre ensuite
 * (ex. 3 tours, concours fermés) pour poser le mur. Un exemple de palier
 * commercial figure dans l'étude de marché.
 */
export const DEFAULT_FREE_TIER: FreeTier = {
  maxRounds: null,
  competitions: true,
  ai: true,
  gradebookExport: true,
};

/** Ce qu'ouvre une licence en cours : tout, sans borne. */
export interface Entitlements extends FreeTier {
  /** "full" = licence active ; "free" = palier gratuit. */
  plan: "full" | "free";
}

export const FULL_ENTITLEMENTS: Entitlements = {
  plan: "full",
  maxRounds: null,
  competitions: true,
  ai: true,
  gradebookExport: true,
};
