import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * SE RENDRE À SOI-MÊME, DANS UNE PARTIE DE CLASSE.
 *
 * L'élève est reconnu par son cookie invité, donc par son navigateur. Il
 * change de poste, vide ses cookies, passe au téléphone : l'application ne le
 * reconnaissait plus et le rangeait dans une équipe quelconque, sans message
 * et sans retour possible — la panne que `affectation.service` décrit depuis
 * le début. Le concours avait son remède ; la classe l'a maintenant aussi.
 *
 * Ce que ce fichier prouve :
 *
 * · CHACUN A LE SIEN, DÈS SON ENTRÉE. Le donner à la demande laisserait sans
 *   filet celui qui n'a jamais ouvert le tiroir, c'est-à-dire justement celui
 *   qui perdra son appareil sans s'y être préparé.
 *
 * · LE CODE REND L'IDENTITÉ, PAS UNE NOUVELLE. C'est tout l'objet : retrouver
 *   son équipe, ses décisions, son historique.
 *
 * · IL SURVIT AU CHANGEMENT D'ÉQUIPE. Déplacer un élève supprime et réinsère
 *   sa ligne `players` : un code rangé là aurait disparu au premier carton de
 *   table scanné.
 *
 * · ON NE LE DEVINE PAS. Huit caractères se cassent à l'aveugle si on laisse
 *   essayer ; les tentatives sont comptées par adresse, et un code mal formé
 *   coûte autant qu'un code inconnu.
 *
 * · ON PEUT EN CHANGER, et l'ancien meurt.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  archiverPartie,
  createClassGame,
  equipesNumerotees,
  joinGameByCode,
} from "@/services/game.service";
import { compositionDesEquipes } from "@/services/affectation.service";
import {
  codeDeRepriseDuJoueur,
  codesDeRepriseDeLaPartie,
  creerLesCodesManquants,
  joueursSansCode,
  regenererCodeDeReprise,
  reprendreSaPlace,
} from "@/services/reprise.service";
import { db as base } from "@/db";
import { gameRecoveries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { LONGUEUR_CODE_REPRISE, MAX_ECHECS_REPRISE, ALPHABET_REPRISE } from "@/config/reprise";
import { PARTIE_ARCHIVEE } from "@/services/archivage";

let prof: string;
let gameId: string;
let joinCode: string;
let lea: string;
let sam: string;

let suivant = 0;
async function nouvelEleve(nom: string): Promise<string> {
  suivant += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `eleve${suivant}@reprise.test`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

async function equipeDe(userId: string, partie = gameId): Promise<string | null> {
  const composition = await compositionDesEquipes(partie);
  return composition.find((e) => e.membres.some((m) => m.userId === userId))?.nom ?? null;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "reprise@lycee.test",
    password: "motdepasse!",
    displayName: "M. Reprise",
    schoolName: "Lycée des Clés",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 3,
    botCount: 0,
    seed: 7,
  });
  gameId = partie.gameId;
  joinCode = partie.joinCode;

  lea = await nouvelEleve("Léa");
  sam = await nouvelEleve("Sam");
  await joinGameByCode({ code: joinCode, userId: lea, pseudo: "Léa" });
  await joinGameByCode({ code: joinCode, userId: sam, pseudo: "Sam" });
});

