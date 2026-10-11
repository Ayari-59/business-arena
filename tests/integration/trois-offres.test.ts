import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";

/**
 * TROIS OFFRES SCOLAIRES : CLASSE, PROGRAMME, CAMPUS. LA LICENCE PORTE SON PARAMÉTRAGE.
 *
 * Décision du propriétaire (octobre 2026) : Classe, 290 € par an, une entreprise et un
 * niveau choisis à l'achat, un enseignant, autant de parties que voulu dans l'année avec
 * ce paramétrage (une à la fois) ; Programme, 990 €, une entreprise, tous les niveaux,
 * toutes les promotions, l'équipe du programme (plafond fixé au devis) ; Campus, 1 990 €,
 * tout, sans limite. Ce test pose la règle là où elle tient quel que soit l'écran
 * (services/acces.service.ts, `verifierLaLicence`) :
 *  · chaque offre accepte ce qu'elle couvre et refuse le reste (entreprise, niveau,
 *    deuxième partie en cours pour Classe, enseignant au-delà du plafond), avec une
 *    phrase qui dit ce qui bloque et l'offre qui l'ouvre ;
 *  · une licence expirée vaut une absence de licence ;
 *  · une partie en cours n'est jamais cassée ;
 *  · les licences d'avant (ancienne « Classe » à 490 €, ancienne « Campus ») passent par
 *    la migration 0038 sans rien perdre ;
 *  · la demande de devis garde l'entreprise et le niveau souhaités.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.9" }),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn(async () => ({ envoye: true })) }));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis, games, orgLicences, organizationMembers, users } from "@/db/schema";
import {
  archiverPartie,
  closeCurrentRound,
  createClassGame,
  desarchiverPartie,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { createCompetition } from "@/services/competition.service";
import {
  ClasseReserveError,
  etatDeLOffre,
  LicenceDepasseeError,
  OffreRequiseError,
} from "@/services/acces.service";
import { setOrgLicence } from "@/services/licence.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  ENTREPRISES,
  horsLicence,
  nomDeLEntreprise,
  parametrageDeLOffre,
  parametrageEnClair,
  PARAMETRAGE_DES_OFFRES,
  type OffreDeLArene,
} from "@/config/tarifs";
import { envoyerDemandeDeDevisAction } from "@/app/devis/actions";
import { envoyerCourriel } from "@/lib/courriel";
import { instructionsDe, tagsSurDisque } from "../helpers/migrations";
import type { RoundDecisions } from "@/engine/types";

const JOUR = 24 * 60 * 60 * 1000;
const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

type Etab = { userId: string; orgId: string };
let n = 0;

async function etablissement(): Promise<Etab> {
  n += 1;
  const r = await registerTeacher({
    email: `trois-${n}-${randomUUID()}@ecole.test`,
    password: "motdepasse!",
    displayName: `Prof ${n}`,
    schoolName: `École des trois offres ${n}`,
  });
  if ("error" in r) throw new Error(r.error);
  return { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
}

/** Pose une licence de l'offre, avec le paramétrage que l'admin choisit dans /admin. */
async function licence(
  e: Etab,
  offre: OffreDeLArene,
  choix: { entreprise?: string; niveau?: number; maxEnseignants?: number } = {},
  debut = -10,
  fin = 300,
) {
  const p = parametrageDeLOffre(offre, choix);
  await setOrgLicence({
    adminId: e.userId,
    organizationId: e.orgId,
    label: `Licence ${offre}`,
    startsAt: new Date(Date.now() + debut * JOUR),
    endsAt: new Date(Date.now() + fin * JOUR),
    maxTeachers: p.maxEnseignants,
    arene: offre,
    entreprises: p.entreprises,
    niveaux: p.niveaux,
    maxPartiesEnCours: p.maxPartiesEnCours,
  });
}

const partie = (e: Etab, scenarioCode: string, level: number) =>
  createClassGame({
    teacherId: e.userId,
    organizationId: e.orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    level,
    scenarioCode,
  });

