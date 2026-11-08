import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LA PURGE DE CHAQUE NUIT LAISSE UNE TRACE DANS LE JOURNAL.
 *
 * Sans trace, rien ne prouve que la purge RGPD tourne. Chaque exécution autorisée de
 * /api/cron/purge écrit une ligne JSON (date, durée, lignes purgées par catégorie) ;
 * un échec écrit l'étape en cause et répond 500. Aucune donnée personnelle, aucun
 * secret, ni dans la ligne ni dans la réponse. Sans secret : 401, comme avant, et rien
 * n'est purgé.
 */

const fausseBase = vi.hoisted(() => ({ panne: null as Error | null }));
const jetons = vi.hoisted(() => ({ panne: null as Error | null }));

vi.mock("@/db", () => {
  const chaine = {
    where: () => chaine,
    set: () => chaine,
    returning: async () => {
      if (fausseBase.panne) throw fausseBase.panne;
      return [];
    },
  };
  return { db: { delete: () => chaine, update: () => chaine } };
});

vi.mock("@/services/mot-de-passe-oublie.service", () => ({
  purgerLesJetonsExpires: async () => {
    if (jetons.panne) throw jetons.panne;
    return 0;
  },
}));

import { GET } from "@/app/api/cron/purge/route";
import * as service from "@/services/purge.service";
import { messageSansDonneePersonnelle } from "@/lib/journal-de-purge";

const SECRET = "secret-de-test-uniquement";
const BILAN: service.BilanDePurge = {
  tentatives: 3,
  jetonsDeReinitialisation: 1,
  ipEffacees: 2,
  demandes: 0,
  examens: 1,
  parties: 4,
  partiesDEpisodes: 0,
  invites: 5,
  enseignantsAvertis: 0,
  avertissementsNonEnvoyes: 0,
  enseignantsSupprimes: 0,
};

const appel = (entete?: string) =>
  new Request("http://localhost/api/cron/purge", { headers: entete ? { authorization: entete } : {} });

type Espion = { mock: { calls: unknown[][] } };
let info: Espion & ReturnType<typeof vi.fn>;
let erreur: Espion & ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  info = vi.spyOn(console, "info").mockImplementation(() => {});
  erreur = vi.spyOn(console, "error").mockImplementation(() => {});
  fausseBase.panne = null;
  jetons.panne = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function lignesDuJournal(espion: Espion) {
  return espion.mock.calls.map((c: unknown[]) => JSON.parse(String(c[0])) as Record<string, unknown>);
}

describe("/api/cron/purge : le journal", () => {
  it("sans secret : 401 inchangé, rien n'est purgé ni journalisé", async () => {
    const purger = vi.spyOn(service, "purger");
    for (const r of [await GET(appel()), await GET(appel("Bearer mauvais"))]) {
      expect(r.status).toBe(401);
      expect(await r.text()).toBe("Non autorisé.");
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
    expect(purger).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(erreur).not.toHaveBeenCalled();
  });

  it("réussie : 200 avec le bilan, et une ligne JSON avec la date, la durée et les lignes par catégorie", async () => {
    vi.spyOn(service, "purger").mockResolvedValue(BILAN);
    const avant = Date.now();
    const r = await GET(appel(`Bearer ${SECRET}`));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, bilan: BILAN });

    const lignes = lignesDuJournal(info);
    expect(lignes).toHaveLength(1);
    const l = lignes[0]!;
    expect(l.evenement).toBe("purge-rgpd");
    expect(l.statut).toBe("ok");
    expect(new Date(String(l.le)).getTime()).toBeGreaterThanOrEqual(avant - 1000);
    expect(typeof l.dureeMs).toBe("number");
    expect(l.dureeMs as number).toBeGreaterThanOrEqual(0);
    expect(l.lignes).toEqual(BILAN);
    expect(Object.keys(l).sort()).toEqual(["dureeMs", "evenement", "le", "lignes", "statut"]);
    expect(String(info.mock.calls[0]![0])).not.toContain(SECRET);
    expect(erreur).not.toHaveBeenCalled();
  });

  it("échouée : 500, console.error avec la catégorie et le message masqué, aucun secret", async () => {
    vi.spyOn(service, "purger").mockRejectedValue(
      new service.ErreurDePurge("invites", new Error("clé (email)=(eleve@exemple.fr) depuis 192.168.1.20 refusée")),
    );
    const r = await GET(appel(`Bearer ${SECRET}`));
    expect(r.status).toBe(500);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const corps = await r.text();
    expect(JSON.parse(corps)).toEqual({ ok: false, categorie: "invites" });

    const lignes = lignesDuJournal(erreur);
    expect(lignes).toHaveLength(1);
    const l = lignes[0]!;
    expect(l).toMatchObject({ evenement: "purge-rgpd", statut: "echec", categorie: "invites" });
    expect(typeof l.le).toBe("string");
    expect(typeof l.dureeMs).toBe("number");
    expect(l.message).toContain("refusée");
    const brut = String(erreur.mock.calls[0]![0]);
    expect(brut).not.toContain("eleve@exemple.fr");
    expect(brut).not.toContain("192.168.1.20");
    expect(brut).not.toContain(SECRET);
    expect(info).not.toHaveBeenCalled();
  });

  it("une erreur imprévue (hors étape) donne aussi 500 et une ligne d'échec", async () => {
    vi.spyOn(service, "purger").mockRejectedValue(new Error("connexion perdue"));
    const r = await GET(appel(`Bearer ${SECRET}`));
    expect(r.status).toBe(500);
    expect(lignesDuJournal(erreur)[0]).toMatchObject({ statut: "echec", categorie: "inconnue", message: "connexion perdue" });
  });
});

describe("purger : l'étape en cause d'un échec", () => {
  it("une panne de la première suppression est rapportée à « tentatives »", async () => {
    fausseBase.panne = new Error("base indisponible");
    const e = await service.purger().catch((x: unknown) => x);
    expect(e).toBeInstanceOf(service.ErreurDePurge);
    expect((e as service.ErreurDePurge).categorie).toBe("tentatives");
    expect(((e as service.ErreurDePurge).cause as Error).message).toBe("base indisponible");
  });

  it("une panne des jetons expirés est rapportée à « jetonsDeReinitialisation »", async () => {
    jetons.panne = new Error("jetons illisibles");
    const e = await service.purger().catch((x: unknown) => x);
    expect((e as service.ErreurDePurge).categorie).toBe("jetonsDeReinitialisation");
  });
});

describe("le message journalisé ne porte ni adresse e-mail ni adresse IP", () => {
  it("masque les adresses et borne la longueur", () => {
    const m = messageSansDonneePersonnelle(new Error("a.b+c@d.fr puis 10.0.0.1 puis fe80::1:2:3 puis " + "x".repeat(500)));
    expect(m).not.toMatch(/@|10\.0\.0\.1|fe80/);
    expect(m.length).toBeLessThanOrEqual(300);
  });
});
