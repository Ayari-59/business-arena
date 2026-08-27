import type { EventCardDef } from "../cards";

/** Deck du scénario SERVICES (conseil) — voir cards.ts. */
export const CONSEIL_CARDS: EventCardDef[] = [
  {
    code: "conseil_appel_offres_gagne",
    title: "Vague de marchés publics",
    flavor:
      "Les collectivités notifient leurs marchés d'études avant la clôture budgétaire. Les consultations pleuvent.",
    effectLabel: "Demande du secteur public +40 % ce tour",
    conceptHint:
      "Répondre suppose des consultants disponibles : un carnet plein est une bonne nouvelle qu'on ne peut pas toujours saisir.",
    category: "market",
    emoji: "📑",
    scope: "market",
  },
  {
    code: "conseil_depart_consultant",
    title: "Départ d'un consultant senior",
    flavor:
      "Il pose sa démission un lundi matin, avec deux missions en cours et la confiance de trois clients.",
    effectLabel: "Capacité de production −14 % pendant 2 tours (un cabinet tiré au sort)",
    conceptHint:
      "Dans les services, la capacité part le soir avec les salariés : la politique salariale est une décision industrielle.",
    category: "internal",
    emoji: "🚪",
    scope: "team",
  },
  {
    code: "conseil_gel_budgets",
    title: "Gel des budgets de conseil",
    flavor:
      "Conjoncture incertaine : les directions générales suspendent toutes les dépenses non engagées.",
    effectLabel: "Demande globale −15 % pendant 2 tours",
    conceptHint:
      "Les salaires tombent même quand le carnet est vide : c'est tout le risque d'une structure de coûts rigide.",
    category: "macro",
    emoji: "🧊",
    scope: "market",
  },
  {
    code: "conseil_recommandation",
    title: "Recommandation d'un grand compte",
    flavor:
      "Votre client d'hier vous cite en comité de direction chez un autre groupe. Le téléphone sonne le lendemain.",
    effectLabel: "Demande des grands comptes +35 % ce tour",
    conceptHint:
      "La qualité livrée est le premier canal commercial du conseil : elle rapporte au tour suivant, pas au tour même.",
    category: "market",
    emoji: "🗣️",
    scope: "market",
  },
  {
    code: "conseil_frais_mission",
    title: "Envolée des frais de mission",
    flavor:
      "Train, hôtel, restauration : les tarifs professionnels ont pris 18 % d'un coup sur toutes les destinations.",
    effectLabel: "Frais variables par jour-conseil +18 % pendant 2 tours",
    conceptHint:
      "Des frais refacturés au forfait qui dérapent, ce sont des points de marge perdus sur chaque journée vendue.",
    category: "macro",
    emoji: "🚄",
    scope: "market",
  },
  {
    code: "conseil_reglementation",
    title: "Nouvelle obligation réglementaire",
    flavor:
      "Un décret impose à toutes les entreprises de plus de 250 salariés un audit dans les douze mois. Votre téléphone n'arrête plus.",
    effectLabel: "Demande globale +20 % pendant 2 tours",
    conceptHint:
      "Le marché s'ouvre pour tout le monde en même temps : le gagnant est celui qui a les consultants disponibles.",
    category: "macro",
    emoji: "⚖️",
    scope: "market",
  },
  {
    code: "conseil_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Sans actif à nantir, un cabinet inspire peu les banques. Le découvert est revu à la hausse, celle du prix.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un métier sans immobilisations finance son BFR par le découvert : le poste clients devient le vrai sujet.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "conseil_cabinet_parisien",
    title: "Un cabinet parisien ouvre en ville",
    flavor:
      "Grandes références, tarifs agressifs sur les PME : ils viennent chercher exactement vos clients.",
    effectLabel: "Demande des PME −18 % pendant 2 tours",
    conceptHint:
      "Face à un concurrent mieux armé, s'aligner sur les prix ou se différencier : les deux stratégies ne coûtent pas au même endroit.",
    category: "competition",
    emoji: "🏙️",
    scope: "market",
  },
  {
    code: "conseil_litige_client",
    title: "Litige avec un client",
    flavor:
      "Le livrable est contesté, le solde de la mission bloqué, et l'avocat du client a écrit à votre assureur.",
    effectLabel: "Capacité −20 % et frais variables +15 % pendant 2 tours (un cabinet ciblé)",
    conceptHint:
      "C'est exactement le risque que couvre la responsabilité civile professionnelle : la prime valait-elle son prix ?",
    category: "internal",
    emoji: "⚠️",
    scope: "team",
  },
  {
    code: "conseil_cyberattaque",
    title: "Rançongiciel",
    flavor:
      "Tous les livrables sont chiffrés. Les sauvegardes dataient de trois semaines.",
    effectLabel: "Capacité −28 % ce tour (un cabinet ciblé)",
    conceptHint:
      "Dans un métier dont tout l'actif est immatériel, la donnée EST l'outil de production.",
    category: "internal",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "conseil_prix_de_la_profession",
    title: "Prix de la profession",
    flavor:
      "Votre méthodologie est distinguée par la fédération du conseil. La presse spécialisée relaie.",
    effectLabel: "Capacité commerciale +7 % pendant 2 tours (un cabinet ciblé)",
    conceptHint:
      "L'investissement méthodologique n'apparaît nulle part au bilan : il se lit dans le taux d'occupation.",
    category: "market",
    emoji: "🏆",
    scope: "team",
  },
  {
    code: "conseil_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Votre carnet de commandes signé l'a rassuré. Il finance votre poste clients à des conditions correctes.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (un cabinet ciblé)",
    conceptHint:
      "Un carnet de commandes est une garantie : dans les services, on finance la confiance, pas les murs.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "conseil_mission_urgente",
    title: "Mission d'urgence",
    flavor:
      "Une ETI se retrouve sans directeur financier à trois semaines de la clôture. Elle appelle ce matin.",
    effectLabel:
      "+70 jours-conseil (échelle trimestre) vendus d'office ce tour, réglés comptant, dans la limite des jours disponibles",
    conceptHint:
      "Un cabinet à 100 % d'occupation ne peut pas dire oui : garder de la marge de manœuvre a une valeur.",
    category: "market",
    emoji: "🚨",
    scope: "team",
  },
  {
    code: "conseil_salon_professionnel",
    title: "Salon professionnel régional",
    flavor:
      "Deux jours de stands et de conférences, où se croisent tous les décideurs de la région.",
    effectLabel: "Demande globale +18 % ce tour",
    conceptHint:
      "La prospection est une charge immédiate pour un chiffre d'affaires différé : c'est un pari, pas une dépense.",
    category: "market",
    emoji: "🤝",
    scope: "market",
  },
];
