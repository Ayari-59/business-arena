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

export interface AccentSecteur {
  bord: string;
  halo: string;
  texte: string;
  puce: string;
  barre: string;
}

export const ACCENTS_SECTEUR: Record<Sector, AccentSecteur> = {
  industrie: {
    bord: "hover:border-amber-400/50",
    halo: "bg-amber-400/10",
    texte: "text-amber-300",
    puce: "border-amber-400/30 bg-amber-950/30 text-amber-200",
    barre: "bg-amber-400",
  },
  commerce: {
    bord: "hover:border-rose-400/50",
    halo: "bg-rose-400/10",
    texte: "text-rose-300",
    puce: "border-rose-400/30 bg-rose-950/30 text-rose-200",
    barre: "bg-rose-400",
  },
  ecommerce: {
    bord: "hover:border-violet-400/50",
    halo: "bg-violet-400/10",
    texte: "text-violet-300",
    puce: "border-violet-400/30 bg-violet-950/30 text-violet-200",
    barre: "bg-violet-400",
  },
  hotellerie: {
    bord: "hover:border-sky-400/50",
    halo: "bg-sky-400/10",
    texte: "text-sky-300",
    puce: "border-sky-400/30 bg-sky-950/30 text-sky-200",
    barre: "bg-sky-400",
  },
  restauration: {
    bord: "hover:border-orange-400/50",
    halo: "bg-orange-400/10",
    texte: "text-orange-300",
    puce: "border-orange-400/30 bg-orange-950/30 text-orange-200",
    barre: "bg-orange-400",
  },
  services: {
    bord: "hover:border-emerald-400/50",
    halo: "bg-emerald-400/10",
    texte: "text-emerald-300",
    puce: "border-emerald-400/30 bg-emerald-950/30 text-emerald-200",
    barre: "bg-emerald-400",
  },
  abonnement: {
    bord: "hover:border-cyan-400/50",
    halo: "bg-cyan-400/10",
    texte: "text-cyan-300",
    puce: "border-cyan-400/30 bg-cyan-950/30 text-cyan-200",
    barre: "bg-cyan-400",
  },
  batiment: {
    bord: "hover:border-lime-400/50",
    halo: "bg-lime-400/10",
    texte: "text-lime-300",
    puce: "border-lime-400/30 bg-lime-950/30 text-lime-200",
    barre: "bg-lime-400",
  },
  transport: {
    bord: "hover:border-indigo-400/50",
    halo: "bg-indigo-400/10",
    texte: "text-indigo-300",
    puce: "border-indigo-400/30 bg-indigo-950/30 text-indigo-200",
    barre: "bg-indigo-400",
  },
};

export const EMBLEMES_SECTEUR: Record<Sector, string> = {
  industrie: "🔊",
  commerce: "👗",
  ecommerce: "📦",
  hotellerie: "🛎️",
  restauration: "🍽️",
  services: "📊",
  abonnement: "🏋️",
  batiment: "🏗️",
  transport: "🚚",
};

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
  return ["Business Arena", ...morceaux.filter((m): m is string => Boolean(m))].join(" · ");
}

/**
 * La vignette « toutes les fiches » ferme la grille des entreprises. Elle doit
 * FERMER une rangée, pas en ouvrir une : posée après un nombre d'entreprises
 * multiple du nombre de colonnes, elle resterait seule au début d'une rangée
 * vide, décalée à gauche sous trois rangées pleines.
 *
 * Elle occupe donc exactement les cases qui restent : une seule quand il en
 * reste une, la rangée entière quand la précédente est pleine. Le calcul suit
 * le nombre d'entreprises du registre, de sorte qu'une dixième entreprise ne
 * réintroduise pas le décalage.
 *
 * Les classes sont écrites en toutes lettres : Tailwind lit les sources, une
 * classe assemblée à l'exécution n'existe pas.
 */
export function classesVignetteFinale(nombreDEntreprises: number): string {
  const surDeuxColonnes = ["sm:col-span-2", "sm:col-span-1"][nombreDEntreprises % 2]!;
  const surTroisColonnes = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-1"][
    nombreDEntreprises % 3
  ]!;
  return [surDeuxColonnes, surTroisColonnes].join(" ");
}
