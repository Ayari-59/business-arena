/**
 * QUI VEND ET FACTURE, EN UN SEUL ENDROIT.
 *
 * Décision du propriétaire (octobre 2026) : l'entité qui établit les devis et les
 * factures est « MA Formation et Conseils », nom commercial de Mohamed AYARI,
 * entrepreneur individuel (micro-entreprise, en franchise de TVA). Ces informations
 * viennent du propriétaire ; les mentions légales et les données structurées les
 * lisent ici.
 *
 * Ce module est léger (aucun import) : un composant client peut le lire.
 */
export const VENDEUR = {
  /** Le nom de l'entité qui établit les devis et les factures. */
  nom: "MA Formation et Conseils",
  /** L'exploitant : un entrepreneur individuel porte « EI » à côté de son nom. */
  exploitant: "Mohamed AYARI EI",
  statut: "entrepreneur individuel (micro-entreprise)",
  siret: "527 962 559 00037",
  adresse: { rue: "44 rue Bonte Pollet", codePostal: "59000", ville: "Lille" },
  directeurDeLaPublication: "Mohamed AYARI",
  /**
   * L'adresse de contact publique, affichée en texte dans le pied de page, sur /tarifs et
   * sur la confirmation d'une demande de devis. C'est aussi l'adresse de contact par
   * défaut de la plateforme (services/admin.service.ts), celle où partent les
   * notifications tant que l'administrateur ne la change pas.
   */
  contact: "contact@business-arena.fr",
} as const;

/** La phrase des conditions de vente et de la demande de devis. */
export const QUI_FACTURE = `Les devis et les factures sont établis par ${VENDEUR.nom}.`;