describe("le code, donné d'office", () => {
  it("existe dès l'entrée, et il est personnel", async () => {
    const codeLea = await codeDeRepriseDuJoueur(gameId, lea);
    const codeSam = await codeDeRepriseDuJoueur(gameId, sam);
    expect(codeLea).toHaveLength(LONGUEUR_CODE_REPRISE);
    expect(codeSam).not.toBe(codeLea);
    // Sans I, L, O, 0 ni 1 : un code se recopie à la main.
    for (const c of codeLea!) expect(ALPHABET_REPRISE).toContain(c);
  });

  it("ne change pas quand l'élève revient : il l'a justement noté", async () => {
    const avant = await codeDeRepriseDuJoueur(gameId, lea);
    await joinGameByCode({ code: joinCode, userId: lea, pseudo: "Léa" });
    expect(await codeDeRepriseDuJoueur(gameId, lea)).toBe(avant);
  });

  it("survit au changement d'équipe, qui réécrit pourtant la ligne du joueur", async () => {
    const avant = await codeDeRepriseDuJoueur(gameId, sam);
    const sienne = await equipeDe(sam);
    const ailleurs = (await equipesNumerotees(gameId)).find((e) => e.nom !== sienne)!;
    // Un carton de table scanné : l'élève change d'équipe au premier tour.
    await joinGameByCode({ code: joinCode, userId: sam, equipe: ailleurs.rang });
    expect(await equipeDe(sam)).toBe(ailleurs.nom);
    expect(await codeDeRepriseDuJoueur(gameId, sam)).toBe(avant);
  });

  it("l'enseignant a la liste, et elle nomme l'équipe de chacun", async () => {
    const codes = await codesDeRepriseDeLaPartie(gameId, prof);
    expect(codes).toHaveLength(2);
    expect(codes.map((c) => c.pseudo).sort()).toEqual(["Léa", "Sam"]);
    for (const c of codes) expect(c.teamLabel).not.toBe("");
    // Et seulement le sien : la liste d'une partie qui n'est pas la vôtre est
    // vide, pas refusée — un enseignant n'a pas à savoir qu'elle existe.
    const autre = await registerTeacher({
      email: "voisin@reprise.test",
      password: "motdepasse!",
      displayName: "Mme Voisine",
      schoolName: "Lycée Voisin",
    });
    if ("error" in autre) throw new Error(autre.error);
    expect(await codesDeRepriseDeLaPartie(gameId, autre.userId)).toEqual([]);
  });
});

describe("le code rend sa place", () => {
  it("rend l'identité de son propriétaire, son équipe et sa partie", async () => {
    const code = (await codeDeRepriseDuJoueur(gameId, lea))!;
    const repris = await reprendreSaPlace({ code, ip: "10.0.0.1" });
    expect(repris).toEqual({
      userId: lea,
      gameId,
      equipe: await equipeDe(lea),
      pseudo: "Léa",
    });
  });

  it("se retape comme il se lit : tiret, minuscules, espaces", async () => {
    const code = (await codeDeRepriseDuJoueur(gameId, lea))!;
    const abime = ` ${code.slice(0, 4).toLowerCase()}-${code.slice(4).toLowerCase()} `;
    const repris = await reprendreSaPlace({ code: abime, ip: "10.0.0.2" });
    expect(repris).toHaveProperty("userId", lea);
  });

  it("refuse une partie rangée, comme elle refuse d'être rejointe", async () => {
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: (await getTeacherOrgId(prof))!,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 0,
      seed: 7,
    });
    const eleve = await nouvelEleve("Nino");
    await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Nino" });
    const code = (await codeDeRepriseDuJoueur(partie.gameId, eleve))!;
    await archiverPartie({ gameId: partie.gameId, teacherId: prof });
    expect(await reprendreSaPlace({ code, ip: "10.0.0.3" })).toEqual({ error: PARTIE_ARCHIVEE });
  });
});

