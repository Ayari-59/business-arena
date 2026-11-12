import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * L'OFFRE CLASSE OUVRE UN SEUL PARCOURS (décision du propriétaire, 10 novembre 2026 ; audit du même
 * jour : un enseignant sous Classe créait une classe par parcours, et ouvrait ainsi tout le cours).
 *
 * Sous Classe, toutes les classes d'un enseignant suivent un même parcours : celui de sa première
 * classe, ou celui que l'admin lui a attribué. Une seconde classe sur le même parcours se crée ;
 * sur un autre, non. Campus ne change pas. Rien de ce qui existe n'est fermé : une classe déjà
 * créée sur un autre parcours garde ses chapitres.
 *
 * LES CLASSES D'ESSAI NE COMPTENT PAS (décision du propriétaire, 11 novembre 2026 ; audit UX du même
 * jour, P1-4) : une classe créée avant la licence Classe, pendant l'essai, ne fixe pas son parcours ;
 * celui-ci se fixe au devis (l'attribution de l'admin) ou par la première classe créée sous la licence.
 * La classe d'essai garde son parcours et ce qu'il ouvre, comme toute classe déjà créée ; une
 * attribution la restreint comme les autres.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users, coursClasses, organizationMembers, organizations } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import { placerSousLicence, poserUneLicence } from "./helpers/licence";
import { attribuerALEnseignant } from "@/services/attributions.service";
import { choisirLeParcours, coursOuvert, creerClasse, parcoursImposeALEnseignant, rejoindreClasse } from "@/services/cours.service";

const reserves = CHAPITRES.filter((c) => !c.libre);
const deMco = reserves.find((c) => c.parcours === "mco")!;
const deCompta = reserves.find((c) => c.parcours === "comptabilite-generale")!;

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}
const sousClasse = async () => {
  const prof = await utilisateur();
  await placerSousLicence(prof, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
  return prof;
};

describe("sous l'offre Classe, un seul parcours", () => {
  let prof: string;

  beforeAll(async () => {
    prof = await sousClasse();
  });

  it("la première classe choisit le parcours ; la seconde, sur le même, se crée", async () => {
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "BTS MCO 1 A", parcours: "mco" })).not.toBeNull();
    expect(await parcoursImposeALEnseignant(prof)).toBe("mco");
    expect(await creerClasse({ enseignantId: prof, nom: "BTS MCO 1 B", parcours: "mco" })).not.toBeNull();
  });

  it("une classe sur un second parcours est refusée, et le cours reste fermé sur ce parcours", async () => {
    expect(await creerClasse({ enseignantId: prof, nom: "BTS CG 1", parcours: "comptabilite-generale" })).toBeNull();
    expect(await coursOuvert({ enseignant: prof }, deMco)).toBe(true);
    expect(await coursOuvert({ enseignant: prof }, deCompta)).toBe(false);
  });

  it("une classe héritée sans parcours ne peut prendre que celui de la licence", async () => {
    const [h] = await db
      .insert(coursClasses)
      .values({ code: `HERITEE-${randomUUID().slice(0, 4).toUpperCase()}`, nom: "Héritée", creePar: prof, heritee: true, parcours: null })
      .returning({ id: coursClasses.id });
    expect(await choisirLeParcours({ enseignantId: prof, classeId: h!.id, parcours: "comptabilite-generale" })).toBe(false);
    expect(await choisirLeParcours({ enseignantId: prof, classeId: h!.id, parcours: "mco" })).toBe(true);
  });

  it("une classe déjà créée sur un autre parcours, avant la règle, reste ouverte, pour l'enseignant et ses élèves", async () => {
    const ancien = await sousClasse();
    // Deux classes posées en base comme avant la règle : la seconde sur un autre parcours.
    await db.insert(coursClasses).values({ code: `AVANT-${randomUUID().slice(0, 4).toUpperCase()}`, nom: "MCO", creePar: ancien, parcours: "mco" });
    const [cg] = await db
      .insert(coursClasses)
      .values({ code: `AVANT-${randomUUID().slice(0, 4).toUpperCase()}`, nom: "CG", creePar: ancien, parcours: "comptabilite-generale" })
      .returning({ code: coursClasses.code });
    const eleve = await utilisateur();
    expect((await rejoindreClasse(eleve, cg!.code, "Inès")).ok).toBe(true);
    expect(await coursOuvert({ eleve }, deCompta)).toBe(true);
    expect(await coursOuvert({ enseignant: ancien }, deCompta)).toBe(true);
    // Mais une nouvelle classe suit la première : le MCO.
    expect(await parcoursImposeALEnseignant(ancien)).toBe("mco");
    expect(await creerClasse({ enseignantId: ancien, nom: "CG 2", parcours: "comptabilite-generale" })).toBeNull();
    expect(await creerClasse({ enseignantId: ancien, nom: "MCO 2", parcours: "mco" })).not.toBeNull();
  });
});

