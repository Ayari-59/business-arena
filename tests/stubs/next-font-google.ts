/**
 * Doublure de next/font/google pour les tests.
 *
 * Le vrai module exécute le pipeline de build de Next (SWC, téléchargement et
 * découpe des fontes) et lève sous vitest. Le layout l'importe ; les tests qui
 * lisent ses métadonnées n'ont pas besoin des vraies fontes. Chaque fabrique
 * rend la même forme que next/font (variable CSS, className, style). Aliasé
 * dans vitest.config.ts ; le build de production, lui, utilise le vrai module.
 */
const fabrique = (options?: { variable?: string }) => ({
  variable: options?.variable ?? "--font-mock",
  className: "font-mock",
  style: { fontFamily: "mock" },
});

export const Fraunces = fabrique;
export const Sora = fabrique;
