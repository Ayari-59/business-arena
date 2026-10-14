import type { BotProfile } from "@/engine/bots";

/**
 * LE CARACTÈRE D'UN CONCURRENT SIMULÉ, DIT EN FRANÇAIS.
 *
 * Le moteur donne à chaque entreprise simulée un profil qui décide vraiment de
 * ses choix : celle qui casse les prix le fait à tous les tours, celle qui monte
 * en gamme soigne sa qualité et refuse la guerre des prix. L'élève, lui, ne
 * voyait qu'un nom et un prix moyen. Il ne pouvait donc pas apprendre à LIRE un
 * adversaire — alors que c'est exactement ce qu'on veut lui enseigner : les
 * concurrents ne réagissent pas tous pareil, et on ne combat pas un discounteur
 * comme on combat une marque premium.
 *
 * PAS AU PREMIER TOUR. Un caractère annoncé d'emblée n'est plus une
 * observation, c'est une fiche technique, et la découverte est le sel du jeu.
 * Il paraît quand deux tours sont clos : le temps de voir leurs prix bouger.
 *
 * ET SEULEMENT POUR LES ENTREPRISES SIMULÉES. Une équipe de la classe n'a pas
 * de « profil » : elle a des élèves, qui changeront d'avis. Lui coller une
 * étiquette serait faux, et ce serait la juger.
 */

export interface StyleDeConcurrent {
  /** Deux ou trois mots, lus sous le nom. */
  label: string;
  /** Ce que ce caractère implique pour qui l'affronte. */
  aide: string;
}

export const STYLES: Record<BotProfile, StyleDeConcurrent> = {
  passive: {
    label: "Ne dévie pas",
    aide: "Reconduit ses choix d'un tour à l'autre, quoi qu'il arrive sur le marché.",
  },
  price_aggressive: {
    label: "Casse les prix",
    aide: "Vise le volume par le prix bas : l'affronter sur son terrain coûte de la marge.",
  },
  premium: {
    label: "Monte en gamme",
    aide: "Prix haut et qualité soignée : il laisse le bas du marché à qui le veut.",
  },
  balanced: {
    label: "Joue l'équilibre",
    aide: "Ajuste sa production à ses ventes et ne s'emballe sur aucun levier.",
  },
  growth: {
    label: "Pousse le volume",
    aide: "Produit et fait parler de lui : il prend de la place, parfois au-delà de ses moyens.",
  },
};

/** Le nombre de tours clos avant qu'un caractère se laisse voir. */
export const TOURS_AVANT_DE_LIRE_UN_CONCURRENT = 2;

export function styleDuConcurrent(
  profil: string | null | undefined,
  toursClos: number,
): StyleDeConcurrent | null {
  if (!profil || toursClos < TOURS_AVANT_DE_LIRE_UN_CONCURRENT) return null;
  return STYLES[profil as BotProfile] ?? null;
}
