import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * L'EXAMEN INDIVIDUEL, DE BOUT EN BOUT, PAR LE VRAI PIPELINE.
 *
 * La création sous licence (avec et sans le module), deux candidats qui passent l'examen
 * jusqu'à la remise, une seule tentative, la reprise après coupure sans rejouer un tour,
 * l'horloge qui clôt un tour échu, la note calculée par le rejeu de « mérite ou chance »,
 * LA NEUTRALISATION DU HASARD (deux candidats aux mêmes décisions sur deux graines du lot
 * ont la même note de décision), la publication, l'export sans donnée d'un autre
 * établissement.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, examenCandidats, examens, games, rounds, teams, users } from "@/db/schema";
import {
  apresLeTour,
  appliquerLHorloge,
  cloreLExamen,
  commencerLExamen,
  comparaisonNationale,
  copieRetenueDuCandidat,
  copieVueParLeCandidat,
  creerExamen,
  decisionsDuCandidat,
  examensDeLEnseignant,
  exportDeLExamen,
  grilleDeLExamen,
  noterLaCopieDuCandidat,
  publierLesResultats,
  suiviDeLExamen,
  type NotationGardee,
  type SaisieDExamen,
} from "@/services/examen.service";
import { resolveCurrentRound, submitTeamDecisions } from "@/services/game.service";
import { attribuerCodeDeReprise, reprendreSaPlace } from "@/services/reprise.service";
import { ExamenReserveError, LicenceDepasseeError } from "@/services/acces.service";
import { neutralDecisions } from "@/engine/bots";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { GRILLE_BUSINESS_ARENA_2026, REFERENCE_GESTION_NEUTRE_GELEE, noteDeDecision, noterLaCopie } from "@/config/examen/grille";
import { estRelative } from "@/config/examen/competences";
import { rejeuPourLExamen } from "@/services/merite.service";
import type { CompanyState, RoundDecisions } from "@/engine/types";
import { etablissementSousLicence } from "./helpers/licence";
import { cibleDeLEnseignant, lireCible, pilotageDe } from "@/lti/liens";
import { entrerDansLaCible } from "@/lti/aiguillage";

const SAISIE: SaisieDExamen = {
  nom: "Gestion L2 · partiel",
  scenarioCode: "nova",
  niveau: 2,
  tours: 3,
  dureeTourMinutes: null,
  ouverture: null,
  fermeture: null,
  questions: false,
  resultatEstime: false,
  tentatives: 1,
  modeGraine: "lot",
  grilleCode: "business-arena-2026",
};

async function invite(nom: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `guest-${nom}-${Date.now()}-${Math.random()}@guest.business-arena.local`, displayName: "Invité" })
    .returning({ id: users.id });
  return u!.id;
}

/**
 * DES DÉCISIONS QUI NE DÉPENDENT QUE DU TOUR : calculées une fois sur l'état d'ouverture
 * (le même sous toutes les graines), puis déplacées tour par tour. Deux candidats qui les
 * jouent ont exactement les mêmes décisions, quel que soit leur marché.
 */
let decisionsFixes: ((tour: number) => RoundDecisions) | null = null;
async function decisionsDuTour(gameId: string, tour: number): Promise<RoundDecisions> {
  if (!decisionsFixes) {
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    const scenario = parseScenarioConfig(game!.scenarioSnapshot);
    const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
    const [etat] = await db
      .select()
      .from(companyStates)
      .where(and(eq(companyStates.teamId, equipe!.id), eq(companyStates.roundIndex, 0)));
    const base = neutralDecisions({ scenario, state: etat!.state as CompanyState, roundIndex: 1 });
    decisionsFixes = (t: number) => {
      const k = [1.1, 0.95, 1.05, 1.15, 0.9, 1.0][t - 1] ?? 1;
      return {
        ...base,
        price: Math.round(base.price * k * 10) / 10,
        productionPlan: Math.round(base.productionPlan * (2 - k)),
        marketingBudget: Math.round(base.marketingBudget * k),
        finance: { newLoan: 0, loanRepayment: 0 },
      };
    };
  }
  return decisionsFixes(tour);
}

