/**
 * LE PRIX MOYEN D'UNE ÉQUIPE SUR LE MARCHÉ, pour le benchmark d'un tour.
 *
 * Le chiffre d'affaires d'une ligne de résultat compte tout ce que l'équipe a
 * vendu : le marché, mais aussi la commande exceptionnelle, l'offre de
 * commande, l'abonnement. Le diviser par les seules ventes au marché donnait
 * un prix faux (« 84 € » pour une équipe qui vendait à 65 €, séance d'essai du
 * 13 novembre 2026). On divise donc le chiffre d'affaires DU MARCHÉ par les
 * ventes au marché, segment par segment.
 */
export function prixMoyenAuMarche(row: {
  revenue: string | number;
  marketDetail: Record<string, { sold?: number; revenue?: number } | undefined> | null;
}): number | null {
  const detail = row.marketDetail;
  const segments = detail ? Object.values(detail) : [];
  const units = segments.reduce((sum, d) => sum + (d?.sold ?? 0), 0);
  if (units <= 1) return null;
  // Une partie jouée avant que le moteur ne relève le chiffre d'affaires par
  // segment n'en porte pas : on garde alors celui de la ligne, faute de mieux.
  if (segments.some((d) => d && (d.sold ?? 0) > 0 && d.revenue === undefined)) {
    return Number(row.revenue) / units;
  }
  const caDuMarche = segments.reduce((sum, d) => sum + (d?.revenue ?? 0), 0);
  return caDuMarche / units;
}
