/**
 * Le deck de cartes événements : l'HABILLAGE des événements du moteur (§19).
 * Une carte = un événement (les effets restent des données du scénario) ;
 * la carte porte le récit, la catégorie et le concept qu'elle met en jeu.
 */

import { BOUTIQUE_CARDS } from "./decks/boutique";
import { HOTEL_CARDS } from "./decks/hotel";
import { BISTROT_CARDS } from "./decks/bistrot";
import { CONSEIL_CARDS } from "./decks/conseil";
import { ECOMMERCE_CARDS } from "./decks/ecommerce";
import { FITNESS_CARDS } from "./decks/fitness";

export type CardCategory = "market" | "competition" | "internal" | "macro";

export interface EventCardDef {
  code: string;
  title: string;
  flavor: string; // le récit, lu à voix haute en classe
  effectLabel: string; // l'effet mécanique, affiché après le retournement
  conceptHint: string; // ce que la carte teste (mini-leçon)
  category: CardCategory;
  emoji: string;
  /** "market" : toute la classe · "team" : une équipe ciblée. */
  scope: "market" | "team";
}

export const CARD_CATEGORIES: Record<CardCategory, { label: string; className: string }> = {
  market: { label: "Marché", className: "border-sky-400/40 text-sky-300" },
  competition: { label: "Concurrence", className: "border-fuchsia-400/40 text-fuchsia-300" },
  internal: { label: "Interne", className: "border-amber-400/40 text-amber-300" },
  macro: { label: "Macro-économie", className: "border-emerald-400/40 text-emerald-300" },
};

