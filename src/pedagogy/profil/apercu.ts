/**
 * L'APERÇU DU PROFIL D'UNE DÉMONSTRATION : les axes du profil décisionnel,
 * calculés sur la seule partie qui vient de finir.
 *
 * Décision du propriétaire (octobre 2026) : une démonstration se joue en
 * Découverte, sans licence, et la Découverte ne compte pas dans le profil
 * (`trierLesParties`). Le visiteur voit donc, à la fin de la partie, ce que son
 * profil dirait de cet épisode : le score de chaque compétence observée, sa
 * preuve, la robustesse de ses choix et sa prise de risque. Les mêmes calculs
 * que le profil (`parEpisode`, `preuve`, `robustesseDesDecisions`,
 * `risqueDesDecisions`), sur un seul épisode.
 *
 * Tout est pur et se calcule dans le navigateur : l'aperçu ne s'enregistre
 * nulle part. Un seul épisode ne donne ni intervalle, ni niveau de confiance,
 * ni progression : l'aperçu le dit au lieu de les inventer.
 */
import { COMPETENCES, type Competence } from "@/config/episodes/competences";
import type { Episode, PartieJouee } from "@/config/episodes/types";
import { observer } from "./observations";
import {
  parEpisode,
  preuve,
  risqueDesDecisions,
  robustesseDesDecisions,
  type Profil,
} from "./profil";

export interface LigneDeLApercu {
  competence: Competence;
  /** Sur 100, sur cet épisode seul ; `null` pour une compétence que le profil ne note pas. */
  score: number | null;
  points: number;
  preuve: string;
}

export interface ApercuDuProfil {
  /** Les compétences que l'épisode a observées, la plus observée d'abord. */
  competences: readonly LigneDeLApercu[];
  robustesse: Profil["robustesse"];
  risque: Profil["risque"];
}

export function apercuDuProfil(ep: Episode, partie: PartieJouee): ApercuDuProfil {
  const { mesures, observations } = observer(ep, partie);
  const competences = COMPETENCES.map((competence): LigneDeLApercu | null => {
    const os = observations.filter((o) => o.competence === competence.code);
    if (os.length === 0) return null;
    const [seul] = parEpisode(os);
    return {
      competence,
      score: competence.score && seul ? Math.round(seul.score * 100) : null,
      points: os.reduce((s, o) => s + o.poids, 0),
      preuve: preuve(competence.code, os),
    };
  })
    .filter((l): l is LigneDeLApercu => l !== null)
    .sort((a, b) => b.points - a.points || a.competence.code.localeCompare(b.competence.code));
  const decisions = mesures.decisions.map((m) => ({ m, numero: ep.numero, ep }));
  return {
    competences,
    robustesse: robustesseDesDecisions(decisions),
    risque: risqueDesDecisions(decisions),
  };
}

/** La mention de l'aperçu, sous ses lignes : ce qu'une licence change. */
export const MENTION_DE_L_APERCU = "Avec une licence, chaque épisode enrichit votre profil.";
