import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { SCENARIOS } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { PERIODICITY_DAYS, type Periodicity } from "@/config/scenarios/periodicity";
import { jetonsDe } from "@/config/scenarios/situation-texte";
import { COURRIERS, LIASSES } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE } from "@/config/courriers/routine";
import { LETTRES_DE_MISSION } from "@/config/courriers/mission";
import { COURRIERS_EN_RETOUR } from "@/config/courriers/reponses";
import { VARIANTES_SANS_ASSURANCE } from "@/config/courriers/sans-assurance";
import { dureeDuCourrier, type CourrierDef } from "@/config/courriers/types";
import {
  courrierALaDuree,
  phraseALaDuree,
  sourceDuCourrier,
  textesDuCourrier,
} from "@/config/courriers/texte";
import { courrierDeLaPartie, objetDuCourrier } from "@/config/courriers/de-la-partie";
import { CourrierRecommande, EnveloppeOuverte, Lettre, Message } from "@/components/courrier";
import { BandeauCourriers } from "@/components/bandeau-courriers";
import { aleasDuTour } from "@/components/lecture-du-resultat";
import type { CompanyRoundResult, EngineScenarioConfig } from "@/engine/types";

/**
 * LE TEXTE D'UN COURRIER SUIT LA DURÉE DU TOUR DE SA PARTIE.
 *
 * Les courriers étaient écrits au trimestre (« pour les deux prochains
 * trimestres », « Aucun effet sur ce trimestre », « +500 unités (échelle
 * trimestre) ») et ne passaient pas par `situationDeLaPartie`. Le moteur, lui,
 * met les commandes d'office à la durée du tour : `applyPeriodicity` multiplie
 * les modificateurs `order` par jours / 90 dans l'instantané, que le tirage
 * (`drawEvents`) et la distribution de l'enseignant (`injectedEvents`) lisent.
 * Cette garde rend chaque courrier au mois, au trimestre et à l'année, et
 * vérifie :
 *  · que chaque quantité d'une commande d'office est celle de l'instantané
 *    (`composerLeScenarioJoue`, monde figé), dans l'objet, le corps et l'effet ;
 *  · que la durée d'un effet, comptée en tours par le moteur, ne bouge pas ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran, variante sans assurance comprise ;
 *  · qu'au trimestre, chaque champ est octet pour octet celui d'avant les
 *    jetons (tests/fixtures/courriers-au-trimestre.json, relevé sur 1c6bc002) ;
 *  · que chaque chemin d'affichage rend le courrier de SA partie.
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/courriers-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

const TOUS: CourrierDef[] = [...COURRIERS, ...COURRIERS_DE_ROUTINE, ...LETTRES_DE_MISSION, ...COURRIERS_EN_RETOUR];
const milliers = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** L'instantané qu'une partie de ce scénario fige à cette durée, monde figé. */
const joue = (scenario: EngineScenarioConfig, periodicity: Periodicity) =>
  composerLeScenarioJoue({ scenario, seed: 11, concurrents: 3, periodicity });

/** Les unités d'une commande d'office telles que le moteur les applique (cible `order`). */
const unites = (s: EngineScenarioConfig, code: string) =>
  s.events.find((e) => e.code === code)!.modifiers.filter((m) => m.target === "order").reduce((t, m) => t + m.value, 0);

/**
 * Les commandes d'office, et ce que leur lettre écrit en toutes lettres à
 * chaque durée. Le nombre à côté des mots est vérifié contre l'instantané :
 * les mots ne sont pas recopiés d'une sortie, ils disent le nombre du moteur.
 */
const COMMANDES: Record<string, Partial<Record<Periodicity, [number, string]>>> = {
  tight_order: { month: [167, "cent soixante-sept unités"], quarter: [500, "cinq cents unités"], year: [2000, "deux mille unités"] },
  xxl_order: {
    month: [833, "huit cent trente-trois de vos enceintes"],
    quarter: [2500, "deux mille cinq cents de vos enceintes"],
    year: [10000, "dix mille de vos enceintes"],
  },
  big_order: { month: [200, "deux cents unités"], quarter: [600, "six cents unités"], year: [2400, "deux mille quatre cents unités"] },
  boutique_commande_ce: {
    month: [167, "cent soixante-sept salariés"],
    quarter: [500, "cinq cents salariés"],
    year: [2000, "deux mille salariés"],
  },
  conseil_mission_urgente: { month: [23, ""], quarter: [70, ""], year: [280, ""] },
  hotel_groupe_impromptu: { month: [133, ""], quarter: [400, ""], year: [1600, ""] },
  ecom_commande_b2b: { month: [233, "deux cent trente-trois articles"], quarter: [700, "sept cents articles"], year: [2800, "deux mille huit cents articles"] },
  batiment_chantier_surprise: { month: [60, ""], quarter: [180, ""], year: [720, ""] },
  transport_lot_surprise: { month: [300, "Trois cents palettes"], quarter: [900, "Neuf cents palettes"], year: [3600, "Trois mille six cents palettes"] },
  bistrot_banquet_surprise: { month: [73, "soixante-treize couverts"], quarter: [220, "deux cent vingt couverts"], year: [880, "huit cent quatre-vingts couverts"] },
  fitness_contrat_surprise: { month: [67, "soixante-sept salariés"], quarter: [200, "deux cents salariés"], year: [800, "huit cents salariés"] },
};

