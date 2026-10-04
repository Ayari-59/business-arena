/**
 * LES ÉPISODES MANAGER, dans l'ordre où on les propose.
 *
 * Un épisode s'ajoute ici et nulle part ailleurs : la liste, la page de jeu,
 * le tableau de bord, la courbe et le bilan le lisent de ce registre.
 */
import type { Episode } from "@/config/episodes/types";
import { EPISODE_TRIMESTRE } from "./trimestre-qui-derape";
import { EPISODE_EQUIPE } from "./equipe-qui-s-epuise";
import { EPISODE_DEPOT } from "./depot-qui-deborde";
import { EPISODE_BUDGET } from "./budget-qui-ne-tient-pas";
import { EPISODE_PROJET } from "./projet-qui-glisse";
import { EPISODE_ACHATS } from "./fournisseur-qui-augmente";
import { EPISODE_RECRUTEMENT } from "./poste-qui-reste-vide";
import { EPISODE_QUALITE } from "./reclamation-qui-enfle";
import { EPISODE_SECURITE } from "./quai-dangereux";
import { EPISODE_CHANGEMENT } from "./reorganisation-qui-coince";
import { EPISODE_TRESORERIE } from "./tresorerie-qui-fond";
import { EPISODE_LANCEMENT } from "./agence-qui-demarre";
import { EPISODE_CRISE } from "./panne-qui-paralyse";
import { EPISODE_PERFORMANCE } from "./collaborateur-qui-decroche";
import { EPISODE_INDICATEURS } from "./indicateur-qui-ment";

export const EPISODES: readonly Episode[] = [
  EPISODE_TRIMESTRE,
  EPISODE_EQUIPE,
  EPISODE_DEPOT,
  EPISODE_BUDGET,
  EPISODE_PROJET,
  EPISODE_ACHATS,
  EPISODE_RECRUTEMENT,
  EPISODE_QUALITE,
  EPISODE_SECURITE,
  EPISODE_CHANGEMENT,
  EPISODE_TRESORERIE,
  EPISODE_LANCEMENT,
  EPISODE_CRISE,
  EPISODE_PERFORMANCE,
  EPISODE_INDICATEURS,
];

export const episodeParCode = (code: string): Episode | undefined =>
  EPISODES.find((e) => e.code === code);
