import { getSession } from "@/lib/session";
import { getGuestUserId } from "@/lib/guest";
import { compteFedereEtudiant } from "@/saml/comptes";
import { plateformesDuCompte } from "@/lti/comptes";
import type { Identification } from "@/config/examen/textes";

/**
 * QUI SE PRÉSENTE À L'EXAMEN, D'APRÈS CET APPAREIL, avant toute saisie : un compte connecté
 * (session), une identité venue de l'établissement (RENATER) ou de la plateforme de cours
 * (LTI). `identification` nulle : il faudra un nom et un numéro d'étudiant. Lu des cookies
 * signés, jamais d'un champ de formulaire.
 */
export async function identiteReconnue(): Promise<{ userId: string | null; identification: Identification | null }> {
  const session = await getSession();
  if (session) return { userId: session.userId, identification: "compte" };
  const invite = await getGuestUserId();
  if (!invite) return { userId: null, identification: null };
  if (await compteFedereEtudiant(invite)) return { userId: invite, identification: "renater" };
  if ((await plateformesDuCompte(invite)).length > 0) return { userId: invite, identification: "lti" };
  return { userId: invite, identification: null };
}
