import { describe, expect, it, vi } from "vitest";
import {
  configurationGoogle,
  creerEvenement,
  periodesOccupees,
  supprimerEvenement,
} from "@/lib/google-agenda";

/**
 * L'AGENDA GOOGLE NE DÉPEND QUE DE L'ENVIRONNEMENT.
 * Sans les trois valeurs, rien ne part et la fonction le dit. Avec, un jeton
 * d'accès est demandé, puis l'API appelée avec ce jeton ; un refus ou un
 * réseau muet est un résultat, jamais une exception.
 */
const env = { GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret", GOOGLE_REFRESH_TOKEN: "r" };
const fenetre = { debut: new Date("2026-09-16T10:00:00Z"), fin: new Date("2026-09-23T10:00:00Z") };

type Appel = [string, RequestInit];
const json = (corps: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => corps,
});

function faux(reponses: (url: string, init: RequestInit) => unknown) {
  return vi.fn(async (url: string, init: RequestInit) => reponses(url, init)) as unknown as typeof fetch & {
    mock: { calls: Appel[] };
  };
}

describe("configurationGoogle", () => {
  it("null sans les trois valeurs", () => {
    expect(configurationGoogle({})).toBeNull();
    expect(configurationGoogle({ ...env, GOOGLE_REFRESH_TOKEN: " " })).toBeNull();
  });
  it("agenda principal par défaut, agendas consultés lus de la liste", () => {
    const c = configurationGoogle({ ...env, GOOGLE_BUSY_CALENDARS: "a@x, b@y ,," })!;
    expect(c.calendarId).toBe("primary");
    expect(c.calendriersOccupes).toEqual(["a@x", "b@y"]);
    expect(configurationGoogle({ ...env, GOOGLE_CALENDAR_ID: "c@z" })!.calendriersOccupes).toBeNull();
  });
});

describe("periodesOccupees", () => {
  it("non configuré : aucun appel", async () => {
    const poster = faux(() => json({}));
    expect(await periodesOccupees(null, fenetre, poster)).toEqual({ ok: false, raison: "non_configure" });
    expect(poster).not.toHaveBeenCalled();
  });

  it("jeton, liste des agendas, free/busy : l'occupé de tous les agendas, mêlé", async () => {
    const poster = faux((url) => {
      if (url.includes("oauth2")) return json({ access_token: "jeton" });
      if (url.includes("calendarList")) return json({ items: [{ id: "moi@x" }, { id: "edt@import", selected: true }, { id: "caché", selected: false }] });
      if (url.endsWith("/freeBusy"))
        return json({
          calendars: {
            "moi@x": { busy: [{ start: "2026-09-17T08:00:00Z", end: "2026-09-17T09:00:00Z" }] },
            "edt@import": { busy: [{ start: "2026-09-18T12:00:00Z", end: "2026-09-18T14:00:00Z" }] },
          },
        });
      throw new Error(`inattendu ${url}`);
    });
    const r = await periodesOccupees(configurationGoogle(env), fenetre, poster);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valeur.map((i) => [i.debut.toISOString(), i.fin.toISOString()])).toEqual([
      ["2026-09-17T08:00:00.000Z", "2026-09-17T09:00:00.000Z"],
      ["2026-09-18T12:00:00.000Z", "2026-09-18T14:00:00.000Z"],
    ]);
    const [jeton, , freeBusy] = poster.mock.calls;
    expect(String(jeton![1].body)).toContain("grant_type=refresh_token");
    expect((freeBusy![1].headers as Record<string, string>).Authorization).toBe("Bearer jeton");
    const corps = JSON.parse(String(freeBusy![1].body));
    expect(corps.items).toEqual([{ id: "moi@x" }, { id: "edt@import" }]);
    expect(corps.timeMin).toBe(fenetre.debut.toISOString());
  });

  it("agendas réglés : pas de lecture de la liste", async () => {
    const poster = faux((url) => {
      if (url.includes("oauth2")) return json({ access_token: "jeton" });
      if (url.endsWith("/freeBusy")) return json({ calendars: { "a@x": { busy: [] } } });
      throw new Error(`inattendu ${url}`);
    });
    const r = await periodesOccupees(configurationGoogle({ ...env, GOOGLE_BUSY_CALENDARS: "a@x" }), fenetre, poster);
    expect(r).toEqual({ ok: true, valeur: [] });
    expect(poster).toHaveBeenCalledTimes(2);
  });

  it("un jeton refusé est un résultat « refuse » avec le détail", async () => {
    const poster = faux(() => json({ error: "invalid_grant" }, 400));
    const r = await periodesOccupees(configurationGoogle(env), fenetre, poster);
    expect(r).toEqual({ ok: false, raison: "refuse", detail: "HTTP 400 : invalid_grant" });
  });

  it("un réseau muet aussi", async () => {
    const poster = faux(() => {
      throw new Error("ETIMEDOUT");
    });
    const r = await periodesOccupees(configurationGoogle(env), fenetre, poster);
    expect(r).toMatchObject({ ok: false, raison: "injoignable", detail: "ETIMEDOUT" });
  });
});

describe("creerEvenement / supprimerEvenement", () => {
  const evt = {
    titre: "Appel",
    description: "desc",
    debut: new Date("2026-09-17T12:30:00Z"),
    fin: new Date("2026-09-17T13:00:00Z"),
    invite: { email: "prof@lycee.fr", nom: "Mme Martin" },
  };

  it("pose l'événement sur l'agenda réglé, invité prévenu, heure de Paris", async () => {
    const poster = faux((url) => {
      if (url.includes("oauth2")) return json({ access_token: "jeton" });
      if (url.includes("/events")) return json({ id: "evt1", htmlLink: "https://cal/evt1" });
      throw new Error(`inattendu ${url}`);
    });
    const r = await creerEvenement(configurationGoogle({ ...env, GOOGLE_CALENDAR_ID: "moi@x" }), evt, poster);
    expect(r).toEqual({ ok: true, valeur: { id: "evt1", lien: "https://cal/evt1" } });
    const [url, init] = poster.mock.calls[1]!;
    expect(url).toBe("https://www.googleapis.com/calendar/v3/calendars/moi%40x/events?sendUpdates=all");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      summary: "Appel",
      start: { dateTime: "2026-09-17T12:30:00.000Z", timeZone: "Europe/Paris" },
      end: { dateTime: "2026-09-17T13:00:00.000Z", timeZone: "Europe/Paris" },
      attendees: [{ email: "prof@lycee.fr", displayName: "Mme Martin" }],
    });
  });

  it("retire l'événement, invités prévenus", async () => {
    const poster = faux((url) => {
      if (url.includes("oauth2")) return json({ access_token: "jeton" });
      return { ok: true, status: 204, json: async () => null };
    });
    const r = await supprimerEvenement(configurationGoogle(env), "evt 1", poster);
    expect(r).toEqual({ ok: true, valeur: null });
    const [url, init] = poster.mock.calls[1]!;
    expect(url).toBe("https://www.googleapis.com/calendar/v3/calendars/primary/events/evt%201?sendUpdates=all");
    expect(init.method).toBe("DELETE");
  });
});
