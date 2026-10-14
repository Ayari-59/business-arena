import type { ScenarioDefinition, Sector } from "./registry";

/**
 * L'IDENTITÉ VISUELLE DES SECTEURS.
 *
 * Une couleur et un emblème par métier, plus la façon de couper un titre en
 * nom et promesse. Ces valeurs servent à DEUX endroits, la vitrine et
 * l'accueil : les écrire deux fois, c'est se réveiller un matin avec un hôtel
 * bleu ici et vert là.
 *
 * Les classes sont écrites en toutes lettres : Tailwind lit les sources, une
 * classe composée à l'exécution ne serait jamais générée.
 */

/*
 * LES TEINTES DES MÉTIERS SONT FRANCHES ET FONCTIONNELLES (globals.css,
 * « LES MÉTIERS ») : une variable par métier et par variante de scénario,
 * claire sur la nuit, foncée sur le papier. Plus de halo ni de fond de puce :
 * dilués, l'ambre, le rose et l'orange donnaient des taches pêche et rose
 * pâle. La puce est un filet plein et un mot dans la couleur du métier.
 *
 * NEUF ENTREPRISES, NEUF UNIVERS, NEUF COULEURS. Six entrées de
 * `IDENTITES_SCENARIO` sont des VARIANTES de scénario, pas des entreprises de
 * plus : c'est la même entreprise jouée en gamme à partir d'un certain niveau.
 * Chacune reprend donc la couleur de son entreprise, à l'identique — on ne
 * change pas d'univers en changeant de niveau. Neuf teintes à séparer, pas
 * quinze : c'est ce qui permet qu'elles soient franches.
 */
export interface AccentSecteur {
  bord: string;
  halo: string;
  texte: string;
  puce: string;
  barre: string;
}

export const ACCENTS_SECTEUR: Record<Sector, AccentSecteur> = {
  industrie: {
    bord: "hover:border-[color:var(--secteur-industrie)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-industrie)]",
    puce: "border-[color:var(--secteur-industrie)] text-[color:var(--secteur-industrie)]",
    barre: "bg-[color:var(--secteur-industrie)]",
  },
  commerce: {
    bord: "hover:border-[color:var(--secteur-commerce)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-commerce)]",
    puce: "border-[color:var(--secteur-commerce)] text-[color:var(--secteur-commerce)]",
    barre: "bg-[color:var(--secteur-commerce)]",
  },
  ecommerce: {
    bord: "hover:border-[color:var(--secteur-ecommerce)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-ecommerce)]",
    puce: "border-[color:var(--secteur-ecommerce)] text-[color:var(--secteur-ecommerce)]",
    barre: "bg-[color:var(--secteur-ecommerce)]",
  },
  hotellerie: {
    bord: "hover:border-[color:var(--secteur-hotellerie)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-hotellerie)]",
    puce: "border-[color:var(--secteur-hotellerie)] text-[color:var(--secteur-hotellerie)]",
    barre: "bg-[color:var(--secteur-hotellerie)]",
  },
  restauration: {
    bord: "hover:border-[color:var(--secteur-restauration)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-restauration)]",
    puce: "border-[color:var(--secteur-restauration)] text-[color:var(--secteur-restauration)]",
    barre: "bg-[color:var(--secteur-restauration)]",
  },
  services: {
    bord: "hover:border-[color:var(--secteur-services)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-services)]",
    puce: "border-[color:var(--secteur-services)] text-[color:var(--secteur-services)]",
    barre: "bg-[color:var(--secteur-services)]",
  },
  abonnement: {
    bord: "hover:border-[color:var(--secteur-abonnement)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-abonnement)]",
    puce: "border-[color:var(--secteur-abonnement)] text-[color:var(--secteur-abonnement)]",
    barre: "bg-[color:var(--secteur-abonnement)]",
  },
  batiment: {
    bord: "hover:border-[color:var(--secteur-batiment)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-batiment)]",
    puce: "border-[color:var(--secteur-batiment)] text-[color:var(--secteur-batiment)]",
    barre: "bg-[color:var(--secteur-batiment)]",
  },
  transport: {
    bord: "hover:border-[color:var(--secteur-transport)]",
    halo: "bg-transparent",
    texte: "text-[color:var(--secteur-transport)]",
    puce: "border-[color:var(--secteur-transport)] text-[color:var(--secteur-transport)]",
    barre: "bg-[color:var(--secteur-transport)]",
  },
};

/**
 * Deux scénarios peuvent partager un métier : NOVA existe en une référence
 * (les ateliers STMG) et en trois (les ateliers de gestion). Sur la vitrine,
 * chacun garde pourtant SA couleur, sans quoi deux vignettes voisines se
 * confondraient. La couleur se lit donc par scénario, et retombe sur celle du
 * métier quand le scénario n'en déclare pas. Le pictogramme, lui, est celui
 * du secteur, dessiné : un emblème par scénario existait ici en emoji, et il
 * changeait d'aspect d'un téléphone à l'autre.
 */
