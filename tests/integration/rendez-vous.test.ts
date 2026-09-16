import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE RENDEZ-VOUS EST ÉCRIT CHEZ NOUS, PUIS POSÉ DANS L'AGENDA.
 *
 * Sans agenda, la page propose les plages ouvertes moins nos réservations ;
 * une réservation retire son créneau, deux réservations ne peuvent pas porter
 * le même, un créneau non proposé se refuse. Avec un agenda (simulé), le
 * rendez-vous y est posé et l'annulation l'en retire.
 */
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { registerTeacher } from "@/services/auth.service";
import {
  annulerRendezVous,
  creneauxProposes,
  listerRendezVous,
  marquerConfirmationEnvoyee,
  reserverRendezVous,
  texteConfirmation,
  texteNotification,
} from "@/services/rendez-vous.service";
import { PLAFOND_PAR_IP_PAR_HEURE } from "@/config/rendez-vous";
import { configurationGoogle } from "@/lib/google-agenda";

let adminId: string;
beforeAll(async () => {
  const r = await registerTeacher({
    email: "admin-rdv@e2e.test",
    password: "motdepasse-e2e!",
    displayName: "Admin",
    schoolName: "",
    inviteCode: "",
  });
  if ("error" in r) throw new Error(r.error);
  adminId = r.userId;
});

// Mercredi 16 septembre 2026, 12:00 Paris.
const now = new Date("2026-09-16T10:00:00Z");
const sansAgenda = { agenda: null };

const demande = (debut: Date, over: Record<string, unknown> = {}) => ({
  name: "Mme Martin",
  school: "Lycée Pasteur",
  email: "Martin@lycee.fr",
  phone: "06 12 34 56 78",
  message: "22 élèves, 2 h par semaine.",
  debut,
  ip: "203.0.113.7",
  ...over,
});

describe("rendez-vous téléphonique, sans agenda", () => {
  it("propose des créneaux ; une réservation retire le sien ; le même créneau se refuse ensuite", async () => {
    const avant = await creneauxProposes(now, sansAgenda);
    expect(avant.source).toBe("local");
    expect(avant.periode).toEqual({ debut: "2026-09-16", fin: "2026-10-07" });
    const premier = avant.jours[0]!.creneaux[0]!;

    const rdv = await reserverRendezVous(demande(new Date(premier.iso)), now, sansAgenda);
    expect("id" in rdv).toBe(true);
    if (!("id" in rdv)) return;
    expect(rdv.dansAgenda).toBe(false);
    expect(rdv.debut.toISOString()).toBe(premier.iso);
    expect(rdv.fin.getTime() - rdv.debut.getTime()).toBe(30 * 60_000);

    const apres = await creneauxProposes(now, sansAgenda);
    expect(apres.jours[0]!.creneaux.some((c) => c.iso === premier.iso)).toBe(false);

    const doublon = await reserverRendezVous(demande(new Date(premier.iso), { ip: "198.51.100.9" }), now, sansAgenda);
    expect(doublon).toMatchObject({ error: expect.stringContaining("plus disponible") });

    const liste = await listerRendezVous(50, now);
    const vue = liste.find((r) => r.id === rdv.id)!;
    expect(vue.email).toBe("martin@lycee.fr");
    expect(vue.aVenir).toBe(true);
    expect(vue.dansAgenda).toBe(false);
    expect(vue.mailSent).toBe(false);
    await marquerConfirmationEnvoyee(rdv.id);
    expect((await listerRendezVous(50, now)).find((r) => r.id === rdv.id)!.mailSent).toBe(true);
  });

  it("un créneau que la page ne propose pas se refuse : passé, hors plage, dimanche", async () => {
    for (const iso of ["2026-09-16T12:00:00Z", "2026-09-17T06:00:00Z", "2026-09-20T09:00:00Z"]) {
      const r = await reserverRendezVous(demande(new Date(iso), { ip: null }), now, sansAgenda);
      expect(r, iso).toMatchObject({ error: expect.stringContaining("plus disponible") });
    }
  });

  it("plafond par adresse d'origine", async () => {
    const { jours } = await creneauxProposes(now, sansAgenda);
    const libres = jours.flatMap((j) => j.creneaux).slice(-(PLAFOND_PAR_IP_PAR_HEURE + 1));
    const ip = "192.0.2.44";
    for (let i = 0; i < PLAFOND_PAR_IP_PAR_HEURE; i++) {
      const r = await reserverRendezVous(demande(new Date(libres[i]!.iso), { ip }), now, sansAgenda);
      expect("id" in r, `réservation ${i}`).toBe(true);
    }
    const trop = await reserverRendezVous(demande(new Date(libres[PLAFOND_PAR_IP_PAR_HEURE]!.iso), { ip }), now, sansAgenda);
    expect(trop).toMatchObject({ error: expect.stringContaining("Trop de réservations") });
  });
});

