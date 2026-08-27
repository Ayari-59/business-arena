import type { EventCardDef } from "../cards";

/** Deck du scénario E-COMMERCE — voir cards.ts. */
export const ECOMMERCE_CARDS: EventCardDef[] = [
  {
    code: "ecom_algo_publicitaire",
    title: "L'algorithme publicitaire change",
    flavor:
      "Du jour au lendemain, vos campagnes coûtent le double pour le même nombre de clics. Personne chez la plateforme ne décroche.",
    effectLabel: "Demande des nouveaux clients −28 % pendant 2 tours",
    conceptHint:
      "Votre trafic dépend d'un intermédiaire qui fixe ses règles seul : la base de clients fidèles est la seule qui vous appartienne.",
    category: "macro",
    emoji: "📉",
    scope: "market",
  },
  {
    code: "ecom_vague_retours",
    title: "Vague de retours",
    flavor:
      "Un lot est arrivé avec des teintes différentes des photos. Un client sur quatre renvoie son colis.",
    effectLabel: "Coût variable par commande +16 % ce tour (une enseigne tirée au sort)",
    conceptHint:
      "Un retour coûte deux transports et une remise en stock, pour zéro chiffre d'affaires : c'est de la marge pure qui part.",
    category: "internal",
    emoji: "📦",
    scope: "team",
  },
  {
    code: "ecom_transporteur",
    title: "Grève des transporteurs",
    flavor:
      "Les dépôts sont bloqués une semaine. Vos colis attendent sur des palettes, vos clients réclament.",
    effectLabel: "Capacité d'expédition −20 % ce tour",
    conceptHint:
      "Vous avez encaissé, mais vous n'avez pas livré : la promesse de délai fait partie du produit.",
    category: "macro",
    emoji: "🚚",
    scope: "market",
  },
  {
    code: "ecom_influenceur",
    title: "Un créateur vous met en avant",
    flavor:
      "Une vidéo de déballage dépasse les deux millions de vues. Le site tient — de justesse.",
    effectLabel: "Demande globale +26 % ce tour",
    conceptHint:
      "Un pic gratuit ne profite qu'à ceux qui ont le stock ET la capacité de préparer : l'aubaine se prépare.",
    category: "market",
    emoji: "🎬",
    scope: "market",
  },
  {
    code: "ecom_marketplace_commission",
    title: "La marketplace relève sa commission",
    flavor:
      "18 % au lieu de 12 %, effectif au prochain cycle. Vous pouvez toujours partir — et perdre le volume avec.",
    effectLabel: "Demande marketplace −18 % pendant 2 tours",
    conceptHint:
      "Un canal qui apporte du volume mais dicte ses conditions : dépendre d'un seul intermédiaire a un prix.",
    category: "competition",
    emoji: "🏷️",
    scope: "market",
  },
  {
    code: "ecom_frais_port",
    title: "Flambée des frais de port",
    flavor:
      "Carburant, taxes, surcharges de saison : le transporteur réévalue toute la grille tarifaire.",
    effectLabel: "Coût variable par commande +20 % pendant 2 tours",
    conceptHint:
      "La marge par commande se comprime sans que le prix affiché bouge : offrir les frais de port n'est jamais gratuit.",
    category: "macro",
    emoji: "⛽",
    scope: "market",
  },
  {
    code: "ecom_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Sans murs ni machines à nantir, votre dossier passe mal. Les conditions se durcissent.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un pure player finance son stock par le découvert : le coût de l'argent devient un coût d'exploitation.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "ecom_rupture_appro",
    title: "Conteneur bloqué au port",
    flavor:
      "Six semaines de mer, puis un contrôle douanier. Les trois références qui font votre chiffre sont dedans.",
    effectLabel: "Capacité d'expédition −18 % ce tour (une enseigne tirée au sort)",
    conceptHint:
      "L'import direct coûte moins cher à l'achat et beaucoup plus cher en délai : le prix n'est pas le seul critère.",
    category: "internal",
    emoji: "🚢",
    scope: "team",
  },
  {
    code: "ecom_cyberattaque",
    title: "Rançongiciel sur la boutique",
    flavor:
      "Le site est hors ligne, la base clients chiffrée. Chaque heure d'indisponibilité est du chiffre d'affaires qui part chez le concurrent.",
    effectLabel: "Capacité −38 % ce tour (une enseigne ciblée)",
    conceptHint:
      "Quand la boutique EST le site, l'assurance cyber n'est pas une option de confort.",
    category: "internal",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "ecom_entrepot",
    title: "Dégât des eaux à l'entrepôt",
    flavor:
      "Une toiture a cédé pendant l'orage. Un tiers du stock est bon pour la benne, le reste sent l'humidité.",
    effectLabel: "Capacité −30 % et coût variable +12 % ce tour (une enseigne ciblée)",
    conceptHint:
      "Le stock d'un pure player est son actif principal : ce que couvre la formule étendue.",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "ecom_presse",
    title: "Sélection dans un magazine déco",
    flavor:
      "Trois de vos produits en double page, avec l'adresse du site. Le trafic organique s'envole — et il est gratuit.",
    effectLabel: "Capacité commerciale +7 % pendant 2 tours (une enseigne ciblée)",
    conceptHint:
      "Un client qui vient sans publicité coûte zéro euro d'acquisition : c'est là que se trouve la vraie marge.",
    category: "market",
    emoji: "📰",
    scope: "team",
  },
  {
    code: "ecom_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Vos taux de retour et votre récurrence client l'ont convaincu. Il finance votre stock de fin d'année.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une enseigne ciblée)",
    conceptHint:
      "Une base de clients qui revient est une garantie : elle vaut mieux qu'un entrepôt à l'actif.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "ecom_commande_b2b",
    title: "Commande d'un aménageur",
    flavor:
      "Un aménageur de bureaux équipe trois plateaux et passe une commande unique de 700 références.",
    effectLabel:
      "+700 commandes (échelle trimestre) vendues d'office ce tour, réglées comptant — dans la limite du stock",
    conceptHint:
      "Une commande B2B ne coûte rien en acquisition : la marge y est mécaniquement supérieure.",
    category: "market",
    emoji: "📋",
    scope: "team",
  },
  {
    code: "ecom_black_friday",
    title: "Black Friday",
    flavor:
      "Quatre jours où le pays entier achète en ligne. Vos concurrents ont déjà lancé leurs campagnes.",
    effectLabel: "Demande globale +45 % ce tour",
    conceptHint:
      "Tout le monde a la même hausse de demande : l'écart se fait sur le stock disponible et la capacité d'expédition.",
    category: "market",
    emoji: "🛒",
    scope: "market",
  },
];