async function passerLExamen(gameId: string, userId: string, tours: number): Promise<void> {
  for (let t = 1; t <= tours; t += 1) {
    await resolveCurrentRound({ gameId, userId, playerDecisions: await decisionsDuTour(gameId, t) });
    await apresLeTour(gameId);
  }
}

let prof: { userId: string; orgId: string };
let examenId: string;
let code: string;

beforeAll(async () => {
  prof = await etablissementSousLicence("Examen");
}, 60_000);

describe("la création d'un examen, sous licence", () => {
  it("une licence Campus inclut l'examen : il se crée, avec un code et une grille figée", async () => {
    const r = await creerExamen(prof.userId, SAISIE);
    examenId = r.id;
    code = r.code;
    expect(code).toMatch(/^EX-[A-Z2-9]{6}$/);
    const [e] = await db.select().from(examens).where(eq(examens.id, examenId));
    expect(e!.organizationId).toBe(prof.orgId);
    expect(e!.graines.length).toBeGreaterThan(1);
    expect(new Set(e!.graines).size).toBe(e!.graines.length);
    expect((e!.grille as { code: string }).code).toBe("business-arena-2026");
    expect((e!.equite as { rang: number | null }).rang).not.toBeNull();
    const liste = await examensDeLEnseignant(prof.userId);
    expect(liste.map((x) => x.id)).toContain(examenId);
  }, 120_000);

  it("une licence Classe ne l'inclut pas : refus, avec le message des offres", async () => {
    const classe = await etablissementSousLicence("Classe", { arene: "classe", entreprises: ["nova"], niveaux: [2] });
    await expect(creerExamen(classe.userId, { ...SAISIE, modeGraine: "commune" })).rejects.toBeInstanceOf(ExamenReserveError);
    await expect(creerExamen(classe.userId, { ...SAISIE, modeGraine: "commune" })).rejects.toThrow(/examen individuel est inclus/);
  });

  it("un Programme ne l'inclut plus (décision d'octobre 2026) : refus", async () => {
    const programme = await etablissementSousLicence("Programme sans examen", { arene: "programme", entreprises: ["nova"] });
    await expect(creerExamen(programme.userId, { ...SAISIE, modeGraine: "commune" })).rejects.toBeInstanceOf(ExamenReserveError);
  });

  it("un Programme vendu avec l'examen le garde, dans son entreprise seulement", async () => {
    const programme = await etablissementSousLicence("Programme", { arene: "programme", entreprises: ["nova"], examen: true });
    const ok = await creerExamen(programme.userId, { ...SAISIE, modeGraine: "commune" });
    expect(ok.code).toMatch(/^EX-/);
    await expect(
      creerExamen(programme.userId, { ...SAISIE, scenarioCode: "hotel", modeGraine: "commune" }),
    ).rejects.toBeInstanceOf(LicenceDepasseeError);
  });

  it("sans aucune licence : refus", async () => {
    const sans = await etablissementSousLicence("Sans", { arene: null, episodes: true });
    await expect(creerExamen(sans.userId, { ...SAISIE, modeGraine: "commune" })).rejects.toBeInstanceOf(ExamenReserveError);
  });
});

