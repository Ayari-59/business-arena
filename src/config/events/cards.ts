/**
 * Le deck de cartes événements : l'HABILLAGE des événements du moteur (§19).
 * Une carte = un événement (les effets restent des données du scénario) ;
 * la carte porte le récit, la catégorie et le concept qu'elle met en jeu.
 */

export type CardCategory = "market" | "competition" | "internal" | "macro";

export interface EventCardDef {
  code: string;
  title: string;
  flavor: string; // le récit, lu à voix haute en classe
  effectLabel: string; // l'effet mécanique, affiché après le retournement
  conceptHint: string; // ce que la carte teste (mini-leçon)
  category: CardCategory;
  emoji: string;
}

export const CARD_CATEGORIES: Record<CardCategory, { label: string; className: string }> = {
  market: { label: "Marché", className: "border-sky-400/40 text-sky-300" },
  competition: { label: "Concurrence", className: "border-fuchsia-400/40 text-fuchsia-300" },
  internal: { label: "Interne", className: "border-amber-400/40 text-amber-300" },
  macro: { label: "Macro-économie", className: "border-emerald-400/40 text-emerald-300" },
};

export const EVENT_CARDS: EventCardDef[] = [
  {
    code: "raw_material_spike",
    title: "Flambée des matières premières",
    flavor: "Les cours des composants électroniques s'envolent sur les marchés mondiaux.",
    effectLabel: "Coût des matières +20 % pendant 2 tours",
    conceptHint: "Votre marge sur coût variable se comprime : où passe votre seuil de rentabilité ?",
    category: "macro",
    emoji: "📈",
  },
  {
    code: "machine_breakdown",
    title: "Panne machine",
    flavor: "La ligne d'assemblage principale s'arrête net. Le technicien secoue la tête.",
    effectLabel: "Disponibilité machine −15 % ce tour (une entreprise tirée au sort)",
    conceptHint: "La maintenance était-elle à la hauteur ? La capacité est une ressource fragile.",
    category: "internal",
    emoji: "🔧",
  },
  {
    code: "viral_campaign",
    title: "Buzz inattendu",
    flavor: "Une vidéo mettant en scène vos enceintes fait le tour des réseaux.",
    effectLabel: "Demande globale +8 % ce tour",
    conceptHint: "Un pic de demande ne profite qu'à ceux qui ont du stock : anticipation !",
    category: "market",
    emoji: "🚀",
  },
  {
    code: "competitor_bankruptcy",
    title: "Faillite d'un concurrent régional",
    flavor: "Un acteur historique dépose le bilan. Sa clientèle cherche un nouveau fournisseur.",
    effectLabel: "Demande globale +12 % pendant 2 tours",
    conceptHint: "Une part de marché se prend au moment où elle se libère — pas après.",
    category: "competition",
    emoji: "🏳️",
  },
  {
    code: "economic_downturn",
    title: "Conjoncture morose",
    flavor: "La consommation des ménages recule, les achats plaisir sont reportés.",
    effectLabel: "Demande globale −10 % pendant 2 tours",
    conceptHint: "Votre marge de sécurité absorbe-t-elle une baisse de 10 % des ventes ?",
    category: "macro",
    emoji: "🌧️",
  },
  {
    code: "student_fair",
    title: "Salon étudiant",
    flavor: "Le grand salon de la rentrée met les enceintes nomades sous les projecteurs.",
    effectLabel: "Demande du segment Étudiants +25 % ce tour",
    conceptHint: "Un segment élastique au prix : la bonne offre au bon moment.",
    category: "market",
    emoji: "🎓",
  },
  {
    code: "premium_trend",
    title: "La mode du haut de gamme",
    flavor: "Un célèbre audiophile ne jure plus que par le son de qualité studio.",
    effectLabel: "Demande du segment Passionnés +30 % ce tour",
    conceptHint: "Le premium se gagne par la qualité perçue, pas par le prix seul.",
    category: "market",
    emoji: "💎",
  },
  {
    code: "rate_hike",
    title: "Hausse des taux directeurs",
    flavor: "La banque centrale serre la vis : le crédit devient cher.",
    effectLabel: "Charges d'intérêts ×1,5 pendant 2 tours",
    conceptHint: "L'effet de levier joue dans les deux sens : dette chère, rentabilité fragile.",
    category: "macro",
    emoji: "🏦",
  },
  {
    code: "rate_cut",
    title: "Détente monétaire",
    flavor: "Les taux baissent : les financements respirent.",
    effectLabel: "Charges d'intérêts ×0,6 pendant 2 tours",
    conceptHint: "Le bon moment pour financer par emprunt… si le projet crée de la valeur.",
    category: "macro",
    emoji: "🕊️",
  },
  {
    code: "supplier_discount",
    title: "Déstockage fournisseur",
    flavor: "Votre fournisseur casse ses prix pour vider ses entrepôts.",
    effectLabel: "Coût des matières −10 % ce tour",
    conceptHint: "Marge sur coût variable élargie : produire plus, ou marger plus ?",
    category: "market",
    emoji: "📦",
  },
  {
    code: "supplier_dispute",
    title: "Litige fournisseur",
    flavor: "Un désaccord contractuel force un approvisionnement en urgence au prix fort.",
    effectLabel: "Coût des matières +15 % ce tour (une entreprise tirée au sort)",
    conceptHint: "Dépendre d'un seul fournisseur est un risque qui se paie.",
    category: "internal",
    emoji: "⚖️",
  },
  {
    code: "cold_wave",
    title: "Vague de froid",
    flavor: "Ateliers ralentis, transports perturbés : l'hiver s'invite dans la production.",
    effectLabel: "Disponibilité machine −10 % ce tour (tout le marché)",
    conceptHint: "Quand tout le monde produit moins, qui a du stock vend.",
    category: "macro",
    emoji: "❄️",
  },
];

export const cardByCode = new Map(EVENT_CARDS.map((c) => [c.code, c]));

/** Cartes tirables manuellement par l'enseignant (portée marché uniquement :
 * une carte « une entreprise au hasard » serait inéquitable en tirage manuel). */
export const TEACHER_DRAWABLE_CODES = EVENT_CARDS.filter(
  (c) => c.code !== "machine_breakdown" && c.code !== "supplier_dispute",
).map((c) => c.code);