const concours = (e: Etab) =>
  createCompetition({
    organizerId: e.userId,
    organizationId: e.orgId,
    name: "Coupe",
    periodicity: "quarter",
    groupSize: 3,
    advancePerGroup: 1,
  });

/** Un enseignant de plus dans l'établissement. */
async function unEnseignantDePlus(e: Etab): Promise<void> {
  const [u] = await db
    .insert(users)
    .values({ email: `collegue-${randomUUID()}@ecole.test`, displayName: "Collègue" })
    .returning({ id: users.id });
  await db.insert(organizationMembers).values({ userId: u!.id, organizationId: e.orgId, role: "teacher" });
}

/** Attend un refus de licence, et renvoie l'erreur pour la lire. */
async function refus(p: Promise<unknown>): Promise<LicenceDepasseeError> {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, "la création aurait dû être refusée").toBeInstanceOf(LicenceDepasseeError);
  expect(err).toBeInstanceOf(OffreRequiseError);
  return err as LicenceDepasseeError;
}

describe("le paramétrage de chaque offre", () => {
  it("Classe : une entreprise, un niveau, un enseignant, un groupe à la fois ; Programme : une entreprise ; Campus : tout", () => {
    expect(PARAMETRAGE_DES_OFFRES).toEqual({
      classe: { entreprises: "une", niveaux: "un", enseignants: 1, partiesEnCours: 1 },
      programme: { entreprises: "une", niveaux: "tous", enseignants: "devis", partiesEnCours: null },
      campus: { entreprises: "toutes", niveaux: "tous", enseignants: null, partiesEnCours: null },
    });
    expect(parametrageDeLOffre("classe", { entreprise: "nova", niveau: 3 })).toEqual({
      offre: "classe",
      entreprises: ["nova"],
      niveaux: [3],
      maxEnseignants: 1,
      maxPartiesEnCours: 1,
    });
    expect(parametrageDeLOffre("programme", { entreprise: "hotel", maxEnseignants: 5 })).toMatchObject({
      entreprises: ["hotel"],
      niveaux: null,
      maxEnseignants: 5,
      maxPartiesEnCours: null,
    });
    expect(parametrageDeLOffre("campus", { entreprise: "hotel", niveau: 2 })).toMatchObject({
      entreprises: null,
      niveaux: null,
      maxEnseignants: null,
    });
    expect(() => parametrageDeLOffre("classe", { entreprise: "nova" })).toThrow(/niveau/);
    expect(() => parametrageDeLOffre("classe", { niveau: 3 })).toThrow(/entreprise/);
    expect(() => parametrageDeLOffre("programme", { entreprise: "nova" })).toThrow(/devis/);
    expect(() => parametrageDeLOffre("classe", { entreprise: "inconnue", niveau: 3 })).toThrow(/entreprise/);
    expect(ENTREPRISES).toHaveLength(9);
  });

  it("le serveur refuse une licence Classe sans son entreprise ou son niveau", async () => {
    const e = await etablissement();
    await expect(
      setOrgLicence({
        adminId: e.userId,
        organizationId: e.orgId,
        label: "Classe incomplète",
        startsAt: new Date(Date.now() - JOUR),
        endsAt: new Date(Date.now() + 300 * JOUR),
        maxTeachers: 1,
        arene: "classe",
        entreprises: ["nova"],
      }),
    ).rejects.toThrow(/une entreprise et un niveau/);
  });

  it("le paramétrage en clair, celui de la ligne d'état", () => {
    expect(parametrageEnClair(parametrageDeLOffre("classe", { entreprise: "nova", niveau: 3 }))).toBe(
      "NOVA · niveau 3 Pilotage",
    );
    expect(parametrageEnClair(parametrageDeLOffre("programme", { entreprise: "hotel", maxEnseignants: 5 }))).toBe(
      "L'ESCALE · tous niveaux",
    );
    expect(parametrageEnClair(parametrageDeLOffre("campus", {}))).toBe("");
  });
});

