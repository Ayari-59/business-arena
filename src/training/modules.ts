import type { Tutorial, Scenario, Resource, TrainingPath } from "./types";

// Tutoriels interactifs
export const TUTORIALS: Tutorial[] = [
  {
    id: "getting-started",
    type: "tutorial",
    title: "Démarrer votre première partie",
    description: "Les 5 étapes essentielles pour lancer une partie et comprendre l'interface.",
    difficulty: "beginner",
    estimatedTime: 5,
    tags: ["interface", "getting-started"],
    pageRoute: "/jouer",
    steps: [
      {
        id: "step-1",
        title: "Choisir un scénario",
        description: "Sélectionnez un scénario parmi ceux proposés. Chaque scénario offre une entreprise différente et un contexte unique.",
        action: "Cliquez sur 'Voir les scénarios' pour explorer les options.",
      },
      {
        id: "step-2",
        title: "Créer une partie",
        description: "Une fois le scénario choisi, créez une nouvelle partie. Vous pouvez jouer en solo ou inviter des coéquipiers.",
        action: "Remplissez le nom de votre entreprise et validez.",
      },
      {
        id: "step-3",
        title: "Découvrir le cockpit",
        description: "Le tableau de bord principal montre votre situation : CA, profitabilité, trésorerie, part de marché, etc.",
        hint: "💡 Survolez chaque chiffre pour voir la définition.",
      },
      {
        id: "step-4",
        title: "Prendre vos premières décisions",
        description: "Décidez du prix, du volume à produire, des investissements en qualité et marketing.",
        action: "Cliquez sur 'Décisions' pour passer les décisions du tour 1.",
      },
      {
        id: "step-5",
        title: "Lancer la simulation",
        description: "Cliquez sur 'Valider' pour que la simulation calcule les résultats de vos décisions.",
        action: "Regardez la simulation se lancer et les résultats s'afficher.",
      },
    ],
  },
  {
    id: "pricing-decision",
    type: "tutorial",
    title: "Maîtriser les décisions de prix",
    description: "Comprendre comment le prix affecte la demande, la marge et votre rentabilité.",
    difficulty: "intermediate",
    estimatedTime: 8,
    tags: ["pricing", "decisions", "market"],
    pageRoute: "/arena",
    steps: [
      {
        id: "step-1",
        title: "Qu'est-ce que l'élasticité ?",
        description: "C'est la sensibilité de la demande au prix. Dans ce jeu, chaque segment a son élasticité propre. Clients premium : peu sensibles au prix. Clients bas de gamme : très sensibles.",
      },
      {
        id: "step-2",
        title: "Tester différents prix",
        description: "Essayez 3 prix différents sur 3 tours pour voir comment la demande réagit.",
        action: "Notez la demande et le revenue à chaque prix.",
      },
      {
        id: "step-3",
        title: "Analyser le seuil de rentabilité",
        description: "Quel est le minimum que vous devez vendre pour être bénéficiaire ?",
        hint: "💡 Utilisez la formule : Seuil = Coûts fixes / Marge unitaire.",
      },
    ],
  },
  {
    id: "production-planning",
    type: "tutorial",
    title: "Planifier votre production",
    description: "Apprendre à ajuster le volume produit à la demande prévisible.",
    difficulty: "beginner",
    estimatedTime: 6,
    tags: ["production", "inventory", "planning"],
    pageRoute: "/arena",
    steps: [
      {
        id: "step-1",
        title: "La capacité limite",
        description: "Votre usine a une capacité maximale. Au-delà, vous ne pouvez pas produire plus. Par exemple, capacité 2 000 unités/tour maximum.",
      },
      {
        id: "step-2",
        title: "Le stock s'accumule",
        description: "Si vous produisez plus que vous ne vendez, le stock augmente. Trop de stock = argent gelé.",
        action: "Comparez production et ventes sur plusieurs tours.",
      },
      {
        id: "step-3",
        title: "Optimiser le plan",
        description: "L'objectif : produire juste ce qu'il faut pour satisfaire la demande sans surstockage.",
      },
    ],
  },
];

