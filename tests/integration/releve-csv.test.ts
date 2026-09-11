import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Le relevé en tableur : le format compte autant que les chiffres.
 *
 * Un fichier que l'enseignant doit retoucher avant de s'en servir ne lui fait
 * pas gagner la demi-heure de recopie qu'il est censé lui éviter. Ce que ce
 * test fixe : une ligne par élève, la note en décimale française, le
 * point-virgule qu'attend un tableur configuré en français, et la signature
 * d'octets sans laquelle Excel affiche « Élève » en mojibake.
 *
 * Il fixe aussi ce qui ne doit PAS y être : le relevé d'un autre enseignant.
 */

let sessionCourante: { userId: string; role: "teacher" } | null = null;

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => ({
  getSession: async () => sessionCourante,
}));

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { getTeamSituations, submitDiagnosis } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import { GET } from "@/app/teacher/games/[gameId]/releve/route";
import type { RoundDecisions } from "@/engine/types";

// Un prix et un volume qui ne sont pas ceux que le secteur propose : la
// source des décisions doit les voir comme des choix.
const DECISIONS: RoundDecisions = {
  price: 61,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let prof: string;
let gameId: string;

const appeler = (id: string) =>
  GET(new Request("http://local/releve"), { params: Promise.resolve({ gameId: id }) });

beforeAll(async () => {
  const r = await registerTeacher({
    email: "csv@lycee.test",
    password: "motdepasse!",
    displayName: "M. Tableur",
    schoolName: "Lycée du Tableur",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
  });
  gameId = partie.gameId;

  const inserted = await db
    .insert(users)
    .values([
      { email: "zoe@test.local", displayName: "Zoé Martin" },
      { email: "leo@test.local", displayName: "Léo Dupont" },
    ])
    .returning({ id: users.id });
  for (const [i, u] of inserted.entries()) {
    const j = await joinGameByCode({
      code: partie.joinCode,
      userId: u.id,
      pseudo: i === 0 ? "Zoé Martin" : "Léo Dupont",
    });
    if ("error" in j) throw new Error(j.error);
  }

  // une seule équipe répond, pour que le fichier porte les deux cas
  const { current } = await getTeamSituations(gameId, inserted[0]!.id);
  const def = situationByCode.get(current[0]!.code)!;
  await submitDiagnosis({
    instanceId: current[0]!.instanceId,
    userId: inserted[0]!.id,
    selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
  });
  for (const u of inserted) {
    await submitTeamDecisions({ gameId, userId: u.id, payload: DECISIONS });
  }
  await closeCurrentRound({ gameId, teacherId: prof });
});

describe("export du relevé en tableur", () => {
  it("se télécharge comme un fichier, avec le bon type", async () => {
    sessionCourante = { userId: prof, role: "teacher" };
    const reponse = await appeler(gameId);
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("content-type")).toContain("text/csv");
    const disposition = reponse.headers.get("content-disposition")!;
    // Relevé par le parcours en navigateur, en deux temps. Un accent posé tel
    // quel dans l'en-tête est invalide : le navigateur abandonne le nom entier
    // et enregistre « download ». Et la forme encodée `filename*`, prévue pour
    // les accents, donne le même « download » dès que sa valeur en contient.
    // Le nom doit donc être en ASCII, et cette forme là ne doit pas revenir.
    const nom = disposition.match(/filename="([^"]+)"/)?.[1];
    expect(nom, `en-tête inattendu : ${disposition}`).toBeDefined();
    expect(nom, `« ${nom} » n'est pas purement ASCII`).toMatch(/^[a-z0-9-]+\.csv$/);
    expect(disposition, "filename* renomme le fichier en « download »").not.toContain(
      "filename*",
    );
    // et il porte le code de la partie : trois classes du même secteur
    // donneraient sinon trois fichiers de même nom
    expect(nom).toMatch(/-[a-z0-9]{6}\.csv$/);
  });

  it("porte une ligne par élève, et la signature qui sauve les accents", async () => {
    sessionCourante = { userId: prof, role: "teacher" };
    // Sur les OCTETS, et non sur le texte décodé : la lecture d'une réponse
    // retire la signature au passage, si bien qu'un fichier qui ne l'a jamais
    // eue et un fichier qui l'a se ressemblent parfaitement une fois lus.
    const octets = new Uint8Array(await (await appeler(gameId)).arrayBuffer());
    expect([octets[0], octets[1], octets[2]], "signature d'octets absente").toEqual([
      0xef, 0xbb, 0xbf,
    ]);

    const texte = await (await appeler(gameId)).text();
    const lignes = texte.replace(/^\ufeff/, "").trim().split("\r\n");
    expect(lignes[0]).toContain("Élève;Équipe");
    expect(lignes[0]!.split(";")).toHaveLength(13);
    expect(lignes[0]).toContain("Source des décisions (dernier tour)");
    // deux élèves, donc deux lignes, quel que soit le nombre d'équipes
    expect(lignes).toHaveLength(3);
    expect(texte).toContain("Zoé Martin");
    expect(texte).toContain("Léo Dupont");
    // Les deux équipes ont validé un prix et un volume autres que ceux que le
    // secteur proposait : la source du dernier tour dit qu'elles ont décidé.
    for (const ligne of lignes.slice(1)) {
      expect(ligne.split(";").at(-1), ligne).toBe("prix : modifié · volume : modifié");
    }
  });

  it("écrit les nombres à la française, sinon le tableur les lit comme du texte", async () => {
    sessionCourante = { userId: prof, role: "teacher" };
    const texte = await (await appeler(gameId)).text();
    // aucun point décimal nulle part : ni dans la note, ni dans le score
    for (const ligne of texte.split("\r\n").slice(1)) {
      expect(ligne, ligne).not.toMatch(/\d\.\d/);
    }
    // et la note de l'équipe qui a répondu est bien là, en décimale française
    expect(texte).toMatch(/;\d+(,\d+)?;/);
  });

  it("l'équipe qui n'a rien rendu figure au fichier, sans note", async () => {
    sessionCourante = { userId: prof, role: "teacher" };
    const lignes = (await (await appeler(gameId)).text()).trim().split("\r\n").slice(1);
    const sansNote = lignes.filter((l) => l.split(";")[4] === "");
    expect(sansNote, "l'équipe muette a disparu du relevé").toHaveLength(1);
    // elle garde son nom d'équipe et son élève : rien ne disparaît
    expect(sansNote[0]!.split(";")[0]).not.toBe("");
  });

  it("refuse la partie d'un autre enseignant, et le visiteur sans session", async () => {
    const autre = await registerTeacher({
      email: "autre-csv@lycee.test",
      password: "motdepasse!",
      displayName: "Mme Autre",
      schoolName: "Lycée Autre",
    });
    if ("error" in autre) throw new Error(autre.error);

    sessionCourante = { userId: autre.userId, role: "teacher" };
    expect((await appeler(gameId)).status).toBe(404);

    sessionCourante = null;
    expect((await appeler(gameId)).status).toBe(401);
  });
});
