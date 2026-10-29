import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * L'AUDIT UX DU 29 OCTOBRE 2026, CÔTÉ SERVEUR (audit-ux/rapport.md).
 *
 *  · P1-5 : un mauvais mot de passe rend l'e-mail saisi, jamais le mot de passe ;
 *  · P1-6 : une demande de devis refusée dit le champ en cause et rend toute la saisie ;
 *  · P1-7 : l'offre Programme n'exige plus l'entreprise (choix pédagogique) ; Classe, si ;
 *  · P2-9 : l'inscription répond en français, champ par champ, sans les bulles du navigateur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.29" }),
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn(async () => ({ envoye: true })) }));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis } from "@/db/schema";
import { registerTeacher } from "@/services/auth.service";
import { envoyerDemandeDeDevisAction } from "@/app/devis/actions";
import { loginAction, registerAction } from "@/app/teacher/actions";

const formulaire = (champs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
};

describe("P1-5 · la connexion garde l'e-mail", () => {
  it("un mauvais mot de passe rend l'e-mail, pas le mot de passe", async () => {
    const email = `${randomUUID()}@ecole.test`;
    await registerTeacher({ email, password: "un-bon-mot-de-passe", displayName: "Claire", schoolName: "", inviteCode: "" });
    const r = await loginAction({ error: null }, formulaire({ email, password: "un-mauvais" }));
    expect(r.error).toBeTruthy();
    expect(r.values).toEqual({ email });
    expect(JSON.stringify(r)).not.toContain("un-mauvais");
  });
});

describe("P2-9 · l'inscription répond champ par champ, en français", () => {
  it("un nom vide : le message du site, le champ, et la saisie rendue sans le mot de passe", async () => {
    const r = await registerAction(
      { error: null },
      formulaire({ displayName: "", email: "x@ecole.test", password: "secret-123", schoolName: "Lycée", inviteCode: "" }),
    );
    expect(r).toMatchObject({ error: "Votre nom est requis", champ: "displayName" });
    expect(r.values).toMatchObject({ email: "x@ecole.test", schoolName: "Lycée" });
    expect(JSON.stringify(r)).not.toContain("secret-123");
  });
  it("un mot de passe trop court : sous le champ du mot de passe", async () => {
    const r = await registerAction({ error: null }, formulaire({ displayName: "Claire", email: "x@ecole.test", password: "court" }));
    expect(r).toMatchObject({ error: "Mot de passe : 8 caractères minimum", champ: "password" });
  });
});

describe("P1-6, P1-7 · le devis", () => {
  const ETAT = { error: null, ok: null, values: null };
  const base = { nom: "Claire Martin", fonction: "Proviseure adjointe", organisation: "Lycée Jean Moulin", site: "" };

  it("Programme : sans entreprise, la demande part (choix laissé à l'équipe)", async () => {
    const email = `${randomUUID()}@ecole.test`;
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "programme", effectif: "6", email }));
    expect(r.error).toBeNull();
    expect(r.ok).toMatchObject({ offre: "programme" });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, email));
    expect(d).toMatchObject({ offre: "programme", entreprise: null, niveau: null });
  });

  it("Programme : une entreprise donnée est gardée ; une entreprise inconnue est refusée", async () => {
    const email = `${randomUUID()}@ecole.test`;
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "programme", entreprise: "hotel", email }));
    expect(r.ok).toMatchObject({ offre: "programme" });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, email));
    expect(d).toMatchObject({ entreprise: "hotel" });
    const faux = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "programme", entreprise: "zzz", email }));
    expect(faux).toMatchObject({ error: "Choisissez l'entreprise souhaitée", champ: "entreprise" });
  });

  it("Classe : l'entreprise et le niveau restent exigés, et l'erreur nomme son champ", async () => {
    const sans = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", email: "a@ecole.test" }));
    expect(sans).toMatchObject({ error: "Choisissez l'entreprise souhaitée", champ: "entreprise" });
    const sansNiveau = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", entreprise: "nova", email: "a@ecole.test" }));
    expect(sansNiveau).toMatchObject({ error: "Choisissez le niveau souhaité", champ: "niveau" });
  });

  it("un code promo inconnu : l'erreur sous le code, entreprise et niveau rendus", async () => {
    const r = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", entreprise: "nova", niveau: "3", codePromo: "INCONNU42", email: "b@ecole.test" }),
    );
    expect(r.champ).toBe("codePromo");
    expect(r.values).toMatchObject({ entreprise: "nova", niveau: "3", codePromo: "INCONNU42", nom: "Claire Martin" });
  });

  it("un champ obligatoire vide nomme son champ (le formulaire n'a plus les bulles du navigateur)", async () => {
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, nom: "", offre: "campus", email: "c@ecole.test" }));
    expect(r).toMatchObject({ error: "Votre nom est requis", champ: "nom" });
  });
});
