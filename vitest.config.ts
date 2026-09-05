import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      // Périmètre de mesure élargi : les modules lourds (game-view,
      // round-resolution, scoring, debrief, competition…) étaient hors métrique,
      // ce qui donnait une confiance faussée. On mesure désormais tout le
      // service, le scoring et la pédagogie, pas seulement deux fichiers. (Pas
      // de seuil bloquant ici : à ajouter une fois une base de couverture
      // établie, pour ne pas casser la CI en aveugle.)
      include: [
        "src/services/**/*.ts",
        "src/scoring/**/*.ts",
        "src/pedagogy/**/*.ts",
        "src/engine/**/*.ts",
      ],
    },
  },
});
