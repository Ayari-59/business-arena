import type { AtelierDefinition, AtelierSeance } from "./types";
import { DIFFICULTY_PRESETS, type DifficultyPreset, type LeviersDuNiveau } from "../difficulty";
import { LIBELLES_DES_LEVIERS } from "../tableau-des-niveaux";
import { familyOf, scenarioByCode, scenarioCodeForLevel } from "../scenarios/registry";
import { estimationDuTour, presetDeLAtelier } from "./duree-des-seances";

/**
 * ADAPTER UN ATELIER AU NIVEAU DE SA CLASSE : UN CRAN PLUS BAS, UN CRAN PLUS HAUT.
 *
 * Chaque fiche est écrite pour un niveau, et presque chaque foire aux questions
 * disait en prose ce que ferait « monter ou descendre d'un cran » : des phrases
 * écrites à la main, qui se sont révélées fausses deux fois (un « un cran »
 * qui en valait deux, un niveau qui ouvrait plus qu'annoncé). Depuis que la
 * répartition des leviers a changé, en octobre 2026, rien ne garantit qu'une
 * phrase de ce genre dit encore vrai.
 *
 * RIEN N'EST ÉCRIT À LA MAIN ICI. Le niveau voisin se lit dans les préréglages
 * (ce qu'il ferme, ce qu'il ouvre), la bascule d'entreprise dans les familles
 * de scénarios (`gammeFromLevel`), le temps à ajouter ou retirer par tour dans
 * le modèle de durée, et les séances à retoucher dans ce que chaque séance
 * annonce travailler. Un préréglage retouché change la fiche sans qu'on y
 * touche.
 *
 * Une fiche de concours n'a pas d'adaptation : le championnat impose son
 * niveau, et la dire adaptable enverrait l'organisateur régler ce qui ne se
 * règle pas.
 */

/**
 * CE QU'UNE SÉANCE ANNONCE TRAVAILLER, levier par levier, lu dans son titre et
 * son objectif. La même lecture que la garde « une séance ne peut pas porter
 * sur des décisions que le niveau ne donne pas » (tests/pedagogy) : un cran
 * plus bas ferme un levier, et la séance qui l'annonce est à retoucher.
 */
export const MOTS_DES_LEVIERS: Readonly<Record<keyof LeviersDuNiveau, RegExp>> = {
  quality: /qualité/i,
  maintenance: /maintenance|entretien/i,
  finance: /emprunt|financement|\bbanque\b|apport des associés/i,
  creances: /trésorerie|créances|poste clients|escompte|affacturage/i,
  insurance: /assurance|assurer contre/i,
  hr: /recrut|embauch|personnel|effectif/i,
  investment: /investir|investissement/i,
  rse: /\bRSE\b|responsabilité sociétale|extra-financi/i,
  placement: /placement|excédents?\b/i,
  dividend: /dividende|affectation du résultat/i,
  rd: /recherche et développement|\bR&D\b|prototype|à (bâtir|développer)/i,
  // Niveau 7, à côté du parcours : aucun atelier ne s'y joue, les mots servent à la garde.
  croissanceExterne: /rachat d'un concurrent|racheter un concurrent|rachat d'un site|croissance externe|\bfusion\b/i,
  externalisation: /sous-trait|externalis/i,
};

/**
 * Ce que la séance dit d'elle-même : son titre, son objectif et les titres de
 * ses phases. La garde des leviers fermés ne lit que les deux premiers ; une
 * adaptation est un conseil, elle peut lire plus large.
 */
const ceQueDit = (s: Pick<AtelierSeance, "titre" | "objectif" | "deroule">) =>
  `${s.titre} ${s.objectif} ${s.deroule.map((p) => p.titre).join(" ")}`;

/**
 * La trésorerie se pilote par les créances au niveau 3 et par l'emprunt au
 * niveau 4 : une séance de trésorerie n'est à retoucher que si le cran ferme
 * les deux. C'est la règle de la garde, reprise telle quelle.
 */
const GROUPES: readonly (readonly (keyof LeviersDuNiveau)[])[] = [
  ["finance"],
  ["creances", "finance"],
  ["hr"],
  ["investment"],
  ["insurance"],
  ["placement"],
  ["rd"],
  ["rse"],
  ["dividend"],
  ["quality"],
  ["maintenance"],
];

/** Les mots qui disent qu'une séance raisonne sur un seul produit, ou sur la gamme. */
const PARLE_DU_MONO = /une seule|un seul|mono-?produit|un produit/i;
const PARLE_DE_LA_GAMME = /gamme|par (offre|référence|enceinte|rayon|chambre)|\bmix\b|traiteur|studio|cyber|collection de créateurs/i;
const DONNE_LES_REGLAGES = /créez la partie|niveau \d/i;

export interface SeanceARetoucher {
  numero: number;
  titre: string;
  raison: string;
}

export interface Adaptation {
  sens: "bas" | "haut";
  niveau: number;
  niveauNom: string;
  /** Les leviers que ce cran ferme, en clair (vide quand il n'en ferme aucun). */
  ferme: string[];
  /** Les leviers que ce cran ouvre, en clair. */
  ouvre: string[];
  /** Le scénario réellement joué à ce niveau. */
  scenarioCode: string;
  /** L'entreprise change de variante : de quel nom court à quel nom court. */
  bascule: { de: string; vers: string } | null;
  seances: SeanceARetoucher[];
  /**
   * Ce que le cran ajoute ou retire à chaque tour, en minutes, selon le modèle
   * de durée : une fourchette, parce que la situation du tour et la prise en
   * main du premier font varier l'écart d'une séance à l'autre.
   */
  minutesParTour: { min: number; max: number };
}

