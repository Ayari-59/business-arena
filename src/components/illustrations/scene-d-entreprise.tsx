import type { ComponentType } from "react";
import type { Sector } from "@/config/scenarios/registry";
import { Dessin } from "./trait";
import {
  SceneAtelier,
  SceneBatiment,
  SceneBistrot,
  SceneBoutique,
  SceneConseil,
  SceneEcommerce,
  SceneFitness,
  SceneHotel,
  SceneTransport,
} from "./scenes";

/**
 * UNE SCÈNE PAR ENTREPRISE JOUABLE (lot 6B).
 *
 * Neuf entreprises, neuf lieux. Les variantes de gamme (`nova-gamme`,
 * `hotel-gamme`…) ne sont pas des entreprises de plus : c'est la même maison,
 * jouée en gamme à partir d'un niveau, et elle garde son lieu comme elle garde
 * sa teinte. Un scénario d'enseignant, qui n'a pas de code du registre,
 * retombe sur le lieu de son secteur.
 *
 * Le registre des scénarios n'est pas importé ici (il tirerait tous les
 * secteurs dans la page) : la garde `illustrations.test.ts` vérifie que ces
 * tables couvrent bien `SCENARIO_CHOICES` et chaque famille.
 */
export const SCENES_DES_ENTREPRISES: Record<string, { lieu: string; Dessin: ComponentType }> = {
  nova: { lieu: "L'atelier d'enceintes", Dessin: SceneAtelier },
  boutique: { lieu: "La boutique de mailles", Dessin: SceneBoutique },
  hotel: { lieu: "La réception de l'hôtel", Dessin: SceneHotel },
  bistrot: { lieu: "La salle du bistrot", Dessin: SceneBistrot },
  conseil: { lieu: "La salle de réunion du cabinet", Dessin: SceneConseil },
  ecommerce: { lieu: "La boutique en ligne et ses colis", Dessin: SceneEcommerce },
  fitness: { lieu: "La salle de sport", Dessin: SceneFitness },
  batiment: { lieu: "Le chantier de rénovation", Dessin: SceneBatiment },
  transport: { lieu: "Le camion à quai", Dessin: SceneTransport },
};

/**
 * LES LIEUX EN PHOTOGRAPHIE. Une entreprise qui a sa photo la montre à la place
 * du dessin. Les neuf en ont une ; les scènes dessinées restent le repli d'une
 * entreprise qui viendrait s'ajouter sans photo.
 *
 * Ce sont des images générées par IA, fournies par le propriétaire, puis
 * TRAITÉES une fois pour toutes (scratchpad, lot 6B) : passées en niveaux de
 * gris, virées du marine profond au blanc cassé, voilées à 16 % de la teinte
 * du métier. Le traitement est cuit dans le fichier : une photo n'appartient
 * qu'à une entreprise, elle n'a pas à changer de teinte. Aucune ne porte de
 * texte, de logo ni de marque — c'est la condition pour entrer ici (les mots
 * écrits au feutre sur le tableau d'ATLAS, les marques des tapis de VOLT, le
 * panneau de chantier et les sacs d'enduit de MARTEL, les étiquettes d'étagères
 * et les logos d'enceintes de NOVA ont été effacés à la retouche).
 *
 * `cadrage` est la position verticale du cadre (`background-position`), réglée
 * pour garder les visages dans le bandeau, sur ordinateur comme au téléphone.
 */
export const PHOTOS_DES_ENTREPRISES: Record<string, { cadrage: number }> = {
  nova: { cadrage: 52 },
  boutique: { cadrage: 27 },
  hotel: { cadrage: 37 },
  bistrot: { cadrage: 34 },
  conseil: { cadrage: 49 },
  ecommerce: { cadrage: 44 },
  fitness: { cadrage: 69 },
  batiment: { cadrage: 45 },
  transport: { cadrage: 70 },
};

