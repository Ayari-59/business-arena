import { enumerer } from "@/config/catalogue";

/**
 * LES MOTS DE L'EXAMEN INDIVIDUEL : les refus (un code voyage dans l'adresse, la phrase
 * se lit ici), les états d'une copie, les bornes de la saisie.
 */

/** Les bornes de ce que l'enseignant saisit. */
export const NOM_D_EXAMEN_MAX = 80;
export const DUREE_DE_TOUR_MAX_MINUTES = 240;
export const TENTATIVES_MAX = 5;
/** Le nombre de candidats qu'un examen accueille au plus (voir services/examen.service.ts). */
export const PLAFOND_DE_CANDIDATS = 600;
/** Le nombre de concurrents pilotés face au candidat (borné par ceux du scénario). */
export const CONCURRENTS_DE_L_EXAMEN = 3;

export const NOM_DU_CANDIDAT_MAX = 80;
export const NUMERO_ETUDIANT_MAX = 30;

/** Le refus d'un examen sans le module, avec les offres qui l'incluent (lues au catalogue). */
export function refusDeLExamen(offres: readonly string[]): string {
  if (offres.length === 0) return "L'examen individuel n'est inclus dans aucune offre en ce moment : demandez un devis.";
  return `L'examen individuel est inclus dans ${offres.length > 1 ? "les offres" : "l'offre"} ${enumerer([...offres])}. La licence de votre établissement ne l'inclut pas.`;
}

/** Les refus de la création, par code (l'adresse ne porte que le code). */
export const REFUS_DE_CREATION = {
  licence: "L'examen n'a pas été créé : la licence de votre établissement n'inclut pas l'examen individuel.",
  perimetre: "L'examen n'a pas été créé : cette entreprise ou ce niveau sort de la licence de votre établissement.",
  saisie: "L'examen n'a pas été créé : vérifiez le nom, le nombre de tours, la durée et la fenêtre d'ouverture.",
  etablissement: "Rattachez d'abord votre compte à un établissement : l'examen appartient à son établissement.",
  introuvable: "Cet examen n'est pas l'un des vôtres.",
} as const;
export type RefusDeCreation = keyof typeof REFUS_DE_CREATION;
export const estUnRefusDeCreation = (v: unknown): v is RefusDeCreation =>
  typeof v === "string" && Object.hasOwn(REFUS_DE_CREATION, v);

/** Les refus faits au candidat, par code. */
export const REFUS_AU_CANDIDAT = {
  inconnu: "Ce code d'examen n'existe pas. Vérifiez-le auprès de votre enseignant.",
  "a-venir": "L'examen n'est pas encore ouvert.",
  ferme: "L'examen est fermé : il n'accepte plus de copie.",
  saisie: "Indiquez votre nom et votre numéro d'étudiant.",
  "deja-remis": "Vous avez déjà remis votre copie : l'examen ne se repasse pas.",
  "numero-pris":
    "Ce numéro d'étudiant a déjà commencé l'examen. Si c'est le vôtre, reprenez votre copie avec votre code de reprise.",
  complet: "L'examen a atteint le nombre de candidats prévu. Prévenez votre enseignant.",
} as const;
export type RefusAuCandidat = keyof typeof REFUS_AU_CANDIDAT;
export const estUnRefusAuCandidat = (v: unknown): v is RefusAuCandidat =>
  typeof v === "string" && Object.hasOwn(REFUS_AU_CANDIDAT, v);

/** Comment le candidat s'est identifié. */
export const IDENTIFICATIONS = {
  compte: "Compte Business Arena",
  lti: "Plateforme de cours (LTI)",
  renater: "Établissement (RENATER)",
  saisie: "Nom et numéro d'étudiant",
} as const;
export type Identification = keyof typeof IDENTIFICATIONS;

/** L'état d'une copie, vu de l'enseignant. */
export type EtatDeLaCopie = "en-cours" | "remise" | "notee" | "sans-note";
export const ETATS_DE_LA_COPIE: Record<EtatDeLaCopie, string> = {
  "en-cours": "En cours",
  remise: "Remise, note en calcul",
  notee: "Notée",
  "sans-note": "Remise sans note",
};

/** « Examen remis le 12 octobre 2026 à 14 h 05 », au fuseau de Paris. */
export function phraseDuRecu(remisLe: Date): string {
  const jour = remisLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  const heure = remisLe
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    .replace(":", "\u00a0h\u00a0");
  // Espaces insécables : « 10 h 53 » ne se coupe pas en fin de ligne.
  return `Examen remis le ${jour} à\u00a0${heure}`;
}

/** Un code d'examen : « EX- » puis six caractères sans ambiguïté. */
export const ALPHABET_DU_CODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_D_EXAMEN = /^EX-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
export function normaliserCodeDExamen(brut: string | null | undefined): string | null {
  const v = (brut ?? "").toUpperCase().replace(/\s+/g, "");
  const avecTiret = /^EX[A-Z0-9]{6}$/.test(v) ? `EX-${v.slice(2)}` : v;
  return CODE_D_EXAMEN.test(avecTiret) ? avecTiret : null;
}

/** Un numéro d'étudiant : sans espaces, en capitales, borné. */
export const normaliserNumero = (brut: string | null | undefined): string =>
  (brut ?? "").replace(/\s+/g, "").toUpperCase().slice(0, NUMERO_ETUDIANT_MAX);
