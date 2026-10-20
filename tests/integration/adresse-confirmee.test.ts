import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * L'ADRESSE CONFIRMÉE ET LES DROITS D'ADMINISTRATEUR (migration 0046, décisions du
 * propriétaire).
 *
 * N'importe qui pouvait s'inscrire avec l'adresse d'un autre. Désormais :
 *   · un lien part à l'inscription ; l'ouvrir confirme l'adresse, sans bloquer l'essai ;
 *   · une adresse d'ADMIN_EMAILS ne devient administrateur qu'une fois confirmée ;
 *   · les droits suivent la liste à chaque connexion : une adresse retirée les perd ;
 *     une liste vide ne retire rien à personne ;
 *   · un établissement dont aucun administrateur n'a prouvé son adresse ne reçoit pas de
 *     licence ; un établissement créé par l'administration, sans administrateur encore, si.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, users } from "@/db/schema";
import { getTeacherOrgId, loginTeacher, registerTeacher } from "@/services/auth.service";
import { createEstablishment, getPlatformOverview, getStaffContext } from "@/services/admin.service";
import {
  confirmerParJeton,
  DUREE_DU_LIEN_MS,
  envoyerLeLienDeConfirmation,
  etatDeLAdresse,
  INTERVALLE_ENTRE_DEUX_ENVOIS_MS,
  jetonDeConfirmation,
} from "@/services/confirmation-email.service";
import { attribuerUneLicence, type SaisieDeLicence } from "@/services/vente.service";
import type { Courriel } from "@/lib/courriel";

const JOUR = 24 * 60 * 60 * 1000;
const MOT_DE_PASSE = "motdepasse!";
const ADMIN_EMAILS_D_ORIGINE = process.env.ADMIN_EMAILS;

afterEach(() => {
  process.env.ADMIN_EMAILS = ADMIN_EMAILS_D_ORIGINE;
});

async function inscrit(prefixe = "prof"): Promise<{ userId: string; email: string; orgId: string }> {
  const email = `${prefixe}-${randomUUID()}@lycee.test`;
  const r = await registerTeacher({ email, password: MOT_DE_PASSE, displayName: "Prof", schoolName: "Lycée" });
  if ("error" in r) throw new Error(r.error);
  return { userId: r.userId, email, orgId: (await getTeacherOrgId(r.userId))! };
}

const lien = (u: { userId: string; email: string }, echeance = new Date(Date.now() + DUREE_DU_LIEN_MS)) =>
  jetonDeConfirmation({ id: u.userId, email: u.email }, echeance);

const estAdmin = async (userId: string) => (await getStaffContext(userId))!.isPlatformAdmin;

/** Un administrateur de la plateforme, confirmé, pour attribuer des licences. */
async function administrateur(): Promise<string> {
  const a = await inscrit("direction");
  await db.update(users).set({ isPlatformAdmin: true, emailConfirmeLe: new Date() }).where(eq(users.id, a.userId));
  return a.userId;
}

const vente = (): SaisieDeLicence => ({
  offre: "campus",
  episodes: false,
  entreprise: null,
  niveau: null,
  maxEnseignants: null,
  label: "Année 2026-2027",
  startsAt: new Date(Date.now() - JOUR),
  endsAt: new Date(Date.now() + 300 * JOUR),
  reference: null,
  nature: "vendue",
  prixCatalogueCents: null,
  remise: null,
  motifGratuite: null,
});

