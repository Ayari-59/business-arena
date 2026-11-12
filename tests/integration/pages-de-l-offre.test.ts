import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LES FORMULAIRES DES PAGES DE L'OFFRE, CÔTÉ SERVEUR (chantier 3 des corrections de l'audit du
 * 11 novembre 2026 ; audit UX, P2-6 et P2-10).
 *
 *  · l'inscription enseignant dit toutes ses erreurs d'un coup, chacune sous son champ ;
 *  · une cohorte refusée rend le nom tapé et les épisodes cochés, au lieu de recharger la page vide ;
 *  · la page d'une cohorte lit la licence de l'organisation de la cohorte ;
 *  · /integration : l'adresse d'inscription se demande par écrit, et la demande est enregistrée
 *    d'abord, comme un devis.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": `203.0.113.${Math.floor(Math.random() * 200) + 1}` }),
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
  notFound: () => {
    throw new Error("__notFound__");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn(async () => ({ envoye: false, raison: "sans clé" })) }));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis } from "@/db/schema";
import { getSession } from "@/lib/session";
import { registerTeacher } from "@/services/auth.service";
import { cohorteDeLEnseignant, creerCohorteDeLEnseignant } from "@/services/cohortes.service";
import { registerAction } from "@/app/teacher/actions";
import { creerCohorteAction } from "@/app/teacher/cohortes/actions";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { etablissementSousLicence } from "./helpers/licence";

const formulaire = (champs: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  return fd;
};

const connecte = (userId: string) => vi.mocked(getSession).mockResolvedValue({ userId, role: "teacher" } as never);

const nonDemos = EPISODES.filter((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code));

let prof: { userId: string; orgId: string };
let sansEpisodes: { userId: string; orgId: string };

beforeAll(async () => {
  prof = await etablissementSousLicence("Cohortes de l'offre", { episodes: true });
  sansEpisodes = await etablissementSousLicence("Arène seule", {});
});

beforeEach(() => {
  vi.mocked(getSession).mockReset();
});

describe("l'inscription enseignant dit toutes ses erreurs d'un coup", () => {
  it("envoyée vide : le nom, l'adresse et le mot de passe, chacun sous son champ", async () => {
    const r = await registerAction({ error: null }, formulaire({ displayName: "", email: "", password: "", schoolName: "Lycée", inviteCode: "" }));
    expect(r.erreurs).toMatchObject({
      displayName: "Votre nom est requis",
      email: "Adresse électronique invalide",
      password: "Mot de passe : 8 caractères minimum",
    });
    // Le premier reste le champ de l'erreur principale (le focus y va), et la saisie revient.
    expect(r).toMatchObject({ error: "Votre nom est requis", champ: "displayName" });
    expect(r.values).toMatchObject({ schoolName: "Lycée" });
  });

  it("un refus du service se dit sous son champ : l'adresse déjà prise, le code inconnu", async () => {
    const email = `${randomUUID()}@lycee.test`;
    const premier = await registerTeacher({ email, password: "motdepasse!", displayName: "Claire", schoolName: "Lycée", inviteCode: "" });
    expect("userId" in premier).toBe(true);
    const deja = await registerAction(
      { error: null },
      formulaire({ displayName: "Claire", email, password: "un-autre-mot", schoolName: "Lycée", inviteCode: "" }),
    );
    expect(deja).toMatchObject({ champ: "email", erreurs: { email: "Un compte existe déjà avec cette adresse électronique." } });
    const code = await registerAction(
      { error: null },
      formulaire({ displayName: "Paul", email: `${randomUUID()}@lycee.test`, password: "motdepasse!", schoolName: "", inviteCode: "ZZZZZZZZ" }),
    );
    expect(code).toMatchObject({ champ: "inviteCode", erreurs: { inviteCode: "Code d'invitation inconnu ou désactivé." } });
  });
});

