import type { CompanyRoundResult } from "@/engine/types";

/**
 * CE QUE LA BANQUE DIT DU TOUR, en une phrase.
 *
 * On ne parle que quand elle a retenu quelque chose : une confiance qui reste
 * au plein n'est pas une nouvelle, et la répéter chaque tour l'userait. Le
 * mouvement se lit en points, et sa conséquence est nommée — c'est le
 * découvert du tour suivant qui bouge, pas un score abstrait.
 *
 * Isolé du composant pour être testé sans monter tout le tableau de bord.
 */
export function lectureBancaire(
  bank: NonNullable<CompanyRoundResult["bank"]> | undefined,
): { ton: "baisse" | "hausse"; texte: string } | null {
  if (!bank) return null;
  const avant = Math.round(bank.trustBefore * 100);
  const apres = Math.round(bank.trustAfter * 100);
  if (avant === apres) return null;
  const baisse = apres < avant;
  const lu =
    bank.treasuryConduct === 0
      ? " : découvert resté au-delà du plafond, plus rien à céder"
      : bank.treasuryConduct !== undefined && bank.treasuryConduct < 1
        ? " : elle a dû céder vos créances d'office"
        : baisse
          ? ""
          : " : trésorerie tenue";
  const plan =
    bank.reliability !== null ? `, plan jugé juste à ${Math.round(bank.reliability * 100)} %` : "";
  const suite = baisse
    ? "découvert consenti plus bas et plus cher au tour suivant."
    : "découvert consenti plus large et moins cher au tour suivant.";
  return {
    ton: baisse ? "baisse" : "hausse",
    texte: `Votre banque a lu ce tour${lu}${plan}. Sa confiance passe de ${avant} % à ${apres} % : ${suite}`,
  };
}
