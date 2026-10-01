/**
 * LES FORMATIONS, ET LE RATTACHEMENT D'UN ATELIER À PLUSIEURS D'ENTRE ELLES.
 *
 * CE QUI COINÇAIT. Un atelier portait un champ `diplome`, au singulier, et ce
 * champ était son identité : la fiche s'appelait « Découvrir la gestion d'une
 * entreprise en quatre séances » et c'est le mot STMG posé à côté qui disait
 * de quoi il s'agissait. Un atelier ne pouvait donc servir qu'une formation,
 * non parce qu'un autre diplôme n'y aurait rien trouvé, mais parce que la
 * forme des données l'interdisait.
 *
 * Le coût était mesurable : l'atelier de découverte ne travaille que des
 * gestes présents dans les référentiels de sept diplômes et n'était rattaché à
 * aucun ; le tournoi inter-filières nommait dans ses propres séances les blocs
 * de quatre diplômes et se présentait pourtant comme un diplôme à lui seul,
 * « Campus tertiaire · BTS CG, MCO, NDRC et STMG », qui n'existe nulle part.
 *
 * CE QUE CE REGISTRE CHANGE. La formation devient une chose nommée une fois,
 * et l'atelier déclare celles qu'il sert — zéro, une, ou plusieurs. Son
 * identité est son intitulé, que tests/architecture/intitules-des-ateliers
 * garde distinctif, et non le diplôme posé à côté.
 *
 * LE RÉFÉRENTIEL RESTE OÙ IL EST (src/config/ateliers/referentiels.ts), avec
 * sa provenance et sa date de confrontation au texte. Le déplacer ici aurait
 * été un second chantier dans le premier, et sa garde actuelle fonctionne.
 */

export interface Formation {
  /** Le code stable, qui sert d'ancre et de clé : « bts-mco ». */
  code: string;
  /** Le nom entier, tel qu'un arrêté le nomme. */
  nom: string;
  /**
   * Le sigle, pour les endroits où le nom entier ne tient pas. « BTS
   * Négociation et digitalisation de la relation client » fait cinquante-six
   * signes : dans une pastille d'index, il occupe trois lignes à lui seul.
   * Ce ne sont pas des abréviations inventées, ce sont celles que
   * l'Éducation nationale emploie et qu'un enseignant reconnaît du premier
   * coup d'œil.
   */
  sigle: string;
}

export const FORMATIONS: readonly Formation[] = [
  { code: "stmg", nom: "Baccalauréat STMG", sigle: "STMG" },
  { code: "bts-cg", nom: "BTS Comptabilité et Gestion", sigle: "BTS CG" },
  {
    code: "bts-mco",
    nom: "BTS Management commercial opérationnel",
    sigle: "BTS MCO",
  },
  {
    code: "bts-ndrc",
    nom: "BTS Négociation et digitalisation de la relation client",
    sigle: "BTS NDRC",
  },
  { code: "bts-gpme", nom: "BTS Gestion de la PME", sigle: "BTS GPME" },
  {
    code: "bts-mhr",
    nom: "BTS Management en hôtellerie-restauration",
    sigle: "BTS MHR",
  },
  {
    code: "bts-mhr-bc",
    nom: "BTS Management en hôtellerie-restauration, options B et C",
    sigle: "BTS MHR · B et C",
  },
  {
    code: "but-gea",
    nom: "BUT Gestion des entreprises et des administrations",
    sigle: "BUT GEA",
  },
  { code: "dcg", nom: "DCG", sigle: "DCG" },
];

const PAR_CODE = new Map(FORMATIONS.map((f) => [f.code, f]));

export function formationParCode(code: string): Formation | undefined {
  return PAR_CODE.get(code);
}

/** Les formations qu'un atelier sert, dans l'ordre du registre. */
export function formationsDe(codes: readonly string[]): Formation[] {
  return FORMATIONS.filter((f) => codes.includes(f.code));
}

/** « BTS CG, BTS MCO et STMG » : une énumération française finit par « et ». */
function enumere(mots: string[]): string {
  if (mots.length === 0) return "";
  if (mots.length === 1) return mots[0]!;
  return `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}

/**
 * À QUI S'ADRESSE UN ATELIER, EN UNE LIGNE.
 *
 * Trois ateliers ne servent aucune formation en particulier : une découverte,
 * un approfondissement, un tournoi. Ils portaient jusqu'ici un faux diplôme
 * dans le champ `diplome` — « Découverte, toutes filières » — et ce faux
 * diplôme se mêlait aux vrais partout où le site les listait. Ils déclarent
 * maintenant leur public, qui est une autre sorte de chose et se lit comme
 * telle.
 */
export function publicDeLAtelier(a: {
  formations: readonly string[];
  public?: string;
}): string {
  const siennes = formationsDe(a.formations);
  return siennes.length
    ? enumere(siennes.map((f) => f.sigle))
    : (a.public ?? "");
}

/** Le même, en noms entiers : pour un titre de page, pas pour une pastille. */
export function formationsEnToutesLettres(a: {
  formations: readonly string[];
  public?: string;
}): string {
  const siennes = formationsDe(a.formations);
  return siennes.length ? enumere(siennes.map((f) => f.nom)) : (a.public ?? "");
}
