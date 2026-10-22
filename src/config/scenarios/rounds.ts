import type { EngineScenarioConfig, SegmentConfig } from "../../engine/types";
import { toGamme } from "../../engine/gamme";
import type { Periodicity } from "./periodicity";
import { MOIS_MAX, MOIS_PAR_DEFAUT } from "./calendrier-mensuel";

/**
 * Le nombre de tours d'une partie.
 *
 * Il venait du scénario et de lui seul : toute partie durait six trimestres,
 * quoi que l'enseignant ait prévu. Un atelier de cinq séances dont la dernière
 * rend compte ne joue que quatre tours, et la partie restait ouverte sur deux
 * tours que personne ne jouerait jamais. Le classement final ne tombait pas, le
 * relevé restait incomplet, et la fiche annonçait un nombre de tours qui n'était
 * ni celui de la partie ni celui des séances.
 *
 * Une partie peut donc être raccourcie à la création. Elle peut aussi être
 * allongée, au trimestre seulement (décision du propriétaire) : les situations et
 * les événements scriptés d'un scénario sont écrits pour ses `roundsCount` tours,
 * au-delà la classe joue des TOURS DE GESTION, sur l'année du métier qui se répète
 * (`prolongerLaPartie`). Au mois, elle suit le calendrier (`calendrier-mensuel.ts`) :
 * une année par défaut, dix-huit mois au plus. À l'année, une partie ne s'allonge pas :
 * douze ans dépasseraient les prêts.
 * Sans demande, la partie garde la durée de son scénario : les tournois, la
 * démonstration et « toute la partie » ne changent pas.
 */

/** Le plus long qu'une partie au trimestre puisse durer : trois ans. */
export const TOURS_MAX_AU_TRIMESTRE = 12;

/**
 * Le plus long qu'une partie de ce scénario puisse durer à cette périodicité. Au mois sur
 * le calendrier (`calendrier-mensuel.ts`), en mois ; au mois d'avant le calendrier et à
 * l'année, la durée du scénario.
 */
export function toursMaxDeLaPartie(
  scenario: EngineScenarioConfig,
  periodicity: Periodicity,
  calendrierMensuel = false,
): number {
  if (periodicity === "quarter") return Math.max(scenario.roundsCount, TOURS_MAX_AU_TRIMESTRE);
  if (periodicity === "month" && calendrierMensuel) return MOIS_MAX;
  return scenario.roundsCount;
}

/**
 * Le nombre de tours retenu : jamais plus que le maximum de la périodicité, jamais
 * moins d'un ; sans demande, la durée du scénario (au mois sur le calendrier, une année).
 */
export function toursDeLaPartie(
  scenario: EngineScenarioConfig,
  demande: number | undefined,
  periodicity: Periodicity,
  calendrierMensuel = false,
): number {
  if (demande === undefined || !Number.isFinite(demande)) {
    return periodicity === "month" && calendrierMensuel ? MOIS_PAR_DEFAUT : scenario.roundsCount;
  }
  return Math.min(toursMaxDeLaPartie(scenario, periodicity, calendrierMensuel), Math.max(1, Math.trunc(demande)));
}

/**
 * LE NOMBRE DE TOURS QUE LA SAISONNALITÉ D'UN SCÉNARIO ÉCRIT : la longueur de son plus
 * court tableau (marché, segments, et en gamme chaque produit et ses segments).
 *
 * Un tableau se lit une valeur par tour (`engine/market/demand.ts`, `saisonDuTour`). Une
 * partie plus longue que lui se jouerait, au-delà, sur une saison inventée : la demande
 * retombait à 1 en silence, pendant que l'import du niveau 7 bouclait sur le début du
 * tableau. Allonger une partie, c'est d'abord écrire la saison des tours ajoutés.
 */
export function couvertureDeLaSaisonnalite(scenario: EngineScenarioConfig): number {
  const longueurs = [
    scenario.market.seasonality.length,
    ...scenario.market.segments.flatMap((g) => (g.seasonality ? [g.seasonality.length] : [])),
    ...(scenario.products ?? []).flatMap((p) => [
      ...(p.market.seasonality ? [p.market.seasonality.length] : []),
      ...p.market.segments.flatMap((g) => (g.seasonality ? [g.seasonality.length] : [])),
    ]),
  ];
  return Math.min(...longueurs);
}

/**
 * Une variante du scénario jouée sur un nombre de tours choisi.
 *
 * Plus courte que le scénario : seul `roundsCount` change, les tableaux restent tels
 * quels, et une partie de six tours ou moins est identique au bit près à ce qu'elle
 * était. Plus longue (au trimestre) : `prolongerLaPartie`.
 *
 * REFUSE, avec la raison, une partie plus longue que la saisonnalité de son scénario
 * quand elle ne peut pas être prolongée : c'est le seul endroit par où passe toute
 * création de partie (`composerLeScenarioJoue`), et refuser ici vaut mieux qu'une
 * saison silencieusement inventée sur les derniers tours.
 */
export function applyRoundsCount(
  scenario: EngineScenarioConfig,
  demande: number | undefined,
  periodicity: Periodicity,
): EngineScenarioConfig {
  const tours = toursDeLaPartie(scenario, demande, periodicity);
  const couverture = couvertureDeLaSaisonnalite(scenario);
  // Une partie prolongée répète l'année des derniers tours écrits : il faut qu'ils le soient.
  if (Math.min(tours, scenario.roundsCount) > couverture) {
    throw new Error(
      `Partie de ${tours} tours refusée : la saisonnalité du scénario « ${scenario.code} » n'en écrit que ${couverture}. ` +
        "Chaque tableau de saisonnalité doit porter une valeur par tour joué.",
    );
  }
  if (tours > scenario.roundsCount) return prolongerLaPartie(scenario, tours);
  if (tours === scenario.roundsCount) return scenario;
  return { ...scenario, roundsCount: tours };
}

