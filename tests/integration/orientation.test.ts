import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA DEMANDE DE SIMULATION EST GARDÉE CHEZ NOUS.
 *
 * Dépôt, lecture dans l'administration, prise en charge ; et deux plafonds
 * pour qu'un formulaire public ne devienne pas une poubelle : cinq demandes
 * par adresse d'origine et par heure, une par e-mail toutes les dix minutes.
 */
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { registerTeacher } from "@/services/auth.service";
import {
  DELAI_MEME_EMAIL_MS,
  PLAFOND_PAR_IP_PAR_HEURE,
  deposerDemandeOrientation,
  listerDemandesOrientation,
  marquerCourrielEnvoye,
  marquerDemandeTraitee,
  texteDuCourriel,
} from "@/services/orientation-request.service";

let adminId: string;
beforeAll(async () => {
  const r = await registerTeacher({
    email: "admin-orientation@e2e.test",
    password: "motdepasse-e2e!",
    displayName: "Admin",
    schoolName: "",
    inviteCode: "",
  });
  if ("error" in r) throw new Error(r.error);
  adminId = r.userId;
});

const demande = (over: Partial<Parameters<typeof deposerDemandeOrientation>[0]> = {}) => ({
  name: "Mme Martin",
  school: "Lycée Pasteur",
  email: "martin@lycee.fr",
  diplome: "cg1",
  semestre: "s1" as const,
  objectif: "tresorerie",
  message: "22 élèves, 2 h par semaine.",
  ip: "203.0.113.7",
  ...over,
});

describe("demande de simulation", () => {
  it("se dépose avec la recommandation figée, se lit, se marque traitée", async () => {
    const t0 = Date.now();
    const depot = await deposerDemandeOrientation(demande(), t0);
    expect("id" in depot).toBe(true);
    if (!("id" in depot)) return;
    expect(depot.recommandation.scenarioTitre).toBeTruthy();

    let liste = await listerDemandesOrientation();
    const vue = liste.find((d) => d.id === depot.id)!;
    expect(vue.status).toBe("new");
    expect(vue.email).toBe("martin@lycee.fr");
    expect(vue.diplomeLibelle).toContain("Comptabilité");
    expect(vue.recommandation.scenarioTitre).toBe(depot.recommandation.scenarioTitre);
    expect(vue.mailSent).toBe(false);

    await marquerCourrielEnvoye(depot.id);
    await marquerDemandeTraitee(depot.id, adminId);
    liste = await listerDemandesOrientation();
    const apres = liste.find((d) => d.id === depot.id)!;
    expect(apres.status).toBe("handled");
    expect(apres.mailSent).toBe(true);
  });

  it("une même adresse e-mail ne redépose pas dans les dix minutes, puis le peut", async () => {
    const t0 = Date.now() + 1_000_000;
    const a = await deposerDemandeOrientation(demande({ email: "double@lycee.fr", ip: "198.51.100.1" }), t0);
    expect("id" in a).toBe(true);
    const b = await deposerDemandeOrientation(demande({ email: "Double@lycee.fr", ip: "198.51.100.2" }), t0 + 60_000);
    expect("error" in b).toBe(true);
    const c = await deposerDemandeOrientation(
      demande({ email: "double@lycee.fr", ip: "198.51.100.3" }),
      t0 + DELAI_MEME_EMAIL_MS + 1,
    );
    expect("id" in c).toBe(true);
  });

  it("une même adresse d'origine est plafonnée sur l'heure", async () => {
    const t0 = Date.now() + 5_000_000;
    const ip = "192.0.2.44";
    for (let i = 0; i < PLAFOND_PAR_IP_PAR_HEURE; i++) {
      const r = await deposerDemandeOrientation(demande({ email: `p${i}@lycee.fr`, ip }), t0 + i);
      expect("id" in r, `dépôt ${i}`).toBe(true);
    }
    const trop = await deposerDemandeOrientation(demande({ email: "p99@lycee.fr", ip }), t0 + 100);
    expect("error" in trop).toBe(true);
    // une heure plus tard, la fenêtre est libre
    const plusTard = await deposerDemandeOrientation(
      demande({ email: "p100@lycee.fr", ip }),
      t0 + 60 * 60 * 1000 + 200,
    );
    expect("id" in plusTard).toBe(true);
  });

  it("le courriel de notification porte l'identité, le profil et la recommandation", () => {
    const d = demande();
    const depot = { scenarioTitre: "NOVA · Prenez les commandes", niveau: 3, niveauNom: "Pilotage", tours: 6, periodicite: "quarter" as const, atelierCode: "cg1", pourquoi: [] , scenarioCode: "nova" };
    const { sujet, texte } = texteDuCourriel(d, depot);
    expect(sujet).toContain("Lycée Pasteur");
    for (const attendu of ["Mme Martin", "martin@lycee.fr", "NOVA · Prenez les commandes", "Niveau 3", "22 élèves"]) {
      expect(texte).toContain(attendu);
    }
  });
});
