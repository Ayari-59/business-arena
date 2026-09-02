import type { EventCardDef } from "../cards";

/** Deck du scénario BOUTIQUE (commerce de détail) — voir cards.ts. */
export const BOUTIQUE_CARDS: EventCardDef[] = [
  {
    code: "boutique_travaux_voirie",
    title: "Travaux dans la rue",
    flavor:
      "La mairie éventre la chaussée pour dix-huit mois de travaux. Les barrières Vauban commencent devant votre vitrine.",
    effectLabel: "Demande globale −18 % pendant 2 tours",
    conceptHint:
      "Vos charges de structure, elles, ne baissent pas d'un centime : combien d'articles faut-il désormais vendre pour tenir ?",
    category: "market",
    emoji: "🚧",
    scope: "market",
  },
  {
    code: "boutique_influenceur",
    title: "Une influenceuse pousse la porte",
    flavor:
      "Elle filme trois minutes dans vos cabines. La vidéo dépasse le million de vues avant le dîner.",
    effectLabel: "Demande des chalands de passage +30 % ce tour",
    conceptHint:
      "Un pic ne profite qu'à celles qui ont du stock en réserve : l'anticipation vaut mieux que la chance.",
    category: "market",
    emoji: "📱",
    scope: "market",
  },
  {
    code: "boutique_demarque",
    title: "Démarque inconnue",
    flavor:
      "L'inventaire ne tombe pas juste. Entre le vol à l'étalage et les erreurs de caisse, 200 pièces se sont volatilisées.",
    effectLabel: "Coût d'achat effectif +9 % ce tour (une enseigne tirée au sort)",
    conceptHint:
      "La marchandise perdue est payée mais jamais vendue : elle s'ajoute au coût de ce que vous vendez.",
    category: "internal",
    emoji: "🔍",
    scope: "team",
  },
  {
    code: "boutique_rupture_appro",
    title: "Rupture d'approvisionnement",
    flavor:
      "Le conteneur est bloqué au port. Les trois quarts de votre réassort n'arriveront pas avant six semaines.",
    effectLabel: "Capacité de traitement −16 % ce tour (une enseigne tirée au sort)",
    conceptHint:
      "Le rayon vide ne se rattrape pas : la vente manquée d'aujourd'hui ne revient pas demain.",
    category: "internal",
    emoji: "📦",
    scope: "team",
  },
  {
    code: "boutique_ecommerce",
    title: "Offensive du e-commerce",
    flavor:
      "Une plateforme lance la livraison en deux heures sur votre ville. La rue commerçante se vide en semaine.",
    effectLabel: "Demande globale −10 % pendant 2 tours",
    conceptHint:
      "Quand le marché se contracte, on baisse les prix ou on soigne ce que le web ne sait pas vendre. Les deux coûtent.",
    category: "competition",
    emoji: "💻",
    scope: "market",
  },
  {
    code: "boutique_coton",
    title: "Flambée du coton",
    flavor:
      "Mauvaise récolte en Asie, fret en hausse : vos fournisseurs répercutent tout sur la prochaine collection.",
    effectLabel: "Coût d'achat +18 % pendant 2 tours",
    conceptHint:
      "Le coefficient multiplicateur se comprime : répercuter sur le prix de vente, ou accepter de vendre moins cher que prévu ?",
    category: "macro",
    emoji: "🧵",
    scope: "market",
  },
  {
    code: "boutique_credit_resserre",
    title: "Le crédit se resserre",
    flavor:
      "Votre banquier vous reçoit debout. Les conditions ont changé pour tout le petit commerce.",
    effectLabel: "Taux d'intérêt ×1,5 pendant 2 tours",
    conceptHint:
      "Un découvert qui coûte cher transforme un problème de trésorerie en problème de résultat.",
    category: "macro",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "boutique_pretexte_fete",
    title: "Fête des mères anticipée",
    flavor:
      "Les magazines ont lancé la saison trois semaines plus tôt. Vos clientes fidèles arrivent avec une liste.",
    effectLabel: "Demande des clientes fidèles +22 % ce tour",
    conceptHint:
      "La fidélité se paie d'avance : les clientes qui reviennent sont celles qu'on a bien servies au tour précédent.",
    category: "market",
    emoji: "💐",
    scope: "market",
  },
  {
    code: "boutique_degat_des_eaux",
    title: "Dégât des eaux",
    flavor:
      "La copropriété du dessus a laissé fuir un chauffe-eau toute la nuit. La moitié du stock est bonne pour la benne.",
    effectLabel: "Capacité −30 % et coût d'achat +10 % ce tour (une enseigne ciblée)",
    conceptHint:
      "C'est exactement le sinistre que couvre la multirisque commerce : la prime était-elle si chère ?",
    category: "internal",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "boutique_vitrine_primee",
    title: "Prix de la plus belle vitrine",
    flavor:
      "L'association des commerçants vous décerne son prix annuel. La photo fait la une du journal local.",
    effectLabel: "Capacité de traitement +8 % ce tour (une enseigne ciblée)",
    conceptHint:
      "Le soin apporté au point de vente est un investissement commercial : il se voit dans le flux client.",
    category: "market",
    emoji: "🏆",
    scope: "team",
  },
  {
    code: "boutique_banque_conciliante",
    title: "Le banquier vous suit",
    flavor:
      "Vos comptes l'ont convaincu. Il renégocie votre découvert à des conditions inespérées.",
    effectLabel: "Taux d'intérêt ×0,7 pendant 2 tours (une enseigne ciblée)",
    conceptHint:
      "La confiance bancaire se gagne sur des trimestres de gestion saine, pas sur une promesse.",
    category: "macro",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "boutique_commande_ce",
    title: "Commande d'un comité d'entreprise",
    flavor:
      "Le CSE d'une usine voisine veut habiller ses 500 salariés pour l'arbre de Noël. Il signe aujourd'hui.",
    effectLabel:
      "+500 articles (échelle trimestre) vendus d'office ce tour, réglés comptant, dans la limite du stock",
    conceptHint:
      "L'opportunité ne se saisit qu'avec de la marchandise en réserve : le stock a un coût, et parfois une valeur.",
    category: "market",
    emoji: "📋",
    scope: "team",
  },
  {
    code: "boutique_rue_pietonne",
    title: "La rue passe en piétonnier",
    flavor:
      "Terrasses, pavés neufs, jardinières : la municipalité a enfin livré. Le flux du samedi a doublé.",
    effectLabel: "Demande globale +16 % pendant 2 tours",
    conceptHint:
      "L'emplacement est le premier actif d'un commerce, et le seul qu'on ne trouve pas au bilan.",
    category: "market",
    emoji: "🌳",
    scope: "market",
  },
  {
    code: "boutique_major_breakdown",
    title: "Effondrement d'un rayonnage",
    flavor:
      "Un rayonnage central cède sous le poids des stocks. Marchandises abîmées, allées condamnées : la surface de vente est amputée le temps des réparations.",
    effectLabel:
      "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Risque opérationnel & maintenance du mobilier commercial",
    category: "internal",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "boutique_tech_obsolescence",
    title: "Caisse enregistreuse obsolète",
    flavor:
      "Le logiciel de caisse ne reçoit plus de mises à jour. Les erreurs d'inventaire se multiplient et le réapprovisionnement coûte plus cher.",
    effectLabel:
      "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    conceptHint: "Cycle de vie des actifs & veille technologique",
    category: "internal",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "boutique_used_equipment_deal",
    title: "Mobilier commercial de reprise",
    flavor:
      "Une enseigne voisine liquide son mobilier : présentoirs, portants et mannequins quasi neufs, à prix cassé.",
    effectLabel: "Disponibilité +12 % ce tour (équipe ciblée)",
    conceptHint: "Décision d'investissement & coût d'opportunité",
    category: "internal",
    emoji: "🏭",
    scope: "team",
  },
];
