// Sans dépendance : le formulaire du devis (« use client ») l'importe sans tirer
// config/tarifs.ts, qui atteint les ateliers et leurs corrigés.
/**
 * L'ENTREPRISE ET LE NIVEAU SONT-ILS EXIGÉS AU DEVIS ? (audit UX du 29 octobre 2026, P1-7.)
 * Oui pour l'offre Classe (une entreprise ET un niveau écrits sur le devis : pas d'offre
 * « cours seul »). Non pour Programme et Campus : la direction qui demande le devis laisse
 * ces choix pédagogiques à l'équipe ; ils restent proposés, facultatifs.
 */
export const parametrageRequisAuDevis = (l: { entreprise?: true; niveau?: true }): boolean =>
  Boolean(l.entreprise && l.niveau);
