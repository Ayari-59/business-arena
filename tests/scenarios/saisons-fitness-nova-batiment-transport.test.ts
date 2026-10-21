import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { PERIODICITY_DAYS, type Periodicity } from "@/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "@/config/scenarios/situation-texte";
import { LIASSES } from "@/config/courriers/registre";
import { VARIANTES_SANS_ASSURANCE } from "@/config/courriers/sans-assurance";
import { courrierALaDuree, textesDuCourrier } from "@/config/courriers/texte";
import { courrierDeLaPartie } from "@/config/courriers/de-la-partie";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * LE RÉCIT DES SAISONS SUIT LA DURÉE DU TOUR : VOLT FITNESS, NOVA, NOVA · GAMME,
 * MARTEL & FILS, ROUTE & CIE, et les liasses de ces secteurs plus la RSE.
 *
 * La saisonnalité se lit une valeur par tour, à toutes les durées (ADR-01,
 * `config/scenarios/periodicity.ts`) : le tour 4 de NOVA est son pic au mois
 * comme au trimestre, le tour 3 de VOLT FITNESS son creux. Le récit, lui, était
 * écrit au trimestre : « Juillet », « Noël arrive », « les inscrits de janvier »,
 * « deux semaines creuses en février ». Au mois, le tour 3 n'est pas juillet ; à
 * l'année, un tour n'est pas l'été. Le texte disait faux, et rien ne le signalait.
 *
 * Cette garde rend chaque situation et chaque courrier du groupe au mois et à
 * l'année, et vérifie :
 *  · qu'aucun nom de mois, aucune saison du calendrier, aucune fête datée, ni
 *    « rentrée », « soldes », « vacances », « fin d'année » ou « début d'année »
 *    ne reste, sauf exception nommée et justifiée ci-dessous ;
 *  · qu'au trimestre, le texte est octet pour octet celui des relevés
 *    (tests/fixtures/), aux corrections près que les gardes de durée nomment déjà.
 */

const DUREES_REECRITES: Periodicity[] = ["month", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const SCENARIOS = ["fitness", "nova", "nova-gamme", "batiment", "transport"] as const;
const CODES_DES_LIASSES = ["fitness", "nova", "batiment", "transport", "rse"] as const;

/** Les bornes d'un mot, accents compris : `\b` ne connaît que l'ASCII. */
const mot = (source: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, "giu");

const MOIS = "janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre";
const SAISONS = "été|hiver|hivernale?s?|printemps|automne|automnale?s?|estivale?s?|estivaux";
const FETES = "noël|pâques|toussaint|réveillon|nouvel an|après-noël";
const AUTRES = "rentrée|soldes|vacances|fin d'année|début d'année";
const CALENDRIER = mot(`${MOIS}|${SAISONS}|${FETES}|${AUTRES}`);

/**
 * « été » est aussi le participe d'« être » : « a été payé », « l'a été », « ont
 * déjà été ». Un « été » précédé d'une forme d'« avoir » (deux mots au plus entre
 * les deux) est un participe et ne date rien.
 */
const PARTICIPE = mot(
  "(?:a|ont|ai|as|avons|avez|avait|avaient|aura|auront|aurait|auraient|ayant|avoir|eût)(?:\\s+[\\p{L}'’]+){0,2}\\s+été",
);

/** Les mots du calendrier d'un texte, participes d'« être » retirés. */
const motsDuCalendrier = (t: string): string[] =>
  [...t.replace(PARTICIPE, "").matchAll(CALENDRIER)].map((m) => m[0].toLowerCase());

/**
 * LES MOTS QUI RESTENT À JUSTE TITRE, un par un, avec leur raison : clé
 * « code de la situation ou du courrier », valeur : mot → raison. Vide : aucun
 * mot du calendrier ne reste au mois ni à l'année dans le groupe.
 */
const EXCEPTIONS: Record<string, Record<string, string>> = {};

const retenus = (code: string, t: string) => motsDuCalendrier(t).filter((m) => !EXCEPTIONS[code]?.[m]);

/** Les textes de chaque situation du groupe, à une durée. */
function situations(periodicity: Periodicity): { code: string; textes: string[] }[] {
  return SCENARIOS.flatMap((s) =>
    scenarioByCode(s).situations.map((def) => ({
      code: `${s}/${def.code}`,
      textes: textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity])),
    })),
  );
}