describe("rendez-vous téléphonique, avec agenda", () => {
  const agenda = configurationGoogle({
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "s",
    GOOGLE_REFRESH_TOKEN: "r",
    GOOGLE_BUSY_CALENDARS: "moi@x",
  });
  // Occupé jeudi 17 septembre de 14:00 à 16:00 Paris (12:00 → 14:00 Z).
  const appels: { url: string; method: string; body?: unknown }[] = [];
  const poster = vi.fn(async (url: string, init: RequestInit) => {
    const corpsJson = () => {
      try {
        return init.body ? JSON.parse(String(init.body)) : undefined;
      } catch {
        return String(init.body); // le jeton part en formulaire encodé, pas en JSON
      }
    };
    appels.push({ url, method: init.method ?? "GET", body: corpsJson() });
    const json = (corps: unknown, status = 200) => ({ ok: status < 400, status, json: async () => corps });
    if (url.includes("oauth2")) return json({ access_token: "jeton" });
    if (url.endsWith("/freeBusy"))
      return json({ calendars: { "moi@x": { busy: [{ start: "2026-09-17T12:00:00Z", end: "2026-09-17T14:00:00Z" }] } } });
    if (url.includes("/events") && init.method === "POST") return json({ id: "evt-42", htmlLink: "https://cal/evt-42" });
    if (url.includes("/events/") && init.method === "DELETE") return { ok: true, status: 204, json: async () => null };
    throw new Error(`inattendu ${url}`);
  }) as unknown as typeof fetch;
  const deps = { agenda, poster };

  it("l'occupé de l'agenda n'est pas proposé", async () => {
    const { jours, source } = await creneauxProposes(now, deps);
    expect(source).toBe("google");
    const jeudi = jours.find((j) => j.date === "2026-09-17")!;
    const heures = jeudi.creneaux.map((c) => c.heure);
    expect(heures).not.toContain("14 h 00");
    expect(heures).not.toContain("15 h 30");
    expect(heures).toContain("16 h 00");
    expect(heures).toContain("13 h 30");
  });

  it("la réservation est posée dans l'agenda avec l'enseignant en invité ; l'annulation l'en retire et libère le créneau", async () => {
    const debut = new Date("2026-09-17T14:00:00Z"); // 16 h 00 Paris
    const rdv = await reserverRendezVous(demande(debut, { ip: "203.0.113.50" }), now, deps);
    expect(rdv).toMatchObject({ dansAgenda: true });
    if (!("id" in rdv)) return;
    const pose = appels.find((a) => a.method === "POST" && a.url.includes("/events"))!;
    expect(pose.url).toContain("/calendars/primary/events?sendUpdates=all");
    expect(pose.body).toMatchObject({
      summary: "Appel Business Arena · Mme Martin (Lycée Pasteur)",
      attendees: [{ email: "martin@lycee.fr", displayName: "Mme Martin" }],
      start: { dateTime: "2026-09-17T14:00:00.000Z", timeZone: "Europe/Paris" },
    });
    expect((pose.body as { description: string }).description).toContain("06 12 34 56 78");

    const vue = (await listerRendezVous(50, now)).find((r) => r.id === rdv.id)!;
    expect(vue.dansAgenda).toBe(true);
    expect(vue.calendarLink).toBe("https://cal/evt-42");
    expect(vue.libelle).toBe("jeudi 17 septembre à 16 h 00");

    let jours = (await creneauxProposes(now, deps)).jours;
    expect(jours.find((j) => j.date === "2026-09-17")!.creneaux.some((c) => c.heure === "16 h 00")).toBe(false);

    const annulation = await annulerRendezVous(rdv.id, adminId, deps);
    expect(annulation.retireDeLAgenda).toBe(true);
    expect(appels.some((a) => a.method === "DELETE" && a.url.includes("/events/evt-42?sendUpdates=all"))).toBe(true);
    const apres = (await listerRendezVous(50, now)).find((r) => r.id === rdv.id)!;
    expect(apres.status).toBe("cancelled");
    expect(apres.aVenir).toBe(false);
    jours = (await creneauxProposes(now, deps)).jours;
    expect(jours.find((j) => j.date === "2026-09-17")!.creneaux.some((c) => c.heure === "16 h 00")).toBe(true);

    // Le créneau libéré se reprend, l'index unique partiel ne bloque que ce qui tient.
    const reprise = await reserverRendezVous(demande(debut, { ip: "203.0.113.51" }), now, deps);
    expect("id" in reprise).toBe(true);
  });
});

describe("les courriels", () => {
  const d = demande(new Date("2026-09-17T14:00:00Z"));
  const rdv = { id: "x", debut: new Date("2026-09-17T14:00:00Z"), fin: new Date("2026-09-17T14:30:00Z"), dansAgenda: true };

  it("la notification dit quand, qui, à quel numéro, et si l'agenda est à jour", () => {
    const { sujet, texte } = texteNotification(d, rdv);
    expect(sujet).toBe("Rendez-vous téléphonique · jeudi 17 septembre à 16 h 00 · Lycée Pasteur");
    expect(texte).toContain("06 12 34 56 78");
    expect(texte).toContain("posé dans votre agenda");
    expect(texteNotification(d, { ...rdv, dansAgenda: false }).texte).toContain("N'A PAS pu être posé");
  });

  it("la confirmation dit le créneau, le numéro et comment annuler", () => {
    const { sujet, texte } = texteConfirmation(d, rdv, "contact@business-arena.fr");
    expect(sujet).toBe("Rendez-vous confirmé · jeudi 17 septembre à 16 h 00");
    expect(texte).toContain("Nous vous appelons au 06 12 34 56 78");
    expect(texte).toContain("contact@business-arena.fr");
    expect(texteConfirmation(d, { ...rdv, dansAgenda: false }, null).texte).toContain("Notez ce créneau");
  });
});
