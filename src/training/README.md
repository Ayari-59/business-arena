# Business Arena Training System

Système modulaire et extensible de formation pour Business Arena.

## 📋 Structure

```
src/training/
├── types.ts              # Définitions TypeScript
├── glossary.ts           # Glossaire (40+ termes)
├── modules.ts            # Tutoriels, cas d'étude, ressources
├── components/           # Composants React
│   ├── tutorial-overlay.tsx
│   ├── glossary-panel.tsx
│   ├── training-gallery.tsx
│   └── help-card.tsx
├── hooks/                # Hooks React personnalisés
│   └── useGlossary.ts
├── services/             # Services métier
│   └── progress.service.ts
├── index.ts              # Exports principaux
└── README.md             # Ce fichier
```

## 🎓 4 Types de modules

### 1. **Tutoriels** (Tutorial)
Guides interactifs avec overlays et étapes dirigées.

**Exemples existants:**
- `getting-started` — Les 5 étapes pour lancer votre première partie
- `pricing-decision` — Maîtriser les décisions de prix
- `production-planning` — Planifier votre production

**Création rapide:**
```typescript
const myTutorial: Tutorial = {
  id: "my-tutorial",
  type: "tutorial",
  title: "Mon tutoriel",
  description: "...",
  difficulty: "beginner",
  estimatedTime: 10,
  tags: ["pricing"],
  pageRoute: "/arena",
  steps: [
    {
      id: "step-1",
      title: "Étape 1",
      description: "...",
      action: "Cliquez sur...",
      hint: "💡 ...",
    },
  ],
};
```

### 2. **Cas d'étude** (Scenario)
Scénarios pédagogiques avec données, objectifs, et questions.

**Exemples existants:**
- `case-pricing-dilemma` — Choisir entre volume et marge
- `case-trésorerie-crisis` — Gérer une crise de trésorerie

**Création rapide:**
```typescript
const myScenario: Scenario = {
  id: "my-case",
  type: "scenario",
  title: "Mon cas d'étude",
  description: "...",
  difficulty: "intermediate",
  estimatedTime: 45,
  tags: ["finance"],
  caseStudy: `# Titre\n\nContenu markdown...`,
  objectives: ["Objectif 1", "Objectif 2"],
  datasets: [],
  questions: [
    {
      id: "q1",
      question: "Question ?",
      type: "numeric",
      expectedAnswer: 1250,
    },
  ],
};
```

### 3. **Ressources** (Resource)
Guides, aide-mémoires, vidéos, articles.

**Exemples existants:**
- `guide-pricing-strategy` — Les 7 stratégies de prix
- `cheatsheet-finance` — Aide-mémoire des formules financières
- `video-intro-game` — Vidéo d'introduction au jeu

**Création rapide:**
```typescript
const myResource: Resource = {
  id: "my-resource",
  type: "resource",
  category: "guide",
  title: "Mon guide",
  description: "...",
  difficulty: "beginner",
  estimatedTime: 30,
  tags: ["pricing"],
  contentUrl: "/training/guides/my-guide.html",
  contentType: "html",
  authors: ["Nom"],
  publishedDate: "2025-01-15",
};
```

### 4. **Glossaire** (Glossary)
Dictionnaire interactif des termes du jeu et de la finance.

**40+ entrées existantes:** `round`, `decision`, `market-segment`, `demand`, `price-elasticity`, `revenue`, `cost`, `profit`, `margin`, `breakeven`, `cash-treasury`, `bfr`, `production`, `capacity`, `stock`, `quality`, `salary`, `productivity`, etc.

**Ajouter un terme:**
```typescript
GLOSSARY["my-term"] = {
  id: "my-term",
  type: "glossary",
  term: "Terme français",
  definition: "Courte définition...",
  example: "Exemple concret...",
  category: "finance",
  relatedTerms: ["autre-terme"],
};
```

## 📦 Parcours pédagogiques (TrainingPath)

Chemins d'apprentissage guidés, ordonnés par module.

**Existants:**
- `beginner-path` — 45 min pour maîtriser les fondamentaux
- `intermediate-path` — 90 min finance et stratégie

**Créer un parcours:**
```typescript
const myPath: TrainingPath = {
  id: "my-path",
  name: "Mon parcours",
  description: "...",
  targetAudience: "beginner",
  estimatedDuration: 180,
  modules: [
    "tutorial-id",
    "scenario-id",
    "resource-id",
    // ...
  ],
};
```

## 🎯 Composants

### TutorialOverlay
Affiche une étape guidée avec highlight et tooltip.

```tsx
<TutorialOverlay
  title="Titre"
  steps={steps}
  currentStep={0}
  onNext={() => {}}
  onPrev={() => {}}
  onClose={() => {}}
  onSkip={() => {}}
