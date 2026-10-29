import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * QUI OUVRE QUEL CHAPITRE (décision du propriétaire, octobre 2026).
 *
 * La Découverte, sans licence : le seul chapitre libre. L'offre Classe : les chapitres du
 * parcours de la classe (`cours_classes.parcours`, migration 0052), pour l'élève par sa
 * classe et pour l'enseignant par les classes qu'il a créées. Programme : de même, les
 * parcours des classes de l'établissement. Campus : tous les chapitres.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { coursClasses, users } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import { placerSousLicence } from "./helpers/licence";
import { choisirLeParcours, classeAChoisirSonParcours, coursOuvert, creerClasse, rejoindreClasse } from "@/services/cours.service";
import { CHAPITRES_DES_PARCOURS_DE_FORMATION } from "@/config/cours/parcours-de-formation";
import { casDuChapitre } from "@/config/cours/situations";

const reserves = CHAPITRES.filter((c) => !c.libre);
const deLaClasse = reserves.find((c) => c.parcours === "mco")!;
const dUnAutre = reserves.find((c) => c.parcours === "comptabilite-generale")!;
const libre = CHAPITRES.find((c) => c.libre)!;

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

describe("l'accès au cours selon l'offre", () => {
  let profClasse: string;
  let eleveClasse: string;
  let profCampus: string;
  let eleveCampus: string;
  let sansLicence: string;

  beforeAll(async () => {
    profClasse = await utilisateur();
    await placerSousLicence(profClasse, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
    const c = (await creerClasse({ enseignantId: profClasse, nom: "BTS MCO 1", parcours: "mco" }))!;
    eleveClasse = await utilisateur();
    await rejoindreClasse(eleveClasse, c.code, "Léa");

    profCampus = await utilisateur();
    await placerSousLicence(profCampus, { arene: "campus" });
    const d = (await creerClasse({ enseignantId: profCampus, nom: "Campus", parcours: "mco" }))!;
    eleveCampus = await utilisateur();
    await rejoindreClasse(eleveCampus, d.code, "Yanis");

    sansLicence = await utilisateur();
  });

  it("Découverte : le seul chapitre libre", async () => {
    expect(await coursOuvert({ enseignant: sansLicence, eleve: sansLicence }, libre)).toBe(true);
    expect(await coursOuvert({ enseignant: sansLicence, eleve: sansLicence }, deLaClasse)).toBe(false);
  });

  it("Classe : le parcours de la classe s'ouvre, un autre parcours reste fermé", async () => {
    expect(await coursOuvert({ eleve: eleveClasse }, deLaClasse)).toBe(true);
    expect(await coursOuvert({ eleve: eleveClasse }, dUnAutre)).toBe(false);
    expect(await coursOuvert({ enseignant: profClasse }, deLaClasse)).toBe(true);
    expect(await coursOuvert({ enseignant: profClasse }, dUnAutre)).toBe(false);
  });

  it("une classe nouvelle sans parcours (ou d'un parcours inconnu) ne se crée pas", async () => {
    expect(await creerClasse({ enseignantId: profClasse, nom: "Sans parcours" })).toBeNull();
    expect(await creerClasse({ enseignantId: profClasse, nom: "X", parcours: "pas-un-parcours" })).toBeNull();
  });

  it("une classe d'avant la migration 0052 (héritée, sans parcours) garde l'accès d'avant, jusqu'au choix du parcours", async () => {
    for (const arene of ["classe", "programme"] as const) {
      const prof = await utilisateur();
      await placerSousLicence(prof, arene === "classe" ? { arene, entreprises: ["hotel"], niveaux: [2] } : { arene, entreprises: ["hotel"] });
      const c = (await creerClasse({ enseignantId: prof, nom: "Ancienne", parcours: "mco" }))!;
      // Ce que la migration 0052 pose sur les classes existantes : héritée, sans parcours.
      await db.update(coursClasses).set({ parcours: null, heritee: true }).where(eq(coursClasses.id, c.id));
      const eleve = await utilisateur();
      await rejoindreClasse(eleve, c.code, "Noé");
      for (const ch of [deLaClasse, dUnAutre]) {
        expect(await coursOuvert({ eleve }, ch), arene).toBe(true);
        expect(await coursOuvert({ enseignant: prof }, ch), arene).toBe(true);
      }
      expect(await classeAChoisirSonParcours(prof, c.id)).toBe(true);
      expect(await choisirLeParcours({ enseignantId: prof, classeId: c.id, parcours: "mco" })).toBe(true);
      expect(await classeAChoisirSonParcours(prof, c.id)).toBe(false);
      expect(await coursOuvert({ eleve }, deLaClasse)).toBe(true);
      expect(await coursOuvert({ eleve }, dUnAutre)).toBe(false);
      expect(await coursOuvert({ enseignant: prof }, dUnAutre)).toBe(false);
    }
  });

  it("Programme : les parcours des classes de l'établissement, pas les autres", async () => {
    const prof = await utilisateur();
    await placerSousLicence(prof, { arene: "programme", entreprises: ["hotel"] });
    const c = (await creerClasse({ enseignantId: prof, nom: "BTS CG", parcours: "comptabilite-generale" }))!;
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, c.code, "Inès");
    expect(await coursOuvert({ eleve, enseignant: prof }, dUnAutre)).toBe(true);
    expect(await coursOuvert({ eleve }, deLaClasse)).toBe(false);
    expect(await coursOuvert({ enseignant: prof }, deLaClasse)).toBe(false);
  });

  it("Classe, parcours BUT GEA : les chapitres que le parcours regroupe s'ouvrent, avec leurs cas ; les autres restent fermés", async () => {
    const prof = await utilisateur();
    await placerSousLicence(prof, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
    const c = (await creerClasse({ enseignantId: prof, nom: "BUT GEA 2", parcours: "but-gea" }))!;
    expect(c).toBeTruthy();
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, c.code, "Sacha");
    const gea = CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]!;
    // Un chapitre de la comptabilité générale, un du contrôle de gestion, un de l'UE10 : trois parcours d'origine.
    const ouverts = (["comptabilite-generale", "controle-de-gestion", "dcg-comptabilite-approfondie"] as const).map((p) => reserves.find((x) => x.parcours === p && gea.includes(x.code))!);
    for (const ch of ouverts) {
      expect(gea, ch.code).toContain(ch.code);
      expect(await coursOuvert({ eleve }, ch), ch.code).toBe(true);
      expect(await coursOuvert({ enseignant: prof }, ch), ch.code).toBe(true);
    }
    const cas = casDuChapitre("le-test-de-depreciation")!;
    expect(await coursOuvert({ eleve }, cas)).toBe(true);
    // Un chapitre du BTS MCO qui ne cite aucune compétence du BUT GEA reste fermé.
    const ferme = reserves.find((x) => x.parcours === "mco" && !gea.includes(x.code))!;
    expect(await coursOuvert({ eleve }, ferme)).toBe(false);
    expect(await coursOuvert({ enseignant: prof }, ferme)).toBe(false);
    // Le parcours de formation se choisit aussi pour une classe héritée.
    const h = (await creerClasse({ enseignantId: prof, nom: "Ancienne GEA", parcours: "mco" }))!;
    await db.update(coursClasses).set({ parcours: null, heritee: true }).where(eq(coursClasses.id, h.id));
    expect(await choisirLeParcours({ enseignantId: prof, classeId: h.id, parcours: "but-tc" })).toBe(true);
  });

  it("Campus : tout est ouvert", async () => {
    for (const ch of [deLaClasse, dUnAutre]) {
      expect(await coursOuvert({ eleve: eleveCampus }, ch)).toBe(true);
      expect(await coursOuvert({ enseignant: profCampus }, ch)).toBe(true);
    }
  });

});
