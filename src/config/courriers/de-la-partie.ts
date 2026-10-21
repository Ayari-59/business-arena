import type { CourrierDef } from "./types";
import { courrierParCode } from "./registre";
import { COURRIERS_DE_ROUTINE } from "./routine";
import { LETTRES_DE_MISSION } from "./mission";
import { COURRIERS_EN_RETOUR } from "./reponses";
import { courrierSelonLAssurance } from "./sans-assurance";
import { courrierALaDuree } from "./texte";

/**
 * LE COURRIER D'UN CODE, TEL QUE SA PARTIE LE MONTRE.
 *
 * Un seul chemin pour tout ce qui affiche ou exporte un courrier d'une partie :
 * la lettre de l'arène, l'enveloppe posée, le bandeau des plis annoncés, la
 * distribution de l'enseignant, la liasse imprimée, les objets cités dans le
 * tableau de bord et la lecture du résultat. Il cherche le code dans les
 * liasses, puis dans les piles qui ne se tirent pas (routine, mandats,
 * réponses), le rend à la durée du tour de la partie (`courrierALaDuree`), puis
 * lui applique la variante sans assurance quand le niveau ne l'ouvre pas.
 *
 * L'ORDRE COMPTE : la durée d'abord, l'assurance ensuite. La variante est un
 * objet neuf, que le rendu à la durée ne reconnaîtrait plus ; et elle ne
 * réécrit que des champs sans jeton (garde :
 * tests/scenarios/textes-a-la-duree-courriers.test.ts).
 *
 * Sans durée, c'est le texte au trimestre, celui des listes : un appelant
 * oublié montre le texte d'hier, jamais des accolades.
 */
export interface LectureDuCourrier {
  /** La durée d'un tour de la partie, en jours (90 par défaut). */
  jours?: number;
  /** Le niveau de la partie ouvre-t-il l'assurance ? Fermée : la variante sans elle. */
  assurance?: boolean;
}

const routineParCode = new Map(COURRIERS_DE_ROUTINE.map((c) => [c.code, c]));
const missionParCode = new Map(LETTRES_DE_MISSION.map((c) => [c.code, c]));
const retourParCode = new Map(COURRIERS_EN_RETOUR.map((c) => [c.code, c]));

export function courrierDeLaPartie(code: string, lecture: LectureDuCourrier = {}): CourrierDef | undefined {
  const c =
    courrierParCode.get(code) ?? routineParCode.get(code) ?? missionParCode.get(code) ?? retourParCode.get(code);
  return courrierSelonLAssurance(courrierALaDuree(c, lecture.jours), lecture.assurance ?? true);
}

/** L'objet d'un courrier, tel que la partie le montre ; rien s'il n'est connu nulle part. */
export function objetDuCourrier(code: string, jours?: number): string | undefined {
  return courrierDeLaPartie(code, { jours })?.objet;
}