describe("chaque courrier se rend à la durée du tour de sa partie", () => {
  for (const periodicity of DUREES) {
    const jours = PERIODICITY_DAYS[periodicity];
    describe(NOM[periodicity], () => {
      it("aucun jeton n'atteint l'écran" + (periodicity === "quarter" ? "" : ", aucun trimestre ne reste"), () => {
        for (const c of TOUS) {
          for (const assurance of [true, false]) {
            const lu = courrierDeLaPartie(c.code, { jours, assurance })!;
            for (const t of textesDuCourrier(lu)) {
              expect(t, `${c.code} : ${t}`).not.toMatch(/\{\{|\}\}/);
              if (periodicity !== "quarter") expect(t, `${c.code} : ${t}`).not.toMatch(/trimestr/i);
            }
          }
        }
      });

      it("la durée d'un effet reste comptée en tours, comme le moteur la compte", () => {
        for (const c of TOUS) expect(dureeDuCourrier(courrierALaDuree(c, jours)), c.code).toBe(dureeDuCourrier(c));
        for (const d of SCENARIOS) {
          const s = joue(d.scenario, periodicity);
          for (const e of s.events) expect(e.duration, `${d.code} ${e.code}`).toBe(d.scenario.events.find((x) => x.code === e.code)!.duration);
        }
      });

      it("chaque commande d'office cite les unités que le moteur applique", () => {
        const vues = new Set<string>();
        for (const d of SCENARIOS) {
          const s = joue(d.scenario, periodicity);
          for (const e of s.events.filter((x) => x.modifiers.some((m) => m.target === "order"))) {
            vues.add(e.code);
            const [nombre, enLettres] = COMMANDES[e.code]![periodicity]!;
            expect(Math.round(unites(s, e.code)), `${d.code} ${e.code}`).toBe(nombre);
            const lu = courrierDeLaPartie(e.code, { jours })!;
            const chiffres = [lu.objet, lu.effet].flatMap((t) => [...t.matchAll(/\d{1,3}(?: \d{3})*(?![\d,])/g)].map((m) => m[0]));
            expect(chiffres.filter((n) => !["55", "61", "52"].includes(n)), `${e.code} : ${lu.objet} / ${lu.effet}`).toEqual(
              chiffres.filter((n) => n === milliers(nombre)),
            );
            expect(lu.effet).toContain(milliers(nombre));
            if (enLettres) expect(lu.corps, e.code).toContain(enLettres);
            expect(lu.effet).not.toContain(periodicity === "quarter" ? "(échelle mois)" : "(échelle trimestre)");
          }
        }
        expect([...vues].sort()).toEqual(Object.keys(COMMANDES).sort());
      });
    });
  }

  it("au trimestre, chaque champ est octet pour octet celui d'avant les jetons", () => {
    const attendus = new Set(Object.keys(AVANT));
    for (const c of TOUS) {
      expect(textesDuCourrier(courrierALaDuree(c, 90)), c.code).toEqual(AVANT[c.code]);
      // Les listes portent le texte au trimestre : la liasse imprimée sans durée le lit.
      expect(textesDuCourrier(c), c.code).toEqual(AVANT[c.code]);
      attendus.delete(c.code);
      if (VARIANTES_SANS_ASSURANCE[c.code]) {
        const cle = `${c.code} (sans assurance)`;
        expect(textesDuCourrier(courrierDeLaPartie(c.code, { jours: 90, assurance: false })!), cle).toEqual(AVANT[cle]);
        attendus.delete(cle);
      }
    }
    expect([...attendus]).toEqual([]);
  });

  it("au mois, l'accord-cadre du récit est mis à la durée du tour, et les mots aussi", () => {
    // Un chiffre du seul récit, écrit par trimestre : `flux(…)`, comme le moteur met ses flux.
    expect(courrierDeLaPartie("conseil_inv_grand_compte", { jours: 30 })!.corps).toContain(
      "pour les trois mois à venir, réservé aux cabinets référencés de la région : environ soixante-sept jours d'audit et d'accompagnement par mois",
    );
    expect(courrierDeLaPartie("conseil_inv_grand_compte", { jours: 360 })!.corps).toContain(
      "environ huit cents jours d'audit et d'accompagnement par an",
    );
    expect(courrierDeLaPartie("routine_situation_comptable", { jours: 30 })!.objet).toBe(
      "Situation intermédiaire au terme du mois",
    );
    expect(courrierDeLaPartie("routine_releve_bancaire", { jours: 360 })!.objet).toBe("Relevé annuel et arrêté de compte");
    expect(courrierDeLaPartie("retour_licenciement", { jours: 360 })!.objet).toBe(
      "Contestation du licenciement notifié l'exercice écoulé",
    );
  });

  it("les courriers transverses et les variantes sans assurance ne portent aucun montant", () => {
    for (const c of [...COURRIERS_DE_ROUTINE, ...COURRIERS_EN_RETOUR, ...LETTRES_DE_MISSION]) {
      for (const t of textesDuCourrier(sourceDuCourrier(c))) {
        for (const j of jetonsDe(t)) expect(j, `${c.code} : ${j}`).not.toContain(":");
      }
    }
    for (const v of Object.values(VARIANTES_SANS_ASSURANCE)) {
      for (const t of Object.values(v)) if (typeof t === "string") expect(t).not.toMatch(/\{\{|trimestr/);
    }
    // Les liasses rendent avec le scénario de leur secteur : la RSE n'en a pas besoin.
    expect(LIASSES.find((l) => l.code === "rse")!.courriers.every((c) => sourceDuCourrier(c) === c)).toBe(true);
  });
});

describe("chaque chemin d'affichage rend le courrier de SA partie", () => {
  const html = (el: ReturnType<typeof createElement>) =>
    renderToStaticMarkup(el).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

  it("la lettre, le courriel, l'enveloppe posée et le pli distribué", () => {
    const lettre = html(createElement(Lettre, { code: "tight_order", jours: 30 }));
    expect(lettre).toContain("+167 unités à 55 €/u imposés (échelle mois)");
    expect(lettre).toContain("Proposition de commande ferme — 167 unités");
    expect(lettre).not.toMatch(/trimestr/i);
    // Sans durée, le texte au trimestre : un appelant oublié montre le texte d'hier.
    expect(html(createElement(Lettre, { code: "tight_order" }))).toContain("+500 unités à 55 €/u imposés (échelle trimestre)");
    const courriel = html(createElement(Message, { code: "raw_material_spike", jours: 360 }));
    expect(courriel).toContain("Revalorisation de nos tarifs au 1er de l'exercice");
    expect(courriel).toContain("pour les deux prochains exercices");
    const pli = html(createElement(CourrierRecommande, { code: "rate_hike", jours: 30 }));
    expect(pli).toContain("pour les deux prochains mois");
    expect(pli).not.toMatch(/trimestr/i);
    // La variante sans assurance garde la durée de la partie.
    const sans = html(createElement(CourrierRecommande, { code: "natural_disaster", jours: 30, assurance: false }));
    expect(sans).toContain(VARIANTES_SANS_ASSURANCE.natural_disaster!.effet!);
    expect(html(createElement(EnveloppeOuverte, { code: "tight_order", jours: 30 }))).toContain("Centrale d'achat Priméo");
  });

  it("le bandeau des plis annoncés", () => {
    const bandeau = html(
      createElement(BandeauCourriers, {
        courriers: [{ code: "big_order", teamId: null, teamName: null, isMyTeam: false }],
        jours: 30,
      }),
    );
    expect(bandeau).toContain("commande ferme de 200 unités");
    expect(bandeau).toContain("+200 unités (échelle mois)");
  });

  it("les objets cités (tableau de bord, assurance, courrier classé) et la lecture du résultat", () => {
    expect(objetDuCourrier("xxl_order", 30)).toBe("Commande ferme de 833 unités pour notre opération de fin d'année");
    expect(objetDuCourrier("xxl_order")).toBe("Commande ferme de 2 500 unités pour notre opération de fin d'année");
    expect(objetDuCourrier("inconnu", 30)).toBeUndefined();
    const result = { incomeStatement: { revenue: 1000 } } as unknown as CompanyRoundResult;
    const [alea] = aleasDuTour({ scenario: { events: [], suppliers: [], roundDays: 30 }, result, codes: ["big_order"], unites: "enceintes" });
    expect(alea!.texte).toContain("commande ferme de 200 unités");
    expect(alea!.texte).toContain("+200 unités (échelle mois)");
    expect(phraseALaDuree("Rien qui engage {{ce trimestre}} :", 30)).toBe("Rien qui engage ce mois-ci :");
    expect(phraseALaDuree("Rien qui engage {{ce trimestre}} :")).toBe("Rien qui engage ce trimestre :");
  });
});
