import type { EventCardDef } from "../cards";

/** Deck du scénario RESTAURANT — voir cards.ts. */
export const BISTROT_CARDS: EventCardDef[] = [
  {
    code: "bistrot_avis_viral",
    title: "Le plat qui fait le tour des réseaux",
    flavor:
      "Une photo de votre dessert dépasse les 200 000 vues. Le téléphone des réservations ne s'arrête plus.",
    effectLabel: "Demande du soir +30 % ce tour",
    conceptHint:
      "Refuser du monde faute de places ou de brigade, c'est transformer un succès en clients perdus.",
    category: "market",
    emoji: "📸",
    scope: "market",
  },
  {
    code: "bistrot_inspection",
    title: "Contrôle sanitaire",
    flavor:
      "Deux inspecteurs, un jeudi à 11 h 30. Le rapport mentionne la chaîne du froid et impose des mises aux normes immédiates.",
    effectLabel: "Capacité de service −18 % ce tour (une table tirée au sort)",
    conceptHint:
      "L'hygiène n'est pas une charge optionnelle : ce qu'on économise dessus se paie en fermeture.",
    category: "internal",
    emoji: "🧾",
    scope: "team",
  },
  {
    code: "bistrot_panne_froid",
    title: "Panne de la chambre froide",
    flavor:
      "Le groupe a lâché pendant le week-end. Lundi matin, tout ce qui était stocké part à la benne.",
    effectLabel: "Capacité −15 % et coût matières +14 % ce tour (une table tirée au sort)",
    conceptHint:
      "En restauration, la marchandise perdue est payée deux fois : à l'achat, puis en service annulé.",
    category: "internal",
    emoji: "❄️",
    scope: "team",
  },
  {
    code: "bistrot_bureaux_vides",
    title: "Les bureaux se vident",
    flavor:
      "Deux entreprises du quartier passent au télétravail quatre jours sur cinq. Le service du midi s'effondre.",
    effectLabel: "Demande des déjeuners d'affaires −25 % ce tour",
    conceptHint:
      "Le midi paie le loyer, le soir fait la marge : perdre un service, c'est perdre l'équilibre du modèle.",
    category: "market",
    emoji: "🏢",
    scope: "market",
  },
  {
    code: "bistrot_commission_livraison",
    title: "La plateforme relève sa commission",
    flavor:
      "30 % sur chaque commande livrée, désormais. Sortir du référencement, c'est perdre un quart du volume.",
    effectLabel: "Coût variable par couvert +10 % pendant 2 tours",
    conceptHint:
      "Un canal qui apporte du volume mais dévore la marge : le chiffre d'affaires n'est pas le résultat.",
    category: "macro",
    emoji: "🛵",
    scope: "market",
  },
  {
    code: "bistrot_matieres_premieres",
    title: "Flambée du beurre et de la viande",
    flavor:
      "Le grossiste annonce +24 % sur la moitié de votre carte. Réimprimer les menus ne suffira pas.",
    effectLabel: "Coût matières +24 % pendant 2 tours",
    conceptHint:
      "Le ratio matières dérape : augmenter le ticket, réduire les portions ou changer la carte : il faut choisir.",
    category: "macro",
    emoji: "🥩",
    scope: "market",
  },
  {
    code: "bistrot_terrasse",
    title: "Terrasse plein soleil",
    flavor:
      "Trois semaines de beau temps et la terrasse ne désemplit pas, midi comme soir.",
    effectLabel: "Demande globale +15 % ce tour",
    conceptHint:
      "Les places en plus ne servent à rien sans la brigade pour les servir : la capacité est double.",
    category: "market",
    emoji: "🌞",
    scope: "market",
  },
  {
    code: "bistrot_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Les banques classent la restauration en risque élevé. Votre autorisation de découvert est révisée à la baisse.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un métier à faible marge supporte mal le coût du découvert : la trésorerie se pilote au jour le jour.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "bistrot_degat_des_eaux",
    title: "Dégât des eaux en cuisine",
    flavor:
      "Une canalisation cède sous le passe. Cuisine inondée, salle fermée le temps du séchage.",
    effectLabel: "Capacité −35 % et coût matières +10 % ce tour (une table ciblée)",
    conceptHint:
      "La perte d'exploitation est l'essentiel du dommage : c'est elle que couvre la formule étendue.",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "bistrot_fermeture_administrative",
    title: "Fermeture administrative",
    flavor:
      "Quinze jours de fermeture prononcés après le contrôle. L'arrêté est affiché sur la porte, visible de toute la rue.",
    effectLabel: "Capacité −45 % ce tour (une table ciblée)",
    conceptHint:
      "Les salaires et le loyer continuent de courir : c'est la définition même d'une charge de structure.",
    category: "internal",
    emoji: "🚷",
    scope: "team",
  },
  {
    code: "bistrot_guide_gastronomique",
    title: "Cité dans le guide",
    flavor:
      "Une ligne dans le guide régional, et le mot « générosité ». Le carnet de réservations se remplit sur six semaines.",
    effectLabel: "Capacité commerciale +8 % pendant 2 tours (une table ciblée)",
    conceptHint:
      "Le budget qualité paie avec retard, mais il paie : la réputation est un investissement à rendement différé.",
    category: "market",
    emoji: "📕",
    scope: "team",
  },
  {
    code: "bistrot_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Vos ratios l'ont convaincu. Il rallonge le crédit d'équipement et desserre le découvert.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une table ciblée)",
    conceptHint:
      "Un ratio matières maîtrisé se lit dans les comptes : c'est ce que regarde d'abord un banquier.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "bistrot_banquet_surprise",
    title: "Banquet de dernière minute",
    flavor:
      "Un traiteur vient de faire faillite à trois jours d'un repas de 220 personnes. La famille vous appelle en catastrophe.",
    effectLabel:
      "+220 couverts (échelle trimestre) servis d'office ce tour, réglés comptant, dans la limite de ce que vous pouvez produire",
    conceptHint:
      "Dire oui suppose des denrées, une brigade et de la place : trois contraintes, une seule opportunité.",
    category: "market",
    emoji: "🥂",
    scope: "team",
  },
  {
    code: "bistrot_festival_ville",
    title: "Fête de la ville",
    flavor:
      "Trois jours de festivités dans le centre, avec votre rue au cœur du parcours.",
    effectLabel: "Demande globale +25 % ce tour",
    conceptHint:
      "Sur-préparer coûte le prix des denrées jetées, sous-préparer coûte les clients refusés. Où placer le curseur ?",
    category: "market",
    emoji: "🎉",
    scope: "market",
  },
];
