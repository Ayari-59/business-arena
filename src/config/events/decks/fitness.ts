import type { EventCardDef } from "../cards";

/** Deck du scénario ABONNEMENT (salle de sport) — voir cards.ts. */
export const FITNESS_CARDS: EventCardDef[] = [
  {
    code: "fitness_rentree_sportive",
    title: "Vague de bonnes résolutions",
    flavor:
      "Premier lundi de janvier. La file d'attente à l'accueil déborde sur le parking.",
    effectLabel: "Demande du segment « résolutions » +35 % ce tour",
    conceptHint:
      "Ces adhérents-là remplissent la salle et repartent au printemps : les inscrire coûte, les garder rapporte.",
    category: "market",
    emoji: "🎯",
    scope: "market",
  },
  {
    code: "fitness_low_cost",
    title: "Une salle low-cost ouvre en face",
    flavor:
      "19,90 € par mois, ouverte 24 h sur 24, sans personnel. L'affichage est visible depuis votre parking.",
    effectLabel: "Demande globale −16 % pendant 2 tours",
    conceptHint:
      "Face à un concurrent qui casse les prix, s'aligner détruit la marge : reste ce qu'il ne sait pas offrir.",
    category: "competition",
    emoji: "💸",
    scope: "market",
  },
  {
    code: "fitness_panne_parc",
    title: "Panne du parc cardio",
    flavor:
      "Six tapis et quatre vélos hors service en même temps. Le prestataire annonce trois semaines de délai.",
    effectLabel: "Capacité d'accueil −20 % ce tour (une salle tirée au sort)",
    conceptHint:
      "Une machine à l'arrêt se voit tout de suite — et se retrouve dans les avis, puis dans les résiliations.",
    category: "internal",
    emoji: "🔧",
    scope: "team",
  },
  {
    code: "fitness_coach_star",
    title: "Un coach fait le plein",
    flavor:
      "Ses cours collectifs affichent complet trois semaines à l'avance. Les adhérents réorganisent leurs soirées pour venir.",
    effectLabel: "Demande des pratiquants réguliers +30 % ce tour",
    conceptHint:
      "Dans un modèle par abonnement, ce qui retient vaut plus que ce qui attire : un régulier paie tous les trimestres.",
    category: "market",
    emoji: "🏋️",
    scope: "market",
  },
  {
    code: "fitness_energie",
    title: "Flambée de l'énergie",
    flavor:
      "Chauffage, eau chaude, ventilation, machines : la facture trimestrielle prend 28 % d'un coup.",
    effectLabel: "Coût variable par adhérent +28 % pendant 2 tours",
    conceptHint:
      "Une charge qui grimpe quand la salle est vide : l'été, elle tombe sans aucun abonnement pour la couvrir.",
    category: "macro",
    emoji: "⚡",
    scope: "market",
  },
  {
    code: "fitness_teletravail",
    title: "Les entreprises coupent les budgets bien-être",
    flavor:
      "Deux comptes corporate ne renouvellent pas : leurs salariés sont passés en télétravail quatre jours sur cinq.",
    effectLabel: "Demande des contrats entreprises −22 % pendant 2 tours",
    conceptHint:
      "Perdre un contrat corporate, c'est perdre d'un coup ce que trente inscriptions individuelles rapportent.",
    category: "macro",
    emoji: "🏢",
    scope: "market",
  },
  {
    code: "fitness_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Le secteur du fitness est jugé volatil. Votre crédit d'équipement est renégocié à la hausse.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un parc de machines financé à crédit se rembourse même les trimestres où la salle est vide.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "fitness_canicule",
    title: "Canicule",
    flavor:
      "38 °C dehors, 31 °C sur le plateau malgré la ventilation. Les créneaux d'après-midi se vident.",
    effectLabel: "Capacité d'accueil −12 % ce tour",
    conceptHint:
      "L'été cumule tout : moins d'adhérents, plus d'énergie, et des charges qui ne bougent pas.",
    category: "market",
    emoji: "🥵",
    scope: "market",
  },
  {
    code: "fitness_accident",
    title: "Accident sur le plateau",
    flavor:
      "Un adhérent se blesse sous une barre mal réglée. Constat, arrêt de travail, courrier d'avocat.",
    effectLabel: "Capacité −22 % et coût variable +14 % pendant 2 tours (une salle ciblée)",
    conceptHint:
      "C'est exactement ce que couvre la responsabilité civile exploitant : la prime valait-elle son prix ?",
    category: "internal",
    emoji: "⚠️",
    scope: "team",
  },
  {
    code: "fitness_degat_des_eaux",
    title: "Dégât des eaux aux vestiaires",
    flavor:
      "Une canalisation cède un dimanche. Vestiaires et douches condamnés — et sans douches, personne ne vient.",
    effectLabel: "Capacité −34 % ce tour (une salle ciblée)",
    conceptHint:
      "La perte d'exploitation dépasse largement le coût des travaux : c'est elle qu'il faut assurer.",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "fitness_reportage",
    title: "Reportage de la presse locale",
    flavor:
      "Une page entière sur votre programme seniors, avec photos et témoignages. Le téléphone sonne toute la semaine.",
    effectLabel: "Capacité commerciale +8 % pendant 2 tours (une salle ciblée)",
    conceptHint:
      "Ces adhérents-là arrivent sans budget d'acquisition — et ce sont souvent les plus fidèles.",
    category: "market",
    emoji: "📰",
    scope: "team",
  },
  {
    code: "fitness_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Votre taux de rétention l'a rassuré : des abonnements récurrents valent mieux qu'un carnet de commandes.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une salle ciblée)",
    conceptHint:
      "Un revenu récurrent est la meilleure garantie qui soit : il est prévisible, donc finançable.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "fitness_contrat_surprise",
    title: "Contrat d'entreprise inattendu",
    flavor:
      "Une PME de 200 salariés cherche une salle partenaire pour janvier. Elle signe cette semaine.",
    effectLabel:
      "+200 adhérents (échelle trimestre) inscrits d'office ce tour, réglés comptant — dans la limite de vos places",
    conceptHint:
      "Encore faut-il pouvoir les accueillir : sur-vendre sans encadrement fait fuir les adhérents en place.",
    category: "market",
    emoji: "📋",
    scope: "team",
  },
  {
    code: "fitness_marathon",
    title: "Marathon de la ville",
    flavor:
      "Douze mille inscrits, et trois mois pour se préparer. Toute la ville se met à courir.",
    effectLabel: "Demande globale +28 % ce tour",
    conceptHint:
      "Un afflux ponctuel dans un modèle par abonnement : ce qui compte, c'est combien seront encore là en juin.",
    category: "market",
    emoji: "🏃",
    scope: "market",
  },
];
