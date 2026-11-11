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
import { parcoursQuiOuvrent } from "@/config/cours/parcours-de-formation";
import { placerSousLicence } from "./helpers/licence";
import {
  classeSousLicence,
  classeDeLEleve,
  classeDeLEnseignant,
  cloreClasse,
  coursOuvert,
  creerClasse,
  enregistrerProgression,
  rejoindreClasse,
  resumeDeLaClasse,
} from "@/services/cours.service";
import { chapitresLiberesDuPlusRecent, libererLeChapitre } from "@/services/attributions.service";

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
  classe = (await creerClasse({ enseignantId: prof, nom: "BTS CG 1 · groupe A", entreprise: "hotel", parcours: "comptabilite-generale" }))!;
});

describe("une classe du cours", () => {
  it("se crée avec un code lisible et l'entreprise choisie ; sans nom, rien ne se crée ; une entreprise inconnue est ignorée", async () => {
    expect(classe.code).toMatch(/^BTSCG1-[A-Z0-9]{4}$/);
    expect(await creerClasse({ enseignantId: prof, nom: "   " })).toBeNull();
    const c = (await creerClasse({ enseignantId: prof, nom: "Autre", entreprise: "pas-une-entreprise", parcours: "comptabilite-generale" }))!;
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

  it("un chapitre réservé s'ouvre à l'élève par sa classe, quand son enseignant est sous licence", async () => {
    const profSousLicence = await utilisateur();
    await placerSousLicence(profSousLicence);
    const ouverte = (await creerClasse({ enseignantId: profSousLicence, nom: "Sous licence", parcours: "comptabilite-generale" }))!;
    const eleve = await utilisateur();
    expect(await classeSousLicence(eleve)).toBe(false);
    await rejoindreClasse(eleve, classe.code, "Sans licence");
    expect(await classeSousLicence(eleve)).toBe(false);
    await rejoindreClasse(eleve, ouverte.code, "Avec licence");
    expect(await classeSousLicence(eleve)).toBe(true);
  });
});

describe("le suivi de l'enseignant, élève par élève (audit UX du 11 novembre 2026, P1-2, P1-5, P2-9)", () => {
  it("une ligne par élève : le chapitre de sa dernière activité, son étape ; deux homonymes numérotés ; « pas commencé »", async () => {
    const p = await utilisateur();
    const c = (await creerClasse({ enseignantId: p, nom: "Suivi", parcours: "comptabilite-generale" }))!;
    const [lea1, lea2, tom] = [await utilisateur(), await utilisateur(), await utilisateur()];
    await rejoindreClasse(lea1, c.code, "Léa");
    await rejoindreClasse(lea2, c.code, "léa");
    await rejoindreClasse(tom, c.code, "Tom");
    const autre = CHAPITRES[1]!;
    await enregistrerProgression(lea1, { chapitre: chapitre.code, entreprise: "hotel", etape: 2, etapes: {} });
    await new Promise((r) => setTimeout(r, 5));
    await enregistrerProgression(lea1, { chapitre: autre.code, entreprise: "hotel", etape: 1, etapes: {} });
    const resume = (await resumeDeLaClasse(p, c.id))!;
    // Les homonymes, dans l'ordre où ils ont rejoint ; la casse ne les sépare pas.
    expect(resume.map((r) => r.eleve)).toEqual(["Léa n°1", "léa n°2", "Tom"]);
    expect(resume[0]).toMatchObject({ chapitre: autre.code, etape: 1 });
    expect(resume[0]!.majLe).toBeInstanceOf(Date);
    expect(resume[1]).toMatchObject({ chapitre: null, etape: 0, majLe: null });
    // Le tableau d'un chapitre : celui qui ne l'a pas ouvert n'est pas « à l'étape 1 ».
    const lu = (await classeDeLEnseignant(p, c.id, chapitre.code))!;
    expect(lu.progressions.map((x) => [x.eleve, x.commence])).toEqual([
      ["Léa n°1", true],
      ["léa n°2", false],
      ["Tom", false],
    ]);
    // Un autre enseignant ne lit pas la classe.
    expect(await resumeDeLaClasse(autreProf, c.id)).toBeNull();
  });

  it("les chapitres libérés, du plus récent au plus ancien", async () => {
    const p = await utilisateur();
    const c = (await creerClasse({ enseignantId: p, nom: "Libérée", parcours: "comptabilite-generale", liberation: "chapitre" }))!;
    const [a, b] = CHAPITRES.filter((x) => x.parcours === "comptabilite-generale" && !x.libre);
    await libererLeChapitre({ enseignantId: p, classeId: c.id, chapitre: a!.code, libere: true });
    await new Promise((r) => setTimeout(r, 5));
    await libererLeChapitre({ enseignantId: p, classeId: c.id, chapitre: b!.code, libere: true });
    expect(await chapitresLiberesDuPlusRecent(c.id)).toEqual([b!.code, a!.code]);
  });
});

describe("les prérequis annoncés s'ouvrent avec le chapitre qui les annonce, au serveur", () => {
  // « DCG · Comptabilité approfondie » : ses chapitres annoncent des chapitres de comptabilité générale.
  const approfondie = CHAPITRES.filter((c) => c.parcours === "dcg-comptabilite-approfondie");
  const annonce = approfondie.find((c) => (c.prerequis ?? []).some((p) => CHAPITRES.find((x) => x.code === p)!.parcours !== c.parcours))!;
  const prerequis = CHAPITRES.find((c) => c.code === (annonce.prerequis ?? []).find((p) => CHAPITRES.find((x) => x.code === p)!.parcours !== annonce.parcours))!;
  // Un chapitre du même parcours que le prérequis, qu'aucun chapitre ouvert à la classe n'annonce.
  const sansLien = CHAPITRES.find((c) => !c.libre && c.parcours === prerequis.parcours && !parcoursQuiOuvrent(c).includes("dcg-comptabilite-approfondie"))!;

  it("sous l'offre Classe, l'élève et l'enseignant ouvrent le prérequis, hors du parcours, et pas son voisin", async () => {
    const p = await utilisateur();
    await placerSousLicence(p, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
    const c = (await creerClasse({ enseignantId: p, nom: "DCG UE10", parcours: "dcg-comptabilite-approfondie" }))!;
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, c.code, "Inès");
    expect(prerequis.parcours).not.toBe("dcg-comptabilite-approfondie");
    expect(await coursOuvert({ eleve }, annonce)).toBe(true);
    expect(await coursOuvert({ eleve }, prerequis)).toBe(true);
    expect(await coursOuvert({ enseignant: p }, prerequis)).toBe(true);
    // Son voisin, qu'aucun chapitre ouvert à la classe n'annonce, reste fermé.
    expect(await coursOuvert({ eleve }, sansLien)).toBe(false);
    expect(await coursOuvert({ enseignant: p }, sansLien)).toBe(false);
  });

  it("une classe qui libère chapitre par chapitre ouvre le prérequis quand elle libère le chapitre qui l'annonce", async () => {
    const p = await utilisateur();
    await placerSousLicence(p, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
    const c = (await creerClasse({ enseignantId: p, nom: "DCG pas à pas", parcours: "dcg-comptabilite-approfondie", liberation: "chapitre" }))!;
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, c.code, "Inès");
    expect(await coursOuvert({ eleve }, prerequis)).toBe(false);
    await libererLeChapitre({ enseignantId: p, classeId: c.id, chapitre: annonce.code, libere: true });
    expect(await coursOuvert({ eleve }, annonce)).toBe(true);
    expect(await coursOuvert({ eleve }, prerequis)).toBe(true);
    await libererLeChapitre({ enseignantId: p, classeId: c.id, chapitre: annonce.code, libere: false });
    expect(await coursOuvert({ eleve }, prerequis)).toBe(false);
  });
});
