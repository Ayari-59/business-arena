import { describe, expect, it } from "vitest";
import { ATELIERS } from "../../src/config/ateliers";
import type { AtelierDefinition } from "../../src/config/ateliers/types";
import { dossierEleve, tableauDeBordCsv } from "../../src/config/ateliers/dossiers";
import { dossierDuResponsable } from "../../src/config/ateliers/dossiers-des-responsables";
import { cockpitAtelier } from "../../src/config/ateliers/cockpit-atelier";
import { chargeDesSeances } from "../../src/config/ateliers/duree-des-seances";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "../../src/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "../../src/config/scenarios/periodicity";
import { nomDuMois } from "../../src/config/scenarios/calendrier-mensuel";
import { tourDOuverture } from "../../src/config/scenarios/situation-kit";
import { toGamme } from "../../src/engine/gamme";
import { amortissementsDuDepart } from "../../src/config/scenarios/amortissements-du-depart";

/**
 * LE DOSSIER D'UN ATELIER QUI NE SE JOUE PAS AU TRIMESTRE DIT LA PARTIE QU'IL CRÉERA.
 *
 * Les dossiers se lisaient sur le scénario du registre, écrit au trimestre. L'atelier
 * MCO au mois, qui commence en juin, annonçait donc à ses élèves la capacité et les
 * charges d'un trimestre et un pic au quatrième tour, pendant que la partie leur
 * montrait celles d'un mois, sur le calendrier.
 *
 * L'attendu est recomposé ici comme la création compose la partie
 * (`composerLeScenarioJoue`, `applyPeriodicityToCompany`), et non lu de la fonction
 * que les dossiers appellent : une garde qui emprunterait ce code ne le verrait pas
 * se tromper.
 */
const AU_MOIS = ATELIERS.filter((a) => a.reglages.periodicite !== "quarter");

/** La partie que la création composera pour cet atelier. */
function partieCreee(a: AtelierDefinition) {
  const r = a.reglages;
  const definition = scenarioByCode(r.scenarioCode);
  const scenario = composerLeScenarioJoue({
    scenario: definition.scenario,
    seed: 7,
    variableWorld: false,
    level: r.niveau,
    concurrents: r.equipes + r.bots,
    roundsCount: r.tours,
    periodicity: r.periodicite,
    moisDeDepart: r.periodicite === "month" ? (r.moisDeDepart ?? 1) : undefined,
    investmentStories: true,
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
  });
  const etat = applyPeriodicityToCompany(
    definition.company("garde", definition.playerTeamName, "human"),
    r.periodicite,
    { abonnement: definition.scenario.subscription !== undefined },
  );
  return { definition, scenario, etat };
}

/** Le nombre que porte un libellé de dossier (« 30 000 € », « 3 000 couverts/tour »). */
const nombre = (texte: string) => Number(texte.replace(/[^\d,]/g, "").replace(",", "."));
const auCentime = (v: number) => Math.round(v * 100) / 100;

