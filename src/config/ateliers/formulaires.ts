import { ATELIERS, type AtelierDefinition, type AtelierSeance } from "./index";
import { scenarioByCode } from "../scenarios/registry";

/**
 * LES FORMULAIRES DES LIVRABLES.
 *
 * Chaque séance d'un atelier demande un document : « La fiche de marge du
 * magasin, une page : prix d'achat, prix de vente, coefficient, taux de marque,
 * charges de structure du trimestre, seuil en articles, et le positionnement
 * retenu avec sa justification. » L'élève lisait cette phrase et repartait avec
 * une feuille blanche. Une classe sur deux oublie une rubrique, et l'enseignant
 * corrige des documents qui ne se ressemblent pas.
 *
 * Le formulaire, c'est cette phrase RANGÉE : le nom du document en tête, une
 * ligne à remplir par rubrique, et en bas ce sur quoi le document sera regardé.
 *
 * Rien n'est écrit ici. Chaque rubrique est un morceau de la phrase de
 * l'enseignant, recopié tel quel : le module DÉCOUPE, il ne rédige pas. C'est
 * la seule chose qui rende l'automatisme acceptable, et c'est précisément ce
 * qu'une garde vérifie, dans les deux sens. Rien d'ajouté : chaque rubrique se
 * retrouve mot pour mot dans la phrase d'origine. Rien de perdu : la phrase,
 * privée de son titre et de ses rubriques, ne doit plus contenir que des
 * virgules et des mots de liaison.
 */

/** Ce qui dit le format du document et ne se remplit donc pas : « une page ». */
const PRECISION_DE_FORMAT = /^(une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix) pages?$/i;

/**
 * Les mots qui relient les rubriques d'une énumération française. Ils ouvrent
 * le dernier morceau (« et la soutenance », « puis ventes réelles ») et ne font
 * partie d'aucune rubrique : c'est aussi la liste exacte de ce qu'une garde
 * accepte de trouver dans ce qui reste de la phrase une fois découpée.
 */
export const MOTS_DE_LIAISON = ["et", "puis", "plus"] as const;

export interface FormulaireLivrable {
  seance: number;
  seanceTitre: string;
  tourJoue: number | null;
  /**
   * Le nom du document, quand la phrase le donne avant les deux points. Toutes
   * ne le donnent pas : cinq livrables sur trente deux énumèrent directement,
   * et le formulaire prend alors le titre de la séance.
   */
  document: string | null;
  /** Ce que la phrase dit du format du rendu, et qui ne se remplit pas. */
  precisions: string[];
  /**
   * La consigne qui gouverne l'énumération entière, quand la phrase en ouvre
   * une : « pour chaque ligne, le prévu, le réalisé, l'écart ». Elle se lit
   * au dessus des rubriques, elle ne se remplit pas.
   */
  consigne: string | null;
  /** Une ligne à remplir par rubrique, dans l'ordre de la phrase. */
  rubriques: string[];
  /** La phrase d'origine, qui reste affichée telle quelle en tête. */
  phrase: string;
  /** Ce sur quoi le document sera regardé, à relire avant de rendre. */
  evaluation: string[];
}

/**
 * Une consigne distributive, et non une rubrique.
 *
 * « Pour chaque ligne, le prévu, le réalisé, l'écart et sa cause » n'énumère
 * pas cinq choses à écrire mais quatre, précédées de la façon de les écrire.
 * Le morceau ne se reconnaît qu'à sa place et à son ouverture : en tête de
 * l'énumération, et introduit par « pour ». Ailleurs, « pour » ouvre une
 * rubrique ordinaire (« le nombre d'unités à vendre pour ne rien perdre »),
 * d'où la position, qui fait la moitié de la règle.
 */
const CONSIGNE_EN_TETE = /^pour /i;

/** Découpe une énumération française en morceaux, sans rien réécrire. */
function morceaux(enumeration: string): string[] {
  return enumeration
    .replace(/\.\s*$/, "")
    .split(",")
    .map((m) => m.trim())
    .map((m) => m.replace(new RegExp(`^(?:${MOTS_DE_LIAISON.join("|")})\\s+`, "i"), "").trim())
    .filter(Boolean);
}

/**
 * Le formulaire d'une séance.
 *
 * Deux formes de phrase, et une seule règle : ce qui précède les deux points
 * nomme le document, ce qui suit l'énumère. Quand il n'y a pas de deux points,
 * la phrase est une énumération de bout en bout, le premier morceau étant
 * lui même une chose à produire.
 */
