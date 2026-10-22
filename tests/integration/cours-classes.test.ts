import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LES CLASSES DU COURS, CÔTÉ SERVEUR.
 *
 * Ce que le navigateur envoie est borné : un élève n'écrit que SA progression, dans SA
 * classe ; un chapitre ou une entreprise inconnus ne s'écrivent pas ; les étapes
 * inconnues sont ignorées ; les remarques sont coupées et en nombre limité. Un
 * enseignant ne lit ni ne clôt la classe d'un autre. Une classe close refuse les
 * nouveaux élèves, pas ceux qui y sont déjà.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import {
  classeDeLEleve,
  classeDeLEnseignant,
  cloreClasse,
  creerClasse,
  enregistrerProgression,
  rejoindreClasse,
} from "@/services/cours.service";

const chapitre = CHAPITRES[0]!;
const [, apport] = chapitre.etapes;

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

let prof: string;
let autreProf: string;
let classe: { id: string; code: string };

beforeAll(async () => {
  prof = await utilisateur();
  autreProf = await utilisateur();
  classe = (await creerClasse({ enseignantId: prof, nom: "BTS CG 1 · groupe A", entreprise: "hotel" }))!;
});

describe("une classe du cours", () => {
  it("se crée avec un code lisible et l'entreprise choisie ; sans nom, rien ne se crée ; une entreprise inconnue est ignorée", async () => {
    expect(classe.code).toMatch(/^BTSCG1-[A-Z0-9]{4}$/);
    expect(await creerClasse({ enseignantId: prof, nom: "   " })).toBeNull();
    const c = (await creerClasse({ enseignantId: prof, nom: "Autre", entreprise: "pas-une-entreprise" }))!;
    expect((await classeDeLEnseignant(prof, c.id, chapitre.code))!.classe.entreprise).toBeNull();
  });

  it("se rejoint par son code et un prénom ; sans prénom ou avec un code inconnu, non", async () => {
    const eleve = await utilisateur();
    expect(await rejoindreClasse(eleve, classe.code, "  ")).toEqual({ ok: false, refus: "nom" });
    expect(await rejoindreClasse(eleve, "NIMPORTE-QUOI", "Léa")).toEqual({ ok: false, refus: "inconnu" });
    expect(await rejoindreClasse(eleve, classe.code.toLowerCase(), "  Léa   Martin ")).toEqual({ ok: true, nom: "BTS CG 1 · groupe A" });
    expect((await classeDeLEleve(eleve))!.eleve).toBe("Léa Martin");
  });

  it("la progression envoyée est bornée, et l'enseignant la lit ; un élève sans progression compte à l'étape 0", async () => {
    const eleve = await utilisateur();
    const absent = await utilisateur();
    await rejoindreClasse(eleve, classe.code, "Yanis");
    await rejoindreClasse(absent, classe.code, "Absent");
    expect(
      await enregistrerProgression(eleve, { chapitre: "inconnu", entreprise: "hotel", etape: 1, etapes: {} }),
    ).toBe(false);
    expect(
      await enregistrerProgression(eleve, { chapitre: chapitre.code, entreprise: "inconnue", etape: 1, etapes: {} }),
    ).toBe(false);
    const longue = "x".repeat(1000);
    expect(
      await enregistrerProgression(eleve, {
        chapitre: chapitre.code,
        entreprise: "hotel",
        etape: 9999,
        etapes: {
          [apport!.id]: { essais: 2, reussi: true, aide: false },
          "etape-forgee": { essais: 1, reussi: true, aide: false },
        },
        erreur: { etape: apport!.id, remarques: [longue, "", "L'argent reçu en banque se passe au débit."] },
      }),
    ).toBe(true);
    const lu = (await classeDeLEnseignant(prof, classe.id, chapitre.code))!;
    const yanis = lu.progressions.find((p) => p.eleve === "Yanis")!;
    expect(yanis.etape).toBe(chapitre.etapes.length);
    expect(Object.keys(yanis.etapes)).toEqual([apport!.id]);
    expect(yanis.erreurs[apport!.id]).toHaveLength(2);
    expect(yanis.erreurs[apport!.id]![0]!.length).toBe(300);
    expect(lu.progressions.find((p) => p.eleve === "Absent")!.etape).toBe(0);
  });

  it("un élève sans classe n'écrit rien", async () => {
    const seul = await utilisateur();
    expect(await enregistrerProgression(seul, { chapitre: chapitre.code, entreprise: "nova", etape: 1, etapes: {} })).toBe(false);
  });

  it("un autre enseignant ne lit ni ne clôt la classe", async () => {
    expect(await classeDeLEnseignant(autreProf, classe.id, chapitre.code)).toBeNull();
    expect(await cloreClasse({ enseignantId: autreProf, classeId: classe.id, close: true })).toBe(false);
  });

  it("close, elle refuse les nouveaux élèves, pas ceux qui y sont", async () => {
    const deja = await utilisateur();
    await rejoindreClasse(deja, classe.code, "Déjà là");
    expect(await cloreClasse({ enseignantId: prof, classeId: classe.id, close: true })).toBe(true);
    const nouveau = await utilisateur();
    expect(await rejoindreClasse(nouveau, classe.code, "Trop tard")).toEqual({ ok: false, refus: "close" });
    expect((await rejoindreClasse(deja, classe.code, "Déjà là")).ok).toBe(true);
    await cloreClasse({ enseignantId: prof, classeId: classe.id, close: false });
  });
});