describe("deux candidats passent l'examen", () => {
  let a: string;
  let b: string;
  let partieA: string;
  let partieB: string;

  it("ils commencent : une partie solo chacun, dans l'établissement, sur deux graines du lot", async () => {
    a = await invite("a");
    b = await invite("b");
    const ra = await commencerLExamen({ code, userId: a, identification: "saisie", nom: "Alice Martin", numeroEtudiant: "21 0001" });
    const rb = await commencerLExamen({ code, userId: b, identification: "saisie", nom: "Bruno Petit", numeroEtudiant: "210002" });
    expect("gameId" in ra && "gameId" in rb).toBe(true);
    partieA = (ra as { gameId: string }).gameId;
    partieB = (rb as { gameId: string }).gameId;
    const [ga] = await db.select().from(games).where(eq(games.id, partieA));
    const [gb] = await db.select().from(games).where(eq(games.id, partieB));
    expect(ga!.organizationId).toBe(prof.orgId);
    expect((ga!.difficultyProfile as { kind: string }).kind).toBe("solo");
    expect(ga!.seed).not.toBe(gb!.seed);
    // L'ordre des équipes est fixé : le candidat d'abord (même graine, même marché).
    const equipes = await db.select().from(teams).where(eq(teams.gameId, partieA));
    const tries = [...equipes].sort((x, y) => x.id.localeCompare(y.id));
    expect(tries[0]!.controller).toBe("human");
    // Le numéro est normalisé, le nom porté par l'appareil.
    const [ca] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, partieA));
    expect(ca!.numeroEtudiant).toBe("210001");
  }, 60_000);

  it("un numéro déjà engagé ne fait pas entrer une autre identité ; la même identité reprend sa copie", async () => {
    const intrus = await invite("intrus");
    const r = await commencerLExamen({ code, userId: intrus, identification: "saisie", nom: "Alice", numeroEtudiant: "210001" });
    expect(r).toEqual({ refus: "numero-pris" });
    const encore = await commencerLExamen({ code, userId: a, identification: "saisie", nom: "Alice Martin", numeroEtudiant: "210001" });
    expect(encore).toEqual({ gameId: partieA, reprise: true });
    const sansNumero = await commencerLExamen({ code, userId: intrus, identification: "saisie", nom: "X", numeroEtudiant: null });
    expect(sansNumero).toEqual({ refus: "saisie" });
  });

  it("reprise après coupure par le code de reprise, sans pouvoir rejouer un tour", async () => {
    await resolveCurrentRound({ gameId: partieA, userId: a, playerDecisions: await decisionsDuTour(partieA, 1) });
    await apresLeTour(partieA);
    const codeDeReprise = await attribuerCodeDeReprise(partieA, a);
    const retrouvee = await reprendreSaPlace({ code: codeDeReprise, ip: "10.0.0.9" });
    expect(retrouvee).toMatchObject({ gameId: partieA, userId: a });
    // Le tour 1 est clos : rien ne le rouvre, la partie est au tour 2.
    const [g] = await db.select().from(games).where(eq(games.id, partieA));
    expect(g!.currentRound).toBe(2);
    const [t1] = await db.select().from(rounds).where(and(eq(rounds.gameId, partieA), eq(rounds.index, 1)));
    expect(t1!.status).toBe("resolved");
    // Et l'entrée par le code d'examen rend la même partie, pas une nouvelle.
    const encore = await commencerLExamen({ code, userId: a, identification: "saisie", nom: "Alice Martin", numeroEtudiant: "210001" });
    expect(encore).toEqual({ gameId: partieA, reprise: true });
    for (let t = 2; t <= SAISIE.tours; t += 1) {
      await resolveCurrentRound({ gameId: partieA, userId: a, playerDecisions: await decisionsDuTour(partieA, t) });
      await apresLeTour(partieA);
    }
    await passerLExamen(partieB, b, SAISIE.tours);
  }, 120_000);

  it("les copies sont remises ; pas de résultat avant la publication", async () => {
    const vue = await copieVueParLeCandidat(partieA, a);
    expect(vue?.candidat.remisLe).toBeInstanceOf(Date);
    expect(vue?.publie).toBe(false);
    expect(vue?.notation).toBeNull();
    // Un autre ne voit pas la copie d'Alice.
    expect(await copieVueParLeCandidat(partieA, b)).toBeNull();
  });

  it("une seule tentative : une copie remise ne se recommence pas", async () => {
    const r = await commencerLExamen({ code, userId: a, identification: "saisie", nom: "Alice Martin", numeroEtudiant: "210001" });
    expect(r).toEqual({ refus: "deja-remis" });
  });

  it("LA NEUTRALISATION DU HASARD : mêmes décisions, deux graines du lot, même note de décision", async () => {
    const [ca] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, partieA));
    const [cb] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, partieB));
    expect(ca!.graine).not.toBe(cb!.graine);
    const na = (await noterLaCopieDuCandidat(ca!.id)) as NotationGardee;
    const nb = (await noterLaCopieDuCandidat(cb!.id)) as NotationGardee;
    expect(na.etat, JSON.stringify(na)).toBe("notee");
    expect(nb.etat, JSON.stringify(nb)).toBe("notee");
    if (na.etat !== "notee" || nb.etat !== "notee") return;
    expect(Math.abs(noteDeDecision(na) - noteDeDecision(nb))).toBeLessThan(0.01);
    // Toute la note, d'ailleurs : elle se mesure sur les mêmes trente marchés.
    expect(Math.abs(na.note - nb.note)).toBeLessThan(0.1);
    expect(na.note).toBeGreaterThanOrEqual(0);
    expect(na.note).toBeLessThanOrEqual(100);
    expect(na.lignes.reduce((s, l) => s + l.points, 0)).toBeCloseTo(na.note, 0);
    expect(na.horsCalcul.map((l) => l.code)).toEqual(["diagnostics"]);
  }, 120_000);

  it("LA COPIE EST NOTÉE CONTRE LA GESTION NEUTRE DU SECTEUR, l'étalon que sa grille figée nomme, et la notation le garde", async () => {
    const [examen] = await db.select().from(examens).where(eq(examens.id, examenId));
    // La copie figée de la grille écrit son étalon.
    expect((examen!.grille as { reference?: unknown }).reference).toEqual(REFERENCE_GESTION_NEUTRE_GELEE);
    const [ca] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, partieA));
    const gardee = ca!.notation as NotationGardee;
    expect(gardee.etat).toBe("notee");
    if (gardee.etat !== "notee") return;
    expect(gardee.grille.reference).toEqual(REFERENCE_GESTION_NEUTRE_GELEE);
    // La note gardée est celle du rejeu contre la gestion neutre, au centième de point.
    const neutre = await rejeuPourLExamen(partieA, "gestion-neutre-gelee");
    expect(neutre.etat).toBe("rejeu");
    if (neutre.etat !== "rejeu") return;
    const attendue = noterLaCopie(
      grilleDeLExamen(examen!),
      { sur: neutre.sur, joueur: neutre.joueur, reference: neutre.reference, situations: null },
      { questions: examen!.questions },
    );
    expect(gardee.note).toBe(attendue.note);
    expect(gardee.lignes).toEqual(attendue.lignes);
    // Les seuils voyagent dans la copie de la grille et dans la notation ; les niveaux
    // gardés sont ceux de ces seuils, la stratégie comptée à partir de la gestion neutre.
    expect((examen!.grille as { seuils?: unknown }).seuils).toEqual(GRILLE_BUSINESS_ARENA_2026.seuils);
    expect(gardee.grille.seuils).toEqual(GRILLE_BUSINESS_ARENA_2026.seuils);
    expect(gardee.competences).toEqual(attendue.competences);
    const strategie = gardee.competences.find((c) => c.code === "strategie")!;
    expect(strategie.partDeLaReference).toBeGreaterThanOrEqual(0);
    expect(strategie.seuils!.acquis).toBeCloseTo(Math.min(1, strategie.partDeLaReference! + 0.1), 9);
    // Pas celle du bon gestionnaire, l'étalon du bilan : sur cette partie, il fait autre chose.
    const bon = await rejeuPourLExamen(partieA, "bon-gestionnaire");
    if (bon.etat !== "rejeu") throw new Error(bon.message);
    expect(bon.joueur).toEqual(neutre.joueur);
    expect(bon.reference.map((m) => m.resultat)).not.toEqual(neutre.reference.map((m) => m.resultat));
  }, 120_000);

  it("l'enseignant suit : notes, rangs, compétences ; les décisions de chaque candidat se consultent", async () => {
    const suivi = (await suiviDeLExamen(prof.userId, examenId))!;
    expect(suivi.copies).toHaveLength(2);
    expect(suivi.notees).toHaveLength(2);
    expect(suivi.histogramme.reduce((s, h) => s + h.n, 0)).toBe(2);
    expect(suivi.competences.map((c) => c.code)).not.toContain("diagnostic");
    expect(suivi.competences.length).toBe(6);
    // Le trait de chaque barre : le seuil fixe de la grille, ou pour une compétence
    // relative la moyenne des seuils des copies notées.
    for (const c of suivi.competences) {
      const seuils = suivi.notees.map((n) => (n.notation?.etat === "notee" ? n.notation.competences.find((x) => x.code === c.code)!.seuils!.acquis : NaN));
      // Les compétences relatives se lisent de la grille de l'examen (deux en version 3,
      // quatre depuis la version 4).
      const attendu = estRelative(GRILLE_BUSINESS_ARENA_2026.seuils, c.code)
        ? seuils.reduce((s, x) => s + x, 0) / seuils.length
        : GRILLE_BUSINESS_ARENA_2026.seuils.fixes.acquis;
      expect(c.seuil, c.code).toBeCloseTo(attendu, 9);
    }
    const [ca] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, partieA));
    const d = (await decisionsDuCandidat(prof.userId, examenId, ca!.id))!;
    expect(d.tours).toHaveLength(SAISIE.tours);
    expect(d.tours[0]!.decisions?.price).toBeGreaterThan(0);
    // Un autre enseignant ne voit rien.
    const autre = await etablissementSousLicence("Autre");
    expect(await suiviDeLExamen(autre.userId, examenId)).toBeNull();
    expect(await decisionsDuCandidat(autre.userId, examenId, ca!.id)).toBeNull();
  }, 60_000);

  it("publiés, les résultats se lisent : note et relevé par compétence", async () => {
    expect((await copieRetenueDuCandidat(code, a))?.notation).toBeNull();
    expect(await publierLesResultats(prof.userId, examenId)).toBe(true);
    const copie = (await copieRetenueDuCandidat(code, a))!;
    expect(copie.publie).toBe(true);
    expect(copie.notation?.etat).toBe("notee");
    if (copie.notation?.etat === "notee") expect(copie.notation.competences.length).toBe(6);
  });

  it("l'export : point-virgule, BOM, daté, et rien d'un autre établissement", async () => {
    const autre = await etablissementSousLicence("Voisin");
    const r = await creerExamen(autre.userId, { ...SAISIE, modeGraine: "commune" });
    const z = await invite("z");
    const rz = await commencerLExamen({ code: r.code, userId: z, identification: "saisie", nom: "Zoé Voisine", numeroEtudiant: "999" });
    expect("gameId" in rz).toBe(true);
    const csv = (await exportDeLExamen(prof.userId, examenId, new Date("2026-10-12T10:00:00Z")))!;
    expect(csv.nom).toBe(`examen-gestion-l2-partiel-${code.toLowerCase()}-2026-10-12.csv`);
    expect(csv.contenu.startsWith("﻿")).toBe(true);
    const lignes = csv.contenu.trim().split("\r\n");
    expect(lignes).toHaveLength(3);
    expect(lignes[0]).toContain(";Note sur 100;");
    expect(csv.contenu).toContain("Alice Martin");
    expect(csv.contenu).not.toContain("Zoé");
    expect(csv.contenu).not.toContain("999");
    expect(await exportDeLExamen(autre.userId, examenId)).toBeNull();
  }, 60_000);

  it("la comparaison nationale reste retenue sous les seuils, sans un chiffre", async () => {
    const [e] = await db.select().from(examens).where(eq(examens.id, examenId));
    const c = await comparaisonNationale(e!);
    expect(c.disponible).toBe(false);
    if (!c.disponible) expect(c.message).toBe("Comparaison nationale : disponible à partir de 5 établissements.");
  });
});

