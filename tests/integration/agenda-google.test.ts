import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * L'AGENDA SE CONNECTE D'UN CLIC, LE JETON DORT CHIFFRÉ EN BASE.
 * Le code du consentement s'échange contre un jeton, le compte est noté, le
 * jeton n'apparaît jamais en clair en base ; la configuration effective le
 * relit ; l'environnement l'emporte s'il porte un jeton ; la déconnexion
 * oublie et révoque.
 */
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { registerTeacher } from "@/services/auth.service";
import {
  configurationGoogleEffective,
  deconnecterAgenda,
  etatAgenda,
  terminerConnexionAgenda,
  urlDeConsentement,
} from "@/services/agenda-google.service";

let adminId: string;
beforeAll(async () => {
  const r = await registerTeacher({
    email: "admin-agenda@e2e.test",
    password: "motdepasse-e2e!",
    displayName: "Admin",
    schoolName: "",
    inviteCode: "",
  });
  if ("error" in r) throw new Error(r.error);
  adminId = r.userId;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const json = (corps: unknown, status = 200) => ({ ok: status < 400, status, json: async () => corps });

describe("connexion de l'agenda Google", () => {
  it("sans client : rien à proposer", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    expect(await etatAgenda()).toEqual({ clientConfigure: false, connexion: null });
    expect(urlDeConsentement("s", "https://x/cb")).toBeNull();
    expect(await configurationGoogleEffective()).toBeNull();
  });

  it("consentement → jeton chiffré en base, compte noté, configuration relue ; déconnexion révoque", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "id.apps");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "GOCSPX-s");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    vi.stubEnv("AUTH_SECRET", "secret-de-test");

    const url = new URL(urlDeConsentement("etat42", "https://www.business-arena.fr/api/google/callback")!);
    expect(url.searchParams.get("client_id")).toBe("id.apps");
    expect(url.searchParams.get("state")).toBe("etat42");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toContain("calendar.events");

    const appels: string[] = [];
    const poster = vi.fn(async (u: string, init?: RequestInit) => {
      appels.push(`${init?.method ?? "GET"} ${u}`);
      if (u.includes("oauth2") && u.endsWith("/token")) {
        expect(String(init!.body)).toContain("grant_type=authorization_code");
        expect(String(init!.body)).toContain("code=code-xyz");
        return json({ access_token: "acces", refresh_token: "1//rafraichissement" });
      }
      if (u.endsWith("/calendars/primary")) return json({ id: "ayamdi@gmail.com" });
      if (u.endsWith("/revoke")) return json({});
      throw new Error(`inattendu ${u}`);
    }) as unknown as typeof fetch;

    const r = await terminerConnexionAgenda("code-xyz", "https://www.business-arena.fr/api/google/callback", adminId, poster);
    expect(r).toEqual({ compte: "ayamdi@gmail.com" });

    const [row] = await db.select().from(integrations);
    expect(row!.key).toBe("google_agenda");
    expect(JSON.stringify(row!.value)).not.toContain("1//rafraichissement");
    expect(row!.updatedBy).toBe(adminId);

    const etat = await etatAgenda();
    expect(etat.clientConfigure).toBe(true);
    expect(etat.connexion).toMatchObject({ source: "base", compte: "ayamdi@gmail.com" });

    const cfg = await configurationGoogleEffective();
    expect(cfg).toMatchObject({ clientId: "id.apps", clientSecret: "GOCSPX-s", refreshToken: "1//rafraichissement", calendarId: "primary" });

    // Un jeton dans l'environnement l'emporte.
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "1//env");
    expect((await configurationGoogleEffective())!.refreshToken).toBe("1//env");
    expect((await etatAgenda()).connexion).toEqual({ source: "environnement" });
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");

    // Un secret d'hébergement changé rend le jeton illisible : agenda non consulté, pas d'exception.
    vi.stubEnv("AUTH_SECRET", "autre-secret");
    expect(await configurationGoogleEffective()).toBeNull();
    vi.stubEnv("AUTH_SECRET", "secret-de-test");

    await deconnecterAgenda(poster);
    expect(await db.select().from(integrations)).toEqual([]);
    expect(appels.some((a) => a.includes("/revoke"))).toBe(true);
    expect((await etatAgenda()).connexion).toBeNull();
  });

  it("sans jeton durable dans la réponse de Google, rien n'est gardé et la raison est dite", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "id.apps");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "GOCSPX-s");
    const poster = vi.fn(async () => json({ access_token: "acces" })) as unknown as typeof fetch;
    expect(await terminerConnexionAgenda("c", "https://x/cb", adminId, poster)).toEqual({ error: "jeton_absent" });
    expect(await db.select().from(integrations)).toEqual([]);
    const refus = vi.fn(async () => json({ error: "invalid_grant" }, 400)) as unknown as typeof fetch;
    expect(await terminerConnexionAgenda("c", "https://x/cb", adminId, refus)).toEqual({ error: "invalid_grant" });
  });
});