describe("une cohorte refusée garde le nom tapé et les épisodes cochés", () => {
  it("sans épisode coché : le refus, et le nom rendu ; pas de rechargement", async () => {
    connecte(prof.userId);
    const r = await creerCohorteAction({ refus: null, valeurs: null }, formulaire({ nom: "BTS MCO 2 · groupe A" }));
    expect(r).toEqual({ refus: "episodes", valeurs: { nom: "BTS MCO 2 · groupe A", episodes: [] } });
  });

  it("sans nom : le refus, et les épisodes cochés rendus", async () => {
    connecte(prof.userId);
    const coches = [nonDemos[0]!.code, nonDemos[1]!.code];
    const r = await creerCohorteAction({ refus: null, valeurs: null }, formulaire({ nom: " ", episodes: coches }));
    expect(r).toEqual({ refus: "nom", valeurs: { nom: " ", episodes: coches } });
  });

  it("sans la licence épisodes : le refus de la licence, la saisie rendue", async () => {
    connecte(sansEpisodes.userId);
    const r = await creerCohorteAction(
      { refus: null, valeurs: null },
      formulaire({ nom: "Seconde 4", episodes: [EPISODES_DE_DEMO[0]] }),
    );
    expect(r).toEqual({ refus: "licence", valeurs: { nom: "Seconde 4", episodes: [EPISODES_DE_DEMO[0]] } });
  });

  it("acceptée : la page de la cohorte, comme avant", async () => {
    connecte(prof.userId);
    await expect(
      creerCohorteAction({ refus: null, valeurs: null }, formulaire({ nom: "Terminale", episodes: [nonDemos[0]!.code] })),
    ).rejects.toThrow(/^__redirect__\/teacher\/cohortes\/[0-9a-f-]{36}\?creee=1$/);
  });
});

describe("la page d'une cohorte lit la licence de l'organisation de la cohorte", () => {
  it("la cohorte de l'enseignant porte son organisation", async () => {
    const c = await creerCohorteDeLEnseignant({ enseignantId: prof.userId, nom: "Avec organisation", episodes: [nonDemos[0]!.code] });
    const lue = await cohorteDeLEnseignant(prof.userId, c.id);
    expect(lue).toMatchObject({ organisation: prof.orgId });
  });
});

describe("/integration : l'adresse d'inscription se demande par écrit", () => {
  it("la demande est enregistrée d'abord, avec la plateforme, sous l'option de l'intégration", async () => {
    const { demanderLAdresseDInscriptionAction } = await import("@/app/integration/actions");
    const email = `${randomUUID()}@lycee.test`;
    const r = await demanderLAdresseDInscriptionAction(
      { erreurs: {}, ok: null, valeurs: null },
      formulaire({
        nom: "Claire Martin",
        fonction: "Administratrice Moodle",
        organisation: "Lycée Pasteur",
        identifiant: "0590001A",
        plateforme: "Moodle",
        email,
        message: "Moodle 4.3",
        site: "",
      }),
    );
    expect(r.erreurs).toEqual({});
    expect(r.ok).toMatchObject({ email, accuseEnvoye: false });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, email));
    expect(d).toMatchObject({ offre: "integration-lms", organisation: "Lycée Pasteur", identifiant: "0590001A", nom: "Claire Martin" });
    expect(d!.message).toContain("Plateforme : Moodle");
    expect(d!.message).toContain("Moodle 4.3");
  });

  it("envoyée vide : toutes les erreurs d'un coup, la saisie rendue", async () => {
    const { demanderLAdresseDInscriptionAction } = await import("@/app/integration/actions");
    const r = await demanderLAdresseDInscriptionAction(
      { erreurs: {}, ok: null, valeurs: null },
      formulaire({ nom: "", fonction: "", organisation: "", plateforme: "", email: "", identifiant: "0590001A", site: "" }),
    );
    expect(Object.keys(r.erreurs).sort()).toEqual(["email", "fonction", "nom", "organisation", "plateforme"]);
    expect(r.ok).toBeNull();
    expect(r.valeurs).toMatchObject({ identifiant: "0590001A" });
  });

  it("les textes : la notification dit quoi faire, l'accusé ce qui suit, sans promettre de devis", async () => {
    const { texteAccuseAdresse, texteNotificationAdresse } = await import("@/services/adresse-d-inscription.service");
    const demande = {
      nom: "Claire Martin",
      fonction: "Administratrice Moodle",
      organisation: "Lycée Pasteur",
      identifiant: "",
      plateforme: "Moodle",
      email: "claire@lycee.test",
      message: "",
    };
    const n = texteNotificationAdresse(demande);
    expect(n.sujet).toBe("Demande d'adresse d'inscription LTI · Lycée Pasteur");
    expect(n.texte).toContain("Plateforme : Moodle");
    const a = texteAccuseAdresse(demande, "contact@exemple.test");
    expect(a.texte).toContain("Votre demande d'adresse d'inscription est enregistrée");
    expect(a.texte).not.toMatch(/devis/i);
  });
});
