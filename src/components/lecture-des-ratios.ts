import type { RatiosDeLAnnee } from "@/engine/finance/ratios";

/**
 * CE QUE DIT L'EFFET DE LEVIER. « La dette pèse » ne se dit que si la dette coûte
 * vraiment plus que ce que l'outil rapporte (coût de la dette net d'impôt > Re) : un Rf
 * sous Re peut venir d'une perte, ou de produits et charges hors exploitation, et
 * l'élève qui lisait « la dette pèse » remboursait un emprunt qui ne lui coûtait rien.
 */
export function commentaireDuLevier(
  r: Pick<RatiosDeLAnnee, "leverage" | "laDettePese" | "coutDeLaDette" | "returnOnCapitalEmployed">,
): string {
  if (r.leverage >= 0) {
    return r.coutDeLaDette === null
      ? "Sans dette, la rentabilité des associés suit celle de l'outil."
      : "La dette amplifie la rentabilité des associés.";
  }
  if (r.laDettePese) return "La dette pèse : elle coûte plus qu'elle ne rapporte.";
  if (r.returnOnCapitalEmployed <= 0) {
    return "Rf passe sous Re parce que l'outil perd de l'argent : c'est l'exploitation qu'il faut redresser, la dette ne fait qu'amplifier la perte.";
  }
  return "Rf passe sous Re, mais la dette n'en est pas la cause : elle coûte moins que ce que l'outil rapporte.";
}

/** D'où viennent les chiffres : l'année glissante, ou moins d'une année ramenée à l'année. */
export function fenetreDesRatios(r: Pick<RatiosDeLAnnee, "toursLus" | "toursParAn" | "annualise">): string {
  const tours = (n: number) => `${n} tour${n > 1 ? "s" : ""}`;
  return r.annualise
    ? `Re, Rf et la rotation sont lus sur les ${tours(r.toursLus)} joués, ramenés à l'année (${tours(r.toursParAn)}) : les repères sont annuels.`
    : `Re, Rf et la rotation sont lus sur l'année glissante, les ${tours(r.toursParAn)} derniers : les repères sont annuels.`;
}
