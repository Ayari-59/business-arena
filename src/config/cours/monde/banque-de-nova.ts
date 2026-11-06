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
 *   · mauvais-payeurs.ts, pour le retard de CampusTech ;
 *   · tresorerie-a-optimiser.ts (TAUX_DU_DECOUVERT), la trésorerie du 31 décembre N au lycée, que lisent
 *     le chapitre « Optimiser la trésorerie » et le cas « La banque propose l'escompte » ;
 *   · remises-et-reglements.ts (TAUX_DU_DECOUVERT), le laboratoire de « Remises et règlements », que
 *     lit le scénario « Les escomptes de janvier », en janvier N.
 *
 * AU-DELÀ DE L'AUTORISATION (décision du propriétaire, novembre 2026) : quand un chapitre finance plus
 * de 5 000 €, la banque accorde à NOVA un crédit de trésorerie au même taux, 12 % l'an (les besoins de
 * N + 1 de delais-et-tva.ts, un besoin de financement, une facture qui attend, le manque du 31 décembre
 * N, l'attente d'un client qui paie à 80 jours) ; le texte le dit en une phrase là où c'est le cas.
 *
 * CE QUI N'EN DÉPEND PAS : le découvert des autres entreprises (delais-et-tva.ts, TAUX_DU_DECOUVERT,
 * 9 %). Aucune autre fiche du cours ne pose son propre taux de découvert (tests/cours/une-seule-nova.test.ts).
 */
export const DECOUVERT_DE_NOVA = { autorise: 5_000, tauxAnnuel: 0.12 } as const;
