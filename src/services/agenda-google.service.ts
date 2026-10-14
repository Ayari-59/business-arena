import { eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { authSecret } from "@/lib/auth-secret";
import { chiffrer, dechiffrer } from "@/lib/chiffrement";
import { configurationGoogle, type ConfigGoogle, type EnvGoogle } from "@/lib/google-agenda";

/**
 * LA CONNEXION DE L'AGENDA GOOGLE, depuis l'administration.
 *
 * L'hébergement porte l'identifiant et le secret du client OAuth (deux
 * valeurs lues dans la console Google, posées une fois). Le JETON propre au
 * compte, lui, s'obtient d'un clic : l'administrateur consent dans son
 * navigateur, Google renvoie un code, ce service l'échange et garde le jeton
 * chiffré en base. Personne n'a à copier de jeton à la main, et il ne transite
 * par personne d'autre que Google et le serveur.
 *
 * Un jeton posé dans l'environnement (GOOGLE_REFRESH_TOKEN) reste possible
 * et l'emporte : c'est le chemin du script, ou d'un réglage manuel.
 */
const CLE = "google_agenda";
const JETON = "https://oauth2.googleapis.com/token";
const REVOCATION = "https://oauth2.googleapis.com/revoke";
const API = "https://www.googleapis.com/calendar/v3";
export const PORTEES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

interface ConnexionEnBase {
  jetonChiffre: string;
  compte: string;
  connecteLe: string;
}

export interface EtatAgenda {
  /** Identifiant et secret du client présents dans l'hébergement ? */
  clientConfigure: boolean;
  /** Un jeton existe-t-il, et d'où vient-il ? */
  connexion: { source: "environnement" } | { source: "base"; compte: string; depuis: Date } | null;
}

const env = () => process.env as EnvGoogle;

async function lireConnexion(): Promise<ConnexionEnBase | null> {
  const [row] = await db.select().from(integrations).where(eq(integrations.key, CLE));
  return (row?.value as ConnexionEnBase | undefined) ?? null;
}

export async function etatAgenda(): Promise<EtatAgenda> {
  const e = env();
  const clientConfigure = Boolean(e.GOOGLE_CLIENT_ID?.trim() && e.GOOGLE_CLIENT_SECRET?.trim());
  if (e.GOOGLE_REFRESH_TOKEN?.trim()) return { clientConfigure, connexion: { source: "environnement" } };
  const c = await lireConnexion();
  return {
    clientConfigure,
    connexion: c ? { source: "base", compte: c.compte, depuis: new Date(c.connecteLe) } : null,
  };
}

/**
 * La configuration que le service des rendez-vous utilise : l'environnement
 * s'il porte un jeton, sinon la connexion en base, sinon rien.
 */
export async function configurationGoogleEffective(): Promise<ConfigGoogle | null> {
  const e = env();
  const depuisEnv = configurationGoogle(e);
  if (depuisEnv) return depuisEnv;
  if (!e.GOOGLE_CLIENT_ID?.trim() || !e.GOOGLE_CLIENT_SECRET?.trim()) return null;
  const c = await lireConnexion();
  if (!c) return null;
  const jeton = dechiffrer(c.jetonChiffre, authSecret());
  if (!jeton) {
    console.error("[agenda] jeton en base illisible (secret changé ?) : agenda non consulté");
    return null;
  }
  return configurationGoogle({ ...e, GOOGLE_REFRESH_TOKEN: jeton });
}

/** L'adresse de consentement Google, pour l'administrateur qui clique. */
export function urlDeConsentement(state: string, redirectUri: string): string | null {
  const clientId = env().GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: PORTEES,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  return url.toString();
}

/**
 * Échange le code du consentement contre un jeton, note le compte connecté,
 * garde le jeton chiffré. Rend le compte, ou la raison de l'échec.
 */
export async function terminerConnexionAgenda(
  code: string,
  redirectUri: string,
  adminId: string,
  poster: typeof fetch = fetch,
): Promise<{ compte: string } | { error: string }> {
  const e = env();
  const clientId = e.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = e.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return { error: "client_non_configure" };
  const reponse = await poster(JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const jetons = (await reponse.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };
  if (!reponse.ok || !jetons.access_token) return { error: jetons.error ?? `HTTP ${reponse.status}` };
  if (!jetons.refresh_token) return { error: "jeton_absent" };
  // Le compte connecté : l'identifiant de l'agenda principal est son adresse.
  let compte = "compte Google";
  try {
    const principal = await poster(`${API}/calendars/primary`, {
      headers: { Authorization: `Bearer ${jetons.access_token}` },
    });
    const corps = (await principal.json()) as { id?: string };
    if (principal.ok && corps.id) compte = corps.id;
  } catch {
    /* le compte reste anonyme, la connexion vaut quand même */
  }
  const valeur: ConnexionEnBase = {
    jetonChiffre: chiffrer(jetons.refresh_token, authSecret()),
    compte,
    connecteLe: new Date().toISOString(),
  };
  await db
    .insert(integrations)
    .values({ key: CLE, value: valeur, updatedBy: adminId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: integrations.key, set: { value: valeur, updatedBy: adminId, updatedAt: new Date() } });
  return { compte };
}

/** Oublie le jeton, et demande à Google de le révoquer (au mieux). */
export async function deconnecterAgenda(poster: typeof fetch = fetch): Promise<void> {
  const c = await lireConnexion();
  await db.delete(integrations).where(eq(integrations.key, CLE));
  if (!c) return;
  const jeton = dechiffrer(c.jetonChiffre, authSecret());
  if (!jeton) return;
  try {
    await poster(REVOCATION, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: jeton }).toString(),
    });
  } catch {
    /* la révocation est une politesse ; le jeton est déjà oublié ici */
  }
}
