import { ATELIERS } from "./ateliers";
import { dureeDuChapitre, dureeEnClair } from "./cours/duree";
import { CHIFFRES_DU_COURS, SITUATIONS_PROPOSEES } from "./chiffres-du-cours";
import { CHAPITRES } from "./cours/registre";
import { coursDeLaFormation } from "./couverture";
import { CHAPITRES_PROPOSES, FORMATIONS_PROPOSEES } from "./formations-proposees";
import { DECISIONS_PAR_EPISODE, NOMBRE_D_EPISODES } from "./episodes/familles";
import { DANS_LE_SUPERIEUR } from "./episodes/public-des-episodes";

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
  /**
   * La porte gratuite du format, s'il en a une : ce qu'un enseignant peut ouvrir
   * sans compte ni licence (audit d'octobre 2026 : « montrer qu'on peut prendre
   * un format seul »). Absente quand le format ne s'ouvre que sous licence.
   */
  essai?: { href: string; libelle: string };
}

export function briques(): readonly Brique[] {
  // Les nombres et les durées de ce qui est proposé (config/chiffres-du-cours.ts).
  const n = CHIFFRES_DU_COURS;
  return [
    {
      code: "cours",
      geste: "Apprendre",
      nom: "Le cours",
      texte:
        "Une notion à la fois, guidée pas à pas, sur les chiffres d'une entreprise de l'arène : l'élève passe les écritures et fait les calculs, la correction explique chaque étape.",
      forme: `Seul, ${etendue(CHAPITRES_PROPOSES.map(dureeDuChapitre))}`,
      compte: `${n.chapitres} chapitres`,
      lien: { href: "/cours#catalogue", libelle: "Le catalogue par thème" },
      essai: { href: `/cours/${CHAPITRES.find((c) => c.libre)!.code}`, libelle: "Le chapitre libre" },
    },
    {
      code: "situations",
      geste: "S'entraîner",
      nom: "Les cas pratiques",
      texte:
        "Une demande, des documents, aucun cours : l'élève enchaîne seul les calculs qu'il a appris, dans un cas neuf, et rend une réponse chiffrée.",
      forme: `Seul, ${etendue(SITUATIONS_PROPOSEES.map(dureeDuChapitre))}`,
      compte: `${n.casPratiques} cas pratiques`,
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
      essai: { href: "/jouer", libelle: "Une partie solo" },
    },
    {
      code: "episodes",
      geste: "Agir en situation",
      nom: "Les épisodes manager",
      texte:
        `Un rôle, un trimestre, ${DECISIONS_PAR_EPISODE} décisions : enquêter, juger, agir avec les autres, puis lire un bilan qui sépare la qualité de la décision de la part de chance.`,
      // Le public, sur la règle de config/episodes/public-des-episodes.ts : dans l'enseignement supérieur.
      forme: `Seul ou en binôme, un trimestre en ${DECISIONS_PAR_EPISODE} décisions, ${DANS_LE_SUPERIEUR}`,
      compte: `${NOMBRE_D_EPISODES} épisodes`,
      lien: { href: "/enseignants/episodes", libelle: "Les épisodes en classe" },
      essai: { href: "/entreprises/episode", libelle: "Les épisodes de démonstration" },
    },
  ];
}

/** L'enchaînement, en trois phrases : ce que chaque passage apporte au suivant. */
export const ENCHAINEMENT: readonly string[] = [
  "Le chapitre apprend la notion ; le cas pratique vérifie qu'elle tient sans guide ; l'arène la fait jouer dans la durée, où une erreur se paie au tour suivant.",
  "L'épisode manager la confronte à une situation humaine, où le chiffre ne décide pas seul : il faut enquêter, peser et convaincre.",
  "Les passages existent dans la page : un chapitre se termine par une mission dans l'arène, et chaque chapitre a son cas pratique, et chaque thème ses cas de synthèse et ses épisodes.",
];

/**
 * LE COURS EN CHIFFRES, POUR LES PAGES DES PUBLICS (audit produit du 28 octobre 2026, P1-2).
 *
 * Le cours était le plus gros contenu du site et /enseignants, /ecoles, /fonctionnalites n'en
 * disaient pas un mot. Les nombres comptent ce qui est proposé (audit du 10 novembre 2026 :
 * 255 chapitres, 262 cas et 18 formations annoncés pour 235, 242 et 12). Les chapitres, les
 * laboratoires et les cas viennent de config/chiffres-du-cours.ts ; les formations que le cours
 * sert (une option comptant pour son diplôme) se comptent ici, et seulement ici.
 */
export function leCoursEnChiffres() {
  const libre = CHAPITRES.find((c) => c.libre)!;
  return {
    ...CHIFFRES_DU_COURS,
    formations: FORMATIONS_PROPOSEES.filter((f) => !f.optionDe && coursDeLaFormation(f.code).length > 0).length,
    libre: { href: `/cours/${libre.code}`, titre: libre.titre },
  };
}
