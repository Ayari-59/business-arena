import { DEFAULT_RSE_CONFIG, financingTrustBonus } from "../rse";
import type { CompanyState, EngineScenarioConfig } from "../types";

/**
 * LE DOSSIER BANCAIRE
 *
 * Ce que la banque consent — plafond de découvert et taux — suit une CONFIANCE.
 * Elle joue sur le découvert seul, jamais sur un emprunt déjà accordé : le
 * découvert est un concours révocable, la banque peut le réduire et le
 * renchérir ; un prêt en cours, non.
 *
 * CE QUE LA BANQUE LIT : LA TENUE DE LA TRÉSORERIE.
 *
 * La confiance se nourrissait autrefois de l'écart entre un plan de trésorerie
 * déposé et le réalisé. L'arène ne demande plus ce plan, et la confiance
 * s'était figée au plein : une équipe pouvait finir trois tours en cessation
 * de paiements sans que sa banque en retienne rien. C'est l'inverse de ce que
 * les cartes du jeu promettent — « la confiance bancaire se gagne sur des
 * trimestres de gestion saine » — et de ce qu'une banque fait.
 *
 * Elle lit donc maintenant ce que l'équipe a fait de son cash, tour après
 * tour : un tour clos en crise de trésorerie ou passé par l'affacturage forcé
 * la fait DESCENDRE sous le plein, des tours sains la REGAGNENT. Le plan, s'il
 * arrive par une autre voie, reste jugé (`fiabiliteDuPlan`) ; c'est alors le
 * pire des deux jugements qui compte.
 *
 * TROIS GARDE-FOUS, PARCE QUE LA SANCTION EST UNE SPIRALE. Un plafond plus bas
 * rapproche l'affacturage forcé, qui rabaisse la confiance, qui rabaisse le
 * plafond. Sans frein, une équipe serait punie d'être en difficulté, et
 * renfoncée par la punition — précisément le cul-de-sac que la chaîne de
 * sauvetage (apport, emprunt, subvention) a été construite pour supprimer.
 *  · la baisse est BORNÉE par tour (`BAISSE_MAX_PAR_TOUR`) : pas de chute
 *    brutale sur un seul mauvais trimestre ;
 *  · elle s'arrête à un PLANCHER (`CONFIANCE_PLANCHER`) : la banque se méfie,
 *    elle ne ferme pas ;
 *  · elle REMONTE dès que les tours redeviennent sains, sinon une erreur du
 *    tour 2 pèserait encore au tour 8.
 *
 * Au-dessus du plein, le standing RSE ajoute une prime verte (`confianceServie`).
 * C'est pourquoi la confiance n'est pas bornée à 1 : une entreprise sans
 * engagement obtient le plafond nominal du scénario, un standing établi obtient
 * mieux. C'est le sens du financement vert, et ce que l'atelier DCG-RSE demande
 * de constater.
 */

const CONFIANCE_PLEINE = 1;

/**
 * Jusqu'où la prime verte peut porter la confiance au-dessus du plein. Ce
 * n'est pas elle qui dose l'effet — c'est le coefficient RSE du scénario, dont
 * `financingTrustBonus` est l'asymptote — mais un garde-fou dur, pour qu'aucun
 * appelant ne puisse transformer le découvert en ligne de crédit illimitée.
 */
const CONFIANCE_MAX = 1.25;

/**
 * Sous quoi la confiance acquise ne descend jamais par la seule tenue de la
 * trésorerie. À 0,5 et avec les réglages usuels (part minimale 0,4), la
 * banque consent encore 70 % du plafond nominal : elle serre, elle ne coupe
 * pas. Une confiance déjà plus basse (héritée, forgée) n'est pas relevée —
 * elle cesse simplement de baisser.
 */
export const CONFIANCE_PLANCHER = 0.5;

/** Le plus grand pas de baisse en un tour, quel que soit le jugement. */
export const BAISSE_MAX_PAR_TOUR = 0.15;

