import { premierNiveauQuiOuvre, presetFromProfile } from "@/config/difficulty";

/**
 * CE QUI FAIT REPARTIR UNE ENTREPRISE DÉFAILLANTE, DIT UNE SEULE FOIS.
 *
 * Le bandeau de l'enseignant promettait « une augmentation de capital qui
 * ramène le découvert sous le plafond » à tous les niveaux, alors que l'apport
 * des associés ne s'ouvre qu'au niveau qui ouvre le financement. Au même
 * instant, le bandeau de l'élève disait l'inverse. L'enseignant donnait donc
 * devant la classe une consigne impossible.
 *
 * Le remède dépend de deux faits de la partie, et de rien d'autre :
 *
 *  · le niveau ouvre-t-il le financement ? Alors un apport des associés fait
 *    repartir l'entreprise, et, leur enveloppe épuisée, une subvention ;
 *  · y a-t-il un animateur pour accorder une subvention ? Pas en solo.
 *
 * Les deux bandeaux lisent ce module : ils ne peuvent plus se contredire.
 */
export interface CadreDeLaDefaillance {
  /** Le niveau ouvre-t-il l'emprunt et l'apport des associés ? */
  financementOuvert: boolean;
  /** Le niveau qui ouvre le financement, pour le dire ; `null` si aucun. */
  niveauDuFinancement: number | null;
  /** Un animateur peut-il accorder une subvention ? Non en solo. */
  avecAnimateur: boolean;
  /** Tours de cessation de paiements consécutifs avant la défaillance. */
  toursAvantDefaillance: number;
}

/** Le cadre d'une partie, lu de son profil et du scénario figé. */
export function cadreDeLaDefaillance(game: {
  difficultyProfile: unknown;
  scenarioSnapshot: unknown;
}): CadreDeLaDefaillance {
  const preset = presetFromProfile(game.difficultyProfile);
  const kind = (game.difficultyProfile as { kind?: string } | null)?.kind ?? "solo";
  const finance = (game.scenarioSnapshot as { finance?: { crisisRoundsBeforeFailure?: number } })
    ?.finance;
  return {
    financementOuvert: preset.decisions.finance,
    niveauDuFinancement: premierNiveauQuiOuvre("finance", undefined, preset.level),
    avecAnimateur: kind !== "solo",
    toursAvantDefaillance: finance?.crisisRoundsBeforeFailure ?? 2,
  };
}

/**
 * LE REMÈDE, en une phrase. `lecteur` ne change que la manière de nommer
 * l'animateur : « votre animateur » pour l'équipe, « vous » pour lui.
 */
export function remedeALaDefaillance(
  cadre: Pick<CadreDeLaDefaillance, "financementOuvert" | "niveauDuFinancement" | "avecAnimateur">,
  lecteur: "equipe" | "animateur",
): string {
  const subvention =
    lecteur === "equipe"
      ? "une subvention exceptionnelle, accordée par votre animateur"
      : "une subvention exceptionnelle, que vous accordez sur sa demande";
  if (cadre.financementOuvert) {
    return cadre.avecAnimateur
      ? "Un apport des associés qui ramène le découvert sous le plafond fait repartir " +
          `l'entreprise ; leur enveloppe épuisée, il reste ${subvention}.`
      : "Un apport des associés qui ramène le découvert sous le plafond fait repartir " +
          "l'entreprise ; leur enveloppe épuisée, elle reste à l'arrêt jusqu'à la fin de la partie.";
  }
  const ouverture = cadre.niveauDuFinancement
    ? ` (ils s'ouvrent au niveau ${cadre.niveauDuFinancement})`
    : "";
  return cadre.avecAnimateur
    ? `À ce niveau, ni emprunt ni apport des associés ne se décident${ouverture} : ` +
        `seule ${subvention} peut remettre en marche l'entreprise.`
    : `À ce niveau, ni emprunt ni apport des associés ne se décident${ouverture} : ` +
        "l'entreprise reste à l'arrêt jusqu'à la fin de la partie.";
}

/** Le constat, en tête des deux bandeaux : combien de tours, et ce que cela gèle. */
export function constatDeLaDefaillance(toursAvantDefaillance: number): string {
  const tours =
    toursAvantDefaillance <= 1
      ? "Un tour de cessation de paiements"
      : `${toursAvantDefaillance} tours consécutifs de cessation de paiements`;
  return `${tours} : l'activité est gelée (ni production, ni charges).`;
}
