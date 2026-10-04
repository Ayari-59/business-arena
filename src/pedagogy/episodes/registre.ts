/**
 * LES ÉPISODES MANAGER, dans l'ordre où on les propose.
 *
 * Un épisode s'ajoute ici et nulle part ailleurs : la liste, la page de jeu,
 * le tableau de bord, la courbe et le bilan le lisent de ce registre.
 */
import type { Episode } from "@/config/episodes/types";
import { EPISODE_TRIMESTRE } from "./trimestre-qui-derape";
import { EPISODE_EQUIPE } from "./equipe-qui-s-epuise";

export const EPISODES: readonly Episode[] = [EPISODE_TRIMESTRE, EPISODE_EQUIPE];

export const episodeParCode = (code: string): Episode | undefined =>
  EPISODES.find((e) => e.code === code);
