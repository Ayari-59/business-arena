import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * L'ADMIN RESTREINT, L'ENSEIGNANT LIBÈRE (décision du propriétaire, novembre 2026 ; migration 0056).
 *
 * Une liste d'attribution limite ce que l'offre ouvre, pour un établissement ou un enseignant,
 * dont la liste l'emporte ; sans liste, l'offre seule décide. Une classe en « chapitre » n'ouvre
 * à ses élèves que les chapitres libérés, et le chapitre libre ; l'enseignant n'y est pas tenu.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import { casDuChapitre } from "@/config/cours/situations";
import { placerSousLicence } from "./helpers/licence";
import { coursOuvert, creerClasse, rejoindreClasse } from "@/services/cours.service";
import { getTeacherOrgId } from "@/services/auth.service";
import {
  attribuerALEnseignant,
  attribuerALEtablissement,
  attributionsPourLAdmin,
  changerLaLiberation,
  libererLeChapitre,
  parcoursAttribues,
} from "@/services/attributions.service";

const reserves = CHAPITRES.filter((c) => !c.libre);
const mco = reserves.filter((c) => c.parcours === "mco");
const compta = reserves.find((c) => c.parcours === "comptabilite-generale")!;
const libre = CHAPITRES.find((c) => c.libre)!;

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

describe("les parcours attribués par l'admin restreignent l'offre", () => {
  let prof: string;
  let org: string;

  beforeAll(async () => {
    prof = await utilisateur();
    await placerSousLicence(prof, { arene: "campus" });
    org = (await getTeacherOrgId(prof))!;
  });

  it("sans liste, l'offre seule décide : Campus ouvre tout", async () => {
    expect(await parcoursAttribues(prof)).toBeNull();
    expect(await coursOuvert({ enseignant: prof }, compta)).toBe(true);
    expect(await coursOuvert({ enseignant: prof }, mco[0]!)).toBe(true);
  });

  it("la liste de l'établissement restreint Campus à ses parcours ; le chapitre libre reste ouvert", async () => {
    await attribuerALEtablissement(org, ["mco", "pas-un-parcours"]);
    expect(await parcoursAttribues(prof)).toEqual(["mco"]);
    expect(await coursOuvert({ enseignant: prof }, mco[0]!)).toBe(true);
    expect(await coursOuvert({ enseignant: prof }, compta)).toBe(false);
    expect(await coursOuvert({ enseignant: prof }, libre)).toBe(true);
    // Une classe ne se crée que sur un parcours attribué.
    expect(await creerClasse({ enseignantId: prof, nom: "Compta", parcours: "comptabilite-generale" })).toBeNull();
    expect(await creerClasse({ enseignantId: prof, nom: "MCO", parcours: "mco" })).not.toBeNull();
  });

  it("la liste de l'enseignant l'emporte ; vidée, celle de l'établissement reprend", async () => {
    await attribuerALEnseignant(prof, ["comptabilite-generale"]);
    expect(await coursOuvert({ enseignant: prof }, compta)).toBe(true);
    expect(await coursOuvert({ enseignant: prof }, mco[0]!)).toBe(false);
    await attribuerALEnseignant(prof, []);
    expect(await parcoursAttribues(prof)).toEqual(["mco"]);
    const vue = (await attributionsPourLAdmin()).find((e) => e.id === org)!;
    expect(vue.parcours).toEqual(["mco"]);
    expect(vue.enseignants.some((t) => t.id === prof)).toBe(true);
    await attribuerALEtablissement(org, []);
    expect(await parcoursAttribues(prof)).toBeNull();
  });

  it("une attribution n'ouvre jamais plus que l'offre : sans licence, rien de réservé", async () => {
    const seul = await utilisateur();
    await attribuerALEnseignant(seul, ["comptabilite-generale"]);
    expect(await coursOuvert({ enseignant: seul }, compta)).toBe(false);
  });
});

describe("l'enseignant libère les chapitres un par un", () => {
  let prof: string;
  let eleve: string;
  let classe: string;

  beforeAll(async () => {
    prof = await utilisateur();
    await placerSousLicence(prof, { arene: "campus" });
    const c = (await creerClasse({ enseignantId: prof, nom: "MCO pas à pas", parcours: "mco", liberation: "chapitre" }))!;
    classe = c.id;
    eleve = await utilisateur();
    await rejoindreClasse(eleve, c.code, "Inès");
  });

  it("au départ, l'élève n'a que le chapitre libre ; l'enseignant a tout", async () => {
    expect(await coursOuvert({ eleve }, libre)).toBe(true);
    expect(await coursOuvert({ eleve }, mco[0]!)).toBe(false);
    expect(await coursOuvert({ enseignant: prof }, mco[0]!)).toBe(true);
  });

  it("un chapitre libéré s'ouvre, avec son cas pratique ; refermé, il se ferme", async () => {
    expect(await libererLeChapitre({ enseignantId: prof, classeId: classe, chapitre: mco[0]!.code, libere: true })).toBe(true);
    expect(await coursOuvert({ eleve }, mco[0]!)).toBe(true);
    expect(await coursOuvert({ eleve }, mco[1]!)).toBe(false);
    const cas = casDuChapitre(mco[0]!.code);
    if (cas) expect(await coursOuvert({ eleve }, cas)).toBe(true);
    await libererLeChapitre({ enseignantId: prof, classeId: classe, chapitre: mco[0]!.code, libere: false });
    expect(await coursOuvert({ eleve }, mco[0]!)).toBe(false);
  });

  it("« tout libérer » ouvre ce que l'offre permet ; un autre enseignant ne touche pas la classe", async () => {
    const autre = await utilisateur();
    expect(await changerLaLiberation({ enseignantId: autre, classeId: classe, mode: "tout" })).toBe(false);
    expect(await libererLeChapitre({ enseignantId: autre, classeId: classe, chapitre: mco[1]!.code, libere: true })).toBe(false);
    expect(await changerLaLiberation({ enseignantId: prof, classeId: classe, mode: "tout" })).toBe(true);
    expect(await coursOuvert({ eleve }, mco[1]!)).toBe(true);
  });

  it("une classe créée sans dire le mode est en « tout » : rien ne change pour les classes existantes", async () => {
    const c = (await creerClasse({ enseignantId: prof, nom: "Comme avant", parcours: "mco" }))!;
    const e = await utilisateur();
    await rejoindreClasse(e, c.code, "Tom");
    expect(await coursOuvert({ eleve: e }, mco[2]!)).toBe(true);
  });
});
