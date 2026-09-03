import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // next/font/google exige le build de Next : sous vitest on sert une
      // doublure, pour que les tests puissent importer le layout (le build de
      // production, lui, garde le vrai module). Voir tests/stubs.
      "next/font/google": fileURLToPath(new URL("./tests/stubs/next-font-google.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      include: [
        "src/services/game.service.ts",
        "src/services/pedagogy.service.ts",
        "src/engine/**/*.ts",
      ],
    },
  },
});