describe("offre Classe : un jeu paramétré pour un groupe", () => {
  it("accepte son entreprise à son niveau ; refuse une autre entreprise (Campus) et un autre niveau (Programme)", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "hotel", niveau: 3 });

    const autreEntreprise = await refus(partie(e, "nova", 3));
    expect(autreEntreprise.quoi).toBe("entreprise");
    expect(autreEntreprise.offre).toBe("campus");
    expect(autreEntreprise.message).toContain("Votre offre Classe couvre L'ESCALE");
    expect(autreEntreprise.message).toContain("NOVA n'en fait pas partie");
    expect(autreEntreprise.message).toContain("l'offre Campus ouvre les 9 entreprises");

    const autreNiveau = await refus(partie(e, "hotel", 5));
    expect(autreNiveau.quoi).toBe("niveau");
    expect(autreNiveau.offre).toBe("programme");
    expect(autreNiveau.message).toContain("le niveau 3 Pilotage");
    expect(autreNiveau.message).toContain("Le niveau 5 Stratégie n'en fait pas partie");
    expect(autreNiveau.message).toContain("l'offre Programme ouvre les niveaux 1 à 6");

    // Ni l'une ni l'autre n'a rien créé.
    expect(await db.select().from(games).where(eq(games.organizationId, e.orgId))).toHaveLength(0);
    expect((await partie(e, "hotel", 3)).joinCode).toBeTruthy();
  });

  it("le niveau choisi peut aller jusqu'au 6, et la variante en gamme reste la même entreprise", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "nova", niveau: 6 });
    // NOVA se joue en gamme à partir du niveau 4 (`nova-gamme`) : c'est toujours NOVA.
    const { gameId } = await partie(e, "nova", 6);
    expect(gameId).toBeTruthy();
  });

  it("un groupe à la fois : la deuxième partie en cours est refusée, puis acceptée quand la première est terminée ou rangée", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "nova", niveau: 3 });
    const premiere = await partie(e, "nova", 3);

    const deuxieme = await refus(partie(e, "nova", 3));
    expect(deuxieme.quoi).toBe("parties");
    expect(deuxieme.offre).toBe("programme");
    expect(deuxieme.message).toContain("un groupe à la fois");
    expect(deuxieme.message).toContain("Terminez ou rangez");
    // Le concours compte comme le groupe en cours.
    expect((await refus(concours(e))).quoi).toBe("parties");

    // Terminée : la place se libère, autant de parties que voulu dans l'année.
    await db.update(games).set({ status: "finished" }).where(eq(games.id, premiere.gameId));
    const troisieme = await partie(e, "nova", 3);
    // Rangée : la place se libère aussi ; la ressortir reprendrait une place déjà prise.
    await archiverPartie({ gameId: troisieme.gameId, teacherId: e.userId });
    const quatrieme = await partie(e, "nova", 3);
    expect(quatrieme.joinCode).toBeTruthy();
    const reprise = await refus(desarchiverPartie({ gameId: troisieme.gameId, teacherId: e.userId }));
    expect(reprise.quoi).toBe("parties");
    // Une partie terminée, elle, se ressort toujours.
    await archiverPartie({ gameId: premiere.gameId, teacherId: e.userId });
    await expect(desarchiverPartie({ gameId: premiere.gameId, teacherId: e.userId })).resolves.toBeUndefined();
  });

  it("un enseignant : le second dans l'établissement bloque la création, l'offre Programme l'ouvre", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "nova", niveau: 3 });
    await unEnseignantDePlus(e);
    const r = await refus(partie(e, "nova", 3));
    expect(r.quoi).toBe("enseignants");
    expect(r.offre).toBe("programme");
    expect(r.message).toContain("couvre 1 enseignant, et l'établissement en compte 2");
    expect(r.message).toContain("équipe pédagogique et aux intervenants du programme");
  });

  it("un concours se joue avec NOVA : refusé sous une Classe d'une autre entreprise, accepté sous une Classe NOVA", async () => {
    const autre = await etablissement();
    await licence(autre, "classe", { entreprise: "bistrot", niveau: 2 });
    const r = await refus(concours(autre));
    expect(r.quoi).toBe("entreprise");
    expect(r.message).toContain(`${nomDeLEntreprise("nova")} n'en fait pas partie`);

    const nova = await etablissement();
    await licence(nova, "classe", { entreprise: "nova", niveau: 5 });
    expect((await concours(nova)).competitionId).toBeTruthy();
  });

  it("la ligne d'état dit l'offre, l'entreprise, le niveau et le groupe en cours", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "nova", niveau: 3 });
    await partie(e, "nova", 3);
    const etat = await etatDeLOffre(e.userId);
    expect(etat.arene).toMatchObject({ offre: "classe", state: "active" });
    expect(parametrageEnClair(etat.arene!.parametrage)).toBe("NOVA · niveau 3 Pilotage");
    expect(etat.partiesEnCours?.nombre).toBe(1);
  });
});