describe("l'admin qui attribue fixe le parcours de la licence Classe", () => {
  it("un seul parcours attribué : c'est lui, avant toute classe, et un autre est refusé", async () => {
    const prof = await sousClasse();
    await attribuerALEnseignant(prof, ["comptabilite-generale"]);
    expect(await parcoursImposeALEnseignant(prof)).toBe("comptabilite-generale");
    expect(await creerClasse({ enseignantId: prof, nom: "MCO", parcours: "mco" })).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "CG 1", parcours: "comptabilite-generale" })).not.toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "CG 2", parcours: "comptabilite-generale" })).not.toBeNull();
  });

  it("plusieurs parcours attribués : la première classe en choisit un, les suivantes le suivent", async () => {
    const prof = await sousClasse();
    await attribuerALEnseignant(prof, ["mco", "ndrc"]);
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "Hors liste", parcours: "comptabilite-generale" })).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "NDRC 1", parcours: "ndrc" })).not.toBeNull();
    expect(await parcoursImposeALEnseignant(prof)).toBe("ndrc");
    expect(await creerClasse({ enseignantId: prof, nom: "MCO 1", parcours: "mco" })).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "NDRC 2", parcours: "ndrc" })).not.toBeNull();
  });
});

describe("Campus et Programme ne sont pas limités", () => {
  it("sous Campus, une classe par parcours, comme avant", async () => {
    const prof = await utilisateur();
    await placerSousLicence(prof, { arene: "campus" });
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "MCO", parcours: "mco" })).not.toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "CG", parcours: "comptabilite-generale" })).not.toBeNull();
    expect(await coursOuvert({ enseignant: prof }, deCompta)).toBe(true);
  });

  it("sous Programme, de même", async () => {
    const prof = await utilisateur();
    await placerSousLicence(prof, { arene: "programme", entreprises: ["hotel"] });
    expect(await creerClasse({ enseignantId: prof, nom: "MCO", parcours: "mco" })).not.toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "CG", parcours: "comptabilite-generale" })).not.toBeNull();
  });
});

describe("les classes d'essai ne comptent pas", () => {
  /** Un enseignant sans offre, rattaché à son établissement : il crée une classe d'essai, puis la licence Classe arrive. */
  async function essaiPuisClasse(classeDEssai: string) {
    const prof = await utilisateur();
    const [org] = await db
      .insert(organizations)
      .values({ name: "Lycée à l'essai", slug: `essai-${randomUUID()}` })
      .returning({ id: organizations.id });
    await db.insert(organizationMembers).values({ userId: prof, organizationId: org!.id, role: "teacher" });
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    const essai = (await creerClasse({ enseignantId: prof, nom: "Classe d'essai", parcours: classeDEssai }))!;
    expect(essai).not.toBeNull();
    // La licence est enregistrée après la classe d'essai (une milliseconde au moins).
    await new Promise((r) => setTimeout(r, 5));
    await poserUneLicence(org!.id, prof, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
    return { prof, essai };
  }

  it("une classe d'essai ne fixe pas le parcours : la première classe créée sous la licence le choisit", async () => {
    const { prof } = await essaiPuisClasse("comptabilite-generale");
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "MCO 1", parcours: "mco" })).not.toBeNull();
    expect(await parcoursImposeALEnseignant(prof)).toBe("mco");
    // Les suivantes suivent la première classe de la licence, pas la classe d'essai.
    expect(await creerClasse({ enseignantId: prof, nom: "CG 2", parcours: "comptabilite-generale" })).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "MCO 2", parcours: "mco" })).not.toBeNull();
  });

  it("une classe d'essai dont le parcours diffère de celui de la licence garde son parcours et ce qu'il ouvre", async () => {
    const { prof, essai } = await essaiPuisClasse("comptabilite-generale");
    expect(await creerClasse({ enseignantId: prof, nom: "MCO 1", parcours: "mco" })).not.toBeNull();
    const eleve = await utilisateur();
    expect((await rejoindreClasse(eleve, essai.code, "Léa")).ok).toBe(true);
    expect(await coursOuvert({ eleve }, deCompta)).toBe(true);
    expect(await coursOuvert({ eleve }, deMco)).toBe(false);
  });

  it("le parcours attribué au devis la restreint comme les autres classes", async () => {
    const { prof, essai } = await essaiPuisClasse("comptabilite-generale");
    await attribuerALEnseignant(prof, ["mco"]);
    expect(await parcoursImposeALEnseignant(prof)).toBe("mco");
    const eleve = await utilisateur();
    expect((await rejoindreClasse(eleve, essai.code, "Tom")).ok).toBe(true);
    expect(await coursOuvert({ eleve }, deCompta)).toBe(false);
  });

  it("une licence posée aujourd'hui, datée d'avant la classe d'essai, ne la compte pas non plus", async () => {
    // La licence de test commence dix jours avant d'être enregistrée : la classe d'essai, créée
    // entre les deux, ne compte pas.
    const { prof } = await essaiPuisClasse("ndrc");
    expect(await parcoursImposeALEnseignant(prof)).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "MCO", parcours: "mco" })).not.toBeNull();
    expect(await parcoursImposeALEnseignant(prof)).toBe("mco");
  });
});
