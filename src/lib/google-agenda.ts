import type { Intervalle } from "./creneaux";
import { FUSEAU } from "@/config/rendez-vous";

/**
 * L'AGENDA GOOGLE, lu et écrit sans bibliothèque.
 *
 * Deux besoins : savoir quand la personne qui répond est occupée (pour ne
 * proposer que le reste), et poser le rendez-vous dans son agenda une fois
 * réservé. L'API de Google est du HTTPS simple ; l'accès passe par un jeton
 * de rafraîchissement obtenu UNE FOIS, sur le poste de la personne, par le
 * script scripts/google-agenda-autorisation.mjs, puis rangé dans
 * l'hébergement. Rien ici ne connaît ces valeurs autrement que par
 * l'environnement, et sans elles la fonction le dit : l'appelant retombe sur
 * les plages ouvertes seules.
 */
export interface EnvGoogle {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  /** L'agenda où le rendez-vous est posé ; « primary » par défaut. */
  GOOGLE_CALENDAR_ID?: string;
  /**
   * Les agendas dont l'occupation compte, séparés par des virgules. Vide :
   * tous ceux de la liste de la personne (agendas importés compris, c'est là
   * que vivent les emplois du temps).
   */
  GOOGLE_BUSY_CALENDARS?: string;
}

export interface ConfigGoogle {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  calendriersOccupes: string[] | null;
}

export type ResultatAgenda<T> =
  | { ok: true; valeur: T }
  | { ok: false; raison: "non_configure" | "refuse" | "injoignable"; detail?: string };

const JETON = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const DELAI_MS = 8_000;

export function configurationGoogle(env: EnvGoogle = process.env as EnvGoogle): ConfigGoogle | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  const occupes = (env.GOOGLE_BUSY_CALENDARS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    clientId,
    clientSecret,
    refreshToken,
    calendarId: env.GOOGLE_CALENDAR_ID?.trim() || "primary",
    calendriersOccupes: occupes.length > 0 ? occupes : null,
  };
}

class RefusGoogle extends Error {
  constructor(public readonly status: number, detail: string) {
    super(`HTTP ${status}${detail ? ` : ${detail}` : ""}`);
    this.name = "RefusGoogle";
  }
}

async function lireErreur(reponse: Response): Promise<string> {
  try {
    const corps = (await reponse.json()) as { error?: { message?: string } | string };
    const e = corps.error;
    return typeof e === "string" ? e : (e?.message ?? "");
  } catch {
    return "";
  }
}

/** Un jeton d'accès de courte durée, obtenu du jeton de rafraîchissement. */
async function jetonAcces(cfg: ConfigGoogle, poster: typeof fetch): Promise<string> {
  const reponse = await poster(JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    signal: AbortSignal.timeout(DELAI_MS),
  });
  if (!reponse.ok) throw new RefusGoogle(reponse.status, await lireErreur(reponse));
  const corps = (await reponse.json()) as { access_token?: string };
  if (!corps.access_token) throw new RefusGoogle(reponse.status, "jeton absent de la réponse");
  return corps.access_token;
}