describe("l'horloge de l'examen", () => {
  it("un tour échu se clôt sans le candidat, décisions reconduites ; la soumission tardive est refusée", async () => {
    const { code: c2, id } = await creerExamen(prof.userId, { ...SAISIE, nom: "Chronométré", modeGraine: "commune", dureeTourMinutes: 20 });
    const u = await invite("chrono");
    const t0 = new Date();
    const r = (await commencerLExamen({ code: c2, userId: u, identification: "saisie", nom: "Chloé", numeroEtudiant: "C1", now: t0 })) as {
      gameId: string;
    };
    const [t1] = await db.select().from(rounds).where(and(eq(rounds.gameId, r.gameId), eq(rounds.index, 1)));
    expect(t1!.deadline!.getTime()).toBe(t0.getTime() + 20 * 60_000);
    // Trente minutes plus tard : le tour 1 est clos, le tour 2 a couru depuis l'échéance.
    await appliquerLHorloge(r.gameId, new Date(t0.getTime() + 30 * 60_000));
    const [g] = await db.select().from(games).where(eq(games.id, r.gameId));
    expect(g!.currentRound).toBe(2);
    const [t2] = await db.select().from(rounds).where(and(eq(rounds.gameId, r.gameId), eq(rounds.index, 2)));
    expect(t2!.deadline!.getTime()).toBe(t0.getTime() + 40 * 60_000);
    // L'enseignant clôt l'examen : la copie est remise telle quelle, et notée.
    expect(await cloreLExamen(prof.userId, id)).toBe(true);
    const [cand] = await db.select().from(examenCandidats).where(eq(examenCandidats.gameId, r.gameId));
    expect(cand!.remisLe).toBeInstanceOf(Date);
    expect((cand!.notation as NotationGardee).etat).toBe("notee");
    // Plus personne n'entre.
    expect(await commencerLExamen({ code: c2, userId: await invite("tard"), identification: "saisie", nom: "T", numeroEtudiant: "T1" })).toEqual({
      refus: "ferme",
    });
    // Et la soumission sur une partie finie est refusée.
    await expect(
      submitTeamDecisions({ gameId: r.gameId, userId: u, payload: await decisionsDuTour(r.gameId, 3) }),
    ).rejects.toThrow();
  }, 120_000);
});