describe("offre Programme : une entreprise, tous les niveaux, toutes les promotions", () => {
  it("plusieurs parties en même temps, aux niveaux 1 à 6, dans son entreprise ; une autre entreprise demande Campus", async () => {
    const e = await etablissement();
    await licence(e, "programme", { entreprise: "hotel", maxEnseignants: 3 });
    for (const niveau of [1, 2, 3, 4, 5, 6]) {
      expect((await partie(e, "hotel", niveau)).joinCode, `niveau ${niveau}`).toBeTruthy();
    }
    const r = await refus(partie(e, "conseil", 3));
    expect(r.quoi).toBe("entreprise");
    expect(r.offre).toBe("campus");
    // Les concours se jouent avec NOVA, que ce Programme n'ouvre pas.
    expect((await refus(concours(e))).quoi).toBe("entreprise");
  });

  it("l'équipe du programme : au-delà du plafond fixé au devis, la création est refusée (Campus)", async () => {
    const e = await etablissement();
    await licence(e, "programme", { entreprise: "nova", maxEnseignants: 2 });
    await unEnseignantDePlus(e);
    expect((await partie(e, "nova", 4)).joinCode).toBeTruthy();
    expect((await concours(e)).competitionId).toBeTruthy();
    await unEnseignantDePlus(e);
    const r = await refus(partie(e, "nova", 4));
    expect(r.quoi).toBe("enseignants");
    expect(r.offre).toBe("campus");
    expect(r.message).toContain("couvre 2 enseignants et intervenants, et l'établissement en compte 3");
  });
});

describe("offre Campus : tout, sans limite", () => {
  it("les 9 entreprises aux niveaux 1 et 6, plusieurs parties, des concours, des enseignants sans plafond", async () => {
    const e = await etablissement();
    await licence(e, "campus");
    await unEnseignantDePlus(e);
    await unEnseignantDePlus(e);
    for (const { code } of ENTREPRISES) {
      expect((await partie(e, code, 1)).joinCode, code).toBeTruthy();
      expect((await partie(e, code, 6)).joinCode, code).toBeTruthy();
    }
    expect((await concours(e)).competitionId).toBeTruthy();
    expect((await concours(e)).competitionId).toBeTruthy();
  });
});

