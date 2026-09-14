import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * UN VOLUME NUL N'EST PAS UNE DÉCISION.
 *
 * Constaté en production (audit croisé §07) : un plan de production vide
 * devenait 0 côté serveur sans erreur, et une équipe validait prix et
 * production sans les toucher sans que rien ne le dise. Ici : le serveur
 * refuse le volume nul dans la langue du secteur, et le formulaire prévient
 * avant d'envoyer des valeurs proposées non touchées.
 */

// Les actions serveur touchent désormais le service des subventions, qui
// charge `@/db` — lequel jette à l'import sans DATABASE_URL. Fermer cette
// frontière garde ce test unitaire : aucune requête n'est faite ici.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
// Le financement de sauvetage est vérifié côté serveur : l'action lit la vue
// pour savoir si l'équipe est en crise. C'est une frontière de service de
// plus, et `@/db` jette à l'import sans DATABASE_URL — une vue nulle vaut
// « pas de crise », ce qui laisse passer les décisions de ces tests.
vi.mock("@/services/game-view.service", () => ({ getGameView: vi.fn(async () => null) }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => "invite-1" }));
// `actions.ts` importe retakeSituation de debrief.service, qui charge `@/db` —
// lequel jette à l'import sans DATABASE_URL. Le mock ferme la frontière de
// service, pour que ce test reste unitaire sans base ni variable d'environnement.
vi.mock("@/services/debrief.service", () => ({ retakeSituation: vi.fn() }));
vi.mock("@/services/pedagogy.service", () => ({
  submitDiagnosis: vi.fn(),
  submitQuiz: vi.fn(),
  unlockHint: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  getGameKind: vi.fn(async () => "class"),
  getGameVocabulary: vi.fn(async () => ({
    productionPlanLabel: "Nuitées mises en vente",
    units: "nuitées",
    unit: "nuitée",
    priceLabel: "Prix moyen par nuitée",
  })),
  nommerEquipe: vi.fn(),
  resolveCurrentRound: vi.fn(),
  submitTeamDecisions: vi.fn(async () => ({ roundIndex: 1 })),
}));

const { playRoundAction } = await import("@/app/arena/[gameId]/actions");
const { submitTeamDecisions } = await import("@/services/game.service");

function formulaire(champs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
}

const BASE = { price: "120", marketingBudget: "3000", qualityBudget: "0", maintenanceBudget: "0" };

describe("refus serveur du volume pivot", () => {
  it("volume 0 : refusé, dans la langue du secteur, rien n'est enregistré", async () => {
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: "0" }));
    expect(etat.error).toContain("Nuitées mises en vente");
    expect(etat.error).toContain("≥ 1");
    expect(etat.error).toContain("nuitées");
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("volume vide ou négatif : même refus", async () => {
    for (const v of ["", "  ", "-5", "abc"]) {
      const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: v }));
      expect(etat.error, `volume « ${v} »`).toContain("≥ 1");
    }
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("volume ≥ 1 : les décisions passent", async () => {
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: "1" }));
    expect(etat.error).toBeNull();
    expect(submitTeamDecisions).toHaveBeenCalledTimes(1);
  });
});

describe("le formulaire prévient avant d'envoyer des valeurs proposées", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "decision-form.tsx"), "utf8");

  it("compare les pivots aux valeurs proposées au moment de la soumission", () => {
    expect(source).toContain("pivotsNonTouches(");
    expect(source).toContain("onSubmit={verifierPivots}");
    expect(source).toContain("proposed?: RoundDecisions");
  });

  it("affiche le bandeau non bloquant avec ses deux issues", () => {
    expect(source).toContain("Vous validez avec les valeurs proposées pour");
    expect(source).toContain("C&apos;est un choix ?");
    expect(source).toContain("Oui, je garde ces valeurs");
    expect(source).toContain("Non, je les modifie");
    // « Oui » envoie vraiment ; « Non » ramène au premier champ non touché.
    expect(source).toContain("requestSubmit()");
    expect(source).toContain(".focus()");
  });
});

/**
 * LE VERROU DE SAUVETAGE TIENT AUSSI CÔTÉ SERVEUR.
 *
 * L'écran grise « Valider » et dit ce qui manque. Mais un formulaire PÉRIMÉ —
 * l'élève avait sa page ouverte avant la clôture qui l'a mis en crise — ou
 * forgé passerait outre : le grisage est un confort, pas une garantie. La
 * règle est la même des deux côtés (`verdictSauvetage`), et c'est le serveur
 * qui a le dernier mot.
 */
describe("financement de sauvetage : le serveur refuse ce que l'écran grisait", () => {
  const DECISIONS = {
    price: "59",
    productionPlan: "4000",
    marketingBudget: "8000",
    qualityBudget: "0",
    maintenanceBudget: "0",
  };

  /**
   * Une équipe en crise : il lui manque 46 000 € pour repasser sous le
   * plafond. La vue porte l'exigence TOUTE FAITE — l'écran et le serveur
   * lisent le même objet, et ne peuvent donc pas diverger.
   */
  const enCrise = {
    exigenceSauvetage: {
      manque: 46000,
      capaciteEmprunt: 70000,
      enveloppeApport: 100000,
    },
  };

  it("sans financement, la décision est refusée et le montant est dit", async () => {
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce(enCrise as never);
    const res = await playRoundAction("partie", { error: null }, formulaire(DECISIONS));
    expect(res.error).toMatch(/46\s000\s€/);
    expect(res.error).toContain("Empruntez");
  });

  it("avec de quoi couvrir, elle passe", async () => {
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce(enCrise as never);
    const res = await playRoundAction("partie", { error: null }, formulaire({ ...DECISIONS, newLoan: "46000" }));
    expect(res.error).toBeNull();
  });

  it("emprunt et apport se cumulent, comme à l'écran", async () => {
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce(enCrise as never);
    const res = await playRoundAction(
      "partie",
      { error: null },
      formulaire({ ...DECISIONS, newLoan: "20000", capitalIncrease: "26000" }),
    );
    expect(res.error).toBeNull();
  });

  it("au pied du mur, il renvoie vers la subvention plutôt que vers l'emprunt", async () => {
    // Dire « empruntez » à une équipe dont la banque ne prête plus serait une
    // impasse : le message doit nommer la seule porte qui reste.
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce({
      exigenceSauvetage: { manque: 200000, capaciteEmprunt: 0, enveloppeApport: 0 },
    } as never);
    const res = await playRoundAction("partie", { error: null }, formulaire(DECISIONS));
    expect(res.error).toContain("subvention");
  });

  it("la demande déposée lève le verrou côté serveur aussi", async () => {
    // Sans quoi l'écran laisserait valider et le serveur refuserait : la pire
    // des situations, l'élève ne comprenant ni pourquoi ni quoi changer.
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce({
      exigenceSauvetage: {
        manque: 200000,
        capaciteEmprunt: 0,
        enveloppeApport: 0,
        demandeDeposee: true,
      },
    } as never);
    const res = await playRoundAction("partie", { error: null }, formulaire(DECISIONS));
    expect(res.error).toBeNull();
  });

  it("l'enseignant ayant choisi l'avertissement, rien n'est bloqué", async () => {
    // À zéro, la vue ne construit aucune exigence : l'équipe est avertie et
    // reste libre de couler.
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce({ exigenceSauvetage: null } as never);
    const res = await playRoundAction("partie", { error: null }, formulaire(DECISIONS));
    expect(res.error).toBeNull();
  });
});
