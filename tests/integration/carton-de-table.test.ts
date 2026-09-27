import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE CARTON DE TABLE : L'ÉQUIPE SE DÉCIDE PAR LA PLACE.
 *
 * Le QR de la partie laisse l'application répartir — l'élève tombe dans
 * l'équipe la moins remplie, donc pas forcément celle de ses voisins de table.
 * Le carton renverse l'ordre : on en pose un par table, l'élève s'assoit,
 * scanne, et l'équipe est celle de la table.
 *
 * Ce qui doit tenir, et que ce fichier prouve :
 *
 * · LE RANG NE BOUGE PAS. Il ne peut être ni le nom (les élèves renomment leur
 *   équipe au premier tour) ni l'ordre d'affichage (alphabétique, donc changé
 *   par le renommage) : un carton imprimé le matin aurait désigné la voisine
 *   l'après-midi. C'est l'ordre de création, que rien ne touche.
 *
 * · LA TABLE L'EMPORTE SUR L'ÉQUILIBRAGE. Sinon le carton ne servirait à rien.
 *
 * · CE QUI NE DÉSIGNE RIEN NE CASSE RIEN : on retombe sur l'affectation
 *   automatique, comportement d'avant le QR.
 *
 * · L'ORDRE DES DEUX SCANS NE DÉCIDE PAS DE L'ÉQUIPE. L'élève qui a d'abord
 *   scanné le QR de la partie a été réparti d'office ; scanner ensuite le
 *   carton de sa table doit le rejoindre. Mais au PREMIER TOUR seulement, sous
 *   exactement la permission du geste « rejoindre mes camarades » qu'il a déjà
 *   dans l'arène : passé ce tour, les décisions appartiennent à l'équipe, et
 *   un scan ne déménage plus personne.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  createClassGame,
  promesseDuCarton,
  equipesNumerotees,
  joinGameByCode,
  nommerEquipe,
  resolveCurrentRound,
} from "@/services/game.service";
import { compositionDesEquipes } from "@/services/affectation.service";

let prof: string;
let gameId: string;
let joinCode: string;

/** De quoi clore un tour : l'élève valide, la partie résout. */
const DECISIONS = {
  price: 59,
  productionPlan: 1000,
  marketingBudget: 3000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

/** Un élève tout neuf : c'est un appareil qui arrive, pas un compte. */
let suivant = 0;
async function eleve(nom: string): Promise<string> {
  suivant += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `eleve${suivant}@carton.test`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

/** L'équipe dans laquelle un élève a réellement atterri. */
async function equipeDe(userId: string): Promise<string | null> {
  const composition = await compositionDesEquipes(gameId);
  return composition.find((e) => e.membres.some((m) => m.userId === userId))?.nom ?? null;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "cartons@lycee.test",
    password: "motdepasse!",
    displayName: "M. Cartons",
    schoolName: "Lycée des Tables",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 4,
    botCount: 2,
    seed: 7,
  });
  gameId = partie.gameId;
  joinCode = partie.joinCode;
});

describe("le rang d'équipe", () => {
  it("numérote les équipes humaines, et elles seules", async () => {
    const equipes = await equipesNumerotees(gameId);
    expect(equipes.map((e) => e.rang)).toEqual([1, 2, 3, 4]);
    // Deux bots ont été créés dans la même partie : personne ne s'assoit à
    // leur table, ils n'ont pas de carton.
    expect(new Set(equipes.map((e) => e.teamId)).size).toBe(4);
  });

  it("donne le même rang à la même équipe, appel après appel", async () => {
    const a = await equipesNumerotees(gameId);
    const b = await equipesNumerotees(gameId);
    expect(b).toEqual(a);
  });

  it("nomme l'équipe d'un carton, et refuse ce qui ne désigne rien", async () => {
    const [premiere] = await equipesNumerotees(gameId);
    const vu = await promesseDuCarton({ code: joinCode, rang: premiere!.rang, userId: null });
    expect(vu).toEqual({ equipe: premiere!.nom, sienne: null, deplacera: true });
    expect(await promesseDuCarton({ code: joinCode, rang: 99, userId: null })).toBeNull();
    expect(await promesseDuCarton({ code: "ZZZZZZ", rang: 1, userId: null })).toBeNull();
  });
});