describe("le code ne se devine pas", () => {
  it("un code inconnu est refusé sans dire lesquels existent", async () => {
    const faux = await reprendreSaPlace({ code: "AAAA2222", ip: "10.0.1.1" });
    const malForme = await reprendreSaPlace({ code: "!!", ip: "10.0.1.1" });
    expect(faux).toEqual(malForme);
    expect(faux).toHaveProperty("error");
  });

  it("après trop d'échecs, la même adresse attend", async () => {
    const ip = "10.0.2.2";
    for (let i = 0; i < MAX_ECHECS_REPRISE; i += 1) {
      await reprendreSaPlace({ code: "AAAA2222", ip });
    }
    const bloque = await reprendreSaPlace({ code: "AAAA2222", ip });
    expect((bloque as { error: string }).error).toMatch(/Trop de tentatives/);
    // Même avec le BON code : l'adresse est en pénitence, pas le code.
    const bon = (await codeDeRepriseDuJoueur(gameId, lea))!;
    expect((await reprendreSaPlace({ code: bon, ip })) as { error: string }).toHaveProperty(
      "error",
    );
    // Une autre adresse n'est pas punie pour elle.
    expect(await reprendreSaPlace({ code: bon, ip: "10.0.2.3" })).toHaveProperty("userId", lea);
  });

  it("une reprise réussie remet le compteur de son adresse à zéro", async () => {
    const ip = "10.0.3.3";
    const bon = (await codeDeRepriseDuJoueur(gameId, sam))!;
    for (let i = 0; i < MAX_ECHECS_REPRISE - 1; i += 1) {
      await reprendreSaPlace({ code: "AAAA2222", ip });
    }
    expect(await reprendreSaPlace({ code: bon, ip })).toHaveProperty("userId", sam);
    // Le compteur est reparti de zéro : il reste de la marge derrière.
    for (let i = 0; i < MAX_ECHECS_REPRISE - 1; i += 1) {
      await reprendreSaPlace({ code: "AAAA2222", ip });
    }
    expect(await reprendreSaPlace({ code: bon, ip })).toHaveProperty("userId", sam);
  });
});

describe("en changer, parce que quelqu'un l'a vu", () => {
  it("donne un autre code, et l'ancien cesse de fonctionner", async () => {
    const ancien = (await codeDeRepriseDuJoueur(gameId, lea))!;
    const nouveau = await regenererCodeDeReprise(gameId, lea);
    expect(nouveau).not.toBe(ancien);
    expect(await codeDeRepriseDuJoueur(gameId, lea)).toBe(nouveau);
    expect(await reprendreSaPlace({ code: nouveau, ip: "10.0.4.4" })).toHaveProperty("userId", lea);
    expect(await reprendreSaPlace({ code: ancien, ip: "10.0.4.5" })).toHaveProperty("error");
  });
});

describe("les élèves entrés avant que le code existe", () => {
  it("n'ont pas de clé, et un geste de l'enseignant la leur donne", async () => {
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: (await getTeacherOrgId(prof))!,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 0,
      seed: 7,
    });
    const anciens = [await nouvelEleve("Ava"), await nouvelEleve("Bob")];
    for (const id of anciens) {
      await joinGameByCode({ code: partie.joinCode, userId: id, pseudo: "X" });
      // On efface leur code pour rejouer l'état d'une partie commencée avant
      // la migration : ils sont dans la partie, et n'entreront plus par le
      // code puisqu'ils y sont déjà.
      await base
        .delete(gameRecoveries)
        .where(and(eq(gameRecoveries.gameId, partie.gameId), eq(gameRecoveries.userId, id)));
    }
    expect((await joueursSansCode(partie.gameId, prof)).sort()).toEqual([...anciens].sort());
    expect(await codesDeRepriseDeLaPartie(partie.gameId, prof)).toEqual([]);

    expect(await creerLesCodesManquants(partie.gameId, prof)).toBe(2);
    expect(await joueursSansCode(partie.gameId, prof)).toEqual([]);
    expect(await codesDeRepriseDeLaPartie(partie.gameId, prof)).toHaveLength(2);

    // Rejoué, le geste ne touche pas aux codes déjà notés.
    const avant = await codeDeRepriseDuJoueur(partie.gameId, anciens[0]!);
    expect(await creerLesCodesManquants(partie.gameId, prof)).toBe(0);
    expect(await codeDeRepriseDuJoueur(partie.gameId, anciens[0]!)).toBe(avant);
  });

  it("le geste n'appartient qu'à l'enseignant de la partie", async () => {
    const intrus = await registerTeacher({
      email: "intrus@reprise.test",
      password: "motdepasse!",
      displayName: "M. Intrus",
      schoolName: "Lycée d'à côté",
    });
    if ("error" in intrus) throw new Error(intrus.error);
    expect(await joueursSansCode(gameId, intrus.userId)).toEqual([]);
    expect(await creerLesCodesManquants(gameId, intrus.userId)).toBe(0);
  });
});
