import type { EngineScenarioConfig } from "@/engine/types";
import {
  applyPeriodicity,
  PERIODICITY_DAYS,
  periodicityFromRoundDays,
  type Periodicity,
} from "@/config/scenarios/periodicity";
import { rendreTexte } from "@/config/scenarios/situation-texte";
import type { CourrierDef } from "./types";

/**
 * LE TEXTE D'UN COURRIER SE REND À LA DURÉE DU TOUR DE SA PARTIE.
 *
 * Les courriers étaient écrits au trimestre, comme les situations : « pour les
 * deux prochains trimestres », « Aucun effet sur ce trimestre », et, pour les
 * commandes d'office, « +500 unités (échelle trimestre) ». Or le moteur met ces
 * commandes à la durée du tour (`applyPeriodicity` : les modificateurs `order`
 * et `order_subcontract` × jours / 90, dans l'instantané que tirage et
 * distribution lisent). Une partie au mois recevait donc 167 enceintes d'une
 * lettre qui en promettait 500.
 *
 * LE MÊME MÉCANISME QUE LES SITUATIONS (`config/scenarios/situation-texte.ts`),
 * et non un second : des jetons dans les chaînes, rendus par `rendreTexte`.
 * Les mots de durée s'écrivent tels qu'au trimestre (`{{trimestres}}`) ; une
 * quantité que le scénario porte se lit par sa grandeur
 * (`{{entier: commande_tight_order}}`, `{{lettres: …}}` quand la lettre l'écrit
 * en toutes lettres) ; un chiffre du seul récit passe par `flux(…)`. Le nombre
 * de tours d'un effet (« pendant 2 tours ») ne bouge pas au trimestre ni à l'année ;
 * au mois, sur le calendrier, un événement dure le temps réel et l'effet se dit en
 * mois (« pendant 6 mois », `enTempsReel`).
 *
 * D'OÙ SE LISENT LES QUANTITÉS. Du scénario de la liasse, mis à la durée du tour
 * par `applyPeriodicity` : la règle du moteur, pas une copie. Le monde variable,
 * la taille de la classe et le niveau ne touchent pas aux modificateurs d'un
 * événement : ce sont exactement les unités de l'instantané (garde :
 * tests/scenarios/textes-a-la-duree-courriers.test.ts).
 *
 * LES LISTES GARDENT LE TEXTE AU TRIMESTRE. `courriersAuTrimestre` rend les
 * sources une fois, au chargement, aux trois durées (un jeton fautif lève à
 * l'import), et c'est le rendu trimestriel que portent `COURRIERS`,
 * `courrierParCode`, la routine et les réponses. Un chemin sans partie (la liasse
 * imprimée sans durée, les tests de forme) lit donc le texte d'hier ; un chemin
 * qui a une partie passe par `courrierALaDuree`, ou par `courrierDeLaPartie`
 * (`./de-la-partie.ts`) qui y ajoute la variante sans assurance.
 */

/** Les champs qu'on lit d'un courrier : ceux que le jeton peut porter. */
export const CHAMPS_DU_COURRIER = ["expediteur", "objet", "corps", "signataire", "effet", "enJeu"] as const;

/** Tous les textes d'un courrier, à plat, dans l'ordre des champs. */
export const textesDuCourrier = (c: CourrierDef): string[] => CHAMPS_DU_COURRIER.map((k) => c[k]);

/** Le courrier, ses jetons rendus pour ce scénario (déjà mis à la durée du tour). */
export function rendreCourrier(c: CourrierDef, scenario: EngineScenarioConfig): CourrierDef {
  const r = (t: string) => rendreTexte(t, scenario);
  return {
    ...c,
    expediteur: r(c.expediteur),
    objet: r(c.objet),
    corps: r(c.corps),
    signataire: r(c.signataire),
    effet: r(c.effet),
    enJeu: r(c.enJeu),
  };
}

interface Rendus {
  source: CourrierDef;
  parDuree: Record<Periodicity, CourrierDef>;
}

