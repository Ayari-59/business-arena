/**
 * L'ENVOI D'UN COURRIEL, quand la plateforme en a les moyens.
 *
 * Aucune bibliothèque : l'API de Resend est un simple POST HTTPS. Sans clé
 * dans l'environnement, rien ne part et la fonction le dit ; c'est à
 * l'appelant de garder ce qu'il voulait envoyer (une demande de simulation
 * est enregistrée avant toute tentative d'envoi). La clé et l'expéditeur se
 * règlent dans l'hébergement, jamais ici.
 */
export interface Courriel {
  /** Destinataire. */
  a: string;
  sujet: string;
  /** Corps en texte simple : lisible partout, sans mise en forme à trahir. */
  texte: string;
  /** Adresse à laquelle « Répondre » répond, quand elle diffère de l'expéditeur. */
  repondreA?: string;
  /**
   * E-MAILS DE NOUVEAUTÉS SEULEMENT : l'adresse de désinscription en un clic du
   * destinataire (`adresseDeDesinscriptionEnUnClic`, services/nouveautes.service.ts).
   * Elle part dans les en-têtes `List-Unsubscribe` et `List-Unsubscribe-Post` (RFC 2369
   * et 8058) : la messagerie affiche alors son propre bouton « Se désabonner », qui poste
   * à cette adresse sans ouvrir de page. Un message de service (licence, incident, devis)
   * n'en porte pas : il ne relève pas du consentement. On ne construit pas un e-mail de
   * nouveautés à la main : `courrielDeNouveautes` pose cette adresse et le lien du corps.
   */
  desinscription?: string;
}

/** Les en-têtes de désinscription d'un e-mail de nouveautés (RFC 2369 et 8058). */
export function entetesDeDesinscription(adresse: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${adresse}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export type ResultatEnvoi =
  | { envoye: true }
  | { envoye: false; raison: "non_configure" | "refuse" | "injoignable"; detail?: string };

const POINT_D_ENVOI = "https://api.resend.com/emails";
const EXPEDITEUR_PAR_DEFAUT = "Business Arena <contact@business-arena.fr>";

export async function envoyerCourriel(
  courriel: Courriel,
  env: { RESEND_API_KEY?: string; MAIL_FROM?: string } = process.env as { RESEND_API_KEY?: string; MAIL_FROM?: string },
  poster: typeof fetch = fetch,
): Promise<ResultatEnvoi> {
  const cle = env.RESEND_API_KEY?.trim();
  if (!cle) return { envoye: false, raison: "non_configure" };
  try {
    const reponse = await poster(POINT_D_ENVOI, {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.MAIL_FROM?.trim() || EXPEDITEUR_PAR_DEFAUT,
        to: [courriel.a],
        subject: courriel.sujet,
        text: courriel.texte,
        ...(courriel.repondreA ? { reply_to: courriel.repondreA } : {}),
        ...(courriel.desinscription ? { headers: entetesDeDesinscription(courriel.desinscription) } : {}),
      }),
    });
    if (!reponse.ok) {
      return { envoye: false, raison: "refuse", detail: `HTTP ${reponse.status}` };
    }
    return { envoye: true };
  } catch (e) {
    return { envoye: false, raison: "injoignable", detail: e instanceof Error ? e.message : String(e) };
  }
}
