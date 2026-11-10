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
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users, coursClasses } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import { placerSousLicence } from "./helpers/licence";
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