/** Le rendu au trimestre que portent les listes → sa source et ses rendus à chaque durée. */
const RENDUS = new WeakMap<CourrierDef, Rendus>();

// Une durée d'effet en tours (« pendant 2 tours ») se rend aussi : au mois, elle se dit
// en mois de temps réel (`enTempsReel`, config/scenarios/calendrier-mensuel.ts).
const aJetons = (c: CourrierDef) => textesDuCourrier(c).some((t) => t.includes("{{") || /\bpendant \d+ tours?\b/.test(t));

function retenir(source: CourrierDef, parDuree: Record<Periodicity, CourrierDef>): CourrierDef {
  RENDUS.set(parDuree.quarter, { source, parDuree });
  return parDuree.quarter;
}

/**
 * Les courriers d'une liasse, rendus au trimestre pour les listes. Les trois
 * durées sont rendues dès le chargement, avec le scénario de la liasse. Un
 * courrier sans jeton est rendu tel quel, même objet.
 */
export function courriersAuTrimestre(sources: CourrierDef[], scenario: EngineScenarioConfig): CourrierDef[] {
  const parDuree = {
    month: applyPeriodicity(scenario, "month"),
    quarter: applyPeriodicity(scenario, "quarter"),
    year: applyPeriodicity(scenario, "year"),
  };
  return sources.map((source) =>
    aJetons(source)
      ? retenir(source, {
          month: rendreCourrier(source, parDuree.month),
          quarter: rendreCourrier(source, parDuree.quarter),
          year: rendreCourrier(source, parDuree.year),
        })
      : source,
  );
}

/** Un scénario qui ne porte que la durée du tour : de quoi rendre des mots, et rien d'autre. */
const seulementLaDuree = (roundDays: number) => ({ roundDays }) as EngineScenarioConfig;

/**
 * Les courriers TRANSVERSES (routine, réponses aux décisions) : ils ne sont
 * d'aucun secteur, donc d'aucun scénario, et ne portent que des mots de durée.
 * Le scénario qui les rend ne porte que la durée du tour : une grandeur lue
 * dessus lèverait au chargement, et c'est voulu, puisqu'un montant n'a pas de
 * sens hors d'un secteur.
 */
export function courriersTransversesAuTrimestre(sources: CourrierDef[]): CourrierDef[] {
  const duree = (p: Periodicity) => seulementLaDuree(PERIODICITY_DAYS[p]);
  return sources.map((source) =>
    aJetons(source)
      ? retenir(source, {
          month: rendreCourrier(source, duree("month")),
          quarter: rendreCourrier(source, duree("quarter")),
          year: rendreCourrier(source, duree("year")),
        })
      : source,
  );
}

/**
 * Le courrier tel que SA partie le montre. `c` est celui des listes (rendu au
 * trimestre). Au trimestre, c'est le même objet : rien ne change, au bit près.
 * Absent (90 jours par défaut), c'est aussi le texte au trimestre.
 */
export function courrierALaDuree<T extends CourrierDef | undefined>(c: T, roundDays: number = PERIODICITY_DAYS.quarter): T {
  if (!c) return c;
  const rendus = RENDUS.get(c);
  if (!rendus) return c;
  return rendus.parDuree[periodicityFromRoundDays(roundDays)] as T;
}

/** La source à jetons d'un courrier des listes ; le courrier lui-même s'il n'en a pas. */
export function sourceDuCourrier(c: CourrierDef): CourrierDef {
  return RENDUS.get(c)?.source ?? c;
}

/**
 * Une phrase de l'écran du courrier (« Rien qui engage {{ce trimestre}} »),
 * ses mots de durée rendus à la durée du tour. Aucun montant : la phrase n'est
 * d'aucun secteur.
 */
export function phraseALaDuree(texte: string, roundDays: number = PERIODICITY_DAYS.quarter): string {
  return rendreTexte(texte, seulementLaDuree(roundDays));
}
