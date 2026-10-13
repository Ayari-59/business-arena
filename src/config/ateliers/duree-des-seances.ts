import type { AtelierDefinition, AtelierPhase, AtelierSeance } from "./types";
import {
  DIFFICULTY_PRESETS,
  LEGACY_PRESET,
  QUIZ_MODES,
  type DifficultyPreset,
} from "../difficulty";
import { scenarioByCode } from "../scenarios/registry";
import {
  champsOuverts,
  dureeDuTour,
  signesDeCadrage,
  signesDeSituation,
  type DureeDuTour,
} from "../duree-du-tour";

/**
 * CE QUE CHAQUE SÉANCE LAISSE AU TOUR QU'ELLE JOUE.
 *
 * Un déroulé promet un tour par séance, et donne à ce tour une ou deux phases
 * sur six. Le modèle de durée (config/duree-du-tour) sait, lui, ce que le tour
 * demande à une équipe : le texte à lire, les champs à remplir, la situation à
 * analyser, la prise en main au premier tour. Les deux chiffres n'avaient
 * jamais été mis en face l'un de l'autre : une séance pouvait donner vingt
 * minutes à un tour que le modèle estime à vingt-cinq, et personne ne le voyait
 * avant la classe.
 *
 * CE MODULE LES CONFRONTE, séance par séance, et c'est lui que la fiche
 * affiche (« Le tour demande ≈ N min ») et que la garde de tests/pedagogy lit.
 * Il ne mesure rien : il applique le modèle, avec ses ordres de grandeur
 * assumés, aux réglages de l'atelier.
 */

/**
 * LA PHASE QUI JOUE LE TOUR.
 *
 * Une phase est une phase de jeu quand son titre annonce la décision du tour
 * (« Décisions du trimestre », « Décider le tour 2 », « Premier arbitrage et
 * décisions », « On décide ») ou que son détail dit que l'équipe saisit ou
 * valide. Un titre qui pose une alternative (« Décision ou marché »,
 * « Investir ou tenir ») est une phase d'analyse : on y pèse, on n'y saisit
 * pas. Et une clôture, un débriefing, une relecture ne jouent rien, même quand
 * leur détail cite la saisie qui les a précédés.
 */
const TITRE_DE_JEU =
  /^(décid|décisions?\b|on (décide|commande|fixe)|le premier (prix|arbitrage)|la décision du|premier arbitrage|premières décisions|comité et décisions|communication et saisie|(deuxième|troisième) décision|le dernier (tour|mois|arbitrage))|et (décisions|saisie)$/i;
const DETAIL_DE_JEU = /\bsaisi(t|ssent)\b|puis valide|jouent le tour/i;
const TITRE_SANS_JEU = /^(clôture|débriefing|retour|relecture|préparation|on en parle|ce que dit|récupérer)|\bou\b/i;

export function estPhaseDeJeu(p: Pick<AtelierPhase, "titre" | "detail">): boolean {
  if (TITRE_SANS_JEU.test(p.titre)) return false;
  return TITRE_DE_JEU.test(p.titre) || DETAIL_DE_JEU.test(p.detail);
}

/** Les minutes que le déroulé donne réellement à la saisie des décisions. */
export function minutesDeJeu(s: Pick<AtelierSeance, "deroule">): number {
  return s.deroule.filter(estPhaseDeJeu).reduce((t, p) => t + p.minutes, 0);
}

/** Le préréglage que la partie de l'atelier applique : un concours joue le repli. */
export function presetDeLAtelier(a: Pick<AtelierDefinition, "reglages">): DifficultyPreset {
  if (a.reglages.concours) return LEGACY_PRESET;
  return DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau) ?? LEGACY_PRESET;
}

/** Les questions sont-elles posées dans la partie de l'atelier ? Lu dans le mode, jamais deviné. */
export function avecQuestions(a: Pick<AtelierDefinition, "reglages">): boolean {
  const sans = QUIZ_MODES.find((m) => m.code === "off")!.name;
  return a.reglages.quizMode !== sans;
}

/**
 * LE TOUR DU SCÉNARIO QUE LA SÉANCE FAIT JOUER. Le tour annoncé, d'ordinaire ;
 * pour une séance d'essai, le premier : l'essai rejoue le début du scénario
 * avec ses écrans et sa situation du tour 1, sans ses événements scriptés
 * (config/tour-d-essai, `scenarioDEssai`), et demande donc à l'équipe ce
 * qu'un premier tour demande. Null quand la séance ne joue rien.
 */
export function tourEstime(s: Pick<AtelierSeance, "tourJoue" | "essai">): number | null {
  if (s.essai) return 1;
  return s.tourJoue;
}