// Cas d'étude (scénarios pédagogiques)
export const SCENARIOS: Scenario[] = [
  {
    id: "case-pricing-dilemma",
    type: "scenario",
    title: "Le dilemme du prix",
    description: "Une simulation où vous devez choisir entre volume et marge.",
    difficulty: "beginner",
    estimatedTime: 30,
    tags: ["pricing", "strategy", "decision-model"],
    caseStudy: `# Le dilemme du prix

Vous êtes directeur commercial d'une PME textile.

## Situation initiale
- Coûts fixes : 50 000€/mois
- Coût variable : 10€/unité
- Capacité : 5 000 unités/mois
- Segment premium : 500 clients max, prix accepté 50€
- Segment grand public : 2 000 clients max, prix accepté 25€

## La question
Quelle stratégie choisir ?

**Option A : Prix premium (50€)**
- Vente estimée : 500 unités
- Marge unitaire : 40€
- Profit : 500 × 40 - 50 000 = -30 000€ (déficitaire!)

**Option B : Bas prix (25€)**
- Vente estimée : 2 000 unités
- Marge unitaire : 15€
- Profit : 2 000 × 15 - 50 000 = 20 000€ (bénéficiaire)

**Option C : Mix (30€)**
- Vente estimée : 1 500 unités
- Marge unitaire : 20€
- Profit : 1 500 × 20 - 50 000 = 20 000€ (équilibré)

## L'analyse
Le seuil de rentabilité = 50 000 / 40 = 1 250 unités au prix de 50€.
Vous ne pouvez vendre que 500, donc le prix premium seul ne suffit pas.

**Conclusion** : Un prix bas avec volume élevé est plus rentable qu'un prix haut avec peu de ventes.`,
    objectives: [
      "Calculer le seuil de rentabilité",
      "Comprendre la relation entre prix, volume et profit",
      "Identifier la stratégie optimale",
    ],
    datasets: [],
    questions: [
      {
        id: "q1",
        question: "Combien d'unités faut-il vendre à 50€ pour atteindre le seuil de rentabilité ?",
        type: "numeric",
        expectedAnswer: 1250,
      },
      {
        id: "q2",
        question: "Quel prix de vente donne le profit maximum ?",
        type: "multiple-choice",
        options: ["50€", "30€", "25€"],
        expectedAnswer: "30€",
      },
    ],
  },
  {
    id: "case-trésorerie-crisis",
    type: "scenario",
    title: "Crise de trésorerie imprévue",
    description: "Comment une bonne rentabilité peut masquer une crise de trésorerie.",
    difficulty: "intermediate",
    estimatedTime: 35,
    tags: ["finance", "cash", "working-capital"],
    caseStudy: `# Crise de trésorerie imprévue

## Situation
Vous avez une belle rentabilité (+100k de profit), mais ZÉRO€ de trésorerie !

### Pourquoi ?
1. **Les stocks** : Vous avez produit 10 000 unités, n'en avez vendu que 7 000. Capital gelé dans le stock : 3 000 × 20€ = 60 000€
2. **Les créances** : Les clients paient avec 30 jours de délai. Vous attendez le paiement de 70 000€
3. **BFR élevé** : 60 000 + 70 000 = 130 000€ immobilisés
4. **Trésorerie négative** : Vous ne pouvez pas payer vos fournisseurs le mois suivant.

## La solution
- Réduire les stocks (produire moins)
- Négocier des délais de paiement plus courts
- Augmenter les délais de paiement aux fournisseurs

## L'apprentissage
Un profit n'égale pas de la trésorerie. La trésorerie, c'est l'argent qui coule dans le compte. Elle dépend du BFR (Besoin en Fonds de Roulement).`,
    objectives: [
      "Distinguer profit et trésorerie",
      "Comprendre l'impact des stocks sur la trésorerie",
      "Analyser le cycle de paiement",
    ],
    datasets: [],
    questions: [
      {
        id: "q1",
        question: "Quel est l'impact principal d'un stock trop important ?",
        type: "multiple-choice",
        options: [
          "Augmente la rentabilité",
          "Gèle du capital",
          "Réduit les coûts",
        ],
        expectedAnswer: "Gèle du capital",
      },
    ],
  },
];

// Ressources externes (guides, videos, articles)
export const RESOURCES: Resource[] = [
  {
    id: "guide-pricing-strategy",
    type: "resource",
    category: "guide",
    title: "Les 7 stratégies de prix",
    description: "Un guide complet des stratégies de pricing utilisées en pratique.",
    difficulty: "intermediate",
    estimatedTime: 15,
    tags: ["pricing", "strategy", "guide"],
    contentUrl: "/training/guides/pricing-strategies.html",
    contentType: "html",
    authors: ["Business Arena Team"],
    publishedDate: "2025-01-15",
  },
  {
    id: "cheatsheet-finance",
    type: "resource",
    category: "cheatsheet",
    title: "Aide-mémoire finance",
    description: "Les formules essentielles en une page : seuil de rentabilité, marge, BFR, ROE.",
    difficulty: "beginner",
    estimatedTime: 5,
    tags: ["finance", "formulas", "reference"],
    contentUrl: "/training/cheatsheets/finance-formulas.pdf",
    contentType: "pdf",
    authors: ["Business Arena Team"],
    publishedDate: "2025-01-10",
  },
  {
    id: "video-intro-game",
    type: "resource",
    category: "video",
    title: "Introduction au jeu (vidéo 3min)",
    description: "Une courte vidéo pour comprendre les bases du jeu sans texto.",
    difficulty: "beginner",
    estimatedTime: 3,
    tags: ["introduction", "video", "overview"],
    contentUrl: "https://www.youtube.com/embed/placeholder",
    contentType: "video",
    authors: ["Business Arena Team"],
    publishedDate: "2025-01-01",
  },
  {
    id: "article-breakeven",
    type: "resource",
    category: "article",
    title: "Le seuil de rentabilité expliqué",
    description: "Article approfondi sur le calcul et l'utilité du breakeven.",
    difficulty: "intermediate",
    estimatedTime: 10,
    tags: ["finance", "breakeven", "analysis"],
    contentUrl: "/training/articles/breakeven-analysis.html",
    contentType: "html",
    authors: ["Business Arena Team"],
    publishedDate: "2025-01-08",
  },
];

// Parcours d'apprentissage
export const TRAINING_PATHS: TrainingPath[] = [
  {
    id: "beginner-path",
    name: "Débutant : Les fondamentaux",
    description: "Maîtrisez les bases du jeu et les décisions principales.",
    targetAudience: "beginner",
    estimatedDuration: 45,
    modules: [
      "getting-started",
      "guide-pricing-strategy",
      "cheatsheet-finance",
      "case-pricing-dilemma",
    ],
  },
  {
    id: "intermediate-path",
    name: "Intermédiaire : Finance et stratégie",
    description: "Apprenez à analyser votre trésorerie et à construire une stratégie cohérente.",
    targetAudience: "intermediate",
    estimatedDuration: 90,
    modules: [
      "pricing-decision",
      "production-planning",
      "article-breakeven",
      "case-trésorerie-crisis",
    ],
  },
];