describe("le lien de confirmation", () => {
  it("confirme l'adresse une fois ; rouvert, il le dit ; le compte l'affiche", async () => {
    const u = await inscrit();
    expect(await etatDeLAdresse(u.userId)).toEqual({ etablie: false, confirmeLe: null });
    expect(await confirmerParJeton(lien(u))).toEqual({ etat: "confirme" });
    const deja = await confirmerParJeton(lien(u));
    expect(deja.etat).toBe("deja");
    expect((await etatDeLAdresse(u.userId))!.etablie).toBe(true);
  });

  it("expire au bout d'une semaine", async () => {
    const u = await inscrit();
    const jeton = lien(u, new Date(Date.now() - 1000));
    expect(await confirmerParJeton(jeton)).toEqual({ etat: "expire" });
    expect((await etatDeLAdresse(u.userId))!.confirmeLe).toBeNull();
  });

  it("est invalide falsifié, d'un autre compte, ou pour une adresse changée depuis l'envoi", async () => {
    const u = await inscrit();
    const autre = await inscrit();
    const jeton = lien(u);
    // Un caractère de la signature changé.
    const falsifie = jeton.slice(0, -1) + (jeton.endsWith("A") ? "B" : "A");
    expect(await confirmerParJeton(falsifie)).toEqual({ etat: "invalide" });
    // Le jeton de u présenté pour le compte d'un autre.
    expect(await confirmerParJeton(jeton.replace(u.userId, autre.userId))).toEqual({ etat: "invalide" });
    expect(await confirmerParJeton("n'importe quoi")).toEqual({ etat: "invalide" });
    expect(await confirmerParJeton(undefined)).toEqual({ etat: "invalide" });
    // L'adresse du compte a changé : le lien envoyé à l'ancienne ne confirme pas la nouvelle.
    await db.update(users).set({ email: `change-${randomUUID()}@lycee.test` }).where(eq(users.id, u.userId));
    expect(await confirmerParJeton(jeton)).toEqual({ etat: "invalide" });
    expect((await etatDeLAdresse(u.userId))!.confirmeLe).toBeNull();
  });
});

describe("l'envoi du lien", () => {
  it("part à l'adresse du compte, avec un lien qui confirme ; pas deux fois en deux minutes", async () => {
    const u = await inscrit();
    const recus: Courriel[] = [];
    const facteur = async (c: Courriel) => {
      recus.push(c);
      return { envoye: true as const };
    };
    const t0 = new Date();
    expect(await envoyerLeLienDeConfirmation(u.userId, t0, facteur)).toEqual({ etat: "envoye" });
    expect(recus).toHaveLength(1);
    expect(recus[0]!.a).toBe(u.email);
    const url = recus[0]!.texte.match(/https:\/\/\S+\/compte\/confirmer\?jeton=\S+/)?.[0];
    expect(url).toBeTruthy();

    const t1 = new Date(t0.getTime() + INTERVALLE_ENTRE_DEUX_ENVOIS_MS - 1000);
    expect(await envoyerLeLienDeConfirmation(u.userId, t1, facteur)).toEqual({ etat: "trop_tot", minutes: 1 });
    expect(recus).toHaveLength(1);

    const jeton = decodeURIComponent(new URL(url!).searchParams.get("jeton")!);
    expect(await confirmerParJeton(jeton)).toEqual({ etat: "confirme" });
    const t2 = new Date(t0.getTime() + 10 * INTERVALLE_ENTRE_DEUX_ENVOIS_MS);
    expect(await envoyerLeLienDeConfirmation(u.userId, t2, facteur)).toEqual({ etat: "deja_confirme" });
    expect(recus).toHaveLength(1);
  });

  it("un envoi refusé ne compte pas : le suivant part tout de suite", async () => {
    const u = await inscrit();
    const t0 = new Date();
    const enPanne = async () => ({ envoye: false as const, raison: "injoignable" as const });
    expect(await envoyerLeLienDeConfirmation(u.userId, t0, enPanne)).toEqual({ etat: "non_envoye", raison: "injoignable" });
    const ok = async () => ({ envoye: true as const });
    expect(await envoyerLeLienDeConfirmation(u.userId, new Date(t0.getTime() + 1000), ok)).toEqual({ etat: "envoye" });
  });
});