describe("expiration et parties en cours", () => {
  it("une licence expirée vaut une absence de licence, quelle que soit l'offre", async () => {
    for (const offre of ["classe", "programme", "campus"] as const) {
      const e = await etablissement();
      await licence(e, offre, { entreprise: "nova", niveau: 3, maxEnseignants: 5 }, -400, -2);
      await expect(partie(e, "nova", 3), offre).rejects.toBeInstanceOf(ClasseReserveError);
      await expect(concours(e), offre).rejects.toBeInstanceOf(ClasseReserveError);
    }
  });

  it("une partie en cours n'est jamais cassée : ni par la fin de la licence, ni par un changement d'entreprise", async () => {
    const e = await etablissement();
    await licence(e, "classe", { entreprise: "nova", niveau: 3 });
    const p = await partie(e, "nova", 3);
    const eleve = (
      await db
        .insert(users)
        .values({ email: `etudiant-${randomUUID()}@guest.test`, displayName: "Étudiant" })
        .returning({ id: users.id })
    )[0]!.id;
    const j = await joinGameByCode({ code: p.joinCode, userId: eleve, pseudo: "Étudiant" });
    if ("error" in j) throw new Error(j.error);

    // L'admin pose, pour l'an prochain, une Classe d'une autre entreprise et retire l'ancienne.
    await db.delete(orgLicences).where(eq(orgLicences.organizationId, e.orgId));
    await licence(e, "classe", { entreprise: "hotel", niveau: 2 });
    await submitTeamDecisions({ gameId: p.gameId, userId: eleve, payload: DECISIONS });
    expect((await closeCurrentRound({ gameId: p.gameId, teacherId: e.userId })).roundIndex).toBe(1);

    // Puis la licence prend fin : la partie continue encore.
    await db
      .update(orgLicences)
      .set({ startsAt: new Date(Date.now() - 400 * JOUR), endsAt: new Date(Date.now() - JOUR) })
      .where(eq(orgLicences.organizationId, e.orgId));
    await submitTeamDecisions({ gameId: p.gameId, userId: eleve, payload: DECISIONS });
    expect((await closeCurrentRound({ gameId: p.gameId, teacherId: e.userId })).roundIndex).toBe(2);
  });
});

describe("la règle, en fonction pure", () => {
  it("chaque refus nomme ce qui bloque et l'offre au-dessus", () => {
    const classe = parametrageDeLOffre("classe", { entreprise: "nova", niveau: 3 });
    expect(horsLicence(classe, { entreprise: "nova", niveau: 3, enseignants: 1, partiesEnCours: { nombre: 0, laquelle: null } })).toBeNull();
    expect(horsLicence(classe, { entreprise: null })?.message).toContain("Ce scénario n'en fait pas partie");
    expect(horsLicence(classe, { partiesEnCours: { nombre: 1, laquelle: "2nde B" } })?.message).toContain(
      "« 2nde B » est en cours",
    );
    const campus = parametrageDeLOffre("campus", {});
    expect(horsLicence(campus, { entreprise: "transport", niveau: 6, enseignants: 400, partiesEnCours: { nombre: 40, laquelle: null } })).toBeNull();
  });
});

describe("les licences d'avant les trois offres (migration 0038)", () => {
  it("une ancienne Classe devient Programme sans restriction ; une ancienne Campus reste Campus ; rejouable", async () => {
    const client = new PGlite();
    try {
      const tous = tagsSurDisque();
      const i = tous.indexOf("0038_trois_offres");
      expect(i).toBeGreaterThan(0);
      for (const tag of tous.slice(0, i)) for (const sql of instructionsDe(tag)) await client.exec(sql);

      // Deux licences posées avant : la Classe à 490 € (un enseignant) et la Campus.
      await client.exec(`
        insert into organizations (id, name, slug) values
          ('00000000-0000-0000-0000-0000000000a1', 'Lycée A', 'lycee-a'),
          ('00000000-0000-0000-0000-0000000000b1', 'Lycée B', 'lycee-b');
        insert into org_licences (organization_id, label, starts_at, ends_at, max_teachers, arene, episodes) values
          ('00000000-0000-0000-0000-0000000000a1', 'Classe 2026', now(), now() + interval '300 days', 1, 'classe', false),
          ('00000000-0000-0000-0000-0000000000b1', 'Campus 2026', now(), now() + interval '300 days', null, 'campus', true);
      `);
      for (const sql of instructionsDe("0038_trois_offres")) await client.exec(sql);

      const lire = async () =>
        (
          await client.query<{
            label: string;
            arene: string;
            entreprises: string[] | null;
            niveaux: number[] | null;
            max_teachers: number | null;
            max_parties_en_cours: number | null;
            episodes: boolean;
          }>(
            "select label, arene, entreprises, niveaux, max_teachers, max_parties_en_cours, episodes from org_licences order by label",
          )
        ).rows;
      const attendu = [
        {
          label: "Campus 2026",
          arene: "campus",
          entreprises: null,
          niveaux: null,
          max_teachers: null,
          max_parties_en_cours: null,
          episodes: true,
        },
        {
          label: "Classe 2026",
          arene: "programme",
          entreprises: null,
          niveaux: null,
          max_teachers: 1,
          max_parties_en_cours: null,
          episodes: false,
        },
      ];
      expect(await lire()).toEqual(attendu);

      // Une vraie Classe d'après la migration garde son nom, même si l'on rejoue 0036 et 0038.
      await client.exec(`
        insert into org_licences (organization_id, label, starts_at, ends_at, max_teachers, arene, episodes,
          entreprises, niveaux, max_parties_en_cours) values
          ('00000000-0000-0000-0000-0000000000a1', 'Classe 2027', now(), now() + interval '300 days', 1, 'classe', false,
           '{nova}', '{3}', 1);
      `);
      for (const tag of ["0036_offres_et_devis", "0038_trois_offres"]) {
        for (const sql of instructionsDe(tag)) await client.exec(sql);
      }
      const apres = await lire();
      expect(apres.find((l) => l.label === "Classe 2027")).toMatchObject({
        arene: "classe",
        entreprises: ["nova"],
        niveaux: [3],
        max_parties_en_cours: 1,
      });
      expect(apres.filter((l) => l.label !== "Classe 2027")).toEqual(attendu);
      // La contrainte refuse une offre inconnue.
      await expect(
        client.exec(
          "insert into org_licences (organization_id, label, starts_at, ends_at, arene) values ('00000000-0000-0000-0000-0000000000a1', 'X', now(), now(), 'section')",
        ),
      ).rejects.toThrow(/perimetre/);
    } finally {
      await client.close();
    }
  }, 120_000);
});

