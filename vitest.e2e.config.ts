import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuration séparée pour le parcours de bout en bout.
 *
 * Il ne tourne pas avec la suite ordinaire : il lui faut un Postgres et
 * l'application démarrée, là où les 347 autres tests ne demandent rien. Les
 * garder ensemble rendrait la suite rapide otage de l'infrastructure.
 */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/e2e/**/*.e2e.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