/** Deck du scénario NOVA (industrie). */
const NOVA_CARDS: EventCardDef[] = [
  {
    code: "raw_material_spike",
    title: "Flambée des matières premières",
    flavor: "Les cours des composants électroniques s'envolent sur les marchés mondiaux.",
    effectLabel: "Coût des matières +20 % pendant 2 tours",
    conceptHint: "Votre marge sur coût variable se comprime : où passe votre seuil de rentabilité ?",
    category: "macro",
    emoji: "📈",
    scope: "market",
  },
  {
    code: "machine_breakdown",
    title: "Panne machine",
    flavor: "La ligne d'assemblage principale s'arrête net. Le technicien secoue la tête.",
    effectLabel: "Disponibilité machine −15 % ce tour (une entreprise tirée au sort)",
    conceptHint: "La maintenance était-elle à la hauteur ? La capacité est une ressource fragile.",
    category: "internal",
    emoji: "🔧",
    scope: "team",
  },
  {
    code: "viral_campaign",
    title: "Buzz inattendu",
    flavor: "Une vidéo mettant en scène vos enceintes fait le tour des réseaux.",
    effectLabel: "Demande globale +8 % ce tour",
    conceptHint: "Un pic de demande ne profite qu'à ceux qui ont du stock : anticipation !",
    category: "market",
    emoji: "🚀",
    scope: "market",
  },
  {
    code: "competitor_bankruptcy",
    title: "Faillite d'un concurrent régional",
    flavor: "Un acteur historique dépose le bilan. Sa clientèle cherche un nouveau fournisseur.",
    effectLabel: "Demande globale +12 % pendant 2 tours",
    conceptHint: "Une part de marché se prend au moment où elle se libère, pas après.",
    category: "competition",
    emoji: "🏳️",
    scope: "market",
  },
  {
    code: "economic_downturn",
    title: "Conjoncture morose",
    flavor: "La consommation des ménages recule, les achats plaisir sont reportés.",
    effectLabel: "Demande globale −10 % pendant 2 tours",
    conceptHint: "Votre marge de sécurité absorbe-t-elle une baisse de 10 % des ventes ?",
    category: "macro",
    emoji: "🌧️",
    scope: "market",
  },
  {
    code: "student_fair",
    title: "Salon étudiant",
    flavor: "Le grand salon de la rentrée met les enceintes nomades sous les projecteurs.",
    effectLabel: "Demande du segment Étudiants +25 % ce tour",
    conceptHint: "Un segment élastique au prix : la bonne offre au bon moment.",
    category: "market",
    emoji: "🎓",
    scope: "market",
  },
  {
    code: "premium_trend",
    title: "La mode du haut de gamme",
    flavor: "Un célèbre audiophile ne jure plus que par le son de qualité studio.",
    effectLabel: "Demande du segment Passionnés +30 % ce tour",
    conceptHint: "Le premium se gagne par la qualité perçue, pas par le prix seul.",
    category: "market",
    emoji: "💎",
    scope: "market",
  },
  {
    code: "rate_hike",
    title: "Hausse des taux directeurs",
    flavor: "La banque centrale serre la vis : le crédit devient cher.",
    effectLabel: "Charges d'intérêts ×1,5 pendant 2 tours",
    conceptHint: "L'effet de levier joue dans les deux sens : dette chère, rentabilité fragile.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "rate_cut",
    title: "Détente monétaire",
    flavor: "Les taux baissent : les financements respirent.",
    effectLabel: "Charges d'intérêts ×0,6 pendant 2 tours",
    conceptHint: "Le bon moment pour financer par emprunt… si le projet crée de la valeur.",
    category: "macro",
    emoji: "🕊️",
    scope: "market",
  },
  {
    code: "supplier_discount",
    title: "Déstockage fournisseur",
    flavor: "Votre fournisseur casse ses prix pour vider ses entrepôts.",
    effectLabel: "Coût des matières −10 % ce tour",
    conceptHint: "Marge sur coût variable élargie : produire plus, ou marger plus ?",
    category: "market",
    emoji: "📦",
    scope: "market",
  },
  {
    code: "supplier_dispute",
    title: "Litige fournisseur",
    flavor: "Un désaccord contractuel force un approvisionnement en urgence au prix fort.",
    effectLabel: "Coût des matières +15 % ce tour (une entreprise tirée au sort)",
    conceptHint: "Dépendre d'un seul fournisseur est un risque qui se paie.",
    category: "internal",
    emoji: "⚖️",
    scope: "team",
  },
  {
    code: "cold_wave",
    title: "Vague de froid",
    flavor: "Ateliers ralentis, transports perturbés : l'hiver s'invite dans la production.",
    effectLabel: "Disponibilité machine −10 % ce tour (tout le marché)",
    conceptHint: "Quand tout le monde produit moins, qui a du stock vend.",
    category: "macro",
    emoji: "❄️",
    scope: "market",
  },
  {
    code: "team_overtime",
    title: "Mobilisation générale",
    flavor: "Toute l'équipe se serre les coudes : l'atelier tourne comme jamais.",
    effectLabel: "Disponibilité machine +8 % ce tour (équipe ciblée)",
    conceptHint: "La capacité n'est pas qu'une machine : c'est aussi un collectif.",
    category: "internal",
    emoji: "💪",
    scope: "team",
  },
  {
    code: "local_supplier_deal",
    title: "Fournisseur local conciliant",
    flavor: "Votre fournisseur historique vous consent un geste commercial.",
    effectLabel: "Coût des matières −8 % ce tour (équipe ciblée)",
    conceptHint: "La relation fournisseur est un actif : elle élargit la marge sur coût variable.",
    category: "internal",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "banker_goodwill",
    title: "Banquier compréhensif",
    flavor: "Votre chargé d'affaires révise vos conditions : il croit en votre plan.",
    effectLabel: "Charges d'intérêts ×0,7 pendant 2 tours (équipe ciblée)",
    conceptHint: "La confiance bancaire se construit : elle se lit dans vos comptes.",
    category: "internal",
    emoji: "🏛️",
    scope: "team",
  },
  {
    code: "bank_penalties",
    title: "Agios et pénalités",
    flavor: "Des incidents de paiement à répétition : la banque facture, et cher.",
    effectLabel: "Charges d'intérêts ×1,4 pendant 2 tours (équipe ciblée)",
    conceptHint: "Une trésorerie mal pilotée coûte deux fois : le découvert, puis la sanction.",
    category: "internal",
    emoji: "🧾",
    scope: "team",
  },
  {
    code: "export_market",
    title: "Ouverture du marché export",
    flavor: "Un distributeur européen référence les enceintes françaises : la demande s'élargit.",
    effectLabel: "Demande globale +15 % pendant 2 tours",
    conceptHint: "Un nouveau marché se sert avec de la capacité : qui peut produire plus, vendra plus.",
    category: "market",
    emoji: "✈️",
    scope: "market",
  },
  {
    code: "natural_disaster",
    title: "Catastrophe naturelle",
    flavor: "Une tempête inonde la zone industrielle : ateliers à l'arrêt, fournisseurs sinistrés.",
    effectLabel: "Disponibilité −28 % et matières +12 % ce tour, sauf pour les assurés",
    conceptHint: "L'assurance échange un coût certain (la prime) contre un risque incertain : c'est un arbitrage d'espérance.",
    category: "macro",
    emoji: "🌪️",
    scope: "market",
  },
  {
    code: "cyberattack",
    title: "Cyberattaque",
    flavor: "Un rançongiciel paralyse la gestion de production : l'atelier tourne au ralenti.",
    effectLabel: "Disponibilité machine −12 % ce tour (équipe ciblée)",
    conceptHint: "La continuité d'activité est un actif invisible, jusqu'au jour où elle manque.",
    category: "internal",
    emoji: "💻",
    scope: "team",
  },
  {
    code: "tight_order",
    title: "Commande à prix serré",
    flavor: "Une centrale d'achat propose 500 unités, à SON prix. À prendre ou à laisser.",
    effectLabel: "+500 unités à 55 €/u imposés (échelle trimestre), dans la limite du stock",
    conceptHint: "55 € couvre-t-il votre coût variable ? Les coûts pertinents décident, pas l'habitude.",
    category: "market",
    emoji: "🏷️",
    scope: "team",
  },
  {
    code: "xxl_order",
    title: "Commande XXL",
    flavor: "Un géant du e-commerce veut 2 500 unités à 61 €. Votre atelier ne suffira pas.",
    effectLabel: "+2 500 unités à 61 €/u (échelle trimestre), sous-traitance possible à 52 €/u",
    conceptHint: "Sous-traiter à 52 pour vendre à 61, ou investir en capacité ? L'arbitrage make or buy en vrai.",
    category: "market",
    emoji: "🏗️",
    scope: "team",
  },
  {
    code: "big_order",
    title: "Commande exceptionnelle",
    flavor: "Une chaîne d'hôtels veut équiper toutes ses chambres, et signe aujourd'hui.",
    effectLabel: "+600 unités (échelle trimestre) vendues d'office ce tour, réglées comptant, dans la limite du stock",
    conceptHint: "Une opportunité ne se saisit qu'avec du stock ou de la capacité disponible : l'anticipation paie.",
    category: "market",
    emoji: "📋",
    scope: "team",
  },
];