/>
```

### GlossaryPanel
Panneau latéral avec glossaire complet + recherche.

```tsx
<GlossaryPanel
  entries={Object.values(GLOSSARY)}
  onClose={() => setOpen(false)}
/>
```

### TrainingGallery
Galerie visuelle des modules d'un parcours.

```tsx
<TrainingGallery
  modules={moduleList}
  completedModules={completed}
  onSelectModule={handleSelect}
/>
```

### HelpCard
Carte d'aide contextuelle (info, actions, dismissible).

```tsx
<HelpCard
  title="Besoin d'aide ?"
  description="Vous pouvez aussi..."
  actions={[{ label: "Voir le guide", onClick: () => {} }]}
  dismissible
/>
```

## 🪝 Hooks

### useGlossary
Gère l'état du glossaire (ouverture, recherche).

```tsx
const { isOpen, setIsOpen, searchTerm, setSearchTerm } = useGlossary();
```

## 🔧 Services

### TrainingProgressService
Gère la progression (localStorage).

```typescript
// Démarrer un module
TrainingProgressService.startModule(userId, moduleId);

// Marquer comme complété
TrainingProgressService.markAsCompleted(userId, moduleId);

// Avancer dans un tutoriel
TrainingProgressService.updateTutorialStep(userId, moduleId, 2);

// Enregistrer le score d'un scénario
TrainingProgressService.recordScenarioScore(userId, moduleId, 85);

// Obtenir les modules complétés
const completed = TrainingProgressService.getCompletedModules(userId);

// Progression d'un parcours (%)
const pct = TrainingProgressService.getPathProgress(userId, moduleIds);
```

## 🚀 Intégration UI

### Page Formation
Page d'accueil des parcours: `/training`

Affiche tous les parcours avec barre de progression et description.

### Page Parcours
Détail d'un parcours: `/training/[pathId]`

Affiche tous les modules du parcours avec progression.

### Lien Navigation
Ajouté dans `/config/navigation.ts` sous le groupe « Comprendre ».

## 📊 Statistiques

**Glossaire:** 40+ termes (game-mechanics, market, finance, production, hr, marketing, analysis)  
**Tutoriels:** 3 tutoriels interactifs  
**Cas d'étude:** 2 scénarios complets  
**Ressources:** 4 ressources (1 guide, 1 cheatsheet, 1 vidéo, 1 article)  
**Parcours:** 2 chemins (débutant 45m, intermédiaire 90m)

## 🎨 Design

- **Thème clair/sombre:** Tous les composants supportent les deux thèmes
- **Responsive:** Mobile-first, adapté à tous les écrans
- **Accessibilité:** Navigation clavier, contraste, ARIA labels
- **Performance:** localStorage pour la progression

## 📝 À ajouter

1. **Davantage de tutoriels** (8-12) sur les pages clés
2. **Davantage de cas d'étude** (4-6) par secteur
3. **Ressources vidéo** (YouTube embeds)
4. **Quiz interactifs** après chaque module
5. **Certification** (badge, certificat PDF)
6. **Analytics** (voir quels modules sont populaires)
7. **Recommandations personnalisées** (basées sur la progression)
8. **Support multi-langue** (EN, ES, DE)

## 🔗 URLs

- `/training` — Tous les parcours
- `/training/[pathId]` — Détails d'un parcours
- `/training/modules/[moduleId]` — Détail d'un module (à venir)