const IDENTITES_SCENARIO: Record<string, { accent: AccentSecteur }> = {
  "nova-gamme": {
    accent: {
      bord: "hover:border-[color:var(--secteur-nova-gamme)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-nova-gamme)]",
      puce: "border-[color:var(--secteur-nova-gamme)] text-[color:var(--secteur-nova-gamme)]",
      barre: "bg-[color:var(--secteur-nova-gamme)]",
    },
  },
  "hotel-gamme": {
    accent: {
      bord: "hover:border-[color:var(--secteur-hotel-gamme)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-hotel-gamme)]",
      puce: "border-[color:var(--secteur-hotel-gamme)] text-[color:var(--secteur-hotel-gamme)]",
      barre: "bg-[color:var(--secteur-hotel-gamme)]",
    },
  },
  "conseil-gamme": {
    accent: {
      bord: "hover:border-[color:var(--secteur-conseil-gamme)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-conseil-gamme)]",
      puce: "border-[color:var(--secteur-conseil-gamme)] text-[color:var(--secteur-conseil-gamme)]",
      barre: "bg-[color:var(--secteur-conseil-gamme)]",
    },
  },
  "bistrot-gamme": {
    accent: {
      bord: "hover:border-[color:var(--secteur-bistrot-gamme)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-bistrot-gamme)]",
      puce: "border-[color:var(--secteur-bistrot-gamme)] text-[color:var(--secteur-bistrot-gamme)]",
      barre: "bg-[color:var(--secteur-bistrot-gamme)]",
    },
  },
  "ecommerce-gamme": {
    accent: {
      bord: "hover:border-[color:var(--secteur-ecommerce-gamme)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-ecommerce-gamme)]",
      puce: "border-[color:var(--secteur-ecommerce-gamme)] text-[color:var(--secteur-ecommerce-gamme)]",
      barre: "bg-[color:var(--secteur-ecommerce-gamme)]",
    },
  },
  "boutique-mono": {
    accent: {
      bord: "hover:border-[color:var(--secteur-boutique-mono)]",
      halo: "bg-transparent",
      texte: "text-[color:var(--secteur-boutique-mono)]",
      puce: "border-[color:var(--secteur-boutique-mono)] text-[color:var(--secteur-boutique-mono)]",
      barre: "bg-[color:var(--secteur-boutique-mono)]",
    },
  },
};

export function accentsDe(d: Pick<ScenarioDefinition, "code" | "sector">): AccentSecteur {
  return IDENTITES_SCENARIO[d.code]?.accent ?? ACCENTS_SECTEUR[d.sector];
}

/**
 * LA TEINTE DU MÉTIER, POUR TOUTE LA PARTIE (lot 5A).
 *
 * Une couleur qui dit « quelle entreprise vous êtes » identifie : elle a donc
 * sa place du premier tour au bilan, et pas seulement au catalogue. L'arène
 * expose la teinte du scénario joué sous un seul nom, `--metier`, en posant
 * l'attribut `data-metier` que `globals.css` (bloc « LOT 5A ») associe au
 * jeton du métier.
 *
 * ON NE RECOPIE PAS LA TABLE. Le nom du jeton se LIT de l'accent que le
 * registre déclare déjà : une entrée de plus dans `ACCENTS_SECTEUR` ou dans
 * `IDENTITES_SCENARIO`, et la teinte de la partie suit sans rien d'autre à
 * écrire. Un test vérifie que chaque scénario du registre trouve sa teinte et
 * que `globals.css` la déclare.
 */
export function teinteDuMetier(d: Pick<ScenarioDefinition, "code" | "sector">): string {
  const trouve = accentsDe(d).texte.match(/--secteur-([a-z-]+)/);
  if (!trouve) throw new Error(`Aucune teinte de métier pour le scénario ${d.code}`);
  return trouve[1]!;
}

/**
 * Les titres du registre s'écrivent « NOVA · Prenez les commandes » : le nom
 * de l'entreprise, puis ce qu'on y fait. Les deux ne se lisent pas au même
 * endroit, d'où ces deux lectures.
 */
export function couperTitre(titre: string): { nom: string; promesse: string | null } {
  const [nom, ...suite] = titre.split("·");
  return { nom: nom!.trim(), promesse: suite.length > 0 ? suite.join("·").trim() : null };
}

export function nomEntreprise(d: ScenarioDefinition): string {
  return couperTitre(d.title).nom;
}

export function promesseEntreprise(d: ScenarioDefinition): string | null {
  return couperTitre(d.title).promesse;
}

/**
 * Le surtitre de l'écran de jeu.
 *
 * Une partie lancée seul nomme l'équipe d'après l'entreprise : le surtitre
 * « Business Arena · NOVA · Prenez les commandes » se lisait alors au dessus
 * d'un titre « NOVA », et le nom apparaissait deux fois à trois centimètres
 * d'intervalle. En classe, où l'équipe s'appelle « Équipe 3 », le nom de
 * l'entreprise est au contraire une information. On ne le retire donc que
 * lorsqu'il répète le titre.
 */
export function surtitreDePartie(titreScenario: string, nomEquipe: string): string {
  const { nom, promesse } = couperTitre(titreScenario);
  const repete = nom.localeCompare(nomEquipe.trim(), "fr", { sensitivity: "base" }) === 0;
  const morceaux = repete ? [promesse] : [nom, promesse];
  // LA MARQUE N'EST PAS DANS LE SURTITRE DU JEU. Le logo est juste au-dessus,
  // dans la barre : « BUSINESS ARENA · NOVA · PRENEZ LES COMMANDES » repassait
  // sur deux lignes en capitales espacées sur un téléphone, pour dire une fois
  // de plus où l'on est. Le surtitre nomme la partie, et rien d'autre.
  return morceaux.filter((m): m is string => Boolean(m)).join(" · ");
}
