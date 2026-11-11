// Sans dépendance : le formulaire du devis (« use client ») et celui de l'orientation l'importent
// sans tirer config/tarifs.ts, qui atteint les ateliers et leurs corrigés, ni le registre du cours.

/**
 * UNE DEMANDE QUI VIENT DU COURS (audit produit du 10 novembre 2026, P1-4) : le chapitre réservé,
 * l'aide au choix (« Le cours en classe : demander un devis »), la page d'une classe du cours sans
 * offre. Elle arrive sur `/devis?offre=classe&source=cours`, avec le parcours quand il est connu
 * (`&parcours=…`, le contenu réservé le connaît) ; le devis lit aussi le diplôme (`&diplome=…`), qu'il
 * traduit en parcours quand le diplôme n'en a qu'un. L'enseignant y demande le cours : l'entreprise et
 * le niveau de l'arène ne lui sont pas exigés, l'équipe les choisira avec lui.
 */
export const SOURCE_DU_COURS = "cours";

/** Le diplôme ou le parcours, comme le courriel et l'administration le nomment (« Entreprise souhaitée »). */
export const LIBELLE_DU_PARCOURS = "Diplôme ou parcours";

/** L'adresse du devis d'une demande qui vient du cours, avec le parcours s'il est connu. */
export const lienDuDevisDuCours = (parcours?: string | null): string =>
  `/devis?offre=classe&source=${SOURCE_DU_COURS}${parcours ? `&parcours=${encodeURIComponent(parcours)}` : ""}`;

/**
 * L'ENTREPRISE ET LE NIVEAU SONT-ILS EXIGÉS AU DEVIS ? (audit UX du 29 octobre 2026, P1-7.)
 * Oui pour l'offre Classe (une entreprise ET un niveau écrits sur le devis : pas d'offre
 * « cours seul »). Non pour Programme et Campus : la direction qui demande le devis laisse
 * ces choix pédagogiques à l'équipe ; ils restent proposés, facultatifs. Non plus quand la
 * demande vient du cours (`source`, plus haut) : c'est le cours que l'enseignant demande.
 */
export const parametrageRequisAuDevis = (l: { entreprise?: true; niveau?: true }, source?: string | null): boolean =>
  Boolean(l.entreprise && l.niveau) && source !== SOURCE_DU_COURS;
