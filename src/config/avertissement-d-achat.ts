/**
 * L'ACHAT QUI DÉPASSE LA TRÉSORERIE : PRÉVENIR, PAS BLOQUER (décision du propriétaire,
 * novembre 2026).
 *
 * À l'équilibre 0.2.0, une machine coûte ce qu'elle rapporte (`config/scenarios/equilibre.ts`) :
 * une chambre de L'ESCALE dépasse de loin sa trésorerie. Payée sans emprunt, elle passe au
 * découvert, et au-delà de l'autorisation l'entreprise tombe en défaillance au tour suivant.
 * La feuille le dit avant la validation et propose l'emprunt ; l'élève décide quand même.
 */
const euros = (x: number) => `${Math.round(x).toLocaleString("fr-FR")} €`;

export function avertissementDAchat(r: {
  /** Le prix des machines achetées ce tour. */
  cout: number;
  /** La trésorerie disponible à l'ouverture du tour : disponibilités moins découvert. */
  tresorerie: number;
  /** Le niveau ouvre-t-il l'emprunt ? */
  empruntOuvert: boolean;
}): string | null {
  if (r.cout <= 0 || r.cout <= r.tresorerie) return null;
  const dispo = euros(Math.max(0, r.tresorerie));
  return r.empruntOuvert
    ? `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}). Pensez à emprunter la différence dans « Nouvel emprunt » : sans cela, le découvert la paiera, au risque de la défaillance. La décision vous appartient.`
    : `Cet achat de ${euros(r.cout)} dépasse votre trésorerie disponible (${dispo}) : le découvert paiera la différence, au risque de la défaillance. La décision vous appartient.`;
}