/**
 * Deck complet, tous secteurs confondus. Chaque scénario ne pioche que dans
 * SES cartes : le filtre se fait sur les codes d'événements du scénario joué
 * (voir `cardsForEventCodes`), jamais sur cette liste globale.
 */
export const EVENT_CARDS: EventCardDef[] = [
  ...NOVA_CARDS,
  ...BOUTIQUE_CARDS,
  ...HOTEL_CARDS,
  ...BISTROT_CARDS,
  ...CONSEIL_CARDS,
  ...ECOMMERCE_CARDS,
  ...FITNESS_CARDS,
];

export const cardByCode = new Map(EVENT_CARDS.map((c) => [c.code, c]));

/** Cartes « équipe » : ciblent une seule entreprise (tirage par équipe). */
export const TEAM_CARD_CODES = EVENT_CARDS.filter((c) => c.scope === "team").map((c) => c.code);

/** Cartes « marché » tirables pour toute la classe. */
export const TEACHER_DRAWABLE_CODES = EVENT_CARDS.filter((c) => c.scope === "market").map(
  (c) => c.code,
);

/**
 * Les cartes d'un scénario donné, dans l'ordre du deck. On passe les codes
 * d'événements du scénario (ou de son snapshot) plutôt que son code : une
 * partie déjà lancée joue son snapshot, pas la version courante du scénario.
 */
export function cardsForEventCodes(eventCodes: readonly string[]): EventCardDef[] {
  const wanted = new Set(eventCodes);
  return EVENT_CARDS.filter((c) => wanted.has(c.code));
}
