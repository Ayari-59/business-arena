import { formationParCode } from "../formations";
import { citeLaFormation } from "./parcours-de-formation";
import { PARCOURS } from "./parcours";
import type { Chapitre } from "./types";

/**
 * L'EN-TÊTE D'UN CHAPITRE PORTE LE DIPLÔME D'OÙ L'ON VIENT (décision du propriétaire du 11 novembre 2026 ;
 * audit UX du même jour, P2-12).
 *
 * L'en-tête d'un chapitre écrit son parcours : « Cours · Bac STMG · Ressources humaines · Palier 1 ». Un
 * chapitre sert souvent plusieurs diplômes, et l'essai du BTS SAM ou du BUT GEA s'ouvrait sous le nom du
 * bac STMG, alors que l'adresse portait le diplôme (`?diplome=`). Quand le chapitre est de ce diplôme
 * (son parcours le suit, ou il cite son référentiel : la règle de la page du diplôme,
 * `chapitresDeLaPageDuDiplome`), l'en-tête nomme ce diplôme, puis la matière du parcours :
 * « BTS SAM · Ressources humaines ». Sans diplôme dans l'adresse, ou pour un chapitre qui n'en est pas
 * (un lien d'un chapitre à l'autre garde le diplôme), le parcours, comme avant.
 */
export function enTeteDuChapitre(chapitre: Pick<Chapitre, "parcours" | "blocs">, diplome: string | null | undefined): string {
  const parcours = PARCOURS.find((p) => p.code === chapitre.parcours);
  const titre = parcours?.titre ?? "";
  const formation = diplome ? formationParCode(diplome) : undefined;
  if (!parcours || !formation || parcours.formation === formation.code) return titre;
  if (!citeLaFormation(chapitre, formation.code)) return titre;
  // La matière : le titre d'un parcours de discipline, ou ce qui suit le diplôme dans celui d'une formation.
  const coupure = titre.indexOf(" · ");
  const matiere = parcours.formation && coupure >= 0 ? titre.slice(coupure + 3) : titre;
  return `${formation.sigle} · ${matiere}`;
}
