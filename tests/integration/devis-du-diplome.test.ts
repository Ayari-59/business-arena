import { describe, expect, it, vi } from "vitest";

/**
 * LE DEVIS DEMANDE LE DIPLÔME OU LE PARCOURS (audit produit du 10 novembre 2026, P1-4), CÔTÉ SERVEUR.
 *
 * L'action qui reçoit le devis (app/devis/actions.ts), contre une base migrée (migration 0058) :
 *  · une offre qui ouvre le cours à une école (Classe, Programme, Campus) garde le parcours choisi,
 *    dans la demande enregistrée et dans les deux courriels, sous le nom que l'enseignant lit ;
 *  · une valeur hors des parcours qu'une classe peut choisir est refusée, sous son champ ;
 *  · une offre qui n'ouvre pas le cours (les épisodes) ne le garde pas ;
 *  · une demande qui vient du cours (`source=cours`) n'exige ni l'entreprise ni le niveau de
 *    l'arène ; sans elle, l'offre Classe les exige toujours.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
// Une adresse d'origine par demande : le plafond par adresse (cinq par heure) ne s'en mêle pas.
const compteur = vi.hoisted(() => ({ ip: 0 }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": `198.51.100.${++compteur.ip}` }),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn(async () => ({ envoye: true })) }));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis } from "@/db/schema";
import { envoyerDemandeDeDevisAction } from "@/app/devis/actions";
import { envoyerCourriel } from "@/lib/courriel";
import { VENDEUR } from "@/config/editeur";
import { titreDuParcours } from "@/config/cours/parcours-de-formation";

const ETAT = { error: null, ok: null, values: null };
const formulaire = (champs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
};
const base = { nom: "Claire Martin", fonction: "Professeure d'économie et gestion", organisation: "Lycée Pasteur", site: "" };
const ligne = async (email: string) => (await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, email)))[0];
/** Les deux courriels d'une demande : la notification à l'équipe, l'accusé au demandeur. */
const courriels = (email: string) => {
  const appels = vi.mocked(envoyerCourriel).mock.calls.map(([c]) => c);
  return {
    notification: appels.find((c) => c.a === VENDEUR.contact && c.repondreA === email)!,
    accuse: appels.find((c) => c.a === email)!,
  };
};

describe("le devis garde le diplôme ou le parcours", () => {
  it("Classe venue du cours : le parcours dans la demande et dans les deux courriels, sans entreprise ni niveau", async () => {
    const email = "stmg-gf@lycee.test";
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "cours", parcours: "stmg-gf", email }));
    expect(r.error).toBeNull();
    expect(r.ok).toMatchObject({ offre: "classe" });
    expect(await ligne(email)).toMatchObject({ offre: "classe", parcours: "stmg-gf", entreprise: null, niveau: null });
    const titre = titreDuParcours("stmg-gf")!;
    expect(titre).toBe("Bac STMG · Gestion et finance");
    const { notification, accuse } = courriels(email);
    expect(notification.texte).toContain(`Diplôme ou parcours : ${titre}`);
    expect(accuse.texte).toContain(`Diplôme ou parcours : ${titre}`);
    expect(notification.texte).not.toContain("Entreprise souhaitée");
  });

  it("venue du cours, l'entreprise et le niveau donnés restent gardés", async () => {
    const email = "avec-reglage@lycee.test";
    const r = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", source: "cours", parcours: "mco", entreprise: "nova", niveau: "3", email }),
    );
    expect(r.ok).toMatchObject({ offre: "classe" });
    expect(await ligne(email)).toMatchObject({ parcours: "mco", entreprise: "nova", niveau: 3 });
  });

  it("Programme et Campus le gardent aussi, un parcours de formation compris ; il reste facultatif", async () => {
    const p = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "programme", parcours: "but-gea", email: "but@iut.test" }));
    expect(p.ok).toMatchObject({ offre: "programme" });
    expect(await ligne("but@iut.test")).toMatchObject({ parcours: "but-gea" });
    const c = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "campus", parcours: "dscg-finance", email: "dscg@ecole.test" }));
    expect(c.ok).toMatchObject({ offre: "campus" });
    expect(await ligne("dscg@ecole.test")).toMatchObject({ parcours: "dscg-finance" });
    const sans = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "campus", parcours: "", email: "sans@ecole.test" }));
    expect(sans.ok).toMatchObject({ offre: "campus" });
    expect(await ligne("sans@ecole.test")).toMatchObject({ parcours: null });
    expect(courriels("sans@ecole.test").notification.texte).not.toContain("Diplôme ou parcours");
  });

  it("une valeur hors de la liste est refusée sous son champ, la saisie gardée ; une formation retirée aussi", async () => {
    for (const parcours of ["pas-un-parcours", "seconde-mg"]) {
      const email = `refus-${parcours}@lycee.test`;
      const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "cours", parcours, email }));
      expect(r.ok, parcours).toBeNull();
      expect(r.champ, parcours).toBe("parcours");
      expect(r.error, parcours).toMatch(/diplôme ou le parcours/);
      expect(r.values?.parcours, parcours).toBe(parcours);
      expect(await ligne(email), parcours).toBeUndefined();
    }
  });

  it("une offre qui n'ouvre pas le cours (les épisodes) ne garde pas de parcours", async () => {
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "episodes", parcours: "stmg-gf", email: "episodes@ecole.test" }));
    expect(r.ok).toMatchObject({ offre: "episodes" });
    expect(await ligne("episodes@ecole.test")).toMatchObject({ parcours: null });
  });
});

