import { describe, expect, it } from "vitest";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { servirLaPartie, type DemandeDePartie, type VueDeLaPartie } from "@/pedagogy/episodes/partie-servie";
import { budgetDEnquete, niveauParCode, sourcesProposees, type CodeNiveau } from "@/config/episodes/niveaux";
import type { Episode, Message } from "@/config/episodes/types";

/**
 * CE QUE LA VUE SERVIE NE PORTE PAS (audit du 10 novembre 2026, P1-1).
 *
 * Le test d'or (partie-servie.test.ts) vérifie que l'écran montre la même chose qu'avant ; celui-ci
 * vérifie que le navigateur ne reçoit pas davantage. À chaque geste de chaque épisode, sous deux
 * tirages et deux niveaux, on cherche dans la réponse ce qu'on ne doit pas encore savoir :
 *  · avant une décision, les réactions du terrain à chacune de ses options ;
 *  · ce qu'apprend une vérification qu'on n'a pas faite ;
 *  · les semaines et les imprévus qui ne sont pas encore joués ;
 *  · la conséquence avant la décision, le bilan avant la fin.
 */

/** Les textes assez longs pour n'appartenir qu'à eux : un mot court se retrouve partout. */
const longs = (ms: readonly Message[] | null | undefined) => (ms ?? []).map((m) => m.texte).filter((t) => t.length >= 40);

function demande(ep: Episode, niveau: CodeNiveau, graine: number, geste: DemandeDePartie["geste"], decisions: number[], consultes: string[][]): DemandeDePartie {
  const fin =
    geste === "valider" && decisions.length === ep.etapes.length
      ? { diagnostic: ep.diagnostics[0]!.id, reevaluation: { choix: "maintient" as const, principal: null }, prevision: ep.prevision.min, confiance: 60 }
      : null;
  return { code: ep.code, geste, niveau, graine, decisions, consultes, fin, precedente: null };
}

describe("la vue d'un geste ne porte que ce qu'on a le droit de voir à ce moment", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.code}`, () => {
      const fautes: string[] = [];
      for (const [niveau, graine] of [["standard", 11], ["expert", 3]] as const) {
        const niv = niveauParCode(niveau);
        const n = ep.etapes.length;
        const decisions: number[] = [];
        const consultes: string[][] = ep.etapes.map(() => []);
        let vue: VueDeLaPartie = servirLaPartie(ep, demande(ep, niveau, graine, "commencer", [], consultes), { sansLicence: false });
        for (let i = 0; i < n; i += 1) {
          const etape = ep.etapes[i]!;
          // Une vérification sur deux, dans l'ordre, tant que la règle le permet.
          const proposees = sourcesProposees(niv, etape);
          const budget = i === 0 ? budgetDEnquete(niv, ep, etape) : undefined;
          let jours = 0;
          for (const [k, s] of proposees.entries()) {
            if (k % 2 === 1) continue;
            if (niv.verificationsParDecision != null && i > 0 && consultes[i]!.length >= niv.verificationsParDecision) break;
            if (budget != null && jours + s.cout > budget + 1e-9) continue;
            jours += s.cout;
            consultes[i]!.push(s.id);
            vue = servirLaPartie(ep, demande(ep, niveau, graine, "verifier", [...decisions], consultes.map((c) => [...c])), { sansLicence: false });
          }
          const ou = `${niveau} · décision ${i + 1}`;
          const texte = JSON.stringify(vue);
          // La conséquence de la décision précédente, déjà vue, peut rester ; jamais celle-ci.
          if (vue.consequence && vue.consequence.indice >= i) fautes.push(`${ou} : une conséquence avant la décision`);
          if (vue.bilan) fautes.push(`${ou} : le bilan avant la fin`);
          if (vue.etape?.indice !== i) fautes.push(`${ou} : l'étape servie n'est pas l'étape en cours`);
          // Ce qu'aucune option n'a encore fait arriver.
          for (let k = 0; k < etape.options.length; k += 1) {
            const reactions = [...longs(etape.reactions[k]), ...longs(ep.reactions(i, k, graine))];
            for (const t of reactions) {
              if (texte.includes(JSON.stringify(t).slice(1, -1))) fautes.push(`${ou} : la réaction à l'option ${k + 1} « ${t.slice(0, 40)}… »`);
            }
          }
          // Ce qu'apprendraient les vérifications qu'on n'a pas faites.
          for (const s of etape.sources) {
            if (consultes[i]!.includes(s.id) || typeof s.resultat !== "string" || s.resultat.length < 40) continue;
            if (texte.includes(JSON.stringify(s.resultat).slice(1, -1))) fautes.push(`${ou} : la vérification « ${s.id} » sans l'avoir faite`);
          }
          // La décision : la première option, pour que la suite se joue toujours.
          decisions.push(0);
          vue = servirLaPartie(ep, demande(ep, niveau, graine, "valider", [...decisions], consultes.map((c) => [...c])), { sansLicence: false });
          const c = vue.consequence!;
          if (!c || c.indice !== i) fautes.push(`${ou} : pas de conséquence après la décision`);
          if (c && c.courbe.semaines.length !== etape.jusqua + 1) fautes.push(`${ou} : la courbe porte des semaines à venir`);
          if (c && c.courbe.imprevus.some((x) => x.semaine > etape.jusqua)) fautes.push(`${ou} : un imprévu à venir`);
          if (i < n - 1 && vue.bilan) fautes.push(`${ou} : le bilan avant la fin`);
          // Après la décision, les réactions des autres options restent inconnues.
          const prises = new Set([...longs(etape.reactions[0]), ...longs(ep.reactions(i, 0, graine))]);
          const apres = JSON.stringify({ ...vue, consequence: { ...c, reactions: [] } });
          for (let k = 1; k < etape.options.length; k += 1) {
            for (const t of [...longs(etape.reactions[k]), ...longs(ep.reactions(i, k, graine))]) {
              if (!prises.has(t) && apres.includes(JSON.stringify(t).slice(1, -1))) {
                fautes.push(`${ou} : après la décision, la réaction à l'option ${k + 1} « ${t.slice(0, 40)}… »`);
              }
            }
          }
        }
        if (!vue.bilan) fautes.push(`${niveau} : pas de bilan à la fin`);
      }
      expect(fautes.slice(0, 5), `${fautes.length} faute(s)`).toEqual([]);
    }, 60_000);
  }
});