/** Le fichier d'une photo de lieu, pleine taille ou réduite pour le téléphone. */
export function fichierDeLaPhoto(entreprise: string, petit = false): string {
  return `/scenes/${entreprise}${petit ? "-768" : ""}.webp`;
}

/**
 * LA TAILLE DE CHAQUE FICHIER PLEINE TAILLE, en pixels. La réduite fait 768 de
 * large, au même rapport. Elle sert aux attributs `width`/`height` d'une
 * `<img>` (le navigateur réserve la place avant l'arrivée du fichier) et à
 * son `srcset`. La garde `mise-en-scene.test.ts` la relit dans les fichiers.
 */
export const TAILLES_DES_PHOTOS: Record<string, { largeur: number; hauteur: number }> = {
  nova: { largeur: 1376, hauteur: 768 },
  boutique: { largeur: 1536, hauteur: 1024 },
  hotel: { largeur: 1536, hauteur: 1024 },
  bistrot: { largeur: 1536, hauteur: 1024 },
  conseil: { largeur: 1408, hauteur: 768 },
  ecommerce: { largeur: 1408, hauteur: 768 },
  fitness: { largeur: 1408, hauteur: 768 },
  batiment: { largeur: 1408, hauteur: 768 },
  transport: { largeur: 1376, hauteur: 768 },
};

/**
 * LE LIEU EN PHOTOGRAPHIE, MIS EN SCÈNE (lot P2).
 *
 * `SceneDEntreprise` pose la photo en FOND d'un bloc : c'est ce qu'il faut à
 * un bandeau, mais un fond se charge dès que la page se peint, même à deux
 * écrans sous la ligne de flottaison. Les lieux sont devenus l'image du
 * produit (vitrine, choix de l'entreprise, ouverture de partie, bilan) : une
 * vitrine en pose treize, /jouer neuf, et la plupart sont plus bas que le
 * premier écran. Ici, une vraie `<img>` :
 *
 *   · `loading="lazy"` par défaut : le navigateur ne la demande qu'à
 *     l'approche de l'écran. `prioritaire` la charge d'emblée et la demande
 *     en premier (`fetchPriority="high"`), pour la photo du haut d'une page ;
 *   · `width`/`height` du fichier : la place est réservée, rien ne saute ;
 *   · `petit` : la réduite seule (vignette, carte, téléphone) ; sinon un
 *     `srcset` des deux tailles, et `sizes` dit la largeur affichée ;
 *   · le cadrage vertical du registre (`object-position`), le même que le
 *     bandeau de l'arène : on recadre par la position, jamais par un fichier ;
 *   · décorative : `alt=""` et `aria-hidden`. Le nom de l'entreprise et son
 *     métier sont écrits à côté, en vrai texte.
 */
export function PhotoDuLieu({
  scenario,
  secteur,
  petit = false,
  prioritaire = false,
  sizes = "100vw",
  className = "",
  cadrage,
}: {
  scenario: string;
  secteur?: Sector;
  /** La réduite seule (768 px) : vignette, carte, téléphone. */
  petit?: boolean;
  /** Au-dessus de la ligne de flottaison : chargée tout de suite, en premier. */
  prioritaire?: boolean;
  /** La largeur affichée, pour le choix du fichier dans le `srcset`. */
  sizes?: string;
  className?: string;
  /** Une autre position verticale (en %) que celle du registre. */
  cadrage?: number;
}) {
  const entreprise = entrepriseDeLaScene(scenario, secteur);
  const photo = entreprise ? PHOTOS_DES_ENTREPRISES[entreprise] : undefined;
  const taille = entreprise ? TAILLES_DES_PHOTOS[entreprise] : undefined;
  if (!entreprise || !photo || !taille) return null;
  const hauteurReduite = Math.round((taille.hauteur * 768) / taille.largeur);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- photo déjà réduite et compressée (deux tailles, < 200 Ko) : l'optimiseur la recompresserait.
    <img
      src={fichierDeLaPhoto(entreprise, petit)}
      {...(petit
        ? {}
        : {
            srcSet: `${fichierDeLaPhoto(entreprise, true)} 768w, ${fichierDeLaPhoto(entreprise)} ${taille.largeur}w`,
            sizes,
          })}
      width={petit ? 768 : taille.largeur}
      height={petit ? hauteurReduite : taille.hauteur}
      alt=""
      aria-hidden
      loading={prioritaire ? "eager" : "lazy"}
      decoding="async"
      {...(prioritaire ? { fetchPriority: "high" as const } : {})}
      data-lieu-photo={entreprise}
      className={`object-cover ${className}`}
      style={{ objectPosition: `50% ${cadrage ?? photo.cadrage}%` }}
    />
  );
}

