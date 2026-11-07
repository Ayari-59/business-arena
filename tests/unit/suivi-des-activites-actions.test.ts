import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LES ACTIONS DU BUREAU, DE L'ENQUÊTE ET DU SCÉNARIO NOTENT LE GESTE D'APRÈS LEUR CORRECTION
 * (app/cours/suivi-des-activites.ts, migration 0057).
 *
 * Le suivi reçoit le retour que l'action vient de calculer, et l'élève du cookie d'invité ; un visiteur
 * sans invité n'écrit rien ; une écriture qui échoue ne change rien à la correction rendue.
 */

const invite = vi.hoisted(() => ({ id: "eleve-1" as string | null }));
const enregistrer = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => true));

vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: async () => true }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => invite.id }));
vi.mock("@/services/activites.service", () => ({ enregistrerActivite: (...args: unknown[]) => enregistrer(...args) }));

import { corrigerAuBureauAction } from "@/app/cours/bureau/actions";
import { corrigerALEnqueteAction } from "@/app/cours/enquete/actions";
import { corrigerAuScenarioAction } from "@/app/cours/scenario/actions";
import { RAPPROCHEMENT_DE_MARS as b } from "@/config/cours/bureaux/rapprochement-de-mars";
import { LA_CLOTURE_DU_STAGIAIRE as enquete } from "@/config/cours/enquetes/la-cloture-du-stagiaire";
import { LE_DECOUVERT_DE_NOVA as s } from "@/config/cours/scenarios/le-decouvert-de-nova";
import { corrigerAuBureau } from "@/pedagogy/cours/bureau-servi";
import { corrigerAuScenario } from "@/pedagogy/cours/scenario-servi";

const montrer = (etape: string) => ({ etape, geste: "montrer" });

beforeEach(() => {
  invite.id = "eleve-1";
  enregistrer.mockReset();
  enregistrer.mockImplementation(async () => true);
});

describe("le suivi depuis l'action serveur", () => {
  it("le bureau : le retour calculé au serveur, rendu tel quel, part au suivi avec l'élève du cookie", async () => {
    const envoi = montrer(b.etapes[0]!.id);
    const retour = await corrigerAuBureauAction(b.code, envoi);
    expect(retour).toEqual(corrigerAuBureau(b, envoi));
    expect(enregistrer).toHaveBeenCalledTimes(1);
    expect(enregistrer).toHaveBeenCalledWith("eleve-1", { nature: "bureau", activite: b, envoi, retour });
  });

  it("l'enquête et le scénario, de même", async () => {
    const e = montrer(enquete.etapes[0]!.id);
    const r1 = await corrigerALEnqueteAction(enquete.code, e);
    expect(enregistrer).toHaveBeenLastCalledWith("eleve-1", { nature: "enquete", activite: enquete, envoi: e, retour: r1 });
    const c = { geste: "choisir", suite: [s.decisions[0]!.options[0]!] };
    const r2 = await corrigerAuScenarioAction(s.code, c);
    expect(r2).toEqual(corrigerAuScenario(s, c));
    expect(enregistrer).toHaveBeenLastCalledWith("eleve-1", { nature: "scenario", activite: s, envoi: c, retour: r2 });
  });

  it("un visiteur sans invité, ou un envoi refusé : rien ne part au suivi", async () => {
    invite.id = null;
    await corrigerAuBureauAction(b.code, montrer(b.etapes[0]!.id));
    invite.id = "eleve-1";
    expect(await corrigerAuBureauAction(b.code, { geste: "n'importe quoi" })).toEqual({ refus: "envoi" });
    expect(await corrigerAuBureauAction("inconnu", {})).toEqual({ refus: "bureau" });
    expect(enregistrer).not.toHaveBeenCalled();
  });

  it("une écriture qui échoue ne casse pas la correction", async () => {
    enregistrer.mockImplementation(async () => {
      throw new Error("base injoignable");
    });
    const erreur = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const envoi = montrer(b.etapes[0]!.id);
    expect(await corrigerAuBureauAction(b.code, envoi)).toEqual(corrigerAuBureau(b, envoi));
    const c = { geste: "choisir", suite: [s.decisions[0]!.options[0]!] };
    expect(await corrigerAuScenarioAction(s.code, c)).toEqual(corrigerAuScenario(s, c));
    expect(erreur).toHaveBeenCalled();
    erreur.mockRestore();
  });
});