describe("une demande qui vient du cours n'exige ni l'entreprise ni le niveau", () => {
  it("sans la source du cours, l'offre Classe exige toujours l'entreprise et le niveau", async () => {
    const sansEntreprise = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", parcours: "stmg-gf", email: "arene-1@lycee.test" }));
    expect(sansEntreprise.champ).toBe("entreprise");
    const sansNiveau = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", parcours: "stmg-gf", entreprise: "nova", email: "arene-2@lycee.test" }),
    );
    expect(sansNiveau.champ).toBe("niveau");
    // Une autre source ne vaut pas celle du cours.
    const autre = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "tarifs", email: "arene-3@lycee.test" }));
    expect(autre.champ).toBe("entreprise");
  });

  it("venue du cours, Classe exige le parcours ; Programme, Campus et Classe depuis /tarifs non (décision du propriétaire)", async () => {
    const sans = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "cours", email: "sans-parcours@lycee.test" }));
    expect(sans).toMatchObject({ ok: null, champ: "parcours", error: "Choisissez le diplôme ou le parcours" });
    expect(sans.values).toMatchObject({ offre: "classe", email: "sans-parcours@lycee.test" });
    expect(await ligne("sans-parcours@lycee.test")).toBeUndefined();
    for (const offre of ["programme", "campus"]) {
      const email = `${offre}-cours-sans-parcours@ecole.test`;
      const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre, source: "cours", effectif: "300", email }));
      expect(r.error, offre).toBeNull();
      expect(await ligne(email)).toMatchObject({ parcours: null });
    }
    const tarifs = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", entreprise: "nova", niveau: "3", email: "classe-tarifs@lycee.test" }),
    );
    expect(tarifs.error).toBeNull();
    expect(await ligne("classe-tarifs@lycee.test")).toMatchObject({ parcours: null });
  });

  it("une entreprise ou un niveau hors du registre restent refusés, même venus du cours", async () => {
    const r = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "cours", parcours: "mco", entreprise: "inconnue", email: "x1@lycee.test" }));
    expect(r.champ).toBe("entreprise");
    const n = await envoyerDemandeDeDevisAction(ETAT, formulaire({ ...base, offre: "classe", source: "cours", parcours: "mco", niveau: "9", email: "x2@lycee.test" }));
    expect(n.champ).toBe("niveau");
  });
});
