import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE SUIVI DES ACTIVITÉS EN CLASSE, CÔTÉ SERVEUR (migration 0057 ; services/activites.service.ts).
 *
 * Un élève de classe : chaque geste corrigé au serveur s'écrit pour sa classe, borné. Un visiteur sans
 * classe : rien ne s'écrit. L'enseignant de la classe lit ses élèves, activité par activité ; un autre
 * enseignant, rien. Un élève parti ne se lit plus ; la classe supprimée emporte ses lignes.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { coursActivites, coursClasses, users } from "@/db/schema";
import { RAPPROCHEMENT_DE_MARS as b } from "@/config/cours/bureaux/rapprochement-de-mars";
import type { EtapeDeClassement } from "@/config/cours/bureaux/types";
import { LE_DECOUVERT_DE_NOVA as s } from "@/config/cours/scenarios/le-decouvert-de-nova";
import { corrigerAuBureau } from "@/pedagogy/cours/bureau-servi";
import { corrigerAuScenario } from "@/pedagogy/cours/scenario-servi";
import { REMARQUES_GARDEES_PAR_ETAPE } from "@/pedagogy/cours/suivi-des-activites";
import { activitesDeLaClasse, enregistrerActivite } from "@/services/activites.service";
import { creerClasse, quitterClasse, rejoindreClasse } from "@/services/cours.service";

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

const pile = b.etapes.find((e) => e.id === "la-pile") as EtapeDeClassement;
const fauxClassement = { etape: pile.id, geste: "classer", choix: Object.fromEntries(pile.elements.map((x) => [x.code, "rien"])) };
const bureau = (envoi: unknown) => ({ nature: "bureau" as const, activite: b, envoi, retour: corrigerAuBureau(b, envoi) });

let prof: string;
let autreProf: string;
let classe: { id: string; code: string };

beforeAll(async () => {
  prof = await utilisateur();
  autreProf = await utilisateur();
  // Le parcours du bureau : il est dans les activités de la classe.
  classe = (await creerClasse({ enseignantId: prof, nom: "BTS CG 2", parcours: b.parcours }))!;
});

describe("l'enregistrement d'un geste corrigé", () => {
  it("un visiteur sans classe n'écrit rien", async () => {
    const seul = await utilisateur();
    expect(await enregistrerActivite(seul, bureau(fauxClassement))).toBe(false);
    expect(await db.select().from(coursActivites).where(eq(coursActivites.userId, seul))).toHaveLength(0);
  });

  it("un envoi refusé par le correcteur n'écrit rien", async () => {
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, classe.code, "Refusé");
    expect(await enregistrerActivite(eleve, bureau({ etape: "forgee", geste: "montrer" }))).toBe(false);
    expect(await enregistrerActivite(eleve, { nature: "bureau", activite: b, envoi: {}, retour: { refus: "licence" } })).toBe(false);
    expect(await db.select().from(coursActivites).where(eq(coursActivites.userId, eleve))).toHaveLength(0);
  });

  it("un élève de classe : la ligne s'écrit pour sa classe, et se borne", async () => {
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, classe.code, "Léa");
    for (let i = 0; i < 40; i += 1) expect(await enregistrerActivite(eleve, bureau(fauxClassement))).toBe(true);
    const [l] = await db
      .select()
      .from(coursActivites)
      .where(and(eq(coursActivites.userId, eleve), eq(coursActivites.code, b.code)));
    expect(l).toMatchObject({ classeId: classe.id, nature: "bureau", etat: "en-cours", essais: 40 });
    expect(l!.erreurs[pile.id]).toHaveLength(REMARQUES_GARDEES_PAR_ETAPE);
  });

  it("un scénario fini garde sa fin et la meilleure suite", async () => {
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, classe.code, "Yanis");
    const suite = s.decisions.map((d) => d.options[0]!);
    for (let i = 1; i <= suite.length; i += 1) {
      const envoi = { geste: "choisir", suite: suite.slice(0, i) };
      expect(await enregistrerActivite(eleve, { nature: "scenario", activite: s, envoi, retour: corrigerAuScenario(s, envoi) })).toBe(true);
    }
    const [l] = await db.select().from(coursActivites).where(eq(coursActivites.userId, eleve));
    expect(l).toMatchObject({ nature: "scenario", code: s.code, etat: "fini", essais: 1, fin: s.bilan(suite).fin.titre, meilleure: s.bilan(suite).meilleure });
  });
});

describe("la lecture de l'enseignant", () => {
  it("l'enseignant de la classe lit chaque élève, activité par activité ; un autre enseignant, rien", async () => {
    expect(await activitesDeLaClasse(autreProf, classe.id)).toBeNull();
    const vue = (await activitesDeLaClasse(prof, classe.id))!;
    const duBureau = vue.find((a) => a.nature === "bureau" && a.code === b.code)!;
    expect(duBureau.eleves.find((l) => l.eleve === "Léa")).toMatchObject({ etat: "en-cours", essais: 40 });
    expect(duBureau.eleves.find((l) => l.eleve === "Yanis")).toMatchObject({ etat: "non-commence", essais: 0 });
    expect(duBureau.frequentes.length).toBeGreaterThan(0);
    // Le scénario commencé se lit, qu'il soit du parcours de la classe ou non.
    const duScenario = vue.find((a) => a.nature === "scenario" && a.code === s.code)!;
    expect(duScenario.eleves.find((l) => l.eleve === "Yanis")).toMatchObject({ etat: "fini" });
  });

  it("seules les activités du parcours de la classe, et celles qu'un élève a commencées", async () => {
    const c = (await creerClasse({ enseignantId: prof, nom: "Vide", parcours: b.parcours }))!;
    const vue = (await activitesDeLaClasse(prof, c.id))!;
    expect(vue.length).toBeGreaterThan(0);
    const { parcoursQuiOuvrent } = await import("@/config/cours/parcours-de-formation");
    const { BUREAUX } = await import("@/config/cours/bureaux");
    for (const a of vue.filter((x) => x.nature === "bureau")) expect(parcoursQuiOuvrent(BUREAUX.find((x) => x.code === a.code)!)).toContain(b.parcours);
  });

  it("un élève parti de la classe ne se lit plus ; la classe supprimée emporte ses lignes", async () => {
    const eleve = await utilisateur();
    await rejoindreClasse(eleve, classe.code, "Partie");
    await enregistrerActivite(eleve, bureau(fauxClassement));
    await quitterClasse(eleve);
    const vue = (await activitesDeLaClasse(prof, classe.id))!;
    expect(vue[0]!.eleves.some((l) => l.eleve === "Partie")).toBe(false);
    await db.delete(coursClasses).where(eq(coursClasses.id, classe.id));
    expect(await db.select().from(coursActivites).where(eq(coursActivites.classeId, classe.id))).toHaveLength(0);
  });
});