describe("le relais LTI : une activité de cours peut ouvrir un examen", () => {
  it("la cible « examen » se lit, n'appartient qu'à son créateur et à son établissement, et mène l'élève à la page de l'examen", async () => {
    const { id, code: c } = await creerExamen(prof.userId, { ...SAISIE, nom: "Par Moodle", modeGraine: "commune" });
    expect(lireCible(`examen:${id}`)).toEqual({ type: "examen", id });
    expect(lireCible("examen:pas-un-uuid")).toBeNull();
    expect(await cibleDeLEnseignant({ cible: { type: "examen", id }, enseignantId: prof.userId, organizationId: prof.orgId })).toBe(true);
    const autre = await etablissementSousLicence("Autre LTI");
    expect(await cibleDeLEnseignant({ cible: { type: "examen", id }, enseignantId: autre.userId, organizationId: autre.orgId })).toBe(false);
    expect(await cibleDeLEnseignant({ cible: { type: "examen", id }, enseignantId: prof.userId, organizationId: autre.orgId })).toBe(false);
    expect(pilotageDe({ cibleType: "examen", gameId: null, cohorteId: null, examenId: id })).toBe(`/teacher/examens/${id}`);
    const eleve = await invite("lti");
    expect(
      await entrerDansLaCible({ userId: eleve, pseudo: "Léa", cibleType: "examen", gameId: null, cohorteId: null, examenId: id }),
    ).toBe(`/examen/${c}`);
  });
});
