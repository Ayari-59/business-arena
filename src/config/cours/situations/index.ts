import { SUIVRE_LA_BAISSE } from "./suivre-la-baisse";
import type { Situation } from "./types";

export type { Situation } from "./types";

/** Les mises en situation, dans l'ordre où la page les propose. */
export const SITUATIONS: readonly Situation[] = [SUIVRE_LA_BAISSE];

export const situationParCode = (code: string) => SITUATIONS.find((s) => s.code === code);