/** La même entreprise jouée en variante : elle garde son lieu. */
export const VARIANTES_D_ENTREPRISE: Record<string, string> = {
  "nova-gamme": "nova",
  "boutique-mono": "boutique",
  "hotel-gamme": "hotel",
  "bistrot-gamme": "bistrot",
  "conseil-gamme": "conseil",
  "ecommerce-gamme": "ecommerce",
};

/** Le lieu d'un secteur, pour un scénario qui n'est pas au registre. */
export const SCENES_DES_SECTEURS: Record<Sector, string> = {
  industrie: "nova",
  commerce: "boutique",
  ecommerce: "ecommerce",
  hotellerie: "hotel",
  restauration: "bistrot",
  services: "conseil",
  abonnement: "fitness",
  batiment: "batiment",
  transport: "transport",
};

/** L'entreprise dont on montre le lieu : la tête de famille, ou le secteur. */
export function entrepriseDeLaScene(code: string, secteur?: Sector): string | null {
  const tete = VARIANTES_D_ENTREPRISE[code] ?? code;
  if (SCENES_DES_ENTREPRISES[tete]) return tete;
  return secteur ? SCENES_DES_SECTEURS[secteur] : null;
}

export function SceneDEntreprise({
  scenario,
  secteur,
  titre,
  className,
  cadrage,
  classePhoto,
  petit = false,
}: {
  /** Le code du scénario joué. */
  scenario: string;
  /** Son secteur, pour un scénario d'enseignant. */
  secteur?: Sector;
  /** À donner seulement si l'image porte un sens que rien d'autre ne dit. */
  titre?: string;
  className?: string;
  /** `preserveAspectRatio` : « xMidYMid slice » pour un bandeau recadré. */
  cadrage?: string;
  /** Les classes du bandeau quand le lieu est une photo (plus haut qu'un dessin). */
  classePhoto?: string;
  /** Sur téléphone : la photo réduite suffit. */
  petit?: boolean;
}) {
  const entreprise = entrepriseDeLaScene(scenario, secteur);
  if (!entreprise) return null;
  const photo = PHOTOS_DES_ENTREPRISES[entreprise];
  if (photo) {
    // Une image de fond, comme les aperçus de l'accueil : décorative, elle n'a
    // rien à dire à une synthèse vocale (le nom et le métier sont écrits
    // juste dessous), sauf si on lui donne un titre.
    return (
      <div
        className={classePhoto ?? className}
        {...(titre ? { role: "img", "aria-label": titre } : { "aria-hidden": true })}
        data-lieu-photo={entreprise}
        style={{
          backgroundImage: `url(${fichierDeLaPhoto(entreprise, petit)})`,
          backgroundSize: "cover",
          backgroundPosition: `50% ${photo.cadrage}%`,
        }}
      />
    );
  }
  const { Dessin: Scene } = SCENES_DES_ENTREPRISES[entreprise]!;
  return (
    <Dessin largeur={480} hauteur={270} titre={titre} className={className} cadrage={cadrage}>
      <Scene />
    </Dessin>
  );
}