async function appelApi<T>(
  jeton: string,
  poster: typeof fetch,
  chemin: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const reponse = await poster(`${API}${chemin}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${jeton}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    signal: AbortSignal.timeout(DELAI_MS),
  });
  if (!reponse.ok) throw new RefusGoogle(reponse.status, await lireErreur(reponse));
  if (reponse.status === 204) return null as T;
  return (await reponse.json()) as T;
}

/** Un refus est un résultat, un réseau muet aussi ; jamais une exception. */
async function tenter<T>(cfg: ConfigGoogle | null, f: () => Promise<T>): Promise<ResultatAgenda<T>> {
  if (!cfg) return { ok: false, raison: "non_configure" };
  try {
    return { ok: true, valeur: await f() };
  } catch (e) {
    if (e instanceof RefusGoogle) return { ok: false, raison: "refuse", detail: e.message };
    return { ok: false, raison: "injoignable", detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Les agendas dont l'occupation compte : ceux réglés, sinon toute la liste. */
async function agendasAConsulter(cfg: ConfigGoogle, jeton: string, poster: typeof fetch): Promise<string[]> {
  if (cfg.calendriersOccupes) return cfg.calendriersOccupes;
  const liste = await appelApi<{ items?: { id: string; selected?: boolean }[] }>(
    jeton,
    poster,
    "/users/me/calendarList?minAccessRole=freeBusyReader&fields=items(id,selected)",
  );
  const ids = (liste.items ?? []).filter((c) => c.selected !== false).map((c) => c.id);
  return ids.length > 0 ? ids : [cfg.calendarId];
}

/** Les périodes occupées sur la fenêtre, tous agendas consultés confondus. */
export async function periodesOccupees(
  cfg: ConfigGoogle | null,
  fenetre: Intervalle,
  poster: typeof fetch = fetch,
): Promise<ResultatAgenda<Intervalle[]>> {
  return tenter(cfg, async () => {
    const jeton = await jetonAcces(cfg!, poster);
    const ids = await agendasAConsulter(cfg!, jeton, poster);
    const reponse = await appelApi<{
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    }>(jeton, poster, "/freeBusy", {
      method: "POST",
      body: {
        timeMin: fenetre.debut.toISOString(),
        timeMax: fenetre.fin.toISOString(),
        timeZone: FUSEAU,
        items: ids.map((id) => ({ id })),
      },
    });
    return Object.values(reponse.calendars ?? {})
      .flatMap((c) => c.busy ?? [])
      .map((b) => ({ debut: new Date(b.start), fin: new Date(b.end) }))
      .filter((i) => !Number.isNaN(i.debut.getTime()) && !Number.isNaN(i.fin.getTime()));
  });
}

export interface EvenementAPoser {
  titre: string;
  description: string;
  debut: Date;
  fin: Date;
  /** L'invité reçoit l'invitation de Google, avec le rendez-vous dans son agenda. */
  invite?: { email: string; nom: string };
}

/** Pose le rendez-vous dans l'agenda ; rend l'identifiant et le lien de l'événement. */
export async function creerEvenement(
  cfg: ConfigGoogle | null,
  evt: EvenementAPoser,
  poster: typeof fetch = fetch,
): Promise<ResultatAgenda<{ id: string; lien: string | null }>> {
  return tenter(cfg, async () => {
    const jeton = await jetonAcces(cfg!, poster);
    const cree = await appelApi<{ id: string; htmlLink?: string }>(
      jeton,
      poster,
      `/calendars/${encodeURIComponent(cfg!.calendarId)}/events?sendUpdates=all`,
      {
        method: "POST",
        body: {
          summary: evt.titre,
          description: evt.description,
          start: { dateTime: evt.debut.toISOString(), timeZone: FUSEAU },
          end: { dateTime: evt.fin.toISOString(), timeZone: FUSEAU },
          ...(evt.invite ? { attendees: [{ email: evt.invite.email, displayName: evt.invite.nom }] } : {}),
          reminders: { useDefault: true },
        },
      },
    );
    return { id: cree.id, lien: cree.htmlLink ?? null };
  });
}

/** Retire un rendez-vous annulé ; les invités en sont prévenus par Google. */
export async function supprimerEvenement(
  cfg: ConfigGoogle | null,
  id: string,
  poster: typeof fetch = fetch,
): Promise<ResultatAgenda<null>> {
  return tenter(cfg, async () => {
    const jeton = await jetonAcces(cfg!, poster);
    await appelApi<null>(
      jeton,
      poster,
      `/calendars/${encodeURIComponent(cfg!.calendarId)}/events/${encodeURIComponent(id)}?sendUpdates=all`,
      { method: "DELETE" },
    );
    return null;
  });
}