describe("l'élève qui scanne le carton de sa table", () => {
  it("entre dans CETTE équipe, même si une autre est plus vide", async () => {
    const equipes = await equipesNumerotees(gameId);
    const visee = equipes[2]!;

    // On remplit d'abord l'équipe visée : l'affectation automatique irait
    // ailleurs, donc si l'élève y atterrit, c'est bien le carton qui décide.
    for (const nom of ["Ana", "Bilal", "Chloé"]) {
      const j = await joinGameByCode({ code: joinCode, userId: await eleve(nom), equipe: visee.rang });
      expect(j).not.toHaveProperty("error");
    }
    const tardif = await eleve("Diane");
    await joinGameByCode({ code: joinCode, userId: tardif, equipe: visee.rang });
    expect(await equipeDe(tardif)).toBe(visee.nom);

    const composition = await compositionDesEquipes(gameId);
    expect(composition.find((e) => e.nom === visee.nom)!.membres).toHaveLength(4);
  });

  it("rejoint la table de ses camarades même s'il était déjà entré", async () => {
    const equipes = await equipesNumerotees(gameId);
    // Premier scan : celui de la PARTIE, sans carton. L'application répartit.
    const eleveId = await eleve("Elias");
    await joinGameByCode({ code: joinCode, userId: eleveId });
    const dOffice = await equipeDe(eleveId);
    expect(dOffice).not.toBeNull();

    // Puis il s'assoit et scanne le carton de sa table. Sans ce déplacement,
    // c'est l'ORDRE des deux scans qui aurait décidé de son équipe.
    const table = equipes.find((e) => e.nom !== dOffice)!;
    await joinGameByCode({ code: joinCode, userId: eleveId, equipe: table.rang });
    expect(await equipeDe(eleveId)).toBe(table.nom);

    // Et il n'est pas resté dans les deux : on déplace, on ne duplique pas.
    const composition = await compositionDesEquipes(gameId);
    expect(
      composition.filter((e) => e.membres.some((m) => m.userId === eleveId)),
    ).toHaveLength(1);
  });

  it("n'est pas déplacé par un carton une fois le premier tour clos", async () => {
    // Une partie à part : celle du reste du fichier doit rester au tour 1.
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: (await getTeacherOrgId(prof))!,
      periodicity: "quarter",
      humanTeamsCount: 3,
      botCount: 0,
      seed: 7,
    });
    const equipes = await equipesNumerotees(partie.gameId);
    const eleveId = await eleve("Jonas");
    await joinGameByCode({ code: partie.joinCode, userId: eleveId, equipe: equipes[0]!.rang });

    await resolveCurrentRound({
      gameId: partie.gameId,
      userId: eleveId,
      playerDecisions: DECISIONS,
    });

    // Le carton d'une autre table ne le déménage plus : ses décisions et ses
    // résultats appartiennent désormais à son équipe. Il entre quand même.
    const r = await joinGameByCode({
      code: partie.joinCode,
      userId: eleveId,
      equipe: equipes[2]!.rang,
    });
    expect(r).not.toHaveProperty("error");
    const composition = await compositionDesEquipes(partie.gameId);
    const sienne = composition.find((e) => e.membres.some((m) => m.userId === eleveId));
    expect(sienne!.teamId).toBe(equipes[0]!.teamId);

    // ET L'ÉCRAN NE PROMET PAS LE CONTRAIRE. Il annonçait « Vous rejoignez
    // l'équipe X » à un élève qui restait dans la sienne : trouvé dans le
    // navigateur sur une partie au quatrième tour.
    const promesse = await promesseDuCarton({
      code: partie.joinCode,
      rang: equipes[2]!.rang,
      userId: eleveId,
    });
    expect(promesse).toEqual({
      equipe: equipes[2]!.nom,
      sienne: equipes[0]!.nom,
      deplacera: false,
    });
  });

  it("est réparti automatiquement si le rang ne désigne rien", async () => {
    const sansRang = await eleve("Farid");
    await joinGameByCode({ code: joinCode, userId: sansRang, equipe: 42 });
    expect(await equipeDe(sansRang)).not.toBeNull();

    const nul = await eleve("Gaëlle");
    await joinGameByCode({ code: joinCode, userId: nul, equipe: null });
    expect(await equipeDe(nul)).not.toBeNull();
  });
});