/** Un trimestre par tour : l'année du métier revient tous les quatre tours. */
const TOURS_PAR_AN = 4;

/**
 * UNE SAISON PROLONGÉE au-delà des tours écrits : chaque tableau garde ses valeurs,
 * puis répète son année. Le tour qui suit le dernier tour écrit est le même trimestre
 * que le tour écrit quatre plus tôt (le tour 7 est un troisième trimestre, comme le
 * tour 3) ; l'année qui se répète est donc celle des quatre derniers tours écrits, qui
 * portent la dernière valeur connue de chaque trimestre.
 *
 * Un tableau dont les quatre derniers tours ne sont pas une année ordinaire (un compte
 * qui n'ouvre qu'au tour 3, et dont le tour 3 est un lancement) écrit l'année qui se
 * répète ensuite (`SegmentConfig.saisonDesAnneesSuivantes`, dans l'ordre des tours
 * qui suivent le dernier tour écrit).
 */
export function prolongerLaSaison(
  tableau: readonly number[],
  tours: number,
  anneeSuivante?: readonly number[],
): number[] {
  if (tableau.length >= tours) return [...tableau];
  if (tableau.length < TOURS_PAR_AN) {
    throw new Error(`Une saison de ${tableau.length} tours ne dit pas une année entière : elle ne se prolonge pas.`);
  }
  const annee = anneeSuivante ?? tableau.slice(tableau.length - TOURS_PAR_AN);
  if (annee.length !== TOURS_PAR_AN) {
    throw new Error(`L'année qui se répète compte ${TOURS_PAR_AN} trimestres, pas ${annee.length}.`);
  }
  return Array.from({ length: tours }, (_, i) =>
    i < tableau.length ? tableau[i]! : annee[(i - tableau.length) % TOURS_PAR_AN]!,
  );
}

/**
 * UNE PARTIE PLUS LONGUE QUE SON SCÉNARIO (au trimestre, `toursMaxDeLaPartie`).
 *
 * Trois choses changent, et elles seules :
 * - chaque tableau de saison répète l'année du métier (`prolongerLaSaison`), la
 *   saisonnalité de l'attrition comprise ;
 * - chaque marché arrête de croître au dernier tour écrit (`croissanceJusquAuTour`) :
 *   la croissance d'un scénario est calibrée pour ses tours (L'ESCALE en gamme y
 *   sature son parc vers le milieu de la partie), et la prolonger quintuplerait sa
 *   clientèle sur douze tours. Le marché arrive à maturité, la saison continue ;
 * - `roundsCount`.
 * Les situations et les événements scriptés restent ceux des tours écrits : au-delà, la
 * classe gère son entreprise, et les situations détectées comme les événements tirés au
 * sort continuent.
 */
export function prolongerLaPartie(scenario: EngineScenarioConfig, tours: number): EngineScenarioConfig {
  const ecrits = scenario.roundsCount;
  const segment = (g: SegmentConfig): SegmentConfig => {
    const { saisonDesAnneesSuivantes: annee, ...reste } = g;
    return {
      ...reste,
      ...(g.seasonality ? { seasonality: prolongerLaSaison(g.seasonality, tours, annee) } : {}),
      croissanceJusquAuTour: Math.min(g.croissanceJusquAuTour ?? ecrits, ecrits),
    };
  };
  return {
    ...scenario,
    roundsCount: tours,
    market: {
      ...scenario.market,
      seasonality: prolongerLaSaison(scenario.market.seasonality, tours),
      segments: scenario.market.segments.map(segment),
    },
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => ({
            ...p,
            market: {
              ...p.market,
              ...(p.market.seasonality ? { seasonality: prolongerLaSaison(p.market.seasonality, tours) } : {}),
              segments: p.market.segments.map(segment),
            },
          })),
        }
      : {}),
    ...(scenario.subscription?.churnSeasonality
      ? {
          subscription: {
            ...scenario.subscription,
            churnSeasonality: prolongerLaSaison(scenario.subscription.churnSeasonality, tours),
          },
        }
      : {}),
  };
}

/**
 * Le tour où la demande du secteur culmine.
 *
 * Un scénario n'est pas plat : sa dramaturgie tient dans un tour précis, celui
 * où le compte-clé passe sa commande, où les fêtes remplissent la boutique, où
 * la saison pleine remplit l'hôtel. Raccourcir une partie en deçà de ce tour ne
 * la raccourcit pas, elle la vide : la classe joue le creux et rentre chez elle
 * avant que le secteur n'ait rien montré.
 *
 * Le défaut a été trouvé par un enseignant sur l'animation de découverte, qui
 * jouait trois trimestres d'un secteur dont le marché double au quatrième. Il
 * était réplicable ailleurs : la règle qui raccourcit les parties de premier
 * semestre le recréait pour trois diplômes à la fois.
 */
export function tourDuPic(scenario: EngineScenarioConfig): number {
  // En gamme, la demande du secteur est celle de tous les marchés produits,
  // chacun avec sa saisonnalité ; en mono-produit, la gamme d'un produit est
  // le marché du scénario lui-même.
  const gamme = toGamme(scenario);
  const demandeParTour = Array.from({ length: scenario.roundsCount }, (_, r) =>
    gamme.reduce(
      (secteur, produit) =>
        secteur +
        produit.market.segments.reduce((total, segment) => {
          const saison = segment.seasonality?.[r] ?? 1;
          return total + segment.size * saison;
        }, 0) *
          (produit.market.seasonality?.[r] ?? 1),
      0,
    ),
  );
  return demandeParTour.indexOf(Math.max(...demandeParTour)) + 1;
}
