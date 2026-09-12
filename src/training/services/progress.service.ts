import type { ModuleProgress } from "../types";

const STORAGE_KEY_PREFIX = "training-progress";

export class TrainingProgressService {
  static getStorageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}-${userId}`;
  }

  static getProgress(userId: string): Record<string, ModuleProgress> {
    if (typeof window === "undefined") return {};
    const key = this.getStorageKey(userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  static saveProgress(userId: string, progress: Record<string, ModuleProgress>): void {
    if (typeof window === "undefined") return;
    const key = this.getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(progress));
  }

  static startModule(userId: string, moduleId: string): void {
    const progress = this.getProgress(userId);
    if (!progress[moduleId]) {
      progress[moduleId] = {
        moduleId,
        status: "in-progress",
        startedAt: new Date(),
      };
      this.saveProgress(userId, progress);
    }
  }

  static markAsCompleted(userId: string, moduleId: string): void {
    const progress = this.getProgress(userId);
    if (progress[moduleId]) {
      progress[moduleId].status = "completed";
      progress[moduleId].completedAt = new Date();
    } else {
      progress[moduleId] = {
        moduleId,
        status: "completed",
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }
    this.saveProgress(userId, progress);
  }

  static updateTutorialStep(userId: string, moduleId: string, stepIndex: number): void {
    const progress = this.getProgress(userId);
    if (!progress[moduleId]) {
      progress[moduleId] = {
        moduleId,
        status: "in-progress",
        startedAt: new Date(),
      };
    }
    progress[moduleId].currentStep = stepIndex;
    this.saveProgress(userId, progress);
  }

  static recordScenarioScore(userId: string, moduleId: string, score: number): void {
    const progress = this.getProgress(userId);
    if (!progress[moduleId]) {
      progress[moduleId] = {
        moduleId,
        status: "in-progress",
        startedAt: new Date(),
      };
    }
    progress[moduleId].score = score;
    this.saveProgress(userId, progress);
  }

  static getCompletedModules(userId: string): string[] {
    const progress = this.getProgress(userId);
    return Object.values(progress)
      .filter((p) => p.status === "completed")
      .map((p) => p.moduleId);
  }

  static getPathProgress(userId: string, moduleIds: string[]): number {
    const progress = this.getProgress(userId);
    const completed = moduleIds.filter(
      (id) => progress[id]?.status === "completed"
    ).length;
    return moduleIds.length > 0 ? Math.round((completed / moduleIds.length) * 100) : 0;
  }

  static getModuleStatus(userId: string, moduleId: string): "locked" | "available" | "in-progress" | "completed" {
    const progress = this.getProgress(userId);
    return progress[moduleId]?.status ?? "available";
  }
}