function borne(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

/** Confiance portée par une entreprise qui n'a encore rien promis. */
export function confianceInitiale(state: { bankTrust?: number }): number {
  return state.bankTrust ?? CONFIANCE_PLEINE;
}

/**
 * Fiabilité du plan d'un tour, entre 0 (à côté de la plaque) et 1 (annoncé
 * juste). `null` quand aucun plan n'a été déposé : la banque n'a alors rien à
 * juger, et la confiance reste où elle est.
 *
 * Chaque ligne annoncée donne un écart relatif, ramené à une échelle qui ne
 * s'effondre pas quand la prévision approche zéro : sans ce garde-fou,
 * annoncer une trésorerie nulle et finir à 200 € d'écart vaudrait une erreur
 * infinie.
 */
export function fiabiliteDuPlan(input: {
  expectedUnits?: number;
  expectedCash?: number;
  soldUnits: number;
  netTreasury: number;
  /** Ordre de grandeur du tour (charges de structure) : le plancher d'échelle. */
  cashScale: number;
}): number | null {
  const ecarts: number[] = [];
  if (input.expectedUnits !== undefined) {
    const echelle = Math.max(Math.abs(input.expectedUnits), Math.abs(input.soldUnits), 1);
    ecarts.push(borne(Math.abs(input.soldUnits - input.expectedUnits) / echelle, 0, 1));
  }
  if (input.expectedCash !== undefined) {
    const echelle = Math.max(
      Math.abs(input.expectedCash),
      Math.abs(input.netTreasury),
      Math.abs(input.cashScale),
      1,
    );
    ecarts.push(borne(Math.abs(input.netTreasury - input.expectedCash) / echelle, 0, 1));
  }
  if (ecarts.length === 0) return null;
  return 1 - ecarts.reduce((somme, e) => somme + e, 0) / ecarts.length;
}

/**
 * Ce que la banque lit dans la trésorerie du tour, entre 0 (cessation de
 * paiements) et 1 (tenue). L'affacturage forcé est entre les deux : la banque
 * a dû intervenir, mais son intervention a suffi.
 */
export function tenueDeTresorerie(treasury: { crisis: boolean; forcedFactored: number }): number {
  if (treasury.crisis) return 0;
  if (treasury.forcedFactored > 0) return 0.75;
  return 1;
}

/**
 * Le jugement du tour : la tenue de la trésorerie, et, si un plan a été
 * déposé, sa fiabilité — le pire des deux. Une trésorerie tenue n'excuse pas
 * un plan délirant, un plan juste n'excuse pas une cessation de paiements.
 */
export function jugementDeLaBanque(input: { tenue: number; fiabilite: number | null }): number {
  return input.fiabilite === null ? input.tenue : Math.min(input.tenue, input.fiabilite);
}

/**
 * Confiance du tour suivant. Lissage exponentiel : la banque a de la mémoire,
 * un bon trimestre n'efface pas trois mauvais, et un mauvais ne condamne pas.
 * `null` : rien à juger, la confiance reste où elle est.
 *
 * Les garde-fous s'appliquent ici, et non à une source en particulier : c'est
 * la banque qui est freinée, quel que soit ce qu'elle a lu. Trajectoire
 * usuelle (mémoire 0,6) d'une équipe qui enchaîne les crises :
 * 1 → 0,85 → 0,70 → 0,55 → 0,50, puis plancher. Et qui se redresse :
 * 0,50 → 0,70 → 0,82 → 0,89 → …, sans jamais dépasser le plein.
 */
export function confianceSuivante(
  avant: number,
  jugement: number | null,
  bank: NonNullable<EngineScenarioConfig["finance"]["bank"]>,
): number {
  if (jugement === null) return avant;
  const cible = bank.memory * avant + (1 - bank.memory) * jugement;
  const plusBas = Math.max(Math.min(avant, CONFIANCE_PLANCHER), avant - BAISSE_MAX_PAR_TOUR);
  return borne(cible, plusBas, CONFIANCE_PLEINE);
}

/**
 * Conditions consenties pour le tour, à confiance donnée. Le plafond se
 * resserre et le taux monte à mesure que la confiance tombe ; un plafond plus
 * bas rapproche l'affacturage forcé, qui est la vraie sanction. Au-dessus du
 * plein — la prime verte, seule à y mener —, la pente est la même : le plafond
 * s'élargit et le taux cède, du même pas qu'ils se resserraient.
 */
export function conditionsBancaires(
  confiance: number,
  base: { overdraftLimit: number; overdraftAnnualRate: number },
  bank: NonNullable<EngineScenarioConfig["finance"]["bank"]>,
): { overdraftLimit: number; overdraftAnnualRate: number } {
  const c = borne(confiance, 0, CONFIANCE_MAX);
  return {
    overdraftLimit: base.overdraftLimit * (bank.minOverdraftShare + (1 - bank.minOverdraftShare) * c),
    overdraftAnnualRate: base.overdraftAnnualRate + bank.maxOverdraftSpread * (1 - c),
  };
}

/**
 * Un plan de trésorerie accompagne-t-il ces décisions ? C'est la ligne de
 * trésorerie qui compte : annoncer des ventes n'est pas présenter un plan de
 * financement, et c'est le second que la banque exige.
 */
export function planDepose(forecast?: { expectedCash?: number }): boolean {
  return forecast?.expectedCash !== undefined;
}

/**
 * LA CONFIANCE RÉELLEMENT SERVIE À LA BANQUE : celle acquise, plus la prime
 * verte que vaut le standing RSE.
 *
 * Elle est ici et nulle part ailleurs, parce que trois endroits en ont besoin —
 * le moteur qui applique les conditions, la vue qui les ANNONCE au formulaire,
 * et le panneau de trésorerie qui redit le plafond. Calculée trois fois, elle
 * finirait par diverger, et l'élève lirait un découvert que la banque
 * n'applique pas. C'est exactement la faute qu'on a déjà payée une fois.
 */
export function confianceServie(
  state: Pick<CompanyState, "bankTrust" | "rseImageCapital">,
  scenario: Pick<EngineScenarioConfig, "rse">,
): number {
  const acquise = confianceInitiale(state);
  const prime = financingTrustBonus(
    state.rseImageCapital ?? 0,
    (scenario.rse ?? DEFAULT_RSE_CONFIG).financingTrustBonus,
  );
  return acquise + prime;
}
