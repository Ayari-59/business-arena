import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { NOMBRE_D_EPISODES, SECTEURS } from "@/config/episodes/familles";
import { NIVEAUX as NIVEAUX_DES_EPISODES } from "@/config/episodes/niveaux";
import { ouvreLExamen, ouvreLesEpisodes, parametresAreneDe, type Catalogue } from "@/config/catalogue";

/**
 * LES JETONS DES GUIDES : CE QUI SE COMPTE NE S'ÉCRIT PAS À LA MAIN.
 *
 * Le nombre de niveaux, leurs noms, le nombre d'épisodes, le nom des offres qui ouvrent
 * l'arène ou l'examen : tout cela bouge, dans la configuration ou dans le catalogue que
 * l'administrateur édite. Le texte d'un guide les appelle par un jeton `{{nom}}`, résolu
 * au rendu. Un jeton inconnu lève une erreur plutôt que de laisser des accolades à
 * l'écran (garde : tests/architecture/guides.test.ts).
 */

export const JETONS = [
  "nombreDeNiveaux",
  "premierNiveau",
  "dernierNiveau",
  "niveaux",
  "nombreDEpisodes",
  "metiersDesEpisodes",
  "niveauxDesEpisodes",
  "offresArene",
  "offresEpisodes",
  "offresExamen",
] as const;

export type Jeton = (typeof JETONS)[number];
export type ValeursDesJetons = Record<Jeton, string>;

/** « a », « a et b », « a, b et c ». */
export function enListe(mots: readonly string[]): string {
  if (mots.length <= 1) return mots[0] ?? "";
  return `${mots.slice(0, -1).join(", ")} et ${mots.at(-1)}`;
}

/** Ce que la configuration du dépôt dit, sans base de données. */
export function valeursDeLaConfiguration(): Omit<ValeursDesJetons, "offresArene" | "offresEpisodes" | "offresExamen"> {
  return {
    nombreDeNiveaux: String(DIFFICULTY_PRESETS.length),
    premierNiveau: DIFFICULTY_PRESETS[0]!.name,
    dernierNiveau: DIFFICULTY_PRESETS.at(-1)!.name,
    niveaux: enListe(DIFFICULTY_PRESETS.map((p) => p.name)),
    nombreDEpisodes: String(NOMBRE_D_EPISODES),
    metiersDesEpisodes: enListe(SECTEURS.map((s) => s.nom.toLowerCase())),
    niveauxDesEpisodes: enListe(NIVEAUX_DES_EPISODES.map((n) => n.nom)),
  };
}

/** Ce que le catalogue en vigueur dit des offres (/admin/offres) : leurs noms, jamais un prix. */
export function valeursDuCatalogue(catalogue: Catalogue): Pick<ValeursDesJetons, "offresArene" | "offresEpisodes" | "offresExamen"> {
  const visibles = catalogue.offres.filter((o) => o.visible).sort((a, b) => a.ordre - b.ordre);
  const noms = (filtre: (o: (typeof visibles)[number]) => boolean) =>
    enListe(visibles.filter(filtre).map((o) => o.nom)) || "une offre sur devis";
  return {
    offresArene: noms((o) => parametresAreneDe(o) !== null),
    offresEpisodes: noms(ouvreLesEpisodes),
    offresExamen: noms(ouvreLExamen),
  };
}

export function valeursDesJetons(catalogue: Catalogue): ValeursDesJetons {
  return { ...valeursDeLaConfiguration(), ...valeursDuCatalogue(catalogue) };
}

const JETON = /\{\{([a-zA-Z]+)\}\}/g;

/** Les jetons d'un texte brut. */
export const jetonsDe = (texte: string): string[] => [...texte.matchAll(JETON)].map((m) => m[1]!);

/**
 * Les espaces insécables de la typographie française : un guillemet ne se sépare pas de
 * son mot, un deux-points ne commence pas une ligne.
 */
export const insecables = (t: string): string =>
  t.replace(/« /g, "«\u00a0").replace(/ ([»:;?!])/g, "\u00a0$1");

/** Le texte, ses jetons remplacés. Un jeton inconnu est une faute de rédaction : on lève. */
export function resoudre(texte: string, valeurs: ValeursDesJetons): string {
  return insecables(
    texte.replace(JETON, (_, nom: string) => {
      if (!(JETONS as readonly string[]).includes(nom)) {
        throw new Error(`Guide : jeton inconnu {{${nom}}}`);
      }
      return valeurs[nom as Jeton];
    }),
  );
}
