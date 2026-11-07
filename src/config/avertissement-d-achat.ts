/**
 * L'ACHAT QUI DÉPASSE LA TRÉSORERIE : PRÉVENIR, PAS BLOQUER (décision du propriétaire,
 * novembre 2026).
 *
 * À l'équilibre 0.2.0, une machine coûte ce qu'elle rapporte (`config/scenarios/equilibre.ts`) :
 * une chambre de L'ESCALE dépasse de loin sa trésorerie. Payée sans emprunt, elle passe au
 * découvert, et au-delà de l'autorisation l'entreprise tombe en défaillance au tour suivant.
 * La feuille le dit avant la validation et propose l'emprunt ; l'élève décide quand même. Dans une
 * partie qui ouvre le crédit-bail (`creditBail`), elle le propose aussi.
 */
const euros = (x: number) => `${Math.round(x).toLocaleString("fr-FR")} €`;

export function avertissementDAchat(r: {
  /** Le prix des machines achetées ce tour. */
  cout: number;
  /** La trésorerie disponible à l'ouverture du tour : disponibilités moins découvert. */
  tresorerie: number;
  /** Le niveau ouvre-t-il l'emprunt ? */
  empruntOuvert: boolean;
  /**
   * La partie ouvre-t-elle le crédit-bail (`creditBail`) ? L'avertissement le propose alors :
   * rien ne se paie à la signature.
   */
  creditBailOuvert?: boolean;
}): string | null {
  if (r.cout <= 0 || r.cout <= r.tresorerie) return null;
  const dispo = euros(Math.max(0, r.tresorerie));
  if (r.creditBailOuvert) {
    return r.empruntOuvert
      ? `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}). Pensez à emprunter la différence dans « Nouvel emprunt », ou prenez la machine en crédit-bail : rien n'est payé à la signature, un loyer chaque tour. Sans cela, le découvert la paiera, au risque de la défaillance. La décision vous appartient.`
      : `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}). Le crédit-bail ne demande rien à la signature, un loyer chaque tour. Sans cela, le découvert paiera la différence, au risque de la défaillance. La décision vous appartient.`;
  }
  return r.empruntOuvert
    ? `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}). Pensez à emprunter la différence dans « Nouvel emprunt » : sans cela, le découvert la paiera, au risque de la défaillance. La décision vous appartient.`
    : `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}) : le découvert paiera la différence, au risque de la défaillance. La décision vous appartient.`;
}