describe("le renommage, qui aurait tout cassé", () => {
  it("ne change pas le rang, alors qu'il change l'ordre d'affichage", async () => {
    const avant = await equipesNumerotees(gameId);
    const cible = avant[1]!;
    const membre = (await compositionDesEquipes(gameId)).find((e) => e.nom === cible.nom)
      ?.membres[0];
    const porteur = membre?.userId ?? (await eleve("Hugo"));
    if (!membre) await joinGameByCode({ code: joinCode, userId: porteur, equipe: cible.rang });

    await nommerEquipe({ gameId, userId: porteur, nom: "AAA Les Premiers" });

    const apres = await equipesNumerotees(gameId);
    // Le rang tient : c'est la même équipe, sous un autre nom.
    expect(apres.find((e) => e.rang === cible.rang)!.teamId).toBe(cible.teamId);
    expect(apres.find((e) => e.rang === cible.rang)!.nom).toBe("AAA Les Premiers");
    // Et l'ordre d'affichage, lui, a bien bougé : c'est exactement ce qui
    // aurait fait pointer le carton sur la voisine.
    const affichage = (await compositionDesEquipes(gameId)).map((e) => e.nom);
    expect(affichage[0]).toBe("AAA Les Premiers");

    // Le carton imprimé avant le renommage mène toujours à la bonne table.
    const apresRenommage = await eleve("Inès");
    await joinGameByCode({ code: joinCode, userId: apresRenommage, equipe: cible.rang });
    const equipeReelle = (await compositionDesEquipes(gameId)).find((e) =>
      e.membres.some((m) => m.userId === apresRenommage),
    );
    expect(equipeReelle!.teamId).toBe(cible.teamId);
  });
});

describe("le concours, où la table ne décide pas", () => {
  it("ignore le carton : l'équipe vient de l'inscription", async () => {
    // Une partie de classe dont on bascule le MODE : c'est le seul élément qui
    // entre dans la règle, et monter un tournoi entier pour l'éprouver
    // n'apprendrait rien de plus sur elle.
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: (await getTeacherOrgId(prof))!,
      periodicity: "quarter",
      humanTeamsCount: 3,
      botCount: 0,
      seed: 7,
    });
    const equipes = await equipesNumerotees(partie.gameId);
    // On remplit d'abord la table visée, tant que la partie est encore une
    // partie de classe : sans cela l'affectation automatique pourrait tomber
    // dessus par hasard, et le test ne prouverait rien.
    for (const nom of ["Lina", "Malik"]) {
      await joinGameByCode({
        code: partie.joinCode,
        userId: await eleve(nom),
        equipe: equipes[2]!.rang,
      });
    }
    await db.update(games).set({ mode: "competition" }).where(eq(games.id, partie.gameId));

    // L'écran d'entrée n'annonce rien : promettre une table que l'entrée ne
    // donnera pas serait pire que de ne rien dire.
    expect(
      await promesseDuCarton({ code: partie.joinCode, rang: equipes[2]!.rang, userId: null }),
    ).toBeNull();

    // Et l'entrée elle-même retombe sur l'affectation automatique : la
    // première équipe, vide comme les autres, et non celle du carton.
    const eleveId = await eleve("Kenza");
    await joinGameByCode({ code: partie.joinCode, userId: eleveId, equipe: equipes[2]!.rang });
    const composition = await compositionDesEquipes(partie.gameId);
    const sienne = composition.find((e) => e.membres.some((m) => m.userId === eleveId));
    expect(sienne!.teamId).not.toBe(equipes[2]!.teamId);
  });
});