describe("les dossiers d'un atelier au mois", () => {
  it("le registre porte au moins un atelier au mois (la garde ne tourne pas à vide)", () => {
    expect(AU_MOIS.map((a) => a.code)).toContain("mco2");
  });

  for (const a of AU_MOIS) {
    describe(a.code, () => {
      const { definition, scenario, etat } = partieCreee(a);
      const v = definition.vocabulary;
      const moisDeDepart = scenario.moisDeDepart;
      const eleve = dossierEleve(a);
      const ligne = (code: string, libelle: string) => {
        const service = eleve.services.find((s) => s.code === code)!;
        const l = service.lignes.find((x) => x.libelle === libelle);
        expect(l, `${a.code} : ligne « ${libelle} » absente`).toBeDefined();
        return l!.valeur;
      };

      it("la capacité, les heures et les charges du dossier de l'élève sont celles de la partie", () => {
        expect(nombre(ligne("approvisionnement", v.capacityLabel))).toBe(Math.round(etat.machineCapacity));
        expect(nombre(ligne("financier", "Charges de structure décaissées par tour"))).toBe(
          auCentime(scenario.fixedCostsPerRound),
        );
        // Ceux que le moteur compte : le parc typé, non `depreciationPerRound`, qu'il ignore.
        expect(nombre(ligne("financier", "Amortissements par tour, au départ"))).toBe(
          auCentime(amortissementsDuDepart(scenario)),
        );
        expect(nombre(ligne("commercial", "Budget marketing de référence par tour"))).toBe(
          auCentime(0.5 * scenario.marketing.scale),
        );
      });

      it("la demande de chaque clientèle est celle de la partie", () => {
        const commercial = eleve.services.find((s) => s.code === "commercial")!;
        const tailles = toGamme(scenario).flatMap((p) => p.market.segments.map((s) => Math.round(s.size)));
        expect(commercial.tableau!.lignes.map((l) => nombre(l[1]!))).toEqual(tailles);
      });

      it("la saison de la gamme est celle des mois joués, et le pic est un mois nommé", () => {
        const gamme = toGamme(scenario);
        expect(eleve.gamme.map((g) => g.saison)).toEqual(
          gamme.map((p) => Array.from({ length: a.reglages.tours }, (_, i) => p.market.seasonality[i] ?? 1)),
        );
        expect(moisDeDepart, `${a.code} : la partie au mois suit le calendrier`).toBeDefined();
        // Le mois où la demande de la gamme culmine, sur la partie composée.
        const demande = (t: number) =>
          gamme.reduce(
            (s, p) =>
              s +
              p.market.segments.reduce(
                (u, seg) => u + seg.size * (seg.seasonality?.[t - 1] ?? p.market.seasonality[t - 1] ?? 1),
                0,
              ),
            0,
          );
        const tours = Array.from({ length: a.reglages.tours }, (_, i) => i + 1);
        const pic = tours.reduce((m, t) => (demande(t) > demande(m) ? t : m), 1);
        const mois = nomDuMois(pic, moisDeDepart!);
        expect(ligne("commercial", "Mois de la demande la plus forte")).toBe(`${mois} (tour ${pic})`);
        expect(eleve.services.find((s) => s.code === "commercial")!.tableau!.entetes).toContain(`Saison (${mois})`);
        expect(eleve.tableauDeBord.mois).toEqual(tours.map((t) => nomDuMois(t, moisDeDepart!)));
        expect(tableauDeBordCsv(a)).toContain(`Tour 1 (${nomDuMois(1, moisDeDepart!)})`);
      });

      it("les dossiers des responsables portent les mêmes chiffres que le dossier de l'élève", () => {
        for (const code of ["approvisionnement", "commercial", "rh", "financier"] as const) {
          const service = eleve.services.find((s) => s.code === code)!;
          expect(dossierDuResponsable(a, code).chiffres!.lignes, `${a.code}/${code}`).toEqual(service.lignes);
        }
      });

      it("le cockpit prévoit la partie : capacité et charges d'un tour de la partie", () => {
        const parametres = cockpitAtelier(a).feuilles[0]!.lignes;
        const valeur = (debut: string) =>
          parametres.find((l) => typeof l[0]?.v === "string" && (l[0].v as string).startsWith(debut))?.[1]?.v;
        expect(valeur(v.capacityLabel)).toBe(Math.round(etat.machineCapacity));
        expect(valeur("Charges de structure")).toBe(scenario.fixedCostsPerRound);
      });

      it("l'estimation de chaque séance compte la situation qui s'ouvre à son tour dans la partie", () => {
        const ecrits = definition.scenario.roundsCount;
        for (const c of chargeDesSeances(a)) {
          const tour = c.seance.essai ? 1 : c.seance.tourJoue!;
          const ouvre = definition.situations.some(
            (s) => tourDOuverture(s.trigger, a.reglages.tours, ecrits, moisDeDepart) === tour,
          );
          expect(c.estimation.analyse > 0, `${a.code}, séance ${c.seance.numero} (tour ${tour})`).toBe(ouvre);
        }
      });
    });
  }
});
