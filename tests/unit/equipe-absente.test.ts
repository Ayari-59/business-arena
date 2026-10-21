import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { aLaMesureDuNiveau, neutralDecisions } from "@/engine/bots";
import { fallbackDecisions } from "@/services/decision.service";
import { avecLaQualiteProposee, proposedDecisionsFor } from "@/services/decision-baseline";
import type { RoundDecisions } from "@/engine/types";

/**
 * L'ÉQUIPE ABSENTE REÇOIT LA PROPOSITION DE SON ÉCRAN.
 *
 * Sans soumission ni tour à reconduire, la résolution du tour joue `fallbackDecisions`.
 * Dans une partie à la demande, l'écran de l'équipe lui proposait le départ du
 * formulaire (le plan sans l'avenir, sans R&D ni communication) ; l'équipe absente
 * recevait la gestion neutre. Une partie d'avant garde le chemin d'avant, au bit près.
 */

const sansEmprunt = (d: RoundDecisions): RoundDecisions => ({
  ...d,
  finance: { ...(d.finance ?? {}), newLoan: 0, loanRepayment: 0 },
});

for (const code of ["bistrot", "nova", "nova-gamme"]) {
  describe(`${code} : l'équipe absente du premier tour`, () => {
    const def = scenarioByCode(code);
    const reglages = { scenario: def.scenario, seed: 4242, variableWorld: true, level: 2, concurrents: 3 };
    const etat = def.company("a-equipe", def.playerTeamName, "human");

    it("partie à la demande : exactement la proposition de son écran, emprunt nul", () => {
      const snapshot = composerLeScenarioJoue({ ...reglages, ...CORRECTIFS_DES_PARTIES_NOUVELLES });
      const ecran = proposedDecisionsFor({ snapshot, state: etat, roundIndex: 1, previousPayload: null });
      expect(fallbackDecisions(snapshot, etat, 1)).toEqual(sansEmprunt(ecran));
    });

    it("partie d'avant : le chemin d'avant, au bit près", () => {
      const snapshot = composerLeScenarioJoue(reglages);
      const neutre = neutralDecisions({ scenario: snapshot, state: etat, roundIndex: 1, leviers: null });
      const avant = aLaMesureDuNiveau(avecLaQualiteProposee(snapshot, neutre), null, neutre);
      expect(fallbackDecisions(snapshot, etat, 1)).toEqual(sansEmprunt(avant));
    });
  });
}
