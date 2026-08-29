import type { EventCardDef } from "../cards";

/** Deck du scénario TRANSPORT (routier régional) — voir cards.ts. */
export const TRANSPORT_CARDS: EventCardDef[] = [
  {
    code: "transport_gazole",
    title: "Le gazole s'envole",
    flavor:
      "Dix-huit pour cent en six semaines à la pompe. Personne dans l'entreprise n'a rien décidé.",
    effectLabel: "Coût du carburant +18 % pendant 2 tours",
    conceptHint:
      "Une hausse du coût variable remonte mécaniquement le seuil : combien de palettes en plus faut-il charger ?",
    category: "macro",
    emoji: "⛽",
    scope: "market",
  },
  {
    code: "transport_penurie_chauffeurs",
    title: "Pénurie de chauffeurs",
    flavor:
      "Deux conducteurs partent chez un concurrent qui paie mieux. Les annonces restent sans réponse.",
    effectLabel: "Disponibilité de la flotte −14 % pendant 2 tours",
    conceptHint:
      "Un camion sans chauffeur ne roule pas : la contrainte n'est pas toujours celle qu'on amortit.",
    category: "market",
    emoji: "🧑‍✈️",
    scope: "market",
  },
  {
    code: "transport_pic_ecommerce",
    title: "Pic de fin d'année",
    flavor:
      "Les entrepôts de la distribution tournent jour et nuit. Tout le monde cherche de la capacité.",
    effectLabel: "Demande de la distribution +35 % ce tour",
    conceptHint:
      "Un pic ne se sert qu'avec une flotte disponible : la capacité se décide un trimestre à l'avance.",
    category: "market",
    emoji: "🎁",
    scope: "market",
  },
  {
    code: "transport_blocage_routier",
    title: "Blocage routier",
    flavor:
      "Les accès à la métropole sont filtrés pendant quatre jours. Les tournées partent, tournent et reviennent.",
    effectLabel: "Disponibilité de la flotte −22 % ce tour",
    conceptHint:
      "Le gazole a été brûlé, les chauffeurs payés, et rien n'a été livré : la perte est intégrale.",
    category: "market",
    emoji: "🚧",
    scope: "market",
  },
  {
    code: "transport_relocalisation",
    title: "Une usine se réimplante",
    flavor:
      "Un industriel rapatrie sa production dans la région et cherche un transporteur local.",
    effectLabel: "Demande des industriels +22 % pendant 2 tours",
    conceptHint:
      "Un contrat régulier vaut mieux qu'un beau prix ponctuel : il remplit les camions tous les jours.",
    category: "market",
    emoji: "🏭",
    scope: "market",
  },
  {
    code: "transport_guerre_des_prix",
    title: "Guerre des prix sur la bourse",
    flavor:
      "Des transporteurs de l'Est cassent les tarifs sur la bourse de fret. Les lots partent à des prix impossibles.",
    effectLabel: "Demande de l'affrètement −25 % pendant 2 tours",
    conceptHint:
      "S'aligner sur un prix qui ne couvre pas la structure remplit les camions et vide la trésorerie.",
    category: "competition",
    emoji: "💸",
    scope: "market",
  },
  {
    code: "transport_credit_resserre",
    title: "Resserrement du crédit",
    flavor:
      "Le renouvellement de la flotte se négocie soudain à des conditions bien moins favorables.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un métier qui immobilise un million en camions ressent chaque point de taux dans son résultat.",
    category: "macro",
    emoji: "📉",
    scope: "market",
  },
  {
    code: "transport_accident",
    title: "Accident de circulation",
    flavor:
      "Un porteur est immobilisé, la marchandise est endommagée, le chauffeur est indemne. L'expert passe jeudi.",
    effectLabel: "Disponibilité −24 % et coût variable +12 % pendant 2 tours (une entreprise)",
    conceptHint:
      "C'est ce que couvre l'assurance marchandise transportée : la prime se juge le jour du sinistre.",
    category: "internal",
    emoji: "🚨",
    scope: "team",
  },
  {
    code: "transport_panne_flotte",
    title: "Panne en série",
    flavor:
      "Trois porteurs immobilisés la même semaine. Le garage annonce quinze jours de délai sur les pièces.",
    effectLabel: "Disponibilité de la flotte −28 % ce tour (une entreprise tirée au sort)",
    conceptHint:
      "L'entretien différé coûte moins cher aujourd'hui et beaucoup plus cher le jour de la panne.",
    category: "internal",
    emoji: "🔧",
    scope: "team",
  },
  {
    code: "transport_vol_remorque",
    title: "Vol d'une remorque",
    flavor:
      "Une remorque chargée a disparu du parking de nuit. La marchandise appartenait à votre meilleur client.",
    effectLabel: "Disponibilité −20 % ce tour (une entreprise tirée au sort)",
    conceptHint:
      "Le préjudice dépasse la remorque : c'est la confiance d'un client qui fait un tiers du trafic.",
    category: "internal",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "transport_label_qualite",
    title: "Label de qualité obtenu",
    flavor:
      "Votre taux de livraisons à l'heure vous vaut une certification que vos clients industriels réclamaient.",
    effectLabel: "Disponibilité commerciale +7 % pendant 2 tours (une entreprise)",
    conceptHint:
      "Dans le transport, la ponctualité est le produit : elle se vend plus cher qu'un rabais ne rapporte.",
    category: "market",
    emoji: "🏅",
    scope: "team",
  },
  {
    code: "transport_banque_conciliante",
    title: "La banque vous suit",
    flavor:
      "Votre plan de trésorerie a convaincu : les conditions du découvert sont revues à la baisse.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une entreprise)",
    conceptHint:
      "Un dossier chiffré et daté vaut mieux qu'une bonne relation : la banque prête contre un plan.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "transport_lot_surprise",
    title: "Un lot de dernière minute",
    flavor:
      "Un chargeur appelle à seize heures : son transporteur habituel s'est décommandé pour demain matin.",
    effectLabel: "Commande ferme de 1 400 palettes ce tour (une entreprise tirée au sort)",
    conceptHint:
      "Une commande ferme se sert sur la capacité restante : elle n'a de valeur que si les camions sont libres.",
    category: "market",
    emoji: "📞",
    scope: "team",
  },
];