/**
 * Ce que le tour joué par cette séance demande à une équipe de cet atelier :
 * le scénario de la fiche, le niveau de la fiche, la situation du tour, et la
 * prise en main si c'est le premier tour que l'atelier fait jouer, essai
 * compris : une classe qui a pris l'arène en main pendant l'essai ne la
 * reprend pas au tour 1. Null quand la séance ne joue aucun tour.
 */
export function estimationDuTour(
  a: Pick<AtelierDefinition, "reglages" | "seances">,
  s: Pick<AtelierSeance, "tourJoue" | "essai">,
  options: { scenarioCode?: string; preset?: DifficultyPreset } = {},
): DureeDuTour | null {
  const tour = tourEstime(s);
  if (tour === null) return null;
  const def = scenarioByCode(options.scenarioCode ?? a.reglages.scenarioCode);
  const preset = options.preset ?? presetDeLAtelier(a);
  const avecEssai = a.seances.some((x) => x.essai);
  const premierJoue = a.seances.find((x) => x.tourJoue !== null)?.tourJoue ?? 1;
  const premierTour = s.essai ? true : !avecEssai && s.tourJoue === premierJoue;
  return dureeDuTour({
    signesDeCadrage: signesDeCadrage(def),
    signesDeSituation: signesDeSituation(def.situations, tour),
    champs: champsOuverts(preset.decisions),
    premierTour,
    avecQuiz: avecQuestions(a),
  });
}

/**
 * LA MARGE CONSEILLÉE : un quart au-dessus de l'estimation.
 *
 * Le modèle compte une lecture lente et trente secondes par champ ; il ne
 * compte ni la discussion à trois autour de l'écran, ni la note que les
 * déroulés demandent presque tous d'écrire avant de valider. Un quart de plus
 * est ce qui sépare une phase qui tient d'une phase qu'on finit en débordant
 * sur la clôture.
 */
export const MARGE_CONSEILLEE = 1.25;

export type Verdict = "juste" | "serree" | "impossible";

export interface ChargeDeLaSeance {
  seance: AtelierSeance;
  estimation: DureeDuTour;
  minutesDeJeu: number;
  verdict: Verdict;
}

export function verdict(estimation: number, jeu: number): Verdict {
  if (jeu >= estimation * MARGE_CONSEILLEE) return "juste";
  if (jeu >= estimation) return "serree";
  return "impossible";
}

/** Les séances qui jouent un tour, l'essai compris, avec l'estimation, les minutes de jeu et le verdict. */
export function chargeDesSeances(a: AtelierDefinition): ChargeDeLaSeance[] {
  const lignes: ChargeDeLaSeance[] = [];
  for (const seance of a.seances) {
    const estimation = estimationDuTour(a, seance);
    if (!estimation) continue;
    const jeu = minutesDeJeu(seance);
    lignes.push({ seance, estimation, minutesDeJeu: jeu, verdict: verdict(estimation.minutes, jeu) });
  }
  return lignes;
}

/**
 * LE DÉCOUPAGE D'UNE SÉANCE EN CRÉNEAUX PLUS COURTS.
 *
 * Un atelier écrit en séances de trois heures se joue aussi dans des créneaux
 * de deux heures, ceux d'une séance de travaux dirigés en section de
 * technicien. Plutôt que d'écrire une seconde fiche, on coupe la première : on
 * remplit les créneaux dans l'ordre des phases, et on passe au suivant dès que
 * la prochaine ne tient plus. Une seule règle : la phase qui joue le tour et
 * la clôture qui la suit restent ensemble, parce qu'une équipe qui saisit ses
 * décisions doit voir ses résultats dans le même créneau.
 *
 * Null quand une phase, ou un bloc de jeu et sa clôture, dépasse à lui seul le
 * créneau : la séance ne se coupe pas, elle se réécrit.
 */
export interface Creneau {
  phases: AtelierPhase[];
  minutes: number;
}

export function decoupageEnCreneaux(
  s: Pick<AtelierSeance, "deroule">,
  creneauMinutes: number,
): Creneau[] | null {
  const blocs: AtelierPhase[][] = [];
  for (let i = 0; i < s.deroule.length; i++) {
    const phase = s.deroule[i]!;
    const suivante = s.deroule[i + 1];
    if (estPhaseDeJeu(phase) && suivante && /^clôture/i.test(suivante.titre)) {
      blocs.push([phase, suivante]);
      i += 1;
    } else {
      blocs.push([phase]);
    }
  }
  const creneaux: Creneau[] = [];
  let courant: Creneau = { phases: [], minutes: 0 };
  for (const bloc of blocs) {
    const minutes = bloc.reduce((t, p) => t + p.minutes, 0);
    if (minutes > creneauMinutes) return null;
    if (courant.minutes + minutes > creneauMinutes) {
      creneaux.push(courant);
      courant = { phases: [], minutes: 0 };
    }
    courant.phases.push(...bloc);
    courant.minutes += minutes;
  }
  if (courant.phases.length > 0) creneaux.push(courant);
  return creneaux;
}
