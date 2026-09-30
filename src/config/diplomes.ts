import { ATELIERS } from "./ateliers";

/**
 * LE SIGLE D'UN DIPLÔME, POUR LES ENDROITS OÙ SON NOM ENTIER NE TIENT PAS.
 *
 * « BTS Négociation et digitalisation de la relation client » est le nom
 * exact, et il fait cinquante-six signes : dans une pastille d'index, il
 * occupe trois lignes à lui seul. La page des parcours n'indexait donc que
 * les quatre diplômes dont le nom court était déjà écrit — ceux qui ont un
 * parcours — et les autres n'existaient qu'au pied de page, après cinq mille
 * pixels.
 *
 * CE NE SONT PAS DES ABRÉVIATIONS INVENTÉES : ce sont celles que l'Éducation
 * nationale emploie et qu'un enseignant reconnaît du premier coup d'œil. Deux
 * entrées ne nomment pas un diplôme mais un public — la découverte ouverte à
 * toutes les filières, l'approfondissement — et gardent donc leur mot.
 *
 * UN SEUL ENDROIT. Le sigle sert d'étiquette d'index ; le nom entier reste
 * celui du registre des ateliers et s'affiche partout ailleurs. Une garde
 * vérifie qu'aucun diplôme d'atelier n'est sans sigle, faute de quoi une
 * filière ajoutée demain retomberait dans le trou d'où celles-ci sortent.
 */
export const SIGLE_PAR_DIPLOME: Record<string, string> = {
  "Découverte, toutes filières": "Découverte",
  "Baccalauréat STMG": "STMG",
  "BTS Comptabilité et Gestion": "BTS CG",
  "BTS Management commercial opérationnel": "BTS MCO",
  "BTS Négociation et digitalisation de la relation client": "BTS NDRC",
  "BTS Gestion de la PME": "BTS GPME",
  "BTS Management en hôtellerie-restauration": "BTS MHR",
  "BTS Management en hôtellerie-restauration, options B et C":
    "BTS MHR · B et C",
  "BUT Gestion des entreprises et des administrations": "BUT GEA",
  DCG: "DCG",
  "Approfondissement, toutes filières": "Approfondissement",
  "Campus tertiaire · BTS CG, MCO, NDRC et STMG": "Campus tertiaire",
};

/** Le sigle d'un diplôme, ou son nom entier si personne ne lui en a donné un. */
export function sigleDuDiplome(diplome: string): string {
  return SIGLE_PAR_DIPLOME[diplome] ?? diplome;
}

/** Les diplômes qu'un atelier sert, sans doublon, dans l'ordre du registre. */
export function diplomesDesAteliers(codes: readonly string[]): string[] {
  const vus: string[] = [];
  for (const a of ATELIERS) {
    if (!codes.includes(a.code)) continue;
    if (!vus.includes(a.diplome)) vus.push(a.diplome);
  }
  return vus;
}
