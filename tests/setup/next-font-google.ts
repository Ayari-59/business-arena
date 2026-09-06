/**
 * Stub de `next/font/google` pour les tests.
 *
 * Ces polices sont résolues par le compilateur de Next au build ; sous vitest,
 * ce transform n'existe pas et appeler `Fraunces()`/`Inter_Tight()` lèverait
 * « … is not a function ». Les tests qui importent le layout (métadonnées,
 * viewport) n'ont besoin que d'un chargeur rendant la forme attendue. La config
 * vitest fait pointer `next/font/google` ici (resolve.alias).
 */
type Police = { className: string; variable: string; style: { fontFamily: string } };
const charger = (): Police => ({
  className: "font-mock",
  variable: "font-mock-variable",
  style: { fontFamily: "mock" },
});

export const Fraunces = () => charger();
export const Inter_Tight = () => charger();
