import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * LA PROGRESSION D'UN ÉLÈVE DE CLASSE, CÔTÉ SERVEUR (décision du propriétaire du 11 novembre 2026 ; audit UX
 * du même jour, P1-5) :
 *  · elle ne recule jamais : un appareil qui a tout oublié et renvoie « étape 1 » ne remplace plus
 *    « fini » ;
 *  · elle se relit au serveur, pour la classe d'aujourd'hui de l'élève ;
 *  · le code de reprise du profil (celui des épisodes) rend sa place à l'élève sur un autre appareil,
 *    sans en faire un second élève ; seul le code d'un élève de classe passe.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { CHAPITRES } from "@/config/cours/registre";
import { REFUS_DE_LA_REPRISE_EN_CLASSE } from "@/config/reprise";
import {
  classeDeLEleve,
  classeDeLEnseignant,
  creerClasse,
  enregistrerProgression,
  progressionDeLEleve,
  quitterClasse,
  rejoindreClasse,
  resumeDeLaClasse,
} from "@/services/cours.service";
import { codeDeRepriseDuProfil, reprendreProfil } from "@/services/cohortes.service";

const chapitre = CHAPITRES[0]!;
const ids = chapitre.etapes.map((e) => e.id);

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

const reussie = { essais: 1, reussi: true, aide: false };

describe("la progression d'un élève de classe ne recule jamais", () => {
  it("l'appareil qui a tout oublié ne remplace plus ce que l'enseignant voyait", async () => {
    const prof = await utilisateur();
    const classe = (await creerClasse({ enseignantId: prof, nom: "BTS CG 1 · groupe A", entreprise: "nova", parcours: "comptabilite-generale" }))!;
    const lea = await utilisateur();
    await rejoindreClasse(lea, classe.code, "Léa");
    // Léa finit le chapitre, toutes les étapes du premier coup.
    await enregistrerProgression(lea, {
      chapitre: chapitre.code,
      entreprise: "nova",
      etape: ids.length,
      etapes: Object.fromEntries(ids.map((id) => [id, reussie])),
    });
    // Son navigateur oublie tout : elle repart à l'étape 1, et son premier geste part au serveur.
    await enregistrerProgression(lea, {
      chapitre: chapitre.code,
      entreprise: "nova",
      etape: 1,
      etapes: { [ids[0]!]: { essais: 2, reussi: true, aide: true } },
      erreur: { etape: ids[0]!, remarques: ["Une remarque"] },
    });
    const vue = (await classeDeLEnseignant(prof, classe.id, chapitre.code))!.progressions.find((p) => p.eleve === "Léa")!;
    expect(vue.etape).toBe(ids.length);
    expect(Object.keys(vue.etapes).sort()).toEqual([...ids].sort());
    expect(vue.etapes[ids[0]!]).toEqual(reussie);
    // Les remarques de l'essai manqué s'ajoutent, comme avant.
    expect(vue.erreurs[ids[0]!]).toEqual(["Une remarque"]);
    expect((await resumeDeLaClasse(prof, classe.id))!.find((r) => r.eleve === "Léa")!.etape).toBe(ids.length);
  });

  it("le serveur rend la progression de la classe d'aujourd'hui, et rien hors d'une classe", async () => {
    const prof = await utilisateur();
    const classe = (await creerClasse({ enseignantId: prof, nom: "Relue", parcours: "comptabilite-generale" }))!;
    const tom = await utilisateur();
    expect(await progressionDeLEleve(tom, chapitre.code)).toBeNull();
    await rejoindreClasse(tom, classe.code, "Tom");
    await enregistrerProgression(tom, { chapitre: chapitre.code, entreprise: "hotel", etape: 2, etapes: { [ids[1]!]: reussie } });
    expect(await progressionDeLEleve(tom, chapitre.code)).toEqual({ entreprise: "hotel", etape: 2, etapes: { [ids[1]!]: reussie } });
    expect(await progressionDeLEleve(tom, CHAPITRES[1]!.code)).toBeNull();
    // Hors de la classe, plus rien ne se relit.
    await quitterClasse(tom);
    expect(await progressionDeLEleve(tom, chapitre.code)).toBeNull();
  });
});

describe("le code de reprise rend sa place à l'élève de classe", () => {
  it("le code de son profil mène à lui, pas à un second élève", async () => {
    const prof = await utilisateur();
    const classe = (await creerClasse({ enseignantId: prof, nom: "Reprise", parcours: "comptabilite-generale" }))!;
    const lea = await utilisateur();
    await rejoindreClasse(lea, classe.code, "Léa");
    const code = (await codeDeRepriseDuProfil(lea, true))!;
    // Le même code au second appel : celui qu'elle a noté.
    expect(await codeDeRepriseDuProfil(lea, true)).toBe(code);
    const porteur = async (userId: string) => (await classeDeLEleve(userId)) !== null;
    const ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const r = await reprendreProfil({ code: code.toLowerCase().replace(/^(.{4})/, "$1-"), ip, inconnu: REFUS_DE_LA_REPRISE_EN_CLASSE, porteur });
    expect(r).toEqual({ ok: true, userId: lea });
    // La classe ne compte toujours qu'une Léa.
    expect((await resumeDeLaClasse(prof, classe.id))!.map((x) => x.eleve)).toEqual(["Léa"]);
  });

  it("le code d'une personne qui ne suit aucune classe est refusé comme un code inconnu", async () => {
    const seul = await utilisateur();
    const code = (await codeDeRepriseDuProfil(seul, true))!;
    const porteur = async (userId: string) => (await classeDeLEleve(userId)) !== null;
    const ip = `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    expect(await reprendreProfil({ code, ip, inconnu: REFUS_DE_LA_REPRISE_EN_CLASSE, porteur })).toEqual({ ok: false, erreur: REFUS_DE_LA_REPRISE_EN_CLASSE });
    expect(await reprendreProfil({ code: "ZZZZ-ZZZZ", ip, inconnu: REFUS_DE_LA_REPRISE_EN_CLASSE, porteur })).toEqual({ ok: false, erreur: REFUS_DE_LA_REPRISE_EN_CLASSE });
    // Le profil des épisodes garde son refus à lui.
    expect(await reprendreProfil({ code: "ZZZZ-ZZZZ", ip })).toEqual({ ok: false, erreur: "Ce code ne correspond à aucun profil. Vérifiez-le et réessayez." });
  });
});