describe("les droits d'administrateur suivent ADMIN_EMAILS", () => {
  it("une adresse listée mais non confirmée ne devient pas administrateur, ni à l'inscription ni à la connexion", async () => {
    const email = `usurpateur-${randomUUID()}@business-arena.test`;
    process.env.ADMIN_EMAILS = `${email}, autre@exemple.fr`;
    const r = await registerTeacher({ email, password: MOT_DE_PASSE, displayName: "X", schoolName: "" });
    if ("error" in r) throw new Error(r.error);
    expect(await estAdmin(r.userId)).toBe(false);
    const c = await loginTeacher({ email, password: MOT_DE_PASSE });
    expect("userId" in c).toBe(true);
    expect(await estAdmin(r.userId)).toBe(false);
  });

  it("la confirmation donne les droits sur-le-champ ; retirée de la liste, l'adresse les perd à la connexion suivante", async () => {
    const u = await inscrit("direction");
    process.env.ADMIN_EMAILS = u.email.toUpperCase();
    expect(await confirmerParJeton(lien(u))).toEqual({ etat: "confirme" });
    expect(await estAdmin(u.userId)).toBe(true);
    // Toujours listée : elle le reste.
    await loginTeacher({ email: u.email, password: MOT_DE_PASSE });
    expect(await estAdmin(u.userId)).toBe(true);
    // Retirée de la liste : la connexion suivante retire les droits.
    process.env.ADMIN_EMAILS = "quelqu-un-d-autre@business-arena.test";
    await loginTeacher({ email: u.email, password: MOT_DE_PASSE });
    expect(await estAdmin(u.userId)).toBe(false);
  });

  it("une liste vide ou absente ne retire rien à personne", async () => {
    const u = await inscrit("direction");
    await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, u.userId));
    for (const liste of ["", " , ", undefined]) {
      if (liste === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = liste;
      await loginTeacher({ email: u.email, password: MOT_DE_PASSE });
      expect(await estAdmin(u.userId)).toBe(true);
    }
  });

  it("un administrateur déjà en place et toujours listé le reste, même sans adresse confirmée", async () => {
    const u = await inscrit("direction");
    await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, u.userId));
    process.env.ADMIN_EMAILS = u.email;
    await loginTeacher({ email: u.email, password: MOT_DE_PASSE });
    expect(await estAdmin(u.userId)).toBe(true);
  });
});

describe("pas de licence sans adresse établie", () => {
  it("refusée à un établissement inscrit dont l'administrateur n'a pas confirmé ; accordée après", async () => {
    const adminId = await administrateur();
    const u = await inscrit();
    await expect(attribuerUneLicence(adminId, u.orgId, vente())).rejects.toThrow(
      new RegExp(`n'a confirmé son adresse \\(${u.email.replace(/[.]/g, "\\.")}\\)`),
    );
    const vue = (await getPlatformOverview(adminId)).organizations.find((o) => o.organizationId === u.orgId)!;
    expect(vue.adressesAConfirmer).toEqual([u.email]);

    expect(await confirmerParJeton(lien(u))).toEqual({ etat: "confirme" });
    await expect(attribuerUneLicence(adminId, u.orgId, vente())).resolves.toHaveProperty("licenceId");
    const apres = (await getPlatformOverview(adminId)).organizations.find((o) => o.organizationId === u.orgId)!;
    expect(apres.adressesAConfirmer).toEqual([]);
  });

  it("accordée à un établissement créé par l'administration, qui n'a pas encore d'administrateur", async () => {
    const adminId = await administrateur();
    const { organizationId } = await createEstablishment({ adminId, name: "Lycée créé par l'administration" });
    await expect(attribuerUneLicence(adminId, organizationId, vente())).resolves.toHaveProperty("licenceId");
  });

  it("accordée dès qu'UN des administrateurs a une adresse établie", async () => {
    const adminId = await administrateur();
    const u = await inscrit();
    const second = await inscrit();
    await db
      .insert(organizationMembers)
      .values({ userId: second.userId, organizationId: u.orgId, role: "org_admin" })
      .onConflictDoNothing();
    await expect(attribuerUneLicence(adminId, u.orgId, vente())).rejects.toThrow(/n'a confirmé son adresse/);
    await db.update(users).set({ provenance: "renater" }).where(eq(users.id, second.userId));
    await expect(attribuerUneLicence(adminId, u.orgId, vente())).resolves.toHaveProperty("licenceId");
  });
});
