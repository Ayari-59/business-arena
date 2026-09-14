import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA SUBVENTION EXCEPTIONNELLE, DE BOUT EN BOUT.
 *
 * Le dernier maillon de la chaîne de crise, et le seul qui passe par une
 * personne. Une équipe coule ; le tour suivant exige un financement de
 * sauvetage ; elle emprunte et fait appel à ses associés ; et vient le moment
 * où les deux réunis ne suffisent plus. Jusqu'ici elle était bloquée là, sans
 * issue : ni jouer, ni renoncer.
 *
 * Ce test joue une vraie partie jusqu'à ce mur, dépose le dossier, le fait
 * trancher par l'animateur, et vérifie que l'argent arrive bien en trésorerie
 * à la clôture. C'est la classe de défaut qui compte : des pièces justes, et
 * rien qui les relie.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { getTeacherGameView } from "@/services/game.service";
import {
  demandesDeLaPartie,
  deposerDemande,
  trancherDemande,
} from "@/services/subvention.service";
import { resteApresLeviers, verdictAuMaximum } from "@/services/sauvetage";
import type { RoundDecisions } from "@/engine/types";

/** Produire beaucoup, vendre à perte, dépenser le reste : la ruine méthodique. */
const RUINEUSE: RoundDecisions = {
  price: 10,
  productionPlan: 9000,
  marketingBudget: 60000,
  qualityBudget: 40000,
  maintenanceBudget: 30000,
};

let prof: string;
let eleve: string;
let gameId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "subvention@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Subvention",
    schoolName: "Lycée du Dernier Recours",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 3,
  });
  gameId = partie.gameId;
  const u = await db
    .insert(users)
    .values({ email: "mur@test.local", displayName: "Au mur" })
    .returning({ id: users.id });
  eleve = u[0]!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Au mur" });
  if ("error" in j) throw new Error(j.error);
});

const jouer = async (decisions: RoundDecisions) => {
  await submitTeamDecisions({ gameId, userId: eleve, payload: decisions });
  await closeCurrentRound({ gameId, teacherId: prof });
  return (await getGameView(gameId, eleve))!;
};

describe("la subvention exceptionnelle", () => {
  it("le mur : emprunt et apport épuisés, et le compte n'y est toujours pas", async () => {
    const vue = await jouer(RUINEUSE);
    const exigence = vue.exigenceSauvetage!;
    expect(exigence).not.toBeNull();
    // La banque ne prête plus : les capitaux propres ont fondu, le plafond
    // « dette ≤ 2 × capitaux propres » est franchi.
    expect(exigence.capaciteEmprunt).toBe(0);
    // Et même en appelant les associés jusqu'au bout, il manque encore.
    expect(verdictAuMaximum(exigence).issue).toBe("leviers_epuises");
    expect(resteApresLeviers(exigence)).toBeGreaterThan(0);
    // Personne n'a rien déposé : il n'y a donc rien à montrer.
    expect(vue.demandeSubvention).toBeNull();
  });

  it("le dossier déposé lève le verrou sans rien réunir de plus", async () => {
    const avant = (await getGameView(gameId, eleve))!;
    const demande = Math.round(resteApresLeviers(avant.exigenceSauvetage!));
    await deposerDemande({
      gameId,
      teamId: avant.playerTeamId,
      roundIndex: avant.currentRound,
      montant: demande,
      motif: "Tenir un tour de plus pour écouler le stock invendu.",
    });

    const apres = (await getGameView(gameId, eleve))!;
    expect(apres.demandeSubvention?.statut).toBe("pending");
    expect(apres.demandeSubvention?.montant).toBe(demande);
    // LE POINT : l'équipe a fait tout ce qui était en son pouvoir. Son tour
    // part, même si l'argent n'est pas encore là.
    expect(verdictAuMaximum(apres.exigenceSauvetage!).issue).toBe("demande_deposee");
  });

  it("on ne dépose pas deux dossiers pour le même trou", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    await expect(
      deposerDemande({
        gameId,
        teamId: vue.playerTeamId,
        roundIndex: vue.currentRound,
        montant: 1000,
        motif: "Encore un peu, s'il vous plaît.",
      }),
    ).rejects.toThrow(/déjà déposé/);
  });

  it("le dossier arrive dans l'espace de l'animateur, et nulle part ailleurs", async () => {
    const vueProf = (await getTeacherGameView(gameId, prof))!;
    expect(vueProf.aidRequests).toHaveLength(1);
    const d = vueProf.aidRequests[0]!;
    expect(d.statut).toBe("pending");
    expect(d.motif).toContain("stock invendu");
    // Le nom de l'équipe, pas son identifiant : l'animateur pilote une classe.
    expect(d.teamName.length).toBeGreaterThan(0);
    // Et le tour visé est encore ouvert : la subvention peut encore y entrer.
    expect(d.encoreUtile).toBe(true);
  });

  it("l'animateur accorde une partie seulement, et l'équipe le voit", async () => {
    const demandes = await demandesDeLaPartie(gameId);
    const d = demandes[0]!;
    await trancherDemande({
      requestId: d.id,
      teacherId: prof,
      accord: true,
      montant: Math.round(d.montant / 2),
      note: "Accordé une fois, pas deux.",
    });

    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.demandeSubvention?.statut).toBe("granted");
    expect(vue.demandeSubvention?.montantAccorde).toBe(Math.round(d.montant / 2));
    expect(vue.demandeSubvention?.note).toBe("Accordé une fois, pas deux.");
    // Elle compte désormais comme de la trésorerie réunie.
    expect(vue.exigenceSauvetage!.subventionAccordee).toBe(Math.round(d.montant / 2));
  });

  it("une réponse donnée ne se reprend pas", async () => {
    const d = (await demandesDeLaPartie(gameId))[0]!;
    await expect(
      trancherDemande({ requestId: d.id, teacherId: prof, accord: false }),
    ).rejects.toThrow(/déjà été tranchée/);
  });

  it("un autre enseignant ne voit ni ne tranche les dossiers de cette partie", async () => {
    const autre = await registerTeacher({
      email: "curieux@lycee.test",
      password: "motdepasse!",
      displayName: "M. Curieux",
      schoolName: "Lycée d'à côté",
    });
    if ("error" in autre) throw new Error(autre.error);
    expect(await getTeacherGameView(gameId, autre.userId)).toBeNull();
    const d = (await demandesDeLaPartie(gameId))[0]!;
    await expect(
      trancherDemande({ requestId: d.id, teacherId: autre.userId, accord: true }),
    ).rejects.toThrow(/introuvable/);
  });

  it("à la clôture, la subvention accordée entre vraiment en trésorerie", async () => {
    const accorde = (await demandesDeLaPartie(gameId))[0]!.montantAccorde!;
    const vue = await jouer(RUINEUSE);
    // LE BOUT DE LA CHAÎNE : le geste de l'animateur est devenu un produit
    // exceptionnel encaissé, sur sa propre ligne.
    expect(vue.lastResult!.incomeStatement.rescueSubsidy).toBeCloseTo(accorde, 2);
    const flux = vue.lastResult!.cashFlow.items.find(
      (i) => i.label === "subvention_exceptionnelle",
    );
    expect(flux?.amount).toBeCloseTo(accorde, 2);
  });

  it("et elle ne se réencaisse pas au tour suivant", async () => {
    // La subvention est attachée au tour demandé : la voir revenir chaque tour
    // serait une rente, pas un sauvetage.
    const vue = await jouer(RUINEUSE);
    expect(vue.lastResult!.incomeStatement.rescueSubsidy).toBeUndefined();
  });
});
