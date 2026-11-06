/**
 * LE MONDE DU COURS : LE DÉCOUVERT DE LA BANQUE DE NOVA (décision du propriétaire, novembre 2026 : une
 * seule banque de NOVA, un seul découvert, de l'équilibre de sa trésorerie à son année N + 1).
 *
 * LE DÉCOUVERT AUTORISÉ DE NOVA (hypothèse du cours, un taux de PME de 2026) : jusqu'à 5 000 €, au taux
 * de 12 % l'an sur le solde débiteur ; au delà de l'autorisation, la banque rejette les paiements. Les
 * fiches qui décrivent la banque de NOVA le lisent ici, sans le recopier :
 *   · equilibre-de-tresorerie.ts (CONDITIONS_DE_LA_BANQUE), que reprennent financer-et-placer.ts et
 *     decouvert-de-nova.ts ;
 *   · delais-et-tva.ts (BANQUE_DE_NOVA), la banque des chapitres du BTS GPME sur l'année N + 1 ;
 *   · mauvais-payeurs.ts, pour le retard de CampusTech.
 *
 * AU-DELÀ DE L'AUTORISATION (décision du propriétaire, novembre 2026) : quand un chapitre de N + 1
 * finance plus de 5 000 €, la banque accorde à NOVA un crédit de trésorerie au même taux, 12 % l'an
 * (les besoins de N + 1 de delais-et-tva.ts, un besoin de financement, une facture qui attend).
 *
 * CE QUI N'EN DÉPEND PAS : le découvert des autres entreprises (delais-et-tva.ts, TAUX_DU_DECOUVERT,
 * 9 %) ; et deux hypothèses de chapitre qui ne sont pas l'année N + 1 : le laboratoire de « Remises et règlements » (8 %, et le scénario « Les escomptes de janvier »,
 * en janvier N) et la trésorerie du 31 décembre N au lycée (tresorerie-a-optimiser.ts, 10 %).
 */
export const DECOUVERT_DE_NOVA = { autorise: 5_000, tauxAnnuel: 0.12 } as const;