describe("la demande de devis garde le paramétrage souhaité", () => {
  const ETAT = { error: null, ok: null, values: null };
  const formulaire = (champs: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(champs)) f.set(k, v);
    return f;
  };
  const base = {
    nom: "Claire Martin",
    fonction: "Directrice de programme",
    organisation: "École de commerce de Lille",
    site: "",
  };

  it("Classe : l'entreprise et le niveau, requis, et dans la notification", async () => {
    vi.mocked(envoyerCourriel).mockClear();
    const sansNiveau = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", entreprise: "nova", email: "a@ecole.test" }),
    );
    expect(sansNiveau.error).toMatch(/niveau/);
    const r = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "classe", entreprise: "hotel", niveau: "4", effectif: "12", email: "b@ecole.test" }),
    );
    expect(r.ok).toMatchObject({ offre: "classe" });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, "b@ecole.test"));
    // Classe ne demande pas d'effectif : il n'est pas gardé.
    expect(d).toMatchObject({ offre: "classe", entreprise: "hotel", niveau: 4, effectif: null });
    const notification = vi.mocked(envoyerCourriel).mock.calls.map(([c]) => c).find((c) => c.texte.includes("b@ecole.test"))!;
    expect(notification.texte).toContain("Entreprise souhaitée : L'ESCALE");
    expect(notification.texte).toContain("Niveau souhaité : niveau 4 Arbitrage");
  });

  it("Programme : l'entreprise et l'effectif ; Campus : ni entreprise ni niveau", async () => {
    const p = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "programme", entreprise: "conseil", niveau: "2", effectif: "6", email: "c@ecole.test" }),
    );
    expect(p.ok).toMatchObject({ offre: "programme" });
    const [dp] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, "c@ecole.test"));
    expect(dp).toMatchObject({ offre: "programme", entreprise: "conseil", niveau: null, effectif: 6 });

    const c = await envoyerDemandeDeDevisAction(
      ETAT,
      formulaire({ ...base, offre: "campus", entreprise: "nova", niveau: "3", effectif: "40", email: "d@ecole.test" }),
    );
    expect(c.ok).toMatchObject({ offre: "campus" });
    const [dc] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.email, "d@ecole.test"));
    expect(dc).toMatchObject({ offre: "campus", entreprise: null, niveau: null, effectif: 40 });
  });
});