export function formulaireLivrable(seance: AtelierSeance): FormulaireLivrable {
  const phrase = seance.livrable;
  const coupe = phrase.indexOf(" : ");
  const document = coupe === -1 ? null : phrase.slice(0, coupe).trim();
  const enumeration = coupe === -1 ? phrase : phrase.slice(coupe + 3);
  const tous = morceaux(enumeration);
  const consigne = tous.length > 1 && CONSIGNE_EN_TETE.test(tous[0]!) ? tous[0]! : null;
  const restants = consigne === null ? tous : tous.slice(1);

  return {
    seance: seance.numero,
    seanceTitre: seance.titre,
    tourJoue: seance.tourJoue,
    document,
    precisions: restants.filter((m) => PRECISION_DE_FORMAT.test(m)),
    consigne,
    rubriques: restants.filter((m) => !PRECISION_DE_FORMAT.test(m)),
    phrase,
    evaluation: [...seance.evaluation],
  };
}

export function formulairesAtelier(atelier: AtelierDefinition): FormulaireLivrable[] {
  return atelier.seances.map(formulaireLivrable);
}

/** Les ateliers dont les livrables ont leur formulaire, c'est à dire tous. */
export function ateliersAvecFormulaires(): AtelierDefinition[] {
  return [...ATELIERS];
}

/** Une cellule : guillemets échappés, séparateur protégé. */
function cellule(valeur: string): string {
  return /[";\n]/.test(valeur) ? `"${valeur.replace(/"/g, '""')}"` : valeur;
}

/**
 * LES FORMULAIRES EN TABLEUR.
 *
 * La feuille imprimée se remplit au stylo pendant la séance ; ce fichier se
 * remplit au clavier et se rend par courrier. C'est le même document : une
 * ligne par rubrique, la case d'à côté vide.
 *
 * Aucune formule ici, et c'est volontaire : un livrable se rédige, il ne se
 * calcule pas. Le tableur qui calcule est l'autre, celui du tableau de bord.
 */
export function formulairesCsv(atelier: AtelierDefinition): string {
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  const lignes: string[][] = [];

  lignes.push([atelier.titre]);
  lignes.push([scenario.title]);
  lignes.push(["Équipe :", ""]);
  lignes.push(["Noms :", ""]);

  for (const f of formulairesAtelier(atelier)) {
    lignes.push([]);
    lignes.push([
      `SÉANCE ${f.seance} · ${f.seanceTitre}`,
      f.tourJoue !== null ? `Tour joué : ${f.tourJoue}` : "Aucun tour joué",
    ]);
    lignes.push([f.document ?? f.phrase, ...(f.precisions.length ? [f.precisions.join(", ")] : [])]);
    // La consigne porte une étiquette, sans quoi elle se lit comme une
    // rubrique de plus, avec une case vide en face qu'il faudrait remplir.
    if (f.consigne) lignes.push(["Consigne", f.consigne]);
    lignes.push(["À remplir", "Notre réponse"]);
    for (const r of f.rubriques) lignes.push([r, ""]);
    lignes.push(["Avant de rendre, nous avons vérifié", "Fait ?"]);
    for (const c of f.evaluation) lignes.push([c, ""]);
  }

  // Signature d'octets en tête : c'est elle qui fait lire les accents à Excel.
  return "\ufeff" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n") + "\r\n";
}

/**
 * LA GRILLE DE CORRECTION DE L'ENSEIGNANT.
 *
 * Le même découpage, retourné : les critères en lignes, les équipes en
 * colonnes. L'enseignant corrige une séance pour toute la classe d'un coup, et
 * non une classe pour chaque séance ; c'est dans ce sens qu'il compare, et
 * comparer est la moitié du travail de correction.
 *
 * Aucune note n'est calculée, et aucun barème n'est proposé : le registre n'en
 * porte pas, et en inventer un placerait un barème que personne n'a écrit sous
 * le nom de l'enseignant.
 */
export function grilleEvaluationCsv(atelier: AtelierDefinition): string {
  const equipes = Array.from({ length: atelier.reglages.equipes }, (_, i) => `Équipe ${i + 1}`);
  const vide = equipes.map(() => "");
  const lignes: string[][] = [];

  lignes.push([`Grille de correction · ${atelier.titre}`, ...vide]);
  lignes.push(["Classe :", ...vide]);
  lignes.push([]);

  for (const f of formulairesAtelier(atelier)) {
    lignes.push([`SÉANCE ${f.seance} · ${f.seanceTitre}`, ...equipes]);
    lignes.push([f.document ?? f.phrase, ...vide]);
    for (const c of f.evaluation) lignes.push([c, ...vide]);
    lignes.push(["Observation", ...vide]);
    lignes.push([]);
  }

  lignes.push(["ÉVALUATION FINALE", ...equipes]);
  for (const c of atelier.evaluationFinale) lignes.push([c, ...vide]);

  return "\ufeff" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n") + "\r\n";
}
