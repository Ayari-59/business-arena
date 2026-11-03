import { referentielDeCitation } from "../ateliers/referentiels";
import { FORMATIONS, formationParCode } from "../formations";

/**
 * À QUI S'ADRESSENT LES ÉPISODES MANAGER : À PARTIR DE BAC + 3.
 *
 * Décision du propriétaire (novembre 2026) : les épisodes manager ne s'annoncent plus pour un
 * niveau inférieur à bac + 3. Un épisode met une personne à la place d'un responsable qui
 * enquête, arbitre et rend des comptes : c'est le travail du BUT, de la licence et de la
 * licence professionnelle, du DCG, du DSCG, des masters, des écoles de commerce et de
 * management, de la formation continue et des entreprises. Le CAP, la seconde, le bac
 * professionnel, le bac STMG et le BTS (bac + 2) gardent l'arène, les ateliers et le cours.
 *
 * LA RÈGLE NE S'ÉCRIT QU'ICI. Tout ce qui associe un épisode à une formation la lit :
 *   · le registre des fiches enseignant (config/episodes/fiches/index.ts), qui n'annonce que
 *     les formations ouvertes et les lignes de programme qui sont les leurs ;
 *   · la couverture d'une formation (config/couverture.ts, `blocsDeLEpisode`), et par elle
 *     le tableau de /parcours/[formation] et le programme de /cours?diplome= ;
 *   · les suites d'un chapitre (pedagogy/cours/suites.ts), qui ne proposent pas d'épisode à
 *     la fin d'un chapitre écrit pour les seules formations fermées ;
 *   · les pages qui le disent en clair (`PUBLIC_DES_EPISODES`).
 * La garde tests/architecture/episodes-a-partir-de-bac-3.test.ts vérifie tous ces endroits.
 *
 * RIEN N'EST SUPPRIMÉ. Les épisodes restent au registre, les fiches gardent la liste des
 * formations pour lesquelles elles ont été écrites, et le relevé des blocs que les épisodes
 * travaillent (config/episodes/blocs.ts) reste tel quel : si la décision change, il suffit de
 * changer `NIVEAU_MINIMUM_DES_EPISODES`. Les cohortes en base ne portent ni formation ni niveau
 * scolaire : elles ne sont pas touchées.
 */

/**
 * LE NIVEAU DE CHAQUE FORMATION DU REGISTRE, en années d'études après le baccalauréat. Le CAP,
 * la seconde et le baccalauréat lui-même comptent 0 : ils précèdent toute année après le bac.
 * Une option compte pour son diplôme (`optionDe`). Une formation ajoutée à config/formations.ts
 * sans niveau ici reste fermée aux épisodes, et la garde le signale.
 */
export const ANNEES_APRES_LE_BAC: Readonly<Record<string, number>> = {
  "seconde-mg": 0,
  "seconde-ses": 0,
  "seconde-pro-rc": 0,
  "seconde-pro-gatl": 0,
  "cap-epc": 0,
  "bac-pro-agora": 0,
  "bac-pro-mcv": 0,
  stmg: 0,
  "bts-cg": 2,
  "bts-mco": 2,
  "bts-ndrc": 2,
  "bts-gpme": 2,
  "bts-sam": 2,
  "bts-mhr": 2,
  "but-gea": 3,
  "but-tc": 3,
  "but-gaco": 3,
  dcg: 3,
  dscg: 5,
};

/** Le niveau à partir duquel un épisode s'annonce : bac + 3. */
export const NIVEAU_MINIMUM_DES_EPISODES = 3;

/**
 * Les publics des épisodes, en clair, pour les pages qui le disent. Les licences, les masters
 * et les écoles n'ont pas de code au registre des formations : ils se disent ici.
 */
export const PUBLICS_DES_EPISODES: readonly string[] = [
  "BUT",
  "licence et licence professionnelle",
  "DCG et DSCG",
  "master",
  "école de commerce et de management",
  "formation continue et entreprises",
];

/** « À partir de bac + 3 », avec des espaces insécables : la mention ne se coupe pas. */
export const A_PARTIR_DE_BAC_3 = `À partir de bac + ${NIVEAU_MINIMUM_DES_EPISODES}`;

/** La phrase qui dit le public des épisodes, pour une page. */
export const PUBLIC_DES_EPISODES = `${A_PARTIR_DE_BAC_3} : ${PUBLICS_DES_EPISODES.join(", ")}.`;

/** Une formation du registre peut-elle se voir annoncer un épisode ? */
export function formationOuverteAuxEpisodes(code: string): boolean {
  const niveau = ANNEES_APRES_LE_BAC[formationParCode(code)?.optionDe ?? code];
  return niveau !== undefined && niveau >= NIVEAU_MINIMUM_DES_EPISODES;
}

/** Les formations d'une liste qu'un épisode peut annoncer, dans leur ordre. */
export const formationsOuvertesAuxEpisodes = (codes: readonly string[]): string[] =>
  codes.filter(formationOuverteAuxEpisodes);

/** Les sigles du registre, du plus long au plus court : « BTS MHR · B et C » avant « BTS MHR ». */
const SIGLES = [...FORMATIONS].sort((a, b) => b.sigle.length - a.sigle.length);

/**
 * La formation qu'une ligne de programme nomme (« BTS GPME · Gérer les risques de la PME »,
 * « 2de MG · … »), ou undefined si elle n'en nomme aucune (« École de commerce · … »). Les
 * préfixes des référentiels d'abord (« 2de MG »), puis les sigles du registre.
 */
export function formationDeLaLigne(ligne: string): string | undefined {
  return referentielDeCitation(ligne)?.code ?? SIGLES.find((f) => ligne.startsWith(`${f.sigle} `))?.code;
}

/** Une ligne de programme qu'un épisode peut annoncer : celle d'une formation ouverte, ou d'aucune. */
export function ligneDeProgrammeOuverte(ligne: string): boolean {
  const code = formationDeLaLigne(ligne);
  return code === undefined || formationOuverteAuxEpisodes(code);
}