const libelle = (l: keyof LeviersDuNiveau) => LIBELLES_DES_LEVIERS[l].court;

function leviersEntre(
  avant: LeviersDuNiveau,
  apres: LeviersDuNiveau,
): { ferme: (keyof LeviersDuNiveau)[]; ouvre: (keyof LeviersDuNiveau)[] } {
  const cles = Object.keys(avant) as (keyof LeviersDuNiveau)[];
  return {
    ferme: cles.filter((c) => avant[c] && !apres[c]),
    ouvre: cles.filter((c) => !avant[c] && apres[c]),
  };
}

function adaptation(
  a: AtelierDefinition,
  sens: "bas" | "haut",
  courant: DifficultyPreset,
  voisin: DifficultyPreset,
): Adaptation {
  const { ferme, ouvre } = leviersEntre(courant.decisions, voisin.decisions);
  const tete = familyOf(a.reglages.scenarioCode)?.head ?? a.reglages.scenarioCode;
  const scenarioCode = scenarioCodeForLevel(tete, voisin.level);
  const bascule =
    scenarioCode === a.reglages.scenarioCode
      ? null
      : {
          de: scenarioByCode(a.reglages.scenarioCode).shortName,
          vers: scenarioByCode(scenarioCode).shortName,
        };
  const versLaGamme = bascule !== null && scenarioCode === familyOf(tete)?.gamme;

  const seances: SeanceARetoucher[] = [];
  for (const s of a.seances) {
    const raisons: string[] = [];
    const dit = ceQueDit(s);
    // Un levier que la séance annonce et que le cran ferme entièrement.
    for (const groupe of GROUPES) {
      const annonce = groupe.some((l) => MOTS_DES_LEVIERS[l].test(dit));
      if (!annonce) continue;
      const ouvertAvant = groupe.some((l) => courant.decisions[l]);
      const ouvertApres = groupe.some((l) => voisin.decisions[l]);
      if (ouvertAvant && !ouvertApres) {
        raisons.push(
          `la séance porte sur ${groupe.map((l) => LIBELLES_DES_LEVIERS[l].phrase).join(" ou ")}, que le niveau ${voisin.level} ferme`,
        );
      }
    }
    if (bascule) {
      if (DONNE_LES_REGLAGES.test(s.preparation)) {
        raisons.push(
          `la préparation donne les réglages de création, et l'entreprise devient ${bascule.vers}`,
        );
      }
      if (versLaGamme && PARLE_DU_MONO.test(dit)) {
        raisons.push("la séance raisonne sur un seul produit, et la gamme en apporte plusieurs");
      }
      if (!versLaGamme && PARLE_DE_LA_GAMME.test(dit)) {
        raisons.push("la séance raisonne sur la gamme, qui disparaît avec ce niveau");
      }
    }
    if (raisons.length > 0) {
      seances.push({ numero: s.numero, titre: s.titre, raison: raisons.join(" ; ") });
    }
  }

  // Les séances qui jouent un tour, l'essai compris : c'est l'estimation qui le dit.
  const ecarts = a.seances
    .map((s) => {
      const avant = estimationDuTour(a, s);
      if (!avant) return null;
      const apres = estimationDuTour(a, s, { scenarioCode, preset: voisin })!.minutes;
      return apres - avant.minutes;
    })
    .filter((e): e is number => e !== null);
  const minutesParTour =
    ecarts.length > 0
      ? { min: Math.min(...ecarts), max: Math.max(...ecarts) }
      : { min: 0, max: 0 };

  return {
    sens,
    niveau: voisin.level,
    niveauNom: voisin.name,
    ferme: ferme.map(libelle),
    ouvre: ouvre.map(libelle),
    scenarioCode,
    bascule,
    seances,
    minutesParTour,
  };
}

export interface AdaptationsDuNiveau {
  bas: Adaptation | null;
  haut: Adaptation | null;
  /** Pourquoi il n'y a rien à adapter, quand c'est le cas. */
  raison: string | null;
}

/** Les deux crans voisins d'un atelier, lus dans les préréglages et le modèle de durée. */
export function adaptationsDuNiveau(a: AtelierDefinition): AdaptationsDuNiveau {
  if (a.reglages.concours) {
    return {
      bas: null,
      haut: null,
      raison: "Un concours impose son niveau : cette fiche ne s'adapte pas, elle s'organise.",
    };
  }
  const courant = presetDeLAtelier(a);
  const presets = [...DIFFICULTY_PRESETS].sort((x, y) => x.level - y.level);
  const plusBas = presets.filter((p) => p.level < courant.level).at(-1) ?? null;
  const plusHaut = presets.find((p) => p.level > courant.level) ?? null;
  return {
    bas: plusBas ? adaptation(a, "bas", courant, plusBas) : null,
    haut: plusHaut ? adaptation(a, "haut", courant, plusHaut) : null,
    raison: null,
  };
}

/** « environ 2 min de moins », « 3 à 5 min de plus », « aucun changement ». */
export function minutesEnClair({ min, max }: { min: number; max: number }): string {
  if (min === 0 && max === 0) return "aucun changement de durée par tour";
  const signe = max <= 0 ? "de moins" : min >= 0 ? "de plus" : "d'écart";
  const abs = (n: number) => Math.abs(n);
  const [petit, grand] = [abs(min), abs(max)].sort((x, y) => x - y);
  if (petit === grand) return `environ ${grand} min ${signe} par tour`;
  return `${petit} à ${grand} min ${signe} par tour`;
}