const liasse = (code: string) => {
  const l = LIASSES.find((x) => x.code === code);
  if (!l) throw new Error(`liasse ${code} absente`);
  return l.courriers;
};

/** Les textes de chaque courrier du groupe à une durée, variantes sans assurance comprises. */
function courriers(periodicity: Periodicity): { code: string; textes: string[] }[] {
  const jours = PERIODICITY_DAYS[periodicity];
  return CODES_DES_LIASSES.flatMap((l) =>
    liasse(l).flatMap((c) => [
      { code: c.code, textes: textesDuCourrier(courrierALaDuree(c, jours)) },
      ...(VARIANTES_SANS_ASSURANCE[c.code]
        ? [{ code: c.code, textes: textesDuCourrier(courrierDeLaPartie(c.code, { jours, assurance: false })!) }]
        : []),
    ]),
  );
}

describe("le récit des saisons, au mois et à l'année (fitness, nova, nova-gamme, batiment, transport)", () => {
  it("le repérage voit les mots du calendrier, et laisse le participe d'« être »", () => {
    expect(motsDuCalendrier("Juillet. Le creux de l'été, puis la rentrée et Noël.")).toEqual([
      "juillet", "été", "rentrée", "noël",
    ]);
    expect(motsDuCalendrier("Les composants ont été payés ; une partie l'a été ; le stock a déjà été payé.")).toEqual([]);
    expect(motsDuCalendrier("La caisse pleine d'après-Noël, avant le pic de fin d'année.")).toEqual([
      "après-noël", "fin d'année",
    ]);
    // « mais », « marsupial », « saison » ne sont pas des mots du calendrier.
    expect(motsDuCalendrier("mais la saison haute, une saison difficile")).toEqual([]);
  });

  for (const periodicity of DUREES_REECRITES) {
    it(`${NOM[periodicity]}, aucune situation ne nomme un moment du calendrier`, () => {
      const restes = situations(periodicity).flatMap(({ code, textes }) =>
        textes.flatMap((t) => retenus(code.split("/")[1]!, t).map((m) => `${code} : « ${m} » dans « ${t} »`)),
      );
      expect(restes).toEqual([]);
    });

    it(`${NOM[periodicity]}, aucun courrier ne nomme un moment du calendrier`, () => {
      const restes = courriers(periodicity).flatMap(({ code, textes }) =>
        textes.flatMap((t) => retenus(code, t).map((m) => `${code} : « ${m} » dans « ${t} »`)),
      );
      expect(restes).toEqual([]);
    });

    it(`${NOM[periodicity]}, aucun jeton n'atteint l'écran`, () => {
      for (const { code, textes } of [...situations(periodicity), ...courriers(periodicity)]) {
        for (const t of textes) expect(t, code).not.toMatch(/\{\{|\}\}/);
      }
    });
  }

  it("chaque exception sert encore : un mot qu'aucun texte ne porte plus sort de la liste", () => {
    const vus = new Set<string>();
    for (const periodicity of DUREES_REECRITES) {
      for (const { code, textes } of [...situations(periodicity), ...courriers(periodicity)]) {
        const cle = code.includes("/") ? code.split("/")[1]! : code;
        for (const t of textes) for (const m of motsDuCalendrier(t)) if (EXCEPTIONS[cle]?.[m]) vus.add(`${cle}:${m}`);
      }
    }
    const declarees = Object.entries(EXCEPTIONS).flatMap(([c, ms]) => Object.keys(ms).map((m) => `${c}:${m}`));
    expect(declarees.filter((e) => !vus.has(e))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Au trimestre, rien ne change
// ---------------------------------------------------------------------------

const fixture = <T>(nom: string): T =>
  JSON.parse(readFileSync(new URL(`../fixtures/${nom}`, import.meta.url), "utf-8")) as T;

const AVANT_FITNESS = fixture<Record<string, string[]>>("situations-fitness-au-trimestre.json");
const AVANT_NOVA = fixture<Record<string, string[]>>("situations-nova-courriers-au-trimestre.json");
const AVANT_BATIMENT = fixture<Record<string, Record<string, string[]>>>(
  "situations-batiment-boutique-ecommerce-au-trimestre.json",
).batiment!;
const AVANT_TRANSPORT = fixture<Record<string, string[]>>("situations-transport-bistrot-au-trimestre.json");
const AVANT_COURRIERS = fixture<Record<string, string[]>>("courriers-au-trimestre.json");

/**
 * Les corrections que les gardes de durée ont déjà nommées sur ces relevés, et
 * seulement elles (tests/scenarios/textes-a-la-duree-batiment-boutique-ecommerce.test.ts
 * et textes-a-la-duree-transport-bistrot.test.ts, où chacune est justifiée).
 * Elles ne touchent aucun mot du calendrier. S'y ajoutent les corrections des
 * dates fausses au trimestre même (décision du propriétaire), nommées une fois
 * pour toutes dans `corrections-des-dates.ts` : « février » au tour 2 de
 * batiment_t2_devis, « la fin d'année » au tour 5 de nova_inv_retournement, et
 * les situations détectées, qui tombent à n'importe quel tour.
 */
const CORRECTIONS: Record<string, [string, string][]> = {
  batiment_t1_marge: [
    ["54 % de capacité", "66 % de capacité"],
    ["dépasser les 810 m²", "dépasser les 990 m²"],
  ],
  transport_t1_revient: [["Vous reprenez ROUTE & CIE : sept porteurs,", "Vous reprenez ROUTE & CIE : cinq véhicules,"]],
  transport_t6_contrat_refuse: [
    ["deux mille huit cents palettes", "quatre mille palettes"],
    ["mille quatre cents palettes", "deux mille palettes"],
    ["mille cent vingt", "mille six cents"],
    ["44 800 €", "64 000 €"],
    ["59 360 €", "84 800 €"],
    ["14 560 €", "20 800 €"],
    ["emmène 845 palettes", "emmène 1 208 palettes"],
  ],
};

const corrige = (code: string, textes: string[]) =>
  corrigerLesDates(
    code,
    textes.map((t) => (CORRECTIONS[code] ?? []).reduce((acc, [avant, apres]) => acc.split(avant).join(apres), t)),
  );

const RELEVES: Record<(typeof SCENARIOS)[number], Record<string, string[]>> = {
  fitness: AVANT_FITNESS,
  nova: AVANT_NOVA,
  "nova-gamme": AVANT_NOVA,
  batiment: AVANT_BATIMENT,
  transport: AVANT_TRANSPORT,
};

describe("au trimestre, le texte du groupe est octet pour octet celui des relevés", () => {
  for (const s of SCENARIOS) {
    it(`les situations de ${s}`, () => {
      for (const def of scenarioByCode(s).situations) {
        const attendu = RELEVES[s][def.code];
        expect(attendu, `${s}/${def.code} absent du relevé`).toBeDefined();
        expect(textesDe(situationDeLaPartie(def, 90)), def.code).toEqual(corrige(def.code, attendu!));
        expect(textesDe(def), def.code).toEqual(corrige(def.code, attendu!));
      }
    });
  }

  for (const l of CODES_DES_LIASSES) {
    it(`la liasse ${l}`, () => {
      for (const c of liasse(l)) {
        expect(textesDuCourrier(courrierALaDuree(c, 90)), c.code).toEqual(corrigerLesDates(c.code, AVANT_COURRIERS[c.code]!));
        expect(textesDuCourrier(c), c.code).toEqual(corrigerLesDates(c.code, AVANT_COURRIERS[c.code]!));
        if (VARIANTES_SANS_ASSURANCE[c.code]) {
          const cle = `${c.code} (sans assurance)`;
          expect(textesDuCourrier(courrierDeLaPartie(c.code, { jours: 90, assurance: false })!), cle).toEqual(
            corrigerLesDates(cle, AVANT_COURRIERS[cle]!),
          );
        }
      }
    });
  }
});
