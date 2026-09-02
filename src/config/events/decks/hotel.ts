import type { EventCardDef } from "../cards";

/** Deck du scénario HÔTEL — voir cards.ts. */
export const HOTEL_CARDS: EventCardDef[] = [
  {
    code: "hotel_evenement_local",
    title: "Grand événement en ville",
    flavor:
      "Un salon professionnel investit le parc des expositions. Toutes les chambres de l'agglomération sont demandées.",
    effectLabel: "Demande globale +22 % ce tour",
    conceptHint:
      "Quand la demande dépasse la capacité, le prix devient le seul levier : c'est là que se gagne une saison.",
    category: "market",
    emoji: "🎪",
    scope: "market",
  },
  {
    code: "hotel_avis_negatif",
    title: "Volée d'avis négatifs",
    flavor:
      "Trois commentaires cinglants sur la propreté en une semaine. Votre note passe sous la barre des 7.",
    effectLabel: "Capacité commerciale −10 % pendant 2 tours (un établissement tiré au sort)",
    conceptHint:
      "En hôtellerie, la réputation est un actif : elle se dégrade vite et se reconstruit lentement.",
    category: "internal",
    emoji: "⭐",
    scope: "team",
  },
  {
    code: "hotel_commission_ota",
    title: "La plateforme augmente sa commission",
    flavor:
      "Un courriel laconique : la commission passe de 15 à 18 %. À prendre ou à quitter le référencement.",
    effectLabel: "Coût variable par nuitée +16 % pendant 2 tours",
    conceptHint:
      "Chaque nuitée vendue par la plateforme rapporte moins : votre marge unitaire fond sans que le prix affiché bouge.",
    category: "macro",
    emoji: "💳",
    scope: "market",
  },
  {
    code: "hotel_greve_transports",
    title: "Grève des transports",
    flavor:
      "Plus un train, plus un avion pendant huit jours. Les déplacements professionnels sont tous annulés.",
    effectLabel: "Demande de la clientèle affaires −28 % ce tour",
    conceptHint:
      "Un hôtel qui ne vit que d'une clientèle meurt avec elle : la diversification des segments est une assurance.",
    category: "macro",
    emoji: "🚫",
    scope: "market",
  },
  {
    code: "hotel_panne_chaudiere",
    title: "Panne de chaudière",
    flavor:
      "Un étage entier sans eau chaude en plein mois de février. Le chauffagiste parle de trois jours, au mieux.",
    effectLabel: "Capacité −20 % ce tour (un établissement tiré au sort)",
    conceptHint:
      "La maintenance était-elle au niveau ? Les chambres condamnées ce soir ne se revendront jamais.",
    category: "internal",
    emoji: "🔥",
    scope: "team",
  },
  {
    code: "hotel_meteo_radieuse",
    title: "Été indien",
    flavor:
      "Trois semaines de soleil hors saison. Les réservations de dernière minute explosent sur toute la côte.",
    effectLabel: "Demande touristique +28 % ce tour",
    conceptHint:
      "La demande de dernière minute se capte au prix fort, encore faut-il ne pas avoir tout bradé un mois plus tôt.",
    category: "market",
    emoji: "☀️",
    scope: "market",
  },
  {
    code: "hotel_energie",
    title: "Flambée de l'énergie",
    flavor:
      "Le nouveau contrat de fourniture arrive : le gaz et l'électricité ont pris 40 %. Chauffer, laver, cuisiner coûte soudain une fortune.",
    effectLabel: "Coût variable par nuitée +22 % pendant 2 tours",
    conceptHint:
      "Une charge variable qui grimpe déplace mécaniquement le taux d'occupation d'équilibre vers le haut.",
    category: "macro",
    emoji: "⚡",
    scope: "market",
  },
  {
    code: "hotel_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Les banques durcissent leurs conditions sur tout le secteur hôtelier, jugé trop cyclique.",
    effectLabel: "Taux d'intérêt ×1,45 pendant 2 tours",
    conceptHint:
      "Un hôtel est financé par de la dette longue : une hausse des taux se paie sur des années.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "hotel_degat_des_eaux",
    title: "Dégât des eaux",
    flavor:
      "Une canalisation lâche au troisième étage. Douze chambres sont hors service, les plafonds du dessous sont à refaire.",
    effectLabel: "Capacité −32 % et coût variable +12 % ce tour (un établissement ciblé)",
    conceptHint:
      "C'est le sinistre type de la multirisque hôtelière : la perte d'exploitation coûte plus cher que les travaux.",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "hotel_cyber_reservation",
    title: "Panne du moteur de réservation",
    flavor:
      "Le prestataire est victime d'une attaque. Pendant quatre jours, plus aucune réservation en ligne n'arrive.",
    effectLabel: "Capacité commerciale −25 % ce tour (un établissement ciblé)",
    conceptHint:
      "Dépendre d'un outil unique, c'est lui confier son chiffre d'affaires : la formule tous risques le couvre.",
    category: "internal",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "hotel_etoile_supplementaire",
    title: "Classement révisé à la hausse",
    flavor:
      "L'inspection Atout France salue vos investissements. Une étoile de plus sur la façade.",
    effectLabel: "Capacité commerciale +6 % pendant 2 tours (un établissement ciblé)",
    conceptHint:
      "L'entretien et la rénovation ne sont pas des charges subies : ils achètent du pouvoir de fixer les prix.",
    category: "market",
    emoji: "✨",
    scope: "team",
  },
  {
    code: "hotel_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Vos taux d'occupation l'ont rassuré. Il réaménage l'échéancier du crédit immobilier.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (un établissement ciblé)",
    conceptHint:
      "Un actif hôtelier bien exploité rassure : la garantie, c'est la trajectoire, pas seulement les murs.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "hotel_groupe_impromptu",
    title: "Groupe de dernière minute",
    flavor:
      "Un car de 40 personnes cherche un toit à 21 h après une panne sur l'autoroute. Le guide a votre numéro.",
    effectLabel:
      "+400 nuitées (échelle trimestre) vendues d'office ce tour, réglées comptant, dans la limite des chambres libres",
    conceptHint:
      "L'aubaine ne profite qu'à ceux qui ont gardé des chambres disponibles : tout brader tôt a un coût caché.",
    category: "market",
    emoji: "🚌",
    scope: "team",
  },
  {
    code: "hotel_festival",
    title: "Festival d'été",
    flavor:
      "La ville accueille un festival de musique pour la première fois. Quarante mille visiteurs annoncés.",
    effectLabel: "Demande globale +30 % ce tour",
    conceptHint:
      "Une nuit complète à prix fort vaut trois nuits bradées : le yield management se joue sur ces semaines-là.",
    category: "market",
    emoji: "🎸",
    scope: "market",
  },
  {
    code: "hotel_major_breakdown",
    title: "Panne de la climatisation centrale",
    flavor:
      "Le groupe froid central rend l'âme en pleine saison. Chambres étouffantes, clients relogés : deux tours pour installer un nouveau système.",
    effectLabel:
      "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Risque opérationnel & maintenance préventive",
    category: "internal",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "hotel_tech_obsolescence",
    title: "Domotique vieillissante",
    flavor:
      "Les serrures connectées et le système de réservation affichent leur âge. Les pannes se multiplient et la maintenance coûte de plus en plus cher.",
    effectLabel:
      "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Cycle de vie des actifs & veille technologique",
    category: "internal",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "hotel_used_equipment_deal",
    title: "Mobilier hôtelier de reprise",
    flavor:
      "Un hôtel de charme en liquidation cède son mobilier haut de gamme : literie, luminaires et équipements de salle de bains, quasi neufs.",
    effectLabel: "Disponibilité +12 % ce tour (équipe ciblée)",
    conceptHint: "Décision d'investissement & coût d'opportunité",
    category: "internal",
    emoji: "🏭",
    scope: "team",
  },
];
