// Types
export type {
  TrainingModule,
  Tutorial,
  Scenario,
  Resource,
  GlossaryEntry,
  TrainingPath,
  ModuleProgress,
  TutorialStep,
} from "./types";
export type { ModuleType, Difficulty, ModuleStatus } from "./types";

// Modules
export { TUTORIALS, SCENARIOS, RESOURCES, TRAINING_PATHS } from "./modules";

// Glossary
export { GLOSSARY, getGlossaryEntry, getGlossaryByCategory, searchGlossary } from "./glossary";

// Components
export { TutorialOverlay } from "./components/tutorial-overlay";
export { GlossaryPanel } from "./components/glossary-panel";
export { TrainingGallery } from "./components/training-gallery";
export { HelpCard } from "./components/help-card";

// Hooks
export { useGlossary } from "./hooks/useGlossary";

// Services
export { TrainingProgressService } from "./services/progress.service";
