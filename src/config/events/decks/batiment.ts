import type { EventCardDef } from "../cards";

/** Deck du scénario BÂTIMENT (rénovation) — voir cards.ts. */
export const BATIMENT_CARDS: EventCardDef[] = [
  {
    code: "batiment_aide_renovation",
    title: "Coup de pouce à la rénovation",
    flavor:
      "Un dispositif d'aide à la rénovation énergétique est reconduit. Le téléphone du bureau ne s'arrête plus.",
    effectLabel: "Demande des particuliers +32 % pendant 2 tours",
    conceptHint:
      "Une demande qui gonfle d'un coup teste d'abord votre capacité, pas votre force commerciale.",
    category: "macro",
    emoji: "🏠",
    scope: "market",
  },
  {
    code: "batiment_penurie_materiaux",
    title: "Pénurie de matériaux",
    flavor:
      "Le négoce annonce huit semaines de délai sur l'isolant et une hausse immédiate des tarifs.",
    effectLabel: "Coût des matériaux +22 % pendant 2 tours",
    conceptHint:
      "Les devis signés le sont à prix ferme : la hausse se prend entièrement sur votre marge.",
    category: "macro",
    emoji: "📦",
    scope: "market",
  },
  {
    code: "batiment_intemperies",
    title: "Intempéries",
    flavor:
      "Trois semaines de pluie et de gel. Les chantiers extérieurs sont à l'arrêt, les équipes attendent au dépôt.",
    effectLabel: "Disponibilité des chantiers −18 % ce tour",
    conceptHint:
      "Les compagnons sont payés pendant l'arrêt : une journée d'intempérie coûte le salaire sans la recette.",
    category: "market",
    emoji: "🌧️",
    scope: "market",
  },
  {
    code: "batiment_appel_offres",
    title: "Vague d'appels d'offres",
    flavor:
      "Trois collectivités lancent leurs programmes de rénovation la même semaine.",
    effectLabel: "Demande des marchés publics +40 % ce tour",
    conceptHint:
      "Du volume à prix tiré, payé très tard : la question n'est pas de gagner, mais de savoir le financer.",
    category: "market",
    emoji: "📋",
    scope: "market",
  },
  {
    code: "batiment_credit_immobilier",
    title: "Le crédit se ferme",
    flavor:
      "Les taux montent, les banques resserrent. Les particuliers reportent leurs projets de travaux.",
    effectLabel: "Demande globale −22 % pendant 2 tours",
    conceptHint:
      "Quand la demande recule, le seuil de rentabilité ne bouge pas : c'est la marge de sécurité qui s'évapore.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "batiment_concurrent_liquide",
    title: "Un confrère dépose le bilan",
    flavor:
      "L'entreprise du bourg voisin ferme ses portes. Ses chantiers en cours cherchent un repreneur.",
    effectLabel: "Demande globale +18 % pendant 2 tours",
    conceptHint:
      "Reprendre le chantier d'un autre, c'est hériter de ses malfaçons : regardez avant de signer.",
    category: "competition",
    emoji: "🚪",
    scope: "market",
  },
  {
    code: "batiment_credit_resserre",
    title: "Resserrement du crédit",
    flavor:
      "Votre chargé d'affaires vous annonce une révision des conditions sur l'ensemble de vos concours.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un métier qui finance trois mois de clients paie chaque point de taux beaucoup plus cher qu'un autre.",
    category: "macro",
    emoji: "📉",
    scope: "market",
  },
  {
    code: "batiment_sinistre_chantier",
    title: "Sinistre sur le chantier",
    flavor:
      "Une canalisation percée inonde deux niveaux. L'expert passe demain, les travaux s'arrêtent.",
    effectLabel: "Disponibilité −26 % et coût des matériaux +16 % pendant 2 tours (une entreprise)",
    conceptHint:
      "C'est exactement ce que couvre une responsabilité civile professionnelle : la prime se juge ici.",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "batiment_vol_materiel",
    title: "Vol d'outillage",
    flavor:
      "La benne du fourgon a été forcée pendant la nuit. Perforateurs, scies et niveaux laser ont disparu.",
    effectLabel: "Disponibilité −30 % ce tour (une entreprise tirée au sort)",
    conceptHint:
      "Sans outillage, les compagnons sont payés à attendre : la capacité est plus fragile qu'elle n'en a l'air.",
    category: "internal",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "batiment_malfacon",
    title: "Reprise en malfaçon",
    flavor:
      "Le carrelage d'un chantier livré se décolle. Il faut tout redéposer, aux frais de l'entreprise.",
    effectLabel: "Coût des matériaux +20 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint:
      "La non-qualité se paie deux fois : la reprise, puis les chantiers que la réputation ne rapporte plus.",
    category: "internal",
    emoji: "🧱",
    scope: "team",
  },
  {
    code: "batiment_reference_prestige",
    title: "Une référence qui compte",
    flavor:
      "Un architecte reconnu publie votre chantier dans une revue régionale. Le téléphone sonne différemment.",
    effectLabel: "Disponibilité commerciale +6 % pendant 2 tours (une entreprise)",
    conceptHint:
      "Dans le bâtiment, la réputation se construit lentement et vaut plus qu'un budget de publicité.",
    category: "market",
    emoji: "🏅",
    scope: "team",
  },
  {
    code: "batiment_banque_conciliante",
    title: "La banque vous suit",
    flavor:
      "Votre plan de trésorerie a convaincu : le découvert est renégocié à des conditions inespérées.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une entreprise)",
    conceptHint:
      "Un dossier chiffré et daté vaut mieux qu'une bonne relation : la banque prête contre un plan.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "batiment_chantier_surprise",
    title: "Un chantier tombe du ciel",
    flavor:
      "Un syndic vous appelle en urgence : l'entreprise retenue s'est désistée la veille du démarrage.",
    effectLabel: "Commande ferme de 180 m² ce tour (une entreprise tirée au sort)",
    conceptHint:
      "Une commande ferme se sert sur la capacité restante : acceptez-la si les équipes suivent, pas avant.",
    category: "market",
    emoji: "📞",
    scope: "team",
  },
  {
    code: "batiment_major_breakdown",
    title: "Immobilisation de l'engin principal",
    flavor:
      "La mini-grue tombe en panne hydraulique. Le chantier est à l'arrêt, les sous-traitants attendent : deux tours pour la remettre en service.",
    effectLabel:
      "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Risque opérationnel & maintenance préventive",
    category: "internal",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "batiment_tech_obsolescence",
    title: "Engins vieillissants",
    flavor:
      "Les engins ne sont plus aux normes antipollution et consomment trop de carburant. Les pièces détachées se raréfient et coûtent plus cher.",
    effectLabel:
      "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Cycle de vie des actifs & veille technologique",
    category: "internal",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "batiment_used_equipment_deal",
    title: "Matériel de chantier d'occasion",
    flavor:
      "Un artisan partant à la retraite cède sa nacelle et son fourgon, révisés et en bon état, à un prix très en dessous du marché.",
    effectLabel: "Disponibilité +12 % ce tour (équipe ciblée)",
    conceptHint: "Décision d'investissement & coût d'opportunité",
    category: "internal",
    emoji: "🏭",
    scope: "team",
  },
];
