import { ATELIERS } from "./ateliers";
import { CHAPITRES } from "./cours/registre";
import { dureeDuChapitre, dureeEnClair } from "./cours/duree";
import { SITUATIONS } from "./cours/situations";
import { NOMBRE_D_EPISODES } from "./episodes/familles";

/**
 * COURS, CAS PRATIQUES, ARÈNE, ÉPISODES : COMMENT ILS S'ENCHAÎNENT.
 *
 * Demande du propriétaire (octobre 2026) : « une clarification des articulations
 * entre cours, simulation d'entreprise et épisodes manager ». Quatre briques se
 * côtoyaient sans se nommer l'une l'autre ; un enseignant ne savait pas laquelle
 * prendre, ni dans quel ordre. Chacune a ici son geste, ce que l'élève y fait,
 * sa forme, et sa place dans l'enchaînement.
 *
 * Une seule source de texte : la page du cours et l'espace enseignant lisent ce
 * module. Les nombres et les durées se comptent dans les registres, jamais à la
 * main : un chapitre de plus change la carte sans que personne n'y touche.
 */
const etendue = (minutes: number[]) => {
  const [min, max] = [Math.min(...minutes), Math.max(...minutes)];
  return min === max ? dureeEnClair(min) : `de ${dureeEnClair(min)} à ${dureeEnClair(max)}`;
};

export interface Brique {
  code: "cours" | "situations" | "arene" | "episodes";
  /** Le geste, en un verbe : ce que la brique fait faire. */
  geste: string;
  nom: string;
  /** Ce que l'élève y fait, en une phrase. */
  texte: string;
  /** Seul, en équipe ; la durée. */
  forme: string;
  /** Ce que la brique compte, lu dans son registre. */
  compte: string;
  lien: { href: string; libelle: string };
}

export function briques(): readonly Brique[] {
  return [
    {
      code: "cours",
      geste: "Apprendre",
      nom: "Le cours",
      texte:
        "Une notion à la fois, guidée pas à pas, sur les chiffres d'une entreprise de l'arène : l'élève passe les écritures et fait les calculs, la correction explique chaque étape.",
      forme: `Seul, ${etendue(CHAPITRES.map(dureeDuChapitre))}`,
      compte: `${CHAPITRES.length} chapitres`,
      lien: { href: "/cours#catalogue", libelle: "Le catalogue par thème" },
    },
    {
      code: "situations",
      geste: "S'entraîner",
      nom: "Les cas pratiques",
      texte:
        "Une demande, des documents, aucun cours : l'élève enchaîne seul les calculs qu'il a appris, dans un cas neuf, et rend une réponse chiffrée.",
      forme: `Seul, ${etendue(SITUATIONS.map(dureeDuChapitre))}`,
      compte: `${SITUATIONS.length} cas pratiques`,
      lien: { href: "/cours#catalogue", libelle: "Dans chaque thème du catalogue" },
    },
    {
      code: "arene",
      geste: "Décider dans la durée",
      nom: "L'arène",
      texte:
        "En équipe, une entreprise dirigée sur plusieurs tours, face à d'autres : chaque décision se retrouve dans les comptes du tour suivant, et les effets s'additionnent.",
      forme: "En équipe, sur plusieurs séances",
      compte: `${ATELIERS.length} ateliers prêts à animer`,
      lien: { href: "/animations", libelle: "Les ateliers" },
    },
    {
      code: "episodes",
      geste: "Agir en situation",
      nom: "Les épisodes manager",
      texte:
        "Un rôle, un trimestre, six décisions : enquêter, juger, agir avec les autres, puis lire un bilan qui sépare la qualité de la décision de la part de chance.",
      forme: "Seul ou en binôme, un trimestre en six décisions",
      compte: `${NOMBRE_D_EPISODES} épisodes`,
      lien: { href: "/entreprises/episode", libelle: "Les épisodes" },
    },
  ];
}

/** L'enchaînement, en trois phrases : ce que chaque passage apporte au suivant. */
export const ENCHAINEMENT: readonly string[] = [
  "Le chapitre apprend la notion ; le cas pratique vérifie qu'elle tient sans guide ; l'arène la fait jouer dans la durée, où une erreur se paie au tour suivant.",
  "L'épisode manager la confronte à une situation humaine, où le chiffre ne décide pas seul : il faut enquêter, peser et convaincre.",
  "Les passages existent dans la page : un chapitre se termine par une mission dans l'arène, et chaque thème du catalogue propose ses cas pratiques et ses épisodes.",
];
