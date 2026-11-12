import { deposerDemandeDeDevis } from "@/services/devis.service";
import { DUREE_JETON_INSCRIPTION_JOURS } from "@/lti/constantes";
import { NAVIGATION_ADMIN } from "@/config/navigation";

/**
 * LA DEMANDE D'ADRESSE D'INSCRIPTION LTI, PAR ÉCRIT (audit UX du 11 novembre 2026, P2-10 ; décision du
 * propriétaire). Sur /integration, « Demander votre adresse d'inscription » menait au rendez-vous
 * téléphonique, « trente minutes pour parler de votre classe » : le référent informatique qui veut une
 * adresse se voyait proposer un entretien pédagogique. Aucun formulaire existant ne convenait (le devis
 * promet un devis, l'aide au choix demande un diplôme) : c'est un formulaire court.
 *
 * LA DEMANDE EST ENREGISTRÉE D'ABORD, comme un devis et avec ses plafonds (services/devis.service.ts),
 * sous le code de l'option de l'intégration au catalogue (`integration-lms`, config/tarifs.ts) : elle se
 * lit et se marque traitée avec les demandes écrites de /admin. Deux courriels suivent, qui ne la
 * conditionnent pas : la notification à l'adresse de contact, l'accusé au demandeur.
 */

/** Le code de l'option de l'intégration au catalogue : la demande s'enregistre sous lui. */
export const OFFRE_DE_L_INTEGRATION = "integration-lms";

/** Les plateformes de cours que l'outil sert (LTI 1.3), et la porte pour les autres. */
export const PLATEFORMES_LTI = ["Moodle", "Canvas", "Blackboard", "Brightspace", "Une autre plateforme LTI 1.3"] as const;

export interface DemandeDAdresse {
  nom: string;
  fonction: string;
  organisation: string;
  /** L'UAI, facultatif ; vide s'il n'est pas donné. */
  identifiant: string;
  plateforme: string;
  email: string;
  message: string;
}

/** Ce qui a été demandé, les mêmes lignes dans les deux courriels. */
function recapitulatif(d: DemandeDAdresse): string[] {
  return [
    `Plateforme : ${d.plateforme}`,
    `Établissement : ${d.organisation.trim()}`,
    d.identifiant.trim() ? `UAI : ${d.identifiant.trim()}` : null,
    `Demandé par : ${d.nom.trim()}, ${d.fonction.trim()}`,
    `Adresse électronique : ${d.email.trim()}`,
    "",
    "Message :",
    d.message.trim() || "(rien d'ajouté)",
  ].filter((x): x is string => x !== null);
}

/** Le message enregistré avec la demande : la plateforme d'abord, puis ce que le demandeur a écrit. */
export const messageEnregistre = (d: Pick<DemandeDAdresse, "plateforme" | "message">): string =>
  [`Plateforme : ${d.plateforme}`, d.message.trim()].filter(Boolean).join("\n");

/** Le courriel à l'adresse de contact : ce qu'il faut faire, et « Répondre » répond au demandeur. */
export function texteNotificationAdresse(d: DemandeDAdresse): { sujet: string; texte: string } {
  return {
    sujet: `Demande d'adresse d'inscription LTI · ${d.organisation.trim()}`,
    texte: [
      "Demande d'adresse d'inscription LTI reçue depuis business-arena.fr/integration.",
      `L'adresse se crée dans l'administration, rubrique « ${NAVIGATION_ADMIN.find((p) => p.code === "lti")!.libelle} », puis s'envoie au demandeur.`,
      "",
      ...recapitulatif(d),
    ].join("\n"),
  };
}

/** L'accusé au demandeur : ce qui suit, comme la page /integration le décrit, et rien de promis de plus. */
export function texteAccuseAdresse(d: DemandeDAdresse, contact: string): { sujet: string; texte: string } {
  return {
    sujet: "Votre demande d'adresse d'inscription Business Arena",
    texte: [
      "Bonjour,",
      "",
      `Votre demande d'adresse d'inscription est enregistrée. L'adresse vous sera envoyée par écrit, à cette adresse électronique : elle est propre à votre établissement, ne sert qu'une fois et reste valable ${DUREE_JETON_INSCRIPTION_JOURS} jours.`,
      "",
      ...recapitulatif(d),
      "",
      `Une question : ${contact}`,
    ].join("\n"),
  };
}

/** Enregistre la demande, avant tout courriel ; les plafonds sont ceux des demandes de devis. */
export function deposerDemandeDAdresse(
  d: DemandeDAdresse,
  ip: string | null,
): Promise<{ id: string } | { error: string }> {
  return deposerDemandeDeDevis({
    offre: OFFRE_DE_L_INTEGRATION,
    libelles: {
      offre: "Adresse d'inscription LTI",
      organisation: "Établissement",
      exempleOrganisation: "",
      identifiant: "UAI (facultatif)",
    },
    nom: d.nom,
    fonction: d.fonction,
    organisation: d.organisation,
    identifiant: d.identifiant,
    effectif: null,
    email: d.email,
    message: messageEnregistre(d),
    ip,
  });
}
